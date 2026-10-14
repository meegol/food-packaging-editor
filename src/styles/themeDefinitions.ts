export type ThemeMode = 'dark' | 'light';
export type ThemePreference = ThemeMode | 'system';

export interface ThemeDefinition {
  id: ThemePreference;
  name: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'system', name: 'Match system' },
];

export const DEFAULT_THEME_ID: ThemePreference = 'light';

/**
 * Map any stored theme id (including the old named palettes such as
 * 'github-dark' or 'catppuccin-latte' found in saved drafts and project files)
 * onto the current light / dark / system preference.
 */
export function normalizeThemeId(id: string | null | undefined): ThemePreference {
  if (id === 'light' || id === 'dark' || id === 'system') return id;
  if (id && /light|latte/.test(id)) return 'light';
  return DEFAULT_THEME_ID;
}

export function resolveThemeMode(id: string): ThemeMode {
  const pref = normalizeThemeId(id);
  if (pref !== 'system') return pref;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getThemeById(id: string): ThemeDefinition {
  const pref = normalizeThemeId(id);
  return THEMES.find((t) => t.id === pref) || THEMES[0];
}
