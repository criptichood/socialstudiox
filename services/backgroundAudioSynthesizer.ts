export type BackgroundTrackStyle = 
  | 'none' 
  | 'lofi' 
  | 'ambient' 
  | 'synthwave' 
  | 'cinematic' 
  | 'zen' 
  | 'space-bass' 
  | 'vinyl-rain' 
  | 'cyber-arp' 
  | 'acoustic-sun' 
  | 'glitch-beat' 
  | 'celestial-harp' 
  | 'dark-mystery' 
  | 'tropical-marimba' 
  | 'retro-chiptune' 
  | 'nature-stream' 
  | 'industrial-cyber' 
  | 'custom';

export interface CustomSynthOptions {
  bpm?: number;
  waveform?: OscillatorType;
  category?: string;
  chords?: number[];
}

export class BackgroundAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private mainGain: GainNode | null = null;
  private intervalId: any = null;

  start(ctx: AudioContext, destination: AudioNode, style: BackgroundTrackStyle, customOptions?: CustomSynthOptions) {
    if (!style || style === 'none' || !ctx) return;
    this.ctx = ctx;
    this.isPlaying = true;

    try {
      this.mainGain = ctx.createGain();
      this.mainGain.gain.setValueAtTime(0.18, ctx.currentTime);
      this.mainGain.connect(destination);

      if (style === 'ambient' || style === 'celestial-harp') {
        this.playAmbientChordSequence(customOptions?.chords);
      } else if (style === 'lofi' || style === 'vinyl-rain' || style === 'acoustic-sun') {
        this.playLofiSequence(customOptions?.waveform || (style === 'acoustic-sun' ? 'triangle' : 'sine'), customOptions?.bpm || 80);
      } else if (style === 'synthwave') {
        this.playSynthwaveSequence(customOptions?.bpm || 120);
      } else if (style === 'cyber-arp' || style === 'industrial-cyber') {
        this.playCyberArpSequence(customOptions?.bpm || (style === 'industrial-cyber' ? 135 : 128));
      } else if (style === 'cinematic' || style === 'dark-mystery') {
        this.playCinematicSequence();
      } else if (style === 'zen') {
        this.playZenSequence();
      } else if (style === 'space-bass') {
        this.playSpaceBassSequence();
      } else if (style === 'tropical-marimba') {
        this.playMarimbaSequence(customOptions?.bpm || 115);
      } else if (style === 'retro-chiptune') {
        this.playChiptuneSequence(customOptions?.bpm || 140);
      } else if (style === 'glitch-beat') {
        this.playGlitchBeatSequence(customOptions?.bpm || 130);
      } else if (style === 'nature-stream') {
        this.playNatureStreamSequence();
      } else if (style === 'custom') {
        this.playCustomSequence(customOptions);
      } else {
        this.playLofiSequence('triangle', 80);
      }
    } catch (e) {
      console.warn('Failed to start background audio synthesizer:', e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.mainGain && this.ctx) {
      try {
        this.mainGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  private playNote(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.5) {
    if (!this.ctx || !this.mainGain || !this.isPlaying) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, this.ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.mainGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  private playAmbientChordSequence(customChords?: number[]) {
    const chords = customChords || [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const notes = Array.isArray(chords[step % chords.length]) 
        ? (chords[step % chords.length] as number[]) 
        : [chords[step % chords.length] as number];
      notes.forEach(f => this.playNote(f, 4.0, 'sine', 0.15));
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, 3800);
  }

  private playLofiSequence(wave: OscillatorType = 'triangle', bpm = 80) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const intervalMs = Math.round((60 / bpm) * 1000);
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = scale[step % scale.length];
      this.playNote(freq, 1.2, wave, 0.25);
      if (step % 2 === 0) {
        this.playNote(freq / 2, 2.0, 'sine', 0.3);
      }
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, Math.max(250, intervalMs));
  }

  private playSynthwaveSequence(bpm = 120) {
    const bassline = [110.00, 110.00, 130.81, 146.83];
    const intervalMs = Math.round((60 / bpm / 2) * 1000);
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = bassline[step % bassline.length];
      this.playNote(freq, 0.4, 'sawtooth', 0.15);
      this.playNote(freq * 2, 0.4, 'square', 0.08);
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, Math.max(150, intervalMs));
  }

  private playCyberArpSequence(bpm = 128) {
    const scale = [110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63];
    const intervalMs = Math.round((60 / bpm / 2) * 1000);
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = scale[step % scale.length];
      this.playNote(freq, 0.35, 'sawtooth', 0.2);
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, Math.max(120, intervalMs));
  }

  private playCinematicSequence() {
    const lowDrones = [65.41, 73.42, 82.41, 65.41];
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = lowDrones[step % lowDrones.length];
      this.playNote(freq, 5.0, 'sine', 0.35);
      this.playNote(freq * 1.5, 4.0, 'triangle', 0.18);
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, 4200);
  }

  private playZenSequence() {
    const baseFreq = 432;
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      [baseFreq, baseFreq * 1.5, baseFreq * 2.0].forEach((f, idx) => {
        this.playNote(f + (idx * 2), 5.5, 'sine', 0.2 / (idx + 1));
      });
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, 4800);
  }

  private playSpaceBassSequence() {
    const drones = [55.00, 65.41, 49.00, 58.27];
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = drones[step % drones.length];
      this.playNote(freq, 4.5, 'triangle', 0.35);
      this.playNote(freq * 0.5, 4.5, 'sine', 0.4);
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, 4000);
  }

  private playMarimbaSequence(bpm = 115) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const intervalMs = Math.round((60 / bpm / 2) * 1000);
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = scale[(step * 3 + (step % 4)) % scale.length];
      this.playNote(freq, 0.4, 'triangle', 0.25);
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, Math.max(140, intervalMs));
  }

  private playChiptuneSequence(bpm = 140) {
    const scale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25];
    const intervalMs = Math.round((60 / bpm / 4) * 1000);
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = scale[step % scale.length];
      this.playNote(freq, 0.15, 'square', 0.18);
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, Math.max(80, intervalMs));
  }

  private playGlitchBeatSequence(bpm = 130) {
    const intervalMs = Math.round((60 / bpm / 2) * 1000);
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      if (step % 4 === 0) {
        // Sub kick
        this.playNote(60, 0.2, 'sine', 0.4);
      } else if (step % 2 === 1) {
        // High glitch tone
        const randFreq = 800 + (step * 137) % 1200;
        this.playNote(randFreq, 0.08, 'sawtooth', 0.12);
      } else {
        // Mid synth pop
        this.playNote(350, 0.1, 'square', 0.15);
      }
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, Math.max(100, intervalMs));
  }

  private playNatureStreamSequence() {
    let step = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      // Soft ambient background swell
      this.playNote(174.61 + (step % 3) * 20, 3.5, 'sine', 0.1);
      // Sporadic bird/chime bell notes
      if (step % 2 === 0) {
        const chimeFreq = 1200 + (Math.sin(step) * 400);
        this.playNote(chimeFreq, 0.6, 'sine', 0.08);
      }
      step++;
    };
    playNext();
    this.intervalId = setInterval(playNext, 2200);
  }

  private playCustomSequence(options?: CustomSynthOptions) {
    const bpm = options?.bpm || 80;
    const wave = options?.waveform || 'sine';
    const cat = (options?.category || 'ambient').toLowerCase();

    if (cat.includes('synth') || cat.includes('sci-fi')) {
      this.playCyberArpSequence(bpm);
    } else if (cat.includes('lofi')) {
      this.playLofiSequence(wave, bpm);
    } else if (cat.includes('cinematic')) {
      this.playCinematicSequence();
    } else if (cat.includes('meditation') || cat.includes('zen')) {
      this.playZenSequence();
    } else {
      this.playLofiSequence(wave, bpm);
    }
  }
}

