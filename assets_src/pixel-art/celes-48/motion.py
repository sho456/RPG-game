"""セレス 48px の連続モーション（rpg-hero-motion 5 章：ポーズごとのコマ。全コマ同じキャンバス・足元固定）
絵をぼかさないため、補間は使わず「ドットを動かす操作」だけで中間のコマを作る：
  breathe 胴の帯で重複の多い 1 行を抜いて上半身を 1 下げる（呼吸・沈み）
  shear   足元を支点に行ごとに横へずらす（前傾・のけぞり。1 ドットずつの段）
  drift   部品（後ろ髪・裾）を外へ 1〜2 ずらして上書き（なびき・はね上げ）
  glow    杖の宝石の色を 1 段明るく（溜め）
出力：sprites/anim/<ポーズ>/frame_000.png …（48×48）と preview/motion_sheet.png"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, 'sprites')
C = np.load(os.path.join(SP, 'palette.npy')).round().astype(int)
HAIR = [tuple(C[i]) for i in (10, 11, 13, 25, 7)]
OUTL = tuple(C[9])
GEM = {tuple(C[12]): tuple(C[20]), tuple(C[27]): tuple(C[12]), tuple(C[20]): (255, 255, 255)}


def load(n):
    return np.asarray(Image.open(os.path.join(SP, f'celes48_{n}.png')).convert('RGBA')).copy()


def is_col(a, cols):
    m = np.zeros(a.shape[:2], bool)
    for c in cols:
        m |= (a[..., :3] == c).all(2) & (a[..., 3] > 0)
    return m


def breathe(a, y0, y1, n=1):
    """y0〜y1 の帯で、上の行といちばん似た行を n 本抜き、上に透明の行を足す（上半身が n 下がる）"""
    a = a.copy()
    for _ in range(n):
        best = min(range(y0, y1), key=lambda y: (a[y] != a[y - 1]).any(1).sum())
        a = np.concatenate([np.zeros((1, 48, 4), np.uint8), np.delete(a, best, 0)], 0)
    return a


def shear(a, k, pivot=47, top=0):
    """足元（pivot）を支点に行ごとに横へずらす。k＝頭の位置でのずれ（負＝前＝左）"""
    out = np.zeros_like(a)
    for y in range(48):
        d = int(round(k * max(0, pivot - y) / max(1, pivot - top)))
        if d > 0:
            out[y, d:] = a[y, :48 - d]
        elif d < 0:
            out[y, :48 + d] = a[y, -d:]
        else:
            out[y] = a[y]
    return out


def drift(a, mask, dx, dy=0):
    """部品（mask）を dx・dy ずらして上書き（輪郭ごと）。もとの位置は残す＝外へ伸びる"""
    m = mask.copy()
    pad = np.zeros_like(m)
    pad[1:-1, 1:-1] = (m[:-2, 1:-1] | m[2:, 1:-1] | m[1:-1, :-2] | m[1:-1, 2:])
    m |= pad & is_col(a, [OUTL])
    out = a.copy()
    ys, xs = np.where(m)
    Y, Xs = ys + dy, xs + dx
    ok = (Y >= 0) & (Y < 48) & (Xs >= 0) & (Xs < 48)
    out[Y[ok], Xs[ok]] = a[ys[ok], xs[ok]]
    return out


def back_hair(a, y0=22, x0=None):
    """後ろ髪：髪の色で、体の中心より後ろ（右）・y0 より下"""
    m = is_col(a, HAIR)
    ys, xs = np.where(a[..., 3] > 0)
    cx = (xs.min() + xs.max()) / 2 if x0 is None else x0
    m[:y0] = False
    m[:, :int(cx)] = False
    return m


def glow(a, k=1):
    out = a.copy()
    for _ in range(k):
        o2 = out.copy()
        for s, d in GEM.items():
            o2[(out[..., :3] == s).all(2) & (out[..., 3] > 0), :3] = d
        out = o2
    return out


def lift(a, dy):
    """全体を上下（跳ぶ・沈む）。足元の位置はデモ側で扱うが、コマの中での浮きに使う"""
    out = np.zeros_like(a)
    if dy > 0:
        out[:48 - dy] = a[dy:]
    else:
        out = a
    return out


S = {n: load(n) for n in ('side', 'ready', 'cast', 'dying', 'faint', 'front')}
A = {}
# 待機（横向き）：呼吸 2 段＋後ろ髪のなびき。0.16 秒ずつ 4 コマで回す
s = S['side']
A['idle'] = [s, breathe(s, 26, 34), drift(breathe(s, 26, 34), back_hair(breathe(s, 26, 34)), 1), breathe(s, 26, 34)]
# 詠唱：ふわりと浮いて髪と裾がはね上がる・宝石が脈打つ（ループ 4 コマ）
c = S['cast']
c1 = drift(c, back_hair(c, 18), 1, -1)
A['cast'] = [c, glow(c1), glow(drift(c1, back_hair(c1, 18), 1), 2), glow(c1)]
# 詠唱に入る：横向き → 沈む（溜め）→ 詠唱
A['cast_in'] = [breathe(s, 26, 40, 2), shear(breathe(c, 26, 40, 1), 1)]
# 発動：詠唱 → のけぞって溜める → 前へ伸び切る（髪が後ろへ流れる）→ 構え
r = S['ready']
pre = shear(breathe(r, 24, 40, 1), 2)
act = shear(r, -3)
act = drift(act, back_hair(act, 16), 2)
A['act'] = [pre, act, shear(r, -1), r]
# 被弾：白い影の後のけぞり（2 段）→ 戻り
A['hit'] = [shear(breathe(s, 26, 40, 1), 3), drift(shear(s, 4), back_hair(shear(s, 4), 16), -2), shear(s, 1)]
# 瀕死：肩で息をする（沈みの 2 段）
d = S['dying']
A['weak'] = [d, breathe(d, 22, 34), breathe(d, 22, 34, 2), breathe(d, 22, 34)]
# 倒れる：瀕死 → 大きくのけぞって崩れる → 気絶（弾んで止まる）
f = S['faint']
A['fall'] = [shear(breathe(d, 22, 40, 2), 4), shear(breathe(d, 18, 42, 4), 6), lift(f, 3), f]
# 気絶：かすかな呼吸
A['down'] = [f, breathe(f, 34, 40)]
# 勝利・選択に使う正面（呼吸）
A['front'] = [S['front'], breathe(S['front'], 26, 34)]

if __name__ == '__main__':
    root = os.path.join(SP, 'anim')
    for k, fr in A.items():
        os.makedirs(os.path.join(root, k), exist_ok=True)
        for i, a in enumerate(fr):
            Image.fromarray(a, 'RGBA').save(os.path.join(root, k, f'frame_{i:03d}.png'))
    # 一覧
    z, pad = 4, 10
    F = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 18)
    rows = list(A.items())
    W = pad + max(len(v) for _, v in rows) * (48 * z + pad) + 120
    sh = Image.new('RGBA', (W, pad + len(rows) * (48 * z + pad)), (24, 24, 36, 255))
    d = ImageDraw.Draw(sh)
    JA = {'idle': '待機', 'cast': '詠唱', 'cast_in': '詠唱に入る', 'act': '発動', 'hit': '被弾', 'weak': '瀕死', 'fall': '倒れる', 'down': '気絶', 'front': '正面'}
    for r_, (k, fr) in enumerate(rows):
        y = pad + r_ * (48 * z + pad)
        d.text((pad, y + 80), JA[k], font=F, fill=(250, 220, 120))
        for i, a in enumerate(fr):
            bg = Image.new('RGBA', (48 * z, 48 * z), (58, 62, 82, 255))
            bg.alpha_composite(Image.fromarray(a, 'RGBA').resize((48 * z, 48 * z), Image.NEAREST))
            sh.alpha_composite(bg, (120 + i * (48 * z + pad), y))
    os.makedirs(os.path.join(HERE, 'preview'), exist_ok=True)
    sh.save(os.path.join(HERE, 'preview', 'motion_sheet.png'))
    print({k: len(v) for k, v in A.items()})
