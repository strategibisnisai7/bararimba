import Phaser from 'phaser';
import type { BalanceDef, CompanionDef, CraneDef, DialDef, FloatDef, KitDef, SequenceDef, VentDef } from '../config/kalimantanKit';
import type { Surface } from '../physics/collision';
import { Animal } from '../entities/Animal';
import type { TrialHooks } from './SumatraTrials';
import type { World } from './World';

interface Context { hooks(): TrialHooks | undefined; done(id: string): boolean; event(msg: string): void }
type Gfx = Phaser.GameObjects.Graphics;
interface Vent { def: VentDef; wet: number; held: number; cooled: boolean; surface: Surface; smoke: Phaser.GameObjects.Particles.ParticleEmitter; told: boolean }
interface Dial { def: DialDef; v: number; held: number; latched: boolean; hitT: number; dir: number; up: Surface; down?: Surface; icon: Phaser.GameObjects.Image; t: number }
interface Sequence { def: SequenceDef; next: number; hits: number; done: boolean; surfaces: Surface[] }
interface Float { def: FloatDef; sink: number }
/** What the player should act on now (HUD marker; scripted tests use it the same way). */
/** `hold`: it is where it should be — stop spraying and let it settle. */
export interface Focus { x: number; y: number; how: 'spray' | 'up' | 'down' | 'push' | 'hold'; what: string }

const DIAL_SPEED = .1;    // gauge travel per second while water lands on the handle (slow: water in flight still turns it)
const PADDLE = 34;        // set-dials: + paddle this far above the hub, − paddle this far below,
const PADDLE_X = 18;      // staggered (+ right, − left) so a steep lob onto − never crosses +

/** Kalimantan peat-swamp mechanisms. They follow the Sumatra pattern: built from level data, driven only by water
 * drops hitting their sensors, reporting `done` ids that gates, bridges and the rescue walk wait for. */
export class KalimantanKit {
  private t = 0;
  private vents: Vent[] = [];
  private dials: Dial[] = [];
  private seqs: Sequence[] = [];
  private floats: Float[] = [];
  private balanced = new Map<string, number>();
  private latchedGroups = new Set<string>();
  private clearT = new Map<string, number>();
  private cleared = new Set<string>();
  /** Sockets whose log has rested in them for a second (done for good, even if knocked out later). */
  private seatedIds = new Set<string>();
  private seatT = new Map<string, number>();
  private crane?: { def: CraneDef; carrying: boolean; count: number; g: Gfx };
  private companion?: { def: CompanionDef; animal: Animal; arrived: boolean };
  /** The second animal needs the scene's effects, which exist only after the world is built. */
  private makeCompanion() {
    const c = this.def.companion!, hooks = this.ctx.hooks();
    if (hooks) this.companion = { def: c, arrived: false, animal: new Animal(this.scene, { key: c.key, name: c.name, x: c.x, y: c.y, scale: c.scale, flip: c.flip }, hooks.effects) };
  }
  private g: Gfx;
  private fog: Gfx;
  private fogA: number[];

