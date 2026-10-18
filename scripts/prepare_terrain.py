"""Slice the Modular Earthy Terrain sheet into pieces and measure their collision profiles.

Run: python scripts/prepare_terrain.py  (Pillow, numpy, scipy)
Each piece is the alpha component that contains the given seed rectangle's centre, so neighbouring
pieces whose boxes overlap are never cut into each other. Original alpha is preserved, nothing is redrawn.
For every column (sampled every STEP source px) the profile records the top of the first solid run and
its bottom, so arches and overhangs keep their open undersides. Output:
  public/assets/terrain/earthy/<key>.webp
  src/config/terrainTiles.ts   (sizes + profiles in source pixels)
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'referensiasset' / 'Modular Earthy Terrain Tile Collection.png'
OUT = ROOT / 'public/assets/terrain/earthy'
TS = ROOT / 'src/config/terrainTiles.ts'
STEP = 4
SOLID = 128

# key: [x, y, w, h] bounding box measured on the sheet (alpha > 40 components).
PIECES = {
    'flat-a': [30, 43, 303, 59], 'flat-b': [1118, 43, 390, 62], 'flat-c': [29, 127, 299, 60], 'flat-d': [346, 43, 327, 59],
    'flat-long': [27, 943, 624, 59], 'flat-e': [663, 951, 316, 52], 'flat-f': [989, 952, 298, 52],
    'flat-thick': [28, 701, 371, 73], 'flat-short': [683, 43, 169, 59], 'ledge-step': [676, 134, 235, 75],
    'block-s': [1100, 493, 79, 49], 'block': [811, 701, 89, 75], 'block-tall': [648, 574, 95, 100],
    'pillar-a': [1343, 456, 62, 86], 'pillar-b': [1441, 456, 65, 87],
    'float-rock': [866, 43, 232, 91], 'float-drip': [423, 699, 207, 85], 'float-drip-s': [643, 701, 153, 73],
    'float-thin': [1060, 715, 182, 71], 'float-rock-s': [909, 667, 145, 89],
    'ramp': [25, 211, 224, 109], 'ramp-s': [237, 230, 125, 87], 'ramp-step': [372, 230, 124, 87],
    'ramp-b': [336, 129, 132, 85], 'ramp-c': [462, 135, 93, 80], 'steps': [557, 133, 107, 81], 'wedge': [927, 152, 110, 77],
    'curve-up': [1284, 637, 223, 137], 'quarter': [1306, 818, 211, 185],
    'mound': [1021, 357, 203, 69], 'hump': [1242, 367, 265, 59], 'wave': [1030, 134, 469, 69],
    'wave-big': [795, 228, 452, 97], 'arch-hill': [1269, 240, 232, 85], 'wave-long': [25, 351, 462, 81],
    'valley': [736, 344, 269, 82], 'wave-step': [25, 445, 502, 98], 'wall-slope': [517, 230, 258, 85],
    'u-small': [512, 348, 196, 79], 'u-wide': [548, 444, 271, 97], 'u-shallow': [833, 455, 252, 87],
    'u-a': [23, 811, 332, 113], 'u-b': [366, 811, 274, 112], 'u-deep': [654, 813, 227, 110],
    'u-big': [1065, 578, 438, 104], 'u-tunnel': [892, 813, 377, 111],
    'arch-a': [27, 578, 189, 100], 'arch-b': [222, 578, 234, 99], 'overhang': [753, 573, 303, 105],
    'slab': [464, 578, 171, 101], 'hook': [1181, 456, 140, 87], 'hole-block': [1281, 816, 102, 108],
}


def main():
    im = Image.open(SRC).convert('RGBA')
    rgba = np.array(im)
    alpha = rgba[..., 3]
    lab, _ = ndimage.label(alpha > 40)
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for key, (x, y, w, h) in PIECES.items():
        # The piece's own component: the most common label inside its box.
        box = lab[y:y + h, x:x + w]
        ids, counts = np.unique(box[box > 0], return_counts=True)
        own = ids[np.argmax(counts)]
        ys, xs = np.nonzero(lab == own)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        # Keep soft edge pixels around the component (anti-aliased outline) but drop other pieces.
        grown = ndimage.binary_dilation(lab == own, iterations=3)[y0:y1, x0:x1]
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(grown, crop[..., 3], 0)
        Image.fromarray(crop).save(OUT / f'{key}.webp', quality=92, method=6)
        a = crop[..., 3] >= SOLID
        top, bot = [], []
        for cx in list(range(0, crop.shape[1], STEP)) + [crop.shape[1] - 1]:
            col = a[:, cx]
            if not col.any():
                top.append(-1); bot.append(-1); continue
            t = int(np.argmax(col))
            gap = np.nonzero(~col[t:])[0]
            b = t + (int(gap[0]) if len(gap) else len(col) - t)
            top.append(t); bot.append(b)
        rows.append(f"  '{key}': {{ w: {crop.shape[1]}, h: {crop.shape[0]}, top: [{','.join(map(str, top))}], bottom: [{','.join(map(str, bot))}] }},")
    # Fill for the rock mass under ground pieces: the cobble band of 'flat-thick', made seamless by
    # crossfading its ends (both axes), and darkened so the crust pieces read in front of it.
    fx, fy = PIECES['flat-thick'][:2]
    band = rgba[fy + 28:fy + 70, fx + 24:fx + 344, :3].astype(np.float32) * .72
    def seamless(img, axis, o):
        n = img.shape[axis]
        a = np.take(img, range(0, n - o), axis=axis).copy()
        tail = np.take(img, range(n - o, n), axis=axis)
        head = np.take(a, range(0, o), axis=axis)
        w = np.linspace(0, 1, o).reshape((-1, 1, 1) if axis == 0 else (1, -1, 1))
        blended = tail * (1 - w) + head * w
        idx = [slice(None)] * 3; idx[axis] = slice(0, o)
        a[tuple(idx)] = blended
        return a
    band = seamless(seamless(band, 1, 48), 0, 10)
    Image.fromarray(band.clip(0, 255).astype(np.uint8)).save(OUT / 'fill.webp', quality=90, method=6)
    TS.write_text(
        '// Generated by scripts/prepare_terrain.py: do not edit by hand.\n'
        '/** Earthy terrain pieces: size and per-column collision profile (source px, sampled every\n'
        ' * `TERRAIN_STEP` px plus the last column; -1 = empty column). `top` is the walkable surface,\n'
        ' * `bottom` the underside of the first solid run (open below arches and overhangs). */\n'
        f'export const TERRAIN_STEP = {STEP};\n'
        'export interface TerrainTile { w: number; h: number; top: number[]; bottom: number[] }\n'
        'export const TERRAIN_TILES: Record<string, TerrainTile> = {\n' + '\n'.join(rows) + '\n};\n',
        encoding='utf-8')
    print(f'{len(rows)} pieces -> {OUT}')


if __name__ == '__main__':
    main()
