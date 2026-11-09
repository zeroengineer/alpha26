import { gsap, reducedMotion } from '@/lib/motion/core';
import { softBlock } from '@/lib/motion/reveal';

export default function speakers(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-slide], .block__lede').forEach((el) => softBlock(el, { out: true }));
  const sessions = Array.from(section.querySelectorAll<HTMLElement>('[data-session]'));
  if (reducedMotion()) gsap.set(sessions, { opacity: 1 });
  else sessions.forEach((el) => softBlock(el));
}
