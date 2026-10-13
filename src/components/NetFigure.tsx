import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { buildFigure, type Box, type Figure, type FigureOptions, type Tag } from "@/lib/netfig";
import { prefersReducedMotion } from "@/lib/store";
import type { NodeKind, NetTrace, TopologySpec } from "@/lib/types";
import "@/styles/netfig.css";

/* A network figure drawn to the figure standard (content/FIGURES.md): device boxes, ports on their edges, cables
   port to port, and traffic that moves one hop at a time. The layout and the timeline come from src/lib/netfig. */

export function glyph(kind: NodeKind): ReactNode {
  switch (kind) {
    case "router": return <><circle cx="12" cy="12" r="8.5" /><path d="M8 9.5h6M12 7.5l2 2-2 2M16 14.5h-6M12 12.5l-2 2 2 2" /></>;
    case "switch": case "hub": return <><rect x="2.5" y="6" width="19" height="12" rx="1" /><path d="M6 10h8M12 8l2 2-2 2M18 14h-8M12 12l-2 2 2 2" /></>;
    case "l3switch": return <><rect x="2.5" y="6" width="19" height="12" rx="1" /><path d="M6 10h8M12 8l2 2-2 2M18 14h-8M12 12l-2 2 2 2" /><circle cx="20" cy="5" r="3" /></>;
    case "server": return <><rect x="6" y="3" width="12" height="18" rx="1" /><path d="M9 7h6M9 10.5h6M9 17h1.5" /></>;
    case "printer": return <><rect x="4" y="9" width="16" height="8" rx="1" /><path d="M7 9V4h10v5M8 14h8" /></>;
    case "ap": return <><rect x="5" y="14" width="14" height="6" rx="1.5" /><path d="M7.5 10a6 6 0 0 1 9 0M10 12.5a2.5 2.5 0 0 1 4 0" /></>;
    case "wlc": return <><rect x="3" y="12" width="18" height="8" rx="1" /><path d="M7 8.5a7 7 0 0 1 10 0M9.5 10.5a3 3 0 0 1 5 0M6 16h4" /></>;
    case "phone": return <path d="M7 3h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2z" />;
    case "firewall": return <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" /></>;
    case "cloud": return <path d="M7 18a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.6-1.3A4 4 0 0 1 17.5 18z" />;
    case "laptop": return <><rect x="5" y="5" width="14" height="10" rx="1" /><path d="M2.5 18.5h19" /></>;
    default: return <><rect x="3" y="4" width="18" height="12" rx="1" /><path d="M9 20h6M12 16v4" /></>;
  }
}

/* ---------- keyframes, generated per figure from its timeline ---------- */

export const EASE = "cubic-bezier(.45,0,.2,1)";
const pc = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100) / 100));
export function frames(name: string, dur: number, stops: [number, string][], base = ""): string {
  const m = new Map<number, string>();
  for (const [p, css] of stops) m.set(pc(p), m.has(pc(p)) ? `${m.get(pc(p))};${css}` : css);
  const body = [...m.entries()].sort((a, b) => a[0] - b[0]).map(([p, css]) => `${p}%{${css}}`).join("");
  return `.${name}{${base}animation:${name} ${dur}s linear infinite}@keyframes ${name}{${body}}`;
}
/** A property that takes a value inside each window and returns to its base between them. */
function windows(name: string, dur: number, prop: string, base: string, wins: { t: number; hold: number; val: string }[]): string {
  const st: [number, string][] = [[0, `${prop}:${base}`]];
  let prevEnd = -1;
  for (const w of [...wins].sort((a, b) => a.t - b.t)) {
    if (w.t <= prevEnd) st.pop(); else st.push([w.t - 0.01, `${prop}:${base}`]);
    st.push([w.t + 0.8, `${prop}:${w.val}`], [w.t + 0.8 + w.hold, `${prop}:${w.val}`], [w.t + 0.8 + w.hold + 2.5, `${prop}:${base}`]);
    prevEnd = w.t + 3.3 + w.hold;
  }
  st.push([100, `${prop}:${base}`]);
  return frames(name, dur, st);
}
/** Visible between two moments (percent); from < 0 means visible when the loop starts. */
export function shown(name: string, dur: number, from: number, to: number | null, fade = 1.2): string {
  const st: [number, string][] = from < 0 ? [[0, "opacity:1"]] : [[0, "opacity:0"], [from - 0.01, "opacity:0"], [from + fade, "opacity:1"]];
  if (to === null) st.push([100 - fade, "opacity:1"], [100, from < 0 ? "opacity:1" : "opacity:0"]);
  else st.push([to, "opacity:1"], [to + fade, "opacity:0"], [100, "opacity:0"]);
  return frames(name, dur, st);
}
const toneVar = (tone: string, part: "hi" | "base" | "ring") => `var(--nf-${tone}${part === "base" ? "" : `-${part}`})`;

