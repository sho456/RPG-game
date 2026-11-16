"""リオ RS 風・第 4 版（1 ドットずつ手で置いた地図。部品の自動合成はやめた）
実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs4/rio.py
・骨組みは RS の 32×32 方眼（ユーザー提供・男の子の立ち）の実測に合わせる：
  頭 15 行（1〜15）・胴 8 行（16〜23）・脚 8 行（24〜31）、頭の幅 14、胴の幅 10。髪の房は内側の黒い線で描く（内側の黒 13% 前後）。
  目＝まぶた（黒）→ 瞳（濃い色）→ 虹彩（明るい色）、奥の目は顔の前端、間に肌 1、手前の目の後ろに白目 2 段。前髪の房が顔の前に 1 本出る
・デザイン（参考と変えた軸）：髪＝前へ流れる髪＋アホ毛＋手前の長い房（参考はとがった髪）／目＝琥珀（灯の色）／
  衣装＝赤い長いマフラー・紺の短いコート（金の縁）・腰の小さなランタン（参考は紫の服）／持ち物＝片手剣
・地図は 32 行（y=0 が上・y=31 が足元の輪郭）。48×48 のマスには足元 y=45 に置く"""
import math
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
PAL = {
    'o': '#1a1620',
    # 髪（金 5 段）
    '1': '#7a3c10', '2': '#c07a1c', '3': '#e8a82c', '4': '#ffd858', '5': '#fff4c0',
    # 肌 4 段
    's': '#ffd8bc', 't': '#ffad8c', 'u': '#e88870', 'v': '#b8604a',
    # 目（琥珀）
    'e': '#6a2c08', 'a': '#ffa030', 'W': '#f4f4f4',
    # マフラー（赤 4 段）
    'p': '#ff8a6c', 'R': '#e8383c', 'r': '#a8182c', 'x': '#5c0c1c',
    # コート（紺 4 段）
    'L': '#7a8ce0', 'C': '#4c56b0', 'c': '#33307c', 'k': '#221c48',
    # 金 3 段
    'G': '#fff0a0', 'g': '#e0a830', 'j': '#8a5a10',
    # ズボン 3 段
    'Q': '#8a88a8', 'P': '#5e5a78', 'q': '#38344c',
    # 靴 3 段
    'N': '#d09048', 'B': '#8a5228', 'b': '#4a2a14',
    # 鋼 4 段
    'V': '#ffffff', 'M': '#dfe6ff', 'm': '#9aa4c8', 'z': '#4a5070',
    # シャツ
    'w': '#eef0fa', 'n': '#b4bad6',
    # 灯
    'y': '#ffb040', 'Y': '#fff2b0',
}

# 立ち（左向き 3/4）。列 0 が前（敵の側）
STAND = [
    "...............",   # 0
    "......oo.......",   # 1  アホ毛
    ".....o4o.oo....",   # 2
    "...ooo3oo34oo..",   # 3
    "..o23o3443G32o.",   # 4  星のピン（G・g）
    ".o2344o344gGgo.",   # 5
    ".o234o34543g2o.",   # 6
    "o23o334o43322o.",   # 7
    ".o23o234o3221o.",   # 8
    ".o12o23s2o211o.",   # 9  前髪の房の間に額
    ".o1ou2ss2123o..",   # 10
    ".o1oosoo213o...",   # 11 まぶた（奥の目 1・手前の目と白目 2）
    "..ooeseW1s1o...",   # 12 瞳
    "...oasaWts1o...",   # 13 虹彩（琥珀）
    "...oussttto....",   # 14
    "....oustuoRo...",   # 15 顎・マフラー
    ".....oxRRRro....",          # 16
    "....oRpRRrrxRo...",         # 17
    "....ocgLCcoCCorRo",         # 18 コート（金の前立て）・腕・マフラーの尾
    "....ocgLCcoLCorxo",         # 19
    "....ojgygjoLCo.xo",         # 20 ベルトとランタン
    "....ocCYcCoCCo..o",         # 21
    "....oCgcCcogGo...",         # 22 袖口（金）
    "....oggjgjostuo..",         # 23 裾の縁・手
    ".....oooooutjo...",         # 24 柄
    ".....oPoQPojgmo..",         # 25
    ".....oPoQPoomMo..",         # 26
    ".....oPoQPo.omMo.",         # 27
    "....oNBoNBo..omVo",         # 28
    "...oNBBoNBBo..oo.",         # 29
    "...obbboBbbo.....",         # 30
    "....ooo.oooo.....",         # 31
]


