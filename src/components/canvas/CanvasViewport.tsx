import React, { useEffect, useRef, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Tag, 
  Grid, 
  Scissors, 
  SplitSquareVertical,
  Type,
  Image as ImageIcon,
  Crosshair,
  X,
  UploadCloud,
  Box,
  Columns
} from 'lucide-react';
import { cache as fabricCache } from 'fabric';
import { FabricDielineCanvas } from '../../core/canvas/FabricDielineCanvas';
import { fontSpecs } from '../../core/canvas/graphicObjects';
import { DielineResult } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';
import { AssembledPreview } from '../preview/AssembledPreview';

export type ViewportMode = 'flat' | 'assembled' | 'split';

interface CanvasViewportProps {
  dieline: DielineResult;
  activePanelId: string | null;
  onSelectPanel: (panelId: string | null) => void;
  focusedPanelId?: string | null;
  graphics: GraphicItem[];
  onGraphicChange?: (items: GraphicItem[]) => void;
  onAddGraphic?: (item: GraphicItem) => void;
  themeId?: string;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  dieline,
  activePanelId,
  onSelectPanel,
  focusedPanelId,
  graphics,
  onGraphicChange,
  onAddGraphic,
  themeId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FabricDielineCanvas | null>(null);
  const canvasFileInputRef = useRef<HTMLInputElement>(null);
  const loadedFontsRef = useRef<Set<string>>(new Set());
  const lastDielineRef = useRef<DielineResult | null>(null);

