import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  X, 
  Maximize2 
} from 'lucide-react';
import { SocialPostCampaignItem, SavedCampaign } from '../DraftsPlanner';
import { VisualStyle, AspectRatio, CarouselSlide } from '../../types';
import { CampaignImage } from './CampaignImage';
import { ImageDownloadDropdown } from '../ImageDownloadDropdown';

import { generateInfographicImage, generateVoiceOverAndVideoPrompt, generateVoiceOverSpeech } from '../../services/geminiService';
import { compileProgrammaticVideo } from '../../services/programmaticVideoCompiler';
import { saveVoiceoverSession } from '../../services/audioStorageService';
import { loadVideoBlobUrl } from '../../services/videoStorageService';

import { CampaignWorkspaceHeader } from './campaign/CampaignWorkspaceHeader';
import { CampaignRefinementModal } from './campaign/CampaignRefinementModal';
import { SingleAIPostForm } from './campaign/SingleAIPostForm';
import { VideoStudioLightboxModal } from './campaign/VideoStudioLightboxModal';
import { PostCardItem } from './campaign/PostCardItem';

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
  onUpdateCampaignModel?: (newModel: string) => void;
  activeProjectId?: string;
}

export const CampaignWorkspace: React.FC<CampaignWorkspaceProps> = ({
  activeCampaignId,
  savedCampaigns,
  onSelectCampaign,
  onDeleteCampaign,
  activeProjectId = 'proj-1',
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
  onUpdateCampaignModel,
}) => {
  const currentCampaign = savedCampaigns.find(c => c.id === activeCampaignId);
  if (!currentCampaign) return null;

  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [inlineRefineIndex, setInlineRefineIndex] = useState<number | null>(null);
  const [inlineRefineText, setInlineRefineText] = useState('');
  const [activeSlideMap, setActiveSlideMap] = useState<Record<number, number>>({});
  
  // Video and Voiceover Studio State managers
  const [videoRenderingMap, setVideoRenderingMap] = useState<Record<string, boolean>>({});
  const [scriptGeneratingMap, setScriptGeneratingMap] = useState<Record<string, boolean>>({});
  const [synthesizingSpeechMap, setSynthesizingSpeechMap] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // Persistent Settings
  const [selectedVoiceActor, setSelectedVoiceActor] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'>(() => {
    return (localStorage.getItem('social_studio_voice_actor') as any) || 'Puck';
  });

  const [selectedAudioEngine, setSelectedAudioEngine] = useState<string>(() => {
    return localStorage.getItem('social_studio_audio_engine') || 'gemini-3.1-flash-tts-preview';
  });

  const [selectedAccent, setSelectedAccent] = useState<string>(() => {
    return localStorage.getItem('social_studio_voice_accent') || 'US Standard';
  });

  const [selectedPersonaStyle, setSelectedPersonaStyle] = useState<string>(() => {
    return localStorage.getItem('social_studio_voice_persona') || 'adult';
  });

  const [selectedDeliveryTone, setSelectedDeliveryTone] = useState<string>(() => {
    return localStorage.getItem('social_studio_voice_tone') || 'natural';
  });

  const [selectedSpeechSpeed, setSelectedSpeechSpeed] = useState<string>(() => {
    return localStorage.getItem('social_studio_voice_speed') || '1.0';
  });

  const [selectedCameraAnim, setSelectedCameraAnim] = useState<'zoom-in' | 'pan-left' | 'pan-right' | 'pulse' | 'ken-burns' | 'static'>(() => {
    return (localStorage.getItem('social_studio_camera_anim') as any) || 'zoom-in';
  });

  const [selectedBackgroundTrack, setSelectedBackgroundTrack] = useState<'none' | 'lofi' | 'ambient' | 'synthwave' | 'cinematic'>(() => {
    return (localStorage.getItem('social_studio_bg_track') as any) || 'none';
  });

  const [lightboxViewTab, setLightboxViewTab] = useState<'image' | 'video'>('image');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomImageModalUrl, setZoomImageModalUrl] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{
    url: string;
    title: string;
    prompt: string;
    post: SocialPostCampaignItem;
    slide?: any;
    postIdx: number;
    slideIdx: number | null;
  } | null>(null);

  const [generatorState, setGeneratorState] = useState<{
    isOpen: boolean;
    postIndex: number;
    isLoading: boolean;
    statusMessage: string;
  }>({
    isOpen: false,
    postIndex: -1,
    isLoading: false,
    statusMessage: '',
  });

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (playingAudio) {
        playingAudio.pause();
      }
    };
  }, [playingAudio]);

  // Automatically restore compiled video blob URLs from IndexedDB
  React.useEffect(() => {
    if (!campaignPosts || campaignPosts.length === 0) return;

    let isSubscribed = true;
    const restoreVideoBlobs = async () => {
      let changed = false;
      const updatedPosts = JSON.parse(JSON.stringify(campaignPosts));

      for (let pIdx = 0; pIdx < updatedPosts.length; pIdx++) {
        const post = updatedPosts[pIdx];

        if (post.videoId) {
          const blobUrl = await loadVideoBlobUrl(post.videoId);
          if (blobUrl && blobUrl !== post.videoUrl) {
            post.videoUrl = blobUrl;
            post.videoGenerated = true;
            changed = true;
          }
        }

        if (post.slides) {
          for (let sIdx = 0; sIdx < post.slides.length; sIdx++) {
            const slide = post.slides[sIdx];
            if (slide.videoId) {
              const blobUrl = await loadVideoBlobUrl(slide.videoId);
              if (blobUrl && blobUrl !== slide.videoUrl) {
                slide.videoUrl = blobUrl;
                slide.videoGenerated = true;
                changed = true;
              }
            }
          }
        }
      }

      if (changed && isSubscribed) {
        onUpdateCampaignPosts(updatedPosts);
      }
    };

    restoreVideoBlobs();

    return () => {
      isSubscribed = false;
    };
  }, [activeCampaignId, campaignPosts?.length]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const getStudioKey = (postIdx: number, slideIdx: number | null) => {
    return `${postIdx}-${slideIdx !== null ? slideIdx : 'post'}`;
  };

  const handleSelectVoiceActor = (voice: any, postIdx?: number, slideIdx?: number | null) => {
    localStorage.setItem('social_studio_voice_actor', voice);
    setSelectedVoiceActor(voice);
  };

  const handleSelectAudioEngine = (model: string) => {
    localStorage.setItem('social_studio_audio_engine', model);
    setSelectedAudioEngine(model);
  };

  const handleSelectAccent = (accent: string) => {
    localStorage.setItem('social_studio_voice_accent', accent);
    setSelectedAccent(accent);
  };

  const handleSelectPersonaStyle = (persona: string) => {
    localStorage.setItem('social_studio_voice_persona', persona);
    setSelectedPersonaStyle(persona);
  };

  const handleSelectDeliveryTone = (tone: string) => {
    localStorage.setItem('social_studio_voice_tone', tone);
    setSelectedDeliveryTone(tone);
  };

  const handleSelectSpeechSpeed = (speed: string) => {
    localStorage.setItem('social_studio_voice_speed', speed);
    setSelectedSpeechSpeed(speed);
  };

  const handleSelectCameraAnim = (anim: any) => {
    localStorage.setItem('social_studio_camera_anim', anim);
    setSelectedCameraAnim(anim);
  };

  const handleSelectVideoAspectRatio = (aspect: string) => {
    // Helper handler
  };

  const handleSelectBackgroundTrack = (track: any) => {
    localStorage.setItem('social_studio_bg_track', track);
    setSelectedBackgroundTrack(track);
  };

  const handlePlayVoiceOver = (
    postIdx: number,
    slideIdx: number | null,
    text: string,
    voice?: any,
    savedAudioUrl?: string
  ) => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
      return;
    }

    if (savedAudioUrl) {
      const audio = new Audio(savedAudioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
      setPlayingAudio(audio);
    }
  };

  const handleStopVoiceOver = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
  };

  const handleSynthesizeVoice = async (
    postIdx: number, 
    slideIdx: number | null, 
    text: string,
    voice?: any,
    engineModel?: string,
    accentStyle?: string,
    personaStyle?: string,
    deliveryTone?: string,
    speechSpeed?: string
  ) => {
    const key = getStudioKey(postIdx, slideIdx);
    setSynthesizingSpeechMap(prev => ({ ...prev, [key]: true }));

    try {
      const audioUrl = await generateVoiceOverSpeech(
        text, 
        voice || selectedVoiceActor, 
        deliveryTone || selectedDeliveryTone, 
        engineModel || selectedAudioEngine,
        personaStyle || selectedPersonaStyle,
        accentStyle || selectedAccent,
        speechSpeed || selectedSpeechSpeed
      );
      
      const updatedPosts = [...(campaignPosts || [])];
      const post = updatedPosts[postIdx];

      if (slideIdx !== null && post.slides && post.slides[slideIdx]) {
        post.slides[slideIdx] = {
          ...post.slides[slideIdx],
          audioUrl,
        };
      } else {
        updatedPosts[postIdx] = {
          ...post,
          audioUrl,
        };
      }

      onUpdateCampaignPosts(updatedPosts);
      await saveVoiceoverSession({
        id: `aud-${Date.now()}`,
        projectId: activeProjectId,
        name: post.topic,
        scriptText: text,
        voiceName: voice || selectedVoiceActor,
        deliveryStyleId: deliveryTone || selectedDeliveryTone,
        createdAt: Date.now()
      }, audioUrl);
      triggerToast("Voiceover audio synthesized & saved!");
    } catch (err: any) {
      console.error(err);
      triggerToast("Failed to synthesize voiceover audio.");
    } finally {
      setSynthesizingSpeechMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateVideoScriptAI = async (postIdx: number, slideIdx: number | null) => {
    const key = getStudioKey(postIdx, slideIdx);
    setScriptGeneratingMap(prev => ({ ...prev, [key]: true }));

    try {
      const post = (campaignPosts || [])[postIdx];
      const slide = (slideIdx !== null && post.slides) ? post.slides[slideIdx] : null;

      const scriptRes = await generateVoiceOverAndVideoPrompt(
        slide ? `${post.topic} — Slide ${slide.slideNumber}` : post.topic,
        slide ? slide.visualPrompt : post.visualPrompt,
        slide ? slide.contentText || post.caption : post.caption
      );

      const updatedPosts = [...(campaignPosts || [])];
      if (slideIdx !== null && updatedPosts[postIdx]?.slides?.[slideIdx]) {
        updatedPosts[postIdx].slides![slideIdx] = {
          ...updatedPosts[postIdx].slides![slideIdx],
          voiceOver: scriptRes.voiceOver,
          videoPrompt: scriptRes.videoPrompt
        };
      } else if (updatedPosts[postIdx]) {
        updatedPosts[postIdx] = {
          ...updatedPosts[postIdx],
          voiceOver: scriptRes.voiceOver,
          videoPrompt: scriptRes.videoPrompt
        };
      }

      onUpdateCampaignPosts(updatedPosts);
      triggerToast("AI Script & Directions generated!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to generate AI video script.");
    } finally {
      setScriptGeneratingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCompileProgrammaticVideoFrame = async (
    postIdx: number,
    slideIdx: number | null,
    imageSrc?: string,
    promptText?: string,
    animStyle?: any,
    aspectRatio?: string,
    audioUrl?: string
  ) => {
    const key = getStudioKey(postIdx, slideIdx);
    setVideoRenderingMap(prev => ({ ...prev, [key]: true }));

    try {
      const updatedPosts = [...(campaignPosts || [])];
      const post = updatedPosts[postIdx];
      const currentSlide = (slideIdx !== null && post.slides) ? post.slides[slideIdx] : null;

      const videoId = `cam-vid-${Date.now()}`;
      const slideImage = currentSlide
        ? (currentSlide.imageUrl || (slideIdx === 0 ? post.imageUrl : undefined))
        : post.imageUrl;

      const videoBlobUrl = await compileProgrammaticVideo({
        id: videoId,
        title: post.topic || 'Campaign Video',
        imageSrc: imageSrc || slideImage || '',
        audioUrl: audioUrl || (currentSlide ? currentSlide.audioUrl : post.audioUrl),
        animationStyle: animStyle || selectedCameraAnim,
        aspectRatio: aspectRatio || post.aspectRatio || '1:1',
        backgroundTrack: selectedBackgroundTrack,
        videoPrompt: promptText,
        projectId: activeProjectId
      });

      if (slideIdx !== null && post.slides && post.slides[slideIdx]) {
        post.slides[slideIdx] = {
          ...post.slides[slideIdx],
          videoId,
          videoUrl: videoBlobUrl,
          videoGenerated: true,
        };
      } else {
        updatedPosts[postIdx] = {
          ...post,
          videoId,
          videoUrl: videoBlobUrl,
          videoGenerated: true,
        };
      }

      onUpdateCampaignPosts(updatedPosts);
      setLightboxViewTab('video');
      triggerToast("Cinematic Video compiled successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to compile video frame.");
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

  const handleStartVisualGeneration = async (idx: number, post: SocialPostCampaignItem) => {
    const slideIdx = activeSlideMap[idx] || 0;
    setGeneratorState({
      isOpen: true,
      postIndex: idx,
      isLoading: true,
      statusMessage: 'Synthesizing visual graphic...',
    });

    try {
      const activeSlide = (post.slides && post.slides.length > 0) ? post.slides[slideIdx] : null;
      const promptToUse = activeSlide ? activeSlide.visualPrompt : post.visualPrompt;

      const base64Data = await generateInfographicImage(
        promptToUse,
        post.aspectRatio || '1:1'
      );

      const updatedPosts = [...(campaignPosts || [])];
      if (activeSlide && updatedPosts[idx].slides) {
        updatedPosts[idx].slides![slideIdx].imageUrl = base64Data;
      } else {
        updatedPosts[idx].imageUrl = base64Data;
        updatedPosts[idx].generated = true;
      }

      onUpdateCampaignPosts(updatedPosts);
      triggerToast("Visual graphic synthesized successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to generate visual graphic.");
    } finally {
      setGeneratorState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <CampaignWorkspaceHeader
        currentCampaign={currentCampaign}
        onSelectCampaign={onSelectCampaign}
        onDeleteCampaign={onDeleteCampaign}
        isRenaming={isRenaming}
        setIsRenaming={setIsRenaming}
        tempName={tempName}
        setTempName={setTempName}
        handleRenameSave={handleRenameSave}
        getPlatformBadgeColor={getPlatformBadgeColor}
        getPlatformIcon={getPlatformIcon}
        onOpenAddPostModal={onOpenAddPostModal}
        showSingleAIPostForm={showSingleAIPostForm}
        setShowSingleAIPostForm={setShowSingleAIPostForm}
        setShowRefinementModal={setShowRefinementModal}
        isGeneratingCampaign={isGeneratingCampaign}
        campaignStatus={campaignStatus}
        campaignError={campaignError}
        campaignPosts={campaignPosts}
        handleAutoGenerateCampaignPosts={handleAutoGenerateCampaignPosts}
        onUpdateCampaignModel={onUpdateCampaignModel}
      />

      <SingleAIPostForm
        show={showSingleAIPostForm}
        onClose={() => setShowSingleAIPostForm(false)}
        singlePostInstruction={singlePostInstruction}
        setSinglePostInstruction={setSinglePostInstruction}
        isGeneratingSinglePost={isGeneratingSinglePost}
        handleGenerateSinglePostAI={handleGenerateSinglePostAI}
      />

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {(!campaignPosts || campaignPosts.length === 0) ? (
          <div className="border border-dashed border-slate-200 dark:border-purple-500/30 rounded-3xl p-10 text-center bg-white dark:bg-slate-900/40 backdrop-blur-sm min-h-[260px] flex flex-col justify-center items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 font-display text-lg">No Campaign Posts Drafted Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Generate a full campaign sequence with captions, hashtags, and visual blueprints using our AI engine!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleAutoGenerateCampaignPosts}
                disabled={isGeneratingCampaign}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Drafting Sequence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Auto-Generate Full Campaign</span>
                  </>
                )}
              </button>
              <button
                onClick={onOpenAddPostModal}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Add Post</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaignPosts.map((post, idx) => (
              <PostCardItem
                key={idx}
                idx={idx}
                post={post}
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
                handleDeletePost={handleDeletePost}
                activeSlideMap={activeSlideMap}
                setActiveSlideMap={setActiveSlideMap}
                handleCopyToClipboard={handleCopyToClipboard}
                copiedIndex={copiedIndex}
                copiedType={copiedType}
                handleStartVisualGeneration={handleStartVisualGeneration}
                generatorState={generatorState}
                setPreviewImageModal={setPreviewImageModal}
                handleUpdatePostAspect={handleUpdatePostAspect}
                handleUpdatePostStyle={handleUpdatePostStyle}
                handleSavePostAsDraft={handleSavePostAsDraft}
                handleSaveAllSlidesAsDrafts={handleSaveAllSlidesAsDrafts}
                handleLaunchPost={handleLaunchPost}
                savedDraftIndex={null}
                currentCampaign={currentCampaign}
                triggerToast={triggerToast}
                inlineRefineIndex={inlineRefineIndex}
                setInlineRefineIndex={setInlineRefineIndex}
                inlineRefineText={inlineRefineText}
                setInlineRefineText={setInlineRefineText}
                handleRefineSinglePostAI={handleRefineSinglePostAI}
                isRefining={isRefining}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals & Overlay Lightboxes */}
      <CampaignRefinementModal
        isOpen={showRefinementModal}
        onClose={() => setShowRefinementModal(false)}
        refinementText={refinementText}
        setRefinementText={setRefinementText}
        isRefining={isRefining}
        handleRefineCampaign={handleRefineCampaign}
      />

      <VideoStudioLightboxModal
        previewImageModal={previewImageModal}
        onClose={() => setPreviewImageModal(null)}
        lightboxViewTab={lightboxViewTab}
        setLightboxViewTab={setLightboxViewTab}
        playingAudio={playingAudio}
        handlePlayVoiceOver={handlePlayVoiceOver}
        handleStopVoiceOver={handleStopVoiceOver}
        setZoomImageModalUrl={setZoomImageModalUrl}
        handleSelectVoiceActor={handleSelectVoiceActor}
        handleSelectAudioEngine={handleSelectAudioEngine}
        handleSelectAccent={handleSelectAccent}
        handleSelectPersonaStyle={handleSelectPersonaStyle}
        handleSelectDeliveryTone={handleSelectDeliveryTone}
        handleSelectSpeechSpeed={handleSelectSpeechSpeed}
        handleSelectCameraAnim={handleSelectCameraAnim}
        handleSelectVideoAspectRatio={handleSelectVideoAspectRatio}
        handleSelectBackgroundTrack={handleSelectBackgroundTrack}
        handleSynthesizeVoice={handleSynthesizeVoice}
        handleGenerateVideoScriptAI={handleGenerateVideoScriptAI}
        handleCompileProgrammaticVideoFrame={handleCompileProgrammaticVideoFrame}
        handleUpdateScriptField={handleUpdateScriptField}
        synthesizingSpeechMap={synthesizingSpeechMap}
        scriptGeneratingMap={scriptGeneratingMap}
        videoRenderingMap={videoRenderingMap}
        selectedVoiceActor={selectedVoiceActor}
        selectedAudioEngine={selectedAudioEngine}
        selectedAccent={selectedAccent}
        selectedPersonaStyle={selectedPersonaStyle}
        selectedDeliveryTone={selectedDeliveryTone}
        selectedSpeechSpeed={selectedSpeechSpeed}
        selectedCameraAnim={selectedCameraAnim}
        selectedBackgroundTrack={selectedBackgroundTrack}
        getStudioKey={getStudioKey}
        handleLaunchPost={handleLaunchPost}
        triggerToast={triggerToast}
      />

      {/* Full-res Zoom Modal */}
      {zoomImageModalUrl && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white">
            <span className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest">
              High-Resolution Image Inspector
            </span>
            <button
              onClick={() => setZoomImageModalUrl(null)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-full transition-all border border-slate-800 cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full max-w-5xl bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center p-6 shadow-2xl">
            <CampaignImage src={zoomImageModalUrl} alt="Inspection Zoom" className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl" />
          </div>
          <div className="w-full max-w-5xl mt-4 flex items-center justify-between">
            <ImageDownloadDropdown
              imageUrl={zoomImageModalUrl}
              filenameSlug={`campaign-inspection-${Date.now()}`}
              buttonVariant="outline"
              buttonText="Download Full Resolution"
              onDownloadSuccess={(fmt) => triggerToast(`Downloaded .${fmt} format!`)}
            />
            <button
              onClick={() => setZoomImageModalUrl(null)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
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
