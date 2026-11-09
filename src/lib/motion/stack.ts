/**
 * Stacking scenes: every top-level section is pinned once it has been scrolled through, so the
 * next section slides over it (zrk / Orano "slide over" feel). While covered, the scene scales
 * down and dims. No extra scroll distance is added (pinSpacing: false), so the page length and
 * anchor positions stay natural. Skipped entirely under reduced motion.
 */
import { gsap, ScrollTrigger, reducedMotion } from './core';

export function initStacking(root: ParentNode = document): () => void {
  if (reducedMotion()) return () => {};
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('main > section[id]'));
  const triggers: ScrollTrigger[] = [];

  scenes.forEach((scene, i) => {
    // later scenes paint over earlier ones
    scene.style.position = 'relative';
    scene.style.zIndex = String(i + 1);
    if (i === scenes.length - 1) return;

    triggers.push(
      ScrollTrigger.create({
        trigger: scene,
        start: 'bottom bottom',
        end: '+=100%',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
      }),
    );
    const tween = gsap.to(scene, {
      scale: 0.94,
      opacity: 0.12,
      filter: 'brightness(0.5)',
      ease: 'none',
      scrollTrigger: { trigger: scene, start: 'bottom bottom', end: '+=100%', scrub: true },
    });
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });

  return () => triggers.forEach((t) => t.kill());
}
