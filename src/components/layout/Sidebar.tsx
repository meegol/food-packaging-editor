import React, { useState } from 'react';
import { Box, Sliders, Layers, Palette } from 'lucide-react';
import { TemplateSelector } from '../sidebar/TemplateSelector';
import { DimensionControls } from '../sidebar/DimensionControls';
import { PanelList } from '../sidebar/PanelList';
import { BrandingControls } from '../sidebar/BrandingControls';
import { TemplateDefinition, PackagingDimensions, PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface SidebarProps {
  template: TemplateDefinition;
  dimensions: PackagingDimensions;
  panels: PanelFace[];
  activePanelId: string | null;
  graphics: GraphicItem[];
  onSelectTemplate: (id: string) => void;
  onChangeDimensions: (dims: PackagingDimensions) => void;
  onResetDimensions: () => void;
  onSelectPanel: (panelId: string) => void;
  onAddGraphic: (item: GraphicItem) => void;
  onRemoveGraphic: (id: string) => void;
  onToggleClip: (id: string) => void;
  onUpdateGraphic?: (item: GraphicItem) => void;
  onReorderGraphic: (id: string, direction: 'up' | 'down') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  template,
  dimensions,
  panels,
  activePanelId,
  graphics,
  onSelectTemplate,
  onChangeDimensions,
  onResetDimensions,
  onSelectPanel,
  onAddGraphic,
  onRemoveGraphic,
  onToggleClip,
  onUpdateGraphic,
  onReorderGraphic,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'dimensions' | 'faces' | 'branding'>('dimensions');

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
        <button
          className={`sidebar-tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          <Palette size={14} />
          Branding
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
              graphics={graphics}
              onAddGraphic={onAddGraphic}
              onRemoveGraphic={onRemoveGraphic}
              onToggleClip={onToggleClip}
            />
          </>
        )}

        {activeTab === 'faces' && (
          <PanelList
            panels={panels}
            activePanelId={activePanelId}
            onSelectPanel={onSelectPanel}
            graphics={graphics}
            onAddGraphic={onAddGraphic}
            onRemoveGraphic={onRemoveGraphic}
            onToggleClip={onToggleClip}
          />
        )}

        {activeTab === 'branding' && (
          <BrandingControls
            panels={panels}
            activePanelId={activePanelId}
            graphics={graphics}
            onAddGraphic={onAddGraphic}
            onRemoveGraphic={onRemoveGraphic}
            onToggleClip={onToggleClip}
            onUpdateGraphic={onUpdateGraphic}
            onReorderGraphic={onReorderGraphic}
            onSelectPanel={onSelectPanel}
          />
        )}
      </div>
    </aside>
  );
};
