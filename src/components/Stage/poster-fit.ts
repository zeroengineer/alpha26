/**
 * Where things sit in the Figma poster (frame 1:23, 1080×1440), measured from the raster, and the
 * maths that makes the live 3D scene reproduce that composition exactly at the hero station.
 * Fractions are of the poster's width / height, y measured from the top.
 */
export const POSTER = {
  aspect: 0.75,
  /** α bounding box: height fraction and centre */
  alphaH: 0.54,
  alphaCx: 0.508,
  alphaCy: 0.491,
  /** six glass slats: left edge = slatX0 + i * slatStep, width slatW, vertical span slatY0..slatY1 */
  slatX0: 0.116,
  slatStep: 0.126,
  slatW: 0.114,
  slatY0: 0.08,
  slatY1: 0.905,
} as const;

/** Poster box height in px for a viewport — mirrors the hero CSS (115svh landscape, cover on portrait). */
export function posterHeightPx(vw: number, vh: number): number {
  return vw >= vh ? vh * 1.15 : Math.max(vh, vw / POSTER.aspect);
}

/**
 * Vertical field of view (degrees) that makes an α of world height `alphaWorldH`, seen from
 * `distance`, occupy the same share of the viewport as the α in the poster.
 */
export function fitFov(vw: number, vh: number, alphaWorldH: number, distance: number): number {
  const fraction = (POSTER.alphaH * posterHeightPx(vw, vh)) / vh;
  const visibleH = alphaWorldH / fraction;
  return (2 * Math.atan(visibleH / (2 * distance)) * 180) / Math.PI;
}

/** Slat centres / sizes in world units (α centred at the origin, height alphaWorldH). */
export function slatLayout(alphaWorldH: number) {
  const H = alphaWorldH / POSTER.alphaH; // poster height in world units
  const W = H * POSTER.aspect;
  return Array.from({ length: 6 }, (_, i) => {
    const cx = POSTER.slatX0 + i * POSTER.slatStep + POSTER.slatW / 2;
    const cy = (POSTER.slatY0 + POSTER.slatY1) / 2;
    return {
      x: (cx - POSTER.alphaCx) * W,
      y: -(cy - POSTER.alphaCy) * H,
      w: POSTER.slatW * W,
      h: (POSTER.slatY1 - POSTER.slatY0) * H,
    };
  });
}

/** Parse the glyph path (M/L/H/V/Q/C/Z, absolute) into drawing commands. */
export type PathCmd = { c: string; v: number[] };
export function parsePath(d: string): PathCmd[] {
  const out: PathCmd[] = [];
  const re = /([MLHVQCZ])([^MLHVQCZ]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const v = (m[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    out.push({ c: m[1].toUpperCase(), v });
  }
  return out;
}
