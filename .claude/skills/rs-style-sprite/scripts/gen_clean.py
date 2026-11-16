"""生成のドット絵を清書：4 枚で共通のパレット（k-means）に寄せる・輪郭を純黒に・縁の灰色のゴミと 1 ドットの浮きを消す"""
import sys
import colorsys
import numpy as np
from PIL import Image

def lum(c):
    return .299 * c[0] + .587 * c[1] + .114 * c[2]

def kmeans(X, k, it=30, seed=0):
    rng = np.random.RandomState(seed)
    C = X[rng.choice(len(X), k, replace=False)]
    for _ in range(it):
        d = ((X[:, None, :] - C[None]) ** 2).sum(2)
        l = d.argmin(1)
        for j in range(k):
            if (l == j).any():
                C[j] = X[l == j].mean(0)
    return C

def main(out_dir, paths, k=64):
    ims = [np.asarray(Image.open(p).convert('RGBA')).astype(float) for p in paths]
    X = np.concatenate([a[a[..., 3] > 0][:, :3] for a in ims])
    X = X[np.array([lum(c) >= 34 for c in X])]          # 黒（輪郭）は別に扱う
    C = kmeans(X, k)
    pal = [tuple(int(v) for v in c) for c in C]
    for p, a in zip(paths, ims):
        H, W = a.shape[:2]
        alpha = a[..., 3] > 0
        rgb = a[..., :3]
        out = np.zeros((H, W, 4), np.uint8)
        for y in range(H):
            for x in range(W):
                if not alpha[y, x]:
                    continue
                c = rgb[y, x]
                if lum(c) < 34:
                    out[y, x] = (20, 16, 26, 255)          # 輪郭は 1 色
                else:
                    j = int(((C - c) ** 2).sum(1).argmin())
                    out[y, x] = pal[j] + (255,)
        # 縁の灰色のゴミ（外に接する彩度の低い明るい点で、つながりが 1 つ以下）を消す
        def sat(c):
            return colorsys.rgb_to_hsv(*(v / 255 for v in c[:3]))[1]
        for _ in range(2):
            kill = []
            for y in range(H):
                for x in range(W):
                    if out[y, x, 3] and sat(out[y, x]) < .14 and lum(out[y, x]) > 60 and lum(out[y, x]) < 200:
                        nb = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                        empty = sum(1 for (u, v) in nb if not (0 <= u < W and 0 <= v < H) or not out[v, u, 3])
                        same = sum(1 for (u, v) in nb if 0 <= u < W and 0 <= v < H and out[v, u, 3] and sat(out[v, u]) < .15 and lum(out[v, u]) > 110)
                        if empty >= 1 and same <= 2:
                            kill.append((x, y))
            for x, y in kill:
                out[y, x] = 0
        # 1 ドットだけ浮いた塗り（4 方向とも空き）を消す
        for y in range(H):
            for x in range(W):
                if out[y, x, 3] and all(not (0 <= x + dx < W and 0 <= y + dy < H) or not out[y + dy, x + dx, 3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    out[y, x] = 0
        # 外周を純黒で閉じる
        add = [(x + dx, y + dy) for y in range(H) for x in range(W) if out[y, x, 3] and lum(out[y, x]) >= 34
               for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and not out[y + dy, x + dx, 3]]
        for x, y in add:
            out[y, x] = (20, 16, 26, 255)
        name = p.split('/')[-1]
        Image.fromarray(out, 'RGBA').save(f'{out_dir}/{name}')
        print(name, len(set(map(tuple, out[out[..., 3] > 0][:, :3].tolist()))), 'colors')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
