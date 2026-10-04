import { FabricImage, FabricObject, Polygon, Textbox } from 'fabric';
import { PanelFace } from '../dieline/types';
import { GraphicItem } from '../graphics/types';

const SELECTION_STYLE = {
  cornerColor: '#6366f1',
  cornerStrokeColor: '#ffffff',
  borderColor: '#818cf8',
  cornerSize: 8,
  transparentCorners: false,
  cornerStyle: 'circle' as const,
  selectable: true,
  evented: true,
};

export function textWrapWidth(item: GraphicItem, panelWidth: number): number | undefined {
  if (item.type !== 'text') return undefined;
  return item.width ?? Math.max(Math.min(panelWidth * 0.85, 280), 80);
}

function clipTo(panel: PanelFace): Polygon {
  return new Polygon(panel.polygon.map(p => ({ x: p.x, y: p.y })), { absolutePositioned: true });
}

export async function createGraphicObject(item: GraphicItem, panel: PanelFace): Promise<FabricObject | null> {
  if (item.type === 'text') {
    const textObj = new Textbox(item.text || 'Food Packaging Label', {
      left: item.x ?? panel.center.x,
      top: item.y ?? panel.center.y,
      width: textWrapWidth(item, panel.bounds.width),
      fontSize: item.fontSize || 15,
      fontFamily: item.fontFamily || 'Inter, sans-serif',
      fontWeight: (item.fontWeight || '600') as string,
      fontStyle: (item.fontStyle || 'normal') as string,
      fill: item.fill || '#1e293b',
      textAlign: item.textAlign || 'center',
      lineHeight: item.lineHeight || 1.25,
      scaleX: item.scaleX ?? 1,
      scaleY: item.scaleY ?? 1,
      angle: item.angle ?? 0,
      originX: 'center',
      originY: 'center',
      ...SELECTION_STYLE,
    });
    textObj.clipPath = item.clipToPanel ? clipTo(panel) : undefined;
    return textObj;
  }

  if (!item.src) return null;
  const fabricImg = await FabricImage.fromURL(item.src, { crossOrigin: 'anonymous' });

  let sX = item.scaleX ?? 1;
  let sY = item.scaleY ?? 1;
  if (item.scaleX === undefined) {
    let fitRatio = 0.75;
    if (item.type === 'icon') fitRatio = 0.35;
    if (item.type === 'barcode') fitRatio = 0.65;
    if (item.type === 'qrcode') fitRatio = 0.40;

    const maxW = panel.bounds.width * fitRatio;
    const maxH = panel.bounds.height * fitRatio;
    const scaleFit = Math.min(maxW / (fabricImg.width || 1), maxH / (fabricImg.height || 1));
    sX = scaleFit;
    sY = scaleFit;
    item.scaleX = sX;
    item.scaleY = sY;
  }

  item.naturalWidth = fabricImg.width;
  item.naturalHeight = fabricImg.height;
  item.width = (fabricImg.width || 100) * (item.scaleX ?? 1);
  item.height = (fabricImg.height || 100) * (item.scaleY ?? 1);

  fabricImg.set({
    left: item.x ?? panel.center.x,
    top: item.y ?? panel.center.y,
    scaleX: sX,
    scaleY: sY,
    angle: item.angle ?? 0,
    originX: 'center',
    originY: 'center',
    ...SELECTION_STYLE,
  });
  fabricImg.clipPath = item.clipToPanel ? clipTo(panel) : undefined;
  return fabricImg;
}
