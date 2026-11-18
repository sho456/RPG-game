"""セレス HD の技・術の演出デモの土台（第 1 版）。skills.py から使う。

「セレスの光の言葉」：3 つの技で同じ部品・同じ色の役割を使い、まとまりを出す。
  色の役割  VIO（主：陰の術の紫）・GOLD（補：時計と星の金）・CYAN（杖の宝石の青＝溜めの色）・WHITE（芯）
  部品      clock：目盛り 12・ローマ数字の代わりに星・2 本の針の「刻印」（足元・空・敵の身に共通）
            star：4 方向の長い光＋45° の短い光＋白い芯（閃光はすべてこれ）
            impact：白い芯 → 星 → 放射 → 輪（細く明るい＋太く柔らかい）→ 火花 → 時の欠片（ガラスの三角）
時間：技の時刻 τ（ヒットストップで止まる・スローで遅れる）を Timeline が実時間のコマに対応づける。
粒はすべて τ と種の式で決まる（状態を持たない）ので、4 つのプロセスでコマを並べて描ける。
"""
import math
import os
import subprocess
import wave
from multiprocessing import Pool

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SPR = os.path.join(HERE, '..', 'sprites')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
FONT_JA = os.path.join(OUT, 'fonts', 'KaiseiTokumin-ExtraBold.ttf')
if not os.path.exists(FONT_JA):
    os.makedirs(os.path.dirname(FONT_JA), exist_ok=True)
    subprocess.run(['curl', '-sSfL', '-o', FONT_JA,
                    'https://raw.githubusercontent.com/google/fonts/main/ofl/kaiseitokumin/KaiseiTokumin-ExtraBold.ttf'])
FONT_NUM = '/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf'

W, H, FPS, S = 960, 540, 60, 2
SR = 44100
CEL_X, CEL_FOOT = 792, 452
# 敵：奥・ボス（単体の的）・手前
ENEMIES = [dict(x=118, foot=398, big=False, seed=3),
           dict(x=292, foot=466, big=True, seed=7),
           dict(x=140, foot=522, big=False, seed=5)]

VIO = np.array([0.62, 0.34, 1.00], np.float32)
DEEP = np.array([0.32, 0.10, 0.70], np.float32)
GOLD = np.array([1.00, 0.78, 0.30], np.float32)
AMBER = np.array([1.00, 0.55, 0.16], np.float32)
CYAN = np.array([0.36, 0.76, 1.00], np.float32)
WHITE = np.array([1.0, 1.0, 1.0], np.float32)
RED = np.array([1.0, 0.18, 0.22], np.float32)


def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def eout(t, p=3):
    t = clamp(t)
    return 1 - (1 - t) ** p


def ein(t, p=3):
    t = clamp(t)
    return t ** p


