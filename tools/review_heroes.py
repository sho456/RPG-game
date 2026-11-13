#!/usr/bin/env python3
"""味方スプライトの確認用一覧：assets/sprites/<id>_<pose>.png（戦闘の中くらいのサイズ）を、ポーズ順に 3 倍で並べる。
 usage: python3 tools/review_heroes.py out.png id [id...]"""
import sys, os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ORDER = ['front', 'stance', 'ready', 'lunge', 'dash', 'cast', 'hit', 'guard', 'weak', 'win', 'down', 'back', 'walk_a', 'walk_b', 'stand']
out, ids = sys.argv[1], sys.argv[2:]; sc = 3; rows = []
for cid in ids:
    ims = [(n, Image.open(p)) for n in ORDER for p in [os.path.join(ROOT, 'assets', 'sprites', f'{cid}_{n}.png')] if os.path.exists(p)]
    rows.append((cid, ims))
H = max(max(im.height for _, im in r) for _, r in rows) * sc + 16; W = max(sum(im.width * sc + 8 for _, im in r) for _, r in rows) + 60
o = Image.new('RGBA', (W, H * len(rows)), (58, 70, 52, 255)); d = ImageDraw.Draw(o)
for j, (cid, r) in enumerate(rows):
    x = 60; y0 = j * H; d.text((4, y0 + 4), cid, fill='#fff')
    for n, im in r:
        o.alpha_composite(im.resize((im.width * sc, im.height * sc), Image.NEAREST), (x, y0 + H - 14 - im.height * sc)); d.text((x, y0 + H - 12), n, fill='#ddd'); x += im.width * sc + 8
o.save(out)