function keyframes(fig: Figure, id: string): string {
  const dur = fig.dur, P = (s: number) => (s / dur) * 100, out: string[] = [];
  const glows = new Map<string, { t: number; hold: number; val: string }[]>();
  fig.events.forEach((e, n) => {
    const c = `${id}e${n}`;
    if (e.kind === "hop") {
      const t0 = P(e.t0), t1 = P(e.t1), AB = 2.2, TL = 16;
      out.push(frames(`${c}h`, dur, [[0, "opacity:0;stroke-dashoffset:3"], [t0 - 0.01, "opacity:0;stroke-dashoffset:3"], [t0, `opacity:1;stroke-dashoffset:3;animation-timing-function:${EASE}`], [t1, "opacity:1;stroke-dashoffset:-97"], [t1 + AB, "opacity:0;stroke-dashoffset:-97"], [100, "opacity:0;stroke-dashoffset:-97"]], "stroke-dasharray:3 400;"));
      out.push(frames(`${c}t`, dur, [[0, "opacity:0;stroke-dasharray:0 400;stroke-dashoffset:0"], [t0 - 0.01, `opacity:0;stroke-dasharray:${TL} 400;stroke-dashoffset:${TL}`], [t0, `opacity:.55;stroke-dasharray:${TL} 400;stroke-dashoffset:${TL};animation-timing-function:${EASE}`], [t1, `opacity:.55;stroke-dasharray:${TL} 400;stroke-dashoffset:${TL - 100}`], [t1 + AB, "opacity:0;stroke-dasharray:0 400;stroke-dashoffset:-100"], [100, "opacity:0;stroke-dasharray:0 400;stroke-dashoffset:-100"]]));
      out.push(frames(`${c}r`, dur, [[0, "opacity:0;transform:scale(.3)"], [t1 - 0.01, "opacity:0;transform:scale(.3)"], [t1, "opacity:.95;transform:scale(.3);animation-timing-function:cubic-bezier(.2,.7,.3,1)"], [t1 + 7, "opacity:0;transform:scale(1.6)"], [100, "opacity:0;transform:scale(1.6)"]]));
    } else if (e.kind === "proc") {
      const t0 = P(e.t0), t1 = P(e.t1);
      out.push(frames(`${c}a`, dur, [[0, "opacity:0;stroke-dashoffset:100"], [t0 - 0.01, "opacity:0;stroke-dashoffset:100"], [t0, `opacity:.95;stroke-dashoffset:100;animation-timing-function:${EASE}`], [t1, "opacity:.95;stroke-dashoffset:0"], [t1 + 2.2, "opacity:0;stroke-dashoffset:0"], [100, "opacity:0;stroke-dashoffset:0"]], "stroke-dasharray:100 200;"));
    } else if (e.kind === "recv") {
      const t0 = P(e.t0);
      out.push(frames(`${c}h`, dur, [[0, "opacity:0;transform:scale(1)"], [t0 - 0.01, "opacity:0;transform:scale(1)"], [t0, "opacity:.9;transform:scale(1);animation-timing-function:cubic-bezier(.2,.7,.3,1)"], [t0 + 9, "opacity:0;transform:scale(1.14)"], [100, "opacity:0;transform:scale(1.14)"]]));
    } else {
      out.push(shown(`${c}x`, dur, P(e.t0), P(e.t1), 0.8));
    }
    if (e.kind === "proc" || e.kind === "recv" || e.kind === "drop") {
      const val = e.kind === "drop" ? "var(--nf-bad)" : toneVar(e.tone, "ring");
      if (!glows.has(e.node)) glows.set(e.node, []);
      glows.get(e.node)!.push({ t: P(e.t0), hold: Math.max(0, P(e.t1 - e.t0) - 0.8), val });
    }
  });
  fig.boxes.forEach((b, i) => {
    const w = glows.get(b.id);
    if (w) out.push(windows(`${id}b${i}`, dur, "stroke", boxStroke(fig, b), w));
  });
  fig.marks.forEach((m, i) => {
    if (m.t0 < 0 && m.t1 === null) return;
    const c = `${id}m${i}`;
    if (m.kind === "tag") {
      const ta = P(m.t0), tb = P(m.t1 ?? dur);
      out.push(frames(c, dur, [[0, "opacity:0;transform:translateY(3px)"], [ta - 0.01, "opacity:0;transform:translateY(3px)"], [ta, `opacity:0;transform:translateY(3px);animation-timing-function:${EASE}`], [ta + 2, "opacity:1;transform:translateY(0)"], [tb, "opacity:1;transform:translateY(0)"], [tb + 2, "opacity:0;transform:translateY(0)"], [100, "opacity:0;transform:translateY(0)"]]));
    } else out.push(shown(c, dur, m.t0 < 0 ? -1 : P(m.t0), m.t1 === null ? null : P(m.t1), 1));
  });
  return out.join("\n");
}
const boxStroke = (fig: Figure, b: Box) => (fig.focus.has(b.id) || b.highlight ? "var(--nf-focus)" : "var(--nf-box)");

