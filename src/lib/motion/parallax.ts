/**
 * Depth parallax: every element with `data-speed` drifts relative to the scroll.
 *   data-speed="1"   moves with the page
 *   data-speed="0.8" lags behind (feels further away)
 *   data-speed="1.2" runs ahead (feels closer)
 * Optional `data-drift-x="-60"` adds a sideways drift (px over the element's passage).
 * mont-fort's layered feel comes from neighbours carrying different speeds.
 */
import { gsap, ScrollTrigger, reducedMotion } from './core';

export function initParallax(root: ParentNode = document): () => void {
  if (reducedMotion()) return () => {};
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-speed], [data-drift-x]'));
  const triggers: ScrollTrigger[] = [];
  items.forEach((el) => {
    const speed = Number(el.dataset.speed ?? 1);
    const drift = Number(el.dataset.driftX ?? 0);
    const travel = () => (1 - speed) * window.innerHeight * 0.9;
    const tween = gsap.fromTo(
      el,
      { y: () => -travel() / 2, x: -drift / 2 },
      {
        y: () => travel() / 2,
        x: drift / 2,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });
  return () => triggers.forEach((t) => t.kill());
}
