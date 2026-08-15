import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Play, 
  Volume2, 
  VolumeX, 
  Video, 
  Film, 
  Mic, 
  Music, 
  Download, 
  Maximize2, 
  Sparkles, 
  Loader2, 
  Wand2,
  User,
  Gauge,
  Languages,
  Radio,
  Music2
} from 'lucide-react';
import { SocialPostCampaignItem } from '../../DraftsPlanner';
import { CampaignImage } from '../CampaignImage';
import { ImageDownloadDropdown } from '../../ImageDownloadDropdown';
import { useModelOptions } from '@/hooks/useModelOptions';

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
  { id: 'inspirational', name: '✨ Inspirational & Uplifting', description: 'Charismatic, motivational tone' }
];

const BACKGROUND_TRACKS = [
  { id: 'none', name: '🔇 No Background Track', description: 'Clean narration only' },
  { id: 'lofi', name: '🎧 Lofi Chill Beats', description: 'Laid-back lofi hip-hop groove' },
  { id: 'ambient', name: '🌌 Ambient Pad', description: 'Soft atmospheric soundscape' },
  { id: 'synthwave', name: '🌆 Synthwave Retro', description: 'Neon retro-futuristic pulse' },
  { id: 'cinematic', name: '🎬 Cinematic Score', description: 'Epic film-score tension' }
];

