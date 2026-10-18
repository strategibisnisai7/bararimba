import Phaser from 'phaser';
import type { AnimalDef } from '../config/levels';
import type { Effects } from '../systems/Effects';

/** Animals read small at the wide default zoom: every rescue target is drawn this much larger. */
const ANIMAL_BOOST = 1.35;

export type Mood = 'calm' | 'danger' | 'happy' | 'crying' | 'walk';

export class Animal {
  hp = 100;
  minHp = 100;
  mood: Mood = 'calm';
  private sprite: Phaser.GameObjects.Image;
  private alert: Phaser.GameObjects.Image;
  private bubble: Phaser.GameObjects.Graphics;
  private t = 0;
  private fxT = 0;
  private baseScale: number;
  /** Current feet position; only rescue walking moves it. */
  px: number;
  py: number;
  /** Reached the rescue flag. */
  arrived = false;
  /** Reached the goal of the last walk() (the flag or an intermediate stop such as a raft). */
  reached = false;
  private facing: number;
  private stride = 0;
  constructor(scene: Phaser.Scene, readonly def: AnimalDef, private effects: Effects) {
    this.baseScale = def.scale * ANIMAL_BOOST;
    this.px = def.x; this.py = def.y; this.facing = def.flip ? -1 : 1;
    this.sprite = scene.add.image(def.x, def.y + 4, def.key).setOrigin(.5, 1).setScale(this.baseScale).setFlipX(!!def.flip).setDepth(33);
    this.alert = scene.add.image(def.x, 0, 'alert').setScale(.42).setDepth(48).setVisible(false);
    this.bubble = scene.add.graphics().setDepth(47);
  }
  get x() { return this.px; }
  get headY() { return this.py - this.sprite.displayHeight * .8; }
  /** Walk toward the rescue flag at `goalX`. `blocked(x)` names what stops the next step ('' when clear);
   * the animal then waits there. Returns that blocker, or '' while walking or once arrived. */
  walk(dt: number, goalX: number, speed: number, ground: (x: number) => number, blocked: (x: number, dir: number) => string) {
    this.reached = Math.abs(goalX - this.px) < 1;
    if (this.reached) { if (this.mood === 'walk') this.setMood('calm'); return ''; }
    const dir = Math.sign(goalX - this.px) || 1, ahead = this.px + dir * (this.sprite.displayWidth * .45 + 6);
    const why = blocked(ahead, dir);
    if (why) { if (this.mood === 'walk') this.setMood('calm'); this.facing = dir; return why; }
    if (this.mood !== 'walk') this.setMood('walk');
    this.facing = dir;
    this.px += dir * Math.min(speed * dt, Math.abs(goalX - this.px));
    this.py = ground(this.px);
    this.stride += speed * dt;
    if (Math.abs(goalX - this.px) < 1) { this.reached = true; this.setMood('calm'); }
    return '';
  }
  /** Safe during the standard time; once critical, health drains over the critical window. */
  setCritical(remaining: number, window: number) {
    if (this.mood === 'happy' || this.mood === 'crying') return;
    this.hp = Math.max(0, 100 * remaining / window);
    this.minHp = Math.min(this.minHp, this.hp);
    this.mood = 'danger';
  }
  setMood(m: Mood) { this.mood = m; this.t = 0; }
  update(dt: number) {
    this.t += dt; this.fxT += dt;
    const s = this.baseScale, x = this.px, y = this.py + 4;
    this.alert.setVisible(this.mood === 'danger');
    this.bubble.clear();
    this.sprite.clearTint();
    // Rescue walking faces the way it goes; the art faces right, so flip when heading left.
    if (this.def.frames || this.mood === 'walk') this.sprite.setFlipX(this.facing < 0);
    if (this.mood === 'walk') {
      const poses = [this.def.key, ...(this.def.frames ?? [])], k = Math.floor(this.stride / 22) % poses.length;
      if (this.sprite.texture.key !== poses[k]) this.sprite.setTexture(poses[k]);
      const step = Math.abs(Math.sin(this.stride / 22 * Math.PI));
      this.sprite.setPosition(x, y - step * 3).setScale(s).setRotation(Math.sin(this.stride / 11) * .025);
      return;
    }
    if (this.def.frames && this.sprite.texture.key !== this.def.key) this.sprite.setTexture(this.def.key);
    if (this.mood === 'calm') this.sprite.setPosition(x, y).setScale(s, s * (1 + Math.sin(this.t * 2.4) * .012)).setRotation(0);
    if (this.mood === 'danger') {
      this.sprite.setPosition(x + Math.sin(this.t * 40) * 2, y).setScale(s).setRotation(0);
      this.alert.setPosition(x, this.headY - 34 + Math.sin(this.t * 8) * 4);
      const k = this.hp / 100;
      this.bubble.fillStyle(0x2a1a0e, .8).fillRoundedRect(x - 32, this.headY - 12, 64, 9, 4);
      this.bubble.fillStyle(k > .5 ? 0x7ad04a : k > .25 ? 0xf2c03c : 0xe5462e, 1).fillRoundedRect(x - 30, this.headY - 10, 60 * k, 5, 2);
    }
    if (this.mood === 'happy') {
      const hop = Math.abs(Math.sin(this.t * 7)) * 26;
      this.sprite.setPosition(x, y - hop).setScale(s * (1 + (hop < 3 ? .06 : 0)), s * (1 - (hop < 3 ? .06 : 0))).setRotation(Math.sin(this.t * 7) * .06);
      if (this.fxT > .35) { this.fxT = 0; this.effects.hearts(x, this.headY - hop, 2); }
    }
    if (this.mood === 'crying') {
      this.sprite.setPosition(x, y + 3).setScale(s * 1.02, s * .94).setRotation(Math.sin(this.t * 5) * .025).setTint(0xb8c6d8);
      if (this.fxT > .12) { this.fxT = 0; this.effects.tears(x + (this.def.flip ? -14 : 14), this.headY + 14); }
    }
  }
}
