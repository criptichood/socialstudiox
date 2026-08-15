import React from 'react';
import { BookOpen, Calendar, Clock, Trash2, Edit3, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { SavedBlogDraft, PublishEndpointConfig } from '../../../types';
import { BlogPostResult } from '../../../services/geminiService';

interface SavedBlogDraftsTabProps {
  savedBlogDrafts: SavedBlogDraft[];
  scheduleDateTime: string;
  handleSaveBlogDraft: (data: any, status: 'draft' | 'scheduled' | 'published', scheduledAt?: string) => Promise<any>;
  handleDeleteBlogDraft: (id: string) => void;
  setSelectedDraftForScheduleId: (id: string) => void;
  setNewCronTitle: (val: string) => void;
  setBlogViewMode: (mode: any) => void;
  setBlogResult: React.Dispatch<React.SetStateAction<BlogPostResult | null>>;
  setActiveDraftId: (id: string) => void;
  publishEndpoints: PublishEndpointConfig[];
  selectedEndpointId: string;
  setSelectedEndpointId: (id: string) => void;
  handlePublishBlogToEndpoint: (draft?: SavedBlogDraft) => void;
  isPublishing: boolean;
  publishingDraftId: string | null;
}

export const SavedBlogDraftsTab: React.FC<SavedBlogDraftsTabProps> = ({
  savedBlogDrafts,
  scheduleDateTime,
  handleSaveBlogDraft,
  handleDeleteBlogDraft,
  setSelectedDraftForScheduleId,
  setNewCronTitle,
  setBlogViewMode,
  setBlogResult,
  setActiveDraftId,
  publishEndpoints,
  selectedEndpointId,
  setSelectedEndpointId,
  handlePublishBlogToEndpoint,
  publishingDraftId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>Saved Blog Drafts & Scheduled Publications</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage drafts, select date/time to schedule publishing, or directly publish to configured webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEndpointId}
            onChange={(e) => setSelectedEndpointId(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            {publishEndpoints.map(e => (
              <option key={e.id} value={e.id}>
                Endpoint: {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {savedBlogDrafts.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Saved Drafts Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a new post with "New Post" or "I'm feeling lucky", then refine it and save it to drafts to manage it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {savedBlogDrafts.map(draft => (
            <div
              key={draft.id}
              className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 rounded-2xl transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                      draft.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : draft.status === 'scheduled'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                    }`}>
                      {draft.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {draft.readingTimeMinutes || 4} min read • {(draft.characterCount || draft.markdownContent.length).toLocaleString()} chars
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    {draft.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteBlogDraft(draft.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {draft.markdownContent.slice(0, 150)}
              </p>

              {/* Interactive Schedule date/time picker & actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Set Date:</span>
                  <input
                    type="datetime-local"
                    value={draft.scheduledAt ? new Date(draft.scheduledAt).toISOString().slice(0, 16) : scheduleDateTime}
                    onChange={async (e) => {
                      const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                      await handleSaveBlogDraft({
                        id: draft.id,
                        title: draft.title,
                        markdownContent: draft.markdownContent,
                      }, newDate ? 'scheduled' : 'draft', newDate);
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                {draft.scheduledAt && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    ⏰ Scheduled for {new Date(draft.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                {draft.publishedAt && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    Published: {new Date(draft.publishedAt).toLocaleDateString()}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDraftForScheduleId(draft.id);
                      setNewCronTitle(draft.title);
                      setBlogViewMode('schedules');
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Schedule Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBlogResult({
                        title: draft.title,
                        markdownContent: draft.markdownContent,
                        characterCount: draft.characterCount || draft.markdownContent.length,
                        readingTimeMinutes: draft.readingTimeMinutes || 4,
                        embeddedImagesCount: draft.embeddedImagesCount || 0,
                        sectionImagePrompts: draft.sectionImagePrompts || [],
                        relatedPosts: draft.relatedPosts || []
                      });
                      setActiveDraftId(draft.id);
                      setBlogViewMode('preview');
                    }}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Open in Editor</span>
                  </button>

                  <button
                    type="button"
                    disabled={publishingDraftId !== null}
                    onClick={() => handlePublishBlogToEndpoint(draft)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {publishingDraftId === draft.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{publishingDraftId === draft.id ? 'Publishing...' : 'Publish Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
