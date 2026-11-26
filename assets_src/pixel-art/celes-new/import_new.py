#!/usr/bin/env python3
"""===== セレス新絵（PixelLab）の取り込み =====
assets_src/pixel-art/celes-new/src/<動き>/frame_NNN.png（148×148 共通キャンバス・足元の基準 AX,AY）から
assets_src/chars/celes/ の anim/・master/・character.json を作り直し、星臨 aw_* は通常のコマを青白く染めて光の縁を足して作る。
カットインの立ち絵 img/cutin/celes_{ougi,aw}.png も作る（星臨は青白く染めたもの）。
使い方：python3 assets_src/pixel-art/celes-new/import_new.py && python3 tools/spx_import.py build celes
（旧 import_pl.py の置き換え。旧の絵・fx 層は消す）"""
import json, os, shutil, glob
import numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
SRC = os.path.join(HERE, 'src'); OUT = os.path.join(ROOT, 'assets_src', 'chars', 'celes')
AX, AY = 79, 126  # 足元（元の解像度）


def load(a):
    return [Image.open(f).convert('RGBA') for f in sorted(glob.glob(os.path.join(SRC, a, 'frame_*.png')))]


def tint(im, k=1.0, white=0.0, glow=1.0):
    """紫 → 青白。k＝染める強さ、white＝白く飛ばす強さ（シルエット用）、glow＝光の縁"""
    a = np.asarray(im).astype(np.float32) / 255.
    rgb, al = a[..., :3], a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6.
    s = d / (mx + 1e-6)
    v = mx
    purple = ((h > .62) & (h < .86) & (s > .15)).astype(np.float32) * k
    h2 = h * (1 - purple) + .60 * purple
    s2 = s * (1 - .45 * purple)
    v2 = np.clip(v + .30 * purple * (1 - v) + .10 * k * (1 - v), 0, 1)
    i = np.floor(h2 * 6).astype(int) % 6
    f = h2 * 6 - np.floor(h2 * 6)
    p = v2 * (1 - s2); q = v2 * (1 - f * s2); t = v2 * (1 - (1 - f) * s2)
    sel = lambda *c: np.choose(i, c)
    out = np.stack([sel(v2, q, p, p, t, v2), sel(t, v2, v2, q, p, p), sel(p, p, t, v2, v2, q)], -1)
    out = out * (1 - white) + white
    res = Image.fromarray((np.clip(np.dstack([out, al]), 0, 1) * 255).astype(np.uint8), 'RGBA')
    if glow > 0:
        m = Image.fromarray(((al > .1).astype(np.uint8)) * 255).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3))
        ga = np.asarray(m).astype(np.float32) / 255. * .55 * glow
        halo = np.dstack([np.full_like(ga, .62), np.full_like(ga, .80), np.full_like(ga, 1.0), ga])
        H = Image.fromarray((halo * 255).astype(np.uint8), 'RGBA')
        H.alpha_composite(res)
        res = H
    return res


def save(name, frames):
    d = os.path.join(OUT, 'anim', name)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    for i, f in enumerate(frames):
        f.save(os.path.join(d, 'frame_%03d.png' % i))


idle, atk, cast, hurt, down = (load(a) for a in ('idle', 'atk', 'cast', 'hurt', 'down'))
shutil.rmtree(os.path.join(OUT, 'fx'), ignore_errors=True)
anims = {'idle': idle, 'walk': idle, 'atk': atk, 'cast': cast, 'hurt': hurt, 'down': down}
aw_idle = [tint(f) for f in idle]
aw_cast = [tint(f) for f in cast]
aw_atk = [tint(f) for f in atk]
anims.update(aw_idle=aw_idle, aw_walk=aw_idle, aw_cast=aw_cast, aw_atk=aw_atk)
# 星臨に入る（25 コマ・ms は従来のまま。0〜11＝溜め、12〜16＝白いシルエット、17〜24＝星臨の姿）
inn = []
for i in range(25):
    if i < 12:
        inn.append(tint(idle[i % 9], k=i / 11., glow=i / 11.))
    elif i < 17:
        inn.append(tint(idle[i % 9], 1.0, .85, 1.0))
    else:
        inn.append(aw_idle[(i - 17) % 9])
anims['aw_in'] = inn
# 星臨の奥義（25 コマ・命中 17）：技のコマを引き延ばす
mp = [0, 0, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8]
anims['aw_ult'] = [aw_cast[m] for m in mp]
for n, fs in anims.items():
    save(n, fs)

MS = {'idle': ([150] * 9, 1), 'walk': ([90] * 9, 1), 'atk': ([80, 70, 70, 70, 70, 60, 60, 60, 80], 0, 4),
      'cast': ([90, 90, 100, 100, 100, 110, 110, 100, 120], 0, 6), 'hurt': ([50, 60, 70, 60, 60], 0),
      'down': ([100, 100, 100, 120, 140, 160, 160, 160, 300], 0),
      'aw_in': ([100, 90] + [80] * 10 + [70, 90, 90, 70, 70] + [60] * 8, 0),
      'aw_idle': ([150] * 9, 1), 'aw_walk': ([110] * 9, 1), 'aw_atk': ([60, 60, 70, 70, 70, 70, 70, 70, 60], 0, 4),
      'aw_cast': ([90, 90, 100, 100, 100, 110, 110, 100, 120], 0, 6),
      'aw_ult': ([120, 120] + [110] * 6 + [100] * 5 + [90] * 4 + [70] * 4 + [110, 110, 130, 200], 0, 17)}
J = json.load(open(os.path.join(OUT, 'character.json')))
J['_doc'] = ('全アニメ PixelLab の新しい絵（assets_src/pixel-art/celes-new/import_new.py が src/ から作る。'
             'aw_*＝星臨は通常のコマを青白く染めたもの・walk は idle のコピー）。コマは全て同じキャンバス、足元の基準点 anchor は元の解像度で。')
J['name'] = 'セレス'
J['anims'] = {}
for n, v in MS.items():
    e = dict(dir='anim/' + n, ms=v[0], loop=bool(v[1]), scale=1.0, anchor=[AX, AY])
    if len(v) > 2:
        e['hit'] = v[2]
    J['anims'][n] = e
J['fxAnims'] = {}
J['seirinAnims'] = {}


def pose(im, W, H):
    c = im.crop(im.getbbox())
    cv = Image.new('RGBA', (W, H))
    cv.alpha_composite(c, (W // 2 - c.width // 2, H - 2 - c.height))
    return cv


rot = Image.open(os.path.join(SRC, 'rotation_west.png')).convert('RGBA')
M = os.path.join(OUT, 'master')
pose(rot, 80, 106).save(M + '/front.png')
pose(rot, 80, 106).save(M + '/side.png')
pose(cast[5], 96, 106).save(M + '/ready.png')
pose(down[4], 96, 106).save(M + '/dying.png')
pose(down[8], 96, 54).save(M + '/faint.png')
json.dump(J, open(os.path.join(OUT, 'character.json'), 'w'), ensure_ascii=False, indent=1)

ci = Image.open(os.path.join(HERE, 'cutin', 'celes_cutin_raw.png')).convert('RGBA')
D = os.path.join(ROOT, 'img', 'cutin')
os.makedirs(D, exist_ok=True)
ci.save(D + '/celes_ougi.png')
tint(ci, 1.0, 0.0, 1.0).save(D + '/celes_aw.png')
print('ok', {n: len(f) for n, f in anims.items()})
