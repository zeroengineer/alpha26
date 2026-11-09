/**
 * Text reveal primitives adapted from the reference sites' flow:
 *  - scrambleIn: characters resolve from noise into the final caption (zrk).
 *  - wipeIn:     a solid block sweeps across, text is revealed behind it, then a brief
 *                monochrome "ghost split" flicker (Orano's headline reveal, without the RGB colour).
 *  - linesIn:    SplitText line-by-line rise for headings/body.
 */
import { gsap, SplitText, reducedMotion } from './core';

const SCRAMBLE_CHARS = 'ALPH26·—/\\|_';

export function scrambleIn(el: HTMLElement, opts: { duration?: number; delay?: number } = {}): gsap.core.Tween {
  const text = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = text;
  if (reducedMotion()) {
    el.textContent = text;
    return gsap.set(el, { opacity: 1 });
  }
  el.textContent = '';
  return gsap.to(el, {
    opacity: 1,
    duration: opts.duration ?? 1.6,
    delay: opts.delay ?? 0,
    ease: 'none',
    scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5, revealDelay: 0.2, tweenLength: false },
  });
}

/**
 * Expects markup:
 *  <h1 class="wipe"><span class="wipe__text">…</span><i class="wipe__block" aria-hidden></i></h1>
 */
export function wipeIn(el: HTMLElement, opts: { delay?: number } = {}): gsap.core.Timeline {
  const text = el.querySelector<HTMLElement>('.wipe__text');
  const block = el.querySelector<HTMLElement>('.wipe__block');
  const tl = gsap.timeline({ delay: opts.delay ?? 0 });
  if (!text || !block) return tl;

  if (reducedMotion()) {
    gsap.set(text, { clipPath: 'inset(0 0% 0 0)', opacity: 1 });
    gsap.set(block, { scaleX: 0 });
    return tl;
  }

  gsap.set(text, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });
  gsap.set(block, { scaleX: 0, transformOrigin: 'left center' });

  tl.to(block, { scaleX: 1, duration: 0.55, ease: 'power4.inOut' })
    .set(block, { transformOrigin: 'right center' })
    .to(block, { scaleX: 0, duration: 0.6, ease: 'power4.inOut' }, 'reveal')
    .to(text, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power4.inOut' }, 'reveal')
    // ghost split: two offset copies flicker for a beat, then collapse back
    .fromTo(
      el,
      { '--ghost': 6, '--ghost-a': 0.55 },
      { '--ghost': 0, '--ghost-a': 0, duration: 0.5, ease: 'steps(6)' },
      'reveal+=0.35',
    );
  return tl;
}

export function linesIn(el: HTMLElement, opts: { delay?: number; stagger?: number; trigger?: boolean } = {}): gsap.core.Tween | null {
  if (reducedMotion()) {
    gsap.set(el, { opacity: 1 });
    return null;
  }
  const split = SplitText.create(el, { type: 'lines', linesClass: 'line', mask: 'lines', autoSplit: true });
  gsap.set(el, { opacity: 1 });
  return gsap.from(split.lines, {
    yPercent: 110,
    duration: 1.1,
    ease: 'power4.out',
    stagger: opts.stagger ?? 0.08,
    delay: opts.delay ?? 0,
    ...(opts.trigger === false ? {} : { scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
  });
}
