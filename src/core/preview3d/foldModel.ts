import * as THREE from 'three';
import { DielineResult, PanelFace, Point } from '../dieline/types';
import { PrintSheet } from './printTexture';

type Axis = 'x' | 'y' | 'z';

interface PartSpec {
  root: string;
  folds?: Array<[string, string, number]>;
  behind?: Array<[string, string, number]>;
  under?: Array<[string, string]>;
  flip?: boolean;
  scale?: number;
  puff?: Record<string, number>;
}

type OpenSpec =
  | { kind: 'hinge'; panel: string; delta: number }
  | { kind: 'slide'; part: number; axis: Axis; distance: number }
  | { kind: 'lift'; distance: number };

export interface FoldSpec {
  parts: PartSpec[];
  orient?: Array<[Axis, number]>;
  open?: OpenSpec;
}

const FOLD_SPECS: Record<string, FoldSpec> = {
  'burger-box': {
    parts: [{
      root: 'base-bottom',
      folds: [
        ['base-front', 'base-bottom', 90], ['base-left', 'base-bottom', 90],
        ['base-right', 'base-bottom', 90], ['rear-hinge', 'base-bottom', 90],
        ['lid-top', 'rear-hinge', 90],
        ['lid-left', 'lid-top', 90], ['lid-right', 'lid-top', 90], ['lid-front', 'lid-top', 90],
      ],
    }],
    orient: [['x', 90]],
    open: { kind: 'hinge', panel: 'lid-top', delta: -105 },
  },
  'pizza-box': {
    parts: [{
      root: 'pizza-base',
      folds: [
        ['pizza-base-front', 'pizza-base', 90], ['pizza-left-outer', 'pizza-base', 90],
        ['pizza-right-outer', 'pizza-base', 90], ['pizza-rear', 'pizza-base', 90],
        ['pizza-left-inner', 'pizza-left-outer', 178], ['pizza-right-inner', 'pizza-right-outer', 178],
        ['pizza-lid', 'pizza-rear', 90],
        ['pizza-lid-left', 'pizza-lid', 90], ['pizza-lid-right', 'pizza-lid', 90], ['pizza-lid-front', 'pizza-lid', 90],
      ],
    }],
    orient: [['x', 90]],
    open: { kind: 'hinge', panel: 'pizza-lid', delta: -105 },
  },
  'sandwich-wedge-box': {
    parts: [{
      root: 'sandwich-base',
      folds: [
        ['sandwich-back', 'sandwich-base', 90],
        ['sandwich-front', 'sandwich-base', 0],
        ['sandwich-left-side', 'sandwich-base', 90], ['sandwich-right-side', 'sandwich-base', 90],
        ['sandwich-tuck-flap', 'sandwich-front', 0],
      ],
    }],
    orient: [['x', 90], ['y', 180]],
  },
  'fries-scoop-box': {
    parts: [{
      root: 'fries-front',
      folds: [
        ['fries-left', 'fries-front', 90], ['fries-glue-tab', 'fries-left', 90],
        ['fries-right', 'fries-front', 90], ['fries-back', 'fries-right', 90],
        ['fries-bottom', 'fries-front', 90],
      ],
    }],
  },
  'pillow-box': {
    parts: [{
      root: 'pillow-front',
      folds: [
        ['pillow-back', 'pillow-front', 176],
        ['pillow-glue-tab', 'pillow-back', 176],
        ['pillow-top-outer', 'pillow-front', 92], ['pillow-bottom-outer', 'pillow-front', 92],
        ['pillow-top-inner', 'pillow-back', 88], ['pillow-bottom-inner', 'pillow-back', 88],
      ],
    }],
  },
  'dessert-sleeve-box': {
    parts: [
      {
        root: 'sleeve-top',
        folds: [
          ['sleeve-left', 'sleeve-top', 90], ['sleeve-right', 'sleeve-top', 90],
          ['sleeve-bottom', 'sleeve-right', 90], ['sleeve-glue-tab', 'sleeve-bottom', 90],
        ],
      },
      {
        root: 'tray-base',
        folds: [
          ['tray-top-wall', 'tray-base', 90], ['tray-bottom-wall', 'tray-base', 90],
          ['tray-left-wall', 'tray-base', 90], ['tray-right-wall', 'tray-base', 90],
        ],
        flip: true,
        scale: 0.96,
      },
    ],
    orient: [['x', -90]],
    open: { kind: 'slide', part: 1, axis: 'y', distance: -0.65 },
  },
  'standup-pouch': {
    parts: [{
      root: 'pouch-front',
      behind: [['pouch-back', 'pouch-front', 2]],
      under: [['pouch-gusset', 'pouch-front']],
      puff: { 'pouch-front': 0.16, 'pouch-back': 0.16 },
    }],
  },
  'side-gusset-bag': {
    parts: [{
      root: 'bag-front',
      folds: [
        ['bag-gusset-left', 'bag-front', 90], ['bag-back-left', 'bag-gusset-left', 90],
        ['bag-gusset-right', 'bag-front', 90], ['bag-back-right', 'bag-gusset-right', 90],
        ['bag-top-header', 'bag-front', 0], ['bag-block-bottom', 'bag-front', 90],
      ],
    }],
  },
  'bread-loaf-bag': {
    parts: [{
      root: 'bread-front',
      folds: [
        ['bread-gusset-left', 'bread-front', 90], ['bread-back-left', 'bread-gusset-left', 90],
        ['bread-gusset-right', 'bread-front', 90], ['bread-back-right', 'bread-gusset-right', 90],
        ['bread-top-header', 'bread-front', 0], ['bread-bottom-seal', 'bread-front', 90],
      ],
    }],
  },
  'sachet-stick-pack': {
    parts: [{
      root: 'sachet-front',
      folds: [
        ['sachet-back-left', 'sachet-front', 179], ['sachet-back-right', 'sachet-front', 179],
        ['sachet-top-seal', 'sachet-front', 0], ['sachet-bottom-seal', 'sachet-front', 0],
      ],
    }],
  },
  'burger-wrapper': {
    parts: [{
      root: 'wrapper-center',
      folds: [
        ['wrapper-top', 'wrapper-center', 86], ['wrapper-bottom', 'wrapper-center', 86],
        ['wrapper-left', 'wrapper-center', 86], ['wrapper-right', 'wrapper-center', 86],
      ],
    }],
    orient: [['x', -90]],
  },
};

