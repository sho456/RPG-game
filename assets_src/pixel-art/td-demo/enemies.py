"""===== TD デモの敵 3 種のドット絵（時を喰うもの：時計虫・亡霊・歯車の巨像） =====
tdcore が使う約束：
  SIZE[kind] = (w, h)  … sprite() が返す絵の大きさ（拡大後の px）
  sprite(kind, anim, t, seed, scale=2) → float32 RGBA (h, w, 4)、0〜1。足元が最下行・左右中央。右向き。
描き方：小さな原寸の上に部品（楕円・カプセル・多角形）を奥から手前へ重ね、
  部品ごとに「左上の光」の縁取りで陰影の段を決め、手前の部品のまわりに素材のいちばん暗い色の線を引く。
  外の輪郭は純黒。最後に最近傍で scale 倍。コマは (種類, 動き, コマ, 色の型, scale) でキャッシュする。
"""
import math
import numpy as np
from PIL import Image, ImageDraw

# ---------------------------------------------------------------- 色（暗→明。色相をずらした段）
RAMP = {
    # 時計虫の甲殻：鈍い鋼の青緑
    'shell': [(14, 18, 32), (26, 38, 58), (40, 62, 82), (62, 92, 106), (104, 134, 138)],
    'iron':  [(10, 10, 20), (22, 24, 40), (36, 40, 60), (56, 62, 82), (86, 92, 110)],
    # くすんだ真鍮（ゼンマイ・歯車）
    'brass': [(34, 22, 20), (72, 50, 34), (116, 86, 48), (160, 126, 66), (206, 176, 104)],
    # 亡霊の衣：青みの灰〜墨
    'robe':  [(12, 12, 26), (24, 28, 48), (40, 48, 70), (62, 74, 94), (98, 112, 126)],
    'robe2': [(8, 8, 18), (16, 18, 34), (28, 32, 52), (44, 50, 70), (64, 72, 92)],
    'bone':  [(40, 38, 50), (84, 86, 96), (130, 134, 138), (178, 182, 176), (220, 222, 208)],
    # 巨像の石鉄：紺鼠
    'stone': [(14, 14, 26), (28, 30, 48), (44, 50, 70), (66, 74, 94), (98, 106, 122)],
    'stone2': [(10, 10, 20), (20, 22, 36), (32, 36, 54), (48, 54, 74), (70, 76, 96)],
    'core':  [(52, 10, 84), (106, 30, 156), (164, 70, 222), (220, 140, 255), (252, 226, 255)],
    'void':  [(4, 3, 10), (8, 6, 18), (14, 10, 28), (20, 16, 38), (28, 22, 50)],
    'amber': [(120, 30, 20), (200, 70, 36), (255, 140, 60), (255, 206, 120), (255, 244, 210)],
    'cyan':  [(20, 60, 90), (40, 130, 170), (90, 210, 230), (180, 250, 255), (240, 255, 255)],
}
BLACK = (0, 0, 0)


def _shift(ramp, v):
    """個体の色の型：0 そのまま・1 少し緑寄り・2 少し紫寄り"""
    if v == 0:
        return ramp
    m = {1: (.92, 1.06, .98), 2: (1.08, .94, 1.08)}[v]
    return [tuple(int(min(255, c * k)) for c, k in zip(col, m)) for col in ramp]


