import { memo, useId, useMemo, useState } from "react";
import type { BinarySpec, BitsSpec, DiagramSpec, LayersSpec, MatrixSpec, SequenceSpec, TimelineSpec, TopologySpec } from "@/lib/types";
import { subnetInfo, toBinaryOctets } from "@/lib/subnet";
import { useEffect, useRef } from "react";
import NetFigure, { EASE, PauseButton, frames, shown, useAway } from "./NetFigure";
import { prefersReducedMotion } from "@/lib/store";

/* ---------- topology: drawn to the figure standard (content/FIGURES.md) by NetFigure ---------- */

/** Describe the authored relationships, without making the decorative device icons separate announcements. */
function topologyDescription(spec: TopologySpec): string {
  const nodes = spec.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const name = (id: string) => byId.get(id)?.label || id;
  const endpoint = (id: string, port?: string, badge?: string) => {
    const details = [port, badge].filter(Boolean).join(", ");
    return `${name(id)}${details ? ` (${details})` : ""}`;
  };
  const parts: string[] = [];
  if (nodes.length) parts.push(`Devices: ${nodes.map((node) => `${name(node.id)}${node.sub ? ` (${node.sub})` : ""}`).join("; ")}.`);
  const connections = (spec.links ?? []).filter((link) => byId.has(link.from) && byId.has(link.to)).map((link) => {
    const details = [link.label, link.style && link.style !== "solid" ? `${link.style} link` : undefined].filter(Boolean).join("; ");
    return `${endpoint(link.from, link.fromLabel, link.fromBadge)} connects to ${endpoint(link.to, link.toLabel, link.toBadge)}${details ? `: ${details}` : ""}`;
  });
  if (connections.length) parts.push(`Connections: ${connections.join(". ")}.`);
  for (const zone of spec.zones ?? []) {
    const members = zone.nodes.filter((id) => byId.has(id)).map(name);
    if (members.length) parts.push(`${zone.label}: ${members.join(", ")}.`);
  }
  const packet = spec.packet?.path.filter((id) => byId.has(id)) ?? [];
  if (packet.length > 1) parts.push(`Packet path${spec.packet?.label ? ` (${spec.packet.label})` : ""}: ${packet.map(name).join(" to ")}.`);
  return parts.join(" ") || "No devices or connections are shown.";
}

function Topology({ spec }: { spec: TopologySpec }) {
  return <NetFigure spec={spec} description={topologyDescription(spec)} />;
}

/* ---------- sequence ---------- */

/** Messages travel one at a time in the figure standard's motion: each is drawn from sender to receiver, lands with
    a ring, and keeps its label while the exchange builds; the whole exchange then clears and plays again. */
