import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per event in src/content/events/. The events page lists
// them newest first; add a file and it shows up on the next deploy.
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    role: z.string(),
    tags: z.array(z.string()).default([]),
    link: z.url().optional(),
  }),
});

export const collections = { events };
