import React from 'react';
import { Globe, Trash2, Edit3, Copy, CalendarClock } from 'lucide-react';
import { SavedBlogDraft, PublishEndpointConfig } from '../../../types';
import { BlogPostResult } from '../../../services/geminiService';

interface PublishedBlogPostsTabProps {
  publishedBlogPosts: SavedBlogDraft[];
  publishEndpoints: PublishEndpointConfig[];
  handleSaveBlogDraft: (data: any, status: 'draft' | 'scheduled' | 'published', scheduledAt?: string) => Promise<any>;
  handleDeleteBlogDraft: (id: string) => void;
  setBlogViewMode: (mode: any) => void;
  setBlogResult: React.Dispatch<React.SetStateAction<BlogPostResult | null>>;
  setActiveDraftId: (id: string) => void;
}

export const PublishedBlogPostsTab: React.FC<PublishedBlogPostsTabProps> = ({
  publishedBlogPosts,
  publishEndpoints,
  handleSaveBlogDraft,
  handleDeleteBlogDraft,
  setBlogViewMode,
  setBlogResult,
  setActiveDraftId,
}) => {
  const openInEditor = (draft: SavedBlogDraft) => {
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

  const duplicateAsDraft = async (draft: SavedBlogDraft) => {
    await handleSaveBlogDraft({
      title: `${draft.title} (Copy)`,
      excerpt: draft.excerpt,
      metaDescription: draft.metaDescription,
      keywords: draft.keywords,
      markdownContent: draft.markdownContent,
    }, 'draft');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Published Blog Posts</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {publishedBlogPosts.length} published {publishedBlogPosts.length === 1 ? 'post' : 'posts'}. The AI references these titles, summaries, keywords, and slugs when creating new posts to prevent duplicates.
          </p>
        </div>
      </div>

      {publishedBlogPosts.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Globe className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Published Posts Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you publish a post it moves out of drafts and appears here, where it becomes reference context for future generations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {publishedBlogPosts.map(post => {
            const endpoint = publishEndpoints.find(e => e.id === post.publishedEndpointId);
            return (
              <div
                key={post.id}
                className="p-4 bg-white dark:bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Published
                      </span>
                      {post.publishedAt && (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {endpoint && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {endpoint.name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      {post.title}
                    </h4>

                    {post.slug && (
                      <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 truncate">
                        /{post.slug}
                      </p>
                    )}

                    {post.metaDescription && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.metaDescription}
                      </p>
                    )}

                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.keywords.slice(0, 6).map((k, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            #{k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => duplicateAsDraft(post)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                      title="Duplicate as new draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openInEditor(post)}
                      className="p-1.5 text-slate-400 hover:text-purple-500 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                      title="Open in editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlogDraft(post.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
