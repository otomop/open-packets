import { chapterMinutes, chapters, course, isRequired } from "./course";
import { localDateKey } from "./store";
import type { ChapterSummary, Progress, Track } from "./types";

const DAY = 86_400_000;

export function daysUntil(dateIso: string, now = new Date()): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / DAY);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The learner's own target exam date (YYYY-MM-DD), or "" if they have not set one. */
export function examDate(p: Progress): string {
  const d = p.settings.examDate;
  return d && DATE_RE.test(d) && daysUntil(d) !== null ? d : "";
}

/** Days until the learner's exam, or null when no date is set. Negative once the date has passed. */
export function daysToExam(p: Progress, now = new Date()): number | null {
  const d = examDate(p);
  return d ? daysUntil(d, now) : null;
}

/** The exam version a given sitting date falls under: v1.1 up to its last test day, v2.0 after. */
export function trackForDate(dateIso: string): Track {
  return dateIso <= course.exam.v1.lastTestDate ? "v1" : "v2";
}

/** Settings patch for a new exam date. A valid date also selects the only exam version you can sit on that day. */
export function examDatePatch(dateIso: string): Partial<Progress["settings"]> {
  if (!dateIso || !DATE_RE.test(dateIso)) return { examDate: "", onboarded: true };
  return { examDate: dateIso, track: trackForDate(dateIso), onboarded: true };
}

export function formatExamDate(dateIso: string, style: "long" | "short" = "long"): string {
  const d = new Date(dateIso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, style === "long" ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" });
}

export function requiredChapters(p: Progress): ChapterSummary[] {
  return chapters.filter((c) => isRequired(c, p.settings.track));
}

export function remainingChapters(p: Progress): ChapterSummary[] {
  return requiredChapters(p).filter((c) => !p.chapters[c.id]?.completed);
}

export interface PlanSummary {
  remaining: ChapterSummary[];
  remainingMinutes: number;
  weeksAtPace: number;
  weeksAvailable: number | null;
  hoursPerWeekNeeded: number | null;
  onTrack: boolean | null;
  reviewWeeks: number;
  schedule: { week: number; chapters: ChapterSummary[]; minutes: number }[];
}

/** Study plan: schedule remaining chapters into weeks at the configured pace, reserving review time before the exam. */
export function planSummary(p: Progress, now = new Date()): PlanSummary {
  const remaining = remainingChapters(p);
  const remainingMinutes = remaining.reduce((n, c) => n + chapterMinutes(c), 0);
  const perWeek = Math.max(1, p.settings.hoursPerWeek) * 60;
  const weeksAtPace = Math.ceil(remainingMinutes / perWeek);
  const days = daysToExam(p, now);
  const weeksAvailable = days === null ? null : Math.max(0, Math.floor(days / 7));
  const reviewWeeks = weeksAvailable === null ? 2 : Math.min(3, Math.max(1, Math.round(weeksAvailable * 0.2)));
  const studyWeeks = weeksAvailable === null ? null : Math.max(0, weeksAvailable - reviewWeeks);
  const hoursPerWeekNeeded =
    studyWeeks === null || (days !== null && days < 0) ? null : remainingMinutes === 0 ? 0 : studyWeeks === 0 ? Infinity : Math.round((remainingMinutes / 60 / studyWeeks) * 10) / 10;
  const onTrack = hoursPerWeekNeeded === null ? null : hoursPerWeekNeeded <= p.settings.hoursPerWeek;
  const schedule: PlanSummary["schedule"] = [];
  let week = 1, bucket: ChapterSummary[] = [], minutes = 0;
  for (const c of remaining) {
    const m = chapterMinutes(c);
    if (minutes + m > perWeek && bucket.length) {
      schedule.push({ week, chapters: bucket, minutes });
      week++;
      bucket = [];
      minutes = 0;
    }
    bucket.push(c);
    minutes += m;
  }
  if (bucket.length) schedule.push({ week, chapters: bucket, minutes });
  return { remaining, remainingMinutes, weeksAtPace, weeksAvailable, hoursPerWeekNeeded, onTrack, reviewWeeks, schedule };
}

/** Consecutive days (ending today or yesterday) with any recorded activity. */
export function streak(p: Progress, now = new Date()): number {
  const has = (d: Date) => (p.activity[localDateKey(d)] ?? 0) > 0;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let n = 0;
  if (!has(d)) d.setDate(d.getDate() - 1);
  while (has(d)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function minutesThisWeek(p: Progress, now = new Date()): number {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    total += p.activity[localDateKey(d)] ?? 0;
  }
  return Math.round(total);
}

/** The chapter to continue: most recently opened incomplete required chapter, else first incomplete. */
export function continueChapter(p: Progress): ChapterSummary | undefined {
  const required = requiredChapters(p);
  const opened = required
    .filter((c) => !p.chapters[c.id]?.completed && p.chapters[c.id]?.opened)
    .sort((a, b) => (p.chapters[b.id]!.opened! > p.chapters[a.id]!.opened! ? 1 : -1));
  return opened[0] ?? required.find((c) => !p.chapters[c.id]?.completed) ?? required[0];
}

export function trackLabel(t: Track): string {
  return t === "v1" ? "200-301 v1.1" : "200-301 v2.0";
}
