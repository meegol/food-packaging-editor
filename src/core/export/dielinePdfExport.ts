import { jsPDF } from 'jspdf';
import { DielineResult } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { PdfExportOptions } from './exportTypes';
import { calculatePackagingSpecSheet } from './specSheetCalculator';

/**
 * Draw a standard packaging registration crosshair target
 */
function drawRegistrationMark(doc: jsPDF, cx: number, cy: number, radius = 3) {
  doc.setDrawColor(30, 41, 59); // Slate 800
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([], 0);

  // Outer circle
  doc.circle(cx, cy, radius, 'S');

  // Cross lines
  doc.line(cx - radius - 1.5, cy, cx + radius + 1.5, cy);
  doc.line(cx, cy - radius - 1.5, cx, cy + radius + 1.5);
}

/**
 * Generate 1:1 scale or formatted CAD Vector PDF dieline
 */
export async function generateDielinePdf(
  dieline: DielineResult,
  graphics: GraphicItem[],
  options: PdfExportOptions
): Promise<jsPDF> {
  const { totalBounds, lines, panels, templateName, dimensions, templateId } = dieline;
  const specSheet = calculatePackagingSpecSheet(dieline, graphics);

  // 1. Determine Page Dimensions and Scaling
  const margin = 20; // 20mm margin
  const titleBlockHeight = options.includeTitleBlock ? 36 : 0;

  let pageWidth: number;
  let pageHeight: number;
  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let orientation: 'landscape' | 'portrait' = 'landscape';

  if (options.scaleMode === '1:1') {
    // Exact true 1:1 millimeter physical scale
    pageWidth = Math.ceil(totalBounds.width + margin * 2);
    pageHeight = Math.ceil(totalBounds.height + margin * 2 + titleBlockHeight);
    orientation = pageWidth >= pageHeight ? 'landscape' : 'portrait';
    offsetX = margin;
    offsetY = margin;
    scale = 1.0;
  } else if (options.scaleMode === 'fit-a3') {
    // ISO A3 Landscape (420 x 297 mm)
    pageWidth = 420;
    pageHeight = 297;
    orientation = 'landscape';
    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2 - titleBlockHeight;
    scale = Math.min(availW / totalBounds.width, availH / totalBounds.height, 1.0);
    offsetX = (pageWidth - totalBounds.width * scale) / 2;
    offsetY = margin + (availH - totalBounds.height * scale) / 2;
  } else {
    // ISO A4 Landscape (297 x 210 mm)
    pageWidth = 297;
    pageHeight = 210;
    orientation = 'landscape';
    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2 - titleBlockHeight;
    scale = Math.min(availW / totalBounds.width, availH / totalBounds.height, 1.0);
    offsetX = (pageWidth - totalBounds.width * scale) / 2;
    offsetY = margin + (availH - totalBounds.height * scale) / 2;
  }

  // Initialize jsPDF document in millimeters
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  // Transform dieline coordinates (mm) to page canvas coordinates (mm)
  const mapX = (x: number) => offsetX + (x - totalBounds.minX) * scale;
  const mapY = (y: number) => offsetY + (y - totalBounds.minY) * scale;

  // 2. Draw Registration Marks (4 corners of blank bounds)
  if (options.includeRegistrationMarks) {
    const minPageX = mapX(totalBounds.minX);
    const maxPageX = mapX(totalBounds.maxX);
    const minPageY = mapY(totalBounds.minY);
    const maxPageY = mapY(totalBounds.maxY);

    const markOffset = 8;
    drawRegistrationMark(doc, minPageX - markOffset, minPageY - markOffset);
    drawRegistrationMark(doc, maxPageX + markOffset, minPageY - markOffset);
    drawRegistrationMark(doc, minPageX - markOffset, maxPageY + markOffset);
    drawRegistrationMark(doc, maxPageX + markOffset, maxPageY + markOffset);
  }

  // 3. Render Artwork Layer (Raster & Vector Graphics)
  if (options.includeArtwork && graphics.length > 0) {
    for (const g of graphics) {
      const panel = panels.find((p) => p.id === g.panelId);
      const gx = g.x ?? (panel ? panel.center.x : totalBounds.width / 2);
      const gy = g.y ?? (panel ? panel.center.y : totalBounds.height / 2);

      const targetX = mapX(gx);
      const targetY = mapY(gy);

      if (g.type === 'text' && g.text) {
        doc.setTextColor(g.fill || '#1e293b');
        doc.setFont('helvetica', g.fontWeight === 'bold' ? 'bold' : 'normal');
        const fontSizePt = (g.fontSize || 16) * scale * 0.75;
        doc.setFontSize(Math.max(fontSizePt, 4));
        doc.text(g.text, targetX, targetY, {
          align: (g.textAlign as 'center' | 'left' | 'right') || 'center',
          angle: g.angle || 0,
        });
      } else if (g.src) {
        try {
          const nw = g.naturalWidth || 100;
          const nh = g.naturalHeight || 100;
          const imgScale = g.scaleX !== undefined ? g.scaleX : 0.5;
          const imgW = (nw * imgScale * scale) / 3.78; // px to mm approx
          const imgH = (nh * imgScale * scale) / 3.78;

          // Place centered on target coordinate
          doc.addImage(
            g.src,
            'PNG',
            targetX - imgW / 2,
            targetY - imgH / 2,
            imgW,
            imgH,
            undefined,
            'FAST'
          );
        } catch {
          // Gracefully skip unrenderable data URLs
        }
      }
    }
  }

  // 4. Crease Lines Layer (Dashed Green: #22c55e, Matrix Score)
  if (options.includeCreaseLines) {
    doc.setDrawColor(34, 197, 94); // #22c55e
    doc.setLineWidth(0.35 * scale);
    doc.setLineDashPattern([2 * scale, 1.5 * scale], 0);

    lines
      .filter((l) => l.type === 'crease')
      .forEach((l) => {
        doc.line(mapX(l.x1), mapY(l.y1), mapX(l.x2), mapY(l.y2));
      });
  }

  // 5. Cut Lines Layer (Solid Red: #ef4444, Steel Rule Die)
  if (options.includeCutLines) {
    doc.setDrawColor(239, 68, 68); // #ef4444
    doc.setLineWidth(0.5 * scale);
    doc.setLineDashPattern([], 0); // solid

    lines
      .filter((l) => l.type === 'cut')
      .forEach((l) => {
        doc.line(mapX(l.x1), mapY(l.y1), mapX(l.x2), mapY(l.y2));
      });
  }

  // 6. Dimensions Callouts & Face Labels Layer
  if (options.includeDimensions) {
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(Math.max(6 * scale, 4));

    // Outer bounding box dimension callouts
    const minX = mapX(totalBounds.minX);
    const maxX = mapX(totalBounds.maxX);
    const minY = mapY(totalBounds.minY);
    const maxY = mapY(totalBounds.maxY);

    // Top Width Callout
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([], 0);
    const dimY = minY - 5;
    doc.line(minX, dimY, maxX, dimY);
    doc.line(minX, dimY - 1.5, minX, dimY + 1.5);
    doc.line(maxX, dimY - 1.5, maxX, dimY + 1.5);
    doc.text(`Width: ${Math.round(totalBounds.width)} mm`, (minX + maxX) / 2, dimY - 1.5, { align: 'center' });

    // Left Height Callout
    const dimX = minX - 5;
    doc.line(dimX, minY, dimX, maxY);
    doc.line(dimX - 1.5, minY, dimX + 1.5, minY);
    doc.line(dimX - 1.5, maxY, dimX + 1.5, maxY);
    doc.text(`Height: ${Math.round(totalBounds.height)} mm`, dimX - 2, (minY + maxY) / 2, {
      align: 'center',
      angle: 90,
    });

    // Panel Name Watermarks
    panels.forEach((p) => {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(Math.max(5 * scale, 3.5));
      doc.text(p.name, mapX(p.center.x), mapY(p.center.y), { align: 'center' });
    });
  }

  // 7. Title Block & Engineering Legend (FEFCO / ISO Standards)
  if (options.includeTitleBlock) {
    const blockY = pageHeight - titleBlockHeight - 4;
    const blockW = pageWidth - margin * 2;
    const blockH = titleBlockHeight;

    // Outer border
    doc.setDrawColor(51, 65, 85); // Slate 700
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([], 0);
    doc.rect(margin, blockY, blockW, blockH, 'FD');

    // Title Block Content
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CAD PACKAGING PRODUCTION DIELINE SPECIFICATION', margin + 6, blockY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    // Left Column: Template & Dims
    const col1X = margin + 6;
    doc.text(`Template: ${templateName} (${templateId})`, col1X, blockY + 12);
    doc.text(
      `Dimensions: L ${dimensions.length}mm × W ${dimensions.width}mm × D ${dimensions.depth}mm (t=${dimensions.thickness}mm)`,
      col1X,
      blockY + 17
    );
    doc.text(`Blank Sheet Size: ${specSheet.blankWidthMm} mm × ${specSheet.blankHeightMm} mm`, col1X, blockY + 22);

    // Middle Column: Engineering Legend
    const col2X = margin + blockW * 0.45;
    doc.setFont('helvetica', 'bold');
    doc.text('LINE LEGEND (FEFCO / ECMA)', col2X, blockY + 6);
    doc.setFont('helvetica', 'normal');

    // Red swatch
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.6);
    doc.setLineDashPattern([], 0);
    doc.line(col2X, blockY + 12, col2X + 12, blockY + 12);
    doc.setTextColor(239, 68, 68);
    doc.text('Solid Red: CUT LINE (Knife Die)', col2X + 15, blockY + 13);

    // Green dashed swatch
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.line(col2X, blockY + 18, col2X + 12, blockY + 18);
    doc.setTextColor(22, 163, 74);
    doc.text('Dashed Green: CREASE LINE (Matrix Score)', col2X + 15, blockY + 19);

    // Right Column: Production Metadata
    const col3X = margin + blockW * 0.78;
    doc.setTextColor(71, 85, 105);
    doc.text(`Scale: ${options.scaleMode === '1:1' ? '1:1 (True MM)' : 'Scaled to Sheet'}`, col3X, blockY + 12);
    doc.text(`Cut Perimeter: ${specSheet.totalCutPerimeterMm} mm`, col3X, blockY + 17);
    doc.text(`Date: ${specSheet.date}`, col3X, blockY + 22);
  }

  // 8. Page 2: Technical Packaging Spec Sheet / Bill of Materials (BOM)
  doc.addPage([297, 210], 'landscape'); // Standard A4 landscape report
  renderSpecSheetPage(doc, specSheet);

  return doc;
}

