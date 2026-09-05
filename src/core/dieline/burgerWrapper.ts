import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Burger & Food Wrapper Sheet.
 * Greaseproof food packaging paper sheet with central burger/sandwich branding target,
 * 4 wrapping fold zones, diagonal corner folding guide lines, and perimeter margins.
 */
export function generateBurgerWrapperDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;                 // Total sheet width
  const l = L * scale;                 // Total sheet height
  const targetW = Math.min(D * scale, w * 0.55); // Central burger target diameter/size
  const targetH = Math.min(D * scale, l * 0.55);

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `bw-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = 40;
  const startY = 40;

  // Center target coordinates
  const cx = startX + w / 2;
  const cy = startY + l / 2;

  const targetX1 = cx - targetW / 2;
  const targetX2 = cx + targetW / 2;
  const targetY1 = cy - targetH / 2;
  const targetY2 = cy + targetH / 2;

  // 1. Center Burger Target Panel (Main product resting zone)
  panels.push({
    id: 'wrapper-center',
    name: 'Center Burger Target',
    polygon: [
      { x: targetX1, y: targetY1 },
      { x: targetX2, y: targetY1 },
      { x: targetX2, y: targetY2 },
      { x: targetX1, y: targetY2 },
    ],
    bounds: { x: targetX1, y: targetY1, width: targetW, height: targetH },
    center: { x: cx, y: cy },
    isBase: true,
  });

  // 2. Top Wrap Zone
  panels.push({
    id: 'wrapper-top',
    name: 'Top Wrap Fold',
    polygon: [
      { x: targetX1, y: startY },
      { x: targetX2, y: startY },
      { x: targetX2, y: targetY1 },
      { x: targetX1, y: targetY1 },
    ],
    bounds: { x: targetX1, y: startY, width: targetW, height: targetY1 - startY },
    center: { x: cx, y: (startY + targetY1) / 2 },
    isFlap: true,
  });

  // 3. Bottom Wrap Zone
  panels.push({
    id: 'wrapper-bottom',
    name: 'Bottom Wrap Fold',
    polygon: [
      { x: targetX1, y: targetY2 },
      { x: targetX2, y: targetY2 },
      { x: targetX2, y: startY + l },
      { x: targetX1, y: startY + l },
    ],
    bounds: { x: targetX1, y: targetY2, width: targetW, height: startY + l - targetY2 },
    center: { x: cx, y: (targetY2 + startY + l) / 2 },
    isFlap: true,
  });

  // 4. Left Wrap Zone
  panels.push({
    id: 'wrapper-left',
    name: 'Left Wrap Wing',
    polygon: [
      { x: startX, y: targetY1 },
      { x: targetX1, y: targetY1 },
      { x: targetX1, y: targetY2 },
      { x: startX, y: targetY2 },
    ],
    bounds: { x: startX, y: targetY1, width: targetX1 - startX, height: targetH },
    center: { x: (startX + targetX1) / 2, y: cy },
    isFlap: true,
  });

  // 5. Right Wrap Zone
  panels.push({
    id: 'wrapper-right',
    name: 'Right Wrap Wing',
    polygon: [
      { x: targetX2, y: targetY1 },
      { x: startX + w, y: targetY1 },
      { x: startX + w, y: targetY2 },
      { x: targetX2, y: targetY2 },
    ],
    bounds: { x: targetX2, y: targetY1, width: startX + w - targetX2, height: targetH },
    center: { x: (targetX2 + startX + w) / 2, y: cy },
    isFlap: true,
  });

  // --- CREASE LINES (Fold guides - Green dashed) ---
  // Central target perimeter crease guides
  addLine(targetX1, targetY1, targetX2, targetY1, 'crease');
  addLine(targetX2, targetY1, targetX2, targetY2, 'crease');
  addLine(targetX2, targetY2, targetX1, targetY2, 'crease');
  addLine(targetX1, targetY2, targetX1, targetY1, 'crease');

  // Diagonal corner folding guides (pointing to center)
  addLine(startX, startY, targetX1, targetY1, 'crease');
  addLine(startX + w, startY, targetX2, targetY1, 'crease');
  addLine(startX + w, startY + l, targetX2, targetY2, 'crease');
  addLine(startX, startY + l, targetX1, targetY2, 'crease');

  // --- CUT LINES (Perimeter - Red solid) ---
  // Outer paper sheet boundary
  addLine(startX, startY, startX + w, startY, 'cut');
  addLine(startX + w, startY, startX + w, startY + l, 'cut');
  addLine(startX + w, startY + l, startX, startY + l, 'cut');
  addLine(startX, startY + l, startX, startY, 'cut');

  // Margin safety lines (Bleed / margin dotted guide)
  const margin = 10 * scale;
  addLine(startX + margin, startY + margin, startX + w - margin, startY + margin, 'bleed');
  addLine(startX + w - margin, startY + margin, startX + w - margin, startY + l - margin, 'bleed');
  addLine(startX + w - margin, startY + l - margin, startX + margin, startY + l - margin, 'bleed');
  addLine(startX + margin, startY + l - margin, startX + margin, startY + margin, 'bleed');

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
    templateId: 'burger-wrapper',
    templateName: 'Burger & Food Wrapper Sheet',
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
