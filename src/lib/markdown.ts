import { marked } from "marked";
import type { DiagramSpec } from "./types";

export type Block =
  | { type: "md"; html: string }
  | { type: "code"; lang: string; title: string; text: string }
  | { type: "diagram"; spec: DiagramSpec; raw: string }
  | { type: "container"; name: string; title: string; blocks: Block[] };

marked.use({ gfm: true, breaks: false });

/** Post-process marked's HTML: external links open in a new tab, tables get a scroll wrapper, inner headings are demoted below the section h2. */
function polish(html: string): string {
  return html
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noreferrer"')
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, "</table></div>")
    .replace(/<h([12])>/g, "<h3>")
    .replace(/<\/h[12]>/g, "</h3>");
}

/** Author-only notes (`<!-- VERIFY: ... -->` and any other HTML comment) never reach the reader, even inside code fences. */
export function stripComments(src: string): string {
  return (src ?? "").replace(/<!--[\s\S]*?-->/g, "");
}

export function inlineHtml(md: string): string {
  return polish(marked.parseInline(stripComments(md)) as string);
}

export function mdHtml(md: string): string {
  return polish(marked.parse(stripComments(md)) as string);
}

const FENCE = /^```\s*([A-Za-z0-9_-]*)\s*(.*)$/;
const CONTAINER = /^:::\s*([a-z]+)\s*(.*)$/;

/** Parse lesson/lab markdown into renderable blocks (fences, ::: containers, diagrams, and plain markdown). */
export function parseBlocks(src: string): Block[] {
  const lines = stripComments(src).replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let md: string[] = [];
  const flush = () => {
    const text = md.join("\n").trim();
    if (text) out.push({ type: "md", html: mdHtml(text) });
    md = [];
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const f = line.match(FENCE);
    if (f) {
      flush();
      const lang = (f[1] || "text").toLowerCase();
      const title = (f[2] || "").trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      const text = buf.join("\n");
      if (lang === "diagram") {
        try {
          out.push({ type: "diagram", spec: JSON.parse(text), raw: text });
        } catch {
          out.push({ type: "code", lang: "json", title: "diagram (invalid JSON)", text });
        }
      } else out.push({ type: "code", lang, title, text });
      continue;
    }
    const c = line.match(CONTAINER);
    if (c) {
      flush();
      const name = c[1];
      const title = (c[2] || "").trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push({ type: "container", name, title, blocks: parseBlocks(buf.join("\n")) });
      continue;
    }
    md.push(line);
    i++;
  }
  flush();
  return out;
}

/* ---------- CLI highlighting ---------- */

export interface CliLine {
  html: string;
  note?: string;
  highlight: boolean;
  kind: "prompt" | "output" | "comment";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const PROMPT = /^(\s*)([A-Za-z0-9_.()\-\/:]+?(?:\(config[^)]*\))?[>#])(\s*)(.*)$/;

/** Keep rendered CLI text and copied commands consistent about author annotations. */
function cliSourceLines(text: string) {
  return stripComments(text).replace(/\r\n/g, "\n").split("\n").map((raw) => {
    let line = raw;
    let highlight = false;
    if (line.startsWith(">> ")) {
      highlight = true;
      line = line.slice(3);
    } else if (line.startsWith(">>")) {
      highlight = true;
      line = line.slice(2);
    }
    let note: string | undefined;
    const arrow = line.search(/\s{2,}(←|<-)\s/);
    if (arrow >= 0) {
      note = line.slice(arrow).replace(/^\s+(←|<-)\s*/, "").trim();
      line = line.slice(0, arrow).replace(/\s+$/, "");
    }
    return { line, note, highlight };
  });
}

/** Commands ready for a lab console: no prompts, highlight markers, or explanatory notes. */
export function cliCopyText(text: string): string {
  return cliSourceLines(text).map(({ line }) => {
    const prompt = line.match(PROMPT);
    return prompt ? prompt[4] : line;
  }).join("\n");
}

/** Split an `ios` or `output` block into lines with prompt/command spans and `←` annotations. */
export function cliLines(text: string, lang: string): CliLine[] {
  return cliSourceLines(text).map(({ line, note, highlight }): CliLine => {
    if (/^\s*!/.test(line)) return { html: esc(line), note, highlight, kind: "comment" };
    const m = line.match(PROMPT);
    if (m && (lang === "ios" || /^\S+[>#]\s+\S/.test(line))) {
      return { html: `${esc(m[1])}<span class="cli-prompt">${esc(m[2])}</span>${esc(m[3])}<span class="cli-cmd">${esc(m[4])}</span>`, note, highlight, kind: "prompt" };
    }
    return { html: esc(line), note, highlight, kind: "output" };
  });
}
