import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../src/components/Shell.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const MOBILE_QUERY = "(max-width: 800px)";

// Effects run after refs are attached, retain their dependency lists, and clean up
// on updates. Browser events and timers are driven explicitly; no elapsed-time sleeps.
function harness({ navMode = "click", navCollapsed = false, mobile = false, fineHover = true } = {}) {
  const progress = { settings: { navMode, navCollapsed, showTicker: false, track: "v2" } };
  const patches = [];
  let route = { path: "", parts: [], query: new URLSearchParams() };
  let media = { mobile, fineHover };
  let dirty = true;
  let cursor = 0;
  let now = 0;
  let nextTimer = 1;
  let tree;
  const hooks = [];
  const effects = [];
  const timers = new Map();
  const listeners = new Map();
  const elements = new Map();
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const effect = (callback, dependencies) => {
    const i = cursor++;
    if (!sameDeps(hooks[i]?.dependencies, dependencies)) effects.push({ i, callback, dependencies });
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      hooks[i] ??= { value: typeof initial === "function" ? initial() : initial };
      return [hooks[i].value, next => {
        const value = typeof next === "function" ? next(hooks[i].value) : next;
        if (!Object.is(value, hooks[i].value)) { hooks[i].value = value; dirty = true; }
      }];
    },
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
    useEffect: effect,
    useLayoutEffect: effect,
    useMemo(callback) { cursor++; return callback(); },
    useCallback(callback) { cursor++; return callback; },
  };
  class Element {
    constructor(key) { this.key = key; this.children = []; this.style = {}; this.classList = { add() {}, remove() {} }; }
    contains(other) { for (let current = other; current; current = current.parent) if (current === this) return true; return false; }
    focus() { focus(this); }
    matches(selector) { return selector === ":hover" && this.hovered; }
    querySelectorAll() { return [...elements.values()].filter(element => element !== this && this.contains(element) && element.tagName === "A"); }
    querySelector(selector) { const links = this.querySelectorAll(); return selector.includes("aria-current") ? links.find(link => link.props["aria-current"] === "page") ?? null : links[0] ?? null; }
  }
  const document = { activeElement: null, documentElement: { style: { overflow: "", scrollbarGutter: "" }, clientWidth: 1280 }, body: new Element("body"), querySelector: () => null };
  const matchMedia = query => ({ matches: query === MOBILE_QUERY ? media.mobile : media.fineHover, addEventListener() {}, removeEventListener() {} });
  const window = {
    innerWidth: 1280, scrollY: 0, matchMedia,
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
    setTimeout(callback, delay = 0) { const id = nextTimer++; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const updateSettings = patch => { patches.push({ ...patch }); progress.settings = { ...progress.settings, ...patch }; dirty = true; };
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@/lib/course": { chapters: [], objectiveText: new Map() },
    "@/lib/router": { href: (...parts) => "#/" + parts.join("/"), navigate() {}, navigateToAnchor() {}, useRoute: () => route },
    "@/lib/store": { getProgress: () => progress, updateSettings, useProgress: selector => selector(progress) },
    "@/lib/plan": { continueChapter: () => null, daysToExam: () => null, streak: () => 0, trackLabel: () => "CCNA v2.0" },
    "@/lib/mastery": { domainMastery: () => [] },
    "@/lib/useMedia": { MOBILE_QUERY, useMedia: query => matchMedia(query).matches },
    "./ui": { Kbd: () => null },
    "./ExamDate": { ExamDateDialog: () => null },
  };
  const module = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    console, window, document, matchMedia, HTMLElement: Element, Node: Element,
    getComputedStyle: () => ({ transform: "none" }),
    requestAnimationFrame: callback => window.setTimeout(callback, 16),
    cancelAnimationFrame: window.clearTimeout,
    setTimeout: window.setTimeout, clearTimeout: window.clearTimeout,
  })(name => { assert.ok(name in modules, `Unexpected Shell dependency: ${name}`); return modules[name]; }, module, module.exports);

  function commit(node, parent = null, key = "root") {
    if (node == null || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach((child, i) => commit(child, parent, `${key}/${i}`)); return; }
    if (typeof node.type !== "string") return;
    const identity = node.props.id ?? (node.props.className === "nav-toggle" ? "toggle" : node.type === "a" ? `${key}:${node.props.href}` : key);
    const element = elements.get(identity) ?? new Element(identity);
    elements.set(identity, element);
    element.props = node.props; element.parent = parent; element.tagName = node.type.toUpperCase();
    if (node.props.ref) node.props.ref.current = element;
    commit(node.props.children, element, key + "/children");
  }
  function render() {
    dirty = true;
    let passes = 0;
    while (dirty) {
      assert.ok(++passes < 20, "Shell effects must settle");
      dirty = false; cursor = 0;
      tree = module.exports.default({ children: "Study content" });
      commit(tree);
      for (const pending of effects.splice(0)) {
        hooks[pending.i]?.cleanup?.();
        hooks[pending.i] = { dependencies: pending.dependencies, cleanup: pending.callback() };
      }
    }
    return tree;
  }
  function bubble(element, handler, event) {
    for (let current = element; current && !event.stopped; current = current.parent) {
      event.currentTarget = current;
      current.props?.[handler]?.(event);
    }
  }
  function focus(next) {
    if (document.activeElement === next) return;
    const previous = document.activeElement;
    document.activeElement = next;
    if (previous) bubble(previous, "onBlur", { target: previous, relatedTarget: next });
    if (next) bubble(next, "onFocus", { target: next, relatedTarget: previous });
  }
  const element = name => { const result = elements.get(name === "nav" ? "sidenav" : name); assert.ok(result, `Missing ${name}`); return result; };
  const advance = milliseconds => {
    const until = now + milliseconds;
    let count = 0;
    while (true) {
      const pending = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!pending) break;
      assert.ok(++count < 100, "Timer queue must settle");
      now = pending[1].at; timers.delete(pending[0]); pending[1].callback(); render();
    }
    now = until;
  };
  render();
  return {
    patches, progress, document, timers, listeners, render, advance,
    get tree() { return tree; },
    get open() { return element("toggle").props["aria-expanded"]; },
    get navInert() { return element("nav").props.inert; },
    get mainInert() { return element("main").props.inert; },
    get focusKey() { return document.activeElement?.key; },
    element,
    pointer(kind, name, pointerType = "mouse") {
      const target = element(name); target.hovered = kind === "enter";
      target.props[kind === "enter" ? "onPointerEnter" : "onPointerLeave"]?.({ pointerType, target, currentTarget: target });
      render();
    },
    clickToggle(detail = 1) { const target = element("toggle"); focus(target); target.props.onClick({ target, currentTarget: target, detail }); render(); },
    focusNav() { focus(element("nav").querySelector("a[aria-current='page']")); render(); },
    focusMain() { focus(element("main")); render(); },
    key(key, target = document.activeElement ?? document.body, extra = {}) {
      const event = { key, target, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...extra };
      bubble(target, "onKeyDown", event);
      if (!event.stopped) for (const callback of [...listeners.get("keydown") ?? []]) callback(event);
      render();
      return event;
    },
    route(path, parts = [], query = "") { route = { path, parts, query: new URLSearchParams(query) }; render(); },
    settings(patch) { progress.settings = { ...progress.settings, ...patch }; render(); },
    media(patch) { media = { ...media, ...patch }; render(); },
    unmount() { for (const hook of hooks) hook?.cleanup?.(); },
  };
}

