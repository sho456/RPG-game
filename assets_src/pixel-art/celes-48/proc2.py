# 気絶・詠唱：既存の共通パレットに合わせて減色し、ほかのポーズと同じ縮み率で 48px に
import numpy as np
from collections import deque
from scipy import ndimage
C=np.load('pal.npy');d=np.load('raw2.npz')
HAIR=[i for i,c in enumerate(C) if np.ptp(c)<30 and c.mean()>115 and i!=7]
def bgmask(g):
    H,W=g.shape[:2];light=(g.min(2)>242)&(np.ptp(g,2)<14);m=np.zeros((H,W),bool);q=deque()
    for y in range(H):
        for x in range(W):
            if (y in(0,H-1) or x in(0,W-1)) and light[y,x]:m[y,x]=1;q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            Y,X=y+dy,x+dx
            if 0<=Y<H and 0<=X<W and light[Y,X] and not m[Y,X]:m[Y,X]=1;q.append((Y,X))
    return m
def cost(a,i):
    up=(a[i]!=a[i-1]).sum();dn=(a[i]!=a[i+1]).sum() if i+1<len(a) else 99;return min(up,dn)
def drop(a,k,protect):
    a=a.copy();dr=[]
    for _ in range(k):
        cs=[(cost(a,i),i) for i in range(1,len(a)-1) if not protect(i,dr)];c,i=min(cs);a=np.delete(a,i,0);dr.append(i)
    return a
OUT={}
for n in d:
    g=d[n];m=bgmask(g)
    dist=((g[:,:,None]-C[None,None])**2).sum(3);q=dist.argmin(2);err=np.sqrt(dist.min(2))
    q[m]=-1;print(n,'最大の色ずれ',int(err[~m].max()),'平均',round(float(err[~m].mean()),1))
    lab,k=ndimage.label(q==7)
    for i in range(1,k+1):
        r=lab==i
        if r.sum()>=5:q[r]=-1;continue
        nb=ndimage.binary_dilation(r)&~r;v=q[nb]
        if np.isin(v,HAIR).sum()<len(v)*0.4:q[r]=-1
    ys,xs=np.where(q>=0);q=q[ys.min():ys.max()+1,xs.min():xs.max()+1]
    h,w=q.shape
    if n=='cast':
        q=drop(q,h-48,lambda i,dr:10<=i<=28 or any(abs(i-j)<=2 for j in dr))
    else:
        kr=round(h*(1-48/53));kc=round(w*(1-48/53))
        q=drop(q,kr,lambda i,dr:any(abs(i-j)<=2 for j in dr))
        q=drop(q.T,kc,lambda i,dr:any(abs(i-j)<=2 for j in dr)).T
    cv=np.full((48,48),-1);hh,ww=q.shape;x0=(48-ww)//2;cv[48-hh:,x0:x0+ww]=q
    OUT[n]=cv;print(n,(h,w),'->',(hh,ww))
np.savez('s2.npz',**OUT)
