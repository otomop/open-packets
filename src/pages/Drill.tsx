import { useEffect, useMemo, useRef, useState } from "react";
import { chapters, chapterById, isRequired } from "@/lib/course";
import { drillBank } from "@/lib/banks/commands";
import { commandPlans } from "@/lib/command-curriculum";
import { gradeCommand } from "@/lib/commands";
import { logActivity, update, useProgress } from "@/lib/store";
import { chapterHref } from "@/lib/router";
import { JumpGrid, TabLayout } from "@/components/ChapterLayout";
import type { BankDrill, Progress, Track } from "@/lib/types";
import "@/styles/command-drill.css";

type Entry = {
  given: string;
  assisted: boolean;
  hintOpen?: boolean;
  revealed?: boolean;
  skipped?: boolean;
  first?: { correct: boolean; assisted: boolean };
  grade?: { correct: boolean; feedback: string };
};
const emptyEntry = (): Entry => ({ given: "", assisted: false });
const demandLabels = { foundation: "First skills", application: "Apply a skill", analysis: "Choose from evidence" };

export function commandFocus(drill: BankDrill, track: Track) {
  const chapter = chapterById.get(drill.chapterId);
  return chapter && !isRequired(chapter, track) ? "supporting" : drill.teaching.focusByTrack?.[track] ?? drill.teaching.focus;
}

/** Only previously practised material, ordered once when the learner starts a review. */
export function reviewCommands(bank: BankDrill[], stats: Progress["drills"]): BankDrill[] {
  return bank.filter(d => stats[d.id]?.attempts > 0).sort((a, b) => {
    const sa = stats[a.id], sb = stats[b.id];
    return sa.correct / sa.attempts - sb.correct / sb.attempts || sa.last.localeCompare(sb.last);
  }).slice(0, 15);
}

