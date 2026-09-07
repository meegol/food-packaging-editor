/**
 * Focused 3D rendering quality test.
 * - Selects burger-box
 * - Clicks "Front Panel" in Faces sidebar to activate it
 * - Drops a high-contrast test image onto the active panel's flat net view
 * - Also adds text via the + Text button
 * - Then examines the 3D assembled view from multiple angles
 * - Saves screenshots every step
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT = path.join(
  '/home/migoldev/.gemini/antigravity-ide/brain/6754a19d-6bae-4e76-8e50-6d34e1e9dbe1',
  'focused_3d_test'
);
fs.mkdirSync(OUT, { recursive: true });

const URL = 'http://localhost:5174';

// High-contrast full-bleed test card (easy to spot on any face)
const GRID_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
  <rect width="400" height="400" fill="%23dc2626"/>
  <line x1="0" y1="100" x2="400" y2="100" stroke="white" stroke-width="4"/>
  <line x1="0" y1="200" x2="400" y2="200" stroke="white" stroke-width="4"/>
  <line x1="0" y1="300" x2="400" y2="300" stroke="white" stroke-width="4"/>
  <line x1="100" y1="0" x2="100" y2="400" stroke="white" stroke-width="4"/>
  <line x1="200" y1="0" x2="200" y2="400" stroke="white" stroke-width="4"/>
  <line x1="300" y1="0" x2="300" y2="400" stroke="white" stroke-width="4"/>
  <text x="200" y="175" font-size="48" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">FRONT</text>
  <text x="200" y="235" font-size="32" font-family="sans-serif" font-weight="bold" fill="yellow" text-anchor="middle">PANEL TEST</text>
</svg>`;

async function dropDataUrl(page, targetMatch, dataUrl, fileName) {
  await page.evaluate(async ({ target, dUrl, fName }) => {
    const res = await fetch(dUrl);
    const blob = await res.blob();
    const file = new File([blob], fName, { type: 'image/svg+xml' });
    const dt = new DataTransfer();
    dt.items.add(file);
    let el = Array.from(document.querySelectorAll('.preview-side-card'))
      .find(c => c.textContent && c.textContent.includes(target));
    if (!el) {
      try {
        el = document.querySelector(target);
      } catch {
        // Not a standard selector
      }
    }
    if (!el) throw new Error(`Target '${target}' not found`);
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    el.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
    await new Promise(r => setTimeout(r, 100));
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
  }, { target: targetMatch, dUrl: dataUrl, fName: fileName });
}

const snap = async (page, name) => {
  const f = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: f, fullPage: false });
  console.log(`  📸 ${name}.png`);
  return f;
};

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  try {
    console.log('🔍 Focused 3D Render Quality Test');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Dismiss any banner
    const dismiss = page.locator('button:has-text("Dismiss"), button:has-text("Start Fresh")').first();
    if (await dismiss.isVisible({ timeout: 1500 }).catch(() => false)) {
      await dismiss.click();
      await page.waitForTimeout(400);
    }

    // ---- STEP 1: Select burger-box ----
    console.log('\n[1] Selecting Burger Clamshell Box template...');
    await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
    await page.waitForTimeout(400);
    await page.locator('.template-card').filter({ hasText: 'Burger Clamshell Box' }).first().click();
    await page.waitForTimeout(800);
    await snap(page, '01_template_selected');

    // ---- STEP 2: Go to Faces, click first panel (Base Front Wall / lid-top) ----
    console.log('\n[2] Going to Faces tab, selecting front panel...');
    await page.locator('.sidebar-tab-btn:has-text("Faces")').click();
    await page.waitForTimeout(500);

    // Click the top lid card to make it active
    const topLidCard = page.locator('.panel-studio-card').filter({ hasText: 'Top Lid' }).first();
    await topLidCard.click({ force: true });
    await page.waitForTimeout(400);
    await snap(page, '02_top_lid_selected');

    // Add text to top lid
    const textBtnLid = topLidCard.locator('button:has-text("+ Text")');
    if (await textBtnLid.isVisible()) {
      await textBtnLid.click();
      await page.waitForTimeout(500);
      console.log('   ✓ Text added to Top Lid');
    }
    await snap(page, '03_top_lid_text_added');

    // Now also select Base Front Wall and drop image there
    const frontWallCard = page.locator('.panel-studio-card').filter({ hasText: 'Base Front Wall' }).first();
    await frontWallCard.click({ force: true });
    await page.waitForTimeout(400);

    // Add text to Base Front Wall
    const textBtnFront = frontWallCard.locator('button:has-text("+ Text")');
    if (await textBtnFront.isVisible()) {
      await textBtnFront.click();
      await page.waitForTimeout(500);
      console.log('   ✓ Text added to Base Front Wall');
    }
    await snap(page, '04_front_wall_text_added');

    // ---- STEP 3: Go to Flat Net to visually confirm text placement ----
    console.log('\n[3] Flat Net view — confirming text placed...');
    await page.locator('.view-mode-tab:has-text("Flat Net")').click();
    await page.waitForTimeout(700);
    await snap(page, '05_flat_net_with_text');

    // ---- STEP 4: Drop image onto the active flat panel ----
    console.log('\n[4] Dropping grid image onto active panel in Flat Net...');
    const flatCanvas = '.flat-net-canvas-area, .flat-net-face-panel, canvas, .canvas-workspace, .panel-focus-canvas';
    // Try to drop onto the focused panel or the whole canvas
    try {
      await dropDataUrl(page, '.flat-net-viewport, .canvas-scroll-container, svg', GRID_IMAGE, 'grid_test.svg');
    } catch {
      console.log('   ⚠ Flat net drop failed, trying alternative selector...');
    }
    await page.waitForTimeout(600);
    await snap(page, '06_flat_net_after_image_drop');

    // ---- STEP 5: Now switch to 2D Assembled ----
    console.log('\n[5] Switching to 2D Assembled 3D view...');
    await page.locator('.view-mode-tab:has-text("2D Assembled")').click();
    await page.waitForTimeout(800);

    // Ensure 3/4 Hero angle
    await page.locator('.preview-pill-btn:has-text("3/4 Hero")').first().click();
    await page.waitForTimeout(600);
    await snap(page, '07_3d_isometric_hero');

    // ---- STEP 6: Try dropping directly onto the 3D SVG face via proof sheet card ----
    console.log('\n[6] Dropping image onto Proof Sheet "Top Lid" card...');
    // Find the proof card that says "Top Lid"
    const proofCards = await page.locator('.preview-side-card').all();
    console.log(`   Found ${proofCards.length} proof cards`);
    for (let i = 0; i < proofCards.length; i++) {
      const txt = await proofCards[i].textContent();
      console.log(`   Card ${i}: "${txt?.trim().substring(0, 40)}"`);
    }

    // Find Top Lid card
    const topLidProofCard = page.locator('.preview-side-card').filter({ hasText: 'Top Lid' }).first();
    if (await topLidProofCard.isVisible()) {
      await dropDataUrl(page, 'Top Lid', GRID_IMAGE, 'front_badge.svg');
      await page.waitForTimeout(800);
      await snap(page, '08_after_top_lid_drop');
    }

    // Also try Base Front Wall
    const frontWallProofCard = page.locator('.preview-side-card').filter({ hasText: 'Base Front Wall' }).first();
    if (await frontWallProofCard.isVisible()) {
      await dropDataUrl(page, 'Base Front Wall', GRID_IMAGE, 'front_wall_badge.svg');
      await page.waitForTimeout(800);
      await snap(page, '09_after_front_wall_drop');
    }

    // ---- STEP 7: Rotate to inspect all angles ----
    console.log('\n[7] Inspecting from all camera angles...');
    const angles = [
      { name: 'isometric', label: '3/4 Hero' },
      { name: 'front', label: 'Front' },
      { name: 'top', label: 'Top' },
      { name: 'left', label: 'Left' },
      { name: 'right', label: 'Right' },
      { name: 'back', label: 'Back' },
      { name: 'bottom', label: 'Bottom' },
    ];
    for (const a of angles) {
      const btn = page.locator(`.preview-pill-btn:has-text("${a.label}")`).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(700);
        await snap(page, `10_angle_${a.name}`);
      }
    }

    // ---- STEP 8: Split view ----
    console.log('\n[8] Split view check...');
    await page.locator('.view-mode-tab:has-text("Split View")').click();
    await page.waitForTimeout(800);
    await snap(page, '11_split_view_final');

    console.log('\n✅ Focused test complete. Check screenshots in:', OUT);
  } catch (err) {
    console.error('❌ Error:', err);
    await snap(page, 'ERROR_state');
  } finally {
    await browser.close();
  }
})();
