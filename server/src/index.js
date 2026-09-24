import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { pool, query } from './db.js';
import { submit } from './routes/submit.js';
import { certificates } from './routes/certificates.js';
import { metaRoutes } from './routes/meta.js';

/**
 * levels.ge API.
 *
 * Replaces the three things the Wix site did server-side:
 *   - form submissions (Wix Forms)
 *   - the certificate registry (Wix Velo /_functions/issue and /verify)
 *   - and adds the Meta Conversions API, which Wix never did.
 */

const app = express();

/*
 * Render terminates TLS at its proxy, so the client IP arrives in
 * X-Forwarded-For. Trusting exactly one proxy hop makes req.ip the real
 * visitor address — which rate limiting and Meta's event matching both need —
 * without trusting a header a client could spoof end to end.
 */
app.set('trust proxy', 1);
app.disable('x-powered-by');

/*
 * Only the site's own origins may call this API with credentials. The
 * certificate-maker app is served from GitHub Pages, so its origin is allowed
 * too; set EXTRA_ORIGINS to add any others.
 */
const allowedOrigins = new Set(
  [
    'https://www.levels.ge',
    'https://levels.ge',
    ...(process.env.EXTRA_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean),
    // Both spellings of the dev server origin: a browser treats
    // http://localhost:4321 and http://127.0.0.1:4321 as different origins.
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:4321', 'http://127.0.0.1:4321']
      : []),
  ]
);

app.use(
  cors({
    origin(origin, callback) {
      // A missing Origin means a same-origin or non-browser request (curl, the
      // certificate generator running from a file). Those carry no ambient
      // credentials, so there is nothing for CORS to protect against.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error('origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

/** Minimal cookie parsing: only _fbp and _fbc are needed, for Meta matching. */
app.use((req, _res, next) => {
  req.cookies = Object.fromEntries(
    (req.get('cookie') ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name]) => name === '_fbp' || name === '_fbc')
      .map(([name, ...rest]) => [name, decodeURIComponent(rest.join('='))])
  );
  next();
});

const limiter = (max, windowMinutes) =>
  rateLimit({
    windowMs: windowMinutes * 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many requests' },
  });

/**
 * Health check.
 *
 * Also the endpoint to point an uptime monitor at: Render's free tier sleeps a
 * service after 15 minutes idle, and a cold start takes around 50 seconds —
 * long enough that someone scanning a certificate QR would assume it is
 * broken. See server/README.md.
 */
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

app.use('/api/submit', limiter(10, 15), submit);
app.use('/api/certificates', limiter(60, 15), certificates);
app.use('/api/meta', limiter(300, 15), metaRoutes);

app.use((_req, res) => res.status(404).json({ error: 'not found' }));

app.use((error, _req, res, _next) => {
  if (error?.message === 'origin not allowed') {
    return res.status(403).json({ error: 'origin not allowed' });
  }
  console.error('[server] unhandled:', error);
  res.status(500).json({ error: 'server error' });
});

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  console.log(`levels.ge API listening on :${port}`);
});

/** Render sends SIGTERM on deploy; finish in-flight requests before exiting. */
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    // Do not hang forever if a connection will not close.
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
