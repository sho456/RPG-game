"""リオの技の演出・第 2 版（rio.py の手描きのドット絵で。rs-battle-fx の時間割＋派手さの決まり）
実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs4/skills.py [光刃 灯火連斬 天灯星斬]
出力：out/skill_<技>.mp4（音つき・640×720・60fps）・out/skill_<技>_sheet.png
第 1 版（rio-rs3）から足した派手さ：
  ・光の層を 3 つ（地面・体の後ろ・前）＋ 2 段のにじみ（小さい・大きい）＋ 白飛び（画面全体の閃光）
  ・命中の止め（ヒットストップ 4〜6 コマ）・画面の揺れ・敵が後ろへ飛ばされて戻る
  ・残像（金色の影が 3 つ）・集中線・斬撃の筋が画面を横切る
  ・粒は火花（速い・線で描く）と燠（遅い・昇る）の 2 種、1 回の命中で 100 前後
  ・術の色で敵を染める・倒した敵は赤 → 市松のモザイク"""
import math
import os
import random
import subprocess
import sys
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
import rio as R  # noqa: E402

OUT = os.path.join(ROOT, 'out')
W, H, FPS, PX = 640, 720, 60, 4
GROUND = 520
HOME_X, EN_X = 500, 170
FONT_JA = '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'
FONT_NUM = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SR = 44100
SPR = {k: R.render(v, foot=41 if k == '気絶' else 45) for k, v in R.POSES.items()}


def big(im, k=PX):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


SPRB = {k: big(v) for k, v in SPR.items()}


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
ENEMY = big(make_enemy(), 5)
ECX, ECY = EN_X, GROUND - 95      # 敵の中心（光の中心）


# ---------------- 光（加算・2 段のにじみ） ----------------
class Light:
    def __init__(self):
        self.s = Image.new('RGB', (W, H))     # くっきり
        self.g = Image.new('RGB', (W, H))     # にじみ
        self.ds, self.dg = ImageDraw.Draw(self.s), ImageDraw.Draw(self.g)

    @staticmethod
    def mul(c, k):
        return tuple(max(0, min(255, int(v * k))) for v in c)

    def disc(self, x, y, r, col, k=1.0, glow=2.0):
        self.dg.ellipse([x - r * glow, y - r * glow, x + r * glow, y + r * glow], fill=self.mul(col, k * .7))
        self.ds.ellipse([x - r, y - r, x + r, y + r], fill=self.mul(col, k))

    def star(self, x, y, ln, wd, col, k=1.0, rot=0.0, n=4):
        for i in range(n):
            a = math.radians(rot + i * 360 / n)
            for sc, w2 in ((1, wd), (.5, wd * 2.5)):
                ex, ey = x + math.cos(a) * ln * sc, y + math.sin(a) * ln * sc
                nx, ny = -math.sin(a) * w2, math.cos(a) * w2
                self.ds.polygon([(x + nx, y + ny), (ex, ey), (x - nx, y - ny)], fill=self.mul(col, k))
        self.dg.ellipse([x - ln * .5, y - ln * .5, x + ln * .5, y + ln * .5], fill=self.mul(col, k * .5))

    def rays(self, x, y, n, r0, r1, col, k, seed, wd=4):
        rnd = random.Random(seed)
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            l1 = r1 * rnd.uniform(.5, 1.15)
            w2 = wd * rnd.uniform(.5, 1.3)
            nx, ny = -math.sin(a) * w2, math.cos(a) * w2
            sx, sy = x + math.cos(a) * r0, y + math.sin(a) * r0
            pts = [(sx + nx, sy + ny), (x + math.cos(a) * l1, y + math.sin(a) * l1), (sx - nx, sy - ny)]
            self.ds.polygon(pts, fill=self.mul(col, k))
            self.dg.polygon(pts, fill=self.mul(col, k * .6))

    def ring(self, x, y, rx, ry, wd, col, k=1.0):
        if rx <= 1:
            return
        self.ds.ellipse([x - rx, y - ry, x + rx, y + ry], outline=self.mul(col, k), width=max(1, int(wd)))
        self.dg.ellipse([x - rx, y - ry, x + rx, y + ry], outline=self.mul(col, k * .8), width=max(1, int(wd * 3)))

    def crescent(self, cx, cy, r, a0, a1, wd, col, k=1.0, edge=(255, 255, 255)):
        n = 48
        outer, inner = [], []
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            t = math.sin(math.pi * i / n) ** .8 * wd
            outer.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
            inner.append((cx + math.cos(a) * (r - t), cy + math.sin(a) * (r - t)))
        poly = outer + inner[::-1]
        self.dg.polygon(poly, fill=self.mul(col, k))
        self.ds.polygon(poly, fill=self.mul(col, k * .85))
        self.ds.line(outer, fill=self.mul(edge, k), width=3)

    def line(self, pts, col, wd=2, k=1.0):
        self.ds.line(pts, fill=self.mul(col, k), width=wd)
        self.dg.line(pts, fill=self.mul(col, k * .7), width=wd * 5)

    def beam(self, x, y0, y1, wd, col, k=1.0):
        """縦の光の柱：芯が白、外が色"""
        self.dg.rectangle([x - wd * 2.5, y0, x + wd * 2.5, y1], fill=self.mul(col, k * .6))
        self.ds.rectangle([x - wd, y0, x + wd, y1], fill=self.mul(col, k))
        self.ds.rectangle([x - wd * .4, y0, x + wd * .4, y1], fill=self.mul((255, 255, 255), k))

    def lantern(self, x, y, s, flick, k=1.0):
        self.dg.ellipse([x - s * 2.6, y - s * 2.6, x + s * 2.6, y + s * 2.6], fill=self.mul((170, 80, 10), k))
        self.ds.rounded_rectangle([x - s * .7, y - s, x + s * .7, y + s], radius=max(1, s * .5), fill=self.mul((255, 160 + int(40 * flick), 60), k))
        self.ds.ellipse([x - s * .35, y - s * .1, x + s * .35, y + s * .7], fill=self.mul((255, 245, 200), k))

    def speedlines(self, cx, cy, n, r0, col, k, seed):
        rnd = random.Random(seed)
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            r = rnd.uniform(r0, r0 * 1.5)
            ln = rnd.uniform(60, 200)
            self.ds.line([(cx + math.cos(a) * r, cy + math.sin(a) * r), (cx + math.cos(a) * (r + ln), cy + math.sin(a) * (r + ln))],
                         fill=self.mul(col, k * rnd.uniform(.4, 1)), width=rnd.choice([1, 1, 2]))

    def apply(self, base):
        g1 = np.asarray(self.g.filter(ImageFilter.GaussianBlur(6))).astype(float)
        g2 = np.asarray(self.g.filter(ImageFilter.GaussianBlur(26))).astype(float)
        s = np.asarray(self.s.filter(ImageFilter.GaussianBlur(.7))).astype(float)
        add = s + g1 * .8 + g2 * 1.1
        return 255 - (255 - base) * (255 - np.clip(add, 0, 255)) / 255     # スクリーン合成（白に飽和しにくい）


