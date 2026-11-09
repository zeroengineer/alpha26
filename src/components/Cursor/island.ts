import { gsap, reducedMotion, isTouch } from '@/lib/motion/core';

export default function cursor(el: HTMLElement): () => void {
  if (isTouch() || reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return () => {};
  const x = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
  let shown = false;
  const onMove = (e: PointerEvent) => {
    x(e.clientX);
    y(e.clientY);
    if (!shown) { shown = true; document.documentElement.classList.add('has-cursor'); gsap.to(el, { opacity: 1, duration: 0.4 }); }
  };
  const onOver = (e: Event) => {
    const t = (e.target as Element).closest('a, button, [data-slider-track], [role="button"]');
    el.classList.toggle('is-hover', !!t);
  };
  const onLeave = () => gsap.to(el, { opacity: 0, duration: 0.3 });
  const onEnter = () => shown && gsap.to(el, { opacity: 1, duration: 0.3 });
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerover', onOver);
  document.documentElement.addEventListener('pointerleave', onLeave);
  document.documentElement.addEventListener('pointerenter', onEnter);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    document.documentElement.removeEventListener('pointerenter', onEnter);
    document.documentElement.classList.remove('has-cursor');
  };
}
