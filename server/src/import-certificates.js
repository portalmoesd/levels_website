import { readFile } from 'node:fs/promises';
import { pool, query } from './db.js';

/**
 * Imports the Wix `Certificates` collection export into Postgres.
 *
 *   node src/import-certificates.js /path/to/Certificates.csv [--dry-run]
 *
 * This is the step that keeps every certificate already in circulation
 * verifiable. Each one carries a QR pointing at levels.ge/verify?v=<token>,
 * and the token only resolves if its row is in this table. Run this BEFORE the
 * Wix subscription lapses — once it does, the collection is unrecoverable.
 *
 * Re-running is safe: rows are matched on token and skipped if already present.
 */

/**
 * Minimal RFC 4180 CSV parser.
 *
 * Written out rather than pulled in as a dependency because the input is a
 * one-off export, and because certificate data contains quoted commas in
 * course names that a naive split would corrupt.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  // Strip a UTF-8 BOM, which Excel adds and which would otherwise become part
  // of the first column name.
  const input = text.replace(/^﻿/, '');

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/**
 * Wix exports use the collection's field IDs as headers, but people often
 * re-save the file from Excel with the display names instead. Both are
 * accepted, matched case- and space-insensitively.
 */
const FIELD_ALIASES = {
  certNumber: ['certnumber', 'certificatenumber', 'certificateno'],
  token: ['token'],
  firstName: ['firstname'],
  lastName: ['lastname'],
  course: ['course'],
  level: ['level'],
  hours: ['hours'],
  startDate: ['startdate'],
  endDate: ['enddate'],
  branch: ['branch'],
  templateId: ['templateid', 'template'],
  issuedAt: ['issuedat', 'issued', 'date'],
};

function buildColumnMap(header) {
  const normalise = (value) => value.trim().toLowerCase().replace(/[\s_-]/g, '');
  const normalisedHeader = header.map(normalise);

  const map = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const index = normalisedHeader.findIndex((column) => aliases.includes(column));
    if (index !== -1) map[field] = index;
  }
  return map;
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes('--dry-run');

  if (!file) {
    console.error('usage: node src/import-certificates.js <Certificates.csv> [--dry-run]');
    process.exit(1);
  }

  const rows = parseCsv(await readFile(file, 'utf8'));
  if (rows.length < 2) {
    console.error('the file has no data rows');
    process.exit(1);
  }

  const columns = buildColumnMap(rows[0]);

  // Without these two the registry cannot work: the token is how a QR resolves
  // and the number is what is printed on the certificate.
  for (const required of ['certNumber', 'token']) {
    if (columns[required] === undefined) {
      console.error(
        `column "${required}" not found. Header was: ${rows[0].join(', ')}\n` +
          'Re-export the Certificates collection from Wix including every field.'
      );
      process.exit(1);
    }
  }

  const value = (row, field) =>
    columns[field] === undefined ? '' : (row[columns[field]] ?? '').trim();

  let inserted = 0;
  let skipped = 0;
  const problems = [];

  for (const [index, row] of rows.slice(1).entries()) {
    const lineNumber = index + 2;
    const certNumber = value(row, 'certNumber');
    const token = value(row, 'token');

    if (!certNumber || !token) {
      problems.push(`line ${lineNumber}: missing certificate number or token — skipped`);
      continue;
    }

    const issuedRaw = value(row, 'issuedAt');
    const issuedAt = issuedRaw && !Number.isNaN(Date.parse(issuedRaw))
      ? new Date(issuedRaw)
      : new Date();
    if (issuedRaw && Number.isNaN(Date.parse(issuedRaw))) {
      problems.push(`line ${lineNumber}: unreadable issue date "${issuedRaw}" — used today`);
    }

    if (dryRun) {
      inserted += 1;
      continue;
    }

    const result = await query(
      `INSERT INTO certificates
         (cert_number, token, first_name, last_name, course, level, hours,
          start_date, end_date, branch, template_id, issued_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (token) DO NOTHING
       RETURNING id`,
      [
        certNumber,
        token,
        value(row, 'firstName'),
        value(row, 'lastName'),
        value(row, 'course'),
        value(row, 'level'),
        value(row, 'hours'),
        value(row, 'startDate'),
        value(row, 'endDate'),
        value(row, 'branch'),
        value(row, 'templateId'),
        issuedAt,
      ]
    );

    if (result.rowCount > 0) inserted += 1;
    else skipped += 1;
  }

  if (!dryRun) {
    // Continue numbering from the highest imported number per prefix, so newly
    // issued certificates never reuse a number already printed.
    await query(`
      INSERT INTO certificate_sequences (prefix, next_seq)
      SELECT
        substring(cert_number from '^(.*)-[0-9]+$'),
        MAX(CAST(substring(cert_number from '([0-9]+)$') AS INTEGER)) + 1
      FROM certificates
      WHERE cert_number ~ '^.+-[0-9]+$'
      GROUP BY 1
      ON CONFLICT (prefix) DO UPDATE
        SET next_seq = GREATEST(certificate_sequences.next_seq, EXCLUDED.next_seq)
    `);
  }

  console.log(dryRun ? '--- dry run, nothing written ---' : '--- import complete ---');
  console.log(`  imported: ${inserted}`);
  console.log(`  already present: ${skipped}`);

  if (problems.length) {
    console.log(`  warnings: ${problems.length}`);
    for (const problem of problems.slice(0, 20)) console.log(`    ${problem}`);
    if (problems.length > 20) console.log(`    …and ${problems.length - 20} more`);
  }

  if (!dryRun) {
    const { rows: seq } = await query(
      'SELECT prefix, next_seq FROM certificate_sequences ORDER BY prefix'
    );
    if (seq.length) {
      console.log('  next certificate number per prefix:');
      for (const s of seq) console.log(`    ${s.prefix}-${String(s.next_seq).padStart(4, '0')}`);
    }

    const { rows: sample } = await query(
      'SELECT token FROM certificates ORDER BY random() LIMIT 3'
    );
    if (sample.length) {
      console.log('  spot-check these against the live site before cancelling Wix:');
      for (const s of sample) console.log(`    https://www.levels.ge/verify?v=${s.token}`);
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error('import failed:', error);
  process.exit(1);
});
