import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Round Food Tub / Ice Cream Cup with Lid.
 * Features an unwrapped conical body sector, bottom circular base disc,
 * lid top circular disc, and outer rim skirt.
 */
export function generateRoundFoodTubDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const topDiam = W * scale;        // Top cup diameter
  const botDiam = L * scale;        // Bottom cup diameter
  const h = D * scale;              // Vertical cup height

  const r1 = topDiam / 2;
  const r2 = botDiam / 2;

  // Slant height of the truncated cone
  const deltaR = Math.max(r1 - r2, 1);
  const slantH = Math.sqrt(deltaR * deltaR + h * h);

  // Outer apex radius R1 and inner apex radius R2
  const R1 = (r1 * slantH) / deltaR;
  const R2 = R1 - slantH;

  // Developed sector angle in radians
  const theta = Math.min((2 * Math.PI * r1) / R1, 1.8 * Math.PI);

  const glueTabW = 12 * scale;

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `tub-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  // Apex center coordinates
  const apexX = 40 + R1 * 0.85;
  const apexY = 40 + R1;

  // Center angle of the sector aligned pointing downwards
  const startAngle = Math.PI / 2 - theta / 2;
  const endAngle = Math.PI / 2 + theta / 2;
  const numSteps = 24;

  const outerArcPts: Point[] = [];
  const innerArcPts: Point[] = [];

  for (let i = 0; i <= numSteps; i++) {
    const a = startAngle + (i / numSteps) * theta;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);

    outerArcPts.push({
      x: Math.round((apexX + R1 * cosA) * 100) / 100,
      y: Math.round((apexY - R1 * sinA) * 100) / 100,
    });

    innerArcPts.push({
      x: Math.round((apexX + R2 * cosA) * 100) / 100,
      y: Math.round((apexY - R2 * sinA) * 100) / 100,
    });
  }

  // 1. Tub Body Panel (Unwrapped Conical Wall)
  const bodyPolygon: Point[] = [
    ...outerArcPts,
    ...[...innerArcPts].reverse(),
  ];

  const bodyMinX = Math.min(...bodyPolygon.map(p => p.x));
  const bodyMaxX = Math.max(...bodyPolygon.map(p => p.x));
  const bodyMinY = Math.min(...bodyPolygon.map(p => p.y));
  const bodyMaxY = Math.max(...bodyPolygon.map(p => p.y));

  panels.push({
    id: 'tub-body',
    name: 'Tub Body (Curved Wall)',
    polygon: bodyPolygon,
    bounds: {
      x: bodyMinX,
      y: bodyMinY,
      width: bodyMaxX - bodyMinX,
      height: bodyMaxY - bodyMinY,
    },
    center: {
      x: (bodyMinX + bodyMaxX) / 2,
      y: (bodyMinY + bodyMaxY) / 2,
    },
  });

  // 2. Side Seam Overlap Tab
  const seamPt1 = outerArcPts[outerArcPts.length - 1];
  const seamPt2 = innerArcPts[innerArcPts.length - 1];
  const seamAngle = endAngle;
  const normX = -Math.sin(seamAngle) * glueTabW;
  const normY = -Math.cos(seamAngle) * glueTabW;

  panels.push({
    id: 'tub-glue-seam',
    name: 'Side Seam Overlap',
    polygon: [
      seamPt2,
      seamPt1,
      { x: seamPt1.x + normX, y: seamPt1.y + normY },
      { x: seamPt2.x + normX, y: seamPt2.y + normY },
    ],
    bounds: {
      x: Math.min(seamPt1.x, seamPt2.x) - glueTabW,
      y: Math.min(seamPt1.y, seamPt2.y),
      width: glueTabW * 1.5,
      height: slantH,
    },
    center: {
      x: (seamPt1.x + seamPt2.x) / 2 + normX / 2,
      y: (seamPt1.y + seamPt2.y) / 2 + normY / 2,
    },
    isFlap: true,
  });

  // --- DRAW TUB BODY LINES ---
  // Top outer arc (cut)
  for (let i = 0; i < outerArcPts.length - 1; i++) {
    addLine(outerArcPts[i].x, outerArcPts[i].y, outerArcPts[i + 1].x, outerArcPts[i + 1].y, 'cut');
  }

  // Bottom inner arc (crease to curl tab)
  for (let i = 0; i < innerArcPts.length - 1; i++) {
    addLine(innerArcPts[i].x, innerArcPts[i].y, innerArcPts[i + 1].x, innerArcPts[i + 1].y, 'crease');
  }

  // Left straight radial edge (cut)
  addLine(outerArcPts[0].x, outerArcPts[0].y, innerArcPts[0].x, innerArcPts[0].y, 'cut');

  // Right straight radial edge (crease to glue seam)
  addLine(seamPt1.x, seamPt1.y, seamPt2.x, seamPt2.y, 'crease');

  // Glue seam outer cut
  addLine(seamPt1.x, seamPt1.y, seamPt1.x + normX, seamPt1.y + normY, 'cut');
  addLine(seamPt1.x + normX, seamPt1.y + normY, seamPt2.x + normX, seamPt2.y + normY, 'cut');
  addLine(seamPt2.x + normX, seamPt2.y + normY, seamPt2.x, seamPt2.y, 'cut');

  // ==========================================
  // PART 2: BOTTOM BASE DISC & LID DISC
  // Displayed cleanly to the right of the unwrapped body
  // ==========================================
  const discsX = bodyMaxX + 45 * scale;
  const bottomDiscY = bodyMinY + r2 + 20 * scale;

  // Helper to generate circular polygon points
  const generateCirclePoints = (cx: number, cy: number, radius: number, steps = 24): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * 2 * Math.PI;
      pts.push({
        x: Math.round((cx + radius * Math.cos(a)) * 100) / 100,
        y: Math.round((cy + radius * Math.sin(a)) * 100) / 100,
      });
    }
    return pts;
  };

  const addCircleLines = (cx: number, cy: number, radius: number, type: 'cut' | 'crease') => {
    const pts = generateCirclePoints(cx, cy, radius, 24);
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      addLine(pts[i].x, pts[i].y, next.x, next.y, type);
    }
  };

  // 3. Bottom Base Disc
  const bottomCirclePts = generateCirclePoints(discsX + r2, bottomDiscY, r2);
  panels.push({
    id: 'tub-bottom-disc',
    name: 'Bottom Base Disc',
    polygon: bottomCirclePts,
    bounds: { x: discsX, y: bottomDiscY - r2, width: botDiam, height: botDiam },
    center: { x: discsX + r2, y: bottomDiscY },
    isBase: true,
  });
  addCircleLines(discsX + r2, bottomDiscY, r2, 'cut');

  // 4. Lid Top Face Disc (Positioned below bottom disc)
  const lidRadius = r1 + 3 * scale;
  const lidDiam = lidRadius * 2;
  const lidY = bottomDiscY + r2 + lidRadius + 30 * scale;
  const lidCirclePts = generateCirclePoints(discsX + lidRadius, lidY, lidRadius);

  panels.push({
    id: 'tub-lid-top',
    name: 'Lid Top Face Disc',
    polygon: lidCirclePts,
    bounds: { x: discsX, y: lidY - lidRadius, width: lidDiam, height: lidDiam },
    center: { x: discsX + lidRadius, y: lidY },
    isLid: true,
  });
  addCircleLines(discsX + lidRadius, lidY, lidRadius, 'cut');

  // 5. Lid Rim Outer Skirt Band (Positioned below the lid)
  const skirtH = 16 * scale;
  const skirtW = Math.min(2 * Math.PI * lidRadius, 400 * scale);
  const skirtY = lidY + lidRadius + 25 * scale;

  panels.push({
    id: 'tub-lid-skirt',
    name: 'Lid Outer Rim Skirt',
    polygon: [
      { x: discsX, y: skirtY },
      { x: discsX + skirtW, y: skirtY },
      { x: discsX + skirtW, y: skirtY + skirtH },
      { x: discsX, y: skirtY + skirtH },
    ],
    bounds: { x: discsX, y: skirtY, width: skirtW, height: skirtH },
    center: { x: discsX + skirtW / 2, y: skirtY + skirtH / 2 },
    isFlap: true,
  });

  // Skirt cuts
  addLine(discsX, skirtY, discsX + skirtW, skirtY, 'cut');
  addLine(discsX + skirtW, skirtY, discsX + skirtW, skirtY + skirtH, 'cut');
  addLine(discsX + skirtW, skirtY + skirtH, discsX, skirtY + skirtH, 'cut');
  addLine(discsX, skirtY + skirtH, discsX, skirtY, 'cut');

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
    templateId: 'round-food-tub',
    templateName: 'Round Food Tub with Lid',
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
