import test from "node:test";
import assert from "node:assert/strict";
import { runtime, plain } from "./runtime.mjs";

const descendants = node => node == null || typeof node !== "object" ? [] : Array.isArray(node) ? node.flatMap(descendants) : [node, ...descendants(node.props?.children)];
const text = node => node == null || typeof node === "boolean" ? "" : Array.isArray(node) ? node.map(text).join("") : typeof node === "object" ? text(node.props?.children) : String(node);
const find = (tree, fn) => { const node = descendants(tree).find(fn); assert.ok(node, "Expected UI element"); return node; };
const button = (tree, label) => find(tree, node => node.type === "button" && text(node) === label);
const input = tree => find(tree, node => node.type === "input" && node.props.type !== "checkbox");
const child = (tree, name) => find(tree, node => typeof node.type === "function" && node.type.name === name);

function harness() {
  const list = ["a", "b", "c"].map((id, i) => ({ id, chapterId: "intro", chapterTitle: "Introduction", task: `Name switch ${i + 1}.`, mode: "Switch(config)#", answer: `hostname S${i + 1}`, teaching: {
    sectionId: "modes", hint: "Use the device naming command.", takeaway: "The prompt changes immediately; saving is a separate action.", focus: "core",
    syntax: [{ text: "hostname", kind: "keyword" }, { text: `S${i + 1}`, kind: "argument" }],
  } }));
  const chapters = [
    { id: "intro", number: 0, title: "Introduction", commands: list, lab: {} },
    { id: "models", number: 1, title: "Network models", commands: [], lab: {} },
    { id: "routing", number: 2, title: "Routing", commands: [], lab: {} },
  ];
  const plans = new Map(chapters.map(ch => [ch.id, { chapterId: ch.id, goal: ch.id === "intro" ? "Learn the first CLI skills." : "Interpret protocol behavior.", demand: "foundation", emptyReason: "Use the supplied output to follow encapsulation; command recall belongs to later chapters.", reviewLinks: [{ chapterId: "intro", reason: "Review modes here." }] }]));
  const progress = { drills: {}, settings: { track: "v1" } };
  const calls = { grades: 0, updates: 0, activity: 0, restart: [] };
  const rt = runtime({
    "@/styles/command-drill.css": {},
    "@/lib/course": { chapters, chapterById: new Map(chapters.map(ch => [ch.id, ch])), isRequired: () => true },
    "@/lib/command-curriculum": { commandPlans: plans },
    "@/lib/banks/commands": { drillBank: list },
    "@/lib/commands": { gradeCommand: (given, drill) => { calls.grades++; return { correct: given === drill.answer, feedback: "Check the requested hostname." }; } },
    "@/lib/store": { useProgress: selector => selector(progress), update: fn => { calls.updates++; fn(progress); }, logActivity: n => { calls.activity += n; } },
    "@/lib/router": { chapterHref: (id, tab) => `#/chapter/${id}/${tab}` },
    "@/components/ChapterLayout": { TabLayout: props => props.children, JumpGrid: () => null },
  });
  const components = rt.load("src/pages/Drill.tsx");
  let tree;
  const render = () => tree = rt.render(() => components.CommandSession({ list, onRestart: ids => calls.restart.push(ids) }));
  const fill = given => { input(tree).props.onChange({ target: { value: given } }); return render(); };
  const submit = () => { find(tree, node => node.type === "form").props.onSubmit({ preventDefault() {} }); return render(); };
  const click = label => { button(tree, label).props.onClick(); return render(); };
  render();
  return { rt, components, list, progress, calls, render, fill, submit, click, get tree() { return tree; } };
}

test("blank and duplicate checks cannot record extra attempts", () => {
  const h = harness(); h.submit();
  assert.equal(h.calls.updates, 0);
  h.fill("hostname S1");
  const submit = find(h.tree, node => node.type === "form").props.onSubmit;
  submit({ preventDefault() {} }); submit({ preventDefault() {} }); h.render();
  assert.equal(h.calls.updates, 1);
  assert.equal(h.calls.grades, 1);
  assert.equal(h.progress.drills.a.correct, 1);
  assert.equal(input(h.tree).props.disabled, true);
  h.submit();
  assert.match(text(h.tree), /Name switch 1/);
  assert.equal(h.calls.updates, 1);
});

