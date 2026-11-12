"""パイロット：黒炎竜ヴォルガノン（ボス・右向き）。なめらかな曲線の輪郭と階調で組む。"""
from core import *
from kit import *

def wing(c, root, elbow, wrist, tips, z, bias=0, lum=.5, fold=True, arm='scale', mem='mem', bones=True):
    """蝙蝠型の翼。指先は尖らせ、指の間の縁は内側へえぐった曲線にする。"""
    out = [wrist]
    for i, t in enumerate(tips):
        nxt = tips[i + 1] if i + 1 < len(tips) else root; pull = wrist if i + 1 < len(tips) else elbow
        ctrl = ((t[0] + nxt[0]) / 2 * .58 + pull[0] * .42, (t[1] + nxt[1]) / 2 * .58 + pull[1] * .42)
        out += bez(t, ctrl, nxt, 7)[:-1]
    out += [root, elbow]
    c.blob(out, mem, z, depth=2.5, bias=bias + lum - .56, smooth=False)
    k = c.sel(mem); k &= (c.z == z)
    c.shade(k, gx=.004, gy=.010, ox=wrist[0] * c.k, oy=wrist[1] * c.k, k=0)                 # 付け根側・下側ほど暗く
    for i, t in enumerate(tips):                                                            # 指骨（ゆるく反らせる）
        mid = ((wrist[0] + t[0]) / 2 + (t[1] - wrist[1]) * .06, (wrist[1] + t[1]) / 2 - (t[0] - wrist[0]) * .06)
        c.curve([wrist, mid, t], [1.7, 1.3, .6], arm, z + .1, bias=bias)
        if fold and i + 1 < len(tips):
            n = tips[i + 1]; m2 = ((t[0] + n[0]) / 2 * .6 + wrist[0] * .4, (t[1] + n[1]) / 2 * .6 + wrist[1] * .4)
            c.stroke([(wrist[0] * .75 + m2[0] * .25, wrist[1] * .75 + m2[1] * .25), (m2[0], m2[1])], -1, mem)
    if not bones: return c
    c.curve([root, ((root[0] + elbow[0]) / 2 - 2, (root[1] + elbow[1]) / 2), elbow], [4.6, 3.8, 3.2], arm, z + .2, bias=bias)
    c.curve([elbow, ((elbow[0] + wrist[0]) / 2 - 1.5, (elbow[1] + wrist[1]) / 2), wrist], [3.2, 2.6, 2.2], arm, z + .2, bias=bias)
    c.ball(elbow[0], elbow[1], 3.6, 3.6, arm, z + .25, bias=bias)
    return c

def foot(c, x, y, m='scale', z=0, n=3, ln=7, bias=0, bone='bone'):
    """足先：前へ開く指と鉤爪。"""
    for i in range(n):
        dy = (i - (n - 1) / 2) * 2.4; ex, ey = x + ln - abs(dy) * .5, y + dy + 1.5
        c.tube([(x, y + dy * .4), (ex, ey)], [2.6, 1.7], m, z + i * .01, bias=bias)
        c.poly([(ex, ey - 1.4), (ex + 4.4, ey + 1.6), (ex - .5, ey + 1.6)], bone, z + i * .01 + .005, lum=.82 + bias)
    return c

