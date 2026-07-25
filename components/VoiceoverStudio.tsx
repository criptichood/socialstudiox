import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage } from '../types';
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
  VolumeX,
  Music,
  Trash2
} from 'lucide-react';
import { generateVoiceOverSpeech, generateImageToScript } from '../services/geminiService';

interface VoiceoverStudioProps {
  images: GeneratedImage[];
  activeProjectId?: string | null;
}

const VOICE_ACTORS = [
  { id: 'Puck', name: '🎤 Puck', description: 'Energetic & Professional Male' },
  { id: 'Charon', name: '🎤 Charon', description: 'Deep, Authoritative Male' },
  { id: 'Kore', name: '🎤 Kore', description: 'Inspiring & Enthusiastic Female' },
  { id: 'Fenrir', name: '🎤 Fenrir', description: 'Modern, Sleek, Warm Male' },
  { id: 'Aoede', name: '🎤 Aoede', description: 'Empathetic & Resonant Female' }
];

const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({ images, activeProjectId }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState("In today's fast-paced world, automation is your unfair advantage. Connect with your audience and accelerate growth instantly.");
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'>('Puck');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter gallery images by project if activeProjectId exists
  const projectImages = images.filter(img => {
    if (activeProjectId) {
      return (img.subOptions?.projectId || 'proj-1') === activeProjectId;
    }
    return true;
  });

  // Handle local image file manual selection & Drag and Drop upload
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

  // Analyze Image using Gemini to Generate context-matching spoken voiceover script!
  const handleAnalyzeImage = async () => {
    const activeImageSrc = customImageBase64 || selectedImage?.data;
    const promptRef = selectedImage?.prompt || "brand social marketing campaign";
    
    if (!activeImageSrc) {
      setError('Please select an image from the gallery or upload a custom image file first.');
      return;
    }

    setIsAnalyzingImage(true);
    setError(null);
    setLoadingStep('Initializing Gemini Vision multimodal analysis...');

    try {
      setLoadingStep('Deconstructing visual layout & extracting core brand concepts...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setLoadingStep('Crafting 10-15s professional spoken-word script...');
      const script = await generateImageToScript(activeImageSrc, promptRef);
      
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

  // Synthesize custom audio voiceover speech
  const handleSynthesizeSpeech = async () => {
    if (!scriptText.trim()) {
      setError('Please enter some text in the script draft editor.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      setLoadingStep('Connecting to Gemini-2.5-flash Audio Synthesis pipeline...');
      await new Promise(resolve => setTimeout(resolve, 600));

      setLoadingStep('Encoding audio streams & applying voice actor frequency curves...');
      const resultAudioUrl = await generateVoiceOverSpeech(scriptText, selectedVoice);

      setAudioUrl(resultAudioUrl);
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to synthesize text-to-speech voice. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Audio Playback Listeners
  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn("Autoplay block", e);
          setIsPlaying(false);
        });
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Failed to play", err);
      });
      setIsPlaying(true);
    }
  };

  const activeSrc = customImageBase64 || selectedImage?.data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 relative z-10 animate-in fade-in duration-500">
      
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-widest font-mono block">
            Social Studio X / Interactive Engine
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-display mt-1">
            AI Voiceover & Speech Synthesizer
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Compose high-fidelity spoken narrative scripts. Translate static graphic concepts directly into spoken advertising scripts using Gemini vision, and synthesize professional human-quality audios instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Creative Director & Writer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Voiceover Workspace */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-500" />
                <span>Audio Narration & Script Editor</span>
              </span>
              <span className="px-2.5 py-0.5 bg-cyan-500/15 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 rounded">
                Gemini TTS Engine
              </span>
            </h3>

            {/* Script input area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  Voiceover Script Draft
                </label>
                <span className="text-[10px] font-medium text-slate-400 font-mono">
                  {scriptText.length} characters / ~{Math.ceil(scriptText.split(/\s+/).filter(Boolean).length)} words
                </span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Type or paste your spoken word-for-word voiceover script here..."
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-2xl text-xs md:text-sm leading-relaxed focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Voice actor grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Select Premium Voice Character Actor
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOICE_ACTORS.map((actor) => {
                  const isActive = selectedVoice === actor.id;
                  return (
                    <button
                      key={actor.id}
                      type="button"
                      onClick={() => setSelectedVoice(actor.id as any)}
                      className={`px-4 py-3 text-left rounded-xl border transition-all flex flex-col justify-center gap-0.5 ${
                        isActive 
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 ring-1 ring-cyan-500/10' 
                          : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold">{actor.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                        {actor.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Deck */}
            <button
              type="button"
              disabled={isLoading || !scriptText.trim()}
              onClick={handleSynthesizeSpeech}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-500 dark:to-indigo-500 hover:from-cyan-500 hover:to-indigo-500 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-950" />
                  <span>Synthesizing custom human vocal frequencies...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Synthesize Custom AI Voiceover</span>
                </>
              )}
            </button>

          </div>

          {/* Section: Output Audio Player */}
          {audioUrl && (
            <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-4 duration-300 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">GENERATED VOICE TRACK</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Voice: {selectedVoice} (Gemini AI)</p>
                  </div>
                </div>
                
                <a
                  href={audioUrl}
                  download={`voiceover-${selectedVoice.toLowerCase()}.mp3`}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP3</span>
                </a>
              </div>

              {/* Graphical Visualizer Simulation */}
              <div className="my-5 flex items-center justify-center gap-1 h-12 bg-slate-950 rounded-xl px-4 relative overflow-hidden border border-slate-800">
                {isPlaying ? (
                  <div className="flex items-end justify-center gap-1 h-8">
                    {[3, 7, 5, 8, 4, 9, 6, 8, 3, 7, 5, 9, 4, 8, 6, 3, 7, 5, 9].map((h, i) => (
                      <span 
                        key={i} 
                        className="w-1.5 bg-cyan-400 rounded-full animate-pulse" 
                        style={{ 
                          height: `${h * 10}%`, 
                          animationDelay: `${i * 120}ms`,
                          animationDuration: '700ms'
                        }}
                      ></span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest z-10 select-none">
                    Audio stream paused
                  </span>
                )}
              </div>

              {/* Main Player controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="p-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-all hover:scale-105 active:scale-95 shadow"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  {isPlaying ? 'ACTIVE AUDIO STREAMING' : 'CLICK PLAY TO HEAR NARRAION'}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Image-to-Voiceover Analyzer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Uploader / Analyzer Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-cyan-500" />
              <span>Image-to-Voiceover Assistant</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Let Gemini analyze a static image from your vault or computer and compose an elegant matching advertisement voiceover script.
            </p>

            {/* Direct Image Uploader */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerManualSelect}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragOver 
                  ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-500/10' 
                  : customImageBase64 
                    ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              {customImageBase64 ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-500 mx-auto shadow-sm">
                    <img src={customImageBase64} alt="Uploaded source" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                    ✨ Custom File Loaded
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Click or drag new to replace
                  </span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-600 animate-bounce" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Upload static image file
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Drag & drop or click to browse
                  </span>
                </>
              )}
            </div>

            {/* Gallery Picker */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Or pick from Project Gallery
                </span>
                {selectedImage && (
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {projectImages.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl text-center">
                  No images in gallery yet. Generate one in the Visual Canvas first.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                  {projectImages.map((img) => {
                    const isPicked = selectedImage?.id === img.id;
                    return (
                      <div
                        key={img.id}
                        onClick={() => {
                          setSelectedImage(img);
                          setCustomImageBase64(null); // Clear custom uploader
                          setError(null);
                        }}
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

            {/* Analyze Trigger */}
            <button
              type="button"
              disabled={isAnalyzingImage || !activeSrc}
              onClick={handleAnalyzeImage}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{loadingStep || 'Analyzing Image Content...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Analyze & Compose Voiceover Script</span>
                </>
              )}
            </button>

          </div>

          {/* Feedback error messages */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-800 dark:text-red-300 backdrop-blur-sm text-left">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default VoiceoverStudio;
