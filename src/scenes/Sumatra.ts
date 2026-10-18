import Phaser from 'phaser';
import type { LevelDef } from '../config/levels';
import type { BasinDef, DrawbridgeDef, MirrorDef, SumatraDef } from '../config/sumatraLevels';
import type { Point } from '../config/level';
import type { Surface } from '../physics/collision';
import type { Animal } from '../entities/Animal';
import type { World } from './World';

const DEG = Math.PI / 180;
/** Spray-operated handle (valve wheel, lock pin, panel lever): `need` drop hits trigger it. */
interface Handle { x: number; y: number; need: number; hits: number; cool: number; fire?: number; done: boolean; surface: Surface;
  ring: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; act: () => void }
interface Raft { def: NonNullable<SumatraDef['raft']>; x: number; vx: number; phase: 'free' | 'docked' | 'ferry' | 'home'; boarded: boolean;
  body: MatterJS.BodyType; surface: Surface; sprite: Phaser.GameObjects.Image; bob: number }
interface Plat { x: number; w: number; top: number; body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image }
interface Mirror { def: MirrorDef; idx: number; angle: number; body: MatterJS.BodyType; frame: Phaser.GameObjects.Image; glass: Phaser.GameObjects.Graphics }
interface Bridge { def: DrawbridgeDef; a: number; w: number; state: 'locked' | 'falling' | 'down' | 'hanging' | 'winch'; t: number; locks: Handle[];
  body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image }
interface Basin { def: BasinDef; volume: number; level: number; g: Phaser.GameObjects.Graphics; open: Set<string>; acc: Record<string, number>;
  lift?: Plat & { f: number; latched: boolean } }

const PLAT_H = 20, RAFT_TOP = 556;

/** Sumatra mechanisms layered on the shared World. They use the same water drops, Matter bodies, fires and
 * gates as Jawa; only the level data and these mechanisms are new. */
export class SumatraWorld {
  readonly def: SumatraDef;
  readonly flag: Phaser.GameObjects.Image;
  /** Ids finished outside this module (e.g. 'boss'). */
  readonly flags = new Set<string>();
  animal?: Animal;
  onPour?: (x: number, y: number, vx: number, vy: number) => void;
  onEvent?: (msg: string) => void;
  private ropeG: Phaser.GameObjects.Graphics;
  private fx: Phaser.GameObjects.Graphics;
  private handles: Handle[] = [];
  private raft?: Raft;
  private bal?: { def: NonNullable<SumatraDef['balance']>; l: Plat; r: Plat; offset: number; latched: boolean };
  private mirrors: Mirror[] = [];
  private bridges: Bridge[] = [];
  private basins: Basin[] = [];
  private chain?: { def: NonNullable<SumatraDef['chainGate']>; f: number; held: number; latched: boolean; body: MatterJS.BodyType; surface: Surface; sprite: Phaser.GameObjects.Image };
  private t = 0;
  private lostT = 0;

  constructor(private scene: Phaser.Scene, private world: World, private level: LevelDef) {
    this.def = level.sm!;
    const s = scene, d = this.def;
    for (const c of d.chambers ?? []) {
      // Dark cave interior behind the chamber, fading toward its mouth.
      s.add.graphics().setDepth(9).fillGradientStyle(0x0c1714, 0x0c1714, 0x1d2b24, 0x1d2b24, .92).fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
    }
    for (const r of d.ropes ?? []) s.add.image(r.via.x, r.via.y, 'sm-pulley-single').setOrigin(.5, .25).setScale(.55).setDepth(16);
    this.ropeG = s.add.graphics().setDepth(15.8);
    this.fx = s.add.graphics().setDepth(20.5);
    if (d.raft) this.makeRaft();
    if (d.balance) this.makeBalance();
    for (const m of d.mirrors ?? []) this.makeMirror(m);
    for (const b of d.bridges ?? []) this.makeBridge(b);
    for (const b of d.basins ?? []) this.makeBasin(b);
    if (d.chainGate) this.makeChain();
    const fx = d.rescue.flagX;
    this.flag = s.add.image(fx, world.groundAt(fx) + 8, 'sm-flag').setOrigin(.3, 1).setScale(.62).setDepth(17);
  }

