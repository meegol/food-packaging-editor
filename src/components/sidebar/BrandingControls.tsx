import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface BrandingControlsProps {
  panels: PanelFace[];
  activePanelId: string | null;
  graphics: GraphicItem[];
  onAddGraphic: (item: GraphicItem) => void;
  onRemoveGraphic: (id: string) => void;
  onToggleClip: (id: string) => void;
  onSelectPanel: (panelId: string) => void;
}

export const BrandingControls: React.FC<BrandingControlsProps> = ({
  panels,
  activePanelId,
  graphics,
  onAddGraphic,
  onRemoveGraphic,
  onToggleClip,
  onSelectPanel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clipOption, setClipOption] = useState<boolean>(true);

  // If no panel is actively selected, default to the first panel (typically Base or Front)
  const effectivePanelId = activePanelId || (panels[0]?.id ?? '');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;

      const newItem: GraphicItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        panelId: effectivePanelId,
        type: 'image',
        src,
        fileName: file.name,
        clipToPanel: clipOption,
      };

      onAddGraphic(newItem);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ImageIcon size={13} />
          <span>Branding & Artwork</span>
        </div>
      </div>

      {/* Target Panel Selector */}
      <div style={{
        backgroundColor: 'var(--bg-app)',
        padding: '10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Target Packaging Face:
        </div>
        <select
          value={effectivePanelId}
          onChange={(e) => onSelectPanel(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {panels.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
          backgroundColor: isDragging ? 'var(--bg-surface-hover)' : 'var(--bg-app)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          marginBottom: '12px',
        }}
      >
        <UploadCloud size={24} style={{ margin: '0 auto 8px', color: 'var(--accent-secondary)' }} />
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Drop image or click to upload
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          PNG, JPG, WebP, or SVG logo
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Panel Clipping Setting */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px',
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="var(--accent-secondary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Auto-Clip to Face Polygon</span>
        </div>
        <input
          type="checkbox"
          checked={clipOption}
          onChange={(e) => setClipOption(e.target.checked)}
          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        />
      </div>

      {/* Placed Graphics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
          Placed Artwork ({graphics.length})
        </div>

        {graphics.length === 0 ? (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
          }}>
            No graphics placed yet. Upload an image to start branding.
          </div>
        ) : (
          graphics.map((item) => {
            const panel = panels.find(p => p.id === item.panelId);
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <img
                    src={item.src}
                    alt={item.fileName}
                    style={{
                      width: '28px',
                      height: '28px',
                      objectFit: 'cover',
                      borderRadius: '3px',
                      border: '1px solid var(--border-medium)',
                    }}
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      maxWidth: '130px',
                    }}>
                      {item.fileName}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      On: {panel ? panel.name : item.panelId}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => onToggleClip(item.id)}
                    title={item.clipToPanel ? "Clipping enabled (click to disable)" : "Clipping disabled (click to enable)"}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: item.clipToPanel ? 'var(--status-success)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                  </button>

                  <button
                    onClick={() => onRemoveGraphic(item.id)}
                    title="Remove graphic"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