# ---------------------------------------------------------------- 原寸の画家
class P:
    def __init__(self, w, h, var=0):
        self.w, self.h, self.var = w, h, var
        self.yy, self.xx = np.mgrid[0:h, 0:w].astype(np.float32)
        self.mat = np.full((h, w), -1, np.int16)
        self.lvl = np.zeros((h, w), np.int8)
        self.alpha = np.ones((h, w), np.float32)
        self.mats = []

    def _mid(self, name):
        if name not in self.mats:
            self.mats.append(name)
        return self.mats.index(name)

    # 形
    def ell(self, cx, cy, rx, ry):
        return ((self.xx - cx) / rx) ** 2 + ((self.yy - cy) / ry) ** 2 <= 1.0

    def cap(self, x0, y0, x1, y1, r):
        dx, dy = x1 - x0, y1 - y0
        L2 = dx * dx + dy * dy or 1e-6
        u = np.clip(((self.xx - x0) * dx + (self.yy - y0) * dy) / L2, 0, 1)
        return (self.xx - x0 - u * dx) ** 2 + (self.yy - y0 - u * dy) ** 2 <= r * r

    def poly(self, pts):
        im = Image.new('L', (self.w, self.h), 0)
        ImageDraw.Draw(im).polygon([(float(x), float(y)) for x, y in pts], fill=1)
        return np.asarray(im).astype(bool)

    def line(self, pts):
        im = Image.new('L', (self.w, self.h), 0)
        ImageDraw.Draw(im).line([(float(x), float(y)) for x, y in pts], fill=1, width=1)
        return np.asarray(im).astype(bool)

    # 塗り
    def fill(self, m, mat, base=2, grad=1.0, rim=True, edge=True, alpha=1.0):
        """m の形を mat で塗る。base: 中の段、grad: 下へ向かって暗く。rim: 左上を明るく右下を暗く。
        edge: 先にあった部品との境目に、奥の部品のいちばん暗い色の線を引く"""
        m = m & True
        if not m.any():
            return m
        if edge:
            d = _dil(m) & ~m & (self.mat >= 0)
            self.lvl[d] = 0
        def out(dx, dy):
            s = np.zeros_like(m)
            ys = slice(max(0, dy), self.h + min(0, dy))
            yd = slice(max(0, -dy), self.h + min(0, -dy))
            xs = slice(max(0, dx), self.w + min(0, dx))
            xd = slice(max(0, -dx), self.w + min(0, -dx))
            s[yd, xd] = m[ys, xs]
            return ~s
        ys = np.where(m.any(1))[0]
        ny = (self.yy - ys[0]) / max(1, ys[-1] - ys[0])
        sc = base - grad * (ny - .35)
        if rim:
            sc = sc + 1.0 * out(0, -1) + .6 * out(-1, 0) - 1.0 * out(0, 1) - .7 * out(1, 0) - .5 * out(1, 1)
        lv = np.clip(np.round(sc), 1, 4).astype(np.int8)
        self.mat[m] = self._mid(mat)
        self.lvl[m] = lv[m]
        self.alpha[m] = alpha
        return m

    def px(self, x, y, mat, lv):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.mat[y, x] = self._mid(mat)
            self.lvl[y, x] = lv
            self.alpha[y, x] = 1.0

    def set(self, m, mat, lv):
        self.mat[m] = self._mid(mat)
        self.lvl[m] = lv
        self.alpha[m] = 1.0

    def render(self, glow=None):
        m = self.mat >= 0
        out = np.zeros((self.h, self.w, 4), np.float32)
        for i, name in enumerate(self.mats):
            ramp = np.array(_shift(RAMP[name], self.var) if name in ('shell', 'robe', 'stone') else RAMP[name], np.float32) / 255
            s = self.mat == i
            out[s, :3] = ramp[self.lvl[s]]
        out[m, 3] = self.alpha[m]
        ring = _dil(m) & ~m
        out[ring] = (0, 0, 0, 1)
        if glow is not None:                        # 光る差し色のにじみ（輪郭の外に半透明の 1 ドット）
            gm, col, a = glow
            g = _dil(gm) & ~m & ~ring
            out[g, :3] = col
            out[g, 3] = a
        return out


def _dil(m):
    d = m.copy()
    d[1:] |= m[:-1]
    d[:-1] |= m[1:]
    d[:, 1:] |= m[:, :-1]
    d[:, :-1] |= m[:, 1:]
    return d


# ---------------------------------------------------------------- 時計虫（右向き・ネイティブ 22×16）
MW, MH = 22, 17