  constructor(private scene: Phaser.Scene, private world: World, readonly def: KitDef, private ctx: Context) {
    const s = scene;
    this.g = s.add.graphics().setDepth(19.5);
    this.fog = s.add.graphics().setDepth(44);
    this.fogA = (def.fogs ?? []).map(() => 1);
    for (const d of def.vents ?? []) {
      const smoke = s.add.particles(d.x, d.y - 8, 'p-smoke', {
        frequency: 70, lifespan: { min: 1800, max: 2800 }, speedY: { min: -70, max: -40 }, speedX: { min: -8, max: 18 },
        scale: { start: .35, end: 1.4 }, alpha: { start: .5, end: 0 }, tint: [0x4a4440, 0x6a625a, 0x3a3632],
      }).setDepth(30);
      this.vents.push({ def: d, wet: 0, held: 0, cooled: false, smoke, told: false, surface: this.sensor(d.x, d.y - 16, 96, 40) });
    }
    for (const d of def.dials ?? []) {
      if (d.kind === 'sluice') s.add.image(d.x - 46, d.y + 70, 'k-sluice').setOrigin(.5, 1).setScale(.42).setDepth(14);
      if (d.kind === 'winch' || d.kind === 'pump') s.add.image(d.x, d.y + 30, 'sm-post').setOrigin(.5, 0).setScale(.4).setDepth(14);
      const icon = s.add.image(d.x, d.y, 'gear').setScale(.3).setDepth(18);
      const set = d.mode === 'set';
      this.dials.push({ def: d, v: d.start ?? 0, held: 0, latched: false, hitT: 9, dir: 0, t: 0, icon,
        up: set ? this.sensor(d.x + PADDLE_X, d.y - PADDLE, 46, 22) : this.sensor(d.x, d.y, 56, 56), down: set ? this.sensor(d.x - PADDLE_X, d.y + PADDLE, 46, 22) : undefined });
    }
    for (const d of def.sequences ?? []) this.seqs.push({ def: d, next: 0, hits: 0, done: false, surfaces: d.points.map(p => this.sensor(p.x, p.y, 48, 48)) });
    for (const d of def.floats ?? []) this.floats.push({ def: d, sink: 34 });
    if (def.crane) this.crane = { def: def.crane, carrying: false, count: 0, g: s.add.graphics().setDepth(21) };
  }
  private sensor(x: number, y: number, w: number, h: number) {
    const body = this.scene.matter.add.rectangle(x, y, w, h, { isStatic: true, isSensor: true, label: 'kit' });
    const surface: Surface = { body, kind: 'handle', enabled: true };
    this.world.surfaces.push(surface);
    return surface;
  }
  private open(after?: string[]) { return (after ?? []).every(id => this.ctx.done(id)); }

  // ---------- queries ----------
  isDone(id: string): boolean | undefined {
    const v = this.vents.find(q => q.def.id === id);
    if (v) return v.cooled;
    const d = this.dials.find(q => q.def.id === id);
    if (d) return d.latched;
    if ((this.def.balances ?? []).some(b => b.id === id)) return this.latchedGroups.has(id);
    const so = (this.def.sockets ?? []).find(q => q.id === id);
    if (so) return this.seatedIds.has(id);
    if ((this.def.clears ?? []).some(c => c.id === id)) return this.cleared.has(id);
    const sq = this.seqs.find(q => q.def.id === id);
    if (sq) return sq.done;
    const f = this.floats.find(q => q.def.id === id);
    if (f) return this.open(f.def.after);
    if (this.crane?.def.id === id) return this.crane.count >= this.crane.def.drums;
    return undefined;
  }
  private filled(x0: number, x1: number) {
    return this.world.props.some(p => !p.gone && p.body.position.x > x0 && p.body.position.x < x1 && p.body.position.y < 700 && Math.hypot(p.body.velocity.x, p.body.velocity.y) < 2.5);
  }
  /** Both rescued animals are safe (the companion, when the level has one). */
  get companionSafe() { return !this.def.companion || !!this.companion?.arrived; }
  surfaceAt(x: number): number | null {
    let top: number | null = null;
    const take = (y: number) => { top = top === null ? y : Math.min(top, y); };
    for (const s of this.def.sockets ?? []) if (s.top !== undefined && x >= s.x0 && x <= s.x1 && this.filled(s.x0, s.x1)) take(s.top);
    for (const f of this.floats) if (x >= f.def.x0 && x <= f.def.x1 && this.open(f.def.after)) take(f.def.y);
    return top;
  }
  /** A log/boulder lying in a walkable socket is part of the path, not an obstacle on it. */
  seated(x: number) { return (this.def.sockets ?? []).some(s => s.top !== undefined && x > s.x0 && x < s.x1); }
  /** Dial value (0..1) by id, for mechanisms driven by a dial (cable ferry). */
  value(id: string) { return this.dials.find(d => d.def.id === id)?.v ?? 0; }
  /** Steps stay done once completed (a tank draining later does not send the mission list back). */
  private stepsDone = new Set<number>();
  get steps() {
    return this.def.steps.map((s, i) => {
      if (!this.stepsDone.has(i) && s.need.every(id => this.ctx.done(id))) this.stepsDone.add(i);
      return { title: s.title, done: this.stepsDone.has(i) };
    });
  }

