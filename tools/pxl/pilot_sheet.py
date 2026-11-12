"""パイロット確認用：一覧シートと、戦闘画面への実寸合成モックを docs/pilot/ に出力する。
usage: python3 pilot_sheet.py <ユニット非表示の戦闘スクショA> <同B>"""
import sys, os
from PIL import Image, ImageDraw
from mon_pilot import wolf, WOLF_F
from boss_pilot import volganon
from heroes import *
OUTD = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'pilot'); os.makedirs(OUTD, exist_ok=True)
SCL, DOT = 780 / 180.0, 3
def paste(bg, c, fx, fy):
    im = c.image(); big = im.resize((im.width * DOT, im.height * DOT), Image.NEAREST)
    d = ImageDraw.Draw(bg, 'RGBA'); bb = im.getbbox(); w = (bb[2] - bb[0]) * DOT * .42
    d.ellipse([int(fx * SCL) - w, int(fy * SCL) - 5, int(fx * SCL) + w, int(fy * SCL) + 7], fill=(0, 0, 0, 80))
    bg.alpha_composite(big, (int(fx * SCL) - c.ax * DOT, int(fy * SCL) - c.ay * DOT))
if len(sys.argv) > 2:
    heroes = [('idle0', False), ('atk0', False), ('idle0', True), ('cast0', False)]; outs = []
    for path, enemies, feet in ((sys.argv[1], [wolf(), wolf(WOLF_F['atk1'])], [[43, 142], [73, 208]]), (sys.argv[2], [volganon()], [[70, 196]])):
        bg = Image.open(path).convert('RGBA')
        for c, (fx, fy) in zip(enemies, feet): paste(bg, c, fx, fy)
        for (pn, aw), (fx, fy) in zip(heroes, [[149.2, 90], [145.2, 132], [145.2, 174], [149.2, 216]]): paste(bg, rio(POSE[pn], aw), fx, fy)
        outs.append(bg.crop((0, 0, 780, 1060)))
    m = Image.new('RGBA', (1570, 1060), (20, 20, 30, 255)); m.paste(outs[0], (0, 0)); m.paste(outs[1], (790, 0)); m.save(os.path.join(OUTD, 'pilot_ingame.png'))
AW = ['idle0', 'atk1', 'cast2', 'win0', 'awk']
frames = [rio(POSE[n]).image() for n in ORDER] + [rio(POSE[n], True).image() for n in AW]; names = ORDER + ['aw:' + n for n in AW]
sc, cols = 4, 8; cw = 48 * sc + 4; y0 = 22 + 4 * (48 * sc + 16) + 10
ws = [wolf(WOLF_F[n]).image() for n in ('idle0', 'atk0', 'atk1', 'hit')]; dr = volganon().image()
sheet = Image.new('RGBA', (cols * cw + 8, y0 + 14 + ws[0].height * 3 + 30 + dr.height * 3 + 20), (58, 70, 52, 255)); d = ImageDraw.Draw(sheet)
d.text((8, 6), 'RIO  48x48 cell / approx 20x30 dots / RS frame set  (x4)', fill='white')
for i, im in enumerate(frames):
    x = 4 + (i % cols) * cw; y = 22 + (i // cols) * (48 * sc + 16)
    sheet.alpha_composite(im.resize((48 * sc, 48 * sc), Image.NEAREST), (x, y)); d.text((x + 2, y + 48 * sc), names[i], fill='#dddddd')
d.text((8, y0), 'WOLF (normal enemy)  idle / windup / bite / hit  (x3)', fill='white')
for i, im in enumerate(ws): sheet.alpha_composite(im.resize((im.width * 3, im.height * 3), Image.NEAREST), (4 + i * (im.width * 3 + 6), y0 + 14))
y1 = y0 + 14 + ws[0].height * 3 + 14
d.text((8, y1), 'VOLGANON (boss)  (x3)', fill='white'); sheet.alpha_composite(dr.resize((dr.width * 3, dr.height * 3), Image.NEAREST), (4, y1 + 14))
bw = Image.new('RGBA', dr.size, (0, 0, 0, 255)); bw.putalpha(dr.split()[3]); ww = Image.new('RGBA', ws[0].size, (0, 0, 0, 255)); ww.putalpha(ws[0].split()[3])
d.text((520, y1), 'silhouette check (x2)', fill='white'); sheet.alpha_composite(bw.resize((dr.width * 2, dr.height * 2), Image.NEAREST), (520, y1 + 14)); sheet.alpha_composite(ww.resize((ww.width * 2, ww.height * 2), Image.NEAREST), (860, y1 + 60))
sheet.save(os.path.join(OUTD, 'pilot_sheet.png')); print(sheet.size)
