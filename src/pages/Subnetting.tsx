import { useEffect, useRef, useState } from "react";
import { subnetInfo } from "@/lib/subnet";
import { gradeDrill, makeDrill, type Difficulty, type DrillGrade, type DrillMode, type SubnetDrill } from "@/lib/subnet-drills";
import { SUBNET_MODES, guideByMode, type SubnetGuide } from "@/lib/subnet-guides";
import { logActivity, update, useProgress } from "@/lib/store";
import { chapterHref } from "@/lib/router";
import { chapterById } from "@/lib/course";
import { Binary } from "@/components/Diagram";

const LEVELS: { id: Difficulty; title: string; detail: string }[] = [
  { id: "foundation", title: "Foundation", detail: "Start with familiar boundaries and smaller plans. Explain each step before working faster." },
  { id: "standard", title: "Standard", detail: "Work across octet boundaries, size allocations and apply the method to client settings." },
  { id: "challenge", title: "Challenge", detail: "Check exceptions, growth requirements and less familiar boundaries. Accuracy comes before speed." },
];
type ReviewResult = { mode: DrillMode; correct: boolean; skipped: boolean; assisted: boolean; seconds: number };
type Review = { queue: SubnetDrill[]; index: number; results: ReviewResult[] };
const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function LessonLinks({ guide, onUse }: { guide: SubnetGuide; onUse?: () => void }) {
  const chapter = chapterById.get(guide.chapterId);
  return <div className="subnet-lesson-links">
    <a className="link" target="_blank" rel="noopener noreferrer" onClick={onUse} onAuxClick={onUse} href={`${chapterHref(guide.chapterId, "learn")}?section=${encodeURIComponent(guide.sectionId)}`}>
      Learn the method · {chapter ? `Chapter ${String(chapter.number).padStart(2, "0")}` : "Lesson"} ↗
    </a>
    <a className="link" target="_blank" rel="noopener noreferrer" onClick={onUse} onAuxClick={onUse} href={chapterHref(guide.chapterId, "lab")}>Apply it in the guided lab ↗</a>
    <small>Opens in a new tab so you can keep this problem.</small>
  </div>;
}

function ProblemWalkthrough({ drill, onUse }: { drill: SubnetDrill; onUse: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [allSteps, setAllSteps] = useState(false);
  const lastStep = drill.workedSteps.length - 1;
  const complete = allSteps || step === lastStep;

  return <div className="subnet-walkthrough">
    <button type="button" className="btn ghost subnet-walkthrough-toggle" aria-expanded={open} aria-controls="subnet-walkthrough-content" onClick={() => {
      if (!open) onUse();
      setOpen(value => !value);
    }}>{open ? "Hide walkthrough" : "Show me how it's done"}</button>
    {!open && <p className="small muted">Follow the solution to this exact problem, one step at a time. Opening it counts as help before your first check.</p>}
    <div id="subnet-walkthrough-content" hidden={!open}>{open && <section aria-label="Current problem walkthrough">
      <h3>This problem</h3><p className="subnet-walkthrough-problem mono">{drill.prompt}</p>
      {allSteps ? <ol className="subnet-walkthrough-all">{drill.workedSteps.map((text, index) => <li key={index}>{text}</li>)}</ol> :
        <div className="subnet-walkthrough-step" aria-live="polite" aria-atomic="true">
          <h4>Step {step + 1} of {drill.workedSteps.length}</h4><p>{drill.workedSteps[step]}</p>
        </div>}
      <div className="subnet-walkthrough-actions">
        {!allSteps && <>
          <button type="button" className="btn ghost sm" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>← Previous step</button>
          <button type="button" className="btn sm" disabled={step === lastStep} onClick={() => setStep(value => Math.min(lastStep, value + 1))}>Next step →</button>
        </>}
        <button type="button" className="link" onClick={() => setAllSteps(value => !value)}>{allSteps ? "One step at a time" : "Show all steps"}</button>
      </div>
      {complete && <div className="subnet-walkthrough-answer">
        {drill.binary && <Binary spec={{ type: "binary", ...drill.binary }} />}
        <h3>Completed answer</h3>
        <dl className="subnet-facts">{drill.fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.answer}</dd></div>)}</dl>
        <p className="small muted">Explain each result in your own words, then try a fresh problem without the walkthrough.</p>
      </div>}
    </section>}</div>
  </div>;
}

