import { useState } from "react";
import { chapterById, chapters, course, domainsFor } from "@/lib/course";
import { chapterHref, href } from "@/lib/router";
import { useProgress } from "@/lib/store";
import { objectiveMastery } from "@/lib/mastery";
import type { Track } from "@/lib/types";

export default function Blueprint() {
  const p = useProgress();
  const [track, setTrack] = useState<Track>(p.settings.track);
  const om = objectiveMastery(p, track);
  const domains = domainsFor(track);
  const exam = track === "v1" ? course.exam.v1 : course.exam.v2;
  const sources = [...new Map(chapters.flatMap((c) => c.sources).map((s) => [s.url, s])).values()];
  const mapped = om.filter((o) => o.chapters.length).length;
  return (
    <div className="page">
      <div className="page-head"><div className="eyebrow tone-accent">Blueprint map</div><h1 className="display wipe">Every objective, mapped.</h1><p className="lead">The official exam topics, the chapters that teach each one, and your recent accuracy on questions tagged with it. {mapped} of {om.length} entries are covered by a chapter.</p></div>
      <div className="q-bar toolbar">
        <div className="seg"><button type="button" className={track === "v2" ? "on" : ""} onClick={() => setTrack("v2")}>v2.0 · from 3 Feb 2027</button><button type="button" className={track === "v1" ? "on" : ""} onClick={() => setTrack("v1")}>v1.1 · until 2 Feb 2027</button></div>
        <a className="link" href={exam.topicsUrl} target="_blank" rel="noreferrer">Official {exam.label} exam topics (PDF) ↗</a>
      </div>
      {domains.map((d) => {
        const objs = om.filter((o) => o.domain === d.id);
        const seen = objs.filter((o) => o.recent >= 0);
        return (
          <details key={d.id} className="domain" open>
            <summary><h2>{d.n} {d.title}</h2><span className="w">{d.weight}% of the exam · {seen.length}/{objs.length} objectives attempted</span></summary>
            <div className="panel-list">
              {objs.map((o) => (
                <div key={o.id} className={`obj-row${o.id.split(".").length > 2 ? " sub" : ""}`}>
                  <code>{o.id}</code>
                  <span>{o.text}</span>
                  <span className="chaps">{o.chapters.length ? o.chapters.map((id) => { const c = chapterById.get(id)!; return <a key={id} href={chapterHref(id)} title={c.title}>{String(c.number).padStart(2, "0")}</a>; }) : <span className="pill dim">no chapter</span>}</span>
                  <span className="bar" title={o.recent < 0 ? "not attempted" : `${Math.round(o.recent * 100)}% recent accuracy · ${o.seen} answers`}><i className={o.recent < 0 ? "" : o.recent >= 0.8 ? "tone-ok" : o.recent >= 0.5 ? "tone-warn" : "tone-bad"} style={{ width: `${o.recent < 0 ? 0 : Math.max(4, o.recent * 100)}%` }} /></span>
                </div>
              ))}
            </div>
          </details>
        );
      })}
      <p className="muted panel"><a href={href("practice")}>Practice</a> a domain or objective directly from the focused-session scope.</p>
      <section className="part-block">
        <div className="part-head"><h2>Reference library</h2><small>{sources.length} primary sources cited across the chapters · checked {course.sourceCheckedOn}</small></div>
        <div className="list-rows panel-list">{sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", gap: 12, textDecoration: "none", fontSize: 14 }}><span>{s.title}</span><span className="dim mono small">{new URL(s.url).hostname}</span></a>)}</div>
      </section>
    </div>
  );
}
