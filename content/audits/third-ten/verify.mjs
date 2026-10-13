// Content integrity and actual React-rendering checks for the reviewed batch.
// This does not certify networking facts or execute Packet Tracer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadCourse} from '../../../scripts/load-course.mjs';
import {runtime} from '../../../scripts/tests/runtime.mjs';
import {fileURLToPath} from 'node:url';

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
const course = await loadCourse(fileURLToPath(new URL('../../', import.meta.url)));
const chapters = course.chapters.filter(c => c.number >= 16 && c.number < 26);
assert.equal(chapters.length, 10);
const baseline = JSON.parse(fs.readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'));
assert.equal(course.chapters.length, baseline.chapters.length, 'missing or extra chapter');
for (const c of course.chapters) {
 const before=baseline.chapters.find(b=>b.id===c.id);
 assert.ok(before, c.id+': missing original chapter identity');
 assert.equal(c.number,before.number,c.id+': changed chapter number');
 for (const p of c.prereqs) {
  const prereq=course.chapters.find(x=>x.id===p);
  assert.ok(prereq && prereq.number<c.number,c.id+': missing or later prerequisite '+p);
 }
 const ids=c.sections.map(s=>s.id);
 assert.equal(new Set(ids).size,ids.length,c.id+': duplicate section identity');
 // Renamed/reordered headings that retain their topic must keep the old identity.
 // Reports document any merged or replaced topics rather than silently reusing them.
 for(const s of c.sections) {
  for(const m of s.body.matchAll(/\]\(#\/chapter\/([a-z0-9-]+)(?:\/[^)]*)?\)/g)) {
   assert.ok(course.chapters.some(target=>target.id===m[1]),c.id+': broken chapter link '+m[1]);
  }
 }
}
let rendered = 0;
const rows = [];
const ids = new Set();
function render(text, label) {
  assert.equal(typeof text, 'string', label);
  assert.ok(!/<!--\s*VERIFY|\bTODO\b|\bTBD\b/.test(text), label + ': unresolved placeholder');
  const html = renderToStaticMarkup(createElement(Markdown, {text}));
  assert.ok(!html.includes('NaN'), label + ': invalid rendered number');
  assert.ok(!/<(?:cr|interface|ip|mac|address|port)(?:\s|>)/i.test(html), label + ': command placeholder rendered as HTML');
  if (text.trim()) assert.ok(html.length > 0, label + ': empty render');
  rendered++;
}
function renderOutput(exhibit, label) {
  assert.equal(typeof exhibit.text, 'string', label);
  assert.ok(exhibit.text.trim(), label + ': empty exhibit');
  const html = renderToStaticMarkup(createElement(CodeBlock, {lang: 'output', title: exhibit.title, text: exhibit.text}));
  assert.ok(!html.includes('NaN'), label + ': invalid rendered number');
  assert.ok(!/<(?:cr|interface|ip|mac|address|port)(?:\s|>)/i.test(html), label + ': unescaped output placeholder');
  rendered++;
}
for (const c of chapters) {
  const before = baseline.chapters.find(b => b.id === c.id);
  const currentSections = new Set(c.sections.map(s => s.id));
  // Intro text is not a checkable reading section and may be folded into the first topic.
  const mergedSections = c.id === 'ospfv3' ? new Set(['lsas-where-the-prefixes-went']) : new Set();
  for (const section of before.sections.filter(s => s.id !== 'intro' && !mergedSections.has(s.id))) assert.ok(currentSections.has(section.id), c.id + ': lost section identity ' + section.id);
  assert.equal(c.questions.length, 16, c.id + ': reviewed question count');
  assert.equal(c.cards.length, 20, c.id + ': reviewed card count');
  assert.ok(c.commands.length >= 10, c.id + ': insufficient command practice');
  assert.equal(c.tickets.length, 2, c.id + ': reviewed ticket count');
  for (const s of c.sections) render(s.body, c.id + ':' + s.id);
  assert.ok(c.lab?.topology && c.lab?.troubleshooting && c.lab?.challenge, c.id + ': incomplete lab structure');
  for (const field of ['intro', 'topology', 'troubleshooting', 'challenge']) render(c.lab[field], c.id + ':lab:' + field);
  c.lab.steps.forEach((s, i) => {
    assert.equal(s.n, i + 1, c.id + ': nonsequential lab step');
    assert.ok(s.body.includes(':::expected'), c.id + ':' + s.id + ': no expected observations');
    render(s.body, c.id + ':' + s.id);
  });
  assert.ok(c.questions.filter(q => q.type === 'multi').length >= 2, c.id + ': insufficient multi-answer practice');
  assert.ok(c.questions.filter(q => q.exhibit).length >= 4, c.id + ': insufficient output/diagram practice');
  for (const bank of ['questions', 'cards', 'commands', 'tickets']) for (const item of c[bank]) {
    assert.ok(!ids.has(item.id), item.id + ': duplicate identity');
    ids.add(item.id);
    if (bank === 'questions' || bank === 'tickets') {
      assert.ok(item.answer.length > 0, item.id);
      assert.equal(new Set(item.answer).size, item.answer.length, item.id);
      for (const a of item.answer) assert.ok(Number.isInteger(a) && a >= 0 && a < item.options.length, item.id);
      if (bank === 'questions') {
        assert.equal(item.type === 'multi' ? item.answer.length >= 2 : item.answer.length === 1, true, item.id);
        for (let i = 0; i < item.options.length; i++) if (!item.answer.includes(i)) assert.ok(item.whyWrong?.[i]?.trim(), item.id + ': unexplained distractor ' + i);
        render(item.prompt, item.id + ':prompt');
        for (const [i, explanation] of Object.entries(item.whyWrong)) render(explanation, item.id + ':wrong:' + i);
        if (item.exhibit?.kind === 'diagram') {
          const html = renderToStaticMarkup(createElement(Diagram, {spec: item.exhibit.spec}));
          assert.ok(!html.includes('NaN'), item.id + ': invalid exhibit');
          rendered++;
        }
        if (item.exhibit?.kind === 'cli') renderOutput(item.exhibit, item.id + ':exhibit');
      } else {
        render(item.scenario, item.id + ':scenario');
        render(item.question, item.id + ':question');
        if (item.fix) render(item.fix, item.id + ':fix');
        item.exhibits.forEach((exhibit, i) => renderOutput(exhibit, item.id + ':exhibit:' + i));
      }
      render(item.explanation, item.id + ':explanation');
      item.options.forEach((option, i) => render(option, item.id + ':option:' + i));
    } else if (bank === 'cards') {
      render(item.front, item.id + ':front');
      render(item.back, item.id + ':back');
    } else {
      assert.ok(item.answer?.trim() && item.mode?.trim(), item.id);
      render(item.task, item.id + ':task');
      render(item.note, item.id + ':note');
    }
  }
  rows.push({chapter: c.number, title: c.title, lessonWords: c.words, steps: c.lab.steps.length,
    questions: c.questions.length, cards: c.cards.length, drills: c.commands.length, tickets: c.tickets.length});
}
console.log(JSON.stringify({rows, renderedFragments: rendered, result: 'passed'}, null, 2));

