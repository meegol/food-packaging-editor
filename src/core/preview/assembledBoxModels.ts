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

  // Normalization scale so templates comfortably fill viewport (target ~220mm)
  const maxFootprint = Math.max(dimensions.width, dimensions.length, 1);
  const scale = 220 / maxFootprint;
  const w = dimensions.width * scale;
  const l = dimensions.length * scale;
  // Ensure vertical height is clearly legible even on flat packaging (e.g. pizza box or stick pack)
  const rawD = dimensions.depth * scale;
  const minDepth = templateId === 'pizza-box' ? 46 : templateId === 'sachet-stick-pack' ? 18 : 32;
  const d = Math.max(rawD, minDepth);

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
  const shadowY = cy + (d / 2) * 0.95 + 44;
  const shadowRx = Math.max(90, (w * 0.65 + l * 0.5) * 0.72);
  const shadowRy = Math.max(24, (w * 0.22 + l * 0.28) * 0.72);

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
export function buildBurgerBox3D(w: number, l: number, d: number, openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  // Base tray taper: bottom is 84% width and length of the rim
  const bw = hw * 0.84;
  const bl = hl * 0.84;

  const faces: Face3DDefinition[] = [
    // Base Bottom (exterior facing -Y)
    {
      id: 'burger-base-bottom',
      name: 'Base Bottom',
      panelId: 'base-bottom',
      vertices: [
        { x: -bw, y: -hd, z: bl },
        { x: bw, y: -hd, z: bl },
        { x: bw, y: -hd, z: -bl },
        { x: -bw, y: -hd, z: -bl },
      ],
    },
    // Base Front Wall (exterior facing +Z)
    {
      id: 'burger-base-front',
      name: 'Base Front Wall',
      panelId: 'base-front',
      vertices: [
        { x: -hw, y: 0, z: hl },
        { x: hw, y: 0, z: hl },
        { x: bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: bl },
      ],
    },
    // Base Rear Hinge Wall (exterior facing -Z)
    {
      id: 'burger-rear-hinge',
      name: 'Rear Hinge Wall',
      panelId: 'rear-hinge',
      vertices: [
        { x: hw, y: 0, z: -hl },
        { x: -hw, y: 0, z: -hl },
        { x: -bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: -bl },
      ],
    },
    // Base Left Wall (exterior facing -X)
    {
      id: 'burger-base-left',
      name: 'Base Left Wall',
      panelId: 'base-left',
      vertices: [
        { x: -hw, y: 0, z: -hl },
        { x: -hw, y: 0, z: hl },
        { x: -bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: -bl },
      ],
    },
    // Base Right Wall (exterior facing +X)
    {
      id: 'burger-base-right',
      name: 'Base Right Wall',
      panelId: 'base-right',
      vertices: [
        { x: hw, y: 0, z: hl },
        { x: hw, y: 0, z: -hl },
        { x: bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: bl },
      ],
    },
  ];

  // Inside bottom tray visible when lid is opened
  if (openness > 0.05) {
    faces.push({
      id: 'burger-base-inside-bottom',
      name: 'Base Interior',
      panelId: 'base-bottom',
      doubleSided: true,
      vertices: [
        { x: -bw + 1, y: -hd + 1, z: -bl + 1 },
        { x: bw - 1, y: -hd + 1, z: -bl + 1 },
        { x: bw - 1, y: -hd + 1, z: bl - 1 },
        { x: -bw + 1, y: -hd + 1, z: bl - 1 },
      ],
    });
  }

  // Top Lid assembly rotates around rear hinge axis: (y = 0, z = -hl)
  const hingeY = 0;
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

  // Lid has slight top taper (88% width and length)
  const lw = hw * 0.88;
  const ll = hl * 0.88;
  // Lid rim slightly overlaps base rim for clean fit
  const rw = hw * 1.02;
  const rl = hl * 1.02;

  // Top Lid Main Panel (facing +Y)
  faces.push({
    id: 'burger-lid-top',
    name: 'Top Lid (Branding)',
    panelId: 'lid-top',
    doubleSided: openness > 0.1,
    vertices: [
      rotLid({ x: -lw, y: hd, z: -ll }),
      rotLid({ x: lw, y: hd, z: -ll }),
      rotLid({ x: lw, y: hd, z: ll }),
      rotLid({ x: -lw, y: hd, z: ll }),
    ],
  });

  // Lid Front Wall (facing +Z)
  faces.push({
    id: 'burger-lid-front',
    name: 'Lid Front Flap',
    panelId: 'lid-front',
    doubleSided: openness > 0.1,
    vertices: [
      rotLid({ x: -lw, y: hd, z: ll }),
      rotLid({ x: lw, y: hd, z: ll }),
      rotLid({ x: rw, y: 0, z: rl }),
      rotLid({ x: -rw, y: 0, z: rl }),
    ],
  });

  // Lid Front Closure Lock Tab (protrudes downward from front rim)
  faces.push({
    id: 'burger-lid-tab',
    name: 'Closure Lock Tab',
    panelId: 'lid-front',
    doubleSided: true,
    vertices: [
      rotLid({ x: -hw * 0.45, y: 0, z: rl }),
      rotLid({ x: hw * 0.45, y: 0, z: rl }),
      rotLid({ x: hw * 0.38, y: -12, z: rl + 1 }),
      rotLid({ x: -hw * 0.38, y: -12, z: rl + 1 }),
    ],
  });

  // Lid Left Flap (facing -X)
  faces.push({
    id: 'burger-lid-left',
    name: 'Lid Left Flap',
    panelId: 'lid-left',
    doubleSided: openness > 0.1,
    vertices: [
      rotLid({ x: -rw, y: 0, z: -rl }),
      rotLid({ x: -rw, y: 0, z: rl }),
      rotLid({ x: -lw, y: hd, z: ll }),
      rotLid({ x: -lw, y: hd, z: -ll }),
    ],
  });

  // Lid Right Flap (facing +X)
  faces.push({
    id: 'burger-lid-right',
    name: 'Lid Right Flap',
    panelId: 'lid-right',
    doubleSided: openness > 0.1,
    vertices: [
      rotLid({ x: rw, y: 0, z: rl }),
      rotLid({ x: rw, y: 0, z: -rl }),
      rotLid({ x: lw, y: hd, z: -ll }),
      rotLid({ x: lw, y: hd, z: ll }),
    ],
  });

  // Lid Rear Wall (facing -Z)
  faces.push({
    id: 'burger-lid-rear',
    name: 'Lid Rear Wall',
    panelId: 'rear-hinge',
    doubleSided: openness > 0.1,
    vertices: [
      rotLid({ x: lw, y: hd, z: -ll }),
      rotLid({ x: -lw, y: hd, z: -ll }),
      rotLid({ x: -hw, y: 0, z: -hl }),
      rotLid({ x: hw, y: 0, z: -hl }),
    ],
  });

  return faces;
}

