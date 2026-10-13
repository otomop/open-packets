import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { chapterById, domainsFor, isRequired, objectiveText } from "@/lib/course";
import { questionBank, questionById } from "@/lib/banks/questions";
import { chapterHref, href } from "@/lib/router";
import { logActivity, recordPracticeAttempt, recordQuestionResult, updateChapter, useProgress } from "@/lib/store";
import { mistakeIds } from "@/lib/mastery";
import { inlineHtml } from "@/lib/markdown";
import { ExhibitView, LETTERS, Reveal, fmtDate, shuffle } from "@/components/ui";
import { JumpGrid, TabLayout, jumpToId } from "@/components/ChapterLayout";
import type { BankQuestion, ChapterSummary, Progress, Question } from "@/lib/types";

/* ---------- a single question ---------- */

export interface QState { order: number[]; picked: number[]; revealed: boolean }

export function newQState(q: Question): QState {
  return { order: shuffle(q.options.map((_, i) => i)), picked: [], revealed: false };
}

export function isCorrect(q: Question, picked: number[]): boolean {
  return picked.length === q.answer.length && q.answer.every((a) => picked.includes(a));
}

export function QuestionView({ q, state, onPick, onCheck, chapterLink, index, total, anchorId }: { q: Question; state: QState; onPick: (picked: number[]) => void; onCheck?: () => void; anchorId?: string; chapterLink?: { id: string; title: string }; index?: number; total?: number }) {
  const multi = q.type === "multi";
  const checked = useRef(state.revealed);
  useEffect(() => { checked.current = state.revealed; }, [q.id, state.revealed]);
  const pick = (i: number) => {
    if (state.revealed) return;
    onPick(multi ? (state.picked.includes(i) ? state.picked.filter((x) => x !== i) : [...state.picked, i]) : [i]);
  };
  const check = () => {
    if (!onCheck || checked.current || !state.picked.length || (multi && state.picked.length !== q.answer.length)) return;
    checked.current = true;
    onCheck();
  };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || document.querySelector("dialog[open]")) return;
    const target = e.target as HTMLElement;
    if (target.isContentEditable || target.closest("input, textarea, select, [contenteditable=true]")) return;
    const n = Number(e.key);
    if (n >= 1 && n <= state.order.length && !state.revealed) { e.preventDefault(); pick(state.order[n - 1]); }
    if (e.key === "Enter" && !target.closest("button, a, [role=button]") && onCheck && !state.revealed) { e.preventDefault(); check(); }
  };
  const correct = state.revealed && isCorrect(q, state.picked);
  return (
    <div className="q-card" id={anchorId} tabIndex={0} onKeyDown={onKey}>
      <div className="q-bar">
        <span className="eyebrow">{index !== undefined && total ? `Question ${index + 1} of ${total} · ` : ""}{multi ? `choose ${q.answer.length}` : "choose one"}{q.objectives[0] ? ` · ${q.objectives[0].replace(":", " ")}` : ""}</span>
        <span className="eyebrow">{"◆".repeat(q.difficulty || 1)}<span className="dim">{"◆".repeat(3 - (q.difficulty || 1))}</span></span>
      </div>
      <ExhibitView exhibit={q.exhibit} />
      <p className="q-prompt" dangerouslySetInnerHTML={{ __html: inlineHtml(q.prompt) }} />
      <div className="q-options">
        {state.order.map((oi, pos) => {
          const sel = state.picked.includes(oi);
          const isAns = q.answer.includes(oi);
          const cls = state.revealed ? (sel && isAns ? "right" : sel && !isAns ? "wrong" : !sel && isAns ? "missed" : "") : sel ? "sel" : "";
          return (
            <button key={oi} type="button" className={`opt ${cls}`} disabled={state.revealed} aria-pressed={sel} onClick={() => pick(oi)}>
              <span className="letter">{LETTERS[pos]}</span>
              <span dangerouslySetInnerHTML={{ __html: inlineHtml(q.options[oi]) }} />
            </button>
          );
        })}
      </div>
      {!state.revealed && onCheck && <div><button type="button" className="btn" disabled={!state.picked.length || (multi && state.picked.length !== q.answer.length)} onClick={check}>Check answer</button></div>}
      {state.revealed && (
        <div className="explain">
          <b style={{ color: correct ? "var(--ok)" : "var(--bad)" }}>{correct ? "Correct." : state.picked.length ? "Not quite." : "Not answered."} <span className="dim" style={{ fontWeight: 400 }}>Answer: {q.answer.map((a) => LETTERS[state.order.indexOf(a)]).sort().join(", ")}</span></b>
          <div className="md" dangerouslySetInnerHTML={{ __html: inlineHtml(q.explanation) }} />
          {q.whyWrong && (
            <div className="why">
              {Object.entries(q.whyWrong).filter(([k]) => !q.answer.includes(Number(k))).map(([k, v]) => <span key={k}><b>{LETTERS[state.order.indexOf(Number(k))]}</b><span dangerouslySetInnerHTML={{ __html: inlineHtml(v) }} /></span>)}
            </div>
          )}
          {chapterLink && <a className="link" href={chapterHref(chapterLink.id)}>Review · {chapterLink.title} →</a>}
        </div>
      )}
    </div>
  );
}

