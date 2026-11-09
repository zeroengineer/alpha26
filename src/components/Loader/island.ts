import { gsap, markReady, soft } from '@/lib/motion/core';

const KEY = 'alpha26:loaded';

/** Resolves when the hero image has loaded and fonts are in (or after a ceiling). No forced img.decode(): on slow phones it blocks the main thread. */
function assetsReady(ceiling = 4000): Promise<void> {
  const img = document.querySelector<HTMLImageElement>('#hero img');
  const waits: Promise<unknown>[] = [document.fonts?.ready ?? Promise.resolve()];
  if (img) waits.push(img.complete ? Promise.resolve() : new Promise((r) => img.addEventListener('load', r, { once: true })));
  return Promise.race([Promise.all(waits).then(() => undefined), new Promise<void>((r) => setTimeout(r, ceiling))]);
}

export default function loader(el: HTMLElement): void {
  const svg = el.querySelector<SVGSVGElement>('.loader__alpha')!;
  const stroke = el.querySelector<SVGPathElement>('[data-loader-stroke]')!;
  const fill = el.querySelector<SVGRectElement>('[data-loader-fill]')!;
  const label = el.querySelector<HTMLElement>('[data-loader-label]')!;
  document.documentElement.style.overflow = 'hidden';
  gsap.set(fill, { scaleY: 0, transformOrigin: '50% 100%' });

  let handedOver = false;
  // the hand-over is part of the hero's opening: the black clears around the outline, the hero's α
  // resolves inside it (markReady starts the hero entrance), then the outline melts into the chrome
  const handOver = () => {
    if (handedOver) return;
    handedOver = true;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    document.documentElement.style.overflow = '';
    el.style.pointerEvents = 'none';
    gsap.timeline({ onComplete: () => el.remove() })
      .to(fill, { scaleY: 1, duration: 0.45, ease: 'power3.inOut' })
      .to(label, { opacity: 0, y: 8, duration: 0.3 }, '<')
      .to(el, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.7, ease: 'power2.inOut' })
      .call(markReady, undefined, '<0.05')
      .to(fill, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, '<0.2')
      .to(stroke, { opacity: 0, duration: 1, ease: 'power2.inOut' }, '<0.35')
      .to(svg, { ...soft(6), duration: 1, ease: 'power2.in' }, '<');
  };

  // 1) the outline draws itself, 2) metal rises inside it while assets arrive, 3) hand over
  const intro = gsap.timeline();
  intro.to(label, { opacity: 1, duration: 0.6 }, 0)
    .to(stroke, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.05)
    .to(fill, { scaleY: 0.4, duration: 0.8, ease: 'power2.out' }, 0.6);

  Promise.all([assetsReady(), new Promise((r) => intro.eventCallback('onComplete', r))]).then(handOver);
  // never trap the visitor
  setTimeout(handOver, 7000);
}
