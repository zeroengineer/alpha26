import { gsap, reducedMotion } from '@/lib/motion/core';
import { getLenis } from '@/lib/motion/lenis';
import { wipeBlock } from '@/lib/motion/reveal';

export default function organisers(section: HTMLElement): void {
  const team = section.querySelector<HTMLElement>('[data-organisers]')!;
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-team-card]'));
  const frames = Array.from(section.querySelectorAll<HTMLElement>('[data-gallery-item]'));
  const rm = reducedMotion();

  // --- Reveals: cards and frames sweep in with the block wipe ---
  if (rm) {
    gsap.set([cards, frames], { opacity: 1 });
  } else {
    gsap.timeline({ scrollTrigger: { trigger: team, start: 'top 85%', once: true } }).add(cards.map((c, i) => wipeBlock(c, { delay: i * 0.15 })));
    gsap.timeline({ scrollTrigger: { trigger: frames[0], start: 'top 88%', once: true } }).add(frames.map((f, i) => wipeBlock(f, { delay: i * 0.07 })));
  }

  // --- Lightbox with event details ---
  const dialog = section.querySelector<HTMLDialogElement>('[data-lightbox]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-lightbox-img]')!;
  const eventEl = dialog.querySelector<HTMLElement>('[data-lightbox-event]')!;
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
    eventEl.textContent = `${btn.dataset.event ?? ''} — ${btn.dataset.year ?? ''}`;
    cap.textContent = btn.dataset.detail ?? btn.dataset.alt ?? '';
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
}
