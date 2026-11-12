#!/usr/bin/env python3
"""提供原画 → ゲーム用スプライトデータ（js/spx-data.js）を作る。

 1. 原画を読み、ポーズごとに切り出す（剣士の7ポーズシートは透明な隙間で分割）
 2. 足りないポーズを「原画の解像度で」作る（回転・脚の持ち上げ・剣の付け替え）→ 縮小時にきれいなドットになる
 3. キャラごとに 1 つの共有パレットを作る（全フレーム・全サイズで色をそろえる）
 4. サイズ違い（相対倍率）ごとに、原画から直接縮小して変換する（ドット絵を拡大することはしない）
 5. 足元の位置（アンカー）を自動で求め、フレーム間で接地点をそろえる
 6. パレット番号の RLE を JS に書き出す（実行時に同期でキャンバスへ展開できる）

 usage: python3 tools/build_spx.py            → js/spx-data.js, assets/sprites/*.png, docs/sheets/spx_*.png
"""
import os, sys, json, base64, math
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from import_art import cutout, downscale, clean_mask, split_cells, OUT

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'assets_src', 'originals')
OUTHEX = '#%02x%02x%02x' % OUT

# ------------------------------------------------------------------ 原画の読み込み・切り出し
def crop_alpha(im, th=40):
    a = np.array(im.convert('RGBA')); ys, xs = np.where(a[..., 3] > th)
    return im.convert('RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

def clean_alpha(im, th=40):
    """原画の薄い半透明ノイズを落とす（不透明度 th 未満は完全な透明に）。"""
    a = np.array(im.convert('RGBA')); a[a[..., 3] < th] = 0; return Image.fromarray(a, 'RGBA')

def load_cutout(path, **kw):
    """背景色のある原画 → 背景を抜いた RGBA（Image）"""
    a = cutout(Image.open(path), **kw); a[..., :3] = np.clip(a[..., :3], 0, 255)
    return crop_alpha(Image.fromarray(a.astype(np.uint8), 'RGBA'), 128)

# ------------------------------------------------------------------ 原画の解像度でのポーズ加工
def pad(im, l=0, t=0, r=0, b=0):
    out = Image.new('RGBA', (im.width + l + r, im.height + t + b), (0, 0, 0, 0)); out.alpha_composite(im, (l, t)); return out

def rotate_about(im, deg, cx, cy, pad_px=60):
    """(cx,cy) を中心に回転（反時計回りが正）。はみ出さないよう余白を足してから回し、最後に切り詰める。"""
    p = pad(im, pad_px, pad_px, pad_px, pad_px)
    r = p.rotate(deg, resample=Image.BICUBIC, center=(cx + pad_px, cy + pad_px))
    return r

def erase_poly(im, pts):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    a = np.array(im); a[np.array(m) > 0] = 0; return Image.fromarray(a, 'RGBA')

def take_poly(im, pts):
    """多角形の内側だけを取り出した RGBA（それ以外は透明）"""
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    a = np.array(im).copy(); a[np.array(m) == 0] = 0; return Image.fromarray(a, 'RGBA')

def lift_region(im, box_pts, dx, dy):
    """多角形で選んだ部分（脚など）を (dx,dy) ずらす。元の場所は透明にし、ずらした絵を重ねる。"""
    part = take_poly(im, box_pts); base = erase_poly(im, box_pts)
    out = pad(base, 0, max(0, -dy), max(0, dx), 0)
    out.alpha_composite(part, (max(0, dx), max(0, -dy) + dy if dy < 0 else dy))
    return out

def squash_lower(im, y0, k):
    """y0 より下を縦に k 倍へ縮める（膝を曲げて沈み込む）。"""
    top = im.crop((0, 0, im.width, y0)); low = im.crop((0, y0, im.width, im.height))
    low = low.resize((low.width, max(1, round(low.height * k))), Image.BICUBIC)
    out = Image.new('RGBA', (im.width, top.height + low.height), (0, 0, 0, 0)); out.alpha_composite(top, (0, 0)); out.alpha_composite(low, (0, top.height))
    return out

# ------------------------------------------------------------------ 共有パレット
def build_palette(images, k, colors):
    """全フレームを倍率 k で縮めた不透明画素をまとめて減色 → パレット（輪郭色は別枠で末尾に足す）"""
    pix = []
    for im in images:
        a = np.array(im).astype(np.float32); size = (max(1, round(im.width * k)), max(1, round(im.height * k)))
        rgb, al = downscale(a, size); m = al >= .5; pix.append(rgb[m])
    pix = np.concatenate(pix).astype(np.uint8)
    strip = Image.fromarray(pix.reshape(1, -1, 3), 'RGB').quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE, kmeans=4)
    pal = np.array(strip.getpalette()[:colors * 3]).reshape(-1, 3)
    used = sorted(set(np.array(strip).reshape(-1).tolist()))
    pal = pal[used]
    # 暗い順に並べる（データの見通しと、輪郭判定のため）
    order = np.argsort(pal @ np.array([.3, .59, .11])); pal = pal[order]
    return [tuple(int(v) for v in c) for c in pal]