export interface FoldedModel {
  root: THREE.Group;
  radius: number;
  bounds: THREE.Box3;
  openBounds: THREE.Box3;
  setOpenness: (t: number) => void;
  dispose: () => void;
}

const toV3 = (p: Point) => new THREE.Vector3(p.x, -p.y, 0);

function distToSegment(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

const onOutline = (p: Point, poly: Point[]) =>
  poly.some((a, i) => distToSegment(p, a, poly[(i + 1) % poly.length]) < 1.0);

function findHinge(child: PanelFace, parent: PanelFace): [Point, Point] | null {
  const on = [
    ...child.polygon.filter(p => onOutline(p, parent.polygon)),
    ...parent.polygon.filter(p => onOutline(p, child.polygon)),
  ];
  let best: [Point, Point] | null = null;
  let bestLen = 0;
  for (let i = 0; i < on.length; i++) {
    for (let j = i + 1; j < on.length; j++) {
      const len = Math.hypot(on[i].x - on[j].x, on[i].y - on[j].y);
      if (len > bestLen) {
        bestLen = len;
        best = [on[i], on[j]];
      }
    }
  }
  return bestLen > 1 ? best : null;
}

class MeshFactory {
  readonly geometries: THREE.BufferGeometry[] = [];
  readonly printMaterial: THREE.MeshStandardMaterial;
  readonly boardMaterial: THREE.MeshStandardMaterial;

  constructor(
    private readonly sheet: PrintSheet,
    texture: THREE.Texture,
    boardColor: string,
    private readonly framesOnly = false,
  ) {
    this.printMaterial = new THREE.MeshStandardMaterial({
      map: texture, side: THREE.FrontSide, roughness: 0.82, metalness: 0,
    });
    this.boardMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(boardColor).multiplyScalar(0.82), side: THREE.BackSide, roughness: 0.95, metalness: 0,
    });
  }

  uv(x: number, y: number): [number, number] {
    return [(x - this.sheet.minX) / this.sheet.width, 1 - (y - this.sheet.minY) / this.sheet.height];
  }

  private marker(panelId: string): THREE.Group {
    const group = new THREE.Group();
    group.userData.panelId = panelId;
    return group;
  }

  puffedPanel(panel: PanelFace, origin: THREE.Vector3, bulge: number): THREE.Group {
    if (this.framesOnly) return this.marker(panel.id);
    const { x, y, width, height } = panel.bounds;
    const geometry = new THREE.PlaneGeometry(width, height, 32, 32);
    const pos = geometry.getAttribute('position');
    const uvs = geometry.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) {
      const u = uvs.getX(i);
      const v = 1 - uvs.getY(i);
      const dx = x + u * width;
      const dy = y + v * height;
      const z = bulge * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 0.85 + 0.1));
      pos.setXYZ(i, dx - origin.x, -dy - origin.y, z);
      const [tu, tv] = this.uv(dx, dy);
      uvs.setXY(i, tu, tv);
    }
    geometry.computeVertexNormals();
    return this.pair(geometry, panel.id);
  }

  panel(panel: PanelFace, origin: THREE.Vector3): THREE.Group {
    if (this.framesOnly) return this.marker(panel.id);
    const shape = new THREE.Shape(panel.polygon.map(p => new THREE.Vector2(p.x - origin.x, -p.y - origin.y)));
    const geometry = new THREE.ShapeGeometry(shape);
    const pos = geometry.getAttribute('position');
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const [u, v] = this.uv(pos.getX(i) + origin.x, -(pos.getY(i) + origin.y));
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return this.pair(geometry, panel.id);
  }

  pair(geometry: THREE.BufferGeometry, panelId: string): THREE.Group {
    this.geometries.push(geometry);
    const group = new THREE.Group();
    const front = new THREE.Mesh(geometry, this.printMaterial);
    const back = new THREE.Mesh(geometry, this.boardMaterial);
    front.userData.panelId = panelId;
    back.userData.panelId = panelId;
    group.add(front, back);
    return group;
  }
}

