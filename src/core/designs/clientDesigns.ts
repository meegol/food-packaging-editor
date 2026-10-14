import { PackagingDimensions } from '../dieline/types';
import { GraphicItem } from '../graphics/types';

/**
 * Prebuilt designs made by clients in the editor, recovered from their PDF exports.
 * Each is a fixed set of graphics for one template at the size it was designed,
 * stored under public/client-designs/<id>/ (design.json + image files + thumb.jpg).
 */
export interface ClientDesign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  dimensions: PackagingDimensions;
}

export const CLIENT_DESIGNS: ClientDesign[] = [
  {
    id: 'katuray-loaf-bread',
    name: 'Katuray Loaf Bread',
    description: 'Sesbania Grandiflora loaf bread on kraft, sliced bread loaf bag.',
    templateId: 'bread-loaf-bag',
    dimensions: { length: 320, width: 120, depth: 110, thickness: 0.04, unit: 'mm' },
  },
  {
    id: 'katuray-donut',
    name: 'Katuray Donut',
    description: 'Pink glazed donut sleeve with drip edges, dessert sleeve box.',
    templateId: 'dessert-sleeve-box',
    dimensions: { length: 180, width: 90, depth: 45, thickness: 1.2, unit: 'mm' },
  },
  {
    id: 'savor-ice-cream',
    name: 'Savor Ice Cream',
    description: 'Blue pea flower and banana ice cream, round food tub with lid.',
    templateId: 'round-food-tub',
    dimensions: { length: 90, width: 115, depth: 85, thickness: 0.6, unit: 'mm' },
  },
  {
    id: 'nori-alugbati',
    name: 'Nori Alugbati Sheets',
    description: 'Natural alugbati nori sheets with green hills, sachet pack.',
    templateId: 'sachet-stick-pack',
    dimensions: { length: 8.25, width: 7.5, depth: 0.31, thickness: 0.15, unit: 'in' },
  },
  {
    id: 'red-kidney-cookies',
    name: 'Red Kidney Bean Cookies',
    description: 'Bold red kidney bean cookies, side gusset bag.',
    templateId: 'side-gusset-bag',
    dimensions: { length: 220, width: 95, depth: 60, thickness: 0.2, unit: 'mm' },
  },
  {
    id: 'bite-me-cookies',
    name: 'Bite Me Cookies',
    description: 'Kraft "Bite Me" chocolate chip cookies, side gusset bag.',
    templateId: 'side-gusset-bag',
    dimensions: { length: 220, width: 95, depth: 60, thickness: 0.2, unit: 'mm' },
  },
  {
    id: 'banana-peel-flour',
    name: 'Banana Peel Flour',
    description: 'Banana peel flour 1kg with nutrition panel, stand-up pouch.',
    templateId: 'standup-pouch',
    dimensions: { length: 12, width: 8, depth: 2.36, thickness: 0.2, unit: 'in' },
  },
];

export function getClientDesign(id: string): ClientDesign | undefined {
  return CLIENT_DESIGNS.find(d => d.id === id);
}

export function clientDesignThumbnail(id: string): string {
  return `client-designs/${id}/thumb.jpg`;
}

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const cache = new Map<string, Promise<GraphicItem[]>>();

/**
 * Load a client design's graphics. Images are inlined as data URLs so they
 * behave like user uploads (saved project files, exports and 3D preview stay self-contained).
 */
export function loadClientDesign(id: string): Promise<GraphicItem[]> {
  if (!cache.has(id)) {
    const load = (async () => {
      const res = await fetch(`client-designs/${id}/design.json`);
      if (!res.ok) throw new Error(`Design "${id}" not found (${res.status})`);
      const items: GraphicItem[] = await res.json();
      const srcs = new Map<string, Promise<string>>();
      for (const g of items) {
        if (g.src && !g.src.startsWith('data:') && !srcs.has(g.src)) srcs.set(g.src, toDataUrl(g.src));
      }
      return Promise.all(items.map(async g => (g.src && srcs.has(g.src) ? { ...g, src: await srcs.get(g.src)! } : g)));
    })();
    load.catch(() => cache.delete(id));
    cache.set(id, load);
  }
  return cache.get(id)!.then(items => items.map(g => ({ ...g })));
}
