import Phaser from 'phaser';
import { ASSETS, STEP, RENDER_SCALE, WATER_GRAVITY, WATER_SPEED, clamp } from '../config/level';
import { LEVELS, type LevelDef } from '../config/levels';
import { Truck } from '../entities/Truck';
import { Animal } from '../entities/Animal';
import { firstHit } from '../physics/collision';
import { World } from './World';
import { Effects } from '../systems/Effects';
import { FireSystem, type Fire } from '../systems/FireSystem';
import { WaterSystem } from '../systems/WaterSystem';
import { createParticleTextures } from '../systems/Textures';
import { Sound } from '../systems/Sound';
import { store } from '../systems/Save';
import type { GameUI } from '../ui/GameUI';

export type Mode = 'attract' | 'intro' | 'playing' | 'ended';
export interface SceneData { level?: number; mode?: 'attract' | 'play' }
export interface ResultInfo {
  won: boolean; level: LevelDef; stars: number; score: number; record: boolean;
  water: { ok: boolean; used: number; budget: number }; animal: { ok: boolean; name: string; key: string; hp: number };
  fires: { out: number; total: number }; time: number; par: number; reason?: 'animal' | 'water';
}

export const sound = new Sound();

export class LevelScene extends Phaser.Scene {
  mode: Mode = 'attract';
  def!: LevelDef;
  private ui!: GameUI;
  private world!: World;
  private truck!: Truck;
  private animal!: Animal;
  private effects!: Effects;
  private fires!: FireSystem;
  private water!: WaterSystem;
  private acc = 0;
  private matterAcc = 0;
  private cam = 640;
  private keys = new Set<string>();
  private pointerHeld = false;
  private activePointer: number | null = null;
  private burn = 0;
  private elapsed = 0;
  private hudT = 0;
  private warnT = 0;
  private endT = 0;
  private result?: ResultInfo;
  private introT = 0;
  private attractT = 0;
  private frameAvg = 16;
  private detach: (() => void)[] = [];
  private firing = false;
  /** Player-controlled view scale: 1 = normal, down to 0.55 to see far-away fires. */
  private zoom = 1;
  private zoomTarget = 1;
  private critical = false;
  private wheelPouring = false;
  private respawnT = 3;
  private pourAcc = 0;
  private alarmT = 0;

  constructor() { super('level'); }
  preload() {
    for (const [key, path] of Object.entries({ ...ASSETS, alert: 'ui/alert' }))
      if (!this.textures.exists(key)) this.load.image(key, `/assets/${path}.webp`);
    this.load.on('progress', (v: number) => { const el = document.querySelector('#load-progress'); if (el) el.textContent = `${Math.round(v * 100)}% · Hutan Jawa`; });
    this.load.on('loaderror', () => {
      const s = document.querySelector('#loading strong'); if (s) s.textContent = 'Aset belum berhasil dimuat';
      const p = document.querySelector('#load-progress'); if (p) p.textContent = 'Muat ulang halaman untuk mencoba lagi.';
    });
  }
  create(data: SceneData) {
    this.ui = this.registry.get('ui');
    this.def = LEVELS[(data.level ?? 1) - 1];
    this.mode = data.mode === 'play' ? 'intro' : 'attract';
    Object.assign(this, { respawnT: 3, critical: false, alarmT: 0, acc: 0, matterAcc: 0, burn: 0, elapsed: 0, hudT: 0, endT: 0, result: undefined, introT: 0, pointerHeld: false, firing: false });
    this.keys.clear();
    createParticleTextures(this);
    this.cameras.main.setZoom(RENDER_SCALE);
    this.matter.world.autoUpdate = false;
    this.effects = new Effects(this);
    this.world = new World(this, this.def);
    this.world.onButton = () => {
      sound.win(); this.ui.toast(`Tombol tertekan! Kandang terbuka — ${this.def.animal.name} bebas!`, 2800);
      this.animal.setMood('calm'); this.effects.hearts(this.def.animal.x, this.def.animal.y - 80, 6);
    };
    this.world.onLaunch = () => { sound.click(); this.ui.toast('Tong air terlempar!', 1600); };
    this.world.onSink = (x, y) => { this.effects.bigSplash(x, y); sound.splash(); };
    this.world.onFloat = (x, y, bridged) => {
      this.effects.bigSplash(x, y); sound.splash();
      this.ui.toast(bridged ? 'Rakit kayu siap! Truk bisa menyeberang.' : 'Kayu mengapung! Butuh satu batang lagi untuk rakit.', 2400);
    };
    const startX = this.mode === 'attract' ? 420 : this.def.truckX;
    this.truck = new Truck(this, startX, this.effects);
    this.animal = new Animal(this, this.def.animal, this.effects);
    this.fires = new FireSystem(this, this.def.fires, this.effects, this.def.spreadDelay, this.world.fuel,
      f => this.onFireOut(f), f => this.onSpread(f));
    this.fires.attract = this.mode === 'attract';
    this.water = new WaterSystem(this, this.world.surfaces, () => this.fires.burning,
      (hit, d) => this.onWaterHit(hit, d), (f, x, y) => this.onWaterFire(f, x, y), (x, y) => this.effects.mist(x, y), this.def.supply);
    this.water.absorb = (x, y) => (!!this.world.basin && this.world.absorb(x, y)) || this.world.catchBucket(x, y);
    this.truck.update(0, 0, 0, 99999, x => this.world.groundAt(x), true);
    this.zoom = this.zoomTarget = 1;
    this.cam = this.mode === 'attract' ? 600 : this.camX(this.truck.x + 330);
    this.applyCamera();
    this.bindInput();
    document.querySelector<HTMLElement>('#loading')!.hidden = true;
    const canvas = document.querySelector('canvas');
    canvas?.setAttribute('role', 'img');
    canvas?.setAttribute('aria-label', `Level ${this.def.code} ${this.def.name}: truk pemadam, api, dan ${this.def.animal.name} yang harus diselamatkan.`);
    if (this.mode === 'intro') {
      this.ui.enterLevel(this.def);
      this.ui.toast(`Selamatkan ${this.def.animal.name}! Padamkan semua api sebelum terlambat.`, 3600);
    }
    if (import.meta.env.DEV) { window.__BARARIMBA__ = { snapshot: () => this.snapshot() }; (window as unknown as Record<string, unknown>).__dbgScene = this; }
    this.events.once('shutdown', () => { this.detach.forEach(fn => fn()); this.detach = []; sound.stopAll(); });
  }

