import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Layers, Edit, Trash2, Globe, ExternalLink, Settings, Plus, Sparkles, 
  X, Loader2, Wand2, FileSpreadsheet, Copy, Save, Play, MessageSquare, CheckCircle2, Eye, Maximize2, Download,
  Volume2, VolumeX, Video, Film, Mic, Music, Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SocialPostCampaignItem, SavedCampaign } from '../DraftsPlanner';
import { VisualStyle, AspectRatio } from '../../types';
import { AspectRatioIcon, getAspectShortLabel } from './AspectBadge';
import { CampaignImage } from './CampaignImage';

import { generateInfographicImage, generateVoiceOverAndVideoPrompt, generateVeoVideo, generateVoiceOverSpeech } from '../../services/geminiService';
import { DBService } from '../../services/dbService';

interface CampaignWorkspaceProps {
  activeCampaignId: string;
  savedCampaigns: SavedCampaign[];
  onSelectCampaign: (id: string | null) => void;
  onDeleteCampaign: (id: string) => void;
  campaignPosts: SocialPostCampaignItem[] | null;
  isRenaming: boolean;
  setIsRenaming: (r: boolean) => void;
  tempName: string;
  setTempName: (name: string) => void;
  handleRenameSave: () => void;
  onOpenAddPostModal: () => void;
  showSingleAIPostForm: boolean;
  setShowSingleAIPostForm: (show: boolean) => void;
  singlePostInstruction: string;
  setSinglePostInstruction: (inst: string) => void;
  isGeneratingSinglePost: boolean;
  handleGenerateSinglePostAI: (e: React.FormEvent) => void;
  handleDeletePost: (index: number) => void;
  editingPostIndex: number | null;
  setEditingPostIndex: (idx: number | null) => void;
  editTopic: string;
  setEditTopic: (t: string) => void;
  editVisualPrompt: string;
  setEditVisualPrompt: (p: string) => void;
  editCaption: string;
  setEditCaption: (c: string) => void;
  editHashtags: string;
  setEditHashtags: (h: string) => void;
  editStyle?: VisualStyle;
  setEditStyle?: (s: VisualStyle) => void;
  editAspect?: AspectRatio;
  setEditAspect?: (a: AspectRatio) => void;
  startEditingPost: (idx: number, post: SocialPostCampaignItem) => void;
  saveEditedPost: (idx: number) => void;
  handleUpdatePostAspect?: (idx: number, newAspect: AspectRatio) => void;
  handleUpdatePostStyle?: (idx: number, newStyle: VisualStyle) => void;
  copiedIndex: number | null;
  copiedType: 'prompt' | 'caption' | null;
  handleCopyToClipboard: (text: string, index: number, type: 'prompt' | 'caption') => void;
  handleSavePostAsDraft: (post: SocialPostCampaignItem, slide?: CarouselSlide | null, campaignName?: string, campaignId?: string) => void;
  handleSaveAllSlidesAsDrafts?: (post: SocialPostCampaignItem, campaignName?: string, campaignId?: string) => void;
  handleLaunchPost: (post: SocialPostCampaignItem, slide?: CarouselSlide | null) => void;
  refinementText: string;
  setRefinementText: (t: string) => void;
  isRefining: boolean;
  handleRefineCampaign: (e: React.FormEvent) => void;
  isGeneratingCampaign?: boolean;
  campaignStatus?: string;
  campaignError?: string | null;
  handleAutoGenerateCampaignPosts?: () => void;
  handleRefineSinglePostAI?: (postIndex: number, instructionText: string) => Promise<void>;
  getPlatformBadgeColor: (platform: string) => string;
  getPlatformIcon: (platform: string) => React.ReactNode;
  onUpdateCampaignPosts: (posts: SocialPostCampaignItem[]) => void;
}

