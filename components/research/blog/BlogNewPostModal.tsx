import React, { useEffect } from 'react';
import { Sparkles, Loader2, Lightbulb, X, Check, Send } from 'lucide-react';
import { toast } from 'sonner';
import { UseBlogEngineReturn } from '@/hooks/useBlogEngine';

interface BlogNewPostModalProps {
  engine: UseBlogEngineReturn;
  onGeneratePost?: (topic: string) => Promise<void> | void;
}

export const BlogNewPostModal: React.FC<BlogNewPostModalProps> = ({ engine, onGeneratePost }) => {
  const {
    isNewPostComposerOpen,
    setIsNewPostComposerOpen,
    newPostIdeaInput,
    setNewPostIdeaInput,
    ideaOptions,
    setIdeaOptions,
    isGeneratingIdeas,
    isGeneratingBlog,
    generateTopicIdeas,
    generateBlogPost,
  } = engine;

  useEffect(() => {
    if (!isNewPostComposerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGeneratingBlog) setIsNewPostComposerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isNewPostComposerOpen, setIsNewPostComposerOpen, isGeneratingBlog]);

  const handleGenerate = async (topic: string) => {
    const cleanTopic = topic.trim();
    if (!cleanTopic || isGeneratingBlog) return;
    try {
      let ok = false;
      if (onGeneratePost) {
        await onGeneratePost(cleanTopic);
        ok = true;
      } else {
        const result = await generateBlogPost(cleanTopic);
        ok = Boolean(result);
      }
      if (ok) {
        setNewPostIdeaInput('');
        setIdeaOptions([]);
        setIsNewPostComposerOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate blog post.');
    }
  };

  const handleLucky = async () => {
    try {
      await generateTopicIdeas();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate topic ideas.');
    }
  };

  if (!isNewPostComposerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        if (!isGeneratingBlog) setIsNewPostComposerOpen(false);
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Create a New Blog Post
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Describe the post idea. The AI reviews your published posts to avoid duplicates.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isGeneratingBlog}
            onClick={() => setIsNewPostComposerOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {isGeneratingBlog ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Generating your blog post...
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    The AI is reviewing your published posts to avoid duplicate content, then writing the article with SEO structure and section image prompts.
                  </p>
                </div>
                <div className="w-full space-y-2 pt-1">
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: '90%' }} />
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: '70%' }} />
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Blog Post Idea:
            </label>
            <textarea
              value={newPostIdeaInput}
              onChange={(e) => setNewPostIdeaInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate(newPostIdeaInput);
              }}
              rows={3}
              placeholder="e.g. A complete guide to building an AI content pipeline for B2B teams..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none resize-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingBlog || !newPostIdeaInput.trim()}
              onClick={() => handleGenerate(newPostIdeaInput)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingBlog ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                  <span>Synthesizing Post...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate Post</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGeneratingIdeas || isGeneratingBlog}
              onClick={handleLucky}
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingIdeas ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Thinking of ideas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>I'm Feeling Lucky</span>
                </>
              )}
            </button>
          </div>

          {isGeneratingIdeas ? (
            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-pulse" />
              <div className="h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-pulse" />
              <div className="h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
          ) : ideaOptions.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Pick an idea to generate it right away:
              </label>
              {ideaOptions.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isGeneratingBlog}
                  onClick={() => {
                    setNewPostIdeaInput(idea.title);
                    handleGenerate(idea.title);
                  }}
                  className="w-full text-left p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-xl transition-all space-y-1 group cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {idea.title}
                    </span>
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                  </span>
                  {idea.angle && (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {idea.angle}
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIdeaOptions([])}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
              >
                Hide ideas
              </button>
            </div>
          ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
