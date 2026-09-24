// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/site';
import { localisedRedirects } from './src/data/redirects';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: {
    // Emit /about.html rather than /about/index.html so URLs match the Wix
    // site exactly and no redirect is needed for the trailing slash.
    format: 'file',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ka'],
    routing: {
      // English stays at the root (/about); Georgian is prefixed (/ka/about),
      // which is the structure the Wix site already uses and the one Google
      // has indexed.
      prefixDefaultLocale: false,
    },
  },
  /*
   * Redirects from the old Wix URLs.
   *
   * GitHub Pages cannot issue a real 301, so Astro emits a small HTML page per
   * old URL carrying a meta refresh and a canonical link to the destination.
   * Google follows these and passes ranking signals, though more slowly than a
   * true 301 — if the site is ever put behind Cloudflare, move these to real
   * 301s at the edge. See docs/deployment.md.
   */
  redirects: Object.fromEntries(
    // flatMap rather than filter+map so the destination narrows to a string —
    // entries with no `to` are the draft pages, which are deliberately left to
    // 404 rather than redirected anywhere.
    localisedRedirects.flatMap((r) =>
      r.to ? [[r.from, { status: 301, destination: r.to }]] : []
    )
  ),

  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ka: 'ka-GE' } },
      // The draft pages are deliberately gone, and the thank-you pages should
      // not be indexed.
      filter: (page) => !/\/(blank|blank-11|thank-you)$/.test(page),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],
  image: {
    // Generated at build time; no image CDN needed on GitHub Pages.
    responsiveStyles: true,
  },
  vite: {
    build: { assetsInlineLimit: 1024 },
  },
});
