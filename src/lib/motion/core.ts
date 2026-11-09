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
 * Phones and small screens: animated CSS blur is an offscreen GPU pass per element per frame, which
 * phones can't afford while a WebGL canvas is also drawing. There the same motion runs without blur.
 */
export const lite = (): boolean => isTouch() || window.matchMedia('(max-width: 900px)').matches;

/** `{ filter: 'blur(Npx)' }` on capable devices, `{}` on lite ones — spread into tween vars. */
export const soft = (px: number): { filter?: string } => (lite() ? {} : { filter: `blur(${px}px)` });

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
