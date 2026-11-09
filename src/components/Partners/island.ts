import { gsap, reducedMotion } from '@/lib/motion/core';

export default function partners(section: HTMLElement): void {
  const logos = Array.from(section.querySelectorAll<HTMLElement>('[data-logo]'));
  if (reducedMotion()) {
    gsap.set(logos, { opacity: 1 });
    return;
  }
  section.querySelectorAll<HTMLElement>('[data-tier]').forEach((tier) => {
    const items = Array.from(tier.querySelectorAll<HTMLElement>('[data-logo]'));
    gsap.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: tier, start: 'top 88%', once: true } });
  });
}
