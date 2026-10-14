import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.join('tests', 'screenshots', 'starter-designs');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TEMPLATE_NAMES = [
  'Burger Clamshell Box',
  'Sandwich Wedge Box',
  'French Fries Scoop Box',
  'Pillow Packaging Box',
  'Dessert Window Sleeve Box',
  'Round Food Tub with Lid',
  'Pizza Box (Roll-End Tuck Top)',
  'Stand-up Ziplock Pouch',
  'Side Gusset Coffee/Cookie Bag',
  'Single-Serve Sachet Stick Pack',
  'Burger & Food Wrapper Sheet',
  'Sliced Bread Loaf Bag',
];
const STYLE_IDS = ['kraft', 'street', 'fresh', 'noir'];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (err) => errors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const layerCount = await page.evaluate(() => {
  const engine = window.__DIELINE_ENGINE__;
  return engine ? engine.graphicItems.length : -1;
});
console.log(`First load: ${layerCount} artwork layers on the net`);
if (layerCount <= 0) errors.push('First load shows an empty net');
await page.screenshot({ path: path.join(OUT_DIR, '00_first_load.png') });

const hideLabels = async () => {
  const btn = page.locator('button[title="Show face names"]');
  if (await btn.evaluate((el) => el.classList.contains('active'))) await btn.click();
};
await hideLabels();

for (const style of STYLE_IDS) {
  await page.locator('.sidebar-tab-btn:has-text("Design")').click();
  await page.locator(`.starter-design-card[data-design-id="${style}"]`).click();

  for (const [i, name] of TEMPLATE_NAMES.entries()) {
    await page.locator('.sidebar-tab-btn:has-text("Package")').click();
    await page.locator('.template-card').filter({ hasText: name }).click();
    await page.waitForTimeout(700);
    const file = `${style}_${String(i + 1).padStart(2, '0')}_${slug(name)}_flat.png`;
    await page.locator('.canvas-viewport-container').screenshot({ path: path.join(OUT_DIR, file) });
  }
}

await page.locator('.sidebar-tab-btn:has-text("Design")').click();
await page.locator('.starter-design-card[data-design-id="kraft"]').click();
for (const [i, name] of TEMPLATE_NAMES.entries()) {
  await page.locator('.sidebar-tab-btn:has-text("Package")').click();
  await page.locator('.template-card').filter({ hasText: name }).click();
  await page.locator('.view-mode-tab:has-text("3D Assembled")').click();
  await page.waitForTimeout(900);
  const prefix = `assembled_${String(i + 1).padStart(2, '0')}_${slug(name)}`;
  await page.locator('.canvas-viewport-container').screenshot({ path: path.join(OUT_DIR, `${prefix}.png`) });
  for (const side of ['Left', 'Right']) {
    await page.locator(`button[title^="${side} Side Wall"]`).click();
    await page.waitForTimeout(700);
    await page.locator('.canvas-viewport-container').screenshot({
      path: path.join(OUT_DIR, `${prefix}_${side.toLowerCase()}.png`),
    });
  }
  await page.locator('.preview-toolbar .preview-pill-btn').first().click();
  await page.locator('.view-mode-tab:has-text("Flat Net")').click();
}

await page.locator('.sidebar-tab-btn:has-text("Artwork")').click();
const replaceBtn = page.locator('button[aria-label="Replace Product photo"]').first();
const pngPath = path.join(OUT_DIR, '_replacement.png');
fs.writeFileSync(
  pngPath,
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64'),
);
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), replaceBtn.click()]);
await chooser.setFiles(pngPath);
await page.waitForTimeout(800);
const replaced = await page.evaluate(() =>
  window.__DIELINE_ENGINE__.graphicItems.find((g) => g.fileName === '_replacement.png'),
);
if (!replaced) errors.push('Replace did not swap the hero photo');
else console.log(`Replaced photo stays on "${replaced.panelId}" at scale ${replaced.scaleX.toFixed(2)}`);
await page.screenshot({ path: path.join(OUT_DIR, '99_after_replace.png') });

await browser.close();

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
console.log(`\nStarter design screenshots saved to ${OUT_DIR}`);
