import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/b8b0eef1-950c-43e3-a108-285e35fc5f69/playwright_screenshots';

const templates = [
  { name: 'Pillow Packaging Box', slug: 'pillow_box' },
  { name: 'Stand-up Ziplock Pouch', slug: 'standup_pouch' },
  { name: 'Side Gusset Coffee/Cookie Bag', slug: 'side_gusset_bag' },
  { name: 'Single-Serve Sachet Stick Pack', slug: 'sachet_stick_pack' },
  { name: 'Burger & Food Wrapper Sheet', slug: 'burger_wrapper' },
  { name: 'Sliced Bread Loaf Bag', slug: 'bread_loaf_bag' },
];

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Ensure 2D Assembled mode
  await page.locator('button:has-text("2D Assembled")').click();
  await page.waitForTimeout(400);

  for (const tmpl of templates) {
    console.log(`\nTesting template: ${tmpl.name}`);
    await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
    await page.waitForTimeout(300);
    await page.locator(`.template-card:has-text("${tmpl.name}")`).click();
    await page.waitForTimeout(600);

    // 1. 3/4 Hero
    await page.locator('.preview-pill-btn:has-text("3/4 Hero")').click();
    await page.waitForTimeout(400);
    const heroPath = path.join(SCREENSHOT_DIR, `diag_${tmpl.slug}_hero.png`);
    await page.screenshot({ path: heroPath });
    console.log(`  ✓ Hero: ${heroPath}`);

    // 2. Top View
    await page.locator('.preview-pill-btn:has-text("Top")').click();
    await page.waitForTimeout(400);
    const topPath = path.join(SCREENSHOT_DIR, `diag_${tmpl.slug}_top.png`);
    await page.screenshot({ path: topPath });
    console.log(`  ✓ Top: ${topPath}`);

    // 3. Side View
    await page.locator('.preview-pill-btn:has-text("Right")').click();
    await page.waitForTimeout(300);
    const sidePath = path.join(SCREENSHOT_DIR, `diag_${tmpl.slug}_side.png`);
    await page.screenshot({ path: sidePath });
    console.log(`  ✓ Side: ${sidePath}`);
  }

  await browser.close();
  console.log('\nAll diagnostic screenshots saved!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
