"""共通の部品（毛の房・爪・牙・目など）。下地の形づくり用。要所はスプライト側で手置きする。"""
import math
from core import Cv, catmull, ramp, mix, OUT

def spikes(c, pts, length, width, m, z=0, every=3, lean=0.0, lum=0.5, jitter=(1.0, 0.7, 1.2, 0.85), side=1, start=0):
    """折れ線の片側に三角の房／とげを並べる（毛並みのギザ輪郭、背びれ、たてがみ）。"""
    P = catmull(pts, False, 6); acc = 0; k = start
    for (x0, y0), (x1, y1) in zip(P, P[1:]):
        dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy)
        if L < 1e-6: continue
        acc += L
        if acc >= every:
            acc = 0; nx, ny = -dy / L * side, dx / L * side; tx, ty = dx / L, dy / L
            ln = length * jitter[k % len(jitter)]; k += 1
            tip = (x0 + nx * ln + tx * lean * ln, y0 + ny * ln + ty * lean * ln)
            c.poly([(x0 - tx * width / 2, y0 - ty * width / 2), tip, (x0 + tx * width / 2, y0 + ty * width / 2)], m, z, lum=lum)
    return c

def claw(c, x, y, dx, dy, m='bone', ln=3, z=None):
    """爪1本：付け根から先へ明→最明。"""
    n = c.mats[c.mi[m]]['cols']; top = len(n) - 1
    for i in range(ln):
        c.px(round(x + dx * i), round(y + dy * i), m, top if i == ln - 1 else max(0, top - 1), z)
    return c

def fangs(c, x, y, n, step=2, ln=2, m='bone', up=False, z=None):
    """牙の列。"""
    top = len(c.mats[c.mi[m]]['cols']) - 1
    for i in range(n):
        for k in range(ln if i % 2 == 0 else max(1, ln - 1)):
            c.px(x + i * step, y + (-k if up else k), m, top if k == 0 else top - 1, z)
    return c

def eye(c, x, y, m='eye', w=2, h=2, pupil=None, z=None):
    """光る目：明色の塊＋最明の1点。"""
    top = len(c.mats[c.mi[m]]['cols']) - 1
    for j in range(h):
        for i in range(w): c.px(x + i, y + j, m, max(0, top - 1), z)
    c.px(x, y, m, top, z)
    if pupil: c.px(x + pupil[0], y + pupil[1], 'ink', 0, z)
    return c
