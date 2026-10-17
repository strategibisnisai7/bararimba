import Phaser from 'phaser';
import { clamp, type Point, type Nozzle } from '../config/level';

/** Four serial pivots mounted on the truck roof. Angles are world radians, y down.
 * Arm sprite pivots (33,47)->(270,50) on a 328x91 crop; nozzle pivot (12,43), outlet (143,51).
 */
export class Cannon {
  base: Point = { x: 0, y: 0 };
  readonly lengths: number[];
  readonly joints: Point[] = [];
  /** Boom (hinge) elevation in [-1 high .. 1 low], set by the player. */
  boom = -.2;
  /** Nozzle tip world angle in radians (negative = up), set by the player; water leaves along it. */
  tip = -.6;
  nozzle: Nozzle = { x: 0, y: 0, angle: 0 };
  private smoothBoom = -.2;
  private smoothTip = -.6;
  private arms: Phaser.GameObjects.Image[];
  private muzzle: Phaser.GameObjects.Image;
  private hose: Phaser.GameObjects.Graphics;
  private mount: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, private k: number) {
    this.lengths = [68, 58, 48, 38].map(l => l * k);
    this.mount = scene.add.image(0, 0, 'cannon-base').setOrigin(.5, .65).setScale(.31 * k).setDepth(25);
    this.hose = scene.add.graphics().setDepth(26);
    this.arms = this.lengths.map(length => scene.add.image(0, 0, 'cannon-arm')
      .setOrigin(33 / 328, 47 / 91).setScale(length / Math.hypot(237, 3)).setDepth(27));
    this.muzzle = scene.add.image(0, 0, 'nozzle').setOrigin(12 / 158, 43 / 102).setScale(.28 * k).setDepth(28);
  }
  setBoom(v: number) { this.boom = clamp(v, -1, 1); }
  setTip(v: number) { this.tip = clamp(v, -1.4, .55); }
  /** Degrees above horizontal, for the HUD readouts. */
  get tipDegrees() { return Math.round(-this.tip * 180 / Math.PI); }
  get boomPercent() { return Math.round((1 - this.boom) * 50); }
  update(dt: number, base: Point, instant = false) {
    this.base = base;
    const blend = instant ? 1 : 1 - Math.exp(-10 * dt);
    this.smoothBoom += (this.boom - this.smoothBoom) * blend;
    this.smoothTip += (this.tip - this.smoothTip) * blend;
    const e = this.smoothBoom, a = this.smoothTip;
    const angles = [clamp(-1.03 + e * .28, -1.32, -.6), clamp(-.55 + e * .38, -.95, -.1), clamp(-.25 + e * .4, -.7, .25), a];
    let p = { ...base };
    this.joints.length = 0;
    this.mount.setPosition(base.x, base.y + 10 * this.k);
    for (let i = 0; i < 4; i++) {
      this.joints.push({ ...p });
      this.arms[i].setPosition(p.x, p.y).setRotation(angles[i] - Math.atan2(3, 237));
      p = { x: p.x + Math.cos(angles[i]) * this.lengths[i], y: p.y + Math.sin(angles[i]) * this.lengths[i] };
    }
    this.joints.push({ ...p });
    const angle = angles[3];
    this.muzzle.setPosition(p.x, p.y).setRotation(angle - Math.atan2(8, 131));
    const outlet = Math.hypot(131, 8) * .28 * this.k;
    this.nozzle = { x: p.x + Math.cos(angle) * outlet, y: p.y + Math.sin(angle) * outlet, angle };
    const k = this.k;
    this.hose.clear().lineStyle(8 * k, 0x163d38, 1).beginPath();
    this.hose.moveTo(base.x - 7 * k, base.y + 16 * k);
    for (const j of this.joints) this.hose.lineTo(j.x - 5 * k, j.y + 12 * k);
    this.hose.strokePath();
  }
}
