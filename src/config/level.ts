export const WIDTH = 1280;
export const HEIGHT = 720;
export const RENDER_SCALE = Math.min(window.devicePixelRatio || 1, 2);
export const STEP = 1 / 120;
export const WATER_SPEED = 680;
export const WATER_GRAVITY = 560;
export const WATER_RATE = 165;
export const WATER_USE = 1.4;
export const DROP_DAMAGE = .0052;
export const FIRE_MAX = 1.6;
export const TRUCK_SCALE = .46;

export interface Point { x: number; y: number }
export interface Nozzle extends Point { angle: number }
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ASSETS: Record<string, string> = {
  truck: 'vehicle/truck', wheel: 'vehicle/wheel', 'cannon-base': 'cannon/cannon-base',
  'cannon-arm': 'cannon/cannon-arm', nozzle: 'cannon/nozzle',
  mountains: 'backgrounds/jawa/mountains', hills: 'backgrounds/jawa/hills',
  cloud: 'backgrounds/jawa/cloud', 'tree-large': 'backgrounds/jawa/tree-large',
  'tree-slender': 'backgrounds/jawa/tree-slender', 'tree-small': 'backgrounds/jawa/tree-small',
  'tree-a': 'backgrounds/jawa/tree-a', 'tree-b': 'backgrounds/jawa/tree-b', 'tree-c': 'backgrounds/jawa/tree-c',
  'tree-flower': 'backgrounds/jawa/tree-flower', foreground: 'backgrounds/jawa/foreground',
  bank: 'terrain/bank', bridge: 'terrain/bridge', cliff: 'terrain/cliff', 'right-bank': 'terrain/right-bank',
  'top-a': 'terrain/top-a', 'top-b': 'terrain/top-b', pillar: 'terrain/pillar', ledge: 'terrain/ledge', float: 'terrain/float',
  'coal-hot': 'fire/coal-hot', 'coal-cold': 'fire/coal-cold', 'tongue-a': 'fire/tongue-a', 'tongue-b': 'fire/tongue-b',
  crate: 'props/crate', 'crate-plain': 'props/crate-plain', boulder: 'props/boulder', log: 'props/log',
  'barrel-blue': 'props/barrel-blue', gear: 'props/gear', trough: 'props/trough', seesaw: 'props/seesaw', button: 'props/button', fence: 'props/fence', plank: 'props/plank', stump: 'props/stump', 'water-tower': 'props/water-tower',
  'sign-water': 'ui/sign-water',
  orangutan: 'animals/orangutan', bekantan: 'animals/bekantan', rangkong: 'animals/rangkong', beruang: 'animals/beruang',
  rusa: 'animals/rusa', trenggiling: 'animals/trenggiling', 'raja-udang': 'animals/raja-udang', 'kura-kura': 'animals/kura-kura', gajah: 'animals/gajah', pivot: 'props/pivot', bucket: 'props/bucket', pulley: 'props/pulley',
};
