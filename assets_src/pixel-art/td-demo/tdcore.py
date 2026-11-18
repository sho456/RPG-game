"""横スクロールのタワーディフェンス（TD）想定の、セレスの技・術の演出デモ ― 土台（tdcore）。

  python3 tdcore.py 1|2 [秒]   → out/td_celes<案>.mp4（60fps・1920×1080・音つき）と out/td_celes<案>_sheet.png
  python3 tdcore.py 1 peek 5.2 9.4 15.6   → out/peek<案>.png（そのコマだけ）

レーン：左から敵が歩いてきて、右の拠点（時計塔の水晶）を目指す。セレスは拠点の手前に配置された味方（左向き）。
ゲームは止めない：技の演出の間も敵は歩き続ける（終焉の針だけ、ごく短く 0.3 倍の遅回し）。

分担（各ファイルは自分のファイルだけを直す。ここ tdcore.py の約束＝関数の名前と引数は変えない）
  stage.py   背景（遠景・中景・レーン・手前）と拠点：bg() / base(img, t, hit_age, hp_k)
  enemies.py 敵 3 種の絵：sprite(kind, anim, t, seed, scale) / SIZE
  ui.py      画面の UI：hud(img, st) / coin(L_or_img...) など（下の placeholder を参照）
  style1.py  案1（48px デフォルメ）のセレスの動きと技の演出
  style2.py  案2（HD 100px）のセレスの動きと技の演出
各ファイルが無い・壊れているときは、ここの仮の絵（placeholder）で動く。
"""
import importlib
import math
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'celes-hd', 'demo'))
import fxcore as X  # noqa: E402  光の道具（blob ring line poly taper star clock burst impact light_on paste Text s_*）
from fxcore import (AMBER, CYAN, DEEP, GOLD, RED, VIO, WHITE, blob, burst, clamp, ease, ein, eout, line,  # noqa: E402,F401
                    ring, seg, star, taper)

OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
W, H, FPS = X.W, X.H, X.FPS
DT = 1 / FPS

# ---------------------------------------------------------------- 配置
GROUND = 404                 # レーンの足元（敵は ±10 の奥行きのばらつき）
CEL_X, CEL_FOOT = 742, 410   # セレス（左向き）
BASE_X = 880                 # 拠点の中心 x（足元は GROUND+6）
STOP_X = 800                 # 敵がここまで来ると拠点を叩く
RANGE = 500                  # 通常攻撃の射程（セレスから左へ）

# 敵の能力（絵は enemies.py）
KIND = {
    'mite':  dict(hp=480, speed=62, gold=10),     # 小さな時計虫（群れ）
    'wraith': dict(hp=1300, speed=42, gold=25),   # 亡霊（中）
    'golem': dict(hp=9000, speed=20, gold=200),   # 歯車の巨像（ボス）
}

# 敵の出てくる予定（秒, 種類, 奥行き）。マイナスは動画の始まる前（助走 PRE 秒の間に出ている）
PRE = 6.0
SPAWN = []
for k in range(4):
    SPAWN.append((-5.0 + k * .7, 'mite', [-6, 4, -2, 8][k]))
SPAWN += [(-4.0, 'wraith', -8), (-7.0, 'golem', 2)]
for k in range(5):
    SPAWN.append((-.6 + k * .45, 'mite', [-8, 2, 6, -4, 8][k]))
SPAWN += [(.4, 'wraith', 0)]
for k in range(9):
    SPAWN.append((3.2 + k * .32, 'mite', [-8, 2, 6, -4, 8, -2, 4, 0, -6][k]))
SPAWN += [(3.6, 'wraith', -4), (4.6, 'wraith', 4), (5.4, 'wraith', -8)]
for k in range(4):
    SPAWN.append((9.6 + k * .5, 'mite', [-4, 6, -8, 2][k]))
SPAWN += [(10.4, 'wraith', 0)]


# 技の予定（秒）。ボタンを押した時刻＝技の始まり
SCRIPT = [(4.2, 'tokiya'), (8.4, 'slow'), (13.4, 'shuuen')]
CD = {'tokiya': 6.0, 'slow': 9.0, 'shuuen': 14.0}  # クールダウン（UI の表示用）
T_END = 20.0


