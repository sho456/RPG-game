"""戦闘の録画（参考動画）を、コマの一覧・明るさの時間表・効果音の図に分ける（rs-battle-fx スキル）
使い方：
  python3 vref.py <動画.mov|mp4> <出力dir> [--every 12] [--crop x,y,w,h] [--zoom x,y,w,h --from n --to n --step 2]
出力（出力 dir。scratchpad に出す。動画・コマはリポジトリに入れない）：
  frames/f###.png  … 幅 390 に縮めた全コマ（60fps なら 1 コマ＝16.7ms）
  sheet.png        … --every コマごとの一覧（時刻つき）。流れをつかむ
  zoom.png         … --zoom の範囲を原寸で切り抜き、--from〜--to を --step ごとに並べる（キャラの振り・エフェクトのコマ送り）
  timeline.txt     … コマごとの 背景の明るさ（戦場の上の帯）・全体の明るさ・白飛びの割合・前のコマとの変化。
                     暗転の始まりと終わり・閃光（変化の山）・戻りを自動で拾った「出来事」の行つき
  spec.png         … 効果音のスペクトログラム（0.5 秒ごとの赤線・1k/4kHz の青線）。命中の金属音は高い所の短い横線、
                     風・水流の層は広い帯、着弾の低音は下の縦の筋として見える
  audio.txt        … 4kHz 以上の短い音（金属音・鈴）が鳴った時刻と、0.1 秒ごとの音量
--crop：戦場だけの範囲（端末の上下の帯を除く。原寸の座標）。省くと縦の 20〜62% を戦場とみなす"""
import os
import subprocess
import sys
import wave
import numpy as np
from PIL import Image, ImageDraw


def arg(name, default=None, cast=str):
    a = sys.argv
    return cast(a[a.index(name) + 1]) if name in a else default


def frames(video, out):
    d = os.path.join(out, 'frames')
    os.makedirs(d, exist_ok=True)
    if not os.listdir(d):
        subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', 'scale=390:-2', os.path.join(d, 'f%03d.png')], check=True)
    fs = sorted(os.listdir(d))
    fps = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate,width,height',
                          '-of', 'csv=p=0', video], capture_output=True, text=True).stdout.strip().split(',')
    w, h, r = int(fps[0]), int(fps[1]), fps[2].split('/')
    return [os.path.join(d, f) for f in fs], float(r[0]) / float(r[1]), (w, h)


