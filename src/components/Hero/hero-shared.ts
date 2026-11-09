/**
 * Hero helpers: entrance after the preloader and a lerped pointer tracker for parallax.
 */
import { gsap, onReveal, reducedMotion, isTouch } from '@/lib/motion/core';
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
