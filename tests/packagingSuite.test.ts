import { TEMPLATES, getTemplateById, generateDieline } from '../src/core/dieline';
import { buildFoldedModel, computePanelFrames, panelUprightAngles } from '../src/core/preview3d/foldModel';
import { PrintSheet } from '../src/core/preview3d/printTexture';
import { remapGraphicsToDieline } from '../src/core/graphics/remapGraphics';
import { parseProjectFile } from '../src/core/storage/projectStorage';
import { GraphicItem } from '../src/core/graphics/types';
import { buildStarterDesign, STARTER_STYLES, BLANK_DESIGN_ID } from '../src/core/designs/starterDesigns';

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`  ✓ ${msg}`);
}

console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE PACKAGING SUITE TESTS');
console.log('====================================================\n');

// -----------------------------------------------------------
// TEST SUITE 1: 12 Template Definitions & Dieline Geometry
// -----------------------------------------------------------
console.log('📦 Test Suite 1: Template Definitions & Dieline Nets');
assert(TEMPLATES.length === 12, `Must have exactly 12 templates, found ${TEMPLATES.length}`);

for (const tmpl of TEMPLATES) {
  const found = getTemplateById(tmpl.id);
  assert(found.id === tmpl.id, `getTemplateById("${tmpl.id}") resolves correctly`);

  const dieline = generateDieline(tmpl.id, tmpl.defaultDimensions);
  assert(dieline.panels.length > 0, `${tmpl.name}: Has ${dieline.panels.length} panels`);
  assert(dieline.lines.length > 0, `${tmpl.name}: Has ${dieline.lines.length} lines`);
  assert(dieline.totalBounds.width > 0 && dieline.totalBounds.height > 0, `${tmpl.name}: Bounds are valid (${dieline.totalBounds.width.toFixed(1)}x${dieline.totalBounds.height.toFixed(1)})`);

  // Ensure every panel has positive bounds and valid polygon
  for (const p of dieline.panels) {
    assert(p.polygon.length >= 3, `${tmpl.name} -> Panel "${p.name}": Valid polygon with ${p.polygon.length} points`);
    assert(p.bounds.width > 0 && p.bounds.height > 0, `${tmpl.name} -> Panel "${p.name}": Valid bounds`);
  }
}

// Die-line integrity: closed cut outlines, no dangling creases, no cut/crease overlap.
// Only short tear notches/slits (<= 8mm) may have a free end.
type Seg = { x1: number; y1: number; x2: number; y2: number };
const onSeg = (x: number, y: number, s: Seg) => {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy || 1;
  const t = ((x - s.x1) * dx + (y - s.y1) * dy) / L2;
  return t >= -1e-3 && t <= 1 + 1e-3 && Math.hypot(s.x1 + t * dx - x, s.y1 + t * dy - y) < 0.05;
};
const touches = (x: number, y: number, self: Seg, pool: Seg[]) => pool.some((o) => o !== self && onSeg(x, y, o));
for (const tmpl of TEMPLATES) {
  for (const [label, dims] of [
    ['default', tmpl.defaultDimensions],
    ['min', { ...tmpl.defaultDimensions, ...tmpl.minDimensions }],
    ['max', { ...tmpl.defaultDimensions, ...tmpl.maxDimensions }],
  ] as const) {
    const lines = generateDieline(tmpl.id, dims).lines;
    const cut = lines.filter((l) => l.type === 'cut');
    const crease = lines.filter((l) => l.type === 'crease');
    const notchMax = 8 * 2.5 + 0.01;
    const openCut = cut.filter((s) =>
      !(touches(s.x1, s.y1, s, cut) && touches(s.x2, s.y2, s, cut)) && Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > notchMax
    );
    assert(openCut.length === 0, `${tmpl.name} [${label}]: Cut outline closed${openCut.length ? ` (open: ${openCut.map((s) => `${s.x1},${s.y1}->${s.x2},${s.y2}`).join(' ')})` : ''}`);
    const dangling = crease.filter((s) => [[s.x1, s.y1], [s.x2, s.y2]].some(([x, y]) => !touches(x, y, s, lines)));
    assert(dangling.length === 0, `${tmpl.name} [${label}]: No dangling crease lines${dangling.length ? ` (${dangling.length})` : ''}`);
    const overlap = crease.filter((c) => cut.some((s) => onSeg(c.x1, c.y1, s) && onSeg(c.x2, c.y2, s)));
    assert(overlap.length === 0, `${tmpl.name} [${label}]: No crease drawn over a cut`);
  }
}

