import numpy as np
C=np.load('pal.npy');Q=dict(np.load('s2.npz'));lum=C.mean(1);sat=np.ptp(C,1)
MUT=[i for i in range(len(C)) if 60<lum[i]<140 and sat[i]<70 and not (C[i][2]>C[i][0]+25)]
for n in Q:
    q=Q[n]
    # 足元のにじみ・外周の孤立した明るい点
    for x in range(48):
        for _ in range(2):
            ys=np.where(q[:,x]>=0)[0]
            if len(ys)==0:break
            y=ys.max()
            if y>=44 and q[y,x] in MUT and (y==47 or q[y+1,x]<0):q[y,x]=-1
            else:break
    for y in range(48):
        for x in range(48):
            if q[y,x]>=0 and lum[q[y,x]]>150:
                nb=[q[yy,xx] for yy,xx in((y-1,x),(y+1,x),(y,x-1),(y,x+1)) if 0<=yy<48 and 0<=xx<48]
                if sum(v>=0 for v in nb)<=1: q[y,x]=-1
    if n=='faint':
        # 下絵がぼやけて輪郭が欠けた所に 1 ドットの輪郭を足す
        add=[]
        for y in range(48):
            for x in range(48):
                if q[y,x]<0:
                    for yy,xx in((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                        if 0<=yy<48 and 0<=xx<48 and q[yy,xx]>=0 and lum[q[yy,xx]]>110: add.append((y,x));break
        for y,x in add:q[y,x]=9
    ys=np.where((q>=0).any(1))[0];sh=47-ys.max()
    if sh>0:q=np.vstack([np.full((sh,48),-1),q[:48-sh]])
    Q[n]=q
np.savez('c2.npz',**Q)