/* ---------- chapter checkpoint ---------- */

export function Checkpoint({ chapter }: { chapter: ChapterSummary }) {
  return <CheckpointContent key={chapter.id} chapter={chapter} />;
}
function CheckpointContent({ chapter }: { chapter: ChapterSummary }) {
  const checkpoint = useProgress(p => p.chapters[chapter.id]?.checkpoint);
  const questions = useMemo(() => questionBank.filter(q => q.chapterId === chapter.id), [chapter.id]);
  const [states, setStates] = useState<QState[]>(() => questions.map(newQState));
  const [done, setDone] = useState(false);
  const answered = states.filter((s) => s.revealed).length;
  const score = states.filter((s, i) => s.revealed && isCorrect(questions[i], s.picked)).length;
  const finish = () => {
    setDone(true);
    updateChapter(chapter.id, { checkpoint: { date: new Date().toISOString(), score, total: questions.length } });
    logActivity(questions.length * 0.75);
  };
  if (!questions.length) return <div className="empty">No checkpoint questions yet.</div>;
  return (
    <TabLayout
      chapter={chapter}
      nav={<JumpGrid label="Questions" count={questions.length} current={-1}
        stateOf={(i) => (states[i]?.revealed ? (isCorrect(questions[i], states[i].picked) ? "ok" : "bad") : states[i]?.picked.length ? "done" : undefined)}
        ariaLabel={(i) => `Question ${i + 1}`}
        onPick={(i) => jumpToId("q-" + questions[i].id)} />}
    >
    <div className="article">
      <div className="q-bar">
        <div><span className="eyebrow">Checkpoint</span><h2 className="display" style={{ marginTop: 6 }}>Can you explain the answer?</h2></div>
        <span className="muted">{answered} / {questions.length} answered · {score} correct{checkpoint ? ` · last ${checkpoint.score}/${checkpoint.total}` : ""}</span>
      </div>
      <p className="muted">Answer first, then read the reasoning — knowing why the alternatives are wrong matters as much as the answer. Results feed your mistakes pool and the blueprint map.</p>
      {questions.map((q, i) => (
        <QuestionView key={q.id} q={q} anchorId={"q-" + q.id} state={states[i]} index={i} total={questions.length}
          onPick={(picked) => setStates((s) => s.map((x, j) => (j === i ? { ...x, picked } : x)))}
          onCheck={() => { const ok = isCorrect(q, states[i].picked); recordQuestionResult(q.id, ok); setStates((s) => s.map((x, j) => (j === i ? { ...x, revealed: true } : x))); }} />
      ))}
      <div className="q-bar">
        <button type="button" className="btn" disabled={answered < questions.length || done} onClick={finish}>{done ? `Saved · ${score} / ${questions.length}` : "Save checkpoint result"}</button>
        <button type="button" className="btn ghost" onClick={() => { setStates(questions.map(newQState)); setDone(false); }}>Try again</button>
      </div>
    </div>
    </TabLayout>
  );
}

