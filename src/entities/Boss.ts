import Phaser from 'phaser';
import { clamp, type Point } from '../config/level';
import type { Surface, Hit } from '../physics/collision';
import { firstHit } from '../physics/collision';
import type { Effects } from '../systems/Effects';

/** `perches` are ledges the boss leaps between; `arena` is the river bank x — fires only start on the truck's side. */
/** `name`: shown in the level board and results (default "Pembakar Hutan"). */
/** `sprite`/`scale`: other boss art (Kalimantan); `muzzle`: where its attacks leave, relative to (x, y). */
export interface BossDef { x: number; y: number; hp: number; perches: Point[]; arena: number; name?: string; sprite?: string; scale?: number; muzzle?: Point;
  /** Attack interval multiplier while shielded (a sealed core only smoulders). */
  sealedPace?: number;
  /** Only ember balls (root guardians and peat hearts have no flamethrower). */
  noJet?: boolean }
interface Shot { kind: 'ball' | 'jet'; x: number; y: number; vx: number; vy: number; life: number; hp: number; img: Phaser.GameObjects.Image }

const G = 500;            // projectile gravity, px/s^2
const SCALE = .78;
// Gun muzzle in the 290x262 boss crop (origin bottom-centre).
const MUZZLE = { x: 12 - 145, y: 138 - 262 };

export interface BossContext {
  truck: { x: number; y: number; half: number };
  surfaces: Surface[];
  /** Kills airborne water drops within r of (x,y); returns how many. */
  hitWater: (x: number, y: number, r: number) => number;
  ignite: (x: number, y: number) => void;
  truckHit: (kind: 'ball' | 'jet') => void;
  /** Water drops predicted to reach (x, y) within `horizon` s. */
  incoming: (x: number, y: number, r: number, horizon: number) => number;
}

/** "Pembakar Hutan": leaps between ledges across the river, throws arcing fireballs that start new
 * fires on the truck's bank, and lobs a flamethrower stream. Water shoots both down and wears it down. */
export class Boss {
  hp: number;
  readonly max: number;
  defeated = false;
  /** Shielded: water bounces off as steam and does no damage (Sumatra braziers keep it up). */
  shielded = false;
  private shieldG?: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  private perch: number;
  private jump?: { from: Point; to: Point; t: number; dur: number };
  private jumpT = 12;
  private dodgeCool = 4;
  private charge = 0;
  /** Fire reserve: attacks spend it; when empty the boss must reload for 10 s. */
  fuel = 100;
  reloadT = 0;
  get reloading() { return this.reloadT > 0; }
  private hurtSinceJump = 0;
  private sprite: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private shots: Shot[] = [];
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private attackT = 2.2;
  private jetT = 0;
  private jetEmit = 0;
  private flash = 0;
  private sinceHit = 99;
  private t = 0;
  private deathT = 0;

