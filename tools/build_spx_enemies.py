#!/usr/bin/env python3
"""提供原画（敵）→ js/spx-data-enemy.js

assets_src/originals/enemies_*.jpg（白背景にキャラを並べた原画）から、
spx.js が読む形式（キャラ×サイズごとのパレット付き PNG アトラス）を作る。

・背景：白に近い画素のうち、画像の縁とつながっているものだけを抜く（体の中の白いハイライトは残す）
・切り出し：前景の連結成分を、近い大きな成分（＝キャラ本体）へ割り当てる（スライムの泡・揺らぎも本体に付く）
・縮小：原画は 1 ドット ≒ 3 画素。不透明度で重み付けした面積平均で縮め（白背景がにじまない）、
  キャラごとに 1 つのパレット（約 36 色）へ割り当てる。全サイズで同じパレットを使う（色替えをパレットで行うため）
・色替え：同じ形の色違いの敵（苔スライム、亡霊騎士、黒鉄の巨像…）はパレットごとの写像で作る（vars）
使い方：python3 tools/build_spx_enemies.py
"""
import base64, colorsys, io, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'sprite', 'data', 'spx-data-enemy.js')
PREVIEW = sys.argv[1] if len(sys.argv) > 1 else None
ORIG = lambda n: os.path.join(ROOT, 'assets_src', 'originals', n)

# ---------- キャラ定義 ----------
# 原画ごとに、左から順にキャラを並べる。face：原画の向き（L＝左向き、R＝右向き）。b/f/z/u：横幅のドット数
# ver0.36 の決まり：敵の原画は、正面向きのものも含めて「そのままの向き＝右向き」とする（戦闘・図鑑の既定は右向き。鏡写しにしない）
SOURCES = [
    ('enemies_set1.jpg', [
        dict(id='slime',  face='R', ncol=34, b=[40, 46, 52, 58, 66, 74, 84, 96], f=24, z=46, u=56),
        dict(id='knight', face='R', ncol=38, b=[34, 38, 42, 48, 54, 60, 68, 78, 90], f=22, z=46, u=48),
        dict(id='golem',  face='R', ncol=38, b=[46, 52, 58, 66, 74, 84, 96, 110, 126, 144, 164], f=40, z=46, u=56),
        dict(id='banjin', face='R', ncol=36, b=[36, 42, 48, 56, 64, 72, 82, 94, 108], f=28, z=46, u=48),
    ]),
    ('enemies_set2.jpg', [
        dict(id='icespirit', face='R', ncol=30, b=[30, 34, 38, 44, 50, 56, 64, 72, 82], f=20, z=46, u=44),
        dict(id='shroom',    face='R', ncol=34, b=[34, 38, 44, 50, 56, 64, 72, 82, 94], f=24, z=46, u=52),
        dict(id='_goldwolf_old', views=['skip']),   # 旧・金の狼（enemies_snowwolf.jpg に差し替え。並びの数合わせに読むだけ）
        dict(id='gknight',   face='R', ncol=36, b=[28, 32, 36, 40, 46, 52, 58, 66, 76], f=20, z=46, u=44),
    ]),
    ('enemies_set3.jpg', [
        dict(id='jelly', face='R', ncol=34, b=[28, 32, 36, 42, 48, 54, 62, 70, 80], f=20, z=46, u=44),
        dict(id='shade', face='R', ncol=30, b=[34, 38, 44, 50, 56, 64, 72, 82, 94], f=24, z=46, u=52),
        dict(id='drake', face='R', ncol=36, b=[56, 64, 72, 82, 92, 104, 118, 134, 150, 170, 192, 216], f=44, z=46, u=64),
    ]),
    # 狼の系統（灰狼・雪狼・雷狼・翠狼・天狼・灰狼の頭目・翠狼の主）：白い狼の原画 1 枚から色替えで作る。
    # （ver0.32 の 1 枚目 enemies_snowwolf.jpg＝尾の多い狼は、この原画と狐の原画に置き換えたので使わない）
    # ring：白い毛の光沢を背景と見分ける。despeckle：周りの光の粒を落とす
    ('enemies_wolf.jpg', [
        dict(id='goldwolf', face='R', ncol=34, b=[56, 64, 72, 82, 92, 104, 118, 134, 150, 170], f=40, z=46, u=64),
    ], {'ring': 120, 'despeckle': .004}),
    # 狐の系統（氷華の妖狐・天狐の残照・回廊の番人）：氷の九尾の狐
    ('enemies_fox.jpg', [
        dict(id='fox', face='R', ncol=36, b=[56, 64, 72, 82, 92, 104, 118, 134, 150, 170, 192], f=40, z=46, u=64),
    ], {'ring': 120, 'despeckle': .004}),
    # 3 方向の絵：views に原画の左からの並び（idle＝戦闘で使う斜めの絵。right 向き）。shadow：足元の影を抜く
    ('enemies_queen.jpg', [
        dict(id='queen', face='R', ncol=36, views=['front', 'idle', 'skip'], shadow=True,
             b=[36, 42, 48, 56, 64, 72, 82, 94, 108, 124], f=24, z=46, u=48),
    ]),
    ('enemies_ninja.jpg', [
        dict(id='ninja', face='R', ncol=36, views=['front', 'skip', 'idle'], shadow=True,
             b=[40, 46, 52, 60, 68, 78, 90, 104, 120, 138], f=26, z=46, u=52),
    ]),
]


