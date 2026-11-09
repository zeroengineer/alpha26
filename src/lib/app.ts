/**
 * Global client entry, loaded once from Layout.astro.
 * Smooth scroll, depth parallax, the scroll ruler, and the "ready" handshake (no preloader).
 */
import { initLenis } from './motion/lenis';
import { markReady, onReady, ScrollTrigger } from './motion/core';
import { initParallax } from './motion/parallax';

initLenis();

const ready = () => requestAnimationFrame(() => markReady());
if (document.fonts?.ready) document.fonts.ready.then(ready);
else window.addEventListener('load', ready, { once: true });
// never hold the page hostage to a slow font
setTimeout(markReady, 1500);

// Parallax triggers are set up when the main thread is idle, after first paint.
onReady(() => {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const run = () => { initParallax(); ScrollTrigger.refresh(); };
  if (idle) idle(run, { timeout: 2000 });
  else setTimeout(run, 300);
});
