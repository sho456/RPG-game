#!/usr/bin/env python3
"""味方の原画 → js/spx-data-heroes.js（spx-data.js の同じキャラを上書きする）

・rio・celes・gald・mire・hakua・noah・erna・valk（2026-11 の新原画）：正面・待機・星臨を横に 3 体並べたシート（<id>_v2.jpg）。from_trio で切り出す。
  待機・星臨は原画で右を向いているので反転して左向きに。正面は原画のまま。
  戦闘不能は待機を寝かせて作り、他のポーズ（攻撃・詠唱・被弾…）は 1 枚絵（single）として spx.js が待機の絵を動かす
・jin：1 枚絵（jin.jpg）。待機・正面に使い、他のポーズは spx.js が 1 枚絵を動かして表す。戦闘不能は体を寝かせ、柴犬は座らせたまま
・jin_K：既存データの調整。原画（柴犬の相棒）に合わせ、相棒の獣の毛並みを橙と白に
・rio の色違い last3（虚神ノクス）も作る
大きさは「正面」の背丈を各サイズのドット数にそろえ、全ポーズを同じ倍率で縮める。
足元（ax, ay）は最下段付近の不透明画素の中央値（倒れた姿は横幅の中央）。
使い方：python3 tools/build_spx_heroes.py [プレビュー.png]
"""
import base64, colorsys, io, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spx_common import shrink, kmeans, lum, to_pal_idx, png_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = lambda n: os.path.join(ROOT, 'assets_src', 'originals', n)
OUT = os.path.join(ROOT, 'js', 'sprite', 'data', 'spx-data-heroes.js')
PREVIEW = sys.argv[1] if len(sys.argv) > 1 else None

BATTLE = ['front', 'stance', 'ready', 'lunge', 'dash', 'down', 'cast', 'hit', 'weak', 'guard', 'win', 'back']   # back：ver0.29 図鑑の回転表示用
FIELD = ['stand', 'walk_a', 'front', 'win', 'stance', 'lunge', 'cast', 'hit', 'weak', 'guard', 'dash', 'down', 'back']
ALIASF = {'stand': 'stance'}
SIZES = [('b42', 42), ('b48', 48), ('b54', 54), ('b60', 60), ('b66', 66), ('B84', 84), ('B104', 104), ('f34', 34), ('u36', 36)]
hexs = lambda c: '#%02x%02x%02x' % tuple(int(max(0, min(255, round(v)))) for v in c)


# ---------- 背景抜き ----------
def fg_mask(img, thr=24, bg=None, hole=None, ring=0):
    """bg：背景色（既定は白）。単色背景のシートなら四隅・外周の中央値を渡す。
    hole：内側の背景色の穴（腕と胴のすき間など）とみなす平均の色差。既定は従来の判定（大きい穴はすべて抜く）。
    指定すると、背景にごく近い色の穴だけを抜く（白い刃・暗い影など、背景に近いが絵の一部の所を残す）。
    ring：穴の周り（3 画素の輪）の背景との平均の色差の下限。本当のすき間は輪郭線（濃い色）に囲まれ、
    刃や鎧の光沢は明るい色に囲まれるので、明るい背景ではこれで見分ける"""
    dist = (255 - img).max(2) if bg is None else np.abs(img - np.asarray(bg, np.float64)).max(2)
    lab, n = nd.label(dist <= thr)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ~np.isin(lab, list(border))
    for i, (s_, o_) in enumerate(zip(nd.sum(np.ones_like(dist), lab, range(1, n + 1)), nd.find_objects(lab))):
        if i + 1 in border:
            continue
        md = dist[o_][lab[o_] == i + 1].mean()
        if hole is not None and s_ >= 60 and md < hole and ring:
            sl = tuple(slice(max(0, q.start - 4), q.stop + 4) for q in o_)
            me = lab[sl] == i + 1
            md = md if dist[sl][nd.binary_dilation(me, iterations=3) & ~me].mean() > ring else 1e9
        if (hole is None and (s_ >= 250 or (s_ >= 60 and md < 5))) or (hole is not None and s_ >= 60 and md < hole):
            fg[lab == i + 1] = False
    if thr > 24:   # JPEG：縁のにじみを落とす
        fg = nd.binary_opening(fg, iterations=1)
        fg = nd.binary_erosion(fg, iterations=1) | (fg & (dist > 120))
    return fg


