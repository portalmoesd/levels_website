/**
 * End-to-end API tests.
 *
 * Runs against a real Postgres, because the parts most worth testing — the
 * certificate numbering race and the uniqueness constraints — only exist at the
 * database level and would be assumed away by a mock.
 *
 *   DATABASE_URL=postgresql://... node --test test/api.test.js
 *
 * Point it at a throwaway database: it truncates the tables it uses.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = Number(process.env.TEST_PORT ?? 3977);
const BASE = `http://127.0.0.1:${PORT}`;
const CODE = 'test-access-code';

let server;
/*
 * src/db.js exports a singleton pool, so the tests open it once and close it
 * in after(). Ending it inside a test would break every later test that reads
 * from the database.
 */
let db;

const api = (path, init) => fetch(`${BASE}${path}`, init);

const issue = (rows, prefix = 'LVE-2099', code = CODE) =>
  api('/api/certificates/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, prefix, rows }),
  });

before(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set to a throwaway database');
  }

  db = await import('../src/db.js');
  await db.query('TRUNCATE certificates, certificate_sequences, submissions RESTART IDENTITY');

  server = spawn(process.execPath, ['src/index.js'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      CERT_ACCESS_CODE: CODE,
      IP_HASH_SALT: 'test-salt',
      NODE_ENV: 'test',
      // Deliberately unset so no test can reach Meta or send real email.
      META_PIXEL_ID: '',
      META_CAPI_TOKEN: '',
      SMTP_HOST: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for the listener rather than sleeping a fixed amount.
  const deadline = Date.now() + 15_000;
  for (;;) {
    try {
      const response = await api('/health');
      if (response.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error('server did not start');
    await new Promise((r) => setTimeout(r, 200));
  }
});

after(async () => {
  server?.kill('SIGTERM');
  if (server) await once(server, 'exit').catch(() => {});
  await db?.pool.end();
});

describe('health', () => {
  test('reports the database is reachable', async () => {
    const response = await api('/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, db: true });
  });
});

describe('certificates', () => {
  test('rejects a wrong access code', async () => {
    const response = await issue([{ firstName: 'X' }], 'LVE-2099', 'wrong');
    assert.equal(response.status, 403);
  });

  test('rejects a malformed prefix', async () => {
    const response = await issue([{ firstName: 'X' }], 'NOPE');
    assert.equal(response.status, 400);
  });

  test('rejects an empty batch', async () => {
    const response = await issue([]);
    assert.equal(response.status, 400);
  });

  test('numbers a batch from 0001 and continues across batches', async () => {
    const first = await (await issue([{ firstName: 'A' }, { firstName: 'B' }])).json();
    assert.deepEqual(first.numbers, ['LVE-2099-0001', 'LVE-2099-0002']);

    const second = await (await issue([{ firstName: 'C' }])).json();
    assert.deepEqual(second.numbers, ['LVE-2099-0003']);
  });

  test('keeps a separate sequence per prefix', async () => {
    const other = await (await issue([{ firstName: 'D' }], 'LKA-2099')).json();
    assert.deepEqual(other.numbers, ['LKA-2099-0001']);
  });

  test('verifies a certificate by its token', async () => {
    const issued = await (
      await issue([
        { firstName: 'Nino', lastName: 'Beridze', course: 'IELTS', level: 'B2', branch: 'Vake' },
      ])
    ).json();

    const found = await (
      await api(`/api/certificates/verify?v=${issued.tokens[0]}`)
    ).json();

    assert.equal(found.found, true);
    assert.equal(found.certificate.firstName, 'Nino');
    assert.equal(found.certificate.certNumber, issued.numbers[0]);
    // The branch is internal and must not be exposed by a public lookup.
    assert.equal(found.certificate.branch, undefined);
  });

  test('does not resolve a certificate by its sequential number', async () => {
    // If this ever passes, the registry has become enumerable.
    const response = await api('/api/certificates/verify?v=LVE-2099-0001');
    assert.deepEqual(await response.json(), { found: false });
  });

  test('returns found:false for an unknown token', async () => {
    const response = await api('/api/certificates/verify?v=doesnotexist123');
    assert.deepEqual(await response.json(), { found: false });
  });

  test('assigns unique numbers under concurrent load', async () => {
    // The Wix backend derived numbers with max()+1 and could collide here.
    const batches = await Promise.all(
      Array.from({ length: 12 }, (_, i) => issue([{ firstName: `C${i}` }], 'LVA-2099'))
    );
    const numbers = (await Promise.all(batches.map((b) => b.json()))).flatMap((b) => b.numbers);

    assert.equal(numbers.length, 12);
    assert.equal(new Set(numbers).size, 12, 'certificate numbers must be unique');
  });

  test('issues unguessable, distinct tokens', async () => {
    const batch = await (
      await issue(Array.from({ length: 20 }, (_, i) => ({ firstName: `T${i}` })), 'LKE-2099')
    ).json();

    assert.equal(new Set(batch.tokens).size, 20);
    for (const token of batch.tokens) {
      assert.match(token, /^[A-Za-z0-9]{16}$/);
      // Ambiguous characters would make a printed code unreadable.
      assert.doesNotMatch(token, /[0O1Il]/);
    }
  });
});

describe('submissions', () => {
  const form = (fields) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return api('/api/submit', { method: 'POST', body: data });
  };

  const valid = {
    formName: 'enroll',
    firstName: 'Tamar',
    lastName: 'Gelashvili',
    email: 'tamar@example.com',
    phone: '+995555123456',
  };

  test('accepts a valid submission', async () => {
    const response = await form(valid);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  });

  test('rejects missing required fields', async () => {
    const response = await form({ ...valid, phone: '' });
    assert.equal(response.status, 400);
  });

  test('rejects an invalid email', async () => {
    const response = await form({ ...valid, email: 'not-an-email' });
    assert.equal(response.status, 400);
  });

  test('silently swallows honeypot submissions', async () => {
    // Answers 200 so the bot does not learn it was caught, but stores nothing.
    const response = await form({ ...valid, email: 'bot@spam.test', website: 'http://spam' });
    assert.equal(response.status, 200);

    const { rows } = await db.query(
      'SELECT count(*)::int AS n FROM submissions WHERE email = $1',
      ['bot@spam.test']
    );
    assert.equal(rows[0].n, 0, 'honeypot submission must not be stored');
  });

  test('rejects an unsupported file type', async () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ ...valid, formName: 'careers' })) {
      data.set(key, value);
    }
    data.set('resume', new Blob(['MZ'], { type: 'application/x-msdownload' }), 'x.exe');

    const response = await api('/api/submit', { method: 'POST', body: data });
    assert.equal(response.status, 415);
  });

  test('stores an attached CV', async () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ ...valid, formName: 'careers' })) {
      data.set(key, value);
    }
    data.set('resume', new Blob(['%PDF-1.4 cv'], { type: 'application/pdf' }), 'cv.pdf');

    const response = await api('/api/submit', { method: 'POST', body: data });
    assert.equal(response.status, 200);

    const { rows } = await db.query(
      `SELECT resume_name, octet_length(resume_data) AS bytes
         FROM submissions WHERE resume_name IS NOT NULL ORDER BY id DESC LIMIT 1`
    );
    assert.equal(rows[0].resume_name, 'cv.pdf');
    assert.ok(Number(rows[0].bytes) > 0);
  });
});

describe('meta events', () => {
  const post = (body) =>
    api('/api/meta/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  test('accepts a known event', async () => {
    const response = await post({ eventName: 'Lead', eventId: 'evt-1' });
    assert.equal(response.status, 200);
  });

  test('rejects an unknown event name', async () => {
    // An open endpoint would let anyone inject conversions into the ad account.
    const response = await post({ eventName: 'Purchase', eventId: 'evt-2' });
    assert.equal(response.status, 400);
  });

  test('requires an event ID', async () => {
    // Without one, the server copy cannot be deduplicated against the browser
    // copy and every conversion would be counted twice.
    const response = await post({ eventName: 'Lead' });
    assert.equal(response.status, 400);
  });

  test('refuses a disallowed origin', async () => {
    const response = await api('/api/meta/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ eventName: 'Lead', eventId: 'evt-3' }),
    });
    assert.equal(response.status, 403);
  });
});
