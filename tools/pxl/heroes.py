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
# 胴・脚の文字グリッド：A〜E=上着5階調 / w,x,y,z=襟巻き / g,h,G=金の縁 / k,L,m,n=革 / p,q,r,t=ズボン / S,s=肌 / #=仕切り線
RIO_B = {
 'stand': dict(neck=(6, 0), sh=(4, 2), rows=[
  "....xyzzyx......", "...wxyzzyxw.zy..", "...DxyzyxwBByzx.", "....DgCCBA#Bxw..", "....CgCBBA#CB...", "....ChCBBA#BA...", "....kmGmLk.sS...",
  "....qrrq#qp.....", "....qrtq#rp.....", "....qrrq#qp.....", "....kmnk#mk.....", "...kLmmk#Lk.....", "..kLmmLkkLmk....", "..kkkkk.kkkk...."]),
 'walk0': dict(neck=(6, 0), sh=(4, 2), rows=[
  "....xyzzyx......", "...wxyzzyxw.zy..", "...DxyzyxwBByzx.", "....DgCCBA#Bxw..", "....CgCBBA#CB...", "....ChCBBA#BA...", "....kmGmLk.sS...",
  "...qrrq#rqp.....", "..qrtq..#rqp....", ".pqrq....qrqp...", ".kmnk....kmmk...", "kLmmk.....kLmk..", "kLmLk.....kLLmk.", "kkkk.......kkkk."]),
 'walk2': dict(neck=(6, 0), sh=(4, 2), rows=[
  "....xyzzyx......", "...wxyzzyxw.zy..", "...DxyzyxwBByzx.", "....DgCCBA#Bxw..", "....CgCBBA#CB...", "....ChCBBA#BA...", "....kmGmLk.sS...",
  "....qrrq#qp.....", "....qrtrqqp.....", ".....qrrqp......", ".....kmnmk......", "....kLmmLk......", "...kLmmLkmk.....", "...kkkkkkkk....."]),
 'idle': dict(neck=(7, 0), sh=(5, 2), rows=[
  ".....xyzzyx.....", "....wxyzzyxw.zy.", "....DxyzyxwBByzx", ".....DgCCBA#Bxw.", ".....CgCBBA#CB..", ".....ChCBBA#CBs.", "....kkmGmLLk.sS.",
  "....qrrrq#rqp...", "...qrtrq.#rrqp..", "..pqrrq...qrqp..", "..kmnmk...kmmLk.", ".kLmmLk....kLmk.", "kLmmLkk....kLmLk", "kkkkkk.....kkkkk"]),
 'lunge': dict(neck=(6, 0), sh=(4, 2), rows=[
  "....xyzzyx......", "...xyzzzyw..zyx.", "...DyzyxwBBByzw.", "....DgCBAA#Bx...", ".....CgCBBA#C...", ".....ChCBBA#CB..", ".....kmGmLLk.sS.",
  "....qrrrq#rrqp..", "..pqrtrq..#rrqp.", ".pqrrq.....qrqp.", ".kmnmk.....kmmLk", "kLmmLk......kLmk", "kLmLkk......kLmk", "kkkkk.......kkkk"]),
 'hit': dict(neck=(8, 0), sh=(6, 2), rows=[
  "......xyzzyx....", ".....xyzzzyw....", "....zDyzyxwBB...", "...xy.DgCBA#B...", "..wx..CgCBBA#C..", "......ChCBBA#CBs", ".....kmGmLLk..sS",
  ".....qrrq#rqp...", "....qrtq.#rrqp..", "....qrq...qrqp..", "...kmnk...kmmk..", "..kLmmk...kLmk..", "..kLmLk...kLmLk.", "..kkkk....kkkkk."]),
 'kneel': dict(neck=(6, 0), sh=(4, 2), rows=[
  "....xyzzyx......", "...xyzzzyw.zy...", "...DyzyxwBByzx..", "....DgCBA#Bxw...", "....CgCBBA#CB...", "....ChCBBA#CBs..", "....kmGmLLk.sS..",
  ".qrrrrq#rqp.....", ".qrtq..qrrrqp...", ".kmnk..kqrrqkmLk", "kLmmLk..kkkkLmmk", "kkkkkk......kkkk"]),
 'lying': dict(neck=(5, 1), sh=(7, 2), rows=[
  ".........DDDCB........", ".....xyzDgCCBBkqrrq...", "....xyzzCgCBBAmrtrqpkL", "...wyzyxChCBAAkqrrqpkm", "............kkkkkkkkkk"]),
}
RIO_BL = {'A': ('coat', 0), 'B': ('coat', 1), 'C': ('coat', 2), 'D': ('coat', 3), 'E': ('coat', 4), 'w': ('scarf', 0), 'x': ('scarf', 1), 'y': ('scarf', 2), 'z': ('scarf', 3),
          'g': ('gold', 1), 'G': ('gold', 3), 'h': ('gold', 2), 'k': ('leather', 1), 'L': ('leather', 2), 'm': ('leather', 2), 'n': ('leather', 3),
          'p': ('pants', 0), 'q': ('pants', 1), 'r': ('pants', 2), 't': ('pants', 3), 'S': ('skin', 1), 's': ('skin', 2), '#': ('ink', 0)}
