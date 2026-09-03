import React, { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, PlusCircle, Sparkles } from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface TextControlsProps {
  panels: PanelFace[];
  activePanelId: string | null;
  onAddGraphic: (item: GraphicItem) => void;
  onSelectPanel: (panelId: string) => void;
}

const FONT_OPTIONS = [
  { label: 'Inter (Modern Sans)', value: 'Inter, sans-serif' },
  { label: 'Roboto (Clean)', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display (Gourmet Serif)', value: '"Playfair Display", Georgia, serif' },
  { label: 'Montserrat (Geometric Display)', value: 'Montserrat, sans-serif' },
  { label: 'Courier Prime (Batch & Spec)', value: '"Courier Prime", monospace' },
  { label: 'Oswald (Bold Packaging)', value: 'Oswald, sans-serif' },
];

const QUICK_TEMPLATES = [
  { title: 'Brand Title', text: 'GOURMET BURGER CO.', size: 22, weight: '700', align: 'center' },
  { title: 'Net Weight', text: 'NET WT. 350g (12.3 OZ)', size: 12, weight: '600', align: 'center' },
  { title: 'Ingredients', text: 'Ingredients: Wheat flour, filtered water, sea salt, yeast, organic olive oil.', size: 10, weight: '400', align: 'left' },
  { title: 'Storage Note', text: 'STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT', size: 9, weight: '600', align: 'center' },
];

const COLOR_PRESETS = [
  { label: 'White', value: '#f8fafc' },
  { label: 'Charcoal', value: '#1e293b' },
  { label: 'Cream', value: '#fef3c7' },
  { label: 'Kraft Warm', value: '#d97706' },
  { label: 'Burgundy', value: '#dc2626' },
  { label: 'Forest Green', value: '#16a34a' },
];

export const TextControls: React.FC<TextControlsProps> = ({
  panels,
  activePanelId,
  onAddGraphic,
  onSelectPanel,
}) => {
  const [text, setText] = useState('GOURMET BURGER');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontWeight, setFontWeight] = useState<'400' | '600' | '700'>('700');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [fill, setFill] = useState('#f8fafc');
  const [clipToPanel, setClipToPanel] = useState(true);

  const effectivePanelId = activePanelId || (panels[0]?.id ?? '');

  const handleApplyTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    setText(tmpl.text);
    setFontSize(tmpl.size);
    setFontWeight(tmpl.weight as '400' | '600' | '700');
    setTextAlign(tmpl.align as 'left' | 'center' | 'right');
  };

  const handleAddText = () => {
    if (!text.trim()) return;

    const newItem: GraphicItem = {
      id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      panelId: effectivePanelId,
      type: 'text',
      text: text.trim(),
      fontFamily,
      fontSize,
      fontWeight,
      textAlign,
      fill,
      clipToPanel,
    };

    onAddGraphic(newItem);
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

      {/* Quick Template Badges */}
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '6px'
        }}>
          <Sparkles size={12} color="var(--accent-secondary)" />
          Quick Food Label Templates:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {QUICK_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.title}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Text Area Content */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Label Content:
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px',
            fontSize: '12px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
          placeholder="Enter package text, ingredients, or brand title..."
        />
      </div>

      {/* Font Family & Size */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Typography:
          </div>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              fontSize: '11px',
            }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Size: {fontSize}px
          </div>
          <input
            type="range"
            min={8}
            max={48}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Formatting: Weight, Alignment, Color */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {/* Weight Selector */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
          {(['400', '600', '700'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setFontWeight(w)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: w,
                backgroundColor: fontWeight === w ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: fontWeight === w ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {w === '400' ? 'Reg' : w === '600' ? 'Med' : 'Bold'}
            </button>
          ))}
        </div>

        {/* Alignment */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            style={{
              padding: '4px 8px',
              backgroundColor: textAlign === 'left' ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: textAlign === 'left' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Align Left"
          >
            <AlignLeft size={12} />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            style={{
              padding: '4px 8px',
              backgroundColor: textAlign === 'center' ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: textAlign === 'center' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Align Center"
          >
            <AlignCenter size={12} />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('right')}
            style={{
              padding: '4px 8px',
              backgroundColor: textAlign === 'right' ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: textAlign === 'right' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Align Right"
          >
            <AlignRight size={12} />
          </button>
        </div>

        {/* Color presets dropdown / picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFill(c.value)}
              title={c.label}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: c.value,
                border: fill === c.value ? '2px solid var(--accent-secondary)' : '1px solid var(--border-medium)',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Auto-Clip Toggle */}
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
        <span style={{ color: 'var(--text-secondary)' }}>Auto-Clip to Face Polygon</span>
        <input
          type="checkbox"
          checked={clipToPanel}
          onChange={(e) => setClipToPanel(e.target.checked)}
          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        />
      </div>

      {/* Add Text Action */}
      <button
        type="button"
        onClick={handleAddText}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-primary)')}
      >
        <PlusCircle size={14} />
        Add Text to Packaging Face
      </button>
    </div>
  );
};
