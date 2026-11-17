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
SRC = os.path.join(HERE, '..', 'out')
NAMES = {'横': 'side', '構え': 'ready', '詠唱': 'cast', '正面': 'front', '瀕死': 'dying', '気絶': 'faint'}


def _load(n):
    im = Image.open(os.path.join(SRC, f'celes48_{n}.png')).convert('RGBA')
    out = Image.new('RGBA', (48, 50))
    out.paste(im, (0, 0))
    return out


X.SPR = {k: _load(v) for k, v in NAMES.items()}
X.SPRB = {k: X.big(v) for k, v in X.SPR.items()}
X.SPRW = {k: Image.fromarray(np.dstack([np.full((v.height, v.width, 3), 255, np.uint8), np.asarray(v)[..., 3]]), 'RGBA')
          for k, v in X.SPRB.items()}


def _gem(im):
    """杖の宝石（青）の中心。足元の中心からの差（画面の px）"""
    a = np.asarray(im).astype(int)
    m = (np.abs(a[..., 0] - 65) < 20) & (np.abs(a[..., 1] - 135) < 25) & (a[..., 2] > 200) & (a[..., 3] > 0)
    ys, xs = np.where(m)
    if not len(xs):
        return (-60, -120)
    return (xs.mean() * PX + 2 - im.width * PX / 2, ys.mean() * PX + 2 - im.height * PX + 8)


X.TIP = {k: _gem(v) for k, v in X.SPR.items()}
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


def idle(t, x=HOME_X):
    return hero('横', x, GROUND + (0 if int(t / .5) % 2 == 0 else 0))


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


def label(img, text, x, y, a, col, size=30):
    """強化・弱体の文字（ぽんと出て浮く）"""
    if a < 0 or a > 1.6:
        return
    sc = 1.3 - .3 * eout(a / .1) if a < .1 else 1.0
    al = 1 - clamp((a - 1.2) / .4)
    if al <= 0:
        return
    X.metal(img, text, x, y - 18 * eout(a / .6), size, sc, font=X.FONT_JA, stroke=4, plain=tuple(int(c * al + 30 * (1 - al)) for c in col))


def cast_pose(t, t0, t1):
    """詠唱：t0〜t1 は詠唱のポーズ（ふわりと浮く）"""
    if t0 <= t < t1:
        return hero('詠唱', HOME_X, GROUND - 6 * math.sin(clamp((t - t0) / .3) * math.pi / 2) - 2 * math.sin(t * 6))
    return None


