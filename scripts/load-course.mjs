// Loads the course from /content into one plain object.
// Used by the Vite virtual module (dev + build) and by scripts/validate-content.mjs.
import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(text) {
  const m = text.match(FRONTMATTER);
  if (!m) return { meta: {}, body: text };
  let meta;
  try {
    meta = YAML.parse(m[1]) ?? {};
  } catch (e) {
    throw new Error(`frontmatter YAML: ${String(e.message).split(/\r?\n/)[0]} (quote values that contain ": ")`);
  }
  return { meta, body: text.slice(m[0].length) };
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Splits a lesson body into sections at `## ` headings (content before the first heading is the intro). */
export function splitSections(body, sectionIds = {}) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let current = { id: "intro", title: "", body: [] };
  let inFence = false;
  const used = new Set();
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      if (current.body.length || current.id !== "intro") sections.push(current);
      const title = h[1].trim();
      const explicitId = sectionIds[title];
      if (explicitId !== undefined && (typeof explicitId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(explicitId) || explicitId === "intro")) {
        throw new Error(`Invalid stable section id for "${title}"`);
      }
      let id = explicitId ?? slugify(title);
      let n = 2;
      if (explicitId && used.has(id)) throw new Error(`Duplicate stable section id "${id}"`);
      while (used.has(id)) id = slugify(h[1]) + "-" + n++;
      used.add(id);
      current = { id, title: h[1].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);
  for (const title of Object.keys(sectionIds)) {
    if (!sections.some(s => s.title === title)) throw new Error(`Stable section id refers to missing heading "${title}"`);
  }
  return sections
    .map((s) => ({ ...s, body: s.body.join("\n").trim() }))
    .filter((s) => s.body || s.id !== "intro");
}

/** Splits a lab body into intro/topology/steps/troubleshooting/challenge. */
export function parseLab(body) {
  const sections = splitSections(body);
  const lab = { intro: "", topology: "", steps: [], troubleshooting: "", challenge: "" };
  for (const s of sections) {
    const step = s.title.match(/^step\s+(\d+)\s*[:.–-]?\s*(.*)$/i);
    if (s.id === "intro") lab.intro = s.body;
    else if (/^topology/i.test(s.title)) lab.topology = s.body;
    else if (step) lab.steps.push({ id: "step-" + step[1], n: Number(step[1]), title: step[2] || "Step " + step[1], body: s.body });
    else if (/^troubleshoot/i.test(s.title)) lab.troubleshooting = s.body;
    else if (/^challenge/i.test(s.title)) lab.challenge = s.body;
    else lab.intro += (lab.intro ? "\n\n" : "") + "## " + s.title + "\n\n" + s.body;
  }
  return lab;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw new Error(`${file}: ${e.message}`);
  }
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function loadCourse(contentDir) {
  const course = JSON.parse(await fs.readFile(path.join(contentDir, "course.json"), "utf8"));
  const blueprint = JSON.parse(await fs.readFile(path.join(contentDir, "blueprint.json"), "utf8"));
  const chaptersDir = path.join(contentDir, "chapters");
  const folders = (await fs.readdir(chaptersDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
  const chapters = [];
  for (const folder of folders) {
    const dir = path.join(chaptersDir, folder);
    const chapterFile = path.join(dir, "chapter.md");
    let raw;
    try {
      raw = await fs.readFile(chapterFile, "utf8");
    } catch (e) {
      if (e.code === "ENOENT") continue; // folder without a chapter yet
      throw new Error(`${folder}/chapter.md: ${e.message}`);
    }
    let meta, body;
    try {
      ({ meta, body } = parseFrontmatter(raw.replace(/^﻿/, "")));
    } catch (e) {
      throw new Error(`${folder}/chapter.md: ${e.message}`);
    }
    const sections = splitSections(body, meta.sectionIds);
    let lab = null;
    try {
      const labRaw = await fs.readFile(path.join(dir, "lab.md"), "utf8");
      const parsed = parseFrontmatter(labRaw.replace(/^﻿/, ""));
      lab = { ...parsed.meta, ...parseLab(parsed.body) };
    } catch (e) {
      if (e.code !== "ENOENT") throw new Error(`${folder}/lab.md: ${e.message}`);
    }
    const numberFromFolder = Number((folder.match(/^(\d+)/) || [])[1]);
    chapters.push({
      id: meta.id ?? folder.replace(/^\d+-/, ""),
      folder,
      number: meta.number ?? numberFromFolder,
      title: meta.title ?? folder,
      subtitle: meta.subtitle ?? "",
      part: meta.part ?? "foundations",
      domain: meta.domain ?? "none",
      minutes: meta.minutes ?? { lesson: 45, lab: 30 },
      objectives: { v1: meta.objectives?.v1 ?? [], v2: meta.objectives?.v2 ?? [] },
      prereqs: meta.prereqs ?? [],
      sources: meta.sources ?? [],
      summary: meta.summary ?? "",
      sections,
      words: wordCount(body),
      lab,
      questions: await readJson(path.join(dir, "questions.json"), []),
      cards: await readJson(path.join(dir, "cards.json"), []),
      commands: await readJson(path.join(dir, "commands.json"), []),
      tickets: await readJson(path.join(dir, "tickets.json"), []),
    });
  }
  chapters.sort((a, b) => a.number - b.number);
  return { ...course, blueprint, chapters, generatedAt: new Date().toISOString() };
}
