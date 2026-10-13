// Lays out every network figure in the course with the app's own engine (src/lib/netfig.ts) and reports anything
// the figure standard forbids: a cable through a device, cables sharing a line, overlapping labels or tags, traffic
// over a cable that is down, or a trace that names a device or cable the topology does not have.
// Usage: node scripts/check-figures.mjs [--verbose] [chapter-prefix]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runtime } from "./tests/runtime.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const { buildFigure, traceFromStep } = runtime().load("src/lib/netfig.ts");
const verbose = process.argv.includes("--verbose");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));

const figures = [];
const chapters = path.join(root, "content/chapters");
for (const dir of fs.readdirSync(chapters).sort()) {
  if (only && !dir.startsWith(only)) continue;
  for (const file of ["chapter.md", "lab.md"]) {
    const p = path.join(chapters, dir, file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    let step = 0;
    const lines = text.split(/\r?\n/);
    // every topology in a lab, in document order, so a step picture can name a later one
    const topos = [...text.matchAll(/^```diagram\s*\r?\n([\s\S]*?)\r?\n```/gm)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter((s) => s?.type === "topology");
    for (let i = 0; i < lines.length; i++) {
      if (/^## Step \d+/.test(lines[i])) step = Number(lines[i].match(/\d+/)[0]);
      const m = lines[i].match(/^```(diagram|state)\s*$/);
      if (!m) continue;
      let j = i + 1;
      while (j < lines.length && !/^```\s*$/.test(lines[j])) j++;
      const body = lines.slice(i + 1, j).join("\n");
      i = j;
      let spec;
      try { spec = JSON.parse(body); } catch { figures.push({ where: `${dir}/${file}:${i}`, error: "JSON does not parse" }); continue; }
      if (m[1] === "diagram") {
        if (spec.type !== "topology") continue;
        figures.push({ where: `${dir}/${file} · ${spec.title ?? "topology"}`, spec, trace: spec.trace, opts: {} });
      } else {
        const topo = topos[(spec.topology ?? 1) - 1];
        if (!topo) { figures.push({ where: `${dir}/lab.md step ${step}`, error: `the lab has no topology ${spec.topology ?? 1}` }); continue; }
        figures.push({ where: `${dir}/lab.md step ${step}`, spec: topo, trace: traceFromStep(spec), opts: { uncabled: spec.cabled === false, hideAddresses: spec.addressed === false || Array.isArray(spec.addressed), showAddressesOf: Array.isArray(spec.addressed) ? spec.addressed : undefined } });
      }
    }
  }
  const q = path.join(chapters, dir, "questions.json");
  if (fs.existsSync(q)) {
    const qs = JSON.parse(fs.readFileSync(q, "utf8"));
    for (const item of Array.isArray(qs) ? qs : qs.questions ?? []) {
      if (item.exhibit?.kind === "diagram" && item.exhibit.spec?.type === "topology") figures.push({ where: `${dir}/questions.json · ${item.id}`, spec: item.exhibit.spec, trace: item.exhibit.spec.trace, opts: {} });
    }
  }
}

let bad = 0;
for (const f of figures) {
  if (f.error) { bad++; console.log(`✗ ${f.where}: ${f.error}`); continue; }
  const fig = buildFigure(f.spec, f.trace, f.opts);
  const size = `${Math.round(fig.view.w)}×${Math.round(fig.view.h)}${fig.dur ? ` · ${fig.dur}s` : ""}`;
  if (fig.problems.length) {
    bad++;
    console.log(`✗ ${f.where} (${size})`);
    for (const p of [...new Set(fig.problems)]) console.log(`    ${p}`);
  } else if (verbose) console.log(`✓ ${f.where} (${size})`);
}
console.log(`\n${figures.length} figures, ${bad} with problems`);
process.exitCode = bad ? 1 : 0;