interface VideoStudioLightboxModalProps {
  previewImageModal: {
    url: string;
    title: string;
    prompt: string;
    post: SocialPostCampaignItem;
    slide?: any;
    postIdx: number;
    slideIdx: number | null;
  } | null;
  onClose: () => void;
  lightboxViewTab: 'image' | 'video';
  setLightboxViewTab: (tab: 'image' | 'video') => void;
  playingAudio: HTMLAudioElement | null;
  handlePlayVoiceOver: (pIdx: number, sIdx: number | null, text: string, voice?: any, savedAudioUrl?: string) => void;
  handleStopVoiceOver: () => void;
  setZoomImageModalUrl: (url: string | null) => void;
  handleSelectVoiceActor: (voice: any, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectAudioEngine: (model: string, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectAccent: (accent: string, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectPersonaStyle: (persona: string, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectDeliveryTone: (tone: string, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectSpeechSpeed: (speed: string, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectCameraAnim: (anim: any, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectVideoAspectRatio: (aspect: string, postIdx?: number, slideIdx?: number | null) => void;
  handleSelectBackgroundTrack: (track: any, postIdx?: number, slideIdx?: number | null) => void;
  handleSynthesizeVoice: (postIdx: number, slideIdx: number | null, text: string, voice?: any, model?: string, accent?: string, persona?: string, tone?: string, speed?: string) => Promise<void>;
  handleGenerateVideoScriptAI: (postIdx: number, slideIdx: number | null) => Promise<void>;
  handleCompileProgrammaticVideoFrame: (postIdx: number, slideIdx: number | null, imageSrc?: string, promptText?: string, animStyle?: any, aspectRatio?: string, audioUrl?: string) => Promise<void>;
  handleUpdateScriptField: (postIdx: number, slideIdx: number | null, field: 'voiceOver' | 'videoPrompt', val: string) => void;
  campaignPosts: SocialPostCampaignItem[] | null;
  synthesizingSpeechMap: Record<string, boolean>;
  scriptGeneratingMap: Record<string, boolean>;
  videoRenderingMap: Record<string, boolean>;
  selectedVoiceActor: any;
  selectedAudioEngine: string;
  selectedAccent: string;
  selectedPersonaStyle: string;
  selectedDeliveryTone: string;
  selectedSpeechSpeed: string;
  selectedCameraAnim: any;
  selectedBackgroundTrack: any;
  getStudioKey: (postIdx: number, slideIdx: number | null) => string;
  handleLaunchPost: (post: SocialPostCampaignItem, slide?: any) => void;
  triggerToast: (msg: string) => void;
}

export const VideoStudioLightboxModal: React.FC<VideoStudioLightboxModalProps> = ({
  previewImageModal,
  onClose,
  lightboxViewTab,
  setLightboxViewTab,
  playingAudio,
  handlePlayVoiceOver,
  handleStopVoiceOver,
  setZoomImageModalUrl,
  handleSelectVoiceActor,
  handleSelectAudioEngine,
  handleSelectAccent,
  handleSelectPersonaStyle,
  handleSelectDeliveryTone,
  handleSelectSpeechSpeed,
  handleSelectCameraAnim,
  handleSelectVideoAspectRatio,
  handleSelectBackgroundTrack,
  handleSynthesizeVoice,
  handleGenerateVideoScriptAI,
  handleCompileProgrammaticVideoFrame,
  handleUpdateScriptField,
  campaignPosts,
  synthesizingSpeechMap,
  scriptGeneratingMap,
  videoRenderingMap,
  selectedVoiceActor,
  selectedAudioEngine,
  selectedAccent,
  selectedPersonaStyle,
  selectedDeliveryTone,
  selectedSpeechSpeed,
  selectedCameraAnim,
  selectedBackgroundTrack,
  getStudioKey,
  handleLaunchPost,
  triggerToast,
}) => {
  const { options: voiceModelOptions, loading: voiceModelsLoading } = useModelOptions('voice');
  const effectiveTTSModels = voiceModelOptions.length > 0 ? voiceModelOptions.map(m => ({
    id: m.id,
    name: m.backend === 'gateway' ? `${m.label} (Gateway)` : m.label,
    description: m.description || m.provider || (m.backend === 'gateway' ? 'AI Gateway neural voice' : 'Gemini native voice'),
  })) : TTS_MODELS;

  if (!previewImageModal) return null;

  const { post: _postSnapshot, slide: _slideSnapshot, postIdx: pIdx, slideIdx: sIdx } = previewImageModal;
  // Read live from campaignPosts so edits (script, audio, tone, etc.) reflect immediately
  // instead of being stuck on the stale object captured when the modal opened.
  const post = campaignPosts?.[pIdx] || _postSnapshot;
  const slide = (sIdx !== null && post.slides && post.slides[sIdx]) ? post.slides[sIdx] : _slideSnapshot;
  const targetObj: any = slide || post;

  const voiceOver = targetObj.voiceOver || post.voiceOver || post.caption || '';
  const videoPrompt = targetObj.videoPrompt || post.videoPrompt || post.visualPrompt || '';
  const savedAudioUrl = targetObj.audioUrl || post.audioUrl;
  const isVideoGenerated = !!targetObj.videoGenerated;

  const studioKey = getStudioKey(pIdx, sIdx);
  const isSpeechSynthesizing = !!synthesizingSpeechMap[studioKey];
  const isScriptGenerating = !!scriptGeneratingMap[studioKey];
  const isVideoGenerating = !!videoRenderingMap[studioKey];

  const selectedVoice = targetObj.voiceName || selectedVoiceActor;
  const currentEngine = (targetObj as any).ttsModel || selectedAudioEngine;
  const currentAccent = (targetObj as any).accent || selectedAccent;
  const currentPersona = (targetObj as any).personaStyle || selectedPersonaStyle;
  const currentTone = (targetObj as any).deliveryTone || selectedDeliveryTone;
  const currentSpeed = (targetObj as any).speechSpeed || selectedSpeechSpeed;
  const currentAnim = (targetObj as any).animationStyle || selectedCameraAnim;
  const currentToneDesc = DELIVERY_STYLES.find(d => d.id === currentTone)?.description || currentTone;

  const isPlaying = !!playingAudio;

  const handleDownloadVideo = () => {
    if (targetObj.videoUrl) {
      const a = document.createElement('a');
      a.href = targetObj.videoUrl;
      a.download = `campaign-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      triggerToast("Downloading campaign video MP4...");
    }
  };

  const handleDownloadAudio = () => {
    if (savedAudioUrl) {
      const a = document.createElement('a');
      a.href = savedAudioUrl;
      a.download = `campaign-audio-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      triggerToast("Downloading synthesized audio...");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99990] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar text-white">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <span>AI Video & Voiceover Studio</span>
                {slide && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-mono rounded-md border border-purple-500/30">
                    Slide {slide.slideNumber}: {slide.title}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {post.topic} • Synthesize spoken narration and render motion MP4
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleStopVoiceOver();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Tab Mode Switcher */}
        <div className="flex items-center justify-between bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLightboxViewTab('image')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                lightboxViewTab === 'image'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Graphic & Motion Canvas</span>
            </button>

            <button
              type="button"
              onClick={() => setLightboxViewTab('video')}
              disabled={!isVideoGenerated && !targetObj.videoUrl}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 ${
                lightboxViewTab === 'video'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compiled MP4 Video {isVideoGenerated ? '(Ready)' : ''}</span>
            </button>
          </div>

          {savedAudioUrl && (
            <button
              type="button"
              onClick={() => handlePlayVoiceOver(pIdx, sIdx, voiceOver, selectedVoice, savedAudioUrl)}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Mute Speech' : 'Play Narration'}</span>
            </button>
          )}
        </div>

        {/* Main Studio Viewport Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Canvas Viewport */}
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 aspect-video flex items-center justify-center group/video shadow-xl">
              {lightboxViewTab === 'video' ? (
                targetObj.videoUrl ? (
                  <video
                    src={targetObj.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-6 text-center space-y-2 text-slate-400">
                    <Video className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
                    <p className="text-xs font-medium">No MP4 Video Compiled Yet</p>
                    <button
                      type="button"
                      onClick={() => handleCompileProgrammaticVideoFrame(pIdx, sIdx, previewImageModal.url, videoPrompt, currentAnim, (targetObj as any).videoAspectRatio || post.aspectRatio)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 mx-auto cursor-pointer shadow-md"
                    >
                      {isVideoGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Compile Video Now</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
                  <CampaignImage src={previewImageModal.url} alt="Cinematic Preview" className={`w-full h-full object-contain filter brightness-90 saturate-110 anim-${currentAnim}`} />
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <span className="px-2 py-1 bg-slate-950/80 backdrop-blur-md text-[9px] font-bold text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>{lightboxViewTab === 'video' ? 'VIDEO VIEW ACTIVE' : 'GRAPHIC VIEW ACTIVE'}</span>
                </span>
                {isPlaying && (
                  <span className="px-2 py-1 bg-purple-500/80 backdrop-blur-md text-[9px] font-bold text-white rounded-lg border border-purple-500/30 flex items-center gap-1 shadow-md">
                    <Music className="w-2.5 h-2.5 text-purple-200 animate-spin" />
                    <span>SPEECH AUDIO ACTIVE</span>
                  </span>
                )}
              </div>

              {/* Controls overlay */}
              {lightboxViewTab === 'image' && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/video:opacity-100 flex items-center justify-center gap-3 transition-opacity z-20">
                  <button
                    type="button"
                    onClick={() => handlePlayVoiceOver(pIdx, sIdx, voiceOver, selectedVoice, savedAudioUrl)}
                    className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    {isPlaying ? <VolumeX className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomImageModalUrl(previewImageModal.url)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Metadata & Download */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <ImageDownloadDropdown
                  imageUrl={previewImageModal.url}
                  filenameSlug={`campaign-graphic-${Date.now()}`}
                  buttonVariant="compact"
                  buttonText="Graphic"
                  onDownloadSuccess={(fmt) => triggerToast(`Graphic downloaded in .${fmt} format!`)}
                />
                {isVideoGenerated && targetObj.videoUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Download className="w-3 h-3 text-amber-300" />
                    <span>Video</span>
                  </button>
                )}
                {savedAudioUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadAudio}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    title="Download the synthesized narration audio"
                  >
                    <Download className="w-3 h-3 text-white" />
                    <span>Audio</span>
                  </button>
                )}
              </div>
              <span>Motion: <strong className="text-purple-400 uppercase">{currentAnim}</strong></span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Voice & Engine Controls */}
              <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Audio & Voice Settings</span>
                  </label>
                  {savedAudioUrl && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold uppercase rounded text-emerald-400">
                      ✨ Audio Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 block font-bold font-mono">Voice Actor</span>
                    <select
                      value={selectedVoice}
                      onChange={(e) => handleSelectVoiceActor(e.target.value as any, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                    >
                      <option value="Puck">🎤 Puck (Energetic Male)</option>
                      <option value="Charon">🎤 Charon (Deep Male)</option>
                      <option value="Kore">🎤 Kore (Inspiring Female)</option>
                      <option value="Fenrir">🎤 Fenrir (Modern Sleek Male)</option>
                      <option value="Aoede">🎤 Aoede (Empathetic Female)</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-cyan-400 block font-mono">Camera Motion</span>
                    <select
                      value={currentAnim}
                      onChange={(e) => handleSelectCameraAnim(e.target.value as any, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="zoom-in">🔍 Slow Cinematic Zoom In</option>
                      <option value="pan-left">👈 Smooth Pan Left</option>
                      <option value="pan-right">👉 Smooth Pan Right</option>
                      <option value="ken-burns">🎬 Ken Burns Dynamic Zoom</option>
                      <option value="pulse">💓 Subtle Ambient Pulse</option>
                      <option value="static">⏸️ Static Frame</option>
                    </select>
                  </div>
                </div>

                {/* Character Persona & Delivery Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-fuchsia-400 block font-mono flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Character Persona
                    </span>
                    <select
                      value={currentPersona}
                      onChange={(e) => handleSelectPersonaStyle(e.target.value, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-fuchsia-500"
                    >
                      {PERSONA_STYLES.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-amber-400 block font-mono flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      Delivery Tone
                    </span>
                    <select
                      value={currentTone}
                      onChange={(e) => handleSelectDeliveryTone(e.target.value, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {DELIVERY_STYLES.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Engine & Accent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-emerald-400 block font-mono flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      Audio Engine
                    </span>
                    <select
                      value={currentEngine}
                      onChange={(e) => handleSelectAudioEngine(e.target.value, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      {voiceModelsLoading && (
                        <option value={currentEngine}>Loading models…</option>
                      )}
                      {effectiveTTSModels.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-sky-400 block font-mono flex items-center gap-1">
                      <Languages className="w-3 h-3" />
                      Accent
                    </span>
                    <select
                      value={currentAccent}
                      onChange={(e) => handleSelectAccent(e.target.value, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                    >
                      {ACCENT_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Speech Speed & Background Soundtrack */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-purple-400 block font-mono flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      Speech Speed
                    </span>
                    <select
                      value={currentSpeed}
                      onChange={(e) => handleSelectSpeechSpeed(e.target.value, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                    >
                      {SPEAKING_SPEEDS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-bold text-cyan-400 block font-mono flex items-center gap-1">
                      <Music2 className="w-3 h-3" />
                      Background Soundtrack
                    </span>
                    <select
                      value={selectedBackgroundTrack}
                      onChange={(e) => handleSelectBackgroundTrack(e.target.value, pIdx, sIdx)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500"
                    >
                      {BACKGROUND_TRACKS.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Voiceover Textarea */}
                <div className="space-y-1 text-left pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Spoken Narration Script
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateVideoScriptAI(pIdx, sIdx)}
                      disabled={isScriptGenerating}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase flex items-center gap-1 cursor-pointer"
                      title={voiceOver.trim() ? "Re-pass the current script to add spoken-word narration guidelines and auto-cast delivery tone + speech speed" : "Generate a fresh spoken narration script with production notes"}
                    >
                      {isScriptGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      <span>{voiceOver.trim() ? 'Add Speech Guidelines' : 'Auto-Generate Script'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={voiceOver}
                    onChange={(e) => handleUpdateScriptField(pIdx, sIdx, 'voiceOver', e.target.value)}
                    placeholder="Enter spoken voiceover script text..."
                    className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-purple-500 text-white rounded-xl text-xs leading-relaxed outline-none resize-none"
                  />
                  {voiceOver.includes('[') && (
                    <p className="text-[9px] text-slate-500 font-mono leading-snug">
                      [Square-bracket cues] are narration directions — they are removed from the spoken audio.
                    </p>
                  )}
                  {targetObj?.suggestedVoiceCharacter && (
                    <div className="flex items-start gap-2 pt-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
                        <span className="text-purple-400 font-bold uppercase tracking-wide">AI Production Notes</span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                          🎙 {targetObj.suggestedVoiceCharacter}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                          🎭 {DELIVERY_STYLES.find(d => d.id === (targetObj.deliveryTone || currentTone))?.name || currentTone}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                          ⏱ {SPEAKING_SPEEDS.find(s => s.id === (targetObj.speechSpeed || currentSpeed))?.name || currentSpeed}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSynthesizeVoice(pIdx, sIdx, voiceOver, selectedVoice, currentEngine, currentAccent, currentPersona, currentToneDesc, currentSpeed)}
                    disabled={isSpeechSynthesizing || !voiceOver.trim()}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSpeechSynthesizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Voice Audio...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-amber-300" />
                        <span>Synthesize & Save Audio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleCompileProgrammaticVideoFrame(pIdx, sIdx, previewImageModal.url, videoPrompt, currentAnim, (targetObj as any).videoAspectRatio || post.aspectRatio)}
                disabled={isVideoGenerating}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isVideoGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Compile MP4 Video</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleLaunchPost(post, slide);
                    onClose();
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Open in Studio Canvas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStopVoiceOver();
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
