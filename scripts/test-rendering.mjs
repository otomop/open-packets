import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadCourse } from "./load-course.mjs";
import { runtime } from "./tests/runtime.mjs";

// Exercise the browser's actual parser without adding a second runtime or test dependency.
const require = createRequire(import.meta.url);
const source = await fs.readFile(new URL("../src/lib/markdown.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const parser = {};
vm.runInNewContext(compiled, { exports: parser, require });

const Diagram = runtime({
  react: require("react"),
  "react/jsx-runtime": require("react/jsx-runtime"),
  "@/lib/store": { prefersReducedMotion: () => false },
}).load("src/components/Diagram.tsx").default;

const topology = {
  type: "topology", title: "Branch network",
  nodes: [
    { id: "r", kind: "router", label: "R1", sub: "10.0.0.1", x: 1, y: 1 },
    { id: "s", kind: "switch", label: "SW1", x: 4, y: 1 },
  ],
  links: [{ from: "r", to: "s", label: "VLAN 10", fromLabel: "Gi0/0", toLabel: "Gi0/1", toBadge: "RP" }],
  zones: [{ label: "Branch LAN", nodes: ["r", "s"] }],
  packet: { path: ["s", "r"], label: "ARP reply" },
};

test("topology descriptions include names, connections, interface labels and packet direction", () => {
  const html = renderToStaticMarkup(createElement(Diagram, { spec: topology }));
  const description = html.match(/<desc id="[^"]+">([^<]*)<\/desc>/)?.[1];
  assert.ok(description);
  assert.ok(description.includes("Devices: R1 (10.0.0.1); SW1."));
  assert.ok(description.includes("R1 (Gi0/0) connects to SW1 (Gi0/1, RP): VLAN 10."));
  assert.ok(description.includes("Branch LAN: R1, SW1."));
  assert.ok(description.includes("Packet path (ARP reply): SW1 to R1."));
  assert.equal((html.match(/aria-describedby=/g) ?? []).length, 1, "only the complete diagram is described");
});

test("sequence descriptions preserve message order and safely escape authored labels", () => {
  const spec = {
    type: "sequence", actors: ["Client <A>", "DNS & cache"],
    steps: [
      { from: 0, to: 1, label: "Query <script>alert(1)</script>", note: "A & AAAA" },
      { from: 1, to: 0, label: "Response" },
    ],
  };
  const html = renderToStaticMarkup(createElement(Diagram, { spec }));
  const description = html.match(/<desc id="[^"]+">([^<]*)<\/desc>/)?.[1];
  assert.ok(description);
  assert.ok(description.includes("Participants: Client &lt;A&gt;; DNS &amp; cache."));
  assert.ok(description.includes("1. Client &lt;A&gt; to DNS &amp; cache: Query &lt;script&gt;alert(1)&lt;/script&gt; (A &amp; AAAA)."));
  assert.ok(description.includes("2. DNS &amp; cache to Client &lt;A&gt;: Response."));
  assert.ok(description.indexOf("1.") < description.indexOf("2."));
  assert.ok(!html.includes("<script>"));
});

test("repeated diagram instances have unique, correctly linked description IDs", () => {
  const html = renderToStaticMarkup(createElement(Fragment, null,
    createElement(Diagram, { spec: topology }),
    createElement(Diagram, { spec: topology }),
    createElement(Diagram, { spec: { type: "sequence", actors: ["A", "B"], steps: [{ from: 0, to: 1, label: "Hello" }] } }),
  ));
  const ids = [...html.matchAll(/<desc id="([^"]+)"/g)].map((m) => m[1]);
  const references = [...html.matchAll(/<svg\b[^>]*aria-describedby="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 3);
  assert.deepEqual(references, ids);
});

test("IOS copy removes the same teaching annotations that the renderer hides", () => {
  const text = [
    "<!-- author-only note -->",
    ">> R1(config)# aaa new-model  ← switches to method lists",
    "R1(config-sg-tacacs+)# server name ISE1   <- named server",
    "R1(config)# interface GigabitEthernet0/0",
    " description uplink",
    "! Preserve a valid IOS comment",
    "R1(config-if)# no shutdown",
  ].join("\r\n");
  assert.equal(parser.cliCopyText(text), [
    "", "aaa new-model", "server name ISE1", "interface GigabitEthernet0/0",
    " description uplink", "! Preserve a valid IOS comment", "no shutdown",
  ].join("\n"));
  const lines = parser.cliLines(text, "ios");
  assert.equal(lines[1].highlight, true);
  assert.equal(lines[1].note, "switches to method lists");
  assert.ok(lines[1].html.includes("aaa new-model"));
  assert.ok(!lines[1].html.includes("switches to method lists"));
  assert.equal(lines[2].kind, "prompt");
});

test("copy preserves literal arrows that are not author annotation syntax", () => {
  assert.equal(parser.cliCopyText("R1(config)# banner motd ^Use A <- B^"), "banner motd ^Use A <- B^");
  assert.equal(parser.cliCopyText("R1# show interfaces | include <up>"), "show interfaces | include <up>");
});

test("CLI display escapes text while keeping annotations as plain data", () => {
  const [line] = parser.cliLines('R1# show <tag> & value  ← <note>', "ios");
  assert.ok(line.html.includes("&lt;tag&gt; &amp; value"));
  assert.ok(!line.html.includes("<tag>"));
  assert.equal(line.note, "<note>");
});

test("independent solutions start closed while guided observations remain visible", () => {
  const Markdown = runtime({
    react: require("react"),
    "react/jsx-runtime": require("react/jsx-runtime"),
    marked: require("marked"),
    "@/lib/store": { prefersReducedMotion: () => false },
  }).load("src/components/Markdown.tsx").default;
  const text = [
    "Calculate your answer first.",
    ":::expected", "The link should be up/up.", ":::",
    ":::solution", "| Network | Mask |", "|---|---|", "| 10.0.0.0 | /24 |",
    "```ios R1", "R1# show <interfaces>", "```", ":::",
    ":::solution Compare <your> plan", "Use the supplied requirements.", ":::",
  ].join("\n");
  const html = renderToStaticMarkup(createElement(Markdown, {text}));
  assert.match(html, /<aside class="callout callout-expected">[\s\S]*The link should be up\/up\./);
  const details = [...html.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)];
  assert.equal(details.length, 2);
  assert.ok(details.every(match => !/\bopen\b/.test(match[1])), "solutions must not reveal themselves on first render");
  assert.match(details[0][2], /<summary class="callout-label">Check your answer<\/summary>/);
  assert.ok(details[0][2].includes("<table>") && details[0][2].includes("show &lt;interfaces&gt;"), "worked answers retain real table and command rendering");
  assert.match(details[1][2], /Compare &lt;your&gt; plan/);
});

async function fixture(t) {
  const tempRoot = path.resolve(os.tmpdir());
  const dir = await fs.mkdtemp(path.join(tempRoot, "ccna-rendering-test-"));
  t.after(async () => {
    // Only the exact temporary child created above is eligible for recursive cleanup.
    assert.equal(path.dirname(path.resolve(dir)), tempRoot);
    assert.ok(path.basename(dir).startsWith("ccna-rendering-test-"));
    await fs.rm(dir, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(dir, "chapters", "00-fixture"), { recursive: true });
  await fs.writeFile(path.join(dir, "course.json"), "{}");
  await fs.writeFile(path.join(dir, "blueprint.json"), "{}");
  await fs.writeFile(path.join(dir, "chapters", "00-fixture", "chapter.md"), "---\ntitle: Fixture\n---\n## Lesson\nFixture text.");
  return dir;
}

test("a genuinely absent optional lab still loads normally", async (t) => {
  const dir = await fixture(t);
  const course = await loadCourse(dir);
  assert.equal(course.chapters.length, 1);
  assert.equal(course.chapters[0].lab, null);
});

test("malformed lab metadata fails with its file path instead of silently losing the lab", async (t) => {
  const dir = await fixture(t);
  await fs.writeFile(path.join(dir, "chapters", "00-fixture", "lab.md"), "---\ntitle: broken: value\n---\n## Step 1: Test\nWork.");
  await assert.rejects(loadCourse(dir), /00-fixture\/lab\.md: frontmatter YAML/);
});

test("a lab read error other than absence fails with its file path", async (t) => {
  const dir = await fixture(t);
  await fs.mkdir(path.join(dir, "chapters", "00-fixture", "lab.md"));
  await assert.rejects(loadCourse(dir), /00-fixture\/lab\.md:/);
});

test("a chapter read error other than absence is not silently skipped", async (t) => {
  const dir = await fixture(t);
  const chapterFile = path.join(dir, "chapters", "00-fixture", "chapter.md");
  await fs.unlink(chapterFile);
  await fs.mkdir(chapterFile);
  await assert.rejects(loadCourse(dir), /00-fixture\/chapter\.md:/);
});
