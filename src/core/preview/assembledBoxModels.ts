import { PackagingDimensions, PanelFace } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { AssembledFaceData, AssembledModelResult, PreviewSettings, ViewAngle } from './previewTypes';
import { mapPanelGraphicsToFace } from './graphicProjection';

/**
 * Generates the assembled 3D perspective / 2.5D model for any of the 12 packaging templates.
 */
export function generateAssembledModel(
  templateId: string,
  dimensions: PackagingDimensions,
  panels: PanelFace[],
  graphics: GraphicItem[],
  settings: PreviewSettings
): AssembledModelResult {
  const { viewAngle, openness } = settings;
  const panelMap = new Map(panels.map(p => [p.id, p]));

  // Base canvas coordinate center
  const cx = 400;
  const cy = 340;

  switch (templateId) {
    case 'burger-box':
      return buildBurgerBoxModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'pizza-box':
      return buildPizzaBoxModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'sandwich-wedge-box':
      return buildSandwichWedgeModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'fries-scoop-box':
      return buildFriesScoopModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'pillow-box':
      return buildPillowBoxModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'dessert-sleeve-box':
      return buildDessertSleeveModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'round-food-tub':
      return buildRoundFoodTubModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'standup-pouch':
      return buildStandUpPouchModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'side-gusset-bag':
      return buildSideGussetBagModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'sachet-stick-pack':
      return buildSachetStickPackModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'bread-loaf-bag':
      return buildBreadLoafBagModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
    case 'burger-wrapper':
    default:
      return buildBurgerWrapperModel(dimensions, panelMap, graphics, viewAngle, openness, cx, cy);
  }
}

