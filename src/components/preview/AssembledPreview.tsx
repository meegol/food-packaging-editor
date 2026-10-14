import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Eye, 
  Rotate3d, 
  Download, 
  Sun, 
  Moon, 
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  UploadCloud
} from 'lucide-react';
import { DielineResult, PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';
import { ViewAngle, MaterialFinish, StudioLighting } from '../../core/preview/previewTypes';
import { textWrapWidth } from '../../core/canvas/graphicObjects';
import { BOARD_COLORS, Package3DView, Package3DViewHandle } from './Package3DView';
import { CANVAS_UNITS_PER_MM } from '../../core/export/exportTypes';

let measureCtx: CanvasRenderingContext2D | null | undefined;

function wrapLines(text: string, font: string, fontSize: number, wrapWidth?: number): string[] {
  const paragraphs = text.split('\n');
  if (!wrapWidth) return paragraphs;
  if (measureCtx === undefined) {
    measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  }
  const ctx = measureCtx;
  const measure = (s: string) => {
    if (!ctx) return s.length * fontSize * 0.55;
    ctx.font = font;
    return ctx.measureText(s).width;
  };
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > wrapWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

interface SvgTextBlockProps {
  text: string;
  fill?: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  wrapWidth?: number;
}

const SvgTextBlock: React.FC<SvgTextBlockProps> = ({
  text, fill, fontSize, fontFamily, fontWeight, fontStyle, textAlign, lineHeight, wrapWidth,
}) => {
  const family = fontFamily || 'Inter, sans-serif';
  const lines = wrapLines(text, `${fontStyle || 'normal'} ${fontWeight || 'normal'} ${fontSize}px ${family}`, fontSize, wrapWidth);
  const step = fontSize * (lineHeight || 1.25);
  const anchor = textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
  return (
    <text
      x={0}
      y={0}
      fill={fill}
      fontSize={fontSize}
      fontFamily={family}
      fontWeight={fontWeight}
      fontStyle={fontStyle || 'normal'}
      textAnchor={anchor}
      dominantBaseline="central"
      style={{ userSelect: 'none' }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={0} dy={i === 0 ? -((lines.length - 1) / 2) * step : step}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

interface AssembledPreviewProps {
  dieline: DielineResult;
  graphics: GraphicItem[];
  themeId?: string;
  onAddGraphic?: (item: GraphicItem) => void;
  onSelectPanel?: (panelId: string) => void;
  activePanelId?: string | null;
}

export const AssembledPreview: React.FC<AssembledPreviewProps> = ({
  dieline,
  graphics,
  onAddGraphic,
  onSelectPanel,
  activePanelId,
}) => {
  const viewRef = useRef<Package3DViewHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Turntable angles (yaw: 0-360 deg, pitch: -65 to +65 deg)
  const [yaw, setYaw] = useState<number>(35);
  const [pitch, setPitch] = useState<number>(24);
  const [viewAnglePreset, setViewAnglePreset] = useState<ViewAngle>('isometric');

  // Drag interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drag-and-drop image states onto 3D faces or proof sheet cards
  const [isDragOverPreview, setIsDragOverPreview] = useState<boolean>(false);
  const [dragTargetPanelId, setDragTargetPanelId] = useState<string | null>(null);

  const processImageDrop = (file: File, targetPanelId: string) => {
    if (!file.type.startsWith('image/') || !onAddGraphic) return;
    const targetPanel = dieline.panels.find(p => p.id === targetPanelId);
    if (!targetPanel) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || 200;
        const nh = img.naturalHeight || 200;
        const pw = targetPanel.bounds.width;
        const ph = targetPanel.bounds.height;
        const fitRatio = 0.70;
        const scaleFit = Math.min((pw * fitRatio) / nw, (ph * fitRatio) / nh);

        const newItem: GraphicItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          panelId: targetPanel.id,
          type: 'image',
          src,
          fileName: file.name,
          x: targetPanel.center.x,
          y: targetPanel.center.y,
          scaleX: scaleFit,
          scaleY: scaleFit,
          naturalWidth: nw,
          naturalHeight: nh,
          width: nw * scaleFit,
          height: nh * scaleFit,
          clipToPanel: true,
        };

        onAddGraphic(newItem);
        if (onSelectPanel) {
          onSelectPanel(targetPanel.id);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const pickModelPanel = (e: React.MouseEvent | React.DragEvent): string | null => {
    const overModel = (e.target as HTMLElement).closest?.('.package-3d-view');
    return overModel ? viewRef.current?.pickPanel(e.clientX, e.clientY) ?? null : null;
  };

  const handlePreviewDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPreview(false);
    setDragTargetPanelId(null);

    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return;
    const file = e.dataTransfer.files[0];

    let targetPanelId = pickModelPanel(e);
    if (!targetPanelId && activePanelId) {
      targetPanelId = activePanelId;
    }
    if (!targetPanelId) {
      const preferred = dieline.panels.find(p => p.id.includes('front') || p.id.includes('lid') || p.id.includes('top'));
      targetPanelId = preferred ? preferred.id : dieline.panels[0]?.id;
    }
    if (!targetPanelId) return;

    processImageDrop(file, targetPanelId);
  };

  const handleProofCardDrop = (e: React.DragEvent, panel: PanelFace) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPreview(false);
    setDragTargetPanelId(null);

    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return;
    const file = e.dataTransfer.files[0];
    processImageDrop(file, panel.id);
    snapToPanel(panel);
  };

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
    if (!isDragging) {
      const id = pickModelPanel(e);
      setHoveredFaceName(id ? dieline.panels.find(p => p.id === id)?.name ?? null : null);
      return;
    }
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

  const materialStyles = useMemo(() => {
    const styles: Record<MaterialFinish, { stroke: string; name: string }> = {
      kraft: { stroke: '#6d4c26', name: 'Kraft Cardboard' },
      dark: { stroke: '#64748b', name: 'Midnight Dark' },
      cream: { stroke: '#b47820', name: 'Bakery Cream' },
      white: { stroke: '#475569', name: 'Clay-Coated White' },
    };
    return { base: BOARD_COLORS[material], ...(styles[material] ?? styles.white) };
  }, [material]);

  // Background style
  const bgStyle = useMemo(() => {
    if (lighting === 'transparent') return { background: 'transparent' };
    if (lighting === 'light') return { background: 'var(--bg-app)' };
    return { background: 'var(--mat)' };
  }, [lighting]);

  const downloadDataUrl = (url: string | null | undefined, name: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    a.click();
  };

  const handleExportPNG = () => {
    const background = lighting === 'light' ? '#f8fafc' : lighting === 'dark' ? '#0f172a' : null;
    downloadDataUrl(
      viewRef.current?.snapshot(background, 3),
      `${dieline.templateId}-360-mockup-${Math.round(yaw)}deg.png`,
    );
  };

  const handleExportTransparent = () => {
    downloadDataUrl(
      viewRef.current?.snapshot(null, 3),
      `${dieline.templateId}-360-mockup-transparent.png`,
    );
  };

  // Interactive openness/extension feature
  const hasOpennessControl = [
    'burger-box',
    'pizza-box',
    'dessert-sleeve-box',
    'round-food-tub',
  ].includes(dieline.templateId);

  const opennessLabel = dieline.templateId === 'dessert-sleeve-box' 
    ? 'Slide tray' 
    : dieline.templateId === 'round-food-tub' 
    ? 'Lift lid' 
    : 'Open lid';

  return (
    <div
      ref={containerRef}
      className="assembled-preview-container"
      style={bgStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOverPreview(true);
        const id = pickModelPanel(e);
        if (id !== dragTargetPanelId) setDragTargetPanelId(id);
      }}
      onDragLeave={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          if (
            e.clientX <= rect.left ||
            e.clientX >= rect.right ||
            e.clientY <= rect.top ||
            e.clientY >= rect.bottom
          ) {
            setIsDragOverPreview(false);
            setDragTargetPanelId(null);
          }
        }
      }}
      onDrop={(e) => handlePreviewDrop(e)}
    >
      {/* Drag-and-Drop Image Overlay */}
      {isDragOverPreview && (
        <div className="preview-drag-overlay">
          <div className="preview-drag-indicator">
            <UploadCloud size={32} color="var(--accent-secondary, #38bdf8)" />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              {dragTargetPanelId
                ? `Drop onto ${dieline.panels.find(p => p.id === dragTargetPanelId)?.name}`
                : 'Drop the image onto the package'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
              It will appear on the model and in the face list below
            </div>
          </div>
        </div>
      )}

      {/* 1. Top Control Bar (Angle Presets, Material, Studio, Export) */}
      <div className="preview-toolbar">
        {/* Cardinal Face Snap Presets */}
        <div className="preview-toolbar-group">
          <span className="preview-group-label">View</span>
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
          <span className="preview-group-label">Board</span>
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
            title="Mat backdrop"
          >
            <Moon size={13} />
          </button>
          <button
            type="button"
            className={`preview-pill-btn ${lighting === 'light' ? 'active' : ''}`}
            onClick={() => setLighting('light')}
            title="Light backdrop"
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
            title="Save a high-resolution image of this view"
          >
            <Camera size={13} />
            <span>Save image</span>
          </button>
          <button
            type="button"
            className="preview-action-btn"
            onClick={handleExportTransparent}
            title="Save the image with a transparent background"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* 2. Turntable 360° Rotation Slider Bar */}
      <div className="preview-turntable-bar">
        <Rotate3d size={14} style={{ color: 'var(--accent-secondary)' }} />
        <span className="turntable-label">Turn</span>
        <button
          type="button"
          className="turntable-step-btn"
          onClick={() => {
            setYaw((prev) => (prev - 45 + 360) % 360);
            setViewAnglePreset('custom');
          }}
          title="Turn left 45°"
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
          title="Turn the package"
        />
        <button
          type="button"
          className="turntable-step-btn"
          onClick={() => {
            setYaw((prev) => (prev + 45) % 360);
            setViewAnglePreset('custom');
          }}
          title="Turn right 45°"
        >
          +45°
        </button>
        <span className="turntable-degree-badge">{Math.round(yaw)}°</span>
      </div>

      {/* 3. Openness / Lid Extension Slider */}
      {hasOpennessControl && (
        <div className="preview-openness-bar">
          <span className="preview-group-label">{opennessLabel}</span>
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

      <Package3DView
        ref={viewRef}
        dieline={dieline}
        graphics={graphics}
        material={material}
        yaw={yaw}
        pitch={pitch}
        openness={openness}
        cursor={isDragging ? 'grabbing' : 'grab'}
        insetTop={hasOpennessControl ? 180 : 140}
        insetBottom={showSidesStrip ? 175 : 70}
      />

      {/* Hover Face Pill */}
      {hoveredFaceName && (
        <div className="preview-hover-tag">
          <Eye size={12} color="var(--accent-secondary)" />
          <span>{hoveredFaceName}</span>
        </div>
      )}

      {/* 5. All-Sides Scrollable Proof Sheet / Strip */}
      <div className="preview-all-sides-container">
        <div className="preview-sides-header">
          <div className="sides-header-title">
            <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>All faces ({dieline.panels.length})</span>
            <span className="sides-header-hint">Click a face to turn the model to it</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="sides-toggle-btn"
              onClick={() => scrollProofStrip('left')}
              title="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="sides-toggle-btn"
              onClick={() => scrollProofStrip('right')}
              title="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
            <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button
              type="button"
              className="sides-toggle-btn"
              onClick={() => setShowSidesStrip(!showSidesStrip)}
              title={showSidesStrip ? 'Hide the face list' : 'Show the face list'}
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
              const isDropTarget = dragTargetPanelId === panel.id;

              return (
                <div
                  key={panel.id}
                  className={`preview-side-card ${isSelected ? 'active' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                  onClick={() => snapToPanel(panel)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOverPreview(true);
                    setDragTargetPanelId(panel.id);
                  }}
                  onDragLeave={() => {
                    if (dragTargetPanelId === panel.id) {
                      setDragTargetPanelId(null);
                    }
                  }}
                  onDrop={(e) => handleProofCardDrop(e, panel)}
                  title={`Click to rotate 3D view to "${panel.name}", or drop an image directly onto this card`}
                >
                  {/* Miniature 2D SVG Proof of the Face */}
                  <div className="side-card-preview-box">
                    <svg
                      viewBox={`${panel.bounds.x - 4} ${panel.bounds.y - 4} ${panel.bounds.width + 8} ${panel.bounds.height + 8}`}
                      className="side-card-svg"
                    >
                      <defs>
                        <clipPath id={`proof-clip-${panel.id}`}>
                          <polygon points={panel.polygon.map(p => `${p.x},${p.y}`).join(' ')} />
                        </clipPath>
                      </defs>

                      {/* Panel Background Polygon */}
                      <polygon
                        points={panel.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={materialStyles.base}
                        stroke={materialStyles.stroke}
                        strokeWidth={1}
                      />

                      {/* Render Graphics On Panel (Clipped to face polygon) */}
                      <g clipPath={`url(#proof-clip-${panel.id})`}>
                        {panelGraphics.map((g) => {
                          const baseW = panel.bounds.width || 100;
                          const baseH = panel.bounds.height || 100;
                          const nw = g.naturalWidth || 100;
                          const nh = g.naturalHeight || 100;
                          const imgW = g.scaleX !== undefined ? nw * g.scaleX : baseW * 0.7;
                          const imgH = g.scaleY !== undefined ? nh * g.scaleY : baseH * 0.7;

                          const gx = g.x ?? panel.center.x;
                          const gy = g.y ?? panel.center.y;

                          return (
                            <g
                              key={g.id}
                              transform={`translate(${gx}, ${gy}) rotate(${g.angle || 0})`}
                            >
                            {g.type === 'text' && (
                              <SvgTextBlock
                                text={g.text || ''}
                                fill={(!g.fill || g.fill === '#f8fafc' || g.fill === '#ffffff') && material !== 'dark' ? '#1e293b' : g.fill || '#1e293b'}
                                fontSize={g.fontSize || 14}
                                fontFamily={g.fontFamily}
                                fontWeight={g.fontWeight}
                                fontStyle={g.fontStyle}
                                textAlign={g.textAlign}
                                lineHeight={g.lineHeight}
                                wrapWidth={textWrapWidth(g, panel.bounds.width)}
                              />
                            )}

                            {g.type === 'image' && g.src && (
                              <image
                                href={g.src}
                                x={-imgW / 2}
                                y={-imgH / 2}
                                width={imgW}
                                height={imgH}
                                preserveAspectRatio="none"
                              />
                            )}

                            {g.type === 'icon' && g.src && (
                              <image
                                href={g.src}
                                x={-imgW / 2}
                                y={-imgH / 2}
                                width={imgW}
                                height={imgH}
                                preserveAspectRatio="none"
                              />
                            )}

                            {(g.type === 'barcode' || g.type === 'qrcode') && g.src && (
                              <image
                                href={g.src}
                                x={-imgW / 2}
                                y={-imgH / 2}
                                width={imgW}
                                height={imgH}
                                preserveAspectRatio="xMidYMid meet"
                              />
                            )}

                            {g.type === 'barcode' && !g.src && (
                              <rect x={-15} y={-6} width={30} height={12} fill="#000000" opacity={0.8} />
                            )}
                          </g>
                        );
                      })}
                      </g>
                    </svg>
                  </div>

                  <div className="side-card-info">
                    <span className="side-card-name" title={panel.name}>{panel.name}</span>
                    <span className="side-card-dim">
                      {Math.round(panel.bounds.width / CANVAS_UNITS_PER_MM)} × {Math.round(panel.bounds.height / CANVAS_UNITS_PER_MM)} mm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
