import { gsap, onReady, reducedMotion, isTouch } from '@/lib/motion/core';
import { settleTracking } from '@/lib/motion/reveal';

export default function hero(section: HTMLElement): () => void {
  const frame = section.querySelector<HTMLElement>('[data-hero-frame]')!;
  const scene = section.querySelector<HTMLElement>('[data-scene]')!;
  const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-depth]'));
  const copy = section.querySelector<HTMLElement>('[data-hero-copy]')!;
  const caption = section.querySelector<HTMLElement>('[data-caption]')!;
  const title = section.querySelector<HTMLElement>('[data-title]')!;
  const handle = section.querySelector<HTMLElement>('[data-handle]')!;
  const extras = Array.from(section.querySelectorAll<HTMLElement>('[data-dates], [data-cta]'));
  const cue = section.querySelector<HTMLElement>('[data-cue]')!;
  const rm = reducedMotion();

  // ---- Entrance: the α resolves in place (under the loader's outline), type settles from wide tracking ----
  onReady(() => {
    if (rm) {
      gsap.set([scene, caption, title, handle, cue, ...extras], { opacity: 1 });
      return;
    }
    const tl = gsap.timeline();
    // the chrome α resolves inside the loader's outline, then the poster's type settles around it
    tl.fromTo(scene, { opacity: 0, filter: 'blur(10px) brightness(1.6)' }, { opacity: 1, filter: 'blur(0px) brightness(1)', duration: 1.5, ease: 'power2.out' }, 0)
      .add(settleTracking(caption, '1.4em', '0.5em'), 0.9)
      .add(settleTracking(title.querySelector('.wipe__text') ?? title, '1.8em', '1em'), 1.2)
      .fromTo(handle, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2 }, 1.9)
      .to(cue, { opacity: 1, duration: 1 }, 2.3);
    if (extras.length) tl.fromTo(extras, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 1.5);
  });

  if (rm) return () => {};

  // ---- Scroll: each line leaves on its own path and speed, as the camera dollies in behind them ----
  //   caption   rises fast and opens its tracking as it blurs away (it was the top of the poster)
  //   title     sinks slower and spreads its letters wide — it feels nearer, passing the camera
  //   handle    drops and fades first
  const titleText = title.querySelector<HTMLElement>('.wipe__text') ?? title;
  gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .fromTo(caption, { y: 0, letterSpacing: '0.5em', filter: 'blur(0px)', opacity: 1 }, { y: () => -window.innerHeight * 0.22, letterSpacing: '1.1em', filter: 'blur(10px)', opacity: 0, ease: 'power1.in', duration: 0.7, immediateRender: false }, 0)
    .fromTo(titleText, { y: 0, letterSpacing: '1em', scale: 1, filter: 'blur(0px)', opacity: 1 }, { y: () => window.innerHeight * 0.12, letterSpacing: '1.6em', scale: 1.12, filter: 'blur(12px)', opacity: 0, ease: 'power1.in', duration: 0.85, immediateRender: false }, 0.05)
    .fromTo(handle, { y: 0, opacity: 1 }, { y: 40, opacity: 0, ease: 'power1.in', duration: 0.35, immediateRender: false }, 0)
    .to(cue, { opacity: 0, ease: 'none', duration: 0.15 }, 0)
    .to(copy, { opacity: 1, duration: 1 }, 0); // keeps the timeline's length = the hero's height

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
