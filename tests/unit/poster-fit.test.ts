import { describe, expect, it } from 'vitest';
import { POSTER, fitFov, parsePath, posterHeightPx, slatLayout } from '@/components/Stage/poster-fit';
import { ALPHA_PATH } from '@/assets/alpha/alpha-path';

describe('poster fit', () => {
  it('mirrors the hero CSS poster box', () => {
    expect(posterHeightPx(1440, 900)).toBeCloseTo(1035);
    expect(posterHeightPx(390, 844)).toBe(844);
    expect(posterHeightPx(800, 900)).toBeCloseTo(1066.67, 1); // portrait-ish tablet: width-cover wins
  });

  it('fov makes the α take the poster share of the viewport', () => {
    const fov = fitFov(1440, 900, 3.1, 7.2);
    const visible = 2 * 7.2 * Math.tan(((fov / 2) * Math.PI) / 180);
    expect(3.1 / visible).toBeCloseTo((POSTER.alphaH * 1035) / 900, 3);
  });

  it('lays out six evenly stepped slats around the α', () => {
    const s = slatLayout(3.1);
    expect(s).toHaveLength(6);
    expect(s[1].x - s[0].x).toBeCloseTo(s[5].x - s[4].x);
    expect(s[0].x).toBeLessThan(0);
    expect(s[5].x).toBeGreaterThan(0);
  });

  it('parses the glyph path into absolute commands', () => {
    const cmds = parsePath(ALPHA_PATH);
    expect(cmds[0].c).toBe('M');
    expect(cmds.some((c) => c.c === 'Q')).toBe(true);
    expect(cmds.every((c) => 'MLHVQCZ'.includes(c.c))).toBe(true);
  });
});