# =============== 刻の矢（陰・単体 3 連：針の矢がだんだん速く → 最後の 1 本で文字盤が砕けて星が昇る） ===============
class Kokunoya(X.Skill):
    name, dur = '刻の矢', 3.3
    ghost = BLUE
    T1, T2, T3 = 1.50, 1.64, 1.74          # だんだん速く（間隔 0.14 → 0.10）
    hits = [X.Hit(1.50, 1, ECX, ECY, -1, 0, tint=VIO), X.Hit(1.64, 1, ECX, ECY, -1, 0, tint=VIO),
            X.Hit(1.74, 2, ECX, ECY, -1, -.3, tint=VIO)]
    slow = ((1.70, 1.78, .5),)

    def dark(self, t):
        d = X.dim(t, .30, 2.45, .40)
        if 1.24 <= t < 1.34:                   # 放出の直前：背景を真っ黒に
            d *= .12
        return d

    def hero(self, t):
        if t < .32:
            return idle(t)
        h = cast_pose(t, .32, 1.20)
        if h:
            return h
        if t < 1.95:
            return hero('構え', HOME_X - 10 * eout((t - 1.2) / .1), GROUND - 10 * math.sin(clamp((t - 1.2) / .25) * math.pi))
        return idle(t)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        if .32 <= t < 2.0:                      # 足元の文字盤（逆回りに回る）
            dial(B, HOME_X, GROUND + 6, 92, ease((t - .32) / .3) * (1 - ease((t - 1.75) / .25)), t, hand=-t * 7, ticks=clamp((t - .32) / .6))
        X.gather(c, gx, gy, .40, 1.18, seed=3, cols=(VIO, BLUE), flame=False)
        if .55 <= t < 1.80:                     # 敵の足元の予兆（地面の文字盤が縮む）
            k = ease((t - .55) / .25) * (1 - .45 * ease((t - 1.2) / .3))
            dial(B, ECX, GROUND + 10, 150, k, t, hand=t * 3, ticks=clamp((t - .55) / .5))
            B.disc(ECX, GROUND + 6, 14, PALE, .7 * k, glow=3)
        if 1.24 <= t < 1.34:                    # 注目：敵の位置に白い球
            F.disc(ECX, ECY, 34 * (1 - abs(t - 1.29) / .05), X.WHITE, 1.0, glow=2.6)
        X.glint(F, gx, gy, t, 1.18, .16, 60)
        for i, (t0, th) in enumerate(((1.34, self.T1), (1.48, self.T2), (1.60, self.T3))):
            if t0 <= t < th:
                clock_arrow(F, gx, gy - 6, ECX + 10, ECY - 6 + i * 12, ein((t - t0) / (th - t0)), 1.0, seed=i)
        for i, (th, s) in enumerate(((self.T1, .7), (self.T2, .8), (self.T3, 1.5))):
            X.impact(c, ECX, ECY - 6 + i * 12, s, th, seed=10 + i * 7, cold=True, rot=i * 22)
        a = t - self.T3
        if a >= 0:                              # この術の印：文字盤が縦に立ち、針が 12 で止まって砕ける → 星が昇る
            k = clamp(a / .12) * (1 - clamp((a - .55) / .3))
            dial(F, ECX, ECY, 120 * (1 + .3 * eout(a / .5)), k, t, hand=-math.pi * 2 * min(1, a / .3), flat=False)
            X.parts(F, ECX, ECY, a, 40, 3.2, PALE, 110, 31, 'ember', up=3.0, spread=(200, 340), star=True, size=(3, 6))
            X.parts(F, ECX, ECY, a, 30, 6, VIO, 70, 32, 'ember', up=1.6)
        if t >= 2.0:
            X.glint(F, *tip(hh), t, 2.05, .22, 46)

    def enemy(self, c):
        return X.enemy_state(c, self.hits, VIO, dis0=99)

    def ui(self, c, img):
        t = c.t
        if t < .45:
            X.bubble(img, '刻の矢！', HOME_X - 110, GROUND - 230, c.rt)
        for i, (th, n) in enumerate(((self.T1, 412), (self.T2, 437), (self.T3, 896))):
            a = t - th - .03
            if 0 <= a < .7:
                X.number(img, n, EN_X - 90 + i * 70, GROUND - 230 - i * 40, a, size=32)
        a = t - self.T3 - .45
        if a >= 0:
            X.crit(img, EN_X + 10, GROUND - 320, a, 'Weak')
            X.number(img, 1745, EN_X - 50, GROUND - 270, a - .06, size=48, total=True)

    def sfx(self, m):
        T = m.T
        m.band(T(.30), 2.2, 900, 2600, .04, .3, .2, .5)        # 層：時の唸り
        m.charge(T(.40), .8, .18, 330, 990)
        for k in range(8):                                        # 秒針の音（逆回り）
            m.ring(T(.45 + k * .1), 5200 - k * 120, .05, .05)
        m.shimmer(T(1.18), .14, .06, 1)
        m.whoosh(T(1.24), .1, 3000, 300, .25)                      # 暗転して静かに
        for th in (self.T1, self.T2, self.T3):
            m.whoosh(T(th - .12), .12, 1200, 7000, .3)
            m.triplet(th, .22)
        m.sub(T(self.T3), .9)
        m.band(T(self.T3), .6, 7000, 900, .2, .4, .005, .4)
        m.shimmer(T(self.T3, .1), .7, .08, 2)
        m.chime(T(2.25), [8300, 6500, 6100, 5700], .12, .09)


