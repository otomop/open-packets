import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Attempt, Progress, Settings } from "./types";

const KEY = "ccna.progress.v1";

export const defaultSettings: Settings = {
  track: "v2",
  examDate: "",
  hoursPerWeek: 6,
  theme: "system",
  motion: "system",
  newCardsPerDay: 20,
  gateCards: true,
  name: "",
  onboarded: false,
  showTicker: true,
  navCollapsed: false,
  toolsCollapsed: false,
};

function fresh(): Progress {
  return {
    v: 1,
    settings: { ...defaultSettings },
    chapters: {},
    questions: {},
    attempts: [],
    cards: {},
    drills: {},
    tickets: {},
    activity: {},
    subnet: { attempts: 0, correct: 0, byMode: {} },
    createdAt: new Date().toISOString(),
  };
}

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 160): v is string => typeof v === "string" && v.length <= max;
const number = (v: unknown, min = 0, max = 1e9): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const integer = (v: unknown, min = 0, max = 1e9): v is number => number(v, min, max) && Number.isInteger(v);
const date = (v: unknown): v is string => {
  if (!text(v, 64) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)) return false;
  const parsed = new Date(v);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 19) === v.slice(0, 19);
};
const optional = (v: unknown, test: (v: unknown) => boolean) => v === undefined || test(v);
const bool = (v: unknown) => typeof v === "boolean";
const keys = (v: RecordValue, allowed: string[]) => Object.keys(v).every(k => allowed.includes(k));
const safeKey = (k: string) => k.length > 0 && k.length <= 160 && !["__proto__", "constructor", "prototype"].includes(k);
const strings = (v: unknown) => Array.isArray(v) && v.length <= 2000 && v.every(x => text(x)) && new Set(v).size === v.length;
function dictionary(v: unknown, test: (value: unknown) => boolean) {
  return record(v) && Object.keys(v).length <= 20000 && Object.entries(v).every(([k, value]) => safeKey(k) && test(value));
}
function calendarDate(v: unknown) {
  if (v === "") return true;
  if (!text(v, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const parsed = new Date(v + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
}
function validSettings(v: unknown) {
  if (!record(v) || !keys(v, Object.keys(defaultSettings))) return false;
  return optional(v.track, x => x === "v1" || x === "v2") && optional(v.examDate, calendarDate)
    && optional(v.hoursPerWeek, x => number(x, 1, 60)) && optional(v.theme, x => typeof x === "string" && ["system", "dark", "light"].includes(x))
    && optional(v.motion, x => typeof x === "string" && ["system", "full", "reduced"].includes(x)) && optional(v.newCardsPerDay, x => integer(x, 0, 200))
    && optional(v.name, x => text(x, 10000)) && ["gateCards", "onboarded", "showTicker", "navCollapsed", "toolsCollapsed"].every(k => optional(v[k], bool));
}
function validChapter(v: unknown) {
  if (!record(v) || !keys(v, ["opened", "sectionsDone", "stepsDone", "labDone", "completed", "notes", "checkpoint"])) return false;
  return optional(v.opened, date) && strings(v.sectionsDone) && strings(v.stepsDone) && optional(v.labDone, bool) && optional(v.completed, bool)
    && optional(v.notes, x => text(x, 1_000_000)) && optional(v.checkpoint, x => record(x) && keys(x, ["date", "score", "total"]) && date(x.date) && integer(x.score) && integer(x.total) && x.score <= x.total);
}
function validQuestion(v: unknown) {
  return record(v) && keys(v, ["seen", "correct", "last", "lastCorrect", "history"]) && integer(v.seen) && integer(v.correct) && v.correct <= v.seen
    && date(v.last) && bool(v.lastCorrect) && text(v.history, 12) && /^[cw]*$/.test(v.history);
}
function validCard(v: unknown) {
  return record(v) && keys(v, ["due", "interval", "ease", "reps", "lapses", "last", "introducedAt"]) && date(v.due) && date(v.last)
    && integer(v.interval, 0, 60) && number(v.ease, 1.3, 10000) && integer(v.reps) && integer(v.lapses) && optional(v.introducedAt, date);
}
function validAttempt(v: unknown) {
  if (!record(v) || !keys(v, ["id", "date", "mode", "scope", "score", "total", "questionIds", "answers", "durationSec"])) return false;
  return text(v.id) && date(v.date) && typeof v.mode === "string" && ["quick", "focus", "exam", "mistakes"].includes(v.mode) && text(v.scope, 300)
    && integer(v.score) && integer(v.total, 1, 2000) && v.score <= v.total && strings(v.questionIds) && (v.questionIds as string[]).length === v.total
    && dictionary(v.answers, a => Array.isArray(a) && a.length <= 100 && a.every(x => integer(x, 0, 100)) && new Set(a).size === a.length)
    && Object.keys(v.answers as object).every(id => (v.questionIds as string[]).includes(id)) && integer(v.durationSec);
}
/** Validate before replacing either the in-memory state or the last saved export. */
export function parseProgress(json: string): Progress {
  if (json.length > 8_000_000) throw new Error("The progress file is too large (maximum 8 MB).");
  const parsed: unknown = JSON.parse(json);
  if (!record(parsed) || parsed.v !== 1 || !keys(parsed, ["v", "settings", "chapters", "questions", "attempts", "cards", "drills", "tickets", "activity", "subnet", "createdAt"])) throw new Error("That file is not a supported OpenPackets progress export.");
  const valid = optional(parsed.settings, validSettings) && dictionary(parsed.chapters, validChapter)
    && optional(parsed.questions, x => dictionary(x, validQuestion))
    && optional(parsed.attempts, x => Array.isArray(x) && x.length <= 1000 && x.every(validAttempt))
    && optional(parsed.cards, x => dictionary(x, validCard))
    && optional(parsed.drills, x => dictionary(x, v => record(v) && keys(v, ["attempts", "correct", "last"]) && integer(v.attempts) && integer(v.correct) && v.correct <= v.attempts && date(v.last)))
    && optional(parsed.tickets, x => dictionary(x, v => record(v) && keys(v, ["correct", "date"]) && bool(v.correct) && date(v.date)))
    && optional(parsed.activity, x => record(x) && Object.keys(x).every(k => k !== "" && calendarDate(k)) && Object.values(x).every(v => number(v)))
    && optional(parsed.subnet, x => record(x) && keys(x, ["attempts", "correct", "byMode"]) && integer(x.attempts) && integer(x.correct) && x.correct <= x.attempts && dictionary(x.byMode, v => record(v) && keys(v, ["a", "c"]) && integer(v.a) && integer(v.c) && v.c <= v.a))
    && optional(parsed.createdAt, date);
  if (!valid) throw new Error("The progress file contains invalid settings or study records. Your existing progress was kept.");
  const base = fresh();
  return { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings as Partial<Settings> ?? {}) } } as Progress;
}

export type StorageStatus = { state: "saved" | "pending" | "error"; message: string | null };
let storageStatus: StorageStatus = { state: "saved", message: null };
const storageListeners = new Set<() => void>();
let blocked = false;
let dirty = false;
let persisted = "";
function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    try { const result = parseProgress(raw); persisted = raw; return result; }
    catch { blocked = true; storageStatus = { state: "error", message: "Saved progress could not be read. The original data has been kept. Import a valid backup or reset progress to start again." }; return fresh(); }
  } catch {
    storageStatus = { state: "error", message: "Browser storage is unavailable. Changes stay in memory; export a backup before closing this page." };
    return fresh();
  }
}
let state: Progress = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function setStorageStatus(next: StorageStatus) {
  if (storageStatus.state === next.state && storageStatus.message === next.message) return;
  storageStatus = next;
  for (const listener of storageListeners) listener();
}
export function flushProgress() {
  if (saveTimer !== undefined) window.clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!dirty || blocked) return;
  try {
    if ((localStorage.getItem(KEY) ?? "") !== persisted) {
      blocked = true;
      setStorageStatus({ state: "error", message: "Progress changed in another tab. Export this tab's progress before reloading, or import your chosen backup. Neither copy was overwritten." });
      return;
    }
    const json = JSON.stringify(state);
    if (json !== persisted) localStorage.setItem(KEY, json);
    persisted = json;
    dirty = false;
    setStorageStatus({ state: "saved", message: null });
  } catch {
    setStorageStatus({ state: "error", message: "Progress could not be saved in this browser. Your changes are still here; export a backup before closing this page." });
  }
}

