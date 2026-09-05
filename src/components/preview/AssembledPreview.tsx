import React, { useState, useRef, useMemo } from 'react';
import { 
  Eye, 
  Rotate3d, 
  Download, 
  Sparkles, 
  Sun, 
  Moon, 
  Camera 
} from 'lucide-react';
import { DielineResult } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';
import { 
  ViewAngle, 
  MaterialFinish, 
  StudioLighting, 
  PreviewSettings 
} from '../../core/preview/previewTypes';
import { generateAssembledModel } from '../../core/preview/assembledBoxModels';
import { getQuadAffineMatrix } from '../../core/preview/graphicProjection';

interface AssembledPreviewProps {
  dieline: DielineResult;
  graphics: GraphicItem[];
  themeId?: string;
}

export const AssembledPreview: React.FC<AssembledPreviewProps> = ({
  dieline,
  graphics,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Preview configuration states
  const [viewAngle, setViewAngle] = useState<ViewAngle>('isometric');
  const [material, setMaterial] = useState<MaterialFinish>('white');
  const [lighting, setLighting] = useState<StudioLighting>('dark');
  const [openness, setOpenness] = useState<number>(0);
  const [hoveredFaceName, setHoveredFaceName] = useState<string | null>(null);

  const settings: PreviewSettings = useMemo(() => ({
    viewAngle,
    material,
    lighting,
    openness,
    showShadow: true,
    zoom: 1,
  }), [viewAngle, material, lighting, openness]);

  // Generate 2D assembled model geometry
  const model = useMemo(() => {
    return generateAssembledModel(
      dieline.templateId,
      dieline.dimensions,
      dieline.panels,
      graphics,
      settings
    );
  }, [dieline, graphics, settings]);

  // Material color palettes
  const materialStyles = useMemo(() => {
    switch (material) {
      case 'kraft':
        return {
          base: '#bfa074',
          stroke: '#8a6e46',
          highlight: '#d5b991',
          shadow: '#8c6c41',
          innerFill: '#9e7949',
          name: 'Kraft Cardboard',
        };
      case 'dark':
        return {
          base: '#1e293b',
          stroke: '#334155',
          highlight: '#384860',
          shadow: '#0f172a',
          innerFill: '#111827',
          name: 'Midnight Dark',
        };
      case 'cream':
        return {
          base: '#fef3c7',
          stroke: '#d97706',
          highlight: '#fffbeb',
          shadow: '#fcd34d',
          innerFill: '#fef08a',
          name: 'Bakery Cream',
        };
      case 'white':
      default:
        return {
          base: '#f1f5f9',
          stroke: '#cbd5e1',
          highlight: '#ffffff',
          shadow: '#94a3b8',
          innerFill: '#e2e8f0',
          name: 'Clay-Coated White',
        };
    }
  }, [material]);

  // Background style
  const bgStyle = useMemo(() => {
    if (lighting === 'transparent') return { background: 'transparent' };
    if (lighting === 'light') {
      return {
        background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
      };
    }
    return {
      background: 'radial-gradient(circle at 50% 35%, #1e293b 0%, #0f172a 70%, #020617 100%)',
    };
  }, [lighting]);

  // Calculate dynamic fill for a face based on its lighting angle
  const getFaceFill = (lightingFactor: number) => {
    if (material === 'kraft') {
      if (lightingFactor > 1.1) return '#d5b991';
      if (lightingFactor < 0.9) return '#9e7949';
      return '#bfa074';
    }
    if (material === 'dark') {
      if (lightingFactor > 1.1) return '#334155';
      if (lightingFactor < 0.9) return '#0f172a';
      return '#1e293b';
    }
    if (material === 'cream') {
      if (lightingFactor > 1.1) return '#fffbeb';
      if (lightingFactor < 0.9) return '#fde68a';
      return '#fef3c7';
    }
    // White
    if (lightingFactor > 1.1) return '#ffffff';
    if (lightingFactor < 0.9) return '#cbd5e1';
    return '#f1f5f9';
  };

  // High-res Mockup PNG Export
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Draw background if not transparent
      if (lighting === 'light') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (lighting === 'dark') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const a = document.createElement('a');
      a.download = `${dieline.templateId}-2D-assembled-mockup.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  // SVG Download
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${dieline.templateId}-2D-assembled-mockup.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check if template has an interactive openness/extension feature
  const hasOpennessControl = [
    'burger-box',
    'pizza-box',
    'dessert-sleeve-box',
    'round-food-tub'
  ].includes(dieline.templateId);

  const opennessLabel = dieline.templateId === 'dessert-sleeve-box' 
    ? 'Slide Tray' 
    : dieline.templateId === 'round-food-tub' 
    ? 'Lift Lid' 
    : 'Open Lid';

  return (
    <div className="assembled-preview-container" style={bgStyle}>
      {/* Top Floating Control Bar */}
      <div className="preview-toolbar">
        {/* Angle Presets */}
        <div className="preview-toolbar-group">
          <span className="preview-group-label">Angle:</span>
          <button
            type="button"
            className={`preview-pill-btn ${viewAngle === 'isometric' ? 'active' : ''}`}
            onClick={() => setViewAngle('isometric')}
            title="Isometric 3/4 Perspective"
          >
            <Rotate3d size={13} />
            <span>3/4 Hero</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAngle === 'front' ? 'active' : ''}`}
            onClick={() => setViewAngle('front')}
            title="Straight Front View"
          >
            <span>Front</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAngle === 'top' ? 'active' : ''}`}
            onClick={() => setViewAngle('top')}
            title="Top-Down Plan View"
          >
            <span>Top</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAngle === 'side' ? 'active' : ''}`}
            onClick={() => setViewAngle('side')}
            title="Side Elevation View"
          >
            <span>Side</span>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Material Selection */}
        <div className="preview-toolbar-group">
          <span className="preview-group-label">Material:</span>
          <button
            type="button"
            className={`preview-material-btn ${material === 'white' ? 'active' : ''}`}
            onClick={() => setMaterial('white')}
            title="Clay-Coated White Cardboard"
          >
            <span className="material-swatch white" />
            <span>White</span>
          </button>
          <button
            type="button"
            className={`preview-material-btn ${material === 'kraft' ? 'active' : ''}`}
            onClick={() => setMaterial('kraft')}
            title="Natural Brown Kraft Corrugated Paper"
          >
            <span className="material-swatch kraft" />
            <span>Kraft</span>
          </button>
          <button
            type="button"
            className={`preview-material-btn ${material === 'dark' ? 'active' : ''}`}
            onClick={() => setMaterial('dark')}
            title="Midnight Dark Cardstock"
          >
            <span className="material-swatch dark" />
            <span>Dark</span>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Studio Lighting Backdrop */}
        <div className="preview-toolbar-group">
          <button
            type="button"
            className={`preview-pill-btn ${lighting === 'dark' ? 'active' : ''}`}
            onClick={() => setLighting('dark')}
            title="Dark Studio Lighting"
          >
            <Moon size={13} />
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${lighting === 'light' ? 'active' : ''}`}
            onClick={() => setLighting('light')}
            title="Clean White Studio Lighting"
          >
            <Sun size={13} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Export Actions */}
        <div className="preview-toolbar-group">
          <button
            type="button"
            className="preview-action-btn primary"
            onClick={handleExportPNG}
            title="Export High-Resolution Mockup PNG"
          >
            <Camera size={13} />
            <span>Export PNG</span>
          </button>
          <button
            type="button"
            className="preview-action-btn"
            onClick={handleExportSVG}
            title="Download Scalable Vector Mockup SVG"
          >
            <Download size={13} />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Assembly / Openness Slider (for boxes with hinge or sliding tray) */}
      {hasOpennessControl && (
        <div className="preview-openness-bar">
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {opennessLabel}:
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={openness}
            onChange={(e) => setOpenness(parseFloat(e.target.value))}
            className="openness-slider"
          />
          <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
            {Math.round(openness * 100)}%
          </span>
        </div>
      )}

      {/* SVG Packaging Mockup Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="assembled-svg-viewport"
      >
        <defs>
          {/* Soft Ground Shadow Filter */}
          <filter id="ground-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
          </filter>

          {/* Crease Edge Highlight Filter */}
          <filter id="crease-highlight" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(255,255,255,0.4)" />
          </filter>

          {/* Clip paths for each assembled face to clip graphics precisely */}
          {model.faces.map((face) => {
            if (face.pathD) {
              return (
                <clipPath id={`clip-${face.id}`} key={`clip-${face.id}`}>
                  <path d={face.pathD} />
                </clipPath>
              );
            }
            const pts = face.points.map(p => `${p.x},${p.y}`).join(' ');
            return (
              <clipPath id={`clip-${face.id}`} key={`clip-${face.id}`}>
                <polygon points={pts} />
              </clipPath>
            );
          })}
        </defs>

        {/* 1. Ground Shadow */}
        {settings.showShadow && (
          <ellipse
            cx={model.shadow.cx}
            cy={model.shadow.cy}
            rx={model.shadow.rx}
            ry={model.shadow.ry}
            fill="#000000"
            opacity={lighting === 'light' ? model.shadow.opacity * 0.4 : model.shadow.opacity}
            filter="url(#ground-shadow)"
          />
        )}

        {/* 2. Window Contents Simulation */}
        {dieline.templateId === 'sandwich-wedge-box' && (
          <g opacity={0.9}>
            {/* Visual simulation of delicious cut sandwich layers visible through cello window */}
            <path
              d="M 330 250 L 460 300 L 440 420 L 310 370 Z"
              fill="#fef08a"
              stroke="#ca8a04"
              strokeWidth={1}
            />
            {/* Lettuce layer */}
            <path d="M 320 280 L 450 330" stroke="#22c55e" strokeWidth={5} strokeLinecap="round" />
            {/* Tomato layer */}
            <path d="M 315 310 L 445 360" stroke="#ef4444" strokeWidth={6} strokeLinecap="round" />
            {/* Cheese layer */}
            <path d="M 310 340 L 440 390" stroke="#eab308" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}

        {dieline.templateId === 'fries-scoop-box' && (
          <g>
            {/* Golden French Fries peeking out of the top scoop */}
            {[
              { x1: 360, y1: 280, x2: 350, y2: 210, w: 10, fill: '#f59e0b' },
              { x1: 375, y1: 275, x2: 370, y2: 195, w: 11, fill: '#fbbf24' },
              { x1: 395, y1: 270, x2: 395, y2: 185, w: 12, fill: '#f59e0b' },
              { x1: 415, y1: 275, x2: 420, y2: 190, w: 11, fill: '#fbbf24' },
              { x1: 435, y1: 280, x2: 445, y2: 205, w: 10, fill: '#f59e0b' },
              { x1: 380, y1: 280, x2: 385, y2: 220, w: 9, fill: '#d97706' },
              { x1: 410, y1: 280, x2: 405, y2: 215, w: 9, fill: '#d97706' },
            ].map((fry, idx) => (
              <line
                key={`fry-${idx}`}
                x1={fry.x1}
                y1={fry.y1}
                x2={fry.x2}
                y2={fry.y2}
                stroke={fry.fill}
                strokeWidth={fry.w}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {dieline.templateId === 'bread-loaf-bag' && (
          <g opacity={0.85}>
            {/* Sliced golden bread loaf visual inside poly bag */}
            <rect x="330" y="270" width="140" height="150" rx="20" fill="#fde68a" stroke="#d97706" strokeWidth={1.5} />
            {/* Bread slice crust ridges */}
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <line
                key={`slice-${i}`}
                x1={345 + i * 16}
                y1={270}
                x2={345 + i * 16}
                y2={420}
                stroke="#d97706"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            ))}
          </g>
        )}

        {dieline.templateId === 'dessert-sleeve-box' && openness > 0.05 && (
          <g opacity={0.95}>
            {/* Colorful gourmet macarons resting inside the pulled-out tray */}
            {[
              { cx: 530, cy: 370, color: '#f43f5e' },
              { cx: 560, cy: 385, color: '#10b981' },
              { cx: 590, cy: 400, color: '#f59e0b' },
            ].map((mac, idx) => (
              <ellipse
                key={`mac-${idx}`}
                cx={mac.cx}
                cy={mac.cy}
                rx={14}
                ry={9}
                fill={mac.color}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
              />
            ))}
          </g>
        )}

        {/* 3. Render Assembled Model Faces */}
        {model.faces.map((face) => {
          const fill = getFaceFill(face.lighting);
          const stroke = materialStyles.stroke;

          return (
            <g
              key={face.id}
              className="assembled-face-group"
              onMouseEnter={() => setHoveredFaceName(face.name)}
              onMouseLeave={() => setHoveredFaceName(null)}
            >
              {/* Base Face Geometry */}
              {face.pathD ? (
                <path
                  d={face.pathD}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.2s ease' }}
                />
              ) : (
                <polygon
                  points={face.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.2s ease' }}
                />
              )}

              {/* 4. Projected User Graphics on Face */}
              <g clipPath={`url(#clip-${face.id})`}>
                {face.graphics.map((g) => {
                  // Quad affine mapping
                  const p0 = face.points[0];
                  const p1 = face.points[1];
                  const p2 = face.points[2];
                  const p3 = face.points[3];

                  const targetW = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 100;
                  const targetH = Math.hypot(p3.x - p0.x, p3.y - p0.y) || 100;

                  const transformMatrix = getQuadAffineMatrix(p0, p1, p2, p3, targetW, targetH);

                  return (
                    <g key={g.id} transform={transformMatrix}>
                      <g
                        transform={`translate(${g.x}, ${g.y}) rotate(${g.rotation}) scale(${g.scaleX}, ${g.scaleY})`}
                      >
                        {g.type === 'text' && (
                          <text
                            x={0}
                            y={0}
                            fill={g.fill}
                            fontSize={g.fontSize}
                            fontFamily={g.fontFamily}
                            fontWeight={g.fontWeight}
                            textAnchor={g.textAlign === 'center' ? 'middle' : g.textAlign === 'right' ? 'end' : 'start'}
                            dominantBaseline="central"
                            style={{ userSelect: 'none' }}
                          >
                            {g.text}
                          </text>
                        )}

                        {g.type === 'image' && g.src && (
                          <image
                            href={g.src}
                            x={-targetW * 0.4}
                            y={-targetH * 0.4}
                            width={targetW * 0.8}
                            height={targetH * 0.8}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        )}

                        {g.type === 'icon' && g.src && (
                          <image
                            href={g.src}
                            x={-20}
                            y={-20}
                            width={40}
                            height={40}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        )}

                        {g.type === 'barcode' && (
                          <g transform="translate(-40, -15)">
                            <rect x={0} y={0} width={80} height={30} fill="#ffffff" rx={2} />
                            {[2, 7, 11, 17, 23, 27, 34, 40, 47, 52, 58, 65, 71].map((bx, bidx) => (
                              <line
                                key={bidx}
                                x1={bx}
                                y1={3}
                                x2={bx}
                                y2={27}
                                stroke="#000000"
                                strokeWidth={bidx % 2 === 0 ? 3 : 1.5}
                              />
                            ))}
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* Crease / Corner Accent Lines */}
              {!face.pathD && face.points.length >= 4 && (
                <line
                  x1={face.points[0].x}
                  y1={face.points[0].y}
                  x2={face.points[1].x}
                  y2={face.points[1].y}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Hovered Face Badge */}
      {hoveredFaceName && (
        <div className="preview-hover-tag">
          <Eye size={12} color="var(--accent-secondary)" />
          <span>Face: {hoveredFaceName}</span>
        </div>
      )}

      {/* Footer Info Badge */}
      <div className="preview-footer-info">
        <Sparkles size={13} color="var(--accent-primary)" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dieline.templateName}</span>
        <span style={{ color: 'var(--border-medium)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {materialStyles.name} • 1:1 Ground-Truth Projection
        </span>
      </div>
    </div>
  );
};
