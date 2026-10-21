/** Data-driven levels. World units: x right, y down; ground "top" is the walkable surface. */
export interface Land { x0: number; x1: number; top: number; style?: 'grass' | 'pillar' }
export interface Bridge { x0: number; x1: number; y: number }
/** `max` caps a fire's size: the fire that creeps toward the animal stays small and slow. */
export interface FireDef { x: number; y: number; start: number; growth: number; lit: boolean; max?: number }
export interface PropDef { kind: 'crate' | 'crate-plain' | 'boulder' | 'log'; x: number; y: number }
/** `back`: drawn behind the terrain (tall ruins standing in the background). */
export interface Decor { key: string; x: number; y: number; scale: number; flip?: boolean; fuel?: number; back?: boolean }
/** `door`: the crate is swung by spraying it, flies off at the top of its swing and blasts that gate open. */
export interface HangDef { anchorX: number; anchorY: number; rope: number; postX: number; groundY: number; load?: 'barrel' | 'crate'; door?: string }
/** One earthy terrain piece. (x, y) is its top-left corner in world px, `s` its scale (default 1.5).
 * `base`: solid rock fills from the piece down past the river and the truck can drive on it;
 * `road`: drivable without the fill (a span over water). Other pieces are ledges/overhangs. */
export interface TerrainStamp { key: string; x: number; y: number; s?: number; flip?: boolean; base?: boolean; road?: boolean; grass?: boolean }
/** `frames`: extra poses cycled while the animal walks to the rescue flag (Sumatra). */
export interface AnimalDef { key: string; name: string; x: number; y: number; scale: number; flip?: boolean; frames?: string[] }
import type { BossDef } from '../entities/Boss';
import { SUMATRA_LEVELS, type SumatraDef } from './sumatraLevels';
import { KALIMANTAN_LEVELS } from './kalimantanLevels';
export type Theme = 'forest' | 'ruins' | 'volcanic' | 'cave' | 'peat';
export interface LevelDef {
  id: number; code: string; name: string; width: number;
  /** Visual tile set; gameplay is unchanged. */
  theme?: Theme;
  /** Campaign region (default Jawa). */
  region?: RegionId;
  /** Sumatra mechanisms and the walk-to-flag rescue (src/scenes/Sumatra.ts). */
  sm?: SumatraDef;
  supply: number; waterBudget: number; burnRate: number; spreadDelay: number;
  truckX: number; driveMin: number;
  /** Furthest the truck may drive (keeps it on the starting hill when floating rock hangs ahead). */
  driveMax?: number;
  lands: Land[]; bridges: Bridge[];
  /** Sculpted terrain from earthy pieces: slopes, valleys and ledges that water runs along. */
  terrain?: TerrainStamp[]; fires: FireDef[]; props: PropDef[]; decor: Decor[];
  hang?: HangDef; refill?: { x: number; half: number };
  /** River gap the truck cannot cross until `need` pushed logs float into it as a raft. */
  floatGap?: { x0: number; x1: number; need: number };
  /** Water wheel: spraying it spins it, and while it turns the trough pours water from `out`. */
  /** Water basin: fill it so the boulder floats up, overflows onto the ledge and presses the button,
   * which opens the cage holding the animal. */
  basin?: { x0: number; x1: number; floor: number; lip: number; boulder: { x: number; r: number }; stone?: boolean;
    button: { x: number; y: number }; cage: { x: number; y: number } };
  /** Seesaw catapult: a boulder pushed off the floating ledge above slams the raised end, flinging the water barrel toward `target`. */
  seesaw?: { x: number; y: number; target: { x: number; y: number } };
  /** Static rock slabs (cave ceilings, overhangs); `stone`: cut temple blocks instead of grassy earth. */
  rocks?: { x0: number; x1: number; y0: number; y1: number; stone?: boolean }[];
  /** Wooden ramp planks hinged at (x0, y0): a water jet skims along them and flies off the far end.
   * `drops`: when that gate opens the plank swings down to the mirrored angle. */
  ramps?: { x0: number; y0: number; x1: number; y1: number; drops?: string }[];
  /** Pressure switch: a pushed boulder resting on the button opens the cage. */
  lever?: { button: { x: number; y: number }; cage: { x: number; y: number } };
  /** Region boss: throws fireballs and a flame stream; defeat it to win. */
  boss?: BossDef & { waterfall?: { x: number; y: number; w: number } };
  wheel?: { x: number; y: number; r: number; out?: { x: number; y: number; vx: number } };
  /** Wooden gates (vertical walls) opened by switches. */
  /** `stone`: a carved cave door (Sumatra) instead of the wooden barricade. `mud`: a mud bank that water erodes
   * away, `need` hits to wash it off. */
  gates?: { id: string; x: number; y0: number; y1: number; style?: 'stone' | 'mud'; need?: number }[];
  /** target: hit with water; button: pressed by a prop or dropped crate; wheel: spin the water wheel. */
  switches?: { kind: 'target' | 'button' | 'wheel'; x: number; y: number; opens: string; need?: number }[];
  /** Raised water tanks held by a stone plug (push it off) or a gate; released water floods downhill. */
  reservoirs?: { x0: number; x1: number; floor: number; depth: number; plug?: { r: number }; gate?: string; out: { x: number; y: number; vx: number }; amount: number }[];
  animal: AnimalDef; tutorial: number[]; brief: string;
}

