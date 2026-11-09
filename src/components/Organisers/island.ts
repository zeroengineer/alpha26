import { gsap, reducedMotion } from '@/lib/motion/core';
import { getLenis } from '@/lib/motion/lenis';
import { createSlider } from '@/lib/slider';

export default function organisers(section: HTMLElement): () => void {
  const team = section.querySelector<HTMLElement>('[data-organisers]')!;
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-team-card]'));
  const sliderRoot = section.querySelector<HTMLElement>('[data-slider]')!;
  const galleryItems = Array.from(section.querySelectorAll<HTMLElement>('[data-gallery-item]'));
  const rm = reducedMotion();

  // --- Reveals ---
  if (rm) {
    gsap.set([cards, galleryItems], { opacity: 1 });
  } else {
    gsap.fromTo(cards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: team, start: 'top 85%', once: true } });
    gsap.fromTo(galleryItems, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: { each: 0.06, grid: 'auto', from: 'start' }, ease: 'power3.out', scrollTrigger: { trigger: galleryItems[0], start: 'top 88%', once: true } });
  }

  // --- Track Record slider: the active slide's text rises in each time it lands ---
  const slider = createSlider(sliderRoot, {
    scope: sliderRoot.closest<HTMLElement>('.block') ?? sliderRoot,
    onChange(_, __, slide) {
      if (rm) return;
      const body = slide.querySelector<HTMLElement>('[data-slide-body]');
      if (body) gsap.fromTo(body.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out', overwrite: true });
    },
  });

  // --- Lightbox ---
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
    if (!rm) gsap.fromTo(img, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
  };
  const open = (i: number, opener: HTMLElement) => {
    lastOpener = opener;
    show(i);
    dialog.showModal();
    getLenis()?.stop();
    document.documentElement.style.overflow = 'hidden';
  };
  const close = () => dialog.close();

  openers.forEach((btn) => btn.addEventListener('click', () => open(Number(btn.dataset.lightboxOpen), btn)));
  dialog.querySelector('[data-lightbox-close]')!.addEventListener('click', close);
  dialog.querySelector('[data-lightbox-prev]')!.addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lightbox-next]')!.addEventListener('click', () => show(current + 1));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  dialog.addEventListener('close', () => {
    getLenis()?.start();
    document.documentElement.style.overflow = '';
    lastOpener?.focus();
  });

  return () => slider.destroy();
}
