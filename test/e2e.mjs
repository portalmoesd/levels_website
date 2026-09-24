/**
 * End-to-end checks against a built site and a running API.
 *
 *   npm run build && npx astro preview --port 4321 &
 *   (cd server && npm run dev) &
 *   node test/e2e.mjs
 *
 * Set BASE_URL / SHOT_DIR to point elsewhere. CHROME_PATH overrides the browser
 * binary, which is needed in sandboxes that ship their own Chromium.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const SHOT = process.argv[2] ?? process.env.SHOT_DIR ?? 'test/screenshots';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}
);
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
/*
 * Google Fonts and connect.facebook.net are the only external requests the
 * site makes. Some sandboxed environments intercept TLS with a CA the browser
 * does not trust, which surfaces as a certificate error for those two hosts
 * and nothing else — not a fault in the site, so it is not counted.
 */
const EXTERNAL_TLS = /ERR_CERT_AUTHORITY_INVALID|net::ERR_CERT/;
page.on('console', (m) => {
  if (m.type() === 'error' && !EXTERNAL_TLS.test(m.text())) consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

// Meta requests never leave the box in this test.
await context.route('**connect.facebook.net/**', (r) => r.fulfill({ status: 200, body: 'window.fbq&&(window.fbq.callMethod=function(){});' }));
await context.route('**facebook.com/tr**', (r) => r.fulfill({ status: 200, body: '' }));

// --- homepage ---------------------------------------------------------
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
ok('homepage h1', (await page.locator('h1').count()) === 1, await page.locator('h1').first().innerText());
ok('pixel stub initialised', await page.evaluate(() => typeof window.fbq === 'function'));
ok('API base injected', (await page.evaluate(() => window.__API_BASE)).length > 0);
await page.screenshot({ path: `${SHOT}/01-home.png`, fullPage: false });

// --- language switch --------------------------------------------------
await page.goto(BASE + '/ielts', { waitUntil: 'domcontentloaded' });
const switchHref = await page.locator('.lang-switch').getAttribute('href');
ok('language switch keeps the page', switchHref === '/ka/ielts', switchHref);
await page.screenshot({ path: `${SHOT}/02-course.png`, fullPage: false });

await page.goto(BASE + '/ka/ielts', { waitUntil: 'domcontentloaded' });
const lang = await page.locator('html').getAttribute('lang');
const kaHeading = await page.locator('h2').first().innerText();
ok('georgian page lang', lang === 'ka-GE', lang);
ok('georgian content renders', /[Ⴀ-ჿ]/.test(kaHeading), kaHeading);
await page.screenshot({ path: `${SHOT}/03-course-ka.png`, fullPage: false });

// --- form submission --------------------------------------------------
await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });

// validation first
await page.locator('form.enquiry button[type=submit]').click();
await page.waitForTimeout(300);
const errVisible = await page.locator('[data-error-for="firstName"]').isVisible();
ok('form blocks empty submit', errVisible);

await page.fill('#contact-firstName', 'Nino');
await page.fill('#contact-lastName', 'Beridze');
await page.fill('#contact-email', 'nino.test@example.com');
await page.fill('#contact-phone', '+995 555 10 20 30');
await page.fill('#contact-message', 'Automated end-to-end test');

const [submitResponse] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/submit')),
  page.locator('form.enquiry button[type=submit]').click(),
]);
ok('form POSTs to API', submitResponse.status() === 200, 'HTTP ' + submitResponse.status());
await page.waitForSelector('.enquiry__status[data-state="ok"]', { timeout: 5000 });
ok('success message shown', true, (await page.locator('.enquiry__status').innerText()).slice(0, 60));
await page.screenshot({ path: `${SHOT}/04-contact-submitted.png`, fullPage: false });

// --- certificate verification ----------------------------------------
/*
 * Seed a certificate through the API rather than relying on whatever happens
 * to be in the database — the API test suite truncates these tables, so shared
 * fixtures make this test order-dependent.
 */
const apiBase = await page.evaluate(() => window.__API_BASE);
const issued = await fetch(`${apiBase}/api/certificates/issue`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: process.env.CERT_ACCESS_CODE ?? 'test-secret-code',
    prefix: 'LVE-2031',
    rows: [{ firstName: 'Salome', lastName: 'Abashidze', course: 'General English', level: 'B1' }],
  }),
}).then((r) => r.json());

ok('certificate issued for test', Array.isArray(issued.tokens), JSON.stringify(issued).slice(0, 80));

await page.goto(`${BASE}/verify?v=${issued.tokens[0]}`, { waitUntil: 'networkidle' });
await page.waitForSelector('.certificate', { timeout: 5000 });
const certText = await page.locator('.certificate').innerText();
ok('valid certificate verifies', certText.includes('Salome'), certText.replace(/\s+/g, ' ').slice(0, 80));
await page.screenshot({ path: `${SHOT}/05-verify.png`, fullPage: false });

await page.goto(BASE + '/verify?v=totallybogus999', { waitUntil: 'networkidle' });
await page.waitForSelector('.not-found', { timeout: 5000 });
ok('unknown certificate rejected', true);

// --- quiz -------------------------------------------------------------
await page.goto(BASE + '/placement-quiz', { waitUntil: 'networkidle' });
await page.locator('form#quiz-form button[type=submit]').click();
await page.waitForTimeout(200);
ok('quiz blocks partial submit', await page.locator('#quiz-unanswered').isVisible());

for (const name of await page.locator('fieldset').evaluateAll((els) => els.map((e) => e.querySelector('input')?.name))) {
  if (name) await page.locator(`input[name="${name}"]`).first().check();
}
await page.locator('form#quiz-form button[type=submit]').click();
await page.waitForSelector('.quiz__card', { timeout: 5000 });
const level = await page.locator('.quiz__level').innerText();
ok('quiz produces a level', /^[ABC][12]$/.test(level), level);
await page.screenshot({ path: `${SHOT}/06-quiz-result.png`, fullPage: false });

// --- mobile -----------------------------------------------------------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mobile.newPage();
await mp.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok('no horizontal overflow on mobile', overflow <= 1, `${overflow}px`);
await mp.locator('.nav-toggle').click();
await mp.waitForTimeout(250);
ok('mobile menu opens', await mp.locator('#mobile-nav').isVisible());
await mp.screenshot({ path: `${SHOT}/07-mobile-menu.png`, fullPage: false });

ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
