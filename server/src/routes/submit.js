import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { sendNotification } from '../mailer.js';
import { sendMetaEvent } from '../meta.js';

/**
 * Form submissions: the replacement for Wix Forms.
 *
 * Every submission is stored in Postgres first, then emailed. Storing first
 * means a mail outage costs a notification, not the lead itself.
 */
export const submit = Router();

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/*
 * Files are kept in memory and written straight to Postgres. Render's disk is
 * ephemeral — anything written to it disappears on the next deploy — so a CV
 * saved to disk would be silently lost.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 30 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_RESUME_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new Error('unsupported file type'));
  },
});

const KNOWN_FORMS = new Set(['contact', 'enroll', 'careers', 'corporate', 'study-abroad']);

const clean = (value, maxLength = 2000) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

/**
 * IP addresses are hashed rather than stored. Enough to spot abuse from one
 * source, but not personal data sitting in the table indefinitely.
 */
function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT ?? '';
  return crypto.createHash('sha256').update(`${salt}:${ip ?? ''}`).digest('hex').slice(0, 32);
}

submit.post('/', upload.single('resume'), async (req, res) => {
  const body = req.body ?? {};

  // Honeypot: hidden from real users, so anything in it is a bot. Answered
  // with 200 so the bot does not learn it was rejected and retry differently.
  if (clean(body.website)) {
    return res.status(200).json({ ok: true });
  }

  const formName = KNOWN_FORMS.has(body.formName) ? body.formName : 'contact';
  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 60);

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'missing required fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'invalid email' });
  }

  const record = {
    formName,
    locale: body.locale === 'ka' ? 'ka' : 'en',
    firstName,
    lastName,
    email,
    phone,
    company: clean(body.company, 200),
    course: clean(body.course, 120),
    birthday: clean(body.birthday, 40),
    message: clean(body.message, 5000),
    pageUrl: clean(body.pageUrl, 500),
  };

  try {
    const { rows } = await query(
      `INSERT INTO submissions
         (form_name, locale, first_name, last_name, email, phone, company, course,
          birthday, message, resume_name, resume_type, resume_data,
          page_url, user_agent, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, created_at`,
      [
        record.formName,
        record.locale,
        record.firstName,
        record.lastName,
        record.email,
        record.phone,
        record.company,
        record.course,
        record.birthday,
        record.message,
        req.file?.originalname?.slice(0, 255) ?? null,
        req.file?.mimetype ?? null,
        req.file?.buffer ?? null,
        record.pageUrl,
        clean(req.get('user-agent'), 400),
        hashIp(req.ip),
      ]
    );

    const submission = { ...record, id: rows[0].id, createdAt: rows[0].created_at };

    // The lead is saved; everything after this is best-effort and must not be
    // able to turn a stored submission into an error for the visitor.
    res.json({ ok: true, id: submission.id });

    sendNotification(submission, req.file).catch((error) =>
      console.error('[submit] notification email failed:', error.message)
    );

    sendMetaEvent({
      eventName: 'Lead',
      eventId: clean(body.metaEventId, 100) || `submit-${submission.id}`,
      eventSourceUrl: record.pageUrl,
      userData: {
        email: record.email,
        phone: record.phone,
        firstName: record.firstName,
        lastName: record.lastName,
      },
      customData: { content_name: formName, content_category: record.course || undefined },
      clientIp: req.ip,
      clientUserAgent: req.get('user-agent'),
      fbp: req.cookies?._fbp,
      fbc: req.cookies?._fbc,
    }).catch((error) => console.error('[submit] meta event failed:', error.message));
  } catch (error) {
    console.error('[submit] failed:', error);
    res.status(500).json({ error: 'could not save submission' });
  }
});

/** Multer rejects oversized or wrong-typed files before the handler runs. */
submit.use((error, _req, res, next) => {
  if (!error) return next();
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file too large' });
  }
  if (error.message === 'unsupported file type') {
    return res.status(415).json({ error: 'unsupported file type' });
  }
  console.error('[submit] upload error:', error);
  return res.status(400).json({ error: 'bad request' });
});