export function CommandSession({ list, chapterId, onRestart, onNextChapter }: {
  list: BankDrill[]; chapterId?: string; onRestart: (ids?: string[]) => void; onNextChapter?: () => void;
}) {
  const track = useProgress(p => p.settings.track);
  const [i, setI] = useState(0);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const entryRef = useRef(entries);
  const [finished, setFinished] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const d = list[i];
  const entry = entries[d?.id] ?? emptyEntry();
  const setEntry = (id: string, transform: (current: Entry) => Entry) => {
    const next = { ...entryRef.current, [id]: transform(entryRef.current[id] ?? emptyEntry()) };
    entryRef.current = next;
    setEntries(next);
  };
  const help = () => setEntry(d.id, current => current.first ? current : { ...current, assisted: true });
  const pick = (n: number) => setI(Math.max(0, Math.min(list.length - 1, n)));
  useEffect(() => { if (finished) heading.current?.focus(); }, [finished]);
  useEffect(() => {
    if (finished) return;
    if (entry.grade) feedback.current?.focus();
    else if (i > 0 || entry.first) input.current?.focus();
  }, [i, finished, entry.grade, entry.first]);
  if (!d) return null;

  const check = () => {
    const current = entryRef.current[d.id] ?? emptyEntry();
    if (current.grade || !current.given.trim()) return;
    const grade = gradeCommand(current.given, d);
    setEntry(d.id, value => ({ ...value, skipped: false, grade, first: value.first ?? { correct: grade.correct, assisted: value.assisted } }));
    if (!current.first) {
      update(s => {
        const prev = s.drills[d.id] ?? { attempts: 0, correct: 0, last: "" };
        s.drills = { ...s.drills, [d.id]: { attempts: prev.attempts + 1, correct: prev.correct + Number(grade.correct), last: new Date().toISOString() } };
      });
      logActivity(0.5);
    }
  };
  const next = () => { if (i === list.length - 1) setFinished(true); else pick(i + 1); };
  const checked = list.filter(item => entries[item.id]?.first);
  const independent = checked.filter(item => entries[item.id].first?.correct && !entries[item.id].first?.assisted);
  const assisted = checked.filter(item => entries[item.id].first?.assisted);
  const skipped = list.filter(item => entries[item.id]?.skipped && !entries[item.id]?.first);
  const review = list.filter(item => !entries[item.id]?.first?.correct || entries[item.id]?.first?.assisted);
  const ch = chapterById.get(d.chapterId);
  const showAnswer = entry.revealed || entry.grade?.correct;

  return <TabLayout nav={chapterId && !finished ? <JumpGrid label={`Commands · ${list.length}`} count={list.length} current={i} stateOf={n => {
    const result = entries[list[n].id];
    return result?.first ? result.first.correct ? "ok" : "bad" : result?.skipped ? "done" : undefined;
  }} ariaLabel={n => `Command ${n + 1} of ${list.length}`} onPick={pick} /> : undefined}>
    <div className="article command-session">
      {finished ? <section className="command-summary" aria-label="Command practice results">
        <span className="eyebrow">Round complete</span><h2 ref={heading} tabIndex={-1}>What to revisit</h2>
        <p>{checked.length} checked · {skipped.length} skipped · {list.length - checked.length - skipped.length} not checked</p>
        <p className="command-result-count"><strong>{independent.length}</strong> correct without help · {assisted.length} checked with help</p>
        <ol className="command-result-list">{list.map((item, n) => {
          const result = entries[item.id];
          const status = !result?.first ? result?.skipped ? "Skipped" : "Not checked" : result.first.correct ? result.first.assisted ? "Correct with help" : "Correct without help" : result.grade?.correct ? "Corrected after review" : "Needs review";
          return <li key={item.id}><button type="button" className="link" onClick={() => { pick(n); setFinished(false); }}>{item.task}</button><span>{status}</span></li>;
        })}</ol>
        <div className="command-actions">{review.length > 0 && <button type="button" className="btn accent" onClick={() => onRestart(review.map(item => item.id))}>Practise these again · {review.length}</button>}<button type="button" className="btn ghost" onClick={() => onRestart()}>Repeat this set</button>{onNextChapter && <button type="button" className="btn ghost" onClick={onNextChapter}>Next chapter →</button>}</div>
        <p className="muted small">Corrections keep your first result. Use the chapter lab to check that you can apply these commands on a device.</p>
      </section> : <>
        <div className="command-progress"><span className="eyebrow">{String(ch?.number ?? 0).padStart(2, "0")} · {d.chapterTitle}</span><span>{i + 1} of {list.length}</span></div>
        <form className="cmd-drill" onSubmit={e => { e.preventDefault(); check(); }}>
          {commandFocus(d, track) === "supporting" && <span className="eyebrow">Extra lab practice</span>}
          <h2 className="cmd-task">{d.task}</h2>
          <label className="command-label" htmlFor={`command-${d.id}`}>Your command <span className="muted small">· leave out the prompt</span></label>
          <div className={`cmd-input ${entry.grade ? entry.grade.correct ? "ok" : "bad" : ""}`}><span className="cli-prompt">{d.mode}</span><input id={`command-${d.id}`} ref={input} value={entry.given} disabled={!!entry.grade} autoComplete="off" spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-describedby={`command-feedback-${d.id}`} aria-invalid={entry.grade && !entry.grade.correct || undefined} onChange={e => setEntry(d.id, value => ({ ...value, given: e.target.value }))} placeholder="Type your command…" /></div>
          <div id={`command-feedback-${d.id}`} role="status" ref={feedback} tabIndex={-1} className="command-feedback">{entry.grade && <><strong>{entry.grade.correct ? entry.first?.correct ? "Correct." : "Corrected. Your first result is unchanged." : "Not quite."}</strong>{!entry.grade.correct && <p>{entry.grade.feedback}</p>}</>}{entry.first && !entry.grade && <p>Edit your command and try again. Your first result is already recorded.</p>}</div>
          <div className="command-actions">{!entry.grade ? <button key="check" type="submit" className="btn accent" disabled={!entry.given.trim()}>{entry.first ? "Check correction" : "Check command"}</button> : <>{!entry.grade.correct && <button key="repair" type="button" className="btn" onClick={() => setEntry(d.id, value => ({ ...value, grade: undefined }))}>Edit my command</button>}<button key="next" type="button" className="btn accent" onClick={next}>{i === list.length - 1 ? "Finish and review" : "Next command →"}</button></>}
            {!showAnswer && <button key="hint" type="button" className="link" aria-expanded={!!entry.hintOpen} aria-controls={`hint-${d.id}`} onClick={() => setEntry(d.id, value => ({ ...value, hintOpen: !value.hintOpen, assisted: value.first ? value.assisted : true }))}>{entry.hintOpen ? "Hide hint" : "Hint"}</button>}
          </div>
          {entry.hintOpen && !showAnswer && <p className="command-hint" id={`hint-${d.id}`}>{d.teaching.hint}</p>}
          {!showAnswer && <button type="button" className="link command-answer-toggle" onClick={() => setEntry(d.id, value => ({ ...value, revealed: true, assisted: value.first ? value.assisted : true }))}>Review answer</button>}
          {showAnswer && <div className="command-answer" aria-label="Answer and explanation"><pre className="command-code"><code>{d.answer}</code></pre><p>{d.teaching.takeaway}</p>{!!d.accept?.length && <details><summary>Accepted alternatives</summary>{d.accept.map(variant => <pre className="command-code" key={variant}><code>{variant}</code></pre>)}</details>}{!entry.first && <span className="small muted">Answer shown · this check will count as practice with help.</span>}</div>}
          <div className="command-resources"><a className="link" href={`${chapterHref(d.chapterId, "learn")}?section=${encodeURIComponent(d.teaching.sectionId)}`} target="_blank" rel="noopener" onClick={help} onAuxClick={help}>Related lesson ↗</a>{ch?.lab && <a className="link" href={chapterHref(d.chapterId, "lab")} target="_blank" rel="noopener" onClick={help} onAuxClick={help}>Chapter lab ↗</a>}{entry.assisted && !entry.first && !entry.revealed && <span className="small muted">Help used</span>}</div>
        </form>
        <div className="command-session-actions"><button type="button" className="btn ghost sm" disabled={i === 0} onClick={() => pick(i - 1)}>← Previous</button>{!entry.grade && <button type="button" className="link" onClick={() => { setEntry(d.id, value => ({ ...value, skipped: !value.first })); next(); }}>Skip for now</button>}<button type="button" className="link" onClick={() => setFinished(true)}>End round</button></div>
      </>}
    </div>
  </TabLayout>;
}

