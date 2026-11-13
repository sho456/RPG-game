"""spx 用の共通処理（縮小・パレット・PNG 化）。build_spx_enemies.py / build_spx_rio.py から使う"""
import base64, io
import numpy as np
from PIL import Image
from scipy import ndimage as nd


# ---------- 縮小（不透明度で重み付けした面積平均） ----------
def shrink(rgb, a, w):
    h0, w0 = a.shape
    h = max(1, round(h0 * w / w0))
    A = Image.fromarray(a.astype(np.float32), 'F').resize((w, h), Image.BOX)
    al = np.asarray(A)
    ch = []
    for c in range(3):
        P = Image.fromarray((rgb[:, :, c] * a).astype(np.float32), 'F').resize((w, h), Image.BOX)
        ch.append(np.asarray(P))
    col = np.stack(ch, 2) / np.maximum(al, 1e-6)[:, :, None]
    if w < w0 / 3.2:   # 原画のドットより細かく縮めるときは、輪郭と陰影が眠くならないよう少しだけ締める
        blur = nd.uniform_filter(col, size=(3, 3, 1))
        col = np.clip(col + (col - blur) * .35, 0, 255)
    return col, al >= .5


# ---------- パレット（k-means） ----------
def kmeans(px, k, it=30, seed=1):
    rng = np.random.default_rng(seed)
    # k-means++ 初期化
    c = [px[rng.integers(len(px))]]
    for _ in range(k - 1):
        d = np.min(((px[:, None, :] - np.array(c)[None]) ** 2).sum(2), 1)
        c.append(px[rng.choice(len(px), p=d / d.sum())])
    c = np.array(c)
    for _ in range(it):
        lbl = np.argmin(((px[:, None, :] - c[None]) ** 2).sum(2), 1)
        for j in range(k):
            s = px[lbl == j]
            if len(s):
                c[j] = s.mean(0)
    return c


def lum(c):
    return c[0] * .3 + c[1] * .59 + c[2] * .11


def to_pal_idx(col, m, pal):
    px = col[m]
    lbl = np.argmin(((px[:, None, :] - pal[None]) ** 2).sum(2), 1)
    idx = np.zeros(m.shape, np.int32)
    idx[m] = lbl + 1           # 0 = 透明
    return idx


def png_of(idx, pal):
    h, w = idx.shape
    im = Image.new('P', (w, h))
    flat = [0, 0, 0] + [int(round(v)) for c in pal for v in c]
    im.putpalette(flat + [0] * (768 - len(flat)))
    im.putdata(idx.flatten().tolist())
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True, transparency=0)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def anchor(m):
    ys, xs = np.where(m)
    ay = ys.max()
    low = xs[ys >= ay - max(2, m.shape[0] // 10)]
    return int(round((low.min() + low.max()) / 2)), int(ay)


