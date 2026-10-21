import type { Point } from './level';

/** Kalimantan mechanism kit (src/scenes/KalimantanKit.ts). Every piece is worked by the same water drops; `after`
 * lists ids that must be done first (a locked piece ignores water and shows a padlock). Ids are shared with the
 * rest of the level (gates, rafts, bridges...), so steps and `rescue.after` can mix them freely. */

/** Smouldering peat vent: water raises its moisture, which dries back when left alone. Cooled once moisture stays
 * at or above `need` (default .84) for `hold` s (default 2); then it stays out. `inspect`: a smoke source the player
 * only has to locate (a short burst marks it). */
export interface VentDef { id: string; x: number; y: number; after?: string[]; need?: number; hold?: number; inspect?: boolean; opens?: string }
/** Sprayed control with a gauge. `set` (sluice, crank, damper): water on its + paddle (up and right of the hub) turns
 * it up, on its − paddle (down and left) down; it stays where left. `pull` (winch, pump): water pulls it up, it slackens back by `spring`/s; past
 * `snap` it overstrains and drops back. Done once it stays inside `band` for `hold` s; it then latches. */
export interface DialDef { id: string; x: number; y: number; label: string; kind: 'sluice' | 'crank' | 'damper' | 'winch' | 'pump';
  mode: 'set' | 'pull'; start?: number; band: [number, number]; hold?: number; spring?: number; snap?: number; after?: string[];
  /** Root pulse: the dial only takes water while the pulse is low (period s). */
  pulse?: number; group?: string;
  /** Gate hauled open once the dial latches. */
  opens?: string }
/** Dials balanced together: done when every one sits in its own band at once for `hold` s. */
export interface BalanceDef { id: string; dials: string[]; hold: number; after?: string[]; opens?: string }
/** Socket: done while a pushed log/boulder rests between x0 and x1; `top`: walkable there once filled. */
export interface SocketDef { id: string; x0: number; x1: number; top?: number }
/** Intake to clear: done once no log/boulder has been inside x0..x1 for 2 s. */
export interface ClearDef { id: string; x0: number; x1: number; after?: string[] }
/** Smoke or fog bank hiding what is inside until `until` is done. */
export interface FogDef { x0: number; x1: number; y0: number; y1: number; until: string; tint?: number }
/** Floating peat mat / island: bobs and sinks while unsupported; walkable at `y` once every id in `after` is done. */
export interface FloatDef { id: string; x0: number; x1: number; y: number; after: string[] }
/** Ordered valves: spray the points in the listed order; a wrong one resets the order. */
export interface SequenceDef { id: string; points: (Point & { label: string })[]; hits: number; after?: string[]; opens?: string }
/** Crane hook on a winch dial: lower it to the pickup (value >= .9), raise it to the deck (<= .1) to deliver; `drums` deliveries. */
export interface CraneDef { id: string; dial: string; x: number; top: number; bottom: number; deck: Point; drums: number }
/** Second animal rescued in the same level: walks to `flagX` once `after` is done (both must arrive). */
export interface CompanionDef { key: string; name: string; x: number; y: number; scale: number; flip?: boolean; flagX: number; after: string[] }

export interface KitDef {
  /** Mission list shown in the HUD; a step is done when all of its `need` ids are. The first unfinished one is current. */
  steps: { title: string; need: string[] }[];
  vents?: VentDef[];
  dials?: DialDef[];
  balances?: BalanceDef[];
  sockets?: SocketDef[];
  clears?: ClearDef[];
  fogs?: FogDef[];
  floats?: FloatDef[];
  sequences?: SequenceDef[];
  crane?: CraneDef;
  companion?: CompanionDef;
}
