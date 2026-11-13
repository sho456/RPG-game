#!/usr/bin/env python3
"""ドット絵データの品質確認（ver0.30）。ゲームに入っているデータ（js/sprite/data/spx-data*.js）をそのまま読む。

  python3 tools/spx_qa.py check                         データ全体の点検（一覧サムネイルの収まり・サイズの欠け・星臨の有無）
  python3 tools/spx_qa.py lineup --out <png> [--size b60] [--ids rio,celes]
                                                         正面・待機・星臨を同じ縮尺・同じ足元で並べた確認画像
  python3 tools/spx_qa.py anims --out <dir> [--ids ...] [--size B84]
                                                         連続フレーム（anims）の点検と確認画像
  共通：--data <js> を繰り返すと、そのファイルも読む（取り込み前の確認用。例：tools/spx_import.py build --out の出力）

anims の判定（各サイズ・各アニメ）
  ・frame-size   全コマの大きさが同じ（固定キャンバス）                     ずれたら FAIL
  ・anchor       全コマの基準点（ax, ay）が同じ                              ずれたら FAIL
  ・foot-slide   コマごとの足元（最下段付近の不透明画素の中央）の横ずれ    1 ドット超で WARN、2 ドット超で FAIL（ループ・待機）
  ・height       背丈（不透明画素の高さ）の変化                             1 コマ目の ±8% を超えたら WARN
  ・colour-drift 色の使い方（パレット番号の分布）の 1 コマ目との差（0〜1）  0.25 超で WARN（配色の変化・別物化の疑い）
  ・loop-seam    最後→最初のコマの差 ÷ コマ間の差の中央値                  ループで 2.5 超なら WARN（つなぎ目の飛び）
  ・pose-anchor  同じ名前の静止ポーズと 1 コマ目の足元の横の差              1 ドット超で WARN、2 ドット超で FAIL（切り替えで跳ぶ）
数値は症状を見つけるだけで、形の崩れ・同一性は確認画像を目で見て判断する。終了コード：FAIL があれば 4
"""
import argparse, base64, glob, io, json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = sorted(glob.glob(os.path.join(ROOT, 'js', 'sprite', 'data', 'spx-data*.js')), key=lambda p: (p.endswith('spx-data.js') is False, p))
THUMB = (48, 80, 120)   # 図鑑の一覧の枠（端末の画素密度 1／2／3）


def load(extra=()):
    D = {}
    for p in DATA + list(extra):
        s = open(p, encoding='utf-8').read()
        m = re.search(r'(\{.*\})\)?;\s*$', s, re.S)
        if m:
            D.update(json.loads(m.group(1)))
    return D


_cache = {}


def atlas(D, cid, sk):
    k = (cid, sk)
    if k not in _cache:
        S = D[cid]['sizes'][sk]
        im = Image.open(io.BytesIO(base64.b64decode(S['png'].split(',')[1])))
        _cache[k] = (np.array(im.convert('P')) if im.mode == 'P' else None, im.convert('RGBA'))
    return _cache[k]


def frame(D, cid, sk, name):
    S = D[cid]['sizes'][sk]
    x, y, w, h, ax, ay = S['frames'][name]
    idx, rgba = atlas(D, cid, sk)
    return (idx[y:y + h, x:x + w] if idx is not None else None), rgba.crop((x, y, x + w, y + h)), ax, ay


