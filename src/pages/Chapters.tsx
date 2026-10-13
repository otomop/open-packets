import { useState } from "react";
import { chapterMinutes, chapters, course, isRequired } from "@/lib/course";
import { chapterHref } from "@/lib/router";
import { useProgress } from "@/lib/store";
import { sectionProgress } from "@/lib/section-progress";
import { fmtMinutes } from "@/components/ui";

export default function Chapters() {
  const p = useProgress();
  const track = p.settings.track;
  const [q, setQ] = useState("");
  const [onlyRequired, setOnlyRequired] = useState(false);
  const match = (c: (typeof chapters)[number]) => !q || [c.title, c.subtitle, c.summary, c.id, ...c.objectives[track]].join(" ").toLowerCase().includes(q.toLowerCase());
  const required = chapters.filter((c) => isRequired(c, track));
  const doneCount = required.filter((c) => p.chapters[c.id]?.completed).length;
  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow tone-accent">The learning path · {track === "v1" ? "200-301 v1.1" : "200-301 v2.0"} track</div>
        <h1 className="display wipe">One chapter at a time.</h1>
        <p className="lead">{chapters.length} chapters in {course.parts.length} parts, ordered for learning. {doneCount} of {required.length} required chapters complete. Chapters outside your track are marked optional.</p>
      </div>
      <div className="q-bar toolbar">
        <label className="field" style={{ minWidth: "min(280px, 100%)" }}><span className="sr-only" style={{ position: "absolute", left: -9999 }}>Search chapters</span><input placeholder="Search chapters or objective ids…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={onlyRequired} onChange={(e) => setOnlyRequired(e.target.checked)} /> Required for my track only</label>
      </div>
      {course.parts.map((part) => {
        const list = chapters.filter((c) => c.part === part.id && match(c) && (!onlyRequired || isRequired(c, track)));
        if (!list.length) return null;
        return (
          <section key={part.id} className="part-block">
            <div className="part-head"><h2>{part.title}</h2><small>{part.blurb}</small></div>
            <div className="panel-list">
              {list.map((c) => {
                const cp = p.chapters[c.id];
                const reading = sectionProgress(c.sections, cp?.sectionsDone);
                const req = isRequired(c, track);
                const secTotal = c.sections.filter((s) => s.id !== "intro").length;
                return (
                  <a key={c.id} href={chapterHref(c.id)} className={`chapter-row${cp?.completed ? " done" : ""}${req ? "" : " optional"}`}>
                    <span className="n num">{cp?.completed ? "✓" : String(c.number).padStart(2, "0")}</span>
                    <span>
                      <b>{c.title}</b>
                      <small>{c.subtitle || c.summary}</small>
                      <span className="tags">
                        {!req && <span className="pill dim">optional for {track === "v1" ? "v1.1" : "v2.0"}</span>}
                        {c.objectives[track].filter((o) => o.split(".").length === 2).map((o) => <span key={o} className="pill">{o}</span>)}
                        {cp?.checkpoint && <span className={`pill ${cp.checkpoint.score / cp.checkpoint.total >= 0.8 ? "ok" : ""}`}>checkpoint {cp.checkpoint.score}/{cp.checkpoint.total}</span>}
                      </span>
                    </span>
                    <span className="meta">{fmtMinutes(chapterMinutes(c))}<br />{secTotal} sections{c.lab ? " · lab" : ""}</span>
                    <span className="meta">{cp ? `${reading.done}/${reading.total} read` : "not started"}{cp?.labDone ? " · lab ✓" : ""}</span>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
