"""TD デモ 案2「HD 版（高さ約 100px）」― セレスの動きと技の演出。tdcore が使う名前と引数は style0.py の説明どおり。

方針（TD 向け）
  ゲームを止めない：画面全体の暗転なし。終焉の針だけ「セレスと着弾点のまわり」を短く暗くし、0.5 秒以内の細い帯のカットイン、
                    0.3 倍の遅回しは針が落ちる直前の 0.3 秒だけ。
  短く：通常攻撃 0.4 秒・刻の矢 1.0 秒・クロノスロウの詠唱 0.9 秒（陣は 6 秒残る）・終焉の針 2.0 秒。
  読める：狙いの印（足元の縮む輪＋頭上の金の山形）・範囲の輪（地面の横長の楕円）・遅くなった敵の頭上に小さな時計。数字は小さく、群れはずらして出す。
  案2 らしさ：等倍の HD のドット絵を「補間でぼかさず」ドットを動かして演技させる（行を抜く呼吸・頭と胴のブロックずらし・杖を掲げるコマ・
             反動・小さな跳び・紫の残像・宝石を 1 段明るく）。光は加算とにじみの細い線と粒で上品に、TD の大きさに縮める。
  まとまり：紫（主）・金（時計と星）・青（宝石＝溜め）・白（芯）。部品は「時計の刻印・星の閃光・時の欠片」。
"""
import math

import numpy as np

import fxcore as X
import tdcore as C
from fxcore import CYAN, DEEP, GOLD, VIO, WHITE, blob, burst, clamp, ein, eout, line, oval, poly, ring, seg, star, taper

LABEL = '案2 HD'
NAMES = {'tokiya': '刻の矢', 'slow': 'クロノスロウ', 'shuuen': '終焉の針'}
LILAC = np.array([.80, .62, 1.0], np.float32)
COL = {'gold': GOLD, 'vio': VIO, 'cyan': CYAN, 'sand': LILAC, 'death': LILAC}
TAIL = .6

# 時刻（技の始まりからの秒）
AT_HIT = .26                      # 通常攻撃：命中
AT_FIRE = .10                     # 通常攻撃：放つ
TK_FIRE = (.28, .40, .54)         # 刻の矢：3 本を放つ
TK_FLY = .14
SL_LAND = .45                     # クロノスロウ：光が落ちて陣が開く
SH_FALL, SH_HIT = 1.18, 1.30      # 終焉の針：針が落ち始める・着弾
SKY_Y, SKY_R = 132, 64            # 空の大時計
WORLD_SLOW = (SH_HIT - .3, SH_HIT, .3)

ACT = {
    'attack': dict(dur=.4, hits=[(AT_HIT, 'single', dict(dmg=540, col='cyan', kb=6))]),
    'tokiya': dict(dur=1.0, hits=[(f + TK_FLY, 'single', dict(dmg=2600, col='vio', crit=k == 2, kb=22 if k == 2 else 8))
                                  for k, f in enumerate(TK_FIRE)]),
    'slow': dict(dur=.9, zone=dict(at=SL_LAND, r=150, f=.3, dur=6.0), hits=[(SL_LAND, 'aoe', dict(dmg=300, col='sand', r=150))]),
    'shuuen': dict(dur=2.0, aoe=dict(r=190), hits=[(SH_HIT, 'aoe', dict(dmg=6000, col='gold', crit=True, kb=60, r=190))]),
}

# ================================================================== セレスの絵（ドットを動かす）
BASE = {k: np.asarray(v).astype(np.float32) / 255 for k, v in X.CEL_N.items()}
OX, OY = C.CEL_X - 40, C.CEL_FOOT - 102          # 等倍のキャンバスの左上


def _orb_mask(a):
    c = (a * 255).astype(int)
    return (c[..., 3] > 0) & (c[..., 2] > 190) & (c[..., 0] < 150) & (c[..., 1] > 110)


ORBM = {k: _orb_mask(BASE[k]) for k in ('side', 'ready', 'front')}


def _staff_mask():
    """side の杖の上半分（宝石の輪と手より上の柄）"""
    a = BASE['side']
    m = np.zeros(a.shape[:2], bool)
    for y in range(0, 44):
        m[y, :(21 if y < 18 else 24)] = True
    return m & (a[..., 3] > 0)


_STAFF = _staff_mask()
_CACHE = {}


def cast_pose(k):
    """杖を k ドット掲げた詠唱のコマ（手より上の杖を持ち上げ、手の位置の柄を伸ばす）"""
    k = int(k)
    if k <= 0:
        return BASE['side'], ORBM['side']
    if ('cast', k) in _CACHE:
        return _CACHE[('cast', k)]
    a = BASE['side'].copy()
    m = _STAFF
    a[m] = 0
    src = BASE['side']
    ys, xs = np.where(m)
    a[ys - k, xs] = src[ys, xs]
    # 手の上の隙間を柄で埋める（43 行目の柄をくり返す）
    row = np.where(m[43])[0]
    for y in range(43 - k + 1, 44):
        a[y, row] = src[43, row]
    om = np.zeros_like(ORBM['side'])
    oy, ox = np.where(ORBM['side'])
    om[oy - k, ox] = True
    _CACHE[('cast', k)] = (a, om)
    return a, om


