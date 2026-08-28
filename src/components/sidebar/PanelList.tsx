import React from 'react';
import { Layers, Crosshair } from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';

interface PanelListProps {
  panels: PanelFace[];
  activePanelId: string | null;
  onSelectPanel: (panelId: string) => void;
}

export const PanelList: React.FC<PanelListProps> = ({
  panels,
  activePanelId,
  onSelectPanel,
}) => {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} />
          <span>Packaging Faces ({panels.length})</span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click to focus</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {panels.map((panel) => {
          const isActive = panel.id === activePanelId;
          const w = Math.round(panel.bounds.width / 2.5);
          const h = Math.round(panel.bounds.height / 2.5);

          return (
            <div
              key={panel.id}
              className={`panel-list-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPanel(panel.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={14} color={isActive ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                <span className="panel-list-title">{panel.name}</span>
              </div>
              <span className="panel-list-dims">{w} × {h} mm</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
