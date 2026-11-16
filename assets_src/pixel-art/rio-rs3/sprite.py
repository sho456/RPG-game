"""リオ RS 風・第 3 版（rs-style-sprite 第 3 版の規格で 1 から描いた試作）
実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs3/sprite.py
・部品（頭・体・マフラーの尾・剣）を地図で描き、合成のあとに
  ①前の部品に接する後ろの部品の 1 ドットを、その素材のいちばん暗い段にする（内側の境目）
  ②シルエットの外周に純黒の 1 ドット線を付ける（外の輪郭）
・設計シート（rs-style-sprite 7 章）
  型：補色型（髪 金 45° ／ コート 紺 235°）＋差し色 赤（マフラー）
  段：髪 5・肌 4・マフラー 4・コート 4・金 3・ズボン 3・靴 3・鋼 4・灯 2 → 32 色
  髪：外はねの短髪、前髪 4 房、動く部品＝長いマフラーの尾、髪飾り＝金の星のピン（頭頂の奥）
  胴：赤いマフラー → 金の前立て → 金のベルトと腰の小さな灯（ランタン）／袖口：金／裾：金の縁取り／靴：茶
  持ち物：片手剣（刃は鋼、柄は金）
  性格：灯守見習いのまっすぐな少年 → 構えは重心を前に、コマンド選択は高めに跳ぶ
  破る決まり：腰のランタンだけは輪郭の内側に光の色（灯の見せ場）"""
import math
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
CELL, FOOT = 48, 44          # FOOT＝足の塗りの最下段（その下 45 が輪郭）

# ---------- パレット（文字 → 色・素材） ----------
P = {
    # 髪（金 5 段：1 が暗い。陰は赤茶、光はクリームの白）
    '1': '#6a3410', '2': '#b8701c', '3': '#e8a82c', '4': '#ffd858', '5': '#fff6c8',
    # 肌 4 段
    'z': '#b8604a', 'S': '#e8907a', 's': '#ffc4a4', 'h': '#ffe8d6',
    # 目
    'o': '#000000', 'i': '#2a7cff', 'W': '#ffffff',
    # マフラー（赤 4 段）
    'x': '#5c0c1c', 'r': '#a8182c', 'R': '#e8383c', 'p': '#ff8a6c',
    # コート（紺 4 段：陰は紫へ、光は青へ）
    'k': '#241e46', 'c': '#3a3a7c', 'C': '#5660b0', 'L': '#8a9ce0',
    # 金 3 段
    'j': '#8a5a10', 'g': '#e0a830', 'G': '#fff0a0',
    # ズボン 3 段
    'q': '#3a3448', 'P': '#5e5a72', 'Q': '#8a88a0',
    # 靴 3 段
    'b': '#4a2a14', 'B': '#8a5228', 'n': '#c88a48',
    # 鋼 4 段
    'v': '#4a5070', 'm': '#9aa4c8', 'M': '#dfe6ff', 'V': '#ffffff',
    # 灯（ランタンの光）
    'y': '#ffb040', 'Y': '#fff2b0',
}
MAT = {}
for k in '12345':
    MAT[k] = 'hair'
for k in 'zShs':
    MAT[k] = 'skin'
for k in 'xrRp':
    MAT[k] = 'scarf'
for k in 'kcCL':
    MAT[k] = 'coat'
for k in 'jgG':
    MAT[k] = 'gold'
for k in 'qPQ':
    MAT[k] = 'pants'
for k in 'bBn':
    MAT[k] = 'boot'
for k in 'vmMV':
    MAT[k] = 'steel'
for k in 'oiWyY':
    MAT[k] = 'eye'
DARK = {'hair': '1', 'skin': 'z', 'scarf': 'x', 'coat': 'k', 'gold': 'j', 'pants': 'q', 'boot': 'b', 'steel': 'v'}


def rgb(ch):
    c = P[ch].lstrip('#')
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)


