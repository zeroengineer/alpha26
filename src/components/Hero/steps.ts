/** Pure step logic for the hero sequence (unit-tested). */
export const LAST_STEP = 2;

/**
 * Given the current step and a gesture direction, returns the next step,
 * the same step (no-op at the top), or 'release' when scrolling past the last scene.
 */
export function nextStep(step: number, dir: 1 | -1): number | 'release' {
  if (dir > 0) return step >= LAST_STEP ? 'release' : step + 1;
  return Math.max(0, step - 1);
}
