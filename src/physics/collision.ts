import type { Point } from '../config/level';

export interface Surface {
  body: MatterJS.BodyType;
  /** ramp: water skims along it and flies off its end instead of landing. mirror: water bounces off it (Sumatra
   * reflector panel). raft / handle: Sumatra mechanisms that take the push and swallow the drop. */
  kind: 'terrain' | 'bridge' | 'river' | 'prop' | 'barrel' | 'wheel' | 'switch' | 'ramp' | 'raft' | 'mirror' | 'handle';
  enabled: boolean;
}
/** `normal` is the unit normal of the struck edge, facing back toward the segment start. */
export interface Hit { point: Point; surface: Surface; t: number; normal: Point }
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

const BUCKET = 32;
type Indexed = MatterJS.BodyType & { __edges?: Map<number, number[]> };
/** Edges of a long static outline grouped by 32 px column, so a short ray tests only nearby edges. */
function edgeIndex(body: Indexed) {
  if (body.__edges) return body.__edges;
  const m = new Map<number, number[]>(), v = body.vertices ?? [];
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length];
    for (let k = Math.floor(Math.min(a.x, b.x) / BUCKET); k <= Math.floor(Math.max(a.x, b.x) / BUCKET); k++) {
      let list = m.get(k); if (!list) m.set(k, list = []); list.push(i);
    }
  }
  return body.__edges = m;
}

/** Swept segment against the SAME Matter body vertices used by the level.
 * No second physics world; static bodies need no integration. Earliest hit wins.
 */
export function firstHit(from: Point, to: Point, surfaces: Surface[]): Hit | null {
  const delta = { x: to.x - from.x, y: to.y - from.y };
  let hit: Hit | null = null;
  for (const surface of surfaces) {
    if (!surface.enabled) continue;
    const { bounds, vertices } = surface.body;
    if (!vertices) continue;
    if (Math.max(from.x, to.x) < bounds.min.x || Math.min(from.x, to.x) > bounds.max.x ||
        Math.max(from.y, to.y) < bounds.min.y || Math.min(from.y, to.y) > bounds.max.y) continue;
    // Sculpted terrain outlines are long and never move: only test the edges near the ray.
    let edges: number[] | null = null;
    if (surface.kind === 'terrain' && vertices.length > 16) {
      const idx = edgeIndex(surface.body as Indexed), k0 = Math.floor(Math.min(from.x, to.x) / BUCKET), k1 = Math.floor(Math.max(from.x, to.x) / BUCKET);
      edges = k0 === k1 ? (idx.get(k0) ?? []) : Array.from({ length: k1 - k0 + 1 }, (_, j) => idx.get(k0 + j) ?? []).flat();
    }
    const count = edges ? edges.length : vertices.length;
    for (let e = 0; e < count; e++) {
      const i = edges ? edges[e] : e;
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      const edge = { x: b.x - a.x, y: b.y - a.y };
      const offset = { x: a.x - from.x, y: a.y - from.y };
      const denominator = cross(delta, edge);
      if (Math.abs(denominator) < 1e-8) continue;
      const t = cross(offset, edge) / denominator;
      const u = cross(offset, delta) / denominator;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1 && (!hit || t < hit.t)) {
        const len = Math.hypot(edge.x, edge.y) || 1;
        let normal = { x: edge.y / len, y: -edge.x / len };
        if (normal.x * delta.x + normal.y * delta.y > 0) normal = { x: -normal.x, y: -normal.y };
        hit = { point: { x: from.x + delta.x * t, y: from.y + delta.y * t }, surface, t, normal };
      }
    }
  }
  return hit;
}
