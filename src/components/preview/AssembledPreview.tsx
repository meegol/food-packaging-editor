import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Eye, 
  Rotate3d, 
  Download, 
  Sparkles, 
  Sun, 
  Moon, 
  Camera,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DielineResult, PanelFace } from '../../core/dieline/types';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Turntable angles (yaw: 0-360 deg, pitch: -65 to +65 deg)
  const [yaw, setYaw] = useState<number>(35);
  const [pitch, setPitch] = useState<number>(24);
  const [viewAnglePreset, setViewAnglePreset] = useState<ViewAngle>('isometric');

  // Drag interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Material & studio lighting
  const [material, setMaterial] = useState<MaterialFinish>('white');
  const [lighting, setLighting] = useState<StudioLighting>('dark');
  const [openness, setOpenness] = useState<number>(0);
  const [hoveredFaceName, setHoveredFaceName] = useState<string | null>(null);

  // All-Sides Proof Sheet drawer open/closed state
  const [showSidesStrip, setShowSidesStrip] = useState<boolean>(true);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  // Angle preset snapping
  const snapToAngle = (preset: ViewAngle) => {
    setViewAnglePreset(preset);
    switch (preset) {
      case 'front':
        setYaw(0);
        setPitch(5);
        break;
      case 'side':
        setYaw(90);
        setPitch(5);
        break;
      case 'back':
        setYaw(180);
        setPitch(5);
        break;
      case 'left':
        setYaw(270);
        setPitch(5);
        break;
      case 'top':
        setYaw(0);
        setPitch(80);
        break;
      case 'bottom':
        setYaw(0);
        setPitch(-80);
        break;
      case 'isometric':
      default:
        setYaw(35);
        setPitch(24);
        break;
    }
  };

  // Click on a panel from the All-Sides Strip to snap turntable to it
  const snapToPanel = (panel: PanelFace) => {
    setSelectedPanelId(panel.id);
    const pid = (panel.id + ' ' + panel.name).toLowerCase();
    if (pid.includes('front') || pid.includes('window') || pid.includes('center')) {
      snapToAngle('front');
    } else if (pid.includes('back') || pid.includes('rear') || pid.includes('spine')) {
      snapToAngle('back');
    } else if (pid.includes('right')) {
      snapToAngle('side');
    } else if (pid.includes('left')) {
      snapToAngle('left');
    } else if (pid.includes('top') || pid.includes('lid') || pid.includes('header')) {
      snapToAngle('top');
    } else if (pid.includes('bottom') || pid.includes('base') || pid.includes('seal')) {
      snapToAngle('bottom');
    } else {
      snapToAngle('isometric');
    }
  };

  // Mouse wheel scrolling over preview rotates 360 degrees
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      setYaw((prev) => {
        const next = (prev + delta * 0.25) % 360;
        return next < 0 ? next + 360 : next;
      });
      setViewAnglePreset('custom');
    };

    container.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelHandler);
    };
  }, []);

  // Drag-to-orbit handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => {
      const next = (prev + dx * 0.45) % 360;
      return next < 0 ? next + 360 : next;
    });
    setPitch((prev) => Math.max(-65, Math.min(65, prev - dy * 0.35)));
    setViewAnglePreset('custom');
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Window-level mouseup listener so releasing outside canvas ends drag
  useEffect(() => {
    const onGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  const settings: PreviewSettings = useMemo(() => ({
    viewAngle: viewAnglePreset,
    material,
    lighting,
    openness,
    showShadow: true,
    zoom: 1,
    yaw,
    pitch,
  }), [viewAnglePreset, material, lighting, openness, yaw, pitch]);

  // Generate 3D assembled model geometry
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
      if (lightingFactor > 1.08) return '#d5b991';
      if (lightingFactor < 0.88) return '#9e7949';
      return '#bfa074';
    }
    if (material === 'dark') {
      if (lightingFactor > 1.08) return '#334155';
      if (lightingFactor < 0.88) return '#0f172a';
      return '#1e293b';
    }
    if (material === 'cream') {
      if (lightingFactor > 1.08) return '#fffbeb';
      if (lightingFactor < 0.88) return '#fde68a';
      return '#fef3c7';
    }
    // White
    if (lightingFactor > 1.08) return '#ffffff';
    if (lightingFactor < 0.88) return '#cbd5e1';
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
      a.download = `${dieline.templateId}-360-mockup-${Math.round(yaw)}deg.png`;
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
    a.download = `${dieline.templateId}-360-mockup.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Interactive openness/extension feature
  const hasOpennessControl = [
    'burger-box',
    'pizza-box',
    'dessert-sleeve-box',
    'round-food-tub',
  ].includes(dieline.templateId);

  const opennessLabel = dieline.templateId === 'dessert-sleeve-box' 
    ? 'Slide Tray' 
    : dieline.templateId === 'round-food-tub' 
    ? 'Lift Lid' 
    : 'Open Lid';

  return (
    <div
      ref={containerRef}
      className="assembled-preview-container"
      style={bgStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. Top Control Bar (Angle Presets, Material, Studio, Export) */}
      <div className="preview-toolbar">
        {/* Cardinal Face Snap Presets */}
        <div className="preview-toolbar-group">
          <span className="preview-group-label">Angle:</span>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'isometric' ? 'active' : ''}`}
            onClick={() => snapToAngle('isometric')}
            title="Isometric 3/4 Hero View (35°)"
          >
            <Rotate3d size={13} />
            <span>3/4 Hero</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'front' ? 'active' : ''}`}
            onClick={() => snapToAngle('front')}
            title="Straight Front Face (0°)"
          >
            <span>Front</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'side' ? 'active' : ''}`}
            onClick={() => snapToAngle('side')}
            title="Right Side Wall (90°)"
          >
            <span>Right</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'back' ? 'active' : ''}`}
            onClick={() => snapToAngle('back')}
            title="Rear Back Wall (180°)"
          >
            <span>Back</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'left' ? 'active' : ''}`}
            onClick={() => snapToAngle('left')}
            title="Left Side Wall (270°)"
          >
            <span>Left</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'top' ? 'active' : ''}`}
            onClick={() => snapToAngle('top')}
            title="Top Lid View (Pitch 80°)"
          >
            <span>Top</span>
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${viewAnglePreset === 'bottom' ? 'active' : ''}`}
            onClick={() => snapToAngle('bottom')}
            title="Bottom Base View (Pitch -80°)"
          >
            <span>Bottom</span>
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
            title="Natural Brown Kraft Cardboard"
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
          <button
            type="button"
            className={`preview-material-btn ${material === 'cream' ? 'active' : ''}`}
            onClick={() => setMaterial('cream')}
            title="Bakery Cream Paperboard"
          >
            <span className="material-swatch cream" />
            <span>Cream</span>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Studio Lighting */}
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
          </button>
        </div>
      </div>

      {/* 2. Turntable 360° Rotation Slider Bar */}
      <div className="preview-turntable-bar">
        <Rotate3d size={14} style={{ color: 'var(--accent-secondary)' }} />
        <span className="turntable-label">Scroll to Spin:</span>
        <button
          type="button"
          className="turntable-step-btn"
          onClick={() => {
            setYaw((prev) => (prev - 45 + 360) % 360);
            setViewAnglePreset('custom');
          }}
          title="Turn Left 45°"
        >
          -45°
        </button>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={Math.round(yaw)}
          onChange={(e) => {
            setYaw(parseFloat(e.target.value));
            setViewAnglePreset('custom');
          }}
          className="turntable-slider"
          title="360° Turntable Angle"
        />
        <button
          type="button"
          className="turntable-step-btn"
          onClick={() => {
            setYaw((prev) => (prev + 45) % 360);
            setViewAnglePreset('custom');
          }}
          title="Turn Right 45°"
        >
          +45°
        </button>
        <span className="turntable-degree-badge">{Math.round(yaw)}°</span>
      </div>

      {/* 3. Openness / Lid Extension Slider */}
      {hasOpennessControl && (
        <div className="preview-openness-bar">
          <span className="preview-group-label">{opennessLabel}:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={openness}
            onChange={(e) => setOpenness(parseFloat(e.target.value))}
            className="openness-slider"
            title={`Adjust ${opennessLabel}`}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '28px' }}>
            {Math.round(openness * 100)}%
          </span>
        </div>
      )}

      {/* 4. Main 3D Assembled SVG Viewport */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 700"
        className="assembled-svg-viewport"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <defs>
          {/* Ground Contact Shadow Filter */}
          <radialGradient id="ground-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#000000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Define Face Clipping Paths */}
          {model.faces.map((face) => {
            if (face.pathD) {
              return (
                <clipPath key={`clip-${face.id}`} id={`clip-${face.id}`}>
                  <path d={face.pathD} />
                </clipPath>
              );
            }
            return (
              <clipPath key={`clip-${face.id}`} id={`clip-${face.id}`}>
                <polygon points={face.points.map(p => `${p.x},${p.y}`).join(' ')} />
              </clipPath>
            );
          })}
        </defs>

        {/* Ground Ambient Contact Shadow */}
        {settings.showShadow && (
          <ellipse
            cx={model.shadow.cx}
            cy={model.shadow.cy}
            rx={model.shadow.rx}
            ry={model.shadow.ry}
            fill="url(#ground-shadow)"
          />
        )}

        {/* Template-Specific Interior Decorations */}
        {dieline.templateId === 'burger-box' && openness > 0.15 && (
          <g opacity={Math.min(1, openness * 1.5)}>
            <ellipse cx="400" cy="335" rx="55" ry="24" fill="#ca8a04" stroke="#854d0e" strokeWidth={1} />
            <ellipse cx="400" cy="328" rx="52" ry="18" fill="#451a03" stroke="#292524" strokeWidth={1} />
            <path d="M 350 326 Q 400 338 450 326" stroke="#22c55e" strokeWidth={5} strokeLinecap="round" />
            <path d="M 355 330 Q 400 342 445 330" stroke="#ef4444" strokeWidth={4} strokeLinecap="round" />
            <path d="M 360 334 Q 400 346 440 334" stroke="#eab308" strokeWidth={3} strokeLinecap="round" />
          </g>
        )}

        {dieline.templateId === 'pizza-box' && openness > 0.15 && (
          <g opacity={Math.min(1, openness * 1.5)}>
            <ellipse cx="400" cy="335" rx="85" ry="42" fill="#fde047" stroke="#ca8a04" strokeWidth={1.5} />
            <ellipse cx="400" cy="335" rx="76" ry="36" fill="#ef4444" opacity={0.6} />
            {/* Pepperoni slices */}
            {[
              { cx: 370, cy: 330 },
              { cx: 430, cy: 335 },
              { cx: 400, cy: 320 },
              { cx: 390, cy: 345 },
              { cx: 420, cy: 325 },
            ].map((pep, pidx) => (
              <ellipse key={`pep-${pidx}`} cx={pep.cx} cy={pep.cy} rx={9} ry={5} fill="#b91c1c" />
            ))}
          </g>
        )}

        {dieline.templateId === 'fries-scoop-box' && (
          <g>
            {[
              { x1: 360, y1: 290, x2: 350, y2: 215, w: 11, fill: '#f59e0b' },
              { x1: 375, y1: 285, x2: 370, y2: 195, w: 12, fill: '#fbbf24' },
              { x1: 395, y1: 280, x2: 395, y2: 185, w: 13, fill: '#f59e0b' },
              { x1: 415, y1: 285, x2: 420, y2: 190, w: 12, fill: '#fbbf24' },
              { x1: 435, y1: 290, x2: 445, y2: 210, w: 11, fill: '#f59e0b' },
              { x1: 380, y1: 290, x2: 385, y2: 225, w: 10, fill: '#d97706' },
              { x1: 410, y1: 290, x2: 405, y2: 220, w: 10, fill: '#d97706' },
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
          <g opacity={0.88}>
            <rect x="330" y="270" width="140" height="150" rx="20" fill="#fde68a" stroke="#d97706" strokeWidth={1.5} />
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
            {[
              { cx: 400, cy: 385, color: '#f43f5e' },
              { cx: 435, cy: 385, color: '#10b981' },
              { cx: 365, cy: 385, color: '#f59e0b' },
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

        {/* 3D Depth-Sorted Packaging Faces */}
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
              {/* Base Geometry */}
              {face.pathD ? (
                <path
                  d={face.pathD}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                />
              ) : (
                <polygon
                  points={face.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                />
              )}

              {/* Projected User Graphics on Face */}
              <g clipPath={`url(#clip-${face.id})`}>
                {face.graphics.map((g) => {
                  const p0 = face.points[0];
                  const p1 = face.points[1];
                  const p2 = face.points[2];
                  const p3 = face.points.length >= 4 ? face.points[3] : face.points[2];

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

              {/* Subtle Crease Accent Lines */}
              {!face.pathD && face.points.length >= 4 && (
                <line
                  x1={face.points[0].x}
                  y1={face.points[0].y}
                  x2={face.points[1].x}
                  y2={face.points[1].y}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Face Pill */}
      {hoveredFaceName && (
        <div className="preview-hover-tag">
          <Eye size={12} color="var(--accent-secondary)" />
          <span>Face: {hoveredFaceName}</span>
        </div>
      )}

      {/* 5. All-Sides Scrollable Proof Sheet / Strip */}
      <div className="preview-all-sides-container">
        <div className="preview-sides-header">
          <div className="sides-header-title">
            <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>All-Sides Proof Sheet ({dieline.panels.length} Sides)</span>
            <span className="sides-header-hint">• Scroll to inspect all panels • Click to spin 3D view</span>
          </div>
          <button
            type="button"
            className="sides-toggle-btn"
            onClick={() => setShowSidesStrip(!showSidesStrip)}
            title={showSidesStrip ? 'Collapse Sides Strip' : 'Expand All Sides Strip'}
          >
            {showSidesStrip ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {showSidesStrip && (
          <div className="preview-sides-strip" tabIndex={0} role="region" aria-label="All Packaging Sides Scroll Strip">
            {dieline.panels.map((panel) => {
              const panelGraphics = graphics.filter(g => g.panelId === panel.id);
              const isSelected = selectedPanelId === panel.id;

              return (
                <div
                  key={panel.id}
                  className={`preview-side-card ${isSelected ? 'active' : ''}`}
                  onClick={() => snapToPanel(panel)}
                  title={`Click to rotate 3D view to "${panel.name}"`}
                >
                  {/* Miniature 2D SVG Proof of the Face */}
                  <div className="side-card-preview-box">
                    <svg
                      viewBox={`${panel.bounds.x - 4} ${panel.bounds.y - 4} ${panel.bounds.width + 8} ${panel.bounds.height + 8}`}
                      className="side-card-svg"
                    >
                      {/* Panel Background Polygon */}
                      <polygon
                        points={panel.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={materialStyles.base}
                        stroke={materialStyles.stroke}
                        strokeWidth={1}
                      />

                      {/* Render Graphics On Panel */}
                      {panelGraphics.map((g) => {
                        return (
                          <g
                            key={g.id}
                            transform={`translate(${g.x}, ${g.y}) rotate(${g.angle || 0}) scale(${g.scaleX || 1}, ${g.scaleY || 1})`}
                          >
                            {g.type === 'text' && (
                              <text
                                x={0}
                                y={0}
                                fill={g.fill || '#000000'}
                                fontSize={g.fontSize || 14}
                                fontFamily={g.fontFamily}
                                fontWeight={g.fontWeight}
                                textAnchor={g.textAlign === 'center' ? 'middle' : g.textAlign === 'right' ? 'end' : 'start'}
                                dominantBaseline="central"
                              >
                                {g.text}
                              </text>
                            )}

                            {g.type === 'image' && g.src && (
                              <image
                                href={g.src}
                                x={-15}
                                y={-15}
                                width={30}
                                height={30}
                                preserveAspectRatio="xMidYMid meet"
                              />
                            )}

                            {g.type === 'icon' && g.src && (
                              <image
                                href={g.src}
                                x={-10}
                                y={-10}
                                width={20}
                                height={20}
                                preserveAspectRatio="xMidYMid meet"
                              />
                            )}

                            {g.type === 'barcode' && (
                              <rect x={-15} y={-6} width={30} height={12} fill="#000000" opacity={0.8} />
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="side-card-info">
                    <span className="side-card-name" title={panel.name}>{panel.name}</span>
                    <span className="side-card-dim">
                      {Math.round(panel.bounds.width)} × {Math.round(panel.bounds.height)} mm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info Badge */}
      <div className="preview-footer-info">
        <Sparkles size={13} color="var(--accent-primary)" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dieline.templateName}</span>
        <span style={{ color: 'var(--border-medium)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          360° Scroll Turntable • {materialStyles.name}
        </span>
      </div>
    </div>
  );
};
