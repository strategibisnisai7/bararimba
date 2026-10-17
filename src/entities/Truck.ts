import Phaser from 'phaser';
import { TRUCK_SCALE, clamp, type Point } from '../config/level';
import { Cannon } from './Cannon';
import type { Effects } from '../systems/Effects';

// Hub centres measured on the 638x318 truck crop (sheet 1, rect 17,51). Tyre radius 59 px.
const WHEELS = [120.5, 249, 462.5];
const WHEEL_Y = 257.5, WHEEL_R = 59;
// The wheel crop's hub is at (68.8,71.8), not its geometric centre; hub-to-tread is 63.2 px.
const WHEEL_HUB = { x: 68.8 / 138, y: 71.8 / 136 }, WHEEL_SRC_R = 63.2;
const MOUNT = { x: -33, y: -331 };     // cannon pivot relative to the sprite's bottom-centre origin

export class Truck {
  x: number;
  y = 0;
  v = 0;
  angle = 0;
  readonly cannon: Cannon;
  private body: Phaser.GameObjects.Image;
  private wheels: Phaser.GameObjects.Image[];
  private shadow: Phaser.GameObjects.Ellipse;
  private spin = 0;
  private dustT = 0;
  private bob = 0;
  readonly halfLength = 638 * TRUCK_SCALE / 2;

  constructor(scene: Phaser.Scene, x: number, private effects: Effects) {
    this.x = x;
    this.shadow = scene.add.ellipse(x, 0, 300, 18, 0x153925, .3).setDepth(19);
    this.body = scene.add.image(x, 0, 'truck').setOrigin(.5, 1).setScale(TRUCK_SCALE).setDepth(23);
    this.wheels = WHEELS.map(() => scene.add.image(0, 0, 'wheel').setOrigin(WHEEL_HUB.x, WHEEL_HUB.y).setScale(WHEEL_R / WHEEL_SRC_R * TRUCK_SCALE).setDepth(24));
    this.cannon = new Cannon(scene, TRUCK_SCALE / .48);
  }
  local(px: number, py: number): Point {
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    const lx = px * TRUCK_SCALE, ly = py * TRUCK_SCALE;
    return { x: this.x + lx * c - ly * s, y: this.y + this.bob + lx * s + ly * c };
  }
  update(dt: number, drive: number, min: number, max: number, groundY: (x: number) => number, instant = false) {
    const target = drive * 190;
    const accel = drive === 0 ? 520 : Math.sign(drive) !== Math.sign(this.v) && Math.abs(this.v) > 5 ? 800 : 320;
    this.v += clamp(target - this.v, -accel * dt, accel * dt);
    const nx = clamp(this.x + this.v * dt, min, max);
    if (nx !== this.x + this.v * dt) this.v = 0;
    this.x = nx;
    const rear = groundY(this.x - this.halfLength * .62), front = groundY(this.x + this.halfLength * .62);
    const goalAngle = Math.atan2(front - rear, this.halfLength * 1.24);
    this.angle += (goalAngle - this.angle) * (instant ? 1 : Math.min(1, dt * 8));
    this.y = (rear + front) / 2;
    const moving = Math.abs(this.v) > 8;
    this.bob = moving ? Math.sin(performance.now() / 55) * .9 : 0;
    this.spin += this.v * dt / (WHEEL_R * TRUCK_SCALE);
    this.body.setPosition(this.x, this.y + this.bob).setRotation(this.angle);
    WHEELS.forEach((wx, i) => {
      const p = this.local(wx - 319, WHEEL_Y - 318);
      this.wheels[i].setPosition(p.x, p.y - this.bob).setRotation(this.spin + this.angle);
    });
    this.shadow.setPosition(this.x, this.y + 2);
    if (moving) {
      this.dustT += dt;
      if (this.dustT > .07) {
        this.dustT = 0;
        const back = this.local(this.v > 0 ? WHEELS[0] - 319 - 40 : WHEELS[2] - 319 + 40, 0);
        this.effects.dust(back.x, back.y - 4);
      }
    }
    this.cannon.update(dt, this.local(MOUNT.x, MOUNT.y), instant);
  }
  get front() { return this.x + this.halfLength; }
}
