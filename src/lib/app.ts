/**
 * Global client entry, loaded once from Layout.astro.
 * Keeps the always-on behaviour tiny: smooth scroll + preloader. Section behaviour lives in islands.
 */
import { defineIsland } from './island';
import { initLenis } from './motion/lenis';
import { markRevealed, onReveal } from './motion/core';
import { initStacking } from './motion/stack';

initLenis();

const preloader = document.querySelector<HTMLElement>('[data-preloader]');
if (preloader) {
  defineIsland('[data-preloader]', () => import('@/components/Preloader/island'), { strategy: 'load' });
} else {
  markRevealed();
}

// Scenes stack once the page is revealed (pins are measured after fonts/images have settled).
onReveal(() => requestAnimationFrame(() => initStacking()));
