"""セレス（時の魔女）の技・術の演出デモ（48px の差分で。rs-battle-fx の 6 段の時間割＋派手さの決まり）
実行：リポジトリの直下で  python3 assets_src/pixel-art/celes-48/demo/celes_fx.py [刻の矢 遅延の砂 加速の刻 被弾]
出力：assets_src/pixel-art/celes-48/demo/out/skill_<名前>.mp4（音つき・640×720・60fps）と _sheet.png
共通部品はリオの演出の fxlib.py（光の層・粒・着弾・カメラ・効果音・書き出し）をそのまま使い、
色と絵だけをセレスに差し替える。
  セレスの光の言葉：主＝時の紫（VIO）・補う＝杖の宝石の青（BLUE）・芯＝白。星の要素＝文字盤の 12 の星（時刻の印）
  文字盤 dial：地面の楕円 or 空の円＋12 の星の目盛り＋長針と短針（術ごとに回り方が違う：逆回り・止まる・早回し）
  応用と進化（7 章）：剣の三日月 → 時計の針の形の矢／砂時計の砂／早回しの残像。着弾の終わりは星の粒が文字盤へ戻る"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'rio-rs4'))
import fxlib as X  # noqa: E402

# ---- 色（fxlib の色の役割をセレスの色に置き換える：関数の中は呼ぶときに参照されるので全体に効く） ----
VIO, BLUE, PALE = (178, 118, 255), (92, 168, 255), (226, 212, 255)
X.GOLD, X.EMBER, X.HOT = VIO, BLUE, PALE
X.OUT = os.path.join(HERE, 'out')
W, H, GROUND, HOME_X, EN_X, ECX, ECY, PX = X.W, X.H, X.GROUND, X.HOME_X, X.EN_X, X.ECX, X.ECY, X.PX
ease, eout, ein, clamp, mul = X.ease, X.eout, X.ein, X.clamp, X.mul

# ---- 絵：48px の差分（足元の下に 2 段の余白を足してリオと同じ足の位置に） ----
SRC = os.path.join(HERE, '..', 'sprites')
NAMES = {'横': 'side', '構え': 'ready', '詠唱': 'cast', '正面': 'front', '瀕死': 'dying', '気絶': 'faint'}


def _load(n):
    im = Image.open(os.path.join(SRC, f'celes48_{n}.png')).convert('RGBA')
    out = Image.new('RGBA', (48, 50))
    out.paste(im, (0, 0))
    return out


X.SPR = {k: _load(v) for k, v in NAMES.items()}
ANIM = os.path.join(SRC, 'anim')
NF = {}
for pose in sorted(os.listdir(ANIM)):
    fs = sorted(os.listdir(os.path.join(ANIM, pose)))
    NF[pose] = len(fs)
    for i, fn in enumerate(fs):
        im = Image.open(os.path.join(ANIM, pose, fn)).convert('RGBA')
        out = Image.new('RGBA', (48, 50))
        out.paste(im, (0, 0))
        X.SPR[f'{pose}{i}'] = out
X.SPRB = {k: X.big(v) for k, v in X.SPR.items()}
X.SPRW = {k: Image.fromarray(np.dstack([np.full((v.height, v.width, 3), 255, np.uint8), np.asarray(v)[..., 3]]), 'RGBA')
          for k, v in X.SPRB.items()}


def _gem(im):
    """杖の宝石（青）の中心。足元の中心からの差（画面の px）"""
    a = np.asarray(im).astype(int)
    m = (a[..., 2] > 190) & (a[..., 2] - a[..., 0] > 60) & (a[..., 3] > 0)
    ys, xs = np.where(m)
    if not len(xs):
        return (-60, -120)
    return (xs.mean() * PX + 2 - im.width * PX / 2, ys.mean() * PX + 2 - im.height * PX + 8)


X.TIP = {k: _gem(v) for k, v in X.SPR.items()}
for k in X.TIP:                                   # 宝石が白く光ったコマは同じポーズの 1 コマ目の位置
    if X.TIP[k] == (-60, -120) and k[-1].isdigit():
        X.TIP[k] = X.TIP.get(k.rstrip('0123456789') + '0', X.TIP[k])
tip = X.tip


def sprite(h):
    if h.get('w'):
        return X.SPRW[h['p']]
    im = X.SPRB[h['p']]
    if h['r']:
        im = im.rotate(h['r'], resample=Image.NEAREST, center=(im.width / 2, im.height * .62))
    return im


X.sprite = sprite
hero = X.hero


def fr(pose, t, dt=.12, loop=True):
    """連続コマの名前（loop でなければ最後のコマで止まる）"""
    n = NF[pose]
    i = int(max(0, t) / dt)
    return f'{pose}{i % n if loop else min(i, n - 1)}'


def idle(t, x=HOME_X):
    return hero(fr('idle', t, .16), x)


# 後処理（時間停止の色など）：fxlib の frame を包み、技に post があれば最後にかける
_frame0 = X.frame


def apply_cam(img, z, cx, cy):
    """寄り：z 倍に拡大（画面からはみ出さないよう中心を寄せる）"""
    if z <= 1.002:
        return img
    w, h = W / z, H / z
    x0, y0 = min(max(cx - w / 2, 0), W - w), min(max(cy - h / 2, 0), H - h)
    return img.transform((W, H), Image.EXTENT, (x0, y0, x0 + w, y0 + h), Image.BICUBIC)


def camk(t, keys):
    """カメラのキー（t, 倍率, 中心 x, 中心 y）を ease でつなぐ"""
    if t <= keys[0][0]:
        return keys[0][1:]
    for (t0, *a), (t1, *b) in zip(keys, keys[1:]):
        if t0 <= t < t1:
            k = ease((t - t0) / (t1 - t0))
            return tuple(p + (q - p) * k for p, q in zip(a, b))
    return keys[-1][1:]


def _frame(sk, tl, i):
    img = _frame0(sk, tl, i)
    t = tl.taus[i]
    p = getattr(sk, 'post', None)
    if p:
        img = p(t, img)
    cm = getattr(sk, 'cam', None)
    if cm:
        img = apply_cam(img, *cm(t))
    return img


def make_galaxy(base):
    """星臨の夜空：もとの夜空に紫・青・桃の星雲と 600 の星を足す"""
    g = base.copy()
    rnd = np.random.RandomState(11)
    yy, xx = np.mgrid[0:H, 0:W]
    for col, n in (((120, 60, 210), 5), ((50, 100, 230), 4), ((210, 80, 180), 3)):
        for _ in range(n):
            cx, cy, r = rnd.uniform(0, W), rnd.uniform(0, 380), rnd.uniform(60, 170)
            g[:400] += (np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)))[..., None] * np.array(col) * .22)[:400]
    for _ in range(600):
        x, y = rnd.randint(0, W), rnd.randint(0, 370)
        b = rnd.uniform(.4, 1)
        g[y, x] = 255 * b
        if b > .93:
            g[max(0, y - 2):y + 3, x] = 220
            g[y, max(0, x - 2):x + 3] = 220
    return np.clip(g, 0, 255)


X.NIGHT_BG = make_galaxy(X.NIGHT_BG)


X.frame = _frame


# ---------------- セレスの部品 ----------------
def dial(L, x, y, r, k, t, hand=0.0, flat=True, col=VIO, sub=BLUE, ticks=1.0):
    """時の文字盤：外の 2 重の輪＋12 の星の目盛り＋長針・短針（hand＝回った量、ラジアン）"""
    if k <= .01:
        return
    ry = r * (.26 if flat else 1.0)
    L.ring(x, y, r * k, ry * k, 3, sub, .9 * k)
    L.ring(x, y, r * .84 * k, ry * .84 * k, 2, col, .8 * k)
    for i in range(12):
        a = i * math.tau / 12 - math.pi / 2
        px, py = x + math.cos(a) * r * .92 * k, y + math.sin(a) * ry * .92 * k
        big = i % 3 == 0
        if (i + 1) / 12 <= ticks + 1e-6:
            L.star(px, py, (11 if big else 6) * k, 1.4, PALE if big else col, .95 * k, rot=45 if not big else 0)
    for ln, sp, wd in ((.78, 1.0, 3), (.5, 1 / 12, 4)):
        a = hand * sp - math.pi / 2
        L.line([(x, y), (x + math.cos(a) * r * ln * k, y + math.sin(a) * ry * ln * k)], PALE, wd, .9 * k, glow=4)
    L.disc(x, y, 4 * k, X.WHITE, k, glow=2.5)


def clock_arrow(L, x0, y0, x1, y1, u, k=1.0, seed=0):
    """時計の針の形の矢：細い光の軸＋ひし形の穂先（星）＋尾の残光。u＝飛んだ割合"""
    hx, hy = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - 60 * math.sin(math.pi * u)
    a = math.atan2(y1 - y0 - 60 * math.pi * math.cos(math.pi * u), x1 - x0)
    tx, ty = hx - math.cos(a) * 70, hy - math.sin(a) * 70
    L.push()
    L.line([(tx, ty), (hx, hy)], VIO, 5, k, glow=7)
    L.line([(tx, ty), (hx, hy)], PALE, 2, k, glow=2)
    ca, sa = math.cos(a), math.sin(a)
    L.poly([(hx + ca * 16, hy + sa * 16), (hx - sa * 7, hy + ca * 7), (hx - ca * 6, hy - sa * 6), (hx + sa * 7, hy - ca * 7)], PALE, k)
    L.star(hx, hy, 18, 1.6, X.WHITE, k, rot=math.degrees(a))
    for j in range(1, 4):                      # 尾の残光（針の影が 3 つ）
        q = max(0, u - j * .06)
        bx, by = x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - 60 * math.sin(math.pi * q)
        L.disc(bx, by, 5 - j, BLUE, k * (1 - j * .25), glow=3)



def arrow2(L, P, u, k=1.0, size=1.0, main=VIO, sub=BLUE):
    """時の矢（第 2 版）：P(u)→(x, y) の道筋を飛ぶ。細る光のリボンの尾・らせんの星・金と白の軸・時計の針の穂先・尾の星"""
    if u <= 0 or k <= .01:
        return
    hx, hy = P(u)
    px, py = P(max(0.0, u - .02))
    ang = math.atan2(hy - py, hx - px) if (hx, hy) != (px, py) else 0.0
    ca, sa = math.cos(ang), math.sin(ang)
    L.push()
    pts = [P(max(0.0, u - j * .045)) for j in range(9)]       # 光のリボン（先が太く、尾ほど細い）
    for j in range(8):
        w = (9 - j) * size
        L.line([pts[j], pts[j + 1]], main, int(w), k * (1 - j / 9), glow=6)
        L.line([pts[j], pts[j + 1]], PALE, max(1, int(w / 3)), k * (1 - j / 8), glow=2)
    for j in range(6):                                          # らせんの星
        q = max(0.0, u - j * .05)
        qx, qy = P(q)
        off = 14 * size * math.sin(q * 40 + j)
        L.star(qx - sa * off, qy + ca * off, 6 * size, 1, (PALE, sub)[j % 2], k * (1 - j / 6), rot=45)
    ln = 64 * size                                              # 軸（細る多角形）
    tx, ty = hx - ca * ln, hy - sa * ln
    L.poly([(hx - ca * 10 * size - sa * 4 * size, hy - sa * 10 * size + ca * 4 * size), (tx, ty),
            (hx - ca * 10 * size + sa * 4 * size, hy - sa * 10 * size - ca * 4 * size)], mul((255, 214, 120), .9), k)
    L.line([(tx, ty), (hx, hy)], X.WHITE, max(1, int(2 * size)), k, glow=2)
    L.poly([(hx + ca * 22 * size, hy + sa * 22 * size), (hx - sa * 9 * size, hy + ca * 9 * size),  # 時計の針の穂先（ひし形）
            (hx - ca * 8 * size, hy - sa * 8 * size), (hx + sa * 9 * size, hy - ca * 9 * size)], PALE, k)
    L.disc(hx, hy, 3 * size, X.WHITE, k, glow=2.5)
    L.star(tx, ty, 14 * size, 1.4, PALE, k, rot=math.degrees(ang) + 45)    # 尾の星
    L.star(hx + ca * 18 * size, hy + sa * 18 * size, 26 * size, 1.6, X.WHITE, k, rot=math.degrees(ang))


def arrow_stuck(L, x, y, ang, a, size=1.0):
    """刺さった矢：0.25 秒光って残る → 歯車の輪にはじける（a＝刺さってからの秒）"""
    if a < 0:
        return
    ca, sa = math.cos(ang), math.sin(ang)
    if a < .25:
        k = 1 - a / .25 * .5
        L.line([(x - ca * 50 * size, y - sa * 50 * size), (x + ca * 6, y + sa * 6)], (255, 214, 120), int(4 * size), k, glow=5)
        L.star(x - ca * 50 * size, y - sa * 50 * size, 12 * size, 1.2, PALE, k, rot=45)
    else:
        q = clamp((a - .25) / .35)
        r = 20 + 70 * eout(q) * size
        L.ring(x, y, r, r, 2, PALE, 1 - q, soft=3)
        for i in range(12):                                       # 歯車の歯
            g = i * math.tau / 12 + a * 3
            L.line([(x + math.cos(g) * r, y + math.sin(g) * r), (x + math.cos(g) * (r + 8), y + math.sin(g) * (r + 8))], VIO, 3, 1 - q, glow=3)


def label(img, text, x, y, a, col, size=30):
    """強化・弱体の文字（ぽんと出て浮く）"""
    if a < 0 or a > 1.6:
        return
    sc = 1.3 - .3 * eout(a / .1) if a < .1 else 1.0
    al = 1 - clamp((a - 1.2) / .4)
    if al <= 0:
        return
    X.metal(img, text, x, y - 18 * eout(a / .6), size, sc, font=X.FONT_JA, stroke=4, plain=tuple(int(c * al + 30 * (1 - al)) for c in col))


def cast_pose(t, t0, t1, rise=14):
    """詠唱：入り 2 コマ（沈んで溜める）→ 詠唱のループ（髪と裾がはね上がる・宝石が脈打つ）でふわりと浮く"""
    if not t0 <= t < t1:
        return None
    a = t - t0
    if a < .14:
        return hero(fr('cast_in', a, .07, False), HOME_X)
    up = rise * ease((a - .14) / .35) + 3 * math.sin(a * 5)
    return hero(fr('cast', a - .14, .09), HOME_X, GROUND - up)


def act_pose(t, t0, x=HOME_X, f=GROUND, hop=0.0):
    """発動：のけぞって溜める → 伸び切る（髪が後ろへ）→ 構え。hop＝跳ぶ高さ"""
    a = t - t0
    return hero(fr('act', a, .07, False), x - 14 * eout(clamp((a - .07) / .1)), f - hop, g=1 if hop else 0)


def big_dial(L, x, y, r, k, t, hand, lit=1.0, col=VIO, sub=BLUE):
    """空の大時計：3 重の輪・ローマ数字の代わりに 12 の星・回る外周の目盛り"""
    if k <= .01:
        return
    dial(L, x, y, r, k, t, hand=hand, flat=False, col=col, sub=sub, ticks=lit)
    L.ring(x, y, r * 1.12 * k, r * 1.12 * k, 2, PALE, .5 * k, soft=6)
    for i in range(60):
        a = i * math.tau / 60 + t * .4
        rr = r * 1.05 * k
        L.disc(x + math.cos(a) * rr, y + math.sin(a) * rr, 1.2 if i % 5 else 2.2, PALE, .7 * k, glow=1.6)


def hour_pos(x, y, r, i):
    a = i * math.tau / 12 - math.pi / 2
    return x + math.cos(a) * r * .92, y + math.sin(a) * r * .92




# ---------------- 絵の部品を体の奥・手前に重ねる描画（fxlib の frame に props_back / props_front を足したもの） ----------------
def frame_v4(sk, tl, i):
    c = X.Ctx(sk, tl, i)
    t = c.t
    hh = sk.hero(t)
    sk.draw(c, hh)
    ekw, kb = sk.enemy(c)
    shiver = (4 if i % 2 else -4) if c.frozen else 0
    ex = EN_X - kb + shiver
    lift = clamp(1 - (GROUND - hh['f']) / 260)
    c.FB.puff(hh['x'], GROUND + 6, 40 * lift + 1, 8 * lift + .6, .5 * lift, (6, 4, 8))
    c.FB.puff(ex, GROUND + 12, 96, 15, .55 * (1 - ekw.get('dissolve', 0)), (6, 4, 8))
    base = X.BG * sk.dark(t)
    nt = sk.night(t)
    if nt:
        base = base * (1 - nt) + X.NIGHT_BG * nt * min(1.0, sk.dark(t) + .35)
    base = c.B.apply(base)
    base = c.FB.apply(base)
    base = X.paste(base, X.ENEMY, ex, GROUND + 12, **ekw)
    pb = getattr(sk, 'props_back', None)
    if pb:
        base = pb(c, hh, base)
    if hh['g']:
        for j, al in enumerate((.8, .52, .32, .16)):
            g = sk.hero(t - (j + 1) * .024)
            if abs(g['x'] - hh['x']) + abs(g['f'] - hh['f']) > 6:
                base = X.paste(base, sprite(g), g['x'], g['f'] + 8, alpha=al, glow=sk.ghost)
    base = X.paste(base, sprite(hh), hh['x'], hh['f'] + 8)
    pf = getattr(sk, 'props_front', None)
    if pf:
        base = pf(c, hh, base)
    base = c.FF.apply(base)
    base = c.F.apply(base)
    white, tint, ta, dx, dy, z, zc = X.camera(sk, tl, c.rt)
    if ta:
        base = 255 - (255 - base) * (1 - np.array(tint) / 255 * ta)
    if white:
        base = base * (1 - white) + 255 * white
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    img = X.apply_camera(img, dx, dy, z, zc)
    sk.ui(c, img)
    return img


_frame0 = frame_v4


# ---------------- pixelfx のスプライトシート（bake_fx.sh で焼く） ----------------
import json  # noqa: E402
FXD = os.path.join(HERE, 'out', 'fx')


class Sheet:
    """pixelfx のシートを時刻で引く。scale＝1 ドットの画面 px。pivot が置く点"""
    _cache = {}

    def __init__(self, name):
        d = os.path.join(FXD, name)
        js = [os.path.join(r, f) for r, _, fs in os.walk(d) for f in fs if f.endswith('.json')][0]
        j = json.load(open(js))
        p = j['meta']['pixelfx']
        im = Image.open(js[:-5] + '.png').convert('RGBA')
        fw, fh = p['frameSize']
        cols = p['columns']
        self.frames = [im.crop(((k % cols) * fw, (k // cols) * fh, (k % cols + 1) * fw, (k // cols + 1) * fh)) for k in range(p['frames'])]
        self.fps, self.loop, self.pivot, self.size = p['fps'], p['loop'], p['pivot'], (fw, fh)

    def at(self, a):
        n = len(self.frames)
        k = int(a * self.fps)
        if self.loop:
            return self.frames[k % n]
        return self.frames[k] if 0 <= k < n else None

    def put(self, base, a, x, y, scale=4, alpha=1.0, mirror=False, add=False):
        """a：始まってからの秒。x, y：pivot を置く画面の位置"""
        if a < 0:
            return base
        f = self.at(a)
        if f is None:
            return base
        key = (id(f), scale, mirror)
        g = Sheet._cache.get(key)
        if g is None:
            g = f.resize((f.width * scale, f.height * scale), Image.NEAREST)
            if mirror:
                g = g.transpose(Image.FLIP_LEFT_RIGHT)
            Sheet._cache[key] = g
        px, py = self.pivot
        if mirror:
            px = f.width - px
        cx = x - px * scale + g.width / 2
        foot = y - py * scale + g.height
        if add:
            return X.paste(base, g, cx, foot, alpha=alpha, add=(255, 255, 255))
        return X.paste(base, g, cx, foot, alpha=alpha)


FX = {}
for _n in ('aura', 'halo', 'rune', 'timestop', 'slowed', 'starfall', 'pillar', 'burst', 'shield', 'charge'):
    try:
        FX[_n] = Sheet(_n)
    except (IndexError, FileNotFoundError):
        pass


# ---------------- 砂時計（ドット絵の部品：金の枠・星の飾り・ガラスの照り・積もる砂・落ちる砂の筋） ----------------
def hourglass(fill, t, crack=0.0):
    """30×46 のドット絵。fill＝下に落ちた砂の割合（0〜1）"""
    w, h = 30, 46
    a = np.zeros((h, w, 4), np.uint8)
    K, G1, G2, G3, G4 = (24, 16, 40), (110, 70, 20), (190, 140, 40), (245, 205, 90), (255, 245, 200)
    GL, GH = (150, 140, 220), (235, 230, 255)
    S1, S2, S3 = (120, 80, 200), (190, 160, 255), (240, 230, 255)
    def P(x, y, c, al=255):
        if 0 <= x < w and 0 <= y < h:
            a[y, x] = (*c, al)
    # 上下の板（金・3 段の陰）
    for y0 in (0, h - 5):
        for y in range(y0, y0 + 5):
            for x in range(1, w - 1):
                edge = y in (y0, y0 + 4) or x in (1, w - 2)
                P(x, y, K if edge else (G4 if y == y0 + 1 else G3 if y == y0 + 2 else G2))
        P(w // 2, y0 + 2, (255, 255, 255))                          # 中央の星
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            P(w // 2 + dx, y0 + 2 + dy, G4)
    # 左右の柱
    for y in range(5, h - 5):
        for x in (3, w - 4):
            P(x - 1, y, K); P(x, y, G3 if x == 3 else G2); P(x + 1, y, K)
    # ガラス：上下のふくらみ（くびれは中央）
    mid = h // 2
    def half_w(y):
        d = abs(y - mid) / (mid - 5)
        return 1 + int(9 * math.sin(min(1, d) * math.pi / 2) ** .8)
    top_sand = 1 - fill
    for y in range(5, h - 5):
        hw = half_w(y)
        cx = w // 2
        for x in range(cx - hw, cx + hw + 1):
            edge = abs(x - cx) == hw
            if edge:
                P(x, y, GL)
                continue
            col, al = (60, 50, 120), 90                              # ガラスの中（うっすら）
            if y < mid:                                              # 上：残りの砂（下側から減る＝上の面が下がる）
                level = mid - (mid - 6) * top_sand
                if y >= level:
                    col, al = ((S2, S3, S2, S1)[(x * 7 + y * 13 + (x * y) % 5) % 4]), 255
            else:                                                    # 下：積もる山
                pile = (h - 6) - (mid - 6) * fill * (1 - .6 * abs(x - cx) / 9)
                if y >= pile:
                    col, al = (S1 if y > pile + 2 else S2), 255
            P(x, y, col, al)
        if y < mid - 1:                                              # 照り（左上の縦の線）
            P(cx - hw + 2, y, GH, 200)
    if 0 < fill < 1:                                                 # 落ちる砂の筋（ちらつく）
        for y in range(mid - 1, h - 6):
            if (y + int(t * 40)) % 3:
                P(w // 2, y, S3)
    if crack > 0:                                                    # ひび
        rnd = random.Random(3)
        for _ in range(int(14 * crack)):
            x, y = w // 2 + rnd.randint(-6, 6), mid + rnd.randint(-12, 12)
            for _ in range(5):
                P(x, y, (255, 255, 255))
                x += rnd.choice((-1, 0, 1)); y += rnd.choice((-1, 1))
    return Image.fromarray(a, 'RGBA')


# =============== 刻の矢（第 2 版：夜空の大時計 → 跳んで 3 連の針の矢 → 12 の星から一斉の矢・スローで両断の光柱） ===============
SKX, SKY, SKR = W / 2 - 40, 190, 150          # 空の大時計


class Kokunoya(X.Skill):
    name, dur = '刻の矢', 4.7
    ghost = (150, 120, 255)
    T1, T2, T3, TF = 1.62, 1.74, 1.83, 2.30   # 3 連はだんだん速く → 一斉射の着弾
    SHOT = (1.46, 1.60, 1.71)                  # 撃つ時刻（着弾 T1〜T3 の 0.12〜0.16 秒前）
    hits = [X.Hit(1.62, 1, ECX, ECY, -1, 0, tint=VIO), X.Hit(1.74, 1, ECX, ECY, -1, 0, tint=VIO),
            X.Hit(1.83, 2, ECX, ECY, -1, -.3, tint=VIO), X.Hit(2.30, 3, ECX, ECY, -1, .2, stop=12, z=.09, tint=VIO)]
    slow = ((2.18, 2.42, .35),)

    def dark(self, t):
        d = X.dim(t, .30, 3.25, .45)
        if 1.36 <= t < 1.46:
            d *= .1
        return d

    def night(self, t):                          # 詠唱が深まると夜空へ → 一斉射のあと明ける
        return ease((t - .75) / .45) * (1 - ease((t - 2.9) / .5))

    def hero(self, t):
        if t < .32:
            return idle(t)
        h = cast_pose(t, .32, 1.36, rise=18)
        if h:
            return h
        if t < 2.55:                             # 発動：大きく跳んで空中で撃つ（1 本ごとに反動で後ろへ）→ 着地
            a = t - 1.36
            hop = 90 * math.sin(clamp(a / 1.25) * math.pi) ** .7
            rec = sum(10 * math.exp(-(t - s0) / .08) for s0 in self.SHOT if t >= s0)
            x = HOME_X + 30 * math.sin(clamp(a / 1.25) * math.pi) + rec
            last = max([s0 for s0 in self.SHOT if t >= s0], default=None)
            if last is not None and t - last < .1:
                return hero('act1', x, GROUND - hop, g=1)       # 撃った瞬間：前へ伸び切る
            return act_pose(t, 1.36, x, GROUND, hop)
        if t < 2.76:
            return hero(fr('land', t - 2.55, .07, False), HOME_X)
        if t < 3.06:
            return hero(fr('turn', t - 2.76, .06, False), HOME_X, GROUND - 12 * math.sin(clamp((t - 2.76) / .3) * math.pi))
        return idle(t)

    def props_front(self, c, hh, base):
        t = c.t
        if 'charge' in FX and .45 <= t < 1.36:
            gx, gy = tip(hh)
            base = FX['charge'].put(base, t - .45, gx + 10, gy + 14, 3, alpha=clamp((t - .45) / .15), mirror=True)
        return base

    def cam(self, t):
        return camk(t, [(.4, 1, W / 2, H / 2), (.95, 1.16, HOME_X - 30, GROUND - 120), (1.34, 1.2, HOME_X - 30, GROUND - 130),
                        (1.42, 1, W / 2, H / 2), (2.55, 1, W / 2, H / 2), (2.7, 1.1, HOME_X - 20, GROUND - 100), (3.3, 1, W / 2, H / 2)])

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        if 2.76 <= t < 3.1:                       # 回って決める：星の輪がほどける
            X.parts(F, HOME_X, GROUND - 90, t - 2.76, 40, 6, PALE, 40, 99, 'ember', up=1.0, star=True, size=(3, 5))
        # 足元の文字盤（逆回り）と昇る光の粒
        if .32 <= t < 2.6:
            k = ease((t - .32) / .3) * (1 - ease((t - 2.3) / .3))
            dial(B, HOME_X, GROUND + 6, 110, k, t, hand=-t * 9, ticks=clamp((t - .32) / .5))
            X.parts(F, HOME_X, GROUND, t - .4, 70, 1.6, PALE, 120, 3, 'ember', up=3.6, spread=(200, 340), star=True, size=(2, 4))
        # 夜空の大時計：12 の星が順に灯る → 針が逆回り
        k = ease((t - .8) / .4) * (1 - ease((t - 2.55) / .35))
        lit = clamp((t - .85) / .5)
        big_dial(B, SKX, SKY, SKR, k, t, hand=-t * 6 - 8 * ease((t - 1.8) / .5), lit=lit)
        for i in range(12):                       # 灯った星はきらめく
            if (i + 1) / 12 <= lit and k > .1:
                px, py = hour_pos(SKX, SKY, SKR * k, i)
                X.glint(F, px, py, t, .85 + i * .045, .2, 34)
        # 敵の足元の予兆
        if .6 <= t < 2.5:
            kk = ease((t - .6) / .25) * (1 - .5 * ease((t - 1.4) / .3))
            dial(B, ECX, GROUND + 10, 160, kk, t, hand=t * 4, ticks=clamp((t - .6) / .5))
        if 1.36 <= t < 1.46:                      # 放出の直前：真っ黒に白い球
            F.disc(ECX, ECY, 40 * (1 - abs(t - 1.41) / .05), X.WHITE, 1.0, glow=2.8)
        X.glint(F, gx, gy, t, 1.34, .16, 80)
        # 溜め：3 本の時の矢が 1 本ずつ現れ、宝石のまわりを回る → 溜めの終わりに敵へ向きをそろえる
        if .6 <= t < 1.46:
            for i in range(3):
                k = ease((t - .6 - i * .18) / .2)
                if k <= 0 or t >= self.SHOT[i]:
                    continue
                aim = math.atan2(ECY - gy, ECX - gx)
                orb = t * 5 + i * math.tau / 3
                w_ = ease((t - 1.15) / .2)                   # 狙いに向く割合
                ang = orb * (1 - w_) + (aim + (i - 1) * .18) * w_
                rr = 76 * (1 - .25 * w_)
                cx, cy = gx + math.cos(ang) * rr, gy + math.sin(ang) * rr
                arrow2(F, lambda u, cx=cx, cy=cy, ang=ang: (cx + math.cos(ang) * 30 * u, cy + math.sin(ang) * 30 * u), 1.0, k, 1.25)
        # 3 連の時の矢（空中から。発射の閃光と輪）
        for i, (t0, th) in enumerate(zip(self.SHOT, (self.T1, self.T2, self.T3))):
            h0 = self.hero(t0)
            sx, sy = tip(h0)
            tx, ty = ECX + 10, ECY - 10 + i * 14
            def P(u, sx=sx, sy=sy, tx=tx, ty=ty, i=i):
                return sx + (tx - sx) * u, sy + (ty - sy) * u - (50 - i * 15) * math.sin(math.pi * u)
            if t0 <= t < th:
                arrow2(F, P, ein((t - t0) / (th - t0)), 1.0, 1.0 + .15 * i)
            if t0 <= t < t0 + .12:
                q = (t - t0) / .12
                X.star_flash(F, sx, sy, 110 * (1 - q), 1 - q, rot=t * 200, sub=BLUE)
                F.ring(sx, sy, 20 + 70 * eout(q), 20 + 70 * eout(q), 2, PALE, 1 - q, soft=3)
            arrow_stuck(F, tx, ty, math.atan2(ty - P(.95)[1], tx - P(.95)[0]), t - th, 1.0 + .15 * i)
        for i, (th, s) in enumerate(((self.T1, .8), (self.T2, .9), (self.T3, 1.5))):
            X.impact(c, ECX, ECY - 10 + i * 14, s, th, seed=10 + i * 7, cold=True, rot=i * 22)
        # 一斉射：12 の星から針の矢が敵へ収束（少しずつずらして）
        for i in range(12):
            t0 = 1.95 + i * .012
            if t0 <= t < self.TF:
                px, py = hour_pos(SKX, SKY, SKR, i)
                arrow2(F, lambda u, px=px, py=py: (px + (ECX - px) * u, py + (ECY - py) * u), ein((t - t0) / (self.TF - t0)), 1.0, .9)
                if t < t0 + .06:
                    X.star_flash(F, px, py, 70, 1 - (t - t0) / .06, sub=VIO)
        for i in range(12):                       # 一斉射の矢が時計の針のように中心を指して刺さる
            px, py = hour_pos(SKX, SKY, SKR, i)
            ang = math.atan2(ECY - py, ECX - px)
            if self.TF <= t < self.TF + .2:
                arrow_stuck(F, ECX - math.cos(ang) * 30, ECY - math.sin(ang) * 30, ang, t - self.TF, .9)
        a = t - self.TF
        if a >= 0:                                # とどめ：縦の光の柱で両断・画面を渡る衝撃の輪・大時計が砕けて星が降る
            X.impact(c, ECX, ECY, 2.6, self.TF, seed=60, cold=True, rot=15)
            kb = clamp(a / .04) * (1 - clamp((a - .08) / .16))
            F.beam(ECX, -10, GROUND + 20, 46 * kb + 4, VIO, kb * .85)
            F.beam(ECX, -10, GROUND + 20, 14 * kb + 1, X.WHITE, kb * .85)
            for j in range(3):
                q = clamp((a - j * .07) / .7)
                F.ring(ECX, ECY, 40 + 700 * eout(q), 40 + 700 * eout(q), 4, (VIO, BLUE, PALE)[j], (1 - q) * .9, soft=6)
            X.parts(F, SKX, SKY, a, 160, 7, PALE, 150, 71, 'ember', up=-2.0, spread=(0, 360), star=True, size=(3, 7))
            X.parts(F, ECX, ECY, a, 200, 11, VIO, 60, 72)
            X.parts(F, ECX, ECY + 40, a, 90, 4, BLUE, 120, 73, 'ember', up=3.2, spread=(220, 320))
            F.speedlines(ECX, ECY, 40, 240, PALE, .8 * (1 - clamp(a / .5)), int(t * 60))
        X.dust(c.FF, HOME_X + 30, GROUND + 4, t - 2.55, 18, 5, 0, seed=6)
        if t >= 2.8:
            X.glint(F, *tip(hh), t, 2.85, .24, 56)

    def enemy(self, c):
        return X.enemy_state(c, self.hits, VIO, dis0=99)

    def ui(self, c, img):
        t = c.t
        if t < .45:
            X.bubble(img, '刻の矢！', HOME_X - 110, GROUND - 230, c.rt)
        for i, (th, n) in enumerate(((self.T1, 412), (self.T2, 437), (self.T3, 896))):
            a = t - th - .03
            if 0 <= a < .45:
                X.number(img, n, EN_X - 90 + i * 70, GROUND - 230 - i * 40, a, size=32)
        a = t - self.TF - .05
        if 0 <= a < .5:
            X.number(img, 3289, EN_X - 50, GROUND - 250, a, size=40)
        a = t - self.TF - .55
        if a >= 0:
            X.crit(img, EN_X + 10, GROUND - 330, a, 'Weak')
            X.number(img, 5034, EN_X - 60, GROUND - 290, a - .06, size=54, total=True)

    def sfx(self, m):
        T = m.T
        m.band(T(.30), 3.0, 900, 2600, .045, .3, .2, .5)
        m.charge(T(.45), .9, .2, 330, 1320)
        for k in range(12):                                       # 星が灯る音（上がる）
            m.ring(T(.85 + k * .045), 4000 + k * 300, .08, .05)
        m.whoosh(T(1.36), .1, 3000, 300, .25)
        m.whoosh(T(1.4), .35, 500, 2400, .2)                      # 跳ぶ
        for th in (self.T1, self.T2, self.T3):
            m.whoosh(T(th - .12), .12, 1200, 7000, .3)
            m.triplet(th, .22)
        for k in range(12):
            m.whoosh(T(1.95 + k * .012), .3, 1500, 9000, .06)
        m.triplet(self.TF, .35)
        m.boom(T(self.TF), 1.0)
        m.sub(T(self.TF), 1.0, .9)
        m.band(T(self.TF), 1.0, 8000, 600, .3, .4, .005, .8)
        m.shimmer(T(self.TF, .15), 1.2, .1, 2)
        m.thump(T(2.55), .4, .2, 160)
        m.chime(T(3.3), [8300, 6500, 6100, 5700], .12, .1)


# =============== 遅延の砂（第 2 版：大きな砂時計が裏返る → 渦を巻く星の砂 → 時計の檻 → 時間停止（紫の単色で止まる）→ 砕ける） ===============
class Chien(X.Skill):
    name, dur = '遅延の砂', 5.2
    ghost = (150, 120, 255)
    HIT, STOP = 1.85, 3.05
    hits = [X.Hit(1.85, 2, ECX, ECY, 0, 1, stop=4, tint=VIO), X.Hit(3.05, 3, ECX, ECY, 0, 0, stop=24, z=.07, tint=VIO)]

    def dark(self, t):
        d = X.dim(t, .30, 4.0, .45)
        if 1.10 <= t < 1.18:
            d *= .12
        return d

    def hero(self, t):
        if t < .32:
            return idle(t)
        if t < .62:
            return hero(fr('turn', t - .32, .06, False), HOME_X, GROUND - 16 * math.sin(clamp((t - .32) / .3) * math.pi))
        h = cast_pose(t, .62, 1.10)
        if h:
            return h
        if t < 3.6:
            a = t - 1.10
            if a < .3:
                return act_pose(t, 1.10, HOME_X, GROUND, 30 * math.sin(clamp(a / .3) * math.pi))
            return hero(fr('cast', a, .09), HOME_X, GROUND - 6 - 3 * math.sin(a * 5))
        return idle(t)

    def cam(self, t):
        return camk(t, [(.3, 1, W / 2, H / 2), (.7, 1.12, HOME_X - 20, GROUND - 120), (1.1, 1.12, HOME_X - 20, GROUND - 120),
                        (1.3, 1.16, ECX + 40, ECY - 130), (2.0, 1.12, ECX + 40, ECY - 80), (2.9, 1.2, ECX + 30, ECY - 40), (3.06, 1, W / 2, H / 2)])

    def props_front(self, c, hh, base):
        t = c.t
        hx, hy = ECX + 10, ECY - 215
        k = ease((t - 1.10) / .25) * (1 - ease((t - self.STOP) / .05))
        if k > 0:                                  # ドット絵の砂時計：現れる → 裏返る → 砂が落ちる → ひび
            fill = clamp((t - 1.6) / 1.3)
            img = hourglass(fill if t >= 1.6 else 0, t, crack=clamp((t - 2.75) / .3))
            img = img.resize((img.width * 4, img.height * 4), Image.NEAREST)
            rot = -180 * (1 - ease((t - 1.30) / .3)) + 5 * math.sin(t * 3)
            img = img.rotate(rot, resample=Image.BICUBIC, expand=True)
            if k < 1:
                img = img.resize((max(1, int(img.width * (.3 + .7 * k))), max(1, int(img.height * (.3 + .7 * k)))), Image.NEAREST)
            base = X.paste(base, img, hx, hy + img.height / 2, alpha=min(1, k * 1.2))
        if 'timestop' in FX and self.HIT <= t < self.STOP + 1.4:   # 時が止まる文字盤（pixelfx：1.2 秒目から＝ひびが STOP に合う）
            base = FX['timestop'].put(base, t - self.HIT + 1.2, ECX, GROUND + 10, 3)
        if 'slowed' in FX and t >= self.STOP + .5:              # 遅くなった印が残る
            base = FX['slowed'].put(base, t, ECX + 10, GROUND - 20, 3, alpha=clamp((t - self.STOP - .5) / .3))
        return base

    def post(self, t, img):
        """時間停止：紫の単色で止まる（0.4 秒）→ ひびの白い線が走って色が戻る"""
        a = t - self.STOP
        if -.001 <= a < .02:
            g = np.asarray(img).astype(float).mean(2, keepdims=True)
            v = np.clip(g * np.array([.95, .72, 1.25]) + np.array([12, 0, 30]), 0, 255).astype(np.uint8)
            return Image.fromarray(v)
        return img

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        if .32 <= t < 3.0:
            dial(B, HOME_X, GROUND + 6, 100, ease((t - .32) / .3) * (1 - ease((t - 2.7) / .3)), t, hand=t * 5, ticks=clamp((t - .32) / .6))
        X.gather(c, gx, gy, .40, 1.08, seed=5, big=1.0, cols=(VIO, BLUE), flame=False)
        X.glint(F, gx, gy, t, 1.08, .16, 70)
        hx, hy = ECX + 10, ECY - 215
        k = ease((t - 1.10) / .25) * (1 - ease((t - self.STOP) / .05))
        if k > 0:                                  # 砂時計の後ろの光と、まわりを回る星
            B.disc(hx, hy, 46 * k, mul(VIO, .45), .5 * k, glow=1.8)
            for i in range(6):
                ang = t * 2 + i * math.tau / 6
                F.star(hx + math.cos(ang) * 110 * k, hy + math.sin(ang) * 40 * k, 12, 1.6, PALE, .8 * k, rot=t * 90)
        # 渦を巻く星の砂（らせんで降りる）
        if 1.55 <= t < 3.0:
            rnd = random.Random(7)
            F.push()
            for i in range(260):
                t0 = 1.55 + rnd.uniform(0, 1.35)
                u = (t - t0) / .45
                if not 0 <= u <= 1:
                    continue
                ang = rnd.uniform(0, math.tau) + u * 9
                rad = 10 + 70 * u
                x = hx + math.cos(ang) * rad
                y = hy + 70 + (ECY + 30 - hy - 70) * u ** 1.3 + math.sin(ang) * rad * .25
                col = (PALE, VIO, BLUE, X.WHITE)[i % 4]
                F.ds.rectangle([x - 2, y - 2, x + 2, y + 2], fill=mul(col, 1 - u * .3))
                F.dg.rectangle([x - 4, y - 4, x + 4, y + 4], fill=mul(col, .4))
                if i % 7 == 0:
                    F.star(x, y, 9, 1.2, X.WHITE, .9 * (1 - u), rot=45)
        # 命中：時計の檻（敵を囲む縦の文字盤）・遅い波紋
        a = t - self.HIT
        if a >= 0:
            for j in range(3):
                q = clamp((a - j * .2) / 1.4)
                B.ring(ECX, GROUND + 10, 30 + 230 * eout(q), (30 + 230 * eout(q)) * .22, 3, (VIO, BLUE, PALE)[j], (1 - q) * .9)
            X.star_flash(F, ECX, ECY - 30, 200 * (1 - clamp(a / .3)), 1 - clamp(a / .3), rot=a * 30, sub=VIO)
        b = t - self.STOP
        if b >= 0:                                # 停止が解けて砕ける：ひびの線・破片・大きな輪
            kb = 1 - clamp(b / .5)
            rnd = random.Random(9)
            F.push()
            for i in range(14):
                ang = rnd.uniform(0, math.tau)
                ln = 60 + 240 * eout(clamp(b / .15))
                pts = [(ECX, ECY)]
                for j in range(4):
                    r_ = ln * (j + 1) / 4
                    pts.append((ECX + math.cos(ang + rnd.uniform(-.3, .3)) * r_, ECY + math.sin(ang + rnd.uniform(-.3, .3)) * r_))
                F.line(pts, X.WHITE, 2, kb, glow=5)
            X.parts(F, ECX, ECY, b, 160, 12, PALE, 50, 81, wid=2)
            X.parts(F, ECX, ECY, b, 120, 5, VIO, 110, 82, 'ember', up=2.0, star=True, size=(3, 6))
            for j in range(2):
                q = clamp((b - j * .08) / .6)
                F.ring(ECX, ECY, 30 + 600 * eout(q), 30 + 600 * eout(q), 4, (PALE, VIO)[j], (1 - q), soft=5)

    def enemy(self, c):
        st, kb = X.enemy_state(c, self.hits, VIO, dis0=99)
        a = c.t - self.STOP
        if a > .25:
            st = dict(tint=(VIO, .35 + .1 * math.sin(a * 3)))
        return st, kb * .5

    def ui(self, c, img):
        t = c.t
        if t < .45:
            X.bubble(img, '遅延の砂！', HOME_X - 110, GROUND - 230, c.rt)
        a = t - self.STOP - .2
        label(img, '遅延', EN_X - 40, GROUND - 320, a, VIO, 40)
        label(img, '素早さ↓', EN_X + 40, GROUND - 270, a - .2, (120, 170, 255), 32)
        label(img, '行動順↓', EN_X + 30, GROUND - 230, a - .35, (120, 170, 255), 28)

    def sfx(self, m):
        T = m.T
        m.band(T(.30), 3.4, 700, 1800, .045, .3, .2, .5)
        m.charge(T(.40), .7, .18, 300, 900)
        m.shimmer(T(1.10), .3, .08, 3)
        m.whoosh(T(1.30), .3, 400, 2000, .25)                       # 裏返る
        m.band(T(1.55), .8, 9000, 2500, .07, .5, .1, .4)           # 砂の流れ
        m.thump(T(self.HIT), .6, .3, 120)
        for k in range(5):
            m.ring(T(self.HIT + .08 + k * (.1 + k * .03)), 4800, .06, .08)
        m.ring(T(self.STOP), 2600, .5, .2)                          # 時が止まる「キン」
        m.boom(T(self.STOP, .4), .9)
        m.band(T(self.STOP, .4), .8, 9000, 900, .3, .4, .005, .6)
        m.shimmer(T(self.STOP, .5), .8, .1, 5)
        m.chime(T(3.4), [5700, 6100, 6500, 5200], .16, .09)


# =============== 加速の刻（第 2 版：早回しの大時計 → ジグザグに走る青い残像 → 画面を渡る目盛りの輪 → 光の柱のまとい） ===============
class Kasoku(X.Skill):
    name, dur = '加速の刻', 3.7
    ghost = (90, 200, 255)
    BURST = 1.95
    hits = [X.Hit(1.95, 2, HOME_X, GROUND - 100, 0, -1, stop=5, z=.05, tint=BLUE)]

    def dark(self, t):
        return X.dim(t, .30, 2.8, .45)

    def cam(self, t):
        return camk(t, [(.3, 1, W / 2, H / 2), (.8, 1.18, HOME_X - 10, GROUND - 140), (1.02, 1.18, HOME_X - 10, GROUND - 140),
                        (1.12, 1.04, W / 2 + 60, H / 2), (1.9, 1.04, W / 2 + 60, H / 2), (2.0, 1, W / 2, H / 2)])

    def hero(self, t):
        if t < .32:
            return idle(t)
        h = cast_pose(t, .32, 1.05)
        if h:
            return h
        if t < 1.85:                             # 早回し：ジグザグに 3 往復（だんだん速く）
            u = (t - 1.05) / .8
            ph = (u ** 1.4) * 3
            x = HOME_X - 70 * math.sin(ph * math.pi * 2) * (1 - u * .6)
            y = GROUND - 26 * abs(math.sin(ph * math.pi * 2))
            back = math.cos(ph * math.pi * 2) < 0      # 右（後ろ）へ動く間は背を向ける
            return hero('turn2' if back else fr('act', (t - 1.05), .05), x, y, g=1)
        if t < 2.06:
            return hero(fr('land', t - 1.85, .07, False), HOME_X)
        if t < 2.2:
            return hero(fr('cast_in', t - 2.06, .07, False), HOME_X)
        return hero(fr('front', t, .2), HOME_X)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        X.gather(c, gx, gy, .40, 1.03, seed=9, big=1.0, cols=(BLUE, PALE), flame=False)
        k = ease((t - .32) / .3) * (1 - ease((t - 2.4) / .4))
        hand = t + 60 * ease((t - .9) / 1.0) ** 2
        big_dial(B, HOME_X, GROUND - 130, 135, k, t, hand=hand, col=BLUE, sub=VIO)
        dial(B, HOME_X, GROUND + 6, 110, k, t, hand=hand * .5, col=BLUE, sub=VIO)
        if 1.05 <= t < 1.9:                       # 走る：集中線・地面の光の筋・上へ流れる光
            F.speedlines(hh['x'], hh['f'] - 90, 30, 160, PALE, .7, int(t * 60))
            rnd = random.Random(3)
            F.push()
            for i in range(40):
                x = HOME_X + rnd.uniform(-130, 110)
                ph = (t * 3.2 + rnd.random()) % 1
                y = GROUND - ph * 330
                F.line([(x, y), (x, y + 50)], (BLUE, PALE)[i % 2], 2, (1 - ph), glow=5)
            X.dust(c.FF, hh['x'], GROUND + 4, (t * 3) % .5, 6, 3, 0, seed=int(t * 6))
        a = t - self.BURST
        if a >= 0:                                # 決まる：画面を渡る目盛りの輪・光の柱・昇る星
            for j in range(3):
                q = clamp((a - j * .08) / .8)
                r = 40 + 640 * eout(q)
                F.ring(HOME_X, GROUND - 100, r, r, 3, (BLUE, PALE, VIO)[j], (1 - q), soft=5)
                for i in range(12):
                    ang = i * math.tau / 12 + j * .2
                    F.star(HOME_X + math.cos(ang) * r, GROUND - 100 + math.sin(ang) * r, 12, 1.5, PALE, (1 - q) * .9)
            kb = clamp(a / .05) * (1 - clamp((a - .1) / .25))
            F.beam(HOME_X, -10, GROUND + 10, 60 * kb, BLUE, kb * .6)
            F.beam(HOME_X, -10, GROUND + 10, 16 * kb, X.WHITE, kb * .6)
            X.star_flash(F, HOME_X, GROUND - 100, 300 * (1 - clamp(a / .4)) ** .5, 1 - clamp(a / .4), rot=a * 50, sub=BLUE)
            X.parts(F, HOME_X, GROUND - 40, a, 120, 3.4, PALE, 120, 51, 'ember', up=4.0, spread=(220, 320), star=True, size=(3, 6))
            X.parts(F, HOME_X, GROUND - 100, a, 120, 12, BLUE, 40, 52)
        if t >= 2.2:                              # まとい：足元から昇る青い光（強化中）
            X.parts(F, HOME_X, GROUND, t - 2.2, 40, 1.4, BLUE, 100, 55, 'ember', up=3.0, spread=(240, 300))
            X.glint(F, *tip(hh), t, 2.5, .24, 56)

    def props_front(self, c, hh, base):
        t = c.t
        if 'shield' in FX and t >= self.BURST:
            k = clamp((t - self.BURST) / .15)
            base = FX['shield'].put(base, t, hh['x'], hh['f'] + 4, 4, alpha=.85 * k)
        return base

    def enemy(self, c):
        return {}, 0

    def ui(self, c, img):
        t = c.t
        if t < .45:
            X.bubble(img, '加速の刻！', HOME_X - 110, GROUND - 230, c.rt)
        a = t - self.BURST - .15
        label(img, '素早さ↑', HOME_X - 10, GROUND - 270, a, (110, 240, 170), 36)
        label(img, '行動順↑', HOME_X + 10, GROUND - 228, a - .2, (110, 240, 170), 28)

    def sfx(self, m):
        T = m.T
        m.band(T(.30), 2.6, 1200, 3200, .04, .3, .2, .5)
        m.charge(T(.40), .6, .18, 400, 1300)
        for k in range(28):
            m.ring(T(.9 + 1.0 * (1 - (1 - k / 28) ** .5)), 5000 + k * 60, .035, .05)
        for k in range(6):
            m.whoosh(T(1.05 + k * .13 * (1 - k * .08)), .14, 900, 6000, .2)
        m.triplet(self.BURST, .26)
        m.sub(T(self.BURST), .7)
        m.shimmer(T(self.BURST), 1.0, .1, 4)
        m.chime(T(2.2), [5700, 6100, 6500, 8300], .1, .11)


# =============== 被弾 → 瀕死 → 気絶（第 2 版：突進の集中線と砂ぼこり・のけぞりのコマ・2 撃目はスロー・倒れて弾む） ===============
class Hidan(X.Skill):
    name, dur = '被弾', 4.6
    H1, H2 = .70, 2.15
    hits = [X.Hit(.70, 2, HOME_X, GROUND - 100, 1, 0, tint=(255, 80, 80)),
            X.Hit(2.15, 3, HOME_X, GROUND - 100, 1, .2, stop=10, z=.07, tint=(255, 60, 60))]
    slow = ((2.10, 2.30, .35),)

    def dark(self, t):
        return 1 - .3 * ease((t - 2.6) / .6)

    def cam(self, t):
        return camk(t, [(.4, 1, W / 2, H / 2), (.7, 1.08, HOME_X - 60, GROUND - 110), (1.1, 1, W / 2, H / 2),
                        (1.9, 1, W / 2, H / 2), (2.15, 1.2, HOME_X - 20, GROUND - 100), (3.0, 1.15, HOME_X + 20, GROUND - 60), (3.6, 1, W / 2, H / 2)])

    def hero(self, t):
        if t < self.H1:
            return idle(t)
        a = t - self.H1
        if a < .06:
            return dict(hero(fr('hit', 0, 1), HOME_X + 20 * eout(a / .06)), w=1)
        if a < .42:
            return hero(fr('hit', a - .06, .12, False), HOME_X + 34 - 20 * ease((a - .06) / .36))
        if t < self.H2:
            return hero(fr('weak', t, .2), HOME_X + 12)
        b = t - self.H2
        if b < .06:
            return dict(hero('瀕死', HOME_X + 12 + 30 * eout(b / .06)), w=1)
        if b < .34:                                # 吹き飛んで倒れる（弾む）
            k = (b - .06) / .28
            return hero(fr('fall', b - .06, .07, False), HOME_X + 22 + 18 * eout(k), GROUND - 40 * math.sin(k * math.pi))
        if b < .5:
            return hero('fall2', HOME_X + 40, GROUND - 10 * math.sin((b - .34) / .16 * math.pi))
        return hero(fr('down', b, .5), HOME_X + 40)

    def draw(self, c, hh):
        t, F = c.t, c.F
        for th in (self.H1, self.H2):              # 突進：集中線と砂ぼこり
            u = t - (th - .25)
            if 0 <= u < .25:
                F.speedlines(ECX + 100, ECY, 30, 150, (255, 230, 220), .7, int(t * 60))
                X.dust(c.FF, EN_X + 60, GROUND + 4, u, 10, 4, 1, seed=int(th * 10))
        for th, s in ((self.H1, .9), (self.H2, 1.3)):
            a = t - th
            if a >= 0:
                kc = max(0, 1 - c.ra(th) / .1) if c.ra(th) >= 0 else 0
                F.disc(HOME_X - 10, GROUND - 100, 50 * kc + 1, X.WHITE, kc, glow=2.4)
                X.star_flash(F, HOME_X - 10, GROUND - 100, 170 * s * (1 - clamp(a / .3)), 1 - clamp(a / .3), col=X.WHITE, sub=(255, 90, 90))
                F.rays(HOME_X - 10, GROUND - 100, 18, 30, 200 * s * (.4 + .6 * eout(a / .08)), (255, 150, 140), 1 - clamp(a / .35), 91, 3)
                X.parts(F, HOME_X - 10, GROUND - 100, a, int(60 * s), 15, (255, 150, 130), 26, 61 + int(s * 10))
                X.parts(F, HOME_X - 10, GROUND - 100, a, int(20 * s), 6, PALE, 80, 62 + int(s * 10), 'ember', up=1.5)
        X.dust(c.FF, HOME_X + 60, GROUND + 4, t - self.H2 - .34, 26, 6, 1, seed=8)
        if t > self.H2 + .6:                       # 気絶：頭の上に回る星
            a = t - self.H2 - .6
            hx, hy = HOME_X + 40 - 40, GROUND - 80
            for i in range(3):
                ang = a * 4 + i * math.tau / 3
                F.star(hx + math.cos(ang) * 28, hy + math.sin(ang) * 9, 12, 1.5, (255, 230, 140), .9, rot=a * 90)

    def enemy(self, c):
        t = c.t
        kb = 0.0
        for th in (self.H1, self.H2):
            u = (t - (th - .25)) / .6
            if 0 <= u <= 1:
                kb -= 230 * math.sin(math.pi * u) ** (.6 if u < .4 else 1.4)
        return {}, kb

    def ui(self, c, img):
        t = c.t
        a1, a2 = t - self.H1 - .05, t - self.H2 - .05
        if a1 < .9:
            X.number(img, 487, HOME_X - 40, GROUND - 250, a1, size=40)
        if a2 < 1.1:
            X.number(img, 1203, HOME_X - 30, GROUND - 230, a2, size=48)
        if t > self.H2 + 1.15:
            label(img, '気絶', HOME_X + 40, GROUND - 190, t - self.H2 - 1.15, (255, 120, 120), 36)

    def sfx(self, m):
        T = m.T
        for th, v in ((self.H1, .8), (self.H2, 1.0)):
            m.whoosh(T(th - .25), .24, 300, 1800, .25)
            m.thump(T(th), v, .25, 140)
            m.band(T(th), .3, 3000, 600, .3 * v, .4, .005, .3)
        m.boom(T(self.H2), .8)
        m.thump(T(self.H2 + .34), .5, .2, 90)
        m.thump(T(self.H2 + .5), .3, .15, 110)
        m.chime(T(self.H2 + .8), [3000, 2600, 2200, 1800], .16, .08)


# =============== 星臨奥義「終焉の大時計」第 2 版（星臨だけの部品で組む：天球儀の時計・金の陣・星の雨・超新星。通常の文字盤・着弾は使わない） ===============
GX, GY, GR = W / 2 - 50, 250, 255             # 天球儀の時計
GOLDC = (255, 214, 120)


def armillary(L, x, y, r, k, t, hand, lit=1.0):
    """天球儀の時計：外の金の環＋12 の金の星・3D に回る 3 本の環（金・紫・青）・中心の渦巻く銀河・金の長針と短針"""
    if k <= .01:
        return
    L.ring(x, y, r * k, r * k, 4, GOLDC, .9 * k, soft=5)
    L.ring(x, y, r * .93 * k, r * .93 * k, 1, PALE, .6 * k, soft=3)
    for j, (sp, col, ax) in enumerate(((.9, GOLDC, 'y'), (-.7, VIO, 'y'), (.5, BLUE, 'x'))):
        q = abs(math.sin(t * sp + j * 1.3))
        rx, ry = (r * .82 * k, r * .82 * k * max(.08, q)) if ax == 'y' else (r * .82 * k * max(.08, q), r * .82 * k)
        L.ring(x, y, rx, ry, 3, col, .8 * k, soft=4)
    rnd = random.Random(4)                       # 渦巻く銀河（2 本の腕）
    L.push()
    for i in range(160):
        arm = i % 2
        u = rnd.random()
        ang = arm * math.pi + u * 4.2 + t * 1.6
        rr = r * .62 * k * u ** .8
        px, py = x + math.cos(ang) * rr + rnd.uniform(-6, 6), y + math.sin(ang) * rr * .85 + rnd.uniform(-6, 6)
        col = (PALE, VIO, BLUE, GOLDC)[i % 4]
        L.ds.rectangle([px - 1, py - 1, px + 1, py + 1], fill=mul(col, k * (1 - u * .5)))
    L.disc(x, y, 7 * k, X.WHITE, k, glow=2.2)
    for i in range(12):                          # 12 の金の星（灯った分だけ）
        if (i + 1) / 12 <= lit:
            px, py = hour_pos(x, y, r * k, i)
            L.star(px, py, 16 if i % 3 == 0 else 10, 2, GOLDC, k, rot=t * 40)
            L.disc(px, py, 4, X.WHITE, k, glow=2.5)
    for ln, sp, wd in ((.75, 1.0, 6), (.48, 1 / 12, 8)):
        a = hand * sp - math.pi / 2
        ex, ey = x + math.cos(a) * r * ln * k, y + math.sin(a) * r * ln * k
        L.line([(x, y), (ex, ey)], GOLDC, wd, k, glow=6)
        L.line([(x, y), (ex, ey)], X.WHITE, 2, k, glow=2)
        L.star(ex, ey, 14, 2, GOLDC, k)


class Shuen(X.Skill):
    name, dur = '終焉の大時計', 8.2
    ghost = (200, 160, 255)
    AW, RISE, REW, STOP, FALL, HAND = .95, 2.0, 3.10, 3.75, 3.92, 4.40
    hits = ([X.Hit(.95, 2, HOME_X, GROUND - 100, 0, -1, stop=6, z=.06, tint=VIO)] +
            [X.Hit(3.98 + i * .11, 1, ECX, ECY, -.3, 1, stop=2, z=0, tint=GOLDC) for i in range(4)] +
            [X.Hit(4.40, 3, ECX, ECY, -.4, 1, stop=16, z=.12, tint=GOLDC)])
    slow = ((3.75, 3.90, .28), (4.36, 4.50, .4))

    def dark(self, t):
        return X.dim(t, .25, 7.1, .62)

    def night(self, t):
        return ease((t - .85) / .3) * (1 - ease((t - 6.8) / .6))

    def cam(self, t):
        return camk(t, [(.3, 1, W / 2, H / 2), (.8, 1.22, HOME_X - 10, GROUND - 110), (1.0, 1.28, HOME_X - 10, GROUND - 110),
                        (1.2, 1, W / 2, H / 2), (3.0, 1, W / 2, H / 2), (3.55, 1.08, GX, GY + 60), (3.9, 1.1, GX, GY + 80),
                        (3.96, 1, W / 2, H / 2), (5.1, 1, W / 2, H / 2), (5.6, 1.1, ECX + 40, ECY - 40), (6.4, 1.14, HOME_X - 20, GROUND - 110), (7.2, 1, W / 2, H / 2)])

    def post(self, t, img):
        a = np.asarray(img)
        if self.REW <= t < self.STOP - .02:
            k = math.sin(clamp((t - self.REW) / (self.STOP - self.REW)) * math.pi)
            out = a.copy()
            ph = t * 90
            for y in range(0, H, 3):
                d = int(14 * k * math.sin(y * .05 + ph) + (18 * k if (y // 3 + int(t * 60)) % 17 == 0 else 0))
                out[y:y + 3] = np.roll(a[y:y + 3], d, axis=1)
            out = (out * (1 - .25 * k) + (255 - out) * .25 * k * np.array([.5, .3, 1])).clip(0, 255).astype(np.uint8)
            return Image.fromarray(out)
        if self.STOP <= t < self.FALL - .02:
            g = a.astype(float).mean(2, keepdims=True)
            return Image.fromarray(np.clip(g * np.array([1.05, .9, .7]) + np.array([30, 16, 0]), 0, 255).astype(np.uint8))  # 星臨の時間停止は金の単色
        return img

    def awake(self, t):
        return t >= self.AW + .04

    # ---- 動きの道筋（各段の終わりの位置＝次の段の始まり。左右に向きを変えない）
    SKYX, SKYF = 430, GROUND - 250

    def path(self, t):
        """(x, 足元の y)。滑らかにつながる 1 本の道筋"""
        AW = self.AW
        def hover1(u):
            return HOME_X, GROUND - 20 - 6 * math.sin((u - AW) * 3)
        def sky(u):
            return self.SKYX, self.SKYF - 5 * math.sin((u - 2.9) * 3)
        if t < AW:
            a = t - .3
            return HOME_X, GROUND - 20 * ease(a / .6)
        if t < 1.8:
            return hover1(t)
        if t < 2.05:                               # タメ 1：地面近くまで沈む
            x0, y0 = hover1(1.8)
            k = ease((t - 1.8) / .25)
            return x0, y0 + (GROUND - 4 - y0) * k
        if t < 2.9:                                # 一気に昇る（弧を描いて）
            k = eout((t - 2.05) / .85)
            return HOME_X + (self.SKYX - HOME_X) * k - 40 * math.sin(k * math.pi), GROUND - 4 + (self.SKYF - GROUND + 4) * k
        if t < 3.62:
            return sky(t)
        if t < self.FALL:                          # タメ 2：少し昇って後ろへ引く
            x0, y0 = sky(3.62)
            k = ease((t - 3.62) / (self.FALL - 3.62))
            return x0 + 12 * k, y0 + (self.SKYF - 18 - y0) * k
        if t < 4.12:                               # 振り下ろす（速く）
            k = eout((t - self.FALL) / .2)
            return self.SKYX + 12 - 27 * k, self.SKYF - 18 + 33 * k
        if t < 4.8:                                # 振り抜いたまま余韻
            return self.SKYX - 15, self.SKYF + 15 - 4 * ease((t - 4.12) / .68)
        if t < 5.8:                                # ゆっくり降りる
            k = ease((t - 4.8) / 1.0)
            return self.SKYX - 15 + (HOME_X - self.SKYX + 15) * k, self.SKYF + 11 + (GROUND - self.SKYF - 11) * k
        return HOME_X, GROUND

    def hero(self, t):
        if t < .3:
            return idle(t)
        x, f = self.path(t)
        if t < self.AW:                            # 変身の前：詠唱（ゆっくり脈打つ）
            return hero(fr('cast', t - .3, .16), x, f)
        if t < self.AW + .04:
            return dict(hero('aw_float0', x, f), w=1)
        if t < 1.8:
            return hero(fr('aw_float', t, .22), x, f)
        if t < 2.05:
            return hero('aw_act0', x, f)               # のけぞって力を溜める
        if t < 2.9:
            return hero('aw_act1' if t < 2.3 else fr('aw_float', t, .22), x, f, g=1 if t < 2.6 else 0)
        if t < 3.62:
            return hero(fr('aw_float', t, .22), x, f)
        if t < self.FALL:
            return hero('aw_swing0', x, f)             # 引いて止める
        if t < 4.12:
            return hero('aw_swing1', x, f, g=1)
        if t < 4.8:
            return hero('aw_swing2' if t < 4.4 else 'aw_float0', x, f)
        if t < 5.8:
            return hero(fr('aw_float', t, .22), x, f)
        if t < 6.05:
            return hero(fr('aw_land', t - 5.8, .08, False), x, f)
        return hero(fr('aw_idle', t, .24), x, f)

    # ---- 星臨のまとい：足元の金の陣・体のまわりを昇る銀河の渦（奥）・頭上の光輪（手前）
    def props_back(self, c, hh, base):
        t = c.t
        if 'pillar' in FX and .25 <= t < self.AW + 1.6:
            base = FX['pillar'].put(base, t - .25, HOME_X, GROUND + 10, 3, alpha=1 - clamp((t - self.AW - 1.1) / .5))
        if self.awake(t):
            k = clamp((t - self.AW) / .3) * (1 - clamp((t - 7.4) / .6))
            if 'rune' in FX:
                base = FX['rune'].put(base, t, hh['x'], hh['f'] + 14, 2, alpha=.9 * k)
            if 'aura' in FX:
                base = FX['aura'].put(base, t, hh['x'], hh['f'] + 12, 2, alpha=.95 * k)
        if 'rune' in FX and 2.3 <= t < self.HAND + .3:        # 敵の足元の金の陣（封印）
            base = FX['rune'].put(base, t * 1.5, ECX, GROUND + 14, 3, alpha=clamp((t - 2.3) / .4) * (1 - clamp((t - self.HAND) / .3)))
        return base

    def props_front(self, c, hh, base):
        t = c.t
        if self.awake(t) and 'halo' in FX:
            k = clamp((t - self.AW) / .3) * (1 - clamp((t - 7.4) / .6))
            base = FX['halo'].put(base, t, hh['x'] + 6, hh['f'] - 70, 3, alpha=k)
        if 'burst' in FX:
            base = FX['burst'].put(base, t - (self.AW - .23), HOME_X, GROUND + 6, 3)
            base = FX['burst'].put(base, t - (self.HAND - .23), ECX, GROUND + 10, 5)
        if 'starfall' in FX:
            base = FX['starfall'].put(base, t - (self.FALL - .35), ECX + 30, GROUND + 12, 3)
        return base

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        # ---- 1. 星臨（変身）：金と紫の星がらせんで集まる
        if .3 <= t < self.AW:
            u = (t - .3) / (self.AW - .3)
            rnd = random.Random(1)
            F.push()
            for i in range(110):
                a0 = rnd.uniform(0, math.tau)
                r = 240 * (1 - u) ** 1.3 * rnd.uniform(.5, 1) + 8
                ang = a0 + u * 6
                x, y = HOME_X + math.cos(ang) * r, GROUND - 100 + math.sin(ang) * r * .6
                F.star(x, y, 9, 1.3, (PALE, VIO, GOLDC, GOLDC)[i % 4], .9, rot=45 * (i % 2))
        a = t - self.AW
        if 0 <= a < 1.0:                           # 解放：金の輪が 4 重に広がる・金の閃光
            for j in range(4):
                q = clamp((a - j * .06) / .7)
                F.ring(HOME_X, GROUND - 100, 30 + 620 * eout(q), (30 + 620 * eout(q)) * (.4 + .15 * j), 4, (GOLDC, VIO, PALE, GOLDC)[j], 1 - q, soft=6)
            X.star_flash(F, HOME_X, GROUND - 100, 380 * (1 - clamp(a / .35)) ** .4, 1 - clamp(a / .35), rot=a * 40, col=X.WHITE, sub=GOLDC)
            X.parts(F, HOME_X, GROUND - 40, a, 120, 3, GOLDC, 130, 202, 'ember', up=3.5, star=True, size=(3, 6))
        if self.awake(t) and t < 7.6:              # 服のきらめき：体の上の 9 点がゆっくり明滅（チカチカさせない）
            rnd = random.Random(31)
            for i in range(9):
                ox, oy, ph = rnd.uniform(-34, 30), rnd.uniform(-150, -20), rnd.uniform(0, math.tau)
                kk = max(0.0, math.sin(t * 1.8 + ph)) ** 2
                if kk > .05:
                    F.star(hh['x'] + ox, hh['f'] + oy, 9 * kk + 2, 1.2, PALE, .8 * kk, rot=45)
        if self.awake(t) and t < 7.6:              # 星臨中：体から昇る金と紫の星屑・後ろに伸びる光の尾
            X.parts(F, hh['x'], hh['f'] - 20, t - self.AW, 70, 1.6, GOLDC, 90, 203, 'ember', up=2.8, spread=(230, 310), star=True, size=(2, 4))
            X.parts(F, hh['x'], hh['f'] - 60, t - self.AW, 50, 1.2, VIO, 110, 204, 'ember', up=2.0, spread=(200, 340), star=True, size=(2, 3))
            if hh['f'] < GROUND - 30:              # 空にいる間：足元から下へ流れる光の尾
                F.line([(hh['x'] + 4, hh['f'] - 10), (hh['x'] + 14, hh['f'] + 60)], VIO, 10, .5, glow=10)
        # ---- 2. 天球儀の時計
        k = ease((t - 2.15) / .6) * (1 - ease((t - 4.46) / .1))
        if k > 0:
            lit = clamp((t - 2.25) / .7)
            hand = 1.0 - 30 * ease((t - self.REW) / (self.STOP - self.REW)) ** 1.5
            if t >= self.STOP:
                hand = -29.0
            armillary(B, GX, GY, GR, k, t, hand, lit)
            pts = [hour_pos(GX, GY, GR * k, i) for i in range(12)]
            nl = int(12 * clamp((t - 2.55) / .6))
            for i in range(nl):                    # 星座の線（金）
                B.line([pts[i], pts[(i + 5) % 12]], mul(GOLDC, .6), 1, .7 * k, glow=4)
            if self.REW <= t < self.STOP:
                F.speedlines(GX, GY, 50, GR * .9, GOLDC, .8, int(t * 60))
        # ---- 3. 12 の金の星が槍になって降る（星の雨はシート）
        for i in range(12):
            t0 = self.FALL + i * .04
            th = t0 + .1
            px, py = hour_pos(GX, GY, GR, i)
            if t0 <= t < th:
                u = ein((t - t0) / .1)
                tx, ty = ECX + (i - 6) * 8, ECY + 10
                x, y = px + (tx - px) * u, py + (ty - py) * u
                ang = math.atan2(ty - py, tx - px)
                F.push()
                F.line([(x - math.cos(ang) * 130, y - math.sin(ang) * 130), (x, y)], GOLDC, 7, 1, glow=9)
                F.line([(x - math.cos(ang) * 130, y - math.sin(ang) * 130), (x, y)], X.WHITE, 2, 1, glow=3)
                F.star(x, y, 28, 2, X.WHITE, 1, rot=math.degrees(ang))
            if th <= t < th + .3:                  # 刺さった所に金の十字
                q = (t - th) / .3
                X.star_flash(F, ECX + (i - 6) * 8, ECY + 10, 90 * (1 - q), 1 - q, rot=i * 30, col=X.WHITE, sub=GOLDC)
        # ---- 4. 金の長針が剣のように落ちる（左回り）
        if self.FALL + .25 <= t < self.HAND:
            u = ein((t - self.FALL - .25) / (self.HAND - self.FALL - .25))
            tgt = math.atan2(ECY - GY, ECX - GX) - math.tau
            ang = -math.pi / 2 + (tgt + math.pi / 2) * u
            ln = GR * .95 + (math.hypot(ECX - GX, ECY - GY) - GR * .95) * u
            hx, hy = GX + math.cos(ang) * ln, GY + math.sin(ang) * ln
            F.push()
            F.line([(GX, GY), (hx, hy)], GOLDC, 12, 1, glow=8)
            F.line([(GX, GY), (hx, hy)], X.WHITE, 3, 1, glow=3)
            for j in range(1, 5):
                a2 = ang + j * .09
                F.line([(GX, GY), (GX + math.cos(a2) * ln, GY + math.sin(a2) * ln)], GOLDC, 4, .5 - j * .1, glow=6)
            X.star_flash(F, hx, hy, 90, 1, rot=t * 300, col=X.WHITE, sub=GOLDC)
        b = t - self.HAND
        if b >= 0:                                 # ---- 5. 超新星：金の芯・十字の閃光・金と紫の輪・ひび → 星屑の嵐
            kc = max(0.0, 1 - c.ra(self.HAND) / .1) if c.ra(self.HAND) >= 0 else 0
            F.disc(ECX, ECY, 60 * kc + 1, X.WHITE, kc, glow=2.6)
            ks = 1 - clamp(b / .45)
            X.star_flash(F, ECX, ECY, 420 * ks ** .4, ks, rot=b * 20, col=X.WHITE, sub=GOLDC)
            X.star_flash(F, ECX, ECY, 260 * ks ** .4, ks, rot=45 + b * 20, col=PALE, sub=VIO)
            kb = clamp(b / .04) * (1 - clamp((b - .08) / .18))
            F.beam(ECX, -10, GROUND + 20, 70 * kb, GOLDC, kb * .8)
            F.beam(ECX, -10, GROUND + 20, 20 * kb, X.WHITE, kb * .8)
            for j in range(5):
                q = clamp((b - j * .06) / .9)
                F.ring(ECX, ECY, 40 + 900 * eout(q), (40 + 900 * eout(q)) * (1 if j % 2 else .3), 5, (GOLDC, VIO, PALE, GOLDC, BLUE)[j], 1 - q, soft=6)
            kc2 = clamp(b / .1) * (1 - clamp((b - .7) / .4))
            if kc2 > 0:
                rnd = random.Random(17)
                F.push()
                for i in range(22):
                    ang = rnd.uniform(0, math.tau)
                    pts = [(ECX, ECY)]
                    ln = 900 * eout(clamp(b / .18))
                    for j in range(6):
                        r_ = ln * (j + 1) / 6
                        pts.append((ECX + math.cos(ang + rnd.uniform(-.25, .25)) * r_, ECY + math.sin(ang + rnd.uniform(-.25, .25)) * r_))
                    F.line(pts, GOLDC if i % 3 == 0 else X.WHITE, 2, kc2, glow=6)
            X.parts(F, ECX, ECY, b, 150, 16, GOLDC, 50, 401, wid=2)
            X.parts(F, ECX, ECY, b, 200, 7, VIO, 120, 402, 'ember', up=2.5, star=True, size=(3, 7))
            X.parts(F, GX, GY - 100, b, 260, 3, GOLDC, 200, 403, 'ember', up=-2.4, spread=(0, 360), star=True, size=(2, 6))
            F.speedlines(ECX, ECY, 60, 260, GOLDC, .9 * (1 - clamp(b / .6)), int(t * 60))
        if 1.8 <= t < 2.1:                         # タメ 1：足元に金の光が吸い込まれる
            q = clamp((t - 1.8) / .25)
            B.ring(HOME_X, GROUND + 8, 160 * (1 - q) + 20, (160 * (1 - q) + 20) * .24, 3, GOLDC, q)
        if 2.05 <= t < 2.4:                        # 踏み切り：金の輪と砂ぼこり
            q = clamp((t - 2.05) / .35)
            B.ring(HOME_X, GROUND + 8, 30 + 200 * eout(q), (30 + 200 * eout(q)) * .24, 4, GOLDC, 1 - q)
        X.dust(c.FF, HOME_X, GROUND + 4, t - 2.05, 16, 5, 0, seed=33)
        if 3.62 <= t < self.FALL:                  # タメ 2：杖の先に金の光が集まる
            gx, gy = tip(hh)
            q = clamp((t - 3.62) / (self.FALL - 3.62))
            F.disc(gx, gy, 6 + 16 * q, GOLDC, q, glow=3)
            F.ring(gx, gy, 80 * (1 - q) + 10, 80 * (1 - q) + 10, 2, GOLDC, q, soft=4)
        if 5.8 <= t < 6.4:                         # 着地：金の星の輪が足元から広がる
            q = clamp((t - 5.8) / .5)
            B.ring(HOME_X, GROUND + 8, 30 + 180 * eout(q), (30 + 180 * eout(q)) * .24, 4, GOLDC, 1 - q)
            X.parts(F, HOME_X, GROUND, t - 5.8, 40, 6, GOLDC, 40, 77, 'ember', up=1.2, star=True, size=(3, 5))
        if t >= 6.3:
            X.glint(F, *tip(hh), t, 6.35, .3, 80)

    def enemy(self, c):
        st, kb = X.enemy_state(c, self.hits, GOLDC, dis0=5.55)
        t = c.t
        if self.REW <= t < self.STOP:
            kb += 30 * math.sin((t - self.REW) * 40)
        return st, kb

    def ui(self, c, img):
        t = c.t
        if t < .5:
            X.bubble(img, '星臨！', HOME_X - 100, GROUND - 230, c.rt)
        a = t - 1.2
        if 0 <= a < .8:
            sl = eout(clamp(a / .14)) - ein(clamp((a - .62) / .18))
            band = Image.new('RGBA', (W, H))
            from PIL import ImageDraw
            d = ImageDraw.Draw(band)
            yc = 330
            off = (1 - sl) * W
            d.polygon([(-50 + off, yc - 120), (W + 50 + off, yc - 190), (W + 50 + off, yc + 70), (-50 + off, yc + 140)], fill=(14, 10, 40, 235))
            d.line([(-50 + off, yc - 120), (W + 50 + off, yc - 190)], fill=(255, 214, 120, 255), width=4)
            d.line([(-50 + off, yc + 140), (W + 50 + off, yc + 70)], fill=(255, 214, 120, 255), width=4)
            rnd = random.Random(5)
            for i in range(80):
                x, y = rnd.uniform(0, W) + off, rnd.uniform(yc - 160, yc + 110)
                d.point((x - (t * 400) % 60, y), fill=(255, 255, 255, int(rnd.uniform(90, 255))))
            img.paste(Image.fromarray(np.asarray(band)[..., :3]), (0, 0), band)
            sp = X.SPR[fr('aw_float', t, .1)].resize((48 * 7, 50 * 7), Image.NEAREST)
            px = int(W - 300 + (1 - sl) * 400 - a * 40)
            img.paste(sp, (px, yc - 250), sp)
            if a > .1:
                X.metal(img, '星臨奥義', 170 - a * 20, yc - 60, 26, font=X.FONT_JA, stroke=4, plain=(220, 210, 255))
                X.metal(img, '終焉の大時計', 200 - a * 20, yc + 0, 52, sc=1.25 - .25 * eout(clamp((a - .1) / .1)), font=X.FONT_JA, stroke=5,
                        shine=clamp((a - .2) / .4))
        for i in range(12):
            th = self.FALL + i * .04 + .1
            aa = t - th
            if i % 3 == 2 and 0 <= aa < .5 and t < self.HAND:
                j = i // 3
                X.number(img, 2400 + i * 137, EN_X - 110 + j * 52, GROUND - 230 - j * 34, aa, size=28)
        b = t - self.HAND - .5
        if b >= 0:
            X.crit(img, EN_X + 20, GROUND - 360, b, 'Critical')
            X.crit(img, EN_X + 20, GROUND - 322, b - .12, 'Weak')
            X.number(img, 99999, EN_X - 90, GROUND - 270, b - .2, size=62, total=True)

    def sfx(self, m):
        T = m.T
        m.band(T(.25), 7.0, 600, 2400, .05, .3, .3, .8)
        m.charge(T(.30), .65, .26, 200, 1600)
        m.boom(T(self.AW), .9)
        m.triplet(self.AW, .3)
        m.shimmer(T(self.AW), 1.2, .12, 1)
        m.chime(T(self.AW + .1), [5700, 6500, 7400, 8300], .06, .1)
        m.whoosh(T(1.2), .2, 600, 6000, .3)
        m.chime(T(1.35), [8300, 7400, 6500, 5700], .07, .1)
        m.whoosh(T(self.RISE), .8, 300, 3000, .25)
        for k in range(12):
            m.ring(T(2.3 + k * .058), 3000 + k * 400, .2, .06)
        m.band(T(self.REW), .65, 200, 6000, .25, .3, .05, .1)
        for k in range(14):
            m.ring(T(self.REW + .65 * (1 - (1 - k / 14) ** .6)), 5200 - k * 150, .03, .06)
        m.ring(T(self.STOP), 2600, .8, .25)
        for i in range(12):
            m.whoosh(T(self.FALL + i * .04), .1, 2000, 9000, .07)
            m.ring(T(self.FALL + i * .04 + .1), 6000 + (i % 3) * 800, .08, .07)
        m.whoosh(T(self.FALL + .25), .25, 200, 1500, .35)
        m.triplet(self.HAND, .4)
        m.boom(T(self.HAND), 1.0)
        m.sub(T(self.HAND), 1.0, 1.2)
        m.band(T(self.HAND), 1.6, 9000, 400, .35, .4, .005, 1.2)
        m.shimmer(T(self.HAND, .3), 2.5, .12, 6)
        m.thump(T(5.8), .5, .25, 150)
        m.chime(T(6.3), [8300, 6500, 6100, 5700], .14, .12)

SK = {s.name: s for s in (Kokunoya(), Chien(), Kasoku(), Hidan(), Shuen())}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SK):
        X.render(SK[k])
