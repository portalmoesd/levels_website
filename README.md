# Levels Academy — levels.ge

The Levels Academy website: English and art courses, summer schools and study
abroad, Tbilisi. Bilingual (English + Georgian), built with
[Astro](https://astro.build), deployed to GitHub Pages, with a small Node API
on Render for the things a static site cannot do.

Replaces the previous Wix site.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
```

Forms and certificate verification need the API running — see
[`server/README.md`](./server/README.md).

```bash
npm run build        # production build into dist/
npm run check        # type check
npm run preview      # serve the built site
```

---

## How it is put together

```
src/
  data/          course catalogue, summer schools, team, site config, routes
  page-copy/     page text migrated from Wix, per page, both languages
  i18n/          UI strings and URL helpers
  lib/           schema.org builders, content access, Meta event tracking
  layouts/       the page shell
  components/    header, footer, cards, forms
    pages/       one component per page type
  pages/         thin route files — English at /, Georgian at /ka
  styles/        design tokens and shared CSS

server/          the API (Express + Postgres) — see server/README.md
scripts/         one-off migration tooling from the Wix crawl
docs/            deployment, Meta setup, Wix decommission, content conflicts
```

### Content lives in two places, on purpose

- **Structured facts** — prices, ages, schedules — are curated by hand in
  `src/data/`. The Wix site contradicted itself on several of these, so they
  needed deciding rather than importing. Every conflict and the decision taken
  is recorded in [`docs/content-conflicts.md`](./docs/content-conflicts.md).

- **Long-form copy** — the "About the course" prose, the lists, the FAQs — was
  extracted from the crawl into `src/page-copy/*.json`, paired English with
  Georgian, and is looked up by slug at build time. It was not retyped, so
  nothing was lost or paraphrased in the move.

### Two languages

English is served from the root (`/ielts`) and Georgian from a prefix
(`/ka/ielts`) — the same structure the Wix site used, so Google's existing
index stays valid.

Both locales are generated from one route manifest (`src/data/routes.ts`), so
they cannot drift apart in which pages exist. Every page carries reciprocal
`hreflang` annotations, which is what stops Google treating the two versions as
duplicates.

### Adding a course

1. Add it to `src/data/courses.ts` (or `art.ts`).
2. If it has prose, add `src/page-copy/<slug>.json`.
3. Done — both language routes, the sitemap, the navigation and the structured
   data all follow from the data.

---

## SEO

- Per-page titles, descriptions, canonicals and Open Graph/Twitter cards
- Reciprocal `hreflang` across both locales, plus `x-default`
- Structured data: `EducationalOrganization`, a `LocalBusiness` per branch,
  `Course` with `hasCourseInstance`, `Event` for summer schools, `FAQPage`,
  `BreadcrumbList`, `Person` for staff
- Generated sitemap with locale alternates
- Redirects from every old Wix URL — see `src/data/redirects.ts`
- No client-side JavaScript except where a page genuinely needs it (forms, the
  quiz, certificate lookup), which keeps Core Web Vitals healthy

## Meta

The Pixel fires in the browser and the API sends a matching copy to the
Conversions API. Both carry the same event ID, so Meta counts them once — and
the server copy still arrives when a visitor blocks the Pixel, which a
meaningful share do.

Setup instructions: [`docs/meta-setup.md`](./docs/meta-setup.md).

With `PUBLIC_META_PIXEL_ID` unset, no tracking code is emitted at all, so local
builds never touch production data.

---

## Documentation

| Document | What it covers |
|---|---|
| [docs/deployment.md](./docs/deployment.md) | Deploying the site and API, DNS cutover |
| [docs/meta-setup.md](./docs/meta-setup.md) | Pixel ID, domain verification, CAPI token |
| [docs/wix-decommission.md](./docs/wix-decommission.md) | What to export before cancelling Wix |
| [docs/content-conflicts.md](./docs/content-conflicts.md) | Where the old site contradicted itself, and what was decided |
| [server/README.md](./server/README.md) | The API |

---

## Before this goes live

Three things need input that could not be recovered or decided automatically:

1. **Confirm the summer school prices.** The old site quoted two different
   figures for five of the seven destinations — up to £1,250 apart. See
   `docs/content-conflicts.md` §1.
2. **Export the certificate registry from Wix.** It is deleted with the
   subscription, and every certificate QR code already in circulation depends
   on it. See `docs/wix-decommission.md` §1.
3. **Add the social media URLs** to `src/data/site.ts`. They load from Wix's
   API at runtime and were not in the page HTML.