def map_to_pal(rgb, mask, pal):
    P = np.array(pal, np.float32); flat = rgb[mask].astype(np.float32)
    # 明度差を重く見る距離（色相のずれより明暗の段がくずれる方が目立つ）
    w = np.array([1.0, 1.25, .8], np.float32)
    d = (((flat[:, None, :] - P[None, :, :]) * w) ** 2).sum(axis=2)
    idx = np.zeros(mask.shape, np.uint8); idx[mask] = d.argmin(axis=1) + 1
    return idx

def outline(idx, out_i, pal):
    """外周 1 ドットの輪郭：縁が十分暗ければその縁を輪郭色に、明るい縁の外側には輪郭を足す。"""
    h, w = idx.shape; solid = idx > 0
    lum = np.array([0] + [c[0] * .3 + c[1] * .59 + c[2] * .11 for c in pal] + [0])
    sp = np.pad(solid, 1)
    edge = solid & ~(sp[:-2, 1:-1] & sp[2:, 1:-1] & sp[1:-1, :-2] & sp[1:-1, 2:])
    res = np.zeros((h + 2, w + 2), np.uint8); res[1:-1, 1:-1] = idx
    dk = edge & (lum[idx] < 62)
    res[1:-1, 1:-1][dk] = out_i
    bp = np.pad(edge & ~dk, 2)
    nb = bp[:-2, 1:-1] | bp[2:, 1:-1] | bp[1:-1, :-2] | bp[1:-1, 2:]
    res[(res == 0) & nb] = out_i
    return res

def despeckle(idx, out_i):
    """輪郭の内側に孤立した 1 ドットの輪郭色（縮小で出たゴミ）を、周りの多数色で埋める。"""
    h, w = idx.shape; res = idx.copy()
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if idx[y, x] != out_i: continue
            nb = [idx[y - 1, x], idx[y + 1, x], idx[y, x - 1], idx[y, x + 1]]
            if 0 in nb or out_i in nb: continue
            vals, cnt = np.unique(nb, return_counts=True); res[y, x] = vals[cnt.argmax()]
    return res

def convert_frame(im, k, pal, sharpen=.5):
    from PIL import ImageFilter
    a = np.array(im).astype(np.float32); size = (max(1, round(im.width * k)), max(1, round(im.height * k)))
    rgb, al = downscale(a, size); mask = clean_mask(al >= .5, 4)
    if sharpen:
        img = Image.fromarray(rgb.astype(np.uint8), 'RGB').filter(ImageFilter.UnsharpMask(radius=1, percent=int(sharpen * 100), threshold=0)); rgb = np.array(img).astype(np.float32)
    idx = map_to_pal(rgb, mask, pal)
    out_i = len(pal) + 1
    idx = outline(idx, out_i, pal)
    idx = despeckle(idx, out_i)
    return idx

def anchor_of(idx, mode='feet'):
    """足元の点：最下段付近の不透明画素の左右中央。"""
    ys, xs = np.where(idx > 0); y1 = ys.max()
    if mode == 'center': return (int(round((xs.min() + xs.max()) / 2)), int(y1))
    band = ys >= y1 - max(2, int((y1 - ys.min()) * .08))
    return (int(round(xs[band].mean())), int(y1))

