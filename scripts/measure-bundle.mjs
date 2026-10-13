// Report the initial static import graph separately from lazy-loaded chunks.
// Usage: node scripts/measure-bundle.mjs [build-directory]
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

async function readManifest(directory) {
  const manifestPath = path.join(directory, ".vite", "manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read build manifest ${manifestPath}: ${error.message}`);
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error(`Build manifest must contain an object: ${manifestPath}`);
  }
  for (const [key, entry] of Object.entries(manifest)) {
    if (!entry || typeof entry !== "object" || typeof entry.file !== "string" || !entry.file) {
      throw new Error(`Manifest entry ${JSON.stringify(key)} has no valid output file.`);
    }
    for (const field of ["css", "imports"]) {
      if (entry[field] !== undefined && (!Array.isArray(entry[field]) || entry[field].some(value => typeof value !== "string"))) {
        throw new Error(`Manifest entry ${JSON.stringify(key)} has an invalid ${field} list.`);
      }
    }
  }
  return manifest;
}

async function main() {
  const directory = path.resolve(process.argv[2] || "dist");
  const manifest = await readManifest(directory);
  const visited = new Set();
  const files = new Set();

  function walk(key) {
    if (visited.has(key)) return;
    const entry = manifest[key];
    if (!entry) throw new Error(`Manifest import has no matching entry: ${JSON.stringify(key)}`);
    visited.add(key);
    files.add(entry.file);
    for (const css of entry.css || []) files.add(css);
    for (const imported of entry.imports || []) walk(imported);
  }

  const entries = Object.entries(manifest).filter(([, entry]) => entry.isEntry);
  if (!entries.length) throw new Error("Build manifest has no application entry point.");
  for (const [key] of entries) walk(key);

  const initial = [];
  for (const file of files) {
    const filename = path.resolve(directory, file);
    if (!filename.startsWith(directory + path.sep)) {
      throw new Error(`Manifest output is outside the build directory: ${file}`);
    }
    const bytes = await fs.readFile(filename);
    initial.push({ file, bytes: bytes.length, gzip: gzipSync(bytes).length });
  }
  const scripts = initial.filter(file => file.file.endsWith(".js"));
  const result = {
    initial,
    jsBytes: scripts.reduce((total, file) => total + file.bytes, 0),
    jsGzip: scripts.reduce((total, file) => total + file.gzip, 0),
    lazyChunks: Object.values(manifest).filter(entry => entry.isDynamicEntry).length,
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(`Bundle measurement failed: ${error.message}`);
  process.exitCode = 1;
});
