"""ドット絵生成コア（アストラル・ブレイカー スプライト刷新用）

方針（docs/art_bible.md 参照）
  ・1スプライト = インデックスカラーのキャンバス。素材（マテリアル）ごとに 3〜5 段のカラーランプを持つ
  ・下地：立体プリミティブ（球・チューブ・面取りブロブ・平面ポリゴン）に左上固定光源で明度を与え、ランプ段へ量子化する
  ・仕上げ：目・牙・爪・ハイライト・模様は px()/line()/stamp()/stroke() で 1 ドットずつ手置きする
  ・輪郭：外周は共通の暗紫（OUT）。パーツ同士の重なりは奥側 1px を最暗色にして分離する
  ・補間・ぼかし・自動ディザは使わない（質感用の模様は tex_* を明示的に呼んだ所だけ）
"""
import math, colorsys
import numpy as np
from PIL import Image, ImageDraw

OUT = '#221c28'           # 共通輪郭色（RS系に倣い単一の暗色。わずかに紫寄り）
LIGHT = np.array([-0.52, -0.64, 0.56]); LIGHT = LIGHT / np.linalg.norm(LIGHT)   # 左上・手前からの光

def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def rgb2hex(r, g, b):
    return '#%02x%02x%02x' % (int(max(0, min(255, round(r)))), int(max(0, min(255, round(g)))), int(max(0, min(255, round(b)))))
def mix(a, b, t):
    A, B = hex2rgb(a), hex2rgb(b); return rgb2hex(*[A[i] + (B[i] - A[i]) * t for i in range(3)])

def _hue_to(h, target, f):
    d = ((target - h + 0.5) % 1.0) - 0.5
    return (h + d * f) % 1.0

def ramp(base, n=5, dark=0.30, light=0.92, shift=1.0, sat=1.0):
    """基本色から n 段のランプ（暗→明）を作る。暗部は青紫寄り・明部は黄寄りに色相をずらす。"""
    r, g, b = [v / 255 for v in hex2rgb(base)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    mid = (n - 1) / 2 if n != 4 else 1.6
    out = []
    for i in range(n):
        t = (i - mid) / max(mid, 1e-6)          # -1..1 付近
        if t < 0:
            k = -t
            ll = l * (1 - k * (1 - dark) * 0.86)
            hh = _hue_to(h, 0.72, 0.16 * k * shift) if s > 0.06 else 0.72
            ss = min(1, s * (1 + 0.18 * k)) * sat if s > 0.06 else 0.10 * k
        else:
            k = t / ((n - 1 - mid) / max(mid, 1e-6)) if n - 1 - mid > 0 else 0
            ll = l + (light - l) * k * 0.92
            hh = _hue_to(h, 0.13, 0.14 * k * shift) if s > 0.06 else 0.13
            ss = s * (1 - 0.30 * k) * sat if s > 0.06 else 0.06 * k
        rr, gg, bb = colorsys.hls_to_rgb(hh, max(0, min(1, ll)), max(0, min(1, ss)))
        out.append(rgb2hex(rr * 255, gg * 255, bb * 255))
    return out

# 明度 → 段 の境界（素材の種類ごと）。lum は 法線・光 の内積（平らな正面で約 0.56）
TH = {
    'matte': {3: [0.10, 0.74], 4: [-0.02, 0.40, 0.80], 5: [-0.10, 0.26, 0.62, 0.88], 6: [-0.2, 0.08, 0.36, 0.64, 0.88]},
    'metal': {3: [0.22, 0.70], 4: [0.10, 0.46, 0.78], 5: [0.02, 0.34, 0.60, 0.82], 6: [-0.1, 0.16, 0.42, 0.62, 0.84]},
    'soft':  {3: [0.02, 0.80], 4: [-0.10, 0.34, 0.86], 5: [-0.18, 0.18, 0.58, 0.92], 6: [-0.25, 0.02, 0.3, 0.6, 0.92]},
}

def catmull(pts, closed=False, sub=8):
    """制御点を通るなめらかな曲線の折れ線化（Catmull-Rom）。"""
    P = [np.array(p, float) for p in pts]; n = len(P); out = []
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = P[(i - 1) % n] if (closed or i > 0) else P[i]
        p1 = P[i]; p2 = P[(i + 1) % n]
        p3 = P[(i + 2) % n] if (closed or i + 2 < n) else p2
        for k in range(sub):
            t = k / sub; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)))
    if not closed: out.append(tuple(P[-1]))
    return out