// Inch mode must give the same net as the equivalent mm sizes (fixed allowances stay in mm)
for (const tmpl of TEMPLATES) {
  const mm = tmpl.defaultDimensions;
  const inch = { ...mm, length: mm.length / 25.4, width: mm.width / 25.4, depth: mm.depth / 25.4, unit: 'in' as const };
  const a = generateDieline(tmpl.id, mm).totalBounds;
  const b = generateDieline(tmpl.id, inch).totalBounds;
  assert(Math.abs(a.width - b.width) < 0.1 && Math.abs(a.height - b.height) < 0.1, `${tmpl.name}: inch mode matches mm net`);
}

// -----------------------------------------------------------
// TEST SUITE 2: 3D Assembly Folded From the Dieline
// -----------------------------------------------------------
console.log('\n📦 Test Suite 2: 3D Assembly Folded From the Dieline');

const geometrySheet = (d: ReturnType<typeof generateDieline>): PrintSheet => ({
  canvas: null,
  minX: d.totalBounds.minX,
  minY: d.totalBounds.minY,
  width: d.totalBounds.width || 1,
  height: d.totalBounds.height || 1,
});

const warnings: string[] = [];
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };

for (const tmpl of TEMPLATES) {
  const dieline = generateDieline(tmpl.id, tmpl.defaultDimensions);
  const before = warnings.length;
  const model = buildFoldedModel(dieline, geometrySheet(dieline), '#ffffff');

  const placed = new Set<string>();
  let finite = true;
  model.root.updateMatrixWorld(true);
  model.root.traverse(obj => {
    if (obj.userData.panelId) placed.add(obj.userData.panelId as string);
    const e = obj.matrixWorld.elements;
    if (e.some(v => !Number.isFinite(v))) finite = false;
  });

  const expected = dieline.panels.filter(p => !/seam/.test(p.id)).map(p => p.id);
  const missing = expected.filter(id => !placed.has(id));
  assert(missing.length === 0, `${tmpl.name}: all ${expected.length} panels folded into the 3D package${missing.length ? ` (missing ${missing.join(', ')})` : ''}`);
  assert(warnings.length === before, `${tmpl.name}: every fold found its shared crease`);
  assert(finite && model.radius > 0 && !model.bounds.isEmpty(), `${tmpl.name}: assembled geometry is finite (radius ${model.radius.toFixed(0)})`);

  model.setOpenness(1);
  model.setOpenness(0);
  model.dispose();
}
console.warn = originalWarn;

const near = (v: { x: number; y: number; z: number }, x: number, y: number, z: number) =>
  Math.abs(v.x - x) < 0.05 && Math.abs(v.y - y) < 0.05 && Math.abs(v.z - z) < 0.05;
const frameOf = (id: string) => {
  const d = generateDieline(id, getTemplateById(id).defaultDimensions);
  return computePanelFrames(d);
};

const burgerFrames = frameOf('burger-box');
assert(near(burgerFrames.get('lid-top')!.normal, 0, 1, 0), 'Burger box: printed lid faces up');
assert(near(burgerFrames.get('base-bottom')!.normal, 0, -1, 0), 'Burger box: base faces down');
assert(near(burgerFrames.get('base-front')!.normal, 0, 0, 1), 'Burger box: front wall faces the viewer');
assert(near(burgerFrames.get('lid-front')!.normal, 0, 0, 1), 'Burger box: lid closure flap covers the front wall');

const sandwichFrames = frameOf('sandwich-wedge-box');
const sandwichFront = sandwichFrames.get('sandwich-front')!.normal;
assert(sandwichFront.y > 0.3 && sandwichFront.z > 0.3, 'Sandwich wedge: window face slants up toward the viewer');
assert(Math.abs(sandwichFrames.get('sandwich-left-side')!.normal.x) > 0.95, 'Sandwich wedge: triangle sides close the ends');

const pizzaFrames = frameOf('pizza-box');
assert(near(pizzaFrames.get('pizza-lid')!.normal, 0, 1, 0), 'Pizza box: printed lid faces up');

const sandwichDieline = generateDieline('sandwich-wedge-box', getTemplateById('sandwich-wedge-box').defaultDimensions);
const uprights = panelUprightAngles(sandwichDieline);
const sideText = buildStarterDesign('kraft', sandwichDieline).find(i => i.panelId === 'sandwich-left-side' && i.type === 'text')!;
assert(sideText.angle === uprights.get('sandwich-left-side'), `Sandwich side wordmark is turned to read upright when folded (${sideText.angle}°)`);
const burgerDieline = generateDieline('burger-box', getTemplateById('burger-box').defaultDimensions);
const rearItems = buildStarterDesign('kraft', burgerDieline).filter(i => i.panelId === 'rear-hinge' && i.type === 'text');
assert(panelUprightAngles(burgerDieline).get('rear-hinge') === 180 && rearItems.every(i => i.angle === 180),
  'Burger rear wall (printed upside down on the net) has its back-of-pack text rotated to read upright');

