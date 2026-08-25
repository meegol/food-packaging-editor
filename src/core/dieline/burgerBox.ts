import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Burger Clamshell Box.
 * Includes base tray, tapered side walls, corner glue/dust flaps, rear hinge,
 * and top lid with a front tuck closure.
 */
export function generateBurgerBoxDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D, thickness: t } = dimensions;

  // Conversion scale to canvas pixels (1mm = 2.5px for crisp viewport rendering)
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;
  const l = L * scale;
  const d = D * scale;
  const th = t * scale;

  // Dust flap and locking dimensions
  const flapH = d * 0.75;
  const tuckH = d * 0.55;
  const taper = d * 0.15; // 10-15 degree taper for nesting/folding

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  // Base Coordinate Anchors
  // Center is the Bottom Base panel
  const startX = flapH + d + 40;
  const startY = flapH + d + 40;

  // Bottom Base Panel
  const baseRect = { x: startX, y: startY + d, width: w, height: l };
  panels.push({
    id: 'base-bottom',
    name: 'Bottom Base',
    polygon: [
      { x: baseRect.x, y: baseRect.y },
      { x: baseRect.x + w, y: baseRect.y },
      { x: baseRect.x + w, y: baseRect.y + l },
      { x: baseRect.x, y: baseRect.y + l },
    ],
    bounds: baseRect,
    center: { x: baseRect.x + w / 2, y: baseRect.y + l / 2 },
    isBase: true,
  });

  // Base Front Wall
  const baseFrontRect = { x: startX, y: startY, width: w, height: d };
  panels.push({
    id: 'base-front',
    name: 'Base Front Wall',
    polygon: [
      { x: startX + taper, y: startY },
      { x: startX + w - taper, y: startY },
      { x: startX + w, y: startY + d },
      { x: startX, y: startY + d },
    ],
    bounds: baseFrontRect,
    center: { x: startX + w / 2, y: startY + d / 2 },
  });

  // Base Left Wall
  const baseLeftRect = { x: startX - d, y: baseRect.y, width: d, height: l };
  panels.push({
    id: 'base-left',
    name: 'Base Left Wall',
    polygon: [
      { x: startX - d, y: baseRect.y + taper },
      { x: startX, y: baseRect.y },
      { x: startX, y: baseRect.y + l },
      { x: startX - d, y: baseRect.y + l - taper },
    ],
    bounds: baseLeftRect,
    center: { x: startX - d / 2, y: baseRect.y + l / 2 },
  });

  // Base Right Wall
  const baseRightRect = { x: startX + w, y: baseRect.y, width: d, height: l };
  panels.push({
    id: 'base-right',
    name: 'Base Right Wall',
    polygon: [
      { x: startX + w, y: baseRect.y },
      { x: startX + w + d, y: baseRect.y + taper },
      { x: startX + w + d, y: baseRect.y + l - taper },
      { x: startX + w, y: baseRect.y + l },
    ],
    bounds: baseRightRect,
    center: { x: startX + w + d / 2, y: baseRect.y + l / 2 },
  });

  // Rear Hinge Wall
  const rearHingeRect = { x: startX, y: baseRect.y + l, width: w, height: d };
  panels.push({
    id: 'rear-hinge',
    name: 'Rear Hinge Wall',
    polygon: [
      { x: startX, y: baseRect.y + l },
      { x: startX + w, y: baseRect.y + l },
      { x: startX + w, y: baseRect.y + l + d },
      { x: startX, y: baseRect.y + l + d },
    ],
    bounds: rearHingeRect,
    center: { x: startX + w / 2, y: baseRect.y + l + d / 2 },
  });

  // Top Lid (adjusted for material thickness clearance)
  const lidY = baseRect.y + l + d;
  const lidRect = { x: startX - th, y: lidY, width: w + 2 * th, height: l + th };
  panels.push({
    id: 'lid-top',
    name: 'Top Lid',
    polygon: [
      { x: lidRect.x, y: lidY },
      { x: lidRect.x + lidRect.width, y: lidY },
      { x: lidRect.x + lidRect.width, y: lidY + lidRect.height },
      { x: lidRect.x, y: lidY + lidRect.height },
    ],
    bounds: lidRect,
    center: { x: lidRect.x + lidRect.width / 2, y: lidY + lidRect.height / 2 },
    isLid: true,
  });

  // Lid Flaps
  const lidLeftRect = { x: lidRect.x - flapH, y: lidY, width: flapH, height: lidRect.height };
  panels.push({
    id: 'lid-left',
    name: 'Lid Left Flap',
    polygon: [
      { x: lidRect.x - flapH, y: lidY + taper },
      { x: lidRect.x, y: lidY },
      { x: lidRect.x, y: lidY + lidRect.height },
      { x: lidRect.x - flapH, y: lidY + lidRect.height - taper },
    ],
    bounds: lidLeftRect,
    center: { x: lidRect.x - flapH / 2, y: lidY + lidRect.height / 2 },
    isFlap: true,
  });

  const lidRightRect = { x: lidRect.x + lidRect.width, y: lidY, width: flapH, height: lidRect.height };
  panels.push({
    id: 'lid-right',
    name: 'Lid Right Flap',
    polygon: [
      { x: lidRect.x + lidRect.width, y: lidY },
      { x: lidRect.x + lidRect.width + flapH, y: lidY + taper },
      { x: lidRect.x + lidRect.width + flapH, y: lidY + lidRect.height - taper },
      { x: lidRect.x + lidRect.width, y: lidY + lidRect.height },
    ],
    bounds: lidRightRect,
    center: { x: lidRect.x + lidRect.width + flapH / 2, y: lidY + lidRect.height / 2 },
    isFlap: true,
  });

  // Front closure tuck
  const lidFrontRect = { x: lidRect.x, y: lidY + lidRect.height, width: lidRect.width, height: tuckH };
  panels.push({
    id: 'lid-front',
    name: 'Lid Front Closure Flap',
    polygon: [
      { x: lidRect.x, y: lidY + lidRect.height },
      { x: lidRect.x + lidRect.width, y: lidY + lidRect.height },
      { x: lidRect.x + lidRect.width - taper * 1.5, y: lidY + lidRect.height + tuckH },
      { x: lidRect.x + taper * 1.5, y: lidY + lidRect.height + tuckH },
    ],
    bounds: lidFrontRect,
    center: { x: lidRect.x + lidRect.width / 2, y: lidY + lidRect.height + tuckH / 2 },
    isFlap: true,
  });

  // --- CREASE / FOLD LINES (Green Dashed) ---
  // Base folds
  addLine(startX, startY + d, startX + w, startY + d, 'crease'); // Base Front fold
  addLine(startX, startY + d, startX, startY + d + l, 'crease'); // Base Left fold
  addLine(startX + w, startY + d, startX + w, startY + d + l, 'crease'); // Base Right fold
  addLine(startX, startY + d + l, startX + w, startY + d + l, 'crease'); // Base Rear fold

  // Hinge & Lid folds
  addLine(startX, lidY, startX + w, lidY, 'crease'); // Rear to Lid fold
  addLine(lidRect.x, lidY, lidRect.x, lidY + lidRect.height, 'crease'); // Lid Left flap fold
  addLine(lidRect.x + lidRect.width, lidY, lidRect.x + lidRect.width, lidY + lidRect.height, 'crease'); // Lid Right flap fold
  addLine(lidRect.x, lidY + lidRect.height, lidRect.x + lidRect.width, lidY + lidRect.height, 'crease'); // Lid Front tuck fold

  // Base Corner Dust Flap Creases
  addLine(startX, startY + d, startX - flapH * 0.7, startY + d - flapH * 0.7, 'crease');
  addLine(startX + w, startY + d, startX + w + flapH * 0.7, startY + d - flapH * 0.7, 'crease');
  addLine(startX, startY + d + l, startX - flapH * 0.7, startY + d + l + flapH * 0.7, 'crease');
  addLine(startX + w, startY + d + l, startX + w + flapH * 0.7, startY + d + l + flapH * 0.7, 'crease');

  // --- CUT LINES (Red Solid Outer Die Path) ---
  // Base Front Wall Outer Cut
  addLine(startX, startY + d, startX + taper, startY, 'cut');
  addLine(startX + taper, startY, startX + w - taper, startY, 'cut');
  addLine(startX + w - taper, startY, startX + w, startY + d, 'cut');

  // Base Left Wall Outer Cut
  addLine(startX, startY + d, startX - d, startY + d + taper, 'cut');
  addLine(startX - d, startY + d + taper, startX - d, startY + d + l - taper, 'cut');
  addLine(startX - d, startY + d + l - taper, startX, startY + d + l, 'cut');

  // Base Right Wall Outer Cut
  addLine(startX + w, startY + d, startX + w + d, startY + d + taper, 'cut');
  addLine(startX + w + d, startY + d + taper, startX + w + d, startY + d + l - taper, 'cut');
  addLine(startX + w + d, startY + d + l - taper, startX + w, startY + d + l, 'cut');

  // Lid Left Flap Outer Cut
  addLine(lidRect.x, lidY, lidRect.x - flapH, lidY + taper, 'cut');
  addLine(lidRect.x - flapH, lidY + taper, lidRect.x - flapH, lidY + lidRect.height - taper, 'cut');
  addLine(lidRect.x - flapH, lidY + lidRect.height - taper, lidRect.x, lidY + lidRect.height, 'cut');

  // Lid Right Flap Outer Cut
  addLine(lidRect.x + lidRect.width, lidY, lidRect.x + lidRect.width + flapH, lidY + taper, 'cut');
  addLine(lidRect.x + lidRect.width + flapH, lidY + taper, lidRect.x + lidRect.width + flapH, lidY + lidRect.height - taper, 'cut');
  addLine(lidRect.x + lidRect.width + flapH, lidY + lidRect.height - taper, lidRect.x + lidRect.width, lidY + lidRect.height, 'cut');

  // Lid Front Flap Outer Cut with locking tongue
  const tongueW = w * 0.3;
  const tongueH = tuckH * 0.4;
  const tX1 = lidRect.x + (lidRect.width - tongueW) / 2;
  const tX2 = tX1 + tongueW;

  addLine(lidRect.x, lidY + lidRect.height, lidRect.x + taper * 1.5, lidY + lidRect.height + tuckH, 'cut');
  addLine(lidRect.x + taper * 1.5, lidY + lidRect.height + tuckH, tX1, lidY + lidRect.height + tuckH, 'cut');
  addLine(tX1, lidY + lidRect.height + tuckH, tX1, lidY + lidRect.height + tuckH + tongueH, 'cut');
  addLine(tX1, lidY + lidRect.height + tuckH + tongueH, tX2, lidY + lidRect.height + tuckH + tongueH, 'cut');
  addLine(tX2, lidY + lidRect.height + tuckH + tongueH, tX2, lidY + lidRect.height + tuckH, 'cut');
  addLine(tX2, lidY + lidRect.height + tuckH, lidRect.x + lidRect.width - taper * 1.5, lidY + lidRect.height + tuckH, 'cut');
  addLine(lidRect.x + lidRect.width - taper * 1.5, lidY + lidRect.height + tuckH, lidRect.x + lidRect.width, lidY + lidRect.height, 'cut');

  // Calculate overall net bounds
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
    templateId: 'burger-box',
    templateName: 'Burger Clamshell Box',
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
