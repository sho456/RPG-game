"""方眼（1 マス＝1 ドット）のスクリーンショットを、実寸のドット絵 PNG に戻す（rs-style-sprite スキル）
使い方：python3 grid2png.py <方眼の画像.png> <出力.png> [--cells 32] [--pitch 20]
・マスの大きさ（pitch）は画像の幅 ÷ マス数から推定し、格子線の位置（ずれ）は暗い線の周期から求める
・白いマスは透明に。各マスの中央の最頻色を取る（格子線・点線を避ける）
参考に送られた方眼の絵を学習・比較するときに使う（学習の手順は pixel-art-studio の study.py）"""
import sys
from collections import Counter
import numpy as np
from PIL import Image


def convert(src, dst, cells=32, pitch=None):
    a = np.array(Image.open(src).convert('RGB')).astype(int); h, w, _ = a.shape
    p = pitch or round(min(w, h) / cells)
    dark = a.sum(2) < 250
    def off(prof):
        return int(np.argmax([prof[o::p][:cells - 1].sum() for o in range(p)]))
    ox, oy = off(dark.mean(0)), off(dark.mean(1))
    out = np.zeros((cells, cells, 4), np.uint8); m = max(2, p // 5)
    for j in range(cells):
        for i in range(cells):
            x0, y0 = ox + i * p + m, oy + j * p + m
            cell = a[y0:y0 + p - 2 * m, x0:x0 + p - 2 * m].reshape(-1, 3)
            if not len(cell):
                continue
            c = Counter(map(tuple, cell)).most_common(1)[0][0]
            if sum(c) > 720:
                continue
            out[j, i, :3] = c; out[j, i, 3] = 255
    Image.fromarray(out, 'RGBA').save(dst)
    return dst


if __name__ == '__main__':
    args = sys.argv[1:]
    cells = int(args[args.index('--cells') + 1]) if '--cells' in args else 32
    pitch = int(args[args.index('--pitch') + 1]) if '--pitch' in args else None
    print(convert(args[0], args[1], cells, pitch))