# ---------- 読み込み・背景抜き・切り出し ----------
def load_source(fname, n_chars, ring=0, despeckle=0):
    """ring：体に囲まれた白い島を「すき間」とみなすのは、周り（3 画素の輪）の白との色差の平均が ring を超える（＝輪郭線に囲まれた）ときだけ。
    白い毛・刃の光沢（明るい色に囲まれている）は残す。0 なら従来の判定（広い島はすべて抜く）。
    despeckle：本体から離れた、最大の成分のこの割合より小さい粒（光の粒・飾りの星）を落とす"""
    img = np.asarray(Image.open(ORIG(fname)).convert('RGB')).astype(np.float64)
    dist = (255 - img).max(2)
    lab, n = nd.label(dist <= 28)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ~np.isin(lab, list(border))
    # 体に囲まれた背景（腕と胴のすき間など）：広い、または真っ白な白の島も背景にする。小さいハイライトは残す
    for i, (s_, o_) in enumerate(zip(nd.sum(np.ones_like(dist), lab, range(1, n + 1)), nd.find_objects(lab))):
        if i + 1 in border:
            continue
        mdist = dist[o_][lab[o_] == i + 1].mean()
        if ring:
            if s_ >= 80 and mdist < 10:
                sl = tuple(slice(max(0, q.start - 4), q.stop + 4) for q in o_)
                me = lab[sl] == i + 1
                if dist[sl][nd.binary_dilation(me, iterations=3) & ~me].mean() > ring:
                    fg[lab == i + 1] = False
        elif s_ >= 300 or (s_ >= 80 and mdist < 6):
            fg[lab == i + 1] = False
    fg = nd.binary_opening(fg, iterations=1)          # JPEG の縁のにじみ（1 画素の白っぽい輪）を落とす
    fg = nd.binary_erosion(fg, iterations=1) | (fg & (dist > 120))
    lab2, n2 = nd.label(fg)
    sizes = nd.sum(fg, lab2, range(1, n2 + 1))
    objs = nd.find_objects(lab2)
    comps = [(i + 1, s, o) for i, (s, o) in enumerate(zip(sizes, objs)) if s >= max(25, despeckle * sizes.max())]
    bodies = sorted(sorted(comps, key=lambda c: -c[1])[:n_chars], key=lambda c: c[2][1].start)
    owner = {}
    for li, s, o in comps:
        cx = (o[1].start + o[1].stop) / 2
        owner[li] = min(range(len(bodies)), key=lambda k: abs(cx - (bodies[k][2][1].start + bodies[k][2][1].stop) / 2)
                        if not (bodies[k][2][1].start <= cx < bodies[k][2][1].stop) else -1)
    crops = []
    for k in range(n_chars):
        ids = [li for li, b in owner.items() if b == k]
        m = np.isin(lab2, ids)
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crops.append((img[y0:y1, x0:x1], m[y0:y1, x0:x1].astype(np.float64)))
    return crops


from spx_common import shrink, kmeans, lum, to_pal_idx, png_of, anchor  # noqa: E402


