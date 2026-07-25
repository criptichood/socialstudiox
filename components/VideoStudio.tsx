import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { 
  Film, 
  Video, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon,
  Check, 
  AlertCircle,
  HelpCircle,
  UploadCloud,
  ChevronRight,
  Monitor,
  Smartphone,
  Square,
  ArrowLeftRight,
  RefreshCw,
  Layers,
  Trash2
} from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';

interface VideoStudioProps {
  images: GeneratedImage[];
  activeProjectId?: string | null;
}

const MOTION_PRESETS = [
  {
    id: 'auto',
    name: 'Let AI Decide (Recommended)',
    prompt: 'Let the AI automatically interpolate the absolute most dramatic cinematic camera path and motion vectors based on the visual context of the image.'
  },
  {
    id: 'dolly_zoom',
    name: 'Slow Dolly Zoom-In',
    prompt: 'Slow dramatic dolly zoom-in towards the central subject, high-fidelity lens flare, subtle atmospheric dust particles floating in backlighting.'
  },
  {
    id: 'orbit_overhead',
    name: 'Epic Drone Orbit',
    prompt: 'Dramatic slow overhead circular orbit drone shot, cinematic high-key golden hour lighting, epic parallax effect on layered background.'
  },
  {
    id: 'pan_left',
    name: 'Horizontal Scenic Pan',
    prompt: 'Professional slow horizontal camera pan left-to-right, revealing hidden geometric details, smooth slide motion, ultra-detailed textures.'
  },
  {
    id: 'ambient_glow',
    name: 'Neon Pulsing Drift',
    prompt: 'Smooth ambient camera drift, neon light lines pulsing across structural borders, glowing tech aesthetics, soft volumetric fog.'
  },
  {
    id: 'custom',
    name: 'Custom Motion Prompt...',
    prompt: ''
  }
];

