import React from 'react';
import { Box } from 'lucide-react';
import { PackagingDimensions } from '../../core/dieline/types';

interface HeaderProps {
  templateName: string;
  dimensions: PackagingDimensions;
}

export const Header: React.FC<HeaderProps> = ({ templateName, dimensions }) => {
  return (
    <header className="app-header">
      <div className="app-brand">
        <div className="app-brand-icon">
          <Box size={18} />
        </div>
        <div className="app-title-group">
          <h1>Food Packaging Editor</h1>
          <p>2D Dieline & Layout Tool</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-app)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Template:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{templateName}</span>
          <span style={{ color: 'var(--border-medium)', margin: '0 4px' }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {dimensions.length} × {dimensions.width} × {dimensions.depth} {dimensions.unit} (t={dimensions.thickness}mm)
          </span>
        </div>
      </div>
    </header>
  );
};
