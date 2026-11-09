import { gsap, onReady, reducedMotion, isTouch } from '@/lib/motion/core';
import { settleTracking } from '@/lib/motion/reveal';

export default function hero(section: HTMLElement): () => void {
  const frame = section.querySelector<HTMLElement>('[data-hero-frame]')!;
  const scene = section.querySelector<HTMLElement>('[data-scene]')!;
  const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-depth]'));
  const slats = Array.from(section.querySelectorAll<HTMLElement>('[data-slat]'));
  const sweep = section.querySelector<HTMLElement>('[data-sweep]')!;
  const copy = section.querySelector<HTMLElement>('[data-hero-copy]')!;
  const caption = section.querySelector<HTMLElement>('[data-caption]')!;
  const title = section.querySelector<HTMLElement>('[data-title]')!;
  const handle = section.querySelector<HTMLElement>('[data-handle]')!;
  const extras = Array.from(section.querySelectorAll<HTMLElement>('[data-dates], [data-cta]'));
  const cue = section.querySelector<HTMLElement>('[data-cue]')!;
  const rm = reducedMotion();

  // ---- Entrance: the poster surfaces out of black, type settles from wide tracking ----
  onReady(() => {
    if (rm) {
      gsap.set([scene, caption, title, handle, cue, ...extras], { opacity: 1 });
      gsap.set(slats, { scaleY: 1 });
      return;
    }
    const tl = gsap.timeline();
    tl.fromTo(scene, { opacity: 0, scale: 1.06, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2.4, ease: 'expo.out' }, 0)
      .to(slats, { scaleY: 1, duration: 1.8, ease: 'expo.out', stagger: { each: 0.08, from: 'center' } }, 0.4)
      .add(settleTracking(caption, '1.4em', '0.5em'), 0.6)
      .add(settleTracking(title.querySelector('.wipe__text') ?? title, '1.8em', '1em'), 0.9)
      .fromTo(handle, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2 }, 1.6)
      .to(cue, { opacity: 1, duration: 1 }, 2);
    if (extras.length) tl.fromTo(extras, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 1.5);
    tl.add(gsap.to(sweep, { xPercent: 240, duration: 2.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 6 }), 2.2);
  });

  if (rm) return () => {};

  // ---- Scroll: the copy lifts away; the camera move on the live stage is the transition ----
  gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } })
    .to(copy, { yPercent: -18, opacity: 0, ease: 'none' }, 0)
    .to(cue, { opacity: 0, ease: 'none', duration: 0.2 }, 0);

  // Fallback until (or unless) the live scene exists: the raster poster recedes as before.
  const recede = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } })
    .to(frame, { scale: 0.82, opacity: 0, filter: 'blur(6px)', ease: 'none' }, 0);

  // Hand-over: the live scene opens in exactly the poster's composition, so the raster simply
  // dissolves into it in place; from then on scrolling moves the camera, not a picture.
  const handOver = () => {
    recede.scrollTrigger?.kill();
    recede.kill();
    gsap.to(frame, { opacity: 0, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power2.inOut', onComplete: () => { frame.style.visibility = 'hidden'; } });
  };
  if (document.querySelector('[data-stage][data-stage-ready]')) handOver();
  else window.addEventListener('alpha:stage-live', handOver, { once: true });

  // ---- Cursor parallax on the poster layers ----
  if (isTouch()) return () => {};
  const setters = layers.map((l) => ({
    depth: Number(l.dataset.depth),
    x: gsap.quickTo(l, 'x', { duration: 0.9, ease: 'power3' }),
    y: gsap.quickTo(l, 'y', { duration: 0.9, ease: 'power3' }),
  }));
  const onMove = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    setters.forEach((s) => { s.x(nx * 14 * s.depth); s.y(ny * 9 * s.depth); });
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => window.removeEventListener('pointermove', onMove);
}
