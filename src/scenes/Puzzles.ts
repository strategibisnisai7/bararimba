import Phaser from 'phaser';
import type { LevelDef } from '../config/levels';
import type { Surface } from '../physics/collision';
import type { World } from './World';

interface Gate { id: string; x: number; y0: number; y1: number; open: boolean; body: MatterJS.BodyType; surface: Surface; sprite: Phaser.GameObjects.TileSprite; beam: Phaser.GameObjects.Image }
interface Switch { kind: 'target' | 'button' | 'wheel'; x: number; y: number; opens: string; need: number; hits: number; done: boolean;
  surface?: Surface; sprite?: Phaser.GameObjects.Image; disc?: Phaser.GameObjects.Graphics }
interface Tank { x0: number; x1: number; floor: number; depth: number; left: number; released: boolean; drained: number; amount: number;
  out: { x: number; y: number; vx: number }; gate?: string; plug?: { body: MatterJS.BodyType; x0: number; r: number } }

const GATE_W = 38;

/** Level-specific switches and doors: water targets behind narrow slits, pressure buttons, wheel locks,
 * sliding gates, and stone-plugged reservoirs that flood the terrain below once released. */
export class Puzzles {
  readonly gates: Gate[] = [];
  readonly switches: Switch[] = [];
  readonly tanks: Tank[] = [];
  private g: Phaser.GameObjects.Graphics;
  private emitAcc = 0;
  private t = 0;
  onOpen?: (id: string, sw: Switch) => void;
  onRelease?: () => void;
  onPour?: (x: number, y: number, vx: number, vy: number) => void;

