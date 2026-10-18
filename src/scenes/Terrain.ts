import Phaser from 'phaser';
import { TERRAIN_TILES, TERRAIN_STEP } from '../config/terrainTiles';
import type { TerrainStamp } from '../config/levels';
import type { Surface } from '../physics/collision';

interface Piece {
  stamp: TerrainStamp;
  /** World x of every profile sample (ascending), and the top / underside heights there (null = empty column). */
  xs: number[]; top: (number | null)[]; bottom: (number | null)[];
  drive: boolean;
}
const FILL_BOTTOM = 800;
/** Area centroid: Matter recentres fromVertices bodies on it, so the body must be placed there. */
function centroid(v: { x: number; y: number }[]) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < v.length; i++) {
    const p = v[i], q = v[(i + 1) % v.length], c = p.x * q.y - q.x * p.y;
    a += c; cx += (p.x + q.x) * c; cy += (p.y + q.y) * c;
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
}
/** Matter strips are built every this many profile samples (~24 world px at the default scale). */
const STRIP = 4;

/** Sculpted ground from earthy terrain pieces. The collision is measured from each piece's own alpha
 * (scripts/prepare_terrain.py), so water, rolling props and the truck all follow the drawn shape. */
export class Terrain {
  readonly pieces: Piece[] = [];

  constructor(private scene: Phaser.Scene, stamps: TerrainStamp[], surfaces: Surface[]) {
    for (const st of stamps) {
      const tile = TERRAIN_TILES[st.key];
      if (!tile) throw new Error(`Unknown terrain piece ${st.key}`);
      const s = st.s ?? 1.5;
      scene.add.image(st.x, st.y, `et-${st.key}`).setOrigin(0, 0).setScale(s).setFlipX(!!st.flip).setDepth(11);
      const n = tile.top.length;
      const col = (i: number) => Math.min(i * TERRAIN_STEP, tile.w - 1);
      const idx = Array.from({ length: n }, (_, i) => st.flip ? n - 1 - i : i);
      const xs = idx.map(i => st.x + (st.flip ? tile.w - 1 - col(i) : col(i)) * s);
      const top = idx.map(i => tile.top[i] < 0 ? null : st.y + tile.top[i] * s);
      const bottom = idx.map(i => tile.bottom[i] < 0 ? null : st.y + tile.bottom[i] * s);
      const piece: Piece = { stamp: st, xs, top, bottom, drive: !!(st.base || st.road) };
      this.pieces.push(piece);
      if (st.grass) this.grass(piece);
      surfaces.push(this.outline(piece));
      this.strips(piece);
    }
    this.fill();
  }

  /** Grass skin: the grass band of the forest top tile bent along the piece's top with Ropes
   * (one per tile length, so the texture repeats instead of stretching). WebGL only. */
  private grass(p: Piece) {
    const s = this.scene;
    if (s.game.renderer.type !== Phaser.WEBGL) return;
    const tex = s.textures.get('top-a');
    if (!tex.has('skin')) tex.add('skin', 0, 0, 0, 305, 46);
    const runs: { x: number; y: number }[][] = [[]];
    p.xs.forEach((x, i) => {
      const t = p.top[i];
      if (t === null) { if (runs[runs.length - 1].length) runs.push([]); return; }
      runs[runs.length - 1].push({ x, y: t + 17 });   // strip centre: grass edge sits ~6 px above the crust
    });
    for (const run of runs) {
      if (run.length < 2) continue;
      let seg: { x: number; y: number }[] = [run[0]], len = 0;
      const flush = () => {
        if (seg.length < 2) return;
        const o = seg[0];
        s.add.rope(o.x, o.y, 'top-a', 'skin', seg.map(v => ({ x: v.x - o.x, y: v.y - o.y })), true).setDepth(11.5);
      };
      for (let i = 1; i < run.length; i++) {
        len += Math.hypot(run[i].x - run[i - 1].x, run[i].y - run[i - 1].y);
        seg.push(run[i]);
        if (len >= 262) { flush(); seg = [run[i]]; len = 0; }
      }
      flush();
    }
  }

