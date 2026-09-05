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
