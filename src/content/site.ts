/**
 * Single source of truth for event copy, links and launch flags.
 * While the event is "coming soon" every flag below is false: the matching section and its
 * nav link are not rendered at all. To launch a section, set its flag to true and fill in the
 * data under src/content/data/. Nothing else needs to change.
 */
export const features = {
  /** Show event dates in the hero / schedule. */
  dates: false,
  /** "The Lineup" — speakers and sessions. */
  speakers: false,
  /** "The Venue" — host institution. */
  host: false,
  /** "Powered Together" — sponsors tiers. */
  sponsors: false,
  /** Collaborators marquee inside the partners section. */
  collaborators: false,
  /** Registration CTA in the hero and footer. */
  registration: false,
} as const satisfies Record<string, boolean>;

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
  // Placeholders until the schedule is announced (hidden while features.dates is false).
  dates: { start: '2026-03-07', end: '2026-03-08', display: '07 – 08 March 2026' },
  registrationUrl: '#register',
  socials: {
    instagram: { handle: 'ieeemalabarsubsection', url: 'https://www.instagram.com/ieeemalabarsubsection/' },
    email: 'irc@ieeemalabar.org',
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
    stats: [
      { value: 2, suffix: '', label: 'Days, residential' },
      { value: 100, suffix: '%', label: 'Industry-led sessions' },
      { value: 1, suffix: '', label: 'AI-first curriculum' },
      { value: 0, suffix: '', label: 'Gap between campus and industry', isTagline: true },
    ],
  },
} as const;
