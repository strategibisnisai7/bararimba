import Phaser from 'phaser';
import type { CartDef, EmberDef, FirebreakDef, GondolaDef, LureDef, NestDef, RootDef, StalactiteDef, SumatraDef } from '../config/sumatraLevels';
import type { Surface } from '../physics/collision';
import type { Animal } from '../entities/Animal';
import type { Fire, FireSystem } from '../systems/FireSystem';
import type { Effects } from '../systems/Effects';
import type { World } from './World';

/** What the trials need from the running level; wired by the scene once its systems exist. */
export interface TrialHooks { fires: FireSystem; effects: Effects; hitWater(x: number, y: number, r: number): number;
  /** Boss core and whether its shield is up (boss levels). */
  boss?(): { x: number; y: number; shielded: boolean } | null }
interface Context { animal(): Animal | undefined; hooks(): TrialHooks | undefined; event(msg: string): void; flagX: number;
  /** Kit dial value (0..1) and done ids, for a cable ferry wound by a dial. */
  dial(id: string): number; done(id: string): boolean }

type Img = Phaser.GameObjects.Image;
type Gfx = Phaser.GameObjects.Graphics;
interface Root { def: RootDef; f: number; dry: number; latched: boolean; warn: number; surface: Surface; g: Gfx }
interface Spike { def: StalactiteDef; hits: number; state: 'hang' | 'fall' | 'down'; y: number; vy: number; shake: number; sprite: Img; surface: Surface; g: Gfx }
interface Cell { x: number; wet: number; bush: Img; lit: boolean }
interface Lure { def: LureDef; i: number; hits: number; state: 'hang' | 'fall' | 'bait' | 'eaten' | 'burnt'; x: number; y: number; vy: number; t: number; surface: Surface }
interface Ember { x: number; y: number; vy: number; hp: number; img: Img; glow: Img }
interface Cart { def: CartDef; x: number; v: number; sink: number; latched: boolean; rim: number; surface: Surface; g: Gfx }
interface Gondola { def: GondolaDef; f: number; phase: 'go' | 'docked' | 'ride' | 'home'; warned: boolean; g: Gfx; raft?: Phaser.GameObjects.Image }

const CART_W = 110, CART_H = 60;

/** Sumatra levels 2-10 to 2-19: one mechanism each, all driven by the same water drops, fires and Matter
 * collision as the rest of the game. `failed` names how a rescue was lost (the scene ends the level). */
export class SumatraTrials {
  failed = '';
  private t = 0;
  private root?: Root;
  private herdGoal?: number;
  private herdTold = false;
  private spikes: Spike[] = [];
  private brk?: { def: FirebreakDef; cells: Cell[]; front: number; t: number; held: boolean; coals: Img; glow: Img; ring: Gfx };
  private lures: Lure[] = [];
  private lureG?: Gfx;
  private eating = 0;
  private ember?: { def: EmberDef; next: number; warn?: { x: number; t: number }; list: Ember[]; g: Gfx; shot: number };
  private cart?: Cart;
  private nest?: { def: NestDef; wet: number; wobble: number; g: Gfx; surface: Surface };
  private gondola?: Gondola;

  constructor(private scene: Phaser.Scene, private world: World, private def: SumatraDef, private ctx: Context) {
    if (def.root) this.makeRoot(def.root);
    for (const d of def.stalactites ?? []) this.makeSpike(d, this.spikes.length);
    if (def.firebreak) this.makeFirebreak(def.firebreak);
    if (def.lures) { this.lureG = scene.add.graphics().setDepth(19); def.lures.forEach((d, i) => this.makeLure(d, i)); }
    if (def.embers) this.ember = { def: def.embers, next: 2.5, list: [], g: scene.add.graphics().setDepth(15.6), shot: 0 };
    if (def.cart) this.makeCart(def.cart);
    if (def.nest) this.makeNest(def.nest);
    if (def.gondola) this.makeGondola(def.gondola);
  }