# ---------- 頭（左向き 3/4。13 行。目＝まぶた 9・瞳 10・虹彩 11、顎 12。x=2 が顔の前端） ----------
HEAD = [
    "......4...4.....",
    ".....454.3g4.2..",
    "....3455.gGg423.",
    "...34555434g4322",
    "..34555434544321",
    ".344444324443221",
    "..3442432343221.",
    "..242s4s32s3221.",
    "..3hs2shs2s32211",
    "..sosoossS32221.",
    "..sosoWssS32221.",
    "..sisiWsSS3221..",
    "...ssSSzS3221...",
]
# 目を閉じる（被弾・勝利・溜めの集中）：まぶたと瞳の段を肌に、虹彩の段に横 2 の黒
HEAD_SHUT = HEAD[:9] + [
    "..shsshssS32221.",
    "..ssssssSS32221.",
    "..soosoosS3221..",
] + HEAD[12:]
# 正面（左右対称・目の間に肌 2・白目は外側）
HEAD_FRONT = [
    "......4..g4.......",
    ".....345.gGg4.....",
    "....34555g5543....",
    "...3455544555443..",
    "..344444444444443.",
    "..3443443443443443",
    "..344s4s4s4s4s4443",
    "..344shsshsshs4443",
    "..344soossoosS4443",
    "..34ssWossoWsS4443",
    "..34sssississsS443",
    "...34ssssssssS43..",
    "....2SssSSssS2....",
]
HEAD_FRONT = [r.replace('w', 'W') for r in HEAD_FRONT]

# ---------- 体（胴・腕・脚。x は体の地図の中。H＝手（剣の柄）の位置） ----------
TORSO = [   # 胴 9 行（マフラー 2・コート 3・ベルト 1・コートの下 2・裾 1）。腕は各ポーズで足す
    "...xRRRRrx....",
    "..pRRpRRrrx...",
    "..LCgLCCcckx..",
    "..LCgLCCcck...",
    "..CCgCCCcck...",
    "..gjgggggjk...",
    "..CcCyCcck....",
    "..CgCYcCcck...",
    "..gggggjjgg...",
]
def T(*edits):
    """胴の地図に (行, 列, 文字列) を上書きした写し"""
    rows = [list(r) for r in TORSO]
    for (y, x, txt) in edits:
        for i, ch in enumerate(txt):
            if 0 <= x + i < len(rows[y]):
                rows[y][x + i] = ch
    return [''.join(r) for r in rows]
LEGS = {
    'stand': ["...PQPqPPq...", "...PQPqPPq...", "...PQPqPPq...", "...PQq.PPq...", "..nBb..nBb...", ".nBBb.nBBb..."],
    'wide':  ["..PQPqPPq....", "..PQPq.PPq...", ".PQPq...PPq..", ".PQq.....Pq..", "nBb.....nBb..", "nBBb....nBBb."],
    'hop':   ["..PQPqPPq....", ".PQPq..PPqq..", ".PQq....qPPnB", "..Bb.....bBB.", "..n..........", ],
    'lunge': ["..PQPqPPq....", ".PQPq...PPq..", "PQPq.....PPq.", "PQq.......PPq", "Bb........nBb", "BBb......nBBb"],
    'tuck':  ["..PQPPqq.....", ".PQPqPPqnB...", "..nBBbBBb....", "...nb........"],
    'kneel': ["..PQPPPPq....", ".PQPq.qPPq...", "nBBb..qPQq...", "nBBbb.nBBBb.."],
    'dive':  ["...PQPq......", "...PQPqq.....", "....PQq......", "....Bb.......", "....nb......."],
}
# 腕（手前の腕）：胴の上に重ねる (行, 列, 文字列)。手は肌 2×2（h・s / S・z）
ARM = {
    'side':  [(2, 1, 'L'), (3, 1, 'L'), (4, 1, 'C'), (5, 1, 'g'), (6, 0, 'hs'), (7, 0, 'Sz')],
    'fwd':   [(2, 0, 'LL'), (3, 0, 'gC'), (2, -2, 'hs'), (3, -2, 'Sz')],
    'up':    [(2, 1, 'L'), (1, 0, 'L'), (0, -1, 'Lg'), (-1, -3, 'hs'), (-2, -3, 'Sz')],
    'back':  [(2, 10, 'LC'), (1, 11, 'g'), (0, 11, 'hs'), (-1, 11, 'Sz')],
    'low':   [(3, 1, 'L'), (4, 0, 'LC'), (5, 0, 'g'), (6, -1, 'hs'), (7, -1, 'Sz')],
    'plant': [(3, 1, 'L'), (4, 1, 'L'), (5, 0, 'gL'), (6, 0, 'hs'), (7, 0, 'Sz')],
}
SCARF = {
    'hang': ["rx", "Rr", "rx", "Rx", ".x"],
    'flow': ["rRRpp.", ".xrRRp", "...xrR", ".....x"],
    'up':   ["..pR", ".pRr", "pRrx", "Rr..", "r..."],
    'fall': ["rx", "Rx", "rRx", ".rx", "..x"],
}

