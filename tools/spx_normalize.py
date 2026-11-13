#!/usr/bin/env python3
"""ドット絵データの正規化（ver0.29）。js/sprite/data/spx-data.js を整え、何度実行しても同じ結果になる。

1. 重複データの除去：spx-data-heroes.js が上書きするキャラ（rio / jin / valk / noah_K / jin_K / valk_K）は
   実行時に使われないので spx-data.js から外す。build_spx_heroes.py が素材として読む noah_K・jin_K は
   assets_src/legacy/spx-legacy.json に保管する（実行時には読み込まない）
2. 向きの焼き込み：原画で右を向いていたポーズ（以前は spx.js の FLIPF で毎回反転していた）を、
   データ側で左右反転して保存する。これで「データの face ＝全ポーズの向き」が必ず成り立つ
3. 背面（back）：戦闘サイズ（b/B/u）に背面が無い味方は、探索用（f34）の背面の原画を
   Scale2x で 4 倍に起こし、正面と同じ比率の背丈へ面積平均で縮めてキャラのパレットに戻す。
   自動で作った絵は c.derived に名前を記録する（手描きの背面に差し替えたら外す）

使い方：python3 tools/spx_normalize.py
"""
import base64, io, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spx_common import shrink, to_pal_idx, png_of, lum  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'js', 'sprite', 'data', 'spx-data.js')
LEGACY = os.path.join(ROOT, 'assets_src', 'legacy', 'spx-legacy.json')
HEADER = '/* 自動生成：旧 tools/build_spx.py の出力を tools/spx_normalize.py が整えたもの（提供原画 → パレット番号 PNG）。手で編集しない */\n'

OVERRIDDEN = ['rio', 'jin', 'valk', 'noah_K', 'jin_K', 'valk_K']      # spx-data-heroes.js が上書きする
KEEP_LEGACY = ['noah_K', 'jin_K']                                      # build_spx_heroes.py の素材
FLIPF = {'gald': ['stance', 'front', 'ready', 'hit', 'cast', 'weak', 'win', 'stand', 'walk_a', 'walk_b'],
         'mire': ['stance', 'guard', 'weak', 'hit', 'stand', 'walk_a', 'walk_b'],
         'hakua': ['weak'], 'shion': ['weak']}


def load():
    s = open(BASE).read()
    return json.loads(s[s.index('{', s.index('SPX_DATA')):s.rindex('}') + 1])


def dec(S):
    im = Image.open(io.BytesIO(base64.b64decode(S['png'].split(',')[1])))
    assert im.mode == 'P'
    return np.array(im).astype(np.int32)


def pal_rgb(c):
    return np.array([[int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)] for h in c['pal']], np.float64)


def repack(S, tiles, pal):
    """tiles：[(名前, idx, ax, ay)] をアトラスへ詰め直す（順番は維持）"""
    Wt = sum(t[1].shape[1] + 1 for t in tiles)
    Ht = max(t[1].shape[0] for t in tiles)
    big = np.zeros((Ht, Wt), np.int32)
    fr, x = {}, 0
    for nm, idx, ax, ay in tiles:
        h, w = idx.shape
        big[:h, x:x + w] = idx
        fr[nm] = [x, 0, w, h, int(ax), int(ay)]
        x += w + 1
    S['png'] = png_of(big, pal)
    S['frames'] = fr


def tiles_of(S):
    at = dec(S)
    return [(nm, at[y:y + h, x:x + w].copy(), ax, ay) for nm, (x, y, w, h, ax, ay) in S['frames'].items()]


# ---------- Scale2x（パレット番号のまま 2 倍。色を混ぜない） ----------
def scale2x(a):
    p = np.pad(a, 1, mode='edge')
    B, D, E, F, H = p[:-2, 1:-1], p[1:-1, :-2], p[1:-1, 1:-1], p[1:-1, 2:], p[2:, 1:-1]
    c = (B != H) & (D != F)
    e0 = np.where(c & (D == B), D, E)
    e1 = np.where(c & (B == F), F, E)
    e2 = np.where(c & (D == H), D, E)
    e3 = np.where(c & (H == F), F, E)
    o = np.zeros((a.shape[0] * 2, a.shape[1] * 2), a.dtype)
    o[0::2, 0::2], o[0::2, 1::2], o[1::2, 0::2], o[1::2, 1::2] = e0, e1, e2, e3
    return o


