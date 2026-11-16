"""リオの技の演出・第 3 版（rio.py の手描きのドット絵で。rs-battle-fx の時間割＋派手さの決まり）
実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs4/skills.py [光刃 灯火連斬 天灯星斬]
出力：out/skill_<技>.mp4（音つき・640×720・60fps）・out/skill_<技>_sheet.png
共通部品は fxlib.py（リオの光の言葉：色の役割・星の閃光・着弾・溜め・斬撃・退場）。
第 2 版から：
  ・3 つの技を同じ部品で組む（溜め gather → 刃先のきらめき → 斬撃 slash → 着弾 impact → 宙返り backflip → 決めポーズ）
  ・ヒットストップ 3/6/10 コマ（技の時刻を止める）・白飛び 1〜2 コマ → 金色の明け・方向つきの揺れ・大きな命中で寄り
  ・奥義の着弾の直前に 0.5 倍のスロー・横の光の筋（レンズの筋）
  ・砂ぼこり・焦げ・影・金の残像・回る放射・2 重の衝撃の輪・弧に沿う燠・残光の線
  ・Critical は金属の金で弾む・連続技は 1 撃ずつの数字 → 合計
  ・音：風切り 2 層・金属音の 3 連打（真ん中が閃光のコマ）・重低音・溜めの上がる音・星のきらめき・結果の鈴"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import (  # noqa: E402
    ECX, ECY, EMBER, EN_X, GOLD, GROUND, HOME_X, HOT, NIGHT, PALE, W, WHITE,
    Hit, Skill, backflip, bubble, crit, dim, dust, ease, ein, enemy_state, eout, clamp,
    gather, glint, ground_sigil, hero, impact, mul, number, parts, render, slash, star_flash, tip)


def idle(t, x=HOME_X):
    return hero('構え1' if int(t / .4) % 2 == 0 else '構え2', x)


# =============== 光刃（灯の炎を刃に集め → 踏み込み → 斬り上げ → 星の閃光＋昇る燠） ===============
class Koujin(Skill):
    name, dur = '光刃', 2.80
    HIT, NX = 1.12, 318
    hits = [Hit(1.12, 2, ECX, ECY, -.5, -.85)]

    def dark(self, t):
        return dim(t, .45, 2.0)

    def hero(self, t):
        if t < .55:
            return idle(t)
        if t < .95:
            return hero('溜め', HOME_X + 8 * ease((t - .55) / .12))
        if t < 1.05:
            return hero('振り抜き', HOME_X + 8 - (HOME_X + 8 - self.NX) * eout((t - .95) / .10), g=1)
        if t < 1.07:
            return hero('斬り', self.NX, g=1)
        if t < self.HIT:
            return hero('振りかぶり', self.NX - 4, GROUND - 14 * (t - 1.07) / .05, g=1)
        if t < 1.42:
            k = (t - self.HIT) / .30
            return hero('振りかぶり', self.NX - 4 + 8 * k, GROUND - 14 - 30 * math.sin(math.pi * k) + 14 * k)
        if t < 1.74:
            return backflip(t, 1.42, .32, self.NX + 4, HOME_X)
        if t < 1.80:
            return hero('構え2', HOME_X)
        return hero('構え1', HOME_X)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        tx, ty = tip(hh)
        if .55 <= t < .97:
            ground_sigil(B, HOME_X, ease((t - .55) / .25), t)
            gather(c, tx, ty, .55, .95, seed=3)
            glint(F, tx, ty, t, .84, .14, 44)
        if .95 <= t < self.HIT:                 # 炎を刃に乗せて踏み込む
            F.flame(tx, ty, 13, math.sin(t * 47))
            F.speedlines(hh['x'], hh['f'] - 70, 28, 150, (255, 236, 200), .75, int(t * 60))
        dust(c.FF, HOME_X + 10, GROUND + 4, t - .95, 12, 4.5, 1, seed=1)
        slash(c, (ECX - 75, ECY + 110), (ECX + 115, ECY - 175), -62, 1.07, .05, 42, seed=2)
        impact(c, ECX, ECY, 1.0, self.HIT, seed=11, rot=10)
        a = t - self.HIT
        if a >= 0:                              # この技の印：星の閃光が残り、燠が柱になって昇る
            parts(F, ECX, ECY + 30, a, 46, 3.5, EMBER, 110, 77, 'ember', up=3.4, spread=(250, 290))
            parts(F, ECX, ECY, a, 18, 3, GOLD, 120, 78, 'ember', up=2.6, spread=(220, 320), star=True, size=(3, 5))
            if c.ra(self.HIT) < .3:
                F.flare(ECX, ECY, 300, max(0, 1 - c.ra(self.HIT) / .3))
            glint(F, ECX + 40, ECY - 60, t, self.HIT + .14, .22, 70, 15)
        dust(c.FF, self.NX, GROUND + 4, t - 1.42, 10, 4, -1, seed=5)
        dust(c.FF, HOME_X, GROUND + 4, t - 1.74, 14, 4.5, 0, seed=6)
        if t >= 1.80:
            glint(F, tx, ty, t, 1.86, .22, 50)

    def enemy(self, c):
        return enemy_state(c, self.hits, (255, 200, 100), dis0=2.25)

    def ui(self, c, img):
        t = c.t
        if t < .5:
            bubble(img, '光刃！', HOME_X - 120, GROUND - 190, c.rt)
        if t >= self.HIT + .04:
            a = t - self.HIT - .04
            crit(img, EN_X + 10, GROUND - 304, a)
            number(img, 1284, EN_X - 40, GROUND - 252, a - .05)

    def sfx(self, m):
        T = m.T
        m.wind(T(.45), T(2.5), .05)
        m.charge(T(.55), .4, .2)
        m.shimmer(T(.86), .14, .05, 1)
        m.whoosh(T(.95), .14, 700, 3800, .45)
        m.whoosh(T(1.05), .08, 2400, 9000, .5)
        m.triplet(self.HIT, .3)
        m.sub(T(self.HIT), .95)
        m.band(T(self.HIT), .5, 6000, 700, .25, .4, .005, .4)
        m.shimmer(T(self.HIT, .1), .6, .07, 2)
        m.whoosh(T(1.42), .3, 600, 2000, .18)
        m.thump(T(1.74), .35, .12, 210)
        m.shimmer(T(1.88), .18, .06, 3)
        m.chime(T(1.98), [8300, 6500, 6100, 5700], .12, .09)


# =============== 灯火連斬（だんだん速い 3 連 → 灯を三角の結界に結ぶ → 跳んで縦に両断・光の柱） ===============
class Torirensan(Skill):
    name, dur = '灯火連斬', 3.52
    H = [1.02, 1.27, 1.44]
    FIN, NEAR = 2.28, 300
    LAMPS = [(ECX, ECY - 165), (ECX - 135, ECY + 70), (ECX + 135, ECY + 70)]
    CUTS = [((ECX + 125, ECY - 125), (ECX - 125, ECY + 95), 55, GOLD),
            ((ECX - 120, ECY + 85), (ECX + 130, ECY - 120), 55, EMBER),
            ((ECX + 165, ECY + 5), (ECX - 170, ECY - 25), 42, GOLD)]
    hits = [Hit(1.02, 1, ECX, ECY, -.8, .6), Hit(1.27, 1, ECX, ECY, .7, -.7), Hit(1.44, 1, ECX, ECY, -1, 0),
            Hit(2.28, 2, ECX, ECY, 0, 1, stop=8, z=.045)]

    def dark(self, t):
        return dim(t, .45, 2.95)

    def hero(self, t):
        N = self.NEAR
        if t < .55:
            return idle(t)
        if t < .80:
            return hero('溜め', HOME_X + 6 * ease((t - .55) / .1))
        if t < .94:
            return hero('振り抜き', HOME_X + 6 - (HOME_X + 6 - N) * eout((t - .80) / .14), g=1)
        if t < .97:
            return hero('振りかぶり', N)
        if t < 1.02:
            return hero('斬り', N - 4, g=1)
        if t < 1.22:
            return hero('斬り', N - 4)
        if t < 1.27:
            return hero('振りかぶり', N - 8, g=1)
        if t < 1.40:
            return hero('振りかぶり', N - 8)
        if t < 1.44:
            return hero('振り抜き', N - 14, g=1)
        if t < 1.58:
            return hero('振り抜き', N - 14)
        if t < 1.80:                              # 少し跳び退く
            k = (t - 1.58) / .22
            return hero('選択', N - 14 + 44 * ease(k), GROUND - 40 * math.sin(math.pi * k))
        if t < 2.00:
            return hero('溜め', N + 30)
        if t < 2.14:                              # 敵の上へ跳ぶ
            k = eout((t - 2.0) / .14)
            return hero('振りかぶり', N + 30 - (N + 30 - ECX - 40) * k, GROUND - 230 * k, g=1)
        if t < 2.22:                              # 頂点で止める（決めの溜め）
            return hero('振りかぶり', ECX + 40, GROUND - 230 - 6 * math.sin((t - 2.14) / .08 * math.pi))
        if t < self.FIN:
            k = ein((t - 2.22) / .06)
            return hero('斬り', ECX + 40 + 30 * k, GROUND - 230 * (1 - k), g=1)
        if t < 2.62:
            return hero('振り抜き', ECX + 80)
        if t < 2.94:
            return backflip(t, 2.62, .32, ECX + 80, HOME_X, 110)
        if t < 3.0:
            return hero('構え2', HOME_X)
        return hero('構え1', HOME_X)

    def lamp_pos(self, i, t):
        h = self.H[i]
        k = eout((t - h) / .2)
        lx, ly = self.LAMPS[i]
        return ECX + (lx - ECX) * k, ECY + (ly - ECY) * k + 5 * math.sin(t * 4 + i)

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        tx, ty = tip(hh)
        if .55 <= t < .82:
            ground_sigil(B, HOME_X, ease((t - .55) / .2), t)
            gather(c, tx, ty, .55, .80, seed=4, big=.8)
            glint(F, tx, ty, t, .72, .1, 38)
        if .80 <= t < .94:
            F.speedlines(hh['x'], hh['f'] - 70, 26, 150, (255, 236, 210), .7, int(t * 60))
        dust(c.FF, HOME_X + 6, GROUND + 4, t - .80, 12, 4.5, 1, seed=1)
        # 3 連：1 撃ごとに角度・色を変え、だんだん速く
        for i, (p0, p1, bul, col) in enumerate(self.CUTS):
            h = self.H[i]
            slash(c, p0, p1, bul, h - .05 + .01 * i, .05 - .01 * i, 34 + 4 * i, col=col, seed=20 + i, life=.2)
            impact(c, ECX + (-10, 12, 0)[i], ECY + (6, -8, 0)[i], .35 + .1 * i, h, seed=30 + i * 7, rot=i * 25)
        fin_k = 1 - ease((t - self.FIN) / .12) if t >= self.FIN else 1
        # 灯（1 撃ごとに 1 つ灯って三角の頂点へ飛ぶ）
        for i in range(3):
            h = self.H[i]
            if t >= h and fin_k > 0:
                lx, ly = self.lamp_pos(i, t)
                if t < h + .2:
                    parts(F, lx, ly, 0, 1, 0, GOLD, 1, 0)
                    F.line([(ECX, ECY), (lx, ly)], EMBER, 2, .6 * (1 - (t - h) / .2))
                F.lantern(lx, ly, 3 + 12 * eout((t - h) / .15), math.sin(t * 40 + i), fin_k)
                glint(F, lx, ly, t, h + .17, .16, 40)
        # 結界：灯を光の線で結ぶ → 三角が満ちる → 回る陣
        if 1.60 <= t < self.FIN + .1:
            pts = [self.lamp_pos(i, t) for i in range(3)]
            for e in range(3):
                a, b = pts[e], pts[(e + 1) % 3]
                pe = ease((t - 1.62 - e * .09) / .2)
                if pe > 0:
                    hx, hy = a[0] + (b[0] - a[0]) * pe, a[1] + (b[1] - a[1]) * pe
                    F.line([a, (hx, hy)], GOLD, 3, fin_k)
                    if pe < 1:
                        star_flash(F, hx, hy, 30, 1)
            kf = ease((t - 1.95) / .15) * fin_k
            if kf > 0:
                F.push()
                F.dirty = True
                F.dg.polygon(pts, fill=mul(GOLD, .28 * kf))
                cx, cy = sum(p[0] for p in pts) / 3, sum(p[1] for p in pts) / 3
                inner = [(cx + (p[0] - cx) * .55, cy + (p[1] - cy) * .55) for p in pts]
                F.line(inner + [inner[0]], EMBER, 2, .8 * kf)
                r = 150
                for j in range(24):                   # 回る陣の刻み
                    a0 = math.radians(j * 15 + t * 90)
                    F.ds.arc([cx - r, cy - r, cx + r, cy + r], math.degrees(a0), math.degrees(a0) + 8, fill=mul(GOLD, .8 * kf), width=2)
                B.ring(ECX, GROUND + 10, 170 * kf, 38 * kf, 3, GOLD, .8 * kf)
                F.push()
        if 1.80 <= t < 2.02:
            gather(c, tx, ty, 1.80, 2.0, seed=8, big=.6)
        dust(c.FF, self.NEAR + 30, GROUND + 4, t - 2.0, 14, 5, 1, seed=9)
        if 2.0 <= t < self.FIN:
            F.speedlines(hh['x'], hh['f'] - 70, 26, 140, (255, 240, 210), .7, int(t * 60))
        if 2.14 <= t < 2.24:
            glint(F, tx, ty, t, 2.14, .1, 52)
        # とどめ：縦に両断＋灯が光の柱になる
        slash(c, (ECX + 30, ECY - 290), (ECX - 5, ECY + 110), 26, 2.22, .06, 46, seed=40, life=.3)
        a = t - self.FIN
        if a >= -.0:
            k = clamp(a / .75)
            B.beam(ECX, 0, GROUND + 20, 34 * (1 - k) ** 1.5, GOLD, 1 - k)
            for i, (lx, ly) in enumerate(self.LAMPS):
                kk = clamp((a - i * .03) / .6)
                F.beam(lx, ly - 380 * eout(kk / .4), ly + 40, 11 * (1 - kk), EMBER, 1 - kk)
                if kk < 1:
                    star_flash(F, lx, ly, 70 * (1 - kk), 1 - kk, kk * 60)
                parts(F, lx, ly, a, 14, 9, GOLD, 30, 50 + i)
            impact(c, ECX, ECY, 1.5, self.FIN, seed=60, rot=45)
            if c.ra(self.FIN) < .4:
                F.flare(ECX, ECY, 420, 1 - c.ra(self.FIN) / .4)
        dust(c.FF, ECX + 80, GROUND + 4, a, 18, 6, 0, seed=10)
        dust(c.FF, HOME_X, GROUND + 4, t - 2.94, 14, 4.5, 0, seed=11)
        if t >= 3.0:
            glint(F, tx, ty, t, 3.06, .22, 50)

    def enemy(self, c):
        return enemy_state(c, self.hits, (255, 150, 70), dis0=3.08)

    def ui(self, c, img):
        t = c.t
        if t < .5:
            bubble(img, '灯火連斬！', HOME_X - 140, GROUND - 190, c.rt)
        nums = [412, 438, 471]
        for i, h in enumerate(self.H):            # 1 撃ずつ（次が来たら上へずれて消える）
            end = self.H[i + 1] + .1 if i < 2 else 1.98
            if h + .02 <= t < end:
                number(img, nums[i], EN_X - 60 + i * 14, GROUND - 250 - i * 34, t - h - .02, 34)
        if t >= self.FIN + .02:
            a = t - self.FIN - .02
            if a < .4:
                number(img, 2380, EN_X - 50, GROUND - 252, a, 40)
            else:
                crit(img, EN_X + 14, GROUND - 300, a - .4)
                number(img, sum(nums) + 2380, EN_X - 58, GROUND - 254, a - .4, 52, total=True)

    def sfx(self, m):
        T = m.T
        m.wind(T(.45), T(3.2), .05)
        m.charge(T(.55), .25, .18, 260, 900)
        m.whoosh(T(.80), .14, 800, 4000, .45)
        for i, h in enumerate(self.H):
            m.whoosh(T(h, -.07), .08, 2200 + i * 600, 8000, .4)
            m.triplet(h, .2, 3800 + i * 300, 6800 + i * 500)
            m.thump(T(h), .55, .16, 180)
            m.ring(T(h, .14), 2400 + i * 400, .5, .06)          # 灯がともる
        m.band(T(1.62), .45, 500, 4000, .3, .5)                 # 結ぶ
        m.shimmer(T(1.62), .4, .05, 4)
        m.charge(T(1.80), .2, .14, 400, 1300)
        m.whoosh(T(2.0), .16, 1200, 6000, .45)
        m.shimmer(T(2.14), .1, .05, 5)
        m.whoosh(T(2.22), .07, 3000, 11000, .5)
        m.triplet(self.FIN, .32)
        m.boom(T(self.FIN), .95)
        m.whoosh(T(2.62), .3, 600, 2000, .18)
        m.thump(T(2.94), .35, .12, 210)
        m.chime(T(3.06), [8300, 6500, 6100, 5700], .12, .09)


# =============== 天灯星斬（奥義：夜 → 天灯が昇って星座の剣 → 巨大な星の剣で天から急降下 → 光の雨・灯が 1 つ残る） ===============
class Tentou(Skill):
    name, dur = '天灯星斬', 5.20
    ghost = (200, 215, 255)
    IMP = 3.10
    slow = ((3.025, 3.10, .5),)
    hits = [Hit(3.10, 3, ECX, ECY + 10, 0, 1)]
    STARS = [(ECX, 58), (ECX - 74, 140), (ECX, 140), (ECX + 74, 140), (ECX, 222), (ECX, 300)]
    EDGES = [(0, 2), (1, 2), (2, 3), (2, 4), (4, 5)]

    def dark(self, t):
        return dim(t, .45, 4.35, .6)

    def night(self, t):
        return .9 * ease((t - .65) / .4) * (1 - ease((t - 3.85) / .5))

    def hero(self, t):
        if t < .55:
            return idle(t)
        if t < .95:
            return hero('溜め', HOME_X + 8 * ease((t - .55) / .1))
        if t < 1.25:
            k = (t - .95) / .3
            return hero('振りかぶり', HOME_X + 8 - 60 * k, GROUND - 900 * ein(k) ** .8 - 30 * k, g=1)
        if t < 2.66:
            return hero('振りかぶり', ECX + 50, -500)
        if t < 2.80:                              # 天から降りてきて剣の柄を取る
            k = eout((t - 2.66) / .14)
            return hero('振りかぶり', ECX + 100, -100 + 230 * k, g=1)
        if t < 2.90:
            return hero('振りかぶり', ECX + 100, 130 - 4 * math.sin((t - 2.8) / .1 * math.pi))
        if t < self.IMP:
            k = ein((t - 2.90) / .20)
            return hero('斬り', ECX + 100 + 4 * k, 130 + (GROUND - 130) * k, g=1)
        if t < 3.72:
            return hero('振り抜き', ECX + 100)
        if t < 4.04:
            return backflip(t, 3.72, .32, ECX + 100, HOME_X, 120)
        if t < 4.10:
            return hero('構え2', HOME_X)
        return hero('勝利', HOME_X)

    def sword_dy(self, t):
        if t < 2.88:
            return -18 * ease((t - 2.75) / .13)               # 振り上げの予備動作
        return -18 + (ECY + 70 - 300 + 18) * ein((t - 2.88) / (self.IMP - 2.88))

    def draw(self, c, hh):
        t, F, B = c.t, c.F, c.B
        nt = self.night(t)
        tx, ty = tip(hh)
        rnd = random.Random(5)
        if nt > 0:                                # 夜空の星（またたく）
            B.dirty = True
            for k in range(130):
                x, y = rnd.uniform(0, W), rnd.uniform(0, 370)
                tw = .45 + .55 * math.sin(t * rnd.uniform(3, 9) + k)
                B.ds.rectangle([x - 1, y - 1, x + 1, y + 1], fill=mul(PALE, nt * tw))
                if k % 11 == 0:
                    B.star(x, y, 10, 1, PALE, nt * tw)
        if .55 <= t < .97:
            ground_sigil(B, HOME_X, ease((t - .55) / .25), t, PALE, NIGHT)
            gather(c, tx, ty, .55, .95, seed=6, big=1.1, cols=(GOLD, NIGHT))
            glint(F, tx, ty, t, .84, .13, 48)
        dust(c.FF, HOME_X, GROUND + 4, t - .95, 18, 6, 0, seed=1, size=20)
        if .95 <= t < 1.3:                        # 天へ昇る光の尾
            k = (t - .95) / .35
            F.beam(hh['x'], max(0, hh['f'] - 60), GROUND, 8 * (1 - k), GOLD, 1 - k)
            F.speedlines(hh['x'], max(60, hh['f']), 26, 120, PALE, .7, int(t * 60))
        # 天灯が昇る（6 つは星座の星になる）
        for i in range(16):
            t0 = 1.10 + i * .055
            if t < t0 or t >= self.IMP:
                continue
            k = ease((t - t0) / .8)
            r = random.Random(i)
            if i < 6:
                sx, sy = self.STARS[i]
                x0 = sx + (i - 3) * 36
            else:
                sx, sy, x0 = r.uniform(30, 610), r.uniform(-80, 140), r.uniform(30, 610)
            y = (GROUND + 40) + (sy - GROUND - 40) * k
            x = x0 + (sx - x0) * k + math.sin(t * 2.2 + i) * 9 * (1 - k)
            if i >= 6 or k < 1:
                F.lantern(x, y, (9 if i < 6 else 6) * (1 - .2 * k), math.sin(t * 20 + i), 1 if i < 6 else .6)
            if i < 6 and k >= 1:
                birth = t0 + .8
                if t - birth < .25:
                    star_flash(F, sx, sy, 90 * (1 - (t - birth) / .25), 1 - (t - birth) / .25, 20)
        # 星座を結ぶ
        if 1.95 <= t < self.IMP:
            for i in range(6):
                if t >= 1.10 + i * .055 + .8:
                    sx, sy = self.STARS[i]
                    sy += self.sword_dy(t) if t > 2.75 else 0
                    star_flash(F, sx, sy, 26 + 6 * math.sin(t * 14 + i), 1, 0, PALE, GOLD)
            for e, (a, b) in enumerate(self.EDGES):
                pe = ease((t - 2.05 - e * .06) / .2)
                if pe > 0 and t < 2.62:
                    (ax, ay), (bx, by) = self.STARS[a], self.STARS[b]
                    F.line([(ax, ay), (ax + (bx - ax) * pe, ay + (by - ay) * pe)], PALE, 3, 1 - ease((t - 2.45) / .17))
        # 星座が巨大な星の剣になる
        if 2.42 <= t < self.IMP + .02:
            g = ease((t - 2.42) / .22)
            dy = self.sword_dy(t)
            self.star_sword(F, ECX, 58 + dy, 140 + dy, 300 + dy, g, t)
            if t >= 2.88:
                F.speedlines(ECX, ECY - 100, 34, 150, PALE, .85, int(t * 60))
        if 2.66 <= t < 2.92:
            glint(F, tx, ty, t, 2.80, .1, 54)
        # 着弾：巨大な星の炸裂
        a = t - self.IMP
        if a >= 0:
            ra = c.ra(self.IMP)
            impact(c, ECX, ECY + 10, 1.8, self.IMP, seed=90, cold=True)
            k = clamp(a / .9)
            B.beam(ECX, 0, GROUND + 20, 40 * (1 - k) ** 1.4, GOLD, 1 - k)
            F.beam(ECX, 0, GROUND + 20, 14 * (1 - k) ** 2, PALE, 1 - k)
            if ra < .5:
                F.flare(ECX, ECY + 10, 640, 1 - ra / .5, PALE)
            if a > 0:                             # 止めが明けた瞬間の 2 波目の星（青）
                q = clamp(a / .4)
                star_flash(F, ECX, ECY + 10, 120 + 300 * eout(q * 2), (1 - q) ** 1.5, 45 + a * 60, PALE, NIGHT)
            parts(F, ECX, ECY - 60, a, 60, 22, PALE, 40, 91, 'ember', up=1, star=True, size=(3, 6))   # 剣が星に砕ける
            for j in range(3):
                rr = 60 + 520 * eout((a - j * .08) / .8)
                B.ring(ECX, GROUND + 10, rr, rr * .2, 4, (GOLD, NIGHT, PALE)[j], max(0, 1 - a / 1.0))
            for j in range(5):                    # 地面から立つ光の柱
                bx = ECX + (-180, -95, 95, 180, 0)[j]
                kk = clamp((a - .05 - j * .03) / .5)
                if kk < 1:
                    F.beam(bx, GROUND - 300 * eout(kk / .3), GROUND + 10, 7 * (1 - kk), GOLD if j % 2 else NIGHT, 1 - kk)
        dust(c.FF, ECX, GROUND + 4, a, 26, 9, 0, seed=2, size=26, life=.9)
        if 3.22 <= t < 4.0:                       # 光の雨
            self.rain(c, t)
        dust(c.FF, HOME_X, GROUND + 4, t - 4.04, 14, 4.5, 0, seed=3)
        if 3.95 <= t:                             # 余韻：灯が 1 つだけ残って昇り、星になる
            k = clamp((t - 3.95) / 1.15)
            lx, ly = ECX + 60 + 12 * math.sin(t * 2), GROUND - 30 - 330 * ease(k)
            F.lantern(lx, ly, 12 * (1 - .4 * k), math.sin(t * 20), 1 - ease((k - .85) / .15))
            parts(F, lx, ly + 10, t - 3.95, 14, 1.2, EMBER, 80, 92, 'ember', up=.3)
            if k > .82:
                star_flash(F, lx, ly, 34 * math.sin(clamp((k - .82) / .18) * math.pi), 1, 0, WHITE, GOLD)
        if t >= 4.10:
            glint(F, tx, ty, t, 4.18, .24, 56)
            glint(F, tx, ty, t, 4.80, .2, 40)

    def star_sword(self, F, cx, ytop, yg, ytip, g, t):
        """星の剣：青い刃（白い芯）・金の鍔と柄・刃に沿って星"""
        if g <= 0:
            return
        F.push()
        F.dirty = True
        w = 20 * g
        blade = [(cx - w, yg + 8), (cx + w, yg + 8), (cx + w * .7, ytip - 40), (cx, ytip + 8), (cx - w * .7, ytip - 40)]
        glow = [(cx - w * 2.2, yg), (cx + w * 2.2, yg), (cx + w * 1.4, ytip - 30), (cx, ytip + 40), (cx - w * 1.4, ytip - 30)]
        F.dg.polygon(glow, fill=mul(NIGHT, .9 * g))
        F.ds.polygon(blade, fill=mul(PALE, .75 * g))
        F.ds.polygon([(cx - w * .3, yg + 8), (cx + w * .3, yg + 8), (cx, ytip)], fill=mul(WHITE, g))
        F.ds.rectangle([cx - 80 * g, yg - 5, cx + 80 * g, yg + 7], fill=mul(GOLD, g))
        F.dg.rectangle([cx - 90 * g, yg - 10, cx + 90 * g, yg + 12], fill=mul(EMBER, .6 * g))
        F.ds.rectangle([cx - 7, ytop + 10, cx + 7, yg - 5], fill=mul(GOLD, .85 * g))
        F.push()
        for j, (x, y) in enumerate([(cx, ytop), (cx - 80 * g, yg + 1), (cx + 80 * g, yg + 1)]):
            star_flash(F, x, y, 40 + 8 * math.sin(t * 12 + j), g, 0, WHITE, GOLD)
        for j in range(5):
            y = yg + 30 + (ytip - yg - 50) * j / 4
            star_flash(F, cx, y, 18 + 6 * math.sin(t * 15 + j * 2), g * .9, 45)

    def rain(self, c, t):
        F = c.F
        r = random.Random(42)
        F.push()
        F.dirty = True
        for j in range(70):
            x = r.uniform(10, W - 10)
            t0 = r.uniform(3.22, 3.85)
            sp = r.uniform(900, 1300)
            gy = GROUND + r.uniform(-10, 40)
            col = GOLD if j % 3 else PALE
            a = t - t0
            if a < 0:
                continue
            y = -30 + a * sp
            if y < gy:
                F.ds.line([(x, y - 34), (x, y)], fill=mul(col, .9), width=2)
                F.dg.line([(x, y - 30), (x, y)], fill=mul(col, .4), width=6)
            else:
                ag = (y - gy) / sp
                if ag < .25:
                    kk = 1 - ag / .25
                    F.ds.ellipse([x - 16 * (1 - kk) - 2, gy - 3 * (1 - kk) - 1, x + 16 * (1 - kk) + 2, gy + 3 * (1 - kk) + 1], outline=mul(col, kk), width=1)
                    F.ds.rectangle([x - 1, gy - 6 * kk - 1, x + 1, gy - 1], fill=mul(WHITE, kk))
        F.push()

    def enemy(self, c):
        nt = self.night(c.t)
        return enemy_state(c, self.hits, (255, 220, 130), dis0=4.12, pre_tint=((40, 70, 170), .45 * nt) if nt > .01 else None)

    def ui(self, c, img):
        t = c.t
        if t < .5:
            bubble(img, '天灯星斬！', HOME_X - 150, GROUND - 190, c.rt)
        if t >= self.IMP + .1:
            a = t - self.IMP - .1
            crit(img, EN_X + 20, GROUND - 330, a)
            number(img, 98765, EN_X - 90, GROUND - 282, a - .05, 56, total=True)

    def sfx(self, m):
        T = m.T
        m.wind(T(.45), T(4.6), .05)
        m.charge(T(.55), .4, .22, 200, 800)
        m.shimmer(T(.84), .13, .05, 1)
        m.whoosh(T(.95), .35, 700, 9000, .5)
        m.thump(T(.95), .4, .14, 160)
        for i in range(6):                         # 星が生まれる
            m.ring(T(1.10 + i * .055 + .8), [3500, 4200, 4700, 5300, 6300, 7000][i], .5, .07)
        m.shimmer(T(2.05), .5, .05, 2, 5000, 11000, 18)
        m.band(T(2.42), .3, 2000, 9000, .2, .4, .2, .1)
        m.ring(T(2.62), 2600, .7, .12)
        m.shimmer(T(2.80), .1, .05, 3)
        m.band(T(2.88), m.T(self.IMP) - T(2.88), 7000, 700, .7, .35, .02, .01)     # 天から落ちる
        m.charge(T(2.88), m.T(self.IMP) - T(2.88), .14, 300, 1200)
        m.triplet(self.IMP, .34, 4200, 8000)
        m.boom(T(self.IMP), 1.0)
        m.shimmer(T(self.IMP, .12), .9, .07, 4, 5000, 12000, 30)                  # 光の雨
        m.band(T(3.22), .8, 4500, 1500, .14, .4, .1, .4)
        m.whoosh(T(3.72), .3, 600, 2000, .18)
        m.thump(T(4.04), .35, .12, 210)
        m.chime(T(4.18), [8300, 6500, 6100, 5700], .12, .1)
        m.ring(T(5.0), 7800, .5, .05)


SK = {s.name: s for s in (Koujin(), Torirensan(), Tentou())}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SK):
        render(SK[k])
