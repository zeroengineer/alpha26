import type { Features } from '@/content/site';

export interface NavItem {
  id: string;
  label: string;
  /** Which flag gates this item; undefined = always visible. */
  flag?: keyof Features;
}

/** Canonical section order of the single page. Nav labels stay plain; headings are set per section. */
export const SECTIONS: readonly NavItem[] = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'speakers', label: 'Speakers', flag: 'speakers' },
  { id: 'venue', label: 'Venue', flag: 'host' },
  { id: 'partners', label: 'Partners', flag: 'sponsors' },
  { id: 'organisers', label: 'Organisers' },
  { id: 'contact', label: 'Contact' },
] as const;

/** Returns nav items whose gating flag is on (or that have no flag). */
export function buildNav(features: Features, sections: readonly NavItem[] = SECTIONS): NavItem[] {
  return sections.filter((s) => !s.flag || features[s.flag]);
}

/** Zero-padded section number for the "01 ——" labels, counted only over visible sections. */
export function sectionNumber(id: string, features: Features): string {
  const visible = buildNav(features).filter((s) => s.id !== 'hero');
  const index = visible.findIndex((s) => s.id === id);
  return index < 0 ? '00' : String(index + 1).padStart(2, '0');
}
