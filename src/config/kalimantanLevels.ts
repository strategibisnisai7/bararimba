import type { LevelDef } from './levels';

// Kalimantan, 30 levels (ids 36-65, codes 3-1..3-30) after referensiasset/BaraRimba_Kalimantan_All_Levels: each level
// follows its pack's mission order (config/levelN_missions.json) with the shared mechanisms and the Kalimantan kit.
// Every level has a water tower at the truck's working spot, so a wasted approach never ends the rescue.
const peat = { theme: 'peat' as const, region: 'kalimantan' as const, supply: 130, burnRate: .3, spreadDelay: 16,
  truckX: 200, driveMin: 160, refill: { x: 220, half: 180 } };
const palms = (...xs: number[]) => xs.map((x, i) => ({ key: i % 2 ? 'sm-palm-b' : 'sm-palm-a', x, y: 556, scale: .9 }));
// Recurring kit pieces from the packs. Sluices/cranks are set with + and − paddles; winches (root tension) and pumps
// (siphon priming) are pulled with water and slacken back.
type Dial = NonNullable<NonNullable<NonNullable<LevelDef['sm']>['kit']>['dials']>[number];
const sluice = (id: string, label: string, x: number, y: number, band: [number, number], more: Partial<Dial> = {}): Dial =>
  ({ id, label, x, y, band, kind: 'sluice', mode: 'set', start: 0, hold: 1.5, ...more });
const crank = (id: string, label: string, x: number, y: number, more: Partial<Dial> = {}): Dial =>
  ({ id, label, x, y, band: [.85, 1], kind: 'crank', mode: 'set', start: 0, ...more });
const winch = (id: string, label: string, x: number, y: number, more: Partial<Dial> = {}): Dial =>
  ({ id, label, x, y, band: [.65, .9], snap: .97, spring: .08, hold: 1, kind: 'winch', mode: 'pull', ...more });
const pump = (id: string, label: string, x: number, y: number, more: Partial<Dial> = {}): Dial =>
  ({ id, label, x, y, band: [.6, 1], spring: .12, hold: 2, kind: 'pump', mode: 'pull', ...more });
const fire = (x: number, y = 548, max = 1, lit = true) => ({ x, y, start: lit ? .5 : .3, growth: lit ? .004 : .003, lit, max });

