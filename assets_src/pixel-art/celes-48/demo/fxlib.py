"""リオの技の演出の共通部品（第 3 版）。skills.py から使う。
「リオの光の言葉」：どの技も同じ色の役割・同じ星の閃光・同じ着弾・同じ溜め・同じ退場で組む。
  色の役割    GOLD（主）・EMBER（補う燠の橙）・WHITE（芯）・NIGHT（奥義だけの夜の青）
  星の閃光    star_flash：4 方向の長い光 ＋ 45° ずらした 8 方向の短い光 ＋ 白い芯
  着弾        impact：白い芯 → 星 → 回る放射 → 衝撃の輪（細く明るい輪＋太く柔らかい輪）→ 火花 → 燠 → 残る光・地面の焦げ
              大きさは scale、ヒットストップ・白飛び・揺れ・寄りは Hit の tier（1 小・2 中・3 大）
  溜め        gather：刃先へ光の粒が集まる（加速）・縮む輪・足元の陣・刃先の灯の炎（音は charge の上がる音）
  斬撃        slash：外の柔らかい光・明るい芯・白い刃先の線・弧に沿って散る燠・0.35 秒残る残光の線
  退場        backflip：後ろへ宙返りして戻る（踏み切りと着地に砂ぼこり）→ 決めポーズで刃先がきらめく（glint）
時間：技の時刻 τ（ヒットストップの間は止まる・スローの間は遅れる）と実時間 rt を Timeline が対応づける。
粒はすべて τ の式で決まる（状態を持たない）ので、コマを 4 つのプロセスで並べて描ける。"""
import bisect
import math
import os
import random
import subprocess
import sys
import wave
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))

OUT = os.path.join(ROOT, 'out')
W, H, FPS, PX = 640, 720, 60, 4
GROUND = 520
HOME_X, EN_X = 500, 170
ECX, ECY = EN_X, GROUND - 95
FONT_JA = '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'
FONT_NUM = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
FONT_CRIT = '/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf'
if not os.path.exists(FONT_CRIT):
    FONT_CRIT = FONT_NUM
SR = 44100

# ---- 色の役割（3 つの技で共通） ----
GOLD, EMBER, WHITE, HOT = (255, 206, 90), (255, 132, 40), (255, 255, 255), (255, 240, 196)
NIGHT, PALE = (80, 120, 255), (196, 218, 255)          # 奥義だけ
DUST = (150, 134, 116)

# ---- 絵（使う側が SPR を差し替える。元はリオ rio-rs4/rio.py の手描きだったが RS 風の素材を削除したので空） ----
SPR = {}


def big(im, k=PX):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


SPRB = {k: big(v) for k, v in SPR.items()}


def _tip(im):
    """刃先（鋼の明るい色 M・白 V のうち体の中心からいちばん遠い点）。足元の中心からの差（画面の px）"""
    a = np.asarray(im).astype(int)
    m = (((a[..., 0] == 0xdf) & (a[..., 1] == 0xe6) & (a[..., 2] == 0xff)) |
         ((a[..., 0] == 255) & (a[..., 1] == 255) & (a[..., 2] == 255))) & (a[..., 3] > 0)
    ys, xs = np.where(m)
    if not len(xs):
        return (-70, -110)
    bb = np.where(a[..., 3] > 0)
    cy, cx = (bb[0].min() + bb[0].max()) / 2, (bb[1].min() + bb[1].max()) / 2
    i = ((xs - cx) ** 2 + (ys - cy) ** 2).argmax()
    return (xs[i] * PX + 2 - im.width * PX / 2, ys[i] * PX + 2 - im.height * PX + 8)


TIP = {k: _tip(v) for k, v in SPR.items()}


def tip(h):
    dx, dy = TIP.get(h['p'], (-70, -110))
    return h['x'] + dx, h['f'] + dy