function AddressExplorer({ onUse }: { onUse: () => void }) {
  const [address, setAddress] = useState("192.168.44.173");
  const [prefix, setPrefix] = useState("26");
  let result: ReturnType<typeof subnetInfo> | null = null;
  try { if (/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(prefix)) result = subnetInfo(address, Number(prefix)); } catch { /* Show input guidance below. */ }
  return <details className="subnet-guide q-card" onToggle={e => { if (e.currentTarget.open) onUse(); }}>
    <summary>Address explorer</summary>
    <p className="muted small">Use this to check your reasoning after working on paper. Opening it marks the current check as assisted.</p>
    <div className="subnet-explorer-inputs">
      <label className="field">Explore IPv4 address<input className="mono" value={address} onChange={e => setAddress(e.target.value)} autoComplete="off" spellCheck={false} /></label>
      <label className="field">Explore prefix<input className="mono" inputMode="numeric" value={prefix} onChange={e => setPrefix(e.target.value)} autoComplete="off" /></label>
    </div>
    {result ? <>
      <Binary spec={{ type: "binary", ip: address, prefix: Number(prefix) }} />
      <dl className="subnet-facts">
        <dt>Network / prefix</dt><dd>{result.network}/{result.prefix}</dd>
        <dt>Mask</dt><dd>{result.mask}</dd><dt>Wildcard</dt><dd>{result.wildcard}</dd>
        <dt>{result.prefix >= 31 ? "First address" : "First usable"}</dt><dd>{result.first}</dd>
        <dt>{result.prefix >= 31 ? "Last address" : "Last usable"}</dt><dd>{result.last}</dd>
        <dt>Directed broadcast</dt><dd>{result.broadcast === "—" ? "None" : result.broadcast}</dd>
        <dt>Total addresses</dt><dd>{result.size.toLocaleString()}</dd>
      </dl>
      <p className="small muted">{result.prefix === 31 ? "A /31 is for a supported two-endpoint point-to-point link. Both addresses are endpoints; neither is a directed broadcast." : result.prefix === 32 ? "A /32 identifies one address, such as a loopback or host route. It is not a multi-host LAN." : result.prefix === 0 ? "A /0 covers the entire IPv4 space and is used for a default route. It is not a deployable LAN allocation." : "This shows address arithmetic. Special-purpose ranges and addresses already in use still need separate checks before deployment."}</p>
    </> : <p role="status" className="muted">Enter four decimal octets from 0 to 255 and a whole prefix from 0 to 32.</p>}
  </details>;
}

