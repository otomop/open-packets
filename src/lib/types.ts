export type Track = "v1" | "v2";

export interface Objective {
  id: string;
  domain: string;
  text: string;
}

export interface DomainDef {
  id: string;
  n: string;
  title: string;
  weight: number;
}

export interface Part {
  id: string;
  title: string;
  blurb: string;
}

export interface Section {
  id: string;
  title: string;
  body: string;
}

export interface LabStep {
  id: string;
  n: number;
  title: string;
  body: string;
}

export interface Lab {
  title: string;
  environment: string;
  devices?: string[];
  minutes?: number;
  intro: string;
  topology: string;
  steps: LabStep[];
  troubleshooting: string;
  challenge: string;
}

export interface CliExhibit {
  kind: "cli";
  title?: string;
  text: string;
}
export interface DiagramExhibit {
  kind: "diagram";
  title?: string;
  spec: DiagramSpec;
}
export type Exhibit = CliExhibit | DiagramExhibit;

export interface Question {
  id: string;
  type: "single" | "multi";
  objectives: string[];
  difficulty: number;
  exhibit: Exhibit | null;
  prompt: string;
  options: string[];
  answer: number[];
  explanation: string;
  whyWrong?: Record<string, string>;
}

export interface Card {
  id: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface Drill {
  id: string;
  task: string;
  mode: string;
  answer: string;
  accept?: string[];
  teaching: {
    sectionId: string;
    hint: string;
    takeaway: string;
    syntax: { text: string; kind: "keyword" | "argument" | "interface" }[];
    focus: "core" | "supporting";
    focusByTrack?: Partial<Record<Track, "core" | "supporting">>;
  };
}

export interface CommandPlan {
  chapterId: string;
  goal: string;
  demand: "foundation" | "application" | "analysis";
  emptyReason?: string;
  reviewLinks: { chapterId: string; reason: string }[];
}

export interface Ticket {
  id: string;
  title: string;
  objectives: string[];
  scenario: string;
  exhibits: { title: string; text: string }[];
  question: string;
  options: string[];
  answer: number[];
  explanation: string;
  fix?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Chapter {
  id: string;
  folder: string;
  number: number;
  title: string;
  subtitle: string;
  part: string;
  domain: string;
  minutes: { lesson: number; lab: number };
  objectives: { v1: string[]; v2: string[] };
  prereqs: string[];
  sources: Source[];
  summary: string;
  sections: Section[];
  words: number;
  lab: Lab | null;
  questions: Question[];
  cards: Card[];
  commands: Drill[];
  tickets: Ticket[];
}

export interface ExamFacts {
  code: string;
  lengthMinutes: number;
  price: string;
  languages: string[];
  validityYears: number;
  retakeWaitDays: number;
  v1: { label: string; lastTestDate: string; topicsUrl: string };
  v2: { label: string; firstTestDate: string; topicsPublished: string; topicsUrl: string };
  announcementUrl: string;
  examPageUrl: string;
}

export interface Course {
  title: string;
  tagline: string;
  sourceCheckedOn: string;
  exam: ExamFacts;
  parts: Part[];
  domains: { v1: DomainDef[]; v2: DomainDef[] };
  blueprint: { v1: Objective[]; v2: Objective[] };
  chapters: Chapter[];
  generatedAt: string;
}

/** Compact navigation metadata; teaching text and practice payloads load on demand. */
export type ChapterSummary = Omit<Chapter, "sections" | "lab" | "questions" | "cards" | "commands" | "tickets"> & {
  sections: Pick<Section, "id" | "title">[];
  lab: (Pick<Lab, "title" | "environment" | "devices" | "minutes"> & { steps: Pick<LabStep, "id" | "n" | "title">[] }) | null;
  questions: Pick<Question, "id" | "objectives">[];
  cards: Pick<Card, "id">[];
  commands: Pick<Drill, "id" | "answer" | "mode">[];
  tickets: Pick<Ticket, "id">[];
};
export type CourseCatalog = Omit<Course, "chapters"> & { chapters: ChapterSummary[] };
export type ChapterContent = Pick<Chapter, "sections" | "lab">;
export type ReadingChapter = Omit<ChapterSummary, "sections" | "lab"> & ChapterContent;
export interface BankQuestion extends Question {
  chapterId: string; chapterTitle: string; chapterNumber: number; domainV1: string; domainV2: string;
}
export type BankCard = Card & { chapterId: string; chapterTitle: string; chapterNumber: number; domain: string };
export type BankDrill = Drill & { chapterId: string; chapterTitle: string };
export type BankTicket = Ticket & { chapterId: string; chapterTitle: string };

/* ---------- diagram specs ---------- */

export type NodeKind =
  | "router" | "switch" | "l3switch" | "pc" | "laptop" | "server" | "ap" | "wlc" | "phone" | "firewall" | "cloud" | "printer" | "hub";

export interface TopoNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  x: number;
  y: number;
  highlight?: boolean;
}
/** A side of a device box. The figure engine picks sides itself; these only override it. */
export type TopoSide = "l" | "r" | "t" | "b";
export interface TopoLink {
  from: string;
  to: string;
  label?: string;
  fromLabel?: string;
  toLabel?: string;
  fromBadge?: string;
  toBadge?: string;
  style?: "solid" | "dashed" | "blocked" | "wireless";
  accent?: boolean;
  fromSide?: TopoSide;
  toSide?: TopoSide;
}
export interface TopologySpec {
  type: "topology";
  title?: string;
  caption?: string;
  nodes: TopoNode[];
  links: TopoLink[];
  packet?: { path: string[]; label?: string };
  zones?: { label: string; nodes: string[] }[];
  /** The traffic the figure animates (content/FIGURES.md). */
  trace?: NetTrace;
}

/* ---------- network figure traces: see content/FIGURES.md ---------- */

export type FlowTone = "request" | "reply" | "alt" | "warn";
export type MarkTone = "ok" | "warn" | "bad" | "dim" | "accent";
/** Traffic crossing the topology one hop at a time. */
export interface FlowSpec {
  /** Node ids in order; consecutive nodes must be cabled. A final array floods to several neighbours at once. */
  path: (string | string[])[];
  /** Per hop, the index in `links` to use when two nodes share more than one cable. */
  via?: (number | null)[];
  tone?: FlowTone;
  /** A short name for the traffic, listed with the narrative. */
  label?: string;
  /** What a node does to this traffic, shown beside it while it handles it. */
  tags?: Record<string, string>;
  /** The node that discards the traffic, and why. */
  stop?: string;
  stopText?: string;
  /** A reply returns along the same path. */
  back?: boolean;
  backTags?: Record<string, string>;
  backStop?: string;
  backStopText?: string;
  /** Start with the previous flow instead of after it. */
  with?: boolean;
  /** Seconds of stillness before this flow starts. */
  wait?: number;
}
/** A moment when devices change state without traffic, such as a reconvergence. */
export interface EventSpec {
  event: string[];
  tags?: Record<string, string>;
  tone?: FlowTone | "bad";
  wait?: number;
}
/** A role at one end of a cable: `node`'s port toward `peer`. `from`/`until` are flow indexes. */
export interface RoleMark { node: string; peer: string; text: string; tone?: MarkTone; from?: number; until?: number; /** The index in `links` when the two nodes share more than one cable. */ link?: number }
export interface ChipMark { node: string; text: string; tone?: MarkTone; from?: number; until?: number }
export interface NetTrace {
  flows?: (FlowSpec | EventSpec)[];
  roles?: RoleMark[];
  chips?: ChipMark[];
  /** Cables touching these nodes are down. */
  down?: string[];
  /** These cables are down: [a, b], or [a, b, link index] when the two share more than one cable. */
  cut?: CablePick[];
  /** The first node's port on this cable is blocking (spanning tree). */
  blocked?: CablePick[];
  /** Devices not yet added: drawn as outlines, their cables not yet connected. */
  absent?: string[];
  focus?: string[];
}
export type CablePick = [string, string] | [string, string, number];
export interface SequenceSpec {
  type: "sequence";
  title?: string;
  caption?: string;
  actors: string[];
  steps: { from: number; to: number; label: string; note?: string; accent?: boolean; dashed?: boolean }[];
}
export interface BitsSpec {
  type: "bits";
  title?: string;
  caption?: string;
  fields: { label: string; bits: number; note?: string; highlight?: boolean }[];
}
export interface BinarySpec {
  type: "binary";
  title?: string;
  caption?: string;
  ip: string;
  prefix: number;
}
export interface TimelineSpec {
  type: "timeline";
  title?: string;
  caption?: string;
  unit?: string;
  rows: { label: string; segments: { label: string; length: number; tone?: "dim" | "mid" | "light" | "accent" | "bad" }[] }[];
}
export interface MatrixSpec {
  type: "matrix";
  title?: string;
  caption?: string;
  rows: string[];
  cols: string[];
  cells: string[][];
  tones?: Record<string, "accent" | "bad" | "neutral" | "ok" | "warn">;
}
export interface LayersSpec {
  type: "layers";
  title?: string;
  caption?: string;
  columns: { title: string; rows: (string | { label: string; span?: number })[] }[];
  highlight?: string[];
}
export type DiagramSpec = TopologySpec | SequenceSpec | BitsSpec | BinarySpec | TimelineSpec | MatrixSpec | LayersSpec;

/* ---------- progress ---------- */

export interface ChapterProgress {
  opened?: string;
  sectionsDone: string[];
  stepsDone: string[];
  labDone?: boolean;
  completed?: boolean;
  notes?: string;
  checkpoint?: { date: string; score: number; total: number };
}

export interface QuestionStat {
  seen: number;
  correct: number;
  last: string;
  lastCorrect: boolean;
  history: string; // most recent last, 'c' or 'w', max 12 chars
}

export interface Attempt {
  id: string;
  date: string;
  mode: string;
  scope: string;
  score: number;
  total: number;
  questionIds: string[];
  answers: Record<string, number[]>;
  durationSec: number;
}

export interface CardState {
  due: string;
  interval: number; // days
  ease: number;
  reps: number;
  lapses: number;
  last: string;
  introducedAt?: string; // first review; optional for existing progress exports
}

export interface Settings {
  track: Track;
  examDate: string;
  hoursPerWeek: number;
  theme: "system" | "dark" | "light";
  /** Full RGB accent color, stored as #RRGGBB. */
  accentColor: string;
  /** full (default) = always animate; reduced = minimize motion. */
  motion: "full" | "reduced";
  newCardsPerDay: number;
  gateCards: boolean;
  name: string;
  /** True once first-launch setup has been completed or dismissed. */
  onboarded: boolean;
  /** Show the scrolling ticker above the top bar. */
  showTicker: boolean;
  /** Desktop only: side menu collapsed. */
  navCollapsed: boolean;
  /** Chapter pages: the chapter tools rail collapsed. */
  toolsCollapsed: boolean;
}

export interface Progress {
  v: 1;
  settings: Settings;
  chapters: Record<string, ChapterProgress>;
  questions: Record<string, QuestionStat>;
  attempts: Attempt[];
  cards: Record<string, CardState>;
  drills: Record<string, { attempts: number; correct: number; last: string }>;
  tickets: Record<string, { correct: boolean; date: string }>;
  activity: Record<string, number>; // ISO date -> minutes
  subnet: { attempts: number; correct: number; byMode: Record<string, { a: number; c: number }> };
  createdAt: string;
}
