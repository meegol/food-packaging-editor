import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { THEMES, normalizeThemeId, ThemePreference } from '../../styles/themeDefinitions';

interface ThemePickerProps {
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

const ICONS: Record<ThemePreference, React.ReactNode> = {
  light: <Sun size={14} />,
  dark: <Moon size={14} />,
  system: <Monitor size={14} />,
};

export const ThemePicker: React.FC<ThemePickerProps> = ({ activeThemeId, onSelectTheme }) => {
  const active = normalizeThemeId(activeThemeId);
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Appearance">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={theme.id === active}
          className={`theme-switch-btn ${theme.id === active ? 'active' : ''}`}
          title={theme.name}
          aria-label={theme.name}
          onClick={() => onSelectTheme(theme.id)}
        >
          {ICONS[theme.id]}
        </button>
      ))}
    </div>
  );
};
