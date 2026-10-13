/** Partition without changing authored content or progress identifiers. */
export function partitionCourse(course) {
  const details = {};
  const banks = { questions: [], cards: [], commands: [], tickets: [] };
  const objectiveDomains = Object.fromEntries(['v1', 'v2'].map(track => [track, new Map(course.blueprint[track].map(o => [o.id, o.domain]))]));
  const domainFor = (q, track, c) => {
    const tag = q.objectives.find(o => o.startsWith(track + ':'));
    if (tag) return objectiveDomains[track].get(tag.slice(3)) ?? 'none';
    return track === 'v2' ? c.domain : objectiveDomains.v1.get(c.objectives.v1[0]) ?? 'none';
  };
  const chapters = course.chapters.map(c => {
    details[c.id] = { sections: c.sections, lab: c.lab };
    const labels = { chapterId: c.id, chapterTitle: c.title };
    banks.questions.push(...c.questions.map(q => ({ ...q, ...labels, chapterNumber: c.number, domainV1: domainFor(q, 'v1', c), domainV2: domainFor(q, 'v2', c) })));
    banks.cards.push(...c.cards.map(k => ({ ...k, ...labels, chapterNumber: c.number, domain: c.domain })));
    banks.commands.push(...c.commands.map(d => ({ ...d, ...labels })));
    banks.tickets.push(...c.tickets.map(t => ({ ...t, ...labels })));
    return {
      ...c,
      sections: c.sections.map(({ id, title }) => ({ id, title })),
      lab: c.lab ? { title: c.lab.title, environment: c.lab.environment, devices: c.lab.devices, minutes: c.lab.minutes, steps: c.lab.steps.map(({ id, n, title }) => ({ id, n, title })) } : null,
      questions: c.questions.map(({ id, objectives }) => ({ id, objectives })),
      cards: c.cards.map(({ id }) => ({ id })),
      commands: c.commands.map(({ id, answer, mode }) => ({ id, answer, mode })),
      tickets: c.tickets.map(({ id }) => ({ id })),
    };
  });
  return { catalog: { ...course, chapters }, details, banks };
}