  // ---------- water ----------
  waterHit(s: Surface, at: { x: number; y: number }) {
    const v = this.vents.find(q => q.surface === s);
    if (v) {
      if (v.cooled) return true;
      if (!this.open(v.def.after)) { this.locked(v.def.after!); return true; }
      v.wet = Math.min(1, v.wet + (v.def.inspect ? .05 : .012));
      return true;
    }
    const d = this.dials.find(q => q.up === s || q.down === s);
    if (d) {
      if (d.latched) return true;
      if (!this.open(d.def.after)) { this.locked(d.def.after!); return true; }
      if (d.def.pulse && this.pulseHigh(d)) return true;
      d.hitT = 0; d.dir = s === d.down ? -1 : 1;
      return true;
    }
    for (const q of this.seqs) {
      const i = q.surfaces.indexOf(s);
      if (i < 0) continue;
      if (q.done) return true;
      if (!this.open(q.def.after)) { this.locked(q.def.after!); return true; }
      if (i < q.next) return true;
      if (i > q.next) { if (q.hits > 0 || q.next > 0) this.ctx.event(`Urutan keliru! Mulai lagi dari ${q.def.points[0].label}.`); q.next = 0; q.hits = 0; return true; }
      if (++q.hits >= q.def.hits) {
        q.hits = 0; q.next++;
        if (q.next >= q.def.points.length) { q.done = true; this.ctx.event('Urutan benar — tekanan aman!'); if (q.def.opens) this.world.puzzles.openGate(q.def.opens); }
        else this.ctx.event(`${q.def.points[i].label} terbuka. Berikutnya: ${q.def.points[q.next].label}.`);
      }
      return true;
    }
    return false;
  }
  private lockT = 0;
  private locked(after: string[]) { if (this.lockT <= 0) { this.lockT = 2.5; this.ctx.event('Terkunci — selesaikan langkah sebelumnya dulu.'); } void after; }
  private pulseHigh(d: Dial) { return Math.sin(this.t * Math.PI * 2 / d.def.pulse!) > -.2; }

