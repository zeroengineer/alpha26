import { gsap, reducedMotion } from '@/lib/motion/core';
import { scrambleIn } from '@/lib/motion/reveal';

export default function contact(section: HTMLElement): void {
  const links = Array.from(section.querySelectorAll<HTMLElement>('[data-contact-link]'));
  const statement = section.querySelector<HTMLElement>('.contact__statement');
  if (reducedMotion()) {
    gsap.set([links, statement], { opacity: 1 });
    return;
  }
  gsap.fromTo(links, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: links[0], start: 'top 88%', once: true } });
  if (statement) {
    gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 90%', once: true } }).add(scrambleIn(statement, { duration: 1.8 }));
  }
}
