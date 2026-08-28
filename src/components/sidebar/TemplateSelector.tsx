import React from 'react';
import { Package, Utensils, ShoppingBag } from 'lucide-react';
import { TEMPLATES } from '../../core/dieline';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'takeout':
        return <Utensils size={20} />;
      case 'pouches':
        return <ShoppingBag size={20} />;
      default:
        return <Package size={20} />;
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <span>Packaging Templates</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{TEMPLATES.length} Models</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {TEMPLATES.map((tmpl) => {
          const isActive = tmpl.id === selectedTemplateId;
          return (
            <div
              key={tmpl.id}
              className={`template-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTemplate(tmpl.id)}
            >
              <div className="template-icon-wrapper">
                {getIcon(tmpl.category)}
              </div>
              <div className="template-info">
                <h4>{tmpl.name}</h4>
                <p>{tmpl.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
