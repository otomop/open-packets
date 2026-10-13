import { useEffect, useMemo, useState, type ReactNode } from "react";
import { parseBlocks, type Block } from "@/lib/markdown";
import { chapterHref } from "@/lib/router";
import { logActivity, toggleInList, updateChapter, useProgress } from "@/lib/store";
import { itemProgress } from "@/lib/section-progress";
import { Blocks, CodeBlock } from "./Markdown";
import NetFigure from "./NetFigure";
import { traceFromStep } from "@/lib/netfig";
import { jumpToId } from "./ChapterLayout";
import type { Lab, LabStep, NetTrace, ReadingChapter, TopologySpec } from "@/lib/types";
import "@/styles/lab.css";

/* The guided lab as a field manual: a hero, the topology, a pinned route through the steps, then each
   step beside a picture of the network after it. The words are the lab's own; this only lays them out. */

type Tone = "ok" | "warn" | "bad" | "dim";
interface Chip { node: string; text: string; tone?: Tone }
/** A step's `state` fence: what is true of the network once that step is done, drawn to the figure standard
    (content/FIGURES.md). Traffic, roles, chips and down cables come from NetTrace; the rest is specific to labs. */
interface StepState extends NetTrace {
  status: string;
  tone?: Tone;
  /** `false` before the cables are connected. */
  cabled?: boolean;
  /** `false` hides the address lines until the hosts are addressed; a list keeps them only on those devices. */
  addressed?: boolean | string[];
  /** Which of the lab's topology diagrams the picture uses, counting from 1 in document order (default 1). */
  topology?: number;
  /** Every switch port comes up amber and turns green (`led`), or only those on cables touching these nodes (`wake`). */
  led?: boolean;
  wake?: string[];
  /** [from, to] or [from, to, "fail"] when the reply never comes back: the engine takes the shortest cabled path. */
  ping?: [string, string];
  pings?: string[][];
  prompt?: Chip;
  rows?: [string, string, Tone?][];
}

const pad = (n: number) => String(n).padStart(2, "0");
const ENV: Record<string, string> = { "packet-tracer": "Packet Tracer", cml: "Cisco Modeling Labs", mixed: "Packet Tracer and worksheets" };
const envLabel = (e: string) => ENV[e] ?? e.replace(/-/g, " ");

/** A step's `state` fence describes its picture; it is never shown as text. */
function splitState(blocks: Block[]): { state: StepState | null; blocks: Block[] } {
  let state: StepState | null = null;
  const rest = blocks.filter((b) => {
    if (b.type !== "code" || b.lang !== "state") return true;
    try { state = JSON.parse(b.text); } catch { /* the validator reports a bad block */ }
    return false;
  });
  return { state, blocks: rest };
}

/** Give the lab's bold text a shape: menu paths become breadcrumbs, keys become keycaps, files and addresses go mono. */
function enhance(html: string): string {
  return html.replace(/<strong>([\s\S]*?)<\/strong>/g, (whole, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "");
    if (text.includes("→")) return `<span class="lab-ui">${inner.split("→").map((s) => s.trim()).join("<i>→</i>")}</span>`;
    if (/\.pkt$/i.test(text)) return `<span class="lab-file">${inner}</span>`;
    if (/^\d{1,3}(\.\d{1,3}){3}(\/\d+)?$/.test(text) || /^https?:\/\//.test(text)) return `<span class="lab-addr">${inner}</span>`;
    if (/^(q|no|yes)$/i.test(text)) return `<kbd class="lab-key">${inner}</kbd>`;
    if (/^--More--$/.test(text)) return `<span class="lab-screen">${inner}</span>`;
    return whole;
  });
}
const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");

/** "1 × Catalyst 2960 (S1)" names S1's model. */
function modelOf(label: string, devices: string[] = []) {
  for (const d of devices) {
    const m = d.match(/×\s*(.+?)\s*\(([^)]*)\)/);
    if (m && m[2].split(",").map((s) => s.trim()).includes(label)) return m[1];
  }
  return "";
}

