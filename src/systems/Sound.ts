import { store } from './Save';

/** Synthesized audio (no source audio was supplied). Unlocked by a user gesture only. */
export class Sound {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private sprayNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private fireNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private musicTimer: number | undefined;
  private step = 0;
  get sfx() { return store.settings.sfx / 100; }
  get music() { return store.settings.music / 100; }
  unlock() {
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
      if (!this.noise) {
        const len = this.ctx.sampleRate * 2; this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      this.startMusic();
    } catch { /* audio optional */ }
  }
  private loop(type: BiquadFilterType, freq: number, q: number) {
    const ctx = this.ctx!; const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(f).connect(gain).connect(ctx.destination); src.start();
    return { src, gain };
  }
  spray(on: boolean) {
    if (!this.ctx || !this.noise) return;
    this.sprayNode ??= this.loop('bandpass', 1400, .7);
    this.sprayNode.gain.gain.setTargetAtTime(on ? .09 * this.sfx : 0, this.ctx.currentTime, .05);
  }
  fire(heat: number) {
    if (!this.ctx || !this.noise) return;
    this.fireNode ??= this.loop('lowpass', 520, 1.2);
    const crackle = heat > 0 ? Math.min(.07, heat * .025) * (.6 + Math.random() * .8) : 0;
    this.fireNode.gain.gain.setTargetAtTime(crackle * this.sfx, this.ctx.currentTime, .03);
  }
  hiss() { this.burst('highpass', 3000, .18, .05); }
  splash() { this.burst('lowpass', 900, .5, .18); }
  click() { this.tone([660], .04, .05); }
  private burst(type: BiquadFilterType, freq: number, dur: number, vol: number) {
    if (!this.ctx || !this.noise || !this.sfx) return;
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain(); const t = ctx.currentTime;
    g.gain.setValueAtTime(vol * this.sfx, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination); src.start(t, Math.random()); src.stop(t + dur);
  }
  private tone(hz: number[], gap: number, vol: number, type: OscillatorType = 'triangle', len = .28, master = this.sfx) {
    if (!this.ctx || !master) return; const ctx = this.ctx;
    hz.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * gap;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * master, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len + .02);
    });
  }
  chime() { this.tone([523, 659, 784], .08, .06); }
  win() { this.tone([523, 659, 784, 1047, 1319], .11, .07, 'triangle', .45); }
  fail() { this.tone([392, 330, 262, 196], .18, .06, 'sine', .5); }
  alarm() { this.tone([880, 660], .12, .04, 'square', .12); }
  private startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const scale = [392, 440, 523, 587, 659, 784, 880];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || !this.music) return;
      this.step++;
      const note = scale[(this.step * 3 + (this.step >> 2)) % scale.length];
      this.tone([note], 0, .025, 'sine', .9, this.music);
      if (this.step % 4 === 0) this.tone([note / 2], 0, .02, 'sine', 1.6, this.music);
    }, 420);
  }
  stopAll() { this.spray(false); this.fire(0); }
}
