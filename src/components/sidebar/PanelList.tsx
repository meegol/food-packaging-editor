import React, { useRef } from 'react';
import { Layers, Crosshair, Type, Image as ImageIcon, Trash2, CheckCircle2, Maximize2 } from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface PanelListProps {
  panels: PanelFace[];
  activePanelId: string | null;
  onSelectPanel: (panelId: string) => void;
  graphics?: GraphicItem[];
  onAddGraphic?: (item: GraphicItem) => void;
  onRemoveGraphic?: (id: string) => void;
  onToggleClip?: (id: string) => void;
}

export const PanelList: React.FC<PanelListProps> = ({
  panels,
  activePanelId,
  onSelectPanel,
  graphics = [],
  onAddGraphic,
  onRemoveGraphic,
  onToggleClip,
}) => {
  const panelFileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadPanelIdRef = useRef<string | null>(null);

  const handleUploadForPanel = (panelId: string) => {
    targetUploadPanelIdRef.current = panelId;
    panelFileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const panelId = targetUploadPanelIdRef.current;
    if (!panelId || !onAddGraphic || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) return;

    const panel = panels.find(p => p.id === panelId);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const newItem: GraphicItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        panelId,
        type: 'image',
        src,
        fileName: file.name,
        clipToPanel: true,
        x: panel?.center.x,
        y: panel?.center.y,
      };

      onAddGraphic(newItem);
      onSelectPanel(panelId);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddTextForPanel = (panel: PanelFace, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddGraphic) return;

    const newItem: GraphicItem = {
      id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      panelId: panel.id,
      type: 'text',
      text: 'BRAND LOGO',
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      fill: '#f8fafc',
      clipToPanel: true,
      x: panel.center.x,
      y: panel.center.y,
    };

    onAddGraphic(newItem);
    onSelectPanel(panel.id);
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} />
          <span>Per-Side Packaging Studio ({panels.length} Faces)</span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click face to design</span>
      </div>

      {/* Hidden file input for per-panel image upload */}
      <input
        ref={panelFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {panels.map((panel) => {
          const isActive = panel.id === activePanelId;
          const w = Math.round(panel.bounds.width / 2.5);
          const h = Math.round(panel.bounds.height / 2.5);
          const panelGraphics = graphics.filter(g => g.panelId === panel.id);

          return (
            <div
              key={panel.id}
              className={`panel-studio-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPanel(panel.id)}
            >
              <div className="panel-studio-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <Crosshair size={13} color={isActive ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                  <span className="panel-studio-title" title={panel.name}>
                    {panel.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span className="panel-studio-dims">{w} × {h} mm</span>
                  {panelGraphics.length > 0 && (
                    <span className="panel-studio-badge">
                      {panelGraphics.length} {panelGraphics.length === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
              </div>

              {/* Per-Side Quick Action Toolset */}
              <div className="panel-studio-actions">
                <button
                  type="button"
                  className="panel-tool-btn"
                  title="Add text to this face"
                  onClick={(e) => handleAddTextForPanel(panel, e)}
                >
                  <Type size={11} color="#a855f7" />
                  <span>+ Text</span>
                </button>

                <button
                  type="button"
                  className="panel-tool-btn"
                  title="Upload image directly to this face"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadForPanel(panel.id);
                  }}
                >
                  <ImageIcon size={11} color="#0ea5e9" />
                  <span>+ Image</span>
                </button>

                <button
                  type="button"
                  className="panel-tool-btn"
                  title="Focus view on this face"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPanel(panel.id);
                  }}
                >
                  <Maximize2 size={11} color="var(--accent-primary)" />
                  <span>Focus</span>
                </button>
              </div>

              {/* Items on this face (expanded when active or has items) */}
              {isActive && panelGraphics.length > 0 && (
                <div className="panel-face-items-list" onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Placed on this Face:
                  </div>
                  {panelGraphics.map((item) => (
                    <div key={item.id} className="panel-face-item-chip">
                      <span className="panel-face-item-name">
                        {item.type === 'text' ? (item.text || 'Text') : (item.fileName || item.type)}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {onToggleClip && (
                          <button
                            type="button"
                            onClick={() => onToggleClip(item.id)}
                            title={item.clipToPanel ? "Polygon clipping active" : "Full bleed"}
                            style={{ background: 'none', border: 'none', padding: '1px', cursor: 'pointer', color: item.clipToPanel ? 'var(--status-success)' : 'var(--text-muted)' }}
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                        {onRemoveGraphic && (
                          <button
                            type="button"
                            onClick={() => onRemoveGraphic(item.id)}
                            title="Delete element"
                            style={{ background: 'none', border: 'none', padding: '1px', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