  constructor(private scene: Phaser.Scene, readonly def: BossDef, private effects: Effects) {
    this.hp = this.max = def.hp;
    this.x = def.x; this.y = def.y;
    this.perch = Math.max(0, def.perches.findIndex(p => p.x === def.x));
    this.glow = scene.add.image(def.x, def.y - 100, 'p-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff5a1a).setScale(3).setAlpha(.25).setDepth(31);
    this.sprite = scene.add.image(def.x, def.y + 4, def.sprite ?? 'boss').setOrigin(.5, 1).setScale(def.scale ?? SCALE).setDepth(33);
    this.trail = scene.add.particles(0, 0, 'p-flame', {
      emitting: false, blendMode: Phaser.BlendModes.ADD, lifespan: { min: 220, max: 420 },
      speed: { min: 10, max: 50 }, scale: { start: .55, end: .1 }, alpha: { start: .85, end: 0 },
      color: [0xfff2a8, 0xffb030, 0xff5a10, 0x801000],
    }).setDepth(37);
  }
  get phase() { return this.hp > this.max * .66 ? 1 : this.hp > this.max * .33 ? 2 : 3; }
  get jumping() { return !!this.jump; }
  get muzzle(): Point { const m = this.def.muzzle; return m ? { x: this.x + m.x, y: this.y + m.y } : { x: this.x + MUZZLE.x * SCALE, y: this.y + MUZZLE.y * SCALE }; }
  /** Body hit zone for water. */
  get core(): Point { return this.def.sprite ? { x: this.x, y: this.y - this.sprite.displayHeight * .55 } : { x: this.x + 8, y: this.y - 105 }; }
  damage(n: number) {
    if (this.defeated) return;
    this.hp = Math.max(0, this.hp - n);
    this.flash = .12; this.sinceHit = 0; this.hurtSinceJump += n;
    if (this.hp <= 0) { this.defeated = true; this.deathT = 0; this.jump = undefined; this.clearShots(); }
  }
  /** Leap to a different ledge along a parabola. */
  private leap() {
    const opts = this.def.perches.map((_, i) => i).filter(i => i !== this.perch);
    if (!opts.length) { this.jumpT = 9; this.dodgeCool = 9; return; }   // rooted bosses never leap
    const next = opts[(Math.random() * opts.length) | 0];
    this.jump = { from: { x: this.x, y: this.y }, to: { ...this.def.perches[next] }, t: 0, dur: .75 + Math.random() * .2 };
    this.perch = next; this.hurtSinceJump = 0; this.jetT = 0;
    this.jumpT = [0, 12, 10, 8][this.phase] + Math.random() * 3;
    this.dodgeCool = [0, 6, 5, 4][this.phase];
    this.effects.dust(this.x, this.y); this.effects.ash(this.x, this.y - 40, 10);
  }
  private throwBall(tx: number, ty: number) {
    const m = this.muzzle, T = 1.2 + Math.random() * .6;
    this.shots.push({ kind: 'ball', x: m.x, y: m.y, vx: (tx - m.x) / T, vy: (ty - m.y - .5 * G * T * T) / T, life: 5, hp: 6,
      img: this.scene.add.image(m.x, m.y, 'fireball').setScale(.42).setDepth(38) });
    this.effects.ash(m.x, m.y, 6);
  }
  private shootJet(tx: number, ty: number) {
    const m = this.muzzle, dx = tx - m.x, T = Math.max(.6, Math.abs(dx) / 620);
    // Lobbed flame stream aimed to land on the truck across the river.
    const g = G * .25, vx = dx / T + (Math.random() - .5) * 30, vy = (ty - m.y - .5 * g * T * T) / T;
    this.shots.push({ kind: 'jet', x: m.x, y: m.y, vx, vy, life: T + .6, hp: 1,
      img: this.scene.add.image(m.x, m.y, 'p-flame').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff8a1c).setScale(.9).setDepth(38) });
  }
  update(dt: number, ctx: BossContext) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.sinceHit += dt;
    if (this.defeated) {
      this.deathT += dt;
      this.sprite.setTint(0x6b6b6b).setRotation(Math.min(.5, this.deathT * .6)).setAlpha(Math.max(0, 1 - this.deathT * .5));
      this.glow.setAlpha(Math.max(0, .25 - this.deathT * .2));
      if (Math.random() < dt * 14) this.effects.steam(this.x + (Math.random() - .5) * 120, this.y - Math.random() * 160, 2);
      return;
    }
    // Movement: scheduled leaps, plus a dodge after soaking up a burst of water.
    if (this.jump) {
      const j = this.jump; j.t += dt;
      const k = Math.min(1, j.t / j.dur);
      this.x = j.from.x + (j.to.x - j.from.x) * k;
      this.y = j.from.y + (j.to.y - j.from.y) * k - Math.sin(Math.PI * k) * 170;
      if (k >= 1) {
        this.jump = undefined; this.y = j.to.y;
        this.effects.dust(this.x, this.y); this.effects.ash(this.x, this.y - 10, 12);
        this.attackT = Math.min(this.attackT, .6);
      }
    } else {
      this.jumpT -= dt; this.dodgeCool -= dt;
      // Smart dodge: read the water stream; if a heavy volley is about to land, leap away (with a cooldown).
      const threat = this.dodgeCool <= 0 ? ctx.incoming(this.core.x, this.core.y, 70, .45) : 0;
      if (this.jumpT <= 0 || (threat > 18 && Math.random() < [0, .35, .5, .6][this.phase] * dt * 10)) this.leap();
    }
    // Water striking the body (a moving target is harder to hit).
    const hits = ctx.hitWater(this.core.x, this.core.y, 66);
    if (hits && this.shielded) { if (Math.random() < .5) this.effects.steam(this.core.x - 60, this.core.y, 1); }
    else if (hits) { this.damage(hits * .045); if (Math.random() < .5) this.effects.steam(this.core.x - 30, this.core.y, 1); }
    if (this.shielded || this.shieldG) {
      this.shieldG ??= this.scene.add.graphics().setDepth(34).setBlendMode(Phaser.BlendModes.ADD);
      const g = this.shieldG.clear();
      if (this.shielded) {
        const r = 92 + Math.sin(this.t * 4) * 4, c = this.core;
        g.fillStyle(0xff8a3a, .12).fillCircle(c.x, c.y, r).lineStyle(4, 0xffc070, .55 + Math.sin(this.t * 6) * .2).strokeCircle(c.x, c.y, r);
      }
    }
    const recoil = this.jetT > 0 ? Math.sin(this.t * 40) * 1.5 : 0;
    this.sprite.setPosition(this.x + recoil, this.y + 4 + (this.jump ? 0 : Math.sin(this.t * 2.2) * 1.5))
      .setRotation(this.jump ? -.15 : Math.sin(this.t * 1.3) * .015);
    this.flash > 0 ? this.sprite.setTintFill(0xffffff) : this.sprite.clearTint();
    if (this.phase === 3 && this.flash <= 0) this.sprite.setTint(0xffb8a0);
    this.glow.setPosition(this.charge > 0 ? this.muzzle.x : this.x, this.charge > 0 ? this.muzzle.y : this.y - 100)
      .setScale(3 + this.charge * 1.5).setAlpha(.18 + .08 * this.phase + Math.sin(this.t * 9) * .04 + this.charge * .5);
    if (!this.jump) this.attack(dt, ctx);   // no attacks mid-leap
    this.updateShots(dt, ctx);
  }
  private attack(dt: number, ctx: BossContext) {
    const tr = ctx.truck, ph = this.phase;
    if (this.reloadT > 0) {
      this.reloadT -= dt; this.charge = 0;
      if (Math.random() < dt * 4) this.effects.steam(this.muzzle.x, this.muzzle.y, 1);
      if (this.reloadT <= 0) { this.fuel = 100; this.attackT = 1.2; }
      return;
    }
    if (this.jetT > 0) {
      this.jetT -= dt; this.jetEmit += dt * 16;
      this.fuel = Math.max(0, this.fuel - dt * 21);
      while (this.jetEmit >= 1) { this.jetEmit--; this.shootJet(tr.x, tr.y - 70); }
      if (this.fuel <= 0) { this.jetT = 0; this.reloadT = 10; }
      return;
    }
    this.attackT -= dt;
    // Wind-up: the gun glows for a moment before every attack, giving the player time to react.
    this.charge = this.attackT < .7 ? 1 - this.attackT / .7 : 0;
    if (this.attackT > 0) return;
    this.attackT = ([0, 3.8, 3.1, 2.5][ph] + Math.random() * .8) * (this.shielded ? this.def.sealedPace ?? 1 : 1);
    if (!this.def.noJet && Math.random() < [0, .15, .25, .35][ph]) { this.jetT = 1.2; return; }
    const n = ph === 3 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const aimTruck = i === 0 && Math.random() < .5;
      const tx = aimTruck ? tr.x + (Math.random() - .5) * 60 : clamp(tr.x - 260 + Math.random() * 900, 0, this.def.arena - 40);
      this.throwBall(tx, aimTruck ? tr.y - 60 : 520);
      this.fuel = Math.max(0, this.fuel - 14);
    }
    if (this.fuel <= 0) this.reloadT = 10;
  }
  private updateShots(dt: number, ctx: BossContext) {
    const tr = ctx.truck;
    for (const s of this.shots) {
      if (s.life <= 0) continue;
      s.life -= dt;
      const gk = s.kind === 'ball' ? 1 : .25;
      const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt + .5 * G * gk * dt * dt;
      s.vy += G * gk * dt;
      // Water shoots projectiles down ("tahan semprotan air dan tekan balik").
      const wet = ctx.hitWater(nx, ny, s.kind === 'ball' ? 30 : 18);
      if (wet) { s.hp -= wet; if (s.hp <= 0) { this.effects.steam(nx, ny, s.kind === 'ball' ? 5 : 1); this.kill(s); continue; } }
      if (Math.abs(nx - tr.x) < tr.half && ny > tr.y - 160 && ny < tr.y) {
        ctx.truckHit(s.kind); this.effects.ash(nx, ny, s.kind === 'ball' ? 14 : 2); this.kill(s); continue;
      }
      const hit: Hit | null = firstHit({ x: s.x, y: s.y }, { x: nx, y: ny }, ctx.surfaces);
      if (hit) {
        if (s.kind === 'ball') {
          if (hit.surface.kind === 'river') this.effects.steam(hit.point.x, hit.point.y, 6);
          else if (hit.normal.y < -.5 && hit.point.x < this.def.arena && Math.abs(hit.point.x - (tr.x + tr.half + 130)) > 260) ctx.ignite(hit.point.x, hit.point.y);
          this.effects.ash(hit.point.x, hit.point.y, 16);
        }
        this.kill(s); continue;
      }
      s.x = nx; s.y = ny;
      s.img.setPosition(nx, ny).setRotation(Math.atan2(s.vy, s.vx) + Math.PI);
      if (s.kind === 'ball') this.trail.explode(2, nx, ny);
      else s.img.setScale(.9 + Math.max(0, 1.6 - s.life) * .6).setAlpha(Math.min(1, s.life * 2));
      if (s.life <= 0 || ny > 760) this.kill(s);
    }
    this.shots = this.shots.filter(s => s.life > 0);
  }
  private kill(s: Shot) { s.life = 0; s.img.destroy(); }
  private clearShots() { for (const s of this.shots) if (s.life > 0) this.kill(s); this.shots = []; }
  get active() { return this.shots.length; }
}
