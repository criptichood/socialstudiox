/**
 * Service to render Web Audio synth tracks offline into standard PCM WAV audio files.
 */

export interface SoundPreset {
  id: string;
  name: string;
  category: 'Ambient' | 'Lofi' | 'Synthwave' | 'Cinematic' | 'Meditation' | 'Sci-Fi' | 'SFX' | 'Acoustic' | 'Arcade';
  bpm: number;
  description: string;
  defaultDurationSec: number;
  isAiGenerated?: boolean;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'lofi',
    name: 'Soft Lo-Fi Atmosphere',
    category: 'Lofi',
    bpm: 80,
    description: 'Nostalgic chill-hop chord progression with warm analog warmth and subtle vinyl texture.',
    defaultDurationSec: 30,
  },
  {
    id: 'ambient',
    name: 'Ambient Calm Chime',
    category: 'Ambient',
    bpm: 65,
    description: 'Meditative Cmaj7 harmonic pad swells and crystalline sine wave resonance.',
    defaultDurationSec: 30,
  },
  {
    id: 'synthwave',
    name: 'Cyber Pulse Synthwave',
    category: 'Synthwave',
    bpm: 120,
    description: 'Retro 80s neon arpeggio bassline with driving sawtooth synth pulses.',
    defaultDurationSec: 30,
  },
  {
    id: 'cinematic',
    name: 'Epic Cinematic Drone',
    category: 'Cinematic',
    bpm: 60,
    description: 'Sub-bass atmospheric drone with brassy sub-harmonics and suspense risers.',
    defaultDurationSec: 30,
  },
  {
    id: 'zen',
    name: 'Zen Meditation Bell',
    category: 'Meditation',
    bpm: 50,
    description: 'Pure 432Hz singing bowl resonance with tranquil air shimmer decay.',
    defaultDurationSec: 30,
  },
  {
    id: 'space-bass',
    name: 'Deep Space Sub-Bass',
    category: 'Sci-Fi',
    bpm: 70,
    description: 'Futuristic ultra-low frequency cosmic rumble and modulated LFO pulse.',
    defaultDurationSec: 30,
  },
  {
    id: 'vinyl-rain',
    name: 'Vinyl Rain & Calm Piano',
    category: 'Lofi',
    bpm: 75,
    description: 'Gentle piano note cascades over a realistic vinyl crackle and soft rain backdrop.',
    defaultDurationSec: 30,
  },
  {
    id: 'cyber-arp',
    name: 'Cyberpunk Arpeggiator',
    category: 'Synthwave',
    bpm: 128,
    description: 'High-octane minor pentatonic synth arpeggio for tech showcases and trailers.',
    defaultDurationSec: 30,
  },
  {
    id: 'acoustic-sun',
    name: 'Acoustic Sunset Strum',
    category: 'Acoustic',
    bpm: 84,
    description: 'Warm fingerpicked triad chord progressions with organic acoustic decay.',
    defaultDurationSec: 30,
  },
  {
    id: 'glitch-beat',
    name: 'Electro Glitch Beat',
    category: 'SFX',
    bpm: 130,
    description: 'Punchy electro-sub kick with randomized white-noise snares and micro-synths.',
    defaultDurationSec: 30,
  },
  {
    id: 'celestial-harp',
    name: 'Celestial Harp Cascades',
    category: 'Ambient',
    bpm: 90,
    description: 'Ethereal pentatonic glissando sweeps with crystalline high-register reverb.',
    defaultDurationSec: 30,
  },
  {
    id: 'dark-mystery',
    name: 'Dark Mystery Suspense',
    category: 'Cinematic',
    bpm: 55,
    description: 'Tense minor-second cello drone with slow creepy swells for thriller trailers.',
    defaultDurationSec: 30,
  },
  {
    id: 'tropical-marimba',
    name: 'Tropical Sunset Marimba',
    category: 'Acoustic',
    bpm: 115,
    description: 'Upbeat wooden marimba pentatonic melody with island percussion vibes.',
    defaultDurationSec: 30,
  },
  {
    id: 'retro-chiptune',
    name: '8-Bit Retro Arcade',
    category: 'Arcade',
    bpm: 140,
    description: 'Nostalgic NES 8-bit square wave arpeggios and retro gaming sound effects.',
    defaultDurationSec: 30,
  },
  {
    id: 'nature-stream',
    name: 'Forest Rain & Wind Chimes',
    category: 'Ambient',
    bpm: 60,
    description: 'Filtered pink-noise forest rainfall layered with sporadic metal wind chimes.',
    defaultDurationSec: 30,
  },
  {
    id: 'industrial-cyber',
    name: 'Industrial Heavy Cyber',
    category: 'Sci-Fi',
    bpm: 135,
    description: 'Aggressive distorted sawtooth synth pulse with metallic resonance and sub punch.',
    defaultDurationSec: 30,
  }
];

/**
 * Encodes an AudioBuffer into an ArrayBuffer containing a standard 16-bit PCM WAV file.
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const channel0 = buffer.getChannelData(0);
    const channel1 = buffer.getChannelData(1);
    result = new Float32Array(channel0.length + channel1.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i * 2] = channel0[i];
      result[i * 2 + 1] = channel1[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = result.length * bytesPerSample;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  /* fmt sub-chunk */
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  /* data sub-chunk */
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return arrayBuffer;
}

/**
 * Renders the chosen synth preset or custom options offline and returns the WAV Blob & filename.
 */
