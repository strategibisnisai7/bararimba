import Phaser from 'phaser';
import { WATER_GRAVITY, WATER_SPEED, WATER_RATE, WATER_USE, type Nozzle } from '../config/level';
import { firstHit, type Surface, type Hit } from '../physics/collision';
import type { Fire } from './FireSystem';

interface Drop {
  x: number; y: number; vx: number; vy: number; life: number; age: number; size: number;
  /** Seconds left before a drop resting on the ground soaks in; 0 while airborne. */
  flow: number; img: Phaser.GameObjects.Image;
  /** Ground height under a running drop; the drop rides on top of the local water column. */
  gy: number;
}
const TINTS = [0x2f9ee8, 0x45b4f5, 0x6cc8ff, 0x9fdcff, 0xd6f2ff, 0x1f8ad6];
const SOAK = 9;            // seconds a thin film of running water lasts before it has soaked in
const FRICTION = .45;      // horizontal damping of a thin running film, 1/s (pools damp harder)
const COL = 6;             // width of a water column, px
const LAYER = 3.5;         // depth one running drop adds to its column, px
const MAX_DEPTH = 96;      // deepest a column of running water stacks, px
const PRESS = 700;         // acceleration per unit of water-surface gradient, px/s^2
const BAND = 40;           // drops whose ground differs by more than this belong to separate layers
const GRID = 96;           // broad-phase column width, px
/** Water at one height in one column (a ledge and the ground below it are separate cells). */
interface Cell { gy: number; sum: number; n: number }

/** Ballistic water particles with swept collision. Drops that land on ground or props keep running
 * along the surface, bounce off walls, pour over edges and soak in gradually; only fire and the
 * river consume them at once. A ribbon joins consecutive airborne drops into a solid jet. */