def pieces(fg, main_label, lab2, objs, sizes, pad=4, inside=None, small=12):
    mo = objs[main_label - 1]
    keep = [main_label]
    for i, o in enumerate(objs):
        if i + 1 == main_label or sizes[i] < small:
            continue
        if inside and not inside(o):   # 枠の外に中心がある成分（ラベルの文字など）は拾わない
            continue
        if (o[0].start >= mo[0].start - pad and o[0].stop <= mo[0].stop + pad and
                o[1].start >= mo[1].start - pad and o[1].stop <= mo[1].stop + pad):
            keep.append(i + 1)
    return np.isin(lab2, keep)


def crop_of(img, m):
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return img[y0:y1, x0:x1].copy(), m[y0:y1, x0:x1].astype(np.float64)


# ---------- 原画からポーズを切り出す ----------
def from_cells(fname, cells):
    img = np.asarray(Image.open(ORIG(fname)).convert('RGB')).astype(np.float64)
    fg = fg_mask(img)
    lab2, _ = nd.label(fg)
    objs = nd.find_objects(lab2)
    sizes = nd.sum(fg, lab2, range(1, len(objs) + 1))
    out = {}
    for name, (x0, x1, y0, y1) in cells.items():
        cand = [(sizes[i], i + 1) for i, o in enumerate(objs)
                if x0 <= (o[1].start + o[1].stop) / 2 < x1 and y0 <= (o[0].start + o[0].stop) / 2 < y1]
        main = max(cand)[1]
        ins = lambda o, x0=x0, x1=x1, y0=y0, y1=y1: x0 <= (o[1].start + o[1].stop) / 2 < x1 and y0 <= (o[0].start + o[0].stop) / 2 < y1
        out[name] = crop_of(img, pieces(fg, main, lab2, objs, sizes, inside=ins))
    return out


def from_auto(fname, names, rows, split=None):
    """大きな成分を行（rows：行の境の y）ごとに左から並べ、names に割り当てる。split：{名前:(x, 左の名前, 右の名前)} で 1 成分を 2 つに分ける"""
    img = np.asarray(Image.open(ORIG(fname)).convert('RGB')).astype(np.float64)
    fg = fg_mask(img, 28)
    lab2, _ = nd.label(fg)
    objs = nd.find_objects(lab2)
    sizes = nd.sum(fg, lab2, range(1, len(objs) + 1))
    big = [i + 1 for i in range(len(objs)) if sizes[i] > 1500]
    row = lambda li: sum((objs[li - 1][0].start + objs[li - 1][0].stop) / 2 > r for r in rows)
    big.sort(key=lambda li: (row(li), objs[li - 1][1].start))
    assert len(big) == len(names), (len(big), len(names))
    out = {}
    for li, name in zip(big, names):
        m = pieces(fg, li, lab2, objs, sizes)
        if split and name in split:
            sx, ln, rn = split[name]
            xs = np.arange(m.shape[1])[None, :]
            for nm, mm in ((ln, m & (xs < sx)), (rn, m & (xs >= sx))):
                l3, _ = nd.label(mm)
                if nm and l3.max():
                    s3 = nd.sum(mm, l3, range(1, l3.max() + 1))
                    keep = [i + 1 for i, v in enumerate(s3) if v >= max(12, s3.max() * .004)]
                    out[nm] = crop_of(img, np.isin(l3, keep))
        else:
            out[name] = crop_of(img, m)
    return out


