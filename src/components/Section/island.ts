import { gsap, reducedMotion } from '@/lib/motion/core';
import { linesIn } from '@/lib/motion/reveal';

/** Reveals the number label and the heading when the section head scrolls into view. */
export default function section(el: HTMLElement): void {
  const no = el.querySelector<HTMLElement>('[data-section-no]');
  const title = el.querySelector<HTMLElement>('[data-section-title]');
  if (no) {
    if (reducedMotion()) gsap.set(no, { opacity: 1 });
    else gsap.fromTo(no, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.9, scrollTrigger: { trigger: no, start: 'top 88%', once: true } });
  }
  if (title) linesIn(title, { delay: 0.1 });
}
