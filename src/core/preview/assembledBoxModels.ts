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
  const minDepth = templateId === 'pizza-box' ? 34 : templateId === 'sachet-stick-pack' ? 18 : 28;
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

  // Base tray: subtle draft angle (~2-3 degrees) for realistic paperboard carton look
  const bw = hw * 0.95;
  const bl = hl * 0.95;

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
      doubleSided: openness > 0.05,
      vertices: [
        { x: -hw, y: hd, z: hl },
        { x: hw, y: hd, z: hl },
        { x: bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: bl },
      ],
    },
    // Base Rear Hinge Wall (exterior facing -Z)
    {
      id: 'burger-rear-hinge',
      name: 'Rear Hinge Wall',
      panelId: 'rear-hinge',
      doubleSided: openness > 0.05,
      vertices: [
        { x: hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: -hl },
        { x: -bw, y: -hd, z: -bl },
        { x: bw, y: -hd, z: -bl },
      ],
    },
    // Base Left Wall (exterior facing -X)
    {
      id: 'burger-base-left',
      name: 'Base Left Wall',
      panelId: 'base-left',
      doubleSided: openness > 0.05,
      vertices: [
        { x: -hw, y: hd, z: -hl },
        { x: -hw, y: hd, z: hl },
        { x: -bw, y: -hd, z: bl },
        { x: -bw, y: -hd, z: -bl },
      ],
    },
    // Base Right Wall (exterior facing +X)
    {
      id: 'burger-base-right',
      name: 'Base Right Wall',
      panelId: 'base-right',
      doubleSided: openness > 0.05,
      vertices: [
        { x: hw, y: hd, z: hl },
        { x: hw, y: hd, z: -hl },
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

  // Top Lid assembly rotates around rear top hinge axis: (y = hd, z = -hl)
  const hingeY = hd;
  const hingeZ = -hl;
  const hingeAngle = (openness * 105 * Math.PI) / 180;
  const cosH = Math.cos(hingeAngle);
  const sinH = Math.sin(hingeAngle);

  // Rigid-body lid rotation around (hingeY, hingeZ)
  const rotLid = (p: Vector3): Vector3 => {
    const dy = p.y - hingeY;
    const dz = p.z - hingeZ;
    return {
      x: p.x,
      y: hingeY + dy * cosH + dz * sinH,
      z: hingeZ - dy * sinH + dz * cosH,
    };
  };

  // Lid has slight outer clearance to snugly fit over base tray
  const rw = hw * 1.01;
  const rl = hl * 1.01;
  const lidY = hd + 0.5;
  const tuckH = d * 0.55;
  const sideFlapH = d * 0.65;

  // Top Lid Main Panel (facing +Y)
  faces.push({
    id: 'burger-lid-top',
    name: 'Top Lid (Branding)',
    panelId: 'lid-top',
    doubleSided: openness > 0.05,
    vertices: [
      rotLid({ x: -rw, y: lidY, z: -rl }),
      rotLid({ x: rw, y: lidY, z: -rl }),
      rotLid({ x: rw, y: lidY, z: rl }),
      rotLid({ x: -rw, y: lidY, z: rl }),
    ],
  });

  // Lid Front Closure Flap (folds down 90° from lid front edge)
  faces.push({
    id: 'burger-lid-front',
    name: 'Lid Front Closure Flap',
    panelId: 'lid-front',
    doubleSided: true,
    vertices: [
      rotLid({ x: -rw, y: lidY, z: rl + 0.5 }),
      rotLid({ x: rw, y: lidY, z: rl + 0.5 }),
      rotLid({ x: rw * 0.94, y: lidY - tuckH, z: rl + 0.5 }),
      rotLid({ x: -rw * 0.94, y: lidY - tuckH, z: rl + 0.5 }),
    ],
  });

  // Lid Front Closure Lock Tab (protrudes downward from center of front flap)
  const tabW = rw * 0.42;
  faces.push({
    id: 'burger-lid-tab',
    name: 'Closure Lock Tab',
    panelId: 'lid-front',
    doubleSided: true,
    vertices: [
      rotLid({ x: -tabW, y: lidY - tuckH, z: rl + 0.5 }),
      rotLid({ x: tabW, y: lidY - tuckH, z: rl + 0.5 }),
      rotLid({ x: tabW * 0.75, y: lidY - tuckH - 12, z: rl + 0.5 }),
      rotLid({ x: -tabW * 0.75, y: lidY - tuckH - 12, z: rl + 0.5 }),
    ],
  });

  // Lid Left Flap (folds down 90° along left rim)
  faces.push({
    id: 'burger-lid-left',
    name: 'Lid Left Flap',
    panelId: 'lid-left',
    doubleSided: true,
    vertices: [
      rotLid({ x: -rw - 0.5, y: lidY, z: -rl }),
      rotLid({ x: -rw - 0.5, y: lidY, z: rl }),
      rotLid({ x: -rw - 0.5, y: lidY - sideFlapH, z: rl * 0.92 }),
      rotLid({ x: -rw - 0.5, y: lidY - sideFlapH, z: -rl * 0.92 }),
    ],
  });

  // Lid Right Flap (folds down 90° along right rim)
  faces.push({
    id: 'burger-lid-right',
    name: 'Lid Right Flap',
    panelId: 'lid-right',
    doubleSided: true,
    vertices: [
      rotLid({ x: rw + 0.5, y: lidY, z: rl }),
      rotLid({ x: rw + 0.5, y: lidY, z: -rl }),
      rotLid({ x: rw + 0.5, y: lidY - sideFlapH, z: -rl * 0.92 }),
      rotLid({ x: rw + 0.5, y: lidY - sideFlapH, z: rl * 0.92 }),
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
      doubleSided: openness > 0.05,
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
      doubleSided: openness > 0.05,
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
      doubleSided: openness > 0.05,
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
      name: 'Front Base Wall',
      panelId: 'pizza-base-front',
      doubleSided: openness > 0.05,
      vertices: [
        { x: -hw, y: hd, z: hl },
        { x: hw, y: hd, z: hl },
        { x: hw, y: -hd, z: hl },
        { x: -hw, y: -hd, z: hl },
      ],
    },
  ];

  // Inside bottom tray & roll-over inner walls visible when lid is opened
  if (openness > 0.05) {
    faces.push({
      id: 'pizza-tray-inside',
      name: 'Inside Pizza Tray',
      panelId: 'pizza-base',
      doubleSided: true,
      vertices: [
        { x: -hw + 2, y: -hd + 1, z: -hl + 2 },
        { x: hw - 2, y: -hd + 1, z: -hl + 2 },
        { x: hw - 2, y: -hd + 1, z: hl - 2 },
        { x: -hw + 2, y: -hd + 1, z: hl - 2 },
      ],
    });

    // Roll-Over Left Inner Wall
    faces.push({
      id: 'pizza-left-inner',
      name: 'Left Inner Wall (Roll-Over)',
      panelId: 'pizza-left-inner',
      doubleSided: true,
      vertices: [
        { x: -hw + 2, y: -hd + 1, z: hl - 2 },
        { x: -hw + 2, y: -hd + 1, z: -hl + 2 },
        { x: -hw + 2, y: hd, z: -hl + 2 },
        { x: -hw + 2, y: hd, z: hl - 2 },
      ],
    });

    // Roll-Over Right Inner Wall
    faces.push({
      id: 'pizza-right-inner',
      name: 'Right Inner Wall (Roll-Over)',
      panelId: 'pizza-right-inner',
      doubleSided: true,
      vertices: [
        { x: hw - 2, y: -hd + 1, z: -hl + 2 },
        { x: hw - 2, y: -hd + 1, z: hl - 2 },
        { x: hw - 2, y: hd, z: hl - 2 },
        { x: hw - 2, y: hd, z: -hl + 2 },
      ],
    });
  }

  // Top Lid rotates around rear top hinge: (y = hd, z = -hl)
  const hingeY = hd;
  const hingeZ = -hl;
  const hingeAngle = (openness * 105 * Math.PI) / 180;
  const cosH = Math.cos(hingeAngle);
  const sinH = Math.sin(hingeAngle);

  // Rigid-body lid rotation around (hingeY, hingeZ)
  const rotLid = (p: Vector3): Vector3 => {
    const dy = p.y - hingeY;
    const dz = p.z - hingeZ;
    return {
      x: p.x,
      y: hingeY + dy * cosH + dz * sinH,
      z: hingeZ - dy * sinH + dz * cosH,
    };
  };

  const lidY = hd + 0.5;
  const tuckH = d * 0.85;
  const sideFlapH = d * 0.75;

  // Top Lid Main Panel (facing +Y)
  faces.push({
    id: 'pizza-lid',
    name: 'Top Lid (Main)',
    panelId: 'pizza-lid',
    doubleSided: openness > 0.05,
    vertices: [
      rotLid({ x: -hw, y: lidY, z: -hl }),
      rotLid({ x: hw, y: lidY, z: -hl }),
      rotLid({ x: hw, y: lidY, z: hl }),
      rotLid({ x: -hw, y: lidY, z: hl }),
    ],
  });

  // Front Tuck Flap (folds down 90° at front edge)
  faces.push({
    id: 'pizza-lid-front',
    name: 'Lid Front Closure Flap',
    panelId: 'pizza-lid-front',
    doubleSided: true,
    vertices: [
      rotLid({ x: -hw, y: lidY, z: hl + 0.5 }),
      rotLid({ x: hw, y: lidY, z: hl + 0.5 }),
      rotLid({ x: hw * 0.95, y: lidY - tuckH, z: hl + 0.5 }),
      rotLid({ x: -hw * 0.95, y: lidY - tuckH, z: hl + 0.5 }),
    ],
  });

  // Left Lid Side Tuck Flap (folds down 90° along left rim)
  faces.push({
    id: 'pizza-lid-left',
    name: 'Lid Left Tuck Flap',
    panelId: 'pizza-lid-left',
    doubleSided: true,
    vertices: [
      rotLid({ x: -hw - 0.5, y: lidY, z: -hl }),
      rotLid({ x: -hw - 0.5, y: lidY, z: hl }),
      rotLid({ x: -hw - 0.5, y: lidY - sideFlapH, z: hl * 0.92 }),
      rotLid({ x: -hw - 0.5, y: lidY - sideFlapH, z: -hl * 0.92 }),
    ],
  });

  // Right Lid Side Tuck Flap (folds down 90° along right rim)
  faces.push({
    id: 'pizza-lid-right',
    name: 'Lid Right Tuck Flap',
    panelId: 'pizza-lid-right',
    doubleSided: true,
    vertices: [
      rotLid({ x: hw + 0.5, y: lidY, z: hl }),
      rotLid({ x: hw + 0.5, y: lidY, z: -hl }),
      rotLid({ x: hw + 0.5, y: lidY - sideFlapH, z: -hl * 0.92 }),
      rotLid({ x: hw + 0.5, y: lidY - sideFlapH, z: hl * 0.92 }),
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
  const hd = Math.max(16, d / 2); // thickness / bulge

  const sagitta = Math.min(hl * 0.16, hd * 0.85);

  return [
    // 1. Front Center Face (Bulging forward in +Z)
    {
      id: 'pillow-front',
      name: 'Front Face (Logo)',
      panelId: 'pillow-front',
      vertices: [
        { x: -hw * 0.65, y: hl - sagitta * 0.5, z: hd },
        { x: hw * 0.65, y: hl - sagitta * 0.5, z: hd },
        { x: hw * 0.65, y: -(hl - sagitta * 0.5), z: hd },
        { x: -hw * 0.65, y: -(hl - sagitta * 0.5), z: hd },
      ],
    },
    // 2. Front Left Bowed Flank
    {
      id: 'pillow-front-left',
      name: 'Front Left Flank',
      panelId: 'pillow-front',
      vertices: [
        { x: -hw, y: hl - sagitta * 0.8, z: 0 },
        { x: -hw * 0.65, y: hl - sagitta * 0.5, z: hd },
        { x: -hw * 0.65, y: -(hl - sagitta * 0.5), z: hd },
        { x: -hw, y: -(hl - sagitta * 0.8), z: 0 },
      ],
    },
    // 3. Front Right Bowed Flank
    {
      id: 'pillow-front-right',
      name: 'Front Right Flank',
      panelId: 'pillow-front',
      vertices: [
        { x: hw * 0.65, y: hl - sagitta * 0.5, z: hd },
        { x: hw, y: hl - sagitta * 0.8, z: 0 },
        { x: hw, y: -(hl - sagitta * 0.8), z: 0 },
        { x: hw * 0.65, y: -(hl - sagitta * 0.5), z: hd },
      ],
    },
    // 4. Back Center Face (Bulging backward in -Z)
    {
      id: 'pillow-back',
      name: 'Back Face',
      panelId: 'pillow-back',
      vertices: [
        { x: hw * 0.65, y: hl - sagitta * 0.5, z: -hd },
        { x: -hw * 0.65, y: hl - sagitta * 0.5, z: -hd },
        { x: -hw * 0.65, y: -(hl - sagitta * 0.5), z: -hd },
        { x: hw * 0.65, y: -(hl - sagitta * 0.5), z: -hd },
      ],
    },
    // 5. Back Left Bowed Flank
    {
      id: 'pillow-back-left',
      name: 'Back Left Flank',
      panelId: 'pillow-back',
      vertices: [
        { x: -hw * 0.65, y: hl - sagitta * 0.5, z: -hd },
        { x: -hw, y: hl - sagitta * 0.8, z: 0 },
        { x: -hw, y: -(hl - sagitta * 0.8), z: 0 },
        { x: -hw * 0.65, y: -(hl - sagitta * 0.5), z: -hd },
      ],
    },
    // 6. Back Right Bowed Flank
    {
      id: 'pillow-back-right',
      name: 'Back Right Flank',
      panelId: 'pillow-back',
      vertices: [
        { x: hw, y: hl - sagitta * 0.8, z: 0 },
        { x: hw * 0.65, y: hl - sagitta * 0.5, z: -hd },
        { x: hw * 0.65, y: -(hl - sagitta * 0.5), z: -hd },
        { x: hw, y: -(hl - sagitta * 0.8), z: 0 },
      ],
    },
    // 7. Top Front Curved Tuck Cap
    {
      id: 'pillow-top-front',
      name: 'Top Front Tuck Cap',
      panelId: 'pillow-top-outer',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.8, y: hl, z: 0 },
        { x: hw * 0.8, y: hl, z: 0 },
        { x: hw, y: hl - sagitta * 0.8, z: 0 },
        { x: hw * 0.65, y: hl - sagitta * 0.5, z: hd },
        { x: -hw * 0.65, y: hl - sagitta * 0.5, z: hd },
        { x: -hw, y: hl - sagitta * 0.8, z: 0 },
      ],
    },
    // 8. Top Back Curved Tuck Cap
    {
      id: 'pillow-top-back',
      name: 'Top Back Tuck Cap',
      panelId: 'pillow-top-inner',
      doubleSided: true,
      vertices: [
        { x: hw * 0.8, y: hl, z: 0 },
        { x: -hw * 0.8, y: hl, z: 0 },
        { x: -hw, y: hl - sagitta * 0.8, z: 0 },
        { x: -hw * 0.65, y: hl - sagitta * 0.5, z: -hd },
        { x: hw * 0.65, y: hl - sagitta * 0.5, z: -hd },
        { x: hw, y: hl - sagitta * 0.8, z: 0 },
      ],
    },
    // 9. Bottom Front Curved Tuck Cap
    {
      id: 'pillow-bottom-front',
      name: 'Bottom Front Tuck Cap',
      panelId: 'pillow-bottom-outer',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.65, y: -(hl - sagitta * 0.5), z: hd },
        { x: hw * 0.65, y: -(hl - sagitta * 0.5), z: hd },
        { x: hw, y: -(hl - sagitta * 0.8), z: 0 },
        { x: hw * 0.8, y: -hl, z: 0 },
        { x: -hw * 0.8, y: -hl, z: 0 },
        { x: -hw, y: -(hl - sagitta * 0.8), z: 0 },
      ],
    },
    // 10. Bottom Back Curved Tuck Cap
    {
      id: 'pillow-bottom-back',
      name: 'Bottom Back Tuck Cap',
      panelId: 'pillow-bottom-inner',
      doubleSided: true,
      vertices: [
        { x: hw * 0.65, y: -(hl - sagitta * 0.5), z: -hd },
        { x: -hw * 0.65, y: -(hl - sagitta * 0.5), z: -hd },
        { x: -hw, y: -(hl - sagitta * 0.8), z: 0 },
        { x: -hw * 0.8, y: -hl, z: 0 },
        { x: hw * 0.8, y: -hl, z: 0 },
        { x: hw, y: -(hl - sagitta * 0.8), z: 0 },
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
  const sealW = Math.max(8, w * 0.055); // side heat-seal fin width
  const headerH = Math.max(24, l * 0.16); // top zipper & tear notch header height
  const yHeaderBase = hl - headerH;
  const innerW = hw - sealW;

  return [
    // 1. Top Heat-Seal Zipper Header
    {
      id: 'pouch-top-seal',
      name: 'Top Zipper Seal Header',
      panelId: 'pouch-front',
      doubleSided: true,
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: yHeaderBase, z: 0 },
        { x: -hw, y: yHeaderBase, z: 0 },
      ],
    },
    // 2. Left Welded Side Seal Fin
    {
      id: 'pouch-seal-left',
      name: 'Left Welded Side Seal',
      panelId: 'pouch-front',
      doubleSided: true,
      vertices: [
        { x: -hw, y: yHeaderBase, z: 0 },
        { x: -innerW, y: yHeaderBase, z: 0 },
        { x: -innerW, y: -hl, z: 0 },
        { x: -hw, y: -hl, z: 0 },
      ],
    },
    // 3. Right Welded Side Seal Fin
    {
      id: 'pouch-seal-right',
      name: 'Right Welded Side Seal',
      panelId: 'pouch-front',
      doubleSided: true,
      vertices: [
        { x: innerW, y: yHeaderBase, z: 0 },
        { x: hw, y: yHeaderBase, z: 0 },
        { x: hw, y: -hl, z: 0 },
        { x: innerW, y: -hl, z: 0 },
      ],
    },
    // 4. Front Center Puffed Face
    {
      id: 'pouch-front',
      name: 'Front Face (Artwork)',
      panelId: 'pouch-front',
      vertices: [
        { x: -innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: innerW * 0.82, y: -hl, z: hd * 0.6 },
        { x: -innerW * 0.82, y: -hl, z: hd * 0.6 },
      ],
    },
    // 5. Front Left Taper Flank
    {
      id: 'pouch-front-left',
      name: 'Front Left Taper',
      panelId: 'pouch-front',
      vertices: [
        { x: -innerW, y: yHeaderBase, z: 0 },
        { x: -innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: -innerW * 0.82, y: -hl, z: hd * 0.6 },
        { x: -innerW, y: -hl, z: 0 },
      ],
    },
    // 6. Front Right Taper Flank
    {
      id: 'pouch-front-right',
      name: 'Front Right Taper',
      panelId: 'pouch-front',
      vertices: [
        { x: innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: innerW, y: yHeaderBase, z: 0 },
        { x: innerW, y: -hl, z: 0 },
        { x: innerW * 0.82, y: -hl, z: hd * 0.6 },
      ],
    },
    // 7. Back Center Puffed Face
    {
      id: 'pouch-back',
      name: 'Back Face',
      panelId: 'pouch-back',
      vertices: [
        { x: innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: -innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: -innerW * 0.82, y: -hl, z: -hd * 0.6 },
        { x: innerW * 0.82, y: -hl, z: -hd * 0.6 },
      ],
    },
    // 8. Back Left Taper Flank
    {
      id: 'pouch-back-left',
      name: 'Back Left Taper',
      panelId: 'pouch-back',
      vertices: [
        { x: -innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: -innerW, y: yHeaderBase, z: 0 },
        { x: -innerW, y: -hl, z: 0 },
        { x: -innerW * 0.82, y: -hl, z: -hd * 0.6 },
      ],
    },
    // 9. Back Right Taper Flank
    {
      id: 'pouch-back-right',
      name: 'Back Right Taper',
      panelId: 'pouch-back',
      vertices: [
        { x: innerW, y: yHeaderBase, z: 0 },
        { x: innerW * 0.75, y: yHeaderBase, z: 0 },
        { x: innerW * 0.82, y: -hl, z: -hd * 0.6 },
        { x: innerW, y: -hl, z: 0 },
      ],
    },
    // 10. Bottom Oval/Hex Expansion Gusset
    {
      id: 'pouch-gusset',
      name: 'Bottom Gusset',
      panelId: 'pouch-gusset',
      vertices: [
        { x: -innerW * 0.82, y: -hl, z: hd * 0.6 },
        { x: innerW * 0.82, y: -hl, z: hd * 0.6 },
        { x: innerW * 0.82, y: -hl, z: -hd * 0.6 },
        { x: -innerW * 0.82, y: -hl, z: -hd * 0.6 },
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
  const yShoulder = hl * 0.62;
  const yFold = hl * 0.86;

  return [
    // 1. Front Body Face (facing +Z)
    {
      id: 'bag-front',
      name: 'Front Face (Window)',
      panelId: 'bag-front',
      vertices: [
        { x: -hw, y: yShoulder, z: hd },
        { x: hw, y: yShoulder, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: hd },
      ],
    },
    // 2. Front Tapered Shoulder (sloping to tin-tie fold)
    {
      id: 'bag-front-shoulder',
      name: 'Front Tapered Shoulder',
      panelId: 'bag-front',
      vertices: [
        { x: -hw, y: yFold, z: 0 },
        { x: hw, y: yFold, z: 0 },
        { x: hw, y: yShoulder, z: hd },
        { x: -hw, y: yShoulder, z: hd },
      ],
    },
    // 3. Back Left Body Panel (facing -Z)
    {
      id: 'bag-back-left',
      name: 'Back Left Panel',
      panelId: 'bag-back-left',
      vertices: [
        { x: 0, y: yShoulder, z: -hd },
        { x: -hw, y: yShoulder, z: -hd },
        { x: -hw, y: -hl, z: -hd },
        { x: 0, y: -hl, z: -hd },
      ],
    },
    // 4. Back Right Body Panel (facing -Z)
    {
      id: 'bag-back-right',
      name: 'Back Right Panel',
      panelId: 'bag-back-right',
      vertices: [
        { x: hw, y: yShoulder, z: -hd },
        { x: 0, y: yShoulder, z: -hd },
        { x: 0, y: -hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
      ],
    },
    // 5. Back Left Tapered Shoulder
    {
      id: 'bag-back-left-shoulder',
      name: 'Back Left Shoulder',
      panelId: 'bag-back-left',
      vertices: [
        { x: 0, y: yFold, z: 0 },
        { x: -hw, y: yFold, z: 0 },
        { x: -hw, y: yShoulder, z: -hd },
        { x: 0, y: yShoulder, z: -hd },
      ],
    },
    // 6. Back Right Tapered Shoulder
    {
      id: 'bag-back-right-shoulder',
      name: 'Back Right Shoulder',
      panelId: 'bag-back-right',
      vertices: [
        { x: hw, y: yFold, z: 0 },
        { x: 0, y: yFold, z: 0 },
        { x: 0, y: yShoulder, z: -hd },
        { x: hw, y: yShoulder, z: -hd },
      ],
    },
    // 7. Left Pleated Gusset (Body)
    {
      id: 'bag-gusset-left',
      name: 'Left Gusset Side',
      panelId: 'bag-gusset-left',
      vertices: [
        { x: -hw, y: yShoulder, z: -hd },
        { x: -hw, y: yShoulder, z: hd },
        { x: -hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // 8. Left Pleated Gusset Shoulder (Tuck triangle)
    {
      id: 'bag-gusset-left-tuck',
      name: 'Left Gusset Tuck',
      panelId: 'bag-gusset-left',
      vertices: [
        { x: -hw, y: yFold, z: 0 },
        { x: -hw, y: yShoulder, z: hd },
        { x: -hw, y: yShoulder, z: -hd },
      ],
    },
    // 9. Right Pleated Gusset (Body)
    {
      id: 'bag-gusset-right',
      name: 'Right Gusset Side',
      panelId: 'bag-gusset-right',
      vertices: [
        { x: hw, y: yShoulder, z: hd },
        { x: hw, y: yShoulder, z: -hd },
        { x: hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: hd },
      ],
    },
    // 10. Right Pleated Gusset Shoulder (Tuck triangle)
    {
      id: 'bag-gusset-right-tuck',
      name: 'Right Gusset Tuck',
      panelId: 'bag-gusset-right',
      vertices: [
        { x: hw, y: yFold, z: 0 },
        { x: hw, y: yShoulder, z: -hd },
        { x: hw, y: yShoulder, z: hd },
      ],
    },
    // 11. Block Bottom Base (facing -Y)
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
    // 12. Folded Tin-Tie Header (Folded at yFold, standing upward)
    {
      id: 'bag-top-header',
      name: 'Tin-Tie Folded Header',
      panelId: 'bag-top-header',
      doubleSided: true,
      vertices: [
        { x: -hw, y: hl, z: 1 },
        { x: hw, y: hl, z: 1 },
        { x: hw, y: yFold, z: 1 },
        { x: -hw, y: yFold, z: 1 },
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
  const hd = Math.max(10, d / 2);
  const crimpH = Math.min(15, l * 0.12);
  const transH = Math.min(14, l * 0.10);
  const yTopCrimp = hl - crimpH;
  const yTopBody = yTopCrimp - transH;
  const yBotCrimp = -(hl - crimpH);
  const yBotBody = yBotCrimp + transH;

  return [
    // 1. Top Heat-Seal Crimp
    {
      id: 'sachet-top-seal',
      name: 'Top Heat-Seal Crimp',
      panelId: 'sachet-top-seal',
      doubleSided: true,
      vertices: [
        { x: -hw, y: hl, z: 0 },
        { x: hw, y: hl, z: 0 },
        { x: hw, y: yTopCrimp, z: 0 },
        { x: -hw, y: yTopCrimp, z: 0 },
      ],
    },
    // 2. Top Front Transition Shoulder
    {
      id: 'sachet-top-front-trans',
      name: 'Top Front Transition',
      panelId: 'sachet-front',
      vertices: [
        { x: -hw * 0.75, y: yTopCrimp, z: 0 },
        { x: hw * 0.75, y: yTopCrimp, z: 0 },
        { x: hw * 0.75, y: yTopBody, z: hd },
        { x: -hw * 0.75, y: yTopBody, z: hd },
      ],
    },
    // 3. Top Back Transition Shoulder
    {
      id: 'sachet-top-back-trans',
      name: 'Top Back Transition',
      panelId: 'sachet-back-left',
      vertices: [
        { x: hw * 0.75, y: yTopCrimp, z: 0 },
        { x: -hw * 0.75, y: yTopCrimp, z: 0 },
        { x: -hw * 0.75, y: yTopBody, z: -hd },
        { x: hw * 0.75, y: yTopBody, z: -hd },
      ],
    },
    // 4. Top Left Transition Corner
    {
      id: 'sachet-top-left-trans',
      name: 'Top Left Transition',
      panelId: 'sachet-front',
      vertices: [
        { x: -hw, y: yTopCrimp, z: 0 },
        { x: -hw * 0.75, y: yTopCrimp, z: 0 },
        { x: -hw * 0.75, y: yTopBody, z: hd },
        { x: -hw, y: yTopBody, z: 0 },
      ],
    },
    // 5. Top Right Transition Corner
    {
      id: 'sachet-top-right-trans',
      name: 'Top Right Transition',
      panelId: 'sachet-front',
      vertices: [
        { x: hw * 0.75, y: yTopCrimp, z: 0 },
        { x: hw, y: yTopCrimp, z: 0 },
        { x: hw, y: yTopBody, z: 0 },
        { x: hw * 0.75, y: yTopBody, z: hd },
      ],
    },
    // 6. Front Main Body (Bulging forward)
    {
      id: 'sachet-front',
      name: 'Front Face (Branding)',
      panelId: 'sachet-front',
      vertices: [
        { x: -hw * 0.75, y: yTopBody, z: hd },
        { x: hw * 0.75, y: yTopBody, z: hd },
        { x: hw * 0.75, y: yBotBody, z: hd },
        { x: -hw * 0.75, y: yBotBody, z: hd },
      ],
    },
    // 7. Front Left Rounded Flank
    {
      id: 'sachet-flank-front-left',
      name: 'Front Left Flank',
      panelId: 'sachet-front',
      vertices: [
        { x: -hw, y: yTopBody, z: 0 },
        { x: -hw * 0.75, y: yTopBody, z: hd },
        { x: -hw * 0.75, y: yBotBody, z: hd },
        { x: -hw, y: yBotBody, z: 0 },
      ],
    },
    // 8. Front Right Rounded Flank
    {
      id: 'sachet-flank-front-right',
      name: 'Front Right Flank',
      panelId: 'sachet-front',
      vertices: [
        { x: hw * 0.75, y: yTopBody, z: hd },
        { x: hw, y: yTopBody, z: 0 },
        { x: hw, y: yBotBody, z: 0 },
        { x: hw * 0.75, y: yBotBody, z: hd },
      ],
    },
    // 9. Back Left Fin Panel
    {
      id: 'sachet-back-left',
      name: 'Back Left Fin',
      panelId: 'sachet-back-left',
      vertices: [
        { x: 0, y: yTopBody, z: -hd },
        { x: -hw * 0.75, y: yTopBody, z: -hd },
        { x: -hw * 0.75, y: yBotBody, z: -hd },
        { x: 0, y: yBotBody, z: -hd },
      ],
    },
    // 10. Back Right Fin Panel
    {
      id: 'sachet-back-right',
      name: 'Back Right Fin',
      panelId: 'sachet-back-right',
      vertices: [
        { x: hw * 0.75, y: yTopBody, z: -hd },
        { x: 0, y: yTopBody, z: -hd },
        { x: 0, y: yBotBody, z: -hd },
        { x: hw * 0.75, y: yBotBody, z: -hd },
      ],
    },
    // 11. Back Left Rounded Flank
    {
      id: 'sachet-flank-back-left',
      name: 'Back Left Flank',
      panelId: 'sachet-back-left',
      vertices: [
        { x: -hw * 0.75, y: yTopBody, z: -hd },
        { x: -hw, y: yTopBody, z: 0 },
        { x: -hw, y: yBotBody, z: 0 },
        { x: -hw * 0.75, y: yBotBody, z: -hd },
      ],
    },
    // 12. Back Right Rounded Flank
    {
      id: 'sachet-flank-back-right',
      name: 'Back Right Flank',
      panelId: 'sachet-back-right',
      vertices: [
        { x: hw, y: yTopBody, z: 0 },
        { x: hw * 0.75, y: yTopBody, z: -hd },
        { x: hw * 0.75, y: yBotBody, z: -hd },
        { x: hw, y: yBotBody, z: 0 },
      ],
    },
    // 13. Bottom Front Transition Shoulder
    {
      id: 'sachet-bot-front-trans',
      name: 'Bottom Front Transition',
      panelId: 'sachet-front',
      vertices: [
        { x: -hw * 0.75, y: yBotBody, z: hd },
        { x: hw * 0.75, y: yBotBody, z: hd },
        { x: hw * 0.75, y: yBotCrimp, z: 0 },
        { x: -hw * 0.75, y: yBotCrimp, z: 0 },
      ],
    },
    // 14. Bottom Back Transition Shoulder
    {
      id: 'sachet-bot-back-trans',
      name: 'Bottom Back Transition',
      panelId: 'sachet-back-left',
      vertices: [
        { x: hw * 0.75, y: yBotBody, z: -hd },
        { x: -hw * 0.75, y: yBotBody, z: -hd },
        { x: -hw * 0.75, y: yBotCrimp, z: 0 },
        { x: hw * 0.75, y: yBotCrimp, z: 0 },
      ],
    },
    // 15. Bottom Heat-Seal Crimp
    {
      id: 'sachet-bottom-seal',
      name: 'Bottom Heat-Seal Crimp',
      panelId: 'sachet-bottom-seal',
      doubleSided: true,
      vertices: [
        { x: -hw, y: yBotCrimp, z: 0 },
        { x: hw, y: yBotCrimp, z: 0 },
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
  const yLoafTop = hl * 0.45;
  const yNeck = hl * 0.72;
  const neckW = hw * 0.28;
  const neckD = 4;

  return [
    // 1. Front Clear Face (Window & Brand)
    {
      id: 'bread-front',
      name: 'Front Loaf Face (Window)',
      panelId: 'bread-front',
      vertices: [
        { x: -hw, y: yLoafTop, z: hd },
        { x: hw, y: yLoafTop, z: hd },
        { x: hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: hd },
      ],
    },
    // 2. Front Gathered Shoulder (sloping to twist-tie neck)
    {
      id: 'bread-front-shoulder',
      name: 'Front Gathered Shoulder',
      panelId: 'bread-front',
      vertices: [
        { x: -neckW, y: yNeck, z: neckD },
        { x: neckW, y: yNeck, z: neckD },
        { x: hw, y: yLoafTop, z: hd },
        { x: -hw, y: yLoafTop, z: hd },
      ],
    },
    // 3. Back Body Face
    {
      id: 'bread-back',
      name: 'Back Face',
      panelId: 'bread-back-left',
      vertices: [
        { x: hw, y: yLoafTop, z: -hd },
        { x: -hw, y: yLoafTop, z: -hd },
        { x: -hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: -hd },
      ],
    },
    // 4. Back Gathered Shoulder (sloping to twist-tie neck)
    {
      id: 'bread-back-shoulder',
      name: 'Back Gathered Shoulder',
      panelId: 'bread-back-left',
      vertices: [
        { x: neckW, y: yNeck, z: -neckD },
        { x: -neckW, y: yNeck, z: -neckD },
        { x: -hw, y: yLoafTop, z: -hd },
        { x: hw, y: yLoafTop, z: -hd },
      ],
    },
    // 5. Left Gusset Side (Body)
    {
      id: 'bread-gusset-left',
      name: 'Left Gusset Side',
      panelId: 'bread-gusset-left',
      vertices: [
        { x: -hw, y: yLoafTop, z: -hd },
        { x: -hw, y: yLoafTop, z: hd },
        { x: -hw, y: -hl, z: hd },
        { x: -hw, y: -hl, z: -hd },
      ],
    },
    // 6. Left Gathered Gusset Shoulder
    {
      id: 'bread-gusset-left-shoulder',
      name: 'Left Gusset Shoulder',
      panelId: 'bread-gusset-left',
      vertices: [
        { x: -neckW, y: yNeck, z: -neckD },
        { x: -neckW, y: yNeck, z: neckD },
        { x: -hw, y: yLoafTop, z: hd },
        { x: -hw, y: yLoafTop, z: -hd },
      ],
    },
    // 7. Right Gusset Side (Body)
    {
      id: 'bread-gusset-right',
      name: 'Right Gusset Side',
      panelId: 'bread-gusset-right',
      vertices: [
        { x: hw, y: yLoafTop, z: hd },
        { x: hw, y: yLoafTop, z: -hd },
        { x: hw, y: -hl, z: -hd },
        { x: hw, y: -hl, z: hd },
      ],
    },
    // 8. Right Gathered Gusset Shoulder
    {
      id: 'bread-gusset-right-shoulder',
      name: 'Right Gusset Shoulder',
      panelId: 'bread-gusset-right',
      vertices: [
        { x: neckW, y: yNeck, z: neckD },
        { x: neckW, y: yNeck, z: -neckD },
        { x: hw, y: yLoafTop, z: -hd },
        { x: hw, y: yLoafTop, z: hd },
      ],
    },
    // 9. Bottom Sealed Base
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
    // 10. Twist-Tie Gathered Neck Clip
    {
      id: 'bread-twist-clip',
      name: 'Twist-Tie Clip',
      panelId: 'bread-top-header',
      doubleSided: true,
      vertices: [
        { x: -neckW * 1.2, y: yNeck + 3, z: neckD * 1.4 },
        { x: neckW * 1.2, y: yNeck + 3, z: neckD * 1.4 },
        { x: neckW * 1.2, y: yNeck - 3, z: neckD * 1.4 },
        { x: -neckW * 1.2, y: yNeck - 3, z: neckD * 1.4 },
      ],
    },
    // 11. Top Gathered Fan / Rosette Header
    {
      id: 'bread-top-header',
      name: 'Twist-Tie Gathered Neck',
      panelId: 'bread-top-header',
      doubleSided: true,
      vertices: [
        { x: -hw * 0.65, y: hl, z: 0 },
        { x: hw * 0.65, y: hl, z: 0 },
        { x: neckW, y: yNeck, z: 0 },
        { x: -neckW, y: yNeck, z: 0 },
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
  const cw = hw * 0.52;
  const cl = hl * 0.52;

  return [
    // 1. Central Wrap Target & Seal (top octagonal crown)
    {
      id: 'wrapper-center',
      name: 'Central Wrap Target & Seal',
      panelId: 'wrapper-center',
      vertices: [
        { x: -cw * 0.7, y: hd, z: -cl },
        { x: cw * 0.7, y: hd, z: -cl },
        { x: cw, y: hd, z: -cl * 0.7 },
        { x: cw, y: hd, z: cl * 0.7 },
        { x: cw * 0.7, y: hd, z: cl },
        { x: -cw * 0.7, y: hd, z: cl },
        { x: -cw, y: hd, z: cl * 0.7 },
        { x: -cw, y: hd, z: -cl * 0.7 },
      ],
    },
    // 2. Top Fold Flap
    {
      id: 'wrapper-top',
      name: 'Top Fold Flap',
      panelId: 'wrapper-top',
      vertices: [
        { x: -hw * 0.85, y: -hd * 0.35, z: -hl },
        { x: hw * 0.85, y: -hd * 0.35, z: -hl },
        { x: cw * 0.7, y: hd, z: -cl },
        { x: -cw * 0.7, y: hd, z: -cl },
      ],
    },
    // 3. Top-Left Corner Fold Tuck
    {
      id: 'wrapper-top-left',
      name: 'Top-Left Corner Fold',
      panelId: 'wrapper-top',
      vertices: [
        { x: -hw * 0.85, y: -hd * 0.35, z: -hl },
        { x: -cw * 0.7, y: hd, z: -cl },
        { x: -cw, y: hd, z: -cl * 0.7 },
        { x: -hw, y: -hd * 0.35, z: -hl * 0.85 },
      ],
    },
    // 4. Top-Right Corner Fold Tuck
    {
      id: 'wrapper-top-right',
      name: 'Top-Right Corner Fold',
      panelId: 'wrapper-top',
      vertices: [
        { x: cw * 0.7, y: hd, z: -cl },
        { x: hw * 0.85, y: -hd * 0.35, z: -hl },
        { x: hw, y: -hd * 0.35, z: -hl * 0.85 },
        { x: cw, y: hd, z: -cl * 0.7 },
      ],
    },
    // 5. Bottom Fold Flap
    {
      id: 'wrapper-bottom',
      name: 'Bottom Fold Flap',
      panelId: 'wrapper-bottom',
      vertices: [
        { x: -cw * 0.7, y: hd, z: cl },
        { x: cw * 0.7, y: hd, z: cl },
        { x: hw * 0.85, y: -hd * 0.35, z: hl },
        { x: -hw * 0.85, y: -hd * 0.35, z: hl },
      ],
    },
    // 6. Bottom-Left Corner Fold Tuck
    {
      id: 'wrapper-bot-left',
      name: 'Bottom-Left Corner Fold',
      panelId: 'wrapper-bottom',
      vertices: [
        { x: -hw, y: -hd * 0.35, z: hl * 0.85 },
        { x: -cw, y: hd, z: cl * 0.7 },
        { x: -cw * 0.7, y: hd, z: cl },
        { x: -hw * 0.85, y: -hd * 0.35, z: hl },
      ],
    },
    // 7. Bottom-Right Corner Fold Tuck
    {
      id: 'wrapper-bot-right',
      name: 'Bottom-Right Corner Fold',
      panelId: 'wrapper-bottom',
      vertices: [
        { x: cw, y: hd, z: cl * 0.7 },
        { x: hw, y: -hd * 0.35, z: hl * 0.85 },
        { x: hw * 0.85, y: -hd * 0.35, z: hl },
        { x: cw * 0.7, y: hd, z: cl },
      ],
    },
    // 8. Left Fold Flap
    {
      id: 'wrapper-left',
      name: 'Left Fold Flap',
      panelId: 'wrapper-left',
      vertices: [
        { x: -hw, y: -hd * 0.35, z: -hl * 0.85 },
        { x: -cw, y: hd, z: -cl * 0.7 },
        { x: -cw, y: hd, z: cl * 0.7 },
        { x: -hw, y: -hd * 0.35, z: hl * 0.85 },
      ],
    },
    // 9. Right Fold Flap
    {
      id: 'wrapper-right',
      name: 'Right Fold Flap',
      panelId: 'wrapper-right',
      vertices: [
        { x: cw, y: hd, z: -cl * 0.7 },
        { x: hw, y: -hd * 0.35, z: -hl * 0.85 },
        { x: hw, y: -hd * 0.35, z: hl * 0.85 },
        { x: cw, y: hd, z: cl * 0.7 },
      ],
    },
    // 10. Bottom Base (Resting surface)
    {
      id: 'wrapper-base',
      name: 'Bottom Base',
      panelId: 'wrapper-center',
      vertices: [
        { x: -hw * 0.85, y: -hd * 0.35, z: -hl },
        { x: -hw, y: -hd * 0.35, z: -hl * 0.85 },
        { x: -hw, y: -hd * 0.35, z: hl * 0.85 },
        { x: -hw * 0.85, y: -hd * 0.35, z: hl },
        { x: hw * 0.85, y: -hd * 0.35, z: hl },
        { x: hw, y: -hd * 0.35, z: hl * 0.85 },
        { x: hw, y: -hd * 0.35, z: -hl * 0.85 },
        { x: hw * 0.85, y: -hd * 0.35, z: -hl },
      ],
    },
  ];
}