def _mite(anim, f, var):
    p = P(MW, MH, var)
    bob, bdx, hdx, hdy, splay, eyew, keyw, mand = 0, 0, 0, 0, 0, False, (2.5, 1.5, .6, 1.5)[f % 4], 0
    legs = []
    if anim == 'walk':
        ph = f / 4 * 2 * math.pi
        bob = -1 if f % 2 else 0
        for i, hx in enumerate((6.5, 10.5, 14.5)):
            for side in (0, 1):                      # 0 奥・1 手前（三脚歩行：交互）
                q = ph + math.pi * ((i + side) % 2)
                legs.append((side, hx, 1.8 * math.cos(q), max(0, math.sin(q)) * 1.2))
    else:
        if anim == 'hit':
            bdx, bob, splay, eyew, hdy = -1, -1 - (f % 2), 1, True, -1
            keyw = 2.5 if f % 2 == 0 else .6
        else:                                         # attack：のけぞって溜め→頭突き→戻り
            bdx, hdx, hdy, mand = [(-1, -1, -2, 1), (1, 2, 1, 2), (0, 1, 0, 0)][f]
            bob = (-1, 0, 0)[f]
        for i, hx in enumerate((6.5, 10.5, 14.5)):
            for side in (0, 1):
                legs.append((side, hx, (i - 1) * splay * 1.2 + (0 if side else .6), 0))
    by = 10 + bob
    bx = 10 + bdx

    def leg(side, hx, sw, lift):
        x0, y0 = hx + bdx, by + 2
        kx = x0 + sw * .5 + (1 if hx > 10 else -1) * .8
        fx, fy = x0 + sw, MH - 1 - lift
        m = p.line([(x0, y0), (kx, by + 3.5), (fx, fy)])
        p.fill(m, 'iron', base=1 if side == 0 else 3, grad=0, rim=False, edge=side == 1)
        p.px(fx, fy, 'iron', 1 if side == 0 else 2)

    for L in legs:                                    # 奥の脚
        if L[0] == 0:
            leg(*L)
    # 背中のゼンマイ（回って見える：幅が変わる）
    kx = bx - 1
    p.fill(p.line([(kx, by - 6), (kx, by - 3)]), 'brass', base=2, grad=0, rim=False)
    p.fill(p.ell(kx - keyw * .9, by - 6.8, max(.7, keyw * .75), 1.45) | p.ell(kx + keyw * .9, by - 6.8, max(.7, keyw * .75), 1.45),
           'brass', base=3, grad=1.2)
    # 胴（ドームの甲殻）
    body = p.ell(bx, by, 7.6, 4.8) & (p.yy <= by + 2.6)
    p.fill(body, 'shell', base=2.6, grad=1.6)
    # 腹の板
    p.fill(p.ell(bx, by + 2, 6.8, 1.6) & ~body, 'iron', base=2, grad=0)
    # 甲殻の継ぎ目（2 本）と目盛り（金のドット）
    for sx in (-2.5, 2.0):
        seam = p.line([(bx + sx, by - 4), (bx + sx + .5, by + 2)]) & body
        p.set(seam, 'shell', 1)
    for k, ang in enumerate((-2.6, -2.0, -1.4, -.8)):
        p.px(bx + 6.2 * math.cos(ang), by + 3.9 * math.sin(ang) + .5, 'brass', 4 if k % 2 == 0 else 3)
    # 横の小さな歯車
    gx, gy = bx - 4, by + .5
    g = p.ell(gx, gy, 1.8, 1.8)
    p.fill(g, 'brass', base=2.5, grad=1)
    p.px(gx, gy, 'iron', 1)
    # 頭
    hx, hy = bx + 7.2 + hdx, by + 1 + hdy
    head = p.ell(hx, hy, 3.0, 2.5)
    p.fill(head, 'shell', base=2.2, grad=1.4)
    p.set(p.line([(hx - 1.5, hy - 2), (hx - 1.5, hy + 2)]) & head, 'shell', 1)
    # 大あご
    p.fill(p.line([(hx + 2.5, hy + 1), (hx + 3.8, hy + 1 + mand * .5)]), 'bone', base=3, grad=0, rim=False)
    if mand:
        p.fill(p.line([(hx + 2.5, hy - .5), (hx + 3.8, hy - 1.2)]), 'bone', base=3, grad=0, rim=False)
    # 触角（先に金の粒）
    tip = (hx + 2.5, hy - 5 + (1 if anim == 'walk' and f % 2 else 0))
    p.fill(p.line([(hx + .5, hy - 2), (hx + 1.5, hy - 3.5), tip]), 'iron', base=3, grad=0, rim=False, edge=False)
    p.px(*tip, 'brass', 4)
    # 目（燃える琥珀）
    ex, ey = int(round(hx + 1.2)), int(round(hy - .6))
    if eyew:
        p.px(ex, ey, 'amber', 4); p.px(ex + 1, ey, 'amber', 4); p.px(ex, ey - 1, 'amber', 3)
    else:
        p.px(ex, ey, 'amber', 3); p.px(ex + 1, ey, 'amber', 2); p.px(ex, ey - 1, 'amber', 4)
    eye = (p.mat == p._mid('amber'))
    for L in legs:                                    # 手前の脚
        if L[0] == 1:
            leg(*L)
    return p.render(glow=(eye, (1, .45, .2), .35))


