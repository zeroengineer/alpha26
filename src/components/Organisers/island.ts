import { gsap, reducedMotion, soft } from '@/lib/motion/core';
import { getLenis } from '@/lib/motion/lenis';
import { softBlock, softLines } from '@/lib/motion/reveal';

export default function organisers(section: HTMLElement): void {
  const rm = reducedMotion();
  section.querySelectorAll<HTMLElement>('[data-block-title]').forEach((t) => softLines(t));
  section.querySelectorAll<HTMLElement>('.block__head .section-no, [data-team-card], .event__media, .event__body, [data-gallery-item]').forEach((el) => softBlock(el, { out: true }));

  // event images open up from a slight zoom as they pass (depth cue)
  if (!rm) {
    section.querySelectorAll<HTMLElement>('.event__media img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // ---- Lightbox ----
  const dialog = section.querySelector<HTMLDialogElement>('[data-lightbox]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-lightbox-img]')!;
  const cap = dialog.querySelector<HTMLElement>('[data-lightbox-cap]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lightbox-count]')!;
  const openers = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-lightbox-open]'));
  let current = 0;
  let lastOpener: HTMLElement | null = null;

  const show = (i: number) => {
    current = (i + openers.length) % openers.length;
    const btn = openers[current];
    img.src = btn.dataset.full!;
    img.alt = btn.dataset.alt ?? '';
    cap.textContent = btn.dataset.alt ?? '';
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(openers.length).padStart(2, '0')}`;
    if (!rm) gsap.fromTo(img, { opacity: 0, ...soft(10) }, { opacity: 1, ...soft(0), duration: 0.6 });
  };
  const open = (i: number, opener: HTMLElement) => {
    lastOpener = opener;
    show(i);
    dialog.showModal();
    getLenis()?.stop();
    document.documentElement.style.overflow = 'hidden';
  };
  openers.forEach((btn) => btn.addEventListener('click', () => open(Number(btn.dataset.lightboxOpen), btn)));
  dialog.querySelector('[data-lightbox-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]')!.addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lightbox-next]')!.addEventListener('click', () => show(current + 1));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  dialog.addEventListener('close', () => {
    getLenis()?.start();
    document.documentElement.style.overflow = '';
    lastOpener?.focus();
  });
}
