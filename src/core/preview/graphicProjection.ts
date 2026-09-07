import { PanelFace } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { ProjectedGraphic } from './previewTypes';
import {
  Camera3D,
  Face3DDefinition,
  projectPoint3D,
  rotatePoint3D,
  Vector3,
} from './engine3d';

/**
 * 3D Euclidean distance between two 3D vectors
 */
function dist3D(a: Vector3, b: Vector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Evaluates a point on a 3D quadrilateral using bilinear interpolation of 4 corners:
 * [V0=Top-Left, V1=Top-Right, V2=Bottom-Right, V3=Bottom-Left]
 * for normalized coordinates (u, v) in [0, 1] x [0, 1].
 */
export function interpolateQuad3D(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  v3: Vector3,
  u: number,
  v: number
): Vector3 {
  const omu = 1 - u;
  const omv = 1 - v;

  const w0 = omu * omv;
  const w1 = u * omv;
  const w2 = u * v;
  const w3 = omu * v;

  return {
    x: w0 * v0.x + w1 * v1.x + w2 * v2.x + w3 * v3.x,
    y: w0 * v0.y + w1 * v1.y + w2 * v2.y + w3 * v3.y,
    z: w0 * v0.z + w1 * v1.z + w2 * v2.z + w3 * v3.z,
  };
}

/**
 * Calculates affine transform matrix string `matrix(a, b, c, d, e, f)`
 * that maps local rect [0, 0, localW, localH] to the 4-corner quad [p0, p1, p2, p3]
 * (p0=Top-Left, p1=Top-Right, p2=Bottom-Right, p3=Bottom-Left).
 * Maintained for backward compatibility.
 */
export function getQuadAffineMatrix(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  _p2: { x: number; y: number },
  p3: { x: number; y: number },
  localW: number,
  localH: number
): string {
  if (localW <= 0 || localH <= 0) return 'matrix(1,0,0,1,0,0)';

  const a = (p1.x - p0.x) / localW;
  const b = (p1.y - p0.y) / localW;
  const c = (p3.x - p0.x) / localH;
  const d = (p3.y - p0.y) / localH;
  const e = p0.x;
  const f = p0.y;

  return `matrix(${a.toFixed(5)}, ${b.toFixed(5)}, ${c.toFixed(5)}, ${d.toFixed(5)}, ${e.toFixed(2)}, ${f.toFixed(2)})`;
}

/**
 * Maps graphics belonging to a panel into normalized local coordinates for an assembled face.
 * Maintained for backward compatibility with unit tests.
 */
export function mapPanelGraphicsToFace(
  panel: PanelFace | undefined,
  graphics: GraphicItem[],
  targetLocalW: number,
  targetLocalH: number
): ProjectedGraphic[] {
  if (!panel) return [];

  const panelGraphics = graphics.filter(g => g.panelId === panel.id);
  if (panelGraphics.length === 0) return [];

  const pw = panel.bounds.width || 1;
  const ph = panel.bounds.height || 1;
  const pcx = panel.center.x;
  const pcy = panel.center.y;

  return panelGraphics.map(item => {
    const itemX = item.x ?? pcx;
    const itemY = item.y ?? pcy;
    const relNormX = (itemX - pcx) / pw;
    const relNormY = (itemY - pcy) / ph;

    const localX = (0.5 + relNormX) * targetLocalW;
    const localY = (0.5 + relNormY) * targetLocalH;

    const scaleFactor = Math.min(targetLocalW / pw, targetLocalH / ph);
    const sX = (item.scaleX ?? 1) * scaleFactor;
    const sY = (item.scaleY ?? 1) * scaleFactor;

    let itemW: number | undefined;
    let itemH: number | undefined;

    if (item.type === 'image' || item.type === 'icon') {
      const nw = item.naturalWidth || item.width || (item.type === 'image' ? 120 : 40);
      const nh = item.naturalHeight || item.height || (item.type === 'image' ? 120 : 40);
      
      const renderedW = item.scaleX !== undefined ? nw * item.scaleX : pw * (item.type === 'image' ? 0.70 : 0.35);
      const renderedH = item.scaleY !== undefined ? nh * item.scaleY : ph * (item.type === 'image' ? 0.70 : 0.35);
      
      itemW = (renderedW / pw) * targetLocalW;
      itemH = (renderedH / ph) * targetLocalH;
    }

    return {
      id: item.id,
      type: item.type,
      src: item.src,
      text: item.text,
      fontFamily: item.fontFamily ?? 'Inter, sans-serif',
      fontSize: item.fontSize ? item.fontSize * scaleFactor : 14 * scaleFactor,
      fontWeight: item.fontWeight ?? 'bold',
      fill: item.fill ?? '#ffffff',
      textAlign: item.textAlign ?? 'center',
      x: localX,
      y: localY,
      width: itemW,
      height: itemH,
      scaleX: sX,
      scaleY: sY,
      rotation: item.angle ?? 0,
      clipToFace: item.clipToPanel,
    };
  });
}

/**
 * Projects graphics belonging to a packaging panel directly into 3D object space
 * onto the 3D face plane, then projects through the camera perspective matrix.
 * 
 * Guarantees ZERO camera-rotation drift and authentic perspective foreshortening.
 */
export function projectPanelGraphicsToFace3D(
  panel: PanelFace | undefined,
  graphics: GraphicItem[],
  face3D: Face3DDefinition,
  camera: Camera3D
): ProjectedGraphic[] {
  if (!panel || !face3D || face3D.vertices.length < 3) return [];

  const panelGraphics = graphics.filter(g => g.panelId === panel.id);
  if (panelGraphics.length === 0) return [];

  const v0 = face3D.vertices[0];
  const v1 = face3D.vertices[1];
  const v2 = face3D.vertices[2];
  const v3 = face3D.vertices.length >= 4 ? face3D.vertices[3] : face3D.vertices[2];

  const w3D = Math.max(dist3D(v0, v1), 1);
  const h3D = Math.max(dist3D(v0, v3), 1);

  const pw = panel.bounds.width || 1;
  const ph = panel.bounds.height || 1;
  const pcx = panel.center.x;
  const pcy = panel.center.y;

  // Detect whether 2D panel dimensions are transposed relative to 3D face (e.g. side walls)
  const ratio3D = w3D / h3D;
  const ratio2D = pw / ph;
  const isTransposed = Math.abs(ratio3D - (1 / ratio2D)) < Math.abs(ratio3D - ratio2D) * 0.75;

  const yawRad = (camera.yawDeg * Math.PI) / 180;
  const pitchRad = (camera.pitchDeg * Math.PI) / 180;

  const rotAndProject = (p: Vector3) => {
    const r = rotatePoint3D(p, yawRad, pitchRad);
    return projectPoint3D(r, camera);
  };

  const delta = 0.005;

  return panelGraphics.map(item => {
    const itemX = item.x ?? pcx;
    const itemY = item.y ?? pcy;
    const relX = itemX - pcx;
    const relY = itemY - pcy;

    // Dimension computation on source 2D panel in physical millimeters
    let rawW: number;
    let rawH: number;
    if (item.type === 'image' || item.type === 'icon') {
      const nw = item.naturalWidth || item.width || (item.type === 'image' ? 120 : 40);
      const nh = item.naturalHeight || item.height || (item.type === 'image' ? 120 : 40);
      rawW = item.scaleX !== undefined ? nw * item.scaleX : pw * (item.type === 'image' ? 0.70 : 0.35);
      rawH = item.scaleY !== undefined ? nh * item.scaleY : ph * (item.type === 'image' ? 0.70 : 0.35);
    } else if (item.type === 'text') {
      const charCount = Math.max((item.text || '').length, 1);
      const fs = item.fontSize || 16;
      rawW = charCount * fs * 0.62;
      rawH = fs * 1.25;
    } else {
      rawW = pw * 0.55;
      rawH = item.type === 'barcode' ? ph * 0.28 : pw * 0.55;
    }

    // Center on 3D face in normalized coordinates [0, 1]
    let uc: number;
    let vc: number;
    if (isTransposed) {
      uc = Math.max(0.01, Math.min(0.99, 0.5 + relY / ph));
      vc = Math.max(0.01, Math.min(0.99, 0.5 + relX / pw));
    } else {
      uc = Math.max(0.01, Math.min(0.99, 0.5 + relX / pw));
      vc = Math.max(0.01, Math.min(0.99, 0.5 + relY / ph));
    }

    // Evaluate 3D center and tangent steps
    const pCenter3D = interpolateQuad3D(v0, v1, v2, v3, uc, vc);
    const pU = interpolateQuad3D(v0, v1, v2, v3, Math.min(0.999, uc + delta), vc);
    const pV = interpolateQuad3D(v0, v1, v2, v3, uc, Math.min(0.999, vc + delta));

    // Tangent vectors in 3D object space per 1 millimeter along 2D panel X and Y
    let vecX_mm_3D: Vector3;
    let vecY_mm_3D: Vector3;

    if (isTransposed) {
      vecX_mm_3D = {
        x: (pV.x - pCenter3D.x) / (delta * pw),
        y: (pV.y - pCenter3D.y) / (delta * pw),
        z: (pV.z - pCenter3D.z) / (delta * pw),
      };
      vecY_mm_3D = {
        x: (pU.x - pCenter3D.x) / (delta * ph),
        y: (pU.y - pCenter3D.y) / (delta * ph),
        z: (pU.z - pCenter3D.z) / (delta * ph),
      };
    } else {
      vecX_mm_3D = {
        x: (pU.x - pCenter3D.x) / (delta * pw),
        y: (pU.y - pCenter3D.y) / (delta * pw),
        z: (pU.z - pCenter3D.z) / (delta * pw),
      };
      vecY_mm_3D = {
        x: (pV.x - pCenter3D.x) / (delta * ph),
        y: (pV.y - pCenter3D.y) / (delta * ph),
        z: (pV.z - pCenter3D.z) / (delta * ph),
      };
    }

    // Apply rotation angle in 3D surface plane
    const effAngle = item.angle ?? 0;
    const angleRad = (effAngle * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const axisX_3D: Vector3 = {
      x: cosA * vecX_mm_3D.x + sinA * vecY_mm_3D.x,
      y: cosA * vecX_mm_3D.y + sinA * vecY_mm_3D.y,
      z: cosA * vecX_mm_3D.z + sinA * vecY_mm_3D.z,
    };

    const axisY_3D: Vector3 = {
      x: -sinA * vecX_mm_3D.x + cosA * vecY_mm_3D.x,
      y: -sinA * vecX_mm_3D.y + cosA * vecY_mm_3D.y,
      z: -sinA * vecX_mm_3D.z + cosA * vecY_mm_3D.z,
    };

    // Project center and unit step vectors to screen coordinates
    const sCenter = rotAndProject(pCenter3D);
    const sX1 = rotAndProject({
      x: pCenter3D.x + axisX_3D.x,
      y: pCenter3D.y + axisX_3D.y,
      z: pCenter3D.z + axisX_3D.z,
    });
    const sY1 = rotAndProject({
      x: pCenter3D.x + axisY_3D.x,
      y: pCenter3D.y + axisY_3D.y,
      z: pCenter3D.z + axisY_3D.z,
    });

    // Screen pixel displacement per 1 millimeter on 3D packaging face
    const a = sX1.x - sCenter.x;
    const b = sX1.y - sCenter.y;
    const c = sY1.x - sCenter.x;
    const d = sY1.y - sCenter.y;
    const e = sCenter.x;
    const f = sCenter.y;

    const transformMatrix = `matrix(${a.toFixed(5)}, ${b.toFixed(5)}, ${c.toFixed(5)}, ${d.toFixed(5)}, ${e.toFixed(2)}, ${f.toFixed(2)})`;

    // 4 perspective screen corners for boundary checks
    const hw = rawW / 2;
    const hh = rawH / 2;
    const s0 = rotAndProject({
      x: pCenter3D.x - hw * axisX_3D.x - hh * axisY_3D.x,
      y: pCenter3D.y - hw * axisX_3D.y - hh * axisY_3D.y,
      z: pCenter3D.z - hw * axisX_3D.z - hh * axisY_3D.z,
    });
    const s1 = rotAndProject({
      x: pCenter3D.x + hw * axisX_3D.x - hh * axisY_3D.x,
      y: pCenter3D.y + hw * axisX_3D.y - hh * axisY_3D.y,
      z: pCenter3D.z + hw * axisX_3D.z - hh * axisY_3D.z,
    });
    const s2 = rotAndProject({
      x: pCenter3D.x + hw * axisX_3D.x + hh * axisY_3D.x,
      y: pCenter3D.y + hw * axisX_3D.y + hh * axisY_3D.y,
      z: pCenter3D.z + hw * axisX_3D.z + hh * axisY_3D.z,
    });
    const s3 = rotAndProject({
      x: pCenter3D.x - hw * axisX_3D.x + hh * axisY_3D.x,
      y: pCenter3D.y - hw * axisX_3D.y + hh * axisY_3D.y,
      z: pCenter3D.z - hw * axisX_3D.z + hh * axisY_3D.z,
    });

    // High-contrast text fill: avoid invisible white text on white packaging cartons
    let textFill = item.fill ?? '#1e293b';
    if (!item.fill || item.fill.toLowerCase() === '#ffffff' || item.fill.toLowerCase() === '#f8fafc') {
      textFill = '#1e293b';
    }

    return {
      id: item.id,
      type: item.type,
      src: item.src,
      text: item.text,
      fontFamily: item.fontFamily ?? 'Inter, sans-serif',
      fontSize: item.fontSize || 16,
      fontWeight: item.fontWeight ?? 'bold',
      fill: textFill,
      textAlign: item.textAlign ?? 'center',
      fontStyle: item.fontStyle,
      lineHeight: item.lineHeight,
      isCurved: item.isCurved,
      x: sCenter.x,
      y: sCenter.y,
      width: rawW,
      height: rawH,
      scaleX: Math.hypot(a, b),
      scaleY: Math.hypot(c, d),
      rotation: effAngle,
      clipToFace: item.clipToPanel,
      transformMatrix,
      screenCenter: sCenter,
      screenCorners: [s0, s1, s2, s3],
    };
  });
}
