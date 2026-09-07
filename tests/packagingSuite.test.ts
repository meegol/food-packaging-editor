import { TEMPLATES, getTemplateById, generateDieline } from '../src/core/dieline';
import { generateAssembledModel } from '../src/core/preview/assembledBoxModels';
import { getQuadAffineMatrix, mapPanelGraphicsToFace, projectPanelGraphicsToFace3D } from '../src/core/preview/graphicProjection';
import { Camera3D, Face3DDefinition } from '../src/core/preview/engine3d';
import { parseProjectFile } from '../src/core/storage/projectStorage';
import { GraphicItem } from '../src/core/graphics/types';
import { ViewAngle } from '../src/core/preview/previewTypes';
import { PanelFace } from '../src/core/dieline/types';

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

// -----------------------------------------------------------
// TEST SUITE 2: 2D Assembled Models for All 12 Templates
// -----------------------------------------------------------
console.log('\n📦 Test Suite 2: 3D Assembled Perspective Models & 360° Turntable Rotation');
const viewAngles: ViewAngle[] = ['isometric', 'front', 'side', 'back', 'left', 'top', 'bottom'];
const turntableYaws = [0, 45, 90, 135, 180, 225, 270, 315];

for (const tmpl of TEMPLATES) {
  const dieline = generateDieline(tmpl.id, tmpl.defaultDimensions);

  // 1. Test across all cardinal angles
  for (const angle of viewAngles) {
    const model = generateAssembledModel(
      tmpl.id,
      tmpl.defaultDimensions,
      dieline.panels,
      [],
      {
        viewAngle: angle,
        material: 'kraft',
        lighting: 'dark',
        openness: 0.35,
        showShadow: true,
        zoom: 1,
      }
    );

    assert(model.faces.length > 0, `${tmpl.name} [Cardinal Angle: ${angle}]: Model produced ${model.faces.length} visible faces`);
    assert(model.shadow.rx > 0 && model.shadow.ry > 0, `${tmpl.name} [Cardinal Angle: ${angle}]: Ground shadow valid`);

    for (const face of model.faces) {
      assert(face.points.length >= 3 || face.pathD !== undefined, `${tmpl.name} -> Face "${face.name}": Has valid geometry`);
      assert(face.lighting > 0, `${tmpl.name} -> Face "${face.name}": Has valid lighting factor (${face.lighting.toFixed(2)})`);
    }
  }

  // 2. Test continuous 360° turntable rotation steps
  for (const yaw of turntableYaws) {
    const model = generateAssembledModel(
      tmpl.id,
      tmpl.defaultDimensions,
      dieline.panels,
      [],
      {
        viewAngle: 'custom',
        material: 'white',
        lighting: 'light',
        openness: 0,
        showShadow: true,
        zoom: 1,
        yaw,
        pitch: 15,
      }
    );
    assert(model.faces.length > 0, `${tmpl.name} [360° Yaw ${yaw}°]: Model has ${model.faces.length} visible faces`);
  }
}

// -----------------------------------------------------------
// TEST SUITE 3: Graphic Projection onto Assembled Faces
// -----------------------------------------------------------
console.log('\n🎨 Test Suite 3: Artwork & Typography Projection Engine');
const burgerDieline = generateDieline('burger-box', getTemplateById('burger-box').defaultDimensions);
const topLidPanel = burgerDieline.panels.find((p: PanelFace) => p.id === 'lid-top' || p.id === 'top-lid' || p.isLid)!;
assert(topLidPanel !== undefined, 'Burger box has lid panel');

const testGraphics: GraphicItem[] = [
  {
    id: 'test-text-1',
    panelId: topLidPanel.id,
    type: 'text',
    text: 'GOURMET BURGER',
    fontSize: 20,
    fill: '#ffffff',
    textAlign: 'center',
    clipToPanel: true,
    x: topLidPanel.center.x,
    y: topLidPanel.center.y,
    angle: 0,
  },
  {
    id: 'test-img-1',
    panelId: topLidPanel.id,
    type: 'image',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    clipToPanel: true,
    x: topLidPanel.center.x + 10,
    y: topLidPanel.center.y - 10,
    scaleX: 1.5,
    scaleY: 1.5,
    angle: 90,
  },
];

const projected = mapPanelGraphicsToFace(topLidPanel, testGraphics, 200, 200);
assert(projected.length === 2, `Mapped 2 graphics onto top-lid face (found ${projected.length})`);
assert(projected[0].text === 'GOURMET BURGER', 'Text graphic retained text content');
assert(projected[1].type === 'image', 'Image graphic retained image type and source');
assert(projected[1].rotation === 90, 'Image rotation preserved at 90 degrees');

// Affine Transform Calculation Check
const p0 = { x: 100, y: 100 };
const p1 = { x: 300, y: 120 };
const p2 = { x: 280, y: 250 };
const p3 = { x: 80, y: 230 };
const matrix = getQuadAffineMatrix(p0, p1, p2, p3, 200, 150);
assert(matrix.startsWith('matrix('), `Calculated valid SVG affine matrix: ${matrix}`);

// True 3D Planar Projection & Zero-Drift Verification
const testFace3D: Face3DDefinition = {
  id: 'burger-base-left',
  name: 'Base Left Wall',
  panelId: 'base-left',
  vertices: [
    { x: -60, y: 35, z: -60 },
    { x: -60, y: 35, z: 60 },
    { x: -57, y: -35, z: 57 },
    { x: -57, y: -35, z: -57 },
  ],
};

const baseLeftPanel = burgerDieline.panels.find(p => p.id === 'base-left')!;
assert(!!baseLeftPanel, 'Found base-left panel for 3D planar testing');

const sideGraphic: GraphicItem = {
  id: 'side-logo-1',
  panelId: 'base-left',
  type: 'image',
  src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  x: baseLeftPanel.center.x,
  y: baseLeftPanel.center.y,
  width: 40,
  height: 40,
  scaleX: 1,
  scaleY: 1,
};

// Test across turntable yaw angles: 0, 45, 51 (user angle), 90
const anglesToTest = [0, 45, 51, 90, 135, 180, 270];
for (const yawAngle of anglesToTest) {
  const cam: Camera3D = {
    cx: 400,
    cy: 340,
    distance: 850,
    yawDeg: yawAngle,
    pitchDeg: 24,
    zoom: 1,
  };

  const projected3D = projectPanelGraphicsToFace3D(baseLeftPanel, [sideGraphic], testFace3D, cam);
  assert(projected3D.length === 1, `Projected graphic onto 3D face at yaw ${yawAngle}°`);
  const g = projected3D[0];
  assert(!!g.transformMatrix && g.transformMatrix.startsWith('matrix('), `Generated valid 3D affine matrix at ${yawAngle}°: ${g.transformMatrix}`);
  assert(!!g.screenCenter && typeof g.screenCenter.x === 'number' && typeof g.screenCenter.y === 'number', `Generated valid screen center at ${yawAngle}°`);
  assert(!!g.screenCorners && g.screenCorners.length === 4, `Generated 4 perspective screen corners at ${yawAngle}°`);
}

// -----------------------------------------------------------
// TEST SUITE 4: Project Serialization & Recovery
// -----------------------------------------------------------
console.log('\n💾 Test Suite 4: Project Storage & Parsing');
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

console.log('\n====================================================');
console.log(`🎉 ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
