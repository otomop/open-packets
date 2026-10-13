import { useEffect, useState } from "react";
import { ticketBank } from "@/lib/banks/tickets";
import { chapterHref, href } from "@/lib/router";
import { logActivity, update, useProgress } from "@/lib/store";
import Markdown, { CodeBlock } from "@/components/Markdown";
import { LETTERS, shuffle } from "@/components/ui";

export default function Tickets({ id }: { id?: string }) {
  const p = useProgress();
  const t = id ? ticketBank.find((x) => x.id === id) : undefined;
  const [order, setOrder] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { if (t) { setOrder(shuffle(t.options.map((_, i) => i))); setPicked(null); setRevealed(false); } }, [t?.id]);
  if (!t) {
    return (
      <div className="page">
        <div className="page-head"><div className="eyebrow tone-accent">Troubleshooting tickets · {ticketBank.length}</div><h1 className="display wipe">Read the evidence. Name the cause.</h1><p className="lead">Each ticket gives you a scenario and representative command output. Identify the root cause, then review the evidence and repair.</p></div>
        <div className="panel-list">
          {ticketBank.map((x) => { const s = p.tickets[x.id]; return (
            <a key={x.id} href={href("tickets", x.id)} className="ticket-row"><span><b>{x.title}</b><small>{x.chapterTitle} · {x.objectives.map((o) => o.replace(":", " ")).join(", ")}</small></span><span className="muted">{x.exhibits.length} exhibit{x.exhibits.length === 1 ? "" : "s"}</span><span className={`pill ${s ? (s.correct ? "ok" : "") : "dim"}`}>{s ? (s.correct ? "solved" : "retry") : "new"}</span></a>
          ); })}
          {!ticketBank.length && <div className="empty">No tickets yet.</div>}
        </div>
      </div>
    );
  }
  const solve = () => {
    if (picked === null) return;
    const ok = t.answer.includes(picked);
    setRevealed(true);
    update((d) => { d.tickets = { ...d.tickets, [t.id]: { correct: ok, date: new Date().toISOString() } }; });
    logActivity(4);
  };
  const idx = ticketBank.indexOf(t);
  const next = ticketBank[idx + 1];
  return (
    <div className="page">
      <a className="link" href={href("tickets")}>← All tickets</a>
      <div className="ticket">
        <div><div className="eyebrow tone-accent">Ticket {idx + 1} · {t.chapterTitle}</div><h1 className="display wipe" style={{ fontSize: "clamp(36px,5vw,64px)", marginTop: 6 }}>{t.title}</h1></div>
        <div className="md"><Markdown text={t.scenario} /></div>
        <div className="exhibits">{t.exhibits.map((e, i) => <CodeBlock key={i} lang="output" title={e.title} text={e.text} />)}</div>
        <div className="q-card">
          <p className="q-prompt">{t.question}</p>
          <div className="q-options">
            {order.map((oi, pos) => {
              const isAns = t.answer.includes(oi);
              const cls = revealed ? (picked === oi && isAns ? "right" : picked === oi ? "wrong" : isAns ? "missed" : "") : picked === oi ? "sel" : "";
              return <button key={oi} type="button" className={`opt ${cls}`} disabled={revealed} onClick={() => setPicked(oi)}><span className="letter">{LETTERS[pos]}</span><span>{t.options[oi]}</span></button>;
            })}
          </div>
          {!revealed ? <div><button type="button" className="btn" disabled={picked === null} onClick={solve}>Diagnose</button></div> : (
            <div className="explain">
              <b style={{ color: t.answer.includes(picked!) ? "var(--ok)" : "var(--bad)" }}>{t.answer.includes(picked!) ? "Root cause identified." : "That is not the root cause."}</b>
              <div className="md"><Markdown text={t.explanation} /></div>
              {t.fix && <><div className="eyebrow">The fix</div><Markdown text={t.fix} /></>}
              <div className="q-bar"><a className="link" href={chapterHref(t.chapterId)}>Review · {t.chapterTitle} →</a>{next && <a className="btn ghost sm" href={href("tickets", next.id)}>Next ticket →</a>}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