def sheet(fs, fps, every, out):
    pick = fs[::every]
    im0 = Image.open(pick[0])
    tw, th = im0.width // 2, im0.height // 2
    cols = 6
    c = Image.new('RGB', (cols * tw, ((len(pick) + cols - 1) // cols) * (th + 14)))
    d = ImageDraw.Draw(c)
    for i, f in enumerate(pick):
        x, y = (i % cols) * tw, (i // cols) * (th + 14)
        c.paste(Image.open(f).resize((tw, th)), (x, y + 14))
        d.text((x + 3, y), f'{i * every + 1} {i * every / fps:.2f}s', fill=(255, 255, 0))
    c.save(os.path.join(out, 'sheet.png'))


def timeline(fs, fps, crop, size, out):
    sx = 390 / size[0]
    rows = []
    prev = None
    for f in fs:
        a = np.asarray(Image.open(f).convert('RGB')).astype(float)
        if crop:
            x, y, w, h = [int(v * sx) for v in crop]
            a = a[y:y + h, x:x + w]
        else:
            H = a.shape[0]
            a = a[int(H * .2):int(H * .62)]
        bg = a[:max(8, a.shape[0] // 10)].mean()
        rows.append((bg, a.mean(), (a.mean(2) > 235).mean() * 100, 0 if prev is None else np.abs(a - prev).mean()))
        prev = a
    base = np.median([r[0] for r in rows[:max(3, len(rows) // 15)]])
    ev, dark = [], False
    for i, (bg, al, wh, df) in enumerate(rows):
        if not dark and bg < base * .8:
            dark = True
            ev.append(f'{i / fps:.2f}s 暗転の始まり（背景 {bg / base:.0%}）')
        elif dark and bg > base * .92:
            dark = False
            ev.append(f'{i / fps:.2f}s 背景が戻った')
        if df > 15 and (i == 0 or rows[i - 1][3] <= 15):
            ev.append(f'{i / fps:.2f}s 大きな変化（閃光・切り替え） {df:.0f}')
    with open(os.path.join(out, 'timeline.txt'), 'w', encoding='utf-8') as fo:
        fo.write('# 出来事\n' + '\n'.join(ev) + '\n\n# コマ  時刻  背景(基準比)  全体  白%  変化\n')
        for i, (bg, al, wh, df) in enumerate(rows):
            fo.write(f'{i + 1:4d} {i / fps:5.2f}s {bg / base:5.0%} {al:6.1f} {wh:5.1f} {df:6.1f}\n')
    print('\n'.join(ev))


def audio(video, out):
    wav = os.path.join(out, 'a.wav')
    if subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-ac', '1', '-ar', '22050', wav]).returncode:
        return
    w = wave.open(wav)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    N, hop = 1024, 110
    fr = np.fft.rfftfreq(N, 1 / sr)
    cols = [np.abs(np.fft.rfft(x[i:i + N] * np.hanning(N))) for i in range(0, len(x) - N, hop)]
    S = 20 * np.log10(np.array(cols).T + 1e-6)
    a = np.clip((S[:400][::-1] - (S.max() - 70)) / 70, 0, 1)
    im = Image.fromarray((a * 255).astype(np.uint8)).convert('RGB').resize((1000, 300))
    d = ImageDraw.Draw(im)
    dur = len(x) / sr
    for t in np.arange(0, dur, .5):
        X = int(t / dur * 1000)
        d.line([(X, 0), (X, 300)], fill=(255, 0, 0))
        d.text((X + 2, 2), f'{t:.1f}', fill=(255, 255, 0))
    for hz in (1000, 4000):
        Y = 300 - int(hz / fr[400] * 300)
        d.line([(0, Y), (1000, Y)], fill=(0, 160, 255))
        d.text((2, Y - 10), str(hz), fill=(0, 200, 255))
    im.save(os.path.join(out, 'spec.png'))
    # 高い所（4kHz〜）の細い山＝金属音・鈴
    hi = fr >= 4000
    pings, last = [], -1
    for j, c in enumerate(cols):
        s = c[hi]
        if s.max() > 8 * np.median(s) + 1e-9 and s.max() > np.percentile([cc[hi].max() for cc in cols], 75):
            t = j * hop / sr
            if t - last > .12:
                pings.append(f'{t:.2f}s（{fr[hi][np.argmax(s)]:.0f}Hz）')
                last = t
    vol = [20 * np.log10(np.sqrt((x[i:i + sr // 10] ** 2).mean()) + 1e-9) for i in range(0, len(x), sr // 10)]
    with open(os.path.join(out, 'audio.txt'), 'w', encoding='utf-8') as fo:
        fo.write('高い短い音：' + ' '.join(pings) + '\n0.1 秒ごとの音量(dB)：' + ' '.join(f'{v:.0f}' for v in vol) + '\n')
    print('高い短い音：', ' '.join(pings))


def zoom(video, out, box, f0, f1, step):
    x, y, w, h = box
    d = os.path.join(out, 'zoom')
    os.makedirs(d, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf', f"select='between(n,{f0},{f1})',crop={w}:{h}:{x}:{y}",
                    '-vsync', '0', '-start_number', str(f0), os.path.join(d, '%03d.png')], check=True)
    ns = list(range(f0, f1 + 1, step))
    cols = 8
    c = Image.new('RGB', (w * cols, (h + 16) * ((len(ns) + cols - 1) // cols)))
    dr = ImageDraw.Draw(c)
    for i, n in enumerate(ns):
        p = os.path.join(d, f'{n:03d}.png')
        if os.path.exists(p):
            X, Y = (i % cols) * w, (i // cols) * (h + 16)
            c.paste(Image.open(p), (X, Y + 16))
            dr.text((X + 3, Y + 2), str(n), fill=(255, 255, 0))
    c.save(os.path.join(out, 'zoom.png'))


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    video, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    crop = [int(v) for v in arg('--crop').split(',')] if arg('--crop') else None
    fs, fps, size = frames(video, out)
    print(f'{len(fs)} コマ・{fps:.0f}fps・{len(fs) / fps:.2f} 秒・{size[0]}×{size[1]}')
    sheet(fs, fps, arg('--every', 12, int), out)
    timeline(fs, fps, crop, size, out)
    audio(video, out)
    if arg('--zoom'):
        zoom(video, out, [int(v) for v in arg('--zoom').split(',')], arg('--from', 0, int), arg('--to', 120, int), arg('--step', 2, int))