  /** Water collision: one concave outline per piece (top edge left to right, underside back). */
  private outline(p: Piece): Surface {
    const pts: { x: number; y: number }[] = [];
    p.xs.forEach((x, i) => { if (p.top[i] !== null) pts.push({ x, y: p.top[i]! }); });
    for (let i = p.xs.length - 1; i >= 0; i--) if (p.bottom[i] !== null) pts.push({ x: p.xs[i], y: p.bottom[i]! });
    const xs = pts.map(v => v.x), ys = pts.map(v => v.y);
    const bounds = { min: { x: Math.min(...xs), y: Math.min(...ys) }, max: { x: Math.max(...xs), y: Math.max(...ys) } };
    // firstHit only reads vertices and bounds, so the outline needs no (convex-only) Matter body.
    const body = { vertices: pts, bounds, position: { x: (bounds.min.x + bounds.max.x) / 2, y: (bounds.min.y + bounds.max.y) / 2 } } as unknown as MatterJS.BodyType;
    return { body, kind: 'terrain', enabled: true };
  }

  /** Physics for props: static convex strips (vertical sides) following the top and underside. */
  private strips(p: Piece) {
    const M = this.scene.matter;
    for (let i = 0; i < p.xs.length - 1; i += STRIP) {
      const j = Math.min(i + STRIP, p.xs.length - 1);
      const [t0, t1, b0, b1] = [p.top[i], p.top[j], p.bottom[i], p.bottom[j]];
      if (t0 === null || t1 === null || b0 === null || b1 === null || b0 - t0 < 4 || b1 - t1 < 4) continue;
      const verts = [{ x: p.xs[i], y: t0 }, { x: p.xs[j], y: t1 }, { x: p.xs[j], y: b1 }, { x: p.xs[i], y: b0 }];
      const c = centroid(verts);
      M.add.fromVertices(c.x, c.y, verts, { isStatic: true, label: 'terrain', friction: .5 });
    }
  }

  /** Rock mass below `base` pieces, from inside each piece down past the river, as one canvas texture. */
  private fill() {
    const base = this.pieces.filter(p => p.stamp.base);
    if (!base.length) return;
    const key = 'terrain-fill', tex = this.scene.textures;
    const x0 = Math.floor(Math.min(...base.map(p => p.xs[0]))), x1 = Math.ceil(Math.max(...base.map(p => p.xs[p.xs.length - 1])));
    const y0 = Math.floor(Math.min(...base.flatMap(p => p.top.filter((v): v is number => v !== null))));
    if (tex.exists(key)) tex.remove(key);
    const canvas = tex.createCanvas(key, x1 - x0, FILL_BOTTOM - y0)!;
    const ctx = canvas.getContext();
    ctx.beginPath();
    for (const p of base) {
      // Start a little inside the piece so the fill tucks under its crust.
      let first = true;
      p.xs.forEach((x, i) => {
        const t = p.top[i], b = p.bottom[i];
        if (t === null || b === null) return;
        const y = t + (b - t) * .55 - y0;
        if (first) { ctx.moveTo(x - x0, FILL_BOTTOM - y0); first = false; }
        ctx.lineTo(x - x0, y);
      });
      ctx.lineTo(p.xs[p.xs.length - 1] - x0, FILL_BOTTOM - y0);
      ctx.closePath();
    }
    const img = tex.get('et-fill').getSourceImage() as HTMLImageElement;
    ctx.fillStyle = ctx.createPattern(img, 'repeat')!;
    ctx.fill();
    // Darken with depth so the lit crust pieces stay in front.
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, 0, 0, FILL_BOTTOM - y0);
    g.addColorStop(0, 'rgba(30,18,8,0.05)'); g.addColorStop(1, 'rgba(30,18,8,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, x1 - x0, FILL_BOTTOM - y0);
    canvas.refresh();
    this.scene.add.image(x0, y0, key).setOrigin(0, 0).setDepth(10);
  }

  private static at(p: Piece, x: number, arr: (number | null)[]) {
    const xs = p.xs;
    if (x < xs[0] || x > xs[xs.length - 1]) return null;
    let i = 0;
    while (i < xs.length - 2 && xs[i + 1] < x) i++;
    const a = arr[i], b = arr[i + 1];
    if (a === null || b === null) return a ?? b;
    return a + (b - a) * ((x - xs[i]) / (xs[i + 1] - xs[i] || 1));
  }
  /** Highest drivable top at x, or null when no drivable piece covers x. */
  topAt(x: number) {
    let top: number | null = null;
    for (const p of this.pieces) {
      if (!p.drive) continue;
      const t = Terrain.at(p, x, p.top);
      if (t !== null && (top === null || t < top)) top = t;
    }
    return top;
  }
  /** Lowest underside of a ledge hanging above `ground` at x (-Infinity if none). */
  ceilingAt(x: number, ground: number) {
    let c = -Infinity;
    for (const p of this.pieces) {
      if (p.drive) continue;
      const b = Terrain.at(p, x, p.bottom);
      if (b !== null && b < ground) c = Math.max(c, b);
    }
    return c;
  }
}
