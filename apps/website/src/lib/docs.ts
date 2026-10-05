import { getCollection, type CollectionEntry } from 'astro:content';

import { DOC_SECTIONS, type DocSection } from './docs-sections';

export { DOC_SECTIONS, type DocSection };
export type DocEntry = CollectionEntry<'docs'>;

export interface NavSection {
  title: DocSection;
  pages: DocEntry[];
}

/** Sections in reading order; sections without pages are omitted, so the sidebar never links to nothing. */
export async function getDocsNav(): Promise<{ sections: NavSection[]; flat: DocEntry[] }> {
  const entries = await getCollection('docs');

  const sections = DOC_SECTIONS.map((title) => ({
    title,
    pages: entries
      .filter((entry) => entry.data.section === title)
      .sort((a, b) => a.data.order - b.data.order),
  })).filter((section) => section.pages.length > 0);

  return { sections, flat: sections.flatMap((section) => section.pages) };
}

/** The badge shown in the article meta row. */
export function docKind(entry: DocEntry): 'Guide' | 'API reference' | 'Problem solving' {
  if (entry.data.section === 'API reference') return 'API reference';
  if (entry.data.symptoms) return 'Problem solving';
  return 'Guide';
}
