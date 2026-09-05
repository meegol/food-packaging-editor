import { DielineResult } from '../dieline/types';
import { GraphicItem } from '../graphics/types';
import { SvgExportOptions } from './exportTypes';

/**
 * Generate standard layer-separated CAD production SVG string
 */
export function generateDielineSvg(
  dieline: DielineResult,
  graphics: GraphicItem[],
  options: SvgExportOptions
): string {
  const { totalBounds, lines, panels, templateName, dimensions, templateId } = dieline;
  const margin = options.marginMm ?? 15;

  const minX = totalBounds.minX - margin;
  const minY = totalBounds.minY - margin;
  const width = totalBounds.width + margin * 2;
  const height = totalBounds.height + margin * 2;

  const parts: string[] = [];

  parts.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${width.toFixed(2)}mm" height="${height.toFixed(2)}mm" ` +
    `viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}">`
  );

  parts.push(`  <metadata>`);
  parts.push(`    <cad:info xmlns:cad="http://fe-packaging.org/cad">`);
  parts.push(`      <template id="${templateId}" name="${templateName}" />`);
  parts.push(`      <dimensions length="${dimensions.length}" width="${dimensions.width}" depth="${dimensions.depth}" caliper="${dimensions.thickness}" unit="mm" />`);
  parts.push(`    </cad:info>`);
  parts.push(`  </metadata>`);

  // Defs for panel clip paths
  parts.push(`  <defs>`);
  panels.forEach((p) => {
    const pointsStr = p.polygon.map(pt => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
    parts.push(`    <clipPath id="svg-clip-${p.id}">`);
    parts.push(`      <polygon points="${pointsStr}" />`);
    parts.push(`    </clipPath>`);
  });
  parts.push(`  </defs>`);

  // 1. Panel Geometry Layer
  parts.push(`  <!-- 1. Panel Geometry Boundaries -->`);
  parts.push(`  <g id="panel-geometry" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.15">`);
  panels.forEach((p) => {
    const pointsStr = p.polygon.map(pt => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
    parts.push(`    <polygon id="panel-${p.id}" points="${pointsStr}" data-panel-name="${p.name}" />`);
  });
  parts.push(`  </g>`);

  // 2. Artwork Layer
  if (options.includeArtwork && graphics.length > 0) {
    parts.push(`  <!-- 2. Artwork & Placed Graphics Layer -->`);
    parts.push(`  <g id="artwork">`);
    graphics.forEach((g) => {
      const panel = panels.find(p => p.id === g.panelId);
      const gx = g.x ?? (panel ? panel.center.x : totalBounds.width / 2);
      const gy = g.y ?? (panel ? panel.center.y : totalBounds.height / 2);
      const angle = g.angle || 0;
      const clipAttr = g.clipToPanel ? `clip-path="url(#svg-clip-${g.panelId})"` : '';

      parts.push(`    <g ${clipAttr} transform="translate(${gx.toFixed(2)}, ${gy.toFixed(2)}) rotate(${angle})">`);
      if (g.type === 'text' && g.text) {
        const fill = g.fill || '#0f172a';
        const fontSizeMm = ((g.fontSize || 16) * 0.264583).toFixed(2);
        const textAnchor = g.textAlign === 'center' ? 'middle' : g.textAlign === 'right' ? 'end' : 'start';
        parts.push(
          `      <text x="0" y="0" font-family="${g.fontFamily || 'Inter, sans-serif'}" font-size="${fontSizeMm}" font-weight="${g.fontWeight || 'normal'}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="middle">${escapeXml(g.text)}</text>`
        );
      } else if (g.src) {
        const nw = g.naturalWidth || 100;
        const nh = g.naturalHeight || 100;
        const sX = g.scaleX !== undefined ? g.scaleX : 0.5;
        const sY = g.scaleY !== undefined ? g.scaleY : 0.5;
        const wMm = ((nw * sX) * 0.264583).toFixed(2);
        const hMm = ((nh * sY) * 0.264583).toFixed(2);
        const xOffset = (-parseFloat(wMm) / 2).toFixed(2);
        const yOffset = (-parseFloat(hMm) / 2).toFixed(2);

        parts.push(
          `      <image href="${g.src}" x="${xOffset}" y="${yOffset}" width="${wMm}" height="${hMm}" preserveAspectRatio="xMidYMid meet" />`
        );
      }
      parts.push(`    </g>`);
    });
    parts.push(`  </g>`);
  }

  // 3. Crease Lines Layer (Dashed Green: #22c55e)
  if (options.includeCreaseLines) {
    parts.push(`  <!-- 3. Crease & Scoring Lines (Matrix Score Wheel) -->`);
    parts.push(`  <g id="crease-lines" stroke="#22c55e" stroke-width="0.35" stroke-dasharray="2,1.5" stroke-linecap="round" fill="none">`);
    lines
      .filter(l => l.type === 'crease')
      .forEach((l) => {
        parts.push(`    <line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" id="${l.id}" />`);
      });
    parts.push(`  </g>`);
  }

  // 4. Cut Lines Layer (Solid Red: #ef4444)
  if (options.includeCutLines) {
    parts.push(`  <!-- 4. Cut Lines (Steel Rule Die Knife) -->`);
    parts.push(`  <g id="cut-lines" stroke="#ef4444" stroke-width="0.5" stroke-linecap="square" fill="none">`);
    lines
      .filter(l => l.type === 'cut')
      .forEach((l) => {
        parts.push(`    <line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" id="${l.id}" />`);
      });
    parts.push(`  </g>`);
  }

  // 5. Face Labels Layer
  if (options.includeFaceLabels) {
    parts.push(`  <!-- 5. Face Panel Identifiers -->`);
    parts.push(`  <g id="face-labels" font-family="system-ui, -apple-system, sans-serif" font-size="2.5" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">`);
    panels.forEach((p) => {
      parts.push(`    <text x="${p.center.x.toFixed(2)}" y="${p.center.y.toFixed(2)}">${escapeXml(p.name)}</text>`);
    });
    parts.push(`  </g>`);
  }

  // 6. Dimensions Callouts Layer
  if (options.includeDimensions) {
    parts.push(`  <!-- 6. Engineering Dimension Callouts -->`);
    parts.push(`  <g id="dimensions" stroke="#94a3b8" stroke-width="0.2" fill="none" font-family="system-ui, sans-serif" font-size="2.6">`);

    const dimTopY = totalBounds.minY - 5;
    parts.push(`    <line x1="${totalBounds.minX.toFixed(2)}" y1="${dimTopY.toFixed(2)}" x2="${totalBounds.maxX.toFixed(2)}" y2="${dimTopY.toFixed(2)}" />`);
    parts.push(`    <line x1="${totalBounds.minX.toFixed(2)}" y1="${(dimTopY - 1.5).toFixed(2)}" x2="${totalBounds.minX.toFixed(2)}" y2="${(dimTopY + 1.5).toFixed(2)}" />`);
    parts.push(`    <line x1="${totalBounds.maxX.toFixed(2)}" y1="${(dimTopY - 1.5).toFixed(2)}" x2="${totalBounds.maxX.toFixed(2)}" y2="${(dimTopY + 1.5).toFixed(2)}" />`);
    parts.push(`    <text x="${((totalBounds.minX + totalBounds.maxX) / 2).toFixed(2)}" y="${(dimTopY - 1.5).toFixed(2)}" stroke="none" fill="#64748b" text-anchor="middle">${Math.round(totalBounds.width)} mm</text>`);

    const dimLeftX = totalBounds.minX - 5;
    parts.push(`    <line x1="${dimLeftX.toFixed(2)}" y1="${totalBounds.minY.toFixed(2)}" x2="${dimLeftX.toFixed(2)}" y2="${totalBounds.maxY.toFixed(2)}" />`);
    parts.push(`    <line x1="${(dimLeftX - 1.5).toFixed(2)}" y1="${totalBounds.minY.toFixed(2)}" x2="${(dimLeftX + 1.5).toFixed(2)}" y2="${totalBounds.minY.toFixed(2)}" />`);
    parts.push(`    <line x1="${(dimLeftX - 1.5).toFixed(2)}" y1="${totalBounds.maxY.toFixed(2)}" x2="${(dimLeftX + 1.5).toFixed(2)}" y2="${totalBounds.maxY.toFixed(2)}" />`);
    parts.push(`    <text x="${(dimLeftX - 1.5).toFixed(2)}" y="${((totalBounds.minY + totalBounds.maxY) / 2).toFixed(2)}" stroke="none" fill="#64748b" text-anchor="middle" transform="rotate(-90 ${(dimLeftX - 1.5).toFixed(2)} ${((totalBounds.minY + totalBounds.maxY) / 2).toFixed(2)})">${Math.round(totalBounds.height)} mm</text>`);

    parts.push(`  </g>`);
  }

  // 7. Registration Marks
  if (options.includeRegistrationMarks) {
    parts.push(`  <!-- 7. Optical Registration Marks -->`);
    parts.push(`  <g id="registration-marks" stroke="#1e293b" stroke-width="0.2" fill="none">`);
    const corners = [
      { x: totalBounds.minX - 8, y: totalBounds.minY - 8 },
      { x: totalBounds.maxX + 8, y: totalBounds.minY - 8 },
      { x: totalBounds.minX - 8, y: totalBounds.maxY + 8 },
      { x: totalBounds.maxX + 8, y: totalBounds.maxY + 8 },
    ];
    corners.forEach((c) => {
      parts.push(`    <circle cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="3" />`);
      parts.push(`    <line x1="${(c.x - 4.5).toFixed(2)}" y1="${c.y.toFixed(2)}" x2="${(c.x + 4.5).toFixed(2)}" y2="${c.y.toFixed(2)}" />`);
      parts.push(`    <line x1="${c.x.toFixed(2)}" y1="${(c.y - 4.5).toFixed(2)}" x2="${c.x.toFixed(2)}" y2="${(c.y + 4.5).toFixed(2)}" />`);
    });
    parts.push(`  </g>`);
  }

  parts.push(`</svg>`);
  return parts.join('\n');
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Trigger browser download for CAD SVG file
 */
export function downloadDielineSvg(
  dieline: DielineResult,
  graphics: GraphicItem[],
  options: SvgExportOptions,
  filename?: string
): void {
  const svgStr = generateDielineSvg(dieline, graphics, options);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const safeName = (filename || `${dieline.templateId}-cad-dieline-${dateStr}`).replace(/\s+/g, '-').toLowerCase();

  const link = document.createElement('a');
  link.href = url;
  link.download = safeName.endsWith('.svg') ? safeName : `${safeName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
