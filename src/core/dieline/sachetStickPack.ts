import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Single-Serve Sachet / Stick Pack.
 * Elongated flexible packaging format with central front face, back fold fins,
 * top & bottom heat seal zones, and laser/mechanical tear notch indicators.
 */
export function generateSachetStickPackDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;                 // Front width
  const l = L * scale;                 // Length/height
  const sealW = Math.max(D * scale, 12 * scale); // Top & bottom seal bar height
  const halfW = w / 2;
  const finOverlap = 10 * scale;       // Longitudinal fin seal overlap tab
  const tearNotchW = 4 * scale;

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `sp-line-${++lineCounter}`,
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
  // Back Left Fin (halfW) | Front Face (w) | Back Right Fin (halfW) | Fin Seal Tab (finOverlap)
  const x0 = startX;
  const x1 = x0 + halfW;
  const x2 = x1 + w;
  const x3 = x2 + halfW;
  const x4 = x3 + finOverlap;

  const bodyY = startY + sealW;
  const bodyH = l - 2 * sealW;

  // 1. Back Left Fin Panel
  panels.push({
    id: 'sachet-back-left',
    name: 'Back Left Fin',
    polygon: [
      { x: x0, y: bodyY },
      { x: x1, y: bodyY },
      { x: x1, y: bodyY + bodyH },
      { x: x0, y: bodyY + bodyH },
    ],
    bounds: { x: x0, y: bodyY, width: halfW, height: bodyH },
    center: { x: x0 + halfW / 2, y: bodyY + bodyH / 2 },
  });

  // 2. Front Face Panel (Main branding area)
  panels.push({
    id: 'sachet-front',
    name: 'Front Face (Main)',
    polygon: [
      { x: x1, y: bodyY },
      { x: x2, y: bodyY },
      { x: x2, y: bodyY + bodyH },
      { x: x1, y: bodyY + bodyH },
    ],
    bounds: { x: x1, y: bodyY, width: w, height: bodyH },
    center: { x: x1 + w / 2, y: bodyY + bodyH / 2 },
    isLid: true,
  });

  // 3. Back Right Fin Panel
  panels.push({
    id: 'sachet-back-right',
    name: 'Back Right Fin',
    polygon: [
      { x: x2, y: bodyY },
      { x: x3, y: bodyY },
      { x: x3, y: bodyY + bodyH },
      { x: x2, y: bodyY + bodyH },
    ],
    bounds: { x: x2, y: bodyY, width: halfW, height: bodyH },
    center: { x: x2 + halfW / 2, y: bodyY + bodyH / 2 },
  });

  // 4. Top Heat Seal Zone
  panels.push({
    id: 'sachet-top-seal',
    name: 'Top Heat Seal Zone',
    polygon: [
      { x: x1, y: startY },
      { x: x2, y: startY },
      { x: x2, y: bodyY },
      { x: x1, y: bodyY },
    ],
    bounds: { x: x1, y: startY, width: w, height: sealW },
    center: { x: x1 + w / 2, y: startY + sealW / 2 },
    isFlap: true,
  });

  // 5. Bottom Heat Seal Zone
  panels.push({
    id: 'sachet-bottom-seal',
    name: 'Bottom Heat Seal Zone',
    polygon: [
      { x: x1, y: bodyY + bodyH },
      { x: x2, y: bodyY + bodyH },
      { x: x2, y: startY + l },
      { x: x1, y: startY + l },
    ],
    bounds: { x: x1, y: bodyY + bodyH, width: w, height: sealW },
    center: { x: x1 + w / 2, y: bodyY + bodyH + sealW / 2 },
    isBase: true,
  });

  // --- CREASE LINES (Folds - Green dashed) ---
  // Vertical body fold lines
  addLine(x1, startY, x1, startY + l, 'crease');
  addLine(x2, startY, x2, startY + l, 'crease');
  addLine(x3, startY, x3, startY + l, 'crease');

  // Horizontal seal zone boundary creases
  addLine(x0, bodyY, x4, bodyY, 'crease');
  addLine(x0, bodyY + bodyH, x4, bodyY + bodyH, 'crease');

  // --- CUT LINES (Perimeter - Red solid) ---
  // Top outer cut
  addLine(x0, startY, x4, startY, 'cut');
  // Bottom outer cut
  addLine(x0, startY + l, x4, startY + l, 'cut');
  // Left cut
  addLine(x0, startY, x0, startY + l, 'cut');
  // Right cut (outer fin seal overlap tab)
  addLine(x4, startY, x4, startY + l, 'cut');

  // Tear Notch cutouts on top seal
  const notchY = startY + sealW * 0.5;
  addLine(x0, notchY, x0 + tearNotchW, notchY, 'cut');
  addLine(x1 - tearNotchW, notchY, x1, notchY, 'cut');
  addLine(x2, notchY, x2 + tearNotchW, notchY, 'cut');

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
    templateId: 'sachet-stick-pack',
    templateName: 'Single-Serve Stick Pack / Sachet',
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
