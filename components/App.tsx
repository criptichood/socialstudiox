"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { GeneratedImage, Project, DraftPrompt } from '@/types';
import { useAppEngine } from '@/hooks/useAppEngine';
import ConfigForm from '@/components/ConfigForm';
import PromptStudio from '@/components/PromptStudio';
import GalleryDashboard from '@/components/GalleryDashboard';
import Infographic from '@/components/Infographic';
import Loading from '@/components/Loading';
import IntroScreen from '@/components/IntroScreen';
import SearchResults from '@/components/SearchResults';
import Sidebar from '@/components/Sidebar';
import ProjectsDashboard from '@/components/ProjectsDashboard';
import DraftsPlanner from '@/components/DraftsPlanner';
import { ResearchCenter } from '@/components/ResearchCenter';
import { AnnotationStudio } from '@/components/AnnotationStudio';
import { PresenterStudio } from '@/components/PresenterStudio';
import VoiceoverStudio from '@/components/VoiceoverStudio';
import { VideoStudio } from '@/components/VideoStudio';
import { SoundStudio } from '@/components/SoundStudio';
import { PresentationDeck } from '@/components/PresentationDeck';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ModelsSettings } from '@/components/ModelsSettings';
import { BlogStudio } from '@/components/BlogStudio';
import { Toaster } from 'sonner';
import {
  getVideoGenerationState,
  subscribeVideoGeneration
} from '@/services/videoGenerationManager';
import { DBService } from '@/services/dbService';
import { PENDING_CAMPAIGN_KEY, PENDING_VIDEO_KEY } from '@/lib/pendingPrefills';
import { curateResearchBrief } from '@/services/ai/campaignService';
import { beginLoading, resolveToast, logTechnicalError } from '@/lib/feedback';
import { 
  AlertCircle, 
  Compass, 
  Sun, 
  Moon, 
  Key, 
  CreditCard, 
  ExternalLink, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Folder,
  Image as ImageIcon,
  Eye,
  ArrowRight,
  Plus,
  Sparkles,
  Play,
  Menu,
  Loader2,
  Check,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const {
    showIntro, setShowIntro, handleIntroComplete,
    topic, setTopic,
    currentView, setCurrentView,
    draftsTab, setDraftsTab,
    isSidebarOpen, setIsSidebarOpen,
    projects,
    selectedProjectId, setSelectedProjectId,
    isLoadingData,
    complexityLevel, setComplexityLevel,
    visualStyle, setVisualStyle,
    language, setLanguage,
    resolution, setResolution,
    imageModel, setImageModel,
    subOptions, setSubOptions,
    hasDraft, setHasDraft,
    draftedPrompt, setDraftedPrompt,
    draftedFacts,
    draftedSearchResults,
    isLoading,
    loadingMessage,
    loadingStep,
    loadingFacts,
    error, setError,
    imageHistory,
    currentSearchResults,
    referenceImage, setReferenceImage,
    referenceMode, setReferenceMode,
    annotatingImage, setAnnotatingImage,
    presentingProject, setPresentingProject,
    isDarkMode, setIsDarkMode,
    isControlPanelOpen, setIsControlPanelOpen,
    hasApiKey,
    checkingKey,

    // Computed/derived state
    activeProjectImages,
    activeDrafts,
    campaignCounts,
    voiceoverCounts,
    videoCounts,

    // Handlers
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    handleSaveAnnotations,
    handleDeleteDraft,
    handleCreateDraft,
    handleLaunchDraft,
    handleGenerate,
    handleDraftOnly,
    handleGenerateFromDraft,
    handleEdit,
    selectImageFromGallery,
    deleteImageFromGallery,
    clearAllGallery,
    loadForTweaking,
    handleSelectKey,
    handleImportImagesToProject
  } = useAppEngine();

  // Cross-view "send to" prefills are handed off via sessionStorage because
  // view navigation remounts this component (see lib/pendingPrefills.ts).

  // Global video generation banner + toasts (managed outside VideoStudio so generation survives navigation).
  const [videoGenBanner, setVideoGenBanner] = React.useState(getVideoGenerationState);
  const [genToast, setGenToast] = React.useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const prevGenStatusRef = React.useRef<string>(getVideoGenerationState().status);

  React.useEffect(() => {
    const unsubscribe = subscribeVideoGeneration(setVideoGenBanner);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const status = videoGenBanner.status;
    if (status === prevGenStatusRef.current) return;
    prevGenStatusRef.current = status;
    if (status === 'error') {
      setGenToast({ kind: 'error', message: videoGenBanner.error || 'Video generation failed. Please try again.' });
      const t = setTimeout(() => setGenToast(null), 8000);
      return () => clearTimeout(t);
    }
    if (status === 'success') {
      setGenToast({ kind: 'success', message: 'Your generated video has been saved to the archive.' });
      const t = setTimeout(() => setGenToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [videoGenBanner.status]);

  // Modal for API Key Selection
  const KeySelectionModal = () => (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
            
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 border-4 border-white dark:border-slate-900 shadow-lg">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white dark:border-slate-900 uppercase tracking-wide">
                        Gemini AI
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                        Gemini API Key Required
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                        This application uses Google Gemini models which require a valid API key connection.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        You must configure your <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1 py-0.5 rounded">Gemini API Key</span> to proceed.
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 w-full text-left">
                    <div className="flex items-start gap-3">
                         <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                            <DollarSign className="w-4 h-4" />
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-200">API Key & Billing Setup</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Get your key from Google AI Studio. Note that premium tiers require billing setup.
                            </p>
                             <a 
                                href="https://aistudio.google.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline mt-1"
                             >
                                Get Key in AI Studio <ExternalLink className="w-3 h-3" />
                             </a>
                         </div>
                    </div>
                </div>

                <button 
                    id="select-paid-key-btn"
                    onClick={handleSelectKey}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <Key className="w-4 h-4" />
                    <span>Select Gemini API Key</span>
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <>
    {!checkingKey && !hasApiKey && <KeySelectionModal />}

    {showIntro ? (
      <IntroScreen onComplete={handleIntroComplete} />
    ) : (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-cyan-500 selection:text-white relative transition-colors">
      
      {/* Collapsible Sidebar */}
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      {/* Main Content Area Offsetted by Sidebar Width */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'pl-0 md:pl-64' : 'pl-0 md:pl-20'}`}>
        
        {/* Dynamic Ambient Background Canvas */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white dark:from-indigo-900 dark:via-slate-950 dark:to-black z-0 transition-colors pointer-events-none"></div>
        <div className="fixed inset-0 opacity-5 dark:opacity-20 z-0 pointer-events-none" style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}></div>

        {/* Global Navigation Header bar - Displayed on all views except presenter-studio */}
        {currentView !== 'presenter-studio' && (
          <header className="border-b border-slate-200 dark:border-white/10 shrink-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 transition-colors">
            <div className="max-w-[1550px] mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4 group">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="relative scale-90 md:scale-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 blur-md opacity-30 dark:opacity-50 animate-pulse"></div>
                    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 relative z-10 shadow-md">
                       <Sparkles className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="font-display font-bold text-lg md:text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
                    Social Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-amber-400">X</span>
                    </span>
                    <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-medium">Brand & Post Workspace</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                  <button 
                    id="header-darkmode-toggle"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto ${
          currentView === 'dashboard' || currentView === 'canvas'
            ? 'max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 md:py-8'
            : 'w-full p-0'
        } relative z-10`}>

          {isLoadingData ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-600 animate-spin"></div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Loading workspace data from IndexedDB...
              </p>
            </div>
          ) : (
            <>
          {/* View 1: Projects Dashboard */}
          {currentView === 'dashboard' && (
            <ErrorBoundary fallbackTitle="Projects Dashboard Display Interrupted">
              <ProjectsDashboard 
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onPresentProject={(proj) => setPresentingProject(proj)}
                images={imageHistory}
                onViewChange={setCurrentView}
                campaignCounts={campaignCounts}
                voiceoverCounts={voiceoverCounts}
                videoCounts={videoCounts}
              />
            </ErrorBoundary>
          )}

          {/* View 2: Active Generative Canvas */}
          {currentView === 'canvas' && (
            <ErrorBoundary fallbackTitle="Generative Canvas Display Interrupted">
              <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                
                {/* Left Column: Collapsible Control Deck (col-span-4) - Configured to be stationary/sticky with viewport inner scroll to prevent full-page scrolling offset */}
                {isControlPanelOpen && (
                  <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 pb-6 order-first animate-in slide-in-from-left-6 duration-300 z-30">
                    <div className="relative pt-3">
                      {/* Optional ambient badge/label */}
                      <div className="absolute -top-3 left-6 z-35 px-3 py-1 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md">
                        Control Panel
                      </div>
                      {/* Beautiful Collapse Button */}
                      <button
                        id="collapse-control-panel-btn"
                        onClick={() => setIsControlPanelOpen(false)}
                        className="absolute -top-3 right-6 z-35 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md transition-colors border border-slate-200 dark:border-white/5 flex items-center gap-1 cursor-pointer"
                        title="Collapse Panel"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        <span>Collapse</span>
                      </button>
                      <div className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto p-1.5 scrollbar-thin rounded-3xl">
                        <ConfigForm 
                          topic={topic}
                          setTopic={setTopic}
                          complexityLevel={complexityLevel}
                          setComplexityLevel={setComplexityLevel}
                          visualStyle={visualStyle}
                          setVisualStyle={setVisualStyle}
                          language={language}
                          setLanguage={setLanguage}
                          resolution={resolution}
                          setResolution={setResolution}
                          imageModel={imageModel}
                          setImageModel={setImageModel}
                          subOptions={subOptions}
                          setSubOptions={setSubOptions}
                          onSubmit={handleGenerate}
                          onDraft={handleDraftOnly}
                          isLoading={isLoading}
                          referenceImage={referenceImage}
                          setReferenceImage={setReferenceImage}
                          referenceMode={referenceMode}
                          setReferenceMode={setReferenceMode}
                          lastGeneratedImage={activeProjectImages[0]?.data || null}
                          drafts={activeDrafts}
                          onLaunchDraft={handleLaunchDraft}
                          onDeleteDraft={handleDeleteDraft}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Visual Workspace Column (takes remaining space dynamically) */}
                <div className={`${isControlPanelOpen ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12 w-full'} space-y-6 order-last transition-all duration-300`}>
                  
                  {/* 1. Loading State */}
                  {isLoading && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <Loading status={loadingMessage} step={loadingStep} facts={loadingFacts} />
                    </div>
                  )}

                  {/* 2. Error Notification Block */}
                  {error && !isLoading && (
                    <div className="p-6 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-center gap-4 text-red-800 dark:text-red-200 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 shadow-sm relative z-30">
                      <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500 dark:text-red-400" />
                      <div className="flex-1">
                          <p className="font-medium text-sm">{error}</p>
                          {(error.includes("Access denied") || error.includes("billing")) && (
                              <button 
                                  id="error-select-key-btn"
                                  onClick={handleSelectKey}
                                  className="mt-2 text-xs font-bold text-red-700 dark:text-red-300 underline hover:text-red-900 dark:hover:text-red-100"
                              >
                                  Select a different Gemini API key
                              </button>
                          )}
                      </div>
                    </div>
                  )}

                  {/* 3. Main Workspace Display */}
                  {!isLoading && (
                    <>
                      {/* A. Premium Prompt Studio Workspace */}
                      {hasDraft && (
                        <PromptStudio 
                          draftedPrompt={draftedPrompt}
                          setDraftedPrompt={setDraftedPrompt}
                          draftedFacts={draftedFacts}
                          draftedSearchResults={draftedSearchResults}
                          onGenerate={handleGenerateFromDraft}
                          onCancel={() => {
                            setHasDraft(false);
                            setTopic('');
                          }}
                          isLoading={isLoading}
                        />
                      )}

                      {/* B. Active Generated Infographic and Live Grounding Data */}
                      {activeProjectImages.length > 0 && !hasDraft && (
                        <div id="active-visual-anchor" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <Infographic 
                            image={activeProjectImages[0]} 
                            onEdit={handleEdit} 
                            isEditing={isLoading}
                            onAnnotate={() => setAnnotatingImage(activeProjectImages[0])}
                          />
                          <SearchResults results={activeProjectImages[0]?.searchResults || []} />
                        </div>
                      )}

                      {/* C. Empty Canvas Suggestion Guide when no generation/draft exists yet */}
                      {activeProjectImages.length === 0 && !hasDraft && (
                        <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 text-center bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm min-h-[420px] flex flex-col justify-center items-center shadow-inner relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 opacity-50"></div>
                          
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full scale-150 animate-pulse"></div>
                            <Compass className="w-16 h-16 text-cyan-500/70 dark:text-cyan-400/70 animate-[spin_60s_linear_infinite] relative z-10" />
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display relative z-10">Creative Knowledge Canvas</h3>
                          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed relative z-10">
                            Enter any historical event, mechanical model, biology layout or technical schematic in the Control Panel on the left, then click <strong>Instant Generate</strong> to see it visualised at the center of this canvas!
                          </p>
                          
                          {/* Interactive suggestions deck */}
                          <div className="mt-8 relative z-10 w-full max-w-lg">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 font-display">Example topics to explore:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {[
                                "Roman Aqueduct Cross Section",
                                "Photosynthesis Mechanism",
                                "Quantum Computing Qubits",
                                "Anatomy of the Human Heart",
                                "James Webb Space Telescope optics"
                              ].map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  id={`suggestion-btn-${idx}`}
                                  onClick={() => setTopic(suggestion)}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-cyan-500 dark:hover:border-cyan-400 hover:scale-[1.02] transition-all shadow-sm"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>

              </div>

              {/* Floating pull-tab to expand Control Panel when collapsed */}
              {!isControlPanelOpen && (
                <button
                  id="expand-sidebar-floating-btn"
                  onClick={() => setIsControlPanelOpen(true)}
                  className="fixed left-0 top-24 z-50 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-r-2xl shadow-2xl hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center gap-2 group animate-in slide-in-from-left-4 duration-300 border-t border-b border-r border-cyan-400/25"
                  title="Expand Control Panel"
                >
                  <SlidersHorizontal className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-bold font-display uppercase tracking-wider max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                    Control Panel
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Lightweight Recent Project Assets list strip */}
              {activeProjectImages.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-500" />
                      <span>Recent Project Generations</span>
                    </h4>
                    <button 
                      onClick={() => setCurrentView('gallery')}
                      className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open Library Vault</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {activeProjectImages.slice(0, 4).map((img, idx) => (
                      <div 
                        key={img.id}
                        onClick={() => selectImageFromGallery(img)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 cursor-pointer group shadow-sm transition-all"
                      >
                        <img src={img.data} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 bg-cyan-500 text-slate-950 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </ErrorBoundary>
          )}

          {/* View 3: Research Center */}
          {currentView === 'research' && (
            <ErrorBoundary fallbackTitle="Research Center Display Interrupted">
              <ResearchCenter 
                onSendToSocialCampaign={async (topic, prompt, companyContext) => {
                  let objective = topic || '';
                  let styleGuide = prompt || '';
                  if (prompt) {
                    const toastId = beginLoading('Curating campaign brief…');
                    try {
                      const brief = await curateResearchBrief(topic || '', prompt, companyContext || '', 'campaign');
                      if (brief.objective) objective = brief.objective;
                      if (brief.styleGuide) styleGuide = brief.styleGuide;
                      resolveToast(toastId, 'success', 'Campaign brief ready');
                    } catch (err) {
                      resolveToast(toastId, 'error', 'Could not curate brief — using original topic');
                      logTechnicalError('curateResearchBrief', err);
                    }
                  }
                  try {
                    sessionStorage.setItem(PENDING_CAMPAIGN_KEY, JSON.stringify({
                      name: topic || '',
                      topic: objective,
                      prompt: styleGuide,
                      website: companyContext || ''
                    }));
                  } catch { /* no-op */ }
                  // Backtrack any previously open workspace so the freshly
                  // mounted planner lands on the campaign list dashboard.
                  DBService.removeItem('infogenius_active_campaign_id').catch(() => {});
                  try { localStorage.removeItem('infogenius_active_campaign_id'); } catch { /* no-op */ }
                  setDraftsTab('social');
                }}
                onSendToVideoStudio={(videoPrompt, scriptText) => {
                  const combined = videoPrompt + (scriptText ? `\n\n[Script Breakdown]:\n${scriptText}` : '');
                  try { sessionStorage.setItem(PENDING_VIDEO_KEY, combined); } catch { /* no-op */ }
                  setCurrentView('video-studio');
                }}
                onSaveToDraftPlanner={(topic, prompt) => {
                  handleCreateDraft({
                    topic: topic || 'Researched Strategy',
                    complexityLevel: 'Default',
                    visualStyle: 'Carousel',
                    language: 'Default',
                    resolution: '9:16',
                    subOptions: { notes: prompt }
                  });
                  setCurrentView('drafts');
                }}
                onBackToDashboard={() => setCurrentView('dashboard')}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                onSelectKey={handleSelectKey}
              />
            </ErrorBoundary>
          )}

          {/* View 4: Planner Drafts */}
          {currentView === 'drafts' && (
            <ErrorBoundary fallbackTitle="Drafts & Campaigns Planner Display Interrupted">
              <div className="p-4 md:p-6 space-y-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit border border-slate-700 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-purple-400" />
                  <span>Back to Projects Space</span>
                </button>
                <DraftsPlanner 
                  activeTab={draftsTab === 'social' ? 'social-campaign' : 'blueprints'}
                  onTabChange={(tab) => setDraftsTab(tab === 'social-campaign' ? 'social' : 'drafts')}
                  activeProjectId={selectedProjectId || 'proj-1'}
                  drafts={activeDrafts}
                  onCreateDraft={handleCreateDraft}
                  onDeleteDraft={handleDeleteDraft}
                  onLaunchDraft={handleLaunchDraft}
                />
              </div>
            </ErrorBoundary>
          )}

          {/* View 5: Full Page Library Gallery */}
          {currentView === 'gallery' && (
            <ErrorBoundary fallbackTitle="Gallery Dashboard Display Interrupted">
              <div className="p-4 md:p-6 space-y-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit border border-slate-700 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-purple-400" />
                  <span>Back to Projects Space</span>
                </button>
                <GalleryDashboard 
                  images={imageHistory}
                  onSelectImage={(img) => {
                    selectImageFromGallery(img);
                    setCurrentView('canvas');
                  }}
                  onDeleteImage={deleteImageFromGallery}
                  onClearAll={clearAllGallery}
                  onLoadForTweaking={(img) => {
                    loadForTweaking(img);
                    setCurrentView('canvas');
                  }}
                  activeProjectId={selectedProjectId}
                  projects={projects}
                  onNavigateToVoiceoverStudio={() => setCurrentView('voiceover-studio')}
                />
              </div>
            </ErrorBoundary>
          )}

          {/* View 6: Presenter Studio */}
          {currentView === 'presenter-studio' && (
            <ErrorBoundary fallbackTitle="Presenter Studio Display Interrupted">
              <PresenterStudio 
                images={imageHistory}
                activeProjectId={selectedProjectId}
                onBackToDashboard={() => setCurrentView('dashboard')}
              />
            </ErrorBoundary>
          )}

          {/* View 7: Voiceover Studio */}
          {currentView === 'voiceover-studio' && (
            <ErrorBoundary fallbackTitle="Voiceover Studio Display Interrupted">
              <div className="p-4 md:p-6">
                <VoiceoverStudio 
                  images={imageHistory}
                  activeProjectId={selectedProjectId}
                  projects={projects}
                  onBackToDashboard={() => setCurrentView('dashboard')}
                  onSelectProject={setSelectedProjectId}
                />
              </div>
            </ErrorBoundary>
          )}

          {/* View 8: Video Studio */}
          {currentView === 'video-studio' && (
            <ErrorBoundary fallbackTitle="Video Studio Display Interrupted">
              <div className="p-4 md:p-6">
                <VideoStudio 
                  images={imageHistory}
                  activeProjectId={selectedProjectId}
                  projects={projects}
                  onBackToDashboard={() => setCurrentView('dashboard')}
                  onSelectProject={setSelectedProjectId}
                />
              </div>
            </ErrorBoundary>
          )}

          {/* View 9: Sound Effects & Soundtracks Studio */}
          {currentView === 'sound-studio' && (
            <ErrorBoundary fallbackTitle="Sound Studio Display Interrupted">
              <div className="p-4 md:p-6">
                <SoundStudio />
              </div>
            </ErrorBoundary>
          )}

          {/* View 10: Model Management */}
          {currentView === 'models' && (
            <ErrorBoundary fallbackTitle="Model Management Display Interrupted">
              <ModelsSettings onBackToDashboard={() => setCurrentView('dashboard')} />
            </ErrorBoundary>
          )}

          {/* View 11: Blog Studio (dedicated blog post management) */}
          {currentView === 'blog' && (
            <ErrorBoundary fallbackTitle="Blog Studio Display Interrupted">
              <BlogStudio onBackToDashboard={() => setCurrentView('dashboard')} />
            </ErrorBoundary>
          )}
          </>
          )}

        </main>
      </div>
    </div>
    )}

    {annotatingImage && (
      <AnnotationStudio 
        image={annotatingImage}
        onSave={handleSaveAnnotations}
        onClose={() => setAnnotatingImage(null)}
      />
    )}

    {presentingProject && (
      <PresentationDeck 
        project={presentingProject}
        images={imageHistory.filter(img => (img.subOptions?.projectId || 'proj-1') === presentingProject.id)}
        allImages={imageHistory}
        projects={projects}
        onImportImages={(imageIds) => handleImportImagesToProject(imageIds, presentingProject.id)}
        onClose={() => setPresentingProject(null)}
      />
    )}

    {/* Persistent "Video Generating" banner — visible from any view */}
    {videoGenBanner.status === 'running' && (
      <button
        type="button"
        onClick={() => {
          if (currentView !== 'video-studio') setCurrentView('video-studio');
        }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] w-[min(92vw,440px)] bg-slate-900/95 border border-indigo-500/40 rounded-2xl px-4 py-3 shadow-2xl shadow-indigo-500/10 flex items-center gap-3 cursor-pointer hover:border-indigo-400 transition-colors animate-in slide-in-from-bottom-4 duration-200"
        id="video-generation-banner"
      >
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Video Generating</span>
            <span className="text-[9px] text-slate-400 font-mono truncate">{videoGenBanner.model || 'Video'}</span>
          </div>
          <p className="text-[11px] text-slate-300 truncate">{videoGenBanner.step || 'Initializing...'}</p>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${videoGenBanner.progress}%` }}
            ></div>
          </div>
        </div>
        {currentView !== 'video-studio' && (
          <span className="text-[10px] text-slate-400 shrink-0 font-semibold">View</span>
        )}
      </button>
    )}

    {/* Global toast for generation failures / completions */}
    {genToast && genToast.kind === 'error' && (
      <div className="fixed bottom-4 right-4 z-[150] w-[min(92vw,380px)] bg-rose-950/95 border border-rose-500/40 rounded-2xl p-4 shadow-2xl shadow-rose-500/10 animate-in slide-in-from-bottom-4 duration-200 space-y-2">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-rose-200 uppercase tracking-wider">Video Generation Failed</p>
            <p className="text-[11px] text-rose-300/90 mt-1 line-clamp-3 break-words">{genToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setGenToast(null)}
            className="text-rose-400 hover:text-white shrink-0 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )}
    {genToast && genToast.kind === 'success' && (
      <div className="fixed bottom-4 right-4 z-[150] w-[min(92vw,380px)] bg-emerald-950/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl shadow-emerald-500/10 animate-in slide-in-from-bottom-4 duration-200 space-y-2">
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Video Ready</p>
            <p className="text-[11px] text-emerald-300/90 mt-1">{genToast.message}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {currentView !== 'video-studio' && (
              <button
                type="button"
                onClick={() => { setGenToast(null); setCurrentView('video-studio'); }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg"
              >
                View
              </button>
            )}
            <button
              type="button"
              onClick={() => setGenToast(null)}
              className="text-emerald-400 hover:text-white p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )}
    <Toaster theme={isDarkMode ? 'dark' : 'light'} position="bottom-right" richColors />
    </>
  );
};

export default App;
