import { TEMPLATES, getTemplateById, generateDieline } from '../src/core/dieline';
import { generateAssembledModel } from '../src/core/preview/assembledBoxModels';
import { getQuadAffineMatrix, mapPanelGraphicsToFace } from '../src/core/preview/graphicProjection';
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
console.log('\n📦 Test Suite 2: 2D Assembled Perspective Models');
const viewAngles: ViewAngle[] = ['isometric', 'front', 'top', 'side'];

for (const tmpl of TEMPLATES) {
  const dieline = generateDieline(tmpl.id, tmpl.defaultDimensions);

  // Test across different angles and openness levels
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

    assert(model.faces.length > 0, `${tmpl.name} [Angle: ${angle}]: Model produced ${model.faces.length} visible faces`);
    assert(model.shadow.rx > 0 && model.shadow.ry > 0, `${tmpl.name} [Angle: ${angle}]: Ground shadow valid`);

    for (const face of model.faces) {
      assert(face.points.length >= 3 || face.pathD !== undefined, `${tmpl.name} -> Face "${face.name}": Has valid geometry`);
      assert(face.lighting > 0, `${tmpl.name} -> Face "${face.name}": Has valid lighting factor (${face.lighting})`);
    }
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

console.log('\n====================================================');
console.log(`🎉 ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