# ---------------------------------------------------------------- 部品の読み込み（無ければ仮の絵）
def _try(name):
    try:
        return importlib.import_module(name)
    except Exception as e:  # noqa: BLE001
        print(f'[tdcore] {name}.py を読み込めないので仮の絵を使う: {e}', file=sys.stderr)
        return None


class _PH:
    """仮の絵（placeholder）"""

    @staticmethod
    def bg():
        yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
        img = np.array([.10, .10, .2], np.float32) * (1 - yy) + np.array([.3, .25, .35], np.float32) * yy
        img = np.broadcast_to(img, (H, W, 3)).copy()
        img[GROUND - 20:] = (.22, .2, .24)
        img[GROUND + 30:] = (.12, .11, .14)
        return img

    @staticmethod
    def base(img, t, hit_age, hp_k):
        x0, y1 = BASE_X - 30, GROUND + 6
        img[y1 - 150:y1, x0:x0 + 60] = (.35, .3, .45)

    SIZE = {'mite': (40, 32), 'wraith': (56, 72), 'golem': (110, 120)}

    @staticmethod
    def sprite(kind, anim, t, seed, scale=2):
        w, h = _PH.SIZE[kind]
        a = np.zeros((h, w, 4), np.float32)
        a[...] = (.4, .3, .5, 1)
        a[:2] = a[-2:] = (0, 0, 0, 1)
        a[:, :2] = a[:, -2:] = (0, 0, 0, 1)
        return a

    @staticmethod
    def hud(img, st):
        T = X.Text()
        T.d.text((20, 14), f"WAVE 3/5   GOLD {st['gold']}", fill=(255, 255, 255))
        for i, s in enumerate(st['skills']):
            x = 300 + i * 120
            T.d.rectangle([x, 470, x + 90, 530], outline=(255, 255, 255), fill=(40, 30, 60) if s['ready'] else (20, 20, 20))
            T.d.text((x + 8, 480), s['name'], fill=(255, 255, 255))
        return T.over(img)

    @staticmethod
    def coin(L, img, x, y, age, c=None):
        blob(L, x, y, 4, GOLD, 1.5)


def parts():
    st = _try('stage') or _PH
    en = _try('enemies') or _PH
    ui = _try('ui') or _PH
    return st, en, ui


