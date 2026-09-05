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
  ChevronUp,
  ChevronLeft,
  ChevronRight
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
  const scrollStripRef = useRef<HTMLDivElement>(null);

  const scrollProofStrip = (dir: 'left' | 'right') => {
    if (scrollStripRef.current) {
      scrollStripRef.current.scrollBy({
        left: dir === 'left' ? -240 : 240,
        behavior: 'smooth',
      });
    }
  };

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

  // Mouse wheel scrolling: spins turntable when over canvas, scrolls proof sheet when over strip
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelHandler = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const proofStrip = target?.closest('.preview-sides-strip') as HTMLElement | null;
      if (proofStrip) {
        e.preventDefault();
        proofStrip.scrollLeft += (e.deltaY !== 0 ? e.deltaY : e.deltaX) * 1.5;
        return;
      }

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
  // Material color palettes with distinct fold-line creases
  const materialStyles = useMemo(() => {
    switch (material) {
      case 'kraft':
        return {
          base: '#bfa074',
          stroke: '#6d4c26', // Crisp dark scored crease
          highlight: '#e0c7a5',
          shadow: '#785328',
          innerFill: '#8c6030',
          name: 'Kraft Cardboard',
        };
      case 'dark':
        return {
          base: '#1e293b',
          stroke: '#64748b', // Clear slate edge crease
          highlight: '#384860',
          shadow: '#0f172a',
          innerFill: '#0b1120',
          name: 'Midnight Dark',
        };
      case 'cream':
        return {
          base: '#fef3c7',
          stroke: '#b47820', // Warm golden fold line
          highlight: '#fffbeb',
          shadow: '#d99b35',
          innerFill: '#eed886',
          name: 'Bakery Cream',
        };
      case 'white':
      default:
        return {
          base: '#f1f5f9',
          stroke: '#475569', // Crisp slate crease line (NEVER matching fill!)
          highlight: '#ffffff',
          shadow: '#94a3b8',
          innerFill: '#cbd5e1',
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

  // Calculate dynamic continuous fill for a face based on its lighting angle
  const getFaceFill = (lightingFactor: number) => {
    // Normal lighting factor ranges between 0.40 and 1.28
    const t = Math.max(0, Math.min(1, (lightingFactor - 0.40) / 0.88));

    if (material === 'kraft') {
      // Deep shadow kraft: rgb(130, 95, 55) -> Highlight kraft: rgb(225, 195, 155)
      const r = Math.round(130 + t * 95);
      const g = Math.round(95 + t * 100);
      const b = Math.round(55 + t * 100);
      return `rgb(${r}, ${g}, ${b})`;
    }
    if (material === 'dark') {
      // Deep midnight: rgb(15, 23, 42) -> Illuminated slate: rgb(55, 75, 105)
      const r = Math.round(15 + t * 40);
      const g = Math.round(23 + t * 52);
      const b = Math.round(42 + t * 63);
      return `rgb(${r}, ${g}, ${b})`;
    }
    if (material === 'cream') {
      // Warm bakery shadow: rgb(235, 210, 145) -> Ivory highlight: rgb(255, 253, 245)
      const r = Math.round(235 + t * 20);
      const g = Math.round(210 + t * 43);
      const b = Math.round(145 + t * 100);
      return `rgb(${r}, ${g}, ${b})`;
    }
    // White: Crisp shadow: rgb(180, 195, 215) -> Crisp bright highlight: rgb(255, 255, 255)
    const r = Math.round(180 + t * 75);
    const g = Math.round(195 + t * 60);
    const b = Math.round(215 + t * 40);
    return `rgb(${r}, ${g}, ${b})`;
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

        {/* 3D Depth-Sorted Packaging Faces */}
        {model.faces.map((face) => {
          const fill = getFaceFill(face.lighting);
          const isHovered = hoveredFaceName === face.name;
          const stroke = isHovered ? 'var(--accent-primary, #06b6d4)' : materialStyles.stroke;
          const strokeW = isHovered ? 2.4 : 1.4;

          return (
            <g
              key={face.id}
              className="assembled-face-group"
              onMouseEnter={() => setHoveredFaceName(face.name)}
              onMouseLeave={() => setHoveredFaceName(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Base Geometry with Crisp Creases */}
              {face.pathD ? (
                <path
                  d={face.pathD}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : (
                <polygon
                  points={face.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  strokeLinejoin="round"
                  strokeLinecap="round"
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
                            x={-30}
                            y={-30}
                            width={60}
                            height={60}
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
                          <g>
                            <rect x={-30} y={-14} width={60} height={28} fill="#ffffff" />
                            <rect x={-28} y={-12} width={56} height={24} fill="#000000" opacity={0.88} />
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* Subtle face border highlight */}
              {face.points.length >= 3 && !face.pathD && (
                <polygon
                  points={face.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={isHovered ? 'var(--accent-primary, #06b6d4)' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={0.8}
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
            <span className="sides-header-hint">• Scroll or click arrows to inspect all panels • Click to spin 3D view</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="sides-toggle-btn"
              onClick={() => scrollProofStrip('left')}
              title="Scroll Panels Left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="sides-toggle-btn"
              onClick={() => scrollProofStrip('right')}
              title="Scroll Panels Right"
            >
              <ChevronRight size={14} />
            </button>
            <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button
              type="button"
              className="sides-toggle-btn"
              onClick={() => setShowSidesStrip(!showSidesStrip)}
              title={showSidesStrip ? 'Collapse Sides Strip' : 'Expand All Sides Strip'}
            >
              {showSidesStrip ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {showSidesStrip && (
          <div
            ref={scrollStripRef}
            className="preview-sides-strip"
            tabIndex={0}
            role="region"
            aria-label="All Packaging Sides Scroll Strip"
          >
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