def bend(a, dh, dt):
    """頭（0〜40 行）を dh、胴（40〜66 行）を dt ドット横へずらす（＋は後ろ＝右）"""
    if dh == 0 and dt == 0:
        return a
    b = a.copy()
    for (y0, y1, d) in ((0, 40, dh), (40, 66, dt)):
        if d:
            b[y0:y1] = 0
            if d > 0:
                b[y0:y1, d:] = a[y0:y1, :-d]
            else:
                b[y0:y1, :d] = a[y0:y1, -d:]
    return b


def sink(a, n, row=60):
    """row の行を n 行抜いて上半身を沈める（呼吸・着地の沈み）"""
    if n <= 0:
        return a
    b = np.zeros_like(a)
    b[row:] = a[row:]
    b[n:row] = a[:row - n]
    return b


def acts_at(sim, t, pad=.15):
    return [a for a in sim.actions if a['t0'] <= t < a['t0'] + a['dur'] + pad]


def hstate(t, sim):
    """そのときのセレスの姿：pose・ずれ・反りなど"""
    s = dict(pose='side', cast=0, dx=0.0, dy=0.0, dh=0, dt=0, sink=1 if (t % 1.7) > .85 else 0, charge=0.0, ghosts=[])
    s['charge'] = .25 * max(0.0, math.sin(t * 2.2)) ** 6       # 待機：宝石がときどき光る
    for a in acts_at(sim, t):
        u = t - a['t0']
        n = a['name']
        s['sink'] = 0
        if n == 'attack':
            if u < AT_FIRE - .02:                                # 溜め：のけぞる
                s.update(dh=1, charge=u / .08)
            elif u < .3:                                         # 突き：構えのコマ・半歩前へ
                s.update(pose='ready', dx=-2 * (1 - seg(u, .2, .3)), dh=-1 if u < .2 else 0, charge=1 - seg(u, .1, .25))
                if u < .17:
                    s['ghosts'] = [(4, 0, .35 * (1 - seg(u, .08, .17)))]
        elif n == 'tokiya':
            if u < TK_FIRE[0]:                                   # 杖を掲げる
                s.update(cast=min(4, int(u / .04)), dh=1, dt=1 if u > .1 else 0, charge=seg(u, 0, .25))
            elif u < .78:                                        # 3 連射：構え・1 本ごとに反動
                rec = sum(3 * math.exp(-(u - f) * 22) for f in TK_FIRE if u >= f)
                s.update(pose='ready', dx=rec, dh=-1, charge=.6)
                for f in TK_FIRE:
                    if 0 <= u - f < .07:
                        s['ghosts'] = [(-5, 0, .4 * (1 - (u - f) / .07))]
            else:
                s.update(sink=1 if u < .86 else 0)
        elif n == 'slow':
            if u < .55:                                          # 杖を高く掲げて詠唱（目を伏せる代わりに頭を下げる）
                k = min(6, int(u / .03))
                s.update(cast=k, dh=1 if u < .2 else 0, dt=0, dy=-seg(u, .1, .3) * 2 + seg(u, .4, .5) * 2,
                         charge=seg(u, 0, .3) * (1 - seg(u, SL_LAND, .55)) * 1.2)
                if SL_LAND <= u < .55:
                    s['sink'] = 1
            elif u < .7:
                s.update(cast=max(0, 6 - int((u - .55) / .025)))
        elif n == 'shuuen':
            if u < .12:                                          # しゃがむ
                s.update(sink=int(1 + 2 * seg(u, 0, .08)), charge=u / .12)
            elif u < SH_FALL:                                    # 跳んで空に浮く（杖を掲げる）
                h = 12 * eout(seg(u, .12, .3)) + math.sin((u - .3) * 7) * (1 if u > .3 else 0)
                s.update(cast=min(6, int((u - .12) / .03)), dy=-h, dh=1 if u < .5 else 0, charge=1.0)
                if u < .3:
                    s['ghosts'] = [(0, 6 * j, .3 / j) for j in (1, 2)]
            elif u < SH_HIT + .1:                                # 杖を突き下ろす
                s.update(pose='ready', dy=-12 + 6 * eout(seg(u, SH_FALL, SH_HIT)), dx=-2, dh=-2, dt=-1, charge=1.0)
                s['ghosts'] = [(3, -4, .35)]
            elif u < 1.62:                                       # 降りて着地の沈み
                v = seg(u, SH_HIT + .1, 1.45)
                s.update(pose='ready', dy=-6 * (1 - ein(v, 2)), dx=-2 * (1 - v), sink=2 if 1.45 <= u < 1.53 else (1 if u >= 1.53 else 0))
    return s


def sprite_of(s):
    if s['pose'] == 'side':
        a, om = cast_pose(s['cast'])
    else:
        a, om = BASE[s['pose']], ORBM[s['pose']]
    a = bend(a, s['dh'], s['dt'])
    a = sink(a, s['sink'])
    if s['charge'] > 0:                                          # 宝石を 1 段明るく（溜め）
        om2 = bend(om[..., None].astype(np.float32), s['dh'], 0)[..., 0] > .5
        om2 = sink(om2[..., None].astype(np.float32), s['sink'])[..., 0] > .5
        a = a.copy()
        a[om2, :3] = np.clip(a[om2, :3] * (1 + .5 * s['charge']) + CYAN * .25 * s['charge'], 0, 1)
    return a


