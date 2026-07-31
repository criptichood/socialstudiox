'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  Play,
  Copy,
  Check,
  Layers,
  Loader2,
  Image as ImageIcon,
  Edit,
  Trash2,
  Wand2,
  Film,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { SocialPostCampaignItem } from '@/components/DraftsPlanner';
import { AspectRatio, CarouselSlide, VisualStyle } from '@/types';
import { CampaignImage } from '@/components/drafts/CampaignImage';
import { ImageDownloadDropdown } from '@/components/ImageDownloadDropdown';
import { AspectRatioIcon, getAspectShortLabel } from '@/components/drafts/AspectBadge';

interface PostDetailModalProps {
  post: SocialPostCampaignItem | null;
  postIndex: number;
  isOpen: boolean;
  onClose: () => void;
  /** Pass the full list so we can navigate prev/next */
  allPosts: SocialPostCampaignItem[];
  onNavigate: (newIndex: number) => void;
  /** Actions forwarded from parent */
  handleStartVisualGeneration: (idx: number, post: SocialPostCampaignItem, slideIdx?: number | null) => void;
  generatorState: { isLoading: boolean; postIndex: number | null };
  handleSavePostAsDraft: (post: SocialPostCampaignItem, slide?: CarouselSlide | null, campaignName?: string, campaignId?: string) => void;
  handleLaunchPost: (post: SocialPostCampaignItem, slide?: CarouselSlide | null) => void;
  handleDeletePost: (idx: number) => void;
  handleUpdatePostAspect?: (idx: number, newAspect: AspectRatio) => void;
  handleUpdatePostStyle?: (idx: number, newStyle: VisualStyle) => void;
  handleRefineSinglePostAI?: (postIndex: number, instructionText: string) => Promise<void>;
  isRefining: boolean;
  setPreviewImageModal: (val: any) => void;
  /** Inline edit state */
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
  editStyle: VisualStyle;
  setEditStyle?: (val: VisualStyle) => void;
  editAspect: AspectRatio;
  setEditAspect?: (val: AspectRatio) => void;
  startEditingPost: (idx: number, post: SocialPostCampaignItem) => void;
  saveEditedPost: (idx: number) => void;
  campaignName?: string;
  campaignId?: string;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  postIndex,
  isOpen,
  onClose,
  allPosts,
  onNavigate,
  handleStartVisualGeneration,
  generatorState,
  handleSavePostAsDraft,
  handleLaunchPost,
  handleDeletePost,
  handleUpdatePostAspect,
  handleUpdatePostStyle,
  handleRefineSinglePostAI,
  isRefining,
  setPreviewImageModal,
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
  editStyle,
  setEditStyle = () => {},
  editAspect,
  setEditAspect = () => {},
  startEditingPost,
  saveEditedPost,
  campaignName,
  campaignId,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  // Reset slide index when post changes
  useEffect(() => {
    setSlideIdx(0);
    setRefineText('');
    setZoomUrl(null);
  }, [postIndex]);

