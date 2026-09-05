import { PanelFace } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { ProjectedGraphic } from './previewTypes';

/**
 * Calculates affine transform matrix string `matrix(a, b, c, d, e, f)`
 * that maps local rect [0, 0, localW, localH] to the 4-corner quad [p0, p1, p2, p3]
 * (p0=Top-Left, p1=Top-Right, p2=Bottom-Right, p3=Bottom-Left)
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

  // u-axis vector along top edge: (p1 - p0) / localW
  const a = (p1.x - p0.x) / localW;
  const b = (p1.y - p0.y) / localW;

  // v-axis vector along left edge: (p3 - p0) / localH
  const c = (p3.x - p0.x) / localH;
  const d = (p3.y - p0.y) / localH;

  // translation offset (Top-Left corner)
  const e = p0.x;
  const f = p0.y;

  return `matrix(${a.toFixed(5)}, ${b.toFixed(5)}, ${c.toFixed(5)}, ${d.toFixed(5)}, ${e.toFixed(2)}, ${f.toFixed(2)})`;
}

/**
 * Maps graphics belonging to a panel into normalized local coordinates for an assembled face
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
    // Relative position inside panel bounds [-0.5, 0.5]
    const itemX = item.x ?? pcx;
    const itemY = item.y ?? pcy;
    const relNormX = (itemX - pcx) / pw;
    const relNormY = (itemY - pcy) / ph;

    // Map to face local coordinates [0, targetLocalW] and [0, targetLocalH]
    const localX = (0.5 + relNormX) * targetLocalW;
    const localY = (0.5 + relNormY) * targetLocalH;

    // Scale proportional to target face dimensions vs source panel dimensions
    const scaleFactor = Math.min(targetLocalW / pw, targetLocalH / ph);
    const sX = (item.scaleX ?? 1) * scaleFactor;
    const sY = (item.scaleY ?? 1) * scaleFactor;

    // Dimension computation for image, icon, and code items
    let itemW: number | undefined;
    let itemH: number | undefined;

    if (item.type === 'image' || item.type === 'icon') {
      const nw = item.naturalWidth || item.width || (item.type === 'image' ? 120 : 40);
      const nh = item.naturalHeight || item.height || (item.type === 'image' ? 120 : 40);
      
      // Effective dimension on 2D panel
      const renderedW = item.scaleX !== undefined ? nw * item.scaleX : pw * (item.type === 'image' ? 0.70 : 0.35);
      const renderedH = item.scaleY !== undefined ? nh * item.scaleY : ph * (item.type === 'image' ? 0.70 : 0.35);
      
      // Proportional dimension on 3D face
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
