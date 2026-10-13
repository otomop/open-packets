import type { CardState } from "./types";

export type Grade = 1 | 2 | 3 | 4; // again, hard, good, easy

const DAY = 86_400_000;

/** SM-2-style scheduler, tuned for an exam a few months out (intervals capped at 60 days). */
export function schedule(prev: CardState | undefined, grade: Grade, now = new Date()): CardState {
  const ease = prev?.ease ?? 2.5;
  const reps = prev?.reps ?? 0;
  const lapses = prev?.lapses ?? 0;
  const interval = prev?.interval ?? 0;
  let nextInterval: number;
  let nextEase = ease;
  let nextReps = reps + 1;
  let nextLapses = lapses;
  let dueMs: number;

  if (grade === 1) {
    nextInterval = 0;
    nextEase = Math.max(1.3, ease - 0.2);
    nextReps = 0;
    nextLapses = lapses + 1;
    dueMs = now.getTime() + 10 * 60_000; // again in 10 minutes
  } else {
    if (reps === 0 || interval === 0) {
      nextInterval = grade === 2 ? 1 : grade === 3 ? 2 : 4;
    } else if (reps === 1) {
      nextInterval = grade === 2 ? 3 : grade === 3 ? 6 : 10;
    } else {
      const factor = grade === 2 ? 1.2 : grade === 3 ? ease : ease * 1.3;
      nextInterval = Math.max(interval + 1, Math.round(interval * factor));
    }
    if (grade === 2) nextEase = Math.max(1.3, ease - 0.15);
    if (grade === 4) nextEase = ease + 0.15;
    nextInterval = Math.min(60, nextInterval);
    dueMs = now.getTime() + nextInterval * DAY;
  }
  return {
    due: new Date(dueMs).toISOString(),
    interval: nextInterval,
    ease: Math.round(nextEase * 100) / 100,
    reps: nextReps,
    lapses: nextLapses,
    last: now.toISOString(),
    introducedAt: prev?.introducedAt ?? prev?.last ?? now.toISOString(),
  };
}

/** Preview of the interval each grade would produce, for button labels. */
export function previewIntervals(prev: CardState | undefined): Record<Grade, string> {
  const fmt = (s: CardState) => {
    if (s.interval === 0) return "10 min";
    if (s.interval === 1) return "1 day";
    if (s.interval < 30) return `${s.interval} days`;
    return `${Math.round(s.interval / 7)} wk`;
  };
  return { 1: fmt(schedule(prev, 1)), 2: fmt(schedule(prev, 2)), 3: fmt(schedule(prev, 3)), 4: fmt(schedule(prev, 4)) };
}

export function isDue(s: CardState | undefined, now = Date.now()): boolean {
  return !s || new Date(s.due).getTime() <= now;
}

/** Existing records lack their first-review date; use their last known date conservatively. */
export function introducedToday(cards: Record<string, CardState>, now = new Date()): number {
  return Object.values(cards).filter(card => {
    const first = new Date(card.introducedAt ?? card.last);
    return first.getFullYear() === now.getFullYear() && first.getMonth() === now.getMonth() && first.getDate() === now.getDate();
  }).length;
}

/** Reviewed cards leave the due queue until their scheduled time, including Again's ten-minute delay. */
export function reviewQueue<T extends { id: string }>(all: T[], cards: Record<string, CardState>, dueOnly: boolean, newAllowed: number, now = Date.now()): T[] {
  const list = dueOnly ? all.filter(card => isDue(cards[card.id], now)) : all;
  const seen = list.filter(card => cards[card.id]);
  const fresh = list.filter(card => !cards[card.id]).slice(0, dueOnly ? Math.max(0, newAllowed) : undefined);
  return [...seen.sort((a, b) => Date.parse(cards[a.id].due) - Date.parse(cards[b.id].due)), ...fresh];
}