test("repair keeps the draft and first score; revisits cannot score the same item twice", () => {
  const h = harness(); h.fill("hostname wrong"); h.submit();
  assert.equal(input(h.tree).props["aria-invalid"], true);
  const repairKey = button(h.tree, "Edit my command").key;
  h.click("Edit my command");
  assert.notEqual(button(h.tree, "Check correction").key, repairKey, "Do not reuse the repair button as a native submit button");
  assert.equal(input(h.tree).props.value, "hostname wrong");
  h.fill("hostname S1"); h.submit();
  assert.match(text(h.tree), /Corrected\. Your first result is unchanged/);
  assert.equal(h.progress.drills.a.correct, 0);
  assert.equal(h.progress.drills.a.attempts, 1);
  h.click("Next command →"); h.fill("unfinished"); h.click("← Previous");
  assert.equal(input(h.tree).props.value, "hostname S1");
  assert.equal(input(h.tree).props.disabled, true);
  h.submit(); assert.equal(h.calls.updates, 1);
  h.click("Next command →"); assert.equal(input(h.tree).props.value, "unfinished");
});

test("a hint gives a short cue without revealing the answer or adding an attempt", () => {
  const h = harness();
  assert.doesNotMatch(text(h.tree), /Use the device naming command|prompt changes immediately|Show me how|Guided practice/);
  h.fill("working"); h.click("Hint");
  assert.match(text(h.tree), /Use the device naming command/);
  assert.match(text(h.tree), /Help used/);
  assert.doesNotMatch(text(h.tree), /prompt changes immediately/);
  assert.equal(input(h.tree).props.value, "working");
  assert.equal(h.calls.updates, 0);
  h.click("Hide hint"); h.fill("hostname S1"); h.submit(); h.click("End round");
  assert.match(text(h.tree), /Correct with help/);
  assert.match(text(h.tree), /0 correct without help · 1 checked with help/);
});

test("answer reveal is separate from grading and presents one concise explanation", () => {
  const h = harness(); h.fill("draft"); h.click("Review answer");
  assert.equal(input(h.tree).props.value, "draft");
  assert.equal(h.calls.updates, 0);
  assert.equal(descendants(h.tree).filter(n => n.props?.["aria-label"] === "Answer and explanation").length, 1);
  assert.match(text(h.tree), /hostname S1/);
  assert.match(text(h.tree), /prompt changes immediately/);
  h.fill("hostname S1"); h.submit(); h.click("End round");
  assert.match(text(h.tree), /Correct with help/);
});

test("lesson and lab links preserve the exercise and assistance is not retroactive", () => {
  const h = harness(); h.fill("working");
  const lesson = find(h.tree, node => node.type === "a" && text(node) === "Related lesson ↗");
  assert.equal(lesson.props.href, "#/chapter/intro/learn?section=modes");
  assert.equal(lesson.props.target, "_blank");
  assert.equal(lesson.props.rel, "noopener");
  lesson.props.onAuxClick(); h.render();
  assert.equal(h.calls.updates, 0);
  assert.equal(input(h.tree).props.value, "working");
  h.fill("hostname S1"); h.submit(); h.click("Next command →");
  h.fill("hostname S2"); h.submit();
  find(h.tree, node => node.type === "a" && text(node) === "Chapter lab ↗").props.onClick(); h.render();
  h.click("End round");
  assert.match(text(h.tree), /Correct with help/);
  assert.match(text(h.tree), /Correct without help/);
  assert.match(text(h.tree), /1 correct without help · 1 checked with help/);
});

test("exam depth follows the selected track without changing saved scores", () => {
  const h = harness(); h.list[0].teaching.focusByTrack = { v1: "supporting", v2: "core" }; h.render();
  assert.match(text(h.tree), /Extra lab practice/);
  h.progress.settings.track = "v2"; h.render();
  assert.doesNotMatch(text(h.tree), /Extra lab practice/);
  assert.equal(h.calls.updates, 0);
});

test("finite rounds distinguish skipped, unattempted and checked commands", () => {
  const h = harness(); h.fill("hostname S1"); h.submit(); h.click("Next command →");
  h.click("Skip for now"); h.click("End round");
  assert.match(text(h.tree), /1 checked · 1 skipped · 1 not checked/);
  h.click("Practise these again · 2");
  assert.deepEqual(plain(h.calls.restart[0]), ["b", "c"]);
  button(h.tree, "Name switch 2.").props.onClick(); h.render();
  h.fill("hostname S2"); h.submit(); h.click("Next command →");
  h.fill("hostname S3"); h.submit(); h.click("Finish and review");
  assert.match(text(h.tree), /3 checked · 0 skipped · 0 not checked/);
  assert.equal(h.calls.updates, 3);
  assert.equal(h.calls.activity, 1.5);
});

