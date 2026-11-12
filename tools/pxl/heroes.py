"""味方12人の定義（RS系・48×48セル）。各関数は (pose, aw) → Cv を返す。"""
from hero import *

W_, H_, AX, AY = 48, 48, 26, 44

def base_mats(c, skin=SKIN):
    c.mat('skin', skin).mat('white', ['#8e98bc', '#dfe6f8', '#ffffff']).mat('ink', [OUT, '#3a2c3c'])
    c.mat('mouth', ['#8a2a34', '#e8787a']).mat('tear', ['#4aa0e0', '#bff4ff'])
    c.mat('leather', ['#3e2418', '#6e4428', '#9c6c3e', '#caa064']).mat('gold', ['#7a4a10', '#c88a20', '#f4cc50', '#fff4b0'], 'metal')
    c.mat('blade', ['#465068', '#8490ac', '#c0cce0', '#f0f6ff', '#ffffff'], 'metal', slot='blade')

def LG(**kw):
    """頭の文字グリッド用の凡例。a〜e=髪の5階調、S/s/l=肌、r=頬、E/i=瞳、W=白目、m=口。"""
    L = {'a': ('hair', 0), 'b': ('hair', 1), 'c': ('hair', 2), 'd': ('hair', 3), 'e': ('hair', 4),
         'S': ('skin', 1), 's': ('skin', 2), 'l': ('skin', 3), 'D': ('skin', 0), 'r': ('mouth', 1), 'E': ('iris', 0), 'i': ('iris', 1), 'W': ('white', 2), 'm': ('mouth', 0)}
    L.update(kw); return L

# ---------------------------------------------------------------- リオ：跳ねた橙の髪、青い上着、白い襟巻き、片手剣
RIO_HEAD = [
 "......d...d......",
 ".....cd..dd..c...",
 "..c..cdc.ddc.cb..",
 "..dc.cddcddccbb.b",
 "..cddddeddcdcbbbb",
 ".bcddeeddcdcccbb.",
 ".bddedddccccbcbba",
 ".cdddcdcdbccbbcb.",
 ".cdcslcbscbbcbba.",
 "..clEssEWsbbcbab.",
 "..SsisliWsabcba..",
 "..SssssrrSabba...",
 "...smsssS.aba....",
 "....SssS....a....",
]
def rio(P=None, aw=False):
    c = Cv(W_, H_, ax=AX, ay=AY); base_mats(c)
    if not aw:
        c.mat('hair', ['#6e2c14', '#a84a1a', '#dc7a26', '#f8a644', '#ffd888']); c.mat('coat', ['#16265a', '#24449a', '#3868cc', '#5e96ee', '#9cc4ff'])
        c.mat('scarf', ['#6e7aa0', '#b4bed8', '#e6ecfa', '#ffffff']); c.mat('pants', ['#1a1a36', '#2e2e58', '#484a80', '#6a6eaa']); c.mat('iris', ['#12306e', '#2f7ae0'])
    else:
        c.mat('hair', ['#9a5a10', '#d89a1c', '#ffd040', '#ffee90', '#ffffff']); c.mat('coat', ['#4a5aa0', '#8c9ce0', '#c8d4fa', '#eef2ff', '#ffffff'])
        c.mat('scarf', ['#b07818', '#e8b030', '#ffe070', '#fff8c8']); c.mat('pants', ['#28387a', '#4460b8', '#7090e8', '#a0bcff']); c.mat('iris', ['#a04a00', '#ffb020'])
        c.mat('blade', ['#a07a20', '#e0b840', '#ffe890', '#fffad0', '#ffffff'], 'metal', slot='blade')
    R = Rig(c, P); P = R.P; cx, cy = R.ch; hx, hy = R.hip; sw = P['sw']
    # 襟巻きの尾（背へなびく）
    c.poly([(cx + 1, cy - 1), (cx + 5 + sw, cy - .5), (cx + 9 + sw * 1.5, cy + 2 + sw * .4), (cx + 8 + sw * 1.3, cy + 4.2), (cx + 4.5 + sw * .6, cy + 2.2), (cx + 1, cy + 1.5)], 'scarf', z=-6, lum=.55, grad=(-.07, -.05))
    R.arm('B', 'coat'); R.leg('B', 'pants', boot='leather', bootH=.42)
    R.torso('coat')
    c.px(cx - 2, cy + 2, 'scarf', 2, .3).px(cx - 2, cy + 3, 'scarf', 1, .3).px(hx - 2, hy - 1, 'scarf', 1, .3)        # シャツの前身頃
    for i in range(-3, 3): c.px(hx + i, hy, 'leather', 1 if i < 1 else 0, .4)                                         # ベルト
    c.px(hx - 2, hy, 'gold', 3, .5)
    c.poly([(hx + 1, hy + 1), (hx + 4 + sw * .4, hy + 3.5), (hx + 2.4 + sw * .3, hy + 4.4), (hx, hy + 2)], 'coat', z=.2, lum=.2)   # 上着の裾
    R.leg('F', 'pants', boot='leather', bootH=.42, cuff='leather')
    c.tube([(cx - 3, cy + .2), (cx + 2.4, cy + .2)], [1.4, 1.5], 'scarf', z=2)                                         # 首の襟巻き
    R.head(RIO_HEAD, LG(), (6, 14), eyes=((7, 9), (4, 9)), mouth=(4, 12))
    if aw: c.px(R.hd0[0] + 3, R.hd0[1] + 1, 'gold', 3, 9).px(R.hd0[0] + 3, R.hd0[1], 'gold', 2, 9).px(R.hd0[0] + 2, R.hd0[1] + 1, 'gold', 2, 9).px(R.hd0[0] + 4, R.hd0[1] + 1, 'gold', 2, 9).px(R.hd0[0] + 3, R.hd0[1] + 2, 'gold', 2, 9)
    if not P['noW']: R.blade(R.hF[0], R.hF[1], P['wa'], 11)
    R.arm('F', 'coat', cuff='scarf')
    return c

