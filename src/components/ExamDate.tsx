import { useEffect, useId, useRef, useState } from "react";
import { course } from "@/lib/course";
import { daysUntil, examDatePatch, formatExamDate, trackForDate, trackLabel } from "@/lib/plan";
import { getProgress, localDateKey, updateSettings, useProgress } from "@/lib/store";

const OPEN_EVENT = "ccna:exam-date";

/** Open the exam-date dialog from anywhere (e.g. the Today countdown). */
export function openExamDateDialog() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

/** One line that says what a chosen date means: how far away it is and which exam version applies. */
export function describeExamDate(date: string): string {
  if (!date) return "No date set yet.";
  const d = daysUntil(date);
  if (d === null) return "That is not a valid date.";
  if (d < 0) return "That date has already passed.";
  const t = trackForDate(date);
  const when = d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days away`;
  const weeks = d >= 14 ? ` · about ${Math.round(d / 7)} weeks` : "";
  const note = t === "v1" ? ` (its last test day is ${formatExamDate(course.exam.v1.lastTestDate, "short")})` : "";
  return `${when}${weeks} · you'll sit ${trackLabel(t)}${note}`;
}

/** Date input with quick picks and a live readout. Shared by the first-launch dialog and Settings. */
export function ExamDatePicker({ value, onChange, label = "Exam date" }: { value: string; onChange: (date: string) => void; label?: string }) {
  const id = useId();
  const today = localDateKey();
  const max = inDays(365 * 3);
  const v2First = course.exam.v2.firstTestDate;
  const picks: [string, string][] = [
    [inDays(56), "In 8 weeks"],
    [inDays(84), "In 12 weeks"],
    [inDays(112), "In 16 weeks"],
  ];
  if (v2First > today) picks.push([v2First, `v2.0 launch · ${formatExamDate(v2First, "short")}`]);
  const past = value !== "" && value < today;
  return (
    <div className="exam-picker">
      <label className="field" htmlFor={id}>{label}</label>
      <input id={id} className="exam-picker-input" type="date" value={value} min={today} max={max} onChange={(e) => onChange(e.target.value)} aria-describedby={id + "-readout"} />
      <div className="chips" role="group" aria-label="Quick picks">
        {picks.map(([d, text]) => (
          <button key={text} type="button" className={`chip${value === d ? " on" : ""}`} aria-pressed={value === d} onClick={() => onChange(d)}>{text}</button>
        ))}
      </div>
      <p id={id + "-readout"} className={`exam-readout${past ? " bad" : ""}`} aria-live="polite">{describeExamDate(value)}</p>
    </div>
  );
}

/**
 * Asks for the target exam date on first launch, and again whenever something calls openExamDateDialog().
 * Uses a native modal <dialog> so focus is trapped, Esc works and the page behind is inert.
 */
export function ExamDateDialog() {
  const p = useProgress();
  const firstRun = !p.settings.onboarded && !p.settings.examDate;
  const [open, setOpen] = useState(firstRun);
  const [value, setValue] = useState(p.settings.examDate);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onOpen = () => {
      setValue(getProgress().settings.examDate);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const dismiss = () => {
    if (!getProgress().settings.onboarded) updateSettings({ onboarded: true });
    setOpen(false);
  };
  const valid = value !== "" && (daysUntil(value) ?? -1) >= 0;
  const save = () => {
    if (!valid) return;
    updateSettings(examDatePatch(value));
    setOpen(false);
  };

  return (
    <dialog
      ref={ref}
      className="exam-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); dismiss(); }}
      onClose={() => setOpen(false)}
      // Not every embedded browser turns Esc into a dialog "cancel"; handle it directly as well.
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); dismiss(); } else e.stopPropagation(); }}
    >
      {open && (
        <form method="dialog" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className="exam-dialog-body">
            <span className="eyebrow tone-accent">{firstRun ? "Welcome to OpenPackets" : "Your exam"}</span>
            <h2 id={titleId} className="display">When is your exam?</h2>
            <p className="lead">Your countdown, study plan and weekly pace all work back from this date. You can change it any time in Settings.</p>
            <ExamDatePicker value={value} onChange={setValue} label="Target exam date" />
          </div>
          <div className="exam-dialog-actions">
            <button type="button" className="link" onClick={dismiss}>{firstRun ? "Not booked yet — skip for now" : "Cancel"}</button>
            <button type="submit" className="btn accent" disabled={!valid}>Save date →</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
