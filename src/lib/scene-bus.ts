/**
 * Tiny pub/sub that tells the background which scene (section) is active and how far through it
 * the visitor is. Sections publish; the WebGL background subscribes and moves its camera.
 */
export interface SceneState {
  id: string;
  /** 0..1 progress through the active scene */
  progress: number;
}

type Listener = (state: SceneState) => void;

const listeners = new Set<Listener>();
let current: SceneState = { id: 'hero', progress: 0 };

export const sceneBus = {
  get(): SceneState {
    return current;
  },
  set(id: string, progress = 0): void {
    const p = Math.max(0, Math.min(1, progress));
    if (id === current.id && Math.abs(p - current.progress) < 0.001) return;
    current = { id, progress: p };
    listeners.forEach((fn) => fn(current));
  },
  on(fn: Listener): () => void {
    listeners.add(fn);
    fn(current);
    return () => listeners.delete(fn);
  },
  /** Test helper. */
  reset(): void {
    listeners.clear();
    current = { id: 'hero', progress: 0 };
  },
};
