# Meta setup — step by step

Three separate things, done in this order. Each has a check at the end so you
know it worked before moving on.

1. [Find your Pixel ID](#1-find-your-pixel-id)
2. [Verify levels.ge in Business Manager](#2-verify-levelsge-in-business-manager)
3. [Create the Conversions API token](#3-create-the-conversions-api-token)
4. [Check it all works](#4-check-it-all-works)

> Anything marked **secret** goes in the Render dashboard, never in the repo.
> Anything marked **public** is fine in GitHub — it ships in the page source
> regardless.

---

## 1. Find your Pixel ID

Wix created a Pixel for you when it connected to Meta, so one almost certainly
already exists. Use it rather than making a new one — a new Pixel starts with
no history, and your campaigns lose the audiences they have been optimising
against.

1. Go to **[business.facebook.com/events_manager](https://business.facebook.com/events_manager)**
2. Sign in with the account that manages the Levels Academy ads.
3. In the left sidebar, click **Data sources**.
4. You will see a list of Pixels. Look for one named something like
   `levels.ge`, `Levels Academy`, or `Wix Pixel`.
5. Click it. The **Pixel ID** is the long number shown under the name — 15 or
   16 digits, like `1234567890123456`.
6. Copy it.

**If there is no Pixel:** click **Connect data sources → Web → Meta Pixel →
Connect**, name it `Levels Academy`, and enter `https://www.levels.ge` when
asked for the website. Then copy the ID it gives you.

### Where it goes — public

In GitHub: **Settings → Secrets and variables → Actions → Variables tab →
New repository variable**

| Name | Value |
|---|---|
| `PUBLIC_META_PIXEL_ID` | the number you copied |
| `PUBLIC_API_BASE` | your Render URL, e.g. `https://levels-academy-api.onrender.com` |

In Render: **Environment → Add environment variable**

| Name | Value |
|---|---|
| `META_PIXEL_ID` | the same number |

> Both sides need the ID. The browser uses it to fire the Pixel; the server
> uses it to send the matching Conversions API copy.

---

## 2. Verify levels.ge in Business Manager

Domain verification proves the domain is yours. Without it you cannot configure
Aggregated Event Measurement, which is what makes conversions from iPhone users
report correctly. **Wix currently holds this verification, and it stops working
when you leave**, so this has to be redone.

1. Go to **[business.facebook.com/settings](https://business.facebook.com/settings)**
2. Left sidebar → **Brand safety and suitability → Domains**
   (on some accounts it is just **Domains**).
3. Click **Add**, type `levels.ge` (no `https://`, no `www.`), click **Add
   domain**.
4. Meta offers three verification methods. Choose **DNS TXT record** — it is
   the only one that does not depend on where the site is hosted, so it keeps
   working through the move off Wix and any future host change.
5. Copy the TXT record value Meta shows you. It looks like
   `facebook-domain-verification=abc123def456…`

### Add the DNS record

At whoever manages the `levels.ge` domain's DNS:

| Field | Value |
|---|---|
| Type | `TXT` |
| Name / Host | `@` (or leave blank — this means the root domain) |
| Value | `facebook-domain-verification=…` (the whole string from Meta) |
| TTL | leave the default |

6. Save, wait a few minutes, then click **Verify** in Meta.

DNS can take up to an hour to propagate. If it fails the first time, wait and
try again — you do not need to re-add the record.

### Then assign the Pixel to the domain

Still in **Domains**, click `levels.ge` → **Assigned assets** → **Add assets** →
select your Pixel → **Add**.

**Check:** the domain shows a green **Verified** label.

---

## 3. Create the Conversions API token

This is what lets the server send events directly to Meta, so conversions still
get counted when a visitor blocks the Pixel.

1. Back in **[Events Manager](https://business.facebook.com/events_manager)**,
   click your Pixel.
2. Go to the **Settings** tab.
3. Scroll to **Conversions API**.
4. Click **Generate access token**.
   - If you do not see that option, click **Set up manually** or **Implement
     Conversions API directly**, and the token option appears there.
5. Copy the token immediately — **Meta shows it only once.** It is a long
   string starting with `EAA…`.

### Where it goes — secret

In Render: **Environment → Add environment variable**

| Name | Value |
|---|---|
| `META_CAPI_TOKEN` | the `EAA…` token |

> Never put this in GitHub, in the repo, or in a message. Anyone holding it can
> write events into your ad account. If it leaks, return to this screen and
> generate a new one — that invalidates the old token.

### While testing

Also in Events Manager → your Pixel → **Test events** tab, copy the **test
event code** (looks like `TEST12345`) and add it in Render as:

| Name | Value |
|---|---|
| `META_TEST_EVENT_CODE` | `TEST12345` |

Events then appear under **Test events** instead of counting as real
conversions. **Delete this variable once you have confirmed everything works** —
if you leave it set, none of your real conversions will be recorded.

---

## 4. Check it all works

After deploying the site and the API:

### Pixel (browser)

1. Install the **[Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)**
   Chrome extension.
2. Open `https://www.levels.ge`. The extension icon should show **1 pixel
   found** and a `PageView` event.
3. Open a course page such as `/ielts`. You should now also see a
   `ViewContent` event.

### Conversions API (server)

1. In Events Manager → your Pixel → **Test events**.
2. With `META_TEST_EVENT_CODE` set, submit the contact form on the site.
3. Within a few seconds you should see a **Lead** event appear — and it should
   say **Browser and Server**, not just one of them.

> **"Browser and Server" on a single row is the thing to confirm.** It means
> the two copies were matched by their shared event ID and counted once. If you
> see two separate Lead rows instead, deduplication is not working and every
> conversion will be double-counted.

### Event match quality

In Events Manager → your Pixel → **Overview**, each event shows an **Event
Match Quality** score. The Lead event should score well, because the server
sends hashed email, phone and name along with it. Anything above about 6.0 is
healthy.

---

## What gets sent

| Event | When |
|---|---|
| `PageView` | every page |
| `ViewContent` | a course page is opened — this builds the audience of people who looked but did not enrol, which retargeting campaigns need |
| `Lead` | any form is submitted successfully |
| `CompleteRegistration` | the placement quiz is completed |

Personal details (email, phone, first and last name) are SHA-256 hashed on the
server before being sent, as Meta requires. Raw values are never transmitted,
never logged, and the visitor's IP is stored only as a hash.

---

## Troubleshooting

**Pixel Helper says "No pixel found"**
`PUBLIC_META_PIXEL_ID` was not set at build time. It is baked in during the
GitHub Actions build, so setting the variable is not enough — re-run the deploy
workflow afterwards.

**Events show as Browser only, never Server**
`META_CAPI_TOKEN` or `META_PIXEL_ID` is missing on Render, or the token has
expired. Check the Render service logs for lines starting `[meta]`.

**Conversions counted twice**
The event IDs are not matching. Both copies must carry the same ID — if you
have edited `src/lib/analytics.ts` or `server/src/routes/meta.js`, confirm the
`eventId` is still passed through both paths unchanged.

**Domain verification keeps failing**
Check the TXT record is on the root domain (`levels.ge`), not on `www`. Verify
it is live with: `dig TXT levels.ge +short`
