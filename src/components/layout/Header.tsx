import React, { useRef } from 'react';
import { Box, Download, FolderOpen } from 'lucide-react';
import { PackagingDimensions } from '../../core/dieline/types';
import { ThemePicker } from './ThemePicker';

interface HeaderProps {
  templateName: string;
  dimensions: PackagingDimensions;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  autosaveStatus: 'saved' | 'saving' | 'idle';
  onExportProject: () => void;
  onImportProject: (fileContent: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  templateName,
  dimensions,
  activeThemeId,
  onSelectTheme,
  autosaveStatus,
  onExportProject,
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        onImportProject(content);
      }
    };
    reader.readAsText(file);

    // Reset input value so same file can be re-imported if needed
    e.target.value = '';
  };

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Template & Dimensions Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-app)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Template:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{templateName}</span>
          <span style={{ color: 'var(--border-medium)', margin: '0 2px' }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {dimensions.length} × {dimensions.width} × {dimensions.depth} {dimensions.unit} (t={dimensions.thickness}mm)
          </span>
        </div>

        {/* Autosave Status Indicator */}
        <div className="autosave-status-pill" title="Automatic local session draft backup">
          <span className={`autosave-dot ${autosaveStatus === 'saving' ? 'saving' : ''}`} />
          <span>{autosaveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
        </div>

        {/* Project JSON File I/O Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="header-action-btn"
            title="Open an existing packaging project JSON file"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={14} />
            <span>Open</span>
          </button>
          <button
            className="header-action-btn"
            title="Export project configuration to portable JSON"
            onClick={onExportProject}
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>

        {/* Color Scheme Picker */}
        <ThemePicker activeThemeId={activeThemeId} onSelectTheme={onSelectTheme} />
      </div>
    </header>
  );
};
