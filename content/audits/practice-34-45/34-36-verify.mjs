// Integrity and real React rendering for the chapters 34–36 practice rewrite.
// These checks do not execute a networking lab or measure learner difficulty.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadCourse} from '../../../scripts/load-course.mjs';
import {runtime} from '../../../scripts/tests/runtime.mjs';

const root = new URL('../../../', import.meta.url);
const baseline = JSON.parse(fs.readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'));
const course = await loadCourse(fileURLToPath(new URL('content/', root)));
const chapters = course.chapters.filter(c => c.number >= 34 && c.number <= 36);
const banks = ['questions', 'cards', 'commands', 'tickets'];
assert.equal(chapters.length, 3);
assert.equal(course.chapters.length, baseline.chapters.length);

const decisions = ['34-36'].flatMap(range => {
  const entries = JSON.parse(fs.readFileSync(new URL(`./${range}-decisions.json`, import.meta.url), 'utf8'));
  assert.ok(Array.isArray(entries), range + ': decisions must be an array');
  return entries;
});
const ledger = new Map();
const allItems = new Map(course.chapters.flatMap(c => banks.flatMap(bank => c[bank].map(item => [item.id, {chapterId: c.id, bank, item}]))));
for (const d of decisions) {
  assert.ok(chapters.some(c => c.id === d.chapterId), d.id + ': ledger chapter outside scope');
  assert.ok(banks.includes(d.bank), d.id + ': unknown bank');
  assert.ok(['keep', 'revise', 'retire', 'add'].includes(d.action), d.id + ': unknown action');
  assert.ok(typeof d.reason === 'string' && d.reason.trim().length > 15, d.id + ': decision needs a reason');
  const key = `${d.chapterId}/${d.bank}/${d.id}`;
  assert.ok(!ledger.has(key), key + ': duplicate ledger entry');
  ledger.set(key, d);
  if (d.destination) {
    assert.equal(typeof d.destination, 'string', d.id + ': destination must name a stable item ID');
    assert.ok(allItems.has(d.destination), d.id + ': missing stated destination ' + d.destination);
    assert.notEqual(d.destination, d.id, d.id + ': cannot defer to itself');
  }
}

let untouchedFiles = 0;
// Preserve every application/script file and every chapter outside this batch.
for (const [path, hash] of Object.entries(baseline.files)) {
  const chapter = /^content\/chapters\/(\d+)-/.exec(path);
  const outsideChapter = chapter && (Number(chapter[1]) < 34 || Number(chapter[1]) > 45);
  if (path.startsWith('src/') || path.startsWith('scripts/') || path.startsWith('public/') || outsideChapter || ['README.md', 'package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'vite.config.ts', 'content/blueprint.json', 'content/course.json', 'content/AUTHORING.md'].includes(path)) {
    const bytes = fs.readFileSync(new URL(path, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path + ': outside-scope change');
    untouchedFiles++;
  }
}

for (const c of course.chapters) {
  const old = baseline.chapters.find(b => b.id === c.id);
  assert.ok(old, c.id + ': missing original identity');
  assert.equal(c.number, old.number, c.id + ': chapter number changed');
  assert.deepEqual(c.sections.map(s => s.id), old.sections.map(s => s.id), c.id + ': lesson section identity/order changed');
  for (const p of c.prereqs) assert.ok(course.chapters.some(x => x.id === p && x.number < c.number), c.id + ': broken prerequisite ' + p);
}

const require = createRequire(import.meta.url);
const app = runtime({
  react: require('react'),
  'react/jsx-runtime': require('react/jsx-runtime'),
  marked: require('marked'),
  '@/lib/store': {prefersReducedMotion: () => false},
});
const Markdown = app.load('src/components/Markdown.tsx').default;
const CodeBlock = app.load('src/components/Markdown.tsx').CodeBlock;
const Diagram = app.load('src/components/Diagram.tsx').default;
let rendered = 0;
function checkHtml(html, label) {
  assert.ok(!/<[^>]*\bNaN\b/.test(html), label + ': invalid rendered number');
  assert.ok(!/<(?:cr|interface|ip|mac|address|port)(?:\s|>)/i.test(html), label + ': unescaped command placeholder');
  rendered++;
}
function render(text, label) {
  assert.equal(typeof text, 'string', label + ': expected text');
  assert.ok(!/<!--\s*VERIFY|\bTODO\b|\bTBD\b/.test(text), label + ': unresolved placeholder');
  const html = renderToStaticMarkup(createElement(Markdown, {text}));
  if (text.trim()) assert.ok(html.length, label + ': empty render');
  assert.ok(!/<details[^>]*\sopen[=\s>]/.test(html), label + ': solution open before attempt');
  assert.ok(!html.includes(':::solution') && !html.includes(':::expected'), label + ': unparsed learning container');
  checkHtml(html, label);
}
function output(exhibit, label) {
  assert.ok(exhibit.text?.trim(), label + ': empty exhibit');
  checkHtml(renderToStaticMarkup(createElement(CodeBlock, {lang: 'output', title: exhibit.title, text: exhibit.text})), label);
}
const rows = [];
const identities = new Set();
let checkedDecisions = 0;
for (const c of chapters) {
  const before = baseline.chapters.find(b => b.id === c.id);
  for (const bank of banks) {
    const old = new Map(before[bank].map(item => [item.id, item]));
    const now = new Map(c[bank].map(item => [item.id, item]));
    for (const id of new Set([...old.keys(), ...now.keys()])) {
      const d = ledger.get(`${c.id}/${bank}/${id}`);
      assert.ok(d, id + ': missing decision');
      const action = !old.has(id) ? 'add' : !now.has(id) ? 'retire' : isDeepStrictEqual(old.get(id), now.get(id)) ? 'keep' : 'revise';
      assert.equal(d.action, action, id + ': decision disagrees with actual edit');
      checkedDecisions++;
    }
  }
  assert.ok(c.lab?.topology && c.lab?.troubleshooting && c.lab?.challenge, c.id + ': incomplete lab');
  assert.equal(c.minutes.lab, c.lab.minutes, c.id + ': inconsistent advertised lab time');
  for (const field of ['intro', 'topology', 'troubleshooting', 'challenge']) render(c.lab[field], c.id + ':lab:' + field);
  assert.ok(c.lab.challenge.includes(':::solution'), c.id + ': challenge needs a concealed solution');
  for (const [i, step] of c.lab.steps.entries()) {
    assert.equal(step.n, i + 1, c.id + ': nonsequential lab');
    assert.ok(/:::(?:expected|solution)\b/.test(step.body), c.id + ':' + step.id + ': missing expected observations or worked solution');
    render(step.body, c.id + ':' + step.id);
  }
  for (const s of c.sections) render(s.body, c.id + ':' + s.id);
  assert.ok(c.questions.length && c.cards.length, c.id + ': empty practice');
  const levels = c.questions.map(q => q.difficulty);
  assert.deepEqual(levels, [...levels].sort((a, b) => a - b), c.id + ': checkpoint should progress from foundations to application/analysis');
  for (const bank of banks) for (const item of c[bank]) {
    assert.ok(!identities.has(item.id), item.id + ': duplicate identity');
    identities.add(item.id);
    if (bank === 'questions' || bank === 'tickets') {
      assert.ok(item.answer.length, item.id + ': missing answer');
      assert.equal(new Set(item.answer).size, item.answer.length, item.id + ': duplicate answer');
      for (const a of item.answer) assert.ok(Number.isInteger(a) && a >= 0 && a < item.options.length, item.id + ': bad answer index');
      item.options.forEach((option, i) => render(option, item.id + ':option:' + i));
      render(item.explanation, item.id + ':explanation');
      if (bank === 'questions') {
        assert.ok([1, 2, 3].includes(item.difficulty), item.id + ': invalid demand');
        assert.ok(item.type === 'multi' ? item.answer.length >= 2 : item.answer.length === 1, item.id + ': type/key mismatch');
        for (let i = 0; i < item.options.length; i++) if (!item.answer.includes(i)) assert.ok(item.whyWrong?.[i]?.trim(), item.id + ': unexplained distractor ' + i);
        render(item.prompt, item.id + ':prompt');
        for (const [i, explanation] of Object.entries(item.whyWrong || {})) render(explanation, item.id + ':wrong:' + i);
        if (item.exhibit?.kind === 'cli') output(item.exhibit, item.id + ':exhibit');
        if (item.exhibit?.kind === 'diagram') checkHtml(renderToStaticMarkup(createElement(Diagram, {spec: item.exhibit.spec})), item.id + ':diagram');
      } else {
        render(item.scenario, item.id + ':scenario');
        render(item.question, item.id + ':question');
        if (item.fix) render(item.fix, item.id + ':fix');
        item.exhibits.forEach((exhibit, i) => output(exhibit, item.id + ':exhibit:' + i));
      }
    } else if (bank === 'cards') {
      render(item.front, item.id + ':front');
      render(item.back, item.id + ':back');
    } else {
      assert.ok(item.answer?.trim() && item.mode?.trim(), item.id + ': incomplete drill');
      render(item.task, item.id + ':task');
      render(item.note, item.id + ':note');
    }
  }
  rows.push({number: c.number, id: c.id, questions: c.questions.length, levels: [1, 2, 3].map(n => levels.filter(l => l === n).length), cards: c.cards.length, drills: c.commands.length, tickets: c.tickets.length, steps: c.lab.steps.length, labMinutes: c.lab.minutes});
}
assert.equal(checkedDecisions, ledger.size, 'ledger includes nonexistent practice identities');
console.log(JSON.stringify({result: 'passed', rows, checkedDecisions, renderedFragments: rendered, untouchedFiles, applicationAndStylesUnchanged: true}, null, 2));