class Sparks:
    """火花（速い・線）と燠（遅い・四角・昇る）"""
    def __init__(self):
        self.p = []

    def burst(self, x, y, n, sp, col, life, seed, kind='spark', up=0.0, spread=(0, 360), grav=.25):
        rnd = random.Random(seed)
        for _ in range(n):
            a = math.radians(rnd.uniform(*spread))
            v = rnd.uniform(.35, 1) * sp
            self.p.append(dict(x=x, y=y, vx=math.cos(a) * v, vy=math.sin(a) * v - up, t=0, life=life * rnd.uniform(.5, 1.2),
                               col=col, kind=kind, s=rnd.uniform(2, 4.5), g=grav))

    def step(self, L, frozen=False):
        keep = []
        for q in self.p:
            if not frozen:
                q['t'] += 1
                q['x'] += q['vx']
                q['y'] += q['vy']
                drag = .9 if q['kind'] == 'spark' else .96
                q['vx'] *= drag
                q['vy'] = q['vy'] * drag + (q['g'] if q['kind'] == 'spark' else -.05)
            k = 1 - q['t'] / q['life']
            if k <= 0:
                continue
            c = Light.mul(q['col'], k)
            if q['kind'] == 'spark':
                L.ds.line([(q['x'], q['y']), (q['x'] - q['vx'] * 2.5, q['y'] - q['vy'] * 2.5)], fill=c, width=2)
                L.dg.line([(q['x'], q['y']), (q['x'] - q['vx'] * 2.5, q['y'] - q['vy'] * 2.5)], fill=Light.mul(c, .6), width=5)
            else:
                s = q['s'] * (.5 + .5 * k)
                L.ds.rectangle([q['x'] - s / 2, q['y'] - s / 2, q['x'] + s / 2, q['y'] + s / 2], fill=c)
                L.dg.ellipse([q['x'] - s * 2, q['y'] - s * 2, q['x'] + s * 2, q['y'] + s * 2], fill=Light.mul(c, .5))
            keep.append(q)
        self.p = keep


# ---------------- 合成 ----------------
def paste(base, im, cx, foot, alpha=1.0, tint=None, white=0.0, dissolve=0.0, seed=0, add=None):
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
    if add is not None:   # 残像：色を足す
        base[Y0:Y1, X0:X1] = np.clip(base[Y0:Y1, X0:X1] + np.array(add) * m[sl], 0, 255)
    else:
        base[Y0:Y1, X0:X1] = base[Y0:Y1, X0:X1] * (1 - m[sl]) + rgb[sl] * m[sl]
    return base


