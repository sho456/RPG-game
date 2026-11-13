#!/usr/bin/env python3
"""味方のポーズ一覧シート（1 枚に十数ポーズ・文字ラベル・エフェクト入り）→ ポーズごとの切り抜き。

 キャラの外周は暗い輪郭線で閉じている、という性質を使う：
   1. 暗い画素（輪郭）と灰色の画素（明るい服の輪郭）を「壁」にし、少し太らせて隙間をふさぐ
   2. シートの縁から壁を越えずに届く所＝背景・エフェクト・文字の帯の外側 → 除く
   3. 残った領域の穴を埋め（白いハイライト）、背景色そのものの大きな囲まれた穴（腕と胴の間など）は抜く
   4. 一定以上の大きさの塊をポーズとして、行（下端の高さ）→ 左から の順に並べる
 輪郭の外に描かれた光・炎・魔法陣・文字・砂ぼこりは、壁の外にあるので自動で落ちる。
 輪郭に重なって残ったエフェクトは、ビルド側で多角形を指定して消す。
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def segment(path, pre_fill=(), dark=80, grow=2, grey_s=.2, grey_l=215, bg_tol=45, hole_tol=10, hole_area=160, min_area=3000, min_h=70, row=150):
    im = Image.open(path).convert('RGBA')
    if pre_fill:   # 塊に触れている文字の帯などを、先に背景色で塗りつぶす（シート上の座標）
        b = np.array(im); bg = b[2, 2].copy()
        for x0, y0, x1, y1 in pre_fill: b[y0:y1, x0:x1] = bg
        im = Image.fromarray(b, 'RGBA')
    a = np.array(im).astype(int)
    lum = a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11
    mx = a[..., :3].max(2); mn = a[..., :3].min(2); sat = (mx - mn) / np.maximum(mx, 1)
    transparent = a[2, 2, 3] == 0
    if transparent: fg = a[..., 3] > 200; bgc = None
    else:
        bgc = np.median(np.concatenate([a[:3, :, :3].reshape(-1, 3), a[-3:, :, :3].reshape(-1, 3)]), axis=0)
        fg = np.abs(a[..., :3] - bgc).sum(2) > bg_tol
    wall = ((lum < dark) | ((sat < grey_s) & (lum < grey_l))) & fg
    bar = ndi.binary_dilation(wall, iterations=grow) if grow else wall
    lab, n = ndi.label(~bar)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    keep = ~np.isin(lab, list(edge)) & (fg | ~bar)
    keep = ndi.binary_fill_holes(keep)
    if transparent: keep &= a[..., 3] > 200
    else:   # 囲まれた背景（腕と胴のすき間など）を抜く
        pure = (np.abs(a[..., :3] - bgc).sum(2) <= hole_tol) & keep
        hl, hn = ndi.label(pure)
        if hn:
            ar = ndi.sum(pure, hl, range(1, hn + 1)); keep &= ~np.isin(hl, [i + 1 for i in range(hn) if ar[i] >= hole_area])
    lab2, n2 = ndi.label(keep); objs = ndi.find_objects(lab2); areas = ndi.sum(keep, lab2, range(1, n2 + 1))
    big = [i for i in range(n2) if areas[i] > min_area and objs[i][0].stop - objs[i][0].start > min_h]
    order = sorted(big, key=lambda i: (round(objs[i][0].stop / row), objs[i][1].start))
    rgba = np.array(im)
    return [dict(lab=lab2, id=i + 1, box=(objs[i][1].start, objs[i][0].start, objs[i][1].stop, objs[i][0].stop)) for i in order], rgba

def pose_image(parts, rgba, ids):
    """ids（segment の並び順の番号のリスト）の塊を 1 枚の RGBA にまとめて切り出す。"""
    sel = [parts[i] for i in ids]
    x0 = min(p['box'][0] for p in sel); y0 = min(p['box'][1] for p in sel); x1 = max(p['box'][2] for p in sel); y1 = max(p['box'][3] for p in sel)
    lab = sel[0]['lab'][y0:y1, x0:x1]; m = np.isin(lab, [p['id'] for p in sel])
    out = rgba[y0:y1, x0:x1].copy(); out[..., 3] = np.where(m, 255, 0)
    return Image.fromarray(out, 'RGBA'), (x0, y0)
