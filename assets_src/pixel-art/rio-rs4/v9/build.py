"""===== リオ第 9 版：下絵（生成画像 2 枚）を 32 行の RS 品質で 1 ドットずつ組み直した立ち・正面 =====
実行：python3 assets_src/pixel-art/rio-rs4/v9/build.py → v9/sprites/立ち.png・正面.png（完成素材：48×48・透過・足元 y=45）、v9/out/ に
     <名前>_x8.png（確認用の拡大）・preview.png"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
from pal import PAL      # noqa: E402
from stand import STAND  # noqa: E402
from front import FRONT  # noqa: E402
from front_shrink import FRONT_SHRINK  # noqa: E402

OUT = os.path.join(ROOT, 'out')
POSES = {'立ち': STAND, '正面': FRONT, '正面_縮小': FRONT_SHRINK}   # 正面_縮小＝下絵 2 枚目を 32px に縮めて仕上げた版


def close(rows):
    """外周を閉じる：塗りに接する透明のマス（上下左右）を黒に"""
    H, W = len(rows) + 2, max(len(r) for r in rows) + 2
    cv = [['.'] * W for _ in range(H)]
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            cv[y + 1][x + 1] = ch
    add = [(x + a, y + b) for y in range(H) for x in range(W) if cv[y][x] not in '.o'
           for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if cv[y + b][x + a] == '.']
    for x, y in add:
        cv[y][x] = 'o'
    return cv


def to_img(rows):
    cv = close(rows)
    ys = [y for y, r in enumerate(cv) if any(c != '.' for c in r)]
    xs = [x for x in range(len(cv[0])) if any(r[x] != '.' for r in cv)]
    im = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    px = im.load()
    dx, dy = 24 - (min(xs) + max(xs) + 1) // 2, 45 - max(ys)
    for y, r in enumerate(cv):
        for x, ch in enumerate(r):
            if ch != '.':
                c = PAL[ch].lstrip('#')
                px[x + dx, y + dy] = (int(c[:2], 16), int(c[2:4], 16), int(c[4:], 16), 255)
    return im


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'x8'), exist_ok=True)
    ims = {k: to_img(v) for k, v in POSES.items()}
    for k, im in ims.items():
        im.save(os.path.join(OUT, k + '.png'))
        im.save(os.path.join(ROOT, 'sprites', k + '.png'))   # 完成素材（コミットする）
        im.crop(im.getbbox()).resize((im.getbbox()[2] - im.getbbox()[0]) * 8 and
                                     ((im.getbbox()[2] - im.getbbox()[0]) * 8, (im.getbbox()[3] - im.getbbox()[1]) * 8),
                                     Image.NEAREST).save(os.path.join(OUT, 'x8', k + '_x8.png'))
    sheet = Image.new('RGBA', (48 * 6 * len(ims), 48 * 6), (226, 228, 236, 255))
    for i, im in enumerate(ims.values()):
        sheet.alpha_composite(im.resize((48 * 6, 48 * 6), Image.NEAREST), (i * 48 * 6, 0))
    sheet.save(os.path.join(OUT, 'preview.png'))
