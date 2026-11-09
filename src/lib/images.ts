import type { ImageMetadata } from 'astro';

/**
 * Resolves a bare filename from the JSON content (e.g. "pexels-2774556.jpg") to an imported image so
 * astro:assets can optimise it. Real event photos go in src/assets/gallery/ and resolve the same way,
 * so swapping the placeholders is a file drop + a JSON edit.
 */
const sources = import.meta.glob<{ default: ImageMetadata }>(
  ['/src/assets/placeholders/*.{jpg,jpeg,png,webp,avif}', '/src/assets/gallery/*.{jpg,jpeg,png,webp,avif}'],
  { eager: true },
);

export function resolveImage(src: string): ImageMetadata {
  const hit = Object.entries(sources).find(([path]) => path.endsWith(`/${src}`));
  if (!hit) {
    throw new Error(`Image "${src}" was not found in src/assets/placeholders or src/assets/gallery.`);
  }
  return hit[1].default;
}
