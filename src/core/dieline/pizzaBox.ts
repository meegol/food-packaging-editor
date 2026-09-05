import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Pizza Box (Roll-End Tuck Top / REFT).
 * Features double-wall roll-over side walls with locking tabs,
 * a rear hinge, and a full-cover lid with side and front tuck flaps.
 */
export function generatePizzaBoxDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D, thickness: t } = dimensions;

  // Scale factor (1mm = 2.5px)
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;
  const l = L * scale;
  const d = D * scale;
  const th = t * scale;

  const tuckH = d * 0.7;
  const lidSideFlapH = d * 0.55;
  const lockTabH = d * 0.4;
  const taper = d * 0.15;

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `pizza-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  // Base coordinates: Left outer wall + inner roll-over wall requires (2*d + lockTabH) margin
  const startX = 2 * d + lockTabH + 40;
  const startY = d + 40;

  // Bottom Tray
  const baseRect = { x: startX, y: startY, width: w, height: l };
  panels.push({
    id: 'pizza-base',
    name: 'Bottom Tray',
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

  // Front Base Wall
  const baseFrontRect = { x: startX, y: startY - d, width: w, height: d };
  panels.push({
    id: 'pizza-base-front',
    name: 'Front Base Wall',
    polygon: [
      { x: startX + taper, y: startY - d },
      { x: startX + w - taper, y: startY - d },
      { x: startX + w, y: startY },
      { x: startX, y: startY },
    ],
    bounds: baseFrontRect,
    center: { x: startX + w / 2, y: startY - d / 2 },
  });

  // Left Outer Wall
  const leftOuterRect = { x: startX - d, y: startY, width: d, height: l };
  panels.push({
    id: 'pizza-left-outer',
    name: 'Left Outer Wall',
    polygon: [
      { x: startX - d, y: startY },
      { x: startX, y: startY },
      { x: startX, y: startY + l },
      { x: startX - d, y: startY + l },
    ],
    bounds: leftOuterRect,
    center: { x: startX - d / 2, y: startY + l / 2 },
  });

  // Left Inner Roll-over Wall
  const leftInnerRect = { x: startX - 2 * d, y: startY + th, width: d, height: l - 2 * th };
  panels.push({
    id: 'pizza-left-inner',
    name: 'Left Inner Wall (Roll-Over)',
    polygon: [
      { x: startX - 2 * d, y: startY + th },
      { x: startX - d, y: startY + th },
      { x: startX - d, y: startY + l - th },
      { x: startX - 2 * d, y: startY + l - th },
    ],
    bounds: leftInnerRect,
    center: { x: startX - 1.5 * d, y: startY + l / 2 },
    isFlap: true,
  });

  // Right Outer Wall
  const rightOuterRect = { x: startX + w, y: startY, width: d, height: l };
  panels.push({
    id: 'pizza-right-outer',
    name: 'Right Outer Wall',
    polygon: [
      { x: startX + w, y: startY },
      { x: startX + w + d, y: startY },
      { x: startX + w + d, y: startY + l },
      { x: startX + w, y: startY + l },
    ],
    bounds: rightOuterRect,
    center: { x: startX + w + d / 2, y: startY + l / 2 },
  });

  // Right Inner Roll-over Wall
  const rightInnerRect = { x: startX + w + d, y: startY + th, width: d, height: l - 2 * th };
  panels.push({
    id: 'pizza-right-inner',
    name: 'Right Inner Wall (Roll-Over)',
    polygon: [
      { x: startX + w + d, y: startY + th },
      { x: startX + w + 2 * d, y: startY + th },
      { x: startX + w + 2 * d, y: startY + l - th },
      { x: startX + w + d, y: startY + l - th },
    ],
    bounds: rightInnerRect,
    center: { x: startX + w + 1.5 * d, y: startY + l / 2 },
    isFlap: true,
  });

  // Rear Wall (Hinge)
  const rearRect = { x: startX, y: startY + l, width: w, height: d };
  panels.push({
    id: 'pizza-rear',
    name: 'Rear Wall (Hinge)',
    polygon: [
      { x: startX, y: startY + l },
      { x: startX + w, y: startY + l },
      { x: startX + w, y: startY + l + d },
      { x: startX, y: startY + l + d },
    ],
    bounds: rearRect,
    center: { x: startX + w / 2, y: startY + l + d / 2 },
  });

  // Top Lid
  const lidY = startY + l + d;
  const lidRect = { x: startX, y: lidY, width: w, height: l };
  panels.push({
    id: 'pizza-lid',
    name: 'Top Lid',
    polygon: [
      { x: startX, y: lidY },
      { x: startX + w, y: lidY },
      { x: startX + w, y: lidY + l },
      { x: startX, y: lidY + l },
    ],
    bounds: lidRect,
    center: { x: startX + w / 2, y: lidY + l / 2 },
    isLid: true,
  });

  // 8. Lid Left Tuck Flap
  const lidLeftRect = { x: startX - lidSideFlapH, y: lidY, width: lidSideFlapH, height: l };
  panels.push({
    id: 'pizza-lid-left',
    name: 'Lid Left Tuck Flap',
    polygon: [
      { x: startX - lidSideFlapH, y: lidY + taper },
      { x: startX, y: lidY },
      { x: startX, y: lidY + l },
      { x: startX - lidSideFlapH, y: lidY + l - taper },
    ],
    bounds: lidLeftRect,
    center: { x: startX - lidSideFlapH / 2, y: lidY + l / 2 },
    isFlap: true,
  });

  // 9. Lid Right Tuck Flap
  const lidRightRect = { x: startX + w, y: lidY, width: lidSideFlapH, height: l };
  panels.push({
    id: 'pizza-lid-right',
    name: 'Lid Right Tuck Flap',
    polygon: [
      { x: startX + w, y: lidY },
      { x: startX + w + lidSideFlapH, y: lidY + taper },
      { x: startX + w + lidSideFlapH, y: lidY + l - taper },
      { x: startX + w, y: lidY + l },
    ],
    bounds: lidRightRect,
    center: { x: startX + w + lidSideFlapH / 2, y: lidY + l / 2 },
    isFlap: true,
  });

  // 10. Lid Front Tuck Flap
  const lidFrontRect = { x: startX, y: lidY + l, width: w, height: tuckH };
  panels.push({
    id: 'pizza-lid-front',
    name: 'Lid Front Closure Flap',
    polygon: [
      { x: startX, y: lidY + l },
      { x: startX + w, y: lidY + l },
      { x: startX + w - taper * 2, y: lidY + l + tuckH },
      { x: startX + taper * 2, y: lidY + l + tuckH },
    ],
    bounds: lidFrontRect,
    center: { x: startX + w / 2, y: lidY + l + tuckH / 2 },
    isFlap: true,
  });

  // --- CREASE / FOLD LINES (Green Dashed) ---
  // Base folds
  addLine(startX, startY, startX + w, startY, 'crease'); // Front fold
  addLine(startX, startY, startX, startY + l, 'crease'); // Left outer fold
  addLine(startX + w, startY, startX + w, startY + l, 'crease'); // Right outer fold
  addLine(startX, startY + l, startX + w, startY + l, 'crease'); // Rear hinge fold

  // Side Roll-over double creases
  addLine(startX - d, startY + th, startX - d, startY + l - th, 'crease'); // Left roll-over top crease
  addLine(startX + w + d, startY + th, startX + w + d, startY + l - th, 'crease'); // Right roll-over top crease

  // Lid folds
  addLine(startX, lidY, startX + w, lidY, 'crease'); // Rear to lid fold
  addLine(startX, lidY, startX, lidY + l, 'crease'); // Lid left tuck fold
  addLine(startX + w, lidY, startX + w, lidY + l, 'crease'); // Lid right tuck fold
  addLine(startX, lidY + l, startX + w, lidY + l, 'crease'); // Lid front tuck fold

  // --- CUT LINES (Red Solid) ---
  // Front flap of base tray
  addLine(startX, startY, startX + taper, startY - d, 'cut');
  addLine(startX + taper, startY - d, startX + w - taper, startY - d, 'cut');
  addLine(startX + w - taper, startY - d, startX + w, startY, 'cut');

  // Left inner wall & lock tabs
  addLine(startX - d, startY + th, startX - 2 * d, startY + th, 'cut');
  addLine(startX - 2 * d, startY + th, startX - 2 * d - lockTabH, startY + th + taper, 'cut');
  addLine(startX - 2 * d - lockTabH, startY + th + taper, startX - 2 * d - lockTabH, startY + l - th - taper, 'cut');
  addLine(startX - 2 * d - lockTabH, startY + l - th - taper, startX - 2 * d, startY + l - th, 'cut');
  addLine(startX - 2 * d, startY + l - th, startX - d, startY + l - th, 'cut');

  // Right inner wall & lock tabs
  addLine(startX + w + d, startY + th, startX + w + 2 * d, startY + th, 'cut');
  addLine(startX + w + 2 * d, startY + th, startX + w + 2 * d + lockTabH, startY + th + taper, 'cut');
  addLine(startX + w + 2 * d + lockTabH, startY + th + taper, startX + w + 2 * d + lockTabH, startY + l - th - taper, 'cut');
  addLine(startX + w + 2 * d + lockTabH, startY + l - th - taper, startX + w + 2 * d, startY + l - th, 'cut');
  addLine(startX + w + 2 * d, startY + l - th, startX + w + d, startY + l - th, 'cut');

  // Lid side flaps outer cuts
  addLine(startX, lidY, startX - lidSideFlapH, lidY + taper, 'cut');
  addLine(startX - lidSideFlapH, lidY + taper, startX - lidSideFlapH, lidY + l - taper, 'cut');
  addLine(startX - lidSideFlapH, lidY + l - taper, startX, lidY + l, 'cut');

  addLine(startX + w, lidY, startX + w + lidSideFlapH, lidY + taper, 'cut');
  addLine(startX + w + lidSideFlapH, lidY + taper, startX + w + lidSideFlapH, lidY + l - taper, 'cut');
  addLine(startX + w + lidSideFlapH, lidY + l - taper, startX + w, lidY + l, 'cut');

  // Lid front closure cut
  addLine(startX, lidY + l, startX + taper * 2, lidY + l + tuckH, 'cut');
  addLine(startX + taper * 2, lidY + l + tuckH, startX + w - taper * 2, lidY + l + tuckH, 'cut');
  addLine(startX + w - taper * 2, lidY + l + tuckH, startX + w, lidY + l, 'cut');

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
    templateId: 'pizza-box',
    templateName: 'Pizza Box (Roll-End Tuck Top)',
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
