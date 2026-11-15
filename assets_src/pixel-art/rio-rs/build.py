"""リオ：RS 風（ロマンシング サガ リ・ユニバースを参考にした小さなコマ打ちのドット絵）の試作
規格は .claude/skills/rs-style-sprite/SKILL.md。実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs/build.py

作り方
 ・1 コマ 48×48、足元 y=45、身長およそ 30 ドット（頭が 4 割）。横向きは左（敵の側）を向く 3/4 視点
 ・頭は 1 ドットずつ手で置いた地図（HEAD）。体は関節の位置（ポーズ）から部品を描く
 ・部品ごとに：塗る → 左上からの光で 3 段の陰影（自動） → 外側を輪郭色で囲む → 奥から手前へ重ねる
   （部品の境目に内側の線が残るのが RS の描き方）
 ・ポーズ＝関節の座標の表（POSES）。コマを増やすときは表に 1 行足す
"""
import math, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, '..', '..', '..', '.claude', 'skills', 'pixel-art-studio', 'scripts'))
from pixelstudio import Sprite  # noqa: E402

OUT = os.path.join(ROOT, 'out')
os.makedirs(OUT, exist_ok=True)
W = H = 48
GROUND = 45

# ---------------- パレット（22 色） ----------------
OL = '#1c1a26'                                   # 輪郭（真っ黒にしない）
HAIR = ['#fff3a6', '#f4cc44', '#d0901c', '#8a5612']  # 光 → 影
SKIN = ['#ffe2c6', '#f4b08a', '#c47a5e']
EYE = {'j': '#1e2a66', 'i': '#3c8cff', 'w': '#f4f6fc'}
COAT = ['#545a86', '#30355a', '#1d2040']          # 濃紺のコート
TRIM = ['#f0c860', '#a8741e']                     # 金の縁
SCARF = ['#e04848', '#9a2034']
PANTS = ['#767a8c', '#4c4f60']
STEEL = ['#f4f6fc', '#b6bccc', '#7a8094']         # 鎧・剣
INNER = '#5c1a2a'                                 # コートの裏（暗い赤）
GEM = '#3c8cff'

# ---------------- 頭（左向き 3/4） ----------------
# a〜d 髪（光→影）／e f g 肌／j 瞳の上・i 瞳・w 光／o 内側の線
HEAD = [  # 14×13（RS の頭は身長の 4 割・幅 13〜14）
    ".......c..c...",
    "...c..cbccbc..",
    "..cbccbabbbbcc",
    ".cbaabaabbbbbc",
    "cbaaabbbbbbbcd",
    ".cbabbbbbbbccd",
    "..cbcbbcbbbccd",
    ".cbfcbbfbcbccd",
    "..fefcfefccd..",
    "..eeeeeefgcd..",
    "..jjeejjfgcd..",
    "..iweiwefgd...",
    "...feeeffg....",
]
HC = {'a': HAIR[0], 'b': HAIR[1], 'c': HAIR[2], 'd': HAIR[3], 'e': SKIN[0], 'f': SKIN[1], 'g': SKIN[2],
      'o': OL, **EYE}


class Layer:
    """1 部品ぶんの絵。塗り（mask）と色を持ち、輪郭を外側に付けて重ねる"""
    def __init__(self):
        self.px = {}

    def put(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.px[(x, y)] = c

    def disc(self, cx, cy, r, c):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r:
                    self.put(x, y, c)

    def thick(self, p0, p1, w, c):
        """太さ w の線（丸い端）"""
        (x0, y0), (x1, y1) = p0, p1
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) * 2))
        for i in range(n + 1):
            t = i / n
            self.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2, c)

    def poly(self, pts, c):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        for y in range(int(min(ys)) - 1, int(max(ys)) + 2):
            for x in range(int(min(xs)) - 1, int(max(xs)) + 2):
                px, py = x + .5, y + .5; inside = False
                for i in range(len(pts)):
                    (xi, yi), (xj, yj) = pts[i], pts[i - 1]
                    if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
                        inside = not inside
                if inside:
                    self.put(x, y, c)

    def shade(self, ramp, only=None):
        """左上からの光：左・上が外に接する画素は明るく、右・下が外に接する画素は暗く"""
        keys = [k for k, c in self.px.items() if only is None or c == only]
        S = set(self.px)
        out = {}
        for (x, y) in keys:
            lt = ((x - 1, y) not in S) or ((x, y - 1) not in S)
            rb = ((x + 1, y) not in S) or ((x, y + 1) not in S) or ((x + 1, y + 1) not in S)
            out[(x, y)] = ramp[2] if rb and not lt else ramp[0] if lt and not rb else ramp[1]
        self.px.update(out)
        return self

    def outline(self):
        S = set(self.px)
        ring = set()
        for (x, y) in S:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in S and 0 <= q[0] < W and 0 <= q[1] < H:
                    ring.add(q)
        for q in ring:
            self.px[q] = OL
        return self


