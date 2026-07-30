import React from 'react';
import { BlogPostResult } from '../../../services/geminiService';

interface BlogMarkdownTabProps {
  blogResult: BlogPostResult;
  handleMarkdownContentEdit: (val: string) => void;
  activeDraftId: string | null;
  handleSaveBlogDraft: (data: any, status: 'draft' | 'scheduled' | 'published') => void;
  setBlogResult: React.Dispatch<React.SetStateAction<BlogPostResult | null>>;
}

export const BlogMarkdownTab: React.FC<BlogMarkdownTabProps> = ({
  blogResult,
  handleMarkdownContentEdit,
  activeDraftId,
  handleSaveBlogDraft,
  setBlogResult,
}) => {
  const currentSlug = blogResult.slug || blogResult.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200) || 'blog-post';

  const currentExcerpt = blogResult.excerpt || blogResult.metaDescription || blogResult.markdownContent.slice(0, 160).replace(/[#*`!\[\]()]/g, '');

  return (
    <div className="space-y-4">
      {/* SEO Slug & Meta Description Customization */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-display">
          🔍 SEO Meta & Webhook Payload Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              URL Slug:
            </label>
            <input
              type="text"
              value={currentSlug}
              onChange={(e) => {
                const newSlug = e.target.value;
                const updated = { ...blogResult, slug: newSlug };
                setBlogResult(updated);
                handleSaveBlogDraft({
                  id: activeDraftId || undefined,
                  title: blogResult.title,
                  slug: newSlug,
                  markdownContent: blogResult.markdownContent
                }, 'draft');
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Meta Description / Excerpt Summary:
            </label>
            <textarea
              value={currentExcerpt}
              onChange={(e) => {
                const newExcerpt = e.target.value;
                const updated = { ...blogResult, excerpt: newExcerpt, metaDescription: newExcerpt };
                setBlogResult(updated);
                handleSaveBlogDraft({
                  id: activeDraftId || undefined,
                  title: blogResult.title,
                  excerpt: newExcerpt,
                  markdownContent: blogResult.markdownContent
                }, 'draft');
              }}
              rows={2}
              placeholder="Short summary for SEO cards & webhook payloads..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Raw Markdown Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Full Markdown Content Editor:</span>
          <span>Auto-saves live & recalculates metrics</span>
        </div>
        <textarea
          value={blogResult.markdownContent}
          onChange={(e) => handleMarkdownContentEdit(e.target.value)}
          className="w-full h-80 p-4 font-mono text-xs bg-slate-900 text-purple-200 rounded-xl border border-slate-800 outline-none resize-y leading-relaxed focus:ring-2 focus:ring-purple-500/40"
          placeholder="Type or edit markdown blog post..."
        />
      </div>
    </div>
  );
};
