/**
 * Soft reveal primitives (mont-fort / doyourdesign feel): content surfaces out of a blur,
 * rising slightly, line by line — and blurs away again as it leaves, so chapters hand over
 * to each other instead of snapping.
 */
import { gsap, ScrollTrigger, SplitText, reducedMotion, soft } from './core';

/** Line-by-line focus-in for headings and paragraphs. Scrubbed in and out with the scroll. */
export function softLines(el: HTMLElement, opts: { start?: string; end?: string; out?: boolean } = {}): void {
  if (reducedMotion()) {
    gsap.set(el, { opacity: 1 });
    return;
  }
  const split = SplitText.create(el, { type: 'lines', linesClass: 'line', autoSplit: true });
  gsap.set(el, { opacity: 1 });
  gsap.fromTo(
    split.lines,
    { opacity: 0, yPercent: 60, ...soft(10) },
    {
      opacity: 1,
      yPercent: 0,
      ...soft(0),
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: opts.start ?? 'top 92%', end: opts.end ?? 'top 55%', scrub: 0.8 },
    },
  );
  if (opts.out !== false) {
    gsap.to(split.lines, {
      opacity: 0,
      yPercent: -40,
      ...soft(8),
      ease: 'none',
      stagger: 0.08,
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'bottom 30%', end: 'bottom 2%', scrub: 0.8 },
    });
  }
}

/** Whole-block focus-in / focus-out (cards, images, labels). */
export function softBlock(el: HTMLElement, opts: { out?: boolean; delay?: number } = {}): void {
  if (reducedMotion()) {
    gsap.set(el, { opacity: 1 });
    return;
  }
  gsap.fromTo(
    el,
    { opacity: 0, y: 40, ...soft(12) },
    { opacity: 1, y: 0, ...soft(0), ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 60%', scrub: 0.8 } },
  );
  if (opts.out) {
    gsap.to(el, {
      opacity: 0,
      ...soft(10),
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'bottom 25%', end: 'bottom 0%', scrub: 0.8 },
    });
  }
}

/** Tracked uppercase line that settles from wide letter-spacing (one-shot, for the hero). */
export function settleTracking(el: HTMLElement, from: string, to: string, delay = 0): gsap.core.Tween {
  if (reducedMotion()) return gsap.set(el, { opacity: 1 });
  return gsap.fromTo(el, { opacity: 0, letterSpacing: from, ...soft(8) }, { opacity: 1, letterSpacing: to, ...soft(0), duration: 2.2, ease: 'expo.out', delay });
}

export { ScrollTrigger };
