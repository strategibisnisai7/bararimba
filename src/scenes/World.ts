import Phaser from 'phaser';
import type { LevelDef } from '../config/levels';
import type { Surface } from '../physics/collision';
import type { Fuel } from '../systems/FireSystem';
import { Puzzles } from './Puzzles';
import { Terrain } from './Terrain';
import { SumatraWorld } from './Sumatra';

interface ThemeStyle {
  sky: [number, number]; bed: [number, number]; far: number; mid: number; haze: number;
  top: string[]; fill: string; fillTint?: number; topScale: number; topLift: number;
  props: { key: string; scale: number; lift?: number }[]; particles?: 'embers' | 'snow';
  /** Replace the jungle backdrop with the volcanic parallax sheet layers. */
  parallax?: 'volcano' | 'temple' | 'cave';
  /** Texture for pushable boulders. */
  boulder?: { key: string; scale: number };
}
const THEMES: Record<string, ThemeStyle> = {
  forest: { sky: [0x5fb8e6, 0xcdeee6], bed: [0x5cc8d6, 0x1a7fa0], far: 0x86bfa8, mid: 0xbfe0bc, haze: 0xd6efe0, top: ['top-a', 'top-b'], fill: 'dirt', topScale: .86, topLift: 16, props: [] },
  // Ancient Java: Prambanan temple ruins.
  ruins: { sky: [0x86c4e6, 0xf6e2b8], bed: [0x5cc8d6, 0x1a7fa0], far: 0xa8b892, mid: 0xc8d4a8, haze: 0xf4e6c4, top: ['p-top'], fill: 'p-fill', topScale: .8, topLift: 14,
    props: [{ key: 'p-pillar', scale: .55 }, { key: 'p-stupa', scale: .6 }, { key: 'p-gate', scale: .6 }, { key: 'p-guardian', scale: .6 }], parallax: 'temple' },
  volcanic: { sky: [0x6a5a6e, 0xf0a070], bed: [0xff8a2a, 0x9a2a0a], far: 0x8a6a5a, mid: 0xb08a70, haze: 0xd89070, top: ['v-top'], fill: 'v-fill', topScale: .9, topLift: 12, parallax: 'volcano',
    props: [{ key: 'v-rock', scale: .8 }, { key: 'v-spire', scale: .8 }, { key: 'v-tree', scale: .8 }], particles: 'embers' },
  // Sumatra karst cave: mossy ledge stone, stalactite ceiling, waterfalls and rainforest beyond the cave mouth.
  cave: { sky: [0x1f3b36, 0x7fb3a0], bed: [0x46c2cf, 0x125468], far: 0x41675d, mid: 0x6d9a7c, haze: 0xa8d6c4, top: ['sm-top'], fill: 'sm-fill',
    topScale: .78, topLift: 22, props: [], parallax: 'cave', boulder: { key: 'sm-boulder', scale: .54 } },
};

export interface Prop { kind: string; body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; surface: Surface; gone: boolean; floating?: { x: number; y: number; t: number }; plug?: boolean }
interface Layer { image: Phaser.GameObjects.Image; x: number; factor: number }

/** Builds a level's scenery and collision from data. Every visual comes from a sliced source sprite. */
export class World {
  readonly surfaces: Surface[] = [];
  readonly props: Prop[] = [];
  readonly fuel = new Map<number, Fuel>();
  /** Swinging/flying load: a water barrel (douses fire where it lands) or a crate (just blocks). */
  barrel?: { body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; surface: Surface; hp: number; rope?: MatterJS.ConstraintType;
    falling: number; landed: boolean; armed: boolean; load: 'barrel' | 'crate'; flightY?: number; door?: string; flung?: boolean;
    lob?: { x0: number; y0: number; x1: number; y1: number; t: number; T: number; h: number } };
  seesaw?: { plank: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; launched: boolean; hold?: MatterJS.ConstraintType; x: number; y: number; target: { x: number; y: number } };
  lever?: { button: Phaser.GameObjects.Image; fence: Phaser.GameObjects.Image; roof: Phaser.GameObjects.Image; pressed: boolean };
  private layers: Layer[] = [];
  private river: Phaser.GameObjects.Graphics;
  private ropeG: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image[] = [];
  private sign?: Phaser.GameObjects.Image;
  private fall?: Phaser.GameObjects.Graphics;
  private time = 0;
  onSink?: (x: number, y: number) => void;
  onFloat?: (x: number, y: number, bridged: boolean) => void;
  rafts = 0;
  basin?: {
    volume: number; level: number; g: Phaser.GameObjects.Graphics; boulder: MatterJS.BodyType; rock: Phaser.GameObjects.Image;
    button: Phaser.GameObjects.Image; fence: Phaser.GameObjects.Image; roof: Phaser.GameObjects.Image; pressed: boolean; overflow: boolean;
  };
  onButton?: () => void;
  wheel?: { cx: number; cy: number; r: number; w: number; spun: number; sprite: Phaser.GameObjects.Image; out?: { x: number; y: number; vx: number }; surface: Surface };
  puzzles!: Puzzles;
  terrain?: Terrain;
  /** Sumatra mechanisms and rescue flag. */
  sm?: SumatraWorld;
  /** Emits free water (reservoirs, basin overflow); wired to the water system by the scene. */
  onPour?: (x: number, y: number, vx: number, vy: number) => void;