def orb_pos(s):
    """宝石の画面上の位置"""
    if s['pose'] == 'side':
        px, py = X.ORB['side']
        py -= s['cast']
    else:
        px, py = X.ORB[s['pose']]
    px += s['dh']
    if py < 60:
        py += s['sink']
    return OX + s['dx'] + px + .5, OY + s['dy'] + py + .5


def orb_at(t, sim):
    return orb_pos(hstate(t, sim))


def hero(img, t, sim, fi):
    s = hstate(t, sim)
    a = sprite_of(s)
    x0, y0 = OX + s['dx'], OY + s['dy']
    if s['dy'] < -1:                                             # 浮いている間の影
        X.shadow(img, C.CEL_X + 4, C.CEL_FOOT, 26 + s['dy'] * .6, .3)
    for (gx, gy, ga) in s['ghosts']:                             # 紫の残像
        X.paste(img, a, x0 + gx, y0 + gy, alpha=ga, tint=VIO, tk=1.0)
    X.paste(img, a, x0, y0)
    ox, oy = orb_pos(s)
    if s['charge'] > .05:
        blob(img, ox, oy, 3 + 3 * s['charge'], CYAN, .22 * s['charge'])
    tw = (t + .3) % 2.6                                          # 待機のきらめき
    if tw < .22 and not acts_at(sim, t):
        star(img, ox - 2, oy - 3, 7 * math.sin(tw / .22 * math.pi), WHITE, .45, rot=.2)


# ================================================================== 共通の部品
def target_mark(L, sim, e, fi, k, t, col=CYAN):
    """狙いの印：足元の縮む輪＋頭上の金の山形"""
    if e is None or k <= 0:
        return
    x, foot = sim.epos(e, fi, 'foot')
    if np.isnan(x):
        return
    w, h = sim.size(e['kind'])
    r = w * .45 + 14 * (1 - eout(k / .25 if k < .25 else 1)) + 1.5 * math.sin(t * 18)
    ring(L, x, foot + 1, r, r * .26, 2, col, .9)
    ring(L, x, foot + 1, r * .55, r * .55 * .26, 1, VIO, .6)
    yy = foot - h - 18 - 3 * abs(math.sin(t * 6))
    poly(L, [(x - 6, yy - 5), (x, yy + 2), (x + 6, yy - 5), (x, yy - 2)], GOLD, .9)


def shard_bolt(L, x, y, ang, ln, a=1.0, col=VIO):
    """時の欠片の弾：白い芯の菱形＋細い尾"""
    c, s = math.cos(ang), math.sin(ang)
    taper(L, [(x - c * ln, y - s * ln), (x, y)], .5, 5, col, .7 * a)
    taper(L, [(x - c * ln * .6, y - s * ln * .6), (x, y)], .3, 2, WHITE, a)
    poly(L, [(x + c * 7, y + s * 7), (x - s * 3, y + c * 3), (x - c * 4, y - s * 4), (x + s * 3, y - c * 3)], WHITE, a)
    blob(L, x, y, 4, col, .6 * a)


def hand_arrow(L, x, y, ang, ln, a=1.0):
    """時計の針の矢（小さく）：細る金の軸・白い芯・スペードの穂先・尾の輪"""
    c, s = math.cos(ang), math.sin(ang)
    tx, ty = x - c * ln, y - s * ln
    taper(L, [(tx, ty), (x, y)], 1.5, 4, GOLD, a)
    taper(L, [(tx, ty), (x, y)], .5, 1.6, WHITE, a)
    ring(L, tx, ty, 3, 3, 1.2, GOLD, a)
    hx, hy = x - c * 3, y - s * 3
    poly(L, [(x + c * 9, y + s * 9), (hx - s * 5, hy + c * 5), (x - c * 5, y - s * 5), (hx + s * 5, hy - c * 5)], GOLD, a)
    poly(L, [(x + c * 6, y + s * 6), (hx - s * 2, hy + c * 2), (x - c * 2, y - s * 2), (hx + s * 2, hy - c * 2)], WHITE, a)


def pop(L, x, y, age, s, seed, col=VIO, sub=GOLD):
    """命中：白い芯のはじけ → 星の閃光 → 短い放射 → 細い輪 → 時の欠片・火花（TD の大きさ）"""
    if age < 0 or age > .6:
        return
    blob(L, x, y, 7 * s, WHITE, 1.8 * (1 - seg(age, 0, .1)))
    star(L, x, y, 26 * s * (.6 + .4 * eout(age / .06)), WHITE, 1.1 * (1 - seg(age, .03, .2)), rot=.3 + age, sub=sub)
    rng = np.random.default_rng(seed)
    for i in range(6):
        th = rng.uniform(0, 6.28)
        ln = rng.uniform(14, 28) * s * eout(age / .08)
        taper(L, [(x + math.cos(th) * 5 * s, y + math.sin(th) * 5 * s), (x + math.cos(th) * ln, y + math.sin(th) * ln)],
              2.2 * s, .3, col if i % 2 else sub, 1 - seg(age, .03, .18))
    rr = 22 * s * eout(age / .2)
    ring(L, x, y, rr, rr * .9, 1.5, WHITE, .9 * (1 - seg(age, .05, .25)))
    burst(L, x, y, age, int(7 * s) + 2, seed + 1, sp=170 * s, life=.32, col=sub, kind='spark', grav=300, lenk=.03, size=(1.2, 2))
    burst(L, x, y, age, int(4 * s) + 2, seed + 2, sp=110 * s, life=.5, col=col, kind='shard', grav=240, size=(1.5, 2.6))


