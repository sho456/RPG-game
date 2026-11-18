"""TD デモの「演出の型」の見本（仮）。style1.py（案1）・style2.py（案2）はこれと同じ名前と引数で作る。

tdcore が使うもの
  LABEL / NAMES / COL / TAIL / WORLD_SLOW
  ACT[name] = dict(dur=秒, hits=[(開始からの秒, 'single'|'aoe', dict(dmg, col, crit, kb, r))], zone=dict(at, r, f, dur), aoe=dict(r))
      name は 'attack'（通常攻撃）・'tokiya'（刻の矢：いちばん HP の多い敵を狙う）・'slow'（クロノスロウ：敵の群れの中心に遅くする陣）
      ・'shuuen'（終焉の針：群れの中心に範囲の大技）
  hero(img, t, sim, fi)                 セレスを描く（img は float の RGB。fxcore.paste など）
  fx_ground(Lg, t, act, sim, fi)        技の光（体の後ろ・地面）。act = dict(name, t0, dur, target, aim, hits)
  fx_front(Lf, t, act, sim, fi)         技の光（手前）
  zone_fx(Lg, Lf, t, zone, sim, fi)     遅くする陣（zone = dict(x, r, t0, t1, f)）
  number(T, nm, age)                    ダメージの数字（nm = dict(t, x, y, n, crit, col)）
  screen(img, t, sim, fi) -> img        画面全体（揺れ・白飛び・カットイン）
  sound(mix, t, kind, arg)              効果音（kind = 技の名前・'hit_<技>'・'coin'）
sim から読めるもの：sim.actions / sim.enemies（e['xs'][fi]・e['z']・e['kind']）/ sim.epos(e, fi, 'mid'|'foot') / sim.zones
                    tdcore.CEL_X・CEL_FOOT・GROUND
"""
import math

import numpy as np

import fxcore as X
import tdcore as C
from fxcore import CYAN, GOLD, VIO, WHITE, blob, clamp, eout, ring, star, taper

LABEL = '仮'
NAMES = {'tokiya': '刻の矢', 'slow': 'クロノスロウ', 'shuuen': '終焉の針'}
COL = {'gold': GOLD, 'vio': VIO, 'cyan': CYAN, 'death': VIO}
TAIL = .6
WORLD_SLOW = (1.0, 1.25, .3)

ACT = {
    'attack': dict(dur=.4, hits=[(.28, 'single', dict(dmg=520, col='cyan'))]),
    'tokiya': dict(dur=1.0, hits=[(.6 + k * .1, 'single', dict(dmg=2600, col='vio', crit=k == 2, kb=20)) for k in range(3)]),
    'slow': dict(dur=.9, zone=dict(at=.5, r=150, f=.3, dur=6.0), hits=[(.5, 'aoe', dict(dmg=300, col='vio', r=150))]),
    'shuuen': dict(dur=2.0, aoe=dict(r=190), hits=[(1.3, 'aoe', dict(dmg=6000, col='gold', crit=True, kb=60, r=190))]),
}

SPR = X._big(X.CEL_N['side'], 1)


def hero(img, t, sim, fi):
    X.paste(img, SPR, C.CEL_X - 40, C.CEL_FOOT - 102)


def orb():
    return C.CEL_X - 40 + X.ORB['side'][0], C.CEL_FOOT - 102 + X.ORB['side'][1]


def fx_ground(Lg, t, act, sim, fi):
    pass


def fx_front(Lf, t, act, sim, fi):
    age = t - act['t0']
    ox, oy = orb()
    for (ht, kind, ids, prm) in act['hits']:
        for i in ids:
            e = sim.enemies[i]
            x, y = sim.epos(e, fi)
            if not np.isnan(x):
                X.impact(Lf, x, y, t - ht, .4, i)
    if act['name'] in ('attack', 'tokiya') and act['target'] is not None:
        e = sim.enemies[act['target']]
        for (dt, kind, prm) in ACT[act['name']]['hits']:
            u = (age - (dt - .2)) / .2
            if 0 <= u < 1:
                x, y = sim.epos(e, fi)
                blob(Lf, ox + (x - ox) * u, oy + (y - oy) * u, 6, CYAN, 2)
    if act['name'] == 'shuuen' and act['aim'] is not None:
        if 1.0 < age < 1.3:
            taper(Lf, [(act['aim'], 0), (act['aim'], C.GROUND)], 30, 4, WHITE, 1)


def zone_fx(Lg, Lf, t, z, sim, fi):
    k = clamp((t - z['t0'] + .4) / .3) * (1 - clamp((t - z['t1']) / .5))
    X.clock(Lg, z['x'], C.GROUND + 4, z['r'], k, t, GOLD, VIO, .8, ry=z['r'] * .2, h1=t, h2=t * 3)


def number(T, nm, age):
    T.number(nm['n'], nm['x'], nm['y'], age, size=22 if not nm['crit'] else 30, crit=nm['crit'], life=.6)


def screen(img, t, sim, fi):
    return img


def sound(mix, t, kind, arg):
    if kind == 'coin':
        mix.add(t, X.s_ring(2600, .15, .02))
    elif kind.startswith('hit_'):
        mix.add(t, X.s_thump(.2, 160, 60, .12))
