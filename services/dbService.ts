/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GeneratedImage } from '../types';

const DB_NAME = 'InfoGeniusVisionDB';
const DB_VERSION = 2;
const STORE_NAME = 'generations';
const KV_STORE_NAME = 'kv_store';

// In-memory cache for fast synchronous access after initial load
const cacheMap = new Map<string, any>();

export class DBService {
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<IDBDatabase> | null = null;

  public static async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(KV_STORE_NAME)) {
          db.createObjectStore(KV_STORE_NAME);
        }
      };
    });

    return this.initPromise;
  }

  // Generic Key-Value store operations in IndexedDB with local in-memory caching & legacy localStorage migration
  public static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    if (cacheMap.has(key)) {
      return cacheMap.get(key) as T;
    }

    try {
      const db = await this.init();
      const val = await new Promise<T | undefined>((resolve, reject) => {
        const transaction = db.transaction(KV_STORE_NAME, 'readonly');
        const store = transaction.objectStore(KV_STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
      });

      if (val !== undefined && val !== null) {
        cacheMap.set(key, val);
        return val;
      }

      // Check legacy localStorage for automatic migration
      if (typeof window !== 'undefined' && window.localStorage) {
        const legacyRaw = localStorage.getItem(key);
        if (legacyRaw !== null) {
          try {
            const parsed = JSON.parse(legacyRaw) as T;
            cacheMap.set(key, parsed);
            this.setItem(key, parsed).catch(err => console.warn(`Failed to migrate ${key} to IndexedDB:`, err));
            try { localStorage.removeItem(key); } catch (e) {}
            return parsed;
          } catch {
            cacheMap.set(key, legacyRaw as unknown as T);
            this.setItem(key, legacyRaw as unknown as T).catch(() => {});
            try { localStorage.removeItem(key); } catch (e) {}
            return legacyRaw as unknown as T;
          }
        }
      }
    } catch (err) {
      console.error(`Error reading key "${key}" from IndexedDB:`, err);
    }

    cacheMap.set(key, defaultValue);
    return defaultValue;
  }

  public static async setItem<T>(key: string, value: T): Promise<void> {
    cacheMap.set(key, value);
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(KV_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(KV_STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`Error writing key "${key}" to IndexedDB:`, err);
    }
  }

  public static async removeItem(key: string): Promise<void> {
    cacheMap.delete(key);
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(KV_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(KV_STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`Error removing key "${key}" from IndexedDB:`, err);
    }
  }

  public static getCachedItem<T>(key: string, defaultValue: T): T {
    if (cacheMap.has(key)) {
      return cacheMap.get(key) as T;
    }
    return defaultValue;
  }

  public static async getAll(): Promise<GeneratedImage[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by timestamp descending
        const results = request.result as GeneratedImage[];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public static async get(id: string): Promise<GeneratedImage | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public static async save(item: GeneratedImage): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public static async delete(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public static async clearAll(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}
