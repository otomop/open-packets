import test from "node:test";
import assert from "node:assert/strict";
import { runtime, plain } from "./runtime.mjs";

const descendants = node => node == null || typeof node !== "object" ? [] : Array.isArray(node) ? node.flatMap(descendants) : [node, ...descendants(node.props?.children)];
const text = node => node == null || typeof node === "boolean" ? "" : Array.isArray(node) ? node.map(text).join("") : typeof node === "object" ? node.props?.["aria-hidden"] ? "" : text(node.props?.children) : String(node);
const find = (tree, predicate) => { const result = descendants(tree).find(predicate); assert.ok(result, "Expected UI element"); return result; };
const button = (tree, label) => find(tree, node => node.type === "button" && text(node) === label);
const field = (tree, label) => find(find(tree, node => node.type === "label" && text(node) === label), node => node.type === "input");
const child = (tree, name) => find(tree, node => typeof node.type === "function" && node.type.name === name);

function pickerHarness(initial = "#3860f4") {
  const rt = runtime();
  const { AccentColorPicker } = rt.load("src/components/AccentColorPicker.tsx");
  let value = initial;
  const changes = [];
  let tree;
  const render = () => tree = rt.render(() => AccentColorPicker({ value, showReset: true, onChange: next => { value = next; changes.push(next); } }));
  const click = label => { button(tree, label).props.onClick(); return render(); };
  const fill = (label, next) => { field(tree, label).props.onChange({ target: { value: next } }); return render(); };
  const blur = label => { field(tree, label).props.onBlur(); return render(); };
  render();
  return { render, click, fill, blur, changes, get tree() { return tree; }, get value() { return value; } };
}

test("favorite color offers five named presets and an optional full RGB editor", () => {
  const h = pickerHarness();
  const presets = descendants(h.tree).filter(node => node.type === "button" && "aria-pressed" in node.props);
  assert.deepEqual(presets.map(text), ["Blue", "Violet", "Teal", "Amber", "Rose"]);
  assert.equal(presets.filter(node => node.props["aria-pressed"]).length, 1);
  assert.equal(button(h.tree, "Blue").props["aria-pressed"], true);
  assert.equal(button(h.tree, "Custom").props["aria-expanded"], false);
  assert.equal(descendants(h.tree).filter(node => node.type === "input").length, 0);
  assert.equal(button(h.tree, "Reset to blue").props.disabled, true);

  h.click("Custom");
  assert.equal(button(h.tree, "Custom").props["aria-expanded"], true);
  assert.equal(field(h.tree, "Color picker").props.type, "color");
  assert.equal(field(h.tree, "Hex color").props.value, "#3860F4");
  for (const [name, value] of [["Red", "56"], ["Green", "96"], ["Blue", "244"]]) {
    const input = field(h.tree, name);
    assert.equal(input.props.value, value);
    assert.equal(input.props.min, 0);
    assert.equal(input.props.max, 255);
    assert.equal(input.props.step, 1);
  }
  h.click("Rose");
  assert.equal(h.value, "#f36c9c");
  assert.equal(button(h.tree, "Rose").props["aria-pressed"], true);
  assert.equal(button(h.tree, "Custom").props["aria-expanded"], false);
  h.click("Reset to blue");
  assert.equal(h.value, "#3860f4");
  assert.equal(button(h.tree, "Blue").props["aria-pressed"], true);
});

test("incomplete hex edits retain the saved color and restore its full value on blur", () => {
  for (const draft of ["", "#", "#12", "#gggggg", "#12345g"]) {
    const h = pickerHarness("#234567");
    h.fill("Hex color", draft);
    assert.equal(h.value, "#234567", draft);
    assert.deepEqual(h.changes, []);
    assert.equal(field(h.tree, "Hex color").props.value, draft);
    assert.equal(field(h.tree, "Hex color").props["aria-invalid"], true);
    assert.match(text(h.tree), /Incomplete entries keep your last valid color/);
    h.blur("Hex color");
    assert.equal(field(h.tree, "Hex color").props.value, "#234567");
    assert.equal(field(h.tree, "Hex color").props["aria-invalid"], false);
  }
});

test("complete hex and native color selections accept the full RGB range", () => {
  const h = pickerHarness("#234567");
  h.fill("Hex color", "aBcDeF");
  assert.equal(h.value, "#abcdef");
  assert.equal(field(h.tree, "Hex color").props.value, "#ABCDEF");
  assert.deepEqual(["Red", "Green", "Blue"].map(name => field(h.tree, name).props.value), ["171", "205", "239"]);
  h.fill("Color picker", "#000000");
  assert.equal(h.value, "#000000");
  assert.deepEqual(["Red", "Green", "Blue"].map(name => field(h.tree, name).props.value), ["0", "0", "0"]);
  h.fill("Color picker", "#ffffff");
  assert.equal(h.value, "#ffffff");
  assert.deepEqual(["Red", "Green", "Blue"].map(name => field(h.tree, name).props.value), ["255", "255", "255"]);
});

test("invalid RGB drafts never overwrite a valid color and blur restores the channel", () => {
  for (const draft of ["", "-1", "256", "999", "1.5", "1e2", "blue"]) {
    const h = pickerHarness("#234567");
    h.fill("Red", draft);
    assert.equal(h.value, "#234567", draft);
    assert.deepEqual(h.changes, []);
    assert.equal(field(h.tree, "Red").props.value, draft);
    assert.equal(field(h.tree, "Red").props["aria-invalid"], true);
    h.blur("Red");
    assert.equal(field(h.tree, "Red").props.value, "35");
    assert.equal(field(h.tree, "Red").props["aria-invalid"], false);
  }
  const h = pickerHarness("#234567");
  h.fill("Red", "0");
  assert.equal(h.value, "#004567");
  h.render(); // Settle the value-driven synchronization effect in this shallow harness.
  h.fill("Blue", "255");
  assert.equal(h.value, "#0045ff");
  h.render();
  assert.equal(field(h.tree, "Hex color").props.value, "#0045FF");
});

