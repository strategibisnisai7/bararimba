/** Data-driven levels. World units: x right, y down; ground "top" is the walkable surface. */
export interface Land { x0: number; x1: number; top: number; style?: 'grass' | 'pillar' }
export interface Bridge { x0: number; x1: number; y: number }
/** `max` caps a fire's size: the fire that creeps toward the animal stays small and slow. */
export interface FireDef { x: number; y: number; start: number; growth: number; lit: boolean; max?: number }
export interface PropDef { kind: 'crate' | 'crate-plain' | 'boulder' | 'log' | 'ice' | 'ice-block'; x: number; y: number }
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
import { PAPUA_LEVELS, type PapuaDef } from './papuaLevels';
export type Theme = 'forest' | 'ruins' | 'volcanic' | 'cave' | 'peat' | 'papua';
export interface LevelDef {
  id: number; code: string; name: string; width: number;
  /** Visual tile set; gameplay is unchanged. */
  theme?: Theme;
  /** Campaign region (default Jawa). */
  region?: RegionId;
  /** Shared cave mechanisms and the walk-to-flag rescue (src/scenes/Sumatra.ts). */
  sm?: SumatraDef;
  papua?: PapuaDef;
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
  seesaw?: { x: number; y: number; target: { x: number; y: number }; mode?: 'catapult' | 'ramp' };
  /** Static rock slabs (cave ceilings, overhangs); `stone`: cut temple blocks instead of grassy earth. */
  rocks?: { x0: number; x1: number; y0: number; y1: number; stone?: boolean }[];
  /** Wooden ramp planks hinged at (x0, y0): a water jet skims along them and flies off the far end.
   * `drops`: when that gate opens the plank swings down to the mirrored angle. */
  ramps?: { x0: number; y0: number; x1: number; y1: number; drops?: string }[];
  /** Reflector panels: water bounces off them according to reflection angle. */
  mirrors?: { x: number; y: number; len: number; angle: number }[];
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
  /** Lake ferry barge: truck boards it at x0, spraying paddle propels it across the lake to x1. */
  ferry?: { x0: number; x1: number; y: number; w?: number; paddle?: { x: number; y: number } };
  /** Hydraulic cliff lift: truck enters at y0, spraying counterweight bucket hoists platform to y1. */
  lift?: { x: number; y0: number; y1: number; w?: number; bucket: { x: number; y: number; need?: number } };
  /** Hanging rope bridge with sagging wooden slats over a gorge. */
  ropeBridge?: { x0: number; x1: number; y: number; dip?: number };
  /** Moving shuttle bridge: wooden platform moving back and forth across a ravine. */
  shuttle?: { x0: number; x1: number; y: number; w?: number; speed?: number };
  /** Giant HD Waterwheel: huge rotating timber wheel with 8 buckets pouring water cascades. */
  giantWheel?: { x: number; y: number; r?: number; out?: { x: number; y: number; vx: number } };
  animal: AnimalDef; tutorial: number[]; brief: string;
}

export type RegionId = 'jawa' | 'sumatra' | 'kalimantan' | 'papua';
/** Level ids `first`..`first + total - 1` belong to the region; tile `boss` is its boss level, `midBoss` a second one. */
export interface RegionDef { id: RegionId; name: string; subtitle: string; first: number; total: number; boss: number; midBoss?: number; forest: string }
export const REGIONS: Record<RegionId, RegionDef> = {
  jawa: { id: 'jawa', name: 'JAWA', subtitle: 'Hutan Pegunungan', first: 1, total: 15, boss: 15, forest: 'Hutan Jawa' },
  sumatra: { id: 'sumatra', name: 'SUMATRA', subtitle: 'Goa Karst & Hutan Hujan', first: 16, total: 20, boss: 35, forest: 'Goa Sumatra' },
  kalimantan: { id: 'kalimantan', name: 'KALIMANTAN', subtitle: 'Hutan Gambut & Sungai Hitam', first: 36, total: 30, boss: 65, midBoss: 50, forest: 'Rawa Gambut Kalimantan' },
  papua: { id: 'papua', name: 'PAPUA', subtitle: 'Hutan Dataran Rendah & Gua', first: 66, total: 24, boss: 89, forest: 'Gua Papua' },
};
export const REGION = REGIONS.jawa;
export const regionOf = (def: LevelDef) => REGIONS[def.region ?? 'jawa'];

