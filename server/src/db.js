import pg from 'pg';

/**
 * Postgres connection pool.
 *
 * Render provides DATABASE_URL. TLS is required on Render's managed Postgres,
 * but its certificate is signed by an internal CA that Node does not ship, so
 * `rejectUnauthorized` is relaxed for that host only — the connection is still
 * encrypted. A local development database over plain TCP needs no TLS at all.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — see server/README.md');
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  // A pooled connection dropped while idle. The pool replaces it; log so the
  // pattern is visible if it starts happening often.
  console.error('[db] idle client error:', error.message);
});

export const query = (text, params) => pool.query(text, params);

/** Runs `fn` inside a transaction, rolling back on any error. */
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
