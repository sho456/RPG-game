"""厳しい検査（rs-style-sprite 第 4 版）：1 キャラのポーズ一式を、実機 19 枚＋方眼 4 枚の実測の幅で採点する
使い方：python3 rs_strict.py <ポーズの PNG があるフォルダ>   （ファイル名＝立ち・正面・構え1・選択・瀕死・気絶 …）
  ・各ポーズ 100 点から減点。合格は全ポーズ 90 点以上かつ一貫性 90 点以上（OK にならない限り次へ進まない）
見るもの（rs_check.py より厳しい）：
  1. 大きさ：ポーズごとの高さ・幅を実機の最小〜最大 ±1 に（立ちの高さとの比も）
  2. 線：外周の純黒 0.97 以上・内側の黒 0.05〜0.16・白に近い色 0.005 以上・灰色の陰 0.15 以下・色数 17〜36
  3. 顔：立ち・正面は目の組が見つかること。正面は目の段の肌の幅 5〜7・左右対称 0.9 以上
  4. 体の破綻：塗りが 1 つにつながっていること（離れた部品・宙に浮いた点＝減点）、1 ドットの飛び出し（3 方向が空き）が 4 以下
  5. 一貫性（全ポーズ）：①立ちに無い色を使わない（剣・エフェクトの色を除き 3 色まで）②剣の刃（芯の明るい色）の長さが全ポーズで同じ
     ③髪の色の量が立ちの 0.6〜1.3 倍（頭の大きさがポーズでぶれない）④肌の色の量が立ちの 0.4〜1.6 倍"""
import os
import sys
import warnings
from collections import Counter
from PIL import Image

warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rs_check import measure, lum, hsv  # noqa: E402
from rs_check import is_skin as _sk  # noqa: E402


def is_skin(c):
    return _sk(tuple(c[:3]) + (255,))

# 実機の実測の幅（48 のマスの高さ・幅。幅は武器込み）と立ちとの比
SPEC = {
    '立ち': dict(h=(29, 32), w=(13, 22)),
    '正面': dict(h=(29, 31), w=(14, 19), sym=.9),
    '構え': dict(h=(27, 30), w=(19, 30), hr=(.88, .98)),
    '選択': dict(h=(28, 31), w=(19, 30), hr=(.92, 1.02)),
    '瀕死': dict(h=(23, 27), w=(16, 30), hr=(.78, .88)),
    '気絶': dict(h=(13, 18), w=(27, 36), hr=(.42, .58)),
}
FACE = ('立ち', '正面')   # 構え・選択は実機でも顔が横を向き目の組が見えないことがある


def kind(name):
    for k in SPEC:
        if name.startswith(k):
            return k
    return None


def components(px, w, h):
    seen, comps = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and (x, y) not in seen:
                st, c = [(x, y)], 0
                seen.add((x, y))
                while st:
                    a, b = st.pop()
                    c += 1
                    for d in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                        q = (a + d[0], b + d[1])
                        if 0 <= q[0] < w and 0 <= q[1] < h and q not in seen and px[q][3]:
                            seen.add(q)
                            st.append(q)
                comps.append(c)
    return comps


def spikes(px, w, h):
    n = 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and lum(px[x, y]) >= 62:
                empty = sum(1 for d in ((1, 0), (-1, 0), (0, 1), (0, -1)) if not (0 <= x + d[0] < w and 0 <= y + d[1] < h) or not px[x + d[0], y + d[1]][3])
                if empty >= 3:
                    n += 1
    return n


def fam(c):
    hh, s, v = hsv(c)
    if lum(c) < 62:
        return 'line'
    if is_skin(c):
        return 'skin'
    return None