  // ---------- building ----------
  private body(x: number, y: number, w: number, h: number, kind: Surface['kind'], angle = 0) {
    const body = this.scene.matter.add.rectangle(x, y, w, h, { isStatic: true, label: kind, angle, friction: .6 });
    const surface: Surface = { body, kind, enabled: true };
    this.world.surfaces.push(surface);
    return { body, surface };
  }
  private handle(p: Point, need: number, icon: string, act: () => void, fire?: number) {
    const s = this.scene;
    const { surface } = this.body(p.x, p.y, 34, 34, 'handle');
    // Same painted target language as the Jawa switches: wooden board with red rings.
    const ring = s.add.graphics().setDepth(15);
    for (const [r, c] of [[19, 0x6b4421], [16, 0xffffff], [11, 0xe53a2a], [5, 0xffffff]] as const) ring.fillStyle(c, 1).fillCircle(p.x, p.y, r);
    const ic = s.add.image(p.x, p.y, icon).setScale(.28).setDepth(15.5);
    const h: Handle = { x: p.x, y: p.y, need, hits: 0, cool: 0, fire, done: false, surface, ring, icon: ic, act };
    this.handles.push(h);
    return h;
  }
  private makeRaft() {
    const d = this.def.raft!, s = this.scene;
    const { body, surface } = this.body(d.x, RAFT_TOP + 10, d.w, PLAT_H, 'raft');
    const sprite = s.add.image(d.x, RAFT_TOP + 26, 'sm-raft').setOrigin(.5, .62).setScale(d.w / 250).setDepth(21);
    this.raft = { def: d, x: d.x, vx: 0, phase: 'free', boarded: false, body, surface, sprite, bob: 0 };
    s.add.image(d.home - d.w / 2 - 20, RAFT_TOP + 8, 'sm-post').setOrigin(.5, 1).setScale(.42).setDepth(19);
    s.add.image(d.dock[1] + 30, RAFT_TOP + 8, 'sm-post').setOrigin(.5, 1).setScale(.42).setDepth(19);
  }
  private plat(x: number, w: number, top: number, key = 'sm-beam') {
    const { body } = this.body(x, top + PLAT_H / 2, w, PLAT_H, 'terrain');
    const sprite = this.scene.add.image(x, top + PLAT_H / 2, key).setDisplaySize(w + 12, PLAT_H + 12).setDepth(20);
    return { x, w, top, body, sprite };
  }
  private makeBalance() {
    const d = this.def.balance!, s = this.scene;
    for (const p of [d.left, d.right]) s.add.image(p.x, d.pulleyY, 'sm-pulley').setOrigin(.5, .2).setScale(.6).setDepth(16);
    const off = d.travel * Math.tanh(-d.animalLoad / 2);
    this.bal = { def: d, l: this.plat(d.left.x, d.left.w, d.mid + off), r: this.plat(d.right.x, d.right.w, d.mid - off), offset: off, latched: false };
  }
  private makeMirror(m: MirrorDef) {
    const s = this.scene, a = m.angles[m.start] * DEG;
    const { body } = this.body(m.x, m.y, m.len, 10, 'mirror', a);
    s.add.image(m.x, m.y + 6, 'sm-post').setOrigin(.5, 0).setScale(.38).setDepth(18);
    const frame = s.add.image(m.x, m.y, 'sm-beam').setDisplaySize(m.len + 14, 20).setRotation(a).setDepth(19);
    const glass = s.add.graphics().setDepth(19.5);
    const mir: Mirror = { def: m, idx: m.start, angle: a, body, frame, glass };
    this.mirrors.push(mir);
    this.handle(m.handle, 30, 'gear', () => this.turnMirror(mir));
  }
  private turnMirror(m: Mirror) {
    m.idx = (m.idx + 1) % m.def.angles.length;
    const to = m.def.angles[m.idx] * DEG;
    this.scene.tweens.addCounter({ from: m.angle, to, duration: 380, ease: 'back.out', onUpdate: tw => {
      m.angle = tw.getValue() ?? to;
      this.scene.matter.body.setAngle(m.body, m.angle);
    } });
    this.onEvent?.('Panel pemantul berputar!');
  }
  private makeBridge(d: DrawbridgeDef) {
    const s = this.scene, a = (d.startAngle ?? 90) * DEG;
    const { body } = this.body(d.hingeX, d.hingeY, d.len, 18, 'terrain');
    const sprite = s.add.image(d.hingeX, d.hingeY, 'sm-rope-bridge').setOrigin(d.dir > 0 ? .02 : .98, .3).setDisplaySize(d.len + 8, 46).setDepth(20);
    s.add.image(d.hingeX, d.hingeY + 10, 'sm-post').setOrigin(.5, 0).setScale(.5).setDepth(19);
    const br: Bridge = { def: d, a, w: 0, state: 'locked', t: 0, locks: [], body, sprite };
    br.locks = d.locks.map(l => {
      const h: Handle = this.handle(l, 12, 'hook', () => { h.done = true; this.onEvent?.('Pengunci terlepas!'); }, l.fire);
      return h;
    });
    this.bridges.push(br);
    this.placeBridge(br);
  }
  private placeBridge(b: Bridge) {
    const { hingeX, hingeY, len, dir } = b.def, ux = dir * Math.cos(b.a), uy = -Math.sin(b.a);
    this.scene.matter.body.setPosition(b.body, { x: hingeX + ux * len / 2, y: hingeY + uy * len / 2 });
    this.scene.matter.body.setAngle(b.body, Math.atan2(uy, ux));
    b.sprite.setRotation(dir > 0 ? Math.atan2(uy, ux) : Math.atan2(uy, ux) + Math.PI);
  }
  private makeBasin(d: BasinDef) {
    const s = this.scene, wall = 14;
    // Wooden tank: two side boards and a floor; collision for water so poured drops pool on it.
    this.body(d.x0 - wall / 2, d.floor - d.depth / 2 - 6, wall, d.depth + 12, 'terrain');
    this.body(d.x1 + wall / 2, d.floor - d.depth / 2 - 6, wall, d.depth + 12, 'terrain');
    this.body((d.x0 + d.x1) / 2, d.floor + 7, d.x1 - d.x0 + wall * 2, 14, 'terrain');
    s.add.image((d.x0 + d.x1) / 2, d.floor + 8, 'sm-beam').setDisplaySize(d.x1 - d.x0 + wall * 2 + 8, 22).setDepth(14);
    for (const x of [d.x0 - wall / 2, d.x1 + wall / 2]) s.add.image(x, d.floor - d.depth / 2 - 4, 'sm-beam').setDisplaySize(d.depth + 22, 18).setRotation(Math.PI / 2).setDepth(14);
    const g = s.add.graphics().setDepth(13.6);
    const b: Basin = { def: d, volume: 0, level: d.floor, g, open: new Set(), acc: {} };
    for (const v of d.valves ?? []) {
      b.acc[v.id] = 0;
      this.handle(v.handle, 8, 'gear', () => {
        b.open.has(v.id) ? b.open.delete(v.id) : b.open.add(v.id);
        this.onEvent?.(b.open.has(v.id) ? 'Katup terbuka — air mengalir!' : 'Katup ditutup.');
      });
    }
    if (d.lift) {
      const p = this.plat(d.lift.x, d.lift.w, d.lift.y);
      b.lift = { ...p, f: 0, latched: false };
      s.add.image(d.lift.x, d.lift.y - d.lift.travel - 120, 'sm-pulley').setOrigin(.5, .2).setScale(.6).setDepth(16);
    }
    this.basins.push(b);
  }
  private makeChain() {
    const d = this.def.chainGate!, h = d.y1 - d.y0;
    const { body, surface } = this.body(d.x, d.y0 + h / 2, 38, h, 'terrain');
    const sprite = this.scene.add.image(d.x, d.y0, 'sm-gate').setOrigin(.5, 0).setDisplaySize(h * .9, h + 6).setDepth(14);
    this.chain = { def: d, f: 0, held: 0, latched: false, body, surface, sprite };
  }

