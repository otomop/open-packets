import test from "node:test";
import assert from "node:assert/strict";
import { runtime, plain } from "./runtime.mjs";

const KEY = "ccna.progress.v1";
const iso = "2026-09-19T12:00:00.000Z";
const loadStore = (initial = {}) => { const rt = runtime({}, initial); return { rt, store: rt.load("src/lib/store.ts") }; };

test("progress exports round-trip while malformed imports preserve memory and disk", () => {
  const { rt, store } = loadStore();
  store.updateChapter("routing", { notes: "keep this note", sectionsDone: ["intro"] });
  store.recordQuestionResult("q1", true);
  store.flushProgress();
  const before = store.getProgress();
  const saved = rt.data.get(KEY);
  const bad = [
    { v: 1, chapters: {}, settings: { track: "invalid" } },
    { ...plain(before), chapters: [] },
    { ...plain(before), chapters: { x: { sectionsDone: "oops", stepsDone: [] } } },
    { ...plain(before), questions: { q: { seen: 1, correct: 5, last: iso, lastCorrect: true, history: "c" } } },
    { ...plain(before), cards: { a: { due: "tomorrow", interval: 1, ease: 2.5, reps: 1, lapses: 0, last: iso } } },
    { ...plain(before), settings: { ...before.settings, newCardsPerDay: 1.5 } },
    { ...plain(before), settings: { ...before.settings, theme: ["dark"] } },
    { ...plain(before), createdAt: "2026-02-30T12:00:00.000Z" },
    { ...plain(before), attempts: [{ id: "x", date: iso, mode: "exam", scope: "", score: 1, total: 2, questionIds: ["q"], answers: {}, durationSec: 2 }] },
    { ...plain(before), activity: { "2026-02-30": 1 } },
    JSON.parse('{"v":1,"chapters":{"__proto__":{"sectionsDone":[],"stepsDone":[]}}}'),
  ];
  for (const candidate of bad) {
    assert.match(store.importProgress(JSON.stringify(candidate)), /Could not import/);
    assert.equal(store.getProgress(), before);
    assert.equal(rt.data.get(KEY), saved);
  }
  assert.match(store.importProgress("{"), /Could not import/);
  assert.equal(store.importProgress(store.exportProgress()), null);
  assert.deepEqual(plain(store.getProgress()), plain(before));
  assert.equal(store.importProgress('{"v":1,"chapters":{}}'), null, "older exports get default fields");
  assert.equal(store.getProgress().settings.track, "v2");
});

test("invalid stored data is not silently overwritten; explicit reset recovers", () => {
  const original = '{"v":1,"chapters":{},"settings":{"track":"bad"}}';
  const { rt, store } = loadStore({ [KEY]: original });
  assert.equal(store.useStorageStatus().state, "error");
  store.updateSettings({ name: "new" });
  store.flushProgress();
  assert.equal(rt.data.get(KEY), original);
  store.resetAll();
  assert.equal(JSON.parse(rt.data.get(KEY)).settings.track, "v2");
  assert.equal(store.useStorageStatus().state, "saved");
});

test("accent colors survive reload and export without changing study records; old backups keep blue", () => {
  const { rt, store } = loadStore();
  store.updateChapter("routing", { notes: "saved work", sectionsDone: ["intro"] });
  store.updateSettings({ accentColor: "#A012FE", onboarded: true });
  assert.equal(store.getProgress().settings.accentColor, "#a012fe");
  assert.equal(rt.document.documentElement.style.getPropertyValue("--user-accent"), "#a012fe");
  store.flushProgress();
  const restored = loadStore({ [KEY]: rt.data.get(KEY) });
  restored.store.applyTheme();
  assert.equal(restored.store.getProgress().settings.accentColor, "#a012fe");
  assert.equal(restored.store.getProgress().settings.onboarded, true);
  assert.equal(restored.store.getProgress().chapters.routing.notes, "saved work");
  const exported = store.exportProgress();
  store.updateSettings({ accentColor: "#000000" });
  assert.equal(store.importProgress(exported), null);
  assert.equal(rt.document.documentElement.style.getPropertyValue("--user-accent"), "#a012fe");
  const older = JSON.parse(exported);
  delete older.settings.accentColor;
  assert.equal(store.importProgress(JSON.stringify(older)), null);
  assert.equal(store.getProgress().settings.accentColor, "#3860f4");
  assert.equal(store.getProgress().chapters.routing.notes, "saved work");
});