def bubble(img, text, x, y):
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT_JA, 28)
    tw = d.textlength(text, font=f)
    d.rounded_rectangle([x - tw / 2 - 18, y - 24, x + tw / 2 + 18, y + 24], radius=20, fill=(250, 246, 236), outline=(60, 50, 40), width=3)
    d.polygon([(x + tw / 2 - 12, y + 22), (x + tw / 2 + 16, y + 44), (x + tw / 2 + 2, y + 22)], fill=(250, 246, 236))
    d.text((x - tw / 2, y - 17), text, font=f, fill=(40, 30, 20))


def number(img, n, x, y, t, label=None, col=(255, 255, 255)):
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT_NUM, 44)
    s = str(n)
    for i, ch in enumerate(s):
        k = t - (len(s) - 1 - i) * .035
        if k < 0:
            continue
        dy = -22 * max(0, 1 - k / .07) + (6 * math.sin(min(1, k / .15) * math.pi) if k < .15 else 0)
        d.text((x + i * 26, y + dy), ch, font=f, fill=col, stroke_width=4, stroke_fill=(30, 10, 10))
    if label and t > 0:
        fl = ImageFont.truetype(FONT_NUM, 30)
        sc = 1 + max(0, .4 - t * 3)
        d.text((x - 14, y - 40 * sc), label, font=fl, fill=(255, 214, 100), stroke_width=4, stroke_fill=(70, 30, 0))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def eout(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


# ---------------- 効果音 ----------------
class Mix:
    def __init__(self, dur):
        self.a = np.zeros(int(SR * (dur + 1)))
        self.rnd = np.random.RandomState(3)

    def add(self, t, sig):
        i = int(t * SR)
        n = min(len(sig), len(self.a) - i)
        if n > 0 and i >= 0:
            self.a[i:i + n] += sig[:n]

    def band(self, t, dur, f0, f1, v, q=.35):
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
        env = np.minimum(1, np.arange(n) / (SR * .03)) * np.minimum(1, (n - np.arange(n)) / (SR * .2))
        self.add(t, out / (np.abs(out).max() + 1e-9) * v * env)

    def ring(self, t, f, dur=.2, v=.25):
        tt = np.arange(int(SR * dur)) / SR
        s = sum(np.sin(2 * np.pi * f * m * tt) / (i + 1) for i, m in enumerate((1, 1.87, 2.71))) * np.exp(-tt / (dur / 4))
        self.add(t, s * v)

    def thump(self, t, v=.7, dur=.22, f0=150):
        tt = np.arange(int(SR * dur)) / SR
        f = f0 * (40 / f0) ** (tt / dur)
        self.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .07) * v)

    def boom(self, t, v=.8):
        self.thump(t, v, .5, 110)
        self.band(t, .9, 2500, 120, v * .7, .6)

    def chime(self, t, fs, gap=.09, v=.12):
        for i, f in enumerate(fs):
            self.ring(t + i * gap, f, .35, v)

    def save(self, path):
        a = np.tanh(self.a * 1.2)
        a = a / max(1e-9, np.abs(a).max()) * .9
        with wave.open(path, 'w') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((a * 32767).astype(np.int16).tobytes())


# ---------------- 1 コマの組み立て ----------------
class Scene:
    def __init__(self):
        self.sparks = Sparks()
        self.shake = 0.0
        self.trail = []          # 残像（姿勢・x・足元）

    def frame(self, t, dark, hero, enemy_kw, fx_back, fx_front, ui=None, flash=0.0, night=0.0, stop=False, ekb=0.0):
        base = BG * dark
        if night:
            sky = np.zeros_like(base)
            sky[..., 0], sky[..., 1], sky[..., 2] = 8, 12, 38
            base = base * (1 - night) + sky * night
        L0 = Light()
        fx_back(L0)
        base = L0.apply(base)
        base = paste(base, ENEMY, EN_X - ekb, GROUND + 12, **enemy_kw)
        pose, hx, foot, ghost = hero
        if ghost:
            for i, (p, x, f) in enumerate(self.trail[-ghost * 3::3][::-1]):
                base = paste(base, SPRB[p], x, f + 8, alpha=.55 - i * .15, add=(255, 200, 90))
        if not stop:
            self.trail.append((pose, hx, foot))
        base = paste(base, SPRB[pose], hx, foot + 8)
        L1 = Light()
        fx_front(L1)
        self.sparks.step(L1, frozen=stop)
        base = L1.apply(base)
        if flash:
            base = base * (1 - flash) + 255 * flash
        img = Image.fromarray(base.astype(np.uint8))
        if ui:
            ui(img)
        if self.shake > .5:
            s = self.shake
            self.shake *= .82
            img = Image.fromarray(np.roll(np.asarray(img), (int(math.sin(t * 97) * s), int(math.cos(t * 83) * s * .7)), (0, 1)))
        return img