// -------------------------------------------------------------
// 1. Burger Clamshell Box
// -------------------------------------------------------------
function buildBurgerBoxModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  // Scaling
  const scale = Math.min(220 / dims.width, 220 / dims.length, 140 / dims.depth);
  const w = dims.width * scale;
  const l = dims.length * scale;
  const d = dims.depth * scale;

  // Isometric angle factors (30 deg)
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  // Vectors for width (towards right-down) and length (towards left-down)
  let wx = (w / 2) * cos30;
  let wy = (w / 2) * sin30;
  let lx = -(l / 2) * cos30;
  let ly = (l / 2) * sin30;

  if (viewAngle === 'front') {
    wx = w / 2; wy = 0;
    lx = 0; ly = l * 0.15;
  } else if (viewAngle === 'top') {
    wx = w / 2; wy = 0;
    lx = 0; ly = l / 2;
  } else if (viewAngle === 'side') {
    wx = 0; wy = w * 0.15;
    lx = -l / 2; ly = 0;
  }

  const baseH = d * 0.48;
  const lidH = d * 0.52;
  const lidTiltY = openness * 35; // Tilt up when opened

  // Base Tray Points
  // Base Front Wall
  const bf0 = { x: cx + lx - wx, y: cy + ly - wy };
  const bf1 = { x: cx + lx + wx, y: cy + ly + wy };
  const bf2 = { x: cx + lx + wx, y: cy + ly + wy + baseH };
  const bf3 = { x: cx + lx - wx, y: cy + ly - wy + baseH };

  // Base Right Wall
  const br0 = { x: cx + lx + wx, y: cy + ly + wy };
  const br1 = { x: cx - lx + wx, y: cy - ly + wy };
  const br2 = { x: cx - lx + wx, y: cy - ly + wy + baseH };
  const br3 = { x: cx + lx + wx, y: cy + ly + wy + baseH };

  // Top Lid (hinged at rear, tilted by openness)
  const lidCenterY = cy - lidH - lidTiltY;
  const lt0 = { x: cx - lx - wx, y: lidCenterY - ly - wy - lidTiltY * 0.3 };
  const lt1 = { x: cx - lx + wx, y: lidCenterY - ly + wy - lidTiltY * 0.3 };
  const lt2 = { x: cx + lx + wx, y: lidCenterY + ly + wy };
  const lt3 = { x: cx + lx - wx, y: lidCenterY + ly - wy };

  // Top Lid Front Flap
  const lf0 = lt3;
  const lf1 = lt2;
  const lf2 = { x: lt2.x, y: lt2.y + lidH };
  const lf3 = { x: lt3.x, y: lt3.y + lidH };

  // Top Lid Right Flap
  const lr0 = lt2;
  const lr1 = lt1;
  const lr2 = { x: lt1.x, y: lt1.y + lidH };
  const lr3 = { x: lt2.x, y: lt2.y + lidH };

  const faces: AssembledFaceData[] = [
    {
      id: 'base-front',
      name: 'Base Front Wall',
      panelId: 'front-wall-base',
      points: [bf0, bf1, bf2, bf3],
      lighting: 0.95,
      graphics: mapPanelGraphicsToFace(panels.get('front-wall-base'), graphics, w, baseH),
    },
    {
      id: 'base-right',
      name: 'Base Right Wall',
      panelId: 'right-wall-base',
      points: [br0, br1, br2, br3],
      lighting: 0.82,
      graphics: mapPanelGraphicsToFace(panels.get('right-wall-base'), graphics, l, baseH),
    },
    {
      id: 'lid-front',
      name: 'Lid Front Flap',
      panelId: 'front-wall-top',
      points: [lf0, lf1, lf2, lf3],
      lighting: 1.05,
      graphics: mapPanelGraphicsToFace(panels.get('front-wall-top'), graphics, w, lidH),
    },
    {
      id: 'lid-right',
      name: 'Lid Right Flap',
      panelId: 'right-wall-top',
      points: [lr0, lr1, lr2, lr3],
      lighting: 0.88,
      graphics: mapPanelGraphicsToFace(panels.get('right-wall-top'), graphics, l, lidH),
    },
    {
      id: 'top-lid',
      name: 'Top Lid Face',
      panelId: 'top-lid',
      points: [lt0, lt1, lt2, lt3],
      lighting: 1.15,
      graphics: mapPanelGraphicsToFace(panels.get('top-lid'), graphics, w, l),
    },
  ];

  return {
    templateId: 'burger-box',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: cy + baseH + ly + 15,
      rx: (w + l) * 0.65,
      ry: (w + l) * 0.22,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 2. Pizza Box (Roll-End Tuck Top)
// -------------------------------------------------------------
function buildPizzaBoxModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(270 / dims.width, 270 / dims.length, 120 / dims.depth);
  const w = dims.width * scale;
  const l = dims.length * scale;
  const d = Math.max(dims.depth * scale, 24);

  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const wx = (w / 2) * cos30;
  const wy = (w / 2) * sin30;
  const lx = -(l / 2) * cos30;
  const ly = (l / 2) * sin30;

  const lidTilt = openness * 40;

  // Front Wall
  const f0 = { x: cx + lx - wx, y: cy + ly - wy };
  const f1 = { x: cx + lx + wx, y: cy + ly + wy };
  const f2 = { x: cx + lx + wx, y: cy + ly + wy + d };
  const f3 = { x: cx + lx - wx, y: cy + ly - wy + d };

  // Right Wall
  const r0 = { x: cx + lx + wx, y: cy + ly + wy };
  const r1 = { x: cx - lx + wx, y: cy - ly + wy };
  const r2 = { x: cx - lx + wx, y: cy - ly + wy + d };
  const r3 = { x: cx + lx + wx, y: cy + ly + wy + d };

  // Top Lid
  const t0 = { x: cx - lx - wx, y: cy - ly - wy - lidTilt * 0.3 };
  const t1 = { x: cx - lx + wx, y: cy - ly + wy - lidTilt * 0.3 };
  const t2 = { x: cx + lx + wx, y: cy + ly + wy - lidTilt };
  const t3 = { x: cx + lx - wx, y: cy + ly - wy - lidTilt };

  const faces: AssembledFaceData[] = [
    {
      id: 'pizza-front',
      name: 'Front Wall',
      panelId: 'front-wall',
      points: [f0, f1, f2, f3],
      lighting: 0.95,
      graphics: mapPanelGraphicsToFace(panels.get('front-wall'), graphics, w, d),
    },
    {
      id: 'pizza-right',
      name: 'Right Sidewall',
      panelId: 'right-wall-outer',
      points: [r0, r1, r2, r3],
      lighting: 0.85,
      graphics: mapPanelGraphicsToFace(panels.get('right-wall-outer'), graphics, l, d),
    },
    {
      id: 'pizza-top',
      name: 'Top Lid',
      panelId: 'top-lid',
      points: [t0, t1, t2, t3],
      lighting: 1.15,
      graphics: mapPanelGraphicsToFace(panels.get('top-lid'), graphics, w, l),
    },
  ];

  return {
    templateId: 'pizza-box',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: cy + d + ly + 15,
      rx: (w + l) * 0.7,
      ry: (w + l) * 0.22,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 3. Sandwich Wedge Box
// -------------------------------------------------------------
function buildSandwichWedgeModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(180 / dims.width, 240 / dims.length, 240 / dims.depth);
  const w = dims.width * scale;
  const h = dims.depth * scale; // vertical height
  const l = dims.length * scale; // hypotenuse depth

  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const wx = (w / 2) * cos30;
  const wy = (w / 2) * sin30;

  // Triangular prism apex (top back)
  const apex = { x: cx, y: cy - h * 0.65 };
  const apexRight = { x: cx + wx, y: cy - h * 0.65 + wy };

  // Bottom front
  const frontLeft = { x: cx - wx - l * 0.4, y: cy + h * 0.35 + wy };
  const frontRight = { x: cx + wx - l * 0.4, y: cy + h * 0.35 + 2 * wy };

  // Bottom back
  const backRight = { x: cx + wx, y: cy + h * 0.35 };

  // Slanted Window Face (Apex to Front)
  const sw0 = apex;
  const sw1 = apexRight;
  const sw2 = frontRight;
  const sw3 = frontLeft;

  // Right Triangular Side
  const rs0 = apexRight;
  const rs1 = backRight;
  const rs2 = frontRight;

  const faces: AssembledFaceData[] = [
    {
      id: 'wedge-right-side',
      name: 'Right Triangular Side',
      panelId: 'right-triangle-side',
      points: [rs0, rs1, rs2, rs2],
      lighting: 0.85,
      graphics: mapPanelGraphicsToFace(panels.get('right-triangle-side'), graphics, l, h),
    },
    {
      id: 'wedge-slanted-window',
      name: 'Slanted Front Face (Window)',
      panelId: 'slanted-front-window',
      points: [sw0, sw1, sw2, sw3],
      lighting: 1.15,
      graphics: mapPanelGraphicsToFace(panels.get('slanted-front-window'), graphics, w, l),
    },
  ];

  return {
    templateId: 'sandwich-wedge-box',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx: cx - l * 0.2,
      cy: cy + h * 0.35 + wy + 15,
      rx: (w + l) * 0.55,
      ry: (w + l) * 0.2,
      opacity: 0.4,
    },
  };
}

