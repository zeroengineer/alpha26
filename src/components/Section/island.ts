import { gsap, ScrollTrigger, reducedMotion } from '@/lib/motion/core';
import { lettersIn, scrambleIn } from '@/lib/motion/reveal';
import { sceneBus } from '@/lib/scene-bus';

/**
 * Section scene behaviour: publishes itself to the scene bus (background camera), scrambles the
 * eyebrow and glitch-reveals the heading when it enters.
 */
export default function section(el: HTMLElement): void {
  const no = el.querySelector<HTMLElement>('[data-section-no]');
  const eyebrow = el.querySelector<HTMLElement>('.section__eyebrow');
  const title = el.querySelector<HTMLElement>('[data-section-title]');
  const id = el.id;

  if (reducedMotion()) {
    gsap.set([no, title].filter(Boolean), { opacity: 1 });
    ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 40%', onToggle: (s) => s.isActive && sceneBus.set(id) });
    return;
  }

  ScrollTrigger.create({
    trigger: el,
    start: 'top 70%',
    end: 'bottom 30%',
    onEnter: () => sceneBus.set(id, 0),
    onEnterBack: () => sceneBus.set(id, 1),
    onUpdate: (self) => self.isActive && sceneBus.set(id, self.progress),
  });

  const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
  if (no) tl.fromTo(no, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.8 }, 0);
  if (eyebrow) tl.add(scrambleIn(eyebrow, { duration: 0.9 }), 0.1);
  if (title) tl.add(lettersIn(title, { duration: 0.9 }), 0.15);
}
