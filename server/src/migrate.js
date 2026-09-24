import { pool, query } from './db.js';

/**
 * Creates the schema. Safe to re-run: everything is IF NOT EXISTS.
 *
 * Run once after provisioning the database, and again after any schema change:
 *   npm run migrate
 */

const statements = [
  // --------------------------------------------------------- certificates
  /*
   * Mirrors the Wix `Certificates` collection field for field, so the export
   * imports without transformation and — critically — so the tokens printed on
   * certificates already in circulation keep resolving.
   *
   * The token is the lookup key, not cert_number: the QR encodes the token
   * precisely so that nobody can walk the registry by incrementing the
   * sequential number.
   */
  `CREATE TABLE IF NOT EXISTS certificates (
     id          BIGSERIAL PRIMARY KEY,
     cert_number TEXT NOT NULL UNIQUE,
     token       TEXT NOT NULL UNIQUE,
     first_name  TEXT NOT NULL DEFAULT '',
     last_name   TEXT NOT NULL DEFAULT '',
     course      TEXT NOT NULL DEFAULT '',
     level       TEXT NOT NULL DEFAULT '',
     hours       TEXT NOT NULL DEFAULT '',
     start_date  TEXT NOT NULL DEFAULT '',
     end_date    TEXT NOT NULL DEFAULT '',
     branch      TEXT NOT NULL DEFAULT '',
     template_id TEXT NOT NULL DEFAULT '',
     issued_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS certificates_token_idx ON certificates (token)`,

  /*
   * Certificate numbers are assigned per prefix (LVE-2026, LKA-2026, ...).
   * The Wix backend derived the next number with max()+1, which could collide
   * if two people pressed Generate in the same second. A sequence table with
   * row-level locking removes that possibility.
   */
  `CREATE TABLE IF NOT EXISTS certificate_sequences (
     prefix   TEXT PRIMARY KEY,
     next_seq INTEGER NOT NULL DEFAULT 1
   )`,

  // ---------------------------------------------------------- submissions
  `CREATE TABLE IF NOT EXISTS submissions (
     id          BIGSERIAL PRIMARY KEY,
     form_name   TEXT NOT NULL,
     locale      TEXT NOT NULL DEFAULT 'en',
     first_name  TEXT NOT NULL DEFAULT '',
     last_name   TEXT NOT NULL DEFAULT '',
     email       TEXT NOT NULL DEFAULT '',
     phone       TEXT NOT NULL DEFAULT '',
     company     TEXT NOT NULL DEFAULT '',
     course      TEXT NOT NULL DEFAULT '',
     birthday    TEXT NOT NULL DEFAULT '',
     message     TEXT NOT NULL DEFAULT '',
     resume_name TEXT,
     resume_type TEXT,
     resume_data BYTEA,
     page_url    TEXT NOT NULL DEFAULT '',
     user_agent  TEXT NOT NULL DEFAULT '',
     ip_hash     TEXT NOT NULL DEFAULT '',
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS submissions_created_idx ON submissions (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS submissions_form_idx ON submissions (form_name, created_at DESC)`,
];

async function main() {
  console.log('running migrations…');
  for (const statement of statements) {
    await query(statement);
  }

  // Seed the sequence table from any certificates already imported, so
  // numbering continues from where Wix left off rather than restarting at 1.
  await query(`
    INSERT INTO certificate_sequences (prefix, next_seq)
    SELECT
      substring(cert_number from '^(.*)-[0-9]+$') AS prefix,
      MAX(CAST(substring(cert_number from '([0-9]+)$') AS INTEGER)) + 1
    FROM certificates
    WHERE cert_number ~ '^.+-[0-9]+$'
    GROUP BY 1
    ON CONFLICT (prefix) DO UPDATE
      SET next_seq = GREATEST(certificate_sequences.next_seq, EXCLUDED.next_seq)
  `);

  const { rows } = await query('SELECT prefix, next_seq FROM certificate_sequences ORDER BY prefix');
  console.log('migrations complete.');
  if (rows.length) {
    console.log('certificate numbering continues from:');
    for (const row of rows) console.log(`  ${row.prefix}-${String(row.next_seq).padStart(4, '0')}`);
  } else {
    console.log('no certificates imported yet — numbering will start at 0001 per prefix.');
  }

  await pool.end();
}

main().catch((error) => {
  console.error('migration failed:', error);
  process.exit(1);
});
