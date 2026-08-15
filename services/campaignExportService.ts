import JSZip from 'jszip';
import { SocialPostCampaignItem } from '@/types';

interface AssetEntry {
  index: number;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov'
};

const extractDataUrl = (dataUrl: string): { mime: string; base64: string } => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (match) return { mime: match[1], base64: match[2] };
  return { mime: '', base64: dataUrl };
};

const extFor = (mime: string, fallback: string): string => {
  return MIME_TO_EXT[mime] || fallback;
};

const buildEntries = (posts: SocialPostCampaignItem[]): AssetEntry[] => {
  const entries: AssetEntry[] = [];
  posts.forEach(p => {
    if (p.slides && p.slides.length > 0) {
      p.slides.forEach(s => {
        if (s.imageUrl || s.audioUrl || s.videoUrl) {
          entries.push({ index: entries.length + 1, imageUrl: s.imageUrl, audioUrl: s.audioUrl, videoUrl: s.videoUrl });
        }
      });
    } else if (p.imageUrl || p.audioUrl || p.videoUrl) {
      entries.push({ index: entries.length + 1, imageUrl: p.imageUrl, audioUrl: p.audioUrl, videoUrl: p.videoUrl });
    }
  });
  return entries;
};

/**
 * Exports every generated campaign asset as a single ZIP.
 * Files are paired by index: image_1.png + audio_1.mp3 (+ video_1.mp4 when includeVideo).
 * Assets that don't exist (e.g. no audio) are simply skipped, keeping the pairing intact.
 * @returns the number of files added to the ZIP
 */
export const exportCampaignAssets = async (
  campaignName: string,
  posts: SocialPostCampaignItem[],
  options: { includeVideo?: boolean } = {}
): Promise<number> => {
  const entries = buildEntries(posts);
  const zip = new JSZip();
  let added = 0;

  for (const entry of entries) {
    if (entry.imageUrl) {
      const { mime, base64 } = extractDataUrl(entry.imageUrl);
      zip.file(`image_${entry.index}.${extFor(mime, 'png')}`, base64, { base64: true });
      added++;
    }
    if (entry.audioUrl) {
      const { mime, base64 } = extractDataUrl(entry.audioUrl);
      zip.file(`audio_${entry.index}.${extFor(mime, 'mp3')}`, base64, { base64: true });
      added++;
    }
    if (options.includeVideo && entry.videoUrl) {
      const { mime, base64 } = extractDataUrl(entry.videoUrl);
      zip.file(`video_${entry.index}.${extFor(mime, 'mp4')}`, base64, { base64: true });
      added++;
    }
  }

  if (added === 0) return 0;

  const slug = campaignName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'campaign';
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-${options.includeVideo ? 'full-assets' : 'assets'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return added;
};
