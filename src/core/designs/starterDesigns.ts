import { DielineResult, PanelFace, Point } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { panelUprightAngles } from '../preview3d/foldModel';
import { BackgroundStyle, BadgeStyle, FoodArtId, SvgAsset, brandBadge, foodArt, panelBackground } from './starterArt';

export const BLANK_DESIGN_ID = 'blank';
export const DEFAULT_DESIGN_ID = 'kraft';

export interface StarterStyle {
  id: string;
  name: string;
  description: string;
  brand: string;
  tagline: string;
  background: BackgroundStyle;
  badge: BadgeStyle;
  displayFont: string;
  bodyFont: string;
  ink: string;
  badgeInk: string;
  badgeFill: string;
  highlight: string;
  propColor: string;
  swatch: [string, string, string];
  uppercase?: boolean;
}

export const STARTER_STYLES: StarterStyle[] = [
  {
    id: 'kraft',
    name: 'Kraft Artisan',
    description: 'Recycled kraft texture, cream seal badge, gourmet serif.',
    brand: 'Golden Crust',
    tagline: 'Small-batch · Handmade daily',
    background: 'kraft',
    badge: 'kraft',
    displayFont: '"Playfair Display", Georgia, serif',
    bodyFont: 'Montserrat, sans-serif',
    ink: '#3b2a1e',
    badgeInk: '#5a3720',
    badgeFill: '#f6ecdc',
    highlight: '#7c3f0e',
    propColor: '#b45309',
    swatch: ['#c9a27a', '#f6ecdc', '#5a3720'],
  },
  {
    id: 'street',
    name: 'Bold Street Food',
    description: 'Loud red doodle pattern, yellow starburst, condensed caps.',
    brand: 'BIG BITE',
    tagline: 'Loud flavor. No apologies.',
    background: 'street',
    badge: 'street',
    displayFont: 'Oswald, sans-serif',
    bodyFont: 'Montserrat, sans-serif',
    ink: '#fffaf0',
    badgeInk: '#1d1d1f',
    badgeFill: '#ffc93c',
    highlight: '#ffc93c',
    propColor: '#1d1d1f',
    swatch: ['#e63b2e', '#ffc93c', '#1d1d1f'],
    uppercase: true,
  },
  {
    id: 'fresh',
    name: 'Fresh & Clean',
    description: 'Bright white, leaf accents, friendly geometric sans.',
    brand: 'Green Leaf',
    tagline: 'Fresh · Local · Honest',
    background: 'fresh',
    badge: 'fresh',
    displayFont: 'Montserrat, sans-serif',
    bodyFont: 'Inter, sans-serif',
    ink: '#1f3d2b',
    badgeInk: '#2e6b3a',
    badgeFill: '#ffffff',
    highlight: '#3f8f4f',
    propColor: '#3f8f4f',
    swatch: ['#f6f8f1', '#7cb342', '#1f3d2b'],
  },
  {
    id: 'noir',
    name: 'Midnight Premium',
    description: 'Charcoal with gold foil frames for a luxury feel.',
    brand: 'Maison Noir',
    tagline: 'The Artisan Collection',
    background: 'noir',
    badge: 'noir',
    displayFont: '"Playfair Display", Georgia, serif',
    bodyFont: 'Montserrat, sans-serif',
    ink: '#f4e9d8',
    badgeInk: '#d4a24c',
    badgeFill: '#17171c',
    highlight: '#d4a24c',
    propColor: '#2a2a31',
    swatch: ['#17171c', '#d4a24c', '#f4e9d8'],
  },
];

type Role = 'hero' | 'back' | 'side' | 'slogan' | 'badge';

interface TemplateContent {
  food: FoodArtId;
  product: string;
  netWeight: string;
  ingredients: string;
  roles: Record<string, Role>;
  plain?: boolean;
}