// -------------------------------------------------------------
// 4. French Fries Scoop Box
// -------------------------------------------------------------
function buildFriesScoopModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(220 / dims.width, 240 / dims.depth);
  const w = dims.width * scale;
  const h = dims.depth * scale;
  const t = Math.max(dims.length * scale, 40);

  // Tapered front scoop
  const topW = w * 1.1;
  const botW = w * 0.8;
  const scoopY = cy - h * 0.1;
  const backY = cy - h * 0.5;
  const botY = cy + h * 0.45;

  // Front scoop points (U-cutout)
  const sf0 = { x: cx - topW / 2, y: scoopY };
  const sf1 = { x: cx + topW / 2, y: scoopY };
  const sf2 = { x: cx + botW / 2, y: botY };
  const sf3 = { x: cx - botW / 2, y: botY };

  // Back arch points
  const sb0 = { x: cx - topW / 2 - 5, y: backY };
  const sb1 = { x: cx + topW / 2 + 5, y: backY };
  const sb2 = sf1;
  const sb3 = sf0;

  // Right taper side
  const sr0 = sf1;
  const sr1 = { x: sf1.x + t * 0.5, y: backY + 30 };
  const sr2 = { x: sf2.x + t * 0.4, y: botY - 5 };
  const sr3 = sf2;

  const faces: AssembledFaceData[] = [
    {
      id: 'fries-back-scoop',
      name: 'High Back Support',
      panelId: 'back-scoop',
      points: [sb0, sb1, sb2, sb3],
      lighting: 0.75,
      graphics: mapPanelGraphicsToFace(panels.get('back-scoop'), graphics, w, h * 0.4),
    },
    {
      id: 'fries-right-taper',
      name: 'Right Tapered Side',
      panelId: 'right-taper-side',
      points: [sr0, sr1, sr2, sr3],
      lighting: 0.85,
      graphics: mapPanelGraphicsToFace(panels.get('right-taper-side'), graphics, t, h),
    },
    {
      id: 'fries-front-scoop',
      name: 'Front Scoop Face',
      panelId: 'front-scoop',
      points: [sf0, sf1, sf2, sf3],
      lighting: 1.1,
      graphics: mapPanelGraphicsToFace(panels.get('front-scoop'), graphics, w, h * 0.6),
    },
  ];

  return {
    templateId: 'fries-scoop-box',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: botY + 12,
      rx: botW * 0.75,
      ry: 20,
      opacity: 0.5,
    },
  };
}

