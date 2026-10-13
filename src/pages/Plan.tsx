import { chapterMinutes, course } from "@/lib/course";
import { chapterHref } from "@/lib/router";
import { localDateKey, updateSettings, useProgress } from "@/lib/store";
import { daysToExam, daysUntil, examDate, examDatePatch, formatExamDate, planSummary, trackLabel } from "@/lib/plan";
import { fmtMinutes } from "@/components/ui";

export default function Plan() {
  const p = useProgress();
  const s = p.settings;
  const plan = planSummary(p);
  const date = examDate(p);
  const days = daysToExam(p);
  const v1Days = daysUntil(course.exam.v1.lastTestDate);
  return (
    <div className="page">
      <div className="page-head"><div className="eyebrow tone-accent">Study plan</div><h1 className="display wipe">Make room for progress.</h1><p className="lead">Set your exam and weekly hours; the plan schedules what is left, reserves review time before the exam, and tells you whether the pace holds.</p></div>
      <div className="plan-settings">
        <label className="field">Exam version
          <select value={s.track} onChange={(e) => updateSettings({ track: e.target.value as "v1" | "v2" })}>
            <option value="v2">200-301 v2.0 (from 3 Feb 2027)</option>
            <option value="v1">200-301 v1.1 (until 2 Feb 2027)</option>
          </select>
        </label>
        <label className="field">Target exam date<input type="date" value={s.examDate} min={localDateKey()} onChange={(e) => updateSettings(examDatePatch(e.target.value))} /></label>
        <label className="field">Study hours per week<input type="number" min={1} max={60} value={s.hoursPerWeek} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 60) updateSettings({ hoursPerWeek: v }); }} /></label>
      </div>
      {s.track === "v1" && v1Days !== null && v1Days < 120 && <div className="notice warn">v1.1 retires on 2 February 2027 — {v1Days} days away. Book early; test centres fill up before a retirement date.</div>}
      {s.track === "v2" && s.examDate && s.examDate < course.exam.v2.firstTestDate && <div className="notice warn">Your date is before 3 February 2027, when v2.0 becomes available. Either move the date or switch the track to v1.1.</div>}
      {s.track === "v1" && s.examDate && s.examDate > course.exam.v1.lastTestDate && <div className="notice warn">Your date is after v1.1's last test day (2 February 2027). Switch the track to v2.0.</div>}
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
        <div className="cell stat"><b className="num">{plan.remaining.length}</b><small>chapters left on the {trackLabel(s.track)} track</small></div>
        <div className="cell stat"><b className="num">{Math.round(plan.remainingMinutes / 60)}</b><small>hours of lessons and labs left</small></div>
        <div className="cell stat"><b className="num">{days === null || days < 0 ? "—" : days}</b><small>{date ? (days !== null && days < 0 ? "your exam date has passed — pick a new one" : `days until your exam · ${formatExamDate(date, "short")}`) : "days until your exam — set a date above"}</small></div>
        <div className="cell stat"><b className="num" style={{ color: plan.onTrack === false ? "var(--bad)" : plan.onTrack ? "var(--ok)" : "var(--ink)" }}>{plan.hoursPerWeekNeeded === null ? "—" : plan.hoursPerWeekNeeded === Infinity ? "∞" : plan.hoursPerWeekNeeded}</b><small>h/week needed to finish {plan.reviewWeeks} week{plan.reviewWeeks === 1 ? "" : "s"} before the exam{plan.onTrack === false ? " — behind at your current pace" : plan.onTrack ? " — on track" : ""}</small></div>
      </div>
      <section className="part-block">
        <div className="part-head"><h2>Week by week</h2><small>{s.hoursPerWeek} h/week · {plan.weeksAtPace} weeks for a first pass{plan.weeksAvailable !== null ? ` · ${plan.weeksAvailable} weeks available` : ""}</small></div>
        {plan.schedule.length > 0 && <div className="panel-list">{plan.schedule.map((w) => (
          <div key={w.week} className="week">
            <span className="wk">Wk {w.week}</span>
            <div>{w.chapters.map((c) => <a key={c.id} href={chapterHref(c.id)}><span>{String(c.number).padStart(2, "0")} {c.title}</span><span>{fmtMinutes(chapterMinutes(c))}</span></a>)}<span className="muted small">{fmtMinutes(w.minutes)} this week</span></div>
          </div>
        ))}</div>}
        {!plan.schedule.length && <div className="empty">Every required chapter is complete — spend the remaining weeks on practice, tickets and the blueprint map.</div>}
      </section>
      <div className="callout callout-tip"><div className="callout-label">How to use the weeks</div><div className="md"><ul><li>Each chapter: read → lab → checkpoint, then its flashcards the next day.</li><li>Every day: due flashcards first (10 minutes), then one quick-10 practice session.</li><li>Every week: one focused session on your weakest objective, and rebuild one earlier lab from a blank file.</li><li>Review weeks: exam simulations, mistakes mode, tickets, and the exam-readiness chapter.</li></ul></div></div>
    </div>
  );
}
