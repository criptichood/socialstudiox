import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Lightbulb, X, Check, Send, GitBranch, Eye, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { UseBlogEngineReturn } from '@/hooks/useBlogEngine';
import { BlogTopicIdea } from '@/services/geminiService';

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
    isCuratingBlogBrief,
    generateTopicIdeas,
    generateBlogPost,
    nodeDiagramsEnabled,
    setNodeDiagramsEnabled,
  } = engine;

  // The composer also locks while a research reply is being curated into a
  // brief (isCuratingBlogBrief), so users see a clear transition instead of a
  // bare topic + toast, and don't mistake the loading phase for a broken app.
  const loading = isGeneratingBlog || isCuratingBlogBrief;

  useEffect(() => {
    if (!isNewPostComposerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) setIsNewPostComposerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isNewPostComposerOpen, setIsNewPostComposerOpen, loading]);

  const handleGenerate = async (topic: string) => {
    const cleanTopic = topic.trim();
    if (!cleanTopic || loading) return;
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

  const [previewIdea, setPreviewIdea] = useState<BlogTopicIdea | null>(null);

  if (!isNewPostComposerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        if (!loading) setIsNewPostComposerOpen(false);
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
            disabled={loading}
            onClick={() => setIsNewPostComposerOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    {isCuratingBlogBrief ? 'Curating your blog brief...' : 'Generating your blog post...'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {isCuratingBlogBrief
                      ? 'The AI is reading the research reply and distilling it into a rich post idea and angle, so the draft continues exactly where your research left off.'
                      : 'The AI is reviewing your published posts to avoid duplicate content, then writing the article with SEO structure and section image prompts.'}
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

          <div
            role="switch"
            aria-checked={nodeDiagramsEnabled}
            tabIndex={0}
            onClick={() => setNodeDiagramsEnabled(!nodeDiagramsEnabled)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setNodeDiagramsEnabled(!nodeDiagramsEnabled);
              }
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer select-none ${
              nodeDiagramsEnabled
                ? 'text-purple-600 dark:text-purple-400 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20'
                : 'text-slate-400 dark:text-slate-500 border-slate-300/60 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/40 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={
              nodeDiagramsEnabled
                ? 'Node diagrams ON — the AI may include visual flowcharts in the post'
                : 'Node diagrams OFF — the AI explains flows in plain Markdown only'
            }
          >
            <GitBranch className={`w-3.5 h-3.5 ${nodeDiagramsEnabled ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'}`} />
            <span>Node Diagrams</span>
            <span
              className={`relative inline-flex items-center h-4 w-7 rounded-full transition-colors ${
                nodeDiagramsEnabled ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
                  nodeDiagramsEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || !newPostIdeaInput.trim()}
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
              disabled={isGeneratingIdeas || loading}
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
                Pick an idea to generate it right away, or tap the eye to preview it first:
              </label>
              {ideaOptions.map((idea, i) => (
                <div
                  key={i}
                  className="group p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-xl transition-all space-y-1.5 cursor-pointer disabled:opacity-50"
                  onClick={() => {
                    setNewPostIdeaInput(idea.title);
                    handleGenerate(idea.title);
                  }}
                  role="button"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {idea.title}
                    </span>
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {idea.angle && (
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {idea.angle}
                      </span>
                    )}
                    {idea.diagram && idea.diagram !== 'none' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono bg-purple-500/10 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30" title={idea.diagramHint || 'Visual flowchart recommended'}>
                        <GitBranch className="w-2.5 h-2.5" /> Diagram
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewIdea(idea);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Eye className="w-3 h-3" /> View Details
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewPostIdeaInput(idea.title);
                        handleGenerate(idea.title);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Generate <ChevronRight className="w-3 h-3" />
                    </button>
                  </span>
                </div>
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

      {/* Topic detail preview overlay */}
      {previewIdea && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewIdea(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Suggested Topic
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Review the full idea before generating.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewIdea(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {previewIdea.title}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Angle & Audience
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {previewIdea.angle || '—'}
                </p>
              </div>
              {previewIdea.diagram && previewIdea.diagram !== 'none' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Node Diagram Plan
                  </label>
                  <div className="flex items-start gap-2 p-3 bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <GitBranch className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300">
                        {previewIdea.diagram}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {previewIdea.diagramHint || 'This post will include a visual flowchart rendered inline.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const idea = previewIdea;
                    setPreviewIdea(null);
                    setNewPostIdeaInput(idea.title);
                    handleGenerate(idea.title);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingBlog ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                      <span>Synthesizing Post...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Generate This Post</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewIdea(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