  readonly theme: ThemeStyle;
  private weather?: Phaser.GameObjects.Particles.ParticleEmitter;
  constructor(private scene: Phaser.Scene, readonly def: LevelDef) {
    const W = def.width;
    this.theme = THEMES[def.theme ?? 'forest'];
    const T = this.theme;
    this.ensureDirt();
    if (T.parallax === 'cave') this.ensureCaveStone();
    const sky = scene.add.graphics().setDepth(0);
    sky.fillGradientStyle(T.sky[0], T.sky[0], T.sky[1], T.sky[1], 1).fillRect(-2400, -1200, W + 4800, 2400);
    if (T.parallax !== 'cave') sky.fillStyle(0xfff7d6, .25).fillCircle(980, 150, 80);
    for (let i = 0; T.parallax !== 'cave' && i * 520 < W + 600; i++) {
      const c = scene.add.image(200 + i * 520, 110 + (i % 3) * 38, 'cloud').setScale(.45 + (i % 2) * .3).setAlpha(.85).setDepth(1);
      this.clouds.push(c); this.layers.push({ image: c, x: c.x, factor: .1 });
    }
    const span = (f: number) => 1280 + Math.max(0, W - 1280) * f + 2400;   // extra width for zoomed-out views
    if (T.parallax === 'volcano') {
      // Volcanic parallax: erupting volcano sky, lava plains, then rock shelves behind the play area.
      for (let x = -700; x < span(.12); x += 1660) this.layer('vp-sky', x + 830, 470, 1, 2, .12);
      for (let x = -700; x < span(.35); x += 1500) this.layer('vp-plain', x + 750, 596, .9, 3, .35);
      for (let x = -700; x < span(.6); x += 1330) this.layer('vp-rocks', x + 665, 616, .8, 5, .6);
    } else if (T.parallax === 'cave') {
      this.caveBackdrop(span);
    } else {
      if (T.parallax === 'temple') {
        // Distant Prambanan temple complex silhouetted behind the jungle.
        const temples = ['p-temple-a', 'p-temple-b', 'p-temple-c', 'p-temple-d'];
        for (let i = 0, x = -400; x < span(.3); i++, x += 330 + (i * 67) % 160) this.layer(temples[i % 4], x, 500, 1.5 + (i % 3) * .3, 3.5, .3, 1, 0xd8c8b0);
      }
      for (let x = -1400; x < span(.2); x += 1400) this.layer('mountains', x + 700, 420, .84, 2, .2, .55);
      for (let x = -1400; x < span(.35); x += 1400) this.layer('hills', x + 700, 520, .84, 3, .35, .7);
      // Far and mid jungle canopy rows (board reference shows dense trees behind the play area).
      const far = ['tree-a', 'tree-b', 'tree-c', 'tree-large'], mid = ['tree-b', 'tree-a', 'tree-small', 'tree-c', 'tree-flower'];
      for (let i = 0, x = -900; x < span(.5); i++, x += 150 + (i * 37) % 70) this.layer(far[i % far.length], x, 590, .62 + (i % 3) * .08, 4, .5, 1, T.far);
      for (let i = 0, x = -900; x < span(.75); i++, x += 230 + (i * 53) % 90) this.layer(mid[i % mid.length], x, 610, .78 + (i % 2) * .12, 5, .75, 1, T.mid);
    }
    const haze = scene.add.graphics().setDepth(5.5);
    haze.fillGradientStyle(T.haze, T.haze, T.haze, T.haze, 0, 0, .4, .4).fillRect(-200, 380, W + 400, 240);
    // River across the world, partly covered by land.
    const bed = scene.add.graphics().setDepth(6);
    bed.fillGradientStyle(T.bed[0], T.bed[0], T.bed[1], T.bed[1], 1).fillRect(-2400, 586, W + 4800, 520);
    this.river = scene.add.graphics().setDepth(7);
    this.ropeG = scene.add.graphics().setDepth(38);
    this.add(W / 2, 690, W + 400, 90, 'river');

    for (const b of def.bridges) this.bridge(b.x0, b.x1, b.y);
    for (const l of def.lands) this.land(l.x0, l.x1, l.top, l.style);
    if (def.terrain) this.terrain = new Terrain(scene, def.terrain, this.surfaces);
    for (const d of def.decor) {
      const img = scene.add.image(d.x, d.y, d.key).setOrigin(.5, 1).setScale(d.scale).setFlipX(!!d.flip).setDepth(d.back ? 8 : 16);
      if (T.parallax === 'volcano' && d.key.startsWith('tree')) img.setTint(0x7a5444);   // scorched volcanic trees
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
    for (const r of def.ramps ?? []) this.ramp(r);
    if (def.seesaw) this.makeSeesaw(def.seesaw);
    if (def.lever) this.makeLever(def.lever);
    if (def.basin) this.makeBasin(def.basin);
    if (def.boss?.waterfall) this.fall = scene.add.graphics().setDepth(12.5);
    if (def.wheel) {
      const wd = def.wheel;
      scene.add.image(wd.x, wd.y + wd.r + 8, 'pivot').setOrigin(.5, 1).setScale(.62).setDepth(19);
      const sprite = scene.add.image(wd.x, wd.y, 'gear').setScale(wd.r * 2 / 205).setDepth(20);
      const body = scene.matter.add.circle(wd.x, wd.y, wd.r, { isStatic: true, label: 'wheel' });
      const surface: Surface = { body, kind: 'wheel', enabled: true };
      this.surfaces.push(surface);
      this.wheel = { cx: wd.x, cy: wd.y, r: wd.r, w: 0, spun: 0, sprite, out: wd.out, surface };
    }
    this.puzzles = new Puzzles(scene, this, def);
    this.puzzles.onPour = (x, y, vx, vy) => this.onPour?.(x, y, vx, vy);
    if (def.sm) { this.sm = new SumatraWorld(scene, this, def); this.sm.onPour = (x, y, vx, vy) => this.onPour?.(x, y, vx, vy); }
    if (T.props.length) {
      // Scatter themed props along walkable ground, away from fires and mechanisms.
      const busy = [...def.fires.map(f => f.x), ...(def.gates ?? []).map(g => g.x), ...(def.switches ?? []).map(w => w.x), ...(def.reservoirs ?? []).map(r => r.x1), def.animal.x, def.refill?.x ?? -999, def.seesaw?.x ?? -999, def.hang?.anchorX ?? -999, def.wheel?.x ?? -999];
      let i = 0;
      for (const l of def.lands) for (let x = l.x0 + 90; x < l.x1 - 60; x += 260 + (i * 71) % 120) {
        if (busy.some(b => Math.abs(b - x) < 110) || x < 520) continue;
        const pr = T.props[i++ % T.props.length];
        scene.add.image(x, l.top + 6, pr.key).setOrigin(.5, 1).setScale(pr.scale).setDepth(16);
      }
    }
    if (T.particles === 'snow') this.weather = scene.add.particles(0, 0, 'p-soft', {
      x: { min: -200, max: W + 200 }, y: -760, lifespan: 9000, speedY: { min: 40, max: 90 }, speedX: { min: -25, max: 15 },
      scale: { min: .06, max: .16 }, alpha: { start: .9, end: .4 }, frequency: 40, quantity: 2,
    }).setDepth(47);
    if (T.particles === 'embers') this.weather = scene.add.particles(0, 0, 'p-spark', {
      x: { min: -200, max: W + 200 }, y: 740, lifespan: 7000, speedY: { min: -90, max: -40 }, speedX: { min: -20, max: 30 },
      scale: { start: .4, end: .1 }, alpha: { start: 1, end: 0 }, tint: [0xffb030, 0xff6a1a, 0xffe08a], frequency: 60, blendMode: Phaser.BlendModes.ADD,
    }).setDepth(47);
    const fgSpan = W + 400;
    if (T.parallax === 'volcano') for (let x = -1400; x < fgSpan + 1000; x += 1400) scene.add.image(x + 700, 800, 'vp-front').setOrigin(.5, 1).setScale(.84).setDepth(49);
    else if (T.parallax === 'cave') {
      const fg = ['sm-jungle-bush', 'sm-fern-root', 'sm-fern-a', 'sm-palm-b', 'sm-bush-red'];
      for (let i = 0, x = -900; x < fgSpan + 900; i++, x += 300 + (i * 61) % 140) scene.add.image(x, 800, fg[i % fg.length]).setOrigin(.5, 1).setScale(.95 + (i % 3) * .12).setDepth(49);
    } else for (let x = -1400; x < fgSpan + 1000; x += 1380) scene.add.image(x + 690, 760, 'foreground').setOrigin(.5, 1).setScale(.83).setDepth(49);

  }

  /** Temple stone for blocks and pools: the ruins wall course recoloured to sunlit limestone outside
   * the ruins theme (whose own grey stone matches its temples). */
  private stoneTexture() {
    if (this.def.theme === 'ruins') return 'p-fill';
    const tex = this.scene.textures;
    if (!tex.exists('stone-beige')) {
      const src = tex.get('p-fill').getSourceImage() as HTMLImageElement;
      const c = tex.createCanvas('stone-beige', src.width, src.height)!, ctx = c.getContext();
      ctx.drawImage(src, 0, 0);
      ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#c8ad7e'; ctx.fillRect(0, 0, src.width, src.height);
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = '#5a4a32'; ctx.fillRect(0, 0, src.width, src.height);
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(src, 0, 0);
      c.refresh();
    }
    return 'stone-beige';
  }
  private ensureDirt() {
    if (this.scene.textures.exists('dirt')) return;
    const src = this.scene.textures.get('top-b').getSourceImage() as HTMLImageElement;
    const tex = this.scene.textures.createCanvas('dirt', 240, 58)!;
    tex.getContext().drawImage(src, 22, 52, 240, 58, 0, 0, 240, 58);
    tex.refresh();
  }
  /** Ground skin for the cave theme, cut from the Sumatra mossy ledge (sheet cutout 001): its grassy crown as
   * the top strip and its boulder wall as the fill below. */
  private ensureCaveStone() {
    const tex = this.scene.textures;
    if (tex.exists('sm-top')) return;
    const src = tex.get('sm-ledge').getSourceImage() as HTMLImageElement;
    const top = tex.createCanvas('sm-top', 380, 112)!;
    top.getContext().drawImage(src, 58, 0, 380, 112, 0, 0, 380, 112);
    top.refresh();
    const fill = tex.createCanvas('sm-fill', 300, 84)!, ctx = fill.getContext();
    ctx.drawImage(src, 96, 96, 300, 84, 0, 0, 300, 84);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#8f9a8c'; ctx.fillRect(0, 0, 300, 84);
    fill.refresh();
  }
  /** Karst cave: waterfalls and rainforest glimpsed past stalagmites, a stalactite ceiling hanging overhead. */
  private caveBackdrop(span: (f: number) => number) {
    const s = this.scene, T = this.theme;
    const glow = s.add.graphics().setDepth(1);
    for (let x = 300; x < span(.15); x += 1500) glow.fillStyle(0xd8f4dc, .14).fillEllipse(x, 470, 1100, 520).fillStyle(0xf4ffe8, .12).fillEllipse(x, 500, 600, 300);
    const falls = ['sm-falls-tall', 'sm-falls', 'sm-falls-small'];
    for (let i = 0, x = -600; x < span(.25); i++, x += 520 + (i * 97) % 260) this.layer(falls[i % 3], x, 640, 1.5 + (i % 2) * .4, 2, .25, .55, 0x9cc8c0);
    const spires = ['sm-spire-a', 'sm-spire-d', 'sm-spire-b', 'sm-spire-e', 'sm-spire-c'];
    for (let i = 0, x = -800; x < span(.4); i++, x += 210 + (i * 53) % 120) this.layer(spires[i % 5], x, 640, 1.6 + (i % 3) * .5, 3, .4, 1, T.far);
    const jungle = ['sm-palm-a', 'sm-fern-root', 'sm-palm-b', 'sm-jungle-bush'];
    for (let i = 0, x = -900; x < span(.6); i++, x += 240 + (i * 71) % 110) this.layer(jungle[i % 4], x, 640, 1 + (i % 2) * .25, 4, .6, 1, T.mid);
    // Rock ceiling: a dark mass above the view with stalactites and vines hanging from its edge.
    s.add.tileSprite(-2400, -1600, this.def.width + 4800, 1570, 'sm-fill').setOrigin(0, 0).setTileScale(1.2).setTint(0x55665a).setDepth(4.5);
    s.add.graphics().setDepth(4.55).fillGradientStyle(0x0e1a15, 0x0e1a15, 0x0e1a15, 0x0e1a15, 0, 0, .6, .6).fillRect(-2400, -160, this.def.width + 4800, 130);
    const drips = ['sm-cave-ceiling', 'sm-stalactite-c', 'sm-stalactite-b', 'sm-stalactite-a'];
    for (let i = 0, x = -900; x < span(.9); i++, x += 190 + (i * 43) % 90) {
      const img = s.add.image(x, -60, drips[i % 4]).setOrigin(.5, 0).setScale(1.3 + (i % 3) * .3).setDepth(4.6).setTint(0x8a9a8c);
      this.layers.push({ image: img, x, factor: .9 });
      if (i % 3 === 0) this.layers.push({ image: s.add.image(x + 60, -40, 'sm-vines').setOrigin(.5, 0).setScale(.8).setDepth(4.7).setTint(0xa8c8a0), x: x + 60, factor: .9 });
    }
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
    const T = this.theme;
    s.add.tileSprite(x0, top + (T.fill === 'dirt' ? 70 : 34), w, 1100 - top, T.fill).setOrigin(0, 0).setTileScale(T.fill === 'dirt' ? .9 : 1.1).setDepth(10);
    const keys = T.top;
    const sc = T.topScale;
    for (let x = x0 - 6, i = 0; x < x1 - 10; i++) {
      const key = keys[i % keys.length];
      const img = s.add.image(x, top - T.topLift, key).setOrigin(0, 0).setScale(sc).setDepth(11);
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
    const p = this.prop(src.kind, src.x, src.y);
    p.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: p.sprite, alpha: 1, duration: 500 });
    return true;
  }
  prop(kind: string, x: number, y: number) {
    const s = this.scene;
    let body: MatterJS.BodyType, sprite: Phaser.GameObjects.Image;
    if (kind === 'boulder') {
      body = s.matter.add.circle(x, y, 40, { friction: .04, frictionAir: .01, restitution: .15, density: .0009, label: 'prop' });
      const skin = this.theme.boulder ?? { key: 'boulder', scale: .37 };
      sprite = s.add.image(x, y, skin.key).setScale(skin.scale);
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
    const prop: Prop = { kind, body, sprite, surface, gone: false };
    this.props.push(prop);
    return prop;
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
    this.barrel = { body, sprite, surface, hp: crate ? 30 : 35, rope, falling: 0, landed: false, armed: false, load: crate ? 'crate' : 'barrel', door: h.door };
  }
  private rock(r: NonNullable<LevelDef['rocks']>[number]) {
    const s = this.scene, w = r.x1 - r.x0, h = r.y1 - r.y0;
    this.add(r.x0 + w / 2, r.y0 + h / 2, w, h, 'terrain');
    if (r.stone) {
      // Cut temple blocks: stone courses with a lit top edge and a shaded base.
      s.add.tileSprite(r.x0, r.y0, w, h, this.stoneTexture()).setOrigin(0, 0).setTileScale(1.15).setDepth(15);
      s.add.rectangle(r.x0, r.y0, w, 5, 0xfff0d0, .35).setOrigin(0, 0).setDepth(15.5);
      s.add.rectangle(r.x0, r.y1 - 8, w, 8, 0x1a1408, .4).setOrigin(0, 0).setDepth(15.5);
      return;
    }
    const T = this.theme;
    s.add.tileSprite(r.x0, r.y0, w, h, T.fill).setOrigin(0, 0).setTileScale(T.fill === 'dirt' ? .9 : 1.1).setDepth(15);
    // Grass lip on top and a dark underside so the slab reads as an overhang.
    for (let x = r.x0 - 6, i = 0; x < r.x1 - 10; i++) {
      const img = s.add.image(x, r.y0 - T.topLift, T.top[i % T.top.length]).setOrigin(0, 0).setScale(T.topScale).setDepth(15);
      if (img.displayWidth > r.x1 + 6 - x) img.setCrop(0, 0, (r.x1 + 6 - x) / T.topScale, img.height);
      x += img.displayWidth - 8;
    }
    s.add.rectangle(r.x0, r.y1 - 10, w, 10, 0x2b1a0c, .55).setOrigin(0, 0).setDepth(15.5);
  }
  readonly ramps: { def: NonNullable<LevelDef['ramps']>[number]; body: MatterJS.BodyType; image: Phaser.GameObjects.Image; len: number; angle: number }[] = [];
  /** Planks released by gate `id` swing down about their hinge; their water surface follows. */
  swingRamps(id: string) {
    for (const r of this.ramps) {
      if (r.def.drops !== id) continue;
      const from = r.angle, to = Math.abs(from);
      this.scene.tweens.addCounter({ from, to, duration: 700, ease: 'bounce.out', onUpdate: tw => {
        const a = tw.getValue() ?? to, { x0, y0 } = r.def, nx = Math.sin(a), ny = -Math.cos(a), T = 14;
        const x1 = x0 + Math.cos(a) * r.len, y1 = y0 + Math.sin(a) * r.len;
        const v = r.body.vertices as unknown as { x: number; y: number }[];
        v[0] = { x: x0, y: y0 }; v[1] = { x: x1, y: y1 }; v[2] = { x: x1 - nx * T, y: y1 - ny * T }; v[3] = { x: x0 - nx * T, y: y0 - ny * T };
        const xs = v.map(q => q.x), ys = v.map(q => q.y);
        r.body.bounds = { min: { x: Math.min(...xs), y: Math.min(...ys) }, max: { x: Math.max(...xs), y: Math.max(...ys) } } as typeof r.body.bounds;
        r.image.setRotation(a); r.angle = a;
      } });
    }
  }
  /** Hinged wooden ramp: a water-only surface (props pass it) that redirects a jet along its length. */
  private ramp(r: NonNullable<LevelDef['ramps']>[number]) {
    const s = this.scene, len = Math.hypot(r.x1 - r.x0, r.y1 - r.y0), a = Math.atan2(r.y1 - r.y0, r.x1 - r.x0);
    const nx = Math.sin(a), ny = -Math.cos(a), T = 14;   // top face along the line, thickness below it
    const vertices = [{ x: r.x0, y: r.y0 }, { x: r.x1, y: r.y1 }, { x: r.x1 - nx * T, y: r.y1 - ny * T }, { x: r.x0 - nx * T, y: r.y0 - ny * T }];
    const xs = vertices.map(v => v.x), ys = vertices.map(v => v.y);
    const body = { vertices, bounds: { min: { x: Math.min(...xs), y: Math.min(...ys) }, max: { x: Math.max(...xs), y: Math.max(...ys) } }, position: { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 } } as unknown as MatterJS.BodyType;
    this.surfaces.push({ body, kind: 'ramp', enabled: true });
    const image = s.add.image(r.x0, r.y0, 'plank').setOrigin(0, .3).setDisplaySize(len, 24).setRotation(a).setDepth(20);
    this.ramps.push({ def: r, body, image, len, angle: a });
    const g = s.add.graphics().setDepth(20.5);
    g.fillStyle(0x2b2f36, 1).fillCircle(r.x0, r.y0, 15).fillStyle(0x8a929c, 1).fillCircle(r.x0, r.y0, 10).fillStyle(0x2b2f36, 1).fillCircle(r.x0, r.y0, 4);
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
    this.seesaw = { plank, sprite, launched: false, hold, x: d.x, y: d.y, target: d.target };
  }
  private updateSeesaw() {
    const sw = this.seesaw!, M = this.scene.matter.body, p = sw.plank;
    // Hinge stops: the plank can only tilt +-0.32 rad.
    if (p.angle > .32) { M.setAngle(p, .32); if (p.angularVelocity > 0) M.setAngularVelocity(p, 0); }
    if (p.angle < -.32) { M.setAngle(p, -.32); if (p.angularVelocity < 0) M.setAngularVelocity(p, 0); }
    // A boulder dropping onto the raised (left) end slams it down: the cradle releases the barrel like a catapult.
    const b = this.barrel;
    // A boulder tipping off the ledge drops almost straight onto the raised end instead of sailing past it.
    if (!sw.launched) for (const r of this.props) {
      const v = r.body.velocity;
      if (!r.gone && r.kind === 'boulder' && v.y > .3 && r.body.position.x > sw.x - 135 && r.body.position.x < sw.x && r.body.position.y < sw.y - 40 && Math.abs(v.x) > .8)
        M.setVelocity(r.body, { x: Math.sign(v.x) * .8, y: v.y });
    }
    const slam = !sw.launched && this.props.find(r => {
      if (r.gone || r.kind !== 'boulder') return false;
      const { x, y } = r.body.position, dx = x - p.position.x;
      const surf = p.position.y + dx * Math.tan(p.angle) - 8;
      return dx < -15 && dx > -135 && r.body.velocity.y > 1.5 && y + 40 >= surf - 10;
    });
    if (slam && b) {
      sw.launched = true; b.armed = true; b.falling = 0;
      M.setAngularVelocity(p, -.12);
      M.setVelocity(slam.body, { x: slam.body.velocity.x * .3, y: slam.body.velocity.y * .2 });
      this.scene.cameras.main.shake(160, .005);
      if (sw.hold) this.scene.matter.world.removeConstraint(sw.hold);
      // Scripted high lob onto the target: apex ~420 px above the launch point clears the cliff.
      const { x, y } = b.body.position;
      b.body.isSensor = true; b.flightY = sw.target.y;
      b.lob = { x0: x, y0: y, x1: sw.target.x, y1: sw.target.y, t: 0, T: 1.9, h: 420 };
      this.onLaunch?.();
    }
    sw.sprite.setPosition(p.position.x, p.position.y).setRotation(p.angle);
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
    // A sculpted basin (terrain piece) is its own backdrop; its water sits behind the rock so the
    // opaque stone masks the rectangular water body to the bowl's curve. A stone pool shows cut blocks.
    const bowl = !!this.def.terrain && !b.stone;
    if (b.stone) s.add.tileSprite(b.x0, b.lip, b.x1 - b.x0, b.floor - b.lip, this.stoneTexture()).setOrigin(0, 0).setTileScale(1.15).setTint(0xb0a898).setDepth(9.5);
    else if (!bowl) s.add.tileSprite(b.x0, b.lip, b.x1 - b.x0, b.floor - b.lip, 'dirt').setOrigin(0, 0).setTileScale(.9).setTint(0x8a6a50).setDepth(9.5);
    const g = s.add.graphics().setDepth(bowl ? 10.5 : 12);
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
    if (!b || !st || x <= b.x0 - 6 || x >= b.x1 + 6 || y < st.level - 3 || y > b.floor) return false;
    st.volume += 1;
    return true;
  };
  private updateBasin(dt: number) {
    const b = this.def.basin!, st = this.basin!;
    const depth = b.floor - b.lip;
    st.volume = Math.max(0, st.volume - dt * 3);                 // slow seepage (kept low so partial hits still fill it)
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
      if (st.overflow && Math.random() < dt * (this.def.terrain ? 60 : 30)) this.onPour?.(b.x1 + 6, b.lip - 6, 70 + Math.random() * 40, 0);
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
        // Resting on the pad it is only a weight: the overflow runs past it on to the fires.
        const sf = this.surfaces.find(q => q.body === body); if (sf) sf.enabled = false;
        M.setPosition(body, { x: b.button.x, y: b.lip - r + 4 });
        st.button.setScale(.42, .3);
        this.scene.tweens.add({ targets: [st.fence, st.roof], y: '-=180', alpha: 0, duration: 900, ease: 'back.in' });
        this.onButton?.();
      }
    }
    st.rock.setPosition(body.position.x, body.position.y).setRotation(body.angle);
  }
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
    if (sw && body === sw.plank) return;   // only the falling boulder works the catapult
    const k = 4.6e-6 * Math.pow(body.mass, .75);
    this.scene.matter.body.applyForce(body, at, { x: vx * k, y: Math.min(0, vy) * k * .5 });
  }
  /** Top of the solid ground (land, bridge or a completed raft) under x, or null over open water. */
  surfaceAt(x: number): number | null {
    let top: number | null = null;
    for (const l of this.def.lands) if (x >= l.x0 && x <= l.x1) top = top === null ? l.top : Math.min(top, l.top);
    for (const br of this.def.bridges) if (x >= br.x0 && x <= br.x1) top = top === null ? br.y : Math.min(top, br.y);
    const t = this.terrain?.topAt(x) ?? null;
    if (t !== null) top = top === null ? t : Math.min(top, t);
    const m = this.sm?.surfaceAt(x) ?? null;
    if (m !== null) top = top === null ? m : Math.min(top, m);
    const fg = this.def.floatGap;
    if (top === null && fg && this.bridged && x > fg.x0 - 2 && x < fg.x1 + 2) top = this.surfaceAt(fg.x0 - 4) ?? 548;
    return top;
  }
  /** Lowest point of any rock slab or terrain ledge hanging over x (cave ceilings) above `ground`. */
  ceilingAt(x: number, ground = Infinity) {
    let c = this.terrain?.ceilingAt(x, ground) ?? -Infinity;
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
    const left = camCenter - 2200, right = camCenter + 2200, lava = this.def.theme === 'volcanic';
    const crest = lava ? 0xffe08a : 0xe8fbff, glint = lava ? 0xfff2b0 : 0xffffff;
    // Rolling surface: two layered waves along the river's top edge.
    for (const [amp, len, spd, y0, col, al, wdt] of [[3, 90, 1.4, 588, crest, .75, 3], [2, 55, -2.1, 595, glint, .45, 2]] as const) {
      this.river.lineStyle(wdt, col, al).beginPath();
      for (let x = left; x <= right; x += 10) {
        const y = y0 + Math.sin(x / len + this.time * spd) * amp + Math.sin(x / (len * 2.7) - this.time * spd * .6) * amp * .6;
        x === left ? this.river.moveTo(x, y) : this.river.lineTo(x, y);
      }
      this.river.strokePath();
    }
    // Drifting light streaks and sparkles below the surface.
    const n = reduced ? 16 : 40;
    for (let i = 0; i < n; i++) {
      const row = (i * 37) % 120, speed = 14 + (i % 4) * 8;
      const x = left + ((i * 211 + this.time * speed) % (right - left)), y = 602 + row;
      const a = .14 + Math.sin(this.time * 2 + i) * .1;
      this.river.lineStyle(i % 3 === 0 ? 2 : 1, crest, Math.max(0, a));
      this.river.lineBetween(x, y + Math.sin(this.time * 3 + i) * 2, x + 22 + (i % 5) * 14, y + Math.sin(this.time * 3 + i + 1) * 2);
      if (i % 5 === 0) this.river.fillStyle(glint, Math.max(0, Math.sin(this.time * 4 + i * 1.7)) * .7).fillCircle(x + 10, y - 3, 1.8);
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
      // Sinks only into open water: sculpted ground may lie below the river line.
      const under = this.surfaceAt(p.body.position.x);
      if (p.body.position.y > 585 && (under === null || p.body.position.y > under + 20)) {
        this.onSink?.(p.body.position.x, 600);
        p.gone = true; p.surface.enabled = false; this.scene.matter.world.remove(p.body);
        this.scene.tweens.add({ targets: p.sprite, alpha: 0, y: p.sprite.y + 30, duration: 500, onComplete: () => p.sprite.destroy() });
      }
    }
    if (this.basin) this.updateBasin(dt);
    this.puzzles.update(dt, this.wheel?.spun ?? 0);
    this.sm?.update(dt);
    const wf = this.def.boss?.waterfall;
    if (this.fall && wf) {
      // Animated waterfall under the bridge: falling streaks and foam.
      const g = this.fall.clear();
      g.fillGradientStyle(0x8fe3ff, 0x8fe3ff, 0x2b9fd8, 0x2b9fd8, .9).fillRect(wf.x - wf.w / 2, wf.y, wf.w, 1000 - wf.y);
      for (let i = 0; i < 14; i++) {
        const x = wf.x - wf.w / 2 + 6 + (i * 37) % (wf.w - 12), y = wf.y + ((this.time * 260 + i * 53) % (720 - wf.y));
        g.lineStyle(3, 0xffffff, .55).lineBetween(x, y, x, y + 24);
      }
      for (let i = 0; i < 8; i++) g.fillStyle(0xffffff, .5).fillCircle(wf.x - wf.w / 2 + Math.random() * wf.w, 700 + Math.random() * 16, 6 + Math.random() * 8);
    }
    if (this.seesaw) this.updateSeesaw();
    if (this.lever) this.updateLever();
    this.ropeG.clear();
    const b = this.barrel;
    if (b?.lob && !b.landed) {
      const l = b.lob, M = this.scene.matter.body;
      l.t = Math.min(l.T, l.t + dt);
      const u = l.t / l.T, du = 1 / l.T / 60;
      const at = (k: number) => ({ x: l.x0 + (l.x1 - l.x0) * k, y: l.y0 + (l.y1 - l.y0) * k - 4 * l.h * k * (1 - k) });
      const now = at(u), next = at(Math.min(1, u + du));
      M.setPosition(b.body, now);
      M.setVelocity(b.body, { x: next.x - now.x, y: u >= 1 ? 2 : next.y - now.y });
      M.setAngle(b.body, b.body.angle + dt * 6);
    }
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