def bez(p0, p1, p2, n=10):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]

def _dist_in(mask, R):
    """マスク内側の輪郭からの距離（最大 R）。八角形距離の近似。"""
    d = np.zeros(mask.shape, np.float32); cur = mask.copy(); k = 0
    while k < R and cur.any():
        k += 1; d[cur] = k
        p = np.pad(cur, 1)
        nxt = cur & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
        if k % 2 == 0: nxt &= p[:-2, :-2] & p[:-2, 2:] & p[2:, :-2] & p[2:, 2:]
        cur = nxt
    d[cur] = R + 1
    return d

def _box3(a):
    p = np.pad(a, 1, mode='edge')
    return (p[:-2, :-2] + p[:-2, 1:-1] + p[:-2, 2:] + p[1:-1, :-2] + p[1:-1, 1:-1] + p[1:-1, 2:] + p[2:, :-2] + p[2:, 1:-1] + p[2:, 2:]) / 9.0


class Cv:
    def __init__(s, w, h, ax=None, ay=None, pose=None, k=1.0):
        s.w, s.h = w, h; s.k = k
        s.ax = w // 2 if ax is None else ax; s.ay = h - 2 if ay is None else ay
        s.m = np.zeros((h, w), np.int16); s.lum = np.zeros((h, w), np.float32)
        s.z = np.full((h, w), -1e9, np.float32); s.fix = np.full((h, w), -1, np.int8); s.pid = np.zeros((h, w), np.int16)
        s.mats = [None]; s.mi = {}; s.pose = pose or {}; s.tfs = []; s.part_id = 0; s.part_names = {}
        yy, xx = np.mgrid[0:h, 0:w]; s.X = xx.astype(np.float32) + 0.5; s.Y = yy.astype(np.float32) + 0.5
        s.meta = {}; s.sep_gap = 0.5

    # ---------- 素材 ----------
    def mat(s, name, cols, kind='matte', th=None, glow=False, slot=None, spec=None):
        """cols: 暗→明 の色リスト（または基本色1つ→自動5段）。spec=(しきい値, 段) で鏡面ハイライト。"""
        if isinstance(cols, str): cols = ramp(cols)
        d = dict(name=name, cols=list(cols), kind=kind, th=th or TH[kind][len(cols)] if len(cols) >= 3 else [0.3] * (len(cols) - 1), glow=glow, slot=slot, spec=spec)
        if name in s.mi: s.mats[s.mi[name]] = d
        else: s.mi[name] = len(s.mats); s.mats.append(d)
        return s

    # ---------- 変形（パーツ単位のずらし・回転：フレーム差分用） ----------
    class _Part:
        def __init__(p, c, name, pivot): p.c, p.name, p.pivot = c, name, pivot
        def __enter__(p):
            c = p.c; v = c.pose.get(p.name, (0, 0, 0)); v = tuple(v) + (0,) * (3 - len(v))
            c.tfs.append((v[0], v[1], math.radians(v[2]), p.pivot)); p.prev = c.part_id
            if p.name not in c.part_names: c.part_names[p.name] = len(c.part_names) + 1
            c.part_id = c.part_names[p.name]; return c
        def __exit__(p, *a): p.c.tfs.pop(); p.c.part_id = p.prev
    def part(s, name, pivot=(0, 0)): return Cv._Part(s, name, pivot)

    def T(s, x, y):
        for dx, dy, a, pv in reversed(s.tfs):
            if a:
                X, Y = x - pv[0], y - pv[1]; ca, sa = math.cos(a), math.sin(a)
                x, y = pv[0] + X * ca - Y * sa, pv[1] + X * sa + Y * ca
            x += dx; y += dy
        return x * s.k, y * s.k
    def _rot(s):
        return sum(t[2] for t in s.tfs)
    def Tp(s, pts): return [s.T(*p) for p in pts]

    # ---------- 書き込み ----------
    def _put(s, mask, m, z, lum, fix=None):
        mi = s.mi[m] if isinstance(m, str) else m
        sel = mask & (z >= s.z)
        if not sel.any(): return sel
        s.m[sel] = mi; s.z[sel] = z if np.isscalar(z) else z[sel]; s.pid[sel] = s.part_id
        if fix is None:
            s.lum[sel] = lum[sel] if isinstance(lum, np.ndarray) else lum; s.fix[sel] = -1
        else: s.fix[sel] = fix
        return sel

    # ---------- 立体プリミティブ ----------
    def ball(s, cx, cy, rx, ry, m, z=0, rot=0, bias=0, flat=0):
        """楕円体。rot=度。flat=0..1 で正面を平たく（鎧板など）。"""
        cx, cy = s.T(cx, cy); rx *= s.k; ry *= s.k; a = math.radians(rot) + s._rot(); ca, sa = math.cos(a), math.sin(a)
        dx, dy = s.X - cx, s.Y - cy; u = (dx * ca + dy * sa) / rx; v = (-dx * sa + dy * ca) / ry
        r2 = u * u + v * v; mask = r2 <= 1.0
        if not mask.any(): return s
        nz = np.sqrt(np.clip(1 - r2, 0, 1)); nz = nz + (1 - nz) * flat * 0.6
        nx, ny = u * ca - v * sa, u * sa + v * ca
        ln = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-6
        lum = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / ln + bias
        s._put(mask, m, z, lum); return s

    def tube(s, pts, rad, m, z=0, bias=0, flat=0):
        """折れ線に沿う丸棒（四肢・尾・角・首）。rad は数値または各点の半径リスト（0 で先細り）。"""
        pts = s.Tp(pts); n = len(pts)
        rad = [rad * s.k] * n if np.isscalar(rad) else [r * s.k for r in rad]
        best = np.full((s.h, s.w), -1.0, np.float32); NX = np.zeros_like(best); NY = np.zeros_like(best)
        for i in range(n - 1):
            (x0, y0), (x1, y1) = pts[i], pts[i + 1]; r0, r1 = rad[i], rad[i + 1]
            vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy + 1e-9
            t = np.clip(((s.X - x0) * vx + (s.Y - y0) * vy) / L2, 0, 1)
            qx, qy = x0 + vx * t, y0 + vy * t; r = r0 + (r1 - r0) * t + 1e-6
            dx, dy = s.X - qx, s.Y - qy; d = np.sqrt(dx * dx + dy * dy) / r
            nz = np.sqrt(np.clip(1 - d * d, 0, 1)); inside = (d <= 1.0) & (r > 0.35)
            upd = inside & (nz > best)
            best[upd] = nz[upd]; NX[upd] = (dx / r)[upd]; NY[upd] = (dy / r)[upd]
        mask = best >= 0
        if not mask.any(): return s
        nz = best + (1 - best) * flat * 0.6
        ln = np.sqrt(NX * NX + NY * NY + nz * nz) + 1e-6
        lum = (NX * LIGHT[0] + NY * LIGHT[1] + nz * LIGHT[2]) / ln + bias
        s._put(mask, m, z, lum); return s

    def curve(s, pts, rad, m, z=0, bias=0, flat=0, sub=6):
        """制御点を通るなめらかな丸棒。rad は制御点ごとの半径（間は線形補間）。尾・首・触手・角など。"""
        P = catmull(pts, False, sub); n = len(pts)
        rad = [rad] * n if np.isscalar(rad) else list(rad); R = []
        for i in range(len(P)):
            t = i / sub; k = min(int(t), n - 2); f = t - k; R.append(rad[k] + (rad[k + 1] - rad[k]) * f)
        return s.tube(P, R, m, z, bias, flat)

    def shade(s, mask, gx=0.0, gy=0.0, ox=0, oy=0, k=0.0):
        """選択範囲に明暗の勾配を足す（下ほど暗く、など）。"""
        s.lum[mask] += ((s.X - ox) * gx + (s.Y - oy) * gy + k)[mask].astype(np.float32); return s

    def _polymask(s, pts):
        im = Image.new('L', (s.w, s.h), 0); ImageDraw.Draw(im).polygon([(float(x), float(y)) for x, y in pts], fill=1)
        return np.array(im, bool)

    def poly(s, pts, m, z=0, lum=0.5, grad=None, raw=False):
        """平面ポリゴン（布・翼膜・板）。grad=(gx,gy) で面内の明暗勾配。"""
        P = pts if raw else s.Tp(pts); mask = s._polymask(P)
        if not mask.any(): return s
        if grad:
            cx = sum(p[0] for p in P) / len(P); cy = sum(p[1] for p in P) / len(P)
            L = lum + (s.X - cx) * grad[0] + (s.Y - cy) * grad[1]
        else: L = lum
        s._put(mask, m, z, L); return s

    def blob(s, pts, m, z=0, depth=4, bias=0, smooth=True, sub=8, edge=1.0):
        """なめらかな閉曲線で囲んだ形を、縁から depth ドットぶん丸く盛り上げて陰影を付ける（胴体・筋肉・岩）。"""
        P = s.Tp(pts); P = catmull(P, True, sub) if smooth else P
        mask = s._polymask(P)
        if not mask.any(): return s
        R = max(1, depth * s.k); d = _dist_in(mask, int(math.ceil(R)))
        t = np.clip((d - 0.5) / R, 0, 1); hgt = R * np.sqrt(np.clip(1 - (1 - t) ** 2, 0, 1))
        hgt = _box3(hgt)
        gy, gx = np.gradient(hgt)
        nx, ny, nz = -gx * edge, -gy * edge, np.ones_like(gx)
        ln = np.sqrt(nx * nx + ny * ny + nz * nz)
        lum = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / ln + bias
        s._put(mask, m, z, lum); return s

    # ---------- 手置き ----------
    def px(s, x, y, m, lv=None, z=None, raw=False):
        """1ドット。lv=ランプ段（None なら最明）。z 省略時は既存の奥行きの手前。"""
        if not raw: x, y = s.T(x + 0.5, y + 0.5)
        else: x, y = x + 0.5, y + 0.5
        X, Y = int(math.floor(x)), int(math.floor(y))
        if 0 <= X < s.w and 0 <= Y < s.h:
            mi = s.mi[m]; lv = len(s.mats[mi]['cols']) - 1 if lv is None else lv
            zz = max(s.z[Y, X], -1e8) + 0.001 if z is None else z
            if zz >= s.z[Y, X]:
                s.m[Y, X] = mi; s.fix[Y, X] = lv; s.z[Y, X] = zz
                if s.pid[Y, X] == 0 or z is not None: s.pid[Y, X] = s.part_id
        return s

    def pxs(s, pts, m, lv=None, z=None):
        for x, y in pts: s.px(x, y, m, lv, z)
        return s

    def line(s, x0, y0, x1, y1, m, lv=None, z=None):
        (x0, y0), (x1, y1) = s.T(x0 + .5, y0 + .5), s.T(x1 + .5, y1 + .5)
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(n, 1); s.px(x0 + (x1 - x0) * t - .5, y0 + (y1 - y0) * t - .5, m, lv, z, raw=True)
        return s

    def path(s, pts, m, lv=None, z=None):
        for a, b in zip(pts, pts[1:]): s.line(a[0], a[1], b[0], b[1], m, lv, z)
        return s

    def stamp(s, x, y, rows, legend, z=None, flip=False):
        """手描きのドット列を置く。legend: 文字 → (素材, 段)。'.' と空白は透明。"""
        for j, row in enumerate(rows):
            if flip: row = row[::-1]
            for i, ch in enumerate(row):
                if ch in '. ': continue
                m, lv = legend[ch]; s.px(x + i, y + j, m, lv, z)
        return s

    def tone(s, x, y, d, only=None):
        """既にあるドットの明るさ段を d だけ変える（しわ・模様・ハイライト）。"""
        x, y = s.T(x + .5, y + .5); X, Y = int(math.floor(x)), int(math.floor(y))
        if 0 <= X < s.w and 0 <= Y < s.h and s.m[Y, X]:
            if only and s.m[Y, X] != s.mi[only]: return s
            n = len(s.mats[s.m[Y, X]]['cols'])
            cur = s.fix[Y, X] if s.fix[Y, X] >= 0 else s._level_at(Y, X)
            s.fix[Y, X] = max(0, min(n - 1, cur + d))
        return s

    def stroke(s, pts, d, only=None, smooth=False):
        """折れ線に沿って既存ドットの段を変える（筋肉の溝・布の折れ目・毛の流れ）。"""
        P = catmull(pts, False, 6) if smooth else pts
        seen = set()
        for (x0, y0), (x1, y1) in zip(P, P[1:]):
            n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
            for i in range(n + 1):
                t = i / max(n, 1); x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
                k = (int(math.floor(x)), int(math.floor(y)))
                if k in seen: continue
                seen.add(k); s.tone(k[0], k[1], d, only)
        return s

    def _level_at(s, Y, X):
        mt = s.mats[s.m[Y, X]]; return int(np.sum(s.lum[Y, X] > np.array(mt['th'])))

    # ---------- 選択と質感 ----------
    def sel(s, m=None, part=None, box=None):
        k = s.m > 0
        if m is not None:
            ms = [m] if isinstance(m, str) else m; k &= np.isin(s.m, [s.mi[x] for x in ms])
        if part is not None:
            ps = [part] if isinstance(part, str) else part; k &= np.isin(s.pid, [s.part_names.get(x, -1) for x in ps])
        if box is not None:
            x0, y0, x1, y1 = box; k &= (s.X >= x0) & (s.X <= x1 + 1) & (s.Y >= y0) & (s.Y <= y1 + 1)
        return k & (s.fix < 0)

    def tex_scales(s, mask, sx=5, sy=4, amp=0.34, ang=0, ox=0, oy=0):
        """鱗：半段ずらしの列。各鱗の下縁を暗く、左上を明るく。"""
        a = math.radians(ang); ca, sa = math.cos(a), math.sin(a)
        U = (s.X - ox) * ca + (s.Y - oy) * sa; V = -(s.X - ox) * sa + (s.Y - oy) * ca
        row = np.floor(V / sy); u = (U / sx + (row % 2) * 0.5) % 1.0 - 0.5; v = (V / sy) % 1.0
        r = np.sqrt((u * 1.9) ** 2 + (v - 0.05) ** 2)
        d = np.where(r > 0.86, -amp * 1.25, np.where((u < -0.05) & (v < 0.5), amp * 0.8, 0.0))
        s.lum[mask] += d[mask].astype(np.float32); return s

    def tex_bands(s, mask, period=4, amp=0.3, ang=0, duty=0.34, ox=0, oy=0, wob=0.0):
        """帯模様（腹の蛇腹・木目・縞）。"""
        a = math.radians(ang); V = -(s.X - ox) * math.sin(a) + (s.Y - oy) * math.cos(a)
        if wob: V = V + np.sin(((s.X - ox) * math.cos(a) + (s.Y - oy) * math.sin(a)) * 0.7) * wob
        v = (V / period) % 1.0
        s.lum[mask] += np.where(v < duty, -amp, 0)[mask].astype(np.float32); return s

    def tex_noise(s, mask, amp=0.25, seed=1, cell=1):
        """ざらつき（岩・毛並み・苔）。乱数の種は固定で、毎回同じ絵になる。"""
        rng = np.random.default_rng(seed); n = rng.random((s.h // cell + 2, s.w // cell + 2)).astype(np.float32)
        nn = np.kron(n, np.ones((cell, cell), np.float32))[:s.h, :s.w]
        s.lum[mask] += ((nn - 0.5) * 2 * amp)[mask]; return s

    def tex_fur(s, mask, amp=0.28, ang=20, length=4, seed=3):
        """毛並み：流れ方向に伸びた筋。"""
        rng = np.random.default_rng(seed); a = math.radians(ang)
        U = s.X * math.cos(a) + s.Y * math.sin(a); V = -s.X * math.sin(a) + s.Y * math.cos(a)
        iu = np.floor(U / length + (np.floor(V) % 3) * 0.37).astype(int) % 61; iv = np.floor(V).astype(int) % 53
        tb = rng.random((53, 61)).astype(np.float32)
        s.lum[mask] += ((tb[iv, iu] - 0.5) * 2 * amp)[mask]; return s

    def rim(s, mask, lit=0.3, shade=0.3):
        """形の左上の縁を 1 ドット明るく、右下の縁を暗く（硬い素材のエッジ）。"""
        p = np.pad(mask, 1)
        ul = mask & ~(p[:-2, 1:-1] & p[1:-1, :-2]); dr = mask & ~(p[2:, 1:-1] & p[1:-1, 2:])
        s.lum[ul] += lit; s.lum[dr & ~ul] -= shade; return s

    def darken(s, mask, d): s.lum[mask] -= d; return s

    # ---------- 仕上げ ----------
    def levels(s):
        lv = np.zeros((s.h, s.w), np.int8)
        for i, mt in enumerate(s.mats):
            if not mt: continue
            k = s.m == i
            if not k.any(): continue
            n = len(mt['cols']); th = np.array(mt['th'], np.float32)
            l = np.sum(s.lum[..., None] > th[None, None, :], axis=2).astype(np.int8)
            if mt['spec']:
                t, top = mt['spec']; l = np.where(s.lum > t, top, l)
            lv[k] = np.clip(l, 0, n - 1)[k]
        f = s.fix >= 0; lv[f] = s.fix[f]
        return lv

    def render(s, outline=True, sep=True, ao=True, sep_gap=0.5):
        """→ (index配列[h,w] 0=透明, パレット[hex...])"""
        m, z = s.m, s.z; solid = m > 0
        glow = np.zeros((s.h, s.w), bool)
        for i, mt in enumerate(s.mats):
            if mt and mt['glow']: glow |= (m == i)
        if ao:   # 左上にある手前のパーツが落とす影（1ドット）
            pz = np.pad(z, 1, constant_values=-1e9); pp = np.pad(s.pid, 1)
            for dy, dx in ((0, 1), (1, 0)):
                nz = pz[1 - dy:1 - dy + s.h, 1 - dx:1 - dx + s.w]; npid = pp[1 - dy:1 - dy + s.h, 1 - dx:1 - dx + s.w]
                k = solid & (nz > z + 0.5) & (npid != s.pid) & (s.fix < 0)
                s.lum[k] -= 0.30
        lv = s.levels()
        if sep:  # パーツの重なり：奥側の境目を最暗色に
            pz = np.pad(z, 1, constant_values=-1e9); pp = np.pad(s.pid, 1); pg = np.pad(glow, 1)
            edge = np.zeros_like(solid)
            for dy, dx in ((0, 1), (1, 0), (2, 1), (1, 2)):
                nz = pz[dy:dy + s.h, dx:dx + s.w]; npid = pp[dy:dy + s.h, dx:dx + s.w]; ng = pg[dy:dy + s.h, dx:dx + s.w]
                edge |= solid & (nz > z + sep_gap) & (npid != s.pid) & ~ng
            edge &= ~glow
            lv[edge] = 0
        # パレット
        pal = []; pidx = {}
        def cid(c):
            if c not in pidx: pidx[c] = len(pal) + 1; pal.append(c)
            return pidx[c]
        idx = np.zeros((s.h, s.w), np.uint8); slots = {}; glows = []
        for i, mt in enumerate(s.mats):
            if not mt: continue
            k = m == i
            if not k.any(): continue
            ids = np.array([cid(c) for c in mt['cols']], np.uint8)
            idx[k] = ids[lv[k]]
            if mt['slot']: slots.setdefault(mt['slot'], [])
            if mt['slot']:
                for c in ids:
                    if int(c) not in slots[mt['slot']]: slots[mt['slot']].append(int(c))
            if mt['glow']:
                for c in ids:
                    if int(c) not in glows: glows.append(int(c))
        if outline:
            p = np.pad(solid & ~glow, 1)
            near = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
            o = near & ~solid
            idx[o] = cid(OUT)
        s.pal = pal; s.slots = slots; s.glows = glows; s.idx = idx
        return idx, pal

    def image(s, **kw):
        kw.setdefault('sep_gap', s.sep_gap); idx, pal = s.render(**kw)
        lut = np.zeros((len(pal) + 1, 4), np.uint8)
        for i, c in enumerate(pal): lut[i + 1] = (*hex2rgb(c), 255)
        return Image.fromarray(lut[idx], 'RGBA')


def to_image(idx, pal):
    lut = np.zeros((len(pal) + 1, 4), np.uint8)
    for i, c in enumerate(pal): lut[i + 1] = (*hex2rgb(c), 255)
    return Image.fromarray(lut[idx], 'RGBA')
