// Validates /content before a build. Exit code 1 on any error.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCourse } from "./load-course.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const course = await loadCourse(path.join(root, "content"));
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const v1Ids = new Set(course.blueprint.v1.map((o) => o.id));
const v2Ids = new Set(course.blueprint.v2.map((o) => o.id));
const partIds = new Set(course.parts.map((p) => p.id));
const domainIds = new Set([...course.domains.v2.map((d) => d.id), "none"]);
const chapterIds = new Set();
const questionIds = new Set();
const cardIds = new Set();
const DIAGRAM_TYPES = new Set(["topology", "sequence", "bits", "binary", "timeline", "matrix", "layers"]);
const NODE_KINDS = new Set(["router", "switch", "l3switch", "pc", "laptop", "server", "ap", "wlc", "phone", "firewall", "cloud", "printer", "hub"]);
const CONTAINERS = new Set(["facts", "trap", "note", "tip", "warning", "expected", "solution", "device"]);
const FLOW_TONES = new Set(["request", "reply", "alt", "warn"]);
const MARK_TONES = new Set(["ok", "warn", "bad", "dim", "accent"]);
const SIDES = new Set(["l", "r", "t", "b"]);

/** The shape of a figure trace (content/FIGURES.md). Whether its nodes and cables exist is checked by
    scripts/check-figures.mjs, which lays each figure out with the app's own engine. */
function checkTrace(where, t) {
  const str = (v) => typeof v === "string" && v.length > 0;
  const texts = (o, what) => { if (o !== undefined && (typeof o !== "object" || Array.isArray(o) || Object.values(o).some((v) => !str(v)))) err(`${where}: ${what} must map node ids to text`); };
  const pair = (p) => Array.isArray(p) && str(p[0]) && str(p[1]) && (p.length === 2 || (p.length === 3 && Number.isInteger(p[2]) && p[2] >= 0));
  for (const f of t.flows ?? []) {
    if (Array.isArray(f?.event)) {
      if (!f.event.every(str)) err(`${where}: an event lists node ids`);
      texts(f.tags, "event tags");
      continue;
    }
    const path = f?.path;
    if (!Array.isArray(path) || path.length < 2) { err(`${where}: a flow needs a path of at least two nodes`); continue; }
    path.forEach((p, i) => { if (!(str(p) || (i === path.length - 1 && Array.isArray(p) && p.length && p.every(str)))) err(`${where}: flow path entries are node ids; only the last may be a list`); });
    if (f.tone && !FLOW_TONES.has(f.tone)) err(`${where}: unknown flow tone "${f.tone}"`);
    texts(f.tags, "flow tags");
    texts(f.backTags, "flow backTags");
    for (const k of ["stop", "stopText", "backStop", "backStopText", "label"]) if (f[k] !== undefined && !str(f[k])) err(`${where}: flow ${k} must be text`);
    if (f.stopText && !f.stop) err(`${where}: a flow's stopText needs a stop`);
    if (f.backStopText && !f.backStop) err(`${where}: a flow's backStopText needs a backStop`);
    for (const k of ["back", "with"]) if (f[k] !== undefined && typeof f[k] !== "boolean") err(`${where}: flow ${k} must be true or false`);
    if (f.wait !== undefined && !(typeof f.wait === "number" && f.wait >= 0)) err(`${where}: flow wait must be a number of seconds`);
  }
  for (const r of t.roles ?? []) {
    if (!str(r?.node) || !str(r?.peer) || !str(r?.text)) err(`${where}: a role needs node, peer and text`);
    if (r?.tone && !MARK_TONES.has(r.tone)) err(`${where}: unknown role tone "${r.tone}"`);
    if (r?.link !== undefined && !(Number.isInteger(r.link) && r.link >= 0)) err(`${where}: a role's link is an index in links`);
  }
  for (const c of t.chips ?? []) if (c?.tone && !MARK_TONES.has(c.tone)) err(`${where}: unknown chip tone "${c.tone}"`);
  for (const m of [...(t.roles ?? []), ...(t.chips ?? [])]) for (const k of ["from", "until"]) if (m?.[k] !== undefined && !(Number.isInteger(m[k]) && m[k] >= 0 && m[k] < (t.flows?.length ?? 0))) err(`${where}: "${k}" must be the index of one of the flows`);
  for (const k of ["cut", "blocked"]) for (const p of t[k] ?? []) if (!pair(p)) err(`${where}: ${k} entries are [node, node] or [node, node, link index]`);
  for (const k of ["down", "focus", "absent"]) if (t[k] !== undefined && !(Array.isArray(t[k]) && t[k].every(str))) err(`${where}: ${k} lists node ids`);
}

