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
  const current = THEMES.findIndex((t) => t.id === active);
  const next = THEMES[(current + 1) % THEMES.length];
  return (
    <>
    {/* Phones: one button that steps through the options */}
    <button
      type="button"
      className="theme-cycle-btn"
      title={`Appearance: ${THEMES[current].name}. Switch to ${next.name}`}
      aria-label={`Appearance: ${THEMES[current].name}. Switch to ${next.name}`}
      onClick={() => onSelectTheme(next.id)}
    >
      {ICONS[active]}
    </button>
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
    </>
  );
};
