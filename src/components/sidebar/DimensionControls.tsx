import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { PackagingDimensions, TemplateDefinition } from '../../core/dieline/types';

interface DimensionControlsProps {
  template: TemplateDefinition;
  dimensions: PackagingDimensions;
  onChangeDimensions: (newDims: PackagingDimensions) => void;
  onResetDimensions: () => void;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
  template,
  dimensions,
  onChangeDimensions,
  onResetDimensions,
}) => {
  const handleDimChange = (key: keyof Omit<PackagingDimensions, 'unit'>, value: number) => {
    onChangeDimensions({
      ...dimensions,
      [key]: value,
    });
  };

  const handleUnitToggle = (unit: 'mm' | 'in') => {
    if (unit === dimensions.unit) return;

    if (unit === 'in') {
      onChangeDimensions({
        length: Math.round((dimensions.length / 25.4) * 10) / 10,
        width: Math.round((dimensions.width / 25.4) * 10) / 10,
        depth: Math.round((dimensions.depth / 25.4) * 10) / 10,
        thickness: Math.round((dimensions.thickness / 25.4) * 100) / 100,
        unit: 'in',
      });
    } else {
      onChangeDimensions({
        length: Math.round(dimensions.length * 25.4),
        width: Math.round(dimensions.width * 25.4),
        depth: Math.round(dimensions.depth * 25.4),
        thickness: Math.round(dimensions.thickness * 25.4 * 10) / 10,
        unit: 'mm',
      });
    }
  };

  const { minDimensions: min, maxDimensions: max } = template;
  const isInch = dimensions.unit === 'in';
  const unitFactor = isInch ? 1 / 25.4 : 1;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={13} />
          <span>Parametric Dimensions</span>
        </div>
        <button
          onClick={onResetDimensions}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}
          title="Reset to default dimensions"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      {/* Unit Switcher */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-app)',
        padding: '3px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '11px',
            fontWeight: 600,
            background: !isInch ? 'var(--bg-surface)' : 'transparent',
            color: !isInch ? 'var(--text-primary)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
          onClick={() => handleUnitToggle('mm')}
        >
          Millimeters (mm)
        </button>
        <button
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '11px',
            fontWeight: 600,
            background: isInch ? 'var(--bg-surface)' : 'transparent',
            color: isInch ? 'var(--text-primary)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
          onClick={() => handleUnitToggle('in')}
        >
          Inches (in)
        </button>
      </div>

      <div className="dim-input-row">
        <div className="dim-label-row">
          <span className="dim-name">Length (L)</span>
          <span className="dim-val">{dimensions.length} {dimensions.unit}</span>
        </div>
        <div className="dim-slider-group">
          <input
            type="range"
            className="dim-slider"
            min={Math.round(min.length * unitFactor)}
            max={Math.round(max.length * unitFactor)}
            step={isInch ? 0.1 : 1}
            value={dimensions.length}
            onChange={(e) => handleDimChange('length', parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="dim-number-input"
            value={dimensions.length}
            step={isInch ? 0.1 : 1}
            onChange={(e) => handleDimChange('length', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="dim-input-row">
        <div className="dim-label-row">
          <span className="dim-name">Width (W)</span>
          <span className="dim-val">{dimensions.width} {dimensions.unit}</span>
        </div>
        <div className="dim-slider-group">
          <input
            type="range"
            className="dim-slider"
            min={Math.round(min.width * unitFactor)}
            max={Math.round(max.width * unitFactor)}
            step={isInch ? 0.1 : 1}
            value={dimensions.width}
            onChange={(e) => handleDimChange('width', parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="dim-number-input"
            value={dimensions.width}
            step={isInch ? 0.1 : 1}
            onChange={(e) => handleDimChange('width', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="dim-input-row">
        <div className="dim-label-row">
          <span className="dim-name">Depth / Height (D)</span>
          <span className="dim-val">{dimensions.depth} {dimensions.unit}</span>
        </div>
        <div className="dim-slider-group">
          <input
            type="range"
            className="dim-slider"
            min={Math.round(min.depth * unitFactor)}
            max={Math.round(max.depth * unitFactor)}
            step={isInch ? 0.1 : 1}
            value={dimensions.depth}
            onChange={(e) => handleDimChange('depth', parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="dim-number-input"
            value={dimensions.depth}
            step={isInch ? 0.1 : 1}
            onChange={(e) => handleDimChange('depth', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="dim-input-row">
        <div className="dim-label-row">
          <span className="dim-name">Caliper / Thickness (t)</span>
          <span className="dim-val">{dimensions.thickness} mm</span>
        </div>
        <div className="dim-slider-group">
          <input
            type="range"
            className="dim-slider"
            min={min.thickness}
            max={max.thickness}
            step={0.1}
            value={dimensions.thickness}
            onChange={(e) => handleDimChange('thickness', parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="dim-number-input"
            value={dimensions.thickness}
            step={0.1}
            onChange={(e) => handleDimChange('thickness', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
};