# ---------- 色替え（パレットの各色を写像） ----------
hexs = lambda c: '#%02x%02x%02x' % tuple(int(max(0, min(255, round(v)))) for v in c)


def hsv(c):
    return colorsys.rgb_to_hsv(*(np.array(c) / 255))


def rgb(h, s, v):
    return np.array(colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v)))) * 255


def hue_in(h, a, b):
    h *= 360
    return a <= h <= b if a <= b else (h >= a or h <= b)


def rule_map(pal, rules):
    """rules：[(条件, 変換)]。条件 (h,s,v)→bool、変換 (h,s,v)→(h,s,v)。最初に当てはまった規則を使う"""
    out = []
    for c in pal:
        h, s, v = hsv(c)
        for cond, fn in rules:
            if cond(h, s, v):
                out.append(rgb(*fn(h, s, v)))
                break
        else:
            out.append(np.array(c))
    return out


def tint(hue, sat=None, val=1.0, smul=1.0, vadd=0.0):
    """色相を hue（度）へ。sat を与えるとその彩度、smul は彩度の倍率。val は明度の倍率"""
    def f(h, s, v):
        return (hue / 360, (sat if sat is not None else s) * smul, v * val + vadd)
    return f


def grey(val=1.0, tint_h=None, sat=0.0):
    def f(h, s, v):
        return ((tint_h or 0) / 360, sat, v * val)
    return f


ANY = lambda h, s, v: True
SATD = lambda lo: (lambda h, s, v: s >= lo)
HUE = lambda a, b, smin=.12: (lambda h, s, v: s >= smin and hue_in(h, a, b))

