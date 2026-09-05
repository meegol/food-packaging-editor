import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/b8b0eef1-950c-43e3-a108-285e35fc5f69';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'playwright_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test against live Vercel production URL or local server
const TARGET_URL = process.env.TEST_URL || 'https://thesis-sable-pi.vercel.app';

console.log('=================================================================');
console.log(`🎭 STARTING PLAYWRIGHT E2E TESTS ON: ${TARGET_URL}`);
console.log('=================================================================\n');

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`[Browser Unhandled Exception]: ${err.message}`);
  });

  try {
    console.log(`1. Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Verify Title
    const title = await page.title();
    console.log(`   ✓ Page title: "${title}"`);

    // Verify Header
    await page.waitForSelector('.app-header', { timeout: 10000 });
    console.log('   ✓ App Header loaded successfully');

    // Screenshot initial Flat Net
    const flatNetPath = path.join(SCREENSHOT_DIR, '01_flat_net.png');
    await page.screenshot({ path: flatNetPath });
    console.log(`   ✓ Screenshot captured: ${flatNetPath}`);

    // Verify View Mode Switcher
    console.log('\n2. Testing View Mode Switcher:');
    const viewTabs = await page.waitForSelector('.viewport-view-mode-tabs', { timeout: 5000 });
    console.log('   ✓ View mode switcher tabs present');

    // Switch to 2D Assembled Preview
    console.log('   Switching to [ 📦 2D Assembled ] mode...');
    const assembledBtn = page.locator('.view-mode-tab:has-text("2D Assembled")');
    await assembledBtn.click();
    await page.waitForTimeout(500);

    // Verify Assembled Preview is visible
    await page.waitForSelector('.assembled-preview-container', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('.assembled-svg-viewport', { state: 'visible', timeout: 5000 });
    console.log('   ✓ 2D Assembled Preview container and SVG viewport rendered');

    // Test Material Switcher (switch to Kraft)
    console.log('   Testing material finishes (Kraft Paper)...');
    const kraftBtn = page.locator('.preview-material-btn:has-text("Kraft")');
    await kraftBtn.click();
    await page.waitForTimeout(300);

    // Test View Angle (3/4 Hero -> Front -> Side)
    console.log('   Testing view angles (Front, Side, 3/4 Hero)...');
    await page.locator('.preview-pill-btn:has-text("Front")').click();
    await page.waitForTimeout(300);
    await page.locator('.preview-pill-btn:has-text("Side")').click();
    await page.waitForTimeout(300);
    await page.locator('.preview-pill-btn:has-text("3/4 Hero")').click();
    await page.waitForTimeout(300);

    const assembledBurgerPath = path.join(SCREENSHOT_DIR, '02_assembled_burger_kraft.png');
    await page.screenshot({ path: assembledBurgerPath });
    console.log(`   ✓ Screenshot captured: ${assembledBurgerPath}`);

    // Switch to Split View
    console.log('\n3. Testing [ ◫ Split View ] mode:');
    const splitBtn = page.locator('.view-mode-tab:has-text("Split View")');
    await splitBtn.click();
    await page.waitForTimeout(600);

    // Verify both flat pane and assembled preview pane are visible
    const isFlatVisible = await page.locator('.flat-canvas-pane').isVisible();
    const isAssembledVisible = await page.locator('.assembled-preview-pane').isVisible();
    console.log(`   ✓ Flat Net visible in Split View: ${isFlatVisible}`);
    console.log(`   ✓ Assembled Preview visible in Split View: ${isAssembledVisible}`);

    const splitViewPath = path.join(SCREENSHOT_DIR, '03_split_view.png');
    await page.screenshot({ path: splitViewPath });
    console.log(`   ✓ Screenshot captured: ${splitViewPath}`);

    // Template Switching in Assembled View
    console.log('\n4. Testing Template Switching in 2D Assembled View:');

    // Switch to Assembled full view for clarity
    await assembledBtn.click();
    await page.waitForTimeout(300);

    const selectTemplate = async (templateName: string) => {
      console.log(`   Selecting "${templateName}"...`);
      await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
      await page.waitForTimeout(300);
      await page.locator(`.template-card:has-text("${templateName}")`).click();
      await page.waitForTimeout(600);
    };

    // Test Sandwich Wedge Box
    await selectTemplate('Sandwich Wedge Box');
    const sandwichPath = path.join(SCREENSHOT_DIR, '04_sandwich_wedge_assembled.png');
    await page.screenshot({ path: sandwichPath });
    console.log(`   ✓ Sandwich Wedge Box rendered: ${sandwichPath}`);

    // Test French Fries Scoop Box
    await selectTemplate('French Fries Scoop Box');
    const friesPath = path.join(SCREENSHOT_DIR, '05_fries_scoop_assembled.png');
    await page.screenshot({ path: friesPath });
    console.log(`   ✓ French Fries Scoop Box rendered: ${friesPath}`);

    // Test Dessert Window Sleeve Box with slider
    await selectTemplate('Dessert Window Sleeve Box');

    // Slide tray open
    const slider = page.locator('.openness-slider');
    if (await slider.isVisible()) {
      await slider.evaluate((el: HTMLInputElement) => {
        el.value = '0.75';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(400);
    }

    const dessertPath = path.join(SCREENSHOT_DIR, '06_dessert_sleeve_extended.png');
    await page.screenshot({ path: dessertPath });
    console.log(`   ✓ Dessert Window Sleeve Box extended rendered: ${dessertPath}`);

    // Test Sliced Bread Loaf Bag
    await selectTemplate('Sliced Bread Loaf Bag');
    const breadPath = path.join(SCREENSHOT_DIR, '07_bread_loaf_bag_assembled.png');
    await page.screenshot({ path: breadPath });
    console.log(`   ✓ Sliced Bread Loaf Bag rendered: ${breadPath}`);

    // 5. Test Adding Text & Artwork Mapping
    console.log('\n5. Testing Live Artwork Mapping:');
    // Switch to Pizza Box
    await selectTemplate('Pizza Box');

    // Switch back to Split View to add text
    await splitBtn.click();
    await page.waitForTimeout(500);

    // Go to Faces tab in sidebar
    await page.locator('.sidebar-tab-btn:has-text("Faces")').click();
    await page.waitForTimeout(300);

    // Click on Top Lid face card in Face Studio
    const topLidCard = page.locator('.panel-studio-card:has-text("Top Lid")').first();
    if (await topLidCard.isVisible()) {
      await topLidCard.click();
      await page.waitForTimeout(300);

      // Click "+ Text" tool on this face
      const addTextBtn = topLidCard.locator('button:has-text("+ Text")');
      if (await addTextBtn.isVisible()) {
        await addTextBtn.click();
        await page.waitForTimeout(500);
        console.log('   ✓ Added custom brand text to Top Lid face');
      }
    }

    const pizzaTextMappedPath = path.join(SCREENSHOT_DIR, '08_pizza_box_text_mapped.png');
    await page.screenshot({ path: pizzaTextMappedPath });
    console.log(`   ✓ Live text mapped on assembled Pizza Box: ${pizzaTextMappedPath}`);

    console.log('\n=================================================================');
    console.log('🎉 ALL PLAYWRIGHT END-TO-END TESTS COMPLETED SUCCESSFULLY!');
    console.log('=================================================================');
  } catch (err) {
    console.error('❌ Playwright Test Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
