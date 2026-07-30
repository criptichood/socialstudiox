import { DBService } from './dbService';

export interface VoiceoverSession {
  id: string;
  projectId: string;
  name: string;
  scriptText: string;
  voiceName: string;
  deliveryStyleId: string;
  createdAt: number;
  ttsModel?: string;
  personaStyle?: string;
  accent?: string;
  speechSpeed?: string;
}

const AUDIO_DB_NAME = 'SocialStudioVoiceoverAudioDB';
const AUDIO_STORE_NAME = 'audio_blobs';
const VOICEOVER_SESSIONS_KEY = 'social_studio_voiceover_sessions';

export const saveAudioToIndexedDB = async (id: string, blobUrl: string): Promise<void> => {
  try {
    let blob: Blob;
    if (blobUrl.startsWith('data:')) {
      const parts = blobUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'audio/wav';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      const response = await fetch(blobUrl);
      blob = await response.blob();
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AUDIO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
        const store = tx.objectStore(AUDIO_STORE_NAME);
        store.put(blob, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to persist audio blob to IndexedDB", err);
  }
};

export const saveVoiceoverSession = async (session: VoiceoverSession, blobUrl: string): Promise<void> => {
  try {
    const list = await DBService.getItem<VoiceoverSession[]>(VOICEOVER_SESSIONS_KEY, []);
    const updated = [session, ...list.filter(s => s.id !== session.id)];
    await DBService.setItem(VOICEOVER_SESSIONS_KEY, updated);

    if (blobUrl) {
      await saveAudioToIndexedDB(session.id, blobUrl);
    }
  } catch (err) {
    console.error("Failed to save voiceover session", err);
  }
};

export const getVoiceoverSessionsAsync = async (): Promise<VoiceoverSession[]> => {
  try {
    return await DBService.getItem<VoiceoverSession[]>(VOICEOVER_SESSIONS_KEY, []);
  } catch {
    return [];
  }
};

export const getVoiceoverSessions = (): VoiceoverSession[] => {
  return DBService.getCachedItem<VoiceoverSession[]>(VOICEOVER_SESSIONS_KEY, []);
};

