import { gsap } from '@/lib/motion/core';

/**
 * The α stage on phones and small screens: no WebGL, no three.js. The α outline (the same SVG used as
 * the static fallback) drifts, turns and grows with the scroll — one scrubbed timeline that only
 * animates transform, so it stays on the compositor. A CSS keyframe adds a slow idle "breath"
 * (see Stage.astro).
 */
export default function stageLite(root: HTMLElement): () => void {
  const alpha = root.querySelector<HTMLElement>('[data-stage-alpha]')!;
  root.classList.add('is-lite');

  const tl = gsap.timeline({
    defaults: { ease: 'sine.inOut', duration: 1 },
    scrollTrigger: { start: 0, end: 'max', scrub: 0.6 },
  });
  tl.to(alpha, { xPercent: 16, scale: 1.45, rotation: -8 })   // the programme: steps right
    .to(alpha, { xPercent: -10, scale: 1.75, rotation: 6 })   // statement: closest
    .to(alpha, { xPercent: 12, scale: 1.25, rotation: -4 })   // team / frames
    .to(alpha, { xPercent: 0, scale: 1, rotation: 0 });       // contact: back to the quiet front view

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    root.classList.remove('is-lite');
  };
}
