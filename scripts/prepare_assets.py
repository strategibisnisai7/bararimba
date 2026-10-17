"""Reproducible, non-destructive slicing of inspected source sheets. Requires Pillow.
No chroma key, background removal, enlargement, or generated replacement artwork.
Rectangles are [x, y, width, height], measured against the original PNGs.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'referensiasset'
OUTPUT = ROOT / 'public/assets'
DOCS = ROOT / 'docs'

DESCRIPTIONS = {
    1: 'Truk merah hadap kanan, tampak depan/belakang, roda dan komponen kendaraan.',
    2: 'Referensi rig meriam, segmen/pivot terpisah, dudukan, nozzle, selang dan semprotan.',
    3: 'Terrain rumput/tanah, platform, jembatan kecil, air dan waterfall.',
    4: 'Tebing tinggi, batu, akar dan gua.',
    5: 'Pohon hutan berbagai bentuk, pohon kecil, akar dan batang.',
    6: 'Semak, rumput, pakis, daun dan tanaman; alpha minimum 4, bukan latar sepenuhnya transparan.',
    7: 'Batu, kayu, peti, tong dan props interaktif.',
    8: 'Tuas, katrol, engsel, platform dan mekanisme puzzle.',
    9: 'Saluran air, pipa, wadah, tangki, kanal dan kincir.',
    10: 'Semprotan, tetesan, splash, riak, air dan waterfall.',
    11: 'Api berbagai ukuran, kayu terbakar, asap, bara dan uap.',
    12: 'Satwa Indonesia dengan beberapa pose; tidak dipakai sebagai objektif.',
    13: 'Layer lanskap Jawa: awan/gunung, bukit, sungai/hutan, desa/candi, terrain/jembatan, foreground.',
    14: 'HUD, tombol, indikator air, progres, ikon dan target.',
    15: 'Logo BaraRimba, tombol/menu, panel dan pengaturan.',
    16: 'Petunjuk drag, arah, target dan contoh instruksi gameplay.',
    17: 'Peta Indonesia dan contoh level select.',
    18: 'Komponen misi, progress, objektif dan panel level.',
    19: 'Pause, pengaturan, konfirmasi, tombol dan slider.',
    20: 'Panel hasil/reward, menang/kalah, bintang, retry dan menu.'
}

# Explicit crops, not an inferred regular animation grid. Origins are normalized.
FRAMES = [
    dict(key='truck', source='1.png', rect=[17, 51, 638, 318], folder='vehicle', origin=[.5, 1]),
    dict(key='cannon-base', source='2.png', rect=[27, 379, 190, 117], folder='cannon', origin=[.5, .65]),
    dict(key='cannon-arm', source='2.png', rect=[17, 504, 328, 91], folder='cannon', origin=[33/328, 47/91], pivots=[[33,47],[270,50]]),
    dict(key='nozzle', source='2.png', rect=[675, 761, 158, 102], folder='cannon', origin=[12/158, 43/102], pivots=[[12,43],[143,51]]),
    dict(key='logo', source='15.png', rect=[0, 0, 644, 300], folder='ui', origin=[.5,.5]),
    dict(key='mountains', source='13.png', rect=[0, 108, 1671, 153], folder='backgrounds/jawa', origin=[.5,1], polygon=[[0,105],[39,48],[71,32],[103,72],[173,111],[234,75],[274,107],[328,108],[376,73],[415,70],[462,104],[510,93],[549,65],[570,92],[617,64],[666,7],[722,3],[775,60],[836,91],[888,42],[929,92],[1010,107],[1088,72],[1136,84],[1190,111],[1235,127],[1292,99],[1332,128],[1376,113],[1434,91],[1496,109],[1574,36],[1603,51],[1643,81],[1671,90],[1671,153],[0,153]]),
    dict(key='hills', source='13.png', rect=[0, 254, 1671, 190], folder='backgrounds/jawa', origin=[.5,1], polygon=[[0,143],[30,105],[80,75],[115,51],[149,18],[197,34],[258,9],[299,32],[338,79],[369,93],[419,97],[463,127],[530,109],[579,63],[625,68],[661,98],[692,53],[704,38],[736,20],[789,6],[816,36],[865,39],[893,48],[939,106],[1013,120],[1074,110],[1108,81],[1154,85],[1190,49],[1240,65],[1279,20],[1336,0],[1368,14],[1401,55],[1445,51],[1502,78],[1553,90],[1587,121],[1671,159],[1560,166],[1400,181],[1200,187],[1000,190],[800,190],[650,179],[550,173],[300,169],[100,162],[0,155]]),
    dict(key='cloud', source='13.png', rect=[199, 0, 312, 118], folder='backgrounds/jawa', origin=[.5,.5]),
    dict(key='tree-large', source='5.png', rect=[610, 8, 339, 390], folder='backgrounds/jawa', origin=[.5,1], polygon=[[0,0],[339,0],[339,115],[329,115],[329,135],[339,135],[339,390],[0,390],[0,210],[15,210],[15,165],[0,165]]),
    dict(key='tree-slender', source='5.png', rect=[994, 640, 176, 201], folder='backgrounds/jawa', origin=[.5,1]),
    dict(key='tree-small', source='5.png', rect=[452, 401, 213, 235], folder='backgrounds/jawa', origin=[.5,1]),
    dict(key='bank', source='13.png', rect=[0, 639, 416, 160], folder='terrain', origin=[0,0], polygon=[[0,15],[95,8],[155,9],[171,0],[221,15],[289,15],[302,6],[343,5],[373,18],[402,23],[416,50],[416,160],[0,160]]),
    dict(key='right-bank', source='13.png', rect=[1344, 635, 327, 180], folder='terrain', origin=[0,0], polygon=[[0,55],[30,29],[68,31],[113,24],[154,29],[198,12],[220,20],[250,16],[280,32],[327,28],[327,180],[0,180]]),
    dict(key='bridge', source='13.png', rect=[929, 696, 417, 118], folder='terrain', origin=[0,0], polygon=[[0,16],[30,13],[52,6],[71,7],[91,15],[115,16],[131,8],[154,10],[162,15],[221,16],[246,10],[270,16],[330,15],[351,10],[374,15],[417,5],[417,118],[270,118],[270,112],[115,112],[115,118],[0,118]]),
    dict(key='cliff', source='4.png', rect=[14, 20, 595, 300], folder='terrain', origin=[0,0]),
    dict(key='foreground', source='13.png', rect=[0, 787, 1671, 154], folder='backgrounds/jawa', origin=[.5,1], polygon=[[0,63],[20,38],[29,0],[54,10],[67,30],[77,60],[110,37],[159,19],[189,26],[193,47],[215,52],[269,57],[300,69],[355,57],[380,72],[416,52],[441,25],[465,20],[492,36],[502,59],[554,47],[577,69],[608,72],[636,51],[665,68],[702,66],[733,77],[785,63],[815,88],[864,72],[897,37],[926,24],[954,43],[978,79],[1000,54],[1033,73],[1079,54],[1098,32],[1127,22],[1134,73],[1153,73],[1202,68],[1224,80],[1274,59],[1313,45],[1324,62],[1353,50],[1376,79],[1419,60],[1443,79],[1480,52],[1520,74],[1551,48],[1578,20],[1620,11],[1626,64],[1655,60],[1671,74],[1671,154],[0,154]]),
    dict(key='flame', source='11.png', rect=[648, 10, 109, 187], folder='fire', origin=[.5,1]),
    dict(key='smoke', source='11.png', rect=[567, 342, 143, 174], folder='fire', origin=[.5,1]),
    dict(key='embers', source='11.png', rect=[13, 771, 141, 85], folder='fire', origin=[.5,1]),
]

def main(only=None):
    DOCS.mkdir(exist_ok=True)
    files=[]
    for path in sorted(SOURCE.glob('*.png'), key=lambda p: (p.stem == 'Game Board', int(p.stem) if p.stem.isnumeric() else 99)):
        im=Image.open(path)
        alpha=None
        if 'A' in im.getbands():
            h=im.getchannel('A').histogram()
            alpha=dict(extrema=im.getchannel('A').getextrema(), transparentPixels=h[0], semitransparentPixels=sum(h[1:255]), opaquePixels=h[255])
        n=int(path.stem) if path.stem.isnumeric() else None
        files.append(dict(path=path.relative_to(ROOT).as_posix(), width=im.width, height=im.height, format=im.format, mode=im.mode, bytes=path.stat().st_size, sha256=hashlib.sha256(path.read_bytes()).hexdigest(), alpha=alpha, visual=DESCRIPTIONS[n] if n else 'Gameboard: menu, peta, level select, empat panel gameplay dan referensi sprite.', type='reference-sheet; not a regular animation atlas', inspection='full image and composite' if n in [1,2,3,4,5,11,13,15,None] else 'contact sheet; not production-sliced'))
    exported=0
    for item in FRAMES:
        dest=OUTPUT/item['folder']/(item['key']+'.webp')
        if not only or item['key'] in only or not dest.exists():
            x,y,w,h=item['rect']; im=Image.open(SOURCE/item['source']).convert('RGBA').crop((x,y,x+w,y+h))
            if 'polygon' in item:
                # Geometric silhouette separation only; preserves all alpha inside the region.
                mask=Image.new('L',im.size,0); ImageDraw.Draw(mask).polygon(item['polygon'],fill=255)
                from PIL import ImageChops
                im.putalpha(ImageChops.multiply(im.getchannel('A'),mask))
            dest.parent.mkdir(parents=True,exist_ok=True)
            temp=dest.with_suffix('.tmp')
            im.save(temp, 'WEBP', quality=92, method=6)
            temp.replace(dest)
            exported+=1
        item['output']=dest.relative_to(ROOT/'public').as_posix()
        item['bytes']=dest.stat().st_size
        item['animation']='transform only; no frame sequence'
    manifest=dict(sourcePolicy='Originals remain unchanged. Crop rectangles measured on inspected sheets. Existing alpha preserved; explicit polygon masks recorded. No chroma-key.',files=files,sprites=FRAMES)
    (DOCS/'asset-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    atlas=OUTPUT/'atlases';atlas.mkdir(exist_ok=True)
    (atlas/'sprite-map.json').write_text(json.dumps(FRAMES,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Inventoried {len(files)} source PNGs; exported {exported} sprites; {len(FRAMES)} total production sprites, {sum(f["bytes"] for f in FRAMES)/1024:.0f} KiB.')

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only',nargs='+',choices=[f['key'] for f in FRAMES],help='Re-export selected sprites; missing outputs are always generated.')
    main(parser.parse_args().only)
