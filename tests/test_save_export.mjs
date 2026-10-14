// Save Project + Export Suite E2E check.
// Usage: TEST_URL=http://localhost:4173 node tests/test_save_export.mjs
// Burger box 120x120x70mm: flat blank must be a few hundred mm, not metres,
// and placed artwork must keep its on-canvas size relative to the dieline.
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

const URL_ = process.env.TEST_URL || 'http://localhost:4173';
const OUT = process.env.OUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'fpe-'));
fs.mkdirSync(OUT, { recursive: true });
const PX_PER_MM = 2.5;
const results = [];
const check = (name, ok, info = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
};

// 40x20 red PNG generated in-page later; JPEG from repo root
const jpgB64 = fs.readFileSync(new URL('../789299268_1057387953839814_8013871541545853658_n.jpg', import.meta.url)).toString('base64');
const iconSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="green"/></svg>')}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('dialog', (d) => { errors.push('dialog: ' + d.message()); d.dismiss(); });

await page.goto(URL_, { waitUntil: 'networkidle' });
await page.waitForSelector('.app-header');

const pngDataUrl = await page.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 40; c.height = 20;
  const g = c.getContext('2d'); g.fillStyle = 'red'; g.fillRect(0, 0, 40, 20);
  return c.toDataURL('image/png');
});

// Fixture: scaleX/naturalWidth as the Fabric canvas stores them (canvas units, 2.5/mm)
const fixture = {
  metadata: { name: 'fixture', version: '1.0.0', createdAt: 1, updatedAt: 1 },
  templateId: 'burger-box',
  dimensions: { length: 120, width: 120, depth: 70, thickness: 1.2, unit: 'mm' },
  theme: 'github-dark',
  graphics: [
    { id: 't1', panelId: 'base-bottom', type: 'text', text: 'Hello & <Burger> brand text that wraps', fontFamily: '"Playfair Display", Georgia, serif', fontWeight: '700', fontSize: 25, fill: '#7c3aed', clipToPanel: true, x: 496.25, y: 671.25 },
    { id: 'i1', panelId: 'base-bottom', type: 'icon', src: iconSvg, clipToPanel: true, x: 400, y: 600, naturalWidth: 48, naturalHeight: 48, scaleX: 2, scaleY: 2 },
    { id: 'p1', panelId: 'base-bottom', type: 'image', src: pngDataUrl, clipToPanel: true, x: 550, y: 600, naturalWidth: 40, naturalHeight: 20, scaleX: 2.5, scaleY: 2.5 },
    { id: 'j1', panelId: 'base-bottom', type: 'image', src: `data:image/jpeg;base64,${jpgB64}`, clipToPanel: false, x: 496.25, y: 760, naturalWidth: 0, naturalHeight: 0 },
  ],
};
const fixturePath = path.join(OUT, 'fixture.json');
fs.writeFileSync(fixturePath, JSON.stringify(fixture));

// --- Open Project ---
await page.setInputFiles('.header-btn-group input[type=file]', fixturePath);
await page.waitForTimeout(1500);
check('open project: no error', errors.length === 0, errors.join(' | '));

// --- Save Project ---
const dl = async (click, label) => {
  try {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), click()]);
    const p = path.join(OUT, d.suggestedFilename());
    await d.saveAs(p);
    return p;
  } catch (e) {
    check(`${label}: download fired`, false, e.message.split('\n')[0]);
    return null;
  }
};

const savedPath = await dl(() => page.click('.header-action-btn:has-text("Save")'), 'save project');
if (savedPath) {
  const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
  check('save project: graphics persisted', saved.graphics?.length === 4, `${saved.graphics?.length}`);
  const j = saved.graphics.find((g) => g.id === 'j1');
  check('save project: canvas-fitted size persisted (jpeg scaleX)', j?.scaleX > 0 && j?.naturalWidth > 0, `scaleX=${j?.scaleX} nw=${j?.naturalWidth}`);
  check('save project: has project name', !!saved.metadata?.name, saved.metadata?.name);
  // Round trip
  errors.length = 0;
  await page.setInputFiles('.header-btn-group input[type=file]', savedPath);
  await page.waitForTimeout(1000);
  check('save project: re-open round trip', errors.length === 0, errors.join(' | '));
}

// --- Export modal ---
await page.click('.header-action-btn.primary');
await page.waitForSelector('.export-modal-dialog');
const tab = (t) => page.click(`.export-tab-btn:has-text("${t}")`);
const primary = () => page.click('.export-primary-btn');

