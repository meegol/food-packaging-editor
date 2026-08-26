import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Stand-up Ziplock Food Pouch.
 * Includes Front Panel, Back Panel, Bottom Oval/K-Seal Gusset,
 * Heat-Seal Perimeter margins, Tear Notches, and Zipper indicator lines.
 */
export function generateStandUpPouchDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale factor (1mm = 2.5px)
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;
  const l = L * scale;
  const gussetDepth = D * scale; // Bottom expansion gusset

  const sealBorder = 8 * scale;   // 8mm heat seal side borders
  const headerHeight = 25 * scale; // 25mm top seal & tear notch zone
  const tearNotchW = 4 * scale;

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `pouch-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = 40;
  const startY = 40;

  // Front Panel
  const frontRect = { x: startX, y: startY, width: w, height: l };
  panels.push({
    id: 'pouch-front',
    name: 'Front Panel',
    polygon: [
      { x: frontRect.x + sealBorder, y: frontRect.y + headerHeight },
      { x: frontRect.x + w - sealBorder, y: frontRect.y + headerHeight },
      { x: frontRect.x + w - sealBorder, y: frontRect.y + l },
      { x: frontRect.x + sealBorder, y: frontRect.y + l },
    ],
    bounds: {
      x: frontRect.x + sealBorder,
      y: frontRect.y + headerHeight,
      width: w - 2 * sealBorder,
      height: l - headerHeight,
    },
    center: { x: frontRect.x + w / 2, y: frontRect.y + (headerHeight + l) / 2 },
  });

  // Back Panel (Displayed side-by-side with a 30px gap)
  const gap = 30;
  const backStartX = startX + w + gap;
  const backRect = { x: backStartX, y: startY, width: w, height: l };
  panels.push({
    id: 'pouch-back',
    name: 'Back Panel',
    polygon: [
      { x: backRect.x + sealBorder, y: backRect.y + headerHeight },
      { x: backRect.x + w - sealBorder, y: backRect.y + headerHeight },
      { x: backRect.x + w - sealBorder, y: backRect.y + l },
      { x: backRect.x + sealBorder, y: backRect.y + l },
    ],
    bounds: {
      x: backRect.x + sealBorder,
      y: backRect.y + headerHeight,
      width: w - 2 * sealBorder,
      height: l - headerHeight,
    },
    center: { x: backRect.x + w / 2, y: backRect.y + (headerHeight + l) / 2 },
  });

  // Bottom Gusset Panel (Positioned below front panel)
  const gussetY = startY + l + 30;
  const gussetRect = { x: startX + sealBorder, y: gussetY, width: w - 2 * sealBorder, height: gussetDepth };
  panels.push({
    id: 'pouch-gusset',
    name: 'Bottom Folding Gusset',
    polygon: [
      { x: gussetRect.x, y: gussetRect.y },
      { x: gussetRect.x + gussetRect.width, y: gussetRect.y },
      { x: gussetRect.x + gussetRect.width, y: gussetRect.y + gussetRect.height },
      { x: gussetRect.x, y: gussetRect.y + gussetRect.height },
    ],
    bounds: gussetRect,
    center: { x: startX + w / 2, y: gussetY + gussetDepth / 2 },
    isBase: true,
  });

  // --- 1. FRONT POUCH CUT LINES ---
  addLine(startX, startY, startX + w, startY, 'cut'); // Top Cut
  addLine(startX, startY, startX, startY + l, 'cut'); // Left Cut
  addLine(startX + w, startY, startX + w, startY + l, 'cut'); // Right Cut
  addLine(startX, startY + l, startX + w, startY + l, 'cut'); // Bottom Cut

  // Tear Notches on Front
  const tearY = startY + headerHeight * 0.45;
  addLine(startX, tearY, startX + tearNotchW, tearY, 'cut');
  addLine(startX + w - tearNotchW, tearY, startX + w, tearY, 'cut');

  // --- 2. FRONT POUCH CREASE / SEAL GUIDES ---
  // Side seals (dashed green)
  addLine(startX + sealBorder, startY, startX + sealBorder, startY + l, 'crease');
  addLine(startX + w - sealBorder, startY, startX + w - sealBorder, startY + l, 'crease');
  // Header seal
  addLine(startX, startY + headerHeight, startX + w, startY + headerHeight, 'crease');
  // Zipper line indicator
  const zipperY = startY + headerHeight * 0.75;
  addLine(startX + sealBorder, zipperY, startX + w - sealBorder, zipperY, 'crease');

  // --- 3. BACK POUCH CUT LINES ---
  addLine(backStartX, startY, backStartX + w, startY, 'cut');
  addLine(backStartX, startY, backStartX, startY + l, 'cut');
  addLine(backStartX + w, startY, backStartX + w, startY + l, 'cut');
  addLine(backStartX, startY + l, backStartX + w, startY + l, 'cut');

  // Tear Notches on Back
  addLine(backStartX, tearY, backStartX + tearNotchW, tearY, 'cut');
  addLine(backStartX + w - tearNotchW, tearY, backStartX + w, tearY, 'cut');

  // --- 4. BACK POUCH CREASE / SEAL GUIDES ---
  addLine(backStartX + sealBorder, startY, backStartX + sealBorder, startY + l, 'crease');
  addLine(backStartX + w - sealBorder, startY, backStartX + w - sealBorder, startY + l, 'crease');
  addLine(backStartX, startY + headerHeight, backStartX + w, startY + headerHeight, 'crease');
  addLine(backStartX + sealBorder, zipperY, backStartX + w - sealBorder, zipperY, 'crease');

  // --- 5. GUSSET CUT & CREASE LINES ---
  // Outer cut of gusset
  addLine(startX, gussetY, startX + w, gussetY, 'cut');
  addLine(startX, gussetY, startX, gussetY + gussetDepth, 'cut');
  addLine(startX + w, gussetY, startX + w, gussetY + gussetDepth, 'cut');
  addLine(startX, gussetY + gussetDepth, startX + w, gussetY + gussetDepth, 'cut');

  // Center fold of gusset
  addLine(startX, gussetY + gussetDepth / 2, startX + w, gussetY + gussetDepth / 2, 'crease');

  // K-Seal diagonal score lines at gusset edges
  addLine(startX + sealBorder, gussetY, startX + sealBorder * 2, gussetY + gussetDepth / 2, 'crease');
  addLine(startX + sealBorder, gussetY + gussetDepth, startX + sealBorder * 2, gussetY + gussetDepth / 2, 'crease');
  addLine(startX + w - sealBorder, gussetY, startX + w - sealBorder * 2, gussetY + gussetDepth / 2, 'crease');
  addLine(startX + w - sealBorder, gussetY + gussetDepth, startX + w - sealBorder * 2, gussetY + gussetDepth / 2, 'crease');

  const allPoints: Point[] = [];
  lines.forEach(l => {
    allPoints.push({ x: l.x1, y: l.y1 });
    allPoints.push({ x: l.x2, y: l.y2 });
  });

  const minX = Math.min(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const maxY = Math.max(...allPoints.map(p => p.y));

  return {
    templateId: 'standup-pouch',
    templateName: 'Stand-up Ziplock Pouch',
    dimensions,
    lines,
    panels,
    totalBounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}
