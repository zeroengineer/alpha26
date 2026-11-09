import { gsap, reducedMotion, soft } from '@/lib/motion/core';
import { softBlock } from '@/lib/motion/reveal';

export default function contact(section: HTMLElement): void {
  const grid = section.querySelector<HTMLElement>('[data-contact]');
  const statement = section.querySelector<HTMLElement>('.contact__statement');
  if (grid) softBlock(grid);
  if (!statement) return;
  if (reducedMotion()) { gsap.set(statement, { opacity: 1 }); return; }
  // the sign-off settles from wide tracking as it scrolls in
  gsap.fromTo(statement, { opacity: 0, letterSpacing: '1.4em', ...soft(12) }, {
    opacity: 1, letterSpacing: '0.6em', ...soft(0), ease: 'none',
    scrollTrigger: { trigger: statement, start: 'top 95%', end: 'top 50%', scrub: 0.8 },
  });
}