VARS = {
    # スライム（原画：紫の体・薄紫の結晶・水色の目の光）
    'slime': {
        'moss':        [(HUE(170, 215, .2), tint(150, smul=.8)), (SATD(.08), tint(118, smul=.85, val=.92))],
        'cursedslime': [(HUE(170, 215, .2), tint(350, smul=.9)), (SATD(.08), tint(330, smul=.75, val=.88))],
        'ironslime':   [(HUE(170, 215, .2), tint(205, smul=.35, val=1.05)), (ANY, grey(1.02, 215, .1))],
        'iceslime':    [(HUE(170, 215, .2), tint(190, smul=.5, val=1.1)), (SATD(.08), tint(198, smul=.8, val=1.12))],
        'waterslime':  [(HUE(170, 215, .2), tint(175, smul=.8, val=1.05)), (SATD(.08), tint(212, smul=.95, val=1.05))],
        'lavaslime':   [(HUE(170, 215, .2), tint(50, smul=1, val=1.1)), (SATD(.08), tint(16, smul=1.05, val=1.05))],
    },
    # 騎士（原画：青緑の鎧・水色に光る紋・青い羽根飾り・金の柄）
    'knight': {
        'darkknight': [(HUE(165, 205, .45), tint(285, smul=.9)), (HUE(205, 250, .2), tint(290, smul=.9)),
                       (HUE(150, 215, .0), tint(265, smul=1.0, val=.78))],
        'drowned':    [(HUE(165, 205, .45), tint(178, smul=1, val=1.1)), (HUE(205, 250, .2), tint(196, smul=.75, val=.8)),
                       (HUE(150, 215, .0), tint(160, smul=.85, val=.82))],
    },
    # ゴーレム（原画：茶色の岩・緑の苔・青い核・黄色の目・銀の腕輪・金の縁）
    'golem': {
        'boss2':     [(HUE(195, 250, .3), tint(42, smul=1, val=1.05)), (HUE(70, 140, .12), tint(95, smul=.6)),
                      (HUE(15, 70, .0), tint(40, smul=.55, val=1.04))],
        'golemboss': [(HUE(195, 250, .3), tint(18, smul=1.1, val=1.1)), (HUE(45, 65, .5), tint(25, smul=1, val=1.05)),
                      (HUE(70, 140, .12), tint(240, smul=.2, val=.55)), (HUE(15, 70, .0), tint(240, smul=.25, val=.55)),
                      (ANY, grey(.6, 240, .08))],
        'tower10':   [(HUE(195, 250, .3), tint(325, smul=1, val=1.1)), (HUE(45, 65, .5), tint(320, smul=.6, val=1.1)),
                      (HUE(70, 140, .12), tint(225, smul=.55, val=.9)), (HUE(15, 70, .0), tint(222, smul=.6, val=.95)),
                      (ANY, grey(.95, 225, .15))],
        'boss7':     [(HUE(195, 250, .3), tint(188, smul=1, val=1.15)), (HUE(45, 65, .5), tint(190, smul=.7, val=1.1)),
                      (HUE(70, 140, .12), tint(48, smul=.3, val=1.25)), (HUE(15, 70, .0), tint(46, smul=.35, val=1.3)),
                      (ANY, grey(1.2, 45, .08))],
        'last1':     [(HUE(195, 250, .3), tint(250, smul=.6, val=1.2)), (HUE(45, 65, .5), tint(48, smul=.5, val=1.15)),
                      (HUE(70, 140, .12), tint(255, smul=.35, val=1.2)), (HUE(15, 70, .0), tint(252, smul=.4, val=1.28)),
                      (ANY, grey(1.2, 252, .12))],
        'kb30':      [(HUE(195, 250, .3), tint(48, smul=.8, val=1.15)), (HUE(45, 65, .5), tint(48, smul=.8, val=1.1)),
                      (HUE(70, 140, .12), tint(260, smul=.45, val=1.1)), (HUE(15, 70, .0), tint(258, smul=.5, val=1.15)),
                      (ANY, grey(1.1, 258, .15))],
    },
    # 氷の精（原画：水色の氷・白い光）→ 残り火（炎の精）
    'icespirit': {
        'ember': [(HUE(160, 260, .08), lambda h, s, v: (((22 + (1 - v) * 40) / 360), min(1, s * 1.6 + .25), v * 1.02)),
                  (ANY, lambda h, s, v: (40 / 360, .25, v))],
    },
    # 狼の系統（原画：白〜薄紫の毛・桃色の目・黒い鼻・紺の輪郭）。原画のままが雪狼（snowwolf）
    #   → 灰狼（graywolf：灰色の毛・琥珀の目）・雷狼（raiwolf：金色の毛・青い目）・翠狼（jadewolf：翠の毛・赤い目）
    'goldwolf': {
        'graywolf': [(lambda h, s, v: s >= .3 and hue_in(h, 285, 345), tint(32, sat=.85, val=1.0)),
                     (lambda h, s, v: v < .25, lambda h, s, v: (h, s, v)),
                     (ANY, lambda h, s, v: (228 / 360, .08 + (1 - v) * .16, (v ** 1.4) * .66))],
        'raiwolf':  [(lambda h, s, v: s >= .3 and hue_in(h, 285, 345), tint(200, sat=.8, val=1.0)),
                     (lambda h, s, v: v < .25, lambda h, s, v: (h, s, v)),
                     (ANY, lambda h, s, v: ((50 - (1 - v) * 34) / 360, min(.92, .62 + (1 - v) * 1.1), min(1, v * .97)))],
        'jadewolf': [(lambda h, s, v: s >= .3 and hue_in(h, 285, 345), tint(355, sat=.85, val=1.0)),
                     (lambda h, s, v: v < .25, lambda h, s, v: (h, s, v)),
                     (ANY, lambda h, s, v: ((158 + (1 - v) * 12) / 360, min(.75, .36 + (1 - v) * 1.1), v * .86))],
    },
    # 狐の系統（原画：水色の毛・白い胸毛・氷の結晶・紺の輪郭）。原画のままが氷華の妖狐（boss5）
    #   → 天狐の残照（tenko：金色の毛・淡い金の結晶・紅の目）
    'fox': {
        'tenko': [(lambda h, s, v: v < .22, lambda h, s, v: (28 / 360, min(.7, s + .3), v)),
                  (HUE(240, 290, .2), tint(352, sat=.75, val=1.0)),
                  (ANY, lambda h, s, v: ((44 - (1 - v) * 22) / 360, min(.85, .22 + s * .55 + (1 - v) * .5), min(1, v * 1.0 + .03)))],
    },
    # 緑の騎士（原画：緑の鎧・赤い羽根飾りと外套・金の縁）→ 竜兵（そのまま）・鬼武者・坑道の亡者
    'gknight': {
        'onimusha':   [(HUE(70, 175, .1), tint(356, sat=.72, val=.98)), (HUE(330, 25, .25), grey(.42, 0, .15))],
        'minerghost': [(HUE(70, 175, .1), tint(32, smul=.38, val=.85)), (HUE(330, 25, .25), tint(22, smul=.55, val=.7)),
                       (HUE(25, 65, .3), tint(42, smul=.75, val=1.0))],
    },
    # 火竜（原画：赤茶の鱗・金の角と爪・小さな炎）→ 虚獣ノクス
    'drake': {
        'last2': [(HUE(30, 70, .3), tint(300, smul=.9, val=1.1)), (HUE(330, 40, .1), tint(272, smul=.75, val=.6)),
                  (ANY, grey(.6, 270, .2))],
    },
    # 忍（原画：紫の鎧と髪・灰色の面・桃色に光る目と刃）→ 虚蝕の残影（青灰の鎧・水色の光）
    'ninja': {
        'boss4b': [(lambda h, s, v: s >= .3 and v > .75 and hue_in(h, 285, 345), tint(186, smul=1.1, val=1.05)),
                   (HUE(250, 345, .1), tint(205, smul=.55, val=.9))],
    },
    # 番人（原画：紫の外套・金の冠と縁・黄色の目・青白い霊の手）
    'banjin': {
        'boss3': [(HUE(40, 70, .45), tint(2, smul=1, val=1.0)),
                  (HUE(240, 320, .12), tint(38, smul=.7, val=1.12)), (HUE(15, 45, .3), tint(36, smul=.55, val=1.15))],
    },
}

