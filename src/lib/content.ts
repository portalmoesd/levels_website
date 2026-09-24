import type { Locale } from '../data/site';

/**
 * Access to the page copy generated from the Wix crawl by
 * scripts/build-content.mjs.
 *
 * The JSON is imported eagerly at build time. Nothing here runs in the browser.
 */

export interface PageSection {
  key: string;
  heading: Record<Locale, string>;
  body: Record<Locale, string[]>;
}

export interface PageContent {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  header: Record<Locale, string[]>;
  meta: Record<Locale, Record<string, unknown>>;
  sections: PageSection[];
}

const modules = import.meta.glob<PageContent>('../content/pages/*.json', {
  eager: true,
  import: 'default',
});

const pages = new Map<string, PageContent>();
for (const [path, page] of Object.entries(modules)) {
  const slug = path.split('/').pop()!.replace(/\.json$/, '');
  pages.set(slug, page);
}

export function getPage(slug: string): PageContent | undefined {
  return pages.get(slug);
}

/** Returns one section's paragraphs, falling back to English if untranslated. */
export function section(slug: string, key: string, locale: Locale): string[] {
  const found = getPage(slug)?.sections.find((s) => s.key === key);
  if (!found) return [];
  const body = found.body[locale];
  return body.length ? body : found.body.en;
}

export function sectionHeading(slug: string, key: string, locale: Locale): string {
  const found = getPage(slug)?.sections.find((s) => s.key === key);
  if (!found) return '';
  return found.heading[locale] || found.heading.en;
}

/** Every section a page has, in source order, with locale already resolved. */
export function sections(
  slug: string,
  locale: Locale
): { key: string; heading: string; body: string[] }[] {
  const page = getPage(slug);
  if (!page) return [];
  return page.sections
    .map((s) => ({
      key: s.key,
      heading: s.heading[locale] || s.heading.en,
      body: s.body[locale].length ? s.body[locale] : s.body.en,
    }))
    .filter((s) => s.body.length > 0);
}

/**
 * Splits a section into prose paragraphs and list items.
 *
 * The Wix pages mix the two freely inside one section: a couple of sentences of
 * introduction followed by bullet points. Short fragments that do not end in
 * sentence punctuation are treated as list items, which matches how the
 * original pages present them.
 */
export function splitProse(body: string[]): { lead: string[]; items: string[] } {
  const lead: string[] = [];
  const items: string[] = [];

  for (const block of body) {
    const looksLikeBullet =
      block.length < 220 && !/[.!?…]$/.test(block.trim()) && !/^[A-Z][a-z]+ \d/.test(block);
    if (looksLikeBullet || items.length > 0) items.push(block);
    else lead.push(block);
  }

  // A section that is entirely prose should not be rendered as a one-item list.
  if (items.length === 1 && lead.length === 0) return { lead: items, items: [] };
  return { lead, items };
}