export default function LabManual({ c, lab }: { c: ReadingChapter; lab: Lab }) {
  const cp = useProgress((p) => p.chapters[c.id]) ?? { sectionsDone: [], stepsDone: [] };
  const done = cp.stepsDone;
  const progress = itemProgress(lab.steps, done);
  const parsed = useMemo(() => ({
    intro: parseBlocks(lab.intro),
    topo: parseBlocks(lab.topology),
    steps: lab.steps.map((s) => splitState(parseBlocks(s.body))),
    trouble: parseBlocks(lab.troubleshooting),
    challenge: parseBlocks(lab.challenge),
  }), [lab]);
  const topoSpec = parsed.topo.find((b): b is Extract<Block, { type: "diagram" }> => b.type === "diagram" && b.spec.type === "topology")?.spec as TopologySpec | undefined;
  // every topology in the lab, in document order: a step picture can use a later network (`"topology": 2`)
  const topos = useMemo(() => [parsed.topo, ...parsed.steps.map((s) => s.blocks)].flat()
    .filter((b): b is Extract<Block, { type: "diagram" }> => b.type === "diagram" && b.spec.type === "topology").map((b) => b.spec as TopologySpec), [parsed]);
  const current = useCurrentStep(lab.steps);
  const minutes = lab.minutes ?? c.minutes.lab;

  const download = () => {
    const strip = (s: string) => s.replace(/```state\n[\s\S]*?\n```\n?/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const md = `# ${lab.title}\n\nEnvironment: ${lab.environment}\n\n${lab.intro}\n\n## Topology\n\n${lab.topology}\n\n${lab.steps.map((s) => `## Step ${s.n}: ${s.title}\n\n${strip(s.body)}`).join("\n\n")}\n\n## Troubleshooting\n\n${lab.troubleshooting}\n\n## Challenge\n\n${lab.challenge}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `${c.id}-lab.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className={`lab-m${lab.steps.length > 8 ? " is-dense" : ""}`}>
      <header className="lab-m-panel lab-m-hero">
        <div className="lab-m-hero-top">
          <span className="eyebrow tone-accent">Guided lab · {envLabel(lab.environment)}</span>
          <span className="eyebrow">{minutes} min</span>
        </div>
        <h2 className="display lab-m-title">{lab.title}</h2>
        <div className="lab-m-hero-grid">
          <div className="lab-m-intro">
            {parsed.intro.map((b, i) => b.type === "md"
              ? <div key={i} className="md" dangerouslySetInnerHTML={{ __html: enhance(i === 0 ? b.html.replace(/^<p>(Practice revised)/, '<p class="lab-m-notice">$1') : b.html) }} />
              : <Blocks key={i} blocks={[b]} />)}
          </div>
          <aside className="lab-m-kit" aria-label="This lab at a glance">
            <dl>
              <div className="lab-m-kit-row"><dt>Environment</dt><dd>{envLabel(lab.environment)}</dd></div>
              {lab.devices?.length ? <div className="lab-m-kit-row"><dt>Devices</dt><dd>{lab.devices.map((d) => <div key={d}>{d}</div>)}</dd></div> : null}
              <div className="lab-m-kit-row"><dt>Time</dt><dd>{minutes} min</dd></div>
              <div className="lab-m-kit-row"><dt>Steps</dt><dd>{lab.steps.length}</dd></div>
            </dl>
            <div className="lab-m-kit-foot">
              <div className="lab-m-count"><span>{progress.done} / {progress.total} steps</span><span>{cp.labDone ? "Complete" : progress.done ? "In progress" : "Not started"}</span></div>
              <div className="lab-m-segs" aria-hidden="true">{lab.steps.map((s) => <span key={s.id} className={done.includes(s.id) ? "on" : ""} />)}</div>
              <button type="button" className="lab-m-dl" onClick={download}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                Download .md
              </button>
            </div>
          </aside>
        </div>
      </header>

      {lab.topology && <Topology blocks={parsed.topo} spec={topoSpec} devices={lab.devices} />}

      <nav className="lab-m-route" aria-label="Lab steps">
        {lab.steps.map((s, i) => {
          const tone = parsed.steps[i].state?.tone;
          const cls = [done.includes(s.id) && "is-done", current === s.id && "is-current", (tone === "warn" || tone === "bad") && `is-${tone}`].filter(Boolean).join(" ");
          return (
            <button key={s.id} type="button" className={cls} title={s.title} aria-label={`Step ${s.n}: ${s.title}${done.includes(s.id) ? ", verified" : ""}`} aria-current={current === s.id ? "step" : undefined} onClick={() => jumpToId(s.id)}>
              <span className="n">{pad(s.n)}</span>
              <span className="t">{s.title}</span>
            </button>
          );
        })}
      </nav>

      {lab.steps.map((s, i) => (
        <StepPanel key={s.id} step={s} parsed={parsed.steps[i]} done={done.includes(s.id)} onToggle={() => toggleInList(c.id, "stepsDone", s.id)} topos={topos} />
      ))}

      {lab.troubleshooting && (
        <section className="lab-m-panel lab-m-trouble" aria-labelledby="lab-m-trouble">
          <h2 id="lab-m-trouble" className="display lab-m-h2">Troubleshooting</h2>
          <LabBlocks blocks={parsed.trouble} />
        </section>
      )}

      {lab.challenge && <Challenge blocks={parsed.challenge} chapterId={c.id} done={done} />}

      <footer className="lab-m-panel lab-m-foot">
        <span className="lab-m-foot-count">{progress.done} / {progress.total} steps verified</span>
        <button type="button" className={`btn ${cp.labDone ? "ghost" : ""}`} onClick={() => { updateChapter(c.id, { labDone: !cp.labDone }); if (!cp.labDone) logActivity(c.minutes.lab); }}>{cp.labDone ? "Lab complete · undo" : "Mark lab complete"}</button>
        <a className="btn accent" href={chapterHref(c.id, "check")}>Next: Checkpoint →</a>
      </footer>
    </div>
  );
}

/** Which step is in the middle of the viewport, for the route strip. */
function useCurrentStep(steps: LabStep[]) {
  const [current, setCurrent] = useState<string>("");
  useEffect(() => {
    const els = steps.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setCurrent(hit.target.id);
    }, { rootMargin: "-35% 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [steps]);
  return current;
}

/** Markdown with the lab's emphasis styling; everything else falls through to the shared renderer. */
function LabBlocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b, i) => b.type === "md" ? <div key={i} className="md" dangerouslySetInnerHTML={{ __html: enhance(b.html) }} /> : <Blocks key={i} blocks={[b]} />)}</>;
}

