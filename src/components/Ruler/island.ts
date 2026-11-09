import { ScrollTrigger } from '@/lib/motion/core';
import { SECTIONS } from '@/lib/nav';

export default function ruler(el: HTMLElement): void {
  const marker = el.querySelector<HTMLElement>('[data-ruler-marker]')!;
  const label = el.querySelector<HTMLElement>('[data-ruler-label]')!;
  const scale = marker.parentElement!;
  const labels = new Map(SECTIONS.map((s) => [s.id, s.label]));
  const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter((s): s is HTMLElement => !!s);

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      marker.style.transform = `translateX(${self.progress * (scale.clientWidth - 1)}px)`;
      const mid = window.innerHeight * 0.5;
      let current = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= mid) current = s;
      const text = labels.get(current?.id ?? 'hero') ?? '';
      if (label.textContent !== text) label.textContent = text;
    },
  });
}