function buildPart(spec: PartSpec, panels: Map<string, PanelFace>, factory: MeshFactory, pivots: Map<string, { pivot: THREE.Object3D; axis: THREE.Vector3; angle: number }>) {
  const part = new THREE.Group();
  const rootPanel = panels.get(spec.root);
  if (!rootPanel) return part;

  const placed = new Map<string, { node: THREE.Object3D; origin: THREE.Vector3 }>();
  const origin0 = new THREE.Vector3(0, 0, 0);
  const meshFor = (panel: PanelFace, origin: THREE.Vector3) => {
    const puff = spec.puff?.[panel.id];
    return puff ? factory.puffedPanel(panel, origin, puff * panel.bounds.width) : factory.panel(panel, origin);
  };
  part.add(meshFor(rootPanel, origin0));
  placed.set(rootPanel.id, { node: part, origin: origin0 });

  const depth = new Map<string, number>([[rootPanel.id, 0]]);

  for (const [childId, parentId, angleDeg] of spec.folds ?? []) {
    const child = panels.get(childId);
    const parent = placed.get(parentId);
    const parentPanel = panels.get(parentId);
    if (!child || !parent || !parentPanel) continue;
    const hinge = findHinge(child, parentPanel);
    if (!hinge) {
      console.warn(`No shared crease between ${childId} and ${parentId}`);
      continue;
    }

    const a = toV3(hinge[0]);
    const b = toV3(hinge[1]);
    const axis = b.clone().sub(a).normalize();
    const c = child.polygon.reduce((s: THREE.Vector3, p) => s.add(toV3(p)), new THREE.Vector3()).divideScalar(child.polygon.length);
    const v = c.sub(a);
    if (axis.x * v.y - axis.y * v.x > 0) axis.negate();

    const pivot = new THREE.Object3D();
    pivot.position.copy(a).sub(parent.origin);
    const angle = THREE.MathUtils.degToRad(angleDeg);
    pivot.quaternion.setFromAxisAngle(axis, angle);
    const level = (depth.get(parentId) ?? 0) + 1;
    depth.set(childId, level);
    const mesh = factory.panel(child, a);
    mesh.position.z = level * 0.6;
    pivot.add(mesh);
    parent.node.add(pivot);
    placed.set(childId, { node: pivot, origin: a });
    pivots.set(childId, { pivot, axis, angle });
  }

  for (const [childId, parentId, gap] of spec.behind ?? []) {
    const child = panels.get(childId);
    const parent = placed.get(parentId);
    const parentPanel = panels.get(parentId);
    if (!child || !parent || !parentPanel) continue;
    const centerOf = (p: PanelFace) => toV3({ x: p.bounds.x + p.bounds.width / 2, y: p.bounds.y + p.bounds.height / 2 });
    const holder = new THREE.Object3D();
    holder.position.copy(centerOf(parentPanel)).sub(parent.origin);
    holder.position.z = -gap;
    holder.rotation.y = Math.PI;
    holder.add(meshFor(child, centerOf(child)));
    parent.node.add(holder);
    placed.set(childId, { node: holder, origin: centerOf(child) });
  }

  for (const [childId, parentId] of spec.under ?? []) {
    const child = panels.get(childId);
    const parent = placed.get(parentId);
    const parentPanel = panels.get(parentId);
    if (!child || !parent || !parentPanel) continue;
    const pb = parentPanel.bounds;
    const holder = new THREE.Object3D();
    holder.position.copy(toV3({ x: pb.x + pb.width / 2, y: pb.y + pb.height })).sub(parent.origin);
    holder.rotation.x = Math.PI / 2;
    holder.scale.setScalar(Math.min(1, pb.width / (child.bounds.width || 1)));
    const cb = child.bounds;
    const mesh = factory.panel(child, toV3({ x: cb.x + cb.width / 2, y: cb.y }));
    mesh.position.z = -0.6;
    holder.add(mesh);
    parent.node.add(holder);
    placed.set(childId, { node: holder, origin: toV3({ x: cb.x + cb.width / 2, y: cb.y }) });
  }

  return part;
}

