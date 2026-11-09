import { describe, expect, it } from 'vitest';
import { nextStep, LAST_STEP } from '@/components/Hero/steps';

describe('hero steps', () => {
  it('advances forward one scene at a time', () => {
    expect(nextStep(0, 1)).toBe(1);
    expect(nextStep(1, 1)).toBe(2);
  });
  it('releases scrolling only after the last scene', () => {
    expect(nextStep(LAST_STEP, 1)).toBe('release');
  });
  it('steps back and clamps at the first scene', () => {
    expect(nextStep(2, -1)).toBe(1);
    expect(nextStep(0, -1)).toBe(0);
  });
});