const JAWA_LEVELS: LevelDef[] = [
  {
    id: 1, code: '1-1', name: 'Lembah Pinus & Rampa Perdana', width: 2600,
    supply: 100, waterBudget: 60, burnRate: .3, spreadDelay: 16,
    truckX: 230, driveMin: 140, driveMax: 700,
    lands: [
      { x0: -80, x1: 720, top: 548 },
      { x0: 1080, x1: 1650, top: 500 },
      { x0: 1640, x1: 2700, top: 430 },
    ],
    bridges: [{ x0: 710, x1: 1090, y: 535 }],
    ramps: [{ x0: 620, y0: 540, x1: 880, y1: 420 }],
    floatGap: { x0: 1180, x1: 1320, need: 1 },
    props: [{ kind: 'crate', x: 1120, y: 460 }],
    fires: [
      { x: 940, y: 440, start: .5, growth: .0050, lit: true },
      { x: 1480, y: 500, start: .5, growth: .0055, lit: true },
      { x: 1820, y: 430, start: .55, growth: .0060, lit: true },
      { x: 2150, y: 430, start: .6, growth: .0065, lit: true },
      { x: 2380, y: 430, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1.05 },
      { key: 'tree-flower', x: 1620, y: 440, scale: .85, fuel: 3 },
      { key: 'tree-small', x: 2380, y: 438, scale: .75, fuel: 4 },
      { key: 'tree-c', x: 2520, y: 440, scale: .8 },
      { key: 'stump', x: 1420, y: 508, scale: .45 },
    ],
    animal: { key: 'rusa', name: 'Rusa Timor', x: 2480, y: 430, scale: .62, flip: true },
    tutorial: [1, 2, 3, 4, 6], brief: 'Lembah perbukitan pinus Jawa! Gunakan rampa ski-jump di tepi tebing untuk melontarkan jet air ke bara api di tebing seberang. Seberangi jembatan dan dorong peti kayu ke celah jeram untuk pijakan truk menaiki plato pegunungan menyelamatkan Rusa Timor.',
  },
  {
    id: 2, code: '1-2', name: 'Kincir Air Raksasa HD & Jurang Karst', width: 2600,
    supply: 100, waterBudget: 65, burnRate: .35, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 850, top: 548 },
      { x0: 1240, x1: 2700, top: 380 },
    ],
    bridges: [],
    rocks: [{ x0: 850, x1: 1240, y0: 160, y1: 580 }],
    giantWheel: { x: 920, y: 380, r: 140, out: { x: 1150, y: 220, vx: 65 } },
    fires: [
      { x: 740, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1280, y: 380, start: .55, growth: .0060, lit: true },
      { x: 1540, y: 380, start: .6, growth: .0060, lit: true },
      { x: 1880, y: 380, start: .55, growth: .0055, lit: true },
      { x: 2200, y: 380, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 556, scale: 1 },
      { key: 'tree-small', x: 2200, y: 390, scale: .7, fuel: 3 },
      { key: 'tree-a', x: 2480, y: 390, scale: .85 },
    ],
    animal: { key: 'rangkong', name: 'Rangkong', x: 2360, y: 380, scale: .62, flip: true },
    tutorial: [3, 6], brief: 'Tebing karst menjulang memisahkan truk dari sarang Rangkong! Semprot kincir air raksasa berdiameter 280px di lereng tebing hingga berputar kencang — kincir kayu berdaun 8 ini akan meraup air dan menuangkan air bah raksasa dari puncaknya ke balik tebing memadamkan kobaran api!',
  },
  {
    id: 3, code: '1-3', name: 'Danau Situ Patenggang & Feri Penyeberangan', width: 2800,
    supply: 100, waterBudget: 75, burnRate: .38, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 650, top: 560 },
      { x0: 1250, x1: 1750, top: 560 },
      { x0: 1740, x1: 2900, top: 440 },
    ],
    bridges: [],
    ferry: { x0: 680, x1: 1220, y: 574, w: 260 },
    fires: [
      { x: 520, y: 560, start: .5, growth: .0050, lit: true },
      { x: 1420, y: 560, start: .5, growth: .0055, lit: true },
      { x: 1780, y: 470, start: .55, growth: .0060, lit: true },
      { x: 2150, y: 440, start: .6, growth: .0060, lit: true },
      { x: 2420, y: 440, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 568, scale: 1 },
      { key: 'tree-flower', x: 1500, y: 568, scale: .85, fuel: 3 },
      { key: 'tree-c', x: 2540, y: 450, scale: .9 },
    ],
    animal: { key: 'orangutan', name: 'Orangutan', x: 2540, y: 440, scale: .6, flip: true },
    tutorial: [3, 4, 6], brief: 'Danau Situ Patenggang membelah rimba! Naikkan mobil pemadam ke atas perahu feri kayu, lalu semprot dayung buritan dengan jet air untuk melajukan perahu menyeberangi danau. Menepi di seberang, lalu daki lereng bukit beringin untuk membebaskan Orangutan!',
  },
  {
    id: 4, code: '1-4', name: 'Lift Hidrolik Tebing Cadas', width: 2600,
    supply: 100, waterBudget: 75, burnRate: .36, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 720, top: 570 },
      { x0: 980, x1: 2700, top: 410 },
    ],
    bridges: [],
    lift: { x: 850, y0: 584, y1: 424, w: 240, bucket: { x: 850, y: 220, need: 22 } },
    fires: [
      { x: 580, y: 570, start: .5, growth: .0050, lit: true },
      { x: 1200, y: 410, start: .55, growth: .0055, lit: true },
      { x: 1550, y: 410, start: .6, growth: .0060, lit: true },
      { x: 1920, y: 410, start: .55, growth: .0055, lit: true },
      { x: 2280, y: 410, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 60, y: 578, scale: 1 },
      { key: 'tree-small', x: 2280, y: 418, scale: .7, fuel: 3 },
      { key: 'tree-a', x: 2520, y: 418, scale: .85 },
    ],
    animal: { key: 'beruang', name: 'Beruang Madu', x: 2420, y: 410, scale: .58, flip: true },
    tutorial: [5, 6], brief: 'Tebing cadas setinggi 160 piksel menghalangi jalan! Kemudikan truk masuk ke platform lift hidrolik, lalu dongakkan meriam air dan semprot ember penyeimbang di atas tebing. Beban air akan menarik kabel katrol dan mengangkat lift bersama truk ke plato atas menyelamatkan Beruang Madu!',
  },
  {
    id: 5, code: '1-5', name: 'Jembatan Tali Situ Gunung', width: 2600,
    supply: 100, waterBudget: 75, burnRate: .4, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 650, top: 510 },
      { x0: 1250, x1: 2700, top: 510 },
    ],
    bridges: [],
    ropeBridge: { x0: 650, x1: 1250, y: 510, dip: 16 },
    props: [{ kind: 'log', x: 880, y: 490 }],
    fires: [
      { x: 520, y: 510, start: .5, growth: .0050, lit: true },
      { x: 880, y: 510, start: .6, growth: .0060, lit: true },
      { x: 1450, y: 510, start: .55, growth: .0055, lit: true },
      { x: 1820, y: 510, start: .6, growth: .0060, lit: true },
      { x: 2180, y: 510, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-b', x: 50, y: 518, scale: 1 },
      { key: 'tree-flower', x: 1520, y: 518, scale: .85, fuel: 3 },
      { key: 'tree-c', x: 2460, y: 518, scale: .85 },
    ],
    animal: { key: 'bekantan', name: 'Bekantan', x: 2360, y: 510, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Jembatan tali gantung terpanjang melintasi ngarai Situ Gunung! Padamkan kayu gelondongan yang terbakar di tengah jembatan lalu dorong dengan semprotan air sampai jatuh ke jurang. Kemudikan truk melintasi ayunan jembatan tali untuk menembus hutan bambu Bekantan!',
  },
  {
    id: 6, code: '1-6', name: 'Jembatan Kayu Mondar-Mandir Jurang', width: 2600,
    supply: 100, waterBudget: 75, burnRate: .4, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 680, top: 530 },
      { x0: 1220, x1: 2700, top: 530 },
    ],
    bridges: [],
    shuttle: { x0: 720, x1: 1180, y: 542, w: 220, speed: 65 },
    hang: { anchorX: 1480, anchorY: 260, rope: 85, postX: 1550, groundY: 530, load: 'crate', door: 'cave-gate' },
    gates: [{ id: 'cave-gate', x: 1680, y0: 370, y1: 530 }],
    fires: [
      { x: 520, y: 530, start: .5, growth: .0050, lit: true },
      { x: 950, y: 320, start: .45, growth: .0040, lit: true },
      { x: 1840, y: 530, start: .55, growth: .0055, lit: true },
      { x: 2180, y: 530, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-a', x: 60, y: 538, scale: 1 },
      { key: 'tree-small', x: 2180, y: 538, scale: .55, fuel: 3 },
      { key: 'tree-c', x: 2480, y: 538, scale: .85 },
    ],
    animal: { key: 'trenggiling', name: 'Trenggiling', x: 2340, y: 530, scale: .7, flip: true },
    tutorial: [3, 5, 6], brief: 'Jembatan kayu bermotor mondar-mandir menyeberangi jurang curam! Tunggu jembatan merapat, kemudikan truk ke atasnya, dan nikmati sensasi menyeberang sambil memadamkan api stalaktit di atas kepala. Di seberang, ayunkan derek pendulum untuk menjebol gerbang gua Trenggiling.',
  },
  {
    id: 7, code: '1-7', name: 'Seluncur Balok Es Gua Semeru', width: 2700, theme: 'cave',
    supply: 100, waterBudget: 80, burnRate: .42, spreadDelay: 14,
    truckX: 230, driveMin: 140,
    lands: [{ x0: -80, x1: 2800, top: 548 }],
    bridges: [],
    ramps: [{ x0: 600, y0: 540, x1: 950, y1: 340 }],
    rocks: [{ x0: 1200, x1: 1550, y0: 250, y1: 460 }],
    props: [
      { kind: 'ice-block', x: 720, y: 460 },
      { kind: 'ice-block', x: 840, y: 390 },
    ],
    fires: [
      { x: 500, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1320, y: 548, start: .7, growth: .0070, lit: true },
      { x: 1440, y: 548, start: .7, growth: .0070, lit: true },
      { x: 1850, y: 548, start: .55, growth: .0055, lit: true },
      { x: 2280, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-b', x: 60, y: 556, scale: 1 },
      { key: 'tree-small', x: 2280, y: 556, scale: .6, fuel: 3 },
    ],
    animal: { key: 'gajah', name: 'Gajah Sumatra', x: 2480, y: 548, scale: .62, flip: true },
    tutorial: [3, 4, 6], brief: 'Gua es kaki Semeru tertutup dinding api raksasa di balik atap batu tebal! Semprot balok-balok es bergesekan sangat licin di atas perosotan es — balok es akan meluncur kencang menabrak dinding api, mencair seketika dan memadamkan kobaran api dengan semburan uap air untuk menyelamatkan Gajah Sumatra!',
  },
  {
    id: 8, code: '1-8', name: 'Ketapel Jungkat-Jungkit Lereng Bukit', width: 2600,
    supply: 100, waterBudget: 80, burnRate: .4, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 750, top: 548 },
      { x0: 740, x1: 1550, top: 520 },
      { x0: 1680, x1: 2700, top: 400 },
    ],
    bridges: [],
    seesaw: { x: 1080, y: 512, target: { x: 2020, y: 390 }, mode: 'catapult' },
    ramps: [{ x0: 1250, y0: 510, x1: 1550, y1: 360 }],
    rocks: [{ x0: 820, x1: 960, y0: 320, y1: 360 }],
    props: [{ kind: 'boulder', x: 880, y: 260 }],
    fires: [
      { x: 550, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1380, y: 520, start: .55, growth: .0055, lit: true },
      { x: 1980, y: 400, start: .65, growth: .0065, lit: true },
      { x: 2120, y: 400, start: .65, growth: .0065, lit: true },
      { x: 2380, y: 400, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-a', x: 60, y: 556, scale: 1 },
      { key: 'tree-small', x: 2380, y: 408, scale: .7, fuel: 4 },
      { key: 'tree-c', x: 2540, y: 408, scale: .85 },
    ],
    animal: { key: 'babi-hutan', name: 'Babi Hutan', x: 2360, y: 400, scale: .55, flip: true },
    tutorial: [3, 4, 6], brief: 'Api membakar benteng di puncak tebing seberang jurang yang tak terjangkau semprotan biasa! Dorong batu besar dari tebing atas agar jatuh bebas menghantam jungkat-jungkit pelontar — tong air peledak akan terlontar melintasi jurang menghantam kobaran api! Gunakan juga rampa luncur untuk menyiram sisa bara Babi Hutan.',
  },
  {
    id: 9, code: '1-9', name: 'Cermin Kristal Pemantul Sudut Ganda', width: 2600, theme: 'ruins',
    supply: 100, waterBudget: 75, burnRate: .38, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [{ x0: -80, x1: 2700, top: 548 }],
    bridges: [],
    rocks: [
      { x0: 750, x1: 950, y0: 220, y1: 548, stone: true },
      { x0: 1250, x1: 1850, y0: 200, y1: 260, stone: true },
    ],
    mirrors: [
      { x: 700, y: 190, len: 140, angle: -0.785 },
      { x: 1200, y: 160, len: 140, angle: 0.785 },
    ],
    fires: [
      { x: 580, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1420, y: 548, start: .6, growth: .0060, lit: true },
      { x: 1680, y: 548, start: .6, growth: .0060, lit: true },
      { x: 2050, y: 548, start: .55, growth: .0050, lit: true },
      { x: 2320, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 556, scale: 1 },
      { key: 'tree-small', x: 2320, y: 556, scale: .7, fuel: 3 },
      { key: 'tree-a', x: 2540, y: 556, scale: .85 },
    ],
    animal: { key: 'raja-udang', name: 'Raja Udang', x: 2420, y: 548, scale: .8, flip: true },
    tutorial: [3, 6], brief: 'Labirin candi karst dengan lorong berliku dan pilar batu masif! Manfaatkan cermin kristal purba untuk memantulkan jet air: pantulan pertama melontarkan air ke atas pilar, dan cermin kedua membelokkannya menukik tajam ke dalam ruang tersembunyi tempat Raja Udang berlindung.',
  },
  {
    id: 10, code: '1-10', name: 'Waduk Bendungan Lumpur & Teras Bertingkat', width: 2600, theme: 'ruins',
    supply: 100, waterBudget: 75, burnRate: .38, spreadDelay: 15,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 900, top: 548 },
      { x0: 890, x1: 1250, top: 280, style: 'pillar' },
      { x0: 1240, x1: 1550, top: 390, style: 'pillar' },
      { x0: 1540, x1: 1850, top: 480, style: 'pillar' },
      { x0: 1840, x1: 2700, top: 548, style: 'pillar' },
    ],
    bridges: [],
    gates: [{ id: 'dam-mud', x: 1220, y0: 180, y1: 280, style: 'mud', need: 40 }],
    reservoirs: [{ x0: 920, x1: 1200, floor: 280, depth: 85, gate: 'dam-mud', out: { x: 1240, y: 270, vx: 80 }, amount: 1600 }],
    fires: [
      { x: 550, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1350, y: 390, start: .55, growth: .0055, lit: true },
      { x: 1650, y: 480, start: .55, growth: .0055, lit: true },
      { x: 1980, y: 548, start: .6, growth: .0060, lit: true },
      { x: 2320, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-c', x: 80, y: 560, scale: .9 },
      { key: 'tree-flower', x: 2320, y: 556, scale: .8, fuel: 4 },
      { key: 'tree-b', x: 2540, y: 560, scale: .9 },
    ],
    animal: { key: 'kura-kura', name: 'Kura-kura', x: 2420, y: 548, scale: .75, flip: true },
    tutorial: [4, 6], brief: 'Waduk air kuno di puncak pilar candi tertahan tanggul lumpur! Tembakkan jet air secara konsisten untuk mengikis tanggul lumpur hingga jebol. Air bah ribuan liter akan tumpah membentuk air terjun beruntun yang menyapu seluruh api di tiga teras bertingkat membebaskan Kura-kura!',
  },
  {
    id: 11, code: '1-11', name: 'Rawa Gambut & Rakit Rantai Kayu', width: 2600,
    supply: 100, waterBudget: 80, burnRate: .4, spreadDelay: 14,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 720, top: 548 },
      { x0: 980, x1: 2700, top: 548 },
    ],
    bridges: [],
    floatGap: { x0: 720, x1: 980, need: 2 },
    props: [
      { kind: 'log', x: 450, y: 514 },
      { kind: 'log', x: 580, y: 514 },
    ],
    ramps: [{ x0: 1150, y0: 530, x1: 1450, y1: 370 }],
    fires: [
      { x: 500, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1250, y: 548, start: .55, growth: .0055, lit: true },
      { x: 1620, y: 370, start: .6, growth: .0060, lit: true },
      { x: 1950, y: 370, start: .55, growth: .0050, lit: true },
      { x: 2280, y: 370, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 2280, y: 556, scale: .7, fuel: 5 },
      { key: 'tree-c', x: 2520, y: 560, scale: .85 },
    ],
    animal: { key: 'buaya', name: 'Buaya Muara', x: 2420, y: 370, scale: .5, flip: true },
    tutorial: [3, 4, 6], brief: 'Jeram rawa berarus deras memutus jalur truk pemadam! Semprot dua batang kayu besar ke celah air untuk merangkai rakit pijakan ganda. Seberangi rawa, daki tanjakan bukit terjal, lalu gunakan ski-jump kayu untuk memadamkan sarang api Buaya Muara.',
  },
  {
    id: 12, code: '1-12', name: 'Bandul Derek Raksasa Benteng Kuno', width: 2600,
    supply: 100, waterBudget: 80, burnRate: .4, spreadDelay: 14,
    truckX: 230, driveMin: 140,
    lands: [{ x0: -80, x1: 2700, top: 548 }],
    bridges: [],
    hang: { anchorX: 1120, anchorY: 210, rope: 105, postX: 1200, groundY: 530, load: 'crate', door: 'fort-gate' },
    gates: [{ id: 'fort-gate', x: 1320, y0: 360, y1: 548 }],
    fires: [
      { x: 620, y: 548, start: .5, growth: .0050, lit: true },
      { x: 920, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1540, y: 548, start: .55, growth: .0055, lit: true },
      { x: 1880, y: 548, start: .55, growth: .0055, lit: true },
      { x: 2320, y: 548, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 2320, y: 556, scale: .7, fuel: 4 },
      { key: 'tree-c', x: 2540, y: 560, scale: .85 },
    ],
    animal: { key: 'komodo', name: 'Komodo', x: 2450, y: 548, scale: .45, flip: true },
    tutorial: [3, 5, 6], brief: 'Gerbang benteng batu kuno tertutup rapat membendung api di kandang Komodo! Tembakkan semprotan air ke peti derek gantung berayun — manfaatkan fisika resonansi ayunan hingga mencapai momentum puncak untuk mendobrak gerbang dan menerobos masuk!',
  },
  {
    id: 13, code: '1-13', name: 'Maha Reaksi Berantai Candi Karst', width: 2800, theme: 'volcanic',
    supply: 100, waterBudget: 85, burnRate: .42, spreadDelay: 14,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 950, top: 548 },
      { x0: 940, x1: 1220, top: 290, style: 'pillar' },
      { x0: 1210, x1: 1470, top: 640, style: 'pillar' },
      { x0: 1460, x1: 1720, top: 390, style: 'pillar' },
      { x0: 1710, x1: 2900, top: 470, style: 'pillar' },
    ],
    bridges: [],
    rocks: [
      { x0: 420, x1: 580, y0: 320, y1: 362 },
      { x0: 1250, x1: 1460, y0: 150, y1: 196 },
    ],
    reservoirs: [{ x0: 960, x1: 1140, floor: 290, depth: 85, plug: { r: 32 }, out: { x: 1222, y: 280, vx: 75 }, amount: 1600 }],
    basin: { x0: 1220, x1: 1460, floor: 640, lip: 390, boulder: { x: 1330, r: 32 }, button: { x: 1540, y: 390 }, cage: { x: 2550, y: 470 } },
    props: [{ kind: 'ice-block', x: 1540, y: 360 }],
    mirrors: [{ x: 1980, y: 240, len: 120, angle: -0.785 }],
    fires: [
      { x: 500, y: 320, start: .45, growth: .0045, lit: true },
      { x: 800, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1820, y: 470, start: .55, growth: .0055, lit: true },
      { x: 2150, y: 470, start: .6, growth: .0060, lit: true },
      { x: 2420, y: 470, start: .65, growth: .0060, lit: true },
      { x: 2650, y: 470, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-small', x: 2650, y: 478, scale: .7, fuel: 5 },
      { key: 'tree-a', x: 2750, y: 482, scale: .85 },
    ],
    animal: { key: 'ular', name: 'Ular Sanca', x: 2550, y: 470, scale: .7, flip: true },
    tutorial: [4, 5, 6], brief: 'Puncak teka-teki fisika: Reaksi Berantai Maha Hidrolik! Luncurkan batu sumbat waduk di puncak pilar -> air membanjiri kolam candi -> batu apung menekan sakelar -> balok es meluncur memadamkan api bawah -> dan cermin kristal memantulkan semprotan akhir ke sarang Ular Sanca!',
  },
  {
    id: 14, code: '1-14', name: 'Teras Vulkanik & Balok Es Luncur Merapi', width: 2900, theme: 'volcanic',
    supply: 100, waterBudget: 90, burnRate: .45, spreadDelay: 13,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 650, top: 548 },
      { x0: 640, x1: 1250, top: 430 },
      { x0: 1240, x1: 1750, top: 560 },
      { x0: 1740, x1: 3000, top: 420 },
    ],
    bridges: [],
    props: [
      { kind: 'ice-block', x: 880, y: 380 },
      { kind: 'ice-block', x: 1040, y: 380 },
    ],
    gates: [{ id: 'mud-crater', x: 1680, y0: 340, y1: 560, style: 'mud', need: 40 }],
    fires: [
      { x: 520, y: 548, start: .5, growth: .0050, lit: true },
      { x: 1420, y: 560, start: .65, growth: .0065, lit: true },
      { x: 1580, y: 560, start: .65, growth: .0065, lit: true },
      { x: 2050, y: 420, start: .6, growth: .0060, lit: true },
      { x: 2380, y: 420, start: .6, growth: .0060, lit: true },
      { x: 2680, y: 420, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    decor: [
      { key: 'tree-c', x: 80, y: 560, scale: .9 },
      { key: 'tree-flower', x: 2680, y: 428, scale: .8, fuel: 5 },
      { key: 'tree-b', x: 2840, y: 428, scale: .9 },
    ],
    animal: { key: 'berang', name: 'Berang-berang', x: 2750, y: 420, scale: .75, flip: true },
    tutorial: [3, 4, 6], brief: 'Lereng kawah Merapi bergejolak dengan lembah magma membara! Luncurkan balok-balok es dari puncak bukit ke dasar lembah untuk mendinginkan lahar, kikis tanggul lumpur vulkanik dengan jet air, lalu seberangi lembah menaiki bukit seberang untuk menyelamatkan Berang-berang!',
  },
  {
    id: 15, code: '1-15', name: 'Raja Lahar Merapi', width: 3200, theme: 'volcanic',
    supply: 200, waterBudget: 200, burnRate: .3, spreadDelay: 16,
    truckX: 230, driveMin: 140,
    lands: [
      { x0: -80, x1: 900, top: 548 },
      { x0: 1240, x1: 1750, top: 520 },
      { x0: 1900, x1: 2150, top: 470, style: 'pillar' },
      { x0: 2140, x1: 2380, top: 395, style: 'pillar' },
      { x0: 2370, x1: 2580, top: 330, style: 'pillar' },
      { x0: 2570, x1: 3200, top: 430, style: 'pillar' },
    ],
    bridges: [{ x0: 888, x1: 1252, y: 540 }],
    rocks: [{ x0: 1300, x1: 1440, y0: 300, y1: 342 }],
    boss: {
      x: 2265, y: 395, hp: 100, arena: 1650, name: 'Raja Lahar Merapi',
      perches: [{ x: 2020, y: 470 }, { x: 2265, y: 395 }, { x: 2470, y: 330 }, { x: 2650, y: 430 }],
      waterfall: { x: 1070, y: 552, w: 230 }
    },
    fires: [
      { x: 600, y: 548, start: .45, growth: .0045, lit: true },
      { x: 1360, y: 300, start: .45, growth: .0045, lit: true },
      { x: 1500, y: 520, start: .55, growth: .0050, lit: true },
    ],
    props: [{ kind: 'boulder', x: 1360, y: 250 }],
    seesaw: { x: 1530, y: 504, target: { x: 2265, y: 395 }, mode: 'catapult' },
    mirrors: [{ x: 1850, y: 160, len: 140, angle: -0.65 }],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-small', x: 1650, y: 528, scale: .7, fuel: 2 },
      { key: 'tree-c', x: 2950, y: 438, scale: .85 },
    ],
    animal: { key: 'orangutan-sit', name: 'Keluarga Orangutan', x: 2840, y: 430, scale: .62, flip: true },
    tutorial: [6], brief: 'Pertarungan Puncak: Raja Lahar Merapi! Tembak jatuh bola api di udara dan isi ulang air di air terjun. Dorong batu tebing ke jungkat-jungkit ketapel untuk melontarkan tong air peledak (35 damage!) ke tubuh Boss, dan manfaatkan pantulan cermin langit untuk menyiram sarang lahar!',
  },
];

export const LEVELS: LevelDef[] = [...JAWA_LEVELS, ...SUMATRA_LEVELS, ...KALIMANTAN_LEVELS, ...PAPUA_LEVELS];

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
