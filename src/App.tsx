import React, { useState, useMemo } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { getTemplateById, generateDieline, PackagingDimensions } from './core/dieline';
import { GraphicItem } from './core/graphics/types';

export const App: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('burger-box');
  const template = useMemo(() => getTemplateById(selectedTemplateId), [selectedTemplateId]);

  const [dimensions, setDimensions] = useState<PackagingDimensions>(template.defaultDimensions);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null);
  const [graphics, setGraphics] = useState<GraphicItem[]>([]);

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
      />
      <main className="app-workspace">
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
        />
      </main>
    </div>
  );
};

export default App;