def unoutline(idx, pal):
    """小さいサイズで足した「最暗色の輪郭」を、内側の隣の色で置き換える"""
    m = idx > 0
    edge = m & ~nd.binary_erosion(m)
    dark = len(pal)
    out = idx.copy()
    inner = m & ~edge
    if not inner.any():
        return out
    _, (iy, ix) = nd.distance_transform_edt(~inner, return_indices=True)
    sel = edge & (idx == dark)
    out[sel] = idx[iy[sel], ix[sel]]
    return out


def foot(m):
    ys, xs = np.where(m)
    ay = int(ys.max())
    low = xs[ys >= ay - max(2, m.shape[0] // 8)]
    return int(round(np.median(low))), ay


def derive_back(c, sk):
    """f34 の背面 → サイズ sk の背面（パレット番号）。背丈は「f34 の背面/正面」の比を保つ"""
    pal = pal_rgb(c)
    f = c['sizes']['f34']
    at = dec(f)
    x, y, w, h, _, _ = f['frames']['back']
    src = unoutline(at[y:y + h, x:x + w], pal)
    up = scale2x(scale2x(src))
    rgb = np.zeros(up.shape + (3,))
    m = up > 0
    rgb[m] = pal[up[m] - 1]
    S = c['sizes'][sk]
    fh = S['frames']['front'][3]
    want_h = max(8, round(h / f['frames']['front'][3] * fh))
    want_w = max(4, round(up.shape[1] * want_h / up.shape[0]))
    col, mm = shrink(rgb, m.astype(np.float64), want_w)
    idx = to_pal_idx(col, mm, pal)
    if S['dots'] <= 36:   # 小さいサイズは他の絵と同じく輪郭を最暗色でなぞる
        edge = mm & ~nd.binary_erosion(mm)
        dk = np.array([lum(p) for p in pal])
        e = edge & (idx > 0)
        idx[e] = np.where(dk[idx[e] - 1] < 70, idx[e], len(pal))
    ys, xs = np.where(idx > 0)
    idx = idx[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    ax, ay = foot(idx > 0)
    return idx, ax, ay


def main():
    D = load()
    # 1. 重複の除去（素材として必要なものは保管）
    os.makedirs(os.path.dirname(LEGACY), exist_ok=True)
    leg = json.load(open(LEGACY)) if os.path.exists(LEGACY) else {}
    for k in KEEP_LEGACY:
        if k in D and k not in leg:
            leg[k] = D[k]
    with open(LEGACY, 'w') as f:
        json.dump(leg, f, separators=(',', ':'))
    for k in OVERRIDDEN:
        D.pop(k, None)
    # 2. 向きの焼き込み
    for id_, names in FLIPF.items():
        c = D.get(id_)
        if not c or c.get('flipBaked'):
            continue
        for sk, S in c['sizes'].items():
            t2 = []
            for nm, idx, ax, ay in tiles_of(S):
                if nm in names:
                    idx, ax = idx[:, ::-1].copy(), idx.shape[1] - 1 - ax
                t2.append((nm, idx, ax, ay))
            repack(S, t2, pal_rgb(c))
        c['flipBaked'] = 1
    # 3. 背面
    for id_, c in D.items():
        if c.get('kind') != 'hum' or id_.endswith('_K') or 'f34' not in c['sizes'] or 'back' not in c['sizes']['f34']['frames']:
            continue
        der = set(c.get('derived', []))
        for sk, S in c['sizes'].items():
            if sk[0] == 'f' or 'back' in S['frames'] or 'front' not in S['frames']:
                continue
            idx, ax, ay = derive_back(c, sk)
            repack(S, tiles_of(S) + [('back', idx, ax, ay)], pal_rgb(c))
            der.add('back')
        if der:
            c['derived'] = sorted(der)
    with open(BASE, 'w') as f:
        f.write(HEADER)
        f.write('const SPX_DATA=' + json.dumps(D, separators=(',', ':'), ensure_ascii=False) + ';\n')
    print('wrote', BASE, os.path.getsize(BASE), list(D))


if __name__ == '__main__':
    main()
