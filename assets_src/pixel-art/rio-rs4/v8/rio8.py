"""===== リオ第 8 版：RS と同じ 32 行の大きさで全ポーズを描き直す =====
・立ち（stand.py）は 1 ドットずつ手で置いた地図。頭・胴はここから切り出して全ポーズで使う（髪型・色・顔をそろえる）
・手足は関節の位置＋太さ（筒）で組み、外周は最後に純黒で閉じる。剣は 8 方向の同じ形
・座標は立ちの地図の左上が (0, 0)。地面＝行 30（靴の下の輪郭）
実行：python3 assets_src/pixel-art/rio-rs4/v8/rio8.py → v8/out/<ポーズ>.png（48×48・足元 y=45）と preview.png"""
import math
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pal import PAL       # noqa: E402
from stand import STAND   # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')

HEAD = STAND[0:13]
# 目を閉じる：まぶたの段を肌に、瞳の段に黒の線（奥の目 1・手前の目 2）、虹彩の段を肌に
HEAD_SHUT = HEAD[:8] + [".o2hsssssu2121o.", "..oosootu1211o..", "..otsstsv121o..."] + HEAD[11:]
TORSO = [
    "..oxRRo..",
    ".oRppRRRo",
    "oRRRRrRRxo",
    "orRrxcRxRo",
    "ocLCgcCko",
    "oLgGgcCko",
    "ocLCgcCko",
    "ojgGgjgjo",
    "ocCcccCko",
    "ogGggggjo",
]
SC_HANG = ["oo..", "RRo.", "RRRo", "oxRo", ".oxo"]
SC_FLOW = ["RRro...", "rRRRro.", ".xrRRRo", "..xxrRo", "....oxo"]
SC_UP = ["....oRo", "...oRro", "..oRrxo", ".oRrxo.", "oRro..."]
BOOT_L = ["..oBBo", ".oNBBbo", "oNNBBbo", "obbbbbo"]      # つま先が左（前）
BOOT_R = ["oBBo..", "oBBNo.", "obBBNNo", "obbbbbo"]       # つま先が右（後ろへ下がる）
BOOT_DOWN = [".oBBo", "oNBBo", "oNBbo", ".oNbo", "..oo."]  # つま先が下
HAND = ["st", "tu"]
SHADE = {'coat': ('L', 'C', 'c'), 'pants': ('Q', 'P', 'q')}
DIRS8 = {'L': (-1, 0), 'UL': (-1, -1), 'U': (0, -1), 'UR': (1, -1), 'R': (1, 0), 'DR': (1, 1), 'D': (0, 1), 'DL': (-1, 1)}
W = H = 64
OX, OY = 18, 24


def canvas():
    return [['.'] * W for _ in range(H)]


def stamp(cv, rows, x, y):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch not in '. ':
                X, Y = OX + x + i, OY + y + j
                if 0 <= Y < H and 0 <= X < W:
                    cv[Y][X] = ch


def tube(cv, a, b, r, mat, mask=None):
    hi, mid, lo = SHADE[mat]
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    if nx + ny > 0:
        nx, ny = -nx, -ny
    for y in range(int(min(y0, y1) - r - 1), int(max(y0, y1) + r + 2)):
        for x in range(int(min(x0, x1) - r - 1), int(max(x0, x1) + r + 2)):
            t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / (L * L)))
            d = math.hypot(x - (x0 + dx * t), y - (y0 + dy * t))
            if d <= r:
                side = (x - (x0 + dx * t)) * nx + (y - (y0 + dy * t)) * ny
                ch = hi if side > r * .35 else lo if side < -r * .35 else mid
                X, Y = OX + x, OY + y
                if 0 <= Y < H and 0 <= X < W:
                    cv[Y][X] = ch
                    if mask is not None:
                        mask.add((X, Y))


def sep(cv, mask, against=None):
    """手前の手足を黒い線で分ける：手足の外側で、すでに塗ってある画素（against の色だけ）を輪郭に"""
    for X, Y in list(mask):
        for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (X + a, Y + b)
            if q in mask or not (0 <= q[1] < H and 0 <= q[0] < W):
                continue
            c = cv[q[1]][q[0]]
            if c not in '.o' and (against is None or c in against):
                cv[q[1]][q[0]] = 'o'