export const renderWavBlob = async (
  presetId: string,
  durationSec: number = 30,
  customName?: string,
  customScale?: number[],
  customWave?: OscillatorType,
  customBpm?: number
): Promise<{ blob: Blob; filename: string; arrayBuffer: ArrayBuffer }> => {
  const sampleRate = 44100;
  const duration = Math.max(5, Math.min(durationSec, 300)); // 5s to 300s
  const numSamples = sampleRate * duration;

  const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtxClass) {
    throw new Error('OfflineAudioContext is not supported in this browser.');
  }

  const offlineCtx = new OfflineCtxClass(2, numSamples, sampleRate);
  const mainGain = offlineCtx.createGain();
  // Seamless loop envelope: smooth fade-in at 0s and gentle fade-out at end of duration
  mainGain.gain.setValueAtTime(0.001, 0);
  mainGain.gain.linearRampToValueAtTime(0.4, 0.4);
  mainGain.gain.setValueAtTime(0.4, Math.max(0.5, duration - 0.5));
  mainGain.gain.linearRampToValueAtTime(0.001, duration);
  mainGain.connect(offlineCtx.destination);

  // Synthesize sound based on presetId or custom params
  if (presetId === 'ambient' || (customName && customName.toLowerCase().includes('ambient'))) {
    const chords = customScale || [261.63, 329.63, 392.00, 493.88, 220.00, 349.23];
    const interval = 3.5;
    let time = 0;
    while (time < duration) {
      for (let i = 0; i < 4; i++) {
        const freq = chords[(Math.floor(time / interval) + i) % chords.length];
        const osc = offlineCtx.createOscillator();
        const g = offlineCtx.createGain();
        osc.type = customWave || 'sine';
        osc.frequency.setValueAtTime(freq, time);

        g.gain.setValueAtTime(0.001, time);
        g.gain.linearRampToValueAtTime(0.08, time + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, time + 3.8);

        osc.connect(g);
        g.connect(mainGain);

        osc.start(time);
        osc.stop(time + 4.0);
      }
      time += interval;
    }
  } else if (presetId === 'synthwave' || presetId === 'cyber-arp') {
    const scale = customScale || [110.00, 130.81, 146.83, 164.81, 196.00, 220.00];
    const stepTime = 60 / (customBpm || (presetId === 'cyber-arp' ? 128 : 120)) / 2;
    let time = 0;
    let step = 0;
    while (time < duration) {
      const freq = scale[step % scale.length];
      const osc = offlineCtx.createOscillator();
      const g = offlineCtx.createGain();
      osc.type = customWave || (presetId === 'cyber-arp' ? 'sawtooth' : 'square');
      osc.frequency.setValueAtTime(freq, time);

      g.gain.setValueAtTime(0.12, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 1.5);

      osc.connect(g);
      g.connect(mainGain);

      osc.start(time);
      osc.stop(time + stepTime * 1.8);

      time += stepTime;
      step++;
    }
  } else if (presetId === 'zen') {
    const baseFreq = 432;
    let time = 0;
    while (time < duration) {
      [baseFreq, baseFreq * 1.5, baseFreq * 2].forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        const g = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (idx * 2), time);

        g.gain.setValueAtTime(0.001, time);
        g.gain.linearRampToValueAtTime(0.15 / (idx + 1), time + 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 6.0);

        osc.connect(g);
        g.connect(mainGain);

        osc.start(time);
        osc.stop(time + 6.2);
      });
      time += 5.0;
    }
  } else if (presetId === 'cinematic' || presetId === 'space-bass') {
    const drones = customScale || [65.41, 73.42, 82.41, 55.00];
    let time = 0;
    let step = 0;
    while (time < duration) {
      const freq = drones[step % drones.length];
      const osc = offlineCtx.createOscillator();
      const osc2 = offlineCtx.createOscillator();
      const g = offlineCtx.createGain();

      osc.type = customWave || 'sine';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 1.498, time); // Fifth interval

      g.gain.setValueAtTime(0.01, time);
      g.gain.linearRampToValueAtTime(0.2, time + 1.0);
      g.gain.exponentialRampToValueAtTime(0.001, time + 4.5);

      osc.connect(g);
      osc2.connect(g);
      g.connect(mainGain);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + 4.8);
      osc2.stop(time + 4.8);

      time += 4.0;
      step++;
    }
  } else {
    // Default Lofi / Vinyl Rain synth generator
    const scale = customScale || [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const stepTime = 0.75;
    let time = 0;
    let step = 0;
    while (time < duration) {
      const freq = scale[step % scale.length];
      const osc = offlineCtx.createOscillator();
      const g = offlineCtx.createGain();

      osc.type = customWave || 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      g.gain.setValueAtTime(0.18, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

      osc.connect(g);
      g.connect(mainGain);

      osc.start(time);
      osc.stop(time + 1.4);

      time += stepTime;
      step++;
    }
  }

  // Render audio offline
  const renderedBuffer = await offlineCtx.startRendering();
  const wavArrayBuffer = audioBufferToWav(renderedBuffer);

  const blob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

  const safeSlug = (customName || presetId)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .substring(0, 50) || 'soundtrack';
  const filename = `${safeSlug}-${duration}s.wav`;

  return { blob, filename, arrayBuffer: wavArrayBuffer };
};

/**
 * Renders the chosen synth preset or custom options offline and triggers WAV download.
 */
export const renderAndDownloadWav = async (
  presetId: string,
  durationSec: number = 30,
  customName?: string,
  customScale?: number[],
  customWave?: OscillatorType,
  customBpm?: number
): Promise<void> => {
  const { blob, filename } = await renderWavBlob(
    presetId,
    durationSec,
    customName,
    customScale,
    customWave,
    customBpm
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
