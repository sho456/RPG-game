"""リオの技の演出の試作（rs-battle-fx の時間割と「応用と進化」の決まりで 1 から設計）
実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs3/skills.py [技…]
出力：out/skill_<技>.mp4（音つき・960×540・30fps）と out/skill_<技>_sheet.png（コマの一覧）
・キャラ＝sprite.py のドット絵（4 倍・整数倍）。背景・エフェクトは高解像度の光（加算合成）、効果音は numpy で合成
・3 つの技の個性（参考の録画とは別の設計。rs-battle-fx 7 章で変えた軸を各関数の先頭に書く）
  光刃（陽・単体・B）：灯を刃に宿して踏み込み、下から斬り上げる。星形の閃光と昇る火の粉
  灯火連斬（陽・3 連・A）：だんだん速くなる 3 連撃。1 撃ごとに敵の周りに灯がともり、最後に灯を結んだ三角の結界ごと斬る
  天灯星斬（陽・SSS）：夜空に変わり、昇る天灯が星になって剣の形の星座を結ぶ。星座の線に沿って天から斬り下ろす"""
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
import sprite as SP  # noqa: E402

OUT = os.path.join(ROOT, 'out')
W, H, FPS, PX = 720, 540, 30, 4          # PX＝ドット 1 つの大きさ（整数倍）
GROUND = 380                              # 足元の y
HERO_X, ENEMY_X = 560, 190                # 体の中心 x
FONT_JA = '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'
FONT_NUM = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SR = 44100

# ---------------- 素材 ----------------
POSES = SP.build()


def tip(pose, hx=None, foot=None):
    """剣の先の画面の位置：ドット絵の刃の明るい色（#dfe6ff・#ffffff）のうち、体の中心からいちばん遠い点"""
    a = np.asarray(POSES[pose])
    ys, xs = np.where((a[..., 0] >= 220) & (a[..., 2] >= 240) & (a[..., 3] > 0))
    if not len(xs):
        return None
    cx, cy = 24, 32
    i = int(np.argmax((xs - cx) ** 2 + (ys - cy) ** 2))
    hx = HERO_X if hx is None else hx
    foot = GROUND if foot is None else foot
    return hx + (xs[i] - 24) * PX, foot + 2 * PX - (48 - ys[i]) * PX


def big(im, k=PX):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def make_bg():
    """描き込んだ背景の代わり：奥へすぼまる石の床・アーチの壁・左上からの光の帯。キャラより暗く彩度を低く"""
    im = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(im)
    for y in range(H):
        if y < 250:   # 壁
            v = 34 + y * .06
            d.line([(0, y), (W, y)], fill=(int(v * .9), int(v * .95), int(v * 1.1)))
        else:         # 床
            v = 52 + (y - 250) * .18
            d.line([(0, y), (W, y)], fill=(int(v * .95), int(v * .9), int(v * .82)))
    for i in range(6):   # アーチ
        x = 60 + i * 170
        d.rectangle([x, 70, x + 110, 250], fill=(26, 28, 36))
        d.ellipse([x, 20, x + 110, 130], fill=(26, 28, 36))
        d.rectangle([x + 112, 40, x + 128, 250], fill=(52, 54, 62))
    d.rectangle([0, 238, W, 252], fill=(60, 58, 60))
    for k in range(-14, 15):   # 床の目地（遠近）
        d.line([(W / 2 + k * 18, 252), (W / 2 + k * 120, H)], fill=(44, 42, 40), width=1)
    for j in range(8):
        y = 252 + (j ** 1.6) * 6
        d.line([(0, y), (W, y)], fill=(44, 42, 40))
    light = Image.new('L', (W, H), 0)
    ImageDraw.Draw(light).polygon([(120, 0), (320, 0), (620, H), (300, H)], fill=60)
    light = light.filter(ImageFilter.GaussianBlur(40))
    a = np.asarray(im).astype(float) + np.asarray(light)[..., None] * np.array([1.0, .85, .6])
    return np.clip(a, 0, 255)


def make_enemy():
    """試し用の敵（虚の甲殻獣）：楕円の体・角・赤い目を 4 段の陰で。外周は純黒"""
    w, h = 40, 34
    cv = {}
    pal = ['#2e2440', '#4a3a66', '#6e5a92', '#9a86c0']
    for y in range(h):
        for x in range(w):
            body = ((x - 20) / 17) ** 2 + ((y - 21) / 12) ** 2 < 1
            horn = (8 <= y <= 14 and abs(x - (12 + (14 - y) * .6)) < 1.5) or (6 <= y <= 14 and abs(x - (27 - (14 - y) * .5)) < 1.5)
            leg = y >= 30 and (abs(x - 9) < 2.5 or abs(x - 31) < 2.5 or abs(x - 18) < 2)
            if body or horn or leg:
                shade = (y - 9) / 25 + (x - 6) / 70
                k = 3 - min(3, max(0, int(shade * 4)))
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
                px[x + dx + 1, y + dy + 1] = (0, 0, 0, 255)
    return im.transpose(Image.FLIP_LEFT_RIGHT)


