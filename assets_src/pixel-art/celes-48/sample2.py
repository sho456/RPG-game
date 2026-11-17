import numpy as np,glob
from PIL import Image
U='/root/.claude/uploads/7176091a-0430-59f3-9df9-b25310439786/'
names=[('faint','5b90b102'),('cast','9399c80d')]
out={}
for n,h in names:
    a=np.asarray(Image.open(U+h+'-image.jpg').convert('RGB')).astype(float)
    best=None
    for off in range(36):
        cs=np.arange(off,a.shape[1]-36,36)
        # in-cell variance
        v=sum(a[:, c+6:c+30].std(axis=1).mean() for c in cs[::3])
        if best is None or v<best[0]: best=(v,off)
    ox=best[1]
    best=None
    for off in range(36):
        rs=np.arange(off,a.shape[0]-36,36)
        v=sum(a[r+6:r+30,:].std(axis=0).mean() for r in rs[::3])
        if best is None or v<best[0]: best=(v,off)
    oy=best[1]
    rows=np.arange(oy,a.shape[0]-35,36); cols=np.arange(ox,a.shape[1]-35,36)
    g=np.zeros((len(rows),len(cols),3))
    for i,r in enumerate(rows):
        for j,c in enumerate(cols):
            g[i,j]=np.median(a[r+9:r+27,c+9:c+27].reshape(-1,3),axis=0)
    print(n,ox,oy,g.shape)
    out[n]=g
    Image.fromarray(g.astype(np.uint8)).resize((g.shape[1]*8,g.shape[0]*8),Image.NEAREST).save(f'raw2_{n}.png')
np.savez('raw2.npz',**out)
