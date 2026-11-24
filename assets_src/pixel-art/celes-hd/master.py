# ===== セレス 正本の原画（通常・正面／星臨／瀕死）の 2K JPG を 1 マス＝1 ドットに戻す =====
# 使い方：python3 master.py  → src/master/celes_{front,seirin}_raw.png（背景つき）と grid.json
# マス目は縦横の明るさの変化の周期から測る（周期は約 22.5px。広く探すと 2 倍の 45px を拾うので 20〜24px に絞る。縦横は別々に測る）。
import json, numpy as np
from PIL import Image
SRC = {'front': 'src/master/celes_front_2k.jpg', 'seirin': 'src/master/celes_seirin_2k.jpg', 'dying': 'src/master/celes_dying_2k.jpg'}

def score(g, p, ph):
    idx = np.round(np.arange(ph, len(g) - 1, p)).astype(int)
    return g[idx].mean()

def fit(g):
    g = g / g.mean()
    best = (0, 0, 0)
    for p in np.arange(20, 24, 0.01):
        for ph in np.arange(0, p, 1.0):
            s = score(g, p, ph)
            if s > best[0]: best = (s, p, ph)
    s, p, ph0 = best
    for ph in np.arange(ph0 - 1, ph0 + 1, 0.1):  # 位相を細かく
        t = score(g, p, ph)
        if t > s: s, ph0 = t, ph
    return p, ph0, s

def sample(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    L = a.mean(2)
    gx = np.abs(np.diff(L, axis=1)).sum(0); gy = np.abs(np.diff(L, axis=0)).sum(1)
    px, phx, sx = fit(gx); py, phy, sy = fit(gy)
    xs = np.arange(phx + 0.5, a.shape[1] - px * .75, px); ys = np.arange(phy + 0.5, a.shape[0] - py * .75, py)
    out = np.zeros((len(ys), len(xs), 3), np.uint8)
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            c = a[int(y + py * .3):int(y + py * .7) + 1, int(x + px * .3):int(x + px * .7) + 1].reshape(-1, 3)
            out[j, i] = np.median(c, 0)
    return out, dict(px=round(float(px), 3), py=round(float(py), 3), phx=round(float(phx), 2), phy=round(float(phy), 2), score=[round(float(sx), 2), round(float(sy), 2)], size=[len(xs), len(ys)])

if __name__ == '__main__':
    info = {}
    for k, f in SRC.items():
        out, inf = sample(f)
        Image.fromarray(out).save(f'src/master/celes_{k}_raw.png')
        info[k] = inf; print(k, inf)
    json.dump(info, open('src/master/grid.json', 'w'), ensure_ascii=False, indent=1)