BG = make_bg()
ENEMY = big(make_enemy(), 5)
EMASK = np.asarray(ENEMY)[..., 3] > 0


# ---------------- エフェクト（加算の光） ----------------
class FX:
    def __init__(self):
        self.sharp = Image.new('RGB', (W, H))
        self.d = ImageDraw.Draw(self.sharp)
        self.glow = Image.new('RGB', (W, H))
        self.g = ImageDraw.Draw(self.glow)

    def disc(self, x, y, r, col, core=None):
        self.g.ellipse([x - r * 1.8, y - r * 1.8, x + r * 1.8, y + r * 1.8], fill=col)
        self.d.ellipse([x - r, y - r, x + r, y + r], fill=core or col)

    def star(self, x, y, ln, wd, col, rot=0, n=4):
        """十字の星の閃光（この作品の星のモチーフ）"""
        for k in range(n):
            a = math.radians(rot + k * 360 / n)
            for s, w2 in ((1, wd), (.55, wd * 2.2)):
                ex, ey = x + math.cos(a) * ln * s, y + math.sin(a) * ln * s
                px_, py_ = -math.sin(a) * w2, math.cos(a) * w2
                self.d.polygon([(x + px_, y + py_), (ex, ey), (x - px_, y - py_)], fill=col)
        self.g.ellipse([x - ln * .6, y - ln * .6, x + ln * .6, y + ln * .6], fill=tuple(int(c * .5) for c in col))

    def rays(self, x, y, n, r0, r1, col, seed, wd=3):
        rnd = random.Random(seed)
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            l1 = r1 * rnd.uniform(.6, 1.1)
            px_, py_ = -math.sin(a) * wd, math.cos(a) * wd
            sx, sy = x + math.cos(a) * r0, y + math.sin(a) * r0
            self.d.polygon([(sx + px_, sy + py_), (x + math.cos(a) * l1, y + math.sin(a) * l1), (sx - px_, sy - py_)], fill=col)

    def ring(self, x, y, rx, ry, wd, col):
        for i in range(int(wd)):
            self.d.ellipse([x - rx + i, y - ry + i * ry / rx, x + rx - i, y + ry - i * ry / rx], outline=col)
        self.g.ellipse([x - rx, y - ry, x + rx, y + ry], outline=col, width=int(wd * 3))

    def crescent(self, cx, cy, r, a0, a1, wd, col, edge=(255, 255, 255)):
        """三日月の斬撃（真ん中が太く、両端が細い）。a は度（0＝右、時計回り）"""
        n = 40
        outer, inner = [], []
        for k in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * k / n)
            t = math.sin(math.pi * k / n) * wd
            outer.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
            inner.append((cx + math.cos(a) * (r - t), cy + math.sin(a) * (r - t)))
        poly = outer + inner[::-1]
        self.g.polygon(poly, fill=col)
        self.d.polygon(poly, fill=col)
        self.d.line(outer, fill=edge, width=2)

    def line(self, pts, col, wd=2):
        self.d.line(pts, fill=col, width=wd)
        self.g.line(pts, fill=col, width=wd * 4)

    def lantern(self, x, y, s, flick):
        """灯（ともしび）：紙の灯籠の形の光。下が明るい"""
        self.g.ellipse([x - s * 2, y - s * 2, x + s * 2, y + s * 2], fill=(140, 70, 10))
        self.d.rounded_rectangle([x - s * .7, y - s, x + s * .7, y + s], radius=s * .5, fill=(255, 160 + int(40 * flick), 60))
        self.d.ellipse([x - s * .35, y - s * .1, x + s * .35, y + s * .7], fill=(255, 245, 200))

    def apply(self, base, blur=10, gain=1.0):
        g = np.asarray(self.glow.filter(ImageFilter.GaussianBlur(blur))).astype(float)
        s = np.asarray(self.sharp.filter(ImageFilter.GaussianBlur(.6))).astype(float)
        return np.clip(base + (g * .9 + s) * gain, 0, 255)