/** True while the element is off screen or the tab is hidden: its animation pauses then. */
export function useAway(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [away, setAway] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || typeof IntersectionObserver === "undefined") return;
    let onScreen = false;
    const sync = () => setAway(!onScreen || document.hidden);
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { rootMargin: "120px 0px" });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [ref, active]);
  return away;
}

/** The pause control every animated figure carries (WCAG 2.2.2). */
export function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="nf-ctl" onClick={onToggle} aria-label={paused ? "Play the animation" : "Pause the animation"} aria-pressed={paused} title={paused ? "Play" : "Pause"}>
      {paused
        ? <svg viewBox="0 0 16 16" aria-hidden="true"><path className="fill" d="M5 3.5v9l7.5-4.5z" /></svg>
        : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" /></svg>}
    </button>
  );
}

/* ---------- the figure ---------- */

export interface NetFigureProps {
  spec: TopologySpec;
  trace?: NetTrace;
  options?: FigureOptions;
  /** Switch ports that come up amber and turn green: every switch port, or those on cables touching these nodes. */
  leds?: { all?: boolean; wake?: string[] };
  label?: string;
  description?: string;
  className?: string;
  /** Inside the enlarged view: no enlarge button of its own. */
  enlarged?: boolean;
  /** The figure may be turned on its side to fit a narrow column. Only for pictures no text refers to by position. */
  turn?: boolean;
}

/** Below this scale the text is too small to read, so the figure scrolls sideways instead of shrinking further. */
const MIN_SCALE = 0.7;