const VideoStudio: React.FC<VideoStudioProps> = ({ images, activeProjectId }) => {
  const [sourceMode, setSourceMode] = useState<'single' | 'dual'>('single');
  
  // Single image states
  const [singleImageSelected, setSingleImageSelected] = useState<GeneratedImage | null>(null);
  const [singleImageCustom, setSingleImageCustom] = useState<string | null>(null);

  // Dual image states
  const [startFrameSelected, setStartFrameSelected] = useState<GeneratedImage | null>(null);
  const [startFrameCustom, setStartFrameCustom] = useState<string | null>(null);
  const [endFrameSelected, setEndFrameSelected] = useState<GeneratedImage | null>(null);
  const [endFrameCustom, setEndFrameCustom] = useState<string | null>(null);

  // Active target for upload/gallery selection
  const [activeTarget, setActiveTarget] = useState<'single' | 'start' | 'end'>('single');

  // Motion Settings
  const [selectedPresetId, setSelectedPresetId] = useState('auto');
  const [videoPrompt, setVideoPrompt] = useState(MOTION_PRESETS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  
  // Render States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<{ videoUrl?: string; isSimulated?: boolean } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch active target when changing sourceMode
  useEffect(() => {
    if (sourceMode === 'single') {
      setActiveTarget('single');
    } else {
      setActiveTarget('start');
    }
    // Clear render results when switching modes to avoid mismatched previews
    setRenderResult(null);
    setIsPlaying(false);
  }, [sourceMode]);

  // Resolve active sources
  const getSingleImageSrc = () => singleImageCustom || singleImageSelected?.data;
  const getStartFrameSrc = () => startFrameCustom || startFrameSelected?.data;
  const getEndFrameSrc = () => endFrameCustom || endFrameSelected?.data;

  // Active src to compile / show
  const activeSrc = sourceMode === 'single' ? getSingleImageSrc() : (getStartFrameSrc() || getEndFrameSrc());

  // Filter gallery images by project if activeProjectId exists
  const projectImages = images.filter(img => {
    if (activeProjectId) {
      return (img.subOptions?.projectId || 'proj-1') === activeProjectId;
    }
    return true;
  });

  // Handle local image file selection
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG or JPEG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        const dataUrl = e.target.result;
        if (activeTarget === 'single') {
          setSingleImageCustom(dataUrl);
          setSingleImageSelected(null);
        } else if (activeTarget === 'start') {
          setStartFrameCustom(dataUrl);
          setStartFrameSelected(null);
        } else if (activeTarget === 'end') {
          setEndFrameCustom(dataUrl);
          setEndFrameSelected(null);
        }
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

  const triggerManualSelect = (target: 'single' | 'start' | 'end') => {
    setActiveTarget(target);
    fileInputRef.current?.click();
  };

  const handleSelectGalleryImage = (img: GeneratedImage) => {
    if (activeTarget === 'single') {
      setSingleImageSelected(img);
      setSingleImageCustom(null);
    } else if (activeTarget === 'start') {
      setStartFrameSelected(img);
      setStartFrameCustom(null);
    } else if (activeTarget === 'end') {
      setEndFrameSelected(img);
      setEndFrameCustom(null);
    }
    setError(null);
  };

  const handleSwapFrames = () => {
    // Swap custom base64 files
    const tempCustom = startFrameCustom;
    setStartFrameCustom(endFrameCustom);
    setEndFrameCustom(tempCustom);

    // Swap selected gallery objects
    const tempSelected = startFrameSelected;
    setStartFrameSelected(endFrameSelected);
    setEndFrameSelected(tempSelected);
  };

  const handleClearFrame = (target: 'single' | 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    if (target === 'single') {
      setSingleImageCustom(null);
      setSingleImageSelected(null);
    } else if (target === 'start') {
      setStartFrameCustom(null);
      setStartFrameSelected(null);
    } else if (target === 'end') {
      setEndFrameCustom(null);
      setEndFrameSelected(null);
    }
    setRenderResult(null);
    setIsPlaying(false);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = MOTION_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      setVideoPrompt(preset.prompt);
    } else if (presetId === 'custom') {
      setVideoPrompt('');
    }
  };

  const handleCompileVideo = async () => {
    if (sourceMode === 'single') {
      const src = getSingleImageSrc();
      if (!src) {
        setError('Please select or upload a source image first.');
        return;
      }
    } else {
      const startSrc = getStartFrameSrc();
      const endSrc = getEndFrameSrc();
      if (!startSrc && !endSrc) {
        setError('Please select at least a Start Frame or End Frame image.');
        return;
      }
    }

    if (!videoPrompt.trim()) {
      setError('Please write or select a camera motion direction prompt first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRenderResult(null);
    setIsPlaying(false);

    try {
      setLoadingStep('Initializing AI Veo Engine... [1/4]');
      await new Promise(resolve => setTimeout(resolve, 800));

      setLoadingStep('Analyzing source graphic composition & boundaries... [2/4]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLoadingStep('Rendering dynamic motion vectors and camera path interpolation... [3/4]');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setLoadingStep('Compiling final high-fidelity cinematic video frames... [4/4]');
      
      const primarySource = sourceMode === 'single' ? getSingleImageSrc() : (getStartFrameSrc() || getEndFrameSrc());
      const res = await generateVeoVideo(videoPrompt, primarySource, aspectRatio);

      setRenderResult({
        videoUrl: res.videoUrl || primarySource,
        isSimulated: res.isSimulated ?? true
      });
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate cinematic video. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 relative z-10 animate-in fade-in duration-500">
      
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-widest font-mono block">
            Social Studio X / Interactive Engine
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-display mt-1">
            AI Cinematic Video Studio
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Transform static graphic concepts or brand visuals into immersive animated video sequences. Leverage Gemini Veo preview models to interpolate professional camera motions instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Creative Directors Control Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Source Selection & Uploader */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 text-left">
            
            {/* Mode selection Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-500" />
                <span>1. Source Graphic Visual</span>
              </h3>
              
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSourceMode('single')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    sourceMode === 'single'
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                >
                  Single Image
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('dual')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    sourceMode === 'dual'
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                >
                  Dual Frame (Start/End)
                </button>
              </div>
            </div>

            {/* Hidden Input File Element */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Content rendering based on mode */}
            {sourceMode === 'single' ? (
              <div className="space-y-3">
                {getSingleImageSrc() ? (
                  /* Single Image Preview Component directly at the top */
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm bg-slate-950">
                    <img 
                      src={getSingleImageSrc()} 
                      alt="Source visual preview" 
                      className="w-full h-full object-contain filter brightness-90"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerManualSelect('single')}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleClearFrame('single', e)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg backdrop-blur-md transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        Active Image Source
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Standard Drag and Drop trigger box */
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => triggerManualSelect('single')}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDragOver 
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-500/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500 bg-slate-50/50 dark:bg-slate-950/20'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-600 animate-bounce" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Upload image from local machine
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Drag & drop or click to select
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Dual Frame Mode (Start & End Frame side by side) with Swap Button */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 relative">
                  
                  {/* Start Frame slot */}
                  <div 
                    onClick={() => setActiveTarget('start')}
                    className={`relative rounded-2xl border-2 cursor-pointer transition-all p-3 text-center flex flex-col items-center justify-center aspect-square bg-slate-50 dark:bg-slate-950 overflow-hidden ${
                      activeTarget === 'start' 
                        ? 'border-cyan-500 ring-2 ring-cyan-500/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {getStartFrameSrc() ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img src={getStartFrameSrc()} alt="Start keyframe" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerManualSelect('start')}
                            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all"
                            title="Replace Image"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleClearFrame('start', e)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg backdrop-blur-md transition-all"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-slate-950/85 px-1.5 py-0.5 rounded border border-slate-800 text-[8px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                          Start Frame
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-400">
                        <UploadCloud className="w-5 h-5 mx-auto" />
                        <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-500">
                          Set Start Frame
                        </span>
                        <span className="text-[8px] text-slate-400 block leading-none">
                          Click to select
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Swap Button nestled in the middle */}
                  {(getStartFrameSrc() || getEndFrameSrc()) && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <button
                        type="button"
                        onClick={handleSwapFrames}
                        className="p-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-400 rounded-full border border-slate-700 dark:border-slate-600 shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Swap Start and End Frames"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* End Frame slot */}
                  <div 
                    onClick={() => setActiveTarget('end')}
                    className={`relative rounded-2xl border-2 cursor-pointer transition-all p-3 text-center flex flex-col items-center justify-center aspect-square bg-slate-50 dark:bg-slate-950 overflow-hidden ${
                      activeTarget === 'end' 
                        ? 'border-cyan-500 ring-2 ring-cyan-500/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {getEndFrameSrc() ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img src={getEndFrameSrc()} alt="End keyframe" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerManualSelect('end')}
                            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all"
                            title="Replace Image"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleClearFrame('end', e)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg backdrop-blur-md transition-all"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-slate-950/85 px-1.5 py-0.5 rounded border border-slate-800 text-[8px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                          End Frame
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-400">
                        <UploadCloud className="w-5 h-5 mx-auto" />
                        <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-500">
                          Set End Frame
                        </span>
                        <span className="text-[8px] text-slate-400 block leading-none">
                          Click to select
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0"></span>
                  <p className="leading-snug">
                    Currently targeting: <strong className="text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">{activeTarget === 'start' ? 'Start Frame' : 'End Frame'}</strong>. Select any image below to populate.
                  </p>
                </div>
              </div>
            )}

            {/* Gallery Image Selector */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/40">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Or pick from Project Gallery
                </span>
                {sourceMode === 'single' ? (
                  singleImageSelected && (
                    <button 
                      onClick={() => setSingleImageSelected(null)}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )
                ) : (
                  (startFrameSelected || endFrameSelected) && (
                    <button 
                      onClick={() => {
                        setStartFrameSelected(null);
                        setEndFrameSelected(null);
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear both
                    </button>
                  )
                )}
              </div>

              {projectImages.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl text-center">
                  No images in gallery yet. Generate one in the Visual Canvas first.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                  {projectImages.map((img) => {
                    let isPicked = false;
                    if (sourceMode === 'single') {
                      isPicked = singleImageSelected?.id === img.id;
                    } else {
                      isPicked = startFrameSelected?.id === img.id || endFrameSelected?.id === img.id;
                    }
                    
                    return (
                      <div
                        key={img.id}
                        onClick={() => handleSelectGalleryImage(img)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isPicked 
                            ? 'border-cyan-500 scale-95 shadow-md shadow-cyan-500/10' 
                            : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:scale-102'
                        }`}
                      >
                        <img src={img.data} alt={img.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {isPicked && (
                          <div className="absolute inset-0 bg-cyan-950/40 flex items-center justify-center">
                            <Check className="w-5 h-5 text-cyan-400 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Section 2: Motion Parameters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-500" />
              <span>2. Camera Motion Settings</span>
            </h3>

            {/* Quick Presets Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Cinematic Motion Options
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {MOTION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Motion Script Prompt Directions
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe your camera motion in detail (e.g., slow panning, dollying, rotation, focal transitions)..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Aspect Ratio selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Render Aspect Ratio
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9 Slide', icon: Monitor },
                  { id: '9:16', label: '9:16 Story', icon: Smartphone },
                  { id: '1:1', label: '1:1 Square', icon: Square }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAspectRatio(item.id as any)}
                      className={`py-2 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isActive 
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shadow-inner' 
                          : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold font-mono">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              disabled={isLoading || !activeSrc}
              onClick={handleCompileVideo}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-500 dark:to-indigo-500 hover:from-cyan-500 hover:to-indigo-500 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-950" />
                  <span>Compiling Cinematic Frames...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Compile Cinematic Video</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Right Side: Dynamic Interactive Preview Pane (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col min-h-[460px] justify-between relative overflow-hidden text-left">
            
            {/* Upper control overlay bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Cinematic Screen Monitor
                </span>
              </div>
              {renderResult && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 rounded font-mono">
                  {renderResult.isSimulated ? 'KEN BURNS PREVIEW ACTIVE' : 'VEO 3.1 NATIVE RENDER'}
                </span>
              )}
            </div>

            {/* Main Stage Panel */}
            <div className="flex-1 my-5 bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner min-h-[300px]">
              
              {/* Dynamic Overlay background glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 z-0 pointer-events-none"></div>

              {/* 1. Normal State (no image selected yet) */}
              {!activeSrc && !isLoading && !renderResult && (
                <div className="text-center p-6 space-y-3 z-10 max-w-sm">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto shadow">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-300">Awaiting Source Graphic</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Select an image from your project gallery or upload one from your local device to unlock the camera motion compilation screen.
                  </p>
                </div>
              )}

              {/* 2. Image selected, not yet rendered */}
              {activeSrc && !isLoading && !renderResult && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  {sourceMode === 'dual' && getStartFrameSrc() && getEndFrameSrc() ? (
                    <div className="flex items-center gap-4 max-w-md">
                      <div className="w-1/2 aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                        <img src={getStartFrameSrc()} alt="Start frame preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-1/2 aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                        <img src={getEndFrameSrc()} alt="End frame preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={activeSrc} 
                      alt="Active static visual" 
                      className="max-h-[60vh] w-auto object-contain rounded-lg filter brightness-75 select-none" 
                    />
                  )}
                  <div className="absolute bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-center text-xs space-y-1 shadow-2xl z-10 mt-4">
                    <span className="font-bold text-slate-200 block">Source Engaged</span>
                    <span className="text-[10px] text-slate-400 block">Click Compile Cinematic Video to render motion camera path</span>
                  </div>
                </div>
              )}

              {/* 3. Loading state */}
              {isLoading && (
                <div className="text-center p-6 space-y-4 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin relative z-10 mx-auto" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-cyan-400 tracking-wider font-mono uppercase">
                      {loadingStep || 'Analyzing Keyframes...'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Please wait while Gemini processes the spatial boundaries
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Display result */}
              {renderResult && activeSrc && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950">
                  
                  {/* Cinematic Zoom & Pan container */}
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                    {sourceMode === 'dual' && getStartFrameSrc() && getEndFrameSrc() ? (
                      <>
                        <img 
                          src={getStartFrameSrc()} 
                          alt="Cinematic Start Frame" 
                          className={`absolute inset-0 w-full h-full object-contain filter brightness-95 saturate-110 shadow-lg select-none transition-all duration-[8000ms] ease-out ${
                            isPlaying 
                              ? 'scale-115 translate-x-2 translate-y-1 opacity-0' 
                              : 'scale-100 opacity-100'
                          }`}
                        />
                        <img 
                          src={getEndFrameSrc()} 
                          alt="Cinematic End Frame" 
                          className={`absolute inset-0 w-full h-full object-contain filter brightness-95 saturate-110 shadow-lg select-none transition-all duration-[8000ms] ease-out ${
                            isPlaying 
                              ? 'scale-110 translate-x-0 translate-y-0 opacity-100' 
                              : 'scale-100 opacity-0'
                          }`}
                        />
                      </>
                    ) : (
                      <img 
                        src={activeSrc} 
                        alt="Cinematic Preview" 
                        className={`max-h-full max-w-full object-contain filter brightness-95 saturate-110 shadow-lg select-none transition-all duration-[8000ms] ease-out ${
                          isPlaying 
                            ? 'scale-115 translate-x-2 translate-y-1' 
                            : 'scale-100'
                        }`}
                      />
                    )}
                    
                    {/* Bottom Prompt Caption Bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col justify-end pointer-events-none text-left z-10">
                      <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                        Active Camera Path
                      </span>
                      <p className="text-xs text-white drop-shadow italic leading-relaxed line-clamp-2 mt-0.5 font-medium">
                        "{videoPrompt}"
                      </p>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Error notifications inside preview panel */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-300 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Actions Bar at bottom */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 shrink-0">
              {renderResult && activeSrc ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Freeze motion</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Engage Motion</span>
                      </>
                    )}
                  </button>

                  <a
                    href={activeSrc}
                    download="campaign-cinematic-visual.png"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Frame</span>
                  </a>
                </>
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Awaiting cinematic compilation triggers...
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default VideoStudio;
