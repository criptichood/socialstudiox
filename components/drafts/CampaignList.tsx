import React from 'react';
import { FolderOpen, PlusCircle, Trash2, Globe, ArrowRight } from 'lucide-react';
import { SavedCampaign } from '../DraftsPlanner';
import { AspectRatioIcon, getAspectShortLabel } from './AspectBadge';


interface CampaignListProps {
  savedCampaigns: SavedCampaign[];
  onSelectCampaign: (id: string | null) => void;
  onDeleteCampaign: (id: string) => void;
  onOpenCreateModal: () => void;
  getPlatformClass: (platform: string) => string;
  getPlatformBadgeColor: (platform: string) => string;
  getPlatformIcon: (platform: string) => React.ReactNode;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  savedCampaigns,
  onSelectCampaign,
  onDeleteCampaign,
  onOpenCreateModal,
  getPlatformClass,
  getPlatformBadgeColor,
  getPlatformIcon,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-purple-500" />
          <span>My Social Media Campaign Projects</span>
        </h2>
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {savedCampaigns.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center bg-white dark:bg-slate-900/10 backdrop-blur-sm min-h-[350px] flex flex-col justify-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5 text-purple-500 flex items-center justify-center mb-5">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">Manage campaigns as modular Projects</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Create discrete campaign containers with their own objectives and company landing page guidelines. Generate multi-post plans with AI, or build them post-by-post manually!
          </p>
          
          <button
            onClick={onOpenCreateModal}
            className="mt-6 px-5 py-2.5 bg-slate-900 dark:bg-purple-900/30 border border-slate-800 dark:border-purple-500/20 text-slate-100 dark:text-purple-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Start your first campaign project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {savedCampaigns.map((camp) => (
            <div 
              key={camp.id}
              className={`relative overflow-hidden border bg-white dark:bg-slate-900/50 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between group h-[260px] bg-gradient-to-br ${getPlatformClass(camp.platform)}`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 ${getPlatformBadgeColor(camp.platform)}`}>
                      {getPlatformIcon(camp.platform)}
                      <span>{camp.platform}</span>
                    </span>

                    {camp.posts.some(p => p.isCarousel || p.suggestedStyle === 'Carousel' || (p.slides && p.slides.length > 0)) && (
                      <span className="px-2 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 shadow-sm">
                        <span>🎠 Carousel</span>
                      </span>
                    )}

                    {camp.posts[0]?.aspectRatio && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <AspectRatioIcon aspect={camp.posts[0].aspectRatio} className="text-purple-500" />
                        <span>{getAspectShortLabel(camp.posts[0].aspectRatio)}</span>
                      </span>
                    )}

                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCampaign(camp.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete Campaign Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-955 dark:text-white mt-4 font-display group-hover:text-purple-400 transition-colors line-clamp-1">
                  {camp.name}
                </h3>

                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate max-w-[200px]">{camp.websiteUrl}</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {camp.mainTopic}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between mt-auto">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                  {camp.posts.length} Post{camp.posts.length !== 1 ? 's' : ''} Drafted
                </span>
                
                <button
                  onClick={() => onSelectCampaign(camp.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border border-slate-800 dark:border-purple-500/20 text-slate-100 dark:text-purple-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 group-hover:translate-x-0.5 cursor-pointer"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Create New Project Card Trigger */}
          <div 
            onClick={onOpenCreateModal}
            className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-6 min-h-[260px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all group"
          >
            <PlusCircle className="w-10 h-10 text-slate-400 group-hover:text-purple-500 transition-colors mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">New Campaign Space</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-[180px]">
              Establish a brand target with custom specifications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
