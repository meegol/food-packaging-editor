import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/891a7f27-ef46-4be9-935f-ff7c47b870ca';

async function testExportSuite() {
  console.log('--- Starting Production Export Suite E2E Test ---');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 1. Click "Export" button in Header
  console.log('1. Opening Export Modal from Header...');
  const exportBtn = page.locator('.header-action-btn:has-text("Export")');
  await exportBtn.click();
  await page.waitForSelector('.export-modal-dialog', { state: 'visible' });

  // 2. Tab 1: Vector CAD PDF
  console.log('2. Verifying Tab 1: Vector CAD PDF...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'export_modal_tab_pdf.png'),
  });

  // 3. Tab 2: Layered CAD SVG
  console.log('3. Switching to Tab 2: Layered CAD SVG...');
  await page.locator('.export-tab-btn:has-text("Layered CAD SVG")').click();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'export_modal_tab_svg.png'),
  });

  // 4. Tab 3: 300 DPI Proof
  console.log('4. Switching to Tab 3: 300 DPI Proof...');
  await page.locator('.export-tab-btn:has-text("300 DPI Proof")').click();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'export_modal_tab_raster.png'),
  });

  // 5. Tab 4: Technical BOM
  console.log('5. Switching to Tab 4: Technical BOM...');
  await page.locator('.export-tab-btn:has-text("Technical BOM")').click();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'export_modal_tab_bom.png'),
  });

  // Verify BOM cards are present
  const bomCardCount = await page.locator('.bom-card').count();
  console.log(`BOM Metric cards found: ${bomCardCount}`);
  if (bomCardCount < 6) {
    throw new Error(`Expected at least 6 BOM cards, got ${bomCardCount}`);
  }

  // 6. Tab 5: Project JSON
  console.log('6. Switching to Tab 5: Project JSON...');
  await page.locator('.export-tab-btn:has-text("Project JSON")').click();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'export_modal_tab_json.png'),
  });

  // 7. Test PDF Generation function inside page
  console.log('7. Testing PDF Generation execution...');
  await page.locator('.export-tab-btn:has-text("Vector CAD PDF")').click();
  await page.waitForTimeout(200);

  // Intercept downloads
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.locator('.export-primary-btn:has-text("Download Vector CAD PDF")').click();
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();

  const repoExportPdfPath = path.join('/home/migoldev/Documents/thesis/exports', suggestedFilename);
  const artifactPdfPath = path.join(ARTIFACT_DIR, suggestedFilename);
  await download.saveAs(repoExportPdfPath);
  await download.saveAs(artifactPdfPath);
  console.log(`PDF successfully saved to: ${repoExportPdfPath}`);

  // 8. Test SVG Generation execution
  console.log('8. Testing SVG Generation execution...');
  await page.locator('.export-tab-btn:has-text("Layered CAD SVG")').click();
  await page.waitForTimeout(200);

  const svgDownloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.locator('.export-primary-btn:has-text("Download Layered SVG")').click();
  const svgDownload = await svgDownloadPromise;
  const svgFilename = svgDownload.suggestedFilename();
  const repoExportSvgPath = path.join('/home/migoldev/Documents/thesis/exports', svgFilename);
  await svgDownload.saveAs(repoExportSvgPath);
  console.log(`SVG successfully saved to: ${repoExportSvgPath}`);

  // 9. Close Modal
  console.log('9. Testing Modal Close...');
  await page.locator('.export-modal-close').click();
  await page.waitForSelector('.export-modal-dialog', { state: 'hidden' });
  console.log('Export Modal closed cleanly.');

  await browser.close();
  console.log('--- Production Export Suite E2E Test PASSED! ---');
}

testExportSuite().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
