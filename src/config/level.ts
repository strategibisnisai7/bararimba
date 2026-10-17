export const WIDTH = 1280;
export const HEIGHT = 720;
export const RENDER_SCALE = Math.min(window.devicePixelRatio || 1, 2);
export const STEP = 1 / 120;
export const WATER_SPEED = 680;
export const WATER_GRAVITY = 560;
export const WATER_RATE = 165;
export const WATER_USE = 2.6;
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
  'tree-flower': 'backgrounds/jawa/tree-flower', foreground: 'backgrounds/jawa/foreground', bridge: 'terrain/bridge',
  'top-a': 'terrain/top-a', 'top-b': 'terrain/top-b',
  'coal-hot': 'fire/coal-hot', 'coal-cold': 'fire/coal-cold', 'tongue-a': 'fire/tongue-a',
  crate: 'props/crate', 'crate-plain': 'props/crate-plain', boulder: 'props/boulder', log: 'props/log',
  'barrel-blue': 'props/barrel-blue', gear: 'props/gear', button: 'props/button', fence: 'props/fence', plank: 'props/plank', stump: 'props/stump', 'water-tower': 'props/water-tower',
  'sign-water': 'ui/sign-water',
  orangutan: 'animals/orangutan', bekantan: 'animals/bekantan', rangkong: 'animals/rangkong', beruang: 'animals/beruang',
  rusa: 'animals/rusa', trenggiling: 'animals/trenggiling', 'raja-udang': 'animals/raja-udang', 'kura-kura': 'animals/kura-kura', gajah: 'animals/gajah', 'orangutan-sit': 'animals/orangutan-sit', boss: 'boss/boss', fireball: 'boss/fireball', 'boss-tower': 'boss/tower', 'vp-sky': 'theme/vp-sky', 'p-temple-a': 'theme/p-temple-a', 'p-temple-b': 'theme/p-temple-b', 'p-temple-c': 'theme/p-temple-c', 'p-temple-d': 'theme/p-temple-d', 'p-top': 'theme/p-top', 'p-fill': 'theme/p-fill', 'p-pillar': 'theme/p-pillar', 'p-stupa': 'theme/p-stupa', 'p-gate': 'theme/p-gate', 'p-guardian': 'theme/p-guardian', 'vp-plain': 'theme/vp-plain', 'vp-rocks': 'theme/vp-rocks', 'vp-front': 'theme/vp-front', 'v-top': 'theme/v-top', 'v-fill': 'theme/v-fill', 'v-rock': 'theme/v-rock', 'v-tree': 'theme/v-tree', 'v-spire': 'theme/v-spire', 'babi-hutan': 'animals/babi-hutan', buaya: 'animals/buaya', komodo: 'animals/komodo', ular: 'animals/ular', berang: 'animals/berang', pivot: 'props/pivot', target: 'props/target', bucket: 'props/bucket',
};

/** Assets only some levels need; everything else in ASSETS is loaded for every level. Keeps the first load small. */
export const ASSET_GROUPS: Record<string, string[]> = {
  volcanic: Object.keys(ASSETS).filter(k => k.startsWith('v-') || k.startsWith('vp-')),
  ruins: Object.keys(ASSETS).filter(k => k.startsWith('p-')),
  boss: ['boss', 'fireball', 'boss-tower', 'orangutan-sit'],
};
export function assetsFor(theme?: string, boss?: boolean) {
  const grouped = new Set(Object.values(ASSET_GROUPS).flat());
  const keys = Object.keys(ASSETS).filter(k => !grouped.has(k));
  if (theme && ASSET_GROUPS[theme]) keys.push(...ASSET_GROUPS[theme]);
  if (boss) keys.push(...ASSET_GROUPS.boss);
  return keys;
}
