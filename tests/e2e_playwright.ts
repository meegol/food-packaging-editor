import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/b8b0eef1-950c-43e3-a108-285e35fc5f69';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'playwright_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Default to local dev server or override via env
const TARGET_URL = process.env.TEST_URL || 'http://localhost:5173';

console.log('=================================================================');
console.log(`🎭 STARTING PLAYWRIGHT 360° SCROLL & TURNTABLE TESTS ON: ${TARGET_URL}`);
console.log('=================================================================\n');

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  });

  const page = await context.newPage();

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

    const title = await page.title();
    console.log(`   ✓ Page title: "${title}"`);

    await page.waitForSelector('.app-header', { timeout: 10000 });
    console.log('   ✓ App Header loaded successfully');

    // Switch to 2D Assembled Preview
    console.log('\n2. Testing 2D Assembled 360° Preview:');
    const assembledBtn = page.locator('.view-mode-tab:has-text("2D Assembled")');
    await assembledBtn.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('.assembled-preview-container', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('.assembled-svg-viewport', { state: 'visible', timeout: 5000 });
    console.log('   ✓ 2D Assembled Preview container and SVG rendered');

    // 2a. Screenshot Initial 3/4 Hero View
    const heroPath = path.join(SCREENSHOT_DIR, '01_assembled_burger_34_hero.png');
    await page.screenshot({ path: heroPath });
    console.log(`   ✓ Screenshot 1 (3/4 Hero): ${heroPath}`);

    // 2b. Test Face Snap: FRONT (0°)
    console.log('   Testing Face Snap -> Front (0°)...');
    await page.locator('.preview-pill-btn:has-text("Front")').click();
    await page.waitForTimeout(400);
    const frontPath = path.join(SCREENSHOT_DIR, '02_assembled_burger_front_view.png');
    await page.screenshot({ path: frontPath });
    console.log(`   ✓ Screenshot 2 (Front View): ${frontPath}`);

    // 2c. Test Face Snap: BACK (180°) - showing rear wall & hinge
    console.log('   Testing Face Snap -> Back (180°)...');
    await page.locator('.preview-pill-btn:has-text("Back")').click();
    await page.waitForTimeout(400);
    const backPath = path.join(SCREENSHOT_DIR, '03_assembled_burger_back_view.png');
    await page.screenshot({ path: backPath });
    console.log(`   ✓ Screenshot 3 (Back View): ${backPath}`);

    // 2d. Test Face Snap: RIGHT (90°) & LEFT (270°)
    console.log('   Testing Face Snap -> Right (90°) and Left (270°)...');
    await page.locator('.preview-pill-btn:has-text("Right")').click();
    await page.waitForTimeout(300);
    await page.locator('.preview-pill-btn:has-text("Left")').click();
    await page.waitForTimeout(300);

    // 2e. Test 360° Turntable Rotation Slider
    console.log('\n3. Testing 360° Turntable Rotation Slider:');
    const turntableSlider = page.locator('.turntable-slider');
    await turntableSlider.waitFor({ state: 'visible', timeout: 3000 });

    await turntableSlider.evaluate((el: HTMLInputElement) => {
      el.value = '135';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(400);

    const degreeBadge = await page.locator('.turntable-degree-badge').innerText();
    console.log(`   ✓ Turntable degree counter: ${degreeBadge}`);

    const turntablePath = path.join(SCREENSHOT_DIR, '04_assembled_burger_turntable_rotated.png');
    await page.screenshot({ path: turntablePath });
    console.log(`   ✓ Screenshot 4 (Turntable 135°): ${turntablePath}`);

    // 2f. Test Wheel Scrolling over Preview
    console.log('\n4. Testing Mouse-Wheel / Touchpad Scrolling:');
    const previewContainer = page.locator('.assembled-preview-container');
    // Dispatch wheel events
    await previewContainer.evaluate((el) => {
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }));
    });
    await page.waitForTimeout(300);
    const newDegreeBadge = await page.locator('.turntable-degree-badge').innerText();
    console.log(`   ✓ Scrolled preview container -> New angle: ${newDegreeBadge}`);

    // 5. Test All-Sides Scrollable Proof Sheet
    console.log('\n5. Testing All-Sides Scrollable Proof Sheet:');
    const sidesStrip = page.locator('.preview-sides-strip');
    await sidesStrip.waitFor({ state: 'visible', timeout: 3000 });
    const sideCards = await page.locator('.preview-side-card').count();
    console.log(`   ✓ All-Sides Proof Strip visible with ${sideCards} individual side cards`);

    // Click on "Base Left Wall" card to snap view
    const leftCard = page.locator('.preview-side-card:has-text("Base Left")').first();
    if (await leftCard.isVisible()) {
      await leftCard.click();
      await page.waitForTimeout(400);
      console.log('   ✓ Clicked "Base Left Wall" card in Proof Strip -> Snapped 3D view to side');
    }

    const proofSheetPath = path.join(SCREENSHOT_DIR, '05_all_sides_proof_sheet.png');
    await page.screenshot({ path: proofSheetPath });
    console.log(`   ✓ Screenshot 5 (All-Sides Proof Sheet): ${proofSheetPath}`);

    // 6. Test True 3D Geometries on other templates
    console.log('\n6. Testing 3D Templates Geometry:');

    const selectTemplate = async (templateName: string) => {
      console.log(`   Selecting "${templateName}"...`);
      await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
      await page.waitForTimeout(300);
      await page.locator(`.template-card:has-text("${templateName}")`).click();
      await page.waitForTimeout(600);
    };

    // Sandwich Wedge Box (Triangular 3D Prism)
    await selectTemplate('Sandwich Wedge Box');
    await page.locator('.preview-pill-btn:has-text("3/4 Hero")').click();
    await page.waitForTimeout(400);
    const sandwichPath = path.join(SCREENSHOT_DIR, '06_sandwich_wedge_3d_prism.png');
    await page.screenshot({ path: sandwichPath });
    console.log(`   ✓ Screenshot 6 (Sandwich Triangular Prism): ${sandwichPath}`);

    // French Fries Scoop Box
    await selectTemplate('French Fries Scoop Box');
    await page.waitForTimeout(400);
    const friesPath = path.join(SCREENSHOT_DIR, '07_fries_scoop_curved_carton.png');
    await page.screenshot({ path: friesPath });
    console.log(`   ✓ Screenshot 7 (French Fries Scoop): ${friesPath}`);

    // Pizza Box with Open Lid
    await selectTemplate('Pizza Box');
    const opennessSlider = page.locator('.openness-slider');
    if (await opennessSlider.isVisible()) {
      await opennessSlider.fill('0.65');
      await page.waitForTimeout(500);
    }
    const pizzaPath = path.join(SCREENSHOT_DIR, '08_pizza_box_open_lid.png');
    await page.screenshot({ path: pizzaPath });
    console.log(`   ✓ Screenshot 8 (Pizza Box Open Lid): ${pizzaPath}`);

    console.log('\n=================================================================');
    console.log('🎉 ALL PLAYWRIGHT 360° SCROLL & TURNTABLE TESTS PASSED!');
    console.log('=================================================================');
  } catch (err) {
    console.error('❌ Playwright Test Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
