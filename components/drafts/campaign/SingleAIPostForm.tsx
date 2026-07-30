import React from 'react';
import { Wand2, Loader2, X } from 'lucide-react';

interface SingleAIPostFormProps {
  show: boolean;
  onClose: () => void;
  singlePostInstruction: string;
  setSinglePostInstruction: (val: string) => void;
  isGeneratingSinglePost: boolean;
  handleGenerateSinglePostAI: (e: React.FormEvent) => void;
}

export const SingleAIPostForm: React.FC<SingleAIPostFormProps> = ({
  show,
  onClose,
  singlePostInstruction,
  setSinglePostInstruction,
  isGeneratingSinglePost,
  handleGenerateSinglePostAI,
}) => {
  if (!show) return null;

  return (
    <div className="p-4 md:p-5 bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-slate-900/40 border-b border-purple-500/20 animate-in slide-in-from-top-2 duration-200">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 font-display">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span>Generate New Post using AI Instruction</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleGenerateSinglePostAI} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={singlePostInstruction}
            onChange={(e) => setSinglePostInstruction(e.target.value)}
            placeholder="Describe topic or hook for the new post (e.g. 'Create a carousel post breaking down 3 SaaS pricing mistakes')..."
            className="flex-1 w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-purple-500 rounded-2xl text-xs text-slate-900 dark:text-white outline-none"
            required
          />
          <button
            type="submit"
            disabled={isGeneratingSinglePost || !singlePostInstruction.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isGeneratingSinglePost ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Post</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
