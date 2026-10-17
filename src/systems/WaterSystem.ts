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
const SOAK = 4.5;          // seconds a drop keeps running over ground before it has soaked away
const FRICTION = .8;      // horizontal damping of running water, 1/s
const COL = 6;             // width of a water column used for pooling, px
const LAYER = 1.7;         // height one running drop adds to its column, px

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
  private columns = new Map<number, number>();
  /** Optional sink (e.g. a basin) that swallows drops entering its water. */
  absorb?: (x: number, y: number) => boolean;
  constructor(scene: Phaser.Scene, private surfaces: Surface[], private fires: () => Fire[],
    private onHit: (hit: Hit, d: { vx: number; vy: number }) => void, private onFire: (f: Fire, x: number, y: number) => void,
    private onMist: (x: number, y: number) => void, readonly capacity: number) {
    this.supply = capacity;
    this.ribbon = scene.add.graphics().setDepth(39);
    this.pool = Array.from({ length: 900 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, age: 0, size: 1, flow: 0, gy: 0,
      img: scene.add.image(0, 0, 'p-drop').setVisible(false).setDepth(40) }));
  }
  step(dt: number, firing: boolean, n: Nozzle, unlimited = false) {
    if (firing && (this.supply > 0 || unlimited)) {
      if (!unlimited) { const use = Math.min(this.supply, dt * WATER_USE); this.supply -= use; this.used += use; }
      this.emission += dt * WATER_RATE;
      while (this.emission >= 1) { this.emission--; this.spawn(n); }
    } else this.emission = 0;
    const fires = this.fires();
    // Pooling: count running drops per column so water stacks up in hollows and spreads downhill.
    this.columns.clear();
    for (const p of this.pool) if (p.life > 0 && p.flow > 0) { const c = Math.floor(p.x / COL); this.columns.set(c, (this.columns.get(c) ?? 0) + 1); }
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
      const hit = firstHit(p, next, this.surfaces);
      if (hit) { this.onHit(hit, p); this.land(p, hit); continue; }
      p.x = next.x; p.y = next.y;
      if (p.age > .28 && Math.random() < .006) this.onMist(p.x, p.y);
      if (p.y > 760 || p.life <= 0) this.kill(p);
    }
  }
  /** Turn an impact into running water, a slide down a wall, or a merge with the river. */
  private land(p: Drop, hit: Hit) {
    if (hit.surface.kind === 'river' || hit.surface.kind === 'switch') { this.kill(p); return; }
    const { normal: nrm, point } = hit;
    if (nrm.y < -.55) {            // floor: keep most of the horizontal momentum and start running
      p.x = point.x; p.y = point.y - 1.5; p.gy = point.y;
      p.vx = p.vx * .55 + (Math.random() - .5) * 30; p.vy = 0;
      p.flow = SOAK * (.75 + Math.random() * .5);
      p.life = Math.max(p.life, p.flow + .2);
    } else if (Math.abs(nrm.x) > .55) { // wall: lose the push, trickle down its face
      p.x = point.x + nrm.x * 2; p.y = point.y;
      p.vx = nrm.x * Math.abs(p.vx) * .12; p.vy = Math.max(0, p.vy) * .3;
    } else {                        // ceiling or underside
      p.x = point.x; p.y = point.y + 2; p.vy = Math.abs(p.vy) * .2;
    }
  }
  private height(c: number) { return Math.min(70, (this.columns.get(c) ?? 0) * LAYER); }
  private run(p: Drop, dt: number, fires: Fire[]) {
    p.flow -= dt * (this.height(Math.floor(p.x / COL)) > 12 ? .6 : 1);   // deep pools soak away slower
    if (p.flow <= 0) { this.kill(p); return; }
    const c = Math.floor(p.x / COL);
    // Water runs from the higher column toward the lower one, like a liquid finding its level.
    const slope = this.height(c - 1) - this.height(c + 1);
    p.vx += slope * 26 * dt + (Math.random() - .5) * 40 * dt;
    p.vx *= 1 - Math.min(1, FRICTION * dt);
    const lift = this.height(c);
    const nx = p.x + p.vx * dt;
    const top = p.gy - lift;
    for (const f of fires) if (f.contains(nx, top - 4)) { this.onFire(f, nx, top - 4); this.kill(p); return; }
    // Wall ahead below the current water surface: the drop is held back, so the pool fills up.
    const wall = firstHit({ x: p.x, y: top - 1 }, { x: nx + Math.sign(p.vx) * 2, y: top - 1 }, this.surfaces);
    if (wall && wall.surface.kind !== 'river') {
      // Running water carries momentum: it shoves loose objects it piles against.
      if (wall.surface.kind === 'prop') this.onHit(wall, { vx: p.vx * 2.5, vy: 0 });
      p.vx = -p.vx * .3; p.y = top; return;
    }
    p.x = nx;
    if (this.absorb?.(p.x, top)) { this.kill(p); return; }
    // Follow the ground; with nothing beneath, pour over the edge as a falling drop again.
    const ground = firstHit({ x: p.x, y: top - 2 }, { x: p.x, y: p.gy + 6 }, this.surfaces);
    if (!ground) { p.flow = 0; p.y = top; p.vy = 20; p.life = Math.max(p.life, 3); return; }
    if (ground.surface.kind === 'river') { this.kill(p); return; }
    p.gy = ground.point.y;
    p.y = p.gy - this.height(Math.floor(p.x / COL));
  }
  private kill(p: Drop) { p.life = 0; p.flow = 0; p.img.setVisible(false); }
  private spawn(n: Nozzle) {
    // Ring order = spawn order, so neighbours in the pool form the continuous jet ribbon.
    let p = this.pool[this.head];
    for (let k = 0; k < 24 && p.life > 0; k++) { this.head = (this.head + 1) % this.pool.length; p = this.pool[this.head]; }
    if (p.life > 0) return;
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
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      if (p.flow > 0) {
        // Running sheet of water hugging the ground, fading as it soaks in.
        const k = Math.min(1, p.flow / 1.2);
        p.img.setPosition(p.x, p.y - 2).setRotation(0).setScale(.75 + Math.abs(p.vx) / 300, .55).setAlpha(.35 + .55 * k);
        continue;
      }
      const speed = Math.hypot(p.vx, p.vy);
      const s = p.size * (1 + Math.min(p.age, 1.2) * .9);
      p.img.setPosition(p.x, p.y).setRotation(Math.atan2(p.vy, p.vx))
        .setScale(s * (1 + speed / 900), s * .85).setAlpha(Math.max(.25, .95 - p.age * .45));
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
    clearDrops() { this.emission = 0; for (const p of this.pool) this.kill(p); this.ribbon.clear(); }
  refill(amount: number) { this.supply = Math.min(this.capacity, this.supply + amount); }
  get active() { return this.pool.filter(p => p.life > 0).length; }
}