# 正面：左半分（列 0〜7）を描いて写し、右半分は 1 段暗く（光は左上）。最後に左右非対称の部分を上書き
FRONT_HALF = [
    "........",   # 0
    "........",   # 1
    "....oooo",   # 2  てっぺんは丸く
    "..oo3445",   # 3
    ".o234554",   # 4
    ".o234543",   # 5
    "o2345o34",   # 6  房の黒い線
    "o23o3454",   # 7
    "o234o344",   # 8
    ".o2o4ss3",   # 9  前髪の房と額
    ".o2ossss",   # 10
    ".o121oos",   # 11 まぶた
    ".oo21Wes",   # 12 白目（外）・瞳（内）
    "..oo2tas",   # 13 虹彩
    "...o2tst",   # 14
    "...o2ous",   # 15 顎
    ".....oxR",   # 16 マフラー
    "....oRpR",   # 17
    "...oLCoR",   # 18 肩
    "..oLCogw",   # 19 腕・金の前立て・シャツ
    "..oLCogn",   # 20
    "..oCcojy",   # 21 ベルト（右はランタン）
    "..ogGocC",   # 22 袖口
    "..ostocC",   # 23 手
    "..otuogg",   # 24 裾の縁
    "....oQPo",   # 25 脚
    "....oQPo",   # 26
    "....oQPo",   # 27
    "....oPqo",   # 28
    "...oNBbo",   # 29
    "...obbbo",   # 30
    "....oooo",   # 31
]
DARKER = {'5': '4', '4': '3', '3': '2', '2': '1', 's': 't', 't': 'u', 'L': 'C', 'C': 'c', 'c': 'k', 'G': 'g', 'g': 'j',
          'Q': 'P', 'P': 'q', 'N': 'B', 'B': 'b', 'p': 'R', 'R': 'r', 'n': 'n', 'w': 'n'}


def mirror(half, keep=()):
    out = []
    for i, r in enumerate(half):
        right = ''.join(c if (i in keep or c in 'oeaWY.y') else DARKER.get(c, c) for c in r[::-1])
        out.append(r + right)
    return out


FRONT = mirror(FRONT_HALF)


def put(rows, y, x, txt):
    r = list(rows[y])
    for i, ch in enumerate(txt):
        if ch != ' ':
            r[x + i] = ch
    rows[y] = ''.join(r)


put(FRONT, 0, 7, 'o')           # アホ毛は 1 本
put(FRONT, 1, 6, 'o4o')
put(FRONT, 4, 11, 'G')          # 星のピン（右上）
put(FRONT, 5, 10, 'gGg')
put(FRONT, 6, 11, 'g')
put(FRONT, 21, 8, 'gj')         # ランタンは左（体の右）だけ。右は金のベルト
put(FRONT, 22, 7, 'Y')


# ---------------- ポーズ（頭は立ちの地図をそのまま使い、胴・腕・脚・マフラーを手で描いた部品で組む） ----------------
HEAD = STAND[0:16]
# 目を閉じる：まぶたと瞳の段を肌に、虹彩の段に黒の横線（奥の目 1・手前の目 2）
HEAD_SHUT = HEAD[:11] + [".o1ossss213o...", "..oossss1s1o...", "...oosoots1o..."] + HEAD[14:]
TORSO = [            # 列 4 から（立ちの 16〜23 行目から腕を除いたもの）
    ".oxRRRro",
    "oRpRRrrxo",
    "ocgLCcko",
    "ocgLCcko",
    "ojgygjko",
    "ocCYcCko",
    "oCgcCcko",
    "oggjgjgo",
]
# 腕：肩（列 10・胴の 2 行目）からの相対位置。'H' は手の中心（剣の柄の位置）
ARMS = {   # (列, 行, 地図, 頭の後ろに描くか)
    'hang': (10, 2, ["oCCo", "oLCo", "oLCo", "oCCo", "ogGo", "ostuo", ".uH."], False),
    'fwd':  (-1, 1, ["..ooooooooo.", "oHsgGLLCCCo.", "otuogCCccko.", ".ooo.ooooo.."], False),
    'up':   (9, -18, [".oo.", "oHso", "ostuo", "ogGo"] + ["oLCo"] * 12 + ["oCCo"], True),
    'back': (8, -1, ["....ooo", "...oHso", "..ogtuo", ".oLCgo.", "oLCCo..", ".ooo..."], False),
    'low':  (0, 2, ["....ooooo", "...oLLCCo", "..oLCCko.", ".ogGoo...", "oHso.....", "otuo.....", ".oo......"], False),
    'plant': (5, 3, ["oCCo", "oLCo", "oLCo", "ogGo", "oHso", "otuo"], False),
}
LEGS = {   # 列 3 から。最後の行が足元の輪郭
    'stand': ["..ooooo.", "..oPoQPo", "..oPoQPo", "..oPoQPo", ".oNBoNBo", "oNBBoNBBo", "obbboBbbo", ".ooo.oooo"],
    'wide':  ["..ooooooo", ".oPQo.oQPo", ".oPo...oQPo", "oPo.....oPo", "oNBo....oNBo", "oNBBo...oNBBo", "ooooo...ooooo"],
    'hop':   ["..oooooo", ".oPQooQPo", "oPo..oQPPoo", "oPo...ooNBBo", "oNBo...oNBbo", "oNBo....ooo.", ".oo........."],
    'lunge': ["..oooooo", ".oPQo.oQPPo", "oPQo....oQPo", "oPo......oPQo", "oNBo......oNBo", "oNBBo.....oNBBo", "ooooo.....ooooo"],
    'kneel': ["..ooooooo...", ".oPQPoQPPo..", "oPQPo.oQPPo.", "oPo...oQPPPoo", "oNBo..oPPPPNBo", "oNBBo.oooooNBo", "ooooo.....ooo."],
}
SCARF = {   # 首の後ろ（列 11・胴の 1 行目）から
    'hang': (11, 1, ["Ro", "rRo", "rxo", "xro", ".xo", "..o"]),
    'flow': (11, 0, ["RRro..", "rRRRro", ".xrRRRo", "..xxrRRo", "....oxxo"]),
    'up':   (11, -2, ["....oRo", "...oRro", "..oRrxo", ".oRrxo.", "oRro..."]),
}


