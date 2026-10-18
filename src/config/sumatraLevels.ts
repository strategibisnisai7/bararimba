import type { LevelDef } from './levels';
import type { Point } from './level';

/** Raft on the underground river: pushed by the jet against the current. Docked slowly at `dock` it takes the animal
 * aboard, then the current ferries it back to `home`, where the animal steps off. Too fast and it bounces off the bank. */
export interface RaftDef { x: number; w: number; dock: [number, number]; home: number; current: number; walls: [number, number] }
/** Two platforms on one rope over pulleys at `pulleyY`: weight on one side lowers it and raises the other.
 * The `right` platform carries the animal; `done` when it reaches `topY`. */
export interface BalanceDef { left: { x: number; w: number }; right: { x: number; w: number }; pulleyY: number; mid: number; travel: number; topY: number; animalLoad: number }
/** Reflector panel hinged at its centre: water bounces off it. Spraying its handle steps it through `angles` (deg). */
export interface MirrorDef { x: number; y: number; len: number; angles: number[]; start: number; handle: Point }
/** Hinged bridge held by `locks`. A lock wrapped in fire (`fire` index) cannot be released until that fire is out.
 * Released, the deck swings under gravity; a boulder resting in `stopper` (an x range on the hinge side) catches it
 * level, otherwise it swings down and is winched back up. `angle0` 0 = level toward `dir`. */
export interface DrawbridgeDef { id: string; hingeX: number; hingeY: number; len: number; dir: 1 | -1; locks: { x: number; y: number; fire?: number }[];
  stopper?: { x0: number; x1: number }; gravity?: boolean; startAngle?: number }
/** Open water tank. `spray`: filled by the jet. Valves are spray-toggled handles that drain it to `out`.
 * `lift`: the tank hangs on a counterweight lift; its water raises the platform `travel` px (latched at the top). */
export interface BasinDef { id: string; x0: number; x1: number; floor: number; depth: number; spray?: boolean; leak?: number;
  /** `sweep`: while the valve runs, its surge carries loose rocks in this box downstream (+x). */
  valves?: { id: string; handle: Point; out: { x: number; y: number; vx: number }; rate: number; pipe?: Point[]; sweep?: { x0: number; x1: number; y0: number; y1: number } }[];
  lift?: { x: number; w: number; y: number; travel: number; need: number } }
/** Gate lifted by a chain from the water wheel: it rises while the wheel spins faster than `speed`, and locks open
 * once held fully up for `hold` s. */
export interface ChainGateDef { id: string; x: number; y0: number; y1: number; speed: number; hold: number }

/** Sumatra-only level data. Every mechanism is driven by the same water jet, Matter bodies and fires as Jawa. */
export interface SumatraDef {
  /** Rescue point. Once every id in `after` is done (gate open / mechanism finished) the animal walks along
   * the ground to the flag; it waits at closed gates, burning fires, gaps and loose rocks on its way. */
  rescue: { flagX: number; after?: string[]; speed?: number };
  /** Rope from a pressure button over a pulley to a gate (drawn; the button switch opens the gate). */
  ropes?: { from: Point; via: Point; gate: string }[];
  /** Dark cave interiors drawn behind a chamber. */
  chambers?: { x0: number; x1: number; y0: number; y1: number }[];
  raft?: RaftDef;
  balance?: BalanceDef;
  mirrors?: MirrorDef[];
  /** Fire `fire` going out opens gate `gate` (a burnt-through lock). */
  fireLocks?: { fire: number; gate: string }[];
  bridges?: DrawbridgeDef[];
  basins?: BasinDef[];
  chainGate?: ChainGateDef;
  /** Holes in the animal's path: walkable at `top` once a pushed boulder rests inside. */
  pits?: { x0: number; x1: number; top: number }[];
  /** No soft-lock: while mechanism `unless` is not done, a level boulder that sank, rolled past `lostX` or fell
   * below `lostY` comes back at its start. */
  respawn?: { lostX?: number; lostY?: number; unless: string };
  /** Mechanism ids the boss shield waits for (Level 10). */
  shield?: string[];
}

