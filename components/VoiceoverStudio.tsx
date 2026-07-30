import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedImage, Project, SubtitleSegment } from '../types';
import { DBService } from '../services/dbService';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon,
  Check, 
  AlertCircle,
  UploadCloud,
  Volume2,
  Trash2,
  Plus,
  Save,
  FileAudio,
  Radio,
  X,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ArrowRightLeft,
  FolderOpen,
  Calendar,
  Grid,
  Users,
  Clock,
  ExternalLink,
  VolumeX,
  ListMusic,
  FileText
} from 'lucide-react';
import { generateVoiceOverSpeech, generateImageToScript } from '../services/geminiService';
import { generateSrtFromScript, downloadSrtFile } from '../services/subtitleService';
import { AudioSubtitleViewer } from './AudioSubtitleViewer';

interface VoiceoverStudioProps {
  images: GeneratedImage[];
  activeProjectId?: string | null;
  projects?: Project[];
  onBackToDashboard?: () => void;
}

interface VoiceoverSession {
  id: string;
  projectId: string; // project ID or 'global'
  name: string;
  scriptText: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  deliveryStyleId: string;
  customDeliveryStyle?: string;
  createdAt: number;
  selectedImageId?: string | null;
  customImageBase64?: string | null;
  ttsModel?: string;
  subtitles?: SubtitleSegment[];
  srtText?: string;
}

interface StandaloneProject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

// Self-contained IndexedDB utility inside VoiceoverStudio.tsx for premium high-fidelity audio caching!
const AUDIO_DB_NAME = 'SocialStudioVoiceoverAudioDB';
const AUDIO_STORE_NAME = 'audio_blobs';

const saveAudioToIndexedDB = async (id: string, blobUrl: string): Promise<void> => {
  try {
    let blob: Blob;
    if (blobUrl.startsWith('data:')) {
      const parts = blobUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'audio/wav';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      const response = await fetch(blobUrl);
      blob = await response.blob();
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AUDIO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
        const store = tx.objectStore(AUDIO_STORE_NAME);
        store.put(blob, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to persist audio blob to IndexedDB", err);
  }
};

const loadAudioFromIndexedDB = async (id: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const blob = getReq.result as Blob;
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

const deleteAudioFromIndexedDB = async (id: string): Promise<void> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        resolve();
        return;
      }
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
};

const safeConfirm = (message: string): boolean => {
  try {
    return confirm(message);
  } catch (err) {
    // Fallback when confirm() is blocked by sandboxed iframe
    return true;
  }
};

const autoGenerateTrackName = (scriptText: string, voiceName: string): string => {
  const clean = scriptText
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .split(/\s+/)
    .slice(0, 4) // first 4 words
    .join(' ');
  
  const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const base = clean ? `"${clean}..."` : 'Voiceover Track';
  return `${base} (${voiceName} - ${dateStr})`;
};

const MALE_VOICES = [
  { id: 'Puck' as const, name: 'Puck (Classic Male)', description: 'Energetic Male' },
  { id: 'Charon' as const, name: 'Charon (Deep Mono)', description: 'Deep, Authoritative Male' },
  { id: 'Fenrir' as const, name: 'Fenrir (Sleek Warm)', description: 'Modern, Warm Male' }
];

const FEMALE_VOICES = [
  { id: 'Kore' as const, name: 'Kore (Inspirational)', description: 'Inspiring & Enthusiastic Female' },
  { id: 'Aoede' as const, name: 'Aoede (Resonant)', description: 'Empathetic & Rich Female' }
];

const TTS_MODELS = [
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 tts-preview (Recommended)', description: 'Ultra-realistic native audio speech synthesizer' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Audio (Experimental)', description: 'Fast experimental multimodal audio synthesizer' }
];

const PERSONA_STYLES = [
  { id: 'adult', name: '🧑 Adult Standard Voice', description: 'Natural, mature adult speaking voice' },
  { id: 'child', name: '👧 Child / Kid Voice', description: 'Higher pitch, innocent, playful, curious kid cadence' },
  { id: 'teenager', name: '🎧 Teenager / Youth Voice', description: 'Upbeat, casual student/youth voice' },
  { id: 'anime', name: '✨ Anime / Cartoon Character', description: 'Expressive, animated, energetic character cadence' },
  { id: 'anime_hero', name: '⚡ Anime Hero / Protagonist Dub', description: 'Passionate, resolute, high-energy main character voice' },
  { id: 'anime_mascot', name: '🐾 Anime Chibi / Mascot Voice', description: 'Cute, high-pitched, enthusiastic character cadence' },
  { id: 'senior', name: '👴 Senior / Elder Voice', description: 'Warm, wise, experienced elder voice' }
];

