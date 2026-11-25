# ===== セレス 星臨の左向きを手元で作る：正面の通常→星臨の色の対応を数え、左向きの通常に当てはめる =====
# 正面の 2 枚（sprites/celes_master_{front,seirin}.png）は同じポーズなので、同じ位置のドットの色の組を数える
# → sprites/celes_master_seirin_side_l.png（104×104）。杖は別に描き替える（下の STAFF）
import numpy as np
from collections import Counter, defaultdict
from PIL import Image
f = np.asarray(Image.open('sprites/celes_master_front.png').convert('RGBA'))
s = np.asarray(Image.open('sprites/celes_master_seirin.png').convert('RGBA'))
def bb(a):
    ys, xs = np.where(a[..., 3] > 0); return ys.min(), ys.max(), xs.min(), xs.max()
# 足元（下端）と体の中心でそろえてから組を数える。ずれを ±3 で探して一致の多い所
fy0, fy1, fx0, fx1 = bb(f); sy0, sy1, sx0, sx1 = bb(s)
best = None
for dy in range(-3, 4):
    for dx in range(-3, 4):
        sh = np.roll(np.roll(s, dy + (fy1 - sy1), 0), dx + ((fx0 + fx1) - (sx0 + sx1)) // 2, 1)
        both = (f[..., 3] > 0) & (sh[..., 3] > 0)
        if best is None or both.sum() > best[0]: best = (both.sum(), sh)
sh = best[1]; both = (f[..., 3] > 0) & (sh[..., 3] > 0)
pairs = defaultdict(Counter)
for y, x in zip(*np.where(both)):
    pairs[tuple(f[y, x, :3])][tuple(sh[y, x, :3])] += 1
cmap = {k: v.most_common(1)[0][0] for k, v in pairs.items()}
side = np.asarray(Image.open('sprites/celes_master_side_l.png').convert('RGBA')).copy()
fpal = np.array(list(cmap.keys()), float)
miss = 0
for y, x in zip(*np.where(side[..., 3] > 0)):
    c = tuple(side[y, x, :3])
    if c not in cmap:
        miss += 1; c = tuple(fpal[((fpal - np.array(c, float)) ** 2).sum(1).argmin()].astype(int))
    side[y, x, :3] = cmap[c]
Image.fromarray(side).save('sprites/celes_master_seirin_side_l_raw.png')
print('pairs', len(cmap), 'miss', miss)

# ---- 星臨らしさの描き足し（色の置き換えだけでは足りないもの）----
n = np.asarray(Image.open('sprites/celes_master_side_l.png').convert('RGBA')).astype(int)
o = side.copy()
OUT = (5, 14, 66, 255)
def isp(c): return c[0] > 70 and c[2] > 110 and c[1] < 80   # 帽子の紫
# 1) 杖の頭（金の輪と青い宝石）を消す。帽子の紫は残す
for y in range(10, 32):
    for x in range(16, 37):
        if n[y, x, 3] and not isp(n[y, x]) and not (y >= 29 and 28 <= x <= 31): o[y, x] = 0
# 2) 水晶を描く（中心 x=27・y=9〜30。輪郭・濃・中・明・芯）
C = {'k': OUT, 'd': (37, 70, 132, 255), 'm': (74, 163, 232, 255), 'l': (159, 227, 255, 255), 'w': (236, 252, 255, 255), 's': (113, 124, 176, 255)}
CRY = ['....k....', '...kwk...', '...klk...', '..kwlmk..', '..klwmk..', '.kllwmdk.', '.klwlmdk.', '.kllwmdk.', 'klwlwmmdk', 'kllwlmmdk', 'klwllmddk',
       'kllwlmmdk', '.klwlmdk.', '.kllmmdk.', '.klwmddk.', '..klmdk..', '..kmmdk..', 's.kmdk.s.', 'sk.kdk.ks', '.sk.k.ks.', '..sssss..', '...sks...']
for j, row in enumerate(CRY):
    for i, ch in enumerate(row):
        if ch != '.': o[9 + j, 23 + i] = C[ch]
# 杖の柄を水晶の下までつなぐ（銀）
for y in range(31, 34):
    if not o[y, 30, 3]: o[y, 30] = C['s']
# 3) 目を光らせる（通常の目の紫 → 水色の光・芯は白）
# 通常の左向きの瞳は (x49,y25)(x49,y26)、その上の (x50,y24) が瞳の影
eye = [(25, 49), (26, 49), (24, 50)]
o[25, 49] = (236, 252, 255, 255); o[26, 49] = (120, 230, 255, 255); o[24, 50] = (74, 163, 232, 255)
o[25, 48] = (143, 240, 255, 255)  # 目の光のにじみ
# 4) 服と帽子に銀河の星（暗い紺の所に、決まった散らし方で）
lum = o[..., :3].astype(float) @ np.array([.299, .587, .114])
for y in range(4, 92):
    for x in range(30, 100):
        if o[y, x, 3] and lum[y, x] < 70 and o[y, x, 2] > o[y, x, 0] and all(o[y + dy, x + dx, 3] and lum[y + dy, x + dx] < 80 for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]):
            h = (x * 73 + y * 151) % 101
            if h < 5: o[y, x] = (198, 202, 239, 255) if h % 2 else (143, 170, 240, 255)
            elif h == 5: o[y, x] = (255, 255, 255, 255)
# 5) 足元を星の霧に溶かす（下 12 行を淡く、いちばん下は市松に抜く）
ys, xs = np.where(o[..., 3] > 0); bot = ys.max()
MIST = [(70, 80, 150), (100, 112, 180), (130, 140, 205), (170, 176, 228)]
for y in range(bot - 13, bot + 1):
    k = (y - (bot - 13)) / 13
    for x in range(104):
        if o[y, x, 3] and not (28 <= x <= 31):
            c = np.array(MIST[min(3, int(k * 4))])
            o[y, x, :3] = (o[y, x, :3] * (1 - k * .8) + c * k * .8).astype(int)
            if k > .6 and (x + y) % 2 == 0 and (k > .85 or (x * 7 + y) % 3 == 0): o[y, x] = 0
Image.fromarray(o.astype(np.uint8)).save('sprites/celes_master_seirin_side_l.png')
print('eye', len(eye), 'bottom', bot)
