// Web Audio API procedural sound & music synthesizer for Chrono Rebirth

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isSfxMuted: boolean = false;
  public isMusicMuted: boolean = false;
  public musicVolume: number = 0.35;
  public sfxVolume: number = 0.6;

  private currentBgmType: 'exploration' | 'battle' | 'boss' | null = null;
  private bgmIntervalId: any = null;
  private masterMusicGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMusic = localStorage.getItem('chrono_music_muted');
        if (savedMusic !== null) this.isMusicMuted = savedMusic === 'true';
        const savedSfx = localStorage.getItem('chrono_sfx_muted');
        if (savedSfx !== null) this.isSfxMuted = savedSfx === 'true';
      } catch {
        // ignore
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.masterMusicGain) {
      this.masterMusicGain = this.ctx.createGain();
      this.masterMusicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.masterMusicGain.connect(this.ctx.destination);
    }
  }

  // --- BGM ENGINE ---

  public startBgm(type: 'exploration' | 'battle' | 'boss') {
    if (this.currentBgmType === type && this.bgmIntervalId) return;

    this.stopBgm();
    this.currentBgmType = type;
    this.initCtx();
    if (!this.ctx || !this.masterMusicGain) return;

    let step = 0;

    // Musical note definitions (Hz)
    const N = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
    };

    if (type === 'exploration') {
      // Atmospheric, serene RPG mystery exploration theme
      // 16-step modal progression in D minor / A minor
      const bassSequence = [N.D3, 0, N.D3, 0, N.A3, 0, N.F3, 0, N.G3, 0, N.D3, 0, N.Bb3, 0, N.C4, 0];
      const melodySequence = [
        N.A4, N.D5, N.F5, 0, N.E5, N.D5, 0, N.C5,
        N.D5, 0, N.A4, N.G4, N.F4, N.G4, N.A4, 0,
      ];
      const tempoMs = 240; // ~125 BPM 8th notes

      this.bgmIntervalId = setInterval(() => {
        if (!this.ctx || !this.masterMusicGain || this.isMusicMuted) return;
        const now = this.ctx.currentTime;
        const idx = step % 16;

        // Bass pad / pulse
        const bassFreq = bassSequence[idx];
        if (bassFreq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bassFreq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, now);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 1.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterMusicGain);

          osc.start(now);
          osc.stop(now + (tempoMs / 1000) * 1.8);
        }

        // Arpeggiated melody note
        const melFreq = melodySequence[idx];
        if (melFreq > 0 && Math.random() < 0.95) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(melFreq, now);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 1.5);

          osc.connect(gain);
          gain.connect(this.masterMusicGain);

          osc.start(now);
          osc.stop(now + (tempoMs / 1000) * 1.5);
        }

        step++;
      }, tempoMs);
    } else {
      // Battle Theme: Driving, rhythmic, tense turn-based combat track
      const isBoss = type === 'boss';
      const tempoMs = isBoss ? 150 : 175; // Fast, energetic 16th-like pulse

      const battleBass = isBoss
        ? [N.D3, N.D3, N.F3, N.D3, N.G3, N.D3, N.Bb3, N.A3, N.D3, N.D3, N.C4, N.D3, N.Bb3, N.A3, N.G3, N.E3]
        : [N.A3, N.A3, N.C4, N.A3, N.D4, N.A3, N.E4, N.G3, N.A3, N.A3, N.C4, N.A3, N.F3, N.G3, N.E3, N.A3];

      const battleLead = isBoss
        ? [N.D4, 0, N.F4, 0, N.G4, N.A4, 0, N.Bb4, N.A4, N.G4, N.F4, 0, N.E4, 0, N.D4, 0]
        : [N.A4, 0, N.C5, 0, N.B4, 0, N.G4, 0, N.A4, N.B4, N.C5, 0, N.E5, 0, N.D5, 0];

      this.bgmIntervalId = setInterval(() => {
        if (!this.ctx || !this.masterMusicGain || this.isMusicMuted) return;
        const now = this.ctx.currentTime;
        const idx = step % 16;

        // Driving rhythmic bass
        const bassNote = battleBass[idx];
        if (bassNote) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(bassNote * 0.5, now); // deep octave

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, now);
          filter.frequency.exponentialRampToValueAtTime(200, now + (tempoMs / 1000) * 0.8);

          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.9);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterMusicGain);

          osc.start(now);
          osc.stop(now + (tempoMs / 1000) * 0.9);
        }

        // Percussive synth hat/snare on alternating steps
        if (idx % 2 === 1) {
          const noiseOsc = this.ctx.createOscillator();
          const noiseGain = this.ctx.createGain();
          noiseOsc.type = 'triangle';
          noiseOsc.frequency.setValueAtTime(idx % 4 === 1 ? 800 : 1400, now);
          noiseGain.gain.setValueAtTime(0.03, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          noiseOsc.connect(noiseGain);
          noiseGain.connect(this.masterMusicGain);
          noiseOsc.start(now);
          noiseOsc.stop(now + 0.05);
        }

        // Tense melody note
        const leadNote = battleLead[idx];
        if (leadNote) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(leadNote, now);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 1.4);

          osc.connect(gain);
          gain.connect(this.masterMusicGain);

          osc.start(now);
          osc.stop(now + (tempoMs / 1000) * 1.4);
        }

        step++;
      }, tempoMs);
    }
  }

  public get isMuted(): boolean {
    return this.isMusicMuted && this.isSfxMuted;
  }

  public set isMuted(val: boolean) {
    this.isMusicMuted = val;
    this.isSfxMuted = val;
    try {
      localStorage.setItem('chrono_music_muted', String(val));
      localStorage.setItem('chrono_sfx_muted', String(val));
    } catch {
      // ignore
    }
    if (this.masterMusicGain && this.ctx) {
      this.masterMusicGain.gain.setValueAtTime(
        val ? 0 : this.musicVolume,
        this.ctx.currentTime
      );
    }
  }

  public get currentBgm(): 'exploration' | 'battle' | 'boss' | null {
    return this.currentBgmType;
  }

  public stopBgm() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.currentBgmType = null;
  }

  public toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    try {
      localStorage.setItem('chrono_music_muted', String(this.isMusicMuted));
    } catch {
      // ignore
    }
    if (this.masterMusicGain && this.ctx) {
      this.masterMusicGain.gain.setValueAtTime(
        this.isMusicMuted ? 0 : this.musicVolume,
        this.ctx.currentTime
      );
    }
    return this.isMusicMuted;
  }

  public toggleSfx() {
    this.isSfxMuted = !this.isSfxMuted;
    try {
      localStorage.setItem('chrono_sfx_muted', String(this.isSfxMuted));
    } catch {
      // ignore
    }
    return this.isSfxMuted;
  }

  // --- SOUND EFFECTS ---

  public play(type: 'slash' | 'strike' | 'magic' | 'heal' | 'break' | 'time' | 'click' | 'loot' | 'level' | 'victory' | 'defeat') {
    if (this.isSfxMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      switch (type) {
        case 'click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
          gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'slash': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);
          gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }

        case 'strike': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
          gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }

        case 'magic': {
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(300, now);
          osc1.frequency.exponentialRampToValueAtTime(750, now + 0.22);
          osc2.frequency.setValueAtTime(450, now);
          osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.22);
          gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.25);
          osc2.stop(now + 0.25);
          break;
        }

        case 'heal': {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(0.16 * this.sfxVolume, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.25);
          });
          break;
        }

        case 'break': {
          // Sharp glass / shield shatter acoustic burst
          [880, 440, 220, 110].forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + 0.22);
            gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
          });
          break;
        }

        case 'time': {
          // Temporal rewind / dilation chime sweep
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.linearRampToValueAtTime(200, now + 0.15);
          osc.frequency.linearRampToValueAtTime(900, now + 0.3);
          gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.32);
          break;
        }

        case 'loot': {
          [440, 554.37, 659.25].forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.2);
          });
          break;
        }

        case 'level': {
          [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.28);
          });
          break;
        }

        case 'victory': {
          const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
          notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);
            gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.4);
          });
          break;
        }

        case 'defeat': {
          const notes = [330, 311.13, 293.66, 261.63];
          notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.3);
          });
          break;
        }
      }
    } catch {
      // Audio autoplay policy or unavailable context safely handled
    }
  }
}

export const sound = new SoundEngine();
