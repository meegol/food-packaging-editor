import React, { useState } from 'react';
import { ShieldCheck, Plus, Check } from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface ComplianceIconControlsProps {
  panels: PanelFace[];
  activePanelId: string | null;
  onAddGraphic: (item: GraphicItem) => void;
  onSelectPanel: (panelId: string) => void;
}

interface CompliancePreset {
  id: string;
  name: string;
  category: 'recycling' | 'handling' | 'certification';
  svgString: string;
}

// Crisp inline SVGs with standard 64x64 viewBox for crisp vector scaling
const PRESETS: CompliancePreset[] = [
  // Recycling & Material Codes
  {
    id: 'recycle-mobius',
    name: 'Universal Recycle',
    category: 'recycling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 6 L38 16 L26 16 Z" fill="#10b981"/>
      <path d="M32 14 C44 14 52 24 52 36 L56 36 L48 48 L40 36 L44 36 C44 28 38 20 30 20"/>
      <path d="M50 42 C44 52 34 56 22 54 L20 58 L14 46 L26 44 L24 48 C32 50 40 47 44 40"/>
      <path d="M16 46 C12 36 14 24 22 16 L18 14 L30 12 L30 24 L26 21 C20 27 18 36 21 44"/>
    </svg>`,
  },
  {
    id: 'recycle-pap20',
    name: 'PAP 20 (Corrugated)',
    category: 'recycling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <polygon points="32,8 54,46 10,46" stroke="#10b981" stroke-width="3" stroke-linejoin="round"/>
      <text x="32" y="34" fill="#f8fafc" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">20</text>
      <text x="32" y="58" fill="#10b981" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">PAP</text>
    </svg>`,
  },
  {
    id: 'recycle-pp05',
    name: 'PP 05 (Food Safe)',
    category: 'recycling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <polygon points="32,8 54,46 10,46" stroke="#10b981" stroke-width="3" stroke-linejoin="round"/>
      <text x="32" y="34" fill="#f8fafc" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">05</text>
      <text x="32" y="58" fill="#10b981" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">PP</text>
    </svg>`,
  },
  {
    id: 'recycle-pet01',
    name: 'PET 01',
    category: 'recycling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <polygon points="32,8 54,46 10,46" stroke="#10b981" stroke-width="3" stroke-linejoin="round"/>
      <text x="32" y="34" fill="#f8fafc" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">01</text>
      <text x="32" y="58" fill="#10b981" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">PET</text>
    </svg>`,
  },

  // Handling & Storage Instructions
  {
    id: 'handling-keep-frozen',
    name: 'Keep Frozen',
    category: 'handling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round">
      <circle cx="32" cy="32" r="28" stroke="#38bdf8" stroke-width="2"/>
      <line x1="32" y1="12" x2="32" y2="52"/>
      <line x1="12" y1="32" x2="52" y2="32"/>
      <line x1="18" y1="18" x2="46" y2="46"/>
      <line x1="18" y1="46" x2="46" y2="18"/>
      <circle cx="32" cy="32" r="3" fill="#38bdf8"/>
    </svg>`,
  },
  {
    id: 'handling-microwave-safe',
    name: 'Microwave Safe',
    category: 'handling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="14" width="48" height="36" rx="4" stroke="#94a3b8"/>
      <path d="M18 26 C20 22, 22 22, 24 26 C26 30, 28 30, 30 26 C32 22, 34 22, 36 26" stroke="#f59e0b"/>
      <path d="M18 36 C20 32, 22 32, 24 36 C26 40, 28 40, 30 36 C32 32, 34 32, 36 36" stroke="#f59e0b"/>
      <line x1="46" y1="20" x2="46" y2="44" stroke="#64748b"/>
    </svg>`,
  },
  {
    id: 'handling-keep-upright',
    name: 'Keep Upright',
    category: 'handling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#f8fafc" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="22" y1="46" x2="22" y2="16"/>
      <polyline points="14,24 22,16 30,24"/>
      <line x1="42" y1="46" x2="42" y2="16"/>
      <polyline points="34,24 42,16 50,24"/>
      <line x1="10" y1="52" x2="54" y2="52" stroke="#f59e0b" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'handling-keep-dry',
    name: 'Keep Dry',
    category: 'handling',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 36 C12 22 20 14 32 14 C44 14 52 22 52 36 Z" stroke="#f8fafc" fill="rgba(255,255,255,0.05)"/>
      <line x1="32" y1="14" x2="32" y2="48"/>
      <path d="M32 48 C32 52 28 54 26 52"/>
      <line x1="20" y1="8" x2="22" y2="12" stroke="#38bdf8"/>
      <line x1="32" y1="6" x2="32" y2="10" stroke="#38bdf8"/>
      <line x1="44" y1="8" x2="42" y2="12" stroke="#38bdf8"/>
    </svg>`,
  },

  // Dietary & Certification Seals
  {
    id: 'cert-vegan',
    name: '100% Vegan',
    category: 'certification',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="#10b981" stroke-width="2.5"/>
      <path d="M32 46 C32 30 20 22 18 20 C24 30 28 40 32 46 Z" fill="#10b981"/>
      <path d="M32 46 C32 26 46 16 48 14 C42 26 36 38 32 46 Z" fill="#10b981"/>
      <text x="32" y="58" fill="#10b981" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">VEGAN</text>
    </svg>`,
  },
  {
    id: 'cert-halal',
    name: 'Halal Certified',
    category: 'certification',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="#10b981" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="24" stroke="#10b981" stroke-width="1" stroke-dasharray="3 2"/>
      <text x="32" y="32" fill="#f8fafc" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">HALAL</text>
      <text x="32" y="44" fill="#10b981" font-size="7" font-family="sans-serif" font-weight="600" text-anchor="middle">حلال</text>
    </svg>`,
  },
  {
    id: 'cert-gluten-free',
    name: 'Gluten Free',
    category: 'certification',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="#f59e0b" stroke-width="2.5"/>
      <line x1="16" y1="16" x2="48" y2="48" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
      <text x="32" y="28" fill="#f8fafc" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">GLUTEN</text>
      <text x="32" y="40" fill="#f59e0b" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">FREE</text>
    </svg>`,
  },
  {
    id: 'cert-kosher',
    name: 'Kosher Pareve',
    category: 'certification',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="18" stroke="#f8fafc" stroke-width="2"/>
      <text x="32" y="37" fill="#f8fafc" font-size="15" font-family="serif" font-weight="bold" text-anchor="middle">U</text>
      <text x="32" y="58" fill="#38bdf8" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">PAREVE</text>
    </svg>`,
  },
];

export const ComplianceIconControls: React.FC<ComplianceIconControlsProps> = ({
  panels,
  activePanelId,
  onAddGraphic,
  onSelectPanel,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'recycling' | 'handling' | 'certification'>('all');
  const [clipToPanel, setClipToPanel] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  const effectivePanelId = activePanelId || (panels[0]?.id ?? '');

  const filteredPresets = activeCategory === 'all'
    ? PRESETS
    : PRESETS.filter(p => p.category === activeCategory);

  const handleAddIcon = (preset: CompliancePreset) => {
    // Convert inline SVG to Base64 data URL
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preset.svgString)}`;

    const targetPanel = panels.find(p => p.id === effectivePanelId);
    const newItem: GraphicItem = {
      id: `icon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      panelId: effectivePanelId,
      type: 'icon',
      src: encoded,
      fileName: preset.name,
      clipToPanel,
      x: targetPanel?.center.x,
      y: targetPanel?.center.y,
    };

    onAddGraphic(newItem);
    setAddedId(preset.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Target Face Selector */}
      <div style={{
        backgroundColor: 'var(--bg-app)',
        padding: '10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
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

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {(['all', 'recycling', 'handling', 'certification'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'capitalize',
              borderRadius: 'var(--radius-sm)',
              border: activeCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              backgroundColor: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: activeCategory === cat ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        maxHeight: '260px',
        overflowY: 'auto',
        paddingRight: '2px'
      }}>
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => handleAddIcon(preset)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 6px',
              backgroundColor: 'var(--bg-surface)',
              border: addedId === preset.id ? '1px solid var(--status-success)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (addedId !== preset.id) e.currentTarget.style.borderColor = 'var(--border-focus)';
            }}
            onMouseLeave={(e) => {
              if (addedId !== preset.id) e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div
              style={{ width: '40px', height: '40px', marginBottom: '6px' }}
              dangerouslySetInnerHTML={{ __html: preset.svgString }}
            />
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100px'
            }}>
              {preset.name}
            </div>
            <div style={{ fontSize: '9px', color: addedId === preset.id ? 'var(--status-success)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              {addedId === preset.id ? (
                <>
                  <Check size={10} /> Placed
                </>
              ) : (
                <>
                  <Plus size={10} /> Add to Face
                </>
              )}
            </div>
          </div>
        ))}
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
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={13} color="var(--accent-secondary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Auto-Clip to Face Polygon</span>
        </div>
        <input
          type="checkbox"
          checked={clipToPanel}
          onChange={(e) => setClipToPanel(e.target.checked)}
          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};
