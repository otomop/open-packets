import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadCourse } from "./scripts/load-course.mjs";
import { partitionCourse } from "./scripts/course-assets.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(root, "content");

/** Ship a catalog at boot; fetch each lesson and practice bank only when opened. */
function courseContent(): Plugin {
  const id = "virtual:course";
  const resolved = "\0" + id;
  let assets: Promise<ReturnType<typeof partitionCourse>> | undefined;
  const read = () => assets ??= loadCourse(contentDir).then(partitionCourse);
  return {
    name: "course-content",
    resolveId(source) {
      return source === id || source.startsWith(id + "/") ? "\0" + source : null;
    },
    async load(source) {
      if (!source.startsWith(resolved)) return null;
      const data = await read();
      const suffix = source.slice(resolved.length);
      if (!suffix) return `export default ${JSON.stringify(data.catalog)};`;
      if (suffix === "/loaders") return `export default {${Object.keys(data.details).map(key => `${JSON.stringify(key)}:()=>import(${JSON.stringify(id + "/chapter/" + key)}).then(m=>m.default)`).join(",")}};`;
      const [, category, key] = suffix.split("/");
      const value = category === "chapter" ? data.details[key] : category === "bank" ? data.banks[key] : undefined;
      if (value === undefined) throw new Error(`Unknown course asset: ${source}`);
      return `export default ${JSON.stringify(value)};`;
    },
    configureServer(server) {
      server.watcher.add(contentDir);
      const invalidate = (file: string) => {
        if (!path.resolve(file).startsWith(contentDir + path.sep)) return;
        assets = undefined;
        for (const [key, mod] of server.moduleGraph.idToModuleMap) {
          if (key.startsWith(resolved)) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("change", invalidate);
      server.watcher.on("add", invalidate);
      server.watcher.on("unlink", invalidate);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [courseContent(), react()],
  resolve: {
    alias: { "@": path.join(root, "src") },
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: {
    target: "es2022",
    manifest: true,
    sourcemap: false,
  },
});