export type RegionId = 'jawa' | 'sumatra' | 'kalimantan';
/** Level ids `first`..`first + total - 1` belong to the region; tile `boss` is its boss level, `midBoss` a second one. */
export interface RegionDef { id: RegionId; name: string; subtitle: string; first: number; total: number; boss: number; midBoss?: number; forest: string }
export const REGIONS: Record<RegionId, RegionDef> = {
  jawa: { id: 'jawa', name: 'JAWA', subtitle: 'Hutan Pegunungan', first: 1, total: 15, boss: 15, forest: 'Hutan Jawa' },
  sumatra: { id: 'sumatra', name: 'SUMATRA', subtitle: 'Goa Karst & Hutan Hujan', first: 16, total: 20, boss: 35, forest: 'Goa Sumatra' },
  kalimantan: { id: 'kalimantan', name: 'KALIMANTAN', subtitle: 'Hutan Gambut & Sungai Hitam', first: 36, total: 30, boss: 65, midBoss: 50, forest: 'Rawa Gambut Kalimantan' },
};
export const REGION = REGIONS.jawa;
export const regionOf = (def: LevelDef) => REGIONS[def.region ?? 'jawa'];

const JAWA_LEVELS: LevelDef[] = [
  {
    id: 1, code: '1-1', name: 'Api di Jembatan', width: 2480,
    supply: 100, waterBudget: 55, burnRate: .3, spreadDelay: 16,
    truckX: 230, driveMin: 160,
    lands: [{ x0: -80, x1: 600, top: 548 }, { x0: 1230, x1: 1960, top: 548 }, { x0: 1950, x1: 2600, top: 430 }],
    bridges: [{ x0: 588, x1: 880, y: 540 }, { x0: 980, x1: 1242, y: 540 }],
    floatGap: { x0: 880, x1: 980, need: 1 },
    fires: [
      { x: 1080, y: 540, start: .55, growth: .0050, lit: true },
      { x: 1480, y: 548, start: .5, growth: .0060, lit: true },
      { x: 2075, y: 430, start: .65, growth: .0070, lit: true },
      { x: 1665, y: 548, start: .5, growth: .0075, lit: false },
      { x: 2235, y: 430, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'crate', x: 835, y: 504 }],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1.05 },
      { key: 'tree-flower', x: 1665, y: 556, scale: .85, fuel: 3 },
      { key: 'tree-small', x: 2235, y: 438, scale: .75, fuel: 4 },
      { key: 'tree-c', x: 2470, y: 440, scale: .8 },
      { key: 'stump', x: 1350, y: 556, scale: .45 },
    ],
    animal: { key: 'rusa', name: 'Rusa Timor', x: 2380, y: 430, scale: .62, flip: true },
    tutorial: [1, 2, 3, 4, 6], brief: 'Jembatan berlubang! Semprot peti sampai jatuh ke lubang — peti mengapung jadi pijakan truk. Lalu padamkan api dan selamatkan rusa.',
  },
  {
    // A curved cliff hides the valley: lob over its crest or spin the wheel on top; either way the water
    // runs down the far slope and pools on the fires in the hollow.
    id: 2, code: '1-2', name: 'Api di Balik Tebing', width: 2350,
    supply: 100, waterBudget: 65, burnRate: .36, spreadDelay: 15,
    truckX: 230, driveMin: 160,
    lands: [], bridges: [],
    terrain: [
      { key: 'flat-thick', x: -80, y: 548, base: true },
      { key: 'wave', x: 440, y: 538, base: true },
      { key: 'quarter', x: 1000, y: 230, base: true },
      { key: 'curve-up', x: 1300, y: 225, flip: true, base: true },
      { key: 'valley', x: 1620, y: 390, base: true },
      { key: 'flat-b', x: 2000, y: 402, base: true },
    ],
    fires: [
      { x: 1480, y: 355, start: .55, growth: .0055, lit: true },
      { x: 1720, y: 394, start: .55, growth: .0060, lit: true },
      { x: 1870, y: 450, start: .6, growth: .0060, lit: true },
      { x: 2120, y: 404, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 556, scale: 1 },
      { key: 'tree-small', x: 2120, y: 412, scale: .7, fuel: 3 },
      { key: 'tree-a', x: 2320, y: 412, scale: .85 },
    ],
    wheel: { x: 1290, y: 178, r: 52, out: { x: 1342, y: 200, vx: 95 } },
    animal: { key: 'rangkong', name: 'Rangkong', x: 2240, y: 404, scale: .62, flip: true },
    tutorial: [3, 6], brief: 'Api tersembunyi di lembah balik tebing. Lob air melewati puncak — air akan mengalir menuruni lereng ke api. Semprot kincir di puncak agar ikut menuang air.',
  },
  {
    // Reference "Colorful Cartoon Water Puzzle Level": bridge, ledge with boulder and ramp plank, the
    // red button below, a grassy chute over the fire and a wooden post that holds the water back.
    id: 3, code: '1-3', name: 'Lembah Berliku', width: 2000,
    supply: 100, waterBudget: 70, burnRate: .42, spreadDelay: 14,
    truckX: 230, driveMin: 160,
    lands: [], bridges: [{ x0: 335, x1: 615, y: 538 }],
    terrain: [
      { key: 'flat-a', x: -110, y: 548, base: true, grass: true },
      { key: 'block-tall', x: 598, y: 482, s: 2.7, base: true, grass: true },
      { key: 'float-drip', x: 588, y: 368, s: 1.63, grass: true },
      { key: 'flat-c', x: 850, y: 614, base: true, grass: true },
      { key: 'ramp', x: 1262, y: 612, s: 1.2, flip: true, base: true, grass: true },
      { key: 'flat-b', x: 1530, y: 680, base: true, grass: true },
      { key: 'ramp', x: 1290, y: 150, s: 2.1, grass: true },
    ],
    rocks: [{ x0: 600, x1: 662, y0: 300, y1: 372, stone: true }],
    ramps: [{ x0: 936, y0: 386, x1: 1242, y1: 194, drops: 'post' }],
    gates: [{ id: 'post', x: 1360, y0: 377, y1: 640 }],
    switches: [{ kind: 'button', x: 950, y: 616, opens: 'post' }],
    fires: [
      { x: 1120, y: 614, start: .5, growth: .0050, lit: true },
      { x: 1500, y: 672, start: .6, growth: .0060, lit: true, max: 1.1 },
      { x: 1640, y: 682, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'boulder', x: 860, y: 326 }],
    decor: [
      { key: 'tree-a', x: 40, y: 556, scale: 1 },
      { key: 'tree-small', x: 1640, y: 690, scale: .65, fuel: 2 },
      { key: 'tree-c', x: 1960, y: 690, scale: .85 },
    ],
    animal: { key: 'orangutan', name: 'Orangutan', x: 1790, y: 682, scale: .6, flip: true },
    tutorial: [4, 5, 6], brief: 'Api tersembunyi di bawah talang rumput dan tertahan tiang kayu. Dorong batu dari tebing ke tombol merah agar tiang terbuka, lalu semprot papan miring — air meluncur ke talang dan mengalir ke api.',
  },
  {
    // Reference "Jungle Ruins Waterfall Puzzle": stone pool split by a tall tower. Same mission as before:
    // fill the pool until the boulder floats over the lip onto the button; the overflow runs down to the fires.
    id: 4, code: '1-4', name: 'Batu Apung', width: 2600,
    supply: 100, waterBudget: 75, burnRate: .36, spreadDelay: 15,
    truckX: 230, driveMin: 160,
    lands: [], bridges: [],
    terrain: [
      { key: 'flat-thick', x: -80, y: 548, base: true, grass: true },
      { key: 'ramp', x: 1640, y: 525, flip: true, base: true, grass: true },
      { key: 'flat-b', x: 1950, y: 620, base: true, grass: true },
      { key: 'flat-short', x: 1500, y: 120, s: 1.6, grass: true },
    ],
    rocks: [
      { x0: 476, x1: 558, y0: 538, y1: 720, stone: true },
      { x0: 476, x1: 1650, y0: 643, y1: 720, stone: true },
      { x0: 1002, x1: 1218, y0: -120, y1: 643, stone: true },
      { x0: 1578, x1: 1650, y0: 538, y1: 720, stone: true },
      { x0: 1880, x1: 2300, y0: 300, y1: 352, stone: true },
    ],
    basin: { x0: 558, x1: 1578, floor: 643, lip: 538, stone: true, boulder: { x: 1400, r: 32 }, button: { x: 1690, y: 544 }, cage: { x: 2420, y: 621 } },
    fires: [
      { x: 1800, y: 588, start: .55, growth: .0055, lit: true },
      { x: 2020, y: 621, start: .55, growth: .0060, lit: true },
      { x: 2180, y: 621, start: .6, growth: .0060, lit: true },
      { x: 2300, y: 621, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 556, scale: 1 },
      { key: 'tree-small', x: 2300, y: 629, scale: .6, fuel: 3 },
      { key: 'tree-a', x: 2560, y: 629, scale: .85 },
    ],
    refill: { x: 300, half: 80 },
    animal: { key: 'beruang', name: 'Beruang Madu', x: 2420, y: 621, scale: .58, flip: true },
    tutorial: [5, 6], brief: 'Beruang madu terkurung! Isi kolam batu dengan air — semprot langsung atau ke menara agar menjadi air terjun. Batu mengapung ke tombol merah dan luapan air mengalir ke api.',
  },
  {
    // Reference "Colorful Cartoon Water Rescue Level": the truck stays on the left hill; a curled rock with
    // a pocket opening toward it (shoot flat through the mouth), a valley whose pooled water spills over its
    // right rim down to the lower ledge, and a high ledge on the right cliff for a long lob.
    id: 5, code: '1-5', name: 'Lembah Penyelamat', width: 1500,
    supply: 100, waterBudget: 75, burnRate: .4, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 260,
    lands: [], bridges: [],
    terrain: [
      { key: 'flat-a', x: -110, y: 548, base: true, grass: true },
      { key: 'wave', x: 275, y: 574, s: 1.83, base: true, grass: true },
      { key: 'flat-b', x: 1140, y: 628, base: true, grass: true },
      { key: 'overhang', x: 470, y: 145, s: 1.6, grass: true },
      { key: 'float-drip', x: 640, y: 381, s: 1.8, grass: true },
      { key: 'block-tall', x: 900, y: 230, s: 1.6, grass: true },
      { key: 'flat-short', x: 1159, y: 399, s: 1.67, grass: true },
    ],
    rocks: [{ x0: 1400, x1: 1446, y0: 490, y1: 630, stone: true }],
    fires: [
      { x: 540, y: 146, start: .5, growth: .0050, lit: true },
      { x: 820, y: 383, start: .5, growth: .0050, lit: true, max: .7 },
      { x: 1250, y: 401, start: .55, growth: .0055, lit: true },
      { x: 1300, y: 630, start: .55, growth: .0055, lit: true, max: .9 },
      { x: 1360, y: 630, start: .3, growth: .0030, lit: false, max: .7 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 40, y: 556, scale: 1 },
      { key: 'tree-small', x: 1360, y: 638, scale: .5, fuel: 4 },
    ],
    animal: { key: 'bekantan', name: 'Bekantan', x: 1440, y: 630, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Satwa terjebak di tebing! Lob air ke puncak batu melengkung dan tebing kanan, tembak datar ke celah batu, lalu isi lembah sampai airnya meluap ke api di bawah.',
  },
  {
    // Swing the crate into the cave door; the cave floor slopes down, so water sprayed in runs deep inside.
    id: 6, code: '1-6', name: 'Gua Sempit', width: 2450,
    supply: 100, waterBudget: 70, burnRate: .4, spreadDelay: 15,
    truckX: 230, driveMin: 160,
    lands: [], bridges: [],
    terrain: [
      { key: 'flat-thick', x: -80, y: 548, base: true },
      { key: 'flat-b', x: 440, y: 546, base: true },
      { key: 'ramp', x: 1095, y: 455, flip: true, base: true },
      { key: 'flat-long', x: 1420, y: 545, base: true },
      { key: 'flat-thick', x: 1180, y: 260 },
      { key: 'flat-thick', x: 1700, y: 262 },
      { key: 'flat-b', x: 2050, y: 258 },
    ],
    hang: { anchorX: 1040, anchorY: 300, rope: 90, postX: 1110, groundY: 457, load: 'crate', door: 'cave' },
    gates: [{ id: 'cave', x: 1212, y0: 366, y1: 492 }],
    fires: [
      { x: 1330, y: 528, start: .4, growth: .0040, lit: true, max: .6 },
      { x: 1560, y: 550, start: .45, growth: .0045, lit: true, max: .7 },
      { x: 1760, y: 563, start: .45, growth: .0045, lit: true, max: .7 },
      { x: 1960, y: 563, start: .3, growth: .0030, lit: false, max: .6 },
    ],
    props: [],
    decor: [
      { key: 'tree-a', x: 60, y: 556, scale: 1 },
      { key: 'tree-small', x: 1960, y: 571, scale: .55, fuel: 3 },
    ],
    animal: { key: 'trenggiling', name: 'Trenggiling', x: 2120, y: 563, scale: .7, flip: true },
    tutorial: [3, 5, 6], brief: 'Trenggiling terjebak di gua berpintu kayu. Semprot peti gantung sampai berayun tinggi — peti terlempar dan meledakkan pintu. Lantai gua menurun: semprot ke mulut gua dan air mengalir ke api di dalam.',
  },
  {
    // Raft over the river, rolling hills, then wash the hilltop boulder down the slope into the button pocket.
    id: 7, code: '1-7', name: 'Puncak Rimba', width: 3200, theme: 'ruins',
    supply: 100, waterBudget: 90, burnRate: .45, spreadDelay: 14,
    truckX: 230, driveMin: 160,
    lands: [], bridges: [],
    terrain: [
      { key: 'flat-thick', x: -80, y: 548, base: true },
      { key: 'flat-d', x: 440, y: 546, base: true },
      { key: 'wave', x: 1035, y: 538, base: true },
      { key: 'curve-up', x: 1700, y: 398, base: true },
      { key: 'mound', x: 2020, y: 398, base: true },
      { key: 'ramp', x: 2310, y: 468, flip: true, base: true },
      { key: 'u-small', x: 2630, y: 538, base: true },
      { key: 'flat-b', x: 2910, y: 538, base: true },
    ],
    floatGap: { x0: 930, x1: 1040, need: 1 },
    lever: { button: { x: 2777, y: 607 }, cage: { x: 3030, y: 539 } },
    fires: [
      { x: 1200, y: 545, start: .5, growth: .0055, lit: true },
      { x: 1390, y: 581, start: .55, growth: .0060, lit: true },
      { x: 2430, y: 505, start: .65, growth: .0065, lit: true },
      { x: 2540, y: 548, start: .65, growth: .0065, lit: true },
      { x: 2610, y: 556, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'crate', x: 850, y: 514 }, { kind: 'boulder', x: 2090, y: 356 }],
    decor: [
      { key: 'tree-b', x: 70, y: 556, scale: 1 },
      { key: 'tree-small', x: 2610, y: 564, scale: .6, fuel: 4 },
      { key: 'tree-c', x: 3150, y: 546, scale: .85 },
    ],
    animal: { key: 'gajah', name: 'Gajah Sumatra', x: 3030, y: 539, scale: .62, flip: true },
    tutorial: [4, 5, 6], brief: 'Ujian terakhir: buat pijakan peti, padamkan api di bukit, lalu semprot batu di puncak bukit sampai menggelinding menuruni lereng ke tombol merah untuk membuka kandang gajah.',
  },
  {
    // Target behind a narrow slit opens the temple gate; fires burn inside a roofed courtyard.
    id: 8, code: '1-8', name: 'Gerbang Candi', width: 2400, theme: 'ruins',
    supply: 100, waterBudget: 75, burnRate: .38, spreadDelay: 15,
    truckX: 230, driveMin: 160,
    lands: [{ x0: -80, x1: 2500, top: 548 }],
    bridges: [],
    rocks: [
      { x0: 380, x1: 540, y0: 330, y1: 372 },
      { x0: 960, x1: 1180, y0: 110, y1: 176 },
      { x0: 960, x1: 1180, y0: 240, y1: 300 },
      { x0: 1180, x1: 1310, y0: 70, y1: 174 },
      { x0: 1180, x1: 1820, y0: 240, y1: 300 },
    ],
    gates: [{ id: 'g1', x: 1200, y0: 300, y1: 548 }],
    switches: [{ kind: 'target', x: 1222, y: 214, opens: 'g1' }],
    fires: [
      { x: 460, y: 330, start: .45, growth: .0045, lit: true },
      { x: 760, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1360, y: 548, start: .5, growth: .0050, lit: true, max: .75 },
      { x: 1520, y: 548, start: .55, growth: .0055, lit: true, max: .75 },
      { x: 1680, y: 548, start: .55, growth: .0055, lit: true, max: .75 },
      { x: 1980, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 420, y: 336, scale: .42 },
      { key: 'tree-small', x: 1980, y: 556, scale: .7, fuel: 5 },
      { key: 'tree-c', x: 2330, y: 560, scale: .85 },
    ],
    animal: { key: 'babi-hutan', name: 'Babi Hutan', x: 2130, y: 548, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Api terkunci di balik pintu candi. Tembak target merah lewat celah sempit di antara batu untuk membuka pintu, lalu padamkan api di dalam.',
  },
  {
    // A stone plugs a reservoir on the cliff; the valley fires are shielded by the cliff and a rock roof.
    id: 9, code: '1-9', name: 'Bendungan Batu', width: 2500, theme: 'ruins',
    supply: 100, waterBudget: 70, burnRate: .38, spreadDelay: 15,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 1100, top: 548 },
      { x0: 1090, x1: 1340, top: 260, style: 'pillar' },
      { x0: 1330, x1: 1520, top: 556, style: 'pillar' },
      { x0: 1510, x1: 1700, top: 572, style: 'pillar' },
      { x0: 1690, x1: 1960, top: 586, style: 'pillar' },
      { x0: 1950, x1: 2600, top: 548, style: 'pillar' },
    ],
    bridges: [],
    rocks: [{ x0: 520, x1: 680, y0: 320, y1: 362 }, { x0: 1470, x1: 1960, y0: 330, y1: 392 }],
    reservoirs: [{ x0: 1112, x1: 1268, floor: 260, depth: 80, plug: { r: 32 }, out: { x: 1342, y: 250, vx: 45 }, amount: 1400 }],
    fires: [
      { x: 600, y: 320, start: .45, growth: .0045, lit: true },
      { x: 860, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1430, y: 556, start: .55, growth: .0050, lit: true, max: .7 },
      { x: 1545, y: 572, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 1660, y: 586, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 2060, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-flower', x: 640, y: 326, scale: .42 },
      { key: 'tree-small', x: 2060, y: 556, scale: .7, fuel: 5 },
      { key: 'tree-a', x: 2420, y: 560, scale: .85 },
    ],
    animal: { key: 'raja-udang', name: 'Raja Udang', x: 2220, y: 548, scale: .8, flip: true },
    tutorial: [4, 6], brief: 'Api di lembah terlindung tebing dan atap batu. Semprot batu penahan di atas tebing sampai jatuh — air bendungan akan mengalir ke lembah.',
  },
  {
    // Raft across, then drop the crane crate onto the red button to open the gate.
    id: 10, code: '1-10', name: 'Tombol Peti', width: 2500, theme: 'ruins',
    supply: 100, waterBudget: 75, burnRate: .4, spreadDelay: 14,
    truckX: 230, driveMin: 160,
    lands: [{ x0: -80, x1: 700, top: 548 }, { x0: 820, x1: 2600, top: 548 }],
    bridges: [],
    floatGap: { x0: 700, x1: 820, need: 1 },
    rocks: [{ x0: 1480, x1: 2000, y0: 240, y1: 300 }],
    hang: { anchorX: 1360, anchorY: 250, rope: 50, postX: 1270, groundY: 548, load: 'crate' },
    gates: [{ id: 'g1', x: 1500, y0: 300, y1: 548 }],
    switches: [{ kind: 'button', x: 1360, y: 548, opens: 'g1' }],
    fires: [
      { x: 1000, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1640, y: 548, start: .55, growth: .0055, lit: true, max: .75 },
      { x: 1800, y: 548, start: .55, growth: .0055, lit: true, max: .75 },
      { x: 1940, y: 548, start: .55, growth: .0055, lit: true, max: .75 },
      { x: 2130, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'crate', x: 640, y: 504 }],
    decor: [
      { key: 'tree-c', x: 80, y: 560, scale: .9 },
      { key: 'tree-flower', x: 2130, y: 556, scale: .8, fuel: 4 },
      { key: 'tree-b', x: 2440, y: 560, scale: .9 },
    ],
    animal: { key: 'kura-kura', name: 'Kura-kura', x: 2290, y: 548, scale: .75, flip: true },
    tutorial: [4, 5, 6], brief: 'Buat pijakan peti, lalu putus tali derek supaya peti jatuh tepat di tombol merah. Pintu terbuka dan api di dalam bisa dipadamkan.',
  },
  {
    // Spin the wheel to open the dam gate; water cascades down the terraces onto the fires.
    id: 11, code: '1-11', name: 'Teras Kawah', width: 2600, theme: 'volcanic',
    supply: 100, waterBudget: 70, burnRate: .42, spreadDelay: 14,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 1060, top: 548 },
      { x0: 1050, x1: 1400, top: 250, style: 'pillar' },
      { x0: 1390, x1: 1620, top: 380, style: 'pillar' },
      { x0: 1610, x1: 1840, top: 465, style: 'pillar' },
      { x0: 1830, x1: 2700, top: 548, style: 'pillar' },
    ],
    bridges: [],
    rocks: [{ x0: 420, x1: 580, y0: 320, y1: 362 }, { x0: 1470, x1: 1620, y0: 200, y1: 250 }, { x0: 1690, x1: 1840, y0: 290, y1: 340 }],
    wheel: { x: 960, y: 330, r: 46 },
    gates: [{ id: 'dam', x: 1384, y0: 156, y1: 250 }],
    switches: [{ kind: 'wheel', x: 960, y: 330, opens: 'dam', need: 18 }],
    reservoirs: [{ x0: 1072, x1: 1365, floor: 250, depth: 80, gate: 'dam', out: { x: 1404, y: 240, vx: 85 }, amount: 1200 }],
    fires: [
      { x: 500, y: 320, start: .45, growth: .0045, lit: true },
      { x: 760, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1520, y: 380, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 1740, y: 465, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 1940, y: 548, start: .6, growth: .0060, lit: true },
      { x: 2080, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 2080, y: 556, scale: .7, fuel: 5 },
      { key: 'tree-c', x: 2520, y: 560, scale: .85 },
    ],
    animal: { key: 'buaya', name: 'Buaya Muara', x: 2260, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Kawah bertingkat terlindung tebing. Semprot kincir sampai berputar kencang — pintu bendungan terbuka dan air mengalir menuruni teras ke api.',
  },
  {
    // Two locks: the first target (through a slit) opens room one, revealing the second target inside.
    id: 12, code: '1-12', name: 'Dua Kunci', width: 2600, theme: 'volcanic',
    supply: 100, waterBudget: 85, burnRate: .42, spreadDelay: 14,
    truckX: 230, driveMin: 160,
    lands: [{ x0: -80, x1: 680, top: 548 }, { x0: 800, x1: 2700, top: 548 }],
    bridges: [],
    floatGap: { x0: 680, x1: 800, need: 1 },
    rocks: [
      { x0: 1000, x1: 1220, y0: 100, y1: 166 },
      { x0: 1000, x1: 1220, y0: 230, y1: 290 },
      { x0: 1220, x1: 1350, y0: 50, y1: 158 },
      { x0: 1220, x1: 1640, y0: 240, y1: 300 },
      { x0: 1640, x1: 2050, y0: 240, y1: 300 },
    ],
    gates: [{ id: 'g1', x: 1240, y0: 300, y1: 548 }, { id: 'g2', x: 1660, y0: 300, y1: 548 }],
    switches: [{ kind: 'target', x: 1262, y: 214, opens: 'g1' }, { kind: 'target', x: 1600, y: 470, opens: 'g2' }],
    fires: [
      { x: 940, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1420, y: 548, start: .5, growth: .0050, lit: true, max: .7 },
      { x: 1780, y: 548, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 1930, y: 548, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 2150, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'log', x: 600, y: 514 }],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 2150, y: 556, scale: .7, fuel: 4 },
      { key: 'tree-c', x: 2500, y: 560, scale: .85 },
    ],
    animal: { key: 'komodo', name: 'Komodo', x: 2320, y: 548, scale: .45, flip: true },
    tutorial: [3, 4, 6], brief: 'Dua pintu terkunci. Tembak target pertama lewat celah batu, masuk ruang pertama, lalu tembak target kedua di dalam untuk membuka pintu berikutnya.',
  },
  {
    // Chain reaction: release the dam -> water fills the basin -> the boulder floats to the button -> the cage opens;
    // the basin's overflow then runs on to the fires.
    id: 13, code: '1-13', name: 'Bendungan Ganda', width: 2700, theme: 'volcanic',
    supply: 100, waterBudget: 75, burnRate: .42, spreadDelay: 14,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 1000, top: 548 },
      { x0: 990, x1: 1250, top: 300, style: 'pillar' },
      { x0: 1240, x1: 1460, top: 640, style: 'pillar' },
      { x0: 1450, x1: 1632, top: 392, style: 'pillar' },
      { x0: 1622, x1: 2800, top: 470, style: 'pillar' },
    ],
    bridges: [],
    rocks: [{ x0: 420, x1: 580, y0: 320, y1: 362 }, { x0: 1290, x1: 1460, y0: 150, y1: 196 }],
    reservoirs: [{ x0: 1010, x1: 1180, floor: 300, depth: 80, plug: { r: 32 }, out: { x: 1252, y: 290, vx: 70 }, amount: 1500 }],
    basin: { x0: 1250, x1: 1450, floor: 640, lip: 392, boulder: { x: 1350, r: 32 }, button: { x: 1566, y: 392 }, cage: { x: 2450, y: 470 } },
    fires: [
      { x: 500, y: 320, start: .45, growth: .0045, lit: true },
      { x: 820, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1760, y: 470, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 1920, y: 470, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 2080, y: 470, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 2250, y: 470, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-small', x: 2250, y: 478, scale: .7, fuel: 5 },
      { key: 'tree-a', x: 2640, y: 482, scale: .85 },
    ],
    animal: { key: 'ular', name: 'Ular Sanca', x: 2450, y: 470, scale: .7, flip: true },
    tutorial: [4, 5, 6], brief: 'Reaksi berantai: jatuhkan batu bendungan — air memenuhi kolam, batu mengapung ke tombol kandang, dan luapannya mengalir ke api.',
  },
  {
    // Finale: raft, target through a slit opens the gate, then push the dam stone off the roof to flood the far fires.
    id: 14, code: '1-14', name: 'Puncak Merapi', width: 2900, theme: 'volcanic',
    supply: 100, waterBudget: 90, burnRate: .45, spreadDelay: 13,
    truckX: 230, driveMin: 160,
    lands: [{ x0: -80, x1: 640, top: 548 }, { x0: 760, x1: 3000, top: 548 }],
    bridges: [],
    floatGap: { x0: 640, x1: 760, need: 1 },
    rocks: [
      { x0: 1250, x1: 1460, y0: 100, y1: 166 },
      { x0: 1250, x1: 1460, y0: 230, y1: 290 },
      { x0: 1460, x1: 1590, y0: 40, y1: 158 },
      { x0: 1460, x1: 2160, y0: 240, y1: 300 },
    ],
    gates: [{ id: 'g1', x: 1480, y0: 300, y1: 548 }],
    switches: [{ kind: 'target', x: 1502, y: 214, opens: 'g1' }],
    reservoirs: [{ x0: 1780, x1: 1980, floor: 240, depth: 70, plug: { r: 30 }, out: { x: 2162, y: 232, vx: 140 }, amount: 1300 }],
    fires: [
      { x: 1000, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1640, y: 548, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 1820, y: 548, start: .55, growth: .0055, lit: true, max: .7 },
      { x: 2220, y: 548, start: .6, growth: .0060, lit: true },
      { x: 2360, y: 548, start: .6, growth: .0060, lit: true },
      { x: 2520, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'crate', x: 560, y: 504 }],
    decor: [
      { key: 'tree-c', x: 80, y: 560, scale: .9 },
      { key: 'tree-flower', x: 2520, y: 556, scale: .8, fuel: 5 },
      { key: 'tree-b', x: 2820, y: 560, scale: .9 },
    ],
    animal: { key: 'berang', name: 'Berang-berang', x: 2680, y: 548, scale: .75, flip: true },
    tutorial: [3, 4, 6], brief: 'Ujian terakhir: buat pijakan, tembak target lewat celah untuk membuka pintu, lalu jatuhkan batu bendungan di atap supaya air membanjiri api di seberang.',
  },
  {
    id: 15, code: '1-15', name: 'Boss Pembakar Hutan', width: 3000,
    supply: 200, waterBudget: 200, burnRate: .3, spreadDelay: 16,
    truckX: 230, driveMin: 160,
    // A wide river splits the map: the truck keeps its own bank to dodge on; the boss leaps between ledges across it.
    lands: [
      { x0: -80, x1: 900, top: 548 },
      { x0: 1240, x1: 1650, top: 520 },
      { x0: 1900, x1: 2150, top: 470, style: 'pillar' },
      { x0: 2140, x1: 2380, top: 395, style: 'pillar' },
      { x0: 2370, x1: 2560, top: 330, style: 'pillar' },
      { x0: 2550, x1: 3100, top: 430, style: 'pillar' },
    ],
    bridges: [{ x0: 888, x1: 1252, y: 540 }],
    rocks: [{ x0: 1300, x1: 1440, y0: 300, y1: 342 }],
    boss: { x: 2265, y: 395, hp: 100, arena: 1650, perches: [{ x: 2020, y: 470 }, { x: 2265, y: 395 }, { x: 2470, y: 330 }, { x: 2650, y: 430 }],
      waterfall: { x: 1070, y: 552, w: 230 } },
    fires: [
      { x: 1360, y: 300, start: .45, growth: .0045, lit: true },
      { x: 1500, y: 520, start: .55, growth: .0050, lit: true },
      { x: 600, y: 548, start: .45, growth: .0045, lit: true },
    ],
    props: [],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 1400, y: 306, scale: .42 },
      { key: 'boss-tower', x: 2900, y: 436, scale: 1 },
      { key: 'crate-plain', x: 2720, y: 436, scale: .4 },
      { key: 'barrel-blue', x: 2770, y: 436, scale: .36 },
      { key: 'boulder', x: 1300, y: 528, scale: .26 },
    ],
    animal: { key: 'orangutan-sit', name: 'Keluarga Orangutan', x: 2820, y: 430, scale: .62, flip: true },
    tutorial: [6], brief: 'Kalahkan Pembakar Hutan di seberang sungai! Ia melompat-lompat menghindar. Padamkan api dari bola api, tembak jatuh serangannya, dan berhenti menyemprot 10 detik untuk mengisi ulang cadangan air.',
  },
];

