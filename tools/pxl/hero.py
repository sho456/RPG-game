"""味方キャラクター用の小型リグ（RS系：48×48セル・全高約30ドット・2頭身・左向きが基準）。
 ・頭（髪・顔・帽子）はキャラごとの手打ちドット（文字グリッド）。表情は目・口のドットを差し替える
 ・胴・腕・脚は関節位置から描く（2〜3ドット幅）。衣装の縁取り・ベルト・装飾は手置き
 ・武器は別レイヤ（装備の素材で刃の色が変わるため、パレットのスロットに割り当てる）"""
import math
from core import *
from kit import *

def ik(ax, ay, bx, by, l1, l2, bend):
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy) or 1e-6; mx = l1 + l2 - .01
    if d > mx: dx *= mx / d; dy *= mx / d; d = mx; bx, by = ax + dx, ay + dy
    a = (l1 * l1 - l2 * l2 + d * d) / (2 * d); hh = math.sqrt(max(0, l1 * l1 - a * a)); ux, uy = dx / d, dy / d
    return (ax + ux * a - uy * hh * bend, ay + uy * a + ux * hh * bend), (bx, by)

D0 = dict(hip=(0, 0), lean=0, crouch=0, head=(0, 0), fF=(-2.5, 0), fB=(2.5, 0), hF=(-3, 4), hB=(2, 5),
          wa=70, wb=0, face='n', noW=False, sw=0, br=0, fx=0)
B0 = dict(leg=8.5, tor=5.6, shw=2.7, hipw=1.5, arm=7.0, legr=(1.6, 1.35, 1.2), armr=(1.35, 1.15))

SKIN = ['#8a4a40', '#d08a6c', '#f4ba92', '#ffdcc0']

