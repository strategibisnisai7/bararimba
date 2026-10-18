"""Sumatra campaign sprites from referensiasset/BaraRimba_Sumatra_30_Level_Plan. Requires Pillow, numpy, scipy.

Three source kinds, each handled differently (see docs/sumatra-asset-audit.md):
  l1   individual RGBA cutouts of the Level 1 sheet: copied, faint alpha (< 24) cleared to remove the
       1 px source fringe. No other change.
  l2   the Level 2 RGBA sprite sheet: rectangles measured from its alpha components; alpha preserved.
  key  Level 4/8 category crops are opaque poster crops on a light-grey checker panel. Only the animals,
       which have a dark outline, are separated: light neutral pixels connected to the crop border become
       transparent. Interior light pixels (bellies, highlights) are kept because the outline encloses them.
Every output's alpha channel is measured after export and written to docs/asset-manifest-sumatra.json.
Originals are never modified.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'referensiasset/BaraRimba_Sumatra_30_Level_Plan'
L1 = PLAN / 'BaraRimba_Sumatra_Level1_Production_Sprites/sprites'
L2 = PLAN / 'BaraRimba_Level2_Rakit_Penyelamat/sprites/sprite_sheet_source_rgba.png'
TIGER = PLAN / 'BaraRimba_Level4_Pantulan_Semburan/sprites/08_satwa_sumatra/harimau_sumatra_reference.png'
DEER = PLAN / 'BaraRimba_Level8_Bendungan_Gambut/sprites/07_rusa_sumatra/rusa_sumatra_reference.png'
OUT = ROOT / 'public/assets/sumatra'
# Rescue animals also get a portrait in assets/animals/ (HUD chip, result panel and Koleksi Satwa load from there).
PORTRAITS = {'anak-gajah': 'gajah-a', 'tapir': 'tapir', 'harimau': 'harimau', 'rusa-sumatra': 'rusa-sumatra'}

# key: (kind, source, rect or None). L1 numbers refer to the cutout file prefix.
SPRITES = {
    # Level 1 pack: cave, stone gate, pulleys, boulders, flag, baby elephant
    'ledge': ('l1', '001', None), 'slope': ('l1', '002', None),
    'stalactite-a': ('l1', '003', None), 'stalactite-b': ('l1', '005', None), 'stalactite-c': ('l1', '006', None),
    'boulder': ('l1', '008', None), 'boulder-m': ('l1', '009', None), 'boulder-s': ('l1', '010', None),
    'rock-pile': ('l1', '011', None), 'rock-moss': ('l1', '014', None), 'rock-heap': ('l1', '015', None),
    'seesaw': ('l1', '012', None), 'post': ('l1', '013', None), 'aframe': ('l1', '018', None),
    'pulley': ('l1', '019', None), 'pulley-weights': ('l1', '020', None), 'pulley-single': ('l1', '021', None),
    'pulley-rig': ('l1', '022', None), 'peg': ('l1', '028', None),
    'gate': ('l1', '023', None), 'gate-frame': ('l1', '024', None), 'gate-portal': ('l1', '025', None),
    'pillar': ('l1', '026', None), 'flag': ('l1', '027', None), 'rock-stump': ('l1', '029', None),
    'coals': ('l1', '045', None),
    'falls': ('l1', '044', None), 'falls-b': ('l1', '046', None), 'cave-mouth': ('l1', '048', None),
    'cave-ceiling': ('l1', '049', None),
    'spire-a': ('l1', '053', None), 'spire-b': ('l1', '055', None), 'spire-c': ('l1', '064', None),
    'spire-d': ('l1', '066', None), 'spire-e': ('l1', '075', None),
    'fern-a': ('l1', '057', None), 'fern-b': ('l1', '058', None), 'bush-red': ('l1', '062', None),
    'gajah-a': ('l1', '069', None), 'gajah-b': ('l1', '070', None), 'gajah-c': ('l1', '072', None),
    'gajah-d': ('l1', '073', None),
    # Level 2 sheet (rects measured from alpha components)
    'raft': ('l2', None, [305, 27, 287, 154]), 'raft-dry': ('l2', None, [15, 12, 292, 169]),
    'log-moss': ('l2', None, [906, 27, 162, 78]), 'log': ('l2', None, [906, 119, 136, 50]),
    'branch-log': ('l2', None, [616, 211, 237, 108]),
    'winch': ('l2', None, [1249, 204, 193, 115]), 'hook': ('l2', None, [1465, 193, 43, 116]),
    'rope-bridge': ('l2', None, [23, 340, 230, 109]), 'frame': ('l2', None, [635, 340, 160, 151]),
    'float-ledge': ('l2', None, [811, 341, 192, 145]), 'cliff': ('l2', None, [1430, 336, 88, 153]),
    'beam': ('l2', None, [495, 352, 127, 42]),
    'falls-tall': ('l2', None, [14, 627, 199, 180]), 'falls-small': ('l2', None, [224, 668, 132, 126]),
    'river-rocks': ('l2', None, [369, 637, 152, 68]), 'river-rocks-b': ('l2', None, [565, 705, 147, 91]),
    'tapir': ('l2', None, [734, 673, 151, 121]), 'tapir-b': ('l2', None, [899, 668, 129, 128]),
    'tapir-c': ('l2', None, [1033, 667, 184, 130]),
    'palm-a': ('l2', None, [1086, 807, 228, 205]), 'palm-b': ('l2', None, [1297, 814, 219, 198]),
    'vines': ('l2', None, [675, 805, 211, 187]), 'vine': ('l2', None, [893, 807, 50, 200]),
    'jungle-bush': ('l2', None, [13, 817, 248, 192]), 'fern-root': ('l2', None, [406, 809, 269, 202]),
    # Animals separated from poster category crops (see module docstring)
    'harimau': ('key', 'tiger', [7, 35, 143, 72]), 'harimau-b': ('key', 'tiger', [8, 108, 110, 54]),
    'harimau-c': ('key', 'tiger', [117, 108, 116, 54]),
    'rusa-sumatra': ('key', 'deer', [100, 30, 84, 84]), 'rusa-sumatra-b': ('key', 'deer', [18, 30, 76, 84]),
}


def l1(prefix):
    path = next(L1.glob(f'{prefix}_*.png'))
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).copy()
    a[a[..., 3] < 24] = 0          # 1 px dilated edge of the source segmentation: drop its faint fringe
    return Image.fromarray(a, 'RGBA'), path


def l2(rect):
    x, y, w, h = rect
    a = np.asarray(Image.open(L2).convert('RGBA').crop((x, y, x + w, y + h))).copy()
    # Neighbouring sprites can poke into a measured rect: keep the components joined to the main one.
    solid = ndimage.binary_closing(a[..., 3] > 60, iterations=3)
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = ndimage.binary_dilation(lab == 1 + int(np.argmax(sizes)), iterations=3)
        a[~keep] = 0
    return Image.fromarray(a, 'RGBA'), L2


def keyed(src, rect):
    path = TIGER if src == 'tiger' else DEER
    x, y, w, h = rect
    rgb = np.asarray(Image.open(path).convert('RGB').crop((x, y, x + w, y + h))).astype(int)
    mx, mn = rgb.max(2), rgb.min(2)
    light = (mn > 170) & (mx - mn < 26)
    lab, _ = ndimage.label(light)
    border = np.zeros(light.shape, bool); border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    back = np.isin(lab, list(set(np.unique(lab[border & light])) - {0}))
    fg = ndimage.binary_opening(~back, iterations=1)
    # keep the largest component only (neighbouring animals or the panel edge may poke into the rect)
    lab2, n = ndimage.label(fg)
    if n > 1:
        sizes = ndimage.sum(fg, lab2, range(1, n + 1))
        fg = lab2 == (1 + int(np.argmax(sizes)))
    fg = ndimage.binary_fill_holes(fg)
    alpha = (ndimage.gaussian_filter(fg.astype(float), .6) * 255).clip(0, 255).astype(np.uint8)
    alpha[~ndimage.binary_dilation(fg)] = 0
    out = np.dstack([rgb.astype(np.uint8), alpha])
    ys, xs = np.nonzero(alpha)
    out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(out, 'RGBA'), path


def alpha_stats(im):
    a = np.asarray(im.getchannel('A'))
    return dict(transparent=round(float(np.mean(a == 0)), 3), opaque=round(float(np.mean(a >= 250)), 3),
                partial=round(float(np.mean((a > 0) & (a < 250))), 3), extrema=[int(a.min()), int(a.max())])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for key, (kind, src, rect) in SPRITES.items():
        im, path = l1(src) if kind == 'l1' else l2(rect) if kind == 'l2' else keyed(src, rect)
        st = alpha_stats(im)
        if st['extrema'][0] > 0:
            raise SystemExit(f'{key}: no real transparency ({st}); refusing to export')
        dest = OUT / f'{key}.webp'
        im.save(dest, 'WEBP', quality=86, method=6)
        rows.append(dict(key=f'sm-{key}', file=dest.relative_to(ROOT / 'public').as_posix(), size=list(im.size), method=kind,
                         source=path.relative_to(ROOT).as_posix(), rect=rect, alpha=st, bytes=dest.stat().st_size))
    for name, key in PORTRAITS.items():
        dest = ROOT / 'public/assets/animals' / f'{name}.webp'
        dest.write_bytes((OUT / f'{key}.webp').read_bytes())
        rows.append(dict(key=name, file=dest.relative_to(ROOT / 'public').as_posix(), method='portrait copy', source=f'sumatra/{key}.webp', bytes=dest.stat().st_size))
    (ROOT / 'docs/asset-manifest-sumatra.json').write_text(json.dumps(dict(
        policy='Sources unchanged. l1 = cutout with alpha<24 cleared; l2 = rect crop of the RGBA sheet; key = light border-connected '
               'background removed from an opaque poster crop (animals with dark outlines only). Alpha measured after export.',
        sprites=rows), indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'{len(rows)} sprites, {sum(r["bytes"] for r in rows) / 1024:.0f} KiB')


if __name__ == '__main__':
    main()