  constructor(private scene: Phaser.Scene, private world: World, def: LevelDef) {
    this.g = scene.add.graphics().setDepth(13.5);
    for (const d of def.gates ?? []) this.makeGate(d.id, d.x, d.y0, d.y1);
    for (const d of def.reservoirs ?? []) this.makeTank(d);
    for (const d of def.switches ?? []) this.makeSwitch(d);
  }
  private makeGate(id: string, x: number, y0: number, y1: number) {
    const s = this.scene, h = y1 - y0;
    const body = s.matter.add.rectangle(x, y0 + h / 2, GATE_W, h, { isStatic: true, label: 'gate' });
    const surface: Surface = { body, kind: 'terrain', enabled: true };
    this.world.surfaces.push(surface);
    // Wooden barricade: stacked crate tiles with an iron-banded beam on top.
    const sprite = s.add.tileSprite(x - GATE_W / 2, y0, GATE_W, h, 'crate').setOrigin(0, 0).setTileScale(.29).setDepth(14);
    const beam = s.add.image(x, y0 + 2, 'plank').setScale(.28, .34).setDepth(14.5);
    this.gates.push({ id, x, y0, y1, open: false, body, surface, sprite, beam });
  }
  private makeSwitch(d: NonNullable<LevelDef['switches']>[number]) {
    const s = this.scene;
    const sw: Switch = { kind: d.kind, x: d.x, y: d.y, opens: d.opens, need: d.need ?? (d.kind === 'target' ? 14 : d.kind === 'wheel' ? 22 : 1), hits: 0, done: false };
    if (d.kind === 'target') {
      // Painted wooden target board with the glowing crosshair on top.
      const disc = s.add.graphics().setDepth(15);
      for (const [r, c] of [[27, 0x6b4421], [24, 0xffffff], [18, 0xe53a2a], [12, 0xffffff], [6, 0xe53a2a]] as const) disc.fillStyle(c, 1).fillCircle(d.x, d.y, r);
      sw.disc = disc;
      sw.sprite = s.add.image(d.x, d.y, 'target').setScale(.42).setDepth(15.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(.8);
      const body = s.matter.add.circle(d.x, d.y, 25, { isStatic: true, label: 'switch' });
      sw.surface = { body, kind: 'switch', enabled: true };
      this.world.surfaces.push(sw.surface);
    } else if (d.kind === 'button') {
      sw.sprite = s.add.image(d.x, d.y + 6, 'button').setOrigin(.5, 1).setScale(.42).setDepth(14);
    }
    this.switches.push(sw);
  }
  private makeTank(d: NonNullable<LevelDef['reservoirs']>[number]) {
    const s = this.scene, top = d.floor - d.depth - 14;
    // Left retaining wall (solid) in the level's stone texture.
    const wall = (x: number) => {
      const body = s.matter.add.rectangle(x + 8, (top + d.floor) / 2, 16, d.floor - top, { isStatic: true, label: 'tank' });
      this.world.surfaces.push({ body, kind: 'terrain', enabled: true });
      s.add.tileSprite(x, top, 16, d.floor - top, this.world.theme.fill).setOrigin(0, 0).setTileScale(.8).setDepth(14);
    };
    wall(d.x0 - 16);
    const tank: Tank = { x0: d.x0, x1: d.x1, floor: d.floor, depth: d.depth, left: 1, released: false, drained: 0, amount: d.amount, out: d.out, gate: d.gate };
    if (d.plug) {
      const r = d.plug.r, x = d.x1 + r;
      const body = s.matter.add.circle(x, d.floor - r - 1, r, { friction: .03, frictionAir: .01, restitution: .1, density: .0009, label: 'prop' });
      const sprite = s.add.image(x, d.floor - r, 'boulder').setScale(r * 2.15 / 241).setDepth(21);
      const surface: Surface = { body, kind: 'prop', enabled: true };
      this.world.surfaces.push(surface);
      this.world.props.push({ kind: 'boulder', body, sprite, surface, gone: false, plug: true });
      tank.plug = { body, x0: x, r };
    }
    this.tanks.push(tank);
  }
  /** Water hitting a target switch. */
  hit(surface: Surface) {
    const sw = this.switches.find(s => s.surface === surface);
    if (!sw || sw.done) return;
    sw.hits++;
    if (sw.hits >= sw.need) this.trigger(sw);
  }
  private trigger(sw: Switch) {
    sw.done = true;
    if (sw.surface) { sw.surface.enabled = false; this.scene.matter.world.remove(sw.surface.body); }
    if (sw.sprite && sw.kind === 'target') { sw.sprite.setTint(0x6bff6b); this.scene.tweens.add({ targets: sw.sprite, angle: 360, duration: 700 }); }
    if (sw.disc) sw.disc.setAlpha(.55);
    if (sw.kind === 'button') sw.sprite?.setScale(.42, .3);
    this.openGate(sw.opens);
    this.onOpen?.(sw.opens, sw);
  }
  openGate(id: string) {
    for (const g of this.gates) {
      if (g.id !== id || g.open) continue;
      g.open = true; g.surface.enabled = false;
      this.scene.matter.world.remove(g.body);
      this.scene.tweens.add({ targets: [g.sprite, g.beam], y: `-=${g.y1 - g.y0 + 30}`, alpha: 0, duration: 1100, ease: 'cubic.in' });
    }
  }
  /** Smash a gate apart (a flung crate): its planks scatter instead of sliding up. */
  blastGate(id: string) {
    for (const g of this.gates) {
      if (g.id !== id || g.open) continue;
      g.open = true; g.surface.enabled = false;
      this.scene.matter.world.remove(g.body);
      g.sprite.setOrigin(.5, .5).setPosition(g.x, (g.y0 + g.y1) / 2);
      this.scene.tweens.add({ targets: g.sprite, x: g.x + 90, y: g.y1 + 60, angle: 75, alpha: 0, scaleX: .4, duration: 800, ease: 'quad.in' });
      this.scene.tweens.add({ targets: g.beam, x: g.x + 140, y: g.y0 - 40, angle: -160, alpha: 0, duration: 900, ease: 'quad.out' });
    }
  }
  gate(id: string) { return this.gates.find(g => g.id === id); }
  isOpen(id: string) { return this.gates.filter(g => g.id === id).every(g => g.open); }
  /** A closed gate standing across the road at x (used to stop the truck). */
  gateBlocks(x: number, groundTop: number) {
    return this.gates.some(g => !g.open && Math.abs(x - g.x) < GATE_W / 2 + 4 && g.y1 >= groundTop - 8 && g.y0 < groundTop - 40);
  }
  /** Drops falling into a full, unreleased reservoir just merge with it. */
  absorb = (x: number, y: number) => this.tanks.some(t => x > t.x0 && x < t.x1 && y < t.floor && y > t.floor - t.depth * t.left);
  get released() { return this.tanks.some(t => t.released); }
  update(dt: number, wheelSpin: number) {
    this.t += dt;
    for (const sw of this.switches) {
      if (sw.done) continue;
      if (sw.kind === 'button') {
        // A boulder dropping toward the pad is steered onto it, and one rolling over it settles in its recess.
        for (const pr of this.world.props) {
          if (pr.gone || pr.kind !== 'boulder') continue;
          const bd = pr.body, dx = sw.x - bd.position.x, v = bd.velocity;
          if (Math.abs(dx) < 220 && bd.position.y < sw.y - 45 && v.y > .5) this.scene.matter.body.setVelocity(bd, { x: v.x * .8 + dx * .004, y: v.y });
          else if (Math.abs(dx) < 70 && bd.bounds.max.y > sw.y - 30) this.scene.matter.body.setVelocity(bd, { x: v.x * .85 + dx * .002, y: v.y });
        }
        const bodies = [...this.world.props.filter(p => !p.gone).map(p => p.body), ...(this.world.barrel ? [this.world.barrel.body] : [])];
        const on = bodies.find(b => Math.abs(b.position.x - sw.x) < 40 && b.bounds.max.y > sw.y - 30 && b.bounds.max.y < sw.y + 12);
        if (on) {
          // The weight stays on the pad: later spray can't wash it off (or into the fires).
          if (this.world.props.some(pr => pr.body === on)) {
            this.scene.matter.body.setStatic(on, true);
            const sf = this.world.surfaces.find(q => q.body === on); if (sf) sf.enabled = false;   // water flows past the weight
            this.scene.matter.body.setPosition(on, { x: on.position.x, y: on.position.y + (sw.y - 2 - on.bounds.max.y) });
          }
          this.trigger(sw);
        }
      }
      if (sw.kind === 'wheel' && wheelSpin >= sw.need) this.trigger(sw);
      if (sw.kind === 'target' && sw.sprite) sw.sprite.setAlpha(.6 + Math.sin(this.t * 5) * .25);
    }
    const g = this.g.clear();
    for (const t of this.tanks) {
      if (!t.released) {
        const plugGone = t.plug && (Math.abs(t.plug.body.position.x - t.plug.x0) > t.plug.r * 1.3 || t.plug.body.position.y > t.floor + 10);
        const gateOpen = t.gate && this.isOpen(t.gate);
        if (plugGone || gateOpen) { t.released = true; this.onRelease?.(); }
      } else if (t.drained < t.amount) {
        // Pour the stored water out of the breach; the running-water simulation carries it downhill.
        this.emitAcc += dt * 70;
        while (this.emitAcc >= 1 && t.drained < t.amount) {
          this.emitAcc--; t.drained++;
          this.onPour?.(t.out.x + Math.random() * 8, t.out.y - Math.random() * Math.max(6, t.depth * t.left * .7), t.out.vx * (.7 + Math.random() * .6), Math.random() * 20);
        }
        t.left = 1 - t.drained / t.amount;
      }
      // Water body with a rippling surface.
      const level = t.floor - t.depth * t.left;
      if (t.left > .01) {
        g.fillStyle(0x2f9ee8, .78).fillRect(t.x0, level, t.x1 - t.x0 + (t.plug && !t.released ? t.plug.r : 0), t.floor - level);
        g.lineStyle(3, 0xd8f5ff, .9).beginPath();
        for (let x = t.x0; x <= t.x1; x += 8) { const y = level + Math.sin(this.t * 4 + x * .07) * 2; x === t.x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
        g.strokePath();
      }
    }
  }
}