class Parts:
    """漂う粒（火の粉・星の粒）。決まった乱数で毎回同じ動き"""
    def __init__(self):
        self.p = []

    def burst(self, x, y, n, sp, col, life, seed, up=0.0, size=(2, 4)):
        rnd = random.Random(seed)
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            v = rnd.uniform(.3, 1) * sp
            self.p.append(dict(x=x, y=y, vx=math.cos(a) * v, vy=math.sin(a) * v - up, t=0, life=life * rnd.uniform(.6, 1.2), col=col,
                               s=rnd.uniform(*size)))

    def step(self, fx):
        keep = []
        for q in self.p:
            q['t'] += 1
            q['x'] += q['vx']
            q['y'] += q['vy']
            q['vx'] *= .93
            q['vy'] = q['vy'] * .93 - .12
            k = 1 - q['t'] / q['life']
            if k > 0:
                c = tuple(int(v * k) for v in q['col'])
                s = q['s'] * (.5 + k * .5)
                fx.d.rectangle([q['x'] - s / 2, q['y'] - s / 2, q['x'] + s / 2, q['y'] + s / 2], fill=c)   # 四角の粒（ドット絵に合う）
                fx.g.ellipse([q['x'] - s * 2, q['y'] - s * 2, q['x'] + s * 2, q['y'] + s * 2], fill=tuple(v // 2 for v in c))
                keep.append(q)
        self.p = keep


# ---------------- 合成 ----------------
def paste(base, im, cx, foot, alpha=1.0, tint=None, white=0.0, dissolve=0.0, seed=0):
    """スプライトを置く。tint＝色を寄せる (rgb, 強さ)、white＝白く飛ばす、dissolve＝市松のモザイクで消える"""
    a = np.asarray(im).astype(float)
    h, w = a.shape[:2]
    x0, y0 = int(cx - w / 2), int(foot - h)
    m = a[..., 3:4] / 255 * alpha
    rgb = a[..., :3]
    if tint:
        rgb = rgb * (1 - tint[1]) + np.array(tint[0]) * tint[1] * (rgb.mean(2, keepdims=True) / 160 + .4)
    if white:
        rgb = rgb * (1 - white) + 255 * white
    if dissolve:
        cell = 8
        yy, xx = np.mgrid[0:h, 0:w]
        rnd = np.random.RandomState(seed).rand((h // cell) + 1, (w // cell) + 1)
        gone = rnd[yy // cell, xx // cell] < dissolve
        checker = ((yy // 4 + xx // 4) % 2 == 0) & (rnd[yy // cell, xx // cell] < dissolve + .25)
        m = m * (~(gone | checker))[..., None]
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if X1 <= X0 or Y1 <= Y0:
        return base
    sub = (slice(Y0 - y0, Y1 - y0), slice(X0 - x0, X1 - x0))
    base[Y0:Y1, X0:X1] = base[Y0:Y1, X0:X1] * (1 - m[sub]) + rgb[sub] * m[sub]
    return base


def hero(base, pose, x=HERO_X, foot=GROUND, **k):
    return paste(base, big(POSES[pose]), x, foot + 2 * PX, **k)   # 48 のマスの足元 y=45 → 下に 2 ドット余り


def enemy(base, foot=GROUND + 10, **k):
    return paste(base, ENEMY, ENEMY_X, foot, **k)


def bubble(img, text, x, y):
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT_JA, 26)
    tw = d.textlength(text, font=f)
    d.rounded_rectangle([x - tw / 2 - 16, y - 22, x + tw / 2 + 16, y + 22], radius=18, fill=(250, 246, 236), outline=(60, 50, 40), width=3)
    d.polygon([(x + tw / 2 - 10, y + 20), (x + tw / 2 + 14, y + 40), (x + tw / 2 + 4, y + 20)], fill=(250, 246, 236))
    d.text((x - tw / 2, y - 16), text, font=f, fill=(40, 30, 20))


def number(img, n, x, y, t, col=(255, 255, 255), label=None):
    """数字：1 桁ずつ右から落ちる（0.04 秒ずつ）。label＝Critical などの金属の見出しの代わり"""
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT_NUM, 40)
    s = str(n)
    for i, ch in enumerate(s):
        k = t - (len(s) - 1 - i) * .04
        if k < 0:
            continue
        dy = max(0, 1 - k / .08) * -18
        d.text((x + i * 24, y + dy), ch, font=f, fill=col, stroke_width=3, stroke_fill=(20, 10, 10))
    if label and t > 0:
        fl = ImageFont.truetype(FONT_NUM, 26)
        d.text((x - 10, y - 32), label, font=fl, fill=(255, 220, 120), stroke_width=3, stroke_fill=(60, 30, 0))


def ease(t):
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


# ---------------- 効果音（rs-battle-fx の sfx-recipes を numpy で） ----------------
class Mix:
    def __init__(self, dur):
        self.a = np.zeros(int(SR * dur) + SR)
        self.rnd = np.random.RandomState(7)

    def add(self, t, sig):
        i = int(t * SR)
        n = min(len(sig), len(self.a) - i)
        if n > 0:
            self.a[i:i + n] += sig[:n]

    def noise_band(self, t, dur, f0, f1, v):
        """帯域を動かすノイズ（風・炎）：短い区間ごとに帯域を切り出してつなぐ"""
        n = int(SR * dur)
        x = self.rnd.randn(n)
        out = np.zeros(n)
        seg = 1024
        for i in range(0, n, seg // 2):
            c = f0 * (f1 / f0) ** (i / n)
            s = x[i:i + seg]
            F = np.fft.rfft(s * np.hanning(len(s)))
            fr = np.fft.rfftfreq(len(s), 1 / SR)
            F *= np.exp(-((np.log(fr + 1) - np.log(c)) ** 2) / .35)
            out[i:i + len(s)] += np.fft.irfft(F, len(s))
        env = np.minimum(1, np.arange(n) / (SR * .06)) * np.minimum(1, (n - np.arange(n)) / (SR * .25))
        self.add(t, out / (np.abs(out).max() + 1e-9) * v * env)

    def ring(self, t, f, dur=.18, v=.25):
        tt = np.arange(int(SR * dur)) / SR
        s = sum(np.sin(2 * np.pi * f * m * tt) / (i + 1) for i, m in enumerate((1, 1.87, 2.71))) * np.exp(-tt / (dur / 4))
        self.add(t, s * v)

    def thump(self, t, v=.6, dur=.16):
        tt = np.arange(int(SR * dur)) / SR
        f = 140 * (45 / 140) ** (tt / dur)
        self.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .05) * v)

    def chime(self, t, fs, gap=.1, v=.12):
        for i, f in enumerate(fs):
            self.ring(t + i * gap, f, .3, v)

    def save(self, path):
        a = self.a / max(1, np.abs(self.a).max() / .9)
        with wave.open(path, 'w') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((a * 32767).astype(np.int16).tobytes())


# ---------------- 枠（1 本の技の動画を作る） ----------------
def render(name, dur, frame_fn, sfx_fn):
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(OUT, '_frames_' + name)
    os.makedirs(tmp, exist_ok=True)
    state = {'parts': Parts(), 'shake': 0}
    n = int(dur * FPS)
    thumbs = []
    for i in range(n):
        t = i / FPS
        img = frame_fn(t, state)
        img.save(os.path.join(tmp, f'{i:04d}.png'))
        if i % 6 == 0:
            thumbs.append((t, img.resize((320, 180))))
    mx = Mix(dur)
    sfx_fn(mx)
    wav = os.path.join(tmp, 'a.wav')
    mx.save(wav)
    mp4 = os.path.join(OUT, f'skill_{name}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(tmp, '%04d.png'), '-i', wav,
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-c:a', 'aac', '-shortest', mp4], check=True)
    cols = 6
    sh = Image.new('RGB', (320 * cols, (180 + 16) * ((len(thumbs) + cols - 1) // cols)))
    dd = ImageDraw.Draw(sh)
    for k, (t, im) in enumerate(thumbs):
        x, y = (k % cols) * 320, (k // cols) * 196
        sh.paste(im, (x, y + 16))
        dd.text((x + 4, y + 2), f'{t:.2f}s', fill=(255, 255, 0))
    sh.save(os.path.join(OUT, f'skill_{name}_sheet.png'))
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    print(mp4)


def compose(t, st, dark, hero_fn, enemy_fn, fx_fn, ui_fn=None, bgcol=None):
    """背景（暗転は背景だけ）→ 地面の光 → 敵 → 味方 → 光 → 表示 → 揺れ"""
    base = BG * dark
    if bgcol is not None:
        base = base * (1 - bgcol[1]) + np.array(bgcol[0]) * bgcol[1]
    under = FX()
    over = FX()
    fx_fn(t, st, under, over)
    base = under.apply(base, 8)
    base = enemy_fn(base)
    for k, h in enumerate(st.get('party', [])):   # ほかの味方（暗くしない。並びの雰囲気）
        base = paste(base, big(POSES['構え2'], 3), 670, 250 + k * 70)
    base = hero_fn(base)
    st['parts'].step(over)
    base = over.apply(base, 12)
    img = Image.fromarray(base.astype(np.uint8))
    if ui_fn:
        ui_fn(img)
    if st['shake'] > 0:
        s = st['shake']
        st['shake'] -= 1
        img = Image.fromarray(np.roll(np.asarray(img), (int(math.sin(t * 90) * s), int(math.cos(t * 70) * s)), (0, 1)))
    return img


# =============== 1. 光刃 ===============
def koujin(t, st):
    """変えた軸（参考 A＝その場で振る・地をはう斬撃・等間隔 → 光刃）：
       道筋＝踏み込んで下から斬り上げる／本体＝刃先にともる灯が、斬り上げで星形の閃光に変わる／終わり方＝火の粉が昇る"""
    GOLD, ORNG, WHITE = (255, 208, 96), (255, 138, 58), (255, 255, 255)
    dark = 1 - .45 * ease((t - .5) / .18) + .45 * ease((t - 1.5) / .45)
    hx, pose = HERO_X, '構え1'
    if .68 <= t < .95:
        pose = '溜め'
    elif .95 <= t < 1.08:       # 踏み込み（走りの代わりに体ごと滑る）
        pose = '振り抜き'
        hx = HERO_X - (HERO_X - 330) * ease((t - .95) / .13)
    elif 1.08 <= t < 1.14:
        hx, pose = 330, '斬り'
    elif 1.14 <= t < 1.38:
        hx, pose = 330, '振りかぶり'      # 斬り上げの終わり＝剣が上
    elif 1.38 <= t < 1.55:
        pose = '構え1'
        hx = 330 + (HERO_X - 330) * ease((t - 1.38) / .17)
    hit = 1.10
    if abs(t - hit) < .5 / FPS:
        st['shake'] = 6
        st['parts'].burst(ENEMY_X + 10, GROUND - 90, 40, 9, ORNG, 34, 1, up=2.5)
        st['parts'].burst(ENEMY_X + 10, GROUND - 90, 16, 5, GOLD, 40, 2, up=1.5, size=(3, 5))

    def fx(t, st, U, O):
        if .68 <= t < 1.1:   # 刃先の灯（だんだん大きく）
            k = ease((t - .68) / .27)
            p = tip(pose, hx)
            if p:
                O.lantern(p[0], p[1], 4 + 6 * k, math.sin(t * 40))
        if hit <= t < hit + .5:
            k = (t - hit) / .5
            O.crescent(ENEMY_X + 30, GROUND - 60, 120, 140, 290, 22 * (1 - k * .7), tuple(int(c * (1 - k)) for c in GOLD))
            if k < .5:
                O.star(ENEMY_X + 10, GROUND - 92, 150 * (1 - k), 6 * (1 - k * 2), tuple(int(c * (1 - k * 2)) for c in WHITE), rot=45 * k)
                O.disc(ENEMY_X + 10, GROUND - 92, 22 * (1 - k * 2), tuple(int(c * .6 * (1 - k * 2)) for c in GOLD), WHITE if k < .2 else GOLD)
            U.ring(ENEMY_X, GROUND + 8, 90 + 140 * k, 22 + 30 * k, 3, tuple(int(c * (1 - k)) for c in ORNG))

    def en(base):
        if t < hit:
            return enemy(base)
        if t < hit + .07:
            return enemy(base, white=.85)
        if t < 1.95:
            return enemy(base, tint=((255, 190, 90), .35 * max(0, 1 - (t - hit) / .8)))
        return enemy(base, tint=((230, 40, 40), .7), dissolve=ease((t - 1.95) / .35), seed=3)

    def ui(img):
        if t < .5:
            bubble(img, '光刃！', HERO_X - 130, GROUND - 170)
        if t >= 1.55:
            number(img, 1284, ENEMY_X - 40, GROUND - 190, t - 1.55, label='Critical')

    return compose(t, st, dark, lambda b: hero(b, pose, hx), en, fx, ui)


def koujin_sfx(m):
    m.noise_band(.62, .5, 500, 2600, .35)       # 灯がともる（上がる風）
    m.noise_band(.95, .18, 1500, 4500, .5)      # 踏み込みの風切り
    m.ring(1.06, 5200, .14, .2)
    m.ring(1.10, 9100, .2, .3)
    m.thump(1.10)
    m.ring(1.22, 5200, .14, .15)
    m.noise_band(1.12, .9, 3000, 900, .18)      # 火の粉
    m.chime(1.55, [7200, 9000, 10800], .08, .1)  # 星の合図は上がる向き（参考は下がる）


# =============== 2. 灯火連斬 ===============
def torirensan(t, st):
    """変えた軸（参考 A＝等間隔・その場・毎回同じ形）：
       リズム＝だんだん速く（0.34 → 0.24 → 溜め 0.2 → 最後）／道筋＝敵の目の前で角度を変えて斬る／
       本体＝1 撃ごとに敵の周りに灯がともり、最後に 3 つの灯を線で結んだ三角の結界ごと斬る"""
    RED, GOLD, WHITE = (255, 96, 48), (255, 200, 90), (255, 255, 255)
    dark = 1 - .5 * ease((t - .5) / .18) + .5 * ease((t - 2.55) / .45)
    hits = [1.00, 1.34, 1.58, 2.02]
    angles = [(200, 330), (40, 170), (250, 380), (180, 360)]
    lamps = [(ENEMY_X - 90, GROUND - 170), (ENEMY_X + 110, GROUND - 150), (ENEMY_X + 10, GROUND + 10)]
    hx, pose = HERO_X, '構え1'
    if .7 <= t < .9:
        hx, pose = HERO_X - (HERO_X - 330) * ease((t - .7) / .2), '選択'   # 跳び出して間合いへ
    elif .9 <= t < 2.3:
        hx = 330
        i = sum(1 for h in hits if t >= h - .06) - 1
        ph = t - (hits[i] - .06) if i >= 0 else 0
        pose = ['構え1', '振りかぶり', '溜め', '斬り', '振り抜き'][0] if i < 0 else ('斬り' if ph < .06 else '振り抜き' if i % 2 == 0 else '振りかぶり')
        if 1.70 <= t < 1.96:
            pose = '溜め'
        if t >= 2.02:
            pose = '振り抜き'
    elif t >= 2.3:
        pose = '構え1'
        hx = 330 + (HERO_X - 330) * ease((t - 2.3) / .2)
    for i, h in enumerate(hits):
        if abs(t - h) < .5 / FPS:
            st['shake'] = 4 if i < 3 else 9
            st['parts'].burst(ENEMY_X, GROUND - 90, 18 if i < 3 else 60, 8 if i < 3 else 12, RED, 26, 10 + i, up=1.5)

    def fx(t, st, U, O):
        for i, h in enumerate(hits[:3]):     # 灯がともる（1 撃ごとに 1 つ）
            if t >= h:
                lx, ly = lamps[i]
                k = ease((t - h) / .2)
                fade = 1 - ease((t - 2.1) / .4)
                if fade > 0:
                    O.lantern(lx, ly - 10 * math.sin(t * 3 + i), 3 + 7 * k * fade, math.sin(t * 30 + i))
        if 1.70 <= t < 2.05:                 # 3 つの灯を結ぶ線（結界）
            k = ease((t - 1.70) / .25)
            pts = lamps + [lamps[0]]
            for a, b in zip(pts, pts[1:]):
                O.line([a, (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k)], GOLD, 3)
        for i, h in enumerate(hits):
            if h <= t < h + .35:
                k = (t - h) / .35
                a0, a1 = angles[i]
                big_ = i == 3
                O.crescent(ENEMY_X + 10, GROUND - 90, 110 if not big_ else 170, a0, a0 + (a1 - a0) * min(1, k * 3),
                           (16 if not big_ else 30) * (1 - k), tuple(int(c * (1 - k)) for c in (RED if i % 2 == 0 else GOLD)))
                if k < .4:
                    O.star(ENEMY_X + 10, GROUND - 90, (90 if not big_ else 220) * (1 - k * 2), 4, tuple(int(c * (1 - k * 2.5)) for c in WHITE), rot=i * 22)
                if big_:
                    for j in range(3):
                        U.ring(ENEMY_X, GROUND + 8, 60 + 260 * k + j * 30, 18 + 60 * k + j * 8, 2, tuple(int(c * (1 - k)) for c in GOLD))

    def en(base):
        last = max([h for h in hits if t >= h], default=None)
        if last is None:
            return enemy(base)
        if t - last < .07:
            return enemy(base, white=.8)
        if t < 2.85:
            return enemy(base, tint=((255, 120, 60), .25))
        return enemy(base, tint=((230, 40, 40), .7), dissolve=ease((t - 2.85) / .35), seed=4)

    def ui(img):
        if t < .5:
            bubble(img, '灯火連斬！', HERO_X - 140, GROUND - 170)
        for i, (h, n) in enumerate(zip(hits, [412, 438, 471, 1530])):
            if h + .05 <= t < (hits[i + 1] + .05 if i < 3 else 3.3):
                number(img, n, ENEMY_X - 40, GROUND - 200, t - h - .05, label='Critical' if i == 3 else None)

    return compose(t, st, dark, lambda b: hero(b, pose, hx), en, fx, ui)


def torirensan_sfx(m):
    m.noise_band(.7, .25, 800, 3000, .4)
    hits = [1.00, 1.34, 1.58, 2.02]
    for i, h in enumerate(hits[:3]):
        m.noise_band(h - .08, .12, 2000, 5000, .35)
        m.ring(h, 4300 + i * 900, .16, .22)     # 1 撃ごとに音程が上がる（だんだん速く・高く）
        m.thump(h, .4)
        m.ring(h + .25, 2600 + i * 300, .3, .08)  # 灯がともる柔らかい音
    m.noise_band(1.70, .32, 600, 3500, .4)      # 結界を結ぶ溜め
    for k in range(5):                           # 最後は 5 連の金属音を詰めて
        m.ring(2.02 + k * .06, [5200, 7600, 9800, 7600, 5200][k], .2, .22)
    m.thump(2.02, .9, .3)
    m.noise_band(2.05, .9, 3500, 600, .3)


# =============== 3. 天灯星斬 ===============
def tentou(t, st):
    """変えた軸（参考 B＝渦 → 黒 → 白い球 → 水柱と召喚）：
       色＝金＋夜の藍（補色）／本体＝昇る天灯が星になり、剣の形の星座を結ぶ／道筋＝星座の線に沿って天から斬り下ろす／
       終わり方＝星座が崩れて光の雨になり、灯が 1 つだけ残って消える（余韻）"""
    GOLD, BLUE, WHITE = (255, 214, 110), (90, 150, 255), (255, 255, 255)
    dark = 1 - .55 * ease((t - .5) / .2) + .55 * ease((t - 4.0) / .5)
    night = ease((t - .9) / .4) * (1 - ease((t - 3.6) / .4))
    STARS = [(ENEMY_X + 10, 60), (ENEMY_X + 10, 120), (ENEMY_X - 40, 150), (ENEMY_X + 60, 150), (ENEMY_X + 10, 190), (ENEMY_X + 10, 240)]
    EDGES = [(0, 1), (1, 4), (2, 3), (4, 5)]
    hx, foot, pose = HERO_X, GROUND, '構え1'
    if .7 <= t < 1.0:
        pose = '溜め'
    elif 1.0 <= t < 1.35:
        pose = '跳躍'
        foot = GROUND - 520 * ease((t - 1.0) / .35)
    elif 1.35 <= t < 2.55:
        pose, foot = '跳躍', -200       # 画面の外（天）
    elif 2.55 <= t < 2.75:
        pose = '降下斬り'
        hx = ENEMY_X + 40
        foot = -40 + (GROUND - 10 + 40) * ease((t - 2.55) / .2)
    elif 2.75 <= t < 3.4:
        hx, pose, foot = ENEMY_X + 150, '振り抜き', GROUND
    elif 3.4 <= t < 3.7:
        pose = '構え1'
        hx = ENEMY_X + 150 + (HERO_X - ENEMY_X - 150) * ease((t - 3.4) / .3)
    elif t >= 3.7:
        pose = '勝利' if t < 4.3 else '構え1'
    impact = 2.75
    if abs(t - impact) < .5 / FPS:
        st['shake'] = 12
        st['parts'].burst(ENEMY_X + 10, GROUND - 90, 90, 14, GOLD, 40, 21, up=1)
        st['parts'].burst(ENEMY_X + 10, GROUND - 90, 50, 10, BLUE, 46, 22, up=2, size=(3, 6))
    if 3.0 <= t < 3.6 and int(t * FPS) % 2 == 0:   # 光の雨（星座が崩れる）
        st['parts'].burst(ENEMY_X + random.Random(int(t * 100)).uniform(-160, 160), 40, 2, 2, GOLD, 50, int(t * 100), up=-6)

    def fx(t, st, U, O):
        rnd = random.Random(5)
        if night > 0:   # 夜空の星（小さな十字）
            for k in range(60):
                x, y = rnd.uniform(0, W), rnd.uniform(0, 250)
                tw = .5 + .5 * math.sin(t * 6 + k)
                c = tuple(int(v * night * tw) for v in (200, 220, 255))
                O.d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=c)
                if k % 7 == 0:
                    O.star(x, y, 6, 1, c)
        for i, (sx, sy) in enumerate(STARS):   # 天灯が昇って星になる
            t0 = 1.1 + i * .12
            if t < t0:
                continue
            k = ease((t - t0) / .6)
            y = (GROUND + 40) + (sy - GROUND - 40) * k
            x = sx + math.sin(t * 2 + i) * 6 * (1 - k)
            if k < 1:
                O.lantern(x, y, 11, math.sin(t * 20 + i))
            elif t < impact:
                O.star(sx, sy, 16 + 4 * math.sin(t * 12 + i), 2, GOLD)
                O.disc(sx, sy, 4, GOLD, WHITE)
        if 1.95 <= t < impact + .05:   # 星座を結ぶ（剣の形）
            k = ease((t - 1.95) / .45)
            for a, b in EDGES:
                (ax, ay), (bx, by) = STARS[a], STARS[b]
                O.line([(ax, ay), (ax + (bx - ax) * k, ay + (by - ay) * k)], BLUE, 3)
        if 2.55 <= t < impact:   # 天からの斬り下ろしの光の筋
            k = (t - 2.55) / .2
            O.line([(ENEMY_X + 10, 0), (ENEMY_X + 10, 60 + (GROUND - 60) * k)], WHITE, 8)
        if impact <= t < impact + .9:
            k = (t - impact) / .9
            if k < .35:
                O.disc(ENEMY_X + 10, GROUND - 90, 120 * (1 - k), tuple(int(c * (1 - k * 2.5)) for c in GOLD), WHITE)
                O.star(ENEMY_X + 10, GROUND - 90, 420 * (1 - k * 1.5), 10 * (1 - k * 2.5), tuple(int(c * (1 - k * 2.8)) for c in WHITE), rot=0)
                O.star(ENEMY_X + 10, GROUND - 90, 260 * (1 - k * 1.5), 6, tuple(int(c * (1 - k * 2.8)) for c in BLUE), rot=45)
            O.rays(ENEMY_X + 10, GROUND - 90, 24, 60, 300 * min(1, k * 3), tuple(int(c * (1 - k)) for c in GOLD), 9, 4)
            for j in range(4):
                U.ring(ENEMY_X, GROUND + 8, 80 + 380 * k + j * 40, 20 + 90 * k + j * 10, 3, tuple(int(c * (1 - k)) for c in (BLUE if j % 2 else GOLD)))
        if 3.5 <= t < 4.5:   # 余韻：灯が 1 つだけ残って昇って消える
            k = (t - 3.5) / 1.0
            O.lantern(ENEMY_X + 60, GROUND - 120 - 120 * k, 6 * (1 - k), math.sin(t * 20))

    def en(base):
        if t < impact:
            return enemy(base, tint=((60, 80, 160), .35 * night))
        if t < impact + .1:
            return enemy(base, white=.8)
        if t < 3.6:
            return enemy(base, tint=((255, 220, 120), .45))   # 術の色に染まる
        return enemy(base, tint=((230, 40, 40), .7), dissolve=ease((t - 3.75) / .35), seed=5)

    def ui(img):
        if t < .55:
            bubble(img, '天灯星斬！', HERO_X - 150, GROUND - 170)
        if t >= 3.15:
            number(img, 98765, ENEMY_X - 70, GROUND - 210, t - 3.15, label='Critical')

    return compose(t, st, dark, lambda b: hero(b, pose, hx, foot), en, fx, ui, bgcol=((10, 14, 40), .75 * night))


def tentou_sfx(m):
    m.noise_band(.7, .35, 400, 2000, .35)        # 溜め
    m.noise_band(1.0, .35, 1200, 6000, .5)       # 跳ぶ（上がる風）
    for i in range(6):                           # 天灯が昇る：柔らかい高音が 1 つずつ
        m.ring(1.1 + i * .12 + .6, [3500, 4200, 4700, 5300, 6300, 7000][i], .4, .08)
    m.noise_band(1.95, .5, 2500, 8000, .25)      # 星座が結ばれる（きらめきの層）
    m.noise_band(2.5, .3, 6000, 900, .6)         # 天から落ちる
    m.thump(2.75, 1.0, .4)
    for k in range(3):
        m.ring(2.75 + k * .09, [6800, 10200, 6800][k], .35, .3)
    m.noise_band(2.8, 1.2, 4000, 500, .35)       # 光の雨
    m.chime(3.15, [5400, 6800, 8100, 10800], .1, .12)   # 上がる鈴（星臨の金）


SK = {'光刃': (2.4, koujin, koujin_sfx), '灯火連斬': (3.3, torirensan, torirensan_sfx), '天灯星斬': (4.7, tentou, tentou_sfx)}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SK):
        d, f, s = SK[k]
        render(k, d, f, s)
