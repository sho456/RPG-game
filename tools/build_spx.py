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


# ------------------------------------------------------------------ 味方（ポーズ一覧シート）
from hero_sheet import segment, pose_image

def aw_rules(rules, glow=0.0):
    """星臨の配色：色相の範囲ごとに、目標の色相・彩度倍率・明るさの式で置き換える。肌・輪郭はそのまま。
    rules: [(h0, h1, smin, lmax, 目標の色相 or None, 彩度倍率, (明るさ = a + b*l))]"""
    def f(pal):
        out = []
        for c in pal:
            h, s, l = hsl(c); done = False
            skin = 12 <= h <= 42 and .18 <= s <= .75 and l >= .55
            if not skin:
                for h0, h1, smin, lmax, th, sm, (la, lb) in rules:
                    inside = (h0 <= h <= h1) if h0 <= h1 else (h >= h0 or h <= h1)
                    if inside and s >= smin and l <= lmax:
                        out.append(from_hsl(h if th is None else th, min(1, s * sm), min(.95, la + lb * l))); done = True; break
            if not done: out.append(mixc(c, (255, 250, 230), glow) if glow and not skin else c)
        return out
    return f

GOLD = (35, 60, .3, 1, 45, 1.05, (.08, 1.12))   # 金具・金糸：白金寄りに明るく