test("click mode uses the saved desktop state and never opens on pointer entry", () => {
  const h = harness({ navCollapsed: true });
  assert.equal(h.open, false);
  assert.equal(h.navInert, true);
  h.pointer("enter", "toggle");
  assert.equal(h.open, false);
  h.clickToggle();
  assert.equal(h.open, true);
  assert.deepEqual(h.patches, [{ navCollapsed: false }]);
  h.pointer("leave", "toggle"); h.advance(1000);
  assert.equal(h.open, true);
  h.clickToggle();
  assert.equal(h.open, false);
  assert.deepEqual(h.patches, [{ navCollapsed: false }, { navCollapsed: true }]);
});

test("hover mode opens temporarily, bridges the trigger-to-menu gap, and closes after grace", () => {
  const h = harness({ navMode: "hover", navCollapsed: false });
  assert.equal(h.open, false, "Hover mode does not restore a permanently expanded column");
  h.pointer("enter", "toggle");
  assert.equal(h.open, true);
  assert.equal(h.navInert, false);
  assert.equal(h.mainInert, false, "Desktop hover is not a modal drawer");
  h.pointer("leave", "toggle"); h.advance(100);
  assert.equal(h.open, true, "Moving from the trigger toward the menu has a grace period");
  h.pointer("enter", "nav"); h.advance(500);
  assert.equal(h.open, true, "Entering the menu cancels the pending close");
  h.pointer("leave", "nav"); h.advance(100);
  assert.equal(h.open, true);
  h.advance(100);
  assert.equal(h.open, false);
  assert.equal(h.navInert, true);
  assert.deepEqual(h.patches, [], "Pointer movement must not write persistent settings");
});

test("keyboard focus inside the hover menu protects it until focus leaves", () => {
  const h = harness({ navMode: "hover" });
  h.pointer("enter", "toggle"); h.focusNav();
  h.pointer("leave", "toggle"); h.advance(1000);
  assert.equal(h.open, true);
  assert.ok(h.element("nav").contains(h.document.activeElement));
  h.focusMain(); h.advance(200);
  assert.equal(h.open, false);
  assert.equal(h.focusKey, "main");
  assert.deepEqual(h.patches, []);
});

