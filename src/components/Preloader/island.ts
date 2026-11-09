import { gsap, markRevealed, reducedMotion } from '@/lib/motion/core';

const KEY = 'alpha26:preloaded';

export default function preloader(el: HTMLElement): void {
  const params = new URLSearchParams(location.search);
  const seen = sessionStorage.getItem(KEY) === '1' && params.get('pre') !== '1';

  if (seen || reducedMotion()) {
    el.remove();
    markRevealed();
    return;
  }

  const count = el.querySelector<HTMLElement>('[data-count]')!;
  const bar = el.querySelector<HTMLElement>('[data-bar]')!;
  const state = { v: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      sessionStorage.setItem(KEY, '1');
      el.remove();
    },
  });

  tl.to(state, {
    v: 100,
    duration: 1.6,
    ease: 'power2.inOut',
    onUpdate: () => {
      count.textContent = String(Math.round(state.v)).padStart(3, '0');
    },
  })
    .to(bar, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
    .to(count, { opacity: 0, y: -10, duration: 0.3 }, '+=0.1')
    .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power4.inOut' }, '-=0.1')
    .call(markRevealed, undefined, '-=0.6');
}
