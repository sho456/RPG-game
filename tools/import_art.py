#!/usr/bin/env python3
"""提供された原画（高解像度のドット絵風画像）を、ゲーム用のドット絵スプライトへ変換する。

 手順：背景を抜く → ゲームの格子（1ドット=一定）へ面積平均で縮める → 透明/不透明を二値化 →
       色数を絞る（ディザなし）→ 外周に 1 ドットの暗色輪郭を付け直す → 孤立ドットを掃除
 どの原画も同じドット倍率に揃えるため、target（出来上がりの幅 or 高さ・ドット）を指定する。

 usage（モジュールとして）:
   from import_art import convert, split_cells
"""
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

OUT = (34, 28, 40)   # 共通輪郭色 #221c28

def _flood_bg(rgb, bg, tol):
    """画像の縁から、背景色に近い領域を塗りつぶして背景マスクを得る。"""
    h, w, _ = rgb.shape
    near = (np.abs(rgb.astype(int) - np.array(bg)[None, None, :]).sum(axis=2) <= tol)
    seen = np.zeros((h, w), bool); dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not seen[y, x]: seen[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not seen[y, x]: seen[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and near[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; dq.append((yy, xx))
    return seen, near

def _components(mask):
    """連結成分ラベル（4近傍）。→ (ラベル配列, [面積...])"""
    h, w = mask.shape; lab = np.zeros((h, w), np.int32); areas = [0]; n = 0
    for sy in range(h):
        for sx in range(w):
            if mask[sy, sx] and not lab[sy, sx]:
                n += 1; lab[sy, sx] = n; dq = deque([(sy, sx)]); a = 0
                while dq:
                    y, x = dq.popleft(); a += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; dq.append((yy, xx))
                areas.append(a)
    return lab, areas

def cutout(im, bg='auto', tol=60, hole_area=400, hole_tol=18):
    """背景を透明にした RGBA(float) を返す。bg='alpha' は元の透明度を使う。
    hole_area：輪郭に囲まれて縁とつながらない背景（尾の輪の内側など）を、面積で判定して抜く。"""
    a = np.array(im.convert('RGBA')).astype(np.float32)
    if bg == 'alpha':
        alpha = a[..., 3] / 255.0
    else:
        rgb = a[..., :3]
        if bg == 'auto': bg = tuple(int(v) for v in np.median(np.concatenate([rgb[:4].reshape(-1, 3), rgb[-4:].reshape(-1, 3)]), axis=0))
        seen, _ = _flood_bg(rgb, bg, tol)
        if hole_area:
            strict = (np.abs(rgb.astype(int) - np.array(bg)[None, None, :]).sum(axis=2) <= hole_tol) & ~seen
            # 高速化のため 1/2 に縮めてラベル付け
            sm = strict[::2, ::2]; lab, areas = _components(sm)
            big = np.isin(lab, [i for i, ar in enumerate(areas) if ar * 4 >= hole_area and i > 0])
            seen |= np.kron(big, np.ones((2, 2), bool))[:seen.shape[0], :seen.shape[1]] & strict
        alpha = (~seen).astype(np.float32)
    a[..., 3] = alpha * 255
    return a

def downscale(a, size):
    """面積平均（アルファ乗算済み）で size=(w,h) へ縮める → RGB(float), alpha(0..1)"""
    al = a[..., 3:4] / 255.0; pre = np.concatenate([a[..., :3] * al, al * 255], axis=2).clip(0, 255).astype(np.uint8)
    chans = [np.array(Image.fromarray(pre[..., i]).resize(size, Image.BOX)).astype(np.float32) for i in range(4)]
    al2 = chans[3] / 255.0; rgb = np.stack(chans[:3], axis=2) / np.maximum(al2[..., None], 1e-3)
    return rgb.clip(0, 255), al2

def quantize(rgb, mask, colors=32, sharpen=0.6):
    """不透明部分だけで色数を絞る（ディザなし）。sharpen：縮小で甘くなった明暗差を少し戻す。"""
    img = Image.fromarray(rgb.astype(np.uint8), 'RGB')
    if sharpen: img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=int(sharpen * 100), threshold=0))
    arr = np.array(img)
    pix = arr[mask]
    strip = Image.fromarray(pix.reshape(1, -1, 3), 'RGB').quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE, kmeans=3)
    pal = np.array(strip.getpalette()[:colors * 3]).reshape(-1, 3); idx = np.array(strip).reshape(-1)
    used = sorted(set(idx.tolist())); remap = {u: i + 1 for i, u in enumerate(used)}
    out = np.zeros(mask.shape, np.uint8); out[mask] = [remap[i] for i in idx]
    return out, ['#%02x%02x%02x' % tuple(pal[u]) for u in used]

