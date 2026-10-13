import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { objectiveText } from "@/lib/course";
import { chapterHref } from "@/lib/router";
import { updateSettings, useProgress } from "@/lib/store";
import { fmtMinutes } from "./ui";
import type { ChapterSummary } from "@/lib/types";

/**
 * Every chapter tab (lesson, lab, checkpoint, flashcards, drill) uses this: a quick-skip panel on the left,
 * the content in the middle and the chapter tools rail on the right, so the reading column never shifts
 * between tabs.
 */
export function TabLayout({ nav, chapter, children }: { nav?: ReactNode; chapter?: ChapterSummary; children: ReactNode }) {
  const toolsHidden = useProgress(p => p.settings.toolsCollapsed);
  const cls = ["lesson-layout", nav ? "" : "no-nav", chapter && toolsHidden ? "tools-hidden" : ""].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {nav && <aside className="lesson-toc">{nav}</aside>}
      {children}
      {chapter && <ChapterRail c={chapter} />}
    </div>
  );
}

/** Scroll an anchor into view and put keyboard focus on it, so the next Tab continues from there. */
export function jumpToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: "start" });
  if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
  el.focus({ preventScroll: true });
}

/**
 * Numbered squares for jumping straight to a step, question, card or drill. One square is in the tab order and
 * the arrow keys move between them, so a long grid never traps a keyboard user.
 */
export function JumpGrid({ label, count, current, stateOf, onPick, ariaLabel, max = 120 }: {
  label: ReactNode;
  count: number;
  current: number;
  stateOf?: (i: number) => "ok" | "bad" | "done" | undefined;
  onPick: (i: number) => void;
  ariaLabel: (i: number) => string;
  max?: number;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const shown = Math.min(count, max);
  // Keep the current item on screen when the set is bigger than the cap.
  const start = count <= max ? 0 : Math.max(0, Math.min((current < 0 ? 0 : current) - Math.floor(max / 2), count - max));
  const tabbable = current >= start && current < start + shown ? current : start;

  const focusAt = (i: number) => {
    const clamped = Math.max(start, Math.min(start + shown - 1, i));
    (grid.current?.children[clamped - start] as HTMLElement | undefined)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const row = () => {
      const kids = Array.from(grid.current?.children ?? []) as HTMLElement[];
      const top = kids[0]?.offsetTop;
      const n = kids.findIndex((k) => k.offsetTop !== top);
      return n > 0 ? n : kids.length || 1;
    };
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    if (e.key in keys) { e.preventDefault(); focusAt(i + keys[e.key]); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusAt(i - row()); }
    else if (e.key === "ArrowDown") { e.preventDefault(); focusAt(i + row()); }
    else if (e.key === "Home") { e.preventDefault(); focusAt(start); }
    else if (e.key === "End") { e.preventDefault(); focusAt(start + shown - 1); }
  };

  return (
    <>
      <span className="eyebrow">{label}</span>
      <div className="jump-grid" ref={grid}>
        {Array.from({ length: shown }, (_, k) => {
          const i = start + k;
          const s = stateOf?.(i);
          return (
            <button
              key={i}
              type="button"
              className={`jump${i === current ? " cur" : ""}${s ? " " + s : ""}`}
              aria-current={i === current ? "true" : undefined}
              aria-label={ariaLabel(i)}
              tabIndex={i === tabbable ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => onPick(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {count > shown && <span className="muted small jump-more">Showing {start + 1}–{start + shown} of {count}.</span>}
    </>
  );
}

/** A quick-skip list of titled items (lab steps, lesson sections). */
export function JumpList({ label, items }: { label: ReactNode; items: { key: string; n: number; title: string; done?: boolean; current?: boolean; onPick: () => void }[] }) {
  return (
    <>
      <span className="eyebrow">{label}</span>
      {items.map((it) => (
        <button key={it.key} type="button" className={`toc-link${it.done ? " done" : ""}${it.current ? " on" : ""}`} onClick={it.onPick}>
          {String(it.n).padStart(2, "0")} {it.title}
        </button>
      ))}
    </>
  );
}

/** Chapter tools: the other tabs, objectives and sources. Collapsible, and remembered in Settings. */
export function ChapterRail({ c }: { c: ChapterSummary }) {
  const settings = useProgress(p => p.settings);
  const track = settings.track;
  const toolsHidden = settings.toolsCollapsed;
  return (
    <aside className={`lesson-rail${toolsHidden ? " collapsed" : ""}`} aria-label="Chapter tools">
      <div className="rail-head">
        <span className="eyebrow">Chapter tools</span>
        <button
          type="button"
          className="rail-toggle"
          aria-expanded={!toolsHidden}
          aria-controls="rail-body"
          aria-label={toolsHidden ? "Show chapter tools" : "Hide chapter tools"}
          title={toolsHidden ? "Show chapter tools" : "Hide chapter tools"}
          onClick={() => updateSettings({ toolsCollapsed: !toolsHidden })}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={toolsHidden ? "M3 4h18v16H3zM15 4v16M11 10l-2 2 2 2" : "M3 4h18v16H3zM15 4v16M8 10l2 2-2 2"} />
          </svg>
        </button>
      </div>
      <div id="rail-body" className="rail-body" inert={toolsHidden}>
        <a className="tool" href={chapterHref(c.id)}><span>Lesson</span><span>{fmtMinutes(c.minutes.lesson)}</span></a>
        <a className="tool" href={chapterHref(c.id, "lab")}><span>Guided lab</span><span>{c.lab ? fmtMinutes(c.minutes.lab) : "—"}</span></a>
        <a className="tool" href={chapterHref(c.id, "check")}><span>Checkpoint</span><span>{c.questions.length} Qs</span></a>
        <a className="tool" href={chapterHref(c.id, "cards")}><span>Flashcards</span><span>{c.cards.length}</span></a>
        <a className="tool" href={chapterHref(c.id, "drill")}><span>Command drill</span><span>{c.commands.length}</span></a>
        {c.objectives[track].length > 0 && (
          <div>
            <span className="eyebrow">Objectives</span>
            <div className="sources">
              {c.objectives[track].map((o) => (
                <span key={o} style={{ display: "block", fontSize: 12, color: "var(--ink-2)", padding: "3px 0" }}>
                  <code style={{ color: "var(--ink)" }}>{o}</code> {objectiveText.get(track + ":" + o) ?? ""}
                </span>
              ))}
            </div>
          </div>
        )}
        {c.sources.length > 0 && (
          <div>
            <span className="eyebrow">Sources</span>
            <div className="sources">{c.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