function checkMarkdown(where, md) {
  // fences balanced, containers balanced, diagram JSON valid
  const lines = md.split("\n");
  let fence = null;
  let container = 0;
  let buf = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const f = line.match(/^```\s*([a-zA-Z0-9-]*)(.*)$/);
    if (f) {
      if (!fence) {
        fence = f[1] || "text";
        buf = [];
      } else {
        if (fence === "diagram") {
          try {
            const spec = JSON.parse(buf.join("\n"));
            if (!DIAGRAM_TYPES.has(spec.type)) err(`${where}: unknown diagram type "${spec.type}" (line ${i + 1})`);
            if (spec.type === "topology") {
              const ids = new Set();
              for (const n of spec.nodes ?? []) {
                if (!NODE_KINDS.has(n.kind)) err(`${where}: unknown node kind "${n.kind}" in diagram (line ${i + 1})`);
                if (ids.has(n.id)) err(`${where}: duplicate node id ${n.id} in diagram (line ${i + 1})`);
                ids.add(n.id);
                if (typeof n.x !== "number" || typeof n.y !== "number") err(`${where}: node ${n.id} needs numeric x,y (line ${i + 1})`);
              }
              for (const l of spec.links ?? []) if (!ids.has(l.from) || !ids.has(l.to)) err(`${where}: link ${l.from}→${l.to} references unknown node (line ${i + 1})`);
              for (const p of spec.packet?.path ?? []) if (!ids.has(p)) err(`${where}: packet path references unknown node ${p} (line ${i + 1})`);
              for (const l of spec.links ?? []) for (const k of ["fromSide", "toSide"]) if (l[k] !== undefined && !SIDES.has(l[k])) err(`${where}: link ${k} must be l, r, t or b (line ${i + 1})`);
              if (spec.trace) checkTrace(`${where} (line ${i + 1})`, spec.trace);
            }
            if (spec.type === "binary" && !/^\d+\.\d+\.\d+\.\d+$/.test(spec.ip ?? "")) err(`${where}: binary diagram needs an IPv4 "ip" (line ${i + 1})`);
          } catch (e) {
            err(`${where}: diagram JSON does not parse (line ${i + 1}): ${e.message}`);
          }
        }
        // A lab step's network picture: never shown as text, so a bad one would fail silently.
        if (fence === "state") {
          try {
            const st = JSON.parse(buf.join("\n"));
            if (typeof st.status !== "string") err(`${where}: state block needs a "status" string (line ${i + 1})`);
            for (const r of st.rows ?? []) if (!Array.isArray(r) || r.length < 2) err(`${where}: state row must be [label, value, tone?] (line ${i + 1})`);
            const chips = [...(st.chips ?? []), ...(st.prompt ? [st.prompt] : [])];
            for (const ch of chips) if (!ch?.node || typeof ch.text !== "string") err(`${where}: state chip needs "node" and "text" (line ${i + 1})`);
            for (const p of [...(st.pings ?? []), ...(st.ping ? [st.ping] : [])]) if (!Array.isArray(p) || p.length < 2 || (p[2] && p[2] !== "fail")) err(`${where}: state ping must be [from, to] or [from, to, "fail"] (line ${i + 1})`);
            for (const t of [st.tone, ...(st.rows ?? []).map((r) => r[2])]) if (t && !["ok", "warn", "bad", "dim"].includes(t)) err(`${where}: unknown state tone "${t}" (line ${i + 1})`);
            if (st.prompt?.tone && !MARK_TONES.has(st.prompt.tone)) err(`${where}: unknown chip tone "${st.prompt.tone}" (line ${i + 1})`);
            for (const k of ["cabled", "led"]) if (st[k] !== undefined && typeof st[k] !== "boolean") err(`${where}: state ${k} must be true or false (line ${i + 1})`);
            if (st.addressed !== undefined && typeof st.addressed !== "boolean" && !(Array.isArray(st.addressed) && st.addressed.every((x) => typeof x === "string"))) err(`${where}: state addressed is true, false or a list of node ids (line ${i + 1})`);
            if (st.topology !== undefined && !(Number.isInteger(st.topology) && st.topology >= 1)) err(`${where}: state topology counts the lab's topology diagrams from 1 (line ${i + 1})`);
            checkTrace(`${where} (line ${i + 1})`, st);
          } catch (e) {
            err(`${where}: state JSON does not parse (line ${i + 1}): ${e.message}`);
          }
        }
        fence = null;
      }
      continue;
    }
    if (fence) {
      buf.push(line);
      continue;
    }
    const c = line.match(/^:::\s*([a-z]*)/);
    if (c) {
      if (c[1]) {
        if (!CONTAINERS.has(c[1])) err(`${where}: unknown container ":::${c[1]}" (line ${i + 1})`);
        container++;
      } else container--;
    }
    if (/\b(to|or|of|and|is|at|by|in|for|than|from|on|port|preference|configured|down|rising|falling|up|about)\d/.test(line)) warn(`${where}: possible missing space before a number (line ${i + 1}): ${line.trim().slice(0, 80)}`);
  }
  if (fence) err(`${where}: unclosed code fence`);
  if (container !== 0) err(`${where}: unbalanced ::: container`);
  const verify = md.match(/<!--\s*VERIFY[^>]*-->/g);
  if (verify) for (const v of verify) warn(`${where}: ${v}`);
}

