import React, { useState } from 'react';
import { Box, Sliders, Layers } from 'lucide-react';
import { TemplateSelector } from '../sidebar/TemplateSelector';
import { DimensionControls } from '../sidebar/DimensionControls';
import { PanelList } from '../sidebar/PanelList';
import { TemplateDefinition, PackagingDimensions, PanelFace } from '../../core/dieline/types';

interface SidebarProps {
  template: TemplateDefinition;
  dimensions: PackagingDimensions;
  panels: PanelFace[];
  activePanelId: string | null;
  onSelectTemplate: (id: string) => void;
  onChangeDimensions: (dims: PackagingDimensions) => void;
  onResetDimensions: () => void;
  onSelectPanel: (panelId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  template,
  dimensions,
  panels,
  activePanelId,
  onSelectTemplate,
  onChangeDimensions,
  onResetDimensions,
  onSelectPanel,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'dimensions' | 'faces'>('dimensions');

  return (
    <aside className="app-sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Box size={14} />
          Templates
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'dimensions' ? 'active' : ''}`}
          onClick={() => setActiveTab('dimensions')}
        >
          <Sliders size={14} />
          Dimensions
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'faces' ? 'active' : ''}`}
          onClick={() => setActiveTab('faces')}
        >
          <Layers size={14} />
          Faces
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'templates' && (
          <TemplateSelector
            selectedTemplateId={template.id}
            onSelectTemplate={(id) => {
              onSelectTemplate(id);
              setActiveTab('dimensions');
            }}
          />
        )}

        {activeTab === 'dimensions' && (
          <>
            <DimensionControls
              template={template}
              dimensions={dimensions}
              onChangeDimensions={onChangeDimensions}
              onResetDimensions={onResetDimensions}
            />
            <PanelList
              panels={panels}
              activePanelId={activePanelId}
              onSelectPanel={onSelectPanel}
            />
          </>
        )}

        {activeTab === 'faces' && (
          <PanelList
            panels={panels}
            activePanelId={activePanelId}
            onSelectPanel={onSelectPanel}
          />
        )}
      </div>
    </aside>
  );
};
