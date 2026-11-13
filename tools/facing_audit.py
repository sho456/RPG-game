#!/usr/bin/env python3
"""向きの確認シート：仲間の全ポーズ（左右反転を適用した後＝戦闘で描かれる向き）と星臨の姿を並べ、左に「←敵」を描く。
 戦闘では仲間は画面の右側に立ち、敵は左にいる。どのポーズも「左（敵の方）を向いている」ことを目で確かめる。
 usage: python3 tools/facing_audit.py <outdir> [id ...]"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import build_spx as B
from PIL import Image, ImageDraw
ORDER = ['front', 'stance', 'ready', 'lunge', 'dash', 'cast', 'hit', 'guard', 'weak', 'win', 'down', 'back', 'walk_a', 'walk_b']
out = sys.argv[1]; ids = sys.argv[2:] or ['rio'] + list(B.HEROES); os.makedirs(out, exist_ok=True)
H = int(os.environ.get("FH", 150))
for cid in ids:
    h = B.hero_rio() if cid == 'rio' else B.hero(cid)
    fr = [(n, h['frames'][n]) for n in ORDER if n in h['frames']]
    if cid in B.AWK: fr.append(('星臨', B.hero_awk(h)['frames']['awk']))
    ims = []
    for n, im in fr:
        s = H / max(im.height, 1) if im.height > H else 1; im2 = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        c = Image.new('RGBA', (im2.width + 60, H + 34), (58, 70, 52, 255)); c.alpha_composite(im2, (50, H + 16 - im2.height)); d = ImageDraw.Draw(c)
        d.polygon([(4, H // 2 + 16), (22, H // 2 + 4), (22, H // 2 + 28)], fill=(255, 80, 80)); d.text((4, H // 2 + 32), 'enemy', fill=(255, 120, 120))
        d.text((50, 2), f'{cid}:{n}', fill='#fff'); ims.append(c)
    W = sum(i.width for i in ims); o = Image.new('RGB', (min(W, int(os.environ.get("FW", 1300))), (H + 34) * ((W + 2599) // int(os.environ.get("FW", 1300)))), (0, 0, 0)); x = y = 0
    for i in ims:
        if x + i.width > int(os.environ.get("FW", 1300)): x = 0; y += H + 34
        o.paste(i.convert('RGB'), (x, y)); x += i.width
    o.save(os.path.join(out, f'face_{cid}.png'))