test("invalid color updates and imports cannot replace saved progress or inject CSS", () => {
  const { rt, store } = loadStore();
  store.updateSettings({ accentColor: "#123456" });
  store.flushProgress();
  const before = store.getProgress();
  const saved = rt.data.get(KEY);
  for (const accentColor of ["red", "#fff", "#123456; color:red", "url(https://example.com)", 123456, null]) {
    assert.throws(() => store.updateSettings({ accentColor }));
    assert.match(store.importProgress(JSON.stringify({ ...plain(before), settings: { ...before.settings, accentColor } })), /Could not import/);
    assert.equal(store.getProgress(), before);
    assert.equal(rt.data.get(KEY), saved);
    assert.equal(rt.document.documentElement.style.getPropertyValue("--user-accent"), "#123456");
  }
});

for (const theme of ["darkest", "gray"]) test(`${theme} appearance survives reload and backup import without changing study records or accent`, () => {
  const { rt, store } = loadStore();
  const attributes = new Map();
  rt.document.documentElement.setAttribute = (name, value) => attributes.set(name, value);
  store.updateChapter("routing", { notes: "Keep my notes", sectionsDone: ["intro"] });
  store.updateSettings({ theme, accentColor: "#f36c9c", motion: "reduced" });
  assert.equal(attributes.get("data-theme"), theme);
  assert.equal(rt.data.get("ccna.theme"), theme);
  store.flushProgress();
  const restored = loadStore({ [KEY]: rt.data.get(KEY) });
  assert.equal(restored.store.getProgress().settings.theme, theme);
  assert.equal(restored.store.useStorageStatus().state, "saved");
  const exported = restored.store.exportProgress();
  restored.store.updateSettings({ theme: "light" });
  assert.equal(restored.store.importProgress(exported), null);
  assert.equal(restored.store.getProgress().settings.theme, theme);
  assert.equal(restored.store.getProgress().settings.accentColor, "#f36c9c");
  assert.equal(restored.store.getProgress().settings.motion, "reduced");
  assert.equal(restored.store.getProgress().chapters.routing.notes, "Keep my notes");
  assert.deepEqual(plain(restored.store.getProgress().chapters.routing.sectionsDone), ["intro"]);
});

test("external color settings and reset reapply the palette", () => {
  const { rt, store } = loadStore();
  const remote = JSON.stringify({ ...plain(store.getProgress()), settings: { ...store.getProgress().settings, accentColor: "#ffffff", onboarded: true } });
  rt.data.set(KEY, remote);
  rt.window.dispatch("storage", { key: KEY, newValue: remote });
  assert.equal(rt.document.documentElement.style.getPropertyValue("--user-accent"), "#ffffff");
  assert.equal(rt.document.documentElement.style.getPropertyValue("--user-accent-ink"), "#000000");
  store.resetAll();
  assert.equal(store.getProgress().settings.accentColor, "#3860f4");
  assert.equal(rt.document.documentElement.style.getPropertyValue("--user-accent"), "#3860f4");
});

test("menu interaction preferences survive reload and backups; older progress keeps click behavior", () => {
  const older = JSON.stringify({ v: 1, settings: { navCollapsed: true }, chapters: {} });
  const { rt, store } = loadStore({ [KEY]: older });
  assert.equal(store.getProgress().settings.navMode, "click");
  assert.equal(store.getProgress().settings.navCollapsed, true);
  store.updateChapter("routing", { notes: "Keep my notes", sectionsDone: ["intro"] });
  store.updateSettings({ navMode: "hover" });
  store.flushProgress();
  const restored = loadStore({ [KEY]: rt.data.get(KEY) }).store;
  assert.equal(restored.getProgress().settings.navMode, "hover");
  const exported = restored.exportProgress();
  restored.updateSettings({ navMode: "click" });
  assert.equal(restored.importProgress(exported), null);
  assert.equal(restored.getProgress().settings.navMode, "hover");
  assert.equal(restored.getProgress().settings.navCollapsed, true);
  assert.equal(restored.getProgress().chapters.routing.notes, "Keep my notes");
  const invalid = JSON.parse(exported);
  invalid.settings.navMode = "unknown";
  assert.match(restored.importProgress(JSON.stringify(invalid)), /Could not import/);
  assert.equal(restored.getProgress().settings.navMode, "hover");
});

