import numpy as np
from PIL import Image,ImageDraw,ImageFont
C=np.load('pal.npy').round().astype(int)
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',s)
S=['turn','cmd','dying','ko'];T=['ターン開始（待機＝横向き）','コマンド選択（構え）','瀕死（HP 25% 未満）','戦闘不能']
keys=[tuple(C[i]) for i in (11,13,2,22,10)]
W=420;pad=24;top=70;zh=300
out=Image.new('RGB',(pad+4*(W+pad),top+860+zh+pad*2+40),(18,18,28));d=ImageDraw.Draw(out)
d.text((pad,18),'セレス 48px 実装の予想図（実際の戦闘画面でセレスの絵だけ差し替えて撮影）',font=F(26),fill=(235,230,250))
for i,(s,t) in enumerate(zip(S,T)):
    im=Image.open(f'mock_{s}.png').convert('RGB');a=np.asarray(im).astype(int)
    m=np.zeros(a.shape[:2],bool)
    for k in keys: m|=(np.abs(a-np.array(k)).max(2)<=8)
    m[:, :a.shape[1]//2]=False
    if s=='ko': cx,cy=prev[0],prev[1]+28
    else:
        ys,xs=np.where(m);cx,cy=int(np.median(xs)),int(np.median(ys))
    prev=(cx,cy)
    x=pad+i*(W+pad)
    out.paste(im.resize((W,860),Image.LANCZOS),(x,top))
    # 拡大（実機の 2 倍の画素をさらに 2 倍）
    cr=im.crop((cx-75,cy-75,cx+75,cy+75)).resize((zh,zh),Image.NEAREST)
    out.paste(cr,(x+(W-zh)//2,top+860+pad+30))
    d.rectangle([x+(W-zh)//2-1,top+860+pad+29,x+(W+zh)//2,top+860+pad+30+zh],outline=(120,110,160))
    d.text((x,top+860+6),t,font=F(22),fill=(250,220,120))
    # 画面の中の位置を枠で示す
    bx,by=cx/2,cy/2;d.rectangle([x+bx-38,top+by-38,x+bx+38,top+by+38],outline=(250,220,120),width=2)
out.save('celes48_mockup.png');print(out.size)
