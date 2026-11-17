import numpy as np
from scipy import ndimage
C=np.load('pal.npy');Q=dict(np.load('q.npz'))
wi=int(np.argmax(C.sum(1)))
HAIR=[i for i,c in enumerate(C) if np.ptp(c)<30 and c.mean()>115 and i!=wi]
for n in Q:
    q=Q[n]
    lab,k=ndimage.label(q==wi)
    for i in range(1,k+1):
        r=lab==i
        if r.sum()>=5: q[r]=-1;continue
        nb=ndimage.binary_dilation(r)&~r
        v=q[nb]; hair=np.isin(v,HAIR).sum()
        if hair<len(v)*0.4: q[r]=-1
    Q[n]=q
def cost(a,i):
    up=(a[i]!=a[i-1]).sum(); dn=(a[i]!=a[i+1]).sum() if i+1<len(a) else 99
    return min(up,dn)
def drop(a,k,protect):
    a=a.copy(); dropped=[]
    for _ in range(k):
        cs=[(cost(a,i),i) for i in range(1,len(a)-1) if not protect(i,dropped)]
        c,i=min(cs); a=np.delete(a,i,0); dropped.append(i)
    return a
OUT={}
for n in Q:
    q=Q[n]
    ys,xs=np.where(q>=0); q=q[ys.min():ys.max()+1, xs.min():xs.max()+1]
    h=q.shape[0]
    # protect face rows (approx 18-27 of crop) and avoid adjacent drops
    q=drop(q,h-48,lambda i,d: 10<=i<=28 or any(abs(i-j)<=2 for j in d))
    # columns: shrink width by same ratio

    # place on 48x48, bottom aligned, centered
    canvas=np.full((48,48),-1)
    hh,ww=q.shape; x0=(48-ww)//2
    canvas[48-hh:,x0:x0+ww]=q
    OUT[n]=canvas; print(n,h,'->',hh,'w',ww)
np.savez('s.npz',**OUT)