def from_trio(fname, names=('front', 'stance', 'awk'), band=(.2, .85), thr=30, hole=10, ring=150, erase=None):
    """正面・待機・星臨を横に 3 体並べたシート（<id>_v2.jpg）。背景は外周の中央値の単色。
    ラベル（上下の文字・枠）は高さの帯 band の外にあるので拾わない。帯の中の大きい成分を左から names に割り当てる。
    erase：(X, Y) → 消す所の真偽。原画に紛れ込んだ余計な絵（ガルドの正面の横の小さな騎士）を消す"""
    img = np.asarray(Image.open(ORIG(fname)).convert('RGB')).astype(np.float64)
    bg = np.median(np.concatenate([img[0], img[-1], img[:, 0], img[:, -1]]), 0)
    fg = fg_mask(img, thr, bg, hole, ring)
    if erase is not None:
        Y, X = np.mgrid[:fg.shape[0], :fg.shape[1]]
        fg &= ~erase(X, Y)
    lab2, _ = nd.label(fg)
    objs = nd.find_objects(lab2)
    sizes = nd.sum(fg, lab2, range(1, len(objs) + 1))
    H = img.shape[0]
    cand = [i + 1 for i, o in enumerate(objs) if band[0] * H < (o[0].start + o[0].stop) / 2 < band[1] * H]
    big = sorted(sorted(cand, key=lambda li: -sizes[li - 1])[:len(names)], key=lambda li: objs[li - 1][1].start)
    return {nm: crop_of(img, pieces(fg, li, lab2, objs, sizes, pad=6, small=40)) for li, nm in zip(big, names)}


def lay_down(c):
    """待機の絵を寝かせて戦闘不能にする（頭が左＝敵の側）"""
    return np.rot90(c[0], 1).copy(), np.rot90(c[1], 1).copy()


def flip(c):
    return c[0][:, ::-1].copy(), c[1][:, ::-1].copy()


