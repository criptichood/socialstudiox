import React from 'react';
import { 
  BookOpen, 
  X, 
  Sparkles, 
  Download, 
  Save, 
  CheckCircle2, 
  Clock, 
  Send, 
  Settings, 
  Copy, 
  Check, 
  Loader2, 
  AlertTriangle, 
  Globe 
} from 'lucide-react';
import { SavedBlogDraft, CronScheduleItem, PublishEndpointConfig, SavedCampaign } from '../../types';
import { BlogPostResult, SectionImagePrompt } from '../../services/geminiService';
import { BlogPreviewTab } from './blog/BlogPreviewTab';
import { BlogMarkdownTab } from './blog/BlogMarkdownTab';
import { SavedBlogDraftsTab } from './blog/SavedBlogDraftsTab';
import { CronSchedulesTab } from './blog/CronSchedulesTab';
import { WebhookSettingsTab } from './blog/WebhookSettingsTab';

interface BlogStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogResult: BlogPostResult | null;
  setBlogResult: React.Dispatch<React.SetStateAction<BlogPostResult | null>>;
  blogViewMode: 'preview' | 'markdown' | 'drafts' | 'schedules' | 'webhook-settings';
  setBlogViewMode: (mode: 'preview' | 'markdown' | 'drafts' | 'schedules' | 'webhook-settings') => void;
  isGeneratingBlog: boolean;
  savedCampaigns: SavedCampaign[];
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  blogTopicOverride: string;
  setBlogTopicOverride: (val: string) => void;
  blogTone: string;
  setBlogTone: (val: string) => void;
  blogWordCount: number;
  setBlogWordCount: (val: number) => void;
  blogAudience: string;
  setBlogAudience: (val: string) => void;
  blogSeoKeywords: string;
  setBlogSeoKeywords: (val: string) => void;
  handleGenerateBlogPost: (forcedTopic?: string, forcedContext?: string) => Promise<void>;
  isBlogCopied: boolean;
  setIsBlogCopied: (val: boolean) => void;
  isSavingDraft: boolean;
  setIsSavingDraft: (val: boolean) => void;
  draftSaveSuccess: boolean;
  setDraftSaveSuccess: (val: boolean) => void;
  isDownloadingMd: boolean;
  setIsDownloadingMd: (val: boolean) => void;
  handleSaveBlogDraft: (data: any, status: 'draft' | 'scheduled' | 'published', scheduledAt?: string) => Promise<any>;
  handleDeleteBlogDraft: (id: string) => void;
  savedBlogDrafts: SavedBlogDraft[];
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  cronSchedules: CronScheduleItem[];
  handleSaveCronSchedule: (item: CronScheduleItem) => Promise<any>;
  handleDeleteCronSchedule: (id: string) => void;
  newCronTitle: string;
  setNewCronTitle: (val: string) => void;
  newCronExpression: string;
  setNewCronExpression: (val: string) => void;
  selectedDraftForScheduleId: string;
  setSelectedDraftForScheduleId: (id: string) => void;
  scheduleDateTime: string;
  setScheduleDateTime: (val: string) => void;
  scheduleSuccessFeedback: string | null;
  setScheduleSuccessFeedback: (val: string | null) => void;
  publishEndpoints: PublishEndpointConfig[];
  selectedEndpointId: string;
  setSelectedEndpointId: (id: string) => void;
  editingEndpoint: PublishEndpointConfig | null;
  setEditingEndpoint: (ep: PublishEndpointConfig | null) => void;
  isEndpointModalOpen: boolean;
  setIsEndpointModalOpen: (open: boolean) => void;
  handleSaveEndpointsList: (newList: PublishEndpointConfig[]) => Promise<any>;
  handleDeleteEndpoint: (id: string) => void;
  handlePublishBlogToEndpoint: (draft?: SavedBlogDraft) => Promise<void>;
  isPublishing: boolean;
  publishResponse: { success: boolean; message: string; status?: number } | null;
  generatingPromptId: string | null;
  handleGenerateSectionImage: (promptObj: SectionImagePrompt) => Promise<void>;
  handleMarkdownContentEdit: (newMarkdown: string) => void;
  customSectionPromptInput: string;
  setCustomSectionPromptInput: (val: string) => void;
  handleAddCustomImagePrompt: () => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  customTitleInput: string;
  setCustomTitleInput: (val: string) => void;
  handleSaveTitleEdit: () => void;
  formatCronExpression: (expr: string) => string;
}

