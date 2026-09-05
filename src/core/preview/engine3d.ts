/**
 * Precision 3D Geometry and Projection Engine for Food Packaging Editor
 * Provides true 360-degree rotation (yaw, pitch), perspective camera projection,
 * backface culling, depth sorting (Painter's algorithm), and directional studio lighting.
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Face3DDefinition {
  id: string;
  name: string;
  panelId: string;
  // Vertices ordered CCW when viewed from outside
  vertices: Vector3[];
  // Optional custom path generator given projected 2D points
  pathDGenerator?: (pts: Vector2[]) => string;
  // If true, backface culling is disabled (e.g. open carton interior, transparent film)
  doubleSided?: boolean;
}

export interface ProjectedFace3D {
  id: string;
  name: string;
  panelId: string;
  points: Vector2[];
  avgZ: number;
  lighting: number;
  isFrontFacing: boolean;
  pathD?: string;
  normal: Vector3;
}

export interface Camera3D {
  cx: number;
  cy: number;
  distance: number; // e.g. 850mm
  yawDeg: number;   // 0 to 360 deg
  pitchDeg: number; // -60 to +60 deg
  zoom: number;     // e.g. 1.0
}

/**
 * Normalizes a 3D vector.
 */
export function normalize3(v: Vector3): Vector3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-6) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * 3D Cross product: a x b
 */
