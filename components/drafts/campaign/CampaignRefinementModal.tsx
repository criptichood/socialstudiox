import React from 'react';
import { Sparkles, Wand2, Loader2, X } from 'lucide-react';

interface CampaignRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  refinementText: string;
  setRefinementText: (val: string) => void;
  isRefining: boolean;
  handleRefineCampaign: (e: React.FormEvent) => void;
}

export const CampaignRefinementModal: React.FC<CampaignRefinementModalProps> = ({
  isOpen,
  onClose,
  refinementText,
  setRefinementText,
  isRefining,
  handleRefineCampaign,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 pb-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Refine Campaign with AI
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Provide custom instructions to transform captions, tones, or visual styles.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRefineCampaign} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Refinement Instruction
              </label>
              <textarea
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="e.g. 'Make all captions more conversational and add call-to-actions asking followers to comment their thoughts'"
                rows={4}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-2xl text-xs text-slate-900 dark:text-white outline-none resize-none"
                required
              />
            </div>
          </div>

          <div className="p-6 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRefining || !refinementText.trim()}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Refining Posts...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Apply Refinement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
