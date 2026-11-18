# 下絵（AI 生成の拡大 JPG）のマス目を測り、1 マス＝1 ドットに戻す
import sys, json, numpy as np
from PIL import Image
UP='/root/.claude/uploads/bedd3cd5-5585-5545-9f32-e8fa85e4aba7/'
SK={'side':'d9560582','ready':'345047bc','dying':'409d82e0','front':'528e1013','faint':'505063a7'}
def fit(g):
    n=len(g); best=None
    for p in [22.53]:
        for ph in np.arange(0,p,0.5):
            idx=np.round(np.arange(ph,n-1,p)).astype(int); idx=idx[idx<n]
            s=g[idx].mean()
            if best is None or s>best[0]: best=(s,p,ph)
    return best[1],best[2]
info={}
for k,f in SK.items():
    a=np.asarray(Image.open(UP+f+'-image.jpg').convert('RGB')).astype(float)
    L=a.mean(2)
    gx=np.abs(np.diff(L,axis=1)).sum(0); gy=np.abs(np.diff(L,axis=0)).sum(1)
    px,phx=fit(gx); py,phy=fit(gy)
    # 境目は diff の i と i+1 の間 → セルは [ph+0.5+k*p, ...)
    xs=np.arange(phx+0.5,a.shape[1]-px,px); ys=np.arange(phy+0.5,a.shape[0]-py,py)
    out=np.zeros((len(ys),len(xs),3),np.uint8)
    for j,y in enumerate(ys):
        for i,x in enumerate(xs):
            c=a[int(y+py*.25):int(y+py*.75)+1, int(x+px*.25):int(x+px*.75)+1].reshape(-1,3)
            out[j,i]=np.median(c,0)
    Image.fromarray(out).save(f'src/sketch_{k}.png')
    info[k]=dict(px=round(px,3),py=round(py,3),size=[len(xs),len(ys)])
    print(k,info[k])
