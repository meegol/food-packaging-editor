import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Side Gusset Coffee & Cookie Bag with Window.
 * Features left and right accordion gussets with center valley score lines,
 * front face with a transparent product window cutout, fold-down tin-tie header,
 * and a block-bottom envelope folding base.
 */
export function generateSideGussetBagDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;                 // Front and back face width
  const halfW = w / 2;
  const g = D * scale;                 // Gusset depth
  const l = L * scale;                 // Main body height
  const headerH = 35 * scale;          // Top fold-down / tin-tie closure header
  const bottomH = (g / 2) + 16 * scale; // Block bottom folding base flaps
  const glueTabW = 12 * scale;         // Rear seam overlap

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `sg-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = 40;
  const startY = 40;

  // Horizontal sequence across the net:
  // Back Left (halfW) | Left Gusset (g) | Front Face (w) | Right Gusset (g) | Back Right (halfW) | GlueTab
  const x0 = startX;
  const x1 = x0 + halfW;
  const x2 = x1 + g;
  const x3 = x2 + w;
  const x4 = x3 + g;
  const x5 = x4 + halfW;
  const x6 = x5 + glueTabW;

  const bodyY = startY + headerH;
  const baseY = bodyY + l;

  // 1. Back Left Face
  panels.push({
    id: 'bag-back-left',
    name: 'Back Left Face',
    polygon: [
      { x: x0, y: bodyY },
      { x: x1, y: bodyY },
      { x: x1, y: baseY },
      { x: x0, y: baseY },
    ],
    bounds: { x: x0, y: bodyY, width: halfW, height: l },
    center: { x: x0 + halfW / 2, y: bodyY + l / 2 },
  });

  // 2. Left Gusset Panel
  panels.push({
    id: 'bag-gusset-left',
    name: 'Left Side Gusset',
    polygon: [
      { x: x1, y: bodyY },
      { x: x2, y: bodyY },
      { x: x2, y: baseY },
      { x: x1, y: baseY },
    ],
    bounds: { x: x1, y: bodyY, width: g, height: l },
    center: { x: x1 + g / 2, y: bodyY + l / 2 },
  });

  // 3. Front Face Panel (Main Branding & Window)
  panels.push({
    id: 'bag-front',
    name: 'Front Face (Window)',
    polygon: [
      { x: x2, y: bodyY },
      { x: x3, y: bodyY },
      { x: x3, y: baseY },
      { x: x2, y: baseY },
    ],
    bounds: { x: x2, y: bodyY, width: w, height: l },
    center: { x: x2 + w / 2, y: bodyY + l / 2 },
    isLid: true,
  });

  // 4. Right Gusset Panel
  panels.push({
    id: 'bag-gusset-right',
    name: 'Right Side Gusset',
    polygon: [
      { x: x3, y: bodyY },
      { x: x4, y: bodyY },
      { x: x4, y: baseY },
      { x: x3, y: baseY },
    ],
    bounds: { x: x3, y: bodyY, width: g, height: l },
    center: { x: x3 + g / 2, y: bodyY + l / 2 },
  });

  // 5. Back Right Face
  panels.push({
    id: 'bag-back-right',
    name: 'Back Right Face',
    polygon: [
      { x: x4, y: bodyY },
      { x: x5, y: bodyY },
      { x: x5, y: baseY },
      { x: x4, y: baseY },
    ],
    bounds: { x: x4, y: bodyY, width: halfW, height: l },
    center: { x: x4 + halfW / 2, y: bodyY + l / 2 },
  });

  // 6. Top Fold Closure Header
  panels.push({
    id: 'bag-top-header',
    name: 'Top Tin-Tie Header',
    polygon: [
      { x: x2, y: startY },
      { x: x3, y: startY },
      { x: x3, y: bodyY },
      { x: x2, y: bodyY },
    ],
    bounds: { x: x2, y: startY, width: w, height: headerH },
    center: { x: x2 + w / 2, y: startY + headerH / 2 },
    isFlap: true,
  });

  // 7. Block Bottom Base
  panels.push({
    id: 'bag-block-bottom',
    name: 'Block Bottom Base',
    polygon: [
      { x: x2, y: baseY },
      { x: x3, y: baseY },
      { x: x3, y: baseY + bottomH },
      { x: x2, y: baseY + bottomH },
    ],
    bounds: { x: x2, y: baseY, width: w, height: bottomH },
    center: { x: x2 + w / 2, y: baseY + bottomH / 2 },
    isBase: true,
  });

  // --- CREASE LINES (Green dashed) ---
  // Main vertical panel dividers
  addLine(x1, startY, x1, baseY + bottomH, 'crease');
  addLine(x2, startY, x2, baseY + bottomH, 'crease');
  addLine(x3, startY, x3, baseY + bottomH, 'crease');
  addLine(x4, startY, x4, baseY + bottomH, 'crease');
  addLine(x5, startY, x5, baseY + bottomH, 'crease');

  // Left gusset center valley fold
  const leftGussetMidX = x1 + g / 2;
  addLine(leftGussetMidX, startY, leftGussetMidX, baseY, 'crease');
  // Left gusset bottom V-fold
  addLine(x1, baseY, leftGussetMidX, baseY - g / 2, 'crease');
  addLine(x2, baseY, leftGussetMidX, baseY - g / 2, 'crease');

  // Right gusset center valley fold
  const rightGussetMidX = x3 + g / 2;
  addLine(rightGussetMidX, startY, rightGussetMidX, baseY, 'crease');
  // Right gusset bottom V-fold
  addLine(x3, baseY, rightGussetMidX, baseY - g / 2, 'crease');
  addLine(x4, baseY, rightGussetMidX, baseY - g / 2, 'crease');

  // Horizontal creases: Header and Bottom
  addLine(x0, bodyY, x5, bodyY, 'crease');
  addLine(x0, baseY, x5, baseY, 'crease');

  // Header tin-tie fold line
  addLine(x0, startY + headerH * 0.5, x5, startY + headerH * 0.5, 'crease');

  // --- CUT LINES (Perimeter - Red solid) ---
  // Top cut
  addLine(x0, startY, x5, startY, 'cut');
  // Left cut
  addLine(x0, startY, x0, baseY + bottomH, 'cut');
  // Right cut
  addLine(x6, startY, x6, baseY + bottomH, 'cut');
  // Bottom cut
  addLine(x0, baseY + bottomH, x6, baseY + bottomH, 'cut');

  // Glue Tab Outer Cuts
  addLine(x5, startY, x6, startY + 10 * scale, 'cut');
  addLine(x6, startY + 10 * scale, x6, baseY + bottomH - 10 * scale, 'cut');
  addLine(x6, baseY + bottomH - 10 * scale, x5, baseY + bottomH, 'cut');

  // Front Cookie Viewing Window Cutout (Crease Guide)
  const winW = w * 0.65;
  const winH = l * 0.45;
  const winX = x2 + (w - winW) / 2;
  const winY = bodyY + l * 0.28;
  addLine(winX, winY, winX + winW, winY, 'crease');
  addLine(winX + winW, winY, winX + winW, winY + winH, 'crease');
  addLine(winX + winW, winY + winH, winX, winY + winH, 'crease');
  addLine(winX, winY + winH, winX, winY, 'crease');

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
    templateId: 'side-gusset-bag',
    templateName: 'Side Gusset Coffee & Cookie Bag',
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
