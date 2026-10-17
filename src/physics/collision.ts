import type { Point } from '../config/level';

export interface Surface {
  body: MatterJS.BodyType;
  kind: 'terrain' | 'bridge' | 'river' | 'prop' | 'barrel' | 'wheel' | 'switch';
  enabled: boolean;
}
/** `normal` is the unit normal of the struck edge, facing back toward the segment start. */
export interface Hit { point: Point; surface: Surface; t: number; normal: Point }
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

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
    for (let i = 0; i < vertices.length; i++) {
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
