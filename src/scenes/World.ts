import Phaser from 'phaser';
import type { LevelDef } from '../config/levels';
import type { Surface } from '../physics/collision';
import type { Fuel } from '../systems/FireSystem';

export interface Prop { kind: string; body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; surface: Surface; gone: boolean; floating?: { x: number; y: number; t: number } }
interface Layer { image: Phaser.GameObjects.Image; x: number; factor: number }

/** Builds a level's scenery and collision from data. Every visual comes from a sliced source sprite. */
export class World {
  readonly surfaces: Surface[] = [];
  readonly props: Prop[] = [];
  readonly fuel = new Map<number, Fuel>();
  /** Swinging/flying load: a water barrel (douses fire where it lands) or a crate (just blocks). */
  barrel?: { body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; surface: Surface; hp: number; rope?: MatterJS.ConstraintType;
    falling: number; landed: boolean; armed: boolean; load: 'barrel' | 'crate'; flightY?: number };
  seesaw?: { plank: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; launched: boolean; hold?: MatterJS.ConstraintType; bucket: Phaser.GameObjects.Image; fill: number; lastAv: number; x: number; y: number; target: { x: number; y: number } };
  lever?: { button: Phaser.GameObjects.Image; fence: Phaser.GameObjects.Image; roof: Phaser.GameObjects.Image; pressed: boolean };
  private layers: Layer[] = [];
  private river: Phaser.GameObjects.Graphics;
  private ropeG: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image[] = [];
  private sign?: Phaser.GameObjects.Image;
  private time = 0;
  onSink?: (x: number, y: number) => void;
  onFloat?: (x: number, y: number, bridged: boolean) => void;
  rafts = 0;
  basin?: {
    volume: number; level: number; g: Phaser.GameObjects.Graphics; boulder: MatterJS.BodyType; rock: Phaser.GameObjects.Image;
    button: Phaser.GameObjects.Image; fence: Phaser.GameObjects.Image; roof: Phaser.GameObjects.Image; pressed: boolean; overflow: boolean;
  };
  onButton?: () => void;
  wheel?: { cx: number; cy: number; r: number; w: number; sprite: Phaser.GameObjects.Image; out: { x: number; y: number; vx: number }; surface: Surface };

  constructor(private scene: Phaser.Scene, readonly def: LevelDef) {
    const W = def.width;
    this.ensureDirt();
    const sky = scene.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x5fb8e6, 0x5fb8e6, 0xcdeee6, 0xcdeee6, 1).fillRect(-1400, -900, W + 2800, 1620);
    sky.fillStyle(0xfff7d6, .25).fillCircle(980, 150, 80);
    for (let i = 0; i * 520 < W + 600; i++) {
      const c = scene.add.image(200 + i * 520, 110 + (i % 3) * 38, 'cloud').setScale(.45 + (i % 2) * .3).setAlpha(.85).setDepth(1);
      this.clouds.push(c); this.layers.push({ image: c, x: c.x, factor: .1 });
    }
    const span = (f: number) => 1280 + Math.max(0, W - 1280) * f + 1400;   // extra width for zoomed-out views
    for (let x = 0; x < span(.2); x += 1400) this.layer('mountains', x + 700, 420, .84, 2, .2, .55);
    for (let x = 0; x < span(.35); x += 1400) this.layer('hills', x + 700, 520, .84, 3, .35, .7);
    // Far and mid jungle canopy rows (board reference shows dense trees behind the play area).
    const far = ['tree-a', 'tree-b', 'tree-c', 'tree-large'], mid = ['tree-b', 'tree-a', 'tree-small', 'tree-c', 'tree-flower'];
    for (let i = 0, x = -60; x < span(.5); i++, x += 150 + (i * 37) % 70) this.layer(far[i % far.length], x, 590, .62 + (i % 3) * .08, 4, .5, 1, 0x86bfa8);
    for (let i = 0, x = -30; x < span(.75); i++, x += 230 + (i * 53) % 90) this.layer(mid[i % mid.length], x, 610, .78 + (i % 2) * .12, 5, .75, 1, 0xbfe0bc);
    const haze = scene.add.graphics().setDepth(5.5);
    haze.fillGradientStyle(0xd6efe0, 0xd6efe0, 0xa9d8c0, 0xa9d8c0, 0, 0, .35, .35).fillRect(-200, 380, W + 400, 240);
    // River across the world, partly covered by land.
    const bed = scene.add.graphics().setDepth(6);
    bed.fillGradientStyle(0x5cc8d6, 0x5cc8d6, 0x1a7fa0, 0x1a7fa0, 1).fillRect(-200, 586, W + 400, 160);
    this.river = scene.add.graphics().setDepth(7);
    this.ropeG = scene.add.graphics().setDepth(38);
    this.add(W / 2, 690, W + 400, 90, 'river');

