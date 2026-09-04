export type ThemeMode = 'dark' | 'light';

export interface ThemeDefinition {
  id: string;
  name: string;
  mode: ThemeMode;
  system: string;
  description: string;
  previewColors: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  // --- Dark Software Themes ---
  {
    id: 'github-dark',
    name: 'GitHub Primer Dark',
    mode: 'dark',
    system: 'GitHub Primer',
    description: 'Official GitHub engineering UI (Obsidian & Primer Blue)',
    previewColors: {
      bg: '#0d1117',
      surface: '#161b22',
      accent: '#2f81f7',
      text: '#e6edf3',
    },
  },
  {
    id: 'nord-dark',
    name: 'Nord Arctic',
    mode: 'dark',
    system: 'Arctic Ice Studio',
    description: 'Official Nord Scandinavian developer palette (Polar Night & Frost Blue)',
    previewColors: {
      bg: '#242933',
      surface: '#2e3440',
      accent: '#88c0d0',
      text: '#eceff4',
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    mode: 'dark',
    system: 'Catppuccin',
    description: 'The acclaimed modern developer palette (Soothing Pastel Lavender & Crust)',
    previewColors: {
      bg: '#11111b',
      surface: '#1e1e2e',
      accent: '#b4befe',
      text: '#cdd6f4',
    },
  },
  {
    id: 'shadcn-zinc-dark',
    name: 'Shadcn Zinc Dark',
    mode: 'dark',
    system: 'Shadcn / Vercel',
    description: 'Modern enterprise SaaS standard with neutral zinc and high contrast',
    previewColors: {
      bg: '#09090b',
      surface: '#18181b',
      accent: '#3b82f6',
      text: '#fafafa',
    },
  },

  // --- Light Software Themes ---
  {
    id: 'github-light',
    name: 'GitHub Primer Light',
    mode: 'light',
    system: 'GitHub Primer',
    description: 'Official GitHub light web UI with neutral borders and crisp typography',
    previewColors: {
      bg: '#f6f8fa',
      surface: '#ffffff',
      accent: '#0969da',
      text: '#1f2328',
    },
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    mode: 'light',
    system: 'Catppuccin',
    description: 'Warm light pastel palette with soft lavender and soothing contrast',
    previewColors: {
      bg: '#dce0e8',
      surface: '#eff1f5',
      accent: '#1e66f5',
      text: '#4c4f69',
    },
  },
  {
    id: 'shadcn-zinc-light',
    name: 'Shadcn Zinc Light',
    mode: 'light',
    system: 'Shadcn / Vercel',
    description: 'Ultra-clean enterprise SaaS light theme (Vercel & Stripe style)',
    previewColors: {
      bg: '#f4f4f5',
      surface: '#ffffff',
      accent: '#2563eb',
      text: '#09090b',
    },
  },
];

export const DEFAULT_THEME_ID = 'github-dark';

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