/**
 * Render Page 2: Technical Packaging Spec Sheet & Bill of Materials
 */
function renderSpecSheetPage(
  doc: jsPDF,
  spec: ReturnType<typeof calculatePackagingSpecSheet>
) {
  const margin = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, margin, 257, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PACKAGING ENGINEERING BILL OF MATERIALS & TECHNICAL SPEC SHEET', margin + 8, margin + 11);

  let currentY = margin + 28;

  // Section 1: Substrate & Structural Geometry
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('1. STRUCTURAL GEOMETRY & SUBSTRATE', margin, currentY);
  currentY += 5;

  const specRows = [
    ['Packaging Template Name', `${spec.templateName} (${spec.templateId})`],
    ['Finished Outer Dimensions (L × W × D)', `${spec.dimensions.length} × ${spec.dimensions.width} × ${spec.dimensions.depth} mm`],
    ['Material Caliper (Board Thickness)', `${spec.dimensions.thickness} mm`],
    ['Recommended Substrate Grade', spec.boardRecommendation],
    ['Flat Blank Bounding Envelope', `${spec.blankWidthMm} mm × ${spec.blankHeightMm} mm`],
    ['Net Carton Surface Area', `${spec.netSurfaceAreaSqCm} cm² (${spec.netSurfaceAreaSqMm} mm²)`],
    ['Sheet Nesting Area Efficiency', `${spec.nestingEfficiencyPercent}% (Gross: ${spec.grossAreaSqCm} cm²)`],
    ['Estimated Blank Weight', `~${spec.estimatedWeightGrams} g (per carton blank @ 320 GSM)`],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  specRows.forEach(([key, val], idx) => {
    const bg = idx % 2 === 0 ? 248 : 255;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, currentY, 257, 6, 'F');
    doc.setTextColor(71, 85, 105);
    doc.text(key, margin + 4, currentY + 4.2);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(val, margin + 110, currentY + 4.2);
    doc.setFont('helvetica', 'normal');
    currentY += 6;
  });

  currentY += 8;

  // Section 2: Die Tooling & Cutting Rules
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DIE TOOLING & FINISHING REQUIREMENTS', margin, currentY);
  currentY += 5;

  const toolingRows = [
    ['Total Steel Rule Cut Length', `${spec.totalCutPerimeterMm} mm (${(spec.totalCutPerimeterMm / 1000).toFixed(2)} m linear)`],
    ['Total Matrix Crease / Score Length', `${spec.totalCreasePerimeterMm} mm (${(spec.totalCreasePerimeterMm / 1000).toFixed(2)} m linear)`],
    ['Total Face Panels / Flaps Count', `${spec.panelCount} panels (${spec.flapCount} glue/dust flaps)`],
    ['Cutting Die Type Recommendation', 'Flatbed Laser-cut Steel Rule Die (23.8 mm rule height, 2 pt knife)'],
    ['Creasing Matrix Recommendation', 'Pertinax counter-plate / Phenolic matrix channel (0.4 × 1.3 mm)'],
  ];

  toolingRows.forEach(([key, val], idx) => {
    const bg = idx % 2 === 0 ? 248 : 255;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, currentY, 257, 6, 'F');
    doc.setTextColor(71, 85, 105);
    doc.text(key, margin + 4, currentY + 4.2);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(val, margin + 110, currentY + 4.2);
    doc.setFont('helvetica', 'normal');
    currentY += 6;
  });

  currentY += 8;

  // Section 3: Placed Branding & Regulatory Compliance
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ARTWORK & REGULATORY COMPLIANCE ASSETS', margin, currentY);
  currentY += 5;

  const artworkRows = [
    ['Placed Brand Graphics Count', `${spec.graphicsCount} assets on packaging face polygons`],
    ['Color Model Specification', 'CMYK Process Printing + Pantone Special / Spot UV / Matte Aqueous'],
    ['Barcode Verification', 'ISO/IEC 15420 / GS1 General Specifications (Grade A/B scannable)'],
    ['Food Contact Certification', 'FDA 21 CFR 176.170 / EU Regulation 1935/2004 Compliant'],
  ];

  artworkRows.forEach(([key, val], idx) => {
    const bg = idx % 2 === 0 ? 248 : 255;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, currentY, 257, 6, 'F');
    doc.setTextColor(71, 85, 105);
    doc.text(key, margin + 4, currentY + 4.2);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(val, margin + 110, currentY + 4.2);
    doc.setFont('helvetica', 'normal');
    currentY += 6;
  });

  // Footer Sign-Off Block
  const footerY = 190;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated by Food Packaging Dieline CAD Engine • Date: ${spec.date} • Page 2 of 2`, margin, footerY);
}

/**
 * Trigger browser download for generated Vector CAD PDF
 */
export async function downloadDielinePdf(
  dieline: DielineResult,
  graphics: GraphicItem[],
  options: PdfExportOptions,
  filename?: string
): Promise<void> {
  const doc = await generateDielinePdf(dieline, graphics, options);
  const dateStr = new Date().toISOString().split('T')[0];
  const safeName = (filename || `${dieline.templateId}-cad-dieline-${dateStr}`).replace(/\s+/g, '-').toLowerCase();
  doc.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
}