export function cross3(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * 3D Dot product: a . b
 */
export function dot3(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Rotates a 3D point by yaw (around Y axis) and pitch (around X axis).
 */
export function rotatePoint3D(p: Vector3, yawRad: number, pitchRad: number): Vector3 {
  // 1. Yaw rotation (around Y axis)
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const x1 = p.x * cosY + p.z * sinY;
  const y1 = p.y;
  const z1 = -p.x * sinY + p.z * cosY;

  // 2. Pitch rotation (around X axis)
  const cosX = Math.cos(pitchRad);
  const sinX = Math.sin(pitchRad);
  const x2 = x1;
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;

  return { x: x2, y: y2, z: z2 };
}

/**
 * Projects a rotated 3D point onto the 2D viewport using true perspective projection.
 * Camera is located at (0, 0, cam.distance) looking towards origin (0,0,0).
 */
export function projectPoint3D(p: Vector3, cam: Camera3D): Vector2 {
  const effDist = cam.distance;
  // Distance from camera to point: effDist - p.z
  const dist = Math.max(100, effDist - p.z);
  const fovFactor = effDist / dist;
  const scale = fovFactor * (cam.zoom || 1);

  // SVG Y goes downward, 3D Y goes upward
  return {
    x: cam.cx + p.x * scale,
    y: cam.cy - p.y * scale,
  };
}

/**
 * Calculates the exact surface normal of a 3D polygon using Newell's method.
 * Negated because vertices are ordered [Top-Left, Top-Right, Bottom-Right, Bottom-Left] (CW).
 */
export function calculatePolygonNormal(verts: Vector3[]): Vector3 {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const curr = verts[i];
    const next = verts[(i + 1) % n];
    nx += (curr.y - next.y) * (curr.z + next.z);
    ny += (curr.z - next.z) * (curr.x + next.x);
    nz += (curr.x - next.x) * (curr.y + next.y);
  }
  return normalize3({ x: -nx, y: -ny, z: -nz });
}

/**
 * Calculates studio lighting factor (0.40 to 1.28) for a rotated surface normal.
 * Uses a balanced 3-point studio lighting setup (Key, Fill, and Rim/Top bounce).
 */
export function calculateLighting(norm: Vector3): number {
  // Key light: upper-left-front softbox
  const keyLight = normalize3({ x: -0.45, y: 0.75, z: 0.55 });
  // Fill light: right-front softer lamp
  const fillLight = normalize3({ x: 0.65, y: 0.35, z: 0.45 });
  // Top rim / overhead ambient light
  const topLight = normalize3({ x: 0, y: 1.0, z: 0.1 });

  const dotKey = Math.max(0, dot3(norm, keyLight));
  const dotFill = Math.max(0, dot3(norm, fillLight));
  const dotTop = Math.max(0, dot3(norm, topLight));

  const ambient = 0.42;
  const factor = ambient + 0.46 * dotKey + 0.22 * dotFill + 0.15 * dotTop;
  return Math.max(0.4, Math.min(1.28, factor));
}

/**
 * Projects and depth-sorts a list of 3D faces for rendering.
 */
export function projectFaces3D(
  faces: Face3DDefinition[],
  cam: Camera3D
): ProjectedFace3D[] {
  const yawRad = (cam.yawDeg * Math.PI) / 180;
  const pitchRad = (cam.pitchDeg * Math.PI) / 180;

  const cameraPosRot: Vector3 = { x: 0, y: 0, z: cam.distance };

  const projected: ProjectedFace3D[] = [];

  for (const face of faces) {
    if (face.vertices.length < 3) continue;

    // Rotate all vertices into camera eye space
    const rotVerts = face.vertices.map((v) => rotatePoint3D(v, yawRad, pitchRad));

    // Calculate eye-space surface normal using Newell's method
    let norm = calculatePolygonNormal(rotVerts);

    // Calculate face centroid in eye space
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (const rv of rotVerts) {
      cx += rv.x;
      cy += rv.y;
      cz += rv.z;
    }
    const centroid: Vector3 = {
      x: cx / rotVerts.length,
      y: cy / rotVerts.length,
      z: cz / rotVerts.length,
    };

    // View vector from centroid to camera (0, 0, cam.distance)
    const viewVec: Vector3 = {
      x: cameraPosRot.x - centroid.x,
      y: cameraPosRot.y - centroid.y,
      z: cameraPosRot.z - centroid.z,
    };

    const dotView = dot3(norm, viewVec);
    let isFrontFacing = dotView > 0;

    // If double-sided and facing away, invert normal so inner surface receives proper shading
    if (!isFrontFacing && face.doubleSided === true) {
      norm = { x: -norm.x, y: -norm.y, z: -norm.z };
      isFrontFacing = true;
    }

    if (!isFrontFacing) {
      continue; // Cull rear-facing closed faces
    }

    // 2D Perspective Projection
    const points2D = rotVerts.map((rv) => projectPoint3D(rv, cam));

    // Studio directional lighting
    const lighting = calculateLighting(norm);

    // Optional custom path generator
    const pathD = face.pathDGenerator ? face.pathDGenerator(points2D) : undefined;

    projected.push({
      id: face.id,
      name: face.name,
      panelId: face.panelId,
      points: points2D,
      avgZ: centroid.z,
      lighting,
      isFrontFacing,
      pathD,
      normal: norm,
    });
  }

  // Painter's Algorithm: lowest Z (furthest) drawn FIRST, highest Z (closest) drawn LAST
  projected.sort((a, b) => a.avgZ - b.avgZ);

  // Fallback: if all faces were culled at an extreme angle, render all as double-sided
  if (projected.length === 0 && faces.length > 0) {
    for (const face of faces) {
      const rotVerts = face.vertices.map((v) => rotatePoint3D(v, yawRad, pitchRad));
      const points2D = rotVerts.map((rv) => projectPoint3D(rv, cam));
      let sumZ = 0;
      for (const rv of rotVerts) sumZ += rv.z;
      projected.push({
        id: face.id,
        name: face.name,
        panelId: face.panelId,
        points: points2D,
        avgZ: sumZ / rotVerts.length,
        lighting: 0.95,
        isFrontFacing: true,
        pathD: face.pathDGenerator ? face.pathDGenerator(points2D) : undefined,
        normal: { x: 0, y: 1, z: 0 },
      });
    }
    projected.sort((a, b) => a.avgZ - b.avgZ);
  }

  return projected;
}
