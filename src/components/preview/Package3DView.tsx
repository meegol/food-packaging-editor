import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { DielineResult } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';
import { MaterialFinish } from '../../core/preview/previewTypes';
import { renderPrintSheet } from '../../core/preview3d/printTexture';
import { buildFoldedModel, FoldedModel } from '../../core/preview3d/foldModel';

export const BOARD_COLORS: Record<MaterialFinish, string> = {
  white: '#f4f5f2',
  kraft: '#c9a27a',
  dark: '#2b2b31',
  cream: '#f6ebcf',
};

export interface Package3DViewHandle {
  pickPanel: (clientX: number, clientY: number) => string | null;
  snapshot: (background: string | null, scale?: number) => string | null;
}

interface Package3DViewProps {
  dieline: DielineResult;
  graphics: GraphicItem[];
  material: MaterialFinish;
  yaw: number;
  pitch: number;
  openness: number;
  cursor?: string;
  insetTop?: number;
  insetBottom?: number;
}

const FOV = 30;

function fitDistance(box: THREE.Box3, pitchDeg: number, tanX: number, tanY: number): number {
  const corners: THREE.Vector3[] = [];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
    }
  }
  const pr = THREE.MathUtils.degToRad(pitchDeg);
  let dist = 1;
  for (let yaw = 0; yaw < 360; yaw += 15) {
    const yr = THREE.MathUtils.degToRad(yaw);
    const back = new THREE.Vector3(Math.sin(yr) * Math.cos(pr), Math.sin(pr), Math.cos(yr) * Math.cos(pr));
    const right = new THREE.Vector3(0, 1, 0).cross(back).normalize();
    const up = back.clone().cross(right).normalize();
    for (const c of corners) {
      const toward = c.dot(back);
      dist = Math.max(dist, toward + Math.abs(c.dot(right)) / tanX, toward + Math.abs(c.dot(up)) / tanY);
    }
  }
  return dist;
}

function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export const Package3DView = forwardRef<Package3DViewHandle, Package3DViewProps>(({
  dieline, graphics, material, yaw, pitch, openness, cursor, insetTop = 0, insetBottom = 0,
}, ref) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const three = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    shadow: THREE.Mesh;
    model: FoldedModel | null;
  } | null>(null);
  const view = useRef({ yaw, pitch, openness, insetTop, insetBottom });
  view.current = { yaw, pitch, openness, insetTop, insetBottom };
  const [loading, setLoading] = useState(true);

  const render = () => {
    const t = three.current;
    if (!t) return;
    const fallback = new THREE.Box3(new THREE.Vector3(-50, -50, -50), new THREE.Vector3(50, 50, 50));
    const closed = t.model?.bounds ?? fallback;
    const opened = t.model?.openBounds ?? closed;
    const k = Math.min(1, view.current.openness * 1.25);
    const bounds = new THREE.Box3(
      closed.min.clone().lerp(opened.min, k),
      closed.max.clone().lerp(opened.max, k),
    );
    const size = t.renderer.getSize(new THREE.Vector2());
    const { insetTop: top, insetBottom: bottom } = view.current;
    const visible = Math.max(size.y - top - bottom, size.y * 0.35);
    const tanY = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (visible / size.y);
    const tanX = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (size.x / size.y);
    const dist = fitDistance(bounds, view.current.pitch, tanX * 0.86, tanY * 0.86);
    t.camera.setViewOffset(size.x, size.y, 0, (bottom - top) / 2, size.x, size.y);
    const yr = THREE.MathUtils.degToRad(view.current.yaw);
    const pr = THREE.MathUtils.degToRad(view.current.pitch);
    t.camera.position.set(dist * Math.sin(yr) * Math.cos(pr), dist * Math.sin(pr), dist * Math.cos(yr) * Math.cos(pr));
    t.camera.near = dist / 50;
    t.camera.far = dist * 4;
    t.camera.lookAt(0, 0, 0);
    t.camera.updateProjectionMatrix();
    t.renderer.render(t.scene, t.camera);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-0.6, 1.2, 1.0);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(1.0, 0.3, 0.6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.45);
    rim.position.set(0.2, 0.6, -1.0);
    scene.add(rim);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);

    three.current = { renderer, scene, camera, shadow, model: null };

    const resize = () => {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = `${w}px`;
      renderer.domElement.style.height = `${h}px`;
      camera.aspect = w / h;
      render();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      observer.disconnect();
      three.current?.model?.dispose();
      const shadowMaterial = shadow.material as THREE.MeshBasicMaterial;
      shadowMaterial.map?.dispose();
      shadowMaterial.dispose();
      shadow.geometry.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      three.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const board = BOARD_COLORS[material] ?? BOARD_COLORS.white;
    const timer = window.setTimeout(async () => {
      const sheet = await renderPrintSheet(dieline, graphics, board);
      const t = three.current;
      if (cancelled || !t) return;
      const next = buildFoldedModel(dieline, sheet, board);
      next.setOpenness(view.current.openness);
      if (t.model) {
        t.scene.remove(t.model.root);
        t.model.dispose();
      }
      t.model = next;
      t.scene.add(next.root);

      next.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(next.root);
      const size = box.getSize(new THREE.Vector3());
      t.shadow.position.set(0, box.min.y - 0.5, 0);
      t.shadow.scale.set(size.x * 1.5 + 1, size.z * 1.5 + 1, 1);
      setLoading(false);
      render();
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [dieline, graphics, material]);

  useEffect(() => {
    three.current?.model?.setOpenness(openness);
    render();
  }, [yaw, pitch, openness, insetTop, insetBottom]);

  useImperativeHandle(ref, () => ({
    pickPanel: (clientX, clientY) => {
      const t = three.current;
      if (!t?.model) return null;
      const rect = t.renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, t.camera);
      const hit = ray.intersectObject(t.model.root, true).find(h => h.object.userData.panelId);
      return hit ? (hit.object.userData.panelId as string) : null;
    },
    snapshot: (background, scale = 2) => {
      const t = three.current;
      if (!t) return null;
      const { renderer } = t;
      const size = renderer.getSize(new THREE.Vector2());
      const ratio = renderer.getPixelRatio();
      renderer.setPixelRatio(scale);
      renderer.setSize(size.x, size.y, false);
      if (background) renderer.setClearColor(background, 1);
      render();
      const url = renderer.domElement.toDataURL('image/png');
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(ratio);
      renderer.setSize(size.x, size.y, false);
      render();
      return url;
    },
  }));

  return (
    <div
      ref={hostRef}
      className="package-3d-view"
      style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%', cursor }}
    >
      {loading && <div className="package-3d-loading">Folding package…</div>}
    </div>
  );
});

Package3DView.displayName = 'Package3DView';