# ---------------------------------------------------------------- 亡霊（右向き・浮く・ネイティブ 30×38）
WW, WH = 30, 38


def _wraith(anim, f, var):
    p = P(WW, WH, var)
    n = 6
    ph = f / n * 2 * math.pi
    bob = round(1.5 - 1.5 * math.cos(ph)) if anim == 'walk' else 1
    dx = 0
    arm = 'walk'
    if anim == 'hit':
        dx, bob = -2, 0 if f == 0 else 1
        ph = 1.0 + f
    elif anim == 'attack':
        arm = ('up', 'swipe', 'back')[f]
        dx = (-1, 2, 0)[f]
        ph = (0.5, 2.5, 4.0)[f]
    oy = -bob                                         # 浮きの上下
    cx = 16 + dx
    tilt = -1.5 if anim == 'hit' else 0
    # 奥の腕（袖・暗い）
    p.fill(p.cap(cx - 2, 15 + oy, cx - 6, 22 + oy + math.sin(ph) * .8, 1.8), 'robe2', base=2, grad=.5)
    # 裾（後ろへなびくぼろ）
    hem = []
    for i in range(9):
        u = i / 8
        x = cx + 8 - u * 21
        y = 34 + oy - 2.5 * u + (2.2 if i % 2 == 0 else -.6) + 1.3 * math.sin(ph + i * 1.3)
        hem.append((x, y))
    body = p.poly([(cx - 4 + tilt, 12 + oy), (cx + 5 + tilt, 12 + oy), (cx + 8, 22 + oy), (cx + 9, 31 + oy)] + hem +
                  [(cx - 13, 26 + oy + math.sin(ph) * 1.2), (cx - 9, 21 + oy), (cx - 6, 15 + oy)])
    p.fill(body, 'robe', base=2.6, grad=1.8)
    # 衣のひだ（縦の暗い線）
    for k, fx in enumerate((-5, -1, 3)):
        fold = p.line([(cx + fx + tilt * .5, 18 + oy), (cx + fx - 2 - k * .5 + math.sin(ph + k) * .8, 32 + oy - k)]) & body
        p.set(fold, 'robe', 1)
    # 裾の先は半ば透ける
    tips = body & (p.yy > 31 + oy)
    p.alpha[tips] = .72
    # 懐中時計（鎖と割れた文字盤）
    wx, wy = cx + 1, 21 + oy + round(math.sin(ph) * .6)
    p.fill(p.line([(cx - 1, 14 + oy), (wx - 1, wy - 2)]), 'brass', base=3, grad=0, rim=False, edge=False)
    p.fill(p.ell(wx, wy, 2.4, 2.4), 'brass', base=2.5, grad=1)
    p.set(p.ell(wx, wy, 1.4, 1.4), 'bone', 4)
    p.px(wx, wy, 'iron', 1); p.px(wx + 1, wy - 1, 'iron', 1)
    p.px(wx - 1, wy + 1, 'iron', 2)                     # ひび
    # 頭巾
    hx, hy = cx + 2 + tilt, 9 + oy
    hood = p.ell(hx, hy, 6.4, 6.8) | p.poly([(hx - 6, hy - 1), (hx - 3, hy - 6), (hx - 9, hy - 8), (hx - 7, hy + 3)])
    p.fill(hood, 'robe', base=3, grad=1.6)
    face = p.ell(hx + 2.2, hy + 1, 3.6, 4.4) & hood
    p.set(face, 'void', 0)
    p.set(face & (p.xx < hx + 0.5), 'void', 2)
    # 目（冷たい青白）
    wide = anim == 'hit' or (anim == 'attack' and f == 1)
    e1, e2 = (int(round(hx + 2)), int(round(hy))), (int(round(hx + 4.5)), int(round(hy)))
    p.px(e1[0], e1[1], 'cyan', 4); p.px(e1[0] - 1, e1[1], 'cyan', 2)
    p.px(e2[0], e2[1], 'cyan', 3)
    if wide:
        p.px(e1[0], e1[1] - 1, 'cyan', 3); p.px(e2[0], e2[1] - 1, 'cyan', 2); p.px(e1[0], e1[1] + 1, 'cyan', 2)
    eye = p.mat == p._mid('cyan')
    # 手前の腕（袖と骨の爪）
    if arm == 'walk':
        sx, sy, ex_, ey_ = cx + 3, 15 + oy, cx + 8, 21 + oy + math.sin(ph + 1) * 1.2
        claw = [(1, 1.5), (1.8, .6), (2, -.6)]
    elif arm == 'up':
        sx, sy, ex_, ey_ = cx + 3, 15 + oy, cx + 5, 7 + oy
        claw = [(-.5, -2), (.6, -2.2), (1.6, -1.6)]
    elif arm == 'swipe':
        sx, sy, ex_, ey_ = cx + 3, 15 + oy, cx + 10, 20 + oy
        claw = [(2.2, 1.6), (2.6, .4), (2.4, -.8)]
    else:
        sx, sy, ex_, ey_ = cx + 3, 15 + oy, cx + 8, 23 + oy
        claw = [(.6, 2), (1.4, 1.8), (2, 1)]
    p.fill(p.cap(sx, sy, ex_, ey_, 2.0), 'robe', base=2.8, grad=1)
    for (ax, ay) in claw:
        p.fill(p.line([(ex_ + ax * .4, ey_ + ay * .4), (ex_ + ax * 1.1, ey_ + ay * 1.1)]), 'bone', base=3, grad=0, rim=False)
    if arm == 'swipe':                                # 爪の残像（光らない淡い線）
        for k in range(3):
            m = p.line([(ex_ - 1 + k, ey_ - 6 + k), (ex_ + 1 + k, ey_ - 1 + k)]) & (p.mat < 0)
            p.set(m, 'cyan', 1)
            p.alpha[m] = .45
    return p.render(glow=(eye, (.5, .9, 1), .4))


