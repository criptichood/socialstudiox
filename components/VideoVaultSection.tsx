import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Search, 
  Clock, 
  Video, 
  Sparkles,
  Maximize2,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  VideoSession, 
  getVideoSessions, 
  loadVideoBlobUrl, 
  deleteVideoSession 
} from '../services/videoStorageService';

interface VideoVaultSectionProps {
  onNavigateToDrafts?: () => void;
}

export const VideoVaultSection: React.FC<VideoVaultSectionProps> = ({
  onNavigateToDrafts
}) => {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [modalVideoSession, setModalVideoSession] = useState<VideoSession | null>(null);

  useEffect(() => {
    const list = getVideoSessions();
    setSessions(list);

    // Pre-load video blob URLs for each session
    list.forEach(async (sess) => {
      const url = await loadVideoBlobUrl(sess.id);
      if (url) {
        setVideoUrls(prev => ({ ...prev, [sess.id]: url }));
      }
    });
  }, []);

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this compiled video track?")) {
      await deleteVideoSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      setVideoUrls(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (activePlayingId === id) {
        setActivePlayingId(null);
      }
    }
  };

  const handleDownloadVideo = (session: VideoSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = videoUrls[session.id];
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    const nameSlug = (session.title || 'campaign-video')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50);
    a.download = `${nameSlug}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredSessions = sessions.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.title.toLowerCase().includes(term) ||
      (s.videoPrompt && s.videoPrompt.toLowerCase().includes(term)) ||
      (s.animationStyle && s.animationStyle.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos by title, motion style, or prompt..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 font-mono">
          <Film className="w-4 h-4 text-purple-500" />
          <span>{filteredSessions.length} Compiled Videos Vaulted</span>
        </div>
      </div>

      {/* Grid of Videos */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {sessions.length === 0 ? "No Compiled Videos Yet" : "No Matching Videos Found"}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compile 8s cinematic video frames in the Campaign Lightbox Studio with programmatic camera motion and voiceover audio. They will automatically be saved to this Video Vault.
            </p>
          </div>
          {onNavigateToDrafts && sessions.length === 0 && (
            <button
              type="button"
              onClick={onNavigateToDrafts}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Open Social Campaigns</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const videoUrl = videoUrls[session.id];
            const isPlaying = activePlayingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => setModalVideoSession(session)}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : session.thumbnailUrl ? (
                    <img
                      src={session.thumbnailUrl}
                      alt={session.title}
                      className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {/* Motion Tag Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-md text-[9px] font-bold text-purple-400 rounded-md border border-purple-500/30 uppercase tracking-wider">
                      {session.animationStyle || 'Zoom-In'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-950/80 backdrop-blur-md text-[9px] font-mono text-slate-300 rounded-md border border-slate-800">
                      {session.aspectRatio || '16:9'}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Session Card Info */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                      {session.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {session.videoPrompt || "Cinematic motion video rendering"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadVideo(session, e)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-purple-500 dark:text-slate-400 dark:hover:text-purple-400 rounded-lg transition-colors"
                        title="Download Video File (.webm)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                        title="Delete Video Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Video Preview Modal */}
      {modalVideoSession && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 relative overflow-hidden text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                  Video Vault Lightbox Player
                </span>
                <h3 className="text-sm font-bold text-white font-display">
                  {modalVideoSession.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVideoSession(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-purple-500/30">
              {videoUrls[modalVideoSession.id] ? (
                <video
                  src={videoUrls[modalVideoSession.id]}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <span>Loading video stream...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-mono">
                Motion Style: <strong className="text-purple-400">{modalVideoSession.animationStyle}</strong> | Format: <strong className="text-white">{modalVideoSession.aspectRatio}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleDownloadVideo(modalVideoSession)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
