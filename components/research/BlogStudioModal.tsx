import React, { useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { UseBlogEngineReturn } from '@/hooks/useBlogEngine';
import { BlogStudioTabs } from './blog/BlogStudioTabs';

interface BlogStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleGenerateBlogPost: (forcedTopic?: string, forcedContext?: string) => Promise<void>;
  engine: UseBlogEngineReturn;
}

export const BlogStudioModal: React.FC<BlogStudioModalProps> = ({
  isOpen,
  onClose,
  handleGenerateBlogPost,
  engine,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white dark:bg-slate-950 h-full flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <span>Blog Studio</span>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-md text-[10px] font-mono font-semibold uppercase">
                  Quick Create
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate, refine, and publish blog posts right from your research session.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-200/70 dark:bg-slate-800/70 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="text-xs font-bold">Close</span>
          </button>
        </div>

        {/* Shared Tabs Body */}
        <div className="flex-1 min-h-0">
          <BlogStudioTabs engine={engine} onGeneratePost={(topic) => handleGenerateBlogPost(topic)} />
        </div>
      </div>
    </div>
  );
};