# ---------- 影抜き（足元の灰色の楕円） ----------
def drop_shadow(rgb, a):
    h = a.shape[0]
    mx, mn = rgb.max(2), rgb.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    rows = np.arange(h)[:, None]
    sh = (rows >= h * .86) & (sat < .25) & (mx > 110)
    a = a * ~sh
    l3, n3 = nd.label(a > 0)
    if n3 > 1:
        s3 = nd.sum(a > 0, l3, range(1, n3 + 1))
        a = a * np.isin(l3, [k + 1 for k, v in enumerate(s3) if v >= s3.max() * .003])
    ys, xs = np.where(a > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]


def pack_frames(tiles, pal):
    Wt = sum(t[1].shape[1] + 1 for t in tiles)
    Ht = max(t[1].shape[0] for t in tiles)
    big = np.zeros((Ht, Wt), np.int32)
    fr, x = {}, 0
    for nm, idx, ax, ay in tiles:
        h, w = idx.shape
        big[:h, x:x + w] = idx
        fr[nm] = [x, 0, w, h, ax, ay]
        x += w + 1
    return png_of(big, pal), fr


# ---------- 作成 ----------
data = {}
prev = []
CHARS = []
for src in SOURCES:
    fname, chars, opt = src if len(src) == 3 else (*src, {})
    n_fig = sum(len(C.get('views', ['idle'])) for C in chars)
    crops = load_source(fname, n_fig, **opt)
    k = 0
    for C in chars:
        C['frames'] = {}
        for vn in C.get('views', ['idle']):
            cr = crops[k]
            k += 1
            if C.get('shadow'):
                cr = drop_shadow(*cr)
            if vn != 'skip':
                C['frames'][vn] = cr
        if C['frames']:
            CHARS.append(C)