# 各キャラ：シート上の番号（hero_sheet.segment の並び順）→ ゲームのポーズ名。
#   'm'：左右反転（右を向いて描かれたポーズを、味方の向き＝左向きにそろえる）
#   'add'：同じポーズに含める別の塊（離れて描かれた相棒など）
#   'erase'：原画の座標（反転前）で消す多角形（輪郭に重なって残ったエフェクト）
#   eye/feet：正面の目と足元の高さ（原画 px）。キャラ間の頭身・大きさをそろえる基準
#   cx：正面の顔の中心 x（顔グラの切り出し）。hgt：元のリグの背丈（ゲーム内の大きさの比）
HEROES = {
 'gald': dict(erase={'lunge': [[(172, 118), (222, 118), (222, 172), (176, 174), (168, 160)]]}, hgt=38.5, eye=90, feet=248, cx=128, seg={},
   poses={'stance': 0, 'front': 1, 'back': 2, 'walk_a': 3, 'dash': (4, 'm'), 'guard': (5, 'm'), 'lunge': (6, 'm'), 'ready': 7,
          'hit': 8, 'cast': 9, 'weak': 10, 'win': 11, 'down': 12},
   aw=aw_rules([(340, 15, .35, .8, 222, .9, (.12, 1.05)), GOLD, (0, 360, 0, 1, 215, .25, (.06, 1.08))])),
 'celes': dict(erase={'dash': [[(150, 135), (202, 135), (202, 206), (140, 206), (140, 190)]]}, hgt=36.1, eye=88, feet=216, cx=72, hy=96, seg={},
   poses={'stance': 0, 'front': 1, 'back': 2, 'lunge': 3, 'guard': 4, 'walk_a': 5, 'dash': 6, 'cast': 7, 'hit': 8, 'weak': 9, 'win': 10, 'down': 11},
   aw=aw_rules([(250, 320, .15, .9, 238, 1.1, (.1, 1.15)), GOLD], glow=.06)),
 'mire': dict(erase={'lunge': [[(212, 66), (266, 66), (266, 116), (212, 116)]]}, hgt=36.5, eye=72, feet=230, cx=70, seg={},
   poses={'stance': (0, 'm'), 'front': 1, 'back': 2, 'lunge': (3, 'm'), 'walk_a': (5, 'm'), 'dash': (6, 'm'), 'cast': (7, 'm'), 'hit': (8, 'm'),
          'weak': 9, 'win': (10, 'm'), 'down': 11, 'guard': ('derive', 'guard', 'stance')},
   aw=aw_rules([(340, 12, .4, .7, 218, .95, (.1, 1.1)), GOLD])),
 'noah': dict(erase={'guard': [[(125, 0), (220, 0), (220, 70), (158, 70), (150, 50), (125, 30)]]}, hgt=35, eye=100, feet=241, cx=100, seg={},
   poses={'stance': (0, 'm'), 'front': 1, 'back': 2, 'walk_a': (3, 'm'), 'dash': (4, 'm'), 'lunge': (5, 'm'), 'guard': (6, 'm'), 'cast': (7, 'm'),
          'hit': (8, 'm'), 'weak': (9, 'm'), 'win': (10, 'm'), 'down': 11},
   aw=aw_rules([GOLD, (0, 360, 0, .45, 230, .6, (.08, 1.1))], glow=.1)),
 'erna': dict(erase={'dash': [[(108, 98), (147, 98), (147, 148), (110, 148), (108, 130)]]}, hgt=38.7, eye=45, feet=158, cx=85, seg={'pre_fill': [(876, 282, 1010, 316)]},
   poses={'stance': 0, 'front': 1, 'back': 2, 'walk_a': 5, 'dash': 6, 'lunge': (7, 'm'), 'cast': (7, 'm'), 'hit': (8, 'm'), 'weak': 9, 'win': 10, 'down': 11,
          'guard': ('derive', 'guard', 'stance')},
   aw=aw_rules([(200, 250, .25, .8, 212, .45, (.3, .85)), GOLD])),
 'hakua': dict(erase={'dash': [[(108, 96), (154, 96), (154, 148), (95, 148), (100, 135)]], 'down': [[(112, 0), (170, 0), (170, 62), (140, 62), (138, 80), (118, 80)]]}, hgt=35.5, eye=47, feet=157, cx=42, seg={},
   poses={'stance': (0, 'm'), 'front': 1, 'back': 2, 'lunge': (3, 'm'), 'guard': 4, 'walk_a': (5, 'm'), 'dash': 6, 'cast': 7, 'hit': 8, 'weak': 9, 'win': 10, 'down': 11},
   aw=aw_rules([(340, 15, .35, .75, 318, .8, (.08, 1.05)), (0, 360, 0, 1, 205, .3, (.05, 1.02))])),
 'balza': dict(erase={'lunge': [[(48, 126), (92, 126), (92, 168), (48, 168)], [(146, 138), (168, 138), (168, 168), (146, 168)]], 'dash': [[(118, 98), (182, 98), (182, 146), (115, 146)]], 'cast': [[(0, 104), (48, 104), (48, 182), (0, 182)], [(140, 80), (155, 80), (155, 182), (140, 182)]]}, hgt=31.5, eye=48, feet=148, cx=100, seg={},
   poses={'stance': 0, 'front': 1, 'back': 2, 'lunge': 3, 'walk_a': 6, 'dash': 7, 'cast': 8, 'hit': (9, 'm'), 'weak': 10, 'win': 11, 'down': 12,
          'guard': ('derive', 'guard', 'stance')},
   aw=aw_rules([(345, 20, .35, .7, 22, 1.1, (.12, 1.15)), GOLD])),
 'crow': dict(erase={'lunge': [[(190, 68), (355, 68), (355, 280), (200, 280), (205, 245), (240, 225), (250, 195), (238, 180), (205, 160), (195, 120)], [(0, 240), (50, 240), (50, 280), (0, 280)], [(80, 262), (160, 262), (160, 280), (80, 280)]], 'cast': [[(0, 95), (62, 95), (65, 150), (70, 210), (0, 210)], [(170, 100), (247, 100), (247, 210), (160, 210), (165, 150)], [(60, 196), (170, 196), (170, 210), (60, 210)]]}, hgt=38.8, eye=108, feet=260, cx=78, seg={'hole_tol': 60, 'hole_area': 100},
   poses={'stance': (0, 'm'), 'front': 1, 'back': 2, 'lunge': (3, 'm'), 'guard': (4, 'm'), 'walk_a': (5, 'm'), 'dash': (6, 'm'), 'cast': (7, 'm'),
          'hit': (8, 'm'), 'weak': (9, 'm'), 'win': (10, 'm'), 'down': 11},
   aw=aw_rules([(240, 320, .12, .9, 232, 1.4, (.06, 1.2))])),
 'shion': dict(hgt=34.3, eye=80, feet=222, cx=108, seg={'hole_tol': 60, 'hole_area': 100},
   poses={'stance': (0, 'm'), 'front': 1, 'back': 2, 'lunge': (3, 'm'), 'guard': (4, 'm'), 'cast': (5, 'm'), 'walk_a': (6, 'm'), 'dash': (7, 'm'),
          'hit': 8, 'weak': 9, 'win': (10, 'm'), 'down': 11},
   aw=aw_rules([(90, 170, .2, .9, 182, 1.1, (.12, 1.15)), GOLD])),
 'jin': dict(erase={'lunge': [[(150, 0), (255, 0), (255, 190), (110, 190), (110, 165), (150, 140)]], 'guard': [[(0, 75), (58, 75), (68, 120), (68, 180), (0, 180)], [(162, 0), (236, 0), (236, 180), (160, 180), (158, 110)], [(0, 172), (236, 172), (236, 180), (0, 180)]], 'win': [[(0, 140), (35, 140), (35, 215), (0, 215)], [(150, 195), (232, 195), (232, 242), (145, 242)]]}, hgt=38.5, eye=72, feet=199, cx=68, seg={}, popo=True,
   poses={'stance': 0, 'front': 1, 'back': 2, 'lunge': 3, 'guard': 4, 'walk_a': ([5, 6], 'm'), 'walk_b': 7, 'dash': ([8, 9], 'm'), 'cast': 10, 'hit': 11,
          'weak': [12, 13], 'win': 15, 'down': 16},
   aw=aw_rules([(70, 170, .15, .8, 42, .9, (.06, 1.0)), GOLD])),
 'valk': dict(hgt=39.8, eye=70, feet=214, cx=135, seg={'hole_tol': 60, 'hole_area': 100},
   poses={'stance': (0, 'm'), 'front': 1, 'back': 2, 'lunge': (3, 'm'), 'guard': (4, 'm'), 'walk_a': (5, 'm'), 'dash': (6, 'm'), 'cast': (7, 'm'),
          'hit': 8, 'weak': (9, 'm'), 'win': (10, 'm'), 'down': 11},
   aw=aw_rules([(340, 15, .3, .7, 236, .9, (.04, .9)), GOLD])),
}