export const LEVELS: LevelDef[] = [...JAWA_LEVELS, ...SUMATRA_LEVELS, ...KALIMANTAN_LEVELS];

/** `level` is the level id the animal is rescued in. */
export const ANIMALS = [
  { key: 'rusa', name: 'Rusa Timor', level: 1 },
  { key: 'rangkong', name: 'Rangkong', level: 2 },
  { key: 'orangutan', name: 'Orangutan', level: 3 },
  { key: 'beruang', name: 'Beruang Madu', level: 4 },
  { key: 'bekantan', name: 'Bekantan', level: 5 },
  { key: 'trenggiling', name: 'Trenggiling', level: 6 },
  { key: 'gajah', name: 'Gajah Sumatra', level: 7 },
  { key: 'babi-hutan', name: 'Babi Hutan', level: 8 },
  { key: 'raja-udang', name: 'Raja Udang', level: 9 },
  { key: 'kura-kura', name: 'Kura-kura', level: 10 },
  { key: 'buaya', name: 'Buaya Muara', level: 11 },
  { key: 'komodo', name: 'Komodo', level: 12 },
  { key: 'ular', name: 'Ular Sanca', level: 13 },
  { key: 'berang', name: 'Berang-berang', level: 14 },
  { key: 'anak-gajah', name: 'Anak Gajah Sumatra', level: 16 },
  { key: 'tapir', name: 'Tapir', level: 17 },
  { key: 'harimau', name: 'Harimau Sumatra', level: 19 },
  { key: 'rusa-sumatra', name: 'Rusa Sambar', level: 23 },
  { key: 'owa', name: 'Owa Kalimantan', level: 44 },
  { key: 'pesut', name: 'Pesut Mahakam', level: 57 },
  { key: 'kucing-bakau', name: 'Kucing Bakau', level: 58 },
  { key: 'kucing-merah', name: 'Kucing Merah Kalimantan', level: 64 },
];