  const [viewMode, setViewMode] = useState<ViewportMode>('flat');
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showCreaseLines, setShowCreaseLines] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredPanelName, setHoveredPanelName] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);
  const flatPaneRef = useRef<HTMLDivElement>(null);
  const [dragHoverPanelName, setDragHoverPanelName] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const engine = new FabricDielineCanvas(canvasRef.current);
    engineRef.current = engine;
    if ((import.meta as any).env?.DEV) {
      (window as any).__DIELINE_ENGINE__ = engine;
    }

    engine.setCallbacks({
      onSelectPanel: (id) => onSelectPanel(id),
      onHoverPanel: (id) => {
        if (!id) {
          setHoveredPanelName(null);
        } else {
          const p = dieline.panels.find(panel => panel.id === id);
          setHoveredPanelName(p ? p.name : null);
        }
      },
      onZoomChange: (z) => setZoomPercent(z),
      onViewportChange: (vpt) => {
        // Cutting-mat grid: 10 mm minor squares, 50 mm major, tracking zoom and pan.
        // Written straight to CSS variables so panning never re-renders React.
        const pane = flatPaneRef.current;
        if (!pane) return;
        const unitsPerMm = 2.5;
        const major = 50 * unitsPerMm * vpt[0];
        const minor = 10 * unitsPerMm * vpt[0];
        pane.style.setProperty('--mat-major', `${major}px`);
        pane.style.setProperty('--mat-minor', `${minor >= 6 ? minor : major}px`);
        pane.style.setProperty('--mat-x', `${vpt[4]}px`);
        pane.style.setProperty('--mat-y', `${vpt[5]}px`);
      },
    });

    engine.setOnGraphicChange((items) => {
      if (onGraphicChange) {
        onGraphicChange(items);
      }
    });

    const updateSize = () => {
      if (!containerRef.current || !engineRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      engineRef.current.resize(width, height);
      engineRef.current.fitToScreen();
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !engineRef.current) return;
      engineRef.current.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.update(dieline, graphics);
    if (lastDielineRef.current !== dieline) {
      lastDielineRef.current = dieline;
      engine.fitToScreen();
    }

    const pending = fontSpecs(graphics).filter(spec => !loadedFontsRef.current.has(spec));
    if (pending.length === 0 || !document.fonts) return;

    let cancelled = false;
    Promise.all(pending.map(spec => document.fonts.load(spec).catch(() => []))).then(() => {
      pending.forEach(spec => loadedFontsRef.current.add(spec));
      if (cancelled || !engineRef.current) return;
      fabricCache.clearFontCache();
      engineRef.current.setGraphics(graphics);
    });
    return () => {
      cancelled = true;
    };
  }, [dieline, graphics]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setOptions({
      showCutLines,
      showCreaseLines,
      showLabels,
    });
  }, [showCutLines, showCreaseLines, showLabels]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.selectPanel(activePanelId);
  }, [activePanelId]);

  useEffect(() => {
    if (!engineRef.current || !focusedPanelId) return;
    engineRef.current.focusPanel(focusedPanelId);
  }, [focusedPanelId]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.updateTheme();
  }, [themeId]);

  // Active panel face details
  const activePanel = activePanelId ? dieline.panels.find(p => p.id === activePanelId) : null;

  // Direct canvas drag-and-drop handler
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(true);
    if (engineRef.current) {
      const panel = engineRef.current.findPanelAt(e.clientX, e.clientY);
      setDragHoverPanelName(panel ? panel.name : null);
    }
  };

  const handleCanvasDragLeave = () => {
    setIsDragOverCanvas(false);
    setDragHoverPanelName(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    setDragHoverPanelName(null);

    if (!e.dataTransfer.files || !e.dataTransfer.files[0] || !onAddGraphic) return;
    const file = e.dataTransfer.files[0];
    if (!file.type.startsWith('image/')) return;

    // Find panel under cursor
    let targetPanel = engineRef.current?.findPanelAt(e.clientX, e.clientY);
    if (!targetPanel && activePanelId) {
      targetPanel = dieline.panels.find(p => p.id === activePanelId);
    }
    if (!targetPanel) {
      targetPanel = dieline.panels[0];
    }
    if (!targetPanel) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const pt = engineRef.current?.getCanvasPoint(e.clientX, e.clientY);

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
          x: pt?.x ?? targetPanel.center.x,
          y: pt?.y ?? targetPanel.center.y,
          scaleX: scaleFit,
          scaleY: scaleFit,
          naturalWidth: nw,
          naturalHeight: nh,
          width: nw * scaleFit,
          height: nh * scaleFit,
          clipToPanel: true,
        };

        onAddGraphic(newItem);
        onSelectPanel(targetPanel.id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAddText = () => {
    if (!activePanel || !onAddGraphic) return;
    const newItem: GraphicItem = {
      id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      panelId: activePanel.id,
      type: 'text',
      text: 'BRAND LOGO',
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      fill: '#1e293b',
      clipToPanel: true,
      x: activePanel.center.x,
      y: activePanel.center.y,
    };
    onAddGraphic(newItem);
  };

  const handleFilePickedForActivePanel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activePanel || !onAddGraphic) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || 200;
        const nh = img.naturalHeight || 200;
        const pw = activePanel.bounds.width;
        const ph = activePanel.bounds.height;
        const fitRatio = 0.70;
        const scaleFit = Math.min((pw * fitRatio) / nw, (ph * fitRatio) / nh);

        const newItem: GraphicItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          panelId: activePanel.id,
          type: 'image',
          src,
          fileName: file.name,
          x: activePanel.center.x,
          y: activePanel.center.y,
          scaleX: scaleFit,
          scaleY: scaleFit,
          naturalWidth: nw,
          naturalHeight: nh,
          width: nw * scaleFit,
          height: nh * scaleFit,
          clipToPanel: true,
        };
        onAddGraphic(newItem);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Re-fit canvas when view mode changes
  useEffect(() => {
    if (viewMode !== 'assembled' && engineRef.current && containerRef.current) {
      const timer = setTimeout(() => {
        if (!containerRef.current || !engineRef.current) return;
        const flatPane = containerRef.current.querySelector('.flat-canvas-pane') as HTMLElement;
        if (flatPane) {
          engineRef.current.resize(flatPane.clientWidth, flatPane.clientHeight);
          engineRef.current.fitToScreen();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  return (
    <div 
      className="canvas-viewport-container" 
      ref={containerRef}
    >
      {/* Top Center View Mode Switcher */}
      <div className="viewport-view-mode-tabs">
        <button
          type="button"
          className={`view-mode-tab ${viewMode === 'flat' ? 'active' : ''}`}
          onClick={() => setViewMode('flat')}
          title="The flat, unfolded net with cut and crease lines"
        >
          <Grid size={13} />
          <span>Flat net</span>
        </button>
        <button
          type="button"
          className={`view-mode-tab ${viewMode === 'assembled' ? 'active' : ''}`}
          onClick={() => setViewMode('assembled')}
          title="The package folded up, in 3D"
        >
          <Box size={13} />
          <span>3D assembled</span>
        </button>
        <button
          type="button"
          className={`view-mode-tab split-view-tab ${viewMode === 'split' ? 'active' : ''}`}
          onClick={() => setViewMode('split')}
          title="Flat net and 3D side by side"
        >
          <Columns size={13} />
          <span>Split view</span>
        </button>
      </div>

      {/* Main Viewport Content Splitter */}
      <div className={`viewport-panes-wrapper mode-${viewMode}`}>
        {/* Flat Dieline Net Pane */}
        <div
          ref={flatPaneRef}
          className="flat-canvas-pane"
          style={{
            display: viewMode === 'assembled' ? 'none' : 'flex',
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            width: viewMode === 'split' ? '50%' : '100%',
            height: '100%',
          }}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          <canvas ref={canvasRef} />

          {/* Hidden file input for quick adding image to active face */}
          <input
            ref={canvasFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleFilePickedForActivePanel}
          />

          {/* Floating Toolbar */}
          <div className="canvas-floating-toolbar">
            <button
              className="toolbar-btn"
              title="Zoom out"
              onClick={() => engineRef.current?.zoomOut()}
            >
              <ZoomOut size={16} />
            </button>

            <span style={{ 
              fontSize: '11px', 
              fontFamily: 'JetBrains Mono, monospace', 
              color: 'var(--text-primary)',
              minWidth: '40px',
              textAlign: 'center',
              userSelect: 'none'
            }}>
              {zoomPercent}%
            </span>

            <button
              className="toolbar-btn"
              title="Zoom in"
              onClick={() => engineRef.current?.zoomIn()}
            >
              <ZoomIn size={16} />
            </button>

            <button
              className="toolbar-btn"
              title="Fit to screen"
              onClick={() => engineRef.current?.fitToScreen()}
            >
              <Maximize2 size={16} />
            </button>

            <div className="toolbar-divider" />

            <button
              className={`toolbar-btn ${showCutLines ? 'active' : ''}`}
              title="Show cut lines"
              onClick={() => setShowCutLines(!showCutLines)}
            >
              <Scissors size={16} />
            </button>

            <button
              className={`toolbar-btn ${showCreaseLines ? 'active' : ''}`}
              title="Show crease lines"
              onClick={() => setShowCreaseLines(!showCreaseLines)}
            >
              <SplitSquareVertical size={16} />
            </button>

            <button
              className={`toolbar-btn ${showLabels ? 'active' : ''}`}
              title="Show face names"
              onClick={() => setShowLabels(!showLabels)}
            >
              <Tag size={16} />
            </button>
          </div>

          {/* Per-Side Active Face Action Bar */}
          {activePanel && (
            <div className="active-face-action-bar">
              <div className="active-face-pill-tag">
                <Crosshair size={13} color="var(--accent-secondary)" />
                <span className="active-face-name">{activePanel.name}</span>
                <span className="active-face-dims">
                  {Math.round(activePanel.bounds.width / 2.5)} × {Math.round(activePanel.bounds.height / 2.5)} mm
                </span>
              </div>

              <div className="active-face-buttons">
                <button
                  type="button"
                  className="active-face-btn"
                  title="Add text to this face"
                  onClick={handleQuickAddText}
                >
                  <Type size={13} color="#a855f7" />
                  <span>+ Text</span>
                </button>

                <button
                  type="button"
                  className="active-face-btn"
                  title="Upload an image to this face"
                  onClick={() => canvasFileInputRef.current?.click()}
                >
                  <ImageIcon size={13} color="#0ea5e9" />
                  <span>+ Image</span>
                </button>

                <button
                  type="button"
                  className="active-face-btn"
                  title="Zoom to this face"
                  onClick={() => engineRef.current?.focusPanel(activePanel.id)}
                >
                  <Maximize2 size={13} color="var(--accent-primary)" />
                  <span>Focus</span>
                </button>

                <button
                  type="button"
                  className="active-face-btn-close"
                  title="Deselect face"
                  onClick={() => onSelectPanel(null)}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Drag Over Overlay / Notification */}
          {isDragOverCanvas && (
            <div className="canvas-drag-overlay">
              <UploadCloud size={28} color="var(--accent-secondary)" />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {dragHoverPanelName ? `Drop to place on: ${dragHoverPanelName}` : 'Drop image onto packaging face'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                It will be kept inside the face edges
              </div>
            </div>
          )}

          {hoveredPanelName && !isDragOverCanvas && !activePanel && (
            <div style={{
              position: 'absolute',
              top: '68px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#f8fafc',
              pointerEvents: 'none',
              zIndex: 4,
            }}>
              Hovering: {hoveredPanelName}
            </div>
          )}

          <div className="dieline-legend">
            <div className="legend-item">
              <div className="legend-line cut" />
              <span style={{ color: 'var(--text-secondary)' }}>Cut</span>
            </div>
            <div className="legend-item">
              <div className="legend-line crease" />
              <span style={{ color: 'var(--text-secondary)' }}>Crease</span>
            </div>
            <div className="legend-item" style={{ color: 'var(--text-muted)' }}>
              <Grid size={12} style={{ display: 'inline', marginRight: '4px' }} />
              <span>Drag to move, scroll to zoom</span>
            </div>
          </div>
        </div>

        {/* 3D Assembled Packaging Preview Pane */}
        <div
          className="assembled-preview-pane"
          style={{
            display: viewMode === 'flat' ? 'none' : 'flex',
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            width: viewMode === 'split' ? '50%' : '100%',
            height: '100%',
            borderLeft: viewMode === 'split' ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <AssembledPreview
            dieline={dieline}
            graphics={graphics}
            themeId={themeId}
            onAddGraphic={onAddGraphic}
            onSelectPanel={(pid) => onSelectPanel(pid)}
            activePanelId={activePanelId}
          />
        </div>
      </div>
    </div>
  );
};
