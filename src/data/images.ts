import type { ImageMetadata } from 'astro';

/**
 * The images migrated from the previous site.
 *
 * Each file is named after the page it appeared on, which
 * scripts/optimize-images.mjs derived from the crawl — so the mapping below is
 * the original site's own usage, not a guess about where a picture belongs.
 *
 * Imported eagerly so Astro's image pipeline can generate responsive variants
 * at build time; nothing here reaches the browser as-is.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/images/*.webp',
  { eager: true }
);

const byName = new Map<string, ImageMetadata>();
for (const [path, module] of Object.entries(files)) {
  byName.set(path.split('/').pop()!, module.default);
}

export function image(name: string): ImageMetadata | undefined {
  return byName.get(name);
}

/** Every image whose filename starts with `prefix`, in filename order. */
export function imageSet(prefix: string): ImageMetadata[] {
  return [...byName.entries()]
    .filter(([name]) => name.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, img]) => img);
}

/**
 * Hero image per page, taken from what the original page actually used.
 * Pages not listed here fall back to the flat colour panel.
 */
export const heroImages: Record<string, string> = {
  'english-for-children': 'english-children-01.webp',
  'english-for-teens': 'english-teens-01.webp',
  'english-for-adults': 'english-adults-01.webp',
  'sunday-school': 'saturday-school-01.webp',
  'saturday-school': 'saturday-school-01.webp',
  ielts: 'ielts-01.webp',
  'summer-schools': 'summer-01.webp',
  'study-abroad': 'study-abroad-01.webp',
};

/**
 * The Cambridge partnership card as published on the current site. It is one
 * of the academy's own assets; it is reused here rather than the partner's
 * branding being redrawn.
 */
export const CAMBRIDGE_CARD = 'study-abroad-01.webp';

/** The quiz illustration used in the call-to-action band across the site. */
export const QUIZ_ART = 'home-04.webp';

export const heroFor = (slug: string): ImageMetadata | undefined => {
  const name = heroImages[slug];
  return name ? image(name) : undefined;
};