// -------------------------------------------------------------
// 5. Pillow Packaging Box
// -------------------------------------------------------------
function buildPillowBoxModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(260 / dims.length, 190 / dims.width);
  const w = dims.length * scale; // length is horizontal span
  const h = dims.width * scale;  // width is vertical span
  const bulge = dims.depth * scale * 0.45;

  const halfW = w / 2;
  const halfH = h / 2;

  // 4 corners of pillow
  const p0 = { x: cx - halfW, y: cy - halfH * 0.7 };
  const p1 = { x: cx + halfW, y: cy - halfH * 0.7 };
  const p2 = { x: cx + halfW, y: cy + halfH * 0.7 };
  const p3 = { x: cx - halfW, y: cy + halfH * 0.7 };

  // Curved convex SVG path
  const pathD = `
    M ${cx - halfW} ${cy}
    C ${cx - halfW} ${cy - halfH - bulge}, ${cx + halfW} ${cy - halfH - bulge}, ${cx + halfW} ${cy}
    C ${cx + halfW} ${cy + halfH + bulge}, ${cx - halfW} ${cy + halfH + bulge}, ${cx - halfW} ${cy}
    Z
  `;

  const faces: AssembledFaceData[] = [
    {
      id: 'pillow-front',
      name: 'Front Pillow Face',
      panelId: 'front-convex',
      points: [p0, p1, p2, p3],
      pathD,
      lighting: 1.1,
      graphics: mapPanelGraphicsToFace(panels.get('front-convex'), graphics, w, h),
    },
  ];

  return {
    templateId: 'pillow-box',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: cy + halfH + bulge + 8,
      rx: halfW * 0.9,
      ry: 24,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 6. Dessert Window Sleeve Box
// -------------------------------------------------------------
function buildDessertSleeveModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(220 / dims.length, 180 / dims.width, 140 / dims.depth);
  const l = dims.length * scale;
  const w = dims.width * scale;
  const d = Math.max(dims.depth * scale, 30);

  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const lx = (l / 2) * cos30;
  const ly = (l / 2) * sin30;
  const wx = -(w / 2) * cos30;
  const wy = (w / 2) * sin30;

  // Inner tray sliding out from right opening
  const slideDistance = openness * (l * 0.45);
  const tx = slideDistance * cos30;
  const ty = slideDistance * sin30;

  // Sleeve Front Face
  const sf0 = { x: cx + wx - lx, y: cy + wy - ly };
  const sf1 = { x: cx + wx + lx, y: cy + wy + ly };
  const sf2 = { x: cx + wx + lx, y: cy + wy + ly + d };
  const sf3 = { x: cx + wx - lx, y: cy + wy - ly + d };

  // Sleeve Top Face (Window)
  const st0 = { x: cx - wx - lx, y: cy - wy - ly };
  const st1 = { x: cx - wx + lx, y: cy - wy + ly };
  const st2 = sf1;
  const st3 = sf0;

  // Inner Tray Front (sliding out)
  const tf0 = { x: sf1.x + tx * 0.2, y: sf1.y + ty * 0.2 + 2 };
  const tf1 = { x: sf1.x + tx, y: sf1.y + ty + 2 };
  const tf2 = { x: sf2.x + tx, y: sf2.y + ty - 2 };
  const tf3 = { x: sf2.x + tx * 0.2, y: sf2.y + ty * 0.2 - 2 };

  const faces: AssembledFaceData[] = [
    {
      id: 'tray-slide-front',
      name: 'Inner Tray Serving Face',
      panelId: 'tray-front',
      points: [tf0, tf1, tf2, tf3],
      lighting: 0.9,
      graphics: mapPanelGraphicsToFace(panels.get('tray-front'), graphics, slideDistance, d),
    },
    {
      id: 'sleeve-front',
      name: 'Sleeve Front Face',
      panelId: 'sleeve-front',
      points: [sf0, sf1, sf2, sf3],
      lighting: 0.95,
      graphics: mapPanelGraphicsToFace(panels.get('sleeve-front'), graphics, l, d),
    },
    {
      id: 'sleeve-top',
      name: 'Sleeve Top Face (Window)',
      panelId: 'sleeve-top-window',
      points: [st0, st1, st2, st3],
      lighting: 1.15,
      graphics: mapPanelGraphicsToFace(panels.get('sleeve-top-window'), graphics, l, w),
    },
  ];

  return {
    templateId: 'dessert-sleeve-box',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx: cx + tx * 0.3,
      cy: cy + wy + ly + d + 14,
      rx: (l + w + slideDistance) * 0.55,
      ry: (l + w) * 0.18,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 7. Round Food Tub with Lid
// -------------------------------------------------------------
function buildRoundFoodTubModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(220 / dims.width, 220 / dims.depth);
  const topRadius = (dims.width * scale) / 2;
  const botRadius = topRadius * 0.78;
  const h = dims.depth * scale;
  const lidLift = openness * 45;

  const topY = cy - h * 0.45 - lidLift;
  const bodyTopY = cy - h * 0.45;
  const botY = cy + h * 0.45;

  // Lid Top Disc
  const lt0 = { x: cx - topRadius, y: topY };
  const lt1 = { x: cx + topRadius, y: topY };
  const lt2 = { x: cx + topRadius, y: topY + topRadius * 0.45 };
  const lt3 = { x: cx - topRadius, y: topY + topRadius * 0.45 };

  // Tub Body Wrap
  const tb0 = { x: cx - topRadius * 0.98, y: bodyTopY + topRadius * 0.2 };
  const tb1 = { x: cx + topRadius * 0.98, y: bodyTopY + topRadius * 0.2 };
  const tb2 = { x: cx + botRadius, y: botY };
  const tb3 = { x: cx - botRadius, y: botY };

  const faces: AssembledFaceData[] = [
    {
      id: 'tub-body',
      name: 'Conical Tub Body',
      panelId: 'tub-body-wrap',
      points: [tb0, tb1, tb2, tb3],
      lighting: 1.0,
      graphics: mapPanelGraphicsToFace(panels.get('tub-body-wrap'), graphics, topRadius * 2, h),
    },
    {
      id: 'tub-lid',
      name: 'Lid Top Disc',
      panelId: 'lid-top-disc',
      points: [lt0, lt1, lt2, lt3],
      lighting: 1.2,
      graphics: mapPanelGraphicsToFace(panels.get('lid-top-disc'), graphics, topRadius * 2, topRadius * 2),
    },
  ];

  return {
    templateId: 'round-food-tub',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: botY + 12,
      rx: botRadius * 1.1,
      ry: botRadius * 0.35,
      opacity: 0.5,
    },
  };
}