function checkObjectives(where, list, set, track) {
  for (const id of list) if (!set.has(id)) err(`${where}: unknown ${track} objective "${id}"`);
}

for (const c of course.chapters) {
  const where = `chapter ${c.folder}`;
  if (chapterIds.has(c.id)) err(`${where}: duplicate chapter id ${c.id}`);
  chapterIds.add(c.id);
  if (!/^[a-z0-9-]+$/.test(c.id)) err(`${where}: id must be kebab-case`);
  if (!c.title) err(`${where}: missing title`);
  if (!partIds.has(c.part)) err(`${where}: unknown part "${c.part}"`);
  if (!domainIds.has(c.domain)) err(`${where}: unknown domain "${c.domain}"`);
  if (!c.summary) warn(`${where}: missing summary`);
  if (c.sections.filter((s) => s.id !== "intro").length < 3) err(`${where}: needs at least 3 sections`);
  if (c.words < 900) warn(`${where}: lesson is short (${c.words} words)`);
  checkObjectives(where, c.objectives.v1, v1Ids, "v1");
  checkObjectives(where, c.objectives.v2, v2Ids, "v2");
  for (const s of c.sections) checkMarkdown(`${where} §${s.id}`, s.body);
  if (!c.lab) warn(`${where}: no lab.md`);
  else {
    if (!c.lab.steps.length) err(`${where}: lab has no "## Step N" sections`);
    for (const s of c.lab.steps) checkMarkdown(`${where} lab ${s.id}`, s.body);
    checkMarkdown(`${where} lab topology`, c.lab.topology);
    checkMarkdown(`${where} lab troubleshooting`, c.lab.troubleshooting);
    checkMarkdown(`${where} lab challenge`, c.lab.challenge);
  }
  // Workload follows content/PRACTICE-PLAN.md; short introductory banks are intentional.
  if (!c.questions.length) warn(`${where}: no checkpoint questions`);
  for (const q of c.questions) {
    const w = `${where} ${q.id}`;
    if (!q.id || questionIds.has(q.id)) err(`${w}: missing or duplicate question id`);
    questionIds.add(q.id);
    if (!["single", "multi"].includes(q.type)) err(`${w}: type must be single|multi`);
    if (![1, 2, 3].includes(q.difficulty)) err(`${w}: difficulty must be 1, 2 or 3`);
    if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 6) err(`${w}: needs 3–6 options`);
    if (!Array.isArray(q.answer) || !q.answer.length || q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= (q.options?.length ?? 0))) err(`${w}: answer must be an array of valid option indices`);
    if (q.type === "single" && q.answer?.length !== 1) err(`${w}: single-answer question must have exactly one answer`);
    if (q.type === "multi" && (q.answer?.length ?? 0) < 2) err(`${w}: multi-answer question needs 2+ answers`);
    if (Array.isArray(q.answer) && new Set(q.answer).size !== q.answer.length) err(`${w}: answer indices must be distinct`);
    if (!q.prompt) err(`${w}: missing prompt`);
    if (!q.explanation) err(`${w}: missing explanation`);
    if (Array.isArray(q.options) && Array.isArray(q.answer)) {
      q.options.forEach((_, i) => {
        if (!q.answer.includes(i) && (typeof q.whyWrong?.[i] !== "string" || !q.whyWrong[i].trim())) err(`${w}: missing explanation for distractor ${i}`);
      });
    }
    if (q.exhibit && !["cli", "diagram"].includes(q.exhibit.kind)) err(`${w}: exhibit.kind must be cli|diagram`);
    if (q.exhibit?.kind === "diagram" && !DIAGRAM_TYPES.has(q.exhibit.spec?.type)) err(`${w}: exhibit diagram has unknown type`);
    for (const o of q.objectives ?? []) {
      const [track, id] = o.split(":");
      if (track === "v1" ? !v1Ids.has(id) : track === "v2" ? !v2Ids.has(id) : true) err(`${w}: bad objective tag "${o}" (use v1:2.5.a / v2:2.5.a)`);
    }
    if (!(q.objectives ?? []).length) warn(`${w}: no objective tags`);
    const lens = q.options.map((o) => o.length);
    const max = Math.max(...lens);
    if (q.type === "single" && lens[q.answer[0]] === max && lens.filter((l) => l === max).length === 1 && max > 1.6 * (lens.reduce((a, b) => a + b, 0) - max) / (lens.length - 1)) warn(`${w}: correct option is conspicuously the longest`);
    checkMarkdown(w, q.explanation);
  }
  if (!c.cards.length) warn(`${where}: no flashcards`);
  for (const k of c.cards) {
    if (!k.id || cardIds.has(k.id)) err(`${where}: missing or duplicate card id ${k.id}`);
    cardIds.add(k.id);
    if (!k.front || !k.back) err(`${where} ${k.id}: card needs front and back`);
  }
  for (const d of c.commands) {
    if (!d.id || !d.task || !d.answer) err(`${where}: command drill ${d.id ?? "?"} needs id, task, answer`);
  }
  for (const t of c.tickets) {
    if (!t.id || !t.title || !t.scenario || !Array.isArray(t.options) || !Array.isArray(t.answer)) err(`${where}: ticket ${t.id ?? "?"} is incomplete`);
    if (t.answer?.some((a) => a < 0 || a >= t.options.length)) err(`${where}: ticket ${t.id} has an invalid answer index`);
  }
  for (const p of c.prereqs) if (!course.chapters.some((x) => x.id === p)) err(`${where}: unknown prereq "${p}"`);
  for (const s of c.sources) {
    try {
      if (new URL(s.url).protocol !== "https:") warn(`${where}: non-https source ${s.url}`);
    } catch {
      err(`${where}: invalid source url ${s.url}`);
    }
  }
}

// Objective coverage
for (const track of ["v1", "v2"]) {
  const set = track === "v1" ? course.blueprint.v1 : course.blueprint.v2;
  const covered = new Set(course.chapters.flatMap((c) => c.objectives[track]));
  const missing = set.filter((o) => !covered.has(o.id)).map((o) => o.id);
  if (missing.length) warn(`${track}: objectives not yet mapped to any chapter: ${missing.join(", ")}`);
}

const totals = {
  chapters: course.chapters.length,
  words: course.chapters.reduce((n, c) => n + c.words, 0),
  questions: course.chapters.reduce((n, c) => n + c.questions.length, 0),
  cards: course.chapters.reduce((n, c) => n + c.cards.length, 0),
  commands: course.chapters.reduce((n, c) => n + c.commands.length, 0),
  tickets: course.chapters.reduce((n, c) => n + c.tickets.length, 0),
};
console.log(JSON.stringify(totals));
for (const w of warnings) console.warn("warn  " + w);
for (const e of errors) console.error("ERROR " + e);
console.log(`${errors.length} errors, ${warnings.length} warnings`);
if (errors.length) process.exit(1);