// -------------------------------------------------------------
// 2. Pizza Box 3D Geometry (Roll-End Corrugated Box)
// -------------------------------------------------------------
export function buildPizzaBox3D(w: number, l: number, d: number, openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  const faces: Face3DDefinition[] = [
    // Bottom Base (facing -Y)
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
    // Rear Wall (facing -Z)
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
    // Left Outer Sidewall (facing -X)
    {
      id: 'pizza-left-outer',
      name: 'Left Outer Wall',
      panelId: 'pizza-left-outer',
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: hl },
        { x: -hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: -hl },
      ],
    },
    // Right Outer Sidewall (facing +X)
    {
      id: 'pizza-right-outer',
      name: 'Right Outer Wall',
      panelId: 'pizza-right-outer',
      vertices: [
        { x: hw, y: hd, z: hl },
        { x: hw, y: hd, z: -hl },
        { x: hw, y: -hd, z: -hl },
        { x: hw, y: -hd, z: hl },
      ],
    },
    // Front Base Wall (facing +Z)
    {
      id: 'pizza-front-wall',
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

  // Inside bottom tray visible when lid is opened
  if (openness > 0.05) {
    faces.push({
      id: 'pizza-tray-inside',
      name: 'Inside Pizza Tray',
      panelId: 'pizza-base',
      doubleSided: true,
      vertices: [
        { x: -hw + 3, y: -hd + 1, z: -hl + 3 },
        { x: hw - 3, y: -hd + 1, z: -hl + 3 },
        { x: hw - 3, y: -hd + 1, z: hl - 3 },
        { x: -hw + 3, y: -hd + 1, z: hl - 3 },
      ],
    });
  }

  // Top Lid rotates around rear top hinge: (y = hd, z = -hl)
  const hingeY = hd;
  const hingeZ = -hl;
  const hingeAngle = (openness * 105 * Math.PI) / 180;
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

  // Top Lid Main Panel (facing +Y)
  faces.push({
    id: 'pizza-lid',
    name: 'Top Lid (Main)',
    panelId: 'pizza-lid',
    doubleSided: openness > 0.1,
    vertices: [
      rotLid({ x: -hw, y: hd, z: -hl }),
      rotLid({ x: hw, y: hd, z: -hl }),
      rotLid({ x: hw, y: hd, z: hl }),
      rotLid({ x: -hw, y: hd, z: hl }),
    ],
  });

  // Front Tuck Flap (folds down at front edge)
  faces.push({
    id: 'pizza-lid-front',
    name: 'Lid Front Tuck Flap',
    panelId: 'pizza-lid-front',
    doubleSided: true,
    vertices: [
      rotLid({ x: -hw, y: hd, z: hl }),
      rotLid({ x: hw, y: hd, z: hl }),
      rotLid({ x: hw * 0.98, y: -hd + 2, z: hl }),
      rotLid({ x: -hw * 0.98, y: -hd + 2, z: hl }),
    ],
  });

  // Left Lid Side Flap
  faces.push({
    id: 'pizza-lid-left',
    name: 'Lid Left Side Flap',
    panelId: 'pizza-lid-left',
    doubleSided: true,
    vertices: [
      rotLid({ x: -hw, y: hd, z: -hl }),
      rotLid({ x: -hw, y: hd, z: hl }),
      rotLid({ x: -hw + 2, y: -hd + 4, z: hl }),
      rotLid({ x: -hw + 2, y: -hd + 4, z: -hl }),
    ],
  });

  // Right Lid Side Flap
  faces.push({
    id: 'pizza-lid-right',
    name: 'Lid Right Side Flap',
    panelId: 'pizza-lid-right',
    doubleSided: true,
    vertices: [
      rotLid({ x: hw, y: hd, z: hl }),
      rotLid({ x: hw, y: hd, z: -hl }),
      rotLid({ x: hw - 2, y: -hd + 4, z: -hl }),
      rotLid({ x: hw - 2, y: -hd + 4, z: hl }),
    ],
  });

  return faces;
}

