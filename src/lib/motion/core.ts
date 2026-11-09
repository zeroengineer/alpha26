/**
 * Single GSAP entry so plugins register once and every island shares the same instance.
 * Import from here, never from 'gsap' directly inside components.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Observer);

gsap.defaults({ ease: 'power3.out', duration: 0.8 });

export { gsap, ScrollTrigger, SplitText, Observer };

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = (): boolean => window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** Fires once the preloader has finished (or immediately if it already has / isn't present). */
export function onReveal(cb: () => void): void {
  if (document.documentElement.dataset.revealed === 'true') {
    cb();
    return;
  }
  window.addEventListener('alpha:reveal', () => cb(), { once: true });
}

export function markRevealed(): void {
  document.documentElement.dataset.revealed = 'true';
  window.dispatchEvent(new CustomEvent('alpha:reveal'));
}
