/** Brand, contact and locale configuration. Single source of truth for the site. */

export const LOCALES = ['en', 'ka'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Production origin. Used for canonicals, hreflang, sitemap and OG urls. */
export const SITE_URL = 'https://www.levels.ge';

export const site = {
  name: 'Levels Academy',
  founded: 2018,
  phone: '+995 32 2 18 06 05',
  phoneDisplay: '032 2 18 06 05',
  /** E.164, for tel: links and Meta advanced matching. */
  phoneE164: '+995322180605',
  email: 'info@levels.ge',
  whatsapp: '995322180605',
} as const;

export const branches = [
  {
    id: 'vake',
    name: { en: 'Vake', ka: 'ვაკე' },
    street: { en: '29g Chavchavadze Avenue', ka: '29გ ჭავჭავაძის გამზირი' },
    locality: { en: 'Tbilisi', ka: 'თბილისი' },
    postalCode: '0179',
    geo: { lat: 41.7092, lng: 44.7626 },
  },
  {
    id: 'krtsanisi',
    name: { en: 'Krtsanisi', ka: 'კრწანისი' },
    street: { en: '35 Krtsanisi Street, Turn II', ka: '35 კრწანისის ქუჩა, II შესახვევი' },
    locality: { en: 'Tbilisi', ka: 'თბილისი' },
    postalCode: '0114',
    geo: { lat: 41.6795, lng: 44.8156 },
  },
] as const;

/**
 * Social profile URLs.
 *
 * The Wix footer renders these through its Social Bar component, which loads the
 * URLs from Wix's API at runtime — they are not in the page HTML, so they could
 * not be recovered from the crawl. Fill these in from the Wix dashboard
 * (Settings -> Social Links) before going live; they also feed the
 * `sameAs` property of the organisation JSON-LD, which helps Google connect the
 * site to the social profiles.
 */
export const social = {
  facebook: '',
  instagram: '',
  linkedin: '',
  /** Derived from the published phone number, so this one is known. */
  whatsapp: `https://wa.me/${site.whatsapp}`,
} as const;

/** Only the profiles that have actually been configured. */
export const socialProfiles = (): string[] =>
  Object.values<string>(social).filter((url) => url.length > 0);

/** Opening hours in schema.org format, used by the LocalBusiness JSON-LD. */
export const openingHours = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '20:00' },
  { days: ['Saturday', 'Sunday'], opens: '10:00', closes: '18:00' },
] as const;
