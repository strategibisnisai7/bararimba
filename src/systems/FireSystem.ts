import Phaser from 'phaser';
import { DROP_DAMAGE, FIRE_MAX, clamp, type Point } from '../config/level';
import type { FireDef } from '../config/levels';
import type { Effects } from './Effects';
import { qualityFactor } from './Save';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type P = Phaser.GameObjects.Particles.Particle & { s0?: number };

const mix = (a: number, b: number, t: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) + ((((b >> s) & 255) - ((a >> s) & 255)) * t));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** One burning spot built entirely from particles: flames, hot core, licks, embers, smoke, light. */
export class Fire {
  intensity: number;
  lit: boolean;
  wet = 0;
  spreadT = 0;
  scorchSize = 0;
  onRoad = false;
  everLit: boolean;
  private flame: Emitter;
  private core: Emitter;
  private licks: Emitter;
  private embers: Emitter;
  private smoke: Emitter;
  private glow: Phaser.GameObjects.Image;
  private light: Phaser.GameObjects.Image;
  private scorch: Phaser.GameObjects.Image;
  private base: Phaser.GameObjects.Image;
  private t = Math.random() * 10;
  private steamT = 0;

  constructor(scene: Phaser.Scene, readonly def: FireDef, readonly index: number) {
    const { x, y } = def;
    this.intensity = def.lit ? def.start : 0;
    this.lit = def.lit; this.everLit = def.lit;
    this.scorch = scene.add.image(x, y + 3, 'p-soft').setTint(0x1a0d05).setAlpha(0).setDepth(29);
    this.light = scene.add.image(x, y, 'p-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff9a3c).setDepth(29).setAlpha(0);
    this.base = scene.add.image(x, y + 6, 'coal-hot').setOrigin(.5, 1).setDepth(31).setVisible(this.lit);
    this.glow = scene.add.image(x, y - 40, 'p-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff6a1a).setDepth(32).setAlpha(0);
    const self = this;
    const zone = (spread: number, lift: number) => ({
      getRandomPoint(p: Phaser.Types.Math.Vector2Like) {
        const w = 14 + spread * self.intensity;
        p.x = (Math.random() + Math.random() - 1) * w;
        p.y = -Math.random() * 6 - lift * self.intensity;
        return p;
      },
    });
    const sized = (base: number, grow: number, shrink: number) => ({
      onEmit: (q?: Phaser.GameObjects.Particles.Particle, key?: string) => {
        const p = q as P;
        if (key === 'scaleX' || p.s0 === undefined) p.s0 = (base + grow * this.intensity) * (.7 + Math.random() * .6);
        return p.s0!;
      },
      onUpdate: (p: Phaser.GameObjects.Particles.Particle & { s0?: number }, _k: string, t: number) => (p.s0 ?? 1) * (1 - t * shrink),
    });
    this.smoke = scene.add.particles(x, y, 'p-smoke', {
      frequency: 90, blendMode: Phaser.BlendModes.NORMAL,
      emitZone: { type: 'random', source: zone(26, 150) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource },
      lifespan: { min: 2200, max: 3400 }, speedY: { min: -78, max: -42 }, speedX: { min: 6, max: 28 },
      rotate: { min: 0, max: 360 }, tint: [0x2d2a28, 0x3e3a36, 0x56504a, 0x6b645c],
      scale: { onEmit: (q?: Phaser.GameObjects.Particles.Particle, key?: string) => { const p = q as P; if (key === 'scaleX' || p.s0 === undefined) p.s0 = .45 + .55 * this.intensity; return p.s0!; },
        onUpdate: (p: Phaser.GameObjects.Particles.Particle & { s0?: number }, _k: string, t: number) => (p.s0 ?? 1) * (.6 + 1.9 * t) },
      alpha: { onEmit: () => 0, onUpdate: (_p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) => Math.sin(Math.PI * t) * (.3 + .14 * Math.min(1, this.intensity)) },
    }).setDepth(30);
    this.flame = scene.add.particles(x, y, 'p-flame', {
      frequency: 20, blendMode: Phaser.BlendModes.NORMAL,
      emitZone: { type: 'random', source: zone(52, 0) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource },
      lifespan: { onEmit: () => (620 + 520 * this.intensity) * (.75 + Math.random() * .5) },
      speedY: { onEmit: () => -(85 + 115 * this.intensity) * (.8 + Math.random() * .4) },
      speedX: { min: -26, max: 26 }, accelerationY: -110,
      scale: sized(.85, .95, .9),
      alpha: { onEmit: () => 0, onUpdate: (_p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) => t < .06 ? t * 16 : t < .32 ? .96 : Math.max(0, .96 * (1 - (t - .32) / .45)) },
      rotate: { min: -14, max: 14 },
      color: [0xffc23a, 0xff8f1f, 0xf0581a, 0xc8300c, 0x7a1806], colorEase: 'sine.in',
    }).setDepth(34);
    this.core = scene.add.particles(x, y, 'p-flame', {
      frequency: 28, blendMode: Phaser.BlendModes.NORMAL,
      emitZone: { type: 'random', source: zone(26, 0) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource },
      lifespan: { min: 260, max: 520 }, speedY: { min: -120, max: -50 }, speedX: { min: -10, max: 10 },
      scale: sized(.5, .5, .75), alpha: { start: .95, end: 0 },
      color: [0xfffbe0, 0xffe680, 0xffc23a, 0xff8a1c], colorEase: 'sine.out',
    }).setDepth(35);
    this.licks = scene.add.particles(x, y, 'tongue-a', {
      frequency: 160, blendMode: Phaser.BlendModes.NORMAL,
      emitZone: { type: 'random', source: zone(24, 8) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource },
      lifespan: { min: 420, max: 760 }, speedY: { min: -160, max: -70 }, speedX: { min: -12, max: 12 },
      scale: sized(.45, .5, .55), alpha: { start: .95, end: 0 }, rotate: { min: -14, max: 14 },
    }).setDepth(35);
    this.embers = scene.add.particles(x, y, 'p-spark', {
      frequency: 80, blendMode: Phaser.BlendModes.ADD,
      emitZone: { type: 'random', source: zone(44, 60) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource },
      lifespan: { min: 1100, max: 2200 }, speedY: { min: -170, max: -60 }, speedX: { min: -45, max: 55 }, gravityY: -15,
      scale: { start: .38, end: 0 }, alpha: { start: 1, end: .1 },
      color: [0xffffd0, 0xffb030, 0xff4a10, 0x801000],
    }).setDepth(36);
    if (!this.lit) this.setEmitting(false);
  }

  get height() { return 70 + 130 * this.intensity; }
  get top(): Point { return { x: this.def.x, y: this.def.y - this.height * .8 }; }
  contains(px: number, py: number) {
    if (!this.lit) return false;
    const rx = 40 + 52 * this.intensity, ry = this.height * .55, cy = this.def.y - ry * .9;
    return ((px - this.def.x) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
  }
  private setEmitting(on: boolean) {
    for (const e of [this.flame, this.core, this.licks, this.embers, this.smoke]) on ? e.start() : e.stop();
  }
  ignite(start: number) {
    this.lit = true; this.everLit = true; this.intensity = Math.max(start, .3); this.spreadT = 0;
    this.base.setTexture('coal-hot').setVisible(true).clearTint();
    this.setEmitting(true);
  }
  extinguish() {
    this.lit = false; this.intensity = 0; this.wet = 12; this.steamT = 3.5;
    this.setEmitting(false);
    this.base.setTexture('coal-cold');
  }
  update(dt: number, effects: Effects, reduced: boolean) {
    this.t += dt;
    if (this.wet > 0) this.wet -= dt;
    if (!this.lit) {
      this.glow.setAlpha(Math.max(0, this.glow.alpha - dt * 2));
      this.light.setAlpha(Math.max(0, this.light.alpha - dt * 2));
      if (this.steamT > 0) { this.steamT -= dt; if (Math.random() < dt * 5) effects.steam(this.def.x + (Math.random() - .5) * 40, this.def.y - 6); }
      return;
    }
    const i = this.intensity, q = qualityFactor() * (reduced ? .55 : 1);
    this.scorchSize = Math.max(this.scorchSize, i);
    this.flame.frequency = Math.max(5, (26 - 13 * i) / q);
    this.core.frequency = Math.max(10, (40 - 14 * i) / q);
    this.embers.frequency = Math.max(25, (150 - 70 * i) / q);
    this.smoke.frequency = Math.max(45, (150 - 55 * i) / q);
    this.licks.frequency = Math.max(70, (220 - 80 * i) / q);
    const flicker = .85 + Math.sin(this.t * 13) * .08 + Math.sin(this.t * 31) * .05 + Math.random() * .05;
    this.glow.setPosition(this.def.x, this.def.y - this.height * .45).setScale((1.6 + 1.8 * i) * flicker).setAlpha(.16 * flicker);
    this.light.setScale(3 + 3.2 * i, .5 + .4 * i).setAlpha(.55 * flicker);
    this.scorch.setScale(1.2 + 2.6 * this.scorchSize, .3 + .2 * this.scorchSize).setAlpha(.6);
    this.base.setScale(.55 + .28 * Math.min(i, 1.2)).setTint(mix(0xffffff, 0xffd0a0, flicker - .8));
  }
  destroy() {
    for (const o of [this.flame, this.core, this.licks, this.embers, this.smoke, this.glow, this.light, this.scorch, this.base]) o.destroy();
  }
}

export interface Fuel { image: Phaser.GameObjects.Image; burn: number }

export class FireSystem {
  readonly fires: Fire[];
  attract = false;
  constructor(private scene: Phaser.Scene, defs: FireDef[], private effects: Effects, private spreadDelay: number,
    private fuel: Map<number, Fuel>, private onOut: (f: Fire) => void, private onSpread: (f: Fire) => void) {
    this.fires = defs.map((d, i) => new Fire(scene, d, i));
  }
  hit(f: Fire) {
    if (!f.lit) return;
    f.intensity -= DROP_DAMAGE * (this.attract ? .25 : 1);
    if (this.attract && f.intensity < .5) f.intensity = .5;
    if (f.intensity <= 0) { f.extinguish(); this.effects.steam(f.def.x, f.def.y - 20, 8); this.onOut(f); }
  }
  /** Area douse (falling water tank). */
  douse(x: number, y: number, radius: number, amount: number) {
    for (const f of this.fires) {
      if (!f.lit || Math.hypot(f.def.x - x, f.def.y - y) > radius) continue;
      f.intensity -= amount;
      if (f.intensity <= 0) { f.extinguish(); this.onOut(f); }
    }
  }
  update(dt: number, reduced: boolean) {
    for (const f of this.fires) {
      if (f.lit) {
        f.intensity = Math.min(f.def.max ?? FIRE_MAX, f.intensity + f.def.growth * dt * (this.attract ? 0 : 1));
        if (!this.attract && f.intensity >= Math.min(1, f.def.max ?? 1)) {
          f.spreadT += dt;
          if (f.spreadT >= this.spreadDelay) { f.spreadT = 0; this.spreadFrom(f); }
        }
      }
      f.update(dt, this.effects, reduced);
      const fuel = this.fuel.get(f.index);
      if (fuel) {
        if (f.lit) fuel.burn = Math.min(1, fuel.burn + dt * .09);
        fuel.image.setTint(mix(0xffffff, 0x4a3022, fuel.burn * .85));
        if (f.lit && Math.random() < dt * 4 * fuel.burn) this.effects.ash(fuel.image.x + (Math.random() - .5) * fuel.image.displayWidth * .6, fuel.image.y - fuel.image.displayHeight * (.3 + Math.random() * .5));
      }
    }
  }
  private spreadFrom(src: Fire) {
    let best: Fire | null = null, bestD = 440;
    for (const f of this.fires) {
      if (f.lit || f.wet > 0 || f === src) continue;
      const d = Math.hypot(f.def.x - src.def.x, f.def.y - src.def.y);
      if (d < bestD) { bestD = d; best = f; }
    }
    if (best) { best.ignite(best.def.start); this.onSpread(best); }
  }
  /** Start a new fire at runtime (boss fireballs). Returns false if one already burns nearby. */
  spawn(x: number, y: number) {
    if (this.fires.some(f => f.lit && Math.hypot(f.def.x - x, f.def.y - y) < 70)) return false;
    if (this.burning.length >= 10) return false;
    const f = new Fire(this.scene, { x, y, start: .35, growth: .006, lit: true, max: 1.1 }, this.fires.length);
    this.fires.push(f);
    return true;
  }
  get burning() { return this.fires.filter(f => f.lit); }
  get outCount() { return this.fires.filter(f => f.everLit && !f.lit).length; }
  get heat() { return this.fires.reduce((s, f) => s + (f.lit ? Math.max(0, f.intensity - .3) : 0), 0); }
  destroy() { for (const f of this.fires) f.destroy(); }
}