const TEMPLATE_CONTENT: Record<string, TemplateContent> = {
  'burger-box': {
    food: 'burger',
    product: 'Classic Cheeseburger',
    netWeight: 'NET WT. 280g',
    ingredients: 'Ingredients: brioche bun, 100% beef patty, cheddar, lettuce, tomato, house sauce.',
    roles: { 'lid-top': 'hero', 'rear-hinge': 'back', 'lid-left': 'side', 'lid-right': 'side', 'lid-front': 'slogan' },
  },
  'sandwich-wedge-box': {
    food: 'sandwich',
    product: 'Club Sandwich',
    netWeight: 'NET WT. 220g',
    ingredients: 'Ingredients: white bread, smoked ham, cheddar, lettuce, tomato, mayonnaise.',
    roles: { 'sandwich-front': 'hero', 'sandwich-back': 'back', 'sandwich-left-side': 'side', 'sandwich-right-side': 'side', 'sandwich-tuck-flap': 'slogan' },
  },
  'fries-scoop-box': {
    food: 'fries',
    product: 'Golden Fries',
    netWeight: 'NET WT. 150g',
    ingredients: 'Ingredients: potatoes, sunflower oil, sea salt.',
    roles: { 'fries-front': 'hero', 'fries-back': 'badge', 'fries-left': 'side', 'fries-right': 'side' },
  },
  'pillow-box': {
    food: 'croissant',
    product: 'Butter Croissant',
    netWeight: 'NET WT. 2 x 70g',
    ingredients: 'Ingredients: wheat flour, butter (milk), sugar, yeast, eggs, salt.',
    roles: { 'pillow-front': 'hero', 'pillow-back': 'back' },
  },
  'dessert-sleeve-box': {
    food: 'cake',
    product: 'Strawberry Shortcake',
    netWeight: 'NET WT. 320g',
    ingredients: 'Ingredients: sponge (flour, eggs, sugar), fresh cream, strawberries. Keep refrigerated.',
    roles: {
      'sleeve-top': 'hero', 'sleeve-bottom': 'back', 'sleeve-left': 'side', 'sleeve-right': 'side',
      'tray-top-wall': 'side', 'tray-bottom-wall': 'side',
    },
  },
  'round-food-tub': {
    food: 'ramen',
    product: 'Signature Ramen',
    netWeight: 'NET WT. 450g',
    ingredients: 'Ingredients: wheat noodles, pork broth, egg, chashu, scallions.',
    roles: { 'tub-body': 'hero', 'tub-lid-top': 'badge' },
  },
  'pizza-box': {
    food: 'pizza',
    product: 'Pepperoni Pizza',
    netWeight: '12-inch · 8 slices',
    ingredients: 'Ingredients: wheat dough, tomato sauce, mozzarella, pepperoni, basil.',
    roles: { 'pizza-lid': 'hero', 'pizza-rear': 'side', 'pizza-lid-left': 'side', 'pizza-lid-right': 'side', 'pizza-lid-front': 'slogan' },
  },
  'standup-pouch': {
    food: 'coffee-beans',
    product: 'House Blend Coffee',
    netWeight: 'NET WT. 250g (8.8 OZ)',
    ingredients: '100% Arabica whole beans. Medium roast. Notes of cocoa and toasted almond.',
    roles: { 'pouch-front': 'hero', 'pouch-back': 'back' },
  },
  'side-gusset-bag': {
    food: 'cookies',
    product: 'Choco Chip Cookies',
    netWeight: 'NET WT. 200g',
    ingredients: 'Ingredients: wheat flour, butter, brown sugar, chocolate chips, eggs, vanilla.',
    roles: { 'bag-front': 'hero', 'bag-back-left': 'back', 'bag-back-right': 'slogan', 'bag-gusset-left': 'side', 'bag-gusset-right': 'side', 'bag-top-header': 'side' },
  },
  'sachet-stick-pack': {
    food: 'coffee-cup',
    product: '3-in-1 Coffee',
    netWeight: 'NET WT. 20g',
    ingredients: 'Coffee, sugar, creamer.',
    roles: { 'sachet-front': 'hero' },
  },
  'burger-wrapper': {
    food: 'burger',
    product: 'Smash Burger',
    netWeight: '',
    ingredients: '',
    roles: { 'wrapper-center': 'hero' },
    plain: true,
  },
  'bread-loaf-bag': {
    food: 'bread',
    product: 'Sliced Sandwich Bread',
    netWeight: 'NET WT. 600g · 16 slices',
    ingredients: 'Ingredients: wheat flour, water, yeast, sugar, vegetable oil, salt.',
    roles: { 'bread-front': 'hero', 'bread-back-left': 'back', 'bread-back-right': 'slogan', 'bread-gusset-left': 'side', 'bread-gusset-right': 'side', 'bread-top-header': 'side' },
  },
};

