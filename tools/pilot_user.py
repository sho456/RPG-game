#!/usr/bin/env python3
"""提供原画（assets_src/originals）をゲーム用スプライト（assets/sprites）へ変換し、確認シートと実寸モックを docs/pilot に出す。
usage: python3 tools/pilot_user.py [ユニット非表示の戦闘スクショA 同B]"""
import sys, os
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from import_art import convert, split_cells, to_image
ROOT = os.path.join(os.path.dirname(__file__), '..'); SRC = os.path.join(ROOT, 'assets_src', 'originals'); DST = os.path.join(ROOT, 'assets', 'sprites'); PIL_ = os.path.join(ROOT, 'docs', 'pilot')
HERO_K = 52 / 289            # 剣士：立ち姿の高さが約 52 ドットになる倍率（全ポーズ共通）
HERO_POSES = ['front', 'ready', 'stance', 'lunge', 'dash', 'back', 'down']
def build():
    out = {}
    idx, pal, _ = convert(Image.open(os.path.join(SRC, 'boss9_volganon.png')), target_w=200, tol=40, colors=32, hole_area=150, hole_tol=40); out['boss9'] = to_image(idx, pal)
    idx, pal, _ = convert(Image.open(os.path.join(SRC, 'wolf.png')), target_w=116, tol=70, colors=24); out['wolf'] = to_image(idx, pal)
    for n, c in zip(HERO_POSES, split_cells(Image.open(os.path.join(SRC, 'hero_swordsman_7poses.png')), min_gap=20)):
        idx, pal, _ = convert(c, bg='alpha', colors=32, k=HERO_K); out['hero_' + n] = to_image(idx, pal)
    for k, im in out.items(): im.save(os.path.join(DST, k + '.png'))
    return out
if __name__ == '__main__':
    S = build(); print({k: v.size for k, v in S.items()})
    sc = 4; hs = [S['hero_' + n] for n in HERO_POSES]; d, w = S['boss9'], S['wolf']
    sheet = Image.new('RGBA', (max(d.width * sc + w.width * sc + 40, sum(i.width * sc + 12 for i in hs) + 16), d.height * sc + max(i.height for i in hs) * sc + 70), (58, 70, 52, 255)); dr = ImageDraw.Draw(sheet)
    dr.text((8, 4), 'converted from supplied art  (game grid, x4)   boss %dx%d   wolf %dx%d   hero h=%d' % (d.width, d.height, w.width, w.height, hs[0].height), fill='white')
    sheet.alpha_composite(d.resize((d.width * sc, d.height * sc), Image.NEAREST), (8, 20)); sheet.alpha_composite(w.resize((w.width * sc, w.height * sc), Image.NEAREST), (d.width * sc + 30, 20 + (d.height - w.height) * sc))
    x = 8; y = 30 + d.height * sc
    for n, im in zip(HERO_POSES, hs):
        sheet.alpha_composite(im.resize((im.width * sc, im.height * sc), Image.NEAREST), (x, y + (max(i.height for i in hs) - im.height) * sc)); dr.text((x, y + max(i.height for i in hs) * sc + 2), n, fill='#dddddd'); x += im.width * sc + 12
    sheet.save(os.path.join(PIL_, 'pilot_sheet.png'))
    if len(sys.argv) > 2:
        DOT = 2; SCL = 780 / 180.0; outs = []
        def paste(bg, im, fx, fy, ax=None):
            big = im.resize((im.width * DOT, im.height * DOT), Image.NEAREST); ax = im.width // 2 if ax is None else ax
            dd = ImageDraw.Draw(bg, 'RGBA'); ww = im.width * DOT * .4; dd.ellipse([int(fx * SCL) - ww, int(fy * SCL) - 5, int(fx * SCL) + ww, int(fy * SCL) + 7], fill=(0, 0, 0, 80))
            bg.alpha_composite(big, (int(fx * SCL) - ax * DOT, int(fy * SCL) - (im.height - 2) * DOT))
        for path, en in ((sys.argv[1], [(w, 42, 142), (w, 62, 214)]), (sys.argv[2], [(d, 60, 204)])):
            bg = Image.open(path).convert('RGBA')
            for im, fx, fy in en: paste(bg, im, fx, fy)
            for n, (fx, fy) in zip(['stance', 'ready', 'lunge', 'stance'], [[149.2, 90], [145.2, 132], [138, 174], [149.2, 216]]): paste(bg, S['hero_' + n], fx, fy)
            outs.append(bg.crop((0, 0, 780, 1060)))
        m = Image.new('RGBA', (1570, 1060), (20, 20, 30, 255)); m.paste(outs[0], (0, 0)); m.paste(outs[1], (790, 0)); m.save(os.path.join(PIL_, 'pilot_ingame.png'))