export function DrillRunner({ chapterId }: { chapterId?: string }) {
  const stats = useProgress(p => p.drills);
  const track = useProgress(p => p.settings.track);
  const [filter, setFilter] = useState(chapterId ?? chapters[0]?.id ?? "");
  const [extras, setExtras] = useState(false);
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [round, setRound] = useState(0);
  const eligible = useMemo(() => drillBank.filter(d => extras || commandFocus(d, track) === "core"), [extras, track]);
  const chapterList = useMemo(() => eligible.filter(d => d.chapterId === filter), [eligible, filter]);
  const list = useMemo(() => reviewIds ? reviewIds.map(id => eligible.find(d => d.id === id)).filter((d): d is BankDrill => !!d) : chapterList, [chapterList, reviewIds, eligible]);
  const introduced = reviewCommands(eligible, stats);
  const chapter = chapterById.get(filter);
  const plan = commandPlans.get(filter);
  const totalInChapter = drillBank.filter(d => d.chapterId === filter).length;
  const extraCount = drillBank.filter(d => d.chapterId === filter && commandFocus(d, track) === "supporting").length;
  const nextChapter = chapters.find(c => c.number > (chapter?.number ?? 0) && eligible.some(d => d.chapterId === c.id));
  const changeChapter = (id: string) => { setFilter(id); setReviewIds(null); setRound(n => n + 1); };
  return <div className={`command-trainer ${chapterId ? "command-embedded" : ""}`}>
    <div className="command-controls">
      {!chapterId && <label className="field">Chapter<select value={filter} onChange={e => changeChapter(e.target.value)}>{chapters.map(c => {
        const count = eligible.filter(d => d.chapterId === c.id).length;
        return <option key={c.id} value={c.id}>{String(c.number).padStart(2, "0")} · {c.title} · {count ? `${count} ${count === 1 ? "command" : "commands"}` : "Lesson & lab"}</option>;
      })}</select></label>}
      {!chapterId && <button type="button" className="btn ghost sm" disabled={!introduced.length} onClick={() => { setReviewIds(introduced.map(d => d.id)); setRound(n => n + 1); }}>Review previous practice</button>}
      {reviewIds && <button type="button" className="link" onClick={() => changeChapter(filter)}>Return to chapter</button>}
    </div>
    {!reviewIds && plan && <div className="command-chapter-goal">{list.length > 0 && <span className="eyebrow">{demandLabels[plan.demand]}</span>}<p>{plan.goal}</p></div>}
    {reviewIds && <p className="command-chapter-goal muted">Reviewing {list.length} previously practised commands, with weaker results first.</p>}
    {extraCount > 0 && !reviewIds && <label className="command-extra"><input type="checkbox" checked={extras} onChange={e => { setExtras(e.target.checked); setReviewIds(null); setRound(n => n + 1); }} />Include {extraCount} extra lab {extraCount === 1 ? "command" : "commands"} beyond this track's core practice</label>}
    {list.length > 0 ? <CommandSession key={`${filter}-${track}-${extras}-${round}`} list={list} chapterId={chapterId} onRestart={ids => { if (ids) setReviewIds(ids); setRound(n => n + 1); }} onNextChapter={!chapterId && !reviewIds && nextChapter ? () => changeChapter(nextChapter.id) : undefined} /> : <section className="command-empty">
      <h2>{reviewIds ? "No commands in this review for this track" : totalInChapter ? "Use the lesson for this track" : "Practise this through the lesson and lab"}</h2>
      <p>{reviewIds ? "Return to chapter practice to choose a set for your current exam track." : totalInChapter ? "The command configuration here is extra depth for your selected exam track. Focus on the chapter's required concepts first; the extra lab commands are available above." : plan?.emptyReason ?? "This chapter does not introduce a separate command-recall requirement."}</p>
      <div className="command-resources"><a className="link" href={chapterHref(filter, "learn")}>Open lesson →</a>{chapter?.lab && <a className="link" href={chapterHref(filter, "lab")}>Open chapter lab →</a>}</div>
      {plan && plan.reviewLinks.length > 0 && <div className="command-related"><h3>Related practice</h3>{plan.reviewLinks.map(link => <p key={link.chapterId}><a className="link" href={chapterHref(link.chapterId, drillBank.some(item => item.chapterId === link.chapterId) ? "drill" : "learn")}>{String(chapterById.get(link.chapterId)?.number).padStart(2, "0")} · {chapterById.get(link.chapterId)?.title} →</a><span>{link.reason}</span></p>)}</div>}
    </section>}
    <details className="command-help"><summary>How command practice works</summary><p>Each task starts at its displayed prompt. Type one command without the prompt. Selected common IOS abbreviations are accepted; use full keywords if an abbreviation is not recognised. Supplied values must match, and computer commands follow their own syntax.</p><p>Hints and lesson links open support when needed. Corrections and repeat visits within a round do not add extra first attempts. The chapter lab is where you execute commands and inspect real results.</p></details>
  </div>;
}

export default function DrillPage() {
  return <div className="page command-page"><div className="page-head"><div className="eyebrow tone-accent">Command drill</div><h1 className="display wipe">Choose the right command.</h1><p className="lead">Short practice matched to each chapter. Use a hint when needed, then review why the command fits.</p></div><DrillRunner /></div>;
}