export function getStarterStyle(id: string): StarterStyle | undefined {
  return STARTER_STYLES.find(s => s.id === id);
}

export function getStarterThumbnail(templateId: string, styleId: string): SvgAsset | null {
  const style = getStarterStyle(styleId);
  const content = TEMPLATE_CONTENT[templateId];
  if (!style || !content) return null;
  return foodArt(content.food, style.propColor);
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function pointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function verticalSpan(panel: PanelFace, x: number): [number, number] {
  const ys: number[] = [];
  const poly = panel.polygon;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if ((a.x <= x && b.x > x) || (b.x <= x && a.x > x)) {
      ys.push(a.y + ((x - a.x) * (b.y - a.y)) / (b.x - a.x));
    }
  }
  if (ys.length < 2) return [panel.bounds.y, panel.bounds.y + panel.bounds.height];
  return [Math.min(...ys), Math.max(...ys)];
}

function isHiddenPanel(panel: PanelFace): boolean {
  return /glue|seam/.test(panel.id);
}

const GLYPH = 0.62;

function fitFont(text: string, maxWidth: number, preferred: number): number {
  const longestLine = Math.max(...text.split('\n').map(l => l.length), 1);
  return Math.min(preferred, maxWidth / (longestLine * GLYPH));
}

function fitHeading(text: string, boxWidth: number, preferred: number, maxLines = 2): number {
  const longestWord = Math.max(...text.split(/\s+/).map(w => w.length), 1);
  return Math.min(preferred, boxWidth / (longestWord * GLYPH), (boxWidth * maxLines) / ((text.length + 2) * GLYPH));
}

function headingSize(text: string, boxWidth: number, preferred: number): number {
  const oneLine = boxWidth / ((text.length + 1) * GLYPH);
  return oneLine >= preferred * 0.7 ? Math.min(preferred, oneLine) : fitHeading(text, boxWidth, preferred);
}

function estimateLines(text: string, fontSize: number, boxWidth: number): number {
  const perLine = Math.max(1, Math.floor(boxWidth / (fontSize * GLYPH)));
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/)) {
    const len = word.length + (used > 0 ? 1 : 0);
    if (used + len > perLine && used > 0) {
      lines++;
      used = word.length;
    } else {
      used += len;
    }
  }
  return lines;
}

function stackWords(text: string): string {
  return text.trim().split(/\s+/).join('\n');
}


function horizontalSpan(panel: PanelFace, y: number): [number, number] {
  const xs: number[] = [];
  const poly = panel.polygon;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
  }
  if (xs.length < 2) return [panel.bounds.x, panel.bounds.x + panel.bounds.width];
  return [Math.min(...xs), Math.max(...xs)];
}

interface Placement {
  x: number;
  y: number;
  angle?: number;
}

interface TextOptions {
  size: number;
  font: string;
  fill: string;
  box: number;
  weight?: string;
  italic?: boolean;
  lineHeight?: number;
}

interface Block {
  height: number;
  draw: (at: Placement) => void;
}

class DesignBuilder {
  readonly items: GraphicItem[] = [];
  private counter = 0;

  constructor(private readonly style: StarterStyle, private readonly content: TemplateContent) {}