def render(name, dur, fn, sfx):
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(OUT, '_f_' + name)
    os.makedirs(tmp, exist_ok=True)
    sc = Scene()
    n = int(dur * FPS)
    thumbs = []
    for i in range(n):
        t = i / FPS
        img = fn(t, sc)
        img.save(os.path.join(tmp, f'{i:04d}.png'))
        if i % 9 == 0:
            thumbs.append((t, img.resize((213, 240))))
    m = Mix(dur)
    sfx(m)
    wav = os.path.join(tmp, 'a.wav')
    m.save(wav)
    mp4 = os.path.join(OUT, f'skill_{name}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(tmp, '%04d.png'), '-i', wav,
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-c:a', 'aac', '-b:a', '160k', '-shortest', mp4], check=True)
    cols = 9
    sh = Image.new('RGB', (213 * cols, 256 * ((len(thumbs) + cols - 1) // cols)))
    d = ImageDraw.Draw(sh)
    for k, (t, im) in enumerate(thumbs):
        x, y = (k % cols) * 213, (k // cols) * 256
        sh.paste(im, (x, y + 16))
        d.text((x + 4, y + 2), f'{t:.2f}s', fill=(255, 255, 0))
    sh.save(os.path.join(OUT, f'skill_{name}_sheet.png'))
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    print(mp4)


def stopped(t, hits, n=5):
    """命中のあと n コマは止める（ヒットストップ）"""
    return any(h <= t < h + n / FPS for h in hits)


GOLD, ORNG, RED, WHITE, BLUE, CYAN = (255, 206, 90), (255, 132, 40), (255, 70, 40), (255, 255, 255), (80, 130, 255), (150, 220, 255)


# =============== 光刃（単体・踏み込みの斬り上げ） ===============
def koujin(t, S):
    HIT = 1.30
    dark = 1 - .55 * ease((t - .55) / .17) + .55 * ease((t - 2.1) / .45)
    st = stopped(t, [HIT], 6)
    pose, hx, foot, ghost = '構え1', HOME_X, GROUND, 0
    if .72 <= t < 1.12:
        pose = '溜め'                                     # 刃に灯を集める
    elif 1.12 <= t < 1.26:
        pose, ghost = '振り抜き', 3                       # 踏み込み（残像）
        hx = HOME_X - (HOME_X - 300) * eout((t - 1.12) / .14)
    elif 1.26 <= t < 1.30:
        pose, hx = '斬り', 300
    elif 1.30 <= t < 1.62:
        pose, hx = '振りかぶり', 300                       # 斬り上げの終わり
    elif 1.62 <= t < 1.92:                               # 後ろへ跳んで戻る
        k = (t - 1.62) / .3
        pose, hx, foot = '選択', 300 + (HOME_X - 300) * ease(k), GROUND - 70 * math.sin(math.pi * k)
    elif t >= 1.92:
        pose = '構え1' if t < 1.98 or t > 2.05 else '構え2'
    if abs(t - HIT) < .5 / FPS:
        S.shake = 16
        S.sparks.burst(ECX, ECY, 70, 22, GOLD, 26, 1)
        S.sparks.burst(ECX, ECY, 40, 9, ORNG, 70, 2, kind='ember', up=2.2)
    if abs(t - 1.62) < .5 / FPS:
        S.sparks.burst(300, GROUND + 4, 14, 5, (200, 180, 150), 24, 9, kind='ember', spread=(180, 360), up=1)
    if abs(t - 1.92) < .5 / FPS:
        S.sparks.burst(HOME_X, GROUND + 4, 14, 5, (200, 180, 150), 24, 10, kind='ember', spread=(180, 360), up=1)

    def back(L):
        if .72 <= t < 1.3:   # 足元の灯の陣
            k = ease((t - .72) / .3)
            L.ring(hx, GROUND + 6, 70 * k, 18 * k, 3, ORNG, .9)
            L.ring(hx, GROUND + 6, 46 * k, 12 * k, 2, GOLD, .7)
        if HIT <= t < HIT + .8:
            k = (t - HIT) / .8
            for j in range(3):
                L.ring(EN_X, GROUND + 10, 60 + 330 * eout(k) + j * 26, 16 + 70 * eout(k) + j * 6, 5 - j, (GOLD, ORNG, WHITE)[j], 1 - k)

    def front(L):
        if .72 <= t < 1.26:   # 刃先に灯が集まる（火の粉が吸い込まれる）
            k = ease((t - .72) / .4)
            tx, ty = hx + 70, foot - 112
            L.lantern(tx, ty, 4 + 9 * k, math.sin(t * 50), 1)
            rnd = random.Random(int(t * FPS) // 2)
            for _ in range(6):
                a = rnd.uniform(0, math.tau)
                r = 70 * (1 - (t * 4 % 1))
                L.ds.rectangle([tx + math.cos(a) * r - 2, ty + math.sin(a) * r - 2, tx + math.cos(a) * r + 2, ty + math.sin(a) * r + 2], fill=GOLD)
        if 1.12 <= t < 1.3:
            L.speedlines(hx, foot - 70, 24, 140, (255, 240, 200), .7, int(t * 60))
        if HIT - .02 <= t < HIT + .5:
            k = max(0, (t - HIT) / .5)
            L.crescent(ECX + 70, ECY + 40, 175, 150, 300, 40 * (1 - k * .6), GOLD, 1 - k)
            L.line([(ECX - 250, ECY + 210), (ECX + 260, ECY - 200)], WHITE, 3, max(0, 1 - k * 2.5))   # 斬撃の筋
            if k < .45:
                L.star(ECX, ECY, 260 * (1 - k), 9 * (1 - k * 2), WHITE, 1 - k * 2, rot=15)
                L.disc(ECX, ECY, 46 * (1 - k * 1.6), GOLD, 1 - k * 2)
                L.rays(ECX, ECY, 22, 40, 240 * eout(k * 3), GOLD, 1 - k * 2, 5, 5)

    ekw = {}
    if t < HIT:
        ekw = {}
    elif t < HIT + .1:
        ekw = dict(white=.9)
    elif t < 2.45:
        ekw = dict(tint=((255, 190, 90), .4 * max(0, 1 - (t - HIT) / 1.0)))
    else:
        ekw = dict(tint=((230, 40, 40), .75), dissolve=ease((t - 2.45) / .35), seed=3)
    kb = 34 * math.sin(min(1, max(0, t - HIT - .1) / .35) * math.pi) if t > HIT + .1 else 0

    def ui(img):
        if t < .55:
            bubble(img, '光刃！', HOME_X - 120, GROUND - 190)
        if t >= 1.98:
            number(img, 1284, EN_X - 50, GROUND - 260, t - 1.98, 'Critical')

    flash = .7 * max(0, 1 - (t - HIT) / .08) if t >= HIT else 0
    return S.frame(t, dark, (pose, hx, foot, ghost), ekw, back, front, ui, flash=flash, stop=st, ekb=kb)


def koujin_sfx(m):
    m.band(.72, .55, 400, 3200, .35)            # 灯を集める（上がる）
    for i in range(5):
        m.ring(.75 + i * .1, 3000 + i * 500, .12, .05)
    m.band(1.12, .2, 1500, 6000, .6)             # 踏み込み
    m.ring(1.27, 5200, .14, .25)
    m.ring(1.30, 9100, .25, .35)
    m.thump(1.30, .9)
    m.band(1.30, .5, 5000, 800, .35)
    m.ring(1.42, 5200, .18, .18)
    m.band(1.62, .3, 900, 2200, .15)
    m.thump(1.92, .25, .1, 220)
    m.chime(1.98, [7200, 9000, 10800], .07, .12)


# =============== 灯火連斬（3 連＋結界の大回転斬り） ===============
def torirensan(t, S):
    HITS = [1.05, 1.36, 1.58, 2.30]
    ANG = [(200, 340), (40, 175), (250, 390)]
    LAMPS = [(ECX - 120, ECY - 130), (ECX + 130, ECY - 110), (ECX + 10, ECY + 120)]
    dark = 1 - .6 * ease((t - .55) / .17) + .6 * ease((t - 3.05) / .45)
    st = stopped(t, HITS[:3], 3) or stopped(t, HITS[3:], 7)
    NEAR = 290
    pose, hx, foot, ghost = '構え1', HOME_X, GROUND, 0
    if .72 <= t < .95:
        pose, ghost = '選択', 3
        hx = HOME_X - (HOME_X - NEAR) * eout((t - .72) / .23)
    elif .95 <= t < 1.80:
        hx = NEAR
        i = max([j for j, h in enumerate(HITS[:3]) if t >= h - .08], default=-1)
        ph = t - (HITS[i] - .08) if i >= 0 else 0
        pose = '溜め' if i < 0 else ('斬り' if ph < .08 else ['振り抜き', '振りかぶり', '振り抜き'][i])
    elif 1.80 <= t < 2.10:
        pose, hx = '溜め', NEAR + 30 * ease((t - 1.8) / .3)            # 結界を結ぶ溜め
    elif 2.10 <= t < 2.30:                                            # 跳んで敵の上へ
        k = (t - 2.10) / .2
        pose, ghost = '振りかぶり', 3
        hx, foot = NEAR + 30 - 150 * eout(k), GROUND - 160 * math.sin(math.pi * k * .5)
    elif 2.30 <= t < 2.75:
        pose, hx, foot = '振り抜き', NEAR - 120, GROUND - 160 + 160 * eout((t - 2.3) / .12)
    elif 2.75 <= t < 3.10:
        k = (t - 2.75) / .35
        pose, hx, foot = '選択', NEAR - 120 + (HOME_X - NEAR + 120) * ease(k), GROUND - 90 * math.sin(math.pi * k)
    for i, h in enumerate(HITS):
        if abs(t - h) < .5 / FPS:
            S.shake = 8 if i < 3 else 24
            c = (ORNG, GOLD, RED, GOLD)[i]
            S.sparks.burst(ECX, ECY, 36 if i < 3 else 140, 18 if i < 3 else 30, c, 22, 10 + i)
            S.sparks.burst(ECX, ECY, 16 if i < 3 else 80, 8, ORNG, 60, 20 + i, kind='ember', up=2)

    def back(L):
        if t >= HITS[3]:
            k = (t - HITS[3]) / .9
            if k < 1:
                for j in range(4):
                    L.ring(EN_X, GROUND + 10, 50 + 380 * eout(k) + j * 30, 14 + 80 * eout(k) + j * 7, 6 - j, (GOLD, ORNG, RED, WHITE)[j], 1 - k)
        if 1.80 <= t < 2.4:   # 結界の三角（地面にも映る）
            k = ease((t - 1.8) / .3)
            L.ring(EN_X, GROUND + 10, 150 * k, 36 * k, 3, GOLD, .8)

    def front(L):
        for i, h in enumerate(HITS[:3]):     # 灯（1 撃ごとに 1 つ）
            if t >= h:
                lx, ly = LAMPS[i]
                k = eout((t - h) / .2)
                fade = 1 - ease((t - HITS[3]) / .1) if t >= HITS[3] else 1
                if fade > 0:
                    L.lantern(lx, ly + 6 * math.sin(t * 4 + i), 3 + 9 * k, math.sin(t * 40 + i), fade)
        if 1.80 <= t < HITS[3] + .05:        # 灯を結ぶ線
            k = ease((t - 1.8) / .3)
            pts = LAMPS + [LAMPS[0]]
            for a, b in zip(pts, pts[1:]):
                L.line([a, (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k)], GOLD, 4, 1)
            if t > 2.1:
                L.disc(ECX, ECY, 30 + 40 * (t - 2.1) / .2, GOLD, .5)
        if .72 <= t < .95 or 2.10 <= t < 2.30:
            L.speedlines(hx, foot - 70, 26, 140, (255, 240, 210), .7, int(t * 60))
        for i, h in enumerate(HITS[:3]):
            if h - .02 <= t < h + .32:
                k = max(0, (t - h) / .32)
                a0, a1 = ANG[i]
                L.crescent(ECX + 10, ECY, 140, a0, a0 + (a1 - a0) * min(1, k * 4 + .3), 30 * (1 - k), (ORNG, GOLD, RED)[i], 1 - k)
                if k < .4:
                    L.star(ECX, ECY, 150 * (1 - k * 2), 5, WHITE, 1 - k * 2.5, rot=i * 25)
        h = HITS[3]
        if h - .02 <= t < h + .7:            # とどめ：結界ごと縦に両断
            k = max(0, (t - h) / .7)
            L.beam(ECX, 0, GROUND + 20, 26 * (1 - k), GOLD, 1 - k)
            for (lx, ly) in LAMPS:          # 灯が光の柱になって弾ける
                L.beam(lx, ly - 220 * eout(k), ly + 30, 9 * (1 - k), ORNG, 1 - k)
            if k < .5:
                L.star(ECX, ECY, 380 * (1 - k), 12 * (1 - k * 2), WHITE, 1 - k * 2, rot=45)
                L.rays(ECX, ECY, 30, 60, 330 * eout(k * 3), GOLD, 1 - k * 2, 7, 6)
                L.disc(ECX, ECY, 70 * (1 - k * 1.8), WHITE, 1 - k * 2)

    last = max([h for h in HITS if t >= h], default=None)
    if last is None:
        ekw = {}
    elif t - last < .08:
        ekw = dict(white=.85)
    elif t < 3.25:
        ekw = dict(tint=((255, 120, 60), .3))
    else:
        ekw = dict(tint=((230, 40, 40), .75), dissolve=ease((t - 3.25) / .35), seed=4)
    kb = (14 * math.sin(min(1, (t - last - .05) / .2) * math.pi) if last and t - last > .05 and t - last < .25 else 0) + \
         (40 * math.sin(min(1, max(0, t - HITS[3] - .12) / .45) * math.pi) if t > HITS[3] + .12 else 0)

    def ui(img):
        if t < .55:
            bubble(img, '灯火連斬！', HOME_X - 140, GROUND - 190)
        for i, (h, n) in enumerate(zip(HITS, [412, 438, 471, 2380])):
            end = HITS[i + 1] if i < 3 else 9
            if h + .04 <= t < end:
                number(img, n, EN_X - 50, GROUND - 270, t - h - .04, 'Critical' if i == 3 else None)

    flash = (.8 * max(0, 1 - (t - HITS[3]) / .1) if t >= HITS[3] else 0) + sum(.3 * max(0, 1 - (t - h) / .05) for h in HITS[:3] if t >= h)
    return S.frame(t, dark, (pose, hx, foot, ghost), ekw, back, front, ui, flash=min(1, flash), stop=st, ekb=kb)


def torirensan_sfx(m):
    m.band(.72, .25, 900, 4000, .45)
    for i, h in enumerate([1.05, 1.36, 1.58]):
        m.band(h - .08, .12, 2500, 6500, .4)
        m.ring(h, 4300 + i * 1000, .18, .28)
        m.thump(h, .5)
        m.ring(h + .1, 2400 + i * 400, .4, .07)       # 灯がともる
    m.band(1.80, .35, 500, 4000, .45, .5)             # 結ぶ
    m.ring(1.95, 6000, .3, .1)
    m.band(2.10, .2, 1500, 7000, .55)                 # 跳ぶ
    for k in range(5):
        m.ring(2.30 + k * .05, [5200, 7600, 9800, 7600, 5200][k], .22, .25)
    m.boom(2.30, .9)
    m.chime(2.9, [6400, 8100, 9600], .08, .1)


# =============== 天灯星斬（奥義：星座の剣で天から斬り下ろす） ===============
def tentou(t, S):
    IMP = 3.10
    STARS = [(ECX, 70), (ECX, 140), (ECX - 60, 175), (ECX + 60, 175), (ECX, 215), (ECX, 285)]
    EDGES = [(0, 1), (1, 4), (2, 3), (4, 5)]
    dark = 1 - .6 * ease((t - .55) / .2) + .6 * ease((t - 4.35) / .5)
    night = ease((t - .95) / .4) * (1 - ease((t - 3.9) / .45))
    st = stopped(t, [IMP], 8)
    pose, hx, foot, ghost = '構え1', HOME_X, GROUND, 0
    if .72 <= t < 1.05:
        pose = '溜め'
    elif 1.05 <= t < 1.40:
        pose, ghost = '振りかぶり', 3
        foot = GROUND - 700 * eout((t - 1.05) / .35) ** 1.3
    elif 1.40 <= t < 2.85:
        pose, foot = '振りかぶり', -400
    elif 2.85 <= t < IMP:
        pose, ghost = '振りかぶり', 3
        hx = ECX + 40
        foot = -150 + (GROUND - 10 + 150) * ease((t - 2.85) / .25)
    elif IMP <= t < 3.75:
        pose, hx, foot = '振り抜き', ECX + 130, GROUND
    elif 3.75 <= t < 4.1:
        k = (t - 3.75) / .35
        pose, hx, foot = '選択', ECX + 130 + (HOME_X - ECX - 130) * ease(k), GROUND - 80 * math.sin(math.pi * k)
    elif t >= 4.1:
        pose = '勝利' if t < 4.7 else '構え1'
    if abs(t - IMP) < .5 / FPS:
        S.shake = 30
        S.sparks.burst(ECX, ECY, 160, 34, GOLD, 30, 21)
        S.sparks.burst(ECX, ECY, 90, 26, CYAN, 26, 22)
        S.sparks.burst(ECX, ECY, 70, 10, GOLD, 90, 23, kind='ember', up=2.5)
    if 3.3 <= t < 3.9 and int(t * FPS) % 3 == 0:    # 光の雨
        r = random.Random(int(t * 1000))
        S.sparks.burst(ECX + r.uniform(-220, 220), -10, 2, 6, GOLD, 60, int(t * 1000), kind='spark', spread=(80, 100), grav=.4)

    def back(L):
        rnd = random.Random(5)
        if night > 0:
            for k in range(90):
                x, y = rnd.uniform(0, W), rnd.uniform(0, 380)
                tw = .5 + .5 * math.sin(t * 7 + k)
                L.ds.rectangle([x - 1, y - 1, x + 1, y + 1], fill=Light.mul((200, 220, 255), night * tw))
                if k % 9 == 0:
                    L.star(x, y, 9, 1, (200, 220, 255), night * tw)
        if 1.1 <= t < IMP:   # 地面の星の陣
            k = ease((t - 1.1) / .5)
            for j in range(2):
                L.ring(EN_X, GROUND + 10, (110 + j * 40) * k, (28 + j * 10) * k, 2, BLUE if j else GOLD, .9 * night)
        if t >= IMP:
            k = (t - IMP) / 1.1
            if k < 1:
                for j in range(5):
                    L.ring(EN_X, GROUND + 10, 70 + 520 * eout(k) + j * 34, 18 + 120 * eout(k) + j * 8, 7 - j, (WHITE, GOLD, BLUE, GOLD, CYAN)[j], 1 - k)

    def front(L):
        for i in range(14):    # 天灯がたくさん昇る（6 つは星座の星になる）
            t0 = 1.15 + i * .07
            if t < t0:
                continue
            k = ease((t - t0) / .8)
            if i < 6:
                sx, sy = STARS[i]
                x0 = sx + (i - 3) * 30
            else:
                r = random.Random(i)
                sx, sy, x0 = r.uniform(40, 600), r.uniform(-60, 120), r.uniform(40, 600)
            y = (GROUND + 60) + (sy - GROUND - 60) * k
            x = x0 + (sx - x0) * k + math.sin(t * 2 + i) * 8 * (1 - k)
            if k < 1 or i >= 6:
                if t < IMP:
                    L.lantern(x, y, 10 if i < 6 else 7, math.sin(t * 20 + i), 1 if i < 6 else .7)
            elif t < IMP:
                L.star(sx, sy, 22 + 6 * math.sin(t * 14 + i), 2.5, GOLD, 1)
                L.disc(sx, sy, 5, WHITE, 1)
        if 2.2 <= t < IMP:     # 星座を結ぶ → 星の剣
            k = ease((t - 2.2) / .45)
            for a, b in EDGES:
                (ax, ay), (bx, by) = STARS[a], STARS[b]
                L.line([(ax, ay), (ax + (bx - ax) * k, ay + (by - ay) * k)], CYAN, 4, 1)
            if t > 2.65:
                g = ease((t - 2.65) / .2)
                L.beam(ECX, 60, 290, 6 + 10 * g, BLUE, g)                     # 星の剣の刃
                L.ds.rectangle([ECX - 60 * g, 172, ECX + 60 * g, 180], fill=GOLD)  # 鍔
        if 1.05 <= t < 1.4 or 2.85 <= t < IMP:
            L.speedlines(hx, foot - 70, 30, 120, (220, 235, 255), .8, int(t * 60))
        if 2.85 <= t < IMP:
            L.beam(ECX, 0, max(0, foot - 60), 10, CYAN, 1)
        if IMP - .02 <= t < IMP + 1.0:
            k = max(0, (t - IMP) / 1.0)
            if k < .4:
                L.disc(ECX, ECY, 150 * (1 - k * 2), WHITE, 1 - k * 2.5)
                L.star(ECX, ECY, 640 * (1 - k * 1.2), 16 * (1 - k * 2.4), WHITE, 1 - k * 2.5, rot=0)
                L.star(ECX, ECY, 380 * (1 - k * 1.2), 9, CYAN, 1 - k * 2.5, rot=45)
            L.rays(ECX, ECY, 40, 80, 520 * eout(k * 2.5), GOLD, 1 - k, 9, 7)
            L.beam(ECX, 0, GROUND + 20, 40 * (1 - k), GOLD, 1 - k)
        if 3.9 <= t < 4.9:    # 余韻：灯が 1 つだけ残って昇る
            k = (t - 3.9) / 1.0
            L.lantern(ECX + 70, ECY - 30 - 160 * k, 8 * (1 - k), math.sin(t * 20), 1 - k)

    if t < IMP:
        ekw = dict(tint=((40, 70, 170), .4 * night))
    elif t < IMP + .14:
        ekw = dict(white=.95)
    elif t < 4.0:
        ekw = dict(tint=((255, 220, 120), .5))
    else:
        ekw = dict(tint=((230, 40, 40), .75), dissolve=ease((t - 4.1) / .4), seed=5)
    kb = 50 * math.sin(min(1, max(0, t - IMP - .14) / .6) * math.pi) if t > IMP + .14 else 0

    def ui(img):
        if t < .6:
            bubble(img, '天灯星斬！', HOME_X - 150, GROUND - 190)
        if t >= 3.5:
            number(img, 98765, EN_X - 80, GROUND - 280, t - 3.5, 'Critical')

    flash = .95 * max(0, 1 - (t - IMP) / .14) if t >= IMP else 0
    return S.frame(t, dark, (pose, hx, foot, ghost), ekw, back, front, ui, flash=flash, night=.8 * night, stop=st, ekb=kb)


def tentou_sfx(m):
    m.band(.72, .4, 300, 2200, .4)
    m.band(1.05, .4, 1200, 8000, .6)                # 天へ跳ぶ
    for i in range(6):
        m.ring(1.95 + i * .07, [3500, 4200, 4700, 5300, 6300, 7000][i], .5, .08)
    m.band(2.2, .5, 3000, 9000, .25)                # 星座を結ぶ
    m.ring(2.68, 2600, .6, .15)
    m.band(2.85, .27, 7000, 900, .8)                # 天から落ちる
    m.boom(3.10, 1.0)
    for k in range(3):
        m.ring(3.10 + k * .09, [6800, 10200, 6800][k], .4, .32)
    m.band(3.2, 1.2, 4500, 500, .35)                # 光の雨
    m.chime(3.5, [5400, 6800, 8100, 10800], .1, .14)


SK = {'光刃': (2.9, koujin, koujin_sfx), '灯火連斬': (3.8, torirensan, torirensan_sfx), '天灯星斬': (5.2, tentou, tentou_sfx)}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SK):
        d, f, s = SK[k]
        render(k, d, f, s)
