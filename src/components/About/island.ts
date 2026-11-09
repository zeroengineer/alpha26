import { gsap, reducedMotion } from '@/lib/motion/core';
import { linesIn, wipeIn } from '@/lib/motion/reveal';

export default function about(grid: HTMLElement): void {
  const section = grid.closest('section')!;
  const paragraphs = Array.from(section.querySelectorAll<HTMLElement>('[data-reveal]'));
  const facts = Array.from(section.querySelectorAll<HTMLElement>('[data-fact]'));
  const pillars = Array.from(section.querySelectorAll<HTMLElement>('[data-pillar]'));
  const closing = section.querySelector<HTMLElement>('[data-closing]')!;

  paragraphs.forEach((p, i) => linesIn(p, { delay: i * 0.05, stagger: 0.05 }));

  if (reducedMotion()) {
    gsap.set([facts, pillars], { opacity: 1 });
    wipeIn(closing);
    return;
  }

  gsap.from(facts, {
    opacity: 0, y: 24, duration: 1, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: facts[0], start: 'top 85%', once: true },
  });
  gsap.from(pillars, {
    opacity: 0, y: 30, duration: 1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: pillars[0], start: 'top 85%', once: true },
  });
  gsap.timeline({ scrollTrigger: { trigger: closing, start: 'top 80%', once: true } }).add(wipeIn(closing));
}