def canvas(w=60, h=60):
    return [['.'] * w for _ in range(h)]


def stamp(cv, rows, x, y):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch not in '. ' and 0 <= y + j < len(cv) and 0 <= x + i < len(cv[0]):
                cv[y + j][x + i] = ch


DIRS8 = {'L': (-1, 0), 'UL': (-1, -1), 'U': (0, -1), 'UR': (1, -1), 'R': (1, 0), 'DR': (1, 1), 'D': (0, 1), 'DL': (-1, 1)}


def blade(cv, hx, hy, d, n=8):
    """剣（全ポーズで同じ形）：柄頭（金）・柄 2（j）・鍔 3（g G g、刃に直角）・刃 幅 2（M 芯・m 影）長さ n・先 V。
    向き d は 8 方向（DIRS8 のキー）だけ。角度を自由にすると刃の線が崩れるため"""
    dx, dy = DIRS8[d]
    px_, py_ = -dy, dx                     # 鍔の向き（刃に直角）
    sx, sy = (0, 1) if dy == 0 else (1, 0)  # 刃の影の側（下か右）
    cells = {}
    cells[(hx - 2 * dx, hy - 2 * dy)] = 'g'            # 柄頭
    cells[(hx - dx, hy - dy)] = 'j'
    cells[(hx, hy)] = 'j'
    gx, gy = hx + dx, hy + dy
    cells[(gx, gy)] = 'G'
    cells[(gx + px_, gy + py_)] = 'g'
    cells[(gx - px_, gy - py_)] = 'g'
    for k in range(2, n + 2):
        x, y = hx + dx * k, hy + dy * k
        cells[(x, y)] = 'V' if k == n + 1 else 'M'
        if k < n + 1:
            q = (x + sx, y + sy)
            if q not in cells:
                cells[q] = 'm'
    for (x, y), ch in cells.items():
        if 0 <= y < len(cv) and 0 <= x < len(cv[0]):
            cv[y][x] = ch


def close(cv):
    """外周を閉じる：塗りに接する空きのマスを黒に（部品の外に出た手・マフラーの先など）"""
    H, W = len(cv), len(cv[0])
    add = [(x + ox, y + oy) for y in range(H) for x in range(W) if cv[y][x] not in '.o'
           for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1))
           if 0 <= x + ox < W and 0 <= y + oy < H and cv[y + oy][x + ox] == '.']
    for x, y in add:
        cv[y][x] = 'o'


def build(head=None, arm='hang', legs='stand', scarf='hang', sword=None, hdx=0, hdy=0, dx=0, dy=0, lean=0):
    """sword＝(dx, dy, 長さ)：手から刃の向き。lean＝胴と頭を前（-）へずらす"""
    cv = canvas()
    ox, oy = 14 + dx, 22 + dy
    L = LEGS[legs]
    ly = oy + 16 + (8 - len(L))           # 脚が短い（膝を曲げる）ほど体が下がる
    by = ly - 8
    if scarf:
        sx, sy, rows = SCARF[scarf]
        stamp(cv, rows, ox + sx + lean, by + sy)
    stamp(cv, L, ox + 3, ly)
    stamp(cv, TORSO, ox + 4 + lean, by)
    hand = None
    ax, ay, rows, behind = ARMS[arm] if arm else (0, 0, [], False)
    if behind:
        stamp(cv, rows, ox + ax + lean, by + ay)
    stamp(cv, head or HEAD, ox + hdx + lean, by - 16 + hdy)
    if arm:
        if not behind:
            stamp(cv, rows, ox + ax + lean, by + ay)
        for j, r in enumerate(rows):
            if 'H' in r:
                hand = (ox + ax + lean + r.index('H'), by + ay + j)
                cv[hand[1]][hand[0]] = 's'
    if sword and hand:
        blade(cv, hand[0], hand[1], sword)
    close(cv)
    return [''.join(r) for r in cv], oy + 23 - min(0, dy) * 0 + (0 if dy >= 0 else 0)


