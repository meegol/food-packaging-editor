import { DielineResult } from '../dieline/types';
import { GraphicItem } from './types';

export function remapGraphicsToDieline(items: GraphicItem[], from: DielineResult, to: DielineResult): GraphicItem[] {
  return items.map(item => {
    const a = from.panels.find(p => p.id === item.panelId)?.bounds;
    const b = to.panels.find(p => p.id === item.panelId)?.bounds;
    if (!a || !b || !a.width || !a.height) return item;

    const next: GraphicItem = { ...item };
    if (item.x !== undefined) next.x = b.x + ((item.x - a.x) / a.width) * b.width;
    if (item.y !== undefined) next.y = b.y + ((item.y - a.y) / a.height) * b.height;

    const w = item.naturalWidth && item.scaleX ? item.naturalWidth * item.scaleX : undefined;
    const h = item.naturalHeight && item.scaleY ? item.naturalHeight * item.scaleY : undefined;
    const coversPanel = item.type === 'image' && w !== undefined && h !== undefined
      && w >= a.width * 0.98 && h >= a.height * 0.98;
    if (coversPanel && item.scaleX && item.scaleY) {
      next.scaleX = item.scaleX * (b.width / a.width);
      next.scaleY = item.scaleY * (b.height / a.height);
      next.width = item.naturalWidth! * next.scaleX;
      next.height = item.naturalHeight! * next.scaleY;
    }
    return next;
  });
}
