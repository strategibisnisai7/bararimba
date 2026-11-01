import type { LevelDef } from './levels';

export interface PapuaDef {
  roofButton?: { x: number; y: number };
  liftX?: number;
  ferryX?: number;
}

/** Sprinkle Islands Inspired: Multi-floor arena with descending lift, sailing ferry boat, steep hills and honai huts. */
export const PAPUA_LEVELS: LevelDef[] = [
  {
    theme: 'papua', region: 'papua', id: 66, code: 'P-1', name: 'Ekspedisi Lembah Honai & Lift Gua', width: 3100,
    supply: 150, waterBudget: 110, burnRate: .28, spreadDelay: 20,
    truckX: 200, driveMin: 140, driveMax: 2020,
    lands: [
      { x0: -80, x1: 380, top: 546 },
      { x0: 710, x1: 850, top: 450 },
      { x0: 1000, x1: 1120, top: 560 },
      { x0: 1780, x1: 3200, top: 560 },
    ],
    bridges: [],
    terrain: [
      { key: 'ramp', x: 380, y: 450, base: true },
    ],
    lift: { x: 880, y0: 464, y1: 574, w: 240, bucket: { x: 1040, y: 250, need: 16 } },
    ferry: { x0: 1120, x1: 1780, y: 574, w: 260 },
    rocks: [
      { x0: 1420, x1: 1520, y0: 360, y1: 580, stone: true },
      { x0: 2000, x1: 2450, y0: 220, y1: 240, stone: true },
      { x0: 2430, x1: 2470, y0: 150, y1: 240, stone: true },
      { x0: 2150, x1: 2480, y0: 350, y1: 370, stone: true },
      { x0: 2250, x1: 2480, y0: 480, y1: 500, stone: true },
    ],
    lever: { button: { x: 2360, y: 220 }, cage: { x: 2380, y: 350 } },
    props: [
      { kind: 'ice-block', x: 2250, y: 190 },
    ],
    fires: [
      { x: 1470, y: 360, start: .5, growth: .0050, lit: true },
      { x: 2280, y: 350, start: .6, growth: .0055, lit: true },
      { x: 2320, y: 480, start: .6, growth: .0055, lit: true },
    ],
    decor: [
      { key: 'papua-honai', x: 2240, y: 350, scale: .72 },
      { key: 'papua-honai', x: 2260, y: 480, scale: .76 },
    ],
    animal: { key: 'rangkong', name: 'Rangkong Papua', x: 2380, y: 350, scale: .62, flip: true },
    tutorial: [3, 4, 6],
    brief: 'Ekspedisi Lembah Honai & Lift Gua Papua! Daki tanjakan bukit terjal ke stasiun lift, semprot ember hidrolik untuk turun ke danau, naiki kapal feri dan berlayar menyeberangi danau bawah tanah. Di seberang, semprot balok es di atap arena bertingkat agar meluncur menekan tombol pembuka gerbang lantai 2, lalu padamkan api desa Honai untuk menyelamatkan Rangkong Papua!',
    papua: {
      roofButton: { x: 2350, y: 220 },
      liftX: 880,
      ferryX: 1120,
    },
  },
];