function Topology({ blocks, spec, devices }: { blocks: Block[]; spec?: TopologySpec; devices?: string[] }) {
  const lead = blocks[0]?.type === "md" && !blocks[0].html.includes("<table") ? blocks[0] : null;
  const rest = lead ? blocks.slice(1) : blocks;
  return (
    <section className="lab-m-panel lab-m-topo" aria-labelledby="lab-m-topology">
      <div className="lab-m-topo-head">
        <h2 id="lab-m-topology" className="display lab-m-h2">Topology</h2>
        {lead && <div className="md" dangerouslySetInnerHTML={{ __html: enhance(lead.html) }} />}
      </div>
      {rest.map((b, i) => {
        if (b.type === "diagram" && b.spec === spec && spec) return <Schematic key={i} spec={spec} devices={devices} />;
        if (b.type === "md" && b.html.includes("<table")) return <div key={i} className="md lab-m-tables" dangerouslySetInnerHTML={{ __html: enhance(b.html) }} />;
        return <LabBlocks key={i} blocks={[b]} />;
      })}
    </section>
  );
}

/** The lab's topology, drawn to the figure standard. Devices without a sub line show their model. */
function Schematic({ spec, devices }: { spec: TopologySpec; devices?: string[] }) {
  const options = useMemo(() => ({ models: Object.fromEntries(spec.nodes.map((n) => [n.id, modelOf(n.label, devices)]).filter(([, m]) => m)) }), [spec, devices]);
  return (
    <figure className="lab-m-fig">
      <div className="lab-m-fig-head">
        <span className="eyebrow">Fig · {spec.title ?? "Topology"}</span>
        <span className="eyebrow">{spec.nodes.length} devices · {spec.links.length} links</span>
      </div>
      <NetFigure spec={spec} options={options} label={spec.title} />
      {spec.caption && <figcaption>{spec.caption}</figcaption>}
    </figure>
  );
}