// -------------------------------------------------------------
// 3. Sandwich Wedge Box 3D Geometry (Right-Triangular Prism)
// -------------------------------------------------------------
export function buildSandwichWedge3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // vertical prism height
  const hd = d / 2; // base depth

  return [
    // 1. Horizontal Base (bottom Y = -hl, facing -Y)
    {
      id: 'sandwich-base',
      name: 'Bottom Base',
      panelId: 'sandwich-base',
      vertices: [
        { x: -hw, y: -hl, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: hw, y: -hl, z: -hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // 2. Vertical Rear Spine (at Z = -hd, facing -Z)
    {
      id: 'sandwich-back',
      name: 'Back Spine (Branding)',
      panelId: 'sandwich-back',
      vertices: [
        { x: hw, y: hl, z: -hd },
        { x: -hw, y: hl, z: -hd },
        { x: -hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
      ],
    },
    // 3. Slanted Front Face with Window (Hypotenuse from apex down to front base)
    {
      id: 'sandwich-front',
      name: 'Front Window Face',
      panelId: 'sandwich-front',
      vertices: [
        { x: -hw, y: hl, z: -hd },
        { x: hw, y: hl, z: -hd },
        { x: hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: hd },
      ],
    },
    // 4. Left Triangular Side (at X = -hw, facing -X)
    {
      id: 'sandwich-left-side',
      name: 'Left Triangular Side',
      panelId: 'sandwich-left-side',
      vertices: [
        { x: -hw, y: hl, z: -hd },
        { x: -hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // 5. Right Triangular Side (at X = +hw, facing +X)
    {
      id: 'sandwich-right-side',
      name: 'Right Triangular Side',
      panelId: 'sandwich-right-side',
      vertices: [
        { x: hw, y: hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: hd },
      ],
    },
    // 6. Top Apex Tuck Flap (small fold tab at apex)
    {
      id: 'sandwich-tuck-flap',
      name: 'Apex Tuck Flap',
      panelId: 'sandwich-tuck-flap',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.8, y: hl + 8, z: -hd },
        { x: hw * 0.8, y: hl + 8, z: -hd },
        { x: hw, y: hl, z: -hd },
        { x: -hw, y: hl, z: -hd },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 4. French Fries Scoop Box 3D Geometry (Curved Front & Arched Back)
// -------------------------------------------------------------
export function buildFriesScoop3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // scoop depth
  const hd = d / 2; // scoop height

  // Tapered base bottom
  const bw = hw * 0.74;
  const bl = hl * 0.74;

  const faces: Face3DDefinition[] = [
    // Bottom Base (facing -Y)
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
    // Tall Back Arched Wall (doubleSided so inside is visible from front!)
    {
      id: 'fries-back',
      name: 'Back Scoop Wall',
      panelId: 'fries-back',
      doubleSided: true,
      vertices: [
        { x: hw, y: hd * 1.35, z: -hl },
        { x: -hw, y: hd * 1.35, z: -hl },
        { x: -bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: -bl },
      ],
    },
    // Low Front Scoop Face (with curved lip)
    {
      id: 'fries-front',
      name: 'Front Scoop Lip',
      panelId: 'fries-front',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: bl },
      ],
    },
    // Left Tapered Side Wall
    {
      id: 'fries-left',
      name: 'Left Tapered Side',
      panelId: 'fries-left',
      doubleSided: true,
      vertices: [
        { x: -hw, y: hd * 1.35, z: -hl },
        { x: -hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: -bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: -bl },
      ],
    },
    // Right Tapered Side Wall
    {
      id: 'fries-right',
      name: 'Right Tapered Side',
      panelId: 'fries-right',
      doubleSided: true,
      vertices: [
        { x: hw * 0.95, y: -hd + d * 0.45, z: hl },
        { x: hw, y: hd * 1.35, z: -hl },
        { x: bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: bl },
      ],
    },
  ];

  return faces;
}

// -------------------------------------------------------------
// 5. Pillow Box 3D Geometry (Convex Curved Pillow)
// -------------------------------------------------------------
export function buildPillowBox3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // length along Y
  const hd = d / 2; // thickness / bulge

  const bulgeZ = Math.max(16, hd * 0.95);

  return [
    // Front Face (Bulging in +Z)
    {
      id: 'pillow-front',
      name: 'Front Face (Logo)',
      panelId: 'pillow-front',
      vertices: [
        { x: -hw, y: hl * 0.85, z: bulgeZ * 0.3 },
        { x: hw, y: hl * 0.85, z: bulgeZ * 0.3 },
        { x: hw * 0.95, y: -hl * 0.85, z: bulgeZ * 0.3 },
        { x: -hw * 0.95, y: -hl * 0.85, z: bulgeZ * 0.3 },
      ],
    },
    // Back Face (Bulging in -Z)
    {
      id: 'pillow-back',
      name: 'Back Face',
      panelId: 'pillow-back',
      vertices: [
        { x: hw, y: hl * 0.85, z: -bulgeZ * 0.3 },
        { x: -hw, y: hl * 0.85, z: -bulgeZ * 0.3 },
        { x: -hw * 0.95, y: -hl * 0.85, z: -bulgeZ * 0.3 },
        { x: hw * 0.95, y: -hl * 0.85, z: -bulgeZ * 0.3 },
      ],
    },
    // Top Curved Tuck End Cap
    {
      id: 'pillow-top',
      name: 'Top Tuck Cap',
      panelId: 'pillow-top-outer',
      doubleSided: true,
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: hl * 0.85, z: bulgeZ * 0.3 },
        { x: -hw, y: hl * 0.85, z: bulgeZ * 0.3 },
      ],
    },
    // Bottom Curved Tuck End Cap
    {
      id: 'pillow-bottom',
      name: 'Bottom Tuck Cap',
      panelId: 'pillow-bottom-outer',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.95, y: -hl * 0.85, z: bulgeZ * 0.3 },
        { x: hw * 0.95, y: -hl * 0.85, z: bulgeZ * 0.3 },
        { x: hw, y: -hl, z: 0 },
        { x: -hw, y: -hl, z: 0 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 6. Dessert Sleeve Box 3D Geometry (Outer Sleeve + Sliding Inner Tray)
// -------------------------------------------------------------
export function buildDessertSleeve3D(w: number, l: number, d: number, openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = d / 2;

  const faces: Face3DDefinition[] = [
    // Outer Sleeve Top (facing +Y)
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
    // Outer Sleeve Bottom (facing -Y)
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
    // Outer Sleeve Left Wall (facing -X)
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
    // Outer Sleeve Right Wall (facing +X)
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

  // Inner Sliding Tray slides forward along +Z axis
  const slideOffset = openness * (l * 0.72);
  const tw = hw - 2;
  const tl = hl - 2;
  const thd = hd - 2;

  // Inner Tray Base
  faces.push({
    id: 'tray-base',
    name: 'Inner Tray Base',
    panelId: 'tray-base',
    doubleSided: true,
    vertices: [
      { x: -tw, y: -thd, z: tl + slideOffset },
      { x: tw, y: -thd, z: tl + slideOffset },
      { x: tw, y: -thd, z: -tl + slideOffset },
      { x: -tw, y: -thd, z: -tl + slideOffset },
    ],
  });

  // Tray Front Wall with Finger Pull Tab
  faces.push({
    id: 'tray-front',
    name: 'Tray Front Wall',
    panelId: 'tray-top-wall',
    doubleSided: true,
    vertices: [
      { x: -tw, y: thd, z: tl + slideOffset },
      { x: tw, y: thd, z: tl + slideOffset },
      { x: tw, y: -thd, z: tl + slideOffset },
      { x: -tw, y: -thd, z: tl + slideOffset },
    ],
  });

  // Tray Rear Wall
  faces.push({
    id: 'tray-back',
    name: 'Tray Back Wall',
    panelId: 'tray-bottom-wall',
    doubleSided: true,
    vertices: [
      { x: tw, y: thd, z: -tl + slideOffset },
      { x: -tw, y: thd, z: -tl + slideOffset },
      { x: -tw, y: -thd, z: -tl + slideOffset },
      { x: tw, y: -thd, z: -tl + slideOffset },
    ],
  });

  // Tray Left Wall
  faces.push({
    id: 'tray-left',
    name: 'Tray Left Wall',
    panelId: 'tray-left-wall',
    doubleSided: true,
    vertices: [
      { x: -tw, y: thd, z: -tl + slideOffset },
      { x: -tw, y: thd, z: tl + slideOffset },
      { x: -tw, y: -thd, z: tl + slideOffset },
      { x: -tw, y: -thd, z: -tl + slideOffset },
    ],
  });

  // Tray Right Wall
  faces.push({
    id: 'tray-right',
    name: 'Tray Right Wall',
    panelId: 'tray-right-wall',
    doubleSided: true,
    vertices: [
      { x: tw, y: thd, z: tl + slideOffset },
      { x: tw, y: thd, z: -tl + slideOffset },
      { x: tw, y: -thd, z: -tl + slideOffset },
      { x: tw, y: -thd, z: tl + slideOffset },
    ],
  });

  return faces;
}

// -------------------------------------------------------------
// 7. Round Food Tub 3D Geometry (Tapered Conical Cylinder with Lid)
// -------------------------------------------------------------
export function buildRoundFoodTub3D(w: number, _l: number, d: number, openness: number): Face3DDefinition[] {
  const rTop = w / 2;
  const rBot = rTop * 0.78;
  const hd = d / 2;

  const numSegments = 16;
  const faces: Face3DDefinition[] = [];

  // Conical Tub Perimeter Facets
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
      doubleSided: openness > 0.05,
      vertices: [
        { x: x0Top, y: hd, z: z0Top },
        { x: x1Top, y: hd, z: z1Top },
        { x: x1Bot, y: -hd, z: z1Bot },
        { x: x0Bot, y: -hd, z: z0Bot },
      ],
    });
  }

  // Bottom Base Disc
  const botPts: Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2;
    botPts.push({ x: rBot * Math.sin(th), y: -hd, z: rBot * Math.cos(th) });
  }
  faces.push({
    id: 'tub-bottom',
    name: 'Bottom Disc',
    panelId: 'tub-bottom-disc',
    doubleSided: true,
    vertices: botPts,
  });

  // Top Lid (Lifts upward when openness > 0)
  const lidLift = hd + 3 + openness * 75;
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
    doubleSided: true,
    vertices: lidPts,
  });

  return faces;
}

