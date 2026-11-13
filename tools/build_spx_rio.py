#!/usr/bin/env python3
"""リオの原画シート（assets_src/originals/rio_sheet.png）→ js/spx-data-rio.js

シートは 3 段に、ラベル（文字）の下へポーズが並ぶ。ラベルとポーズは別の連結成分なので、
各ポーズの枠の中で最大の成分（＋その近くの小さな破片）だけを拾い、文字ときらめきは捨てる。
・大きさ：「正面」の背丈を各サイズのドット数にそろえ、全ポーズを同じ倍率で縮める（ポーズ間で体格がぶれない）
・足元（ax, ay）：最下段の行の不透明画素の中央値。倒れた姿だけは横幅の中央
・顔（heads）：「正面」の頭まわりを正方形に切り出して 20／22／48 ドットに
・覚醒した姿は別データ rio_K（spx.js が星臨中に使う）。倒れた姿の星臨配色（palAw）も作る
使い方：python3 tools/build_spx_rio.py [プレビュー.png]
"""
import colorsys, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spx_common import shrink, kmeans, lum, to_pal_idx, png_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets_src', 'originals', 'rio_sheet.png')
OUT = os.path.join(ROOT, 'js', 'spx-data-rio.js')
PREVIEW = sys.argv[1] if len(sys.argv) > 1 else None

# ポーズ名 → シート上の枠（x0, x1, y0, y1）。枠は成分の中心で判定する
CELLS = {
    'stance': (0, 240, 55, 290), 'front': (240, 500, 55, 290), 'back': (500, 720, 55, 290),
    'lunge': (720, 1030, 55, 290), 'guard': (1030, 1264, 55, 290),
    'walk_a': (0, 230, 335, 575), 'dash': (230, 500, 335, 575), 'cast': (500, 760, 335, 575),
    'hit': (760, 1000, 335, 575), 'weak': (1000, 1264, 335, 575),
    'win': (0, 470, 590, 848), 'down': (470, 780, 590, 848), 'awk': (780, 1264, 590, 848),
}
# 原画で右を向いているポーズ（左右反転して、すべて左＝敵の側を向かせる）
FLIP = set()
BATTLE = ['front', 'stance', 'lunge', 'dash', 'down', 'cast', 'hit', 'weak', 'guard', 'win']
FIELD = ['stand', 'walk_a', 'front', 'win', 'stance', 'lunge', 'cast', 'hit', 'weak', 'guard', 'dash', 'down', 'back']
ALIASF = {'stand': 'stance'}
SIZES = [('b42', 42), ('b48', 48), ('b54', 54), ('b60', 60), ('b66', 66), ('B84', 84), ('B104', 104), ('f34', 34), ('u36', 36)]

img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64)
dist = (255 - img).max(2)
lab, n = nd.label(dist <= 24)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fg = ~np.isin(lab, list(border))
for i, (s_, o_) in enumerate(zip(nd.sum(np.ones_like(dist), lab, range(1, n + 1)), nd.find_objects(lab))):
    if i + 1 in border:
        continue
    if s_ >= 250 or (s_ >= 60 and dist[o_][lab[o_] == i + 1].mean() < 5):
        fg[lab == i + 1] = False
lab2, n2 = nd.label(fg)
sizes = nd.sum(fg, lab2, range(1, n2 + 1))
objs = nd.find_objects(lab2)


def cell(name):
    x0, x1, y0, y1 = CELLS[name]
    cand = []
    for i, o in enumerate(objs):
        cy, cx = (o[0].start + o[0].stop) / 2, (o[1].start + o[1].stop) / 2
        if x0 <= cx < x1 and y0 <= cy < y1:
            cand.append((sizes[i], i + 1, o))
    cand.sort(key=lambda c: -c[0])
    s0, main, mo = cand[0]
    pad = 4
    keep = [main]
    for s_, li, o in cand[1:]:   # 本体の枠の内側にある破片（剣先・髪先など）だけ残す。外のきらめきは捨てる
        if (o[0].start >= mo[0].start - pad and o[0].stop <= mo[0].stop + pad and
                o[1].start >= mo[1].start - pad and o[1].stop <= mo[1].stop + pad and s_ >= 12):
            keep.append(li)
    m = np.isin(lab2, keep)
    ys, xs = np.where(m)
    yy0, yy1, xx0, xx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb, a = img[yy0:yy1, xx0:xx1], m[yy0:yy1, xx0:xx1].astype(np.float64)
    if name in FLIP:
        rgb, a = rgb[:, ::-1], a[:, ::-1]
    return rgb, a