# ---------------------------------------------------------------- 歯車の巨像（右向き・ボス・ネイティブ 56×62）
GW, GH = 56, 62


def _gear(p, cx, cy, r, mat, base, teeth=8, rot=0.0, hub='iron'):
    ang = np.arctan2(p.yy - cy, p.xx - cx)
    rr = np.sqrt((p.xx - cx) ** 2 + (p.yy - cy) ** 2)
    tooth = np.cos(ang * teeth + rot) > .25
    m = (rr <= r - 1.2) | ((rr <= r + .3) & tooth)
    p.fill(m, mat, base=base, grad=1.2)
    p.set((rr <= r * .38), hub, 1)
    p.set((rr <= r * .38) & (p.yy < cy) & (p.xx < cx), hub, 2)
    return m


def _golem(anim, f, var):
    p = P(GW, GH, var)
    n = 6
    lean, armA, sink = 0, None, 0
    if anim == 'walk':
        ph = f / n * 2 * math.pi
        c = math.cos(ph)
        nfx, ffx = 4.5 * c, -4.5 * c                  # 足の前後
        nlift = max(0, -math.sin(ph)) * 3.5           # 前へ出す足が浮く
        flift = max(0, math.sin(ph)) * 3.5
        sink = round(3 * abs(c) ** 2)                 # 足をついた瞬間に沈む
        swing = -c
        gr = ph
    elif anim == 'hit':
        nfx, ffx, nlift, flift = 1, -2, 0, 0
        lean, sink, swing, gr = (-3, -2)[f], (1, 0)[f], .5, 0.6 * f
    else:
        nfx, ffx, nlift, flift = 3, -3, 0, 0
        lean, sink, armA = [(-2, 0, 'up'), (3, 3, 'slam'), (1, 1, 'back')][f]
        swing, gr = 0, f * .5
    oy = sink
    tx = 28 + lean                                    # 胴の中心
    hip = 42 + oy

    def leg(lx, fx, lift, mat, base, edge):
        kx = lx + fx * .5
        top = (kx + lean * .3, hip)
        footx, footy = lx + 1 + fx, 61 - lift
        m = p.cap(top[0], top[1], footx - 1, footy - 6, 5.2)
        p.fill(m, mat, base=base, grad=1.0, edge=edge)
        foot = p.poly([(footx - 7, footy - 4), (footx + 6, footy - 4), (footx + 8, footy), (footx - 7, footy)])
        p.fill(foot, mat, base=base, grad=.6)
        p.set(p.line([(footx - 6, footy - 4), (footx + 6, footy - 4)]) & foot, mat, max(1, base - 1))
        return m

    def arm(sh, el, fist, mat, base, r=3.6):
        p.fill(p.cap(*sh, *el, r), mat, base=base, grad=.8)
        p.fill(p.cap(*el, *fist, r + .4), mat, base=base, grad=.8)
        p.fill(p.ell(fist[0], fist[1], 5.0, 4.6), mat, base=base + .2, grad=1.2)
        p.set(p.line([(fist[0] - 3, fist[1] - 1), (fist[0] + 3, fist[1] - 1)]) & p.ell(fist[0], fist[1], 5, 4.6), mat, max(1, int(base) - 1))

    # 奥の腕・奥の足（暗い）
    fsh = (tx - 13, 20 + oy)
    if armA == 'up':
        arm(fsh, (tx - 16, 30 + oy), (tx - 15, 38 + oy), 'stone2', 2.2)
    else:
        arm(fsh, (tx - 16 - swing, 30 + oy), (tx - 16 - swing * 2, 40 + oy), 'stone2', 2.2)
    leg(22, ffx, flift, 'stone2', 2.2, False)
    # 腰
    p.fill(p.poly([(tx - 11, 37 + oy), (tx + 10, 37 + oy), (tx + 9, 46 + oy), (tx - 10, 46 + oy)]), 'stone', base=2, grad=1)
    # 胴（肩が広く腰で細い）
    torso = p.poly([(tx - 16, 15 + oy), (tx + 14, 14 + oy), (tx + 15, 22 + oy), (tx + 11, 39 + oy),
                    (tx - 12, 39 + oy), (tx - 16, 24 + oy)])
    p.fill(torso, 'stone', base=2.8, grad=1.6)
    # 板の継ぎ目と鋲
    for seam in ([(tx - 14, 23 + oy), (tx - 6, 33 + oy), (tx + 9, 33 + oy)], [(tx + 13, 21 + oy), (tx + 9, 30 + oy)]):
        p.set(p.line(seam) & torso, 'stone', 1)
    for (rx, ry) in ((tx - 12, 18), (tx + 10, 18), (tx - 9, 36), (tx + 8, 36)):
        p.px(rx, ry + oy, 'brass', 3)
        p.px(rx + 1, ry + 1 + oy, 'brass', 1)
    # 胸の歯車の輪と紫の核
    cx, cy = tx + 1, 26 + oy
    _gear(p, cx, cy, 7.4, 'brass', 2.4, teeth=10, rot=gr)
    rr = np.sqrt((p.xx - cx) ** 2 + (p.yy - cy) ** 2)
    p.set(rr <= 4.6, 'void', 1)
    core = (np.abs(p.xx - cx) + np.abs(p.yy - cy) * .85) <= 3.6
    bright = anim == 'hit' or (anim == 'attack' and f == 1)
    p.set(core, 'core', 2 if not bright else 3)
    p.set(core & ((p.xx - cx) + (p.yy - cy) <= -1.5), 'core', 3 if not bright else 4)
    p.set(core & ((p.xx - cx) + (p.yy - cy) >= 2.5), 'core', 1)
    p.px(cx - 1, cy - 1, 'core', 4)
    p.px(cx - 1, cy - 2, 'core', 4 if bright else 3)
    ring = (rr > 3.8) & (rr <= 4.6) & (((p.xx + p.yy).astype(int) % 2) == 0)  # 核のまわりのにじみ（市松）
    p.set(ring, 'core', 1)
    coremask = core.copy()
    # 頭（肩に沈んだ兜。前へ出る）
    hx, hy = tx + 7, 10 + oy + (1 if armA == 'slam' else 0)
    helm = p.poly([(hx - 7, hy - 5), (hx + 4, hy - 6), (hx + 7, hy - 2), (hx + 7, hy + 5), (hx - 7, hy + 5)])
    p.fill(helm, 'stone', base=3, grad=1.4)
    # 時計の針の角（後ろへ）
    p.fill(p.poly([(hx - 5, hy - 5), (hx - 13, hy - 9), (hx - 12, hy - 7), (hx - 4, hy - 3)]), 'brass', base=3, grad=.5)
    p.px(hx - 13, hy - 9, 'brass', 4)
    # 面の溝と光る目（琥珀の細い一文字）
    p.set(p.line([(hx - 2, hy), (hx + 6, hy)]), 'void', 0)
    p.set(p.line([(hx + 1, hy), (hx + 6, hy)]), 'amber', 3)
    p.px(hx + 5, hy, 'amber', 4)
    if bright:
        p.px(hx + 4, hy - 1, 'amber', 2)
    eye = p.mat == p._mid('amber')
    # 手前の足
    leg(32, nfx, nlift, 'stone', 2.8, True)
    # 手前の腕
    nsh = (tx + 13, 21 + oy)
    if armA == 'up':
        arm(nsh, (tx + 16, 9 + oy), (tx + 14, 2 + oy), 'stone', 3)
    elif armA == 'slam':
        arm(nsh, (tx + 19, 28 + oy), (tx + 23, 40 + oy), 'stone', 3)
    elif armA == 'back':
        arm(nsh, (tx + 17, 30 + oy), (tx + 19, 40 + oy), 'stone', 3)
    else:
        arm(nsh, (tx + 16 + swing, 30 + oy), (tx + 16 + swing * 2.2, 41 + oy), 'stone', 3)
    # 肩の歯車（手前の肩当て）
    _gear(p, tx + 13, 20 + oy, 5.6, 'brass', 2.6, teeth=8, rot=-gr)
    return p.render(glow=(coremask | eye, (.75, .4, 1), .3))


