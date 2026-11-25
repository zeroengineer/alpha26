/** "The Team" section copy. Replace the placeholder lines once IEEE MSS sends the final text. */
export const organisers = {
  heading: 'The Team',
  eyebrow: 'Who builds ALPHA',
  org: {
    name: 'IEEE Malabar Subsection',
    short: 'IEEE MSS',
    description:
      'IEEE Malabar Subsection is the IEEE unit serving the Malabar region of Kerala, connecting student branches, professional members and industry across the region. [Placeholder — final copy from the subsection to follow.]',
    url: 'https://site.ieee.org/malabar/',
  },
  pastEventsHeading: 'Track Record',
  galleryHeading: 'In Frames',
} as const;

export const host = {
  heading: 'The Venue',
  eyebrow: 'Where it happens',
  name: 'KMCT Institute of Emerging Technology and Management',
  city: 'Manassery, Kozhikode',
  description:
    "ALPHA '26 runs on the KMCT Institute of Emerging Technology and Management campus in Manassery, Kozhikode. Talks, workshops, the overnight AI Venture Sprint and the industry meetup all take place here across both days.",
  address: 'Manassery, Thazhecode, Kerala 673582',
  mapEmbedUrl: 'https://www.google.com/maps?q=KMCT+Institute+of+Emerging+Technology+and+Management,+Manassery&output=embed',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=KMCT+Institute+of+Emerging+Technology+and+Management+Manassery',
  /** No campus photo yet — the map fills the media slot until one is added. */
  image: null as { src: string; alt: string } | null,
};
