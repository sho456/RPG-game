# ===== セレス 正本の横向き（左＝TD の向き／右）の仕上げ：通常の正面のパレットへ減色し、104×104 に足元をそろえて置く =====
# 原画は src/master/celes_side_{l,r}.png（約 59×99・透過済み・色が多い）→ sprites/celes_master_side_{l,r}.png
import numpy as np
from PIL import Image
pal = np.load('sprites/palette_front.npy')
for k in ['l', 'r']:
    a = np.asarray(Image.open(f'src/master/celes_side_{k}.png').convert('RGBA')).astype(float)
    m = a[..., 3] > 0
    d = ((a[..., None, :3] - pal[None, None]) ** 2).sum(-1); idx = d.argmin(-1)
    out = np.zeros(a.shape, np.uint8); out[..., :3] = pal[idx]; out[..., 3] = m * 255
    ys, xs = np.where(m); crop = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; h, w = crop.shape[:2]
    can = np.zeros((104, 104, 4), np.uint8); oy = 104 - 2 - h
    fx = np.where(crop[-8:, :, 3] > 0)[1].mean(); ox = max(0, min(104 - w, int(round(52 - fx))))
    can[oy:oy + h, ox:ox + w] = crop
    Image.fromarray(can).save(f'sprites/celes_master_side_{k}.png'); print(k, w, h, 'colors', len(np.unique(crop[crop[..., 3] > 0][:, :3], axis=0)))
