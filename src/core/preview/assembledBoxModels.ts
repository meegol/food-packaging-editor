import { PackagingDimensions, PanelFace } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { AssembledFaceData, AssembledModelResult, PreviewSettings } from './previewTypes';
import { mapPanelGraphicsToFace } from './graphicProjection';
import {
  Camera3D,
  Face3DDefinition,
  projectFaces3D,
  Vector3,
} from './engine3d';

/**
 * Generates the assembled 3D perspective / 360-degree turntable model for any of the 12 packaging templates.
 */
export function generateAssembledModel(
  templateId: string,
  dimensions: PackagingDimensions,
  panels: PanelFace[],
  graphics: GraphicItem[],
  settings: PreviewSettings
): AssembledModelResult {
  const { viewAngle, openness } = settings;
  const panelMap = new Map(panels.map((p) => [p.id, p]));

  // Canvas center and camera setup
  const cx = 400;
  const cy = 340;

  // Resolve yaw and pitch angles
  let yaw = settings.yaw;
  let pitch = settings.pitch;

  if (yaw === undefined || pitch === undefined) {
    switch (viewAngle) {
      case 'front':
        yaw = 0;
        pitch = 5;
        break;
      case 'side':
        yaw = 90;
        pitch = 5;
        break;
      case 'back':
        yaw = 180;
        pitch = 5;
        break;
      case 'left':
        yaw = 270;
        pitch = 5;
        break;
      case 'top':
        yaw = 0;
        pitch = 85;
        break;
      case 'bottom':
        yaw = 0;
        pitch = -85;
        break;
      case 'isometric':
      default:
        yaw = 35;
        pitch = 24;
        break;
    }
  }

  const camera: Camera3D = {
    cx,
    cy,
    distance: 850,
    yawDeg: yaw,
    pitchDeg: pitch,
    zoom: settings.zoom || 1,
  };

  // Normalization scale so templates comfortably fill viewport (target ~210mm)
  const maxDim = Math.max(dimensions.width, dimensions.length, dimensions.depth, 1);
  const scale = 220 / maxDim;
  const w = dimensions.width * scale;
  const l = dimensions.length * scale;
  const d = dimensions.depth * scale;

  let faces3D: Face3DDefinition[] = [];

  switch (templateId) {
    case 'burger-box':
      faces3D = buildBurgerBox3D(w, l, d, openness);
      break;
    case 'pizza-box':
      faces3D = buildPizzaBox3D(w, l, d, openness);
      break;
    case 'sandwich-wedge-box':
      faces3D = buildSandwichWedge3D(w, l, d, openness);
      break;
    case 'fries-scoop-box':
      faces3D = buildFriesScoop3D(w, l, d, openness);
      break;
    case 'pillow-box':
      faces3D = buildPillowBox3D(w, l, d, openness);
      break;
    case 'dessert-sleeve-box':
      faces3D = buildDessertSleeve3D(w, l, d, openness);
      break;
    case 'round-food-tub':
      faces3D = buildRoundFoodTub3D(w, l, d, openness);
      break;
    case 'standup-pouch':
      faces3D = buildStandUpPouch3D(w, l, d, openness);
      break;
    case 'side-gusset-bag':
      faces3D = buildSideGussetBag3D(w, l, d, openness);
      break;
    case 'sachet-stick-pack':
      faces3D = buildSachetStickPack3D(w, l, d, openness);
      break;
    case 'bread-loaf-bag':
      faces3D = buildBreadLoafBag3D(w, l, d, openness);
      break;
    case 'burger-wrapper':
    default:
      faces3D = buildBurgerWrapper3D(w, l, d, openness);
      break;
  }

  // Project 3D faces to 2D screen with Painter's depth sorting and studio lighting
  const projectedFaces = projectFaces3D(faces3D, camera);

  // Map user graphics to each visible face
  const faces: AssembledFaceData[] = projectedFaces.map((pf) => {
    const panel = findPanel(panelMap, pf.panelId);
    // Determine face dimensions in 2D for affine projection
    const p0 = pf.points[0];
    const p1 = pf.points[1];
    const p3 = pf.points.length >= 4 ? pf.points[3] : pf.points[2];
    const targetW = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 100;
    const targetH = Math.hypot(p3.x - p0.x, p3.y - p0.y) || 100;

    const mappedGraphics = panel ? mapPanelGraphicsToFace(panel, graphics, targetW, targetH) : [];

    return {
      id: pf.id,
      name: pf.name,
      panelId: pf.panelId,
      points: pf.points,
      lighting: pf.lighting,
      pathD: pf.pathD,
      graphics: mappedGraphics,
    };
  });

  // Dynamic shadow position at base of object
  const shadowY = cy + (d / 2) * 0.9 + 40;
  const shadowRx = Math.max(80, (w * 0.65 + l * 0.5) * 0.7);
  const shadowRy = Math.max(22, (w * 0.2 + l * 0.28) * 0.7);

  return {
    templateId,
    viewAngle,
    width: 800,
    height: 700,
    faces,
    shadow: {
      cx,
      cy: shadowY,
      rx: shadowRx,
      ry: shadowRy,
      opacity: 0.45,
    },
  };
}

