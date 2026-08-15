import React, { useState, useRef, useEffect } from 'react';
import { Archive, Download, Loader2, FileImage, Music, Video, ChevronDown } from 'lucide-react';
import { SocialPostCampaignItem } from '@/types';
import { exportCampaignAssets } from '@/services/campaignExportService';

interface CampaignExportDropdownProps {
  campaignName: string;
  campaignPosts: SocialPostCampaignItem[] | null;
  triggerToast: (msg: string) => void;
}

export const CampaignExportDropdown: React.FC<CampaignExportDropdownProps> = ({
  campaignName,
  campaignPosts,
  triggerToast
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<null | 'base' | 'video'>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = async (includeVideo: boolean) => {
    const posts = campaignPosts || [];
    const hasAssets = posts.some(p => {
      if (p.slides && p.slides.length > 0) {
        return p.slides.some(s => s.imageUrl || s.audioUrl || (includeVideo && s.videoUrl));
      }
      return p.imageUrl || p.audioUrl || (includeVideo && p.videoUrl);
    });

    if (!hasAssets) {
      triggerToast('No generated assets to export yet — generate images/audio first.');
      setIsOpen(false);
      return;
    }

    setIsExporting(includeVideo ? 'video' : 'base');
    try {
      const count = await exportCampaignAssets(campaignName, posts, { includeVideo });
      triggerToast(
        count === 0
          ? 'Nothing to export in that set.'
          : `${count} file(s) exported as ZIP${includeVideo ? ' (with video)' : ''}!`
      );
    } catch (err) {
      console.error('Campaign export failed:', err);
      triggerToast('Failed to export campaign ZIP.');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const exporting = isExporting !== null;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200/40 dark:border-slate-700/40 disabled:opacity-60"
        title="Export the whole campaign as a ZIP"
      >
        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" /> : <Archive className="w-3.5 h-3.5 text-purple-400" />}
        <span>{exporting ? 'Zipping...' : 'Export'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-[99990] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1 text-left">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Export Campaign Assets</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">ZIP Archive</span>
          </div>

          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => handleExport(false)}
              disabled={exporting}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/90 transition-all group cursor-pointer border border-transparent hover:border-slate-700/50 disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                  Full Assets (Images + Audio)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mt-1 pl-6">
                Exports every generated graphic and its narration audio as image_1 + audio_1 pairs.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleExport(true)}
              disabled={exporting}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/90 transition-all group cursor-pointer border border-transparent hover:border-slate-700/50 disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  Full Assets + Video
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mt-1 pl-6">
                Same as above, plus any rendered MP4 videos (video_1, video_2, ...).
              </p>
            </button>
          </div>

          <div className="p-2 bg-purple-950/40 border-t border-purple-500/20 rounded-xl mt-1 flex items-center gap-1.5 text-[10px] text-purple-300">
            <Music className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Files keep their number pairing, so each image's audio stays matched.</span>
          </div>
        </div>
      )}
    </div>
  );
};