def blit(canvas, rows, ox, oy, layer, owner):
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in '. ':
                continue
            X, Y = ox + x, oy + y
            if 0 <= X < CELL and 0 <= Y < CELL:
                canvas[(X, Y)] = (ch, layer, owner)


def line_px(x0, y0, ang, ln):
    """角度（度。0＝左＝敵側、90＝上）の方向へ ln ドットの線"""
    a = math.radians(ang)
    dx, dy = -math.cos(a), -math.sin(a)
    pts, seen = [], set()
    for i in range(ln * 3):
        t = i / 3
        p = (round(x0 + dx * t), round(y0 + dy * t))
        if p not in seen:
            seen.add(p)
            pts.append(p)
    return pts, (dx, dy)


def sword(canvas, hx, hy, ang, ln=13, layer=9):
    """柄（金）→ 鍔 → 刃（鋼。芯は明るく、片側を暗く）"""
    pts, (dx, dy) = line_px(hx, hy, ang, ln)
    back, _ = line_px(hx, hy, ang + 180, 2)
    for p in back[1:]:
        canvas[p] = ('j', layer, 'sword')
    for i, p in enumerate(pts):
        if i == 0:
            canvas[p] = ('g', layer, 'sword')
        elif i == 1:
            canvas[p] = ('G', layer, 'sword')
            canvas[(p[0] - round(dy), p[1] + round(dx))] = ('g', layer, 'sword')
            canvas[(p[0] + round(dy), p[1] - round(dx))] = ('j', layer, 'sword')
        else:
            canvas[p] = ('V' if i == len(pts) - 1 or i % 5 == 2 else 'M', layer, 'sword')
            q = (p[0] + round(dy), p[1] - round(dx))
            if q not in canvas or canvas[q][2] != 'sword':
                canvas[q] = ('m' if i < len(pts) - 1 else 'M', layer, 'sword')


def finish(canvas, extra=None):
    """内側の境目（後ろの部品の暗い段）→ 外の輪郭（純黒）→ 画像"""
    out = dict(canvas)
    for (x, y), (ch, lay, own) in canvas.items():
        m = MAT.get(ch)
        if m not in DARK:
            continue
        for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = canvas.get((x + d[0], y + d[1]))
            if q and q[1] > lay and MAT.get(q[0]) != m and q[0] != 'o':
                out[(x, y)] = ('o' if q[1] >= 5 else DARK[m], lay, own)
                break
    for (x, y) in list(canvas):
        for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + d[0], y + d[1])
            if q not in canvas and 0 <= q[0] < CELL and 0 <= q[1] < CELL:
                out[q] = ('o', -1, 'line')
    im = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    px = im.load()
    for (x, y), (ch, _, _) in out.items():
        if 0 <= x < CELL and 0 <= y < CELL:
            px[x, y] = rgb(ch)
    for (x, y, col) in (extra or []):   # 輪郭の外に描くもの（剣の残像・きらめき）
        if 0 <= x < CELL and 0 <= y < CELL:
            px[x, y] = col
    return im


