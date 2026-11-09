import { gsap, reducedMotion } from '@/lib/motion/core';

export default function venue(section: HTMLElement): void {
  const media = section.querySelector<HTMLElement>('[data-venue-media]')!;
  const body = section.querySelector<HTMLElement>('[data-venue-body]')!;
  if (reducedMotion()) {
    gsap.set([media, body], { opacity: 1 });
    return;
  }
  gsap.timeline({ scrollTrigger: { trigger: media, start: 'top 80%', once: true } })
    .fromTo(media, { opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.inOut' })
    .fromTo(body, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.5');
}