def dim_patch(img, pts, k):
    """セレスと的のまわりだけを短く暗くする（画面全体は暗くしない）"""
    if k <= 0:
        return img
    m = np.zeros((C.H, C.W), np.float32)
    yy, xx = np.mgrid[0:C.H:4, 0:C.W:4].astype(np.float32)
    mm = np.zeros_like(yy)
    for (x, y, rx, ry) in pts:
        mm = np.maximum(mm, np.exp(-(((xx - x) / rx) ** 2 + ((yy - y) / ry) ** 2)))
    m = np.repeat(np.repeat(mm, 4, 0), 4, 1)[:C.H, :C.W]
    return img * (1 - .42 * k * m[..., None])


# ================================================================== 技の光
def fx_ground(Lg, t, act, sim, fi):
    u = t - act['t0']
    n = act['name']
    if n in ('tokiya', 'slow', 'shuuen'):                       # 足元の小さな刻印（詠唱の間）
        t1 = {'tokiya': .8, 'slow': .6, 'shuuen': 1.5}[n]
        if u < t1 + .25:
            k = seg(u, 0, .2)
            a = (1 - seg(u, t1, t1 + .25)) * .75
            r = 2 + 32 * eout(k) + (8 if n == 'shuuen' else 0)
            X.clock(Lg, C.CEL_X + 2, C.CEL_FOOT + 2, r, k, t, GOLD, VIO, a, ry=r * .24, h1=u * 3, h2=u * 14, stars=12, w=1.5)
    if n == 'shuuen' and act['aim'] is not None:
        x = act['aim']
        if .25 <= u < SH_HIT:                                    # 範囲の輪（横長の楕円・内側の目盛り）
            k = eout(seg(u, .25, .45))
            p = .7 + .3 * math.sin(u * 16)
            r = 190 * k
            ring(Lg, x, C.GROUND + 4, r, r * .2, 2, GOLD, .8 * p)
            ring(Lg, x, C.GROUND + 4, r * .93, r * .93 * .2, 1, VIO, .7)
            oval(Lg, x, C.GROUND + 4, r, r * .2, DEEP, .25 * seg(u, .9, SH_HIT), soft=.9)
            for i in range(24):
                th = i / 24 * 2 * math.pi + u * .8
                c, s = math.cos(th), math.sin(th)
                line(Lg, (x + c * r * .93, C.GROUND + 4 + s * r * .2 * .93), (x + c * r * .86, C.GROUND + 4 + s * r * .2 * .86),
                     1.2, GOLD, .6 * k)
        if SH_HIT <= u < SH_HIT + .8:                            # 着弾：地面を渡る衝撃の輪
            v = u - SH_HIT
            rr = 40 + 200 * eout(v / .35)
            ring(Lg, x, C.GROUND + 4, rr, rr * .2, 3, WHITE, 1.2 * (1 - seg(v, .1, .4)))
            ring(Lg, x, C.GROUND + 4, rr * .85, rr * .85 * .2, 8, VIO, .7 * (1 - seg(v, .1, .6)))
            oval(Lg, x, C.GROUND + 4, 90 * eout(v / .1), 16 * eout(v / .1), GOLD, .5 * (1 - seg(v, .05, .5)), soft=.8)


