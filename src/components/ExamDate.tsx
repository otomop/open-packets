import { useEffect, useId, useRef, useState } from "react";
import { course } from "@/lib/course";
import { daysUntil, examDatePatch, formatExamDate, trackForDate, trackLabel } from "@/lib/plan";
import { getProgress, localDateKey, updateSettings, useProgress } from "@/lib/store";
import { AccentColorPicker } from "./AccentColorPicker";

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
 * First launch offers a favorite color, then an exam date. Later calls open only the date picker.
 * Uses a native modal <dialog> so focus is trapped, Esc works and the page behind is inert.
 */
export function ExamDateDialog() {
  const p = useProgress();
  const firstRun = !p.settings.onboarded && !p.settings.examDate;
  const [open, setOpen] = useState(firstRun);
  const [welcome, setWelcome] = useState(firstRun);
  const [step, setStep] = useState<"color" | "date">(firstRun ? "color" : "date");
  const [value, setValue] = useState(p.settings.examDate);
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onOpen = () => {
      setValue(getProgress().settings.examDate);
      setWelcome(false);
      setStep("date");
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
    if (open) heading.current?.focus();
  }, [open, step]);

  const dismiss = () => {
    if (!getProgress().settings.onboarded) updateSettings({ onboarded: true });
    setOpen(false);
  };
  const valid = value !== "" && (daysUntil(value) ?? -1) >= 0;
  const save = () => {
    if (step === "color") { setStep("date"); return; }
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
            <div className="welcome-progress"><span className="eyebrow tone-accent">{welcome ? "Welcome to OpenPackets" : "Your exam"}</span>{welcome && <span className="small welcome-step">{step === "color" ? "1" : "2"} / 2</span>}</div>
            <h2 ref={heading} tabIndex={-1} id={titleId} className="display welcome-title">{step === "color" ? "Pick a favorite color." : "When is your exam?"}</h2>
            {step === "color" ? <>
              <p className="lead">Make this study space yours. Pick one of these five colors or choose your own. You can change it any time in Settings.</p>
              <AccentColorPicker value={p.settings.accentColor} onChange={accentColor => updateSettings({ accentColor })} />
            </> : <>
              <p className="lead">Your countdown, study plan and weekly pace all work back from this date. You can change it any time in Settings.</p>
              <ExamDatePicker value={value} onChange={setValue} label="Target exam date" />
            </>}
          </div>
          <div className="exam-dialog-actions">
            {welcome && step === "date" && <button type="button" className="link" onClick={() => setStep("color")}>← Color</button>}
            <button type="button" className="link" onClick={dismiss}>{step === "color" ? "Set up later" : welcome ? "Skip date for now" : "Cancel"}</button>
            <button type="submit" className="btn accent welcome-next" disabled={step === "date" && !valid}>{step === "color" ? "Continue →" : "Save date →"}</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
