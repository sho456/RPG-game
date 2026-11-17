# 星臨：専用パレット（銀河の色）で減色し、ほかと同じ手順で 48px に
import numpy as np
from collections import deque
from scipy import ndimage
g=np.load('aw_31.npy')
H,W=g.shape[:2]
light=(g.min(2)>242)&(np.ptp(g,2)<14)
m=np.zeros((H,W),bool);q=deque()
for y in range(H):
    for x in range(W):
        if (y in(0,H-1) or x in(0,W-1)) and light[y,x]:m[y,x]=1;q.append((y,x))
while q:
    y,x=q.popleft()
    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
        Y,X=y+dy,x+dx
        if 0<=Y<H and 0<=X<W and light[Y,X] and not m[Y,X]:m[Y,X]=1;q.append((Y,X))
px=g[~m];rng=np.random.default_rng(3);K=56
C=px[rng.choice(len(px),K,replace=False)]
for _ in range(50):
    lab=((px[:,None]-C[None])**2).sum(2).argmin(1)
    for k in range(K):
        if (lab==k).any():C[k]=px[lab==k].mean(0)
C=list(C);ch=True
while ch:
    ch=False
    for i in range(len(C)):
        for j in range(i+1,len(C)):
            if np.abs(C[i]-C[j]).max()<10:C[i]=(C[i]+C[j])/2;C.pop(j);ch=True;break
        if ch:break
C=np.array(C)
for a in np.array([[253,206,173],[240,157,121],[25,21,43],[253,253,253],[158,96,176],[110,60,140]],float):
    if np.abs(C-a).max(1).min()>12:C=np.vstack([C,a])
dist=((g[:,:,None]-C[None,None])**2).sum(3);qq=dist.argmin(2);qq[m]=-1
print('色数',len(C),'平均の色ずれ',round(float(np.sqrt(dist.min(2))[~m].mean()),1))
wi=int(np.argmax(C.sum(1)))
HAIR=[i for i,c in enumerate(C) if c.mean()>150 and i!=wi]
lab,k=ndimage.label(qq==wi)
for i in range(1,k+1):
    r=lab==i
    if r.sum()>=5:qq[r]=-1;continue
    nb=ndimage.binary_dilation(r)&~r;v=qq[nb]
    if np.isin(v,HAIR).sum()<len(v)*0.4:qq[r]=-1
ys,xs=np.where(qq>=0);qq=qq[ys.min():ys.max()+1,xs.min():xs.max()+1]
def cost(a,i):
    return min((a[i]!=a[i-1]).sum(),(a[i]!=a[i+1]).sum() if i+1<len(a) else 99)
h=qq.shape[0];dr=[]
for _ in range(h-48):
    cs=[(cost(qq,i),i) for i in range(1,len(qq)-1) if not (10<=i<=28 or any(abs(i-j)<=2 for j in dr))]
    c,i=min(cs);qq=np.delete(qq,i,0);dr.append(i)
cv=np.full((48,48),-1);hh,ww=qq.shape;x0=(48-ww)//2;cv[48-hh:,x0:x0+ww]=qq
np.save('aw_q.npy',cv);np.save('pal_aw.npy',C);print(qq.shape)