/* ---------- practice sessions ---------- */

type Mode = "quick" | "focus" | "exam" | "mistakes";

function selectQuestions(p: Progress, mode: Mode, scope: string, n: number): BankQuestion[] {
  const track = p.settings.track;
  let pool = questionBank.filter((q) => { const c = chapterById.get(q.chapterId)!; return isRequired(c, track) || c.objectives[track].length > 0; });
  if (mode === "mistakes") {
    const m = mistakeIds(p);
    pool = pool.filter((q) => m.has(q.id));
  } else if (mode === "focus" && scope) {
    if (scope.startsWith("chapter:")) pool = pool.filter((q) => q.chapterId === scope.slice(8));
    else if (scope.startsWith("domain:")) pool = pool.filter((q) => (track === "v1" ? q.domainV1 : q.domainV2) === scope.slice(7));
    else if (scope.startsWith("obj:")) pool = pool.filter((q) => q.objectives.some((o) => o === `${track}:${scope.slice(4)}` || o.startsWith(`${track}:${scope.slice(4)}.`)));
  }
  const rank = (q: BankQuestion) => {
    const st = p.questions[q.id];
    if (!st) return 0 + Math.random(); // unseen first
    if (!st.lastCorrect) return 1 + Math.random();
    return 2 + Math.min(1, (Date.now() - new Date(st.last).getTime()) / (30 * 86_400_000)) * -1 + Math.random() * 0.3; // older = sooner
  };
  const ranks = new Map(pool.map(q => [q.id, rank(q)]));
  const byRank = (a: BankQuestion, b: BankQuestion) => ranks.get(a.id)! - ranks.get(b.id)!;
  if (mode === "exam") {
    const domains = domainsFor(track);
    const total = n;
    const picked: BankQuestion[] = [];
    for (const d of domains) {
      const quota = Math.round((d.weight / 100) * total);
      const qs = pool.filter((q) => (track === "v1" ? q.domainV1 : q.domainV2) === d.id).sort(byRank).slice(0, quota);
      picked.push(...qs);
    }
    return shuffle(picked);
  }
  return shuffle(pool.sort(byRank).slice(0, n));
}

