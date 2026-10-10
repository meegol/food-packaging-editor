import { DielineResult, PackagingDimensions } from '../dieline/types';
import { GraphicItem } from '../graphics/types';

export type PdfScaleMode = '1:1' | 'fit-a4' | 'fit-a3';

export interface PdfExportOptions {
  scaleMode: PdfScaleMode;
  includeCutLines: boolean;
  includeCreaseLines: boolean;
  includeDimensions: boolean;
  includeArtwork: boolean;
  includeRegistrationMarks: boolean;
  includeTitleBlock: boolean;
  unit: 'mm' | 'in';
}

export interface SvgExportOptions {
  includeCutLines: boolean;
  includeCreaseLines: boolean;
  includeDimensions: boolean;
  includeArtwork: boolean;
  includeRegistrationMarks: boolean;
  includeFaceLabels: boolean;
  marginMm: number;
  /** @font-face CSS (embedded woff2) so text renders in brand fonts anywhere */
  fontFaceCss?: string;
}

export interface RasterExportOptions {
  dpi: 150 | 300 | 600;
  format: 'png' | 'jpeg';
  includeArtwork: boolean;
  includeLines: boolean;
  backgroundColor: string; // 'transparent' | '#ffffff' | custom
}

export interface PackagingSpecSheetData {
  templateName: string;
  templateId: string;
  dimensions: PackagingDimensions;
  blankWidthMm: number;
  blankHeightMm: number;
  netSurfaceAreaSqMm: number;
  netSurfaceAreaSqCm: number;
  grossAreaSqCm: number;
  nestingEfficiencyPercent: number;
  totalCutPerimeterMm: number;
  totalCreasePerimeterMm: number;
  panelCount: number;
  flapCount: number;
  estimatedWeightGrams: number; // based on 320 GSM SBS board
  boardRecommendation: string;
  graphicsCount: number;
  date: string;
}

export interface ExportDataPayload {
  dieline: DielineResult;
  graphics: GraphicItem[];
  templateId: string;
  dimensions: PackagingDimensions;
  themeId: string;
}

/** Dieline generators and the Fabric canvas work in canvas units (2.5 per mm); exporters work in mm. */
export const CANVAS_UNITS_PER_MM = 2.5;

/**
 * Convert a canvas-space dieline + graphics into true millimetre space.
 * Graphics come back with x/y in mm, fontSize in mm (canvas scale applied),
 * and scaleX/scaleY such that naturalWidth * scaleX = rendered width in mm.
 */
export function toMmSpace(
  dieline: DielineResult,
  graphics: GraphicItem[]
): { dieline: DielineResult; graphics: GraphicItem[] } {
  const k = 1 / CANVAS_UNITS_PER_MM;
  const pt = (p: { x: number; y: number }) => ({ x: p.x * k, y: p.y * k });
  const b = dieline.totalBounds;
  return {
    dieline: {
      ...dieline,
      lines: dieline.lines.map((l) => ({ ...l, x1: l.x1 * k, y1: l.y1 * k, x2: l.x2 * k, y2: l.y2 * k })),
      panels: dieline.panels.map((p) => ({
        ...p,
        polygon: p.polygon.map(pt),
        center: pt(p.center),
        bounds: { x: p.bounds.x * k, y: p.bounds.y * k, width: p.bounds.width * k, height: p.bounds.height * k },
      })),
      totalBounds: {
        minX: b.minX * k, minY: b.minY * k, maxX: b.maxX * k, maxY: b.maxY * k,
        width: b.width * k, height: b.height * k,
      },
    },
    graphics: graphics.map((g) => {
      const panelW = dieline.panels.find((p) => p.id === g.panelId)?.bounds.width ?? 300;
      return {
        ...g,
        x: g.x === undefined ? undefined : g.x * k,
        y: g.y === undefined ? undefined : g.y * k,
        // Text defaults mirror the Fabric Textbox in FabricDielineCanvas
        fontSize: (g.fontSize ?? 15) * (g.scaleY ?? 1) * k,
        fontFamily: g.fontFamily || 'Inter, sans-serif',
        fontWeight: g.fontWeight || '600',
        fill: g.fill || '#1e293b',
        textAlign: g.textAlign || 'center',
        lineHeight: g.lineHeight || 1.25,
        width: g.type === 'text'
          ? (g.width ?? Math.max(Math.min(panelW * 0.85, 280), 80)) * (g.scaleX ?? 1) * k
          : g.width,
        scaleX: (g.scaleX ?? 1) * k,
        scaleY: (g.scaleY ?? 1) * k,
      };
    }),
  };
}
