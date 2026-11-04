// IndexedDB storage for persisting the last 3 video exports
const DB_NAME = 'captivox_exports_store';
const DB_VERSION = 1;
const STORE_NAME = 'recent_exports';

export interface StoredExport {
  id: string;
  projectId: string;
  title: string;
  timestamp: number;
  blob: Blob;
  sizeMB: string;
  duration: number;
  mimeType: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves an export to IndexedDB, keeping only the last 3 exports
 */
export async function saveExportToIndexedDB(
  blob: Blob,
  projectId: string,
  title: string,
  duration = 0
): Promise<StoredExport> {
  try {
    const db = await openDB();
    const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';

    const item: StoredExport = {
      id,
      projectId,
      title: title || 'Captivox Video',
      timestamp: Date.now(),
      blob,
      sizeMB,
      duration,
      mimeType: blob.type || 'video/mp4',
    };

    // First retrieve existing to prune to 3
    const all = await getRecentExportsFromIndexedDB();
    all.sort((a, b) => b.timestamp - a.timestamp);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Delete older items beyond 2 (so new item makes 3 max)
    if (all.length >= 3) {
      const toDelete = all.slice(2);
      for (const old of toDelete) {
        store.delete(old.id);
      }
    }

    store.put(item);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to memory only', err);
    return {
      id: `mem_${Date.now()}`,
      projectId,
      title,
      timestamp: Date.now(),
      blob,
      sizeMB: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
      duration,
      mimeType: blob.type,
    };
  }
}

/**
 * Retrieves the last 3 exports from IndexedDB
 */
export async function getRecentExportsFromIndexedDB(): Promise<StoredExport[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results: StoredExport[] = req.result || [];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results.slice(0, 3));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Deletes a stored export by ID
 */
export async function deleteStoredExport(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (e) {
    console.warn('Failed to delete export', e);
  }
}
