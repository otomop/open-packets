import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { loadCourse } from "../load-course.mjs";

const course = await loadCourse(path.resolve("content"));
const plans = JSON.parse(await fs.readFile("content/command-curriculum.json", "utf8"));
test("each chapter has a command-practice goal, suitable demand and an explicit alternative when empty", () => {
  assert.equal(plans.length, course.chapters.length);
  const chapterIds = new Set(course.chapters.map(ch => ch.id));
  assert.equal(new Set(plans.map(p => p.chapterId)).size, plans.length);
  for (const chapter of course.chapters) {
    const plan = plans.find(p => p.chapterId === chapter.id);
    assert.ok(plan, `${chapter.id}: command plan`);
    assert.ok(typeof plan.goal === "string" && plan.goal.trim(), `${chapter.id}: goal`);
    assert.ok(["foundation", "application", "analysis"].includes(plan.demand), `${chapter.id}: demand`);
    if (!chapter.commands.length) assert.ok(plan.emptyReason?.trim(), `${chapter.id}: reason for no command-recall bank`);
    assert.ok(Array.isArray(plan.reviewLinks) && plan.reviewLinks.length <= 2);
    for (const link of plan.reviewLinks) {
      assert.ok(chapterIds.has(link.chapterId) && link.chapterId !== chapter.id, `${chapter.id}: related chapter`);
      assert.ok(link.reason?.trim(), `${chapter.id}: review purpose`);
    }
  }
});

test("every selected command has a valid lesson link, concise help and exact grading roles", () => {
  const ids = new Set();
  for (const chapter of course.chapters) for (const command of chapter.commands) {
    const label = `${chapter.id}/${command.id}`;
    assert.ok(!ids.has(command.id), `Duplicate command: ${label}`); ids.add(command.id);
    for (const key of ["task", "mode", "answer"]) assert.ok(typeof command[key] === "string" && command[key].trim(), `${label}: ${key}`);
    const guide = command.teaching;
    assert.ok(guide, `${label}: teaching`);
    assert.ok(chapter.sections.some(section => section.id === guide.sectionId), `${label}: missing lesson section ${guide.sectionId}`);
    for (const key of ["hint", "takeaway"]) assert.ok(typeof guide[key] === "string" && guide[key].trim(), `${label}: ${key}`);
    for (const obsolete of ["purpose", "before", "verify"]) assert.equal(guide[obsolete], undefined, `${label}: obsolete duplicated ${obsolete}`);
    assert.equal(command.note, undefined, `${label}: keep the useful explanation in one takeaway`);
    assert.ok(["core", "supporting"].includes(guide.focus), `${label}: focus`);
    for (const [track, focus] of Object.entries(guide.focusByTrack ?? {})) assert.ok(["v1", "v2"].includes(track) && ["core", "supporting"].includes(focus), `${label}: track focus`);
    assert.ok(Array.isArray(guide.syntax) && guide.syntax.length > 0, `${label}: syntax`);
    assert.equal(guide.syntax.map(part => part.text).join(" "), command.answer, `${label}: syntax must reconstruct answer`);
    for (const part of guide.syntax) {
      assert.ok(["keyword", "argument", "interface"].includes(part.kind), `${label}: syntax role`);
      assert.equal(part.text, part.text.trim(), `${label}: syntax whitespace`);
      assert.equal(part.meaning, undefined, `${label}: removed per-token narration`);
    }
  }
});

test("the chapter audit accounts for every original item and each retained or added item", async () => {
  const dir = "content/audits/command-relevance-2026-09-27";
  const before = JSON.parse(await fs.readFile(`${dir}/before.json`, "utf8"));
  const reviews = (await Promise.all(["00-15", "16-30", "31-45"].map(async range => JSON.parse(await fs.readFile(`${dir}/${range}.json`, "utf8"))))).flatMap(r => r.chapters);
  assert.equal(reviews.length, course.chapters.length);
  for (const chapter of course.chapters) {
    const review = reviews.find(r => r.chapterId === chapter.id);
    assert.ok(review, `${chapter.id}: audit`);
    const plan = plans.find(p => p.chapterId === chapter.id);
    for (const field of ["goal", "demand", "emptyReason", "reviewLinks"]) assert.deepEqual(plan[field], review[field], `${chapter.id}: plan differs from final review's ${field}`);
    const original = before.filter(d => d.chapterId === chapter.id);
    assert.equal(review.beforeCount, original.length, `${chapter.id}: baseline count`);
    assert.equal(new Set(review.decisions.map(d => d.id)).size, review.decisions.length, `${chapter.id}: unique decisions`);
    for (const item of original) assert.ok(review.decisions.some(d => d.id === item.id && d.action !== "add"), `${item.id}: missing original-item decision`);
    for (const decision of review.decisions) {
      assert.ok(["keep", "revise", "retire", "add"].includes(decision.action), `${decision.id}: action`);
      assert.ok(decision.reason?.trim(), `${decision.id}: rationale`);
      assert.equal(chapter.commands.some(d => d.id === decision.id), decision.action !== "retire", `${decision.id}: content disagrees with audit`);
      assert.equal(original.some(d => d.id === decision.id), decision.action !== "add", `${decision.id}: original vs new identity`);
    }
    for (const item of chapter.commands) assert.ok(review.decisions.some(d => d.id === item.id), `${item.id}: unaudited current item`);
  }
});
