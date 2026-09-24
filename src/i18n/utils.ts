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
 * Builds a path for `slug` in `locale`. The slug is locale-independent — both
 * locales use the same English slugs, as the Wix site does (`/ka/english-for-teens`).
 * Pass an empty slug for the homepage.
 */
export function localePath(slug: string, locale: Locale): string {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return clean ? `${prefix}/${clean}` : prefix || '/';
}

/** Absolute URL, for canonicals, hreflang, OG tags and the sitemap. */
export function absoluteUrl(pathOrSlug: string): string {
  const path = pathOrSlug.startsWith('/') ? pathOrSlug : `/${pathOrSlug}`;
  return `${SITE_URL}${path === '/' ? '' : path}`;
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
