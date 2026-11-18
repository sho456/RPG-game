"""セレス HD の技・術の演出デモ（第 1 版）：刻の矢・クロノスロウ・終焉の針。
使い方：python3 skills.py [tokiya|slow|shuuen|all]  → out/<名前>.mp4（音つき）と out/<名前>_sheet.png（コマの一覧）

3 つの技の流れ（どれも 6 段：予告 → 暗転 → 溜め → 放出 → 着弾 → 明け）
  刻の矢    単体・B ランク。宝石のまわりを回る 3 本の「時計の針の矢」→ だんだん速い 3 連射 → 刺さった矢が敵の身の時計の針になって早回し
            → 真っ黒＋白い球 → 時計ごと砕ける（大）
  クロノスロウ  全体・素早さ↓。地面と敵の背後に大時計 → 杖から光 → 時が遅くなる波（画面が紫の単色・スロー・音もゆっくり）
            → 「カチッ」で針が止まり、敵ごとに時計の輪が締まる → 大時計が砕けて欠片が降る
  終焉の針  単体・S ランク。カットイン → 夜空へ → 昇る → 空の大時計に 12 の星が灯り星座の線で結ばれる → 長針が外れて巨大な針に
            → 真っ黒の静寂 → 落ちて貫く（大きなヒットストップ）→ 光の柱・9 連撃 → 星の雨 → 敵が崩れる → 降りて決めポーズ
"""
import math
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fxcore as X  # noqa: E402
from fxcore import (AMBER, CYAN, DEEP, GOLD, VIO, WHITE, RED, blob, burst, clamp, clock, ease, ein, env, eout,  # noqa: E402
                    impact, line, ring, seg, star, taper, oval, poly)

E0, E1, E2 = X.ENEMIES


def lerp(a, b, k):
    return a + (b - a) * k