def ease(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def seg(t, a, b):
    """t が a→b の間で 0→1"""
    return clamp((t - a) / (b - a)) if b > a else float(t >= a)


def env(t, a, b, fi=.08, fo=.2):
    """a〜b の間だけ 1（入り fi・抜け fo）"""
    if t < a or t > b + fo:
        return 0.0
    k = seg(t, a, a + fi) if fi > 0 else 1.0
    if t > b:
        k *= 1 - seg(t, b, b + fo)
    return k


# ------------------------------------------------------------ 絵（スプライト）
def _load(name):
    im = Image.open(os.path.join(SPR, f'celes_hd_{name}.png')).convert('RGBA')
    return im


def _big(im, k=S):
    a = np.asarray(im.resize((im.width * k, im.height * k), Image.NEAREST)).astype(np.float32) / 255
    return a


CEL_N = {k: _load(k) for k in ['front', 'side', 'ready', 'dying', 'faint']}
CEL = {k: _big(v) for k, v in CEL_N.items()}


def _orb(im):
    a = np.asarray(im).astype(int)
    m = (a[..., 3] > 0) & (a[..., 2] > 190) & (a[..., 0] < 150) & (a[..., 1] > 110)
    ys, xs = np.where(m)
    return (xs.mean(), ys.mean())


# 宝石の位置（ネイティブ座標・キャンバス 80×104・足元の行 101）
ORB = {k: _orb(v) for k, v in CEL_N.items() if k in ('front', 'side', 'ready')}


def cel_origin(x, foot):
    return x - 40 * S, foot - 102 * S


def orb_pos(pose, x, foot):
    ox, oy = cel_origin(x, foot)
    px, py = ORB[pose]
    return ox + (px + .5) * S, oy + (py + .5) * S


# ---- 敵：時喰いの亡霊（コードで描くドット絵。頭巾・ぼろの裾・胸に壊れた歯車と紫の核）
RAMP = np.array([(14, 12, 28), (30, 28, 58), (50, 52, 92), (78, 86, 128), (120, 132, 172), (176, 186, 214)], np.float32)


def make_wraith(big, ph=0.0, seed=0):
    nw, nh = (78, 96) if big else (52, 64)
    yy, xx = np.mgrid[0:nh, 0:nw].astype(np.float32)
    cx = nw / 2 + .5 * math.sin(ph)
    m = np.zeros((nh, nw), bool)
    hr = nw * .2
    hy = nh * .25
    m |= ((xx - cx) ** 2 + ((yy - hy) / 1.08) ** 2) < hr ** 2               # 頭巾
    t = (yy - nh * .2) / (nh * .72)
    sway = 1.5 * np.sin(yy * .18 + ph * 2)
    half = (nw * .17 + nw * .27 * np.clip(t, 0, 1) ** .8)
    hem = nh * .86 + nh * .06 * np.abs(np.sin(xx * .55 + ph * 3 + seed)) + nh * .03 * np.sin(xx * 1.7 + seed)
    m |= (np.abs(xx - cx - sway * t) < half) & (yy > nh * .22) & (yy < hem)   # 体とぼろの裾
    for s in (-1, 1):                                                        # 腕（長い袖）と爪
        ax, ay = cx + s * nw * .36, nh * .5 + 2 * math.sin(ph * 2 + s)
        m |= (((xx - ax) / (nw * .085)) ** 2 + ((yy - ay) / (nh * .17)) ** 2) < 1
        for k in range(3):
            fx = ax + s * (k - 1) * nw * .035
            fy0 = ay + nh * .15
            m |= (np.abs(xx - fx) < (1.3 - (yy - fy0) / (nh * .08))) & (yy > fy0) & (yy < fy0 + nh * .08)
        hx0, hy0 = cx + s * hr * .55, hy - hr * .7                             # 角
        for k in range(int(nh * .16)):
            u = k / (nh * .16)
            px = hx0 + s * (u * nw * .16)
            py = hy0 - u * nh * .12 + (u ** 2) * nh * .02
            r = 2.2 * (1 - u) + .4
            m |= ((xx - px) ** 2 + (yy - py) ** 2) < r * r
    # 陰影：左上から光
    mf = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 2.2)
    gy, gx = np.gradient(mf)
    light = (gx * .6 + gy * .8) * 6                       # 外向き法線と光の向き
    depth = cv2.distanceTransform(m.astype(np.uint8), cv2.DIST_L2, 3)
    v = 2.2 + np.clip(light, -1.6, 1.6) - (xx - cx) / nw * 1.6 - (yy / nh) * 1.0 + np.clip(depth / 6, 0, .6)
    v += .45 * np.sin(xx * .9 + np.sin(yy * .1) * 2) * (yy > nh * .45)        # 裾のひだ
    idx = np.clip(np.round(v), 0, 4).astype(int)
    rgb = RAMP[idx]
    # 頭巾の中の闇と目
    face = (((xx - cx - nw * .02) / (hr * .62)) ** 2 + ((yy - hy - 1) / (hr * .52)) ** 2) < 1
    rgb[face] = (6, 4, 14)
    for s in (-1, 1):
        ex, ey = int(round(cx + s * hr * .3 + nw * .01)), int(round(hy))
        rgb[ey, ex - 1:ex + 1] = (255, 96, 70)
        rgb[ey - 1, ex - 1] = (255, 214, 150)
    # 胸の壊れた歯車と紫の核
    gx0, gy0 = cx, nh * .47
    rr = np.sqrt((xx - gx0) ** 2 + (yy - gy0) ** 2)
    ang = np.arctan2(yy - gy0, xx - gx0)
    gr = nw * .13
    teeth = (rr < gr + 1.6 * (np.cos(ang * 8) > .3)) & (rr > gr - 2.2) & ~((ang > .3) & (ang < 1.3))
    rgb[teeth & m] = (128, 96, 54)
    rgb[teeth & m & (yy < gy0)] = (178, 140, 74)
    core = (np.abs(xx - gx0) + np.abs(yy - gy0) * .8) < gr * .62
    rgb[core] = (150, 40, 190)
    rgb[core & ((xx - gx0) + (yy - gy0) < -1)] = (226, 120, 255)
    rgb[core & ((xx - gx0) + (yy - gy0) > 2)] = (80, 16, 120)
    # 外の輪郭
    edge = cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & ~m
    out = np.zeros((nh + 2, nw + 2, 4), np.float32)
    full = np.zeros((nh, nw, 4), np.float32)
    full[m, :3] = rgb[m] / 255
    full[m, 3] = 1
    full[edge, :3] = (8 / 255, 5 / 255, 18 / 255)
    full[edge, 3] = 1
    out[1:-1, 1:-1] = full
    return out


def _bigarr(a, k=S):
    return np.repeat(np.repeat(a, k, 0), k, 1)


WRAITH = {}


def wraith(e, frame):
    key = (e['big'], frame % 8, e['seed'])
    if key not in WRAITH:
        WRAITH[key] = _bigarr(make_wraith(e['big'], ph=(frame % 8) / 8 * 2 * math.pi, seed=e['seed']))
    return WRAITH[key]