/** A topology too broad for the side column: its step pictures sit under the step at full width. */
function isWide(spec?: TopologySpec) {
  if (!spec?.nodes.length) return false;
  const xs = spec.nodes.map((n) => n.x), ys = spec.nodes.map((n) => n.y);
  const oneRow = Math.max(...ys) - Math.min(...ys) < 0.5;
  return !oneRow && spec.nodes.length >= 5 && Math.max(...xs) - Math.min(...xs) >= 7;
}

function StepPanel({ step, parsed, done, onToggle, topos }: { step: LabStep; parsed: { state: StepState | null; blocks: Block[] }; done: boolean; onToggle: () => void; topos: TopologySpec[] }) {
  const { state, blocks } = parsed;
  const spec = state ? topos[(state.topology ?? 1) - 1] : undefined;
  const wide = isWide(spec);
  const visual = state && spec ? <StepPicture n={step.n} state={state} spec={spec} /> : null;
  const flag = state?.tone === "warn" || state?.tone === "bad" ? state.tone : null;
  const hasExpected = blocks.some((b) => b.type === "container" && b.name === "expected");
  const verify = (standalone: boolean) => (
    <label className={`lab-m-verify${standalone ? " standalone" : ""}`}>
      <input type="checkbox" checked={done} onChange={onToggle} />
      I verified this result
    </label>
  );
  let lastText = "";
  const body: ReactNode[] = blocks.map((b, i) => {
    if (b.type === "md") { lastText = plain(b.html); return <div key={i} className="md" dangerouslySetInnerHTML={{ __html: enhance(b.html) }} />; }
    if (b.type === "code") return <CodeBlock key={i} lang={b.lang} title={codeLabel(b, lastText)} text={b.text} />;
    if (b.type === "container" && b.name === "expected") return (
      <div key={i} className="lab-m-expect">
        <div className="lab-m-expect-head"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.6 2.6L16 9.5" /></svg>{b.title || "What you should see"}</div>
        <div className="lab-m-expect-body"><LabBlocks blocks={b.blocks} /></div>
        {verify(false)}
      </div>
    );
    return <Blocks key={i} blocks={[b]} />;
  });
  return (
    <section id={step.id} tabIndex={-1} aria-labelledby={`${step.id}-title`} className={["lab-m-step", done && "is-done", flag && `is-${flag}`, !visual && "no-visual", visual && wide && "is-wide"].filter(Boolean).join(" ")}>
      <div className="lab-m-num">
        <span className="eyebrow">Step</span>
        <span className="display n">{pad(step.n)}</span>
        {done && <span className="lab-m-verified">Verified</span>}
      </div>
      <div className="lab-m-body">
        {flag && <span className={`lab-m-tag ${flag}`}>{state!.status}</span>}
        <h3 id={`${step.id}-title`} className="display">{step.title}</h3>
        {body}
        {!hasExpected && verify(true)}
      </div>
      {visual && <div className="lab-m-visual">{visual}</div>}
    </section>
  );
}

