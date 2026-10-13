import { lazy, memo, Suspense, use, useEffect, useMemo, useState } from "react";
import { chapterById, isRequired, nextChapter, objectiveText, partById, prevChapter } from "@/lib/course";
import { chapterHref, href, navigateToAnchor, useRoute } from "@/lib/router";
import { logActivity, prefersReducedMotion, toggleInList, updateChapter, updateSettings, useProgress } from "@/lib/store";
import { parseBlocks } from "@/lib/markdown";
import { isCheckableSection, itemProgress, sectionProgress } from "@/lib/section-progress";
import Markdown, { Blocks } from "@/components/Markdown";
import { Eyebrow, fmtMinutes } from "@/components/ui";
import { JumpList, TabLayout, jumpToId } from "@/components/ChapterLayout";
import { loadChapterContent } from "@/lib/chapter-content";
import { LoadingContent } from "@/components/LoadBoundary";
import LabManual from "@/components/LabManual";
const Deck = lazy(() => import("./Flashcards").then(m => ({ default: m.Deck })));
const DrillRunner = lazy(() => import("./Drill").then(m => ({ default: m.DrillRunner })));
const Checkpoint = lazy(() => import("./Practice").then(m => ({ default: m.Checkpoint })));
import type { ChapterSummary, ReadingChapter } from "@/lib/types";

const TABS = [["learn", "Learn"], ["lab", "Guided lab"], ["check", "Checkpoint"], ["cards", "Flashcards"], ["drill", "Command drill"]] as const;

export default function ChapterPage({ id, tab }: { id: string; tab: string }) {
  const c = chapterById.get(id);
  const section = useRoute().query.get("section");
  useEffect(() => {
    if (c && tab === "learn" && section && c.sections.some(s => s.id === section)) {
      navigateToAnchor(`${chapterHref(c.id, "learn")}?section=${encodeURIComponent(section)}`, "s-" + section, c.id);
    }
  }, [c?.id, tab, section]);
  const p = useProgress(p => p, (a, b) => a.chapters === b.chapters && a.settings.track === b.settings.track);
  useEffect(() => {
    if (c) updateChapter(c.id, { opened: new Date().toISOString() });
  }, [c?.id]);
  if (!c) return <div className="page narrow"><h1 className="display">Chapter not found.</h1><a className="btn" href={href("chapters")}>All chapters</a></div>;
  const cp = p.chapters[c.id] ?? { sectionsDone: [], stepsDone: [] };
  const reading = sectionProgress(c.sections, cp.sectionsDone);
  const track = p.settings.track;
  const objs = c.objectives[track];
  const prev = prevChapter(c), next = nextChapter(c);
  const counts: Record<string, string> = { learn: `${c.sections.filter((s) => s.id !== "intro").length}`, lab: c.lab ? `${c.lab.steps.length} steps` : "—", check: `${c.questions.length}`, cards: `${c.cards.length}`, drill: `${c.commands.length}` };
  return (
    <div className="page" data-chapter-id={c.id}>
      <div className="chapter-head">
        <div>
          <Eyebrow tone="accent">{partById.get(c.part)?.title} · chapter {String(c.number).padStart(2, "0")} of 46{objs.length ? ` · ${track === "v1" ? "v1.1" : "v2.0"} ${objs.filter((o) => o.split(".").length === 2).join(", ")}` : ""}</Eyebrow>
          <h1 className="display vt-headline wipe" style={{ marginTop: 6 }}>{c.title}</h1>
          <p className="subtitle">{c.subtitle}</p>
        </div>
        <div className="facts">
          <span><b>{fmtMinutes(c.minutes.lesson + c.minutes.lab)}</b> · lesson {fmtMinutes(c.minutes.lesson)}{c.lab ? ` · lab ${fmtMinutes(c.minutes.lab)}` : ""}</span>
          {c.prereqs.length > 0 && <span>Before this: {c.prereqs.map((pid, i) => { const pc = chapterById.get(pid); return pc ? <a key={pid} href={chapterHref(pid)} style={{ color: p.chapters[pid]?.completed ? "var(--ok)" : "var(--ink-2)" }}>{i ? ", " : ""}{pc.title}</a> : null; })}</span>}
          {!isRequired(c, track) && <span className="pill dim">optional for the {track === "v1" ? "v1.1" : "v2.0"} track</span>}
          <span>{cp.completed ? <span className="pill ok">completed</span> : <span className="pill">{reading.done} / {reading.total} sections read</span>}</span>
        </div>
      </div>
      <nav className="tabs" aria-label="Chapter sections">
        {TABS.map(([t, label]) => <a key={t} href={chapterHref(c.id, t)} className={tab === t ? "on" : ""}>{label}<small>{counts[t]}</small></a>)}
      </nav>
      <Suspense fallback={<LoadingContent />}>
      {(tab === "learn" || tab === "lab") && <Reading key={c.id} chapter={c} tab={tab} />}
      {tab === "check" && <Checkpoint chapter={c} />}
      {tab === "cards" && <Deck key={c.id} chapterId={c.id} />}
      {tab === "drill" && <DrillRunner key={c.id} chapterId={c.id} />}
      </Suspense>
      <div className="hairline" />
      <div className="q-bar">
        {prev ? <a className="btn ghost" href={chapterHref(prev.id)}>← {String(prev.number).padStart(2, "0")} {prev.title}</a> : <span />}
        <button type="button" className={`btn ${cp.completed ? "ghost" : ""}`} onClick={() => updateChapter(c.id, { completed: !cp.completed })}>{cp.completed ? "Marked complete · undo" : "Mark chapter complete"}</button>
        {next && <a className="btn ghost" href={chapterHref(next.id)}>{String(next.number).padStart(2, "0")} {next.title} →</a>}
      </div>
    </div>
  );
}

