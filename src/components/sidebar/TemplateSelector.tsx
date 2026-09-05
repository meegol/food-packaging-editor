import React, { useState } from 'react';
import { Package, Utensils, ShoppingBag, Cake, ScrollText } from 'lucide-react';
import { TEMPLATES, TemplateCategory } from '../../core/dieline';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getIcon = (category: TemplateCategory) => {
    switch (category) {
      case 'takeout':
        return <Utensils size={20} />;
      case 'pouches':
        return <ShoppingBag size={20} />;
      case 'bakery':
        return <Cake size={20} />;
      case 'wrappers':
        return <ScrollText size={20} />;
      case 'containers':
      default:
        return <Package size={20} />;
    }
  };

  const filteredTemplates = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All', count: TEMPLATES.length },
    { id: 'takeout', label: 'Takeout', count: TEMPLATES.filter(t => t.category === 'takeout').length },
    { id: 'pouches', label: 'Pouches', count: TEMPLATES.filter(t => t.category === 'pouches').length },
    { id: 'containers', label: 'Containers', count: TEMPLATES.filter(t => t.category === 'containers').length },
    { id: 'bakery', label: 'Bakery', count: TEMPLATES.filter(t => t.category === 'bakery').length },
    { id: 'wrappers', label: 'Wrappers', count: TEMPLATES.filter(t => t.category === 'wrappers').length },
  ];

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <span>Packaging Model Library</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{TEMPLATES.length} Structural Templates</span>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        paddingBottom: '6px',
        marginBottom: '10px',
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: selectedCategory === cat.id ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Template Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredTemplates.map((tmpl) => {
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