def score_pose(name, im, stand):
    k = kind(name)
    m = measure(im)
    px = im.load()
    w, h = im.size
    pen, notes = 0, []

    def bad(p, msg):
        nonlocal pen
        pen += p
        notes.append(f'-{p} {msg}')
    if k:
        S = SPEC[k]
        if not S['h'][0] <= m['h'] <= S['h'][1]:
            bad(15, f"高さ {m['h']}（実機 {S['h'][0]}〜{S['h'][1]}）")
        if not S['w'][0] <= m['w'] <= S['w'][1]:
            bad(10, f"幅 {m['w']}（実機 {S['w'][0]}〜{S['w'][1]}）")
        if 'hr' in S and stand:
            r = m['h'] / stand['h']
            if not S['hr'][0] <= r <= S['hr'][1]:
                bad(15, f"立ちとの高さの比 {r:.2f}（実機 {S['hr'][0]}〜{S['hr'][1]}）")
        if 'sym' in S and m['symmetry'] < S['sym']:
            bad(15, f"左右対称 {m['symmetry']}（{S['sym']} 以上）")
    if m['silhouette_pure'] < .97:
        bad(10, f"外周の純黒 {m['silhouette_pure']}（0.97 以上）")
    if not .05 <= m['inner_line'] <= .16:
        bad(10, f"内側の黒 {m['inner_line']}（実機 0.05〜0.16）")
    if m['white'] < .005:
        bad(5, f"白に近い色 {m['white']}（0.005 以上）")
    if m['grey'] > .15:
        bad(5, f"灰色の陰 {m['grey']}（0.15 以下）")
    if not 17 <= m['colors'] <= 36:
        bad(5, f"色数 {m['colors']}（17〜36）")
    if k in FACE and not m['eyes']:
        bad(20, '目の組が見つからない（まぶた・瞳・虹彩の 3 段×2）')
    if k == '正面' and m['eyes']:
        (x1, y1), (x2, y2) = m['eyes']
        row = y1 + 1
        sk = sum(1 for x in range(w) if px[x, row][3] and is_skin(px[x, row]))
        if not 4 <= sk <= 8:
            bad(10, f'正面の目の段の肌 {sk}（実機 5〜7）')
    comps = sorted(components(px, w, h), reverse=True)
    if len(comps) > 1:
        bad(10 * min(3, len(comps) - 1), f'塗りが {len(comps)} つに分かれている（離れた部品・浮いた点 {comps[1:]}）')
    sp = spikes(px, w, h)
    if sp > 4:
        bad(min(15, (sp - 4) * 3), f'1 ドットの飛び出し {sp}（4 以下）')
    return max(0, 100 - pen), notes, m


def consistency(ims):
    st = ims.get('立ち')
    if not st:
        return 0, ['立ちが無い']
    pen, notes = 0, []

    def colors(im):
        return Counter(p[:3] for p in im.getdata() if p[3])
    sc = colors(st)
    base = set(sc)
    steel = lambda c: hsv(c)[1] < .25 and lum(c) > 120

    def blade_len(im):
        return sum(1 for p in im.getdata() if p[3] and steel(p[:3]) and lum(p[:3]) > 200)
    bl = {k: blade_len(v) for k, v in ims.items() if k != '正面'}
    hair = lambda c: c in base and 20 < hsv(c)[0] * 360 < 60 and hsv(c)[1] > .5 and not is_skin(c)
    hs = sum(n for c, n in sc.items() if hair(c))
    sk = sum(n for c, n in sc.items() if is_skin(c))
    for k, im in ims.items():
        c = colors(im)
        new = [x for x in c if x not in base and not steel(x)]
        if len(new) > 3:
            pen += 5
            notes.append(f'-5 {k}：立ちに無い色 {len(new)}')
        hk = sum(n for x, n in c.items() if hair(x))
        lo, hi = (.8, 1.5) if k == '正面' else (.6, 1.3)     # 正面は髪が両脇に広がる分だけ多い
        if k not in ('気絶',) and hs and not lo <= hk / hs <= hi:
            pen += 8
            notes.append(f'-8 {k}：髪の量が立ちの {hk / hs:.2f} 倍（頭の大きさがぶれる）')
        skk = sum(n for x, n in c.items() if is_skin(x))
        if sk and not .4 <= skk / sk <= 1.6:
            pen += 4
            notes.append(f'-4 {k}：肌の量が立ちの {skk / sk:.2f} 倍')
    vals = [v for v in bl.values() if v >= 4]          # 剣を持たないポーズ（白目の 2〜3 ドットだけ）は除く
    if vals and max(vals) - min(vals) > 3:
        pen += 10
        notes.append(f'-10 剣の刃の長さがポーズでばらばら {bl}')
    return max(0, 100 - pen), notes


def main(d):
    names = [f[:-4] for f in sorted(os.listdir(d)) if f.endswith('.png') and not f.startswith(('preview', 'compare', 'skill'))]
    ims = {n: Image.open(os.path.join(d, n + '.png')).convert('RGBA') for n in names}
    stand = measure(ims['立ち']) if '立ち' in ims else None
    ok = True
    for n in names:
        s, notes, m = score_pose(n, ims[n], stand)
        if kind(n) and s < 90:
            ok = False
        print(f'{s:3d}  {n}  ' + ('  '.join(notes) if notes else 'OK'))
    c, notes = consistency(ims)
    print(f'{c:3d}  一貫性  ' + ('  '.join(notes) if notes else 'OK'))
    ok = ok and c >= 90
    print('合格' if ok else '不合格（90 点未満がある）')
    return ok


if __name__ == '__main__':
    sys.exit(0 if main(sys.argv[1]) else 1)
