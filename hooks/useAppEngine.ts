import { useState, useEffect } from 'react';
import { 
  GeneratedImage, 
  ComplexityLevel, 
  VisualStyle, 
  Language, 
  AspectRatio, 
  SearchResultItem, 
  Project, 
  DraftPrompt 
} from '../types';
import { 
  researchTopicForPrompt, 
  generateInfographicImage, 
  editInfographicImage,
} from '../services/geminiService';
import { DBService } from '../services/dbService';

// Ensure standard typings for window.aistudio if TypeScript needs it
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

export const useAppEngine = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [topic, setTopic] = useState('');
  
  // Navigation View & Sidebar state
  const [currentView, setCurrentView] = useState<'dashboard' | 'canvas' | 'drafts' | 'gallery' | 'research' | 'video-studio' | 'voiceover-studio'>('canvas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Projects State
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = localStorage.getItem('infogenius_projects');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse projects from localStorage", e);
      }
    }
    return [
      { id: 'proj-1', name: 'Default Research Space', description: 'Primary topic visualizers and concept breakdowns', createdAt: Date.now() },
      { id: 'proj-2', name: 'Science Illustrations', description: 'Detailed biological mechanics and quantum layouts', createdAt: Date.now() }
    ];
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const stored = localStorage.getItem('infogenius_selected_project_id');
    return stored !== null ? stored : 'proj-1';
  });

  // Blueprint Drafts State
  const [drafts, setDrafts] = useState<DraftPrompt[]>(() => {
    const stored = localStorage.getItem('infogenius_drafts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          return parsed.map((d: any, idx: number) => {
            if (!d) return null;
            let finalId = d.id;
            if (!finalId || seenIds.has(finalId)) {
              finalId = `draft-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenIds.add(finalId);
            return { ...d, id: finalId };
          }).filter(Boolean) as DraftPrompt[];
        }
      } catch (e) {
        console.error("Failed to parse drafts from localStorage", e);
      }
    }
    return [
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
  });

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
    setSubOptions(draft.subOptions);
    setHasDraft(false); // Reset current active PromptStudio draft if any
    setCurrentView('canvas');
  };
  
  // Adaptive settings default to 'Default' (Auto-Detect / Follow Prompt)
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>('Default');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('Default');
  const [language, setLanguage] = useState<Language>('Default');
  const [resolution, setResolution] = useState<AspectRatio>('16:9');
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
  const activeProjectImages = imageHistory.filter(img => (img.subOptions?.projectId || 'proj-1') === selectedProjectId);
  const activeDrafts = drafts.filter(d => (d.subOptions?.projectId || 'proj-1') === selectedProjectId);
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

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem('infogenius_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('infogenius_selected_project_id', selectedProjectId);
    } else {
      localStorage.removeItem('infogenius_selected_project_id');
    }
  }, [selectedProjectId]);

  useEffect(() => {
    localStorage.setItem('infogenius_drafts', JSON.stringify(drafts));
  }, [drafts]);

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
      let base64Data = await generateInfographicImage(researchResult.imagePrompt, resolution, referenceImage || undefined, referenceMode);
      
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
        subOptions: { ...subOptions, projectId: selectedProjectId || undefined },
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
      let base64Data = await generateInfographicImage(draftedPrompt, resolution, referenceImage || undefined, referenceMode);
      
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
        subOptions: { ...subOptions, projectId: selectedProjectId || undefined },
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
        subOptions: { ...(currentImage.subOptions || {}), projectId: selectedProjectId || undefined },
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
    setHasDraft(true);
  };

  return {
    showIntro, setShowIntro,
    topic, setTopic,
    currentView, setCurrentView,
    isSidebarOpen, setIsSidebarOpen,
    projects, setProjects,
    selectedProjectId, setSelectedProjectId,
    drafts, setDrafts,
    complexityLevel, setComplexityLevel,
    visualStyle, setVisualStyle,
    language, setLanguage,
    resolution, setResolution,
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
  };
};
