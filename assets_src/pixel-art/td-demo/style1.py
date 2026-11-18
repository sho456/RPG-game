"""TD デモ 案1「48px デフォルメ版」：セレス（48px を 2 倍の最近傍）の動きと技の演出。

ドット絵寄りの決まり
  光は半分の解像度（480×270）の「ドットの層」に描いて 2 倍に拡大（2px の格子）。色は 紫・金・青・白 だけ。
  形の濃い部品（矢・針・砂時計・狙いの括弧・数字）は輪郭つきの小さなドット絵（OV：最後に重ねる）。
  時間はコマ打ち：光は 1/30 秒ごと、陣の中の粒は 1/8 秒ごと（遅くなった時間）に進む。
部品（3 つの技と通常攻撃で共通）：時計の刻印（pclock）・星の閃光（十字の星 pstar）・時の欠片（四角の粒 pburst）。
TD 向け：画面全体の暗転なし（終焉の針だけ、セレスと的のまわりを 1 秒ほど 3 段で暗く）・揺れは 0/2/8px・数字は小さなドットの字。
"""
import math
import os

import numpy as np
from PIL import Image

import fxcore as X
import tdcore as C
from fxcore import CYAN, DEEP, GOLD, VIO, WHITE, clamp, eout, ein

LABEL = '案1 デフォルメ'
NAMES = {'tokiya': '刻の矢', 'slow': 'クロノスロウ', 'shuuen': '終焉の針'}
COL = {'gold': GOLD, 'vio': VIO, 'cyan': CYAN, 'death': VIO}
TAIL = .5
WORLD_SLOW = (.98, 1.24, .3)   # 針が落ちる 0.26 秒だけ世界を 0.3 倍に

ACT = {
    'attack': dict(dur=.4, hits=[(.26, 'single', dict(dmg=560, col='cyan', kb=8))]),
    'tokiya': dict(dur=1.1, hits=[(.57 + k * .1, 'single', dict(dmg=2600, col='vio', crit=k == 2, kb=10 + k * 8)) for k in range(3)]),
    'slow': dict(dur=.9, zone=dict(at=.5, r=150, f=.3, dur=6.0), hits=[(.5, 'aoe', dict(dmg=300, col='vio', r=150))]),
    'shuuen': dict(dur=2.0, aoe=dict(r=190), hits=[(1.24, 'aoe', dict(dmg=6000, col='gold', crit=True, kb=70, r=190))]),
}
SKY_Y = 150          # 終焉の針の空の時計
NEEDLE_T = (.96, 1.24)

W, H = C.W, C.H
HW, HH = W // 2, H // 2
GOLD2 = np.array([1.0, .93, .6], np.float32)
INK = np.array([.07, .03, .14], np.float32)


def qt(a, fps=30):
    """コマ打ちの時間"""
    return math.floor(a * fps) / fps


def qa(a):
    """明るさを 4 段に"""
    return math.ceil(clamp(a) * 4) / 4


# ================================================================ セレスのコマ
SPR_DIR = os.path.join(C.HERE, '..', 'celes-48', 'sprites', 'anim')


def _load_pose(p):
    d = os.path.join(SPR_DIR, p)
    fr = []
    for f in sorted(os.listdir(d)):
        a = np.asarray(Image.open(os.path.join(d, f)).convert('RGBA')).astype(np.float32) / 255
        m = (a[..., 3] > 0) & (a[..., 2] > .72) & (a[..., 0] < .55) & (a[..., 1] > .4)
        ys, xs = np.where(m)
        gem = (xs.mean(), ys.mean()) if len(xs) else (6.0, 24.0)
        fr.append(dict(n=a, big=np.repeat(np.repeat(a, 2, 0), 2, 1), gem=gem))
    return fr


POSE = {p: _load_pose(p) for p in ('idle', 'cast_in', 'cast', 'act', 'swing', 'land')}


def _seq(u, keys):
    """keys = [(開始, ポーズ, コマ, dx, dy)]。u 以前の最後のキー"""
    cur = keys[0]
    for k in keys:
        if u >= k[0]:
            cur = k
    return cur[1:]