const NO_SECTIONS: string[] = [];

const Reading = memo(function Reading({ chapter, tab }: { chapter: ChapterSummary; tab: string }) {
  const content = use(loadChapterContent(chapter.id));
  const c = useMemo(() => ({ ...chapter, ...content }), [chapter, content]);
  return tab === "lab" ? <LabView c={c} /> : <Learn c={c} />;
});

/** Contents list. It owns the "which section am I reading" state, so scrolling through a lesson only re-renders this list. */
function LessonToc({ c, done }: { c: ReadingChapter; done: string[] }) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const els = c.sections.map((s) => document.getElementById("s-" + s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id.slice(2));
    }, { rootMargin: "-20% 0px -65% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [c.id]);
  const teach = c.sections.filter((s) => s.id !== "intro");
  return (
    <>
      <span className="eyebrow">In this chapter</span>
      {teach.map((s, i) => (
        <a key={s.id} href={"#s-" + s.id} className={(isCheckableSection(s) && done.includes(s.id) ? "done " : "") + (active === s.id ? "on" : "")} onClick={(e) => { e.preventDefault(); document.getElementById("s-" + s.id)?.scrollIntoView({ block: "start" }); }}>
          {String(i + 1).padStart(2, "0")} {s.title}
        </a>
      ))}
    </>
  );
}

/** The lesson text. Memoised: it re-renders only when the chapter or its "I can" ticks change, not on scroll or the reading timer. */
const LessonArticle = memo(function LessonArticle({ c, done }: { c: ReadingChapter; done: string[] }) {
  const sections = c.sections;
  const teach = sections.filter((s) => s.id !== "intro");
  return (
    <article className="article">
      {sections.map((s, i) => (
        <section key={s.id} id={"s-" + s.id} className="section">
          {s.id !== "intro" && <><div className="section-kicker">{String(teach.indexOf(s) + 1).padStart(2, "0")} / {String(teach.length).padStart(2, "0")}</div><h2 className="section-title">{s.title}</h2></>}
          <Markdown text={s.body} />
          {isCheckableSection(s) && (
            <div className="section-check">
              <span>Can you explain this section in your own words?</span>
              <label className="check"><input type="checkbox" checked={done.includes(s.id)} onChange={() => toggleInList(c.id, "sectionsDone", s.id)} /> I can</label>
            </div>
          )}
        </section>
      ))}
      <div className="callout callout-tip"><div className="callout-label">Next</div><p>Do the guided lab, then take the checkpoint without looking back at the lesson. <a href={chapterHref(c.id, "lab")}>Open the lab →</a></p></div>
    </article>
  );
});

function Learn({ c }: { c: ReadingChapter }) {
  const done = useProgress(p => p.chapters[c.id]?.sectionsDone) ?? NO_SECTIONS;
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") logActivity(1); }, 60_000); // a minute of reading per minute on the page
    return () => clearInterval(t);
  }, [c.id]);
  useEffect(() => {
    const anchor = window.location.hash.split("#")[2];
    if (anchor) navigateToAnchor(window.location.hash.split("#").slice(0, 2).join("#"), "s-" + anchor, c.id);
  }, [c.id]);
  return (
    <TabLayout chapter={c} nav={<LessonToc c={c} done={done} />}>
      <LessonArticle c={c} done={done} />
    </TabLayout>
  );
}

function LabView({ c }: { c: ReadingChapter }) {
  if (!c.lab) return <div className="empty">This chapter has no hands-on lab.</div>;
  return <LabManual c={c} lab={c.lab} />;
}