def head(L, x0, y0, rot=0):
    rows = HEAD
    if rot:  # 倒れ：90° 回して横に寝かせる（ドット絵の回転は 90° 単位だけ崩れない）
        rows = [''.join(HEAD[len(HEAD) - 1 - r][c] for r in range(len(HEAD))) for c in range(len(HEAD[0]))]
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != '.':
                L.put(x0 + x, y0 + y, HC[ch])


def leg(L, hip, knee, foot, near):
    pant = PANTS[0] if near else PANTS[1]
    L.thick(hip, knee, 3.4, pant)
    L.shade(PANTS + [PANTS[1]] if near else [PANTS[1]] * 3)
    G = Layer()
    G.thick(knee, (foot[0], foot[1] - 1), 3.4, STEEL[1])
    G.poly([(foot[0] - 3, foot[1] - 2), (foot[0] + 2, foot[1] - 2), (foot[0] + 2, foot[1] + 1), (foot[0] - 4, foot[1] + 1)], STEEL[1])
    G.shade(STEEL if near else [STEEL[1], STEEL[2], STEEL[2]])
    return G


def arm(L, sh, hand, near):
    L.thick(sh, hand, 3.2 if near else 2.6, COAT[1])
    L.shade(COAT if near else [COAT[1], COAT[2], COAT[2]])
    g = Layer()
    g.disc(hand[0], hand[1], 1.5, STEEL[1])
    g.shade(STEEL)
    return g


def sword(L, hand, ang, length=15):
    """柄頭 → 鍔 → 刃。ang は刃の向き（度、0＝右、90＝下）"""
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); vx, vy = -uy, ux
    hx, hy = hand
    blade = Layer()
    tip = (hx + ux * length, hy + uy * length)
    blade.thick((hx + ux * 3, hy + uy * 3), tip, 2.2, STEEL[1])
    blade.shade(STEEL)
    for i in range(4, int(length) - 1):  # 刃の中心の光（しのぎ）
        blade.put(int(hx + ux * i + .5), int(hy + uy * i + .5), STEEL[0])
    blade.outline()
    hilt = Layer()
    hilt.thick((hx + vx * 2.6 + ux * 2, hy + vy * 2.6 + uy * 2), (hx - vx * 2.6 + ux * 2, hy - vy * 2.6 + uy * 2), 1.6, TRIM[0])
    hilt.thick((hx - ux * 2, hy - uy * 2), (hx + ux * 1, hy + uy * 1), 1.4, TRIM[1])
    hilt.shade([TRIM[0], TRIM[0], TRIM[1]])
    hilt.put(int(hx - ux * 2.6 + .5), int(hy - uy * 2.6 + .5), GEM)
    hilt.outline()
    return [blade, hilt]


