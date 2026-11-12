"""パイロット：灰狼（通常敵・右向き）。体全体を 1 つの立体面として彫り、影の塊の中に明部を置く。"""
from core import *
from kit import *

FUR = ['#150c18', '#30223a', '#584c62', '#8a8296', '#c6bed0', '#f6f2fa']
TH6 = [.04, .26, .50, .77, .96]
def wolf(pose=None, v='wolf'):
    c = Cv(88, 68, ax=42, ay=64, pose=pose); c.sep_gap = 9
    c.mat('fur', FUR, th=TH6).mat('tan', ['#150c18', '#3a2630', '#6a4a44', '#9c7060', '#d4a088', '#f6d4bc'], th=TH6)
    c.mat('mouth', ['#3a0a18', '#8e1c2c', '#f04a68']).mat('bone', ['#8a7c84', '#dcd2cc', '#fffaf4'])
    c.mat('eye', ['#c03018', '#ffb020', '#fff6b0'], glow=True).mat('ink', [OUT, '#30223a'])
    G = 61
    # ---- 奥の脚（影の側。暗く沈める）----
    with c.part('legB'):
        with c.sculpt('fur', z=-3, bias=-.3) as g:
            g.curve([(17, 44), (13, 51), (10, 56), (13, G - 1)], [4.5, 3, 1.9, 1.7]); g.tube([(13, G - 1), (18, G)], [1.8, 1.5])
            g.curve([(55, 36), (63, 40), (68, 47), (66, 53)], [4, 3, 2.1, 1.7]); g.tube([(66, 53), (70, 56)], [1.9, 1.4])      # 振り上げた前脚
    # ---- 尾 ----
    with c.part('tail', (15, 36)):
        with c.sculpt('fur', z=-2) as g:
            g.curve([(17, 38), (9, 31), (6, 21), (10, 11)], [3.4, 5, 4.6, 1.6])
        spikes(c, [(11, 36), (4, 29), (2, 19), (8, 9)], 3, 3, 'fur', z=-2, every=2.6, lean=.7, side=-1, lum=.2)
    # ---- 胴・首・頭・手前の脚をひと続きに彫る ----
    with c.part('body'):
        with c.sculpt('fur', z=0, occ=.2, bias=.04) as g:
            g.ball(22, 40, 10.5, 9.5)                                           # 腰
            g.tube([(24, 39), (36, 37), (47, 33)], [8.5, 7.2, 9.5])              # 胴（腰のくびれ）
            g.ball(50, 32, 11.5, 11.5)                                          # 胸
            g.curve([(52, 27), (58, 21), (63, 16)], [9, 7.6, 6.2], e=1)          # 首（たてがみ）
            g.ball(25, 45, 7.6, 8.6, e=2.5)                                     # 手前の腿
            g.curve([(29, 50), (22, 55), (25, G - 1)], [3.4, 2.5, 2.2], e=2.5); g.tube([(25, G - 1), (31, G)], [2.3, 1.8], e=2.5)
            g.ball(50, 38, 6, 7.5, e=2)                                         # 肩
            g.curve([(51, 41), (51, 50), (55, G - 1)], [4.6, 3.3, 2.4], e=2.5); g.tube([(55, G - 1), (61, G)], [2.4, 1.8], e=2.5)
        c.paint([(24, 43), (38, 41), (50, 43), (60, 36), (58, 50), (44, 52), (32, 50), (26, 52)], 'tan', only='fur', smooth=True)   # 腹〜胸の下
        lit = c.sel(['fur', 'tan'], 'body') & (c.lum > .30)
        c.tex_fur(lit, amp=.22, ang=-18, length=3, seed=11)
        spikes(c, [(16, 33), (26, 30), (38, 30), (47, 23), (54, 17), (60, 11)], 3.6, 3.4, 'fur', z=.1, every=2.9, lean=-.7, side=-1, lum=.74)   # 背〜うなじ
        spikes(c, [(43, 44), (50, 47), (57, 43), (60, 34)], 3, 2.8, 'fur', z=.1, every=2.6, lean=.3, side=1, lum=.12)                          # 胸毛
        spikes(c, [(14, 44), (17, 50), (22, 53)], 2.4, 2.6, 'fur', z=.1, every=2.6, lean=.2, side=1, lum=.12)
        for p in ([(44, 26), (41, 34)], [(48, 25), (46, 36)], [(30, 33), (31, 40)], [(21, 34), (24, 41), (29, 46)]): c.stroke(p, 1, 'fur')   # 毛の流れ（明）
        for p in ([(54, 30), (53, 40)], [(37, 34), (38, 41)], [(26, 34), (27, 40)]): c.stroke(p, -1, 'fur')
        for x in (30, 32, 34): claw(c, x, G + 1, .5, 0, 'bone', 2)
        for x in (60, 62, 64): claw(c, x, G + 1, .5, 0, 'bone', 2)
        for x, y in ((18, G), (20, G), (70, 56), (72, 57)): c.px(x, y, 'bone', 1, -2.9)
    # ---- 頭（別パーツ：首の上に重ねて動かす）----
    with c.part('head', (62, 18)):
        c.poly([(59, 13), (59, 4), (64, 10)], 'fur', z=2.4, lum=.5); c.poly([(63, 12), (66, 2), (70, 10)], 'fur', z=2.6, lum=.8)     # 耳
        c.poly([(65, 10), (66, 5), (68, 10)], 'mouth', z=2.7, lum=.3)
        with c.part('jaw', (65, 21)):                                                                                              # 下あご
            c.poly([(64, 20), (77, 23), (75, 28), (66, 26)], 'mouth', z=2.8, lum=.1)
            with c.sculpt('fur', z=2.9, bias=-.2) as g: g.curve([(63, 22), (69, 27), (76, 27)], [2.4, 2, 1.3])
            c.curve([(68, 24), (73, 25), (75, 29)], [1.3, 1.2, .8], 'mouth', z=2.95, bias=.5)                                        # 舌
            for x in (70, 72, 74): c.px(x, 25, 'bone', 2)
            c.px(75, 24, 'bone', 2).px(75, 25, 'bone', 1)
        with c.sculpt('fur', z=3, bias=.16) as g:
            g.ball(65, 15, 6.4, 5.8); g.curve([(67, 16), (73, 18), (79, 21)], [4.4, 3.4, 2.2])                                       # 頭蓋〜鼻面
        c.paint([(69, 19), (80, 21), (80, 24), (70, 23)], 'tan', only='fur')
        spikes(c, [(58, 20), (61, 25), (66, 26)], 3, 2.6, 'fur', z=2.95, every=2.4, lean=.2, side=1, lum=.14)                         # 頬の毛
        for x in (70, 72, 74, 76): c.px(x, 22, 'bone', 2); 
        c.px(70, 23, 'bone', 1).px(74, 23, 'bone', 1).px(77, 22, 'bone', 2).px(77, 23, 'bone', 2).px(77, 24, 'bone', 1)              # 上の牙・犬歯
        c.px(80, 19, 'ink', 0).px(81, 20, 'ink', 0).px(80, 20, 'ink', 0).px(79, 19, 'ink', 1)                                        # 鼻
        c.line(64, 12, 69, 15, 'ink', 0); c.px(66, 14, 'eye', 2).px(67, 15, 'eye', 1).px(66, 15, 'eye', 1).px(68, 16, 'eye', 0)      # 眉と目
        c.stroke([(70, 16), (76, 18)], 1, 'fur'); c.stroke([(62, 12), (60, 18)], 1, 'fur')
    return c

def show(ims, out, scale=5, bg=(70, 84, 60, 255)):
    W = sum(i.width for i in ims) * scale + 6 * (len(ims) + 1); H = max(i.height for i in ims) * scale + 12
    sh = Image.new('RGBA', (W, H), bg); x = 6
    for im in ims:
        sh.alpha_composite(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (x, 6)); x += im.width * scale + 6
    sh.save(out)

WOLF_F = {'idle0': {}, 'idle1': {'head': (0, 1), 'tail': (0, 0, -6), 'jaw': (0, 0, -4)},
          'atk0': {'head': (-2, -2, -10), 'jaw': (0, 0, 14), 'tail': (0, 0, 8), 'body': (-1, 0)}, 'atk1': {'head': (4, 3, 12), 'jaw': (0, 0, 22), 'tail': (0, 0, -10), 'body': (1, 0)},
          'hit': {'head': (-3, -2, -18), 'jaw': (0, 0, 6), 'tail': (0, 0, 14), 'body': (-1, 0)}}
if __name__ == '__main__':
    import sys
    c = wolf(); im = c.image(); print('colors', len(c.pal), im.getbbox())
    show([im, wolf(WOLF_F['atk1']).image()], sys.argv[1], 7)
