"""リオ第 6 版：構え・コマンド選択を「関節の位置＋太さ」で組む（手足が細い棒にならないように）
・手足は太さのある筒（太もも 4・すね 3・腕 3）。上・前の側を明るく、下・後ろを暗く。外周は最後に黒で閉じる
・頭と胴は手描きの地図（rio.py の HEAD・TORSO）。剣は rio.blade（8 方向の同じ形）
・関節の位置は実機のコマンド選択（rsref3/03）と構え（r5/02・rsref/06）から読み取った（立ちの頭の左上＝(0,0)、列は右へ、行は下へ）"""
import math
import rio

SHADE = {'coat': ('L', 'C', 'c'), 'pants': ('Q', 'P', 'q'), 'skin': ('s', 't', 'u')}


def tube(cv, a, b, r, mat, ox, oy):
    """a→b の筒（半径 r）。法線が上か左を向く側を明るく"""
    hi, mid, lo = SHADE[mat]
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    if nx + ny > 0:                    # 法線を「上・左」側へ向ける
        nx, ny = -nx, -ny
    for y in range(int(min(y0, y1) - r - 1), int(max(y0, y1) + r + 2)):
        for x in range(int(min(x0, x1) - r - 1), int(max(x0, x1) + r + 2)):
            t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / (L * L)))
            px_, py_ = x0 + dx * t, y0 + dy * t
            d = math.hypot(x - px_, y - py_)
            if d <= r:
                side = (x - px_) * nx + (y - py_) * ny
                ch = hi if side > r * .35 else lo if side < -r * .35 else mid
                X, Y = ox + x, oy + y
                if 0 <= Y < len(cv) and 0 <= X < len(cv[0]):
                    cv[Y][X] = ch


def stamp(cv, rows, x, y, ox, oy):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch != '.':
                X, Y = ox + x + i, oy + y + j
                if 0 <= Y < len(cv) and 0 <= X < len(cv[0]):
                    cv[Y][X] = ch


BOOT_L = ["..oBBo", ".NBBBbo", "oNnBbbo", "obbbbbo"]          # つま先が左（前）
BOOT_DOWN = [".oBBo", "oNBBo", "oNBbo", ".oNbo", "..oo."]     # つま先が下（跳んで地面につく）
HAND = ["st", "tu"]
CUFF = 'g'


def figure(head, torso_at, legs, arms, scarf, sword=None, head_at=(0, 0), back_first=True):
    """legs / arms：[(関節の列…), …]。最初が奥（後ろ）の手足、2 つ目が手前。sword＝(手の番号, 向き)"""
    W, H = 60, 60
    ox, oy = 14, 22
    cv = [['.'] * W for _ in range(H)]
    # 奥の脚・奥の腕 → 胴 → 手前の脚 → 頭 → 手前の腕（重なりの順）
    sx, sy, srows = scarf
    stamp(cv, srows, sx, sy, ox, oy)
    def leg(l):
        hip, knee, ank, boot = l
        tube(cv, hip, knee, 2.0, 'pants', ox, oy)
        tube(cv, knee, ank, 1.6, 'pants', ox, oy)
        b = BOOT_L if boot == 'L' else BOOT_DOWN
        stamp(cv, b, ank[0] - (3 if boot == 'L' else 2), ank[1] - 1, ox, oy)
    hands = []
    def arm(a):
        sh, el, hd = a
        tube(cv, sh, el, 1.6, 'coat', ox, oy)
        tube(cv, el, hd, 1.5, 'coat', ox, oy)
        cx, cy = hd
        cv[oy + cy][ox + cx] = CUFF
        hx, hy = round(cx + (hd[0] - el[0]) * .4), round(cy + (hd[1] - el[1]) * .4)
        stamp(cv, HAND, hx - 1, hy - 1, ox, oy)
        hands.append((ox + hx, oy + hy))
    leg(legs[0])
    arm(arms[0])
    stamp(cv, TORSO, torso_at[0], torso_at[1], ox, oy)
    leg(legs[1])
    stamp(cv, head, head_at[0], head_at[1], ox, oy)
    arm(arms[1])
    if sword:
        i, d = sword
        rio.blade(cv, hands[i][0], hands[i][1], d)
    # 外周を黒で閉じる
    add = [(x + a, y + b) for y in range(H) for x in range(W) if cv[y][x] not in '.o'
           for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + a < W and 0 <= y + b < H and cv[y + b][x + a] == '.']
    for x, y in add:
        cv[y][x] = 'o'
    bottom = max(y for y in range(H) if any(c != '.' for c in cv[y]))
    return [''.join(r) for r in cv], bottom


TORSO = [            # 立ちの 16〜23 行（腕を除く・列 4 から）。肩を 1 列広げる
    "..oxRRRro.",
    ".oRpRRrrxo",
    "oLcgLCcko.",
    "oLcgLCcko.",
    "ojggygjko.",
    "oCcCYcCko.",
    "oCgcCcCko.",
    "oggjgjggo.",
]
SC_FLOW = ["RRro...", "rRRRro..", ".xrRRRo.", "..xxrRRo", "....oxxo"]
SC_UP = ["....oRo", "...oRro", "..oRrxo", ".oRrxo.", "oRro..."]


def ready(breath=0):
    """構え：膝を曲げ足を開く（高さ 0.93）・上体を前へ・前の腕で剣を斜め上に。手足は体の近くにまとめる"""
    hy = 3 + breath
    return figure(
        rio.HEAD[1:16], (3, 15 + hy - 1), legs=[
            ((10, 22 + hy), (12, 25 + hy), (13, 28), 'L'),          # 奥の脚：後ろへ開く
            ((7, 22 + hy), (5, 25 + hy), (4, 28), 'L'),             # 手前の脚：前へ曲げる
        ], arms=[
            ((11, 17 + hy), (13, 20 + hy), (12, 22 + hy)),           # 奥の腕：腰へ
            ((6, 17 + hy), (4, 20 + hy), (2, 19 + hy)),             # 手前の腕：前で剣を持つ
        ], scarf=(10, 15 + hy, SC_FLOW), sword=(1, 'UL'), head_at=(-1, hy - 1))


def select():
    """コマンド選択：前へ跳び出す。手前の脚を前下へ蹴り出し、奥の脚は膝から下ろしてつま先で地面。腕は前後に"""
    d = 2
    return figure(
        rio.HEAD[1:16], (3, 15 + d), legs=[
            ((10, 22 + d), (12, 25 + d), (11, 28), 'D'),              # 奥の脚：膝から下ろす（つま先）
            ((7, 22 + d), (4, 24 + d), (2, 27), 'L'),                 # 手前の脚：前下へ蹴り出す
        ], arms=[
            ((11, 17 + d), (14, 19 + d), (15, 17 + d)),               # 奥の腕：後ろへ振る
            ((6, 17 + d), (3, 19 + d), (1, 18 + d)),                  # 手前の腕：前へ（剣は前）
        ], scarf=(10, 13 + d, SC_UP), sword=(1, 'L'), head_at=(-2, -1 + d))


POSES = {'構え1': ready(0), '構え2': ready(1), '選択': select()}