    for (const b of def.bridges) this.bridge(b.x0, b.x1, b.y);
    for (const l of def.lands) this.land(l.x0, l.x1, l.top, l.style);
    for (const d of def.decor) {
      const img = scene.add.image(d.x, d.y, d.key).setOrigin(.5, 1).setScale(d.scale).setFlipX(!!d.flip).setDepth(16);
      if (d.fuel !== undefined) this.fuel.set(d.fuel, { image: img, burn: 0 });
    }
    if (def.refill) {
      const ground = this.groundAt(def.refill.x);
      scene.add.image(def.refill.x, ground + 8, 'water-tower').setOrigin(.5, 1).setScale(.62).setDepth(17);
      this.sign = scene.add.image(def.refill.x, ground - 250, 'sign-water').setScale(.6).setDepth(18);
    }
    for (const p of def.props) this.prop(p.kind, p.x, p.y);
    if (def.hang) this.hang(def.hang);
    for (const r of def.rocks ?? []) this.rock(r);
    if (def.seesaw) this.makeSeesaw(def.seesaw);
    if (def.lever) this.makeLever(def.lever);
    if (def.basin) this.makeBasin(def.basin);
    if (def.wheel) {
      const wd = def.wheel;
      scene.add.image(wd.x, wd.y + wd.r + 8, 'pivot').setOrigin(.5, 1).setScale(.62).setDepth(19);
      if (wd.trough) scene.add.image(wd.trough.x, wd.trough.y + 4, 'trough').setOrigin(.5, 1).setScale(.62).setDepth(19);
      const sprite = scene.add.image(wd.x, wd.y, 'gear').setScale(wd.r * 2 / 205).setDepth(20);
      const body = scene.matter.add.circle(wd.x, wd.y, wd.r, { isStatic: true, label: 'wheel' });
      const surface: Surface = { body, kind: 'wheel', enabled: true };
      this.surfaces.push(surface);
      this.wheel = { cx: wd.x, cy: wd.y, r: wd.r, w: 0, sprite, out: wd.out, surface };
    }
    const fgSpan = W + 400;
    for (let x = -200; x < fgSpan; x += 1380) scene.add.image(x + 690, 760, 'foreground').setOrigin(.5, 1).setScale(.83).setDepth(49);

  }

  private ensureDirt() {
    if (this.scene.textures.exists('dirt')) return;
    const src = this.scene.textures.get('top-b').getSourceImage() as HTMLImageElement;
    const tex = this.scene.textures.createCanvas('dirt', 240, 58)!;
    tex.getContext().drawImage(src, 22, 52, 240, 58, 0, 0, 240, 58);
    tex.refresh();
  }
  private layer(key: string, x: number, y: number, scale: number, depth: number, factor: number, alpha = 1, tint?: number) {
    const image = this.scene.add.image(x, y, key).setOrigin(.5, 1).setScale(scale).setDepth(depth).setAlpha(alpha);
    if (tint) image.setTint(tint);
    this.layers.push({ image, x, factor });
  }
  private add(x: number, y: number, w: number, h: number, kind: Surface['kind'], dynamic?: Phaser.Types.Physics.Matter.MatterBodyConfig) {
    const body = this.scene.matter.add.rectangle(x, y, w, h, dynamic ?? { isStatic: true, label: kind });
    const surface: Surface = { body, kind, enabled: true };
    this.surfaces.push(surface);
    return surface;
  }
  private land(x0: number, x1: number, top: number, _style?: string) {
    const s = this.scene;
    const w = x1 - x0;
    this.add(x0 + w / 2, top + (760 - top) / 2, w, 760 - top, 'terrain');
    s.add.tileSprite(x0, top + 70, w, 720 - top, 'dirt').setOrigin(0, 0).setTileScale(.9).setDepth(10);
    const keys = ['top-a', 'top-b'];
    const sc = .86;
    for (let x = x0 - 6, i = 0; x < x1 - 10; i++) {
      const key = keys[i % 2];
      const img = s.add.image(x, top - 16 * sc, key).setOrigin(0, 0).setScale(sc).setDepth(11);
      const remain = x1 + 6 - x;
      if (img.displayWidth > remain) img.setCrop(0, 0, remain / sc, img.height);
      x += img.displayWidth - 8;
    }
  }
  private bridge(x0: number, x1: number, y: number) {
    this.add((x0 + x1) / 2, y + 12, x1 - x0, 24, 'bridge');
    for (let x = x0; x < x1; x += 405) {
      const img = this.scene.add.image(x, y - 12, 'bridge').setOrigin(0, 0).setScale(1).setDepth(13);
      if (x + 417 > x1) img.setCrop(0, 0, x1 - x, 118);
    }
  }
  /** Safety net: if every floatable prop is lost before the raft is complete, drop a fresh one in. */
  respawnFloatable() {
    const fg = this.def.floatGap;
    if (!fg || this.bridged) return false;
    const left = this.props.some(p => !p.gone && !p.floating && p.kind !== 'boulder' && p.body.position.x < fg.x0 + 20 && p.body.position.y < 560);
    if (left) return false;
    const src = this.def.props.find(p => p.kind !== 'boulder' && p.x < fg.x0)!;
    this.prop(src.kind, src.x, src.y - 260);
    return true;
  }
  private prop(kind: string, x: number, y: number) {
    const s = this.scene;
    let body: MatterJS.BodyType, sprite: Phaser.GameObjects.Image;
    if (kind === 'boulder') {
      body = s.matter.add.circle(x, y, 40, { friction: .04, frictionAir: .01, restitution: .15, density: .0009, label: 'prop' });
      sprite = s.add.image(x, y, 'boulder').setScale(.37);
    } else if (kind === 'log') {
      body = s.matter.add.rectangle(x, y, 124, 64, { friction: .08, frictionAir: .06, density: .0009, chamfer: { radius: 20 }, label: 'prop' });
      sprite = s.add.image(x, y, 'log').setScale(.62);
    } else {
      body = s.matter.add.rectangle(x, y, 68, 66, { friction: .06, frictionStatic: .12, frictionAir: .06, density: .001, label: 'prop' });
      sprite = s.add.image(x, y, kind).setScale(.53);
    }
    sprite.setDepth(21);
    const surface: Surface = { body, kind: 'prop', enabled: true };
    this.surfaces.push(surface);
    this.props.push({ kind, body, sprite, surface, gone: false });
  }
  private hang(h: NonNullable<LevelDef['hang']>) {
    const s = this.scene;
    // Wooden crane: post + beam from the plank sprite, rope drawn as a line.
    s.add.image(h.postX, h.groundY + 6, 'plank').setOrigin(0, .5).setRotation(-Math.PI / 2).setScale(.68, .5).setDepth(19);
    const right = h.anchorX > h.postX;
    s.add.image(h.postX + (right ? -14 : 14), h.anchorY - 6, 'plank').setOrigin(right ? 0 : 1, .5).setScale(.52, .42).setDepth(20);
    const crate = h.load === 'crate';
    const y = h.anchorY + h.rope + 34;
    const body = s.matter.add.rectangle(h.anchorX, y, crate ? 64 : 52, 66, { density: .002, frictionAir: .02, label: 'barrel' });
    const rope = s.matter.add.worldConstraint(body, h.rope, .9, { pointA: { x: h.anchorX, y: h.anchorY }, pointB: { x: 0, y: -33 } });
    const sprite = s.add.image(h.anchorX, y, crate ? 'crate' : 'barrel-blue').setScale(.5).setDepth(21);
    const surface: Surface = { body, kind: 'barrel', enabled: true };
    this.surfaces.push(surface);
    this.barrel = { body, sprite, surface, hp: crate ? 30 : 35, rope, falling: 0, landed: false, armed: false, load: crate ? 'crate' : 'barrel' };
  }
  private rock(r: { x0: number; x1: number; y0: number; y1: number }) {
    const s = this.scene, w = r.x1 - r.x0, h = r.y1 - r.y0;
    this.add(r.x0 + w / 2, r.y0 + h / 2, w, h, 'terrain');
    s.add.tileSprite(r.x0, r.y0, w, h, 'dirt').setOrigin(0, 0).setTileScale(.9).setDepth(15);
    // Grass lip on top and a dark underside so the slab reads as an overhang.
    for (let x = r.x0 - 6, i = 0; x < r.x1 - 10; i++) {
      const img = s.add.image(x, r.y0 - 14, i % 2 ? 'top-b' : 'top-a').setOrigin(0, 0).setScale(.86).setDepth(15);
      if (img.displayWidth > r.x1 + 6 - x) img.setCrop(0, 0, (r.x1 + 6 - x) / .86, img.height);
      x += img.displayWidth - 8;
    }
    s.add.rectangle(r.x0, r.y1 - 10, w, 10, 0x2b1a0c, .55).setOrigin(0, 0).setDepth(15.5);
  }
  private makeSeesaw(d: NonNullable<LevelDef['seesaw']>) {
    const s = this.scene, M = s.matter;
    s.add.image(d.x, d.y + 32, 'pivot').setOrigin(.5, 1).setScale(.75).setDepth(19);
    const plank = M.add.rectangle(d.x, d.y, 250, 16, { density: .0012, friction: .6, label: 'prop' });
    M.add.worldConstraint(plank, 0, 1, { pointA: { x: d.x, y: d.y }, pointB: { x: 0, y: 0 } });
    M.body.setAngle(plank, .18);
    const sprite = s.add.image(d.x, d.y, 'plank').setScale(250 / 251, .32).setDepth(20);
    this.surfaces.push({ body: plank, kind: 'prop', enabled: true });
    // Water barrel resting on the low (right) end.
    const bx = d.x + 100, by = d.y - 10;
    const body = M.add.rectangle(bx, by, 50, 62, { density: .0003, friction: .9, frictionAir: .01, label: 'barrel' });
    const bs = s.add.image(bx, by, 'barrel-blue').setScale(.48).setDepth(21);
    const surface: Surface = { body, kind: 'barrel', enabled: true };
    this.surfaces.push(surface);
    this.barrel = { body, sprite: bs, surface, hp: 999, falling: 0, landed: false, armed: false, load: 'barrel' };
    // The barrel sits in a cradle on the plank end until the catapult fires.
    plank.collisionFilter.group = -7; body.collisionFilter.group = -7;
    const hold = M.add.constraint(plank, body, 0, .9, { pointA: { x: 100, y: -36 }, pointB: { x: 0, y: 0 } });
    const bucket = s.add.image(d.x - 105, d.y - 40, 'bucket').setOrigin(.5, 1).setScale(.55).setDepth(21);
    this.seesaw = { plank, sprite, launched: false, hold, bucket, fill: 0, lastAv: 0, x: d.x, y: d.y, target: d.target };
  }
  private updateSeesaw() {
    const sw = this.seesaw!, M = this.scene.matter.body, p = sw.plank;
    // Hinge stops: the plank can only tilt +-0.32 rad.
    if (p.angle > .32) { M.setAngle(p, .32); if (p.angularVelocity > 0) M.setAngularVelocity(p, 0); }
    if (p.angle < -.32) { M.setAngle(p, -.32); if (p.angularVelocity < 0) M.setAngularVelocity(p, 0); }
    // Plank swings down hard past -0.12 rad (toward the ground): the cradle releases the barrel like a catapult.
    const b = this.barrel;
    if (!sw.launched && b && sw.fill > 8 && p.angle < -.12 && sw.lastAv < -.006) {
      sw.launched = true; b.armed = true; b.falling = 0;
      if (sw.hold) this.scene.matter.world.removeConstraint(sw.hold);
      const g = .001 * (1000 / 60) ** 2, T = 110;  // ~1.8 s flight: apex clears a 300 px cliff
      const { x, y } = b.body.position;
      b.body.isSensor = true; b.flightY = sw.target.y;   // free ballistic flight over the cliff
      // Matter's setVelocity here is scaled per half step, hence the 0.5 (measured: unscaled overshot 2x).
      M.setVelocity(b.body, { x: .5 * (sw.target.x - x) / T, y: .5 * (sw.target.y - y - .5 * g * T * T) / T });
      M.setAngularVelocity(b.body, .15);
      this.onLaunch?.();
    }
    sw.lastAv = p.angularVelocity;
    sw.sprite.setPosition(p.position.x, p.position.y).setRotation(p.angle);
    const c = Math.cos(p.angle), sn = Math.sin(p.angle);
    sw.bucket.setPosition(p.position.x - 105 * c + 8 * sn, p.position.y - 105 * sn - 8 * c).setRotation(p.angle * .3);
    // The filling bucket's weight on its lever arm tips the plank (gravity .278 px/step^2).
    if (!sw.launched) M.setAngularVelocity(p, p.angularVelocity - sw.fill * 105 * .278 / 40000);
    else if (sw.fill > 0) sw.fill = Math.max(0, sw.fill - 2);
  }
  onLaunch?: () => void;
  private makeLever(d: NonNullable<LevelDef['lever']>) {
    const s = this.scene, c = d.cage;
    const button = s.add.image(d.button.x, d.button.y + 6, 'button').setOrigin(.5, 1).setScale(.42).setDepth(14);
    const fence = s.add.image(c.x, c.y + 6, 'fence').setOrigin(.5, 1).setScale(.9, .95).setDepth(34);
    const roof = s.add.image(c.x, c.y - 136, 'plank').setScale(.8, .5).setDepth(35);
    this.lever = { button, fence, roof, pressed: false };
  }
  private updateLever() {
    const lv = this.lever!, d = this.def.lever!;
    if (lv.pressed) return;
    for (const p of this.props) {
      if (p.gone || p.floating) continue;
      if (Math.abs(p.body.position.x - d.button.x) < 30 && p.body.position.y < d.button.y) {
        lv.pressed = true;
        this.scene.matter.body.setStatic(p.body, true);
        lv.button.setScale(.42, .3);
        this.scene.tweens.add({ targets: [lv.fence, lv.roof], y: '-=180', alpha: 0, duration: 900, ease: 'back.in' });
        this.onButton?.();
      }
    }
  }
  private float(p: Prop, fg: NonNullable<LevelDef['floatGap']>) {
    const slot = this.rafts++;
    const w = (fg.x1 - fg.x0) / fg.need;
    // Float so the top sits level with the road (bodies are ~64-66 px tall).
    const tx = fg.x0 + w * (slot + .5), ty = p.kind === 'log' ? 572 : 574;
    this.scene.matter.body.setStatic(p.body, true);
    this.scene.matter.body.setAngle(p.body, 0);
    this.scene.matter.body.setPosition(p.body, { x: tx, y: ty });
    p.sprite.setDepth(12);
    p.floating = { x: tx, y: ty, t: 0 };
    // Drift from where it splashed down into its raft slot.
    this.scene.tweens.add({ targets: p.sprite, x: tx, y: ty, rotation: 0, duration: 900, ease: 'sine.out' });
    this.onFloat?.(p.body.position.x, 586, this.bridged);
  }
  private makeBasin(b: NonNullable<LevelDef['basin']>) {
    const s = this.scene;
    s.add.tileSprite(b.x0, b.lip, b.x1 - b.x0, b.floor - b.lip, 'dirt').setOrigin(0, 0).setTileScale(.9).setTint(0x8a6a50).setDepth(9.5);
    const g = s.add.graphics().setDepth(12);
    const boulder = s.matter.add.circle(b.boulder.x, b.floor - b.boulder.r - 2, b.boulder.r, { density: .0011, friction: .02, frictionAir: .01, restitution: .1, label: 'prop' });
    const rock = s.add.image(b.boulder.x, b.floor - b.boulder.r, 'boulder').setScale(b.boulder.r * 2.15 / 241).setDepth(13);
    this.surfaces.push({ body: boulder, kind: 'prop', enabled: true });
    const button = s.add.image(b.button.x, b.button.y + 6, 'button').setOrigin(.5, 1).setScale(.42).setDepth(14);
    const c = b.cage;
    const fence = s.add.image(c.x, c.y + 6, 'fence').setOrigin(.5, 1).setScale(.82, .9).setDepth(34);
    const roof = s.add.image(c.x, c.y - 128, 'plank').setScale(.72, .5).setDepth(35);
    this.basin = { volume: 0, level: b.floor, g, boulder, rock, button, fence, roof, pressed: false, overflow: false };
  }
  /** Drops entering the basin's water join its volume. */
  absorb = (x: number, y: number) => {
    const b = this.def.basin, st = this.basin;
    if (!b || !st || x <= b.x0 || x >= b.x1 || y < st.level - 3 || y > b.floor) return false;
    st.volume += 1;
    return true;
  };
  private updateBasin(dt: number) {
    const b = this.def.basin!, st = this.basin!;
    const depth = b.floor - b.lip;
    st.volume = Math.max(0, st.volume - dt * 9);                 // slow seepage
    const maxVol = depth / .3;
    st.overflow = st.volume >= maxVol;
    st.volume = Math.min(st.volume, maxVol + 20);
    const target = b.floor - Math.min(depth, st.volume * .3);
    st.level += (target - st.level) * Math.min(1, dt * 4);
    // Water body with a rippling surface.
    const g = st.g.clear();
    if (b.floor - st.level > 1) {
      g.fillStyle(0x2f9ee8, .72).fillRect(b.x0, st.level, b.x1 - b.x0, b.floor - st.level);
      g.lineStyle(3, 0xd8f5ff, .9).beginPath();
      for (let x = b.x0; x <= b.x1; x += 8) {
        const y = st.level + Math.sin(this.time * 5 + x * .08) * 2;
        x === b.x0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.strokePath();
      if (st.overflow) for (let i = 0; i < 3; i++) g.fillStyle(0xd8f5ff, .8).fillCircle(b.x1 + 6 + Math.random() * 20, b.lip - 2 - Math.random() * 6, 2 + Math.random() * 2);
    }
    // Buoyancy (Matter gravity is mass * 0.001 per step at scale 1).
    const body = st.boulder, r = b.boulder.r, M = this.scene.matter.body;
    if (!st.pressed) {
      const sub = Phaser.Math.Clamp((body.position.y + r - st.level) / (2 * r), 0, 1);
      if (sub > 0) {
        M.applyForce(body, body.position, { x: 0, y: -body.mass * .001 * 1.65 * sub });
        M.setVelocity(body, { x: body.velocity.x * .96, y: body.velocity.y * .9 });
      }
      // Overflowing water carries the floating rock over the low lip onto the ledge.
      if (st.overflow && body.position.y < b.lip + r * .8 && body.position.x < b.button.x) {
        // Spilling current lifts the rock over the lip, then rolls it along the ledge.
        const atLip = body.position.x > b.x1 - r - 18 && body.position.y > b.lip - r - 4;
        M.applyForce(body, body.position, { x: body.mass * .00035, y: atLip ? -body.mass * .0014 : 0 });
      }
      if (Math.abs(body.position.x - b.button.x) < 26 && body.position.y < b.lip) {
        st.pressed = true;
        M.setStatic(body, true);
        M.setPosition(body, { x: b.button.x, y: b.lip - r + 4 });
        st.button.setScale(.42, .3);
        this.scene.tweens.add({ targets: [st.fence, st.roof], y: '-=180', alpha: 0, duration: 900, ease: 'back.in' });
        this.onButton?.();
      }
    }
    st.rock.setPosition(body.position.x, body.position.y).setRotation(body.angle);
  }
  /** Drops landing in the seesaw bucket fill it. */
  catchBucket = (x: number, y: number) => {
    const sw = this.seesaw;
    if (!sw || sw.launched || sw.fill >= 90) return false;
    const b = sw.bucket;
    if (Math.abs(x - b.x) > 24 || y < b.y - 72 || y > b.y - 8) return false;
    sw.fill++;
    return true;
  };
  get cageOpen() { return (!this.basin || this.basin.pressed) && (!this.lever || this.lever.pressed); }
  get bridged() { return !this.def.floatGap || this.rafts >= this.def.floatGap.need; }
  breakRope() {
    if (!this.barrel?.rope) return;
    this.scene.matter.world.removeConstraint(this.barrel.rope);
    this.barrel.rope = undefined;
    this.barrel.armed = true;
  }
  push(body: MatterJS.BodyType, at: { x: number; y: number }, vx: number, vy: number) {
    // Matter integrates force/mass * dt(ms)^2; ~0.04-0.1 px/step of velocity per droplet.
    const sw = this.seesaw;
    if (sw && body === sw.plank) {
      // Each drop's momentum times its lever arm about the hinge spins the plank.
      const dw = (at.x - sw.x) * Math.max(0, vy) * 4.5e-8 - (at.y - sw.y) * vx * 4.5e-8;
      this.scene.matter.body.setAngularVelocity(body, body.angularVelocity + dw);
      return;
    }
    const k = 4.6e-6 * Math.pow(body.mass, .75);
    this.scene.matter.body.applyForce(body, at, { x: vx * k, y: Math.min(0, vy) * k * .5 });
  }
  /** Top of the solid ground (land, bridge or a completed raft) under x, or null over open water. */
  surfaceAt(x: number): number | null {
    let top: number | null = null;
    for (const l of this.def.lands) if (x >= l.x0 && x <= l.x1) top = top === null ? l.top : Math.min(top, l.top);
    for (const br of this.def.bridges) if (x >= br.x0 && x <= br.x1) top = top === null ? br.y : Math.min(top, br.y);
    const fg = this.def.floatGap;
    if (top === null && fg && this.bridged && x > fg.x0 - 2 && x < fg.x1 + 2) top = this.surfaceAt(fg.x0 - 4) ?? 548;
    return top;
  }
  /** Lowest point of any rock slab hanging over x (cave ceilings). */
  ceilingAt(x: number) {
    let c = -Infinity;
    for (const r of this.def.rocks ?? []) if (x >= r.x0 && x <= r.x1) c = Math.max(c, r.y1);
    return c;
  }
  /** Height the truck rides at; over a gap it keeps the last solid height so visuals stay stable. */
  groundAt(x: number) {
    const t = this.surfaceAt(x);
    if (t !== null) return t;
    for (let d = 4; d < 400; d += 4) { const l = this.surfaceAt(x - d); if (l !== null) return l; const r = this.surfaceAt(x + d); if (r !== null) return r; }
    return 548;
  }
  update(dt: number, camCenter: number, reduced: boolean) {
    this.time += dt;
    const shift = camCenter - 640;
    for (const l of this.layers) l.image.x = l.x + shift * (1 - l.factor);
    for (const c of this.clouds) c.x += Math.sin(this.time * .05) * .05;
    this.river.clear();
    const left = camCenter - 700;
    for (let i = 0; i < (reduced ? 12 : 28); i++) {
      const x = left + ((i * 151 + this.time * (10 + i % 3 * 5)) % 1400), y = 596 + (i * 37) % 120;
      this.river.lineStyle(i % 3 === 0 ? 2 : 1, 0xd3f9ea, .2 + Math.sin(this.time + i) * .08);
      this.river.lineBetween(x, y, x + 18 + (i % 5) * 12, y);
    }
    if (this.sign) this.sign.y = this.groundAt(this.def.refill!.x) - 250 + Math.sin(this.time * 2) * 5;
    const fg = this.def.floatGap;
    for (const p of this.props) {
      if (p.gone) continue;
      if (p.floating) {
        // Bob on the current; the raft keeps its slot so the truck can drive over it.
        p.floating.t += dt;
        p.sprite.y = p.floating.y + Math.sin(p.floating.t * 2.2 + p.floating.x) * 2;
        p.sprite.rotation = Math.sin(p.floating.t * 1.7 + p.floating.x) * .02;
        continue;
      }
      const { x, y } = p.body.position;
      if (fg && x > fg.x0 - 10 && x < fg.x1 + 10 && y > 548 && this.rafts < fg.need) { this.float(p, fg); continue; }
      p.sprite.setPosition(x, y).setRotation(p.body.angle);
      if (p.body.position.y > 585) {
        this.onSink?.(p.body.position.x, 600);
        p.gone = true; p.surface.enabled = false; this.scene.matter.world.remove(p.body);
        this.scene.tweens.add({ targets: p.sprite, alpha: 0, y: p.sprite.y + 30, duration: 500, onComplete: () => p.sprite.destroy() });
      }
    }
    if (this.basin) this.updateBasin(dt);
    if (this.seesaw) this.updateSeesaw();
    if (this.lever) this.updateLever();
    this.ropeG.clear();
    const b = this.barrel;
    if (b && !b.landed) {
      b.sprite.setPosition(b.body.position.x, b.body.position.y).setRotation(b.body.angle);
      if (b.rope) {
        const h = this.def.hang!;
        const top = { x: b.body.position.x + Math.sin(b.body.angle) * 33, y: b.body.position.y - Math.cos(b.body.angle) * 33 };
        this.ropeG.lineStyle(4, 0x7a5228, 1).lineBetween(h.anchorX, h.anchorY, top.x, top.y);
        this.ropeG.lineStyle(1.5, 0xd9b27a, .8).lineBetween(h.anchorX - 1, h.anchorY, top.x - 1, top.y);
      } else b.falling += dt;
    }
  }
}
