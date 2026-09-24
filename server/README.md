# levels.ge API

Express + Postgres. Replaces the three things the Wix site did server-side, and
adds one it never did:

| Endpoint | Purpose |
|---|---|
| `POST /api/submit` | Form submissions, including CV upload — replaces Wix Forms |
| `POST /api/certificates/issue` | Assign certificate numbers and tokens — replaces Wix Velo `/_functions/issue` |
| `GET /api/certificates/verify` | Public certificate lookup — replaces Wix Velo `/_functions/verify` |
| `POST /api/meta/event` | Mirrors browser events to the Meta Conversions API |
| `GET /health` | Health check |

Deployment: [../docs/deployment.md](../docs/deployment.md).

---

## Local development

```bash
npm install
cp .env.example .env     # then fill in DATABASE_URL and CERT_ACCESS_CODE
npm run migrate
npm run dev
```

With no SMTP or Meta credentials set, the service runs normally — submissions
are stored and logged rather than emailed, and Meta events are skipped. That is
deliberate, so local work never sends real mail or writes to the live ad
account.

## Tests

```bash
DATABASE_URL=postgresql://... npm test
```

21 tests, run against a **real** Postgres rather than a mock: the two things
most worth testing — certificate numbering under concurrency, and the
uniqueness constraints — only exist at the database level, and a mock would
assume away exactly what is being verified. Point it at a throwaway database;
it truncates its tables.

CI runs these on every push touching `server/` (`.github/workflows/api-tests.yml`).

---

## The certificate registry

This is the part to be careful with. Certificates already printed carry a QR
pointing at `levels.ge/verify?v=<token>`, and those codes cannot be reissued.

Two rules follow:

**Lookup is by token, never by certificate number.** The token is random and
the number is sequential; accepting the number would let anyone read the whole
registry by counting upwards from `LVE-2026-0001`. There is a test asserting a
certificate number does *not* resolve.

**The response shape must not change.** It matches the Wix backend field for
field so the certificate-maker app works after a one-line URL change.

### Two things were fixed rather than copied

- **Numbering race.** Wix derived the next number with `max()+1`, which could
  hand two people the same number if they pressed Generate in the same second.
  Numbers now come from a sequence table reserved inside the transaction, so
  concurrent batches queue instead of colliding.

- **Token randomness.** Wix generated tokens with `Math.random()`, which is not
  cryptographically secure — predictable tokens would let someone forge a
  verification URL that resolves. Tokens now come from the CSPRNG. The alphabet
  is unchanged, still excluding `0/O/1/I/l` so a code read off a printed
  certificate cannot be mistyped into a different valid one.

### Importing the Wix export

```bash
node src/import-certificates.js Certificates.csv --dry-run
node src/import-certificates.js Certificates.csv
```

Handles the BOM Excel adds, quoted commas inside course names and Georgian
text. Continues numbering from the highest number imported, so new certificates
never reuse a printed one. Safe to re-run.

See [../docs/wix-decommission.md](../docs/wix-decommission.md) — this must
happen before the Wix subscription lapses.

---

## Notes on the implementation

**Submissions are stored before they are emailed.** An SMTP outage then costs a
notification, not the lead itself.

**CVs go into Postgres, not the filesystem.** Render's disk is ephemeral —
anything written to it is gone on the next deploy, so a CV saved to disk would
disappear silently.

**IP addresses are hashed, not stored.** Enough to spot abuse from one source,
without keeping personal data in the table indefinitely.

**The honeypot answers 200.** A bot that fills the hidden field gets a success
response and nothing is stored, so it does not learn it was caught and retry
differently.

**`/api/meta/event` accepts only known event names and requires an event ID.**
An open endpoint would let anyone inject conversions into the ad account; a
missing event ID would mean the server copy could not be deduplicated against
the browser copy, and every conversion would count twice.

**`trust proxy` is set to 1.** Render terminates TLS at its proxy, so the real
client IP arrives in `X-Forwarded-For`. Trusting exactly one hop makes `req.ip`
correct — which rate limiting and Meta's event matching both need — without
trusting a header a client could spoof end to end.
