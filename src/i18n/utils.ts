import { LOCALES, DEFAULT_LOCALE, SITE_URL, type Locale } from '../data/site';
import { useTranslations } from './ui';

/**
 * URL helpers for the two-locale structure: English lives at the root (/about)
 * and Georgian is prefixed (/ka/about), matching the Wix site Google indexed.
 */

/** Reads the locale out of a pathname. Defaults to English. */
export function localeFromPath(pathname: string): Locale {
  const [, first] = pathname.split('/');
  return (LOCALES as readonly string[]).includes(first) && first !== DEFAULT_LOCALE
    ? (first as Locale)
    : DEFAULT_LOCALE;
}

/**
 * The path the site is served under, without a trailing slash.
 *
 * Empty in production, where levels.ge is served from the domain root. On a
 * GitHub Pages *project* URL the site sits at a subpath
 * (portalmoesd.github.io/levels_website), and every internal link has to carry
 * that prefix or it 404s. Astro exposes it as BASE_URL, set from `base` in
 * astro.config.mjs.
 */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

/**
 * The origin this build is for.
 *
 * Astro exposes the configured `site` as import.meta.env.SITE, which follows
 * the PUBLIC_SITE_URL override. Reading the constant directly would make a
 * preview build emit canonicals pointing at the production domain.
 */
const ORIGIN = (import.meta.env.SITE ?? SITE_URL).replace(/\/+$/, '');

/**
 * True when this build is not the production site — i.e. a github.io preview
 * served from a subpath. Such a build must not be indexable, or it competes
 * with levels.ge for the same content.
 */
export const IS_PREVIEW = BASE !== '' || ORIGIN !== SITE_URL.replace(/\/+$/, '');

/**
 * Builds a path for `slug` in `locale`. The slug is locale-independent — both
 * locales use the same English slugs, as the Wix site does (`/ka/english-for-teens`).
 * Pass an empty slug for the homepage.
 */
export function localePath(slug: string, locale: Locale): string {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const path = clean ? `${prefix}/${clean}` : prefix;
  return `${BASE}${path}` || '/';
}

/**
 * Absolute URL, for canonicals, hreflang, OG tags and the sitemap.
 *
 * Accepts either a bare slug or a path already carrying the base prefix, and
 * does not add the prefix twice.
 */
export function absoluteUrl(pathOrSlug: string): string {
  const withSlash = pathOrSlug.startsWith('/') ? pathOrSlug : `/${pathOrSlug}`;
  const path = BASE && withSlash.startsWith(`${BASE}/`) ? withSlash.slice(BASE.length) : withSlash;
  const full = `${BASE}${path === '/' ? '' : path}`;
  return `${ORIGIN}${full}`;
}

/**
 * The hreflang set for one page: every locale plus x-default.
 *
 * Google requires these to be reciprocal and self-referential — each version
 * must list every version including itself — otherwise the annotations are
 * ignored and the two language versions can be treated as duplicates.
 */
export function alternateLinks(slug: string): { hreflang: string; href: string }[] {
  const langTag: Record<Locale, string> = { en: 'en', ka: 'ka-GE' };
  return [
    ...LOCALES.map((locale) => ({
      hreflang: langTag[locale],
      href: absoluteUrl(localePath(slug, locale)),
    })),
    { hreflang: 'x-default', href: absoluteUrl(localePath(slug, DEFAULT_LOCALE)) },
  ];
}

/** The same page in the other language, for the header's language switch. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ka' : 'en';
}

/** BCP 47 tag for the <html lang> attribute. */
export function htmlLang(locale: Locale): string {
  return locale === 'ka' ? 'ka-GE' : 'en';
}

export { useTranslations, DEFAULT_LOCALE, LOCALES };
export type { Locale };