class Skill:
    T = 4.0
    stops = []
    slows = []
    hits = []        # (τ, 敵の番号, 強さ, 色)
    shakes = []      # (τ, 揺れ px, 秒)
    flashes = []     # (τ, 強さ, 秒) 画面の白飛び
    bubble = ('', 0, 0)

    def __init__(self):
        self.tl = X.Timeline(self.T, self.stops, self.slows)

    # ---- 既定の部品
    def dim(self, t):
        return 1.0

    def background(self, t, fi):
        return X.BG * self.dim(t)

    def ground(self, L, t, fi):
        pass

    def front(self, L, t, fi):
        pass

    def hero(self, t, fi):
        return [('side', X.CEL_X, X.CEL_FOOT, {})]

    def text(self, T, t, fi):
        pass

    def camera(self, t, fi):
        return 1.0, W2, H2

    def post(self, img, t, fi):
        return img

    def screen(self, img, t, fi):
        return img

    def edead(self, i, t):
        return 0.0

    def estate(self, i, t, fi):
        """被弾：白い影 3 コマ・後ろへ飛ばされて戻る・術の色に染まって戻る"""
        dx, white, tk, col = 0.0, 0.0, 0.0, VIO
        for (ht, ei, p, c) in self.hits:
            if ei != i or t < ht:
                continue
            age = self.tl.since(fi, ht)
            if age < 3 / 60:
                white = 1.0
            dx -= 26 * p * eout(age / .05) * (1 - ease(seg(age, .08, .55)))
            k = 1 - seg(age, .1, .9)
            if k > tk:
                tk, col = k * .75, c
        return dict(dx=dx, white=white, tint=col, tk=tk)

    def shake(self, fi, t):
        sx = sy = 0.0
        for (st, amp, dur) in self.shakes:
            if t < st:
                continue
            age = self.tl.since(fi, st)
            if age > dur:
                continue
            k = amp * (1 - age / dur) ** 2
            sx += k * math.sin(age * 97 + st * 13)
            sy += k * math.cos(age * 71 + st * 7) * .7
        return sx, sy

    def flash(self, fi, t):
        a = 0.0
        for (st, amp, dur) in self.flashes:
            if t < st:
                continue
            age = self.tl.since(fi, st)
            a = max(a, amp * (1 - clamp(age / dur)) ** 1.5)
        return a

    # ---- 1 コマ
    def frame(self, fi):
        t = self.tl.taus[fi]
        img = self.background(t, fi).astype(np.float32).copy()
        for e in X.ENEMIES:
            X.shadow(img, e['x'], e['foot'], 70 if e['big'] else 46, .5 * (1 - self.edead(X.ENEMIES.index(e), t)))
        X.shadow(img, X.CEL_X, X.CEL_FOOT, 56, .5)
        Lg = np.zeros((H, W, 3), np.float32)
        self.ground(Lg, t, fi)
        img = self.mono_bg(img, t)
        img = X.light_on(img, Lg)
        order = sorted(range(3), key=lambda i: X.ENEMIES[i]['foot'])
        for i in order:
            d = self.edead(i, t)
            if d >= 1:
                continue
            e = X.ENEMIES[i]
            st = self.estate(i, t, fi)
            kw = dict(white=st['white'], tint=st['tint'], tk=st['tk'], mul=self.emul(t))
            if d > 0:
                sp = X.wraith(e, fi // 6)
                kw['mask'] = X.mosaic_mask(sp, d, seed=i)
                kw['tint'], kw['tk'] = RED, min(1, .4 + d * 3)
            X.enemy_draw(img, e, fi, dx=st['dx'], **kw)
        for (pose, x, foot, kw) in self.hero(t, fi):
            X.cel(img, pose, x, foot, **kw)
        img = self.post(img, t, fi)
        Lf = np.zeros((H, W, 3), np.float32)
        self.front(Lf, t, fi)
        img = X.light_on(img, Lf)
        T = X.Text()
        self.text(T, t, fi)
        img = T.over(img)
        fa = self.flash(fi, t)
        if fa > 0:
            img = img * (1 - fa) + fa
        z, cx, cy = self.camera(t, fi)
        sx, sy = self.shake(fi, t)
        if z != 1.0 or sx or sy:
            M = np.float32([[z, 0, (1 - z) * cx + sx], [0, z, (1 - z) * cy + sy]])
            img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        img = self.screen(img, t, fi)
        return X.to8(img)

    def mono_bg(self, img, t):
        return img

    def emul(self, t):
        return 1.0


W2, H2 = X.W / 2, X.H / 2
W, H = X.W, X.H


def cam_mix(t, keys):
    """keys: [(τ, z, cx, cy)] を滑らかに補間"""
    if t <= keys[0][0]:
        return keys[0][1:]
    for (a, za, xa, ya), (b, zb, xb, yb) in zip(keys, keys[1:]):
        if a <= t < b:
            k = ease((t - a) / (b - a))
            return lerp(za, zb, k), lerp(xa, xb, k), lerp(ya, yb, k)
    return keys[-1][1:]


def after_images(pose, path, t, n=3, gap=.04, col=VIO, a=.4):
    """残像：少し前の位置に紫の影"""
    out = []
    for k in range(n, 0, -1):
        x, f = path(t - gap * k)
        out.append((pose, x, f, dict(tint=col, tk=1.0, alpha=a * (1 - k / (n + 1)))))
    return out


def arrow(L, x, y, ang, ln, a=1.0, glowk=1.0):
    """時計の針の矢：尾の輪・細る金の軸・白い芯・スペードの穂先"""
    c, s = math.cos(ang), math.sin(ang)
    tail = (x - c * ln, y - s * ln)
    tip = (x, y)
    blob(L, x - c * ln * .4, y - s * ln * .4, ln * .35, VIO, .35 * a * glowk)
    taper(L, [tail, tip], 3, 7, GOLD, a)
    taper(L, [tail, tip], 1, 3, WHITE, a)
    ring(L, tail[0], tail[1], 6, 6, 2, GOLD, a)
    hx, hy = x - c * 5, y - s * 5
    poly(L, [(x + c * 20, y + s * 20), (hx - s * 11, hy + c * 11), (x - c * 13, y - s * 13), (hx + s * 11, hy - c * 11)], GOLD, a)
    poly(L, [(x + c * 14, y + s * 14), (hx - s * 5, hy + c * 5), (x - c * 6, y - s * 6), (hx + s * 5, hy - c * 5)], WHITE, a)
    star(L, x + c * 20, y + s * 20, 14, WHITE, .8 * a, rot=ang)


# ================================================================== 刻の矢
class Tokiya(Skill):
    T = 4.7
    APP = [.72, .96, 1.2]
    FIRE = [1.64, 1.82, 1.96]
    FLY = .13
    BIG = 2.72
    stops = [(1.64 + .13, 3), (1.82 + .13, 3), (1.96 + .13, 5), (2.72, 9)]
    shakes = [(1.77, 4, .2), (1.95, 5, .2), (2.09, 7, .25), (2.72, 16, .7)]
    flashes = [(2.72, .85, .22), (2.09, .25, .08)]
    hits = [(1.77, 1, .45, VIO), (1.95, 1, .5, VIO), (2.09, 1, .65, VIO), (2.72, 1, 1.6, VIO)]
    BEND = [-110, 90, -20]

    def target(self):
        x, y = X.ecenter(E1)
        return x + 4, y - 6

    def dim(self, t):
        d = lerp(1, .42, ease(seg(t, .35, .55)))
        d = lerp(d, .26, ease(seg(t, 1.45, 1.6)))
        if 2.55 <= t < self.BIG:
            d = lerp(.26, 0.0, eout(seg(t, 2.55, 2.62)))
        if t >= self.BIG:
            d = lerp(.42, 1, ease(seg(t, 3.05, 3.5)))
        return d

    def emul(self, t):
        if 2.55 <= t < self.BIG:
            return lerp(1, .12, seg(t, 2.55, 2.62))
        return 1.0

    def cx(self, t, fi):
        x = X.CEL_X
        for f in self.FIRE:
            if t >= f:
                x += 9 * math.exp(-(t - f) * 14) * (1 - math.exp(-(t - f) * 80))
        if 2.2 <= t < 3.4:
            x += 18 * ease(seg(t, 2.2, 2.4)) * (1 - ease(seg(t, 3.0, 3.4)))
        return x

    def hero(self, t, fi):
        pose = 'ready' if .45 <= t < 3.45 else 'side'
        x = self.cx(t, fi)
        kw = {}
        if t < .45:
            pass
        sq = []
        if .45 <= t < .52:
            sq = [(pose, x + 3, X.CEL_FOOT, dict(tint=CYAN, tk=.6, alpha=.6))]
        if 2.55 <= t < self.BIG:
            kw = dict(mul=.12)
        return sq + [(pose, x, X.CEL_FOOT, kw)]

    def orb(self, t):
        pose = 'ready' if .45 <= t < 3.45 else 'side'
        return X.orb_pos(pose, self.cx(t, 0), X.CEL_FOOT)

    def arrow_state(self, i, t):
        """i 本目の矢の位置と向き（None は表示しない）"""
        if t < self.APP[i]:
            return None
        ox, oy = self.orb(t)
        tx, ty = self.target()
        aim = math.atan2(ty - oy, tx - ox)
        if t < self.FIRE[i]:
            # 宝石のまわりを回る（だんだん速く）→ 1.45〜1.55 で敵へ向きをそろえる
            spin = 2.2 * (t - .7) + 3.2 * max(0, t - 1.1) ** 2
            th = spin * 2 * math.pi / 2 + i * 2 * math.pi / 3
            r = 66 * eout((t - self.APP[i]) / .15)
            px, py = ox + math.cos(th) * r, oy + math.sin(th) * r * .8
            ang = th + math.pi / 2
            k = ease(seg(t, 1.42, 1.56))
            lx, ly = ox - 30 - abs(i - 1) * 10, oy + (i - 1) * 30
            px, py = lerp(px, lx, k), lerp(py, ly, k)
            ang = lerp(ang, ang + ((aim - ang + math.pi) % (2 * math.pi) - math.pi), k)
            return px, py, ang, 1.0, False
        u = (t - self.FIRE[i]) / self.FLY
        if u < 1:
            p = self.fly_pos(i, u)
            q = self.fly_pos(i, max(0, u - .05))
            return p[0], p[1], math.atan2(p[1] - q[1], p[0] - q[0]), 1.0, False
        # 刺さった矢 → 2.12 から敵の身の時計の針として回る
        p1, p0 = self.fly_pos(i, 1), self.fly_pos(i, .95)
        ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
        if t < 2.12:
            return p1[0], p1[1], ang, 1.0, True
        cx, cy = tx, ty
        k = ease(seg(t, 2.12, 2.24))
        spin = (t - 2.12) * 6 + 18 * max(0, t - 2.24) ** 2
        th = -math.pi / 2 + i * 2 * math.pi / 3 + spin * 2 * math.pi
        hx, hy = cx + math.cos(th) * 70, cy + math.sin(th) * 70
        if t >= self.BIG:
            return None
        return lerp(p1[0], hx, k), lerp(p1[1], hy, k), lerp(ang, th, k), 1.0, True

    def fly_pos(self, i, u):
        ox, oy = X.orb_pos('ready', X.CEL_X, X.CEL_FOOT)
        ox, oy = ox - 30 - abs(i - 1) * 10, oy + (i - 1) * 30
        tx, ty = self.target()
        tx += (i - 1) * 6
        ty += (i - 1) * 18
        u = ein(u, 1.6)
        bx = self.BEND[i]
        x = lerp(ox, tx, u)
        y = lerp(oy, ty, u) + bx * math.sin(u * math.pi)
        return x, y

    def ground(self, L, t, fi):
        if .45 <= t < 3.6:
            k = seg(t, .45, .75)
            a = 1 - seg(t, 3.1, 3.6)
            r = 96 * eout(k)
            clock(L, X.CEL_X, X.CEL_FOOT + 2, r, k, t, GOLD, VIO, .8 * a, ry=r * .24, h1=t * 2, h2=t * 9, w=2)
        # 的：敵の足元の予兆（縮む楕円・中央の白）
        if .6 <= t < self.BIG + .2:
            k = seg(t, .6, .8)
            a = (1 - seg(t, self.BIG, self.BIG + .2))
            r = lerp(150, 92, eout(k)) + 4 * math.sin(t * 20)
            ring(L, E1['x'], E1['foot'] + 2, r, r * .25, 2, CYAN, .9 * a * k)
            ring(L, E1['x'], E1['foot'] + 2, r * .7, r * .7 * .25, 1, VIO, .7 * a * k)
            oval(L, E1['x'], E1['foot'] + 2, 20, 6, WHITE, .5 * a * k)

    def front(self, L, t, fi):
        ox, oy = self.orb(t)
        tx, ty = self.target()
        # 溜め：光の粒が宝石へ（加速）・縮む輪
        if .45 <= t < 1.62:
            rng = np.random.default_rng(1)
            for j in range(46):
                t0 = .45 + rng.random() * 1.0
                dur = .38
                u = (t - t0) / dur
                if 0 <= u < 1:
                    th = rng.uniform(0, 6.28)
                    r0 = rng.uniform(110, 190)
                    r = r0 * (1 - ein(u, 2))
                    r2 = r0 * (1 - ein(max(0, u - .12), 2))
                    c = CYAN if j % 3 else GOLD
                    line(L, (ox + math.cos(th) * r, oy + math.sin(th) * r), (ox + math.cos(th) * r2, oy + math.sin(th) * r2), 2, c, .9)
            for k in range(5):
                t0 = .5 + k * .22
                u = (t - t0) / .26
                if 0 <= u < 1:
                    ring(L, ox, oy, 80 * (1 - eout(u)), 80 * (1 - eout(u)), 2, CYAN, .8 * u)
            pk = seg(t, .45, 1.55)
            blob(L, ox, oy, 8 + 8 * pk, CYAN, .4 + .5 * pk)
            blob(L, ox, oy, 4 + 3 * pk, WHITE, 1.0)
            star(L, ox, oy, 24 + 22 * pk, CYAN, .35 + .3 * pk, rot=t * 2)
        # 矢の出現の閃光
        for i, ta in enumerate(self.APP):
            age = t - ta
            if 0 <= age < .25:
                st = self.arrow_state(i, t)
                if st:
                    star(L, st[0], st[1], 50 * (1 - age / .25), WHITE, 1.2 * (1 - age / .25), sub=GOLD)
        # 矢
        for i in range(3):
            st = self.arrow_state(i, t)
            if not st:
                continue
            x, y, ang, a, stuck = st
            arrow(L, x, y, ang, 60 if not stuck else 52, a)
            # 尾：細る光のリボン＋星
            u = (t - self.FIRE[i]) / self.FLY
            if 0 <= u < 1.6:
                pts = [self.fly_pos(i, clamp(u - k * .045)) for k in range(12)]
                fade = 1 - seg(u, 1, 1.6)
                taper(L, pts, 10, 1, VIO, .9 * fade)
                taper(L, pts, 4, .5, WHITE, .8 * fade)
                for k in range(0, 12, 3):
                    star(L, pts[k][0], pts[k][1] + 6 * math.sin(k + t * 30), 10, GOLD, .7 * fade)
        # 発射：杖の先の閃光と輪
        for f in self.FIRE:
            age = t - f
            if 0 <= age < .25:
                star(L, ox, oy, 70 * (1 - age / .25), WHITE, 1.4 * (1 - age / .25), sub=CYAN)
                ring(L, ox, oy, 20 + 140 * eout(age / .25), 20 + 120 * eout(age / .25), 2, CYAN, 1 - age / .25)
        # 小さな着弾
        for i, f in enumerate(self.FIRE):
            ht = f + self.FLY
            p = self.fly_pos(i, 1)
            impact(L, p[0], p[1], t - ht, .55 + i * .12, 10 + i, VIO, GOLD)
        # 敵の身の時計（刺さった矢が針になる）
        if 2.1 <= t < self.BIG:
            k = seg(t, 2.1, 2.26)
            spin = (t - 2.12) * 6 + 18 * max(0, t - 2.24) ** 2
            clock(L, tx, ty, 86, k, t, GOLD, VIO, 1.0, hands=False, w=2.5)
            blob(L, tx, ty, 30, VIO, .5 * k)
            if t > 2.4:
                ring(L, tx, ty, 92 + 6 * math.sin(t * 60), 92, 3, WHITE, .5 * seg(t, 2.4, 2.55))
        # 真っ黒＋白い球
        if 2.55 <= t < self.BIG:
            k = seg(t, 2.55, self.BIG)
            blob(L, tx, ty, 8 + 22 * ein(k), WHITE, 2.4)
            for j in range(10):
                th = j * .628 + t * 4
                r = 140 * (1 - ein(k))
                line(L, (tx + math.cos(th) * r, ty + math.sin(th) * r), (tx + math.cos(th) * (r + 30), ty + math.sin(th) * (r + 30)), 2, WHITE, .8)
        # 大着弾：時計ごと砕ける・光の柱
        age = t - self.BIG
        if age >= 0:
            impact(L, tx, ty, age, 1.7, 40, VIO, GOLD)
            burst(L, tx, ty, age, 70, 44, sp=520, life=1.5, col=GOLD, kind='shard', grav=380, drag=1.8, size=(3, 7))
            burst(L, tx, ty, age, 50, 45, sp=380, life=1.4, col=VIO, kind='shard', grav=300, drag=1.8, size=(3, 6))
            burst(L, tx, ty, age, 26, 46, sp=260, life=1.6, col=WHITE, kind='star', grav=-30, drag=2.0, size=(2, 5))
            if age < 1.0:
                pw = 150 * eout(age / .08) * (1 - ein(age / 1.0))
                taper(L, [(tx, ty + 120), (tx, -10)], pw, pw * .3, VIO, .8 * (1 - age))
                taper(L, [(tx, ty + 120), (tx, -10)], pw * .4, pw * .1, WHITE, 1.2 * (1 - age))
            for k in range(3):
                a2 = age - k * .07
                if 0 <= a2 < .9:
                    r = 40 + 600 * eout(a2 / .9)
                    ring(L, tx, ty + 40, r, r * .3, 3 - k, GOLD if k % 2 else WHITE, (1 - a2 / .9) * .9)
        # 決め：宝石のきらめき
        g = t - 3.75
        if 0 <= g < .4:
            star(L, ox, oy, 46 * math.sin(g / .4 * math.pi), WHITE, 1.3, rot=g * 3, sub=CYAN)

    def text(self, T, t, fi):
        T.bubble('刻の矢', X.CEL_X - 30, 200, env(t, .05, .8, .01, .12) * min(1, t / .5 + .01) if t < .9 else 0)
        tx, ty = self.target()
        for i, (n, dy) in enumerate(((1287, -60), (1342, -96), (1519, -132))):
            ht = self.FIRE[i] + self.FLY
            T.number(n, tx + 40 + i * 6, ty + dy, self.tl.since(fi, ht) if t >= ht else -1, size=34)
        if t >= self.BIG:
            age = self.tl.since(fi, self.BIG)
            T.label('CRITICAL', tx - 10, ty - 150, age - .05, size=34, col=((255, 255, 255), (255, 120, 60)), life=1.2)
            T.number(9284, tx, ty - 100, age - .1, size=64, crit=True)
            T.label('WEAK', tx - 90, ty - 40, age - .15, size=26, col=((255, 255, 255), (120, 200, 255)), life=1.1)

    def camera(self, t, fi):
        tx, ty = self.target()
        keys = [(0, 1.0, W2, H2), (.45, 1.0, W2, H2), (1.4, 1.07, X.CEL_X - 60, 300), (1.62, 1.07, X.CEL_X - 60, 300),
                (1.8, 1.04, 480, 300), (2.12, 1.06, tx + 80, ty), (2.7, 1.12, tx + 40, ty), (2.72, 1.18, tx, ty),
                (3.3, 1.0, W2, H2)]
        return cam_mix(t, keys)

    def sounds(self, M):
        tl = self.tl
        at = lambda tau: tl.fi_of(tau) / X.FPS  # noqa: E731
        M.add(at(.05), X.s_tick(1900, .2))
        M.add(at(.45), X.s_rise(1.15, 300, 2600, .16))
        M.add(at(.45), X.s_noise(1.2, 1200, 3000, .05, q=3, att=.2, seed=1))
        for i, ta in enumerate(self.APP):
            M.add(at(ta), X.s_ring(3000 + i * 600, .5, .09))
            M.add(at(ta), X.s_tick(2500, .1))
        for i, f in enumerate(self.FIRE):
            M.add(at(f), X.s_noise(.22, 6000, 900, .22, q=1.2, att=.005, seed=10 + i))
            M.add(at(f), X.s_ring(5200 + 400 * i, .2, .06))
            ht = f + self.FLY
            M.add(at(ht), X.s_thump(.55, 160, 45, .28))
            M.add(at(ht), X.s_ring(4000, .2, .07))
            M.add(at(ht) + .06, X.s_ring(7500, .2, .07))
        # 早回しの刻み（だんだん速く）
        tau = 2.14
        k = 0
        while tau < 2.55:
            M.add(at(tau), X.s_tick(3600 + k * 80, .1))
            tau += max(.022, .11 - k * .012)
            k += 1
        M.add(at(2.5), X.s_rise(.2, 1500, 6000, .12, seed=8))
        M.add(at(self.BIG), X.s_boom(.95, 1.6))
        M.add(at(self.BIG), X.s_shatter(.4, 1.2))
        M.add(at(self.BIG), X.s_ring(7900, .5, .09))
        M.add(at(self.BIG) + .12, X.s_ring(4000, .4, .07))
        M.add(at(3.75), X.s_chime(v=.05))


# ================================================================== クロノスロウ
class Slow(Skill):
    T = 4.9
    SLOW0, SLOW1, STOP = 1.72, 2.5, 2.5
    slows = [(1.72, 2.5, .3)]
    stops = [(2.5, 6), (2.57, 3), (2.64, 3)]
    shakes = [(1.72, 5, .3), (2.5, 9, .4), (2.86, 6, .4)]
    flashes = [(1.72, .55, .12), (2.5, .5, .1)]
    hits = [(2.5, 1, .6, VIO), (2.57, 0, .6, VIO), (2.64, 2, .6, VIO)]
    GC = (232, 476)          # 地面の大時計
    VC = (236, 236)          # 敵の背後の大時計

    def dim(self, t):
        return lerp(lerp(1, .55, ease(seg(t, .3, .5))), 1, ease(seg(t, 3.35, 3.8)))

    def estate(self, i, t, fi):
        st = Skill.estate(self, i, t, fi)
        mk = self.mono_k(t) * .55
        if st['tk'] < mk:
            st['tint'], st['tk'] = VIO, mk
        return st

    def mono_k(self, t):
        return ease(seg(t, 1.72, 1.8)) * (1 - ease(seg(t, 2.86, 3.15)))

    def mono_bg(self, img, t):
        k = self.mono_k(t)
        if k <= 0:
            return img
        lum = img @ np.array([.3, .55, .15], np.float32)
        m = lum[..., None] * np.array([.75, .55, 1.25], np.float32) + np.array([.04, .0, .08], np.float32)
        return img * (1 - k) + m * k

    def foot(self, t):
        up = 22 * ease(seg(t, .45, .95)) * (1 - ein(seg(t, 3.2, 3.5), 2))
        return X.CEL_FOOT - up - 3 * math.sin(t * 5) * seg(t, .95, 1.2) * (1 - seg(t, 3.1, 3.2))

    def cx(self, t):
        return X.CEL_X - 12 * eout(seg(t, 1.6, 1.66)) * (1 - ease(seg(t, 1.9, 2.3)))

    def hero(self, t, fi):
        pose = 'ready' if .45 <= t < 3.55 else 'side'
        mk = self.mono_k(t)
        out = []
        if .45 <= t < 1.0 or 1.6 <= t < 1.8:
            out += after_images(pose, lambda tt: (self.cx(tt), self.foot(tt)), t, 3, .05, VIO, .5)
        out.append((pose, self.cx(t), self.foot(t), dict(tint=VIO, tk=.35 * mk)))
        return out

    def hand_angles(self, t):
        """針：速く回る → 時が遅くなる波で減速 → 2.5 でカチッと止まる"""
        def th(tt):
            if tt < 1.72:
                return 9 * (tt - .9)
            if tt < 2.5:
                u = (tt - 1.72) / .78
                return 9 * .82 + 9 * .78 * (u - u * u / 2) * .6
            return th(2.4999)
        a = th(max(.9, t)) * 2 * math.pi
        return a / 12, a

    def ground(self, L, t, fi):
        ox = self.cx(t)
        if .45 <= t < 3.7:
            k = seg(t, .45, .7)
            r = 92 * eout(k)
            clock(L, ox, X.CEL_FOOT + 2, r, k, t, GOLD, VIO, .8 * (1 - seg(t, 3.3, 3.7)), ry=r * .24, h1=t, h2=t * 6)
        gx, gy = self.GC
        h1, h2 = self.hand_angles(t)
        if .6 <= t < 3.4:
            k = seg(t, .6, 1.05)
            a = 1 - seg(t, 2.9, 3.4)
            clock(L, gx, gy, 250 * eout(k), k, t * .5, GOLD, VIO, .9 * a, ry=62 * eout(k), h1=h1, h2=h2, w=3)
            clock(L, gx, gy, 180 * eout(k), k, -t, VIO, DEEP, .6 * a, ry=45 * eout(k), hands=False, stars=0)
        # 敵の背後の大時計（縦）。星が順に灯る
        vx, vy = self.VC
        if .95 <= t < 2.86:
            k = seg(t, .95, 1.4)
            lit = int(clamp((t - 1.1) / .4) * 12)
            clock(L, vx, vy, 178, k, t * .3, GOLD, VIO, .85, h1=h1, h2=h2, lit=lit, w=3)
            blob(L, vx, vy, 120, DEEP, .35 * k)
        # 杖から大時計へ光の筋
        b = t - 1.6
        if 0 <= b < .35:
            ox2, oy2 = X.orb_pos('ready', ox, self.foot(t))
            taper(L, [(ox2, oy2), (vx, vy)], 10, 3, CYAN, 1.2 * (1 - b / .35))
            taper(L, [(ox2, oy2), (vx, vy)], 4, 1, WHITE, 1.4 * (1 - b / .35))

    def front(self, L, t, fi):
        ox, oy = X.orb_pos('ready' if .45 <= t < 3.55 else 'side', self.cx(t), self.foot(t))
        vx, vy = self.VC
        if .45 <= t < 1.62:
            pk = seg(t, .45, 1.55)
            blob(L, ox, oy, 10 + 14 * pk, CYAN, .5 + .7 * pk)
            star(L, ox, oy, 26 + 30 * pk, CYAN, .5 + .4 * pk, rot=-t * 2)
            burst(L, ox, X.CEL_FOOT, (t - .45) % .6, 10, int((t - .45) / .6), sp=60, life=.6, col=GOLD, kind='ember', up=120, drag=1)
        b = t - 1.6
        if 0 <= b < .3:
            star(L, ox, oy, 90 * (1 - b / .3), WHITE, 1.5 * (1 - b / .3), sub=CYAN)
        # 時が遅くなる波（画面を渡る輪 2 重）
        w = t - self.SLOW0
        if 0 <= w < 1.0:
            for k in range(2):
                ww = w - k * .1
                if ww < 0:
                    continue
                r = 1100 * eout(ww / .6, 2)
                ring(L, vx, vy, r, r * .9, 6 - k * 3, WHITE if k == 0 else VIO, (1 - clamp(ww / .6)) * 1.1)
            star(L, vx, vy, 160 * (1 - clamp(w / .3)), WHITE, 1.4 * (1 - clamp(w / .3)), sub=GOLD)
        # 止まった時の中を漂う星の砂
        if self.SLOW0 <= t < 3.2:
            rng = np.random.default_rng(5)
            fa = self.mono_k(t)
            for j in range(70):
                x0, y0 = rng.uniform(0, 620), rng.uniform(60, 540)
                vyy = rng.uniform(8, 26)
                x = x0 + 6 * math.sin(t * .8 + j)
                y = y0 + vyy * (t - 1.72) * 2
                if j % 4 == 0:
                    star(L, x, y, 7, GOLD, .9 * fa)
                else:
                    blob(L, x, y, 1.6, GOLD if j % 2 else VIO, 1.2 * fa)
        # カチッ：敵ごとに時計の輪が締まる
        for (ht, ei, p, c) in self.hits:
            e = X.ENEMIES[ei]
            ex, ey = X.ecenter(e)
            age = t - ht
            if age < 0:
                continue
            sc = 1.0 if e['big'] else .72
            if age < .3:
                r = lerp(170, 72, eout(age / .12)) * sc
                ring(L, ex, ey, r * .55, r, 4, GOLD, 1.3 * (1 - seg(age, .12, .3)))
                ring(L, ex, ey, r * .45, r * .82, 2, WHITE, 1.2 * (1 - seg(age, .1, .3)))
            impact(L, ex, ey, age, .8 * sc, 60 + ei, VIO, GOLD)
            # 残る：遅くなった印（3 つの小さな時計が回る）
            if age > .25:
                fk = seg(age, .25, .45) * (1 - seg(t, 4.4, 4.9))
                for j in range(3):
                    th = j * 2.094 + (t - ht) * 1.2
                    px, py = ex + math.cos(th) * 70 * sc, ey - 20 * sc + math.sin(th) * 22 * sc
                    ring(L, px, py, 9, 9, 2, VIO, .9 * fk)
                    line(L, (px, py), (px, py - 6), 1.5, GOLD, fk)
                    line(L, (px, py), (px + 4, py + 2), 1.5, GOLD, fk)
        # 大時計が砕けて欠片が降る
        s = t - 2.86
        if s >= 0:
            rng = np.random.default_rng(31)
            for j in range(90):
                th = rng.uniform(0, 6.28)
                rr = rng.uniform(.6, 1.05) * 178
                x0, y0 = vx + math.cos(th) * rr, vy + math.sin(th) * rr
                vxx = math.cos(th) * rng.uniform(40, 160)
                vyy = math.sin(th) * rng.uniform(40, 120) - 60
                life = rng.uniform(.9, 1.6)
                if s > life:
                    continue
                x, y = x0 + vxx * s, y0 + vyy * s + 260 * s * s
                rot = rng.uniform(0, 6) + s * rng.uniform(-8, 8)
                sz = rng.uniform(3, 8)
                pts = [(x + math.cos(rot) * sz, y + math.sin(rot) * sz), (x + math.cos(rot + 2.3) * sz * .6, y + math.sin(rot + 2.3) * sz * .6),
                       (x + math.cos(rot + 3.8) * sz * .8, y + math.sin(rot + 3.8) * sz * .8)]
                poly(L, pts, GOLD if j % 3 else VIO, (1 - s / life) * (.6 + .5 * abs(math.sin(rot * 2))))
            star(L, vx, vy, 200 * (1 - clamp(s / .25)), WHITE, 1.2 * (1 - clamp(s / .25)), sub=VIO)
        # 着地の金の輪と砂ぼこり
        g = t - 3.5
        if 0 <= g < .6:
            ring(L, self.cx(t), X.CEL_FOOT, 30 + 90 * eout(g / .5), (30 + 90 * eout(g / .5)) * .22, 2, GOLD, 1 - g / .6)
        g = t - 3.85
        if 0 <= g < .4:
            star(L, ox, oy, 44 * math.sin(g / .4 * math.pi), WHITE, 1.2, sub=CYAN)

    def text(self, T, t, fi):
        T.bubble('クロノスロウ', X.CEL_X - 40, 196, env(t, .05, .8, .01, .12) if t < .9 else 0)
        for j, (ht, ei, p, c) in enumerate(self.hits):
            e = X.ENEMIES[ei]
            ex, ey = X.ecenter(e)
            age = self.tl.since(fi, ht) if t >= ht else -1
            T.number([2310, 1785, 1802][j], ex + 30, ey - (110 if e['big'] else 76), age, size=36)
            if age >= 0:
                T.label('素早さ↓', ex + 30, ey - (70 if e['big'] else 40), age - .12, size=22,
                        col=((240, 230, 255), (170, 110, 255)), path=X.FONT_JA, life=1.4)

    def camera(self, t, fi):
        vx, vy = self.VC
        keys = [(0, 1.0, W2, H2), (.9, 1.0, W2, H2), (1.5, 1.04, 420, 280), (1.72, 1.1, vx + 60, vy + 40),
                (2.5, 1.08, vx + 40, vy + 60), (3.0, 1.0, W2, H2)]
        return cam_mix(t, keys)

    def sounds(self, M):
        tl = self.tl
        at = lambda tau: tl.fi_of(tau) / X.FPS  # noqa: E731
        M.add(at(.05), X.s_tick(1900, .2))
        M.add(at(.45), X.s_noise(1.3, 300, 1200, .07, q=2.5, att=.3, seed=21))
        M.add(at(.6), X.s_rise(1.0, 200, 1600, .12))
        for i in range(12):
            M.add(at(1.1 + i * .4 / 12), X.s_ring(2600 + i * 120, .25, .045))
        # 針の刻み（τ で並べるので、スローの間は音の間隔も伸びる）
        tau, k = .9, 0
        while tau < 2.5:
            M.add(at(tau), X.s_tick(3000, .09))
            if tau < 1.72:
                tau += .09
            else:
                tau += .07 + k * .006
            k += 1
        M.add(at(1.6), X.s_noise(.3, 5000, 1200, .2, q=1.5, att=.003, seed=22))
        M.add(at(1.72), X.s_tone(900, 1.4, .18, 120, dec=.6))          # 時が遅くなる「うねり」
        M.add(at(1.72), X.s_noise(1.6, 2000, 200, .25, q=.8, att=.01, dec=.6, seed=23))
        M.add(at(1.72), X.s_thump(.6, 120, 35, .6))
        M.add(at(2.5), X.s_tick(1200, .5))                              # カチッ
        M.add(at(2.5), X.s_thump(.7, 150, 40, .4))
        for j, (ht, ei, p, c) in enumerate(self.hits):
            M.add(at(ht), X.s_ring(4000 + j * 500, .3, .07))
            M.add(at(ht) + .05, X.s_ring(7500, .2, .05))
        M.add(at(2.86), X.s_shatter(.45, 1.4, 5))
        M.add(at(3.5), X.s_thump(.35, 110, 50, .2))
        M.add(at(3.85), X.s_chime(fs=(3136, 2637, 2349, 1976), v=.05))


# ================================================================== 終焉の針
class Shuuen(Skill):
    T = 7.6
    CUT0, CUT1 = .15, 1.32
    SC = (300, 146)
    R = 118
    DROP0, HIT = 3.62, 3.72
    MULTI = [3.9 + k * .068 for k in range(9)]
    stops = [(3.72, 11)] + [(3.9 + k * .068, 2) for k in range(9)] + [(4.55, 5)]
    shakes = [(3.72, 20, .9), (4.55, 10, .5)] + [(3.9 + k * .068, 3, .1) for k in range(9)]
    flashes = [(3.72, 1.0, .25), (CUT1 - .04, .9, .2), (4.55, .4, .12), (.4, .5, .1)]
    hits = [(3.72, 1, 1.8, GOLD)] + [(3.9 + k * .068, 1, .3, VIO) for k in range(9)] + [(4.55, 1, 1.0, GOLD)]

    def background(self, t, fi):
        if t < self.CUT1:
            k = 1 - .65 * ease(seg(t, .1, .3))
            return X.BG * k
        k = ease(seg(t, 6.2, 6.8))
        img = X.NIGHT * (1 - k) + X.BG * k
        if 3.5 <= t < self.HIT:
            img = img * (1 - eout(seg(t, 3.5, 3.56)))
        return img

    def emul(self, t):
        if 3.5 <= t < self.HIT:
            return lerp(1, .06, seg(t, 3.5, 3.56))
        return 1.0

    def edead(self, i, t):
        if i != 1:
            return 0.0
        return seg(t, 5.0, 5.45)

    def foot(self, t):
        up = 78 * eout(seg(t, 1.35, 2.2)) * (1 - ease(seg(t, 5.35, 6.1)))
        return X.CEL_FOOT - up - 4 * math.sin(t * 4) * seg(t, 2.2, 2.5) * (1 - seg(t, 5.2, 5.4))

    def hero(self, t, fi):
        if t >= 6.2:
            return [('front', X.CEL_X, X.CEL_FOOT, {})]
        pose = 'ready'
        out = []
        f = self.foot(t)
        if 1.35 <= t < 2.3 or 5.35 <= t < 6.1:
            out += after_images(pose, lambda tt: (X.CEL_X, self.foot(tt)), t, 4, .045, GOLD, .45)
        kw = {}
        if 3.5 <= t < self.HIT:
            kw = dict(mul=lerp(1, .06, seg(t, 3.5, 3.56)))
        sq = []
        g = t - 6.1
        if 0 <= g < .1:
            f += 4 * math.sin(g / .1 * math.pi)
        out.append((pose, X.CEL_X, f, kw))
        return out + sq

    def needle(self, t):
        """長針：時計の針 → 外れて巨大化し、敵の真上で下を向く → 落ちる"""
        cx, cy = self.SC
        tx, ty = X.ecenter(E1)
        if t < 3.0:
            return None
        if t < 3.5:
            k = ease(seg(t, 3.0, 3.45))
            base = (lerp(cx, tx, k), lerp(cy, 60, k))
            ang = lerp(-math.pi / 2 + 2.6, math.pi / 2, k)
            ln = lerp(self.R * .82, 230, eout(k))
            return base, ang, ln
        if t < self.DROP0:
            return (tx, 60), math.pi / 2, 230
        u = clamp((t - self.DROP0) / (self.HIT - self.DROP0))
        y = lerp(60, ty - 230 + 40, ein(u, 2))
        return (tx, y), math.pi / 2, 230

    def draw_needle(self, L, t, a=1.0):
        st = self.needle(t)
        if not st:
            return
        (bx, by), ang, ln = st
        c, s = math.cos(ang), math.sin(ang)
        tip = (bx + c * ln, by + s * ln)
        tail = (bx - c * ln * .18, by - s * ln * .18)
        dark = 3.5 <= t < self.HIT
        blob(L, (bx + tip[0]) / 2, (by + tip[1]) / 2, ln * .3, GOLD if not dark else WHITE, .35 * a)
        taper(L, [tail, tip], 26, 2, GOLD if not dark else WHITE, a * 1.1)
        taper(L, [tail, tip], 10, 1, WHITE, a * 1.4)
        ring(L, tail[0], tail[1], 16, 16, 4, GOLD if not dark else WHITE, a)
        star(L, tip[0], tip[1], 40 + 10 * math.sin(t * 40), WHITE, a * 1.2, sub=GOLD)
        if self.DROP0 <= t < self.HIT:
            for k in range(1, 5):
                taper(L, [tail, tip], 20, 2, WHITE, .25 * a, ) if False else None
                off = k * 34
                taper(L, [(tail[0], tail[1] - off), (tip[0], tip[1] - off)], 20, 2, GOLD, .3 * a / k)

    def star_pos(self, i):
        cx, cy = self.SC
        th = -math.pi / 2 + i / 12 * 2 * math.pi
        return cx + math.cos(th) * self.R * .97, cy + math.sin(th) * self.R * .97

    def star_t(self, i):
        return 2.1 + .85 * (1 - (1 - (i + 1) / 12) ** 1.5) - .05

    def ground(self, L, t, fi):
        if t < self.CUT1:
            return
        tx = E1['x']
        f = self.foot(t)
        # 足元の金の陣（宙に浮いても地面に残る）
        if self.CUT1 <= t < 6.6:
            k = seg(t, 1.32, 1.6)
            r = 104 * eout(k)
            clock(L, X.CEL_X, X.CEL_FOOT + 2, r, k, t, GOLD, AMBER, .9 * (1 - seg(t, 6.2, 6.6)), ry=r * .24, h1=t * 1.5, h2=t * 8)
        # 地面のひび（着弾から光る）
        g = t - self.HIT
        if g >= 0:
            rng = np.random.default_rng(77)
            a = 1 - seg(g, 1.2, 2.2)
            for j in range(14):
                th = rng.uniform(0, 6.28)
                x, y = tx, E1['foot'] + 4
                pts = [(x, y)]
                ln = rng.uniform(90, 260) * eout(g / .15)
                for k in range(6):
                    th += rng.uniform(-.5, .5)
                    x += math.cos(th) * ln / 6
                    y += math.sin(th) * ln / 6 * .26
                    pts.append((x, y))
                taper(L, pts, 5, 1, GOLD if j % 2 else VIO, a * 1.1)
            oval(L, tx, E1['foot'] + 4, 140, 30, AMBER, .5 * a)

    def front(self, L, t, fi):
        if t < self.CUT1:
            return
        cx, cy = self.SC
        tx, ty = X.ecenter(E1)
        f = self.foot(t)
        ox, oy = X.orb_pos('ready', X.CEL_X, f)
        # まとい：昇る金の粒・体に巻き付く 2 本の光
        if self.CUT1 <= t < 5.4:
            a = (1 - seg(t, 5.0, 5.4)) * (0.15 if 3.5 <= t < self.HIT else 1)
            for k in range(int((t - 1.32) / .5) - 1, int((t - 1.32) / .5) + 1):
                if k >= 0:
                    burst(L, X.CEL_X, f - 20, t - 1.32 - k * .5, 14, 100 + k, sp=70, life=1.0, col=GOLD, kind='ember', up=160, drag=1.2, a=a, size=(1.2, 2.6))
            for hh in range(2):
                pts = []
                for j in range(26):
                    u = j / 25
                    th = u * 3 * math.pi + t * 7 + hh * math.pi
                    pts.append((X.CEL_X + math.cos(th) * 52, f - u * 220 + math.sin(th) * 10))
                taper(L, pts, 1, 4, GOLD, .32 * a)
        # 空の大時計
        if 1.55 <= t < 4.75:
            k = seg(t, 1.55, 2.05)
            lit = sum(1 for i in range(12) if t >= self.star_t(i))
            a = 1 - seg(t, 4.55, 4.75)
            dark = 3.5 <= t < self.HIT
            if not dark:
                blob(L, cx, cy, 120, DEEP, .45 * k * a)
                clock(L, cx, cy, self.R, k, t * .4, GOLD, VIO, a, h1=t * .3, h2=(2.6 + 0 * t) if t < 3.0 else 0,
                      lit=lit, w=3, hands=t < 3.0)
                if t >= 3.0:
                    clock(L, cx, cy, self.R, 1, t * .4, GOLD, VIO, 0, hands=True, h1=t * .3, h2=0)
                    taper(L, [(cx, cy), (cx + math.cos(t * .3 - math.pi / 2) * self.R * .6, cy + math.sin(t * .3 - math.pi / 2) * self.R * .6)], 5, 1, WHITE, .9 * a)
                # 星座の線：灯った星を順に結ぶ
                for i in range(12):
                    st0 = self.star_t(i)
                    if t < st0:
                        continue
                    ag = t - st0
                    sx, sy = self.star_pos(i)
                    star(L, sx, sy, 34 * (1 - clamp(ag / .2)) + 10, WHITE, (1.4 - clamp(ag / .2) * .6) * a, sub=GOLD)
                    j = (i + 5) % 12
                    if i >= 1:
                        px, py = self.star_pos((i * 5) % 12)
                        qx, qy = self.star_pos(((i - 1) * 5) % 12)
                        kk = clamp(ag / .15)
                        line(L, (qx, qy), (lerp(qx, px, kk), lerp(qy, py, kk)), 2, CYAN, .8 * a)
            if 2.1 <= t < 3.0:
                star(L, cx, cy, 30 + 20 * seg(t, 2.1, 3.0), WHITE, .9, rot=t)
        # 針に集まる光（3.0〜3.5）
        if 3.0 <= t < 3.5:
            st = self.needle(t)
            (bx, by), ang, ln = st
            tipx, tipy = bx + math.cos(ang) * ln, by + math.sin(ang) * ln
            rng = np.random.default_rng(9)
            for j in range(50):
                t0 = 3.0 + rng.random() * .4
                u = (t - t0) / .25
                if 0 <= u < 1:
                    th = rng.uniform(0, 6.28)
                    r0 = rng.uniform(120, 260)
                    r = r0 * (1 - ein(u, 2))
                    r2 = r0 * (1 - ein(max(0, u - .15), 2))
                    line(L, (tipx + math.cos(th) * r, tipy + math.sin(th) * r), (tipx + math.cos(th) * r2, tipy + math.sin(th) * r2), 2, GOLD if j % 2 else WHITE, 1)
        # 静寂：真っ黒＋敵の位置に白い球
        if 3.5 <= t < self.HIT:
            blob(L, tx, ty, 6 + 14 * seg(t, 3.5, 3.7), WHITE, 2.5)
        if 3.0 <= t < self.HIT:
            self.draw_needle(L, t)
        # 落ちる針の集中線（画面を縦に走る）
        if self.DROP0 <= t < self.HIT + .05:
            rng = np.random.default_rng(int(t * 120))
            for j in range(26):
                x = rng.uniform(0, 960)
                y = rng.uniform(-100, 500)
                line(L, (x, y), (x, y + rng.uniform(80, 240)), 1.5, WHITE, .5)
        # 大着弾
        g = t - self.HIT
        if g >= 0:
            impact(L, tx, ty, g, 2.3, 80, VIO, GOLD)
            burst(L, tx, ty, g, 110, 81, sp=900, life=1.0, col=GOLD, kind='spark', grav=600, lenk=.05, size=(2, 4))
            burst(L, tx, ty, g, 90, 82, sp=560, life=1.8, col=WHITE, kind='shard', grav=420, drag=1.6, size=(3, 8))
            burst(L, tx, ty, g, 60, 83, sp=420, life=2.0, col=VIO, kind='shard', grav=320, drag=1.6, size=(3, 7))
            burst(L, tx, ty, g, 40, 84, sp=300, life=2.2, col=GOLD, kind='star', grav=-40, drag=1.5, size=(2, 6))
            # 放射の光（ゆっくり回る）
            if g < 1.0:
                ra = (1 - ein(g / 1.0)) * eout(g / .06)
                for j in range(12):
                    th = j * .5236 + g * .8
                    taper(L, [(tx, ty), (tx + math.cos(th) * 700, ty + math.sin(th) * 700)], 26, 2, GOLD if j % 2 else VIO, .5 * ra)
            # 光の柱
            if g < .9:
                pw = 190 * eout(g / .07) * (1 - ein(g / .9, 2))
                taper(L, [(tx, E1['foot'] + 20), (tx, -20)], pw, pw * .5, GOLD, .6 * (1 - g / .9))
                taper(L, [(tx, E1['foot'] + 20), (tx, -20)], pw * .4, pw * .2, WHITE, 1.1 * (1 - g / .9) ** 2)
                burst(L, tx, E1['foot'], g, 40, 85, sp=60, life=1.3, col=WHITE, kind='ember', up=500, drag=.5, size=(1.5, 3))
            for k in range(4):
                a2 = g - k * .08
                if 0 <= a2 < 1.1:
                    r = 50 + 760 * eout(a2 / 1.1)
                    ring(L, tx, E1['foot'] - 20, r, r * .32, 4 - k, WHITE if k % 2 == 0 else GOLD, (1 - a2 / 1.1))
            # 刺さった針（すぐに光にほどける）
            if g < .5:
                taper(L, [(tx, ty - 210), (tx, ty + 40)], 26 * (1 - g / .5), 2, WHITE, 1.4 * (1 - g / .5))
        # 連撃
        for k, mt in enumerate(self.MULTI):
            rng = np.random.default_rng(200 + k)
            impact(L, tx + rng.uniform(-50, 50), ty + rng.uniform(-60, 50), t - mt, .55, 300 + k, VIO if k % 2 else GOLD, WHITE)
        # 締め
        g2 = t - 4.55
        if g2 >= 0:
            impact(L, tx, ty, g2, 1.4, 400, GOLD, VIO)
        # 時計が砕けて星の雨
        s = t - 4.6
        if s >= 0:
            burst(L, cx, cy, s, 80, 500, sp=300, life=1.6, col=GOLD, kind='shard', grav=320, drag=1.5, size=(3, 7))
            rng = np.random.default_rng(600)
            for j in range(40):
                t0 = rng.uniform(0, 1.0)
                u = s - t0
                if 0 <= u < .7:
                    x0 = rng.uniform(-100, 760)
                    x, y = x0 + 500 * u, -30 + 900 * u
                    taper(L, [(x - 60, y - 110), (x, y)], 1, 3, GOLD if j % 3 else CYAN, 1 - u / .7)
                    blob(L, x, y, 3, WHITE, 1.4 * (1 - u / .7))
        # 敵の崩れ（赤い光の粒が昇る）
        d = t - 5.0
        if 0 <= d < 1.2:
            burst(L, tx, ty, d, 50, 700, sp=120, life=1.1, col=RED, kind='ember', up=200, drag=1.2, size=(1.5, 3.5))
        # 着地と決め
        g = t - 6.1
        if 0 <= g < .7:
            ring(L, X.CEL_X, X.CEL_FOOT, 30 + 130 * eout(g / .6), (30 + 130 * eout(g / .6)) * .22, 3, GOLD, 1 - g / .7)
            burst(L, X.CEL_X, X.CEL_FOOT, g, 30, 900, sp=240, life=.6, col=GOLD, kind='ember', a0=180, a1=360, sq=.25, drag=4)
        g = t - 6.35
        if 0 <= g < .6:
            fx, fy = X.orb_pos('front', X.CEL_X, X.CEL_FOOT)
            star(L, fx, fy, 70 * math.sin(g / .6 * math.pi), WHITE, 1.5, rot=g * 2, sub=CYAN)
            for j in range(5):
                th = j * 1.2566 + g * 3
                star(L, X.CEL_X + math.cos(th) * 70 * eout(g / .4), X.CEL_FOOT - 110 + math.sin(th) * 90 * eout(g / .4), 14, GOLD, 1 - g / .6)

    def text(self, T, t, fi):
        tx, ty = X.ecenter(E1)
        if t >= self.HIT:
            for k, mt in enumerate(self.MULTI):
                age = self.tl.since(fi, mt) if t >= mt else -1
                rng = np.random.default_rng(200 + k)
                T.number(int(rng.integers(2400, 3900)), tx + 120 + (k % 2) * 46, ty + 40 - k * 24, age, size=28, life=.7)
        if t >= 4.55:
            age = self.tl.since(fi, 4.55)
            T.label('CRITICAL!!', tx - 50, ty - 230, age, size=44, col=((255, 255, 240), (255, 110, 50)), life=1.5)
            T.number(48620, tx - 50, ty - 165, age - .06, size=84, crit=True)
            T.label('WEAK', tx - 170, ty - 110, age - .1, size=28, col=((255, 255, 255), (120, 200, 255)), life=1.4)

    def camera(self, t, fi):
        tx, ty = X.ecenter(E1)
        cx, cy = self.SC
        keys = [(0, 1.0, W2, H2), (1.32, 1.0, W2, H2), (1.35, 1.08, X.CEL_X - 100, 330), (2.2, 1.05, 600, 260),
                (2.6, 1.1, cx + 120, cy + 60), (3.4, 1.12, tx + 80, 200), (3.62, 1.16, tx + 60, ty - 40),
                (3.72, 1.25, tx, ty), (4.4, 1.08, tx + 80, ty - 40), (4.6, 1.14, tx + 40, ty - 60), (5.4, 1.0, W2, H2),
                (6.0, 1.0, W2, H2), (6.4, 1.12, X.CEL_X - 120, 330), (7.6, 1.12, X.CEL_X - 120, 330)]
        z, x, y = cam_mix(t, keys)
        # 溜めのうなり（小さな揺れ）
        if 3.0 <= t < 3.5:
            k = seg(t, 3.0, 3.5) * 3
            x += k * math.sin(fi * 2.1)
            y += k * math.cos(fi * 1.7)
        return z, x, y

    def screen(self, img, t, fi):
        """カットイン（画面に固定）"""
        if not (self.CUT0 <= t < self.CUT1):
            return img
        u = t - self.CUT0
        dur = self.CUT1 - self.CUT0
        kin = eout(u / .16)
        kout = ein(seg(u, dur - .16, dur))
        off = (1 - kin) * W * 1.1 - kout * W * 1.2
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        y0, y1 = 150, 390
        sl = (xx - W2) * .18
        band = ((yy > y0 - sl) & (yy < y1 - sl)).astype(np.float32)
        band = np.roll(band, int(off), axis=1)
        if off > 0:
            band[:, :int(off)] = 0
        elif off < 0:
            band[:, int(W + off):] = 0
        g = np.clip((yy - (y0 - sl)) / (y1 - y0), 0, 1)[..., None]
        bc = np.array([.10, .03, .22]) * (1 - g) + np.array([.30, .10, .50]) * g
        # 流れる線
        lines_ = ((np.sin(yy * 1.7) > .97) * ((xx * .9 + u * 3000 + yy * 37) % 400 < 140)).astype(np.float32)[..., None]
        bc = bc + lines_ * .35
        L = np.zeros((H, W, 3), np.float32)
        # 顔の大写し（ドット絵を 5 倍）
        face = X.CEL_N['front'].crop((14, 4, 64, 54)).resize((250, 250), resample=0)
        fa = np.asarray(face).astype(np.float32) / 255
        lay = np.zeros((H, W, 4), np.float32)
        px = int(640 - u * 40 + off)
        py = 140
        x0, x1 = max(0, px), min(W, px + 250)
        if x1 > x0:
            lay[py:py + 250, x0:x1] = fa[:, x0 - px:x1 - px]
        bandm = band[..., None]
        out = img * (1 - bandm) + bc * bandm
        a = lay[..., 3:4] * bandm
        out = out * (1 - a) + lay[..., :3] * a
        # 縁の金の線
        edge = (np.abs(yy - (y0 - sl)) < 2.5) | (np.abs(yy - (y1 - sl)) < 2.5)
        edge = np.roll(edge.astype(np.float32), int(off), axis=1)
        if off > 0:
            edge[:, :int(off)] = 0
        elif off < 0:
            edge[:, int(W + off):] = 0
        L += edge[..., None] * GOLD * 1.2
        sk = u - .3
        if sk >= 0:
            star(L, 280 + off, 270, 260 * (1 - clamp(sk / .25)), WHITE, 1.4 * (1 - clamp(sk / .25)), sub=GOLD)
        out = X.light_on(out, L, .6, .6)
        T = X.Text()
        if sk >= 0:
            sc = 1 + .8 * (1 - eout(sk / .1))
            T.metal('終焉の針', 300 + off, 262, 92 * sc, 1 - kout, (255, 250, 220), (255, 170, 40), (40, 10, 60), 6, path=X.FONT_JA)
            T.metal('— END OF HOURS —', 300 + off + 30, 335, 22, clamp(sk / .2) * (1 - kout), (255, 255, 255), (200, 170, 255), (30, 10, 50), 3)
        out = T.over(out)
        return out

    def sounds(self, M):
        tl = self.tl
        at = lambda tau: tl.fi_of(tau) / X.FPS  # noqa: E731
        M.add(at(.15), X.s_noise(.35, 600, 6000, .3, q=1, att=.01, seed=40))
        M.add(at(.45), X.s_boom(.6, .9, 41))
        M.add(at(.45), X.s_ring(5200, .5, .08))
        M.add(at(.5), X.s_chime(fs=(2093, 2637, 3136, 4186), gap=.06, v=.05))
        M.add(at(1.2), X.s_noise(.3, 6000, 500, .3, q=1, att=.01, seed=42))
        M.add(at(1.35), X.s_rise(1.0, 150, 1200, .16, 43))
        M.add(at(1.6), X.s_noise(1.6, 300, 900, .06, q=3, att=.4, seed=44))
        for i in range(12):
            M.add(at(self.star_t(i)), X.s_ring(2093 * 2 ** (i / 12 * 1.0), .35, .06))
            M.add(at(self.star_t(i)), X.s_tick(3000, .07))
        M.add(at(3.0), X.s_rise(.5, 80, 900, .3, 45))
        M.add(at(3.0), X.s_tone(55, .55, .35, 70, dec=99))
        M.add(at(self.DROP0), X.s_tone(4000, .12, .2, 400, dec=.1))
        M.add(at(self.DROP0), X.s_noise(.12, 8000, 1500, .3, q=1, att=.005, seed=46))
        M.add(at(self.HIT), X.s_boom(1.0, 2.2, 47))
        M.add(at(self.HIT), X.s_shatter(.5, 1.4, 48))
        M.add(at(self.HIT), X.s_ring(7900, .6, .1))
        M.add(at(self.HIT) + .15, X.s_ring(4000, .5, .08))
        for k, mt in enumerate(self.MULTI):
            M.add(at(mt), X.s_ring(4000 + (k % 3) * 900, .18, .06))
            M.add(at(mt), X.s_thump(.35, 170, 60, .15))
        M.add(at(4.55), X.s_boom(.7, 1.2, 49))
        M.add(at(4.55), X.s_ring(7500, .5, .09))
        M.add(at(4.6), X.s_shatter(.4, 1.6, 50))
        for j in range(8):
            M.add(at(4.7 + j * .11), X.s_ring(5000 - j * 300, .4, .03))
        M.add(at(5.0), X.s_noise(.6, 3000, 300, .15, q=1, att=.01, seed=51))
        M.add(at(6.1), X.s_thump(.4, 110, 45, .25))
        M.add(at(6.35), X.s_chime(fs=(4186, 3520, 3136, 2637, 4186 * 2), gap=.08, v=.06))


SK = {'tokiya': Tokiya, 'slow': Slow, 'shuuen': Shuuen}

if __name__ == '__main__':
    names = sys.argv[1:] or ['all']
    if names == ['all']:
        names = list(SK)
    outs = []
    for n in names:
        sk = SK[n]()
        print(n, sk.tl.n, 'コマ', f'{sk.tl.n / X.FPS:.2f} 秒', flush=True)
        outs.append(X.render(sk, 'celes_hd_' + n))
    if len(outs) == 3:
        lst = os.path.join(X.OUT, 'list.txt')
        with open(lst, 'w') as f:
            for o in outs:
                f.write(f"file '{o}'\n")
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy',
                        os.path.join(X.OUT, 'celes_hd_demo.mp4')])