for C in CHARS:
    rgb0, a0 = C['frames']['idle']
    hh, ww = a0.shape
    # パレット：原画の 1 ドット相当（1/3）に縮めた絵から（全ての向きの絵をまとめて）
    px = []
    for r_, a_ in C['frames'].values():
        col, m = shrink(r_, a_, max(8, round(a_.shape[1] / 3)))
        px.append(col[m])
    px = np.vstack(px)
    sub = px if len(px) <= 12000 else px[np.random.default_rng(2).choice(len(px), 12000, replace=False)]
    pal = kmeans(sub, C['ncol'] - 1)
    # 最も暗い色を最後に（輪郭。試練・虚蝕化の色替えで変えない色）
    order = sorted(range(len(pal)), key=lambda i: -lum(pal[i]))
    pal = np.vstack([pal[order], [[min(px[:, 0].min(), 14), min(px[:, 1].min(), 10), min(px[:, 2].min(), 18)]]])
    sizes = {}
    zw = max(8, int(C['z'] * min(1, ww / hh)) - 1)  # 図鑑：縦横とも 46 に収める（キー名は z46 のまま）
    plist = [('b%d' % w, w) for w in C['b']] + [('f%d' % C['f'], C['f']), ('z%d' % C['z'], zw), ('u%d' % C['u'], C['u'])]
    for sk, w in plist:
        ks = w / ww
        tiles = []
        for vn, (r_, a_) in C['frames'].items():
            if sk[0] in 'fz' and vn != 'idle':
                continue
            col, m = shrink(r_, a_, max(4, round(a_.shape[1] * ks)))
            if w <= 48:   # 小さいサイズ：本体から離れた小さな粒（泡・火の粉）は 1〜2 ドットの点になって汚れるので落とす
                l3, n3 = nd.label(m)
                if n3 > 1:
                    s3 = nd.sum(m, l3, range(1, n3 + 1))
                    m = np.isin(l3, [q + 1 for q, v in enumerate(s3) if v >= max(5, s3.max() * .01)])
            idx = to_pal_idx(col, m, pal)
            if w <= 48:   # 小さいサイズは輪郭を最暗色でなぞる（背景に溶けないように）
                edge = m & ~nd.binary_erosion(m)
                idx[edge & (idx > 0)] = np.where(
                    np.array([lum(pal[i - 1]) for i in idx[edge & (idx > 0)]]) < 70, idx[edge & (idx > 0)], len(pal))
            ax, ay = anchor(m)
            tiles.append((vn, idx, ax, ay))
        png, fr = pack_frames(tiles, pal)
        sizes[sk] = {'k': round(ks, 5), 'dots': w, 'png': png, 'frames': fr}
        if sk.startswith('b') and w in (C['b'][len(C['b']) // 2], C['b'][-1]):
            prev.append((C['id'], sk, tiles[0][1], pal))
    vars_ = {}
    for vn, rules in VARS.get(C['id'], {}).items():
        mp = rule_map(pal[:-1], rules)
        vars_[vn] = [hexs(c) for c in mp] + [hexs(pal[-1])]
    data[C['id']] = {'face': C['face'], 'kind': 'mon', 'pal': [hexs(c) for c in pal], 'sizes': sizes}
    if vars_:
        data[C['id']]['vars'] = vars_
    print(C['id'], 'crop', ww, hh, 'sizes', list(sizes), 'views', list(C['frames']), 'vars', list(vars_))

with open(OUT, 'w') as f:
    f.write('/* 自動生成：tools/build_spx_enemies.py（提供原画 assets_src/originals/enemies_*.jpg）。手で編集しない */\n')
    f.write('Object.assign(SPX_DATA,' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ');\n')
print('wrote', OUT, os.path.getsize(OUT))

if PREVIEW:
    from PIL import ImageDraw
    tiles = []
    for cid, sk, idx, pal in prev:
        variants = [('', [hexs(c) for c in pal])] + list(data[cid].get('vars', {}).items())
        for vn, vp in variants:
            P = np.array([[0, 0, 0]] + [[int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)] for h in vp], np.uint8)
            rgba = np.concatenate([P[idx], (idx > 0)[:, :, None].astype(np.uint8) * 255], 2)
            tiles.append((f'{cid}{(":" + vn) if vn else ""} {sk}', Image.fromarray(rgba, 'RGBA')))
    big = [t for t in tiles if t[0].endswith(tuple('b%d' % C['b'][-1] for C in CHARS))]
    mid = [t for t in tiles if t not in big]
    for nm, ts in (('mid', mid), ('big', big)):
        cols = 7
        cw = max(t.width for _, t in ts) + 8
        ch = max(t.height for _, t in ts) + 14
        rows = (len(ts) + cols - 1) // cols
        Cv = Image.new('RGBA', (cw * cols, ch * rows), (40, 36, 60, 255))
        d = ImageDraw.Draw(Cv)
        for i, (n_, t) in enumerate(ts):
            x, y = (i % cols) * cw, (i // cols) * ch
            Cv.alpha_composite(t, (x + 4, y + 12))
            d.text((x + 2, y), n_, fill='yellow')
        Cv = Cv.resize((Cv.width * 2, Cv.height * 2), Image.NEAREST)
        Cv.save(PREVIEW.replace('.png', f'_{nm}.png'))