# ---------------------------------------------------------------- シミュレーション（1 度だけ。状態はコマごとに保存）
class Sim:
    """戦いを 60fps で 1 度だけ進めて、コマごとの状態を記録する（描くときは並列）"""

    def __init__(self, style, T=T_END):
        self.style = style
        self.T = T
        n = int(T * FPS)
        self.n = n
        self.enemies = []      # dict(id, kind, z, spawn, hp0, xs[n], hps[n], alive[n], slowed[n], death, hits[])
        for i, (ts, k, z) in enumerate(sorted(SPAWN)):
            self.enemies.append(dict(id=i, kind=k, z=z, spawn=ts, hp0=KIND[k]['hp'], seed=i * 7 + 3,
                                     xs=np.full(n, np.nan, np.float32), hps=np.zeros(n, np.float32),
                                     slowed=np.zeros(n, np.float32), death=None, hits=[], atk=[]))
        self.actions = []      # dict(name, t0, dur, target, aim, hits=[(t, ...)])
        self.zones = []        # dict(x, r, t0, t1, f)
        self.nums = []         # dict(t, x, y, n, crit, col)
        self.coins = []        # dict(t, x, y, n)
        self.gold = np.zeros(n, np.int32)
        self.base_hp = np.ones(n, np.float32)
        self.base_hits = []
        self.sfx = []          # (t, 名前, 引数)
        self._run()

    # ---- 便利
    def alive_at(self, e, fi):
        return not np.isnan(e['xs'][fi]) and e['hps'][fi] > 0

    def ex(self, e, fi):
        return float(e['xs'][fi])

    def epos(self, e, fi, where='mid'):
        """敵の画面上の位置（mid＝体の中心・foot＝足元）"""
        w, h = self.size(e['kind'])
        x = float(e['xs'][min(fi, self.n - 1)])
        foot = GROUND + e['z']
        return (x, foot - h * .5) if where == 'mid' else (x, foot)

    def size(self, kind):
        return ENEMY.SIZE[kind]

    def _run(self):
        st = self.style
        n = self.n
        x = {}
        hp = {}
        vx_kb = {}
        gold = 0
        bhp = 1.0
        last_atk = -9.0
        script = list(SCRIPT)
        busy_until = -1.0
        pending = []        # (t, 関数)
        npre = int(PRE * FPS)
        for fa in range(n + npre):
            fi = max(0, fa - npre)
            t = (fa - npre) * DT
            rec = fa >= npre
            # 出現
            for e in self.enemies:
                if e['id'] not in x and t >= e['spawn']:
                    x[e['id']] = -30.0 - (10 if e['kind'] == 'golem' else 0)
                    hp[e['id']] = float(e['hp0'])
                    vx_kb[e['id']] = 0.0
            # 予約した命中を処理
            for item in [p for p in pending if p[0] <= t]:
                pending.remove(item)
                item[1](fi, t)
            # 移動
            for e in self.enemies:
                i = e['id']
                if i not in x or hp[i] <= 0:
                    continue
                f = 1.0
                for z in self.zones:
                    if z['t0'] <= t < z['t1'] and abs(x[i] - z['x']) < z['r']:
                        f = z['f']
                if rec:
                    e['slowed'][fi] = 1.0 if f < 1 else 0.0
                gf = self.global_speed(t)
                sp = KIND[e['kind']]['speed'] * f * gf
                if x[i] < STOP_X - (30 if e['kind'] == 'golem' else 0):
                    x[i] += sp * DT
                else:
                    if t - (e['atk'][-1] if e['atk'] else -9) > 1.2:
                        e['atk'].append(t)
                        bhp -= .02 if e['kind'] != 'golem' else .06
                        self.base_hits.append(t)
                x[i] += vx_kb[i] * DT
                vx_kb[i] *= .86
            if not rec:
                for i in x:
                    pass
            # 技
            if script and t >= script[0][0]:
                ts, name = script.pop(0)
                self._start(name, fi, t, pending)
                busy_until = t + st.ACT[name]['dur']
            # 通常攻撃
            elif rec and t >= busy_until and t - last_atk >= st.ACT['attack']['dur'] + .3:
                tgt = self.front_enemy(x, hp)
                if tgt is not None and CEL_X - x[tgt] < RANGE:
                    last_atk = t
                    busy_until = t + st.ACT['attack']['dur']
                    self._start('attack', fi, t, pending, tgt)
            # 死亡
            for e in self.enemies:
                i = e['id']
                if i in x and hp[i] <= 0 and e['death'] is None:
                    e['death'] = t
                    g = KIND[e['kind']]['gold']
                    gold += g
                    px, py = x[i], GROUND + e['z'] - self.size(e['kind'])[1] * .5
                    self.coins.append(dict(t=t, x=px, y=py, n=g, seed=i))
                    self.sfx.append((t, 'coin', g))
            # 記録
            if not rec:
                self._x, self._hp, self._kb = x, hp, vx_kb
                continue
            for e in self.enemies:
                i = e['id']
                if i in x:
                    e['xs'][fi] = x[i] if (hp[i] > 0 or t - e['death'] < 1.0) else np.nan
                    e['hps'][fi] = max(0, hp[i])
            self.gold[fi] = gold
            self.base_hp[fi] = bhp
            self._x, self._hp, self._kb = x, hp, vx_kb

    def global_speed(self, t):
        """終焉の針の落ちる直前だけ、世界をごく短く遅くする（ゲームは止めない）"""
        sl = getattr(self.style, 'WORLD_SLOW', None)
        if not sl:
            return 1.0
        for a in self.actions:
            if a['name'] == 'shuuen':
                s0, s1, k = sl
                if a['t0'] + s0 <= t < a['t0'] + s1:
                    return k
        return 1.0

    def front_enemy(self, x, hp):
        best = None
        for i, xv in x.items():
            if hp[i] > 0 and (best is None or xv > x[best]):
                best = i
        return best

    def strongest(self, x, hp):
        best = None
        for i, xv in x.items():
            if hp[i] > 0 and xv > -10 and (best is None or hp[i] > hp[best]):
                best = i
        return best

    def crowd_center(self, x, hp, r=150):
        """敵がいちばん多く入る位置（範囲の技の中心）"""
        xs = [xv for i, xv in x.items() if hp[i] > 0 and xv > 0]
        if not xs:
            return 400.0
        best, bc = xs[0], -1
        for c in np.arange(80, STOP_X, 10):
            cnt = sum(1 for v in xs if abs(v - c) < r)
            if cnt > bc:
                best, bc = c, cnt
        return float(best)

    def _start(self, name, fi, t, pending, tgt=None):
        """技を始める：的を決め、命中を予約する"""
        st = self.style
        A = st.ACT[name]
        x, hp = self._x, self._hp
        if name == 'tokiya':
            tgt = self.strongest(x, hp)
        aim = None
        if A.get('aoe') or A.get('zone'):
            aim = self.crowd_center(x, hp, A.get('aoe', {}).get('r', A.get('zone', {}).get('r', 150)))
        act = dict(name=name, t0=t, dur=A['dur'], target=tgt, aim=aim, hits=[])
        self.actions.append(act)
        self.sfx.append((t, name, None))
        for (dt, kind, prm) in A.get('hits', []):
            def hit(fi2, t2, kind=kind, prm=prm, act=act):
                self._hit(fi2, t2, act, kind, prm)
            pending.append((t + dt, hit))
        if A.get('zone'):
            z = A['zone']
            self.zones.append(dict(x=aim, r=z['r'], t0=t + z['at'], t1=t + z['at'] + z['dur'], f=z['f'], act=act))

    def _hit(self, fi, t, act, kind, prm):
        x, hp, kb = self._x, self._hp, self._kb
        dmg = prm.get('dmg', 500)
        crit = prm.get('crit', False)
        col = prm.get('col', 'gold')
        if kind == 'single':
            i = act['target']
            if i is None or hp.get(i, 0) <= 0:
                i = self.front_enemy(x, hp)
                act['target'] = i
            if i is None:
                return
            ids = [i]
        else:  # 'aoe'
            c = act['aim'] if act['aim'] is not None else self.crowd_center(x, hp)
            r = prm.get('r', 150)
            ids = [i for i in x if hp[i] > 0 and abs(x[i] - c) < r]
        rng = np.random.default_rng(int(t * 1000) % 99991)
        for i in ids:
            e = self.enemies[i]
            d = int(dmg * rng.uniform(.9, 1.1))
            hp[i] -= d
            kb[i] -= prm.get('kb', 0)
            e['hits'].append((t, col, prm.get('kb', 0)))
            w, h = self.size(e['kind'])
            self.nums.append(dict(t=t, x=x[i] + rng.uniform(-8, 8), y=GROUND + e['z'] - h - 6, n=d, crit=crit, col=col))
        act['hits'].append((t, kind, ids, prm))
        self.sfx.append((t, 'hit_' + act['name'], len(ids)))


