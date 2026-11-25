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
  host: on('host', true),
  /** "Powered Together" — sponsors tiers. */
  sponsors: on('sponsors', false),
  /** Collaborators marquee inside the partners section. */
  collaborators: on('collaborators', false),
  /** Registration CTA in the hero and footer. */
  registration: on('registration', true),
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
  theme: 'Careers and Ventures in the Age of AI',
  description:
    "ALPHA '26 is a two-day residential programme by the Industry Relations Committee of IEEE Malabar Subsection, preparing engineering students for careers and ventures in a job market that AI is reshaping.",
  dates: { start: '2026-12-12', end: '2026-12-13', display: '12 – 13 December 2026' },
  /** Snaptiqz permanent event link (never changes, unlike the custom-handle link). */
  registrationUrl: 'https://discover.snaptiqz.com/event/V6XxPRDV7w0rbfWiMa3rF',
  socials: {
    instagram: { handle: 'ieeemalabarsubsection', url: 'https://www.instagram.com/ieeemalabarsubsection/' },
    linkedin: { handle: 'IEEE MSS', url: 'https://www.linkedin.com/company/ieee-mss/' },
  },
  about: {
    heading: 'The Programme',
    eyebrow: 'Careers and Ventures in the Age of AI',
    paragraphs: [
      'The question is no longer whether AI will change engineering careers, but how quickly students can adapt. The routine work through which freshers once entered industry, such as coding, testing, documentation and data analysis, is increasingly handled with AI, and employers expect graduates to use these tools confidently from the start.',
      "ALPHA '26 responds on three fronts: showing budding entrepreneurs how to build ventures with AI, training students for job roles that have evolved with AI, and guiding them towards careers that stay relevant as AI advances. Industry-led talks, hands-on workshops and an overnight build sprint bring 100 pre-final and final-year students from all engineering branches together with the people who hire, build and lead.",
      'Every participant leaves with more than a certificate: an AI-powered project and venture pitch built on a real industry problem, a personal career map, and a network of professionals, founders and peers from other branches and colleges.',
    ],
    closing: "Don't just pursue opportunities. Create them.",
    /** The five chapters of the programme, from the event plan (three tracks, the sprint, the meetup). */
    pillars: [
      { title: 'Entrepreneurship with AI', text: 'Founders show how to use AI to identify problems, validate ideas, build prototypes and run lean ventures with small teams.' },
      { title: 'Job roles evolved with AI', text: 'Industry professionals explain how roles work today; practitioner-led workshops train you in the AI skills those roles demand.' },
      { title: 'Careers that stay relevant', text: 'Core and field engineering, hardware, power, infrastructure and manufacturing: what employers look for and how to prepare.' },
      { title: 'AI Venture Sprint', text: 'An overnight sprint. Cross-branch teams build a working prototype on a real industry problem, mentored through the night, and pitch it to an industry jury.' },
      { title: 'Industry meetup & networking', text: 'A meetup with professionals and founders, a dedicated session with young professionals, and a career mapping session to set your target role and next steps.' },
    ],
    facts: [
      { value: '02', label: 'Days' },
      { value: 'Residential', label: 'Format' },
      { value: '100', label: 'Students' },
      { value: '03', label: 'Tracks' },
    ],
  },
} as const;
