import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { DraftRecoveryBanner } from './components/layout/DraftRecoveryBanner';
import { getTemplateById, generateDieline, PackagingDimensions } from './core/dieline';
import { GraphicItem } from './core/graphics/types';
import {
  getThemePreference,
  saveThemePreference,
  loadDraft,
  saveDraftDebounced,
  exportProjectFile,
  parseProjectFile,
  PackagingProjectData,
} from './core/storage/projectStorage';

export const App: React.FC = () => {
  // Theme state initialized from persisted preference
  const [themeId, setThemeId] = useState<string>(() => getThemePreference());

  // Template & Geometry state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('burger-box');
  const template = useMemo(() => getTemplateById(selectedTemplateId), [selectedTemplateId]);

  const [dimensions, setDimensions] = useState<PackagingDimensions>(template.defaultDimensions);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null);
  const [graphics, setGraphics] = useState<GraphicItem[]>([]);

  // Session persistence state
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [detectedDraft, setDetectedDraft] = useState<PackagingProjectData | null>(null);
  const [hasInitializedDraftCheck, setHasInitializedDraftCheck] = useState(false);

  // Synchronize active theme with document element immediately
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    saveThemePreference(themeId);
  }, [themeId]);

  // Check for existing saved draft on initial application load
  useEffect(() => {
    if (!hasInitializedDraftCheck) {
      const draft = loadDraft();
      if (draft && (draft.graphics.length > 0 || draft.templateId !== 'burger-box')) {
        setDetectedDraft(draft);
      }
      setHasInitializedDraftCheck(true);
    }
  }, [hasInitializedDraftCheck]);

  // Debounced auto-save to browser storage on project modifications
  useEffect(() => {
    if (!hasInitializedDraftCheck) return;
    saveDraftDebounced(
      selectedTemplateId,
      dimensions,
      graphics,
      themeId,
      setAutosaveStatus
    );
  }, [selectedTemplateId, dimensions, graphics, themeId, hasInitializedDraftCheck]);

  const handleSelectTheme = (newThemeId: string) => {
    document.documentElement.setAttribute('data-theme', newThemeId);
    setThemeId(newThemeId);
    saveThemePreference(newThemeId);
  };

  const handleRestoreDraft = () => {
    if (!detectedDraft) return;
    setSelectedTemplateId(detectedDraft.templateId);
    setDimensions(detectedDraft.dimensions);
    setGraphics(detectedDraft.graphics);
    if (detectedDraft.theme) {
      setThemeId(detectedDraft.theme);
    }
    setDetectedDraft(null);
  };

  const handleDismissDraft = () => {
    setDetectedDraft(null);
  };

  const handleExportProject = () => {
    exportProjectFile(selectedTemplateId, dimensions, graphics, themeId);
  };

  const handleImportProject = (jsonContent: string) => {
    try {
      const imported = parseProjectFile(jsonContent);
      setSelectedTemplateId(imported.templateId);
      setDimensions(imported.dimensions);
      setGraphics(imported.graphics);
      if (imported.theme) {
        setThemeId(imported.theme);
      }
      setActivePanelId(null);
      setFocusedPanelId(null);
      setDetectedDraft(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown file error';
      alert(`Could not open project file: ${message}`);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const next = getTemplateById(templateId);
    setDimensions(next.defaultDimensions);
    setActivePanelId(null);
    setFocusedPanelId(null);
    setGraphics([]);
  };

  const handleResetDimensions = () => {
    setDimensions(template.defaultDimensions);
  };

  const handleSelectPanel = (panelId: string) => {
    setActivePanelId(panelId);
    setFocusedPanelId(panelId);
  };

  const handleAddGraphic = (item: GraphicItem) => {
    setGraphics(prev => [...prev, item]);
  };

  const handleRemoveGraphic = (id: string) => {
    setGraphics(prev => prev.filter(g => g.id !== id));
  };

  const handleToggleClip = (id: string) => {
    setGraphics(prev => prev.map(g => g.id === id ? { ...g, clipToPanel: !g.clipToPanel } : g));
  };

  const handleReorderGraphic = (id: string, direction: 'up' | 'down') => {
    setGraphics(prev => {
      const idx = prev.findIndex(g => g.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx < next.length - 1) {
        const temp = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = temp;
      } else if (direction === 'down' && idx > 0) {
        const temp = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = temp;
      }
      return next;
    });
  };

  const dieline = useMemo(() => {
    return generateDieline(selectedTemplateId, dimensions);
  }, [selectedTemplateId, dimensions]);

  return (
    <div className="app-container">
      <Header
        templateName={template.name}
        dimensions={dimensions}
        activeThemeId={themeId}
        onSelectTheme={handleSelectTheme}
        autosaveStatus={autosaveStatus}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
      />
      <main className="app-workspace">
        {detectedDraft && (
          <DraftRecoveryBanner
            draft={detectedDraft}
            onRestore={handleRestoreDraft}
            onDismiss={handleDismissDraft}
          />
        )}
        <Sidebar
          template={template}
          dimensions={dimensions}
          panels={dieline.panels}
          activePanelId={activePanelId}
          graphics={graphics}
          onSelectTemplate={handleSelectTemplate}
          onChangeDimensions={setDimensions}
          onResetDimensions={handleResetDimensions}
          onSelectPanel={handleSelectPanel}
          onAddGraphic={handleAddGraphic}
          onRemoveGraphic={handleRemoveGraphic}
          onToggleClip={handleToggleClip}
          onReorderGraphic={handleReorderGraphic}
        />
        <CanvasViewport
          dieline={dieline}
          activePanelId={activePanelId}
          onSelectPanel={setActivePanelId}
          focusedPanelId={focusedPanelId}
          graphics={graphics}
          onGraphicChange={setGraphics}
          themeId={themeId}
        />
      </main>
    </div>
  );
};

export default App;
