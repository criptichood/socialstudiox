import { SubtitleSegment } from '../types';

/**
 * Format milliseconds into standard SRT timestamp string: HH:MM:SS,mmm
 * Example: 1250ms -> "00:00:01,250"
 */
export const formatSrtTimestamp = (ms: number): string => {
  const totalSeconds = Math.max(0, ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((ms % 1000));

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
};

/**
 * Parses script text and correlates it with audio duration to produce precise timestamped SRT entries
 * Formatted for short-form social media (Reels, TikTok, Shorts) with bite-sized 3-5 word subtitle lines.
 */
export const generateSrtFromScript = (
  scriptText: string,
  totalDurationSec?: number
): { srtText: string; segments: SubtitleSegment[] } => {
  if (!scriptText || !scriptText.trim()) {
    return { srtText: '', segments: [] };
  }

  // Clean raw script text by removing tone directives like "[Tone: Energetic]" or "[Voice: Puck]"
  const cleanedText = scriptText.replace(/\[(Tone|Voice|Emotion|Style|Delivery):[^\]]+\]/gi, '').trim();

  // Split text into individual words
  const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) {
    return { srtText: '', segments: [] };
  }

  // Create bite-sized short-form subtitle phrases (3 to 5 words max per chunk, or ~35 characters max)
  const phrases: string[] = [];
  let currentChunk: string[] = [];
  let currentLen = 0;

  for (const word of words) {
    const hasPunctuation = /[.!?;,]$/.test(word);
    currentChunk.push(word);
    currentLen += word.length + 1;

    // Push chunk if max word limit (5), max char limit (35), or punctuation boundary is met
    if (currentChunk.length >= 5 || currentLen >= 35 || (hasPunctuation && currentChunk.length >= 2)) {
      phrases.push(currentChunk.join(' '));
      currentChunk = [];
      currentLen = 0;
    }
  }

  if (currentChunk.length > 0) {
    phrases.push(currentChunk.join(' '));
  }

  // Total character count to distribute audio duration proportionally
  const totalChars = phrases.reduce((sum, p) => sum + p.length, 0);

  // Estimate total duration if not provided (assume ~14 chars per second for natural spoken speech)
  const actualDurationMs = (totalDurationSec && totalDurationSec > 0)
    ? totalDurationSec * 1000
    : Math.max(2000, (totalChars / 14) * 1000);

  const segments: SubtitleSegment[] = [];
  let currentMs = 0;

  phrases.forEach((phraseText, idx) => {
    // Weight duration by character length against total spoken text
    const weight = phraseText.length / Math.max(1, totalChars);
    let segmentDurationMs = Math.round(weight * actualDurationMs);
    // Min 600ms per subtitle chunk so it flashes cleanly like Reel / TikTok captions
    segmentDurationMs = Math.max(600, segmentDurationMs);

    const startMs = currentMs;
    const endMs = (idx === phrases.length - 1) 
      ? Math.max(startMs + 500, Math.round(actualDurationMs)) 
      : startMs + segmentDurationMs;

    currentMs = endMs;

    segments.push({
      id: idx + 1,
      startMs,
      endMs,
      startTime: formatSrtTimestamp(startMs),
      endTime: formatSrtTimestamp(endMs),
      text: phraseText
    });
  });

  // Build standard SRT string
  const srtBlocks = segments.map(seg => {
    return `${seg.id}\n${seg.startTime} --> ${seg.endTime}\n${seg.text}\n`;
  });

  const srtText = srtBlocks.join('\n').trim();

  return { srtText, segments };
};

/**
 * Utility to download string as an SRT subtitle file (.srt)
 */
export const downloadSrtFile = (filename: string, srtText: string): void => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.srt') ? filename : `${filename}.srt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Utility to download plain text transcript (.txt)
 */
export const downloadTranscriptFile = (filename: string, scriptText: string): void => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([scriptText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
