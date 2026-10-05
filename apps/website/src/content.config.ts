import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DOC_SECTIONS } from './lib/docs-sections';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(DOC_SECTIONS),
    order: z.number(),
    /** Shorter label for the sidebar and drawer. */
    short: z.string().optional(),
    /** `beta` marks pages that describe features that are still in beta. */
    status: z.enum(['stable', 'beta']).default('stable'),
    /** Troubleshooting layout: every h2 becomes a disclosure row (see src/lib/rehype). */
    symptoms: z.boolean().default(false),
  }),
});

const examples = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/examples' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    /** Outcome-led headline shown on the gallery card and the example page. */
    headline: z.string(),
    /** Gallery filter category (Responsiveness, Lifecycle, Concurrency, Memory, Runtime). */
    category: z.string(),
    /** Gallery thumbnail variant. */
    thumb: z.enum(['responsive', 'progress', 'pool', 'transfer', 'runtime']),
    /** The one-line learning outcome. */
    outcome: z.string(),
    /** What changes: the behaviours to try, in order. */
    points: z.array(z.string()),
    /** Source files shown in the workbench Code tab, relative to src/examples. */
    sources: z.array(z.object({ file: z.string(), title: z.string().optional() })),
    /** Documentation page that explains the pattern. */
    guide: z.string(),
    /** Documentation pages that explain the APIs this example uses. */
    related: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { docs, examples };