export class WaterSystem {
  supply: number;
  used = 0;
  private pool: Drop[];
  private emission = 0;
  private head = 0;
  private ribbon: Phaser.GameObjects.Graphics;
  private cells = new Map<number, Cell[]>();
  /** Ground height near a column at a given level (raycast), refreshed often since gates and props move. */
  private groundCache = new Map<number, number | null>();
  private cacheT = 0;
  private t = 0;
  /** Surfaces overlapping each GRID column (in `surfaces` order, so tie-breaks match a full scan). */
  private grid = new Map<number, Surface[]>();
  private liquid: Phaser.GameObjects.Graphics;
  /** Optional sink (e.g. a basin) that swallows drops entering its water. */
  absorb?: (x: number, y: number) => boolean;
  constructor(scene: Phaser.Scene, private surfaces: Surface[], private fires: () => Fire[],
    private onHit: (hit: Hit, d: { vx: number; vy: number }) => void, private onFire: (f: Fire, x: number, y: number) => void,
    private onMist: (x: number, y: number) => void, readonly capacity: number) {
    this.supply = capacity;
    this.ribbon = scene.add.graphics().setDepth(39);
    this.liquid = scene.add.graphics().setDepth(12.6);
    this.pool = Array.from({ length: 1400 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, age: 0, size: 1, flow: 0, gy: 0,
      img: scene.add.image(0, 0, 'p-drop').setVisible(false).setDepth(40) }));
  }
  step(dt: number, firing: boolean, n: Nozzle, unlimited = false) {
    if (firing && (this.supply > 0 || unlimited)) {
      if (!unlimited) { const use = Math.min(this.supply, dt * WATER_USE); this.supply -= use; this.used += use; }
      this.emission += dt * WATER_RATE;
      while (this.emission >= 1) { this.emission--; this.spawn(n); }
    } else this.emission = 0;
    const fires = this.fires();
    this.t += dt;
    this.buildGrid();
    if ((this.cacheT -= dt) <= 0) { this.cacheT = .3; this.groundCache.clear(); }
    // Pooling: running drops per column and layer form a water column; its surface drives the flow.
    this.cells.clear();
    for (const p of this.pool) {
      if (p.life <= 0 || p.flow <= 0) continue;
      const c = Math.floor(p.x / COL);
      let list = this.cells.get(c);
      if (!list) this.cells.set(c, list = []);
      let cell = list.find(k => Math.abs(k.sum / k.n - p.gy) < BAND);
      if (!cell) list.push(cell = { gy: 0, sum: 0, n: 0 });
      cell.sum += p.gy; cell.n++;
    }
    for (const list of this.cells.values()) for (const k of list) k.gy = k.sum / k.n;
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt; p.age += dt;
      if (p.flow > 0) { this.run(p, dt, fires); continue; }
      const next = { x: p.x + p.vx * dt, y: p.y + p.vy * dt + .5 * WATER_GRAVITY * dt * dt };
      p.vy += WATER_GRAVITY * dt;
      let burning: Fire | undefined;
      for (const f of fires) if (f.contains(next.x, next.y)) { burning = f; break; }
      if (burning) { this.onFire(burning, next.x, next.y); this.kill(p); continue; }
      if (this.absorb?.(next.x, next.y)) { this.kill(p); continue; }
      const hit = this.hit(p, next);
      if (hit) { this.onHit(hit, p); this.land(p, hit); continue; }
      p.x = next.x; p.y = next.y;
      if (p.age > .28 && Math.random() < .006) this.onMist(p.x, p.y);
      if (p.y > 760 || p.life <= 0) this.kill(p);
    }
  }
  private buildGrid() {
    this.grid.clear();
    for (const s of this.surfaces) {
      if (!s.body.vertices) continue;
      const b = s.body.bounds;
      for (let k = Math.floor(b.min.x / GRID); k <= Math.floor(b.max.x / GRID); k++) {
        const list = this.grid.get(k);
        if (list) list.push(s); else this.grid.set(k, [s]);
      }
    }
  }
  /** Ray test against only the surfaces near the segment (almost every drop step stays in one column). */
  private hit(from: { x: number; y: number }, to: { x: number; y: number }) {
    const k0 = Math.floor(Math.min(from.x, to.x) / GRID), k1 = Math.floor(Math.max(from.x, to.x) / GRID);
    if (k0 === k1) return firstHit(from, to, this.grid.get(k0) ?? []);
    const near = new Set<Surface>();
    for (let k = k0; k <= k1; k++) for (const s of this.grid.get(k) ?? []) near.add(s);
    return firstHit(from, to, [...near]);
  }
  /** Turn an impact into running water, a slide down a wall, or a merge with the river. */
  private land(p: Drop, hit: Hit) {
    if (['river', 'switch', 'raft', 'handle'].includes(hit.surface.kind)) { this.kill(p); return; }
    const { normal: nrm, point } = hit;
    if (hit.surface.kind === 'mirror') {
      // Reflector panel: mirror the velocity about the struck face, losing a little speed.
      const dot = p.vx * nrm.x + p.vy * nrm.y;
      p.vx = (p.vx - 2 * dot * nrm.x) * .94; p.vy = (p.vy - 2 * dot * nrm.y) * .94;
      p.x = point.x + nrm.x * 2; p.y = point.y + nrm.y * 2;
      return;
    }
    if (hit.surface.kind === 'ramp') {
      // Skim: keep only the speed along the plank, so a jet slides up it and launches off the end.
      let tx = -nrm.y, ty = nrm.x;
      const along = p.vx * tx + p.vy * ty;
      if (along < 0) { tx = -tx; ty = -ty; }
      const speed = Math.abs(along) * .97;
      p.vx = tx * speed; p.vy = ty * speed;
      p.x = point.x + nrm.x * 1.5; p.y = point.y + nrm.y * 1.5;
      return;
    }
    if (nrm.y < -.55) {            // floor: keep most of the horizontal momentum and start running
      p.x = point.x; p.y = point.y - 1.5; p.gy = point.y;
      p.vx = p.vx * .35 + (Math.random() - .5) * 40; p.vy = 0;   // the splash eats most of the jet's push
      p.flow = SOAK * (.75 + Math.random() * .5);
      p.life = Math.max(p.life, p.flow + .2);
    } else if (Math.abs(nrm.x) > .55) { // wall: lose the push, trickle down its face
      p.x = point.x + nrm.x * 2; p.y = point.y;
      p.vx = nrm.x * Math.abs(p.vx) * .12; p.vy = Math.max(0, p.vy) * .3;
    } else {                        // ceiling or underside
      p.x = point.x; p.y = point.y + 2; p.vy = Math.abs(p.vy) * .2;
    }
  }
  private cell(c: number, gy: number) { return this.cells.get(c)?.find(k => Math.abs(k.gy - gy) < BAND); }
  private depth(k?: Cell) { return k ? Math.min(MAX_DEPTH, k.n * LAYER) : 0; }
  /** Ground under column c near level gy, or null over a drop-off. */
  private groundNear(c: number, gy: number) {
    const key = c * 4096 + Math.round(gy / 16);
    if (this.groundCache.has(key)) return this.groundCache.get(key)!;
    const x = c * COL + COL / 2;
    const hit = this.hit({ x, y: gy - 36 }, { x, y: gy + 140 });
    const y = hit && hit.surface.kind !== 'river' && hit.normal.y < 0 ? hit.point.y : null;
    this.groundCache.set(key, y);
    return y;
  }
  /** Water surface height of column c at level gy: its water top, else the bare ground (a drop-off is far below). */
  private surface(c: number, gy: number) {
    const k = this.cell(c, gy);
    if (k) return k.gy - this.depth(k);
    return this.groundNear(c, gy) ?? gy + 200;
  }
  private run(p: Drop, dt: number, fires: Fire[]) {
    const c = Math.floor(p.x / COL), own = this.cell(c, p.gy), d = Math.max(LAYER, this.depth(own));
    // A thin film soaks in; standing pools barely do, so they keep spreading and can overflow.
    p.flow -= dt * (d > 10 ? .12 : d > 5 ? .45 : 1);
    if (p.flow <= 0) { this.kill(p); return; }
    // Like a liquid finding its level: accelerate toward the lower water surface (ground slope and
    // pile height alike), so water runs downhill, fills hollows and spills over their rims.
    const grad = Phaser.Math.Clamp((this.surface(c + 1, p.gy) - this.surface(c - 1, p.gy)) / (2 * COL), -2.5, 2.5);
    p.vx += (grad * PRESS + (Math.random() - .5) * 30) * dt;
    p.vx *= 1 - Math.min(1, (d > 12 ? .9 : FRICTION) * dt);
    p.vx = Phaser.Math.Clamp(p.vx, -280, 280);
    const nx = p.x + p.vx * dt;
    const top = p.gy - d;
    for (const f of fires) if (f.contains(nx, top - 4)) { this.onFire(f, nx, top - 4); this.kill(p); return; }
    // Wall ahead below the current water surface: the drop is held back, so the pool fills up.
    const wall = this.hit({ x: p.x, y: top - 1 }, { x: nx + Math.sign(p.vx) * 2, y: top - 1 });
    if (wall && wall.surface.kind !== 'river') {
      // Running water carries momentum: it shoves loose objects it piles against.
      if (wall.surface.kind === 'prop') this.onHit(wall, { vx: p.vx * 2.5, vy: 0 });
      p.vx = -p.vx * .3; p.y = top; return;
    }
    p.x = nx;
    if (this.absorb?.(p.x, top)) { this.kill(p); return; }
    // Follow the ground (small rises included); with nothing beneath, pour over the edge as a falling drop.
    const ground = this.hit({ x: p.x, y: top - 6 }, { x: p.x, y: p.gy + 10 });
    if (!ground) { p.flow = 0; p.y = top; p.vy = 20; p.life = Math.max(p.life, 3); return; }
    if (ground.surface.kind === 'river') { this.kill(p); return; }
    p.gy = ground.point.y;
    p.y = p.gy - d;
  }
  private kill(p: Drop) { p.life = 0; p.flow = 0; p.img.setVisible(false); }
  private spawn(n: Nozzle) {
    // Ring order = spawn order, so neighbours in the pool form the continuous jet ribbon.
    let p = this.pool[this.head];
    for (let k = 0; k < 24 && p.life > 0; k++) { this.head = (this.head + 1) % this.pool.length; p = this.pool[this.head]; }
    if (p.life > 0) this.kill(p);   // every slot busy (big pools): recycle rather than starve the jet
    this.head = (this.head + 1) % this.pool.length;
    const a = n.angle + (Math.random() + Math.random() - 1) * .045;
    const s = WATER_SPEED * (.95 + Math.random() * .08);
    const off = (Math.random() - .5) * 8;
    p.x = n.x - Math.sin(a) * off; p.y = n.y + Math.cos(a) * off;
    p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
    p.life = 6; p.age = 0; p.flow = 0; p.size = .4 + Math.random() * .35;
    p.img.setTint(TINTS[(Math.random() * TINTS.length) | 0]).setVisible(true);
  }
  /** Water poured by a mechanism (e.g. a trough fed by the water wheel); costs no supply. */
  pour(x: number, y: number, vx: number, vy: number) {
    const p = this.pool.find(d => d.life <= 0); if (!p) return;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = 6; p.age = .5; p.flow = 0; p.size = .45 + Math.random() * .3;
    p.img.setTint(TINTS[(Math.random() * TINTS.length) | 0]).setVisible(true);
  }
  render() {
    const g = this.ribbon.clear();
    const N = this.pool.length;
    // Solid core jet: thick blue band with a bright inner line, tapering as the stream breaks up.
    for (const [w, color, alpha] of [[1, 0x1f8fe0, .95], [.62, 0x7fd3ff, .95], [.28, 0xf2fcff, .95]] as const) {
      for (let k = 1; k < N; k++) {
        const i = (this.head - k + N) % N, j = (i - 1 + N) % N;
        const a = this.pool[i], b = this.pool[j];
        if (a.life <= 0 || b.life <= 0 || a.flow > 0 || b.flow > 0 || a.age > .75) continue;
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 34) continue;
        const width = (26 - a.age * 26) * w;
        if (width <= .5) continue;
        g.lineStyle(width, color, alpha * Math.min(1, 1.6 - a.age * 2)).lineBetween(a.x, a.y, b.x, b.y);
      }
    }
    this.renderLiquid();
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      if (p.flow > 0) { p.img.setVisible(false); continue; }   // drawn as part of the liquid sheet
      p.img.setVisible(true);
      const speed = Math.hypot(p.vx, p.vy);
      const s = p.size * (1 + Math.min(p.age, 1.2) * .9);
      p.img.setPosition(p.x, p.y).setRotation(Math.atan2(p.vy, p.vx))
        .setScale(s * (1 + speed / 900), s * .85).setAlpha(Math.max(.25, .95 - p.age * .45));
    }
  }
  /** Running water as one liquid body: each column's water drawn from the ground up to a gently
   * moving surface, with a bright surface line and darker depths, so streams and pools read as liquid. */
  private renderLiquid() {
    const g = this.liquid.clear();
    const tops: { x: number; s: number; gy: number; deep: number }[] = [];
    for (const [c, list] of this.cells) for (const k of list) {
      const dep = Math.max(3, this.depth(k)), x = c * COL;
      const s = k.gy - dep + Math.sin(this.t * 5 + c * .55) * Math.min(1.6, dep * .08);
      tops.push({ x, s, gy: k.gy, deep: dep });
    }
    // Neighbouring columns at the same level form one body: a polygon under a smoothed surface line.
    tops.sort((a, b) => a.x - b.x || a.gy - b.gy);
    const runs: typeof tops[] = [];
    for (const q of tops) {
      const run = runs.find(r => { const l = r[r.length - 1]; return q.x - l.x === COL && Math.abs(q.gy - l.gy) < 14; });
      if (run) run.push(q); else runs.push([q]);
    }
    for (const run of runs) {
      const sm = run.map((q, i) => (run[Math.max(0, i - 1)].s + q.s * 2 + run[Math.min(run.length - 1, i + 1)].s) / 4);
      const surf = run.map((q, i) => ({ x: q.x + COL / 2, y: sm[i] }));
      const first = run[0], last = run[run.length - 1];
      const body = [{ x: first.x, y: first.gy + 2 }, { x: first.x, y: sm[0] + 1 }, ...surf, { x: last.x + COL, y: sm[sm.length - 1] + 1 }, { x: last.x + COL, y: last.gy + 2 }];
      for (let i = run.length - 1; i >= 0; i--) body.push({ x: run[i].x + COL / 2, y: run[i].gy + 3 });
      g.fillStyle(0x2f9fe6, .84).fillPoints(body, true);
      // Darker depths, a bright surface line, and glints drifting along it.
      const deep = surf.map((v, i) => ({ x: v.x, y: v.y + Math.min(run[i].deep * .5, run[i].gy - v.y) }));
      if (run.some(q => q.deep > 12)) g.fillStyle(0x1a6fb8, .3).fillPoints([...deep, ...run.map(q => ({ x: q.x + COL / 2, y: q.gy + 3 })).reverse()], true);
      g.lineStyle(2, 0xd6f4ff, .9).strokePoints(surf, false);
      for (let i = 0; i < run.length; i++) if (((run[i].x / COL) * 7 + Math.floor(this.t * 6)) % 23 === 0) g.fillStyle(0xffffff, .85).fillCircle(surf[i].x, surf[i].y + 1.5, 1.4);
    }
  }
  /** Airborne drops that will pass within r of (x, y) during the next `horizon` seconds (dodge sense). */
  incoming(x: number, y: number, r: number, horizon: number) {
    let n = 0;
    for (const p of this.pool) {
      if (p.life <= 0 || p.flow > 0 || Math.abs(p.vx) < 1) continue;
      const t = (x - p.x) / p.vx;
      if (t <= 0 || t > horizon) continue;
      if (Math.abs(p.y + p.vy * t + .5 * WATER_GRAVITY * t * t - y) < r) n++;
    }
    return n;
  }
  /** Remove airborne drops within r of (x, y) (they struck something); returns the count. */
  hitTest(x: number, y: number, r: number) {
    let n = 0; const r2 = r * r;
    for (const p of this.pool) if (p.life > 0 && p.flow === 0 && (p.x - x) ** 2 + (p.y - y) ** 2 < r2) { this.kill(p); n++; }
    return n;
  }
  /** Sum of lever arms (x - pivotX) of running drops resting within [x0,x1] near height y. */
  leverOn(x0: number, x1: number, yTop: number, yBot: number, pivotX: number) {
    let t = 0;
    for (const p of this.pool) if (p.life > 0 && p.flow > 0 && p.x > x0 && p.x < x1 && p.gy > yTop && p.gy < yBot) t += p.x - pivotX;
    return t;
  }
  clearDrops() { this.emission = 0; for (const p of this.pool) this.kill(p); this.ribbon.clear(); this.liquid.clear(); }
  refill(amount: number) { this.supply = Math.min(this.capacity, this.supply + amount); }
  get active() { return this.pool.filter(p => p.life > 0).length; }
}
