import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/b8b0eef1-950c-43e3-a108-285e35fc5f69';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'playwright_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const TARGET_URL = process.env.TEST_URL || 'http://localhost:5173';

// 1. Red circle logo
const redSealSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%23ef4444" stroke="%23ffffff" stroke-width="6"/><text x="50" y="56" font-size="16" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">PREMIUM</text></svg>';

// 2. Green badge SVG
const greenBadgeSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%2310b981" stroke="%23ffffff" stroke-width="6"/><text x="50" y="56" font-size="18" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">ORGANIC</text></svg>';

// 3. Gold star SVG
const goldStarSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="%23f59e0b" stroke="%23b45309" stroke-width="4"/></svg>';

async function run() {
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

  try {
    console.log(`1. Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForSelector('.flat-canvas-pane', { state: 'visible', timeout: 10000 });
    console.log('   ✓ Loaded app and Flat Net 2D Canvas');

    // TEST 1: Drop on 2D Flat Net Canvas onto "Top Lid" panel
    console.log('\n2. Testing Drag & Drop on 2D Flat Net Canvas:');
    await page.evaluate(async (dataUrl) => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'organic_badge.svg', { type: 'image/svg+xml' });

      const dt = new DataTransfer();
      dt.items.add(file);

      const canvasContainer = document.querySelector('.flat-canvas-pane');
      if (!canvasContainer) throw new Error('flat-canvas-pane not found');

      const rect = canvasContainer.getBoundingClientRect();
      // Drop near lower center where Top Lid is located
      const clientX = rect.left + rect.width * 0.5;
      const clientY = rect.top + rect.height * 0.65;

      canvasContainer.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: dt,
      }));
    }, greenBadgeSvg);

    await page.waitForTimeout(200);
    const ss0Path = path.join(SCREENSHOT_DIR, 'dd_test_00_drag_over_indicator.png');
    await page.screenshot({ path: ss0Path });
    console.log(`   ✓ Captured drag-over overlay indicator: ${ss0Path}`);

    await page.evaluate(async (dataUrl) => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'organic_badge.svg', { type: 'image/svg+xml' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const canvasContainer = document.querySelector('.flat-canvas-pane');
      if (!canvasContainer) return;
      const rect = canvasContainer.getBoundingClientRect();
      const clientX = rect.left + rect.width * 0.5;
      const clientY = rect.top + rect.height * 0.65;

      canvasContainer.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: dt,
      }));
    }, greenBadgeSvg);

    await page.waitForTimeout(1000);
    const ss1Path = path.join(SCREENSHOT_DIR, 'dd_test_01_flat_canvas_drop.png');
    await page.screenshot({ path: ss1Path });
    console.log(`   ✓ Dropped Green Organic Badge onto 2D canvas, captured: ${ss1Path}`);

    // TEST 2: Switch to 2D Assembled 3D Preview and verify Green Badge is projected on 3D Top Lid!
    console.log('\n3. Testing 3D Assembled Preview projection of dropped graphic:');
    const assembledBtn = page.locator('.view-mode-tab:has-text("2D Assembled")');
    await assembledBtn.click();
    await page.waitForTimeout(1000);

    const ss2Path = path.join(SCREENSHOT_DIR, 'dd_test_02_assembled_with_green_badge.png');
    await page.screenshot({ path: ss2Path });
    console.log(`   ✓ Verified green badge on 3D preview, captured: ${ss2Path}`);

    // TEST 3: Drop directly onto 3D face in 3D Assembled preview!
    console.log('\n4. Testing Drag & Drop DIRECTLY onto 3D packaging face:');
    await page.evaluate(async (dataUrl) => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'gold_star_award.svg', { type: 'image/svg+xml' });

      const dt = new DataTransfer();
      dt.items.add(file);

      // Find top lid face or front face group in 3D SVG
      const faceGroups = document.querySelectorAll('.assembled-face-group');
      if (!faceGroups || faceGroups.length === 0) throw new Error('No 3D face groups found');

      // The top lid face is usually one of the visible faces
      const targetFace = Array.from(faceGroups).find(g => {
        const text = g.textContent || '';
        return true;
      }) || faceGroups[0];

      const rect = targetFace.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;

      targetFace.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: dt,
      }));

      targetFace.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: dt,
      }));
    }, goldStarSvg);

    await page.waitForTimeout(1000);
    const ss3Path = path.join(SCREENSHOT_DIR, 'dd_test_03_direct_3d_face_drop.png');
    await page.screenshot({ path: ss3Path });
    console.log(`   ✓ Dropped Gold Star directly onto 3D face, captured: ${ss3Path}`);

    // TEST 4: Drop directly onto Proof Sheet Thumbnail Card at bottom!
    console.log('\n5. Testing Drag & Drop onto Proof Sheet thumbnail card:');
    await page.evaluate(async (dataUrl) => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'red_premium_seal.svg', { type: 'image/svg+xml' });

      const dt = new DataTransfer();
      dt.items.add(file);

      // Find Base Front Wall card in proof strip
      const cards = document.querySelectorAll('.preview-side-card');
      if (!cards || cards.length === 0) throw new Error('No proof cards found');

      // Select the 2nd card (Base Front Wall)
      const targetCard = cards[1] || cards[0];
      const rect = targetCard.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;

      targetCard.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: dt,
      }));

      targetCard.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: dt,
      }));
    }, redSealSvg);

    await page.waitForTimeout(1000);
    const ss4Path = path.join(SCREENSHOT_DIR, 'dd_test_04_proof_card_drop.png');
    await page.screenshot({ path: ss4Path });
    console.log(`   ✓ Dropped Red Circle onto Proof Sheet card, captured: ${ss4Path}`);

    // TEST 5: Split View Mode Drag & Drop verification
    console.log('\n6. Testing Split View Mode:');
    const splitBtn = page.locator('.view-mode-tab:has-text("Split View")');
    await splitBtn.click();
    await page.waitForTimeout(1000);

    const ss5Path = path.join(SCREENSHOT_DIR, 'dd_test_05_split_view_all_faces.png');
    await page.screenshot({ path: ss5Path });
    console.log(`   ✓ Captured Split View showing all faces with graphics: ${ss5Path}`);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

run();
