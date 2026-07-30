import { DBService } from './dbService';

export interface VideoSession {
  id: string;
  projectId?: string;
  title: string;
  videoPrompt?: string;
  animationStyle: string;
  aspectRatio: string;
  createdAt: number;
  thumbnailUrl?: string;
  audioUrl?: string;
  durationSec?: number;
}

const VIDEO_DB_NAME = 'SocialStudioVideoDB';
const VIDEO_STORE_NAME = 'video_blobs';
const STORAGE_KEY = 'social_studio_video_sessions';

export const initVideoDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VIDEO_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME);
      }
    };
  });
};

export const saveVideoBlob = async (id: string, blob: Blob): Promise<void> => {
  try {
    const db = await initVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save video blob to IndexedDB:', err);
  }
};

export const loadVideoBlobUrl = async (id: string): Promise<string | null> => {
  try {
    const db = await initVideoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readonly');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const blob = req.result as Blob;
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const deleteVideoBlob = async (id: string): Promise<void> => {
  try {
    const db = await initVideoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // silent fallback
  }
};

export const saveVideoSession = async (session: VideoSession, videoBlob?: Blob): Promise<void> => {
  try {
    const currentSessions = await DBService.getItem<VideoSession[]>(STORAGE_KEY, []);
    const updatedList = [session, ...currentSessions.filter(s => s.id !== session.id)];
    await DBService.setItem(STORAGE_KEY, updatedList);

    if (videoBlob) {
      await saveVideoBlob(session.id, videoBlob);
    }
  } catch (err) {
    console.error('Error saving video session to IndexedDB:', err);
  }
};

export const getVideoSessionsAsync = async (): Promise<VideoSession[]> => {
  try {
    return await DBService.getItem<VideoSession[]>(STORAGE_KEY, []);
  } catch {
    return [];
  }
};

export const getVideoSessions = (): VideoSession[] => {
  return DBService.getCachedItem<VideoSession[]>(STORAGE_KEY, []);
};

export const deleteVideoSession = async (id: string): Promise<void> => {
  try {
    const currentSessions = await DBService.getItem<VideoSession[]>(STORAGE_KEY, []);
    const updated = currentSessions.filter(s => s.id !== id);
    await DBService.setItem(STORAGE_KEY, updated);
    await deleteVideoBlob(id);
  } catch (err) {
    console.error('Error deleting video session from IndexedDB:', err);
  }
};
