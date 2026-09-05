import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Sandwich Wedge Box.
 * Iconic triangular carton used for cut sandwiches, with triangular sidewalls,
 * rear spine, bottom base, and a front slanted window face with closure flaps.
 */
export function generateSandwichWedgeBoxDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;          // Sandwich thickness / carton width
  const l = L * scale;          // Base length (horizontal leg)
  const h = D * scale;          // Vertical spine height

  // Hypotenuse length of the front slanted face
  const hyp = Math.sqrt(l * l + h * h);

  const flapH = Math.min(25 * scale, l * 0.35);
  const dustFlapW = Math.min(18 * scale, w * 0.3);

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `sw-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = l + dustFlapW + 40;
  const startY = flapH + 40;

  // 1. Back Spine Panel (Vertical wall)
  const backY = startY;
  panels.push({
    id: 'sandwich-back',
    name: 'Back Wall Spine',
    polygon: [
      { x: startX, y: backY },
      { x: startX + w, y: backY },
      { x: startX + w, y: backY + h },
      { x: startX, y: backY + h },
    ],
    bounds: { x: startX, y: backY, width: w, height: h },
    center: { x: startX + w / 2, y: backY + h / 2 },
  });

  // 2. Bottom Base Panel
  const baseY = backY + h;
  panels.push({
    id: 'sandwich-base',
    name: 'Bottom Base',
    polygon: [
      { x: startX, y: baseY },
      { x: startX + w, y: baseY },
      { x: startX + w, y: baseY + l },
      { x: startX, y: baseY + l },
    ],
    bounds: { x: startX, y: baseY, width: w, height: l },
    center: { x: startX + w / 2, y: baseY + l / 2 },
    isBase: true,
  });

  // 3. Front Slanted Window Face (Hypotenuse)
  const frontY = baseY + l;
  panels.push({
    id: 'sandwich-front',
    name: 'Front Slanted Face (Window)',
    polygon: [
      { x: startX, y: frontY },
      { x: startX + w, y: frontY },
      { x: startX + w, y: frontY + hyp },
      { x: startX, y: frontY + hyp },
    ],
    bounds: { x: startX, y: frontY, width: w, height: hyp },
    center: { x: startX + w / 2, y: frontY + hyp / 2 },
    isLid: true,
  });

  // 4. Left Triangular Sidewall
  // Right triangle attached to left side of base (startX, baseY)
  panels.push({
    id: 'sandwich-left-side',
    name: 'Left Triangular Side',
    polygon: [
      { x: startX, y: baseY },
      { x: startX, y: baseY + l },
      { x: startX - h, y: baseY + l },
    ],
    bounds: { x: startX - h, y: baseY, width: h, height: l },
    center: { x: startX - h / 3, y: baseY + (2 * l) / 3 },
  });

  // 5. Right Triangular Sidewall
  // Right triangle attached to right side of base (startX + w, baseY)
  panels.push({
    id: 'sandwich-right-side',
    name: 'Right Triangular Side',
    polygon: [
      { x: startX + w, y: baseY },
      { x: startX + w + h, y: baseY + l },
      { x: startX + w, y: baseY + l },
    ],
    bounds: { x: startX + w, y: baseY, width: h, height: l },
    center: { x: startX + w + h / 3, y: baseY + (2 * l) / 3 },
  });

  // 6. Top Closure Tuck Flap
  const flapY = frontY + hyp;
  panels.push({
    id: 'sandwich-tuck-flap',
    name: 'Top Closure Flap',
    polygon: [
      { x: startX, y: flapY },
      { x: startX + w, y: flapY },
      { x: startX + w - 8 * scale, y: flapY + flapH },
      { x: startX + 8 * scale, y: flapY + flapH },
    ],
    bounds: { x: startX, y: flapY, width: w, height: flapH },
    center: { x: startX + w / 2, y: flapY + flapH / 2 },
    isFlap: true,
  });

  // --- CREASE LINES (Fold lines - Green Dashed) ---
  // Crease between Back Spine and Base
  addLine(startX, baseY, startX + w, baseY, 'crease');
  // Crease between Base and Front Slanted Face
  addLine(startX, frontY, startX + w, frontY, 'crease');
  // Crease between Base and Left Triangle
  addLine(startX, baseY, startX, baseY + l, 'crease');
  // Crease between Base and Right Triangle
  addLine(startX + w, baseY, startX + w, baseY + l, 'crease');
  // Crease between Front Face and Tuck Flap
  addLine(startX, flapY, startX + w, flapY, 'crease');

  // Side dust flap creases on triangles
  addLine(startX, baseY, startX - h, baseY + l, 'crease');
  addLine(startX + w, baseY, startX + w + h, baseY + l, 'crease');

  // --- CUT LINES (Perimeter - Red Solid) ---
  // Back Wall Top & Sides
  addLine(startX, backY, startX + w, backY, 'cut');
  addLine(startX, backY, startX, baseY, 'cut');
  addLine(startX + w, backY, startX + w, baseY, 'cut');

  // Left Triangle Bottom cut
  addLine(startX, baseY + l, startX - h, baseY + l, 'cut');
  // Left dust flap outer cuts
  addLine(startX, baseY, startX - dustFlapW, baseY + 10 * scale, 'cut');
  addLine(startX - dustFlapW, baseY + 10 * scale, startX - h - dustFlapW * 0.5, baseY + l - 10 * scale, 'cut');
  addLine(startX - h - dustFlapW * 0.5, baseY + l - 10 * scale, startX - h, baseY + l, 'cut');

  // Right Triangle Bottom cut
  addLine(startX + w, baseY + l, startX + w + h, baseY + l, 'cut');
  // Right dust flap outer cuts
  addLine(startX + w, baseY, startX + w + dustFlapW, baseY + 10 * scale, 'cut');
  addLine(startX + w + dustFlapW, baseY + 10 * scale, startX + w + h + dustFlapW * 0.5, baseY + l - 10 * scale, 'cut');
  addLine(startX + w + h + dustFlapW * 0.5, baseY + l - 10 * scale, startX + w + h, baseY + l, 'cut');

  // Front Slanted Face Sides
  addLine(startX, frontY, startX, flapY, 'cut');
  addLine(startX + w, frontY, startX + w, flapY, 'cut');

  // Closure Tuck Flap Perimeter Cut
  addLine(startX, flapY, startX + 8 * scale, flapY + flapH, 'cut');
  addLine(startX + 8 * scale, flapY + flapH, startX + w - 8 * scale, flapY + flapH, 'cut');
  addLine(startX + w - 8 * scale, flapY + flapH, startX + w, flapY, 'cut');

  // Optional Sandwich Clear Window Cutout Indicator (Crease / Guide)
  const winMarginX = w * 0.18;
  const winMarginY = hyp * 0.15;
  const winW = w - 2 * winMarginX;
  const winH = hyp - 2 * winMarginY;
  addLine(startX + winMarginX, frontY + winMarginY, startX + winMarginX + winW, frontY + winMarginY, 'crease');
  addLine(startX + winMarginX + winW, frontY + winMarginY, startX + winMarginX + winW, frontY + winMarginY + winH, 'crease');
  addLine(startX + winMarginX + winW, frontY + winMarginY + winH, startX + winMarginX, frontY + winMarginY + winH, 'crease');
  addLine(startX + winMarginX, frontY + winMarginY + winH, startX + winMarginX, frontY + winMarginY, 'crease');

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
    templateId: 'sandwich-wedge-box',
    templateName: 'Sandwich Wedge Box',
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
