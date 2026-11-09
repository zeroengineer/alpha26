import { describe, expect, it } from 'vitest';
import { STATIONS, blend, poseAt, smoothstep } from '@/components/Stage/stations';

describe('stage stations', () => {
  const stops = [
    { name: 'hero', at: 0 },
    { name: 'intro', at: 1000 },
    { name: 'about', at: 2000 },
  ];

  it('clamps before the first and after the last stop', () => {
    expect(poseAt(stops, -50)).toEqual(STATIONS.hero);
    expect(poseAt(stops, 9999)).toEqual(STATIONS.about);
  });

  it('blends between neighbouring stops with smoothstep', () => {
    const mid = poseAt(stops, 1500);
    expect(mid.alphaPos[0]).toBeCloseTo(blend(STATIONS.intro, STATIONS.about, 0.5).alphaPos[0]);
    expect(mid.alphaPos[0]).toBeGreaterThan(0);
    expect(mid.alphaPos[0]).toBeLessThan(STATIONS.about.alphaPos[0]);
  });

  it('hero is the poster view: crowd backdrop on, wireframe off, front-on camera', () => {
    const hero = poseAt(stops, 0);
    expect(hero.backdrop).toBe(1);
    expect(hero.wire).toBe(0);
    expect(hero.cam).toEqual([0, 0, 12]);
    expect(poseAt(stops, 2000).backdrop).toBe(0);
  });

  it('smoothstep is clamped and symmetric', () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(2)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
  });
});
