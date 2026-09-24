/**
 * Merges the per-locale extractions in content/raw into bilingual page files
 * under src/content/pages, segmented into sections.
 *
 * Course pages on the Wix site all follow the same shape: a header block
 * (kicker, title, duration/lesson/price meta, sometimes the Cambridge badge)
 * followed by a series of headed sections. The headings are consistent enough
 * per locale to split on, so each page becomes:
 *
 *   { slug, header: { en: [...], ka: [...] }, sections: [ { key, heading, body } ] }
 *
 * Anything that does not match a known heading is kept in an `unsectioned`
 * bucket rather than dropped, so no copy is silently lost in the migration.
 *
 * Usage: node scripts/build-content.mjs
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const RAW = path.resolve('content/raw');
const OUT = path.resolve('src/content/pages');

/**
 * Section headings, keyed by a stable id. Several English variants map to one
 * key because the Wix pages phrase the same heading differently depending on
 * audience ("What will my child learn" vs "What will students learn").
 */
/*
 * Both locales phrase the same heading several ways, and the Georgian copy
 * contains a few typos ("ჯგუფება" for "ჯგუფები", "კურზე" for "კურსზე",
 * "ხელმძრვანელობს" for "ხელმძღვანელობს"). Every observed variant is listed so
 * the sections match on the real content rather than an idealised version of
 * it. The variants were harvested from the crawl, not guessed.
 */
const SECTIONS = [
  { key: 'about', en: ['About the Course', 'About the course'],
    ka: ['კურსის შესახებ', 'კურსის შეახებ'] },

  { key: 'learn', en: ['What will students learn in this course?', 'What will my child learn in this course?', 'What will I learn in this course?'],
    ka: ['რას მოიცავს კურსი?'] },

  { key: 'materials', en: ['What learning materials will be used?', 'What learning materials will I use?', 'What learning materials will my child use?'],
    ka: ['რა სასწავლო მასალები გამოიყენება კურსზე?', 'რომელი სასწავლო მასალები გამოიყენება კურსზე?', 'რა მასალები გამოიყენება კურსზე?', 'რა სასწავლო მასალები გამოიყენება კურზე?'] },

  { key: 'start', en: ['When does the course start?'],
    ka: ['როდის იწყება კურსი?'] },

  { key: 'groups', en: ['How are groups formed?', 'How do you form groups?'],
    ka: ['როგორ იქმნება ჯგუფები?', 'როგორ იქმნება ჯგუფება?', 'როგორ იქმნება ჯგუფი?'] },

  { key: 'lessonStructure', en: ['What is the lesson structure?'],
    ka: ['როგორია გაკვეთილის სტრუქტურა?'] },

  { key: 'teacher', en: ['Who will be guiding the course?'],
    ka: ['ვინ ხელმძღვანელობს კურსს?', 'ვინ ხელმძრვანელობს კურსს?'] },

  { key: 'methodology', en: ['Teaching Methodology'],
    ka: ['სწავლების მეთოდოლოგია'] },

  { key: 'tracks', en: ['Available Course Tracks', 'Available tracks include:', 'Available courses'],
    ka: ['ხელმისაწვდომი კურსის მიმართულებები', 'ხელმისაწვდომი კურსებია:', 'კურსის მიმართულებები'] },

  { key: 'pricing', en: ['Available Individual Programs and Pricing (per 8 lessons)', 'Available Individual Programs and Pricing'],
    ka: ['ინდივიდუალური პროგრამები და ღირებულება (8 გაკვეთილი)', 'ინდივიდუალური პროგრამები და ფასები'] },

  { key: 'admission', en: ['University Admission Support'],
    ka: ['უნივერსიტეტში ჩაბარების მხარდაჭერა'] },

  { key: 'why', en: ['Why choose Levels Academy?'],
    ka: ['რატომ ლეველს აკადემია?'] },

  { key: 'audience', en: ['Who is it for?'],
    ka: ['ვისთვის არის პროგრამა?'] },

  { key: 'how', en: ['How it works?', 'How it works'],
    ka: ['პროცესი', 'როგორ მუშაობს?'] },

  { key: 'documents', en: ['Required Documents (starter checklist)', 'Required Documents'],
    ka: ['საჭირო დოკუმენტები'] },

  { key: 'faqWork', en: ['Can I work while studying?'],
    ka: ['შემიძლია სწავლას მუშაობაც შევუთავსო?'] },

  // "Do you help we housing?" is a typo in the live Wix copy; it is matched
  // as-is here and corrected when rendered.
  { key: 'faqHousing', en: ['Do you help we housing?', 'Do you help with housing?'],
    ka: ['საცხოვრებლის პოვნაში ეხმარებით?'] },

  { key: 'artists', en: ['Who were Van Gogh, Picasso, Pirosmani?'],
    ka: ['ვინ იყვნენ ვან გოგი, პიკასო, ფიროსმანი?'] },

  { key: 'activities', en: ['Activities'],
    ka: ['აქტივობები'] },

  { key: 'team', en: ['OUR TEAM', 'Our Team Members.'],
    ka: ['ჩვენი გუნდის წევრები', 'ჩვენი გუნდი'] },
];

