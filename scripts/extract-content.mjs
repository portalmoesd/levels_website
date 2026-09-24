/**
 * Extracts the text content of the crawled Wix pages into per-locale JSON.
 *
 * Wix splits words across inline <span> elements, so inline tags are stripped
 * without inserting whitespace (otherwise Georgian words come out broken, e.g.
 * "საზაფხულ ო") while block-level tags become block separators.
 *
 * Usage: node scripts/extract-content.mjs <crawl-dir> <locale>
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const [crawlDir, locale] = process.argv.slice(2);
if (!crawlDir || !locale) {
  console.error('usage: node scripts/extract-content.mjs <crawl-dir> <locale>');
  process.exit(1);
}

const BLOCK =
  'address|article|aside|blockquote|br|div|dd|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul';

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  '#39': "'", '#8217': '’', '#8216': '‘', '#8211': '–', '#8212': '—',
};
const decode = (s) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e) => {
    if (ENTITIES[e]) return ENTITIES[e];
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X'
        ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return m;
  });

// Chrome that repeats on every page and carries no page-specific meaning.
const CHROME = new Set([
  'top of page', 'bottom of page', 'Menu', 'Close', 'QUIZ', 'Quiz',
  'English', 'Art', 'Summer School', 'Study Abroad', 'About', 'Contact',
  '032 2 18 06 05', 'levels academy', 'Facebook', 'Instagram', 'Whatsapp', 'LinkedIn',
  '© 2026 by Levels Academy.',
  'ინგლისური', 'ხელოვნება',
  'საზაფხულო სკოლები',
  'სწავლა საზღვარგარეთ',
  'ჩვენ შესახებ', 'კონტაქტი',
]);

const OUT = path.resolve('content/raw', locale);
await mkdir(OUT, { recursive: true });

const index = {};
for (const file of (await readdir(crawlDir)).sort()) {
  if (!file.endsWith('.html')) continue;
  const slug = file.slice(0, -5);
  const raw = await readFile(path.join(crawlDir, file), 'utf8');

  const title = decode((raw.match(/<title>([\s\S]*?)<\/title>/) ?? [, ''])[1]).trim();
  const description = decode(
    (raw.match(/<meta name="description" content="([\s\S]*?)"\s*\/?>/) ?? [, ''])[1]
  ).trim();

  let body = raw
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(new RegExp(`</?(?:${BLOCK})\\b[^>]*>`, 'gi'), '\n') // block -> separator
    .replace(/<[^>]+>/g, '');                                     // inline -> nothing

  const seen = new Set();
  const blocks = [];
  for (const line of decode(body).split('\n')) {
    // Wix's stored content contains stray NUL bytes and zero-width characters,
    // sometimes mid-word, which must be removed rather than turned into spaces
    // or Georgian words come out split.
    const t = line
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u200b-\u200d\ufeff]/g, '')
      .replace(/[ \t\u00a0]+/g, ' ')
      .trim();
    if (!t || t === '​' || CHROME.has(t)) continue;
    if (seen.has(t)) continue;        // Wix renders each string twice (mobile + desktop)
    seen.add(t);
    blocks.push(t);
  }

  await writeFile(
    path.join(OUT, `${slug}.json`),
    JSON.stringify({ slug, locale, title, description, blocks }, null, 2) + '\n'
  );
  index[slug] = { title, description, blockCount: blocks.length };
}

await writeFile(path.join(OUT, '_index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`${locale}: extracted ${Object.keys(index).length} pages`);
