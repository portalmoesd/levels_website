/**
 * Redirects from the old Wix URLs.
 *
 * Every URL in the old sitemap that does not exist on the new site is mapped
 * here. Getting this right is the difference between keeping the existing
 * Google rankings and starting from zero: an old URL that 404s loses whatever
 * authority it had, while a 301 passes it to the new page.
 *
 * `gone: true` marks a page that should NOT be redirected — the draft pages
 * that were published by accident. Pointing them at real pages would just
 * confuse Google about which page is canonical; telling it they are gone gets
 * them dropped from the index promptly.
 */

export interface Redirect {
  from: string;
  to?: string;
  gone?: boolean;
  why: string;
}

export const redirects: Redirect[] = [
  // ---------------------------------------------------- consolidated pages
  {
    from: '/home',
    to: '/',
    why: 'Second homepage. Its discounts and art section were merged into /.',
  },

  // The five separate Wix enrollment pages are now one form with a course
  // selector, so all of them land on /enroll.
  { from: '/english-enroll', to: '/enroll', why: 'Enrollment forms consolidated' },
  { from: '/art-academy-enroll', to: '/enroll', why: 'Enrollment forms consolidated' },
  { from: '/summer-school-enroll', to: '/enroll', why: 'Enrollment forms consolidated' },

  // ------------------------------------------------------------- renamed
  {
    from: '/contactus',
    to: '/contact',
    why: 'Renamed to the conventional spelling',
  },
  {
    from: '/certificate',
    to: '/verify',
    why: 'Empty stub; certificate lookups belong on /verify',
  },
  {
    from: '/interesting',
    to: '/enroll',
    why: 'Was only a set of sign-up shortcuts',
  },

  // ---------------------------------------------------- draft pages: gone
  {
    from: '/blank',
    gone: true,
    why: 'Unfinished duplicate of /summer-schools, published by accident',
  },
  {
    from: '/blank-11',
    gone: true,
    why: 'Homepage draft still containing Wix placeholder text',
  },
];

/** The same redirects for the Georgian tree. */
export const localisedRedirects: Redirect[] = redirects.flatMap((redirect) => [
  redirect,
  {
    ...redirect,
    from: `/ka${redirect.from}`,
    to: redirect.to ? (redirect.to === '/' ? '/ka' : `/ka${redirect.to}`) : undefined,
  },
]);