class Rig:
    def __init__(s, c, pose=None, B=None):
        s.c = c; P = dict(D0); P.update(pose or {}); s.P = P
        b = dict(B0); b.update(B or {}); s.B = b
        ox, oy = c.ax, c.ay; s.ox, s.oy = ox, oy
        hipx, hipy = ox + P['hip'][0], oy - b['leg'] + P['hip'][1] + P['crouch']
        ln = math.radians(P['lean']); sn, cs = math.sin(ln), math.cos(ln)
        chx, chy = hipx - sn * b['tor'], hipy - cs * b['tor'] - (1 if P['br'] else 0)
        s.hip = (hipx, hipy); s.ch = (chx, chy); s.ln = ln
        s.nk = (round(chx - sn * 2 + P['head'][0]), round(chy + P['head'][1]))        # 首の付け根（頭の基準点）
        s.sF = (chx - b['shw'], chy + 1.2); s.sB = (chx + b['shw'] - .4, chy + 1.4)
        a2 = b['arm'] / 2; l2 = b['leg'] / 2 + .15
        s.eF, s.hF = ik(*s.sF, s.sF[0] + P['hF'][0], s.sF[1] + P['hF'][1], a2, a2, -1)
        s.eB, s.hB = ik(*s.sB, s.sB[0] + P['hB'][0], s.sB[1] + P['hB'][1], a2, a2, -1)
        s.aF = (ox + P['fF'][0], oy + P['fF'][1] - 1.2); s.aB = (ox + P['fB'][0], oy + P['fB'][1] - 1.2)
        s.kF, _ = ik(hipx - b['hipw'], hipy, *s.aF, l2, l2, 1); s.kB, _ = ik(hipx + b['hipw'], hipy, *s.aB, l2, l2, 1)

    def leg(s, side, m, shin=None, boot=None, bootH=.5, z=None, r=None, toe=2.2, cuff=None):
        c = s.c; hx, hy = s.hip; k = s.kF if side == 'F' else s.kB; a = s.aF if side == 'F' else s.aB
        h = (hx - s.B['hipw'] if side == 'F' else hx + s.B['hipw'], hy); z = (1 if side == 'F' else -2) if z is None else z
        r0, r1, r2 = r or s.B['legr']
        c.tube([h, k], [r0, r1], m, z); c.tube([k, a], [r1, r2], shin or m, z)
        bm = boot or shin or m
        if boot:
            t = 1 - bootH; bx, by = k[0] + (a[0] - k[0]) * t, k[1] + (a[1] - k[1]) * t
            c.tube([(bx, by), a], [r1 * (1 - t) + r2 * t + .25, r2 + .3], boot, z + .1)
            if cuff: c.tube([(bx - .2, by), (bx + .2, by)], [r1 * (1 - t) + r2 * t + .8] * 2, cuff, z + .15)
        c.tube([(a[0] + .4, a[1] + .2), (a[0] - toe, a[1] + .45)], [r2 + .35, r2 - .1], bm, z + .1)
        return s

    def arm(s, side, m, fore=None, hand='skin', z=None, r=None, cuff=None, hr=1.35):
        c = s.c; sh = s.sF if side == 'F' else s.sB; e = s.eF if side == 'F' else s.eB; h = s.hF if side == 'F' else s.hB
        z = (6 if side == 'F' else -4) if z is None else z; r0, r1 = r or s.B['armr']
        c.tube([sh, e], [r0 + .25, r0], m, z); c.tube([e, h], [r0, r1], fore or m, z)
        if cuff: c.tube([(e[0] + (h[0] - e[0]) * .6, e[1] + (h[1] - e[1]) * .6), (e[0] + (h[0] - e[0]) * .85, e[1] + (h[1] - e[1]) * .85)], [r1 + .5] * 2, cuff, z + .05)
        if hand: c.ball(h[0], h[1], hr, hr, hand, z + .1)
        return s

    def torso(s, m, z=0, wt=3.2, wb=2.7, drop=1.0, bias=0, depth=3):
        c = s.c; (cx, cy), (hx, hy) = s.ch, s.hip
        c.blob([(cx - wt, cy + .4), (cx, cy - .6), (cx + wt - .4, cy + .5), (cx + wt - .2, cy + 2.6), (hx + wb, hy + drop), (hx, hy + drop + .5), (hx - wb, hy + drop), (cx - wt + .2, cy + 2.6)], m, z, depth=depth, bias=bias, sub=4)
        return s

    def head(s, rows, legend, anchor, z=3, eyes=None, mouth=None, brow='hair'):
        """手打ちの頭を首の付け根に合わせて置く。anchor=(列, 行)：グリッド内の首の付け根。
        eyes=((手前の目 x,y), (奥の目 x,y))：グリッド座標（目の上端）。表情に応じて差し替える。"""
        c = s.c; ox, oy = s.nk[0] - anchor[0], s.nk[1] - anchor[1]; s.hd0 = (ox, oy)
        c.stamp(ox, oy, rows, legend, z)
        ex = s.P['face']
        if eyes and ex != 'n':
            (nx, ny), (fx, fy) = eyes; put = lambda x, y, m, lv: c.px(ox + x, oy + y, m, lv, z + .01)
            sk = legend['s']; lash = legend['E']
            if ex in ('b', 'k', 'h', 's'):                      # 閉じた目
                for x, y in ((nx, ny), (fx, fy)): put(x, y, *sk); put(x, y + 1, *lash)
                put(nx + 1, ny, *sk); put(nx + 1, ny + 1, *sk)
            elif ex == 'x':                                      # 被弾：ぎゅっと閉じる
                for x, y in ((nx, ny), (fx, fy)): put(x, y, *lash); put(x, y + 1, *sk)
                put(nx + 1, ny, *sk); put(nx + 1, ny + 1, *lash)
            elif ex == 'o':
                put(nx + 1, ny, 'white', 2); put(nx + 1, ny + 1, 'white', 2)
            if mouth:
                mx, my = mouth
                if ex in ('y', 'x', 'o', 'h'): put(mx, my, 'mouth', 0); put(mx + 1, my, 'mouth', 1)
                if ex in ('a', 'y'): put(nx + 1, ny - 1, *lash)   # 怒り眉
                if ex == 's': put(nx + 1, ny + 2, 'tear', 1)
        return s

    def dirv(s, deg): a = math.radians(deg); return (-math.cos(a), -math.sin(a))

    def blade(s, x, y, deg, ln, m='blade', z=5.5, w=1.0, guard='gold', grip='leather', gl=1.6, hilt=2):
        """刀剣：柄 → 鍔 → 刃（明るい面と暗い面の2列）。deg: 0=左, 90=上。"""
        c = s.c; dx, dy = s.dirv(deg); nx, ny = -dy, dx
        for i in range(0, hilt): c.px(x - dx * (i + .6) - .5, y - dy * (i + .6) - .5, grip, 1, z, raw=True)
        c.px(x - dx * (hilt + .6) - .5, y - dy * (hilt + .6) - .5, guard, 2, z, raw=True)
        gx, gy = x + dx * 1.3, y + dy * 1.3
        if gl: c.line(gx - nx * gl - .5, gy - ny * gl - .5, gx + nx * gl - .5, gy + ny * gl - .5, guard, 2, z + .01)
        lit = 1 if (nx * LIGHT[0] + ny * LIGHT[1]) > 0 else -1
        x0, y0 = gx + dx * .9, gy + dy * .9; x1, y1 = gx + dx * (ln - 1.5), gy + dy * (ln - 1.5); tx, ty = gx + dx * (ln + .6), gy + dy * (ln + .6)
        c.poly([(x0 - nx * w, y0 - ny * w), (x1 - nx * w, y1 - ny * w), (tx, ty), (x1 + nx * w, y1 + ny * w), (x0 + nx * w, y0 + ny * w)], m, z, lum=.30, raw=True)
        c.poly([(x0 + nx * lit * w, y0 + ny * lit * w), (x1 + nx * lit * w, y1 + ny * lit * w), (tx, ty), (x1, y1), (x0, y0)], m, z + .001, lum=.74, raw=True)
        top = len(c.mats[c.mi[m]]['cols']) - 1
        c.px(gx + dx * ln * .62 + nx * lit * w * .5 - .5, gy + dy * ln * .62 + ny * lit * w * .5 - .5, m, top, z + .01, raw=True)
        return s
