import React, { useState } from 'react';
import { BookOpen, FileSpreadsheet, Calendar, Trash2, Play, Sparkles, Layout, Sparkle } from 'lucide-react';
import { DraftPrompt } from '../../types';

interface BlueprintDraftsProps {
  drafts: DraftPrompt[];
  onDeleteDraft: (id: string) => void;
  onLaunchDraft: (draft: DraftPrompt) => void;
  onOpenCreateModal: () => void;
}

export const BlueprintDrafts: React.FC<BlueprintDraftsProps> = ({
  drafts,
  onDeleteDraft,
  onLaunchDraft,
  onOpenCreateModal,
}) => {
  const [filterSource, setFilterSource] = useState<'all' | 'campaign' | 'canvas'>('all');

  const filteredDrafts = (drafts || []).filter(draft => {
    if (!draft) return false;
    if (filterSource === 'campaign') return draft.sourceType === 'campaign';
    if (filterSource === 'canvas') return draft.sourceType === 'visual-canvas' || draft.sourceType === 'manual' || !draft.sourceType;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <span>Saved Content Drafts</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Browse, manage, and load saved blueprint prompts into the Visual Canvas.
          </p>
        </div>

        {/* Source Category Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterSource === 'all' 
                ? 'bg-purple-600 text-white font-bold shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({drafts.length})
          </button>
          <button
            onClick={() => setFilterSource('campaign')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterSource === 'campaign' 
                ? 'bg-purple-600 text-white font-bold shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Campaigns ({drafts.filter(d => d.sourceType === 'campaign').length})
          </button>
          <button
            onClick={() => setFilterSource('canvas')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterSource === 'canvas' 
                ? 'bg-purple-600 text-white font-bold shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Canvas / Manual ({drafts.filter(d => d.sourceType === 'visual-canvas' || d.sourceType === 'manual' || !d.sourceType).length})
          </button>
        </div>
      </div>

      {filteredDrafts.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-16 text-center bg-white dark:bg-slate-900/40 backdrop-blur-sm min-h-[300px] flex flex-col justify-center items-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5 text-purple-500 flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No matching drafts saved yet</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Compose custom configurations or save prompts directly from Social Campaigns into this persistent vault.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-6 px-4 py-2 bg-slate-900 dark:bg-purple-900/30 border border-slate-800 dark:border-purple-500/20 text-slate-100 dark:text-purple-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Compose your first draft
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredDrafts.map((draft) => (
            <div 
              key={draft.id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {draft.sourceType === 'campaign' ? (
                      <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{draft.sourceCampaignName ? `Campaign: ${draft.sourceCampaignName}` : 'Social Campaign'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                        <Layout className="w-3 h-3 text-blue-400" />
                        <span>Visual Canvas</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                      {draft.resolution}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteDraft(draft.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Topic / Title */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {draft.topic}
                </h3>
                
                {/* Visual Prompt snippet if present */}
                {draft.visualPrompt && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic font-mono line-clamp-3 leading-relaxed">
                    {draft.visualPrompt}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-semibold rounded-md">
                    Style: {draft.visualStyle}
                  </span>
                  {draft.slideNumber && (
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-bold rounded-md">
                      Slide #{draft.slideNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => onLaunchDraft(draft)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-500/10 flex items-center gap-2 cursor-pointer"
                  title="Load into Visual Canvas Input Field"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Load into Studio</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