def popo_mask(a):
    """ジンの相棒ポポ（橙と白の毛）の画素：足元の基準点を求めるときに除く"""
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return ((r > 170) & (g > 80) & (g < 190) & (b < 120) & (r - b > 90)) | ((r > 225) & (g > 215) & (b > 200))

def derive(kind, st):
    sw, sh = st.size
    if kind == 'guard': return crop_alpha(rotate_about(squash_lower(st, int(sh * .62), .9), -6, sw * .6, sh))
    if kind == 'hit': return crop_alpha(rotate_about(st, -11, sw * .62, sh))
    raise ValueError(kind)

def hero(cid):
    H = HEROES[cid]; path = os.path.join(SRC, f'hero_{cid}_poses.png')
    parts, rgba = segment(path, **H['seg'])
    F = {}; AX = {}
    for name, spec in H['poses'].items():
        if isinstance(spec, tuple) and spec[0] == 'derive': continue
        ids, flags = (spec, ()) if not isinstance(spec, tuple) else (spec[0], spec[1:])
        ids = ids if isinstance(ids, list) else [ids]
        im, _ = pose_image(parts, rgba, ids)
        for poly in H.get('erase', {}).get(name, []): im = erase_poly(im, poly)
        im = crop_alpha(im, 128)
        if 'm' in flags: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        F[name] = im
    for name, spec in H['poses'].items():
        if isinstance(spec, tuple) and spec[0] == 'derive': F[name] = derive(spec[1], F[spec[2]])
    if H.get('popo'):   # 足元の基準点はジン本人の足（ポポを除く）
        for n, im in F.items():
            a = np.array(im); m = (a[..., 3] > 128) & ~popo_mask(a); ys, xs = np.where(m)
            if len(ys): y1 = ys.max(); band = ys >= y1 - max(2, int((y1 - ys.min()) * .08)); AX[n] = float(xs[band].mean())
    F.setdefault('stand', F['stance'])
    f = H['hgt'] / 37.0; ef = H['feet'] - H['eye']
    ref = ef / 201 * 289 / H.get('scale', 1)   # リオの正面（目→足 201px／全高 289px）に換算した全高。scale：帽子などで目の位置が低いキャラの補正
    base = {'b42': 42, 'b48': 48, 'b54': 54, 'b60': 60, 'b66': 66, 'B84': 84, 'B104': 104}
    sizes = {k: max(8, round(v * f)) for k, v in base.items()}; sizes['f34'] = round(34 * f); sizes['u36'] = round(36 * f)
    fr = F['front']
    head = (H['cx'], H.get('hy', H['eye'] - .11 * ef), .577 * ef)   # hy：帽子のつばが大きいキャラは顔の中心を下げる
    order = ['stand', 'walk_a', 'walk_b', 'front', 'win', 'stance', 'ready', 'lunge', 'cast', 'hit', 'weak', 'guard', 'dash', 'down', 'back']
    return dict(id=cid, face='L', kind='hum', frames=F, ref=ref, ref_axis='h', colors=31, sizes=sizes, anchors=AX,
                field_frames=[n for n in order if n in F], head=head, aw=H['aw'], field_only=('stand', 'walk_a', 'walk_b', 'back'))

