# ===== セレス 正本の原画（通常・正面／星臨）の仕上げ：背景の透過・パレットへの減色・ゴミ取り・足元そろえ =====
# master.py の後に：python3 master_build.py → sprites/celes_master_{front,seirin}.png・sprites/palette_{front,seirin}.npy
# 手順は build.py と同じ（関数をそのまま使う）。星臨は銀河の色が多いので別のパレット・色数を多めに。
import numpy as np
from PIL import Image
from scipy import ndimage as nd

class KMeans:
    def __init__(s,k,n_init=1,random_state=0): s.k=k; s.rs=random_state
    def fit(s,X):
        r=np.random.RandomState(s.rs)
        # k-means++ 風の初期値
        C=[X[r.randint(len(X))]]
        for _ in range(s.k-1):
            d=((X[:,None]-np.array(C)[None])**2).sum(-1).min(1); C.append(X[r.choice(len(X),p=d/d.sum())])
        C=np.array(C,float)
        for _ in range(40):
            l=((X[:,None]-C[None])**2).sum(-1).argmin(1)
            for j in range(s.k):
                if (l==j).any(): C[j]=X[l==j].mean(0)
        s.cluster_centers_=C; return s

def lum(c): return c@np.array([.299,.587,.114])
def alpha_mask(a):
    white=(a.min(2)>=226)&((a.max(2)-a.min(2))<22)
    lab,n=nd.label(white)
    bg=np.zeros(white.shape,bool)
    edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    for l in edge: bg|=lab==l
    # 閉じた白（杖と体の隙間など）：まわりがほぼ輪郭の黒なら背景
    dark=lum(a.reshape(-1,3)).reshape(a.shape[:2])<80
    for l in range(1,n+1):
        if l in edge: continue
        m=lab==l
        ring=nd.binary_dilation(m)&~m
        if m.sum()>=3 and dark[ring].mean()>0.45 and (a[m].min()>=232) and not (np.abs(a[ring]-[78,153,227]).sum(1)<120).any(): bg|=m
    return ~bg

CW,CH=84,112
for k,ncol in [('front',40),('seirin',52)]:
    a=np.asarray(Image.open(f'src/master/celes_{k}_raw.png').convert('RGB')).astype(float)
    m=alpha_mask(a)
    km=KMeans(ncol,random_state=1).fit(a[m])
    pal=np.clip(np.round(km.cluster_centers_),0,255); pal=pal[np.argsort(lum(pal))]
    keep=[]
    for c in pal:
        if all(np.sqrt(((c-q)**2).sum())>(16 if lum(c)<70 else 12) for q in keep): keep.append(c)
    pal=np.array(keep); np.save(f'sprites/palette_{k}.npy',pal)
    def clean(idx,m):
        # 4 近傍がすべて同じ色で自分だけ違う 1 ドット → 近傍の色に
        for _ in range(2):
            H,W=idx.shape; ch=0
            for y in range(1,H-1):
                for x in range(1,W-1):
                    if not m[y,x]: continue
                    nb=[(y-1,x),(y+1,x),(y,x-1),(y,x+1)]
                    if not all(m[p] for p in nb): continue
                    v=[idx[p] for p in nb]
                    if len(set(v))==1 and v[0]!=idx[y,x] and abs(lum(pal[v[0]])-lum(pal[idx[y,x]]))<60:
                        idx[y,x]=v[0]; ch+=1
            if not ch: break
        return idx
    # 透過の境目でにじんだ白っぽい 1 ドットを削る
    for _ in range(2):
        er=m&~nd.binary_erosion(m)
        halo=er&(a.min(2)>200)&((a.max(2)-a.min(2))<30)
        m=m&~halo
    d=((a[...,None,:]-pal[None,None])**2).sum(-1); idx=d.argmin(-1)
    idx=clean(idx,m)
    # 外側の輪郭：透明に接する明るいドットの外に輪郭が無ければ黒を足す
    rgb=pal[idx]
    edge=m&~nd.binary_erosion(m,structure=[[0,1,0],[1,1,1],[0,1,0]])
    light=edge&(lum(rgb)>90)
    add=nd.binary_dilation(light,structure=[[0,1,0],[1,1,1],[0,1,0]])&~m
    m2=m|add; idx[add]=0
    rgba=np.zeros(a.shape[:2]+(4,),np.uint8); rgba[...,:3]=pal[idx]; rgba[...,3]=m2*255
    # 輪郭からとげのように飛び出した 1 ドット（8 近傍に不透明が 1 つ以下）を削る
    for _ in range(3):
        op=rgba[...,3]>0
        cnt=nd.convolve(op.astype(int),np.ones((3,3)),mode='constant')-op
        sp=op&(cnt<=1)
        if not sp.any(): break
        rgba[sp]=0
    # 中間の暗さのにごった色が透明に接して孤立しているもの（JPEG のよごれ）を削る
    op=rgba[...,3]>0
    nb4=nd.convolve(op.astype(int),np.array([[0,1,0],[1,0,1],[0,1,0]]),mode='constant')
    rc=rgba[...,:3].astype(float); sat=rc.max(2)-rc.min(2)
    dirt=op&(nb4<=2)&(lum(rc)>50)&(lum(rc)<140)&(sat<70)
    rgba[dirt]=0
    # 小さな浮いたゴミ（2 ドット以下）を消す
    lab,n=nd.label(m2,structure=np.ones((3,3)))
    for l in range(1,n+1):
        if (lab==l).sum()<=6: rgba[lab==l]=0
    r=rgba; ys,xs=np.where(r[...,3]>0); crop=r[ys.min():ys.max()+1, xs.min():xs.max()+1]; h,w=crop.shape[:2]
    can=np.zeros((CH,CW,4),np.uint8); oy=CH-2-h
    foot=crop[-8:,:,3]>0; fx=np.where(foot)[1].mean(); ox=max(0,min(CW-w,int(round(CW/2-fx))))
    can[oy:oy+h,ox:ox+w]=crop
    Image.fromarray(can).save(f'sprites/celes_master_{k}.png')
    print(k,'bbox',w,h,'pal',len(pal),'colors',len(np.unique(crop[crop[...,3]>0][:,:3],axis=0)))
