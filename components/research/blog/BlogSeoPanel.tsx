import React from 'react';
import { Sparkles, Loader2, Check, Wand2, RefreshCw } from 'lucide-react';
import { UseBlogEngineReturn } from '@/hooks/useBlogEngine';

interface BlogSeoPanelProps {
  engine: UseBlogEngineReturn;
  compact?: boolean;
}

export const BlogSeoPanel: React.FC<BlogSeoPanelProps> = ({ engine, compact = false }) => {
  const {
    blogResult,
    activeDraftId,
    handleSaveBlogDraft,
    isSeoSuggesting,
    seoSuggestions,
    suggestSeo,
    applySeoTitle,
    applySeoMeta,
    applySeoKeywords,
  } = engine;

  const [appliedMeta, setAppliedMeta] = React.useState(false);
  const [appliedKeywords, setAppliedKeywords] = React.useState(false);

  if (!blogResult) return null;

  const currentSlug = blogResult.slug || blogResult.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200) || 'blog-post';

  const currentMeta = blogResult.metaDescription || blogResult.excerpt || '';
  const currentKeywords = (blogResult.keywords || []).join(', ');

  const saveField = (patch: any) => {
    handleSaveBlogDraft({
      id: activeDraftId || undefined,
      title: blogResult?.title,
      markdownContent: blogResult?.markdownContent,
      ...patch,
    }, 'draft');
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-display flex items-center gap-1.5">
          <Wand2 className="w-4 h-4 text-purple-500" />
          <span>SEO & Slug Optimization</span>
        </h4>
        <button
          type="button"
          disabled={isSeoSuggesting}
          onClick={() => suggestSeo()}
          className="px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSeoSuggesting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing SEO...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Get AI SEO Suggestions</span>
            </>
          )}
        </button>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
          <span>URL Slug:</span>
          <button
            type="button"
            onClick={() => {
              const newSlug = blogResult.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200) || 'blog-post';
              const updated = { ...blogResult, slug: newSlug };
              engine.setBlogResult(updated);
              saveField({ slug: newSlug });
            }}
            className="text-[10px] text-purple-600 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Regenerate from title</span>
          </button>
        </label>
        <input
          type="text"
          value={currentSlug}
          onChange={(e) => {
            const newSlug = e.target.value;
            const updated = { ...blogResult, slug: newSlug };
            engine.setBlogResult(updated);
            saveField({ slug: newSlug });
          }}
          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
        />
      </div>

      {/* AI Title Suggestions */}
      {seoSuggestions && seoSuggestions.titleOptions.length > 0 && (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
            AI Suggested Headlines (click to apply):
          </label>
          <div className="flex flex-wrap gap-2">
            {seoSuggestions.titleOptions.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applySeoTitle(t)}
                className="px-3 py-1.5 bg-white dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-semibold text-purple-800 dark:text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-left">{t}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta Description */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          Meta Description / Excerpt:
        </label>
        <div className="flex items-start gap-2">
          <textarea
            value={currentMeta}
            onChange={(e) => {
              const newMeta = e.target.value;
              const updated = { ...blogResult, metaDescription: newMeta, excerpt: newMeta };
              engine.setBlogResult(updated);
              setAppliedMeta(false);
            }}
            rows={2}
            placeholder="Short summary for SEO cards & webhook payloads..."
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none resize-none"
          />
          <button
            type="button"
            onClick={() => {
              const newMeta = blogResult.metaDescription || '';
              applySeoMeta(newMeta);
              setAppliedMeta(true);
              setTimeout(() => setAppliedMeta(false), 2000);
            }}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
          >
            {appliedMeta ? <Check className="w-4 h-4 text-emerald-300" /> : 'Apply'}
          </button>
        </div>
        {seoSuggestions && seoSuggestions.metaDescription && (
          <button
            type="button"
            onClick={() => {
              const updated = { ...blogResult, metaDescription: seoSuggestions.metaDescription, excerpt: seoSuggestions.metaDescription };
              engine.setBlogResult(updated);
              saveField({ metaDescription: seoSuggestions.metaDescription, excerpt: seoSuggestions.metaDescription });
            }}
            className="mt-1.5 px-2.5 py-1 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/30 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>Use AI-suggested: {seoSuggestions.metaDescription.slice(0, 60)}...</span>
          </button>
        )}
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          SEO Keywords (comma-separated):
        </label>
        <div className="flex items-start gap-2">
          <input
            type="text"
            value={currentKeywords}
            onChange={(e) => {
              const newKeywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
              const updated = { ...blogResult, keywords: newKeywords };
              engine.setBlogResult(updated);
              setAppliedKeywords(false);
            }}
            placeholder="ai content strategy, b2b marketing..."
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const newKeywords = (blogResult.keywords || []).slice();
              applySeoKeywords(newKeywords);
              setAppliedKeywords(true);
              setTimeout(() => setAppliedKeywords(false), 2000);
            }}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
          >
            {appliedKeywords ? <Check className="w-4 h-4 text-emerald-300" /> : 'Apply'}
          </button>
        </div>
        {seoSuggestions && seoSuggestions.keywords.length > 0 && (
          <button
            type="button"
            onClick={() => {
              applySeoKeywords(seoSuggestions.keywords);
            }}
            className="mt-1.5 px-2.5 py-1 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/30 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>Use AI keywords: {seoSuggestions.keywords.join(', ')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