test("revisits retain item-specific help and drafts without leaking them to the next task", () => {
  const h = harness(); h.fill("draft A"); h.click("Hint"); h.click("Skip for now");
  assert.doesNotMatch(text(h.tree), /Help used|Use the device naming command/);
  assert.equal(input(h.tree).props.value, "");
  h.fill("draft B"); h.click("← Previous");
  assert.match(text(h.tree), /Help used|Use the device naming command/);
  assert.equal(input(h.tree).props.value, "draft A");
});

test("review prioritizes weaker introduced commands and excludes unseen or retired IDs", () => {
  const h = harness();
  const stats = { a: { attempts: 4, correct: 3, last: "2026-01-01" }, b: { attempts: 2, correct: 0, last: "2026-01-02" }, retired: { attempts: 2, correct: 0, last: "2025-01-01" } };
  assert.deepEqual(plain(h.components.reviewCommands(h.list, stats).map(d => d.id)), ["b", "a"]);
  const many = Array.from({ length: 25 }, (_, i) => ({ ...h.list[0], id: `${i}` }));
  const seen = Object.fromEntries(many.map(d => [d.id, { attempts: 1, correct: 0, last: "2026-01-01" }]));
  assert.equal(h.components.reviewCommands(many, seen).length, 15);
});

test("core practice is the default and optional depth follows the exam track", () => {
  const h = harness(); h.list[2].teaching.focusByTrack = { v1: "supporting", v2: "core" }; h.rt.resetHooks();
  let tree; const render = () => tree = h.rt.render(() => h.components.DrillRunner({})); render();
  const initial = child(tree, "CommandSession");
  assert.deepEqual(plain(initial.props.list.map(d => d.id)), ["a", "b"]);
  assert.match(text(tree), /Include 1 extra lab command/);
  find(tree, n => n.type === "input" && n.props.type === "checkbox").props.onChange({ target: { checked: true } }); render();
  assert.notEqual(child(tree, "CommandSession").key, initial.key);
  assert.deepEqual(plain(child(tree, "CommandSession").props.list.map(d => d.id)), ["a", "b", "c"]);
  h.progress.settings.track = "v2"; render();
  assert.doesNotMatch(text(tree), /Include 1 extra lab command/);
  assert.equal(h.calls.updates, 0);
});

test("chapters without command recall remain discoverable with a reason and learning links", () => {
  const h = harness(); h.rt.resetHooks();
  let tree; const render = () => tree = h.rt.render(() => h.components.DrillRunner({})); render();
  const select = find(tree, n => n.type === "select");
  assert.match(text(select), /Network models · Lesson & lab/);
  select.props.onChange({ target: { value: "models" } }); render();
  assert.match(text(tree), /Use the supplied output to follow encapsulation/);
  assert.equal(find(tree, n => n.type === "a" && text(n) === "Open chapter lab →").props.href, "#/chapter/models/lab");
  assert.equal(find(tree, n => n.type === "a" && text(n).includes("Introduction →")).props.href, "#/chapter/intro/drill");
  assert.equal(descendants(tree).some(n => typeof n.type === "function" && n.type.name === "CommandSession"), false);
});

test("restarting review preserves its set and returning to chapter restores teaching order", () => {
  const h = harness(); h.rt.resetHooks();
  let tree; const render = () => tree = h.rt.render(() => h.components.DrillRunner({})); render();
  const initial = child(tree, "CommandSession");
  initial.props.onRestart(["c"]); render();
  assert.notEqual(child(tree, "CommandSession").key, initial.key);
  assert.deepEqual(plain(child(tree, "CommandSession").props.list.map(d => d.id)), ["c"]);
  child(tree, "CommandSession").props.onRestart(); render();
  assert.deepEqual(plain(child(tree, "CommandSession").props.list.map(d => d.id)), ["c"]);
  button(tree, "Return to chapter").props.onClick(); render();
  assert.deepEqual(plain(child(tree, "CommandSession").props.list.map(d => d.id)), ["a", "b", "c"]);
});