// -------------------------------------------------------------
// 8. Stand-up Ziplock Pouch
// -------------------------------------------------------------
function buildStandUpPouchModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(220 / dims.width, 260 / dims.length);
  const w = dims.width * scale;
  const h = dims.length * scale; // length is pouch height
  const gussetD = Math.max(dims.depth * scale * 0.4, 25);

  const halfW = w / 2;
  const topY = cy - h / 2;
  const botY = cy + h / 2;

  // Front face points
  const f0 = { x: cx - halfW, y: topY };
  const f1 = { x: cx + halfW, y: topY };
  const f2 = { x: cx + halfW * 0.95, y: botY };
  const f3 = { x: cx - halfW * 0.95, y: botY };

  // Bottom gusset ellipse curve
  const pathD = `
    M ${f0.x} ${f0.y}
    L ${f1.x} ${f1.y}
    C ${f1.x + 8} ${cy}, ${f2.x + 8} ${botY - gussetD}, ${f2.x} ${botY}
    C ${cx} ${botY + gussetD}, ${cx} ${botY + gussetD}, ${f3.x} ${botY}
    C ${f3.x - 8} ${botY - gussetD}, ${f0.x - 8} ${cy}, ${f0.x} ${f0.y}
    Z
  `;

  const faces: AssembledFaceData[] = [
    {
      id: 'pouch-front',
      name: 'Front Face (Artwork)',
      panelId: 'front-face',
      points: [f0, f1, f2, f3],
      pathD,
      lighting: 1.05,
      graphics: mapPanelGraphicsToFace(panels.get('front-face'), graphics, w, h),
    },
  ];

  return {
    templateId: 'standup-pouch',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: botY + gussetD * 0.6,
      rx: halfW * 1.05,
      ry: gussetD * 0.7,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 9. Side Gusset Coffee/Cookie Bag
// -------------------------------------------------------------
function buildSideGussetBagModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(200 / dims.width, 270 / dims.length, 140 / dims.depth);
  const w = dims.width * scale;
  const h = dims.length * scale;
  const d = dims.depth * scale * 0.65;

  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const dx = d * cos30;
  const dy = d * sin30;

  const topY = cy - h / 2;
  const botY = cy + h / 2;

  // Front Panel
  const f0 = { x: cx - w / 2, y: topY };
  const f1 = { x: cx + w / 2, y: topY };
  const f2 = { x: cx + w / 2, y: botY };
  const f3 = { x: cx - w / 2, y: botY };

  // Right Pleated Gusset Side
  const g0 = f1;
  const g1 = { x: f1.x + dx, y: f1.y - dy };
  const g2 = { x: f2.x + dx, y: f2.y - dy };
  const g3 = f2;

  const faces: AssembledFaceData[] = [
    {
      id: 'bag-right-gusset',
      name: 'Right Gusset Side',
      panelId: 'right-gusset-panel',
      points: [g0, g1, g2, g3],
      lighting: 0.82,
      graphics: mapPanelGraphicsToFace(panels.get('right-gusset-panel'), graphics, d, h),
    },
    {
      id: 'bag-front',
      name: 'Front Face (Window)',
      panelId: 'front-face-window',
      points: [f0, f1, f2, f3],
      lighting: 1.1,
      graphics: mapPanelGraphicsToFace(panels.get('front-face-window'), graphics, w, h),
    },
  ];

  return {
    templateId: 'side-gusset-bag',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx: cx + dx * 0.35,
      cy: botY + 14,
      rx: (w + dx) * 0.65,
      ry: 22,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 10. Single-Serve Sachet Stick Pack
// -------------------------------------------------------------
function buildSachetStickPackModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(100 / dims.width, 320 / dims.length);
  const w = dims.width * scale;
  const h = dims.length * scale;

  const halfW = w / 2;
  const topY = cy - h / 2;
  const botY = cy + h / 2;

  const f0 = { x: cx - halfW, y: topY };
  const f1 = { x: cx + halfW, y: topY };
  const f2 = { x: cx + halfW, y: botY };
  const f3 = { x: cx - halfW, y: botY };

  const faces: AssembledFaceData[] = [
    {
      id: 'sachet-front',
      name: 'Front Face (Branding)',
      panelId: 'front-face',
      points: [f0, f1, f2, f3],
      lighting: 1.12,
      graphics: mapPanelGraphicsToFace(panels.get('front-face'), graphics, w, h),
    },
  ];

  return {
    templateId: 'sachet-stick-pack',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: botY + 12,
      rx: halfW * 1.2,
      ry: 16,
      opacity: 0.4,
    },
  };
}

