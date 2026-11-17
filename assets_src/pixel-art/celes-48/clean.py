import numpy as np
C=np.load('pal.npy');Q=dict(np.load('s.npz'))
sat=np.ptp(C,1); lum=C.mean(1)
MUT=[i for i in range(len(C)) if 60<lum[i]<140 and sat[i]<70 and not (C[i][2]>C[i][0]+25)]
print('muted',[tuple(C[i].astype(int)) for i in MUT])
for n in Q:
    q=Q[n].copy()
    for x in range(48):
        for _ in range(2):
            ys=np.where(q[:,x]>=0)[0]
            if len(ys)==0: break
            y=ys.max()
            if y>=44 and q[y,x] in MUT and (y==47 or q[y+1,x]<0): q[y,x]=-1
            else: break
    # stray light pixels at feet
    for y in range(42,48):
        for x in range(48):
            if q[y,x]>=0 and lum[q[y,x]]>150:
                nb=[q[yy,xx] for yy,xx in((y-1,x),(y+1,x),(y,x-1),(y,x+1)) if 0<=yy<48 and 0<=xx<48]
                if sum(v<0 for v in nb)>=1 and sum(v>=0 and lum[v]>150 for v in nb)==0: q[y,x]=-1
    # re-align bottom
    ys=np.where((q>=0).any(1))[0]; sh=47-ys.max()
    if sh>0: q=np.vstack([np.full((sh,48),-1),q[:48-sh]])
    Q[n]=q
np.savez('c.npz',**Q)
BR=[i for i in range(len(C)) if tuple(C[i].astype(int)) in [(125,86,43),(113,81,76)]]
OUTL=int(np.argmin(lum))
for n in Q:
    q=Q[n]
    for y in range(44,48):
        for x in range(48):
            if q[y,x] in BR and (y==47 or q[y+1,x]<0 or q[y+1,x]==OUTL): q[y,x]=OUTL
np.savez('c.npz',**Q)
PUR=[0,2,15,23,29]; BL=[18,21,6,24]
for n in Q:
    q=Q[n]
    for y in range(42,48):
        for x in range(48):
            if q[y,x] in BL and q[y-1,x] in PUR+[28,3,19]: q[y,x]=29
np.savez('c.npz',**Q)
