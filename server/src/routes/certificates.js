import { Router } from 'express';
import crypto from 'node:crypto';
import { query, transaction } from '../db.js';

/**
 * The certificate registry: the replacement for the Wix Velo backend at
 * /_functions/issue and /_functions/verify.
 *
 * The response shapes are deliberately identical to the Wix ones, so the
 * existing certificate-maker app works after changing a single URL, and so the
 * QR codes already printed on certificates keep resolving.
 */
export const certificates = Router();

/** Matches the Wix prefix format: LVE-2026, LKA-2026, LVA-2026, LKE-2026. */
const PREFIX_RE = /^L[VK][EA]-\d{4}$/;
const TOKEN_RE = /^[A-Za-z0-9]{10,40}$/;

/**
 * Token alphabet, unchanged from the Wix implementation: no 0/O/1/I/l, so a
 * code read off a printed certificate cannot be mistyped into a different
 * valid token.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Wix generated tokens with Math.random(), which is not cryptographically
 * secure — predictable tokens would let someone forge a verification URL that
 * resolves. randomInt draws from the CSPRNG instead.
 */
function makeToken(length = 16) {
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return token;
}

function requireStaffCode(req, res) {
  const expected = process.env.CERT_ACCESS_CODE;
  if (!expected) {
    res.status(500).json({ error: 'server not configured' });
    return false;
  }
  const provided = String(req.body?.code ?? '');

  // Compared with timingSafeEqual so a wrong code cannot be narrowed down by
  // measuring how long the comparison takes.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).json({ error: 'wrong access code' });
    return false;
  }
  return true;
}

/**
 * POST /api/certificates/issue
 *
 * Assigns the next certificate numbers for a prefix, generates a token each,
 * stores the batch, and returns { numbers, tokens } in the order submitted.
 *
 * Body: { code, prefix, rows: [{ firstName, lastName, course, ... }] }
 */
certificates.post('/issue', async (req, res) => {
  if (!requireStaffCode(req, res)) return;

  const prefix = String(req.body?.prefix ?? '');
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!PREFIX_RE.test(prefix) || rows.length === 0) {
    return res.status(400).json({ error: 'bad input' });
  }
  if (rows.length > 500) {
    return res.status(400).json({ error: 'batch too large' });
  }

  try {
    const result = await transaction(async (client) => {
      /*
       * Reserve the number range atomically. The row lock taken by this
       * upsert makes two concurrent batches queue rather than collide — the
       * race the Wix max()+1 approach was open to.
       */
      const { rows: seqRows } = await client.query(
        `INSERT INTO certificate_sequences (prefix, next_seq)
         VALUES ($1, $2::int + 1)
         ON CONFLICT (prefix) DO UPDATE
           SET next_seq = certificate_sequences.next_seq + $2::int
         RETURNING next_seq`,
        [prefix, rows.length]
      );

      /*
       * next_seq now points one past the last number in this batch, whether
       * the row was inserted (seeded at rows.length) or updated (advanced by
       * rows.length). So the batch occupies [next_seq - rows.length, next_seq).
       */
      const nextSeq = Number(seqRows[0].next_seq);
      const firstNumber = nextSeq - rows.length;

      const numbers = [];
      const tokens = [];

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i] ?? {};
        const certNumber = `${prefix}-${String(firstNumber + i).padStart(4, '0')}`;
        const token = makeToken();

        await client.query(
          `INSERT INTO certificates
             (cert_number, token, first_name, last_name, course, level, hours,
              start_date, end_date, branch, template_id, issued_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())`,
          [
            certNumber,
            token,
            row.firstName ?? '',
            row.lastName ?? '',
            row.course ?? '',
            row.level ?? '',
            row.hours ?? '',
            row.startDate ?? '',
            row.endDate ?? '',
            row.branch ?? '',
            row.templateId ?? '',
          ]
        );

        numbers.push(certNumber);
        tokens.push(token);
      }

      return { numbers, tokens };
    });

    res.json(result);
  } catch (error) {
    console.error('[certificates] issue failed:', error);
    res.status(500).json({ error: 'could not issue certificates' });
  }
});

/**
 * GET /api/certificates/verify?v=<token>
 *
 * Public and read-only. Looks up by token only — never by certificate number —
 * so the registry cannot be enumerated. Returns only the fields printed on the
 * certificate itself; the branch is deliberately not returned.
 */
certificates.get('/verify', async (req, res) => {
  const token = String(req.query.v ?? '').trim();

  // An invalid token shape returns the same "not found" as a valid-but-unknown
  // one, so the response cannot be used to probe the token format.
  if (!TOKEN_RE.test(token)) {
    return res.json({ found: false });
  }

  try {
    const { rows } = await query(
      `SELECT cert_number, first_name, last_name, course, level, hours,
              start_date, end_date, template_id, issued_at
         FROM certificates
        WHERE token = $1
        LIMIT 1`,
      [token]
    );

    if (rows.length === 0) return res.json({ found: false });

    const c = rows[0];
    res.json({
      found: true,
      certificate: {
        certNumber: c.cert_number,
        firstName: c.first_name,
        lastName: c.last_name,
        course: c.course,
        level: c.level,
        hours: c.hours,
        startDate: c.start_date,
        endDate: c.end_date,
        templateId: c.template_id,
        issuedAt: c.issued_at,
      },
    });
  } catch (error) {
    console.error('[certificates] verify failed:', error);
    res.status(500).json({ error: 'verification unavailable' });
  }
});
