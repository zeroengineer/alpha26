import { gsap, onReady, reducedMotion, isTouch, SplitText, soft } from '@/lib/motion/core';
import { settleTracking } from '@/lib/motion/reveal';

export default function hero(section: HTMLElement): () => void {
  const frame = section.querySelector<HTMLElement>('[data-hero-frame]')!;
  const scene = section.querySelector<HTMLElement>('[data-scene]')!;
  const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-depth]'));
  const copy = section.querySelector<HTMLElement>('[data-hero-copy]')!;
  const caption = section.querySelector<HTMLElement>('[data-caption]')!;
  const title = section.querySelector<HTMLElement>('[data-title]')!;
  const extras = Array.from(section.querySelectorAll<HTMLElement>('[data-dates], [data-cta]'));
  const cue = section.querySelector<HTMLElement>('[data-cue]')!;
  const rm = reducedMotion();

  const capTrack = getComputedStyle(caption).letterSpacing;
  const titleTrack = getComputedStyle(title).letterSpacing;

  // ---- Entrance: the α resolves in place (under the loader's outline), type settles from wide tracking ----
  onReady(() => {
    if (rm) {
      gsap.set([scene, caption, title, cue, ...extras], { opacity: 1 });
      return;
    }
    const tl = gsap.timeline();
    // the chrome α resolves inside the loader's outline, then the poster's type settles around it
    tl.fromTo(scene, { opacity: 0, ...soft(10) }, { opacity: 1, ...soft(0), duration: 1.5, ease: 'power2.out' }, 0)
      // settle to whatever tracking the CSS sets for this viewport (tighter on phones)
      .add(settleTracking(caption, `${parseFloat(capTrack) * 2.6}px`, capTrack), 0.9)
      .add(settleTracking(title, `${parseFloat(titleTrack) * 1.8}px`, titleTrack), 1.2)
      .to(cue, { opacity: 1, duration: 1 }, 2.3);
    if (extras.length) tl.fromTo(extras, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 1.5);
  });

  if (rm) return () => {};

  // ---- Scroll: the type disperses letter by letter while the hero holds still (sticky) ----
  //   caption       letters lift and blur away, from the centre outwards
  //   COMING SOON   letters scatter outward along their own line, blurring — never crossing the α
  // The split happens after the entrance has settled, so the two never fight over the same props.
  const scrollTl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.7 } });
  scrollTl.to(cue, { opacity: 0, ease: 'none', duration: 0.12 }, 0)
    .to(copy, { opacity: 1, duration: 1 }, 0); // spans the whole sticky stretch
  onReady(() => {
    setTimeout(() => {
      const capSplit = SplitText.create(caption, { type: 'chars', charsClass: 'char' });
      const titleSplit = SplitText.create(title, { type: 'chars', charsClass: 'char' });
      const centre = (chars: Element[]) => {
        const rects = chars.map((c) => c.getBoundingClientRect());
        const mid = (Math.min(...rects.map((r) => r.left)) + Math.max(...rects.map((r) => r.right))) / 2;
        return rects.map((r) => (r.left + r.width / 2 - mid));
      };
      const capOff = centre(capSplit.chars);
      const titleOff = centre(titleSplit.chars);
      scrollTl.to(capSplit.chars, {
        y: () => -window.innerHeight * 0.14,
        x: (i: number) => capOff[i] * 0.18,
        opacity: 0, ...soft(8), ease: 'power2.in', duration: 0.55,
        stagger: { each: 0.012, from: 'center' },
      }, 0.02)
        .to(titleSplit.chars, {
          x: (i: number) => titleOff[i] * 0.55,
          y: (i: number) => (i % 2 ? 1 : -1) * 6,
          opacity: 0, ...soft(10), ease: 'power2.in', duration: 0.7,
          stagger: { each: 0.02, from: 'edges' },
        }, 0.12);
      scrollTl.scrollTrigger?.refresh();
    }, 2600); // after the entrance's tracking settle
  });

  // Fallback until (or unless) the live scene exists: the raster poster recedes as before.
  const recede = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } })
    .to(frame, { scale: 0.82, opacity: 0, ...soft(6), ease: 'none' }, 0);

  // Hand-over: the live scene opens in exactly the poster's composition, so the raster simply
  // dissolves into it in place; from then on scrolling moves the camera, not a picture.
  const handOver = () => {
    recede.scrollTrigger?.kill();
    recede.kill();
    gsap.to(frame, { opacity: 0, scale: 1, ...soft(0), duration: 1.4, ease: 'power2.inOut', onComplete: () => { frame.style.visibility = 'hidden'; } });
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
