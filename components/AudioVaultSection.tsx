import React, { useState, useEffect, useRef } from 'react';
import { DBService } from '../services/dbService';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Search, 
  Clock, 
  Mic, 
  FileText, 
  Check, 
  Volume2, 
  Sparkles,
  Subtitles,
  ExternalLink,
  Radio,
  ArrowRight
} from 'lucide-react';
import { AudioSubtitleViewer } from './AudioSubtitleViewer';

interface VoiceoverSession {
  id: string;
  projectId: string;
  name: string;
  scriptText: string;
  voiceName: string;
  deliveryStyleId: string;
  createdAt: number;
  ttsModel?: string;
}

interface AudioVaultSectionProps {
  onNavigateToVoiceoverStudio?: () => void;
}

const AUDIO_DB_NAME = 'SocialStudioVoiceoverAudioDB';
const AUDIO_STORE_NAME = 'audio_blobs';

const loadAudioBlobUrl = async (id: string): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(AUDIO_DB_NAME, 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          resolve(null);
          return;
        }
        const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
        const store = tx.objectStore(AUDIO_STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const blob = getReq.result as Blob;
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(null);
          }
        };
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
};

const deleteAudioFromStorage = async (id: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(AUDIO_DB_NAME, 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          resolve();
          return;
        }
        const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
        const store = tx.objectStore(AUDIO_STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const AudioVaultSection: React.FC<AudioVaultSectionProps> = ({
  onNavigateToVoiceoverStudio
}) => {
  const [sessions, setSessions] = useState<VoiceoverSession[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<Record<string, number>>({});
  const [trackDurations, setTrackDurations] = useState<Record<string, number>>({});
  const [downloadedIds, setDownloadedIds] = useState<Record<string, boolean>>({});
  const [activeSubtitleTrack, setActiveSubtitleTrack] = useState<VoiceoverSession | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // 1. Load sessions from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const reloadSessions = async () => {
      try {
        const saved = await DBService.getItem<VoiceoverSession[]>('social_studio_voiceover_sessions', []);
        if (isMounted) {
          setSessions(saved || []);
        }
      } catch (e) {
        console.error('Failed to load voiceover sessions from IndexedDB:', e);
      }
    };

    reloadSessions();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch IndexedDB blobs for sessions
  useEffect(() => {
    let isMounted = true;
    const fetchBlobs = async () => {
      const newUrls: Record<string, string> = {};
      for (const session of sessions) {
        if (!audioUrls[session.id]) {
          const blobUrl = await loadAudioBlobUrl(session.id);
          if (blobUrl && isMounted) {
            newUrls[session.id] = blobUrl;
          }
        }
      }
      if (isMounted && Object.keys(newUrls).length > 0) {
        setAudioUrls(prev => ({ ...prev, ...newUrls }));
      }
    };

    if (sessions.length > 0) {
      fetchBlobs();
    }

    return () => {
      isMounted = false;
    };
  }, [sessions]);

  // Audio playback controls
  const togglePlay = (id: string) => {
    const audio = audioRefs.current[id];
    if (!audio) return;

    if (activePlayingId === id) {
      audio.pause();
      setActivePlayingId(null);
    } else {
      // Pause any previously playing track
      if (activePlayingId && audioRefs.current[activePlayingId]) {
        audioRefs.current[activePlayingId].pause();
      }
      audio.play().then(() => {
        setActivePlayingId(id);
      }).catch(err => console.error("Playback error", err));
    }
  };

  const handleDownloadTrack = (session: VoiceoverSession) => {
    const url = audioUrls[session.id];
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    const safeName = session.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'voiceover-track';
    a.download = `${safeName}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadedIds(prev => ({ ...prev, [session.id]: true }));
    setTimeout(() => {
      setDownloadedIds(prev => ({ ...prev, [session.id]: false }));
    }, 2000);
  };

  const handleDeleteSession = async (id: string) => {
    // Delete from state & IndexedDB
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    await DBService.setItem('social_studio_voiceover_sessions', updated);

    // Delete audio blob from IndexedDB
    await deleteAudioFromStorage(id);

    // Stop audio if playing
    if (activePlayingId === id) {
      if (audioRefs.current[id]) {
        audioRefs.current[id].pause();
      }
      setActivePlayingId(null);
    }

    setDeleteConfirmId(null);
  };

  const filteredSessions = sessions.filter(session => {
    const query = searchTerm.toLowerCase();
    return (
      session.name.toLowerCase().includes(query) ||
      session.voiceName.toLowerCase().includes(query) ||
      session.scriptText.toLowerCase().includes(query)
    );
  });

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audio tracks by name, voice model (Puck, Fenrir...), or script keywords..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs md:text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-xs"
          />
        </div>

        {onNavigateToVoiceoverStudio && (
          <button
            onClick={onNavigateToVoiceoverStudio}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
          >
            <Mic className="w-4 h-4" />
            <span>Open Voiceover Studio</span>
          </button>
        )}
      </div>

      {/* Audio Grid or Empty View */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-base font-bold text-slate-900 dark:text-white font-display">
              {sessions.length === 0 ? "No Audio Voiceovers Stored Yet" : "No Matching Audio Tracks Found"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {sessions.length === 0 
                ? "Generate high-fidelity AI narration in Voiceover Studio with Gemini speech models. All generated audio tracks will automatically appear here for instant download and SRT export."
                : "Try clearing your search query to view all saved audio tracks."}
            </p>
          </div>
          {onNavigateToVoiceoverStudio && sessions.length === 0 && (
            <button
              onClick={onNavigateToVoiceoverStudio}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Synthesize Your First Audio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const audioUrl = audioUrls[session.id];
            const isPlaying = activePlayingId === session.id;
            const isDownloaded = downloadedIds[session.id];
            const currentSec = playbackTime[session.id] || 0;
            const totalSec = trackDurations[session.id] || 0;

            return (
              <div
                key={session.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md"
              >
                {/* Audio Ref */}
                {audioUrl && (
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current[session.id] = el;
                    }}
                    src={audioUrl}
                    onTimeUpdate={(e) => {
                      const target = e.currentTarget;
                      setPlaybackTime(prev => ({ ...prev, [session.id]: target.currentTime }));
                    }}
                    onLoadedMetadata={(e) => {
                      const target = e.currentTarget;
                      setTrackDurations(prev => ({ ...prev, [session.id]: target.duration }));
                    }}
                    onEnded={() => setActivePlayingId(null)}
                  />
                )}

                {/* Card Top: Title & Tags */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display truncate">
                        {session.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-md border border-purple-200 dark:border-purple-500/20 flex items-center gap-1">
                          <Mic className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>{session.voiceName}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    {deleteConfirmId === session.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/80 p-1 rounded-xl border border-red-300 dark:border-red-500/40">
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-1 text-slate-500 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete audio track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Script Snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 italic font-serif">
                    "{session.scriptText}"
                  </p>
                </div>

                {/* Audio Player Scrubber Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePlay(session.id)}
                      disabled={!audioUrl}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min={0}
                        max={totalSec || 100}
                        value={currentSec}
                        onChange={(e) => {
                          const newTime = parseFloat(e.target.value);
                          if (audioRefs.current[session.id]) {
                            audioRefs.current[session.id].currentTime = newTime;
                            setPlaybackTime(prev => ({ ...prev, [session.id]: newTime }));
                          }
                        }}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 accent-purple-600 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>{formatTime(currentSec)}</span>
                        <span>{formatTime(totalSec)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Download + View SRT Subtitles */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadTrack(session)}
                      disabled={!audioUrl}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isDownloaded
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Downloaded Audio!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Download WAV</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveSubtitleTrack(session)}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="View timed SRT subtitles and copy transcript"
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span>SRT Subtitles</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Subtitles Modal Popup */}
      {activeSubtitleTrack && (
        <AudioSubtitleViewer
          scriptText={activeSubtitleTrack.scriptText}
          audioUrl={audioUrls[activeSubtitleTrack.id]}
          durationSec={trackDurations[activeSubtitleTrack.id] || 15}
          title={activeSubtitleTrack.name}
          initiallyExpanded={true}
        />
      )}

    </div>
  );
};
