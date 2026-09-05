import { DielineResult } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { RasterExportOptions } from './exportTypes';
import { generateDielineSvg } from './dielineSvgExport';

/**
 * Render dieline to a high-DPI raster image (150, 300, or 600 DPI) and trigger download
 */
export async function downloadDielineRaster(
  dieline: DielineResult,
  graphics: GraphicItem[],
  options: RasterExportOptions,
  filename?: string
): Promise<void> {
  const { totalBounds } = dieline;
  const dpi = options.dpi || 300;
  const pixelsPerMm = dpi / 25.4;

  const marginMm = 15;
  const totalWidthMm = totalBounds.width + marginMm * 2;
  const totalHeightMm = totalBounds.height + marginMm * 2;

  const canvasWidth = Math.round(totalWidthMm * pixelsPerMm);
  const canvasHeight = Math.round(totalHeightMm * pixelsPerMm);

  // Generate SVG vector representation
  const svgStr = generateDielineSvg(dieline, graphics, {
    includeCutLines: options.includeLines,
    includeCreaseLines: options.includeLines,
    includeDimensions: true,
    includeArtwork: options.includeArtwork,
    includeRegistrationMarks: true,
    includeFaceLabels: true,
    marginMm,
  });

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
    img.src = url;
  });

  // Render onto offscreen high-resolution canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Canvas 2D context unavailable.');
  }

  // Background fill
  if (options.backgroundColor && options.backgroundColor !== 'transparent') {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else if (options.format === 'jpeg') {
    // JPEG does not support transparency; default to crisp white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  URL.revokeObjectURL(url);

  // Convert to image Blob and trigger download
  const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = options.format === 'jpeg' ? 0.95 : undefined;

  return new Promise((resolve) => {
    canvas.toBlob(
      (imageBlob) => {
        if (!imageBlob) return resolve();
        const downloadUrl = URL.createObjectURL(imageBlob);
        const dateStr = new Date().toISOString().split('T')[0];
        const ext = options.format === 'jpeg' ? 'jpg' : 'png';
        const safeName = (
          filename || `${dieline.templateId}-proof-${dpi}dpi-${dateStr}`
        ).replace(/\s+/g, '-').toLowerCase();

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        resolve();
      },
      mimeType,
      quality
    );
  });
}