def blade(cv, hx, hy, d, n=9):
    """剣：柄頭 g・柄 j 2・鍔 g G g（刃に直角）・刃 幅 2（M 芯・m 影）長さ n・先 V。向きは 8 方向だけ"""
    dx, dy = DIRS8[d]
    px_, py_ = -dy, dx
    sx, sy = (0, 1) if dy == 0 else (1, 0)
    cells = {(hx - 2 * dx, hy - 2 * dy): 'g', (hx - dx, hy - dy): 'j', (hx, hy): 'j'}
    gx, gy = hx + dx, hy + dy
    cells[(gx, gy)] = 'G'
    cells[(gx + px_, gy + py_)] = 'g'
    cells[(gx - px_, gy - py_)] = 'g'
    for k in range(2, n + 2):
        x, y = hx + dx * k, hy + dy * k
        cells[(x, y)] = 'V' if k == n + 1 else 'M'
        if k < n + 1 and (x + sx, y + sy) not in cells:
            cells[(x + sx, y + sy)] = 'm'
    for (x, y), ch in cells.items():
        if 0 <= y < H and 0 <= x < W:
            cv[y][x] = ch


def close(cv):
    add = [(x + a, y + b) for y in range(H) for x in range(W) if cv[y][x] not in '.o'
           for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))
           if 0 <= x + a < W and 0 <= y + b < H and cv[y + b][x + a] == '.']
    for x, y in add:
        cv[y][x] = 'o'


def figure(legs, arms, torso=(2, 13), head=(0, 0), headrows=None, scarf=None, sword=None, extra=()):
    """legs / arms：[奥, 手前]。脚＝(腰, 膝, 足首, 靴)、腕＝(肩, 肘, 手)。sword＝(手の番号, 向き[, 長さ])"""
    cv = canvas()
    hands = []

    def leg(l, front=False):
        if l is None:
            return
        hip, knee, ank, boot = l
        m = set()
        tube(cv, hip, knee, 2.0, 'pants', m)
        tube(cv, knee, ank, 1.6, 'pants', m)
        b = {'L': BOOT_L, 'R': BOOT_R, 'D': BOOT_DOWN}[boot]
        bx, by = ank[0] - {'L': 3, 'R': 1, 'D': 2}[boot], ank[1] - 1
        stamp(cv, b, bx, by)
        for j, r in enumerate(b):
            for i, ch in enumerate(r):
                if ch not in '.o':
                    m.add((OX + bx + i, OY + by + j))
        if front:
            sep(cv, m, 'QPqNBb')

    def arm(a, front=False):
        if a is None:
            hands.append(None)
            return
        sh, el, hd = a
        m = set()
        tube(cv, sh, el, 1.6, 'coat', m)
        tube(cv, el, hd, 1.4, 'coat', m)
        cv[OY + hd[1]][OX + hd[0]] = 'g'      # 金の袖口
        ex, ey = hd[0] - el[0], hd[1] - el[1]
        L = math.hypot(ex, ey) or 1
        hx, hy = round(hd[0] + ex / L * 1.4), round(hd[1] + ey / L * 1.4)
        stamp(cv, HAND, hx - 1, hy - 1)
        m |= {(OX + hx - 1 + i, OY + hy - 1 + j) for i in range(2) for j in range(2)}
        if front:
            # 肩の付け根（胴の中）は線を引かない
            sx, sy = OX + sh[0], OY + sh[1]
            sep(cv, {p for p in m if abs(p[0] - sx) + abs(p[1] - sy) > 2})
        hands.append((OX + hx, OY + hy))

    if scarf:
        stamp(cv, scarf[2], scarf[0], scarf[1])
    leg(legs[0])
    arm(arms[0])
    stamp(cv, TORSO, *torso)
    leg(legs[1], True)
    stamp(cv, headrows or HEAD, *head)
    arm(arms[1], True)
    if sword:
        i, d = sword[0], sword[1]
        if hands[i]:
            blade(cv, hands[i][0], hands[i][1], d, *(sword[2:]))
    for rows, x, y in extra:
        stamp(cv, rows, x, y)
    close(cv)
    return cv


def to_img(cv, ground=None):
    """48×48 に、足元の輪郭（最も下の塗り）を y=45 に置く。横は塗りの中央を 24 に"""
    ys = [y for y in range(H) if any(c != '.' for c in cv[y])]
    xs = [x for x in range(W) if any(cv[y][x] != '.' for y in range(H))]
    bottom = OY + ground if ground is not None else max(ys)
    im = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    px = im.load()
    cx = (min(xs) + max(xs)) // 2
    for y in range(H):
        for x in range(W):
            ch = cv[y][x]
            if ch == '.':
                continue
            X, Y = x - cx + 24, y - bottom + 45
            if 0 <= X < 48 and 0 <= Y < 48:
                c = PAL[ch].lstrip('#')
                px[X, Y] = (int(c[:2], 16), int(c[2:4], 16), int(c[4:], 16), 255)
    return im


def rows_cv(rows):
    cv = canvas()
    stamp(cv, rows, 0, 0)
    close(cv)
    return cv
