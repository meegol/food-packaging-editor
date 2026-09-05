import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/891a7f27-ef46-4be9-935f-ff7c47b870ca';

async function testFullClippingVerification() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    console.log(`[Browser Console]: ${msg.text()}`);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Clear any previously saved state in localStorage to ensure clean test
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 1. Add Text to Top Lid
  await page.locator('.sidebar-tab-btn:has-text("Branding")').click();
  await page.locator('button:has-text("Text")').click();

  // Select Top Lid
  await page.locator('select').first().selectOption('lid-top');
  await page.waitForTimeout(200);

  // Fill text with high visibility
  await page.locator('textarea').first().fill('CONFIDENTIAL PREMIUM RECIPE');
  await page.locator('input[type="range"]').first().fill('32');
  await page.locator('button:has-text("Add Text to Packaging Face")').click();
  await page.waitForTimeout(400);

  // 2. Add an Icon to Base Front Wall
  await page.locator('button:has-text("Icons")').click();
  await page.locator('select').first().selectOption('base-front');
  await page.waitForTimeout(200);
  await page.locator('text="Universal Recycle"').first().click();
  await page.waitForTimeout(400);

  // Capture initial centered state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_initial_centered.png') });
  console.log('Saved verify_initial_centered.png');

  // 3. Move Top Lid text so half overflows the top crease of the Top Lid
  // And move the Recycle icon so half overflows the bottom cut line of Base Front Wall
  const dragResult = await page.evaluate(() => {
    const engine = (window as any).__DIELINE_ENGINE__;
    const objects = engine.canvas.getObjects();
    const txt = objects.find((o: any) => o.type === 'textbox');
    const icon = objects.find((o: any) => o.type === 'image');

    const results: any = {};
    if (txt) {
      // Top Lid panel: y center is around 1147. Let's move it up by 150px so it straddles the top border
      txt.top -= 140;
      txt.setCoords();
      // Update the graphicItem model
      const gItem = engine.graphicItems.find((g: any) => g.id === (txt as any).graphicId);
      if (gItem) {
        gItem.x = txt.left;
        gItem.y = txt.top;
      }
      results.txt = { left: txt.left, top: txt.top, clipPathSet: !!txt.clipPath };
    }

    if (icon) {
      // Base Front panel: move right by 130px so it straddles the right crease/cut line
      icon.left += 130;
      icon.setCoords();
      const gItem = engine.graphicItems.find((g: any) => g.id === (icon as any).graphicId);
      if (gItem) {
        gItem.x = icon.left;
        gItem.y = icon.top;
      }
      results.icon = { left: icon.left, top: icon.top, clipPathSet: !!icon.clipPath };
    }

    engine.canvas.requestRenderAll();
    if (engine.onGraphicChangeCallback) {
      engine.onGraphicChangeCallback([...engine.graphicItems]);
    }

    return results;
  });
  console.log('Moved items for boundary test:', dragResult);

  await page.waitForTimeout(500);

  // Take screenshot in 2D Flat view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_flat_clipped_overflow.png') });
  console.log('Saved verify_flat_clipped_overflow.png');

  // 4. Switch to 2D Assembled (3D) view
  await page.locator('button:has-text("2D Assembled")').click();
  await page.waitForTimeout(800);

  // Take screenshot in 3D Assembled view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_assembled_clipped_overflow.png') });
  console.log('Saved verify_assembled_clipped_overflow.png');

  // Rotate 3D view to check Base Front Wall
  await page.locator('button:has-text("Front")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_assembled_front_face.png') });
  console.log('Saved verify_assembled_front_face.png');

  // Switch to Split View
  await page.locator('button:has-text("Split View")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_split_view_parity.png') });
  console.log('Saved verify_split_view_parity.png');

  console.log('Total console errors encountered:', consoleErrors.length, consoleErrors);
  await browser.close();
}

testFullClippingVerification().catch(console.error);
