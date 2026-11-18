/**
 * Single source of truth for event copy, links and launch flags.
 * Until launch every section flag below is false: the matching section and its nav link are not
 * rendered at all (only `dates` is on — the dates are public and shown in the hero). To launch a section, set its flag to true and fill in the
 * data under src/content/data/. Nothing else needs to change.
 */
/**
 * Build-time override for previews and tests: `ALPHA_FLAGS=all npm run build` (or a comma list such
 * as `speakers,host`) forces flags on without editing this file. Unset in production.
 */
const forced = String(import.meta.env.ALPHA_FLAGS ?? '')
  .split(',')
  .map((f) => f.trim())
  .filter(Boolean);
const on = (key: string, value: boolean) => value || forced.includes('all') || forced.includes(key);

export const features = {
  /** Event dates in the structured data (JSON-LD) and the schedule header. The hero always shows them. */
  dates: on('dates', true),
  /** "The Lineup" — speakers and sessions. */
  speakers: on('speakers', false),
  /** "The Venue" — host institution. */
  host: on('host', false),
  /** "Powered Together" — sponsors tiers. */
  sponsors: on('sponsors', false),
  /** Collaborators marquee inside the partners section. */
  collaborators: on('collaborators', false),
  /** Registration CTA in the hero and footer. */
  registration: on('registration', false),
} satisfies Record<string, boolean>;

export type FeatureKey = keyof typeof features;
export type Features = Record<FeatureKey, boolean>;

export const site = {
  name: "ALPHA '26",
  tagline: 'Built to Become',
  edition: '2026',
  organiser: 'IEEE Malabar Subsection',
  committee: 'Industry Relations Committee',
  shortOrganiser: 'IEEE MSS',
  url: 'https://alpha26.pages.dev',
  description:
    "ALPHA '26 is a two-day residential industry-readiness programme by the Industry Relations Committee of IEEE Malabar Subsection, built to help engineering graduates adapt, upskill and thrive in an AI-driven job market.",
  dates: { start: '2026-12-12', end: '2026-12-13', display: '12 – 13 December 2026' },
  registrationUrl: '#register',
  socials: {
    instagram: { handle: 'ieeemalabarsubsection', url: 'https://www.instagram.com/ieeemalabarsubsection/' },
  },
  about: {
    heading: 'The Programme',
    eyebrow: 'Built to Become',
    paragraphs: [
      "As Artificial Intelligence reshapes the professional landscape, traditional engineering roles are evolving, and new opportunities demand a different set of skills. ALPHA '26, organised by the Industry Relations Committee of IEEE Malabar Subsection, is a two-day residential industry-readiness programme designed to help engineering graduates adapt, upskill, and thrive in an AI-driven job market.",
      'The event aims to bridge the gap between academic learning and industry expectations through expert-led sessions, hands-on technical training, industry exposure, and direct interactions with professionals. Participants will explore emerging AI technologies, understand evolving job roles, develop industry-relevant skills, and gain insights into navigating the changing employment landscape.',
      "More than just a learning experience, ALPHA '26 is an opportunity to build professional connections, discover career pathways, and prepare to turn engineering potential into real-world opportunities.",
    ],
    closing: "The future of engineering is evolving. ALPHA '26 is where you prepare to become part of it.",
    /** The four things the programme is built from — lifted straight from the brief. */
    pillars: [
      { title: 'Expert-led sessions', text: 'Professionals who are hiring, building and leading in an AI-first industry.' },
      { title: 'Hands-on training', text: 'Technical workshops where you ship something, not just watch it being shipped.' },
      { title: 'Industry exposure', text: 'How roles are changing, what teams actually need, and where the openings are.' },
      { title: 'Direct interaction', text: 'Two residential days of conversations, mentoring and connections that outlast the event.' },
    ],
    facts: [
      { value: '02', label: 'Days' },
      { value: 'Residential', label: 'Format' },
      { value: 'Graduates', label: 'Built for' },
      { value: 'AI-first', label: 'Focus' },
    ],
  },
} as const;
