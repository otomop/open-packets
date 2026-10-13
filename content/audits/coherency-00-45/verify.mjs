// Verify the full-course coherency pass against its pre-edit working-tree snapshot.
// Structural/rendering checks complement the documented human-readable sequence review.
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
const here = new URL('./', import.meta.url);
const baseline = JSON.parse(fs.readFileSync(new URL('baseline.json', here)));
const course = await loadCourse(fileURLToPath(new URL('content/', root)));
const chapters = course.chapters;
const banks = ['questions','cards','commands','tickets'];
assert.equal(chapters.length,46);
assert.equal(fs.existsSync(new URL('.github/workflows/pages.yml',root)),false,'Pages deployment must remain absent');
const coverage = ['00-11','12-23','24-35','36-45'].flatMap(r=>JSON.parse(fs.readFileSync(new URL(r+'-coverage.json',here))));
assert.equal(coverage.length,46);
assert.equal(new Set(coverage.map(c=>c.chapterId)).size,46);
let protectedFiles=0;
for(const [p,hash] of Object.entries(baseline.files)){
 if(p.startsWith('content/chapters/') || p==='content/CHAPTERS.md')continue;
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex'),hash,p+': protected file changed');protectedFiles++;
}
const changedItems=[];
for(const c of chapters){
 const before=baseline.chapters.find(x=>x.id===c.id);assert.ok(before,c.id);
 assert.equal(c.number,before.number,c.id+': number');
 assert.deepEqual(c.objectives,before.objectives,c.id+': objective scope');
 assert.deepEqual(c.sections.map(s=>s.id),before.sections.map(s=>s.id),c.id+': section identity/order');
 assert.deepEqual(c.lab.steps.map(s=>s.id),before.lab.steps.map(s=>s.id),c.id+': lab identity/order');
 for(const p of c.prereqs)assert.ok(chapters.some(x=>x.id===p&&x.number<c.number),c.id+': invalid/later prerequisite '+p);
 for(const bank of banks){
  assert.deepEqual(c[bank].map(x=>x.id),before[bank].map(x=>x.id),c.id+': '+bank+' identities/order');
  for(let i=0;i<c[bank].length;i++)if(!isDeepStrictEqual(c[bank][i],before[bank][i]))changedItems.push({chapterId:c.id,bank,id:c[bank][i].id});
 }
 const review=coverage.find(x=>x.chapterId===c.id);assert.ok(review,c.id+': review');assert.equal(review.number,c.number);assert.equal(review.status,'reviewed');
 assert.ok(review.practiceDemands.length&&review.introduced.length,c.id+': incomplete coverage');
 for(const e of review.entry){const owner=chapters.find(x=>x.id===e.chapterId);assert.ok(owner&&owner.number<c.number,c.id+': forward entry '+e.chapterId);assert.ok(owner.sections.some(s=>s.id===e.sectionId),c.id+': missing entry anchor '+e.sectionId);}
 for(const e of review.introduced)assert.ok(c.sections.some(s=>s.id===e.sectionId),c.id+': missing own anchor '+e.sectionId);
 for(const id of review.laterDependents)assert.ok(chapters.some(x=>x.id===id&&x.number>c.number),c.id+': bad dependent '+id);
 const expected=['chapter.md','lab.md',...banks.map(b=>b+'.json')].map(f=>'content/chapters/'+c.folder+'/'+f).filter(p=>fs.existsSync(new URL(p,root)));
 assert.deepEqual([...review.filesRead].sort(),expected.sort(),c.id+': incomplete file review');
}
const decisions=JSON.parse(fs.readFileSync(new URL('practice-changes.json',here)));
assert.deepEqual(decisions.map(({chapterId,bank,id})=>({chapterId,bank,id})),changedItems,'practice change ledger must match actual changes');
for(const d of decisions)assert.ok(d.action==='revise'&&d.reason.length>30,d.id+': explain the coherence correction');

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
  checkHtml(html, label);
}
function output(exhibit, label) {
  assert.ok(exhibit.text?.trim(), label + ': empty exhibit');
  checkHtml(renderToStaticMarkup(createElement(CodeBlock, {lang: 'output', title: exhibit.title, text: exhibit.text})), label);
}

const rows=[];
const identities=new Set();
for(const c of chapters){
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

const result={result:'passed',chapters:46,reviewedFiles:coverage.reduce((n,c)=>n+c.filesRead.length,0),protectedFiles,renderedFragments:rendered,practiceItems:identities.size,changedItems,rows,applicationAndStylesUnchanged:true,chapterSectionLabAndPracticeIdentitiesPreserved:true};
fs.writeFileSync(new URL('verification.json',here),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,rows:undefined},null,2));
