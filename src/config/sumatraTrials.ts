import type { LevelDef } from './levels';

// Levels 2-10 to 2-19: each one is built around a mechanism of its own (src/scenes/SumatraTrials.ts) rather than a
// new arrangement of an earlier puzzle. Refill points let a failed approach be retried without restarting.
const cave = { theme: 'cave' as const, region: 'sumatra' as const, supply: 120, burnRate: .32, spreadDelay: 15, truckX: 220, driveMin: 160 };

export const SUMATRA_TRIALS: LevelDef[] = [
  {
    // Akar Jembatan: the root at the cliff edge grows across the gorge only while its tip is watered, and withers
    // back when left dry. The fire at its foot scorches it until it is out.
    ...cave, id: 25, code: '2-10', name: 'Akar Jembatan', width: 1950, waterBudget: 70,
    driveMax: 430, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 820, top: 548 }, { x0: 1190, x1: 2050, top: 548 }], bridges: [], props: [],
    // Overhang above the gorge: a lob cannot fall on the tip, the stream has to run in under it.
    rocks: [{ x0: 930, x1: 1120, y0: 300, y1: 360 }],
    fires: [
      { x: 780, y: 548, start: .5, growth: .004, lit: true, max: .8 },
      { x: 1330, y: 548, start: .55, growth: .005, lit: true },
      { x: 1520, y: 548, start: .3, growth: .003, lit: false, max: .7 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-falls-tall', x: 1010, y: 660, scale: 1.4, back: true },
      { key: 'sm-bush-red', x: 1520, y: 554, scale: .6, fuel: 2 },
      { key: 'sm-palm-b', x: 1880, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 640, after: ['root'] },
      root: { id: 'root', x: 820, y: 548, len: 380, dir: 1, need: 900, fire: 0 },
    },
    animal: { key: 'trenggiling', name: 'Trenggiling', x: 1660, y: 548, scale: .7, flip: true },
    tutorial: [3, 6], brief: 'Trenggiling terjebak di seberang jurang. Padamkan api di pangkal akar raksasa, lalu siram UJUNG akar terus-menerus — akar tumbuh menyeberang. Kalau dibiarkan kering, akar layu memendek. Ikuti ujungnya sampai menyentuh tebing seberang.',
  },
  {
    // Giring Rusa: the deer bolts away from every splash near it. Splash behind it to drive it on, never in front.
    // The low passage stops the truck, so the far half is herded with long shots under the roof.
    ...cave, id: 26, code: '2-11', name: 'Giring Rusa', width: 2250, waterBudget: 75,
    driveMax: 560, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 2350, top: 548 }], bridges: [], props: [],
    rocks: [{ x0: 1180, x1: 1480, y0: 250, y1: 400 }],
    fires: [
      { x: 1620, y: 548, start: .55, growth: .005, lit: true },
      { x: 1790, y: 548, start: .5, growth: .005, lit: true },
      { x: 2060, y: 548, start: .3, growth: .003, lit: false, max: .7 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-spire-b', x: 1330, y: 260, scale: .5, back: true },
      { key: 'sm-bush-red', x: 2060, y: 554, scale: .6, fuel: 2 },
      { key: 'sm-palm-b', x: 2190, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 1960, speed: 90 },
      herd: { radius: 170, push: 130, min: 1000 },
      chambers: [{ x0: 1180, x1: 1480, y0: 390, y1: 548 }],
    },
    animal: { key: 'rusa-sumatra', name: 'Rusa Sambar', x: 1060, y: 548, scale: .9, flip: false, frames: ['sm-rusa-sumatra-b'] },
    tutorial: [3, 6], brief: 'Rusa panik dan lari MENJAUHI cipratan air. Semprot tanah di BELAKANG rusa untuk menggiringnya ke bendera di ujung goa. Cipratan di depannya membuat rusa mundur — padamkan api di jalur sebelum rusa mendekat.',
  },
  {
    // Runtuhan Stalaktit: three stalactites, three jobs. One fills the pit, one smashes the wooden barricade,
    // one lands on the trigger stone that hauls the cave door up.
    ...cave, id: 27, code: '2-12', name: 'Runtuhan Stalaktit', width: 2150, waterBudget: 70,
    driveMax: 640, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1000, x1: 1130, top: 650 }, { x0: 1130, x1: 2250, top: 548 }], bridges: [], props: [],
    rocks: [
      { x0: 940, x1: 1760, y0: 30, y1: 100 },        // cave roof the stalactites hang from
      { x0: 1790, x1: 2100, y0: 250, y1: 372 },      // den roof
      { x0: 2040, x1: 2100, y0: 372, y1: 548 },      // den back wall
    ],
    gates: [{ id: 'barikade', x: 1370, y0: 400, y1: 548 }, { id: 'goa', x: 1830, y0: 372, y1: 548, style: 'stone' }],
    fires: [
      { x: 1230, y: 548, start: .55, growth: .005, lit: true },
      { x: 1720, y: 548, start: .5, growth: .005, lit: true, max: .9 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-vines', x: 1200, y: 90, scale: .8, back: true },
      { key: 'sm-palm-b', x: 2180, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 900, after: ['goa', 'barikade', 'pit'] },
      pits: [{ x0: 1000, x1: 1130, top: 548 }],
      stalactites: [
        { x: 1065, top: 100, len: 210, need: 70 },
        { x: 1370, top: 100, len: 190, need: 70, smash: 'barikade' },
        { x: 1610, top: 100, len: 240, need: 80, opens: 'goa' },
      ],
      ropes: [{ from: { x: 1610, y: 540 }, via: { x: 1760, y: 200 }, gate: 'goa' }],
      chambers: [{ x0: 1810, x1: 2050, y0: 360, y1: 548 }],
    },
    animal: { key: 'babi-hutan', name: 'Babi Hutan', x: 1950, y: 548, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Tiga stalaktit retak menggantung di atap goa. Semprot sampai runtuh: satu menimbun lubang, satu menghancurkan barikade kayu, satu menimpa batu pemicu pintu goa. Padamkan api agar babi hutan bisa keluar.',
  },
  {
    // Sekat Bakar Gambut: the peat under the roof cannot be put out, and it creeps from bush to bush toward the
    // tapir. Soak the two bushes in front of the front before it moves on; then clear the burnt path.
    ...cave, id: 28, code: '2-13', name: 'Sekat Bakar Gambut', width: 2200, waterBudget: 85,
    driveMax: 380, refill: { x: 260, half: 160 }, spreadDelay: 18,
    lands: [{ x0: -80, x1: 2300, top: 548 }], bridges: [], props: [],
    rocks: [{ x0: 640, x1: 860, y0: 420, y1: 470 }],
    fires: [],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-log-moss', x: 760, y: 560, scale: .5, back: true },
      { key: 'sm-palm-b', x: 2140, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 600, after: ['gambut'] },
      firebreak: { id: 'gambut', source: { x: 760, y: 548 }, cells: [920, 1050, 1180, 1310, 1440, 1570, 1700, 1830], interval: 5, wetFor: 5, first: 2 },
    },
    animal: { key: 'tapir', name: 'Tapir', x: 1960, y: 548, scale: .8, flip: true, frames: ['sm-tapir-b', 'sm-tapir-c'] },
    tutorial: [3, 6], brief: 'Bara gambut di bawah batu tidak bisa dipadamkan dan merambat dari semak ke semak menuju tapir. Buat sekat basah: siram DUA semak di depan api sebelum bara melompat. Setelah tertahan, padamkan sisa api agar tapir bisa lewat.',
  },
  {
    // Pancing Madu: the sun bear leaves its den only for honey. Snap the swinging ropes; honey that lands in a fire
    // is spoilt and grows back on its rope.
    ...cave, id: 29, code: '2-14', name: 'Pancing Madu', width: 2150, waterBudget: 70,
    driveMax: 430, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 2250, top: 548 }], bridges: [], props: [],
    rocks: [
      { x0: 1540, x1: 1660, y0: 200, y1: 240 },
      { x0: 1180, x1: 1320, y0: 170, y1: 210 },
      { x0: 860, x1: 980, y0: 210, y1: 250 },
      { x0: 1760, x1: 2100, y0: 280, y1: 372 },      // den roof
      { x0: 2040, x1: 2100, y0: 372, y1: 548 },
    ],
    fires: [
      { x: 1250, y: 548, start: .55, growth: .005, lit: true },
      { x: 1450, y: 548, start: .3, growth: .003, lit: false, max: .7 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-bush-red', x: 1450, y: 554, scale: .6, fuel: 1 },
      { key: 'sm-palm-b', x: 2180, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 700, speed: 60 },
      lures: [
        { x: 1600, y: 240, rope: 150, hp: 26, swing: 26 },
        { x: 1250, y: 210, rope: 170, hp: 26, swing: 34 },
        { x: 920, y: 250, rope: 140, hp: 26, swing: 22 },
      ],
      chambers: [{ x0: 1780, x1: 2050, y0: 360, y1: 548 }],
    },
    animal: { key: 'beruang', name: 'Beruang Madu', x: 1920, y: 548, scale: .58, flip: true },
    tutorial: [3, 6], brief: 'Beruang madu bersembunyi di sarang dan hanya keluar demi madu. Semprot tali sarang madu yang berayun sampai putus — beruang berjalan memakannya. Madu yang jatuh ke api hangus dan tumbuh lagi. Pancing beruang sampai ke bendera.',
  },
  {
    // Hujan Bara: the calf sets off at once. Cracks in the roof glow, then drop an ember ahead of it: shoot the
    // ember down, or put out the fire it starts. Three embers on the calf and the rescue is lost.
    ...cave, id: 30, code: '2-15', name: 'Hujan Bara', width: 2600, waterBudget: 90, supply: 140,
    driveMax: 440, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 2700, top: 548 }], bridges: [], props: [],
    rocks: [{ x0: 860, x1: 2400, y0: 40, y1: 120 }],
    fires: [{ x: 1700, y: 548, start: .55, growth: .005, lit: true }],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-stalactite-c', x: 1300, y: 120, scale: .7, back: true },
      { key: 'sm-palm-b', x: 2520, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 700, speed: 42 },
      embers: { cracks: [1000, 1180, 1360, 1540, 1720, 1900, 2080, 2260], y: 120, every: 3.4, hp: 4 },
    },
    animal: { key: 'anak-gajah', name: 'Anak Gajah Sumatra', x: 2380, y: 548, scale: .9, flip: true, frames: ['sm-gajah-b', 'sm-gajah-c'] },
    tutorial: [3, 6], brief: 'Anak gajah langsung berjalan ke bendera di bawah atap goa yang retak. Retakan menyala lalu menjatuhkan bara di depannya: tembak bara di udara atau padamkan api yang ditimbulkannya. Tiga kali tertimpa bara, gajah tak bisa diselamatkan!',
  },
  {
    // Tanggul Lumpur: the fires deep in the tunnel are out of reach. Wear the mud dam on the tunnel roof down until
    // the lake breaks through the sinkhole and floods the tunnel, and wash the mud slip off the otter's way out.
    ...cave, id: 31, code: '2-16', name: 'Tanggul Lumpur', width: 2000, waterBudget: 80,
    driveMax: 440, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 2100, top: 548 }], bridges: [], props: [],
    // Tunnel roof (the lake rests on it) and the tunnel's closed far end.
    rocks: [{ x0: 720, x1: 1700, y0: 330, y1: 432 }, { x0: 1640, x1: 1700, y0: 432, y1: 548 }],
    gates: [{ id: 'tanggul', x: 1080, y0: 250, y1: 330, style: 'mud', need: 140 }, { id: 'longsor', x: 700, y0: 476, y1: 548, style: 'mud', need: 60 }],
    reservoirs: [{ x0: 1100, x1: 1440, floor: 330, depth: 70, gate: 'tanggul', out: { x: 1330, y: 470, vx: -150 }, amount: 700 }],
    fires: [
      { x: 1050, y: 548, start: .6, growth: .005, lit: true },
      { x: 1200, y: 548, start: .6, growth: .005, lit: true },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-fern-root', x: 1560, y: 336, scale: .7 },
      { key: 'sm-palm-b', x: 1880, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 640, after: ['longsor'] },
      chambers: [{ x0: 720, x1: 1640, y0: 420, y1: 548 }],
    },
    animal: { key: 'berang', name: 'Berang-berang', x: 1450, y: 548, scale: .75, flip: true },
    tutorial: [3, 6], brief: 'Api di dalam terowongan tak terjangkau semprotan. Kikis tanggul lumpur di atas dataran sampai jebol — air danau membanjiri terowongan. Bersihkan juga longsoran lumpur di mulut terowongan agar berang-berang bisa keluar.',
  },
  {
    // Lori Terbakar: a burning cart swings in the rail valley, sparks lighting the rim bushes at each end of its swing.
    // Hit the moving fire (lead it: the water takes a moment to arrive); doused, its brakes stop it over the slot.
    ...cave, id: 32, code: '2-17', name: 'Lori Terbakar', width: 2000, waterBudget: 55,
    driveMax: 400, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1500, x1: 2100, top: 548 }], bridges: [], props: [],
    fires: [
      { x: 1100, y: 548, start: .6, growth: .004, lit: true, max: 1 },
      { x: 1640, y: 548, start: .5, growth: .005, lit: true },
      { x: 960, y: 548, start: .3, growth: .003, lit: false, max: .7 },
      { x: 1560, y: 548, start: .3, growth: .003, lit: false, max: .7 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-bush-red', x: 960, y: 554, scale: .55, fuel: 2 },
      { key: 'sm-bush-red', x: 1560, y: 554, scale: .55, fuel: 3 },
      { key: 'sm-winch', x: 1250, y: 520, scale: .6, back: true },
      { key: 'sm-palm-b', x: 1920, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 760, after: ['lori'] },
      cart: { id: 'lori', x0: 1000, x1: 1500, y: 548, dip: 50, slot: 120, start: 1100, period: 4.2, fire: 0, rims: [{ x: 960, y: 548 }, { x: 1560, y: 548 }] },
    },
    animal: { key: 'harimau', name: 'Harimau Sumatra', x: 1780, y: 548, scale: .95, flip: true, frames: ['sm-harimau-b', 'sm-harimau-c'] },
    tutorial: [3, 6], brief: 'Lori tambang terbakar berayun di lembah rel dan memercikkan api ke semak di tepinya. Bidik ke arah gerak lori untuk memadamkan apinya — air butuh waktu untuk sampai. Setelah padam, rem lori bekerja dan lori masuk celah menjadi pijakan harimau.',
  },
  {
    // Sarang Rangkong: fires ring the hornbill's nest on the rock pillar. Put them all out, but every drop on the
    // nest soaks it; too many and the eggs fall. The fire behind the nest wants a lob over it.
    ...cave, id: 33, code: '2-18', name: 'Sarang Rangkong', width: 1900, waterBudget: 60,
    driveMax: 420, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 2000, top: 548 }, { x0: 1120, x1: 1380, top: 330 }], bridges: [], props: [],
    rocks: [{ x0: 1380, x1: 1560, y0: 430, y1: 460 }],
    fires: [
      { x: 1160, y: 330, start: .5, growth: .004, lit: true, max: .9 },
      { x: 1355, y: 330, start: .5, growth: .004, lit: true, max: .9 },
      { x: 1490, y: 430, start: .55, growth: .005, lit: true, max: .9 },
      { x: 1700, y: 548, start: .5, growth: .005, lit: true },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-vines', x: 1250, y: 30, scale: 1, back: true },
      { key: 'sm-palm-b', x: 1830, y: 556, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 1250, after: ['sarang'] },
      nest: { id: 'sarang', x: 1250, y: 330, limit: 60, fires: [0, 1, 2, 3] },
    },
    animal: { key: 'rangkong', name: 'Rangkong', x: 1250, y: 316, scale: .62, flip: true },
    tutorial: [3, 6], brief: 'Api mengepung sarang rangkong di puncak tiang batu. Padamkan semua api, tapi JANGAN membasahi sarang — terlalu banyak air dan telurnya jatuh! Api di balik sarang perlu dilob melewatinya. Pakai semburan pendek.',
  },
  {
    // Kereta Gantung: the wheel winds the cable car. Hit it above the axle to send the car across, below to bring it
    // back. The burning cable pylon stops the car until it is out; the orangutan boards at the far station.
    ...cave, id: 34, code: '2-19', name: 'Kereta Gantung', width: 2100, waterBudget: 85,
    driveMax: 470, refill: { x: 260, half: 160 },
    lands: [{ x0: -80, x1: 1000, top: 548 }, { x0: 1420, x1: 2200, top: 400 }], bridges: [], props: [],
    wheel: { x: 770, y: 360, r: 56 },
    fires: [
      { x: 1185, y: 404, start: .55, growth: .004, lit: true, max: .9 },
      { x: 1560, y: 400, start: .55, growth: .005, lit: true },
      { x: 1680, y: 400, start: .3, growth: .003, lit: false, max: .7 },
    ],
    decor: [
      { key: 'sm-palm-a', x: 60, y: 556, scale: .9 },
      { key: 'sm-falls-tall', x: 1320, y: 660, scale: 1.5, back: true },
      { key: 'sm-bush-red', x: 1680, y: 406, scale: .6, fuel: 2 },
      { key: 'sm-palm-b', x: 2040, y: 408, scale: .9 },
    ],
    sm: {
      rescue: { flagX: 880 },
      gondola: { a: { x: 960, y: 450 }, b: { x: 1460, y: 302 }, sag: 24, drop: 98, speed: .022, slide: .03, block: { fire: 0, at: .45 } },
    },
    animal: { key: 'orangutan', name: 'Orangutan Sumatra', x: 1820, y: 400, scale: .55, flip: true },
    tutorial: [3, 6], brief: 'Orangutan menunggu di tebing seberang. Semprot kincir di ATAS porosnya agar kereta gantung berangkat, padamkan tiang kabel yang terbakar dan api di stasiun seberang. Setelah orangutan naik, semprot kincir di BAWAH poros untuk menariknya pulang.',
  },
];