// -------------------------------------------------------------
// 11. Sliced Bread Loaf Bag
// -------------------------------------------------------------
function buildBreadLoafBagModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(190 / dims.width, 260 / dims.length, 140 / dims.depth);
  const w = dims.width * scale;
  const h = dims.length * scale * 0.75;
  const d = dims.depth * scale * 0.6;

  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const dx = d * cos30;
  const dy = d * sin30;

  const botY = cy + h / 2;
  const topY = cy - h / 2 + 20;

  // Front loaf panel
  const f0 = { x: cx - w / 2, y: topY };
  const f1 = { x: cx + w / 2, y: topY };
  const f2 = { x: cx + w / 2, y: botY };
  const f3 = { x: cx - w / 2, y: botY };

  // Right gusset side
  const g0 = f1;
  const g1 = { x: f1.x + dx, y: f1.y - dy };
  const g2 = { x: f2.x + dx, y: f2.y - dy };
  const g3 = f2;

  const faces: AssembledFaceData[] = [
    {
      id: 'bread-right-gusset',
      name: 'Right Gusset Side',
      panelId: 'right-gusset-face',
      points: [g0, g1, g2, g3],
      lighting: 0.85,
      graphics: mapPanelGraphicsToFace(panels.get('right-gusset-face'), graphics, d, h),
    },
    {
      id: 'bread-front',
      name: 'Front Loaf Face (Window)',
      panelId: 'front-face-window',
      points: [f0, f1, f2, f3],
      lighting: 1.1,
      graphics: mapPanelGraphicsToFace(panels.get('front-face-window'), graphics, w, h),
    },
  ];

  return {
    templateId: 'bread-loaf-bag',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx: cx + dx * 0.35,
      cy: botY + 15,
      rx: (w + dx) * 0.7,
      ry: 24,
      opacity: 0.45,
    },
  };
}

