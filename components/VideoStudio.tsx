import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, Project } from '@/types';
import { DBService } from '@/services/dbService';
import { 
  Film, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon,
  Trash2, 
  Plus, 
  X, 
  ChevronLeft, 
  Upload, 
  Clock, 
  Sliders, 
  Check, 
  AlertCircle, 
  Eye,
  Video
} from 'lucide-react';
import { generateVeoVideo } from '@/services/geminiService';
import { getAi } from '@/services/ai/config';

interface VideoStudioProps {
  images: GeneratedImage[];
  activeProjectId?: string | null;
  projects?: Project[];
  onBackToDashboard?: () => void;
  initialPrompt?: string;
  onSelectProject?: (id: string | null) => void;
}

interface GeneratedVideo {
  id: string;
  projectId: string;
  videoUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  model: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  timestamp: number;
  referenceImageUrl?: string | null;
  isSimulated?: boolean;
}

const SIMULATED_VIDEOS = [
  {
    keywords: ['laser', 'glow', 'abstract', 'neon', 'light', 'future', 'sci-fi', 'cyber'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4',
    title: 'Abstract Laser Flow'
  },
  {
    keywords: ['code', 'tech', 'computer', 'laptop', 'developer', 'programming', 'software', 'screen', 'digital'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-web-development-programming-on-a-laptop-42171-large.mp4',
    title: 'Tech Workspace Macro'
  },
  {
    keywords: ['snow', 'forest', 'nature', 'tree', 'aerial', 'drone', 'winter', 'landscape', 'mountain', 'cloud'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-thick-snow-covered-forest-41527-large.mp4',
    title: 'Aerial Snowy Forest'
  },
  {
    keywords: ['circuit', 'motherboard', 'glow', 'cpu', 'chip', 'technology', 'system', 'cyberpunk'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-motherboard-and-glowing-circuits-40899-large.mp4',
    title: 'Micro Circuit Paths'
  },
  {
    keywords: ['tunnel', 'portal', 'infinite', 'loop', 'speed', 'fast', 'lights', 'motion', 'time'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-light-looping-background-41852-large.mp4',
    title: 'Neon Loop Drift'
  }
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  images,
  activeProjectId,
  projects,
  onBackToDashboard,
  initialPrompt,
  onSelectProject
}) => {
  // Input states
  const [prompt, setPrompt] = useState(initialPrompt || '');

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [selectedModel, setSelectedModel] = useState('veo-3.1-lite-generate-preview');
  
  // Reference Image sources
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GeneratedImage | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string | null>(null);

  // Drag and drop / UI states
  const [isDragging, setIsDragging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerationError, setLastGenerationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active playing video & vault
  const [activePreviewVideo, setActivePreviewVideo] = useState<GeneratedVideo | null>(null);
  const [savedVideos, setSavedVideos] = useState<GeneratedVideo[]>([]);
  const [isVideoVaultLoaded, setIsVideoVaultLoaded] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeProject = projects?.find(p => p.id === activeProjectId);
  const currentProjectImages = images.filter(img => !activeProjectId || img.id.startsWith(activeProjectId) || activeProjectId === 'global');

  // Load saved videos from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    const loadFromIndexedDB = async () => {
      try {
        const stored = await DBService.getItem<GeneratedVideo[]>('social_studio_x_generated_videos_v1', []);
        if (isMounted) {
          setSavedVideos(stored || []);
          setIsVideoVaultLoaded(true);
        }
      } catch (e) {
        console.error("Failed to load videos from IndexedDB:", e);
        if (isMounted) setIsVideoVaultLoaded(true);
      }
    };
    loadFromIndexedDB();
    return () => { isMounted = false; };
  }, []);

  // Sync to IndexedDB on change
  const saveVideosToStorage = (updatedList: GeneratedVideo[]) => {
    setSavedVideos(updatedList);
    DBService.setItem('social_studio_x_generated_videos_v1', updatedList).catch(err => {
      console.error("Failed to save videos to IndexedDB:", err);
    });
  };

  // Enhance prompt with Gemini model
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError("Please write a simple description first so AI can expand it.");
      return;
    }
    setError(null);
    setIsEnhancing(true);
    try {
      const ai = getAi();
      const res = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are an elite cinematic AI prompt engineer. Take the following simple video prompt concept: "${prompt}". Transform it into an exceptionally descriptive, highly cinematic direction prompt for a video generator like Veo. Focus on camera motion (panning, tracking shot, slow dolly), realistic physics, dynamic lighting (moody shadows, volumetric rays, high-contrast glow), rich details (ambient dust, glowing embers, high texture fidelity), and aspect ratio context. Keep it highly descriptive but concise. Return ONLY the enhanced prompt. No introduction, no markdown. Keep it under 150 words.`
      });
      if (res && res.text) {
        setPrompt(res.text.trim());
        setSuccessMessage("Prompt enhanced with cinematic keywords!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (e) {
      console.error("Enhance failed", e);
      setError("Failed to enhance prompt. Check your connection or API key.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Convert File to Base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (PNG, JPEG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomImageBase64(e.target?.result as string);
      setCustomImageName(file.name);
      setSelectedGalleryImage(null); // Deselect gallery if manual uploaded
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Pick simulation loop based on prompt analysis
  const getSimulatedVideoUrl = (promptText: string) => {
    const lower = promptText.toLowerCase();
    for (const item of SIMULATED_VIDEOS) {
      if (item.keywords.some(k => lower.includes(k))) {
        return { url: item.url, title: item.title };
      }
    }
    // Default fallback
    const idx = Math.floor(Math.random() * SIMULATED_VIDEOS.length);
    return { url: SIMULATED_VIDEOS[idx].url, title: SIMULATED_VIDEOS[idx].title };
  };

  // Video Generation trigger
  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setError("Please enter a video description prompt.");
      return;
    }

    setError(null);
    setLastGenerationError(null);
    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationStep("Initializing video model pipeline...");

    // Setup visual reference source if available
    let refImageBase64: string | undefined = undefined;
    let refImageUrlForVault: string | null = null;

    if (customImageBase64) {
      refImageBase64 = customImageBase64;
      refImageUrlForVault = customImageBase64;
    } else if (selectedGalleryImage) {
      refImageBase64 = selectedGalleryImage.data;
      refImageUrlForVault = selectedGalleryImage.data;
    }

    // Step-by-step progress simulation for immersive user engagement
    const steps = [
      { prg: 20, msg: "Analyzing reference frames and optical boundaries..." },
      { prg: 40, msg: "Synthesizing dynamic motion paths..." },
      { prg: 65, msg: "Rendering volumetric lighting and shadow gradients..." },
      { prg: 85, msg: "Injecting temporal textures and hyperrealistic particles..." },
      { prg: 95, msg: "Assembling H.264 high-definition video wrapper..." }
    ];

    let currentStepIdx = 0;
    const progressTimer = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setGenerationProgress(steps[currentStepIdx].prg);
        setGenerationStep(steps[currentStepIdx].msg);
        currentStepIdx++;
      }
    }, 1500);

    try {
      // Execute live generation
      const result = await generateVeoVideo(prompt, refImageBase64, aspectRatio, selectedModel);
      
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStep("Cinematic rendering completed!");

      // Store generated video
      const newVideo: GeneratedVideo = {
        id: `vid-${Date.now()}`,
        projectId: activeProjectId || 'global',
        videoUrl: result.videoUrl || result.url || "",
        prompt: prompt,
        model: selectedModel,
        aspectRatio: aspectRatio,
        timestamp: Date.now(),
        referenceImageUrl: refImageUrlForVault,
        isSimulated: false
      };

      const updated = [newVideo, ...savedVideos];
      saveVideosToStorage(updated);
      setActivePreviewVideo(newVideo);
      setSuccessMessage("AI Cinematic Video generated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err: any) {
      console.warn("Live generation failed or paid billing key absent. Switching to high-fidelity simulated fallback...", err);
      
      const errMsg = err?.message || String(err);
      setLastGenerationError(errMsg);

      // Keep simulator progress running smoothly
      await new Promise(resolve => setTimeout(resolve, 1200));
      clearInterval(progressTimer);
      
      setGenerationProgress(90);
      setGenerationStep("Injecting custom cinematic motion physics...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationProgress(100);
      setGenerationStep("Simulation compiler complete!");

      const mapped = getSimulatedVideoUrl(prompt);

      const simulatedVideo: GeneratedVideo = {
        id: `vid-sim-${Date.now()}`,
        projectId: activeProjectId || 'global',
        videoUrl: mapped.url,
        prompt: prompt,
        model: `${selectedModel} (Simulated Fallback)`,
        aspectRatio: aspectRatio,
        timestamp: Date.now(),
        referenceImageUrl: refImageUrlForVault,
        isSimulated: true
      };

      const updated = [simulatedVideo, ...savedVideos];
      saveVideosToStorage(updated);
      setActivePreviewVideo(simulatedVideo);
      
      setSuccessMessage(`Simulated video compilation ready: "${mapped.title}" matches your prompt context!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedVideos.filter(v => v.id !== id);
    saveVideosToStorage(filtered);
    if (activePreviewVideo?.id === id) {
      setActivePreviewVideo(null);
    }
    setDeleteConfirmId(null);
  };

  const handleDownloadVideo = (video: GeneratedVideo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const a = document.createElement('a');
    a.href = video.videoUrl;
    // Standard download attribute bypass for external URLs
    a.target = '_blank';
    a.download = `video-generation-${video.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="video-studio-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <button
            onClick={onBackToDashboard}
            className="group flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-semibold"
            id="btn-video-back"
          >
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Projects Space</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Film className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <h1 className="text-xl font-display font-bold text-white tracking-wide" id="video-studio-title">
              Video Generation Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Create high-fidelity cinematic video loops from reference frames or narrative descriptions using native <span className="text-indigo-400 font-bold">Veo 3.1</span> and <span className="text-cyan-400 font-bold">Gemini Omni</span> models.
          </p>
        </div>

        {onSelectProject && projects && projects.length > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animate-pulse shrink-0"></span>
            <span className="text-xs text-slate-400 font-medium font-mono hidden sm:inline">Workspace:</span>
            <select
              value={activeProjectId || ''}
              onChange={(e) => onSelectProject(e.target.value || null)}
              className="text-xs font-semibold px-2 py-0.5 bg-transparent border-none outline-none text-slate-200 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">Standalone Space</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.name}</option>
              ))}
            </select>
          </div>
        ) : activeProject ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
            <span className="text-xs text-slate-300 font-medium font-mono">Project: {activeProject.name}</span>
          </div>
        ) : null}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Input Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto pr-1.5 scrollbar-thin">
          
          {/* Section: Directives Input */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cinematic Video Prompt</span>
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim() || isGenerating}
                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase rounded-lg tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                title="Use Gemini to rewrite the prompt with cinematic detail"
                id="btn-enhance-prompt"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 text-cyan-400" />
                )}
                <span>Enhance with AI</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the action, camera movement, and aesthetic (e.g. 'A slow cinematic tracking shot moving through a futuristic cyberpunk research lab, neon indicators flashing, volumetric haze, 4k render')"
                className="w-full h-32 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none font-medium leading-relaxed"
                disabled={isGenerating}
                id="input-video-prompt"
              />
              <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-500 font-mono">
                {prompt.length} chars
              </div>
            </div>

            {/* Quick Suggestions list */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Need inspiration?</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Cyberpunk Lab", prompt: "Cinematic camera drift through a neon cyberpunk server farm, fiber-optic cables pulsing with cyan light, volumetric particle haze, hyperrealistic." },
                  { label: "Winter Forest", prompt: "An aerial slow drone shot gliding over a snowy forest during winter sunset, warm orange light illuminating the evergreen pine trees." },
                  { label: "Tech Board", prompt: "A macro detailed camera tracking shot along a futuristic dark glass motherboard with glowing gold electrical pathways." }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s.prompt)}
                    disabled={isGenerating}
                    className="px-2 py-1 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-semibold rounded-lg transition-colors border border-transparent hover:border-slate-700/50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Image Reference & Specs */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            
            {/* Reference Image Drag/Drop */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reference Frame (Image-to-Video)</span>
              </label>
              
              <div
                ref={dragRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                }`}
                id="dropzone-ref-frame"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processImageFile(e.target.files[0]);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />

                {customImageBase64 ? (
                  <div className="relative group w-full max-h-36 overflow-hidden rounded-lg flex items-center justify-center bg-slate-950">
                    <img 
                      src={customImageBase64 || undefined} 
                      alt="Uploaded reference" 
                      className="object-contain max-h-36 w-full"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shadow transition-transform transform scale-90 group-hover:scale-100">
                        <Trash2 className="w-3 h-3" />
                        <span>Remove image</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomImageBase64(null);
                        setCustomImageName(null);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition-colors border border-white/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : selectedGalleryImage ? (
                  <div className="relative group w-full max-h-36 overflow-hidden rounded-lg flex items-center justify-center bg-slate-950">
                    <img 
                      src={selectedGalleryImage.data || undefined} 
                      alt="Gallery reference" 
                      className="object-contain max-h-36 w-full"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shadow transition-transform transform scale-90 group-hover:scale-100">
                        <Trash2 className="w-3 h-3" />
                        <span>Remove reference</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGalleryImage(null);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition-colors border border-white/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-1.5">
                    <div className="mx-auto w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-300 font-bold">Drag reference frame here</p>
                      <p className="text-[10px] text-slate-500">or click to browse local files</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Import from Recent project assets */}
            {currentProjectImages.length > 0 && !customImageBase64 && !selectedGalleryImage && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Or import from recent project images</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {currentProjectImages.slice(0, 4).map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setSelectedGalleryImage(img);
                        setError(null);
                      }}
                      className="relative h-12 rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500/50 bg-slate-950/50 transition-all flex items-center justify-center cursor-pointer group"
                      title={img.prompt}
                    >
                      <img src={img.data || undefined} alt="Quick pick" className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Model & Aspect ratio config */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Model Engine</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all font-semibold"
                  disabled={isGenerating}
                  id="select-video-model"
                >
                  <option value="veo-3.1-lite-generate-preview">Veo 3.1 Lite (Fast)</option>
                  <option value="veo-3.1-generate-preview">Veo 3.1 High-Quality</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Omni</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Aspect Ratio</span>
                <div className="flex gap-1" id="aspect-ratio-selector">
                  {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Large Primary Action Trigger */}
          <div className="space-y-2">
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            
            {lastGenerationError && (
              <div className="p-4 bg-rose-950/45 border border-rose-500/25 rounded-2xl text-rose-200 text-xs flex flex-col gap-2 text-left animate-in fade-in duration-300">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider font-mono text-[9px] text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Google VEO Live Compilation Failed</span>
                </div>
                <p className="font-medium leading-relaxed font-mono text-[11px] whitespace-pre-wrap bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/10 text-left">
                  {lastGenerationError}
                </p>
                <p className="text-[10px] text-slate-400 leading-normal text-left">
                  To keep you moving, we compiled a high-fidelity simulated fallback video below matching your prompts. Please ensure your API credentials/billing are configured to enable live generation.
                </p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            <button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.99]"
              id="btn-generate-video-action"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <Video className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              )}
              <span>{isGenerating ? 'Compiling AI Motion...' : 'Generate Cinematic Video'}</span>
            </button>
          </div>

        </div>

        {/* Right Column - Active Screen & Archives (7 cols) */}
        <div className="lg:col-span-7 space-y-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto pr-1.5 scrollbar-thin">
          
          {/* Section: Live Cinema Screen */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 md:p-6 overflow-hidden relative min-h-[360px] flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>AI Cinematic Screen</span>
              </span>
              
              {activePreviewVideo && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(activePreviewVideo.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Screen Canvas Area */}
            <div className="flex-1 my-5 flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden min-h-[220px] max-h-[380px] border border-slate-800/60 relative group shadow-inner">
              
              {isGenerating ? (
                // Immersive Loading Frame
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 bg-slate-950/95 animate-pulse" id="video-rendering-loader">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin relative z-10" />
                  </div>
                  <div className="space-y-2 text-center max-w-sm z-10">
                    <p className="text-sm font-bold text-slate-100 font-display">Rendering Cinematic Video</p>
                    <p className="text-xs text-indigo-400 font-medium font-mono animate-bounce">{generationStep}</p>
                  </div>
                  
                  {/* Progress bar container */}
                  <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 z-10">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{generationProgress}%</span>
                </div>
              ) : activePreviewVideo ? (
                // Active video layout
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={activePreviewVideo.id}
                    src={activePreviewVideo.videoUrl || undefined}
                    controls
                    autoPlay
                    loop
                    className="max-h-[380px] w-auto max-w-full object-contain"
                  />
                  
                  {/* Overlay tags on hover */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-bold text-cyan-400 uppercase tracking-widest pointer-events-none transition-opacity group-hover:opacity-100 opacity-0 font-mono">
                    {activePreviewVideo.isSimulated ? "Simulated Video" : "Live Render"}
                  </div>
                </div>
              ) : (
                // Empty Screen State
                <div className="text-center p-6 space-y-3">
                  <div className="mx-auto w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 font-bold">No active video compiling</p>
                    <p className="text-[10px] text-slate-500 max-w-xs">Describe an action sequence on the left and hit generate to view the cinematic motion loop output here.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Screen details footer bar */}
            {activePreviewVideo && (
              <div className="pt-3 border-t border-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-200 line-clamp-1">{activePreviewVideo.prompt}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Engine: {activePreviewVideo.model} • Ratio: {activePreviewVideo.aspectRatio}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadVideo(activePreviewVideo)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewVideo(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50"
                    title="Close video"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Section: Saved Video Archives (Grid Vault) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Generated Video Archives ({savedVideos.length})</span>
              </span>

              {savedVideos.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear your entire video vault?")) {
                      saveVideosToStorage([]);
                      setActivePreviewVideo(null);
                    }
                  }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Clear Archive
                </button>
              )}
            </div>

            {savedVideos.length === 0 ? (
              <div className="border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500">
                <p className="text-xs font-medium">Your compiled video vault is currently empty.</p>
                <p className="text-[10px] text-slate-600 mt-1">Generated loop clips will be automatically persisted here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVideos.map((vid) => {
                  const isActive = activePreviewVideo?.id === vid.id;
                  
                  return (
                    <div
                      key={vid.id}
                      onClick={() => setActivePreviewVideo(vid)}
                      className={`group border rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between bg-slate-900/60 relative ${
                        isActive 
                          ? 'border-indigo-500 ring-1 ring-indigo-500/30 shadow-indigo-500/5' 
                          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Video clip display context / thumbnail */}
                      <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden h-28 border-b border-slate-800/40">
                        {vid.referenceImageUrl ? (
                          <img 
                            src={vid.referenceImageUrl || undefined} 
                            alt="Reference frame" 
                            className="object-cover w-full h-full filter blur-[1px] opacity-70 scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-indigo-950/20"></div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 group-hover:bg-slate-950/50 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-slate-900/90 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white flex items-center justify-center border border-white/10 group-hover:border-indigo-500 shadow-lg transition-all transform group-hover:scale-105">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className="px-1.5 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[8px] font-bold text-slate-400 font-mono uppercase">
                            {vid.aspectRatio}
                          </span>
                          {vid.isSimulated && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur rounded text-[8px] font-bold font-mono">
                              Simulated
                            </span>
                          )}
                        </div>

                        {/* Inline Delete overlay */}
                        {deleteConfirmId === vid.id ? (
                          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-3 text-center z-20 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-red-200 font-bold mb-2">Delete permanently?</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={(e) => handleDeleteVideo(vid.id, e)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadVideo(vid);
                              }}
                              className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-md border border-white/10 shadow"
                              title="Download MP4"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(vid.id);
                              }}
                              className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-red-400 rounded-md border border-white/10 shadow"
                              title="Delete clip"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Video card text metadata */}
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">{vid.prompt}</p>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                          <span>{new Date(vid.timestamp).toLocaleDateString()}</span>
                          <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
