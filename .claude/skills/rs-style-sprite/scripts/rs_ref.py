"""参考の拡大画像（スクショ・WebP・JPEG）を実寸のドット絵に戻し、数を取る（rs-style-sprite スキル 第 2 版）
使い方：
  python3 rs_ref.py <出力dir> <画像>[:ポーズ] [...]        例）rs_ref.py /tmp/ref a.webp:正面 b.webp:立ち c.webp:構え
  ・倍率（1 ドットが何画素か）と格子のずれは、色の変わり目の間隔の最頻値から自動で求める（方眼の線が無い画像向け。方眼なら grid2png.py）
  ・各マスの内側 4×4 の中央値を取る（WebP・JPEG の揺れを消す）。白い背景は四隅からの塗りつぶしで透明に（白目・ハイライトは残る）
  ・出力：<dir>/<番号><ポーズ>.png（実寸）・sheet.png（等倍 ×8 の並び）・grid.png（格子と 8 ドットごとの線）・report.txt（rs_check の数値）
参考の画像そのものはリポジトリに入れない（scratchpad に出す）。学習記録には数値と決まりだけを書く"""
import os
import sys
from collections import Counter
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rs_check import check  # noqa: E402


def scale_of(a):
    d = np.abs(np.diff(a, axis=1)).sum(2) > 90
    cols = np.where(d.any(0))[0]
    g = Counter(np.diff(cols)).most_common(1)
    p = int(g[0][0]) if g else 1
    off = Counter((cols + 1) % p).most_common(1)[0][0] if p > 1 else 0
    return max(1, p), int(off)


def native(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    p, off = scale_of(a)
    H, W = (a.shape[0] - off) // p, (a.shape[1] - off) // p
    n = np.zeros((H, W, 3), int)
    m = max(0, p // 4)
    for y in range(H):
        for x in range(W):
            c = a[off + y * p + m:off + (y + 1) * p - m, off + x * p + m:off + (x + 1) * p - m].reshape(-1, 3)
            n[y, x] = np.median(c, 0)
    bg = np.zeros((H, W), bool)
    st = [(0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1)]
    while st:
        y, x = st.pop()
        if 0 <= y < H and 0 <= x < W and not bg[y, x] and n[y, x].min() > 235:
            bg[y, x] = True
            st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    im = Image.new('RGBA', (W, H))
    px = im.load()
    for y in range(H):
        for x in range(W):
            if not bg[y, x]:
                px[x, y] = tuple(int(v) for v in n[y, x]) + (255,)
    return im, p


def main(out, items):
    os.makedirs(out, exist_ok=True)
    POSEK = {'正面': 'front', '立ち': 'stand', '構え': 'ready', '瀕死': 'weak', '気絶': 'down'}
    ims, rep = [], []
    stand_h = None
    parsed = [(s.rsplit(':', 1) + [''])[:2] if ':' in s else [s, '立ち'] for s in items]
    for path, pose in parsed:
        im, p = native(path)
        k = POSEK.get(pose, pose or 'stand')
        if k == 'stand' and stand_h is None:
            stand_h = check(im, 'stand')['h']
        ims.append((path, pose, k, im, p))
    for i, (path, pose, k, im, p) in enumerate(ims):
        name = f'{i + 1:02d}{pose}'
        im.save(os.path.join(out, name + '.png'))
        r = check(im, k, stand_h or 30)
        rep.append(f'{name} ×{p} {os.path.basename(path)}\n  {r}')
    s = 8
    W, H = ims[0][3].size
    sheet = Image.new('RGBA', (W * s * len(ims), H * s), (60, 64, 90, 255))
    grid = Image.new('RGBA', (W * 6 * len(ims), H * 6), (205, 205, 215, 255))
    d = ImageDraw.Draw(grid)
    for i, (*_, im, p) in enumerate(ims):
        sheet.alpha_composite(im.resize((W * s, H * s), Image.NEAREST), (i * W * s, 0))
        grid.alpha_composite(im.resize((W * 6, H * 6), Image.NEAREST), (i * W * 6, 0))
    for x in range(0, grid.width + 1, 6):
        d.line([(x, 0), (x, grid.height)], fill=(120, 120, 255, 255) if (x // 6) % 8 == 0 else (180, 180, 195, 255))
    for y in range(0, grid.height + 1, 6):
        d.line([(0, y), (grid.width, y)], fill=(120, 120, 255, 255) if (y // 6) % 8 == 0 else (180, 180, 195, 255))
    sheet.save(os.path.join(out, 'sheet.png'))
    grid.save(os.path.join(out, 'grid.png'))
    open(os.path.join(out, 'report.txt'), 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
    print('\n'.join(rep))


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2:])
