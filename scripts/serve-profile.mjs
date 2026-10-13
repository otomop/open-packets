// Local-only production preview with opt-in browser performance instrumentation.
// Usage: node scripts/serve-profile.mjs [build-directory] [port]
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

async function main() {
  const root = path.resolve(process.argv[2] || "dist");
  const port = Number(process.argv[3] || 4175);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Port must be an integer between 1 and 65535.");
  }
  const rootStat = await fs.stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) {
    throw new Error(`Build directory does not exist or is not a directory: ${root}`);
  }
  const indexStat = await fs.stat(path.join(root, "index.html")).catch(() => null);
  if (!indexStat?.isFile()) {
    throw new Error(`Build directory has no index.html. Build the app first: ${root}`);
  }
  const script = await fs.readFile(new URL("./profile-browser.js", import.meta.url), "utf8");

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/__profile.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end(script);
        return;
      }

      const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
      const file = path.resolve(root, "." + decodeURIComponent(pathname));
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }

      let body = await fs.readFile(file);
      const extension = path.extname(file);
      if (extension === ".html" && url.searchParams.has("audit")) {
        const instrumented = body.toString().replace(
          "<head>",
          '<head><script src="/__profile.js"></script>',
        );
        body = Buffer.from(instrumented);
      }
      res.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });

  server.on("error", error => {
    console.error(`Performance preview failed: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Performance preview: http://localhost:${port}/?audit=1 (build: ${root})`);
  });
}

main().catch(error => {
  console.error(`Performance preview failed: ${error.message}`);
  process.exitCode = 1;
});
