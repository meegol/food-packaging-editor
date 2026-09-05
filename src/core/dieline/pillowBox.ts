import { LineSegment, PackagingDimensions, PanelFace, DielineResult, Point } from './types';

/**
 * Generates the parametric dieline net for a Pillow Box.
 * Iconic curved-crease carton used for baked pies, pastries, confectionery, and snacks.
 * Features elliptical curved score lines on top and bottom ends and longitudinal glue tab.
 */
export function generatePillowBoxDieline(dimensions: PackagingDimensions): DielineResult {
  const { width: W, length: L, depth: D } = dimensions;

  // Scale: 1mm = 2.5px
  const scale = dimensions.unit === 'in' ? 2.5 * 25.4 : 2.5;

  const w = W * scale;        // Width of each pillow face
  const l = L * scale;        // Height/length between crease apexes
  const arcDepth = Math.max(D * 0.45 * scale, 15 * scale); // Sagitta of curved crease
  const flapHeight = Math.max(D * 0.65 * scale, 22 * scale); // Outward flap cut height
  const glueTabW = 14 * scale;

  const lines: LineSegment[] = [];
  const panels: PanelFace[] = [];

  let lineCounter = 0;
  const addLine = (x1: number, y1: number, x2: number, y2: number, type: 'cut' | 'crease' | 'bleed') => {
    lines.push({
      id: `pl-line-${++lineCounter}`,
      x1: Math.round(x1 * 100) / 100,
      y1: Math.round(y1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      y2: Math.round(y2 * 100) / 100,
      type,
    });
  };

  const startX = 40;
  const startY = flapHeight + 40;

  // Helper to generate points for a parabolic / elliptical arc across width 'spanW'
  // direction: +1 curves downward, -1 curves upward
  const generateArcPoints = (ox: number, oy: number, spanW: number, sagitta: number, direction: number, numSegs = 10): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i <= numSegs; i++) {
      const t = i / numSegs; // 0 to 1
      const x = ox + t * spanW;
      // Parabola: 4 * s * t * (1 - t)
      const offset = 4 * sagitta * t * (1 - t) * direction;
      const y = oy + offset;
      pts.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }
    return pts;
  };

  // Add a series of lines connecting points
  const addArcLines = (pts: Point[], type: 'cut' | 'crease') => {
    for (let i = 0; i < pts.length - 1; i++) {
      addLine(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, type);
    }
  };

  // 1. Front Face & Flaps
  const frontX = startX;
  const backX = startX + w;
  const glueX = backX + w;

  // Top crease arcs (curves downward into body: direction = +1)
  const frontTopCrease = generateArcPoints(frontX, startY, w, arcDepth, 1);
  const backTopCrease = generateArcPoints(backX, startY, w, arcDepth, 1);

  // Bottom crease arcs (curves upward into body: direction = -1)
  const frontBottomCrease = generateArcPoints(frontX, startY + l, w, arcDepth, -1);
  const backBottomCrease = generateArcPoints(backX, startY + l, w, arcDepth, -1);

  // Top cut arcs (curves upward away from body: direction = -1)
  const frontTopCut = generateArcPoints(frontX, startY, w, flapHeight, -1);
  const backTopCut = generateArcPoints(backX, startY, w, flapHeight, -1);

  // Bottom cut arcs (curves downward away from body: direction = +1)
  const frontBottomCut = generateArcPoints(frontX, startY + l, w, flapHeight, 1);
  const backBottomCut = generateArcPoints(backX, startY + l, w, flapHeight, 1);

  // --- PANELS ---
  // 1. Front Face
  panels.push({
    id: 'pillow-front',
    name: 'Front Face',
    polygon: [
      ...frontTopCrease,
      { x: frontX + w, y: startY + l },
      ...[...frontBottomCrease].reverse(),
      { x: frontX, y: startY },
    ],
    bounds: { x: frontX, y: startY, width: w, height: l },
    center: { x: frontX + w / 2, y: startY + l / 2 },
  });

  // 2. Back Face
  panels.push({
    id: 'pillow-back',
    name: 'Back Face',
    polygon: [
      ...backTopCrease,
      { x: backX + w, y: startY + l },
      ...[...backBottomCrease].reverse(),
      { x: backX, y: startY },
    ],
    bounds: { x: backX, y: startY, width: w, height: l },
    center: { x: backX + w / 2, y: startY + l / 2 },
  });

  // 3. Side Glue Tab
  panels.push({
    id: 'pillow-glue-tab',
    name: 'Side Glue Tab',
    polygon: [
      { x: glueX, y: startY + 8 * scale },
      { x: glueX + glueTabW, y: startY + 16 * scale },
      { x: glueX + glueTabW, y: startY + l - 16 * scale },
      { x: glueX, y: startY + l - 8 * scale },
    ],
    bounds: { x: glueX, y: startY, width: glueTabW, height: l },
    center: { x: glueX + glueTabW / 2, y: startY + l / 2 },
    isFlap: true,
  });

  // 4. Top Outer Curved Flap
  panels.push({
    id: 'pillow-top-outer',
    name: 'Top Outer Flap',
    polygon: [
      ...frontTopCrease,
      ...[...frontTopCut].reverse(),
    ],
    bounds: { x: frontX, y: startY - flapHeight, width: w, height: flapHeight + arcDepth },
    center: { x: frontX + w / 2, y: startY - flapHeight * 0.4 },
    isFlap: true,
  });

  // 5. Top Inner Curved Flap
  panels.push({
    id: 'pillow-top-inner',
    name: 'Top Inner Flap',
    polygon: [
      ...backTopCrease,
      ...[...backTopCut].reverse(),
    ],
    bounds: { x: backX, y: startY - flapHeight, width: w, height: flapHeight + arcDepth },
    center: { x: backX + w / 2, y: startY - flapHeight * 0.4 },
    isFlap: true,
  });

  // 6. Bottom Outer Curved Flap
  panels.push({
    id: 'pillow-bottom-outer',
    name: 'Bottom Outer Flap',
    polygon: [
      ...frontBottomCrease,
      ...[...frontBottomCut].reverse(),
    ],
    bounds: { x: frontX, y: startY + l - arcDepth, width: w, height: flapHeight + arcDepth },
    center: { x: frontX + w / 2, y: startY + l + flapHeight * 0.4 },
    isFlap: true,
  });

  // 7. Bottom Inner Curved Flap
  panels.push({
    id: 'pillow-bottom-inner',
    name: 'Bottom Inner Flap',
    polygon: [
      ...backBottomCrease,
      ...[...backBottomCut].reverse(),
    ],
    bounds: { x: backX, y: startY + l - arcDepth, width: w, height: flapHeight + arcDepth },
    center: { x: backX + w / 2, y: startY + l + flapHeight * 0.4 },
    isFlap: true,
  });

  // --- CREASE LINES (Green dashed) ---
  // Center fold between front and back
  addLine(backX, startY, backX, startY + l, 'crease');
  // Glue tab fold
  addLine(glueX, startY, glueX, startY + l, 'crease');
  // Curved crease lines
  addArcLines(frontTopCrease, 'crease');
  addArcLines(backTopCrease, 'crease');
  addArcLines(frontBottomCrease, 'crease');
  addArcLines(backBottomCrease, 'crease');

  // --- CUT LINES (Red solid) ---
  // Outer flap cuts
  addArcLines(frontTopCut, 'cut');
  addArcLines(backTopCut, 'cut');
  addArcLines(frontBottomCut, 'cut');
  addArcLines(backBottomCut, 'cut');

  // Side cuts of Front Face
  addLine(frontX, startY, frontX, startY + l, 'cut');

  // Side Glue Tab cuts
  addLine(glueX, startY, glueX + glueTabW, startY + 16 * scale, 'cut');
  addLine(glueX + glueTabW, startY + 16 * scale, glueX + glueTabW, startY + l - 16 * scale, 'cut');
  addLine(glueX + glueTabW, startY + l - 16 * scale, glueX, startY + l, 'cut');

  // Thumb notch cut on front top flap (arc cutout in center)
  const thumbRadius = 8 * scale;
  const thumbX = frontX + w / 2;
  const thumbY = startY - flapHeight * 0.85;
  addLine(thumbX - thumbRadius, thumbY, thumbX + thumbRadius, thumbY, 'crease');

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
    templateId: 'pillow-box',
    templateName: 'Pillow Packaging Box',
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