// -------------------------------------------------------------
// 8. Stand-up Ziplock Pouch 3D Geometry
// -------------------------------------------------------------
export function buildStandUpPouch3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // pouch height
  const hd = Math.max(22, d / 2); // gusset depth

  return [
    // Front Face (puffed forward in +Z)
    {
      id: 'pouch-front',
      name: 'Front Face (Artwork)',
      panelId: 'pouch-front',
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw * 0.94, y: -hl, z: hd * 0.6 },
        { x: -hw * 0.94, y: -hl, z: hd * 0.6 },
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
        { x: -hw * 0.94, y: -hl, z: -hd * 0.6 },
        { x: hw * 0.94, y: -hl, z: -hd * 0.6 },
      ],
    },
    // Bottom Oval/Hex Expansion Gusset
    {
      id: 'pouch-gusset',
      name: 'Bottom Gusset',
      panelId: 'pouch-gusset',
      vertices: [
        { x: -hw * 0.94, y: -hl, z: hd * 0.6 },
        { x: hw * 0.94, y: -hl, z: hd * 0.6 },
        { x: hw * 0.94, y: -hl, z: -hd * 0.6 },
        { x: -hw * 0.94, y: -hl, z: -hd * 0.6 },
      ],
    },
    // Top Heat-Seal Header
    {
      id: 'pouch-top-seal',
      name: 'Top Zipper Seal Header',
      panelId: 'pouch-front',
      doubleSided: true,
      vertices: [
        { x: -hw, y: hl + 16, z: 0 },
        { x: hw, y: hl + 16, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: -hw, y: hl, z: 0 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 9. Side Gusset Bag 3D Geometry (Coffee / Cookie Bag)
// -------------------------------------------------------------
export function buildSideGussetBag3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // height
  const hd = d / 2; // depth

  return [
    // Front Face (facing +Z)
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
    // Back Left Panel (facing -Z)
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
    // Back Right Panel (facing -Z)
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
    // Left Pleated Gusset (facing -X)
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
    // Right Pleated Gusset (facing +X)
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
    // Block Bottom Base (facing -Y)
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
    // Folded Tin-Tie Header (facing +Z)
    {
      id: 'bag-top-header',
      name: 'Tin-Tie Folded Header',
      panelId: 'bag-top-header',
      doubleSided: true,
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
export function buildSachetStickPack3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // length
  const hd = Math.max(12, d / 2);

  return [
    // Front Face (puffed slightly forward)
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
    // Back Face (puffed backward with fin seal)
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
      doubleSided: true,
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
      doubleSided: true,
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
export function buildBreadLoafBag3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2; // bag height
  const hd = d / 2; // depth

  return [
    // Front Clear Face (Window)
    {
      id: 'bread-front',
      name: 'Front Loaf Face (Window)',
      panelId: 'bread-front',
      vertices: [
        { x: -hw, y: hl * 0.75, z: hd },
        { x: hw, y: hl * 0.75, z: hd },
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
        { x: hw, y: hl * 0.75, z: -hd },
        { x: -hw, y: hl * 0.75, z: -hd },
        { x: -hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
      ],
    },
    // Left Gusset Side
    {
      id: 'bread-gusset-left',
      name: 'Left Gusset Side',
      panelId: 'bread-gusset-left',
      vertices: [
        { x: -hw, y: hl * 0.75, z: -hd },
        { x: -hw, y: hl * 0.75, z: hd },
        { x: -hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // Right Gusset Side
    {
      id: 'bread-gusset-right',
      name: 'Right Gusset Side',
      panelId: 'bread-gusset-right',
      vertices: [
        { x: hw, y: hl * 0.75, z: hd },
        { x: hw, y: hl * 0.75, z: -hd },
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
    // Top Gathered Neck with Twist Tie Clip
    {
      id: 'bread-top-header',
      name: 'Twist-Tie Gathered Neck',
      panelId: 'bread-top-header',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.45, y: hl, z: 0 },
        { x: hw * 0.45, y: hl, z: 0 },
        { x: hw, y: hl * 0.75, z: 0 },
        { x: -hw, y: hl * 0.75, z: 0 },
      ],
    },
  ];
}

// -------------------------------------------------------------
// 12. Burger Wrapper Sheet 3D Geometry (Folded Wrap)
// -------------------------------------------------------------
export function buildBurgerWrapper3D(w: number, l: number, d: number, _openness: number): Face3DDefinition[] {
  const hw = w / 2;
  const hl = l / 2;
  const hd = Math.max(16, d / 2);

  return [
    // Central Wrap Target & Seal (top facing)
    {
      id: 'wrapper-center',
      name: 'Central Wrap Target & Seal',
      panelId: 'wrapper-center',
      vertices: [
        { x: -hw * 0.55, y: hd, z: -hl * 0.55 },
        { x: hw * 0.55, y: hd, z: -hl * 0.55 },
        { x: hw * 0.55, y: hd, z: hl * 0.55 },
        { x: -hw * 0.55, y: hd, z: hl * 0.55 },
      ],
    },
    // Top Fold Flap
    {
      id: 'wrapper-top',
      name: 'Top Fold Flap',
      panelId: 'wrapper-top',
      vertices: [
        { x: -hw, y: 0, z: -hl },
        { x: hw, y: 0, z: -hl },
        { x: hw * 0.55, y: hd, z: -hl * 0.55 },
        { x: -hw * 0.55, y: hd, z: -hl * 0.55 },
      ],
    },
    // Bottom Fold Flap
    {
      id: 'wrapper-bottom',
      name: 'Bottom Fold Flap',
      panelId: 'wrapper-bottom',
      vertices: [
        { x: -hw * 0.55, y: hd, z: hl * 0.55 },
        { x: hw * 0.55, y: hd, z: hl * 0.55 },
        { x: hw, y: 0, z: hl },
        { x: -hw, y: 0, z: hl },
      ],
    },
    // Left Fold Flap
    {
      id: 'wrapper-left',
      name: 'Left Fold Flap',
      panelId: 'wrapper-left',
      vertices: [
        { x: -hw, y: 0, z: -hl },
        { x: -hw * 0.55, y: hd, z: -hl * 0.55 },
        { x: -hw * 0.55, y: hd, z: hl * 0.55 },
        { x: -hw, y: 0, z: hl },
      ],
    },
    // Right Fold Flap
    {
      id: 'wrapper-right',
      name: 'Right Fold Flap',
      panelId: 'wrapper-right',
      vertices: [
        { x: hw * 0.55, y: hd, z: -hl * 0.55 },
        { x: hw, y: 0, z: -hl },
        { x: hw, y: 0, z: hl },
        { x: hw * 0.55, y: hd, z: hl * 0.55 },
      ],
    },
  ];
}
