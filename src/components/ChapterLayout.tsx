import { useRef, type KeyboardEvent, type ReactNode } from "react";

/** Shared reading and practice layout, with an optional quick-skip panel on the left. */
export function TabLayout({ nav, children }: { nav?: ReactNode; children: ReactNode }) {
  return (
    <div className={`lesson-layout${nav ? "" : " no-nav"}`}>
      {nav && <aside className="lesson-toc">{nav}</aside>}
      {children}
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