  // ---------- building ----------
  /** Water-only target the drop is swallowed by (same 'handle' kind as the valve wheels). */
  private sensor(x: number, y: number, w: number, h: number, kind: Surface['kind'] = 'handle') {
    const body = this.scene.matter.add.rectangle(x, y, w, h, { isStatic: true, isSensor: true, label: 'trial' });
    const surface: Surface = { body, kind, enabled: true };
    this.world.surfaces.push(surface);
    return surface;
  }
  private place(s: Surface, x: number, y: number) { this.scene.matter.body.setPosition(s.body, { x, y }); }
  private makeRoot(d: RootDef) {
    this.root = { def: d, f: .06, dry: 0, latched: false, warn: 0, surface: this.sensor(d.x, d.y - 14, 70, 70), g: this.scene.add.graphics().setDepth(20) };
  }
  private makeSpike(d: StalactiteDef, i: number) {
    const s = this.scene;
    const sprite = s.add.image(d.x, d.top - 6, ['sm-stalactite-a', 'sm-stalactite-b', 'sm-stalactite-c'][i % 3]).setOrigin(.5, 0).setDepth(16);
    sprite.setScale(d.len / sprite.height * 1.05);
    if (d.opens) s.add.image(d.x, this.world.groundAt(d.x) + 6, 'button').setOrigin(.5, 1).setScale(.42).setDepth(14);
    this.spikes.push({ def: d, hits: 0, state: 'hang', y: d.top - 6, vy: 0, shake: 0, sprite, surface: this.sensor(d.x, d.top + d.len / 2, 46, d.len), g: s.add.graphics().setDepth(16.5) });
  }
  private makeFirebreak(d: FirebreakDef) {
    const s = this.scene, ground = (x: number) => this.world.groundAt(x);
    const coals = s.add.image(d.source.x, d.source.y + 6, 'sm-coals').setOrigin(.5, 1).setScale(.55).setDepth(17);
    const glow = s.add.image(d.source.x, d.source.y - 20, 'p-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff5a14).setScale(2.4).setDepth(17.5);
    const peat = s.add.graphics().setDepth(11.5);
    for (const x of d.cells) peat.fillStyle(0x2a1a10, .8).fillEllipse(x, ground(x) + 2, 120, 16);
    peat.fillStyle(0x2a1a10, .8).fillRect(d.source.x, d.source.y - 6, d.cells[0] - d.source.x, 10);
    const cells = d.cells.map((x, i) => ({ x, wet: 0, lit: false,
      bush: s.add.image(x, ground(x) + 8, i % 2 ? 'sm-bush-red' : 'sm-jungle-bush').setOrigin(.5, 1).setScale(i % 2 ? .75 : .5).setTint(0xc8a868).setDepth(16) }));
    this.brk = { def: d, cells, front: -1, t: d.first, held: false, coals, glow, ring: s.add.graphics().setDepth(16.5) };
  }
  private makeLure(d: LureDef, i: number) {
    this.lures.push({ def: d, i, hits: 0, state: 'hang', x: d.x, y: d.y + d.rope, vy: 0, t: i * 1.7, surface: this.sensor(d.x, d.y + d.rope, 60, 72) });
  }
  private cartFloor(x: number) {
    const d = this.cart?.def ?? this.def.cart!, mid = (d.x0 + d.x1) / 2, u = (x - mid) / ((d.x1 - d.x0) / 2);
    return d.y + d.dip * (1 - u * u);
  }
  private makeCart(d: CartDef) {
    const s = this.scene, M = s.matter;
    // Valley floor: the rails' parabola as short static slabs so water lands on it and runs to the bottom.
    const n = 12, step = (d.x1 - d.x0) / n, mid = (d.x0 + d.x1) / 2;
    this.cart = { def: d, x: d.start, v: 0, sink: 0, latched: false, rim: 0, surface: this.sensor(d.start, 0, CART_W, CART_H, 'raft'), g: s.add.graphics().setDepth(20) };
    for (let i = 0; i < n; i++) {
      const xa = d.x0 + i * step, xb = xa + step, xm = (xa + xb) / 2;
      if (Math.abs(xm - mid) < d.slot / 2) continue;   // the slot is open
      const ya = this.cartFloor(xa), yb = this.cartFloor(xb), a = Math.atan2(yb - ya, step), len = Math.hypot(step, yb - ya) + 4;
      const body = M.add.rectangle(xm + Math.sin(a) * 10, (ya + yb) / 2 + Math.cos(a) * 10, len, 20, { isStatic: true, angle: a, label: 'terrain' });
      this.world.surfaces.push({ body, kind: 'terrain', enabled: true });
    }
    // Earth under the rails, drawn once (the cart and its slot are redrawn every frame).
    const fill = s.add.graphics().setDepth(10.4), pts: { x: number; y: number }[] = [];
    for (let x = d.x0 - 10; x <= d.x1 + 10; x += 10) pts.push({ x, y: this.cartFloor(Math.min(d.x1, Math.max(d.x0, x))) });
    fill.fillStyle(0x4a3a2a, 1).fillPoints([...pts, { x: d.x1 + 10, y: 780 }, { x: d.x0 - 10, y: 780 }], true);
    fill.fillStyle(0x6b5238, 1).fillPoints([...pts, ...pts.map(p => ({ x: p.x, y: p.y + 12 })).reverse()], true);
    fill.fillStyle(0x140e09, 1).fillRect(mid - d.slot / 2, this.cartFloor(mid) - 2, d.slot, 120);
    fill.lineStyle(6, 0x3a2a1c, 1).strokePoints(pts.map(p => ({ x: p.x, y: p.y - 4 })), false);
    fill.lineStyle(3, 0xb8b0a0, 1).strokePoints(pts.map(p => ({ x: p.x, y: p.y - 7 })), false);
    for (const p of pts) if (Math.abs(p.x - mid) >= d.slot / 2) fill.fillStyle(0x5a3a1c, 1).fillRect(p.x - 3, p.y - 8, 6, 10);
  }
  private makeNest(d: NestDef) {
    this.nest = { def: d, wet: 0, wobble: 0, g: this.scene.add.graphics().setDepth(32), surface: this.sensor(d.x, d.y - 20, 84, 40) };
  }
  private makeGondola(d: GondolaDef) {
    const s = this.scene;
    if (d.block) {
      // Timber pylon carrying the cable over the river; its saddle is what burns.
      const x = d.a.x + (d.b.x - d.a.x) * d.block.at, y = d.a.y + (d.b.y - d.a.y) * d.block.at + d.sag * Math.sin(Math.PI * d.block.at);
      const g = s.add.graphics().setDepth(14);
      g.fillStyle(0x5a3a1c, 1).fillTriangle(x - 46, 700, x - 8, y, x - 2, 700).fillTriangle(x + 46, 700, x + 8, y, x + 2, 700);
      g.lineStyle(5, 0x3a2410, 1);
      for (let k = 1; k < 5; k++) { const yy = y + (700 - y) * k / 5, w = 8 + 38 * k / 5; g.lineBetween(x - w, yy, x + w, yy); }
      g.fillStyle(0x7a5228, 1).fillRect(x - 22, y - 2, 44, 12);
    }
    for (const p of [d.a, d.b]) s.add.image(p.x + (p === d.a ? -30 : 30), p.y + d.drop + 8, 'sm-aframe').setOrigin(.5, 1).setScale(.9).setDepth(15);
    s.add.image(d.a.x - 30, d.a.y - 10, 'sm-pulley-single').setScale(.5).setDepth(16);
    s.add.image(d.b.x + 30, d.b.y - 10, 'sm-pulley-single').setScale(.5).setDepth(16);
    this.gondola = { def: d, f: 0, phase: 'go', warned: false, g: s.add.graphics().setDepth(21),
      raft: d.look === 'raft' ? s.add.image(d.a.x, d.a.y + d.drop, 'k-raft').setOrigin(.5, .35).setScale(.5).setDepth(21) : undefined };
  }

  // ---------- queries ----------
  isDone(id: string): boolean | undefined {
    if (this.root?.def.id === id) return this.root.latched;
    if (this.brk?.def.id === id) return this.brk.held;
    if (this.cart?.def.id === id) return this.cart.latched;
    if (this.nest?.def.id === id) return this.nest.def.fires.every(i => !this.fire(i)?.lit);
    const g = this.gondola;
    if (g?.def.id && id === g.def.id) return g.phase !== 'go';
    if (g?.def.id && id === `${g.def.id}:home`) return g.phase === 'home';
    return undefined;
  }
  private fire(i: number) { return this.ctx.hooks()?.fires.fires[i]; }
  /** A fallen stalactite rests in this pit. */
  fills(p: { x0: number; x1: number }) { return this.spikes.some(s => s.state === 'down' && s.def.x > p.x0 && s.def.x < p.x1); }
  /** Where the animal heads now; undefined when no trial steers it. */
  walkGoal(): number | 'wait' | 'ride' | undefined {
    if (this.def.herd) return this.herdGoal ?? 'wait';
    if (this.lures.length) {
      if (this.eating > 0) return 'wait';
      const a = this.ctx.animal(), baits = this.lures.filter(l => l.state === 'bait');
      if (baits.length && a) return baits.reduce((b, l) => Math.abs(l.x - a.px) < Math.abs(b.x - a.px) ? l : b).x;
      return this.lures.every(l => l.state === 'eaten') ? undefined : 'wait';
    }
    const g = this.gondola;
    if (g && g.phase !== 'home') return g.phase === 'docked' ? this.car(g).x : g.phase === 'ride' ? 'ride' : 'wait';
    return undefined;
  }
  /** The animal reached an intermediate goal; true when a trial took it. */
  reached(): boolean {
    const a = this.ctx.animal();
    if (this.def.herd) { this.herdGoal = undefined; return true; }
    if (this.lures.length && a) {
      const bait = this.lures.find(l => l.state === 'bait' && Math.abs(l.x - a.px) < 4);
      if (bait) { bait.state = 'eaten'; this.eating = 1.8; this.ctx.hooks()?.effects.hearts(a.x, a.headY, 4); this.ctx.event(`${this.lureLeft ? 'Nyam! Masih ada madu lain.' : 'Madu terakhir! Beruang madu menuju bendera.'}`); }
      return true;
    }
    const g = this.gondola;
    if (g && g.phase === 'docked') { g.phase = 'ride'; this.ctx.event('Orangutan naik! Semprot kincir di BAWAH porosnya untuk menarik kereta pulang.'); return true; }
    return false;
  }
  private get lureLeft() { return this.lures.filter(l => l.state !== 'eaten').length; }
  /** No "the way is open" toast when the animal is steered step by step. */
  get quietFree() { return !!(this.def.herd || this.def.lures || this.def.embers || this.def.gondola); }
  surfaceAt(x: number): number | null {
    let top: number | null = null;
    const take = (y: number) => { top = top === null ? y : Math.min(top, y); };
    const r = this.root;
    if (r?.latched && (x - r.def.x) * r.def.dir >= -4 && (x - r.def.x) * r.def.dir <= r.def.len + 4) take(r.def.y - 4);
    const c = this.cart;
    if (c && x >= c.def.x0 && x <= c.def.x1) {
      const mid = (c.def.x0 + c.def.x1) / 2;
      if (Math.abs(x - mid) > c.def.slot / 2 || c.latched) take(this.cartFloor(x));
    }
    const g = this.gondola;
    if (g && (g.phase === 'docked' || g.phase === 'home')) { const p = this.car(g); if (Math.abs(x - p.x) < 80) take(p.floor); }
    return top;
  }
  /** Cable point and floor of the car at its current travel. */
  private car(g: Gondola) {
    const { a, b, sag, drop } = g.def, f = g.f;
    const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f + sag * Math.sin(Math.PI * f);
    return { x, y, floor: y + drop };
  }

  // ---------- water ----------
  /** A drop struck `s`; true when a trial took it. */
  waterHit(s: Surface, d: { vx: number; vy: number }) {
    const r = this.root;
    if (r && s === r.surface) {
      if (r.def.fire !== undefined && this.fire(r.def.fire)?.lit) {
        if ((r.warn -= 1) <= 0) { r.warn = 90; this.ctx.event('Pangkal akar terbakar! Padamkan apinya dulu.'); }
      } else { r.f = Math.min(1, r.f + 1 / r.def.need); r.dry = 0; }
      return true;
    }
    const sp = this.spikes.find(q => q.surface === s);
    if (sp) {
      sp.shake = .18;
      if (++sp.hits >= sp.def.need && sp.state === 'hang') { sp.state = 'fall'; sp.surface.enabled = false; this.ctx.event('Stalaktit retak dan runtuh!'); }
      return true;
    }
    const lu = this.lures.find(q => q.surface === s);
    if (lu) {
      if (++lu.hits >= lu.def.hp && lu.state === 'hang') { lu.state = 'fall'; lu.vy = 0; lu.surface.enabled = false; this.ctx.event('Tali putus — sarang madu jatuh!'); }
      return true;
    }
    const c = this.cart;
    if (c && s === c.surface) { if (!c.latched) c.v += d.vx * 1.6e-3; return true; }
    const n = this.nest;
    if (n && s === n.surface) {
      n.wet++; n.wobble = .25;
      if (n.wet === Math.round(n.def.limit * .5) || n.wet === Math.round(n.def.limit * .8)) this.ctx.event('Awas! Sarang rangkong makin basah.');
      if (n.wet > n.def.limit && !this.failed) this.failed = 'Sarang rangkong basah kuyup dan telurnya jatuh!';
      return true;
    }
    return false;
  }
  /** Where a drop splashed down (ground, rock or anything else): herding and wet firebreak bushes. */
  splash(x: number, y: number) {
    const a = this.ctx.animal(), h = this.def.herd;
    if (h && a && !a.arrived && Math.abs(x - a.px) < h.radius && y > a.py - 170 && y < a.py + 30) {
      const dir = x < a.px ? 1 : -1;
      this.herdGoal = Phaser.Math.Clamp(a.px + dir * h.push, h.min, this.ctx.flagX);
      if (!this.herdTold) { this.herdTold = true; this.ctx.event(`${dir > 0 ? 'Rusa terkejut dan lari menjauhi cipratan!' : 'Rusa takut cipratan di depannya dan mundur!'}`); }
    }
    const b = this.brk;
    if (b) for (const c of b.cells) if (!c.lit && Math.abs(x - c.x) < 62 && Math.abs(y - this.world.groundAt(c.x)) < 80) c.wet = Math.min(1, c.wet + .005);
  }

  // ---------- update ----------
  update(dt: number, playing: boolean) {
    this.t += dt;
    if (this.root) this.updateRoot(this.root, dt);
    for (const s of this.spikes) this.updateSpike(s, dt);
    if (this.brk) this.updateFirebreak(dt, playing);
    if (this.lureG) this.updateLures(dt);
    if (this.ember) this.updateEmbers(dt, playing);
    if (this.cart) this.updateCart(this.cart, dt);
    if (this.nest) this.updateNest(dt);
    if (this.gondola) this.updateGondola(this.gondola, dt);
  }
  private updateRoot(r: Root, dt: number) {
    const d = r.def;
    if (!r.latched) {
      r.dry += dt;
      if (r.dry > .9) r.f = Math.max(.06, r.f - .05 * dt);
      if (r.f >= 1) { r.latched = true; r.surface.enabled = false; this.ctx.event('Akar menyentuh tebing seberang — jembatan akar jadi!'); }
    }
    const len = d.len * r.f, tipX = d.x + d.dir * len;
    this.place(r.surface, tipX, d.y - 14);
    // Bark tapering from the knotted foot to the green tip, a little leafy, swaying while it grows.
    const g = r.g.clear(), n = Math.max(2, Math.ceil(len / 18)), top: { x: number; y: number }[] = [], bot: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = d.x + d.dir * len * k, sway = r.latched ? 0 : Math.sin(this.t * 2 + k * 4) * 3 * k;
      const cy = d.y - 12 + sway + Math.sin(k * 9) * 2, th = 26 - 14 * k;
      top.push({ x, y: cy - th / 2 }); bot.push({ x, y: cy + th / 2 });
    }
    g.fillStyle(0x4a2f18, 1).fillPoints([...top, ...bot.reverse()], true);
    g.lineStyle(3, 0x8a5a30, .9).strokePoints(top, false);
    g.fillStyle(0x3a2412, 1).fillEllipse(d.x, d.y - 8, 54, 34);
    for (let x = 30; x < len - 10; x += 46) g.fillStyle(0x5fae4a, 1).fillEllipse(d.x + d.dir * x, d.y - 24 - (x % 3) * 3, 18, 9);
    if (!r.latched) {
      const pulse = 1 + Math.sin(this.t * 6) * .15;
      g.fillStyle(0x8fe07a, 1).fillCircle(tipX, d.y - 13, 9);
      g.lineStyle(3, r.dry < .3 ? 0x7fd0ff : 0xffe08a, .9).strokeCircle(tipX, d.y - 13, 24 * pulse);
    }
  }
  private updateSpike(s: Spike, dt: number) {
    const d = s.def, fx = this.ctx.hooks()?.effects;
    if (s.state === 'hang') {
      s.shake = Math.max(0, s.shake - dt);
      const k = s.hits / d.need;
      s.sprite.setX(d.x + (s.shake > 0 ? Math.sin(this.t * 70) * 2.5 * (.4 + k) : 0)).setTint(Phaser.Display.Color.GetColor(255, 255 - 90 * k, 255 - 130 * k));
      // Glowing crack across its root, widening with the hits, and a progress ring at the tip.
      const g = s.g.clear(), cy = d.top + 18, tip = d.top + d.len * .8;
      g.lineStyle(3 + 3 * k, 0xffe7a0, .55 + .35 * Math.sin(this.t * 5)).beginPath().moveTo(d.x - 16, cy).lineTo(d.x - 4, cy + 8).lineTo(d.x + 5, cy + 1).lineTo(d.x + 16, cy + 9).strokePath();
      g.lineStyle(3, 0xffe7a0, .8).strokeCircle(d.x, tip, 20);
      if (s.hits) g.lineStyle(5, 0x6fd0ff, 1).beginPath().arc(d.x, tip, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k).strokePath();
      return;
    }
    s.g.clear();
    if (s.state !== 'fall') return;
    s.vy += 1500 * dt; s.y += s.vy * dt;
    const bottom = s.y + s.sprite.displayHeight, ground = this.world.groundAt(d.x);
    const gate = d.smash ? this.world.puzzles.gate(d.smash) : undefined;
    if (gate && !gate.open && bottom >= gate.y0) {
      this.world.puzzles.blastGate(d.smash!);
      this.scene.cameras.main.shake(220, .008);
      this.ctx.event('Stalaktit menghancurkan barikade kayu!');
    }
    s.sprite.setPosition(d.x, s.y).setRotation(Math.min(.3, (s.y - d.top) * .002));
    if (bottom < ground) return;
    // Broken into rubble where it landed: a pit fills level with the path, a trigger stone is pressed.
    s.state = 'down';
    const pit = (this.def.pits ?? []).find(p => d.x > p.x0 && d.x < p.x1);
    s.sprite.setTexture('sm-rock-pile').setOrigin(.5, 1).setRotation(0).clearTint();
    if (pit) s.sprite.setPosition(d.x, ground + 8).setDisplaySize(pit.x1 - pit.x0 + 24, ground - pit.top + 26);
    else s.sprite.setPosition(d.x, ground + 6).setDisplaySize(120, 56);
    this.scene.cameras.main.shake(200, .007);
    for (let i = 0; i < 5; i++) fx?.dust(d.x + (Math.random() - .5) * 90, ground - 10);
    if (d.opens) { this.world.puzzles.openGate(d.opens); this.ctx.event('Reruntuhan menekan batu pemicu — pintu goa terangkat!'); }
    else if (pit) this.ctx.event('Lubang tertimbun reruntuhan — jalur tersambung!');
  }
  private updateFirebreak(dt: number, playing: boolean) {
    const b = this.brk!, hooks = this.ctx.hooks();
    const front = b.cells[b.front], heat = !b.held && !!front && !!hooks?.fires.burning.some(f => Math.abs(f.def.x - front.x) < 20);
    for (const c of b.cells) {
      // The bush right next to the burning front dries much faster: put that fire out first.
      if (!c.lit) c.wet = Math.max(0, c.wet - dt / b.def.wetFor * (heat && c === b.cells[b.front + 1] ? 2.5 : 1));
      c.bush.setTint(c.lit ? 0x4a3020 : Phaser.Display.Color.GetColor(200 - 110 * c.wet, 168 + 30 * c.wet, 104 + 140 * c.wet));
    }
    const g = b.ring.clear();
    if (b.held) {
      b.glow.setAlpha(Math.max(0, b.glow.alpha - dt)); b.coals.setTint(0x6a6a6a);
      return;
    }
    b.glow.setAlpha(.5 + Math.sin(this.t * 7) * .15);
    const next = b.cells[b.front + 1], after = b.cells[b.front + 2];
    // The two bushes the break needs: blue arcs show how soaked each is (white tick at the .5 mark), the outer
    // ring on the next one counts down to the jump.
    for (const c of [next, after]) if (c) {
      const y = this.world.groundAt(c.x) - 30;
      g.lineStyle(6, c.wet >= .5 ? 0x6fd0ff : 0x3a78a8, .95).beginPath().arc(c.x, y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c.wet).strokePath();
      g.lineStyle(3, 0xffffff, .8).lineBetween(c.x, y + 30, c.x, y + 42);
    }
    if (next) g.lineStyle(4, 0xff6a3a, .5 + .4 * Math.sin(this.t * 10)).beginPath().arc(next.x, this.world.groundAt(next.x) - 30, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, b.t / b.def.interval)).strokePath();
    if (!playing || !hooks || this.failed || !(b.def.after ?? []).every(id => this.ctx.done(id))) return;
    b.t -= dt;
    if (b.t > 0 || !next) return;
    b.t = b.def.interval;
    if (next.wet >= .5 && (!after || after.wet >= .5)) {
      b.held = true;
      this.ctx.event('Sekat basah menahan bara gambut! Sumber bara padam.');
      return;
    }
    next.lit = true; next.wet = 0;
    b.front++;
    hooks.fires.spawn(next.x, this.world.groundAt(next.x), { start: .5, growth: .005, max: .9 });
    hooks.effects.ash(next.x, this.world.groundAt(next.x) - 30, 10);
    if (b.front === b.cells.length - 1) this.failed = 'Bara gambut sampai ke tapir!';
    else if (b.front === 0) this.ctx.event('Bara gambut merambat ke semak! Basahi semak di depannya.');
  }
  private updateLures(dt: number) {
    const g = this.lureG!.clear(), hooks = this.ctx.hooks();
    this.eating = Math.max(0, this.eating - dt);
    for (const l of this.lures) {
      const d = l.def;
      l.t += dt;
      if (l.state === 'hang') {
        l.x = d.x + Math.sin(l.t * 1.4) * d.swing; l.y = d.y + d.rope;
        this.place(l.surface, l.x, l.y);
        g.lineStyle(3, 0x6b4a24, 1).lineBetween(d.x, d.y, l.x, l.y - 30);
        if (l.hits) g.lineStyle(5, 0x6fd0ff, 1).beginPath().arc(l.x, l.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * l.hits / d.hp).strokePath();
      } else if (l.state === 'fall') {
        l.vy += 1200 * dt; l.y += l.vy * dt;
        const ground = this.world.groundAt(l.x) - 26;
        if (l.y >= ground) {
          l.y = ground;
          const burnt = hooks?.fires.burning.some(f => Math.abs(f.def.x - l.x) < 85 && Math.abs(f.def.y - ground) < 60);
          if (burnt) { l.state = 'burnt'; l.t = 0; hooks?.effects.ash(l.x, l.y, 10); this.ctx.event('Madu jatuh ke api dan hangus! Sarang baru tumbuh lagi.'); }
          else l.state = 'bait';
        }
      } else if (l.state === 'burnt' && l.t > 4) { l.state = 'hang'; l.hits = 0; l.surface.enabled = true; }
      if (l.state === 'eaten' || l.state === 'burnt') continue;
      // Honeycomb: golden comb with its hex cells and a drip.
      const x = l.x, y = l.y;
      g.fillStyle(0x8a5a10, 1).fillEllipse(x, y + 3, 56, 70);
      g.fillStyle(0xf2b02a, 1).fillEllipse(x, y, 50, 64);
      g.lineStyle(2, 0xb87818, .9);
      for (let r = -2; r <= 2; r++) for (let c = -1; c <= 1; c++) if (Math.abs(r) + Math.abs(c) < 3) g.strokeCircle(x + c * 13 + (r % 2 ? 6 : 0), y + r * 12, 6);
      g.fillStyle(0xffd860, .9).fillCircle(x + 8, y + 34 + Math.sin(this.t * 3 + l.i) * 2, 4);
    }
  }
  private updateEmbers(dt: number, playing: boolean) {
    const e = this.ember!, d = e.def, a = this.ctx.animal(), hooks = this.ctx.hooks();
    const g = e.g.clear();
    for (const x of d.cracks) {
      const warn = e.warn && e.warn.x === x, hot = warn ? .6 + .4 * Math.sin(this.t * 22) : .45 + .1 * Math.sin(this.t * 2 + x);
      g.lineStyle(9, 0x2a1408, .9).beginPath().moveTo(x - 40, d.y - 6).lineTo(x - 14, d.y + 5).lineTo(x + 8, d.y - 3).lineTo(x + 38, d.y + 6).strokePath();
      g.lineStyle(4, warn ? 0xffd060 : 0xff7a2a, hot).beginPath().moveTo(x - 40, d.y - 6).lineTo(x - 14, d.y + 5).lineTo(x + 8, d.y - 3).lineTo(x + 38, d.y + 6).strokePath();
      g.fillStyle(0xffb040, hot * .8).fillCircle(x, d.y + 4, 7 + (warn ? 10 * hot : 3));
      // A warning cone under the crack that is about to let go.
      if (warn) g.fillStyle(0xff8a3a, .12 + .1 * hot).fillTriangle(x - 10, d.y + 8, x + 10, d.y + 8, x, this.world.groundAt(x));
    }
    if (!playing || !hooks || !a) return;
    if (!a.arrived && !this.failed) {
      if (e.warn) {
        e.warn.t -= dt;
        if (Math.random() < dt * 10) hooks.effects.ash(e.warn.x, d.y + 10, 1);
        if (e.warn.t <= 0) {
          const x = e.warn.x;
          e.list.push({ x, y: d.y + 8, vy: 0, hp: d.hp,
            glow: this.scene.add.image(x, d.y, 'p-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff6a1a).setScale(1.3).setDepth(37),
            img: this.scene.add.image(x, d.y, 'p-flame').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffa040).setScale(1.5).setDepth(38) });
          e.warn = undefined;
        }
      } else if ((e.next -= dt) <= 0) {
        // A crack ahead of the walking animal glows, then lets go.
        const dir = Math.sign(this.ctx.flagX - a.px) || -1, ahead = d.cracks.filter(c => (c - a.px) * dir > 130 && (c - a.px) * dir < 520);
        if (ahead.length) { e.warn = { x: ahead[(Math.random() * ahead.length) | 0], t: 1.3 }; e.next = d.every; } else e.next = .5;
      }
    }
    for (const m of e.list) {
      m.vy += 300 * dt; m.y += m.vy * dt;
      m.img.setPosition(m.x, m.y).setRotation(this.t * 8); m.glow.setPosition(m.x, m.y);
      const wet = hooks.hitWater(m.x, m.y, 34);
      if (wet && (m.hp -= wet) <= 0) {
        hooks.effects.steam(m.x, m.y, 5); m.hp = -99;
        if (++e.shot === 1) this.ctx.event('Bara dipadamkan di udara!');
        continue;
      }
      const ground = this.world.groundAt(m.x);
      if (m.y < ground - 8) continue;
      m.hp = -99;
      hooks.effects.ash(m.x, ground - 10, 14);
      if (Math.abs(m.x - a.px) < 58 && !a.arrived) {
        a.hp = Math.max(0, a.hp - 34);
        this.scene.cameras.main.shake(160, .006);
        if (a.hp <= 0) this.failed = `${a.def.name} tertimpa bara terlalu sering!`;
        else this.ctx.event(`${a.def.name} tertimpa bara! Lindungi dari bara berikutnya.`);
      } else hooks.fires.spawn(m.x, ground, { start: .45, growth: .005, max: .9 });
    }
    for (const m of e.list) if (m.hp === -99) { m.img.destroy(); m.glow.destroy(); }
    e.list = e.list.filter(m => m.hp !== -99);
  }
  private updateCart(c: Cart, dt: number) {
    const d = c.def, mid = (d.x0 + d.x1) / 2, half = (d.x1 - d.x0) / 2, hooks = this.ctx.hooks();
    const fire = this.fire(d.fire), burning = !!fire?.lit;
    if (!c.latched) {
      const w = Math.PI * 2 / d.period;
      // Rolling in the dip: pulled back toward the bottom; the brake shoes only grip once the fire is out.
      c.v += (-w * w * (c.x - mid) - (burning ? 0 : 1.3) * c.v) * dt;
      c.x += c.v * dt;
      const lo = d.x0 + CART_W / 2, hi = d.x1 - CART_W / 2;
      if (c.x < lo) { c.x = lo; c.v = Math.abs(c.v) * .5; }
      if (c.x > hi) { c.x = hi; c.v = -Math.abs(c.v) * .5; }
      // Sparks off a burning cart at the end of its swing can light the bush on that rim.
      const side = Math.abs(c.x - mid) > half * .7 ? Math.sign(c.x - mid) : 0;
      if (side && side !== c.rim && burning && hooks) {
        const rim = d.rims.find(p => Math.sign(p.x - mid) === side), f = rim && hooks.fires.fires.find(q => !q.lit && q.wet <= 0 && Math.abs(q.def.x - rim.x) < 30);
        if (f && Math.random() < .4) { f.ignite(f.def.start); this.ctx.event('Percikan lori membakar semak di tepi lembah!'); }
      }
      if (side) c.rim = side; else if (Math.abs(c.x - mid) < half * .3) c.rim = 0;
      if (!burning && Math.abs(c.x - mid) < 26 && Math.abs(c.v) < 24) {
        c.latched = true; c.surface.enabled = false; c.v = 0;
        this.ctx.event('Lori masuk celah dan terkunci — lembah bisa dilewati!');
      }
    } else {
      // Settle over the slot and sink into it, flush with the valley floor.
      c.x += (mid - c.x) * Math.min(1, dt * 6);
      c.sink = Math.min(CART_H, c.sink + dt * 110);
    }
    const floor = this.cartFloor(c.x), top = floor - CART_H + c.sink;
    this.place(c.surface, c.x, top + CART_H / 2);
    if (fire?.lit) fire.moveTo(c.x, top + 4);
    // Mine cart: iron-banded wooden tub on two wheels, tilted along the rails.
    const slope = Math.atan(-2 * d.dip * (c.x - mid) / (half * half)), g = c.g.clear(), cos = Math.cos(slope), sin = Math.sin(slope);
    const at = (lx: number, ly: number) => ({ x: c.x + lx * cos - ly * sin, y: floor - 6 + c.sink + lx * sin + ly * cos });
    const box = [at(-CART_W / 2, -CART_H + 6), at(CART_W / 2, -CART_H + 6), at(CART_W / 2 - 10, -10), at(-CART_W / 2 + 10, -10)];
    g.fillStyle(burning ? 0x3a2414 : 0x6b4a2a, 1).fillPoints(box, true);
    g.lineStyle(4, 0x2a2a2e, 1).strokePoints(box, true);
    const band = [at(-CART_W / 2 + 4, -CART_H / 2), at(CART_W / 2 - 4, -CART_H / 2)];
    g.lineStyle(3, 0x55555c, 1).lineBetween(band[0].x, band[0].y, band[1].x, band[1].y);
    for (const lx of [-CART_W / 3, CART_W / 3]) { const p = at(lx, -6); g.fillStyle(0x2a2a2e, 1).fillCircle(p.x, p.y, 10).fillStyle(0x8a8a90, 1).fillCircle(p.x, p.y, 4); }
  }
  private updateNest(dt: number) {
    const n = this.nest!, d = n.def, g = n.g.clear();
    n.wet = Math.max(0, n.wet - dt * .6);
    n.wobble = Math.max(0, n.wobble - dt);
    const k = Math.min(1, n.wet / d.limit), dx = Math.sin(this.t * 40) * n.wobble * 8;
    // Woven twig bowl; it darkens and drips as it soaks.
    g.fillStyle(Phaser.Display.Color.GetColor(122 - 60 * k, 86 - 30 * k, 44 + 40 * k), 1).fillEllipse(d.x + dx, d.y - 10, 104, 34);
    g.lineStyle(2, 0x3a2a14, .9);
    for (let i = -4; i <= 4; i++) g.lineBetween(d.x + dx + i * 11 - 8, d.y - 22, d.x + dx + i * 11 + 8, d.y + 2);
    g.fillStyle(0xf4ecd8, 1).fillEllipse(d.x + dx - 30, d.y - 24, 14, 18).fillEllipse(d.x + dx + 32, d.y - 24, 14, 18);
    if (k > .3 && Math.random() < dt * 12 * k) this.ctx.hooks()?.effects.splash(d.x + (Math.random() - .5) * 80, d.y + 4, 1);
  }
  private updateGondola(g: Gondola, dt: number) {
    const d = g.def, a = this.ctx.animal();
    // A dial-wound ferry: half way is neutral, the further from it the faster it winds.
    const w = d.driver ? (this.ctx.dial(d.driver) - .5) * 14 : this.world.wheel?.w ?? 0;
    if ((g.phase === 'go' || g.phase === 'ride') && (d.after ?? []).every(id => this.ctx.done(id))) {
      g.f += w * d.speed * dt;
      // Without the wheel pulling it the car runs back down the cable toward the low station.
      if (Math.abs(w) < .6 && g.f > 0 && g.f < 1) g.f -= d.slide * dt;
      const bl = d.block, blocked = bl && this.fire(bl.fire)?.lit;
      if (blocked) {
        const was = g.f;
        if (g.f > bl.at - .01 && g.f < bl.at + .01) g.f = w >= 0 ? bl.at - .01 : bl.at + .01;
        if (was !== g.f && !g.warned) { g.warned = true; this.ctx.event('Tiang kabel terbakar — kereta tak bisa lewat! Padamkan apinya.'); }
      }
      g.f = Phaser.Math.Clamp(g.f, 0, 1);
      if (g.phase === 'go' && g.f >= 1) { g.phase = 'docked'; this.ctx.event('Kereta gantung tiba di stasiun seberang!'); }
      if (g.phase === 'ride' && g.f <= 0) { g.phase = 'home'; this.ctx.event('Kereta gantung pulang! Orangutan turun.'); }
    }
    const p = this.car(g);
    if (g.phase === 'ride' && a) { a.px = p.x; a.py = p.floor; }
    const gr = g.g.clear(), { a: A, b: B, sag } = d;
    gr.lineStyle(4, 0x2a2a2e, 1).beginPath();
    for (let i = 0; i <= 24; i++) { const f = i / 24, x = A.x + (B.x - A.x) * f, y = A.y + (B.y - A.y) * f + sag * Math.sin(Math.PI * f); i ? gr.lineTo(x, y) : gr.moveTo(x, y); }
    gr.strokePath();
    if (g.raft) { g.raft.setPosition(p.x, p.floor + Math.sin(this.t * 2.4) * 2).setRotation(Math.sin(this.t * 1.7) * .02); return; }
    gr.lineStyle(3, 0x3a3a40, 1).lineBetween(p.x, p.y, p.x, p.floor - 46);
    gr.fillStyle(0x2a2a2e, 1).fillCircle(p.x - 10, p.y, 6).fillCircle(p.x + 10, p.y, 6);
    gr.fillStyle(0x7a5228, 1).fillRoundedRect(p.x - 52, p.floor - 46, 104, 46, 6);
    gr.lineStyle(3, 0x4a3018, 1).strokeRoundedRect(p.x - 52, p.floor - 46, 104, 46, 6);
    gr.fillStyle(0xa8743a, 1).fillRect(p.x - 52, p.floor - 46, 104, 8);
  }

  /** Dial-wound ferry: which way to wind it for mission `id` (null while it waits for the animal to board). */
  ferry(id: string): { dial: string; dir: 1 | -1 } | null {
    const g = this.gondola, d = g?.def;
    if (!g || !d?.id || !d.driver) return null;
    if (id === d.id && g.phase === 'go') return { dial: d.driver, dir: 1 };
    if (id === `${d.id}:home` && g.phase === 'ride') return { dial: d.driver, dir: -1 };
    return null;
  }
  /** Aim point to advance trial `id` (firebreak bush, root tip, cart...). */
  focus(id: string): { x: number; y: number } | null {
    const b = this.brk;
    if (b?.def.id === id && !b.held) {
      // The break needs both bushes ahead soaked: point at the drier one.
      const [n1, n2] = [b.cells[b.front + 1], b.cells[b.front + 2]], c = n2 && n2.wet < n1?.wet ? n2 : n1;
      return c ? { x: c.x, y: this.world.groundAt(c.x) - 10 } : null;
    }
    const r = this.root;
    if (r?.def.id === id) return { x: r.def.x + r.def.dir * r.def.len * r.f, y: r.def.y - 14 };
    const c = this.cart;
    if (c?.def.id === id) return { x: c.x, y: this.cartFloor(c.x) - CART_H };
    return null;
  }
  get hint(): string {
    const r = this.root;
    if (r) return r.latched ? 'Jembatan akar jadi • padamkan api di jalur trenggiling'
      : r.def.fire !== undefined && this.fire(r.def.fire)?.lit ? 'Padamkan api di pangkal akar dulu'
      : `Akar tumbuh ${Math.round(r.f * 100)}% • siram terus ujungnya`;
    if (this.def.herd) { const a = this.ctx.animal(); return a?.arrived ? 'Rusa aman! Padamkan sisa api.' : `Giring rusa: semprot tanah di BELAKANGNYA • ${Math.max(0, Math.round((this.ctx.flagX - (a?.px ?? 0)) / 10))} m lagi`; }
    if (this.spikes.length) return `Stalaktit runtuh ${this.spikes.filter(s => s.state !== 'hang').length}/${this.spikes.length}`;
    const b = this.brk;
    if (b) return b.held ? 'Bara gambut tertahan! Padamkan sisa api untuk jalan tapir.'
      : `Bara melompat dalam ${Math.max(0, b.t).toFixed(1)} dtk • basahi 2 semak di depan: ${[1, 2].map(k => `${Math.round((b.cells[b.front + k]?.wet ?? 1) * 100)}%`).join(' + ')} (perlu 50%)`;
    if (this.lures.length) return `Madu dimakan ${this.lures.filter(l => l.state === 'eaten').length}/${this.lures.length} • putuskan tali sarang madu`;
    if (this.ember) { const a = this.ctx.animal(); return a?.arrived ? 'Gajah aman! Padamkan sisa api.' : `Kawal anak gajah • nyawa ${Math.round(a?.hp ?? 0)}% • tembak bara yang jatuh`; }
    const c = this.cart;
    if (c) return c.latched ? 'Lori terkunci • padamkan sisa api' : this.fire(c.def.fire)?.lit ? 'Padamkan api di lori yang berayun • bidik ke arah geraknya' : 'Api padam — rem lori bekerja, lori berhenti di celah';
    const n = this.nest;
    if (n) return `Sarang basah ${Math.round(n.wet)}/${n.def.limit} • api tersisa ${n.def.fires.filter(i => this.fire(i)?.lit).length}`;
    const g = this.gondola;
    if (g) return g.phase === 'go' ? `Kereta berangkat ${Math.round(g.f * 100)}% • semprot kincir di ATAS poros`
      : g.phase === 'docked' ? 'Padamkan api di stasiun agar orangutan bisa naik'
      : g.phase === 'ride' ? `Tarik pulang ${Math.round((1 - g.f) * 100)}% • semprot kincir di BAWAH poros` : 'Orangutan turun • padamkan sisa api';
    return '';
  }
  status() {
    return {
      root: this.root ? +this.root.f.toFixed(2) : undefined, herd: this.herdGoal, spikes: this.spikes.map(s => s.state),
      firebreak: this.brk ? { front: this.brk.front, held: this.brk.held, t: +this.brk.t.toFixed(1), wet: this.brk.cells.map(c => +c.wet.toFixed(2)) } : undefined,
      lures: this.lures.map(l => l.state), embers: this.ember ? { shot: this.ember.shot, live: this.ember.list.length } : undefined,
      cart: this.cart ? { x: Math.round(this.cart.x), v: Math.round(this.cart.v), latched: this.cart.latched } : undefined,
      nest: this.nest ? Math.round(this.nest.wet) : undefined, gondola: this.gondola ? `${this.gondola.phase}:${this.gondola.f.toFixed(2)}` : undefined, failed: this.failed,
    };
  }
}
