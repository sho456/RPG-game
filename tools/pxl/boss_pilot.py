"""パイロット：黒炎竜ヴォルガノン（ボス・右向き）。
 斜め前から見た低い構え。頭は手前下で大きく口を開け、両翼は奥へ広げる。
 筋肉は細長い塊を重ねて彫り、塊ごとに光の筋を入れる（SFC期の大型敵の描き方）。"""
from core import *
from kit import *

def wing(c, root, elbow, wrist, tips, tail, z, bias=0, mem='mem', arm='scale', seed=5):
    """翼：腕骨と指骨、えぐれた膜。膜にはざらつきの模様を入れる。tail=膜が胴へ戻る点。"""
    out = [wrist]
    for i, t in enumerate(tips):
        nxt = tips[i + 1] if i + 1 < len(tips) else tail; pull = wrist if i + 1 < len(tips) else elbow
        ctrl = ((t[0] + nxt[0]) / 2 * .6 + pull[0] * .4, (t[1] + nxt[1]) / 2 * .6 + pull[1] * .4)
        out += bez(t, ctrl, nxt, 8)[:-1]
    out += [tail, root, elbow]
    c.blob(out, mem, z, depth=2, bias=bias - .06, smooth=False)
    k = c.sel(mem) & (c.z == z)
    c.shade(k, gx=0, gy=.006, ox=wrist[0], oy=wrist[1]); c.tex_noise(k, amp=.20, seed=seed, cell=1)
    for i, t in enumerate(tips):
        mid = ((wrist[0] + t[0]) / 2 + (t[1] - wrist[1]) * .05, (wrist[1] + t[1]) / 2 - (t[0] - wrist[0]) * .05)
        c.curve([wrist, mid, t], [2.0, 1.5, .7], arm, z + .1, bias=bias + .1)
    c.curve([root, ((root[0] + elbow[0]) / 2, (root[1] + elbow[1]) / 2 - 2), elbow], [5.5, 4.4, 3.6], arm, z + .2, bias=bias)
    c.curve([elbow, ((elbow[0] + wrist[0]) / 2, (elbow[1] + wrist[1]) / 2), wrist], [3.6, 3, 2.6], arm, z + .2, bias=bias)
    c.ball(elbow[0], elbow[1], 4.2, 4.2, arm, z + .25, bias=bias); c.ball(wrist[0], wrist[1], 3.2, 3.2, arm, z + .25, bias=bias)
    return c

def hook(c, x, y, dx, dy, ln=8, w=2.4, z=0, m='bone', bend=.35):
    """大きな鉤爪：付け根が太く、先へ細く曲がる。"""
    L = math.hypot(dx, dy); ux, uy = dx / L, dy / L; nx, ny = -uy, ux
    pts = [(x, y), (x + ux * ln * .5 + nx * ln * bend * .5, y + uy * ln * .5 + ny * ln * bend * .5), (x + ux * ln + nx * ln * bend, y + uy * ln + ny * ln * bend)]
    c.curve(pts, [w, w * .7, .5], m, z); return c

def hand(c, x, y, ang, z, n=4, fl=6, cl=7, spread=22, m='scale', bias=0):
    """手足の先：開いた指と鉤爪。ang=指の向き（度。0=右、90=下）。"""
    for i in range(n):
        a = math.radians(ang + (i - (n - 1) / 2) * spread); dx, dy = math.cos(a), math.sin(a)
        c.tube([(x, y), (x + dx * fl, y + dy * fl)], [2.6, 2.0], m, z + i * .01, bias=bias)
        hook(c, x + dx * fl, y + dy * fl, dx, dy + .25, cl, 1.9, z + i * .01 + .02)
    return c

