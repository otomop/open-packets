import courseData from "virtual:course";
import type { ChapterSummary, CourseCatalog, DomainDef, Objective, Question, Track } from "./types";

export const course: CourseCatalog = courseData;

export const chapters: ChapterSummary[] = course.chapters;
export const chapterById = new Map(chapters.map((c) => [c.id, c]));
export const partById = new Map(course.parts.map((p) => [p.id, p]));

export function chaptersInPart(partId: string): ChapterSummary[] {
  return chapters.filter((c) => c.part === partId);
}

/** Is this chapter part of the required path for the chosen exam track? */
export function isRequired(c: ChapterSummary, track: Track): boolean {
  if (c.part === "start" || c.part === "foundations" || c.part === "capstone") return true;
  return c.objectives[track].length > 0;
}

export function domainsFor(track: Track): DomainDef[] {
  return course.domains[track];
}

export function objectivesFor(track: Track): Objective[] {
  return course.blueprint[track];
}

export const objectiveText = new Map<string, string>([
  ...course.blueprint.v1.map((o) => ["v1:" + o.id, o.text] as const),
  ...course.blueprint.v2.map((o) => ["v2:" + o.id, o.text] as const),
]);

export function objectiveDomain(track: Track, id: string): string {
  const o = course.blueprint[track].find((x) => x.id === id);
  return o?.domain ?? "none";
}

/** Chapters that teach an objective (track-qualified id like "v2:2.5.a"). Parent ids also match their children. */
export function chaptersForObjective(track: Track, id: string): ChapterSummary[] {
  return chapters.filter((c) => c.objectives[track].some((o) => o === id || o.startsWith(id + ".")));
}

/** Domain id (for the chosen track) of a question, derived from its objective tags; falls back to chapter domain mapping. */
export function questionDomain(q: Pick<Question, "objectives">, track: Track, chapter: ChapterSummary): string {
  const tag = q.objectives.find((o) => o.startsWith(track + ":"));
  if (tag) return objectiveDomain(track, tag.slice(3));
  // map the chapter's domain (v2 naming) onto the v1 domain list when needed
  if (track === "v2") return chapter.domain === "none" ? "none" : chapter.domain;
  const v1 = chapter.objectives.v1[0];
  return v1 ? objectiveDomain("v1", v1) : "none";
}

export type { BankQuestion } from "./types";

export const questionBank = chapters.flatMap((c) =>
  c.questions.map((q) => ({
    ...q,
    chapterId: c.id,
    chapterTitle: c.title,
    chapterNumber: c.number,
    domainV1: questionDomain(q, "v1", c),
    domainV2: questionDomain(q, "v2", c),
  })),
);
export const questionById = new Map(questionBank.map((q) => [q.id, q]));

export const cardBank = chapters.flatMap((c) =>
  c.cards.map((k) => ({ ...k, chapterId: c.id, chapterTitle: c.title, chapterNumber: c.number, domain: c.domain })),
);

export const drillBank = chapters.flatMap((c) => c.commands.map((d) => ({ ...d, chapterId: c.id, chapterTitle: c.title })));
export const ticketBank = chapters.flatMap((c) => c.tickets.map((t) => ({ ...t, chapterId: c.id, chapterTitle: c.title })));

export const totals = {
  chapters: chapters.length,
  questions: questionBank.length,
  cards: cardBank.length,
  drills: drillBank.length,
  tickets: ticketBank.length,
  minutes: chapters.reduce((n, c) => n + c.minutes.lesson + c.minutes.lab, 0),
};

export function chapterMinutes(c: ChapterSummary): number {
  return (c.minutes?.lesson ?? 45) + (c.minutes?.lab ?? 0);
}

export function nextChapter(c: ChapterSummary): ChapterSummary | undefined {
  return chapters[chapters.indexOf(c) + 1];
}
export function prevChapter(c: ChapterSummary): ChapterSummary | undefined {
  return chapters[chapters.indexOf(c) - 1];
}

/** Human label for a domain id in either track. */
export function domainTitle(id: string): string {
  return course.domains.v2.find((d) => d.id === id)?.title ?? course.domains.v1.find((d) => d.id === id)?.title ?? "General";
}
