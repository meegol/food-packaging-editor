import { PackagingDimensions } from '../dieline/types';
import { GraphicItem } from '../graphics/types';

export const STORAGE_KEY_DRAFT = 'thesis_food_packaging_draft_v1';
export const STORAGE_KEY_THEME = 'thesis_food_packaging_theme';

export interface ProjectMetadata {
  name: string;
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface PackagingProjectData {
  metadata: ProjectMetadata;
  templateId: string;
  dimensions: PackagingDimensions;
  graphics: GraphicItem[];
  theme: string;
}

const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Retrieve saved theme preference, defaulting to 'dark-slate'
 */
export function getThemePreference(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_THEME) || 'github-dark';
  } catch {
    return 'github-dark';
  }
}

/**
 * Save selected theme preference to local storage
 */
export function saveThemePreference(themeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, themeId);
  } catch (err) {
    console.warn('Failed to save theme preference:', err);
  }
}

import {
  saveDraftToIndexedDB,
  loadDraftFromIndexedDB,
  clearDraftFromIndexedDB,
} from './indexedDbStorage';

/**
 * Save draft state to IndexedDB (for high-capacity images) and localStorage (for instant hydration)
 */
export function saveDraft(
  templateId: string,
  dimensions: PackagingDimensions,
  graphics: GraphicItem[],
  theme: string,
  projectName = 'Untitled Packaging Project'
): boolean {
  const existing = loadDraft();
  const projectData: PackagingProjectData = {
    metadata: {
      name: projectName,
      version: CURRENT_SCHEMA_VERSION,
      createdAt: existing?.metadata.createdAt || Date.now(),
      updatedAt: Date.now(),
    },
    templateId,
    dimensions,
    graphics,
    theme,
  };

  // 1. Asynchronously save complete project with high-res assets to IndexedDB
  saveDraftToIndexedDB(projectData).catch((err) => {
    console.warn('Background IndexedDB autosave error:', err);
  });

  // 2. Synchronously save to localStorage for instant startup hydration
  try {
    localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(projectData));
    return true;
  } catch (err) {
    // If QuotaExceededError occurs (typically ~5MB limit), strip heavy image strings for localStorage
    try {
      const lightweightGraphics = graphics.map((g) => {
        if (g.src && g.src.length > 2048) {
          // Keep item metadata but mark source for IndexedDB hydration
          return { ...g, src: `indexeddb:${g.id}` };
        }
        return g;
      });

      const lightweightData: PackagingProjectData = {
        ...projectData,
        graphics: lightweightGraphics,
      };

      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(lightweightData));
      return true;
    } catch (fallbackErr) {
      console.warn('Could not autosave draft to localStorage:', fallbackErr);
      return false;
    }
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced autosave with reactive status updates
 */
export function saveDraftDebounced(
  templateId: string,
  dimensions: PackagingDimensions,
  graphics: GraphicItem[],
  theme: string,
  onStatusChange?: (status: 'saving' | 'saved') => void,
  delayMs = 600
): void {
  if (onStatusChange) {
    onStatusChange('saving');
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    saveDraft(templateId, dimensions, graphics, theme);
    if (onStatusChange) {
      onStatusChange('saved');
    }
  }, delayMs);
}

/**
 * Load draft synchronously from local storage
 */
export function loadDraft(): PackagingProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PackagingProjectData;
    if (!parsed || !parsed.templateId || !parsed.dimensions) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to load draft from localStorage:', err);
    return null;
  }
}

/**
 * High-capacity draft loader checking IndexedDB first for full-resolution images
 */
export async function loadDraftAsync(): Promise<PackagingProjectData | null> {
  try {
    const idbData = await loadDraftFromIndexedDB();
    if (idbData && idbData.templateId && idbData.dimensions) {
      return idbData;
    }
  } catch (err) {
    console.warn('IndexedDB load error, falling back to localStorage:', err);
  }

  return loadDraft();
}

/**
 * Check if a saved draft exists
 */
export function hasDraft(): boolean {
  return loadDraft() !== null;
}

/**
 * Clear existing draft from both localStorage and IndexedDB
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DRAFT);
  } catch (err) {
    console.warn('Failed to clear localStorage draft:', err);
  }

  clearDraftFromIndexedDB().catch((err) => {
    console.warn('Failed to clear IndexedDB draft:', err);
  });
}

/**
 * Export project data as a downloadable .json file
 */
export function exportProjectFile(
  templateId: string,
  dimensions: PackagingDimensions,
  graphics: GraphicItem[],
  theme: string,
  filename?: string
): void {
  const projectData: PackagingProjectData = {
    metadata: {
      name: filename || `${templateId}-design`,
      version: CURRENT_SCHEMA_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    templateId,
    dimensions,
    graphics,
    theme,
  };

  const jsonStr = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const safeName = (filename || `${templateId}-design-${dateStr}`).replace(/\s+/g, '-').toLowerCase();

  const link = document.createElement('a');
  link.href = url;
  link.download = safeName.endsWith('.json') ? safeName : `${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate an imported project JSON string
 */
export function parseProjectFile(jsonContent: string): PackagingProjectData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    throw new Error('Invalid JSON file format.');
  }

  const p = parsed as Partial<PackagingProjectData>;

  if (!p || typeof p !== 'object') {
    throw new Error('Empty or invalid project file structure.');
  }

  if (!p.templateId || typeof p.templateId !== 'string') {
    throw new Error('Missing or invalid "templateId" field.');
  }

  if (
    !p.dimensions ||
    typeof p.dimensions.length !== 'number' ||
    typeof p.dimensions.width !== 'number' ||
    typeof p.dimensions.depth !== 'number'
  ) {
    throw new Error('Project file missing valid dimensional parameters.');
  }

  if (!Array.isArray(p.graphics)) {
    p.graphics = [];
  }

  return {
    metadata: {
      name: p.metadata?.name || 'Imported Packaging Project',
      version: p.metadata?.version || CURRENT_SCHEMA_VERSION,
      createdAt: p.metadata?.createdAt || Date.now(),
      updatedAt: Date.now(),
    },
    templateId: p.templateId,
    dimensions: p.dimensions,
    graphics: p.graphics,
    theme: p.theme || 'github-dark',
  };
}
