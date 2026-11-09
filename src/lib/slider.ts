/**
 * Horizontal slider primitive (Track Record, and later the speakers lineup).
 * Native scroll-snap for trackpad/touch + accessibility, with pointer drag for mouse users,
 * prev/next buttons, keyboard arrows, an "01 —— 04" counter and a progress rule.
 *
 * Markup contract (data attributes):
 *   [data-slider]            root (focusable)
 *   [data-slider-track]      scroll container; direct children are slides
 *   [data-slider-prev/next]  buttons (optional)
 *   [data-slider-current]    current index text, [data-slider-total] total (optional)
 *   [data-slider-progress]   element scaled on X from 0 to 1 (optional)
 */
import { reducedMotion } from './motion/core';

export interface SliderApi {
  index: number;
  goTo(i: number): void;
  next(): void;
  prev(): void;
  destroy(): void;
}

export interface SliderOptions {
  onChange?(index: number, total: number, slide: HTMLElement): void;
  /** Element to search for counter/progress/buttons when they live outside the slider root (default: root). */
  scope?: HTMLElement;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function createSlider(root: HTMLElement, { onChange, scope = root }: SliderOptions = {}): SliderApi {
  const track = root.querySelector<HTMLElement>('[data-slider-track]')!;
  const slides = Array.from(track.children) as HTMLElement[];
  const prevBtn = scope.querySelector<HTMLButtonElement>('[data-slider-prev]');
  const nextBtn = scope.querySelector<HTMLButtonElement>('[data-slider-next]');
  const current = scope.querySelector<HTMLElement>('[data-slider-current]');
  const total = scope.querySelector<HTMLElement>('[data-slider-total]');
  const progress = scope.querySelector<HTMLElement>('[data-slider-progress]');
  const n = slides.length;
  let index = -1;
  let raf = 0;

  if (total) total.textContent = pad(n);

  /** Scroll position that puts slide i at the track's padded left edge. */
  const leftOf = (i: number) => {
    const padding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    return track.scrollLeft + slides[i].getBoundingClientRect().left - track.getBoundingClientRect().left - padding;
  };
  const nearest = () => {
    const x = track.scrollLeft;
    let best = 0;
    let bestD = Infinity;
    slides.forEach((_, i) => {
      const d = Math.abs(leftOf(i) - x);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  const update = () => {
    const i = nearest();
    if (i === index) return;
    index = i;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (current) current.textContent = pad(i + 1);
    if (progress) progress.style.transform = `scaleX(${n > 1 ? i / (n - 1) : 1})`;
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i === n - 1;
    onChange?.(i, n, slides[i]);
  };

  const goTo = (i: number) => {
    const target = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: leftOf(target), behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  };

  // --- Pointer drag (mouse). Touch keeps native scrolling. ---
  let dragging = false;
  let moved = 0;
  let startX = 0;
  let startLeft = 0;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    track.scrollLeft = startLeft - dx;
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    track.releasePointerCapture(e.pointerId);
    goTo(nearest());
  };
  // Swallow the click that follows a drag so links inside slides don't fire.
  const onClick = (e: MouseEvent) => {
    if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('pointerdown', onDown);
  track.addEventListener('pointermove', onMove);
  track.addEventListener('pointerup', onUp);
  track.addEventListener('pointercancel', onUp);
  track.addEventListener('click', onClick, true);
  root.addEventListener('keydown', onKey);
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);
  update();

  return {
    get index() { return index; },
    goTo, next, prev,
    destroy() {
      cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onUp);
      track.removeEventListener('click', onClick, true);
      root.removeEventListener('keydown', onKey);
      prevBtn?.removeEventListener('click', prev);
      nextBtn?.removeEventListener('click', next);
    },
  };
}
