# シート（横並び）と、下絵・8 方向モデルとの比較の見本を作る
import numpy as np
from PIL import Image, ImageDraw
UP='/root/.claude/uploads/bedd3cd5-5585-5545-9f32-e8fa85e4aba7/'
SK={'front':'528e1013','side':'d9560582','ready':'345047bc','dying':'409d82e0','faint':'505063a7'}
KS=list(SK)
ims={k:Image.open(f'sprites/celes_hd_{k}.png') for k in KS}
# ゲーム用シート：立ち 4 枚（80×104）＋気絶（キャンバスを 96 幅にそろえ下寄せ）
sh=Image.new('RGBA',(80*4+ims['faint'].width,104),(0,0,0,0))
for i,k in enumerate(KS[:4]): sh.paste(ims[k],(i*80,0))
sh.paste(ims['faint'],(320,104-ims['faint'].height))
sh.save('sprites/celes_hd_sheet.png')
# 比較：上＝下絵（縮小）、下＝仕上げ（等倍のドット）、右端に 8 方向モデル
Z=4; BG=(58,64,92,255)
g=Image.open(UP+'16e608e2-image.gif'); g.seek(0); gif=g.convert('RGBA')
colw=[80,80,80,80,ims['faint'].width,64]
W=sum(colw)+10*6; H=104*2+30
P=Image.new('RGBA',(W,H),BG)
x=5
for i,k in enumerate(KS):
    s=Image.open(UP+SK[k]+'-image.jpg').convert('RGB')
    s=s.resize((int(s.width*104/s.height*1.0),104),Image.LANCZOS)
    c=Image.new('RGB',(colw[i],104),'white'); c.paste(s,((colw[i]-s.width)//2,0))
    P.paste(c,(x,0))
    im=ims[k]; P.paste(im,(x,104+30+104-im.height),im)
    x+=colw[i]+10
P.paste(gif,(x+2,104+30),gif)
P=P.resize((W*Z,H*Z),Image.NEAREST)
d=ImageDraw.Draw(P)
try:
    from PIL import ImageFont; f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',40)
except Exception: f=None
names=['正面','横','構え','瀕死','気絶','8方向モデル']
x=5
for i,n in enumerate(names):
    x+=colw[i]+10  # 文字は入れない（日本語のフォントが無いため）
P.convert('RGB').save('preview/celes_hd_preview.png')
# 戦闘の背景に置いた見本（等倍×3）
bg=Image.new('RGBA',(400,150))
a=np.zeros((150,400,4),np.uint8)
for y in range(150):
    t=y/150; a[y,:,:3]=np.array([20,24,52])*(1-t)+np.array([60,52,88])*t; a[y,:,3]=255
a[118:,:,:3]=[44,40,60]
bg=Image.fromarray(a)
for i,k in enumerate(['ready','front','side','dying']):
    im=ims[k]; bg.paste(im,(10+i*84,120-102),im)
bg.paste(ims['faint'],(10+4*84-30, 120-ims['faint'].height+2),ims['faint']) if False else None
bg.resize((1200,450),Image.NEAREST).convert('RGB').save('preview/celes_hd_mockup.png')
