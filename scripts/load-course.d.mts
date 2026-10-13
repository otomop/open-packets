export function loadCourse(contentDir: string): Promise<any>;
export function parseFrontmatter(text: string): { meta: any; body: string };
export function slugify(s: string): string;
export function splitSections(body: string, sectionIds?: Record<string, string>): { id: string; title: string; body: string }[];
export function parseLab(body: string): any;
