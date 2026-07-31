import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Layers, 
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  Play, 
  Sparkles, 
  Loader2, 
  Film, 
  Video, 
  Image as ImageIcon, 
  Wand2,
  Mic
} from 'lucide-react';
import { SocialPostCampaignItem } from '@/components/DraftsPlanner';
import { VisualStyle, AspectRatio, CarouselSlide } from '@/types';
import { AspectRatioIcon, getAspectShortLabel } from '@/components/drafts/AspectBadge';
import { CampaignImage } from '@/components/drafts/CampaignImage';
import { ImageDownloadDropdown } from '@/components/ImageDownloadDropdown';

interface PostCardItemProps {
  idx: number;
  post: SocialPostCampaignItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  editingPostIndex: number | null;
  setEditingPostIndex: (idx: number | null) => void;
  editTopic: string;
  setEditTopic: (val: string) => void;
  editVisualPrompt: string;
  setEditVisualPrompt: (val: string) => void;
  editCaption: string;
  setEditCaption: (val: string) => void;
  editHashtags: string;
  setEditHashtags: (val: string) => void;
  editStyle?: VisualStyle;
  setEditStyle?: (s: VisualStyle) => void;
  editAspect?: AspectRatio;
  setEditAspect?: (a: AspectRatio) => void;
  startEditingPost: (idx: number, post: SocialPostCampaignItem) => void;
  saveEditedPost: (idx: number) => void;
  handleDeletePost: (idx: number) => void;
  activeSlideMap: Record<number, number>;
  setActiveSlideMap: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleCopyToClipboard: (text: string, index: number, type: 'prompt' | 'caption') => void;
  copiedIndex: number | null;
  copiedType: 'prompt' | 'caption' | null;
  handleStartVisualGeneration: (idx: number, post: SocialPostCampaignItem) => void;
  generatorState: { isOpen: boolean; postIndex: number; isLoading: boolean };
  setPreviewImageModal: (val: any) => void;
  handleUpdatePostAspect?: (idx: number, newAspect: AspectRatio) => void;
  handleUpdatePostStyle?: (idx: number, newStyle: VisualStyle) => void;
  handleSavePostAsDraft: (post: SocialPostCampaignItem, slide?: any, campaignName?: string, campaignId?: string) => void;
  handleSaveAllSlidesAsDrafts?: (post: SocialPostCampaignItem, campaignName?: string, campaignId?: string) => void;
  handleLaunchPost: (post: SocialPostCampaignItem, slide?: any) => void;
  savedDraftIndex: number | null;
  currentCampaign: any;
  triggerToast: (msg: string) => void;
  inlineRefineIndex: number | null;
  setInlineRefineIndex: (idx: number | null) => void;
  inlineRefineText: string;
  setInlineRefineText: (val: string) => void;
  handleRefineSinglePostAI?: (postIndex: number, instructionText: string) => Promise<void>;
  isRefining: boolean;
}

