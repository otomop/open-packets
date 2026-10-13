import { chapters, domainsFor, objectivesFor, questionBank } from "./course";
import type { Progress, Track } from "./types";

export interface ObjectiveMastery {
  id: string; // bare id, e.g. "2.5.a"
  text: string;
  domain: string;
  seen: number;
  correct: number;
  recent: number; // weighted recent accuracy 0..1, or -1 when unseen
  chapters: string[];
}

/** Recency-weighted accuracy from a history string like "cwwcc" (most recent last). */
export function recentAccuracy(history: string): number {
  if (!history) return -1;
  let w = 0, s = 0, weight = 1;
  for (let i = history.length - 1; i >= 0 && history.length - i <= 6; i--) {
    w += weight;
    if (history[i] === "c") s += weight;
    weight *= 0.8;
  }
  return s / w;
}

const indexes = new Map<Track, ReturnType<typeof buildIndex>>();
function buildIndex(track: Track) {
  return objectivesFor(track).map(o => {
    const tag = `${track}:${o.id}`;
    return { objective: o, questionIds: questionBank.filter(q => q.objectives.some(t => t === tag || t.startsWith(tag + "."))).map(q => q.id),
      chapterIds: chapters.filter(c => c.objectives[track].some(id => id === o.id || id.startsWith(o.id + "."))).map(c => c.id) };
  });
}
const objectiveCache = new WeakMap<Progress["questions"], Map<Track, ObjectiveMastery[]>>();
export function objectiveMastery(p: Progress, track: Track): ObjectiveMastery[] {
  let cache = objectiveCache.get(p.questions);
  if (!cache) { cache = new Map(); objectiveCache.set(p.questions, cache); }
  const cached = cache.get(track);
  if (cached) return cached;
  let index = indexes.get(track);
  if (!index) { index = buildIndex(track); indexes.set(track, index); }
  const result = index.map(({ objective: o, questionIds, chapterIds }) => {
    let seen = 0, correct = 0, num = 0, den = 0;
    for (const id of questionIds) {
      const st = p.questions[id];
      if (!st) continue;
      seen += st.seen;
      correct += st.correct;
      const r = recentAccuracy(st.history);
      if (r >= 0) {
        num += r;
        den += 1;
      }
    }
    return { id: o.id, text: o.text, domain: o.domain, seen, correct, recent: den ? num / den : -1, chapters: chapterIds };
  });
  cache.set(track, result);
  return result;
}

export interface DomainMastery {
  id: string;
  title: string;
  weight: number;
  n: string;
  score: number; // 0..100 blended: 60% question accuracy, 40% chapter completion
  accuracy: number; // -1 unseen
  chaptersDone: number;
  chaptersTotal: number;
  weakest: ObjectiveMastery | null;
}

const domainCache = new WeakMap<Progress["questions"], WeakMap<Progress["chapters"], Map<Track, DomainMastery[]>>>();
export function domainMastery(p: Progress, track: Track): DomainMastery[] {
  let byChapter = domainCache.get(p.questions);
  if (!byChapter) { byChapter = new WeakMap(); domainCache.set(p.questions, byChapter); }
  let cache = byChapter.get(p.chapters);
  if (!cache) { cache = new Map(); byChapter.set(p.chapters, cache); }
  const cached = cache.get(track);
  if (cached) return cached;
  const om = objectiveMastery(p, track);
  const result = domainsFor(track).map((d) => {
    const objs = om.filter((o) => o.domain === d.id);
    const seen = objs.filter((o) => o.recent >= 0);
    const accuracy = seen.length ? seen.reduce((n, o) => n + o.recent, 0) / seen.length : -1;
    const chapIds = new Set(objs.flatMap((o) => o.chapters));
    const chaptersTotal = chapIds.size;
    const chaptersDone = [...chapIds].filter((id) => p.chapters[id]?.completed).length;
    const completion = chaptersTotal ? chaptersDone / chaptersTotal : 0;
    const acc = accuracy < 0 ? 0 : accuracy;
    const coverage = seen.length / Math.max(1, objs.length);
    const score = Math.round(100 * (0.4 * completion + 0.6 * acc * Math.max(coverage, seen.length ? 0.5 : 0)));
    const weakest = seen.length ? seen.slice().sort((a, b) => a.recent - b.recent)[0] : null;
    return { id: d.id, title: d.title, weight: d.weight, n: d.n, score, accuracy, chaptersDone, chaptersTotal, weakest };
  });
  cache.set(track, result);
  return result;
}

/** Question ids answered wrong more recently than right. */
const mistakesCache = new WeakMap<Progress["questions"], Set<string>>();
export function mistakeIds(p: Progress): Set<string> {
  const cached = mistakesCache.get(p.questions);
  if (cached) return cached;
  const out = new Set<string>();
  for (const [id, st] of Object.entries(p.questions)) if (st.history && !st.lastCorrect) out.add(id);
  mistakesCache.set(p.questions, out);
  return out;
}
