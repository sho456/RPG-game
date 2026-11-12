"""パイロット：灰狼（通常敵）"""
from core import *
from kit import *

FUR = ['#201828', '#40384c', '#6c6476', '#a09aa8', '#dcd6e0']
def wolf(pose=None, v='wolf', k=.78):
    c = Cv(82, 60, ax=40, ay=56, pose=pose, k=k); c.sep_gap = 1.5
    c.mat('fur', FUR).mat('belly', ['#352a3a', '#66565a', '#a08a84', '#d8c6ba'])
    c.mat('mouth', ['#3c0c1c', '#8c1c2c', '#e84860']).mat('bone', ['#8a7c7c', '#d8cec4', '#fffaf4'])
    c.mat('eye', ['#c03018', '#ffb020', '#fff6b0'], glow=True).mat('ink', [OUT, '#3a2c3c'])
    G = 70
    with c.part('tail', (15, 37)):     # 尾：ふさふさ、斜め上へ
        c.curve([(17, 38), (9, 33), (5, 24), (8, 14)], [3.5, 5.5, 5, 1.5], 'fur', z=-2)
        spikes(c, [(12, 37), (5, 31), (1, 22), (5, 12)], 3.4, 3.2, 'fur', z=-2, every=2.8, lean=.7, side=-1, lum=.3)
        spikes(c, [(14, 30), (10, 24), (10, 16)], 2.6, 3, 'fur', z=-1.9, every=3, lean=.7, side=1, lum=.7)
    with c.part('legB'):               # 奥の脚（暗く）
        c.blob([(14, 38), (24, 36), (30, 46), (30, 55), (24, 57), (16, 50)], 'fur', z=-3, depth=6, bias=-.4)
        c.tube([(26, 54), (19, 61), (22, G - 2), (27, G - 1)], [3, 2.2, 2.0, 2.0], 'fur', z=-3, bias=-.4)
        c.tube([(66, 44), (73, 55), (76, G - 4), (81, G - 2)], [4.5, 3, 2.1, 2.1], 'fur', z=-3, bias=-.4)
    with c.part('body'):
        # 胴：腰は細く、胸は厚い
        c.blob([(13, 37), (18, 30), (28, 28), (40, 31), (52, 25), (62, 23), (70, 30), (71, 42), (65, 52), (54, 55), (42, 49), (30, 48), (20, 50), (13, 45)], 'fur', z=0, depth=14)
        c.blob([(30, 45), (42, 46), (54, 52), (64, 50), (60, 55), (50, 56), (38, 50)], 'belly', z=0.2, depth=4, bias=-.22)
        c.blob([(50, 27), (61, 24), (70, 31), (71, 44), (63, 53), (53, 50), (48, 38)], 'fur', z=0.4, depth=10, bias=.05)   # 肩
        c.tex_fur(c.sel('fur', 'body'), amp=.14, ang=10, length=4, seed=7)
        spikes(c, [(22, 30), (34, 30), (46, 27), (56, 23), (64, 22)], 4.2, 4, 'fur', z=0.1, every=3.2, lean=-.7, side=-1, lum=.66)   # 背の毛
        spikes(c, [(50, 50), (57, 55), (65, 52), (70, 45)], 3.4, 3, 'fur', z=0.5, every=2.8, lean=.3, side=1, lum=.12)   # 胸の毛
    with c.part('legF'):               # 手前の脚
        c.blob([(14, 38), (22, 33), (32, 37), (37, 47), (36, 56), (29, 58), (19, 52)], 'fur', z=1, depth=8)     # 腿
        c.tube([(32, 55), (25, 62), (28, G - 1), (35, G)], [3.4, 2.6, 2.3, 2.3], 'fur', z=1)
        c.tube([(59, 46), (56, 56), (61, G - 2), (67, G)], [5.4, 3.6, 2.5, 2.4], 'fur', z=1)
        for x in (33, 35, 37): claw(c, x, G + 1, 0.5, 0, 'bone', 2)
        for x in (65, 67, 69): claw(c, x, G + 1, 0.5, 0, 'bone', 2)
        for x in (27, 29): claw(c, x, G, 0.5, 0, 'bone', 1, z=-2.9)
        for x in (81, 83): claw(c, x, G - 1, 0.5, 0, 'bone', 1, z=-2.9)
    with c.part('head', (68, 34)):     # 首〜頭（低く突き出す）
        c.blob([(60, 25), (68, 23), (77, 26), (80, 36), (75, 46), (64, 45), (60, 36)], 'fur', z=2, depth=9)       # たてがみ
        spikes(c, [(62, 42), (68, 48), (76, 46)], 4, 3.4, 'fur', z=2, every=2.8, lean=.2, side=1, lum=.15)
        spikes(c, [(60, 30), (65, 24), (73, 23)], 3.8, 3.6, 'fur', z=2, every=3, lean=-.6, side=-1, lum=.72)
        c.stroke([(66, 28), (64, 38)], -1, 'fur'); c.stroke([(71, 27), (69, 40)], -1, 'fur'); c.stroke([(69, 26), (67, 36)], 1, 'fur')
        c.poly([(71, 27), (67, 16), (75, 23)], 'fur', z=2.5, lum=.74); c.poly([(77, 26), (76, 14), (82, 24)], 'fur', z=2.6, lum=.52)   # 耳
        c.poly([(78, 24), (77, 17), (81, 24)], 'mouth', z=2.7, lum=.2)
        c.ball(80, 32, 7.5, 6.5, 'fur', z=3)                                               # 頭蓋
        c.tube([(82, 33), (90, 36), (96, 39)], [5.2, 4, 2.7], 'fur', z=3.1)                # 鼻面
        c.blob([(84, 37), (90, 37.5), (97, 39), (96, 41), (88, 41), (84, 40)], 'belly', z=3.15, depth=3, bias=.2)
        with c.part('jaw', (81, 40)):
            c.poly([(80, 40), (94, 43), (92, 48), (83, 47)], 'mouth', z=2.8, lum=.15)
            c.tube([(80, 43), (87, 48), (93, 48)], [2.6, 2.2, 1.5], 'fur', z=2.9, bias=-.2)
            c.tube([(85, 45), (90, 46), (92, 50)], [1.6, 1.5, 1.0], 'mouth', z=2.95, bias=.45)   # 舌
            fangs(c, 86, 46, 3, 2, 2, 'bone', up=True)
        fangs(c, 87, 41, 4, 2, 2, 'bone')
        c.px(93, 41, 'bone', 2).px(93, 42, 'bone', 2).px(93, 43, 'bone', 1)                # 犬歯
        c.px(97, 37, 'ink', 0).px(98, 38, 'ink', 0).px(97, 38, 'ink', 0).px(96, 37, 'ink', 1)   # 鼻
        c.line(81, 29, 86, 32, 'ink', 0)                                                   # 怒った眉
        c.px(83, 31, 'eye', 2).px(84, 31, 'eye', 1).px(85, 32, 'eye', 1).px(84, 32, 'eye', 2).px(83, 32, 'eye', 0)
        c.stroke([(87, 33), (93, 36)], 1); c.stroke([(84, 37), (90, 39)], -1, 'fur')
    return c

def show(ims, out, scale=5, bg=(70, 84, 60, 255)):
    W = sum(i.width for i in ims) * scale + 6 * (len(ims) + 1); H = max(i.height for i in ims) * scale + 12
    sh = Image.new('RGBA', (W, H), bg); x = 6
    for im in ims:
        sh.alpha_composite(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (x, 6)); x += im.width * scale + 6
    sh.save(out)

if __name__ == '__main__':
    import sys
    c = wolf(); im = c.image(); print('colors', len(c.pal))
    f2 = wolf({'head': (3, 3, 8), 'jaw': (0, 0, 16), 'tail': (0, 0, -8), 'body': (0, 1)}).image()
    show([im, f2], sys.argv[1])
