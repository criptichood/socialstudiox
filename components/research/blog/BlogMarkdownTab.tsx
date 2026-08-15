import React from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const insertImageAtCursor = (dataUrl: string, alt: string) => {
    const el = textareaRef.current;
    const markdownTag = `![${alt}](${dataUrl})`;
    if (!el) {
      handleMarkdownContentEdit(`${blogResult.markdownContent}\n\n${markdownTag}\n\n`);
      return;
    }
    const start = el.selectionStart ?? blogResult.markdownContent.length;
    const end = el.selectionEnd ?? blogResult.markdownContent.length;
    const prefix = start > 0 && !blogResult.markdownContent[start - 1].match(/\s/) ? '\n\n' : start === 0 ? '' : '\n';
    const suffix = '\n\n';
    const next = blogResult.markdownContent.slice(0, start) + prefix + markdownTag + suffix + blogResult.markdownContent.slice(end);
    handleMarkdownContentEdit(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length + markdownTag.length, start + prefix.length + markdownTag.length);
    });
  };

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      insertImageAtCursor(reader.result as string, file.name.replace(/\.[^.]+$/, '') || 'Uploaded Image');
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  };

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
          <span className="flex items-center gap-2">
            <span>Auto-saves live & recalculates metrics</span>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
              <span>Upload Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIsUploading(true);
                  handleUploadImage(file);
                }
                e.target.value = '';
              }}
            />
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={blogResult.markdownContent}
          onChange={(e) => handleMarkdownContentEdit(e.target.value)}
          className="w-full h-80 p-4 font-mono text-xs bg-slate-900 text-purple-200 rounded-xl border border-slate-800 outline-none resize-y leading-relaxed focus:ring-2 focus:ring-purple-500/40"
          placeholder="Type or edit markdown blog post..."
        />
        <p className="text-[10px] text-slate-400 font-mono">
          Tip: upload an image to insert its markdown reference at the cursor. You can also paste any hosted image URL directly as ![alt](url).
        </p>
      </div>
    </div>
  );
};
