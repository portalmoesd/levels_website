# Deployment

Two pieces, deployed separately:

- **The website** — static files on GitHub Pages, built by GitHub Actions on
  every push to `main`.
- **The API** — a Node service on Render with a Postgres database, handling
  form submissions, the certificate registry and the Meta Conversions API.

Deploy the API **first**: the site's forms and certificate verification need its
URL at build time.

---

## 1. The API on Render

### Create the service

1. Go to **[dashboard.render.com](https://dashboard.render.com)** → **New** →
   **Blueprint**.
2. Connect this GitHub repository. Render reads `server/render.yaml` and
   proposes a web service plus a Postgres database.
3. Click **Apply**.

Or create them by hand: **New → Web Service**, root directory `server`, build
command `npm ci`, start command `npm start`; then **New → Postgres** and copy
its Internal Database URL into the service as `DATABASE_URL`.

### Set the environment variables

In the service → **Environment**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | auto-filled if you used the blueprint |
| `CERT_ACCESS_CODE` | a long random string — staff type this into the certificate generator |
| `IP_HASH_SALT` | another long random string |
| `META_PIXEL_ID` | see [meta-setup.md](./meta-setup.md) |
| `META_CAPI_TOKEN` | see [meta-setup.md](./meta-setup.md) — **secret** |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | your mail provider |
| `NOTIFY_EMAIL` | `info@levels.ge` |

Generate the random strings with:

```bash
openssl rand -base64 32
```

> With SMTP unset the service still runs and still stores every submission —
> it just cannot email you about them. That is deliberate: a mail
> misconfiguration should never lose a lead.

### Create the schema

Once deployed, open the service → **Shell**:

```bash
npm run migrate
```

Safe to re-run at any time.

### Check it

```bash
curl https://<your-service>.onrender.com/health
# {"ok":true,"db":true}
```

---

## ⚠️ Render's free tier and the certificate QR codes

**A free Render web service sleeps after 15 minutes of inactivity, and the next
request takes roughly 50 seconds to wake it.**

For a contact form that is survivable. For certificate verification it is not:
someone scans the QR on their certificate, gets a blank screen for the better
part of a minute, and concludes the certificate is fake.

Two options:

1. **Upgrade the web service to Starter ($7/month).** No sleeping. This is what
   `render.yaml` specifies.
2. **Stay free and keep it awake** with an uptime monitor
   ([UptimeRobot](https://uptimerobot.com) is free) pinging
   `https://<service>.onrender.com/health` every 10 minutes. Works, but the
   service still restarts on deploys and occasionally on Render's side.

**Also note:** Render's free Postgres instances are **deleted after 30 days**.
The certificate registry cannot live on a free database — that would mean losing
the ability to verify every certificate you have ever issued. `render.yaml`
specifies the `basic-256mb` paid plan for this reason.

---

## 2. The website on GitHub Pages

### Enable Pages

1. Repository → **Settings** → **Pages**.
2. **Build and deployment → Source**: select **GitHub Actions**.

### Set the build variables

Repository → **Settings** → **Secrets and variables** → **Actions** →
**Variables** tab → **New repository variable**:

| Name | Value |
|---|---|
| `PUBLIC_API_BASE` | `https://<your-service>.onrender.com` (no trailing slash) |
| `PUBLIC_META_PIXEL_ID` | your Pixel ID |

These are **variables, not secrets** — both values ship in the page HTML
anyway, and marking them secret would only stop you reading them back.

> Both are read at **build** time. Changing them does not affect the live site
> until the deploy workflow runs again — use **Actions → Deploy site to GitHub
> Pages → Run workflow**.

### Deploy

Push to `main`. The workflow type-checks, builds and publishes. Takes about two
minutes.

---

## 3. Point levels.ge at GitHub Pages

**Do this last**, once you have confirmed the site works on its
`*.github.io` URL, because this is the step that takes the site off Wix.

`public/CNAME` already contains `www.levels.ge`, so it survives each deploy.

### DNS records

At whoever manages the `levels.ge` DNS — **replace** the existing Wix records:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `www` | `<your-github-username>.github.io` |
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |

The four A records point the bare `levels.ge` at GitHub so it redirects to
`www`. Keep the Meta domain-verification TXT record — removing it breaks
Aggregated Event Measurement.

### Then

1. Repository → **Settings** → **Pages** → **Custom domain**: enter
   `www.levels.ge`, save.
2. Wait for the DNS check to pass (minutes to an hour).
3. Tick **Enforce HTTPS**. GitHub issues a certificate automatically; this can
   take up to 24 hours and the box stays greyed out until it is ready.

---

## After the cutover

### Google Search Console

1. Add `www.levels.ge` as a property if it is not already there.
2. Submit `https://www.levels.ge/sitemap-index.xml`.
3. Watch **Pages** for a week. Some 404s are expected while Google re-crawls;
   anything still 404ing after that needs a redirect adding to
   `src/data/redirects.ts`.

### A note on the redirects

GitHub Pages cannot issue a real HTTP 301, so each old Wix URL is served as a
small HTML page carrying a meta refresh and a canonical link. Google follows
these and passes ranking signals, but more slowly than a true 301.

If rankings matter enough, putting Cloudflare (free) in front of GitHub Pages
lets you serve real 301s at the edge, and gets you real redirects for
`/ka/*` too. `src/data/redirects.ts` is the source list to translate into
Cloudflare rules.

---

## Rollback

Nothing is deleted from Wix by any of this. Until you cancel the subscription,
reverting is just a DNS change: point the records back at Wix and the old site
returns.

**Keep Wix running for at least two weeks after cutover.** See
[wix-decommission.md](./wix-decommission.md) for what must be exported first —
the certificate registry in particular is unrecoverable once the subscription
lapses.
