import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Sliders, 
  Radio, 
  Info, 
  Plus, 
  Loader2, 
  Disc, 
  Clock, 
  Zap, 
  SlidersHorizontal, 
  CheckCircle2,
  Trash2,
  Share2,
  Wand2,
  Settings2,
  Search,
  Filter,
  Archive,
  FolderDown,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import JSZip from 'jszip';
import { SOUND_PRESETS, SoundPreset, renderAndDownloadWav, renderWavBlob } from '../services/soundStudioExporter';
import { BackgroundAudioSynthesizer, BackgroundTrackStyle } from '../services/backgroundAudioSynthesizer';
import { DBService } from '../services/dbService';

interface SavedTrack {
  id: string;
  name: string;
  category: string;
  bpm: number;
  durationSec: number;
  waveform: OscillatorType;
  timestamp: number;
  presetId?: string;
  prompt?: string;
}

export const SoundStudio: React.FC = () => {
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ZIP Exporting State
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // Preset Library State (Built-in + AI Generated Presets)
  const [presetLibrary, setPresetLibrary] = useState<SoundPreset[]>(SOUND_PRESETS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom AI Generator State
  const [customTitle, setCustomTitle] = useState<string>('Lofi Sunset Meditation');
  const [customCategory, setCustomCategory] = useState<string>('Lofi');
  const [customBpm, setCustomBpm] = useState<number>(80);
  const [customWaveform, setCustomWaveform] = useState<OscillatorType>('triangle');
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [customPrompt, setCustomPrompt] = useState<string>('Nostalgic chill-hop chord progression with warm analog texture');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Saved Vault Tracks
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);

  // Web Audio synth instance for live previewing
  const synthRef = useRef<BackgroundAudioSynthesizer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadSavedTracks();
    loadCustomPresets();
    return () => {
      stopCurrentPreview();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCustomPresets = () => {
    try {
      const stored = localStorage.getItem('sound_studio_custom_presets');
      if (stored) {
        const customItems: SoundPreset[] = JSON.parse(stored);
        setPresetLibrary([...customItems, ...SOUND_PRESETS]);
      }
    } catch (e) {
      console.warn('Failed to load custom sound presets:', e);
    }
  };

  const loadSavedTracks = async () => {
    try {
      const stored = localStorage.getItem('sound_studio_tracks');
      if (stored) {
        setSavedTracks(JSON.parse(stored));
      } else {
        const initial: SavedTrack[] = [
          {
            id: 'saved-1',
            name: 'Cyberpunk City Skyline',
            category: 'Synthwave',
            bpm: 120,
            durationSec: 45,
            waveform: 'sawtooth',
            timestamp: Date.now() - 86400000,
            presetId: 'cyber-arp',
            prompt: 'Heavy synthwave pulse with futuristic arpeggiator'
          },
          {
            id: 'saved-2',
            name: 'Tranquil Lotus Stream',
            category: 'Meditation',
            bpm: 60,
            durationSec: 60,
            waveform: 'sine',
            timestamp: Date.now() - 172800000,
            presetId: 'zen',
            prompt: '432Hz deep meditative bowl with slow air swell'
          }
        ];
        setSavedTracks(initial);
        localStorage.setItem('sound_studio_tracks', JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('Failed to load saved sound tracks:', e);
    }
  };

  const saveTrackToVault = (track: SavedTrack) => {
    const updated = [track, ...savedTracks];
    setSavedTracks(updated);
    localStorage.setItem('sound_studio_tracks', JSON.stringify(updated));
  };

  const deleteTrackFromVault = (id: string) => {
    const updated = savedTracks.filter(t => t.id !== id);
    setSavedTracks(updated);
    localStorage.setItem('sound_studio_tracks', JSON.stringify(updated));
    triggerToast('Track removed from vault.');
  };

  const deleteAiPreset = (presetId: string) => {
    const updatedLib = presetLibrary.filter(p => p.id !== presetId);
    setPresetLibrary(updatedLib);
    const customItems = updatedLib.filter(p => p.isAiGenerated);
    localStorage.setItem('sound_studio_custom_presets', JSON.stringify(customItems));
    triggerToast('Preset removed from library.');
  };

  const stopCurrentPreview = () => {
    if (synthRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setActivePlayingId(null);
  };

  const togglePreviewPreset = (preset: SoundPreset) => {
    if (activePlayingId === preset.id) {
      stopCurrentPreview();
      return;
    }

    stopCurrentPreview();
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const synth = new BackgroundAudioSynthesizer();
      synthRef.current = synth;

      // Determine style mapping
      let style: BackgroundTrackStyle = 'ambient';
      if (preset.id === 'lofi' || preset.id === 'vinyl-rain' || preset.category === 'Lofi') style = 'lofi';
      else if (preset.id === 'synthwave' || preset.category === 'Synthwave') style = 'synthwave';
      else if (preset.id === 'cyber-arp' || preset.id === 'industrial-cyber') style = 'cyber-arp';
      else if (preset.id === 'cinematic' || preset.id === 'dark-mystery' || preset.category === 'Cinematic') style = 'cinematic';
      else if (preset.id === 'zen' || preset.category === 'Meditation') style = 'zen';
      else if (preset.id === 'space-bass' || preset.category === 'Sci-Fi') style = 'space-bass';
      else if (preset.id === 'tropical-marimba') style = 'tropical-marimba';
      else if (preset.id === 'retro-chiptune' || preset.category === 'Arcade') style = 'retro-chiptune';
      else if (preset.id === 'glitch-beat' || preset.category === 'SFX') style = 'glitch-beat';
      else if (preset.id === 'nature-stream') style = 'nature-stream';
      else if (preset.id === 'acoustic-sun' || preset.category === 'Acoustic') style = 'acoustic-sun';
      else if (preset.id === 'celestial-harp') style = 'celestial-harp';
      else style = 'custom';

      synth.start(ctx, ctx.destination, style, {
        bpm: preset.bpm,
        category: preset.category,
      });
      setActivePlayingId(preset.id);
    } catch (err) {
      console.error('Failed to start audio preview:', err);
    }
  };

  const togglePreviewCustomTrack = () => {
    const customId = 'custom-live-preview';
    if (activePlayingId === customId) {
      stopCurrentPreview();
      return;
    }

    stopCurrentPreview();
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const synth = new BackgroundAudioSynthesizer();
      synthRef.current = synth;

      synth.start(ctx, ctx.destination, 'custom', {
        bpm: customBpm,
        waveform: customWaveform,
        category: customCategory,
      });
      setActivePlayingId(customId);
    } catch (err) {
      console.error('Failed to preview custom sound:', err);
    }
  };

  const populateCustomFromPreset = (preset: SoundPreset) => {
    setCustomTitle(preset.name);
    setCustomCategory(preset.category);
    setCustomBpm(preset.bpm);
    setCustomPrompt(preset.description);
    if (preset.category === 'Lofi' || preset.category === 'Acoustic') setCustomWaveform('triangle');
    else if (preset.category === 'Synthwave' || preset.category === 'Sci-Fi') setCustomWaveform('sawtooth');
    else if (preset.category === 'Ambient' || preset.category === 'Meditation') setCustomWaveform('sine');
    else setCustomWaveform('square');

    triggerToast(`Loaded "${preset.name}" into customizer!`);
  };

  const handleDownloadPresetWav = async (preset: SoundPreset, durationSec: number = selectedDuration) => {
    setDownloadingId(preset.id);
    try {
      await renderAndDownloadWav(preset.id, durationSec, preset.name, undefined, undefined, preset.bpm);
      triggerToast(`WAV audio rendered & downloaded successfully! (${durationSec}s)`);
    } catch (err) {
      console.error('Failed to render WAV sound track:', err);
      triggerToast('Failed to render WAV sound file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerateCustomSoundtrack = async () => {
    if (!customTitle.trim()) return;
    setIsSynthesizing(true);

    try {
      const newTrack: SavedTrack = {
        id: `track-${Date.now()}`,
        name: customTitle,
        category: customCategory,
        bpm: customBpm,
        durationSec: customDuration,
        waveform: customWaveform,
        timestamp: Date.now(),
        presetId: customCategory.toLowerCase().includes('lofi') ? 'lofi' : 'ambient',
        prompt: customPrompt
      };

      // Add to preset library as well!
      const newPreset: SoundPreset = {
        id: `custom-preset-${Date.now()}`,
        name: customTitle,
        category: customCategory as any,
        bpm: customBpm,
        description: customPrompt || `${customCategory} style soundtrack with ${customWaveform} waveform`,
        defaultDurationSec: customDuration,
        isAiGenerated: true
      };

      const updatedLib = [newPreset, ...presetLibrary];
      setPresetLibrary(updatedLib);
      const customItems = updatedLib.filter(p => p.isAiGenerated);
      localStorage.setItem('sound_studio_custom_presets', JSON.stringify(customItems));

      await renderAndDownloadWav(
        newTrack.presetId || 'ambient',
        customDuration,
        customTitle,
        undefined,
        customWaveform,
        customBpm
      );

      saveTrackToVault(newTrack);
      triggerToast(`✨ "${customTitle}" generated, saved to Vault & added to Library!`);
    } catch (err) {
      console.error('Failed to synthesize custom track:', err);
      triggerToast('Failed to synthesize custom audio.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const generateRandomAiSoundscape = () => {
    setIsSynthesizing(true);
    triggerToast('✨ AI Sound Engine generating brand new soundtrack for Library...');

    const genres: ('Ambient' | 'Lofi' | 'Synthwave' | 'Cinematic' | 'Meditation' | 'Sci-Fi' | 'SFX' | 'Acoustic' | 'Arcade')[] = [
      'Ambient', 'Lofi', 'Synthwave', 'Cinematic', 'Meditation', 'Sci-Fi', 'SFX', 'Acoustic', 'Arcade'
    ];
    const waveforms: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];

    const titlePrefixes = [
      'Starlight', 'Cybernetic', 'Midnight', 'Deep Oceanic', 'Zenith', 'Cosmic', 
      'Rainy Tokyo', 'Hyperdrive', 'Solar', 'Velvet', 'Aether', 'Subliminal',
      'Galactic', 'Neon Horizon', 'Emerald', 'Binaural'
    ];
    const titleSuffixes = [
      'Solar Drift', 'Neon Pulse', 'Vinyl Sanctuary', 'Abyss Resonance', 'Solstice Reverie',
      'Gamma Echo', 'Alley Lofi', 'Interstellar Drone', 'Acoustic Echoes', 'Marimba Bounce',
      'Chiptune Glitch', 'Serenity Wave', 'Radiance Tide', 'Cosmic Flight'
    ];

    const prompts = [
      'Soft atmospheric shimmer with 432Hz sine wave harmonics and slow warm swell',
      'Analog tape warmth with vinyl rain hiss and gentle major seventh chord cascade',
      'Pulsing 80s synthesizer bassline with minor pentatonic lead arpeggiator',
      'Sub-bass cinematic drone with brassy sub-harmonics and suspenseful risers',
      'Tranquil Tibetan singing bowl resonance with airy high-register shimmer',
      'Organic wooden marimba bounce with warm acoustic resonance',
      'High-speed 8-bit retro arcade arpeggios for gaming action',
      'Aggressive industrial synth pulse with metallic ring modulation'
    ];

    setTimeout(() => {
      const seedNum = Math.floor(Math.random() * 900 + 100);
      const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
      const suffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
      const randomTitle = `${prefix} ${suffix} #${seedNum}`;
      const randomCategory = genres[Math.floor(Math.random() * genres.length)];
      const randomWave = waveforms[Math.floor(Math.random() * waveforms.length)];
      const randomBpm = Math.floor(Math.random() * (140 - 55) + 55);
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

      const newPreset: SoundPreset = {
        id: `ai-preset-${Date.now()}-${seedNum}`,
        name: randomTitle,
        category: randomCategory,
        bpm: randomBpm,
        description: randomPrompt,
        defaultDurationSec: 30,
        isAiGenerated: true
      };

      // Add directly to library!
      const updatedLib = [newPreset, ...presetLibrary];
      setPresetLibrary(updatedLib);

      const customItems = updatedLib.filter(p => p.isAiGenerated);
      localStorage.setItem('sound_studio_custom_presets', JSON.stringify(customItems));

      // Also update customizer inputs
      setCustomTitle(randomTitle);
      setCustomCategory(randomCategory);
      setCustomWaveform(randomWave);
      setCustomBpm(randomBpm);
      setCustomPrompt(randomPrompt);

      setIsSynthesizing(false);
      triggerToast(`✨ AI generated "${randomTitle}" and added it directly to your Library!`);
    }, 400);
  };

  // Filtered Presets
  const categories = ['All', 'Ambient', 'Lofi', 'Synthwave', 'Cinematic', 'Meditation', 'Sci-Fi', 'SFX', 'Acoustic', 'Arcade'];
  const filteredPresets = presetLibrary.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ZIP Export Engine
  const exportLibraryAsZip = async (tracksToExport?: SoundPreset[]) => {
    const targets = tracksToExport || filteredPresets;
    if (targets.length === 0) {
      triggerToast('No tracks available to export as ZIP.');
      return;
    }

    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const manifest: any[] = [];
      const folder = zip.folder('Soundscapes') || zip;

      for (let i = 0; i < targets.length; i++) {
        const p = targets[i];
        setZipProgress({ current: i + 1, total: targets.length, name: p.name });

        const { blob, filename } = await renderWavBlob(
          p.id,
          selectedDuration,
          p.name,
          undefined,
          undefined,
          p.bpm
        );

        folder.file(filename, blob);

        manifest.push({
          filename,
          title: p.name,
          category: p.category,
          bpm: p.bpm,
          durationSeconds: selectedDuration,
          description: p.description,
          isAiGenerated: !!p.isAiGenerated
        });
      }

      setZipProgress({ current: targets.length, total: targets.length, name: 'Compressing ZIP package...' });

      // Include Metadata Manifest & Instructions
      zip.file('tracks_manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('README.txt', 
`Sound Studio Lossless Audio Package
===================================
Total Soundscapes: ${targets.length}
Export Date: ${new Date().toLocaleString()}
Duration: ${selectedDuration}s per track

All audio files in this package were synthesized programmatically in-browser using 16-bit 44.1kHz PCM WAV audio.
You can freely import these sound files into any video editor, DAW, podcast suite, or social media platform!
`
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soundscape-library-bundle-${targets.length}-tracks.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      triggerToast(`📦 Successfully rendered and exported ${targets.length} WAV tracks as a ZIP package!`);
    } catch (err) {
      console.error('ZIP Export error:', err);
      triggerToast('Failed to generate ZIP archive.');
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  const exportVaultAsZip = async () => {
    if (savedTracks.length === 0) {
      triggerToast('Your Vault is empty.');
      return;
    }

    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const manifest: any[] = [];
      const folder = zip.folder('Vault-Tracks') || zip;

      for (let i = 0; i < savedTracks.length; i++) {
        const t = savedTracks[i];
        setZipProgress({ current: i + 1, total: savedTracks.length, name: t.name });

        const { blob, filename } = await renderWavBlob(
          t.presetId || 'ambient',
          t.durationSec,
          t.name,
          undefined,
          t.waveform,
          t.bpm
        );

        folder.file(filename, blob);

        manifest.push({
          filename,
          title: t.name,
          category: t.category,
          bpm: t.bpm,
          durationSeconds: t.durationSec,
          waveform: t.waveform,
          prompt: t.prompt
        });
      }

      setZipProgress({ current: savedTracks.length, total: savedTracks.length, name: 'Compressing Vault ZIP...' });

      zip.file('vault_manifest.json', JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sound-vault-${savedTracks.length}-tracks.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      triggerToast(`📦 Exported ${savedTracks.length} Vault tracks into ZIP archive!`);
    } catch (err) {
      console.error('Vault ZIP error:', err);
      triggerToast('Failed to export Vault ZIP.');
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-purple-500/40 text-purple-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ZIP Generation Progress Overlay Modal */}
      {isExportingZip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-2xl text-purple-300">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Generating Audio ZIP Package...</h3>
                <p className="text-xs text-slate-400">Synthesizing WAV files offline in browser</p>
              </div>
            </div>

            {zipProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-purple-300 font-bold truncate max-w-[200px]">{zipProgress.name}</span>
                  <span className="text-slate-400">{zipProgress.current} / {zipProgress.total}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-200"
                    style={{ width: `${(zipProgress.current / zipProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Banner & Informational Clarification */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-2xl text-purple-300">
                <Music className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Sound Effects & Ambient Tracks Studio
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                  Synthesize high-fidelity background tracks, audio atmospheres, and soundscapes for standalone download
                </p>
              </div>
            </div>

            {/* Global Duration Selector & ZIP Export */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 p-1.5 rounded-2xl">
                <Clock className="w-4 h-4 text-purple-400 ml-2" />
                <span className="text-xs font-bold text-slate-300">WAV Length:</span>
                {[15, 30, 60, 120].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setSelectedDuration(dur)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDuration === dur
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={isExportingZip}
                onClick={() => exportLibraryAsZip()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="Download all currently visible soundscapes in a ZIP archive"
              >
                <FolderDown className="w-4 h-4 text-purple-200" />
                <span>Export All as ZIP Folder</span>
              </button>
            </div>
          </div>

          {/* User Technical & Storage Clarification Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300">100% Code-Based Audio Synthesis (Zero Risk of Loss): </span>
                These audio tracks are <span className="text-white font-semibold">NOT stored as static media files on localhost disk or remote server host</span>. They are generated in real-time from pure TypeScript mathematical synthesis code inside your app! Moving this app to Cloud Run, Vercel, or GitHub will <span className="text-emerald-300 font-semibold">never break or lose access to any sound effect</span>.
              </div>
            </div>

            <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
              <Archive className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-300">Batch ZIP Archiving & Metadata: </span>
                Clicking <span className="text-white font-semibold">"Export All as ZIP Folder"</span> renders all soundscapes into pure 16-bit 44.1kHz PCM <span className="text-purple-300 font-mono font-bold">.WAV</span> files and packages them with a JSON manifest and README file into a single `.zip` archive.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Soundscapes Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Built-in Sound Preset Library</h2>
            <span className="text-xs text-slate-400 font-mono">({filteredPresets.length} tracks)</span>
          </div>

          <button
            type="button"
            onClick={generateRandomAiSoundscape}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>✨ AI Random Sound Generator</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search soundscapes..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {filteredPresets.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <Music className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs">No soundscapes match your filter or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPresets.map((preset) => {
              const isPlayingThis = activePlayingId === preset.id;
              const isDownloadingThis = downloadingId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`group relative bg-slate-900/90 border rounded-2xl p-5 transition-all hover:shadow-xl flex flex-col justify-between ${
                    isPlayingThis
                      ? 'border-purple-500 shadow-purple-500/10 ring-1 ring-purple-500'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {preset.category}
                        </span>
                        {preset.isAiGenerated && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            AI
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {preset.bpm} BPM
                        </span>

                        {preset.isAiGenerated && (
                          <button
                            type="button"
                            onClick={() => deleteAiPreset(preset.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove generated preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {preset.name}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  {/* Controls & Download */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => togglePreviewPreset(preset)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isPlayingThis
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isPlayingThis ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-purple-400" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isDownloadingThis}
                        onClick={() => handleDownloadPresetWav(preset, selectedDuration)}
                        className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                        title={`Render and download full ${selectedDuration}s WAV file`}
                      >
                        {isDownloadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>WAV ({selectedDuration}s)</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => populateCustomFromPreset(preset)}
                      className="w-full py-1 text-[11px] font-bold text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-3 h-3 text-cyan-400" />
                      <span>Load into Customizer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom AI Soundtrack Generator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Custom Sound Effect & Tone Generator</h2>
              <p className="text-xs text-slate-400">Synthesize & preview custom background tracks with custom waveforms, BPM, and sound descriptors</p>
            </div>
          </div>

          <button
            type="button"
            onClick={generateRandomAiSoundscape}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate & Add to Library</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Track Title / Name
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Deep Space Sci-Fi Drone"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Sound Atmosphere Descriptor / Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={2}
                placeholder="Describe your desired background atmosphere, mood, or instrument style..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Atmosphere Genre
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Ambient">Ambient Pad</option>
                  <option value="Lofi">Chill Lo-Fi</option>
                  <option value="Synthwave">Synthwave Pulse</option>
                  <option value="Cinematic">Cinematic Drone</option>
                  <option value="Meditation">Zen Bowl (432Hz)</option>
                  <option value="Sci-Fi">Sci-Fi Sub</option>
                  <option value="SFX">SFX / Glitch</option>
                  <option value="Acoustic">Acoustic Strum</option>
                  <option value="Arcade">8-Bit Arcade</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Waveform Osc
                </label>
                <select
                  value={customWaveform}
                  onChange={(e) => setCustomWaveform(e.target.value as OscillatorType)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="sine">Sine (Smooth)</option>
                  <option value="triangle">Triangle (Warm)</option>
                  <option value="sawtooth">Sawtooth (Bassy)</option>
                  <option value="square">Square (8-Bit Retro)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Tempo (BPM): {customBpm}
                </label>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={customBpm}
                  onChange={(e) => setCustomBpm(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Duration (Sec): {customDuration}s
                </label>
                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Audio Engine Output</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Preview your customized sound parameters live using Web Audio, or synthesize & download a lossless 16-bit PCM WAV file to save to your Vault.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={togglePreviewCustomTrack}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlayingId === 'custom-live-preview'
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {activePlayingId === 'custom-live-preview' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Stop Custom Live Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-cyan-400" />
                    <span>Live Preview Custom Sound</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSynthesizing || !customTitle.trim()}
                onClick={handleGenerateCustomSoundtrack}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Audio...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Synthesize & Save to Library</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Tracks Vault */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Sound Effects & Tracks Vault</h2>
            <span className="text-xs text-slate-400 font-mono">({savedTracks.length} saved)</span>
          </div>

          {savedTracks.length > 0 && (
            <button
              type="button"
              disabled={isExportingZip}
              onClick={exportVaultAsZip}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Export Vault as ZIP</span>
            </button>
          )}
        </div>

        {savedTracks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Music className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs">No custom tracks saved in your vault yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {savedTracks.map((t) => (
              <div key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {t.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className="text-cyan-400">{t.category}</span>
                      <span>•</span>
                      <span>{t.bpm} BPM</span>
                      <span>•</span>
                      <span>{t.durationSec}s WAV</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPresetWav({
                      id: t.presetId || 'ambient',
                      name: t.name,
                      category: t.category as any,
                      bpm: t.bpm,
                      description: t.prompt || '',
                      defaultDurationSec: t.durationSec
                    }, t.durationSec)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download WAV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTrackFromVault(t.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
