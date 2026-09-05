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
import { FabricDielineCanvas } from '../../core/canvas/FabricDielineCanvas';
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

  const [viewMode, setViewMode] = useState<ViewportMode>('flat');
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showCreaseLines, setShowCreaseLines] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredPanelName, setHoveredPanelName] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);
  const [dragHoverPanelName, setDragHoverPanelName] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const engine = new FabricDielineCanvas(canvasRef.current);
    engineRef.current = engine;

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
    if (!engineRef.current) return;
    engineRef.current.renderDieline(dieline);
    engineRef.current.fitToScreen();
  }, [dieline]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setGraphics(graphics);
  }, [graphics]);

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

      const newItem: GraphicItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        panelId: targetPanel.id,
        type: 'image',
        src,
        fileName: file.name,
        x: pt?.x ?? targetPanel.center.x,
        y: pt?.y ?? targetPanel.center.y,
        clipToPanel: true,
      };

      onAddGraphic(newItem);
      onSelectPanel(targetPanel.id);
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
      fill: '#f8fafc',
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

      const newItem: GraphicItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        panelId: activePanel.id,
        type: 'image',
        src,
        fileName: file.name,
        x: activePanel.center.x,
        y: activePanel.center.y,
        clipToPanel: true,
      };
      onAddGraphic(newItem);
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
          title="2D Flat Dieline Net (with Crease/Cut Lines and Face Studio)"
        >
          <Grid size={13} />
          <span>Flat Net</span>
        </button>
        <button
          type="button"
          className={`view-mode-tab ${viewMode === 'assembled' ? 'active' : ''}`}
          onClick={() => setViewMode('assembled')}
          title="Photorealistic 2D Assembled Packaging Preview"
        >
          <Box size={13} />
          <span>2D Assembled</span>
        </button>
        <button
          type="button"
          className={`view-mode-tab ${viewMode === 'split' ? 'active' : ''}`}
          onClick={() => setViewMode('split')}
          title="Side-by-Side Split View (Flat Net + Live Assembled Mockup)"
        >
          <Columns size={13} />
          <span>Split View</span>
        </button>
      </div>

      {/* Main Viewport Content Splitter */}
      <div className={`viewport-panes-wrapper mode-${viewMode}`}>
        {/* Flat Dieline Net Pane */}
        <div
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
              title="Zoom Out"
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
              title="Zoom In"
              onClick={() => engineRef.current?.zoomIn()}
            >
              <ZoomIn size={16} />
            </button>

            <button
              className="toolbar-btn"
              title="Fit to Screen"
              onClick={() => engineRef.current?.fitToScreen()}
            >
              <Maximize2 size={16} />
            </button>

            <div className="toolbar-divider" />

            <button
              className={`toolbar-btn ${showCutLines ? 'active' : ''}`}
              title="Toggle Cut Lines (Red)"
              onClick={() => setShowCutLines(!showCutLines)}
            >
              <Scissors size={16} />
            </button>

            <button
              className={`toolbar-btn ${showCreaseLines ? 'active' : ''}`}
              title="Toggle Crease / Fold Lines (Green)"
              onClick={() => setShowCreaseLines(!showCreaseLines)}
            >
              <SplitSquareVertical size={16} />
            </button>

            <button
              className={`toolbar-btn ${showLabels ? 'active' : ''}`}
              title="Toggle Face Labels"
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
                  title="Upload image onto this face"
                  onClick={() => canvasFileInputRef.current?.click()}
                >
                  <ImageIcon size={13} color="#0ea5e9" />
                  <span>+ Image</span>
                </button>

                <button
                  type="button"
                  className="active-face-btn"
                  title="Zoom focus directly to this face"
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
                Automatically clips to target face polygon
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
              <span style={{ color: 'var(--text-secondary)' }}>Cut Line</span>
            </div>
            <div className="legend-item">
              <div className="legend-line crease" />
              <span style={{ color: 'var(--text-secondary)' }}>Crease</span>
            </div>
            <div className="legend-item" style={{ color: 'var(--text-muted)' }}>
              <Grid size={12} style={{ display: 'inline', marginRight: '4px' }} />
              <span>Pan: Drag | Zoom: Scroll</span>
            </div>
          </div>
        </div>

        {/* 2D Assembled Packaging Preview Pane */}
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
          />
        </div>
      </div>
    </div>
  );
};
