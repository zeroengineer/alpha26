import { softBlock } from '@/lib/motion/reveal';

export default function prelude(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>('[data-soft]').forEach((n) => softBlock(n, { out: true }));
}