# ---------------------------------------------------------------- ポーズ集（RS のフレーム構成に対応）
POSE = {
 # 歩き(横)1〜3（探索・街。武器なし）／立ち
 'walk0': dict(fF=(-3.5, 0), fB=(3, -.8), hF=(1.5, 4.5), hB=(-1, 4.5), noW=True, sw=1), 'walk1': dict(noW=True, hF=(-1.5, 5), hB=(1.5, 5)),
 'walk2': dict(fF=(2.5, -.8), fB=(-3.5, 0), hF=(-3, 4), hB=(3, 4), noW=True, sw=1), 'stand': dict(noW=True, hF=(-1.5, 5), hB=(1.5, 5)),
 # 構え1・2（戦闘の待機）
 'idle0': dict(lean=10, crouch=1, fF=(-4, 0), fB=(3.5, 0), hF=(-4, 2.5), hB=(2.5, 3.5), wa=55),
 'idle1': dict(lean=10, crouch=1, fF=(-4, 0), fB=(3.5, 0), hF=(-4, 3), hB=(2.5, 4), wa=55, br=1),
 'blink': dict(lean=10, crouch=1, fF=(-4, 0), fB=(3.5, 0), hF=(-4, 2.5), hB=(2.5, 3.5), wa=55, face='b'),
 # 走り1〜3
 'run0': dict(lean=22, crouch=1, fF=(-5, -2), fB=(5, 0), hF=(2, 3), hB=(4, 2), sw=3, wa=15, face='a'),
 'run1': dict(lean=22, crouch=0, fF=(-1.5, 0), fB=(2, -3), hF=(-1, 4), hB=(2, 4), sw=3, wa=15, face='a'),
 'run2': dict(lean=22, crouch=1, fF=(4, -1), fB=(-4, 0), hF=(-4, 2), hB=(-1, 4), sw=3, wa=15, face='a'),
 # 攻撃（振りかぶり → 振り抜き／突き）
 'atk0': dict(lean=-8, crouch=.5, fF=(-3, 0), fB=(3.5, 0), hF=(4, -5.5), hB=(-1.5, 3), wa=150, sw=2, face='a'),
 'atk1': dict(lean=26, crouch=2, fF=(-5.5, 0), fB=(4, 0), hF=(-6, 3), hB=(3, 3), wa=-22, sw=-3, face='y'),
 'atk2': dict(lean=-4, crouch=1.5, hF=(3, 1), hB=(-2, 2), wa=4, fF=(-2.5, 0), fB=(3.5, 0), sw=1, face='a'),
 'atk3': dict(lean=28, crouch=2, hF=(-7, .5), hB=(3, 3), wa=2, fF=(-6, 0), fB=(4, 0), sw=-3, face='y'),
 # 詠唱1・2 → 発動
 'cast0': dict(lean=-5, hF=(-2, -3.5), hB=(-3, 1), wa=88, face='b'), 'cast1': dict(lean=-5, hF=(-2, -4), hB=(-3, .5), wa=88, face='b', br=1),
 'cast2': dict(lean=14, crouch=.5, hF=(-6, -.5), hB=(2, 3.5), wa=50, sw=-2, face='y'),
 # ダメージ・防御・瀕死・気絶・勝利（選択）・星臨
 'hit': dict(lean=-20, crouch=1, head=(1, 0), hF=(-3, 3.5), hB=(3, 2), sw=-3, hip=(1.5, 0), face='x', wa=-40),
 'guard': dict(lean=6, crouch=1.5, hF=(-4.5, 1.5), hB=(-3.5, 2.5), wa=92, face='a'),
 'weak': dict(lean=30, crouch=4.5, head=(0, 1), fF=(-3, 0), fB=(4, 0), hF=(-4.5, 2.5), hB=(1, 5.5), wa=-86, face='s'),
 'dead': dict(lean=84, hip=(2, 6.5), head=(-1, 2), fF=(5, 0), fB=(8, 0), hF=(-4, 2), hB=(-1.5, 2.5), wa=178, face='k'),
 'win0': dict(lean=-6, hip=(0, -3), hF=(-1.5, -5.5), hB=(3, .5), wa=92, fF=(-2, -1.5), fB=(2, -2), face='h', sw=2),
 'win1': dict(lean=-4, hF=(-1.5, -5.5), hB=(3, 1.5), wa=92, face='h'),
 'awk': dict(lean=-12, crouch=1, hF=(-3.5, -.5), hB=(3.5, -.5), head=(0, -1), fF=(-3.5, 0), fB=(3.5, 0), face='y', wa=62, sw=2),
}
ORDER = ['walk0', 'walk1', 'walk2', 'idle0', 'idle1', 'blink', 'run0', 'run1', 'run2', 'atk0', 'atk1', 'atk2', 'atk3', 'cast0', 'cast1', 'cast2', 'hit', 'guard', 'weak', 'dead', 'win0', 'win1', 'awk']

def show(ims, out, scale=5, bg=(70, 84, 60, 255), cols=8):
    cw = max(i.width for i in ims); ch = max(i.height for i in ims); rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGBA', (cols * (cw * scale + 4) + 4, rows * (ch * scale + 4) + 4), bg)
    for n, im in enumerate(ims):
        sh.alpha_composite(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (4 + (n % cols) * (cw * scale + 4), 4 + (n // cols) * (ch * scale + 4)))
    sh.save(out)

if __name__ == '__main__':
    import sys
    fn = globals()[sys.argv[2]]; names = sys.argv[3].split(',') if len(sys.argv) > 3 and sys.argv[3] != 'all' else ORDER
    ims = [fn(POSE[n]).image() for n in names]
    if len(sys.argv) > 4 and sys.argv[4] != '-': ims += [fn(POSE[n], True).image() for n in sys.argv[4].split(',')]
    show(ims, sys.argv[1], int(sys.argv[5]) if len(sys.argv) > 5 else 6, cols=int(sys.argv[6]) if len(sys.argv) > 6 else min(len(ims), 8))