def down():
    """気絶：横倒し。頭が後ろ（右）、足が前（左）。高さ 14・幅 31"""
    return [
        "...................oo.ooo.......",
        "..................o34o4554o.....",
        ".................o3443o4455o....",
        "...........oooo.o23443o4434o....",
        "..oo......oxRRro.o2343344443o...",
        ".oNBo....oRRpRro.ooo2o344432o...",
        "oNBBoooooocgLCco.ousso.o23332o..",
        "oNBoQPPPocgLLCcko.oossWeo3221o..",
        "obboQPQPojgygjgko..ottsas.o21o..",
        ".ooooPPPPoCYcCcko.oouuts.ooo....",
        "....ooooooggjjggo..oooooo.......",
        ".........ooo.oooo.oVMMMmmmgjo...",
        "...................ooooooooo....",
    ]


POSE_DEF = {
    '構え1': dict(arm='fwd', legs='wide', scarf='flow', sword='UL', lean=-1),
    '構え2': dict(arm='fwd', legs='wide', scarf='flow', sword='UL', lean=-1, hdy=1),
    '選択': dict(arm='fwd', legs='hop', scarf='up', sword='L', lean=-2, dy=-1),
    '振りかぶり': dict(arm='up', legs='wide', scarf='flow', sword='UR'),
    '溜め': dict(head=HEAD_SHUT, arm='back', legs='wide', scarf='flow', sword='R', lean=1),
    '斬り': dict(arm='low', legs='lunge', scarf='up', sword='DL', lean=-2),
    '振り抜き': dict(arm='low', legs='lunge', scarf='up', sword='L', lean=-3, hdy=1),
    '被弾': dict(head=HEAD_SHUT, arm='back', legs='stand', scarf='hang', sword='DR', lean=2, hdx=1),
    '瀕死': dict(head=HEAD_SHUT, arm='plant', legs='kneel', scarf='hang', sword='D', lean=-1, hdy=3),
    '勝利': dict(head=HEAD_SHUT, arm='up', legs='stand', scarf='flow', sword='U'),
}


def render(rows, foot=45, x0=8):
    if isinstance(rows, tuple):          # build() の結果：(行, 足元の行)。キャンバスの列 6 が立ちの列 0
        rows, frow = rows
        im = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
        px = im.load()
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch == '.':
                    continue
                c = PAL[ch].lstrip('#')
                X, Y = x0 - 14 + x, foot - frow + y
                if 0 <= X < 48 and 0 <= Y < 48:
                    px[X, Y] = (int(c[:2], 16), int(c[2:4], 16), int(c[4:], 16), 255)
        return im
    im = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    px = im.load()
    h = len(rows)
    # 最後の行が空いていれば無視（足元＝最後の塗りの行の 1 つ下の輪郭）
    while rows and not rows[-1].strip('.'):
        rows = rows[:-1]
    h = len(rows)
    top = foot - h + 1
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.':
                continue
            c = PAL[ch].lstrip('#')
            X, Y = x0 + x, top + y
            if 0 <= X < 48 and 0 <= Y < 48:
                px[X, Y] = (int(c[:2], 16), int(c[2:4], 16), int(c[4:], 16), 255)
    return im


POSES = {'立ち': STAND, '正面': FRONT}
POSES.update({k: build(**v) for k, v in POSE_DEF.items()})
POSES['気絶'] = down()
try:
    import hand as _H
    for _k in ('FRONT',):
        pass
    POSES['正面'] = _H.FRONT
    POSES.update(getattr(_H, 'EXTRA', {}))
except ImportError:
    pass   # 下の行が輪郭＝地面より 4 上に置く（render の foot を 41 に）

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    ims = {k: render(v) for k, v in POSES.items()}
    for k, im in ims.items():
        im.save(os.path.join(OUT, k + '.png'))
    W, cols = 48 * 5, 6
    sheet = Image.new('RGBA', (W * cols, W * ((len(ims) + cols - 1) // cols)), (232, 234, 240, 255))
    for i, im in enumerate(ims.values()):
        sheet.alpha_composite(im.resize((W, W), Image.NEAREST), ((i % cols) * W, (i // cols) * W))
    sheet.save(os.path.join(OUT, 'preview.png'))
