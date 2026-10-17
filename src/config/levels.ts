/** Data-driven levels. World units: x right, y down; ground "top" is the walkable surface. */
export interface Land { x0: number; x1: number; top: number; style?: 'grass' | 'pillar' }
export interface Bridge { x0: number; x1: number; y: number }
/** `max` caps a fire's size: the fire that creeps toward the animal stays small and slow. */
export interface FireDef { x: number; y: number; start: number; growth: number; lit: boolean; max?: number }
export interface PropDef { kind: 'crate' | 'crate-plain' | 'boulder' | 'log'; x: number; y: number }
export interface Decor { key: string; x: number; y: number; scale: number; flip?: boolean; fuel?: number }
export interface HangDef { anchorX: number; anchorY: number; rope: number; postX: number; groundY: number; load?: 'barrel' | 'crate' }
export interface AnimalDef { key: string; name: string; x: number; y: number; scale: number; flip?: boolean }
export interface LevelDef {
  id: number; code: string; name: string; width: number;
  supply: number; waterBudget: number; burnRate: number; spreadDelay: number;
  /** Standard time (s): the animal is safe until it runs out, then becomes critical for `critical` seconds. */
  time: number; critical: number;
  truckX: number; driveMin: number;
  lands: Land[]; bridges: Bridge[]; fires: FireDef[]; props: PropDef[]; decor: Decor[];
  hang?: HangDef; refill?: { x: number; half: number };
  /** River gap the truck cannot cross until `need` pushed logs float into it as a raft. */
  floatGap?: { x0: number; x1: number; need: number };
  /** Water wheel: spraying it spins it, and while it turns the trough pours water from `out`. */
  /** Water basin: fill it so the boulder floats up, overflows onto the ledge and presses the button,
   * which opens the cage holding the animal. */
  basin?: { x0: number; x1: number; floor: number; lip: number; boulder: { x: number; r: number };
    button: { x: number; y: number }; cage: { x: number; y: number } };
  /** Seesaw catapult: spraying the raised end flips it and flings the water barrel toward `target`. */
  seesaw?: { x: number; y: number; target: { x: number; y: number } };
  /** Static rock slabs (cave ceilings, overhangs). */
  rocks?: { x0: number; x1: number; y0: number; y1: number }[];
  /** Pressure switch: a pushed boulder resting on the button opens the cage. */
  lever?: { button: { x: number; y: number }; cage: { x: number; y: number } };
  wheel?: { x: number; y: number; r: number; trough?: { x: number; y: number }; out: { x: number; y: number; vx: number } };
  animal: AnimalDef; tutorial: number[]; brief: string;
}

export const REGION = { name: 'JAWA', subtitle: 'Hutan Pegunungan', total: 15 };

