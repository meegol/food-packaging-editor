// Client designs E2E check: every prebuilt client design loads onto its template
// with all of its layers, and exports a 1:1 PDF.
// Usage: node tests/test_client_designs.mjs [baseUrl]   (CHROMIUM=/usr/bin/chromium to use a system browser)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.join('tests', 'screenshots', 'client-designs');
fs.mkdirSync(OUT_DIR, { recursive: true });

const DESIGNS = fs.readdirSync('public/client-designs').filter((d) => fs.existsSync(`public/client-designs/${d}/design.json`));
const errors = [];
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failed++;
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
page.on('pageerror', (err) => errors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('dialog', (d) => d.accept());

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

for (const id of DESIGNS) {
  const expected = JSON.parse(fs.readFileSync(`public/client-designs/${id}/design.json`, 'utf8'));
  await page.locator('.sidebar-tab-btn:has-text("Design")').click();
  await page.locator(`.starter-design-card[data-design-id="${id}"]`).click();
  await page.waitForFunction(
    (n) => window.__DIELINE_ENGINE__?.graphicItems.length === n,
    expected.length,
    { timeout: 15000 },
  ).catch(() => {});
  await page.waitForTimeout(1500);

  const state = await page.evaluate(() => ({
    count: window.__DIELINE_ENGINE__?.graphicItems.length ?? -1,
    inlined: window.__DIELINE_ENGINE__?.graphicItems.every((g) => !g.src || g.src.startsWith('data:')),
  }));
  check(`${id}: all ${expected.length} layers placed`, state.count === expected.length, `${state.count}`);
  check(`${id}: images inlined as data URLs`, state.inlined);
  check(`${id}: card marked active`, await page.locator(`.starter-design-card[data-design-id="${id}"]`).getAttribute('aria-pressed') === 'true');
  await page.screenshot({ path: path.join(OUT_DIR, `${id}.png`) });

  await page.click('.header-action-btn.primary');
  await page.waitForSelector('.export-modal-dialog');
  await page.click('.export-tab-btn:has-text("1:1 Vector CAD PDF")');
  try {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.export-primary-btn')]);
    const out = path.join(OUT_DIR, `${id}.pdf`);
    await d.saveAs(out);
    check(`${id}: PDF exported`, fs.statSync(out).size > 10000, `${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  } catch (e) {
    check(`${id}: PDF exported`, false, e.message.split('\n')[0]);
  }
  await page.keyboard.press('Escape');
  await page.locator('.export-modal-dialog').waitFor({ state: 'detached', timeout: 3000 }).catch(async () => {
    await page.click('.export-modal-close').catch(() => {});
  });
}

check('no page/console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nAll client design checks passed');
process.exit(failed ? 1 : 0);
