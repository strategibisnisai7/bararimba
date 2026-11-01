import Phaser from 'phaser';
import type { PapuaDef } from '../config/papuaLevels';
import type { Surface } from '../physics/collision';
import type { World } from './World';
import type { Focus } from './KalimantanKit';

export class PapuaWorld {
  private g: Phaser.GameObjects.Graphics;
  private marker: Phaser.GameObjects.Graphics;
  private t = 0;
  private phase: 'roof' | 'lift' | 'ferry' | 'rescue' = 'roof';
  onEvent?: (message: string) => void;

  constructor(scene: Phaser.Scene, private world: World, readonly def: PapuaDef) {
    this.g = scene.add.graphics().setDepth(21);
    this.marker = scene.add.graphics().setDepth(46);
    this.draw();
  }

  waterHit(_surface: Surface) {
    return false;
  }

  get hint() {
    if (this.phase === 'roof') return '01 · ATAP BERLANTAI: Semprot balok es di atap agar meluncur menekan tombol merah pembuka gerbang lantai 2!';
    if (this.phase === 'lift') return '02 · LIFT TEBING GUA: Kemudikan truk masuk ke platform lift, semprot ember hidrolik untuk turun ke danau!';
    if (this.phase === 'ferry') return '03 · FERI DANAU: Naikkan truk ke atas perahu feri, semprot buritan/dayung untuk berlayar menyeberang!';
    return '04 · EVAKUASI: Padamkan api di desa Honai untuk menyelamatkan Rangkong Papua!';
  }

  focus(): Focus | null {
    if (this.phase === 'roof') {
      const p = this.world.props.find(pr => pr.kind === 'ice-block' && pr.body.position.y < 230);
      if (p) return { x: p.body.position.x, y: p.body.position.y, how: 'spray', what: 'papua-ice' };
      return { x: 940, y: 170, how: 'spray', what: 'papua-ice' };
    }
    if (this.phase === 'lift' && this.world.lift) {
      return { x: this.world.lift.bucket.x, y: this.world.lift.bucket.y, how: 'spray', what: 'papua-lift' };
    }
    if (this.phase === 'ferry' && this.world.ferry) {
      return { x: this.world.ferry.x - 70, y: this.world.ferry.y, how: 'spray', what: 'papua-ferry' };
    }
    return null;
  }

  surfaceAt(_x: number) {
    return null;
  }

  status() {
    return {
      phase: this.phase,
      gateOpen: this.world.lever?.pressed ?? false,
      liftDescended: this.world.lift ? Math.abs(this.world.lift.currentY - this.world.lift.y1) <= 10 : false,
      ferryDocked: this.world.ferry ? this.world.ferry.x >= this.world.ferry.x1 - 20 : false,
    };
  }

  update(dt: number) {
    this.t += dt;
    // Advance phases based on actual physics world state
    if (this.phase === 'roof' && this.world.lever?.pressed) {
      this.phase = 'lift';
      this.onEvent?.('Pintu gerbang lantai 2 terbuka! Kemudikan truk ke lift hidrolik di ujung tebing.');
    } else if (this.phase === 'lift' && this.world.lift && Math.abs(this.world.lift.currentY - this.world.lift.y1) <= 10) {
      this.phase = 'ferry';
      this.onEvent?.('Lift tiba di tepi danau! Naikkan mobil pemadam ke atas kapal feri.');
    } else if (this.phase === 'ferry' && this.world.ferry && this.world.ferry.x >= this.world.ferry.x1 - 20) {
      this.phase = 'rescue';
      this.onEvent?.('Feri bersandar di seberang! Padamkan api desa Honai untuk menyelamatkan Rangkong Papua.');
    }
    this.draw();
  }

  private draw() {
    const m = this.marker.clear(), f = this.focus();
    if (f) {
      const y = f.y - 64 + Math.sin(this.t * 4) * 5;
      m.fillStyle(0xa8fff0).fillTriangle(f.x - 9, y - 12, f.x + 9, y - 12, f.x, y);
    }
  }
}
