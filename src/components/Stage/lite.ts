import { gsap, ScrollTrigger } from '@/lib/motion/core';
import { ALPHA_VIEWBOX } from '@/assets/alpha/alpha-path';
import { smoothstep } from './stations';

/**
 * The α stage on phones and small screens: no WebGL, no three.js, no CSS 3D — one SVG.
 *
 * The α is a wireframe: the outline is drawn several times at different depths (front face, back face,
 * faint ribs between) with struts joining the two faces. Each frame the layers are projected with a
 * small rotation matrix and written as plain SVG `matrix()` transforms, so the lines stay vector-crisp.
 * As on desktop, every `[data-station]` is a stop with a pose; while the visitor scrolls between two
 * stops the wireframe blends between their poses (doyourdesign studio-tour pattern). The programme
 * tour (About.astro) is split into one stop per chapter.
 * Extras: the outlines draw themselves in on mount, and a light streak runs around the front outline.
 */
interface Pose {
  /** degrees */
  rx: number; ry: number; rz: number;
  /** offset in % of the viewport width / height */
  x: number; y: number;
  s: number;
  /** extrusion depth, 1 = normal */
  depth: number;
  /** overall brightness 0..1 */
  op: number;
}
const base: Pose = { rx: 0, ry: 0, rz: 0, x: 0, y: 0, s: 1, depth: 1, op: 0.5 };
const pose = (p: Partial<Pose>): Pose => ({ ...base, ...p });

const POSES: Record<string, Pose> = {
  // the hero poster is its own α; the wireframe waits behind it, flat
  hero: pose({ depth: 0, op: 0 }),
  // first scroll: the α stands alone, centred, already showing its depth
  intro: pose({ ry: -24, rx: 8, op: 0.8 }),
  // the brief: steps right and dims behind the copy
  about: pose({ ry: -42, rx: 10, x: 16, s: 1.2, op: 0.2 }),
  // tablets (no pinned tour): one pose for the whole pillars block
  pillars: pose({ ry: 34, rx: -18, s: 1.1, op: 0.4 }),
  // the programme tour — the α holds the upper half of the screen, one view per chapter
  chapter1: pose({ ry: -52, rx: 12, x: 4, y: -17, s: 0.95, op: 0.9 }),          // turned right
  chapter2: pose({ ry: 38, rx: -28, y: -15, s: 1.05, op: 0.9 }),                 // low angle
  chapter3: pose({ ry: 16, rx: 6, rz: -8, x: 12, y: -17, s: 1.45, depth: 1.5, op: 0.85 }), // into the bowl
  chapter4: pose({ rx: 64, rz: 24, y: -17, s: 1.05, depth: 1.3, op: 0.9 }),      // from above
  chapter5: pose({ ry: -18, rx: 14, rz: 4, y: -19, s: 0.72, op: 0.9 }),          // pulled back
  // statement: through the bowl, behind the big line
  statement: pose({ ry: 6, x: 22, s: 2.5, depth: 1.8, op: 0.4 }),
  speakers: pose({ ry: 40, rx: 6, x: -14, s: 1.1, op: 0.35 }),
  venue: pose({ rx: 52, rz: -10, s: 1.1, op: 0.35 }),
  partners: pose({ ry: -58, rx: -6, x: 12, s: 1.05, op: 0.35 }),
  // team: seen from behind, off to the left
  team: pose({ ry: 152, rx: 8, x: -10, s: 1.15, op: 0.34 }),
  // frames: top-down plan view under the photos
  frames: pose({ rx: 68, rz: -14, s: 1.15, depth: 1.3, op: 0.3 }),
  // contact: back to a quiet front view
  contact: pose({ ry: -12, rx: 5, s: 0.95, depth: 0.8, op: 0.3 }),
};
const KEYS = Object.keys(base) as (keyof Pose)[];

