import numpy as np
from PIL import Image
from collections import deque
d=np.load('raw.npz'); N=['front','side','ready','dying']
G={n:d[n][0:55,:].copy() for n in N}
H,W=55,48
# 1) background: flood from border over light low-sat pixels
def bgmask(g):
    light=(g.min(2)>215)&(np.ptp(g,2)<30)
    m=np.zeros(light.shape,bool);q=deque()
    for y in range(H):
        for x in range(W):
            if (y in(0,H-1) or x in(0,W-1)) and light[y,x]: m[y,x]=1;q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            Y,X=y+dy,x+dx
            if 0<=Y<H and 0<=X<W and light[Y,X] and not m[Y,X]: m[Y,X]=1;q.append((Y,X))
    return m
M={n:bgmask(G[n]) for n in N}
# 2) shared palette via k-means
px=np.concatenate([G[n][~M[n]] for n in N])
rng=np.random.default_rng(1);K=56
C=px[rng.choice(len(px),K,replace=False)]
for _ in range(40):
    lab=((px[:,None]-C[None])**2).sum(2).argmin(1)
    for k in range(K):
        if (lab==k).any(): C[k]=px[lab==k].mean(0)
# merge near colors
def merge(C,t=11):
    C=list(C);ch=True
    while ch:
        ch=False
        for i in range(len(C)):
            for j in range(i+1,len(C)):
                if np.abs(C[i]-C[j]).max()<t: C[i]=(C[i]+C[j])/2;C.pop(j);ch=True;break
            if ch:break
    return np.array(C)
C=merge(C)
anch=np.array([[253,206,173],[240,157,121],[158,96,176],[110,60,140],[150,205,230],[165,80,60]],float)
for a in anch:
    if np.abs(C-a).max(1).min()>12: C=np.vstack([C,a])
print('palette',len(C))
Q={}
for n in N:
    idx=((G[n][:,:,None]-C[None,None])**2).sum(3).argmin(2)
    idx[M[n]]=-1; Q[n]=idx
np.save('pal.npy',C)
np.savez('q.npz',**Q)
