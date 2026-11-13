#!/usr/bin/env python3
"""原画 → ドット絵の縮小（「色を先に決めてから縮める」方式）。

 平均で縮めると、隣り合う色が混ざって中間色のにじみ（顔がぼやける・縁がざらつく）が出る。そこで：
  1. 原画の解像度のまま、全画素をキャラの共有パレットの色に置き換える
  2. 1 ドットが受け持つ原画の範囲で、各パレット色の面積を数え、いちばん広い色をそのドットの色にする
  3. ただし暗い線（目・まゆ・輪郭・服の境目）は、面積が少なくても一定以上あれば優先する（細部が消えない）
  4. 仕上げ：周りと明暗差の小さい孤立ドットを周りの色にそろえる（ざらつき取り）。明暗差の大きい点（目の光・金具の光）は残す
"""
import numpy as np
from PIL import Image

LUMW = np.array([.3, .59, .11])

def palette_index(rgb, mask, pal):
    P = np.array(pal, np.float32); flat = rgb[mask].astype(np.float32); w = np.array([1.0, 1.25, .8], np.float32)
    out = np.zeros(mask.shape, np.int32); n = len(flat); res = np.empty(n, np.int32)
    for i in range(0, n, 60000):
        d = (((flat[i:i + 60000, None, :] - P[None]) * w) ** 2).sum(2); res[i:i + 60000] = d.argmin(1)
    out[mask] = res + 1; return out

def coverage(idx_full, alpha_full, n, size):
    """各パレット色（1..n）の、出力 1 ドットあたりの面積の割合 → (n+1, h, w)。0 番は不透明部分の合計"""
    W, H = size; cov = np.zeros((n + 1, H, W), np.float32)
    al = Image.fromarray((alpha_full * 255).astype(np.uint8)).resize(size, Image.BOX); cov[0] = np.array(al, np.float32) / 255
    for c in range(1, n + 1):
        m = (idx_full == c)
        if not m.any(): continue
        cov[c] = np.array(Image.fromarray(m.astype(np.uint8) * 255).resize(size, Image.BOX), np.float32) / 255
    return cov

def down(im, k, pal, detail=.26, dark_gap=55):
    """im：RGBA の原画（Image）、k：倍率、pal：[(r,g,b)...] → パレット番号の配列（0＝透明）"""
    a = np.array(im.convert('RGBA')).astype(np.float32); m = a[..., 3] > 127
    idx = palette_index(a[..., :3], m, pal)
    size = (max(1, round(im.width * k)), max(1, round(im.height * k)))
    cov = coverage(idx, m.astype(np.float32), len(pal), size)
    op = cov[0] >= .5
    col = cov[1:]; dom = col.argmax(0)                      # いちばん広い色
    lum = (np.array(pal, np.float32) @ LUMW)
    # 暗い線の優先：dom より dark_gap 以上暗い色のうち、面積が detail 以上で最も暗いもの
    order = np.argsort(lum)                                  # 暗い順
    out = dom.copy(); domlum = lum[dom]; done = np.zeros(dom.shape, bool)
    for c in order:
        cand = (~done) & (col[c] >= detail * np.maximum(cov[0], 1e-3)) & (lum[c] <= domlum - dark_gap)
        out[cand] = c; done |= cand
    res = np.where(op, out + 1, 0).astype(np.uint8)
    return res

def smooth(idx, pal, gap=38):
    """周りの 4 ドットのうち 3 つ以上が同じ色で、自分との明暗差が gap 未満なら、その色にそろえる（ざらつき取り）。"""
    lum = np.concatenate([[0], np.array(pal, np.float32) @ LUMW, [0]])
    h, w = idx.shape; p = np.pad(idx, 1); res = idx.copy()
    nb = np.stack([p[:-2, 1:-1], p[2:, 1:-1], p[1:-1, :-2], p[1:-1, 2:]])
    for i in range(4):
        same = (nb == nb[i]).sum(0)
        cand = (idx > 0) & (nb[i] > 0) & (same >= 3) & (nb[i] != idx) & (np.abs(lum[np.minimum(idx, len(lum) - 1)] - lum[np.minimum(nb[i], len(lum) - 1)]) < gap)
        res[cand] = nb[i][cand]
    return res
