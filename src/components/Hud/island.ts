import { gsap, onReveal, reducedMotion } from '@/lib/motion/core';
import { scrambleIn } from '@/lib/motion/reveal';

export default function hud(root: HTMLElement): () => void {
  if (!window.matchMedia('(min-width: 1100px) and (hover: hover)').matches) return () => {};
  const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-hud-line]'));
  const clock = root.querySelector<HTMLElement>('[data-clock]');
  const xEl = root.querySelector<HTMLElement>('[data-hud-x]')!;
  const yEl = root.querySelector<HTMLElement>('[data-hud-y]')!;

  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { if (clock) clock.textContent = `IST — ${fmt.format(new Date())}`; };
  const clockId = window.setInterval(tickClock, 1000);

  onReveal(() => {
    if (reducedMotion()) { gsap.set([lines, xEl, yEl], { opacity: 1 }); tickClock(); return; }
    const tl = gsap.timeline({ delay: 1.2 });
    lines.forEach((l, i) => tl.add(scrambleIn(l, { duration: 1 }), i * 0.12));
    tl.to([xEl, yEl], { opacity: 1, duration: 0.8 }, 0.8).call(tickClock);
  });

  const pad = (n: number) => String(Math.round(n)).padStart(4, '0');
  const onMove = (e: PointerEvent) => { xEl.textContent = `X: ${pad(e.clientX)}`; yEl.textContent = `Y: ${pad(e.clientY)}`; };
  window.addEventListener('pointermove', onMove, { passive: true });

  return () => { clearInterval(clockId); window.removeEventListener('pointermove', onMove); };
}
