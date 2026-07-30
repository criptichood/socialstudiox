import { DBService } from './dbService';
import { saveVideoSession } from './videoStorageService';
import { BackgroundAudioSynthesizer, BackgroundTrackStyle } from './backgroundAudioSynthesizer';

export interface VideoCompileOptions {
  id: string;
  title: string;
  imageSrc: string;
  audioUrl?: string;
  animationStyle?: 'zoom-in' | 'pan-left' | 'pan-right' | 'pulse' | 'ken-burns' | 'static';
  aspectRatio?: string;
  backgroundTrack?: BackgroundTrackStyle;
  videoPrompt?: string;
  projectId?: string;
  onProgress?: (progressPercent: number) => void;
}

function normalizeAspectString(raw?: string): '1:1' | '9:16' | '16:9' | '4:5' | 'auto' {
  if (!raw) return 'auto';
  const s = raw.toLowerCase().trim();
  if (s === 'auto' || s.includes('match') || s === 'auto match graphic') return 'auto';
  if (s === '1:1' || s === 'square' || s === '1/1' || s === '1-1') return '1:1';
  if (s === '9:16' || s === 'portrait' || s === 'reel' || s === 'story' || s === '9/16' || s === '9-16') return '9:16';
  if (s === '16:9' || s === 'landscape' || s === 'video' || s === '16/9' || s === '16-9') return '16:9';
  if (s === '4:5' || s === 'feed' || s === '4/5' || s === '4-5') return '4:5';
  return 'auto';
}