def coat(p, L):
    nk, hp, lean = p['neck'], p['hip'], p.get('lean', 0)
    x0, y0 = nk; x1, y1 = hp
    fl = p.get('flare', 0)
    # 胴（肩幅 9・腰 8）と裾（左右に広がる）
    L.poly([(x0 - 4, y0 + 1), (x0 + 4, y0 + 1), (x1 + 4, y1 + 1), (x1 + 5 + fl, y1 + 6), (x1 + 1, y1 + 4),
            (x1 - 2, y1 + 4), (x1 - 5 - fl // 2, y1 + 6), (x1 - 4, y1 + 1)], COAT[1])
    L.shade(COAT)
    # 前の合わせの金の縁とベルト
    for t in range(0, 11):
        x = round(x0 - 1 + (x1 - 2 - (x0 - 1)) * t / 10); y = round(y0 + 2 + (y1 + 4 - (y0 + 2)) * t / 10)
        if (x, y) in L.px:
            L.px[(x, y)] = TRIM[0] if t % 3 else TRIM[1]
    for x in range(x1 - 4, x1 + 5):
        if (x, y1) in L.px:
            L.px[(x, y1)] = TRIM[1]


def back_coat(p, L):
    x1, y1 = p['hip']; fl = p.get('flare', 0)
    L.poly([(x1 + 1, y1 - 6), (x1 + 6, y1 - 4), (x1 + 8 + fl, y1 + 8), (x1 + 2, y1 + 6)], INNER)


def scarf(p, L):
    x, y = p['neck']; wind = p.get('wind', 0)
    L.poly([(x - 4, y - 1), (x + 3, y - 1), (x + 4, y + 2), (x - 3, y + 3)], SCARF[0])
    L.thick((x + 3, y + 1), (x + 7 + wind, y + 3 - wind // 2), 2, SCARF[1])
    L.shade([SCARF[0], SCARF[0], SCARF[1]])


def compose(layers):
    canvas = {}
    for L in layers:
        canvas.update(L.px)
    return canvas


def figure(p):
    """ポーズ p（関節の座標）から 1 コマを作る。奥 → 手前の順に重ねる"""
    Ls = []
    # 奥：コートの裏・奥の脚・奥の腕
    b = Layer(); back_coat(p, b); b.outline(); Ls.append(b)
    fl = Layer(); g = leg(fl, *p['far_leg'], near=False); fl.outline(); g.outline(); Ls += [fl, g]
    fa = Layer(); ga = arm(fa, *p['far_arm'], near=False); fa.outline(); ga.outline(); Ls += [fa, ga]
    # 手前の脚・胴
    nl = Layer(); g2 = leg(nl, *p['near_leg'], near=True); nl.outline(); g2.outline(); Ls += [nl, g2]
    c = Layer(); coat(p, c); c.outline(); Ls.append(c)
    s = Layer(); scarf(p, s); s.outline(); Ls.append(s)
    # 手前の腕と剣（構え：剣を頭の奥に担ぐ）
    na = Layer(); gn = arm(na, *p['near_arm'], near=True); na.outline(); gn.outline()
    pd = Layer(); sx, sy = p['near_arm'][0]; pd.disc(sx + 1, sy, 2.1, STEEL[1]); pd.shade(STEEL); pd.outline()  # 肩当て
    sw = sword(None, p['near_arm'][1], p['sword'], p.get('slen', 15)) if p.get('sword') is not None else []
    hd = Layer(); head(hd, p['head'][0] - 7, p['head'][1] - 8, p.get('rot', 0)); hd.outline()
    if p.get('sword_behind'):
        Ls += sw + [hd, na, gn, pd]
    else:
        Ls += [hd, na, pd] + sw + [gn]
    # 斬撃の残像（スミア）
    if p.get('smear'):
        sm = Layer()
        cx, cy, r0, r1, a0, a1 = p['smear']
        for k in range(60):
            a = math.radians(a0 + (a1 - a0) * k / 59)
            for r in range(r0, r1):
                sm.put(int(cx + math.cos(a) * r + .5), int(cy + math.sin(a) * r + .5), STEEL[0] if r > r1 - 3 else '#cfe4ff')
        Ls.insert(0, sm)
    return compose(Ls)


# ---------------- ポーズ（関節の座標。左が前） ----------------
def P(**k):
    return k


STAND = P(head=(25, 15), neck=(25, 23), hip=(25, 34),
          far_leg=((27, 35), (28, 39), (29, 44)), near_leg=((23, 35), (22, 39), (21, 44)),
          far_arm=((29, 25), (31, 32)), near_arm=((21, 25), (18, 32)), sword=125, wind=0)
POSES = {
    '待機1': STAND,
    '待機2': {**STAND, 'head': (25, 16), 'neck': (25, 24), 'far_arm': ((29, 26), (31, 33)), 'near_arm': ((21, 26), (18, 33)), 'wind': 1},
    '構え': P(head=(27, 16), neck=(27, 24), hip=(26, 35), lean=1,
              far_leg=((28, 36), (31, 39), (32, 44)), near_leg=((24, 36), (21, 40), (19, 44)),
              far_arm=((31, 26), (33, 30)), near_arm=((25, 26), (31, 23)), sword=-62, slen=15, sword_behind=1, wind=2, flare=1),
    '斬り下ろし': P(head=(19, 19), neck=(21, 26), hip=(23, 36), flare=2,
                  far_leg=((25, 37), (30, 40), (34, 44)), near_leg=((20, 37), (15, 40), (14, 44)),
                  far_arm=((25, 27), (29, 30)), near_arm=((17, 27), (11, 30)), sword=150, slen=16, wind=4,
                  smear=(18, 27, 11, 18, -80, -205)),
    '振り抜き': P(head=(19, 19), neck=(21, 26), hip=(23, 36), flare=2,
                far_leg=((25, 37), (30, 40), (34, 44)), near_leg=((20, 37), (15, 40), (14, 44)),
                far_arm=((25, 27), (29, 31)), near_arm=((17, 28), (12, 34)), sword=120, slen=16, wind=3),
    '被弾': P(head=(29, 15), neck=(28, 23), hip=(26, 34), lean=-1,
              far_leg=((28, 35), (31, 39), (31, 44)), near_leg=((24, 35), (23, 39), (22, 44)),
              far_arm=((32, 24), (35, 28)), near_arm=((24, 25), (27, 31)), sword=55, slen=14, wind=-2),
    '瀕死': P(head=(22, 25), neck=(24, 31), hip=(27, 39), flare=1,
              far_leg=((29, 40), (33, 42), (33, 45)), near_leg=((25, 40), (21, 42), (19, 45)),
              far_arm=((28, 33), (30, 38)), near_arm=((20, 33), (15, 36)), sword=88, slen=14, wind=-1),
    '勝利': P(head=(25, 15), neck=(25, 23), hip=(25, 34),
              far_leg=((27, 35), (29, 39), (30, 44)), near_leg=((23, 35), (22, 39), (20, 44)),
              far_arm=((29, 25), (31, 32)), near_arm=((21, 24), (18, 14)), sword=-100, slen=14, wind=3),
}


K = .88  # RS の身長（約 30 ドット）に合わせて、ポーズ全体を足元を中心に縮める


def shrink(p):
    cx = p['hip'][0]
    f = lambda q: (round(cx + (q[0] - cx) * K), round(GROUND - (GROUND - q[1]) * K))
    o = dict(p)
    for k in ('head', 'neck', 'hip'):
        o[k] = f(p[k])
    for k in ('far_leg', 'near_leg', 'far_arm', 'near_arm'):
        o[k] = tuple(f(q) for q in p[k])
    if 'slen' in p or 'sword' in p:
        o['slen'] = round(p.get('slen', 15) * K)
    if p.get('smear'):
        x, y, r0, r1, a0, a1 = p['smear']; (x, y) = f((x, y)); o['smear'] = (x, y, round(r0 * K), round(r1 * K), a0, a1)
    return o


POSES = {k: shrink(v) for k, v in POSES.items()}


def ko():
    """戦闘不能：うつ伏せに倒れる（頭は 90° 回した地図）"""
    Ls = []
    lg = Layer(); lg.thick((26, 41), (38, 42), 4, PANTS[1]); lg.shade(PANTS + [PANTS[1]]); lg.outline(); Ls.append(lg)
    gr = Layer(); gr.thick((36, 42), (42, 43), 4, STEEL[1]); gr.shade(STEEL); gr.outline(); Ls.append(gr)
    c = Layer(); c.poly([(15, 37), (28, 37), (31, 40), (29, 44), (14, 44)], COAT[1]); c.shade(COAT); c.outline(); Ls.append(c)
    sc = Layer(); sc.thick((14, 38), (19, 37), 2, SCARF[0]); sc.shade([SCARF[0], SCARF[0], SCARF[1]]); sc.outline(); Ls.append(sc)
    hd = Layer(); head(hd, 0, 29, rot=1); hd.outline(); Ls.append(hd)
    sw = sword(None, (24, 45), 180, 13); Ls = sw[:1] + Ls + sw[1:]
    return compose(Ls)


def main():
    names = list(POSES) + ['戦闘不能']
    frames = [figure(POSES[n]) for n in POSES] + [ko()]
    s = Sprite(W, H)
    for i, fr in enumerate(frames):
        if i:
            s.add_frame(copy=False)
        s.use(frame=i + 1)
        for (x, y), c in fr.items():
            s.px(x, y, c)
    dur = {'待機1': 400, '待機2': 400, '構え': 160, '斬り下ろし': 60, '振り抜き': 220, '被弾': 200, '瀕死': 400, '勝利': 600, '戦闘不能': 600}
    for i, n in enumerate(names):
        s.set_duration(dur[n], frames=[i + 1])
    s.tag('idle', 1, 2, 'pingpong'); s.tag('attack', 3, 5)
    s.preview(os.path.join(OUT, 'preview.png'), scale=6, cols=5)
    s.save_spritesheet(os.path.join(OUT, 'rio_rs_sheet.png'), layout='row', scale=1)
    for i in range(len(frames)):
        s.save_png(os.path.join(OUT, 'f%02d.png' % i), frame=i + 1, scale=1)
    s.save_gif(os.path.join(OUT, 'rio_rs_attack.gif'), scale=6, tag='attack', bg='#2a2f44')
    s.save_gif(os.path.join(OUT, 'rio_rs_idle.gif'), scale=6, tag='idle', bg='#2a2f44')
    with open(os.path.join(OUT, 'names.txt'), 'w', encoding='utf8') as f:
        f.write('\n'.join(names))
    s.stats()


if __name__ == '__main__':
    main()
