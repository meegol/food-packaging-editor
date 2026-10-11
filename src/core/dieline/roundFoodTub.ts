import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Round Food Tub / Ice Cream Cup with Lid.
 * Pieces: unwrapped conical wall with side-seam tab, bottom disc with glue flange,
 * lid disc with glue flange, and lid skirt band with overlap tab.
 */
export function generateRoundFoodTubDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = 2.5; // 1mm = 2.5px; generateDieline() converts inch input to mm first
  const mm = (v: number) => v * scale;

  const r1 = (W * scale) / 2;                  // Top (rim) radius
  const r2 = Math.min((L * scale) / 2, r1 - mm(0.5)); // Bottom radius; a tub can't be wider at the base than the rim
  const h = D * scale;                         // Vertical wall height

  // Truncated cone development
  const deltaR = r1 - r2;
  const slantH = Math.sqrt(deltaR * deltaR + h * h);
  const R1 = (r1 * slantH) / deltaR;           // Apex to rim
  const R2 = R1 - slantH;                      // Apex to base
  const theta = (2 * Math.PI * r1) / R1;       // Always < 2π

  const glueTabW = mm(12);
  const flangeW = mm(8);
  const margin = 40;
  const gap = mm(25);

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];
  const r = (v: number) => Math.round(v * 100) / 100;

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease') => {
    lines.push({ id: `tub-line-${++lineCounter}`, x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2), type });
  };
  const addPath = (pts: Point[], type: 'cut' | 'crease', closed = false) => {
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      addLine(a.x, a.y, b.x, b.y, type);
    }
  };
  const boundsOf = (pts: Point[]) => {
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  };

  // ==========================================
  // PART 1: CONICAL WALL
  // Sector fans upward from an apex below it, so the rim arc is on top and artwork stays upright.
  // ==========================================
  const startAngle = Math.PI / 2 - theta / 2;
  const arcSteps = 48;
  const polar = (radius: number, a: number): Point => ({ x: radius * Math.cos(a), y: -radius * Math.sin(a) });

  const rawOuter: Point[] = [];
  const rawInner: Point[] = [];
  for (let i = 0; i <= arcSteps; i++) {
    const a = startAngle + (i / arcSteps) * theta;
    rawOuter.push(polar(R1, a));
    rawInner.push(polar(R2, a));
  }

  // Side-seam tab: glued under the far edge, tapered 15° at both ends.
  const endA = startAngle + theta;
  const tabDir = { x: -Math.sin(endA), y: -Math.cos(endA) }; // Outward, perpendicular to the end edge
  const radial = { x: Math.cos(endA), y: -Math.sin(endA) };
  const taper = glueTabW * Math.tan(Math.PI / 12);
  const seamOuter = rawOuter[arcSteps];
  const seamInner = rawInner[arcSteps];
  const rawTab: Point[] = [
    seamInner,
    seamOuter,
    { x: seamOuter.x + tabDir.x * glueTabW - radial.x * taper, y: seamOuter.y + tabDir.y * glueTabW - radial.y * taper },
    { x: seamInner.x + tabDir.x * glueTabW + radial.x * taper, y: seamInner.y + tabDir.y * glueTabW + radial.y * taper },
  ];

  // Translate the wall so its top-left sits at the margin
  const rawBounds = boundsOf([...rawOuter, ...rawInner, ...rawTab]);
  const dx = margin - rawBounds.x;
  const dy = margin - rawBounds.y;
  const shift = (p: Point): Point => ({ x: r(p.x + dx), y: r(p.y + dy) });
  const outerArcPts = rawOuter.map(shift);
  const innerArcPts = rawInner.map(shift);
  const tabPts = rawTab.map(shift);
  const apex = shift({ x: 0, y: 0 });

  const bodyPolygon: Point[] = [...outerArcPts, ...[...innerArcPts].reverse()];
  panels.push({
    id: 'tub-body',
    name: 'Tub Body (Curved Wall)',
    polygon: bodyPolygon,
    bounds: boundsOf(bodyPolygon),
    // Mid-band on the sector bisector, so it stays on the wall even for wide, flat tubs
    center: { x: apex.x, y: r(apex.y - (R1 + R2) / 2) },
  });

  panels.push({
    id: 'tub-glue-seam',
    name: 'Side Seam Overlap',
    polygon: tabPts,
    bounds: boundsOf(tabPts),
    center: {
      x: r(tabPts.reduce((s, p) => s + p.x, 0) / 4),
      y: r(tabPts.reduce((s, p) => s + p.y, 0) / 4),
    },
    isFlap: true,
  });

  addPath(outerArcPts, 'cut');
  addPath(innerArcPts, 'cut');
  addLine(outerArcPts[0].x, outerArcPts[0].y, innerArcPts[0].x, innerArcPts[0].y, 'cut');
  addLine(seamOuter.x + dx, seamOuter.y + dy, seamInner.x + dx, seamInner.y + dy, 'crease');
  addPath(tabPts.slice(1).concat(tabPts[0]), 'cut');

  const wallBounds = boundsOf([...bodyPolygon, ...tabPts]);

  // ==========================================
  // PART 2: DISCS & SKIRT (column to the right of the wall)
  // Each disc carries a glue flange: crease at the face edge, cut at the flange edge.
  // ==========================================
  const circleSteps = 72;
  const circle = (cx: number, cy: number, radius: number): Point[] =>
    Array.from({ length: circleSteps }, (_, i) => {
      const a = (i / circleSteps) * 2 * Math.PI;
      return { x: r(cx + radius * Math.cos(a)), y: r(cy + radius * Math.sin(a)) };
    });

  const colX = wallBounds.x + wallBounds.width + gap;

  const addDisc = (id: string, name: string, radius: number, top: number, flag: 'isBase' | 'isLid') => {
    const cx = colX + radius + flangeW;
    const cy = top + radius + flangeW;
    const face = circle(cx, cy, radius);
    panels.push({
      id,
      name,
      polygon: face,
      bounds: { x: r(cx - radius), y: r(cy - radius), width: r(radius * 2), height: r(radius * 2) },
      center: { x: r(cx), y: r(cy) },
      [flag]: true,
    });
    addPath(face, 'crease', true);
    addPath(circle(cx, cy, radius + flangeW), 'cut', true);
    return cy + radius + flangeW;
  };

  // 3. Bottom disc (flange folds down, glued inside the wall's base)
  const bottomEnd = addDisc('tub-bottom-disc', 'Bottom Base Disc', r2, margin, 'isBase');

  // 4. Lid disc (sits over the rim; flange folds down, glued inside the skirt)
  const lidRadius = r1 + mm(3);
  const lidEnd = addDisc('tub-lid-top', 'Lid Top Face Disc', lidRadius, bottomEnd + gap, 'isLid');

  // 5. Lid skirt: full lid circumference plus overlap tab
  const skirtH = mm(16);
  const skirtW = 2 * Math.PI * lidRadius;
  // Runs along the bottom of the whole sheet; it's the longest piece
  const skirtY = Math.max(lidEnd, wallBounds.y + wallBounds.height) + gap;
  const skirtX = margin;
  const overlapW = mm(10);
  const skirtPoly: Point[] = [
    { x: skirtX, y: skirtY },
    { x: r(skirtX + skirtW), y: skirtY },
    { x: r(skirtX + skirtW), y: r(skirtY + skirtH) },
    { x: skirtX, y: r(skirtY + skirtH) },
  ];
  panels.push({
    id: 'tub-lid-skirt',
    name: 'Lid Outer Rim Skirt',
    polygon: skirtPoly,
    bounds: { x: skirtX, y: skirtY, width: r(skirtW), height: skirtH },
    center: { x: r(skirtX + skirtW / 2), y: r(skirtY + skirtH / 2) },
    isFlap: true,
  });
  const ex = skirtX + skirtW;
  addLine(skirtX, skirtY, ex, skirtY, 'cut');
  addLine(ex, skirtY, ex + overlapW, skirtY + mm(2), 'cut');
  addLine(ex + overlapW, skirtY + mm(2), ex + overlapW, skirtY + skirtH - mm(2), 'cut');
  addLine(ex + overlapW, skirtY + skirtH - mm(2), ex, skirtY + skirtH, 'cut');
  addLine(ex, skirtY + skirtH, skirtX, skirtY + skirtH, 'cut');
  addLine(skirtX, skirtY + skirtH, skirtX, skirtY, 'cut');
  addLine(ex, skirtY, ex, skirtY + skirtH, 'crease');

  const xs = lines.flatMap(l => [l.x1, l.x2]);
  const ys = lines.flatMap(l => [l.y1, l.y2]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    templateId: 'round-food-tub',
    templateName: 'Round Food Tub with Lid',
    dimensions,
    lines,
    panels,
    totalBounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
  };
}
