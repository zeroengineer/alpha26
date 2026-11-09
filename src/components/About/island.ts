import { gsap, reducedMotion } from '@/lib/motion/core';
import { linesIn, wipeBlock } from '@/lib/motion/reveal';

export default function about(copy: HTMLElement): void {
  const section = copy.closest('section')!;
  const paragraphs = Array.from(section.querySelectorAll<HTMLElement>('[data-reveal]'));
  const pillars = Array.from(section.querySelectorAll<HTMLElement>('[data-pillar]'));

  paragraphs.forEach((p, i) => linesIn(p, { delay: i * 0.05, stagger: 0.05 }));

  if (reducedMotion()) {
    gsap.set(pillars, { opacity: 1 });
    return;
  }
  // Pillars sweep in one after another with the block wipe (Orano's CTA reveal, generalised).
  gsap.timeline({ scrollTrigger: { trigger: pillars[0], start: 'top 85%', once: true } })
    .add(pillars.map((p, i) => wipeBlock(p, { delay: i * 0.12 })));
}
