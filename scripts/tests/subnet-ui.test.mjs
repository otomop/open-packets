import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { runtime, plain } from "./runtime.mjs";

const modes = ["network", "hosts", "same", "wildcard", "ipv6", "vlsm", "subnets", "troubleshoot", "ipv6-subnet", "summary"];
const descendants = node => {
  if (node == null || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (typeof node !== "object") return [];
  return [node, ...descendants(node.props?.children)];
};
const text = node => {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(text).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return text(node.props?.children);
};
const find = (tree, predicate) => {
  const node = descendants(tree).find(predicate);
  assert.ok(node, "Expected element was rendered");
  return node;
};
const button = (tree, label) => find(tree, node => node.type === "button" && text(node) === label);
const input = (tree, id) => find(tree, node => node.type === "input" && node.props.id === id);
const walkthrough = tree => find(tree, node => typeof node.type === "function" && node.type.name === "ProblemWalkthrough");

function harness() {
  const progress = { subnet: { attempts: 0, correct: 0, byMode: {} } };
  const calls = { update: 0, activity: 0, grade: 0, generated: [] };
  const guides = modes.map(id => ({
    id, title: id, description: `${id} description`, chapterId: "ipv4-addressing", sectionId: "network-broadcast-and-usable-hosts",
    scope: "A supplied method", steps: ["Read the values"], example: { prompt: "A worked example", steps: ["Compare the result"] }, pitfall: "Keep the fields separate.",
  }));
  function Binary() { return null; }
  const real = runtime().load("src/lib/subnet.ts");
  const rt = runtime({
    "@/lib/subnet": {
      subnetInfo: real.subnetInfo,
    },
    "@/lib/subnet-drills": {
      makeDrill(mode, difficulty = "standard") {
        calls.generated.push({ mode, difficulty });
        return {
          mode, difficulty, prompt: `${mode} problem ${calls.generated.length}`, detail: "Supplied UI fixture", explain: "A method explanation", workedSteps: [`Read ${mode} problem ${calls.generated.length}`, "Calculate the network", "Count usable addresses"],
          fields: [
            { key: "network", label: "Network address", answer: "192.0.2.0", format: "ipv4" },
            { key: "hosts", label: "Usable hosts", answer: "254", format: "integer", min: 1, max: 4294967294 },
          ],
        };
      },
      gradeDrill(drill, values) {
        calls.grade++;
        const fields = drill.fields.map(field => ({ key: field.key, correct: values[field.key]?.trim() === field.answer, feedback: "Compare this field with the worked method." }));
        return { fields, allCorrect: fields.every(field => field.correct) };
      },
    },
    "@/lib/subnet-guides": { SUBNET_MODES: guides, guideByMode: Object.fromEntries(guides.map(guide => [guide.id, guide])) },
    "@/lib/store": {
      useProgress: selector => selector ? selector(progress) : progress,
      update: fn => { calls.update++; fn(progress); },
      logActivity: value => { calls.activity += value; },
    },
    "@/lib/router": { chapterHref: (id, tab) => `#/chapter/${id}/${tab}` },
    "@/lib/course": { chapterById: new Map([["ipv4-addressing", { number: 4 }]]) },
    "@/components/Diagram": { Binary },
  });
  const Component = rt.load("src/pages/Subnetting.tsx").default;
  let tree;
  const render = () => tree = rt.render(Component);
  const fill = (values = { network: "192.0.2.0", hosts: "254" }) => {
    for (const [key, value] of Object.entries(values)) input(tree, `answer-${key}`).props.onChange({ target: { value } });
    return render();
  };
  const submit = () => { find(tree, node => node.type === "form").props.onSubmit({ preventDefault() {} }); return render(); };
  render();
  return { rt, Component, Binary, calls, progress, render, fill, submit, get tree() { return tree; } };
}

// The lightweight runtime does not reconcile nested React components. Give the
// child a separate hook pool while retaining the real parent's onUse callback.
function walkthroughHarness(props) {
  const isolated = harness();
  const Component = walkthrough(isolated.tree).type;
  isolated.rt.resetHooks();
  let tree;
  const render = () => tree = isolated.rt.render(() => Component(props));
  render();
  const click = label => { button(tree, label).props.onClick(); return render(); };
  return { render, click, get tree() { return tree; } };
}

test("checking requires every field; a rapid duplicate submit records just one first check", () => {
  const h = harness();
  assert.equal(button(h.tree, "Check answers").props.disabled, true);
  h.submit();
  assert.equal(h.calls.grade, 0);
  h.fill({ network: "192.0.2.0", hosts: " " });
  h.submit();
  assert.equal(h.calls.update, 0);
  h.fill();
  assert.equal(button(h.tree, "Check answers").props.disabled, false);
  const submit = find(h.tree, node => node.type === "form").props.onSubmit;
  submit({ preventDefault() {} });
  submit({ preventDefault() {} });
  h.render();
  assert.equal(h.calls.grade, 1);
  assert.equal(h.progress.subnet.attempts, 1);
  assert.equal(h.progress.subnet.correct, 1);
  assert.equal(h.calls.activity, 1);
  assert.equal(input(h.tree, "answer-network").props.disabled, true);
});

test("repair retains correct fields and cannot turn the recorded failed first check into a success", () => {
  const h = harness();
  h.fill({ network: "192.0.2.0", hosts: "256" });
  h.submit();
  assert.equal(h.progress.subnet.attempts, 1);
  assert.equal(h.progress.subnet.correct, 0);
  assert.equal(input(h.tree, "answer-network").props["aria-invalid"], undefined);
  assert.equal(input(h.tree, "answer-hosts").props["aria-invalid"], true);
  button(h.tree, "Repair my answers").props.onClick();
  h.render();
  assert.equal(input(h.tree, "answer-network").props.value, "192.0.2.0");
  assert.equal(input(h.tree, "answer-hosts").props.value, "");
  assert.match(text(h.tree), /first-check score is already recorded/);
  h.fill({ hosts: "254" });
  h.submit();
  assert.equal(h.progress.subnet.attempts, 1);
  assert.equal(h.progress.subnet.correct, 0);
  assert.equal(h.calls.update, 1);
  assert.equal(h.calls.activity, 1);
  assert.match(text(h.tree), /Corrected\. Your original score is unchanged/);
  // The next-problem control submits the form rather than having its own click handler.
  h.submit();
  assert.equal(input(h.tree, "answer-network").props.value, "");
  h.fill();
  h.submit();
  assert.equal(h.progress.subnet.attempts, 2);
  assert.equal(h.progress.subnet.correct, 1);
});

test("changing difficulty or skill clears the previous answer and feedback without scoring it", () => {
  const h = harness();
  h.fill();
  find(h.tree, node => node.type === "select").props.onChange({ target: { value: "challenge" } });
  h.render();
  assert.deepEqual(h.calls.generated.at(-1), { mode: "network", difficulty: "challenge" });
  assert.equal(input(h.tree, "answer-network").props.value, "");
  assert.equal(h.progress.subnet.attempts, 0);
  const skill = find(h.tree, node => node.type === "button" && node.props["aria-pressed"] !== undefined && text(node).startsWith("hosts"));
  skill.props.onClick();
  h.render();
  assert.deepEqual(h.calls.generated.at(-1), { mode: "hosts", difficulty: "challenge" });
  assert.equal(input(h.tree, "answer-hosts").props.value, "");
  h.fill();
  h.submit();
  assert.deepEqual(plain(h.progress.subnet.byMode.hosts), { a: 1, c: 1 });
  assert.equal(h.progress.subnet.byMode.network, undefined);
});

test("opening help marks an assisted check without scoring, and early review distinguishes skipped from not checked", () => {
  const h = harness();
  button(h.tree, "Mixed review · 10 problems").props.onClick();
  h.render();
  assert.equal(h.calls.generated.length, 11);
  assert.equal(new Set(h.calls.generated.slice(1).map(item => item.mode)).size, 10, "one problem from each mode");
  assert.equal(find(h.tree, node => node.type === "select").props.disabled, true);
  const method = walkthroughHarness(walkthrough(h.tree).props);
  method.click("Show me how it's done");
  h.render();
  assert.match(text(h.tree), /Assisted practice/);
  assert.equal(h.progress.subnet.attempts, 0);
  h.fill();
  h.submit();
  h.submit();
  button(h.tree, "Skip this problem").props.onClick();
  h.render();
  button(h.tree, "End and review results").props.onClick();
  h.render();
  assert.match(text(h.tree), /1 checked · 1 skipped · 8 not checked · 1 assisted checks/);
  assert.equal(h.progress.subnet.attempts, 1);
  assert.equal(h.progress.subnet.correct, 1);
  const summary = find(h.tree, node => node.props["aria-label"] === "Mixed review results");
  const rows = descendants(summary).filter(node => node.type === "tr");
  assert.equal(rows.length, 11, "ten skill rows plus the header");
});

test("the walkthrough opens the current problem's first step without filling answers or recording an attempt", () => {
  const h = harness();
  h.fill({ network: "my working", hosts: "" });
  const current = walkthrough(h.tree);
  const w = walkthroughHarness(current.props);
  assert.equal(button(w.tree, "Show me how it's done").props["aria-expanded"], false);
  assert.equal(descendants(w.tree).some(node => node.props["aria-label"] === "Current problem walkthrough"), false);
  assert.equal(text(w.tree).includes(current.props.drill.workedSteps[0]), false);
  w.click("Show me how it's done");
  h.render();
  const section = find(w.tree, node => node.props["aria-label"] === "Current problem walkthrough");
  assert.ok(text(section).includes(current.props.drill.prompt));
  assert.ok(text(section).includes(current.props.drill.workedSteps[0]));
  assert.ok(!text(section).includes(current.props.drill.workedSteps[1]));
  assert.match(text(h.tree), /Assisted practice/);
  assert.equal(input(h.tree, "answer-network").props.value, "my working");
  assert.equal(input(h.tree, "answer-hosts").props.value, "");
  assert.equal(h.calls.grade, 0);
  assert.equal(h.calls.update, 0);
  assert.equal(h.calls.activity, 0);
  assert.equal(h.progress.subnet.attempts, 0);
  assert.equal(button(w.tree, "Hide walkthrough").props["aria-expanded"], true);
  const controlled = find(w.tree, node => node.props.id === button(w.tree, "Hide walkthrough").props["aria-controls"]);
  assert.ok(descendants(controlled).includes(section));
  assert.notEqual(controlled.props.hidden, true);
  const liveStep = find(w.tree, node => node.props["aria-live"] === "polite");
  assert.equal(liveStep.props["aria-atomic"], "true");
});

test("walkthrough navigation stays within its steps and exposes the completed answer only at the end", () => {
  const h = harness();
  const props = walkthrough(h.tree).props;
  const w = walkthroughHarness(props);
  w.click("Show me how it's done");
  const activeText = () => text(find(w.tree, node => node.props["aria-live"] === "polite"));
  assert.equal(button(w.tree, "← Previous step").props.disabled, true);
  w.click("← Previous step"); // Even an invoked disabled handler must stay bounded.
  assert.ok(activeText().includes(props.drill.workedSteps[0]));
  assert.doesNotMatch(text(w.tree), /Completed answer/);
  for (let i = 1; i < props.drill.workedSteps.length; i++) {
    w.click("Next step →");
    assert.ok(activeText().includes(props.drill.workedSteps[i]));
    assert.ok(!activeText().includes(props.drill.workedSteps[i - 1]));
  }
  assert.equal(button(w.tree, "Next step →").props.disabled, true);
  w.click("Next step →");
  assert.ok(activeText().includes(props.drill.workedSteps.at(-1)));
  assert.match(text(w.tree), /Completed answer/);
  const answers = descendants(w.tree).filter(node => node.type === "dd").map(text);
  assert.deepEqual(answers, props.drill.fields.map(field => field.answer));
  w.click("← Previous step");
  assert.doesNotMatch(text(w.tree), /Completed answer/);
  assert.ok(activeText().includes(props.drill.workedSteps.at(-2)));
});

test("show-all and hide controls preserve the current worked steps without scoring or copying the solution", () => {
  const h = harness();
  const props = walkthrough(h.tree).props;
  const w = walkthroughHarness(props);
  w.click("Show me how it's done");
  w.click("Next step →");
  w.click("Show all steps");
  assert.deepEqual(descendants(w.tree).filter(node => node.type === "li").map(text), props.drill.workedSteps);
  assert.match(text(w.tree), /Completed answer/);
  assert.equal(descendants(w.tree).some(node => node.type === "button" && text(node) === "Next step →"), false);
  w.click("One step at a time");
  assert.ok(text(find(w.tree, node => node.props["aria-live"] === "polite")).includes(props.drill.workedSteps[1]));
  w.click("Hide walkthrough");
  assert.equal(descendants(w.tree).some(node => node.props["aria-label"] === "Current problem walkthrough"), false);
  w.click("Show me how it's done");
  assert.ok(text(find(w.tree, node => node.props["aria-live"] === "polite")).includes(props.drill.workedSteps[1]));
  h.render();
  assert.equal(input(h.tree, "answer-network").props.value, "");
  assert.equal(input(h.tree, "answer-hosts").props.value, "");
  assert.equal(h.calls.grade + h.calls.update + h.calls.activity, 0);
});

test("each problem transition gives the walkthrough fresh identity and the matching problem data", () => {
  const h = harness();
  const transitions = [
    () => button(h.tree, "New problem").props.onClick(),
    () => find(h.tree, node => node.type === "select").props.onChange({ target: { value: "challenge" } }),
    () => find(h.tree, node => node.type === "button" && node.props["aria-pressed"] !== undefined && text(node).startsWith("hosts")).props.onClick(),
    () => button(h.tree, "Mixed review · 10 problems").props.onClick(),
    () => button(h.tree, "Skip this problem").props.onClick(),
  ];
  let previous = walkthrough(h.tree);
  for (const transition of transitions) {
    const before = walkthroughHarness(previous.props);
    before.click("Show me how it's done");
    before.click("Show all steps");
    h.render();
    transition();
    h.render();
    const current = walkthrough(h.tree);
    assert.notEqual(current.key, previous.key, "React must remount walkthrough state for each new problem");
    assert.notEqual(current.props.drill.prompt, previous.props.drill.prompt);
    assert.ok(text(h.tree).includes(current.props.drill.prompt));
    assert.doesNotMatch(text(h.tree), /Assisted practice/);
    const fresh = walkthroughHarness(current.props);
    assert.equal(button(fresh.tree, "Show me how it's done").props["aria-expanded"], false);
    fresh.click("Show me how it's done");
    assert.ok(text(fresh.tree).includes(current.props.drill.prompt));
    assert.ok(!text(fresh.tree).includes(previous.props.drill.prompt));
    previous = current;
  }
  assert.equal(h.progress.subnet.attempts, 0);
});

test("opening the walkthrough after a first check cannot retroactively mark that review result assisted", () => {
  const h = harness();
  button(h.tree, "Mixed review · 10 problems").props.onClick();
  h.render();
  h.fill();
  h.submit();
  const w = walkthroughHarness(walkthrough(h.tree).props);
  w.click("Show me how it's done");
  w.click("Show all steps");
  h.render();
  button(h.tree, "End and review results").props.onClick();
  h.render();
  assert.match(text(h.tree), /1 checked · 0 skipped · 9 not checked · 0 assisted checks/);
  assert.equal(h.progress.subnet.attempts, 1);
  assert.equal(h.progress.subnet.correct, 1);
  assert.equal(h.calls.update, 1);
  assert.equal(h.calls.activity, 1);
});

test("finishing a mixed review records each mode exactly once and leaves repair outcomes separate", () => {
  const h = harness();
  button(h.tree, "Mixed review · 10 problems").props.onClick();
  h.render();
  for (let i = 0; i < 10; i++) {
    h.fill();
    h.submit();
    h.submit();
  }
  assert.match(text(h.tree), /10 checked · 0 skipped · 0 not checked/);
  assert.equal(h.progress.subnet.attempts, 10);
  assert.equal(h.progress.subnet.correct, 10);
  assert.equal(h.calls.activity, 10);
  assert.deepEqual(Object.keys(h.progress.subnet.byMode).sort(), modes.slice().sort());
  for (const result of Object.values(h.progress.subnet.byMode)) assert.deepEqual(plain(result), { a: 1, c: 1 });
});

test("the address explorer preserves missing and nondecimal prefix text instead of coercing it to /0", () => {
  const h = harness();
  const explorer = find(h.tree, node => typeof node.type === "function" && node.type.name === "AddressExplorer");
  h.rt.resetHooks();
  let uses = 0;
  const render = () => h.rt.render(() => explorer.type({ onUse: () => uses++ }));
  let tree = render();
  const prefixInput = () => find(tree, node => node.type === "input" && node.props.inputMode === "numeric");
  for (const prefix of ["", "26.5", "26abc", "2e1", "-1", "33", " 26 "]) {
    prefixInput().props.onChange({ target: { value: prefix } });
    tree = render();
    assert.equal(prefixInput().props.value, prefix);
    assert.match(text(tree), /four decimal octets.*whole prefix/);
    assert.equal(descendants(tree).some(node => node.type === h.Binary), false);
  }
  for (const prefix of ["0", "31", "32"]) {
    prefixInput().props.onChange({ target: { value: prefix } });
    tree = render();
    assert.equal(descendants(tree).some(node => node.type === h.Binary), true);
    assert.match(text(tree), prefix === "0" ? /not a deployable LAN/ : prefix === "31" ? /two-endpoint point-to-point/ : /not a multi-host LAN/);
  }
  tree.props.onToggle({ currentTarget: { open: true } });
  assert.equal(uses, 1);
});

test("lesson links preserve the problem and count ordinary or auxiliary openings as assistance", () => {
  const h = harness();
  const links = find(h.tree, node => typeof node.type === "function" && node.type.name === "LessonLinks");
  const tree = links.type(links.props);
  const anchors = descendants(tree).filter(node => node.type === "a");
  assert.equal(anchors.length, 2);
  assert.equal(anchors[0].props.href, "#/chapter/ipv4-addressing/learn?section=network-broadcast-and-usable-hosts");
  assert.equal(anchors[1].props.href, "#/chapter/ipv4-addressing/lab");
  for (const anchor of anchors) {
    assert.equal(anchor.props.target, "_blank");
    assert.match(anchor.props.rel, /noopener/);
  }
  anchors[0].props.onClick();
  h.render();
  assert.match(text(h.tree), /Assisted practice/);
  assert.equal(h.progress.subnet.attempts, 0);
  let uses = 0;
  const direct = links.type({ ...links.props, onUse: () => uses++ });
  for (const anchor of descendants(direct).filter(node => node.type === "a")) {
    anchor.props.onClick();
    anchor.props.onAuxClick();
  }
  assert.equal(uses, 4, "both links mark normal and middle-button opens");
});

const require = createRequire(import.meta.url);
const { Binary } = runtime({
  react: require("react"),
  "react/jsx-runtime": require("react/jsx-runtime"),
  "@/lib/store": { prefersReducedMotion: () => false },
}).load("src/components/Diagram.tsx");
const binaryMarkup = (ip, prefix) => renderToStaticMarkup(createElement(Binary, { spec: { type: "binary", ip, prefix } }));

test("the binary diagram rejects invalid input before trying to display its bits", () => {
  for (const [ip, prefix] of [["bad", 24], ["256.0.0.1", 24], ["192.0.2.1", -1], ["192.0.2.1", 33], ["192.0.2.1", 24.5], ["192.0.2.1", NaN]]) {
    const markup = binaryMarkup(ip, prefix);
    assert.match(markup, /Enter a valid IPv4 address and a whole prefix from 0 to 32/);
    assert.doesNotMatch(markup, /binary-grid/);
  }
});

test("the binary diagram distinguishes the /0 space, /31 endpoints, /32 address, and ordinary LAN hosts", () => {
  const all = binaryMarkup("203.0.113.7", 0);
  assert.match(all, /address space <b>4,294,967,296<\/b>/);
  assert.doesNotMatch(all, /usable/);
  assert.equal((all.match(/<i class="h" style=/g) ?? []).length, 32);
  const pair = binaryMarkup("192.0.2.10", 31);
  assert.match(pair, /point-to-point endpoints <b>2<\/b>/);
  assert.match(pair, /broadcast <b>—<\/b>/);
  const single = binaryMarkup("192.0.2.10", 32);
  assert.match(single, /single address <b>1<\/b>/);
  assert.match(single, /broadcast <b>—<\/b>/);
  assert.equal((single.match(/<i class="n" style=/g) ?? []).length, 32);
  const lan = binaryMarkup("192.0.2.65", 26);
  assert.match(lan, /network <b>192\.0\.2\.64<\/b>/);
  assert.match(lan, /broadcast <b>192\.0\.2\.127<\/b>/);
  assert.match(lan, /usable <b>62<\/b>/);
});
