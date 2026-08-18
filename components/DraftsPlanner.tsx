import React, { useState } from 'react';
import { 
  BookOpen, Plus, Globe, 
  Instagram, Linkedin, Twitter, RefreshCw, Sparkles, X 
} from 'lucide-react';
import { DraftPrompt, ComplexityLevel, VisualStyle, Language, AspectRatio, SavedCampaign, SocialPostCampaignItem } from '../types';
import { useCampaigns } from './drafts/useCampaigns';
import { PENDING_CAMPAIGN_KEY, PendingCampaignPrefill } from '@/lib/pendingPrefills';

// Re-export types for compatibility with sub-components
export type { SavedCampaign, SocialPostCampaignItem };

// Import our modular sub-components
import { BlueprintDrafts } from './drafts/BlueprintDrafts';
import { CampaignList } from './drafts/CampaignList';
import { CampaignWorkspace } from './drafts/CampaignWorkspace';
import { CreateBlueprintModal, CreateCampaignModal, AddPostManualModal } from './drafts/DraftsPlannerModals';

interface DraftsPlannerProps {
  activeProjectId: string;
  drafts: DraftPrompt[];
  onCreateDraft: (draft: Omit<DraftPrompt, 'id' | 'createdAt'>) => void;
  onDeleteDraft: (id: string) => void;
  onLaunchDraft: (draft: DraftPrompt) => void;
  activeTab: 'blueprints' | 'social-campaign';
  onTabChange: (tab: 'blueprints' | 'social-campaign') => void;
}

