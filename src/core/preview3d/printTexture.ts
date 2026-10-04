import { Polygon, StaticCanvas } from 'fabric';
import { DielineResult } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { createGraphicObject } from '../canvas/graphicObjects';

export interface PrintSheet {
  canvas: HTMLCanvasElement | null;
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const PAD = 4;

export async function renderPrintSheet(
  dieline: DielineResult,
  graphics: GraphicItem[],
  boardColor: string,
  maxPixels = 4096,
): Promise<PrintSheet> {
  const b = dieline.totalBounds;
  const minX = b.minX - PAD;
  const minY = b.minY - PAD;
  const width = b.width + PAD * 2;
  const height = b.height + PAD * 2;
  const scale = Math.min(maxPixels / width, maxPixels / height, 8);

  if (typeof document !== 'undefined' && document.fonts) {
    const specs = new Set(
      graphics
        .filter(g => g.type === 'text' && g.fontFamily)
        .map(g => `${g.fontStyle === 'italic' ? 'italic ' : ''}${g.fontWeight || '600'} 16px ${g.fontFamily}`),
    );
    await Promise.all([...specs].map(s => document.fonts.load(s).catch(() => [])));
  }

  const el = document.createElement('canvas');
  const sheet = new StaticCanvas(el, {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    renderOnAddRemove: false,
    enableRetinaScaling: false,
    backgroundColor: boardColor,
  });
  sheet.setViewportTransform([scale, 0, 0, scale, -minX * scale, -minY * scale]);

  for (const panel of dieline.panels) {
    sheet.add(new Polygon(panel.polygon.map(p => ({ x: p.x, y: p.y })), {
      fill: boardColor,
      stroke: boardColor,
      strokeWidth: 1,
      objectCaching: false,
    }));
  }

  for (const g of graphics) {
    const panel = dieline.panels.find(p => p.id === g.panelId);
    if (!panel) continue;
    try {
      const obj = await createGraphicObject({ ...g }, panel);
      if (obj) sheet.add(obj);
    } catch (err) {
      console.error('Failed to draw graphic on 3D print sheet:', err);
    }
  }

  sheet.renderAll();
  const canvas = sheet.toCanvasElement(1);
  sheet.dispose();
  return { canvas, minX, minY, width, height };
}