export const KALIMANTAN_LEVELS: LevelDef[] = [
  {
    // 3-1 Bara di Tepi Sungai: fires A/B, log A into the brake socket, spin the wheel to raise the sluice, the bridge
    // lowers once both are set; fire C by the nest, then the orangutan crosses.
    ...peat, id: 36, code: '3-1', name: 'Bara di Tepi Sungai', width: 2100, waterBudget: 60,
    driveMax: 300,
    // The brake socket is a pocket in the bank: the seated log lies flush with the path.
    lands: [{ x0: -80, x1: 870, top: 548 }, { x0: 870, x1: 1010, top: 612 }, { x0: 1340, x1: 2200, top: 548 }], bridges: [],
    rocks: [{ x0: 1010, x1: 1022, y0: 560, y1: 640 }],
    wheel: { x: 1160, y: 440, r: 52 },
    gates: [{ id: 'pintu-air', x: 1255, y0: 430, y1: 600 }],
    switches: [{ kind: 'wheel', x: 1160, y: 440, opens: 'pintu-air', need: 20 }],
    props: [{ kind: 'log', x: 760, y: 514 }],
    fires: [
      { x: 670, y: 548, start: .5, growth: .004, lit: true },
      { x: 820, y: 548, start: .45, growth: .004, lit: true, max: .9 },
      { x: 1530, y: 548, start: .55, growth: .005, lit: true },
      { x: 1660, y: 548, start: .3, growth: .003, lit: false, max: .7 },
    ],
    decor: [...palms(60, 2040), { key: 'sm-aframe', x: 1160, y: 640, scale: 1.2, back: true }, { key: 'k-sluice', x: 1255, y: 640, scale: .55, back: true },
      { key: 'sm-bush-red', x: 1660, y: 554, scale: .6, fuel: 3 }, { key: 'tree-b', x: 1880, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 640, after: ['jembatan'] },
      bridges: [{ id: 'jembatan', hingeX: 1340, hingeY: 548, len: 330, dir: -1, locks: [], after: ['pintu-air', 'soket-a'] }],
      pits: [{ x0: 870, x1: 1010, top: 548 }],
      kit: {
        steps: [
          { title: 'Padamkan api A dan B', need: ['fire:0', 'fire:1'] },
          { title: 'Dorong gelondongan ke soket penahan', need: ['soket-a'] },
          { title: 'Putar kincir — pintu air terangkat', need: ['pintu-air'] },
          { title: 'Jembatan turun', need: ['jembatan'] },
          { title: 'Padamkan api C, orangutan ke bendera', need: ['fire:2'] },
        ],
        sockets: [{ id: 'soket-a', x0: 870, x1: 1010 }],
      },
    },
    animal: { key: 'orangutan', name: 'Orangutan Kalimantan', x: 1800, y: 548, scale: .6, flip: true },
    tutorial: [3, 6], brief: 'Bara di tepi sungai hitam! Padamkan api A dan B, dorong gelondongan ke soket penahan, lalu semprot kincir di atas porosnya — pintu air terangkat dan jembatan turun. Padamkan api dekat sarang agar orangutan bisa menyeberang. Ikuti panah kuning.',
  },
  {
    // 3-2 Kayu Menghalangi Arus: the rack rope burns; the bypass lever set to the middle lifts the rack; the bypass gate
    // releases the side channel, whose surge shoves the logs into the gap where they float as a crossing.
    ...peat, id: 37, code: '3-2', name: 'Kayu Menghalangi Arus', width: 2000, waterBudget: 65,
    lands: [{ x0: -80, x1: 900, top: 548 }, { x0: 1150, x1: 2100, top: 548 }], bridges: [],
    floatGap: { x0: 900, x1: 1150, need: 2 },
    rocks: [{ x0: 470, x1: 720, y0: 120, y1: 150 }],
    gates: [{ id: 'rak', x: 845, y0: 440, y1: 548 }, { id: 'bypass', x: 712, y0: 66, y1: 120 }],
    switches: [{ kind: 'target', x: 790, y: 210, opens: 'bypass', need: 18 }],
    reservoirs: [{ x0: 500, x1: 690, floor: 120, depth: 46, gate: 'bypass', out: { x: 730, y: 112, vx: 90 }, amount: 600 }],
    props: [{ kind: 'log', x: 640, y: 514 }, { kind: 'log', x: 770, y: 514 }],
    fires: [
      { x: 860, y: 440, start: .5, growth: .004, lit: true, max: .8 },
      { x: 1300, y: 548, start: .55, growth: .005, lit: true },
    ],
    decor: [...palms(60, 1940), { key: 'sm-jungle-bush', x: 1500, y: 556, scale: .7 }, { key: 'tree-c', x: 1760, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 600, after: ['floatgap', 'rak'] },
      respawn: { minX: 420, unless: 'floatgap' },
      kit: {
        steps: [
          { title: 'Padamkan bara di tali rak sampah', need: ['fire:0'] },
          { title: 'Setel tuas bypass ke tengah — rak terangkat', need: ['tuas'] },
          { title: 'Buka pintu bypass — arus mendorong kayu', need: ['bypass'] },
          { title: 'Susun dua gelondongan di celah air', need: ['floatgap'] },
          { title: 'Padamkan api seberang, selamatkan bekantan', need: ['fire:1'] },
        ],
        dials: [{ id: 'tuas', x: 720, y: 400, label: 'Tuas bypass', kind: 'crank', mode: 'set', start: 0, band: [.4, .6], after: ['fire:0'], opens: 'rak' }],
      },
    },
    animal: { key: 'bekantan', name: 'Bekantan', x: 1650, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Rak sampah menahan kayu dan talinya terbakar. Padamkan baranya, setel tuas bypass ke TENGAH (zona hijau) sampai rak terangkat, lalu tembak sasaran pintu bypass. Arus samping mendorong kayu ke celah — dua gelondongan menjadi lintasan bekantan.',
  },
  {
    // 3-3 Rawa yang Bergerak: put out the peat fire, lock the root anchor so the two peat mats stop drifting, seat two
    // logs on the root pier between them as load beams; the bekantan crosses mat - beams - mat.
    ...peat, id: 38, code: '3-3', name: 'Rawa yang Bergerak', width: 2100, waterBudget: 65,
    lands: [{ x0: -80, x1: 820, top: 548 }, { x0: 1540, x1: 2200, top: 548 }], bridges: [],
    // Peat mat 1 (collision for the logs sliding over it) and the root pier the beams rest on.
    rocks: [{ x0: 820, x1: 1060, y0: 556, y1: 600 }, { x0: 1060, x1: 1320, y0: 590, y1: 640 }, { x0: 1320, x1: 1540, y0: 556, y1: 600 }],
    props: [{ kind: 'log', x: 640, y: 514 }, { kind: 'log', x: 770, y: 514 }],
    fires: [
      { x: 700, y: 548, start: .5, growth: .004, lit: true, max: .9 },
      { x: 1680, y: 548, start: .55, growth: .005, lit: true },
    ],
    decor: [...palms(60, 2020), { key: 'sm-fern-root', x: 1000, y: 562, scale: .6 }, { key: 'tree-a', x: 1850, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 600, after: ['rawa', 'balok-a', 'balok-b'] },
      respawn: { minX: 420, lostY: 620, unless: 'balok-b' },
      kit: {
        steps: [
          { title: 'Padamkan bara gambut', need: ['fire:0'] },
          { title: 'Kunci jangkar akar', need: ['jangkar'] },
          { title: 'Pasang dua gelondongan di dermaga akar', need: ['balok-a', 'balok-b'] },
          { title: 'Padamkan api seberang, bekantan menyeberang', need: ['fire:1'] },
        ],
        dials: [{ id: 'jangkar', x: 960, y: 470, label: 'Jangkar akar', kind: 'crank', mode: 'set', start: 0, band: [.85, 1], after: ['fire:0'] }],
        sockets: [{ id: 'balok-a', x0: 1060, x1: 1190, top: 552 }, { id: 'balok-b', x0: 1190, x1: 1320, top: 552 }],
        floats: [{ id: 'rawa', x0: 820, x1: 1060, y: 556, after: ['jangkar'] }, { id: 'rawa-2', x0: 1320, x1: 1540, y: 556, after: ['jangkar'] }],
      },
    },
    animal: { key: 'bekantan', name: 'Bekantan', x: 1850, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Tikar gambut mengapung dan bergoyang. Padamkan bara, kunci jangkar akar (zona hijau di atas), lalu dorong dua gelondongan ke dermaga akar sebagai balok pembagi beban. Lintasan tikar–balok–tikar membawa bekantan pulang.',
  },
  {
    // 3-4 Dermaga Terapung: the guard post roof burns; lower the crane twice to fit two float drums under the broken
    // dock; set the sluice so the channel is calm; push the floating dock to the far landing; the sun bear cub boards.
    ...peat, id: 39, code: '3-4', name: 'Dermaga Terapung', width: 2050, waterBudget: 70,
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1500, x1: 2150, top: 548 }], bridges: [],
    rocks: [{ x0: 660, x1: 780, y0: 420, y1: 440 }],
    props: [],
    fires: [
      { x: 720, y: 420, start: .5, growth: .004, lit: true, max: .9 },
      { x: 1580, y: 548, start: .55, growth: .005, lit: true },
    ],
    decor: [...palms(60, 1990), { key: 'sm-post', x: 670, y: 556, scale: .5 }, { key: 'sm-post', x: 770, y: 556, scale: .5 }, { key: 'tree-flower', x: 1820, y: 556, scale: .7 }],
    sm: {
      rescue: { flagX: 880, after: ['raft'] },
      raft: { x: 1110, w: 190, dock: [1320, 1400], home: 1105, current: -12, walls: [1006, 1494], after: ['drum', 'sluis'] },
      kit: {
        steps: [
          { title: 'Padamkan api pos jaga dermaga', need: ['fire:0'] },
          { title: 'Crane: ambil dua drum pelampung', need: ['drum'] },
          { title: 'Atur pintu air agar arus tenang', need: ['sluis'] },
          { title: 'Dorong dermaga apung ke seberang', need: ['raft'] },
          { title: 'Padamkan api, selamatkan beruang madu', need: ['fire:1'] },
        ],
        dials: [
          { id: 'katrol', x: 820, y: 330, label: 'Katrol crane', kind: 'winch', mode: 'set', start: 0, band: [2, 2], after: ['fire:0'] },
          { id: 'sluis', x: 700, y: 430, label: 'Pintu air', kind: 'sluice', mode: 'set', start: .2, band: [.55, .75], after: ['drum'] },
        ],
        crane: { id: 'drum', dial: 'katrol', x: 940, top: 300, bottom: 470, deck: { x: 1040, y: 548 }, drums: 2 },
      },
    },
    animal: { key: 'beruang', name: 'Anak Beruang Madu', x: 1720, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Dermaga patah dan pos jaga terbakar. Padamkan atapnya, lalu pakai crane: semprot katrol di ATAS untuk menurunkan kait, di BAWAH untuk menaikkannya — antar dua drum pelampung. Atur pintu air ke zona hijau, dorong dermaga apung ke seberang, dan jemput anak beruang madu.',
  },
  {
    // 3-5 Sarang di Seberang: cool the vent under the root mooring, open the small sluice, push two logs under the nest
    // island so it floats level, then tension the elastic root (too far and it overstrains) to drop the root bridge.
    ...peat, id: 40, code: '3-5', name: 'Sarang di Seberang', width: 2000, waterBudget: 70,
    lands: [{ x0: -80, x1: 940, top: 548 }, { x0: 1640, x1: 2100, top: 548 }], bridges: [],
    // Shallow root shelf under the island where the buoyancy logs settle.
    rocks: [{ x0: 940, x1: 1290, y0: 600, y1: 660 }],
    props: [{ kind: 'log', x: 760, y: 514 }, { kind: 'log', x: 880, y: 514 }],
    fires: [{ x: 1510, y: 520, start: .5, growth: .004, lit: true, max: .9 }],
    decor: [...palms(60, 1950), { key: 'sm-fern-a', x: 1340, y: 526, scale: .6 }, { key: 'tree-small', x: 1580, y: 526, scale: .6 }],
    sm: {
      rescue: { flagX: 600, after: ['jembatan-akar', 'pulau'] },
      respawn: { minX: 600, lostY: 640, unless: 'pulau' },
      // Hinged on the island so the raised root does not wall off the shelf the logs slide onto.
      bridges: [{ id: 'jembatan-akar', hingeX: 1290, hingeY: 548, len: 350, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Dinginkan vent di bawah akar tambat', need: ['v-akar'] },
          { title: 'Buka pintu air kecil', need: ['pintu-kecil'] },
          { title: 'Dorong dua gelondongan ke bawah pulau sarang', need: ['apung-a', 'apung-b'] },
          { title: 'Tarik akar elastis (jangan sampai merah)', need: ['akar'] },
          { title: 'Padamkan api sarang, selamatkan anak rangkong', need: ['fire:0'] },
        ],
        vents: [{ id: 'v-akar', x: 680, y: 548 }],
        dials: [
          { id: 'pintu-kecil', x: 680, y: 400, label: 'Pintu air kecil', kind: 'sluice', mode: 'set', start: 0, band: [.3, .5], after: ['v-akar'] },
          { id: 'akar', x: 900, y: 380, label: 'Akar elastis', kind: 'winch', mode: 'pull', spring: .08, band: [.65, .9], snap: .97, hold: 1, after: ['apung-a', 'apung-b'] },
        ],
        sockets: [{ id: 'apung-a', x0: 940, x1: 1115 }, { id: 'apung-b', x0: 1115, x1: 1290 }],
        floats: [{ id: 'pulau', x0: 1290, x1: 1640, y: 520, after: ['apung-a', 'apung-b'] }],
      },
    },
    animal: { key: 'rangkong', name: 'Anak Rangkong', x: 1460, y: 520, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Sarang rangkong di pulau gambut yang miring. Dinginkan vent sampai lembap 84% selama 2 detik, buka pintu air kecil, lalu dorong dua gelondongan ke bawah pulau. Tarik akar elastis ke zona hijau — terlalu tegang (merah) akan melar. Jembatan akar membawa anak rangkong pulang.',
  },
  {
    // 3-6 Bara di Bawah Tanah: locate the three smoke plumes, open the relief valves far to near (V3, V2, V1), lift the
    // inspection slab off the ember chamber, fill the roof tank and open its valve so the water runs in through the
    // door and drowns the three ember pockets; the root bridge then lowers for the sun bear.
    ...peat, id: 41, code: '3-6', name: 'Bara di Bawah Tanah', width: 2000, waterBudget: 80,
    lands: [{ x0: -80, x1: 1190, top: 548 }, { x0: 1420, x1: 2100, top: 548 }], bridges: [],
    rocks: [{ x0: 880, x1: 1190, y0: 400, y1: 440 }, { x0: 1160, x1: 1190, y0: 440, y1: 548 }],
    gates: [{ id: 'slab', x: 882, y0: 440, y1: 548, style: 'stone' }],
    props: [],
    fires: [fire(930, 548, .9), fire(1020, 548, .9), fire(1110, 548, .9), fire(1450, 548, .8)],
    decor: [...palms(60, 1950), { key: 'sm-log-moss', x: 1000, y: 404, scale: .5, back: true }, { key: 'tree-b', x: 1800, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 560, after: ['jembatan'] },
      chambers: [{ x0: 882, x1: 1160, y0: 440, y1: 548 }],
      basins: [{ id: 'bak', x0: 940, x1: 1150, floor: 400, depth: 60, spray: true,
        valves: [{ id: 'alir', handle: { x: 860, y: 350 }, out: { x: 862, y: 520, vx: 70 }, rate: 70, pipe: [{ x: 940, y: 394 }, { x: 900, y: 394 }, { x: 870, y: 400 }, { x: 864, y: 516 }] }] }],
      bridges: [{ id: 'jembatan', hingeX: 1420, hingeY: 548, len: 230, dir: -1, locks: [], after: ['fire:0', 'fire:1', 'fire:2'] }],
      kit: {
        steps: [
          { title: 'Temukan tiga titik asap', need: ['v1', 'v2', 'v3'] },
          { title: 'Buka katup tekanan berurutan: V3 → V2 → V1', need: ['katup'] },
          { title: 'Angkat slab inspeksi', need: ['slab'] },
          { title: 'Isi bak atas lalu buka katup alir', need: ['bak', 'alir'] },
          { title: 'Alirkan air ke tiga kantong bara', need: ['fire:0', 'fire:1', 'fire:2'] },
          { title: 'Padamkan api seberang, selamatkan beruang madu', need: ['fire:3'] },
        ],
        vents: [{ id: 'v1', x: 620, y: 548, inspect: true }, { id: 'v2', x: 720, y: 548, inspect: true }, { id: 'v3', x: 820, y: 548, inspect: true }],
        sequences: [{ id: 'katup', hits: 14, after: ['v1', 'v2', 'v3'], points: [{ x: 800, y: 280, label: 'V3' }, { x: 700, y: 290, label: 'V2' }, { x: 600, y: 300, label: 'V1' }] }],
        dials: [crank('slab-tuas', 'Slab inspeksi', 1040, 250, { after: ['katup'], opens: 'slab' })],
      },
    },
    animal: { key: 'beruang', name: 'Beruang Madu', x: 1750, y: 548, scale: .58, flip: true },
    tutorial: [3, 6], brief: 'Bara menyala di bawah tanah. Semprot tiga titik asap untuk menemukannya, buka katup tekanan dari yang terjauh (V3 → V2 → V1), angkat slab inspeksi, lalu isi bak di atas goa dan buka katupnya — air mengalir masuk dan memadamkan tiga kantong bara.',
  },
  {
    // 3-7 Bara Menjalar: trace the vents, wash the fallen root out of the channel, close the vent cover and open the
    // relief vent, then soak the cutoff trench ahead of the creeping ember line before it reaches the pangolin; the
    // floating log is then pushed to the far landing.
    ...peat, id: 42, code: '3-7', name: 'Bara Menjalar', width: 2150, waterBudget: 95, spreadDelay: 18,
    lands: [{ x0: -80, x1: 1020, top: 548 }, { x0: 1020, x1: 1160, top: 612 }, { x0: 1160, x1: 1500, top: 548 }, { x0: 1780, x1: 2250, top: 548 }], bridges: [],
    rocks: [{ x0: 560, x1: 760, y0: 430, y1: 470 }],
    props: [{ kind: 'log', x: 880, y: 514 }],
    fires: [],
    decor: [...palms(60, 2190), { key: 'sm-log-moss', x: 660, y: 476, scale: .4, back: true }, { key: 'tree-c', x: 2050, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 1440, after: ['raft', 'gambut'] },
      respawn: { minX: 700, unless: 'saluran' },
      pits: [{ x0: 1020, x1: 1160, top: 548 }],
      raft: { x: 1600, w: 170, dock: [1680, 1700], home: 1595, current: -10, walls: [1505, 1785], after: ['gambut'] },
      firebreak: { id: 'gambut', source: { x: 660, y: 548 }, cells: [790, 900, 1220, 1320, 1420], interval: 6, wetFor: 6, first: 4, after: ['udara'] },
      kit: {
        steps: [
          { title: 'Lacak tiga titik asap', need: ['a', 'b', 'c'] },
          { title: 'Dorong akar dari talang ke ceruk samping', need: ['saluran'] },
          { title: 'Tutup suplai udara & buka relief', need: ['udara'] },
          { title: 'Basahi parit pemutus di depan bara', need: ['gambut'] },
          { title: 'Dorong rakit kayu ke seberang', need: ['raft'] },
        ],
        vents: [{ id: 'a', x: 700, y: 430, inspect: true }, { id: 'b', x: 1260, y: 548, inspect: true }, { id: 'c', x: 1380, y: 548, inspect: true }],
        sockets: [{ id: 'saluran', x0: 1020, x1: 1160, top: 548 }],
        dials: [
          sluice('tutup', 'Tutup vent', 880, 300, [0, .12], { start: .9, group: 'udara' }),
          sluice('relief', 'Vent relief', 1040, 290, [.85, 1], { group: 'udara' }),
        ],
        balances: [{ id: 'udara', dials: ['tutup', 'relief'], hold: 1, after: ['saluran'] }],
      },
    },
    animal: { key: 'trenggiling', name: 'Trenggiling', x: 1960, y: 548, scale: .7, flip: true },
    tutorial: [3, 6], brief: 'Bara menjalar di bawah gambut menuju trenggiling. Lacak tiga titik asap, hanyutkan akar dari talang, tutup suplai udara dan buka relief. Lalu basahi DUA semak di depan bara sebelum ia melompat. Setelah tertahan, dorong rakit kayu ke seberang.',
  },
  {
    // 3-8 Bara Menyebar di Rawa: fill the upstream basin past 55%, divert it into the side branch, put out the four
    // ember nodes, float the two log sections into the gap, and walk both the orangutan and the sun bear out.
    ...peat, id: 43, code: '3-8', name: 'Bara Menyebar di Rawa', width: 2100, waterBudget: 95,
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1250, x1: 2200, top: 548 }], bridges: [],
    floatGap: { x0: 1000, x1: 1250, need: 2 },
    rocks: [{ x0: 1380, x1: 1600, y0: 400, y1: 430 }],
    props: [{ kind: 'log', x: 820, y: 514 }, { kind: 'log', x: 930, y: 514 }],
    fires: [fire(1410, 400, .8), fire(1520, 400, .8), fire(1275, 548, .9), fire(1345, 548, .9)],
    decor: [...palms(60, 2040), { key: 'sm-jungle-bush', x: 1700, y: 556, scale: .7 }, { key: 'tree-a', x: 1880, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 600, after: ['floatgap', 'fire:0', 'fire:1', 'fire:2', 'fire:3'] },
      respawn: { minX: 760, unless: 'floatgap' },
      // The upstream tank stands past its valve wheel, so the stream to the wheel never crosses the open water.
      basins: [{ id: 'hulu', x0: 920, x1: 1110, floor: 300, depth: 70, spray: true, band: [.55, 1],
        valves: [{ id: 'cabang', handle: { x: 860, y: 260 }, out: { x: 1400, y: 300, vx: 110 }, rate: 60, pipe: [{ x: 1110, y: 294 }, { x: 1380, y: 294 }, { x: 1396, y: 300 }] }] }],
      kit: {
        steps: [
          { title: 'Isi bak air hulu sampai 55%', need: ['hulu'] },
          { title: 'Alihkan arus ke cabang samping', need: ['cabang'] },
          { title: 'Padamkan empat node bara', need: ['fire:0', 'fire:1', 'fire:2', 'fire:3'] },
          { title: 'Susun dua gelondongan penyeberangan', need: ['floatgap'] },
        ],
        companion: { key: 'beruang', name: 'Beruang Madu', x: 1900, y: 548, scale: .5, flip: true, flagX: 700, after: ['floatgap', 'fire:2', 'fire:3'] },
      },
    },
    animal: { key: 'orangutan', name: 'Orangutan', x: 1700, y: 548, scale: .6, flip: true },
    tutorial: [3, 6], brief: 'Bara menyebar di rawa dan dua satwa terjebak. Isi bak hulu sampai garis hijau, buka katup cabang agar air mengalir ke kantong bara di atas, padamkan keempat node, lalu susun dua gelondongan di celah air. Orangutan dan beruang madu harus sama-sama selamat.',
  },
  {
    // 3-9 Kabut dan Arus Balik: smoke hides the channel until the ventilation panels open (B, then A); the fallen root
    // is washed out, the three ember pockets cooled; slow the eddy with the bypass and winch the root bridge taut for
    // the gibbon.
    ...peat, id: 44, code: '3-9', name: 'Kabut dan Arus Balik', width: 2100, waterBudget: 95,
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1450, x1: 2200, top: 548 }], bridges: [],
    // Old root platform standing in the channel.
    rocks: [{ x0: 1190, x1: 1400, y0: 470, y1: 500 }],
    props: [{ kind: 'log', x: 840, y: 514 }],
    fires: [fire(1480, 548, .9)],
    decor: [...palms(60, 2040), { key: 'sm-falls-small', x: 1220, y: 600, scale: 1, back: true }, { key: 'tree-flower', x: 1820, y: 556, scale: .7 }],
    sm: {
      rescue: { flagX: 600, after: ['jembatan'] },
      respawn: { minX: 640, unless: 'akar-tumbang' },
      bridges: [{ id: 'jembatan', hingeX: 1450, hingeY: 548, len: 450, dir: -1, locks: [], after: ['winch'] }],
      kit: {
        steps: [
          { title: 'Baca pola kabut: tiga titik asap', need: ['k1', 'k2', 'k3'] },
          { title: 'Hanyutkan akar tumbang dari kanal', need: ['akar-tumbang'] },
          { title: 'Buka panel ventilasi B lalu A', need: ['panel'] },
          { title: 'Padamkan tiga kantong bara', need: ['e1', 'e2', 'e3'] },
          { title: 'Atur bypass agar arus balik tenang', need: ['bypass'] },
          { title: 'Tarik akar elastis dengan winch', need: ['winch'] },
          { title: 'Padamkan api seberang, selamatkan owa', need: ['fire:0'] },
        ],
        vents: [
          { id: 'k1', x: 660, y: 548, inspect: true }, { id: 'k2', x: 760, y: 548, inspect: true }, { id: 'k3', x: 1240, y: 470, inspect: true },
          { id: 'e1', x: 900, y: 548, after: ['panel'] }, { id: 'e2', x: 980, y: 548, after: ['e1'] }, { id: 'e3', x: 1350, y: 470, after: ['e2'] },
        ],
        clears: [{ id: 'akar-tumbang', x0: 760, x1: 1000, after: ['k1', 'k2', 'k3'] }],
        sequences: [{ id: 'panel', hits: 16, after: ['akar-tumbang'], points: [{ x: 820, y: 300, label: 'Panel B' }, { x: 700, y: 280, label: 'Panel A' }] }],
        dials: [sluice('bypass', 'Bypass hulu', 1120, 300, [.4, .6], { after: ['e3'] }), winch('winch', 'Winch akar', 960, 330, { after: ['bypass'] })],
        fogs: [{ x0: 860, x1: 1440, y0: 300, y1: 600, until: 'panel' }],
      },
    },
    animal: { key: 'owa', name: 'Owa Kalimantan', x: 1750, y: 548, scale: .4, flip: true },
    tutorial: [3, 6], brief: 'Kabut tebal menutup kanal. Baca tiga titik asap, hanyutkan akar tumbang, lalu buka panel ventilasi B dulu baru A — kabut menipis. Padamkan tiga kantong bara berurutan, setel bypass ke tengah agar arus balik tenang, dan tarik akar elastis untuk owa.',
  },
  {
    // 3-10 Titik Bara Terakhir: map the vents, vent from the top (V3 then V2, V1 stays open as relief), winch the hatch
    // open, fill the upstream reservoir past 55% and split it with the main gate and bypass, wet the firebreak ahead of
    // the seam, then seat the log in the bridge socket for the proboscis monkey.
    ...peat, id: 45, code: '3-10', name: 'Titik Bara Terakhir', width: 2150, waterBudget: 105, supply: 140, spreadDelay: 20,
    lands: [{ x0: -80, x1: 1460, top: 548 }, { x0: 1460, x1: 1600, top: 612 }, { x0: 1600, x1: 2250, top: 548 }], bridges: [],
    rocks: [{ x0: 1260, x1: 1440, y0: 300, y1: 330 }],
    gates: [{ id: 'hatch', x: 1000, y0: 470, y1: 548, style: 'stone' }],
    props: [{ kind: 'log', x: 1300, y: 514 }],
    fires: [],
    decor: [...palms(60, 2190), { key: 'k-sluice', x: 900, y: 556, scale: .45, back: true }, { key: 'tree-c', x: 2000, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 620, after: ['gambut', 'soket'] },
      pits: [{ x0: 1460, x1: 1600, top: 548 }],
      firebreak: { id: 'gambut', source: { x: 1040, y: 548 }, cells: [1120, 1230, 1340, 1450], interval: 7, wetFor: 6, first: 6, after: ['debit'] },
      basins: [{ id: 'reservoir', x0: 1270, x1: 1430, floor: 300, depth: 60, spray: true, band: [.55, 1] }],
      kit: {
        steps: [
          { title: 'Petakan tiga vent', need: ['m1', 'm2', 'm3'] },
          { title: 'Buka tekanan dari atas: V3 lalu V2', need: ['atas'] },
          { title: 'Buka hatch inspeksi dengan winch', need: ['hatch'] },
          { title: 'Isi reservoir sampai 55%', need: ['reservoir'] },
          { title: 'Atur pintu utama dan bypass', need: ['debit'] },
          { title: 'Basahi parit pemutus di depan bara', need: ['gambut'] },
          { title: 'Dorong gelondongan ke soket jembatan', need: ['soket'] },
        ],
        vents: [{ id: 'm1', x: 680, y: 548, inspect: true }, { id: 'm2', x: 820, y: 548, inspect: true }, { id: 'm3', x: 1150, y: 548, inspect: true }],
        sequences: [{ id: 'atas', hits: 14, after: ['m1', 'm2', 'm3'], points: [{ x: 920, y: 300, label: 'V3' }, { x: 1040, y: 330, label: 'V2' }] }],
        dials: [
          winch('hatch-winch', 'Winch hatch', 1160, 300, { after: ['atas'], opens: 'hatch' }),
          sluice('utama', 'Pintu utama', 1000, 430, [.5, .7], { group: 'debit' }),
          sluice('pintas', 'Bypass', 1200, 320, [.25, .45], { group: 'debit' }),
        ],
        balances: [{ id: 'debit', dials: ['utama', 'pintas'], hold: 2, after: ['reservoir'] }],
        sockets: [{ id: 'soket', x0: 1460, x1: 1600, top: 548 }],
      },
    },
    animal: { key: 'bekantan', name: 'Bekantan', x: 1900, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Titik bara terakhir di bawah gambut. Petakan tiga vent, buka tekanan dari atas (V3 lalu V2), tarik winch untuk membuka hatch. Isi reservoir, setel pintu utama dan bypass ke zona hijau, basahi parit di depan bara, lalu dorong gelondongan ke soket agar bekantan bisa lewat.',
  },
  {
    // 3-11 Akar Raksasa: cool the ember at the giant root's foot, release the tension latch, seat the counterweight log
    // in the winch cradle, set the two gates so the dock current is calm, soak the trench ahead of the ember seam
    // under the root, then tension the elastic root across the river for the proboscis monkey.
    ...peat, id: 46, code: '3-11', name: 'Akar Raksasa', width: 2200, waterBudget: 105, supply: 140, spreadDelay: 20,
    lands: [{ x0: -80, x1: 960, top: 548 }, { x0: 960, x1: 1100, top: 612 }, { x0: 1100, x1: 1500, top: 548 }, { x0: 1800, x1: 2300, top: 548 }], bridges: [],
    props: [{ kind: 'log', x: 840, y: 514 }],
    fires: [fire(1880, 548, .8)],
    decor: [...palms(60, 2230), { key: 'sm-fern-root', x: 700, y: 556, scale: .9 }, { key: 'tree-large', x: 1650, y: 600, scale: .9, back: true }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan'] },
      respawn: { minX: 780, unless: 'cradle' },
      pits: [{ x0: 960, x1: 1100, top: 548 }],
      firebreak: { id: 'gambut', source: { x: 1130, y: 548 }, cells: [1220, 1320, 1420], interval: 7, wetFor: 6, first: 5, after: ['arus'] },
      bridges: [{ id: 'jembatan', hingeX: 1800, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Padamkan bara di pangkal akar', need: ['pangkal'] },
          { title: 'Bebaskan pengunci tegangan', need: ['pengunci'] },
          { title: 'Pasang gelondongan di cradle winch', need: ['cradle'] },
          { title: 'Atur dua pintu air — arus dermaga tenang', need: ['arus'] },
          { title: 'Basahi parit di depan bara bawah akar', need: ['gambut'] },
          { title: 'Bentangkan akar elastis', need: ['akar'] },
          { title: 'Padamkan api seberang, selamatkan bekantan', need: ['fire:0'] },
        ],
        vents: [{ id: 'pangkal', x: 700, y: 548 }],
        dials: [
          crank('pengunci', 'Pengunci tegangan', 860, 440, { after: ['pangkal'] }),
          sluice('hulu', 'Gerbang hulu', 1040, 420, [.55, .75], { group: 'arus' }),
          sluice('pintas', 'Bypass', 1240, 320, [.3, .5], { group: 'arus' }),
          winch('akar', 'Akar elastis', 1360, 300, { after: ['gambut'] }),
        ],
        balances: [{ id: 'arus', dials: ['hulu', 'pintas'], hold: 2, after: ['cradle'] }],
        sockets: [{ id: 'cradle', x0: 960, x1: 1100, top: 548 }],
      },
    },
    animal: { key: 'bekantan', name: 'Bekantan', x: 2050, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Akar raksasa menahan jalan bekantan. Dinginkan bara di pangkalnya, buka pengunci, dorong gelondongan ke cradle winch, lalu setel dua pintu air ke zona hijau bersamaan. Basahi parit sebelum bara di bawah akar melompat, lalu bentangkan akar elastis ke seberang.',
  },
  {
    // 3-12 Pintu Air Ganda: two sluices in series. Put out the left post, open the upstream gate and fill the
    // reservoir, set the relief before anything downstream, meter the middle channel between its marks, push the raft
    // to the far dock, and cool the ember seam under the roots for the hornbill.
    ...peat, id: 47, code: '3-12', name: 'Pintu Air Ganda', width: 2150, waterBudget: 110, supply: 140,
    lands: [{ x0: -80, x1: 1200, top: 548 }, { x0: 1560, x1: 2250, top: 548 }], bridges: [],
    rocks: [{ x0: 1160, x1: 1200, y0: 470, y1: 548 }],
    props: [],
    fires: [fire(700, 548, .9), fire(1600, 548, .8), fire(1690, 548, .8)],
    decor: [...palms(60, 2190), { key: 'k-sluice', x: 980, y: 556, scale: .5, back: true }, { key: 'tree-b', x: 1950, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 600, after: ['raft'] },
      raft: { x: 1305, w: 190, dock: [1440, 1470], home: 1300, current: -11, walls: [1205, 1555], after: ['kanal'] },
      basins: [
        // High on the cliff, above the lane the stream takes to the far bank.
        { id: 'reservoir', x0: 1260, x1: 1440, floor: 190, depth: 60, spray: true, band: [.55, 1],
          valves: [{ id: 'alir', handle: { x: 1180, y: 160 }, out: { x: 1012, y: 456, vx: 20 }, rate: 34, pipe: [{ x: 1260, y: 184 }, { x: 1020, y: 184 }, { x: 1012, y: 452 }] }] },
        { id: 'kanal', x0: 940, x1: 1100, floor: 540, depth: 70, leak: 3, band: [.35, .7] },
      ],
      kit: {
        steps: [
          { title: 'Padamkan bara pos kiri', need: ['fire:0'] },
          { title: 'Buka gerbang hulu dan isi reservoir', need: ['gerbang', 'reservoir'] },
          { title: 'Buka relief sebelum gerbang hilir', need: ['relief'] },
          { title: 'Isi kanal tengah ke 35–70% (katup alir)', need: ['kanal'] },
          { title: 'Dorong rakit ke dermaga seberang', need: ['raft'] },
          { title: 'Padamkan bara bawah akar, selamatkan rangkong', need: ['fire:1', 'fire:2'] },
        ],
        dials: [
          sluice('gerbang', 'Gerbang hulu', 880, 440, [.7, 1], { after: ['fire:0'] }),
          sluice('relief', 'Katup relief', 1100, 330, [.4, .6], { after: ['reservoir'] }),
        ],
      },
    },
    animal: { key: 'rangkong', name: 'Rangkong', x: 1900, y: 548, scale: .62, flip: true },
    tutorial: [3, 6], brief: 'Dua pintu air seri mengatur sungai. Padamkan pos kiri, buka gerbang hulu dan isi reservoir, setel katup relief, lalu buka katup alir sampai kanal tengah berada di zona hijau (35–70%) — jangan sampai meluap. Dorong rakit ke seberang dan padamkan bara bawah akar.',
  },
  {
    // 3-13 Jalur Rakit Arus Balik: put out the start post, open the upstream gate and fill the reservoir, set the bypass
    // for a calm pocket, then winch the raft along its tow line: the mid-island ember stops it until it is out; at the
    // far bank the orangutan boards and the winch brings it home.
    ...peat, id: 48, code: '3-13', name: 'Jalur Rakit Arus Balik', width: 2150, waterBudget: 105, supply: 140,
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1250, x1: 1330, top: 548 }, { x0: 1620, x1: 2250, top: 548 }], bridges: [],
    rocks: [{ x0: 1260, x1: 1440, y0: 260, y1: 290 }],
    props: [],
    fires: [fire(700, 548, .9), fire(1290, 548, .8)],
    decor: [...palms(60, 2190), { key: 'sm-post', x: 1290, y: 556, scale: .5 }, { key: 'tree-flower', x: 1950, y: 556, scale: .7 }],
    sm: {
      rescue: { flagX: 600 },
      basins: [{ id: 'reservoir', x0: 1270, x1: 1430, floor: 260, depth: 60, spray: true, band: [.55, 1] }],
      gondola: { id: 'rakit', a: { x: 1080, y: 458 }, b: { x: 1540, y: 458 }, sag: 0, drop: 98, speed: .03, slide: 0, block: { fire: 1, at: .45 }, driver: 'winch-rakit', after: ['bypass'], look: 'raft' },
      kit: {
        steps: [
          { title: 'Padamkan bara pos awal', need: ['fire:0'] },
          { title: 'Buka pintu hulu dan isi reservoir', need: ['hulu', 'reservoir'] },
          { title: 'Atur bypass: kantong arus tenang', need: ['bypass'] },
          { title: 'Padamkan bara pulau tengah', need: ['fire:1'] },
          { title: 'Winch rakit ke tepi seberang', need: ['rakit'] },
          { title: 'Orangutan naik — winch rakit pulang', need: ['rakit:home'] },
        ],
        dials: [
          sluice('hulu', 'Pintu hulu', 860, 440, [.7, 1], { after: ['fire:0'] }),
          sluice('bypass', 'Bypass', 1120, 360, [.4, .6], { after: ['reservoir'] }),
          { id: 'winch-rakit', label: 'Winch rakit', x: 960, y: 300, kind: 'winch', mode: 'set', start: .5, band: [2, 2], after: ['bypass'] },
        ],
      },
    },
    animal: { key: 'orangutan', name: 'Orangutan', x: 1900, y: 548, scale: .6, flip: true },
    tutorial: [3, 6], brief: 'Rakit ditarik winch melintasi arus balik. Padamkan pos awal, buka pintu hulu dan isi reservoir, setel bypass ke tengah. Semprot + pada winch untuk menarik rakit menyeberang — bara di pulau tengah menahannya. Setelah orangutan naik, semprot − agar rakit pulang.',
  },
  {
    // 3-14 Lorong Kabut dan Tiga Pintu: smoke fills the corridor until the upstream vent is cooled; open gate A to fill
    // the balancing pool until the counterweight floats up to its hook; set gates B and C to make the calm pocket; pull
    // the spring root taut; cool the manifold vents (middle, then downstream) for the sun bear cub.
    ...peat, id: 49, code: '3-14', name: 'Lorong Kabut dan Tiga Pintu', width: 2150, waterBudget: 110, supply: 140,
    lands: [{ x0: -80, x1: 1300, top: 548 }, { x0: 1600, x1: 2250, top: 548 }], bridges: [],
    rocks: [{ x0: 1340, x1: 1560, y0: 470, y1: 500 }],
    props: [],
    fires: [fire(1660, 548, .8)],
    decor: [...palms(60, 2190), { key: 'k-sluice', x: 860, y: 556, scale: .45, back: true }, { key: 'tree-c', x: 1950, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 1290, after: ['jembatan', 'tengah', 'hilir'] },
      basins: [{ id: 'kolam', x0: 900, x1: 1040, floor: 420, depth: 60, spray: true, lift: { x: 1110, w: 70, y: 540, travel: 120, need: 70 } }],
      bridges: [{ id: 'jembatan', hingeX: 1600, hingeY: 548, len: 300, dir: -1, locks: [], after: ['pegas'] }],
      kit: {
        steps: [
          { title: 'Padamkan vent hulu — kabut menipis', need: ['vent-hulu'] },
          { title: 'Buka pintu A dan isi kolam penyeimbang', need: ['pintu-a', 'kolam'] },
          { title: 'Setel pintu B 45% dan C 30%', need: ['saku'] },
          { title: 'Tarik akar pegas', need: ['pegas'] },
          { title: 'Dinginkan manifold: vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Padamkan api seberang, selamatkan anak beruang madu', need: ['fire:0'] },
        ],
        vents: [{ id: 'vent-hulu', x: 700, y: 548, hold: 2.5 }, { id: 'tengah', x: 1380, y: 470, after: ['pegas'] }, { id: 'hilir', x: 1480, y: 470, after: ['tengah'] }],
        dials: [
          sluice('pintu-a', 'Pintu A', 860, 440, [.57, .73], { after: ['vent-hulu'] }),
          sluice('b', 'Pintu B', 1000, 300, [.37, .53], { group: 'saku' }),
          sluice('c', 'Pintu C', 1200, 250, [.22, .38], { group: 'saku' }),
          winch('pegas', 'Akar pegas', 1320, 330, { after: ['saku'] }),
        ],
        balances: [{ id: 'saku', dials: ['b', 'c'], hold: 2, after: ['kolam'] }],
        fogs: [{ x0: 760, x1: 1580, y0: 220, y1: 600, until: 'vent-hulu' }],
      },
    },
    animal: { key: 'beruang', name: 'Anak Beruang Madu', x: 1900, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Lorong tertutup kabut asap. Dinginkan vent hulu 2,5 detik sampai kabut menipis, buka pintu A dan isi kolam penyeimbang sampai pemberat naik, setel pintu B dan C ke zona hijau bersamaan, tarik akar pegas, lalu dinginkan vent tengah dan hilir di atas akar.',
  },
  {
    // 3-15 Penjaga Akar Raksasa (boss): the root guardian is shielded until its three ember knots are cooled in order
    // and the manifold cuts the root veins; then its core opens in short windows. Spray the core while dodging its
    // ember bursts, then the sun bear walks out.
    ...peat, id: 50, code: '3-15', name: 'Penjaga Akar Raksasa', width: 2300, waterBudget: 200, supply: 200, burnRate: .25,
    // Root mound with a step either side the rescued bear can climb.
    lands: [{ x0: -80, x1: 1300, top: 548 }, { x0: 1300, x1: 1380, top: 510 }, { x0: 1380, x1: 1640, top: 470 }, { x0: 1640, x1: 1720, top: 510 }, { x0: 1720, x1: 2400, top: 548 }], bridges: [],
    boss: { x: 1520, y: 470, hp: 26, arena: 1300, name: 'Penjaga Akar Raksasa', sprite: 'k-boss-akar', scale: .62, muzzle: { x: -60, y: -150 }, sealedPace: 2.5, noJet: true, perches: [{ x: 1520, y: 470 }] },
    props: [],
    fires: [fire(640, 548, .8)],
    decor: [...palms(60, 2250), { key: 'tree-large', x: 1520, y: 640, scale: 1.1, back: true }, { key: 'sm-fern-root', x: 1250, y: 556, scale: .9 }],
    sm: {
      rescue: { flagX: 600, after: ['boss'] },
      shield: { fires: [], relight: 0, needs: ['a', 'b', 'c', 'urat'], windows: [5, 3] },
      kit: {
        steps: [
          { title: 'Dinginkan simpul bara hulu', need: ['a'] },
          { title: 'Dinginkan simpul bara tengah', need: ['b'] },
          { title: 'Dinginkan simpul bara hilir', need: ['c'] },
          { title: 'Putar manifold — putuskan urat akar', need: ['urat'] },
          { title: 'Semprot inti saat terbuka', need: ['boss'] },
        ],
        vents: [{ id: 'a', x: 820, y: 548 }, { id: 'b', x: 1050, y: 548, after: ['a'] }, { id: 'c', x: 1360, y: 470, after: ['b'] }],
        dials: [crank('urat', 'Manifold', 1150, 330, { after: ['c'] })],
      },
    },
    animal: { key: 'beruang', name: 'Beruang Madu', x: 1950, y: 548, scale: .58, flip: true },
    tutorial: [6], brief: 'Penjaga Akar Raksasa berlindung di balik perisai akar. Dinginkan tiga simpul bara berurutan, putar manifold untuk memutus urat akarnya, lalu semprot intinya saat terbuka. Tahan bola bara dan jaga tekanan air — lepas semprotan 10 detik untuk mengisi cadangan.',
  },
  {
    // 3-16 Nadi Rawa Terakhir: after the guardian falls, its last pulse lingers. Cool the upstream vent, prime the pump
    // manifold, set sluices A/B/C to 20/45/30%, cross the spring root to the island, cool its two vents, then wind the
    // rescue pod across the last channel and back with the proboscis monkey.
    ...peat, id: 51, code: '3-16', name: 'Nadi Rawa Terakhir', width: 2500, waterBudget: 120, supply: 150,
    lands: [{ x0: -80, x1: 1100, top: 548 }, { x0: 1400, x1: 1660, top: 548 }, { x0: 2020, x1: 2600, top: 548 }], bridges: [],
    props: [],
    fires: [fire(2080, 548, .8)],
    decor: [...palms(60, 2540), { key: 'k-sluice', x: 1060, y: 556, scale: .45, back: true }, { key: 'tree-large', x: 1530, y: 620, scale: .9, back: true }],
    sm: {
      rescue: { flagX: 600, after: ['jembatan'] },
      bridges: [{ id: 'jembatan', hingeX: 1400, hingeY: 548, len: 300, dir: -1, locks: [], after: ['pegas'] }],
      gondola: { id: 'pod', a: { x: 1740, y: 458 }, b: { x: 1940, y: 458 }, sag: 0, drop: 98, speed: .05, slide: 0, driver: 'tambat', after: ['hilir'], look: 'raft' },
      kit: {
        steps: [
          { title: 'Dinginkan vent hulu (85%)', need: ['hulu'] },
          { title: 'Pompa manifold', need: ['manifold'] },
          { title: 'Setel pintu A 20%, B 45%, C 30%', need: ['abc'] },
          { title: 'Tarik akar pegas ke pulau', need: ['pegas'] },
          { title: 'Dinginkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Tarik pod penyelamat ke tambatan seberang', need: ['pod'] },
          { title: 'Bekantan naik — tarik pod pulang', need: ['pod:home'] },
        ],
        vents: [{ id: 'hulu', x: 700, y: 548, need: .85 }, { id: 'tengah', x: 1470, y: 548, after: ['pegas'] }, { id: 'hilir', x: 1600, y: 548, after: ['tengah'] }],
        dials: [
          pump('manifold', 'Pompa manifold', 840, 430, { after: ['hulu'] }),
          sluice('a', 'Pintu A', 980, 430, [.12, .28], { group: 'abc' }),
          sluice('b', 'Pintu B', 1120, 340, [.37, .53], { group: 'abc' }),
          sluice('c', 'Pintu C', 1260, 260, [.22, .38], { group: 'abc' }),
          winch('pegas', 'Akar pegas', 1300, 380, { after: ['abc'] }),
          { id: 'tambat', label: 'Winch pod', x: 1560, y: 330, kind: 'winch', mode: 'set', start: .5, band: [2, 2], after: ['hilir'] },
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['manifold'] }],
      },
    },
    animal: { key: 'bekantan', name: 'Bekantan', x: 2300, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Nadi bara terakhir setelah Penjaga runtuh. Dinginkan vent hulu, pompa manifold, setel pintu A/B/C (20/45/30%), tarik akar pegas ke pulau dan dinginkan dua vent di sana. Lalu tarik pod penyelamat ke seberang dengan winch dan bawa bekantan pulang.',
  },
  {
    // 3-17 Lorong Asap dan Kayu Tenggelam: cool the entrance vent, open both smoke shutters until the corridor clears,
    // fill the basin so the sunken log floats up, cool the three fissures in order, then push the raft over to the
    // hornbill chick's bank; the current brings it home.
    ...peat, id: 52, code: '3-17', name: 'Lorong Asap dan Kayu Tenggelam', width: 2250, waterBudget: 120, supply: 150,
    lands: [{ x0: -80, x1: 1250, top: 548 }, { x0: 1640, x1: 2350, top: 548 }], bridges: [],
    rocks: [{ x0: 760, x1: 1070, y0: 220, y1: 258 }],
    props: [],
    fires: [fire(1690, 548, .8)],
    decor: [...palms(60, 2290), { key: 'sm-log-moss', x: 1100, y: 556, scale: .55, back: true }, { key: 'tree-flower', x: 1950, y: 556, scale: .7 }],
    sm: {
      rescue: { flagX: 600, after: ['raft'] },
      chambers: [{ x0: 760, x1: 1070, y0: 250, y1: 548 }],
      raft: { x: 1355, w: 190, dock: [1500, 1540], home: 1350, current: -11, walls: [1255, 1645], after: ['genang', 'hilir'] },
      basins: [{ id: 'genang', x0: 860, x1: 1050, floor: 210, depth: 50, spray: true, band: [.7, 1] }],
      kit: {
        steps: [
          { title: 'Padamkan vent masuk', need: ['masuk'] },
          { title: 'Buka dua shutter ventilasi', need: ['shutter'] },
          { title: 'Naikkan air — kayu tenggelam mengapung', need: ['genang'] },
          { title: 'Padamkan retakan hulu, tengah, hilir', need: ['hulu', 'tengah', 'hilir'] },
          { title: 'Dorong rakit ke anak rangkong', need: ['raft'] },
        ],
        vents: [
          { id: 'masuk', x: 680, y: 548, need: .82 },
          { id: 'hulu', x: 830, y: 548, after: ['genang'], need: .82 }, { id: 'tengah', x: 930, y: 548, after: ['hulu'], need: .82 }, { id: 'hilir', x: 1030, y: 548, after: ['tengah'], need: .82 },
        ],
        dials: [crank('shutter-1', 'Shutter 1', 790, 140, { group: 'shutter', band: [.8, 1] }), crank('shutter-2', 'Shutter 2', 1150, 150, { group: 'shutter', band: [.8, 1] })],
        balances: [{ id: 'shutter', dials: ['shutter-1', 'shutter-2'], hold: 1, after: ['masuk'] }],
        fogs: [{ x0: 760, x1: 1070, y0: 250, y1: 560, until: 'shutter', tint: 0x6a6a64 }],
      },
    },
    animal: { key: 'rangkong', name: 'Anak Rangkong', x: 1950, y: 548, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Lorong goa gambut penuh asap. Padamkan vent masuk, buka DUA shutter di atap sampai asap keluar, isi bak sampai kayu tenggelam mengapung, lalu padamkan retakan hulu, tengah, dan hilir berurutan. Dorong rakit ke seberang untuk anak rangkong.',
  },
  {
    // 3-18 Pulau Gambut Bergerak: cool the upstream vent, set the bypass to 35-55%, seat the counterweight log on its
    // latch, push the burning peat island into the middle mooring, cool the middle then downstream vents, and unlatch
    // the root gate for the river turtle.
    ...peat, id: 53, code: '3-18', name: 'Pulau Gambut Bergerak', width: 2250, waterBudget: 120, supply: 150,
    lands: [{ x0: -80, x1: 940, top: 548 }, { x0: 940, x1: 1080, top: 612 }, { x0: 1080, x1: 1200, top: 548 }, { x0: 1600, x1: 2350, top: 548 }], bridges: [],
    gates: [{ id: 'gerbang-akar', x: 1680, y0: 420, y1: 548, style: 'stone' }],
    props: [{ kind: 'log', x: 800, y: 514 }],
    fires: [fire(1760, 548, .8)],
    decor: [...palms(60, 2290), { key: 'sm-fern-root', x: 1750, y: 556, scale: .8 }, { key: 'tree-b', x: 2050, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 600, after: ['raft', 'gerbang-akar'] },
      respawn: { minX: 740, unless: 'pemberat' },
      pits: [{ x0: 940, x1: 1080, top: 548 }],
      raft: { x: 1305, w: 190, dock: [1460, 1500], home: 1300, current: -11, walls: [1205, 1605], after: ['pemberat'] },
      kit: {
        steps: [
          { title: 'Dinginkan vent hulu', need: ['hulu'] },
          { title: 'Setel bypass 35–55%', need: ['bypass'] },
          { title: 'Geser log pemberat ke kait', need: ['pemberat'] },
          { title: 'Dorong pulau gambut ke tambatan tengah', need: ['raft'] },
          { title: 'Dinginkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Buka gerbang akar', need: ['gerbang-akar'] },
        ],
        vents: [{ id: 'hulu', x: 690, y: 548 }, { id: 'tengah', x: 1140, y: 548, after: ['raft'] }, { id: 'hilir', x: 1640, y: 548, after: ['tengah'] }],
        dials: [
          sluice('bypass', 'Bypass', 880, 430, [.35, .55], { after: ['hulu'] }),
          crank('tuas-akar', 'Tuas akar', 1300, 300, { after: ['hilir'], opens: 'gerbang-akar' }),
        ],
        sockets: [{ id: 'pemberat', x0: 940, x1: 1080, top: 548 }],
      },
    },
    animal: { key: 'kura-kura', name: 'Kura-kura Sungai', x: 1950, y: 548, scale: .7, flip: true },
    tutorial: [3, 6], brief: 'Pulau gambut hanyut di arus hitam. Dinginkan vent hulu, setel bypass ke zona hijau, dorong log pemberat ke kaitnya, lalu dorong pulau gambut ke tambatan seberang. Dinginkan vent tengah dan hilir, buka gerbang akar, dan kura-kura pulang menumpang pulau.',
  },
  {
    // 3-19 Menara Napas Gambut: cool the inlet vent, open the roof damper so the smoke rises out of the tower, set
    // sluices A and B and prime the siphon to fill the cistern, open its sprinkler valve onto the middle vent the stream
    // cannot reach, tension the root, open sluice C for the outlet vent, then lower the rescue basket from the canopy.
    ...peat, id: 54, code: '3-19', name: 'Menara Napas Gambut', width: 2300, waterBudget: 130, supply: 150,
    lands: [{ x0: -80, x1: 1250, top: 548 }, { x0: 1550, x1: 2400, top: 548 }], bridges: [],
    rocks: [{ x0: 900, x1: 1180, y0: 400, y1: 430 }, { x0: 1700, x1: 1900, y0: 300, y1: 330 }],
    props: [],
    fires: [fire(1650, 548, .8)],
    decor: [...palms(60, 2340), { key: 'tree-large', x: 1800, y: 620, scale: 1, back: true }],
    sm: {
      rescue: { flagX: 600, after: ['jembatan'] },
      chambers: [{ x0: 900, x1: 1180, y0: 430, y1: 548 }],
      // The cistern tops the tower, past every control, so no stream to a sluice crosses its open water.
      basins: [{ id: 'cistern', x0: 1570, x1: 1690, floor: 210, depth: 60, spray: true, band: [.75, 1],
        valves: [{ id: 'sprinkler', handle: { x: 1520, y: 150 }, out: { x: 1040, y: 438, vx: 0 }, rate: 50, pipe: [{ x: 1570, y: 204 }, { x: 1186, y: 204 }, { x: 1186, y: 396 }, { x: 1040, y: 396 }] }] }],
      bridges: [{ id: 'jembatan', hingeX: 1550, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      gondola: { id: 'keranjang', a: { x: 1620, y: 450 }, b: { x: 1800, y: 202 }, sag: 0, drop: 98, speed: .05, slide: .02, driver: 'katrol', after: ['hilir'] },
      kit: {
        steps: [
          { title: 'Dinginkan vent masuk', need: ['masuk'] },
          { title: 'Buka damper atap ≥ 70%', need: ['damper'] },
          { title: 'Isi cistern: pintu A, B, dan sifon', need: ['ab', 'sifon', 'cistern'] },
          { title: 'Buka sprinkler ke vent tengah', need: ['sprinkler', 'tengah'] },
          { title: 'Tarik akar elastis', need: ['akar'] },
          { title: 'Buka pintu C, dinginkan vent hilir', need: ['c', 'hilir'] },
          { title: 'Naikkan keranjang ke kanopi', need: ['keranjang'] },
          { title: 'Turunkan anak rangkong', need: ['keranjang:home'] },
        ],
        vents: [{ id: 'masuk', x: 700, y: 548 }, { id: 'tengah', x: 1040, y: 548, after: ['damper'] }, { id: 'hilir', x: 1500, y: 548, after: ['c'] }],
        dials: [
          sluice('damper', 'Damper atap', 820, 300, [.7, 1], { after: ['masuk'] }),
          sluice('a', 'Pintu A', 860, 450, [.55, .7], { group: 'ab' }),
          sluice('b', 'Pintu B', 1300, 340, [.25, .45], { group: 'ab' }),
          pump('sifon', 'Sifon', 1240, 440, { after: ['ab'] }),
          winch('akar', 'Akar elastis', 1380, 380, { after: ['tengah'] }),
          sluice('c', 'Pintu C', 1440, 250, [.3, .5], { after: ['akar'] }),
          { id: 'katrol', label: 'Katrol keranjang', x: 1460, y: 420, kind: 'winch', mode: 'set', start: .5, band: [2, 2], after: ['hilir'] },
        ],
        balances: [{ id: 'ab', dials: ['a', 'b'], hold: 2, after: ['damper'] }],
        fogs: [{ x0: 860, x1: 1240, y0: 300, y1: 560, until: 'damper', tint: 0x7a7a70 }],
      },
    },
    animal: { key: 'rangkong', name: 'Anak Rangkong', x: 1800, y: 300, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Asap memenuhi menara gambut. Dinginkan vent masuk, buka damper atap, setel pintu A dan B lalu pompa sifon sampai cistern penuh. Buka sprinkler untuk vent di bawah atap, tarik akar, buka pintu C untuk vent hilir, lalu naikkan keranjang ke kanopi dan turunkan anak rangkong.',
  },
  {
    // 3-20 Gerbang Sungai Mati: clear the old canal intake of driftwood, cool the upstream vent, balance A/B/C at
    // 60/35/25%, seat the floating log at its mooring, cool the middle and downstream vents, then throw the root gate's
    // lever so the river otter pup can reach the evacuation bank.
    ...peat, id: 55, code: '3-20', name: 'Gerbang Sungai Mati', width: 2250, waterBudget: 120, supply: 150,
    lands: [{ x0: -80, x1: 1400, top: 548 }, { x0: 1400, x1: 1540, top: 612 }, { x0: 1540, x1: 2350, top: 548 }], bridges: [],
    gates: [{ id: 'gerbang-akar', x: 1700, y0: 400, y1: 548, style: 'stone' }],
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(1660, 548, .8)],
    decor: [...palms(60, 2290), { key: 'k-sluice', x: 1250, y: 556, scale: .45, back: true }, { key: 'tree-c', x: 2050, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 620, after: ['gerbang-akar', 'tambat'] },
      respawn: { minX: 900, unless: 'tambat' },
      pits: [{ x0: 1400, x1: 1540, top: 548 }],
      kit: {
        steps: [
          { title: 'Bersihkan intake kanal', need: ['intake'] },
          { title: 'Dinginkan vent hulu', need: ['hulu'] },
          { title: 'Setel pintu A 60%, B 35%, C 25%', need: ['abc'] },
          { title: 'Dorong log kayu hanyut ke tambatan', need: ['tambat'] },
          { title: 'Dinginkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Tarik tuas gerbang akar purba', need: ['gerbang-akar'] },
        ],
        clears: [{ id: 'intake', x0: 860, x1: 1150 }],
        vents: [{ id: 'hulu', x: 1220, y: 548, after: ['intake'] }, { id: 'tengah', x: 1600, y: 548, after: ['tambat'] }, { id: 'hilir', x: 1780, y: 548, after: ['tengah'] }],
        dials: [
          sluice('a', 'Pintu A', 900, 440, [.52, .68], { group: 'abc' }),
          sluice('b', 'Pintu B', 1050, 350, [.27, .43], { group: 'abc' }),
          sluice('c', 'Pintu C', 1200, 270, [.17, .33], { group: 'abc' }),
          crank('tuas', 'Tuas gerbang akar', 1500, 300, { after: ['hilir'], opens: 'gerbang-akar' }),
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['hulu'] }],
        sockets: [{ id: 'tambat', x0: 1400, x1: 1540, top: 548 }],
      },
    },
    animal: { key: 'berang', name: 'Anak Berang-berang', x: 1950, y: 548, scale: .65, flip: true },
    tutorial: [3, 6], brief: 'Kanal tua tersumbat kayu hanyut. Bersihkan intake, dinginkan vent hulu, setel pintu A/B/C (60/35/25%) bersamaan, dorong log ke tambatan, dinginkan vent tengah dan hilir, lalu tarik tuas gerbang akar purba agar anak berang-berang bisa lewat.',
  },
  {
    // 3-21 Punggung Gambut Retak: a fractured peat ridge over blackwater. Cool the upstream vent, clear the intake and
    // float the driftwood onto the rail latch as counterweight, balance A/B/C, tension the root across the crack, cool
    // the middle vent, open the relief and cool the downstream vent for the Sunda pangolin.
    ...peat, id: 56, code: '3-21', name: 'Punggung Gambut Retak', width: 2450, waterBudget: 125, supply: 150,
    lands: [{ x0: -80, x1: 1380, top: 548 }, { x0: 1380, x1: 1520, top: 612 }, { x0: 1520, x1: 1600, top: 548 }, { x0: 1900, x1: 2550, top: 548 }], bridges: [],
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(2060, 548, .8)],
    decor: [...palms(60, 2490), { key: 'sm-log-moss', x: 1750, y: 640, scale: .7, back: true }, { key: 'tree-c', x: 2300, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan', 'hilir'] },
      respawn: { minX: 900, unless: 'rel' },
      pits: [{ x0: 1380, x1: 1520, top: 548 }],
      bridges: [{ id: 'jembatan', hingeX: 1900, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Padamkan vent hulu', need: ['hulu'] },
          { title: 'Bersihkan intake, apungkan log pemberat ke kait rel', need: ['intake', 'rel'] },
          { title: 'Seimbangkan pintu A/B/C', need: ['abc'] },
          { title: 'Tegangkan jembatan akar di atas retakan', need: ['akar'] },
          { title: 'Padamkan vent tengah', need: ['tengah'] },
          { title: 'Buka relief, padamkan vent hilir', need: ['relief', 'hilir'] },
        ],
        clears: [{ id: 'intake', x0: 860, x1: 1150, after: ['hulu'] }],
        vents: [{ id: 'hulu', x: 720, y: 548 }, { id: 'tengah', x: 1560, y: 548, after: ['akar'] }, { id: 'hilir', x: 1980, y: 548, after: ['relief'] }],
        dials: [
          sluice('a', 'Pintu A', 900, 440, [.42, .58], { group: 'abc' }),
          sluice('b', 'Pintu B', 1050, 350, [.27, .43], { group: 'abc' }),
          sluice('c', 'Pintu C', 1200, 270, [.37, .53], { group: 'abc' }),
          winch('akar', 'Akar jembatan', 1460, 330, { after: ['abc'] }),
          crank('relief', 'Katup relief', 1720, 250, { after: ['tengah'] }),
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['rel'] }],
        sockets: [{ id: 'rel', x0: 1380, x1: 1520, top: 548 }],
      },
    },
    animal: { key: 'trenggiling', name: 'Trenggiling Sunda', x: 2250, y: 548, scale: .7, flip: true },
    tutorial: [3, 6], brief: 'Punggung gambut retak di atas sungai hitam. Padamkan vent hulu, bersihkan intake dan dorong kayu hanyut ke kait rel sebagai pemberat. Seimbangkan pintu A/B/C, tegangkan akar di atas retakan, padamkan vent tengah, buka relief, lalu padamkan vent hilir untuk trenggiling.',
  },
  {
    // 3-22 Simpul Arus Purba: an oxbow pool cut off by the fire. Cool the vent, clear the intake, set A/B/C to
    // 45/30/40%, tension the root, cool the middle and downstream vents, then open the fish gate and refill the pool:
    // the Mahakam dolphin calf is safe once its water is deep again.
    ...peat, id: 57, code: '3-22', name: 'Simpul Arus Purba', width: 2400, waterBudget: 130, supply: 150,
    lands: [{ x0: -80, x1: 1300, top: 548 }, { x0: 1600, x1: 2500, top: 548 }], bridges: [],
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(2220, 548, .8)],
    decor: [...palms(60, 2440), { key: 'sm-fern-a', x: 1880, y: 556, scale: .7 }, { key: 'tree-flower', x: 2300, y: 556, scale: .7 }],
    sm: {
      rescue: { flagX: 2040, after: ['ikan', 'kolam'] },
      respawn: { minX: 900, unless: 'intake' },
      bridges: [{ id: 'jembatan', hingeX: 1600, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      basins: [{ id: 'kolam', x0: 1950, x1: 2130, floor: 548, depth: 70, leak: 2, band: [.9, 1] }],
      kit: {
        steps: [
          { title: 'Dinginkan vent hulu', need: ['hulu'] },
          { title: 'Bersihkan intake kanal', need: ['intake'] },
          { title: 'Setel pintu A 45%, B 30%, C 40%', need: ['abc'] },
          { title: 'Tegangkan jembatan akar', need: ['akar'] },
          { title: 'Padamkan vent tengah dan hilir', need: ['tengah', 'hilir'] },
          { title: 'Buka pintu ikan ≥ 80%', need: ['ikan'] },
          { title: 'Isi kolam pesut sampai dalam (90%)', need: ['kolam'] },
        ],
        vents: [{ id: 'hulu', x: 720, y: 548 }, { id: 'tengah', x: 1700, y: 548, after: ['akar'] }, { id: 'hilir', x: 1830, y: 548, after: ['tengah'] }],
        clears: [{ id: 'intake', x0: 860, x1: 1150, after: ['hulu'] }],
        dials: [
          sluice('a', 'Pintu A', 900, 440, [.37, .53], { group: 'abc' }),
          sluice('b', 'Pintu B', 1050, 350, [.22, .38], { group: 'abc' }),
          sluice('c', 'Pintu C', 1200, 270, [.32, .48], { group: 'abc' }),
          winch('akar', 'Akar jembatan', 1360, 330, { after: ['abc'] }),
          sluice('ikan', 'Pintu ikan', 1900, 300, [.8, 1], { after: ['hilir'] }),
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['intake'] }],
      },
    },
    animal: { key: 'pesut', name: 'Anak Pesut Mahakam', x: 2040, y: 540, scale: .4, flip: true },
    tutorial: [3, 6], brief: 'Anak pesut terjebak di kolam mati yang mengering. Dinginkan vent hulu, bersihkan intake, setel pintu A/B/C (45/30/40%), tegangkan akar, padamkan vent tengah dan hilir. Buka pintu ikan lalu isi kolam sampai garis hijau agar anak pesut aman.',
  },
  {
    // 3-23 Labirin Akar Tenggelam: a maze of sunken root walls. Clear the intake into the root pocket, cool the vent,
    // tune A/B/C and prime the siphon (the first root wall sinks), tension the root arch over the channel, cool the
    // middle then downstream vents (the second wall sinks), and calm the rescue eddy for the fishing cat.
    ...peat, id: 58, code: '3-23', name: 'Labirin Akar Tenggelam', width: 2400, waterBudget: 130, supply: 150,
    lands: [{ x0: -80, x1: 1060, top: 548 }, { x0: 1060, x1: 1200, top: 612 }, { x0: 1200, x1: 1520, top: 548 }, { x0: 1720, x1: 2500, top: 548 }], bridges: [],
    gates: [{ id: 'akar-1', x: 1260, y0: 420, y1: 548, style: 'stone' }, { id: 'akar-2', x: 1960, y0: 420, y1: 548, style: 'stone' }],
    props: [{ kind: 'log', x: 940, y: 514 }],
    fires: [fire(2060, 548, .8)],
    decor: [...palms(60, 2440), { key: 'sm-vines', x: 1260, y: 300, scale: .8, back: true }, { key: 'sm-vines', x: 1960, y: 300, scale: .8, back: true }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan', 'akar-2', 'pusaran'] },
      respawn: { minX: 860, unless: 'intake' },
      pits: [{ x0: 1060, x1: 1200, top: 548 }],
      bridges: [{ id: 'jembatan', hingeX: 1720, hingeY: 548, len: 200, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Bersihkan intake akar ke ceruk', need: ['intake'] },
          { title: 'Dinginkan vent hulu', need: ['hulu'] },
          { title: 'Atur A 40%, B 35%, C 25% dan pompa sifon', need: ['abc', 'sifon'] },
          { title: 'Tegangkan lengkung akar', need: ['akar'] },
          { title: 'Padamkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Tenangkan pusaran penyelamatan', need: ['pusaran'] },
        ],
        sockets: [{ id: 'intake', x0: 1060, x1: 1200, top: 548 }],
        vents: [{ id: 'hulu', x: 720, y: 548 }, { id: 'tengah', x: 1780, y: 548, after: ['akar'] }, { id: 'hilir', x: 1880, y: 548, after: ['tengah'], opens: 'akar-2' }],
        dials: [
          sluice('a', 'Pintu A', 880, 440, [.32, .48], { group: 'abc' }),
          sluice('b', 'Pintu B', 1040, 350, [.27, .43], { group: 'abc' }),
          sluice('c', 'Pintu C', 1200, 270, [.17, .33], { group: 'abc' }),
          pump('sifon', 'Sifon', 1360, 420, { after: ['abc'], opens: 'akar-1' }),
          winch('akar', 'Lengkung akar', 1460, 320, { after: ['sifon'] }),
          sluice('pusaran', 'Peredam pusaran', 1640, 250, [0, .25], { start: .9, hold: 4, after: ['hilir'] }),
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['hulu'] }],
      },
    },
    animal: { key: 'kucing-bakau', name: 'Kucing Bakau', x: 2200, y: 548, scale: .45, flip: true },
    tutorial: [3, 6], brief: 'Labirin akar tenggelam menutup jalan kucing bakau. Dorong kayu dari intake ke ceruk, dinginkan vent, setel A/B/C (40/35/25%) dan pompa sifon — dinding akar pertama turun. Tegangkan lengkung akar, padamkan vent tengah dan hilir, lalu tenangkan pusaran (zona hijau bawah) selama 4 detik.',
  },
  {
    // 3-24 Kubah Kabut Gambut: a peat dome full of condensation fog. Cool the upstream vent, prime the siphon, run the
    // fog extractor until the dome clears, balance A/B/C at 40/35/25%, cool the middle and downstream vents, then
    // tension the root bridge for the young orangutan.
    ...peat, id: 59, code: '3-24', name: 'Kubah Kabut Gambut', width: 2400, waterBudget: 130, supply: 150,
    lands: [{ x0: -80, x1: 1420, top: 548 }, { x0: 1720, x1: 2500, top: 548 }], bridges: [],
    props: [],
    fires: [fire(1820, 548, .8), fire(1960, 548, .3, false)],
    decor: [...palms(60, 2440), { key: 'tree-large', x: 1100, y: 620, scale: 1, back: true }, { key: 'tree-b', x: 2200, y: 556, scale: .8 }, { key: 'sm-bush-red', x: 1960, y: 554, scale: .6, fuel: 1 }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan'] },
      bridges: [{ id: 'jembatan', hingeX: 1720, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Padamkan vent gambut hulu', need: ['hulu'] },
          { title: 'Priming sifon utama', need: ['sifon'] },
          { title: 'Jalankan pengisap kabut sampai kubah jernih', need: ['kubah'] },
          { title: 'Seimbangkan pintu A 40%, B 35%, C 25%', need: ['abc'] },
          { title: 'Padamkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Tegangkan jembatan akar', need: ['akar'] },
        ],
        vents: [{ id: 'hulu', x: 700, y: 548 }, { id: 'tengah', x: 1220, y: 548, after: ['abc'] }, { id: 'hilir', x: 1350, y: 548, after: ['tengah'] }],
        dials: [
          pump('sifon', 'Sifon utama', 840, 430, { after: ['hulu'] }),
          sluice('kubah', 'Pengisap kabut', 960, 330, [.7, 1], { hold: 3, after: ['sifon'] }),
          sluice('a', 'Pintu A', 1080, 440, [.32, .48], { group: 'abc' }),
          sluice('b', 'Pintu B', 1230, 340, [.27, .43], { group: 'abc' }),
          sluice('c', 'Pintu C', 1380, 260, [.17, .33], { group: 'abc' }),
          winch('akar', 'Akar jembatan', 1520, 320, { after: ['hilir'] }),
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['kubah'] }],
        fogs: [{ x0: 1020, x1: 1700, y0: 180, y1: 600, until: 'kubah', tint: 0xb8c4b4 }],
      },
    },
    animal: { key: 'orangutan', name: 'Orangutan Muda', x: 2050, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Kubah gambut tertutup kabut kondensasi. Padamkan vent hulu, pompa sifon, lalu jalankan pengisap kabut (zona hijau) selama 3 detik sampai kubah jernih. Seimbangkan pintu A/B/C (40/35/25%), padamkan vent tengah dan hilir, dan tegangkan jembatan akar untuk orangutan muda.',
  },
  {
    // 3-25 Delta Arus Berbalik: the delta current runs the wrong way. Clear the intake, cool the vent, balance A/B/C at
    // 55/25/45%, spin the reverser wheel until the current turns and its chain gate locks open, tension the root, cool
    // the middle then downstream vents for the young proboscis monkey.
    ...peat, id: 60, code: '3-25', name: 'Delta Arus Berbalik', width: 2400, waterBudget: 130, supply: 150,
    lands: [{ x0: -80, x1: 1350, top: 548 }, { x0: 1650, x1: 2500, top: 548 }], bridges: [],
    wheel: { x: 1470, y: 420, r: 52 },
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(2050, 548, .8)],
    decor: [...palms(60, 2440), { key: 'sm-aframe', x: 1470, y: 650, scale: 1.2, back: true }, { key: 'tree-c', x: 2250, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan', 'chain', 'hilir'] },
      respawn: { minX: 900, unless: 'intake' },
      chainGate: { id: 'chain', x: 1720, y0: 420, y1: 548, speed: 2.4, hold: 3 },
      bridges: [{ id: 'jembatan', hingeX: 1650, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Bersihkan intake kanal', need: ['intake'] },
          { title: 'Padamkan vent gambut hulu', need: ['hulu'] },
          { title: 'Seimbangkan pintu A 55%, B 25%, C 45%', need: ['abc'] },
          { title: 'Putar roda pembalik arus 3 detik', need: ['chain'] },
          { title: 'Tegangkan jembatan akar', need: ['akar'] },
          { title: 'Padamkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
        ],
        clears: [{ id: 'intake', x0: 860, x1: 1150 }],
        vents: [{ id: 'hulu', x: 1250, y: 548, after: ['intake'] }, { id: 'tengah', x: 1800, y: 548, after: ['akar'] }, { id: 'hilir', x: 1930, y: 548, after: ['tengah'] }],
        dials: [
          sluice('a', 'Pintu A', 900, 440, [.47, .63], { group: 'abc' }),
          sluice('b', 'Pintu B', 1050, 350, [.17, .33], { group: 'abc' }),
          sluice('c', 'Pintu C', 1200, 270, [.37, .53], { group: 'abc' }),
          winch('akar', 'Akar jembatan', 1330, 330, { after: ['chain'] }),
        ],
        balances: [{ id: 'abc', dials: ['a', 'b', 'c'], hold: 2, after: ['hulu'] }],
      },
    },
    animal: { key: 'bekantan', name: 'Anak Bekantan', x: 2150, y: 548, scale: .45, flip: true },
    tutorial: [3, 6], brief: 'Arus delta berbalik arah. Bersihkan intake, padamkan vent hulu, seimbangkan pintu A/B/C (55/25/45%), lalu semprot roda pembalik terus-menerus sampai rantai gerbang terkunci. Tegangkan jembatan akar dan padamkan vent tengah serta hilir untuk anak bekantan.',
  },
  {
    // 3-26 Bendungan Akar Berdenyut: a dam of pulsing roots. Clear the debris catcher, cool the vent, prime the siphon
    // and fill chamber A, then set the three pulse chambers: their wheels only turn while the root pulse is low (green
    // light). Cool the middle and downstream vents and stretch the root bridge in a low pulse for the sun bear cub.
    ...peat, id: 61, code: '3-26', name: 'Bendungan Akar Berdenyut', width: 2450, waterBudget: 135, supply: 150,
    lands: [{ x0: -80, x1: 1400, top: 548 }, { x0: 1720, x1: 2550, top: 548 }], bridges: [],
    rocks: [{ x0: 1440, x1: 1600, y0: 240, y1: 270 }],
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(1800, 548, .8), fire(1950, 548, .3, false)],
    decor: [...palms(60, 2490), { key: 'sm-bush-red', x: 1950, y: 554, scale: .6, fuel: 1 }, { key: 'tree-large', x: 1560, y: 640, scale: 1, back: true }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan'] },
      respawn: { minX: 900, unless: 'tangkap' },
      basins: [{ id: 'ruang-a', x0: 1450, x1: 1590, floor: 240, depth: 60, spray: true, band: [.7, 1] }],
      bridges: [{ id: 'jembatan', hingeX: 1720, hingeY: 548, len: 320, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Bersihkan penangkap kayu bendungan', need: ['tangkap'] },
          { title: 'Dinginkan vent gambut hulu', need: ['hulu'] },
          { title: 'Pompa sifon dan isi ruang A ≥ 70%', need: ['sifon', 'ruang-a'] },
          { title: 'Atur ruang denyut A 55%, B 40%, C 30% saat denyut rendah', need: ['denyut'] },
          { title: 'Padamkan vent tengah lalu hilir', need: ['tengah', 'hilir'] },
          { title: 'Rentangkan akar saat denyut rendah', need: ['akar'] },
          { title: 'Padamkan api seberang, selamatkan anak beruang madu', need: ['fire:0'] },
        ],
        clears: [{ id: 'tangkap', x0: 860, x1: 1150 }],
        vents: [{ id: 'hulu', x: 1250, y: 548, after: ['tangkap'] }, { id: 'tengah', x: 1100, y: 548, after: ['denyut'] }, { id: 'hilir', x: 1330, y: 548, after: ['tengah'] }],
        dials: [
          pump('sifon', 'Sifon', 820, 330, { after: ['hulu'] }),
          sluice('a', 'Ruang A', 900, 390, [.47, .63], { group: 'denyut', pulse: 3 }),
          sluice('b', 'Ruang B', 1050, 340, [.32, .48], { group: 'denyut', pulse: 3 }),
          sluice('c', 'Ruang C', 1200, 260, [.22, .38], { group: 'denyut', pulse: 3 }),
          winch('akar', 'Akar jembatan', 1520, 360, { after: ['hilir'], pulse: 3 }),
        ],
        balances: [{ id: 'denyut', dials: ['a', 'b', 'c'], hold: 2, after: ['ruang-a'] }],
      },
    },
    animal: { key: 'beruang', name: 'Anak Beruang Madu', x: 2200, y: 548, scale: .5, flip: true },
    tutorial: [3, 6], brief: 'Bendungan akar berdenyut. Bersihkan penangkap kayu, dinginkan vent, pompa sifon dan isi ruang A. Roda ruang denyut hanya bisa diputar saat lampu denyut HIJAU — setel A/B/C (55/40/30%). Padamkan vent tengah dan hilir, lalu rentangkan akar saat denyut rendah.',
  },
  {
    // 3-27 Koridor Bara Terakhir: the last ember corridor before the deep basin. Clear the intake screen, isolate vent A,
    // prime the siphon and balance the gates; the ember seam then creeps down the corridor: soak the cells ahead of it.
    // Cool seams B then C, stretch the root in a low pulse and calm the rescue channel for the pygmy elephant calf.
    ...peat, id: 62, code: '3-27', name: 'Koridor Bara Terakhir', width: 2500, waterBudget: 140, supply: 150, spreadDelay: 22,
    lands: [{ x0: -80, x1: 1450, top: 548 }, { x0: 1750, x1: 2600, top: 548 }], bridges: [],
    rocks: [{ x0: 1050, x1: 1450, y0: 250, y1: 290 }],
    props: [{ kind: 'log', x: 760, y: 514 }],
    fires: [fire(1820, 548, .8)],
    decor: [...palms(60, 2540), { key: 'sm-coals', x: 1300, y: 556, scale: .5, back: true }, { key: 'tree-a', x: 2300, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan', 'kanal', 'koridor'] },
      respawn: { minX: 700, unless: 'layar' },
      chambers: [{ x0: 1050, x1: 1450, y0: 280, y1: 548 }],
      firebreak: { id: 'koridor', source: { x: 1070, y: 548 }, cells: [1150, 1250, 1350, 1440], interval: 7, wetFor: 6, first: 6, after: ['gerbang'] },
      bridges: [{ id: 'jembatan', hingeX: 1750, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      kit: {
        steps: [
          { title: 'Bersihkan layar intake', need: ['layar'] },
          { title: 'Isolasi vent hulu A', need: ['vent-a'] },
          { title: 'Pompa sifon dan seimbangkan pintu', need: ['sifon', 'gerbang'] },
          { title: 'Sekat bara yang merambat di koridor', need: ['koridor'] },
          { title: 'Dinginkan seam B lalu C', need: ['seam-b', 'seam-c'] },
          { title: 'Rentangkan akar saat denyut rendah', need: ['akar'] },
          { title: 'Tenangkan kanal penyelamatan', need: ['kanal'] },
        ],
        clears: [{ id: 'layar', x0: 700, x1: 900 }],
        vents: [{ id: 'vent-a', x: 700, y: 548, after: ['layar'] }, { id: 'seam-b', x: 1200, y: 548, after: ['koridor'] }, { id: 'seam-c', x: 1400, y: 548, after: ['seam-b'] }],
        dials: [
          pump('sifon', 'Sifon', 820, 330, { after: ['vent-a'] }),
          sluice('pa', 'Pintu A', 900, 430, [.42, .58], { group: 'gerbang' }),
          sluice('pb', 'Pintu B', 1000, 330, [.27, .43], { group: 'gerbang' }),
          winch('akar', 'Akar jembatan', 1620, 160, { after: ['seam-c'], pulse: 3 }),
          sluice('kanal', 'Peredam kanal', 1700, 420, [0, .3], { start: .6, hold: 4, after: ['akar'] }),
        ],
        balances: [{ id: 'gerbang', dials: ['pa', 'pb'], hold: 2, after: ['sifon'] }],
      },
    },
    animal: { key: 'anak-gajah', name: 'Anak Gajah Kerdil Kalimantan', x: 2150, y: 548, scale: .8, flip: true, frames: ['sm-gajah-b', 'sm-gajah-c'] },
    tutorial: [3, 6], brief: 'Koridor bara terakhir sebelum cekungan terdalam. Bersihkan layar intake, isolasi vent A, pompa sifon dan seimbangkan pintu. Bara lalu merambat di koridor: basahi dua semak di depannya. Padamkan seam B dan C, rentangkan akar saat denyut rendah, dan tenangkan kanal untuk anak gajah kerdil.',
  },
  {
    // 3-28 Gerbang Nadi Purba: the ancient root iris. Clear the intake, prime the siphon, balance the three pressure
    // chambers at 50/35/30%, cool the vents upstream to downstream (the iris opens), tension the root bridge, then wind
    // the rescue cradle across the channel and back with the helmeted hornbill chick.
    ...peat, id: 63, code: '3-28', name: 'Gerbang Nadi Purba', width: 2600, waterBudget: 140, supply: 150,
    lands: [{ x0: -80, x1: 1400, top: 548 }, { x0: 1700, x1: 2000, top: 548 }, { x0: 2300, x1: 2700, top: 548 }], bridges: [],
    gates: [{ id: 'iris', x: 1300, y0: 360, y1: 548, style: 'stone' }],
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(1780, 548, .8), fire(1900, 548, .8)],
    decor: [...palms(60, 2640), { key: 'sm-vines', x: 1300, y: 260, scale: 1, back: true }, { key: 'tree-flower', x: 2500, y: 556, scale: .7 }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan', 'iris'] },
      respawn: { minX: 900, unless: 'intake' },
      bridges: [{ id: 'jembatan', hingeX: 1700, hingeY: 548, len: 300, dir: -1, locks: [], after: ['akar'] }],
      gondola: { id: 'keranjang', a: { x: 2080, y: 458 }, b: { x: 2220, y: 458 }, sag: 0, drop: 98, speed: .05, slide: 0, driver: 'katrol', after: ['akar'], look: 'raft' },
      kit: {
        steps: [
          { title: 'Bersihkan intake kanal', need: ['intake'] },
          { title: 'Priming sifon', need: ['sifon'] },
          { title: 'Seimbangkan ruang tekanan A 50%, B 35%, C 30%', need: ['ruang'] },
          { title: 'Isolasi vent hulu → tengah → hilir', need: ['hulu', 'tengah', 'hilir'] },
          { title: 'Tegangkan jembatan akar', need: ['akar'] },
          { title: 'Padamkan api pulau', need: ['fire:0', 'fire:1'] },
          { title: 'Tarik keranjang ke anak rangkong gading', need: ['keranjang'] },
          { title: 'Bawa keranjang pulang', need: ['keranjang:home'] },
        ],
        clears: [{ id: 'intake', x0: 860, x1: 1150 }],
        vents: [{ id: 'hulu', x: 700, y: 548, after: ['ruang'] }, { id: 'tengah', x: 1150, y: 548, after: ['hulu'] }, { id: 'hilir', x: 1250, y: 548, after: ['tengah'], opens: 'iris' }],
        dials: [
          pump('sifon', 'Sifon', 820, 330, { after: ['intake'] }),
          sluice('a', 'Ruang A', 960, 390, [.42, .58], { group: 'ruang' }),
          sluice('b', 'Ruang B', 1100, 350, [.27, .43], { group: 'ruang' }),
          sluice('c', 'Ruang C', 1240, 260, [.22, .38], { group: 'ruang' }),
          winch('akar', 'Akar jembatan', 1500, 320, { after: ['hilir'] }),
          { id: 'katrol', label: 'Winch keranjang', x: 1880, y: 330, kind: 'winch', mode: 'set', start: .5, band: [2, 2], after: ['akar'] },
        ],
        balances: [{ id: 'ruang', dials: ['a', 'b', 'c'], hold: 2, after: ['sifon'] }],
      },
    },
    animal: { key: 'rangkong', name: 'Anak Rangkong Gading', x: 2450, y: 548, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Gerbang nadi purba menutup jalan. Bersihkan intake, pompa sifon, seimbangkan tiga ruang tekanan (50/35/30%), lalu isolasi vent dari hulu ke hilir — iris akar terbuka. Tegangkan jembatan, padamkan api pulau, tarik keranjang ke anak rangkong gading dan bawa pulang.',
  },
  {
    // 3-29 Ambang Jantung Gambut: the threshold of the peat heart. Clear the intake, prime the siphon, set the chambers
    // to 50/35/30%, cool the vent chain upstream to downstream, open all three cooling channels at once to seal the
    // threshold, then lock the root anchors (the iris opens) for the bay cat kitten.
    ...peat, id: 64, code: '3-29', name: 'Ambang Jantung Gambut', width: 2500, waterBudget: 140, supply: 150,
    lands: [{ x0: -80, x1: 1450, top: 548 }, { x0: 1750, x1: 2600, top: 548 }], bridges: [],
    rocks: [{ x0: 1480, x1: 1720, y0: 230, y1: 260 }],
    gates: [{ id: 'iris', x: 1850, y0: 360, y1: 548, style: 'stone' }],
    props: [{ kind: 'log', x: 980, y: 514 }],
    fires: [fire(1940, 548, .8)],
    decor: [...palms(60, 2540), { key: 'sm-coals', x: 1600, y: 556, scale: .5, back: true }, { key: 'tree-c', x: 2350, y: 556, scale: .8 }],
    sm: {
      rescue: { flagX: 620, after: ['jembatan', 'iris'] },
      respawn: { minX: 900, unless: 'intake' },
      basins: [{ id: 'pendingin', x0: 1490, x1: 1710, floor: 230, depth: 60, spray: true,
        valves: [
          { id: 'saluran-1', handle: { x: 1460, y: 160 }, out: { x: 1150, y: 500, vx: 10 }, rate: 22, pipe: [{ x: 1490, y: 224 }, { x: 1150, y: 224 }, { x: 1150, y: 496 }] },
          { id: 'saluran-2', handle: { x: 1580, y: 150 }, out: { x: 1270, y: 500, vx: 10 }, rate: 22, pipe: [{ x: 1600, y: 224 }, { x: 1270, y: 238 }, { x: 1270, y: 496 }] },
          { id: 'saluran-3', handle: { x: 1700, y: 160 }, out: { x: 1390, y: 500, vx: 10 }, rate: 22, pipe: [{ x: 1710, y: 224 }, { x: 1390, y: 252 }, { x: 1390, y: 496 }] },
        ] }],
      bridges: [{ id: 'jembatan', hingeX: 1750, hingeY: 548, len: 300, dir: -1, locks: [], after: ['jangkar'] }],
      kit: {
        steps: [
          { title: 'Bersihkan penangkap kayu dan intake', need: ['intake'] },
          { title: 'Priming sifon', need: ['sifon'] },
          { title: 'Seimbangkan ruang A 50%, B 35%, C 30%', need: ['ruang'] },
          { title: 'Padamkan tiga vent berurutan', need: ['v1', 'v2', 'v3'] },
          { title: 'Isi bak pendingin, buka ketiga saluran', need: ['saluran-1', 'saluran-2', 'saluran-3'] },
          { title: 'Kunci jangkar akar — ambang terbuka', need: ['jangkar'] },
          { title: 'Padamkan api, selamatkan anak kucing merah', need: ['fire:0'] },
        ],
        clears: [{ id: 'intake', x0: 860, x1: 1150 }],
        vents: [{ id: 'v1', x: 700, y: 548, after: ['ruang'] }, { id: 'v2', x: 1200, y: 548, after: ['v1'] }, { id: 'v3', x: 1330, y: 548, after: ['v2'] }],
        dials: [
          pump('sifon', 'Sifon', 820, 330, { after: ['intake'] }),
          sluice('a', 'Ruang A', 960, 390, [.42, .58], { group: 'ruang' }),
          sluice('b', 'Ruang B', 1100, 350, [.27, .43], { group: 'ruang' }),
          sluice('c', 'Ruang C', 1240, 260, [.22, .38], { group: 'ruang' }),
          winch('jangkar', 'Jangkar akar', 1600, 340, { after: ['saluran-1', 'saluran-2', 'saluran-3'], opens: 'iris' }),
        ],
        balances: [{ id: 'ruang', dials: ['a', 'b', 'c'], hold: 2, after: ['sifon'] }],
      },
    },
    animal: { key: 'kucing-merah', name: 'Anak Kucing Merah', x: 2250, y: 548, scale: .42, flip: true },
    tutorial: [3, 6], brief: 'Ambang jantung gambut, satu langkah sebelum inti. Bersihkan intake, pompa sifon, seimbangkan ruang A/B/C, padamkan tiga vent berurutan. Isi bak pendingin lalu buka ketiga saluran bersamaan, kunci jangkar akar agar ambang terbuka, dan selamatkan anak kucing merah.',
  },
  {
    // 3-30 Jantung Bara Gambut (final boss): the peat heart is sealed by its vent ring, pressure chambers, cooling jets
    // and root clamps. Seal vents A, B, C; prime the siphon and balance the chambers; open the three cooling jets;
    // release the three clamps; then suppress the exposed heart in bursts while it hurls embers. The orangutan walks out.
    ...peat, id: 65, code: '3-30', name: 'Jantung Bara Gambut', width: 2600, waterBudget: 220, supply: 220, burnRate: .22,
    lands: [{ x0: -80, x1: 1400, top: 548 }, { x0: 1400, x1: 1480, top: 510 }, { x0: 1480, x1: 1760, top: 470 }, { x0: 1760, x1: 1840, top: 510 }, { x0: 1840, x1: 2700, top: 548 }], bridges: [],
    boss: { x: 1620, y: 470, hp: 34, arena: 1400, name: 'Jantung Bara Gambut', sprite: 'k-boss-heart', scale: .6, muzzle: { x: -40, y: -110 }, sealedPace: 2.5, noJet: true, perches: [{ x: 1620, y: 470 }] },
    rocks: [{ x0: 1280, x1: 1400, y0: 150, y1: 180 }],
    props: [],
    fires: [fire(640, 548, .8)],
    decor: [...palms(60, 2640), { key: 'sm-coals', x: 1620, y: 476, scale: .8 }, { key: 'tree-large', x: 1620, y: 640, scale: 1.2, back: true }],
    sm: {
      rescue: { flagX: 600, after: ['boss'] },
      shield: { fires: [], relight: 0, needs: ['va', 'vb', 'vc', 'ruang', 'jet-1', 'jet-2', 'jet-3', 'klem'], windows: [4, 3] },
      basins: [{ id: 'jet', x0: 1290, x1: 1390, floor: 150, depth: 50, spray: true,
        valves: [
          { id: 'jet-1', handle: { x: 1180, y: 500 }, out: { x: 1500, y: 300, vx: 60 }, rate: 14, pipe: [{ x: 1390, y: 144 }, { x: 1500, y: 296 }] },
          { id: 'jet-2', handle: { x: 1260, y: 470 }, out: { x: 1620, y: 250, vx: 0 }, rate: 14, pipe: [{ x: 1390, y: 130 }, { x: 1620, y: 246 }] },
          { id: 'jet-3', handle: { x: 1340, y: 440 }, out: { x: 1740, y: 300, vx: -60 }, rate: 14, pipe: [{ x: 1390, y: 116 }, { x: 1740, y: 296 }] },
        ] }],
      kit: {
        steps: [
          { title: 'Segel tiga vent: A → B → C', need: ['va', 'vb', 'vc'] },
          { title: 'Pompa sifon, seimbangkan ruang tekanan', need: ['sifon', 'ruang'] },
          { title: 'Isi bak dan alirkan tiga jet pendingin', need: ['jet-1', 'jet-2', 'jet-3'] },
          { title: 'Lepaskan tiga klem akar', need: ['klem'] },
          { title: 'Padamkan jantung bara saat terbuka', need: ['boss'] },
        ],
        vents: [{ id: 'va', x: 820, y: 548 }, { id: 'vb', x: 1050, y: 548, after: ['va'] }, { id: 'vc', x: 1300, y: 548, after: ['vb'] }],
        dials: [
          pump('sifon', 'Sifon', 900, 440, { after: ['vc'] }),
          sluice('a', 'Ruang A', 1000, 440, [.42, .58], { group: 'ruang' }),
          sluice('b', 'Ruang B', 1120, 350, [.27, .43], { group: 'ruang' }),
          sluice('c', 'Ruang C', 1240, 300, [.22, .38], { group: 'ruang' }),
        ],
        balances: [{ id: 'ruang', dials: ['a', 'b', 'c'], hold: 2, after: ['sifon'] }],
        sequences: [{ id: 'klem', hits: 12, after: ['jet-1', 'jet-2', 'jet-3'], points: [{ x: 1470, y: 300, label: 'Klem 1' }, { x: 1620, y: 210, label: 'Klem 2' }, { x: 1770, y: 300, label: 'Klem 3' }] }],
      },
    },
    animal: { key: 'orangutan', name: 'Orangutan Muda', x: 2150, y: 548, scale: .55, flip: true },
    tutorial: [6], brief: 'Jantung Bara Gambut — pertarungan terakhir Kalimantan. Segel vent A, B, C; pompa sifon dan seimbangkan ruang tekanan; isi bak lalu buka tiga jet pendingin; lepaskan tiga klem akar berurutan. Saat inti terbuka, semprot jantung bara sambil menahan semburan baranya.',
  },
];
