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


def _frame(sk, tl, i):
    img = _frame0(sk, tl, i)
    p = getattr(sk, 'post', None)
    return p(tl.taus[i], img) if p else img


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




# =============== 刻の矢（第 2 版：夜空の大時計 → 跳んで 3 連の針の矢 → 12 の星から一斉の矢・スローで両断の光柱） ===============
SKX, SKY, SKR = W / 2 - 40, 190, 150          # 空の大時計


class Kokunoya(X.Skill):
    name, dur = '刻の矢', 4.7
    ghost = (150, 120, 255)
    T1, T2, T3, TF = 1.62, 1.74, 1.83, 2.30   # 3 連はだんだん速く → 一斉射の着弾
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
        if t < 2.55:                             # 発動：大きく跳んで空中で撃つ → 着地
            a = t - 1.36
            hop = 90 * math.sin(clamp(a / 1.25) * math.pi) ** .7
            return act_pose(t, 1.36, HOME_X + 30 * math.sin(clamp(a / 1.25) * math.pi), GROUND, hop)
        if t < 2.75:
            return hero(fr('cast_in', t - 2.55, .1, False), HOME_X)
        return idle(t)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        gx, gy = tip(hh)
        # 足元の文字盤（逆回り）と昇る光の粒
        if .32 <= t < 2.6:
            k = ease((t - .32) / .3) * (1 - ease((t - 2.3) / .3))
            dial(B, HOME_X, GROUND + 6, 110, k, t, hand=-t * 9, ticks=clamp((t - .32) / .5))
            X.parts(F, HOME_X, GROUND, t - .4, 70, 1.6, PALE, 120, 3, 'ember', up=3.6, spread=(200, 340), star=True, size=(2, 4))
        X.gather(c, gx, gy, .45, 1.34, seed=3, big=1.0, cols=(VIO, BLUE), flame=False)
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
        # 3 連の針の矢（空中から）
        for i, (t0, th) in enumerate(((1.46, self.T1), (1.60, self.T2), (1.71, self.T3))):
            if t0 <= t < th:
                clock_arrow(F, gx, gy - 6, ECX + 10, ECY - 10 + i * 14, ein((t - t0) / (th - t0)), 1.0, seed=i)
            if t0 <= t < t0 + .08:
                X.star_flash(F, gx, gy, 90, 1 - (t - t0) / .08, rot=t * 200, sub=BLUE)
        for i, (th, s) in enumerate(((self.T1, .8), (self.T2, .9), (self.T3, 1.5))):
            X.impact(c, ECX, ECY - 10 + i * 14, s, th, seed=10 + i * 7, cold=True, rot=i * 22)
        # 一斉射：12 の星から針の矢が敵へ収束（少しずつずらして）
        for i in range(12):
            t0 = 1.95 + i * .012
            if t0 <= t < self.TF:
                px, py = hour_pos(SKX, SKY, SKR, i)
                clock_arrow(F, px, py, ECX, ECY, ein((t - t0) / (self.TF - t0)), 1.0, seed=20 + i)
                if t < t0 + .06:
                    X.star_flash(F, px, py, 70, 1 - (t - t0) / .06, sub=VIO)
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
    name, dur = '遅延の砂', 4.5
    ghost = (150, 120, 255)
    HIT, STOP = 1.85, 2.35
    hits = [X.Hit(1.85, 2, ECX, ECY, 0, 1, stop=4, tint=VIO), X.Hit(2.35, 3, ECX, ECY, 0, 0, stop=24, z=.07, tint=VIO)]

    def dark(self, t):
        d = X.dim(t, .30, 3.3, .45)
        if 1.10 <= t < 1.18:
            d *= .12
        return d

    def hero(self, t):
        if t < .32:
            return idle(t)
        h = cast_pose(t, .32, 1.10)
        if h:
            return h
        if t < 2.9:
            a = t - 1.10
            if a < .3:
                return act_pose(t, 1.10, HOME_X, GROUND, 30 * math.sin(clamp(a / .3) * math.pi))
            return hero(fr('cast', a, .09), HOME_X, GROUND - 6 - 3 * math.sin(a * 5))
        return idle(t)

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
        # 大きな砂時計：組み上がる → 1.30 で裏返る（180° 回る）→ 砂が落ちる
        hx, hy = ECX, ECY - 210
        k = ease((t - 1.10) / .25) * (1 - ease((t - 2.32) / .05))
        if k > 0:
            s = 70 * k
            tilt = math.pi * ease((t - 1.30) / .3) + math.radians(6 * math.sin(t * 3))

            def P(px, py):
                return hx + px * math.cos(tilt) - py * math.sin(tilt), hy + px * math.sin(tilt) + py * math.cos(tilt)
            F.push()
            for yy in (-1.2, 1.2):
                F.line([P(-s, s * yy), P(s, s * yy)], PALE, 5, k, glow=6)
            F.line([P(-s * .8, -s * 1.2), P(0, -3), P(-s * .8, s * 1.2)], VIO, 4, k, glow=8)
            F.line([P(s * .8, -s * 1.2), P(0, -3), P(s * .8, s * 1.2)], VIO, 4, k, glow=8)
            fill = clamp((t - 1.6) / .7)
            F.poly([P(-s * .6 * (1 - fill), s * (1 - fill) + 3), P(s * .6 * (1 - fill), s * (1 - fill) + 3), P(0, 3)], mul(PALE, .85), k * (1 - fill))
            F.poly([P(-s * .7, -s * 1.15), P(s * .7, -s * 1.15), P(0, -s * 1.15 + s * .9 * fill)], mul(VIO, .9), k)
            for e in (-1.2, 1.2):
                X.star_flash(F, *P(0, s * e + 10 * e), 46 * k, k, rot=t * 60, col=X.WHITE, sub=BLUE)
        # 渦を巻く星の砂（らせんで降りる）
        if 1.55 <= t < 2.35:
            rnd = random.Random(7)
            F.push()
            for i in range(260):
                t0 = 1.55 + rnd.uniform(0, .7)
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
            kk = clamp(a / .15) * (1 - clamp((t - self.STOP - .05) / .05))
            dial(F, ECX, ECY, 130, kk, t, hand=2 * (1 - math.exp(-a * 1.5)), flat=False)
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
            return hero(fr('act', (t - 1.05), .05), x, y, g=1)
        if t < 2.2:
            return hero(fr('cast_in', t - 1.85, .08, False), HOME_X)
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


SK = {s.name: s for s in (Kokunoya(), Chien(), Kasoku(), Hidan())}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SK):
        X.render(SK[k])
