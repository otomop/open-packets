import { Fragment } from "react";
import { cardBank, chapterMinutes, chapters } from "@/lib/course";
import { chapterHref, href } from "@/lib/router";
import { useProgress } from "@/lib/store";
import { sectionProgress } from "@/lib/section-progress";
import { continueChapter, daysToExam, examDate, formatExamDate, minutesThisWeek, planSummary, requiredChapters, streak, trackLabel } from "@/lib/plan";
import { openExamDateDialog } from "@/components/ExamDate";
import { domainMastery } from "@/lib/mastery";
import { isDue } from "@/lib/srs";
import { Bar, Reveal, Ring, fmtMinutes } from "@/components/ui";

export default function Today() {
  const p = useProgress();
  const track = p.settings.track;
  const c = continueChapter(p);
  const cp = c ? p.chapters[c.id] : undefined;
  const { done: sectionsDone, total: sectionsTotal } = sectionProgress(c?.sections ?? [], cp?.sectionsDone);
  const required = requiredChapters(p);
  const done = required.filter((x) => p.chapters[x.id]?.completed).length;
  const pct = required.length ? Math.round((done / required.length) * 100) : 0;
  const date = examDate(p);
  const days = daysToExam(p);
  const openedIds = new Set(Object.keys(p.chapters).filter((id) => p.chapters[id]?.opened));
  const due = cardBank.filter((k) => (!p.settings.gateCards || openedIds.has(k.chapterId)) && isDue(p.cards[k.id])).length;
  const mastery = domainMastery(p, track);
  const weakest = mastery.filter((d) => d.weakest).sort((a, b) => a.score - b.score)[0];
  const plan = planSummary(p);
  const week = minutesThisWeek(p);
  const st = streak(p);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = p.settings.name ? `, ${p.settings.name}` : "";
  const lastAttempt = p.attempts[p.attempts.length - 1];
  const pace = plan.hoursPerWeekNeeded === null || plan.remainingMinutes === 0 ? "" : plan.hoursPerWeekNeeded === Infinity ? "not enough weeks left for a full pass, so focus on practice" : `${plan.hoursPerWeekNeeded} h/week needed`;

  return (
    <div className="page">
      <div className="hero-row">
        <div className="page-head">
          <div className="eyebrow tone-accent">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · {trackLabel(track)} track</div>
          <h1 className="display wipe">{c ? c.title : greet}</h1>
          <p className="lead">{greet}{name}. {c ? (cp?.opened ? `Pick up chapter ${String(c.number).padStart(2, "0")} — ${sectionsDone} of ${sectionsTotal} sections done.` : `Next up is chapter ${String(c.number).padStart(2, "0")}.`) : "Every chapter on your track is complete."}</p>
        </div>
        <div className="countdown">
          <span className="eyebrow">Days until your exam</span>
          {date && days !== null ? (
            <>
              <b className="num">{days < 0 ? "—" : days}</b>
              <span className="muted">{days < 0 ? "Your exam date has passed." : days === 0 ? "It's exam day. Good luck." : `${formatExamDate(date)} · ${trackLabel(track)}`}{days > 0 && pace ? ` · ${pace}` : ""}</span>
              <span className="countdown-actions"><button type="button" className="link" onClick={openExamDateDialog}>Change date</button><a className="link" href={href("plan")}>Study plan</a></span>
            </>
          ) : (
            <>
              <b className="num">—</b>
              <span className="muted">No exam date yet. Set one and the plan paces itself to it.</span>
              <span className="countdown-actions"><button type="button" className="link" onClick={openExamDateDialog}>Set your exam date →</button></span>
            </>
          )}
        </div>
      </div>
      <div className="rule draw" />
      <Reveal className="today-grid" stagger>
        <div className="cell">
          <span className="eyebrow">01 · Continue</span>
          {c ? (
            <>
              <p style={{ fontSize: 17, lineHeight: 1.45 }}>{c.subtitle || c.summary}</p>
              <div className="progress-segs" aria-label={`${sectionsDone} of ${sectionsTotal} sections`}>{Array.from({ length: Math.max(1, sectionsTotal) }, (_, i) => <span key={i} className={i < sectionsDone ? "done" : ""} />)}</div>
              <span className="muted">{fmtMinutes(chapterMinutes(c))} · {c.sections.filter((s) => s.id !== "intro").length} sections · lab {c.lab ? fmtMinutes(c.minutes.lab) : "—"}</span>
              <div style={{ marginTop: "auto" }}><a className="btn" href={chapterHref(c.id)}>{cp?.opened ? "Resume reading" : "Start chapter"} →</a></div>
            </>
          ) : <p>All done. Head to practice and the blueprint map to shore up weak objectives.</p>}
        </div>
        <div className="cell">
          <span className="eyebrow">02 · Today</span>
          <div className="plan-list">
            {c && <a href={chapterHref(c.id)}><i className="dot" />Read {c.title}, §{sectionsDone + 1}+<span className="time">{fmtMinutes(Math.max(15, c.minutes.lesson - (sectionsDone / Math.max(1, sectionsTotal)) * c.minutes.lesson))}</span></a>}
            <a href={href("cards")}><i className="dot" style={{ background: "var(--d-infra)" }} />{due ? `Review ${due} due cards` : "Learn new flashcards"}<span className="time">{fmtMinutes(Math.max(5, Math.min(25, due * 0.5)))}</span></a>
            <a href={href("practice")}><i className="dot" style={{ background: "var(--d-routing)" }} />{weakest?.weakest ? `10 questions · ${weakest.weakest.id}` : "10 mixed questions"}<span className="time">15 min</span></a>
            {c?.lab && cp?.opened && !cp.labDone && <a href={chapterHref(c.id, "lab")}><i className="dot" style={{ background: "var(--d-switching)" }} />Lab · {c.lab.title}<span className="time">{fmtMinutes(c.minutes.lab)}</span></a>}
          </div>
          <a className="link" href={href("plan")} style={{ marginTop: "auto" }}>Full study plan →</a>
        </div>
        <div className="cell">
          <span className="eyebrow">03 · Mastery</span>
          <div className="mastery-rows">
            {mastery.map((d) => (
              <Fragment key={d.id}>
                <span>{d.title.replace(" and Network", " &").replace("Network ", "")} <span className="dim">· {d.weight}%</span></span>
                <span className="val">{d.accuracy < 0 ? "—" : d.score}</span>
                <Bar value={d.score} tone={d.id} />
              </Fragment>
            ))}
          </div>
          <span className="muted" style={{ marginTop: "auto" }}>{weakest?.weakest ? <>Weakest: <b>{weakest.weakest.id}</b> {weakest.weakest.text}</> : "Answer questions to map your weak spots."} <a className="link" href={href("blueprint")}>map</a></span>
        </div>
        <div className="cell stat">
          <span className="eyebrow">04 · Path</span>
          <Ring value={pct} label={`${pct}%`} sub={`${done} / ${required.length}`} />
          <span className="muted">{fmtMinutes(week)} this week · {st}-day streak{lastAttempt ? ` · last quiz ${Math.round((lastAttempt.score / lastAttempt.total) * 100)}%` : ""}</span>
          <a className="link" href={href("chapters")} style={{ marginTop: "auto" }}>All chapters →</a>
        </div>
      </Reveal>
      <Reveal className="grid-cards" stagger>
        {[
          ["practice", "Practice", "Exam-style questions with exhibits; mistakes come back until you beat them."],
          ["subnetting", "Subnetting trainer", "Network, mask, wildcard, VLSM and IPv6 drills with a binary view."],
          ["drill", "Command drill", "Type the IOS command from the task. Abbreviations accepted."],
          ["tickets", "Tickets", "Read the outputs, name the root cause, see the fix."],
        ].map(([to, t, d]) => (
          <a key={to} className="cell lift" href={href(to)} style={{ textDecoration: "none", gridColumn: "span 1" }}>
            <h3>{t}</h3><span className="muted">{d}</span>
          </a>
        ))}
      </Reveal>
      <p className="muted small panel">{chapters.length} chapters · {cardBank.length} flashcards · sources checked {new Date(p.createdAt).getFullYear() >= 2026 ? "September 2026" : ""}. Progress is stored in this browser — export it from Settings.</p>
    </div>
  );
}
