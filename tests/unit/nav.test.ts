import { describe, expect, it } from 'vitest';
import { buildNav, SECTIONS, sectionNumber } from '@/lib/nav';
import { features, type Features } from '@/content/site';

const allOn: Features = { dates: true, speakers: true, host: true, sponsors: true, collaborators: true, registration: true };

describe('launch flags', () => {
  it('ship with only the dates, venue and registration public', () => {
    if (import.meta.env.ALPHA_FLAGS) return; // build-time override in use
    expect(features).toEqual({ dates: true, speakers: false, host: true, sponsors: false, collaborators: false, registration: true });
  });
});

describe('buildNav', () => {
  it('hides gated sections when their flag is off', () => {
    const ids = buildNav(features).map((s) => s.id);
    expect(ids).toEqual(['hero', 'about', 'venue', 'organisers', 'contact']);
  });

  it('shows every section when all flags are on, in canonical order', () => {
    expect(buildNav(allOn).map((s) => s.id)).toEqual(SECTIONS.map((s) => s.id));
  });
});

describe('sectionNumber', () => {
  it('numbers only visible sections, skipping the hero', () => {
    expect(sectionNumber('about', features)).toBe('01');
    expect(sectionNumber('venue', features)).toBe('02');
    expect(sectionNumber('organisers', features)).toBe('03');
    expect(sectionNumber('organisers', allOn)).toBe('05');
  });

  it('returns 00 for a hidden or unknown section', () => {
    expect(sectionNumber('speakers', features)).toBe('00');
  });
});
