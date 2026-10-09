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
}

export const sfx = new Sound2DEngine();
