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
  // Vertices ordered CCW when viewed from outside: [Top-Left, Top-Right, Bottom-Right, Bottom-Left]
  vertices: Vector3[];
  // Optional custom path generator given projected 2D points
  pathDGenerator?: (pts: Vector2[]) => string;
  // If true, backface culling is disabled (e.g. transparent film, open wrapper)
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
 * Projects a rotated 3D point onto the 2D viewport using perspective projection.
 */
export function projectPoint3D(p: Vector3, cam: Camera3D): Vector2 {
  const effDist = cam.distance;
  const fovFactor = effDist / Math.max(10, effDist + p.z);
  const scale = fovFactor * (cam.zoom || 1);

  // SVG Y goes downward, 3D Y goes upward
  return {
    x: cam.cx + p.x * scale,
    y: cam.cy - p.y * scale,
  };
}

/**
 * Calculates the studio lighting factor for a rotated surface normal.
 */
export function calculateLighting(norm: Vector3): number {
  // Key light: upper-left-front softbox
  const keyLight = normalize3({ x: -0.45, y: 0.75, z: 0.55 });
  // Fill light: right-front softer lamp
  const fillLight = normalize3({ x: 0.55, y: 0.25, z: 0.4 });

  const dotKey = Math.max(0, dot3(norm, keyLight));
  const dotFill = Math.max(0, dot3(norm, fillLight));

  // Base ambient + diffuse contributions
  const ambient = 0.42;
  const factor = ambient + 0.48 * dotKey + 0.18 * dotFill;
  return Math.max(0.35, Math.min(1.28, factor));
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

    // Calculate eye-space surface normal using quad Top-Left/Right/Bottom convention:
    // right = v1 - v0, up = v0 - v3
    // norm = right x up
    const v0 = rotVerts[0];
    const v1 = rotVerts[1];
    const v3 = rotVerts.length >= 4 ? rotVerts[3] : rotVerts[2];

    const right: Vector3 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const up: Vector3 = { x: v0.x - v3.x, y: v0.y - v3.y, z: v0.z - v3.z };
    const norm = normalize3(cross3(right, up));

    // View vector from face vertex v0 to camera
    const viewVec: Vector3 = {
      x: cameraPosRot.x - v0.x,
      y: cameraPosRot.y - v0.y,
      z: cameraPosRot.z - v0.z,
    };

    // Backface culling: face points towards camera if dot(norm, viewVec) > 0
    const dotView = dot3(norm, viewVec);
    const isFrontFacing = dotView > 0 || face.doubleSided === true;

    if (!isFrontFacing) {
      continue; // Cull invisible rear faces for clean rendering
    }

    // 2D Perspective Projection
    const points2D = rotVerts.map((rv) => projectPoint3D(rv, cam));

    // Calculate average Z for Painter's algorithm depth sorting
    let sumZ = 0;
    for (const rv of rotVerts) sumZ += rv.z;
    const avgZ = sumZ / rotVerts.length;

    // Studio directional lighting
    const lighting = calculateLighting(norm);

    // Optional custom path generator
    const pathD = face.pathDGenerator ? face.pathDGenerator(points2D) : undefined;

    projected.push({
      id: face.id,
      name: face.name,
      panelId: face.panelId,
      points: points2D,
      avgZ,
      lighting,
      isFrontFacing,
      pathD,
      normal: norm,
    });
  }

  // Painter's Algorithm: Furthest faces (lowest Z or greatest distance) drawn FIRST,
  // nearest faces (closest to camera, largest Z) drawn LAST on top.
  // In camera eye space, positive Z points toward camera, so sort by avgZ ASCENDING.
  projected.sort((a, b) => a.avgZ - b.avgZ);

  // Robust fallback: if all faces were culled at an extreme angle (e.g. open carton top),
  // render all faces as double-sided so model is never blank
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