  // ---------- input ----------
  private bindInput() {
    const canvas = this.game.canvas;
    const down = (e: PointerEvent) => {
      if (this.mode !== 'playing') return;
      e.preventDefault(); sound.unlock();
      this.activePointer = e.pointerId; canvas.setPointerCapture(e.pointerId); this.pointerHeld = true;
    };
    const move = (_e: PointerEvent) => {};
    const up = (e: PointerEvent) => { if (this.activePointer === e.pointerId) { this.activePointer = null; this.pointerHeld = false; } };
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat && this.mode === 'playing') this.ui.requestPause(); return; }
      if (this.mode === 'playing' && !e.repeat && ['KeyZ', 'Equal', 'NumpadAdd'].includes(e.code)) { this.setZoom(this.zoomTarget + .15); return; }
      if (this.mode === 'playing' && !e.repeat && ['KeyX', 'Minus', 'NumpadSubtract'].includes(e.code)) { this.setZoom(this.zoomTarget - .15); return; }
      if (this.mode !== 'playing') return;
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyQ', 'KeyE'].includes(e.code)) {
        if ((e.target as HTMLElement)?.closest?.('button') && e.code === 'Space') return;
        e.preventDefault(); this.keys.add(e.code); sound.unlock();
      }
    };
    const ku = (e: KeyboardEvent) => { this.keys.delete(e.code); };
    const suspend = () => { this.keys.clear(); this.pointerHeld = false; this.activePointer = null; if (this.mode === 'playing') this.ui.requestPause(); };
    const vis = () => { if (document.hidden) suspend(); };
    const resize = () => { if (window.innerHeight > window.innerWidth) suspend(); };
    const ctx = (e: Event) => e.preventDefault();
    const list: [EventTarget, string, EventListener][] = [
      [canvas, 'pointerdown', down as EventListener], [canvas, 'pointermove', move as EventListener],
      [canvas, 'pointerup', up as EventListener], [canvas, 'pointercancel', up as EventListener],
      [canvas, 'lostpointercapture', up as EventListener], [canvas, 'contextmenu', ctx],
      [window, 'keydown', kd as EventListener], [window, 'keyup', ku as EventListener],
      [window, 'blur', suspend], [document, 'visibilitychange', vis], [window, 'resize', resize],
    ];
    for (const [t, type, fn] of list) { t.addEventListener(type, fn); this.detach.push(() => t.removeEventListener(type, fn)); }
  }

  // ---------- events ----------
  private onWaterHit(hit: ReturnType<typeof firstHit> & {}, d: { vx: number; vy: number }) {
    const s = hit.surface;
    if (s.kind === 'prop') this.world.push(s.body, hit.point, d.vx, d.vy);
    if (s.kind === 'barrel' && this.world.barrel) {
      const b = this.world.barrel;
      this.world.push(s.body, hit.point, d.vx * 1.4, d.vy);
      if (b.rope && --b.hp <= 0) { this.world.breakRope(); this.ui.toast('Tali putus! Tong air jatuh…', 1800); sound.click(); }
    }
    const wh = this.world.wheel;
    if (s.kind === 'wheel' && wh) {
      // Torque from the impact offset crossed with the drop velocity.
      wh.w += ((hit.point.x - wh.cx) * d.vy - (hit.point.y - wh.cy) * d.vx) / (wh.r * wh.r * 26);
      wh.w = clamp(wh.w, -9, 9);
    }
    if (Math.random() < .55) this.effects.splash(hit.point.x, hit.point.y, s.kind === 'river' ? 2 : 4);
  }
  private onWaterFire(f: Fire, x: number, y: number) {
    this.fires.hit(f);
    if (Math.random() < .3) this.effects.steam(x, y - 10);
    if (Math.random() < .25) this.effects.splash(x, y, 2);
    if (Math.random() < .04) sound.hiss();
  }
  private onFireOut(f: Fire) {
    if (this.mode === 'attract') return;
    sound.chime(); this.effects.steam(f.def.x, f.def.y - 30, 6);
    const left = this.fires.burning.length;
    this.ui.toast(left ? `Api padam! Masih ${left} titik api lagi.` : this.world.cageOpen ? `Semua api padam! ${this.def.animal.name} selamat!` : 'Semua api padam! Sekarang buka kandang dengan tombol merah.');
  }
  private onSpread(f: Fire) {
    if (this.mode !== 'playing') return;
    sound.alarm();
    this.ui.toast('Api menjalar ke pepohonan! Cepat padamkan!', 2000);
    this.effects.ash(f.def.x, f.def.y - 40, 12);
  }

  // ---------- loop ----------
  update(_t: number, delta: number) {
    if (!this.world) return;
    const dt = Math.min(delta / 1000, .1);
    this.frameAvg = this.frameAvg * .97 + delta * .03;
    this.effects.reduced = this.frameAvg > 26;
    const reduced = this.effects.reduced;
    let drive = 0;
    let firing = false;
    if (this.mode === 'playing') {
      drive = (Number(this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.ui.driveDir > 0) - Number(this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.ui.driveDir < 0));
      const c = this.truck.cannon;
      const tip = Number(this.keys.has('ArrowDown') || this.keys.has('KeyS') || this.ui.tipDir > 0) - Number(this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.ui.tipDir < 0);
      const boom = Number(this.keys.has('KeyE') || this.ui.boomDir > 0) - Number(this.keys.has('KeyQ') || this.ui.boomDir < 0);
      if (tip) c.setTip(c.tip + tip * dt * .7);
      if (boom) c.setBoom(c.boom + boom * dt * 1.1);
      firing = (this.pointerHeld || this.keys.has('Space') || this.ui.sprayHeld) && this.water.supply > 0;
    }
    if (this.mode === 'attract') {
      this.attractT += dt;
      const f = this.fires.fires[0];
      this.truck.cannon.setBoom(-.35 + Math.sin(this.attractT * .4) * .15);
      this.truck.cannon.setTip(this.solveTip(f.def.x + Math.sin(this.attractT * 1.3) * 18, f.def.y - 40));
      firing = (this.attractT % 7) < 5.2;
    }
    this.firing = firing;
    const lim = this.mode === 'playing' ? this.driveLimits(drive) : { min: this.truck.x, max: this.truck.x };
    this.truck.update(dt, drive, lim.min, lim.max, x => this.world.groundAt(x));
    // Camera: intro flies over all fires and the animal, then settles behind the truck.
    if (this.ui.zoomRequest) { this.setZoom(this.zoomTarget + this.ui.zoomRequest * .15); this.ui.zoomRequest = 0; }
    this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 8);
    let goal = this.camX(this.truck.x + 330 / this.zoom);
    if (this.mode === 'attract') goal = 600;
    if (this.mode === 'intro') {
      this.introT += dt;
      const far = this.camX(this.def.animal.x - 300);
      const t = this.introT;
      goal = t < 1.1 ? goal : t < 3.3 ? far : goal;
      if (t > 4.4) { this.mode = 'playing'; this.ui.showHud(true); }
    }
    if (this.mode !== 'ended') this.cam += (goal - this.cam) * Math.min(1, dt * (this.mode === 'intro' ? 1.6 : 4));
    this.cam = this.camX(this.cam);
    this.applyCamera();
    this.world.update(dt, this.cam, reduced);
    this.acc += dt; this.matterAcc += dt;
    while (this.acc >= STEP) { this.water.step(STEP, firing, this.truck.cannon.nozzle, this.mode === 'attract'); this.acc -= STEP; }
    while (this.matterAcc >= 1 / 60) { this.matter.world.step(1000 / 60); this.matterAcc -= 1 / 60; }
    this.water.render();
    this.fires.update(dt, reduced);
    this.animal.update(dt);
    this.updateBarrel();
    const wh = this.world.wheel;
    if (wh) {
      wh.w *= 1 - Math.min(1, .7 * dt);
      wh.sprite.rotation += wh.w * dt;
      const spin = Math.abs(wh.w);
      if (wh.w > .9) {   // clockwise (driven from the truck side) tips water off the far edge
        if (!this.wheelPouring && this.mode === 'playing') { this.wheelPouring = true; this.ui.toast('Kincir berputar! Air tertuang ke balik tebing.', 2200); }
        this.pourAcc += dt * Math.min(70, spin * 11);
        while (this.pourAcc >= 1) { this.pourAcc--; this.water.pour(wh.out.x + Math.random() * 6, wh.out.y, wh.out.vx * (.8 + Math.random() * .4), 30); }
      } else this.wheelPouring = false;
    }
    if (this.mode === 'playing') this.updateRules(dt);
    if (this.mode === 'ended') {
      this.endT -= dt;
      if (this.endT <= 0 && this.result) { const r = this.result; this.result = undefined; this.ui.showResult(r); }
    }
    if (this.mode !== 'attract') { sound.spray(firing); sound.fire(this.fires.burning.filter(f => Math.abs(f.def.x - this.cam) < 700).reduce((s, f) => s + f.intensity, 0)); }
  }
  private setZoom(z: number) {
    this.zoomTarget = clamp(Math.round(z * 100) / 100, .55, 1);
    this.ui.setZoomLevel(this.zoomTarget);
  }
  /** Clamp a camera centre so the view never leaves the world, at the current zoom. */
  private camX(x: number) {
    const half = 640 / this.zoom;
    return this.def.width <= half * 2 ? this.def.width / 2 : clamp(x, half, this.def.width - half);
  }
  private applyCamera() {
    const cam = this.cameras.main;
    cam.setZoom(RENDER_SCALE * this.zoom);
    // Keep the ground anchored to the bottom edge when zoomed out.
    cam.centerOn(this.cam, 720 - 360 / this.zoom);
  }
  /** Menu backdrop only: ballistic angle from the nozzle to a point (the player always aims manually). */
  private solveTip(tx: number, ty: number, high = false) {
    const n = this.truck.cannon.nozzle;
    let best = this.truck.cannon.tip, err = Infinity;
    if (high) for (let a = -1.25; a <= .2; a += .01) {
      const vx = Math.cos(a) * WATER_SPEED, t = (tx - n.x) / vx;
      if (t > 0 && Math.abs(n.y + Math.sin(a) * WATER_SPEED * t + .5 * WATER_GRAVITY * t * t - ty) < 12) return a;
    }
    for (let a = -1.1; a <= .6; a += .01) {
      const vx = Math.cos(a) * WATER_SPEED; if (vx <= 0) continue;
      const t = (tx - n.x) / vx; if (t <= 0) continue;
      const y = n.y + Math.sin(a) * WATER_SPEED * t + .5 * WATER_GRAVITY * t * t;
      const e = Math.abs(y - ty);
      if (e < err) { err = e; best = a; }
    }
    return best;
  }
  /** How far the truck may roll in each direction: only real obstacles stop it — walls or steps too
   * high to climb, open water, low cave ceilings, burning fires, unmoved props and mechanisms. */
  private driveLimits(drive: number) {
    const w = this.world, half = this.truck.halfLength, x = this.truck.x;
    const STEP_UP = 26, CLEARANCE = 160;
    const here = w.groundAt(x);
    const blocked = (px: number, ref: number) => {
      const top = w.surfaceAt(px);
      if (top === null) return 'river';
      if (top < ref - STEP_UP) return 'wall';
      if (w.ceilingAt(px) > top - CLEARANCE) return 'wall';
      return '';
    };
    let max = this.def.width - half - 20, min = Math.max(this.def.driveMin, half + 20);
    let blocker = '';
    // Scan ahead/behind from the wheels; ground may step down freely but not up by more than a curb.
    let ref = here;
    for (let d = 0; d <= 320; d += 4) {
      const px = x + half * .92 + d, why = blocked(px, ref);
      if (why) { max = Math.min(max, x + d - 2); blocker = why; break; }
      ref = w.surfaceAt(px) ?? ref;
    }
    ref = here;
    for (let d = 0; d <= 320; d += 4) {
      const px = x - half * .92 - d, why = blocked(px, ref);
      if (why) { min = Math.max(min, x - d + 2); break; }
      ref = w.surfaceAt(px) ?? ref;
    }
    const front = (lim: number, why: string) => { if (lim < max) { max = lim; blocker = why; } };
    for (const f of this.fires.burning)
      if (f.def.x > x && Math.abs(f.def.y - w.groundAt(f.def.x)) < 14) front(f.def.x - 60 - f.intensity * 30 - half, 'fire');
    for (const p of w.props) {
      if (p.gone || p.floating) continue;
      const b = p.body.bounds;
      if (p.body.position.x <= x || b.max.y < w.groundAt(p.body.position.x) - 50) continue;
      // Light crates and logs are shoved by the bumper; boulders are too heavy and block the road.
      const touching = b.min.x - 8 - half - x < 4;
      if (p.kind !== 'boulder' && touching && drive > 0) {
        this.matter.body.setVelocity(p.body, { x: Math.max(p.body.velocity.x, .5 * this.truck.v / 60 + .4), y: p.body.velocity.y });
        continue;
      }
      front(b.min.x - 8 - half, p.kind === 'boulder' ? 'boulder' : 'prop');
    }
    if (w.seesaw) front(w.seesaw.x - 140 - half, 'mechanism');
    max = Math.max(max, x - .01); min = Math.min(min, x + .01);
    this.warnT -= 1 / 60;
    if (drive > 0 && x >= max - 2 && blocker && this.warnT <= 0) {
      this.warnT = 2.5;
      const msg: Record<string, string> = {
        fire: 'Hindari api! Padamkan dulu sebelum lewat.',
        river: this.def.floatGap && !w.bridged ? 'Jalan terputus! Semprot benda kayu ke celah supaya mengapung jadi pijakan.' : 'Ada sungai di depan. Semprot dari sini!',
        prop: 'Jalan terhalang! Dorong dengan semprotan air.',
        boulder: 'Batu terlalu berat untuk truk. Dorong dengan semprotan air!',
        wall: 'Tebing terlalu tinggi. Semprot dari sini!',
        mechanism: 'Ada mekanisme di depan. Gunakan semprotan air!',
      };
      this.ui.toast(msg[blocker], 2200);
    }
    return { min, max };
  }
  private updateBarrel() {
    const b = this.world.barrel;
    if (!b || b.landed || b.rope || !b.armed) return;
    const v = b.body.velocity;
    const arrived = b.flightY !== undefined && v.y > 0 && b.body.position.y >= b.flightY - 20;
    if (arrived || (b.falling > .35 && Math.hypot(v.x, v.y) < .8)) {
      b.landed = true;
      const { x, y } = b.body.position;
      this.effects.bigSplash(x, y + 20); sound.splash();
      if (b.load === 'barrel') this.fires.douse(x, y, 175, 1.6);
      this.matter.world.remove(b.body); b.surface.enabled = false;
      this.tweens.add({ targets: b.sprite, alpha: 0, scale: .6, duration: 400 });
    }
  }
  private updateRules(dt: number) {
    this.elapsed += dt;
    this.burn = Math.min(100, this.burn + this.fires.heat * this.def.burnRate * dt);
    const over = this.elapsed - this.def.time;
    if (over >= 0) {
      if (!this.critical) {
        this.critical = true; sound.alarm();
        this.ui.toast(`Waktu standar habis! ${this.def.animal.name} kritis — cepat padamkan api!`, 3200);
      }
      this.animal.setCritical(this.def.critical - over, this.def.critical);
      this.alarmT -= dt; if (this.alarmT <= 0) { this.alarmT = 2; sound.alarm(); }
    }
    const r = this.def.refill;
    const refilling = !!r && Math.abs(this.truck.x - r.x) < r.half && !this.firing && this.water.supply < this.water.capacity;
    if (refilling) this.water.refill(24 * dt);
    this.respawnT -= dt;
    if (this.respawnT <= 0) { this.respawnT = 1.5; if (this.world.respawnFloatable()) this.ui.toast('Peti baru dijatuhkan. Dorong ke celah!', 2000); }
    this.hudT += dt;
    if (this.hudT > .08) {
      this.hudT = 0;
      const out = this.fires.outCount, burning = this.fires.burning.length;
      this.ui.hud({
        water: this.water.supply / this.water.capacity * 100, burn: this.burn, out, total: out + burning,
        animalHp: this.animal.hp, animalDanger: this.animal.mood === 'danger', refilling,
        timeLeft: over < 0 ? -over : this.def.critical - over, critical: over >= 0,
        stars: [burning === 0, this.water.used <= this.def.waterBudget, over < 0],
        firing: this.firing, tip: this.truck.cannon.tipDegrees, boom: this.truck.cannon.boomPercent,
      });
      this.ui.indicators(this.fires.burning.filter(f => Math.abs(f.def.x - this.cam) > 600 / this.zoom).map(f => ({ side: f.def.x > this.cam ? 1 : -1, y: 720 - (720 - (f.def.y - 60)) * this.zoom })));
    }
    if (this.fires.burning.length === 0 && this.world.cageOpen) return this.finish(true);
    if (this.critical && this.animal.hp <= 0) return this.finish(false, 'animal');
    if (this.water.supply <= 0 && this.water.active === 0 && !this.def.refill) return this.finish(false, 'water');
  }
  private finish(won: boolean, reason?: ResultInfo['reason']) {
    this.mode = 'ended'; this.endT = won ? 2.6 : 2.8;
    this.keys.clear(); this.pointerHeld = false; this.firing = false;
    sound.spray(false);
    this.ui.showHud(false);
    this.animal.setMood(won ? 'happy' : 'crying');
    // Focus the camera on the animal so the player sees it celebrate or cry.
    this.tweens.addCounter({ from: this.cam, to: this.camX(this.def.animal.x - 200), duration: 900, ease: 'sine.inOut',
      onUpdate: tw => { this.cam = tw.getValue() ?? this.cam; } });
    won ? sound.win() : sound.fail();
    const waterOk = this.water.used <= this.def.waterBudget;
    const timeOk = this.elapsed <= this.def.time;
    const stars = won ? 1 + Number(waterOk) + Number(timeOk) : 0;
    const score = won
      ? Math.round(3000 + this.water.supply * 15 + this.animal.hp * 20 + Math.max(0, this.def.time - this.elapsed) * 25 + (100 - this.burn) * 10)
      : this.fires.outCount * 450;
    const record = won ? store.record(this.def.id, stars, score, this.def.animal.key) : false;
    this.result = {
      won, level: this.def, stars, score, record, reason, time: this.elapsed, par: this.def.time,
      water: { ok: waterOk, used: this.water.used, budget: this.def.waterBudget },
      animal: { ok: won, name: this.def.animal.name, key: this.def.animal.key, hp: this.animal.hp },
      fires: { out: this.fires.outCount, total: this.fires.outCount + this.fires.burning.length },
    };
  }
  snapshot() {
    return {
      mode: this.mode, level: this.def.id, water: this.water.supply, used: this.water.used, burn: this.burn,
      fires: this.fires.fires.map(f => ({ lit: f.lit, i: +f.intensity.toFixed(3), x: f.def.x })),
      truck: { x: this.truck.x, y: this.truck.y }, nozzle: { ...this.truck.cannon.nozzle }, cam: this.cam,
      animal: { hp: this.animal.hp, mood: this.animal.mood }, drops: this.water.active, avgFrame: this.frameAvg,
      props: this.world.props.map(p => ({ x: p.body.position.x, y: p.body.position.y, gone: p.gone })),
      barrel: this.world.barrel ? { hp: this.world.barrel.hp, landed: this.world.barrel.landed } : null,
    };
  }
}

declare global { interface Window { __BARARIMBA__?: { snapshot: () => ReturnType<LevelScene['snapshot']> } } }
