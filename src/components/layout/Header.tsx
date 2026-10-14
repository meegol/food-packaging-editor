import React, { useRef } from 'react';
import { Download, FolderOpen, Printer, Undo2, Redo2 } from 'lucide-react';
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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
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
        <div className="app-title-group">
          <h1>Food Packaging Editor</h1>
        </div>
      </div>

      <div className="header-actions-group">
        {/* Template & Dimensions Badge */}
        <div className="header-template-badge">
          <span className="badge-name">{templateName}</span>
          <span className="badge-dims" title={`Board thickness ${dimensions.thickness} mm`}>
            {dimensions.length} × {dimensions.width} × {dimensions.depth} {dimensions.unit}
          </span>
        </div>

        {/* Autosave Status Indicator */}
        <div className="autosave-status-pill" title="Automatic local session draft backup">
          <span className={`autosave-dot ${autosaveStatus === 'saving' ? 'saving' : ''}`} />
          <span className="autosave-label">{autosaveStatus === 'saving' ? 'Saving…' : 'Saved'}</span>
        </div>

        {/* Project JSON File I/O Actions & Production Export */}
        <div className="header-btn-group">
          <button className="header-action-btn" title="Undo (Ctrl+Z)" aria-label="Undo" onClick={onUndo} disabled={!canUndo}>
            <Undo2 size={14} />
          </button>
          <button className="header-action-btn" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" onClick={onRedo} disabled={!canRedo}>
            <Redo2 size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="header-action-btn"
            title="Open a saved project file (.json)"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={14} />
            <span className="header-btn-label">Open</span>
          </button>
          <button
            className="header-action-btn"
            title="Download this project as a file you can open later"
            onClick={onSaveProject}
          >
            <Download size={14} />
            <span className="header-btn-label">Save</span>
          </button>
          <button
            className="header-action-btn primary"
            title="Export print files: PDF, SVG, DXF or PNG"
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