def trim(idx, ax, ay):
    ys, xs = np.where(idx > 0); x0, y0 = xs.min(), ys.min()
    return idx[y0:ys.max() + 1, x0:xs.max() + 1], ax - x0, ay - y0

def atlas_png(tiles, pal):
    """フレームを横に並べた 1 枚の PNG（パレット付き・番号0が透明）→ (data URL, [(sx,sy)...])"""
    import io
    W = sum(t.shape[1] + 1 for t in tiles); H = max(t.shape[0] for t in tiles); at = np.zeros((H, W), np.uint8); pos = []; x = 0
    for t in tiles: at[:t.shape[0], x:x + t.shape[1]] = t; pos.append((x, 0)); x += t.shape[1] + 1
    flat = [0, 0, 0] + [v for c in pal for v in c] + list(OUT)
    im = Image.fromarray(at, 'P'); im.putpalette(flat + [0] * (768 - len(flat)))
    bio = io.BytesIO(); im.save(bio, 'PNG', optimize=True, transparency=0)
    return 'data:image/png;base64,' + base64.b64encode(bio.getvalue()).decode(), pos

def to_rgba(idx, pal):
    lut = np.zeros((len(pal) + 2, 4), np.uint8)
    for i, c in enumerate(pal): lut[i + 1] = (*c, 255)
    lut[len(pal) + 1] = (*OUT, 255)
    return Image.fromarray(lut[idx], 'RGBA')

# ------------------------------------------------------------------ 星臨・色替え（パレット単位）
def hsl(c):
    import colorsys
    r, g, b = [v / 255 for v in c]; h, l, s = colorsys.rgb_to_hls(r, g, b); return h * 360, s, l