const cave = { theme: 'cave' as const, region: 'sumatra' as const };

export const SUMATRA_LEVELS: LevelDef[] = [
  {
    // Vertical slice. Push the moss boulder off the ledge onto the pressure stone: the rope over the pulley
    // hauls the carved cave door up. Put out the fire in front of the cave and the calf walks to the flag.
    ...cave, id: 16, code: '2-1', name: 'Batu Pembuka', width: 2150,
    supply: 100, waterBudget: 55, burnRate: .3, spreadDelay: 16,
    truckX: 230, driveMin: 160, driveMax: 470,
    lands: [{ x0: -80, x1: 2300, top: 548 }], bridges: [],
    rocks: [
      { x0: 700, x1: 960, y0: 380, y1: 428 },        // ledge holding the boulder
      { x0: 1330, x1: 1900, y0: 250, y1: 372 },      // cave roof
      { x0: 1830, x1: 1900, y0: 372, y1: 548 },      // cave back wall
    ],
    gates: [{ id: 'cave', x: 1372, y0: 372, y1: 548, style: 'stone' }],
    switches: [{ kind: 'button', x: 1030, y: 548, opens: 'cave' }],
    props: [{ kind: 'boulder', x: 800, y: 336 }],
    fires: [
      { x: 900, y: 380, start: .45, growth: .0040, lit: true, max: .8 },
      { x: 1240, y: 548, start: .55, growth: .0050, lit: true },
      { x: 1110, y: 548, start: .3, growth: .0030, lit: false, max: .7 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 70, y: 556, scale: .9 },
      { key: 'sm-fern-a', x: 600, y: 552, scale: .7 },
      { key: 'sm-bush-red', x: 1110, y: 554, scale: .6, fuel: 2 },
      { key: 'sm-spire-b', x: 1700, y: 380, scale: .55, back: true },
      { key: 'sm-palm-b', x: 2060, y: 556, scale: .85 },
    ],
    sm: {
      rescue: { flagX: 1160, after: ['cave'] },
      respawn: { lostX: 1300, unless: 'cave' },
      ropes: [{ from: { x: 1030, y: 540 }, via: { x: 1300, y: 300 }, gate: 'cave' }],
      chambers: [{ x0: 1340, x1: 1850, y0: 360, y1: 548 }],
    },
    animal: { key: 'anak-gajah', name: 'Anak Gajah Sumatra', x: 1600, y: 548, scale: .9, flip: true, frames: ['sm-gajah-b', 'sm-gajah-c'] },
    tutorial: [4, 6], brief: 'Anak gajah terkurung di goa! Semprot batu berlumut dari tebing ke batu tekan — tali katrol mengangkat pintu goa. Padamkan api di depan goa supaya anak gajah bisa berjalan ke bendera.',
  },
  {
    // Mission 2: Rakit Penyelamat. Push the empty raft upstream against the current and let it settle at the
    // island dock (too hard and it bounces off the cliff). Put out the fire so the tapir can board; the current
    // ferries raft and tapir home, where it walks to the flag.
    ...cave, id: 17, code: '2-2', name: 'Rakit Penyelamat', width: 1900,
    supply: 100, waterBudget: 60, burnRate: .32, spreadDelay: 16,
    truckX: 200, driveMin: 160, driveMax: 380,
    lands: [{ x0: -80, x1: 640, top: 548 }, { x0: 1350, x1: 2000, top: 548 }], bridges: [],
    rocks: [{ x0: 1350, x1: 1420, y0: 470, y1: 548 }],
    fires: [
      { x: 1460, y: 548, start: .55, growth: .0050, lit: true },
      { x: 1390, y: 470, start: .3, growth: .0030, lit: false, max: .7 },
    ],
    props: [],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-falls-tall', x: 1000, y: 600, scale: 1.4, back: true },
      { key: 'sm-fern-a', x: 1390, y: 476, scale: .55, fuel: 1 },
      { key: 'sm-palm-b', x: 1820, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 560, after: ['raft'] },
      raft: { x: 760, w: 190, dock: [1190, 1262], home: 742, current: -12, walls: [646, 1352] },
    },
    animal: { key: 'tapir', name: 'Tapir', x: 1600, y: 548, scale: .8, flip: true, frames: ['sm-tapir-b', 'sm-tapir-c'] },
    tutorial: [3, 6], brief: 'Tapir terjebak di pulau! Semprot rakit melawan arus sampai tertambat pelan di dermaga pulau — terlalu kencang, rakit terpental. Padamkan api agar tapir bisa naik; arus membawa rakit pulang.',
  },
  {
    // Mission 3: Katrol dan Beban Ganda. A boulder pushed onto the left platform outweighs the orangutan:
    // the right platform rises to the cliff, then the fire on the cliff path must go out.
    ...cave, id: 18, code: '2-3', name: 'Katrol Beban Ganda', width: 2000,
    supply: 100, waterBudget: 65, burnRate: .34, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 450,
    lands: [{ x0: -80, x1: 700, top: 548 }, { x0: 1380, x1: 2100, top: 400 }], bridges: [],
    // Ledge with the boulder, the pulley rig's centre post (it also stops a boulder that flies too far) and the cliff.
    rocks: [{ x0: 740, x1: 960, y0: 330, y1: 380 }, { x0: 1148, x1: 1182, y0: 150, y1: 720 }, { x0: 1380, x1: 2100, y0: 400, y1: 548 }],
    fires: [
      { x: 1490, y: 400, start: .55, growth: .0050, lit: true },
      { x: 880, y: 330, start: .4, growth: .0040, lit: true, max: .7 },
      { x: 1620, y: 400, start: .3, growth: .0030, lit: false, max: .7 },
    ],
    props: [{ kind: 'boulder', x: 790, y: 286 }],
    decor: [
      { key: 'sm-palm-b', x: 60, y: 556, scale: .9 },
      { key: 'sm-vines', x: 1180, y: 60, scale: 1, back: true },
      { key: 'sm-bush-red', x: 1620, y: 406, scale: .55, fuel: 2 },
      { key: 'sm-palm-a', x: 1920, y: 408, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 1700, after: ['balance'] },
      respawn: { lostY: 600, unless: 'balance' },
      balance: { left: { x: 1050, w: 150 }, right: { x: 1300, w: 150 }, pulleyY: 120, mid: 500, travel: 110, topY: 400, animalLoad: 1.5 },
    },
    animal: { key: 'orangutan', name: 'Orangutan Sumatra', x: 1300, y: 570, scale: .55, flip: true },
    tutorial: [4, 6], brief: 'Orangutan di platform katrol yang terlalu rendah. Dorong batu ke platform kiri — beratnya mengangkat platform orangutan ke tebing. Lalu padamkan api di jalur tebing.',
  },
  {
    // Mission 4: Pantulan Semburan. The lock holding the drawbridge burns under a rock roof the jet cannot reach.
    // Turn the reflector panel (spray its handle) until a lob bounces off it into the hollow; then release the lock.
    ...cave, id: 19, code: '2-4', name: 'Pantulan Semburan', width: 1800,
    supply: 100, waterBudget: 70, burnRate: .34, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 330,
    lands: [{ x0: -80, x1: 560, top: 548 }, { x0: 650, x1: 930, top: 548 }, { x0: 1150, x1: 1900, top: 548 }], bridges: [],
    rocks: [{ x0: 560, x1: 650, y0: 150, y1: 548 }, { x0: 560, x1: 930, y0: 150, y1: 205 }],
    fires: [
      { x: 860, y: 548, start: .55, growth: .0045, lit: true, max: 1 },
      { x: 1330, y: 548, start: .45, growth: .0045, lit: true, max: .9 },
    ],
    props: [],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-spire-d', x: 1500, y: 556, scale: .8, back: true },
      { key: 'sm-palm-b', x: 1740, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 1480, after: ['bridge'] },
      mirrors: [{ x: 1250, y: 250, len: 130, angles: [20, 110, 160], start: 0, handle: { x: 540, y: 470 } }],
      bridges: [{ id: 'bridge', hingeX: 930, hingeY: 548, len: 225, dir: 1, locks: [{ x: 900, y: 470, fire: 0 }] }],
      chambers: [{ x0: 650, x1: 930, y0: 205, y1: 548 }],
    },
    animal: { key: 'harimau', name: 'Harimau Sumatra', x: 760, y: 548, scale: .95, flip: false, frames: ['sm-harimau-b', 'sm-harimau-c'] },
    tutorial: [3, 6], brief: 'Harimau terkurung di ceruk batu. Api membakar pengunci jembatan dan tak terjangkau langsung. Semprot gagang panel pemantul untuk memutarnya, lalu lob air ke panel agar memantul ke ceruk. Padamkan api, lepaskan pengunci.',
  },
  {
    // Mission 5: Bak Air Pengangkat. Fill the high tank, open its valve to feed the lift tank under the roof; the
    // full tank raises the bear's lift to the ledge (latched). Then the ledge fire.
    ...cave, id: 20, code: '2-5', name: 'Bak Air Pengangkat', width: 1900,
    supply: 100, waterBudget: 80, burnRate: .34, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 360,
    lands: [{ x0: -80, x1: 860, top: 548 }, { x0: 1360, x1: 2000, top: 390 }], bridges: [],
    rocks: [{ x0: 880, x1: 1080, y0: 390, y1: 548 }, { x0: 1080, x1: 1230, y0: 418, y1: 444 }, { x0: 1360, x1: 2000, y0: 390, y1: 548 }],
    fires: [
      { x: 1420, y: 390, start: .55, growth: .0050, lit: true },
      { x: 1560, y: 390, start: .3, growth: .0030, lit: false, max: .7 },
      { x: 700, y: 548, start: .45, growth: .0045, lit: true, max: .8 },
    ],
    props: [],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-fern-a', x: 1560, y: 396, scale: .55, fuel: 1 },
      { key: 'sm-palm-b', x: 1850, y: 398, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 1680, after: ['lift'] },
      basins: [
        { id: 'tank', x0: 900, x1: 1062, floor: 380, depth: 60, spray: true,
          valves: [{ id: 'v1', handle: { x: 862, y: 505 }, out: { x: 1100, y: 462, vx: 40 }, rate: 70, pipe: [{ x: 1062, y: 374 }, { x: 1086, y: 374 }, { x: 1086, y: 462 }, { x: 1098, y: 462 }] }] },
        { id: 'lift', x0: 1092, x1: 1214, floor: 540, depth: 60, leak: 3, lift: { x: 1290, w: 140, y: 560, travel: 170, need: 100 } },
      ],
    },
    animal: { key: 'beruang', name: 'Beruang Madu', x: 1290, y: 560, scale: .62, flip: false },
    tutorial: [5, 6], brief: 'Beruang madu di platform pengangkat. Isi bak atas dengan semprotan, lalu semprot katup agar air mengalir ke bak pengangkat di bawah atap. Bak penuh mengangkat platform ke tebing. Padamkan api di tebing.',
  },
  {
    // Mission 6: Kincir Arus Goa. Push the boulder into the pit so the path is whole, spin the water wheel and keep it
    // spinning until the chain locks the cave door open, then put out the fire at the door.
    ...cave, id: 21, code: '2-6', name: 'Kincir Arus Goa', width: 2100,
    supply: 100, waterBudget: 85, burnRate: .36, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 420,
    lands: [{ x0: -80, x1: 1120, top: 548 }, { x0: 1120, x1: 1200, top: 622 }, { x0: 1200, x1: 2200, top: 548 }], bridges: [],
    rocks: [{ x0: 1330, x1: 1950, y0: 250, y1: 380 }, { x0: 1880, x1: 1950, y0: 380, y1: 548 }],
    wheel: { x: 1180, y: 250, r: 50 },
    fires: [
      { x: 1260, y: 548, start: .55, growth: .0050, lit: true },
      { x: 860, y: 548, start: .45, growth: .0045, lit: true, max: .8 },
    ],
    props: [{ kind: 'boulder', x: 1040, y: 506 }],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-palm-b', x: 2050, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 960, after: ['chain'] },
      respawn: { lostX: 1215, unless: 'pit' },
      chainGate: { id: 'chain', x: 1372, y0: 380, y1: 548, speed: 2.4, hold: 2.5 },
      pits: [{ x0: 1120, x1: 1200, top: 548 }],
      chambers: [{ x0: 1340, x1: 1900, y0: 370, y1: 548 }],
    },
    animal: { key: 'orangutan', name: 'Orangutan Sumatra', x: 1650, y: 548, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Orangutan terkurung di goa berpintu rantai. Dorong batu ke lubang agar jalur utuh. Semprot kincir terus-menerus — rantai menarik pintu dan terkunci bila kincir cukup lama berputar. Padamkan api di depan pintu.',
  },
  {
    // Mission 7: Jembatan Jatuh. Put out the fire on the first lock, roll the boulder from the ledge into the stopper
    // socket behind the hinge, then release both locks: the bridge swings down and stops level. No stopper: it swings
    // past and is winched back up.
    ...cave, id: 22, code: '2-7', name: 'Jembatan Jatuh', width: 2000,
    supply: 100, waterBudget: 80, burnRate: .36, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 300,
    lands: [{ x0: -80, x1: 720, top: 548 }, { x0: 1000, x1: 1300, top: 548 }, { x0: 1300, x1: 1480, top: 622 }, { x0: 1480, x1: 2100, top: 548 }], bridges: [],
    // Overhang holding the stopper boulder; the socket lies just past its end.
    rocks: [{ x0: 1110, x1: 1300, y0: 360, y1: 400 }],
    fires: [
      { x: 1250, y: 360, start: .55, growth: .0045, lit: true, max: 1 },
      { x: 1560, y: 548, start: .5, growth: .0050, lit: true, max: .9 },
    ],
    props: [{ kind: 'boulder', x: 1160, y: 316 }],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-falls-tall', x: 860, y: 640, scale: 1.3, back: true },
      { key: 'sm-palm-b', x: 1950, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 560, after: ['bridge'] },
      respawn: { lostX: 1500, unless: 'bridge' },
      bridges: [{ id: 'bridge', hingeX: 1000, hingeY: 548, len: 285, dir: -1, locks: [{ x: 1250, y: 236, fire: 0 }, { x: 960, y: 300 }], stopper: { x0: 1300, x1: 1480 } }],
      pits: [{ x0: 1300, x1: 1480, top: 548 }],
    },
    animal: { key: 'harimau', name: 'Harimau Sumatra', x: 1650, y: 548, scale: .95, flip: true, frames: ['sm-harimau-b', 'sm-harimau-c'] },
    tutorial: [4, 6], brief: 'Jembatan harus dijatuhkan! Padamkan api yang membakar pengunci di tebing, dorong batu dari tebing ke ceruk penahan, lalu semprot kedua pengunci. Tanpa batu penahan, jembatan terayun lewat dan ditarik naik lagi.',
  },
  {
    // Mission 8: Bendungan Gambut. Fill the peat-swamp dam by spraying it; each valve drains to its own channel.
    // The low spout floods the covered trench fire; the high channel washes the boulder onto the gate stone.
    ...cave, id: 23, code: '2-8', name: 'Bendungan Gambut', width: 2000,
    supply: 100, waterBudget: 90, burnRate: .36, spreadDelay: 15,
    truckX: 200, driveMin: 160, driveMax: 330,
    lands: [{ x0: -80, x1: 2100, top: 548 }], bridges: [],
    rocks: [
      { x0: 660, x1: 880, y0: 370, y1: 548 },
      { x0: 880, x1: 1130, y0: 430, y1: 460 },
      { x0: 880, x1: 1220, y0: 296, y1: 320 },
    ],
    gates: [{ id: 'exit', x: 1520, y0: 380, y1: 548, style: 'stone' }],
    switches: [{ kind: 'button', x: 1290, y: 548, opens: 'exit' }],
    fires: [
      { x: 1010, y: 548, start: .55, growth: .0045, lit: true, max: 1 },
      { x: 1000, y: 296, start: .45, growth: .0045, lit: true, max: .8 },
    ],
    props: [{ kind: 'boulder', x: 1110, y: 252 }],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-jungle-bush', x: 1700, y: 556, scale: .7 },
      { key: 'sm-palm-b', x: 1950, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 1760, after: ['exit'] },
      respawn: { lostX: 1480, unless: 'exit' },
      basins: [{ id: 'dam', x0: 690, x1: 860, floor: 360, depth: 70, spray: true, valves: [
        { id: 'low', handle: { x: 642, y: 520 }, out: { x: 900, y: 500, vx: 60 }, rate: 60, pipe: [{ x: 860, y: 354 }, { x: 890, y: 354 }, { x: 890, y: 500 }, { x: 900, y: 500 }] },
        { id: 'high', handle: { x: 960, y: 205 }, out: { x: 892, y: 286, vx: 90 }, rate: 70, pipe: [{ x: 860, y: 296 }, { x: 880, y: 296 }, { x: 890, y: 286 }], sweep: { x0: 880, x1: 1240, y0: 200, y1: 296 } },
      ] }],
    },
    animal: { key: 'rusa-sumatra', name: 'Rusa Sambar', x: 1440, y: 548, scale: .9, flip: false, frames: ['sm-rusa-sumatra-b'] },
    tutorial: [5, 6], brief: 'Rusa terkurung di rawa gambut. Isi bendungan dengan semprotan. Katup bawah mengalirkan air ke api di parit tertutup; katup atas mengalirkan air di saluran yang mendorong batu ke batu tekan pembuka pintu.',
  },
  {
    // Mission 9: Rantai Penyelamatan Gajah. Put out the fire on the log's chain post before releasing it: the hinged
    // log falls across the river as a bridge. Push the boulder onto the ledge stone to haul the cave door up.
    ...cave, id: 24, code: '2-9', name: 'Rantai Penyelamatan Gajah', width: 2000,
    supply: 100, waterBudget: 90, burnRate: .38, spreadDelay: 14,
    truckX: 200, driveMin: 160, driveMax: 300,
    lands: [{ x0: -80, x1: 650, top: 548 }, { x0: 900, x1: 2100, top: 548 }], bridges: [],
    // Ledge with boulder and pressure stone, the chain-post pillar in the river, cave roof and back wall.
    rocks: [{ x0: 1050, x1: 1230, y0: 340, y1: 390 }, { x0: 770, x1: 830, y0: 556, y1: 700 }, { x0: 1310, x1: 1800, y0: 250, y1: 372 }, { x0: 1740, x1: 1800, y0: 372, y1: 548 }],
    gates: [{ id: 'cave', x: 1350, y0: 372, y1: 548, style: 'stone' }],
    switches: [{ kind: 'button', x: 1200, y: 340, opens: 'cave' }],
    fires: [
      { x: 800, y: 556, start: .55, growth: .0045, lit: true, max: .9 },
      { x: 1275, y: 548, start: .5, growth: .0050, lit: true, max: .9 },
      { x: 1080, y: 340, start: .3, growth: .0030, lit: false, max: .6 },
    ],
    props: [{ kind: 'boulder', x: 1095, y: 296 }],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-falls-tall', x: 780, y: 650, scale: 1.3, back: true },
      { key: 'sm-palm-b', x: 1950, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 560, after: ['bridge', 'cave'] },
      respawn: { lostY: 420, unless: 'cave' },
      bridges: [{ id: 'bridge', hingeX: 900, hingeY: 548, len: 262, dir: -1, locks: [{ x: 800, y: 500, fire: 0 }] }],
      ropes: [{ from: { x: 1200, y: 334 }, via: { x: 1290, y: 290 }, gate: 'cave' }],
      chambers: [{ x0: 1320, x1: 1750, y0: 360, y1: 548 }],
    },
    animal: { key: 'anak-gajah', name: 'Anak Gajah Sumatra', x: 1560, y: 548, scale: .9, flip: true, frames: ['sm-gajah-b', 'sm-gajah-c'] },
    tutorial: [4, 6], brief: 'Urutan penting! Padamkan api di tiang rantai di sungai sebelum melepas kayu berengsel — kayu jatuh menjadi jembatan. Dorong batu ke batu tekan di tebing untuk menarik pintu goa, padamkan api di jalur, lalu anak gajah menyeberang.',
  },
  {
    // Mission 10 finale: Duel Tekanan. The boss is shielded until the arena's two mechanisms run: hit the valve
    // target and spin the gear wheel. Then wear it down under fireballs (pressure meter), and walk the orangutans out.
    ...cave, id: 25, code: '2-10', name: 'Duel Tekanan Goa Api', width: 3000,
    supply: 200, waterBudget: 200, burnRate: .3, spreadDelay: 16,
    truckX: 230, driveMin: 160,
    lands: [
      { x0: -80, x1: 900, top: 548 },
      { x0: 1240, x1: 1650, top: 520 },
      { x0: 1900, x1: 2150, top: 470 },
      { x0: 2140, x1: 2380, top: 395 },
      { x0: 2370, x1: 2560, top: 330 },
      { x0: 2550, x1: 3100, top: 430 },
    ],
    bridges: [{ x0: 888, x1: 1252, y: 540 }],
    rocks: [{ x0: 1300, x1: 1440, y0: 300, y1: 342 }],
    gates: [{ id: 'valve', x: 1600, y0: 380, y1: 520, style: 'stone' }, { id: 'gear', x: 1620, y0: 220, y1: 300, style: 'stone' }],
    switches: [{ kind: 'target', x: 1250, y: 330, opens: 'valve' }, { kind: 'wheel', x: 780, y: 400, opens: 'gear', need: 20 }],
    wheel: { x: 780, y: 400, r: 46 },
    // The package has no Penjaga Goa sprite (its 07 crop holds orangutans only), so the Jawa boss art and HUD return here.
    boss: { x: 2265, y: 395, hp: 110, arena: 1650, perches: [{ x: 2020, y: 470 }, { x: 2265, y: 395 }, { x: 2470, y: 330 }, { x: 2650, y: 430 }] },
    fires: [
      { x: 1500, y: 520, start: .55, growth: .0050, lit: true },
      { x: 600, y: 548, start: .45, growth: .0045, lit: true },
    ],
    props: [],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: 1 },
      { key: 'sm-spire-d', x: 2900, y: 436, scale: .9 },
      { key: 'sm-falls-tall', x: 1070, y: 660, scale: 1.5, back: true },
    ],
    sm: {
      rescue: { flagX: 2950, after: ['boss'] },
      shield: ['valve', 'gear'],
    },
    animal: { key: 'orangutan-sit', name: 'Keluarga Orangutan', x: 2820, y: 430, scale: .62, flip: true },
    tutorial: [6], brief: 'Pembakar Hutan bersembunyi di goa api dan berperisai! Tembak target katup dan putar kincir roda gigi untuk meruntuhkan perisainya. Tahan bola api, jaga tekanan air, lalu semprot sampai ia kalah dan keluarga orangutan bisa keluar.',
  },
];
