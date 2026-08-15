import React from 'react';
import { Sparkles, ImageIcon, CheckCircle2, Loader2, Plus, Edit3, CloudUpload, Cloud, Link2, ExternalLink, BookOpen } from 'lucide-react';
import { BlogPostResult, SectionImagePrompt, BlogRelatedPost } from '../../../services/geminiService';
import { BlogMarkdownRenderer } from './BlogMarkdownRenderer';
import { SavedBlogDraft } from '../../../types';

interface BlogPreviewTabProps {
  blogResult: BlogPostResult;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  customTitleInput: string;
  setCustomTitleInput: (val: string) => void;
  handleSaveTitleEdit: () => void;
  customSectionPromptInput: string;
  setCustomSectionPromptInput: (val: string) => void;
  handleAddCustomImagePrompt: () => void;
  generatingPromptId: string | null;
  uploadingPromptId: string | null;
  handleGenerateSectionImage: (promptObj: SectionImagePrompt) => void;
  handleUploadSectionImage: (promptObj: SectionImagePrompt) => void;
  relatedPosts?: BlogRelatedPost[];
  savedBlogDrafts?: SavedBlogDraft[];
  setBlogResult?: React.Dispatch<React.SetStateAction<BlogPostResult | null>>;
  setActiveDraftId?: (id: string) => void;
  setBlogViewMode?: (mode: any) => void;
}

export const BlogPreviewTab: React.FC<BlogPreviewTabProps> = ({
  blogResult,
  isEditingTitle,
  setIsEditingTitle,
  customTitleInput,
  setCustomTitleInput,
  handleSaveTitleEdit,
  customSectionPromptInput,
  setCustomSectionPromptInput,
  handleAddCustomImagePrompt,
  generatingPromptId,
  uploadingPromptId,
  handleGenerateSectionImage,
  handleUploadSectionImage,
  relatedPosts = [],
  savedBlogDrafts = [],
  setBlogResult,
  setActiveDraftId,
  setBlogViewMode,
}) => {
  const openRelatedInEditor = (slug: string) => {
    const draft = savedBlogDrafts.find(d => d.slug && d.slug.replace(/\/+$/, '') === slug.replace(/\/+$/, ''));
    if (!draft || !setBlogResult || !setActiveDraftId || !setBlogViewMode) return;
    setBlogResult({
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt || draft.metaDescription,
      metaDescription: draft.metaDescription || draft.excerpt,
      keywords: draft.keywords || [],
      markdownContent: draft.markdownContent,
      characterCount: draft.characterCount || draft.markdownContent.length,
      readingTimeMinutes: draft.readingTimeMinutes || 4,
      embeddedImagesCount: draft.embeddedImagesCount || 0,
      sectionImagePrompts: draft.sectionImagePrompts || [],
      relatedPosts: draft.relatedPosts || []
    });
    setActiveDraftId(draft.id);
    setBlogViewMode('preview');
  };

  return (
    <div className="space-y-6">
      {/* Blog Title Header with Edit Capability */}
      <div className="p-5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-purple-300">
          <span>Blog Title Preview:</span>
          {!isEditingTitle && (
            <button
              type="button"
              onClick={() => {
                setCustomTitleInput(blogResult.title);
                setIsEditingTitle(true);
              }}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Title</span>
            </button>
          )}
        </div>

        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customTitleInput}
              onChange={(e) => setCustomTitleInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-purple-500/50 rounded-xl text-sm font-bold text-white outline-none"
            />
            <button
              type="button"
              onClick={handleSaveTitleEdit}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
            >
              Save
            </button>
          </div>
        ) : (
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            {blogResult.title}
          </h1>
        )}
      </div>

      {/* Main Rendered Markdown Preview */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <BlogMarkdownRenderer
          content={blogResult.markdownContent}
          blogResult={blogResult}
          generatingPromptId={generatingPromptId}
          uploadingPromptId={uploadingPromptId}
          onGenerateSectionImage={handleGenerateSectionImage}
          onUploadSectionImage={handleUploadSectionImage}
        />
      </div>

      {/* Add Custom Image Prompt Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-display">
            <Plus className="w-4 h-4 text-purple-500" />
            <span>Add Custom Image Prompt to Blog</span>
          </h4>
          <span className="text-[10px] text-slate-500">
            Appends an image prompt placeholder into markdown
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customSectionPromptInput}
            onChange={(e) => setCustomSectionPromptInput(e.target.value)}
            placeholder="e.g. Infographic showing 5-step growth strategy framework"
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <button
            type="button"
            onClick={handleAddCustomImagePrompt}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert Prompt</span>
          </button>
        </div>
      </div>

      {/* Section Image Prompts & On-Demand Image Generator Bar */}
      {blogResult.sectionImagePrompts && blogResult.sectionImagePrompts.length > 0 && (
        <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border-t border-slate-200 dark:border-slate-800 space-y-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Section Image Prompts ({blogResult.sectionImagePrompts.length})</span>
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Click generate to create visual infographics for section positions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {blogResult.sectionImagePrompts.map((pObj: SectionImagePrompt) => (
              <div
                key={pObj.id}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 font-mono uppercase">
                    Section Prompt Placeholder
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                    "{pObj.prompt}"
                  </p>
                </div>

                {pObj.previewDataUrl ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                      <img src={pObj.previewDataUrl} alt="Section Infographic preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      disabled={uploadingPromptId === pObj.id}
                      onClick={() => handleUploadSectionImage(pObj)}
                      className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {uploadingPromptId === pObj.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>Upload Image to Blog</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>Generated preview — upload to embed</span>
                    </span>
                  </div>
                ) : pObj.generatedUrl ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                      <img src={pObj.generatedUrl} alt="Section Infographic" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Uploaded & Embedded in Blog</span>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={generatingPromptId === pObj.id}
                    onClick={() => handleGenerateSectionImage(pObj)}
                    className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    {generatingPromptId === pObj.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating 16:9 Image...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>🎨 Generate Image for Section</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Posts / SEO Backlinks Panel */}
      {relatedPosts.length > 0 && (
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Link2 className="w-4 h-4 text-emerald-500" />
              <span>Related Posts & Backlinks ({relatedPosts.length})</span>
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Interlinks to previously published posts for SEO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatedPosts.map((rp, idx) => {
              const localDraft = savedBlogDrafts.find(d => d.slug && d.slug.replace(/\/+$/, '') === rp.slug.replace(/\/+$/, ''));
              return (
                <div
                  key={`${rp.slug}-${idx}`}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase">
                        #{idx + 1} Backlink
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {rp.title}
                      </p>
                      <p className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 truncate">
                        /{rp.slug}
                      </p>
                    </div>
                    <a
                      href={rp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors shrink-0"
                      title="Open backlink URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  {localDraft && (
                    <button
                      type="button"
                      onClick={() => openRelatedInEditor(rp.slug)}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open Related Post</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