# ------------------------------------------------------------------ 星臨（覚醒）の原画：シートの「覚醒した姿」1 枚
# method：'wall'＝通常ポーズと同じ（輪郭の内側だけ）／'flood'＝背景色だけを抜く（輪郭の無い光の翼・光輪・炎を残す）
# box：シート上の範囲（flood のとき）。idx：segment の番号（wall のとき）。erase：原画座標（反転前）の多角形
AWK = {
 'gald': dict(method='flood', box=(936, 574, 1228, 805)),
 'celes': dict(method='wall', idx=12),
 'mire': dict(method='flood', box=(940, 461, 1250, 820)),
 'noah': dict(method='flood', box=(1000, 590, 1254, 821)),
 'erna': dict(method='wall', idx=12, erase=[[(0, 0), (170, 0), (170, 52), (0, 52)]]),
 'hakua': dict(method='wall', idx=12, erase=[[(0, 0), (78, 0), (78, 260), (0, 260)], [(0, 0), (320, 0), (320, 48), (0, 48)],
                                        [(78, 48), (125, 48), (125, 105), (78, 105)], [(118, 48), (162, 48), (162, 63), (118, 63)], [(205, 48), (320, 48), (320, 110), (250, 110), (205, 80)]]),
 'balza': dict(method='wall', idx=13),
 'crow': dict(method='wall', idx=12),
 'shion': dict(method='wall', idx=12),
 'jin': dict(method='wall', idx=17, m=True),
 'valk': dict(method='flood', box=(958, 617, 1230, 832)),
}

AWK_HEAD = {'gald': (165, 58, 0), 'celes': (95, 115, 62), 'mire': (160, 180, 0), 'noah': (108, 95, 0), 'erna': (65, 52, 56), 'hakua': (62, 56, 56),
            'balza': (125, 85, 62), 'crow': (155, 226, 72), 'shion': (145, 78, 0), 'jin': (196, 62, 72), 'valk': (150, 75, 0)}   # 顔の中心 x, y, 切り出す大きさ（0＝通常の顔と同じ）

def hero_awk(base):
    """星臨の姿（原画の 1 枚絵）を、通常の姿と同じ縮尺で別キャラ「<id>_K」として作る（専用パレット）。
    戦闘では 1 枚絵をポーズの値に合わせて整数ドットで動かす（敵と同じ方式）。オーラが大きすぎる絵は高さを抑える。"""
    cid = base['id']; im = awk_image(cid); fr = base['frames']['front']
    cap = fr.height * 1.3
    if im.height > cap: im = im.resize((round(im.width * cap / im.height), round(cap)), Image.LANCZOS); hs_k = cap / awk_image(cid).height
    else: hs_k = 1
    hx, hy, hs = AWK_HEAD[cid]; hs = hs or base['head'][2]
    sizes = {k: v for k, v in base['sizes'].items() if not k.startswith('f')}
    return dict(id=cid + '_K', face='L', kind='hum', frames={'awk': im}, ref=base['ref'], ref_axis='h', colors=31, sizes=sizes,
                field_frames=[], head=(hx * hs_k, hy * hs_k, hs * hs_k), head_src='awk', aw=None, field_only=())

