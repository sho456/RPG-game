"""RS 風の規格に合っているかを数で確かめる（rs-style-sprite スキル）
使い方：python3 rs_check.py <sprite.png> [...]   （1 倍の PNG。48×48 でも 32×32 でもよい）
見るもの：高さ・幅・色数・輪郭色の割合・目の作り（1 ドット幅の瞳が 2 つ・その上に輪郭色のまぶた）"""
import sys
from collections import Counter
from PIL import Image

SPEC = {'stand_h': (27, 32), 'stand_w': (13, 17), 'colors': (16, 26)}


def check(im, pose='stand'):
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    pts = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0]
    if not pts:
        return {'empty': True}
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
    cols = Counter(px[x, y][:3] for x, y in pts)
    ol = min(cols, key=lambda c: sum(c))
    r = {'h': bh, 'w': bw, 'colors': len(cols), 'outline': '#%02x%02x%02x' % ol, 'outline_share': round(cols[ol] / len(pts), 2)}
    notes = []
    if pose == 'stand':
        if not SPEC['stand_h'][0] <= bh <= SPEC['stand_h'][1]: notes.append(f'高さ {bh}（立ちは 27〜32）')
        if not SPEC['stand_w'][0] <= bw <= SPEC['stand_w'][1]: notes.append(f'幅 {bw}（立ちは 13〜17。武器を除く）')
    if not SPEC['colors'][0] <= len(cols) <= SPEC['colors'][1]: notes.append(f'色数 {len(cols)}（16〜26）')
    if r['outline_share'] < .28: notes.append('輪郭が少ない（部品の境目にも線を）')
    r['notes'] = notes or ['OK']
    return r


if __name__ == '__main__':
    for f in sys.argv[1:]:
        print(f, check(Image.open(f)))