function NetFigure({ spec, trace, options, leds, label, description, className, enlarged, turn }: NetFigureProps) {
  const id = `nf${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const across = useMemo(() => buildFigure(spec, trace ?? spec.trace, options), [spec, trace, options]);
  // A step picture much wider than its column is turned on its side when that reads better; the network is the same.
  const tryDown = !!turn && width > 0 && width / across.view.w < 0.8 && !options?.vertical;
  const down = useMemo(() => (tryDown ? buildFigure(spec, trace ?? spec.trace, { ...options, vertical: true }) : null), [spec, trace, options, tryDown]);
  const fit = (f: typeof across) => Math.min(1, width / f.view.w);
  const fig = down && down.problems.length <= across.problems.length && fit(down) >= fit(across) * 1.35 && down.view.h * fit(down) <= 1100 ? down : across;
  const wide = width > 0 && width / fig.view.w < MIN_SCALE;
  const still = prefersReducedMotion() || !fig.dur;
  const css = useMemo(() => (still ? "" : keyframes(fig, id)), [fig, id, still]);
  const [paused, setPaused] = useState(false);
  const away = useAway(ref, !still);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const byNode = new Map(fig.boxes.map((b) => [b.id, b]));
  const wake = new Set(leds?.wake ?? []);
  const descId = `${id}d`;
  const statik = (m: Tag) => (still ? m.t1 === null : m.t0 < 0 && m.t1 === null);

  return (
    <div ref={ref} className={["nf", still ? "is-still" : "", paused || away || open ? "is-paused" : "", wide ? "is-wide" : "", className ?? ""].filter(Boolean).join(" ")}>
      <div className="nf-frame">
      <svg className="nf-svg" viewBox={`${fig.view.x} ${fig.view.y} ${fig.view.w} ${fig.view.h}`} role="img" aria-label={label ?? spec.title ?? "Network topology"} aria-describedby={descId} style={{ aspectRatio: `${fig.view.w} / ${fig.view.h}`, minWidth: wide ? Math.round(fig.view.w * MIN_SCALE) : undefined, maxWidth: Math.round(fig.view.w * (enlarged ? 1.6 : 1.1)) }}>
        <desc id={descId}>{[description, ...fig.narrative].filter(Boolean).join(" ")}</desc>
        {css && <style>{css}</style>}
        {fig.zones.map((z, i) => <rect key={`z${i}`} className="nf-zone" x={z.x} y={z.y} width={z.w} height={z.h} />)}
        {fig.cables.map((c) => (
          <path key={`c${c.link}`} className={`nf-cable is-${c.style} is-${c.state}${c.accent ? " is-accent" : ""}`} d={c.d} />
        ))}
        {!still && fig.events.map((e, n) => e.kind === "hop" ? (
          <g key={`h${n}`} className={`nf-comet tone-${e.tone}`}>
            <path className={`${id}e${n}t nf-tail`} d={e.rev ? fig.cables.find((c) => c.link === e.cable)!.rd : fig.cables.find((c) => c.link === e.cable)!.d} pathLength={100} />
            <path className={`${id}e${n}h nf-head`} d={e.rev ? fig.cables.find((c) => c.link === e.cable)!.rd : fig.cables.find((c) => c.link === e.cable)!.d} pathLength={100} />
          </g>
        ) : null)}
        {still && fig.events.filter((e) => e.t0 >= fig.settle - 0.01).map((e, n) => {
          if (e.kind === "hop") { const c = fig.cables.find((k) => k.link === e.cable)!; return <path key={`s${n}`} className={`nf-trail tone-${e.tone}`} d={c.d} />; }
          if (e.kind === "proc") return <path key={`s${n}`} className={`nf-trail is-inside tone-${e.tone}`} d={e.d} />;
          if (e.kind === "drop") return <path key={`s${n}`} className="nf-drop" d={`M${e.x - 5} ${e.y - 5}l10 10M${e.x + 5} ${e.y - 5}l-10 10`} />;
          return null;
        })}
        {fig.boxes.map((b, i) => {
          const nat = 10 + b.label.length * 15 + (b.sub.length ? 2 + b.sub.length * 12 : 0) + 9, dy = (b.h - nat) / 2;
          return (
            <g key={b.id} className={`nf-node${fig.focus.has(b.id) || b.highlight ? " is-focus" : ""}${b.absent ? " is-absent" : ""}`}>
              <rect className={`nf-box ${id}b${i}`} x={b.x} y={b.y} width={b.w} height={b.h} />
              <g className="nf-glyph" transform={`translate(${b.x + 5} ${b.y + 5}) scale(.46)`}>{glyph(b.kind)}</g>
              {b.label.map((l, k) => <text key={`l${k}`} className="nf-label" x={b.cx} y={b.y + dy + 21 + k * 15} textAnchor="middle">{l}</text>)}
              {b.sub.map((s, k) => <text key={`s${k}`} className="nf-sub" x={b.cx} y={b.y + dy + 10 + b.label.length * 15 + 11.5 + k * 12} textAnchor="middle">{s}</text>)}
            </g>
          );
        })}
        {fig.ports.map((p) => {
          const c = fig.cables.find((k) => k.link === p.link)!, horiz = p.side === "l" || p.side === "r";
          const isSwitch = /switch|hub/.test(byNode.get(p.node)?.kind ?? "");
          const led = c.state === "down" ? " is-down" : isSwitch && c.state === "up" && (leds?.all || wake.has(p.node) || wake.has(p.peer)) ? " is-waking" : "";
          return <rect key={`p${p.id}`} className={`nf-port${led}`} x={horiz ? p.x - 2.5 : p.x - 4} y={horiz ? p.y - 4 : p.y - 2.5} width={horiz ? 5 : 8} height={horiz ? 8 : 5} />;
        })}
        {fig.bars.map((b, i) => <line key={`bar${i}`} className="nf-bar" x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
        {fig.labels.map((l, i) => (
          <text key={`t${i}`} className={`nf-text is-${l.cls}`} x={l.tx} y={l.ty} textAnchor={l.anchor}>
            {l.parts.map((p, k) => <tspan key={k} className={p.tone ? `tone-${p.tone}` : undefined}>{p.text}</tspan>)}
          </text>
        ))}
        {!still && fig.events.map((e, n) => {
          const c = `${id}e${n}`;
          if (e.kind === "hop") return <circle key={`r${n}`} className={`${c}r nf-ring tone-${e.tone}`} cx={e.far.x} cy={e.far.y} r={7} />;
          if (e.kind === "proc") return <path key={`a${n}`} className={`${c}a nf-inside tone-${e.tone}`} d={e.d} pathLength={100} />;
          if (e.kind === "recv") { const b = byNode.get(e.node)!; return <rect key={`v${n}`} className={`${c}h nf-halo tone-${e.tone}`} x={b.x} y={b.y} width={b.w} height={b.h} />; }
          return <path key={`x${n}`} className={`${c}x nf-drop`} d={`M${e.x - 5} ${e.y - 5}l10 10M${e.x + 5} ${e.y - 5}l-10 10`} />;
        })}
        {fig.marks.map((m, i) => {
          if (still && !statik(m)) return null;
          const cls = statik(m) ? "" : `${id}m${i}`;
          if (m.kind === "role") return (
            <g key={`m${i}`} className={`tone-${m.tone} ${cls}`}>
              <text className="nf-role" x={m.tx} y={m.ty} textAnchor={m.anchor}>{m.text}</text>
              {m.bar && <line className="nf-bar" x1={m.bar.x1} y1={m.bar.y1} x2={m.bar.x2} y2={m.bar.y2} />}
            </g>
          );
          return (
            <g key={`m${i}`} className={`nf-tag is-${m.kind} tone-${m.tone} ${cls}`}>
              <rect x={m.x} y={m.y} width={m.w} height={m.h} />
              <text x={m.x + m.w / 2} y={m.y + 13.6} textAnchor="middle">{m.text}</text>
            </g>
          );
        })}
      </svg>
      </div>
      {(!still || (wide && !enlarged)) && (
        <div className="nf-controls">
          {wide && !enlarged && (
            <button type="button" className="nf-ctl" onClick={() => { setOpen(true); dialog.current?.showModal(); }} aria-label="Enlarge the figure" title="Enlarge">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" /></svg>
            </button>
          )}
          {!still && <PauseButton paused={paused} onToggle={() => setPaused((v) => !v)} />}
        </div>
      )}
      {still && fig.narrative.length > 0 && (
        <ol className="nf-story">{fig.narrative.map((s, i) => <li key={i}>{s}</li>)}</ol>
      )}
      {wide && !enlarged && (
        <dialog ref={dialog} className="nf-dialog" aria-label={label ?? spec.title ?? "Network topology"} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
          <div className="nf-dialog-head">
            <span>{label ?? spec.title ?? "Topology"}</span>
            <button type="button" className="nf-ctl" onClick={() => dialog.current?.close()} aria-label="Close the enlarged figure" title="Close">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
            </button>
          </div>
          {open && <NetFigureInner spec={spec} trace={trace} options={options} leds={leds} label={label} description={description} enlarged turn={turn} />}
        </dialog>
      )}
    </div>
  );
}
const NetFigureInner = (props: NetFigureProps) => <NetFigure {...props} />;

export default memo(NetFigure);
