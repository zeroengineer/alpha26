import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sceneBus } from '@/lib/scene-bus';

describe('sceneBus', () => {
  beforeEach(() => sceneBus.reset());

  it('starts on the hero and replays the current state to new listeners', () => {
    const fn = vi.fn();
    sceneBus.on(fn);
    expect(fn).toHaveBeenCalledWith({ id: 'hero', progress: 0 });
  });

  it('notifies listeners on change, clamps progress, and ignores no-op updates', () => {
    const fn = vi.fn();
    sceneBus.on(fn);
    sceneBus.set('about', 1.7);
    sceneBus.set('about', 1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sceneBus.get()).toEqual({ id: 'about', progress: 1 });
  });

  it('unsubscribes', () => {
    const fn = vi.fn();
    const off = sceneBus.on(fn);
    off();
    sceneBus.set('contact');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
