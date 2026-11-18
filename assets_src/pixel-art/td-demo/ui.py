"""TD デモの UI：hud(img, st) と coin(L, img, x, y, age, c)。
絵（枠・アイコン・顔・コイン・手袋）は最初の 1 回だけ作ってキャッシュ。毎コマは合成だけ。"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'celes-hd', 'demo'))
import fxcore as X  # noqa: E402
from fxcore import GOLD, VIO, CYAN, WHITE, RED, blob, star, paste, clamp, eout, ein, seg  # noqa: E402

W, H = X.W, X.H
BTN = 72
BY = 452                       # ボタンの上端
BX = [128, 224, 320]           # ボタンの左端（終焉の針は少し大きい）
ULT = 'shuuen'
COIN_XY = (852, 22)            # 所持金のコインの位置


def _a(im):
    return np.asarray(im.convert('RGBA')).astype(np.float32) / 255


def _up(im, k=2):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def _pix(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


# ------------------------------------------------------------------ アイコン（36x36 のドットを 2 倍）
def _line(d, p0, p1, col):
    d.line([p0, p1], fill=col, width=1)


def _icon_tokiya():
    """刻の矢：時計の針の形の矢が右上へ"""
    im, d = _pix(36, 36)
    ink, gold, hi, vio, dp = (24, 14, 50, 255), (255, 200, 80, 255), (255, 246, 190, 255), (160, 100, 255, 255), (110, 60, 200, 255)
    # 矢の軸（左下→右上）
    for i in range(0, 22):
        x, y = 5 + i, 30 - i
        d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=ink)
    for i in range(0, 22):
        x, y = 5 + i, 30 - i
        d.point((x, y), fill=gold)
        d.point((x + 1, y), fill=hi if i % 3 == 0 else gold)
    # やじり
    d.polygon([(33, 3), (21, 6), (30, 15)], fill=ink)
    d.polygon([(31, 5), (24, 7), (29, 12)], fill=hi)
    d.polygon([(30, 6), (26, 8), (29, 10)], fill=gold)
    # 羽根（針の尾）
    d.polygon([(2, 33), (3, 24), (9, 29)], fill=ink)
    d.polygon([(3, 31), (4, 26), (7, 29)], fill=vio)
    d.polygon([(2, 33), (12, 34), (7, 29)], fill=ink)
    d.polygon([(3, 33), (9, 33), (7, 30)], fill=dp)
    # 小さな文字盤（左上）
    d.ellipse([3, 3, 15, 15], fill=ink)
    d.ellipse([4, 4, 14, 14], fill=(60, 40, 130, 255))
    d.ellipse([5, 5, 13, 13], outline=gold)
    d.line([(9, 9), (9, 6)], fill=hi)
    d.line([(9, 9), (12, 10)], fill=hi)
    for (x, y) in [(9, 5), (13, 9), (9, 13), (5, 9)]:
        d.point((x, y), fill=hi)
    return _a(_up(im))


def _icon_slow():
    """クロノスロウ：時計と下向き矢印"""
    im, d = _pix(36, 36)
    ink, gold, hi, vio, dp, cy = (24, 14, 50, 255), (255, 200, 80, 255), (255, 246, 190, 255), (160, 100, 255, 255), (70, 40, 150, 255), (110, 200, 255, 255)
    d.ellipse([3, 2, 28, 27], fill=ink)
    d.ellipse([5, 4, 26, 25], fill=gold)
    d.ellipse([7, 6, 24, 23], fill=dp)
    d.ellipse([8, 7, 23, 22], fill=(96, 60, 190, 255))
    d.arc([5, 4, 26, 25], 200, 300, fill=hi)
    for k in range(12):
        a = k * math.pi / 6
        x, y = 15.5 + math.cos(a) * 9.2, 14.5 + math.sin(a) * 9.2
        d.point((int(x), int(y)), fill=hi if k % 3 == 0 else gold)
    d.line([(15, 14), (15, 8)], fill=hi, width=1)
    d.line([(16, 14), (20, 17)], fill=hi, width=1)
    d.rectangle([14, 13, 16, 15], fill=gold)
    # 下向き矢印（右下・青）
    d.polygon([(25, 20), (35, 20), (30, 34)], fill=ink)
    d.polygon([(26, 21), (34, 21), (30, 31)], fill=cy)
    d.polygon([(28, 22), (32, 22), (30, 27)], fill=(210, 240, 255, 255))
    d.rectangle([28, 12, 32, 21], fill=ink)
    d.rectangle([29, 12, 31, 21], fill=cy)
    # 雪の粒のような遅れの印
    for (x, y) in [(31, 5), (34, 9), (2, 30)]:
        d.point((x, y), fill=cy)
    return _a(_up(im))


def _icon_shuuen():
    """終焉の針：巨大な針と星"""
    im, d = _pix(38, 38)
    ink, gold, hi, vio, dp, rd = (24, 14, 50, 255), (255, 200, 80, 255), (255, 246, 190, 255), (170, 110, 255, 255), (90, 40, 180, 255), (255, 90, 120, 255)
    # 大きな針（縦、上が先）
    d.polygon([(19, 0), (25, 24), (19, 37), (13, 24)], fill=ink)
    d.polygon([(19, 2), (23, 23), (19, 34), (15, 23)], fill=vio)
    d.polygon([(19, 2), (19, 34), (15, 23)], fill=dp)
    d.line([(19, 4), (19, 30)], fill=hi)
    d.polygon([(19, 2), (20, 12), (19, 10)], fill=hi)
    # つば
    d.rectangle([9, 24, 29, 26], fill=ink)
    d.rectangle([10, 25, 28, 25], fill=gold)
    d.rectangle([17, 23, 21, 27], fill=ink)
    d.rectangle([18, 24, 20, 26], fill=rd)
    # 星
    def st(cx, cy, r, c):
        d.polygon([(cx, cy - r), (cx + 1, cy - 1), (cx + r, cy), (cx + 1, cy + 1), (cx, cy + r),
                   (cx - 1, cy + 1), (cx - r, cy), (cx - 1, cy - 1)], fill=c)
    st(7, 8, 6, ink)
    st(7, 8, 5, gold)
    st(7, 8, 2, hi)
    st(31, 12, 4, ink)
    st(31, 12, 3, gold)
    st(30, 33, 3, ink)
    st(30, 33, 2, hi)
    st(6, 31, 3, ink)
    st(6, 31, 2, gold)
    return _a(_up(im))


ICON = None


def _frame(size, ult):
    """ボタンの枠と内側（暗い星空）"""
    s = size
    im, d = _pix(s // 2, s // 2)
    n = s // 2
    ink = (14, 8, 30, 255)
    d.rectangle([1, 0, n - 2, n - 1], fill=ink)
    d.rectangle([0, 1, n - 1, n - 2], fill=ink)
    inner = (44, 26, 92, 255) if not ult else (62, 28, 120, 255)
    d.rectangle([2, 2, n - 3, n - 3], fill=inner)
    for y in range(2, n - 2):  # 下へ明るく
        t = (y - 2) / (n - 4)
        c = tuple(int(a + (b - a) * t) for a, b in zip(inner[:3], (20, 14, 52)))
        d.line([(2, y), (n - 3, y)], fill=c + (255,))
    d.rectangle([2, 2, n - 3, 2], fill=(150, 110, 240, 255) if not ult else (255, 200, 90, 255))
    rng = np.random.RandomState(7 if ult else 3)
    for _ in range(7 if ult else 4):
        d.point((int(rng.randint(3, n - 3)), int(rng.randint(3, n - 3))), fill=(220, 210, 255, 255))
    return _up(im)


def _build():
    global ICON, FR, ANG, EDGE, GLOVE, RING_COIN, FACE_CACHE
    ICON = {'tokiya': _icon_tokiya(), 'slow': _icon_slow(), 'shuuen': _icon_shuuen()}
    FR = {}
    ANG = {}
    EDGE = {}
    for k in ICON:
        ult = k == ULT
        sz = 84 if ult else BTN
        FR[k] = _a(_frame(sz, ult))
        yy, xx = np.mgrid[0:sz, 0:sz].astype(np.float32)
        a = np.arctan2(xx - (sz - 1) / 2, -(yy - (sz - 1) / 2))  # 上が 0、時計回り
        ANG[k] = (np.where(a < 0, a + 2 * math.pi, a) / (2 * math.pi)).astype(np.float32)
        m = FR[k][..., 3]
        e = np.zeros_like(m)
        e[:3, :] = 1
        e[-3:, :] = 1
        e[:, :3] = 1
        e[:, -3:] = 1
        EDGE[k] = (e * m)[..., None]
    # コイン 4 コマ（回転）：幅 10→6→2→6
    RING_COIN = []
    for wd in (10, 7, 3, 7):
        im, d = _pix(12, 12)
        cx = 6
        hw = wd // 2
        d.ellipse([cx - hw - 1, 0, cx + hw, 11], fill=(40, 20, 10, 255))
        d.ellipse([cx - hw, 1, cx + hw - 1, 10], fill=(255, 190, 50, 255))
        if hw >= 2:
            d.ellipse([cx - hw + 1, 2, cx + hw - 2, 9], fill=(255, 224, 110, 255))
            d.rectangle([cx - 1, 4, cx, 7], fill=(200, 130, 30, 255))
            d.point((cx - hw + 1, 3), fill=(255, 255, 230, 255))
        else:
            d.rectangle([cx - 1, 2, cx, 9], fill=(255, 224, 110, 255))
        RING_COIN.append(_a(_up(im)))
    # 手袋の指カーソル 12x15
    G = [
        "....KK......",
        "...KWWK.....",
        "...KWWK.....",
        "...KWWK.....",
        "...KWWKKK...",
        "...KWWKWWKK.",
        ".KKKWWKWWKWK",
        "KWWKWWWWWKWK",
        "KWWWWWWWWWWK",
        ".KWWWWWWWWWK",
        ".KWWWWWWWWWK",
        "..KWWWWWWWK.",
        "..KSWWWWWSK.",
        "...KWWWWWK..",
        "...KKKKKKK..",
    ]
    im, d = _pix(12, 15)
    pal = {'K': (30, 20, 50, 255), 'W': (255, 255, 255, 255), 'S': (190, 190, 225, 255)}
    for y, row in enumerate(G):
        for x, ch in enumerate(row):
            if ch in pal:
                d.point((x, y), fill=pal[ch])
    GLOVE = _a(_up(im))
    FACE_CACHE = {}


_built = False
_NUM = {}
_TXT = {}


def _face(style):
    k = '案1' in style
    if k not in FACE_CACHE:
        here = os.path.join(HERE, '..')
        if k:
            im = Image.open(os.path.join(here, 'celes-48', 'sprites', 'celes48_front.png')).convert('RGBA')
            crop = im.crop((7, 2, 43, 38))      # 36x36
        else:
            im = Image.open(os.path.join(here, 'celes-hd', 'sprites', 'celes_hd_front.png')).convert('RGBA')
            crop = im.crop((14, 2, 54, 42))     # 40x40 → 36 に近い
            crop = crop.crop((2, 2, 38, 38))
        face = _a(_up(crop, 2))                 # 72x72
        # 窓：暗い紫の背景＋金の縁
        s = 76
        im2, d = _pix(s // 2, s // 2)
        n = s // 2
        d.rectangle([1, 0, n - 2, n - 1], fill=(14, 8, 30, 255))
        d.rectangle([0, 1, n - 1, n - 2], fill=(14, 8, 30, 255))
        d.rectangle([1, 1, n - 2, n - 2], fill=(255, 200, 80, 255))
        d.rectangle([2, 2, n - 3, n - 3], fill=(14, 8, 30, 255))
        d.rectangle([3, 3, n - 4, n - 4], fill=(52, 34, 104, 255))
        fr = _a(_up(im2))
        out = fr.copy()
        fh, fw = face.shape[:2]
        oy, ox = (s - fh) // 2, (s - fw) // 2
        reg = out[oy:oy + fh, ox:ox + fw]
        # 縁の内側だけ顔を重ねる
        inner = np.zeros((s, s), bool)
        inner[6:s - 6, 6:s - 6] = True
        al = face[..., 3:4] * inner[oy:oy + fh, ox:ox + fw, None]
        out[oy:oy + fh, ox:ox + fw] = reg * (1 - al) + face * al
        out[oy:oy + fh, ox:ox + fw, 3:4] = np.maximum(reg[..., 3:4], al)
        FACE_CACHE[k] = out
    return FACE_CACHE[k]


def _btn_pos(i):
    ult = i == 2
    sz = 84 if ult else BTN
    x = BX[i] + (0 if i < 2 else 12)
    y = BY - (10 if ult else 0)
    return x, y, sz


_SP = {}


def _sprite(key, fn):
    """Text に描いた内容を、描いた範囲だけの絵にして覚える。(絵, 左, 上, 幅)"""
    if key not in _SP:
        T = X.Text()
        fn(T)
        bb = T.im.getbbox()
        if bb is None:
            _SP[key] = (None, 0, 0, 0)
        else:
            _SP[key] = (_a(T.im.crop(bb)), bb[0], bb[1], bb[2] - bb[0])
    return _SP[key]


def _put(img, key, cx, cy, fn, abs_=False):
    spr = _sprite(key, fn)
    if spr[0] is None:
        return
    if abs_:
        paste(img, spr[0], spr[1], spr[2])
    else:   # fn は (480,270) 付近に描く前提ではなく、名前は中心基準で描く
        paste(img, spr[0], cx - spr[0].shape[1] / 2, cy - spr[0].shape[0] / 2)


def _paste_sp(img, spr, _x, cy, ox, oy, right):
    """metal を (ox, oy) 中心に描いた絵を、右端 right・縦中心 cy に置く"""
    if spr[0] is None:
        return
    h, w = spr[0].shape[:2]
    paste(img, spr[0], right - w, cy - h / 2)


def _name(T, name, ready):
    col = (255, 226, 140, 255) if ready else (190, 180, 220, 255)
    f = X.font(X.FONT_JA, 12)
    T.d.text((480, 270), name, font=f, fill=(10, 4, 24, 255), anchor='mm', stroke_width=2, stroke_fill=(10, 4, 24, 255))
    T.d.text((480, 270), name, font=f, fill=col, anchor='mm')


def _wave(T, wave):
    wv, wn = wave
    T.metal('WAVE', 62, 23, 17, 1.0, (235, 225, 255), (170, 130, 255), sw=3)
    T.metal(f'{wv}', 124, 22, 26, 1.0, (255, 255, 255), (255, 200, 80), sw=4)
    T.metal(f'/{wn}', 154, 25, 16, 1.0, (210, 200, 235), (150, 120, 210), sw=3)


def _label(T, lab):
    sf = X.font(X.FONT_JA, 12)
    T.d.text((952, 531), lab, font=sf, fill=(10, 4, 24, 255), anchor='rm', stroke_width=2, stroke_fill=(10, 4, 24, 255))
    T.d.text((952, 531), lab, font=sf, fill=(200, 190, 235, 255), anchor='rm')


# ------------------------------------------------------------------ HUD
def hud(img, st):
    global _built
    if not _built:
        _build()
        _built = True
    t = st['t']
    # ---- 帯（上・下）
    top = img[:44]
    img[:44] = top * .38 + np.array([.05, .03, .12], np.float32) * .62
    img[44:46] = img[44:46] * .6 + np.array([1, .78, .3], np.float32) * .4 * .5
    bot = img[448:]
    img[448:] = bot * .34 + np.array([.04, .02, .10], np.float32) * .66
    img[448:450] = img[448:450] * .5 + np.array([1, .78, .3], np.float32) * .5 * .6

    # ---- 顔
    fc = _face(st.get('style', ''))
    paste(img, fc, 28, 456)

    # ---- 技ボタン
    L = None
    fingers = []
    for i, s in enumerate(st['skills']):
        k = s['key']
        x, y, sz = _btn_pos(i)
        ult = k == ULT
        pa = s['press_age']
        pressed = 0.0
        if 0.2 <= pa < 0.5:
            pressed = math.sin(clamp((pa - .2) / .3) * math.pi)
        dy = int(round(3 * pressed))
        fr = FR[k]
        base = fr.copy()
        ic = ICON[k]
        ih, iw = ic.shape[:2]
        oy, ox = max(0, (sz - ih) // 2), max(0, (sz - iw) // 2)
        ia = ic[..., 3:4]
        base[oy:oy + ih, ox:ox + iw, :3] = base[oy:oy + ih, ox:ox + iw, :3] * (1 - ia) + ic[..., :3] * ia
        cd = s['cd']
        ready = s['ready']
        if not ready:
            rem = (ANG[k] >= cd)[..., None] * fr[..., 3:4]
            base[..., :3] = base[..., :3] * (1 - rem * .72) + np.array([.02, .01, .08], np.float32) * rem * .72
            # 針の先（境目）を細く光らせる
            band = ((ANG[k] >= cd) & (ANG[k] < cd + .012))[..., None] * fr[..., 3:4]
            base[..., :3] = np.maximum(base[..., :3], band * np.array([.9, .8, 1.0], np.float32))
            base[..., :3] *= (1 - pressed * .0)
        else:
            pulse = .5 + .5 * math.sin(t * (7.0 if ult else 5.0) + i)
            e = EDGE[k]
            if ult:
                col = np.array([1, .86, .45], np.float32)
                base[..., :3] = base[..., :3] * (1 - e) + col * e * (.7 + .3 * pulse)
                # 内側の金の縁（二重）
                base[4:-4, 4:-4, :3] = base[4:-4, 4:-4, :3] + 0
            else:
                col = np.array([1, .8, .35], np.float32)
                base[..., :3] = base[..., :3] * (1 - e) + col * e * (.55 + .45 * pulse)
            if L is None:
                L = np.zeros((H, W, 3), np.float32)
            blob(L, x + sz / 2, y + sz / 2, sz * (.62 if ult else .5), GOLD, (.26 + .22 * pulse) * (1.5 if ult else 1))
            if ult:
                # きらめく星
                for j in range(3):
                    ph = (t * .9 + j / 3) % 1
                    sx = x + 8 + (j * 31 + 11) % (sz - 16)
                    sy = y + 6 + ((j * 17) % (sz - 14))
                    star(L, sx, sy, 7 * math.sin(ph * math.pi), WHITE, .9)
                star(L, x + sz - 6, y + 6, 9 + 3 * pulse, GOLD, .9)
        # 押された直後の白い光り
        if 0.2 <= pa < 0.55:
            fl = (1 - clamp((pa - .2) / .35)) * .6
            base[..., :3] = base[..., :3] + fl * fr[..., 3:4]
        base[..., 3] = fr[..., 3]
        # 凹み：暗く
        base[..., :3] *= (1 - .25 * pressed)
        if pressed > 0:
            # 影の枠が内側へ
            pass
        # 影
        sh = np.zeros_like(fr)
        sh[..., 3] = fr[..., 3] * .5
        paste(img, sh, x + 2, y + 4)
        paste(img, base, x, y + dy)
        # 波紋
        if 0.22 <= pa < 0.7:
            rk = (pa - .22) / .48
            if L is None:
                L = np.zeros((H, W, 3), np.float32)
            X.ring(L, x + sz / 2, y + sz / 2 + dy, sz * (.4 + .6 * eout(rk)), sz * (.4 + .6 * eout(rk)), 2.5, WHITE, (1 - rk) * .9)
            X.ring(L, x + sz / 2, y + sz / 2 + dy, sz * (.3 + .45 * eout(rk)), sz * (.3 + .45 * eout(rk)), 1.5, GOLD, (1 - rk) * .8)
        if 0 <= pa < .6:
            fingers.append((x, y, sz, pa))

    # ---- 文字（小さな絵にしてキャッシュ。毎コマの全画面合成を避ける）
    for i, s in enumerate(st['skills']):
        x, y, sz = _btn_pos(i)
        ready = s['ready']
        ty = 532 if i < 2 else 534
        _put(img, ('nm', s['name'], ready), x + sz / 2, ty, lambda T, s=s, ready=ready: _name(T, s['name'], ready))
    gold = int(st['gold'])
    ga = st.get('gold_gain_age', -1)
    bump = 0.0
    if 0 <= ga < .25:
        bump = math.sin(ga / .25 * math.pi)
    sz_n = int(26 + 7 * bump)
    hot = bump >= .3
    spr = _sprite(('gold', gold, sz_n, hot), lambda T: T.metal(f'{gold}', 100, 30, sz_n, 1.0, (255, 255, 255),
                                                               (255, 236, 150) if hot else (255, 200, 80), sw=4))
    _paste_sp(img, spr, 944 - 100 + 100 - spr[3] // 2 - spr[1] + spr[1] - 100 + 100 - 0, 24 - 2 * bump, 100, 30, right=944)
    _put(img, ('wave', st['wave']), 0, 0, lambda T: _wave(T, st['wave']), abs_=True)
    lab = st.get('style', '')
    _put(img, ('lab', lab), 0, 0, lambda T: _label(T, lab), abs_=True)

    # ---- 拠点 HP の帯（上の帯の真ん中）
    hp = clamp(st.get('base_hp', 1.0))
    bx0, bx1, by0, by1 = 300, 660, 14, 30
    ov = Image.new('RGBA', (W, 44), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.rectangle([bx0 - 2, by0 - 2, bx1 + 2, by1 + 2], fill=(14, 8, 30, 255))
    od.rectangle([bx0, by0, bx1, by1], fill=(48, 24, 52, 255))
    fw = int((bx1 - bx0) * hp)
    cr = (80, 220, 140) if hp > .5 else ((255, 190, 60) if hp > .25 else (255, 70, 90))
    cr2 = tuple(int(c * .6) for c in cr)
    if fw > 0:
        od.rectangle([bx0, by0, bx0 + fw, by1], fill=cr2 + (255,))
        od.rectangle([bx0, by0, bx0 + fw, by0 + 6], fill=cr + (255,))
        od.rectangle([bx0, by0, bx0 + fw, by0 + 1], fill=tuple(min(255, c + 70) for c in cr) + (255,))
    for q in range(1, 10):
        od.line([(bx0 + (bx1 - bx0) * q // 10, by0), (bx0 + (bx1 - bx0) * q // 10, by1)], fill=(14, 8, 30, 120))
    # 拠点（小さな塔）アイコン
    od.polygon([(268, 30), (268, 14), (272, 14), (272, 10), (276, 10), (276, 14), (280, 14), (280, 30)], fill=(14, 8, 30, 255))
    od.polygon([(270, 30), (270, 16), (278, 16), (278, 30)], fill=(190, 160, 255, 255))
    od.rectangle([273, 22, 275, 30], fill=(60, 40, 120, 255))
    ovm = np.asarray(ov).astype(np.float32) / 255
    img[:44] = img[:44] * (1 - ovm[..., 3:4]) + ovm[..., :3] * ovm[..., 3:4]

    # コインの絵（所持金の隣）
    cf = RING_COIN[int(t * 8) % 4] if False else RING_COIN[0]
    cs = 1.0 + .35 * bump
    paste(img, cf, COIN_XY[0] - 12, COIN_XY[1] - 12 - 2 * bump)
    if bump > 0:
        if L is None:
            L = np.zeros((H, W, 3), np.float32)
        blob(L, COIN_XY[0], COIN_XY[1], 20, GOLD, .9 * bump)
        star(L, COIN_XY[0], COIN_XY[1], 18 * bump, WHITE, .9 * bump)

    # ---- 光の合成
    if L is not None:
        img = 1 - (1 - img) * (1 - np.clip(L * .9, 0, 1))

    # ---- 指のカーソル（光の上）
    for (x, y, sz, pa) in fingers:
        cx, cy = x + sz * .5, y + sz * .5
        if pa < .2:
            k = eout(pa / .2, 2)
            fx = cx + 40 * (1 - k)
            fy = cy + 10 + 46 * (1 - k)
            al = clamp(pa / .06)
        else:
            tp = clamp((pa - .2) / .1)
            dip = math.sin(tp * math.pi) * 5 if pa < .3 else 0
            fx, fy = cx, cy + 10 + dip
            al = 1 - seg(pa, .4, .6)
        if al > 0:
            paste(img, GLOVE, fx - 6, fy - 4, alpha=al)

    # ---- WAVE CLEAR
    ca = st.get('clear_age', -1)
    if ca >= 0:
        img = _clear(img, ca)
    return np.clip(img, 0, 1)


def _clear(img, ca):
    k = eout(clamp(ca / .3), 3)
    out_a = 1 - seg(ca, 3.2, 3.7)
    if out_a <= 0:
        return img
    a = k * out_a
    cy = 250
    hh = 62 * k
    y0, y1 = int(cy - hh), int(cy + hh)
    band = img[y0:y1]
    img[y0:y1] = band * (1 - .72 * a) + np.array([.04, .02, .10], np.float32) * .72 * a
    img[y0:y0 + 2] = np.array([1, .8, .35], np.float32) * a + img[y0:y0 + 2] * (1 - a)
    img[y1 - 2:y1] = np.array([1, .8, .35], np.float32) * a + img[y1 - 2:y1] * (1 - a)
    T = X.Text()
    off = (1 - k) * 220
    T.metal('WAVE CLEAR', 480 + off, cy, 64, a, (255, 255, 255), (255, 190, 60), sw=6, glowc=(255, 190, 60))
    T.metal('時の波を退けた', 480 - off, cy + 44, 20, a, (230, 220, 255), (170, 130, 255), sw=4, path=X.FONT_JA)
    img = T.over(img)
    L = np.zeros((H, W, 3), np.float32)
    if ca < 1.2:
        X.burst(L, 480, cy, ca, 18, 5, sp=360, life=1.0, col=GOLD, kind='spark', grav=60)
        for j in range(5):
            ph = clamp((ca - .15 * j) / .7)
            if 0 < ph < 1:
                star(L, 240 + j * 120 + (j % 2) * 10, cy - 46 + (j % 3) * 46, 16 * math.sin(ph * math.pi), GOLD, .9)
    img = 1 - (1 - img) * (1 - np.clip(L, 0, 1))
    return img


# ------------------------------------------------------------------ コイン
def _plus(n):
    if n not in _NUM:
        f = X.font(X.FONT_NUM, 15)
        im = Image.new('RGBA', (60, 24), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.text((30, 12), f'+{n}', font=f, fill=(255, 236, 150, 255), anchor='mm', stroke_width=3, stroke_fill=(30, 12, 50, 255))
        d.text((30, 12), f'+{n}', font=f, fill=(255, 236, 150, 255), anchor='mm')
        _NUM[n] = _a(im)
    return _NUM[n]


def coin(L, img, x, y, age, c=None):
    global _built
    if not _built:
        _build()
        _built = True
    c = c or {}
    seed = int(c.get('seed', 0))
    rng = np.random.RandomState(seed * 13 + 5)
    dx = rng.uniform(-26, 26)
    up = rng.uniform(34, 52)
    land = rng.uniform(-4, 10)
    tx, ty = COIN_XY
    t1, t2 = .5, .9
    if age < 0 or age > 1.4:
        return
    if age < t1:
        k = age / t1
        px = x + dx * eout(k, 2)
        py = y - 14 + 4 * 0 - up * 4 * k * (1 - k) + land * k * k
        sx, sy = px, py
    elif age < t2:
        k = (age - t1) / (t2 - t1)
        ex = x + dx
        ey = y - 14 + land
        cx_, cy_ = (ex + tx) / 2 - 40, min(ey, ty) - 70
        kk = ein(k, 2)
        sx = (1 - kk) ** 2 * ex + 2 * (1 - kk) * kk * cx_ + kk * kk * tx
        sy = (1 - kk) ** 2 * ey + 2 * (1 - kk) * kk * cy_ + kk * kk * ty
    else:
        # 到着の小さな光
        k = (age - t2) / .25
        if k < 1:
            blob(L, tx, ty, 12 * (1 - k), GOLD, .8 * (1 - k))
        return
    frame = RING_COIN[int(age * 14 + seed) % 4]
    al = 1.0
    sc_ok = 1.0
    if age >= t2 - .08:
        al = 1.0
    paste(img, frame, sx - 12, sy - 12, alpha=al)
    blob(L, sx, sy, 9, GOLD, .35)
    # 尾（吸い込み中）
    if age >= t1:
        for j in range(1, 4):
            kk = max(0.0, (age - t1 - j * .02) / (t2 - t1))
            kk = ein(clamp(kk), 2)
            tx2 = (1 - kk) ** 2 * (x + dx) + 2 * (1 - kk) * kk * ((x + dx + tx) / 2 - 40) + kk * kk * tx
            ty2 = (1 - kk) ** 2 * (y - 14 + land) + 2 * (1 - kk) * kk * (min(y - 14 + land, ty) - 70) + kk * kk * ty
            blob(L, tx2, ty2, 5 - j, GOLD, .35 / j)
    # +金額
    n = c.get('n')
    if n is not None and age < .75:
        ta = 1 - seg(age, .4, .75)
        paste(img, _plus(n), x - 30, y - 38 - 14 * eout(age / .4), alpha=ta)
