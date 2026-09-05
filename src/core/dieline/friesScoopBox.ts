import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a French Fries Scoop Box.
 * Features a high arched back wall, low scooped front wall with a smooth concave cut,
 * tapered sidewalls, side glue flap, and an interlocking fold-in base.
 */
export function generateFriesScoopBoxDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;                 // Front width
  const l = L * scale;                 // Side depth
  const backH = D * scale;             // Back wall total height
  const frontH = backH * 0.55;         // Front scoop height
  const bottomFlapH = l * 0.7;         // Base flap height
  const glueTabW = 12 * scale;

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `ff-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = glueTabW + 40;
  const startY = 40;

  // X offsets for the 4 consecutive panels
  // Panel 1: Left Sidewall (wL = l)
  // Panel 2: Front Scoop Wall (wF = w)
  // Panel 3: Right Sidewall (wR = l)
  // Panel 4: Back Support Wall (wB = w)
  // Side Glue Tab on the far right or far left
  const x0 = startX;
  const x1 = x0 + l;
  const x2 = x1 + w;
  const x3 = x2 + l;
  const x4 = x3 + w;

  const baseY = startY + backH;

  // Top Y coordinates
  // Left sidewall top: slants from backH down to frontH
  const yBackTop = startY;
  const yFrontTop = baseY - frontH;

  // 1. Left Sidewall Panel
  panels.push({
    id: 'fries-left',
    name: 'Left Tapered Sidewall',
    polygon: [
      { x: x0, y: yBackTop },
      { x: x1, y: yFrontTop },
      { x: x1, y: baseY },
      { x: x0, y: baseY },
    ],
    bounds: { x: x0, y: yBackTop, width: l, height: backH },
    center: { x: x0 + l / 2, y: baseY - (backH + frontH) / 4 },
  });

  // 2. Front Scoop Wall Panel (concave top)
  const scoopDepth = frontH * 0.25;
  const frontMidY = yFrontTop + scoopDepth;
  panels.push({
    id: 'fries-front',
    name: 'Front Scoop Wall',
    polygon: [
      { x: x1, y: yFrontTop },
      { x: x1 + w * 0.25, y: frontMidY * 0.95 },
      { x: x1 + w * 0.5, y: frontMidY },
      { x: x1 + w * 0.75, y: frontMidY * 0.95 },
      { x: x2, y: yFrontTop },
      { x: x2, y: baseY },
      { x: x1, y: baseY },
    ],
    bounds: { x: x1, y: yFrontTop, width: w, height: frontH },
    center: { x: x1 + w / 2, y: baseY - frontH / 2 },
  });

  // 3. Right Sidewall Panel
  panels.push({
    id: 'fries-right',
    name: 'Right Tapered Sidewall',
    polygon: [
      { x: x2, y: yFrontTop },
      { x: x3, y: yBackTop },
      { x: x3, y: baseY },
      { x: x2, y: baseY },
    ],
    bounds: { x: x2, y: yBackTop, width: l, height: backH },
    center: { x: x2 + l / 2, y: baseY - (backH + frontH) / 4 },
  });

  // 4. Back Support Wall Panel (arched top)
  const archRise = backH * 0.08;
  panels.push({
    id: 'fries-back',
    name: 'Back Support Wall',
    polygon: [
      { x: x3, y: yBackTop },
      { x: x3 + w * 0.25, y: yBackTop - archRise * 0.8 },
      { x: x3 + w * 0.5, y: yBackTop - archRise },
      { x: x3 + w * 0.75, y: yBackTop - archRise * 0.8 },
      { x: x4, y: yBackTop },
      { x: x4, y: baseY },
      { x: x3, y: baseY },
    ],
    bounds: { x: x3, y: yBackTop - archRise, width: w, height: backH + archRise },
    center: { x: x3 + w / 2, y: baseY - backH / 2 },
  });

  // 5. Interlocking Bottom Base Flaps
  panels.push({
    id: 'fries-bottom',
    name: 'Folding Base Panels',
    polygon: [
      { x: x1, y: baseY },
      { x: x1 + w, y: baseY },
      { x: x1 + w - 10 * scale, y: baseY + bottomFlapH },
      { x: x1 + 10 * scale, y: baseY + bottomFlapH },
    ],
    bounds: { x: x1, y: baseY, width: w, height: bottomFlapH },
    center: { x: x1 + w / 2, y: baseY + bottomFlapH / 2 },
    isBase: true,
  });

  // 6. Side Glue Tab
  panels.push({
    id: 'fries-glue-tab',
    name: 'Side Glue Tab',
    polygon: [
      { x: x0, y: yBackTop + 10 * scale },
      { x: x0 - glueTabW, y: yBackTop + 20 * scale },
      { x: x0 - glueTabW, y: baseY - 10 * scale },
      { x: x0, y: baseY },
    ],
    bounds: { x: x0 - glueTabW, y: yBackTop, width: glueTabW, height: backH },
    center: { x: x0 - glueTabW / 2, y: baseY - backH / 2 },
    isFlap: true,
  });

  // --- CREASE LINES (Green dashed) ---
  // Vertical folds between panels
  addLine(x1, yFrontTop, x1, baseY, 'crease');
  addLine(x2, yFrontTop, x2, baseY, 'crease');
  addLine(x3, yBackTop, x3, baseY, 'crease');
  addLine(x0, yBackTop + 10 * scale, x0, baseY, 'crease');

  // Bottom baseline crease lines
  addLine(x0, baseY, x4, baseY, 'crease');

  // --- CUT LINES (Red solid) ---
  // Top contour
  // Left sidewall slant
  addLine(x0, yBackTop, x1, yFrontTop, 'cut');
  // Front scoop concave curve
  addLine(x1, yFrontTop, x1 + w * 0.25, frontMidY * 0.95, 'cut');
  addLine(x1 + w * 0.25, frontMidY * 0.95, x1 + w * 0.5, frontMidY, 'cut');
  addLine(x1 + w * 0.5, frontMidY, x1 + w * 0.75, frontMidY * 0.95, 'cut');
  addLine(x1 + w * 0.75, frontMidY * 0.95, x2, yFrontTop, 'cut');
  // Right sidewall slant
  addLine(x2, yFrontTop, x3, yBackTop, 'cut');
  // Back support wall arch
  addLine(x3, yBackTop, x3 + w * 0.25, yBackTop - archRise * 0.8, 'cut');
  addLine(x3 + w * 0.25, yBackTop - archRise * 0.8, x3 + w * 0.5, yBackTop - archRise, 'cut');
  addLine(x3 + w * 0.5, yBackTop - archRise, x3 + w * 0.75, yBackTop - archRise * 0.8, 'cut');
  addLine(x3 + w * 0.75, yBackTop - archRise * 0.8, x4, yBackTop, 'cut');

  // Far right cut (back wall outer edge)
  addLine(x4, yBackTop, x4, baseY, 'cut');

  // Glue Tab Cuts
  addLine(x0, yBackTop + 10 * scale, x0 - glueTabW, yBackTop + 20 * scale, 'cut');
  addLine(x0 - glueTabW, yBackTop + 20 * scale, x0 - glueTabW, baseY - 10 * scale, 'cut');
  addLine(x0 - glueTabW, baseY - 10 * scale, x0, baseY, 'cut');

  // Bottom Base Flaps Cuts
  addLine(x0, baseY, x0 + 8 * scale, baseY + bottomFlapH * 0.6, 'cut');
  addLine(x0 + 8 * scale, baseY + bottomFlapH * 0.6, x1 - 8 * scale, baseY + bottomFlapH * 0.6, 'cut');
  addLine(x1 - 8 * scale, baseY + bottomFlapH * 0.6, x1, baseY, 'cut');

  // Front Bottom Flap
  addLine(x1, baseY, x1 + 10 * scale, baseY + bottomFlapH, 'cut');
  addLine(x1 + 10 * scale, baseY + bottomFlapH, x2 - 10 * scale, baseY + bottomFlapH, 'cut');
  addLine(x2 - 10 * scale, baseY + bottomFlapH, x2, baseY, 'cut');

  // Right Side Bottom Flap
  addLine(x2, baseY, x2 + 8 * scale, baseY + bottomFlapH * 0.6, 'cut');
  addLine(x2 + 8 * scale, baseY + bottomFlapH * 0.6, x3 - 8 * scale, baseY + bottomFlapH * 0.6, 'cut');
  addLine(x3 - 8 * scale, baseY + bottomFlapH * 0.6, x3, baseY, 'cut');

  // Back Bottom Flap
  addLine(x3, baseY, x3 + 10 * scale, baseY + bottomFlapH, 'cut');
  addLine(x3 + 10 * scale, baseY + bottomFlapH, x4 - 10 * scale, baseY + bottomFlapH, 'cut');
  addLine(x4 - 10 * scale, baseY + bottomFlapH, x4, baseY, 'cut');

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
    templateId: 'fries-scoop-box',
    templateName: 'French Fries Scoop Box',
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
