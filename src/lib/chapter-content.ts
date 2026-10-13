import loaders from "virtual:course/loaders";
import type { ChapterContent } from "./types";

const pending = new Map<string, Promise<ChapterContent>>();

/** Stable promises let React suspend without repeatedly requesting the same lesson. */
export function loadChapterContent(id: string): Promise<ChapterContent> {
  let promise = pending.get(id);
  if (!promise) {
    const load = loaders[id];
    if (!load) return Promise.reject(new Error("This chapter is not in the course."));
    promise = load().catch(error => { pending.delete(id); throw error; });
    pending.set(id, promise);
  }
  return promise;
}