STAGE, ENEMY, UI = parts()


# ---------------------------------------------------------------- 1 コマを描く
class Demo:
    def __init__(self, style, T=T_END):
        self.style = style
        self.sim = Sim(style, T)
        self.n = self.sim.n
        self.BG = STAGE.bg()

    def frame(self, fi):
        sim, st = self.sim, self.style
        t = fi * DT
        img = self.BG.copy()
        # 拠点
        bh = [t - b for b in sim.base_hits if b <= t]
        STAGE.base(img, t, min(bh) if bh else 9.0, float(sim.base_hp[fi]))
        Lg = np.zeros((H, W, 3), np.float32)
        Lf = np.zeros((H, W, 3), np.float32)
        # 範囲の技の地面
        for z in sim.zones:
            if z['t0'] - .4 <= t < z['t1'] + .5:
                st.zone_fx(Lg, Lf, t, z, sim, fi)
        acts = [a for a in sim.actions if a['t0'] <= t < a['t0'] + a['dur'] + st.TAIL]
        for a in acts:
            st.fx_ground(Lg, t, a, sim, fi)
        img = X.light_on(img, Lg, .7, .9)
        img = st.world_tint(img, t, sim) if hasattr(st, 'world_tint') else img
        # 敵（奥から）
        es = [e for e in sim.enemies if not np.isnan(e['xs'][fi])]
        es.sort(key=lambda e: e['z'])
        for e in es:
            self.draw_enemy(img, Lf, e, fi, t)
        # セレス
        st.hero(img, t, sim, fi)
        for a in acts:
            st.fx_front(Lf, t, a, sim, fi)
        # コイン
        for c in sim.coins:
            if 0 <= t - c['t'] < 1.4:
                UI.coin(Lf, img, c['x'], c['y'], t - c['t'], c)
        img = X.light_on(img, Lf, .8, 1.0)
        # 数字
        T = X.Text()
        for nm in sim.nums:
            age = t - nm['t']
            if 0 <= age < 1.0:
                st.number(T, nm, age)
        img = T.over(img)
        # 画面の揺れ・白飛び（技が決める。TD なので小さく）
        img = st.screen(img, t, sim, fi)
        # UI
        img = UI.hud(img, self.hud_state(t, fi))
        return X.to8(img)

    def draw_enemy(self, img, Lf, e, fi, t):
        sim = self.sim
        x = float(e['xs'][fi])
        foot = GROUND + e['z']
        dead = e['death'] is not None and t >= e['death']
        anim = 'walk'
        white, tk, tint = 0.0, 0.0, None
        for (ht, col, kbv) in e['hits']:
            if 0 <= t - ht < .3:
                anim = 'hit'
                if t - ht < 2.5 / 60:
                    white = 1.0
                k = 1 - (t - ht) / .3
                if k * .7 > tk:
                    tk, tint = k * .7, self.style.COL.get(col, VIO)
        if e['slowed'][fi] > 0:
            tk2 = .45
            if tk2 > tk:
                tk, tint = tk2, VIO
        if x > STOP_X - 40 and not dead:
            anim = 'attack' if (t - (max([a for a in e['atk'] if a <= t], default=-9))) < .4 else anim
        spd = .35 if e['slowed'][fi] > 0 else 1.0
        sp = ENEMY.sprite(e['kind'], anim if not dead else 'hit', t * spd + e['seed'] * .37, e['seed'], 2)
        h, w = sp.shape[:2]
        X.shadow(img, x, foot, w * .45, .45)
        kw = dict(white=white, tint=tint, tk=tk)
        if dead:
            age = t - e['death']
            mm = X.mosaic_mask(sp, clamp(age / .35), seed=e['id'], blk=2)
            kw.update(mask=mm, white=max(white, .75 * (1 - clamp(age / .07))))
        X.paste(img, sp, x - w / 2, foot - h, **kw)
        if dead:
            age = t - e['death']
            burst(Lf, x, foot - h * .5, age, 18, e['id'] + 50, sp=180, life=.5, col=self.style.COL.get('death', VIO), kind='ember', up=60)
            X.ring(Lf, x, foot - h * .5, 10 + 50 * eout(age / .3), 10 + 50 * eout(age / .3), 2, WHITE, 1 - clamp(age / .3))
        # HP の帯（敵の頭上。ボスは太く）
        if not dead and e['hps'][fi] < e['hp0']:
            k = e['hps'][fi] / e['hp0']
            bw = 60 if e['kind'] == 'golem' else 30
            y = foot - h - 8
            img[int(y):int(y) + 4, int(x - bw / 2):int(x + bw / 2)] = (.05, .03, .08)
            img[int(y) + 1:int(y) + 3, int(x - bw / 2) + 1:int(x - bw / 2) + 1 + int((bw - 2) * k)] = (.95, .25, .3)

    def gold_gain_age(self, t):
        g = [c['t'] for c in self.sim.coins if c['t'] + .9 <= t]
        return t - (max(g) + .9) if g else -1.0

    def hud_state(self, t, fi):
        sim = self.sim
        sk = []
        for name in ('tokiya', 'slow', 'shuuen'):
            used = [a['t0'] for a in sim.actions if a['name'] == name and a['t0'] <= t]
            last = used[-1] if used else None
            press = [s for s, n2 in SCRIPT if n2 == name and s - .35 <= t]
            cdk = 1.0 if last is None else clamp((t - last) / CD[name])
            # デモの開始時はチャージ途中から
            if last is None:
                cdk = clamp(.35 + t / (press[0] if press else 9) * .65) if press else clamp(.3 + t / 20)
            sk.append(dict(key=name, name=self.style.NAMES[name], cd=cdk, ready=cdk >= 1,
                           press_age=(t - ([s for s, n2 in SCRIPT if n2 == name and s - .35 <= t][-1] - .35)) if press else -1))
        deaths = [e['death'] for e in sim.enemies]
        left = sum(1 for d in deaths if d is None or d > t)
        clear_age = (t - max(deaths)) if left == 0 and deaths else -1.0
        gold_prev = int(sim.gold[max(0, fi - 12)])
        return dict(t=t, gold=int(sim.gold[fi]), gold_gain_age=self.gold_gain_age(t), clear_age=clear_age, gold_prev=gold_prev, wave=(3, 5), base_hp=float(sim.base_hp[fi]), skills=sk,
                    style=self.style.LABEL, enemies_left=left)


