/**
 * Camera "stations" for the α stage (doyourdesign studio-tour pattern): each content block marked
 * `data-station="<name>"` is a stop; while the visitor scrolls between two stops the stage
 * interpolates between their poses. Pure data + maths so it can be unit-tested.
 */
export type Vec3 = [number, number, number];

export interface Pose {
  cam: Vec3;
  target: Vec3;
  /** α group transform */
  alphaPos: Vec3;
  alphaRotY: number;
  /** 0..1 layer opacities */
  stage: number;
  chrome: number;
  wire: number;
  crowd: number;
  /** 1 = the long "poster" lens, 0 = the tour lens (blended → dolly-zoom) */
  lens: number;
}

const base: Pose = {
  cam: [0, 0, 7.2], target: [0, 0, 0], alphaPos: [0, 0, 0], alphaRotY: 0,
  stage: 1, chrome: 1, wire: 0.25, crowd: 1, lens: 0,
};
const pose = (p: Partial<Pose>): Pose => ({ ...base, ...p });

export const STATIONS: Record<string, Pose> = {
  // the poster, rendered live: front-on α exactly where the Figma poster has it
  // (camera further back with a long lens → nearly flat like the poster; see the dolly-zoom in island.ts)
  hero: pose({ cam: [0, 0, 12], wire: 0, crowd: 0, lens: 1 }),
  // first scroll: the camera eases in (dolly-zoom) and points begin to swirl in the bowl
  intro: pose({ cam: [0.15, 0.1, 7.6], wire: 0.1, crowd: 0.8 }),
  // programme copy on the left: α steps right and turns to show its depth
  about: pose({ cam: [0.6, 0.6, 6.6], target: [1.4, 0, 0], alphaPos: [2.8, 0, 0], alphaRotY: -0.62, chrome: 0.85, wire: 0.45 }),
  // pillars: low camera, blueprint mode (wireframe up, chrome down) — the "drawing board"
  pillars: pose({ cam: [-3.6, -1.4, 4.8], target: [0, 0.4, 0], alphaRotY: 0.55, chrome: 0.18, wire: 1 }),
  // statement: fly through the bowl of the α
  statement: pose({ cam: [-0.35, 0.05, 0.9], target: [-0.35, 0.05, -6], chrome: 0.9, wire: 0.6, crowd: 1 }),
  speakers: pose({ cam: [-2.2, 0.8, 6.2], target: [-1, 0, 0], alphaPos: [-2.2, 0, 0], alphaRotY: 0.7, wire: 0.5 }),
  venue: pose({ cam: [0, 4.6, 5.2], target: [0, -0.4, 0], alphaRotY: -0.3, chrome: 0.5, wire: 0.8 }),
  partners: pose({ cam: [2.8, -0.6, 6], target: [0.6, 0, 0], alphaPos: [1.8, 0, 0], alphaRotY: -1.1, wire: 0.5 }),
  // team: seen from behind, off to the left
  team: pose({ cam: [1.6, 0.9, -6.4], target: [-0.8, 0, 0], alphaPos: [-1.4, 0, 0], alphaRotY: 0.25, chrome: 0.75, wire: 0.5 }),
  // frames: top-down plan view, wireframe — photos float above it
  frames: pose({ cam: [0, 8.5, 0.6], target: [0, 0, 0], alphaRotY: 0.0, chrome: 0.12, wire: 0.85, crowd: 0.6 }),
  // contact: pull back to a quiet front view
  contact: pose({ cam: [0, 0.2, 9.5], target: [0, 0, 0], chrome: 1, wire: 0.2 }),
};

export const smoothstep = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function blend(a: Pose, b: Pose, t: number): Pose {
  const k = smoothstep(t);
  return {
    cam: mix3(a.cam, b.cam, k),
    target: mix3(a.target, b.target, k),
    alphaPos: mix3(a.alphaPos, b.alphaPos, k),
    alphaRotY: mix(a.alphaRotY, b.alphaRotY, k),
    stage: mix(a.stage, b.stage, k),
    chrome: mix(a.chrome, b.chrome, k),
    wire: mix(a.wire, b.wire, k),
    crowd: mix(a.crowd, b.crowd, k),
    lens: mix(a.lens, b.lens, k),
  };
}

export interface Stop {
  name: string;
  /** scroll position at which this stop is fully "on" */
  at: number;
}

/** Pose for a scroll position given the ordered stops. */
export function poseAt(stops: Stop[], scroll: number, table: Record<string, Pose> = STATIONS): Pose {
  if (stops.length === 0) return table.hero;
  const get = (n: string) => table[n] ?? base;
  if (scroll <= stops[0].at) return get(stops[0].name);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (scroll <= b.at) return blend(get(a.name), get(b.name), (scroll - a.at) / Math.max(1, b.at - a.at));
  }
  return get(stops[stops.length - 1].name);
}
