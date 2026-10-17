import Phaser from 'phaser';
import { qualityFactor } from './Save';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/** Shared one-shot particle bursts. All emitters are created once and reused. */
export class Effects {
  private splashE: Emitter;
  private mistE: Emitter;
  private steamE: Emitter;
  private dustE: Emitter;
  private heartE: Emitter;
  private tearE: Emitter;
  private ashE: Emitter;
  reduced = false;

  constructor(scene: Phaser.Scene) {
    this.splashE = scene.add.particles(0, 0, 'p-drop', {
      emitting: false, lifespan: { min: 300, max: 700 }, speed: { min: 70, max: 260 }, angle: { min: 200, max: 340 },
      gravityY: 900, scale: { start: .42, end: .08 }, alpha: { start: .95, end: 0 }, tint: [0x7fd6ff, 0xc9f1ff, 0xffffff, 0x4fb8f0],
    }).setDepth(46);
    this.mistE = scene.add.particles(0, 0, 'p-soft', {
      emitting: false, lifespan: { min: 500, max: 900 }, speed: { min: 5, max: 40 }, scale: { start: .25, end: 1.1 },
      alpha: { start: .28, end: 0 }, tint: [0xe9f9ff, 0xcfefff], gravityY: 30,
    }).setDepth(45);
    this.steamE = scene.add.particles(0, 0, 'p-smoke', {
      emitting: false, lifespan: { min: 900, max: 1600 }, speedY: { min: -120, max: -60 }, speedX: { min: -20, max: 30 },
      scale: { start: .35, end: 1.5 }, alpha: { start: .62, end: 0 }, tint: [0xffffff, 0xeef8ff, 0xdde9ee], rotate: { min: 0, max: 360 },
    }).setDepth(44);
    this.dustE = scene.add.particles(0, 0, 'p-smoke', {
      emitting: false, lifespan: { min: 450, max: 800 }, speedX: { min: -70, max: -20 }, speedY: { min: -45, max: -10 },
      scale: { start: .18, end: .7 }, alpha: { start: .5, end: 0 }, tint: [0xd8c19a, 0xc9a77a, 0xe8dcc0], rotate: { min: 0, max: 360 },
    }).setDepth(22);
    this.heartE = scene.add.particles(0, 0, 'p-heart', {
      emitting: false, lifespan: 1400, speedY: { min: -110, max: -60 }, speedX: { min: -40, max: 40 },
      scale: { start: .9, end: .4 }, alpha: { start: 1, end: 0 },
    }).setDepth(47);
    this.tearE = scene.add.particles(0, 0, 'p-tear', {
      emitting: false, lifespan: 700, speedX: { min: -50, max: 50 }, speedY: { min: -60, max: -20 }, gravityY: 500,
      scale: { start: .9, end: .6 }, alpha: { start: 1, end: .2 },
    }).setDepth(47);
    this.ashE = scene.add.particles(0, 0, 'p-spark', {
      emitting: false, lifespan: { min: 1200, max: 2200 }, speedY: { min: -70, max: -20 }, speedX: { min: -30, max: 40 },
      scale: { start: .35, end: .1 }, alpha: { start: .9, end: 0 }, tint: [0x3b332c, 0x5c514a, 0xff7a2a],
    }).setDepth(36);
  }
  private n(count: number) { return Math.max(1, Math.round(count * qualityFactor() * (this.reduced ? .5 : 1))); }
  splash(x: number, y: number, count = 4) { this.splashE.explode(this.n(count), x, y); }
  mist(x: number, y: number) { this.mistE.explode(1, x, y); }
  steam(x: number, y: number, count = 1) { this.steamE.explode(this.n(count), x, y); }
  dust(x: number, y: number) { this.dustE.explode(this.n(1), x, y); }
  hearts(x: number, y: number, count = 3) { this.heartE.explode(count, x, y); }
  tears(x: number, y: number) { this.tearE.explode(1, x, y); }
  ash(x: number, y: number, count = 1) { this.ashE.explode(this.n(count), x, y); }
  bigSplash(x: number, y: number) {
    this.splash(x, y, 40); for (let i = 0; i < 10; i++) this.steam(x + (Math.random() - .5) * 160, y - Math.random() * 30, 1);
  }
}