def hero(p, x=HOME_X, f=GROUND, g=0, r=0.0):
    return dict(p=p, x=x, f=f, g=g, r=r)


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def eout(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def ein(t):
    t = max(0.0, min(1.0, t))
    return t * t * t


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def mul(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)


def mix(a, b, k):
    return tuple(int(x + (y - x) * k) for x, y in zip(a, b))


# ---------------- 背景・敵 ----------------
def make_bg():
    im = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(im)
    for y in range(H):
        if y < 380:
            v = 30 + y * .05
            d.line([(0, y), (W, y)], fill=(int(v * .85), int(v * .9), int(v * 1.15)))
        else:
            v = 46 + (y - 380) * .12
            d.line([(0, y), (W, y)], fill=(int(v * .95), int(v * .88), int(v * .8)))
    for i in range(4):
        x = 20 + i * 170
        d.rectangle([x, 120, x + 110, 380], fill=(22, 24, 34))
        d.ellipse([x, 60, x + 110, 180], fill=(22, 24, 34))
        d.rectangle([x + 116, 80, x + 134, 380], fill=(48, 50, 60))
    d.rectangle([0, 368, W, 384], fill=(56, 54, 58))
    for k in range(-12, 13):
        d.line([(W / 2 + k * 22, 384), (W / 2 + k * 90, H)], fill=(40, 38, 36))
    for j in range(10):
        y = 384 + (j ** 1.55) * 7
        d.line([(0, y), (W, y)], fill=(40, 38, 36))
    light = Image.new('L', (W, H), 0)
    ImageDraw.Draw(light).polygon([(60, 0), (260, 0), (520, H), (240, H)], fill=55)
    light = light.filter(ImageFilter.GaussianBlur(50))
    a = np.asarray(im).astype(float) + np.asarray(light)[..., None] * np.array([1.0, .85, .6])
    yy, xx = np.mgrid[0:H, 0:W]
    vig = 1 - .45 * (((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2) * 2.2
    return np.clip(a * vig[..., None], 0, 255)


def make_night(bg):
    """夜空：上は深い紺、地平は藍。柱は影絵、床は青く沈む。天の川の帯"""
    out = np.zeros_like(bg)
    yy, xx = np.mgrid[0:H, 0:W]
    k = np.clip(yy / 380, 0, 1)[..., None]
    sky = np.array([4, 6, 22]) * (1 - k) + np.array([26, 30, 78]) * k
    rnd = np.random.RandomState(7)
    band = np.exp(-((yy - (60 + xx * .35)) / 70.0) ** 2)
    noise = np.asarray(Image.fromarray((rnd.rand(H // 8, W // 8) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)) / 255
    sky = sky + (band * (.4 + .6 * noise))[..., None] * np.array([34, 30, 60])
    lum = bg.mean(2)
    out[:] = sky
    for i in range(4):                       # 柱だけ影絵で残す（窓の向こうは夜空）
        x = 20 + i * 170
        out[80:384, x + 116:x + 135] = np.array([6, 7, 18])
        out[80:92, x + 110:x + 141] = np.array([6, 7, 18])
    out[366:386] = np.array([10, 11, 26])
    gr = yy >= 368
    out[gr] = (lum[gr][:, None] * np.array([.22, .28, .55]))
    return np.clip(out, 0, 255)


def make_enemy():
    w, h = 40, 34
    cv = {}
    pal = ['#2a2040', '#463864', '#6a5a90', '#9a86c0']
    for y in range(h):
        for x in range(w):
            body = ((x - 20) / 17) ** 2 + ((y - 21) / 12) ** 2 < 1
            horn = (8 <= y <= 14 and abs(x - (12 + (14 - y) * .6)) < 1.5) or (6 <= y <= 14 and abs(x - (27 - (14 - y) * .5)) < 1.5)
            leg = y >= 30 and (abs(x - 9) < 2.5 or abs(x - 31) < 2.5 or abs(x - 18) < 2)
            if body or horn or leg:
                k = 3 - min(3, max(0, int(((y - 9) / 25 + (x - 6) / 70) * 4)))
                cv[(x, y)] = pal[k] if not horn else '#d8c8a8'
    for (x, y) in [(8, 19), (9, 19), (8, 20)]:
        cv[(x, y)] = '#ff3040'
    cv[(9, 20)] = '#ffd0d0'
    im = Image.new('RGBA', (w + 2, h + 2))
    px = im.load()
    for (x, y), c in cv.items():
        c = c.lstrip('#')
        px[x + 1, y + 1] = (int(c[:2], 16), int(c[2:4], 16), int(c[4:], 16), 255)
    for (x, y) in list(cv):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (x + dx, y + dy) not in cv:
                px[x + dx + 1, y + dy + 1] = (12, 10, 16, 255)
    return im.transpose(Image.FLIP_LEFT_RIGHT)


BG = make_bg()
NIGHT_BG = make_night(BG)
ENEMY = big(make_enemy(), 5)


# ---------------- 光（加算・2 段のにじみ・層ごとに足し合わせ） ----------------
class Light:
    def __init__(self):
        self.acc_s = self.acc_g = None
        self._fresh()

    def _fresh(self):
        self.s = Image.new('RGB', (W, H))
        self.g = Image.new('RGB', (W, H))
        self.ds, self.dg = ImageDraw.Draw(self.s), ImageDraw.Draw(self.g)
        self.dirty = False

    def push(self):
        """ここまでの絵を足し込んで新しい層にする（重なった光が上書きでなく足し算になる）"""
        if not self.dirty:
            return
        self.acc_s = self.s if self.acc_s is None else ImageChops.add(self.acc_s, self.s)
        self.acc_g = self.g if self.acc_g is None else ImageChops.add(self.acc_g, self.g)
        self._fresh()

    def disc(self, x, y, r, col, k=1.0, glow=2.0):
        if r <= 0 or k <= 0:
            return
        self.dirty = True
        self.dg.ellipse([x - r * glow, y - r * glow, x + r * glow, y + r * glow], fill=mul(col, k * .7))
        self.ds.ellipse([x - r, y - r, x + r, y + r], fill=mul(col, k))

    def star(self, x, y, ln, wd, col, k=1.0, rot=0.0, n=4):
        if ln <= 0 or k <= 0:
            return
        self.dirty = True
        for i in range(n):
            a = math.radians(rot + i * 360 / n)
            for sc, w2 in ((1, wd), (.45, wd * 2.4)):
                ex, ey = x + math.cos(a) * ln * sc, y + math.sin(a) * ln * sc
                nx, ny = -math.sin(a) * w2, math.cos(a) * w2
                self.ds.polygon([(x + nx, y + ny), (ex, ey), (x - nx, y - ny)], fill=mul(col, k))
            self.dg.line([(x, y), (x + math.cos(a) * ln * .8, y + math.sin(a) * ln * .8)], fill=mul(col, k * .5), width=max(2, int(wd * 3)))

    def rays(self, x, y, n, r0, r1, col, k, seed, wd=4, rot=0.0):
        if k <= 0:
            return
        self.dirty = True
        rnd = random.Random(seed)
        for _ in range(n):
            a = rnd.uniform(0, math.tau) + math.radians(rot)
            l1 = r1 * rnd.uniform(.5, 1.15)
            w2 = wd * rnd.uniform(.5, 1.3)
            nx, ny = -math.sin(a) * w2, math.cos(a) * w2
            sx, sy = x + math.cos(a) * r0, y + math.sin(a) * r0
            pts = [(sx + nx, sy + ny), (x + math.cos(a) * l1, y + math.sin(a) * l1), (sx - nx, sy - ny)]
            self.ds.polygon(pts, fill=mul(col, k * rnd.uniform(.6, 1)))
            self.dg.polygon(pts, fill=mul(col, k * .35))

    def ring(self, x, y, rx, ry, wd, col, k=1.0, soft=3.0):
        if rx <= 1 or k <= 0:
            return
        self.dirty = True
        self.ds.ellipse([x - rx, y - ry, x + rx, y + ry], outline=mul(col, k), width=max(1, int(wd)))
        self.dg.ellipse([x - rx, y - ry, x + rx, y + ry], outline=mul(col, k * .8), width=max(1, int(wd * soft)))

    def line(self, pts, col, wd=2, k=1.0, glow=5):
        if k <= 0:
            return
        self.dirty = True
        self.ds.line(pts, fill=mul(col, k), width=max(1, int(wd)))
        self.dg.line(pts, fill=mul(col, k * .7), width=max(2, int(wd * glow)))

    def beam(self, x, y0, y1, wd, col, k=1.0):
        """縦の光の柱：芯が白、外が色"""
        if wd <= 0 or k <= 0:
            return
        self.dirty = True
        self.dg.rectangle([x - wd * 2.6, y0, x + wd * 2.6, y1], fill=mul(col, k * .6))
        self.ds.rectangle([x - wd, y0, x + wd, y1], fill=mul(col, k))
        self.ds.rectangle([x - wd * .4, y0, x + wd * .4, y1], fill=mul(WHITE, k))

    def poly(self, pts, col, k=1.0, glow=True):
        if k <= 0:
            return
        self.dirty = True
        self.ds.polygon(pts, fill=mul(col, k))
        if glow:
            self.dg.polygon(pts, fill=mul(col, k * .6))

    def flame(self, x, y, s, flick, k=1.0, cols=(EMBER, GOLD, WHITE)):
        """灯の炎（しずく形）：外は燠の橙・中は金・芯は白"""
        if s <= .5 or k <= 0:
            return
        self.dirty = True

        def drop(sc):
            pts = []
            for i in range(24):
                a = math.tau * i / 24
                sa = math.sin(a)
                rx = s * sc * .72 * (1 if sa >= 0 else 1 + sa * .75)
                ry = s * sc * (.72 if sa >= 0 else 1.55 + .3 * flick)
                pts.append((x + math.cos(a) * rx + (sa < 0) * flick * s * .12 * sa, y + sa * ry))
            return pts
        self.dg.ellipse([x - s * 2.6, y - s * 2.8, x + s * 2.6, y + s * 2.2], fill=mul(cols[0], k * .75))
        self.ds.polygon(drop(1.0), fill=mul(cols[0], k))
        self.ds.polygon(drop(.68), fill=mul(cols[1], k))
        self.ds.polygon(drop(.34), fill=mul(cols[2], k))

    def lantern(self, x, y, s, flick, k=1.0):
        """紙の灯籠：にじみ・胴（骨の線）・上下の枠・中の炎"""
        if s <= .5 or k <= 0:
            return
        self.dirty = True
        self.dg.ellipse([x - s * 2.8, y - s * 2.8, x + s * 2.8, y + s * 2.8], fill=mul((200, 92, 12), k))
        self.ds.rounded_rectangle([x - s * .78, y - s, x + s * .78, y + s], radius=max(1, s * .45),
                                  fill=mul((255, 150 + int(40 * flick), 52), k))
        for j in (-.5, 0, .5):
            self.ds.line([(x - s * .74, y + j * s), (x + s * .74, y + j * s)], fill=mul((190, 84, 16), k), width=1)
        self.ds.rectangle([x - s * .5, y - s * 1.12, x + s * .5, y - s * .92], fill=mul((140, 64, 18), k))
        self.ds.rectangle([x - s * .5, y + s * .92, x + s * .5, y + s * 1.12], fill=mul((140, 64, 18), k))
        self.ds.ellipse([x - s * .35, y - s * .15, x + s * .35, y + s * .62], fill=mul((255, 248, 210), k))

    def speedlines(self, cx, cy, n, r0, col, k, seed):
        if k <= 0:
            return
        self.dirty = True
        rnd = random.Random(seed)
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            r = rnd.uniform(r0, r0 * 1.5)
            ln = rnd.uniform(60, 220)
            self.ds.line([(cx + math.cos(a) * r, cy + math.sin(a) * r), (cx + math.cos(a) * (r + ln), cy + math.sin(a) * (r + ln))],
                         fill=mul(col, k * rnd.uniform(.4, 1)), width=rnd.choice([1, 1, 2]))

    def flare(self, x, y, ln, k, col=(255, 232, 190)):
        """横に伸びるアナモルフィックの筋＋中心へ並ぶゴースト（いちばん大きな閃光だけ）"""
        if k <= 0:
            return
        self.push()
        self.dirty = True
        for i in range(8, 0, -1):
            f = i / 8
            self.ds.line([(x - ln * f, y), (x + ln * f, y)], fill=mul(col, k * (1.05 - f) ** 1.3), width=2)
            self.dg.line([(x - ln * f * .8, y), (x + ln * f * .8, y)], fill=mul(col, k * .35 * (1.05 - f)), width=14)
        self.ds.line([(x, y - ln * .12), (x, y + ln * .12)], fill=mul(col, k * .7), width=2)
        for j, (f, r) in enumerate(((.45, 16), (.8, 9), (1.25, 26))):
            gx, gy = x + (W / 2 - x) * f * 2, y + (H / 2 - y) * f * 2
            self.dg.ellipse([gx - r, gy - r, gx + r, gy + r], outline=mul((150, 190, 255) if j == 1 else col, k * .28), width=2)
        self.push()

    def apply(self, base):
        self.push()
        if self.acc_s is None:
            return base
        g1 = np.asarray(self.acc_g.filter(ImageFilter.GaussianBlur(6))).astype(float)
        g2 = np.asarray(self.acc_g.filter(ImageFilter.GaussianBlur(26))).astype(float)
        s = np.asarray(self.acc_s.filter(ImageFilter.GaussianBlur(.7))).astype(float)
        add = s + g1 * .8 + g2 * 1.1
        return 255 - (255 - base) * (255 - np.clip(add, 0, 255)) / 255     # スクリーン合成


# ---------------- 煙・砂ぼこり・焦げ（加算でなく、上に重ねる） ----------------
_KC = {}


def _kern(rx, ry):
    key = (max(1, int(rx)), max(1, int(ry)))
    if key not in _KC:
        rx, ry = key
        yy, xx = np.mgrid[-ry:ry + 1, -rx:rx + 1]
        _KC[key] = np.clip(1 - (xx / rx) ** 2 - (yy / ry) ** 2, 0, 1) ** 1.6
    return _KC[key]


class Fog:
    def __init__(self):
        self.A = None

    def puff(self, x, y, rx, ry, al, col):
        if al <= .01 or rx < 1 or ry < .5:
            return
        if self.A is None:
            self.A, self.C = np.zeros((H, W)), np.zeros((H, W, 3))
        k = _kern(rx, ry) * min(1, al)
        h, w = k.shape
        x0, y0 = int(x) - w // 2, int(y) - h // 2
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
        if X1 <= X0 or Y1 <= Y0:
            return
        kk = k[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        self.A[Y0:Y1, X0:X1] = kk + self.A[Y0:Y1, X0:X1] * (1 - kk)
        self.C[Y0:Y1, X0:X1] = np.array(col) * kk[..., None] + self.C[Y0:Y1, X0:X1] * (1 - kk[..., None])

    def apply(self, base):
        if self.A is None:
            return base
        return base * (1 - self.A[..., None]) + self.C


# ---------------- 粒（状態を持たない：τ の式で位置が決まる） ----------------
def parts(L, x, y, age, n, sp, col, life, seed, kind='spark', up=0.0, spread=(0, 360), grav=.25, size=(2, 4.5), wid=2, star=False):
    if age < 0 or n <= 0:
        return
    f = age * FPS
    rnd = random.Random(seed)
    L.dirty = True
    for _ in range(n):
        a = math.radians(rnd.uniform(*spread))
        v = rnd.uniform(.35, 1) * sp
        lf = life * rnd.uniform(.5, 1.2)
        s = rnd.uniform(*size)
        ph = rnd.uniform(0, 6.28)
        if f >= lf:
            continue
        d = .9 if kind == 'spark' else .955
        g = grav if kind == 'spark' else -.05
        vx0, vy0 = math.cos(a) * v, math.sin(a) * v - up
        dn = d ** f
        S = (1 - dn) / (1 - d)
        px = x + vx0 * S
        py = y + vy0 * S + g / (1 - d) * (f - S)
        vx, vy = vx0 * dn, vy0 * dn + g * S
        k = (1 - f / lf) ** .8
        c = mul(col, k)
        if kind == 'spark':
            L.ds.line([(px, py), (px - vx * 2.6, py - vy * 2.6)], fill=c, width=wid)
            L.dg.line([(px, py), (px - vx * 2.6, py - vy * 2.6)], fill=mul(c, .6), width=wid + 4)
        else:
            px += math.sin(f * .12 + ph) * 3
            r = s * (.5 + .5 * k)
            if star:
                L.ds.line([(px - r * 1.6, py), (px + r * 1.6, py)], fill=c, width=1)
                L.ds.line([(px, py - r * 1.6), (px, py + r * 1.6)], fill=c, width=1)
            L.ds.rectangle([px - r / 2, py - r / 2, px + r / 2, py + r / 2], fill=c)
            L.dg.ellipse([px - r * 2, py - r * 2, px + r * 2, py + r * 2], fill=mul(c, .5))


def dust(fog, x, y, age, n=12, sp=4.0, dirx=0.0, seed=0, life=.6, size=16, col=DUST):
    """砂ぼこり（踏み込み・着地・跳躍）：横へ広がって膨らみ、薄れる。小石も少し跳ねる"""
    if age < 0 or age > life * 1.4:
        return
    rnd = random.Random(seed)
    f = age * FPS
    for i in range(n):
        vx = (dirx * .8 + rnd.uniform(-1, 1)) * sp * rnd.uniform(.5, 1.2)
        vy = -rnd.uniform(.1, .9) * sp * .45
        lf = life * rnd.uniform(.6, 1.2)
        s0 = size * rnd.uniform(.6, 1.3)
        if age >= lf:
            continue
        d = .9
        S = (1 - d ** f) / (1 - d)
        u = age / lf
        r = s0 * (.45 + 1.1 * eout(u))
        fog.puff(x + vx * S, y + vy * S, r, r * .62, .5 * (1 - u) ** 1.3, col)
    for i in range(n // 2):          # 小石
        vx = (dirx * .6 + rnd.uniform(-1, 1)) * sp * 1.4
        vy = -rnd.uniform(3, 7)
        px, py = x + vx * f * .9, y + vy * f + .35 * f * f
        if py < y + 4 and age < .5:
            fog.puff(px, py, 2.4, 2.4, .9, (40, 32, 28))


def star_flash(L, x, y, size, k, rot=0.0, col=WHITE, sub=GOLD):
    """リオの星の閃光：4 方向の長い光＋45° の 8 方向の短い光＋白い芯（全部の技で同じ形）"""
    if size < 1 or k <= .01:
        return
    L.push()
    L.dirty = True
    r = min(size * .3, 26 + size * .1)
    L.dg.ellipse([x - r, y - r, x + r, y + r], fill=mul(sub, k * .5))
    L.star(x, y, size * .5, size * .028 + .8, sub, k * .9, rot + 45)
    L.star(x, y, size, size * .045 + 1, col, k, rot)
    L.disc(x, y, size * .06 + 1.5, WHITE, k, glow=3)
    L.push()


def glint(L, x, y, t, t0, dur=.18, size=40, rot=0.0):
    """刃先のきらめき（溜めの止め・決めポーズ）"""
    u = (t - t0) / dur
    if 0 <= u <= 1:
        k = math.sin(math.pi * u) ** .7
        star_flash(L, x, y, size * (.35 + .65 * k), k, rot + u * 50)


def gather(c, x, y, t0, t1, seed=0, big=1.0, cols=(GOLD, EMBER), flame=True):
    """溜め：光の粒が刃先へ加速して集まる＋縮む輪＋刃先の灯の炎（大きくなる）＋足元の陣"""
    t = c.t
    if not (t0 <= t < t1 + .02):
        return
    u = clamp((t - t0) / (t1 - t0))
    F = c.F
    F.push()
    F.dirty = True
    rnd = random.Random(seed)
    for i in range(int(44 * big)):
        a = rnd.uniform(0, math.tau)
        R0 = rnd.uniform(80, 175) * big
        s0 = rnd.uniform(0, .72)
        q = (u - s0) / .3
        if not 0 <= q <= 1:
            continue
        r = R0 * (1 - q) ** 2 + 4
        ln = 10 + 34 * q
        col = cols[i % 2]
        ca, sa = math.cos(a + (1 - q) * .6), math.sin(a + (1 - q) * .6)
        F.ds.line([(x + ca * r, y + sa * r), (x + ca * (r + ln), y + sa * (r + ln))], fill=mul(col, .6 + .4 * q), width=3)
        F.ds.rectangle([x + ca * r - 1.5, y + sa * r - 1.5, x + ca * r + 1.5, y + sa * r + 1.5], fill=mul(HOT, .5 + .5 * q))
        F.dg.line([(x + ca * r, y + sa * r), (x + ca * (r + ln), y + sa * (r + ln))], fill=mul(col, .3 + .5 * q), width=8)
    F.ring(x, y, 8 + 140 * big * (1 - u) ** 1.6, 8 + 140 * big * (1 - u) ** 1.6, 2, cols[0], .9 * u, soft=4)
    if flame:
        F.flame(x, y, 3 + 11 * big * eout(u), math.sin(t * 47), 1.0)
    else:
        F.disc(x, y, 3 + 9 * big * eout(u), WHITE, 1.0, glow=3)
    F.push()


def ground_sigil(L, x, k, t, col=GOLD, sub=EMBER, r=80):
    """足元の陣（2 重の楕円＋回る 8 つの点）"""
    if k <= 0:
        return
    L.ring(x, GROUND + 6, r * k, r * .24 * k, 3, sub, .9)
    L.ring(x, GROUND + 6, r * .66 * k, r * .16 * k, 2, col, .8)
    for i in range(8):
        a = t * 2.2 + i * math.tau / 8
        L.disc(x + math.cos(a) * r * .84 * k, GROUND + 6 + math.sin(a) * r * .2 * k, 2.2, col, .9 * k, glow=2.5)


# ---------------- 斬撃（弦の 2 点とふくらみで弧を決める） ----------------
def _arc(p0, p1, bulge, n=44):
    (x0, y0), (x1, y1) = p0, p1
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    L_ = math.hypot(x1 - x0, y1 - y0) or 1
    nx, ny = -(y1 - y0) / L_, (x1 - x0) / L_
    cx, cy = mx + nx * bulge * 2, my + ny * bulge * 2      # 2 次ベジェの制御点（中点がふくらみの頂点）
    sg = 1 if bulge >= 0 else -1
    pts = []
    for i in range(n + 1):
        u = i / n
        px = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1
        py = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1
        tx = 2 * (1 - u) * (cx - x0) + 2 * u * (x1 - cx)
        ty = 2 * (1 - u) * (cy - y0) + 2 * u * (y1 - cy)
        tl = math.hypot(tx, ty) or 1
        ox, oy = -ty / tl, tx / tl
        if ox * nx * sg + oy * ny * sg < 0:
            ox, oy = -ox, -oy
        pts.append((px, py, ox, oy))
    return pts


def slash(c, p0, p1, bulge, t0, dur, wd, col=GOLD, sub=EMBER, seed=0, life=.24):
    """斬撃の層：外の柔らかい光 → 明るい芯 → 熱い帯 → 白い刃先の線 → 弧に沿って燠 → 残光の線（0.35 秒）"""
    t = c.t
    if t < t0:
        return
    F = c.F
    p = clamp((t - t0) / dur)
    age = t - (t0 + dur)
    uh = eout(p)
    k = 1.0 if age <= 0 else max(0.0, 1 - age / life) ** 1.4
    arc = _arc(p0, p1, bulge)
    m = max(2, int(len(arc) * uh))
    seg = arc[:m + 1]
    F.push()
    if k > 0:
        def band(a, b):
            out = [(x + ox * th * a, y + oy * th * a) for (x, y, ox, oy), th in zip(seg, ths)]
            inn = [(x + ox * th * b, y + oy * th * b) for (x, y, ox, oy), th in zip(seg, ths)]
            return out + inn[::-1]
        ths = [wd * math.sin(math.pi * clamp(i / (len(arc) - 1) * .96 + .02)) ** .7 for i in range(len(seg))]
        F.dirty = True
        F.dg.polygon(band(.35, -1.7), fill=mul(sub, k * .75))
        F.ds.polygon(band(0, -1.0), fill=mul(col, k))
        F.ds.polygon(band(0, -.38), fill=mul(HOT, k))
        F.ds.line([(x, y) for x, y, _, _ in seg], fill=mul(WHITE, k), width=3)
        if p < 1:
            hx, hy = seg[-1][:2]
            star_flash(F, hx, hy, 46, 1.0, rot=t * 900)
    ka = max(0.0, 1 - age / .38) if age > 0 else 0
    if ka > 0:                                   # 残光の線（少し外へ流れて消える）
        F.push()
        F.dirty = True
        sh = age * 40
        pts = [(x + ox * sh, y + oy * sh) for x, y, ox, oy in arc[4:-4]]
        F.ds.line(pts, fill=mul(GOLD, ka * .9), width=2)
        F.dg.line(pts, fill=mul(sub, ka * .5), width=8)
    for j in range(0, len(arc), 2):              # 弧に沿って散る燠
        u = j / (len(arc) - 1)
        pa = t - (t0 + dur * u)
        if pa < 0:
            continue
        x, y, ox, oy = arc[j]
        parts(F, x, y, pa, 2, 3.2, (GOLD if j % 4 else sub), 46, seed * 131 + j, 'ember', up=.6,
              spread=(math.degrees(math.atan2(oy, ox)) - 50, math.degrees(math.atan2(oy, ox)) + 50))
    F.push()


# ---------------- 着弾（小・中・大を同じ順番で） ----------------
def impact(c, x, y, s, t0, seed=0, cold=False, rot=0.0):
    """白い芯 → 星 → 回る放射 → 衝撃の輪 → 火花 → 燠 → 残る光・焦げ。s：大きさ（1 小〜2.5 奥義）"""
    a = c.t - t0
    if a < 0:
        return
    ra = c.ra(t0)
    F, B = c.F, c.B
    sub = NIGHT if cold else EMBER
    # 残る光（後ろ）・地面の焦げと光
    kl = max(0.0, 1 - a / (1.0 + .5 * s))
    B.disc(x, y, 26 + 18 * s, mul(EMBER, .45), kl ** 1.5, glow=2.4)
    c.FB.puff(x, GROUND + 12, 60 + 70 * s, (60 + 70 * s) * .2, .6 * max(0.0, 1 - a / (1.8 + .6 * s)), (26, 12, 6))
    B.ring(x, GROUND + 12, (40 + 50 * s) * (.6 + .4 * eout(a / .1)), (40 + 50 * s) * .2, 6, EMBER, .7 * kl, soft=4)
    # 地面の衝撃の輪（2 重）
    kg = max(0.0, 1 - a / (.5 + .2 * s))
    for j in range(2):
        rr = 40 + (170 + 150 * s) * eout((a - j * .05) / (.42 + .1 * s))
        B.ring(x, GROUND + 10, rr, rr * .22, 4 - j, (GOLD, sub)[j], kg)
    # 白い芯（ヒットストップの間も実時間で脈打つ）
    kc = max(0.0, 1 - ra / (.06 + .03 * s)) if ra >= 0 else 0
    if kc > 0:
        F.push()
        F.disc(x, y, (12 + 12 * s) * (.6 + .4 * kc), WHITE, kc, glow=2.2)
    # 星（ストップ中は最大で止まる・明けたら縮む）
    ks = max(0.0, 1 - a / (.26 + .1 * s))
    if ks > 0:
        size = (90 + 90 * s) * (.7 + .3 * math.sin(min(1, ra / .05) * math.pi / 2)) * ks ** .45
        star_flash(F, x, y, size, ks ** .7, rot + a * 40, sub=GOLD)
    # 回る放射（ストップ中は短く、明けたら 4〜6 コマで伸びる）
    kr = max(0.0, 1 - a / (.42 + .12 * s))
    if kr > 0:
        F.push()
        ln = (110 + 130 * s) * (.38 + .62 * eout(a / .08))
        F.rays(x, y, int(14 + 8 * s), 22 * s, ln, GOLD, kr, seed, 3 + 1.6 * s, rot=rot + a * 28)
        F.rays(x, y, int(6 + 4 * s), 18 * s, ln * .7, HOT, kr, seed + 5, 2, rot=rot - a * 18)
    # 空の衝撃の輪（細く明るい輪＋太く柔らかい輪）
    kw = max(0.0, 1 - a / (.34 + .1 * s))
    if kw > 0:
        F.push()
        r = 24 + (90 + 150 * s) * eout(a / (.3 + .05 * s))
        F.dirty = True
        F.dg.ellipse([x - r, y - r, x + r, y + r], outline=mul(sub, kw * .8), width=int(10 + 8 * s))
        F.ds.ellipse([x - r, y - r, x + r, y + r], outline=mul(WHITE, kw), width=2)
        r2 = r * .62
        F.ds.ellipse([x - r2, y - r2, x + r2, y + r2], outline=mul(GOLD, kw * .7), width=2)
    # 火花・燠
    F.push()
    parts(F, x, y, a, int(30 + 40 * s), 15 + 8 * s, GOLD, 24, seed + 1)
    parts(F, x, y, a, int(10 + 12 * s), 22 + 8 * s, WHITE, 14, seed + 2, wid=1)
    parts(F, x, y, a, int(20 + 26 * s), 5 + 2.5 * s, sub if cold else EMBER, 70 + 25 * s, seed + 3, 'ember', up=1.4 + .5 * s)
    parts(F, x, y, a, int(8 + 10 * s), 4, GOLD, 90, seed + 4, 'ember', up=2.2, star=True, size=(3, 5))
    F.push()


# ---------------- 体の動き（共通） ----------------
def backflip(t, t0, dur, x0, x1, h=96):
    """退場：後ろへ宙返りして元の位置へ"""
    k = clamp((t - t0) / dur)
    x = x0 + (x1 - x0) * ease(k)
    f = GROUND - h * math.sin(math.pi * k)
    r = -360 * ease(clamp((k - .08) / .8))
    return hero('選択', x, f, 0, r)


def dim(t, t_in, t_out, depth=.55):
    """暗転：入り 0.17 秒・明け 0.45 秒"""
    return 1 - depth * ease((t - t_in) / .17) + depth * ease((t - t_out) / .45)


# ---------------- 命中の段（tier ごとのヒットストップ・白飛び・揺れ・寄り） ----------------
TIERS = {1: dict(stop=3, white=.36, wf=1, tint=.3, tf=.12, sh=7, shd=.09, z=0.0),
         2: dict(stop=6, white=.82, wf=2, tint=.36, tf=.18, sh=14, shd=.13, z=.03),
         3: dict(stop=10, white=.94, wf=2, tint=.5, tf=.4, sh=26, shd=.22, z=.06)}


class Hit:
    def __init__(self, t, tier, x, y, dx, dy, stop=None, z=None, tint=GOLD):
        self.t, self.tier, self.x, self.y = t, tier, x, y
        L_ = math.hypot(dx, dy) or 1
        self.dx, self.dy = dx / L_, dy / L_
        P = TIERS[tier]
        self.stop = P['stop'] if stop is None else stop
        self.z = P['z'] if z is None else z
        self.tint = tint


class Timeline:
    """τ（技の時刻）→ 実時間のコマ。命中で stop コマ止める・slow の間は遅くする"""
    def __init__(self, sk):
        self.slow = sk.slow
        holds = {h.t: h.stop for h in sk.hits}
        pend = sorted(holds)
        taus, tau = [], 0.0
        while tau < sk.dur - 1e-9:
            if pend and tau >= pend[0] - 1e-6:
                h = pend.pop(0)
                taus += [h] * (holds[h] + 1)
                tau = h + self.rate(h) / FPS
                continue
            taus.append(tau)
            tau += self.rate(tau) / FPS
        self.taus, self.n = taus, len(taus)

    def rate(self, tau):
        for a, b, r in self.slow:
            if a <= tau < b:
                return r
        return 1.0

    def rt(self, tau):
        i = bisect.bisect_left(self.taus, tau - 1e-9)
        if i <= 0:
            return 0.0
        if i >= self.n:
            return self.n / FPS + (tau - self.taus[-1])
        t0, t1 = self.taus[i - 1], self.taus[i]
        if t1 <= t0:
            return i / FPS
        return (i - 1 + (tau - t0) / (t1 - t0)) / FPS


class Ctx:
    def __init__(self, sk, tl, i):
        self.sk, self.tl, self.i = sk, tl, i
        self.t, self.rt = tl.taus[i], i / FPS
        self.frozen = i > 0 and tl.taus[i - 1] == self.t
        self.B, self.F = Light(), Light()
        self.FB, self.FF = Fog(), Fog()

    def ra(self, tau):
        return self.rt - self.tl.rt(tau)


def camera(sk, tl, rt):
    """白飛び（1〜2 コマ）→ 色つきの明け・方向つきの揺れ（減衰）・寄り（1.0→1+z→1.0）"""
    white, tint, ta, dx, dy, z, zc = 0.0, GOLD, 0.0, 0.0, 0.0, 0.0, (W / 2, H / 2)
    for h in sk.hits:
        a = rt - tl.rt(h.t)
        if a < -1e-6:
            continue
        P = TIERS[h.tier]
        if a < P['wf'] / FPS - 1e-6:
            white = max(white, P['white'] if a < 1 / FPS - 1e-6 else P['white'] * .75)
        else:
            u = (a - P['wf'] / FPS) / P['tf']
            if u < 1 and P['tint'] * (1 - u) ** 2 > ta:
                ta, tint = P['tint'] * (1 - u) ** 2, h.tint
        amp = P['sh'] * math.exp(-a / P['shd'])
        if amp > .4:
            o = math.cos(a * math.tau * 13)
            q = math.sin(a * math.tau * 17) * .35
            dx += h.dx * amp * o - h.dy * amp * q
            dy += h.dy * amp * o + h.dx * amp * q
        if h.z:
            hold = h.stop / FPS
            pz = eout(a / (3 / FPS)) if a < 3 / FPS else (1.0 if a < hold else 1 - ease((a - hold) / .3))
            if h.z * pz > z:
                z, zc = h.z * pz, (h.x, h.y)
    return white, tint, ta, dx, dy, z, zc


def apply_camera(img, dx, dy, z, zc):
    if z > .001:
        zz = 1 + z
        zz = max(zz, 1 + 2.2 * max(abs(dx) / W, abs(dy) / H) + .002)
        cx, cy = zc
        a = 1 / zz
        return img.transform((W, H), Image.AFFINE, (a, 0, cx - cx * a - dx * a, 0, a, cy - cy * a - dy * a), Image.BILINEAR)
    ix, iy = int(round(dx)), int(round(dy))
    if ix == 0 and iy == 0:
        return img
    a = np.asarray(img)
    a = np.pad(a, ((abs(iy), abs(iy)), (abs(ix), abs(ix)), (0, 0)), mode='edge')
    y0, x0 = abs(iy) - iy, abs(ix) - ix
    return Image.fromarray(a[y0:y0 + H, x0:x0 + W])


# ---------------- 合成 ----------------
def paste(base, im, cx, foot, alpha=1.0, tint=None, white=0.0, dissolve=0.0, seed=0, add=None, glow=False):
    a = np.asarray(im).astype(float)
    h, w = a.shape[:2]
    x0, y0 = int(cx - w / 2), int(foot - h)
    m = a[..., 3:4] / 255 * alpha
    rgb = a[..., :3]
    if tint:
        rgb = np.clip(rgb * (1 - tint[1]) + np.array(tint[0]) * tint[1] * (rgb.mean(2, keepdims=True) / 150 + .45), 0, 255)
    if white:
        rgb = rgb * (1 - white) + 255 * white
    if dissolve:
        cell = 8
        yy, xx = np.mgrid[0:h, 0:w]
        rnd = np.random.RandomState(seed).rand(h // cell + 1, w // cell + 1)[yy // cell, xx // cell]
        m = m * (~((rnd < dissolve) | (((yy // 4 + xx // 4) % 2 == 0) & (rnd < dissolve + .3))))[..., None]
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if X1 <= X0 or Y1 <= Y0:
        return base
    sl = (slice(Y0 - y0, Y1 - y0), slice(X0 - x0, X1 - x0))
    if glow:   # 光の残像：金色の光として足す（明るい所ほど明るく。暗い所でも濁らない）
        lum = a[..., :3].mean(2, keepdims=True) / 255
        g = np.array(glow) * (.6 + .4 * lum)
        base[Y0:Y1, X0:X1] = np.clip(base[Y0:Y1, X0:X1] + g[sl] * m[sl], 0, 255)
    elif add is not None:
        base[Y0:Y1, X0:X1] = np.clip(base[Y0:Y1, X0:X1] + np.array(add) * m[sl], 0, 255)
    else:
        base[Y0:Y1, X0:X1] = base[Y0:Y1, X0:X1] * (1 - m[sl]) + rgb[sl] * m[sl]
    return base


def sprite(h):
    im = SPRB[h['p']]
    if h['r']:
        im = im.rotate(h['r'], resample=Image.NEAREST, center=(im.width / 2, im.height * .62))
    return im


def enemy_state(c, hits, hot=GOLD, dis0=9.0, pre_tint=None):
    """敵：命中の止めの間は白・明けたら技の色に染まって薄れる・倒れたら赤 → 市松のモザイク。後ろへ飛ばされて戻る"""
    t = c.t
    kb = 0.0
    for h in hits:
        if t > h.t:
            kb += (12, 30, 52)[h.tier - 1] * math.sin(clamp((t - h.t) / (.3 + .1 * h.tier)) * math.pi)
    if t >= dis0:
        return dict(tint=((230, 40, 40), .75), dissolve=ease((t - dis0) / .35), seed=5), kb
    last = max([h for h in hits if t >= h.t], key=lambda h: h.t, default=None)
    if last is None:
        return (dict(tint=pre_tint) if pre_tint else {}), kb
    if c.ra(last.t) < (last.stop + 2) / FPS:
        return dict(white=.92), kb
    return dict(tint=(hot, .45 * max(0.2, 1 - (t - last.t) / 1.0))), kb


# ---------------- 文字（UI はいつも最後に描く） ----------------
def bubble(img, text, x, y, a):
    """技名の吹き出し：ぽんと出る（0.08 秒で 1.15 → 1.0）"""
    if a < 0:
        return
    sc = 1 + .15 * max(0, 1 - a / .08) if a < .08 else 1.0
    sc = .6 + .4 * clamp(a / .04) if a < .04 else sc
    f = ImageFont.truetype(FONT_JA, int(28 * sc))
    d = ImageDraw.Draw(img)
    tw = d.textlength(text, font=f)
    hh = 24 * sc
    d.rounded_rectangle([x - tw / 2 - 18 * sc, y - hh, x + tw / 2 + 18 * sc, y + hh], radius=int(20 * sc), fill=(250, 246, 236), outline=(60, 50, 40), width=3)
    d.polygon([(x + tw / 2 - 12, y + hh - 2), (x + tw / 2 + 16, y + hh + 20), (x + tw / 2 + 2, y + hh - 2)], fill=(250, 246, 236))
    d.text((x - tw / 2, y - 17 * sc), text, font=f, fill=(40, 30, 20))


_GRAD = [(0, (255, 255, 240)), (.42, (255, 222, 110)), (.52, (214, 128, 24)), (.75, (255, 196, 70)), (1, (255, 240, 170))]


def _grad(h):
    ys = np.linspace(0, 1, h)
    out = np.zeros((h, 3))
    for (a, ca), (b, cb) in zip(_GRAD, _GRAD[1:]):
        m = (ys >= a) & (ys <= b)
        k = ((ys[m] - a) / (b - a))[:, None]
        out[m] = np.array(ca) * (1 - k) + np.array(cb) * k
    return out


def metal(img, text, cx, cy, size, sc=1.0, shine=-1.0, font=FONT_CRIT, stroke=4, plain=None):
    """金属の金のグラデーションの文字（暗い縁取り・光の帯が走る）。plain=色 のときは単色"""
    f = ImageFont.truetype(font, max(6, int(size * sc)))
    bb = f.getbbox(text, stroke_width=stroke)
    w, h = bb[2] - bb[0] + 4, bb[3] - bb[1] + 4
    m_in = Image.new('L', (w, h))
    m_out = Image.new('L', (w, h))
    ImageDraw.Draw(m_out).text((2 - bb[0], 2 - bb[1]), text, font=f, fill=255, stroke_width=stroke, stroke_fill=255)
    ImageDraw.Draw(m_in).text((2 - bb[0], 2 - bb[1]), text, font=f, fill=255)
    if plain:
        rgb = np.ones((h, w, 3)) * np.array(plain)
    else:
        rgb = np.repeat(_grad(h)[:, None, :], w, 1)
        if shine >= 0:
            yy, xx = np.mgrid[0:h, 0:w]
            band = np.exp(-((xx - shine * (w + h) + yy * .6) / 7.0) ** 2)
            rgb = rgb + band[..., None] * 200
    rgb = np.clip(rgb, 0, 255)
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    dark = Image.new('RGB', (w, h), (48, 20, 4))
    img.paste(dark, (x0, y0), m_out)
    img.paste(Image.fromarray(rgb.astype(np.uint8)), (x0, y0), m_in)


def number(img, n, x, y, a, size=44, total=False):
    """数字：右の桁から落ちてきて弾む。total は金属の金で大きく"""
    if a < 0:
        return
    s = str(n)
    cw = size * .6
    for i, ch in enumerate(s):
        k = a - (len(s) - 1 - i) * .035
        if k < 0:
            continue
        dy = -24 * max(0, 1 - k / .07) + (7 * math.sin(min(1, k / .15) * math.pi) if k < .15 else 0)
        if total:
            metal(img, ch, x + i * cw, y + dy, size, font=FONT_NUM, stroke=4, shine=clamp((a - .25) / .5) if a > .25 else -1)
        else:
            metal(img, ch, x + i * cw, y + dy, size, font=FONT_NUM, stroke=4, plain=(255, 255, 255))


def crit(img, x, y, a, text='Critical'):
    """Critical：金属の金・ぽんと大きく出て 1.0 へ・光の帯が 1 回走る"""
    if a < 0:
        return
    sc = 1.55 - .55 * eout(a / .09) if a < .09 else 1 + .06 * math.sin(clamp((a - .09) / .12) * math.pi)
    metal(img, text, x, y, 30, sc, shine=clamp((a - .1) / .35) if .1 < a < .45 else -1)


# ---------------- 効果音 ----------------
class Mix:
    def __init__(self, tl):
        self.tl = tl
        self.a = np.zeros(int(SR * (tl.n / FPS + 1)))
        self.rnd = np.random.RandomState(3)

    def T(self, t, off=0.0):
        return self.tl.rt(t) + off

    def add(self, rt, sig):
        i = int(rt * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), len(self.a) - i)
        if n > 0:
            self.a[i:i + n] += sig[:n]

    def band(self, rt, dur, f0, f1, v, q=.35, att=.03, rel=.2):
        n = int(SR * dur)
        x = self.rnd.randn(n)
        out = np.zeros(n)
        seg = 1024
        for i in range(0, n, seg // 2):
            c = f0 * (f1 / f0) ** (i / max(1, n))
            s = x[i:i + seg]
            F = np.fft.rfft(s * np.hanning(len(s)))
            fr = np.fft.rfftfreq(len(s), 1 / SR)
            F *= np.exp(-((np.log(fr + 1) - np.log(c)) ** 2) / q)
            out[i:i + len(s)] += np.fft.irfft(F, len(s))
        env = np.minimum(1, np.arange(n) / (SR * att)) * np.minimum(1, (n - np.arange(n)) / (SR * rel))
        self.add(rt, out / (np.abs(out).max() + 1e-9) * v * env)

    def whoosh(self, rt, dur, f0, f1, v):
        """風切り：2 層のノイズ（低い胴＋高い縁）。山は 60% の位置"""
        n = int(SR * dur)
        tt = np.arange(n) / n
        env = np.where(tt < .6, (tt / .6) ** 2, ((1 - tt) / .4) ** 1.5)
        for fa, fb, vv in ((f0, f1, v), (f0 * 2.2, f1 * 1.6, v * .45)):
            m = Mix.__new__(Mix)
            m.a, m.rnd, m.tl = np.zeros(n + 10), self.rnd, self.tl
            m.band(0, dur, fa, min(16000, fb), 1.0, .3, .002, .002)
            self.add(rt, m.a[:n] * env * vv)

    def ring(self, rt, f, dur=.2, v=.25):
        tt = np.arange(int(SR * dur)) / SR
        s = sum(np.sin(2 * np.pi * f * m * tt) / (i + 1) for i, m in enumerate((1, 1.87, 2.71, 3.93))) * np.exp(-tt / (dur / 4))
        self.add(rt, s * v)

    def triplet(self, t_hit, v=.28, lo=4000, hi=7500):
        """金属音の 3 連打：真ん中（高い音）が閃光のコマ"""
        r = self.T(t_hit)
        self.ring(r - .12, lo, .2, v * .6)
        self.ring(r, hi, .32, v)
        self.ring(r + .12, lo, .26, v * .55)

    def thump(self, rt, v=.7, dur=.22, f0=150):
        tt = np.arange(int(SR * dur)) / SR
        f = f0 * (40 / f0) ** (tt / dur)
        self.add(rt, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .07) * v)

    def sub(self, rt, v=.8, dur=.55):
        """低いドン（重低音 60→30Hz）＋胴鳴り"""
        tt = np.arange(int(SR * dur)) / SR
        f = 62 * (30 / 62) ** (tt / dur)
        self.add(rt, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / .004) * np.exp(-tt / .16) * v)
        self.thump(rt, v * .7, .2, 170)

    def boom(self, rt, v=.8):
        self.sub(rt, v, .8)
        self.band(rt, .9, 2500, 120, v * .6, .6, .005, .5)

    def charge(self, rt, dur, v=.2, f0=220, f1=880):
        """溜めの上がる音：うなる正弦（ビブラート）＋上がるノイズ"""
        n = int(SR * dur)
        tt = np.arange(n) / SR
        f = f0 * (f1 / f0) ** (tt / dur) * (1 + .012 * np.sin(2 * np.pi * 7 * tt))
        ph = 2 * np.pi * np.cumsum(f) / SR
        env = (tt / dur) ** 1.5 * np.minimum(1, (dur - tt) / .02 + .0001)
        s = (np.sin(ph) + .35 * np.sin(2 * ph) + .2 * np.sin(3.01 * ph)) * env * v
        self.add(rt, s)
        self.band(rt, dur, 500, 5000, v * .9, .4, dur * .8, .03)

    def shimmer(self, rt, dur, v=.08, seed=0, lo=6000, hi=12000, n=14):
        """星のきらめき：高い短い音の粒"""
        r = np.random.RandomState(seed)
        for i in range(n):
            self.ring(rt + r.uniform(0, dur), r.uniform(lo, hi), .09, v * r.uniform(.5, 1))

    def chime(self, rt, fs, gap=.12, v=.12):
        for i, f in enumerate(fs):
            self.ring(rt + i * gap, f, .45, v)

    def wind(self, rt0, rt1, v=.06):
        self.band(rt0, rt1 - rt0, 380, 900, v, .5, .3, .5)

    def save(self, path):
        a = self.a - self.a.mean()
        pk = np.abs(a).max() + 1e-9
        a = np.tanh(a / pk * 1.6) / np.tanh(1.6) * .8         # 軽いリミッター（割れない）
        with wave.open(path, 'w') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((a * 32767).astype(np.int16).tobytes())


# ---------------- 1 コマ ----------------
class Skill:
    name, dur, slow, hits = '', 1.0, (), []
    ghost = (255, 196, 90)           # 残像の色（奥義は青白く）

    def night(self, t):
        return 0.0


_REG = {}


def frame(sk, tl, i):
    c = Ctx(sk, tl, i)
    t = c.t
    hh = sk.hero(t)
    sk.draw(c, hh)
    ekw, kb = sk.enemy(c)
    shiver = (4 if i % 2 else -4) if c.frozen else 0
    ex = EN_X - kb + shiver
    # 影
    lift = clamp(1 - (GROUND - hh['f']) / 260)
    c.FB.puff(hh['x'], GROUND + 6, 40 * lift + 1, 8 * lift + .6, .5 * lift, (6, 4, 8))
    c.FB.puff(ex, GROUND + 12, 96, 15, .55 * (1 - ekw.get('dissolve', 0)), (6, 4, 8))
    base = BG * sk.dark(t)
    nt = sk.night(t)
    if nt:
        base = base * (1 - nt) + NIGHT_BG * nt * min(1.0, sk.dark(t) + .35)
    base = c.B.apply(base)
    base = c.FB.apply(base)
    base = paste(base, ENEMY, ex, GROUND + 12, **ekw)
    if hh['g']:
        for j, al in enumerate((.8, .52, .32, .16)):
            g = sk.hero(t - (j + 1) * .024)
            if abs(g['x'] - hh['x']) + abs(g['f'] - hh['f']) > 6:
                base = paste(base, sprite(g), g['x'], g['f'] + 8, alpha=al, glow=sk.ghost)
    base = paste(base, sprite(hh), hh['x'], hh['f'] + 8)
    base = c.FF.apply(base)
    base = c.F.apply(base)
    white, tint, ta, dx, dy, z, zc = camera(sk, tl, c.rt)
    if ta:
        base = 255 - (255 - base) * (1 - np.array(tint) / 255 * ta)
    if white:
        base = base * (1 - white) + 255 * white
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    img = apply_camera(img, dx, dy, z, zc)
    sk.ui(c, img)
    return img


def _job(args):
    name, i, path = args
    sk = _REG[name]
    frame(sk, _REG[name + '#tl'], i).save(path)


def render(sk, workers=4):
    os.makedirs(OUT, exist_ok=True)
    tl = Timeline(sk)
    _REG[sk.name], _REG[sk.name + '#tl'] = sk, tl
    tmp = os.path.join(OUT, '_f_' + sk.name)
    os.makedirs(tmp, exist_ok=True)
    jobs = [(sk.name, i, os.path.join(tmp, f'{i:04d}.png')) for i in range(tl.n)]
    with Pool(workers) as p:
        p.map(_job, jobs, chunksize=4)
    m = Mix(tl)
    sk.sfx(m)
    wav = os.path.join(tmp, 'a.wav')
    m.save(wav)
    mp4 = os.path.join(OUT, f'skill_{sk.name}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(tmp, '%04d.png'), '-i', wav,
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'slow', '-c:a', 'aac', '-b:a', '128k', '-shortest', mp4], check=True)
    thumbs = [(i / FPS, Image.open(jobs[i][2]).resize((213, 240))) for i in range(0, tl.n, 9)]
    cols = 9
    sh = Image.new('RGB', (213 * cols, 256 * ((len(thumbs) + cols - 1) // cols)))
    d = ImageDraw.Draw(sh)
    for k, (t, im) in enumerate(thumbs):
        x, y = (k % cols) * 213, (k // cols) * 256
        sh.paste(im, (x, y + 16))
        d.text((x + 4, y + 2), f'{t:.2f}s', fill=(255, 255, 0))
    sh.save(os.path.join(OUT, f'skill_{sk.name}_sheet.png'))
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    print(mp4, f'{tl.n / FPS:.2f}s', f'{os.path.getsize(mp4) / 1e6:.2f}MB')
