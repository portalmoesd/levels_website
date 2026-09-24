# Leaving Wix — checklist

Work through this in order. Steps 1–3 must happen **before** the Wix
subscription lapses; some of what they recover cannot be recreated afterwards.

---

## ⚠️ 1. Export the certificate registry — unrecoverable if missed

Every certificate Levels Academy has issued carries a QR code pointing at
`levels.ge/verify?v=<token>`. Those codes are printed on paper already in
students' hands and cannot be reissued. They resolve only if the matching row
exists in the registry — and that registry currently lives in a Wix Data
collection which is **deleted with the subscription**.

### Export it

1. Wix Dashboard → **Developer Tools / Dev Mode** (or **Database** in the
   left sidebar, depending on your Wix version).
2. Open the **Certificates** collection.
3. **⋯ (More actions) → Export to CSV**.
4. Make sure every field is included: `certNumber`, `token`, `firstName`,
   `lastName`, `course`, `level`, `hours`, `startDate`, `endDate`, `branch`,
   `templateId`, `issuedAt`.
5. Save the file somewhere safe. **Keep a second copy** — this is the only
   record of the registry.

### Import it

```bash
cd server

# Check what it will do first — writes nothing.
DATABASE_URL="<render postgres url>" node src/import-certificates.js Certificates.csv --dry-run

# Then import.
DATABASE_URL="<render postgres url>" node src/import-certificates.js Certificates.csv
```

The importer handles the BOM Excel adds, quoted commas inside course names and
Georgian text, and continues certificate numbering from the highest number
imported, so newly issued certificates never reuse one already printed.
Re-running it is safe.

### Verify before going further

The import prints three real verification URLs. **Open each one against the
live site and confirm the certificate details come back correct.** Then take a
physical certificate and scan its QR with a phone.

Do not proceed until that works.

---

## 2. Point the certificate generator at the new API

`portalmoesd/certificate-maker` still calls the Wix endpoint. In
`app/js/app.js`:

```js
// Before
var REGISTRY_URL = window.REGISTRY_URL || 'https://www.levels.ge/_functions/issue';

// After
var REGISTRY_URL = window.REGISTRY_URL || 'https://<your-service>.onrender.com/api/certificates/issue';
```

The request and response shapes are unchanged, so nothing else in that app
needs touching.

Set `CERT_ACCESS_CODE` on Render to the value staff type into the generator.
It can be the same string as the old Wix `certMakerSecret`, or a new one — if
you change it, tell whoever issues certificates.

**Check:** issue a one-row test batch and verify the returned token resolves on
`/verify`.

---

## 3. Recover what could not be crawled

### Social media links

The footer icons are a Wix Social Bar component that loads its URLs from Wix's
API at runtime, so they are not in the page HTML and could not be recovered.

Wix Dashboard → **Settings → Social Links**. Copy the Facebook, Instagram and
LinkedIn URLs into `src/data/site.ts`:

```ts
export const social = {
  facebook: 'https://www.facebook.com/...',
  instagram: 'https://www.instagram.com/...',
  linkedin: 'https://www.linkedin.com/...',
  whatsapp: `https://wa.me/${site.whatsapp}`,
} as const;
```

These also populate the `sameAs` field of the structured data, which is what
tells Google these profiles belong to the same business.

### Form submissions

Any enquiries sitting in Wix Forms are not migrated. Wix Dashboard →
**Forms & Submissions** → export to CSV if you want to keep them.

### Anything else

- Booking or scheduling data, if you used Wix Bookings.
- Any files uploaded through the careers form.
- Email templates or automations configured in Wix.

---

## 4. Cut over

Follow [deployment.md](./deployment.md) §3. In short: confirm the new site
works on its `github.io` URL, then move the DNS.

**Keep the Wix subscription active for at least two weeks afterwards.** If
anything goes wrong, rolling back is just a DNS change — but only while Wix is
still paid up.

---

## 5. Before you cancel — final checks

Work through all of these. Each one is something that silently breaks if missed.

- [ ] Certificate registry exported, imported, and a **physical certificate QR
      scanned successfully** against the new site
- [ ] Certificate generator issuing against the new API
- [ ] Social links copied into `src/data/site.ts`
- [ ] Old form submissions exported, if you want them
- [ ] `www.levels.ge` serving the new site over HTTPS
- [ ] Contact form submits and the notification email arrives
- [ ] Careers form accepts a CV upload
- [ ] Meta Events Manager shows Lead events as **"Browser and Server"**
- [ ] `META_TEST_EVENT_CODE` **removed** from Render — while it is set, real
      conversions are not recorded
- [ ] Meta domain verification TXT record present and verified on the new DNS
- [ ] Google Search Console shows the new sitemap processed
- [ ] Spot-check a dozen old URLs (`/contactus`, `/home`, `/english-enroll`,
      `/ka/ielts`) and confirm each lands somewhere sensible

Only then cancel.

---

## What is deliberately not carried over

| Wix page | Why |
|---|---|
| `/blank` | Unfinished duplicate of `/summer-schools` |
| `/blank-11` | Homepage draft still containing Wix placeholder text |
| `/home` | Second homepage — merged into `/` |
| `/certificate` | Empty stub — redirects to `/verify` |
| `/interesting` | Only a set of sign-up shortcuts — redirects to `/enroll` |
| `/english-enroll`, `/art-academy-enroll`, `/summer-school-enroll` | Collected identical fields — consolidated into `/enroll` |

The two draft pages return **410 Gone** rather than redirecting, so Google drops
them from the index instead of treating them as alternates of a real page.

Their images were not migrated either — 19 files including the two heaviest on
the site, at 25MB and 15MB.