SC6 = [.16, .40, .62, .79, .93]
def volganon(pose=None, k=.82):
    c = Cv(160, 128, ax=78, ay=122, pose=pose, k=k); c.sep_gap = 9
    c.mat('scale', ['#0e0810', '#220e18', '#40141e', '#6a1e22', '#9c3426', '#d46a36'], th=SC6)
    c.mat('plate', ['#1c080c', '#4e120c', '#8e2c0e', '#d0601a', '#f8a63c', '#ffe490'], th=[-.12, .1, .32, .56, .82])
    c.mat('mem', ['#12061a', '#2c0a20', '#4e1228', '#741e2c', '#9c3632'])
    c.mat('bone', ['#3a2a30', '#7a6058', '#c0a688', '#f0dcb8', '#fffaf0'], 'metal')
    c.mat('fire', ['#ff5a10', '#ffb020', '#fff0a0'], glow=True).mat('eye', ['#ff8a00', '#fff060', '#ffffff'], glow=True)
    c.mat('mouth', ['#2a0410', '#74101a', '#c8301c']).mat('ink', [OUT, '#2a1018'])
    G = 142
    with c.part('wingB', (104, 66)):                                             # 奥の翼（膜だけ覗く）
        wing(c, (100, 68), (92, 32), (108, 8), [(134, 0), (144, 12), (138, 26)], z=-8, bias=-.3, lum=.3, fold=False, bones=False)
    with c.part('tail', (44, 102)):                                              # 尾
        with c.sculpt('scale', z=-4, bias=-.05) as g:
            g.curve([(52, 100), (30, 112), (12, 110), (4, 94), (10, 78), (24, 72)], [14, 11, 8.5, 6.5, 4.4, 2.2])
        kk = c.paint([(50, 106), (30, 116), (12, 113), (4, 100), (8, 108), (20, 124), (40, 124), (54, 114)], 'plate', only='scale', smooth=True)
        c.tex_bands(kk, period=4 * k, amp=.4, ang=62, duty=.3)
        spikes(c, [(36, 100), (18, 100), (8, 90), (12, 76)], 5, 4.4, 'bone', z=-4.1, every=6.5, lean=.5, side=1, lum=.8)
        c.blob([(22, 73), (30, 62), (40, 58), (35, 68), (40, 78), (30, 76)], 'bone', z=-3.8, depth=3, smooth=False)
    with c.part('legB'):                                                         # 奥の脚
        with c.sculpt('scale', z=-5, bias=-.34) as g:
            g.ball(64, 106, 12, 13); g.curve([(68, 114), (58, 126), (64, G - 5)], [6.5, 4.6, 3.6])
            g.curve([(124, 96), (137, 110), (138, 126)], [8, 5.6, 3.8])
        foot(c, 64, G - 4, z=-5, bias=-.34, ln=6); foot(c, 138, 127, z=-5, bias=-.34, ln=6)
    with c.part('body'):                                                         # 胴・首の付け根・手前の脚をひと続きに
        with c.sculpt('scale', z=0, occ=.2) as g:
            g.ball(62, 98, 22, 21)                                               # 腰
            g.tube([(64, 96), (86, 92), (108, 88)], [20, 18, 22])                # 胴
            g.ball(110, 88, 22, 23)                                              # 胸
            g.curve([(116, 82), (130, 66), (136, 52)], [16, 12.5, 10], e=2)      # 首の付け根
            g.ball(60, 106, 15, 17, e=5)                                         # 手前の腿
            g.curve([(70, 120), (58, 131), (67, G - 3)], [7.5, 5.4, 4.4], e=5)
            g.ball(113, 96, 11, 13, e=5)                                         # 肩
            g.curve([(114, 100), (106, 117), (114, G - 5)], [9.5, 7, 4.8], e=6)
        kk = c.paint([(76, 114), (90, 108), (104, 112), (105, 128), (78, 128)], 'plate', only='scale', smooth=True)
        kk |= c.paint([(127, 104), (130, 86), (138, 92), (136, 108), (130, 116)], 'plate', only='scale', smooth=True)
        c.tex_bands(kk, period=5.2 * k, amp=.4, ang=97, duty=.28)
        c.tex_scales(c.sel('scale', 'body') & (c.lum > .34), sx=6 * k, sy=4.4 * k, amp=.16, ang=-10)
        spikes(c, [(50, 84), (64, 76), (84, 72), (102, 66), (116, 64)], 6.5, 5, 'bone', z=-.1, every=7.5, lean=-.5, side=-1, lum=.8)
        for p in ([(101, 78), (105, 84), (103, 90), (108, 96)], [(115, 76), (119, 84), (117, 92)], [(64, 86), (68, 93), (66, 100)], [(80, 80), (82, 88)]):
            c.path(p, 'fire', 0, z=.6)
        for x, y in ((105, 84), (119, 84), (68, 93)): c.px(x, y, 'fire', 1, .61)
        foot(c, 67, G - 2, z=.2, ln=8); foot(c, 114, G - 3, z=.2, ln=8)
    with c.part('wingF', (96, 68)):                                              # 手前の翼
        wing(c, (98, 70), (72, 40), (86, 14), [(122, 6), (58, 4), (30, 14), (14, 36), (22, 64)], z=1.2)
        for x, y in ((122, 6), (58, 4), (30, 14), (14, 36), (22, 64)): claw(c, x, y, -.3, -.6, 'bone', 3)
        c.poly([(84, 14), (88, 4), (90, 14)], 'bone', z=1.5, lum=.8)
    with c.part('neck', (120, 78)):                                              # 首〜頭
        with c.sculpt('scale', z=4, occ=.2) as g:
            g.curve([(120, 80), (132, 64), (138, 48), (148, 42)], [14, 11.5, 9, 8])
        kk = c.paint([(124, 92), (136, 74), (143, 60), (150, 50), (156, 54), (150, 66), (142, 82), (132, 96)], 'plate', only='scale', z=4, smooth=True)
        c.tex_bands(kk, period=4.4 * k, amp=.4, ang=30, duty=.3)
        c.tex_scales(c.sel('scale', 'neck') & (c.lum > .34), sx=6 * k, sy=4.4 * k, amp=.16, ang=-52)
        spikes(c, [(112, 68), (124, 52), (132, 40), (140, 34)], 6, 4.6, 'bone', z=3.9, every=6.5, lean=-.4, side=-1, lum=.8)
        with c.part('head', (148, 46)):
            c.curve([(144, 38), (132, 28), (116, 26), (106, 32)], [3.6, 3, 2, .8], 'bone', z=3.8)
            c.curve([(148, 36), (140, 22), (126, 14), (116, 14)], [4, 3.4, 2.4, .8], 'bone', z=5.4)
            for x, y in ((140, 24), (133, 18), (126, 15)): c.stroke([(x - 1, y - 3), (x + 1, y + 3)], -1, 'bone')
            with c.part('jaw', (150, 56)):
                c.poly([(150, 54), (180, 58), (178, 68), (154, 66)], 'mouth', z=4.6, lum=.15)
                with c.sculpt('scale', z=4.8, bias=-.1) as g: g.blob([(146, 56), (158, 62), (174, 65), (181, 66), (178, 72), (160, 72), (148, 64)], depth=4)
                c.curve([(158, 62), (168, 63), (176, 61)], [2, 1.8, 1.1], 'mouth', z=4.7, bias=.5)
                for i, x in enumerate((167, 173)): c.poly([(x - 1.2, 66.5), (x, 63), (x + 1.2, 66.5)], 'bone', z=4.9, lum=.85)
            with c.sculpt('scale', z=5, bias=.06) as g:
                g.blob([(138, 40), (148, 33), (160, 34), (168, 40), (170, 49), (160, 55), (146, 55), (138, 48)], depth=9)
                g.blob([(160, 38), (174, 42), (184, 47), (187, 53), (182, 57), (166, 57), (158, 50)], depth=6, e=1)
                g.ball(183, 49.5, 2.8, 2.4, e=3); g.tube([(149, 38.5), (156, 38.5), (164, 42)], [2.4, 2.6, 1.8], e=5)
            c.px(184, 50, 'ink', 0, 5.3); c.stroke([(160, 52), (172, 54.5), (184, 55.5)], -2, 'scale'); c.stroke([(162, 40), (174, 44), (184, 47.5)], 1, 'scale')
            for x, y in ((144, 38), (148, 36), (153, 35), (158, 36), (142, 44), (146, 42)): c.tone(x, y, 1, 'scale')
            for i, x in enumerate((164, 170, 176)): c.poly([(x - 1.2, 56), (x, 60.5 if i % 2 == 0 else 59), (x + 1.2, 56)], 'bone', z=5.2, lum=.9)
            c.poly([(182, 56), (184.5, 63), (186, 56)], 'bone', z=5.25, lum=.95)
            c.poly([(152, 41.5), (162, 43.5), (160, 46), (152, 45)], 'ink', z=5.25, lum=0)
            c.px(155, 43, 'eye', 0, 6).px(156, 43, 'eye', 2, 6).px(157, 43, 'eye', 1, 6).px(158, 44, 'eye', 1, 6).px(157, 44, 'eye', 0, 6)
            for x, y in ((141, 43), (144, 49), (148, 53)): c.poly([(x, y), (x - 6.5, y + 2), (x, y + 4)], 'bone', z=5.2, lum=.72)
            fx = c.pose.get('fx', 0)
            if fx:
                for i, (x, y, r) in enumerate(((184, 64, 3), (188, 60, 2.4), (190, 55, 1.8))[:fx + 1]): c.ball(x, y, r, r * 1.3, 'fire', z=6, bias=.3 - i * .3)
    return c

if __name__ == '__main__':
    import sys
    from mon_pilot import show
    c = volganon(); im = c.image(); print('colors', len(c.pal), im.getbbox())
    show([im], sys.argv[1], 6)