def rio(F=None, aw=False):
    c = Cv(W_, H_, ax=AX, ay=AY); base_mats(c)
    if not aw:
        c.mat('hair', ['#6e2c14', '#a84a1a', '#dc7a26', '#f8a644', '#ffd888']); c.mat('coat', ['#14204e', '#203c8c', '#3260c4', '#568ee8', '#96c0ff'])
        c.mat('scarf', ['#66729a', '#a8b4d2', '#dfe6f6', '#ffffff']); c.mat('pants', ['#17172e', '#2c2c56', '#474a80', '#6e72ae']); c.mat('iris', ['#12306e', '#2f7ae0'])
    else:
        c.mat('hair', ['#9a5a10', '#d89a1c', '#ffd040', '#ffee90', '#ffffff']); c.mat('coat', ['#4a5aa0', '#8c9ce0', '#c8d4fa', '#eef2ff', '#ffffff'])
        c.mat('scarf', ['#b07818', '#e8b030', '#ffe070', '#fff8c8']); c.mat('pants', ['#28387a', '#4460b8', '#7090e8', '#a0bcff']); c.mat('iris', ['#a04a00', '#ffb020'])
        c.mat('blade', ['#a07a20', '#e0b840', '#ffe890', '#fffad0', '#ffffff'], 'metal', slot='blade')
    F = F or {}; R = Fig(c, RIO_B[F.get('body', 'stand')], F)
    R.body(RIO_BL)
    R.head(RIO_HEAD, LG(), (6, 14), eyes=((7, 9), (4, 9)), mouth=(4, 12))
    if aw:
        ox, oy = R.hd0
        for x, y, l in ((3, 1, 3), (3, 0, 2), (2, 1, 2), (4, 1, 2), (3, 2, 2), (13, 3, 3), (13, 2, 2), (12, 3, 2), (14, 3, 2), (13, 4, 2)): c.px(ox + x, oy + y - 1, 'gold', l, 9)
    if not R.P['noW']: R.blade(R.hF[0], R.hF[1], R.P['wa'], 11, z=F.get('armz', 6) - .5)
    R.arm('coat', hand='leather', cuff='scarf', z=F.get('armz', 6))
    return c

# ---------------------------------------------------------------- フレーム表（RS のフレーム構成に対応）
POSE = {
 'walk0': dict(body='walk0', hF=(1.5, 5), noW=True), 'walk1': dict(body='stand', hF=(-.5, 5.5), noW=True), 'walk2': dict(body='walk2', hF=(-2.5, 4.5), noW=True),
 'idle0': dict(body='idle', hF=(-4, 2.5), wa=58), 'idle1': dict(body='idle', hF=(-4, 3.2), wa=58, head=(0, 1)), 'blink': dict(body='idle', hF=(-4, 2.5), wa=58, face='b'),
 'run0': dict(body='lunge', hF=(1.5, 4), wa=12, face='a'), 'run1': dict(body='walk0', hF=(-1, 4), wa=12, face='a', head=(-1, 1), dy=-1), 'run2': dict(body='lunge', hF=(-3, 3), wa=12, face='a', dy=-1),
 'atk0': dict(body='idle', hF=(3.5, -4.5), wa=150, face='a', head=(1, 0), armz=2), 'atk1': dict(body='lunge', hF=(-6, 2), wa=-20, face='y', head=(-1, 1)),
 'atk2': dict(body='idle', hF=(3, 1.5), wa=5, face='a'), 'atk3': dict(body='lunge', hF=(-6.5, .5), wa=2, face='y', head=(-1, 1)),
 'cast0': dict(body='stand', hF=(-2, -3), wa=88, face='b'), 'cast1': dict(body='stand', hF=(-2, -3.6), wa=88, face='b', head=(0, -1)), 'cast2': dict(body='lunge', hF=(-6, -.5), wa=50, face='y'),
 'hit': dict(body='hit', hF=(-3, 3.5), wa=-40, face='x', head=(1, 0)), 'guard': dict(body='idle', hF=(-4, 1.5), wa=92, face='a'),
 'weak': dict(body='kneel', hF=(-4.5, .5), wa=-78, face='s', head=(-1, 1)), 'dead': dict(body='lying', hF=(-5, 1), wa=178, face='k', head=(0, 3), armz=2.5),
 'win0': dict(body='stand', hF=(-1.5, -5), wa=92, face='h', dy=-3), 'win1': dict(body='stand', hF=(-1.5, -5), wa=92, face='h'),
 'awk': dict(body='idle', hF=(-3.5, -1), wa=62, face='y', head=(0, -1)),
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
