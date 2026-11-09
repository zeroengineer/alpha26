import { gsap, reducedMotion, soft } from '@/lib/motion/core';
import { softBlock, softLines } from '@/lib/motion/reveal';

export default function about(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((p) => softLines(p));
  section.querySelectorAll<HTMLElement>('[data-pillar], [data-pillar-caption]').forEach((el) => softBlock(el, { out: true }));

  const words = Array.from(section.querySelectorAll<HTMLElement>('[data-word]'));
  if (reducedMotion()) {
    gsap.set(words, { opacity: 1 });
    return;
  }
  // statement: each word focuses in on its own beat, then the line dissolves as the camera exits the bowl
  const statement = section.querySelector<HTMLElement>('.statement')!;
  gsap.fromTo(words, { opacity: 0, ...soft(16) }, {
    opacity: 1, ...soft(0), ease: 'none', stagger: { each: 0.06, from: 'random' },
    scrollTrigger: { trigger: statement, start: 'top 75%', end: 'center 55%', scrub: 0.8 },
  });
  gsap.to(words, {
    opacity: 0, ...soft(12), ease: 'none', stagger: { each: 0.04, from: 'random' }, immediateRender: false,
    scrollTrigger: { trigger: statement, start: 'center 35%', end: 'bottom 20%', scrub: 0.8 },
  });
}