export default function Subnetting() {
  const totals = useProgress(p => p.subnet);
  const [difficulty, setDifficulty] = useState<Difficulty>("foundation");
  const [drill, setDrill] = useState<SubnetDrill>(() => makeDrill("network", "foundation"));
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DrillGrade | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [serial, setSerial] = useState(0);
  const [focusRequested, setFocusRequested] = useState(false);
  const recorded = useRef(false);
  const submitted = useRef(false);
  const started = useRef(Date.now());
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  const summary = useRef<HTMLElement>(null);
  const guide = guideByMode[drill.mode];
  const graded = result !== null;
  const complete = !!review && review.index >= review.queue.length;
  const filled = drill.fields.every(field => (values[field.key] ?? "").trim());
  const stats = totals.byMode[drill.mode];

  useEffect(() => {
    if (!focusRequested || complete || !form.current) return;
    const inputs = Array.from(form.current.querySelectorAll<HTMLInputElement>("input:not([disabled])"));
    (inputs.find(input => !input.value.trim()) ?? inputs[0])?.focus({ preventScroll: true });
    form.current.scrollIntoView({ block: "start", behavior: "instant" });
  }, [serial, focusRequested, complete]);
  useEffect(() => { if (graded) feedback.current?.focus(); }, [graded]);
  useEffect(() => {
    if (!complete) return;
    summary.current?.focus({ preventScroll: true });
    summary.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [complete]);

  function load(nextDrill: SubnetDrill) {
    setDrill(nextDrill); setValues({}); setResult(null); setRepairing(false); setAssisted(false);
    recorded.current = false; submitted.current = false; started.current = Date.now();
    setSerial(n => n + 1); setFocusRequested(true);
  }
  function choose(mode: DrillMode, level = difficulty) {
    setReview(null); setDifficulty(level); load(makeDrill(mode, level));
  }
  function startReview() {
    const modes = SUBNET_MODES.map(g => g.id);
    for (let i = modes.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [modes[i], modes[j]] = [modes[j], modes[i]]; }
    const queue = modes.map(mode => makeDrill(mode, difficulty));
    setReview({ queue, index: 0, results: [] }); load(queue[0]);
  }
  function next(skip = false) {
    if (!review) { load(makeDrill(drill.mode, difficulty)); return; }
    const results = skip && !recorded.current ? [...review.results, { mode: drill.mode, correct: false, skipped: true, assisted, seconds: Math.round((Date.now() - started.current) / 1000) }] : review.results;
    const index = review.index + 1;
    setReview({ ...review, index, results });
    if (index < review.queue.length) load(review.queue[index]);
  }
  function check() {
    if (submitted.current || !filled) return;
    submitted.current = true;
    const checked = gradeDrill(drill, values);
    setResult(checked);
    if (recorded.current) return;
    recorded.current = true;
    update(p => {
      const previous = p.subnet.byMode[drill.mode] ?? { a: 0, c: 0 };
      p.subnet = { attempts: p.subnet.attempts + 1, correct: p.subnet.correct + Number(checked.allCorrect), byMode: { ...p.subnet.byMode, [drill.mode]: { a: previous.a + 1, c: previous.c + Number(checked.allCorrect) } } };
    });
    logActivity(1);
    if (review) setReview(current => current ? { ...current, results: [...current.results, { mode: drill.mode, correct: checked.allCorrect, skipped: false, assisted, seconds: Math.round((Date.now() - started.current) / 1000) }] } : null);
  }
  function repair() {
    if (!result) return;
    setValues(previous => Object.fromEntries(drill.fields.map(field => [field.key, result.fields.find(r => r.key === field.key)?.correct ? previous[field.key] : ""])));
    setResult(null); setRepairing(true); submitted.current = false; setSerial(n => n + 1); setFocusRequested(true);
  }
  const useHelp = () => { if (!recorded.current) setAssisted(true); };

  return <div className="page subnet-page">
    <div className="page-head">
      <div className="eyebrow tone-accent">Subnetting trainer · {totals.correct} / {totals.attempts} first checks correct</div>
      <h1 className="display wipe">One bit at a time.</h1>
      <p className="lead">Calculate the range, explain the decision, then check the configuration. Work through ten skills with guided methods, new problems and feedback on each answer.</p>
    </div>
    <div className="subnet-controls panel">
      <label className="field">Difficulty<select value={difficulty} disabled={!!review && !complete} onChange={e => choose(drill.mode, e.target.value as Difficulty)}>{LEVELS.map(level => <option key={level.id} value={level.id}>{level.title}</option>)}</select></label>
      <p className="muted small">{LEVELS.find(level => level.id === difficulty)?.detail}</p>
      <button className="btn" type="button" disabled={!!review && !complete} onClick={startReview}>Mixed review · 10 problems</button>
    </div>
    <p className="muted small">Start with network boundaries and host sizing. Add each later skill after its linked lesson. Mixed review samples every skill; it is a study check, not an exam score prediction.</p>
    {review && !complete ? <div className="subnet-session panel"><span><b>Mixed review · {review.index + 1} / {review.queue.length}</b> · one problem per skill</span><button type="button" className="link" onClick={() => setReview({ ...review, index: review.queue.length })}>End and review results</button></div> : !complete &&
      <div className="modes subnet-modes" aria-label="Subnetting skills">{SUBNET_MODES.map(item => <button key={item.id} type="button" aria-pressed={drill.mode === item.id} className={drill.mode === item.id ? "on" : ""} onClick={() => choose(item.id)}><b>{item.title}</b><small>{item.description}</small></button>)}</div>}
    {complete && review ? <section ref={summary} tabIndex={-1} className="q-card subnet-review" aria-label="Mixed review results">
      <div className="eyebrow tone-accent">Mixed review results</div>
      <h2>{review.results.filter(r => r.correct).length} / {review.queue.length} correct on the first check</h2>
      <p>{review.results.filter(r => !r.skipped).length} checked · {review.results.filter(r => r.skipped).length} skipped · {review.queue.length - review.results.length} not checked · {review.results.filter(r => r.assisted && !r.skipped).length} assisted checks.</p>
      <p className="muted small">Repairs do not change the original result. Times include reading and working; there is no imposed speed target. Review details are kept only while this results view is open. Your lifetime practice totals are saved.</p>
      <div className="table-scroll"><table><thead><tr><th>Skill</th><th>First check</th><th>Help</th><th>Time</th><th>Next step</th></tr></thead><tbody>{review.queue.map(item => {
        const answer = review.results.find(r => r.mode === item.mode);
        return <tr key={item.mode}><th>{guideByMode[item.mode].title}</th><td>{!answer ? "Not checked" : answer.skipped ? "Skipped" : answer.correct ? "Correct" : "Needs review"}</td><td>{answer?.assisted ? "Used" : "—"}</td><td>{answer ? duration(answer.seconds) : "—"}</td><td><button type="button" className="link" onClick={() => choose(item.mode)}>Practice this skill</button></td></tr>;
      })}</tbody></table></div>
      <div className="q-bar"><button type="button" className="btn" onClick={startReview}>Start another mixed review</button><button type="button" className="btn ghost" onClick={() => choose("network")}>Return to skill practice</button></div>
    </section> : <div className="trainer subnet-workspace">
      <form ref={form} className="q-card subnet-problem" onSubmit={e => { e.preventDefault(); graded ? next() : check(); }}>
        <div className="q-bar"><span className="eyebrow">{guide.title} · {difficulty}</span>{!graded && <button type="button" className="link" onClick={() => next(true)}>{review ? "Skip this problem" : "New problem"}</button>}</div>
        <h2 className="prompt">{drill.prompt}</h2>
        {drill.detail && <p>{drill.detail}</p>}{drill.rule && <p className="notice">{drill.rule}</p>}{drill.help && <p className="muted small">{drill.help}</p>}
        <div className="subnet-answer-fields">{drill.fields.map(field => {
          const fieldResult = result?.fields.find(r => r.key === field.key);
          const description = [`help-${field.key}`, ...(graded ? [`feedback-${field.key}`] : [])].join(" ");
          return <div className="subnet-answer" key={field.key}>
            <label htmlFor={`answer-${field.key}`}>{field.label}</label>
            <input id={`answer-${field.key}`} aria-describedby={description} aria-invalid={graded && !fieldResult?.correct ? true : undefined} autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={120} placeholder={field.placeholder} value={values[field.key] ?? ""} disabled={graded} className={graded ? fieldResult?.correct ? "ok" : "bad" : ""} onChange={e => setValues(previous => ({ ...previous, [field.key]: e.target.value }))} />
            <small id={`help-${field.key}`} className="muted">{field.help ?? (field.format === "integer" ? "Enter a whole number without separators." : "")}</small>
            {graded && <div id={`feedback-${field.key}`} className={`subnet-field-feedback ${fieldResult?.correct ? "ok" : "bad"}`}><b>{fieldResult?.correct ? "Correct" : `Expected: ${field.answer}`}</b>{!fieldResult?.correct && <span>{fieldResult?.feedback}</span>}</div>}
          </div>;
        })}</div>
        {!graded && <p className="muted small">{repairing ? "Repair practice: your first-check score is already recorded." : assisted ? "Assisted practice · learning support used." : "Work on paper first. Check when every field is filled."}</p>}
        <div className="q-bar"><button type="submit" className={`btn${graded ? " accent" : ""}`} disabled={!graded && !filled}>{graded ? review && review.index === review.queue.length - 1 ? "Finish review →" : "Next problem →" : repairing ? "Check repair" : "Check answers"}</button>{graded && !result.allCorrect && <button type="button" className="btn ghost" onClick={repair}>Repair my answers</button>}</div>
        {graded && <div className="explain">
          <p ref={feedback} tabIndex={-1} role="status" onKeyDown={e => { if (e.key === "Enter" && !e.repeat) { e.preventDefault(); next(); } }}><b>{result.allCorrect ? repairing ? "Corrected. Your original score is unchanged." : "All answers correct." : "Review the marked fields and the method below."}</b></p>
          <h3>Work through the answer</h3><ol>{drill.workedSteps.map((step, i) => <li key={i}>{step}</li>)}</ol>{drill.explain !== drill.workedSteps.join(" ") && <p>{drill.explain}</p>}
          {drill.binary && <Binary spec={{ type: "binary", ...drill.binary }} />}<LessonLinks guide={guide} onUse={useHelp} />
        </div>}
        <p className="muted small">{stats ? `${stats.c} of ${stats.a} recorded first checks correct in this skill.` : "No recorded checks in this skill yet."} Enter checks your answers; Enter from the result advances.</p>
      </form>
      <aside className="subnet-support" aria-label="Learning support">
        <section className="q-card"><span className="eyebrow tone-accent">Learn, practise, apply</span><h2>{guide.title}</h2><p className="small muted">{guide.scope}</p><LessonLinks guide={guide} onUse={useHelp} />
          <ProblemWalkthrough key={`walkthrough-${serial}`} drill={drill} onUse={useHelp} />
          <p className="small muted"><b>Watch for this:</b> {guide.pitfall}</p>
        </section>
        <AddressExplorer key={`explore-${serial}`} onUse={useHelp} /><p className="small muted">Calculation practice is one part of the skill. Use the linked lab to configure addresses, verify both ends and explain the return path.</p>
      </aside>
    </div>}
    <details className="q-card subnet-progress"><summary>Your practice by skill</summary><p className="muted small">Lifetime first-check totals include earlier trainer sessions, all difficulties and guided practice. Use them to choose what to practise, rather than as a readiness score.</p><div className="table-scroll"><table><thead><tr><th>Skill</th><th>Correct</th><th>Checked</th></tr></thead><tbody>{SUBNET_MODES.map(item => <tr key={item.id}><th>{item.title}</th><td>{totals.byMode[item.id]?.c ?? 0}</td><td>{totals.byMode[item.id]?.a ?? 0}</td></tr>)}</tbody></table></div></details>
  </div>;
}