const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * The course pages render their key facts as a label block followed by a value
 * block ("Course Duration" then "4 months"). These are the labels per locale;
 * the value is whatever block comes next.
 */
const META_LABELS = [
  { key: 'duration',     en: ['Course Duration', 'Duration'],       ka: ['ხანგრძლივობა'] },
  { key: 'lessonLength', en: ['Lesson Duration'],                   ka: ['გაკვეთილი'] },
  { key: 'perWeek',      en: ['Lessons per week', 'Lessons'],       ka: ['გაკვეთილები'] },
  { key: 'age',          en: ['Age'],                               ka: ['ასაკი'] },
  { key: 'price',        en: ['Price'],                             ka: ['ფასი'] },
  { key: 'dates',        en: ['Dates'],                             ka: ['თარიღები'] },
];

/**
 * Reads the label/value pairs out of a page's header blocks. Price is special:
 * it is followed by either one value, or a struck-through list price and then
 * the discounted price, so up to two following blocks are captured.
 */
function readMeta(header, locale) {
  const lookup = new Map();
  for (const m of META_LABELS) {
    for (const l of [...m[locale], ...m.en]) lookup.set(norm(l), m.key);
  }

  const meta = {};
  for (let i = 0; i < header.length; i++) {
    const key = lookup.get(norm(header[i]));
    if (!key || meta[key]) continue;

    const next = header[i + 1];
    if (!next || lookup.has(norm(next))) continue;

    if (key === 'price') {
      const after = header[i + 2];
      const isSecondPrice = after && /[₾$£€]/.test(after) && !lookup.has(norm(after));
      meta.price = isSecondPrice ? { was: next, now: after } : { now: next };
    } else {
      meta[key] = next;
    }
  }
  return meta;
}

/** Splits one locale's blocks into { header, sections, unsectioned }. */
function segment(blocks, locale) {
  // Some Georgian pages were never fully translated and still carry the English
  // heading (e.g. /ka/english-for-children uses "About the Course"), so every
  // locale also matches the English variants.
  const lookup = new Map();
  for (const s of SECTIONS) {
    for (const h of [...s[locale], ...s.en]) lookup.set(norm(h), s.key);
  }

  const header = [];
  const found = new Map();
  let current = null;

  for (const block of blocks) {
    const key = lookup.get(norm(block));
    if (key) {
      current = key;
      if (!found.has(key)) found.set(key, { heading: block, body: [] });
      continue;
    }
    if (current) found.get(current).body.push(block);
    else header.push(block);
  }
  return { header, sections: found };
}

await mkdir(OUT, { recursive: true });

const slugs = (await readdir(path.join(RAW, 'en')))
  .filter((f) => f.endsWith('.json') && f !== '_index.json')
  .map((f) => f.slice(0, -5));

const report = [];

for (const slug of slugs) {
  const en = JSON.parse(await readFile(path.join(RAW, 'en', `${slug}.json`), 'utf8'));

  let ka = null;
  try {
    ka = JSON.parse(await readFile(path.join(RAW, 'ka', `${slug}.json`), 'utf8'));
  } catch {
    /* no Georgian counterpart — handled below */
  }

  const segEn = segment(en.blocks, 'en');
  const segKa = ka ? segment(ka.blocks, 'ka') : null;

  const keys = [...new Set([...segEn.sections.keys(), ...(segKa?.sections.keys() ?? [])])];
  const sections = keys.map((key) => ({
    key,
    heading: {
      en: segEn.sections.get(key)?.heading ?? '',
      ka: segKa?.sections.get(key)?.heading ?? '',
    },
    body: {
      en: segEn.sections.get(key)?.body ?? [],
      ka: segKa?.sections.get(key)?.body ?? [],
    },
  }));

  const page = {
    slug,
    title: { en: en.title, ka: ka?.title ?? '' },
    description: { en: en.description, ka: ka?.description ?? '' },
    header: { en: segEn.header, ka: segKa?.header ?? [] },
    meta: {
      en: readMeta(segEn.header, 'en'),
      ka: segKa ? readMeta(segKa.header, 'ka') : {},
    },
    sections,
  };

  await writeFile(path.join(OUT, `${slug}.json`), JSON.stringify(page, null, 2) + '\n');

  report.push({
    slug,
    ka: Boolean(ka),
    sections: keys.length,
    enBlocks: en.blocks.length,
    kaBlocks: ka?.blocks.length ?? 0,
  });
}

const noKa = report.filter((r) => !r.ka).map((r) => r.slug);
const noSections = report.filter((r) => r.sections === 0).map((r) => r.slug);

console.log(`built ${report.length} bilingual pages`);
if (noKa.length) console.log(`  no Georgian version: ${noKa.join(', ')}`);
if (noSections.length) console.log(`  no recognised sections (header-only): ${noSections.join(', ')}`);
