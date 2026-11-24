#!/usr/bin/env python3
"""セレス（案2・celes-hd）の素材パック assets_src/chars/celes/ を作る【仮のコマ・以後は実行しない：本番コマ import_pl.py のコマを消すため】。
master/ は celes-hd の sprites（front/side/ready/dying/faint）。anim/<名>/frame_000.png … は、補間を使わず
「ドットを動かす操作」だけで ready / dying から作る仮のコマ（呼吸＝行を抜く・前傾＝行ごとのずらし・宝石を明るく・浮き）。
後で PixelLab 等の本番のコマに差し替えるときは、anim/<名>/ のフォルダの中身を入れ替え、character.json の
anims.<名> の ms（コマごとの ms）と hit（当たるコマの番号）を直すだけでよい。コマは全て 112×104・足元＝(56,102) に固定。
  python3 assets_src/pixel-art/celes-hd/make_pack.py && python3 tools/spx_import.py build celes --preview <dir>"""
import json, os, shutil
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, 'sprites')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), 'assets_src', 'chars', 'celes')
W, H, AX, AY = 112, 104, 56, 102


def load(n):
    return np.asarray(Image.open(os.path.join(SP, 'celes_hd_%s.png' % n)).convert('RGBA')).copy()


def foot_x(a):
    ys, xs = np.where(a[..., 3] > 0)
    ay = ys.max()
    low = xs[ys >= ay - max(2, (ay - ys.min()) // 8)]
    return int(round(np.median(low))), int(ay)


def place(a):
    """元の絵を 112×104 に、足元の x を 56・最下段を 102 に合わせて置く"""
    fx, ay = foot_x(a)
    c = np.zeros((H, W, 4), np.uint8)
    h, w = a.shape[:2]
    ox, oy = AX - fx, AY - ay
    for y in range(h):
        for x in range(w):
            if a[y, x, 3] and 0 <= y + oy < H and 0 <= x + ox < W:
                c[y + oy, x + ox] = a[y, x]
    return c


def shift(a, dx=0, dy=0):
    c = np.zeros_like(a)
    ys, xs = np.mgrid[0:H, 0:W]
    ny, nx = ys + dy, xs + dx
    ok = (ny >= 0) & (ny < H) & (nx >= 0) & (nx < W)
    c[ny[ok], nx[ok]] = a[ys[ok], xs[ok]]
    return c


def shear(a, k, pivot=AY):
    """足元を支点に、上の行ほど横へ k ドットずらす（前傾・のけぞり）"""
    c = np.zeros_like(a)
    for y in range(H):
        off = int(round(k * max(0, pivot - y) / pivot))
        row = shift(a[y:y + 1].repeat(H, 0), off, 0)[0] if off else a[y]
        c[y] = row
    return c


def breathe(a, y0=56, y1=72, n=1):
    """y0〜y1 の帯で上の行といちばん似た行を n 本抜き、上に透明行を足す（上半身が n 下がる）"""
    a = a.copy()
    for _ in range(n):
        best = min(range(y0, y1), key=lambda y: (a[y] != a[y - 1]).any(1).sum())
        a = np.concatenate([np.zeros((1, W, 4), np.uint8), np.delete(a, best, 0)], 0)
    return a


def glow(a, s=1):
    """杖の宝石（青）を明るく"""
    a = a.copy()
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    m = (a[..., 3] > 0) & (b > 140) & (b > r + 50) & (b > g + 30)
    for i, v in enumerate((60 * s, 90 * s, 70 * s)):
        a[..., i] = np.where(m, np.minimum(255, a[..., i].astype(int) + v), a[..., i])
    return a


def mk():
    R, S, D, F = (place(load(n)) for n in ('ready', 'side', 'dying', 'faint'))
    B1 = breathe(R)
    fa = np.zeros((H, W, 4), np.uint8)   # 倒れ：faint を 112 の中央・最下段に置く
    f0 = load('faint')
    ys, xs = np.where(f0[..., 3] > 0)
    crop = f0[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    fa[AY + 1 - crop.shape[0]:AY + 1, AX - crop.shape[1] // 2:AX - crop.shape[1] // 2 + crop.shape[1]] = crop
    # 名前 → (コマ列, ms 列, loop, matchPose, hit)
    A = {
        'idle': ([R, R, B1, B1], [380] * 4, True, 'ready', None),
        'walk': ([R, shift(shear(R, 1), 0, -1), R, shift(shear(R, -1), 0, -1)], [110] * 4, True, 'ready', None),
        'atk': ([shear(R, -2), shift(shear(R, 3), 2), shift(shear(R, 5), 4), shift(shear(R, 3), 2), shear(R, 1)],
                [90, 70, 80, 90, 90], False, 'ready', 2),
        'cast': ([R, glow(breathe(R)), glow(shift(shear(R, -1), 0, -2)), glow(shift(shear(R, -1), 0, -3), 2),
                  glow(shift(shear(R, -1), 0, -3), 2), glow(shift(R, 0, -1))], [90, 110, 100, 110, 150, 100], False, 'ready', 3),
        'hurt': ([shift(shear(R, -4), -2), shift(shear(D, -3), -2), shear(D, -1)], [60, 80, 80], False, 'ready', None),
        'down': ([shear(D, -3), shift(shear(D, -6), -2), fa], [140, 140, 700], False, 'dying', None),
        'aw_in': ([glow(breathe(R)), glow(shift(R, 0, -2)), glow(shift(R, 0, -4), 2), glow(shift(R, 0, -6), 2),
                   glow(shift(R, 0, -6), 2), glow(shift(R, 0, -2))], [110, 90, 90, 110, 160, 100], False, 'ready', 3),
    }
    return A, {n: place(load(n)) if n != 'faint' else fa for n in ('front', 'side', 'ready', 'dying', 'faint')}


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'master'))
    for n in ('front', 'side', 'ready', 'dying', 'faint'):
        shutil.copy(os.path.join(SP, 'celes_hd_%s.png' % n), os.path.join(OUT, 'master', n + '.png'))
    A, _ = mk()
    anims = {}
    for nm, (fr, ms, loop, mp, hit) in A.items():
        d = os.path.join(OUT, 'anim', nm)
        os.makedirs(d)
        for i, f in enumerate(fr):
            Image.fromarray(f).save(os.path.join(d, 'frame_%03d.png' % i))
        spec = {'dir': 'anim/' + nm, 'ms': ms, 'loop': loop, 'matchPose': mp, 'anchor': [AX, AY]}
        if hit is not None:
            spec['hit'] = hit
        anims[nm] = spec
    J = {'_doc': '仮のコマ（make_pack.py が作る）。本番に差し替えるときは anim/<名>/ の PNG を入れ替え、anims.<名> の ms・hit を直す。'
                 'コマは全て同じキャンバス、足元の基準点 anchor は元の解像度で。詳しくは docs/PIPELINE.md・tools/spx_import.py',
         'id': 'celes_hd', 'kind': 'hum', 'name': 'セレス（案2）', 'identity': '銀髪ロングの魔女。紫のローブと金の縁取り・紫のとんがり帽子・青い宝石の金の杖',
         'face': 'R', 'key': None, 'palette': {'colors': 32, 'seirinColors': 32}, 'scale': {'ref': 'front', 'refK': 1.0, 'seirin': 1.0},
         'sizes': [['b50', 50], ['b66', 66], ['b83', 83], ['b99', 99]],
         'poses': {n: 'master/%s.png' % n for n in ('front', 'side', 'ready', 'dying', 'faint')},
         'anims': anims, 'seirinAnims': {}, 'rig': None}
    json.dump(J, open(os.path.join(OUT, 'character.json'), 'w'), ensure_ascii=False, indent=2)
    print('wrote', OUT, list(anims))


if __name__ == '__main__':
    main()