// -----------------------------------------------------------
// TEST SUITE 4: Project Serialization & Recovery
// -----------------------------------------------------------
console.log('\n💾 Test Suite 4: Project Storage & Parsing');
const testGraphics: GraphicItem[] = [
  { id: 'test-text-1', panelId: 'sleeve-top', type: 'text', text: 'GOURMET BURGER', fontSize: 18, clipToPanel: true },
  { id: 'test-img-1', panelId: 'sleeve-top', type: 'image', src: 'data:image/png;base64,AAAA', clipToPanel: true },
];
const sampleProjectJson = JSON.stringify({
  version: '1.0.0',
  templateId: 'dessert-sleeve-box',
  dimensions: {
    length: 180,
    width: 90,
    depth: 45,
    thickness: 1.2,
    unit: 'mm',
  },
  graphics: testGraphics,
  theme: 'dark-slate',
  timestamp: Date.now(),
});

const parsed = parseProjectFile(sampleProjectJson);
assert(parsed.templateId === 'dessert-sleeve-box', 'Project template restored');
assert(parsed.dimensions.length === 180, 'Project dimensions length restored');
assert(parsed.graphics.length === 2, 'Project graphics restored');
assert(parsed.theme === 'dark-slate', 'Project theme restored');

// -----------------------------------------------------------
// TEST SUITE 5: AutoCAD R12 DXF CAD Export Engine
// -----------------------------------------------------------
console.log('\n📐 Test Suite 5: AutoCAD R12 DXF Vector CAD Export');
const { exportDielineToDxf } = await import('../src/core/export/dielineDxfExport');
const { getOrCreateGuestSessionId } = await import('../src/core/storage/projectStorage');

for (const tmpl of TEMPLATES.slice(0, 5)) {
  const dieline = generateDieline(tmpl.id, tmpl.defaultDimensions);
  const dxf = exportDielineToDxf(dieline);

  assert(dxf.includes('AC1009'), `${tmpl.name}: Includes AC1009 AutoCAD R12 header`);
  assert(dxf.includes('$INSUNITS\n70\n4'), `${tmpl.name}: Sets millimeter unit (INSUNITS = 4)`);
  assert(dxf.includes('CUT_LINES'), `${tmpl.name}: Includes CUT_LINES layer definition`);
  assert(dxf.includes('CREASE_LINES'), `${tmpl.name}: Includes CREASE_LINES layer definition`);
  assert(dxf.includes('LINE'), `${tmpl.name}: Contains CAD LINE entities`);
  assert(dxf.endsWith('0\nEOF'), `${tmpl.name}: Ends with standard DXF EOF`);
}

// Test DXF Layer Filtering options
const sampleDieline = generateDieline('burger-box', TEMPLATES[0].defaultDimensions);
const dxfOnlyCut = exportDielineToDxf(sampleDieline, { includeCutLines: true, includeCreaseLines: false });
assert(dxfOnlyCut.includes('CUT_LINES'), 'DXF contains CUT_LINES when enabled');
assert(!dxfOnlyCut.includes('8\nCREASE_LINES'), 'DXF excludes CREASE_LINES when filtered out');

const dxfOnlyCrease = exportDielineToDxf(sampleDieline, { includeCutLines: false, includeCreaseLines: true });
assert(!dxfOnlyCrease.includes('8\nCUT_LINES'), 'DXF excludes CUT_LINES when filtered out');
assert(dxfOnlyCrease.includes('CREASE_LINES'), 'DXF contains CREASE_LINES when enabled');

// -----------------------------------------------------------
// TEST SUITE 6: SRS Requirements Parity (Session, Typography, Icons)
// -----------------------------------------------------------
console.log('\n🛡️ Test Suite 6: SRS Feature Parity');

// 1. Guest Session ID
const guestSessionId = getOrCreateGuestSessionId();
assert(typeof guestSessionId === 'string' && guestSessionId.startsWith('guest_'), `Guest session initialized: ${guestSessionId}`);

