"""RS 風の規格に合っているかを数で確かめる（rs-style-sprite スキル 第 3 版）
使い方：
  python3 rs_check.py <sprite.png> [...] [--pose stand|front|ready|cast|act|weak|down] [--stand 立ち.png] [--json]
  ・1 倍の PNG（48×48 でも 32×32 でもよい。背景は透明）。--pose を省くとファイル名から推す（正面/構え/瀕死/気絶/…）
  ・--stand に同じキャラの立ちを渡すと、構え・瀕死・気絶の高さを「立ちとの比」で見る（無ければ立ち＝30 として見る）
見るもの（数値の根拠は SKILL.md 2 章・references/measure-v2.md。ユーザー提供の RS 実機 11 枚の実測）：
  大きさ（高さ・幅・地面）・重心（頭と足の左右のずれ）・色数・外の輪郭の純度・内側の黒線の量・白に近いハイライト・
  灰色の陰の量・目の組（黒いまぶた＋黒い瞳の上段＋色の付いた虹彩の下段が、同じ段に 2〜3 ドット間隔で 2 つ）"""
import colorsys
import json
import os
import sys
from collections import Counter
from PIL import Image

# ポーズごとの決まり（h・w は立ちの高さ Hs に対する比 or 絶対値。lean＝頭の重心 x − 足の重心 x。左向きは負）
POSE = {
    'stand': dict(h=(27, 32), w=(13, 17), lean=(-4.5, 0.5), eyes=True),
    'front': dict(h=(27, 32), w=(15, 19), lean=(-1.0, 1.0), eyes=True, sym=.75),
    'ready': dict(hr=(.90, 1.0), w=(20, 26), lean=(-7.0, 1.0), eyes=False),
    'weak': dict(hr=(.78, .90), w=(18, 25), lean=(-6.0, 1.0), eyes=False),
    'cast': dict(hr=(.9, 1.1), w=(13, 30), lean=None, eyes=False, closed=True),
    'act': dict(hr=(.85, 1.15), w=(16, 40), lean=None, eyes=False),
    'down': dict(hr=(.44, .54), w=(27, 33), lean=None, eyes=False),
}
NAME = [('正面', 'front'), ('front', 'front'), ('構え', 'ready'), ('ready', 'ready'), ('stance', 'ready'),
        ('詠唱', 'cast'), ('cast', 'cast'), ('発動', 'act'), ('act', 'act'), ('瀕死', 'weak'), ('weak', 'weak'), ('気絶', 'down'), ('倒れ', 'down'), ('down', 'down')]


def lum(c):
    return .299 * c[0] + .587 * c[1] + .114 * c[2]


def hsv(c):
    return colorsys.rgb_to_hsv(*(v / 255 for v in c[:3]))


def is_skin(c):
    h, s, v = hsv(c)
    return c[3] > 0 and (h < .11 or h > .97) and .07 < s < .66 and v > .75


def palette(cols, tol=36, min_px=2):
    """近い色（JPEG・WebP の揺れ）を 1 色にまとめて数える"""
    cl = []
    for c, n in cols.most_common():
        for k in cl:
            if sum(abs(a - b) for a, b in zip(c, k[0])) < tol:
                k[1] += n
                break
        else:
            cl.append([c, n])
    return [k for k in cl if k[1] >= min_px]