  // ---------- queries ----------
  /** Mechanism id done: a gate open, a docked raft, a raised lift, a lowered bridge, a latched chain gate, or a flag. */
  isDone(id: string): boolean {
    if (this.flags.has(id)) return true;
    const gates = this.world.puzzles.gates.filter(g => g.id === id);
    if (gates.length) return gates.every(g => g.open);
    if (id === 'raft') return !!this.raft && this.raft.phase !== 'free';
    if (id === 'balance') return !!this.bal?.latched;
    if (id === 'chain') return !!this.chain?.latched;
    if (id === 'pit') return (this.def.pits ?? []).some(p => this.filled(p));
    const br = this.bridges.find(b => b.def.id === id);
    if (br) return br.state === 'down';
    const bs = this.basins.find(b => b.def.id === id);
    if (bs) return !!bs.lift?.latched;
    return false;
  }
  get free() { return (this.def.rescue.after ?? []).every(id => this.isDone(id)); }
  /** Where the rescued animal heads now, 'wait' (stay put) or 'ride' (carried by the raft). */
  walkGoal(): number | 'wait' | 'ride' {
    const r = this.raft;
    if (r && !this.animal?.arrived) {
      if (r.phase === 'docked') return r.x;
      if (r.phase === 'ferry') return 'ride';
      if (r.phase === 'free') return 'wait';
    }
    return this.def.rescue.flagX;
  }
  /** The walking animal reached an intermediate goal (it stepped onto the docked raft). */
  reached() {
    const r = this.raft;
    if (r && r.phase === 'docked') { r.boarded = true; r.phase = 'ferry'; this.onEvent?.(`${this.level.animal.name} naik rakit! Arus membawanya pulang.`); }
  }
  /** Walkable tops added by mechanisms (docked raft, platforms, lowered bridges, lifts). */
  surfaceAt(x: number): number | null {
    let top: number | null = null;
    const take = (y: number) => { top = top === null ? y : Math.min(top, y); };
    const r = this.raft;
    // Moored or home, the raft bridges the last stride to the bank (its rope holds it alongside).
    if (r && (r.phase === 'docked' || r.phase === 'home') && Math.abs(x - r.x) < r.def.w / 2 + 30) take(RAFT_TOP);
    if (r && r.phase === 'ferry' && Math.abs(x - r.x) < r.def.w / 2) take(RAFT_TOP);
    if (this.bal) for (const p of [this.bal.l, this.bal.r]) if (Math.abs(x - p.x) <= p.w / 2) take(p.top);
    for (const b of this.bridges) {
      if (b.state !== 'down') continue;
      const { hingeX, hingeY, len, dir } = b.def, t = (x - hingeX) * dir;
      if (t >= -4 && t <= len) take(hingeY - 9);
    }
    for (const b of this.basins) if (b.lift && Math.abs(x - b.lift.x) <= b.lift.w / 2) take(b.lift.top);
    for (const p of this.def.pits ?? []) if (x >= p.x0 && x <= p.x1 && this.filled(p)) take(p.top);
    return top;
  }
  private filled(p: { x0: number; x1: number; top: number }) {
    return this.world.props.some(q => !q.gone && q.body.position.x > p.x0 - 10 && q.body.position.x < p.x1 + 10 && q.body.position.y > p.top - 10);
  }
  /** Animal path blockers owned by mechanisms. */
  blocks(x: number, top: number) {
    const c = this.chain;
    if (c && !c.latched && c.f < .85 && Math.abs(x - c.def.x) < 26 && c.def.y1 >= top - 8) return 'gate';
    return '';
  }
  /** Drops falling into a tank's open top join its volume. */
  absorb = (x: number, y: number) => {
    for (const b of this.basins) {
      const d = b.def;
      if (x > d.x0 && x < d.x1 && y > d.floor - d.depth - 4 && y < d.floor + 2) { b.volume += 1; return true; }
    }
    return false;
  };
  /** A fire went out: burnt-through locks open their gate. */
  fireOut(index: number) {
    for (const l of this.def.fireLocks ?? []) if (l.fire === index) { this.world.puzzles.openGate(l.gate); this.onEvent?.('Pengunci terbakar padam — terbuka!'); }
  }
  /** Water drop hits a surface; returns true when a mechanism handled it. `lit(i)` tells whether fire i burns. */
  waterHit(s: Surface, d: { vx: number; vy: number }, lit: (i: number) => boolean) {
    if (s.kind === 'raft' && this.raft && this.raft.phase === 'free') { this.raft.vx += d.vx * 1.2e-3; return true; }
    if (s.kind === 'handle') {
      const h = this.handles.find(q => q.surface === s);
      if (!h || h.done || h.cool > 0) return true;
      if (h.fire !== undefined && lit(h.fire)) { if (h.hits++ % 40 === 0) this.onEvent?.('Pengunci terbakar! Padamkan apinya dulu.'); return true; }
      if (++h.hits >= h.need) { h.hits = 0; h.cool = 1; h.act(); }
      return true;
    }
    return false;
  }
  status() {
    return { free: this.free, raft: this.raft ? `${Math.round(this.raft.x)}:${this.raft.phase}` : undefined, balance: this.bal ? Math.round(this.bal.r.top) : undefined,
      mirrors: this.mirrors.map(m => m.idx), bridges: this.bridges.map(b => `${b.def.id}:${b.state}:${Math.round(b.a / DEG)}`),
      basins: this.basins.map(b => `${b.def.id}:${Math.round(b.volume)}:${[...b.open].join('+')}${b.lift ? ':' + b.lift.f.toFixed(2) : ''}`),
      chain: this.chain ? `${this.chain.f.toFixed(2)}${this.chain.latched ? ' latched' : ''}` : undefined };
  }