function emit() {
  for (const l of listeners) l();
  dirty = true;
  if (!blocked) {
    if (storageStatus.state !== "error") setStorageStatus({ state: "pending", message: null });
    if (saveTimer !== undefined) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flushProgress, 250);
  }
}

export function getProgress(): Progress {
  return state;
}

/** Apply an immutable update. The updater receives a shallow-cloned draft; nested objects it touches must be cloned by it. */
export function update(fn: (draft: Progress) => Progress | void) {
  const draft: Progress = { ...state };
  const result = fn(draft);
  const next = result ?? draft;
  if (Object.keys(next).every(k => next[k as keyof Progress] === state[k as keyof Progress])) return;
  state = next;
  emit();
}

export function updateSettings(patch: Partial<Settings>) {
  if (Object.entries(patch).every(([k, value]) => state.settings[k as keyof Settings] === value)) return;
  update((d) => {
    d.settings = { ...d.settings, ...patch };
  });
  if (patch.theme !== undefined || patch.motion !== undefined) applyTheme();
}

export function updateChapter(id: string, patch: Partial<Progress["chapters"][string]>) {
  update((d) => {
    const prev = d.chapters[id] ?? { sectionsDone: [], stepsDone: [] };
    d.chapters = { ...d.chapters, [id]: { ...prev, ...patch } };
  });
}

export function toggleInList(id: string, field: "sectionsDone" | "stepsDone", item: string) {
  update((d) => {
    const prev = d.chapters[id] ?? { sectionsDone: [], stepsDone: [] };
    const list = prev[field] ?? [];
    const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    d.chapters = { ...d.chapters, [id]: { ...prev, [field]: next } };
  });
}

