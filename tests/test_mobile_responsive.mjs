import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/6754a19d-6bae-4e76-8e50-6d34e1e9dbe1';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const consoleErrors = [];

  // 1. Desktop Verification (1440x900)
  console.log('Testing Desktop...');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopCtx.newPage();
  desktopPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`[Desktop] ${msg.text()}`); });
  await desktopPage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, '01_desktop_responsive.png') });
  await desktopCtx.close();

  // 2. Mobile Verification (iPhone 14: 390x844)
  console.log('Testing Mobile...');
  const mobileCtx = await browser.newContext({ 
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileCtx.newPage();
  mobilePage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`[Mobile] ${msg.text()}`); });
  await mobilePage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);

  // Screen 1: Mobile Canvas View (Default)
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '02_mobile_canvas_tab.png') });

  // Screen 2: Switch to Studio Tools View
  const toolsNavBtn = mobilePage.locator('.mobile-nav-item:has-text("Studio Tools")');
  await toolsNavBtn.click();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '03_mobile_tools_tab.png') });

  // Screen 3: Test adding text in Studio Tools and seeing it auto-switch to Canvas
  const addTextBtn = mobilePage.locator('.panel-tool-btn:has-text("+ Text")').first();
  if (await addTextBtn.isVisible()) {
    await addTextBtn.click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '04_mobile_after_quick_text_auto_switch.png') });
  }

  // Ensure we are on Canvas tab for view mode tests
  const canvasNavBtn = mobilePage.locator('.mobile-nav-item:has-text("Canvas & 3D")');
  await canvasNavBtn.click();
  await mobilePage.waitForTimeout(400);

  // Screen 4: Switch to 2D Assembled Preview on Mobile
  const assembledTabBtn = mobilePage.locator('.view-mode-tab:has-text("2D Assembled")');
  if (await assembledTabBtn.isVisible()) {
    await assembledTabBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '05_mobile_2d_assembled_tab.png') });
  }

  // Screen 5: Switch to Split View on Mobile
  const splitTabBtn = mobilePage.locator('.view-mode-tab:has-text("Split View")');
  if (await splitTabBtn.isVisible()) {
    await splitTabBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '06_mobile_split_view_stacked.png') });
  }

  // Screen 6: Open Export Modal on Mobile
  const exportBtn = mobilePage.locator('.header-action-btn.primary');
  await exportBtn.click();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '07_mobile_export_modal.png') });

  await mobileCtx.close();
  await browser.close();

  console.log(`Finished test run. Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors encountered:', consoleErrors);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