interface Stop { name: string; at: number }
const NS = 'http://www.w3.org/2000/svg';
const LEN = 1000;      // paths use pathLength=1000, so dash maths is in per-mille of the outline
const LAYERS = 6;
const STRUTS = 34;
const DEPTH = 210;     // extrusion at depth 1, in viewBox units
const PERSPECTIVE = 2600;
const CX = ALPHA_VIEWBOX.w / 2;
const CY = ALPHA_VIEWBOX.h / 2;
const RAD = Math.PI / 180;
/** must match the pinned-tour media query in About.astro */
const TOUR_QUERY = '(max-width: 760px) and (prefers-reduced-motion: no-preference)';

export default function stageLite(root: HTMLElement): () => void {
  const box = root.querySelector<HTMLElement>('[data-stage-alpha]')!;
  const svg = box.querySelector<SVGSVGElement>('svg')!;
  const front = svg.querySelector<SVGPathElement>('path')!;
  root.classList.add('is-lite');

  // ---- layers: index 0 = front face (the original path) … last = back face ----
  const frontGroup = document.createElementNS(NS, 'g');
  const paths: SVGPathElement[] = [front];
  const nodes: SVGElement[] = [frontGroup]; // what gets a transform, per layer
  for (let i = 1; i < LAYERS; i++) {
    const clone = front.cloneNode() as SVGPathElement;
    clone.setAttribute('stroke-width', i === LAYERS - 1 ? '1.4' : '1');
    clone.setAttribute('opacity', i === LAYERS - 1 ? '0.6' : '0.2');
    svg.insertBefore(clone, svg.firstChild); // DOM order back → front
    paths.push(clone);
    nodes.push(clone);
  }
  // struts between the two faces, at points sampled along the outline
  const total = front.getTotalLength();
  const anchors = Array.from({ length: STRUTS }, (_, i) => {
    const p = front.getPointAtLength((total * i) / STRUTS);
    return [p.x - CX, p.y - CY] as const;
  });
  const struts = document.createElementNS(NS, 'path');
  struts.setAttribute('fill', 'none');
  struts.setAttribute('stroke', 'currentColor');
  struts.setAttribute('stroke-width', '1');
  struts.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.insertBefore(struts, front);
  // the front face and its light streak share one transform
  svg.appendChild(frontGroup);
  frontGroup.appendChild(front);
  const tracer = front.cloneNode() as SVGPathElement;
  tracer.setAttribute('stroke-width', '2.6');
  tracer.setAttribute('stroke-linecap', 'round');
  const tracerGlow = tracer.cloneNode() as SVGPathElement;
  tracerGlow.setAttribute('stroke-width', '8');
  frontGroup.append(tracerGlow, tracer);
  [...paths, tracer, tracerGlow].forEach((p) => p.setAttribute('pathLength', String(LEN)));

  // ---- draw-in, back to front, then the struts and the streak ----
  gsap.set(paths, { strokeDasharray: LEN, strokeDashoffset: LEN });
  gsap.set([tracer, tracerGlow], { strokeDasharray: `${LEN * 0.06} ${LEN * 0.94}`, opacity: 0 });
  gsap.set(struts, { opacity: 0 });
  const intro = gsap.timeline()
    .to(paths.slice().reverse(), { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.12 })
    .to(struts, { opacity: 0.22, duration: 1 }, '-=1')
    .to(tracer, { opacity: 1, duration: 0.8 }, '-=0.6')
    .to(tracerGlow, { opacity: 0.18, duration: 0.8 }, '<');
  const loop = gsap.fromTo([tracer, tracerGlow], { strokeDashoffset: 0 }, { strokeDashoffset: -LEN, duration: 7, ease: 'none', repeat: -1 });

  // ---- stations ----
  let stops: Stop[] = [];
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let unit = ALPHA_VIEWBOX.w / Math.max(1, svg.clientWidth); // viewBox units per CSS px
  const measure = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    unit = ALPHA_VIEWBOX.w / Math.max(1, svg.clientWidth);
    const touring = window.matchMedia(TOUR_QUERY).matches;
    stops = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'))
      .flatMap((el): Stop[] => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        if (touring && el.hasAttribute('data-tour')) {
          // the pinned tour: one stop at the middle of each chapter's share of the scroll
          const n = el.querySelectorAll('[data-pillar]').length;
          const span = (r.height - vh) / n;
          return Array.from({ length: n }, (_, i) => ({ name: `chapter${i + 1}`, at: top + span * (i + 0.5) }));
        }
        const anchor = el.dataset.stationAt === 'top' ? top : top + Math.min(r.height, vh) / 2 - vh / 2;
        return [{ name: el.dataset.station!, at: Math.max(0, anchor) }];
      })
      .sort((a, b) => a.at - b.at);
  };
  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  const get = (name: string) => POSES[name] ?? base;
  const target: Pose = { ...base };
  const poseAt = (scroll: number) => {
    let a = stops[0];
    let b = stops[0];
    let t = 0;
    if (stops.length && scroll > stops[0].at) {
      a = b = stops[stops.length - 1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (scroll <= stops[i + 1].at) {
          a = stops[i];
          b = stops[i + 1];
          t = smoothstep((scroll - a.at) / Math.max(1, b.at - a.at));
          break;
        }
      }
    }
    const pa = a ? get(a.name) : POSES.hero;
    const pb = b ? get(b.name) : POSES.hero;
    for (const k of KEYS) target[k] = pa[k] + (pb[k] - pa[k]) * t;
  };

  // ---- the loop: ease towards the scroll's pose, add a slow idle sway, project ----
  poseAt(window.scrollY);
  const cur: Pose = { ...target };
  const tick = (time: number) => {
    poseAt(window.scrollY);
    for (const k of KEYS) cur[k] += (target[k] - cur[k]) * 0.1;
    const ax = (cur.rx + Math.cos(time * 0.33) * 2) * RAD;
    const ay = (cur.ry + Math.sin(time * 0.45) * 4) * RAD;
    const az = cur.rz * RAD;
    const [sx, cx, sy, cy, sz, cz] = [Math.sin(ax), Math.cos(ax), Math.sin(ay), Math.cos(ay), Math.sin(az), Math.cos(az)];
    // R = Rx · Ry · Rz (the outline's own plane is z = const): columns for u, v and z
    const r00 = cy * cz, r01 = -cy * sz, r02 = sy;
    const r10 = sx * sy * cz + cx * sz, r11 = -sx * sy * sz + cx * cz, r12 = -sx * cy;
    const r22 = cx * cy;
    const ox = CX + (cur.x / 100) * vw * unit;
    const oy = CY + (cur.y / 100) * vh * unit;
    const depth = cur.depth * DEPTH;
    /** layer at depth z → [scale·linear part, origin] (weak perspective: nearer layers are a little larger) */
    const plane = (z: number) => {
      const f = cur.s * (PERSPECTIVE / (PERSPECTIVE - r22 * z));
      return [f * r00, f * r10, f * r01, f * r11, ox + f * r02 * z, oy + f * r12 * z] as const;
    };
    nodes.forEach((node, i) => {
      const [a, b, c, d, e, f] = plane((0.5 - i / (LAYERS - 1)) * depth);
      // matrix about the glyph centre: translate(e,f) · linear · translate(-CX,-CY)
      node.setAttribute('transform', `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${(e - a * CX - c * CY).toFixed(2)} ${(f - b * CX - d * CY).toFixed(2)})`);
    });
    const pf = plane(depth / 2);
    const pb = plane(-depth / 2);
    let d = '';
    for (const [u, v] of anchors) {
      d += `M${(pf[0] * u + pf[2] * v + pf[4]).toFixed(1)} ${(pf[1] * u + pf[3] * v + pf[5]).toFixed(1)}L${(pb[0] * u + pb[2] * v + pb[4]).toFixed(1)} ${(pb[1] * u + pb[3] * v + pb[5]).toFixed(1)}`;
    }
    struts.setAttribute('d', d);
    svg.style.opacity = cur.op.toFixed(3);
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    ScrollTrigger.removeEventListener('refresh', measure);
    intro.kill();
    loop.kill();
    paths.slice(1).forEach((p) => p.remove());
    struts.remove();
    svg.appendChild(front);
    frontGroup.remove();
    gsap.set(front, { clearProps: 'all' });
    front.removeAttribute('pathLength');
    svg.style.opacity = '';
    root.classList.remove('is-lite');
  };
}
