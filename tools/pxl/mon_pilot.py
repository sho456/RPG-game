"""パイロット：灰狼（通常敵・右向き）。体全体を 1 つの立体面として彫り、影の塊の中に明部を置く。"""
from core import *
from kit import *

FUR = ['#16101c', '#322a40', '#5a526a', '#8a849c', '#c2bcd0', '#f4f0fa']
TH6 = [.06, .30, .54, .78, .95]
def paw(c, x, y, z, n=3, m='bone'):
    for i in range(n): c.px(x + i * 2, y, m, 2, z).px(x + i * 2 + 1, y + 1, m, 1, z)
def wolf(pose=None, v='wolf'):
    """灰狼：斜め前から見た低い構え。頭を下げて牙をむき、前脚を踏み出す。"""
    c = Cv(88, 72, ax=42, ay=68, pose=pose); c.sep_gap = 9
    c.mat('fur', FUR, th=TH6).mat('pale', ['#2a2430', '#5c5460', '#948c94', '#cfc8c8', '#f6f0ec', '#ffffff'], th=TH6)
    c.mat('mouth', ['#3a0a18', '#8e1c2c', '#f04a68']).mat('bone', ['#8a7c84', '#dcd2cc', '#fffaf4'])
    c.mat('eye', ['#b01818', '#ff4030', '#ffd0a0'], glow=True).mat('ink', [OUT, '#322a40'])
    G = 66
    with c.part('tail', (13, 24)):                                               # 尾（奥・上へ）
        with c.sculpt('fur', z=-4, bias=-.05) as g: g.curve([(15, 26), (8, 20), (5, 11), (9, 4)], [3.4, 4.6, 4, 1.4])
        spikes(c, [(10, 25), (3, 18), (2, 9), (8, 2)], 2.8, 2.8, 'fur', z=-4, every=2.6, lean=.7, side=-1, lum=.22)
    with c.part('legB'):                                                         # 奥の脚（暗く）
        with c.sculpt('fur', z=-3, bias=-.3) as g:
            g.curve([(30, 34), (32, 46), (30, G - 3)], [5, 3.4, 2.4]); g.tube([(30, G - 3), (36, G - 2)], [2.4, 1.9])
            g.curve([(12, 36), (8, 46), (10, G - 5)], [5, 3.2, 2.2]); g.tube([(10, G - 5), (15, G - 4)], [2.2, 1.7])
        paw(c, 35, G - 2, -2.9, 2); paw(c, 14, G - 4, -2.9, 2)
    with c.part('body'):                                                         # 胴と手前の脚をひと続きに
        with c.sculpt('fur', z=0, occ=.24) as g:
            g.ball(21, 29, 12, 11)                                               # 腰
            g.tube([(22, 27), (34, 26), (44, 28)], [10, 10.5, 12])               # 背
            g.ball(46, 33, 13, 13.5, e=1)                                        # 胸
            g.ball(20, 37, 8.5, 10.5, e=2)                                       # 腿
            g.curve([(22, 45), (14, 53), (18, G - 2)], [4.2, 3, 2.6], e=2); g.tube([(18, G - 2), (25, G)], [2.6, 2], e=2)
            g.ball(50, 40, 7, 8.5, e=4)                                          # 肩
            g.curve([(51, 44), (54, 54), (59, G - 2)], [5.2, 3.8, 2.9], e=5); g.tube([(59, G - 2), (67, G)], [3, 2.2], e=5)
            g.curve([(40, 42), (37, 53), (41, G - 2)], [4.8, 3.4, 2.7], e=3); g.tube([(41, G - 2), (48, G)], [2.8, 2.1], e=3)
        c.paint([(34, 40), (44, 44), (56, 42), (58, 50), (46, 52), (36, 48)], 'pale', only='fur', smooth=True)        # 胸〜腹の淡い毛
        c.paint([(54, 58), (62, 58), (70, 68), (56, 68)], 'pale', only='fur'); c.paint([(36, 59), (44, 59), (50, 68), (38, 68)], 'pale', only='fur'); c.paint([(13, 59), (21, 59), (27, 68), (15, 68)], 'pale', only='fur')
        c.tex_fur(c.sel(['fur', 'pale'], 'body') & (c.lum > .34), amp=.2, ang=-12, length=3, seed=11)
        spikes(c, [(10, 24), (20, 18), (32, 16), (44, 17), (52, 22)], 3.4, 3.2, 'fur', z=.1, every=2.8, lean=-.6, side=-1, lum=.76)    # 背の逆毛
        spikes(c, [(40, 46), (47, 50), (54, 47)], 3, 2.8, 'pale', z=.1, every=2.6, lean=.1, side=1, lum=.3)                             # 胸毛
        spikes(c, [(9, 34), (11, 42), (15, 47)], 2.4, 2.6, 'fur', z=.1, every=2.6, lean=.2, side=1, lum=.12)
        for p in ([(16, 24), (26, 21), (38, 21)], [(42, 24), (50, 27)], [(15, 32), (19, 39), (24, 44)], [(46, 36), (50, 44)]): c.stroke(p, 1, 'fur', smooth=True)
        for p in ([(28, 30), (30, 38)], [(36, 28), (37, 37)], [(56, 36), (56, 44)]): c.stroke(p, -1, 'fur')
        paw(c, 24, G, .2); paw(c, 47, G, .2); paw(c, 66, G, .2)
    with c.part('head', (58, 30)):                                               # 頭（手前・低く突き出す）
        c.poly([(51, 24), (49, 12), (57, 20)], 'fur', z=3.4, lum=.5); c.poly([(60, 21), (63, 9), (68, 20)], 'fur', z=3.6, lum=.82)   # 耳
        c.poly([(62, 20), (63.5, 13), (66, 20)], 'mouth', z=3.7, lum=.3)
        with c.part('jaw', (60, 40)):                                            # 下あご・舌・下の牙
            c.poly([(59, 39), (76, 44), (73, 52), (61, 49)], 'mouth', z=3.8, lum=.1)
            with c.sculpt('fur', z=3.9, bias=-.12) as g: g.curve([(57, 41), (64, 50), (73, 52)], [3, 2.8, 1.6])
            c.curve([(64, 45), (70, 47), (73, 53)], [1.6, 1.5, .9], 'mouth', z=3.95, bias=.5)
            for x in (66, 69, 72): c.px(x, 48, 'bone', 2, 4).px(x, 47, 'bone', 1, 4)
        with c.sculpt('fur', z=4, bias=.16, occ=.2) as g:
            g.ball(58, 29, 9.5, 8.5); g.curve([(62, 32), (70, 37), (77, 42)], [6, 4.6, 3]); g.tube([(54, 24), (62, 24), (68, 28)], [2.2, 2.6, 2], e=5)
            g.ball(52, 34, 6, 6.5, e=-1)                                         # 頬の毛の塊
        c.paint([(64, 36), (72, 38), (80, 43), (78, 46), (66, 43)], 'pale', only='fur')
        spikes(c, [(47, 30), (48, 38), (53, 43), (59, 43)], 3.2, 2.8, 'fur', z=3.95, every=2.4, lean=.2, side=1, lum=.16)             # 頬毛
        for i, x in enumerate((66, 69, 72, 75)): c.px(x, 43 + i // 2, 'bone', 2, 4.2).px(x, 44 + i // 2, 'bone', 2 if i % 2 == 0 else 1, 4.2)
        c.px(77, 45, 'bone', 2, 4.2).px(77, 46, 'bone', 2, 4.2).px(77, 47, 'bone', 1, 4.2)                                             # 犬歯
        c.px(78, 40, 'ink', 0, 4.3).px(79, 41, 'ink', 0, 4.3).px(78, 41, 'ink', 0, 4.3).px(77, 40, 'ink', 1, 4.3)                      # 鼻
        c.line(57, 26, 64, 29, 'ink', 0, 4.3)                                                                                          # 眉の影
        for x, y, l in ((60, 28, 1), (61, 28, 2), (62, 29, 1), (61, 29, 2), (60, 29, 0), (63, 30, 0)): c.px(x, y, 'eye', l, 4.4)       # 目
        c.stroke([(64, 31), (71, 35), (76, 39)], 1, 'fur', smooth=True); c.stroke([(52, 24), (56, 21)], 1, 'fur')
    return c

def show(ims, out, scale=5, bg=(70, 84, 60, 255)):
    W = sum(i.width for i in ims) * scale + 6 * (len(ims) + 1); H = max(i.height for i in ims) * scale + 12
    sh = Image.new('RGBA', (W, H), bg); x = 6
    for im in ims:
        sh.alpha_composite(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (x, 6)); x += im.width * scale + 6
    sh.save(out)

WOLF_F = {'idle0': {}, 'idle1': {'head': (0, 1), 'tail': (0, 0, -6)},
          'atk0': {'head': (-3, -2, -8), 'jaw': (0, 0, 8), 'tail': (0, 0, 8)}, 'atk1': {'head': (4, 2, 6), 'jaw': (0, 0, 18), 'tail': (0, 0, -8)},
          'hit': {'head': (-4, -2, -14), 'tail': (0, 0, 12)}}
if __name__ == '__main__':
    import sys
    c = wolf(); im = c.image(); print('colors', len(c.pal), im.getbbox())
    show([im, wolf(WOLF_F['atk1']).image()], sys.argv[1], 7)
