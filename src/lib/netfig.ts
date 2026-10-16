/* The network figure engine. It turns a topology spec, and the traffic it should show, into a
   drawing: device boxes, ports on the box edges, orthogonal cables that run port to port without crossing a device,
   placed labels, and a timeline in which traffic moves one hop at a time. Pure functions: the figure component
   renders the result and scripts/check-figures.mjs verifies every figure in the course with the same code. */

import type { CablePick, EventSpec, FlowSpec, FlowTone, MarkTone, NetTrace, NodeKind, TopoLink, TopologySpec, TopoSide } from "./types";

export type Pt = [number, number];
type Side = TopoSide;
export interface Rect { x: number; y: number; w: number; h: number }
export interface Box extends Rect { id: string; kind: NodeKind; label: string[]; sub: string[]; highlight: boolean; cx: number; cy: number; absent?: boolean }
export interface Port { id: string; link: number; node: string; peer: string; side: Side; x: number; y: number }
export interface TextPart { text: string; tone?: MarkTone }
export interface Label extends Rect { parts: TextPart[]; tx: number; ty: number; anchor: "start" | "middle" | "end"; cls: "port" | "link" | "zone" }
export interface Cable { link: number; a: Port; b: Port; pts: Pt[]; d: string; rd: string; len: number; style: NonNullable<TopoLink["style"]>; accent: boolean; state: "up" | "down" | "off" }
export interface Zone extends Rect { label: string }
export interface Bar { x1: number; y1: number; x2: number; y2: number }
export type Tone = FlowTone | "bad";
/** A tag or chip beside a device, or a port role; shown from t0 (−1: from the start) until t1 (null: to the end). */
export interface Tag extends Rect { text: string; tone: Tone | MarkTone; t0: number; t1: number | null; kind: "tag" | "chip" | "role"; tx?: number; ty?: number; anchor?: "start" | "end"; bar?: Bar }
export type Ev =
  | { kind: "hop"; cable: number; rev: boolean; t0: number; t1: number; tone: Tone; far: Port }
  | { kind: "proc"; node: string; d: string; t0: number; t1: number; tone: Tone }
  | { kind: "recv"; node: string; t0: number; t1: number; tone: Tone }
  | { kind: "drop"; node: string; x: number; y: number; t0: number; t1: number };
export interface Figure {
  view: Rect;
  boxes: Box[];
  ports: Port[];
  cables: Cable[];
  labels: Label[];
  zones: Zone[];
  bars: Bar[];
  marks: Tag[];
  events: Ev[];
  dur: number;
  /** When the last state change starts: a still figure shows only the traffic from then on. */
  settle: number;
  narrative: string[];
  focus: Set<string>;
  down: Set<string>;
  problems: string[];
}
export interface FigureOptions {
  /** Draw every cable as not yet connected. */
  uncabled?: boolean;
  /** Hide sub lines that are addresses (a lab step before addressing). */
  hideAddresses?: boolean;
  /** With hideAddresses: these devices keep their address lines (they are addressed already). */
  showAddressesOf?: string[];
  /** Lay a single-row chain out top to bottom, for a narrow column. */
  vertical?: boolean;
  /** Shown in a box that has no sub line, such as a lab's device models. */
  models?: Record<string, string>;
}

/* ---------- metrics (user units; the SVG scales to its column) ---------- */