test("retired system motion imports as Enabled while Disabled and study progress are preserved", () => {
  for (const [motion, expected] of [[undefined, "full"], ["system", "full"], ["full", "full"], ["reduced", "reduced"]]) {
    const source = JSON.stringify({ v: 1, settings: { motion, theme: "system" }, chapters: { routing: { sectionsDone: ["intro"], stepsDone: [], notes: "keep this work" } } });
    const { rt, store } = loadStore({ [KEY]: source });
    assert.equal(store.getProgress().settings.motion, expected);
    assert.equal(store.prefersReducedMotion(), expected === "reduced");
    assert.equal(store.getProgress().settings.theme, "system", "Appearance keeps its separate system option");
    assert.equal(store.getProgress().chapters.routing.notes, "keep this work");
    assert.equal(rt.data.get(KEY), source, "loading does not overwrite the original backup");
    assert.equal(store.importProgress(source), null);
    assert.equal(JSON.parse(store.exportProgress()).settings.motion, expected);
  }
});

test("lifecycle flush writes last changes; failures remain exportable and retryable", () => {
  const { rt, store } = loadStore();
  store.updateChapter("first", { notes: "last keystroke" });
  assert.equal(rt.data.has(KEY), false);
  rt.window.dispatch("pagehide");
  assert.equal(JSON.parse(rt.data.get(KEY)).chapters.first.notes, "last keystroke");
  assert.equal(rt.timers.size, 0);
  rt.setFailWrites(true);
  store.updateChapter("first", { notes: "quota test" });
  rt.document.visibilityState = "hidden";
  rt.document.dispatch("visibilitychange");
  assert.equal(store.useStorageStatus().state, "error");
  assert.equal(JSON.parse(store.exportProgress()).chapters.first.notes, "quota test");
  const before = store.getProgress();
  assert.match(store.importProgress(store.exportProgress()), /Quota exceeded/);
  assert.equal(store.getProgress(), before);
  rt.setFailWrites(false);
  store.flushProgress();
  assert.equal(store.useStorageStatus().state, "saved");
  assert.equal(JSON.parse(rt.data.get(KEY)).chapters.first.notes, "quota test");
});

test("clean tabs adopt external progress and dirty tabs cannot overwrite another copy", () => {
  const { rt, store } = loadStore();
  const remote = { ...plain(store.getProgress()), settings: { ...store.getProgress().settings, name: "other tab" } };
  const serialized = JSON.stringify(remote);
  rt.data.set(KEY, serialized);
  rt.window.dispatch("storage", { key: KEY, newValue: serialized });
  assert.equal(store.getProgress().settings.name, "other tab");
  store.updateChapter("local", { notes: "unsaved copy" });
  const newer = JSON.stringify({ ...remote, settings: { ...remote.settings, name: "newer remote" } });
  rt.data.set(KEY, newer);
  // Check before the asynchronous storage event arrives, as can happen in real tabs.
  store.flushProgress();
  assert.equal(rt.data.get(KEY), newer);
  assert.equal(store.getProgress().chapters.local.notes, "unsaved copy");
  assert.equal(store.useStorageStatus().state, "error");
  rt.window.dispatch("storage", { key: KEY, newValue: newer });
  store.flushProgress();
  assert.equal(rt.data.get(KEY), newer);
});