SRCF = {k: cell(k) for k in CELLS}
H_FRONT = SRCF['front'][1].shape[0]


def foot(m, name):
    ys, xs = np.where(m)
    ay = int(ys.max())
    if name == 'down':
        return int(round((xs.min() + xs.max()) / 2)), ay
    low = xs[ys >= ay - max(2, m.shape[0] // 8)]
    return int(round(np.median(low))), ay


def head_crop(rgb, a):
    ys, xs = np.where(a > 0)
    top = ys.min()
    L = int(round(H_FRONT * .37))
    band = xs[(ys >= top) & (ys < top + int(L * .85))]
    cx = int(round(np.median(band)))
    x0 = max(0, cx - L // 2)
    y0 = max(0, top - int(L * .03))
    H, W = a.shape
    pr = np.zeros((L, L, 3))
    pa = np.zeros((L, L))
    sub_r = rgb[y0:y0 + L, x0:x0 + L]
    sub_a = a[y0:y0 + L, x0:x0 + L]
    pr[:sub_r.shape[0], :sub_r.shape[1]] = sub_r
    pa[:sub_a.shape[0], :sub_a.shape[1]] = sub_a
    return pr, pa


def make_pal(names, ncol):
    px = []
    for nm in names:
        r, a = SRCF[nm]
        col, m = shrink(r, a, max(8, round(a.shape[1] * 104 / H_FRONT)))
        px.append(col[m])
    px = np.vstack(px)
    sub = px[np.random.default_rng(3).choice(len(px), min(len(px), 9000), replace=False)]
    pal = kmeans(sub, ncol - 1)
    order = sorted(range(len(pal)), key=lambda i: -lum(pal[i]))
    dark = [min(px[:, 0].min(), 14), min(px[:, 1].min(), 10), min(px[:, 2].min(), 18)]
    return np.vstack([pal[order], [dark]])


hexs = lambda c: '#%02x%02x%02x' % tuple(int(max(0, min(255, round(v)))) for v in c)


def atlas(frames, pal, dots, kscale):
    tiles = []
    for nm, src in frames:
        r, a = SRCF[src]
        w = max(4, round(a.shape[1] * kscale))
        col, m = shrink(r, a, w)
        idx = to_pal_idx(col, m, pal)
        if dots <= 36:   # 小さいサイズは輪郭を最暗色でなぞる
            edge = m & ~nd.binary_erosion(m)
            dk = np.array([lum(pal[i - 1]) for i in range(1, len(pal) + 1)])
            e = edge & (idx > 0)
            idx[e] = np.where(dk[idx[e] - 1] < 70, idx[e], len(pal))
        ax, ay = foot(m, src)
        tiles.append((nm, idx, ax, ay))
    Wt = sum(t[1].shape[1] + 1 for t in tiles)
    Ht = max(t[1].shape[0] for t in tiles)
    big = np.zeros((Ht, Wt), np.int32)
    fr = {}
    x = 0
    for nm, idx, ax, ay in tiles:
        h, w = idx.shape
        big[:h, x:x + w] = idx
        fr[nm] = [x, 0, w, h, ax, ay]
        x += w + 1
    return {'png': png_of(big, pal), 'frames': fr}, tiles


def heads_of(src, pal):
    r, a = head_crop(*SRCF[src])
    tiles, x, fr = [], 0, {}
    for nn in (20, 22, 48):
        col, m = shrink(r, a, nn)
        idx = to_pal_idx(col, m, pal)
        tiles.append((nn, idx))
    Wt = sum(t[1].shape[1] + 1 for t in tiles)
    big = np.zeros((48, Wt), np.int32)
    for nn, idx in tiles:
        h, w = idx.shape
        big[:h, x:x + w] = idx
        fr[str(nn)] = [x, 0, w, h, 0, 0]
        x += w + 1
    return {'png': png_of(big, pal), 'frames': fr}


# ---------- 通常の姿 ----------
pal = make_pal([k for k in CELLS if k != 'awk'], 32)
rio = {'face': 'L', 'kind': 'hum', 'pal': [hexs(c) for c in pal], 'sizes': {}}
prev = []
for sk, dots in SIZES:
    ks = dots / H_FRONT
    names = FIELD if sk[0] == 'f' else BATTLE
    S, tiles = atlas([(nm, ALIASF.get(nm, nm)) for nm in names], pal, dots, ks)
    S.update({'k': round(ks, 5), 'dots': dots})
    rio['sizes'][sk] = S
    if sk in ('b66', 'f34'):
        prev.append((sk, tiles, pal))
rio['heads'] = heads_of('front', pal)


# 星臨の配色（倒れた姿だけ通常の絵を使うため）：青い外套を白金に、他は少し明るく
def aw_col(c):
    h, s, v = colorsys.rgb_to_hsv(*(np.array(c) / 255))
    if s > .2 and .53 <= h <= .72:
        h, s, v = 46 / 360, s * .35, min(1, v * 1.35 + .12)
    elif s > .25 and (h < .14 or h > .9):
        h, s, v = 45 / 360, s * .8, min(1, v * 1.15)
    else:
        v = min(1, v * 1.08)
    return np.array(colorsys.hsv_to_rgb(h, s, v)) * 255


rio['palAw'] = [hexs(aw_col(c)) for c in pal[:-1]] + [hexs(pal[-1])]

# ---------- 覚醒した姿（rio_K） ----------
palK = make_pal(['awk'], 32)
rioK = {'face': 'L', 'kind': 'hum', 'pal': [hexs(c) for c in palK], 'sizes': {}}
for sk, dots in SIZES:
    if sk[0] == 'f':
        continue
    ks = dots / H_FRONT
    S, tiles = atlas([('awk', 'awk')], palK, dots, ks)
    S.update({'k': round(ks, 5), 'dots': dots})
    rioK['sizes'][sk] = S
    if sk == 'b66':
        prev.append(('K' + sk, tiles, palK))
rioK['heads'] = heads_of('awk', palK)

with open(OUT, 'w') as f:
    f.write('/* 自動生成：tools/build_spx_rio.py（提供原画 assets_src/originals/rio_sheet.png）。手で編集しない */\n')
    f.write('Object.assign(SPX_DATA,' + json.dumps({'rio': rio, 'rio_K': rioK}, separators=(',', ':'), ensure_ascii=False) + ');\n')
print('wrote', OUT, os.path.getsize(OUT))

if PREVIEW:
    from PIL import ImageDraw
    rows = []
    for sk, tiles, pl in prev:
        P = np.array([[0, 0, 0]] + [list(c) for c in pl], np.float64).clip(0, 255).astype(np.uint8)
        rows.append((sk, [(nm, Image.fromarray(np.concatenate([P[idx], (idx > 0)[:, :, None].astype(np.uint8) * 255], 2), 'RGBA'), ax, ay)
                          for nm, idx, ax, ay in tiles]))
    W = max(sum(t.width + 8 for _, t, _, _ in ts) for _, ts in rows) + 8
    H = sum(max(t.height for _, t, _, _ in ts) + 16 for _, ts in rows)
    C = Image.new('RGBA', (W, H), (60, 56, 84, 255))
    d = ImageDraw.Draw(C)
    y = 0
    for sk, ts in rows:
        x = 4
        mh = max(t.height for _, t, _, _ in ts)
        for nm, t, ax, ay in ts:
            C.alpha_composite(t, (x, y + 14))
            d.text((x, y), nm[:6], fill='yellow')
            d.point((x + ax, y + 14 + ay + 1), fill='red')
            x += t.width + 8
        y += mh + 16
    C.resize((C.width * 3, C.height * 3), Image.NEAREST).save(PREVIEW)
