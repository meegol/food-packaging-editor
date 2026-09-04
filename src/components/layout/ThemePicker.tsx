import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, ChevronDown, Check } from 'lucide-react';
import { THEMES, ThemeDefinition, getThemeById } from '../../styles/themeDefinitions';

interface ThemePickerProps {
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({
  activeThemeId,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTheme = getThemeById(activeThemeId);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const darkThemes = THEMES.filter((t) => t.mode === 'dark');
  const lightThemes = THEMES.filter((t) => t.mode === 'light');

  const renderThemeOption = (theme: ThemeDefinition) => {
    const isActive = theme.id === activeThemeId;
    return (
      <div
        key={theme.id}
        className={`theme-option-item ${isActive ? 'active' : ''}`}
        onClick={() => {
          onSelectTheme(theme.id);
          setIsOpen(false);
        }}
      >
        <div className="theme-option-info" style={{ flex: 1, marginRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="theme-option-name">{theme.name}</span>
            {isActive && <Check size={13} color="var(--accent-primary)" strokeWidth={3} />}
          </div>
          <span className="theme-option-desc">{theme.description}</span>
        </div>

        <div className="theme-swatches" title="Color palette preview">
          <div
            className="theme-swatch-dot"
            style={{ backgroundColor: theme.previewColors.bg }}
          />
          <div
            className="theme-swatch-dot"
            style={{ backgroundColor: theme.previewColors.surface }}
          />
          <div
            className="theme-swatch-dot"
            style={{ backgroundColor: theme.previewColors.accent }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="theme-picker-wrapper" ref={containerRef}>
      <button
        className="theme-picker-btn"
        title="Change software UI color system"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {currentTheme.mode === 'dark' ? (
          <Moon size={14} color="var(--accent-secondary)" />
        ) : (
          <Sun size={14} color="var(--status-warning)" />
        )}
        <span>{currentTheme.name}</span>
        <div className="theme-swatches" style={{ marginLeft: '4px' }}>
          <div
            className="theme-swatch-dot"
            style={{ width: '8px', height: '8px', backgroundColor: currentTheme.previewColors.accent }}
          />
        </div>
        <ChevronDown size={12} style={{ opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div className="theme-picker-popover" style={{ width: '310px' }}>
          <div>
            <div className="theme-group-title">
              <Moon size={11} />
              <span>Dark Software Themes (Industry Standards)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {darkThemes.map(renderThemeOption)}
            </div>
          </div>

          <div>
            <div className="theme-group-title">
              <Sun size={11} />
              <span>Light Software Themes (Industry Standards)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {lightThemes.map(renderThemeOption)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
