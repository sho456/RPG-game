# ===== セレス 左向き（PixelLab で正面から回したもの）の手直し：顔の前の杖の輪を前へずらし、顔を見せる =====
# 使い方：python3 retouch_west.py → sprites/celes_master_west.png（104×104）。PixelLab のモーションの最初のコマに使う
import numpy as np
from PIL import Image
from scipy import ndimage as nd
a = np.asarray(Image.open('src/master/pl/celes_pl_west.png').convert('RGBA')).copy()
PURPLE = {(0x61,0x3b,0x89),(0x40,0x25,0x6e),(0x31,0x15,0x54)}
SKIN = {(0xfe,0xdb,0xc1)}
def staff_mask():
    m = np.zeros(a.shape[:2], bool)
    for y in range(11, 30):
        xmax = 40 if y < 24 else 41
        for x in range(30, xmax + 1):
            c = tuple(a[y, x, :3])
            if a[y, x, 3] and c not in PURPLE and c not in SKIN: m[y, x] = True
    for y in range(30, 40):
        for x in range(37, 42):
            if a[y, x, 3]: m[y, x] = True
    return m
m = staff_mask()
def dx(y): return -3 if y < 30 else (-2 if y < 34 else (-1 if y < 38 else 0))
src = a.copy(); out = a.copy()
out[m] = 0
for y, x in zip(*np.where(m)):
    out[y, x + dx(y)] = src[y, x]
# 透明に接する明るい縁に輪郭が無ければ黒を足す（杖が抜けた所の顔と髪の縁）
op = out[..., 3] > 0
lum = out[..., :3].astype(float) @ np.array([.299, .587, .114])
edge = op & ~nd.binary_erosion(op, structure=[[0,1,0],[1,1,1],[0,1,0]])
light = edge & (lum > 90)
add = nd.binary_dilation(light, structure=[[0,1,0],[1,1,1],[0,1,0]]) & ~op
add[:, :] &= (np.arange(a.shape[0])[:, None] >= 18) & (np.arange(a.shape[0])[:, None] <= 40)  # 杖を動かした高さだけ
add &= (np.arange(a.shape[1])[None, :] >= 36) & (np.arange(a.shape[1])[None, :] <= 46)
out[add] = (3, 2, 22, 255)
Image.fromarray(out).save('sprites/celes_master_west.png')
print('moved', int(m.sum()), 'outline+', int(add.sum()))