test("Escape closes the hover menu, restores visible focus, and cancels pending timers", () => {
  const h = harness({ navMode: "hover" });
  h.pointer("enter", "toggle"); h.focusNav(); h.pointer("leave", "toggle");
  h.key("Escape");
  assert.equal(h.open, false);
  assert.equal(h.focusKey, "toggle");
  h.advance(1000);
  assert.equal(h.open, false);
  assert.deepEqual(h.patches, []);
});

test("hover mode remains usable through the menu button, m shortcut, and ArrowDown", () => {
  const h = harness({ navMode: "hover" });
  h.clickToggle(); h.advance(20);
  assert.equal(h.open, true);
  h.key("Escape");
  h.clickToggle(0); h.advance(20);
  assert.equal(h.open, true);
  assert.ok(h.element("nav").contains(h.document.activeElement), "Keyboard button activation enters the menu");
  h.key("Escape");
  h.key("m"); h.advance(20);
  assert.equal(h.open, true);
  assert.ok(h.element("nav").contains(h.document.activeElement));
  h.key("Escape");
  h.key("ArrowDown", h.element("toggle")); h.advance(20);
  assert.equal(h.open, true);
  assert.ok(h.element("nav").contains(h.document.activeElement));
  assert.deepEqual(h.patches, []);
});

test("navigation and mode changes clear temporary hover state without changing the click preference", () => {
  const h = harness({ navMode: "hover", navCollapsed: true });
  h.pointer("enter", "toggle"); h.pointer("leave", "toggle");
  h.route("chapter", ["ipv4-addressing", "learn"]);
  assert.equal(h.open, false);
  h.advance(1000);
  h.pointer("enter", "toggle");
  assert.equal(h.open, true);
  h.route("chapter", ["ipv4-addressing", "learn"], "section=address-types");
  assert.equal(h.open, false, "Section navigation also clears the temporary menu");
  h.pointer("enter", "toggle");
  h.settings({ navMode: "click" });
  assert.equal(h.open, false);
  h.settings({ navMode: "hover" });
  assert.equal(h.open, false);
  assert.deepEqual(h.patches, []);
});

test("typing and modifier shortcuts do not unexpectedly open the hover menu", () => {
  const h = harness({ navMode: "hover" });
  for (const target of [{ tagName: "INPUT" }, { tagName: "TEXTAREA" }, { tagName: "SELECT" }, { isContentEditable: true }]) {
    h.key("m", target);
    assert.equal(h.open, false);
  }
  for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
    h.key("m", undefined, { [modifier]: true });
    assert.equal(h.open, false);
  }
  assert.deepEqual(h.patches, []);
});

test("touch and coarse-pointer desktops keep click behavior even with Hover selected", () => {
  const h = harness({ navMode: "hover", navCollapsed: true, fineHover: false });
  h.pointer("enter", "toggle", "touch");
  assert.equal(h.open, false);
  h.clickToggle();
  assert.equal(h.open, true);
  assert.deepEqual(h.patches, [{ navCollapsed: false }]);
  h.pointer("leave", "toggle", "touch"); h.advance(1000);
  assert.equal(h.open, true);
  h.media({ fineHover: true });
  assert.equal(h.open, false, "Regaining hover support starts with a closed temporary menu");
  h.pointer("enter", "toggle", "touch");
  assert.equal(h.open, false, "Touch events must not trigger hover on hybrid devices");
  h.settings({ navCollapsed: true });
  h.pointer("enter", "toggle");
  assert.equal(h.open, true);
  h.media({ fineHover: false });
  assert.equal(h.open, false, "Losing hover support restores the saved collapsed click state");
  h.media({ fineHover: true });
  assert.equal(h.open, false);
});

test("mobile uses a modal click drawer and breakpoint changes clear temporary menus", () => {
  const h = harness({ navMode: "hover", navCollapsed: true });
  h.pointer("enter", "toggle");
  assert.equal(h.open, true);
  h.media({ mobile: true });
  assert.equal(h.open, false);
  h.pointer("enter", "toggle");
  assert.equal(h.open, false);
  h.clickToggle();
  assert.equal(h.open, true);
  assert.equal(h.mainInert, true);
  assert.equal(h.document.documentElement.style.overflow, "hidden");
  h.key("Escape");
  assert.equal(h.open, false);
  assert.equal(h.mainInert, false);
  assert.equal(h.document.documentElement.style.overflow, "");
  h.clickToggle(); h.media({ mobile: false });
  assert.equal(h.open, false);
  assert.equal(h.document.documentElement.style.overflow, "");
  assert.deepEqual(h.patches, []);
});

test("unmount removes keyboard listeners and pending hover-close work", () => {
  const h = harness({ navMode: "hover" });
  h.pointer("enter", "toggle"); h.pointer("leave", "toggle");
  assert.ok(h.timers.size > 0);
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.get("keydown")?.size ?? 0, 0);
  assert.deepEqual(h.patches, []);
});