function buildTub(panels: Map<string, PanelFace>, factory: MeshFactory) {
  const model = new THREE.Group();
  const lid = new THREE.Group();
  const body = panels.get('tub-body');
  if (!body) return { model, lid, height: 0 };

  const poly = body.polygon;
  const half = Math.floor(poly.length / 2);
  const outer = poly.slice(0, half);
  const inner = poly.slice(half).reverse();
  const [p1, p2, p3] = [outer[0], outer[Math.floor(half / 2)], outer[half - 1]];
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  const s1 = p1.x ** 2 + p1.y ** 2;
  const s2 = p2.x ** 2 + p2.y ** 2;
  const s3 = p3.x ** 2 + p3.y ** 2;
  const apex = {
    x: (s1 * (p2.y - p3.y) + s2 * (p3.y - p1.y) + s3 * (p1.y - p2.y)) / d,
    y: (s1 * (p3.x - p2.x) + s2 * (p1.x - p3.x) + s3 * (p2.x - p1.x)) / d,
  };
  const rOuter = Math.hypot(p1.x - apex.x, p1.y - apex.y);
  const rInner = Math.hypot(inner[0].x - apex.x, inner[0].y - apex.y);
  const phiStart = Math.atan2(p1.y - apex.y, p1.x - apex.x);
  // Sum per-step angles so sectors wider than 180° don't wrap
  let sweep = 0;
  for (let i = 1; i < half; i++) {
    const step = Math.atan2(outer[i].y - apex.y, outer[i].x - apex.x) - Math.atan2(outer[i - 1].y - apex.y, outer[i - 1].x - apex.x);
    sweep += Math.atan2(Math.sin(step), Math.cos(step));
  }

  const rTop = (rOuter * Math.abs(sweep)) / (Math.PI * 2);
  const rBot = (rInner * Math.abs(sweep)) / (Math.PI * 2);
  const height = Math.sqrt(Math.max((rOuter - rInner) ** 2 - (rTop - rBot) ** 2, 1));

  const N = 96;
  const M = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= N; i++) {
    const theta = (i / N) * Math.PI * 2 + Math.PI;
    const s = 1 - i / N;
    for (let j = 0; j <= M; j++) {
      const t = j / M;
      const R = rBot + (rTop - rBot) * t;
      positions.push(R * Math.sin(theta), t * height, R * Math.cos(theta));
      const r = rInner + (rOuter - rInner) * t;
      const phi = phiStart + sweep * s;
      uvs.push(...factory.uv(apex.x + r * Math.cos(phi), apex.y + r * Math.sin(phi)));
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j;
      const b = (i + 1) * (M + 1) + j;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const wall = new THREE.BufferGeometry();
  wall.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  wall.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  wall.setIndex(index);
  wall.computeVertexNormals();
  model.add(factory.pair(wall, 'tub-body'));

  const disc = (id: string, radius: number, y: number, facingUp: boolean) => {
    const panel = panels.get(id);
    if (!panel) return null;
    const c = toV3({ x: panel.bounds.x + panel.bounds.width / 2, y: panel.bounds.y + panel.bounds.height / 2 });
    const mesh = factory.panel(panel, c);
    const holder = new THREE.Group();
    holder.add(mesh);
    holder.scale.setScalar(radius / (panel.bounds.width / 2));
    holder.rotation.x = facingUp ? -Math.PI / 2 : Math.PI / 2;
    holder.position.y = y;
    return holder;
  };
  const bottom = disc('tub-bottom-disc', rBot, 0, false);
  if (bottom) model.add(bottom);

  const lidR = rTop * 1.05;
  const lidTop = disc('tub-lid-top', lidR, height + 1, true);
  if (lidTop) lid.add(lidTop);

  const skirt = panels.get('tub-lid-skirt');
  if (skirt) {
    const sh = Math.min(skirt.bounds.height, height * 0.18);
    const sp: number[] = [];
    const su: number[] = [];
    const si: number[] = [];
    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * Math.PI * 2 + Math.PI;
      const x = skirt.bounds.x + (i / N) * skirt.bounds.width;
      for (const [k, yy] of [[0, height + 1], [1, height + 1 - sh]] as const) {
        sp.push(lidR * Math.sin(theta), yy, lidR * Math.cos(theta));
        su.push(...factory.uv(x, skirt.bounds.y + k * skirt.bounds.height));
      }
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      const b = (i + 1) * 2;
      si.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
    g.setIndex(si);
    g.computeVertexNormals();
    lid.add(factory.pair(g, 'tub-lid-skirt'));
  }
  model.add(lid);
  return { model, lid, height };
}

const AXES: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

export interface PanelFrame {
  right: THREE.Vector3;
  up: THREE.Vector3;
  normal: THREE.Vector3;
}

export function computePanelFrames(dieline: DielineResult): Map<string, PanelFrame> {
  const b = dieline.totalBounds;
  const sheet: PrintSheet = { canvas: null, minX: b.minX, minY: b.minY, width: b.width || 1, height: b.height || 1 };
  const model = buildFoldedModel(dieline, sheet, '#ffffff', true);
  model.root.updateMatrixWorld(true);
  const frames = new Map<string, PanelFrame>();
  model.root.traverse(obj => {
    const id = obj.userData.panelId as string | undefined;
    if (!id || frames.has(id) || id === 'tub-body' || id === 'tub-lid-skirt') return;
    const q = obj.getWorldQuaternion(new THREE.Quaternion());
    frames.set(id, {
      right: new THREE.Vector3(1, 0, 0).applyQuaternion(q),
      up: new THREE.Vector3(0, 1, 0).applyQuaternion(q),
      normal: new THREE.Vector3(0, 0, 1).applyQuaternion(q),
    });
  });
  model.dispose();
  return frames;
}

export function panelUprightAngles(dieline: DielineResult): Map<string, number> {
  const result = new Map<string, number>();
  for (const [id, f] of computePanelFrames(dieline)) {
    const desired = f.normal.y > 0.7
      ? new THREE.Vector3(0, 0, -1)
      : f.normal.y < -0.7
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);
    let best = 0;
    let bestDot = -Infinity;
    for (const deg of [0, 90, 180, 270]) {
      const r = THREE.MathUtils.degToRad(deg);
      const dir = f.right.clone().multiplyScalar(Math.sin(r)).add(f.up.clone().multiplyScalar(Math.cos(r)));
      const dot = dir.dot(desired);
      if (dot > bestDot + 1e-6) {
        bestDot = dot;
        best = deg;
      }
    }
    result.set(id, best);
  }
  return result;
}

