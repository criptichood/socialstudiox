import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  GeneratedImage, 
  ComplexityLevel, 
  VisualStyle, 
  Language, 
  AspectRatio, 
  SearchResultItem, 
  Project, 
  DraftPrompt,
  ViewType,
  ImageModelId
} from '@/types';
import { 
  researchTopicForPrompt, 
  generateInfographicImage, 
  editInfographicImage,
} from '@/services/geminiService';
import { DBService } from '@/services/dbService';

// Standard typings for window.aistudio if TypeScript needs it
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

export type DraftsTab = 'drafts' | 'social';

interface ParsedLocation {
  view: ViewType;
  draftsTab: DraftsTab;
  isKnown: boolean;
}

const PATH_TO_VIEW: Record<string, ViewType> = {
  dashboard: 'dashboard',
  canvas: 'canvas',
  research: 'research',
  gallery: 'gallery',
  presenter: 'presenter-studio',
  voiceover: 'voiceover-studio',
  video: 'video-studio',
  sound: 'sound-studio',
  campaign: 'drafts'
};

const parseLocation = (path: string): ParsedLocation => {
  const segments = path.split('/').filter(Boolean);
  const seg0 = segments[0] || '';
  if (seg0 === '') return { view: 'canvas', draftsTab: 'drafts', isKnown: true };
  const view = PATH_TO_VIEW[seg0];
  if (!view) return { view: 'canvas', draftsTab: 'drafts', isKnown: false };
  if (view === 'drafts') {
    return { view, draftsTab: segments[1] === 'social' ? 'social' : 'drafts', isKnown: true };
  }
  return { view, draftsTab: 'drafts', isKnown: true };
};

const pathForView = (view: ViewType, draftsTab: DraftsTab): string => {
  switch (view) {
    case 'dashboard': return '/dashboard';
    case 'canvas': return '/canvas';
    case 'research': return '/research';
    case 'gallery': return '/gallery';
    case 'presenter-studio': return '/presenter';
    case 'voiceover-studio': return '/voiceover';
    case 'video-studio': return '/video';
    case 'sound-studio': return '/sound';
    case 'drafts':
      return draftsTab === 'social' ? '/campaign/social' : '/campaign/draft';
  }
};