# ---------------------------------------------------------------- 約束の口
_NAT = {'mite': (MW, MH, _mite), 'wraith': (WW, WH, _wraith), 'golem': (GW, GH, _golem)}
SIZE = {k: (v[0] * 2, v[1] * 2) for k, v in _NAT.items()}
# 動きの長さ（秒）とコマ数
_ANIM = {
    'mite':   {'walk': (.36, 4), 'hit': (.16, 2), 'attack': (.4, 3)},
    'wraith': {'walk': (.9, 6), 'hit': (.16, 2), 'attack': (.4, 3)},
    'golem':  {'walk': (1.3, 6), 'hit': (.2, 2), 'attack': (.4, 3)},
}
_CACHE = {}


def sprite(kind, anim, t, seed, scale=2):
    if anim not in ('walk', 'hit', 'attack'):
        anim = 'walk'
    per, n = _ANIM[kind][anim]
    f = int((t % per) / per * n) % n
    var = int(seed) % 3
    key = (kind, anim, f, var, scale)
    a = _CACHE.get(key)
    if a is None:
        w, h, fn = _NAT[kind]
        nat = fn(anim, f, var)
        assert nat.shape == (h, w, 4), (kind, nat.shape)
        a = np.ascontiguousarray(np.repeat(np.repeat(nat, scale, 0), scale, 1), np.float32)
        a.flags.writeable = False
        _CACHE[key] = a
    return a


