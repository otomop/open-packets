import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../src/lib/router.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Control browser scheduling explicitly so delayed transitions and lazy content can
// be tested deterministically, without a browser, network access, or elapsed-time sleeps.
function harness(initial = "#/chapters", animated = false) {
  let hash = initial;
  let hashchange;
  let rafId = 0;
  const transitions = [];
  const scrolls = [];
  const frames = new Map();
  const observers = new Set();
  const elements = new Map([["main", {}]]);
  const location = {};
  Object.defineProperty(location, "hash", {
    get: () => hash,
    set: value => { hash = value.startsWith("#") ? value : "#" + value; },
  });
  const window = {
    location,
    addEventListener(name, callback) { if (name === "hashchange") hashchange = callback; },
    scrollTo(value) { scrolls.push(value); },
  };
  const document = {
    visibilityState: "visible",
    body: {},
    querySelector: () => null,
    getElementById: id => elements.get(id) ?? null,
  };
  if (animated) {
    document.startViewTransition = swap => {
      const record = { swap, skipped: false };
      transitions.push(record);
      return {
        finished: new Promise(() => {}),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition() { record.skipped = true; },
      };
    };
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.add(this); }
    observe() {}
    disconnect() { observers.delete(this); }
  }
  const exports = {};
  vm.runInNewContext(code, {
    exports, window, document, URLSearchParams, Promise, MutationObserver,
    requestAnimationFrame(callback) { frames.set(++rafId, callback); return rafId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    require(name) {
      if (name === "react") return { useSyncExternalStore: (_, get) => get() };
      if (name === "react-dom") return { flushSync: callback => callback() };
      if (name === "./store") return { prefersReducedMotion: () => false };
      throw new Error(`Unmocked router import: ${name}`);
    },
  }, { filename: "router-regression.js" });
  return {
    api: exports, transitions, scrolls, observers, elements,
    route: () => exports.useRoute(),
    hash: () => hash,
    navigate(next) { window.location.hash = next; hashchange(); },
    notify() { [...observers].forEach(observer => observer.callback()); },
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    element(chapter) {
      return {
        jumps: 0, focused: false, tabIndex: undefined,
        closest: () => ({ getAttribute: () => chapter }),
        hasAttribute: () => false,
        scrollIntoView() { this.jumps++; },
        focus(options) { this.focused = options.preventScroll; },
      };
    },
  };
}

test("a delayed transition cannot overwrite newer navigation", () => {
  const h = harness("#/chapters", true);
  h.navigate("#/practice");
  h.navigate("#/cards");
  h.transitions[0].swap();
  assert.equal(h.route().path, "cards");
  assert.equal(h.hash(), "#/cards");
  assert.equal(h.transitions[0].skipped, true);
});

test("changing chapter tabs resets the document scroll position", () => {
  const h = harness("#/chapter/example/learn");
  h.navigate("#/chapter/example/lab");
  assert.equal(h.scrolls.length, 1);
  assert.equal(h.scrolls[0].top, 0);
});

test("changing only the query preserves the document scroll position", () => {
  const h = harness("#/chapter/example/lab");
  h.navigate("#/chapter/example/lab?filter=all");
  assert.equal(h.scrolls.length, 0);
  assert.equal(h.route().query.get("filter"), "all");
});

test("a secondary section anchor is not part of the chapter ID", () => {
  const h = harness("#/chapter/example#section-a");
  assert.equal(h.route().parts[0], "example");
});

test("section navigation waits for the correct chapter and transfers focus", () => {
  const h = harness("#/chapter/old");
  const old = h.element("old");
  h.elements.set("s-topic", old);
  h.api.navigateToAnchor("#/chapter/new", "s-topic", "new");
  h.navigate("#/chapter/new");
  h.frame();
  assert.equal(old.jumps, 0);
  assert.equal(h.observers.size, 1);

  const target = h.element("new");
  h.elements.set("s-topic", target);
  h.notify();
  h.frame();
  assert.equal(target.jumps, 1);
  assert.equal(target.focused, true);
  assert.equal(target.tabIndex, -1);
  assert.equal(h.observers.size, 0);
});

test("navigating away cancels an obsolete pending section jump", () => {
  const h = harness();
  h.api.navigateToAnchor("#/chapter/slow", "s-topic", "slow");
  h.navigate("#/cards");
  const late = h.element("slow");
  h.elements.set("s-topic", late);
  h.notify();
  h.frame();
  assert.equal(late.jumps, 0);
  assert.equal(h.observers.size, 0);
});
