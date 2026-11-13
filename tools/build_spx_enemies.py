#!/usr/bin/env python3
"""提供原画（敵）→ js/spx-data-enemy.js

assets_src/originals/enemies_set1.jpg（白背景に 4 体：スライム／騎士／ゴーレム／番人）から、
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
SRC = os.path.join(ROOT, 'assets_src', 'originals', 'enemies_set1.jpg')
OUT = os.path.join(ROOT, 'js', 'spx-data-enemy.js')
PREVIEW = sys.argv[1] if len(sys.argv) > 1 else None

# ---------- キャラ定義 ----------
# order：原画の左から。face：原画の向き（L＝左向き／正面）。sizes：横幅のドット数
CHARS = [
    dict(id='slime',  face='L', ncol=34,
         b=[40, 46, 52, 58, 66, 74, 84, 96], f=24, z=46, u=56),
    dict(id='knight', face='L', ncol=38,
         b=[34, 38, 42, 48, 54, 60, 68, 78, 90], f=22, z=46, u=48),
    dict(id='golem',  face='L', ncol=38,
         b=[46, 52, 58, 66, 74, 84, 96, 110, 126, 144, 164], f=40, z=46, u=56),
    dict(id='banjin', face='L', ncol=36,
         b=[36, 42, 48, 56, 64, 72, 82, 94, 108], f=28, z=46, u=48),
]

# ---------- 読み込み・背景抜き ----------
img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64)
H0, W0, _ = img.shape
dist = (255 - img).max(2)
lab, n = nd.label(dist <= 28)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fg = ~np.isin(lab, list(border))
# 体に囲まれた背景（腕と胴のすき間など）：広い、または真っ白な白の島も背景にする。小さいハイライトは残す
for i, (s_, o_) in enumerate(zip(nd.sum(np.ones_like(dist), lab, range(1, n + 1)), nd.find_objects(lab))):
    if i + 1 in border:
        continue
    mdist = dist[o_][lab[o_] == i + 1].mean()
    if s_ >= 300 or (s_ >= 80 and mdist < 6):
        fg[lab == i + 1] = False
fg = nd.binary_opening(fg, iterations=1)          # JPEG の縁のにじみ（1 画素の白っぽい輪）を落とす
fg = nd.binary_erosion(fg, iterations=1) | (fg & (dist > 120))
lab2, n2 = nd.label(fg)
sizes = nd.sum(fg, lab2, range(1, n2 + 1))
objs = nd.find_objects(lab2)
comps = [(i + 1, s, o) for i, (s, o) in enumerate(zip(sizes, objs)) if s >= 25]
bodies = sorted([c for c in comps if c[1] > 20000], key=lambda c: c[2][1].start)
assert len(bodies) == len(CHARS), f'本体の数が合わない: {len(bodies)}'
owner = {}
for li, s, o in comps:
    cx = (o[1].start + o[1].stop) / 2
    best = min(range(len(bodies)), key=lambda k: abs(cx - (bodies[k][2][1].start + bodies[k][2][1].stop) / 2)
               if not (bodies[k][2][1].start <= cx < bodies[k][2][1].stop) else -1)
    owner[li] = best


def crop(k):
    ids = [li for li, b in owner.items() if b == k]
    m = np.isin(lab2, ids)
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return img[y0:y1, x0:x1], m[y0:y1, x0:x1].astype(np.float64)


# ---------- 縮小（不透明度で重み付けした面積平均） ----------
def shrink(rgb, a, w):
    h0, w0 = a.shape
    h = max(1, round(h0 * w / w0))
    A = Image.fromarray(a.astype(np.float32), 'F').resize((w, h), Image.BOX)
    al = np.asarray(A)
    ch = []
    for c in range(3):
        P = Image.fromarray((rgb[:, :, c] * a).astype(np.float32), 'F').resize((w, h), Image.BOX)
        ch.append(np.asarray(P))
    col = np.stack(ch, 2) / np.maximum(al, 1e-6)[:, :, None]
    if w < w0 / 3.2:   # 原画のドットより細かく縮めるときは、輪郭と陰影が眠くならないよう少しだけ締める
        blur = nd.uniform_filter(col, size=(3, 3, 1))
        col = np.clip(col + (col - blur) * .35, 0, 255)
    return col, al >= .5


# ---------- パレット（k-means） ----------
def kmeans(px, k, it=30, seed=1):
    rng = np.random.default_rng(seed)
    # k-means++ 初期化
    c = [px[rng.integers(len(px))]]
    for _ in range(k - 1):
        d = np.min(((px[:, None, :] - np.array(c)[None]) ** 2).sum(2), 1)
        c.append(px[rng.choice(len(px), p=d / d.sum())])
    c = np.array(c)
    for _ in range(it):
        lbl = np.argmin(((px[:, None, :] - c[None]) ** 2).sum(2), 1)
        for j in range(k):
            s = px[lbl == j]
            if len(s):
                c[j] = s.mean(0)
    return c


def lum(c):
    return c[0] * .3 + c[1] * .59 + c[2] * .11


def to_pal_idx(col, m, pal):
    px = col[m]
    lbl = np.argmin(((px[:, None, :] - pal[None]) ** 2).sum(2), 1)
    idx = np.zeros(m.shape, np.int32)
    idx[m] = lbl + 1           # 0 = 透明
    return idx


def png_of(idx, pal):
    h, w = idx.shape
    im = Image.new('P', (w, h))
    flat = [0, 0, 0] + [int(round(v)) for c in pal for v in c]
    im.putpalette(flat + [0] * (768 - len(flat)))
    im.putdata(idx.flatten().tolist())
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True, transparency=0)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def anchor(m):
    ys, xs = np.where(m)
    ay = ys.max()
    low = xs[ys >= ay - max(2, m.shape[0] // 10)]
    return int(round((low.min() + low.max()) / 2)), int(ay)


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
    # 番人（原画：紫の外套・金の冠と縁・黄色の目・青白い霊の手）
    'banjin': {
        'boss3': [(HUE(40, 70, .45), tint(2, smul=1, val=1.0)),
                  (HUE(240, 320, .12), tint(38, smul=.7, val=1.12)), (HUE(15, 45, .3), tint(36, smul=.55, val=1.15))],
    },
}

# ---------- 作成 ----------
data = {}
prev = []
for k, C in enumerate(CHARS):
    rgb0, a0 = crop(k)
    hh, ww = a0.shape
    # パレット：原画の 1 ドット相当（1/3）に縮めた絵から
    nat = max(8, round(ww / 3))
    col, m = shrink(rgb0, a0, nat)
    px = col[m]
    pal = kmeans(px, C['ncol'] - 1)
    # 最も暗い色を最後に（輪郭。試練・虚蝕化の色替えで変えない色）
    order = sorted(range(len(pal)), key=lambda i: -lum(pal[i]))
    pal = np.vstack([pal[order], [[min(px[:, 0].min(), 14), min(px[:, 1].min(), 10), min(px[:, 2].min(), 18)]]])
    sizes = {}
    zw = max(8, round(C['z'] * min(1, ww / hh)))  # 図鑑：縦横とも 46 に収める（キー名は z46 のまま）
    plist = [('b%d' % w, w) for w in C['b']] + [('f%d' % C['f'], C['f']), ('z%d' % C['z'], zw), ('u%d' % C['u'], C['u'])]
    for sk, w in plist:
        col, m = shrink(rgb0, a0, w)
        # 小さいサイズは輪郭を最暗色でなぞる（背景に溶けないように）
        idx = to_pal_idx(col, m, pal)
        if w <= 48:
            edge = m & ~nd.binary_erosion(m)
            idx[edge & (idx > 0)] = np.where(
                np.array([lum(pal[i - 1]) for i in idx[edge & (idx > 0)]]) < 70, idx[edge & (idx > 0)], len(pal))
        ax, ay = anchor(m)
        h, wd = idx.shape
        sizes[sk] = {'k': round(w / ww, 5), 'dots': w, 'png': png_of(idx, pal), 'frames': {'idle': [0, 0, wd, h, ax, ay]}}
        if sk.startswith('b') and w in (C['b'][len(C['b']) // 2], C['b'][-1]):
            prev.append((C['id'], sk, idx, pal))
    vars_ = {}
    for vn, rules in VARS.get(C['id'], {}).items():
        mp = rule_map(pal[:-1], rules)
        vars_[vn] = [hexs(c) for c in mp] + [hexs(pal[-1])]
    data[C['id']] = {'face': C['face'], 'kind': 'mon', 'pal': [hexs(c) for c in pal], 'sizes': sizes}
    if vars_:
        data[C['id']]['vars'] = vars_
    print(C['id'], 'crop', ww, hh, 'sizes', list(sizes), 'vars', list(vars_))

with open(OUT, 'w') as f:
    f.write('/* 自動生成：tools/build_spx_enemies.py（提供原画 assets_src/originals/enemies_set1.jpg）。手で編集しない */\n')
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
