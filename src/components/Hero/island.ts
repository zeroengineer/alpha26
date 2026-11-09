import { gsap, reducedMotion } from '@/lib/motion/core';
import { heroEntrance, heroScrub, pointerTracker } from './hero-shared';

export default function heroGsap(section: HTMLElement): () => void {
  const scene = section.querySelector<HTMLElement>('[data-scene]')!;
  const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-depth]'));
  const slats = Array.from(section.querySelectorAll<HTMLElement>('[data-slat]'));
  const slatLayer = section.querySelector<HTMLElement>('[data-slats]')!;
  const sweep = section.querySelector<HTMLElement>('[data-sweep]')!;

  // Entrance: scene settles from a slight zoom, slats grow from their centre as the title wipes.
  heroEntrance(section, (tl) => {
    tl.to(scene, { opacity: 1, scale: 1, duration: 1.8, ease: 'power3.out' }, 0)
      .to(slats, { scaleY: 1, duration: 1.2, ease: 'power4.out', stagger: { each: 0.07, from: 'center' } }, 0.5);
    if (!reducedMotion()) {
      tl.add(
        gsap.to(sweep, { xPercent: 240, duration: 2.4, ease: 'power2.inOut', repeat: -1, repeatDelay: 5 }),
        1.2,
      );
    }
  });

  // Scroll: scene pushes in and darkens; slats drift apart vertically.
  heroScrub(section, (p) => {
    gsap.set(scene, { scale: 1 + p * 0.1, filter: `brightness(${1 - p * 0.75})` });
    slats.forEach((s, i) => gsap.set(s, { y: (i % 2 ? -1 : 1) * p * 70 }));
  });

  // Cursor parallax: each layer moves by its depth; the slat layer also tilts.
  const pointer = pointerTracker(section);
  const setters = layers.map((l) => ({
    depth: Number(l.dataset.depth),
    x: gsap.quickTo(l, 'x', { duration: 0.6, ease: 'power3' }),
    y: gsap.quickTo(l, 'y', { duration: 0.6, ease: 'power3' }),
  }));
  const tilt = gsap.quickTo(slatLayer, 'rotationY', { duration: 0.8, ease: 'power3' });
  gsap.set(slatLayer, { transformPerspective: 1200 });

  const tick = () => {
    setters.forEach((s) => {
      s.x(pointer.x * 18 * s.depth);
      s.y(pointer.y * 12 * s.depth);
    });
    tilt(pointer.x * -4);
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    pointer.dispose();
  };
}
