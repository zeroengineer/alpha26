import { gsap, Observer, ScrollTrigger, reducedMotion } from '@/lib/motion/core';
import { getLenis, scrollToTarget } from '@/lib/motion/lenis';
import { lettersIn, scrambleIn, wipeIn } from '@/lib/motion/reveal';
import { sceneBus } from '@/lib/scene-bus';
import { heroEntrance, pointerTracker } from './hero-shared';
import { nextStep, LAST_STEP } from './steps';

export default function hero(section: HTMLElement): () => void {
  const scene = section.querySelector<HTMLElement>('[data-scene]')!;
  const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-depth]'));
  const slats = Array.from(section.querySelectorAll<HTMLElement>('[data-slat]'));
  const slatLayer = section.querySelector<HTMLElement>('[data-slats]')!;
  const sweep = section.querySelector<HTMLElement>('[data-sweep]')!;
  const copy = section.querySelector<HTMLElement>('[data-hero-copy]')!;
  const facts = section.querySelector<HTMLElement>('[data-hero-scene="1"]')!;
  const factValues = Array.from(section.querySelectorAll<HTMLElement>('[data-letters]'));
  const factLabels = Array.from(section.querySelectorAll<HTMLElement>('[data-fact-label]'));
  const statement = section.querySelector<HTMLElement>('[data-statement]')!;
  const statementWrap = section.querySelector<HTMLElement>('[data-hero-scene="2"]')!;
  const progress = section.querySelector<HTMLElement>('[data-hero-progress]')!;
  const ticks = Array.from(section.querySelectorAll<HTMLElement>('[data-tick]'));
  const count = section.querySelector<HTMLElement>('[data-step-count]')!;
  const hint = section.querySelector<HTMLElement>('[data-hint]')!;
  const rm = reducedMotion();

  // ---- Entrance (after the preloader) ----
  heroEntrance(section, (tl) => {
    tl.to(scene, { opacity: 1, scale: 1, duration: 1.8, ease: 'power3.out' }, 0)
      .to(slats, { scaleY: 1, duration: 1.2, ease: 'power4.out', stagger: { each: 0.07, from: 'center' } }, 0.5)
      .to(progress, { opacity: 1, duration: 0.8 }, 1.6);
    if (!rm) tl.add(gsap.to(sweep, { xPercent: 240, duration: 2.4, ease: 'power2.inOut', repeat: -1, repeatDelay: 5 }), 1.2);
  });

  // ---- Cursor parallax ----
  const pointer = pointerTracker(section);
  const setters = layers.map((l) => ({
    depth: Number(l.dataset.depth),
    x: gsap.quickTo(l, 'x', { duration: 0.6, ease: 'power3' }),
    y: gsap.quickTo(l, 'y', { duration: 0.6, ease: 'power3' }),
  }));
  const tilt = gsap.quickTo(slatLayer, 'rotationY', { duration: 0.8, ease: 'power3' });
  gsap.set(slatLayer, { transformPerspective: 1200 });
  const tick = () => {
    setters.forEach((s) => { s.x(pointer.x * 18 * s.depth); s.y(pointer.y * 12 * s.depth); });
    tilt(pointer.x * -4);
  };
  gsap.ticker.add(tick);

  if (rm) {
    // No sequence: scenes are already visible in flow (CSS). Reveal the statement text statically.
    wipeIn(statement);
    return () => { gsap.ticker.remove(tick); pointer.dispose(); };
  }

  // ---- Stepped sequence ----
  let step = 0;
  let animating = false;
  let finished = false;
  const SCENE_STATE = [
    { brightness: 1, scale: 1, slat: 0 },
    { brightness: 0.25, scale: 1.08, slat: 70 },
    { brightness: 0.06, scale: 1.14, slat: 120 },
  ];

  const setProgress = (n: number) => {
    ticks.forEach((t, i) => t.classList.toggle('is-active', i <= n));
    count.textContent = String(n + 1).padStart(2, '0');
    hint.textContent = n === LAST_STEP ? 'Scroll to continue' : 'Scroll';
    sceneBus.set('hero', n / LAST_STEP);
  };

  const posterTo = (n: number, tl: gsap.core.Timeline) => {
    const s = SCENE_STATE[n];
    tl.to(scene, { filter: `brightness(${s.brightness})`, scale: s.scale, duration: 1.1, ease: 'power4.inOut' }, 0);
    slats.forEach((el, i) => tl.to(el, { y: (i % 2 ? -1 : 1) * s.slat, duration: 1.1, ease: 'power4.inOut' }, 0));
  };

  const showFacts = (tl: gsap.core.Timeline) => {
    tl.set(facts, { visibility: 'visible', opacity: 1 }, 0.3);
    factValues.forEach((v, i) => tl.add(lettersIn(v), 0.35 + i * 0.14));
    factLabels.forEach((l, i) => tl.add(scrambleIn(l, { duration: 0.9 }), 0.6 + i * 0.14));
  };
  const hideFacts = (tl: gsap.core.Timeline) => {
    tl.to(facts, { opacity: 0, y: -24, duration: 0.5, ease: 'power3.in' }, 0)
      .set(facts, { visibility: 'hidden', y: 0 });
  };
  const showStatement = (tl: gsap.core.Timeline) => {
    tl.set(statementWrap, { visibility: 'visible', opacity: 1 }, 0.4).add(wipeIn(statement), 0.45);
  };
  const hideStatement = (tl: gsap.core.Timeline) => {
    tl.to(statementWrap, { opacity: 0, y: -24, duration: 0.5, ease: 'power3.in' }, 0)
      .set(statementWrap, { visibility: 'hidden', y: 0 })
      .set(statement.querySelector('.wipe__text'), { clipPath: 'inset(0 100% 0 0)' });
  };

  const goTo = (n: number) => {
    if (animating || n === step) return;
    animating = true;
    const from = step;
    step = n;
    const tl = gsap.timeline({ onComplete: () => { animating = false; } });
    posterTo(n, tl);
    if (from === 0) tl.to(copy, { opacity: 0, y: -40, duration: 0.6, ease: 'power3.in' }, 0);
    if (n === 0) tl.to(copy, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.4);
    if (from === 1) hideFacts(tl);
    if (from === 2) hideStatement(tl);
    if (n === 1) showFacts(tl);
    if (n === 2) showStatement(tl);
    setProgress(n);
  };

  // Lenis has its own wheel listener, so preventDefault alone would not stop smooth scrolling:
  // the sequence parks Lenis while it owns the gesture.
  const release = () => {
    if (finished) return;
    finished = true;
    observer.disable();
    getLenis()?.start();
    scrollToTarget('#about');
  };
  const finishInstantly = () => {
    if (finished) return;
    finished = true;
    observer.disable();
    getLenis()?.start();
  };
  const rearm = () => {
    if (!finished) return;
    finished = false;
    observer.enable();
    getLenis()?.stop();
  };

  const gesture = (dir: 1 | -1) => {
    if (animating) return;
    const next = nextStep(step, dir);
    if (next === 'release') release();
    else if (next !== step) goTo(next);
  };

  const observer = Observer.create({
    target: window,
    type: 'wheel,touch',
    tolerance: 10,
    preventDefault: true,
    onChangeY: (self) => {
      if (self.event.type.startsWith('touch')) gesture(self.deltaY < 0 ? 1 : -1); // swipe up = forward
      else gesture(self.deltaY > 0 ? 1 : -1);
    },
  });

  const onKey = (e: KeyboardEvent) => {
    if (finished) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); gesture(1); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); gesture(-1); }
  };
  window.addEventListener('keydown', onKey);

  // Nav clicks and hash deep links skip the sequence.
  const onNavClick = (e: Event) => {
    const link = (e.target as Element).closest<HTMLElement>('[data-nav-link]');
    if (link && link.dataset.navLink !== 'hero') finishInstantly();
  };
  document.addEventListener('click', onNavClick, true);
  if (location.hash && location.hash !== '#hero') finishInstantly();

  // Re-arm when the visitor scrolls back to the very top (the next gesture steps back from scene 2).
  const st = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (finished && self.scroll() <= 1 && self.direction === -1) {
        if (step !== LAST_STEP) goTo(LAST_STEP);
        rearm();
      }
    },
  });

  setProgress(0);
  if (!finished) getLenis()?.stop();

  return () => {
    getLenis()?.start();
    gsap.ticker.remove(tick);
    pointer.dispose();
    observer.kill();
    st.kill();
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onNavClick, true);
  };
}