  private nextId(panel: PanelFace, kind: string) {
    return `starter-${this.style.id}-${panel.id}-${kind}-${this.counter++}`;
  }

  private anchor(panel: PanelFace, x: number, y: number): Point {
    if (pointInPolygon({ x, y }, panel.polygon)) return { x, y };
    const c = panel.center;
    for (let t = 0.05; t <= 1; t += 0.05) {
      const p = { x: x + (c.x - x) * t, y: y + (c.y - y) * t };
      if (pointInPolygon(p, panel.polygon)) return p;
    }
    return { ...c };
  }

  caps(text: string) {
    return this.style.uppercase ? text.toUpperCase() : text;
  }

  image(panel: PanelFace, asset: SvgAsset, at: Placement, displayWidth: number, fileName: string) {
    const scale = displayWidth / asset.width;
    const pos = this.anchor(panel, at.x, at.y);
    this.items.push({
      id: this.nextId(panel, 'img'),
      panelId: panel.id,
      type: 'image',
      src: asset.src,
      fileName,
      x: pos.x,
      y: pos.y,
      naturalWidth: asset.width,
      naturalHeight: asset.height,
      width: asset.width * scale,
      height: asset.height * scale,
      scaleX: scale,
      scaleY: scale,
      angle: at.angle ?? 0,
      clipToPanel: true,
    });
  }

  text(panel: PanelFace, text: string, at: Placement, opts: TextOptions) {
    if (!text) return;
    const pos = this.anchor(panel, at.x, at.y);
    this.items.push({
      id: this.nextId(panel, 'txt'),
      panelId: panel.id,
      type: 'text',
      text,
      fontFamily: opts.font,
      fontSize: Math.round(opts.size * 10) / 10,
      fontWeight: opts.weight ?? '700',
      fontStyle: opts.italic ? 'italic' : 'normal',
      fill: opts.fill,
      textAlign: 'center',
      lineHeight: opts.lineHeight ?? 1.15,
      width: Math.round(opts.box),
      x: pos.x,
      y: pos.y,
      angle: at.angle ?? 0,
      clipToPanel: true,
    });
  }

  private textHeight(text: string, size: number, box: number, lineHeight = 1.15) {
    const lines = text.split('\n').reduce((n, line) => n + estimateLines(line, size, box), 0);
    return lines * size * lineHeight;
  }

  private textBlock(panel: PanelFace, text: string, opts: TextOptions): Block {
    return {
      height: this.textHeight(text, opts.size, opts.box, opts.lineHeight),
      draw: (at) => this.text(panel, text, at, opts),
    };
  }

  private stack(cx: number, y: number, h: number, blocks: Block[], topPct = 0.07, bottomPct = 0.9) {
    const top = y + h * topPct;
    const bottom = y + h * bottomPct;
    const used = blocks.reduce((a, b) => a + b.height, 0);
    const gap = Math.max(0, bottom - top - used) / (blocks.length + 1);
    let cursor = top + gap;
    for (const block of blocks) {
      block.draw({ x: cx, y: cursor + block.height / 2 });
      cursor += block.height + gap;
    }
  }

  background(panel: PanelFace, seed: number, ornament: boolean) {
    const b = panel.bounds;
    const decorated = ornament && panel.polygon.length === 4 && Math.min(b.width, b.height) > 60;
    const asset = panelBackground(this.style.background, b.width, b.height, seed, decorated);
    this.image(panel, asset, { x: b.x + b.width / 2, y: b.y + b.height / 2 }, b.width, `${panel.name} background`);
  }

  logo(panel: PanelFace, at: Placement, diameter: number) {
    this.image(panel, brandBadge(this.style.badge), at, diameter, 'Logo badge');
    const inner = diameter * 0.72;
    const brand = stackWords(this.caps(this.style.brand));
    const lines = brand.split('\n').length;
    this.text(panel, brand, at, {
      size: Math.min(fitFont(brand, inner, diameter * 0.22), (diameter * 0.42) / (lines * 1.05)),
      font: this.style.displayFont,
      fill: this.style.badgeInk,
      box: inner,
      lineHeight: 1.0,
    });
  }