export function logActivity(minutes: number) {
  const day = localDateKey();
  update((d) => {
    d.activity = { ...d.activity, [day]: Math.round(((d.activity[day] ?? 0) + minutes) * 10) / 10 };
  });
}

export function recordQuestionResult(questionId: string, correct: boolean) {
  update(d => applyQuestionResults(d, [{ questionId, correct }]));
}
function applyQuestionResults(d: Progress, results: { questionId: string; correct: boolean }[]) {
  if (!results.length) return;
  const questions = { ...d.questions };
  const now = new Date().toISOString();
  for (const { questionId, correct } of results) {
    const prev = questions[questionId] ?? { seen: 0, correct: 0, last: "", lastCorrect: false, history: "" };
    questions[questionId] = { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0), last: now,
      lastCorrect: correct, history: (prev.history + (correct ? "c" : "w")).slice(-12) };
  }
  d.questions = questions;
}
/** Publish one atomic result so a timed session does not notify every subscriber once per question. */
export function recordPracticeAttempt(attempt: Attempt, results: { questionId: string; correct: boolean }[]) {
  update((d) => {
    if (d.attempts.some(a => a.id === attempt.id)) return;
    applyQuestionResults(d, results);
    d.attempts = [...d.attempts, attempt].slice(-100);
    const day = localDateKey();
    d.activity = { ...d.activity, [day]: Math.round(((d.activity[day] ?? 0) + Math.max(1, attempt.durationSec / 60)) * 10) / 10 };
  });
}

export function resetAll() {
  state = fresh();
  blocked = false;
  try { persisted = localStorage.getItem(KEY) ?? ""; } catch {}
  emit();
  flushProgress();
  applyTheme();
}

export function importProgress(json: string): string | null {
  try {
    const parsed = parseProgress(json);
    const serialized = JSON.stringify(parsed);
    localStorage.setItem(KEY, serialized);
    if (saveTimer !== undefined) window.clearTimeout(saveTimer);
    saveTimer = undefined;
    state = parsed;
    persisted = serialized;
    dirty = false;
    blocked = false;
    for (const listener of listeners) listener();
    setStorageStatus({ state: "saved", message: null });
    applyTheme();
    return null;
  } catch (e) {
    return "Could not import that file: " + (e as Error).message;
  }
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const subscribeStorage = (listener: () => void) => { storageListeners.add(listener); return () => storageListeners.delete(listener); };
const identity = (p: Progress) => p;
export function useProgress(): Progress;
export function useProgress<T>(selector: (p: Progress) => T, equal?: (a: T, b: T) => boolean): T;
export function useProgress<T = Progress>(selector: (p: Progress) => T = identity as (p: Progress) => T, equal: (a: T, b: T) => boolean = Object.is): T {
  const latest = useRef({ selector, equal });
  latest.current = { selector, equal };
  const cache = useRef<{ progress: Progress; selector: (p: Progress) => T; value: T } | null>(null);
  const snapshot = useCallback(() => {
    const current = latest.current;
    if (cache.current?.progress === state && cache.current.selector === current.selector) return cache.current.value;
    const value = current.selector(state);
    const stable = cache.current && current.equal(cache.current.value, value) ? cache.current.value : value;
    cache.current = { progress: state, selector: current.selector, value: stable };
    return stable;
  }, []);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
export function useStorageStatus(): StorageStatus {
  return useSyncExternalStore(subscribeStorage, () => storageStatus, () => storageStatus);
}

/** Reflect theme + motion settings on <html> (also read at boot by index.html). */
export function applyTheme() {
  const { theme, motion } = state.settings;
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  if (motion === "reduced" || motion === "full") root.setAttribute("data-motion", motion);
  else root.removeAttribute("data-motion");
  try {
    localStorage.setItem("ccna.theme", theme);
    localStorage.setItem("ccna.motion", motion);
  } catch {}
}

export function prefersReducedMotion(): boolean {
  if (state.settings.motion === "reduced") return true;
  if (state.settings.motion === "full") return false;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD in the user's own time zone (for date inputs and exam dates, which are calendar days, not instants). */
export function localDateKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

window.addEventListener("pagehide", flushProgress);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushProgress(); });
window.addEventListener("storage", (event) => {
  if (event.key !== KEY || event.newValue === persisted) return;
  if (dirty || blocked) {
    blocked = true;
    if (saveTimer !== undefined) window.clearTimeout(saveTimer);
    saveTimer = undefined;
    setStorageStatus({ state: "error", message: "Progress changed in another tab while this tab had unsaved changes. Export this tab's progress before reloading, or import your chosen backup. Neither copy was overwritten." });
    return;
  }
  try {
    state = event.newValue === null ? fresh() : parseProgress(event.newValue);
    persisted = event.newValue ?? "";
    for (const listener of listeners) listener();
    setStorageStatus({ state: "saved", message: null });
    applyTheme();
  } catch {
    blocked = true;
    setStorageStatus({ state: "error", message: "Another tab saved unreadable progress. This tab's copy has been kept; export it before reloading." });
  }
});