def awk_image(cid):
    A = AWK[cid]; H = HEROES[cid]; path = os.path.join(SRC, f'hero_{cid}_poses.png')
    if A['method'] == 'wall':
        parts, rgba = segment(path, **H['seg']); im, _ = pose_image(parts, rgba, [A['idx']])
    else:
        from scipy import ndimage as ndi
        x0, y0, x1, y1 = A['box']; src = Image.open(path).convert('RGBA'); p = 20
        crop = src.crop((x0 - p, y0 - p, min(src.width, x1 + p), min(src.height, y1 + p)))
        a = cutout(crop, tol=40, hole_area=150, hole_tol=30)
        m = a[..., 3] > 127; lab, n = ndi.label(m); ar = ndi.sum(m, lab, range(1, n + 1))
        a[..., 3] = np.where(lab == int(np.argmax(ar)) + 1, 255, 0)   # 一番大きな塊だけ（離れた星・隣のポーズは落とす）
        im = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    im = crop_alpha(im, 128)
    if A.get('erase'):
        for poly in A['erase']: im = erase_poly(im, poly)
        im = crop_alpha(im, 128)
    if A.get('m'): im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im

def mon(id_, path, ref_w, sizes, colors, **cut):
    im = load_cutout(os.path.join(SRC, path), **cut)
    return dict(id=id_, face='R', kind='mon', frames={'idle': im}, ref=im.width, ref_axis='w', colors=colors, sizes=sizes, field_frames=['idle'],
                head=None, aw=None)

def chars(only=None):
    want = lambda i: not only or i in only
    hs = [hero(c) for c in HEROES if want(c) or want(c + '_K')]
    return ([hero_rio()] if want('rio') else []) + [h for h in hs if want(h['id'])] + [hero_awk(h) for h in hs if h['id'] in AWK] + [
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
            if n in c.get('anchors', {}) and n != 'down': ax = int(round(c['anchors'][n] * (idx.shape[1] - 2) / frames[n].width)) + 1
            idx, ax, ay = trim(idx, ax, ay)
            fs[n] = (idx, int(ax), int(ay)); previews[(sk, n)] = (idx, ax, ay)
        url, pos = atlas_png([v[0] for v in fs.values()], pal)
        data['sizes'][sk] = {'k': round(k, 5), 'dots': dots, 'png': url, 'frames': {n: [p[0], p[1], int(v[0].shape[1]), int(v[0].shape[0]), v[1], v[2]] for (n, v), p in zip(fs.items(), pos)}}
    if c['head']:   # 顔グラ用：正面の頭部を四角く切り出して変換
        hx, hy, hs = c['head']; fr = frames[c.get('head_src', 'front')]
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
    for c in chars(only):
        if only and c['id'] not in only and c['id'][:-2] not in only: continue
        data, pal, prev = build(c); ALL[c['id']] = data
        sheet(c['id'], prev, pal, os.path.join(ROOT, 'docs', 'sheets', f"spx_{c['id']}.png"))
        main = [s for s in data['sizes'] if s.startswith('b')]; main = main[len(main) // 2]
        for n, fr in data['sizes'][main]['frames'].items():
            idx, ax, ay = prev[(main, n)]; to_rgba(idx, pal).save(os.path.join(ROOT, 'assets', 'sprites', f"{c['id']}_{n}.png"))
        nb = sum(len(s['png']) for s in data['sizes'].values())
        print(c['id'], 'colors', len(data['pal']), 'sizes', list(data['sizes']), 'frames', len(c['frames']), 'bytes', nb)
    js = '/* 自動生成：tools/build_spx.py（提供原画 assets_src/originals → パレット番号 RLE）。手で編集しない */\nconst SPX_DATA=' + json.dumps(ALL, separators=(',', ':')) + ';\n'
    open(prev_path, 'w', encoding='utf8').write(js); print('js/spx-data.js', len(js) // 1024, 'KB')