export const LEVELS: LevelDef[] = [
  {
    id: 1, code: '1-1', name: 'Api di Jembatan', width: 2480,
    supply: 100, waterBudget: 40, burnRate: .3, spreadDelay: 16, time: 90, critical: 30,
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
    id: 2, code: '1-2', name: 'Api di Balik Tebing', width: 2350,
    supply: 100, waterBudget: 45, burnRate: .36, spreadDelay: 15, time: 120, critical: 30,
    truckX: 230, driveMin: 160,
    // Tall cliffs hide the plateaus behind them: only a high, well-judged arc reaches the fires.
    lands: [
      { x0: -80, x1: 1030, top: 548 },
      { x0: 1110, x1: 1235, top: 300, style: 'pillar' },
      { x0: 1225, x1: 1570, top: 490, style: 'pillar' },
      { x0: 1560, x1: 1790, top: 400, style: 'pillar' },
      { x0: 1780, x1: 1875, top: 270, style: 'pillar' },
      { x0: 1865, x1: 2450, top: 480, style: 'pillar' },
    ],
    bridges: [],
    fires: [
      { x: 1330, y: 490, start: .55, growth: .0055, lit: true },
      { x: 1480, y: 490, start: .5, growth: .0060, lit: true },
      { x: 1680, y: 400, start: .6, growth: .0065, lit: true },
      { x: 1965, y: 480, start: .6, growth: .0065, lit: true },
      { x: 2085, y: 480, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-slender', x: 1480, y: 498, scale: .9, fuel: 1 },
      { key: 'tree-small', x: 2085, y: 488, scale: .7, fuel: 4 },
      { key: 'tree-a', x: 2330, y: 492, scale: .85 },
    ],
    // Water wheel on top of the first cliff: spinning it scoops water over the edge onto the hidden fires.
    wheel: { x: 1172, y: 246, r: 52, out: { x: 1230, y: 268, vx: 95 } },
    animal: { key: 'rangkong', name: 'Rangkong', x: 2200, y: 480, scale: .62, flip: true },
    tutorial: [3, 6], brief: 'Api tersembunyi di balik tebing. Lob air melewati puncak agar mengalir turun, atau semprot kincir di puncak tebing — kincir yang berputar menuang air ke balik tebing.',
  },
  {
    id: 3, code: '1-3', name: 'Rakit dan Tuas', width: 2760,
    supply: 80, waterBudget: 55, burnRate: .42, spreadDelay: 14, time: 170, critical: 35,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 720, top: 548 },
      { x0: 960, x1: 1560, top: 548 },
      { x0: 1550, x1: 1700, top: 380, style: 'pillar' },
      { x0: 1690, x1: 2900, top: 420 },
    ],
    bridges: [],
    floatGap: { x0: 720, x1: 960, need: 2 },
    fires: [
      { x: 1080, y: 548, start: .55, growth: .0055, lit: true },
      { x: 1450, y: 548, start: .55, growth: .0060, lit: true },
      { x: 1820, y: 420, start: .6, growth: .0065, lit: true },
      { x: 2010, y: 420, start: .6, growth: .0065, lit: true },
      { x: 2200, y: 420, start: .95, growth: .0090, lit: true },
      { x: 2350, y: 420, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [
      { kind: 'log', x: 640, y: 514 }, { kind: 'log', x: 640, y: 450 },
      { kind: 'crate', x: 1595, y: 346 }, { kind: 'crate-plain', x: 1655, y: 346 },
    ],
    decor: [
      { key: 'tree-c', x: 90, y: 560, scale: .9 },
      { key: 'tree-small', x: 1450, y: 556, scale: .7, fuel: 1 },
      { key: 'tree-flower', x: 2350, y: 428, scale: .8, fuel: 5 },
      { key: 'tree-b', x: 2690, y: 432, scale: .9 },
    ],
    hang: { anchorX: 2200, anchorY: 262, rope: 64, postX: 2290, groundY: 420 },
    refill: { x: 1255, half: 80 },
    animal: { key: 'orangutan', name: 'Orangutan', x: 2510, y: 420, scale: .6, flip: true },
    tutorial: [4, 5, 6], brief: 'Semprot kayu ke sungai jadi rakit, jatuhkan peti penghalang, lalu putus tali tong air di atas api terbesar.',
  },
  {
    id: 4, code: '1-4', name: 'Batu Apung', width: 2300,
    supply: 100, waterBudget: 55, burnRate: .36, spreadDelay: 15, time: 170, critical: 35,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 830, top: 548 },
      { x0: 820, x1: 882, top: 360, style: 'pillar' },
      { x0: 872, x1: 1090, top: 640, style: 'pillar' },
      { x0: 1080, x1: 1262, top: 392, style: 'pillar' },
      { x0: 1252, x1: 2400, top: 520, style: 'pillar' },
    ],
    bridges: [],
    basin: { x0: 882, x1: 1080, floor: 640, lip: 392, boulder: { x: 975, r: 32 }, button: { x: 1196, y: 392 }, cage: { x: 1930, y: 520 } },
    fires: [
      { x: 1350, y: 520, start: .55, growth: .0055, lit: true },
      { x: 1530, y: 520, start: .55, growth: .0060, lit: true },
      { x: 1700, y: 520, start: .6, growth: .0060, lit: true },
      { x: 1810, y: 520, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-small', x: 1810, y: 528, scale: .7, fuel: 3 },
      { key: 'tree-a', x: 2200, y: 532, scale: .85 },
    ],
    animal: { key: 'beruang', name: 'Beruang Madu', x: 1930, y: 520, scale: .58, flip: true },
    tutorial: [5, 6], brief: 'Beruang madu terkurung! Isi kolam dengan air sampai batu mengapung dan terdorong ke tombol merah untuk membuka kandang. Padamkan semua api.',
  },
  {
    id: 5, code: '1-5', name: 'Jungkat-Jungkit', width: 2300,
    supply: 100, waterBudget: 50, burnRate: .4, spreadDelay: 15, time: 160, critical: 35,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 1250, top: 548 },
      { x0: 1240, x1: 1330, top: 250, style: 'pillar' },
      { x0: 1320, x1: 2400, top: 520, style: 'pillar' },
    ],
    bridges: [],
    seesaw: { x: 980, y: 518, target: { x: 1420, y: 500 } },
    fires: [
      { x: 1180, y: 548, start: .45, growth: .0050, lit: true },
      { x: 1460, y: 520, start: .7, growth: .0070, lit: true },
      { x: 1580, y: 520, start: .7, growth: .0070, lit: true },
      { x: 1760, y: 520, start: .55, growth: .0060, lit: true },
      { x: 1880, y: 520, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-small', x: 1880, y: 528, scale: .7, fuel: 4 },
      { key: 'tree-c', x: 2200, y: 532, scale: .85 },
    ],
    animal: { key: 'bekantan', name: 'Bekantan', x: 2010, y: 520, scale: .6, flip: true },
    tutorial: [4, 6], brief: 'Tebing terlalu tinggi! Semprot ujung jungkat-jungkit yang terangkat agar tong air terlempar ke api di balik tebing.',
  },
  {
    id: 6, code: '1-6', name: 'Gua Sempit', width: 2400,
    supply: 100, waterBudget: 50, burnRate: .4, spreadDelay: 15, time: 170, critical: 35,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 980, top: 548 },
      { x0: 1100, x1: 2500, top: 470, style: 'pillar' },
    ],
    bridges: [],
    rocks: [{ x0: 1190, x1: 2500, y0: 150, y1: 362 }],
    hang: { anchorX: 1040, anchorY: 300, rope: 90, postX: 1110, groundY: 470, load: 'crate' },
    fires: [
      { x: 1330, y: 470, start: .4, growth: .0040, lit: true, max: .55 },
      { x: 1520, y: 470, start: .4, growth: .0040, lit: true, max: .55 },
      { x: 1720, y: 470, start: .4, growth: .0045, lit: true, max: .55 },
      { x: 1900, y: 470, start: .3, growth: .0030, lit: false, max: .5 },
    ],
    props: [],
    decor: [
      { key: 'tree-a', x: 60, y: 560, scale: 1 },
      { key: 'tree-c', x: 2350, y: 160, scale: .8 },
    ],
    animal: { key: 'trenggiling', name: 'Trenggiling', x: 2040, y: 470, scale: .7, flip: true },
    tutorial: [3, 5, 6], brief: 'Trenggiling terjebak di gua. Putuskan tali derek agar peti penutup gua jatuh, lalu semprot mendatar masuk celah sempit.',
  },
  {
    id: 7, code: '1-7', name: 'Puncak Rimba', width: 3000,
    supply: 100, waterBudget: 65, burnRate: .45, spreadDelay: 14, time: 220, critical: 40,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 700, top: 548 },
      { x0: 800, x1: 2050, top: 548 },
      { x0: 2040, x1: 2130, top: 250, style: 'pillar' },
      { x0: 2120, x1: 3100, top: 500, style: 'pillar' },
    ],
    bridges: [],
    floatGap: { x0: 700, x1: 800, need: 1 },
    seesaw: { x: 1780, y: 518, target: { x: 2180, y: 480 } },
    lever: { button: { x: 2520, y: 500 }, cage: { x: 2860, y: 500 } },
    fires: [
      { x: 1000, y: 548, start: .5, growth: .0055, lit: true },
      { x: 1300, y: 548, start: .55, growth: .0060, lit: true },
      { x: 2250, y: 500, start: .75, growth: .0075, lit: true },
      { x: 2370, y: 500, start: .75, growth: .0075, lit: true },
      { x: 2640, y: 500, start: .5, growth: .0060, lit: true },
      { x: 2780, y: 500, start: .3, growth: .0030, lit: false, max: .75 },
    ],
    props: [{ kind: 'crate', x: 640, y: 504 }, { kind: 'boulder', x: 2430, y: 455 }],
    decor: [
      { key: 'tree-b', x: 70, y: 560, scale: 1 },
      { key: 'tree-flower', x: 1300, y: 556, scale: .8, fuel: 1 },
      { key: 'tree-c', x: 2950, y: 512, scale: .85 },
    ],
    animal: { key: 'gajah', name: 'Gajah Sumatra', x: 2860, y: 500, scale: .62, flip: true },
    tutorial: [4, 5, 6], brief: 'Ujian terakhir: buat pijakan peti, lempar tong dengan jungkat-jungkit, lalu dorong batu ke tombol untuk membuka kandang gajah.',
  },
];

export const ANIMALS = [
  { key: 'rusa', name: 'Rusa Timor', level: 1 },
  { key: 'rangkong', name: 'Rangkong', level: 2 },
  { key: 'orangutan', name: 'Orangutan', level: 3 },
  { key: 'beruang', name: 'Beruang Madu', level: 4 },
  { key: 'bekantan', name: 'Bekantan', level: 5 },
  { key: 'trenggiling', name: 'Trenggiling', level: 6 },
  { key: 'gajah', name: 'Gajah Sumatra', level: 7 },
  { key: 'babi-hutan', name: 'Babi Hutan', level: 0 },
  { key: 'raja-udang', name: 'Raja Udang', level: 0 },
  { key: 'kura-kura', name: 'Kura-kura', level: 0 },
  { key: 'buaya', name: 'Buaya Muara', level: 0 },
  { key: 'komodo', name: 'Komodo', level: 0 },
  { key: 'ular', name: 'Ular Sanca', level: 0 },
  { key: 'berang', name: 'Berang-berang', level: 0 },
];