def fx_front(Lf, t, act, sim, fi):
    u = t - act['t0']
    n = act['name']
    tgt = sim.enemies[act['target']] if act['target'] is not None else None
    # 命中の光（技ごとに大きさを変える）
    for (ht, kind, ids, prm) in act['hits']:
        age = t - ht
        if not (0 <= age < .6):
            continue
        for j, i in enumerate(ids):
            e = sim.enemies[i]
            x, y = sim.epos(e, fi)
            if np.isnan(x):
                continue
            if n == 'attack':
                pop(Lf, x + 4, y, age, .7, i * 13 + int(ht * 60), CYAN, VIO)
            elif n == 'tokiya':
                pop(Lf, x + 2, y, age, 1.25 if prm.get('crit') else .9, i * 7 + int(ht * 60), VIO, GOLD)
            elif n == 'slow':
                pop(Lf, x, y, age - j * .02, .45, i * 5 + 3, VIO, GOLD)
            else:
                pop(Lf, x, y, age - abs(x - (act['aim'] or x)) / 900, .55, i * 3 + 11, VIO, GOLD)
    ox, oy = orb_at(t, sim)
    if n == 'attack':
        if tgt is not None:
            target_mark(Lf, sim, tgt, fi, u, t) if u < .32 else None
            if u < AT_FIRE + .05:
                star(Lf, ox, oy, 6 + 10 * seg(u, 0, AT_FIRE), CYAN, .8, rot=u * 4)
            v = (u - AT_FIRE) / (AT_HIT - AT_FIRE)
            if 0 <= v < 1:
                x0, y0 = orb_at(act['t0'] + AT_FIRE, sim)
                tx, ty = sim.epos(tgt, fi)
                if not np.isnan(tx):
                    w = ein(v, 1.4)
                    px, py = x0 + (tx - x0) * w, y0 + (ty - y0) * w - 18 * math.sin(v * math.pi)
                    ang = math.atan2(ty - y0 - 18 * math.cos(v * math.pi) * math.pi * .3, tx - x0)
                    shard_bolt(Lf, px, py, ang, 22 + 18 * v, 1.0, VIO)
    elif n == 'tokiya':
        if tgt is not None and u < .95:
            target_mark(Lf, sim, tgt, fi, u, t, CYAN)
        if u < .65:                                              # 宝石のまわりの縦の刻印と、回る 3 本の針
            k = seg(u, 0, .15)
            X.clock(Lf, ox, oy, 13, k, t, GOLD, VIO, .45 * (1 - seg(u, .55, .65)), h1=u * 4, h2=u * 20, stars=12, lit=12, w=1.2)
        for i, f in enumerate(TK_FIRE):
            app = .06 + i * .05
            if app <= u < f:                                     # 待機：宝石のまわりを回る
                th = u * 14 + i * 2.09
                r = 22 * eout((u - app) / .08)
                hand_arrow(Lf, ox + math.cos(th) * r, oy + math.sin(th) * r * .7, th + math.pi / 2, 12, .9)
            if tgt is not None and f <= u < f + TK_FLY:          # 飛ぶ：弓なりに
                tx, ty = sim.epos(tgt, fi)
                if np.isnan(tx):
                    continue
                x0, y0 = orb_at(act['t0'] + f, sim)
                bendy = (-34, 28, -8)[i]
                v = ein((u - f) / TK_FLY, 1.5)
                v2 = max(0, v - .08)
                px, py = x0 + (tx - x0) * v, y0 + (ty + (i - 1) * 8 - y0) * v + bendy * math.sin(v * math.pi)
                qx, qy = x0 + (tx - x0) * v2, y0 + (ty + (i - 1) * 8 - y0) * v2 + bendy * math.sin(v2 * math.pi)
                ang = math.atan2(py - qy, px - qx)
                line(Lf, (qx, qy), (px, py), 1.5, LILAC, .6)
                hand_arrow(Lf, px, py, ang, 16, 1.0)
                if u - f < .05:
                    star(Lf, x0, y0, 16, WHITE, .9 * (1 - (u - f) / .05), rot=.4)
        if tgt is not None and TK_FIRE[2] + TK_FLY <= u < 1.15:  # 3 本目の後：的の身に刻印が回って消える
            tx, ty = sim.epos(tgt, fi)
            if not np.isnan(tx):
                v = u - TK_FIRE[2] - TK_FLY
                r = 16 + 14 * eout(v / .4)
                X.clock(Lf, tx, ty, r, 1.0, t, GOLD, VIO, .9 * (1 - seg(v, .2, .45)), h1=-v * 10, h2=v * 40, stars=12, w=1.2)
    elif n == 'slow':
        if u < SL_LAND + .05:                                    # 宝石の小さな刻印（逆回り）
            X.clock(Lf, ox, oy, 12, seg(u, 0, .12), t, GOLD, VIO, .5 * (1 - seg(u, SL_LAND - .05, SL_LAND + .05)),
                    h1=-u * 6, h2=-u * 24, stars=12, w=1.2)
        if act['aim'] is not None and .12 <= u < SL_LAND:        # 光の玉が弧を描いて陣の中心へ落ちる
            x0, y0 = orb_at(act['t0'] + .12, sim)
            ax, ay = act['aim'], C.GROUND + 2
            for j in range(6):
                v = clamp((u - .12) / (SL_LAND - .12) - j * .03)
                px = x0 + (ax - x0) * v
                py = y0 + (ay - y0) * v * v - 90 * math.sin(v * math.pi)
                if j == 0:
                    blob(Lf, px, py, 5, VIO, 1.0)
                    blob(Lf, px, py, 2.2, WHITE, 1.6)
                    star(Lf, px, py, 12, GOLD, .7, rot=u * 6)
                else:
                    blob(Lf, px, py, 2.4 - j * .3, GOLD, .5 - j * .07)
    elif n == 'shuuen':
        aim = act['aim']
        if u < 1.0:                                              # 宝石へ集まる星の粒
            rng = np.random.default_rng(5)
            for j in range(18):
                ph = (u * 1.6 + rng.random()) % 1
                if u < .15 and ph > u / .15:
                    continue
                th = rng.uniform(0, 6.28)
                r = 60 * (1 - ph) ** 1.5
                blob(Lf, ox + math.cos(th) * r, oy + math.sin(th) * r, 1.4, GOLD if j % 3 else CYAN, ph * 1.2)
        if aim is not None:
            sky(Lf, aim, u, t)
        if aim is not None and SH_HIT <= u < SH_HIT + .7:        # 着弾：光の柱・星の閃光・時の欠片が噴き上がる
            v = u - SH_HIT
            x, y = aim, C.GROUND
            col_a = 1 - seg(v, .08, .35)
            taper(Lf, [(x, y), (x, y - 260)], 34 * (1 - .5 * seg(v, 0, .3)), 4, GOLD, .7 * col_a)
            taper(Lf, [(x, y), (x, y - 240)], 12 * (1 - .6 * seg(v, 0, .3)), 1, WHITE, 1.2 * col_a)
            blob(Lf, x, y - 10, 20, WHITE, 1.1 * (1 - seg(v, 0, .12)))
            star(Lf, x, y - 14, 80 * (.6 + .4 * eout(v / .06)), WHITE, 1.0 * (1 - seg(v, .03, .3)), rot=.2, sub=GOLD)
            burst(Lf, x, y - 6, v, 34, 71, sp=420, life=.6, col=GOLD, kind='spark', grav=500, lenk=.035, size=(1.5, 2.5),
                  a0=190, a1=350)
            burst(Lf, x, y - 10, v, 22, 72, sp=260, life=.8, col=VIO, kind='shard', grav=320, size=(2, 4), a0=200, a1=340)
            burst(Lf, x, y - 10, v, 18, 73, sp=140, life=.9, col=LILAC, kind='ember', grav=-30, size=(1.2, 2.2))


