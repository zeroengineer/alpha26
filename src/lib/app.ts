/**
 * Global client entry, loaded once from Layout.astro.
 * Keeps the always-on behaviour tiny: smooth scroll + preloader. Section behaviour lives in islands.
 */
import { defineIsland } from './island';
import { initLenis } from './motion/lenis';
import { markRevealed } from './motion/core';

initLenis();

const preloader = document.querySelector<HTMLElement>('[data-preloader]');
if (preloader) {
  defineIsland('[data-preloader]', () => import('@/components/Preloader/island'), { strategy: 'load' });
} else {
  markRevealed();
}