def clean_mask(mask, min_area=6):
    """本体から離れた小さなゴミ（数ドットの飛び）を消す。"""
    lab, areas = _components(mask)
    keep = [i for i, ar in enumerate(areas) if ar >= min_area and i > 0]
    return np.isin(lab, keep)

def add_outline(idx, pal, col=OUT, dark_edge=True):
    """外周に 1 ドットの輪郭を付ける。既に十分暗い縁はそのまま（線が二重に太らないよう、内側は触らない）。"""
    h, w = idx.shape; solid = idx > 0
    hexc = '#%02x%02x%02x' % col
    if hexc not in pal: pal = pal + [hexc]
    oi = pal.index(hexc) + 1
    lum = np.array([0] + [int(c[1:3], 16) * .3 + int(c[3:5], 16) * .59 + int(c[5:7], 16) * .11 for c in pal])
    out = np.pad(idx, 1); sp = np.pad(solid, 1)
    near = sp[:-2, 1:-1] | sp[2:, 1:-1] | sp[1:-1, :-2] | sp[1:-1, 2:]
    inner = out[1:-1, 1:-1]
    # 縁のドットが暗ければ（元絵の輪郭が残っていれば）外側には足さず、その縁を輪郭色に置き換える
    edge = solid & ~(sp[:-2, 1:-1] & sp[2:, 1:-1] & sp[1:-1, :-2] & sp[1:-1, 2:])
    res = np.zeros((h + 2, w + 2), np.uint8); res[1:-1, 1:-1] = idx
    if dark_edge:
        dk = edge & (lum[idx] < 70)
        res[1:-1, 1:-1][dk] = oi
        # 明るい縁の外側にだけ輪郭を足す
        bright = np.pad(edge & ~dk, 1)
        nb = bright[:-2, 1:-1] | bright[2:, 1:-1] | bright[1:-1, :-2] | bright[1:-1, 2:]
        nb_full = np.zeros((h + 2, w + 2), bool)
        bp = np.pad(edge & ~dk, 2)
        nb_full = bp[:-2, 1:-1] | bp[2:, 1:-1] | bp[1:-1, :-2] | bp[1:-1, 2:]
        res[(res == 0) & nb_full] = oi
    else:
        sp2 = np.pad(solid, 2); nb_full = sp2[:-2, 1:-1] | sp2[2:, 1:-1] | sp2[1:-1, :-2] | sp2[1:-1, 2:]
        res[(res == 0) & nb_full] = oi
    return res, pal

def to_image(idx, pal):
    lut = np.zeros((len(pal) + 1, 4), np.uint8)
    for i, c in enumerate(pal): lut[i + 1] = (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 255)
    return Image.fromarray(lut[idx], 'RGBA')

def convert(im, target_w=None, target_h=None, bg='auto', tol=60, colors=32, sharpen=0.6, crop=True, k=None, hole_area=400, hole_tol=18):
    """原画 1 枚 → (index配列, パレット)。target_w / target_h のどちらか（ドット）を指定。"""
    a = cutout(im, bg, tol, hole_area=hole_area, hole_tol=hole_tol)
    if crop:
        ys, xs = np.where(a[..., 3] > 127); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = a.shape[:2]
    k = k or ((target_w / w) if target_w else (target_h / h))
    size = (max(1, round(w * k)), max(1, round(h * k)))
    rgb, al = downscale(a, size); mask = clean_mask(al >= 0.5)
    idx, pal = quantize(rgb, mask, colors, sharpen)
    idx, pal = add_outline(idx, pal)
    return idx, pal, k

def split_cells(im, min_gap=6, alpha_th=40):
    """横に並んだ複数ポーズの画像を、透明な縦の隙間で切り分ける。→ [Image...]"""
    a = np.array(im.convert('RGBA')); col = (a[..., 3] > alpha_th).sum(axis=0) > 0
    cells = []; x = 0; w = len(col)
    while x < w:
        if col[x]:
            x0 = x
            while x < w:
                if not col[x]:
                    g = x
                    while g < w and not col[g]: g += 1
                    if g - x >= min_gap or g >= w: break
                    x = g
                else: x += 1
            cells.append(im.crop((x0, 0, x, im.height)))
        else: x += 1
    return cells