  photo(panel: PanelFace, at: Placement, size: number) {
    this.image(panel, foodArt(this.content.food, this.style.propColor), at, size, 'Product photo');
  }

  hero(panel: PanelFace) {
    if (panel.id === 'tub-body') {
      this.heroAlongArc(panel);
      return;
    }
    const { x, width: w } = panel.bounds;
    const cx = x + w / 2;
    const [y, yEnd] = verticalSpan(panel, cx);
    const h = yEnd - y;
    if (h / w < 0.8) {
      this.heroWide(panel);
      return;
    }
    const s = Math.min(w, h);
    const tall = h / w >= 1.25;
    const box = w * 0.84;

    const badge = tall ? Math.min(w * 0.56, h * 0.18) : s * 0.24;
    const photoTarget = tall ? Math.min(w * 0.8, h * 0.34) : s * 0.42;
    const usable = h * 0.84;
    const minGap = h * 0.02;

    let blocks = this.heroText(panel, box, clamp(tall ? w * 0.13 : s * 0.1, 9, 64), tall);
    for (let i = 0; i < 12; i++) {
      const textTotal = blocks.reduce((a, b) => a + b.height, 0);
      if (usable - badge - textTotal - minGap * (blocks.length + 3) >= photoTarget * 0.9) break;
      blocks = this.heroText(panel, box, Math.max(8, (blocks[0] as Block & { size: number }).size * 0.9), tall);
    }
    const textTotal = blocks.reduce((a, b) => a + b.height, 0);
    const photo = clamp(usable - badge - textTotal - minGap * (blocks.length + 3), s * 0.24, photoTarget);

    this.stack(cx, y, h, [
      { height: badge, draw: (at) => this.logo(panel, at, badge) },
      { height: photo, draw: (at) => this.photo(panel, at, photo) },
      ...blocks,
    ]);
  }

  private heroText(panel: PanelFace, box: number, preferred: number, withNet: boolean) {
    const product = this.caps(this.content.product);
    const size = headingSize(product, box, preferred);
    const blocks: Array<Block & { size?: number }> = [
      { ...this.textBlock(panel, product, { size, font: this.style.displayFont, fill: this.style.ink, box }), size },
      this.textBlock(panel, this.style.tagline, {
        size: clamp(Math.min(Math.max(size * 0.45, box * 0.05), size * 0.6), 6, 26),
        font: this.style.bodyFont, fill: this.style.highlight, weight: '600', box,
      }),
    ];
    if (withNet && this.content.netWeight) {
      blocks.push(this.textBlock(panel, this.content.netWeight, {
        size: clamp(Math.min(Math.max(size * 0.4, box * 0.045), size * 0.55), 6, 20),
        font: this.style.bodyFont, fill: this.style.ink, weight: '600', box,
      }));
    }
    return blocks;
  }

  private heroWide(panel: PanelFace) {
    const { x, width: w } = panel.bounds;
    const leftX = x + w * 0.29;
    const rightX = x + w * 0.72;
    const [ly0, ly1] = verticalSpan(panel, leftX);
    const [ry0, ry1] = verticalSpan(panel, rightX);
    const colH = ry1 - ry0;
    const box = w * 0.44;

    const photo = Math.min((ly1 - ly0) * 0.82, w * 0.46);
    this.photo(panel, { x: leftX, y: (ly0 + ly1) / 2 }, photo);

    const badge = Math.min(colH * 0.34, w * 0.26);
    let blocks = this.heroText(panel, box, clamp(colH * 0.14, 8, 40), false);
    for (let i = 0; i < 12; i++) {
      const used = badge + blocks.reduce((a, b) => a + b.height, 0);
      if (used <= colH * 0.78) break;
      blocks = this.heroText(panel, box, Math.max(7, (blocks[0] as Block & { size: number }).size * 0.9), false);
    }
    this.stack(rightX, ry0, colH, [{ height: badge, draw: (at) => this.logo(panel, at, badge) }, ...blocks], 0.06, 0.94);
  }

