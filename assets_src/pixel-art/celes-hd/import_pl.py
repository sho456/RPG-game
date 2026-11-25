#!/usr/bin/env python3
"""セレス（celes-hd）の PixelLab 本番コマを assets_src/chars/celes/ に取り込む。
入力：src/master/pl/td_<動き>_<版>_<列>x<行>_<幅>x<高さ>.png（左上から行優先。0 番目のコマ＝生成元の絵）
  1. 0 番目のコマを master（sprites/celes_master_side_l.png／dying は celes_master_dying.png）と完全一致で照合し、
     全アニメを「side_l 座標＋足元の基準」に並べ直す（キャンバス・足元は全アニメ共通。anchor=(AX,AY)）
  2. キャラのドットは palette_front.npy（倒れは palette_dying.npy）へ減色（ノイズ取り）
  3. 焼き込みのエフェクト（光弾・輪・閃光・弧・速度線）をキャラから分離：
     発光色（水色・白の濃い所）＋キャラの塊から離れたドット＋コマごとの追加矩形 EXTRA。
     → anim/<名>/frame_NNN.png（キャラ）、fx/<名>/frame_NNN.png（エフェクト。同じキャンバス・同じ位置）
  4. character.json の anims を更新（ms・hit・使うコマは ANIMS）。待機（idle）は仮（make_idle：master から呼吸のコマ）。
使い方：python3 assets_src/pixel-art/celes-hd/import_pl.py [--preview <dir>] && python3 tools/spx_import.py build celes
（make_pack.py は仮のコマ用。実行するとこの本番コマを消すので、もう実行しない）"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, 'src', 'master', 'pl')
SP = os.path.join(HERE, 'sprites')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), 'assets_src', 'chars', 'celes')
AX, AY = 0, 0  # build_canvas で決める

# 名前: (ファイル, 列, 行, 幅, 高さ, master 名)
SHEETS = {
    'walk': ('td_walk_v2_3x3_104x144.png', 3, 3, 104, 144, 'side'),
    'atk': ('td_atk_v1_3x3_148x164.png', 3, 3, 148, 164, 'side'),
    'cast': ('td_cast_v1_3x3_144x196.png', 3, 3, 144, 196, 'side'),
    'hurt': ('td_hurt_v1_3x2_148x140.png', 3, 2, 148, 140, 'side'),
    'down': ('td_down_v1_3x3_132x160.png', 3, 3, 132, 160, 'dying'),
    'idle': ('td_idle_v2_3x3_104x140.png', 3, 3, 104, 140, 'side'),
    'aw_in': ('td_aw_in_v1_5x5_120x164.png', 5, 5, 120, 164, 'side'),          # 0 番目＝通常の side_l、最後は星臨の姿
    'aw_idle': ('td_aw_idle_v1_3x3_104x148.png', 3, 3, 104, 148, 'seirin'),
    'aw_cast': ('td_aw_cast_v1_3x3_148x196.png', 3, 3, 148, 196, 'seirin'),
    'aw_ult': ('td_aw_ult_v2_5x5_148x196.png', 5, 5, 148, 196, 'seirin'),      # v1 は予備（取り込まない）
}
AW = ('aw_in', 'aw_idle', 'aw_cast', 'aw_ult')   # 星臨のコマ（星臨用パレット・色でエフェクトを分ける）
# 使うコマ・ms・hit（hit は使うコマの並びの中での番号）
ANIMS = {
    'walk': dict(use=list(range(1, 9)), ms=[100] * 8, loop=True),
    'atk': dict(use=list(range(9)), ms=[80, 70, 70, 70, 70, 60, 60, 60, 80], loop=False, hit=5),
    'cast': dict(use=list(range(9)), ms=[90, 90, 100, 100, 100, 110, 110, 100, 120], loop=False, hit=6),
    'hurt': dict(use=[0, 1, 2, 3, 4], ms=[50, 60, 70, 60, 60], loop=False),
    'down': dict(use=list(range(9)), ms=[100, 100, 100, 120, 140, 160, 160, 160, 300], loop=False),
    'idle': dict(use=list(range(9)), ms=[150] * 9, loop=True),
    'aw_in': dict(use=list(range(25)), ms=[100, 90] + [80] * 10 + [70, 90, 90, 70, 70] + [60] * 8, loop=False),
    'aw_idle': dict(use=list(range(9)), ms=[150] * 9, loop=True),
    'aw_cast': dict(use=list(range(9)), ms=[90, 90, 100, 100, 100, 110, 110, 100, 120], loop=False, hit=5),
    'aw_ult': dict(use=list(range(25)), ms=[120, 120] + [110] * 6 + [100] * 5 + [90] * 4 + [70] * 4 + [110, 110, 130, 200],
                   loop=False, hit=17),
    # 星臨の歩き・通常攻撃は作っていない：待機・技の流用（コマをコピー）
    'aw_walk': dict(src='aw_idle', use=list(range(9)), ms=[110] * 9, loop=True),
    'aw_atk': dict(src='aw_cast', use=list(range(9)), ms=[60, 60, 70, 70, 70, 70, 70, 70, 60], loop=False, hit=5),
}
# 以下の矩形は「足元の基準点からの相対座標」(x0,y0,x1,y1)（含む）。キャンバスの大きさが変わっても動かない。
# (動き, コマ番号[元シートの番号]) ごと。REMOVE＝矩形内の全ドットをエフェクトへ／BLUE＝矩形内の青い所だけエフェクトへ／
# KEEP＝矩形内はキャラのまま（宝石の白い光り）
REMOVE = {('atk', 6): [(-54, -69, -25, -53)], ('atk', 7): [(-11, -74, -9, -64), (-33, -49, -31, -47)],
          ('cast', 6): [(1, -101, 6, -97), (-28, -82, -26, -80)], ('cast', 7): [(-26, -95, -20, -93), (-7, -95, -5, -93)]}
BLUE = {('cast', 6): [(-36, -115, 4, -83)], ('cast', 7): [(-36, -115, 4, -83)]}
KEEP = {('cast', 4): [(-24, -106, -6, -87)]}
# 光弾・閃光で隠れた杖の宝石をほかのコマから貼る：(動き, コマ) → (元の動き, 元のコマ, 貼る位置 'ref'＝元と同じ／'fx'＝エフェクトの重心)
GEM = {('cast', 5): ('cast', 3, 'fx'), ('cast', 6): ('cast', 3, 'ref'), ('cast', 7): ('cast', 3, 'ref')}
AWFX = {('aw_in', 9): [(-34, -71, -9, -61)],
        ('aw_cast', 2): [(-54, -115, -12, -78, 'w')], ('aw_cast', 3): [(-56, -122, -6, -80, 'w')],
        ('aw_cast', 5): [(-46, -108, -2, -72, 'c')],
        ('aw_cast', 6): [(-54, -108, -24, -56, 'p'), (-54, -80, -3, -56, 'c')], ('aw_cast', 7): [(-54, -82, -34, -48, 'p')],
        ('aw_ult', 13): [(-48, -122, -14, -90), (-14, -122, 14, -90, 'k')],
        ('aw_ult', 14): [(-46, -122, -14, -100), (-14, -122, 44, -103, 'k'), (-8, -103, 8, -66, 'k')],
        ('aw_ult', 15): [(-12, -118, 11, -99, 'k')], ('aw_ult', 16): [(-50, -122, 1, -92, 'k')],
        ('aw_ult', 17): [(-53, -118, -14, -62), (-53, -62, -2, -28, 'c')], ('aw_ult', 18): [(-53, -118, -14, -62), (-53, -62, -2, -28, 'c')],
        ('aw_ult', 19): [(-53, -97, -30, -62), (-53, -62, -30, -28, 'c')], ('aw_ult', 20): [(-56, -62, -44, -45)]}
AWKEEP = {('aw_ult', k): [(-53, -38, -34, -27)] for k in (17, 18, 19)}
AWFX[('aw_ult', 17)] += [(-53, -62, -30, -39)]; AWFX[('aw_ult', 18)] += [(-53, -62, -30, -39)]; AWFX[('aw_ult', 19)] += [(-53, -62, -30, -39), (-53, -39, -30, -27, 'w')]
AWKEEP = {}
# 倒れの接地をそろえる（コマごとの上下のずらし。負＝上へ）
DY = {('down', 7): -1, ('down', 8): -2}


def img(p):
    return np.array(Image.open(p).convert('RGBA'))


def foot_x(a):
    ys, xs = np.where(a[..., 3] > 0)
    ay = ys.max()
    low = xs[ys >= ay - max(2, (ay - ys.min()) // 8)]
    return int(round(np.median(low))), int(ay)


def cut(fn, cols, rows, w, h):
    a = img(os.path.join(P, fn))
    return [a[r * h:(r + 1) * h, c * w:(c + 1) * w] for r in range(rows) for c in range(cols)]


def find_off(cell, master):
    mh, mw = master.shape[:2]
    ch, cw = cell.shape[:2]
    mm = master[..., 3] > 0
    best = (-1, 0, 0)
    for oy in range(ch - mh + 1):
        for ox in range(cw - mw + 1):
            sub = cell[oy:oy + mh, ox:ox + mw]
            sc = ((sub[..., 3] > 0) & mm & (np.abs(sub[..., :3].astype(int) - master[..., :3]).sum(-1) < 30)).sum()
            if sc > best[0]:
                best = (sc, ox, oy)
    assert best[0] >= mm.sum() * 0.98, ('0 番目が master と一致しない', best, mm.sum())
    return best[1], best[2]


def snap(a, pal):
    """不透明ドットを palette に寄せる（アルファは 2 値）"""
    o = a.copy()
    m = a[..., 3] >= 128
    d = ((a[..., None, :3].astype(float) - pal[None, None]) ** 2).sum(-1)
    o[..., :3] = np.where(m[..., None], pal[d.argmin(-1)].astype(np.uint8), 0)
    o[..., 3] = np.where(m, 255, 0)
    return o


def effect_mask(a):
    """焼き込みエフェクトのドット（True）。発光色（水色・白の濃い所）＋キャラの塊から離れた所"""
    op = a[..., 3] > 0
    r, g, b = (a[..., i].astype(int) for i in range(3))
    cy = op & (b >= 195) & (g >= 185) & (b - r >= 35) & (r <= 200)       # 水色の発光
    wh = op & (r >= 238) & (g >= 238) & (b >= 238)                       # 白
    warm = op & (np.abs(r - g) > 60) & (r > 200) & ~((g > 120) & (b < 80) & (r > 150) & (r < 250))  # 速度線の赤・桃
    seed = cy | wh
    big = ndi.binary_dilation(seed, np.ones((3, 3)), iterations=1) & op
    lab, n = ndi.label(big, np.ones((3, 3)))
    fx = np.zeros_like(op)
    for i in range(1, n + 1):
        c = lab == i
        if (c & cy).sum() >= 10 or c.sum() >= 14 and (c & wh).sum() * 2 >= c.sum():
            fx |= c & (cy | wh | ndi.binary_dilation(cy, np.ones((3, 3)), iterations=1))
    # キャラの塊（最大の連結成分。距離 2 まで橋渡し）から離れたもの
    rest = op & ~fx
    lab, n = ndi.label(ndi.binary_dilation(rest, np.ones((3, 3)), iterations=2) & (op | ndi.binary_dilation(rest, np.ones((3, 3)), iterations=2)), np.ones((3, 3)))
    sizes = ndi.sum(rest, lab, range(1, n + 1))
    main = lab == (1 + int(np.argmax(sizes)))
    fx |= rest & ~main
    return fx


def seirin_palette(seirin):
    """星臨用パレット（48 色）：seirin_side_l と星臨の各シートの色から、出現数の平方根で重みづけた k-means。
    水晶・目の水色・星の白（出現が少ない明るい色）は消えないよう、離れた色は固定で加える。palette_seirin_anim.npy に保存"""
    pf = os.path.join(SP, 'palette_seirin_anim.npy')
    if os.path.exists(pf) and '--pal' not in sys.argv:
        return np.load(pf)
    px = [seirin[seirin[..., 3] > 0][:, :3]]
    for nm in AW:
        fn, c, r, w, h, _ = SHEETS[nm]
        for k, cell in enumerate(cut(fn, c, r, w, h)):
            if nm == 'aw_in' and k < 15:
                continue
            px.append(cell[cell[..., 3] >= 128][:, :3])
    cols, cnt = np.unique(np.vstack(px), axis=0, return_counts=True)
    cols = cols.astype(float); wgt = np.sqrt(cnt.astype(float))
    cen = [cols[int(np.argmax(wgt))]]
    for _ in range(47):   # 重みつきの最遠点
        d = np.min(((cols[:, None] - np.array(cen)[None]) ** 2).sum(-1), 1)
        cen.append(cols[int(np.argmax(d * wgt))])
    cen = np.array(cen)
    for _ in range(40):
        a = ((cols[:, None] - cen[None]) ** 2).sum(-1).argmin(1)
        for j in range(48):
            m = a == j
            if m.any():
                cen[j] = (cols[m] * wgt[m, None]).sum(0) / wgt[m].sum()
    pal = np.round(cen).astype(np.uint8)
    pal = pal[np.argsort([-(0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]) for p in pal.astype(float)])]
    np.save(pf, pal)
    return pal


def effect_mask_aw(f, nm, i, R):
    """星臨のコマのエフェクト（True）。aw_in：足元の輪（桃・水色）と粒。aw_cast/aw_ult：閃光・弧は AWFX の矩形＋本体から離れた粒"""
    op = f[..., 3] > 0
    r, g, b = (f[..., k].astype(int) for k in range(3))
    fx = np.zeros_like(op)
    if nm == 'aw_in' and i <= 14:
        fx |= op & (r >= 195) & (b >= 150) & (g <= 150) & (r - g >= 70)                 # 桃・紫の輪
        fx |= op & (b >= 200) & (g >= 150) & (r <= 135) & (b - r >= 90)                  # 水色の輪
    if nm == 'aw_in' and 3 <= i <= 11:   # 足元の白い弧・粒（髪は膝より上なので、足元の帯の白だけ）
        sl = R((-54, -43, 54, 3))
        fx[sl] |= (op[sl] & (f[sl][..., :3].min(-1) >= 200))
    for rc in AWFX.get((nm, i), []):
        sl = R(rc[:4])
        sub = f[sl].astype(int)
        ok = sub[..., 3] > 0
        mn = sub[..., :3].min(-1)
        if len(rc) == 5 and rc[4] == 'w':      # 白だけ（宝石の水色は残す）
            ok &= mn >= 240
        elif len(rc) == 5 and rc[4] == 'p':    # 紫の弧（AA の縁まで）＋白・水色
            ok &= (mn >= 215) | ((sub[..., 0] - sub[..., 1] >= 25) & (sub[..., 2] >= 130) & (sub[..., 0] >= 90)) | \
                  ((sub[..., 2] >= 190) & (sub[..., 1] >= 110) & (sub[..., 0] <= 150) & (sub[..., 2] - sub[..., 0] >= 60))
        elif len(rc) == 5 and rc[4] == 'k':    # 白＋水色（縁のにじみまで・ラベンダーは残す）
            ok &= (mn >= 215) | ((sub[..., 2] >= 190) & (sub[..., 1] >= 110) & (sub[..., 0] <= 150) & (sub[..., 2] - sub[..., 0] >= 60))
        elif len(rc) == 5 and rc[4] == 'c':    # 白＋水色の発光（髪のラベンダー・服は残す）
            ok &= (mn >= 215) | ((sub[..., 2] >= 200) & (sub[..., 1] >= 150) & (sub[..., 0] <= 135))
        fx[sl] |= ok
    for rc in AWKEEP.get((nm, i), []):          # 矩形内はキャラのまま（弧の根元の宝石など）
        fx[R(rc)] = False
    rest = op & ~fx
    lab, n = ndi.label(ndi.binary_dilation(rest, np.ones((3, 3)), iterations=2) & (op | ndi.binary_dilation(rest, np.ones((3, 3)), iterations=2)), np.ones((3, 3)))
    if n:
        sizes = ndi.sum(rest, lab, range(1, n + 1))
        main = lab == (1 + int(np.argmax(sizes)))
        fx |= rest & ~main
    return fx


def main():
    prev = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    side = img(os.path.join(SP, 'celes_master_side_l.png'))
    dying = img(os.path.join(SP, 'celes_master_dying.png'))
    pal_f = np.load(os.path.join(SP, 'palette_front.npy'))
    pal_d = np.load(os.path.join(SP, 'palette_dying.npy'))
    pal_all = np.concatenate([pal_f, pal_d])
    sfx, sfy = foot_x(side)
    dfx, dfy = foot_x(dying)
    seirin = img(os.path.join(SP, 'celes_master_seirin_side_l.png'))   # side_l と同じ大きさ・同じ足元
    pal_sa = seirin_palette(seirin)
    pal_u = np.concatenate([pal_f, pal_sa])
    masters = {'side': (side, 0, 0), 'dying': (dying, sfx - dfx, sfy - dfy), 'seirin': (seirin, 0, 0)}  # master→side_l 座標への平行移動
    # 1 切り出し＋並べ直し（共通座標へ。ここでは大きな作業キャンバスに置く）
    BIG = 400
    OX = OY = 150
    raw = {}
    for nm, (fn, c, r, w, h, mn) in SHEETS.items():
        cells = cut(fn, c, r, w, h)
        m, tx, ty = masters[mn]
        ox, oy = find_off(cells[0], m)
        fr = []
        for cell in cells:
            if (cell[..., 3] > 0).sum() == 0:
                fr.append(None)
                continue
            big = np.zeros((BIG, BIG, 4), np.uint8)
            # cell 座標 → master 座標 (-ox,-oy) → side_l 座標 (+tx,+ty) → 作業座標 (+OX,+OY)
            x0, y0 = OX + tx - ox, OY + ty - oy
            big[y0:y0 + h, x0:x0 + w] = cell
            fr.append(big)
        raw[nm] = fr
    # 2 エフェクト分離・減色
    res = {}
    for nm, fr in raw.items():
        pal = {'down': pal_all, 'aw_in': pal_u}.get(nm, pal_sa if nm in AW else pal_f)
        res[nm] = []
        for i, f in enumerate(fr):
            if f is None:
                res[nm].append(None)
                continue
            if (nm, i) in DY:
                f = np.roll(f, DY[(nm, i)], 0)
            def R(r):
                x0, y0, x1, y1 = r
                return slice(OY + sfy + y0, OY + sfy + y1 + 1), slice(OX + sfx + x0, OX + sfx + x1 + 1)
            fx = effect_mask_aw(f, nm, i, R) if nm in AW else (np.zeros(f.shape[:2], bool) if nm == 'idle' else effect_mask(f))
            for r in REMOVE.get((nm, i), []):
                fx[R(r)] |= f[R(r)][..., 3] > 0
            for r in BLUE.get((nm, i), []):
                sub = f[R(r)].astype(int)
                fx[R(r)] |= (sub[..., 3] > 0) & (sub[..., 2] > sub[..., 0] + 30) & (sub[..., 1] > sub[..., 0] + 30)
            for r in KEEP.get((nm, i), []):
                fx[R(r)] = False
            ch = f.copy(); ch[fx] = 0
            ef = f.copy(); ef[~fx] = 0
            res[nm].append([snap(ch, pal), ef])
    # 隠れた宝石を貼る
    def gem_c(ch):
        r, g, b = (ch[..., k].astype(int) for k in range(3))
        m = (ch[..., 3] > 0) & (b > 170) & (b > r + 70) & (g > 120) & (g < 200)
        m[OY + sfy - 60:] = False
        ys, xs = np.where(m)
        return int(round(xs.mean())), int(round(ys.mean()))
    for (nm, i), (sn, si, how) in GEM.items():
        sc = res[sn][si][0]
        gx, gy = gem_c(sc)
        patch = sc[gy - 11:gy + 12, gx - 10:gx + 11].copy()
        d = res[nm][i]
        if how == 'fx':
            lab, n = ndi.label(d[1][..., 3] > 0, np.ones((3, 3)))
            big = lab == 1 + int(np.argmax(ndi.sum(d[1][..., 3] > 0, lab, range(1, n + 1))))
            ys, xs = np.where(big)
            tx, ty = int(round((xs.min() + xs.max()) / 2)), int(round((ys.min() + ys.max()) / 2))
        else:
            tx, ty = gx, gy
        d[0][ty - 11:ty + 12, tx - 10:tx + 11] = patch
    # 弧を消して欠けた杖の先の宝石を、弧が消えたコマ（20）から貼る
    sl = (slice(OY + sfy - 46, OY + sfy - 25), slice(OX + sfx - 54, OX + sfx - 29))
    for i in (17, 18, 19):
        res['aw_ult'][i][0][sl] = res['aw_ult'][20][0][sl]
    # 3 共通キャンバス（全コマの不透明の範囲＋余白）
    xs0 = ys0 = 10 ** 9; xs1 = ys1 = -1
    for nm, fr in res.items():
        for t in fr:
            if t is None:
                continue
            for a in t:
                ys, xs = np.where(a[..., 3] > 0)
                if len(xs):
                    xs0, xs1, ys0, ys1 = min(xs0, xs.min()), max(xs1, xs.max()), min(ys0, ys.min()), max(ys1, ys.max())
    # 足元（side_l の sfx, sfy）が (AX, AY)。左右は対称にして背丈・向きに依らず中央に足元
    half = max(OX + sfx - xs0, xs1 - (OX + sfx)) + 2
    top = OY + sfy - ys0 + 2
    W, H = int(half) * 2 + 1, int(top) + 3
    ax, ay = int(half), int(top)
    cx0, cy0 = OX + sfx - ax, OY + sfy - ay
    print('canvas', W, H, 'anchor', ax, ay)
    A = {}
    for nm, spec in ANIMS.items():
        for sec in ('anim', 'fx'):
            d = os.path.join(OUT, sec, nm)
            os.makedirs(d, exist_ok=True)
            for f in os.listdir(d):
                os.remove(os.path.join(d, f))
        for k, i in enumerate(spec['use']):
            ch, ef = res[spec.get('src', nm)][i]
            Image.fromarray(ch[cy0:cy0 + H, cx0:cx0 + W]).save(os.path.join(OUT, 'anim', nm, 'frame_%03d.png' % k))
            Image.fromarray(ef[cy0:cy0 + H, cx0:cx0 + W]).save(os.path.join(OUT, 'fx', nm, 'frame_%03d.png' % k))
        a = {'dir': 'anim/' + nm, 'ms': spec['ms'], 'loop': spec['loop'], 'scale': 1.0, 'anchor': [ax, ay]}
        if 'hit' in spec:
            a['hit'] = spec['hit']
        A[nm] = a
    # 5 character.json
    jp = os.path.join(OUT, 'character.json')
    J = json.load(open(jp))
    J['_doc'] = ('全アニメ PixelLab の本番コマ（assets_src/pixel-art/celes-hd/import_pl.py が src/master/pl/ から作る。'
                 'エフェクトは fx/<名>/ に分離）。aw_*＝星臨（aw_walk は aw_idle・aw_atk は aw_cast のコピー）。'
                 'コマは全て同じキャンバス、足元の基準点 anchor は元の解像度で。詳しくは docs/PIPELINE.md・tools/spx_import.py')
    old = J['anims']
    for nm in A:
        old[nm] = A[nm]
    # aw_in は旧キャンバス（112×104）のままなので、基準点を新キャンバスへ置き直す
    J['anims'] = old
    json.dump(J, open(jp, 'w'), ensure_ascii=False, indent=2)
    if prev:
        preview(prev, A, res, cx0, cy0, W, H)


def make_idle(side, sfx, sfy, W, H, ax, ay, pal, A):
    """仮の待機：side_l から行抜きの呼吸・髪と裾のわずかなずらし・宝石の明るさ（make_pack と同じ手法）。
    PixelLab の待機に差し替えるときは anim/idle/ の PNG を入れ替えて ms を直す（A['idle'] を作る行を消す）"""
    h, w = side.shape[:2]
    base = np.zeros((H, W, 4), np.uint8)
    oy, ox = ay - sfy, ax - sfx
    base[oy:oy + h, ox:ox + w] = side

    def breathe(a, y0=56 + oy, y1=72 + oy):
        a = a.copy()
        best = min(range(y0, y1), key=lambda y: (a[y] != a[y - 1]).any(1).sum())
        return np.concatenate([np.zeros((1, W, 4), np.uint8), np.delete(a, best, 0)], 0)

    def glow(a, s=1):
        a = a.copy()
        r, g, b = (a[..., i].astype(int) for i in range(3))
        m = (a[..., 3] > 0) & (b > 140) & (b > r + 50) & (b > g + 30)
        for i, v in enumerate((60 * s, 90 * s, 70 * s)):
            a[..., i] = np.where(m, np.minimum(255, a[..., i].astype(int) + v), a[..., i])
        return a

    def sway(a, k):
        """髪・裾（下半分の右側）を k ドットずらす：行ごとに、体の右の端 6 ドットだけ動かす"""
        a = a.copy()
        for y in range(oy + 50, oy + 100):
            row = a[y]
            xs = np.where(row[:, 3] > 0)[0]
            if len(xs) < 8:
                continue
            x1 = xs.max()
            seg = row[x1 - 5:x1 + 1].copy()
            row[x1 - 5:x1 + 1] = 0
            row[x1 - 5 + k:x1 + 1 + k] = seg if k >= 0 else seg
            a[y] = row
        return a
    R, B = base, breathe(base)
    fr = [R, glow(B), B, glow(sway(R, 1), 1), R, glow(B, 2)]
    d = os.path.join(OUT, 'anim', 'idle')
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))
    for i, f in enumerate(fr):
        Image.fromarray(f).save(os.path.join(d, 'frame_%03d.png' % i))
    A['idle'] = {'dir': 'anim/idle', 'ms': [420, 160, 420, 160, 420, 160], 'loop': True, 'scale': 1.0, 'anchor': [ax, ay]}


def preview(d, A, res, cx0, cy0, W, H):
    os.makedirs(d, exist_ok=True)
    for sec in ('anim', 'fx'):
        for nm in A:
            dd = os.path.join(OUT, sec, nm)
            if not os.path.isdir(dd):
                continue
            fs = sorted(os.listdir(dd))
            Z = 3
            S = Image.new('RGBA', (W * Z * len(fs), H * Z), (70, 70, 80, 255))
            for i, f in enumerate(fs):
                im = Image.open(os.path.join(dd, f)).convert('RGBA').resize((W * Z, H * Z), Image.NEAREST)
                S.alpha_composite(im, (i * W * Z, 0))
            S.convert('RGB').save(os.path.join(d, '%s_%s.png' % (sec, nm)))


if __name__ == '__main__':
    main()
