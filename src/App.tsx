import React, { useState, useMemo } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { getTemplateById, generateDieline, PackagingDimensions } from './core/dieline';

export const App: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('burger-box');
  const template = useMemo(() => getTemplateById(selectedTemplateId), [selectedTemplateId]);

  const [dimensions, setDimensions] = useState<PackagingDimensions>(template.defaultDimensions);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const next = getTemplateById(templateId);
    setDimensions(next.defaultDimensions);
    setActivePanelId(null);
    setFocusedPanelId(null);
  };

  const handleResetDimensions = () => {
    setDimensions(template.defaultDimensions);
  };

  const handleSelectPanel = (panelId: string) => {
    setActivePanelId(panelId);
    setFocusedPanelId(panelId);
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
          onSelectTemplate={handleSelectTemplate}
          onChangeDimensions={setDimensions}
          onResetDimensions={handleResetDimensions}
          onSelectPanel={handleSelectPanel}
        />
        <CanvasViewport
          dieline={dieline}
          activePanelId={activePanelId}
          onSelectPanel={setActivePanelId}
          focusedPanelId={focusedPanelId}
        />
      </main>
    </div>
  );
};

export default App;