SC6 = [.14, .40, .62, .80, .94]
def volganon(pose=None):
    c = Cv(164, 136, ax=80, ay=130, pose=pose); c.sep_gap = 9
    c.mat('scale', ['#120a16', '#261020', '#42162a', '#6c1e2e', '#a43430', '#e86c40'], th=SC6)
    c.mat('plate', ['#3a1612', '#7c3418', '#c0682a', '#eea44e', '#ffd890', '#fff6d8'], th=[-.05, .2, .44, .66, .86])
    c.mat('mem', ['#180a1c', '#34102a', '#5a1830', '#822834', '#a84238'], th=[.2, .42, .62, .82])
    c.mat('bone', ['#4a3840', '#8c766c', '#ccb89c', '#f4e6c8', '#ffffff'], 'metal')
    c.mat('fire', ['#ff5a10', '#ffb020', '#fff0a0'], glow=True).mat('eye', ['#ff8a00', '#fff060', '#ffffff'], glow=True)
    c.mat('mouth', ['#300612', '#7e121c', '#d83a24', '#ff7a50']).mat('ink', [OUT, '#30101e'])
    G = 126
    # ================= 奥：両翼・尾・奥の後ろ脚 =================
    with c.part('wingR', (100, 52)):
        wing(c, (100, 54), (122, 36), (114, 10), [(92, 2), (136, 4), (154, 22), (158, 46)], (126, 60), z=-9, bias=-.16, seed=9)
        hook(c, 114, 9, .4, -1, 9, 2.6, -8.6)
    with c.part('wingL', (58, 54)):
        wing(c, (60, 56), (38, 36), (46, 10), [(70, 2), (22, 2), (6, 22), (2, 50)], (36, 64), z=-8, seed=5)
        hook(c, 45, 9, -.5, -1, 10, 2.8, -7.6)
    with c.part('tail', (30, 90)):
        with c.sculpt('scale', z=-6, bias=-.1) as g: g.curve([(36, 92), (18, 104), (5, 96), (6, 80), (16, 72)], [11, 8.5, 6, 4, 2])
        spikes(c, [(26, 96), (12, 96), (5, 86), (9, 74)], 4.5, 4, 'bone', z=-6.1, every=6, lean=.4, side=1, lum=.8)
        c.blob([(14, 73), (20, 62), (30, 60), (25, 69), (30, 78), (21, 76)], 'bone', z=-5.8, depth=3, smooth=False)
    # ================= 胴・四肢をひと続きに彫る =================
    with c.part('body'):
        with c.sculpt('scale', z=0, occ=.26) as g:
            g.ball(64, 60, 27, 22)                                              # 背の盛り上がり
            g.ball(84, 74, 21, 20, e=2)                                         # 胸
            g.ball(36, 82, 17, 19, e=3); g.ball(30, 92, 10, 11, e=4)           # 後ろ腿（二つの筋肉）
            g.curve([(32, 98), (22, 112), (30, G - 3)], [9, 6.4, 5.4], e=4)     # すね
            g.curve([(88, 66), (98, 80), (104, 92)], [14, 12.5, 11], e=6)       # 首（手前下へ）
            g.ball(58, 72, 12, 13, e=8); g.curve([(56, 78), (47, 96), (56, G - 6)], [9.5, 8.2, 5.6], e=9)    # 左前脚：肩・上腕〜前腕
            g.ball(47, 96, 7.2, 6.6, e=10)                                      # ひじ
            g.ball(106, 62, 10, 10, e=1); g.curve([(108, 64), (126, 70), (138, 82)], [7.5, 6.5, 4.6], e=2)   # 右前脚
            g.ball(126, 70, 5.6, 5.4, e=3)
        kk = c.paint([(62, 84), (74, 80), (92, 86), (100, 100), (94, 112), (76, 114), (64, 104)], 'plate', only='scale', smooth=True)   # 腹〜胸の下
        c.tex_bands(kk, period=4.5, amp=.34, ang=100, duty=.3)
        c.tex_scales(c.sel('scale', 'body') & (c.lum > .5) & (c.Y < 70), sx=5.5, sy=4, amp=.14, ang=-12)
        # 筋肉の光の筋・溝（手置き）
        for p in ([(50, 46), (62, 42), (76, 44)], [(44, 54), (56, 50)], [(54, 68), (60, 64), (66, 68)], [(50, 78), (46, 86)], [(30, 74), (36, 68), (44, 72)], [(28, 84), (30, 94)],
                  [(90, 62), (98, 72), (103, 84)], [(104, 56), (112, 58)], [(114, 64), (124, 67)], [(130, 72), (136, 79)], [(80, 62), (86, 58)]):
            c.stroke(p, 1, 'scale', smooth=True)
        c.tex_scales(c.sel('scale', 'body') & (c.lum > .5) & (c.X < 50) & (c.Y > 66), sx=5.5, sy=4, amp=.14, ang=30)
        for p in ([(24, 80), (30, 72), (40, 70)], [(22, 96), (26, 104)], [(52, 84), (50, 94)]): c.stroke(p, 1, 'scale', smooth=True)
        for p in ([(40, 78), (38, 90), (34, 98)], [(46, 76), (50, 70)]): c.stroke(p, -1, 'scale', smooth=True)
        for p in ([(66, 72), (72, 80)], [(42, 90), (40, 100)], [(74, 50), (84, 56), (88, 64)], [(46, 62), (52, 60)], [(94, 84), (98, 92)], [(118, 72), (122, 76)]):
            c.stroke(p, -1, 'scale', smooth=True)
        for p in ([(58, 52), (62, 58), (60, 64), (65, 70)], [(72, 50), (76, 57), (74, 63)], [(40, 78), (44, 85)], [(96, 70), (99, 77)]): c.path(p, 'fire', 0, z=.6)   # 溶岩のひび
        for x, y in ((62, 58), (76, 57), (44, 85)): c.px(x, y, 'fire', 1, .61)
        spikes(c, [(40, 50), (52, 41), (66, 38), (80, 42), (90, 50)], 5.5, 4.4, 'bone', z=-.1, every=6.5, lean=-.3, side=-1, lum=.78)        # 背びれ
        hand(c, 31, G - 2, 12, z=.3, n=3, fl=7, cl=7, spread=22)                # 後ろ足
        hand(c, 58, G - 4, 16, z=.4, n=4, fl=7, cl=8, spread=20)               # 左前足
        hand(c, 139, 83, 50, z=.2, n=3, fl=5, cl=7, spread=26, bias=-.05)      # 右前足
    # ================= 頭（手前） =================
    with c.part('head', (104, 94)):
        c.curve([(100, 87), (90, 79), (79, 77), (71, 81)], [3.2, 2.6, 1.8, .7], 'bone', z=4.4)       # 角（奥）
        c.curve([(104, 85), (98, 73), (87, 67), (77, 68)], [3.6, 3, 2, .7], 'bone', z=6.2)          # 角（手前）
        for x, y in ((98, 75), (92, 70), (86, 68)): c.stroke([(x - 1, y - 3), (x + 1, y + 3)], -1, 'bone')
        with c.part('jaw', (104, 106)):                                                             # 下あごと口の中
            c.poly([(104, 104), (146, 110), (142, 124), (108, 120)], 'mouth', z=4.8, lum=.2)
            c.curve([(112, 112), (126, 116), (138, 113)], [3, 2.6, 1.6], 'mouth', z=4.9, bias=.5)   # 舌
            with c.sculpt('scale', z=5.0, bias=-.06) as g:
                g.curve([(100, 108), (116, 122), (132, 126), (144, 123)], [5, 5.4, 4.4, 2.6])
            for i, x in enumerate(range(116, 142, 5)): c.poly([(x - .9, 121.5), (x, 117 + (i % 2) * 1.5), (x + .9, 121.5)], 'bone', z=5.1, lum=.86)
            c.poly([(140.5, 122), (142, 115), (143.5, 122)], 'bone', z=5.12, lum=.95)                 # 下の大牙
        with c.sculpt('scale', z=5.4, bias=.04, occ=.2) as g:
            g.ball(106, 95, 13, 10.5)                                                               # 頭蓋
            g.curve([(110, 96), (128, 101), (146, 106)], [9.5, 7.6, 4.6], e=1)                      # 鼻面
            g.tube([(104, 89), (114, 89), (124, 93)], [3, 3.4, 2.4], e=7)                           # 眉の隆起
            g.ball(145, 104, 3.4, 3, e=3); g.ball(100, 102, 6, 5, e=2)                              # 鼻先・頬
        for i, x in enumerate(range(114, 143, 5)): c.poly([(x - .9, 107.5 + (x - 114) * .09), (x, 112.5 - (i % 2) * 1.8 + (x - 114) * .09), (x + .9, 107.5 + (x - 114) * .09)], 'bone', z=5.6, lum=.92)
        c.poly([(143.5, 109), (145.5, 117), (147, 109)], 'bone', z=5.62, lum=1.0)                    # 上の大牙
        c.stroke([(112, 105), (128, 107), (144, 109)], -2, 'scale')                                   # 唇の線
        c.poly([(108, 92), (120, 94.5), (118, 97.5), (108, 96.5)], 'ink', z=5.7, lum=0)               # 眼窩
        for x, y, l in ((111, 94, 0), (112, 94, 2), (113, 94, 1), (114, 95, 1), (113, 95, 2), (112, 95, 0), (115, 95, 0)): c.px(x, y, 'eye', l, 6)
        c.px(146, 103, 'ink', 0, 5.8).px(147, 104, 'ink', 0, 5.8)                                     # 鼻孔
        c.stroke([(118, 96), (132, 100), (144, 103)], 1, 'scale', smooth=True); c.stroke([(100, 92), (106, 88), (114, 87)], 1, 'scale', smooth=True)
        for x, y in ((98, 98), (100, 104), (104, 109)): hook(c, x, y, -1, .35, 7, 2, 5.5)             # 頬のとげ
        for x, y in ((120, 126), (128, 129)): hook(c, x, y, -.2, 1, 4, 1.6, 5.05)                     # あごのとげ
        fx = c.pose.get('fx', 0)
        if fx:
            for i, (x, y, r) in enumerate(((150, 114, 4), (156, 110, 3), (160, 104, 2.2))[:fx + 1]): c.ball(x, y, r, r * 1.3, 'fire', z=7, bias=.3 - i * .3)
    return c

VOL_F = {'idle0': {}, 'idle1': {'head': (0, 1), 'wingL': (0, 0, -3), 'wingR': (0, 0, 3), 'tail': (0, 0, 4)},
         'atk0': {'head': (-3, -3, -8), 'jaw': (0, 0, 10), 'wingL': (0, 0, -7), 'wingR': (0, 0, 7)}, 'atk1': {'head': (5, 2, 6), 'jaw': (0, 0, 16), 'fx': 2},
         'hit': {'head': (-4, -3, -12), 'wingL': (0, 0, 6), 'wingR': (0, 0, -6), 'tail': (0, 0, -8)}}
if __name__ == '__main__':
    import sys
    from mon_pilot import show
    c = volganon(); im = c.image(); print('colors', len(c.pal), im.getbbox())
    show([im], sys.argv[1], 6)
