import React from 'react';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Sparkles, 
  Wand2, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { SavedCampaign, SocialPostCampaignItem } from '@/components/DraftsPlanner';
import { AIModelDropdown } from '@/components/CustomDropdown';

interface CampaignWorkspaceHeaderProps {
  currentCampaign: SavedCampaign;
  onSelectCampaign: (id: string | null) => void;
  onDeleteCampaign: (id: string) => void;
  isRenaming: boolean;
  setIsRenaming: (val: boolean) => void;
  tempName: string;
  setTempName: (val: string) => void;
  handleRenameSave: () => void;
  getPlatformBadgeColor: (platform: string) => string;
  getPlatformIcon: (platform: string) => React.ReactNode;
  onOpenAddPostModal: () => void;
  showSingleAIPostForm: boolean;
  setShowSingleAIPostForm: (val: boolean) => void;
  setShowRefinementModal: (val: boolean) => void;
  isGeneratingCampaign?: boolean;
  campaignStatus?: string;
  campaignError?: string | null;
  campaignPosts: SocialPostCampaignItem[] | null;
  handleAutoGenerateCampaignPosts?: () => void;
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  onUpdateCampaignModel?: (model: string) => void;
}

export const CampaignWorkspaceHeader: React.FC<CampaignWorkspaceHeaderProps> = ({
  currentCampaign,
  onSelectCampaign,
  onDeleteCampaign,
  isRenaming,
  setIsRenaming,
  tempName,
  setTempName,
  handleRenameSave,
  getPlatformBadgeColor,
  getPlatformIcon,
  onOpenAddPostModal,
  showSingleAIPostForm,
  setShowSingleAIPostForm,
  setShowRefinementModal,
  isGeneratingCampaign,
  campaignStatus,
  campaignError,
  handleAutoGenerateCampaignPosts,
  showDetails,
  setShowDetails,
  onUpdateCampaignModel,
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 md:p-4 sticky top-0 z-30 space-y-3">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectCampaign(null)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Back to Campaigns List"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSave();
                      if (e.key === 'Escape') setIsRenaming(false);
                    }}
                    autoFocus
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-purple-500 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRenameSave}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-base md:text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{currentCampaign.name}</span>
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(currentCampaign.name);
                      setIsRenaming(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Rename Campaign"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Platform Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${getPlatformBadgeColor(currentCampaign.platform)}`}>
                {getPlatformIcon(currentCampaign.platform)}
                <span>{currentCampaign.platform}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono font-medium">{currentCampaign.posts?.length || 0} Posts Planned</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-purple-650 dark:text-purple-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer uppercase text-[9px] tracking-wider"
              >
                <span>{showDetails ? 'Hide details' : 'Show details'}</span>
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right side control tools */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-start md:justify-end">
          {/* AI Model Switcher — always visible in header */}
          {onUpdateCampaignModel && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shrink-0" title="AI Generation Model">
              <Cpu className="w-3 h-3 text-purple-400 shrink-0" />
              <select
                value={currentCampaign.aiModel || 'gemini-3.6-flash'}
                onChange={(e) => onUpdateCampaignModel(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer min-w-0"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                <option value="gemini-flash-latest">Gemini Flash Latest</option>
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenAddPostModal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200/40 dark:border-slate-700/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSingleAIPostForm(!showSingleAIPostForm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              showSingleAIPostForm
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Post</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRefinementModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Refine</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteCampaign(currentCampaign.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
            title="Delete Entire Campaign"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Campaign Auto Generation State Banner */}
      {isGeneratingCampaign && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center gap-3 text-xs text-purple-800 dark:text-purple-300 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <div>
            <h4 className="font-bold">AI Multi-Post Campaign Generation in Progress...</h4>
            <p className="text-[11px] text-purple-600/80 dark:text-purple-300/80 font-mono">
              {campaignStatus || 'Synthesizing viral post concepts, visual style prompts, captions, and hashtags...'}
            </p>
          </div>
        </div>
      )}

      {campaignError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <span>⚠️ {campaignError}</span>
          {handleAutoGenerateCampaignPosts && (
            <button
              type="button"
              onClick={handleAutoGenerateCampaignPosts}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};
