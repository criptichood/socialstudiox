'use client';
import React from 'react';
import {
  Trash2,
  Image as ImageIcon,
  Video,
  Mic,
  Layers,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { SocialPostCampaignItem } from '@/components/DraftsPlanner';
import { AspectRatioIcon } from '@/components/drafts/AspectBadge';
import { CampaignImage } from '@/components/drafts/CampaignImage';

interface PostCardItemProps {
  idx: number;
  post: SocialPostCampaignItem;
  onOpenPost: (idx: number) => void;
  handleDeletePost: (idx: number) => void;
}

export const PostCardItem: React.FC<PostCardItemProps> = ({ idx, post, onOpenPost, handleDeletePost }) => {
  const isCarousel = (post.isCarousel || post.suggestedStyle === 'Carousel') && !!post.slides && post.slides.length > 0;
  // Prefer the post's own visual, falling back to the first generated carousel slide image.
  const previewImage = post.imageUrl || (post.slides && post.slides[0]?.imageUrl) || undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenPost(idx)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenPost(idx);
        }
      }}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-purple-400/40 hover:-translate-y-0.5 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
    >
      {/* Thumbnail / Placeholder */}
      <div className="relative w-full aspect-[16/10] bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0">
        {previewImage ? (
          <CampaignImage src={previewImage} alt={post.topic} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-500/10 via-slate-100 to-slate-200 dark:from-purple-500/10 dark:via-slate-900 dark:to-slate-950">
            <span className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-mono text-base font-bold text-purple-500">
              #{idx + 1}
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              No visual yet
            </span>
          </div>
        )}

        {/* Status badges overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {previewImage && (
              <span className="p-1 bg-slate-950/70 backdrop-blur text-purple-300 rounded-md border border-purple-500/30" title="Image Generated">
                <ImageIcon className="w-3 h-3" />
              </span>
            )}
            {post.videoUrl && (
              <span className="p-1 bg-slate-950/70 backdrop-blur text-cyan-300 rounded-md border border-cyan-500/30" title="Video Generated">
                <Video className="w-3 h-3" />
              </span>
            )}
            {post.audioUrl && (
              <span className="p-1 bg-slate-950/70 backdrop-blur text-emerald-300 rounded-md border border-emerald-500/30" title="Voiceover Generated">
                <Mic className="w-3 h-3" />
              </span>
            )}
            {isCarousel && (
              <span className="px-1.5 py-0.5 bg-slate-950/70 backdrop-blur text-indigo-300 rounded-md border border-indigo-500/30 text-[9px] font-mono font-bold flex items-center gap-1" title="Carousel Slides">
                <Layers className="w-3 h-3" />
                {post.slides!.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePost(idx);
            }}
            className="p-1.5 bg-slate-950/70 backdrop-blur text-slate-400 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
            title="Delete Post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hover hint */}
        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 bg-white/95 text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5" />
            View Post
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center text-[10px] shrink-0">
            {idx + 1}
          </span>
          <span className="truncate">{post.day || `Post ${idx + 1}`}</span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{post.topic}</h4>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {post.caption || 'No caption drafted yet.'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
              <AspectRatioIcon aspect={post.aspectRatio || '1:1'} className="w-3 h-3" />
              {post.aspectRatio || '1:1'}
            </span>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-bold truncate max-w-[110px]">
              {post.suggestedStyle || 'Default'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors shrink-0">
            Open →
          </span>
        </div>
      </div>
    </div>
  );
};
