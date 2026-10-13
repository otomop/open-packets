import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));
const compiled = new Map();
export function runtime(stubs = {}, initial = {}) {
  const data = new Map(Object.entries(initial));
  const timers = new Map();
  const writes = [];
  let nextTimer = 1;
  let failWrites = false;
  const events = () => {
    const handlers = new Map();
    return {
      addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); },
      removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
      dispatch(type, values = {}) { for (const fn of handlers.get(type) ?? []) fn({ type, ...values }); },
      listenerCount(type) { return handlers.get(type)?.size ?? 0; },
    };
  };
  const window = { ...events(), setTimeout(fn) { const id = nextTimer++; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); }, setInterval() { return nextTimer++; }, clearInterval() {}, scrollTo() {} };
  const document = { ...events(), visibilityState: "visible", querySelector() { return null; }, documentElement: { setAttribute() {}, removeAttribute() {} } };
  const localStorage = { getItem(key) { return data.get(key) ?? null; }, setItem(key, value) { if (failWrites) throw new Error("Quota exceeded"); writes.push(key); data.set(key, String(value)); } };
  const hooks = [];
  let hook = 0;
  let external;
  const react = {
    Fragment: "Fragment",
    useRef(value) { const i = hook++; return hooks[i] ??= { current: value }; },
    useState(value) { const i = hook++; if (!(i in hooks)) hooks[i] = typeof value === "function" ? value() : value; return [hooks[i], v => { hooks[i] = typeof v === "function" ? v(hooks[i]) : v; }]; },
    useMemo(fn) { return fn(); },
    useCallback(fn) { return fn; },
    useEffect(fn) { fn(); },
    useSyncExternalStore(subscribe, snapshot) { external = { subscribe, snapshot }; return snapshot(); },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const context = vm.createContext({ console, window, document, localStorage, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, setInterval: window.setInterval, clearInterval: window.clearInterval, crypto: { randomUUID: () => "test-attempt" }, Date });
  const cache = new Map();
  function load(relative) {
    const absolute = path.resolve(root, relative);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    let code = compiled.get(absolute);
    if (!code) {
      code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
      compiled.set(absolute, code);
    }
    const module = { exports: {} };
    cache.set(absolute, module);
    const require = spec => {
      if (spec in stubs) return stubs[spec];
      if (spec.endsWith(".css")) return {};
      if (spec === "react") return react;
      if (spec === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "Fragment" };
      const base = spec.startsWith("@/") ? path.join(root, "src", spec.slice(2)) : path.resolve(path.dirname(absolute), spec);
      const file = [base, base + ".ts", base + ".tsx"].find(f => fs.existsSync(f) && fs.statSync(f).isFile());
      if (!file) throw new Error(`Unstubbed import ${spec} in ${relative}`);
      return load(file);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context, { filename: absolute })(require, module, module.exports);
    return module.exports;
  }
  return { load, data, writes, window, document, timers, get external() { return external; }, setFailWrites(value) { failWrites = value; }, render(fn) { hook = 0; return fn(); }, resetHooks() { hooks.length = 0; hook = 0; } };
}

export const plain = value => JSON.parse(JSON.stringify(value));
