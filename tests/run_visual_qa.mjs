import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// 1. Output Directory Configuration
const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/6754a19d-6bae-4e76-8e50-6d34e1e9dbe1';
const OUTPUT_DIR = path.join(ARTIFACT_DIR, 'visual_qa_results');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TARGET_URL = process.env.TEST_URL || 'http://localhost:5174';

// 2. High-Contrast Test Graphic Assets (Grid pattern + bold label for easy distortion checking)
const testGraphics = {
  frontBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23ef4444" rx="24"/><circle cx="100" cy="100" r="70" fill="none" stroke="%23ffffff" stroke-width="8"/><text x="100" y="108" font-size="24" font-family="sans-serif" font-weight="900" fill="%23ffffff" text-anchor="middle">FRONT</text></svg>',
  topLidBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%230ea5e9" rx="24"/><polygon points="100,25 125,75 180,82 140,120 150,175 100,148 50,175 60,120 20,82 75,75" fill="%23ffffff"/><text x="100" y="145" font-size="20" font-family="sans-serif" font-weight="bold" fill="%230369a1" text-anchor="middle">TOP LID</text></svg>',
  sideWallBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="%2310b981" rx="16"/><line x1="20" y1="20" x2="180" y2="20" stroke="%23ffffff" stroke-width="4"/><line x1="20" y1="100" x2="180" y2="100" stroke="%23ffffff" stroke-width="4"/><text x="100" y="68" font-size="22" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">SIDE WALL</text></svg>',
  artisanLogo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><circle cx="90" cy="90" r="80" fill="%23f59e0b" stroke="%23b45309" stroke-width="6"/><text x="90" y="85" font-size="22" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">ARTISAN</text><text x="90" y="110" font-size="14" font-family="sans-serif" fill="%23fef08a" text-anchor="middle">EST. 2026</text></svg>',
  barcode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90"><rect width="180" height="90" fill="%23ffffff" stroke="%23000000" stroke-width="2"/><line x1="20" y1="15" x2="20" y2="60" stroke="%23000" stroke-width="4"/><line x1="30" y1="15" x2="30" y2="60" stroke="%23000" stroke-width="2"/><line x1="45" y1="15" x2="45" y2="60" stroke="%23000" stroke-width="6"/><line x1="65" y1="15" x2="65" y2="60" stroke="%23000" stroke-width="3"/><line x1="85" y1="15" x2="85" y2="60" stroke="%23000" stroke-width="5"/><line x1="110" y1="15" x2="110" y2="60" stroke="%23000" stroke-width="4"/><line x1="130" y1="15" x2="130" y2="60" stroke="%23000" stroke-width="7"/><line x1="155" y1="15" x2="155" y2="60" stroke="%23000" stroke-width="3"/><text x="90" y="78" font-size="11" font-family="monospace" text-anchor="middle">9 780201 379624</text></svg>'
};

// Helper: Dispatch drag-and-drop
async function dropDataUrl(page, selector, dataUrl, fileName) {
  await page.evaluate(async ({ sel, dUrl, fName }) => {
    const res = await fetch(dUrl);
    const blob = await res.blob();
    const file = new File([blob], fName, { type: 'image/svg+xml' });
    const dt = new DataTransfer();
    dt.items.add(file);

    const el = document.querySelector(sel);
    if (!el) throw new Error(`Target '${sel}' not found`);

    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
  }, { sel: selector, dUrl: dataUrl, fName: fileName });
}

// Helper: Take screenshot with logging
const snap = async (page, name) => {
  const file = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`   📸 Saved screenshot: ${name}.png`);
  return file;
};