const DraftsPlanner: React.FC<DraftsPlannerProps> = ({
  activeProjectId,
  drafts,
  onCreateDraft,
  onDeleteDraft,
  onLaunchDraft,
  activeTab,
  onTabChange
}) => {
  // Navigation tabs: 'blueprints' or 'social-campaign' (controlled via URL routing)
  const [showCreateBlueprintModal, setShowCreateBlueprintModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  // When a campaign is prefilled from the Research Center, open the modal
  // straight at the details step so the bundled data is visible immediately.
  const [campaignModalInitialStep, setCampaignModalInitialStep] = useState<'method' | 'details'>('method');
  // Standard blueprint creation state
  const [blueprintTopic, setBlueprintTopic] = useState('');
  const [blueprintLevel, setBlueprintLevel] = useState<ComplexityLevel>('Default');
  const [blueprintStyle, setBlueprintStyle] = useState<VisualStyle>('Default');
  const [blueprintLang, setBlueprintLang] = useState<Language>('Default');
  const [blueprintResolution, setBlueprintResolution] = useState<AspectRatio>('16:9');

  // Modular campaign state & actions hooked from useCampaigns
  const {
    newCampName, setNewCampName,
    newCampWebsite, setNewCampWebsite,
    newCampTopic, setNewCampTopic,
    newCampPlatform, setNewCampPlatform,
    newCampPostCount, setNewCampPostCount,
    newCampStyleGuide, setNewCampStyleGuide,
    newCampAspect, setNewCampAspect,
    newCampStyle, setNewCampStyle,
    newCampModel, setNewCampModel,
    startMethod, setStartMethod,
    newCampTemplate, setNewCampTemplate,
    isGeneratingCampaign,
    campaignError, setCampaignError,
    campaignStatus,
    savedCampaigns, setSavedCampaigns,
    activeCampaignId, setActiveCampaignId,
    campaignPosts, setCampaignPosts,
    isRenaming, setIsRenaming,
    tempName, setTempName,
    editingPostIndex, setEditingPostIndex,
    editTopic, setEditTopic,
    editVisualPrompt, setEditVisualPrompt,
    editCaption, setEditCaption,
    editHashtags, setEditHashtags,
    editStyle, setEditStyle,
    editAspect, setEditAspect,
    manualPostTitle, setManualPostTitle,
    manualPostPrompt, setManualPostPrompt,
    manualPostCaption, setManualPostCaption,
    manualPostHashtags, setManualPostHashtags,
    manualPostStyle, setManualPostStyle,
    manualPostAspect, setManualPostAspect,
    showSingleAIPostForm, setShowSingleAIPostForm,
    singlePostInstruction, setSinglePostInstruction,
    isGeneratingSinglePost,
    refinementText, setRefinementText,
    isRefining,
    copiedIndex,
    copiedType,
    handleSelectCampaign,
    handleCreateCampaignProject,
    handleAutoGenerateCampaignPosts,
    handleRefineSinglePostAI,
    handleAddPostManualSubmit,
    handleGenerateSinglePostAI,
    handleDeletePost,
    handleRefineCampaign,
    handleLaunchPost,
    handleSavePostAsDraft,
    handleSaveAllSlidesAsDrafts,
    startEditingPost,
    saveEditedPost,
    handleUpdatePostAspect,
    handleUpdatePostStyle,
    handleRenameSave,
    handleCopyToClipboard,
    handleUpdateCampaignPosts,
    handleUpdateCampaignModel,
    isLoadingCampaigns,
  } = useCampaigns({ activeProjectId, onCreateDraft, onLaunchDraft });

  // Research Center -> Social Campaign sends are handed off via sessionStorage
  // (App view navigation remounts this component, so React state can't carry it).
  // Consume it on mount: open the prefilled modal straight at the details step.
  const pendingCampaignRef = React.useRef<PendingCampaignPrefill | null>(null);

  React.useEffect(() => {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(PENDING_CAMPAIGN_KEY); } catch { /* no-op */ }
    if (!raw) return;
    try { sessionStorage.removeItem(PENDING_CAMPAIGN_KEY); } catch { /* no-op */ }
    try {
      const parsed = JSON.parse(raw) as Partial<PendingCampaignPrefill>;
      pendingCampaignRef.current = {
        topic: typeof parsed.topic === 'string' ? parsed.topic : '',
        prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
        website: typeof parsed.website === 'string' ? parsed.website : ''
      };
      if (pendingCampaignRef.current.topic || pendingCampaignRef.current.prompt) {
        if (pendingCampaignRef.current.topic) {
          setNewCampName(`${pendingCampaignRef.current.topic} Campaign`);
          setNewCampTopic(pendingCampaignRef.current.topic);
        }
        if (pendingCampaignRef.current.prompt) {
          setNewCampStyleGuide(pendingCampaignRef.current.prompt);
        }
        if (pendingCampaignRef.current.website) {
          setNewCampWebsite(pendingCampaignRef.current.website);
        }
        setStartMethod('ai');
        setCampaignModalInitialStep('details');
        setShowCreateCampaignModal(true);
      }
    } catch { /* no-op */ }
  }, []);

  // Once the IndexedDB restore finishes, force the workspace closed so the
  // user lands back on the campaign list dashboard with the prefilled modal
  // open (regardless of whether an old workspace was previously active).
  React.useEffect(() => {
    if (!isLoadingCampaigns && pendingCampaignRef.current) {
      setActiveCampaignId(null);
      setCampaignPosts(null);
      pendingCampaignRef.current = null;
    }
  }, [isLoadingCampaigns, setActiveCampaignId, setCampaignPosts]);

  const handleCreateBlueprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blueprintTopic.trim()) return;
    onCreateDraft({
      topic: blueprintTopic.trim(),
      complexityLevel: blueprintLevel,
      visualStyle: blueprintStyle,
      language: blueprintLang,
      resolution: blueprintResolution,
      subOptions: {}
    });
    setBlueprintTopic('');
    setBlueprintLevel('Default');
    setBlueprintStyle('Default');
    setBlueprintLang('Default');
    setBlueprintResolution('16:9');
    setShowCreateBlueprintModal(false);
  };

  // Helper to choose platform style classes
  const getPlatformClass = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'from-pink-500/10 via-rose-500/5 to-transparent border-pink-500/20';
      case 'linkedin': return 'from-blue-600/10 via-indigo-600/5 to-transparent border-blue-600/20';
      case 'twitter':
      case 'twitter/x':
      case 'x': return 'from-slate-400/10 via-slate-600/5 to-transparent border-slate-500/20';
      default: return 'from-purple-500/10 via-purple-600/5 to-transparent border-purple-500/20';
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'linkedin': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'twitter':
      case 'twitter/x':
      case 'x': return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-400" />;
      case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-400" />;
      case 'twitter':
      case 'twitter/x':
      case 'x': return <Twitter className="w-5 h-5 text-slate-300" />;
      default: return <Globe className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Sleek Navigation Bar & Header - Only show when NOT inside an active campaign workspace */}
      {!(activeTab === 'social-campaign' && activeCampaignId !== null) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            {/* Segmented Control Tabs */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner">
              <button
                onClick={() => onTabChange('blueprints')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'blueprints'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Drafts ({drafts.length})</span>
              </button>

              <button
                onClick={() => onTabChange('social-campaign')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'social-campaign'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Social Campaigns ({savedCampaigns.length})</span>
              </button>
            </div>
          </div>

          <div>
            {activeTab === 'blueprints' ? (
              <button
                onClick={() => setShowCreateBlueprintModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Draft</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setStartMethod('ai');
                  setCampaignModalInitialStep('method');
                  setShowCreateCampaignModal(true);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Social Campaign</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {campaignError && (
        <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl text-red-800 dark:text-red-200 text-sm flex justify-between items-center gap-3 animate-in fade-in duration-200">
          <span>⚠️ {campaignError}</span>
          <button onClick={() => setCampaignError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INDEXEDDB LOADING INDICATOR */}
      {isLoadingCampaigns && (
        <div className="p-12 border border-purple-500/10 rounded-3xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4 shadow-sm animate-in fade-in duration-200">
          <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Synchronizing campaigns from IndexedDB...</p>
        </div>
      )}

      {/* GENERATING PROGRESS BLOCK (For new campaigns) */}
      {isGeneratingCampaign && activeCampaignId === null && (
        <div className="border border-purple-500/20 rounded-3xl p-12 bg-white dark:bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-6 shadow-md animate-pulse">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full scale-150 animate-pulse"></div>
            <RefreshCw className="w-14 h-14 text-purple-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">Grounded Brand Researching</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{campaignStatus}</p>
          </div>
          <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-2/3 animate-[pulse_1.5s_infinite]"></div>
          </div>
        </div>
      )}

      {/* TAB 1: BLUEPRINTS */}
      {activeTab === 'blueprints' && (
        <BlueprintDrafts 
          drafts={drafts}
          onDeleteDraft={onDeleteDraft}
          onLaunchDraft={onLaunchDraft}
          onOpenCreateModal={() => setShowCreateBlueprintModal(true)}
        />
      )}

      {/* TAB 2: AI SOCIAL CAMPAIGN PROJECTS */}
      {activeTab === 'social-campaign' && (!isGeneratingCampaign || activeCampaignId !== null) && (
        <>
          {activeCampaignId === null ? (
            <CampaignList 
              savedCampaigns={savedCampaigns}
              onSelectCampaign={handleSelectCampaign}
              onDeleteCampaign={(id) => setSavedCampaigns(prev => prev.filter(c => c.id !== id))}
              onOpenCreateModal={() => {
                setStartMethod('ai');
                setCampaignModalInitialStep('method');
                setShowCreateCampaignModal(true);
              }}
              getPlatformClass={getPlatformClass}
              getPlatformBadgeColor={getPlatformBadgeColor}
              getPlatformIcon={getPlatformIcon}
            />
          ) : (
            <CampaignWorkspace 
              activeCampaignId={activeCampaignId}
              savedCampaigns={savedCampaigns}
              onSelectCampaign={handleSelectCampaign}
              onDeleteCampaign={(id) => setSavedCampaigns(prev => prev.filter(c => c.id !== id))}
              campaignPosts={campaignPosts}
              isRenaming={isRenaming}
              setIsRenaming={setIsRenaming}
              tempName={tempName}
              setTempName={setTempName}
              handleRenameSave={handleRenameSave}
              onOpenAddPostModal={() => setShowAddPostModal(true)}
              showSingleAIPostForm={showSingleAIPostForm}
              setShowSingleAIPostForm={setShowSingleAIPostForm}
              singlePostInstruction={singlePostInstruction}
              setSinglePostInstruction={setSinglePostInstruction}
              isGeneratingSinglePost={isGeneratingSinglePost}
              handleGenerateSinglePostAI={handleGenerateSinglePostAI}
              handleDeletePost={handleDeletePost}
              editingPostIndex={editingPostIndex}
              setEditingPostIndex={setEditingPostIndex}
              editTopic={editTopic}
              setEditTopic={setEditTopic}
              editVisualPrompt={editVisualPrompt}
              setEditVisualPrompt={setEditVisualPrompt}
              editCaption={editCaption}
              setEditCaption={setEditCaption}
              editHashtags={editHashtags}
              setEditHashtags={setEditHashtags}
              editStyle={editStyle}
              setEditStyle={setEditStyle}
              editAspect={editAspect}
              setEditAspect={setEditAspect}
              startEditingPost={startEditingPost}
              saveEditedPost={saveEditedPost}
              handleUpdatePostAspect={handleUpdatePostAspect}
              handleUpdatePostStyle={handleUpdatePostStyle}
              copiedIndex={copiedIndex}
              copiedType={copiedType}
              handleCopyToClipboard={handleCopyToClipboard}
              handleSavePostAsDraft={handleSavePostAsDraft}
              handleSaveAllSlidesAsDrafts={handleSaveAllSlidesAsDrafts}
              handleLaunchPost={handleLaunchPost}
              refinementText={refinementText}
              setRefinementText={setRefinementText}
              isRefining={isRefining}
              handleRefineCampaign={handleRefineCampaign}
              isGeneratingCampaign={isGeneratingCampaign}
              campaignStatus={campaignStatus}
              campaignError={campaignError}
              handleAutoGenerateCampaignPosts={handleAutoGenerateCampaignPosts}
              handleRefineSinglePostAI={handleRefineSinglePostAI}
              getPlatformBadgeColor={getPlatformBadgeColor}
              getPlatformIcon={getPlatformIcon}
              onUpdateCampaignPosts={handleUpdateCampaignPosts}
              onUpdateCampaignModel={handleUpdateCampaignModel}
            />
          )}
        </>
      )}

      {/* POPUP OVERLAY MODALS */}
      <CreateBlueprintModal 
        show={showCreateBlueprintModal}
        onClose={() => setShowCreateBlueprintModal(false)}
        topic={blueprintTopic}
        setTopic={setBlueprintTopic}
        style={blueprintStyle}
        setStyle={setBlueprintStyle}
        level={blueprintLevel}
        setLevel={setBlueprintLevel}
        resolution={blueprintResolution}
        setResolution={setBlueprintResolution}
        lang={blueprintLang}
        setLang={setBlueprintLang}
        onSubmit={handleCreateBlueprintSubmit}
      />

      <CreateCampaignModal 
        show={showCreateCampaignModal}
        onClose={() => setShowCreateCampaignModal(false)}
        name={newCampName}
        setName={setNewCampName}
        website={newCampWebsite}
        setWebsite={setNewCampWebsite}
        topic={newCampTopic}
        setTopic={setNewCampTopic}
        platform={newCampPlatform}
        setPlatform={setNewCampPlatform}
        postCount={newCampPostCount}
        setPostCount={setNewCampPostCount}
        styleGuide={newCampStyleGuide}
        setStyleGuide={setNewCampStyleGuide}
        startMethod={startMethod}
        setStartMethod={setStartMethod}
        templateName={newCampTemplate}
        setTemplateName={setNewCampTemplate}
        preferredAspect={newCampAspect}
        setPreferredAspect={setNewCampAspect}
        preferredStyle={newCampStyle}
        setPreferredStyle={setNewCampStyle}
        aiModel={newCampModel}
        setAiModel={setNewCampModel}
        initialStep={campaignModalInitialStep}
        onSubmit={(e) => {
          handleCreateCampaignProject(e);
          setShowCreateCampaignModal(false);
        }}
      />
 
      <AddPostManualModal 
        show={showAddPostModal}
        onClose={() => setShowAddPostModal(false)}
        title={manualPostTitle}
        setTitle={setManualPostTitle}
        prompt={manualPostPrompt}
        setPrompt={setManualPostPrompt}
        caption={manualPostCaption}
        setCaption={setManualPostCaption}
        style={manualPostStyle}
        setStyle={setManualPostStyle}
        aspect={manualPostAspect}
        setAspect={setManualPostAspect}
        hashtags={manualPostHashtags}
        setHashtags={setManualPostHashtags}
        onSubmit={(e) => {
          handleAddPostManualSubmit(e);
          setShowAddPostModal(false);
        }}
      />
    </div>
  );
};

export default DraftsPlanner;
