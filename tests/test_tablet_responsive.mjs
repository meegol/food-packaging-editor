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

  // Tablet Verification (iPad Mini: 768x1024)
  console.log('Testing Tablet (768x1024)...');
  const tabletCtx = await browser.newContext({ 
    viewport: { width: 768, height: 1024 },
    isMobile: true,
    hasTouch: true
  });
  const tabletPage = await tabletCtx.newPage();
  tabletPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`[Tablet] ${msg.text()}`); });
  await tabletPage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(600);
  await tabletPage.screenshot({ path: path.join(ARTIFACT_DIR, '08_tablet_768_view.png') });
  await tabletCtx.close();

  // Tablet Landscape (1024x768)
  console.log('Testing Tablet Landscape (1024x768)...');
  const tabletLandCtx = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    isMobile: true,
    hasTouch: true
  });
  const tabletLandPage = await tabletLandCtx.newPage();
  tabletLandPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`[TabletLand] ${msg.text()}`); });
  await tabletLandPage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await tabletLandPage.waitForTimeout(600);
  await tabletLandPage.screenshot({ path: path.join(ARTIFACT_DIR, '09_tablet_landscape_view.png') });
  await tabletLandCtx.close();

  await browser.close();

  console.log(`Tablet run finished. Total console errors: ${consoleErrors.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
