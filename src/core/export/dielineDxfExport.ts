import { DielineResult } from '../dieline/types';

/**
 * AutoCAD R12 ASCII DXF Exporter for Packaging Dielines
 * 
 * Generates industry-standard CAD/CAM files compatible with:
 * - Esko ArtiosCAD & Kongsberg sample cutting tables
 * - Zünd digital flatbed cutters
 * - Laser die-board cutting systems
 * - AutoCAD, SolidWorks, and Adobe Illustrator CAD plugins
 * 
 * Implements strict layer separation:
 * - CUT_LINES: AutoCAD Color 1 (Red), Continuous line (Steel rule knife)
 * - CREASE_LINES: AutoCAD Color 3 (Green), Dashed line (Score / Matrix crease)
 */

export interface DxfExportOptions {
  includeCutLines?: boolean;
  includeCreaseLines?: boolean;
  unit?: 'mm' | 'in';
}

/**
 * Formats a number to 4 decimal places for crisp CAD floating point precision
 */
function f(n: number): string {
  return Number.isFinite(n) ? n.toFixed(4) : '0.0000';
}

/**
 * Generate standard AutoCAD R12 DXF string
 */
export function exportDielineToDxf(
  dieline: DielineResult,
  options: DxfExportOptions = {}
): string {
  const includeCut = options.includeCutLines ?? true;
  const includeCrease = options.includeCreaseLines ?? true;

  const { totalBounds, lines, templateName, dimensions, templateId } = dieline;

  // In CAD, positive Y goes upwards. We invert Y relative to maxY so that
  // the resulting dieline is upright and positioned in the positive quadrant [0, W] x [0, H].
  const maxY = totalBounds.maxY;
  const minX = totalBounds.minX;

  const dxfLines: string[] = [];

  // 1. HEADER SECTION
  dxfLines.push(
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009', // AutoCAD R12 format (universal compatibility)
    '9', '$INSUNITS',
    '70', '4',      // 4 = Millimeters
    '9', '$EXTMIN',
    '10', '0.0000',
    '20', '0.0000',
    '30', '0.0000',
    '9', '$EXTMAX',
    '10', f(totalBounds.width),
    '20', f(totalBounds.height),
    '30', '0.0000',
    '9', '$COMMENT',
    '1', `Food Packaging Editor CAD Dieline - ${templateName} (${templateId})`,
    '9', '$COMMENT',
    '1', `Dimensions: L=${dimensions.length} W=${dimensions.width} D=${dimensions.depth} t=${dimensions.thickness}mm`,
    '0', 'ENDSEC'
  );

  // 2. TABLES SECTION (Linetypes & Layers)
  dxfLines.push(
    '0', 'SECTION',
    '2', 'TABLES',
    // Linetype Table
    '0', 'TABLE',
    '2', 'LTYPE',
    '70', '2',
    '0', 'LTYPE',
    '2', 'CONTINUOUS',
    '70', '0',
    '3', 'Solid Line',
    '72', '65',
    '73', '0',
    '40', '0.0',
    '0', 'LTYPE',
    '2', 'DASHED',
    '70', '0',
    '3', 'Dashed Crease __ __ __',
    '72', '65',
    '73', '2',
    '40', '6.0',
    '49', '4.0',
    '49', '-2.0',
    '0', 'ENDTAB',
    // Layer Table
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '3',
    // Default 0 layer
    '0', 'LAYER',
    '2', '0',
    '70', '0',
    '62', '7',
    '6', 'CONTINUOUS',
    // CUT_LINES Layer: Color 1 (Red)
    '0', 'LAYER',
    '2', 'CUT_LINES',
    '70', '0',
    '62', '1', // Red
    '6', 'CONTINUOUS',
    // CREASE_LINES Layer: Color 3 (Green)
    '0', 'LAYER',
    '2', 'CREASE_LINES',
    '70', '0',
    '62', '3', // Green
    '6', 'DASHED',
    '0', 'ENDTAB',
    '0', 'ENDSEC'
  );

  // 3. BLOCKS SECTION (Required empty section in R12)
  dxfLines.push(
    '0', 'SECTION',
    '2', 'BLOCKS',
    '0', 'ENDSEC'
  );

  // 4. ENTITIES SECTION (The actual geometry lines)
  dxfLines.push(
    '0', 'SECTION',
    '2', 'ENTITIES'
  );

  for (const line of lines) {
    if (line.type === 'cut' && !includeCut) continue;
    if (line.type === 'crease' && !includeCrease) continue;
    if (line.type !== 'cut' && line.type !== 'crease') continue;

    const layerName = line.type === 'cut' ? 'CUT_LINES' : 'CREASE_LINES';
    const linetype = line.type === 'cut' ? 'CONTINUOUS' : 'DASHED';

    // Normalize coordinates to origin (0, 0) with Y flipped for standard CAD upright orientation
    const cadX1 = line.x1 - minX;
    const cadY1 = maxY - line.y1;
    const cadX2 = line.x2 - minX;
    const cadY2 = maxY - line.y2;

    dxfLines.push(
      '0', 'LINE',
      '8', layerName,
      '6', linetype,
      '10', f(cadX1),
      '20', f(cadY1),
      '30', '0.0000',
      '11', f(cadX2),
      '21', f(cadY2),
      '31', '0.0000'
    );
  }

  dxfLines.push(
    '0', 'ENDSEC',
    '0', 'EOF'
  );

  return dxfLines.join('\n');
}

/**
 * Triggers a direct browser download of the generated DXF dieline
 */
export function downloadDielineDxf(
  dieline: DielineResult,
  options: DxfExportOptions = {},
  fileName?: string
): void {
  const dxfContent = exportDielineToDxf(dieline, options);
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const cleanName = dieline.templateId || 'dieline';
  const effectiveName = fileName || `${cleanName}-cad-dieline.dxf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = effectiveName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