const ACCENT_OPTIONS = [
  { id: 'US Standard', name: '🇺🇸 US Standard' },
  { id: 'Anime Dub', name: '🎌 Japanese Anime Dub (English Dub Style)' },
  { id: 'British', name: '🇬🇧 British Accent' },
  { id: 'Australian', name: '🇦🇺 Australian Accent' },
  { id: 'Canadian', name: '🇨🇦 Canadian Accent' },
  { id: 'Irish', name: '🇮🇪 Irish Accent' },
  { id: 'Scottish', name: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish Accent' },
  { id: 'Nigerian', name: '🇳🇬 Nigerian Accent' },
  { id: 'Indian', name: '🇮🇳 Indian Accent' },
  { id: 'Transatlantic', name: '✈️ Transatlantic Accent' }
];

const SPEAKING_SPEEDS = [
  { id: '0.8', name: '🐢 0.8x Slow & Relaxed', description: 'Deliberate, unhurried pacing with spacious breath pauses' },
  { id: '1.0', name: '🍃 1.0x Normal Speed', description: 'Standard natural conversational cadence' },
  { id: '1.25', name: '⚡ 1.25x Upbeat & Snappy', description: 'Energetic, slightly brisk pacing' },
  { id: '1.5', name: '🚀 1.5x Anime Rapid Pace', description: 'Fast, swift articulation and quick word transitions' },
  { id: '1.75', name: '🔥 1.75x Hyper Speed', description: 'Ultra-fast rapid-fire speech rate' }
];

const DELIVERY_STYLES = [
  { id: 'natural', name: '🍃 Natural & Conversational (Default)', description: 'Fluid, natural speech that follows script text and emotional markers organically' },
  { id: 'conversational', name: '💬 Friendly & Casual', description: 'Warm, approachable, easy-going everyday delivery' },
  { id: 'educational', name: '🎓 Educational & Clear', description: 'Articulate, steady, and easy to follow' },
  { id: 'high_energy', name: '⚡ High-Energy & Punchy', description: 'Dynamic, excited, fast-paced and upbeat' },
  { id: 'calm_warm', name: '🧘 Calm & Reassuring', description: 'Gentle, peaceful, soothing delivery' },
  { id: 'dramatic', name: '🎬 Dramatic Suspense', description: 'Intense, suspenseful, deliberate cadence' },
  { id: 'inspirational', name: '✨ Inspirational & Uplifting', description: 'Charismatic, motivational tone' },
  { id: 'custom', name: '✏️ Custom Prompt Guidelines', description: 'Custom emotion tags and vocal directives' }
];

const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({ images, activeProjectId, projects = [], onBackToDashboard }) => {
  // Mode Controller: dashboard (for managing projects) vs editor (recording studio)
  const [studioMode, setStudioMode] = useState<'dashboard' | 'editor'>('dashboard');

  // 1. Projects State (Supports Campaigns + Standalone local voiceover projects)
  const [standaloneProjects, setStandaloneProjects] = useState<StandaloneProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('global');

  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // 2. Sessions / Tracks Library State (persisted via IndexedDB)
  const [sessions, setSessions] = useState<VoiceoverSession[]>([]);
  const [isVoiceoverDataLoaded, setIsVoiceoverDataLoaded] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [trackNameInput, setTrackNameInput] = useState('Voiceover Track #1');

  // Load standalone projects & voiceover sessions from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    const loadFromIndexedDB = async () => {
      try {
        const loadedProjects = await DBService.getItem<StandaloneProject[]>('social_studio_standalone_audio_projects', []);
        const loadedSessions = await DBService.getItem<VoiceoverSession[]>('social_studio_voiceover_sessions', []);
        if (isMounted) {
          setStandaloneProjects(loadedProjects || []);
          setSessions(loadedSessions || []);
          setIsVoiceoverDataLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load voiceover data from IndexedDB:", err);
        if (isMounted) setIsVoiceoverDataLoaded(true);
      }
    };
    loadFromIndexedDB();
    return () => { isMounted = false; };
  }, []);

  // 3. Active Session Configuration State
  const [scriptText, setScriptText] = useState("In today's fast-paced world, automation is your unfair advantage. Connect with your audience and accelerate growth instantly.");
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'>('Puck');
  const [selectedStyleId, setSelectedStyleId] = useState('natural');
  const [selectedPersonaStyle, setSelectedPersonaStyle] = useState('adult');
  const [selectedAccent, setSelectedAccent] = useState('US Standard');
  const [selectedSpeed, setSelectedSpeed] = useState('1.0');
  const [customStyleText, setCustomStyleText] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-tts-preview');

  // 4. Vision Assistant Image Selection & Prompt Sync
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  // 5. Audio Cache & Playback
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [activeAudioKey, setActiveAudioKey] = useState<string>('unsaved');

  // 6. Native Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 7. Loading & Modal Preview State
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 8. Mobile responsive tab state
  const [activeTab, setActiveTab] = useState<'script' | 'vision'>('script');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Keep standalone projects in sync to IndexedDB
  useEffect(() => {
    if (isVoiceoverDataLoaded) {
      DBService.setItem('social_studio_standalone_audio_projects', standaloneProjects).catch(err => {
        console.error("Failed to save standalone projects to IndexedDB:", err);
      });
    }
  }, [standaloneProjects, isVoiceoverDataLoaded]);

  // Keep sessions in sync to IndexedDB
  useEffect(() => {
    if (isVoiceoverDataLoaded) {
      DBService.setItem('social_studio_voiceover_sessions', sessions).catch(err => {
        console.error("Failed to save voiceover sessions to IndexedDB:", err);
      });
    }
  }, [sessions, isVoiceoverDataLoaded]);

  // Handle selected project changes from parent to bypass dashboard directly to scoped workspace
  useEffect(() => {
    if (activeProjectId) {
      setCurrentProjectId(activeProjectId);
      setStudioMode('editor');
    }
  }, [activeProjectId]);

  // Pre-load all saved track audio URLs from IndexedDB into memory cache on mount
  useEffect(() => {
    const loadAllSavedAudios = async () => {
      const loadedCache: Record<string, string> = {};
      for (const s of sessions) {
        try {
          const url = await loadAudioFromIndexedDB(s.id);
          if (url) {
            loadedCache[s.id] = url;
          }
        } catch (e) {
          console.error("Error pre-loading saved audio for", s.name, e);
        }
      }
      setAudioCache(prev => ({ ...prev, ...loadedCache }));
    };
    if (sessions.length > 0) {
      loadAllSavedAudios();
    }
  }, [sessions]);

  // Resolve current active project details
  const activeCampaignProject = projects.find(p => p.id === currentProjectId);
  const activeStandaloneProject = standaloneProjects.find(p => p.id === currentProjectId);
  const activeProjectName = activeCampaignProject?.name || activeStandaloneProject?.name || 'Standalone Workspace';

  const campaignContextStr = activeCampaignProject 
    ? `Campaign/Project Name: "${activeCampaignProject.name}"${activeCampaignProject.description ? `. Campaign Description: "${activeCampaignProject.description}"` : ''}`
    : activeStandaloneProject
      ? `Project Name: "${activeStandaloneProject.name}". Description: "${activeStandaloneProject.description}"`
      : undefined;

  // Filter images by the active project
  const projectImages = images.filter(img => {
    if (currentProjectId === 'global') return true;
    return (img.subOptions?.projectId || 'proj-1') === currentProjectId;
  });

  // Create a brand new audio project
  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: StandaloneProject = {
      id: `audio-proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: 'Custom standalone voiceover and script collaboration space.',
      createdAt: Date.now()
    };
    setStandaloneProjects(prev => [newProj, ...prev]);
    setCurrentProjectId(newProj.id);
    setStudioMode('editor');
    handleCreateNewSession();
    setNewProjectName('');
    setShowNewProjectModal(false);
  };

  const handleDeleteStandaloneProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeConfirm("Are you sure you want to delete this custom project? All matching audio sessions will be lost.")) {
      setStandaloneProjects(prev => prev.filter(p => p.id !== id));
      setSessions(prev => prev.filter(s => s.projectId !== id));
      if (currentProjectId === id) {
        setCurrentProjectId('global');
      }
    }
  };

  // Load selected session into editing states
  const handleLoadSession = (session: VoiceoverSession) => {
    setActiveSessionId(session.id);
    setTrackNameInput(session.name);
    setScriptText(session.scriptText);
    setSelectedVoice(session.voiceName);
    setSelectedStyleId(session.deliveryStyleId);
    setCustomStyleText(session.customDeliveryStyle || '');
    setSelectedModel(session.ttsModel || 'gemini-3.1-flash-tts-preview');
    setError(null);

    if (session.selectedImageId) {
      const img = images.find(i => i.id === session.selectedImageId);
      if (img) {
        setSelectedImage(img);
        setCustomImageBase64(null);
      } else {
        setSelectedImage(null);
      }
    } else if (session.customImageBase64) {
      setCustomImageBase64(session.customImageBase64);
      setSelectedImage(null);
    } else {
      setSelectedImage(null);
      setCustomImageBase64(null);
    }

    setActiveAudioKey(session.id);
    setIsPlaying(false);
  };

  // Create a brand new fresh voiceover session/track
  const handleCreateNewSession = () => {
    setActiveSessionId(null);
    const currentProjectTracks = sessions.filter(s => s.projectId === currentProjectId);
    setTrackNameInput(`Voiceover Track #${currentProjectTracks.length + 1}`);
    setScriptText("Unlock the power of conversational audio narration. Guide your audience with high-fidelity vocal delivery built dynamically.");
    setSelectedVoice('Kore');
    setSelectedStyleId('charismatic');
    setCustomStyleText('');
    setSelectedImage(null);
    setCustomImageBase64(null);
    setError(null);
    setActiveAudioKey('unsaved');
    setIsPlaying(false);
  };

  // Save active session in the library database (called on synthesis)
  const handleSaveSession = (overrideName?: string, silent = false) => {
    const finalTrackName = overrideName || trackNameInput || `Voiceover Track #${sessions.length + 1}`;
    const currentProjectValue = currentProjectId;
    let savedId = activeSessionId;

    if (activeSessionId) {
      // Update existing session
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            name: finalTrackName,
            scriptText: scriptText,
            voiceName: selectedVoice,
            deliveryStyleId: selectedStyleId,
            customDeliveryStyle: customStyleText,
            selectedImageId: selectedImage?.id || null,
            customImageBase64: customImageBase64 || null,
            ttsModel: selectedModel
          };
        }
        return s;
      }));
    } else {
      // Insert new session
      const newId = `vo-session-${Date.now()}`;
      savedId = newId;
      const newSession: VoiceoverSession = {
        id: newId,
        projectId: currentProjectValue,
        name: finalTrackName,
        scriptText: scriptText,
        voiceName: selectedVoice,
        deliveryStyleId: selectedStyleId,
        customDeliveryStyle: customStyleText,
        createdAt: Date.now(),
        selectedImageId: selectedImage?.id || null,
        customImageBase64: customImageBase64 || null,
        ttsModel: selectedModel
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);

      // Move audio URL cache if we synthesized before saving
      if (audioCache['unsaved']) {
        setAudioCache(prev => {
          const updated = { ...prev };
          updated[newId] = prev['unsaved'];
          delete updated['unsaved'];
          return updated;
        });
        setActiveAudioKey(newId);
      }
    }
    return savedId;
  };

  // Delete session from database & IndexedDB
  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (safeConfirm('Are you sure you want to delete this voiceover track?')) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      await deleteAudioFromIndexedDB(sessionId);
      if (activeSessionId === sessionId) {
        handleCreateNewSession();
      }
      setAudioCache(prev => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });
      setShowPreviewModal(false);
    }
  };

  // Local image file manual selection & Drag-and-Drop upload
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG or JPEG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setCustomImageBase64(e.target.result);
        setSelectedImage(null); // Clear selected gallery image
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerManualSelect = () => {
    fileInputRef.current?.click();
  };

  // Sync / Extract Image Prompt to Script
  const handleExtractImagePrompt = () => {
    if (!selectedImage) {
      setError("Please select an image from the gallery first to extract its prompt.");
      return;
    }
    setScriptText(selectedImage.prompt);
    setError(null);
  };

  // Analyze Image with Gemini Vision using prompt and campaign contexts
  const handleAnalyzeImage = async () => {
    const activeImageSrc = customImageBase64 || selectedImage?.data;
    const originalPromptStr = selectedImage?.prompt || "Campaign-targeted custom creative";
    const physicalDescriptionStr = selectedImage?.imagePrompt || "marketing concept illustration";

    if (!activeImageSrc) {
      setError('Please select an image from your project gallery or upload a custom image file first.');
      return;
    }

    setIsAnalyzingImage(true);
    setError(null);
    setLoadingStep('Analyzing creative asset with Gemini Vision...');

    try {
      const styleDesc = DELIVERY_STYLES.find(s => s.id === selectedStyleId)?.description || 'charismatic';
      
      const script = await generateImageToScript(
        activeImageSrc,
        physicalDescriptionStr,
        originalPromptStr,
        campaignContextStr,
        styleDesc
      );
      
      setScriptText(script);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Could not analyze the image to write a script. Please write a manual script or try again.');
    } finally {
      setIsAnalyzingImage(false);
      setLoadingStep('');
    }
  };

  // Synthesize audio voiceover speech
  const handleSynthesizeSpeech = async () => {
    if (!scriptText.trim()) {
      setError('Please enter some text in the script draft editor.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    try {
      setLoadingStep('Connecting to Gemini Multimodal Audio Synthesizer...');
      const styleDesc = selectedStyleId === 'custom' 
        ? customStyleText 
        : DELIVERY_STYLES.find(s => s.id === selectedStyleId)?.description;

      const resultAudioUrl = await generateVoiceOverSpeech(
        scriptText, 
        selectedVoice, 
        styleDesc,
        selectedModel,
        selectedPersonaStyle,
        selectedAccent,
        selectedSpeed
      );

      // Auto-generate track name if empty or generic placeholder
      let finalTrackName = trackNameInput.trim();
      if (!finalTrackName || finalTrackName.startsWith('Voiceover Track #')) {
        finalTrackName = autoGenerateTrackName(scriptText, selectedVoice);
        setTrackNameInput(finalTrackName);
      }

      // Auto-save session immediately upon successful synthesis
      const savedSessionId = handleSaveSession(finalTrackName, true);

      // Persist generated audio binary inside self-contained IndexedDB so it survives refreshes!
      await saveAudioToIndexedDB(savedSessionId, resultAudioUrl);

      setAudioCache(prev => ({
        ...prev,
        [savedSessionId]: resultAudioUrl
      }));
      setActiveAudioKey(savedSessionId);
      
      // Open the floating player automatically
      setShowPreviewModal(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to synthesize text-to-speech voice. Please ensure you have configured a valid billing/API key setup.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Native DOM audio playback triggers
  const currentAudioUrl = audioCache[activeAudioKey] || null;

  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      try {
        audioElRef.current.load();
      } catch (err) {
        console.error("Error reloading audio element:", err);
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentAudioUrl]);

  const togglePlayback = () => {
    if (!audioElRef.current) return;
    if (isPlaying) {
      audioElRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElRef.current.play().catch(err => {
        console.error("Playback error", err);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioElRef.current) {
      setCurrentTime(audioElRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioElRef.current) {
      setDuration(audioElRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioElRef.current) {
      audioElRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filter list by selected project id
  const currentProjectSessions = sessions.filter(s => s.projectId === currentProjectId);

  const activeSrc = customImageBase64 || selectedImage?.data;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative z-10 animate-in fade-in duration-300 text-left px-3 md:px-6">
      
      {/* Native Hidden HTML5 Audio Component */}
      {currentAudioUrl && (
        <audio
          ref={audioElRef}
          src={currentAudioUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          className="hidden"
          preload="auto"
        />
      )}

      {/* ==================== VIEW 1: AUDIO DASHBOARD & BOARD ==================== */}
      {studioMode === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header dashboard layout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-col gap-2">
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit border border-slate-200 dark:border-slate-700 shadow-sm mb-1"
                >
                  <ChevronLeft className="w-4 h-4 text-cyan-500" />
                  <span>Back to Projects Space</span>
                </button>
              )}
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-6 h-6 text-cyan-500 animate-pulse" />
                <span>Vocal Synthesizer Studio</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                Synthesize high-fidelity brand recordings, commercials, and visual narrative scripts. Scope audio tracks seamlessly to campaigns or standalone spaces.
              </p>
            </div>
            
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md self-start md:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Standalone Project</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Managed Workspaces</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                  {1 + projects.length + standaloneProjects.length} <span className="text-xs font-normal text-slate-400">Total</span>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Synthesized Tracks</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                  {sessions.length} <span className="text-xs font-normal text-slate-400">Saved audio files</span>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Voice Actors Available</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                  {MALE_VOICES.length + FEMALE_VOICES.length} <span className="text-xs font-normal text-slate-400">High-Fidelity Profiles</span>
                </span>
              </div>
            </div>
          </div>

          {/* Workspaces and Campaigns Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Available Studio Project Workspaces
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Global Standalone Workspace */}
              <div 
                onClick={() => {
                  setCurrentProjectId('global');
                  setStudioMode('editor');
                  handleCreateNewSession();
                }}
                className="bg-white dark:bg-slate-900 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 border border-slate-250 dark:border-slate-850 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-[210px] group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Standalone Scope
                    </span>
                    <FolderOpen className="w-4 h-4 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-base text-slate-800 dark:text-white mt-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Standalone recording Space
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                    A universal scratchpad to type quick scripts, try voice models and download stand-alone audio tracks.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-850 pt-3">
                  <span className="text-[10px] font-semibold text-slate-400 font-mono">
                    {sessions.filter(s => s.projectId === 'global').length} recorded tracks
                  </span>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <span>Record Audio</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Card List: Mirrored Campaigns from Social Studio */}
              {projects.map((p) => {
                const campaignImages = images.filter(img => (img.subOptions?.projectId || 'proj-1') === p.id);
                const campaignTracks = sessions.filter(s => s.projectId === p.id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setStudioMode('editor');
                      handleCreateNewSession();
                    }}
                    className="bg-white dark:bg-slate-900 hover:border-purple-500/40 dark:hover:border-purple-500/40 border border-slate-250 dark:border-slate-850 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-[210px] group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/40 border border-purple-200/20 rounded text-[9px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                          Campaign Sync
                        </span>
                        <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-base text-slate-800 dark:text-white mt-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                        {p.description || 'Campaign visual and copy parameters synced automatically.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Image Strip showing mirrored generated campaign graphics! */}
                      {campaignImages.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {campaignImages.slice(0, 4).map((img, idx) => (
                            <div key={img.id} className="w-6 h-6 rounded border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 bg-slate-100">
                              <img src={img.data || undefined} alt="Campaign slide thumbnail" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {campaignImages.length > 4 && (
                            <span className="text-[8px] font-bold text-slate-400 font-mono">+{campaignImages.length - 4}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-850 pt-2">
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {campaignTracks.length} tracks • {campaignImages.length} campaign images
                        </span>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <span>Enter Studio</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Card List: Custom standalone Local projects */}
              {standaloneProjects.map((p) => {
                const tracks = sessions.filter(s => s.projectId === p.id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setStudioMode('editor');
                      handleCreateNewSession();
                    }}
                    className="bg-white dark:bg-slate-900 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 border border-slate-250 dark:border-slate-850 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-[210px] group relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-200/20 rounded text-[9px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                          Custom space
                        </span>
                        <button
                          onClick={(e) => handleDeleteStandaloneProject(p.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete custom workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-base text-slate-800 dark:text-white mt-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-850 pt-3">
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {tracks.length} tracks recorded
                      </span>
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                        <span>Enter Studio</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: ACTIVE STUDIO EDITOR ==================== */}
      {studioMode === 'editor' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header row with navigation & project stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStudioMode('dashboard')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer border border-slate-200 dark:border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Projects</span>
              </button>
              <div>
                <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-mono block">
                  Recording Workspace
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{activeProjectName}</span>
                  <span className="text-xs font-normal text-slate-400">({currentProjectSessions.length} recorded tracks)</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNewSession}
                className="px-3.5 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Track</span>
              </button>
            </div>
          </div>

          {/* TABLET / MOBILE TAB SELECTOR PANEL (lg:hidden) */}
          <div className="flex lg:hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'script' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Script Composer</span>
            </button>
            <button
              onClick={() => setActiveTab('vision')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'vision' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>Vision Assistant ({projectImages.length})</span>
            </button>
          </div>

          {/* Main Grid Wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:h-[calc(100vh-9.5rem)] lg:max-h-[calc(100vh-9.5rem)]">
            
            {/* PANEL 1: Left Side Pane: Tracks Library (Col-span 3 on LG+) */}
            <div className="lg:col-span-3 lg:h-full lg:max-h-full flex flex-col space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:h-full overflow-hidden">
                
                <div className="flex items-center justify-between pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <ListMusic className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span>Scoped Track Library</span>
                  </h3>
                </div>

                {/* Group 1: Current Project Tracks */}
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 pt-3 space-y-2 min-h-0">
                  {currentProjectSessions.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                      <Radio className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-[11px] text-slate-400 italic">No synthesized tracks stored for this scope yet.</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Write a script and trigger synthesis below.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {currentProjectSessions.map(s => {
                        const isSelected = s.id === activeSessionId;
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleLoadSession(s)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 group ${
                              isSelected 
                                ? 'bg-cyan-500/10 border-cyan-500/35 ring-1 ring-cyan-500/10' 
                                : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-800 dark:text-white block truncate leading-tight">
                                {s.name}
                              </span>
                              <span className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                                <span className="font-semibold text-cyan-600 dark:text-cyan-400">{s.voiceName}</span>
                                <span>•</span>
                                <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                              {/* Quick Play button inside tracks listing */}
                              {audioCache[s.id] && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoadSession(s);
                                    setTimeout(() => togglePlayback(), 50);
                                  }}
                                  className="p-1 text-slate-400 hover:text-cyan-500 rounded transition-colors"
                                  title="Play Track"
                                >
                                  {isPlaying && activeSessionId === s.id ? (
                                    <Pause className="w-3.5 h-3.5 text-cyan-500" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDeleteSession(s.id, e)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0 cursor-pointer"
                                title="Delete track"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* PANEL 2: Center Workspace: Script, Voice & Tone (Col-span 5 on LG+) */}
            <div className={`${activeTab === 'script' ? 'block' : 'hidden lg:block'} lg:col-span-5 lg:h-full lg:max-h-full flex flex-col space-y-4`}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:h-full overflow-hidden">
                
                <div className="pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
                    <Mic className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span>Script & Vocal Director</span>
                  </h3>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1.5 py-3 space-y-4 min-h-0">

                  {/* Model & Track Label 2-Col Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Model Selection Control Panel */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        <Cpu className="w-3 h-3 text-cyan-500" />
                        <span>Voice Model</span>
                      </div>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {TTS_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 leading-tight font-mono line-clamp-1">
                        {TTS_MODELS.find(m => m.id === selectedModel)?.description}
                      </p>
                    </div>

                    {/* Track Name Custom Setting */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Recording Track Label
                      </label>
                      <input
                        type="text"
                        value={trackNameInput}
                        onChange={(e) => setTrackNameInput(e.target.value)}
                        placeholder="e.g. Flight Launch Ad Script"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Script input area */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Narrative Script Draft
                      </label>
                      <span className="text-[9px] font-medium text-slate-450 font-mono">
                        {scriptText.length} chars
                      </span>
                    </div>
                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="Type or paste your spoken word-for-word voiceover script here..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl text-xs leading-relaxed focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  {/* 2x2 VOCAL DIRECTION CONTROLS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-850 rounded-xl">
                    
                    {/* Character Persona & Maturity Selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest block font-mono">
                        Character Persona
                      </label>
                      <select
                        value={selectedPersonaStyle}
                        onChange={(e) => setSelectedPersonaStyle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-cyan-500/30 text-slate-950 dark:text-cyan-200 rounded-lg text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {PERSONA_STYLES.map((persona) => (
                          <option key={persona.id} value={persona.id}>
                            {persona.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vocal Expression / Emotional Cadence */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Emotional Tone
                      </label>
                      <select
                        value={selectedStyleId}
                        onChange={(e) => setSelectedStyleId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {DELIVERY_STYLES.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Accent & Regional Dialect Selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Accent & Dialect
                      </label>
                      <select
                        value={selectedAccent}
                        onChange={(e) => setSelectedAccent(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {ACCENT_OPTIONS.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Talking Speed Control Selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block font-mono">
                        Talking Speed & Pace
                      </label>
                      <select
                        value={selectedSpeed}
                        onChange={(e) => setSelectedSpeed(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-emerald-500/30 text-slate-950 dark:text-emerald-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {SPEAKING_SPEEDS.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Custom delivery instructions textbox */}
                  {selectedStyleId === 'custom' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Custom Vocal Directions
                      </label>
                      <input
                        type="text"
                        value={customStyleText}
                        onChange={(e) => setCustomStyleText(e.target.value)}
                        placeholder="e.g. Whisper slowly, intense suspense, high emotional anticipation"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl text-xs focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                  )}

                  {/* TWO-COLUMN VOICE SELECTOR: MALE & FEMALE ACTORS */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Voice Talent Profiles
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Column 1: Male Voices */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono block border-b border-slate-100 dark:border-white/5 pb-1">
                          Male Voices
                        </span>
                        <div className="space-y-1">
                          {MALE_VOICES.map((actor) => (
                            <button
                              key={actor.id}
                              type="button"
                              onClick={() => setSelectedVoice(actor.id)}
                              className={`w-full px-2.5 py-1.5 text-left rounded-lg border text-xs transition-all flex flex-col cursor-pointer ${
                                selectedVoice === actor.id 
                                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/35 ring-1 ring-cyan-500/10' 
                                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border-slate-200/60 dark:border-slate-800/80'
                              }`}
                            >
                              <span className="font-extrabold text-[11px]">{actor.name}</span>
                              <span className="text-[8px] text-slate-400 truncate mt-0.5 leading-snug">{actor.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Female Voices */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono block border-b border-slate-100 dark:border-white/5 pb-1">
                          Female Voices
                        </span>
                        <div className="space-y-1">
                          {FEMALE_VOICES.map((actor) => (
                            <button
                              key={actor.id}
                              type="button"
                              onClick={() => setSelectedVoice(actor.id)}
                              className={`w-full px-2.5 py-1.5 text-left rounded-lg border text-xs transition-all flex flex-col cursor-pointer ${
                                selectedVoice === actor.id 
                                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/35 ring-1 ring-cyan-500/10' 
                                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border-slate-200/60 dark:border-slate-800/80'
                              }`}
                            >
                              <span className="font-extrabold text-[11px]">{actor.name}</span>
                              <span className="text-[8px] text-slate-400 truncate mt-0.5 leading-snug">{actor.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Synthesis Trigger Button Fixed at Bottom of Panel */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
                  <button
                    type="button"
                    disabled={isLoading || !scriptText.trim()}
                    onClick={handleSynthesizeSpeech}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{loadingStep || 'Generating Audio waveform...'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Synthesize & Save Track</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* PANEL 3: Vision Composer Panel (Col-span 4 on LG+, visible when `activeTab === 'vision'` or on desktop) */}
            <div className={`${activeTab === 'vision' ? 'block' : 'hidden lg:block'} lg:col-span-4 lg:h-full lg:max-h-full flex flex-col space-y-4`}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:h-full overflow-hidden">
                
                <div className="pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-cyan-500" />
                    <span>Multimodal Vision Scripting</span>
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1.5 py-3 space-y-4 min-h-0">
                  
                  {/* Selected Image Active Hub */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Engaged Visual Reference
                    </div>
                    
                    {activeSrc ? (
                      <div className="space-y-2.5">
                        <div className="flex gap-3 items-start bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="w-16 h-16 rounded overflow-hidden border border-slate-250 dark:border-slate-800 shrink-0 shadow-sm relative">
                            <img src={activeSrc || undefined} alt="Engaged brand resource" className="w-full h-full object-cover" />
                            <div className="absolute top-0 right-0 p-0.5 bg-emerald-500 text-white rounded-bl">
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-mono">
                              ✨ Engaged
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-snug line-clamp-2">
                              {selectedImage ? selectedImage.prompt : 'Custom uploaded asset'}
                            </p>
                          </div>
                        </div>

                        {/* Prominent Insert and Analyze actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleExtractImagePrompt}
                            disabled={!selectedImage}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                            title="Extract generation prompt text as script template"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Use Prompt</span>
                          </button>

                          <button
                            type="button"
                            disabled={isAnalyzingImage}
                            onClick={handleAnalyzeImage}
                            className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all disabled:opacity-45 cursor-pointer"
                          >
                            {isAnalyzingImage ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            )}
                            <span>Analyze Image</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 italic text-[11px] bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                        No active image engaged. Select a campaign graphic or upload a custom image to direct script writing.
                      </div>
                    )}
                  </div>

                  {/* Direct Custom File Drag-and-Drop */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerManualSelect}
                    className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDragOver 
                        ? 'border-cyan-500 bg-cyan-50/10 dark:bg-cyan-500/10' 
                        : customImageBase64 
                          ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : 'border-slate-250 dark:border-slate-800 hover:border-cyan-500/40 bg-slate-50/50 dark:bg-slate-950/20'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <UploadCloud className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Drag or select custom image
                    </span>
                  </div>

                  {/* Gallery Picker (Automatically fetching campaign generated images) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        Images in {activeProjectName}
                      </span>
                      {(selectedImage || customImageBase64) && (
                        <button 
                          onClick={() => {
                            setSelectedImage(null);
                            setCustomImageBase64(null);
                            setError(null);
                          }}
                          className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Clear Active
                        </button>
                      )}
                    </div>

                    {projectImages.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-850 rounded-xl text-center">
                        No matching project images. Run a generation on the canvas first to populate this campaign.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                        {projectImages.map((img) => {
                          const isPicked = selectedImage?.id === img.id;
                          return (
                            <div
                              key={img.id}
                              onClick={() => {
                                setSelectedImage(img);
                                setCustomImageBase64(null);
                                setError(null);
                              }}
                              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                                isPicked 
                                  ? 'border-cyan-500 scale-[0.98]' 
                                  : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <img src={img.data || undefined} alt={img.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {isPicked && (
                                <div className="absolute inset-0 bg-cyan-950/40 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* Persistent Inline playback widget */}
          {currentAudioUrl && !showPreviewModal && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in duration-300 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-all shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Playback Monitor Active
                  </div>
                  <div className="text-xs text-white truncate font-medium">
                    {trackNameInput}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 font-bold uppercase rounded-lg border border-slate-750 cursor-pointer"
                >
                  Show Player
                </button>
                <a
                  href={currentAudioUrl}
                  download={`${trackNameInput.toLowerCase().replace(/\s+/g, '-') || 'voiceover'}.wav`}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-750 cursor-pointer"
                  title="Download WAV"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Error logging panel */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs font-semibold text-left">{error}</p>
            </div>
          )}

        </div>
      )}

      {/* ==================== 3. FLOATING AUDIO PLAYER OVERLAY ==================== */}
      {showPreviewModal && currentAudioUrl && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 max-w-lg w-full max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
            
            <button 
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer z-20"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="space-y-1 pr-6">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono block animate-pulse">
                ✓ Voiceover Successfully Compiled
              </span>
              <h4 className="text-base font-bold truncate leading-tight">
                {trackNameInput}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium font-mono">
                Voice actor: <span className="text-cyan-400 font-bold">{selectedVoice}</span> | Model: <span className="text-slate-300 font-semibold">{selectedModel.split('-')[1] || selectedModel}</span>
              </p>
            </div>

            {/* Script preview */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-left max-h-[100px] overflow-y-auto">
              <p className="text-[10px] text-slate-400 leading-normal italic">
                "{scriptText}"
              </p>
            </div>

            {/* Sound Wave Animation Visualizer */}
            <div className="h-16 bg-slate-950 rounded-2xl flex items-center justify-center gap-1.5 px-6 border border-slate-850 relative overflow-hidden">
              {isPlaying ? (
                <div className="flex items-end justify-center gap-1.5 h-10 w-full">
                  {[4, 8, 5, 9, 3, 7, 6, 8, 4, 9, 3, 7, 5, 9, 4, 8, 6, 3, 7, 5, 9, 5, 7, 4, 8].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-full" 
                      style={{ 
                        height: `${h * 10}%`, 
                        animation: `pulse 0.6s infinite alternate`,
                        animationDelay: `${i * 30}ms`
                      }}
                    ></span>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest z-10 select-none flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-slate-600 animate-pulse" />
                  <span>Playback Monitor Standby</span>
                </div>
              )}
            </div>

            {/* Scrubbing Audio Timeline */}
            <div className="space-y-1.5">
              <input 
                type="range"
                min="0"
                max={duration || 100}
                step="0.05"
                value={currentTime}
                onChange={handleScrubChange}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Timed SRT Subtitles & Interactive Timestamped Transcript Viewer */}
            <AudioSubtitleViewer
              scriptText={scriptText}
              audioUrl={currentAudioUrl}
              durationSec={duration}
              currentTimeSec={currentTime}
              onSeekAudio={(timeSec) => {
                if (audioElRef.current) {
                  audioElRef.current.currentTime = timeSec;
                  setCurrentTime(timeSec);
                }
              }}
              title={trackNameInput || "Voiceover Timed Subtitles"}
              initiallyExpanded={true}
            />

            {/* Controller commands */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="p-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-all hover:scale-105 active:scale-95 shadow cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    Playback
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {isPlaying ? 'Streaming Audio' : 'Paused'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteSession(activeSessionId || '')}
                  className="p-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-750 rounded-xl transition-all cursor-pointer"
                  title="Discard Draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <a
                  href={currentAudioUrl}
                  download={`${trackNameInput.toLowerCase().replace(/\s+/g, '-') || 'voiceover'}.wav`}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold uppercase rounded-xl flex items-center gap-2 transition-all border border-slate-750 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download WAV</span>
                </a>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ==================== 4. CREATE STANDALONE PROJECT MODAL ==================== */}
      {showNewProjectModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">
              Create Standalone Audio Project
            </h4>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Flight Launch Ad Session"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 text-slate-900 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newProjectName.trim()}
                onClick={handleCreateNewProject}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-40 cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default VoiceoverStudio;
