import { useEffect, useMemo, useRef, useState } from "react";
import { chapterById, chapters, domainsFor } from "@/lib/course";
import { cardBank } from "@/lib/banks/cards";
import { localDateKey, update, useProgress } from "@/lib/store";
import { introducedToday, isDue, previewIntervals, reviewQueue, schedule, type Grade } from "@/lib/srs";
import { inlineHtml } from "@/lib/markdown";
import { chapterHref } from "@/lib/router";
import { JumpGrid, TabLayout } from "@/components/ChapterLayout";

export function Deck({ chapterId }: { chapterId?: string }) {
  const p = useProgress(p => p, (a, b) => a.settings.track === b.settings.track && a.settings.gateCards === b.settings.gateCards && a.settings.newCardsPerDay === b.settings.newCardsPerDay && a.cards === b.cards && a.chapters === b.chapters);
  const track = p.settings.track;
  const [filter, setFilter] = useState<string>(chapterId ? "chapter:" + chapterId : "all");
  const [dueOnly, setDueOnly] = useState(!chapterId);
  const [flipped, setFlipped] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [graded, setGraded] = useState<Record<string, Grade>>({}); // what each card scored in this sitting
  const [enter, setEnter] = useState(0);
  const [now, setNow] = useState(Date.now);
  const grading = useRef(false);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const openedIds = useMemo(() => new Set(Object.keys(p.chapters).filter((id) => p.chapters[id]?.opened)), [p.chapters]);
  const newToday = useMemo(() => introducedToday(p.cards, new Date(now)), [p.cards, now]);

  const all = useMemo(() => cardBank.filter((k) => {
    if (filter.startsWith("chapter:")) return k.chapterId === filter.slice(8);
    if (filter.startsWith("domain:")) return chapterById.get(k.chapterId)?.domain === filter.slice(7);
    if (filter === "every") return true;
    const c = chapterById.get(k.chapterId)!;
    if (p.settings.gateCards && !openedIds.has(k.chapterId)) return false;
    return c.objectives[track].length > 0 || c.part === "start" || c.part === "capstone";
  }), [filter, p.settings.gateCards, openedIds, track]);
  const due = all.filter((k) => isDue(p.cards[k.id], now));
  const newAllowed = Math.max(0, p.settings.newCardsPerDay - newToday);
  const queue = useMemo(() => reviewQueue(all, p.cards, dueOnly, newAllowed, now), [all, dueOnly, newAllowed, p.cards, now]);
  const card = queue.find((k) => k.id === key) ?? queue[0];
  useEffect(() => { if (card?.id !== key) { setKey(card?.id ?? null); setFlipped(false); } }, [card?.id]);
  useEffect(() => { grading.current = false; }, [card?.id, flipped]);

  const grade = (g: Grade) => {
    if (!card || !flipped || grading.current) return;
    grading.current = true;
    const next = schedule(p.cards[card.id], g);
    update((d) => {
      d.cards = { ...d.cards, [card.id]: next };
      const day = localDateKey();
      d.activity = { ...d.activity, [day]: Math.round(((d.activity[day] ?? 0) + 0.4) * 10) / 10 };
    });
    setGraded((m) => ({ ...m, [card.id]: g }));
    setNow(Date.now());
    setStatus(`${card.front.slice(0, 40)}… → ${g === 1 ? "again in 10 min" : `in ${next.interval} day${next.interval === 1 ? "" : "s"}`}`);
    setFlipped(false);
    setEnter((n) => n + 1);
    const idx = queue.findIndex((k) => k.id === card.id);
    const nxt = queue[idx + 1] ?? queue.find((k) => k.id !== card.id) ?? null;
    setKey(nxt?.id ?? null);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || document.querySelector("dialog[open]")) return;
      // Space and 1–4 belong to the card, so a control that has focus keeps its own key handling —
      // but the card itself is a role=button, and focusing it must not disable its own shortcuts.
      if ((e.target as HTMLElement).isContentEditable || (e.target as HTMLElement).closest?.("input, select, textarea, button, a, [contenteditable=true], [role=button]:not(.card3d)")) return;
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && ["1", "2", "3", "4"].includes(e.key)) grade(Number(e.key) as Grade);
      if (e.key === "ArrowRight") { const i = queue.findIndex((k) => k.id === card?.id); setKey(queue[(i + 1) % Math.max(1, queue.length)]?.id ?? null); setFlipped(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, card?.id, queue]);

  const iv = previewIntervals(card ? p.cards[card.id] : undefined);
  const ch = card ? chapterById.get(card.chapterId) : undefined;
  const cur = queue.findIndex((k) => k.id === card?.id);
  return (
    <TabLayout
      chapter={chapterId ? chapterById.get(chapterId) : undefined}
      nav={chapterId ? <JumpGrid label={`Cards · ${queue.length}`} count={queue.length} current={cur}
        stateOf={(i) => { const g = graded[queue[i].id]; return g ? (g === 1 ? "bad" : "ok") : p.cards[queue[i].id] ? "done" : undefined; }}
        ariaLabel={(i) => `Card ${i + 1} of ${queue.length}`}
        onPick={(i) => { setKey(queue[i].id); setFlipped(false); document.querySelector<HTMLElement>(".card3d")?.focus(); }} /> : undefined}
    >
    <div className="article">
      <div className="q-bar toolbar">
        {!chapterId && (
          <label className="field">Deck
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setKey(null); setFlipped(false); }}>
              <option value="all">Chapters I have opened</option>
              <option value="every">All chapters</option>
              <optgroup label="Domains">{domainsFor("v2").map((d) => <option key={d.id} value={"domain:" + d.id}>{d.title}</option>)}</optgroup>
              <optgroup label="Chapters">{chapters.map((c) => <option key={c.id} value={"chapter:" + c.id}>{String(c.number).padStart(2, "0")} {c.title}</option>)}</optgroup>
            </select>
          </label>
        )}
        <label className="check"><input type="checkbox" checked={dueOnly} onChange={(e) => { setDueOnly(e.target.checked); setKey(null); }} /> Due cards only</label>
        <span className="muted num">{due.length} due · {all.length} in deck{dueOnly ? ` · ${Math.min(newAllowed, all.filter((k) => !p.cards[k.id]).length)} new today` : ""}</span>
      </div>
      {card ? (
        <>
          <div className="deck">
            <div key={enter} className={`card3d enter${flipped ? " flipped" : ""}`} role="button" tabIndex={0} aria-label={flipped ? "Answer shown. Press space to see the question." : "Question. Press space to reveal the answer."} onClick={() => setFlipped((f) => !f)} onKeyDown={(e) => { if (e.key === "Enter") setFlipped((f) => !f); }}>
              <div className="face" aria-hidden={flipped}>
                <div className="meta"><span>{ch ? `${String(ch.number).padStart(2, "0")} · ${ch.title}` : ""}</span><span>{p.cards[card.id] ? `rep ${p.cards[card.id].reps}` : "new"}</span></div>
                <div className="q" dangerouslySetInnerHTML={{ __html: inlineHtml(card.front) }} />
                <div className="meta"><span>space · flip</span><span>{queue.findIndex((k) => k.id === card.id) + 1} / {queue.length}</span></div>
              </div>
              <div className="face back" aria-hidden={!flipped}>
                <div className="meta"><span>Answer</span><span>{(card.tags ?? []).join(" · ")}</span></div>
                <div className="a" dangerouslySetInnerHTML={{ __html: inlineHtml(card.back) }} />
                <div className="meta"><span>1 again · 2 hard · 3 good · 4 easy</span></div>
              </div>
            </div>
          </div>
          <div className="grades">
            <button type="button" disabled={!flipped} onClick={() => grade(1)}><b>Again</b><small>{iv[1]}</small></button>
            <button type="button" disabled={!flipped} onClick={() => grade(2)}><b>Hard</b><small>{iv[2]}</small></button>
            <button type="button" className="good" disabled={!flipped} onClick={() => grade(3)}><b>Good</b><small>{iv[3]}</small></button>
            <button type="button" disabled={!flipped} onClick={() => grade(4)}><b>Easy</b><small>{iv[4]}</small></button>
          </div>
          <div className="q-bar toolbar"><span className="muted small" role="status">{status}</span>{ch && <a className="link" href={chapterHref(ch.id)}>Open chapter →</a>}</div>
        </>
      ) : (
        <div className="empty">{dueOnly ? "Nothing due right now. Untick “Due cards only” to browse, or open a new chapter to unlock its cards." : "No cards in this deck yet."}</div>
      )}
    </div>
    </TabLayout>
  );
}

export default function FlashcardsPage() {
  return (
    <div className="page">
      <div className="page-head"><div className="eyebrow tone-accent">Spaced recall</div><h1 className="display wipe">Make it stick.</h1><p className="lead">Say the answer out loud before you flip. Grade honestly — the schedule adapts to you. New cards unlock as you open chapters.</p></div>
      <Deck />
    </div>
  );
}