def from_hsl(h, s, l):
    import colorsys
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, max(0, min(1, l)), max(0, min(1, s))); return (round(r * 255), round(g * 255), round(b * 255))
def mixc(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def aw_palette_rio(pal):
    """リオ星臨：紺の外套が白銀の光をまとい、金の縁と髪がさらに輝く。肌・輪郭はそのまま。"""
    out = []
    for c in pal:
        h, s, l = hsl(c)
        if 190 <= h <= 265 and s > .18:          # 紺・青の布 → 明るい白銀の青
            out.append(from_hsl(215, min(.55, s * .7), .30 + l * .78))
        elif 30 <= h <= 60 and s > .35:          # 金・金髪 → 白金に寄せて明るく
            out.append(mixc(from_hsl(h + 4, s, min(.92, l * 1.18 + .06)), (255, 250, 220), .18))
        elif (h < 15 or h > 340) and s > .4 and l < .6:   # 赤いスカーフ → 金
            out.append(from_hsl(42, .85, .35 + l * .6))
        else: out.append(c)
    return out

# ------------------------------------------------------------------ キャラ定義
def hero_rio():
    sheet = clean_alpha(Image.open(os.path.join(SRC, 'hero_swordsman_7poses.png')))
    names = ['front', 'ready', 'stance', 'lunge', 'dash', 'back', 'down']
    cells = {n: crop_alpha(c) for n, c in zip(names, split_cells(sheet, min_gap=20))}
    F = dict(cells)
    fr = cells['front']; W0, H0 = fr.size                       # 203×289
    # --- 剣を持たない立ち姿（探索・街用）：左下の刃を消す
    nw = erase_poly(fr, [(0, H0), (0, 222), (34, 196), (52, 200), (56, 214), (30, 250), (16, H0)])
    F['stand'] = crop_alpha(nw)
    # --- 歩き：手前の脚／奥の脚を 1 歩ぶん持ち上げる（原画の解像度で）
    legL = [(40, 226), (104, 226), (104, H0), (40, H0)]; legR = [(104, 226), (178, 226), (178, H0), (104, H0)]
    F['walk_a'] = crop_alpha(lift_region(F['stand'].copy(), legL, -10, -16))
    F['walk_b'] = crop_alpha(lift_region(F['stand'].copy(), legR, 8, -16))
    # --- 詠唱：剣を胸の前で立てる（刃を切り取り、柄を軸に回して上向きに付け直す）
    blade = take_poly(fr, [(0, H0), (0, 222), (34, 196), (52, 200), (56, 214), (30, 250), (16, H0)])
    hilt = (50, 206)
    bp = pad(blade, 0, 120, 0, 0); bl = bp.rotate(-150, resample=Image.BICUBIC, center=(hilt[0], hilt[1] + 120))   # 下向きの刃 → 真上へ（時計回り）
    cast = pad(nw, 0, 120, 0, 0); cast.alpha_composite(bl, (0, 0))
    F['cast'] = crop_alpha(cast)
    # --- 被弾：構えのまま後ろへのけぞる
    st = cells['stance']; sw, sh = st.size
    F['hit'] = crop_alpha(rotate_about(st, -11, sw * .62, sh))
    # --- 瀕死：前へ崩れ、膝が沈む
    F['weak'] = crop_alpha(rotate_about(squash_lower(st, int(sh * .62), .78), 9, sw * .4, sh))
    # --- 防御：構え直して重心を後ろへ
    F['guard'] = crop_alpha(rotate_about(squash_lower(st, int(sh * .62), .9), -6, sw * .6, sh))
    # --- 勝利：剣を掲げた立ち姿（詠唱の絵を少し伸び上がらせる）
    F['win'] = crop_alpha(rotate_about(cells['ready'], -4, cells['ready'].width * .5, cells['ready'].height))
    return dict(id='rio', face='L', kind='hum', frames=F, ref=H0, ref_axis='h', colors=30,
                # 戦闘：正面の立ち姿の高さ（ドット）／探索・街／大型（試練の幻影）
                sizes={'b42': 42, 'b48': 48, 'b54': 54, 'b60': 60, 'b66': 66, 'B84': 84, 'B104': 104, 'f34': 34, 'u36': 36},
                field_frames=['stand', 'walk_a', 'walk_b', 'front', 'win', 'stance', 'ready', 'lunge', 'cast', 'hit', 'weak', 'guard', 'dash', 'down', 'back'],
                head=(W0 * .517, H0 * .228, H0 * .40), aw=aw_palette_rio, field_only=('stand', 'walk_a', 'walk_b', 'back'))

def mon(id_, path, ref_w, sizes, colors, **cut):
    im = load_cutout(os.path.join(SRC, path), **cut)
    return dict(id=id_, face='R', kind='mon', frames={'idle': im}, ref=im.width, ref_axis='w', colors=colors, sizes=sizes, field_frames=['idle'],
                head=None, aw=None)

def chars():
    return [hero_rio(),
            mon('wolf', 'wolf.png', 116, {'b84': 84, 'b100': 100, 'b116': 116, 'b130': 130, 'b146': 146, 'B176': 176, 'f36': 36, 'z46': 46, 'u72': 72}, 26, tol=70),
            mon('boss9', 'boss9_volganon.png', 202, {'b146': 146, 'b174': 174, 'b202': 202, 'b226': 226, 'b252': 252, 'f68': 68, 'z46': 46, 'u56': 56}, 34, tol=40, hole_area=150, hole_tol=40)]

def build(c):
    frames = c['frames']; ref = c['ref']
    k_base = c['sizes'][next(k for k in c['sizes'] if k.startswith('b') and int(k[1:]) == max(int(x[1:]) for x in c['sizes'] if x.startswith('b')))] / ref
    pal = build_palette(list(frames.values()), k_base * .85, c['colors'])
    data = {'face': c['face'], 'kind': c['kind'], 'pal': ['#%02x%02x%02x' % p for p in pal] + [OUTHEX], 'sizes': {}}
    if c['aw']: data['palAw'] = ['#%02x%02x%02x' % p for p in c['aw'](pal)] + [OUTHEX]
    previews = {}
    for sk, dots in c['sizes'].items():
        k = dots / ref; fs = {}
        names = c['field_frames'] if sk.startswith('f') else (['front'] if sk.startswith('z') and c['kind'] == 'hum' else [n for n in frames if n not in c.get('field_only', ())])
        for n in names:
            idx = convert_frame(frames[n], k, pal, sharpen=.45 if dots >= 60 else .3)
            ax, ay = anchor_of(idx, 'center' if n == 'down' else 'feet')
            idx, ax, ay = trim(idx, ax, ay)
            fs[n] = (idx, int(ax), int(ay)); previews[(sk, n)] = (idx, ax, ay)
        url, pos = atlas_png([v[0] for v in fs.values()], pal)
        data['sizes'][sk] = {'k': round(k, 5), 'dots': dots, 'png': url, 'frames': {n: [p[0], p[1], int(v[0].shape[1]), int(v[0].shape[0]), v[1], v[2]] for (n, v), p in zip(fs.items(), pos)}}
    if c['head']:   # 顔グラ用：正面の頭部を四角く切り出して変換
        hx, hy, hs = c['head']; fr = frames['front']
        box = (int(hx - hs / 2), int(hy - hs / 2), int(hx + hs / 2), int(hy + hs / 2))
        head = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0)); head.alpha_composite(fr.crop((max(0, box[0]), max(0, box[1]), box[2], box[3])), (max(0, -box[0]), max(0, -box[1])))
        hs_ = {}
        for n in (20, 22, 48):
            a = np.array(head).astype(np.float32); rgb, al = downscale(a, (n, n)); m = al >= .5
            idx = map_to_pal(rgb, m, pal); idx = outline(idx, len(pal) + 1, pal)[1:-1, 1:-1]
            hs_[str(n)] = idx; previews[('head', str(n))] = (idx, 0, 0)
        url, pos = atlas_png(list(hs_.values()), pal)
        data['heads'] = {'png': url, 'frames': {n: [p[0], p[1], v.shape[1], v.shape[0], 0, 0] for (n, v), p in zip(hs_.items(), pos)}}
    return data, pal, previews