export default function Practice() {
  const p = useProgress(p => p, (a, b) => a.settings.track === b.settings.track && a.questions === b.questions && a.attempts === b.attempts);
  const track = p.settings.track;
  const [mode, setMode] = useState<Mode>("quick");
  const [scope, setScope] = useState<string>("");
  const [session, setSession] = useState<BankQuestion[] | null>(null);
  const [states, setStates] = useState<QState[]>([]);
  const [cur, setCur] = useState(0);
  const [finished, setFinished] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [left, setLeft] = useState(0);
  const startedAt = useRef(0);
  const attemptId = useRef("");
  const finishing = useRef(false);
  const mistakes = mistakeIds(p);
  const domains = domainsFor(track);
  const objectives = useMemo(() => [...objectiveText.entries()].filter(([k]) => k.startsWith(track + ":") && k.split(".").length === 2), [track]);
  useEffect(() => {
    if (session) document.querySelector<HTMLElement>(".q-card")?.focus({ preventScroll: true });
  }, [session, cur]);

  const start = (qs?: BankQuestion[], sessionMode: Mode = mode) => {
    const list = qs ?? selectQuestions(p, sessionMode, scope, sessionMode === "exam" ? 60 : sessionMode === "quick" ? 10 : 20);
    if (!list.length) return;
    setSession(list);
    setStates(list.map(newQState));
    setCur(0);
    setFinished(false);
    setMode(sessionMode);
    finishing.current = false;
    attemptId.current = crypto.randomUUID();
    startedAt.current = Date.now();
    setDeadline(sessionMode === "exam" ? Date.now() + 120 * 60_000 : 0);
    setLeft(120 * 60);
  };

  useEffect(() => {
    if (!deadline || finished) return;
    const t = setInterval(() => setLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [deadline, finished]);
  useEffect(() => { if (deadline && left === 0 && session && !finished) finish(); }, [left]);

  const finish = () => {
    if (!session || finishing.current) return;
    finishing.current = true;
    const revealed = states.map((s) => ({ ...s, revealed: true }));
    setStates(revealed);
    setFinished(true);
    let score = 0;
    const results: { questionId: string; correct: boolean }[] = [];
    session.forEach((q, i) => { const ok = isCorrect(q, revealed[i].picked); if (ok) score++; if (!states[i].revealed) results.push({ questionId: q.id, correct: ok }); });
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    recordPracticeAttempt({ id: attemptId.current, date: new Date().toISOString(), mode, scope, score, total: session.length, questionIds: session.map((q) => q.id), answers: Object.fromEntries(session.map((q, i) => [q.id, revealed[i].picked])), durationSec }, results);
  };

  if (!session) {
    return (
      <div className="page">
        <div className="page-head"><div className="eyebrow tone-accent">Practice · {questionBank.length} questions</div><h1 className="display wipe">Find out what you know.</h1><p className="lead">Exhibit-based questions, shuffled options, and an explanation for every wrong answer. Unseen and missed questions are served first.</p></div>
        <div className="modes">
          {([["quick", "Quick 10", "Ten questions, check each as you go."], ["focus", "Focused 20", "Twenty from one chapter, domain or objective."], ["exam", "Exam simulation", `60 questions · 120 minutes · ${track === "v1" ? "v1.1" : "v2.0"} domain weights · no feedback until the end.`], ["mistakes", `Mistakes (${mistakes.size})`, "Questions you last got wrong, until you beat them."]] as const).map(([m, t, d]) => (
            <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => setMode(m)}><b>{t}</b><small>{d}</small></button>
          ))}
        </div>
        {mode === "focus" && (
          <label className="field panel" style={{ maxWidth: 480 }}>Scope
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="">All required chapters</option>
              <optgroup label="Domains">{domains.map((d) => <option key={d.id} value={"domain:" + d.id}>{d.n} {d.title}</option>)}</optgroup>
              <optgroup label="Objectives">{objectives.map(([k, t]) => <option key={k} value={"obj:" + k.slice(3)}>{k.slice(3)} {t}</option>)}</optgroup>
              <optgroup label="Chapters">{[...chapterById.values()].map((c) => <option key={c.id} value={"chapter:" + c.id}>{String(c.number).padStart(2, "0")} {c.title}</option>)}</optgroup>
            </select>
          </label>
        )}
        <div><button type="button" className="btn" disabled={mode === "mistakes" && !mistakes.size} onClick={() => start()}>Start session →</button></div>
        {p.attempts.length > 0 && (
          <section className="part-block">
            <div className="part-head"><h2>Previous sessions</h2></div>
            <div className="review-list panel-list">
              {p.attempts.slice(-12).reverse().map((a) => (
                <a key={a.id} href="#/practice" onClick={(e) => { e.preventDefault(); const qs = a.questionIds.map((id) => questionById.get(id)).filter(Boolean) as BankQuestion[]; if (!qs.length) return; setSession(qs); setStates(qs.map((q) => ({ order: q.options.map((_, i) => i), picked: a.answers[q.id] ?? [], revealed: true }))); setMode(a.mode as Mode); setScope(a.scope); finishing.current = true; setCur(0); setFinished(true); setDeadline(0); }}>
                  <span className={`mark ${a.score / a.total >= 0.8 ? "ok" : "bad"}`}>{Math.round((a.score / a.total) * 100)}%</span>
                  <span>{fmtDate(a.date)} · {a.mode}{a.scope ? ` · ${a.scope.split(":")[1]}` : ""}</span>
                  <span className="dim num">{a.score} / {a.total}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const q = session[cur];
  const st = states[cur];
  const score = session.filter((x, i) => states[i].revealed && isCorrect(x, states[i].picked)).length;
  const answered = states.filter((s) => s.picked.length).length;
  const byDomain = finished ? domains.map((d) => { const idx = session.map((x, i) => [x, i] as const).filter(([x]) => (track === "v1" ? x.domainV1 : x.domainV2) === d.id); return { d, total: idx.length, ok: idx.filter(([x, i]) => isCorrect(x, states[i].picked)).length }; }).filter((r) => r.total) : [];
  return (
    <div className="page">
      <div className="q-bar toolbar">
        <button type="button" className="link" onClick={() => { if (finished || confirm("End this session? Unanswered questions count as wrong.")) { if (!finished) finish(); else setSession(null); } }}>{finished ? "← Practice" : "End session"}</button>
        <div className="dots">{session.map((x, i) => <button key={x.id} type="button" className={i === cur ? "cur" : finished ? (isCorrect(x, states[i].picked) ? "ok" : "bad") : states[i].picked.length ? "ans" : ""} aria-label={`Question ${i + 1}`} onClick={() => setCur(i)} />)}</div>
        {deadline > 0 && !finished && <span className={`timer${left < 600 ? " low" : ""}`}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}
      </div>
      {finished && cur === 0 && (
        <Reveal className="results-grid" stagger>
          <div><span className="eyebrow">Session result</span><div className="score num">{score}<span>/{session.length}</span></div><p className="muted">{Math.round((score / session.length) * 100)}% · {mode}{scope ? ` · ${scope}` : ""}</p></div>
          <div className="mastery-rows">{byDomain.map(({ d, total, ok }) => <Fragment key={d.id}><span>{d.title}</span><span className="val">{ok}/{total}</span><span className="bar"><i className={`tone-${d.id}`} style={{ width: `${(ok / total) * 100}%` }} /></span></Fragment>)}</div>
        </Reveal>
      )}
      <QuestionView q={q} state={st} index={cur} total={session.length} chapterLink={{ id: q.chapterId, title: q.chapterTitle }}
        onPick={(picked) => setStates((s) => s.map((x, i) => (i === cur ? { ...x, picked } : x)))}
        onCheck={mode === "exam" ? undefined : () => { recordQuestionResult(q.id, isCorrect(q, st.picked)); setStates((s) => s.map((x, i) => (i === cur ? { ...x, revealed: true } : x))); }} />
      <div className="q-bar toolbar">
        <button type="button" className="btn ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}>← Previous</button>
        <span className="muted num">{answered} / {session.length} answered{!finished && mode !== "exam" ? ` · ${score} correct` : ""}</span>
        {cur < session.length - 1 ? <button type="button" className="btn" onClick={() => setCur(cur + 1)}>Next →</button> : !finished ? <button type="button" className="btn accent" onClick={finish}>Finish &amp; review</button> : <button type="button" className="btn" onClick={() => setSession(null)}>New session</button>}
      </div>
      {finished && (
        <div className="review-list panel-list">
          {session.map((x, i) => <a key={x.id} href="#" onClick={(e) => { e.preventDefault(); setCur(i); window.scrollTo({ top: 0 }); }}><span className={`mark ${isCorrect(x, states[i].picked) ? "ok" : "bad"}`}>{isCorrect(x, states[i].picked) ? "✓" : "✗"}</span><span>{x.prompt.slice(0, 90)}{x.prompt.length > 90 ? "…" : ""}</span><span className="dim">{x.chapterTitle}</span></a>)}
          {session.some((x, i) => !isCorrect(x, states[i].picked)) && <div style={{ paddingTop: 12, paddingBottom: 16 }}><button type="button" className="btn ghost sm" onClick={() => { const wrong = session.filter((x, i) => !isCorrect(x, states[i].picked)); start(wrong, "mistakes"); }}>Retry the {session.filter((x, i) => !isCorrect(x, states[i].picked)).length} you missed</button></div>}
        </div>
      )}
      <p className="muted small panel"><a href={href("blueprint")}>Blueprint map</a> shows mastery per objective from all your answers.</p>
    </div>
  );
}
