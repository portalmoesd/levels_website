/**
 * Builds src/data/team.json from the extracted /team pages.
 *
 * Both locales list staff as repeating (role, name, bio) triples, so the page
 * is walked in threes. Roles repeat and act as the anchor, which keeps the walk
 * in step even if a bio happens to be short.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROLES = {
  en: ['Academy Manager', 'English Language Teacher', 'Art Academy Teacher'],
  ka: ['აკადემიის მენეჯერი', 'ინგლისური ენის მასწავლებელი', 'ხელოვნების აკადემიის მასწავლებელი'],
};

async function parse(locale) {
  const file = path.resolve('content/raw', locale, 'team.json');
  const { blocks } = JSON.parse(await readFile(file, 'utf8'));
  const roles = new Set(ROLES[locale]);

  const people = [];
  for (let i = 0; i < blocks.length; i++) {
    if (!roles.has(blocks[i])) continue;
    const role = blocks[i];
    const name = blocks[i + 1];
    const bio = blocks[i + 2];
    // A bio is long prose; if the next block is another role we have no bio.
    if (!name || roles.has(name)) continue;
    people.push({ role, name, bio: bio && !roles.has(bio) ? bio : '' });
  }
  return people;
}

const en = await parse('en');
const ka = await parse('ka');

if (en.length !== ka.length) {
  console.warn(`warning: ${en.length} people in EN but ${ka.length} in KA — pairing by index`);
}

const team = en.map((p, i) => ({
  id: p.name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
  name: { en: p.name, ka: ka[i]?.name ?? p.name },
  role: { en: p.role, ka: ka[i]?.role ?? p.role },
  bio: { en: p.bio, ka: ka[i]?.bio ?? '' },
}));

await writeFile(path.resolve('src/data/team.json'), JSON.stringify(team, null, 2) + '\n');
console.log(`team: ${team.length} people`);
for (const p of team) {
  const missing = !p.bio.ka ? ' (no KA bio)' : '';
  console.log(`  ${p.name.en} — ${p.role.en}${missing}`);
}
