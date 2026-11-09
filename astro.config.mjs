// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static output for Cloudflare Pages (build: `npm run build`, output dir: `dist`).
export default defineConfig({
  site: 'https://alpha26.pages.dev',
  output: 'static',
  integrations: [sitemap()],
  trailingSlash: 'never',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
  image: {
    // Sharp is Astro's default service; AVIF/WebP generated from src/assets sources.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
    // Pre-bundle the lazily imported libraries so the dev server never 504s on first discovery.
    optimizeDeps: {
      include: ['three', 'gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'gsap/ScrambleTextPlugin', 'gsap/Observer', 'lenis'],
    },
  },
});
