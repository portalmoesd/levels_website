# Content conflicts found on the live Wix site

The live site states the same fact differently in different places. These had to
be resolved to build a single data model, so each one below records **what the
live site says**, **what the new site uses**, and **why**.

> **Action required:** confirm each ✅ decision. Where marked ⚠️ the difference is
> large enough to matter commercially and should be checked against what you
> actually charge before launch.

---

## 1. ⚠️ Summer school prices — listing vs. detail pages

Five of the seven destinations are priced differently on `/summer-schools` than
on their own page.

| Destination | `/summer-schools` | Detail page | Difference |
|---|---|---|---|
| Los Angeles — Cal State | **$5,300** | $4,500 | $800 |
| New York — St. John's | **$5,200 → $4,650** | $5,200 → $4,650 | — matches |
| Miami — Barry | **$5,100** | $4,100 | $1,000 |
| London — Kingston | **£3,450 → £3,100** | £3,450 → £3,100 | — matches |
| London — Brunel | **£3,800** | £2,950 | £850 |
| Ellesmere College | **£3,600** | £2,350 | £1,250 |
| London — Hertfordshire | **£3,600** | £2,400 | £1,200 |

✅ **Using the listing page prices.** The listing is demonstrably the newer of
the two: it uses the struck-through discount format throughout, and the only two
detail pages written in that same newer format (New York, Kingston) agree with
it exactly. The five that disagree still carry old-style prose prices
("GBP 2,950 for two weeks"), i.e. they were missed in the last price revision.

⚠️ This is the single most important thing to confirm — it is the difference
between quoting £2,350 and £3,600 for Ellesmere.

---

## 2. ⚠️ Two homepages with different prices

`/` and `/home` are both live, both indexable, and disagree:

| Course | `/` | `/home` |
|---|---|---|
| Children — Sunday School | ₾165/mo | ₾148/mo |
| Children — Saturday School | ₾165/mo | ₾148/mo |
| Children — General English | ₾165/mo | ₾148/mo |
| Art — Drawing 5–8 | (not shown) | ₾165/mo |

`/home` also carries content `/` lacks: the three 10% discount blocks
(family / student / bring-a-friend) and an art course section.

✅ **Using ₾165** (from `/`, which is the page Google indexes as the homepage)
and **keeping the discount blocks** from `/home`. The new site has one homepage;
`/home` 301-redirects to `/`.

⚠️ Confirm whether ₾148 was a promotion that has ended, or the current price.

---

## 3. Teen General English — English vs. Georgian price

| Page | Price |
|---|---|
| `/` (English) | ₾285 → **₾255**/mo |
| `/ka` (Georgian) | ₾285 → **₾235**/mo |

✅ **Using ₾255.** Georgian-speaking customers are currently quoted ₾20/month
less than English-speaking ones for the same course.

---

## 4. Art course schedules — three different versions

The 5–8 drawing course is described three ways:

| Source | Schedule | Price |
|---|---|---|
| `/art` | 90 mins, twice a week | ₾125 → ₾100/mo |
| `/home` | 90 mins, twice a week | ₾200 → ₾165/mo |
| `/drawing-kids` (detail) | **60 mins, once a week** | (no price shown) |

The 13–18 course likewise: `/art` says 60 mins once a week for ages 13–17, while
`/drawing-13-18` says 90 mins twice a week for ages 13–18.

✅ **Using the detail pages for schedule** (60 mins once a week for 5–8; 90 mins
twice a week for 13–18) and **`/art` for price** (₾100 and ₾160), since the
detail pages publish no price at all.

---

## 5. Summer school age range

The `/summer-schools` hero says **12–17**; every regional block on the same page
says **10–17**; every detail page says **from 10**.

✅ **Using 10–17.**

---

## 6. Copy-paste errors in the course text

These are wrong on the live site in **both** languages:

| Page | Problem |
|---|---|
| `/saturday-school` | Body text reads "The **Sunday** English Course…" |
| `/summer-school-miami-barry` | Entire description is of the **Los Angeles / CSUN Northridge** campus — wrong campus, wrong city, wrong excursions |
| `/drawing-13-18` | Page title and meta description are for the **9–12** course |

✅ Saturday/Sunday corrected. Title/meta for `drawing-13-18` corrected.

⚠️ **The Miami page cannot be fixed without you** — I have no description of the
actual Barry University programme. The new site currently carries only the
verified facts (Miami, Barry University, $5,100, 2 weeks, and the excursion list
from the page metadata: NASA Center, South Beach, Disney Springs). **Please send
the real campus description.**

---

## 7. Typos in the live copy

| Page | Live text | Corrected to |
|---|---|---|
| `/` | "CONVERSTIONAL ENGLISH" | "Conversational English" |
| `/` | "tailored scheduele" | "tailored schedule" |
| `/study-abroad` | "Do you help we housing?" | "Do you help with housing?" |
| `/ka/corporate-english` | "კურსის შეახებ" | "კურსის შესახებ" |
| `/ka` (various) | "როგორ იქმნება ჯგუფება?" / "ჯგუფი?" | "როგორ იქმნება ჯგუფები?" |
| `/ka/…` | "რა სასწავლო მასალები გამოიყენება კურზე?" | "…კურსზე?" |
| `/ka/…` | "ვინ ხელმძრვანელობს კურსს?" | "ვინ ხელმძღვანელობს კურსს?" |

✅ All corrected.

---

## 8. Draft pages left published

`/blank` (a duplicate of `/summer-schools`) and `/blank-11` (a homepage draft
still containing Wix placeholder text — *"This is the space to introduce
visitors to the business or brand…"*) are in the sitemap and indexable by Google.

✅ **Not carried over.** Both 410 (Gone) rather than redirect, so Google drops
them promptly. The 19 images used only by these drafts — including the two
heaviest on the whole site, at 25MB and 15MB — were not migrated.

---

## 9. Empty pages

`/certificate`, `/verify`, `/university-rankings-map` and `/placement-quiz`
render only a header and footer; their content came from Wix apps and embeds.

- `/verify` — **rebuilt** against the new backend (see `docs/certificates.md`).
- `/placement-quiz` — **rebuilt** as a native quiz.
- `/university-rankings-map` — **rebuilt** from the QS data.
- `/certificate` — appears to be a stub with no purpose; ✅ redirected to
  `/verify`. Say if it was meant to be something else.

---

## 10. Social media links could not be recovered

The footer icons are a Wix Social Bar component that loads its URLs from Wix's
API at runtime, so the Facebook / Instagram / LinkedIn URLs are not in the page
HTML and could not be crawled.

⚠️ **Fill these into `src/data/site.ts`** before launch. They also populate the
`sameAs` field of the organisation structured data, which is what tells Google
these social profiles belong to the same business.