if __name__ == '__main__':                            # 確認の一覧：python3 enemies.py → out/enemies_sheet.png
    import os
    rows = []
    for kind in ('mite', 'wraith', 'golem'):
        for var in range(3):
            tiles = []
            for anim in ('walk', 'hit', 'attack'):
                per, n = _ANIM[kind][anim]
                for f in range(n):
                    a = sprite(kind, anim, (f + .5) / n * per, var, 2)
                    assert a.shape[:2] == (SIZE[kind][1], SIZE[kind][0])
                    tiles.append(a)
                tiles.append(np.zeros((a.shape[0], 8, 4), np.float32))
            rows.append(np.concatenate(tiles, 1))
    Wm = max(r.shape[1] for r in rows)
    sheet = np.zeros((sum(r.shape[0] + 6 for r in rows), Wm, 3), np.float32)
    sheet[...] = (.32, .30, .38)
    y = 0
    for r in rows:
        sheet[y:y + r.shape[0], :r.shape[1]] = sheet[y:y + r.shape[0], :r.shape[1]] * (1 - r[..., 3:]) + r[..., :3] * r[..., 3:]
        y += r.shape[0] + 6
    im = Image.fromarray((sheet * 255).astype(np.uint8))
    im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    os.makedirs(os.path.join(os.path.dirname(__file__) or '.', 'out'), exist_ok=True)
    im.save(os.path.join(os.path.dirname(__file__) or '.', 'out', 'enemies_sheet.png'))
    import time
    t0 = time.time()
    for i in range(24000):
        sprite(('mite', 'wraith', 'golem')[i % 3], 'walk', i * .016, i % 20)
    print('24000 calls', round(time.time() - t0, 3), 's', 'SIZE', SIZE)
