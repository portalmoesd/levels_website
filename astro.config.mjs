// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/site';

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