export const CampaignWorkspace: React.FC<CampaignWorkspaceProps> = ({
  activeCampaignId,
  savedCampaigns,
  onSelectCampaign,
  onDeleteCampaign,
  campaignPosts,
  isRenaming,
  setIsRenaming,
  tempName,
  setTempName,
  handleRenameSave,
  onOpenAddPostModal,
  showSingleAIPostForm,
  setShowSingleAIPostForm,
  singlePostInstruction,
  setSinglePostInstruction,
  isGeneratingSinglePost,
  handleGenerateSinglePostAI,
  handleDeletePost,
  editingPostIndex,
  setEditingPostIndex,
  editTopic,
  setEditTopic,
  editVisualPrompt,
  setEditVisualPrompt,
  editCaption,
  setEditCaption,
  editHashtags,
  setEditHashtags,
  editStyle = 'Default',
  setEditStyle,
  editAspect = '1:1',
  setEditAspect,
  startEditingPost,
  saveEditedPost,
  handleUpdatePostAspect,
  handleUpdatePostStyle,
  copiedIndex,
  copiedType,
  handleCopyToClipboard,
  handleSavePostAsDraft,
  handleSaveAllSlidesAsDrafts,
  handleLaunchPost,
  refinementText,
  setRefinementText,
  isRefining,
  handleRefineCampaign,
  isGeneratingCampaign,
  campaignStatus,
  campaignError,
  handleAutoGenerateCampaignPosts,
  handleRefineSinglePostAI,
  getPlatformBadgeColor,
  getPlatformIcon,
  onUpdateCampaignPosts,
}) => {
  const currentCampaign = savedCampaigns.find(c => c.id === activeCampaignId);
  if (!currentCampaign) return null;

  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [targetRefinePostIndex, setTargetRefinePostIndex] = useState<number | 'all'>('all');
  const [isStyleGuideExpanded, setIsStyleGuideExpanded] = useState(false);
  const [inlineRefineIndex, setInlineRefineIndex] = useState<number | null>(null);
  const [inlineRefineText, setInlineRefineText] = useState('');
  const [activeSlideMap, setActiveSlideMap] = useState<Record<number, number>>({});
  
  // Video and Voiceover Studio State managers
  const [activeSpeech, setActiveSpeech] = useState<{ postIdx: number; slideIdx: number | null } | null>(null);
  const [videoRenderingMap, setVideoRenderingMap] = useState<Record<string, boolean>>({});
  const [scriptGeneratingMap, setScriptGeneratingMap] = useState<Record<string, boolean>>({});
  const [synthesizingSpeechMap, setSynthesizingSpeechMap] = useState<Record<string, boolean>>({});
  const [expandedStudioMap, setExpandedStudioMap] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // Cleanup speech synthesis on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (playingAudio) {
        playingAudio.pause();
      }
    };
  }, [playingAudio]);

  const getStudioKey = (postIdx: number, slideIdx: number | null) => {
    return `${postIdx}-${slideIdx !== null ? slideIdx : 'post'}`;
  };

  const handleSynthesizeVoice = async (postIdx: number, slideIdx: number | null, text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede') => {
    const key = getStudioKey(postIdx, slideIdx);
    setSynthesizingSpeechMap(prev => ({ ...prev, [key]: true }));
    try {
      const audioUrl = await generateVoiceOverSpeech(text, voice);
      const updatedPosts = [...(campaignPosts || [])];
      const post = updatedPosts[postIdx];

      if (slideIdx !== null && post.slides && post.slides[slideIdx]) {
        post.slides[slideIdx] = {
          ...post.slides[slideIdx],
          audioUrl,
          voiceName: voice
        };
      } else {
        updatedPosts[postIdx] = {
          ...post,
          audioUrl,
          voiceName: voice
        };
      }

      onUpdateCampaignPosts(updatedPosts);
      triggerToast(`Successfully synthesized premium AI voice narration track using ${voice}!`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to synthesize AI Voiceover. Please check your credentials or retry.");
    } finally {
      setSynthesizingSpeechMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePlayVoiceOver = (postIdx: number, slideIdx: number | null, text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' = 'Puck', savedAudioUrl?: string) => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }

    if (activeSpeech && activeSpeech.postIdx === postIdx && activeSpeech.slideIdx === slideIdx) {
      setActiveSpeech(null);
      return;
    }

    if (savedAudioUrl) {
      const audio = new Audio(savedAudioUrl);
      setPlayingAudio(audio);
      setActiveSpeech({ postIdx, slideIdx });
      audio.play().catch(err => {
        console.error("Error playing premium audio", err);
        triggerToast("Failed to play synthesized audio track.");
      });
      audio.onended = () => {
        setActiveSpeech(null);
        setPlayingAudio(null);
      };
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      triggerToast("Web Speech Synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Choose high quality English natural / assistant voice matching gender/tone if possible
    let chosenVoice = null;
    if (voice === 'Kore' || voice === 'Aoede') {
      chosenVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha')));
    } else {
      chosenVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex')));
    }
    
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onend = () => {
      setActiveSpeech(null);
    };
    utterance.onerror = () => {
      setActiveSpeech(null);
    };

    window.speechSynthesis.speak(utterance);
    setActiveSpeech({ postIdx, slideIdx });
  };

  const handleStopVoiceOver = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveSpeech(null);
  };

  const handleGenerateScript = async (postIdx: number, slideIdx: number | null, topic: string, content: string, visualPrompt: string) => {
    const key = getStudioKey(postIdx, slideIdx);
    setScriptGeneratingMap(prev => ({ ...prev, [key]: true }));
    try {
      const result = await generateVoiceOverAndVideoPrompt(topic, content, visualPrompt, '16:9');
      const updatedPosts = [...(campaignPosts || [])];
      const post = updatedPosts[postIdx];

      if (slideIdx !== null && post.slides && post.slides[slideIdx]) {
        post.slides[slideIdx] = {
          ...post.slides[slideIdx],
          voiceOver: result.voiceOver,
          videoPrompt: result.videoPrompt
        };
      } else {
        updatedPosts[postIdx] = {
          ...post,
          voiceOver: result.voiceOver,
          videoPrompt: result.videoPrompt
        };
      }

      onUpdateCampaignPosts(updatedPosts);
      triggerToast("Voiceover script & video prompt generated!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to generate scripts.");
    } finally {
      setScriptGeneratingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRenderVideo = async (postIdx: number, slideIdx: number | null, promptText: string, imageSrc?: string) => {
    const key = getStudioKey(postIdx, slideIdx);
    setVideoRenderingMap(prev => ({ ...prev, [key]: true }));
    try {
      // Simulate physical rendering timer (2.5 seconds) for premium feedback
      await new Promise(resolve => setTimeout(resolve, 2500));

      let imageBase64: string | undefined = undefined;
      if (imageSrc && imageSrc.startsWith('db-img:')) {
        const imgKey = imageSrc.replace('db-img:', '');
        const record = await DBService.getDraftImage(imgKey);
        if (record && record.base64) {
          imageBase64 = record.base64;
        }
      } else if (imageSrc && imageSrc.startsWith('data:image/')) {
        imageBase64 = imageSrc;
      }

      const result = await generateVeoVideo(promptText, imageBase64, '16:9');
      const updatedPosts = [...(campaignPosts || [])];
      const post = updatedPosts[postIdx];

      if (slideIdx !== null && post.slides && post.slides[slideIdx]) {
        post.slides[slideIdx] = {
          ...post.slides[slideIdx],
          videoUrl: result.videoUrl || "",
          videoGenerated: true,
          videoGenerating: false
        };
      } else {
        updatedPosts[postIdx] = {
          ...post,
          videoUrl: result.videoUrl || "",
          videoGenerated: true,
          videoGenerating: false
        };
      }

      onUpdateCampaignPosts(updatedPosts);
      triggerToast("AI Cinematic Video rendered successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to render VEO video.");
    } finally {
      setVideoRenderingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUpdateScriptField = (postIdx: number, slideIdx: number | null, field: 'voiceOver' | 'videoPrompt', value: string) => {
    const updatedPosts = [...(campaignPosts || [])];
    const post = updatedPosts[postIdx];
    if (slideIdx !== null && post.slides && post.slides[slideIdx]) {
      post.slides[slideIdx] = {
        ...post.slides[slideIdx],
        [field]: value
      };
    } else {
      updatedPosts[postIdx] = {
        ...post,
        [field]: value
      };
    }
    onUpdateCampaignPosts(updatedPosts);
  };
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedDraftIndex, setSavedDraftIndex] = useState<number | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{
    url: string;
    title: string;
    prompt: string;
    post: SocialPostCampaignItem;
    slide?: any;
    postIdx: number;
    slideIdx: number | null;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const [generatorState, setGeneratorState] = useState<{
    isOpen: boolean;
    postIndex: number;
    post: SocialPostCampaignItem | null;
    isLoading: boolean;
    statusMessage: string;
    generatedImageUrl?: string;
    error?: string;
  }>({
    isOpen: false,
    postIndex: -1,
    post: null,
    isLoading: false,
    statusMessage: '',
  });

  const handleStartVisualGeneration = (idx: number, post: SocialPostCampaignItem) => {
    const slideIdx = activeSlideMap[idx] || 0;
    const activeSlide = (post.slides && post.slides.length > 0) ? post.slides[slideIdx] : null;
    const statusMsg = activeSlide 
      ? `Researching Slide ${activeSlide.slideNumber} (${activeSlide.title}) specifications...`
      : 'Researching campaign specifications...';

    setGeneratorState({
      isOpen: true,
      postIndex: idx,
      post: post,
      isLoading: true,
      statusMessage: statusMsg,
      generatedImageUrl: undefined,
      error: undefined,
    });
    
    triggerCampaignPostGeneration(idx, post, slideIdx);
  };

  const triggerCampaignPostGeneration = async (idx: number, post: SocialPostCampaignItem, slideIdx: number = 0) => {
    try {
      const activeSlide = (post.slides && post.slides.length > 0) ? post.slides[slideIdx] : null;
      const promptToUse = activeSlide ? activeSlide.visualPrompt : post.visualPrompt;
      const topicToUse = activeSlide 
        ? `${post.topic} — Slide ${activeSlide.slideNumber}: ${activeSlide.title}` 
        : post.topic;

      setGeneratorState(prev => ({ 
        ...prev, 
        statusMessage: activeSlide 
          ? `Synthesizing Slide ${activeSlide.slideNumber} layout...` 
          : 'Synthesizing creative layout...' 
      }));
      
      const base64Data = await generateInfographicImage(
        promptToUse,
        post.aspectRatio || '1:1'
      );
      
      const newImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        data: base64Data,
        prompt: topicToUse,
        imagePrompt: promptToUse,
        timestamp: Date.now(),
        level: 'Default' as const,
        style: post.suggestedStyle || 'Default',
        language: 'English' as const,
        resolution: post.aspectRatio || '1:1',
        subOptions: { projectId: currentCampaign.projectId || 'proj-1' },
        facts: [],
        searchResults: []
      };
      
      await DBService.save(newImage);
      
      // Dispatch custom event to notify useAppEngine to refresh image history
      window.dispatchEvent(new CustomEvent('infogenius-refresh-history', { detail: newImage }));
      
      // Update the post itself in the campaign
      const updatedPosts = [...(campaignPosts || [])];
      const currentPost = { ...updatedPosts[idx] };

      if (currentPost.slides && currentPost.slides.length > 0 && currentPost.slides[slideIdx]) {
        const updatedSlides = [...currentPost.slides];
        updatedSlides[slideIdx] = {
          ...updatedSlides[slideIdx],
          imageUrl: `db-img:${newImage.id}`,
          generated: true
        };
        currentPost.slides = updatedSlides;
        currentPost.imageUrl = `db-img:${newImage.id}`;
        currentPost.generated = true;
      } else {
        currentPost.imageUrl = `db-img:${newImage.id}`;
        currentPost.generated = true;
      }

      updatedPosts[idx] = currentPost;
      
      onUpdateCampaignPosts(updatedPosts);
      
      setGeneratorState(prev => ({
        ...prev,
        isLoading: false,
        statusMessage: 'Successfully generated!',
        generatedImageUrl: base64Data,
      }));
    } catch (err: any) {
      console.error(err);
      setGeneratorState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to generate visual. Please check your API key and network connection.',
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-305">
      {/* Back & Title Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-2">
          <button
            onClick={() => onSelectCampaign(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-purple-500" />
            <span>Back to Social Campaigns</span>
          </button>

          <div className="flex items-center gap-3">
            {isRenaming ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleRenameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSave();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-500 text-slate-950 dark:text-white text-base rounded-xl font-display font-bold outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRenameSave}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white font-display flex items-center gap-2">
                <span>{currentCampaign.name}</span>
                <button
                  onClick={() => {
                    setTempName(currentCampaign.name);
                    setIsRenaming(true);
                  }}
                  className="p-1 text-slate-400 hover:text-purple-500 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Rename Campaign"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </h2>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 ${getPlatformBadgeColor(currentCampaign.platform)}`}>
            {getPlatformIcon(currentCampaign.platform)}
            <span>{currentCampaign.platform}</span>
          </span>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this entire campaign project?")) {
                const remaining = savedCampaigns.filter(c => c.id !== activeCampaignId);
                const nextId = remaining.length > 0 ? remaining[0].id : null;
                onDeleteCampaign(activeCampaignId);
                onSelectCampaign(nextId);
              }
            }}
            className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all cursor-pointer"
            title="Delete entire project"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Bento Grid: Active Campaign Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Parameters block */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Brand Website URL</span>
              <a 
                href={currentCampaign.websiteUrl}
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-semibold text-purple-500 dark:text-purple-400 flex items-center gap-1 hover:underline mt-1 break-all"
              >
                <span>{currentCampaign.websiteUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Style Guidelines Target</span>
              {currentCampaign.customRequirements ? (
                <div className="mt-1">
                  <p className={`text-xs font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed ${!isStyleGuideExpanded ? 'line-clamp-2' : ''}`}>
                    {currentCampaign.customRequirements}
                  </p>
                  {currentCampaign.customRequirements.length > 80 && (
                    <button
                      type="button"
                      onClick={() => setIsStyleGuideExpanded(!isStyleGuideExpanded)}
                      className="text-[10px] font-bold text-purple-500 dark:text-purple-400 hover:underline mt-1 cursor-pointer flex items-center gap-1"
                    >
                      <span>{isStyleGuideExpanded ? 'Show Less' : 'Show Full Style Guide'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-400 mt-1 italic">No specific design guides set.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Campaign Main Topic / Objective</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed">
              {currentCampaign.mainTopic}
            </p>
          </div>
        </div>

        {/* Quick Addition Controls Deck */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>Campaign Toolset</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Auto-generate all posts using AI research, refine existing drafts, or add single posts manually.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleAutoGenerateCampaignPosts}
              disabled={isGeneratingCampaign}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingCampaign ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Researching Campaign...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-Generate All Campaign Posts</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onOpenAddPostModal}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Add Post</span>
              </button>

              <button
                onClick={() => setShowSingleAIPostForm(true)}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Single</span>
              </button>

              <button
                onClick={() => setShowRefinementModal(true)}
                className="py-2 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-purple-500/30 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                <span>Refine AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE AI POST FORM SLIDE DOWN */}
      {showSingleAIPostForm && (
        <div className="bg-gradient-to-r from-purple-950/20 to-slate-950/20 border border-purple-500/30 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-display">Generate custom Single Post with AI</h4>
            </div>
            <button 
              onClick={() => {
                setShowSingleAIPostForm(false);
                setSinglePostInstruction('');
              }} 
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleGenerateSinglePostAI} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">What is this specific post about?</label>
              <input 
                type="text"
                required
                disabled={isGeneratingSinglePost}
                placeholder="e.g. A comparison infographic showing how we differ from competitor X, focusing on speed."
                value={singlePostInstruction}
                onChange={(e) => setSinglePostInstruction(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={isGeneratingSinglePost}
                onClick={() => {
                  setShowSingleAIPostForm(false);
                  setSinglePostInstruction('');
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGeneratingSinglePost || !singlePostInstruction.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingSinglePost ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Brainstorming Post...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Add via AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TIMELINE VIEW: CAMPAIGN POSTS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            <span>Campaign Post Timeline</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {campaignPosts ? campaignPosts.length : 0} Total Posts
          </span>
        </div>

        {/* Campaign Generating Status Banner */}
        {isGeneratingCampaign && (
          <div className="p-6 bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-950/60 border border-purple-500/40 rounded-3xl flex items-center gap-4 animate-pulse shadow-xl">
            <Loader2 className="w-7 h-7 text-purple-400 animate-spin shrink-0" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Campaign Strategist Active</h5>
              <p className="text-xs text-purple-200/90 font-medium">{campaignStatus || "Scanning brand website, analyzing target demographics, and drafting posts..."}</p>
            </div>
          </div>
        )}

        {/* Campaign Error Banner */}
        {campaignError && (
          <div className="p-5 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center justify-between gap-4 text-xs text-red-200">
            <div>
              <strong className="block text-red-400 font-bold mb-0.5">Campaign Notice</strong>
              <p>{campaignError}</p>
            </div>
            <button
              onClick={handleAutoGenerateCampaignPosts}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold uppercase rounded-xl shrink-0 cursor-pointer"
            >
              Retry Auto-Generate
            </button>
          </div>
        )}

        {(!campaignPosts || campaignPosts.length === 0) ? (
          <div className="border border-dashed border-slate-200 dark:border-purple-500/30 rounded-3xl p-10 text-center bg-white dark:bg-slate-900/40 backdrop-blur-sm min-h-[260px] flex flex-col justify-center items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 font-display text-lg">No Campaign Posts Drafted Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Use our AI Research engine to automatically scan <strong>{currentCampaign.websiteUrl}</strong>, analyze your style guidelines, and generate a full set of social media posts with captions, hashtags, and visual prompts!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleAutoGenerateCampaignPosts}
                disabled={isGeneratingCampaign}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Researching & Drafting Posts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Auto-Generate Full Campaign Sequence</span>
                  </>
                )}
              </button>
              <button
                onClick={onOpenAddPostModal}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Add Manual Post</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {campaignPosts.map((post, idx) => (
              <div 
                key={idx}
                className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 rounded-2xl p-6 space-y-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all relative group"
              >
                {/* Header metadata */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-display">
                      {post.day || `Post #${idx + 1}`}
                    </span>
                    {post.generated && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1 animate-in fade-in duration-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Generated</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={post.suggestedStyle || 'Default'}
                      onChange={(e) => handleUpdatePostStyle && handleUpdatePostStyle(idx, e.target.value as VisualStyle)}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 outline-none cursor-pointer hover:border-purple-500 transition-colors"
                      title="Change visual style"
                    >
                      {['Default', 'Minimalist', 'Realistic', 'Cartoon', 'Vintage', 'Futuristic', '3D Render', 'Sketch', 'Carousel'].map(s => (
                        <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                      ))}
                    </select>

                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:border-purple-500 transition-colors">
                      <AspectRatioIcon aspect={post.aspectRatio || '1:1'} className="text-purple-500" />
                      <select
                        value={post.aspectRatio || '1:1'}
                        onChange={(e) => handleUpdatePostAspect && handleUpdatePostAspect(idx, e.target.value as AspectRatio)}
                        className="bg-transparent text-[10px] font-bold outline-none cursor-pointer p-0"
                        title="Change aspect ratio"
                      >
                        <option value="1:1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1:1 Square</option>
                        <option value="9:16" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">9:16 Mobile Portrait</option>
                        <option value="16:9" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">16:9 Landscape Banner</option>
                      </select>
                    </div>

                    
                    <button
                      onClick={() => {
                        if (confirm("Remove this post from this campaign project?")) {
                          handleDeletePost(idx);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                      title="Delete this post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* EDIT VIEW OR VISUALIZATION VIEW */}
                {editingPostIndex === idx ? (
                  <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Post Title/Topic</label>
                      <input 
                        type="text"
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visual Style</label>
                        <select
                          value={editStyle}
                          onChange={(e) => setEditStyle && setEditStyle(e.target.value as VisualStyle)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500 cursor-pointer"
                        >
                          {['Default', 'Minimalist', 'Realistic', 'Cartoon', 'Vintage', 'Futuristic', '3D Render', 'Sketch', 'Carousel'].map(s => (
                            <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aspect Ratio</label>
                        <select
                          value={editAspect}
                          onChange={(e) => setEditAspect && setEditAspect(e.target.value as AspectRatio)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="1:1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1:1 (Square)</option>
                          <option value="9:16" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">9:16 (Portrait / Story)</option>
                          <option value="16:9" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">16:9 (Landscape)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visual Generation Prompt</label>
                      <textarea 
                        rows={3}
                        value={editVisualPrompt}
                        onChange={(e) => setEditVisualPrompt(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Social Media Caption</label>
                      <textarea 
                        rows={4}
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hashtags & Trend tags (Comma separated)</label>
                      <input 
                        type="text"
                        value={editHashtags}
                        onChange={(e) => setEditHashtags(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={() => setEditingPostIndex(null)}
                        className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => saveEditedPost(idx)}
                        className="px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-500 cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{post.topic}</h4>
                    </div>

                    {/* Multi-Slide Carousel Deck Viewer if carousel post */}
                    {(post.isCarousel || (post.slides && post.slides.length > 0) || post.suggestedStyle === 'Carousel') && (
                      <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-inner">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 shadow-sm">
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                              <span>Multi-Slide Carousel ({post.slides ? post.slides.length : 1} Slides)</span>
                            </span>
                          </div>

                          {post.slides && post.slides.length > 1 && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveSlideMap(prev => ({ ...prev, [idx]: Math.max(0, (prev[idx] || 0) - 1) }))}
                                disabled={(activeSlideMap[idx] || 0) === 0}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                                title="Previous slide"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[11px] font-bold text-slate-300 font-mono">
                                Slide {(activeSlideMap[idx] || 0) + 1} / {post.slides.length}
                              </span>
                              <button
                                onClick={() => setActiveSlideMap(prev => ({ ...prev, [idx]: Math.min(post.slides!.length - 1, (prev[idx] || 0) + 1) }))}
                                disabled={(activeSlideMap[idx] || 0) >= post.slides.length - 1}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                                title="Next slide"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Slide Content Display */}
                        {post.slides && post.slides.length > 0 ? (
                          (() => {
                            const slideIdx = activeSlideMap[idx] || 0;
                            const slide = post.slides[slideIdx] || post.slides[0];
                            return (
                              <div className="space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="text-xs font-bold text-white font-display">
                                    Slide {slide.slideNumber}: {slide.title}
                                  </h5>
                                  {slide.contentText && (
                                    <span className="text-[10px] text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                      {slide.contentText}
                                    </span>
                                  )}
                                </div>

                                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">
                                    Slide Visual Directive
                                  </span>
                                  <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                                    {slide.visualPrompt}
                                  </p>
                                </div>

                                {/* Slide Indicator Dots */}
                                <div className="flex items-center justify-center gap-1.5 pt-1">
                                  {post.slides.map((s, sIdx) => (
                                    <button
                                      key={sIdx}
                                      onClick={() => setActiveSlideMap(prev => ({ ...prev, [idx]: sIdx }))}
                                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                        sIdx === (activeSlideMap[idx] || 0)
                                          ? 'w-6 bg-purple-500'
                                          : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                                      }`}
                                      title={`Jump to slide ${sIdx + 1}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            This post is configured as a Carousel format. Generate visual or refine with AI to view full multi-slide breakdown.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Visual generation prompt card */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest block">
                          {post.slides && post.slides.length > 0 
                            ? `Slide ${(activeSlideMap[idx] || 0) + 1} Visual Blueprint Prompt` 
                            : 'Visual Blueprint Prompt'}
                        </span>
                        <button
                          onClick={() => {
                            const slideIdx = activeSlideMap[idx] || 0;
                            const currentSlide = (post.slides && post.slides[slideIdx]) ? post.slides[slideIdx] : null;
                            const promptToCopy = currentSlide ? currentSlide.visualPrompt : post.visualPrompt;
                            handleCopyToClipboard(promptToCopy, idx, 'prompt');
                          }}
                          className="text-[10px] text-slate-400 hover:text-purple-500 font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          {copiedIndex === idx && copiedType === 'prompt' ? (
                            <span className="text-emerald-500">Copied!</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic font-mono leading-relaxed">
                        {(post.slides && post.slides[activeSlideMap[idx] || 0]) 
                          ? post.slides[activeSlideMap[idx] || 0].visualPrompt 
                          : post.visualPrompt}
                      </p>
                    </div>

                    {/* Image Thumbnail Display */}
                    {(() => {
                      const slideIdx = activeSlideMap[idx] || 0;
                      const currentSlide = (post.slides && post.slides[slideIdx]) ? post.slides[slideIdx] : null;
                      const imgUrl = currentSlide?.imageUrl || (slideIdx === 0 ? post.imageUrl : undefined) || post.imageUrl;
                      if (!imgUrl) return null;

                      return (
                        <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 aspect-video max-w-sm mt-2 shadow-md group/thumb animate-in fade-in duration-300">
                          <CampaignImage src={imgUrl} alt={post.topic} className="w-full h-full object-cover" />
                          
                          {/* Badge indicator */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 z-10">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{currentSlide ? `Slide ${currentSlide.slideNumber} Visual` : 'Generated Visual'}</span>
                          </div>

                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2 z-20">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImageModal({
                                  url: imgUrl,
                                  title: currentSlide ? `Slide ${currentSlide.slideNumber}: ${currentSlide.title}` : post.topic,
                                  prompt: currentSlide ? currentSlide.visualPrompt : post.visualPrompt,
                                  post,
                                  slide: currentSlide,
                                  postIdx: idx,
                                  slideIdx: currentSlide ? slideIdx : null
                                });
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleLaunchPost(post, currentSlide);
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-950 text-[11px] font-bold rounded-xl shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Canvas</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Caption content */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">Suggested Caption</span>
                        <button
                          onClick={() => handleCopyToClipboard(post.caption, idx, 'caption')}
                          className="text-[10px] text-slate-400 hover:text-blue-500 font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          {copiedIndex === idx && copiedType === 'caption' ? (
                            <span className="text-emerald-500">Copied!</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{post.caption}</p>
                    </div>

                    {/* Hashtags list */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.hashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold rounded-md">
                            #{tag.replace(/^#/, '')}
                          </span>
                        ))}
                      </div>
                    )}                    {/* Video & Voiceover Studio */}
                    {(() => {
                      const isCarousel = post.isCarousel || (post.slides && post.slides.length > 0) || post.suggestedStyle === 'Carousel';
                      const slideIdx = activeSlideMap[idx] || 0;
                      const currentSlide = (isCarousel && post.slides && post.slides[slideIdx]) ? post.slides[slideIdx] : null;
                      const targetObj = currentSlide ? currentSlide : post;

                      const voiceOver = targetObj.voiceOver || '';
                      const videoPrompt = targetObj.videoPrompt || '';
                      const isVideoGenerating = videoRenderingMap[getStudioKey(idx, currentSlide ? slideIdx : null)] || false;
                      const isVideoGenerated = targetObj.videoGenerated || false;
                      const isScriptGenerating = scriptGeneratingMap[getStudioKey(idx, currentSlide ? slideIdx : null)] || false;
                      const isSpeechSynthesizing = synthesizingSpeechMap[getStudioKey(idx, currentSlide ? slideIdx : null)] || false;
                      const savedAudioUrl = targetObj.audioUrl || '';
                      const selectedVoice = targetObj.voiceName || 'Puck';
                      
                      const key = getStudioKey(idx, currentSlide ? slideIdx : null);
                      const isExpanded = expandedStudioMap[key] !== undefined ? expandedStudioMap[key] : (!!voiceOver || !!videoPrompt);
                      const isPlaying = activeSpeech && activeSpeech.postIdx === idx && activeSpeech.slideIdx === (currentSlide ? slideIdx : null);

                      const slideLabel = currentSlide ? `Slide ${currentSlide.slideNumber}` : 'Post';

                      return (
                        <div className="border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-4 space-y-4 shadow-sm relative overflow-hidden transition-all mt-3">
                          {/* Design accent */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 to-transparent pointer-events-none rounded-full"></div>
                          
                          {/* Header with expander toggle */}
                          <div 
                            onClick={() => setExpandedStudioMap(prev => ({ ...prev, [key]: !isExpanded }))}
                            className="flex items-center justify-between cursor-pointer group select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
                                <Video className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-white font-display">
                                    Video & Voiceover Studio
                                  </h5>
                                  <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-[8px] font-bold uppercase rounded text-purple-600 dark:text-purple-400 font-mono">
                                    {slideLabel} VEO Ready
                                  </span>
                                  {savedAudioUrl && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold uppercase rounded text-emerald-500 dark:text-emerald-400 font-mono flex items-center gap-0.5">
                                      <span>★</span> <span>AI Voice</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 leading-none mt-0.5">
                                  {voiceOver ? `Voiceover script (Voice: ${selectedVoice}) and cinematic directions loaded` : "Draft spoken narration script and cinematic motion paths"}
                                </p>
                              </div>
                            </div>
                            
                            <button 
                              type="button" 
                              className="p-1 rounded-lg text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                            >
                              {isExpanded ? <ChevronLeft className="w-3.5 h-3.5 rotate-90 transition-transform duration-200" /> : <ChevronRight className="w-3.5 h-3.5 rotate-90 transition-transform duration-200" />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                              {/* Voice selection block */}
                              <div className="p-3 bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">AI Voice Actor character</span>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={selectedVoice}
                                      onChange={(e) => {
                                        const val = e.target.value as any;
                                        const updatedPosts = [...(campaignPosts || [])];
                                        if (currentSlide) {
                                          updatedPosts[idx].slides![slideIdx].voiceName = val;
                                        } else {
                                          updatedPosts[idx].voiceName = val;
                                        }
                                        onUpdateCampaignPosts(updatedPosts);
                                      }}
                                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-[10px] font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                                    >
                                      <option value="Puck">🎤 Puck (Energetic Male)</option>
                                      <option value="Charon">🎤 Charon (Deep/Authoritative Male)</option>
                                      <option value="Kore">🎤 Kore (Inspiring Female)</option>
                                      <option value="Fenrir">🎤 Fenrir (Modern Sleek Male)</option>
                                      <option value="Aoede">🎤 Aoede (Empathetic Female)</option>
                                    </select>
                                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Engine: Gemini-2.5-flash</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {voiceOver && (
                                    <button
                                      type="button"
                                      disabled={isSpeechSynthesizing}
                                      onClick={() => handleSynthesizeVoice(idx, currentSlide ? slideIdx : null, voiceOver, selectedVoice)}
                                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 border ${
                                        isSpeechSynthesizing 
                                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                                          : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-sm'
                                      }`}
                                    >
                                      {isSpeechSynthesizing ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin text-purple-300" />
                                          <span>Synthesizing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3 h-3 text-purple-200" />
                                          <span>{savedAudioUrl ? 'Re-Synthesize Speech' : 'Synthesize AI Speech'}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Input editors */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Voiceover Script box */}
                                <div className="space-y-1.5 text-left">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono flex items-center gap-1">
                                      <Mic className="w-3 h-3 text-purple-500" />
                                      <span>Voiceover Script</span>
                                    </label>
                                    {voiceOver && (
                                      <button
                                        type="button"
                                        onClick={() => handlePlayVoiceOver(idx, currentSlide ? slideIdx : null, voiceOver, selectedVoice, savedAudioUrl)}
                                        className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer border ${
                                          isPlaying 
                                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/20 animate-pulse' 
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                        }`}
                                      >
                                        {isPlaying ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                                        <span>{isPlaying ? 'Mute' : savedAudioUrl ? 'Play AI Voice' : 'Play Narration'}</span>
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    value={voiceOver}
                                    onChange={(e) => handleUpdateScriptField(idx, currentSlide ? slideIdx : null, 'voiceOver', e.target.value)}
                                    placeholder="e.g. In today's fast-paced world, speed is everything. Let's see how our core automation stack gives you 10x leverage..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
                                  />
                                </div>

                                {/* VEO Video Prompt box */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono flex items-center gap-1">
                                    <Film className="w-3 h-3 text-purple-500" />
                                    <span>VEO Camera Motion Prompt</span>
                                  </label>
                                  <textarea
                                    value={videoPrompt}
                                    onChange={(e) => handleUpdateScriptField(idx, currentSlide ? slideIdx : null, 'videoPrompt', e.target.value)}
                                    placeholder="e.g. Macro slide, slow dolly camera zoom-in. Bright neon circuit lines pulsing in background. Extremely realistic, volumetric cinematic lighting..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
                                  />
                                </div>
                              </div>

                              {/* Animated Video Render Preview Frame */}
                              {isVideoGenerated && (
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 shadow-md group/video animate-in zoom-in-95 duration-500 text-left">
                                  {/* Cinematic Zoom & Pan Canvas Container */}
                                  <div className="absolute inset-0 overflow-hidden">
                                    <div className={`w-full h-full origin-center transition-all duration-[12000ms] ${
                                      isPlaying 
                                        ? 'scale-115 translate-x-2 translate-y-1 ease-out' 
                                        : 'scale-105 duration-1000'
                                    }`}>
                                      {(() => {
                                        const imgUrl = currentSlide?.imageUrl || (slideIdx === 0 ? post.imageUrl : undefined) || post.imageUrl;
                                        return imgUrl ? (
                                          <CampaignImage src={imgUrl} alt="Cinematic Video Slide" className="w-full h-full object-cover select-none filter brightness-90 saturate-110" />
                                        ) : (
                                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
                                            Generating Visual Framework...
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Top-left Status Overlay */}
                                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                                    <span className="px-2 py-1 bg-slate-950/80 backdrop-blur-md text-[9px] font-bold text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-md">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                      <span>AI VEO PREVIEW ACTIVE</span>
                                    </span>
                                    
                                    {isPlaying && (
                                      <span className="px-2 py-1 bg-purple-500/80 backdrop-blur-md text-[9px] font-bold text-white rounded-lg border border-purple-500/30 flex items-center gap-1 shadow-md">
                                        <Music className="w-2.5 h-2.5 text-purple-200 animate-spin" />
                                        <span>NARRATION AUDIO</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Subtitle / Prompt Overlay at bottom */}
                                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col justify-end gap-1.5 pointer-events-none select-none">
                                    {isPlaying ? (
                                      <div className="animate-in fade-in duration-300">
                                        <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                                          Speaking Voiceover Narration ({selectedVoice})
                                        </span>
                                        <p className="text-xs font-semibold text-white drop-shadow-md leading-relaxed">
                                          {voiceOver}
                                        </p>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                          VEO Action Prompt
                                        </span>
                                        <p className="text-[11px] text-slate-200 italic line-clamp-2">
                                          "{videoPrompt}"
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Controls Drawer Over Hover */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 flex items-center justify-center gap-3 transition-opacity z-20">
                                    <button
                                      type="button"
                                      onClick={() => handlePlayVoiceOver(idx, currentSlide ? slideIdx : null, voiceOver, selectedVoice, savedAudioUrl)}
                                      className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                                      title={isPlaying ? "Mute Speech" : "Play Spoken Voiceover"}
                                    >
                                      {isPlaying ? <VolumeX className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleRenderVideo(idx, currentSlide ? slideIdx : null, videoPrompt, currentSlide?.imageUrl || post.imageUrl);
                                      }}
                                      className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/50 text-white text-[10px] font-bold uppercase rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Wand2 className="w-3 h-3" />
                                      <span>Regenerate Video</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action deck */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                                <button
                                  type="button"
                                  disabled={isScriptGenerating}
                                  onClick={() => handleGenerateScript(
                                    idx, 
                                    currentSlide ? slideIdx : null, 
                                    post.topic, 
                                    currentSlide ? (currentSlide.title + " " + (currentSlide.contentText || '')) : post.caption,
                                    currentSlide ? currentSlide.visualPrompt : post.visualPrompt
                                  )}
                                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isScriptGenerating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                                      <span>Writing Scripts...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="w-3 h-3 text-purple-500" />
                                      <span>{voiceOver ? 'Regenerate Scripts' : 'AI Generate Scripts'}</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={isVideoGenerating || !videoPrompt}
                                  onClick={() => handleRenderVideo(idx, currentSlide ? slideIdx : null, videoPrompt, currentSlide?.imageUrl || post.imageUrl)}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                                  title={!videoPrompt ? "Please generate or input a camera prompt first" : "Compile high-fidelity VEO video preview"}
                                >
                                  {isVideoGenerating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Compiling Video...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Video className="w-3 h-3 text-amber-300" />
                                      <span>{isVideoGenerated ? 'Re-Render VEO Video' : 'Render VEO Video'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Inline AI Refine Box for specific post */}
                    {inlineRefineIndex === idx && (
                      <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Refine Post #{idx + 1} with AI</span>
                          </span>
                          <button
                            onClick={() => setInlineRefineIndex(null)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Make caption shorter, more energetic, and add 3 hashtags about AI growth."
                          value={inlineRefineText}
                          onChange={(e) => setInlineRefineText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && inlineRefineText.trim() && handleRefineSinglePostAI) {
                              e.preventDefault();
                              handleRefineSinglePostAI(idx, inlineRefineText);
                              setInlineRefineIndex(null);
                              setInlineRefineText('');
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs outline-none focus:border-purple-500"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInlineRefineIndex(null)}
                            className="px-3 py-1 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!inlineRefineText.trim() || isRefining}
                            onClick={async () => {
                              if (handleRefineSinglePostAI && inlineRefineText.trim()) {
                                await handleRefineSinglePostAI(idx, inlineRefineText);
                                setInlineRefineIndex(null);
                                setInlineRefineText('');
                              }
                            }}
                            className="px-3.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            <span>Apply AI Refinement</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Control deck for specific post */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEditingPost(idx, post)}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Modify Draft</span>
                        </button>

                        <button
                          onClick={() => {
                            if (inlineRefineIndex === idx) {
                              setInlineRefineIndex(null);
                            } else {
                              setInlineRefineIndex(idx);
                              setInlineRefineText('');
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Refine with AI</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          type="button"
                          onClick={() => {
                            const slideIdx = activeSlideMap[idx] || 0;
                            const currentSlide = (post.slides && post.slides[slideIdx]) ? post.slides[slideIdx] : null;
                            handleSavePostAsDraft(post, currentSlide, currentCampaign.name, currentCampaign.id);
                            setSavedDraftIndex(idx);
                            triggerToast(currentSlide ? `Saved Slide ${currentSlide.slideNumber} to Drafts Vault!` : 'Saved draft blueprint to Vault!');
                            setTimeout(() => setSavedDraftIndex(null), 2500);
                          }}
                          className={`px-3 py-1.5 border text-[11px] font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                            savedDraftIndex === idx 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-105 shadow-md' 
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                          title="Save this specific slide/visual prompt as a persistent draft blueprint"
                        >
                          {savedDraftIndex === idx ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                              <span className="text-emerald-400">Saved to Vault!</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                              <span>Save Draft</span>
                            </>
                          )}
                        </motion.button>

                        {post.slides && post.slides.length > 1 && handleSaveAllSlidesAsDrafts && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            type="button"
                            onClick={() => {
                              handleSaveAllSlidesAsDrafts(post, currentCampaign.name, currentCampaign.id);
                              setSavedDraftIndex(idx);
                              triggerToast(`Saved all ${post.slides.length} slides to Drafts Vault!`);
                              setTimeout(() => setSavedDraftIndex(null), 2500);
                            }}
                            className="px-3 py-1.5 border border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[11px] font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Save all carousel slides as individual drafts"
                          >
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            <span>Save All Slides ({post.slides.length})</span>
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)" }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          onClick={() => handleStartVisualGeneration(idx, post)}
                          className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 cursor-pointer"
                          title="Generate graphic visual directly in a popup modal"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>Generate Visual</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REFINEMENT POPUP MODAL */}
      {showRefinementModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-300 text-left">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                  <Wand2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Campaign Assistant</span>
                  <h3 className="text-base font-bold text-white font-display">Refine Campaign with AI</h3>
                </div>
              </div>
              {!isRefining && (
                <button
                  onClick={() => setShowRefinementModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed relative z-10">
              Prompt Gemini to rewrite captions, introduce new style themes, or pivot topics across this entire campaign project simultaneously.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (targetRefinePostIndex === 'all') {
                  await handleRefineCampaign(e);
                } else if (typeof targetRefinePostIndex === 'number' && handleRefineSinglePostAI) {
                  await handleRefineSinglePostAI(targetRefinePostIndex, refinementText);
                  setRefinementText('');
                }
                setShowRefinementModal(false);
              }}
              className="space-y-4 relative z-10"
            >
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">
                  Refinement Target Scope
                </label>
                <select
                  value={targetRefinePostIndex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetRefinePostIndex(val === 'all' ? 'all' : parseInt(val, 10));
                  }}
                  disabled={isRefining}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs outline-none focus:border-purple-500 cursor-pointer mb-3"
                >
                  <option value="all">Entire Campaign Sequence ({campaignPosts ? campaignPosts.length : 0} Posts)</option>
                  {campaignPosts && campaignPosts.map((post, idx) => (
                    <option key={idx} value={idx}>
                      Post #{idx + 1}: {post.topic ? (post.topic.length > 45 ? post.topic.slice(0, 45) + '...' : post.topic) : `Post ${idx + 1}`}
                    </option>
                  ))}
                </select>

                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">
                  Refinement Prompt Directive
                </label>
                <textarea
                  rows={4}
                  required
                  disabled={isRefining}
                  placeholder={
                    targetRefinePostIndex === 'all'
                      ? "e.g. Focus on cybersecurity developers, add strong calls-to-action to register, use a futuristic aesthetic."
                      : `e.g. Rewrite Post #${typeof targetRefinePostIndex === 'number' ? targetRefinePostIndex + 1 : 1} to emphasize key benefits and add high-converting hashtags.`
                  }
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 text-white border border-slate-800 rounded-2xl text-xs outline-none focus:border-purple-500 transition-all leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
                {!isRefining && (
                  <button
                    type="button"
                    onClick={() => setShowRefinementModal(false)}
                    className="px-4 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isRefining || !refinementText.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Applying Refinements...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Refine Campaign</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP GENERATION MODAL */}
      {generatorState.isOpen && generatorState.post && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-300 text-left">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em]">In-situ Graphic Synth</span>
                <h3 className="text-lg font-bold text-white font-display">Generating Campaign Visual</h3>
              </div>
              {!generatorState.isLoading && (
                <button
                  onClick={() => setGeneratorState(prev => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Campaign Topic / Specs */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl relative z-10 space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Topic & Visual Directive</span>
              <h4 className="text-sm font-bold text-white leading-relaxed">{generatorState.post.topic}</h4>
              <p className="text-xs text-slate-400 italic font-mono leading-relaxed">{generatorState.post.visualPrompt}</p>
            </div>

            {/* Content Area (Loader or Preview) */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-6 text-center shadow-inner">
              {generatorState.isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin relative z-10" />
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <p className="text-sm font-semibold text-white">{generatorState.statusMessage}</p>
                    <p className="text-xs text-slate-500 font-mono">This may take a moment. Do not close this modal...</p>
                  </div>
                </div>
              ) : generatorState.error ? (
                <div className="space-y-4 max-w-md p-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Generation Interrupted</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{generatorState.error}</p>
                  </div>
                  <button
                    onClick={() => handleStartVisualGeneration(generatorState.postIndex, generatorState.post!)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Retry Generation
                  </button>
                </div>
              ) : generatorState.generatedImageUrl ? (
                <div className="absolute inset-0 group">
                  <CampaignImage src={generatorState.generatedImageUrl} alt="Generated visual" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => {
                        const slideIdx = activeSlideMap[generatorState.postIndex] || 0;
                        const currentSlide = (generatorState.post?.slides && generatorState.post.slides[slideIdx]) ? generatorState.post.slides[slideIdx] : null;
                        setPreviewImageModal({
                          url: generatorState.generatedImageUrl!,
                          title: currentSlide ? `Slide ${currentSlide.slideNumber}: ${currentSlide.title}` : (generatorState.post?.topic || 'Generated Visual'),
                          prompt: currentSlide ? currentSlide.visualPrompt : (generatorState.post?.visualPrompt || ''),
                          post: generatorState.post!,
                          slide: currentSlide,
                          postIdx: generatorState.postIndex,
                          slideIdx: currentSlide ? slideIdx : null
                        });
                        setGeneratorState(prev => ({ ...prev, isOpen: false }));
                        triggerToast('Graphic successfully generated and attached to campaign post!');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview in Campaign</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleLaunchPost(generatorState.post!);
                        setGeneratorState(prev => ({ ...prev, isOpen: false }));
                      }}
                      className="px-4 py-2 bg-white text-slate-950 text-xs font-bold uppercase rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Canvas</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Actions Footer */}
            {!generatorState.isLoading && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 relative z-10">
                <span className="text-[10px] font-mono text-slate-500">
                  Resolution: {generatorState.post.aspectRatio || '1:1'} | Style: {generatorState.post.suggestedStyle || 'Default'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {generatorState.generatedImageUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const slideIdx = activeSlideMap[generatorState.postIndex] || 0;
                          const currentSlide = (generatorState.post?.slides && generatorState.post.slides[slideIdx]) ? generatorState.post.slides[slideIdx] : null;
                          setPreviewImageModal({
                            url: generatorState.generatedImageUrl!,
                            title: currentSlide ? `Slide ${currentSlide.slideNumber}: ${currentSlide.title}` : (generatorState.post?.topic || 'Generated Visual'),
                            prompt: currentSlide ? currentSlide.visualPrompt : (generatorState.post?.visualPrompt || ''),
                            post: generatorState.post!,
                            slide: currentSlide,
                            postIdx: generatorState.postIndex,
                            slideIdx: currentSlide ? slideIdx : null
                          });
                          setGeneratorState(prev => ({ ...prev, isOpen: false }));
                          triggerToast('Visual saved & attached to post!');
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Keep & View in Campaign</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleLaunchPost(generatorState.post!);
                          setGeneratorState(prev => ({ ...prev, isOpen: false }));
                        }}
                        className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Open in Canvas</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorState(prev => ({ ...prev, isOpen: false }));
                      if (generatorState.generatedImageUrl) {
                        triggerToast('Visual attached to post!');
                      }
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL-IMAGE IMMERSIVE DUAL-PANE LIGHTBOX MODAL WITHIN CAMPAIGN WORKSPACE */}
      {previewImageModal && (() => {
        const pIdx = previewImageModal.postIdx;
        const sIdx = previewImageModal.slideIdx;
        const post = campaignPosts?.[pIdx] || previewImageModal.post;
        const currentSlide = (sIdx !== null && post.slides && post.slides[sIdx]) ? post.slides[sIdx] : null;
        const targetObj = currentSlide ? currentSlide : post;

        const voiceOver = targetObj.voiceOver || '';
        const videoPrompt = targetObj.videoPrompt || '';
        const isVideoGenerating = videoRenderingMap[getStudioKey(pIdx, sIdx)] || false;
        const isVideoGenerated = targetObj.videoGenerated || false;
        const isScriptGenerating = scriptGeneratingMap[getStudioKey(pIdx, sIdx)] || false;
        const isSpeechSynthesizing = synthesizingSpeechMap[getStudioKey(pIdx, sIdx)] || false;
        const savedAudioUrl = targetObj.audioUrl || '';
        const selectedVoice = targetObj.voiceName || 'Puck';

        const isPlaying = activeSpeech && activeSpeech.postIdx === pIdx && activeSpeech.slideIdx === sIdx;

        return (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl space-y-4 relative overflow-hidden text-left flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                    AI Immersive Audio-Visual Lightbox Studio
                  </span>
                  <h3 className="text-base font-bold text-white font-display line-clamp-1">
                    {previewImageModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleStopVoiceOver();
                    setPreviewImageModal(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Split Content Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                
                {/* Left Side: Dynamic Cinematic Canvas Screen */}
                <div className="flex flex-col space-y-3">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 shadow-md group/video text-left">
                    {/* Cinematic Zoom & Pan Canvas Container */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className={`w-full h-full origin-center transition-all duration-[12000ms] ${
                        isPlaying 
                          ? 'scale-115 translate-x-2 translate-y-1 ease-out' 
                          : 'scale-105 duration-1000'
                      }`}>
                        <CampaignImage src={previewImageModal.url} alt="Cinematic Preview" className="w-full h-full object-cover filter brightness-90 saturate-110" />
                      </div>
                    </div>

                    {/* Top-left Status Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                      <span className="px-2 py-1 bg-slate-950/80 backdrop-blur-md text-[9px] font-bold text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>{isVideoGenerated ? 'AI VEO VIDEO RENDER ACTIVE' : 'PREVIEW IMAGE ENGAGED'}</span>
                      </span>
                      
                      {isPlaying && (
                        <span className="px-2 py-1 bg-purple-500/80 backdrop-blur-md text-[9px] font-bold text-white rounded-lg border border-purple-500/30 flex items-center gap-1 shadow-md">
                          <Music className="w-2.5 h-2.5 text-purple-200 animate-spin" />
                          <span>SPEECH AUDIO ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Subtitle / Prompt Overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col justify-end gap-1.5 pointer-events-none select-none">
                      {isPlaying ? (
                        <div className="animate-in fade-in duration-300">
                          <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                            Speaking Voiceover Narration ({selectedVoice})
                          </span>
                          <p className="text-xs font-semibold text-white drop-shadow-md leading-relaxed">
                            {voiceOver}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            Scenic prompt directions
                          </span>
                          <p className="text-[11px] text-slate-200 italic line-clamp-2">
                            "{videoPrompt || "Generate scripts below to build cinematic voiceover narrations..."}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Hover controls play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 flex items-center justify-center gap-3 transition-opacity z-20">
                      <button
                        type="button"
                        onClick={() => handlePlayVoiceOver(pIdx, sIdx, voiceOver, selectedVoice, savedAudioUrl)}
                        className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                        title={isPlaying ? "Mute Speech" : "Play Spoken Voiceover"}
                      >
                        {isPlaying ? <VolumeX className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick Metadata Stats */}
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Format: {post.aspectRatio || '1:1'} ({getAspectShortLabel(post.aspectRatio)})</span>
                    <span>Duration: {savedAudioUrl ? '8s (Premium Audio)' : '5s (Cinematic Pan)'}</span>
                  </div>
                </div>

                {/* Right Side: Studio Control Panel */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    
                    {/* Voice Actor & Character Select Block */}
                    <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-purple-400" />
                          <span>Premium AI Voice Settings</span>
                        </label>
                        {savedAudioUrl && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold uppercase rounded text-emerald-400">
                            ✨ AI Audio Loaded
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] text-slate-500 block">Voice Actor Character</span>
                          <select
                            value={selectedVoice}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              const updatedPosts = [...(campaignPosts || [])];
                              if (sIdx !== null) {
                                updatedPosts[pIdx].slides![sIdx].voiceName = val;
                              } else {
                                updatedPosts[pIdx].voiceName = val;
                              }
                              onUpdateCampaignPosts(updatedPosts);
                            }}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="Puck">🎤 Puck (Energetic Male)</option>
                            <option value="Charon">🎤 Charon (Deep/Authoritative Male)</option>
                            <option value="Kore">🎤 Kore (Inspiring Female)</option>
                            <option value="Fenrir">🎤 Fenrir (Modern Sleek Male)</option>
                            <option value="Aoede">🎤 Aoede (Empathetic Female)</option>
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <span className="text-[9px] text-slate-500 block">AI Synthesis Engine</span>
                          <div className="px-3 py-2 bg-purple-950/20 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-bold font-mono">
                            Gemini-2.5-flash Audio
                          </div>
                        </div>
                      </div>

                      {/* Narration script block */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Spoken Script Draft</span>
                          <div className="flex items-center gap-2">
                            {voiceOver && (
                              <button
                                type="button"
                                disabled={isSpeechSynthesizing}
                                onClick={() => handleSynthesizeVoice(pIdx, sIdx, voiceOver, selectedVoice)}
                                className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-all cursor-pointer flex items-center gap-1 border ${
                                  isSpeechSynthesizing 
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                    : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent'
                                }`}
                              >
                                {isSpeechSynthesizing ? (
                                  <>
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    <span>Synthesizing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>{savedAudioUrl ? 'Re-Synthesize Speech' : 'Synthesize AI Speech'}</span>
                                  </>
                                )}
                              </button>
                            )}

                            {voiceOver && (
                              <button
                                type="button"
                                onClick={() => handlePlayVoiceOver(pIdx, sIdx, voiceOver, selectedVoice, savedAudioUrl)}
                                className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded transition-colors border cursor-pointer ${
                                  isPlaying 
                                    ? 'bg-rose-500/15 text-rose-500 border-rose-500/20 animate-pulse' 
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}
                              >
                                {isPlaying ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                                <span>{isPlaying ? 'Mute' : 'Play Audio'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={voiceOver}
                          onChange={(e) => handleUpdateScriptField(pIdx, sIdx, 'voiceOver', e.target.value)}
                          placeholder="e.g. In today's fast-paced world, automation is your unfair advantage..."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* VEO Camera Motion Directions Prompt */}
                    <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-purple-400" />
                        <span>Camera Motion Direction Path</span>
                      </label>
                      <textarea
                        value={videoPrompt}
                        onChange={(e) => handleUpdateScriptField(pIdx, sIdx, 'videoPrompt', e.target.value)}
                        placeholder="e.g. Cinematic slow dolly zoom-in, soft glowing ambient lines pulsing, smooth professional motion..."
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Actions deck inside Lightbox */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 shrink-0">
                    <button
                      type="button"
                      disabled={isScriptGenerating}
                      onClick={() => handleGenerateScript(
                        pIdx, 
                        sIdx, 
                        post.topic, 
                        currentSlide ? (currentSlide.title + " " + (currentSlide.contentText || '')) : post.caption,
                        currentSlide ? currentSlide.visualPrompt : post.visualPrompt
                      )}
                      className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isScriptGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                          <span>Writing Script...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Generate Scripts Blueprint</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isVideoGenerating || !videoPrompt}
                      onClick={() => handleRenderVideo(pIdx, sIdx, videoPrompt, currentSlide?.imageUrl || post.imageUrl)}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {isVideoGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Compiling Video...</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>{isVideoGenerated ? 'Re-Render Video Frame' : 'Compile 8s Cinematic Video'}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <a
                  href={previewImageModal.url}
                  download="campaign-visual.png"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Graphic</span>
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleLaunchPost(post, currentSlide);
                      setPreviewImageModal(null);
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
                      setPreviewImageModal(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ANIMATED FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-slate-900 border border-emerald-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xs font-bold font-display">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
