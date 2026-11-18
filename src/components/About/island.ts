import { gsap, ScrollTrigger, reducedMotion, soft } from '@/lib/motion/core';
import { softBlock, softLines } from '@/lib/motion/reveal';
import { smoothstep } from '@/components/Stage/stations';

/** Phones (and no reduced motion): the pillars are a pinned tour — must match the media query in About.astro. */
export const TOUR_QUERY = '(max-width: 760px) and (prefers-reduced-motion: no-preference)';

/**
 * The pinned programme tour (doyourdesign studio-tour pattern): the block is several screens tall,
 * its inner pin is sticky, and the scroll position picks one chapter. A chapter holds for most of its
 * share of the scroll, then hands over: out = fade + shrink + rise + blur, in = the reverse from below.
 */
function tour(block: HTMLElement): void {
  const slides = Array.from(block.querySelectorAll<HTMLElement>('[data-pillar]'));
  const count = block.querySelector<HTMLElement>('[data-tour-count]');
  const n = slides.length;
  let current = -1;
  const render = (progress: number) => {
    const p = progress * n;
    slides.forEach((slide, i) => {
      // distance from this chapter's centre, in chapters; the first/last stay put at the ends
      let d = p - (i + 0.5);
      if (i === 0) d = Math.max(d, 0);
      if (i === n - 1) d = Math.min(d, 0);
      const v = 1 - smoothstep((Math.abs(d) - 0.3) / 0.2); // 1 while held, 0 once handed over
      slide.style.visibility = v > 0.001 ? 'visible' : 'hidden';
      slide.style.opacity = v.toFixed(3);
      slide.style.transform = `translate3d(0, ${(-d * 140).toFixed(1)}px, 0) scale(${(0.95 + 0.05 * v).toFixed(4)})`;
      slide.style.filter = v > 0.995 ? 'none' : `blur(${((1 - v) * 12).toFixed(1)}px)`;
    });
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p)));
    if (idx !== current) {
      current = idx;
      slides.forEach((s, i) => s.classList.toggle('is-current', i === idx));
      if (count) count.textContent = String(idx + 1).padStart(2, '0');
    }
  };
  render(0);
  ScrollTrigger.create({ trigger: block, start: 'top top', end: 'bottom bottom', onUpdate: (self) => render(self.progress), onRefresh: (self) => render(self.progress) });
}

export default function about(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((p) => softLines(p));
  const pillars = section.querySelector<HTMLElement>('[data-tour]')!;
  if (window.matchMedia(TOUR_QUERY).matches) tour(pillars);
  else section.querySelectorAll<HTMLElement>('[data-pillar], [data-pillar-caption]').forEach((el) => softBlock(el, { out: true }));

  const words = Array.from(section.querySelectorAll<HTMLElement>('[data-word]'));
  if (reducedMotion()) {
    gsap.set(words, { opacity: 1 });
    return;
  }
  // statement: each word focuses in on its own beat, then the line dissolves as the camera exits the bowl
  const statement = section.querySelector<HTMLElement>('.statement')!;
  gsap.fromTo(words, { opacity: 0, ...soft(16) }, {
    opacity: 1, ...soft(0), ease: 'none', stagger: { each: 0.06, from: 'random' },
    scrollTrigger: { trigger: statement, start: 'top 75%', end: 'center 55%', scrub: 0.8 },
  });
  gsap.to(words, {
    opacity: 0, ...soft(12), ease: 'none', stagger: { each: 0.04, from: 'random' }, immediateRender: false,
    scrollTrigger: { trigger: statement, start: 'center 35%', end: 'bottom 20%', scrub: 0.8 },
  });
}
