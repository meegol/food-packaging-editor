import React, { useEffect, useRef, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Tag, 
  Grid,
  Scissors,
  SplitSquareVertical
} from 'lucide-react';
import { FabricDielineCanvas } from '../../core/canvas/FabricDielineCanvas';
import { DielineResult } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface CanvasViewportProps {
  dieline: DielineResult;
  activePanelId: string | null;
  onSelectPanel: (panelId: string | null) => void;
  focusedPanelId?: string | null;
  graphics: GraphicItem[];
  onGraphicChange?: (items: GraphicItem[]) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  dieline,
  activePanelId,
  onSelectPanel,
  focusedPanelId,
  graphics,
  onGraphicChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FabricDielineCanvas | null>(null);

  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showCreaseLines, setShowCreaseLines] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredPanelName, setHoveredPanelName] = useState<string | null>(null);

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

  return (
    <div className="canvas-viewport-container" ref={containerRef}>
      <canvas ref={canvasRef} />

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

      {hoveredPanelName && (
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
          <span style={{ color: 'var(--text-secondary)' }}>Cut Line (Solid)</span>
        </div>
        <div className="legend-item">
          <div className="legend-line crease" />
          <span style={{ color: 'var(--text-secondary)' }}>Crease / Fold (Dashed)</span>
        </div>
        <div className="legend-item" style={{ color: 'var(--text-muted)' }}>
          <Grid size={12} style={{ display: 'inline', marginRight: '4px' }} />
          <span>Pan: Drag | Zoom: Scroll</span>
        </div>
      </div>
    </div>
  );
};
