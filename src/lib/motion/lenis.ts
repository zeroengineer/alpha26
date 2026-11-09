/**
 * Lenis smooth scroll, wired into GSAP's ticker + ScrollTrigger (zrk-style feel: lerp .05, wheel ×0.7).
 * Disabled for reduced-motion users and on touch devices (native scrolling is better there).
 */
import Lenis from 'lenis';
import { gsap, ScrollTrigger, reducedMotion, isTouch } from './core';

let instance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return instance;
}

export function initLenis(): Lenis | null {
  if (instance) return instance;
  if (reducedMotion() || isTouch()) return null;

  instance = new Lenis({
    lerp: 0.05,
    smoothWheel: true,
    wheelMultiplier: 0.7,
    gestureOrientation: 'vertical',
  });

  instance.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => instance?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return instance;
}

/** Scroll to an element or selector, respecting Lenis when active. */
export function scrollToTarget(target: string | HTMLElement, offset = 0): void {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
}
