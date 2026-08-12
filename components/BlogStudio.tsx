import React, { useEffect } from 'react';
import { BookOpen, ChevronLeft, FileText, Loader2, Plus } from 'lucide-react';
import { useBlogEngine } from '@/hooks/useBlogEngine';
import { BlogStudioTabs } from './research/blog/BlogStudioTabs';

interface BlogStudioProps {
  onBackToDashboard?: () => void;
}

export const BlogStudio: React.FC<BlogStudioProps> = ({ onBackToDashboard }) => {
  const engine = useBlogEngine();
  const {
    blogResult,
    savedBlogDrafts,
    isGeneratingBlog,
    generateBlogPost,
    setBlogTopicOverride,
    setIsNewPostComposerOpen,
  } = engine;

  // Support deep links: /blog?topic=...&context=... prefills + auto-generates.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    if (topic) {
      setBlogTopicOverride(topic);
    }
    if (params.get('open') === '1' && topic) {
      generateBlogPost(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-950">
        {/* Page Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit border border-slate-700 shadow-sm shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-purple-400" />
                <span>Back</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <span>Blog Studio</span>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-md text-[10px] font-mono font-semibold uppercase">
                  SEO & Webhook Automated
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Write, edit, optimize, and publish long-form blog posts. All history of published & draft posts lives here.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewPostComposerOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Blog Post</span>
            </button>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>{savedBlogDrafts.length} saved {savedBlogDrafts.length === 1 ? 'post' : 'posts'}</span>
            </span>
            {isGeneratingBlog && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </span>
            )}
          </div>
        </div>

        {/* Tabs Body (Preview / Markdown / Drafts / Published / Schedules / Webhooks) */}
        <BlogStudioTabs engine={engine} />

        {/* Footer status for the active post */}
        {blogResult && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono truncate">
              Current: <strong className="text-slate-800 dark:text-slate-200">{blogResult.title}</strong>
            </span>
            <span className="font-mono shrink-0 ml-3">
              {blogResult.characterCount.toLocaleString()} chars • {blogResult.readingTimeMinutes} min read • {blogResult.embeddedImagesCount} images
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