// -------------------------------------------------------------
// 12. Burger & Food Wrapper Sheet
// -------------------------------------------------------------
function buildBurgerWrapperModel(
  dims: PackagingDimensions,
  panels: Map<string, PanelFace>,
  graphics: GraphicItem[],
  viewAngle: ViewAngle,
  _openness: number,
  cx: number,
  cy: number
): AssembledModelResult {
  const scale = Math.min(260 / dims.width, 260 / dims.length);
  const size = dims.width * scale * 0.65;
  const half = size / 2;

  // Folded hexagonal/octagonal wrapped package
  const f0 = { x: cx - half * 0.8, y: cy - half };
  const f1 = { x: cx + half * 0.8, y: cy - half };
  const f2 = { x: cx + half, y: cy - half * 0.4 };
  const f3 = { x: cx + half, y: cy + half * 0.4 };
  const f4 = { x: cx + half * 0.8, y: cy + half };
  const f5 = { x: cx - half * 0.8, y: cy + half };
  const f6 = { x: cx - half, y: cy + half * 0.4 };
  const f7 = { x: cx - half, y: cy - half * 0.4 };

  const pathD = `M ${f0.x} ${f0.y} L ${f1.x} ${f1.y} L ${f2.x} ${f2.y} L ${f3.x} ${f3.y} L ${f4.x} ${f4.y} L ${f5.x} ${f5.y} L ${f6.x} ${f6.y} L ${f7.x} ${f7.y} Z`;

  // Center target face for sticker/branding
  const c0 = { x: cx - half * 0.5, y: cy - half * 0.5 };
  const c1 = { x: cx + half * 0.5, y: cy - half * 0.5 };
  const c2 = { x: cx + half * 0.5, y: cy + half * 0.5 };
  const c3 = { x: cx - half * 0.5, y: cy + half * 0.5 };

  const faces: AssembledFaceData[] = [
    {
      id: 'wrapper-center',
      name: 'Central Wrap Target & Seal',
      panelId: 'center-base',
      points: [c0, c1, c2, c3],
      pathD,
      lighting: 1.15,
      graphics: mapPanelGraphicsToFace(panels.get('center-base'), graphics, size, size),
    },
  ];

  return {
    templateId: 'burger-wrapper',
    viewAngle,
    width: 800,
    height: 600,
    faces,
    shadow: {
      cx,
      cy: cy + half + 12,
      rx: half * 1.1,
      ry: 26,
      opacity: 0.4,
    },
  };
}