/** "S1 · CLI" for a device's commands; for a bare command, the device the sentence before it names. */
function codeLabel(b: Extract<Block, { type: "code" }>, before: string) {
  if (b.lang === "ios") return `${b.title || "Device"} · CLI`;
  if (b.title) return b.title;
  const who = [...before.matchAll(/\bOn ([A-Z][A-Za-z0-9-]*)/g)].pop()?.[1] ?? [...before.matchAll(/\bFrom ([A-Z][A-Za-z0-9-]*)/g)].pop()?.[1];
  if (!who) return "";
  return /^PC/.test(who) ? `${who} · Command Prompt` : who;
}

/** The network after one step: the lab's own topology, with only what that step says is true. */
function StepPicture({ n, state, spec }: { n: number; state: StepState; spec: TopologySpec }) {
  const trace = useMemo(() => traceFromStep(state), [state]);
  const options = useMemo(() => ({ uncabled: state.cabled === false, hideAddresses: state.addressed === false || Array.isArray(state.addressed), showAddressesOf: Array.isArray(state.addressed) ? state.addressed : undefined }), [state.cabled, state.addressed]);
  const leds = useMemo(() => ({ all: state.led, wake: state.wake }), [state.led, state.wake]);
  const summary = `After step ${pad(n)}: ${state.status}. ` + (state.rows ?? []).map(([k, v]) => `${k}: ${v}`).join(". ");
  return (
    <figure className="lab-m-state" aria-label={summary}>
      <div className="lab-m-state-head"><span>After step {pad(n)}</span><span className={state.tone ? `tone-${state.tone}` : ""}>{state.status}</span></div>
      <NetFigure spec={spec} trace={trace} options={options} leds={leds} label={`The network after step ${pad(n)}`} className="lab-m-state-fig" turn />
      {state.rows?.length ? (
        <dl className="lab-m-state-rows">
          {state.rows.map(([k, v, t]) => <div key={k}><dt>{k}</dt><dd className={t ? `tone-${t}` : ""}>{v}</dd></div>)}
        </dl>
      ) : null}
    </figure>
  );
}

/** The challenge, with its "Keep … evidence: a, b, and c." sentence turned into a list you can tick. */
function Challenge({ blocks, chapterId, done }: { blocks: Block[]; chapterId: string; done: string[] }) {
  let evidence: { lead: string; items: string[] } | null = null;
  const main: Block[] = [], side: Block[] = [];
  for (const b of blocks) {
    if (b.type === "container" && b.name === "solution") { side.push(b); continue; }
    if (b.type === "md" && !evidence) {
      const m = b.html.match(/<p>(Keep [^<:]*):\s*([^<]+?)\.<\/p>/);
      if (m) {
        evidence = { lead: m[1] + ":", items: m[2].split(/,\s*(?:and\s+)?/).map((s) => s.replace(/^and\s+/, "").trim()).filter(Boolean) };
        const restHtml = b.html.replace(m[0], "").trim();
        if (restHtml) main.push({ type: "md", html: restHtml });
        continue;
      }
    }
    main.push(b);
  }
  return (
    <section className="lab-m-challenge" aria-labelledby="lab-m-challenge">
      <div className="lab-m-ch-main">
        <h2 id="lab-m-challenge" className="display">Challenge</h2>
        <LabBlocks blocks={main} />
      </div>
      <div className="lab-m-ch-side">
        {evidence && (
          <>
            <p className="lab-m-ch-lead" dangerouslySetInnerHTML={{ __html: evidence.lead }} />
            {evidence.items.map((it, i) => {
              const id = `challenge-evidence-${i + 1}`;
              return (
                <label key={id} className="lab-m-ev">
                  <input type="checkbox" checked={done.includes(id)} onChange={() => toggleInList(chapterId, "stepsDone", id)} />
                  <span dangerouslySetInnerHTML={{ __html: it.charAt(0).toUpperCase() + it.slice(1) }} />
                </label>
              );
            })}
          </>
        )}
        <Blocks blocks={side} />
      </div>
    </section>
  );
}
