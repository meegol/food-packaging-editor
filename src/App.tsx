import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { DraftRecoveryBanner } from './components/layout/DraftRecoveryBanner';
import { getTemplateById, generateDieline, PackagingDimensions } from './core/dieline';
import { GraphicItem } from './core/graphics/types';
import { remapGraphicsToDieline } from './core/graphics/remapGraphics';
import { ExportModal } from './components/export/ExportModal';
import { buildStarterDesign, DEFAULT_DESIGN_ID } from './core/designs/starterDesigns';
import { getClientDesign, loadClientDesign } from './core/designs/clientDesigns';
import { normalizeThemeId, resolveThemeMode, ThemeMode } from './styles/themeDefinitions';
import { Sliders, Box as BoxIcon } from 'lucide-react';
import {
  getThemePreference,
  saveThemePreference,
  loadDraftAsync,
  saveDraftDebounced,
  parseProjectFile,
  PackagingProjectData,
  getOrCreateGuestSessionId,
  exportProjectFile,
} from './core/storage/projectStorage';

export const App: React.FC = () => {
  // Theme state initialized from persisted preference
  const [themeId, setThemeIdRaw] = useState<string>(() => normalizeThemeId(getThemePreference()));
  const setThemeId = (id: string) => setThemeIdRaw(normalizeThemeId(id));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => resolveThemeMode(themeId));

  // Mobile layout active tab ('tools' | 'canvas')
  const [mobileTab, setMobileTab] = useState<'tools' | 'canvas'>('canvas');

  // Template & Geometry state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('burger-box');
  const template = useMemo(() => getTemplateById(selectedTemplateId), [selectedTemplateId]);

  const [dimensions, setDimensions] = useState<PackagingDimensions>(template.defaultDimensions);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null);
  const [graphics, setGraphics] = useState<GraphicItem[]>(
    () => buildStarterDesign(DEFAULT_DESIGN_ID, generateDieline(template.id, template.defaultDimensions))
  );

  const [designId, setDesignId] = useState<string>(DEFAULT_DESIGN_ID);
  const [isStarterPristine, setIsStarterPristine] = useState(true);
  const [hasUserChanges, setHasUserChanges] = useState(false);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Session persistence state
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [detectedDraft, setDetectedDraft] = useState<PackagingProjectData | null>(null);
  const [hasInitializedDraftCheck, setHasInitializedDraftCheck] = useState(false);

  // Initialize guest session ID for the no-registration workflow
  useEffect(() => {
    getOrCreateGuestSessionId();
  }, []);

  // Synchronize active theme with document element immediately
  useEffect(() => {
    const apply = () => {
      const mode = resolveThemeMode(themeId);
      document.documentElement.setAttribute('data-theme', mode);
      setThemeMode(mode);
    };
    apply();
    saveThemePreference(themeId);
    if (themeId !== 'system' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [themeId]);

  // Check for existing saved draft on initial application load (IndexedDB + localStorage)
  useEffect(() => {
    if (!hasInitializedDraftCheck) {
      loadDraftAsync().then((draft) => {
        if (draft && (draft.graphics.length > 0 || draft.templateId !== 'burger-box')) {
          setDetectedDraft(draft);
        }
        setHasInitializedDraftCheck(true);
      }).catch(() => {
        setHasInitializedDraftCheck(true);
      });
    }
  }, [hasInitializedDraftCheck]);

  // Debounced auto-save to browser storage on project modifications
  useEffect(() => {
    if (!hasInitializedDraftCheck || !hasUserChanges) return;
    saveDraftDebounced(
      selectedTemplateId,
      dimensions,
      graphics,
      themeId,
      setAutosaveStatus
    );
  }, [selectedTemplateId, dimensions, graphics, themeId, hasInitializedDraftCheck, hasUserChanges]);

  // Undo/redo: snapshots of the document state. Changes within 500ms coalesce
  // into one step so slider drags and typing don't flood the stack.
  type Snapshot = { templateId: string; dimensions: PackagingDimensions; graphics: GraphicItem[]; designId: string; isStarterPristine: boolean };
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const committed = useRef<Snapshot | null>(null);
  const lastChangeAt = useRef(0);
  const restoring = useRef(false);
  const [, setHistoryVersion] = useState(0);

  useEffect(() => {
    const snap = { templateId: selectedTemplateId, dimensions, graphics, designId, isStarterPristine };
    const prev = committed.current;
    if (prev && (Object.keys(snap) as (keyof Snapshot)[]).every(k => prev[k] === snap[k])) return;
    if (restoring.current) {
      restoring.current = false;
    } else if (committed.current) {
      const now = Date.now();
      if (now - lastChangeAt.current > 500) {
        past.current.push(committed.current);
        if (past.current.length > 100) past.current.shift();
      }
      lastChangeAt.current = now;
      future.current = [];
      setHistoryVersion(v => v + 1);
    }
    committed.current = snap;
  }, [selectedTemplateId, dimensions, graphics, designId, isStarterPristine]);

  const restoreSnapshot = (from: Snapshot[], to: Snapshot[]) => {
    const target = from.pop();
    if (!target || !committed.current) return;
    to.push(committed.current);
    restoring.current = true;
    lastChangeAt.current = 0;
    if (target.templateId !== selectedTemplateId) {
      setActivePanelId(null);
      setFocusedPanelId(null);
    }
    setSelectedTemplateId(target.templateId);
    setDimensions(target.dimensions);
    setGraphics(target.graphics);
    setDesignId(target.designId);
    setIsStarterPristine(target.isStarterPristine);
    setHasUserChanges(true);
    setHistoryVersion(v => v + 1);
  };
  const handleUndo = () => restoreSnapshot(past.current, future.current);
  const handleRedo = () => restoreSnapshot(future.current, past.current);

  // Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo; text fields keep native undo
  const undoRedoRef = useRef({ handleUndo, handleRedo });
  undoRedoRef.current = { handleUndo, handleRedo };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) undoRedoRef.current.handleUndo();
      else if (key === 'y' || (key === 'z' && e.shiftKey)) undoRedoRef.current.handleRedo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelectTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
  };

  const handleRestoreDraft = () => {
    if (!detectedDraft) return;
    setIsStarterPristine(false);
    setHasUserChanges(true);
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

  const handleSaveProject = () => {
    exportProjectFile(selectedTemplateId, dimensions, graphics, themeId);
  };

  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleImportProject = (jsonContent: string) => {
    try {
      const imported = parseProjectFile(jsonContent);
      setIsStarterPristine(false);
      setHasUserChanges(true);
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

  const handleSelectTemplate = (templateId: string): boolean => {
    if (!isStarterPristine && graphics.length > 0) {
      const ok = window.confirm('Switch package template? Your edits on this package will be lost.');
      if (!ok) return false;
    }
    // Client designs belong to one template; other templates fall back to the default style
    const nextDesignId = getClientDesign(designId) ? DEFAULT_DESIGN_ID : designId;
    setSelectedTemplateId(templateId);
    const next = getTemplateById(templateId);
    setDimensions(next.defaultDimensions);
    setDesignId(nextDesignId);
    setGraphics(buildStarterDesign(nextDesignId, generateDieline(templateId, next.defaultDimensions)));
    setActivePanelId(null);
    setFocusedPanelId(null);
    setIsStarterPristine(true);
    setHasUserChanges(true);
    return true;
  };

  const handleSelectDesign = async (nextDesignId: string) => {
    if (!isStarterPristine && graphics.length > 0) {
      const ok = window.confirm('Replace your current artwork with this starter design? Your edits on this package will be lost.');
      if (!ok) return;
    }
    const client = getClientDesign(nextDesignId);
    if (client) {
      let items: GraphicItem[];
      try {
        items = await loadClientDesign(client.id);
      } catch (err: unknown) {
        alert(`Could not load design: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }
      if (client.templateId !== selectedTemplateId) {
        setActivePanelId(null);
        setFocusedPanelId(null);
      }
      setSelectedTemplateId(client.templateId);
      setDimensions(client.dimensions);
      setDesignId(client.id);
      setGraphics(items);
      setIsStarterPristine(true);
      setHasUserChanges(true);
      return;
    }
    setDesignId(nextDesignId);
    setGraphics(buildStarterDesign(nextDesignId, dieline));
    setIsStarterPristine(true);
    setHasUserChanges(true);
  };

  const markEdited = () => {
    setIsStarterPristine(false);
    setHasUserChanges(true);
  };

  const handleChangeDimensions = (dims: PackagingDimensions) => {
    const next = generateDieline(selectedTemplateId, dims);
    if (isStarterPristine && !getClientDesign(designId)) {
      setGraphics(buildStarterDesign(designId, next));
    } else {
      setGraphics(prev => remapGraphicsToDieline(prev, dieline, next));
    }
    setDimensions(dims);
    setHasUserChanges(true);
  };

  const handleCanvasGraphicChange = (items: GraphicItem[]) => {
    markEdited();
    setGraphics(items);
  };

  const handleResetDimensions = () => {
    handleChangeDimensions(template.defaultDimensions);
  };

  const handleSelectPanel = (panelId: string) => {
    setActivePanelId(panelId);
    setFocusedPanelId(panelId);
    setMobileTab('canvas');
  };

  const handleAddGraphic = (item: GraphicItem) => {
    markEdited();
    setGraphics(prev => [...prev, item]);
    setMobileTab('canvas');
  };

  const handleRemoveGraphic = (id: string) => {
    markEdited();
    setGraphics(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdateGraphic = (updated: GraphicItem) => {
    markEdited();
    setGraphics(prev => prev.map(g => g.id === updated.id ? updated : g));
  };

  const handleToggleClip = (id: string) => {
    markEdited();
    setGraphics(prev => prev.map(g => g.id === id ? { ...g, clipToPanel: !g.clipToPanel } : g));
  };

  const handleReorderGraphic = (id: string, direction: 'up' | 'down') => {
    markEdited();
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
        onSaveProject={handleSaveProject}
        onOpenExportModal={handleOpenExportModal}
        onImportProject={handleImportProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={past.current.length > 0}
        canRedo={future.current.length > 0}
      />
      <main className={`app-workspace mobile-active-${mobileTab}`}>
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
          designId={designId}
          onSelectDesign={handleSelectDesign}
          onChangeDimensions={handleChangeDimensions}
          onResetDimensions={handleResetDimensions}
          onSelectPanel={handleSelectPanel}
          onAddGraphic={handleAddGraphic}
          onRemoveGraphic={handleRemoveGraphic}
          onToggleClip={handleToggleClip}
          onUpdateGraphic={handleUpdateGraphic}
          onReorderGraphic={handleReorderGraphic}
        />
        <CanvasViewport
          dieline={dieline}
          activePanelId={activePanelId}
          onSelectPanel={setActivePanelId}
          focusedPanelId={focusedPanelId}
          graphics={graphics}
          onGraphicChange={handleCanvasGraphicChange}
          onAddGraphic={handleAddGraphic}
          themeId={themeMode}
        />
      </main>

      {/* Mobile Bottom Navigation Bar (rendered on <= 768px viewports) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'tools' ? 'active' : ''}`}
          onClick={() => setMobileTab('tools')}
        >
          <Sliders size={18} />
          <span>Tools</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'canvas' ? 'active' : ''}`}
          onClick={() => setMobileTab('canvas')}
        >
          <BoxIcon size={18} />
          <span>Canvas</span>
        </button>
      </nav>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dieline={dieline}
        graphics={graphics}
        themeId={themeId}
      />
    </div>
  );
};

export default App;
