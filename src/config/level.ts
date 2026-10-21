export const WIDTH = 1280;
export const HEIGHT = 720;
import { renderScale } from '../systems/Save';
/** Follows the quality setting; reassigned live by setRenderScale (imports see the new value). */
export let RENDER_SCALE = renderScale();
export const setRenderScale = (s: number) => { RENDER_SCALE = s; };
export const STEP = 1 / 120;
export const WATER_SPEED = 680;
export const WATER_GRAVITY = 560;
export const WATER_RATE = 165;
export const WATER_USE = 3.6;   // tank % per second of spraying
export const DROP_DAMAGE = .0052;
export const FIRE_MAX = 1.6;
export const TRUCK_SCALE = .46;

export interface Point { x: number; y: number }
export interface Nozzle extends Point { angle: number }
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

import { TERRAIN_TILES } from './terrainTiles';

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

// Earthy terrain pieces (sliced by scripts/prepare_terrain.py) and their rock fill.
for (const k of [...Object.keys(TERRAIN_TILES), 'fill']) ASSETS[`et-${k}`] = `terrain/earthy/${k}`;

/** Sumatra cave set (scripts/prepare_sumatra.py), loaded as `sm-<name>` for Sumatra levels only. */
export const SUMATRA_SPRITES = ['ledge', 'slope', 'stalactite-a', 'stalactite-b', 'stalactite-c', 'boulder', 'boulder-m', 'boulder-s',
  'rock-pile', 'rock-moss', 'rock-heap', 'seesaw', 'post', 'aframe', 'pulley', 'pulley-weights', 'pulley-single', 'pulley-rig', 'peg',
  'gate', 'gate-frame', 'gate-portal', 'pillar', 'flag', 'rock-stump', 'coals', 'falls', 'falls-b', 'cave-mouth', 'cave-ceiling',
  'spire-a', 'spire-b', 'spire-c', 'spire-d', 'spire-e', 'fern-a', 'fern-b', 'bush-red', 'gajah-b', 'gajah-c', 'gajah-d',
  'raft', 'raft-dry', 'log-moss', 'log', 'branch-log', 'winch', 'hook', 'rope-bridge', 'frame', 'float-ledge', 'cliff', 'beam',
  'falls-tall', 'falls-small', 'river-rocks', 'river-rocks-b', 'tapir-b', 'tapir-c', 'palm-a', 'palm-b', 'vines', 'vine',
  'jungle-bush', 'fern-root', 'harimau-b', 'harimau-c', 'rusa-sumatra-b'];
for (const k of SUMATRA_SPRITES) ASSETS[`sm-${k}`] = `sumatra/${k}`;
for (const k of ['anak-gajah', 'tapir', 'harimau', 'rusa-sumatra']) ASSETS[k] = `animals/${k}`;

/** Kalimantan: painted mechanism art and bosses from the level packs (scripts/prepare_kalimantan.py), species with no
 * earlier sprite, and the Sumatra mechanism parts its peat swamp reuses (posts, pulleys, beams, rope bridge, flag, raft). */
for (const k of ['sluice', 'waterwheel', 'raft', 'boss-akar', 'boss-heart']) ASSETS[`k-${k}`] = `kalimantan/${k}`;
for (const k of ['owa', 'pesut', 'kucing-bakau', 'kucing-merah']) ASSETS[k] = `animals/${k}`;
const KALIMANTAN_REUSE = ['post', 'pulley', 'pulley-single', 'beam', 'rope-bridge', 'flag', 'raft', 'gate', 'coals', 'rock-pile', 'aframe', 'hook',
  'winch', 'bush-red', 'jungle-bush', 'fern-a', 'fern-root', 'log-moss', 'falls', 'falls-tall', 'falls-small', 'palm-a', 'palm-b', 'vines'].map(k => `sm-${k}`);

/** Assets only some levels need; everything else in ASSETS is loaded for every level. Keeps the first load small. */
export const ASSET_GROUPS: Record<string, string[]> = {
  volcanic: Object.keys(ASSETS).filter(k => k.startsWith('v-') || k.startsWith('vp-')),
  ruins: Object.keys(ASSETS).filter(k => k.startsWith('p-')),
  boss: ['boss', 'fireball', 'boss-tower', 'orangutan-sit'],
  earthy: Object.keys(ASSETS).filter(k => k.startsWith('et-')),
  sumatra: [...Object.keys(ASSETS).filter(k => k.startsWith('sm-')), 'anak-gajah', 'tapir', 'harimau', 'rusa-sumatra'],
  kalimantan: [...Object.keys(ASSETS).filter(k => k.startsWith('k-')), 'owa', 'pesut', 'kucing-bakau', 'kucing-merah', 'anak-gajah', ...KALIMANTAN_REUSE],
};
export function assetsFor(theme?: string, boss?: boolean, earthy?: boolean, sumatra?: boolean, kalimantan?: boolean) {
  const grouped = new Set(Object.values(ASSET_GROUPS).flat());
  const keys = Object.keys(ASSETS).filter(k => !grouped.has(k));
  if (theme && ASSET_GROUPS[theme]) keys.push(...ASSET_GROUPS[theme]);
  if (boss) keys.push(...ASSET_GROUPS.boss);
  if (earthy) keys.push(...ASSET_GROUPS.earthy);
  if (sumatra) keys.push(...ASSET_GROUPS.sumatra);
  if (kalimantan) keys.push(...ASSET_GROUPS.kalimantan.filter(k => !keys.includes(k)));
  return keys;
}
