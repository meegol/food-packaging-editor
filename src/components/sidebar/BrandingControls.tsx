import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Type,
  ShieldCheck,
  QrCode,
  Trash2,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Barcode as BarcodeIcon,
} from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';
import { TextControls } from './TextControls';
import { ComplianceIconControls } from './ComplianceIconControls';
import { BarcodeControls } from './BarcodeControls';

interface BrandingControlsProps {
  panels: PanelFace[];
  activePanelId: string | null;
  graphics: GraphicItem[];
  onAddGraphic: (item: GraphicItem) => void;
  onRemoveGraphic: (id: string) => void;
  onToggleClip: (id: string) => void;
  onReorderGraphic?: (id: string, direction: 'up' | 'down') => void;
  onSelectPanel: (panelId: string) => void;
}

type BrandingSubTab = 'images' | 'text' | 'icons' | 'codes';

export const BrandingControls: React.FC<BrandingControlsProps> = ({
  panels,
  activePanelId,
  graphics,
  onAddGraphic,
  onRemoveGraphic,
  onToggleClip,
  onReorderGraphic,
  onSelectPanel,
}) => {
  const [subTab, setSubTab] = useState<BrandingSubTab>('images');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clipOption, setClipOption] = useState<boolean>(true);

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

  const renderItemTypeIcon = (type: GraphicItem['type']) => {
    switch (type) {
      case 'text':
        return <Type size={14} color="#a855f7" />;
      case 'icon':
        return <ShieldCheck size={14} color="#10b981" />;
      case 'barcode':
        return <BarcodeIcon size={14} color="#38bdf8" />;
      case 'qrcode':
        return <QrCode size={14} color="#f59e0b" />;
      case 'image':
      default:
        return <ImageIcon size={14} color="#0ea5e9" />;
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ImageIcon size={13} />
          <span>Branding & Graphic Suite</span>
        </div>
      </div>

      {/* Branding Sub-Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        backgroundColor: 'var(--bg-app)',
        padding: '3px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '12px',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          type="button"
          onClick={() => setSubTab('images')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '5px 2px',
            fontSize: '9px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: subTab === 'images' ? 'var(--accent-primary)' : 'transparent',
            color: subTab === 'images' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <ImageIcon size={12} />
          Images
        </button>

        <button
          type="button"
          onClick={() => setSubTab('text')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '5px 2px',
            fontSize: '9px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: subTab === 'text' ? 'var(--accent-primary)' : 'transparent',
            color: subTab === 'text' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <Type size={12} />
          Text
        </button>

        <button
          type="button"
          onClick={() => setSubTab('icons')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '5px 2px',
            fontSize: '9px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: subTab === 'icons' ? 'var(--accent-primary)' : 'transparent',
            color: subTab === 'icons' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <ShieldCheck size={12} />
          Icons
        </button>

        <button
          type="button"
          onClick={() => setSubTab('codes')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '5px 2px',
            fontSize: '9px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: subTab === 'codes' ? 'var(--accent-primary)' : 'transparent',
            color: subTab === 'codes' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <QrCode size={12} />
          Codes
        </button>
      </div>

      {/* Tab 1: Image & Logo Upload */}
      {subTab === 'images' && (
        <div>
          {/* Target Face Selector */}
          <div style={{
            backgroundColor: 'var(--bg-app)',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '10px'
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
              padding: '16px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '10px',
            }}
          >
            <UploadCloud size={22} style={{ margin: '0 auto 6px', color: 'var(--accent-secondary)' }} />
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

          {/* Auto-Clip Setting */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '12px',
            fontSize: '11px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={13} color="var(--accent-secondary)" />
              <span style={{ color: 'var(--text-secondary)' }}>Auto-Clip to Face Polygon</span>
            </div>
            <input
              type="checkbox"
              checked={clipOption}
              onChange={(e) => setClipOption(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Typography Engine */}
      {subTab === 'text' && (
        <TextControls
          panels={panels}
          activePanelId={activePanelId}
          onAddGraphic={onAddGraphic}
          onSelectPanel={onSelectPanel}
        />
      )}

      {/* Tab 3: Food Compliance Icons */}
      {subTab === 'icons' && (
        <ComplianceIconControls
          panels={panels}
          activePanelId={activePanelId}
          onAddGraphic={onAddGraphic}
          onSelectPanel={onSelectPanel}
        />
      )}

      {/* Tab 4: Barcodes & QR Codes */}
      {subTab === 'codes' && (
        <BarcodeControls
          panels={panels}
          activePanelId={activePanelId}
          onAddGraphic={onAddGraphic}
          onSelectPanel={onSelectPanel}
        />
      )}

      {/* Unified Placed Artwork & Layer Stack */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Placed Elements Layer Stack ({graphics.length})
          </div>
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
            No graphic or text elements placed on net.
          </div>
        ) : (
          graphics.map((item, index) => {
            const panel = panels.find(p => p.id === item.panelId);
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '3px',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.src && item.type !== 'text' ? (
                      <img
                        src={item.src}
                        alt="thumb"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '2px' }}
                      />
                    ) : (
                      renderItemTypeIcon(item.type)
                    )}
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      maxWidth: '110px',
                    }}>
                      {item.type === 'text' ? item.text : (item.fileName || item.type)}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {panel ? panel.name : item.panelId}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                  {/* Layer Reorder */}
                  {onReorderGraphic && (
                    <>
                      <button
                        type="button"
                        onClick={() => onReorderGraphic(item.id, 'up')}
                        disabled={index === graphics.length - 1}
                        title="Bring Forward"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: index === graphics.length - 1 ? 'var(--border-medium)' : 'var(--text-muted)',
                          cursor: index === graphics.length - 1 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderGraphic(item.id, 'down')}
                        disabled={index === 0}
                        title="Send Backward"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: index === 0 ? 'var(--border-medium)' : 'var(--text-muted)',
                          cursor: index === 0 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                      >
                        <ChevronDown size={13} />
                      </button>
                    </>
                  )}

                  {/* Toggle Clip */}
                  <button
                    type="button"
                    onClick={() => onToggleClip(item.id)}
                    title={item.clipToPanel ? "Polygon clipping active" : "Clipping disabled"}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: item.clipToPanel ? 'var(--status-success)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                  </button>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => onRemoveGraphic(item.id)}
                    title="Delete item"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
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
