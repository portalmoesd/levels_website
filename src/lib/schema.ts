import { site, branches, openingHours, socialProfiles, SITE_URL } from '../data/site';
import type { Locale } from '../data/site';
import type { Course, Price } from '../data/types';
import { absoluteUrl, localePath } from '../i18n/utils';

/**
 * schema.org structured data.
 *
 * Google uses this to understand what the business is, where its branches are
 * and what courses it sells. `Course` markup in particular is what makes a
 * course eligible for the course rich result in search.
 */

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** The academy itself. Referenced by every other node via @id. */
export function organizationSchema(locale: Locale) {
  return {
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': ORG_ID,
    name: site.name,
    url: SITE_URL,
    email: site.email,
    telephone: site.phone,
    foundingDate: String(site.founded),
    logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    image: absoluteUrl('/og-default.jpg'),
    description:
      locale === 'ka'
        ? 'ინგლისური ენისა და ხელოვნების კურსები თბილისში — ბავშვებისთვის, მოზარდებისთვის, ზრდასრულებისა და კომპანიებისთვის.'
        : 'English language and art courses in Tbilisi for children, teenagers, adults and companies. Cambridge English Educational Partner.',
    ...(socialProfiles().length ? { sameAs: socialProfiles() } : {}),
    address: branches.map((b) => ({
      '@type': 'PostalAddress',
      streetAddress: b.street[locale],
      addressLocality: b.locality[locale],
      postalCode: b.postalCode,
      addressCountry: 'GE',
    })),
    areaServed: { '@type': 'City', name: locale === 'ka' ? 'თბილისი' : 'Tbilisi' },
  };
}

/** One node per branch, so each can rank in local search on its own. */
export function branchSchemas(locale: Locale) {
  return branches.map((b) => ({
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#branch-${b.id}`,
    parentOrganization: { '@id': ORG_ID },
    name: `${site.name} — ${b.name[locale]}`,
    telephone: site.phone,
    email: site.email,
    url: absoluteUrl(localePath('contact', locale)),
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.street[locale],
      addressLocality: b.locality[locale],
      postalCode: b.postalCode,
      addressCountry: 'GE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
    openingHoursSpecification: openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  }));
}

export function websiteSchema(locale: Locale) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: site.name,
    publisher: { '@id': ORG_ID },
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en',
  };
}

/** Converts our price shape into a schema.org offer, or null when not priced. */
function offer(price: Price, locale: Locale) {
  if (price.unit === 'individual' || price.now === undefined) return null;
  return {
    '@type': 'Offer',
    price: price.now,
    priceCurrency: price.currency ?? 'GEL',
    category: price.unit === 'month' ? 'Subscription' : 'Paid',
    availability: 'https://schema.org/InStock',
    url: absoluteUrl(localePath('enroll', locale)),
  };
}

/**
 * A single course.
 *
 * `hasCourseInstance` is required for the course rich result: without at least
 * one instance carrying a mode and repeat frequency, Google will read the
 * markup but not show the enhanced listing.
 */
export function courseSchema(course: Course, locale: Locale, path: string) {
  const o = offer(course.price, locale);
  return {
    '@type': 'Course',
    '@id': `${absoluteUrl(path)}#course`,
    name: course.title[locale],
    description: course.summary[locale],
    url: absoluteUrl(path),
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en',
    teaches: 'English as a foreign language',
    provider: { '@id': ORG_ID },
    ...(course.ageRange
      ? {
          typicalAgeRange: course.ageRange.max
            ? `${course.ageRange.min}-${course.ageRange.max}`
            : `${course.ageRange.min}-`,
        }
      : {}),
    ...(o ? { offers: o } : {}),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: ['onsite', 'online'],
      courseWorkload: course.lessonLength[locale],
      courseSchedule: {
        '@type': 'Schedule',
        repeatFrequency: 'Weekly',
        repeatCount: undefined,
      },
      location: {
        '@type': 'Place',
        name: site.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: locale === 'ka' ? 'თბილისი' : 'Tbilisi',
          addressCountry: 'GE',
        },
      },
    },
  };
}

/** Wraps a list of courses so a category page can mark up all of them at once. */
export function courseListSchema(
  entries: { course: Course; path: string }[],
  locale: Locale
) {
  return {
    '@type': 'ItemList',
    itemListElement: entries.map(({ course, path }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: courseSchema(course, locale, path),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  if (!items.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  if (trail.length < 2) return null;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** Combines nodes into the single @graph document that goes in the page head. */
export function graph(nodes: unknown[]) {
  return JSON.stringify(
    { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) },
    // Drop undefined values so the emitted JSON stays valid and compact.
    (_key, value) => (value === undefined ? undefined : value)
  );
}
