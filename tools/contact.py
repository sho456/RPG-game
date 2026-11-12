#!/usr/bin/env python3
"""コンタクトシート生成: PNG群を整数倍・最近傍で並べる。
usage: contact.py <out.png> <scale> <cols> <bg hex> <png...>   （ラベル=ファイル名）"""
import sys,os
from PIL import Image,ImageDraw
def sheet(paths,out,scale=2,cols=8,bg='#3a4a3a',cell=None,labels=None,sil=False):
    ims=[Image.open(p).convert('RGBA') for p in paths]
    cw=cell[0] if cell else max(i.width for i in ims); ch=cell[1] if cell else max(i.height for i in ims)
    rows=(len(ims)+cols-1)//cols; lab=10
    W=cols*(cw*scale+6)+6; H=rows*(ch*scale+lab+8)+6
    sh=Image.new('RGBA',(W,H),bg); d=ImageDraw.Draw(sh)
    for n,im in enumerate(ims):
        if sil:
            a=im.split()[3]; im=Image.new('RGBA',im.size,(0,0,0,255)); im.putalpha(a)
        x=6+(n%cols)*(cw*scale+6); y=6+(n//cols)*(ch*scale+lab+8)
        big=im.resize((im.width*scale,im.height*scale),Image.NEAREST)
        sh.alpha_composite(big,(x+(cw*scale-big.width)//2,y+(ch*scale-big.height)))
        d.text((x,y+ch*scale+1),(labels[n] if labels else os.path.splitext(os.path.basename(paths[n]))[0])[:int(cw*scale/5.5)+2],fill='#ffffff')
    sh.save(out); return sh
if __name__=='__main__':
    out,scale,cols,bg=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
    sheet(sys.argv[5:],out,scale,cols,bg)
