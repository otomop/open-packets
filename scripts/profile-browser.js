/* Opt-in diagnostics. Served only by scripts/serve-profile.mjs; never in the app build. */
(() => {
  const SAMPLE_DURATION_MS = 6000;
  const tasks = [];
  const shifts = [];
  const events = [];
  const observations = [["longtask", tasks], ["layout-shift", shifts], ["event", events]];

  for (const [type, target] of observations) {
    try {
      const observer = new PerformanceObserver(list => target.push(...list.getEntries()));
      observer.observe({ type, buffered: true, durationThreshold: 16 });
    } catch {
      // Individual performance entry types are not supported by every browser.
    }
  }

  const round = value => Math.round(value * 10) / 10;
  const maxDuration = entries => entries.reduce((max, entry) => Math.max(max, entry.duration), 0);

  addEventListener("DOMContentLoaded", () => {
    const box = document.createElement("aside");
    box.setAttribute("aria-label", "Performance audit");
    box.style.cssText = "position:fixed;bottom:8px;right:8px;z-index:100000;background:#111;color:#fff;border:1px solid #777;padding:10px;max-width:390px;font:12px monospace;max-height:45vh;overflow:auto;";

    const output = document.createElement("pre");
    output.id = "performance-results";
    output.style.cssText = "white-space:pre-wrap;font:11px monospace;margin:8px 0 0";

    function summarize(extra = {}) {
      const resources = performance.getEntriesByType("resource");
      const scripts = resources.filter(resource => /\.js($|\?)/.test(resource.name) && !resource.name.includes("__profile"));
      const result = {
        route: location.hash,
        domNodes: document.querySelectorAll("#root *").length,
        viewport: [innerWidth, innerHeight],
        pageHeight: document.documentElement.scrollHeight,
        paint: performance.getEntriesByType("paint").map(entry => ({ name: entry.name, ms: Math.round(entry.startTime) })),
        jsBytes: scripts.reduce((total, resource) => total + resource.decodedBodySize, 0),
        longTasks: tasks.length,
        longTaskMs: Math.round(tasks.reduce((total, task) => total + task.duration, 0)),
        maxTaskMs: Math.round(maxDuration(tasks)),
        eventMaxMs: maxDuration(events),
        ...extra,
      };
      output.textContent = JSON.stringify(result, null, 2);
    }

    const snapshot = document.createElement("button");
    snapshot.textContent = "Snapshot metrics";
    snapshot.onclick = () => summarize();

    const scroll = document.createElement("button");
    scroll.textContent = "Run scroll sample";
    scroll.style.marginLeft = "8px";
    scroll.onclick = () => {
      scroll.disabled = true;
      snapshot.disabled = true;
      window.scrollTo({ top: 0, behavior: "instant" });
      // Let the initial scroll and sticky chrome settle before starting the sample.
      requestAnimationFrame(() => requestAnimationFrame(runSample));
    };

    function runSample() {
      const start = performance.now();
      const gaps = [];
      const taskStart = tasks.length;
      const shiftStart = shifts.length;
      const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      let previous = start;
      let frames = 0;
      let maxError = 0;

      function tick(now) {
        const elapsed = now - start;
        if (frames++) gaps.push(now - previous);
        previous = now;

        const requested = Math.round(maxY * Math.min(1, elapsed / SAMPLE_DURATION_MS));
        window.scrollTo({ top: requested, behavior: "instant" });
        maxError = Math.max(maxError, Math.abs(window.scrollY - requested));
        if (elapsed < SAMPLE_DURATION_MS) {
          requestAnimationFrame(tick);
          return;
        }

        const sorted = gaps.slice().sort((a, b) => a - b);
        summarize({
          scroll: {
            durationMs: round(elapsed),
            frames: gaps.length,
            p50FrameMs: round(sorted[Math.floor(sorted.length * 0.5)] || 0),
            p95FrameMs: round(sorted[Math.floor(sorted.length * 0.95)] || 0),
            maxFrameMs: round(gaps.reduce((max, gap) => Math.max(max, gap), 0)),
            framesOver50ms: gaps.filter(gap => gap > 50).length,
            longTasks: tasks.length - taskStart,
            layoutShifts: shifts.slice(shiftStart).filter(entry => !entry.hadRecentInput).length,
            maxScrollErrorPx: Math.round(maxError),
          },
        });
        scroll.disabled = false;
        snapshot.disabled = false;
      }

      requestAnimationFrame(tick);
    }

    box.append(snapshot, scroll, output);
    document.body.append(box);
  });
})();
