"""背景（時計塔の廃墟の街道）と拠点（星の時計塔＋浮かぶ水晶）。480x270 で描いて最近傍で 2 倍。
bg() -> float32 (540,960,3) / base(img, t, hit_age, hp_k) -> img に直接描く"""
import math
import numpy as np
from PIL import Image, ImageDraw

W, H = 960, 540
w, h = 480, 270
_BG = None
_BASE = None


def _c(hexs):
    return tuple(int(hexs[i:i + 2], 16) for i in (1, 3, 5))


# 暗い青紫の階調（暗いほど青寄り、明るいほど赤紫寄りに色相をずらす）
SKY = [_c(x) for x in ('#0b0c1f', '#101028', '#16142f', '#1d1a38', '#26203f', '#2f2646', '#3a2c4b')]
FAR = [_c(x) for x in ('#14122a', '#1a1733', '#221d3a')]
MID = [_c(x) for x in ('#1a1630', '#231d3b', '#2c2445', '#372d4e')]
STONE = [_c(x) for x in ('#1b1a2c', '#232137', '#2c2942', '#373350', '#423d5c')]
GRASS = [_c(x) for x in ('#0c1220', '#111a2a', '#17233318'[:7], '#1e2d38')]

_B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def _dither_gradient(im, y0, y1, cols, x0=0, x1=w):
    """縦のグラデーションを 4x4 ディザの帯で塗る"""
    a = np.asarray(im).copy()
    n = len(cols)
    ys = np.arange(y0, y1)
    xs = np.arange(x0, x1)
    for yy in ys:
        v = (yy - y0) / max(1, y1 - y0 - 1) * (n - 1)
        i = min(n - 2, int(v))
        f = v - i
        row = _B4[yy % 4][xs % 4]
        pick = (f > row)
        for k, c in enumerate(cols[i:i + 2]):
            pass
        a[yy, x0:x1] = np.where(pick[:, None], cols[i + 1], cols[i])
    return Image.fromarray(a)


def _rng(s):
    return np.random.RandomState(s)