# =============== 遅延の砂（陰・弱体：敵の頭上に砂時計 → 星の砂が降る → 文字盤の針が止まりかける） ===============
class Chien(X.Skill):
    name, dur = '遅延の砂', 3.4
    ghost = BLUE
    HIT = 1.45
    hits = [X.Hit(1.45, 1, ECX, ECY, 0, 1, stop=4, tint=VIO)]

    def dark(self, t):
        d = X.dim(t, .30, 2.6, .38)
        if 1.10 <= t < 1.18:
            d *= .15
        return d

    def hero(self, t):
        if t < .32:
            return idle(t)
        h = cast_pose(t, .32, 1.10)
        if h:
            return h
        if t < 2.2:
            return hero('構え', HOME_X, GROUND - 8 * math.sin(clamp((t - 1.1) / .25) * math.pi))
        return idle(t)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        if .32 <= t < 2.3:
            dial(B, HOME_X, GROUND + 6, 92, ease((t - .32) / .3) * (1 - ease((t - 2.0) / .3)), t, hand=t * 5, ticks=clamp((t - .32) / .6))
        X.gather(c, gx, gy, .40, 1.08, seed=5, cols=(VIO, BLUE), flame=False)
        X.glint(F, gx, gy, t, 1.08, .16, 56)
        # 砂時計（敵の頭上に組み上がる → 傾いて砂がこぼれる）
        hx, hy = ECX, ECY - 190
        k = ease((t - 1.10) / .25) * (1 - ease((t - 2.4) / .4))
        if k > 0:
            s = 46 * k
            tilt = math.radians(8 * math.sin(t * 3))
            def P(px, py):
                return hx + px * math.cos(tilt) - py * math.sin(tilt), hy + px * math.sin(tilt) + py * math.cos(tilt)
            F.push()
            F.line([P(-s, -s * 1.2), P(s, -s * 1.2)], PALE, 4, k, glow=5)
            F.line([P(-s, s * 1.2), P(s, s * 1.2)], PALE, 4, k, glow=5)
            F.line([P(-s * .8, -s * 1.2), P(0, -2), P(-s * .8, s * 1.2)], VIO, 3, k, glow=6)
            F.line([P(s * .8, -s * 1.2), P(0, -2), P(s * .8, s * 1.2)], VIO, 3, k, glow=6)
            fill = clamp((t - 1.3) / 1.0)
            F.poly([P(-s * .6 * (1 - fill), -s * (1 - fill) - 2), P(s * .6 * (1 - fill), -s * (1 - fill) - 2), P(0, -2)], mul(PALE, .8), k * (1 - fill))
            F.poly([P(-s * .7, s * 1.15), P(s * .7, s * 1.15), P(0, s * 1.15 - s * .9 * fill)], mul(VIO, .9), k)
            X.star_flash(F, *P(0, -s * 1.2 - 8), 30 * k, k, rot=t * 40, col=X.WHITE, sub=BLUE)
        # 星の砂が降る（1.25〜2.3）
        if 1.25 <= t < 2.5:
            rnd = random.Random(7)
            F.push()
            for i in range(120):
                t0 = 1.25 + rnd.uniform(0, 1.0)
                u = (t - t0) / .55
                if not 0 <= u <= 1:
                    continue
                x = hx + rnd.uniform(-60, 60) * u + math.sin(i + t * 4) * 6
                y = hy + 10 + (ECY + 40 - hy) * u ** 1.6
                col = (PALE, VIO, BLUE)[i % 3]
                F.ds.rectangle([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=mul(col, 1 - u * .3))
                if i % 6 == 0:
                    F.star(x, y, 7, 1, X.WHITE, .9 * (1 - u), rot=45)
        # 命中：遅い波紋（ゆっくり広がる輪 3 重）・地面の文字盤の針が止まりかける
        a = t - self.HIT
        if a >= 0:
            for j in range(3):
                q = clamp((a - j * .25) / 1.2)
                B.ring(ECX, GROUND + 10, 30 + 170 * eout(q), (30 + 170 * eout(q)) * .22, 3, (VIO, BLUE, PALE)[j], (1 - q) * .9)
            kk = clamp(a / .2) * (1 - clamp((a - 1.4) / .4))
            dial(B, ECX, GROUND + 10, 140, kk, t, hand=1.5 + 2.0 * (1 - math.exp(-a * 2)))
            X.star_flash(F, ECX, ECY - 30, 160 * (1 - clamp(a / .3)), 1 - clamp(a / .3), rot=a * 30, sub=VIO)
            X.parts(F, ECX, ECY + 20, a, 40, 2.4, VIO, 90, 41, 'ember', up=.6, spread=(160, 380))

    def enemy(self, c):
        st, kb = X.enemy_state(c, self.hits, VIO, dis0=99, pre_tint=None)
        a = c.t - self.HIT
        if a > .2:                               # 遅くなった：紫に染まったまま、震えがゆっくり
            st = dict(tint=(VIO, .3 + .1 * math.sin(a * 3)))
        return st, kb * .3

    def ui(self, c, img):
        t = c.t
        if t < .45:
            X.bubble(img, '遅延の砂！', HOME_X - 110, GROUND - 230, c.rt)
        a = t - self.HIT - .1
        label(img, '遅延', EN_X - 40, GROUND - 300, a, VIO, 34)
        label(img, '素早さ↓', EN_X + 30, GROUND - 255, a - .25, (120, 170, 255), 30)

    def sfx(self, m):
        T = m.T
        m.band(T(.30), 2.6, 700, 1800, .04, .3, .2, .5)
        m.charge(T(.40), .7, .16, 300, 900)
        m.shimmer(T(1.10), .3, .07, 3)
        m.band(T(1.25), 1.2, 9000, 3000, .05, .5, .1, .5)            # 砂の流れる音（高いノイズが下がる）
        m.thump(T(self.HIT), .5, .3, 120)
        for k in range(6):                                            # 秒針がだんだん遅く
            m.ring(T(self.HIT + .1 + k * (.12 + k * .05)), 4800, .06, .07)
        m.chime(T(2.7), [5700, 6100, 6500, 5200], .16, .08)


# =============== 加速の刻（補助：背中に縦の文字盤が立ち、針が早回し → 青い残像が走る → 素早さ↑） ===============
class Kasoku(X.Skill):
    name, dur = '加速の刻', 2.9
    ghost = BLUE
    hits = []

    def dark(self, t):
        return X.dim(t, .30, 2.1, .32)

    def hero(self, t):
        if t < .32:
            return idle(t)
        h = cast_pose(t, .32, 1.0)
        if h:
            return h
        if t < 1.7:                              # 早回し：前後に素早く 2 往復（残像が出る）
            u = (t - 1.0) / .7
            return hero('構え', HOME_X - 40 * math.sin(u * math.pi * 2) * (1 - u), GROUND - 14 * abs(math.sin(u * math.pi * 2)), g=1)
        return hero('横', HOME_X)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        X.gather(c, gx, gy, .40, .98, seed=9, cols=(BLUE, PALE), flame=False)
        if .32 <= t < 2.3:
            k = ease((t - .32) / .3) * (1 - ease((t - 1.9) / .4))
            sp = 2 + 40 * ease((t - .9) / .6)          # 針が早回しになる
            hand = .5 * t * 2 + sp * max(0, t - .9) ** 1.3
            dial(B, HOME_X, GROUND - 100, 118, k, t, hand=hand, flat=False, col=BLUE, sub=VIO)
            dial(B, HOME_X, GROUND + 6, 90, k, t, hand=hand * .5, col=BLUE, sub=VIO)
        if 1.0 <= t < 1.75:                      # 上へ流れる光の筋（時間が速く流れる）
            rnd = random.Random(3)
            F.push()
            for i in range(26):
                x = HOME_X + rnd.uniform(-90, 90)
                ph = (t * 2.4 + rnd.random()) % 1
                y = GROUND - ph * 260
                F.line([(x, y), (x, y + 40)], (BLUE, PALE)[i % 2], 2, (1 - ph) * .9, glow=4)
        a = t - 1.70
        if a >= 0:                               # 決まった：星の閃光と昇る星の粒
            X.star_flash(F, HOME_X, GROUND - 100, 200 * (1 - clamp(a / .35)) ** .5, 1 - clamp(a / .35), rot=a * 50, sub=BLUE)
            X.parts(F, HOME_X, GROUND - 40, a, 50, 3, PALE, 100, 51, 'ember', up=3.2, spread=(220, 320), star=True, size=(3, 5))
            X.parts(F, HOME_X, GROUND - 40, a, 40, 5, BLUE, 70, 52, 'ember', up=2.0)
            X.glint(F, *tip(hh), t, 1.95, .22, 50)

    def enemy(self, c):
        return {}, 0

    def ui(self, c, img):
        t = c.t
        if t < .45:
            X.bubble(img, '加速の刻！', HOME_X - 110, GROUND - 230, c.rt)
        a = t - 1.75
        label(img, '素早さ↑', HOME_X, GROUND - 250, a, (110, 240, 170), 32)
        label(img, '行動順↑', HOME_X + 10, GROUND - 210, a - .2, (110, 240, 170), 26)

    def sfx(self, m):
        T = m.T
        m.band(T(.30), 2.0, 1200, 3000, .035, .3, .2, .5)
        m.charge(T(.40), .55, .16, 400, 1200)
        for k in range(18):                                  # 秒針がだんだん速く
            m.ring(T(.9 + .8 * (1 - (1 - k / 18) ** .5)), 5200 + k * 60, .04, .05)
        m.whoosh(T(1.0), .3, 800, 5000, .25)
        m.whoosh(T(1.35), .3, 800, 5000, .22)
        m.shimmer(T(1.7), .6, .09, 4)
        m.chime(T(1.8), [5700, 6100, 6500, 8300], .1, .1)


# =============== 被弾 → 瀕死 → 気絶（敵の体当たり 2 回。白い影 → のけぞり → 瀕死の構え → 倒れて気絶） ===============
class Hidan(X.Skill):
    name, dur = '被弾', 4.1
    H1, H2 = .70, 2.05
    hits = [X.Hit(.70, 2, HOME_X, GROUND - 100, 1, 0, tint=(255, 80, 80)), X.Hit(2.05, 3, HOME_X, GROUND - 100, 1, .2, tint=(255, 60, 60))]

    def dark(self, t):
        return 1 - .25 * ease((t - 2.4) / .6)

    def hero(self, t):
        if t < self.H1:
            return idle(t)
        a = t - self.H1
        if a < .08:
            return dict(hero('横', HOME_X + 30 * eout(a / .08)), w=1)
        if a < .5:
            return hero('瀕死', HOME_X + 30 - 22 * ease((a - .08) / .4))
        if t < self.H2:
            return hero('瀕死', HOME_X + 8 + 2 * math.sin(t * 9))
        b = t - self.H2
        if b < .08:
            return dict(hero('瀕死', HOME_X + 8 + 40 * eout(b / .08)), w=1)
        return hero('気絶', HOME_X + 8 + 16 * eout(clamp((b - .08) / .3)), GROUND - 30 * math.sin(clamp((b - .08) / .3) * math.pi))

    def draw(self, c, hh):
        t, F = c.t, c.F
        for th, s in ((self.H1, .9), (self.H2, 1.4)):
            a = t - th
            if a >= 0:
                kc = max(0, 1 - c.ra(th) / .08) if c.ra(th) >= 0 else 0
                F.disc(HOME_X - 10, GROUND - 100, 40 * kc + 1, X.WHITE, kc, glow=2.4)
                X.star_flash(F, HOME_X - 10, GROUND - 100, 150 * s * (1 - clamp(a / .25)), 1 - clamp(a / .25), col=X.WHITE, sub=(255, 90, 90))
                X.parts(F, HOME_X - 10, GROUND - 100, a, 40, 14, (255, 140, 120), 22, 61 + int(s * 10))
        X.dust(c.FF, HOME_X + 24, GROUND + 4, t - self.H2 - .38, 18, 5, 1, seed=8)
        if t > self.H2 + .5:                     # 気絶：頭の上に回る小さな星
            a = t - self.H2 - .5
            hx, hy = HOME_X + 4, GROUND - 70
            for i in range(3):
                ang = a * 4 + i * math.tau / 3
                F.star(hx + math.cos(ang) * 26, hy + math.sin(ang) * 8 - 10, 10, 1.4, (255, 230, 140), .9, rot=a * 90)

    def enemy(self, c):
        t = c.t
        kb = 0.0
        for th in (self.H1, self.H2):            # 体当たり（前へ飛び出して戻る）
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
            X.number(img, 1203, HOME_X - 30, GROUND - 230, a2, size=44)
        if t > self.H2 + 1.15:
            label(img, '気絶', HOME_X, GROUND - 200, t - self.H2 - 1.15, (255, 120, 120), 34)

    def sfx(self, m):
        T = m.T
        for th, v in ((self.H1, .7), (self.H2, 1.0)):
            m.whoosh(T(th - .25), .22, 400, 1600, .2)
            m.thump(T(th), v, .25, 140)
            m.band(T(th), .3, 3000, 600, .25 * v, .4, .005, .3)
        m.sub(T(self.H2), .7)
        m.thump(T(self.H2 + .38), .4, .2, 90)
        m.chime(T(self.H2 + .7), [3000, 2600, 2200, 1800], .16, .07)


SK = {s.name: s for s in (Kokunoya(), Chien(), Kasoku(), Hidan())}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SK):
        X.render(SK[k])
