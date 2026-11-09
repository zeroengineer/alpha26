// @ts-check
import { defineConfig } from 'astro/config';

// Static output for Cloudflare Pages (build: `npm run build`, output dir: `dist`).
export default defineConfig({
  site: 'https://alpha26.pages.dev',
  output: 'static',
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
  },
});