def eye_pair(px, w, h, y0, y1):
    """まぶた（暗）→ 瞳の上段（暗）→ 虹彩（彩度のある色）の縦 3 段を探し、同じ段で 2〜3 ドット離れた組を返す"""
    dark = lambda c: c[3] > 0 and lum(c) < 62
    cand = []
    for y in range(y0 + 3, y0 + (y1 - y0) * 2 // 3):
        for x in range(1, w - 1):
            a, b, up = px[x, y], px[x, y + 1], px[x, y - 1]
            if not (dark(a) and dark(up) and b[3] and not dark(b) and not is_skin(b)):
                continue
            hh, s, v = hsv(b)
            if s < .3 or v < .2:
                continue
            sk = sum(1 for dx in range(-2, 3) for dy in range(-1, 4)
                     if 0 <= x + dx < w and 0 <= y + dy < h and is_skin(px[x + dx, y + dy]))
            if sk >= 4:
                cand.append((x, y))
    for i, (x, y) in enumerate(cand):
        for x2, y2 in cand[i + 1:]:
            if abs(y2 - y) <= 0 and 2 <= abs(x2 - x) <= 3:
                return [(x, y), (x2, y2)]
    return None


def scheme(px, pts, y0, h):
    """配色の型：頭（上 45%）と体（下 50%）でいちばん多い色相（肌・黒・白・灰を除く）と、その差の角度"""
    def dom(L):
        c = Counter()
        for q in L:
            v = px[q]
            hh, ss, vv = hsv(v)
            if lum(v) < 45 or ss < .15 or is_skin(v):
                continue
            c[int(hh * 12 + .5) % 12] += 1
        if not c:
            return None, 0
        k, n = c.most_common(1)[0]
        return k * 30, round(n / max(1, sum(c.values())), 2)
    hd, hs = dom([q for q in pts if q[1] < y0 + h * .45])
    bd, bs = dom([q for q in pts if q[1] >= y0 + h * .5])
    if hd is None or bd is None:
        return None
    d = abs(hd - bd) % 360
    d = min(d, 360 - d)
    kind = '補色型' if d >= 120 else '同系型' if d <= 30 else '対比型'
    return dict(hair_hue=hd, hair_share=hs, body_hue=bd, body_share=bs, diff=d, kind=kind)


def closed_eyes(px, w, h, y0, y1):
    """閉じた目：顔の中の横 2 ドットの暗い線（上下が肌）"""
    dark = lambda c: c[3] > 0 and lum(c) < 62
    out = []
    for y in range(y0 + 4, y0 + (y1 - y0) * 2 // 3):
        for x in range(1, w - 2):
            if dark(px[x, y]) and dark(px[x + 1, y]) and not dark(px[x + 2, y]) and not dark(px[x - 1, y]) \
                    and is_skin(px[x, y + 1]) and is_skin(px[x + 1, y + 1]) and (is_skin(px[x, y - 1]) or is_skin(px[x + 1, y - 1])):
                out.append((x, y))
    return out or None


def measure(im):
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    pts = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0]
    if not pts:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    cols = Counter(px[x, y][:3] for x, y in pts)
    pal = palette(cols)
    ol = min(cols, key=lum)
    is_ol = lambda c: c[3] > 0 and sum(abs(a - b) for a, b in zip(c[:3], ol)) < 30
    def edge(x, y):
        return any(not (0 <= x + dx < w and 0 <= y + dy < h) or px[x + dx, y + dy][3] == 0
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    ed = [p for p in pts if edge(*p)]
    blk = [p for p in pts if is_ol(px[p])]
    inner = [p for p in blk if not edge(*p)]
    top = [x for x, y in pts if y < y0 + 8]
    bot = [x for x, y in pts if y > y1 - 3]
    ground = sorted(x for x, y in pts if y == y1)
    segs = 1 + sum(1 for i in range(1, len(ground)) if ground[i] - ground[i - 1] > 1)
    fill = [p for p in pts if not is_ol(px[p])]
    grey = sum(1 for p in fill if hsv(px[p])[1] < .1 and 60 < lum(px[p]) < 225)
    white = sum(1 for p in fill if lum(px[p]) > 235)
    left = sum(1 for x, y in pts if x < (x0 + x1) / 2)
    mirror = sum(1 for x, y in pts if 0 <= x0 + x1 - x < w and px[x0 + x1 - x, y][3] > 0) / len(pts)
    return dict(h=y1 - y0 + 1, w=x1 - x0 + 1, ground=y1, contacts=segs,
                lean=round(sum(top) / len(top) - sum(bot) / len(bot), 1),
                colors=len(pal), outline='#%02x%02x%02x' % ol,
                outline_share=round(len(blk) / len(pts), 2),
                silhouette_pure=round(sum(1 for p in ed if is_ol(px[p])) / len(ed), 2),
                inner_line=round(len(inner) / len(pts), 2),
                white=round(white / len(pts), 3), grey=round(grey / len(pts), 2),
                symmetry=round(mirror, 2), left_share=round(left / len(pts), 2),
                eyes=eye_pair(px, w, h, y0, y1), closed=closed_eyes(px, w, h, y0, y1),
                scheme=scheme(px, pts, y0, y1 - y0 + 1))


def check(im, pose='stand', stand_h=30):
    m = measure(im)
    if m is None:
        return {'empty': True}
    P = POSE.get(pose, POSE['stand'])
    notes = []
    if 'h' in P and not P['h'][0] <= m['h'] <= P['h'][1]:
        notes.append(f"高さ {m['h']}（{pose} は {P['h'][0]}〜{P['h'][1]}）")
    if 'hr' in P:
        r = m['h'] / stand_h
        if not P['hr'][0] <= r <= P['hr'][1]:
            notes.append(f"高さ {m['h']}＝立ちの {r:.2f} 倍（{pose} は {P['hr'][0]}〜{P['hr'][1]} 倍）")
    if not P['w'][0] <= m['w'] <= P['w'][1]:
        notes.append(f"幅 {m['w']}（{pose} は {P['w'][0]}〜{P['w'][1]}。武器・エフェクトは除いて見る）")
    if P['lean'] and not P['lean'][0] <= m['lean'] <= P['lean'][1]:
        notes.append(f"重心のずれ {m['lean']}（{pose} は {P['lean'][0]}〜{P['lean'][1]}。負＝頭が敵側＝左）")
    if pose == 'front' and m['symmetry'] < P['sym']:
        notes.append(f"左右の対称 {m['symmetry']}（正面は {P['sym']} 以上）")
    if not 15 <= m['colors'] <= 36:
        notes.append(f"色数 {m['colors']}（15〜36。素朴な服 17〜22・装飾の多い服 28〜36）")
    if m['silhouette_pure'] < .92:
        notes.append(f"外の輪郭の純度 {m['silhouette_pure']}（外周は 1 色の黒でほぼ全部＝0.92 以上。エフェクトは別の層に）")
    if m['inner_line'] > .18:
        notes.append(f"内側の黒線 {m['inner_line']}（0.06〜0.16。内側の境目は黒ではなく、その素材のいちばん暗い色で）")
    elif m['inner_line'] < .04:
        notes.append(f"内側の黒線 {m['inner_line']}（少なすぎ。目・まぶた・腕と胴の重なり・前髪の下には黒を）")
    if not .2 <= m['outline_share'] <= .4:
        notes.append(f"黒の割合 {m['outline_share']}（0.24〜0.34 が目安）")
    if m['white'] < .004 and pose != 'down':
        notes.append(f"白に近いハイライト {m['white']}（髪・金属・白目に #ffffff 近くを 0.5〜9%）")
    if m['grey'] > .2:
        notes.append(f"灰色の陰 {m['grey']}（陰は色相をずらした色で。灰色は鎧・刃だけで 15% まで）")
    if P.get('closed') and not m['closed'] and not m['eyes']:
        notes.append('詠唱は目を閉じる（顔の中に横 2 ドットの黒線、上下は肌）')
    if P['eyes'] and not m['eyes']:
        notes.append('目の組が見つからない（黒いまぶた／黒い瞳／色の虹彩の 3 段を、同じ段に 2〜3 ドット間隔で 2 つ）')
    m['pose'] = pose
    m['notes'] = notes or ['OK']
    return m


def guess(path):
    n = os.path.basename(path).lower()
    for k, v in NAME:
        if k in n:
            return v
    return 'stand'


if __name__ == '__main__':
    a = sys.argv[1:]
    pose = a[a.index('--pose') + 1] if '--pose' in a else None
    st = a[a.index('--stand') + 1] if '--stand' in a else None
    js = '--json' in a
    files = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or a[i - 1] not in ('--pose', '--stand'))]
    sh = measure(Image.open(st))['h'] if st else 30
    for f in files:
        r = check(Image.open(f), pose or guess(f), sh)
        print(json.dumps({f: r}, ensure_ascii=False) if js else f'{f}  {r}')
