import { GraphicItem } from '../graphics/types';

/**
 * Shared text layout + font loading for exporters, so exported text matches
 * the Fabric Textbox on the canvas (same wrapping, alignment, baselines, fonts).
 * Input graphics are in mm space (see toMmSpace).
 */

export interface TextLine {
  text: string;
  /** Offset from the graphic centre (unrotated, mm) of the line's anchor point on its baseline */
  dx: number;
  dy: number;
  width: number;
}

export type TextAnchor = 'start' | 'middle' | 'end';

let measureCtx: CanvasRenderingContext2D | null = null;

export function cssFont(g: GraphicItem, sizePx: number): string {
  return `${g.fontStyle || 'normal'} ${g.fontWeight || '600'} ${sizePx}px ${g.fontFamily || 'Inter, sans-serif'}`;
}

/**
 * Replicates Fabric Textbox layout: greedy word wrap at the box width,
 * box centred on (x, y), line pitch = fontSize * 1.13 * lineHeight,
 * baseline = line top + fontSize * (1.13 - 0.222).
 */
export function layoutText(g: GraphicItem): { lines: TextLine[]; anchor: TextAnchor } {
  const size = g.fontSize ?? 6;
  measureCtx = measureCtx || document.createElement('canvas').getContext('2d')!;
  measureCtx.font = cssFont(g, 100);
  const measure = (s: string) => (measureCtx!.measureText(s).width * size) / 100;

  // Fabric grows the box to fit its longest single word
  const words = (g.text || '').split(/\s+/);
  const boxW = Math.max(g.width ?? 0, ...words.map(measure));

  const raw: string[] = [];
  for (const para of (g.text || '').split('\n')) {
    let cur = '';
    for (const word of para.split(' ')) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && measure(next) > boxW) {
        raw.push(cur);
        cur = word;
      } else {
        cur = next;
      }
    }
    raw.push(cur);
  }

  const lineH = size * 1.13;
  const pitch = lineH * (g.lineHeight ?? 1.25);
  const blockH = pitch * (raw.length - 1) + lineH;
  const align = g.textAlign || 'center';
  const anchor: TextAnchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
  const dx = align === 'left' ? -boxW / 2 : align === 'right' ? boxW / 2 : 0;

  return {
    anchor,
    lines: raw.map((text, i) => ({
      text,
      dx,
      dy: -blockH / 2 + pitch * i + size * (1.13 - 0.222),
      width: measure(text),
    })),
  };
}

// ---------------------------------------------------------------------------
// Font files (Fontsource CDN, CORS-enabled) for embedding into SVG / PDF
// ---------------------------------------------------------------------------

const FONT_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts';

export interface FontFile {
  family: string;
  weight: number;
  italic: boolean;
  base64: string;
}

export function primaryFamily(fontFamily?: string): string {
  return (fontFamily || 'Inter, sans-serif').split(',')[0].trim().replace(/^["']|["']$/g, '');
}

function numericWeight(w?: string | number): number {
  if (w === 'bold') return 700;
  const n = Number(w);
  return Number.isFinite(n) && n > 0 ? n : 400;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

const fontCache = new Map<string, Promise<FontFile | null>>();

/**
 * Fetch the closest available latin font file for a text graphic.
 * Falls back weight -> 700/400 and italic -> normal; null when offline/unknown.
 */
export function fetchFontFile(g: GraphicItem, ext: 'ttf' | 'woff2'): Promise<FontFile | null> {
  const family = primaryFamily(g.fontFamily);
  const weight = numericWeight(g.fontWeight);
  const italic = g.fontStyle === 'italic';
  const key = `${family}|${weight}|${italic}|${ext}`;
  if (!fontCache.has(key)) {
    fontCache.set(key, (async () => {
      const id = family.toLowerCase().replace(/\s+/g, '-');
      const weights = [...new Set([weight, weight >= 600 ? 700 : 400, 400])];
      for (const it of italic ? [true, false] : [false]) {
        for (const w of weights) {
          try {
            const res = await fetch(`${FONT_CDN}/${id}@latest/latin-${w}-${it ? 'italic' : 'normal'}.${ext}`);
            if (res.ok) return { family, weight: w, italic: it, base64: toBase64(await res.arrayBuffer()) };
          } catch {
            return null; // offline: give up quickly
          }
        }
      }
      return null;
    })());
  }
  return fontCache.get(key)!;
}

/** Unique font files needed by the text graphics */
export async function fetchFontsFor(graphics: GraphicItem[], ext: 'ttf' | 'woff2'): Promise<Map<GraphicItem, FontFile | null>> {
  const texts = graphics.filter((g) => g.type === 'text' && g.text);
  const files = await Promise.all(texts.map((g) => fetchFontFile(g, ext)));
  return new Map(texts.map((g, i) => [g, files[i]]));
}

/** @font-face CSS embedding woff2 data so a standalone SVG (and its raster proof) renders the real fonts */
export async function svgFontFaceCss(graphics: GraphicItem[]): Promise<string> {
  const files = new Set([...(await fetchFontsFor(graphics, 'woff2')).values()].filter(Boolean) as FontFile[]);
  return [...files]
    .map((f) => `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:${f.italic ? 'italic' : 'normal'};src:url(data:font/woff2;base64,${f.base64}) format("woff2");}`)
    .join('\n');
}