  private heroAlongArc(panel: PanelFace) {
    const poly = panel.polygon;
    const half = Math.floor(poly.length / 2);
    const outer = poly.slice(0, half);
    const inner = poly.slice(half).reverse();
    const band = Math.hypot(outer[0].x - inner[0].x, outer[0].y - inner[0].y);

    const at = (t: number, radial = 0.5): Placement => {
      const i = clamp(Math.round(t * (half - 1)), 0, half - 2);
      const o = outer[i];
      const n = inner[i];
      const angle = (Math.atan2(outer[i].y - outer[i + 1].y, outer[i].x - outer[i + 1].x) * 180) / Math.PI;
      return { x: n.x + (o.x - n.x) * radial, y: n.y + (o.y - n.y) * radial, angle };
    };

    const product = this.caps(this.content.product);
    const box = band * 1.4;
    this.logo(panel, at(0.8), band * 0.74);
    this.photo(panel, at(0.5), band * 0.86);
    const fs = fitHeading(product, box, clamp(band * 0.16, 8, 36));
    this.text(panel, product, at(0.2, 0.64), { size: fs, font: this.style.displayFont, fill: this.style.ink, box });
    this.text(panel, this.style.tagline, at(0.2, 0.38), {
      size: fs * 0.5, font: this.style.bodyFont, fill: this.style.highlight, weight: '600', box,
    });
  }

  back(panel: PanelFace) {
    const { x, width: w } = panel.bounds;
    const cx = x + w / 2;
    const [y, yEnd] = verticalSpan(panel, cx);
    const h = yEnd - y;
    const s = Math.min(w, h);
    const box = w * 0.84;
    const brand = this.caps(this.style.brand);

    this.stack(cx, y, h, [
      this.textBlock(panel, brand, {
        size: fitFont(brand, box, clamp(s * 0.14, 10, 44)), font: this.style.displayFont, fill: this.style.ink, box,
      }),
      this.textBlock(panel, this.content.ingredients, {
        size: clamp(s * 0.065, 7, 16), font: this.style.bodyFont, fill: this.style.ink, weight: '400', lineHeight: 1.35, box,
      }),
      this.textBlock(panel, this.content.netWeight, {
        size: clamp(s * 0.075, 7, 18), font: this.style.bodyFont, fill: this.style.ink, weight: '700', box,
      }),
      this.textBlock(panel, 'BEST BEFORE: DD/MM/YYYY', {
        size: clamp(s * 0.055, 6, 13), font: this.style.bodyFont, fill: this.style.highlight, weight: '600', box,
      }),
    ], 0.08, 0.88);
  }

  side(panel: PanelFace, upright = 0) {
    const { width: w, height: h } = panel.bounds;
    const brand = this.caps(this.style.brand);
    const font = this.style.displayFont;

    if (panel.polygon.length === 3) {
      this.sideTriangle(panel, brand, upright);
      return;
    }

    const sideways = upright === 90 || upright === 270;
    const across = sideways ? h : w;
    const along = sideways ? w : h;

    if (across < along * 0.8) {
      const box = along * 0.7;
      const size = Math.min(fitFont(brand, box, 48), across * 0.38);
      this.text(panel, brand, { x: panel.center.x, y: panel.center.y, angle: upright - 90 }, { size, font, fill: this.style.ink, box });
      return;
    }

    if (sideways) {
      const box = across * 0.78;
      const size = Math.min(fitFont(brand, box, 44), along * 0.3);
      this.text(panel, brand, { x: panel.center.x, y: panel.center.y, angle: upright }, { size, font, fill: this.style.ink, box });
      return;
    }

    const cy = panel.center.y;
    const [left, right] = horizontalSpan(panel, cy);
    const box = (right - left) * 0.78;
    const size = Math.min(fitFont(brand, box, 44), h * 0.3);
    this.text(panel, brand, { x: (left + right) / 2, y: cy, angle: upright }, { size, font, fill: this.style.ink, box });
  }