def foot_x(m):
    ys, xs = np.where(m)
    if not len(ys):
        return None
    ay = ys.max()
    low = xs[ys >= ay - max(2, m.shape[0] // 8)]
    return float(np.median(low))


# ---------- check ----------
def cmd_check(o, D):
    res = []
    for cid, c in D.items():
        if c['kind'] == 'mon':
            nm = 'idle'
            for N in THUMB:
                T = N - 2
                fit = [max(S['frames'][nm][2:4]) for sk, S in c['sizes'].items() if sk[0] in 'bBuz' and nm in S['frames'] and max(S['frames'][nm][2:4]) <= T]
                best = max(fit) / T if fit else 0
                st = 'ok' if best >= .85 else 'FAIL' if best < .7 else 'WARN'
                if st != 'ok':
                    res.append((st, cid, 'thumb-fit', '一覧の枠 %dpx に収まる最大の絵が枠の %d%%（一覧用サイズ u<長辺> を足すと直る：spx_normalize.py の ensure_ui_sizes）' % (N, best * 100)))
        elif not cid.endswith('_K'):
            for need in ('front', 'stance'):
                if not any(need in S['frames'] for sk, S in c['sizes'].items() if sk[0] in 'bB'):
                    res.append(('WARN', cid, 'pose', '%s が無い' % need))
            K = D.get(cid + '_K')
            if K:
                miss = [sk for sk in c['sizes'] if sk[0] in 'bB' and sk not in K['sizes']]
                if miss:
                    res.append(('FAIL', cid, 'seirin-size', '星臨に無いサイズ %s（戦闘で星臨の絵が出ない）' % miss))
    for r in res:
        print('%-4s %-10s %-12s %s' % r)
    print('checked', len(D), 'entries;', sum(r[0] == 'FAIL' for r in res), 'FAIL,', sum(r[0] == 'WARN' for r in res), 'WARN')
    return 4 if any(r[0] == 'FAIL' for r in res) else 0


# ---------- lineup ----------
def cmd_lineup(o, D):
    ids = o.ids.split(',') if o.ids else [k for k, c in D.items() if c['kind'] == 'hum' and not k.endswith('_K')]
    z, pad = o.zoom, 8
    rows = []
    for cid in ids:
        c = D[cid]
        sk = o.size if o.size in c['sizes'] else None
        if not sk:
            continue
        t = []
        names = [('front', cid, 'front'), ('idle', cid, 'stance' if c['kind'] == 'hum' else 'idle'), ('seirin', cid + '_K', 'awk')]
        for lb, k, nm in names:
            if k in D and sk in D[k]['sizes'] and nm in D[k]['sizes'][sk]['frames']:
                _, im, ax, ay = frame(D, k, sk, nm)
                ys = np.where(np.array(im)[:, :, 3] > 0)[0]
                t.append((lb, im, ax, ay, int(ys.max() - ys.min() + 1)))
        if t:
            rows.append((cid, t))
    W = max(sum(x[1].width * z + pad * z for x in t) for _, t in rows) + 90
    H = sum((max(x[3] for x in t) + 1) * z + 30 for _, t in rows)
    C = Image.new('RGBA', (W, H), (24, 28, 48, 255))
    d = ImageDraw.Draw(C)
    y = 0
    print('%-10s %s' % ('id', '  '.join('%s:h' % x[0] for x in rows[0][1])) if rows else 'nothing')
    for cid, t in rows:
        base = y + 22 + (max(x[3] for x in t) + 1) * z
        d.text((4, y + 24), cid, fill='white')
        x = 90
        for lb, im, ax, ay, hh in t:
            C.alpha_composite(im.resize((im.width * z, im.height * z), Image.NEAREST), (x, base - (ay + 1) * z))
            d.line([(x, base), (x + im.width * z, base)], fill=(255, 80, 80))
            d.text((x, y + 4), '%s h%d' % (lb, hh), fill=(255, 233, 160))
            x += im.width * z + pad * z
        print('%-10s %s' % (cid, '  '.join('%s:%d' % (x[0], x[4]) for x in t)))
        y = base + 8
    C.save(o.out)
    print('wrote', o.out)
    return 0


# ---------- anims ----------
def cmd_anims(o, D):
    os.makedirs(o.out, exist_ok=True)
    ids = o.ids.split(',') if o.ids else [k for k, c in D.items() if c.get('anims')]
    report, worst = [], 0
    for cid in ids:
        c = D[cid]
        for an, a in (c.get('anims') or {}).items():
            for sk, S in c['sizes'].items():
                fs = [f for f in a['f'] if f in S['frames']]
                if not fs:
                    continue
                F = [frame(D, cid, sk, f) for f in fs]
                chk = {}
                sizes = {(f[1].width, f[1].height) for f in F}
                chk['frame-size'] = ('ok' if len(sizes) == 1 else 'FAIL', len(sizes))
                anc = {(f[2], f[3]) for f in F}
                chk['anchor'] = ('ok' if len(anc) == 1 else 'FAIL', len(anc))
                masks = [np.array(f[1])[:, :, 3] > 0 for f in F]
                fx = [foot_x(m) for m in masks]
                sl = max(abs(v - fx[0]) for v in fx if v is not None)
                chk['foot-slide'] = ('ok' if sl <= 1 else 'WARN' if sl <= 2 or not a.get('loop', 1) else 'FAIL', round(sl, 2))
                if an in S['frames']:   # 静止ポーズ（同じ名前）との足元の差：切り替えで横に跳ばないか
                    _, im0, ax0, ay0 = frame(D, cid, sk, an)
                    f0 = foot_x(np.array(im0)[:, :, 3] > 0)
                    dd = abs((fx[0] - F[0][2]) - (f0 - ax0)) if f0 is not None and fx[0] is not None else 0
                    chk['pose-anchor'] = ('ok' if dd <= 1 else 'WARN' if dd <= 2 else 'FAIL', round(dd, 2))
                hs = [np.where(m.any(1))[0] for m in masks]
                hs = [h.max() - h.min() + 1 for h in hs]
                dh = max(abs(h - hs[0]) / hs[0] for h in hs)
                chk['height'] = ('ok' if dh <= .08 else 'WARN', round(dh, 3))
                if F[0][0] is not None:
                    n = int(max(f[0].max() for f in F)) + 1
                    hist = [np.bincount(f[0][f[0] > 0].ravel(), minlength=n)[1:] for f in F]
                    hist = [h / max(1, h.sum()) for h in hist]
                    cd = max(.5 * np.abs(h - hist[0]).sum() for h in hist)
                    chk['colour-drift'] = ('ok' if cd <= .25 else 'WARN', round(float(cd), 3))
                if len(F) > 2:
                    arr = [np.array(f[1]).astype(np.int16) for f in F]
                    dif = lambda p, q: float((np.abs(p - q).sum(2) > 24).mean())
                    cons = [dif(arr[i], arr[i + 1]) for i in range(len(arr) - 1)]
                    seam = dif(arr[-1], arr[0]) / max(1e-6, float(np.median(cons)))
                    chk['loop-seam'] = ('ok' if not a.get('loop', 1) or seam <= 2.5 else 'WARN', round(seam, 2))
                st = max((v[0] for v in chk.values()), key=['ok', 'WARN', 'FAIL'].index)
                worst = max(worst, ['ok', 'WARN', 'FAIL'].index(st))
                report.append({'id': cid, 'anim': an, 'size': sk, 'frames': len(F), 'status': st, 'checks': chk})
                print('%-4s %-10s %-8s %-5s %s' % (st, cid, an, sk, '  '.join('%s=%s%s' % (k, v[1], '' if v[0] == 'ok' else '(' + v[0] + ')') for k, v in chk.items())))
                if sk == (o.size if o.size in c['sizes'] else sk) and (o.size in c['sizes'] or sk == sorted(c['sizes'], key=lambda s: -c['sizes'][s]['dots'])[0]):
                    sheet(F, fs, os.path.join(o.out, '%s_%s_%s.png' % (cid, an, sk)))
    json.dump(report, open(os.path.join(o.out, 'anims-qa.json'), 'w'), ensure_ascii=False, indent=1)
    print('wrote', o.out)
    return 4 if worst == 2 else 0


def sheet(F, names, path, z=3):
    """コマを並べ、足元の線（赤）と 1 コマ目の輪郭（水色・重ね）を描く。ずれ・滑り・形の崩れを目で見る"""
    w, h = F[0][1].width, F[0][1].height
    C = Image.new('RGBA', ((w * z + 8) * len(F) + 8, h * z + 26), (24, 28, 48, 255))
    d = ImageDraw.Draw(C)
    m0 = np.array(F[0][1])[:, :, 3] > 0
    from scipy import ndimage as nd
    edge0 = m0 & ~nd.binary_erosion(m0)
    for i, (_, im, ax, ay) in enumerate(F):
        x = 8 + i * (w * z + 8)
        C.alpha_composite(im.resize((w * z, h * z), Image.NEAREST), (x, 20))
        ov = np.zeros((h, w, 4), np.uint8)
        ov[edge0] = (90, 230, 255, 140)
        C.alpha_composite(Image.fromarray(ov, 'RGBA').resize((w * z, h * z), Image.NEAREST), (x, 20))
        d.line([(x, 20 + (ay + 1) * z), (x + w * z, 20 + (ay + 1) * z)], fill=(255, 80, 80))
        d.line([(x + ax * z + z // 2, 20 + (ay + 1) * z - 6), (x + ax * z + z // 2, 20 + (ay + 1) * z + 6)], fill=(255, 230, 80))
        d.text((x, 4), names[i], fill='white')
    C.save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--data', action='append', default=[])
    sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('check')
    a = sp.add_parser('lineup')
    a.add_argument('--out', required=True)
    a.add_argument('--size', default='b60')
    a.add_argument('--ids')
    a.add_argument('--zoom', type=int, default=3)
    b = sp.add_parser('anims')
    b.add_argument('--out', required=True)
    b.add_argument('--ids')
    b.add_argument('--size', default='B84')
    o = ap.parse_args()
    D = load(o.data)
    sys.exit({'check': cmd_check, 'lineup': cmd_lineup, 'anims': cmd_anims}[o.cmd](o, D))


if __name__ == '__main__':
    main()