function findPanel(panels: Map<string, PanelFace>, ...possibleIds: string[]): PanelFace | undefined {
  for (const id of possibleIds) {
    const p = panels.get(id);
    if (p) return p;
  }
  const firstId = possibleIds[0]?.toLowerCase() || '';
  for (const p of panels.values()) {
    if (p.id.toLowerCase().includes(firstId) || p.name.toLowerCase().includes(firstId)) {
      return p;
    }
  }
  return undefined;
}

// -------------------------------------------------------------
// 1. Burger Clamshell Box 3D Geometry
// -------------------------------------------------------------
function buildBurgerBox3D(w: number, l: number, d: number, openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  // Base tray (bottom Y = -hd, rim Y = 0, with inward bottom taper)
  const tw = hw * 0.88;
  const tl = hl * 0.88;

  const faces: Face3DDefinition[] = [
    // Base Bottom (points in -Y)
    {
      id: 'burger-base-bottom',
      name: 'Base Bottom',
      panelId: 'base-bottom',
      vertices: [
        { x: -tw, y: -hd, z: tl },
        { x: tw, y: -hd, z: tl },
        { x: tw, y: -hd, z: -tl },
        { x: -tw, y: -hd, z: -tl },
      ],
    },
    // Base Front (points in +Z)
    {
      id: 'burger-base-front',
      name: 'Base Front Wall',
      panelId: 'base-front',
      vertices: [
        { x: -hw, y: 0, z: hl },
        { x: hw, y: 0, z: hl },
        { x: tw, y: -hd, z: tl },
        { x: -tw, y: -hd, z: tl },
      ],
    },
    // Base Rear Hinge Wall (points in -Z, goes from -hd to +hd)
    {
      id: 'burger-rear-hinge',
      name: 'Rear Hinge Wall',
      panelId: 'rear-hinge',
      vertices: [
        { x: hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: -hl },
        { x: -tw, y: -hd, z: -tl },
        { x: tw, y: -hd, z: -tl },
      ],
    },
    // Base Left Wall (points in -X)
    {
      id: 'burger-base-left',
      name: 'Base Left Wall',
      panelId: 'base-left',
      vertices: [
        { x: -hw, y: 0, z: -hl },
        { x: -hw, y: 0, z: hl },
        { x: -tw, y: -hd, z: tl },
        { x: -tw, y: -hd, z: -tl },
      ],
    },
    // Base Right Wall (points in +X)
    {
      id: 'burger-base-right',
      name: 'Base Right Wall',
      panelId: 'base-right',
      vertices: [
        { x: hw, y: 0, z: hl },
        { x: hw, y: 0, z: -hl },
        { x: tw, y: -hd, z: -tl },
        { x: tw, y: -hd, z: tl },
      ],
    },
  ];

  // Lid (hinged at rear top rim: Y = hd, Z = -hl)
  // When openness > 0, rotate lid points around hinge line
  const hingeY = hd;
  const hingeZ = -hl;
  const hingeAngle = (openness * 110 * Math.PI) / 180;
  const cosH = Math.cos(hingeAngle);
  const sinH = Math.sin(hingeAngle);

  const rotLid = (p: Vector3): Vector3 => {
    const dy = p.y - hingeY;
    const dz = p.z - hingeZ;
    return {
      x: p.x,
      y: hingeY + dy * cosH - dz * sinH,
      z: hingeZ + dy * sinH + dz * cosH,
    };
  };

  const lidTw = hw * 0.92;
  const lidTl = hl * 0.92;

  // Top Lid (at Y = hd)
  faces.push({
    id: 'burger-lid-top',
    name: 'Top Lid (Branding)',
    panelId: 'lid-top',
    vertices: [
      rotLid({ x: -lidTw, y: hd, z: -lidTl }),
      rotLid({ x: lidTw, y: hd, z: -lidTl }),
      rotLid({ x: lidTw, y: hd, z: lidTl }),
      rotLid({ x: -lidTw, y: hd, z: lidTl }),
    ],
  });

  // Lid Front Flap
  faces.push({
    id: 'burger-lid-front',
    name: 'Lid Front Flap',
    panelId: 'lid-front',
    vertices: [
      rotLid({ x: -lidTw, y: hd, z: lidTl }),
      rotLid({ x: lidTw, y: hd, z: lidTl }),
      rotLid({ x: hw, y: 0, z: hl }),
      rotLid({ x: -hw, y: 0, z: hl }),
    ],
  });

  // Lid Left Flap
  faces.push({
    id: 'burger-lid-left',
    name: 'Lid Left Flap',
    panelId: 'lid-left',
    vertices: [
      rotLid({ x: -lidTw, y: hd, z: -lidTl }),
      rotLid({ x: -lidTw, y: hd, z: lidTl }),
      rotLid({ x: -hw, y: 0, z: hl }),
      rotLid({ x: -hw, y: 0, z: -hl }),
    ],
  });

  // Lid Right Flap
  faces.push({
    id: 'burger-lid-right',
    name: 'Lid Right Flap',
    panelId: 'lid-right',
    vertices: [
      rotLid({ x: lidTw, y: hd, z: lidTl }),
      rotLid({ x: lidTw, y: hd, z: -lidTl }),
      rotLid({ x: hw, y: 0, z: -hl }),
      rotLid({ x: hw, y: 0, z: hl }),
    ],
  });

  return faces;
}

