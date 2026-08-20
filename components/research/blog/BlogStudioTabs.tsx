import React, { useState } from 'react';
import {
  BookOpen,
  Loader2,
  CheckCircle2,
  Check,
  Copy,
  Download,
  Save,
  Plus,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react';
import { UseBlogEngineReturn } from '@/hooks/useBlogEngine';
import { PublishEndpointConfig } from '@/types';
import { BlogPreviewTab } from './BlogPreviewTab';
import { BlogMarkdownTab } from './BlogMarkdownTab';
import { SavedBlogDraftsTab } from './SavedBlogDraftsTab';
import { PublishedBlogPostsTab } from './PublishedBlogPostsTab';
import { CronSchedulesTab } from './CronSchedulesTab';
import { WebhookSettingsTab } from './WebhookSettingsTab';
import { BlogSeoPanel } from './BlogSeoPanel';
import { BlogNewPostModal } from './BlogNewPostModal';

interface BlogStudioTabsProps {
  engine: UseBlogEngineReturn;
  onGeneratePost?: (topic: string) => Promise<void> | void;
}

/** Mirror of the engine's publish-time sanitizer so the diff view reflects what's actually live. */
const sanitizeForCompare = (markdown: string): string =>
  markdown
    .replace(/\[?IMAGE_PROMPT:\s*[^\]\n]*\]?\s*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const BlogStudioTabs: React.FC<BlogStudioTabsProps> = ({ engine, onGeneratePost }) => {
  const {
    blogResult,
    setBlogResult,
    blogViewMode,
    setBlogViewMode,
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
    runDueSchedules,
    runScheduleNow,
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
    handleUpdatePublishedPost,
    findPublishedRecord,
    hasUnpublishedChanges,
    isPublishing,
    publishingDraftId,
    generatingPromptId,
    uploadingPromptId,
    handleGenerateSectionImage,
    handleUploadSectionImage,
    handleMarkdownContentEdit,
    customSectionPromptInput,
    setCustomSectionPromptInput,
    handleAddCustomImagePrompt,
    isEditingTitle,
    setIsEditingTitle,
    customTitleInput,
    setCustomTitleInput,
    handleSaveTitleEdit,
    savedCampaigns,
    selectedCampaignId,
    formatCronExpression,
    publishedBlogPosts,
    setIsNewPostComposerOpen,
  } = engine;

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const publishedRecord = findPublishedRecord();
  const hasPendingChanges = hasUnpublishedChanges();
  const isPublishingCurrent = isPublishing && (publishingDraftId === 'current' || publishingDraftId === activeDraftId);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* View Mode Navigation Tabs */}
      <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'preview', label: '📖 Preview & Images' },
            { id: 'markdown', label: '✍️ Raw Markdown Editor' },
            { id: 'drafts', label: `💾 Drafts (${savedBlogDrafts.filter(d => d.status !== 'published').length})` },
            { id: 'published', label: `🌐 Published (${publishedBlogPosts.length})` },
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
            onClick={() => setIsNewPostComposerOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {/* Render Active View Tab */}
        {blogViewMode === 'preview' && (
          blogResult ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span>Reading Time: <strong className="text-purple-600 dark:text-purple-400">{blogResult.readingTimeMinutes} mins</strong></span>
                  <span>• Characters: <strong className="text-purple-600 dark:text-purple-400">{blogResult.characterCount.toLocaleString()}</strong></span>
                  {blogResult.slug && (
                    <span className="hidden lg:inline">• Slug: <strong className="text-cyan-600 dark:text-cyan-400">{blogResult.slug.slice(0, 40)}</strong></span>
                  )}
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

                  <select
                    value={selectedEndpointId}
                    onChange={(e) => setSelectedEndpointId(e.target.value)}
                    className="px-2.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                    title="Publish target endpoint"
                  >
                    {publishEndpoints.map(ep => (
                      <option key={ep.id} value={ep.id}>Endpoint: {ep.name}</option>
                    ))}
                  </select>

                  {publishedRecord && (
                    <>
                      {hasPendingChanges && (
                        <button
                          type="button"
                          onClick={() => setShowCompareModal(true)}
                          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Compare your current draft with the version live on the endpoint"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Compare with Published</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isPublishingCurrent}
                        onClick={() => handleUpdatePublishedPost()}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        title="Update the existing post on the endpoint (PUT/PATCH by slug)"
                      >
                        {isPublishingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isPublishingCurrent ? 'Updating...' : hasPendingChanges ? 'Update Published Post' : 'Re-publish'}</span>
                      </button>
                    </>
                  )}

                  {!publishedRecord && (
                    <button
                      type="button"
                      disabled={isPublishingCurrent}
                      onClick={() => handlePublishBlogToEndpoint()}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isPublishingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{isPublishingCurrent ? 'Publishing...' : 'Publish Now'}</span>
                    </button>
                  )}
                </div>
              </div>

              {publishedRecord && hasPendingChanges && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="font-semibold">
                    You have unpublished changes. The live post "{publishedRecord.publishedTitle}" on {publishEndpoints.find(e => e.id === publishedRecord.publishedEndpointId)?.name || 'your endpoint'} is still the previous version.
                  </span>
                </div>
              )}

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
                uploadingPromptId={uploadingPromptId}
                handleGenerateSectionImage={handleGenerateSectionImage}
                handleUploadSectionImage={handleUploadSectionImage}
                relatedPosts={blogResult.relatedPosts || []}
                savedBlogDrafts={savedBlogDrafts}
                setBlogResult={setBlogResult}
                setActiveDraftId={setActiveDraftId}
                setBlogViewMode={setBlogViewMode}
              />

              {/* SEO & Slug Panel (editor view only) */}
              <BlogSeoPanel engine={engine} />
            </div>
          ) : (
            <div className="p-12 text-center space-y-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <BookOpen className="w-12 h-12 text-purple-500 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Active Blog Generated Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "New Post" to describe your idea or use "I'm feeling lucky" to let the AI suggest fresh topics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPostComposerOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Create Your First Post
              </button>
            </div>
          )
        )}

        {blogViewMode === 'markdown' && blogResult && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <span>Editing: <strong className="text-purple-600 dark:text-purple-400">{blogResult.title.slice(0, 50)}{blogResult.title.length > 50 ? '…' : ''}</strong></span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedEndpointId}
                  onChange={(e) => setSelectedEndpointId(e.target.value)}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  title="Publish target endpoint"
                >
                  {publishEndpoints.map(ep => (
                    <option key={ep.id} value={ep.id}>Endpoint: {ep.name}</option>
                  ))}
                </select>

                {publishedRecord && hasPendingChanges && (
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(true)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Compare your current draft with the version live on the endpoint"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Compare with Published</span>
                  </button>
                )}

                {publishedRecord ? (
                  <button
                    type="button"
                    disabled={isPublishingCurrent}
                    onClick={() => handleUpdatePublishedPost()}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Update the existing post on the endpoint (PUT/PATCH by slug)"
                  >
                    {isPublishingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isPublishingCurrent ? 'Updating...' : hasPendingChanges ? 'Update Published Post' : 'Re-publish'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPublishingCurrent}
                    onClick={() => handlePublishBlogToEndpoint()}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isPublishingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isPublishingCurrent ? 'Publishing...' : 'Publish Now'}</span>
                  </button>
                )}
              </div>
            </div>

            {publishedRecord && hasPendingChanges && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-semibold">
                  You have unpublished changes. The live post "{publishedRecord.publishedTitle}" on {publishEndpoints.find(e => e.id === publishedRecord.publishedEndpointId)?.name || 'your endpoint'} is still the previous version.
                </span>
              </div>
            )}

            <BlogMarkdownTab
              blogResult={blogResult}
              handleMarkdownContentEdit={handleMarkdownContentEdit}
              activeDraftId={activeDraftId}
              handleSaveBlogDraft={handleSaveBlogDraft}
              setBlogResult={setBlogResult}
            />
          </div>
        )}

        {blogViewMode === 'drafts' && (
          <SavedBlogDraftsTab
            savedBlogDrafts={savedBlogDrafts.filter(d => d.status !== 'published')}
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
            publishingDraftId={publishingDraftId}
          />
        )}

        {blogViewMode === 'published' && (
          <PublishedBlogPostsTab
            publishedBlogPosts={publishedBlogPosts}
            publishEndpoints={publishEndpoints}
            handleSaveBlogDraft={handleSaveBlogDraft}
            handleDeleteBlogDraft={handleDeleteBlogDraft}
            setBlogViewMode={setBlogViewMode}
            setBlogResult={setBlogResult}
            setActiveDraftId={setActiveDraftId}
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
            runDueSchedules={runDueSchedules}
            runScheduleNow={runScheduleNow}
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
                  Public Site Base URL (for backlinks):
                </label>
                <input
                  type="text"
                  value={editingEndpoint.blogBaseUrl || ''}
                  onChange={(e) => setEditingEndpoint({ ...editingEndpoint, blogBaseUrl: e.target.value })}
                  placeholder="https://myblog.com/blog (used to build Related Reading backlinks)"
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
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={editingEndpoint.secretKey}
                    onChange={(e) => setEditingEndpoint({ ...editingEndpoint, secretKey: e.target.value })}
                    placeholder="Secret key..."
                    className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={showSecretKey ? 'Hide secret key' : 'Reveal secret key'}
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Update Method (for editing published posts):
                </label>
                <select
                  value={editingEndpoint.updateMethod || 'PUT'}
                  onChange={(e) => setEditingEndpoint({ ...editingEndpoint, updateMethod: e.target.value as 'PUT' | 'PATCH' })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none"
                >
                  <option value="PUT">PUT (replace by slug)</option>
                  <option value="PATCH">PATCH (partial update by slug)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Used by "Update Published Post" — the endpoint must accept {editingEndpoint.updateMethod || 'PUT'} to the post's slug.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsEndpointModalOpen(false);
                  setEditingEndpoint(null);
                  setShowSecretKey(false);
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
                  setShowSecretKey(false);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
              >
                Save Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Current Draft vs Published Version Modal */}
      {showCompareModal && publishedRecord && blogResult && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Changes vs. Published Version
              </h3>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Published: {publishedRecord.publishedTitle || blogResult.title}
                  <span className="font-mono font-normal text-[10px] text-slate-400">
                    {publishedRecord.publishedAt ? new Date(publishedRecord.publishedAt).toLocaleString() : ''}
                  </span>
                </div>
                <pre className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-b-xl p-4 text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {sanitizeForCompare(publishedRecord.publishedMarkdown ?? publishedRecord.markdownContent ?? '')}
                </pre>
              </div>

              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-b-0 border-amber-500/30 rounded-t-xl text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Current Draft (not yet live)
                </div>
                <pre className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-b-xl p-4 text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {sanitizeForCompare(blogResult.markdownContent)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isPublishingCurrent}
                onClick={() => {
                  setShowCompareModal(false);
                  handleUpdatePublishedPost();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isPublishingCurrent ? 'Updating...' : 'Publish These Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BlogNewPostModal engine={engine} onGeneratePost={onGeneratePost} />
    </div>
  );
};
