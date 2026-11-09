/** "The Team" section copy. Replace the placeholder lines once IEEE MSS sends the final text. */
export const organisers = {
  heading: 'The Team',
  eyebrow: 'Who builds ALPHA',
  org: {
    name: 'IEEE Malabar Subsection',
    short: 'IEEE MSS',
    description:
      'IEEE Malabar Subsection is the IEEE unit serving the Malabar region of Kerala, connecting student branches, professional members and industry across the region. [Placeholder — final copy from the subsection to follow.]',
    url: 'https://ieeemalabar.org',
  },
  committee: {
    name: 'Industry Relations Committee',
    description:
      'The Industry Relations Committee builds the bridge between IEEE members and the companies that hire them — through industry visits, mentoring, readiness programmes and events like ALPHA. [Placeholder — final copy to follow.]',
    /** What the committee does — three lines under the description. */
    focus: ['Industry visits and exposure', 'Mentoring and readiness programmes', 'Placement-oriented events like ALPHA'],
  },
  galleryHeading: 'In Frames',
  galleryLede: 'Moments from the events the committee has run so far — each frame with the basics of where it was taken.',
} as const;

export const host = {
  heading: 'The Venue',
  eyebrow: 'Where it happens',
  name: 'Host Institution',
  city: 'Malabar, Kerala',
  description: 'Placeholder description of the host institution and campus facilities for the two-day residential programme.',
  mapEmbedUrl: '',
  image: { src: 'pexels-1709003.jpg', alt: 'Campus building placeholder' },
} as const;
