"""Second asset pass: UI, props, animals, fire/terrain extras for the 3-level build.

Run: python scripts/prepare_ui_assets.py  (Pillow, numpy, scipy; opencv-python-headless for 'grab').
Methods
  main  - like comp but keeps only the largest component.
  comp  - crop rect from an RGBA sheet, keep the largest alpha component plus components that do
          not touch the crop border (removes neighbour fragments). Original alpha is preserved.
  plain - straight crop (RGB Game Board panels such as the map and level thumbnails).
  grab  - GrabCut foreground extraction on the RGB Game Board (logo, round HUD buttons, mascots).
Rectangles are [x, y, w, h] in source pixels. Nothing is generated or redrawn.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'referensiasset'
OUT = ROOT / 'public/assets'
GB = 'Game Board.png'
BOSS = 'Forest Fire Boss Battle.png'
TILE = 'Volcanic, Ice, and Ruins Tileset Sheet.png'
VPAR = 'Volcanic Parallax Game Asset Sheet.png'
PRAMB = 'Prambanan Temple Ruins Tileset.png'

A = [
    # --- Game Board (RGB) ---
    ('ui/gb-pause', GB, [1110, 901, 52, 52], 'grab'),
    ('ui/gb-reset', GB, [1178, 901, 53, 52], 'grab'),
    ('ui/gb-hint', GB, [1248, 901, 52, 52], 'grab'),
    ('ui/gb-drop', GB, [954, 899, 52, 56], 'grab'),
    ('ui/map-board', GB, [604, 2, 560, 432], 'inpaint'),
    ('ui/gb-pin', GB, [889, 75, 34, 38], 'grab'),
    ('ui/thumb-1', GB, [0, 486, 381, 186], 'plain'),
    # --- boss battle reference (RGB) ---
    ('boss/boss', BOSS, [1268, 268, 290, 262], 'grabboss'),
    ('boss/fireball', BOSS, [500, 178, 170, 105], 'grab'),
    ('boss/hud-pressure', BOSS, [20, 20, 406, 90], 'grabfill'),
    ('boss/hud-reserve', BOSS, [20, 112, 396, 92], 'grabfill'),
    ('boss/hud-bossbar', BOSS, [495, 12, 700, 124], 'grabfill'),
    ('boss/hud-pause', BOSS, [1554, 20, 98, 94], 'grabfill'),
    ('boss/hud-mission', BOSS, [22, 690, 782, 222], 'grabfill'),
    ('boss/hud-spray', BOSS, [1428, 668, 222, 222], 'grabfill'),
    ('boss/tower', BOSS, [1325, 70, 150, 215], 'grab'),
    # --- Prambanan temple ruins (ancient Java theme) ---
    ('theme/p-temple-a', PRAMB, [247, 12, 210, 252], 'main'),
    ('theme/p-temple-b', PRAMB, [82, 37, 165, 218], 'main'),
    ('theme/p-temple-c', PRAMB, [547, 37, 165, 225], 'main'),
    ('theme/p-temple-d', PRAMB, [2040, 12, 132, 225], 'main'),
    ('theme/p-top', PRAMB, [15, 282, 196, 106], 'main'),
    ('theme/p-fill', PRAMB, [44, 338, 176, 46], 'raw'),
    ('theme/p-pillar', PRAMB, [457, 480, 105, 213], 'main'),
    ('theme/p-stupa', PRAMB, [1852, 487, 113, 158], 'main'),
    ('theme/p-gate', PRAMB, [1155, 457, 180, 236], 'main'),
    ('theme/p-guardian', PRAMB, [1462, 262, 150, 158], 'main'),
    # --- volcanic parallax layers (real alpha; red matte fringe removed) ---
    ('theme/vp-sky', VPAR, [0, 0, 1671, 384], 'defringe'),
    ('theme/vp-plain', VPAR, [0, 384, 1671, 240], 'defringe'),
    ('theme/vp-rocks', VPAR, [0, 624, 1671, 171], 'defringe'),
    ('theme/vp-front', VPAR, [0, 795, 1671, 146], 'defringe'),
    # --- themed tiles: volcanic / ice / ruins (Java variants) ---
    ('theme/v-top', TILE, [660, 66, 152, 98], 'main'),
    ('theme/v-fill', TILE, [398, 48, 104, 64], 'raw'),
    ('theme/v-rock', TILE, [668, 258, 92, 76], 'main'),
    ('theme/v-tree', TILE, [655, 160, 110, 95], 'main'),
    ('theme/v-spire', TILE, [12, 312, 78, 100], 'main'),
    # --- sheet 19: pause / settings / confirm ---
    ('ui/pause-panel', '19.png', [13, 12, 642, 472], 'comp'),
    ('ui/settings-panel', '19.png', [661, 29, 502, 453], 'comp'),
    ('ui/confirm-exit', '19.png', [1175, 35, 352, 239], 'comp'),
    ('ui/confirm-restart', '19.png', [1176, 295, 351, 231], 'comp'),
    ('ui/wood-left', '19.png', [1047, 660, 63, 68], 'comp'),
    ('ui/wood-right', '19.png', [1116, 660, 65, 68], 'comp'),
    ('ui/objective-panel', '19.png', [1180, 905, 340, 95], 'comp'),
    # --- sheet 20: results ---
    ('ui/win-panel', '20.png', [9, 10, 547, 619], 'comp'),
    ('ui/fail-panel', '20.png', [565, 10, 531, 610], 'comp'),
    ('ui/badge-record', '20.png', [794, 639, 184, 95], 'comp'),
    # --- sheet 14: HUD pieces ---
    ('ui/round-drop', '14.png', [750, 782, 84, 84], 'comp'),
    ('ui/round-fire', '14.png', [851, 782, 83, 84], 'comp'),
    ('ui/round-check', '14.png', [332, 782, 85, 84], 'comp'),
    ('ui/round-x', '14.png', [434, 782, 84, 84], 'comp'),
    ('ui/btn-mulai', '14.png', [327, 658, 261, 96], 'comp'),
    # --- sheet 15: main menu set (full resolution) ---
    ('ui/menu-logo', '15.png', [11, 15, 629, 296], 'comp'),
    ('ui/btn-main', '15.png', [641, 52, 351, 194], 'comp'),
    ('ui/btn-peta', '15.png', [986, 19, 316, 100], 'comp'),
    ('ui/btn-koleksi', '15.png', [996, 128, 300, 95], 'comp'),
    ('ui/btn-pengaturan', '15.png', [987, 226, 307, 90], 'comp'),
    # --- sheet 15: stars, lock, audio ---
    ('ui/star-gold', '15.png', [1451, 336, 62, 62], 'comp'),
    ('ui/star-silver', '15.png', [1446, 398, 72, 70], 'comp'),
    ('ui/lock', '15.png', [1442, 542, 78, 87], 'comp'),
    # --- sheet 16: tutorial cards and markers ---
    *[(f'ui/tutorial-{i+1}', '16.png', r, 'comp') for i, r in enumerate([
        [11, 633, 238, 265], [255, 633, 215, 265], [476, 633, 263, 265],
        [743, 633, 247, 265], [995, 633, 261, 265], [1263, 633, 261, 265]])],
    ('ui/sign-water', '16.png', [1254, 904, 263, 99], 'comp'),
    ('ui/alert', '16.png', [1418, 35, 50, 118], 'comp'),
    # --- sheet 18: badge ---
    # --- animals (sheet 12) ---
    ('animals/orangutan', '12.png', [356, 41, 168, 142], 'main'),
    ('animals/bekantan', '12.png', [15, 199, 139, 166], 'main'),
    ('animals/rangkong', '12.png', [216, 343, 141, 152], 'main'),
    ('animals/beruang', '12.png', [1080, 493, 144, 127], 'main'),
    ('animals/rusa', '12.png', [160, 630, 140, 125], 'main'),
    ('animals/trenggiling', '12.png', [925, 776, 137, 76], 'main'),
    ('animals/raja-udang', '12.png', [1146, 789, 88, 89], 'main'),
    ('animals/kura-kura', '12.png', [928, 954, 146, 63], 'main'),
    ('animals/babi-hutan', '12.png', [815, 631, 182, 116], 'main'),
    ('animals/gajah', '12.png', [240, 758, 190, 146], 'main'),
    ('animals/buaya', '12.png', [9, 939, 273, 72], 'main'),
    ('animals/komodo', '12.png', [564, 918, 303, 90], 'main'),
    ('animals/ular', '12.png', [1303, 872, 110, 90], 'main'),
    ('animals/berang', '12.png', [1172, 896, 110, 108], 'main'),
    ('animals/orangutan-sit', '12.png', [842, 34, 134, 144], 'main'),
    ('animals/rangkong-perch', '12.png', [86, 351, 149, 132], 'main'),
    # --- mechanisms (sheet 8, 9) ---
    ('props/gear', '8.png', [7, 432, 198, 196], 'main'),
    ('props/pivot', '8.png', [893, 918, 86, 66], 'raw'),
    ('props/target', '16.png', [1101, 40, 115, 116], 'main'),
    ('props/bucket', '9.png', [189, 860, 83, 138], 'main'),
    ('props/button', '8.png', [714, 56, 172, 117], 'main'),
    ('props/fence', '7.png', [1315, 840, 204, 148], 'main'),
    # --- fire bases (sheet 11) ---
    ('fire/coal-hot', '11.png', [13, 777, 153, 75], 'comp'),
    ('fire/coal-cold', '11.png', [680, 796, 161, 65], 'comp'),
    ('fire/tongue-a', '11.png', [269, 49, 49, 105], 'comp'),
    # --- props (sheet 7, 9, 1) ---
    ('props/crate', '7.png', [21, 386, 133, 128], 'main'),
    ('props/crate-plain', '7.png', [310, 389, 131, 124], 'main'),
    ('props/boulder', '7.png', [17, 20, 241, 219], 'main'),
    ('props/log', '7.png', [197, 246, 204, 121], 'main'),
    ('props/barrel-blue', '7.png', [1036, 384, 107, 137], 'comp'),
    ('props/plank', '7.png', [899, 627, 251, 71], 'comp'),
    ('props/stump', '7.png', [664, 672, 148, 131], 'main'),
    ('props/water-tower', '9.png', [11, 507, 180, 342], 'main'),
    ('vehicle/wheel', '1.png', [521, 378, 138, 136], 'comp'),
    # --- terrain (sheet 3) ---
    ('terrain/top-a', '3.png', [14, 754, 305, 113], 'comp'),
    ('terrain/top-b', '3.png', [328, 753, 284, 114], 'comp'),
    # --- trees (sheet 5) ---
    ('backgrounds/jawa/tree-a', '5.png', [13, 10, 333, 383], 'main'),
    ('backgrounds/jawa/tree-b', '5.png', [336, 13, 288, 379], 'main'),
    ('backgrounds/jawa/tree-c', '5.png', [1115, 33, 399, 346], 'main'),
    ('backgrounds/jawa/tree-flower', '5.png', [15, 399, 203, 231], 'main'),
]


def unchecker(im: Image.Image) -> Image.Image:
    """Sheets saved with a baked grey/white checkerboard instead of alpha: flood the light, neutral
    checker cells from the border inward and make them transparent. Object colours are untouched."""
    a = np.array(im.convert('RGB')).astype(int)
    cand = (a.max(2) - a.min(2) < 14) & (a.min(2) > 178)
    lab, _ = ndimage.label(cand)
    bg = np.isin(lab, list(set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}))
    for _ in range(6):
        ids = np.unique(lab[ndimage.binary_dilation(bg, iterations=2) & cand & ~bg]); ids = ids[ids > 0]
        if not len(ids): break
        bg |= np.isin(lab, ids)
    fg = ndimage.binary_opening(~bg, iterations=1)
    alpha = (ndimage.gaussian_filter(fg.astype(float), .7) * 255).astype(np.uint8)
    return Image.fromarray(np.dstack([a.astype(np.uint8), alpha]), 'RGBA')


_sheets = {}
def sheet(name: str) -> Image.Image:
    if name not in _sheets:
        im = Image.open(SRC / name)
        _sheets[name] = unchecker(im) if im.mode == 'RGB' and name not in (GB, BOSS) else im.convert('RGBA')
    return _sheets[name]


def comp(im: Image.Image, only_main=False) -> Image.Image:
    a = np.array(im)
    alpha = a[:, :, 3]
    lab, n = ndimage.label(ndimage.binary_closing(alpha > 40, iterations=2))
    if n <= 1:
        return im
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    biggest = int(np.argmax(sizes)) + 1
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    keep = np.zeros(n + 1, bool)
    keep[biggest] = True
    for i in range(1, n + 1):
        if not only_main and i not in border and sizes[i - 1] > 12:
            keep[i] = True
    # Soft pixels (alpha <= 40) adjacent to kept components are retained via dilation.
    m = ndimage.binary_dilation(keep[lab], iterations=3)
    a[:, :, 3] = np.where(m, alpha, 0)
    return Image.fromarray(a)


def grab(im: Image.Image) -> Image.Image:
    import cv2
    rgb = np.array(im.convert('RGB'))[:, :, ::-1].copy()
    h, w = rgb.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(rgb, mask, (3, 3, w - 6, h - 6), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    lab, n = ndimage.label(m > 0)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        m = np.where(sizes[lab - 1] >= sizes.max() * .04, m, 0).astype(np.uint8) * (lab > 0)
    m = cv2.GaussianBlur(m, (3, 3), 0)
    out = np.dstack([np.array(im.convert('RGB')), m])
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def main():
    manifest = []
    for key, source, (x, y, w, h), method in A:
        im = sheet(source).crop((x, y, x + w, y + h))
        if method in ('comp', 'main'):
            im = comp(im, method == 'main')
        elif method == 'raw':
            pass
        elif method == 'defringe':
            a = np.array(im)
            r, g, b, al = (a[:, :, i].astype(int) for i in range(4))
            halo = (al < 250) & (r > 150) & (g < 90) & (b < 90)
            a[:, :, 3] = np.where(halo, 0, a[:, :, 3])
            im = Image.fromarray(a)
        elif method in ('grab', 'grabfill', 'grabboss'):
            im = grab(im)
            a = np.array(im)
            if method in ('grabfill', 'grabboss'):
                # GrabCut drops enclosed text/details; fill interior holes of the silhouette.
                a[:, :, 3] = np.where(ndimage.binary_fill_holes(a[:, :, 3] > 60), np.maximum(a[:, :, 3], 255), 0)
            if method == 'grabboss':
                # Remove the background flames burning behind the boss's legs (below the gun line).
                r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
                fire = (r > 170) & (g > 70) & (b < 110) & (r - b > 110)
                yy = np.arange(a.shape[0])[:, None] + np.zeros(a.shape[1], int)[None, :]
                xx = np.arange(a.shape[1])[None, :] + np.zeros(a.shape[0], int)[:, None]
                a[:, :, 3] = np.where(fire & (yy > 160) & (xx < 150), 0, a[:, :, 3])
                lab, n = ndimage.label(a[:, :, 3] > 60)
                if n > 1:
                    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
                    a[:, :, 3] = np.where(lab == int(np.argmax(sizes)) + 1, a[:, :, 3], 0)
            im = Image.fromarray(a)
        elif method == 'inpaint':
            # Remove the baked Kalimantan pin/truck marker so the live marker can move regions.
            import cv2
            bgr = np.array(im.convert('RGB'))[:, :, ::-1].copy()
            # Clone-stamp island foliage from the same island (feathered), then blend the seam.
            h, w = 80, 70
            src = bgr[66:66 + h, 206:206 + w].astype(np.float32)
            yy, xx = np.mgrid[0:h, 0:w]
            m = np.clip(3.0 - np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)) * 3.0, 0, 1)[:, :, None]
            dst = bgr[66:66 + h, 264:264 + w].astype(np.float32)
            bgr[66:66 + h, 264:264 + w] = (src * m + dst * (1 - m)).astype(np.uint8)
            im = Image.fromarray(bgr[:, :, ::-1].copy())
        else:
            im = im.convert('RGB')
        dest = OUT / f'{key}.webp'
        dest.parent.mkdir(parents=True, exist_ok=True)
        # Large full-width parallax layers tolerate stronger compression.
        im.save(dest, 'WEBP', quality=78 if key.startswith('theme/vp-') else 82, method=6)
        manifest.append(dict(key=key, source=source, rect=[x, y, w, h], method=method, size=list(im.size)))
    (ROOT / 'docs/asset-manifest-ui.json').write_text(json.dumps(manifest, indent=1))
    print(len(manifest), 'assets')


if __name__ == '__main__':
    main()