function dialogHarness(settings = {}) {
  const progress = { settings: { onboarded: false, examDate: "", accentColor: "#3860f4", ...settings } };
  const patches = [];
  const rt = runtime({
    "@/lib/course": { course: { exam: { v1: { lastTestDate: "2027-02-02" }, v2: { firstTestDate: "2027-02-03" } } } },
    "@/lib/plan": {
      daysUntil: date => date === "2026-01-01" ? -1 : date ? 56 : null,
      examDatePatch: examDate => ({ examDate, onboarded: true, track: "v2" }),
      formatExamDate: date => date,
      trackForDate: () => "v2",
      trackLabel: () => "CCNA v2.0",
    },
    "@/lib/store": {
      useProgress: () => progress,
      getProgress: () => progress,
      localDateKey: () => "2026-10-13",
      updateSettings: patch => { patches.push(plain(patch)); Object.assign(progress.settings, patch); },
    },
  });
  const { ExamDateDialog } = rt.load("src/components/ExamDate.tsx");
  let tree;
  const render = () => tree = rt.render(ExamDateDialog);
  const click = label => { button(tree, label).props.onClick(); return render(); };
  const submit = () => { find(tree, node => node.type === "form").props.onSubmit({ preventDefault() {} }); return render(); };
  render();
  return { rt, progress, patches, render, click, submit, get tree() { return tree; } };
}

test("first startup saves the chosen color before the optional exam date and does not repeat setup", () => {
  const h = dialogHarness();
  assert.match(text(h.tree), /Welcome to OpenPackets1 \/ 2Pick a favorite color/);
  assert.equal(button(h.tree, "Continue →").props.disabled, false);
  assert.equal(descendants(h.tree).some(node => node.type?.name === "ExamDatePicker"), false);
  child(h.tree, "AccentColorPicker").props.onChange("#18c9ac");
  h.render();
  assert.equal(h.progress.settings.accentColor, "#18c9ac");
  h.submit();
  assert.match(text(h.tree), /2 \/ 2When is your exam/);
  assert.equal(button(h.tree, "Save date →").props.disabled, true);
  assert.equal(descendants(h.tree).some(node => node.type?.name === "AccentColorPicker"), false);
  h.click("← Color");
  assert.equal(child(h.tree, "AccentColorPicker").props.value, "#18c9ac");
  h.submit();
  h.click("Skip date for now");
  assert.equal(h.progress.settings.onboarded, true);
  assert.equal(h.progress.settings.examDate, "");
  assert.equal(h.progress.settings.accentColor, "#18c9ac");
  assert.equal(descendants(h.tree).some(node => node.type === "form"), false);
  const nextStartup = dialogHarness(h.progress.settings);
  assert.equal(descendants(nextStartup.tree).some(node => node.type === "form"), false);
});

test("returning users open only the exam date dialog and keep their favorite color", () => {
  const h = dialogHarness({ onboarded: true, examDate: "2027-02-12", accentColor: "#123456" });
  assert.equal(descendants(h.tree).some(node => node.type === "form"), false);
  h.rt.window.dispatch("ccna:exam-date");
  h.render();
  assert.match(text(h.tree), /Your examWhen is your exam/);
  assert.doesNotMatch(text(h.tree), /Welcome|Pick a favorite color|1 \/ 2|2 \/ 2|← Color/);
  assert.equal(child(h.tree, "ExamDatePicker").props.value, "2027-02-12");
  h.click("Cancel");
  assert.equal(descendants(h.tree).some(node => node.type === "form"), false);
  assert.deepEqual(h.patches, []);
  assert.equal(h.progress.settings.accentColor, "#123456");
});

test("saving a first-run exam date completes onboarding without replacing the favorite color", () => {
  const h = dialogHarness();
  child(h.tree, "AccentColorPicker").props.onChange("#f36c9c");
  h.submit();
  h.submit(); // A missing date cannot complete setup, including a direct form submission.
  assert.equal(h.progress.settings.onboarded, false);
  child(h.tree, "ExamDatePicker").props.onChange("2026-01-01");
  h.render();
  assert.equal(button(h.tree, "Save date →").props.disabled, true);
  h.submit();
  assert.equal(h.progress.settings.onboarded, false);
  child(h.tree, "ExamDatePicker").props.onChange("2027-02-12");
  h.render();
  assert.equal(button(h.tree, "Save date →").props.disabled, false);
  h.submit();
  assert.equal(h.progress.settings.onboarded, true);
  assert.equal(h.progress.settings.examDate, "2027-02-12");
  assert.equal(h.progress.settings.accentColor, "#f36c9c");
  assert.equal(descendants(h.tree).some(node => node.type === "form"), false);
});

test("dismissing first startup retains a selected color and suppresses another welcome", () => {
  for (const method of ["cancel", "escape", "later"]) {
    const h = dialogHarness();
    child(h.tree, "AccentColorPicker").props.onChange("#000000");
    if (method === "later") h.click("Set up later");
    else {
      let prevented = false;
      const event = { key: "Escape", preventDefault() { prevented = true; }, stopPropagation() {} };
      if (method === "cancel") h.tree.props.onCancel(event);
      else h.tree.props.onKeyDown(event);
      h.render();
      assert.equal(prevented, true);
    }
    assert.equal(h.progress.settings.onboarded, true);
    assert.equal(h.progress.settings.accentColor, "#000000");
    assert.equal(descendants(h.tree).some(node => node.type === "form"), false);
  }
});
