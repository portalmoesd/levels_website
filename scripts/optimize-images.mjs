/**
 * Converts the raw images pulled off static.wixstatic.com into web-sized WebP
 * assets under src/assets/images, and writes a manifest mapping each original
 * Wix media id to its new local filename.
 *
 * Images that only ever appeared on the abandoned Wix draft pages (`blank`,
 * `blank-11`) are skipped — they are not part of the live site and account for
 * most of the raw weight.
 *
 * Usage: node scripts/optimize-images.mjs <raw-media-dir> <crawl-dir>
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [rawDir, crawlDir] = process.argv.slice(2);
if (!rawDir || !crawlDir) {
  console.error('usage: node scripts/optimize-images.mjs <raw-media-dir> <crawl-dir>');
  process.exit(1);
}

const OUT = path.resolve('src/assets/images');
const DRAFT_PAGES = new Set(['blank', 'blank-11']);
const MAX_WIDTH = 1800;
const QUALITY = 80;

// Pages whose images get a descriptive prefix, so the asset names stay readable.
const PREFIX = {
  INDEX: 'home', home: 'home', about: 'about', team: 'team',
  art: 'art', 'drawing-kids': 'art-kids', 'drawing-9-12': 'art-9-12',
  'drawing-13-18': 'art-13-18', 'portfolio-creation': 'art-portfolio',
  'summer-schools': 'summer', 'study-abroad': 'study-abroad',
  ielts: 'ielts', 'fce-pet-cae': 'cambridge', 'business-english': 'professional',
  'corporate-english': 'corporate', 'private-lessons': 'private',
  'english-for-children': 'english-children', 'english-for-teens': 'english-teens',
  'english-for-adults': 'english-adults', 'sunday-school': 'sunday-school',
  'saturday-school': 'saturday-school', contactus: 'contact',
  'summer-school-california': 'summer-california',
  'summer-school-new-york-st-johns': 'summer-new-york',
  'summer-school-miami-barry': 'summer-miami',
  'london-kingston-summer-school': 'summer-kingston',
  'summer-school-london-brunel': 'summer-brunel',
  'summer-school-uk-ellesmere': 'summer-ellesmere',
  'summer-school-london-hertfordshire': 'summer-hertfordshire',
};

const MEDIA_RE =
  /static\.wixstatic\.com\/media\/([A-Za-z0-9_-]+(?:~mv2)?\.(?:png|jpg|jpeg|webp|gif|svg))/g;

// Build "which pages use this image" from the crawled HTML.
const usage = new Map();
for (const file of await readdir(crawlDir)) {
  if (!file.endsWith('.html')) continue;
  const page = file.slice(0, -5);
  const html = await readFile(path.join(crawlDir, file), 'utf8');
  for (const [, id] of html.matchAll(MEDIA_RE)) {
    if (!usage.has(id)) usage.set(id, new Set());
    usage.get(id).add(page);
  }
}

await mkdir(OUT, { recursive: true });

const manifest = {};
const counters = new Map();
let skipped = 0, converted = 0, rawBytes = 0, outBytes = 0;

for (const [id, pages] of [...usage].sort()) {
  const live = [...pages].filter((p) => !DRAFT_PAGES.has(p));
  if (live.length === 0) { skipped++; continue; }

  const src = path.join(rawDir, id);
  if (!existsSync(src)) { console.warn('missing raw file:', id); continue; }

  // Name by the page it is most associated with; global chrome gets "shared".
  const primary = live.length > 20 ? 'shared' : (PREFIX[live.sort()[0]] ?? live.sort()[0]);
  const n = (counters.get(primary) ?? 0) + 1;
  counters.set(primary, n);
  const name = `${primary}-${String(n).padStart(2, '0')}.webp`;

  const input = await readFile(src);
  rawBytes += input.length;
  const image = sharp(input, { animated: id.endsWith('.gif') });
  const meta = await image.metadata();
  const out = await image
    .resize({ width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  await writeFile(path.join(OUT, name), out);
  outBytes += out.length;
  converted++;

  manifest[id] = { file: name, width: meta.width, height: meta.height, pages: live.sort() };
}

await writeFile(
  path.resolve('src/assets/images-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);

const mb = (b) => (b / 1024 / 1024).toFixed(1) + 'MB';
console.log(`converted ${converted}, skipped ${skipped} draft-only`);
console.log(`${mb(rawBytes)} -> ${mb(outBytes)}`);
