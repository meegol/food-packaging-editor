import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Sliced Bread Loaf Bag (Wicketed Poly Bag).
 * Commercial packaging format for sliced sandwich loaf bread (e.g. Gardenia style).
 * Features expandable left & right side gussets, front branding & window face,
 * back panel, top wicketed gather lip with twist-tie / bread clip fold indicator,
 * and bottom heat-seal fold.
 */
export function generateBreadLoafBagDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;                 // Front and back face width
  const halfW = w / 2;
  const g = D * scale;                 // Side gusset depth
  const l = L * scale;                 // Loaf body length
  const headerH = 65 * scale;          // Wicket gathered lip header height
  const bottomH = 15 * scale;          // Bottom sealed base band
  const glueTabW = 10 * scale;         // Longitudinal back fin seal

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `bb-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = 40;
  const startY = 40;

  // Horizontal sequence of panels:
  // Back Left (halfW) | Left Gusset (g) | Front Face (w) | Right Gusset (g) | Back Right (halfW) | Fin Seal
  const x0 = startX;
  const x1 = x0 + halfW;
  const x2 = x1 + g;
  const x3 = x2 + w;
  const x4 = x3 + g;
  const x5 = x4 + halfW;
  const x6 = x5 + glueTabW;

  const bodyY = startY + headerH;
  const baseY = bodyY + l;
  const bottomCutY = baseY + bottomH;

  // 1. Back Left Face
  panels.push({
    id: 'bread-back-left',
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

  // 2. Left Side Gusset
  panels.push({
    id: 'bread-gusset-left',
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

  // 3. Front Face (Primary Loaf Branding & Bread Window)
  panels.push({
    id: 'bread-front',
    name: 'Front Face (Window & Brand)',
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

  // 4. Right Side Gusset
  panels.push({
    id: 'bread-gusset-right',
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
    id: 'bread-back-right',
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

  // 6. Top Wicket / Gather Lip Header (with twist-tie gather guide)
  panels.push({
    id: 'bread-top-header',
    name: 'Top Gather Header (Tie Zone)',
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

  // 7. Bottom Heat-Seal Base
  panels.push({
    id: 'bread-bottom-seal',
    name: 'Bottom Sealed Base',
    polygon: [
      { x: x2, y: baseY },
      { x: x3, y: baseY },
      { x: x3, y: bottomCutY },
      { x: x2, y: bottomCutY },
    ],
    bounds: { x: x2, y: baseY, width: w, height: bottomH },
    center: { x: x2 + w / 2, y: baseY + bottomH / 2 },
    isBase: true,
  });

  // --- CREASE LINES (Green dashed) ---
  // Main vertical panel dividers
  addLine(x1, startY, x1, bottomCutY, 'crease');
  addLine(x2, startY, x2, bottomCutY, 'crease');
  addLine(x3, startY, x3, bottomCutY, 'crease');
  addLine(x4, startY, x4, bottomCutY, 'crease');
  addLine(x5, startY, x5, bottomCutY, 'crease');

  // Center valley creases on gussets
  const leftGussetMidX = x1 + g / 2;
  addLine(leftGussetMidX, startY, leftGussetMidX, bottomCutY, 'crease');

  const rightGussetMidX = x3 + g / 2;
  addLine(rightGussetMidX, startY, rightGussetMidX, bottomCutY, 'crease');

  // Horizontal crease at gather neck (where bread clip / twist tie fastens)
  addLine(x0, bodyY, x5, bodyY, 'crease');

  // Bread Clip / Twist-Tie gather guide line
  const tieY = startY + headerH * 0.45;
  addLine(x0, tieY, x5, tieY, 'crease');

  // Bottom seal line
  addLine(x0, baseY, x5, baseY, 'crease');

  // --- CUT LINES (Red solid) ---
  // Top outer cut
  addLine(x0, startY, x5, startY, 'cut');
  // Left cut
  addLine(x0, startY, x0, bottomCutY, 'cut');
  // Right cut
  addLine(x6, startY, x6, bottomCutY, 'cut');
  // Bottom cut
  addLine(x0, bottomCutY, x6, bottomCutY, 'cut');

  // Fin seal top and bottom tapered cuts
  addLine(x5, startY, x6, startY + 8 * scale, 'cut');
  addLine(x6, bottomCutY - 8 * scale, x5, bottomCutY, 'cut');

  // Wicket hanging holes (represented as crosshair cut indicators on top lip)
  const holeRadius = 5 * scale;
  const holeY = startY + headerH * 0.2;
  const hole1X = x2 + w * 0.25;
  const hole2X = x2 + w * 0.75;
  addLine(hole1X - holeRadius, holeY, hole1X + holeRadius, holeY, 'cut');
  addLine(hole1X, holeY - holeRadius, hole1X, holeY + holeRadius, 'cut');
  addLine(hole2X - holeRadius, holeY, hole2X + holeRadius, holeY, 'cut');
  addLine(hole2X, holeY - holeRadius, hole2X, holeY + holeRadius, 'cut');

  // Front Sliced Bread Viewing Window Outline (Crease Guide)
  const winW = w * 0.75;
  const winH = l * 0.5;
  const winX = x2 + (w - winW) / 2;
  const winY = bodyY + l * 0.25;
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
    templateId: 'bread-loaf-bag',
    templateName: 'Sliced Bread Loaf Bag',
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
