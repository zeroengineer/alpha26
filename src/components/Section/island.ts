import { softBlock, softLines } from '@/lib/motion/reveal';

/** Chapter head: eyebrow and heading focus in as they arrive, and blur away as they leave. */
export default function section(el: HTMLElement): void {
  const eyebrow = el.querySelector<HTMLElement>('[data-section-eyebrow]');
  const title = el.querySelector<HTMLElement>('[data-section-title]');
  if (eyebrow) softBlock(eyebrow, { out: true });
  if (title) softLines(title);
}