def pose_at(t, sim):
    """今のポーズ (名前, コマ, dx, dy, 技の名前, 経過)"""
    act = None
    for a in sim.actions:
        if a['t0'] <= t < a['t0'] + a['dur'] + (.12 if a['name'] != 'attack' else 0):
            act = a
    if act is None:
        k = int((t % .84) / .21)
        return ('idle', k, 0, 0, None, 0)
    u = qt(t - act['t0'])
    n = act['name']
    if n == 'attack':
        p = _seq(u, [(0, 'cast_in', 1, 0, 0), (.08, 'act', 0, 0, 0), (.14, 'act', 1, -2, 0), (.2, 'act', 2, 2, 0),
                     (.28, 'act', 3, 2, 0), (.36, 'idle', 0, 0, 0)])
    elif n == 'tokiya':
        ks = [(0, 'cast_in', 0, 0, 0), (.05, 'cast_in', 1, 0, 0)]
        ks += [(.1 + i * .07, 'cast', i % 4, 0, -2 if i % 2 else 0) for i in range(5)]
        for j in range(3):
            s = .45 + j * .1
            ks += [(s, 'act', 1, -2, 0), (s + .04, 'act', 2, 2 + j * 2, 0)]
        ks += [(.78, 'land', 0, 4, 0), (.86, 'land', 1, 2, 0), (.95, 'land', 2, 0, 0), (1.04, 'idle', 0, 0, 0)]
        p = _seq(u, ks)
    elif n == 'slow':
        ks = [(0, 'cast_in', 0, 0, 0), (.06, 'cast_in', 1, 0, -2)]
        ks += [(.12 + i * .08, 'cast', i % 4, 0, -2 - 2 * (i % 2)) for i in range(5)]
        ks += [(.5, 'swing', 0, -2, -4), (.56, 'swing', 1, -2, 0), (.62, 'swing', 2, 2, 0), (.72, 'land', 1, 0, 0),
               (.82, 'land', 2, 0, 0), (.9, 'idle', 0, 0, 0)]
        p = _seq(u, ks)
    else:  # shuuen
        ks = [(0, 'cast_in', 0, 0, 0), (.06, 'cast_in', 1, 0, 0)]
        ks += [(.12 + i * .06, 'cast', i % 4, 0, -2 * min(i // 2, 4)) for i in range(14)]
        ks += [(.96, 'swing', 0, 0, -12), (1.04, 'swing', 1, -2, -6), (1.12, 'swing', 2, -2, 0), (1.3, 'land', 0, 2, 0),
               (1.42, 'land', 1, 2, 0), (1.56, 'land', 2, 0, 0), (1.72, 'idle', 0, 0, 0)]
        p = _seq(u, ks)
    return p + (n, u)


def hero_box(t, sim):
    p, i, dx, dy, n, u = pose_at(t, sim)
    fr = POSE[p][i % len(POSE[p])]
    x0, y0 = C.CEL_X - 48 + dx, C.CEL_FOOT - 96 + dy
    return fr, x0, y0


def gem(t, sim):
    fr, x0, y0 = hero_box(t, sim)
    gx, gy = fr['gem']
    return x0 + gx * 2 + 1, y0 + gy * 2 + 1


def hero(img, t, sim, fi):
    fr, x0, y0 = hero_box(t, sim)
    X.shadow(img, C.CEL_X, C.CEL_FOOT, 30, .45)
    X.paste(img, fr['big'], x0, y0)


# ================================================================ ドットの層（480×270 → 2 倍）
def PL():
    return np.zeros((HH, HW, 3), np.float32)


def put(L, P):
    L += np.repeat(np.repeat(P, 2, 0), 2, 1)


def _pts(P, xs, ys, col, a):
    if a <= 0:
        return
    xi = (np.asarray(xs, np.float32) // 2).astype(int)
    yi = (np.asarray(ys, np.float32) // 2).astype(int)
    m = (xi >= 0) & (xi < HW) & (yi >= 0) & (yi < HH)
    xi, yi = xi[m], yi[m]
    P[yi, xi] = np.maximum(P[yi, xi], np.asarray(col, np.float32) * qa(a))


def prect(P, x0, y0, x1, y1, col, a=1.0):
    x0, y0 = max(0, int(x0) // 2), max(0, int(y0) // 2)
    x1, y1 = min(HW, int(x1) // 2 + 1), min(HH, int(y1) // 2 + 1)
    if x1 > x0 and y1 > y0 and a > 0:
        P[y0:y1, x0:x1] = np.maximum(P[y0:y1, x0:x1], np.asarray(col, np.float32) * qa(a))


def pline(P, p0, p1, col, a=1.0, w=1):
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1])) / 2) + 2
    xs = np.linspace(p0[0], p1[0], n)
    ys = np.linspace(p0[1], p1[1], n)
    for k in range(w):
        _pts(P, xs + (k % 2) * 2, ys + (k // 2) * 2, col, a)


def pring(P, x, y, rx, ry, col, a=1.0, a0=0, a1=360, th=1, dash=0, rot=0.0):
    if rx <= 0 or a <= 0:
        return
    n = int(2 * math.pi * max(rx, ry) / 1.5) + 8
    ang = np.radians(np.linspace(a0, a1, n))
    if dash:
        keep = ((ang + rot) / (2 * math.pi) * dash * 2).astype(int) % 2 == 0
        ang = ang[keep]
    for k in range(th):
        r2, ry2 = rx - k * 2, ry - k * 2 * ry / max(rx, 1)
        _pts(P, x + np.cos(ang) * r2, y + np.sin(ang) * ry2, col, a)


def pdisk(P, x, y, rx, ry, col, a=1.0, dither=False):
    if a <= 0 or rx <= 0:
        return
    x0, x1 = max(0, int((x - rx) // 2)), min(HW, int((x + rx) // 2) + 2)
    y0, y1 = max(0, int((y - ry) // 2)), min(HH, int((y + ry) // 2) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    m = ((xx * 2 + 1 - x) / rx) ** 2 + ((yy * 2 + 1 - y) / max(ry, 1)) ** 2 <= 1
    if dither:
        m &= (xx + yy) % 2 == 0
    sub = P[y0:y1, x0:x1]
    sub[m] = np.maximum(sub[m], np.asarray(col, np.float32) * qa(a))


def pstar(P, x, y, s, col, a=1.0, core=WHITE):
    """十字の星（s は腕の長さ・ドット数）。s>=3 で 45° の点も"""
    if a <= 0 or s < 1:
        return
    s = int(s)
    for k in range(1, s + 1):
        aa = a if k <= s - 1 or s == 1 else a * .5
        for dx, dy in ((k, 0), (-k, 0), (0, k), (0, -k)):
            _pts(P, [x + dx * 2], [y + dy * 2], col, aa)
    if s >= 3:
        for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
            _pts(P, [x + dx * 2], [y + dy * 2], col, a * .5)
    _pts(P, [x], [y], core, a)
    if s >= 4:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            _pts(P, [x + dx * 2], [y + dy * 2], core, a)


def pburst(P, x, y, age, n, seed, sp=240, life=.5, cols=(GOLD,), grav=300.0, up=0.0, sz=(1, 2), stars=0, a=1.0, sq=1.0, fps=30):
    """時の欠片：四角の粒と十字の星（状態を持たない）"""
    age = qt(age, fps)
    if age < 0:
        return
    rng = np.random.default_rng(seed)
    th = rng.uniform(0, 2 * math.pi, n)
    v = sp * (.3 + .7 * rng.random(n))
    lf = life * (.5 + .5 * rng.random(n))
    s = rng.integers(sz[0], sz[1] + 1, n)
    for i in range(n):
        if age > lf[i]:
            continue
        fade = 1 - age / lf[i]
        dk = (1 - math.exp(-3 * age)) / 3
        px = x + math.cos(th[i]) * v[i] * dk
        py = y + (math.sin(th[i]) * v[i] * sq - up) * dk + .5 * grav * age * age
        col = cols[i % len(cols)]
        if i < stars:
            pstar(P, px, py, 2 if fade > .5 else 1, col, a * fade + .25)
        else:
            k = int(s[i])
            prect(P, px, py, px + k * 2 - 1, py + k * 2 - 1, col, a * fade + .25)


def pclock(P, x, y, r, ry, k, col=GOLD, sub=VIO, a=1.0, h1=0.0, h2=None, lit=12, ticks=True):
    """時計の刻印（ドット）：外の輪・内の輪・12 の目盛り（3 つおきに十字の星）・針"""
    if a <= 0 or k <= 0:
        return
    pring(P, x, y, r, ry, col, a, -90, -90 + 360 * clamp(k * 1.3))
    pring(P, x, y, r * .8, ry * .8, sub, a * .75, -90, -90 + 360 * clamp(k * 1.3 - .2))
    if ticks and k > .4:
        for i in range(min(12, lit)):
            th = -math.pi / 2 + i / 12 * 2 * math.pi
            tx, ty = x + math.cos(th) * r * .9, y + math.sin(th) * ry * .9
            if i % 3 == 0:
                pstar(P, tx, ty, 2 if r > 40 else 1, col, a)
            else:
                prect(P, tx - 1, ty - 1, tx + 1, ty + 1, col, a * .9)
    if k > .6:
        for th, ln, c in ((h1, .55, WHITE), (h2, .78, GOLD2)):
            if th is None:
                continue
            pline(P, (x, y), (x + math.sin(th) * r * ln, y - math.cos(th) * ry * ln), c, a)
        prect(P, x - 1, y - 1, x + 1, y + 1, WHITE, a)


def pimpact(P, x, y, age, s, seed, col=VIO, sub=GOLD, a=1.0):
    """着弾（ドット）：白い芯 → 十字の星 → 輪 → 時の欠片"""
    age = qt(age)
    if age < 0 or age > .6:
        return
    if age < .05:
        pdisk(P, x, y, 7 * s + 3, 6 * s + 3, WHITE, a)
    pstar(P, x, y, int((2 + 5 * s) * (1 - age / .2)) if age < .2 else 0, sub, a)
    rr = (6 + 30 * s) * eout(age / .2)
    pring(P, x, y, rr, rr * .75, WHITE if age < .08 else col, a * (1 - age / .28) if age < .28 else 0)
    pburst(P, x, y, age, int(6 + 10 * s), seed, sp=200 + 160 * s, life=.4, cols=(sub, WHITE, col), grav=420, up=60, stars=2, a=a)


# ================================================================ 輪郭つきの小さなドット絵（最後に重ねる）
PALC = {'k': INK, 'v': VIO, 'V': DEEP, 'g': GOLD, 'G': GOLD2, 'w': WHITE, 'c': CYAN}


def _bmp(rows):
    h, w = len(rows), max(len(r) for r in rows)
    a = np.zeros((h, w, 4), np.float32)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in PALC:
                a[y, x, :3] = PALC[ch]
                a[y, x, 3] = 1
    return a


def _x2(a, k=2):
    return np.repeat(np.repeat(a, k, 0), k, 1)


ARROW = _x2(_bmp(["...kk................kk..",
                  ".kkcwk..............kvvk.",
                  "kwwwwcGGgggggggggggkvcvk",
                  ".kkcwk..............kvvk.",
                  "...kk................kk.."]))
SHARD = _x2(_bmp(["..kkk...",
                  ".kwcck..",
                  "kwwccgk.",
                  ".kwcck..",
                  "..kkk..."]))
HG = [_x2(_bmp(["kkkkkkk", "kgggggk", ".kvvvk.", "..kvk..", "..kwk..", ".k.w.k.", "k..v..k", "kgggggk", "kkkkkkk"])),
      _x2(_bmp(["kkkkkkk", "kgggggk", ".k...k.", "..kwk..", "..kwk..", ".kvvvk.", "kvvvvvk", "kgggggk", "kkkkkkk"]))]


def _needle():
    """終焉の針：上に宝石の重り・金の刃・白い芯（下向き）"""
    w, h = 13, 66
    a = np.zeros((h, w, 4), np.float32)
    cx = 6
    for y in range(h):
        for x in range(w):
            dx = x - cx
            col = None
            if 1 <= y <= 11 and (dx * dx + (y - 6) ** 2) <= 25:
                col = CYAN if (dx * dx + (y - 6) ** 2) <= 4 else (WHITE if (dx * dx + (y - 6) ** 2) <= 6 else VIO)
            elif y >= 11:
                hw = (y - 11) / 30 * 3.6 + 1 if y < 41 else max(0.0, (h - 2 - y) / 23 * 4.6)
                if abs(dx) <= hw:
                    col = WHITE if dx == 0 else (GOLD2 if abs(dx) <= 1 else GOLD)
            if col is not None:
                a[y, x, :3] = col
                a[y, x, 3] = 1
    m = a[..., 3] > 0
    o = np.zeros_like(m)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        o |= np.roll(np.roll(m, dy, 0), dx, 1)
    o &= ~m
    a[o, :3] = INK
    a[o, 3] = 1
    return _x2(a)


NEEDLE = _needle()

DIG = {'0': ["111", "101", "101", "101", "111"], '1': ["010", "110", "010", "010", "111"], '2': ["111", "001", "111", "100", "111"],
       '3': ["111", "001", "111", "001", "111"], '4': ["101", "101", "111", "001", "001"], '5': ["111", "100", "111", "001", "111"],
       '6': ["111", "100", "111", "101", "111"], '7': ["111", "001", "001", "010", "010"], '8': ["111", "101", "111", "101", "111"],
       '9': ["111", "101", "111", "001", "111"]}
_NUMC = {}


def num_img(n, col, k):
    """ドットの数字（3×5 の字・1 ドットの輪郭・上が白で下が色）を k 倍に"""
    key = (n, col, k)
    if key in _NUMC:
        return _NUMC[key]
    s = str(n)
    w = len(s) * 4 + 1
    m = np.zeros((7, w), bool)
    for i, ch in enumerate(s):
        for y, r in enumerate(DIG[ch]):
            for x, c in enumerate(r):
                if c == '1':
                    m[y + 1, i * 4 + x + 1] = True
    o = np.zeros_like(m)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    a = np.zeros((7, w, 4), np.float32)
    a[o] = (*INK, 1)
    for y in range(7):
        c = WHITE if y <= 2 else np.asarray(col, np.float32)
        a[y][m[y]] = (*c, 1)
    out = (_x2(a, k) * 255).astype(np.uint8)
    _NUMC[key] = Image.fromarray(out, 'RGBA')
    return _NUMC[key]


_OV = dict(fi=None, items=[])


def ov(fi, fn):
    if _OV['fi'] != fi:
        _OV['fi'], _OV['items'] = fi, []
    _OV['items'].append(fn)


def blit(img, spr, x, y, alpha=1.0, white=0.0):
    X.paste(img, spr, int(x) // 2 * 2, int(y) // 2 * 2, alpha=alpha, white=white)


def orect(img, x0, y0, x1, y1, col, a=1.0):
    x0, y0, x1, y1 = max(0, int(x0)), max(0, int(y0)), min(W, int(x1)), min(H, int(y1))
    if x1 > x0 and y1 > y0:
        img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - a) + np.asarray(col, np.float32) * a


def brackets(img, x, y, hw, hh, col, a=1.0):
    """狙いの印：四隅の L 字（輪郭つき）"""
    x, y, hw, hh = int(x) // 2 * 2, int(y) // 2 * 2, int(hw) // 2 * 2, int(hh) // 2 * 2
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx, cy = x + sx * hw, y + sy * hh
            for (ax0, ay0, ax1, ay1) in ((cx - 7 * (sx > 0), cy - 1, cx + 7 * (sx < 0) + 1, cy + 1),
                                         (cx - 1, cy - 7 * (sy > 0), cx + 1, cy + 7 * (sy < 0) + 1)):
                orect(img, ax0 - 2, ay0 - 2, ax1 + 2, ay1 + 2, INK, a)
            orect(img, min(cx, cx - 6 * sx), cy - 1, max(cx, cx - 6 * sx) + 1, cy + 1, col, a)
            orect(img, cx - 1, min(cy, cy - 6 * sy), cx + 1, max(cy, cy - 6 * sy) + 1, col, a)


# ================================================================ 技の光
def epos(sim, i, fi, where='mid'):
    if i is None:
        return None
    e = sim.enemies[i]
    x, y = sim.epos(e, fi, where)
    return None if np.isnan(x) else (x, y)


def fx_ground(Lg, t, act, sim, fi):
    age = t - act['t0']
    n = act['name']
    P = PL()
    if n == 'shuuen' and act['aim'] is not None:
        ax, gy = act['aim'], C.GROUND + 4
        r = ACT['shuuen']['aoe']['r']
        if .18 < age < 1.24:
            k = eout((age - .18) / .2)
            blink = 1.0 if age < .8 else (1.0 if int(age * 20) % 2 else .5)
            pring(P, ax, gy, r * k, r * .16 * k, GOLD, .9 * blink, dash=16, rot=age * 3, th=2)
            pring(P, ax, gy, r * .55 * k, r * .09 * k, VIO, .7 * blink)
            pdisk(P, ax, gy, r * k, r * .16 * k, DEEP, .5, dither=True)
        if 1.24 <= age < 1.9:
            u = qt(age - 1.24)
            for j in range(3):
                rr = (40 + 260 * eout(u / (.25 + j * .1))) * (1 + j * .1)
                pring(P, ax, gy, rr, rr * .16, (WHITE, GOLD, VIO)[j], 1 - u / (.4 + j * .15), th=2)
    if n == 'slow' and act['aim'] is not None and age < .55:
        ax, gy = act['aim'], C.GROUND + 4
        r = ACT['slow']['zone']['r']
        k = clamp((qt(age) - .1) / .4)
        pclock(P, ax, gy, r, r * .2, k, GOLD, VIO, .9, h1=-k * 6.28, h2=-k * 18, ticks=True)
    put(Lg, P)


def fx_front(Lf, t, act, sim, fi):
    age = t - act['t0']
    n = act['name']
    P = PL()
    gx, gy = gem(t, sim)
    # ---- 命中（共通）
    for (ht, kind, ids, prm) in act['hits']:
        for i in ids:
            p = epos(sim, i, fi)
            if p is None:
                continue
            s = {'attack': .35, 'tokiya': .75, 'slow': .3, 'shuuen': .45}[n]
            col = {'attack': CYAN, 'tokiya': VIO, 'slow': VIO, 'shuuen': VIO}[n]
            pimpact(P, p[0], p[1], t - ht, s, i * 13 + int(ht * 60), col, GOLD if n != 'attack' else WHITE)
    if n == 'attack':
        if age < .14:
            pstar(P, gx, gy, 1 + int(age / .05), CYAN, 1)
        tg = epos(sim, act['target'], fi)
        u = (age - .14) / .12
        if tg is not None and 0 <= u < 1:
            x = gx + (tg[0] - gx) * u
            y = gy + (tg[1] - gy) * u
            for j in range(1, 4):
                prect(P, x + j * 10, y - 1, x + j * 10 + 3, y + 1, GOLD, 1 - j * .25)
            ov(fi, lambda img, x=x, y=y: blit(img, SHARD, x - 2, y - 5))
        if .12 < age < .2:
            pstar(P, gx - 4, gy, 3, WHITE, 1)
    elif n == 'tokiya':
        tg = epos(sim, act['target'], fi)
        tgi = act['target']
        # 溜め：宝石が青く光り、時計の針の矢が 1 本ずつ現れる
        if age < .5:
            pstar(P, gx, gy, 2 + int(qt(age) * 8) % 2, CYAN, 1)
            pclock(P, gx, gy, 16, 16, clamp(age / .3), GOLD, CYAN, .8, h1=age * 20, h2=age * 6, ticks=False)
        for j in range(3):
            s = .45 + j * .1
            if .1 + j * .08 <= age < s:
                ax = gx - 34 + (2 if int(age * 15 + j) % 2 else 0)
                ay = gy - 22 + j * 12
                ov(fi, lambda img, ax=ax, ay=ay: blit(img, ARROW, ax - 2, ay - 5))
                if age < .14 + j * .08:
                    pstar(P, ax, ay, 3, GOLD, 1)
            u = (age - s) / .12
            if tg is not None and 0 <= u < 1:
                sx, sy = gx - 34, gy - 22 + j * 12
                x, y = sx + (tg[0] - sx) * u, sy + (tg[1] - sy + (j - 1) * 6) * u
                pline(P, (x + 46, y - 2), (x + 160 * min(1, u * 3), y - 2), VIO, .9, w=2)
                pline(P, (x + 46, y + 2), (x + 100 * min(1, u * 3), y + 2), GOLD, .8)
                ov(fi, lambda img, x=x, y=y: blit(img, ARROW, x - 2, y - 5))
            if 0 <= age - s < .06:
                pstar(P, gx - 34, gy - 22 + j * 12, 4, WHITE, 1)
                pring(P, gx - 34, gy - 22 + j * 12, 10, 10, CYAN, 1)
        # 狙いの印（いちばん HP の多い敵）と、敵の身の時計（命中ごとに針が進む）
        if tg is not None and tgi is not None:
            e = sim.enemies[tgi]
            w, h = sim.size(e['kind'])
            if age < .8:
                fit = eout(clamp(age / .3))
                hw2, hh2 = w * .5 + 8 + 40 * (1 - fit), h * .5 + 8 + 40 * (1 - fit)
                a = 1.0 if age < .3 or int(age * 16) % 2 else .5
                ov(fi, lambda img, x=tg[0], y=tg[1], hw2=hw2, hh2=hh2, a=a: brackets(img, x, y, hw2, hh2, GOLD2, a))
            nh = sum(1 for (ht, *_r) in act['hits'] if ht <= t)
            if .3 < age < 1.1 and not (nh == 3 and age > .85):
                pclock(P, tg[0], tg[1], min(w, h) * .45, min(w, h) * .45, clamp((age - .3) / .2), GOLD, VIO, .7,
                       h1=nh * 2.1, h2=nh * 2.1 + age * 2, lit=nh * 4)
    elif n == 'slow':
        if age < .55:
            pstar(P, gx, gy, 2 + (int(qt(age) * 15) % 2), CYAN, 1)
            pring(P, gx, gy, 6 + 10 * clamp(age / .5), 6 + 10 * clamp(age / .5), VIO, .8, dash=6, rot=-age * 8)
        if .44 < age < .52 and act['aim'] is not None:
            u = (age - .44) / .08
            pline(P, (gx, gy), (gx + (act['aim'] - gx) * u, gy + (C.GROUND - gy) * u), WHITE, 1, w=2)
        if act['aim'] is not None:
            ax, gyy = act['aim'], C.GROUND + 4
            pburst(P, ax, gyy - 4, age - .5, 22, 77, sp=260, life=.6, cols=(GOLD, VIO, WHITE), grav=-40, up=120, stars=6, sq=.4)
    elif n == 'shuuen' and act['aim'] is not None:
        ax = act['aim']
        cy = SKY_Y
        # 杖の宝石：青 → 金
        if age < .96:
            pstar(P, gx, gy, 2 + int(qt(age) * 10) % 3, CYAN if age < .5 else GOLD, 1)
            pburst(P, gx, gy, (qt(age, 15) % .3), 6, int(age / .3) + 5, sp=-90, life=.3, cols=(GOLD, CYAN), grav=0)
        # 空の大時計：描き上がり → 12 の星が順に灯る → 長針が真下を指す
        if .12 < age < 1.24:
            k = clamp((qt(age) - .12) / .3)
            lit = int(clamp((age - .3) / .45) * 12)
            spin = -ein(clamp((age - .2) / .7)) * 6.28 * 3
            pclock(P, ax, cy, 72, 72, k, GOLD, VIO, 1.0, h1=spin * .3, h2=None, lit=lit)
            pdisk(P, ax, cy, 64, 64, DEEP, .55, dither=True)
            if .45 < age < NEEDLE_T[0]:
                hold = clamp((age - .7) / .2)
                ny = cy - 6 + 4 * (1 - hold)
                ov(fi, lambda img, ny=ny, w=.6 * (1 - hold) if age > .7 else 0: blit(img, NEEDLE, ax - 13, ny, white=w))
        # 落ちる針（0.3 倍の遅回しの中で）
        if NEEDLE_T[0] <= age < NEEDLE_T[1]:
            u = ein((age - NEEDLE_T[0]) / (NEEDLE_T[1] - NEEDLE_T[0]), 2)
            ny = cy - 6 + (C.GROUND - 128 - cy + 6) * u
            for j in range(4):
                pline(P, (ax + (j - 1.5) * 8, ny - 20 - j * 6), (ax + (j - 1.5) * 8, ny - 80 - 40 * u), WHITE if j % 3 == 0 else GOLD, .9)
            ov(fi, lambda img, ny=ny: blit(img, NEEDLE, ax - 13, ny))
        # 着弾：光の柱 → 地面の輪 → 時計が砕けて欠片が降る
        hu = age - NEEDLE_T[1]
        if 0 <= hu < .5:
            u = qt(hu)
            cw = int(28 * (1 - u / .3)) if u < .3 else 0
            if cw > 0:
                prect(P, ax - cw, 0, ax + cw, C.GROUND + 8, WHITE, 1)
                prect(P, ax - cw - 6, 0, ax + cw + 6, C.GROUND + 8, GOLD, .75)
            pburst(P, ax, C.GROUND, u, 46, 901, sp=460, life=.55, cols=(GOLD, WHITE, VIO), grav=700, up=260, stars=10, sz=(1, 2), sq=.8)
            if u < .3:
                pstar(P, ax, C.GROUND - 10, int(10 * (1 - u / .3)), GOLD, 1)
        if 0 <= hu < .7:
            pburst(P, ax, cy, hu, 40, 333, sp=200, life=.7, cols=(GOLD, VIO, GOLD2), grav=520, stars=8, sz=(1, 3))
            if hu < .1:
                pring(P, ax, cy, 72 + hu * 300, 72 + hu * 300, WHITE, 1 - hu / .1)
    put(Lf, P)


# ================================================================ 遅くする陣
def zone_fx(Lg, Lf, t, z, sim, fi):
    age = t - z['t0']
    left = z['t1'] - t
    if age < -.05 or left < -.1:
        return
    P = PL()
    x, gy, r = z['x'], C.GROUND + 4, z['r']
    ry = r * .2
    blink = 1.0 if left > .7 else (1.0 if int(left * 10) % 2 else .35)
    pop = 1 + .12 * (1 - clamp(age / .15))
    life = clamp(left / (z['t1'] - z['t0']))
    pclock(P, x, gy, r * pop, ry * pop, 1.0, GOLD, VIO, .85 * blink, h1=None, h2=None, ticks=True)
    pring(P, x, gy, r * .62, ry * .62, VIO, .6 * blink, dash=12, rot=-qt(t, 8) * .6)
    pdisk(P, x, gy, r * .98, ry * .98, DEEP, .55 * blink, dither=True)
    # 残り時間の針（1 周で陣が消える）：遊びの情報
    th = (1 - life) * 2 * math.pi
    pline(P, (x, gy), (x + math.sin(th) * r * .8, gy - math.cos(th) * ry * .8), WHITE, .9 * blink, w=2)
    if age < .25:
        rr = r * (1 + 1.2 * eout(age / .25))
        pring(P, x, gy, rr, rr * .2, WHITE, 1 - age / .25, th=2)
    put(Lg, P)
    # 陣の中を漂う時の欠片（1/8 秒ごとに進む＝遅い時間）
    Q = PL()
    tq = qt(t, 8)
    rng = np.random.default_rng(int(z['x']))
    for i in range(14):
        ph = rng.random()
        per = 1.6 + rng.random()
        u = ((tq / per) + ph) % 1
        px = x + (rng.random() * 2 - 1) * r * .85
        py = gy - 4 - u * 70
        prect(Q, px, py, px + 1, py + 1, GOLD if i % 3 else VIO, (1 - u) * .9 * blink)
    put(Lf, Q)
    # 遅くなった敵の印：頭の上の砂時計（ゆっくり裏返る）。小さな虫は紫に染まるだけ（印が多すぎないように）
    for e in sim.enemies:
        if e['kind'] != 'mite' and e['slowed'][fi] > 0 and (e['death'] is None or e['death'] > t) and not np.isnan(e['xs'][fi]):
            w, h = sim.size(e['kind'])
            ex, foot = sim.epos(e, fi, 'foot')
            hx, hy = ex + w * .25, foot - h - 26 + (2 if int(t * 3 + e['id']) % 2 else 0)
            spr = HG[int(t * 1.5 + e['id'] * .3) % 2]
            ov(fi, lambda img, hx=hx, hy=hy, spr=spr: blit(img, spr, hx - 7, hy))


# ================================================================ 局所の暗さ（終焉の針だけ・セレスと的のまわり）
def world_tint(img, t, sim):
    for a in sim.actions:
        if a['name'] != 'shuuen' or a['aim'] is None:
            continue
        age = t - a['t0']
        if not (.2 < age < 1.55):
            continue
        k = clamp((age - .2) / .2) * (1 - clamp((age - 1.3) / .25))
        k = math.ceil(k * 3) / 3 * .42
        yy, xx = np.mgrid[0:HH, 0:HW].astype(np.float32)
        d1 = ((xx * 2 - a['aim']) / 250) ** 2 + ((yy * 2 - 230) / 260) ** 2
        d2 = ((xx * 2 - C.CEL_X) / 80) ** 2 + ((yy * 2 - (C.CEL_FOOT - 50)) / 90) ** 2
        m = np.clip(1.6 - np.minimum(d1, d2), 0, 1)
        m = np.ceil(m * 3) / 3
        m = np.repeat(np.repeat(m, 2, 0), 2, 1)
        img = img * (1 - k * m[..., None]) + (DEEP * .25) * (k * m[..., None])
    return img


# ================================================================ 数字
NUMCOL = {'cyan': (.55, .85, 1.0), 'vio': (.78, .6, 1.0), 'gold': (1.0, .78, .3)}


def number(T, nm, age):
    """ドットの小さな数字。群れに当たったら 4 段にずらし、少しずつ遅らせて出す（重なりを減らす）"""
    big = nm['crit']
    grp = nm['col'] in ('gold', 'vio') and not (nm['col'] == 'vio' and nm['n'] >= 1000)
    slot = int(nm['n']) % 4 if grp else 0
    age = age - slot * .05
    life = .45 if nm['col'] == 'cyan' else (.35 if grp and nm['n'] < 1000 else .6)
    if age < 0 or age > life + .15:
        return
    if nm['col'] == 'vio' and nm['n'] >= 1000:
        k = 4 if big else 3
    else:
        k = 2
    if age < .06:
        k += 1
    if age > life and int(age * 30) % 2:
        return
    im = num_img(nm['n'], NUMCOL.get(nm['col'], (1, .8, .3)), k)
    hop = math.sin(math.pi * clamp(age / .22)) * (12 if big else 8)
    y = nm['y'] - hop - 6 * clamp(age / life) - slot * 11
    px, py = int(nm['x'] - im.width / 2) // 2 * 2, int(y - im.height) // 2 * 2
    T._comp(im, px, py)


# ================================================================ 画面（重ねる絵・揺れ・細い帯のカットイン）
def screen(img, t, sim, fi):
    if _OV['fi'] == fi:
        for fn in _OV['items']:
            fn(img)
    dx = dy = 0
    for a in sim.actions:
        age = t - a['t0']
        for (ht, kind, ids, prm) in a['hits']:
            hu = t - ht
            if a['name'] == 'shuuen' and 0 <= hu < .4:
                amp = 8 * (1 - hu / .4) ** 2
                s = 1 if int(hu * 30) % 2 else -1
                dx, dy = s * amp, -s * amp * .6
            elif a['name'] == 'tokiya' and 0 <= hu < .07 and prm.get('crit'):
                dx = 2
        if a['name'] == 'shuuen' and .04 <= age < .5:
            img = cutin(img, age - .04)
    dx, dy = int(round(dx / 2)) * 2, int(round(dy / 2)) * 2
    if dx or dy:
        img = np.roll(img, (dy, dx), (0, 1))
    return img


_HEAD = POSE['cast'][2]['n'][4:22, 6:42]
HEAD = _x2(_HEAD, 3)


def cutin(img, u):
    """細い帯（高さ 56px・0.45 秒）：右からのぞく顔と技の名"""
    y0, y1 = 26, 82
    k = 1 - clamp((u - .36) / .08)
    hh = int((y1 - y0) * k / 2) // 2 * 2
    if hh <= 0:
        return img
    cy = (y0 + y1) // 2
    xs = int(W * (1 - eout(clamp(u / .1)))) // 2 * 2
    a, b = cy - hh, cy + hh
    img[a:b, xs:] = img[a:b, xs:] * .25 + DEEP * .55
    for yy in range(a, b, 4):
        img[yy:yy + 2, xs:] = img[yy:yy + 2, xs:] * .85 + VIO * .08
    img[a:a + 2, xs:] = GOLD
    img[b - 2:b, xs:] = GOLD
    img[a:b, xs:xs + 4] = WHITE
    hx = xs + W - 300 - int(16 * clamp(u / .45))
    sub = img[a:b]
    hy0 = cy - HEAD.shape[0] // 2
    tmp = img.copy()
    X.paste(tmp, HEAD, hx, hy0)
    img[a:b, xs:] = tmp[a:b, xs:]
    if u > .06 and hh > 10:
        T = X.Text()
        T.metal('終焉の針', xs + W - 470, cy, 30, 1.0, (255, 255, 255), (255, 200, 80), sw=4, path=X.FONT_JA)
        lay = T.over(np.zeros_like(img))
        al = np.asarray(T.im).astype(np.float32)[..., 3:4] / 255
        al[:a] = 0
        al[b:] = 0
        img = img * (1 - al) + lay * al
    del sub
    return img


# ================================================================ 効果音（通常攻撃・命中・コインは短く軽く、奥義だけ重く）
def sound(mix, t, kind, arg):
    if kind == 'attack':
        mix.add(t + .12, X.mixa(X.s_tick(3800, .05), X.s_tone(1500, .07, .035, 2600, wave='sq')))
    elif kind == 'hit_attack':
        mix.add(t, X.mixa(X.s_thump(.14, 220, 90, .07), X.s_tick(5200, .03)))
    elif kind == 'tokiya':
        for j in range(3):
            mix.add(t + .1 + j * .08, X.s_tick(3000 + j * 400, .07))
            mix.add(t + .45 + j * .1, X.mixa(X.s_tone(900, .1, .05, 2400, wave='sq'), X.s_noise(.08, 3000, 6000, .04, att=.002, seed=j)))
    elif kind == 'hit_tokiya':
        mix.add(t, X.mixa(X.s_thump(.28, 180, 60, .14), X.s_ring(2600, .18, .04)))
    elif kind == 'slow':
        mix.add(t + .05, X.s_rise(.45, 300, 1400, .06))
        mix.add(t + .5, X.mixa(X.s_chime((3136, 2637, 2093, 1568), .05, .035), X.s_tone(330, .9, .06, 160)))
    elif kind == 'hit_slow':
        mix.add(t, X.s_thump(.1, 160, 70, .1))
    elif kind == 'shuuen':
        mix.add(t + .1, X.s_rise(.86, 160, 2600, .14))
        for j in range(12):
            mix.add(t + .3 + j * .0375, X.s_tick(2400 + j * 120, .05))
        mix.add(t + .94, X.s_noise(.3, 900, 5000, .12, att=.2, seed=11))
    elif kind == 'hit_shuuen':
        mix.add(t, X.mixa(X.s_boom(.75, 1.3), X.s_shatter(.18, .7), X.s_chime(v=.035)))
    elif kind == 'coin':
        mix.add(t, X.mixa(X.s_ring(2600, .1, .016), np.pad(X.s_ring(3900, .1, .014), (int(.05 * 44100), 0))))