export const BlogStudioModal: React.FC<BlogStudioModalProps> = ({
  isOpen,
  onClose,
  blogResult,
  setBlogResult,
  blogViewMode,
  setBlogViewMode,
  isGeneratingBlog,
  savedCampaigns,
  selectedCampaignId,
  setSelectedCampaignId,
  blogTopicOverride,
  setBlogTopicOverride,
  blogTone,
  setBlogTone,
  blogWordCount,
  setBlogWordCount,
  blogAudience,
  setBlogAudience,
  blogSeoKeywords,
  setBlogSeoKeywords,
  handleGenerateBlogPost,
  isBlogCopied,
  setIsBlogCopied,
  isSavingDraft,
  setIsSavingDraft,
  draftSaveSuccess,
  setDraftSaveSuccess,
  isDownloadingMd,
  setIsDownloadingMd,
  handleSaveBlogDraft,
  handleDeleteBlogDraft,
  savedBlogDrafts,
  activeDraftId,
  setActiveDraftId,
  cronSchedules,
  handleSaveCronSchedule,
  handleDeleteCronSchedule,
  newCronTitle,
  setNewCronTitle,
  newCronExpression,
  setNewCronExpression,
  selectedDraftForScheduleId,
  setSelectedDraftForScheduleId,
  scheduleDateTime,
  setScheduleDateTime,
  scheduleSuccessFeedback,
  setScheduleSuccessFeedback,
  publishEndpoints,
  selectedEndpointId,
  setSelectedEndpointId,
  editingEndpoint,
  setEditingEndpoint,
  isEndpointModalOpen,
  setIsEndpointModalOpen,
  handleSaveEndpointsList,
  handleDeleteEndpoint,
  handlePublishBlogToEndpoint,
  isPublishing,
  publishResponse,
  generatingPromptId,
  handleGenerateSectionImage,
  handleMarkdownContentEdit,
  customSectionPromptInput,
  setCustomSectionPromptInput,
  handleAddCustomImagePrompt,
  isEditingTitle,
  setIsEditingTitle,
  customTitleInput,
  setCustomTitleInput,
  handleSaveTitleEdit,
  formatCronExpression,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-950 h-full flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Drawer Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <span>Campaign to Blog Generator Studio</span>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-md text-[10px] font-mono font-semibold uppercase">
                  SEO & Webhook Automated
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform research sessions & social campaign blueprints into long-form blog guides with automated webhooks.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'preview', label: '📖 Preview & Images' },
              { id: 'markdown', label: '✍️ Raw Markdown Editor' },
              { id: 'drafts', label: `💾 Saved Drafts (${savedBlogDrafts.length})` },
              { id: 'schedules', label: `⏰ Schedules (${cronSchedules.length})` },
              { id: 'webhook-settings', label: '⚙️ Webhooks' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBlogViewMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  blogViewMode === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isGeneratingBlog}
              onClick={() => handleGenerateBlogPost()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingBlog ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                  <span>Synthesizing Post...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Generate New Blog Post</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          
          {/* Quick Generator Controls Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Source Campaign Context:
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => {
                    setSelectedCampaignId(e.target.value);
                    const camp = savedCampaigns.find(c => c.id === e.target.value);
                    if (camp) setBlogTopicOverride(camp.mainTopic || camp.name);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">-- Active Research Thread Topic --</option>
                  {savedCampaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      Campaign: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Custom Blog Topic / Angle Override:
                </label>
                <input
                  type="text"
                  value={blogTopicOverride}
                  onChange={(e) => setBlogTopicOverride(e.target.value)}
                  placeholder="e.g. Master Guide to AI Content Strategy"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Article Writing Tone & Format:
                </label>
                <select
                  value={blogTone}
                  onChange={(e) => setBlogTone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="Informative, Authoritative & Actionable Guide">Informative & Authoritative Guide</option>
                  <option value="Storytelling & Personal Case Study">Storytelling & Case Study</option>
                  <option value="Technical & Developer Oriented Breakdown">Technical & Code Breakdown</option>
                  <option value="Persuasive & High Converting Sales Copy">Persuasive & Sales Focused</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Word Count:
                </label>
                <select
                  value={blogWordCount}
                  onChange={(e) => setBlogWordCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value={600}>Short Post (~600 words)</option>
                  <option value={1200}>Standard Guide (~1,200 words)</option>
                  <option value={2500}>Deep-Dive Whitepaper (~2,500 words)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Audience Persona:
                </label>
                <select
                  value={blogAudience}
                  onChange={(e) => setBlogAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="Beginner / General Audience">Beginner / General</option>
                  <option value="Technical / Developer Audience">Technical / Developer</option>
                  <option value="Executive / B2B Decision Makers">Executive / B2B</option>
                  <option value="General / Mixed Audience">General / Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target SEO Keywords (comma-separated):
                </label>
                <input
                  type="text"
                  value={blogSeoKeywords}
                  onChange={(e) => setBlogSeoKeywords(e.target.value)}
                  placeholder="e.g. ai content strategy, B2B marketing automation"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Publishing Status Banner */}
          {publishResponse && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in ${
              publishResponse.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {publishResponse.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span>{publishResponse.message}</span>
              </div>
            </div>
          )}

          {/* Render Active View Tab */}
          {blogViewMode === 'preview' && (
            blogResult ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>Reading Time: <strong className="text-purple-600 dark:text-purple-400">{blogResult.readingTimeMinutes} mins</strong></span>
                    <span>• Characters: <strong className="text-purple-600 dark:text-purple-400">{blogResult.characterCount.toLocaleString()}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(blogResult.markdownContent);
                        setIsBlogCopied(true);
                        setTimeout(() => setIsBlogCopied(false), 2000);
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isBlogCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isBlogCopied ? 'Copied!' : 'Copy Markdown'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDownloadingMd}
                      onClick={() => {
                        setIsDownloadingMd(true);
                        const blob = new Blob([blogResult.markdownContent], { type: 'text/markdown;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${blogResult.title.replace(/[^a-z0-9]/gi, '_')}.md`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => setIsDownloadingMd(false), 1200);
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isDownloadingMd ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                          <span>Preparing .md File...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .md</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSavingDraft}
                      onClick={async () => {
                        setIsSavingDraft(true);
                        await handleSaveBlogDraft(blogResult, 'draft');
                        setIsSavingDraft(false);
                        setDraftSaveSuccess(true);
                        setTimeout(() => setDraftSaveSuccess(false), 2500);
                      }}
                      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingDraft ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          <span>Saving Draft...</span>
                        </>
                      ) : draftSaveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Saved to Drafts!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-amber-500" />
                          <span>💾 Save to Drafts</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <BlogPreviewTab
                  blogResult={blogResult}
                  isEditingTitle={isEditingTitle}
                  setIsEditingTitle={setIsEditingTitle}
                  customTitleInput={customTitleInput}
                  setCustomTitleInput={setCustomTitleInput}
                  handleSaveTitleEdit={handleSaveTitleEdit}
                  customSectionPromptInput={customSectionPromptInput}
                  setCustomSectionPromptInput={setCustomSectionPromptInput}
                  handleAddCustomImagePrompt={handleAddCustomImagePrompt}
                  generatingPromptId={generatingPromptId}
                  handleGenerateSectionImage={handleGenerateSectionImage}
                />
              </div>
            ) : (
              <div className="p-12 text-center space-y-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                <BookOpen className="w-12 h-12 text-purple-500 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Active Blog Generated Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Select a campaign or topic above, then click "Generate New Blog Post" to synthesize a long-form article.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateBlogPost()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Generate Blog Post Now
                </button>
              </div>
            )
          )}

          {blogViewMode === 'markdown' && blogResult && (
            <BlogMarkdownTab
              blogResult={blogResult}
              handleMarkdownContentEdit={handleMarkdownContentEdit}
              activeDraftId={activeDraftId}
              handleSaveBlogDraft={handleSaveBlogDraft}
              setBlogResult={setBlogResult}
            />
          )}

          {blogViewMode === 'drafts' && (
            <SavedBlogDraftsTab
              savedBlogDrafts={savedBlogDrafts}
              scheduleDateTime={scheduleDateTime}
              handleSaveBlogDraft={handleSaveBlogDraft}
              handleDeleteBlogDraft={handleDeleteBlogDraft}
              setSelectedDraftForScheduleId={setSelectedDraftForScheduleId}
              setNewCronTitle={setNewCronTitle}
              setBlogViewMode={setBlogViewMode}
              setBlogResult={setBlogResult}
              setActiveDraftId={setActiveDraftId}
              publishEndpoints={publishEndpoints}
              selectedEndpointId={selectedEndpointId}
              setSelectedEndpointId={setSelectedEndpointId}
              handlePublishBlogToEndpoint={handlePublishBlogToEndpoint}
              isPublishing={isPublishing}
            />
          )}

          {blogViewMode === 'schedules' && (
            <CronSchedulesTab
              cronSchedules={cronSchedules}
              savedBlogDrafts={savedBlogDrafts}
              savedCampaigns={savedCampaigns}
              publishEndpoints={publishEndpoints}
              selectedDraftForScheduleId={selectedDraftForScheduleId}
              setSelectedDraftForScheduleId={setSelectedDraftForScheduleId}
              newCronTitle={newCronTitle}
              setNewCronTitle={setNewCronTitle}
              scheduleDateTime={scheduleDateTime}
              setScheduleDateTime={setScheduleDateTime}
              newCronExpression={newCronExpression}
              setNewCronExpression={setNewCronExpression}
              selectedEndpointId={selectedEndpointId}
              setSelectedEndpointId={setSelectedEndpointId}
              selectedCampaignId={selectedCampaignId}
              blogResult={blogResult}
              scheduleSuccessFeedback={scheduleSuccessFeedback}
              setScheduleSuccessFeedback={setScheduleSuccessFeedback}
              handleSaveCronSchedule={handleSaveCronSchedule}
              handleDeleteCronSchedule={handleDeleteCronSchedule}
              handleSaveBlogDraft={handleSaveBlogDraft}
              formatCronExpression={formatCronExpression}
            />
          )}

          {blogViewMode === 'webhook-settings' && (
            <WebhookSettingsTab
              publishEndpoints={publishEndpoints}
              selectedEndpointId={selectedEndpointId}
              setSelectedEndpointId={setSelectedEndpointId}
              setEditingEndpoint={setEditingEndpoint}
              setIsEndpointModalOpen={setIsEndpointModalOpen}
              handleDeleteEndpoint={handleDeleteEndpoint}
              handleSaveEndpointsList={handleSaveEndpointsList}
            />
          )}
        </div>
      </div>

      {/* Endpoint Edit / Add Modal */}
      {isEndpointModalOpen && editingEndpoint && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              {editingEndpoint.name ? 'Edit Webhook Endpoint' : 'Add Webhook Endpoint'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endpoint Name:
                </label>
                <input
                  type="text"
                  value={editingEndpoint.name}
                  onChange={(e) => setEditingEndpoint({ ...editingEndpoint, name: e.target.value })}
                  placeholder="e.g. Production Blog Webhook"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Webhook URL:
                </label>
                <input
                  type="text"
                  value={editingEndpoint.endpointUrl}
                  onChange={(e) => setEditingEndpoint({ ...editingEndpoint, endpointUrl: e.target.value })}
                  placeholder="https://mywebsite.com/api/blog/publish"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Header Name:
                </label>
                <input
                  type="text"
                  value={editingEndpoint.headerName || 'Authorization'}
                  onChange={(e) => setEditingEndpoint({ ...editingEndpoint, headerName: e.target.value })}
                  placeholder="Authorization"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Secret Key / Bearer Token:
                </label>
                <input
                  type="password"
                  value={editingEndpoint.secretKey}
                  onChange={(e) => setEditingEndpoint({ ...editingEndpoint, secretKey: e.target.value })}
                  placeholder="Secret key..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsEndpointModalOpen(false);
                  setEditingEndpoint(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingEndpoint.name.trim()) return;
                  const exists = publishEndpoints.some(e => e.id === editingEndpoint.id);
                  let updatedList: PublishEndpointConfig[];
                  if (exists) {
                    updatedList = publishEndpoints.map(e => e.id === editingEndpoint.id ? editingEndpoint : e);
                  } else {
                    updatedList = [...publishEndpoints, editingEndpoint];
                  }
                  await handleSaveEndpointsList(updatedList);
                  setIsEndpointModalOpen(false);
                  setEditingEndpoint(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
              >
                Save Endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
