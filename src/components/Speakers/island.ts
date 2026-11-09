import { gsap, reducedMotion } from '@/lib/motion/core';
import { createSlider } from '@/lib/slider';

export default function speakers(section: HTMLElement): () => void {
  const sliderRoot = section.querySelector<HTMLElement>('[data-slider]')!;
  const sessions = Array.from(section.querySelectorAll<HTMLElement>('[data-session]'));
  const rm = reducedMotion();

  const slider = createSlider(sliderRoot, {
    scope: sliderRoot.closest<HTMLElement>('.block') ?? sliderRoot,
    onChange(_, __, slide) {
      if (rm) return;
      const body = slide.querySelector<HTMLElement>('[data-slide-body]');
      if (body) gsap.fromTo(body.children, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true });
    },
  });

  if (rm) gsap.set(sessions, { opacity: 1 });
  else gsap.fromTo(sessions, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: sessions[0], start: 'top 88%', once: true } });

  return () => slider.destroy();
}