# ---------- 足元・頭 ----------
def foot(m, name):
    ys, xs = np.where(m)
    ay = int(ys.max())
    if name == 'down':
        return int(round((xs.min() + xs.max()) / 2)), ay
    low = xs[ys >= ay - max(2, m.shape[0] // 8)]
    return int(round(np.median(low))), ay


def head_crop(rgb, a, L, skip=0.0, at=None):
    """skip：上端から飛ばす割合（背の高い帽子・羽飾りの分。顔が枠に入るように）。
    at：(中心の x, 上端の y) を絵の幅・高さに対する割合で直接指定（杖・弓・光輪が頭より上や横に出ている絵）"""
    ys, xs = np.where(a > 0)
    if at:
        cx, top = int(round(at[0] * a.shape[1])), int(round(at[1] * a.shape[0]))
    else:
        top = ys.min() + int(a.shape[0] * skip)
        band = xs[(ys >= top) & (ys < top + int(L * .85))]
        cx = int(round(np.median(band)))
    x0 = max(0, cx - L // 2)
    y0 = max(0, top - int(L * .03))
    pr, pa = np.zeros((L, L, 3)), np.zeros((L, L))
    sr, sa = rgb[y0:y0 + L, x0:x0 + L], a[y0:y0 + L, x0:x0 + L]
    pr[:sr.shape[0], :sr.shape[1]] = sr
    pa[:sa.shape[0], :sa.shape[1]] = sa
    return pr, pa


# ---------- パレット・アトラス ----------
def make_pal(srcs, ref_h, ncol=32):
    px = []
    for r, a in srcs:
        col, m = shrink(r, a, max(8, round(a.shape[1] * 104 / ref_h)))
        px.append(col[m])
    px = np.vstack(px)
    sub = px[np.random.default_rng(3).choice(len(px), min(len(px), 9000), replace=False)]
    pal = kmeans(sub, ncol - 1)
    order = sorted(range(len(pal)), key=lambda i: -lum(pal[i]))
    dark = [min(px[:, 0].min(), 14), min(px[:, 1].min(), 10), min(px[:, 2].min(), 18)]
    return np.vstack([pal[order], [dark]])


def pack(tiles, pal):
    Wt = sum(t[1].shape[1] + 1 for t in tiles)
    Ht = max(t[1].shape[0] for t in tiles)
    big = np.zeros((Ht, Wt), np.int32)
    fr, x = {}, 0
    for nm, idx, ax, ay in tiles:
        h, w = idx.shape
        big[:h, x:x + w] = idx
        fr[nm] = [x, 0, w, h, ax, ay]
        x += w + 1
    return {'png': png_of(big, pal), 'frames': fr}


def render(src, pal, kscale, dots, name):
    r, a = src
    col, m = shrink(r, a, max(4, round(a.shape[1] * kscale)))
    idx = to_pal_idx(col, m, pal)
    if dots <= 36:   # 小さいサイズは輪郭を最暗色でなぞる
        edge = m & ~nd.binary_erosion(m)
        dk = np.array([lum(pal[i - 1]) for i in range(1, len(pal) + 1)])
        e = edge & (idx > 0)
        idx[e] = np.where(dk[idx[e] - 1] < 70, idx[e], len(pal))
    ax, ay = foot(m, name)
    return idx, ax, ay


def heads_of(src, pal, L, skip=0.0, at=None):
    r, a = head_crop(*src, L, skip, at)
    tiles = []
    for nn in (20, 22, 48):
        col, m = shrink(r, a, nn)
        tiles.append((str(nn), to_pal_idx(col, m, pal), 0, 0))
    return pack(tiles, pal)


def aw_col(c):
    """星臨の配色（倒れた姿だけ通常の絵を使う）：寒色・赤を白金寄りに、他は少し明るく"""
    h, s, v = colorsys.rgb_to_hsv(*(np.array(c) / 255))
    if s > .2 and .5 <= h <= .75:
        h, s, v = 46 / 360, s * .35, min(1, v * 1.35 + .12)
    elif s > .25 and (h < .14 or h > .9):
        h, s, v = 45 / 360, s * .8, min(1, v * 1.15)
    else:
        v = min(1, v * 1.08)
    return np.array(colorsys.hsv_to_rgb(h, s, v)) * 255


def build_hero(hid, F, head_from='front', head_k=.37, ref_k=1.0, single=False, head_skip=0.0, head_at=None, head_atK=None):
    """F：ポーズ名→(rgb, alpha)。'awk' があれば <hid>_K も作る"""
    ref_h = F['front'][1].shape[0] * ref_k
    names = [k for k in F if k != 'awk']
    pal = make_pal([F[k] for k in names], ref_h)
    C = {'face': 'L', 'kind': 'hum', 'pal': [hexs(c) for c in pal], 'sizes': {}}
    if single:
        C['single'] = 1   # 1 枚絵：spx.js がポーズに合わせて絵を動かす
    prev = []
    for sk, dots in SIZES:
        ks = dots / ref_h
        want = FIELD if sk[0] == 'f' else BATTLE
        tiles = []
        for nm in want:
            src = ALIASF.get(nm, nm)
            if src not in F:
                continue
            idx, ax, ay = render(F[src], pal, ks, dots, src)
            tiles.append((nm, idx, ax, ay))
        S = pack(tiles, pal)
        S.update({'k': round(ks, 5), 'dots': dots})
        C['sizes'][sk] = S
        if sk in ('B84',):
            prev.append((hid + ' ' + sk, tiles, pal))
    C['heads'] = heads_of(F[head_from], pal, int(round(F[head_from][1].shape[0] * head_k)), head_skip, head_at)
    C['palAw'] = [hexs(aw_col(c)) for c in pal[:-1]] + [hexs(pal[-1])]
    out = {hid: C}
    if 'awk' in F:
        palK = make_pal([F['awk']], ref_h)
        K = {'face': 'L', 'kind': 'hum', 'pal': [hexs(c) for c in palK], 'sizes': {}}
        for sk, dots in SIZES:
            if sk[0] == 'f':
                continue
            ks = dots / ref_h
            idx, ax, ay = render(F['awk'], palK, ks, dots, 'awk')
            S = pack([('awk', idx, ax, ay)], palK)
            S.update({'k': round(ks, 5), 'dots': dots})
            K['sizes'][sk] = S
            if sk == 'B84':
                prev.append((hid + '_K ' + sk, [('awk', idx, ax, ay)], palK))
        K['heads'] = heads_of(F['awk'], palK, int(round(F['awk'][1].shape[0] * head_k * .92)), head_skip, head_atK)
        out[hid + '_K'] = K
    return out, prev


# ---------- 既存データの修正（jin_K の元データは assets_src/legacy/spx-legacy.json に保管。tools/spx_normalize.py 参照） ----------
D0 = json.load(open(os.path.join(ROOT, 'assets_src', 'legacy', 'spx-legacy.json')))


def decode(c, sk):
    S = c['sizes'][sk] if sk != 'heads' else c['heads']
    im = np.asarray(Image.open(io.BytesIO(base64.b64decode(S['png'].split(',')[1]))).convert('RGBA')).astype(np.float64)
    return S, im


def requant(entries, ncol=34):
    """entries：[(サイズ, 名前, RGBA, ax, ay)]。全サイズ共通のパレットを作り直し、アトラスを組み直す"""
    px = np.vstack([e[2][e[2][:, :, 3] > 0][:, :3] for e in entries])
    uniq = np.unique(np.round(px).astype(int), axis=0)
    if len(uniq) <= ncol:   # 色が増えていなければ元の色をそのまま使う
        pal = uniq.astype(np.float64)
    else:
        sub = px[np.random.default_rng(5).choice(len(px), min(len(px), 9000), replace=False)]
        pal = kmeans(sub, ncol - 1)
    order = sorted(range(len(pal)), key=lambda i: -lum(pal[i]))
    pal = pal[order]
    by = {}
    for sk, nm, rgba, ax, ay in entries:
        idx = to_pal_idx(rgba[:, :, :3], rgba[:, :, 3] > 0, pal)
        by.setdefault(sk, []).append((nm, idx, ax, ay))
    return pal, by


def fix_jin_K(jin):
    """相棒の獣（左側の四足）を、原画の柴犬に合わせて橙と白の毛並みに。乗り手の黒と金の鎧はそのまま。
    大きさは新しいジン（1 枚絵）の背丈の 1.1 倍に合わせ、各サイズに最も近い大きさの旧データを当てる"""
    c = D0['jin_K']
    entries = []
    oldh = {sk: c['sizes'][sk]['frames']['awk'][3] for sk in c['sizes']}
    pick = {}
    for sk in c['sizes']:
        want = 1.1 * jin['sizes'][sk]['frames']['stance'][3]
        pick[sk] = min(oldh, key=lambda s2: abs(oldh[s2] - want))
    for sk in c['sizes']:
        S, im = decode(c, pick[sk])
        x, y, w, h, ax, ay = S['frames']['awk']
        f = im[y:y + h, x:x + w].copy()
        cols = np.arange(w)[None, :].repeat(h, 0)
        rows = np.arange(h)[:, None].repeat(w, 1)
        beast = (cols < w * .40) & (rows > h * .22)
        for yy, xx in zip(*np.where(beast & (f[:, :, 3] > 0))):
            r, g, b = f[yy, xx, :3] / 255
            hh, ss, vv = colorsys.rgb_to_hsv(r, g, b)
            if vv < .12:
                continue
            if ss < .35 and vv > .55:          # 明るい毛 → 白い胸毛
                nh, ns, nv = 34 / 360, .12, min(1, vv * 1.1)
            else:                               # 茶・金の毛 → 柴犬の橙
                nh, ns, nv = 26 / 360, min(1, .55 + ss * .4), min(1, vv * 1.18 + .05)
            f[yy, xx, :3] = np.array(colorsys.hsv_to_rgb(nh, ns, nv)) * 255
        entries.append((sk, 'awk', f, ax, ay))
    pal, by = requant(entries)
    K = {'face': 'L', 'kind': 'hum', 'pal': [hexs(p) for p in pal], 'sizes': {}}
    prev = []
    for sk in c['sizes']:
        S = pack(by[sk], pal)
        S.update({'k': jin['sizes'][sk]['k'], 'dots': jin['sizes'][sk]['dots']})
        K['sizes'][sk] = S
        if sk == 'B84':
            prev.append(('jin_K ' + sk, by[sk], pal))
    Sh, imh = decode(c, 'heads')
    he = [(nm, to_pal_idx(imh[y:y + h, x:x + w, :3], imh[y:y + h, x:x + w, 3] > 0, pal), 0, 0)
          for nm, (x, y, w, h, _, _) in Sh['frames'].items()]
    K['heads'] = pack(he, pal)
    return K, prev


# ---------- ジン：1 枚絵から戦闘不能を作る ----------
def jin_frames():
    img = np.asarray(Image.open(ORIG('jin.jpg')).convert('RGB')).astype(np.float64)
    fg = fg_mask(img, 28)
    lab2, _ = nd.label(fg)
    sizes = nd.sum(fg, lab2, range(1, lab2.max() + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= 40]
    m = np.isin(lab2, keep)
    stance = crop_of(img, m)
    # 柴犬：左下の領域から、爪（灰色の金属）を除いた最大の塊
    H, W = m.shape
    hsv = np.array(Image.fromarray(img.astype(np.uint8)).convert('HSV')).astype(np.float64)
    xs = np.arange(W)[None, :].repeat(H, 0)
    ys = np.arange(H)[:, None].repeat(W, 1)
    claw = (hsv[:, :, 1] < 40) & (hsv[:, :, 2] > 90) & (xs > 225)
    region = m & (xs < 345) & (ys > 530) & ~claw
    l3, _ = nd.label(region)
    s3 = nd.sum(region, l3, range(1, l3.max() + 1))
    dog = l3 == (int(np.argmax(s3)) + 1)
    dog = nd.binary_closing(dog, iterations=2) & m
    body = m & ~dog
    l4, _ = nd.label(body)
    s4 = nd.sum(body, l4, range(1, l4.max() + 1))
    body = np.isin(l4, [i + 1 for i, s in enumerate(s4) if s >= s4.max() * .01])
    br, ba = crop_of(img, body)
    dr, da = crop_of(img, dog)
    # 体を左へ 90°（頭が左＝敵の側、仰向け）。柴犬は座ったまま、頭の左に寄り添わせる
    br, ba = np.rot90(br, 1).copy(), np.rot90(ba, 1).copy()
    Hh = max(ba.shape[0], da.shape[0])
    Wd = da.shape[1] + ba.shape[1] - int(da.shape[1] * .15)
    rr, aa = np.zeros((Hh, Wd, 3)), np.zeros((Hh, Wd))
    ox = Wd - ba.shape[1]
    rr[Hh - ba.shape[0]:, ox:] = br
    aa[Hh - ba.shape[0]:, ox:] = ba
    sel = da > 0
    sub_r = rr[Hh - da.shape[0]:, :da.shape[1]]
    sub_a = aa[Hh - da.shape[0]:, :da.shape[1]]
    sub_r[sel] = dr[sel]
    sub_a[sel] = 1
    down = (rr, aa)
    return {'front': stance, 'stance': stance, 'down': down}


# ---------- 作成 ----------
# （ver0.31 までのリオ rio_sheet.png・ヴァルク valk_sheet.jpg の切り出し表は、新原画への差し替えで不要になったので外した。git の履歴に残っている）

data, prev = {}, []
# 新原画：正面・待機・星臨の 3 体シート。原画の待機・星臨は右向き → 反転して左向き（正面は原画のまま）
GALD_GHOST = lambda X, Y: (Y > 640) & (Y < 1000) & (X < 935) & ((X >= 809) | ((X >= 700) & (Y < 800 + (X - 620) * .535)))   # 正面の盾の右上に紛れ込んだ小さな騎士
TRIO = {   # id: (原画, from_trio の設定, build_hero の設定)
    'rio': ('rio_v2.jpg', {}, {'head_skip': .1}),             # 顔グラは逆立った髪の分を飛ばす
    'celes': ('celes_v2.jpg', {'ring': 60}, {'head_skip': .26}),    # 暗い背景：すき間も輪郭も暗いので輪の判定を緩める。顔グラは帽子の分を飛ばす
    'gald': ('gald_v2.jpg', {'ring': 120, 'erase': GALD_GHOST}, {'head_skip': .12}),
    'mire': ('mire_v2.jpg', {}, {}),
    'hakua': ('hakua_v2.jpg', {}, {'head_atK': (.33, .15)}),     # 顔グラの位置（星臨は冠の飾りが高い）
    'noah': ('noah_v2.jpg', {}, {'head_at': (.6, .11), 'head_atK': (.49, .21)}),   # 杖・翼・光輪が頭より高い
    'erna': ('erna_v2.jpg', {}, {'head_atK': (.54, .2)}),      # 星臨は弓が頭より高い
    'valk': ('valk_v2.jpg', {}, {'head_skip': .1}),            # 顔グラは角の分を飛ばす
}
for hid, (fn, opt, hopt) in TRIO.items():
    F = from_trio(fn, **opt)
    F['stance'], F['awk'] = flip(F['stance']), flip(F['awk'])
    F['down'] = lay_down(F['stance'])
    o, p = build_hero(hid, F, single=True, **hopt)
    data.update(o)
    prev += p
# 虚神ノクス（rio の色違い）：金髪→暗い紫、肌→薄紫、青い外套→濃紫、赤→桃色の光、銀→紫がかった鉄
def last3(c):
    h, s, v = colorsys.rgb_to_hsv(*(np.array(c) / 255))
    H = h * 360
    if s > .4 and (H >= 330 or H < 15):
        h2, s2, v2 = 305, .75, min(1, v * 1.25 + .1)
    elif 15 <= H < 40 and s < .5 and v > .6:
        h2, s2, v2 = 280, .22, v * .92
    elif 25 <= H < 65 and s >= .35:
        h2, s2, v2 = 282, .62, v * .62
    elif 190 <= H < 260 and s > .2:
        h2, s2, v2 = 278, .72, v * .6
    else:
        h2, s2, v2 = 272, min(.3, s + .12), v * .62
    return np.array(colorsys.hsv_to_rgb(h2 / 360, s2, v2)) * 255
data['rio']['vars'] = {'last3': [hexs(last3(np.array([int(x[1:3], 16), int(x[3:5], 16), int(x[5:7], 16)]))) for x in data['rio']['pal'][:-1]] + [data['rio']['pal'][-1]]}

o, p = build_hero('jin', jin_frames(), head_from='stance', head_k=.33, ref_k=1.08, single=True)
data.update(o)
prev += p

K, p = fix_jin_K(data['jin'])
data['jin_K'] = K
prev += p

with open(OUT, 'w') as f:
    f.write('/* 自動生成：tools/build_spx_heroes.py（提供原画 assets_src/originals と assets_src/legacy の修正）。手で編集しない */\n')
    f.write('Object.assign(SPX_DATA,' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ');\n')
print('wrote', OUT, os.path.getsize(OUT), list(data))

if PREVIEW:
    from PIL import ImageDraw
    rows = []
    for nm0, tiles, pl in prev:
        P = np.array([[0, 0, 0]] + [list(c) for c in pl], np.float64).clip(0, 255).astype(np.uint8)
        rows.append((nm0, [(nm, Image.fromarray(np.concatenate([P[idx], (idx > 0)[:, :, None].astype(np.uint8) * 255], 2), 'RGBA'), ax, ay)
                           for nm, idx, ax, ay in tiles]))
    W = max(sum(t.width + 8 for _, t, _, _ in ts) for _, ts in rows) + 90
    H = sum(max(t.height for _, t, _, _ in ts) + 16 for _, ts in rows)
    C = Image.new('RGBA', (W, H), (60, 56, 84, 255))
    d = ImageDraw.Draw(C)
    y = 0
    for nm0, ts in rows:
        x = 86
        d.text((2, y + 20), nm0, fill='white')
        mh = max(t.height for _, t, _, _ in ts)
        for nm, t, ax, ay in ts:
            C.alpha_composite(t, (x, y + 14))
            d.text((x, y), nm[:6], fill='yellow')
            d.point((x + ax, y + 14 + ay + 1), fill='red')
            x += t.width + 8
        y += mh + 16
    C.save(PREVIEW)