def _sky(im):
    im = _dither_gradient(im, 0, 190, SKY)
    d = ImageDraw.Draw(im)
    r = _rng(4)
    for _ in range(70):  # 星（上のほうほど多い）
        x = r.randint(0, w)
        y = int(abs(r.normal(0, 55)))
        if y > 130:
            continue
        c = r.choice([0, 1, 2])
        col = [(96, 96, 140), (130, 126, 170), (190, 180, 210)][c]
        d.point((x, y), fill=col)
    # 月（欠けた大きな月。くすんだ暖色）
    mx, my, mr = 352, 60, 26
    d.ellipse([mx - mr - 6, my - mr - 6, mx + mr + 6, my + mr + 6], fill=(52, 42, 72))
    d.ellipse([mx - mr - 3, my - mr - 3, mx + mr + 3, my + mr + 3], fill=(66, 54, 88))
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(150, 136, 160))
    d.ellipse([mx - mr + 3, my - mr + 3, mx + mr - 1, my + mr - 1], fill=(176, 160, 172))
    for (cx, cy, cr) in ((mx - 9, my - 6, 5), (mx + 8, my + 9, 4), (mx + 10, my - 12, 3)):
        d.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(128, 114, 146))
    # 雲の筋（暗い紫）
    for (cx, cy, L_) in ((90, 70, 70), (230, 104, 90), (400, 118, 60), (40, 130, 50)):
        for k in range(3):
            d.line([cx - L_ // 2 + k * 6, cy + k * 3, cx + L_ // 2 - k * 4, cy + k * 3], fill=(30 + k * 3, 26 + k * 2, 54 + k * 3))
    return im


def _clock_face(d, cx, cy, rr, col, hi):
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col)
    d.ellipse([cx - rr + 2, cy - rr + 2, cx + rr - 2, cy + rr - 2], fill=hi)
    d.line([cx, cy, cx, cy - rr + 3], fill=col)
    d.line([cx, cy, cx + rr - 4, cy + 2], fill=col)


def _far(im):
    d = ImageDraw.Draw(im)
    f0, f1, f2 = FAR
    # 遠い街並みのシルエット（霧で薄い）
    r = _rng(11)
    x = 0
    while x < w:
        bw = r.randint(10, 26)
        bh = r.randint(14, 44)
        d.rectangle([x, 176 - bh, x + bw, 186], fill=f0)
        if r.rand() < .5:  # 欠けた屋根
            d.polygon([(x, 176 - bh), (x + bw // 2, 176 - bh - r.randint(4, 9)), (x + bw, 176 - bh)], fill=f0)
        x += bw + r.randint(0, 5)
    # 遠い大きな時計塔
    tx, tb = 122, 186
    d.rectangle([tx - 14, tb - 118, tx + 14, tb], fill=f1)
    d.rectangle([tx - 18, tb - 126, tx + 18, tb - 112], fill=f1)
    d.polygon([(tx - 18, tb - 126), (tx, tb - 158), (tx + 18, tb - 126)], fill=f1)
    d.polygon([(tx - 3, tb - 158), (tx, tb - 170), (tx + 3, tb - 158)], fill=f1)
    d.rectangle([tx - 3, tb - 164, tx + 3, tb - 156], fill=f1)
    _clock_face(d, tx, tb - 96, 10, f2, (62, 52, 88))
    # 欠け（崩れた肩）と窓
    d.polygon([(tx + 14, tb - 118), (tx + 14, tb - 96), (tx + 8, tb - 108)], fill=SKY[5])
    for yy in (tb - 74, tb - 58, tb - 42):
        d.rectangle([tx - 3, yy, tx + 2, yy + 6], fill=f0)
    d.point((tx - 1, tb - 72), fill=(110, 90, 80))  # 遠くの灯り
    d.point((tx, tb - 40), fill=(110, 90, 80))
    # 淡い霧の帯（地平）
    a = np.asarray(im).astype(np.float32)
    for yy in range(150, 190):
        k = (1 - abs(yy - 178) / 28)
        if k > 0:
            a[yy] = a[yy] * (1 - .22 * k) + np.array([58, 46, 80]) * .22 * k
    return Image.fromarray(a.astype(np.uint8))


def _mid(im):
    d = ImageDraw.Draw(im)
    m0, m1, m2, m3 = MID
    gy = 188  # 中景の地面線

    def pillar(x, hgt, wd, broken=True, tilt=0):
        d.rectangle([x, gy - hgt, x + wd, gy], fill=m1)
        d.rectangle([x, gy - hgt, x + 1, gy], fill=m2)  # 左の光
        d.rectangle([x + wd - 1, gy - hgt, x + wd, gy], fill=m0)  # 右の影
        for yy in range(gy - hgt + 5, gy, 9):  # 目地
            d.line([x, yy, x + wd, yy], fill=m0)
        if broken:  # ぎざぎざの折れ口
            pts = [(x - 1, gy - hgt)]
            for i in range(0, wd + 3, 3):
                pts.append((x + i, gy - hgt - (2 if (i // 3) % 2 else 0) - 1))
            d.polygon(pts + [(x + wd + 1, gy - hgt + 3), (x - 1, gy - hgt + 3)], fill=m1)
        d.rectangle([x - 2, gy - 3, x + wd + 2, gy], fill=m2)  # 台座
        d.rectangle([x - 2, gy - 3, x + wd + 2, gy - 3], fill=m3)

    pillar(26, 52, 9)
    pillar(226, 74, 10)
    pillar(300, 34, 9)
    pillar(404, 62, 9)
    # 横たわる柱の欠片と崩れたアーチ
    d.rectangle([248, gy - 9, 286, gy - 1], fill=m1)
    d.rectangle([248, gy - 9, 286, gy - 8], fill=m2)
    for xx in (256, 270):
        d.line([xx, gy - 9, xx, gy - 1], fill=m0)
    d.arc([420, gy - 64, 470, gy - 16], 180, 270, fill=m2, width=4)
    # 錆びた歯車（半分埋もれる）
    for (gx, gy2, gr) in ((176, gy - 4, 16), (62, gy - 2, 10)):
        d.ellipse([gx - gr, gy2 - gr, gx + gr, gy2 + gr], fill=m1)
        for k in range(10):
            ang = k * math.pi / 5
            px, py = gx + math.cos(ang) * (gr + 2), gy2 + math.sin(ang) * (gr + 2)
            d.rectangle([px - 1, py - 1, px + 1, py + 1], fill=m1)
        d.ellipse([gx - gr + 4, gy2 - gr + 4, gx + gr - 4, gy2 + gr - 4], fill=m0)
        d.ellipse([gx - 2, gy2 - 2, gx + 2, gy2 + 2], fill=m2)
        d.arc([gx - gr, gy2 - gr, gx + gr, gy2 + gr], 200, 290, fill=m3)
    # 倒れた街灯
    d.line([326, gy - 2, 372, gy - 10], fill=m2, width=2)
    d.rectangle([370, gy - 14, 376, gy - 8], fill=m1)
    d.point((373, gy - 11), fill=(120, 92, 70))
    return im


def _lane(im):
    a = np.asarray(im).copy()
    d = ImageDraw.Draw(im)
    st = STONE
    # 奥の土手（道の上の縁）
    d.rectangle([0, 186, w, 189], fill=(24, 22, 38))
    d.line([0, 186, w, 186], fill=(40, 36, 58))
    # 石畳の道 y186〜218：上が暗く、手前が少し明るい
    for yy in range(190, 219):
        k = (yy - 190) / 28
        c = np.array(st[1]) * (1 - k) + np.array(st[2]) * k
        d.line([0, yy, w, yy], fill=tuple(int(v) for v in c))
    r = _rng(7)
    # 横の目地と縦の目地（石の列）
    rows = [190, 197, 204, 211, 218]
    for i in range(len(rows) - 1):
        y0, y1 = rows[i], rows[i + 1]
        d.line([0, y0, w, y0], fill=st[0])
        x = -r.randint(0, 20)
        while x < w:
            bw = r.randint(16, 34)
            d.line([x, y0, x, y1], fill=st[0])
            # 石の上面ハイライトと欠け
            sh = r.randint(0, 2)
            d.line([x + 1, y0 + 1, x + bw - 2, y0 + 1], fill=st[3 if sh else 2])
            if r.rand() < .25:
                px = x + r.randint(3, bw - 4)
                d.point((px, y0 + 3), fill=st[0])
                d.point((px + 1, y0 + 4), fill=st[0])
            if r.rand() < .12:  # 欠けた石（暗い穴）
                d.rectangle([x + 3, y0 + 2, x + 6, y0 + 4], fill=st[0])
            x += bw
    d.line([0, 218, w, 218], fill=st[0])
    d.line([0, 219, w, 219], fill=(52, 46, 72))
    # 手前の縁石
    d.rectangle([0, 220, w, 223], fill=(30, 27, 44))
    d.line([0, 220, w, 220], fill=(46, 42, 64))
    # 苔と草が道へはみ出す
    for _ in range(60):
        x = r.randint(0, w)
        yy = r.choice([190, 218, 219])
        d.point((x, yy), fill=(24, 40, 50))
        if r.rand() < .5:
            d.point((x + 1, yy - 1), fill=(32, 54, 62))
    return im


def _fore(im):
    d = ImageDraw.Draw(im)
    r = _rng(21)
    # 暗い草地（224〜270）。下の UI 帯で隠れる前提なので下ほど暗く
    for yy in range(224, 270):
        k = (yy - 224) / 46
        c = np.array((15, 20, 32)) * (1 - k) + np.array((8, 9, 18)) * k
        d.line([0, yy, w, yy], fill=tuple(int(v) for v in c))
    # 草の房（ぎざぎざ）
    for _ in range(120):
        x = r.randint(0, w)
        y = r.randint(222, 262)
        hgt = r.randint(3, 8)
        col = [(20, 34, 44), (26, 44, 54), (14, 24, 36)][r.randint(0, 3)]
        for dx in (-2, 0, 2):
            d.line([x + dx, y, x + dx + (dx // 2), y - hgt + abs(dx)], fill=col)
    # 道の縁を覆う草の縁
    for x in range(0, w, 2):
        hh = 2 + int(2 * abs(math.sin(x * .37) + math.sin(x * .11)))
        d.line([x, 223, x, 223 - hh // 2], fill=(20, 34, 44))
    # 瓦礫（四角い石・折れた梁）
    for (x, y, sz) in ((16, 240, 9), (60, 252, 6), (140, 246, 8), (210, 238, 5), (300, 250, 10), (372, 242, 6), (452, 248, 9)):
        d.polygon([(x, y), (x + sz, y - 2), (x + sz + 2, y + sz // 2), (x + 1, y + sz // 2 + 2)], fill=(38, 34, 54))
        d.line([x, y, x + sz, y - 2], fill=(62, 56, 82))
        d.line([x + 1, y + sz // 2 + 2, x + sz + 2, y + sz // 2], fill=(20, 18, 32))
    d.rectangle([90, 236, 124, 238], fill=(34, 30, 48))  # 折れた梁
    d.line([90, 236, 124, 236], fill=(56, 50, 74))
    # 小さな花（青白い）
    for _ in range(14):
        x, y = r.randint(0, w), r.randint(230, 262)
        d.point((x, y), fill=(120, 132, 190))
    return im


def bg():
    global _BG
    if _BG is None:
        im = Image.new('RGB', (w, h), SKY[0])
        im = _sky(im)
        im = _far(im)
        im = _mid(im)
        im = _lane(im)
        im = _fore(im)
        a = np.asarray(im).astype(np.float32) / 255.0
        # 下の UI 帯へ向けて暗く、全体はやや落とす
        yy = np.arange(h)[:, None, None]
        a = a * (1 - np.clip((yy - 224) / 60, 0, 1) * .25)
        # 道の帯の周りだけ、うっすら明るく（敵とセレスの足元が読める）
        a = np.repeat(np.repeat(a, 2, axis=0), 2, axis=1)  # 最近傍 2 倍
        _BG = np.ascontiguousarray(a * 0.92, dtype=np.float32)
    return _BG.copy()


# ------------------------------------------------------------ 拠点
def _tower():
    """星の時計塔の本体（RGBA, 1x ドット）。幅 34、高さ 76。足元が下端"""
    tw, th = 34, 76
    im = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    K = (14, 12, 28, 255)  # 輪郭
    S = [(38, 34, 62, 255), (54, 48, 86, 255), (76, 68, 112, 255), (104, 94, 140, 255)]
    G = [(120, 86, 40, 255), (190, 146, 70, 255), (236, 206, 130, 255)]  # 金の縁取り
    # 台座（二段）
    d.rectangle([0, th - 8, tw - 1, th - 1], fill=K)
    d.rectangle([1, th - 7, tw - 2, th - 2], fill=S[1])
    d.rectangle([1, th - 7, tw - 2, th - 7], fill=S[3])
    d.rectangle([1, th - 3, tw - 2, th - 2], fill=S[0])
    d.rectangle([4, th - 15, tw - 5, th - 8], fill=K)
    d.rectangle([5, th - 14, tw - 6, th - 9], fill=S[1])
    d.rectangle([5, th - 14, tw - 6, th - 14], fill=S[3])
    # 胴（石の柱）
    bx0, bx1 = 8, tw - 9
    d.rectangle([bx0 - 1, 18, bx1 + 1, th - 15], fill=K)
    d.rectangle([bx0, 18, bx1, th - 16], fill=S[1])
    d.rectangle([bx0, 18, bx0 + 3, th - 16], fill=S[2])
    d.rectangle([bx0, 18, bx0 + 1, th - 16], fill=S[3])
    d.rectangle([bx1 - 3, 18, bx1, th - 16], fill=S[0])
    for yy in range(26, th - 16, 7):  # 目地
        d.line([bx0 + 1, yy, bx1 - 1, yy], fill=S[0])
    # 金の帯（縁取り）
    for yy in (th - 24, 34):
        d.rectangle([bx0 - 2, yy, bx1 + 2, yy + 2], fill=K)
        d.rectangle([bx0 - 1, yy + 1, bx1 + 1, yy + 1], fill=G[1])
        d.line([bx0 - 1, yy + 1, bx0 + 3, yy + 1], fill=G[2])
    # 時計盤
    cx, cy = tw // 2, 46
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=K)
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=G[0])
    d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=(44, 38, 82, 255))
    for ang in range(0, 360, 90):
        d.point((cx + round(math.cos(math.radians(ang)) * 3), cy + round(math.sin(math.radians(ang)) * 3)), fill=G[2])
    d.line([cx, cy, cx, cy - 3], fill=G[2])
    d.line([cx, cy, cx + 2, cy + 1], fill=G[1])
    # 窓（光る）
    d.rectangle([cx - 2, th - 38 + 14, cx + 1, th - 38 + 20], fill=K)
    d.rectangle([cx - 1, th - 38 + 15, cx, th - 38 + 19], fill=(150, 170, 240, 255))
    # 上の屋根（尖塔の台）と四隅の飾り
    d.polygon([(bx0 - 3, 19), (cx, 4), (bx1 + 3, 19)], fill=K)
    d.polygon([(bx0 - 1, 18), (cx, 6), (bx1 + 1, 18)], fill=S[2])
    d.polygon([(cx, 6), (bx1 + 1, 18), (cx + 2, 18), (cx, 8)], fill=S[0])
    d.line([bx0 - 1, 18, cx, 6], fill=G[2])
    d.line([bx1 + 1, 18, cx, 6], fill=G[1])
    d.rectangle([bx0 - 3, 18, bx1 + 3, 20], fill=K)
    d.rectangle([bx0 - 2, 19, bx1 + 2, 19], fill=G[1])
    # 針（浮かぶ水晶を受ける細い先端）
    d.line([cx, 5, cx, 0], fill=K)
    d.point((cx, 2), fill=G[2])
    # 脇の小さな尖塔
    for sx in (1, tw - 4):
        d.rectangle([sx, th - 30, sx + 2, th - 15], fill=K)
        d.rectangle([sx + 1, th - 29, sx + 1, th - 16], fill=S[2])
        d.point((sx + 1, th - 31), fill=G[2])
    return im


def _crystal():
    """浮かぶ水晶（菱形。RGBA）。幅 18 高さ 34"""
    cw, ch = 18, 34
    im = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cw // 2
    top, mid, bot = 0, 14, ch - 1
    pts = [(cx, top), (cw - 1, mid), (cx, bot), (0, mid)]
    d.polygon(pts, fill=(20, 22, 60, 255))
    inner = [(cx, top + 2), (cw - 3, mid), (cx, bot - 2), (2, mid)]
    d.polygon(inner, fill=(70, 120, 226, 255))
    d.polygon([(cx, top + 2), (cx, bot - 2), (2, mid)], fill=(110, 170, 250, 255))  # 左半分が明るい
    d.polygon([(cx, top + 2), (cx - 1, mid - 2), (4, mid - 1)], fill=(190, 226, 255, 255))
    d.polygon([(cx, bot - 2), (cw - 3, mid), (cx, mid + 1)], fill=(48, 78, 180, 255))
    d.line([cx, top + 2, cx, bot - 2], fill=(150, 200, 255, 255))
    d.point((cx - 2, mid - 5), fill=(255, 255, 255, 255))
    d.point((cx - 2, mid - 4), fill=(235, 246, 255, 255))
    return im


def _glow_patch(r):
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1].astype(np.float32)
    return np.exp(-(xx * xx + yy * yy) / (2 * (r / 2.6) ** 2))


def _prep():
    global _BASE
    if _BASE is None:
        def up(im):
            a = np.asarray(im).astype(np.float32) / 255.0
            return np.ascontiguousarray(np.repeat(np.repeat(a, 2, axis=0), 2, axis=1))
        _BASE = dict(tower=up(_tower()), crystal=up(_crystal()), glow=_glow_patch(110))


def _put(img, spr, x0, y0, tint=0.0, add=0.0):
    sh, sw = spr.shape[:2]
    x0, y0 = int(x0), int(y0)
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(W, x0 + sw), min(H, y0 + sh)
    if xb <= xa or yb <= ya:
        return
    s = spr[ya - y0:yb - y0, xa - x0:xb - x0]
    rgb = s[..., :3]
    if tint > 0:  # 赤い被弾の光
        rgb = rgb * (1 - tint * .5) + np.array([1.0, .22, .2], np.float32) * tint * .55
    if add > 0:
        rgb = np.clip(rgb + add, 0, 1)
    al = s[..., 3:4]
    reg = img[ya:yb, xa:xb]
    img[ya:yb, xa:xb] = reg * (1 - al) + rgb * al


def _glow_add(img, cx, cy, col, k, r=110):
    g = _BASE['glow']
    gr = g.shape[0] // 2
    x0, y0 = int(cx) - gr, int(cy) - gr
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(W, x0 + g.shape[1]), min(H, y0 + g.shape[0])
    if xb <= xa or yb <= ya:
        return
    gg = g[ya - y0:yb - y0, xa - x0:xb - x0, None] * np.asarray(col, np.float32) * k
    reg = img[ya:yb, xa:xb]
    img[ya:yb, xa:xb] = 1 - (1 - reg) * (1 - np.clip(gg, 0, 1))


def base(img, t, hit_age, hp_k):
    _prep()
    cx, foot = 880, 410
    hit = max(0.0, 1.0 - hit_age / 0.2) if hit_age < 0.2 else 0.0
    shake = int(round(math.sin(hit_age * 70) * 4 * hit / 2)) * 2 if hit > 0 else 0  # 2px 単位で揺れる
    tower, crys = _BASE['tower'], _BASE['crystal']
    th, tw = tower.shape[:2]
    # 足元の影（楕円）
    yy, xx = np.mgrid[foot - 6:foot + 10, cx - 44:cx + 45]
    m = np.clip(1 - (((xx - cx) / 44.0) ** 2 + ((yy - (foot + 2)) / 8.0) ** 2), 0, 1)[..., None]
    reg = img[foot - 6:foot + 10, cx - 44:cx + 45]
    img[foot - 6:foot + 10, cx - 44:cx + 45] = reg * (1 - .5 * m)
    # 水晶の位置（上下にゆっくり。1 ドット単位で）
    bob = round(math.sin(t * 1.9) * 3) * 2
    ch = crys.shape[0]
    ty = foot - th
    cyy = ty - ch - 8 + bob
    ccx = cx + shake
    pulse = .5 + .5 * math.sin(t * 2.6)
    # 水晶の光（柔らかく）
    _glow_add(img, ccx, cyy + ch // 2, (.26, .5, 1.0), .5 + .22 * pulse + hit * .3)
    # 塔の窓・時計の淡い光
    _put(img, tower, cx - tw // 2 + shake, ty, tint=hit)
    _glow_add(img, cx + shake, ty + 92, (.4, .5, .9), .16 + .06 * pulse)
    _put(img, crys, ccx - crys.shape[1] // 2, cyy, tint=hit * .6, add=.05 * pulse)
    # 水晶の周りを回る小さな星屑（1 ドット）
    for i in range(3):
        a = t * 1.3 + i * 2.09
        px = int(ccx + math.cos(a) * 22) // 2 * 2
        py = int(cyy + ch // 2 + math.sin(a) * 9 + 4) // 2 * 2
        v = .6 + .4 * math.sin(t * 5 + i)
        img[py:py + 2, px:px + 2] = np.clip(img[py:py + 2, px:px + 2] + np.array([.6, .75, 1.0], np.float32) * v, 0, 1)
    # 被弾時の赤い閃光
    if hit > 0:
        _glow_add(img, cx + shake, ty + 80, (1.0, .15, .12), .45 * hit)
