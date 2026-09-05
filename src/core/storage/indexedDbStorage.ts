/**
 * indexedDbStorage.ts
 * High-capacity client-side IndexedDB persistence for large packaging projects and image assets.
 * Seamlessly handles multi-megabyte image assets without hitting localStorage 5MB quota limits.
 */

import { PackagingProjectData } from './projectStorage';

const DB_NAME = 'ThesisPackagingDB';
const DB_VERSION = 1;

const STORE_DRAFTS = 'project_drafts';
const STORE_ASSETS = 'asset_blobs';
const DRAFT_KEY = 'active_draft';

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize or reuse open IndexedDB connection
 */
export function openPackagingDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS);
      }

      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS);
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save complete packaging project draft to IndexedDB
 */
export async function saveDraftToIndexedDB(projectData: PackagingProjectData): Promise<boolean> {
  try {
    const db = await openPackagingDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.put(projectData, DRAFT_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn('Failed to save draft to IndexedDB:', e);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable for saveDraft:', err);
    return false;
  }
}

/**
 * Load complete packaging project draft from IndexedDB
 */
export async function loadDraftFromIndexedDB(): Promise<PackagingProjectData | null> {
  try {
    const db = await openPackagingDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.get(DRAFT_KEY);

      req.onsuccess = () => {
        const res = req.result as PackagingProjectData | undefined;
        resolve(res || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable for loadDraft:', err);
    return null;
  }
}

/**
 * Clear draft from IndexedDB
 */
export async function clearDraftFromIndexedDB(): Promise<void> {
  try {
    const db = await openPackagingDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.delete(DRAFT_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB clearDraft error:', err);
  }
}

/**
 * Save an individual asset data URL to IndexedDB asset cache
 */
export async function saveAssetBlob(id: string, dataUrl: string): Promise<boolean> {
  try {
    const db = await openPackagingDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ASSETS, 'readwrite');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.put({ id, dataUrl, timestamp: Date.now() }, id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Retrieve an individual asset data URL from IndexedDB
 */
export async function getAssetBlob(id: string): Promise<string | null> {
  try {
    const db = await openPackagingDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ASSETS, 'readonly');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.get(id);

      req.onsuccess = () => {
        const item = req.result as { id: string; dataUrl: string } | undefined;
        resolve(item?.dataUrl || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
