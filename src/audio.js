/**
 * 100% Procedural Retro-Cozy 2D Sound & ASMR Engine (Web Audio API)
 * Zero external assets required!
 */

class Sound2DEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.bgmRunning = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.65;
    this.master.connect(this.ctx.destination);
    this.startCozyMelody();
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.65, this.ctx.currentTime, 0.08);
    }
    return this.muted;
  }

  playHonk(pitch = 1.0) {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.2 + Math.random() * 0.1;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    const base = (260 + Math.random() * 45) * pitch;
    osc1.frequency.setValueAtTime(base * 0.85, now);
    osc1.frequency.exponentialRampToValueAtTime(base * 1.32, now + 0.045);
    osc1.frequency.exponentialRampToValueAtTime(base * 0.92, now + dur);

    osc2.frequency.setValueAtTime(base * 0.87 + 5, now);
    osc2.frequency.exponentialRampToValueAtTime(base * 1.34 + 7, now + 0.045);
    osc2.frequency.exponentialRampToValueAtTime(base * 0.94 + 4, now + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100 * pitch, now);
    filter.frequency.linearRampToValueAtTime(1500 * pitch, now + 0.06);
    filter.Q.value = 3.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
  }

  playHoe() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.09);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playSeed() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.07);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playWater() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.18;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.17);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
    noise.stop(now + 0.19);
  }

  playHarvest() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.055);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + i * 0.055);
      gain.gain.linearRampToValueAtTime(0.16, now + i * 0.055 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.32);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.35);
    });
  }

  playBell() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [880, 1318.5, 1760].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.68);
    });
  }

  startCozyMelody() {
    if (this.bgmRunning || !this.ctx) return;
    this.bgmRunning = true;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const loop = () => {
      if (!this.muted && this.ctx && this.ctx.state === 'running') {
        const now = this.ctx.currentTime;
        const f = scale[Math.floor(Math.random() * scale.length)];
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.038, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.8);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(now);
        osc.stop(now + 1.9);
      }
      setTimeout(loop, 1600 + Math.random() * 2400);
    };
    setTimeout(loop, 1200);
  }

  /**
   * 5-Second Dreamy Music-Box Lullaby when sleeping in the Cozy Cottage!
   */
  playSleepLullaby() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    // Gentle descending & cradling pentatonic music-box notes (C major 9th / F major 7th)
    const lullabyNotes = [
      { f: 523.25, t: 0.0, d: 1.2 },  // C5
      { f: 659.25, t: 0.35, d: 1.2 }, // E5
      { f: 587.33, t: 0.7, d: 1.4 },  // D5
      { f: 392.00, t: 1.15, d: 1.6 }, // G4
      { f: 440.00, t: 1.7, d: 1.2 },  // A4
      { f: 523.25, t: 2.1, d: 1.3 },  // C5
      { f: 392.00, t: 2.55, d: 1.5 }, // G4
      { f: 329.63, t: 3.05, d: 1.8 }, // E4
      { f: 349.23, t: 3.55, d: 1.2 }, // F4
      { f: 293.66, t: 3.95, d: 1.2 }, // D4
      { f: 261.63, t: 4.35, d: 1.8 }, // C4 warm resolve
    ];

    // Warm underlying dream pad chord
    [130.81, 196.0, 246.94, 329.63].forEach((padFreq) => {
      const pad = this.ctx.createOscillator();
      pad.type = 'sine';
      pad.frequency.setValueAtTime(padFreq, now);
      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0.001, now);
      padGain.gain.linearRampToValueAtTime(0.04, now + 0.8);
      padGain.gain.setValueAtTime(0.04, now + 3.8);
      padGain.gain.exponentialRampToValueAtTime(0.0005, now + 5.1);
      pad.connect(padGain);
      padGain.connect(this.master);
      pad.start(now);
      pad.stop(now + 5.2);
    });

    // Music box bell plucks
    lullabyNotes.forEach(({ f, t, d }) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      // Subtle harmonic overtone for celesta / music-box shimmer
      const overtone = this.ctx.createOscillator();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(f * 2, now + t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.14, now + t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + t + d);

      const overGain = this.ctx.createGain();
      overGain.gain.setValueAtTime(0.001, now + t);
      overGain.gain.linearRampToValueAtTime(0.03, now + t + 0.02);
      overGain.gain.exponentialRampToValueAtTime(0.0005, now + t + d * 0.6);

      osc.connect(gain);
      overtone.connect(overGain);
      gain.connect(this.master);
      overGain.connect(this.master);

      osc.start(now + t);
      overtone.start(now + t);
      osc.stop(now + t + d + 0.05);
      overtone.stop(now + t + d + 0.05);
    });
  }

  /**
   * Bright Morning Birds & Sunrise Chime when waking up!
   */
  playMorningSunrise() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99, 987.77]; // G major bright arpeggio
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.55);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.6);
    });
  }
}

export const sfx = new Sound2DEngine();
