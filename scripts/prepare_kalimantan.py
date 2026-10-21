"""Kalimantan campaign sprites from referensiasset/BaraRimba_Kalimantan_All_Levels. Requires Pillow and numpy.

The 30 level packs hold ~4900 files (172 MB), mostly per-level copies of flat vector placeholders. Only what the
game cannot already show is imported: painted mechanism art (sluice gate, log raft), the four species with no
sprite in the repository, and the two bosses. Everything else (orangutan, bekantan, sun bear, hornbill, pangolin,
otter, turtle, elephant calf, fire, logs, terrain) reuses the painted Jawa/Sumatra sprites.

Each source is trimmed to its alpha bounding box, faint alpha (< 24) is cleared, it is scaled to at most `size` px
on its long side and saved as WebP. The source PNGs are never modified. Sources whose art bakes a text label into
the image (the L11/L24 "ORANGUTAN MUDA" and L30 "JUVENILE ORANGUTAN" sprites) are deliberately not used.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'referensiasset/BaraRimba_Kalimantan_All_Levels'
OUT = ROOT / 'public/assets'

def src(level: int, rel: str) -> Path:
    return next((PACK / f'Level_{level:02d}').glob('*_HD')) / rel

# out key: (source, max size px, folder). Animals also go to assets/animals/ (HUD chip, results, Koleksi Satwa).
SPRITES = {
    'kalimantan/sluice': (src(1, 'assets/structures/sluice_gate_composite_candidate.png'), 360),
    'kalimantan/waterwheel': (src(1, 'assets/structures/waterwheel_composite_candidate.png'), 320),
    'kalimantan/raft': (src(1, 'assets/objects/raft_bundle_candidate.png'), 420),
    'kalimantan/boss-akar': (src(15, 'effects/png/boss_phase_01.png'), 420),
    'kalimantan/boss-heart': (src(30, 'assets/boss/boss_01_core_heart.png'), 360),
    'animals/owa': (src(9, 'characters/png/gibbon_side_idle.png'), 300),
    'animals/pesut': (src(22, 'assets/png/wildlife_pesut_calf.png'), 300),
    'animals/kucing-bakau': (src(23, 'assets/png/wildlife_fishing_cat.png'), 300),
    'animals/kucing-merah': (src(29, 'assets/fauna/fauna_01_adult_bornean_bay_cat.png'), 300),
}

def main():
    report = {}
    for key, (path, size) in SPRITES.items():
        im = Image.open(path).convert('RGBA')
        a = np.array(im)
        a[a[:, :, 3] < 24, 3] = 0
        im = Image.fromarray(a)
        im = im.crop(im.getbbox())
        k = min(1, size / max(im.size))
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        out = OUT / f'{key}.webp'
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, 'WEBP', quality=86, method=6)
        alpha = np.array(im)[:, :, 3]
        report[key] = {'source': str(path.relative_to(ROOT)).replace('\\', '/'), 'size': im.size, 'bytes': out.stat().st_size,
                       'transparent_px': int((alpha == 0).sum()), 'opaque_px': int((alpha == 255).sum())}
        assert report[key]['transparent_px'] > 0, f'{key}: no transparency'
        print(key, im.size, out.stat().st_size // 1024, 'KB')
    (ROOT / 'docs/asset-manifest-kalimantan.json').write_text(json.dumps(report, indent=1), encoding='utf8')

if __name__ == '__main__':
    main()