export const compileProgrammaticVideo = async (
  options: VideoCompileOptions
): Promise<string> => {
  const {
    id,
    title,
    imageSrc,
    audioUrl,
    animationStyle = 'zoom-in',
    aspectRatio = 'auto',
    backgroundTrack = 'none',
    videoPrompt,
    projectId,
    onProgress
  } = options;

  // 1. Resolve image source
  let actualImgUrl = imageSrc;
  if (imageSrc.startsWith('db-img:')) {
    const key = imageSrc.replace('db-img:', '');
    const rec = await DBService.get(key);
    if (rec && rec.data) {
      actualImgUrl = rec.data;
    }
  }

  // Load image element
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for video compilation'));
    img.src = actualImgUrl;
  });

  const naturalWidth = img.naturalWidth || img.width || 1080;
  const naturalHeight = img.naturalHeight || img.height || 1080;
  const imgRatio = naturalWidth / naturalHeight;

  // Determine target aspect ratio & canvas dimensions
  const normAspect = normalizeAspectString(aspectRatio);

  let width = 1080;
  let height = 1080;

  if (normAspect === 'auto') {
    if (imgRatio >= 1.0) {
      height = 1080;
      width = Math.round(1080 * imgRatio);
    } else {
      width = 1080;
      height = Math.round(1080 / imgRatio);
    }
  } else if (normAspect === '1:1') {
    width = 1080;
    height = 1080;
  } else if (normAspect === '9:16') {
    width = 720;
    height = 1280;
  } else if (normAspect === '16:9') {
    width = 1280;
    height = 720;
  } else if (normAspect === '4:5') {
    width = 864;
    height = 1080;
  }

  // Ensure canvas dimensions are even integers for video encoding safety
  width = width - (width % 2);
  height = height - (height % 2);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 2. Set up Audio if provided
  let durationSec = 8;
  let audioElement: HTMLAudioElement | null = null;
  let audioCtx: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;

  if (audioUrl) {
    audioElement = new Audio(audioUrl);
    audioElement.crossOrigin = 'anonymous';
    await new Promise<void>((resolve) => {
      audioElement!.onloadedmetadata = () => {
        if (audioElement!.duration && !isNaN(audioElement!.duration) && isFinite(audioElement!.duration)) {
          durationSec = Math.max(audioElement!.duration, 3);
        }
        resolve();
      };
      audioElement!.onerror = () => resolve();
      setTimeout(resolve, 1500);
    });
  }

  // 3. Prepare MediaStream
  const canvasStream = canvas.captureStream(30);
  let combinedStream = canvasStream;
  const bgSynth = new BackgroundAudioSynthesizer();

  if (audioElement || (backgroundTrack && backgroundTrack !== 'none')) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        audioDestination = audioCtx.createMediaStreamDestination();

        if (audioElement) {
          const source = audioCtx.createMediaElementSource(audioElement);
          source.connect(audioDestination);
          // Note: Do NOT connect to audioCtx.destination so compilation happens silently without blasting audio to speakers
        }

        if (backgroundTrack && backgroundTrack !== 'none') {
          bgSynth.start(audioCtx, audioDestination, backgroundTrack);
        }

        const audioTrack = audioDestination.stream.getAudioTracks()[0];
        if (audioTrack) {
          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            audioTrack
          ]);
        }
      }
    } catch (e) {
      console.warn("AudioContext piping fallback:", e);
    }
  }

  let mimeType = 'video/webm;codecs=vp9';
  if (typeof MediaRecorder !== 'undefined') {
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }
  }

  const mediaRecorder = mimeType
    ? new MediaRecorder(combinedStream, { mimeType })
    : new MediaRecorder(combinedStream);

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise<string>((resolve, reject) => {
    mediaRecorder.onstop = async () => {
      try {
        const videoBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
        const videoBlobUrl = URL.createObjectURL(videoBlob);

        await saveVideoSession(
          {
            id,
            projectId,
            title,
            videoPrompt,
            animationStyle,
            aspectRatio,
            createdAt: Date.now(),
            thumbnailUrl: actualImgUrl,
            audioUrl,
            durationSec
          },
          videoBlob
        );

        if (audioCtx) {
          audioCtx.close().catch(() => {});
        }

        resolve(videoBlobUrl);
      } catch (err) {
        reject(err);
      }
    };

    mediaRecorder.onerror = () => {
      reject(new Error("MediaRecorder error during video render"));
    };

    mediaRecorder.start(100);

    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    }

    const startTime = performance.now();
    const totalMs = durationSec * 1000;

    const renderFrame = () => {
      const elapsedMs = performance.now() - startTime;
      const progress = Math.min(elapsedMs / totalMs, 1.0);

      if (onProgress) {
        onProgress(Math.floor(progress * 100));
      }

      ctx.clearRect(0, 0, width, height);

      const imgW = img.naturalWidth || img.width || 1080;
      const imgH = img.naturalHeight || img.height || 1080;
      const imgAspect = imgW / imgH;
      const canvasRatio = width / height;

      // Fill background if aspect ratios differ
      if (Math.abs(imgAspect - canvasRatio) > 0.01) {
        ctx.save();
        ctx.filter = 'blur(24px) brightness(0.55)';
        let bgW = width;
        let bgH = height;
        if (imgAspect > canvasRatio) {
          bgW = height * imgAspect;
        } else {
          bgH = width / imgAspect;
        }
        ctx.drawImage(img, (width - bgW) / 2, (height - bgH) / 2, bgW, bgH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);
      }

      // Calculate foreground dimensions using CONTAIN (Fit) mode so graphic is never cropped
      let drawW = width;
      let drawH = height;
      if (Math.abs(imgAspect - canvasRatio) > 0.01) {
        if (imgAspect > canvasRatio) {
          drawW = width;
          drawH = width / imgAspect;
        } else {
          drawH = height;
          drawW = height * imgAspect;
        }
      }

      let scale = 1.0;
      let offsetX = 0;
      let offsetY = 0;

      if (animationStyle === 'zoom-in') {
        // Smooth cinematic zoom from 100% to 108%
        scale = 1.0 + progress * 0.08;
      } else if (animationStyle === 'pan-left') {
        scale = 1.05;
        offsetX = (progress - 0.5) * (drawW * 0.04);
      } else if (animationStyle === 'pan-right') {
        scale = 1.05;
        offsetX = (0.5 - progress) * (drawW * 0.04);
      } else if (animationStyle === 'pulse') {
        scale = 1.0 + Math.sin(progress * Math.PI * 2) * 0.03;
      } else if (animationStyle === 'ken-burns') {
        scale = 1.0 + progress * 0.06;
        offsetX = Math.sin(progress * Math.PI) * (drawW * 0.025);
        offsetY = Math.cos(progress * Math.PI) * (drawH * 0.02);
      }

      ctx.save();
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      if (progress < 1.0) {
        requestAnimationFrame(renderFrame);
      } else {
        setTimeout(() => {
          bgSynth.stop();
          if (audioElement) {
            audioElement.pause();
          }
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 150);
      }
    };

    renderFrame();
  });
};