# ---------------------------------------------------------------- 音
def sounds(demo, mix):
    sim, st = demo.sim, demo.style
    for (t, kind, arg) in sim.sfx:
        st.sound(mix, t, kind, arg)
    # 常に小さく流れる風
    mix.add(0, X.s_noise(sim.T, 300, 500, .02, q=1, att=1.0, seed=99))


# ---------------------------------------------------------------- 書き出し
_D = None


def _init(style_name, T):
    global _D
    _D = Demo(importlib.import_module(style_name), T)


def _job(fi):
    return _D.frame(fi)


def render(style_name, T=T_END, workers=int(os.environ.get('WORKERS', 4))):
    demo = Demo(importlib.import_module(style_name), T)
    name = 'td_' + style_name.replace('style', 'celes')
    wav = os.path.join(OUT, name + '.wav')
    mix = X.Mixer(T)
    sounds(demo, mix)
    mix.write(wav, T)
    mp4 = os.path.join(OUT, name + '.mp4')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
           '-i', '-', '-i', wav, '-vf', f'scale={W * 2}:{H * 2}:flags=neighbor', '-c:v', 'libx264', '-preset', 'medium',
           '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', mp4]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    thumbs = []
    with Pool(workers, initializer=_init, initargs=(style_name, T)) as pool:
        for i, fr in enumerate(pool.imap(_job, range(demo.n), chunksize=4)):
            p.stdin.write(fr.tobytes())
            if i % 12 == 0:
                thumbs.append((i, Image.fromarray(fr).resize((W // 3, H // 3), Image.BILINEAR)))
    p.stdin.close()
    p.wait()
    cols = 8
    rows = (len(thumbs) + cols - 1) // cols
    sh = Image.new('RGB', (cols * W // 3, rows * (H // 3 + 14)))
    d = ImageDraw.Draw(sh)
    for k, (i, im) in enumerate(thumbs):
        x, y = (k % cols) * W // 3, (k // cols) * (H // 3 + 14)
        sh.paste(im, (x, y + 14))
        d.text((x + 3, y + 1), f'{i / FPS:.2f}s', fill=(255, 255, 255))
    sh.save(os.path.join(OUT, name + '_sheet.png'))
    print(mp4)
    return mp4


def peek(style_name, ts, T=T_END):
    demo = Demo(importlib.import_module(style_name), T)
    ims = [Image.fromarray(demo.frame(min(demo.n - 1, int(t * FPS)))) for t in ts]
    cols = min(3, len(ims))
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (cols * W // 2, rows * H // 2))
    for i, im in enumerate(ims):
        sh.paste(im.resize((W // 2, H // 2), Image.BILINEAR), ((i % cols) * W // 2, (i // cols) * H // 2))
    path = os.path.join(OUT, os.environ.get('PEEK_OUT', f'peek{style_name[-1]}.png'))
    sh.save(path)
    print(path)


if __name__ == '__main__':
    style = 'style' + sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2] == 'peek':
        peek(style, [float(v) for v in sys.argv[3:]])
    else:
        render(style, float(sys.argv[2]) if len(sys.argv) > 2 else T_END)
