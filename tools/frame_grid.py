#!/usr/bin/env python3
"""コマを 1 枚の一覧に並べる（スキル rs-battle-flow の確認用）。
使い方：python3 tools/frame_grid.py <コマのdir または 動画> <出力.png> [--every 3] [--crop 0,170,420,670] [--cols 6] [--fps 8]
動画（.webm/.mp4/.mov）を渡すと ffmpeg でコマに分けてから並べる。各コマの左上にファイル名を入れる。"""
import sys, glob, os, subprocess, tempfile, argparse
from PIL import Image, ImageDraw
ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--every', type=int, default=3); ap.add_argument('--crop', default='')
ap.add_argument('--cols', type=int, default=6); ap.add_argument('--w', type=int, default=280); ap.add_argument('--fps', type=int, default=8)
a = ap.parse_args()
src = a.src
if os.path.isfile(src):
    d = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'fps={a.fps}', f'{d}/f_%03d.png'], check=True); src = d
fs = sorted(glob.glob(os.path.join(src, '*.png')))[::a.every]
if not fs: sys.exit('コマがない')
im0 = Image.open(fs[0]); box = tuple(map(int, a.crop.split(','))) if a.crop else (0, 0) + im0.size
W = a.w; H = round(W * (box[3] - box[1]) / (box[2] - box[0])); rows = (len(fs) + a.cols - 1) // a.cols
o = Image.new('RGB', (W * a.cols, H * rows))
for i, f in enumerate(fs):
    x, y = (i % a.cols) * W, (i // a.cols) * H
    o.paste(Image.open(f).convert('RGB').crop(box).resize((W, H)), (x, y)); ImageDraw.Draw(o).text((x + 3, y + 3), os.path.basename(f), fill='yellow')
o.save(a.out); print(a.out, len(fs), 'コマ')
