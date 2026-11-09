/**
 * Single GSAP entry so plugins register once and every island shares the same instance.
 * Import from here, never from 'gsap' directly inside components.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 1 });

export { gsap, ScrollTrigger, SplitText };

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = (): boolean => window.matchMedia('(hover: none), (pointer: coarse)').matches;

/**
 * Fires once the first paint has settled (fonts ready, or immediately if already done).
 * Replaces the old preloader handshake: the page simply fades in.
 */
export function onReady(cb: () => void): void {
  if (document.documentElement.dataset.ready === 'true') {
    cb();
    return;
  }
  window.addEventListener('alpha:ready', () => cb(), { once: true });
}

export function markReady(): void {
  if (document.documentElement.dataset.ready === 'true') return;
  document.documentElement.dataset.ready = 'true';
  window.dispatchEvent(new CustomEvent('alpha:ready'));
}