export const PostCardItem: React.FC<PostCardItemProps> = ({
  idx,
  post,
  isExpanded,
  onToggleExpand,
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
  handleDeletePost,
  activeSlideMap,
  setActiveSlideMap,
  handleCopyToClipboard,
  copiedIndex,
  copiedType,
  handleStartVisualGeneration,
  generatorState,
  setPreviewImageModal,
  handleUpdatePostAspect,
  handleUpdatePostStyle,
  handleSavePostAsDraft,
  handleSaveAllSlidesAsDrafts,
  handleLaunchPost,
  savedDraftIndex,
  currentCampaign,
  triggerToast,
  inlineRefineIndex,
  setInlineRefineIndex,
  inlineRefineText,
  setInlineRefineText,
  handleRefineSinglePostAI,
  isRefining,
}) => {
  const isEditing = editingPostIndex === idx;
  const isInlineRefining = inlineRefineIndex === idx;

  const currentSlideIdx = activeSlideMap[idx] || 0;
  const currentSlide = (post.slides && post.slides[currentSlideIdx]) ? post.slides[currentSlideIdx] : null;

  const aspectOptions: AspectRatio[] = ['1:1', '9:16', '16:9'];
  const styleOptions: VisualStyle[] = ['Default', 'Minimalist', 'Realistic', 'Cartoon', 'Vintage', 'Futuristic', '3D Render', 'Sketch', 'Carousel'];

  const shouldShowDetails = isExpanded || isEditing || isInlineRefining;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 transition-all duration-200 ${shouldShowDetails ? 'space-y-4 shadow-md' : 'hover:shadow-md'}`}>
      {/* Top Post Card Bar */}
      <div className={`flex items-center justify-between gap-2 ${shouldShowDetails ? 'border-b border-slate-100 dark:border-slate-800 pb-3' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none" onClick={onToggleExpand}>
          <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-xs font-bold flex items-center justify-center border border-purple-500/20 shrink-0">
            #{idx + 1}
          </span>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                {post.day || `Post ${idx + 1}`}
              </span>
              {!shouldShowDetails && (
                <div className="flex items-center gap-1.5 ml-1">
                  {post.imageUrl && (
                    <span className="p-0.5 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded border border-purple-500/20" title="Image Generated">
                      <ImageIcon className="w-3 h-3" />
                    </span>
                  )}
                  {post.videoUrl && (
                    <span className="p-0.5 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 rounded border border-cyan-500/20" title="Video Generated">
                      <Video className="w-3 h-3" />
                    </span>
                  )}
                  {post.audioUrl && (
                    <span className="p-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded border border-emerald-500/20" title="Voiceover Generated">
                      <Mic className="w-3 h-3" />
                    </span>
                  )}
                  {post.slides && post.slides.length > 0 && (
                    <span className="px-1 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded border border-indigo-500/20 text-[9px] font-mono font-bold uppercase" title="Carousel Slides">
                      Carousel ({post.slides.length})
                    </span>
                  )}
                </div>
              )}
            </div>
            <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white truncate mt-0.5 leading-tight">
              {post.topic}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isInlineRefining) {
                setInlineRefineIndex(null);
              } else {
                setInlineRefineIndex(idx);
                setInlineRefineText('');
              }
            }}
            className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Wand2 className="w-3 h-3" />
            <span className="hidden sm:inline">AI Refine</span>
          </button>

          {!isEditing && (
            <button
              type="button"
              onClick={() => startEditingPost(idx, post)}
              className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
              title="Edit Post Content"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDeletePost(idx)}
            className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Delete Post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer animate-in duration-205"
            title={shouldShowDetails ? "Collapse Details" : "Expand Details"}
          >
            {shouldShowDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Inline Single Post AI Refine Form */}
      {isInlineRefining && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-2 animate-in fade-in duration-200">
          <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest block font-mono">
            Inline AI Refinement Instruction for Post #{idx + 1}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inlineRefineText}
              onChange={(e) => setInlineRefineText(e.target.value)}
              placeholder="e.g. 'Rewrite caption to be shorter with punchy bullet points'"
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-purple-500/30 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
            />
            <button
              type="button"
              disabled={isRefining || !inlineRefineText.trim()}
              onClick={async () => {
                if (handleRefineSinglePostAI) {
                  await handleRefineSinglePostAI(idx, inlineRefineText);
                  setInlineRefineIndex(null);
                }
              }}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Mode vs Normal View Mode */}
      {isEditing ? (
        <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topic / Title</label>
            <input
              type="text"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visual Generation Prompt</label>
            <textarea
              rows={3}
              value={editVisualPrompt}
              onChange={(e) => setEditVisualPrompt(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Social Media Caption</label>
            <textarea
              rows={4}
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hashtags</label>
            <input
              type="text"
              value={editHashtags}
              onChange={(e) => setEditHashtags(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setEditingPostIndex(null)}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => saveEditedPost(idx)}
              className="px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        shouldShowDetails && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">

          {/* Multi-Slide Carousel Deck Viewer */}
          {(post.isCarousel || (post.slides && post.slides.length > 0) || post.suggestedStyle === 'Carousel') && (
            <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="px-2.5 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Multi-Slide Carousel ({post.slides ? post.slides.length : 1} Slides)</span>
                </span>

                {post.slides && post.slides.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSlideMap(prev => ({ ...prev, [idx]: Math.max(0, (prev[idx] || 0) - 1) }))}
                      disabled={(activeSlideMap[idx] || 0) === 0}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-300 font-mono">
                      Slide {(activeSlideMap[idx] || 0) + 1} / {post.slides.length}
                    </span>
                    <button
                      onClick={() => setActiveSlideMap(prev => ({ ...prev, [idx]: Math.min(post.slides!.length - 1, (prev[idx] || 0) + 1) }))}
                      disabled={(activeSlideMap[idx] || 0) >= post.slides.length - 1}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {post.slides && post.slides.length > 0 && currentSlide && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-white font-display">
                      Slide {currentSlide.slideNumber}: {currentSlide.title}
                    </h5>
                    {currentSlide.contentText && (
                      <span className="text-[10px] text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {currentSlide.contentText}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">
                      Slide Visual Directive
                    </span>
                    <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                      {currentSlide.visualPrompt}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visual Blueprint Prompt */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest block">
                {currentSlide ? `Slide ${currentSlide.slideNumber} Visual Blueprint` : 'Visual Blueprint Prompt'}
              </span>
              <button
                onClick={() => {
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
              {currentSlide ? currentSlide.visualPrompt : post.visualPrompt}
            </p>
          </div>

          {/* Generated Image Thumbnail Display */}
          {(() => {
            const imgUrl = currentSlide
              ? (currentSlide.imageUrl || (currentSlideIdx === 0 ? post.imageUrl : undefined))
              : post.imageUrl;

            if (!imgUrl) return null;

            return (
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 aspect-video max-w-sm mt-2 shadow-md group/thumb animate-in fade-in duration-300">
                <CampaignImage src={imgUrl} alt={post.topic} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setPreviewImageModal({
                      url: imgUrl,
                      title: post.topic,
                      prompt: currentSlide ? currentSlide.visualPrompt : post.visualPrompt,
                      post,
                      slide: currentSlide,
                      postIdx: idx,
                      slideIdx: post.slides ? currentSlideIdx : null
                    })}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Studio Canvas</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Caption Box */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Social Caption</span>
              <button
                onClick={() => handleCopyToClipboard(post.caption, idx, 'caption')}
                className="text-[10px] text-slate-400 hover:text-purple-500 font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === idx && copiedType === 'caption' ? (
                  <span className="text-emerald-500">Copied!</span>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              {post.caption}
            </p>
          </div>

          {/* Hashtags */}
          {post.hashtags && (
            <div className="flex flex-wrap gap-1.5">
              {(typeof (post.hashtags as any) === 'string' ? (post.hashtags as unknown as string).split(',') : Array.isArray(post.hashtags) ? post.hashtags : []).map((tag: string, tIdx: number) => {
                const cleaned = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
                return (
                  <span key={tIdx} className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 font-mono">
                    {cleaned}
                  </span>
                );
              })}
            </div>
          )}

          {/* Controls Bar: Aspect, Style, Generate Visual & Save */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Aspect Ratio Selector */}
              {handleUpdatePostAspect && (
                <select
                  value={post.aspectRatio || '1:1'}
                  onChange={(e) => handleUpdatePostAspect(idx, e.target.value as AspectRatio)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  {aspectOptions.map(a => (
                    <option key={a} value={a}>{getAspectShortLabel(a)} ({a})</option>
                  ))}
                </select>
              )}

              {/* Visual Style Selector */}
              {handleUpdatePostStyle && (
                <select
                  value={post.suggestedStyle || 'Default'}
                  onChange={(e) => handleUpdatePostStyle(idx, e.target.value as VisualStyle)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  {styleOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleStartVisualGeneration(idx, post)}
                disabled={generatorState.isLoading && generatorState.postIndex === idx}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generatorState.isLoading && generatorState.postIndex === idx ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Visual</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSavePostAsDraft(post, currentSlide, currentCampaign?.name, currentCampaign?.id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Save Post to Drafts Planner"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchPost(post, currentSlide)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                title="Open in Interactive Canvas"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch</span>
              </button>
            </div>
          </div>
        </div>
        )
      )}
    </div>
  );
};
