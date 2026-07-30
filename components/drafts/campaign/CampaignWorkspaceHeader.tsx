import React from 'react';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Settings, 
  Plus, 
  Sparkles, 
  Wand2, 
  FileSpreadsheet, 
  Save, 
  Check, 
  X, 
  Loader2 
} from 'lucide-react';
import { AIModelDropdown } from '../../CustomDropdown';
import { SavedCampaign, SocialPostCampaignItem } from '../../DraftsPlanner';

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
  campaignPosts,
  handleAutoGenerateCampaignPosts,
  onUpdateCampaignModel,
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 sticky top-0 z-30 space-y-4">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectCampaign(null)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Back to Campaigns List"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="space-y-1">
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
                  <h1 className="text-lg md:text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
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
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Platform Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${getPlatformBadgeColor(currentCampaign.platform)}`}>
                {getPlatformIcon(currentCampaign.platform)}
                <span>{currentCampaign.platform}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Topic: <strong className="text-slate-700 dark:text-slate-200">{currentCampaign.mainTopic}</strong> • {currentCampaign.posts?.length || 0} Posts Planned
            </p>
          </div>
        </div>

        {/* Right side control tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Model Selector */}
          {onUpdateCampaignModel && (
            <div className="w-44">
              <AIModelDropdown
                value={currentCampaign.aiModel || 'gemini-3.6-flash'}
                onChange={(model) => onUpdateCampaignModel(model)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={onOpenAddPostModal}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">+ Post</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSingleAIPostForm(!showSingleAIPostForm)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showSingleAIPostForm
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>+ AI Post</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRefinementModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Refine Campaign</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteCampaign(currentCampaign.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
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
