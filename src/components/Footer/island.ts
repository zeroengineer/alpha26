import { gsap, reducedMotion } from '@/lib/motion/core';
import { scrambleIn, wipeBlock } from '@/lib/motion/reveal';

export default function contact(section: HTMLElement): void {
  const links = Array.from(section.querySelectorAll<HTMLElement>('[data-contact-link]'));
  const statement = section.querySelector<HTMLElement>('.contact__statement');
  if (reducedMotion()) {
    gsap.set([links, statement], { opacity: 1 });
    return;
  }
  gsap.timeline({ scrollTrigger: { trigger: links[0], start: 'top 88%', once: true } }).add(links.map((l, i) => wipeBlock(l, { delay: i * 0.12 })));
  if (statement) {
    gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 90%', once: true } }).add(scrambleIn(statement, { duration: 1.8 }));
  }
}