test("selected snapshots stay stable on unrelated edits and timed attempts publish once", () => {
  const { rt, store } = loadStore();
  const selected = rt.render(() => store.useProgress(p => ({ questions: p.questions }), (a, b) => a.questions === b.questions));
  const subscription = rt.external;
  let emits = 0;
  subscription.subscribe(() => emits++);
  store.updateSettings({ name: "Typing" });
  assert.equal(subscription.snapshot(), selected);
  assert.equal(rt.writes.length, 0, "ordinary settings do not synchronously write theme keys");
  emits = 0;
  const ids = Array.from({ length: 60 }, (_, i) => `q${i}`);
  const attempt = { id: "attempt1", date: iso, mode: "exam", scope: "", score: 60, total: 60, questionIds: ids, answers: Object.fromEntries(ids.map(id => [id, [0]])), durationSec: 3600 };
  const results = ids.map(questionId => ({ questionId, correct: true }));
  store.recordPracticeAttempt(attempt, results);
  assert.equal(emits, 1);
  assert.notEqual(subscription.snapshot(), selected);
  assert.equal(store.getProgress().questions.q59.seen, 1);
  store.recordPracticeAttempt(attempt, results);
  assert.equal(emits, 1);
  assert.equal(store.getProgress().attempts.length, 1);
  assert.equal(store.getProgress().questions.q59.seen, 1);
});

test("due cards leave the queue and Again returns only after ten minutes", () => {
  const { schedule, reviewQueue, introducedToday } = runtime().load("src/lib/srs.ts");
  const now = new Date(2026, 8, 19, 23, 30);
  const all = [{ id: "good" }, { id: "again" }, { id: "fresh" }];
  const good = schedule(undefined, 3, now);
  const again = schedule(undefined, 1, now);
  const cards = { good, again };
  assert.deepEqual(plain(reviewQueue(all, cards, true, 0, +now)), []);
  assert.deepEqual(plain(reviewQueue(all, cards, true, 0, +now + 600_000)).map(c => c.id), ["again"]);
  assert.deepEqual(plain(reviewQueue(all, cards, true, 1, +now)).map(c => c.id), ["fresh"]);
  assert.equal(reviewQueue(all, cards, false, 0, +now).length, 3, "browse mode still includes all cards");
  assert.equal(introducedToday(cards, now), 2, "Again also counts against new-card limit");
  const tomorrow = new Date(+now + 86_400_000);
  const repeated = schedule(again, 3, tomorrow);
  assert.equal(repeated.introducedAt, again.introducedAt);
  assert.equal(introducedToday({ again: repeated }, tomorrow), 0, "later reviews do not consume new-card allowance");
  assert.equal(introducedToday(cards, new Date(2026, 8, 20, 0, 1)), 0, "limit uses local calendar day");
});

test("mastery caches retain values across unrelated state edits and invalidate exact dependencies", () => {
  const course = {
    chapters: [{ id: "one", objectives: { v1: ["1.1.a"], v2: ["1.1"] } }],
    questionBank: [{ id: "q", objectives: ["v1:1.1.a", "v2:1.1"] }],
    objectivesFor: track => [{ id: "1.1", text: track, domain: "network" }, ...(track === "v1" ? [{ id: "1.1.a", text: "child", domain: "network" }] : [])],
    domainsFor: () => [{ id: "network", title: "Network", n: "1", weight: 100 }],
  };
  const mastery = runtime({ "./course": course }).load("src/lib/mastery.ts");
  const p = { questions: { q: { seen: 2, correct: 1, history: "wc", lastCorrect: true } }, chapters: {} };
  const objectives = mastery.objectiveMastery(p, "v1");
  assert.equal(objectives.length, 2);
  assert.equal(objectives[0].seen, 2);
  assert.equal(objectives[0].recent, 1 / 1.8);
  assert.deepEqual(plain(objectives[0].chapters), ["one"]);
  const domains = mastery.domainMastery(p, "v1");
  assert.equal(domains[0].score, 33);
  const unrelated = { ...p, cards: { other: {} } };
  assert.equal(mastery.domainMastery(unrelated, "v1"), domains);
  const completed = { ...p, chapters: { one: { completed: true } } };
  assert.equal(mastery.objectiveMastery(completed, "v1"), objectives);
  assert.equal(mastery.domainMastery(completed, "v1")[0].score, 73);
  assert.notEqual(mastery.objectiveMastery(p, "v2"), objectives);
  const changed = { ...p, questions: { q: { ...p.questions.q, seen: 3, history: "wcw", lastCorrect: false } } };
  assert.notEqual(mastery.objectiveMastery(changed, "v1"), objectives);
  assert.deepEqual([...mastery.mistakeIds(changed)], ["q"]);
  assert.equal(mastery.mistakeIds({ ...changed, chapters: {} }), mastery.mistakeIds(changed));
});