def sheet(cid, previews, pal, path, palAw=None):
    items = sorted(previews.items(), key=lambda kv: (kv[0][0], kv[0][1]))
    sc = 3; cols = 8; cw = max(v[0].shape[1] for v in previews.values()) * sc + 10; ch = max(v[0].shape[0] for v in previews.values()) * sc + 18
    cw = min(cw, 260); rows = (len(items) + cols - 1) // cols
    out = Image.new('RGBA', (cols * cw + 10, rows * ch + 10), (58, 70, 52, 255)); d = ImageDraw.Draw(out)
    for i, ((sk, n), (idx, ax, ay)) in enumerate(items):
        im = to_rgba(idx, pal); s = sc if im.width * sc <= cw - 8 else max(1, (cw - 8) // im.width)
        x = 6 + (i % cols) * cw; y = 6 + (i // cols) * ch
        out.alpha_composite(im.resize((im.width * s, im.height * s), Image.NEAREST), (x, y)); d.text((x, y + im.height * s + 1), f'{sk}:{n}', fill='#dddddd')
    out.save(path)

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'docs', 'sheets'), exist_ok=True); os.makedirs(os.path.join(ROOT, 'assets', 'sprites'), exist_ok=True)
    only = sys.argv[1:] or None; ALL = {}
    prev_path = os.path.join(ROOT, 'js', 'spx-data.js')
    if only and os.path.exists(prev_path):
        txt = open(prev_path, encoding='utf8').read(); ALL = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    for c in chars():
        if only and c['id'] not in only: continue
        data, pal, prev = build(c); ALL[c['id']] = data
        sheet(c['id'], prev, pal, os.path.join(ROOT, 'docs', 'sheets', f"spx_{c['id']}.png"))
        main = [s for s in data['sizes'] if s.startswith('b')]; main = main[len(main) // 2]
        for n, fr in data['sizes'][main]['frames'].items():
            idx, ax, ay = prev[(main, n)]; to_rgba(idx, pal).save(os.path.join(ROOT, 'assets', 'sprites', f"{c['id']}_{n}.png"))
        nb = sum(len(s['png']) for s in data['sizes'].values())
        print(c['id'], 'colors', len(data['pal']), 'sizes', list(data['sizes']), 'frames', len(c['frames']), 'bytes', nb)
    js = '/* 自動生成：tools/build_spx.py（提供原画 assets_src/originals → パレット番号 RLE）。手で編集しない */\nconst SPX_DATA=' + json.dumps(ALL, separators=(',', ':')) + ';\n'
    open(prev_path, 'w', encoding='utf8').write(js); print('js/spx-data.js', len(js) // 1024, 'KB')
