"""拡大されたドット絵（1 ドットの大きさが不ぞろい・JPEG）を実寸に戻す：境目の強さの山から方眼の線を 1 本ずつ探す"""
import sys
import numpy as np
from PIL import Image


def bounds(g, p):
    n = len(g)
    # 最初の線：最初の p 区間で最大の山
    b = [int(np.argmax(g[:int(p * 1.5)]))]
    while b[-1] + p * .6 < n:
        lo, hi = int(b[-1] + p * .8), int(min(n - 1, b[-1] + p * 1.2))
        if lo >= n:
            break
        seg = g[lo:hi + 1]
        k = lo + int(np.argmax(seg)) if len(seg) and seg.max() > np.median(g) * 3 else int(b[-1] + p)
        b.append(min(k, n - 1))
    # 先頭の前も
    while b[0] - p * .8 > 0:
        lo, hi = int(max(0, b[0] - p * 1.2)), int(b[0] - p * .8)
        seg = g[lo:hi + 1]
        k = lo + int(np.argmax(seg)) if len(seg) and seg.max() > np.median(g) * 3 else int(b[0] - p)
        b.insert(0, max(0, k))
    return b


def degrid(path, p=41.7):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    gx = np.abs(np.diff(a, axis=1)).sum(2).sum(0)
    gy = np.abs(np.diff(a, axis=0)).sum(2).sum(1)
    bx, by = bounds(gx, p), bounds(gy, p)
    W, H = len(bx) - 1, len(by) - 1
    out = np.zeros((H, W, 3))
    for j in range(H):
        for i in range(W):
            x0, x1, y0, y1 = bx[i] + 1, bx[i + 1], by[j] + 1, by[j + 1]
            m = max(2, (x1 - x0) // 4)
            c = a[y0 + m:y1 - m, x0 + m:x1 - m].reshape(-1, 3)
            out[j, i] = np.median(c, 0) if len(c) else a[(y0 + y1) // 2, (x0 + x1) // 2]
    return out, (bx, by)


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    out, (bx, by) = degrid(src)
    H, W, _ = out.shape
    im = Image.new('RGBA', (W, H))
    px = im.load()
    bg = np.zeros((H, W), bool)
    st = [(0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1)]
    while st:                       # 背景＝四隅から白い所をたどる（白目・光は残る）
        y, x = st.pop()
        if 0 <= y < H and 0 <= x < W and not bg[y, x] and out[y, x].min() > 225:
            bg[y, x] = True
            st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    for y in range(H):
        for x in range(W):
            if not bg[y, x]:
                r, g, b = (int(v) for v in out[y, x])
                px[x, y] = (r, g, b, 255)
    bb = im.getbbox()
    im.save(dst)
    print(dst, W, H, 'bbox', bb, 'h', bb[3] - bb[1], 'w', bb[2] - bb[0], 'cells x', [round(v, 1) for v in np.diff(bx)[:6]])