const LABEL_CH = 7.2, LABEL_LINE = 15, SUB_CH = 5.75, SUB_LINE = 12, SMALL_CH = 6, TAG_CH = 6.25, TAG_H = 20;
const GLYPH = 16, PAD_X = 12, MIN_W = 64, STUB = 12, RADIUS = 8;
const NORMAL: Record<Side, Pt> = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
/** An address line: a dotted quad, IPv6, or a shorthand host part such as ".10.1" or "LAN .2". */
const isAddress = (s: string) => /\d+\.\d+\.\d+\.\d+|::|^fe80|(^|[\s(,])\.\d+/i.test(s);
export const tagWidth = (text: string) => Math.round(text.length * TAG_CH + 20);
/** Seconds a tag stays up at least, long enough to read it. */
const readTime = (text: string) => Math.min(4.2, Math.max(2.2, 0.9 + text.length * 0.07));
/** How long traffic pauses at a device that shows a tag, before it moves on. */
const DWELL = 1.05;
const textWidth = (parts: TextPart[]) => parts.reduce((n, p) => n + p.text.length, 0) * SMALL_CH;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Break a line near its middle at the most natural separator. */
function wrap(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  for (const sep of [" · ", "; ", ", ", ": ", " / ", " "]) {
    const cuts: number[] = [];
    for (let i = text.indexOf(sep); i > 0; i = text.indexOf(sep, i + 1)) cuts.push(i);
    if (!cuts.length) continue;
    const i = cuts.sort((a, b) => Math.abs(a - text.length / 2) - Math.abs(b - text.length / 2))[0];
    const keep = sep.trim() === "·" || sep === " " || sep === " / " ? 0 : sep.trimEnd().length;
    return [text.slice(0, i + keep).trim(), text.slice(i + sep.length).trim()];
  }
  return [text];
}

function measure(n: TopologySpec["nodes"][number], opts: FigureOptions): Box {
  const hidden = opts.hideAddresses && !opts.showAddressesOf?.includes(n.id);
  const subText = n.sub && !(hidden && isAddress(n.sub)) ? n.sub : opts.models?.[n.id] ?? "";
  const label = wrap(n.label, 16), sub = subText ? wrap(subText, 20) : [];
  const w = Math.max(MIN_W, GLYPH + Math.max(...label.map((l) => l.length * LABEL_CH)), ...sub.map((s) => s.length * SUB_CH)) + PAD_X * 2;
  const h = 10 + label.length * LABEL_LINE + (sub.length ? 2 + sub.length * SUB_LINE : 0) + 9;
  return { id: n.id, kind: n.kind, label, sub, highlight: !!n.highlight, x: 0, y: 0, w: Math.round(w), h: Math.max(34, h), cx: 0, cy: 0 };
}

/* ---------- geometry helpers ---------- */

const overlaps = (a: Rect, b: Rect, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
function segHitsRect([x0, y0]: Pt, [x1, y1]: Pt, r: Rect, m = 0) {
  const minx = Math.min(x0, x1), maxx = Math.max(x0, x1), miny = Math.min(y0, y1), maxy = Math.max(y0, y1);
  return maxx > r.x - m && minx < r.x + r.w + m && maxy > r.y - m && miny < r.y + r.h + m;
}
const dedupe = (pts: Pt[]) => pts.filter((p, i) => i === 0 || Math.abs(p[0] - pts[i - 1][0]) > 0.01 || Math.abs(p[1] - pts[i - 1][1]) > 0.01);
function simplify(pts: Pt[]): Pt[] {
  const p = dedupe(pts);
  return p.filter((q, i) => i === 0 || i === p.length - 1 || !((Math.abs(p[i - 1][0] - q[0]) < 0.01 && Math.abs(q[0] - p[i + 1][0]) < 0.01) || (Math.abs(p[i - 1][1] - q[1]) < 0.01 && Math.abs(q[1] - p[i + 1][1]) < 0.01)));
}
export function roundPath(input: Pt[], rad = RADIUS): string {
  const pts = dedupe(input);
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1), rr = Math.min(rad, l1 / 2, l2 / 2);
    d += ` L${r2(x1 - ((x1 - x0) / l1) * rr)} ${r2(y1 - ((y1 - y0) / l1) * rr)} Q${r2(x1)} ${r2(y1)} ${r2(x1 + ((x2 - x1) / l2) * rr)} ${r2(y1 + ((y2 - y1) / l2) * rr)}`;
  }
  const L = pts[pts.length - 1];
  return d + ` L${r2(L[0])} ${r2(L[1])}`;
}
const pathLength = (pts: Pt[]) => pts.reduce((n, p, i) => (i ? n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/* ---------- placement: grid units to user units, as tight as the labels allow ---------- */

type Kind = "H" | "V" | "L1" | "L2";
interface Plan { link: number; sa: Side; sb: Side; kind: Kind }

function place(spec: TopologySpec, boxes: Map<string, Box>, grow: number, vertical: boolean) {
  const nodes = spec.nodes.map((n) => ({ id: n.id, gx: vertical ? n.y : n.x, gy: vertical ? n.x : n.y }));
  const minX = Math.min(...nodes.map((n) => n.gx)), minY = Math.min(...nodes.map((n) => n.gy));
  const need = spec.links.map((l) => {
    const ends = [l.fromLabel, l.toLabel].map((t, i) => (t ?? "").length + ((i ? l.toBadge : l.fromBadge)?.length ?? 0));
    return { h: Math.max(48, (ends[0] + ends[1]) * SMALL_CH + 34, (l.label?.length ?? 0) * SMALL_CH + 24), v: l.label ? 54 : 42 };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const fits = (UX: number, UY: number) => {
    const at = (id: string) => { const n = byId.get(id)!, b = boxes.get(id)!; return { cx: (n.gx - minX) * UX, cy: (n.gy - minY) * UY, w: b.w, h: b.h }; };
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = at(nodes[i].id), b = at(nodes[j].id);
      if (Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 + 26 && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2 + 22) return false;
    }
    for (let i = 0; i < spec.links.length; i++) {
      const l = spec.links[i];
      if (!byId.has(l.from) || !byId.has(l.to)) continue;
      const a = at(l.from), b = at(l.to), dx = Math.abs(a.cx - b.cx), dy = Math.abs(a.cy - b.cy);
      const hGap = dx - (a.w + b.w) / 2, vGap = dy - (a.h + b.h) / 2;
      if (dy < (a.h + b.h) / 2) { if (hGap < need[i].h) return false; }
      else if (dx < (a.w + b.w) / 2) { if (vGap < need[i].v) return false; }
      else if (!(hGap >= 40 || vGap >= 40 || (dx - a.w / 2 >= 26 && dy - b.h / 2 >= 26) || (dy - a.h / 2 >= 26 && dx - b.w / 2 >= 26))) return false;
    }
    return true;
  };
  let best: { UX: number; UY: number; cost: number } | null = null;
  const spanX = Math.max(...nodes.map((n) => n.gx)) - minX, spanY = Math.max(...nodes.map((n) => n.gy)) - minY;
  for (let UY = 36; UY <= 180; UY += 4) {
    for (let UX = 36; UX <= 240; UX += 4) {
      if (!fits(UX, UY)) continue;
      const cost = (spanX * UX + 140) * (spanY * UY + 60) * (1 + 0.45 * Math.abs(Math.log(UX / UY)));
      if (!best || cost < best.cost) best = { UX, UY, cost };
      break;
    }
  }
  const UX = (best?.UX ?? 84) * grow, UY = (best?.UY ?? 84) * grow;
  for (const n of nodes) {
    const b = boxes.get(n.id)!;
    b.cx = r2((n.gx - minX) * UX); b.cy = r2((n.gy - minY) * UY);
    b.x = r2(b.cx - b.w / 2); b.y = r2(b.cy - b.h / 2);
  }
}

/* ---------- ports and cables ---------- */

function sideCandidates(A: Box, B: Box): Plan["kind"][] {
  const right = B.cx >= A.cx, below = B.cy >= A.cy, out: Kind[] = [];
  const hGap = right ? B.x - (A.x + A.w) : A.x - (B.x + B.w);
  const vGap = below ? B.y - (A.y + A.h) : A.y - (B.y + B.h);
  if (hGap >= 2 * STUB) out.push("H");
  if (vGap >= 2 * STUB) out.push("V");
  if ((right ? B.cx - (A.x + A.w) : A.x - B.cx) >= STUB + RADIUS && (below ? B.y - A.cy : A.cy - (B.y + B.h)) >= STUB + RADIUS) out.push("L1");
  if ((below ? B.cy - (A.y + A.h) : A.y - B.cy) >= STUB + RADIUS && (right ? B.x - A.cx : A.cx - (B.x + B.w)) >= STUB + RADIUS) out.push("L2");
  return out;
}
function sidesOf(A: Box, B: Box, kind: Kind): [Side, Side] {
  const right = B.cx >= A.cx, below = B.cy >= A.cy;
  if (kind === "H") return [right ? "r" : "l", right ? "l" : "r"];
  if (kind === "V") return [below ? "b" : "t", below ? "t" : "b"];
  if (kind === "L1") return [right ? "r" : "l", below ? "t" : "b"];
  return [below ? "b" : "t", right ? "l" : "r"];
}
const kindOf = (sa: Side, sb: Side): Kind => {
  const ha = sa === "l" || sa === "r", hb = sb === "l" || sb === "r";
  return ha && hb ? "H" : !ha && !hb ? "V" : ha ? "L1" : "L2";
};
function portPoint(b: Box, side: Side, at: number): Pt {
  return side === "l" ? [b.x, at] : side === "r" ? [b.x + b.w, at] : side === "t" ? [at, b.y] : [at, b.y + b.h];
}
/** Candidate orthogonal routes between two ports; each is a point list from a to b. */
/** Candidate routes between two ports. `la`/`lb` are the widths of the names beside each port: a bend that would cut
    through a name is tried last. */
function routes(a: Pt, sa: Side, b: Pt, sb: Side, la = 0, lb = 0): Pt[][] {
  const na = NORMAL[sa], nb = NORMAL[sb];
  const P1: Pt = [a[0] + na[0] * STUB, a[1] + na[1] * STUB], P2: Pt = [b[0] + nb[0] * STUB, b[1] + nb[1] * STUB];
  const kind = kindOf(sa, sb), out: Pt[][] = [];
  const fr = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88];
  // the first choice is the middle of the stretch the port names leave free
  const span = kind === "H" ? P2[0] - P1[0] : P2[1] - P1[1];
  const [roomA, roomB] = kind === "H" ? [la ? la + 10 : 0, lb ? lb + 10 : 0] : [la ? 16 : 0, lb ? 16 : 0];
  if ((kind === "H" || kind === "V") && (roomA || roomB) && Math.abs(span) > roomA + roomB + 8) {
    const free0 = roomA / Math.abs(span), free1 = 1 - roomB / Math.abs(span);
    fr.unshift((free0 + free1) / 2);
  }
  if (kind === "H") {
    if (Math.abs(a[1] - b[1]) < 0.5) out.push([a, b]);
    else for (const f of fr) { const mx = P1[0] + (P2[0] - P1[0]) * f; out.push([a, P1, [mx, a[1]], [mx, b[1]], P2, b]); }
  } else if (kind === "V") {
    if (Math.abs(a[0] - b[0]) < 0.5) out.push([a, b]);
    else for (const f of fr) { const my = P1[1] + (P2[1] - P1[1]) * f; out.push([a, P1, [a[0], my], [b[0], my], P2, b]); }
  } else if (kind === "L1") out.push([a, P1, [b[0], a[1]], P2, b]);
  else out.push([a, P1, [a[0], b[1]], P2, b]);
  return out.map(simplify);
}
interface Obstacles { boxes: Box[]; segs: { cable: number; a: Pt; b: Pt }[] }
function routeCost(pts: Pt[], ends: [string, string], obs: Obstacles, cable: number) {
  let cost = (pts.length - 2) * 8 + pathLength(pts) * 0.02;
  for (let i = 0; i < pts.length - 1; i++) {
    for (const bx of obs.boxes) {
      if (ends.includes(bx.id)) {
        // a cable may touch its own device only at its port
        const inner = { x: bx.x + 1, y: bx.y + 1, w: bx.w - 2, h: bx.h - 2 };
        if (segHitsRect(pts[i], pts[i + 1], inner)) cost += 5000;
      } else if (segHitsRect(pts[i], pts[i + 1], bx, 4)) cost += 5000;
    }
    for (const s of obs.segs) {
      if (s.cable === cable) continue;
      const [p, q] = [pts[i], pts[i + 1]];
      const vert = Math.abs(p[0] - q[0]) < 0.5, sv = Math.abs(s.a[0] - s.b[0]) < 0.5;
      if (vert && sv && Math.abs(p[0] - s.a[0]) < 5) {
        const lo = Math.max(Math.min(p[1], q[1]), Math.min(s.a[1], s.b[1])), hi = Math.min(Math.max(p[1], q[1]), Math.max(s.a[1], s.b[1]));
        if (hi - lo > 1) cost += 600;
      } else if (!vert && !sv && Math.abs(p[1] - s.a[1]) < 5) {
        const lo = Math.max(Math.min(p[0], q[0]), Math.min(s.a[0], s.b[0])), hi = Math.min(Math.max(p[0], q[0]), Math.max(s.a[0], s.b[0]));
        if (hi - lo > 1) cost += 600;
      } else if (vert !== sv) {
        const [v, h] = vert ? [[p, q], [s.a, s.b]] : [[s.a, s.b], [p, q]];
        const x = v[0][0], y = h[0][1];
        if (x > Math.min(h[0][0], h[1][0]) + 1 && x < Math.max(h[0][0], h[1][0]) - 1 && y > Math.min(v[0][1], v[1][1]) + 1 && y < Math.max(v[0][1], v[1][1]) - 1) cost += 30;
      }
    }
  }
  return cost;
}

function layoutCables(spec: TopologySpec, boxes: Map<string, Box>, problems: string[]) {
  const nameW = (l: TopoLink, end: 0 | 1) => ((end ? l.toLabel : l.fromLabel)?.length ?? 0) * SMALL_CH + ((end ? l.toBadge : l.fromBadge) ? ((end ? l.toBadge : l.fromBadge)!.length + 1) * SMALL_CH : 0);
  const links = spec.links.map((l, i) => ({ l, i })).filter(({ l }) => boxes.has(l.from) && boxes.has(l.to) && l.from !== l.to);
  const obs: Obstacles = { boxes: [...boxes.values()], segs: [] };
  // 1. sides, judged with ports at the middle of each side
  const plans: Plan[] = links.map(({ l, i }) => {
    const A = boxes.get(l.from)!, B = boxes.get(l.to)!;
    let kinds = sideCandidates(A, B);
    if (l.fromSide || l.toSide) {
      const forced = (["H", "V", "L1", "L2"] as Kind[]).filter((k) => { const [sa, sb] = sidesOf(A, B, k); return (!l.fromSide || l.fromSide === sa) && (!l.toSide || l.toSide === sb); });
      kinds = forced.length ? forced : kinds;
      if (!forced.length && l.fromSide && l.toSide) return { link: i, sa: l.fromSide, sb: l.toSide, kind: kindOf(l.fromSide, l.toSide) };
    }
    if (!kinds.length) { problems.push(`${l.from}–${l.to}: the devices are too close for a cable`); kinds = ["H"]; }
    let best: Plan | null = null, bestCost = Infinity;
    for (const k of kinds) {
      const [sa, sb] = sidesOf(A, B, k);
      const pa = portPoint(A, sa, sa === "l" || sa === "r" ? A.cy : A.cx), pb = portPoint(B, sb, sb === "l" || sb === "r" ? B.cy : B.cx);
      // rows and columns read best when cables leave and enter square to them; a corner route is the fallback
      const bias = (k === "L1" || k === "L2") && (kinds.includes("H") || kinds.includes("V")) ? 20 : 0;
      const c = Math.min(...routes(pa, sa, pb, sb, nameW(l, 0), nameW(l, 1)).map((r) => routeCost(r, [A.id, B.id], obs, -1))) + bias;
      if (c < bestCost) { bestCost = c; best = { link: i, sa, sb, kind: k }; }
    }
    return best!;
  });
  // 2. ports spread along each side, ordered by where the far end lies so cables do not cross
  const groups = new Map<string, { plan: Plan; end: 0 | 1 }[]>();
  for (const p of plans) {
    const l = spec.links[p.link];
    for (const end of [0, 1] as const) {
      const node = end ? l.to : l.from, side = end ? p.sb : p.sa, key = `${node}|${side}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ plan: p, end });
    }
  }
  const at = new Map<string, number>();
  const pkey = (link: number, end: 0 | 1) => `${link}:${end}`;
  for (const [key, list] of groups) {
    const [node, side] = key.split("|") as [string, Side];
    const b = boxes.get(node)!, horiz = side === "l" || side === "r";
    const far = (e: { plan: Plan; end: 0 | 1 }) => { const l = spec.links[e.plan.link]; const o = boxes.get(e.end ? l.from : l.to)!; return horiz ? o.cy : o.cx; };
    list.sort((p, q) => far(p) - far(q) || p.plan.link - q.plan.link);
    const len = horiz ? b.h : b.w;
    // ports whose names sit beside them need room for the names
    const labelled = list.some((e) => { const l = spec.links[e.plan.link]; return e.end ? l.toLabel || l.toBadge : l.fromLabel || l.fromBadge; });
    const gap = horiz && labelled ? 22 : 11;
    if (list.length > 1 && len / (list.length + 1) < gap) {
      const grow = (list.length + 1) * gap - len;
      if (horiz) { b.h += grow; b.y -= grow / 2; } else { b.w += grow; b.x -= grow / 2; }
    }
    const lo = horiz ? b.y : b.x, span = horiz ? b.h : b.w;
    list.forEach((e, k) => at.set(pkey(e.plan.link, e.end), r2(lo + (span * (k + 1)) / (list.length + 1))));
  }
  // a lone port on each end of a straight run shares one line, so the cable is straight
  for (const p of plans) {
    const l = spec.links[p.link], A = boxes.get(l.from)!, B = boxes.get(l.to)!;
    const soleA = groups.get(`${l.from}|${p.sa}`)!.length === 1, soleB = groups.get(`${l.to}|${p.sb}`)!.length === 1;
    if (p.kind === "H" || p.kind === "V") {
      const horiz = p.kind === "H";
      const [a0, a1] = horiz ? [A.y + 8, A.y + A.h - 8] : [A.x + 8, A.x + A.w - 8];
      const [b0, b1] = horiz ? [B.y + 8, B.y + B.h - 8] : [B.x + 8, B.x + B.w - 8];
      const va = at.get(pkey(p.link, 0))!, vb = at.get(pkey(p.link, 1))!;
      if (soleA && soleB) { const lo = Math.max(a0, b0), hi = Math.min(a1, b1); if (lo <= hi) { const v = r2(Math.min(hi, Math.max(lo, (va + vb) / 2))); at.set(pkey(p.link, 0), v); at.set(pkey(p.link, 1), v); } }
      else if (soleA && vb >= a0 && vb <= a1) at.set(pkey(p.link, 0), vb);
      else if (soleB && va >= b0 && va <= b1) at.set(pkey(p.link, 1), va);
    }
  }
  // 3. route, keeping away from devices and from cables already drawn
  const ports: Port[] = [], cables: { plan: Plan; pts: Pt[] }[] = [];
  for (const p of plans) {
    const l = spec.links[p.link], A = boxes.get(l.from)!, B = boxes.get(l.to)!;
    // a lone port may move a little along its side to keep its cable off another cable's line
    const soleA = groups.get(`${l.from}|${p.sa}`)!.length === 1, soleB = groups.get(`${l.to}|${p.sb}`)!.length === 1;
    const room = (b: Box, side: Side, v: number) => (side === "l" || side === "r" ? v >= b.y + 6 && v <= b.y + b.h - 6 : v >= b.x + 8 && v <= b.x + b.w - 8);
    let best: Pt[] = [], bestCost = Infinity, pa: Pt = [0, 0], pb: Pt = [0, 0];
    for (const da of soleA ? [0, 7, -7] : [0]) {
      for (const db of soleB ? [0, -7, 7] : [0]) {
        const va = at.get(pkey(p.link, 0))! + da, vb = at.get(pkey(p.link, 1))! + db;
        if ((da && !room(A, p.sa, va)) || (db && !room(B, p.sb, vb))) continue;
        const qa = portPoint(A, p.sa, va), qb = portPoint(B, p.sb, vb);
        for (const r of routes(qa, p.sa, qb, p.sb, nameW(l, 0), nameW(l, 1))) {
          const c = routeCost(r, [A.id, B.id], obs, p.link) + (da || db ? 4 : 0);
          if (c < bestCost) { bestCost = c; best = r; pa = qa; pb = qb; }
        }
      }
      if (bestCost < 600) break;
    }
    ports.push({ id: pkey(p.link, 0), link: p.link, node: l.from, peer: l.to, side: p.sa, x: pa[0], y: pa[1] });
    ports.push({ id: pkey(p.link, 1), link: p.link, node: l.to, peer: l.from, side: p.sb, x: pb[0], y: pb[1] });
    if (bestCost >= 5000) problems.push(`${l.from}–${l.to}: the cable crosses a device`);
    else if (bestCost >= 600) problems.push(`${l.from}–${l.to}: the cable runs along another cable`);
    for (let i = 0; i < best.length - 1; i++) obs.segs.push({ cable: p.link, a: best[i], b: best[i + 1] });
    cables.push({ plan: p, pts: best });
  }
  return { ports, cables, segs: obs.segs };
}

/* ---------- labels ---------- */

interface Placed { rects: Rect[]; segs: Obstacles["segs"]; boxes: Box[]; problems: string[] }
function score(r: Rect, pl: Placed, own = -1) {
  let s = 0;
  for (const b of pl.boxes) if (overlaps(r, b, 2)) s += 100;
  for (const q of pl.rects) if (overlaps(r, q, 1)) s += 100;
  for (const g of pl.segs) {
    if (segHitsRect(g.a, g.b, r, 1)) s += 20;
    // a cable's label must not sit nearer another cable than its own
    else if (own >= 0 && g.cable !== own && segHitsRect(g.a, g.b, r, 9)) s += 15;
  }
  return s;
}
function textRect(tx: number, ty: number, w: number, anchor: Label["anchor"], size = 10): Rect {
  const x = anchor === "start" ? tx : anchor === "end" ? tx - w : tx - w / 2;
  return { x, y: ty - size * 0.8, w, h: size + 2 };
}
function placeText(parts: TextPart[], cands: [number, number, Label["anchor"]][], pl: Placed, cls: Label["cls"], skipCable = -1): Label {
  const w = textWidth(parts);
  let best: Label | null = null, bestScore = Infinity;
  for (const [tx, ty, anchor] of cands) {
    const r = textRect(tx, ty, w, anchor), s = score(r, pl, skipCable);
    if (s < bestScore) { bestScore = s; best = { ...r, parts, tx, ty, anchor, cls }; }
    if (s === 0) break;
  }
  if (bestScore >= 100) pl.problems.push(`label "${parts.map((p) => p.text).join("")}" overlaps another label or a device`);
  pl.rects.push(best!);
  return best!;
}
const roleTone = (t: string): MarkTone => (/^(RP|Root)\b/i.test(t) ? "accent" : /^(DP|Desg|designated)\b/i.test(t) ? "ok" : /^(ALT|Altn|BLK|blocking|discard)/i.test(t) ? "warn" : "dim");
/** Where a port's name can go, best first. `last` marks the lower or right-hand port of several on one side, whose
    name reads best on the outside of the group. */
function portLabelCands(p: Port, last = false): [number, number, Label["anchor"]][] {
  const { x, y } = p;
  const flip = (c: [number, number, Label["anchor"]][]) => (last ? [c[1], c[0], ...c.slice(2)] : c);
  if (p.side === "r") return flip([[x + 6, y - 5, "start"], [x + 6, y + 13, "start"], [x + 6, y - 16, "start"]]);
  if (p.side === "l") return flip([[x - 6, y - 5, "end"], [x - 6, y + 13, "end"], [x - 6, y - 16, "end"]]);
  if (p.side === "t") return last ? [[x + 6, y - 6, "start"], [x - 6, y - 6, "end"], [x + 6, y - 18, "start"]] : [[x - 6, y - 6, "end"], [x + 6, y - 6, "start"], [x - 6, y - 18, "end"]];
  return last ? [[x + 6, y + 14, "start"], [x - 6, y + 14, "end"], [x + 6, y + 26, "start"]] : [[x - 6, y + 14, "end"], [x + 6, y + 14, "start"], [x - 6, y + 26, "end"]];
}
function linkLabelCands(pts: Pt[]): [number, number, Label["anchor"]][] {
  const segs = pts.slice(1).map((p, i) => ({ a: pts[i], b: p, len: Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) })).filter((s) => s.len >= 18).sort((p, q) => q.len - p.len);
  const out: [number, number, Label["anchor"]][] = [];
  for (const s of segs) {
    for (const f of [0.5, 0.32, 0.68]) {
      const mx = s.a[0] + (s.b[0] - s.a[0]) * f, my = s.a[1] + (s.b[1] - s.a[1]) * f;
      if (Math.abs(s.a[1] - s.b[1]) < 0.5) out.push([mx, my - 6, "middle"], [mx, my + 14, "middle"]);
      else out.push([mx + 7, my + 3, "start"], [mx - 7, my + 3, "end"]);
    }
  }
  if (!out.length) { const m = pts[Math.floor(pts.length / 2)]; out.push([m[0], m[1] - 6, "middle"]); }
  return out;
}

/* ---------- traffic ---------- */

const isEvent = (f: FlowSpec | EventSpec): f is EventSpec => Array.isArray((f as EventSpec).event);

/** The track a frame follows inside a device: in from the ingress port, along an inset rectangle the shorter way
    round, out at the egress port. Ties go over the top or down the right, away from the sub line. */
export function insideTrack(b: Box, A: Port, B: Port, inset = 5): string {
  if (A.id === B.id) {
    // in and back out of the same port (a router on a stick)
    const [nx, ny] = NORMAL[A.side], tx = -ny, ty = nx;
    const p = (k: number, t: number): Pt => [A.x - nx * k + tx * t, A.y - ny * k + ty * t];
    const a = p(13, 6), c = p(21, 0), e = p(13, -6);
    return `M${A.x} ${A.y} L${r2(a[0])} ${r2(a[1])} Q${r2(c[0])} ${r2(c[1])} ${r2(e[0])} ${r2(e[1])} L${A.x} ${A.y}`;
  }
  const x0 = b.x + inset, y0 = b.y + inset, x1 = b.x + b.w - inset, y1 = b.y + b.h - inset, W = x1 - x0, H = y1 - y0, per = 2 * (W + H);
  const onInset = (q: Port): Pt => (q.side === "l" ? [x0, q.y] : q.side === "r" ? [x1, q.y] : q.side === "t" ? [q.x, y0] : [q.x, y1]);
  const s = ([px, py]: Pt, side: Side) => (side === "t" ? px - x0 : side === "r" ? W + (py - y0) : side === "b" ? W + H + (x1 - px) : 2 * W + H + (y1 - py));
  const corners: [number, Pt][] = [[0, [x0, y0]], [W, [x1, y0]], [W + H, [x1, y1]], [2 * W + H, [x0, y1]]];
  const pa = onInset(A), pb = onInset(B), sa = s(pa, A.side), sb = s(pb, B.side);
  const mod = (v: number) => ((v % per) + per) % per;
  const cw = mod(sb - sa), ccw = per - cw;
  const via = (dir: 1 | -1) => corners.filter(([c]) => { const d = dir > 0 ? mod(c - sa) : mod(sa - c); return d > 0 && d < (dir > 0 ? cw : ccw); })
    .sort((p, q) => (dir > 0 ? mod(p[0] - sa) - mod(q[0] - sa) : mod(sa - p[0]) - mod(sa - q[0]))).map(([, xy]) => xy);
  let dir: 1 | -1 = cw < ccw ? 1 : -1;
  if (Math.abs(cw - ccw) < 0.5) {
    const sc = (pts: Pt[]) => pts.reduce((n, [x, y]) => n + y * 1000 - x, 0) / Math.max(1, pts.length);
    dir = sc(via(1)) <= sc(via(-1)) ? 1 : -1;
  }
  return roundPath([[A.x, A.y], pa, ...via(dir), pb, [B.x, B.y]], 5);
}

/** A lab step's picture: what the step says is true, as figure options and a trace. */
export interface StepLike extends NetTrace {
  cabled?: boolean;
  addressed?: boolean | string[];
  ping?: string[];
  pings?: string[][];
  prompt?: { node: string; text: string; tone?: MarkTone };
}
export function traceFromStep(st: StepLike): NetTrace {
  const pings = st.pings ?? (st.ping ? [st.ping] : []);
  const flows: (FlowSpec | EventSpec)[] = st.flows ?? pings.filter((p) => p[0] !== p[1]).map((p) => ({ path: [p[0], p[1]], route: "shortest", back: true, ...(p[2] === "fail" ? { backStop: p[1] } : {}) } as FlowSpec));
  return { ...st, flows, chips: [...(st.chips ?? []), ...(st.prompt ? [st.prompt] : [])] };
}

/* ---------- the whole figure ---------- */

export function buildFigure(spec: TopologySpec, trace: NetTrace | undefined = spec.trace, opts: FigureOptions = {}): Figure {
  let best: Figure | null = null;
  for (const grow of [1, 1.12, 1.26, 1.42, 1.6]) {
    const fig = attempt(spec, trace, opts, grow);
    if (!best || fig.problems.length < best.problems.length) best = fig;
    if (!fig.problems.length) break;
  }
  return best!;
}

function attempt(spec: TopologySpec, traceIn: NetTrace | undefined, opts: FigureOptions, grow: number): Figure {
  const problems: string[] = [];
  const nodes = spec.nodes ?? [];
  const boxes = new Map(nodes.map((n) => [n.id, measure(n, opts)]));
  const vertical = !!opts.vertical;
  place(spec, boxes, grow, vertical);
  const { ports, cables: routed, segs } = layoutCables(spec, boxes, problems);
  const portOf = (link: number, node: string) => ports.find((p) => p.link === link && p.node === node);
  const trace: NetTrace = traceIn ?? (spec.packet ? { flows: [{ path: spec.packet.path, label: spec.packet.label }] } : {});
  const downNodes = new Set(trace.down ?? []);
  const linkIs = (l: TopoLink, pair: readonly unknown[]) => (l.from === pair[0] && l.to === pair[1]) || (l.from === pair[1] && l.to === pair[0]);
  /** A cable named by its two nodes, and by its index in `links` when they share more than one. */
  const picks = (i: number, pick: CablePick) => linkIs(spec.links[i], pick) && (pick[2] === undefined || pick[2] === i);
  const absent = new Set(trace.absent ?? []);
  for (const id of absent) { const b = boxes.get(id); if (b) b.absent = true; else problems.push(`absent: unknown node ${id}`); }
  const isDown = (i: number) => { const l = spec.links[i]; return downNodes.has(l.from) || downNodes.has(l.to) || (trace.cut ?? []).some((c) => picks(i, c)); };
  const isAbsent = (i: number) => absent.has(spec.links[i].from) || absent.has(spec.links[i].to);

  const cables: Cable[] = routed.map(({ plan, pts }) => {
    const l = spec.links[plan.link];
    return {
      link: plan.link, a: portOf(plan.link, l.from)!, b: portOf(plan.link, l.to)!, pts, d: roundPath(pts), rd: roundPath([...pts].reverse()), len: pathLength(pts),
      style: l.style ?? "solid", accent: !!l.accent, state: opts.uncabled || isAbsent(plan.link) ? "off" : isDown(plan.link) ? "down" : "up",
    };
  });

  // labels: port names with their roles, link labels, zones
  const pl: Placed = { rects: [], segs, boxes: [...boxes.values()], problems };
  // blocked ports: a bar across the cable just outside the port
  const bars: Bar[] = [];
  const barAt = (p: Port): Bar => { const [nx, ny] = NORMAL[p.side], cx = p.x + nx * 9, cy = p.y + ny * 9; pl.rects.push({ x: cx - 8, y: cy - 8, w: 16, h: 16 }); return ny === 0 ? { x1: cx, y1: cy - 7, x2: cx, y2: cy + 7 } : { x1: cx - 7, y1: cy, x2: cx + 7, y2: cy }; };
  const blocked = new Set<string>();
  const blockAt = (p: Port) => { if (blocked.has(p.id)) return; blocked.add(p.id); bars.push(barAt(p)); };
  /** A blocking role carries the blocking bar with it. */
  const isBlocking = (t: string) => /^(ALT|Altn|BLK|Blocking|Discarding)\b/i.test(t);
  for (const c of cables) {
    const l = spec.links[c.link];
    if (c.style === "blocked") {
      const end = /^(ALT|Altn|BLK)/i.test(l.toBadge ?? "") && !/^(ALT|Altn|BLK)/i.test(l.fromBadge ?? "") ? c.b : c.a;
      blockAt(end);
    }
  }
  for (const pair of trace.blocked ?? []) {
    const c = cables.find((c) => picks(c.link, pair));
    if (!c) { problems.push(`blocked ${pair.join("–")}: no such cable`); continue; }
    blockAt(c.a.node === pair[0] ? c.a : c.b);
  }

  const labels: Label[] = [];
  const roleAt = new Map<string, string>();
  for (const c of cables) {
    const l = spec.links[c.link];
    if (l.fromBadge) roleAt.set(c.a.id, l.fromBadge);
    if (l.toBadge) roleAt.set(c.b.id, l.toBadge);
  }
  const timedRoles = (trace.roles ?? []).filter((r) => r.from !== undefined || r.until !== undefined);
  for (const r of trace.roles ?? []) {
    if (r.from !== undefined || r.until !== undefined) continue;
    const c = cables.find((c) => linkIs(spec.links[c.link], [r.node, r.peer]) && (r.link === undefined || r.link === c.link));
    if (!c) { problems.push(`role ${r.node}→${r.peer}: no such cable`); continue; }
    const port = c.a.node === r.node ? c.a : c.b;
    roleAt.set(port.id, `${r.text}\u0000${r.tone ?? ""}`);
    if (isBlocking(r.text)) blockAt(port);
  }
  const marks: Tag[] = [];
  /** The lower or right-hand port of several on a side; a lone port on a top or bottom edge reads to the right. */
  const lastOf = (p: Port) => {
    const sib = ports.filter((q) => q.node === p.node && q.side === p.side);
    if (sib.length === 1) return p.side === "t" || p.side === "b";
    const key = (q: Port) => (p.side === "l" || p.side === "r" ? q.y : q.x);
    return key(p) === Math.max(...sib.map(key));
  };
  for (const c of cables) {
    const l = spec.links[c.link];
    for (const [p, name] of [[c.a, l.fromLabel], [c.b, l.toLabel]] as [Port, string | undefined][]) {
      const role = roleAt.get(p.id);
      const parts: TextPart[] = [];
      if (name) parts.push({ text: name });
      if (role) { const [text, tone] = role.split("\u0000"); parts.push({ text: `${name ? " " : ""}${text}`, tone: (tone || roleTone(text)) as MarkTone }); }
      // A role that changes during the animation is a timed mark. Reserve room for the longest one beside the port's
      // name: after it when the label reads away from the port, before it when the label is right-aligned.
      const timed = timedRoles.filter((r) => p.node === r.node && p.peer === r.peer && (r.link === undefined || r.link === p.link));
      if (timed.length) {
        const longest = Math.max(...timed.map((r) => r.text.length));
        const lab = placeText([...parts, { text: `${parts.length ? " " : ""}${"x".repeat(longest)}` }], portLabelCands(p, lastOf(p)), pl, "port");
        const nameW = textWidth(parts), gap = parts.length ? SMALL_CH : 0;
        if (parts.length) labels.push({ ...lab, parts, w: nameW, x: lab.anchor === "end" ? lab.tx - nameW : lab.tx });
        for (const r of timed) {
          const w = r.text.length * SMALL_CH, end = lab.anchor === "end";
          const tx = end ? lab.tx - nameW - gap : lab.tx + nameW + gap;
          marks.push({ x: end ? tx - w : tx, y: lab.y, w, h: lab.h, tx, ty: lab.ty, anchor: end ? "end" : "start", text: r.text, tone: r.tone ?? roleTone(r.text), t0: r.from ?? -1, t1: r.until ?? null, kind: "role", bar: isBlocking(r.text) ? barAt(p) : undefined });
        }
        continue;
      }
      if (parts.length) labels.push(placeText(parts, portLabelCands(p, lastOf(p)), pl, "port"));
    }
  }
  for (const c of cables) {
    const l = spec.links[c.link];
    if (l.label) labels.push(placeText([{ text: l.label }], linkLabelCands(c.pts), pl, "link", c.link));
  }
  const zones: Zone[] = [];
  for (const z of spec.zones ?? []) {
    const bs = z.nodes.map((id) => boxes.get(id)).filter(Boolean) as Box[];
    if (!bs.length) continue;
    const x = Math.min(...bs.map((b) => b.x)) - 14, y = Math.min(...bs.map((b) => b.y)) - 24;
    const zr = { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) + 14 - x, h: Math.max(...bs.map((b) => b.y + b.h)) + 14 - y, label: z.label };
    zones.push(zr);
    labels.push(placeText([{ text: z.label.toUpperCase() }], [[zr.x + 8, zr.y + 13, "start"], [zr.x + zr.w - 8, zr.y + 13, "end"], [zr.x + 8, zr.y - 5, "start"]], pl, "zone"));
  }

  // traffic
  const events: Ev[] = [];
  const narrative: string[] = [];
  const tagRects: { r: Rect; t0: number; t1: number }[] = [];
  const structural = [...boxes.values()];
  const bboxNow = () => {
    const xs = [...structural.map((b) => b.x), ...labels.map((l) => l.x)], ys = [...structural.map((b) => b.y), ...labels.map((l) => l.y)];
    const xe = [...structural.map((b) => b.x + b.w), ...labels.map((l) => l.x + l.w)], ye = [...structural.map((b) => b.y + b.h), ...labels.map((l) => l.y + l.h)];
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xe), y1: Math.max(...ye) };
  };
  const frame = bboxNow();
  const placeTag = (node: string, text: string, t0: number, t1: number): Rect => {
    const b = boxes.get(node)!, w = tagWidth(text), h = TAG_H, g = 7;
    const cands: Rect[] = [
      { x: b.cx - w / 2, y: b.y - g - h, w, h }, { x: b.cx - w / 2, y: b.y + b.h + g, w, h },
      { x: b.x, y: b.y - g - h, w, h }, { x: b.x + b.w - w, y: b.y - g - h, w, h },
      { x: b.x, y: b.y + b.h + g, w, h }, { x: b.x + b.w - w, y: b.y + b.h + g, w, h },
      { x: b.x + b.w + g + 4, y: b.cy - h / 2, w, h }, { x: b.x - g - 4 - w, y: b.cy - h / 2, w, h },
      { x: b.cx - w / 2, y: b.y - g - 2 * h - 4, w, h }, { x: b.cx - w / 2, y: b.y + b.h + g + h + 4, w, h },
      // further out: a second row above and below at each alignment, and the sides a row higher or lower.
      // Covering a port or cable name hides information, so only a device or another tag costs more.
      { x: b.x, y: b.y - g - 2 * h - 4, w, h }, { x: b.x + b.w - w, y: b.y - g - 2 * h - 4, w, h },
      { x: b.x, y: b.y + b.h + g + h + 4, w, h }, { x: b.x + b.w - w, y: b.y + b.h + g + h + 4, w, h },
      { x: b.x + b.w + g + 4, y: b.y - h - 2, w, h }, { x: b.x + b.w + g + 4, y: b.y + b.h + 2, w, h },
      { x: b.x - g - 4 - w, y: b.y - h - 2, w, h }, { x: b.x - g - 4 - w, y: b.y + b.h + 2, w, h },
    ];
    let best = cands[0], bestScore = Infinity;
    for (const r of cands) {
      let s = 0;
      for (const bx of structural) if (overlaps(r, bx, 3)) s += 1000;
      for (const l of labels) if (overlaps(r, l, 2)) s += 300;
      for (const z of zones) if (r.y < z.y + 16 && r.y + r.h > z.y && r.x < z.x + z.w && r.x + r.w > z.x) s += 10;
      for (const sg of segs) if (segHitsRect(sg.a, sg.b, r, 1)) s += 8;
      for (const q of tagRects) if (q.t0 < t1 && t0 < q.t1 && overlaps(r, q.r, 3)) s += 1000;
      for (const m of marks) if (overlaps(r, m, 2)) s += 1000;
      s += Math.max(0, frame.x0 - r.x) * 1.2 + Math.max(0, r.x + r.w - frame.x1) * 1.2 + Math.max(0, frame.y0 - r.y) * 0.6 + Math.max(0, r.y + r.h - frame.y1) * 0.6;
      s += cands.indexOf(r) * 0.5;
      if (s < bestScore) { bestScore = s; best = r; }
    }
    if (bestScore >= 1000) problems.push(`tag "${text}" at ${node} overlaps a device or another tag`);
    tagRects.push({ r: best, t0, t1 });
    return best;
  };
  let tagEnd = 0;
  const addTag = (node: string, text: string | undefined, tone: Tone, t0: number, until: number) => {
    if (!text) return;
    if (!boxes.has(node)) return;
    if (text.length > 44) problems.push(`tag "${text}" is longer than 44 characters`);
    const t1 = Math.max(until, t0 + readTime(text));
    tagEnd = Math.max(tagEnd, t1);
    const r = placeTag(node, text, t0, t1);
    marks.push({ ...r, text, tone, t0, t1, kind: "tag" });
  };
  const nameOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  // cables between two nodes that are up, preferring `via`
  const cableBetween = (u: string, v: string, via?: number | null) => {
    if (via !== undefined && via !== null) { const c = cables.find((c) => c.link === via); if (c && linkIs(spec.links[c.link], [u, v])) return c; problems.push(`via ${via} does not join ${u} and ${v}`); }
    const all = cables.filter((c) => linkIs(spec.links[c.link], [u, v]));
    return all.find((c) => c.state === "up") ?? all[0];
  };
  const shortest = (from: string, to: string): string[] => {
    const prev = new Map<string, string>([[from, ""]]), queue = [from];
    while (queue.length) {
      const u = queue.shift()!;
      if (u === to) break;
      for (const c of cables) {
        if (c.state !== "up") continue;
        const l = spec.links[c.link], v = l.from === u ? l.to : l.to === u ? l.from : null;
        if (v && !prev.has(v)) { prev.set(v, u); queue.push(v); }
      }
    }
    if (!prev.has(to)) { problems.push(`no cabled path from ${from} to ${to}`); return [from, to]; }
    const path = [to];
    while (path[0] !== from) path.unshift(prev.get(path[0])!);
    return path;
  };

  // chips that stay all along are placed first, so the traffic's tags keep clear of them
  const chip = (ch: NonNullable<NetTrace["chips"]>[number], t0: number, t1: number | null) => {
    if (!boxes.has(ch.node)) { problems.push(`chip: unknown node ${ch.node}`); return; }
    const r = placeTag(ch.node, ch.text, t0 < 0 ? 0 : t0, t1 ?? 1e9);
    marks.push({ ...r, text: ch.text, tone: ch.tone ?? "dim", t0, t1, kind: "chip" });
  };
  for (const ch of trace.chips ?? []) if (ch.from === undefined && ch.until === undefined) chip(ch, -1, null);

  let t = 0.4, settle = 0;
  const flowStarts: number[] = [];
  const hopTime = (c: Cable) => r2(Math.min(1.25, Math.max(0.55, 0.42 + c.len / 380)));
  /** One direction of a flow. Returns when it ends, or null when the path is invalid. */
  const run = (path: string[], fan: string[] | null, via: (number | null)[] | undefined, tone: Tone, tags: Record<string, string> | undefined, stop: string | undefined, stopText: string | undefined, start: number, finalRecv: boolean): number | null => {
    for (const id of [...path, ...(fan ?? [])]) if (!boxes.has(id)) { problems.push(`flow: unknown node ${id}`); return null; }
    for (const id of [...path, ...(fan ?? [])]) if (absent.has(id)) problems.push(`flow: ${id} is not there yet`);
    const hops: { c: Cable; rev: boolean; from: Port; to: Port }[] = [];
    for (let k = 0; k < path.length - 1; k++) {
      const c = cableBetween(path[k], path[k + 1], via?.[k]);
      if (!c) { problems.push(`flow: ${path[k]} and ${path[k + 1]} are not cabled`); return null; }
      const rev = spec.links[c.link].from !== path[k];
      hops.push({ c, rev, from: rev ? c.b : c.a, to: rev ? c.a : c.b });
    }
    let now = start;
    const stopAt = stop ? path.indexOf(stop) : -1;
    if (stop && stopAt < 0) problems.push(`flow: stop ${stop} is not on the path`);
    for (let k = 0; k < hops.length; k++) {
      const h = hops[k], node = path[k];
      if (k > 0) {
        const text = tags?.[node], d = text ? DWELL : 0.42;
        events.push({ kind: "proc", node, d: insideTrack(boxes.get(node)!, hops[k - 1].to, h.from), t0: now, t1: now + d, tone });
        addTag(node, text, tone, now, now + d + 1.1);
        now += d;
      } else if (tags?.[node]) {
        addTag(node, tags[node], tone, now, now + 1.3);
        now += 0.5;
      }
      if (stopAt === k) {
        events.push({ kind: "drop", node, x: h.from.x + NORMAL[h.from.side][0] * 14, y: h.from.y + NORMAL[h.from.side][1] * 14, t0: now, t1: now + 1.9 });
        addTag(node, stopText, "bad", now, now + 1.9);
        return now + 1.9;
      }
      if (h.c.state !== "up") problems.push(`flow crosses a cable that is down: ${path[k]}–${path[k + 1]}`);
      const d = hopTime(h.c);
      events.push({ kind: "hop", cable: h.c.link, rev: h.rev, t0: now, t1: now + d, tone, far: h.to });
      now += d;
    }
    const last = path[path.length - 1];
    if (fan?.length) {
      const inPort = hops.length ? hops[hops.length - 1].to : null;
      const outs = fan.map((v) => { const c = cableBetween(last, v); if (!c) { problems.push(`flow: ${last} and ${v} are not cabled`); return null; } const rev = spec.links[c.link].from !== last; return { c, rev, from: rev ? c.b : c.a, to: rev ? c.a : c.b, v }; }).filter(Boolean) as { c: Cable; rev: boolean; from: Port; to: Port; v: string }[];
      const text = tags?.[last], d = text ? DWELL : 0.45;
      for (const o of outs) if (inPort) events.push({ kind: "proc", node: last, d: insideTrack(boxes.get(last)!, inPort, o.from), t0: now, t1: now + d, tone });
      addTag(last, text, tone, now, now + d + 1.1);
      now += d;
      let end = now;
      for (const o of outs) {
        const hd = hopTime(o.c);
        events.push({ kind: "hop", cable: o.c.link, rev: o.rev, t0: now, t1: now + hd, tone, far: o.to });
        events.push({ kind: "recv", node: o.v, t0: now + hd, t1: now + hd + 0.7, tone });
        addTag(o.v, tags?.[o.v], tone, now + hd, now + hd + 1.8);
        end = Math.max(end, now + hd + 0.7);
      }
      return end;
    }
    if (stopAt === path.length - 1) {
      // discarded by the last node itself
      events.push({ kind: "recv", node: last, t0: now, t1: now + 0.5, tone: "bad" });
      const p = hops.length ? hops[hops.length - 1].to : null;
      if (p) events.push({ kind: "drop", node: last, x: p.x + NORMAL[p.side][0] * 14, y: p.y + NORMAL[p.side][1] * 14, t0: now, t1: now + 1.9 });
      addTag(last, stopText, "bad", now, now + 1.9);
      return now + 1.9;
    }
    if (finalRecv) {
      const text = tags?.[last];
      events.push({ kind: "recv", node: last, t0: now, t1: now + (text ? DWELL + 0.15 : 0.6), tone });
      addTag(last, text, tone, now, now + 1.9);
      now += text ? DWELL + 0.15 : 0.6;
    }
    return now;
  };

  for (const [i, f] of (trace.flows ?? []).entries()) {
    if (isEvent(f)) {
      t += f.wait ?? 0;
      flowStarts[i] = t;
      settle = t;
      for (const node of f.event) {
        if (!boxes.has(node)) { problems.push(`event: unknown node ${node}`); continue; }
        events.push({ kind: "recv", node, t0: t, t1: t + 1.2, tone: (f.tone ?? "request") as Tone });
        addTag(node, f.tags?.[node], (f.tone ?? "request") as Tone, t, t + 2.4);
      }
      narrative.push(f.event.map((n) => (f.tags?.[n] ? `${nameOf(n)}: ${f.tags[n]}` : nameOf(n))).join(". "));
      t += 1.6;
      continue;
    }
    const start = f.with && i > 0 ? (flowStarts[i - 1] ?? t) + 0.6 + (f.wait ?? 0) : t + (f.wait ?? 0);
    flowStarts[i] = start;
    const raw = f.path;
    const fan = Array.isArray(raw[raw.length - 1]) ? (raw[raw.length - 1] as string[]) : null;
    let path = (fan ? raw.slice(0, -1) : raw) as string[];
    if (path.some(Array.isArray)) { problems.push("flow: only the last element of a path may list several nodes"); continue; }
    if ((f as FlowSpec & { route?: string }).route === "shortest" && path.length === 2) path = shortest(path[0], path[1]);
    const tone: Tone = f.tone ?? "request";
    let end = run(path, fan, f.via, tone, f.tags, f.stop, f.stopText, start, !f.back || !!f.stop);
    if (end !== null && f.back && !f.stop && !fan) {
      const last = path[path.length - 1], text = f.tags?.[last], hold = text ? DWELL : 0.45;
      events.push({ kind: "recv", node: last, t0: end, t1: end + hold, tone });
      addTag(last, text, tone, end, end + hold + 1);
      const back = [...path].reverse();
      end = run(back, null, f.via ? [...f.via].reverse() : undefined, "reply", f.backTags, f.backStop, f.backStopText, end + hold, true);
    }
    const story = [`${f.label ? `${f.label}: ` : ""}${path.map(nameOf).join(" → ")}${fan ? ` → ${fan.map(nameOf).join(", ")}` : ""}`];
    for (const n of [...path, ...(fan ?? [])]) if (f.tags?.[n]) story.push(`${nameOf(n)}: ${f.tags[n]}`);
    if (f.stop) story.push(`${nameOf(f.stop)} discards it${f.stopText ? `: ${f.stopText}` : ""}`);
    if (f.back && !f.stop) {
      story.push(f.backStop ? `The reply stops at ${nameOf(f.backStop)}${f.backStopText ? `: ${f.backStopText}` : ""}` : "The reply returns the same way");
      for (const n of [...path].reverse()) if (f.backTags?.[n]) story.push(`${nameOf(n)}: ${f.backTags[n]}`);
    }
    narrative.push(story.join(". "));
    if (end !== null) t = f.with ? Math.max(t, end + 0.3) : end + 0.3;
  }
  const animated = events.length > 0;
  const dur = animated ? r2(Math.max(t + 1.4, tagEnd + 0.6)) : 0;
  const when = (k: number | undefined, dflt: number | null) => (k === undefined ? dflt : flowStarts[k] ?? dflt);

  // chips and roles that change mid-animation; their times are flow indexes until now
  for (const ch of trace.chips ?? []) if (ch.from !== undefined || ch.until !== undefined) chip(ch, when(ch.from, -1)!, when(ch.until, null));
  for (const m of marks) if (m.kind === "role") { m.t0 = m.t0 < 0 ? -1 : when(m.t0, -1)!; m.t1 = m.t1 === null ? null : when(m.t1, null); }
  if (!animated) for (const m of marks) if (m.t0 > 0 || m.t1 !== null) problems.push(`"${m.text}" is timed but the figure has no traffic`);

  // validation of the rest of the trace
  for (const id of [...(trace.focus ?? []), ...(trace.down ?? [])]) if (!boxes.has(id)) problems.push(`unknown node ${id}`);
  for (const c of trace.cut ?? []) if (!cables.some((k) => picks(k.link, c))) problems.push(`cut ${c.join("–")}: no such cable`);
  for (const l of spec.links) if (!boxes.has(l.from) || !boxes.has(l.to)) problems.push(`link ${l.from}–${l.to}: unknown node`);

  // the frame: everything drawn, with a margin
  const xs: number[] = [], ys: number[] = [], xe: number[] = [], ye: number[] = [];
  const add = (r: Rect) => { xs.push(r.x); ys.push(r.y); xe.push(r.x + r.w); ye.push(r.y + r.h); };
  [...boxes.values()].forEach(add); labels.forEach(add); zones.forEach(add); marks.forEach(add);
  for (const c of cables) for (const [x, y] of c.pts) add({ x: x - 3, y: y - 3, w: 6, h: 6 });
  const M = 8, x0 = Math.min(...xs) - M, y0 = Math.min(...ys) - M;
  const view = { x: r2(x0), y: r2(y0), w: r2(Math.max(...xe) + M - x0), h: r2(Math.max(...ye) + M - y0) };

  return {
    view, boxes: [...boxes.values()], ports, cables, labels, zones, bars, marks, events, dur, settle, narrative,
    focus: new Set(trace.focus ?? []), down: downNodes, problems,
  };
}
