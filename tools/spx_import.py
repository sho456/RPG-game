#!/usr/bin/env python3
"""キャラクター素材パック → ゲームのドット絵データ（js/sprite/data/spx-data-chars.js）

素材パック（assets_src/chars/<id>/）は「承認したマスター原画」と「アクションごとの連続フレーム」を置く場所。
このツールが、背景抜き・縮尺の統一・足元の位置合わせ・共通パレット・複数サイズ・アトラス化までを自動で行う。

  python3 tools/spx_import.py init <id> [--kind hum|mon]   素材パックのひな形を作る
  python3 tools/spx_import.py build [<id> ...]             全パック（または指定）を spx-data-chars.js へ書き出す
        [--out <js>] [--preview <dir>]                     出力先の変更・確認用の画像

■ 縮尺（docs/PIPELINE.md「縮尺の決まり」）
  ・基準＝マスター原画の ref ポーズ（既定 front）の背丈。各サイズ sk のドット数 dots に対し k = dots / 背丈 × refK
  ・全ポーズ・全フレーム・星臨（<id>_K）を同じ k で縮める。星臨は character.json の scale.seirin（既定 1.0）を掛ける
  ・連続フレーム（Forge の仕上げ出力など、マスターと解像度が違う素材）は、1 コマ目（休みの姿勢）の背丈を
    マスターの同名ポーズ（anims.<名>.matchPose、既定はアニメ名と同じポーズ）の背丈に合わせてから縮める
■ 位置合わせ
  ・静止画（poses）は 1 枚ずつ足元（最下段付近の不透明画素の中央）を基準点にする
  ・連続フレームは全コマを同じ枠で切り出し、同じ基準点を使う（コマごとに切り詰めない＝足元が滑らない）。
    基準点は finish.json / registration の anchor（Forge の出力）→ anims.<名>.anchor → 1 コマ目の足元 の順
■ 色
  ・キャラクターごとに 1 つのパレット（通常の全ポーズ・全フレームから k-means）。星臨は別パレット
  ・最も暗い色を最後に置く（色替え・虚蝕化で変えない輪郭色）
■ 出力
  ・SPX_DATA[id]：既存のデータと同じ形式（face/kind/pal/sizes/heads）に、連続フレーム anims を足したもの
      anims[ポーズ名] = {f:[コマ名...], ms:[表示時間...], loop:1}   コマ名は '<ポーズ名>@<番号>'
    戦闘・図鑑は、ポーズ名に anims があればコマを時間で切り替える（js/sprite/spx.js の animFrame）
  ・rig（敵の動きの土台）を書くと、spx.js が自動で登録する（js/sprite/spx.js の regRigs）
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spx_common import shrink, kmeans, lum, to_pal_idx, png_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARS = os.path.join(ROOT, 'assets_src', 'chars')
OUT = os.path.join(ROOT, 'js', 'sprite', 'data', 'spx-data-chars.js')
SCALE = os.path.join(ROOT, 'assets_src', 'character_scale.json')
HEADER = '/* 自動生成：tools/spx_import.py（素材パック assets_src/chars の各 character.json）。手で編集しない */\n'

HERO_SIZES = [['b42', 42], ['b48', 48], ['b54', 54], ['b60', 60], ['b66', 66], ['B84', 84], ['B104', 104], ['f34', 34], ['u36', 36]]
ENEMY_SIZES = {'b': [40, 46, 52, 58, 66, 74, 84, 96], 'f': 24, 'z': 46, 'u': 56}
FIELD_POSES = ['stand', 'walk_a', 'walk_b', 'front', 'win', 'stance', 'lunge', 'cast', 'hit', 'weak', 'guard', 'dash', 'down', 'back']
ALIASF = {'stand': 'stance'}
hexs = lambda c: '#%02x%02x%02x' % tuple(int(max(0, min(255, round(v)))) for v in c)

TEMPLATE = {
    "_doc": "素材パックの設定。詳しくは docs/PIPELINE.md。パスはこのファイルからの相対パス。画像は透過 PNG（背景が単色ならその色を key に）",
    "id": "", "kind": "hum", "name": "",
    "identity": "見た目の正本（髪・目・服・装備・配色・体格を具体的に。画像生成のプロンプトの先頭にもそのまま使う）",
    "face": "L",
    "key": None,
    "palette": {"colors": 32, "seirinColors": 32},
    "scale": {"ref": "front", "refK": 1.0, "seirin": 1.0},
    "poses": {"front": "master/front.png", "stance": "master/stance.png"},
    "seirin": {"awk": "master/seirin.png"},
    "anims": {
        "stance": {"dir": "anim/idle", "fps": 8, "loop": True, "matchPose": "stance", "selection": None, "range": None}
    },
    "seirinAnims": {},
    "rig": None
}


# ---------- 読み込み ----------
def load_rgba(path, key=None):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.float64)
    rgb, al = a[:, :, :3], a[:, :, 3] / 255
    if key or al.min() > .99:   # 透過が無い：key 色（既定は四隅の色）を抜く
        k = np.array([int(key[i:i + 2], 16) for i in (1, 3, 5)]) if key else np.median(
            np.array([rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]), 0)
        dist = np.abs(rgb - k).max(2)
        bg = dist <= 40
        lab, _ = nd.label(bg)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        al = (~np.isin(lab, list(border))).astype(np.float64)
        # 縁のにじみ（key 色との中間色）を少し削る
        al[(dist < 90) & (al > 0) & ~nd.binary_erosion(al > 0)] = 0
    al[al < .5] = 0
    return rgb, al


def bbox(al):
    ys, xs = np.where(al > 0)
    return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def crop(rgb, al, box):
    y0, y1, x0, x1 = box
    return rgb[y0:y1, x0:x1].copy(), al[y0:y1, x0:x1].copy()


def foot(m, name=''):
    ys, xs = np.where(m)
    ay = int(ys.max())
    if name.startswith('down'):
        return int(round((xs.min() + xs.max()) / 2)), ay
    low = xs[ys >= ay - max(2, m.shape[0] // 8)]
    return int(round(np.median(low))), ay


def frames_of(d):
    fs = sorted(glob.glob(os.path.join(d, '*.png')))
    fs = [f for f in fs if not os.path.basename(f).startswith(('review', 'preview', 'sheet', 'contact'))]
    if not fs:
        raise SystemExit('error: コマが無い: ' + d)
    return fs


def anchor_of(d, spec):
    """連続フレームの基準点（元の解像度）。spec.anchor があればそれ、無ければ None（＝1 コマ目の足元を使う）。
    Forge の finish.json の anchor は「足の中点」の定義がゲームの静止ポーズ（最下段付近の中央値）と違い、
    静止ポーズとのあいだで横に数ドットずれるので使わない（全コマ共通の基準点にすることは同じ）"""
    a = spec.get('anchor')
    if isinstance(a, (list, tuple)):
        return float(a[0]), float(a[1])
    return None


# ---------- パレット・アトラス ----------
def make_pal(srcs, ref_h, ncol):
    px = []
    for r, a in srcs:
        col, m = shrink(r, a, max(8, round(a.shape[1] * 104 / ref_h)))
        px.append(col[m])
    px = np.vstack(px)
    sub = px[np.random.default_rng(3).choice(len(px), min(len(px), 9000), replace=False)]
    pal = kmeans(sub, ncol - 1)
    order = sorted(range(len(pal)), key=lambda i: -lum(pal[i]))
    dark = [min(px[:, 0].min(), 14), min(px[:, 1].min(), 10), min(px[:, 2].min(), 18)]
    return np.vstack([pal[order], [dark]])


def pack(tiles, pal):
    Wt = sum(t[1].shape[1] + 1 for t in tiles)
    Ht = max(t[1].shape[0] for t in tiles)
    big = np.zeros((Ht, Wt), np.int32)
    fr, x = {}, 0
    for nm, idx, ax, ay in tiles:
        h, w = idx.shape
        big[:h, x:x + w] = idx
        fr[nm] = [x, 0, w, h, int(ax), int(ay)]
        x += w + 1
    return {'png': png_of(big, pal), 'frames': fr}


def quant(rgb, al, pal, ks, dots, small_px=36):
    col, m = shrink(rgb, al, max(4, round(al.shape[1] * ks)))
    if dots <= 48:   # 小さいサイズ：本体から離れた 1〜2 ドットの粒を落とす
        l3, n3 = nd.label(m)
        if n3 > 1:
            s3 = nd.sum(m, l3, range(1, n3 + 1))
            m = np.isin(l3, [q + 1 for q, v in enumerate(s3) if v >= max(5, s3.max() * .01)])
    idx = to_pal_idx(col, m, pal)
    if dots <= small_px:   # 小さいサイズは輪郭を最暗色でなぞる
        edge = m & ~nd.binary_erosion(m)
        dk = np.array([lum(pal[i - 1]) for i in range(1, len(pal) + 1)])
        e = edge & (idx > 0)
        idx[e] = np.where(dk[idx[e] - 1] < 70, idx[e], len(pal))
    return idx, m


def head_tiles(rgb, al, pal, L):
    ys, xs = np.where(al > 0)
    top = ys.min()
    band = xs[(ys >= top) & (ys < top + int(L * .85))]
    cx = int(round(np.median(band)))
    x0, y0 = max(0, cx - L // 2), max(0, top - int(L * .03))
    pr, pa = np.zeros((L, L, 3)), np.zeros((L, L))
    sr, sa = rgb[y0:y0 + L, x0:x0 + L], al[y0:y0 + L, x0:x0 + L]
    pr[:sr.shape[0], :sr.shape[1]] = sr
    pa[:sa.shape[0], :sa.shape[1]] = sa
    out = []
    for nn in (20, 22, 48):
        col, m = shrink(pr, pa, nn)
        out.append((str(nn), to_pal_idx(col, m, pal), 0, 0))
    return pack(out, pal)


# ---------- 1 キャラクター ----------
class Clip:
    """連続フレーム：同じ枠で切り出した (rgb, alpha) の列と、共通の基準点（切り出し後の座標）"""
    def __init__(self, name, frames, anchor, ms, loop):
        self.name, self.frames, self.anchor, self.ms, self.loop = name, frames, anchor, ms, loop


def load_clip(base, name, spec, key, scale_to=None):
    d = os.path.join(base, spec['dir'])
    files = frames_of(d)
    # 使うコマの範囲：range [開始, 終わり（含まない）] か、Forge の gait_loop / retime の selection.json
    rg, sel_ms = spec.get('range'), None
    if spec.get('selection'):
        j = json.load(open(os.path.join(base, spec['selection'])))
        if j.get('sourceIndices'):          # forge-frame-selection/v2（仕上げ後のコマは元の名前・順番のまま）
            files, rg = [files[i] for i in j['sourceIndices']], None
        else:
            rg = [j.get('start', 0), j.get('endExclusive', len(files))]
        sel_ms = j.get('durations_ms')
    if rg:
        files = files[rg[0]:rg[1]]
    raw = [load_rgba(f, key) for f in files]
    H = max(r[1].shape[0] for r in raw)
    W = max(r[1].shape[1] for r in raw)
    if any(r[1].shape != (H, W) for r in raw):
        raise SystemExit('error: %s のコマの大きさがそろっていない（固定キャンバスで書き出す）' % d)
    anc = anchor_of(d, spec)
    if anc is None:
        anc = foot(raw[0][1] > 0, name)
    # 全コマの和の枠で切る（コマごとに切り詰めない）
    U = np.zeros((H, W), bool)
    for _, a in raw:
        U |= a > 0
    y0, y1, x0, x1 = bbox(U.astype(float))
    y1 = max(y1, int(anc[1]) + 1)
    frames = [crop(r, a, (y0, y1, x0, x1)) for r, a in raw]
    ax, ay = anc[0] - x0, anc[1] - y0
    fps = float(spec.get('fps', 8))
    ms = spec.get('ms') or (sel_ms if sel_ms and len(sel_ms) == len(frames) and 'fps' not in spec else None) or [int(round(1000 / fps))] * len(frames)
    if len(ms) != len(frames):
        raise SystemExit('error: %s の ms の数がコマ数と違う' % name)
    c = Clip(name, frames, (ax, ay), [int(v) for v in ms], bool(spec.get('loop', True)))
    c.rest_h = bbox(frames[0][1])[1] - bbox(frames[0][1])[0]
    return c


def scaled_anchor(a, r):
    return int(round((a + .5) * r - .5))


def build_char(cdir, scale_cfg):
    M = json.load(open(os.path.join(cdir, 'character.json')))
    cid, kind, key = M['id'], M.get('kind', 'hum'), M.get('key')
    sc = dict(TEMPLATE['scale'], **(M.get('scale') or {}))
    seirin_k = float(sc.get('seirin', scale_cfg.get('seirin', {}).get(cid, 1.0)))
    def still(p):
        r, a = load_rgba(os.path.join(cdir, p), key)
        return crop(r, a, bbox(a))
    P = {nm: still(p) for nm, p in (M.get('poses') or {}).items()}
    if kind == 'mon' and 'idle' not in P:
        raise SystemExit('error: 敵（mon）は poses.idle が必要')
    ref = sc.get('ref', 'front' if kind == 'hum' else 'idle')
    if ref not in P:
        raise SystemExit('error: 縮尺の基準ポーズ %s が poses に無い' % ref)
    ref_h = P[ref][1].shape[0] * float(sc.get('refK', 1.0))
    ref_w = P[ref][1].shape[1]

    def clips_of(sec, poses):
        out = []
        for nm, spec in (M.get(sec) or {}).items():
            c = load_clip(cdir, nm, spec, key)
            mp = spec.get('matchPose', nm if nm in poses else None)
            c.k = (poses[mp][1].shape[0] / c.rest_h) if (mp and mp in poses) else float(spec.get('scale', 1.0))
            out.append(c)
        return out
    A = clips_of('anims', P)
    S = {nm: still(p) for nm, p in (M.get('seirin') or {}).items()}
    SA = clips_of('seirinAnims', dict(P, **S))

    pal_cfg = M.get('palette') or {}
    srcs = list(P.values()) + [f for c in A for f in c.frames[::max(1, len(c.frames) // 4)]]
    pal = make_pal(srcs, ref_h, int(pal_cfg.get('colors', 32)))
    if kind == 'hum':
        sizes = M.get('sizes') or HERO_SIZES
        plist = [(sk, d, d / ref_h) for sk, d in sizes]
    else:
        Z = dict(ENEMY_SIZES, **(M.get('sizes') or {}))
        zw = max(8, int(Z['z'] * min(1, ref_w / P[ref][1].shape[0])) - 1)
        plist = [('b%d' % w, w, w / ref_w) for w in Z['b']] + [('f%d' % Z['f'], Z['f'], Z['f'] / ref_w),
                                                              ('z%d' % Z['z'], zw, zw / ref_w), ('u%d' % Z['u'], Z['u'], Z['u'] / ref_w)]

    def sizes_for(poses, clips, pal_, kmul, only=None):
        out = {}
        for sk, dots, ks0 in plist:
            ks = ks0 * kmul
            field = sk[0] in 'fz'
            tiles = []
            for nm, (r, a) in poses.items():
                if only and nm not in only:
                    continue
                if field and kind == 'hum' and nm not in FIELD_POSES:
                    continue
                if field and kind == 'mon' and nm != 'idle':
                    continue
                idx, m = quant(r, a, pal_, ks, dots)
                ys, xs = np.where(idx > 0)
                idx = idx[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
                ax, ay = foot(idx > 0, nm)
                tiles.append((nm, idx, ax, ay))
            if kind == 'hum' and sk[0] == 'f':
                have = {t[0] for t in tiles}
                for nm, src in ALIASF.items():
                    if nm not in have and src in poses:
                        idx, m = quant(*poses[src], pal_, ks, dots)
                        ys, xs = np.where(idx > 0)
                        idx = idx[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
                        tiles.append((nm, idx, *foot(idx > 0)))
            if not field:
                for c in clips:
                    r_ = ks * c.k
                    for i, (r, a) in enumerate(c.frames):
                        idx, m = quant(r, a, pal_, r_, dots)
                        # 切り詰めない：全コマ同じ大きさ・同じ基準点
                        tiles.append(('%s@%d' % (c.name, i), idx, scaled_anchor(c.anchor[0], idx.shape[1] / a.shape[1]),
                                      scaled_anchor(c.anchor[1], idx.shape[0] / a.shape[0])))
            if tiles:
                S_ = pack(tiles, pal_)
                S_.update({'k': round(ks, 5), 'dots': dots})
                out[sk] = S_
        return out

    C = {'face': M.get('face', 'L'), 'kind': kind, 'pal': [hexs(c) for c in pal], 'sizes': sizes_for(P, A, pal, 1.0),
         'src': 'pack:' + os.path.relpath(cdir, ROOT)}
    if A:
        C['anims'] = {c.name: {'f': ['%s@%d' % (c.name, i) for i in range(len(c.frames))], 'ms': c.ms, 'loop': 1 if c.loop else 0} for c in A}
    if kind == 'hum':
        hf = 'front' if 'front' in P else ref
        C['heads'] = head_tiles(*P[hf], pal, int(round(P[hf][1].shape[0] * float(M.get('headK', .37)))))
    if M.get('rig'):
        C['rig'] = M['rig']
    out = {cid: C}
    if S or SA:
        palK = make_pal(list(S.values()) + [f for c in SA for f in c.frames[::max(1, len(c.frames) // 4)]], ref_h,
                        int(pal_cfg.get('seirinColors', 32)))
        K = {'face': M.get('face', 'L'), 'kind': kind, 'pal': [hexs(c) for c in palK],
             'sizes': {sk: v for sk, v in sizes_for(S, SA, palK, seirin_k).items() if sk[0] != 'f'}, 'src': C['src'], 'scaleFix': seirin_k}
        if SA:
            K['anims'] = {c.name: {'f': ['%s@%d' % (c.name, i) for i in range(len(c.frames))], 'ms': c.ms, 'loop': 1 if c.loop else 0} for c in SA}
        if 'awk' in S:
            K['heads'] = head_tiles(*S['awk'], palK, int(round(S['awk'][1].shape[0] * float(M.get('headK', .37)) * .92)))
        out[cid + '_K'] = K
    return out


# ---------- 確認用の画像 ----------
def preview(data, out_dir):
    from PIL import ImageDraw
    os.makedirs(out_dir, exist_ok=True)
    import base64, io
    for cid, c in data.items():
        sk = 'B84' if 'B84' in c['sizes'] else sorted(c['sizes'], key=lambda s: -c['sizes'][s]['dots'])[0]
        S = c['sizes'][sk]
        im = Image.open(io.BytesIO(base64.b64decode(S['png'].split(',')[1]))).convert('RGBA')
        z = 3
        tiles = [(nm, im.crop((x, y, x + w, y + h)), ax, ay) for nm, (x, y, w, h, ax, ay) in S['frames'].items()]
        Wd = sum(t[1].width * z + 10 for t in tiles) + 10
        Hd = max(t[3] + 1 for t in tiles) * z + 40
        Cv = Image.new('RGBA', (Wd, Hd), (40, 40, 60, 255))
        d = ImageDraw.Draw(Cv)
        base = Hd - 10
        x = 10
        for nm, t, ax, ay in tiles:
            Cv.alpha_composite(t.resize((t.width * z, t.height * z), Image.NEAREST), (x, base - (ay + 1) * z))
            d.line([(x, base), (x + t.width * z, base)], fill='red')
            d.line([(x + ax * z + z // 2, base - 4), (x + ax * z + z // 2, base + 4)], fill='yellow')
            d.text((x, 2), nm, fill='white')
            x += t.width * z + 10
        Cv.save(os.path.join(out_dir, '%s_%s.png' % (cid, sk)))


# ---------- コマンド ----------
def cmd_init(o):
    d = os.path.join(CHARS, o.id)
    if os.path.exists(d):
        raise SystemExit('error: すでにある: ' + d)
    for sub in ('master', 'anim/idle', 'refs'):
        os.makedirs(os.path.join(d, sub), exist_ok=True)
    T = json.loads(json.dumps(TEMPLATE))
    T['id'], T['kind'] = o.id, o.kind
    if o.kind == 'mon':
        T['poses'] = {'idle': 'master/idle.png', 'front': 'master/front.png'}
        T['scale']['ref'] = 'idle'
        T['seirin'] = {}
        T['anims'] = {'idle': {'dir': 'anim/idle', 'fps': 8, 'loop': True, 'matchPose': 'idle'}}
        T['face'] = 'R'
        T['rig'] = {'base': 'slime', 'wid': 42, 'hgt': 45}
    with open(os.path.join(d, 'character.json'), 'w') as f:
        json.dump(T, f, ensure_ascii=False, indent=2)
    with open(os.path.join(d, 'README.md'), 'w') as f:
        f.write('# %s 素材パック\n\n手順は docs/PIPELINE.md。\n\n'
                '- master/ … 承認したマスター原画（front・stance・seirin など。透過 PNG）\n'
                '- anim/<アクション>/ … 連続フレーム（固定キャンバス。Forge の finish 出力ならそのまま）\n'
                '- refs/ … 参考画像（identity-ref・style-ref・承認前の候補）\n' % o.id)
    print('created', d)


def cmd_build(o):
    scale_cfg = json.load(open(SCALE)) if os.path.exists(SCALE) else {}
    base = o.chars or CHARS
    # 名前が _ で始まるパック（見本・作業中）は、名前を指定したときだけ作る
    dirs = sorted(d for d in glob.glob(os.path.join(base, '*')) if os.path.exists(os.path.join(d, 'character.json'))
                  and (o.ids or not os.path.basename(d).startswith('_')))
    if o.ids:
        dirs = [d for d in dirs if os.path.basename(d) in o.ids or json.load(open(os.path.join(d, 'character.json')))['id'] in o.ids]
    data = {}
    for d in dirs:
        r = build_char(d, scale_cfg)
        data.update(r)
        for k, c in r.items():
            print(k, c['kind'], 'sizes', list(c['sizes']), 'anims', list(c.get('anims', {})))
    out = o.out or OUT
    with open(out, 'w') as f:
        f.write(HEADER)
        f.write('Object.assign(SPX_DATA,' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ');\n')
    print('wrote', out, os.path.getsize(out), list(data))
    if o.preview:
        preview(data, o.preview)
        print('preview', o.preview)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    a = sp.add_parser('init')
    a.add_argument('id')
    a.add_argument('--kind', choices=['hum', 'mon'], default='hum')
    b = sp.add_parser('build')
    b.add_argument('ids', nargs='*')
    b.add_argument('--out')
    b.add_argument('--preview')
    b.add_argument('--chars', help='素材パックの置き場所（既定 assets_src/chars）')
    o = ap.parse_args()
    {'init': cmd_init, 'build': cmd_build}[o.cmd](o)


if __name__ == '__main__':
    main()
