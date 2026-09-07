import React, { useRef } from 'react';
import { Box, Download, FolderOpen, Printer } from 'lucide-react';
import { PackagingDimensions } from '../../core/dieline/types';
import { ThemePicker } from './ThemePicker';

interface HeaderProps {
  templateName: string;
  dimensions: PackagingDimensions;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  autosaveStatus: 'saved' | 'saving' | 'idle';
  onSaveProject: () => void;
  onOpenExportModal: () => void;
  onImportProject: (fileContent: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  templateName,
  dimensions,
  activeThemeId,
  onSelectTheme,
  autosaveStatus,
  onSaveProject,
  onOpenExportModal,
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
          <p className="app-subtitle">2D Dieline & Layout Tool</p>
        </div>
      </div>

      <div className="header-actions-group">
        {/* Template & Dimensions Badge */}
        <div className="header-template-badge">
          <span className="badge-prefix">Template:</span>
          <span className="badge-name">{templateName}</span>
          <span className="badge-divider">|</span>
          <span className="badge-dims">
            {dimensions.length} × {dimensions.width} × {dimensions.depth} {dimensions.unit} (t={dimensions.thickness}mm)
          </span>
        </div>

        {/* Autosave Status Indicator */}
        <div className="autosave-status-pill" title="Automatic local session draft backup">
          <span className={`autosave-dot ${autosaveStatus === 'saving' ? 'saving' : ''}`} />
          <span className="autosave-label">{autosaveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
        </div>

        {/* Project JSON File I/O Actions & Production Export */}
        <div className="header-btn-group">
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
            <span className="header-btn-label">Open Project</span>
          </button>
          <button
            className="header-action-btn"
            title="Save and download packaging project JSON file directly"
            onClick={onSaveProject}
          >
            <Download size={14} />
            <span className="header-btn-label">Save Project</span>
          </button>
          <button
            className="header-action-btn primary"
            title="Open Production Export Suite (1:1 CAD PDF, SVG, AutoCAD DXF, 300 DPI Proof)"
            onClick={onOpenExportModal}
          >
            <Printer size={14} />
            <span className="header-btn-label">Export</span>
          </button>
        </div>

        {/* Color Scheme Picker */}
        <ThemePicker activeThemeId={activeThemeId} onSelectTheme={onSelectTheme} />
      </div>
    </header>
  );
};
