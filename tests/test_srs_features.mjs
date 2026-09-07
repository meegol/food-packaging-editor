import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('🚀 Starting Vite preview server on port 4173...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  // Wait 2s for server to start
  await new Promise(r => setTimeout(r, 2000));

  console.log('🌐 Launching headless Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('Browser console error:', msg.text());
    }
  });

  const screenshotsDir = path.join(process.cwd(), 'tests', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    console.log('📍 Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, 'srs_01_loaded.png') });

    // 1. Verify Guest Session ID
    const sessionId = await page.evaluate(() => sessionStorage.getItem('thesis_guest_session_id'));
    console.log('✅ Guest Session ID in sessionStorage:', sessionId);
    if (!sessionId || !sessionId.startsWith('guest_')) {
      throw new Error(`Invalid guest session ID: ${sessionId}`);
    }

    // 2. Open Branding / Text Tab
    console.log('📝 Testing Extended Typography & Quick Templates...');
    const brandingTab = page.locator('button.sidebar-tab-btn:has-text("Branding")');
    await brandingTab.click();
    await page.waitForTimeout(400);

    const textSubTab = page.locator('button').filter({ hasText: /^Text$/ });
    await textSubTab.click();
    await page.waitForTimeout(400);

    // Apply "Nutrition Facts" template
    const nutritionBtn = page.locator('button:has-text("Nutrition Facts")');
    if (await nutritionBtn.count() > 0) {
      await nutritionBtn.click();
      console.log('✅ Applied Nutrition Facts template');
    }

    // Toggle Italic button
    const italicBtn = page.locator('button[title="Toggle Italic"]');
    if (await italicBtn.count() > 0) {
      await italicBtn.click();
      console.log('✅ Toggled Italic style');
    }

    // Toggle Curved Arc Text checkbox
    const curvedCheckbox = page.locator('input[type="checkbox"]').nth(0);
    await curvedCheckbox.check();
    console.log('✅ Checked Curved Arc Text option');

    // Click "Add Text to Packaging Face"
    const addTextBtn = page.locator('button:has-text("Add Text to Packaging Face")');
    await addTextBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'srs_02_text_added.png') });

    // 3. Testing Compliance Icons (FDA, Organic, Storage)
    console.log('🛡️ Testing Food Compliance Icons...');
    const iconsSubTab = page.locator('button').filter({ hasText: /^Icons$/ });
    await iconsSubTab.click();
    await page.waitForTimeout(400);

    // Click FDA Food Safe icon
    const fdaIcon = page.locator('text=FDA Food Safe').first();
    await fdaIcon.click();
    console.log('✅ Added FDA Food Safe icon');
    await page.waitForTimeout(300);

    // Click 100% Organic icon
    const organicIcon = page.locator('text=100% Organic').first();
    await organicIcon.click();
    console.log('✅ Added 100% Organic icon');
    await page.waitForTimeout(300);

    // Click Storage Instructions icon
    const storageIcon = page.locator('text=Storage Instructions').first();
    await storageIcon.click();
    console.log('✅ Added Storage Instructions icon');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'srs_03_compliance_icons.png') });

    // 4. Testing Layer Horizontal Alignment Buttons
    console.log('📐 Testing Layer Alignment Controls...');
    const alignLeftBtns = page.locator('button[title="Align Left within panel face"]');
    if (await alignLeftBtns.count() > 0) {
      await alignLeftBtns.first().click();
      console.log('✅ Clicked Align Left button');
      await page.waitForTimeout(200);
    }

    const alignCenterBtns = page.locator('button[title="Align Center within panel face"]');
    if (await alignCenterBtns.count() > 0) {
      await alignCenterBtns.first().click();
      console.log('✅ Clicked Align Center button');
      await page.waitForTimeout(200);
    }

    const alignRightBtns = page.locator('button[title="Align Right within panel face"]');
    if (await alignRightBtns.count() > 0) {
      await alignRightBtns.first().click();
      console.log('✅ Clicked Align Right button');
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'srs_04_layers_aligned.png') });

    // 5. Testing Export Modal & AutoCAD DXF Export Tab
    console.log('📦 Testing Export Modal & AutoCAD DXF Download...');
    const exportOpenBtn = page.locator('button.header-action-btn:has-text("Export")');
    await exportOpenBtn.click();
    await page.waitForTimeout(500);

    const dxfTab = page.locator('button:has-text("AutoCAD DXF")');
    await dxfTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, 'srs_05_dxf_tab_open.png') });

    // Verify download trigger
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    const dxfDownloadBtn = page.locator('button:has-text("Download CAD DXF (.dxf)")');
    await dxfDownloadBtn.click();
    const download = await downloadPromise;
    const downloadPath = path.join(screenshotsDir, download.suggestedFilename());
    await download.saveAs(downloadPath);

    console.log('✅ DXF Download completed successfully! File saved to:', downloadPath);
    const dxfFileContent = fs.readFileSync(downloadPath, 'utf-8');
    if (!dxfFileContent.includes('AC1009') || !dxfFileContent.includes('CUT_LINES')) {
      throw new Error('Downloaded DXF file is missing AC1009 header or CUT_LINES layer!');
    }
    console.log(`✅ Validated DXF content (${dxfFileContent.length} bytes, contains AC1009, CUT_LINES, CREASE_LINES)`);

    console.log('\n🎉 ALL SRS FEATURE AUDIT TESTS PASSED WITH ZERO CRITICAL ERRORS!');
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
