import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const image = z.object({ src: z.string(), alt: z.string(), credit: z.string().optional() });

const speakers = defineCollection({
  loader: file('src/content/data/speakers.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    org: z.string(),
    photo: image,
    links: z.object({ linkedin: z.string().url().optional(), x: z.string().url().optional() }).optional(),
  }),
});

const sessions = defineCollection({
  loader: file('src/content/data/sessions.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(['keynote', 'workshop', 'panel', 'talk', 'networking']),
    day: z.number().int().min(1).max(2),
    time: z.string(),
    speakerIds: z.array(z.string()),
    summary: z.string(),
  }),
});

const sponsors = defineCollection({
  loader: file('src/content/data/sponsors.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    tier: z.enum(['title', 'gold', 'silver', 'community']),
    logo: image,
    url: z.string().url().optional(),
  }),
});

const collaborators = defineCollection({
  loader: file('src/content/data/collaborators.json'),
  schema: z.object({ id: z.string(), name: z.string(), logo: image, url: z.string().url().optional() }),
});

/** In Frames: each photo carries the basic details of the event it comes from. */
const gallery = defineCollection({
  loader: file('src/content/data/gallery.json'),
  schema: z.object({
    id: z.string(),
    image,
    event: z.string(),
    year: z.string(),
    detail: z.string(),
    span: z.enum(['1', '2']).default('1'),
  }),
});

export const collections = { speakers, sessions, sponsors, collaborators, gallery };