def sky(Lf, aim, u, t):
    """終焉の針：空の大時計 → 長針が剣のように落ちる → 砕けて星が降る"""
    cx, cy = aim, SKY_Y
    if .3 <= u < SH_HIT + .05:
        k = seg(u, .3, .55)
        lit = int(12 * seg(u, .45, .95))
        spin = (u - .3) * 10 * (1 - seg(u, .85, 1.1)) + (u - .3)
        h1 = math.pi
        h2 = math.pi + spin * (1 - ease_snap(u))
        a = .95 * (1 - seg(u, SH_HIT, SH_HIT + .05))
        blob(Lf, cx, cy, SKY_R * .9, DEEP, .35 * k)
        X.clock(Lf, cx, cy, SKY_R, k, t, GOLD, VIO, a, hands=u < SH_FALL, h1=h1, h2=h2, stars=12, lit=lit, w=2)
        if lit and u < SH_FALL:                                  # 星座の線（灯った星を結ぶ）
            pts = [(cx + math.cos(-math.pi / 2 + i / 12 * 2 * math.pi) * SKY_R * .97,
                    cy + math.sin(-math.pi / 2 + i / 12 * 2 * math.pi) * SKY_R * .97) for i in range(lit)]
            for p, q in zip(pts[:-1], pts[1:]):
                line(Lf, p, q, 1, LILAC, .3)
        if 1.0 <= u < SH_FALL:                                   # 長針が光って離れる
            g = seg(u, 1.0, SH_FALL)
            needle(Lf, cx, cy + 6, cy + SKY_R * .82 + 6 * g, 1.0 + g)
    if SH_FALL <= u < SH_HIT:                                    # 落ちる
        v = ein(seg(u, SH_FALL, SH_HIT), 2.2)
        tip = cy + SKY_R * .9 + (C.GROUND - cy - SKY_R * .9) * v
        needle(Lf, cx, tip - SKY_R * 1.4, tip, 2.0)
        taper(Lf, [(cx, cy), (cx, tip - 20)], 1, 8, LILAC, .5)
    if SH_HIT <= u < SH_HIT + .55:                               # 刺さった針
        v = u - SH_HIT
        needle(Lf, cx, C.GROUND - SKY_R * 1.3, C.GROUND + 2, 1.6 * (1 - seg(v, .15, .55)))
    if SH_HIT <= u < SH_HIT + .9:                                # 大時計が砕ける・星が降る
        v = u - SH_HIT
        ring(Lf, cx, cy, SKY_R * (1 + .3 * eout(v / .3)), SKY_R * (1 + .3 * eout(v / .3)), 2, GOLD, .9 * (1 - seg(v, 0, .3)))
        burst(Lf, cx, cy, v, 26, 81, sp=200, life=.8, col=GOLD, kind='shard', grav=380, size=(2, 3.5))
        burst(Lf, cx, cy, v, 12, 82, sp=150, life=.9, col=WHITE, kind='star', grav=420, size=(1.2, 2.2))


def ease_snap(u):
    return seg(u, .85, 1.1)


def needle(L, x, top, tip, a=1.0):
    """大時計の長針（剣のような針）"""
    taper(L, [(x, top), (x, tip)], 9, 2, GOLD, .9 * a)
    taper(L, [(x, top + 6), (x, tip - 2)], 3, .5, WHITE, a)
    ring(L, x, top, 6, 6, 2, GOLD, a)
    poly(L, [(x, tip + 10), (x - 7, tip - 6), (x, tip - 2), (x + 7, tip - 6)], GOLD, a)
    poly(L, [(x, tip + 6), (x - 3, tip - 4), (x + 3, tip - 4)], WHITE, a)
    blob(L, x, tip, 8, LILAC, .5 * a)


