import { DielineResult, Point } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { PackagingSpecSheetData } from './exportTypes';

/**
 * Calculate polygon area using the Shoelace formula
 */
function calculatePolygonArea(points: Point[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Recommend paperboard substrate grade based on template category
 */
function getBoardRecommendation(templateId: string, depthMm: number): string {
  if (templateId.includes('pouch') || templateId.includes('sachet')) {
    return 'Multilayer Barrier Film (PET/ALU/PE - 110 micron) - High Oxygen & Moisture Barrier';
  }
  if (templateId.includes('wrapper') || templateId.includes('bag')) {
    return '60 GSM Greaseproof Kraft Paper - Biodegradable & Food Contact Certified';
  }
  if (depthMm > 80) {
    return '380 GSM Solid Bleached Sulfate (SBS) / FBB Grade - Heavy Rigidity Food Grade';
  }
  return '320 GSM Kraft-back Folding Boxboard (FBB) - Food Grade Grease-Resistant Coated';
}

/**
 * Generate technical bill of materials (BOM) and engineering metrics
 */
export function calculatePackagingSpecSheet(
  dieline: DielineResult,
  graphics: GraphicItem[]
): PackagingSpecSheetData {
  const { templateId, templateName, dimensions, lines, panels, totalBounds } = dieline;

  // 1. Calculate net area across all panel polygons
  let netSurfaceAreaSqMm = 0;
  let flapCount = 0;
  let mainPanelCount = 0;

  panels.forEach((p) => {
    netSurfaceAreaSqMm += calculatePolygonArea(p.polygon);
    if (p.isFlap || p.name.toLowerCase().includes('flap') || p.name.toLowerCase().includes('tab')) {
      flapCount++;
    } else {
      mainPanelCount++;
    }
  });

  const netSurfaceAreaSqCm = netSurfaceAreaSqMm / 100;
  const grossAreaSqCm = (totalBounds.width * totalBounds.height) / 100;
  const nestingEfficiencyPercent = grossAreaSqCm > 0
    ? Math.min(100, Math.round((netSurfaceAreaSqCm / grossAreaSqCm) * 1000) / 10)
    : 0;

  // 2. Calculate cut and crease perimeters
  let totalCutPerimeterMm = 0;
  let totalCreasePerimeterMm = 0;

  lines.forEach((l) => {
    const len = distance(l.x1, l.y1, l.x2, l.y2);
    if (l.type === 'cut') {
      totalCutPerimeterMm += len;
    } else if (l.type === 'crease') {
      totalCreasePerimeterMm += len;
    }
  });

  // 3. Estimate weight in grams based on standard 320 GSM board
  // GSM = grams per square meter. 1 sq meter = 10,000 sq cm.
  const boardGsm = 320;
  const estimatedWeightGrams = Math.round(((netSurfaceAreaSqCm / 10000) * boardGsm) * 100) / 100;

  return {
    templateName,
    templateId,
    dimensions,
    blankWidthMm: Math.round(totalBounds.width * 10) / 10,
    blankHeightMm: Math.round(totalBounds.height * 10) / 10,
    netSurfaceAreaSqMm: Math.round(netSurfaceAreaSqMm),
    netSurfaceAreaSqCm: Math.round(netSurfaceAreaSqCm * 10) / 10,
    grossAreaSqCm: Math.round(grossAreaSqCm * 10) / 10,
    nestingEfficiencyPercent,
    totalCutPerimeterMm: Math.round(totalCutPerimeterMm),
    totalCreasePerimeterMm: Math.round(totalCreasePerimeterMm),
    panelCount: panels.length,
    flapCount,
    estimatedWeightGrams,
    boardRecommendation: getBoardRecommendation(templateId, dimensions.depth),
    graphicsCount: graphics.length,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };
}
