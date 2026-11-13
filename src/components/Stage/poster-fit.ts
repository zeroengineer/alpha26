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