# ------------------------------------------------------------ 背景
def _noise(h, w, s, seed):
    r = np.random.default_rng(seed).random((h // s + 2, w // s + 2)).astype(np.float32)
    return cv2.resize(r, (w, h), interpolation=cv2.INTER_CUBIC)


def make_bg():
    """夜の時計塔の広場。キャラより暗く・彩度を低く"""
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    sky = np.array([.05, .055, .12]) * (1 - yy) + np.array([.17, .15, .25]) * yy
    img = np.repeat(sky[:, None, :], W, 1).reshape(H, W, 3).astype(np.float32)
    img = np.broadcast_to(img, (H, W, 3)).copy()
    xx = np.arange(W, dtype=np.float32)[None, :]
    yv = np.arange(H, dtype=np.float32)[:, None]
    d = np.sqrt((xx - 610) ** 2 + (yv - 92) ** 2)
    img += (np.exp(-(d / 160) ** 2) * .10)[..., None] * np.array([.7, .7, 1.0])
    img[d < 40] = (.62, .62, .70)
    img[(d < 40) & ((xx - 600) ** 2 + (yv - 84) ** 2 < 34 ** 2)] = (.70, .70, .78)
    cl = _noise(H, W, 60, 4) * _noise(H, W, 18, 5)
    img += (np.clip(cl - .35, 0, 1) * .10 * (yy < .55))[..., None] * np.array([.6, .6, .8])
    # 遠くの塔（ひとつは壊れた大時計）
    sil = np.zeros((H, W), np.uint8)
    hz = 300
    rng = np.random.default_rng(2)
    x = 0
    while x < W:
        w = int(rng.integers(30, 70))
        h = int(rng.integers(20, 70))
        cv2.rectangle(sil, (x, hz - h), (x + w, hz), 1, -1)
        if rng.random() < .4:
            pts = np.array([[x, hz - h], [x + w // 2, hz - h - int(rng.integers(20, 50))], [x + w, hz - h]], np.int32)
            cv2.fillPoly(sil, [pts], 1)
        x += w + int(rng.integers(-6, 14))
    cv2.rectangle(sil, (560, 150), (640, hz), 1, -1)
    cv2.fillPoly(sil, [np.array([[552, 150], [600, 96], [648, 150]], np.int32)], 1)
    img[sil > 0] = img[sil > 0] * .35 + np.array([.07, .07, .12]) * .65
    cv2.circle(img, (600, 196), 26, (.20, .19, .26), 2, cv2.LINE_AA)
    cv2.line(img, (600, 196), (600, 176), (.22, .21, .28), 2, cv2.LINE_AA)
    cv2.line(img, (600, 196), (614, 204), (.22, .21, .28), 2, cv2.LINE_AA)
    # 床：石畳（奥へすぼまる）
    fl = yv >= hz
    t = np.clip((yv - hz) / (H - hz), 0, 1)
    floor = np.array([.10, .10, .15]) * (1 - t[..., None]) + np.array([.20, .18, .24]) * t[..., None]
    img = np.where(fl[..., None], np.broadcast_to(floor, (H, W, 3)), img).astype(np.float32)
    vp = (480, 170)
    for i in range(-14, 15):
        xb = 480 + i * 90
        cv2.line(img, (int(vp[0] + (xb - vp[0]) * (hz - vp[1]) / (H - vp[1])), hz), (xb, H), (.08, .08, .12), 1, cv2.LINE_AA)
    k = 0
    y = hz + 4.0
    while y < H:
        cv2.line(img, (0, int(y)), (W, int(y)), (.08, .08, .12), 1, cv2.LINE_AA)
        k += 1
        y += 4 + k * 3.2
    img += ((_noise(H, W, 8, 9) - .5) * .05 * fl)[..., None]
    # 左上からの光の帯
    band = np.clip(1 - np.abs((xx * .55 + yv) - 420) / 160, 0, 1) * .05
    img += band[..., None] * np.array([.7, .7, .9])
    vig = 1 - .55 * (((xx - W / 2) / W) ** 2 + ((yv - H / 2) / H) ** 2) * 2
    img *= np.clip(vig, 0, 1)[..., None]
    return np.clip(cv2.GaussianBlur(img, (0, 0), .8), 0, 1).astype(np.float32)


def make_night():
    """奥義の夜空：銀河の帯と星"""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32)
    img[:] = (.015, .01, .04)
    u = (xx * .45 - yy + 120) / 160
    band = np.exp(-u ** 2)
    n = _noise(H, W, 40, 11) * .6 + _noise(H, W, 12, 12) * .4
    neb = np.clip(band * (n * 1.3 - .25), 0, 1)
    img += neb[..., None] * np.array([.30, .14, .55]) * .9
    img += (np.clip(band * (_noise(H, W, 24, 13) - .55), 0, 1) * 1.2)[..., None] * np.array([.15, .35, .6])
    rng = np.random.default_rng(14)
    for _ in range(900):
        x, y = rng.integers(0, W), rng.integers(0, H)
        b = rng.random() ** 3 * (0.5 + band[y, x])
        img[y, x] += b
    for _ in range(26):
        x, y = rng.integers(0, W), rng.integers(0, 330)
        s = rng.integers(3, 8)
        cv2.line(img, (int(x - s), int(y)), (int(x + s), int(y)), (.8, .8, 1), 1, cv2.LINE_AA)
        cv2.line(img, (int(x), int(y - s)), (int(x), int(y + s)), (.8, .8, 1), 1, cv2.LINE_AA)
    img = cv2.GaussianBlur(img, (0, 0), .6)
    # 床：暗い水鏡
    hz = 300
    fl = yy >= hz
    t = np.clip((yy - hz) / (H - hz), 0, 1)
    refl = cv2.flip(img[hz - (H - hz):hz], 0) * .25
    img[hz:] = img[hz:] * 0 + refl * (1 - t[hz:, :, None] * .6) + np.array([.04, .03, .08])
    cv2.line(img, (0, hz), (W, hz), (.25, .2, .45), 1, cv2.LINE_AA)
    return np.clip(img, 0, 1).astype(np.float32)


BG = make_bg()
NIGHT = make_night()


# ------------------------------------------------------------ 光を足す道具（float32 の層に加算）
def _patch(L, x0, y0, x1, y1):
    x0, y0 = max(0, int(x0)), max(0, int(y0))
    x1, y1 = min(W, int(math.ceil(x1))), min(H, int(math.ceil(y1)))
    if x1 <= x0 or y1 <= y0:
        return None
    return x0, y0, x1, y1


def _add(L, box, m, col, a):
    x0, y0, x1, y1 = box
    L[y0:y1, x0:x1] += m[..., None] * (np.asarray(col, np.float32) * a)


SH = 4
SC = 1 << SH


def _p(x, y, ox, oy):
    return (int(round((x - ox) * SC)), int(round((y - oy) * SC)))


def blob(L, x, y, r, col, a=1.0):
    """柔らかい丸い光（ガウス）"""
    if a <= 0 or r <= 0:
        return
    R = r * 2.6
    box = _patch(L, x - R, y - R, x + R, y + R)
    if not box:
        return
    x0, y0, x1, y1 = box
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    m = np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (r * r)))
    _add(L, box, m, col, a)


def oval(L, x, y, rx, ry, col, a=1.0, soft=.3):
    if a <= 0:
        return
    box = _patch(L, x - rx - 2, y - ry - 2, x + rx + 2, y + ry + 2)
    if not box:
        return
    x0, y0, x1, y1 = box
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = np.sqrt(((xx - x) / max(rx, .1)) ** 2 + ((yy - y) / max(ry, .1)) ** 2)
    m = np.clip((1 - d) / soft, 0, 1)
    _add(L, box, m, col, a)


def line(L, p0, p1, w, col, a=1.0):
    if a <= 0:
        return
    pad = w + 2
    box = _patch(L, min(p0[0], p1[0]) - pad, min(p0[1], p1[1]) - pad, max(p0[0], p1[0]) + pad, max(p0[1], p1[1]) + pad)
    if not box:
        return
    x0, y0, x1, y1 = box
    m = np.zeros((y1 - y0, x1 - x0), np.float32)
    cv2.line(m, _p(*p0, x0, y0), _p(*p1, x0, y0), 1.0, max(1, int(round(w))), cv2.LINE_AA, SH)
    _add(L, box, m, col, a)


def poly(L, pts, col, a=1.0):
    if a <= 0:
        return
    pts = np.asarray(pts, np.float32)
    box = _patch(L, pts[:, 0].min() - 2, pts[:, 1].min() - 2, pts[:, 0].max() + 2, pts[:, 1].max() + 2)
    if not box:
        return
    x0, y0, x1, y1 = box
    m = np.zeros((y1 - y0, x1 - x0), np.float32)
    q = np.round((pts - [x0, y0]) * SC).astype(np.int32)
    cv2.fillPoly(m, [q], 1.0, cv2.LINE_AA, SH)
    _add(L, box, m, col, a)


def ring(L, x, y, rx, ry, w, col, a=1.0, a0=0, a1=360, rot=0):
    if a <= 0 or rx <= 0:
        return
    pad = w + 2
    box = _patch(L, x - rx - pad, y - ry - pad, x + rx + pad, y + ry + pad)
    if not box:
        return
    x0, y0, x1, y1 = box
    m = np.zeros((y1 - y0, x1 - x0), np.float32)
    cv2.ellipse(m, _p(x, y, x0, y0), (int(rx * SC), int(max(ry, .5) * SC)), rot, a0, a1, 1.0,
                max(1, int(round(w))), cv2.LINE_AA, SH)
    _add(L, box, m, col, a)


def taper(L, pts, w0, w1, col, a=1.0):
    """太さが w0→w1 に変わる帯（尾・針・光線）"""
    pts = np.asarray(pts, np.float32)
    if len(pts) < 2 or a <= 0:
        return
    d = np.diff(pts, axis=0)
    n = np.stack([-d[:, 1], d[:, 0]], 1)
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-6
    n = np.vstack([n, n[-1:]])
    ws = np.linspace(w0, w1, len(pts))[:, None] / 2
    left, right = pts + n * ws, pts - n * ws
    poly(L, np.vstack([left, right[::-1]]), col, a)


def star(L, x, y, size, col, a=1.0, rot=0.0, sub=None):
    """星の閃光：4 方向の長い光＋45° の短い光＋白い芯"""
    if a <= 0 or size <= 0:
        return
    sub = col if sub is None else sub
    for k in range(4):
        th = rot + k * math.pi / 2
        c, s = math.cos(th), math.sin(th)
        poly(L, [(x + c * size, y + s * size), (x - s * size * .07, y + c * size * .07),
                 (x - c * size * .1, y - s * size * .1), (x + s * size * .07, y - c * size * .07)], col, a)
        th2 = th + math.pi / 4
        c, s = math.cos(th2), math.sin(th2)
        poly(L, [(x + c * size * .42, y + s * size * .42), (x - s * size * .05, y + c * size * .05),
                 (x + s * size * .05, y - c * size * .05)], sub, a * .8)
    blob(L, x, y, size * .14, WHITE, a * 1.6)
    blob(L, x, y, size * .35, col, a * .5)


def clock(L, x, y, r, k, t, col=GOLD, sub=VIO, a=1.0, ry=None, hands=True, h1=0.0, h2=0.0, stars=12, lit=12, w=2.0):
    """刻印：二重の輪・目盛り 60・星の印 12・針 2 本。ry で地面に寝かせる。k は描き上がり（0→1）"""
    ry = r if ry is None else ry
    sq = ry / r
    ring(L, x, y, r, ry, w, col, a, 0, 360 * clamp(k * 1.4))
    ring(L, x, y, r * .86, ry * .86, max(1, w * .6), sub, a * .9, 0, 360 * clamp(k * 1.4 - .2))
    ring(L, x, y, r * 1.08, ry * 1.08, 1, col, a * .5 * clamp(k * 2 - 1))
    n = int(60 * clamp(k * 1.3 - .1))
    for i in range(n):
        th = i / 60 * 2 * math.pi + t * .2
        ln = .1 if i % 5 == 0 else .045
        c, s = math.cos(th), math.sin(th)
        line(L, (x + c * r * .86, y + s * ry * .86), (x + c * r * (.86 - ln), y + s * ry * (.86 - ln)),
             1.6 if i % 5 == 0 else 1, col if i % 5 == 0 else sub, a * .8)
    for i in range(min(stars, lit)):
        th = -math.pi / 2 + i / stars * 2 * math.pi
        sx, sy = x + math.cos(th) * r * .97, y + math.sin(th) * ry * .97
        star(L, sx, sy, r * .09 * (1.0 if sq > .6 else .7), col, a * clamp(k * 2 - 1), rot=math.pi / 4 * 0)
    if hands and k > .5:
        hk = clamp(k * 2 - 1)
        for th, ln, wd in ((h1, .62, 4), (h2, .82, 2.5)):
            c, s = math.cos(th - math.pi / 2), math.sin(th - math.pi / 2)
            taper(L, [(x - c * r * .1, y - s * ry * .1), (x + c * r * ln * hk, y + s * ry * ln * hk)], wd, .5, WHITE, a * .9)
        blob(L, x, y, r * .05, WHITE, a)


# ---- 粒（状態を持たない。種と経過時間で決まる）
def burst(L, x, y, age, n, seed, sp=420, life=.6, col=GOLD, kind='spark', grav=0.0, drag=3.0,
          size=(2, 4), a0=0, a1=360, up=0.0, lenk=.05, a=1.0, sq=1.0):
    if age < 0:
        return
    rng = np.random.default_rng(seed)
    th = np.radians(rng.uniform(a0, a1, n))
    v = sp * (.25 + .75 * rng.random(n) ** .7)
    lf = life * (.4 + .6 * rng.random(n))
    sz = rng.uniform(size[0], size[1], n)
    rot0 = rng.uniform(0, 6.28, n)
    for i in range(n):
        if age > lf[i]:
            continue
        fade = (1 - age / lf[i]) ** 1.3
        vx, vy = math.cos(th[i]) * v[i], math.sin(th[i]) * v[i] * sq - up
        dk = (1 - math.exp(-drag * age)) / drag
        px, py = x + vx * dk, y + vy * dk + .5 * grav * age * age
        if kind == 'spark':
            cvx, cvy = vx * math.exp(-drag * age), vy * math.exp(-drag * age) + grav * age
            sp2 = math.hypot(cvx, cvy) + 1e-6
            ln = min(60, sp2 * lenk) + sz[i]
            line(L, (px, py), (px - cvx / sp2 * ln, py - cvy / sp2 * ln), sz[i] * .6, col, a * fade)
        elif kind == 'ember':
            blob(L, px, py, sz[i] * .7, col, a * fade * 1.3)
        elif kind == 'star':
            star(L, px, py, sz[i] * 2.4, col, a * fade, rot=rot0[i] * .1)
        elif kind == 'shard':
            r = rot0[i] + age * 9 * (1 if i % 2 else -1)
            s = sz[i] * 1.6
            pts = [(px + math.cos(r) * s, py + math.sin(r) * s), (px + math.cos(r + 2.4) * s * .5, py + math.sin(r + 2.4) * s * .5),
                   (px + math.cos(r + 3.6) * s * .7, py + math.sin(r + 3.6) * s * .7)]
            poly(L, pts, col, a * fade * (.6 + .4 * math.sin(r * 2) ** 2))


def impact(L, x, y, age, s, seed, col=VIO, sub=GOLD, a=1.0):
    """着弾：白い芯 → 星 → 放射 → 輪 → 火花 → 時の欠片。広がりは速く・消えるのは遅く"""
    if age < 0 or age > 1.4:
        return
    k = eout(age / .1)
    fade = 1 - seg(age, .05, .5)
    blob(L, x, y, 26 * s * (1 + age * 2), WHITE, a * 2.2 * (1 - seg(age, 0, .14)))
    star(L, x, y, 120 * s * (.5 + .5 * k) * (1 - seg(age, .12, .4) * .7), WHITE, a * (1 - seg(age, .05, .35)) * 1.2,
         rot=age * .6, sub=sub)
    rng = np.random.default_rng(seed)
    for i in range(14):
        th = rng.uniform(0, 6.28)
        ln = rng.uniform(60, 160) * s * eout(age / .12)
        taper(L, [(x + math.cos(th) * 16 * s, y + math.sin(th) * 16 * s), (x + math.cos(th) * ln, y + math.sin(th) * ln)],
              4 * s, .3, col if i % 3 else sub, a * (1 - seg(age, .04, .3)))
    ring(L, x, y, 150 * s * eout(age / .35), 150 * s * eout(age / .35) * .9, 3, WHITE, a * (1 - seg(age, .08, .45)))
    ring(L, x, y, 110 * s * eout(age / .5), 100 * s * eout(age / .5), 10 * s, col, a * .5 * (1 - seg(age, .1, .7)))
    burst(L, x, y, age, int(40 * s), seed + 1, sp=700 * s, life=.55, col=sub, kind='spark', grav=500, lenk=.04, size=(2, 3.5), a=a)
    burst(L, x, y, age, int(18 * s), seed + 2, sp=300 * s, life=1.1, col=col, kind='shard', grav=260, drag=2.5, size=(3, 6), a=a)
    burst(L, x, y, age, int(22 * s), seed + 3, sp=160 * s, life=1.2, col=sub, kind='ember', grav=-40, drag=2, size=(1.5, 3), a=a * fade + .2 * a)


# ------------------------------------------------------------ 合成
def glow(L, k1=.9, k2=1.25):
    small = cv2.resize(L, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    b2 = cv2.resize(cv2.GaussianBlur(small, (0, 0), 6), (W, H), interpolation=cv2.INTER_LINEAR)
    b1 = cv2.GaussianBlur(L, (0, 0), 3.5)
    return L + b1 * k1 + b2 * k2


def light_on(img, L, k1=.9, k2=1.25):
    """強い光ほど白へ（色の光が重なると白く飛ぶ）"""
    G = glow(L, k1, k2)
    G = 1 - np.exp(-G * 1.15)
    return 1 - (1 - img) * (1 - np.clip(G, 0, 1))


def paste(img, spr, x0, y0, alpha=1.0, tint=None, tk=0.0, white=0.0, mul=1.0, mask=None):
    """スプライト（float RGBA）を置く。tint で色に染め、white で白い影、mul で暗く"""
    h, w = spr.shape[:2]
    x0, y0 = int(round(x0)), int(round(y0))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    dx1, dy1 = min(W, x0 + w), min(H, y0 + h)
    if dx1 <= dx0 or dy1 <= dy0:
        return
    s = spr[sy0:sy0 + dy1 - dy0, sx0:sx0 + dx1 - dx0]
    rgb = s[..., :3] * mul
    if tint is not None and tk > 0:
        lum = (rgb @ np.array([.3, .55, .15], np.float32))[..., None]
        rgb = rgb * (1 - tk) + (lum * .6 + .4) * np.asarray(tint) * tk
    if white > 0:
        rgb = rgb * (1 - white) + white
    al = s[..., 3:4] * alpha
    if mask is not None:
        al = al * mask[sy0:sy0 + dy1 - dy0, sx0:sx0 + dx1 - dx0, None]
    reg = img[dy0:dy1, dx0:dx1]
    img[dy0:dy1, dx0:dx1] = reg * (1 - al) + rgb * al


def mosaic_mask(spr, k, seed=0, blk=4):
    """市松のモザイクで消える（k: 0→1 で消える割合）"""
    h, w = spr.shape[:2]
    rng = np.random.default_rng(seed)
    bh, bw = h // (blk * S) + 1, w // (blk * S) + 1
    r = rng.random((bh, bw))
    yy, xx = np.mgrid[0:bh, 0:bw]
    r = r * .6 + ((yy + xx) % 2) * .4
    m = (r >= k).astype(np.float32)
    return np.repeat(np.repeat(m, blk * S, 0), blk * S, 1)[:h, :w]


def cel(img, pose, x, foot, **kw):
    ox, oy = cel_origin(x, foot)
    paste(img, CEL[pose], ox, oy, **kw)


def enemy_draw(img, e, fi, dx=0, dy=0, **kw):
    sp = wraith(e, fi // 6)
    bob = 4 * math.sin(fi / 60 * 2.2 + e['seed'])
    h, w = sp.shape[:2]
    paste(img, sp, e['x'] - w / 2 + dx, e['foot'] - h + bob + dy - 6, **kw)


def shadow(img, x, foot, rx, a=.45):
    yy, xx = np.mgrid[0:H, 0:W]
    box = _patch(img, x - rx, foot - 12, x + rx, foot + 12)
    if not box:
        return
    x0, y0, x1, y1 = box
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = np.sqrt(((xx - x) / rx) ** 2 + ((yy - foot) / (rx * .22)) ** 2)
    m = np.clip(1 - d, 0, 1) ** .7 * a
    img[y0:y1, x0:x1] *= (1 - m[..., None])


def ecenter(e):
    h = (96 if e['big'] else 64) * S
    return e['x'], e['foot'] - h * .5


# ------------------------------------------------------------ 文字（PIL。最後に重ねる）
_FC = {}


def font(path, size):
    k = (path, int(size))
    if k not in _FC:
        _FC[k] = ImageFont.truetype(path, int(size))
    return _FC[k]


class Text:
    def __init__(self):
        self.im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def bubble(self, text, x, y, k):
        """技名の吹き出し（白・黒い縁・しっぽは術者へ）"""
        if k <= 0:
            return
        f = font(FONT_JA, 30)
        tw = self.d.textlength(text, font=f)
        sc = .6 + .4 * eout(k / .5, 2) + .08 * math.sin(min(k, .5) / .5 * math.pi)
        bw, bh = (tw + 44) * sc, 54 * sc
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        x0, y0 = x - bw / 2, y - bh / 2
        d.polygon([(x + bw * .18, y0 + bh - 4), (x + bw * .34, y0 + bh + 18 * sc), (x + bw * .3, y0 + bh - 4)], fill=(255, 255, 255), outline=(20, 16, 32))
        d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=int(14 * sc), fill=(255, 255, 255), outline=(20, 16, 32), width=3)
        d.polygon([(x + bw * .18 + 2, y0 + bh - 6), (x + bw * .33, y0 + bh + 14 * sc), (x + bw * .29, y0 + bh - 6)], fill=(255, 255, 255))
        f2 = font(FONT_JA, 30 * sc)
        d.text((x, y + 1), text, font=f2, fill=(24, 16, 40), anchor='mm')
        a = min(1.0, k / .08)
        if a < 1:
            lay.putalpha(lay.getchannel('A').point(lambda v: int(v * a)))
        self.im.alpha_composite(lay)

    def metal(self, text, x, y, size, a=1.0, top=(255, 255, 255), bot=(255, 196, 70), stroke=(30, 12, 50), sw=5,
              path=FONT_NUM, anchor='mm', glowc=None):
        """金属の文字（上が白・下が金のグラデーション＋濃い縁）"""
        if a <= 0:
            return
        f = font(path, size)
        box = self.d.textbbox((0, 0), text, font=f, anchor='lt', stroke_width=sw)
        tw, th = box[2] - box[0] + 8, box[3] - box[1] + 8
        m = Image.new('L', (tw, th), 0)
        ImageDraw.Draw(m).text((4 - box[0], 4 - box[1]), text, font=f, fill=255, anchor='lt')
        st = Image.new('L', (tw, th), 0)
        ImageDraw.Draw(st).text((4 - box[0], 4 - box[1]), text, font=f, fill=255, anchor='lt', stroke_width=sw)
        g = np.linspace(0, 1, th)[:, None, None]
        grad = (np.array(top) * (1 - g) + np.array(bot) * g)
        grad = np.where(g > .52, grad * .9, grad)
        col = np.broadcast_to(grad, (th, tw, 3)).astype(np.uint8)
        lay = np.zeros((th, tw, 4), np.uint8)
        sa = np.asarray(st).astype(np.float32) / 255
        ma = np.asarray(m).astype(np.float32) / 255
        rgb = np.array(stroke)[None, None] * (1 - ma[..., None]) + col * ma[..., None]
        lay[..., :3] = rgb.astype(np.uint8)
        lay[..., 3] = (np.maximum(sa, ma) * 255 * a).astype(np.uint8)
        im = Image.fromarray(lay, 'RGBA')
        if anchor == 'mm':
            px, py = int(x - tw / 2), int(y - th / 2)
        else:
            px, py = int(x), int(y - th / 2)
        if glowc is not None:
            gl = Image.new('RGBA', im.size, glowc + (0,))
            gl.putalpha(Image.fromarray((sa * 200 * a).astype(np.uint8)))
            from PIL import ImageFilter
            gl = gl.filter(ImageFilter.GaussianBlur(8))
            self.im.alpha_composite(gl, (max(0, px), max(0, py))) if px >= 0 and py >= 0 else None
        self._comp(im, px, py)

    def _comp(self, im, px, py):
        x0, y0 = max(0, px), max(0, py)
        cx0, cy0 = x0 - px, y0 - py
        cx1, cy1 = min(im.width, W - px), min(im.height, H - py)
        if cx1 <= cx0 or cy1 <= cy0:
            return
        self.im.alpha_composite(im.crop((cx0, cy0, cx1, cy1)), (x0, y0))

    def number(self, n, x, y, age, size=40, crit=False, life=.8):
        """ダメージの数字：大きく出て縮む・少し上がる・消える。右の桁から数え上がる"""
        if age < 0 or age > life + .3:
            return
        digits = str(n)
        shown = len(digits) if age > .12 else max(1, int(len(digits) * age / .12) + 1)
        txt = digits[-shown:].rjust(len(digits), ' ').strip()
        sc = 1 + .6 * (1 - eout(age / .1))
        a = 1 - seg(age, life, life + .3)
        top, bot = ((255, 255, 255), (255, 200, 80)) if not crit else ((255, 255, 230), (255, 120, 40))
        self.metal(txt, x, y - 10 * eout(age / .2), size * sc, a, top, bot)

    def label(self, text, x, y, age, size=26, col=((255, 255, 255), (190, 140, 255)), path=None, life=1.0):
        if age < 0 or age > life + .25:
            return
        sc = 1 + .4 * (1 - eout(age / .1))
        a = 1 - seg(age, life, life + .25)
        self.metal(text, x, y - 6 * eout(age / .2), size * sc, a, col[0], col[1], sw=4, path=path or FONT_NUM)

    def over(self, img):
        a = np.asarray(self.im).astype(np.float32) / 255
        return img * (1 - a[..., 3:4]) + a[..., :3] * a[..., 3:4]


# ------------------------------------------------------------ 時間（ヒットストップ・スロー）
class Timeline:
    def __init__(self, T, stops=(), slows=()):
        self.T = T
        stops = sorted(stops)
        self.taus, self.frozen = [], []
        tau, si = 0.0, 0
        while tau < T:
            self.taus.append(tau)
            self.frozen.append(False)
            r = 1.0
            for a, b, k in slows:
                if a <= tau < b:
                    r = k
            nt = tau + r / FPS
            while si < len(stops) and stops[si][0] <= nt:
                st, nfr = stops[si]
                if st > tau:
                    nt = st
                for _ in range(nfr):
                    self.taus.append(st)
                    self.frozen.append(True)
                si += 1
            tau = nt
        self.n = len(self.taus)
        self._t = np.array(self.taus)

    def fi_of(self, tau):
        i = int(np.searchsorted(self._t, tau - 1e-9))
        return min(i, self.n - 1)

    def since(self, fi, tau):
        """実時間で、τ の出来事から何秒たったか"""
        return (fi - self.fi_of(tau)) / FPS


# ------------------------------------------------------------ 効果音（numpy で合成）
def _env(n, att=.004, dec=.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / max(dec, 1e-4))
    return e


def s_tone(f0, dur, v=.2, f1=None, dec=None, wave='sine'):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f1 = f0 if f1 is None else f1
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) if wave == 'sine' else np.sign(np.sin(ph)) * .5 if wave == 'sq' else (2 * ((ph / 2 / np.pi) % 1) - 1) * .6
    return x * _env(n, .003, dec or dur / 3) * v


def s_noise(dur, f0, f1, v=.2, q=1.5, att=.02, dec=None, seed=0):
    """帯域を動かすノイズ（風・炎・崩れ）。短い区間ごとに帯域通過"""
    from scipy.signal import butter, sosfilt
    n = int(dur * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    out = np.zeros(n)
    step = int(.02 * SR)
    win = np.hanning(step * 2)
    for i in range(0, n, step):
        tt = i / n
        fc = f0 * (f1 / f0) ** tt
        lo, hi = max(30, fc / (1 + 1 / q)), min(SR / 2 - 100, fc * (1 + 1 / q))
        sos = butter(2, [lo, hi], 'band', fs=SR, output='sos')
        a, b = max(0, i - step), min(n, i + step)
        seg_ = sosfilt(sos, x[a:b]) * win[:b - a]
        out[a:b] += seg_
    t = np.arange(n) / SR
    e = np.minimum(1, t / att) * (np.exp(-t / dec) if dec else np.clip((dur - t) / (dur * .5), 0, 1))
    return out * e * v / (np.abs(out).max() + 1e-9)


def mixa(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[:len(x)] += x
    return out


def s_ring(f=4000, dur=.3, v=.08):
    return mixa(*[s_tone(f * m, dur * (1 - i * .2), v / (i + 1), dec=dur * (.5 - i * .1)) for i, m in enumerate((1, 1.87, 2.71))])


def s_thump(v=.5, f0=140, f1=42, dur=.3):
    return s_tone(f0, dur, v, f1, dec=dur * .4)


def s_boom(v=.7, dur=1.4, seed=1):
    n = int(dur * SR)
    a = s_tone(70, dur, v * .9, 32, dec=dur * .35)
    b = s_noise(dur, 900, 80, v * .7, q=.8, att=.003, dec=dur * .25, seed=seed)
    c = s_noise(.25, 5000, 1500, v * .35, q=.7, att=.001, dec=.06, seed=seed + 1)
    out = np.zeros(n)
    out[:len(a)] += a
    out[:len(b)] += b
    out[:len(c)] += c
    return out


def s_tick(f=3200, v=.12):
    return mixa(s_tone(f, .05, v, f * .8, dec=.012), s_tone(f * 2.3, .03, v * .4, dec=.006))


def s_shatter(v=.25, dur=.9, seed=2):
    rng = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR))
    for i in range(26):
        t0 = int(rng.random() ** 2 * dur * .7 * SR)
        f = rng.uniform(2500, 9000)
        x = s_tone(f, .12, v * rng.uniform(.2, .6), f * .97, dec=.03)
        out[t0:t0 + len(x)] += x[:len(out) - t0]
    out += np.pad(s_noise(.3, 7000, 3000, v * .5, q=1, att=.001, dec=.08, seed=seed), (0, len(out)))[:len(out)]
    return out


def s_chime(fs=(4186, 3520, 3136, 2637, 2093), gap=.07, v=.06):
    out = np.zeros(int((len(fs) * gap + .8) * SR))
    for i, f in enumerate(fs):
        x = s_ring(f, .7, v)
        t0 = int(i * gap * SR)
        out[t0:t0 + len(x)] += x
    return out


def s_rise(dur, f0=200, f1=2400, v=.18, seed=4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = s_noise(dur, f0 * 2, f1 * 2, v * .7, q=2, att=dur * .8, seed=seed)
    y = s_tone(f0, dur, v * .4, f1, dec=99) * np.minimum(1, t / dur) ** 2
    return mixa(x, y)


class Mixer:
    def __init__(self, sec):
        self.buf = np.zeros(int((sec + 2) * SR))

    def add(self, t, x, pan=0.0):
        i = int(t * SR)
        if i < 0 or i >= len(self.buf):
            return
        x = np.asarray(x)
        n = min(len(x), len(self.buf) - i)
        self.buf[i:i + n] += x[:n]

    def write(self, path, sec):
        x = self.buf[:int(sec * SR)]
        # 響き（短いホールの残響）
        rng = np.random.default_rng(9)
        ir_n = int(1.1 * SR)
        ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / .28)
        ir[0] = 0
        from scipy.signal import fftconvolve
        wet = fftconvolve(x, ir)[:len(x)]
        wet *= .16 * np.abs(x).max() / (np.abs(wet).max() + 1e-9)
        y = x + wet
        y = np.tanh(y * 1.2) / np.tanh(1.2)
        y = y / (np.abs(y).max() + 1e-9) * .9
        d = (y * 32767).astype(np.int16)
        with wave.open(path, 'wb') as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes(d.tobytes())


# ------------------------------------------------------------ 書き出し
_SK = None


def _init(sk):
    global _SK
    _SK = sk


def _job(fi):
    return _SK.frame(fi)


def to8(img):
    return (np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)


def render(sk, name, workers=4, scale=2, sheet_every=10):
    tl = sk.tl
    wav = os.path.join(OUT, name + '.wav')
    mix = Mixer(tl.n / FPS)
    sk.sounds(mix)
    mix.write(wav, tl.n / FPS)
    mp4 = os.path.join(OUT, name + '.mp4')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
           '-i', '-', '-i', wav, '-vf', f'scale={W * scale}:{H * scale}:flags=neighbor', '-c:v', 'libx264', '-preset', 'medium',
           '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', mp4]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    thumbs = []
    with Pool(workers, initializer=_init, initargs=(sk,)) as pool:
        for i, fr in enumerate(pool.imap(_job, range(tl.n), chunksize=4)):
            p.stdin.write(fr.tobytes())
            if i % sheet_every == 0:
                thumbs.append((i, Image.fromarray(fr).resize((W // 3, H // 3), Image.BILINEAR)))
    p.stdin.close()
    p.wait()
    cols = 8
    rows = (len(thumbs) + cols - 1) // cols
    sh = Image.new('RGB', (cols * W // 3, rows * (H // 3 + 14)), (0, 0, 0))
    d = ImageDraw.Draw(sh)
    for k, (i, t) in enumerate(thumbs):
        x, y = (k % cols) * W // 3, (k // cols) * (H // 3 + 14)
        sh.paste(t, (x, y + 14))
        d.text((x + 3, y + 1), f'{i / FPS:.2f}s τ{tl.taus[i]:.2f}', fill=(255, 255, 255))
    sh.save(os.path.join(OUT, name + '_sheet.png'))
    return mp4