function Sequence({ spec }: { spec: SequenceSpec }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const descriptionId = `sequence-${uid}`;
  const actors = spec.actors ?? [];
  const steps = spec.steps ?? [];
  const messages = steps.map((step, i) => `${i + 1}. ${actors[step.from] ?? `Participant ${step.from + 1}`} to ${actors[step.to] ?? `Participant ${step.to + 1}`}: ${step.label}${step.note ? ` (${step.note})` : ""}.`);
  const description = `Participants: ${actors.join("; ") || "none"}. ${messages.length ? `Messages in order: ${messages.join(" ")}` : "No messages are shown."}`;
  const colW = Math.max(180, Math.min(260, 760 / Math.max(1, actors.length)));
  const W = colW * actors.length;
  const top = 44;
  const rowH = 52;
  const H = top + steps.length * rowH + 24;
  const x = (i: number) => colW * i + colW / 2;
  const ref = useRef<HTMLDivElement>(null);
  const still = prefersReducedMotion() || !steps.length;
  const [paused, setPaused] = useState(false);
  const away = useAway(ref, !still);
  const id = `sq${uid}`;
  const css = useMemo(() => {
    if (still) return "";
    const at = (i: number) => 0.5 + i * 1.25, dur = at(steps.length) + 1.8, P = (t: number) => (t / dur) * 100, end = P(dur - 1);
    return steps.map((st, i) => {
      const t0 = P(at(i)), t1 = P(at(i) + 0.75);
      const line = st.dashed || st.from === st.to
        ? shown(`${id}l${i}`, dur, t1, end, 0.8)
        : frames(`${id}l${i}`, dur, [[0, "stroke-dashoffset:100;opacity:1"], [t0, `stroke-dashoffset:100;opacity:1;animation-timing-function:${EASE}`], [t1, "stroke-dashoffset:0;opacity:1"], [end, "stroke-dashoffset:0;opacity:1"], [end + 1.2, "stroke-dashoffset:0;opacity:0"], [100, "stroke-dashoffset:100;opacity:0"]], "stroke-dasharray:100 100;");
      const head = frames(`${id}h${i}`, dur, [[0, "opacity:0;stroke-dashoffset:3"], [t0 - 0.01, "opacity:0;stroke-dashoffset:3"], [t0, `opacity:1;stroke-dashoffset:3;animation-timing-function:${EASE}`], [t1, "opacity:1;stroke-dashoffset:-97"], [t1 + 2, "opacity:0;stroke-dashoffset:-97"], [100, "opacity:0;stroke-dashoffset:-97"]], "stroke-dasharray:3 400;");
      const ring = frames(`${id}r${i}`, dur, [[0, "opacity:0;transform:scale(.3)"], [t1 - 0.01, "opacity:0;transform:scale(.3)"], [t1, "opacity:.95;transform:scale(.3);animation-timing-function:cubic-bezier(.2,.7,.3,1)"], [t1 + 6, "opacity:0;transform:scale(1.6)"], [100, "opacity:0;transform:scale(1.6)"]]);
      return [line, head, ring, shown(`${id}t${i}`, dur, t1, end, 0.8)].join("\n");
    }).join("\n");
  }, [steps, still, id]);
  return (
    <div ref={ref} className={["nf", "nf-seq", still ? "is-still" : "", paused || away ? "is-paused" : ""].filter(Boolean).join(" ")}>
      <svg className="diagram seq" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: Math.round(W * 1.15), margin: "0 auto" }} role="img" aria-label={spec.title ?? "Sequence diagram"} aria-describedby={descriptionId}>
        <desc id={descriptionId}>{description}</desc>
        {css && <style>{css}</style>}
        {actors.map((a, i) => (
          <g key={i}>
            <text className="actor" x={x(i)} y="18" textAnchor="middle">{a}</text>
            <line className="lifeline" x1={x(i)} y1="28" x2={x(i)} y2={H - 10} />
          </g>
        ))}
        {steps.map((s, i) => {
          const y = top + i * rowH + 20;
          const x1 = x(s.from), x2 = x(s.to);
          const dir = x2 > x1 ? 1 : -1;
          const mid = (x1 + x2) / 2;
          const a = still ? "" : ` ${id}`;
          return (
            <g key={i} className={`msg${s.accent ? " accent" : ""}${s.dashed ? " dashed" : ""}`} style={{ "--i": i } as React.CSSProperties}>
              <line className={a && `${id}l${i}`} x1={x1} y1={y} x2={x2 - dir * 8} y2={y} pathLength={s.dashed ? undefined : 100} />
              <g className={a && `${id}t${i}`}>
                <polygon points={`${x2},${y} ${x2 - dir * 10},${y - 5} ${x2 - dir * 10},${y + 5}`} />
                <text className="msg-label" x={mid} y={y - 7} textAnchor="middle">{s.label}</text>
                {s.note && <text className="msg-note" x={mid} y={y + 15} textAnchor="middle">{s.note}</text>}
              </g>
              {!still && x1 !== x2 && (
                <g className={`tone-${s.accent ? "request" : "neutral"} nf-seq-fx`}>
                  <path className={`${id}h${i} nf-head`} d={`M${x1} ${y}L${x2} ${y}`} pathLength={100} />
                  <circle className={`${id}r${i} nf-ring`} cx={x2} cy={y} r={7} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {!still && <div className="nf-controls"><PauseButton paused={paused} onToggle={() => setPaused((v) => !v)} /></div>}
    </div>
  );
}

/* ---------- bits ---------- */

function Bits({ spec }: { spec: BitsSpec }) {
  const total = (spec.fields ?? []).reduce((n, f) => n + f.bits, 0) || 1;
  let acc = 0;
  return (
    <div className="diagram bits">
      <div className="bits-row" style={{ gridTemplateColumns: (spec.fields ?? []).map((f) => `${f.bits}fr`).join(" ") }}>
        {(spec.fields ?? []).map((f, i) => (
          <div key={i} className={`bit-field${f.highlight ? " hl" : ""}`} style={{ "--i": i } as React.CSSProperties}>
            <b>{f.label}</b>
            <small>{f.bits} bit{f.bits === 1 ? "" : "s"}{f.note ? ` · ${f.note}` : ""}</small>
          </div>
        ))}
      </div>
      <div className="bits-ruler" style={{ gridTemplateColumns: (spec.fields ?? []).map((f) => `${f.bits}fr`).join(" ") }}>
        {(spec.fields ?? []).map((f, i) => {
          const start = acc;
          acc += f.bits;
          return <span key={i}>{start}</span>;
        })}
      </div>
      <div className="bits-total">{total} bits</div>
    </div>
  );
}

/* ---------- binary ---------- */

export function Binary({ spec }: { spec: BinarySpec }) {
  let info: ReturnType<typeof subnetInfo> | null = null;
  try {
    info = subnetInfo(spec.ip, spec.prefix);
  } catch {}
  if (!info) return <p className="notice">Enter a valid IPv4 address and a whole prefix from 0 to 32.</p>;
  const octets = toBinaryOctets(spec.ip);
  const dec = spec.ip.split(".");
  return (
    <div className="diagram binary">
      <div className="binary-addr"><span>{spec.ip}</span><span className="dim">/{spec.prefix}</span></div>
      <div className="binary-grid">
        {octets.map((o, oi) => (
          <div key={oi} className="octet">
            <div className="cells">
              {o.split("").map((b, bi) => {
                const idx = oi * 8 + bi;
                return <i key={bi} className={idx < spec.prefix ? "n" : "h"} style={{ "--i": idx } as React.CSSProperties}>{b}</i>;
              })}
            </div>
            <b>{dec[oi]}{info && info.blockOctet === oi && spec.prefix % 8 !== 0 ? <span className="dim"> → {info.network.split(".")[oi]}</span> : null}</b>
          </div>
        ))}
      </div>
      {info && (
        <div className="binary-facts">
          <span><i className="n" /> {spec.prefix} network bits</span>
          <span><i className="h" /> {32 - spec.prefix} host bits</span>
          {info.blockOctet >= 0 && spec.prefix % 8 !== 0 && <span>block size in octet {info.blockOctet + 1}: <b>{info.blockSize}</b></span>}
          <span>network <b>{info.network}</b></span>
          <span>broadcast <b>{info.broadcast}</b></span>
          <span>{spec.prefix === 0 ? "address space" : spec.prefix === 31 ? "point-to-point endpoints" : spec.prefix === 32 ? "single address" : "usable"} <b>{(spec.prefix === 0 ? info.size : info.hosts).toLocaleString()}</b></span>
        </div>
      )}
    </div>
  );
}

/* ---------- timeline ---------- */

function Timeline({ spec }: { spec: TimelineSpec }) {
  const max = Math.max(...(spec.rows ?? []).map((r) => r.segments.reduce((n, s) => n + s.length, 0)), 1);
  return (
    <div className="diagram timeline">
      {(spec.rows ?? []).map((r, ri) => (
        <div key={ri} className="tl-row">
          <span className="tl-label">{r.label}</span>
          <div className="tl-track">
            {r.segments.map((s, si) => (
              <div key={si} className={`tl-seg ${s.tone ?? "mid"}`} style={{ flexGrow: s.length, "--i": si + ri * 4 } as React.CSSProperties} title={`${s.label} · ${s.length} ${spec.unit ?? ""}`}>
                <span>{s.label}{s.length ? ` · ${s.length}` : ""}</span>
              </div>
            ))}
            {max - r.segments.reduce((n, s) => n + s.length, 0) > 0 && <div className="tl-gap" style={{ flexGrow: max - r.segments.reduce((n, s) => n + s.length, 0) }} />}
          </div>
        </div>
      ))}
      <div className="tl-axis"><span>0 {spec.unit}</span><span>{max} {spec.unit}</span></div>
    </div>
  );
}

/* ---------- matrix ---------- */

function Matrix({ spec }: { spec: MatrixSpec }) {
  const tone = (v: string) => spec.tones?.[v] ?? spec.tones?.[v.toLowerCase()] ?? "neutral";
  return (
    <div className="diagram matrix table-scroll">
      <table>
        <thead><tr><th />{(spec.cols ?? []).map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {(spec.rows ?? []).map((r, ri) => (
            <tr key={r}>
              <th>{r}</th>
              {(spec.cells?.[ri] ?? []).map((v, ci) => <td key={ci} className={`tone-${tone(v)}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- layers ---------- */

function Layers({ spec }: { spec: LayersSpec }) {
  const hl = new Set(spec.highlight ?? []);
  return (
    <div className="diagram layers" style={{ gridTemplateColumns: `repeat(${spec.columns?.length ?? 1}, minmax(0, 1fr))` }}>
      {(spec.columns ?? []).map((col, ci) => (
        <div key={ci} className="layer-col">
          <div className="layer-title">{col.title}</div>
          {col.rows.map((r, ri) => {
            const label = typeof r === "string" ? r : r.label;
            const span = typeof r === "string" ? 1 : r.span ?? 1;
            return (
              <div key={ri} className={`layer${hl.has(label) ? " hl" : ""}`} style={{ flexGrow: span, "--i": ri } as React.CSSProperties}>{label}</div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------- entry ---------- */

function Diagram({ spec, compact }: { spec: DiagramSpec; compact?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  // Packet animations repaint every frame, so they run only while the diagram is on screen and the tab is in front.
  useEffect(() => {
    const fig = ref.current;
    const svg = fig?.querySelector("svg") as SVGSVGElement | null;
    if (!fig || !svg || typeof svg.pauseAnimations !== "function") return;
    let onScreen = false;
    const sync = () => (onScreen && !document.hidden ? svg.unpauseAnimations() : svg.pauseAnimations());
    svg.pauseAnimations();
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { rootMargin: "200px 0px" });
    io.observe(fig);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [spec]);
  let body: React.ReactNode;
  switch (spec?.type) {
    case "topology": body = <Topology spec={spec} />; break;
    case "sequence": body = <Sequence spec={spec} />; break;
    case "bits": body = <Bits spec={spec} />; break;
    case "binary": body = <Binary spec={spec} />; break;
    case "timeline": body = <Timeline spec={spec} />; break;
    case "matrix": body = <Matrix spec={spec} />; break;
    case "layers": body = <Layers spec={spec} />; break;
    default: body = <pre className="cli-block">Unknown diagram type</pre>;
  }
  return (
    <figure ref={ref} className={`figure${compact ? " compact" : ""}`}>
      {spec?.title && <figcaption className="fig-title">{spec.title}</figcaption>}
      {body}
      {spec?.caption && <figcaption className="fig-caption">{spec.caption}</figcaption>}
    </figure>
  );
}

export default memo(Diagram);