// SVG
await tab('Layered CAD SVG');
const svgPath = await dl(primary, 'svg');
let svgWmm;
if (svgPath) {
  const s = fs.readFileSync(svgPath, 'utf8');
  svgWmm = parseFloat(s.match(/width="([\d.]+)mm"/)[1]);
  const vbW = parseFloat(s.match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+)/)[1]);
  // base-bottom panel is the 120mm L face
  const pts = s.match(/id="panel-base-bottom" points="([^"]+)"/)[1].split(' ').map((p) => p.split(',').map(Number));
  const panelW = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]));
  const userUnitsPerMm = vbW / svgWmm;
  check('svg: base panel is 120mm wide', Math.abs(panelW / userUnitsPerMm - 120) < 1, `${(panelW / userUnitsPerMm).toFixed(1)}mm`);
  check('svg: blank < 500mm wide', svgWmm < 500, `${svgWmm}mm`);
  check('svg: text escaped / well-formed', !s.includes('<Burger>'));
  // artwork scale: icon 48*2 canvas units -> 96/2.5 = 38.4mm
  const imgs = [...s.matchAll(/<image[^>]*width="([\d.]+)"/g)].map((m) => parseFloat(m[1]) / userUnitsPerMm);
  check('svg: icon exported at canvas size (38.4mm)', imgs.some((w) => Math.abs(w - 38.4) < 0.5), imgs.map((w) => w.toFixed(1)).join(','));
  const fs_ = parseFloat((s.match(/<text font-family[^>]*font-size="([\d.]+)"/) || [])[1]) / userUnitsPerMm;
  check('svg: text size matches canvas (10mm)', Math.abs(fs_ - 25 / PX_PER_MM) < 0.5, `${fs_.toFixed(2)}mm`);
  check('svg: brand text colour kept', s.includes('fill="#7c3aed"'));
  check('svg: brand font embedded (@font-face woff2)', /@font-face\{font-family:"Playfair Display";font-weight:700/.test(s));
  const nSpan = (s.match(/<tspan/g) || []).length;
  check('svg: long text wrapped like canvas', nSpan >= 2, `${nSpan} lines`);
  check('svg: no whitespace between tspans (would offset centred text)', !/<\/tspan>\s+<tspan/.test(s));
  const parseErr = await page.evaluate((x) => {
    const d = new DOMParser().parseFromString(x, 'image/svg+xml');
    return d.querySelector('parsererror')?.textContent || null;
  }, s);
  check('svg: parses as XML', !parseErr, parseErr || '');
}

// PDF
await tab('1:1 Vector CAD PDF');
const pdfPath = await dl(primary, 'pdf');
if (pdfPath) {
  const b = fs.readFileSync(pdfPath).toString('latin1');
  const box = b.match(/\/MediaBox \[([\d. ]+)\]/)[1].split(' ').map(Number);
  const pageWmm = (box[2] - box[0]) * 25.4 / 72;
  check('pdf: 1:1 page width plausible (<600mm)', pageWmm < 600, `${pageWmm.toFixed(0)}mm`);
  const nImg = (b.match(/\/Subtype \/Image/g) || []).length;
  check('pdf: all 3 raster/svg artwork embedded', nImg >= 3, `${nImg} images`);
  check('pdf: brand font embedded (TTF)', /\/FontFile2/.test(b) && /Playfair/i.test(b));
  check('pdf: brand text colour kept (#7c3aed)', /0\.486 0\.227 0\.929 rg/.test(b));
}

// DXF
await tab('AutoCAD DXF');
const dxfPath = await dl(primary, 'dxf');
if (dxfPath) {
  const d = fs.readFileSync(dxfPath, 'utf8').split('\n');
  const i = d.indexOf('$EXTMAX');
  const w = parseFloat(d[i + 2]);
  check('dxf: extents in mm plausible (<500)', w < 500, `${w}mm`);
}

// Raster 150/300/600
await tab('300 DPI Proof');
for (const dpi of [150, 300, 600]) {
  await page.click(`.export-pill-btn:has-text("${dpi} DPI")`);
  const p = await dl(primary, `raster ${dpi}`);
  if (p) {
    const buf = fs.readFileSync(p);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    const expW = Math.round((svgWmm ?? 0) / 25.4 * dpi);
    check(`raster ${dpi}: png ${w}x${h}`, buf.length > 1000 && Math.abs(w - expW) <= 2, `expected w≈${expW}`);
    if (dpi === 150) {
      fs.copyFileSync(p, path.join(OUT, 'proof150.png'));
      // Clipped icon (green circle) centre at canvas (400,600) -> mm (160,240); proof origin = viewBox min
      const vb = fs.readFileSync(svgPath, 'utf8').match(/viewBox="([\d.-]+) ([\d.-]+)/).slice(1).map(Number);
      const px = [(160 - vb[0]) / 25.4 * dpi, (240 - vb[1]) / 25.4 * dpi].map(Math.round);
      const rgb = await page.evaluate(async ({ b64, px }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let purple = 0; // brand text #7c3aed
        for (let i = 0; i < d.length; i += 4) {
          if (Math.abs(d[i] - 124) < 25 && Math.abs(d[i + 1] - 58) < 25 && Math.abs(d[i + 2] - 237) < 25) purple++;
        }
        return [...g.getImageData(px[0], px[1], 1, 1).data].slice(0, 3).concat(purple);
      }, { b64: buf.toString('base64'), px });
      check('raster: clipped icon rendered (green)', rgb[1] > 100 && rgb[0] < 60 && rgb[2] < 60, `rgb(${rgb.slice(0, 3)})`);
      check('raster: brand text rendered in its colour', rgb[3] > 300, `${rgb[3]} purple px`);
    }
  }
  await page.waitForTimeout(300);
}
const toast = await page.locator('.export-status-toast').textContent().catch(() => '');
check('raster: no failure toast', !/fail/i.test(toast || ''), toast);

// JSON tab
await tab('Project JSON');
const jPath = await dl(primary, 'json');
check('export json: downloaded', !!jPath);

check('no page errors overall', errors.length === 0, errors.slice(0, 3).join(' | '));
await page.screenshot({ path: path.join(OUT, 'modal.png') });
await browser.close();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed. Artifacts: ${OUT}`);
process.exit(failed ? 1 : 0);