  // ---------- update ----------
  update(dt: number) {
    this.t += dt; this.lockT -= dt;
    const g = this.g.clear();
    for (const v of this.vents) this.updateVent(v, dt, g);
    for (const d of this.dials) this.updateDial(d, dt, g);
    for (const b of this.def.balances ?? []) this.updateBalance(b, dt);
    for (const q of this.seqs) this.drawSequence(q, g);
    for (const c of this.def.clears ?? []) {
      if (this.cleared.has(c.id)) continue;
      const busy = this.world.props.some(p => !p.gone && p.body.position.x > c.x0 && p.body.position.x < c.x1 && p.body.position.y < 640);
      const t = busy ? 0 : (this.clearT.get(c.id) ?? 0) + dt;
      this.clearT.set(c.id, t);
      if (t >= 2 && this.open(c.after)) { this.cleared.add(c.id); this.ctx.event('Intake bersih — air mengalir masuk!'); }
      g.lineStyle(3, busy ? 0xffc04a : 0x7be88c, .8).strokeRect(c.x0, 470, c.x1 - c.x0, 80);
    }
    for (const so of this.def.sockets ?? []) {
      if (this.seatedIds.has(so.id)) continue;
      const t = this.filled(so.x0, so.x1) ? (this.seatT.get(so.id) ?? 0) + dt : 0;
      this.seatT.set(so.id, t);
      if (t >= 1) { this.seatedIds.add(so.id); this.ctx.event('Gelondongan terpasang di soketnya!'); }
    }
    for (const f of this.floats) this.updateFloat(f, dt, g);
    if (this.crane) this.updateCrane(dt);
    if (this.def.companion && !this.companion) this.makeCompanion();
    if (this.companion) this.updateCompanion(dt);
    this.drawFog(dt);
  }
  private updateVent(v: Vent, dt: number, g: Gfx) {
    const d = v.def, need = d.need ?? .84, open = this.open(d.after);
    if (!v.cooled) {
      v.wet = Math.max(0, v.wet - dt * (d.inspect ? .2 : .1));
      v.held = v.wet >= need ? v.held + dt : 0;
      if (open && (d.inspect ? v.wet >= .6 : v.held >= (d.hold ?? 2))) {
        v.cooled = true; v.surface.enabled = false;
        this.ctx.event(d.inspect ? 'Sumber asap ditemukan!' : 'Vent gambut dingin — tersimpan!');
        if (!d.inspect) { v.smoke.stop(); this.ctx.hooks()?.effects.steam(d.x, d.y - 20, 8); }
        if (d.opens) this.world.puzzles.openGate(d.opens);
      }
    }
    const heat = v.cooled ? (d.inspect ? .5 : 0) : 1 - v.wet;
    v.smoke.frequency = v.cooled && !d.inspect ? -1 : 50 + 150 * (1 - heat);
    // Peat mound with glowing cracks, the moisture ring (blue) and the hold ring (white).
    g.fillStyle(0x2a1a10, 1).fillEllipse(d.x, d.y - 4, 104, 30);
    g.fillStyle(v.cooled ? 0x3a3a3a : 0x4a2a16, 1).fillEllipse(d.x, d.y - 10, 80, 22);
    if (heat > 0) {
      const a = (.5 + .5 * Math.sin(this.t * 6 + d.x)) * heat;
      g.lineStyle(3, 0xff7a2a, .4 + .6 * a).beginPath().moveTo(d.x - 30, d.y - 10).lineTo(d.x - 10, d.y - 4).lineTo(d.x + 6, d.y - 13).lineTo(d.x + 28, d.y - 6).strokePath();
      g.fillStyle(0xffa040, .3 * a).fillCircle(d.x, d.y - 12, 16);
    }
    if (!v.cooled) {
      const y = d.y - 60;
      g.lineStyle(5, open ? 0x6fd0ff : 0x7a8a90, .95).beginPath().arc(d.x, y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.wet).strokePath();
      if (!d.inspect) g.lineStyle(2, 0xffffff, .8).beginPath().arc(d.x, y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, v.held / (d.hold ?? 2))).strokePath();
      if (!open) this.padlock(g, d.x, y);
    } else g.fillStyle(0x7be88c, 1).fillCircle(d.x, d.y - 60, 6);
  }
  private updateDial(d: Dial, dt: number, g: Gfx) {
    const def = d.def;
    d.t += dt; d.hitT += dt;
    if (!d.latched) {
      if (d.hitT < .12) d.v = Phaser.Math.Clamp(d.v + d.dir * DIAL_SPEED * dt, 0, 1);
      // Between root pulses the root holds still: a pulsed winch only slackens while the pulse is low.
      else if (def.mode === 'pull' && !(def.pulse && this.pulseHigh(d))) d.v = Math.max(0, d.v - (def.spring ?? .12) * dt);
      if (def.snap !== undefined && d.v > def.snap) { d.v = .25; d.held = 0; this.ctx.event(`${def.label} terlalu tegang — melar dan kendur lagi!`); }
      const inBand = d.v >= def.band[0] && d.v <= def.band[1];
      d.held = inBand ? d.held + dt : 0;
      if (!def.group && d.held >= (def.hold ?? 1.5)) {
        d.latched = true; this.ctx.event(`${def.label} terkunci di posisi aman.`);
        if (def.opens) this.world.puzzles.openGate(def.opens);
      }
    }
    d.icon.setRotation(d.icon.rotation + (d.hitT < .12 ? d.dir * dt * 6 : 0)).setTint(d.latched ? 0x9be8a8 : 0xffffff);
    // A latched control no longer catches water: streams to what lies beyond pass through.
    d.up.enabled = !d.latched; if (d.down) d.down.enabled = !d.latched;
    if (d.down && !d.latched) {
      // Paddle boards on the handle: + raises, − lowers.
      for (const [dy, sign] of [[-PADDLE, 1], [PADDLE, -1]] as const) {
        const y = def.y + dy, x = def.x + sign * PADDLE_X, on = d.hitT < .12 && d.dir === sign;
        g.lineStyle(4, 0x5a3a1c, 1).lineBetween(def.x, def.y, x, y);
        g.fillStyle(on ? 0xffe066 : 0xd9b27a, 1).fillRoundedRect(x - 23, y - 11, 46, 22, 5).lineStyle(2, 0x5a3a1c, 1).strokeRoundedRect(x - 23, y - 11, 46, 22, 5);
        g.fillStyle(0x3a2410, 1).fillRect(x - 8, y - 2, 16, 4);
        if (sign > 0) g.fillRect(x - 2, y - 8, 4, 16);
      }
    }
    // Gauge: green band, white needle, label with the reading.
    const x = d.def.x + 42, top = d.def.y - 46, h = 92;
    g.fillStyle(0x1e2a24, .9).fillRoundedRect(x - 9, top - 4, 18, h + 8, 5);
    g.fillStyle(0x7be88c, .55).fillRect(x - 7, top + h * (1 - def.band[1]), 14, h * (def.band[1] - def.band[0]));
    if (def.snap !== undefined) g.fillStyle(0xe5462e, .7).fillRect(x - 7, top, 14, h * (1 - def.snap));
    g.fillStyle(0xffffff, 1).fillRect(x - 10, top + h * (1 - d.v) - 2, 20, 4);
    if (def.pulse) { const low = !this.pulseHigh(d); g.fillStyle(low ? 0x7be88c : 0xe5462e, .9).fillCircle(d.def.x, d.def.y - 40, 6); }
    if (!this.open(def.after)) this.padlock(g, def.x, def.y - 40);
  }
  private updateBalance(b: BalanceDef, dt: number) {
    if (this.latchedGroups.has(b.id)) return;
    const ds = b.dials.map(id => this.dials.find(d => d.def.id === id)!);
    const ok = this.open(b.after) && ds.every(d => d.v >= d.def.band[0] && d.v <= d.def.band[1]);
    const t = ok ? (this.balanced.get(b.id) ?? 0) + dt : 0;
    this.balanced.set(b.id, t);
    if (t >= b.hold) {
      this.latchedGroups.add(b.id);
      for (const d of ds) d.latched = true;
      this.ctx.event('Pintu air seimbang — selisih tinggi air aman!');
      if (b.opens) this.world.puzzles.openGate(b.opens);
    }
  }
  private drawSequence(q: Sequence, g: Gfx) {
    q.def.points.forEach((p, i) => {
      const done = q.done || i < q.next;
      for (const [r, c] of [[18, 0x6b4421], [14, done ? 0x7be88c : 0xffffff], [8, done ? 0x3a9a50 : 0xe53a2a]] as const) g.fillStyle(c, 1).fillCircle(p.x, p.y, r);
      if (!done && i === q.next && q.hits) g.lineStyle(4, 0x6fd0ff, 1).beginPath().arc(p.x, p.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q.hits / q.def.hits).strokePath();
      q.surfaces[i].enabled = !q.done;
    });
    if (!this.open(q.def.after)) this.padlock(g, q.def.points[0].x, q.def.points[0].y - 30);
  }
  private updateFloat(f: Float, dt: number, g: Gfx) {
    const d = f.def, ok = this.open(d.after);
    f.sink += ((ok ? 0 : 34) - f.sink) * Math.min(1, dt * 2);
    const y = d.y + f.sink + Math.sin(this.t * 1.8 + d.x0) * (ok ? 1 : 4), tilt = ok ? 0 : Math.sin(this.t * 1.2) * 8;
    // Peat mat: dark fibrous slab with a mossy crown and trailing roots; floating loose it rides low and rocks.
    g.fillStyle(0x2e1e12, 1).fillPoints([{ x: d.x0, y: y + tilt }, { x: d.x1, y: y - tilt }, { x: d.x1 - 14, y: y + 46 - tilt }, { x: d.x0 + 14, y: y + 46 + tilt }], true);
    g.lineStyle(3, 0x4a3220, 1);
    for (let x = d.x0 + 20; x < d.x1 - 10; x += 34) g.lineBetween(x, y + 40, x + 6, y + 64 + (x % 3) * 6);
    g.fillStyle(0x5f8a3a, 1).fillPoints([{ x: d.x0 - 4, y: y - 6 + tilt }, { x: d.x1 + 4, y: y - 6 - tilt }, { x: d.x1, y: y + 10 - tilt }, { x: d.x0, y: y + 10 + tilt }], true);
    g.fillStyle(0x7fae4a, 1).fillRect(d.x0 + 6, y - 6 + tilt * .5, d.x1 - d.x0 - 12, 4);
  }
  private updateCrane(_dt: number) {
    const c = this.crane!, d = c.def, v = this.value(d.dial), g = c.g.clear();
    const hookY = d.top + (d.bottom - d.top) * v;
    if (c.count < d.drums) {
      if (!c.carrying && v >= .9) { c.carrying = true; this.ctx.event('Drum pelampung terkait!'); }
      if (c.carrying && v <= .1) { c.carrying = false; c.count++; this.ctx.event(c.count >= d.drums ? 'Dua drum terpasang — dermaga mengapung stabil!' : 'Drum pertama terpasang. Ambil satu lagi.'); }
    }
    g.lineStyle(6, 0x5a3a1c, 1).lineBetween(d.x - 60, d.top - 30, d.x + 30, d.top - 30).lineBetween(d.x - 60, d.top - 30, d.x - 60, d.deck.y);
    g.lineStyle(3, 0x2a2a2e, 1).lineBetween(d.x, d.top - 30, d.x, hookY);
    g.lineStyle(4, 0x8a8a90, 1).beginPath().arc(d.x, hookY + 8, 9, 0, Math.PI).strokePath();
    const drum = (x: number, y: number) => g.fillStyle(0x2f6fa8, 1).fillRoundedRect(x - 18, y, 36, 44, 6).lineStyle(3, 0x1a3a58, 1).strokeRoundedRect(x - 18, y, 36, 44, 6);
    if (c.carrying) drum(d.x, hookY + 16);
    else if (c.count < d.drums) drum(d.x, d.bottom + 16);
    for (let i = 0; i < c.count; i++) drum(d.deck.x + i * 44, d.deck.y - 44);
  }
  private updateCompanion(dt: number) {
    const c = this.companion!, a = c.animal, d = c.def, hooks = this.ctx.hooks();
    a.update(dt);
    if (c.arrived || !this.open(d.after)) return;
    const fire = (x: number) => !!hooks?.fires.burning.some(f => Math.abs(f.def.x - x) < 60 && Math.abs(f.def.y - this.world.groundAt(x)) < 60);
    a.walk(dt, d.flagX, 60, x => this.world.groundAt(x), x => this.world.surfaceAt(x) === null ? 'gap' : fire(x) ? 'fire' : '');
    if (a.reached) { c.arrived = true; hooks?.effects.hearts(a.x, a.headY, 6); this.ctx.event(`${d.name} juga selamat!`); }
  }
  private drawFog(dt: number) {
    const g = this.fog.clear();
    (this.def.fogs ?? []).forEach((f, i) => {
      const goal = this.ctx.done(f.until) ? 0 : 1;
      this.fogA[i] += (goal - this.fogA[i]) * Math.min(1, dt * .8);
      const a = this.fogA[i];
      if (a < .01) return;
      for (let k = 0; k < 4; k++) {
        const pad = k * 22, wob = Math.sin(this.t * .6 + k) * 10;
        g.fillStyle(f.tint ?? 0x8a9488, .22 * a).fillRoundedRect(f.x0 - pad + wob, f.y0 - pad, f.x1 - f.x0 + pad * 2, f.y1 - f.y0 + pad * 2, 60);
      }
      g.fillStyle(f.tint ?? 0x8a9488, .55 * a).fillRect(f.x0 + 40, f.y0 + 30, f.x1 - f.x0 - 80, f.y1 - f.y0 - 60);
    });
  }
  private padlock(g: Gfx, x: number, y: number) {
    g.fillStyle(0x1e1e22, .85).fillRoundedRect(x - 10, y - 4, 20, 16, 3);
    g.lineStyle(3, 0x1e1e22, .85).beginPath().arc(x, y - 4, 6, Math.PI, 0).strokePath();
  }
  /** Where to aim to advance kit piece `id`: undefined when `id` is not a kit piece, null when it is waiting on
   * something else (its `after`) or needs nothing (a balanced group waiting out its hold). */
  focusFor(id: string): Focus | null | undefined {
    const v = this.vents.find(q => q.def.id === id);
    if (v) return this.open(v.def.after) ? { x: v.def.x, y: v.def.y - 20, how: 'spray', what: id } : null;
    const d = this.dials.find(q => q.def.id === id);
    if (d) return this.open(d.def.after) ? this.dialFocus(d) : null;
    const b = (this.def.balances ?? []).find(q => q.id === id);
    if (b) {
      if (!this.open(b.after)) return null;
      const off = b.dials.map(k => this.dials.find(q => q.def.id === k)!).find(q => q.v < q.def.band[0] || q.v > q.def.band[1]);
      return off ? this.dialFocus(off) : null;
    }
    const q = this.seqs.find(s => s.def.id === id);
    if (q) { const p = q.def.points[q.next]; return this.open(q.def.after) && p ? { x: p.x, y: p.y, how: 'spray', what: id } : null; }
    const cr = this.crane;
    if (cr && cr.def.id === id) {
      const d = this.dials.find(q => q.def.id === cr.def.dial)!, how = cr.carrying ? 'down' : 'up';
      return { x: d.def.x + (how === 'up' ? PADDLE_X : -PADDLE_X), y: d.def.y + (how === 'up' ? -PADDLE : PADDLE), how, what: id };
    }
    if ([...this.def.sockets ?? [], ...this.def.clears ?? [], ...this.def.floats ?? []].some(q => q.id === id)) return undefined;
    return undefined;
  }
  /** Ids the kit knows that still wait on others (`after`), to resolve those first. */
  after(id: string) {
    return [...this.def.vents ?? [], ...this.def.dials ?? [], ...this.def.balances ?? [], ...this.def.sequences ?? [], ...this.def.clears ?? [], ...this.def.floats ?? []]
      .find(q => q.id === id)?.after ?? [];
  }
  /** Marker on dial `id` to turn it up (+) or down (−), or hold it once past half that way. */
  steer(id: string, dir: 1 | -1): Focus | null {
    const d = this.dials.find(q => q.def.id === id);
    if (!d) return null;
    const full = dir > 0 ? d.v > .9 : d.v < .1;
    return { x: d.def.x + (full ? 0 : dir * PADDLE_X), y: d.def.y + (full ? 0 : dir > 0 ? -PADDLE : PADDLE), how: full ? 'hold' : dir > 0 ? 'up' : 'down', what: id };
  }
  /** Kit piece that hauls gate `gate` open, if any. */
  opener(gate: string) {
    return [...this.def.vents ?? [], ...this.def.dials ?? [], ...this.def.balances ?? [], ...this.def.sequences ?? []].find(q => q.opens === gate)?.id;
  }
  /** Props to push for a socket or an intake: the one to move, and which way. */
  zone(id: string) {
    const so = (this.def.sockets ?? []).find(q => q.id === id), cl = (this.def.clears ?? []).find(q => q.id === id);
    return so ? { x0: so.x0, x1: so.x1, into: true } : cl ? { x0: cl.x0, x1: cl.x1, into: false } : undefined;
  }
  private dialFocus(d: Dial): Focus {
    const [lo, hi] = d.def.band, mid = (lo + hi) / 2, inner = (hi - lo) * .25;
    // A pull dial slackens on its own, and water still in flight keeps pulling: stop early in its band.
    const settled = d.def.mode === 'pull' ? d.v >= lo + (hi - lo) * .2 : d.v >= lo + inner && d.v <= hi - inner;
    const how = settled ? 'hold' : d.def.mode === 'pull' || d.v < mid ? 'up' : 'down';
    const off = d.def.mode === 'pull' || how === 'hold' ? 0 : how === 'up' ? 1 : -1;
    return { x: d.def.x + off * PADDLE_X, y: d.def.y - off * PADDLE, how, what: d.def.id };
  }
  hint(f: Focus | null) {
    const steps = this.steps, i = steps.findIndex(s => !s.done);
    if (i < 0) return 'Semua langkah selesai • padamkan sisa api dan antar satwa ke bendera';
    let extra = '';
    const d = f && this.dials.find(q => q.def.id === f.what);
    if (d) extra = ` • ${d.def.label} ${Math.round(d.v * 100)}% → ${Math.round(d.def.band[0] * 100)}–${Math.round(d.def.band[1] * 100)}%${f!.how === 'hold' ? ' (tahan — berhenti menyemprot)' : d.def.mode === 'set' ? (f!.how === 'up' ? ' (semprot +)' : ' (semprot −)') : ''}`;
    const v = f && this.vents.find(q => q.def.id === f.what);
    if (v && !v.def.inspect) extra = ` • lembap ${Math.round(v.wet * 100)}% (perlu ${Math.round((v.def.need ?? .84) * 100)}% selama ${v.def.hold ?? 2} dtk)`;
    return `M${i + 1}/${steps.length}: ${steps[i].title}${extra}`;
  }
  status() {
    return { steps: this.steps.map(s => s.done), vents: this.vents.map(v => `${v.def.id}:${v.wet.toFixed(2)}:${v.cooled}`), dials: this.dials.map(d => `${d.def.id}:${d.v.toFixed(2)}${d.latched ? 'L' : ''}`),
      companion: this.companion?.arrived };
  }
}