export function buildFoldedModel(dieline: DielineResult, sheet: PrintSheet, boardColor: string, framesOnly = false): FoldedModel {
  const panels = new Map(dieline.panels.map(p => [p.id, p]));
  const texture = sheet.canvas ? new THREE.CanvasTexture(sheet.canvas) : new THREE.Texture();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const factory = new MeshFactory(sheet, texture, boardColor, framesOnly);
  const pivots = new Map<string, { pivot: THREE.Object3D; axis: THREE.Vector3; angle: number }>();

  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  let setOpenness: (t: number) => void = () => {};

  if (dieline.templateId === 'round-food-tub') {
    const tub = buildTub(panels, factory);
    model.add(tub.model);
    const lidY = tub.lid.position.y;
    setOpenness = (t) => { tub.lid.position.y = lidY + t * tub.height * 0.7; };
  } else {
    const spec = FOLD_SPECS[dieline.templateId];
    if (spec) {
      const specParts = spec.parts.map(p => ({ ...p, folds: p.folds?.map(f => [...f] as [string, string, number]) }));

      if (dieline.templateId === 'sandwich-wedge-box') {
        const back = panels.get('sandwich-back');
        const base = panels.get('sandwich-base');
        if (back && base) {
          const lean = Math.atan2(back.bounds.height, base.bounds.height);
          const folds = specParts[0].folds!;
          folds.find(f => f[0] === 'sandwich-front')![2] = 180 - THREE.MathUtils.radToDeg(lean);
          folds.find(f => f[0] === 'sandwich-tuck-flap')![2] = 90 + THREE.MathUtils.radToDeg(lean);
        }
      }

      const parts = specParts.map(ps => {
        const part = buildPart(ps, panels, factory, pivots);
        const holder = new THREE.Group();
        holder.add(part);
        part.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(part);
        const center = box.getCenter(new THREE.Vector3());
        part.position.sub(center);
        if (ps.flip) holder.rotation.y = Math.PI;
        if (ps.scale) holder.scale.setScalar(ps.scale);
        model.add(holder);
        return { holder, size: box.getSize(new THREE.Vector3()) };
      });

      const open = spec.open;
      if (open?.kind === 'hinge') {
        const entry = pivots.get(open.panel);
        if (entry) {
          setOpenness = (t) => {
            entry.pivot.quaternion.setFromAxisAngle(entry.axis, entry.angle + THREE.MathUtils.degToRad(open.delta * t));
          };
        }
      } else if (open?.kind === 'slide') {
        const target = parts[open.part];
        if (target) {
          const axis = AXES[open.axis];
          const span = Math.abs(target.size.dot(axis)) || 1;
          setOpenness = (t) => { target.holder.position.copy(axis).multiplyScalar(open.distance * span * t); };
        }
      }

      for (const [axis, deg] of spec.orient ?? []) {
        model.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(AXES[axis], THREE.MathUtils.degToRad(deg)));
      }
    }
  }

  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  setOpenness(1);
  root.updateMatrixWorld(true);
  const openBox = new THREE.Box3().setFromObject(model);
  setOpenness(0);
  root.updateMatrixWorld(true);
  const radius = Math.max(
    box.getSize(new THREE.Vector3()).length() / 2,
    openBox.max.length(),
    openBox.min.length(),
  );

  const closedBox = box.clone().translate(center.clone().negate());
  return {
    root,
    radius,
    bounds: closedBox,
    openBounds: closedBox.clone().union(openBox),
    setOpenness,
    dispose: () => {
      factory.geometries.forEach(g => g.dispose());
      factory.printMaterial.dispose();
      factory.boardMaterial.dispose();
      texture.dispose();
    },
  };
}