def pose(head=HEAD, hx=14, hy=None, torso_dx=5, arm='side', legs='stand', scarf='hang', sw=(-62, 10), lift=0,
         lean=0, smear=None, glint=None, hands=None, head_dy=0):
    """頭の左上 (hx, hy)。体＝胴＋腕＋脚。sw＝(剣の角度, 長さ) か None。lift＝体ごと持ち上げ（跳ぶ）"""
    cv = {}
    L = LEGS[legs]
    body = T(*ARM[arm]) if arm else TORSO[:]
    if hy is None:
        hy = FOOT - len(L) - len(body) - 13 + 1 - lift
    bx, by = hx + torso_dx + lean, hy + 13
    ly = by + len(body)
    if scarf:
        blit(cv, SCARF[scarf], bx + 10, by + 1, 1, 'scarf')
    blit(cv, L, bx, ly, 2, 'legs')
    blit(cv, body, bx, by, 3, 'body')
    # 腕が胴の外（上・前）に出る分
    for (y, x, txt) in ARM.get(arm, []):
        if y < 0 or x < 0:
            for i, ch in enumerate(txt):
                cv[(bx + x + i, by + y)] = (ch, 6, 'arm')
    blit(cv, head, hx + lean // 2, hy + head_dy, 5, 'head')
    if sw:
        hand = {'side': (0, 6), 'fwd': (-2, 2), 'up': (-3, -1), 'back': (11, -1), 'low': (-1, 6), 'plant': (0, 6)}[arm]
        sword(cv, bx + hand[0], by + hand[1], sw[0], sw[1])
    return finish(cv, (smear or []) + (glint or []))


def arc(cx, cy, r, a0, a1, w=2, col=(255, 255, 255, 255)):
    """剣の残像（三日月）：中心 (cx,cy)、半径 r、角度 a0→a1（度。0＝左、90＝上）。輪郭なし"""
    pts = []
    for k in range(int(abs(a1 - a0) * 1.5) + 1):
        a = math.radians(a0 + (a1 - a0) * k / max(1, int(abs(a1 - a0) * 1.5)))
        th = w * math.sin(math.pi * k / max(1, int(abs(a1 - a0) * 1.5)))  # 真ん中が太い
        for t in range(int(round(th)) + 1):
            pts.append((round(cx - math.cos(a) * (r - t)), round(cy - math.sin(a) * (r - t)), col))
    return pts


DOWN = [   # 気絶：横倒し（足が前＝左、頭が後ろ＝右）。高さ 12＋輪郭・幅 28＋輪郭
    "......................4.4...",
    "...............xRr...345434.",
    "..............pRRRr.34555443",
    "........qPq.CCgLLCRr34544432",
    "..nb...PQPqCCgCLLCCr44434322",
    ".nBBb.PQPPqCgCCLLCckr4s4s422",
    "nBBBbPQPPqgjgggygjgck.osos42",
    "nBBb.PQPqqCCcCYcCcck.hsisiS2",
    ".nBbqPPqq.CgcCccccck.sssSSz.",
    "..bb.qq...ggggjjgggj..Szz...",
    "................gGmMMMMMVV..",
    "................j...........",
]


def pose_down():
    cv = {}
    blit(cv, DOWN, 9, FOOT - len(DOWN) - 3, 3, 'body')
    return finish(cv)


def build():
    F = {}
    F['立ち'] = pose()
    F['正面'] = pose(head=HEAD_FRONT, hx=15, torso_dx=2, arm='side', sw=None, scarf=None)
    F['構え1'] = pose(arm='fwd', legs='wide', scarf='flow', sw=(28, 11), lean=-1)
    F['構え2'] = pose(arm='fwd', legs='wide', scarf='flow', sw=(28, 11), lean=-1, hy=FOOT - 6 - 9 - 13 + 2)
    F['選択'] = pose(arm='fwd', legs='hop', scarf='up', sw=(10, 11), lean=-2, lift=1)
    F['振りかぶり'] = pose(arm='up', legs='wide', scarf='flow', sw=(100, 11))
    F['溜め'] = pose(head=HEAD_SHUT, arm='back', legs='wide', scarf='flow', sw=(180, 11), lean=1,
                   glint=[(41, 30, (255, 255, 255, 255)), (40, 30, (255, 240, 170, 255)), (41, 29, (255, 240, 170, 255))])
    F['斬り'] = pose(arm='low', legs='wide', scarf='up', sw=(-35, 11), lean=-2,
                   smear=arc(18, 32, 13, 120, -20, 2) + arc(18, 32, 11, 110, -10, 1, (255, 236, 160, 255)))
    F['振り抜き'] = pose(arm='low', legs='lunge', scarf='up', sw=(-12, 12), lean=-3, hy=FOOT - 6 - 9 - 13 + 3)
    F['跳躍'] = pose(arm='up', legs='tuck', scarf='up', sw=(65, 12), lift=9)
    F['降下斬り'] = pose(arm='low', legs='dive', scarf='up', sw=(-88, 13), lift=6)
    F['被弾'] = pose(head=HEAD_SHUT, hx=18, arm='back', legs='stand', scarf='fall', sw=(200, 9), lean=2, torso_dx=3)
    F['瀕死'] = pose(head=HEAD_SHUT, hx=12, arm='plant', legs='kneel', scarf='fall', sw=(-90, 7), torso_dx=6, head_dy=3)
    F['気絶'] = pose_down()
    F['勝利'] = pose(head=HEAD_SHUT, arm='up', legs='stand', scarf='flow', sw=(75, 12))
    return F


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    ims = build()
    for k, im in ims.items():
        im.save(os.path.join(OUT, k + '.png'))
    W, cols = CELL * 6, 8
    sheet = Image.new('RGBA', (W * cols, W * ((len(ims) + cols - 1) // cols)), (42, 47, 68, 255))
    for i, im in enumerate(ims.values()):
        sheet.alpha_composite(im.resize((W, W), Image.NEAREST), ((i % cols) * W, (i // cols) * W))
    sheet.save(os.path.join(OUT, 'preview.png'))