  // Reset editing state when switching posts
  useEffect(() => {
    setEditingPostIndex(null);
  }, [postIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomUrl) {
          setZoomUrl(null);
        } else {
          onClose();
        }
        return;
      }
      if (zoomUrl) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (isCarousel && post?.slides) {
          setSlideIdx(prev => Math.min(prev + 1, (post.slides?.length ?? 1) - 1));
        } else {
          const next = Math.min(postIndex + 1, allPosts.length - 1);
          onNavigate(next);
        }
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (isCarousel && post?.slides && slideIdx > 0) {
          setSlideIdx(prev => Math.max(prev - 1, 0));
        } else {
          const prev = Math.max(postIndex - 1, 0);
          onNavigate(prev);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, postIndex, allPosts, onNavigate, onClose, slideIdx, post, zoomUrl]);

  if (!isOpen || !post) return null;

  const isCarousel = (post.isCarousel || post.suggestedStyle === 'Carousel') && post.slides && post.slides.length > 0;
  const currentSlide = isCarousel ? post.slides![Math.min(slideIdx, post.slides!.length - 1)] : null;
  const displayImage = currentSlide ? currentSlide.imageUrl : post.imageUrl;
  const displayPrompt = currentSlide ? currentSlide.visualPrompt : post.visualPrompt;
  const slideCount = isCarousel ? post.slides!.length : 0;

  const isGenerating = generatorState.isLoading && generatorState.postIndex === postIndex;
  const isEditing = editingPostIndex === postIndex;

  const copyToClipboard = async (text: string, type: 'caption' | 'prompt') => {
    await navigator.clipboard.writeText(text);
    if (type === 'caption') {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleApplyRefine = async () => {
    if (!refineText.trim() || !handleRefineSinglePostAI) return;
    await handleRefineSinglePostAI(postIndex, refineText.trim());
    setRefineText('');
  };

  const aspectRatioClass = (ar?: AspectRatio) => {
    switch (ar) {
      case '9:16': return 'aspect-[9/16] max-h-[60vh]';
      case '16:9': return 'aspect-video';
      default: return 'aspect-square';
    }
  };

  const aspectOptions: AspectRatio[] = ['1:1', '9:16', '16:9'];
  const styleOptions: VisualStyle[] = ['Default', 'Minimalist', 'Realistic', 'Cartoon', 'Vintage', 'Futuristic', '3D Render', 'Sketch', 'Carousel'];

  return createPortal(
    <>
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div
        className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {isCarousel && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0">
                <Layers className="w-3 h-3" />
                Carousel · {slideCount} slides
              </span>
            )}
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {post.day || `Post ${postIndex + 1}`} — {post.topic}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Post navigation prev/next */}
            <button
              type="button"
              onClick={() => onNavigate(Math.max(postIndex - 1, 0))}
              disabled={postIndex === 0}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-all cursor-pointer"
              title="Previous Post"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400">{postIndex + 1} / {allPosts.length}</span>
            <button
              type="button"
              onClick={() => onNavigate(Math.min(postIndex + 1, allPosts.length - 1))}
              disabled={postIndex === allPosts.length - 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-all cursor-pointer"
              title="Next Post"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { handleDeletePost(postIndex); onClose(); }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
            {/* Left: Image Preview */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800">
              {/* Slide nav for carousel */}
              {isCarousel && slideCount > 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSlideIdx(prev => Math.max(prev - 1, 0))}
                    disabled={slideIdx === 0}
                    className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1.5">
                    {post.slides!.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlideIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === slideIdx ? 'bg-purple-600 scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-purple-400'}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlideIdx(prev => Math.min(prev + 1, slideCount - 1))}
                    disabled={slideIdx === slideCount - 1}
                    className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 ml-1">
                    Slide {slideIdx + 1}/{slideCount}
                  </span>
                </div>
              )}

              {displayImage ? (
                <div
                  className={`relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 ${aspectRatioClass(post.aspectRatio)} cursor-zoom-in group/zoom`}
                  onClick={() => setZoomUrl(displayImage)}
                >
                  <CampaignImage
                    src={displayImage}
                    alt={post.topic}
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/zoom:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-3 py-1.5 bg-white/95 text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      Zoom In
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-3 ${aspectRatioClass(post.aspectRatio)}`}>
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                  <p className="text-xs text-slate-400 font-mono text-center px-4">No visual generated yet</p>
                </div>
              )}

              {/* Download button if image exists */}
              {displayImage && (
                <div className="mt-3">
                  <ImageDownloadDropdown
                    imageUrl={displayImage}
                    filenameSlug={`${post.topic?.replace(/\s+/g, '_') || 'post'}_slide${slideIdx + 1}`}
                    buttonVariant="outline"
                  />
                </div>
              )}

              {/* Generate Visual Button */}
              <button
                type="button"
                onClick={() => handleStartVisualGeneration(postIndex, post, slideIdx)}
                disabled={isGenerating}
                className="mt-3 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{displayImage ? 'Regenerate Visual' : 'Generate Visual'}</span>
                  </>
                )}
              </button>

              {/* Open in Video Studio */}
              {displayImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImageModal({
                      url: displayImage,
                      title: post.topic,
                      prompt: displayPrompt,
                      post,
                      slide: currentSlide,
                      postIdx: postIndex,
                      slideIdx: post.slides ? slideIdx : null
                    });
                  }}
                  className="mt-2 px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  Open in Video Studio
                </button>
              )}
            </div>

            {/* Right: Post Details */}
            <div className="flex flex-col p-6 gap-5 overflow-y-auto">
              {/* Edit Mode */}
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest font-mono">Editing Post #{postIndex + 1}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      Unsaved changes
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topic / Title</label>
                    <input
                      type="text"
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visual Generation Prompt</label>
                    <textarea
                      rows={4}
                      value={editVisualPrompt}
                      onChange={(e) => setEditVisualPrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Social Media Caption</label>
                    <textarea
                      rows={4}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hashtags (comma separated)</label>
                    <input
                      type="text"
                      value={editHashtags}
                      onChange={(e) => setEditHashtags(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Aspect</label>
                    <select
                      value={editAspect}
                      onChange={(e) => setEditAspect(e.target.value as AspectRatio)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      {aspectOptions.map(a => (
                        <option key={a} value={a}>{getAspectShortLabel(a)} ({a})</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono ml-2">Style</label>
                    <select
                      value={editStyle}
                      onChange={(e) => setEditStyle(e.target.value as VisualStyle)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      {styleOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingPostIndex(null)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEditedPost(postIndex)}
                      className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-500 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Carousel slide title & content */}
                  {currentSlide && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1 block">
                        Slide {currentSlide.slideNumber}{currentSlide.title ? ` · ${currentSlide.title}` : ''}
                      </span>
                      {currentSlide.contentText && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                          {currentSlide.contentText}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Visual Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        {isCarousel ? `Slide ${slideIdx + 1} Visual Prompt` : 'Visual Prompt'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayPrompt || '', 'prompt')}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-purple-500 transition-colors cursor-pointer"
                      >
                        {copiedPrompt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedPrompt ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 font-mono">
                      {displayPrompt || '—'}
                    </p>
                  </div>

                  {/* Caption */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Caption</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(post.caption || '', 'caption')}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-purple-500 transition-colors cursor-pointer"
                      >
                        {copiedCaption ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedCaption ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      {post.caption || '—'}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 block">Hashtags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {post.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg font-mono"
                          >
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta: Aspect + Style selectors + Edit */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <AspectRatioIcon aspect={post.aspectRatio || '1:1'} className="w-4 h-4 text-slate-400" />
                      {handleUpdatePostAspect && (
                        <select
                          value={post.aspectRatio || '1:1'}
                          onChange={(e) => handleUpdatePostAspect(postIndex, e.target.value as AspectRatio)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                        >
                          {aspectOptions.map(a => (
                            <option key={a} value={a}>{getAspectShortLabel(a)} ({a})</option>
                          ))}
                        </select>
                      )}
                    </div>
                    {handleUpdatePostStyle && (
                      <select
                        value={post.suggestedStyle || 'Default'}
                        onChange={(e) => handleUpdatePostStyle(postIndex, e.target.value as VisualStyle)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                      >
                        {styleOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditingPost(postIndex, post)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      title="Edit Post Content"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                  </div>

                  {/* Inline AI Refine */}
                  {handleRefineSinglePostAI && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-2">
                      <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest block font-mono">
                        AI Refinement for Post #{postIndex + 1}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={refineText}
                          onChange={(e) => setRefineText(e.target.value)}
                          placeholder="e.g. 'Rewrite caption to be shorter with punchy bullet points'"
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-purple-500/30 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                        />
                        <button
                          type="button"
                          disabled={isRefining || !refineText.trim()}
                          onClick={handleApplyRefine}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex gap-2 flex-wrap mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSavePostAsDraft(post, currentSlide, campaignName, campaignId)}
                    className="flex-1 min-w-[100px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleLaunchPost(post, currentSlide); onClose(); }}
                    className="flex-1 min-w-[100px] px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Launch Canvas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Click-to-zoom full-screen image inspector */}
      {zoomUrl && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white">
            <span className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              High-Resolution Image Inspector
            </span>
            <button
              onClick={() => setZoomUrl(null)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-full transition-all border border-slate-800 cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full max-w-5xl bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center p-6 shadow-2xl cursor-zoom-out" onClick={() => setZoomUrl(null)}>
            <CampaignImage src={zoomUrl} alt={post.topic} className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl" />
          </div>
          <div className="w-full max-w-5xl mt-4 flex items-center justify-between">
            <ImageDownloadDropdown
              imageUrl={zoomUrl}
              filenameSlug={`campaign-inspection-${Date.now()}`}
              buttonVariant="outline"
              buttonText="Download Full Resolution"
            />
            <button
              onClick={() => setZoomUrl(null)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
                    </div>
        </div>
      )}
    </>,
    document.body
  );
};