# ================================================================== 遅くする陣
def zone_fx(Lg, Lf, t, z, sim, fi):
    v = t - z['t0']
    if v < 0:
        return
    k = eout(seg(v, 0, .3))
    fade = 1 - seg(t, z['t1'], z['t1'] + .5)
    flash = 1 - seg(v, 0, .45)
    x, y, r = z['x'], C.GROUND + 4, z['r']
    oval(Lg, x, y, r * k, r * .2 * k, DEEP, .3 * fade, soft=.8)
    X.clock(Lg, x, y, r * (.92 + .08 * k), k, t, GOLD, VIO, (.5 + .6 * flash) * fade, ry=r * .2,
            h1=-v * .25, h2=-v * 1.6, stars=12, w=2)
    if v < .45:                                                  # 開くときの白い輪
        rr = r * eout(v / .3)
        ring(Lg, x, y, rr, rr * .2, 2, WHITE, 1.2 * flash)
        blob(Lf, x, y - 4, 16, WHITE, 1.2 * (1 - seg(v, 0, .12)))
        star(Lf, x, y - 6, 40, GOLD, 1 - seg(v, .02, .25), rot=.0)
    # 陣の中をゆっくり昇る時の砂（状態を持たない）
    rng = np.random.default_rng(31)
    for j in range(16):
        ph = (v * .35 + rng.random()) % 1
        px = x + rng.uniform(-.9, .9) * r
        py = y - 4 - ph * 60 + math.sin(v * 2 + j) * 2
        if abs(px - x) / r > math.sqrt(max(0, 1 - ((py - y) / 999) ** 2)):
            continue
        blob(Lf, px, py, 1.3, GOLD if j % 3 == 0 else LILAC, .7 * math.sin(ph * math.pi) * fade * k)
    if t >= z['t1']:                                             # 解けるとき：輪から時の欠片がこぼれる
        burst(Lf, x, y - 4, t - z['t1'], 14, 91, sp=r * 1.1, life=.5, col=GOLD, kind='shard', grav=200, size=(1.5, 2.5),
              a0=180, a1=360, sq=.3)
    # 遅くなった敵の頭上：小さな時計（針がゆっくり回る）
    for e in sim.enemies:
        if e['slowed'][fi] <= 0 or not sim.alive_at(e, fi):
            continue
        ex, foot = sim.epos(e, fi, 'foot')
        w, h = sim.size(e['kind'])
        cy = foot - h - 18
        ring(Lf, ex, cy, 5.5, 5.5, 1.4, GOLD, .9)
        th = -t * 1.2 + e['id']
        line(Lf, (ex, cy), (ex + math.cos(th) * 4, cy + math.sin(th) * 4), 1.2, WHITE, .9)
        line(Lf, (ex, cy), (ex, cy - 3), 1.2, WHITE, .7)
        blob(Lf, ex, cy, 4, VIO, .35)


# ================================================================== 局所の暗さ・数字・画面
def world_tint(img, t, sim):
    for a in sim.actions:
        if a['name'] == 'shuuen' and a['aim'] is not None:
            u = t - a['t0']
            k = seg(u, .2, .4) * (1 - seg(u, SH_HIT + .05, SH_HIT + .35))
            if k > 0:
                img = dim_patch(img, [(C.CEL_X, C.CEL_FOOT - 50, 110, 120), (a['aim'], 260, 260, 220)], k)
    return img


NUMC = {'cyan': ((255, 255, 255), (150, 215, 255)), 'vio': ((255, 255, 255), (205, 160, 255)),
        'sand': ((240, 230, 255), (190, 150, 255)), 'gold': ((255, 255, 235), (255, 175, 60))}


def number(T, nm, age):
    """小さな数字：ぽんと出て、はねて、消える。範囲の技（sand・gold）は時間と高さを敵ごとにずらして重なりを減らす"""
    key = int(round(nm['x'] * 10))
    aoe = nm['col'] in ('sand', 'gold')
    lag = ((key * 7) % 6) * .035 if aoe else 0
    a = age - lag
    life = .45 if nm['col'] == 'sand' else .55
    if a < 0 or a > life + .2:
        return
    sz = {'sand': 11, 'gold': 15}.get(nm['col'], 18 if nm['crit'] else 14)
    sc = 1 + .55 * (1 - eout(a / .08))
    hop = 14 * math.sin(clamp(a / .28) * math.pi) * (1 if a < .28 else 0) + 6 * eout(a / .28)
    yo = ((key * 3) % 4) * 11 if aoe else 0
    top, bot = NUMC.get(nm['col'], NUMC['vio'])
    T.metal(str(nm['n']), nm['x'], nm['y'] - yo - hop, sz * sc, 1 - seg(a, life, life + .2), top, bot, sw=3 if sz > 12 else 2)


FACE = BASE['front'][14:38, 20:62]                               # カットインの顔（目の高さの帯）
FACE2 = np.repeat(np.repeat(FACE, 2, 0), 2, 1)


def shake_at(t, sim):
    amp = 0.0
    for a in sim.actions:
        u = t - a['t0']
        if a['name'] == 'shuuen':
            if SH_HIT <= u < SH_HIT + .45:
                amp = max(amp, 7 * (1 - seg(u, SH_HIT, SH_HIT + .45)) ** 1.5)
        elif a['name'] == 'tokiya':
            hit3 = TK_FIRE[2] + TK_FLY
            if hit3 <= u < hit3 + .15:
                amp = max(amp, 2 * (1 - seg(u, hit3, hit3 + .15)))
        elif a['name'] == 'slow':
            if SL_LAND <= u < SL_LAND + .1:
                amp = max(amp, 1.2)
    return amp


def shift(img, dx, dy):
    if dx == 0 and dy == 0:
        return img
    out = np.empty_like(img)
    h, w = img.shape[:2]
    sx0, dx0 = max(0, -dx), max(0, dx)
    sy0, dy0 = max(0, -dy), max(0, dy)
    out[...] = img
    out[dy0:h - sy0 if sy0 else h, dx0:w - sx0 if sx0 else w] = img[sy0:h - dy0 if dy0 else h, sx0:w - dx0 if dx0 else w]
    return out


