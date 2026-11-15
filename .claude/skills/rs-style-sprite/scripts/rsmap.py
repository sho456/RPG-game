"""RS 風ドット絵の「地図」を絵にする（rs-style-sprite スキル）
地図＝文字列の行。'.' は透明、'o' は輪郭色、ほかの文字はパレット（dict）の色。
render(frames, pal, out_dir, refs=None)
  frames: {名前: (地図の行, 追加の点 [(x, y, 文字)…])}。追加の点（剣など）には自動で輪郭が付く
  出力：<名前>.png（48×48・足元 y=45）・preview.png（拡大の並び）・check（rs_check の結果を表示）"""
import os
from PIL import Image

PAL_BASE = {'o': '#1c1a26'}
CELL, FOOT, X0 = 48, 45, 14


def to_img(rows, extra, pal):
    im = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); px = im.load()
    h = len(rows); top = FOOT - h + 1
    def put(x, y, ch):
        if ch == '.':
            return
        X, Y = X0 + x, top + y
        if 0 <= X < CELL and 0 <= Y < CELL:
            c = pal[ch].lstrip('#'); px[X, Y] = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            put(x, y, ch)
    # 追加の点：先に輪郭（空いている 4 近傍だけ）を置いてから色を置く
    pts = set((x, y) for x, y, _ in extra)
    for x, y, _ in extra:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            X, Y = X0 + q[0], top + q[1]
            if q not in pts and 0 <= X < CELL and 0 <= Y < CELL and px[X, Y][3] == 0:
                put(q[0], q[1], 'o')
    for x, y, ch in extra:
        put(x, y, ch)
    return im


def render(frames, pal, out_dir, refs=None, scale=8):
    os.makedirs(out_dir, exist_ok=True)
    ims = []
    for name, (rows, extra) in frames.items():
        im = to_img(rows, extra or [], pal); im.save(os.path.join(out_dir, name + '.png')); ims.append((name, im))
    W = CELL * scale
    sheet = Image.new('RGBA', (W * len(ims), W), (42, 47, 68, 255))
    for i, (_, im) in enumerate(ims):
        sheet.alpha_composite(im.resize((W, W), Image.NEAREST), (i * W, 0))
    sheet.save(os.path.join(out_dir, 'preview.png'))
    try:
        from rs_check import check
        for name, im in ims:
            print(name, check(im))
    except Exception as e:  # noqa: BLE001
        print('check skipped:', e)
    return ims