export const useAppEngine = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [showIntro, setShowIntro] = useState(pathname === '/');
  const [topic, setTopic] = useState('');

  // Navigation View & Sidebar state (URL-driven)
  const initialLocation = parseLocation(pathname);
  const [currentView, setCurrentViewState] = useState<ViewType>(initialLocation.view);
  const [draftsTab, setDraftsTabState] = useState<DraftsTab>(initialLocation.draftsTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Keep view state in sync with the address bar (refresh, browser back/forward)
  useEffect(() => {
    const loc = parseLocation(pathname);
    if (!loc.isKnown) {
      router.replace('/dashboard');
      return;
    }
    setCurrentViewState(loc.view);
    setDraftsTabState(loc.draftsTab);
  }, [pathname, router]);

  const setCurrentView = (view: ViewType) => {
    setCurrentViewState(view);
    router.push(pathForView(view, draftsTab));
  };

  const setDraftsTab = (tab: DraftsTab) => {
    setDraftsTabState(tab);
    router.push(pathForView('drafts', tab));
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    router.replace('/dashboard');
  };

  // Projects & Drafts State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftPrompt[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Load Projects & Drafts from IndexedDB on Mount
  useEffect(() => {
    let isMounted = true;
    const loadStoredData = async () => {
      try {
        const defaultProjects: Project[] = [
          { id: 'proj-1', name: 'Default Research Space', description: 'Primary topic visualizers and concept breakdowns', createdAt: Date.now() },
          { id: 'proj-2', name: 'Science Illustrations', description: 'Detailed biological mechanics and quantum layouts', createdAt: Date.now() }
        ];
        const defaultDrafts: DraftPrompt[] = [
          {
            id: 'draft-1',
            topic: 'Mechanical Clockwork Mechanics cross section',
            complexityLevel: 'Expert',
            visualStyle: '3D Render',
            language: 'English',
            resolution: '16:9',
            subOptions: { projectId: 'proj-1' },
            createdAt: Date.now()
          }
        ];

        const loadedProjects = await DBService.getItem<Project[]>('infogenius_projects', defaultProjects);
        const loadedSelectedId = await DBService.getItem<string | null>('infogenius_selected_project_id', 'proj-1');
        const loadedDrafts = await DBService.getItem<DraftPrompt[]>('infogenius_drafts', defaultDrafts);

        if (isMounted) {
          setProjects(loadedProjects);
          setSelectedProjectId(loadedSelectedId);
          setDrafts(loadedDrafts);
          setIsLoadingData(false);
        }
      } catch (err) {
        console.error("Failed to load projects/drafts from IndexedDB:", err);
        if (isMounted) setIsLoadingData(false);
      }
    };
    loadStoredData();
    return () => { isMounted = false; };
  }, []);

  const handleCreateProject = (name: string, description: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      createdAt: Date.now()
    };
    setProjects(prev => [...prev, newProj]);
    setSelectedProjectId(newProj.id);
  };

  const handleUpdateProject = (id: string, name: string, description: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, description } : p));
  };

  const handleSaveAnnotations = async (annotations: any[]) => {
    if (!annotatingImage) return;
    const updatedImage: GeneratedImage = {
      ...annotatingImage,
      annotations
    };
    setImageHistory(prev => prev.map(img => img.id === annotatingImage.id ? updatedImage : img));
    try {
      await DBService.save(updatedImage);
    } catch (e) {
      console.error("Failed to save updated annotations to IndexedDB", e);
    }
    setAnnotatingImage(null);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(projects.find(p => p.id !== id)?.id || null);
    }
  };

  const handleCreateDraft = (draft: Omit<DraftPrompt, 'id' | 'createdAt'>) => {
    const newDraft: DraftPrompt = {
      ...draft,
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      subOptions: { ...draft.subOptions, projectId: selectedProjectId || 'proj-1' }
    };
    setDrafts(prev => [newDraft, ...prev]);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleLaunchDraft = (draft: DraftPrompt) => {
    setTopic(draft.topic);
    setComplexityLevel(draft.complexityLevel);
    setVisualStyle(draft.visualStyle);
    setLanguage(draft.language);
    setResolution(draft.resolution);
    if (draft.imageModel) setImageModel(draft.imageModel);
    setSubOptions(draft.subOptions);
    setHasDraft(false); // Reset current active PromptStudio draft if any
    setCurrentView('canvas');
  };
  
  // Adaptive settings default to 'Default' (Auto-Detect / Follow Prompt)
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>('Default');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('Default');
  const [language, setLanguage] = useState<Language>('Default');
  const [resolution, setResolution] = useState<AspectRatio>('16:9');
  const [imageModel, setImageModel] = useState<ImageModelId>('gemini-3.1-flash-image');
  const [subOptions, setSubOptions] = useState<Record<string, string>>({});
  
  // Interactive Prompt Studio State
  const [hasDraft, setHasDraft] = useState(false);
  const [draftedPrompt, setDraftedPrompt] = useState('');
  const [draftedFacts, setDraftedFacts] = useState<string[]>([]);
  const [draftedSearchResults, setDraftedSearchResults] = useState<SearchResultItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [loadingFacts, setLoadingFacts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResultItem[]>([]);

  // Reference Image states
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceMode, setReferenceMode] = useState<'layout' | 'background' | 'style'>('layout');

  // Multi-Layer Annotation & Presentation deck state (Phase 3 & 4)
  const [annotatingImage, setAnnotatingImage] = useState<GeneratedImage | null>(null);
  const [presentingProject, setPresentingProject] = useState<Project | null>(null);

  // Derived state for project-sandbox isolation (Phase 2)
  const activeProjectImages = imageHistory.filter(img => {
    const imgPid = img.subOptions?.projectId;
    if (!selectedProjectId) {
      return !imgPid || imgPid === 'global';
    }
    return imgPid === selectedProjectId;
  });

  const activeDrafts = drafts.filter(d => {
    const draftPid = d.subOptions?.projectId;
    if (!selectedProjectId) {
      return !draftPid || draftPid === 'global';
    }
    return draftPid === selectedProjectId;
  });

  // State maps for assets associated with projects (reloaded dynamically on returning to dashboard)
  const [campaignCounts, setCampaignCounts] = useState<Record<string, number>>({});
  const [voiceoverCounts, setVoiceoverCounts] = useState<Record<string, number>>({});
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});

  const reloadAssetCounts = async () => {
    try {
      const storedCampaigns = await DBService.getItem<any[]>('infogenius_saved_campaigns', []);
      const storedVoiceovers = await DBService.getItem<any[]>('social_studio_voiceover_sessions', []);
      const storedVideos = await DBService.getItem<any[]>('social_studio_x_generated_videos_v1', []);

      const cmap: Record<string, number> = {};
      storedCampaigns.forEach(c => {
        const pid = c.projectId || 'proj-1';
        cmap[pid] = (cmap[pid] || 0) + 1;
      });

      const vmap: Record<string, number> = {};
      storedVoiceovers.forEach(v => {
        const pid = v.projectId || 'global';
        vmap[pid] = (vmap[pid] || 0) + 1;
      });

      const vidmap: Record<string, number> = {};
      storedVideos.forEach(vid => {
        const pid = vid.projectId || 'global';
        vidmap[pid] = (vidmap[pid] || 0) + 1;
      });

      setCampaignCounts(cmap);
      setVoiceoverCounts(vmap);
      setVideoCounts(vidmap);
    } catch (err) {
      console.error("Failed to load asset counts:", err);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard') {
      reloadAssetCounts();
    }
  }, [currentView]);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Apply dark mode classes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load image history from IndexedDB on startup
  useEffect(() => {
    const loadImages = async () => {
      try {
        const stored = await DBService.getAll();
        if (stored) {
          const seenIds = new Set<string>();
          const sanitized = stored.map((img: any, idx: number) => {
            if (!img) return null;
            let finalId = img.id;
            if (!finalId || seenIds.has(finalId)) {
              finalId = `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenIds.add(finalId);
            return { ...img, id: finalId };
          }).filter(Boolean) as GeneratedImage[];
          
          setImageHistory(sanitized);
          if (sanitized.length > 0) {
            if (sanitized[0].searchResults) {
              setCurrentSearchResults(sanitized[0].searchResults);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load images from IndexedDB", e);
      }
    };
    loadImages();
  }, []);

  // Listen to visual generation updates from outside the main canvas (e.g. campaign workspace popup generator)
  useEffect(() => {
    const handleRefreshHistory = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setImageHistory(prev => [customEvent.detail, ...prev]);
      } else {
        DBService.getAll().then(stored => {
          setImageHistory(stored);
        });
      }
    };
    window.addEventListener('infogenius-refresh-history', handleRefreshHistory);
    return () => {
      window.removeEventListener('infogenius-refresh-history', handleRefreshHistory);
    };
  }, []);

  // Synchronize state changes to IndexedDB
  useEffect(() => {
    if (!isLoadingData) {
      DBService.setItem('infogenius_projects', projects).catch(err => {
        console.error("Failed to save projects to IndexedDB:", err);
      });
    }
  }, [projects, isLoadingData]);

  useEffect(() => {
    if (!isLoadingData) {
      if (selectedProjectId) {
        DBService.setItem('infogenius_selected_project_id', selectedProjectId).catch(err => {
          console.error("Failed to save selectedProjectId to IndexedDB:", err);
        });
      } else {
        DBService.removeItem('infogenius_selected_project_id').catch(() => {});
      }
    }
  }, [selectedProjectId, isLoadingData]);

  useEffect(() => {
    if (!isLoadingData) {
      DBService.setItem('infogenius_drafts', drafts).catch(err => {
        console.error("Failed to save drafts to IndexedDB:", err);
      });
    }
  }, [drafts, isLoadingData]);

  // Check for API Key on Mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setError(null);
      } catch (e) {
        console.error("Failed to open key selector:", e);
      }
    }
  };

  // 1. Direct generation flow (Auto-Generate instantly)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!topic.trim()) {
        setError("Please enter a topic to visualize.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingFacts([]);
    setCurrentSearchResults([]);
    setLoadingMessage(`Researching and engineering prompt for ${resolution} layout...`);

    try {
      // Step 1: Research and construct professional prompt
      const researchResult = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language, resolution, subOptions);
      
      setLoadingFacts(researchResult.facts);
      setCurrentSearchResults(researchResult.searchResults);
      
      setLoadingStep(2);
      setLoadingMessage(`Generating customized illustration...`);
      
      // Step 2: Direct Image Generation using the LLM's tailored prompt
      let base64Data = await generateInfographicImage(researchResult.imagePrompt, resolution, referenceImage || undefined, referenceMode, imageModel);
      
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        data: base64Data,
        prompt: topic,
        imagePrompt: researchResult.imagePrompt,
        timestamp: Date.now(),
        level: complexityLevel,
        style: visualStyle,
        language: language,
        resolution: resolution,
        subOptions: { ...subOptions, ...(selectedProjectId ? { projectId: selectedProjectId } : {}) },
        facts: researchResult.facts,
        searchResults: researchResult.searchResults
      };

      await DBService.save(newImage);
      setImageHistory(prev => [newImage, ...prev]);
      setHasDraft(false); // Clear drafts on successful instant generation
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. The selected API key does not have access to the required models. Please select a project with billing enabled.");
          setHasApiKey(false);
      } else {
          setError('The image generation service is temporarily unavailable. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  // 2. Draft Only flow (Prepares the prompt so user can view/edit it)
  const handleDraftOnly = async () => {
    if (isLoading) return;

    if (!topic.trim()) {
        setError("Please enter a topic to draft.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingFacts([]);
    setLoadingMessage(`Drafting professional visual prompt guides...`);

    try {
      const researchResult = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language, resolution, subOptions);
      setDraftedPrompt(researchResult.imagePrompt);
      setDraftedFacts(researchResult.facts);
      setDraftedSearchResults(researchResult.searchResults);
      setHasDraft(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to research topic or compile draft prompt. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  // 3. Finalize image generation using the customized prompt in the Prompt Studio
  const handleGenerateFromDraft = async () => {
    if (isLoading) return;

    if (!draftedPrompt.trim()) {
      setError("Visual prompt cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(2);
    setLoadingMessage(`Synthesizing premium digital asset...`);
    setLoadingFacts(draftedFacts);
    setCurrentSearchResults(draftedSearchResults);

    try {
      let base64Data = await generateInfographicImage(draftedPrompt, resolution, referenceImage || undefined, referenceMode, imageModel);
      
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        data: base64Data,
        prompt: topic,
        imagePrompt: draftedPrompt,
        timestamp: Date.now(),
        level: complexityLevel,
        style: visualStyle,
        language: language,
        resolution: resolution,
        subOptions: { ...subOptions, ...(selectedProjectId ? { projectId: selectedProjectId } : {}) },
        facts: [...draftedFacts],
        searchResults: [...draftedSearchResults]
      };

      await DBService.save(newImage);
      setImageHistory(prev => [newImage, ...prev]);
      setHasDraft(false); // Successfully generated, close panel
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. Please select a project with billing enabled.");
          setHasApiKey(false);
      } else {
          setError('The image generation service failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  // 4. Custom edit/modification handler (Preserves history by saving edit as new record)
  const handleEdit = async (editPrompt: string) => {
    if (activeProjectImages.length === 0) return;
    const currentImage = activeProjectImages[0];
    setIsLoading(true);
    setError(null);
    setLoadingStep(2);
    setLoadingMessage(`Processing Modification: "${editPrompt}"...`);

    try {
      const base64Data = await editInfographicImage(currentImage.data, editPrompt);
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        data: base64Data,
        prompt: `${currentImage.prompt} (Edit: ${editPrompt})`,
        imagePrompt: `Edited original prompt. Modification directive: ${editPrompt}. Original visual instructions: ${currentImage.imagePrompt}`,
        timestamp: Date.now(),
        level: currentImage.level,
        style: currentImage.style,
        language: currentImage.language,
        resolution: currentImage.resolution,
        subOptions: { ...(currentImage.subOptions || {}), ...(selectedProjectId ? { projectId: selectedProjectId } : {}) },
        facts: currentImage.facts ? [...currentImage.facts] : [],
        searchResults: currentImage.searchResults ? [...currentImage.searchResults] : []
      };

      await DBService.save(newImage);
      setImageHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. Please select a valid API key with billing enabled.");
          setHasApiKey(false);
      } else {
          setError('Modification failed. Try a different command.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  // Gallery Select Callback
  const selectImageFromGallery = (img: GeneratedImage) => {
    if (img.subOptions?.projectId && img.subOptions.projectId !== selectedProjectId) {
      setSelectedProjectId(img.subOptions.projectId);
    }
    const filtered = imageHistory.filter(i => i.id !== img.id);
    setImageHistory([img, ...filtered]);
    if (img.searchResults) {
      setCurrentSearchResults(img.searchResults);
    }
    const anchor = document.getElementById('active-visual-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Gallery Delete Callback
  const deleteImageFromGallery = async (id: string) => {
    try {
      await DBService.delete(id);
      setImageHistory(prev => prev.filter(img => img.id !== id));
    } catch (e) {
      console.error("Failed to delete from IndexedDB", e);
    }
  };

  // Gallery Clear All Callback
  const clearAllGallery = async () => {
    try {
      await DBService.clearAll();
      setImageHistory([]);
      setCurrentSearchResults([]);
    } catch (e) {
      console.error("Failed to clear local database", e);
    }
  };

  const handleImportImagesToProject = async (imageIds: string[], targetProjectId: string) => {
    const updatedHistory = imageHistory.map(img => {
      if (imageIds.includes(img.id)) {
        return {
          ...img,
          subOptions: {
            ...img.subOptions,
            projectId: targetProjectId
          }
        };
      }
      return img;
    });
    
    for (const imgId of imageIds) {
      const img = updatedHistory.find(i => i.id === imgId);
      if (img) {
        try {
          await DBService.save(img);
        } catch (e) {
          console.error("Failed to save imported image to IndexedDB", e);
        }
      }
    }
    
    setImageHistory(updatedHistory);
  };

  // Gallery Load Back For Tweaking Callback
  const loadForTweaking = (img: GeneratedImage) => {
    if (img.subOptions?.projectId && img.subOptions.projectId !== selectedProjectId) {
      setSelectedProjectId(img.subOptions.projectId);
    }
    setTopic(img.prompt.replace(/\s*\(Edit:.*?\)$/, ''));
    setComplexityLevel(img.level || 'Default');
    setVisualStyle(img.style || 'Default');
    setLanguage(img.language || 'Default');
    setResolution(img.resolution || '16:9');
    setSubOptions(img.subOptions || {});
    setDraftedPrompt(img.imagePrompt);
    setDraftedFacts(img.facts || []);
    setDraftedSearchResults(img.searchResults || []);
    setReferenceImage(img.data);
    setReferenceMode('style');
    setHasDraft(true);
  };

  return {
    showIntro, setShowIntro, handleIntroComplete,
    topic, setTopic,
    currentView, setCurrentView,
    draftsTab, setDraftsTab,
    isSidebarOpen, setIsSidebarOpen,
    projects, setProjects,
    selectedProjectId, setSelectedProjectId,
    drafts, setDrafts,
    isLoadingData,
    complexityLevel, setComplexityLevel,
    visualStyle, setVisualStyle,
    language, setLanguage,
    resolution, setResolution,
    imageModel, setImageModel,
    subOptions, setSubOptions,
    hasDraft, setHasDraft,
    draftedPrompt, setDraftedPrompt,
    draftedFacts, setDraftedFacts,
    draftedSearchResults, setDraftedSearchResults,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
    loadingStep, setLoadingStep,
    loadingFacts, setLoadingFacts,
    error, setError,
    imageHistory, setImageHistory,
    currentSearchResults, setCurrentSearchResults,
    referenceImage, setReferenceImage,
    referenceMode, setReferenceMode,
    annotatingImage, setAnnotatingImage,
    presentingProject, setPresentingProject,
    isDarkMode, setIsDarkMode,
    isControlPanelOpen, setIsControlPanelOpen,
    hasApiKey, setHasApiKey,
    checkingKey, setCheckingKey,

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
    handleImportImagesToProject,
    reloadAssetCounts
  };
};