test("reading progress ignores retired and duplicate IDs and counts only checkable sections", () => {
  const { sectionProgress } = runtime().load("src/lib/section-progress.ts");
  const sections = Object.freeze([
    { id: "intro", title: "Introduction" },
    { id: "portfast", title: "PortFast and operational edge status" },
    { id: "root-guard", title: "Root guard" },
    { id: "exam", title: "Exam focus and review" },
  ]);
  const history = Object.freeze(["intro", "choosing-the-guard", "portfast", "portfast", "exam"]);
  assert.deepEqual(plain(sectionProgress(sections, history)), { done: 1, total: 2 });
  assert.deepEqual(plain(sectionProgress(sections)), { done: 0, total: 2 });
  assert.deepEqual(plain(sectionProgress(sections, [...history, "root-guard", "root-guard"])), { done: 2, total: 2 });
  assert.deepEqual(history, ["intro", "choosing-the-guard", "portfast", "portfast", "exam"], "old completion history stays available");
});

test("lab progress counts only distinct steps still present after a lab revision", () => {
  const { itemProgress } = runtime().load("src/lib/section-progress.ts");
  const steps = [{ id: "build" }, { id: "verify" }];
  const history = Object.freeze(["retired-fault", "build", "build"]);
  assert.deepEqual(plain(itemProgress(steps, history)), { done: 1, total: 2 });
  assert.deepEqual(plain(itemProgress(steps, [...history, "verify", "verify"])), { done: 2, total: 2 });
  assert.deepEqual(plain(itemProgress([], history)), { done: 0, total: 0 });
  assert.deepEqual(history, ["retired-fault", "build", "build"]);
});

test("question shortcuts affect only the focused question and cannot double-submit", () => {
  const rt = runtime({
    "@/lib/course": {}, "@/lib/banks/questions": {}, "@/lib/router": {}, "@/lib/store": {}, "@/lib/mastery": {},
    "@/lib/markdown": { inlineHtml: x => x }, "@/components/ui": { LETTERS: ["A", "B", "C"], shuffle: x => x }, "@/components/ChapterLayout": {},
  });
  const { QuestionView } = rt.load("src/pages/Practice.tsx");
  const q = { id: "q1", type: "single", objectives: [], difficulty: 1, options: ["a", "b"], answer: [0], prompt: "question", explanation: "reason" };
  let picks1 = 0, picks2 = 0, checks = 0;
  const first = rt.render(() => QuestionView({ q, state: { order: [1, 0], picked: [0], revealed: false }, onPick: picked => { picks1++; assert.deepEqual(plain(picked), [1]); }, onCheck: () => checks++ }));
  rt.resetHooks();
  rt.render(() => QuestionView({ q: { ...q, id: "q2" }, state: { order: [0, 1], picked: [], revealed: false }, onPick: () => picks2++, onCheck() {} }));
  const event = (key, extras = {}) => ({ key, preventDefault() {}, target: { isContentEditable: false, closest() { return null; } }, ...extras });
  first.props.onKeyDown(event("1"));
  assert.equal(picks1, 1);
  assert.equal(picks2, 0);
  assert.equal(rt.window.listenerCount("keydown"), 0, "checkpoint cards do not register global shortcuts");
  first.props.onKeyDown(event("1", { ctrlKey: true }));
  first.props.onKeyDown(event("1", { target: { isContentEditable: true } }));
  assert.equal(picks1, 1);
  first.props.onKeyDown(event("Enter"));
  first.props.onKeyDown(event("Enter"));
  assert.equal(checks, 1);
  rt.resetHooks();
  const multi = rt.render(() => QuestionView({ q: { ...q, type: "multi", answer: [0, 1] }, state: { order: [0, 1], picked: [0], revealed: false }, onPick() {}, onCheck: () => checks++ }));
  multi.props.onKeyDown(event("Enter"));
  assert.equal(checks, 1, "multi-select requires the requested number of choices");
});
