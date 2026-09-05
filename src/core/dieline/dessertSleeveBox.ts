import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Dessert Window Sleeve Box.
 * Features an outer sliding sleeve with a panoramic product window cutout
 * and a collapsible inner food tray (for macarons, pastries, donuts, sushi).
 */
export function generateDessertSleeveBoxDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;          // Width of tray/sleeve
  const l = L * scale;          // Length of box
  const d = D * scale;          // Depth / Height

  const glueTabW = 15 * scale;
  const gap = 35 * scale;       // Gap between sleeve net and tray net

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `dsb-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = 40;
  const startY = 40;

  // ==========================================
  // PART 1: OUTER SLIDING SLEEVE NET
  // 4 continuous panels: Left (d), Top (w), Right (d), Bottom (w), GlueTab
  // Length is 'l'
  // ==========================================
  const slX0 = startX;
  const slX1 = slX0 + d;
  const slX2 = slX1 + w;
  const slX3 = slX2 + d;
  const slX4 = slX3 + w;
  const slX5 = slX4 + glueTabW;

  // 1. Sleeve Left Wall
  panels.push({
    id: 'sleeve-left',
    name: 'Sleeve Left Wall',
    polygon: [
      { x: slX0, y: startY },
      { x: slX1, y: startY },
      { x: slX1, y: startY + l },
      { x: slX0, y: startY + l },
    ],
    bounds: { x: slX0, y: startY, width: d, height: l },
    center: { x: slX0 + d / 2, y: startY + l / 2 },
  });

  // 2. Sleeve Top Window Face
  panels.push({
    id: 'sleeve-top',
    name: 'Sleeve Top (Window Face)',
    polygon: [
      { x: slX1, y: startY },
      { x: slX2, y: startY },
      { x: slX2, y: startY + l },
      { x: slX1, y: startY + l },
    ],
    bounds: { x: slX1, y: startY, width: w, height: l },
    center: { x: slX1 + w / 2, y: startY + l / 2 },
    isLid: true,
  });

  // 3. Sleeve Right Wall
  panels.push({
    id: 'sleeve-right',
    name: 'Sleeve Right Wall',
    polygon: [
      { x: slX2, y: startY },
      { x: slX3, y: startY },
      { x: slX3, y: startY + l },
      { x: slX2, y: startY + l },
    ],
    bounds: { x: slX2, y: startY, width: d, height: l },
    center: { x: slX2 + d / 2, y: startY + l / 2 },
  });

  // 4. Sleeve Bottom Base
  panels.push({
    id: 'sleeve-bottom',
    name: 'Sleeve Bottom Base',
    polygon: [
      { x: slX3, y: startY },
      { x: slX4, y: startY },
      { x: slX4, y: startY + l },
      { x: slX3, y: startY + l },
    ],
    bounds: { x: slX3, y: startY, width: w, height: l },
    center: { x: slX3 + w / 2, y: startY + l / 2 },
    isBase: true,
  });

  // 5. Sleeve Glue Tab
  panels.push({
    id: 'sleeve-glue-tab',
    name: 'Sleeve Glue Tab',
    polygon: [
      { x: slX4, y: startY + 6 * scale },
      { x: slX5, y: startY + 12 * scale },
      { x: slX5, y: startY + l - 12 * scale },
      { x: slX4, y: startY + l - 6 * scale },
    ],
    bounds: { x: slX4, y: startY, width: glueTabW, height: l },
    center: { x: slX4 + glueTabW / 2, y: startY + l / 2 },
    isFlap: true,
  });

  // --- Sleeve Creases ---
  addLine(slX1, startY, slX1, startY + l, 'crease');
  addLine(slX2, startY, slX2, startY + l, 'crease');
  addLine(slX3, startY, slX3, startY + l, 'crease');
  addLine(slX4, startY, slX4, startY + l, 'crease');

  // --- Sleeve Cuts ---
  addLine(slX0, startY, slX4, startY, 'cut');
  addLine(slX0, startY + l, slX4, startY + l, 'cut');
  addLine(slX0, startY, slX0, startY + l, 'cut');

  // Glue tab cuts
  addLine(slX4, startY, slX5, startY + 12 * scale, 'cut');
  addLine(slX5, startY + 12 * scale, slX5, startY + l - 12 * scale, 'cut');
  addLine(slX5, startY + l - 12 * scale, slX4, startY + l, 'cut');

  // Window Cutout on Sleeve Top
  const winPadX = w * 0.15;
  const winPadY = l * 0.18;
  const winW = w - 2 * winPadX;
  const winH = l - 2 * winPadY;
  addLine(slX1 + winPadX, startY + winPadY, slX1 + winPadX + winW, startY + winPadY, 'crease');
  addLine(slX1 + winPadX + winW, startY + winPadY, slX1 + winPadX + winW, startY + winPadY + winH, 'crease');
  addLine(slX1 + winPadX + winW, startY + winPadY + winH, slX1 + winPadX, startY + winPadY + winH, 'crease');
  addLine(slX1 + winPadX, startY + winPadY + winH, slX1 + winPadX, startY + winPadY, 'crease');

  // ==========================================
  // PART 2: INNER TRAY NET
  // Placed below the sleeve net with a neat vertical gap
  // Center is Tray Base (w x l) surrounded by 4 walls of depth 'd'
  // ==========================================
  const trayStartY = startY + l + gap + d;
  const trayBaseX = startX + d;
  const trayBaseY = trayStartY;

  // 6. Tray Base
  panels.push({
    id: 'tray-base',
    name: 'Inner Tray Base',
    polygon: [
      { x: trayBaseX, y: trayBaseY },
      { x: trayBaseX + w, y: trayBaseY },
      { x: trayBaseX + w, y: trayBaseY + l },
      { x: trayBaseX, y: trayBaseY + l },
    ],
    bounds: { x: trayBaseX, y: trayBaseY, width: w, height: l },
    center: { x: trayBaseX + w / 2, y: trayBaseY + l / 2 },
    isBase: true,
  });

  // 7. Tray Top Wall
  panels.push({
    id: 'tray-top-wall',
    name: 'Tray Top Wall',
    polygon: [
      { x: trayBaseX, y: trayBaseY - d },
      { x: trayBaseX + w, y: trayBaseY - d },
      { x: trayBaseX + w, y: trayBaseY },
      { x: trayBaseX, y: trayBaseY },
    ],
    bounds: { x: trayBaseX, y: trayBaseY - d, width: w, height: d },
    center: { x: trayBaseX + w / 2, y: trayBaseY - d / 2 },
  });

  // 8. Tray Bottom Wall
  panels.push({
    id: 'tray-bottom-wall',
    name: 'Tray Bottom Wall',
    polygon: [
      { x: trayBaseX, y: trayBaseY + l },
      { x: trayBaseX + w, y: trayBaseY + l },
      { x: trayBaseX + w, y: trayBaseY + l + d },
      { x: trayBaseX, y: trayBaseY + l + d },
    ],
    bounds: { x: trayBaseX, y: trayBaseY + l, width: w, height: d },
    center: { x: trayBaseX + w / 2, y: trayBaseY + l + d / 2 },
  });

  // 9. Tray Left Wall
  panels.push({
    id: 'tray-left-wall',
    name: 'Tray Left Wall',
    polygon: [
      { x: trayBaseX - d, y: trayBaseY },
      { x: trayBaseX, y: trayBaseY },
      { x: trayBaseX, y: trayBaseY + l },
      { x: trayBaseX - d, y: trayBaseY + l },
    ],
    bounds: { x: trayBaseX - d, y: trayBaseY, width: d, height: l },
    center: { x: trayBaseX - d / 2, y: trayBaseY + l / 2 },
  });

  // 10. Tray Right Wall
  panels.push({
    id: 'tray-right-wall',
    name: 'Tray Right Wall',
    polygon: [
      { x: trayBaseX + w, y: trayBaseY },
      { x: trayBaseX + w + d, y: trayBaseY },
      { x: trayBaseX + w + d, y: trayBaseY + l },
      { x: trayBaseX + w, y: trayBaseY + l },
    ],
    bounds: { x: trayBaseX + w, y: trayBaseY, width: d, height: l },
    center: { x: trayBaseX + w + d / 2, y: trayBaseY + l / 2 },
  });

  // --- Tray Creases ---
  addLine(trayBaseX, trayBaseY, trayBaseX + w, trayBaseY, 'crease');
  addLine(trayBaseX, trayBaseY + l, trayBaseX + w, trayBaseY + l, 'crease');
  addLine(trayBaseX, trayBaseY, trayBaseX, trayBaseY + l, 'crease');
  addLine(trayBaseX + w, trayBaseY, trayBaseX + w, trayBaseY + l, 'crease');

  // Corner flap crease lines
  addLine(trayBaseX, trayBaseY, trayBaseX - d, trayBaseY, 'crease');
  addLine(trayBaseX, trayBaseY + l, trayBaseX - d, trayBaseY + l, 'crease');
  addLine(trayBaseX + w, trayBaseY, trayBaseX + w + d, trayBaseY, 'crease');
  addLine(trayBaseX + w, trayBaseY + l, trayBaseX + w + d, trayBaseY + l, 'crease');

  // --- Tray Cuts ---
  // Outer perimeter cuts for the cross-shaped tray net
  addLine(trayBaseX, trayBaseY - d, trayBaseX + w, trayBaseY - d, 'cut');
  addLine(trayBaseX + w, trayBaseY - d, trayBaseX + w, trayBaseY, 'cut');
  addLine(trayBaseX + w + d, trayBaseY, trayBaseX + w + d, trayBaseY + l, 'cut');
  addLine(trayBaseX + w, trayBaseY + l, trayBaseX + w, trayBaseY + l + d, 'cut');
  addLine(trayBaseX + w, trayBaseY + l + d, trayBaseX, trayBaseY + l + d, 'cut');
  addLine(trayBaseX, trayBaseY + l + d, trayBaseX, trayBaseY + l, 'cut');
  addLine(trayBaseX - d, trayBaseY + l, trayBaseX - d, trayBaseY, 'cut');
  addLine(trayBaseX - d, trayBaseY, trayBaseX, trayBaseY, 'cut');

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
    templateId: 'dessert-sleeve-box',
    templateName: 'Dessert Window Sleeve Box',
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
