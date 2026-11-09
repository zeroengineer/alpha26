/**
 * Behaviour common to both hero variants: entrance after the preloader, the pinned scroll scrub,
 * and a lerped pointer tracker that variants use for parallax.
 */
import { gsap, ScrollTrigger, onReveal, reducedMotion, isTouch } from '@/lib/motion/core';
import { scrambleIn, wipeIn } from '@/lib/motion/reveal';

export function heroEntrance(section: HTMLElement, onStart?: (tl: gsap.core.Timeline) => void): void {
  const caption = section.querySelector<HTMLElement>('[data-caption]')!;
  const title = section.querySelector<HTMLElement>('[data-title]')!;
  const handle = section.querySelector<HTMLElement>('[data-handle]')!;
  const extras = section.querySelectorAll<HTMLElement>('[data-dates], [data-cta]');

  onReveal(() => {
    const tl = gsap.timeline();
    onStart?.(tl);
    tl.add(scrambleIn(caption, { duration: 1.5 }), 0.2)
      .add(wipeIn(title), 0.7)
      .fromTo(handle, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1 }, 1.5);
    if (extras.length) tl.fromTo(extras, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 1.4);
  });
}

/**
 * Pins the hero for an extra 120% of viewport and reports progress 0→1 while the visitor scrolls
 * through it. Variants darken / push the scene; the copy drifts up and fades.
 */
export function heroScrub(section: HTMLElement, onProgress?: (p: number) => void): ScrollTrigger | null {
  const copy = section.querySelector<HTMLElement>('[data-hero-copy]')!;
  if (reducedMotion()) return null;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=120%',
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      onUpdate: (self) => onProgress?.(self.progress),
    },
  });
  tl.to(copy, { y: -80, opacity: 0, ease: 'none', duration: 1 }, 0);
  return tl.scrollTrigger ?? null;
}

export interface Pointer {
  /** -1..1, lerped */
  x: number;
  y: number;
  dispose(): void;
}

export function pointerTracker(target: HTMLElement, lerp = 0.06): Pointer {
  const p: Pointer = { x: 0, y: 0, dispose };
  let tx = 0;
  let ty = 0;
  if (isTouch() || reducedMotion()) return p;

  const move = (e: PointerEvent) => {
    const r = target.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const leave = () => { tx = 0; ty = 0; };
  const tick = () => {
    p.x += (tx - p.x) * lerp;
    p.y += (ty - p.y) * lerp;
  };
  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerleave', leave);
  gsap.ticker.add(tick);

  function dispose() {
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerleave', leave);
    gsap.ticker.remove(tick);
  }
  return p;
}