(async () => {
  console.log('🚀 Starting Comprehensive Packaging Visual QA Suite...');
  
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Selected diverse templates to thoroughly test
  const templatesToTest = [
    { id: 'burger-box', name: 'Burger Clamshell Box' },
    { id: 'sandwich-wedge-box', name: 'Sandwich Wedge Box' },
    { id: 'pizza-box', name: 'Pizza Box (Roll-End Tuck Top)' },
    { id: 'round-food-tub', name: 'Round Food Tub with Lid' },
    { id: 'standup-pouch', name: 'Stand-up Ziplock Pouch' },
    { id: 'pillow-box', name: 'Pillow Packaging Box' }
  ];

  try {
    // 1. Initial Load & Setup
    console.log(`\n1. Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Dismiss draft banner if present
    const dismissBtn = page.locator('button:has-text("Dismiss"), button:has-text("Start Fresh")').first();
    if (await dismissBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await dismissBtn.click();
      console.log('   ✓ Dismissed draft recovery banner');
      await page.waitForTimeout(300);
    }

    // 2. Iterate through each template
    for (let i = 0; i < templatesToTest.length; i++) {
      const tmpl = templatesToTest[i];
      const prefix = `${String(i + 1).padStart(2, '0')}_${tmpl.id}`;
      console.log(`\n======================================================`);
      console.log(`📦 Testing Template [${i + 1}/${templatesToTest.length}]: ${tmpl.name}`);
      console.log(`======================================================`);

      // Switch to Templates tab & select template
      await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
      await page.waitForTimeout(300);

      const card = page.locator('.template-card').filter({ hasText: tmpl.name }).first();
      await card.click();
      await page.waitForTimeout(800);

      // Ensure Flat Net view
      await page.locator('.view-mode-tab:has-text("Flat Net")').click();
      await page.waitForTimeout(600);
      await snap(page, `${prefix}_01_clean_flat_net`);

      // Switch to Faces tab to inspect available panels
      await page.locator('.sidebar-tab-btn:has-text("Faces")').click();
      await page.waitForTimeout(400);

      const panelCards = await page.locator('.panel-studio-card').all();
      console.log(`   Found ${panelCards.length} faces for ${tmpl.name}`);

      // Add Text to key faces
      const facesToDecorate = Math.min(panelCards.length, 3);
      for (let f = 0; f < facesToDecorate; f++) {
        const currentCard = panelCards[f];
        const faceName = (await currentCard.locator('.panel-studio-title').textContent() || `Face_${f}`).trim();
        console.log(`   -> Adding text to face [${f + 1}/${facesToDecorate}]: "${faceName}"`);

        const textBtn = currentCard.locator('button:has-text("+ Text")');
        if (await textBtn.isVisible()) {
          await textBtn.click();
          await page.waitForTimeout(300);
        }
      }

      await snap(page, `${prefix}_02_flat_net_with_text`);

      // Switch to 2D Assembled Preview
      console.log('   -> Switching to 2D Assembled 3D View');
      await page.locator('.view-mode-tab:has-text("2D Assembled")').click();
      await page.waitForTimeout(600);
      // Explicitly reset angle to 3/4 Hero preset
      const heroBtn = page.locator('.preview-pill-btn:has-text("3/4 Hero")').first();
      if (await heroBtn.isVisible()) {
        await heroBtn.click();
        await page.waitForTimeout(600);
      }
      await snap(page, `${prefix}_03_3d_hero_isometric`);

      // Test drag-and-drop onto the first visible 3D face in SVG
      console.log('   -> Dragging & dropping test graphic onto 3D face...');
      await dropDataUrl(page, '.assembled-face-group', testGraphics.artisanLogo, 'artisan_seal.svg');
      await page.waitForTimeout(800);
      await snap(page, `${prefix}_04_3d_hero_with_dropped_graphic`);

      // Test drag-and-drop onto Proof Sheet Card at bottom
      const proofCards = await page.locator('.preview-side-card').all();
      if (proofCards.length > 1) {
        console.log('   -> Dragging & dropping barcode graphic onto Proof Sheet card...');
        await dropDataUrl(page, '.preview-side-card:nth-child(2)', testGraphics.barcode, 'barcode.svg');
        await page.waitForTimeout(800);
        await snap(page, `${prefix}_05_3d_after_proof_card_drop`);
      }

      // Rotate through standard camera angles
      console.log('   -> Cycling through camera angles...');
      const angles = ['Front', 'Right', 'Back', 'Left', 'Top', 'Bottom'];
      for (const angle of angles) {
        const btn = page.locator(`.preview-pill-btn:has-text("${angle}")`).first();
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(600);
          await snap(page, `${prefix}_06_angle_${angle.toLowerCase()}`);
        }
      }

      // Test Materials (Kraft & Dark)
      console.log('   -> Testing Kraft cardboard material finish...');
      await page.locator('.preview-material-btn:has-text("Kraft")').click();
      await page.waitForTimeout(500);
      await snap(page, `${prefix}_07_material_kraft`);

      console.log('   -> Testing Dark midnight material finish...');
      await page.locator('.preview-material-btn:has-text("Dark")').click();
      await page.waitForTimeout(500);
      await snap(page, `${prefix}_08_material_dark`);

      // Reset material to White
      await page.locator('.preview-material-btn:has-text("White")').click();
      await page.waitForTimeout(300);

      // Test Split View Mode
      console.log('   -> Testing Split View mode...');
      await page.locator('.view-mode-tab:has-text("Split View")').click();
      await page.waitForTimeout(800);
      await snap(page, `${prefix}_09_split_view`);
    }

    console.log('\n======================================================');
    console.log(`✅ Visual QA Suite Execution Complete!`);
    console.log(`📁 All screenshots stored in: ${OUTPUT_DIR}`);
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Test suite encountered an error:', err);
  } finally {
    await browser.close();
  }
})();