def cutin(img, u):
    """奥義だけの細い帯のカットイン（0.05〜0.5 秒）。目の帯と技名"""
    if not (.05 <= u < .5):
        return img
    v = u - .05
    cy, hh = 112, 50
    k_in = eout(v / .1)
    k_out = 1 - seg(v, .36, .45)
    hh2 = hh * (.3 + .7 * k_in) * k_out
    if hh2 < 2:
        return img
    y0, y1 = int(cy - hh2 / 2), int(cy + hh2 / 2)
    xo = int((1 - k_in) * C.W)
    band = img[y0:y1, xo:].copy()
    g = np.linspace(0, 1, band.shape[1], dtype=np.float32)[None, :, None]
    col = DEEP * .45 * (1 - g) + VIO * .32 * g
    band = band * .18 + col * .9
    # 流れる光の線
    rng = np.random.default_rng(3)
    for j in range(10):
        yy = int(rng.uniform(2, max(3, y1 - y0 - 2)))
        xx = int((rng.uniform(0, 1) * 900 - v * 2400) % 1100) - 100
        ln = int(rng.uniform(40, 120))
        a0, a1 = max(0, xx), min(band.shape[1], xx + ln)
        if a1 > a0 and yy < band.shape[0]:
            band[yy, a0:a1] += LILAC * .35
    img = img.copy()
    img[y0:y1, xo:] = band
    # 顔（2 倍の点のまま）
    fh, fw = FACE2.shape[:2]
    fx = xo + 560
    fy = cy - fh // 2
    s0 = max(0, y0 - fy)
    s1 = min(fh, y1 - fy)
    if s1 > s0 and fx + fw <= C.W:
        X.paste(img, FACE2[s0:s1], fx, fy + s0)
    # 金の縁
    img[max(0, y0 - 2):y0, xo:] = GOLD * .95
    img[y1:y1 + 2, xo:] = GOLD * .95
    T = X.Text()
    T.metal(NAMES['shuuen'], xo + 420, cy, 32, k_out, (255, 255, 255), (255, 200, 90), (40, 10, 70), 4, path=X.FONT_JA)
    return T.over(img)


def screen(img, t, sim, fi):
    for a in sim.actions:
        if a['name'] == 'shuuen':
            img = cutin(img, t - a['t0'])
    amp = shake_at(t, sim)
    if amp > .4:
        dx = int(round(amp * .5 * math.sin(t * 97)))
        dy = int(round(amp * math.cos(t * 131)))
        img = shift(img, dx, dy)
    return img


# ================================================================== 効果音
_COIN = []


def sound(mix, t, kind, arg):
    if kind == 'attack':                                         # 軽い風切りと小さな鈴
        mix.add(t + AT_FIRE, X.s_noise(.09, 5000, 1800, .035, q=1.2, att=.004, seed=int(t * 100) % 50))
        mix.add(t + AT_FIRE, X.s_ring(5600, .07, .012))
    elif kind == 'hit_attack':
        mix.add(t, X.s_thump(.12, 220, 110, .07))
        mix.add(t, X.s_tick(4400, .04))
    elif kind == 'tokiya':
        mix.add(t, X.s_rise(.28, 500, 2600, .06))
        for i, f in enumerate(TK_FIRE):
            mix.add(t + .06 + i * .05, X.s_tick(2800 + i * 400, .05))
            mix.add(t + f, X.s_noise(.12, 6500, 1500, .09, q=1.2, att=.003, seed=20 + i))
            mix.add(t + f, X.s_ring(5000 + 500 * i, .12, .03))
    elif kind == 'hit_tokiya':
        mix.add(t, X.s_thump(.25, 170, 60, .14))
        mix.add(t, X.s_ring(4200, .14, .035))
    elif kind == 'slow':
        mix.add(t, X.s_rise(.42, 300, 1400, .06))
        for i in range(4):
            mix.add(t + .05 + i * .09, X.s_tick(2200 - i * 250, .05))
        mix.add(t + SL_LAND, X.s_thump(.25, 120, 50, .25))
        mix.add(t + SL_LAND, X.s_chime((3136, 2637, 2093, 1568), .05, .03))
    elif kind == 'hit_slow':
        pass
    elif kind == 'shuuen':
        mix.add(t, X.s_noise(.5, 600, 3000, .08, q=1.5, att=.2, seed=40))
        for i in range(3):                                       # カットインの金属音 3 連打
            mix.add(t + .05 + i * .06, X.s_ring(6200 - i * 600, .25, .05))
        tau, k = .45, 0
        while tau < SH_FALL:                                     # 早回しの刻み（だんだん速く）
            mix.add(t + tau, X.s_tick(3000 + k * 90, .05))
            tau += max(.025, .1 - k * .01)
            k += 1
        mix.add(t + SH_FALL - .05, X.s_rise(.17, 1500, 6000, .08, seed=8))
        mix.add(t + SH_HIT, X.s_boom(.9, 1.3))
        mix.add(t + SH_HIT, X.s_shatter(.35, 1.0))
        mix.add(t + SH_HIT, X.s_ring(7600, .4, .06))
        mix.add(t + SH_HIT + .45, X.s_chime(v=.035))
    elif kind == 'hit_shuuen':
        pass
    elif kind == 'coin':                                         # 小さな「ちりん」。重なったら間引く
        near = sum(1 for c in _COIN if abs(c - t) < .04)
        _COIN.append(t)
        if near < 2:
            mix.add(t + near * .03, X.s_ring(2800 + (len(_COIN) % 3) * 300, .12, .018))
            mix.add(t + near * .03 + .05, X.s_ring(4200, .1, .012))