  private sideTriangle(panel: PanelFace, brand: string, upright: number) {
    const poly = panel.polygon;
    let hingeX = poly[0].x;
    for (let i = 0; i < 3; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % 3];
      if (Math.abs(a.x - b.x) < 0.5) hingeX = a.x;
    }
    const cx = poly.reduce((s, p) => s + p.x, 0) / 3;
    const depth = Math.abs(cx - hingeX) * 3;
    const x = hingeX + (cx - hingeX) * 0.6;
    const [y0, y1] = verticalSpan(panel, x);
    const box = (y1 - y0) * 0.82;
    this.text(panel, brand, { x, y: (y0 + y1) / 2, angle: upright }, {
      size: Math.min(fitFont(brand, box, 44), depth * 0.22),
      font: this.style.displayFont,
      fill: this.style.ink,
      box,
    });
  }

  slogan(panel: PanelFace) {
    const { width: w, height: h } = panel.bounds;
    const cy = panel.center.y;
    const [left, right] = horizontalSpan(panel, cy);
    const box = (right - left) * 0.84;
    const tagline = this.caps(this.style.tagline);
    this.text(panel, tagline, { x: (left + right) / 2, y: cy }, {
      size: fitHeading(tagline, box, clamp(Math.min(h * 0.3, w * 0.12), 7, 34)),
      font: this.style.displayFont,
      fill: this.style.highlight,
      italic: !this.style.uppercase,
      box,
    });
  }

  badgeOnly(panel: PanelFace) {
    const s = Math.min(panel.bounds.width, panel.bounds.height);
    this.logo(panel, panel.center, s * 0.62);
  }
}

export function buildStarterDesign(styleId: string, dieline: DielineResult): GraphicItem[] {
  const style = getStarterStyle(styleId);
  const content = TEMPLATE_CONTENT[dieline.templateId];
  if (!style || !content) return [];

  const builder = new DesignBuilder(style, content);
  const printable = dieline.panels.filter(p => !isHiddenPanel(p));

  const isDisplayFace = (p: PanelFace) => content.roles[p.id] === 'hero' || content.roles[p.id] === 'back';
  const displayFaces = printable.filter(isDisplayFace);
  const inDisplayRow = (p: PanelFace) => displayFaces.some(d =>
    Math.abs(d.bounds.y - p.bounds.y) < 1 && Math.abs(d.bounds.height - p.bounds.height) < 1);
  const ornament = (p: PanelFace) =>
    !content.plain && (style.background === 'fresh' ? inDisplayRow(p) : isDisplayFace(p));

  printable.forEach((panel, i) => builder.background(panel, i + 1, ornament(panel)));

  const uprights = panelUprightAngles(dieline);

  for (const panel of printable) {
    const upright = uprights.get(panel.id) ?? 0;
    const role = content.roles[panel.id];
    const before = builder.items.length;
    switch (role) {
      case 'hero': builder.hero(panel); break;
      case 'back': builder.back(panel); break;
      case 'side': builder.side(panel, upright); break;
      case 'slogan': builder.slogan(panel); break;
      case 'badge': builder.badgeOnly(panel); break;
      default: break;
    }
    if (upright === 180) {
      const rotate = (item: GraphicItem) => {
        const cx = panel.bounds.x + panel.bounds.width / 2;
        const cy = panel.bounds.y + panel.bounds.height / 2;
        item.x = 2 * cx - (item.x ?? cx);
        item.y = 2 * cy - (item.y ?? cy);
        item.angle = ((item.angle ?? 0) + 180) % 360;
      };
      builder.items.filter(i => i.panelId === panel.id && i.fileName?.endsWith('background')).forEach(rotate);
      if (role !== 'side') builder.items.slice(before).forEach(rotate);
    }
  }

  return builder.items;
}
