import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {loadCourse, splitSections} from './load-course.mjs';
import {partitionCourse} from './course-assets.mjs';
import {runtime} from './tests/runtime.mjs';

const source = await loadCourse(fileURLToPath(new URL('../content', import.meta.url)));
const {catalog, details, banks} = partitionCourse(source);
test('renamed and reordered lesson headings keep saved reading identities', () => {
  const sections = splitSections('Intro\n## Verify access\nCheck it.\n## Local accounts\nConfigure it.', {
    'Local accounts': 'passwords-and-users', 'Verify access': 'reading-the-output',
  });
  assert.deepEqual(sections.map(s => [s.id, s.title]), [
    ['intro', ''], ['reading-the-output', 'Verify access'], ['passwords-and-users', 'Local accounts'],
  ]);
});
test('invalid section identity mappings fail instead of losing or merging reading progress', () => {
  assert.throws(() => splitSections('## Actual\nBody', {Missing: 'old'}), /missing heading/);
  assert.throws(() => splitSections('## Actual\nBody', {Actual: 'intro'}), /Invalid stable/);
  assert.throws(() => splitSections('## A\nOne\n## B\nTwo', {A: 'same', B: 'same'}), /Duplicate stable/);
});
test('catalog preserves every chapter, source and progress identity without teaching payloads', () => {
  assert.deepEqual(catalog.chapters.map(c => c.id), source.chapters.map(c => c.id));
  for (const c of source.chapters) {
    const summary = catalog.chapters.find(s => s.id === c.id);
    assert.deepEqual(summary.sources, c.sources);
    for (const field of ['sections', 'questions', 'cards', 'commands', 'tickets']) {
      assert.deepEqual(summary[field].map(x => x.id), c[field].map(x => x.id));
    }
    assert.ok(summary.sections.every(s => !('body' in s)));
    assert.ok(summary.questions.every(q => !('explanation' in q)));
    assert.ok(summary.cards.every(k => !('back' in k)));
    assert.deepEqual(details[c.id], {sections: c.sections, lab: c.lab});
    assert.deepEqual(summary.lab?.steps.map(s => s.id), c.lab?.steps.map(s => s.id));
  }
});
test('lazy banks retain every original answer, explanation, exhibit and chapter association', () => {
  for (const field of ['questions', 'cards', 'commands', 'tickets']) {
    assert.equal(banks[field].length, source.chapters.reduce((n,c) => n+c[field].length, 0));
    for (const c of source.chapters) for (const original of c[field]) {
      const stored = banks[field].find(x => x.id === original.id && x.chapterId === c.id);
      assert.ok(stored);
      for (const key of Object.keys(original)) assert.deepEqual(stored[key], original[key]);
    }
  }
});
test('catalog is under 15% of the original full-course payload', () => {
  assert.ok(Buffer.byteLength(JSON.stringify(catalog)) < Buffer.byteLength(JSON.stringify(source)) * .15);
});

test('foundation prerequisites stay on both study paths without invented objective tags', () => {
  const {isRequired} = runtime({'virtual:course': {default: catalog}}).load('src/lib/course.ts');
  for (const chapter of catalog.chapters.filter(c => c.number <= 7)) {
    assert.equal(isRequired(chapter, 'v1'), true, chapter.id);
    assert.equal(isRequired(chapter, 'v2'), true, chapter.id);
  }
  const prerequisite = {...catalog.chapters[1], objectives: {v1: [], v2: []}};
  assert.equal(isRequired(prerequisite, 'v1'), true);
  assert.equal(isRequired(prerequisite, 'v2'), true);
  const trackSpecific = {...prerequisite, part: 'routing', objectives: {v1: ['3.5'], v2: []}};
  assert.equal(isRequired(trackSpecific, 'v1'), true);
  assert.equal(isRequired(trackSpecific, 'v2'), false);
});
