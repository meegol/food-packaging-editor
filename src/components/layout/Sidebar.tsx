import React, { useRef, useState } from 'react';
import { Box, Layers, Palette } from 'lucide-react';
import { TemplateSelector, StarterDesignPicker, ClientDesignPicker } from '../sidebar/TemplateSelector';
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
  onSelectTemplate: (id: string) => boolean;
  designId: string;
  onSelectDesign: (designId: string) => void;
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
  designId,
  onSelectDesign,
  onChangeDimensions,
  onResetDimensions,
  onSelectPanel,
  onAddGraphic,
  onRemoveGraphic,
  onToggleClip,
  onUpdateGraphic,
  onReorderGraphic,
}) => {
  const [activeTab, setActiveTab] = useState<'package' | 'design' | 'artwork'>('package');
  const contentRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'package' as const, label: 'Package', icon: <Box size={14} /> },
    { id: 'design' as const, label: 'Design', icon: <Palette size={14} /> },
    { id: 'artwork' as const, label: 'Artwork', icon: <Layers size={14} /> },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`sidebar-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content" ref={contentRef}>
        {activeTab === 'package' && (
          <>
            <DimensionControls
              template={template}
              dimensions={dimensions}
              onChangeDimensions={onChangeDimensions}
              onResetDimensions={onResetDimensions}
            />
            <TemplateSelector
              selectedTemplateId={template.id}
              onSelectTemplate={(id) => {
                // New shape: bring its size controls back into view
                if (onSelectTemplate(id)) contentRef.current?.scrollTo({ top: 0 });
              }}
              designId={designId}
            />
          </>
        )}

        {activeTab === 'design' && (
          <>
            <StarterDesignPicker templateId={template.id} designId={designId} onSelectDesign={onSelectDesign} />
            <ClientDesignPicker designId={designId} onSelectDesign={onSelectDesign} />
          </>
        )}

        {activeTab === 'artwork' && (
          <>
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
      </div>
    </aside>
  );
};
