// Retake the README screenshots from a running copy of the app.
//
//   npm run dev                              (in another terminal)
//   npm run shots -- http://127.0.0.1:5173
//
// Drives a headless Chrome or Edge over the DevTools protocol, so it needs no extra packages.
// Set CHROME_PATH if the browser is not in one of the usual places.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = (process.argv[2] ?? "http://127.0.0.1:5173").replace(/\/+$/, "") + "/";
const WIDTH = 1440;
const HEIGHT = 900;

/** A first-run-complete learner, so the welcome dialog is not in the picture. */
const progress = {
  v: 1,
  settings: { track: "v2", examDate: "", hoursPerWeek: 6, theme: "dark", accentColor: "#3860f4", motion: "reduced", newCardsPerDay: 20, gateCards: false, name: "", onboarded: true, showTicker: false, navMode: "click", navCollapsed: false, toolsCollapsed: false },
  chapters: {}, questions: {}, attempts: [], cards: {}, drills: {}, tickets: {}, activity: {},
  subnet: { attempts: 0, correct: 0, byMode: {} },
  createdAt: new Date().toISOString(),
};

/** [file, route, vertical scroll in pixels] */
const SHOTS = [
  ["overview.jpg", "#/chapter/network-models", 0],
  ["lesson.jpg", "#/chapter/ipv6-addressing", 620],
  ["lab.jpg", "#/chapter/network-models/lab", 560],
  ["today.jpg", "#/", 0],
];

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((file) => file && existsSync(file));
  if (!found) throw new Error("No Chrome or Edge found. Set CHROME_PATH to the browser executable.");
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const profile = await mkdtemp(path.join(os.tmpdir(), "openpackets-shots-"));
  const browser = spawn(findBrowser(), ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, `--window-size=${WIDTH},${HEIGHT}`, "--hide-scrollbars", "--no-first-run", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let log = "";
      const timer = setTimeout(() => reject(new Error("The browser did not start in time.")), 20000);
      browser.stderr.on("data", (chunk) => {
        log += chunk;
        const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      browser.on("exit", () => { clearTimeout(timer); reject(new Error("The browser closed before it was ready.")); });
    });

    const socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error("Could not connect to the browser.")); });
    let nextId = 0;
    const waiting = new Map();
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const entry = waiting.get(message.id);
      if (!entry) return;
      waiting.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
    };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++nextId;
      waiting.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });

    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const page = (method, params) => send(method, params, sessionId);
    const run = (expression) => page("Runtime.evaluate", { expression, awaitPromise: true });

    await page("Page.enable");
    await page("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    await page("Page.navigate", { url: base });
    await sleep(1500);
    await run(`localStorage.setItem("ccna.progress.v1", ${JSON.stringify(JSON.stringify(progress))}); localStorage.setItem("ccna.theme", "dark"); localStorage.setItem("ccna.motion", "reduced");`);

    const out = path.join(root, "docs");
    await mkdir(out, { recursive: true });
    await page("Page.reload");
    await sleep(2000);
    for (const [file, route, scroll] of SHOTS) {
      await run(`location.hash = ${JSON.stringify(route)}`);
      await sleep(2500);
      await run(`document.fonts.ready.then(() => window.scrollTo(0, ${scroll}))`);
      await sleep(700);
      const { data } = await page("Page.captureScreenshot", { format: "jpeg", quality: 86 });
      await writeFile(path.join(out, file), Buffer.from(data, "base64"));
      console.log("wrote docs/" + file);
    }
    socket.close();
  } finally {
    browser.kill();
    await sleep(300);
    await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
