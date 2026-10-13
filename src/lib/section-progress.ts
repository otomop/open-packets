type Section = { id: string; title: string };

export function isCheckableSection(section: Section) {
  return section.id !== "intro" && !/^exam focus/i.test(section.title);
}

/** Count current items without changing historical completion records in storage. */
export function itemProgress(items: readonly { id: string }[], completed: readonly string[] = []) {
  const current = new Set(items.map(item => item.id));
  const done = new Set(completed.filter(id => current.has(id)));
  return { done: done.size, total: current.size };
}

export function sectionProgress(sections: readonly Section[], completed: readonly string[] = []) {
  return itemProgress(sections.filter(isCheckableSection), completed);
}