  // ---------- update ----------
  update(dt: number) {
    this.t += dt;
    this.flag.setRotation(Math.sin(this.t * 2.2) * .03);
    for (const h of this.handles) {
      h.cool = Math.max(0, h.cool - dt);
      h.icon.setRotation(h.icon.rotation + dt * (h.cool > 0 ? 8 : .4));
      h.ring.setAlpha(h.done ? .35 : .85 + Math.sin(this.t * 5) * .15);
    }
    this.updateRopes();
    if (this.raft) this.updateRaft(dt);
    if (this.bal) this.updateBalance(dt);
    this.fx.clear();
    for (const m of this.mirrors) this.drawMirror(m);
    for (const b of this.bridges) this.updateBridge(b, dt);
    for (const b of this.basins) this.updateBasin(b, dt);
    if (this.chain) this.updateChain(dt);
    if (this.def.respawn) this.updateRespawn(dt);
  }
  /** Bring back a level boulder lost before its job was done (sunk in the river, rolled off or overshot). */
  private updateRespawn(dt: number) {
    const r = this.def.respawn!;
    if (this.isDone(r.unless)) return;
    this.level.props.forEach((d, i) => {
      if (d.kind !== 'boulder') return;
      const pr = this.world.props.filter(p => !p.plug)[i];
      if (!pr) return;
      const { x, y } = pr.body.position;
      const lost = pr.gone || x > (r.lostX ?? Infinity) || y > (r.lostY ?? 640);
      if (!lost) return;
      this.lostT += dt;
      if (this.lostT < 1.5) return;
      this.lostT = 0;
      if (!pr.gone) {
        pr.gone = true; pr.surface.enabled = false; this.scene.matter.world.remove(pr.body);
        this.scene.tweens.add({ targets: pr.sprite, alpha: 0, duration: 400, onComplete: () => pr.sprite.destroy() });
      }
      const fresh = this.world.prop(d.kind, d.x, d.y);
      const list = this.world.props;
      list.splice(list.indexOf(fresh), 1);
      list.splice(list.indexOf(pr), 1, fresh);
      fresh.sprite.setAlpha(0);
      this.scene.tweens.add({ targets: fresh.sprite, alpha: 1, duration: 500 });
      this.onEvent?.('Batu baru muncul di tempat semula. Coba lagi!');
    });
  }
  private updateRopes() {
    const g = this.ropeG.clear();
    const rope = (pts: Point[]) => {
      g.lineStyle(5, 0x5a3a1c, 1).beginPath().moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) g.lineTo(p.x, p.y); g.strokePath();
      g.lineStyle(2, 0xd8b27a, .85).beginPath().moveTo(pts[0].x, pts[0].y - 1); for (const p of pts.slice(1)) g.lineTo(p.x, p.y - 1); g.strokePath();
    };
    for (const r of this.def.ropes ?? []) {
      const gate = this.world.puzzles.gate(r.gate);
      if (!gate) continue;
      // The rope follows the door as it is hauled up into the roof.
      const sag = Math.sin(this.t * 1.4) * 2;
      rope([r.from, { x: r.via.x - 14, y: r.via.y + 6 + sag }, { x: r.via.x + 14, y: r.via.y + 6 }, { x: gate.x, y: gate.sprite.y + 4 }]);
    }
    if (this.bal) {
      const { l, r, def } = this.bal;
      rope([{ x: l.x - l.w / 2 + 8, y: l.top }, { x: l.x - 16, y: def.pulleyY + 8 }]);
      rope([{ x: l.x + l.w / 2 - 8, y: l.top }, { x: l.x + 16, y: def.pulleyY + 8 }]);
      rope([{ x: l.x + 18, y: def.pulleyY - 6 }, { x: r.x - 18, y: def.pulleyY - 6 }]);
      rope([{ x: r.x - r.w / 2 + 8, y: r.top }, { x: r.x - 16, y: def.pulleyY + 8 }]);
      rope([{ x: r.x + r.w / 2 - 8, y: r.top }, { x: r.x + 16, y: def.pulleyY + 8 }]);
    }
    for (const b of this.basins) for (const v of b.def.valves ?? []) if (v.pipe) {
      // Wooden pipe from the tank to its spout.
      g.lineStyle(14, 0x5a3a1c, 1).beginPath().moveTo(v.pipe[0].x, v.pipe[0].y); for (const p of v.pipe.slice(1)) g.lineTo(p.x, p.y); g.strokePath();
      g.lineStyle(8, 0x9a6a3a, 1).beginPath().moveTo(v.pipe[0].x, v.pipe[0].y); for (const p of v.pipe.slice(1)) g.lineTo(p.x, p.y); g.strokePath();
    }
    for (const b of this.basins) if (b.lift) {
      const d = b.def.lift!, py = d.y - d.travel - 120;
      rope([{ x: b.lift.x - b.lift.w / 2 + 8, y: b.lift.top }, { x: b.lift.x - 14, y: py + 10 }]);
      rope([{ x: b.lift.x + b.lift.w / 2 - 8, y: b.lift.top }, { x: b.lift.x + 14, y: py + 10 }]);
      rope([{ x: b.lift.x + 18, y: py }, { x: (b.def.x0 + b.def.x1) / 2, y: b.def.floor - b.def.depth - 30 }]);
    }
    // Panel handles pull the reflector round on a long rope over the cave.
    for (const m of this.mirrors) rope([{ x: m.def.handle.x, y: m.def.handle.y - 18 }, { x: m.def.handle.x + 20, y: 90 }, { x: m.def.x, y: 90 }, { x: m.def.x, y: m.def.y - 10 }]);
    for (const br of this.bridges) {
      if (br.state !== 'locked' && br.state !== 'winch') continue;
      const { hingeX, hingeY, len, dir } = br.def, tip = { x: hingeX + dir * Math.cos(br.a) * len, y: hingeY - Math.sin(br.a) * len };
      for (const l of br.locks) if (!l.done) rope([tip, { x: l.x, y: l.y }]);
    }
    const c = this.chain;
    if (c) {
      const wh = this.world.wheel;
      if (wh) rope([{ x: wh.cx, y: wh.cy }, { x: c.def.x, y: c.def.y0 - 40 }, { x: c.def.x, y: c.sprite.y + 4 }]);
    }
  }
  private updateRaft(dt: number) {
    const r = this.raft!, d = r.def, M = this.scene.matter.body;
    if (r.phase === 'free' || r.phase === 'ferry') {
      r.vx += d.current * (r.phase === 'ferry' ? 1.8 : 1) * dt;
      r.vx *= 1 - Math.min(1, .35 * dt);
      r.x += r.vx * dt;
      const lo = d.walls[0] + d.w / 2, hi = d.walls[1] - d.w / 2;
      if (r.x < lo) { r.x = lo; r.vx = Math.abs(r.vx) * .35; }
      if (r.x > hi) { r.x = hi; if (r.vx > 25) this.onEvent?.('Rakit terlalu kencang — terpental dari tebing!'); r.vx = -Math.abs(r.vx) * .45; }
      if (r.phase === 'free' && r.x >= d.dock[0] && r.x <= d.dock[1] && Math.abs(r.vx) < 38) {
        r.phase = 'docked'; r.vx = 0;
        this.onEvent?.('Rakit tertambat di dermaga!');
      }
      if (r.phase === 'ferry' && r.x <= d.home + 4) { r.phase = 'home'; r.vx = 0; r.x = d.home; this.onEvent?.('Rakit tiba di tepian!'); }
    }
    // Moored: the rope draws it to the middle of the dock.
    if (r.phase === 'docked') r.x += ((d.dock[0] + d.dock[1]) / 2 - r.x) * Math.min(1, dt * 3);
    r.bob += dt;
    M.setPosition(r.body, { x: r.x, y: RAFT_TOP + PLAT_H / 2 });
    r.sprite.setPosition(r.x, RAFT_TOP + 26 + Math.sin(r.bob * 2.4) * 2 + (r.boarded && r.phase !== 'home' ? 4 : 0)).setRotation(Math.sin(r.bob * 1.7) * .02 + r.vx * .0008);
    if (r.phase === 'ferry' && this.animal) { this.animal.px = r.x; this.animal.py = RAFT_TOP + Math.sin(r.bob * 2.4) * 2; }
  }
  private load(p: Plat) {
    let m = 0;
    for (const pr of this.world.props) {
      if (pr.gone || pr.floating) continue;
      const b = pr.body;
      if (Math.abs(b.position.x - p.x) < p.w / 2 + 6 && b.bounds.max.y > p.top - 10 && b.bounds.max.y < p.top + 14) m += b.mass;
    }
    return m;
  }
  private movePlat(p: Plat, top: number) {
    if (Math.abs(top - p.top) < .01) return;
    // Carry whatever rests on it (rocks, the animal) along.
    const dy = top - p.top, M = this.scene.matter.body;
    for (const pr of this.world.props) {
      const b = pr.body;
      if (!pr.gone && Math.abs(b.position.x - p.x) < p.w / 2 + 6 && b.bounds.max.y > p.top - 10 && b.bounds.max.y < p.top + 14) M.translate(b, { x: 0, y: dy });
    }
    const a = this.animal;
    if (a && Math.abs(a.px - p.x) < p.w / 2 && Math.abs(a.py - p.top) < 8) a.py = top;
    p.top = top;
    M.setPosition(p.body, { x: p.x, y: top + PLAT_H / 2 });
    p.sprite.setPosition(p.x, top + PLAT_H / 2);
  }
  private updateBalance(dt: number) {
    const b = this.bal!, d = b.def;
    if (b.latched) return;
    const onRight = this.animal && Math.abs(this.animal.px - b.r.x) < b.r.w / 2 ? d.animalLoad : 0;
    const goal = d.travel * Math.tanh((this.load(b.l) - this.load(b.r) - onRight) / 2);
    b.offset += Phaser.Math.Clamp(goal - b.offset, -70 * dt, 70 * dt);
    this.movePlat(b.l, d.mid + b.offset);
    this.movePlat(b.r, d.mid - b.offset);
    if (b.r.top <= d.topY + 2) { b.latched = true; this.onEvent?.('Platform naik dan terkunci!'); }
  }
  private drawMirror(m: Mirror) {
    const a = m.angle, h = m.def.len / 2, c = Math.cos(a), s = Math.sin(a), nx = -s * 5, ny = c * 5;
    m.frame.setRotation(a);
    this.fx.lineStyle(7, 0xbfefff, .95).lineBetween(m.def.x - c * h + nx * -.4, m.def.y - s * h - ny * .4, m.def.x + c * h + nx * -.4, m.def.y + s * h - ny * .4);
    this.fx.lineStyle(2, 0xffffff, .9).lineBetween(m.def.x - c * h * .7, m.def.y - s * h * .7 - 3, m.def.x + c * h * .2, m.def.y + s * h * .2 - 3);
  }
  private updateBridge(b: Bridge, dt: number) {
    b.t += dt;
    if (b.state === 'locked') {
      if (b.locks.every(l => l.done)) { b.state = 'falling'; b.w = -.35; this.onEvent?.('Semua pengunci lepas — jembatan jatuh!'); }
    }
    if (b.state === 'falling') {
      // Rod about its hinge: gravity torque ~ cos(a); light damping keeps the swing readable.
      b.w += -6 * Math.cos(b.a) * dt; b.w *= 1 - Math.min(1, .25 * dt);
      b.a += b.w * dt;
      const caught = b.def.stopper && this.world.props.some(p => !p.gone && p.body.position.x > b.def.stopper!.x0 && p.body.position.x < b.def.stopper!.x1 && Math.abs(p.body.velocity.x) < 1.5);
      if (b.a <= 0 && (caught || !b.def.stopper)) {
        b.a = 0; b.w = 0; b.state = 'down'; this.scene.cameras.main.shake(180, .006);
        this.onEvent?.(caught ? 'Batu penahan menahan jembatan — jalur terbuka!' : 'Jembatan turun!');
      } else if (b.a <= -65 * DEG) { b.a = -65 * DEG; b.w = 0; b.state = 'hanging'; b.t = 0; this.onEvent?.('Jembatan terayun lewat! Taruh batu penahan dulu — derek menariknya naik.'); }
    }
    if (b.state === 'hanging' && b.t > 2.5) { b.state = 'winch'; b.t = 0; }
    if (b.state === 'winch') {
      b.a = Math.min(90 * DEG, b.a + dt * 55 * DEG);
      if (b.a >= 90 * DEG) { b.state = 'locked'; for (const l of b.locks) { l.done = false; l.hits = 0; } this.onEvent?.('Jembatan terkunci lagi. Coba urutan lain!'); }
    }
    this.placeBridge(b);
    for (const l of b.locks) { l.icon.setAlpha(l.done ? .3 : 1); l.surface.enabled = !l.done; }
  }
  private updateBasin(b: Basin, dt: number) {
    const d = b.def, cap = (d.x1 - d.x0) * d.depth / 60;
    if (!b.lift?.latched) b.volume = Math.max(0, b.volume - (d.leak ?? 0) * dt);
    b.volume = Math.min(b.volume, cap);
    for (const v of d.valves ?? []) {
      if (!b.open.has(v.id) || b.volume <= 0) continue;
      b.acc[v.id] += dt * v.rate;
      while (b.acc[v.id] >= 1 && b.volume > 0) { b.acc[v.id]--; b.volume--; this.onPour?.(v.out.x + Math.random() * 6, v.out.y, v.out.vx * (.8 + Math.random() * .4), 10); }
      // The surge down the channel carries loose rocks with it.
      const sw = v.sweep;
      if (sw) for (const pr of this.world.props) {
        const p = pr.body.position;
        if (!pr.gone && p.x > sw.x0 && p.x < sw.x1 && p.y > sw.y0 && p.y < sw.y1) this.scene.matter.body.applyForce(pr.body, p, { x: pr.body.mass * 2.2e-4, y: 0 });
      }
    }
    const target = d.floor - d.depth * b.volume / cap;
    b.level += (target - b.level) * Math.min(1, dt * 4);
    const g = b.g.clear();
    if (d.floor - b.level > 1) {
      g.fillStyle(0x2f9ee8, .75).fillRect(d.x0, b.level, d.x1 - d.x0, d.floor - b.level);
      g.lineStyle(3, 0xd8f5ff, .9).beginPath();
      for (let x = d.x0; x <= d.x1; x += 8) { const y = b.level + Math.sin(this.t * 5 + x * .08) * 2; x === d.x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.strokePath();
    }
    for (const v of d.valves ?? []) if (b.open.has(v.id) && b.volume > 0) g.fillStyle(0xd8f5ff, .8).fillCircle(v.out.x + Math.random() * 8, v.out.y + Math.random() * 6, 3);
    const L = b.lift;
    if (L && !L.latched) {
      const lift = d.lift!;
      L.f += Phaser.Math.Clamp(Math.min(1, b.volume / lift.need) - L.f, -.25 * dt, .3 * dt);
      this.movePlat(L, lift.y - lift.travel * L.f);
      if (L.f >= .995) { L.latched = true; this.onEvent?.('Bak penuh — platform pengangkat terkunci di atas!'); }
    }
  }
  private updateChain(dt: number) {
    const c = this.chain!, d = c.def, h = d.y1 - d.y0, w = Math.abs(this.world.wheel?.w ?? 0);
    if (!c.latched) {
      c.f = Phaser.Math.Clamp(c.f + (w >= d.speed ? .45 : -.6) * dt, 0, 1);
      c.held = c.f >= 1 ? c.held + dt : 0;
      if (c.held >= d.hold) { c.latched = true; this.onEvent?.('Rantai terkunci — pintu goa tetap terbuka!'); }
    }
    const y = d.y0 - c.f * (h - 12);
    c.sprite.y = y;
    this.scene.matter.body.setPosition(c.body, { x: d.x, y: y + h / 2 });
    c.surface.enabled = c.f < .95;
  }
}
