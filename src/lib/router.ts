import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "./store";

export interface Route {
  path: string; // e.g. "chapter"
  parts: string[]; // remaining segments
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "").split("#")[0];
  const [pathPart, queryPart] = raw.split("?");
  const segs = pathPart.split("/").filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  return { path: segs[0] ?? "", parts: segs.slice(1), query: new URLSearchParams(queryPart ?? "") };
}

let current = parse();
const listeners = new Set<() => void>();

type VT = { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void>; skipTransition: () => void };
let activeTransition: VT | null = null;
let navigationVersion = 0;
let pendingAnchorHash: string | null = null;
let cancelPendingAnchor: (() => void) | null = null;

window.addEventListener("hashchange", () => {
  const version = ++navigationVersion;
  if (pendingAnchorHash !== window.location.hash) cancelPendingAnchor?.();
  const prev = current;
  const next = parse();
  const samePage = prev.path === next.path && prev.parts.length === next.parts.length && prev.parts.every((part, i) => part === next.parts[i]);
  const swap = () => {
    // A transition callback can arrive after a later navigation has already rendered.
    if (version !== navigationVersion) return;
    current = next;
    flushSync(() => {
      for (const l of listeners) l();
    });
    if (!samePage) window.scrollTo({ top: 0 });
  };
  if (activeTransition) {
    activeTransition.skipTransition();
    swap();
    return;
  }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
  const animate =
    !!doc.startViewTransition &&
    !prefersReducedMotion() &&
    prev.path !== next.path &&
    document.visibilityState === "visible" &&
    !document.querySelector("dialog[open], .palette-backdrop") &&
    activeTransition === null;
  if (!animate) {
    swap();
    return;
  }
  // Only one animation runs at a time; newer navigation always takes precedence.
  const t = doc.startViewTransition!(swap);
  activeTransition = t;
  const clear = () => {
    if (activeTransition === t) activeTransition = null;
  };
  t.finished.then(clear, clear);
  t.ready.catch(() => {});
  t.updateCallbackDone.catch(() => {});
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() { return current; }

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Wait for an asynchronously loaded destination, rather than guessing when its content will exist. */
export function navigateToAnchor(routeHash: string, elementId: string, chapterId?: string) {
  cancelPendingAnchor?.();
  window.location.hash = routeHash.replace(/^#/, "");
  const targetHash = window.location.hash;
  let frame = 0;
  let stopped = false;
  const cancel = () => {
    stopped = true;
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (cancelPendingAnchor === cancel) {
      cancelPendingAnchor = null;
      pendingAnchorHash = null;
    }
  };
  const check = () => {
    frame = 0;
    if (stopped) return;
    if (window.location.hash !== targetHash) { cancel(); return; }
    const el = document.getElementById(elementId);
    if (!el || (chapterId && el.closest("[data-chapter-id]")?.getAttribute("data-chapter-id") !== chapterId)) return;
    cancel();
    el.scrollIntoView({ block: "start" });
    if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
    el.focus({ preventScroll: true });
  };
  const schedule = () => { if (!frame && !stopped) frame = requestAnimationFrame(check); };
  const observer = new MutationObserver(schedule);
  observer.observe(document.getElementById("main") ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-chapter-id", "id"] });
  pendingAnchorHash = targetHash;
  cancelPendingAnchor = cancel;
  schedule();
}

export function href(...segs: (string | number)[]): string {
  return "#/" + segs.map((s) => encodeURIComponent(String(s))).join("/");
}

export function navigate(...segs: (string | number)[]) {
  const target = href(...segs);
  if (window.location.hash === target) return;
  window.location.hash = target;
}

export function chapterHref(id: string, tab?: string) {
  return tab ? href("chapter", id, tab) : href("chapter", id);
}