// -------------------------------------------------------------
// 2. Pizza Box 3D Geometry (Roll-End Corrugated Box)
// -------------------------------------------------------------
function buildPizzaBox3D(w: number, l: number, d: number, openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  const faces: Face3DDefinition[] = [
    // Bottom Base
    {
      id: 'pizza-base',
      name: 'Base Bottom',
      panelId: 'pizza-base',
      vertices: [
        { x: -hw, y: -hd, z: hl },
        { x: hw, y: -hd, z: hl },
        { x: hw, y: -hd, z: -hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // Rear Wall
    {
      id: 'pizza-rear',
      name: 'Rear Wall',
      panelId: 'pizza-rear',
      vertices: [
        { x: hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: -hd, z: -hl },
        { x: hw, y: -hd, z: -hl },
      ],
    },
    // Left Outer Side
    {
      id: 'pizza-left-outer',
      name: 'Left Wall',
      panelId: 'pizza-left-outer',
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: hl },
        { x: -hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // Right Outer Side
    {
      id: 'pizza-right-outer',
      name: 'Right Wall',
      panelId: 'pizza-right-outer',
      vertices: [
        { x: hw, y: hd, z: hl },
        { x: hw, y: hd, z: -hl },
        { x: hw, y: -hd, z: -hl },
        { x: hw, y: -hd, z: hl },
      ],
    },
    // Front Base Rim
    {
      id: 'pizza-front-rim',
      name: 'Front Wall',
      panelId: 'pizza-lid-front',
      vertices: [
        { x: -hw, y: hd, z: hl },
        { x: hw, y: hd, z: hl },
        { x: hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: hl },
      ],
    },
  ];

  // Top Lid hinged at rear top edge: Y = hd, Z = -hl
  const hingeY = hd;
  const hingeZ = -hl;
  const hingeAngle = (openness * 95 * Math.PI) / 180;
  const cosH = Math.cos(hingeAngle);
  const sinH = Math.sin(hingeAngle);

  const rotLid = (p: Vector3): Vector3 => {
    const dy = p.y - hingeY;
    const dz = p.z - hingeZ;
    return {
      x: p.x,
      y: hingeY + dy * cosH - dz * sinH,
      z: hingeZ + dy * sinH + dz * cosH,
    };
  };

  // Top Lid Main Artwork Face
  faces.push({
    id: 'pizza-lid',
    name: 'Top Lid (Main)',
    panelId: 'pizza-lid',
    vertices: [
      rotLid({ x: -hw, y: hd, z: -hl }),
      rotLid({ x: hw, y: hd, z: -hl }),
      rotLid({ x: hw, y: hd, z: hl }),
      rotLid({ x: -hw, y: hd, z: hl }),
    ],
  });

  // Front Tuck Flap
  faces.push({
    id: 'pizza-lid-front',
    name: 'Lid Front Tuck Flap',
    panelId: 'pizza-lid-front',
    vertices: [
      rotLid({ x: -hw, y: hd, z: hl }),
      rotLid({ x: hw, y: hd, z: hl }),
      rotLid({ x: hw, y: -hd, z: hl }),
      rotLid({ x: -hw, y: -hd, z: hl }),
    ],
  });

  // Left Lid Flap
  faces.push({
    id: 'pizza-lid-left',
    name: 'Lid Left Side Flap',
    panelId: 'pizza-lid-left',
    vertices: [
      rotLid({ x: -hw, y: hd, z: -hl }),
      rotLid({ x: -hw, y: hd, z: hl }),
      rotLid({ x: -hw, y: 0, z: hl }),
      rotLid({ x: -hw, y: 0, z: -hl }),
    ],
  });

  // Right Lid Flap
  faces.push({
    id: 'pizza-lid-right',
    name: 'Lid Right Side Flap',
    panelId: 'pizza-lid-right',
    vertices: [
      rotLid({ x: hw, y: hd, z: hl }),
      rotLid({ x: hw, y: hd, z: -hl }),
      rotLid({ x: hw, y: 0, z: -hl }),
      rotLid({ x: hw, y: 0, z: hl }),
    ],
  });

  return faces;
}

// -------------------------------------------------------------
// 3. Sandwich Wedge Box 3D Geometry (Right-Triangular Prism)
// -------------------------------------------------------------
function buildSandwichWedge3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  return [
    // 1. Horizontal Base (bottom Y = -hd)
    {
      id: 'sandwich-base',
      name: 'Bottom Base',
      panelId: 'sandwich-base',
      vertices: [
        { x: -hw, y: -hd, z: hl },
        { x: hw, y: -hd, z: hl },
        { x: hw, y: -hd, z: -hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // 2. Vertical Rear Spine (at Z = -hl)
    {
      id: 'sandwich-back',
      name: 'Back Spine (Branding)',
      panelId: 'sandwich-back',
      vertices: [
        { x: hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: -hd, z: -hl },
        { x: hw, y: -hd, z: -hl },
      ],
    },
    // 3. Slanted Front Face with Window (Hypotenuse from apex down to front base)
    {
      id: 'sandwich-front',
      name: 'Front Window Face',
      panelId: 'sandwich-front',
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: hw, y: hd, z: -hl },
        { x: hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: hl },
      ],
    },
    // 4. Left Triangular Side (at X = -hw)
    {
      id: 'sandwich-left-side',
      name: 'Left Triangular Side',
      panelId: 'sandwich-left-side',
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // 5. Right Triangular Side (at X = +hw)
    {
      id: 'sandwich-right-side',
      name: 'Right Triangular Side',
      panelId: 'sandwich-right-side',
      vertices: [
        { x: hw, y: hd, z: -hl },
        { x: hw, y: -hd, z: -hl },
        { x: hw, y: -hd, z: hl },
      ],
    },
    // 6. Top Apex Tuck Flap
    {
      id: 'sandwich-tuck-flap',
      name: 'Apex Tuck Flap',
      panelId: 'sandwich-tuck-flap',
      vertices: [
        { x: -hw, y: hd + 4, z: -hl },
        { x: hw, y: hd + 4, z: -hl },
        { x: hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: -hl },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 4. Fries Scoop Box 3D Geometry (Curved Front & Tall Arched Back)
// -------------------------------------------------------------
function buildFriesScoop3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  // Base bottom is slightly smaller (tapered)
  const bw = hw * 0.75;
  const bl = hl * 0.75;

  return [
    // Bottom Base
    {
      id: 'fries-bottom',
      name: 'Bottom Base',
      panelId: 'fries-bottom',
      vertices: [
        { x: -bw, y: -hd, z: bl },
        { x: bw, y: -hd, z: bl },
        { x: bw, y: -hd, z: -bl },
        { x: -bw, y: -hd, z: -bl },
      ],
    },
    // Tall Back Arched Wall
    {
      id: 'fries-back',
      name: 'Back Scoop Wall',
      panelId: 'fries-back',
      vertices: [
        { x: hw, y: hd * 1.25, z: -hl },
        { x: -hw, y: hd * 1.25, z: -hl },
        { x: -bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: -bl },
      ],
    },
    // Low Front Scoop Face
    {
      id: 'fries-front',
      name: 'Front Scoop Lip',
      panelId: 'fries-front',
      vertices: [
        { x: -hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: bl },
      ],
    },
    // Left Tapered Wall (connecting low front to high back)
    {
      id: 'fries-left',
      name: 'Left Tapered Side',
      panelId: 'fries-left',
      vertices: [
        { x: -hw, y: hd * 1.25, z: -hl },
        { x: -hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: -bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: -bl },
      ],
    },
    // Right Tapered Wall (connecting high back to low front)
    {
      id: 'fries-right',
      name: 'Right Tapered Side',
      panelId: 'fries-right',
      vertices: [
        { x: hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: hw, y: hd * 1.25, z: -hl },
        { x: bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: bl },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 5. Pillow Box 3D Geometry (Convex Curved Pillow)
// -------------------------------------------------------------
function buildPillowBox3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  // Approximate curved elliptical pillow volume using multi-band front and back facets
  const bulgeZ = hd * 0.85;

  return [
    // Front Face (Bulging in +Z)
    {
      id: 'pillow-front',
      name: 'Front Face (Logo)',
      panelId: 'pillow-front',
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: -hl, z: 0 },
        { x: -hw, y: -hl, z: 0 },
      ],
      // Use bulge normal hint for authentic radial curvature shading
      pathDGenerator: (pts) => {
        const [p0, p1, p2, p3] = pts;
        const midTopX = (p0.x + p1.x) / 2;
        const midTopY = (p0.y + p1.y) / 2 - 12;
        const midBotX = (p3.x + p2.x) / 2;
        const midBotY = (p3.y + p2.y) / 2 + 12;
        return `M ${p0.x} ${p0.y} Q ${midTopX} ${midTopY} ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Q ${midBotX} ${midBotY} ${p3.x} ${p3.y} Z`;
      },
    },
    // Back Face (Bulging in -Z)
    {
      id: 'pillow-back',
      name: 'Back Face',
      panelId: 'pillow-back',
      vertices: [
        { x: hw, y: hl, z: -bulgeZ },
        { x: -hw, y: hl, z: -bulgeZ },
        { x: -hw, y: -hl, z: -bulgeZ },
        { x: hw, y: -hl, z: -bulgeZ },
      ],
    },
    // Top Curved Tuck End Cap
    {
      id: 'pillow-top',
      name: 'Top Tuck Cap',
      panelId: 'pillow-top-outer',
      vertices: [
        { x: -hw, y: hl, z: -bulgeZ },
        { x: hw, y: hl, z: -bulgeZ },
        { x: hw, y: hl, z: 0 },
        { x: -hw, y: hl, z: 0 },
      ],
    },
    // Bottom Curved Tuck End Cap
    {
      id: 'pillow-bottom',
      name: 'Bottom Tuck Cap',
      panelId: 'pillow-top-inner',
      vertices: [
        { x: -hw, y: -hl, z: 0 },
        { x: hw, y: -hl, z: 0 },
        { x: hw, y: -hl, z: -bulgeZ },
        { x: -hw, y: -hl, z: -bulgeZ },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 6. Dessert Sleeve Box 3D Geometry (Outer Sleeve + Sliding Inner Tray)
// -------------------------------------------------------------
function buildDessertSleeve3D(w: number, l: number, d: number, openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  const faces: Face3DDefinition[] = [
    // Outer Sleeve Top (with window)
    {
      id: 'sleeve-top',
      name: 'Outer Sleeve Top',
      panelId: 'sleeve-top',
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: hw, y: hd, z: -hl },
        { x: hw, y: hd, z: hl },
        { x: -hw, y: hd, z: hl },
      ],
    },
    // Outer Sleeve Bottom
    {
      id: 'sleeve-bottom',
      name: 'Outer Sleeve Bottom',
      panelId: 'sleeve-bottom',
      vertices: [
        { x: -hw, y: -hd, z: hl },
        { x: hw, y: -hd, z: hl },
        { x: hw, y: -hd, z: -hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // Outer Sleeve Left
    {
      id: 'sleeve-left',
      name: 'Outer Sleeve Left',
      panelId: 'sleeve-left',
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: hl },
        { x: -hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // Outer Sleeve Right
    {
      id: 'sleeve-right',
      name: 'Outer Sleeve Right',
      panelId: 'sleeve-right',
      vertices: [
        { x: hw, y: hd, z: hl },
        { x: hw, y: hd, z: -hl },
        { x: hw, y: -hd, z: -hl },
        { x: hw, y: -hd, z: hl },
      ],
    },
  ];

  // Inner Sliding Tray (slides forward in +Z by slideOffset)
  const slideOffset = openness * (l * 0.7);
  const tw = hw - 2;
  const tl = hl - 2;
  const thd = hd - 2;

  faces.push(
    // Tray Base
    {
      id: 'tray-base',
      name: 'Inner Tray Base',
      panelId: 'tray-base',
      vertices: [
        { x: -tw, y: -thd, z: tl + slideOffset },
        { x: tw, y: -thd, z: tl + slideOffset },
        { x: tw, y: -thd, z: -tl + slideOffset },
        { x: -tw, y: -thd, z: -tl + slideOffset },
      ],
    },
    // Tray Front Wall (Pull Tab End)
    {
      id: 'tray-front',
      name: 'Tray Front Wall',
      panelId: 'tray-top-wall',
      vertices: [
        { x: -tw, y: thd, z: tl + slideOffset },
        { x: tw, y: thd, z: tl + slideOffset },
        { x: tw, y: -thd, z: tl + slideOffset },
        { x: -tw, y: -thd, z: tl + slideOffset },
      ],
    },
    // Tray Rear Wall
    {
      id: 'tray-back',
      name: 'Tray Back Wall',
      panelId: 'tray-bottom-wall',
      vertices: [
        { x: tw, y: thd, z: -tl + slideOffset },
        { x: -tw, y: thd, z: -tl + slideOffset },
        { x: -tw, y: -thd, z: -tl + slideOffset },
        { x: tw, y: -thd, z: -tl + slideOffset },
      ],
    },
    // Tray Left Wall
    {
      id: 'tray-left',
      name: 'Tray Left Wall',
      panelId: 'tray-left-wall',
      vertices: [
        { x: -tw, y: thd, z: -tl + slideOffset },
        { x: -tw, y: thd, z: tl + slideOffset },
        { x: -tw, y: -thd, z: tl + slideOffset },
        { x: -tw, y: -thd, z: -tl + slideOffset },
      ],
    },
    // Tray Right Wall
    {
      id: 'tray-right',
      name: 'Tray Right Wall',
      panelId: 'tray-right-wall',
      vertices: [
        { x: tw, y: thd, z: tl + slideOffset },
        { x: tw, y: thd, z: -tl + slideOffset },
        { x: tw, y: -thd, z: -tl + slideOffset },
        { x: tw, y: -thd, z: tl + slideOffset },
      ],
    }
  );

  return faces;
}

// -------------------------------------------------------------
// 7. Round Food Tub 3D Geometry (Tapered Conical Cylinder with Lid)
// -------------------------------------------------------------
function buildRoundFoodTub3D(w: number, _l: number, d: number, openness: number): Face3DDefinition[] {
  const rTop = w / 2;
  const rBot = rTop * 0.78;
  const hd = d / 2;

  const numSegments = 16;
  const faces: Face3DDefinition[] = [];

  // Conical Tub Facets around perimeter
  for (let i = 0; i < numSegments; i++) {
    const th0 = (i / numSegments) * Math.PI * 2;
    const th1 = ((i + 1) / numSegments) * Math.PI * 2;

    const x0Top = rTop * Math.sin(th0);
    const z0Top = rTop * Math.cos(th0);
    const x1Top = rTop * Math.sin(th1);
    const z1Top = rTop * Math.cos(th1);

    const x0Bot = rBot * Math.sin(th0);
    const z0Bot = rBot * Math.cos(th0);
    const x1Bot = rBot * Math.sin(th1);
    const z1Bot = rBot * Math.cos(th1);

    const isRearSeam = i === Math.floor(numSegments / 2);

    faces.push({
      id: `tub-segment-${i}`,
      name: isRearSeam ? 'Glue Seam' : `Tub Wall (${Math.round((th0 * 180) / Math.PI)}°)`,
      panelId: isRearSeam ? 'tub-glue-seam' : 'tub-body',
      vertices: [
        { x: x0Top, y: hd, z: z0Top },
        { x: x1Top, y: hd, z: z1Top },
        { x: x1Bot, y: -hd, z: z1Bot },
        { x: x0Bot, y: -hd, z: z0Bot },
      ],
    });
  }

  // Bottom Base Disc (approx 8-point polygon)
  const botPts: Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2;
    botPts.push({ x: rBot * Math.sin(th), y: -hd, z: rBot * Math.cos(th) });
  }
  faces.push({
    id: 'tub-bottom',
    name: 'Bottom Disc',
    panelId: 'tub-bottom-disc',
    vertices: botPts,
  });

  // Top Lid (Lifts upward when openness > 0)
  const lidLift = hd + 4 + openness * 75;
  const rLid = rTop * 1.04;
  const lidPts: Vector3[] = [];
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2;
    lidPts.push({ x: rLid * Math.sin(th), y: lidLift, z: rLid * Math.cos(th) });
  }
  faces.push({
    id: 'tub-lid-top',
    name: 'Top Lid Disc',
    panelId: 'tub-lid-top',
    vertices: lidPts,
  });

  return faces;
}

// -------------------------------------------------------------
// 8. Stand-up Ziplock Pouch 3D Geometry
// -------------------------------------------------------------
function buildStandUpPouch3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // pouch height
  const hd = d / 2; // pouch depth / gusset

  return [
    // Front Face (puffed forward in +Z)
    {
      id: 'pouch-front',
      name: 'Front Face (Artwork)',
      panelId: 'pouch-front',
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: -hl, z: hd * 0.5 },
        { x: -hw, y: -hl, z: hd * 0.5 },
      ],
    },
    // Back Face (puffed backward in -Z)
    {
      id: 'pouch-back',
      name: 'Back Face',
      panelId: 'pouch-back',
      vertices: [
        { x: hw, y: hl, z: 0 },
        { x: -hw, y: hl, z: 0 },
        { x: -hw, y: -hl, z: -hd * 0.5 },
        { x: hw, y: -hl, z: -hd * 0.5 },
      ],
    },
    // Bottom Oval Gusset
    {
      id: 'pouch-gusset',
      name: 'Bottom Gusset',
      panelId: 'pouch-gusset',
      vertices: [
        { x: -hw, y: -hl, z: hd * 0.5 },
        { x: hw, y: -hl, z: hd * 0.5 },
        { x: hw, y: -hl, z: -hd * 0.5 },
        { x: -hw, y: -hl, z: -hd * 0.5 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 9. Side Gusset Bag 3D Geometry (Coffee / Cookie Bag)
// -------------------------------------------------------------
function buildSideGussetBag3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // height
  const hd = d / 2; // depth

  return [
    // Front Face
    {
      id: 'bag-front',
      name: 'Front Face (Window)',
      panelId: 'bag-front',
      vertices: [
        { x: -hw, y: hl, z: hd },
        { x: hw, y: hl, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: hd },
      ],
    },
    // Back Left Panel
    {
      id: 'bag-back-left',
      name: 'Back Left Panel',
      panelId: 'bag-back-left',
      vertices: [
        { x: 0, y: hl, z: -hd },
        { x: -hw, y: hl, z: -hd },
        { x: -hw, y: -hl, z: -hd },
        { x: 0, y: -hl, z: -hd },
      ],
    },
    // Back Right Panel
    {
      id: 'bag-back-right',
      name: 'Back Right Panel',
      panelId: 'bag-back-right',
      vertices: [
        { x: hw, y: hl, z: -hd },
        { x: 0, y: hl, z: -hd },
        { x: 0, y: -hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
      ],
    },
    // Left Pleated Gusset
    {
      id: 'bag-gusset-left',
      name: 'Left Gusset Side',
      panelId: 'bag-gusset-left',
      vertices: [
        { x: -hw, y: hl, z: -hd },
        { x: -hw, y: hl, z: hd },
        { x: -hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // Right Pleated Gusset
    {
      id: 'bag-gusset-right',
      name: 'Right Gusset Side',
      panelId: 'bag-gusset-right',
      vertices: [
        { x: hw, y: hl, z: hd },
        { x: hw, y: hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: hd },
      ],
    },
    // Block Bottom Base
    {
      id: 'bag-bottom',
      name: 'Block Bottom Base',
      panelId: 'bag-block-bottom',
      vertices: [
        { x: -hw, y: -hl, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: hw, y: -hl, z: -hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // Folded Tin-Tie Header
    {
      id: 'bag-top-header',
      name: 'Tin-Tie Folded Header',
      panelId: 'bag-top-header',
      vertices: [
        { x: -hw, y: hl + 18, z: 0 },
        { x: hw, y: hl + 18, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: -hw, y: hl, z: 0 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 10. Single-Serve Sachet Stick Pack 3D Geometry
// -------------------------------------------------------------
function buildSachetStickPack3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // length
  const hd = Math.max(8, d / 2);

  return [
    // Front Face
    {
      id: 'sachet-front',
      name: 'Front Face (Branding)',
      panelId: 'sachet-front',
      vertices: [
        { x: -hw, y: hl - 12, z: hd * 0.6 },
        { x: hw, y: hl - 12, z: hd * 0.6 },
        { x: hw, y: -hl + 12, z: hd * 0.6 },
        { x: -hw, y: -hl + 12, z: hd * 0.6 },
      ],
    },
    // Back Face
    {
      id: 'sachet-back',
      name: 'Back Face (Ingredients)',
      panelId: 'sachet-back-left',
      vertices: [
        { x: hw, y: hl - 12, z: -hd * 0.6 },
        { x: -hw, y: hl - 12, z: -hd * 0.6 },
        { x: -hw, y: -hl + 12, z: -hd * 0.6 },
        { x: hw, y: -hl + 12, z: -hd * 0.6 },
      ],
    },
    // Top Heat-Seal Crimp
    {
      id: 'sachet-top-seal',
      name: 'Top Heat-Seal Crimp',
      panelId: 'sachet-top-seal',
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: hl - 12, z: 0 },
        { x: -hw, y: hl - 12, z: 0 },
      ],
    },
    // Bottom Heat-Seal Crimp
    {
      id: 'sachet-bottom-seal',
      name: 'Bottom Heat-Seal Crimp',
      panelId: 'sachet-bottom-seal',
      vertices: [
        { x: -hw, y: -hl + 12, z: 0 },
        { x: hw, y: -hl + 12, z: 0 },
        { x: hw, y: -hl, z: 0 },
        { x: -hw, y: -hl, z: 0 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 11. Sliced Bread Loaf Bag 3D Geometry
// -------------------------------------------------------------
function buildBreadLoafBag3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // height
  const hd = d / 2; // depth

  return [
    // Front Clear Face (Window)
    {
      id: 'bread-front',
      name: 'Front Loaf Face (Window)',
      panelId: 'bread-front',
      vertices: [
        { x: -hw, y: hl * 0.8, z: hd },
        { x: hw, y: hl * 0.8, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: hd },
      ],
    },
    // Back Face
    {
      id: 'bread-back',
      name: 'Back Face',
      panelId: 'bread-back-left',
      vertices: [
        { x: hw, y: hl * 0.8, z: -hd },
        { x: -hw, y: hl * 0.8, z: -hd },
        { x: -hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
      ],
    },
    // Left Gusset
    {
      id: 'bread-gusset-left',
      name: 'Left Gusset Side',
      panelId: 'bread-gusset-left',
      vertices: [
        { x: -hw, y: hl * 0.8, z: -hd },
        { x: -hw, y: hl * 0.8, z: hd },
        { x: -hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // Right Gusset
    {
      id: 'bread-gusset-right',
      name: 'Right Gusset Side',
      panelId: 'bread-gusset-right',
      vertices: [
        { x: hw, y: hl * 0.8, z: hd },
        { x: hw, y: hl * 0.8, z: -hd },
        { x: hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: hd },
      ],
    },
    // Bottom Sealed Base
    {
      id: 'bread-bottom',
      name: 'Bottom Base',
      panelId: 'bread-bottom-seal',
      vertices: [
        { x: -hw, y: -hl, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: hw, y: -hl, z: -hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // Top Bunched Neck with Twist Tie
    {
      id: 'bread-top-header',
      name: 'Twist-Tie Gathered Neck',
      panelId: 'bread-top-header',
      vertices: [
        { x: -hw * 0.5, y: hl, z: 0 },
        { x: hw * 0.5, y: hl, z: 0 },
        { x: hw * 0.8, y: hl * 0.8, z: 0 },
        { x: -hw * 0.8, y: hl * 0.8, z: 0 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 12. Burger Wrapper Sheet 3D Geometry (Folded Wrap)
// -------------------------------------------------------------
function buildBurgerWrapper3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = Math.max(12, d / 2);

  return [
    // Central Wrap Target & Seal
    {
      id: 'wrapper-center',
      name: 'Central Wrap Target & Seal',
      panelId: 'wrapper-center',
      vertices: [
        { x: -hw * 0.6, y: hl * 0.6, z: hd },
        { x: hw * 0.6, y: hl * 0.6, z: hd },
        { x: hw * 0.6, y: -hl * 0.6, z: hd },
        { x: -hw * 0.6, y: -hl * 0.6, z: hd },
      ],
    },
    // Top Fold Flap
    {
      id: 'wrapper-top',
      name: 'Top Fold Flap',
      panelId: 'wrapper-top',
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw * 0.6, y: hl * 0.6, z: hd },
        { x: -hw * 0.6, y: hl * 0.6, z: hd },
      ],
    },
    // Bottom Fold Flap
    {
      id: 'wrapper-bottom',
      name: 'Bottom Fold Flap',
      panelId: 'wrapper-bottom',
      vertices: [
        { x: -hw * 0.6, y: -hl * 0.6, z: hd },
        { x: hw * 0.6, y: -hl * 0.6, z: hd },
        { x: hw, y: -hl, z: 0 },
        { x: -hw, y: -hl, z: 0 },
      ],
    },
    // Left Fold Flap
    {
      id: 'wrapper-left',
      name: 'Left Fold Flap',
      panelId: 'wrapper-left',
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: -hw * 0.6, y: hl * 0.6, z: hd },
        { x: -hw * 0.6, y: -hl * 0.6, z: hd },
        { x: -hw, y: -hl, z: 0 },
      ],
    },
    // Right Fold Flap
    {
      id: 'wrapper-right',
      name: 'Right Fold Flap',
      panelId: 'wrapper-right',
      vertices: [
        { x: hw * 0.6, y: hl * 0.6, z: hd },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: -hl, z: 0 },
        { x: hw * 0.6, y: -hl * 0.6, z: hd },
      ],
    },
  ];
}