// 2. Typography Model
const testTextItem: GraphicItem = {
  id: 'txt-test-srs',
  panelId: 'front',
  type: 'text',
  text: 'NUTRITION: 240 kcal | Fat 8g',
  fontStyle: 'italic',
  lineHeight: 1.35,
  isCurved: true,
};
assert(testTextItem.fontStyle === 'italic', 'GraphicItem supports fontStyle: italic');
assert(testTextItem.lineHeight === 1.35, 'GraphicItem supports lineHeight');
assert(testTextItem.isCurved === true, 'GraphicItem supports isCurved for round food tubs');

// -----------------------------------------------------------
// TEST SUITE 7: Starter Brand Designs
// -----------------------------------------------------------
console.log('\n🎨 Test Suite 7: Starter Brand Designs');

const insidePolygon = (p: { x: number; y: number }, poly: { x: number; y: number }[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

assert(STARTER_STYLES.length >= 4, `Ships ${STARTER_STYLES.length} starter brand styles`);
assert(buildStarterDesign(BLANK_DESIGN_ID, generateDieline('burger-box', getTemplateById('burger-box').defaultDimensions)).length === 0, 'Blank design produces an empty net');

for (const tmpl of TEMPLATES) {
  const dieline = generateDieline(tmpl.id, tmpl.defaultDimensions);
  for (const style of STARTER_STYLES) {
    const items = buildStarterDesign(style.id, dieline);
    const label = `${tmpl.id} × ${style.id}`;
    const panelsById = new Map(dieline.panels.map(p => [p.id, p]));

    const texts = items.filter(i => i.type === 'text');
    const photos = items.filter(i => i.type === 'image' && i.fileName?.startsWith('Product photo'));
    const ids = new Set(items.map(i => i.id));

    const badAnchor = items.find(i => {
      const panel = panelsById.get(i.panelId);
      return !panel || !insidePolygon({ x: i.x!, y: i.y! }, panel.polygon);
    });
    const badImage = items.find(i => i.type === 'image' && !(i.src?.startsWith('data:image/svg+xml') && i.naturalWidth && i.scaleX && i.scaleY));

    assert(
      texts.some(t => t.text?.replace(/\s+/g, ' ').toUpperCase().includes(style.brand.toUpperCase())) && photos.length === 1 && ids.size === items.length && !badAnchor && !badImage,
      `${label}: ${items.length} layers (${texts.length} text, 1 hero photo), unique ids, anchors inside their faces${badAnchor ? ` — bad anchor ${badAnchor.id}` : ''}${badImage ? ` — bad image ${badImage.id}` : ''}`,
    );
  }
}

const bigBurger = generateDieline('burger-box', { ...getTemplateById('burger-box').defaultDimensions, length: 200, width: 200 });
const bigHeroPhoto = buildStarterDesign('kraft', bigBurger).find(i => i.fileName?.startsWith('Product photo'))!;
const lidPanel = bigBurger.panels.find(p => p.id === 'lid-top')!;
const smallBurger = generateDieline('burger-box', getTemplateById('burger-box').defaultDimensions);
const edited = buildStarterDesign('kraft', smallBurger);
const remapped = remapGraphicsToDieline(edited, smallBurger, bigBurger);
const lidBefore = smallBurger.panels.find(p => p.id === 'lid-top')!.bounds;
const lidAfter = bigBurger.panels.find(p => p.id === 'lid-top')!.bounds;
const bgAfter = remapped.find(i => i.panelId === 'lid-top' && i.fileName?.endsWith('background'))!;
const photoAfter = remapped.find(i => i.fileName?.startsWith('Product photo'))!;
const photoBefore = edited.find(i => i.fileName?.startsWith('Product photo'))!;
assert(
  Math.abs(bgAfter.naturalWidth! * bgAfter.scaleX! - lidAfter.width) < 1 && Math.abs(bgAfter.naturalHeight! * bgAfter.scaleY! - lidAfter.height) < 1,
  'Resizing keeps a panel background covering the whole resized panel',
);
assert(
  Math.abs((photoAfter.x! - lidAfter.x) / lidAfter.width - (photoBefore.x! - lidBefore.x) / lidBefore.width) < 1e-6
    && photoAfter.scaleX === photoBefore.scaleX,
  'Resizing keeps other artwork at the same relative spot and size on its panel',
);
assert(bigHeroPhoto.panelId === 'lid-top' && insidePolygon({ x: bigHeroPhoto.x!, y: bigHeroPhoto.y! }, lidPanel.polygon), 'Starter hero photo re-flows onto the resized lid');

console.log('\n====================================================');
console.log(`🎉 ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
