/* ===== ver0.36 武器・防具・装飾品のアイコンを作り直す（IC36） =====
 ・大きさ 32×32（以前は 24×24）。形を部品（刃・鍔・柄・宝石・飾り）から組み立て、素材の段階（銅・鉄・鋼・星鋼）で飾りが増える
 ・陰影は自動：光は左上から。部品ごとに「面の左上の縁＝明るい／右下の縁＝暗い」を付け、部品どうしの境目にも影が入る
 ・輪郭は、隣の部品のいちばん暗い色（黒一色にしない）。レアリティが高いと光の縁取りときらめき
 ・道具・素材・宝石のアイコンは今まで（js/v21-items.js の IC21）のまま。ここで定義した名前だけ差し替える
 絵はすべてコードで描いている（画像生成は使っていない） */
'use strict';
const IC36=(()=>{
const N=32;
/* ---------- 色（明るい → 暗い の 5 段。0 は光の当たる角、4 は輪郭） ---------- */
const P={
 copper:['#ffe2c0','#f2a868','#c8743c','#8a4622','#3e1c0c'],iron:['#f4f6fa','#c8ced8','#8e96a8','#5a6074','#23262f'],
 steel:['#ffffff','#dcefff','#9ec8ec','#5a86ba','#1c3460'],star:['#ffffff','#f4eeff','#cbbcff','#8d70e0','#2e1c6a'],
 gold:['#fffbe0','#ffe27a','#e0a830','#9c6614','#40240a'],brass:['#fff0c0','#e8c060','#b88a30','#7a561a','#38240a'],
 silver:['#ffffff','#eef2f8','#bcc4d4','#7c869c','#2c3040'],dark:['#b8b0c8','#6c6480','#46405a','#2a2638','#100c18'],
 leather:['#e8b888','#b07a44','#7e522c','#52321a','#24140a'],wood:['#f2cc94','#c48a50','#8e5c30','#5e3a1a','#2a180a'],
 bone:['#ffffff','#f4ecd8','#d8ccb0','#a89878','#4a3e2c'],paper:['#ffffff','#fbf5e4','#e2d6b8','#b0a07c','#4e4230'],
 red:['#ffd8c8','#f07060','#c03c3c','#7e1c26','#320810'],blue:['#d8ecff','#6aa8ff','#3a6ad8','#22388e','#0c1240'],
 green:['#e0ffd8','#7ee08a','#38a860','#1e6a3e','#08281a'],purple:['#f0dcff','#b480f0','#7c48c8','#4a2488','#1c0a3c'],
 teal:['#d8fff6','#6ee0d0','#2aa8a0','#18686a','#062a2e'],orange:['#fff0c8','#ffb850','#f07a20','#a84410','#401808'],
 navy:['#c8d4ff','#5a6ac8','#323e94','#1c2360','#0a0c28'],ivory:['#ffffff','#fff8e8','#ece0c4','#bcaa84','#4e4430'],
 black:['#a098b0','#5c5468','#38324a','#221e30','#0a0810'],crimson:['#ffc8c8','#e04a4a','#a81c2a','#600c18','#24040a'],
 ice:['#ffffff','#e4f8ff','#a8e4ff','#5aaee0','#1a4a80'],sand:['#fffae0','#ffe8a0','#e8c068','#b08a3a','#4a3410'],
 glass:['#ffffff','#e8f8ff','#bfe4f4','#86b8d8','#3a5a78'],flame:['#ffffff','#fff2a0','#ffc040','#ff7a20','#902a08'],
 skin:['#fff0e0','#f8d0b0','#e0a888','#a87058','#4a2a1c'],fur:['#ffffff','#f2e2c8','#d0b088','#96744e','#40301c'],
 gemR:['#ffffff','#ffb0b8','#ff3c5a','#b0102e','#4a0410'],gemB:['#ffffff','#b8e4ff','#3ca0ff','#1450c0','#081a50'],
 gemG:['#ffffff','#b8ffd0','#30d878','#0a8a44','#03301a'],gemV:['#ffffff','#e8c8ff','#b060ff','#6a20c0','#240848'],
 gemA:['#ffffff','#fff0b0','#ffc030','#c07800','#4a2c00'],gemW:['#ffffff','#ffffff','#e8f4ff','#a8c8e8','#3a5070']};
/* 素材の段階：金属・飾り・柄・宝石。lv は飾りの多さ（0〜3） */
const TIER={'銅':{lv:0,m:P.copper,t:P.brass,g:P.leather,c:P.red,gem:null},'鉄':{lv:1,m:P.iron,t:P.dark,g:P.leather,c:P.navy,gem:null},
 '鋼':{lv:2,m:P.steel,t:P.silver,g:P.blue,c:P.blue,gem:P.gemB},'星鋼':{lv:3,m:P.star,t:P.gold,g:P.purple,c:P.purple,gem:P.gemV,glow:'#c8b4ff'}};

/* ---------- 描く道具 ---------- */
function Canvas(){const M=new Int16Array(N*N).fill(-1),T=new Int8Array(N*N).fill(-1),mats=[],idx=new Map();
 const mat=(r,o)=>{const key=r.join()+(o?JSON.stringify(o):'');if(idx.has(key))return idx.get(key);mats.push(Object.assign({r},o||{}));idx.set(key,mats.length-1);return mats.length-1;};
 const put=(k,x,y,t)=>{x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=N||y>=N)return;M[y*N+x]=k;T[y*N+x]=t==null?-1:t;};
 const box=(pts,f)=>{let x0=N,y0=N,x1=0,y1=0;for(const[x,y]of pts){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  for(let y=Math.max(0,Math.floor(y0-1));y<=Math.min(N-1,Math.ceil(y1+1));y++)for(let x=Math.max(0,Math.floor(x0-1));x<=Math.min(N-1,Math.ceil(x1+1));x++)f(x,y,x+.5,y+.5);};
 const inPoly=(pts,px,py)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)c=!c;}return c;};
 const C={M,T,mats,mat,
  poly(r,pts,t,o){const k=mat(r,o);box(pts,(x,y,px,py)=>{if(inPoly(pts,px,py))put(k,x,y,t);});return C;},
  /* 太さ w の線（両端は丸い） */
  cap(r,x0,y0,x1,y1,w,t,o){const k=mat(r,o),dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1e-9,h=w/2;box([[x0-h,y0-h],[x1+h,y1+h],[x0+h,y0+h],[x1-h,y1-h]],(x,y,px,py)=>{const u=Math.max(0,Math.min(1,((px-x0)*dx+(py-y0)*dy)/L2)),qx=x0+dx*u-px,qy=y0+dy*u-py;if(qx*qx+qy*qy<=h*h)put(k,x,y,t);});return C;},
  ell(r,cx,cy,rx,ry,t,o){const k=mat(r,o);box([[cx-rx,cy-ry],[cx+rx,cy+ry]],(x,y,px,py)=>{const a=(px-cx)/rx,b=(py-cy)/ry;if(a*a+b*b<=1)put(k,x,y,t);});return C;},
  /* 楕円の輪（太さ th）。a0〜a1（ラジアン）の範囲だけ描ける */
  ring(r,cx,cy,rx,ry,th,t,o,a0,a1){const k=mat(r,o);box([[cx-rx-1,cy-ry-1],[cx+rx+1,cy+ry+1]],(x,y,px,py)=>{const a=(px-cx)/rx,b=(py-cy)/ry,d=Math.sqrt(a*a+b*b),ri=1-th/Math.min(rx,ry);if(d<=1&&d>=ri){if(a0!=null){let an=Math.atan2(py-cy,px-cx);if(an<a0)an+=6.2832;if(an>a1)return;}put(k,x,y,t);}});return C;},
  rect(r,x,y,w,h,t,o){const k=mat(r,o);for(let j=0;j<h;j++)for(let i=0;i<w;i++)put(k,x+i,y+j,t);return C;},
  px(r,x,y,t,o){put(mat(r,o),x,y,t);return C;},
  erase(x,y){if(x>=0&&y>=0&&x<N&&y<N){M[y*N+x]=-1;T[y*N+x]=-1;}return C;},
  get(x,y){return x<0||y<0||x>=N||y>=N?-1:M[y*N+x];},
  /* 左右対称：描いたあと、左半分を右へ写す（右半分は影の側なので、明暗は自動で付く） */
  mirror(){for(let y=0;y<N;y++)for(let x=0;x<N/2;x++){M[y*N+N-1-x]=M[y*N+x];T[y*N+N-1-x]=T[y*N+x];}return C;}};
 /* 斜めの軸（左下 → 右上）：t＝長さ方向、o＝横へのずれ（＋は右下側） */
 const O=[4.2,27.8],U=[.7071,-.7071],V=[.7071,.7071];
 C.d=(t,o)=>[O[0]+U[0]*t+V[0]*o,O[1]+U[1]*t+V[1]*o];
 C.dpoly=(r,pts,t,o)=>C.poly(r,pts.map(p=>C.d(p[0],p[1])),t,o);
 C.dcap=(r,t0,o0,t1,o1,w,t,o)=>{const a=C.d(t0,o0),b=C.d(t1,o1);return C.cap(r,a[0],a[1],b[0],b[1],w,t,o);};
 C.dell=(r,t,o,rx,ry,tn,op)=>{const p=C.d(t,o);return C.ell(r,p[0],p[1],rx,ry,tn,op);};
 C.dpx=(r,t,o,tn,op)=>{const p=C.d(t,o);return C.px(r,p[0],p[1],tn,op);};
 /* 曲線（点列）に沿った太さの変わる線 */
 C.curve=(r,pts,w0,w1,t,o)=>{for(let i=0;i<pts.length-1;i++){const u=i/(pts.length-1);C.cap(r,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],w0+(w1-w0)*u,t,o);}return C;};
 return C;}

/* ---------- 陰影・輪郭・仕上げ ---------- */
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function shade(C){const{M,T,mats}=C,out=new Array(N*N).fill(null);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=M[y*N+x];if(k<0)continue;const m=mats[k],r=m.r;let t=T[y*N+x];
  if(t<0){if(m.flat!=null)t=m.flat;else{const s=(C.get(x,y-1)===k?0:-1)+(C.get(x-1,y)===k?0:-1)+(C.get(x,y+1)===k?0:1)+(C.get(x+1,y)===k?0:1);
    t=s<=-2?(m.shine?0:1):s===-1?1:s===0?2:3;
    /* 内側の段：縁から 2 ドット目の暗い側はもう一段暗く（丸みを出す） */
    if(t===2&&m.round&&(C.get(x+2,y)!==k||C.get(x,y+2)!==k))t=3;
    if(m.emit&&t>2)t=2;}}
  out[y*N+x]=r[t];}
 /* 輪郭：部品の外側を、その部品のいちばん暗い色で囲む */
 const ol=new Array(N*N).fill(null);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(M[y*N+x]>=0)continue;let c=null;for(const[dx,dy]of[[0,1],[1,0],[0,-1],[-1,0]]){const k=C.get(x+dx,y+dy);if(k>=0&&!mats[k].noline){c=mats[k].r[4];break;}}if(c)ol[y*N+x]=c;}
 for(let i=0;i<N*N;i++)if(ol[i])out[i]=ol[i];return out;}
const SP=[[2,2],[29,29],[2,28],[29,3],[2,15],[29,16],[15,1],[16,30],[6,3],[26,28]];
function finish(px,rar,glow){const a=px.slice(),free=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&!a[y*N+x];
 const auraC=glow||(rar>=4?'#ffa040':rar>=3?'#c08cff':null);const alpha=new Array(N*N).fill(255);
 if(auraC&&rar>=3){for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(a[y*N+x])continue;if(px[(y)*N+x+1]&&x<N-1||px[y*N+x-1]&&x>0||px[(y+1)*N+x]&&y<N-1||px[(y-1)*N+x]&&y>0){a[y*N+x]=auraC;alpha[y*N+x]=rar>=4?150:110;}}}
 const ns=rar>=4?3:rar>=3?2:rar>=2?1:0,sc=rar>=4?'#ffe27a':rar>=3?'#e0c8ff':'#bfe0ff';let k=0;
 for(const[x,y]of SP){if(k>=ns)break;const big=k===0&&rar>=4,pts=big?[[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]:[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
  if(!pts.every(([u,v])=>free(x+u,y+v)))continue;pts.forEach(([u,v])=>{a[(y+v)*N+x+u]=u||v?sc:'#ffffff';alpha[(y+v)*N+x+u]=255;});k++;}
 return{a,alpha};}
function toURL(px,alpha){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),id=g.createImageData(N,N);
 for(let i=0;i<N*N;i++){if(!px[i])continue;const[r,gg,b]=hex(px[i]);id.data[i*4]=r;id.data[i*4+1]=gg;id.data[i*4+2]=b;id.data[i*4+3]=alpha?alpha[i]:255;}g.putImageData(id,0,0);return c.toDataURL();}

/* ---------- 部品 ---------- */
/* 柄の巻き：t0〜t1 を pitch ごとに暗い段で巻く */
function grip(C,r,t0,t1,w,pitch=1.6){C.dcap(r,t0,0,t1,0,w);for(let t=t0+.6;t<t1;t+=pitch)C.dcap(r,t,-w*.5,t+.5,w*.5,.8,3);}
function gem(C,r,x,y,rx,ry){C.ell(r,x,y,rx,ry==null?rx:ry,null,{flat:2});C.px(r,Math.floor(x-rx*.35),Math.floor(y-(ry||rx)*.35),0);if(rx>=1.6)C.px(r,Math.floor(x+rx*.3),Math.floor(y+(ry||rx)*.3),3);return C;}
function dgem(C,r,t,o,s){const p=C.d(t,o);return gem(C,r,p[0],p[1],s,s);}
/* 片刃・両刃の刃（斜めの軸）。tip＝切っ先の長さ、ridge＝しのぎの明るい線 */
function blade(C,r,t0,t1,w,o={}){const tip=o.tip||3.4,w2=o.w2==null?w:o.w2,cu=o.curve||0;
 const pts=[];const n=8;for(let i=0;i<=n;i++){const t=t0+(t1-t0)*i/n,ww=w+(w2-w)*i/n,c=cu*Math.sin(i/n*3.1416);pts.push([t,-ww+c]);}pts.push([t1+tip,(o.tipo||0)+cu*0]);for(let i=n;i>=0;i--){const t=t0+(t1-t0)*i/n,ww=w+(w2-w)*i/n,c=cu*Math.sin(i/n*3.1416);pts.push([t,ww*(o.single?.35:1)+c]);}
 C.dpoly(r,pts,null,{shine:1});
 if(o.ridge!==0)C.dcap(r,t0+.8,(cu?cu*.5:0),t1+tip*.4,0,Math.max(.7,w*.32),o.ridgeT==null?1:o.ridgeT);
 if(o.fuller)C.dcap(r,t0+1,0,t0+(t1-t0)*o.fuller,0,Math.max(.8,w*.35),3);
 if(o.edge)C.dcap(o.edge,t0+1,-w+.2,t1+tip*.5,-.2,.8,null,{flat:1,noline:1});return C;}
function guard(C,r,t,half,th,o={}){C.dpoly(r,[[t,-half],[t+th,-half+(o.sweep||0)],[t+th,half+(o.sweep||0)],[t,half]]);if(o.balls){C.dell(r,t+th/2,-half-.6,1.3,1.3);C.dell(r,t+th/2,half+.6+(o.sweep||0),1.3,1.3);}return C;}

/* ---------- 武器 ---------- */
const W={};
W.sword=(C,T,x={})=>{const lv=T.lv;
 C.dell(T.t,.9,0,1.9,1.9);if(lv>=2)dgem(C,x.pgem||T.gem||P.gemR,.9,0,.9);
 grip(C,x.grip||T.g,1.8,8,2.2);
 guard(C,x.guardC||T.t,8.2,lv>=2?5.6:4.6,1.8,{balls:lv>=1});
 if(lv>=3||x.ggem)dgem(C,x.ggem||T.gem,9.1,0,1.2);
 blade(C,x.blade||T.m,10,26.6,lv>=2?2.1:1.9,{tip:3.6,fuller:lv>=1?.7:0,edge:lv>=3?P.ice:null});};
W.gsword=(C,T,x={})=>{const lv=T.lv;
 C.dell(T.t,.6,0,2.1,2.1);grip(C,x.grip||T.g,1.6,7.4,2.4,1.4);
 C.dpoly(x.guardC||T.t,[[7.4,-6.4],[9.6,-6.4],[10.4,-4],[10.4,4],[9.6,6.4],[7.4,6.4],[8.2,4],[8.2,-4]]);
 if(lv>=2)dgem(C,x.ggem||T.gem||P.gemR,8.9,0,1.4);
 C.dpoly(x.blade||T.m,[[10.4,-2.4],[12.4,-2.4],[12.4,-3.6],[27,-3.6],[30.6,0],[27,3.6],[12.4,3.6],[12.4,2.4],[10.4,2.4]],null,{shine:1});
 C.dcap(x.blade||T.m,12.8,0,26,0,1.6,3);C.dcap(x.blade||T.m,12.8,-1.3,27.5,-1.3,.7,1);
 if(lv>=3)C.dcap(P.ice,13,-3,27.6,-3,.8,null,{flat:1,noline:1});};
W.dual=(C,T,x={})=>{const one=(C2)=>{const lv=T.lv;grip(C2,x.grip||T.g,4,9,2,1.4);C2.dell(T.t,3.4,0,1.5,1.5);guard(C2,x.guardC||T.t,9,3.6,1.4,{balls:lv>=2});
  blade(C2,x.blade||T.m,10.4,22.5,1.6,{tip:3,curve:lv>=1?-.6:0,edge:lv>=3?P.ice:null});if(lv>=3||x.ggem)dgem(C2,x.ggem||T.gem,9.7,0,.9);};
 const C2=Canvas();one(C2);for(let y=0;y<N;y++)for(let xx=0;xx<N;xx++){const k=C2.M[y*N+xx];if(k<0)continue;const m=C2.mats[k];C.px(m.r,N-1-xx,y,C2.T[y*N+xx]<0?null:C2.T[y*N+xx],m.shine?{shine:1}:null);}
 one(C);if(x.charm)x.charm(C);};
W.tome=(C,T,x={})=>{const lv=T.lv,cv=x.cover||[P.leather,P.navy,P.blue,P.purple][lv],tr=x.trim||T.t;
 C.rect(P.paper,8,7,18,21,null,{flat:2});for(let y=9;y<27;y+=2)C.rect(P.paper,24,y,2,1,3);
 C.poly(cv,[[5,5],[23,4],[24,25],[6,27]]);C.rect(cv,4,5,3,23,3);
 C.poly(tr,[[5,5],[9,5],[5,9]]);C.poly(tr,[[19,4],[23,4],[23,8]]);C.poly(tr,[[6,23],[6,27],[10,27]]);C.poly(tr,[[24,21],[24,25],[20,25]]);
 if(x.emblem)x.emblem(C);else if(lv===0)C.rect(tr,11,12,7,1,null).rect(tr,11,17,7,1);
 else if(lv===1){C.ring(tr,14.5,15,4.2,4.6,1.4);C.px(tr,14,14,0);}
 else if(lv===2){C.ring(tr,14.5,15,5,5.4,1.2);gem(C,T.gem,14.5,15,2.2,2.4);}
 else{C.ring(tr,14.5,15,5.4,5.8,1.2);for(let i=0;i<5;i++){const a=-1.5708+i*1.2566,b=a+.628;C.poly(tr,[[14.5,15],[14.5+Math.cos(a)*4.6,15+Math.sin(a)*4.6],[14.5+Math.cos(b)*2,15+Math.sin(b)*2]]);}gem(C,T.gem,14.5,15,1.3);}
 C.rect(tr,22,13,4,4);C.px(tr,24,14,0);};
W.staff=(C,T,x={})=>{const lv=T.lv;C.dcap(x.shaft||P.wood,1,0,21,0,2,null,{round:0});for(let t=4;t<20;t+=5)C.dcap(T.t,t,-1.2,t,1.2,1.1);
 C.dell(T.t,1,0,1.4,1.4);
 if(x.head)return x.head(C);
 const h=C.d(25,0);
 if(lv===0){C.dpoly(T.t,[[20,-1.6],[22,-1.6],[22,1.6],[20,1.6]]);C.ell(P.wood,h[0],h[1],3.2,3.2,null,{round:1});}
 else if(lv===1){C.dpoly(T.m,[[20,-1.8],[22.5,-1.8],[22.5,1.8],[20,1.8]]);C.ring(T.m,h[0],h[1],4.4,4.4,1.6);dgem(C,P.gemR,25,0,1.5);C.dcap(T.m,28,0,31,0,1.4);}
 else if(lv===2){C.dpoly(T.t,[[20,-1.8],[22.5,-1.8],[22.5,1.8],[20,1.8]]);C.ring(T.t,h[0],h[1],5,5,1.7,null,null,1.2,5.6);dgem(C,T.gem,25,0,2.3);}
 else{C.dpoly(T.t,[[20,-2],[23,-2],[23,2],[20,2]]);for(const s of[-1,1]){C.dpoly(P.ivory,[[22,s*2],[24,s*7.5],[27,s*8.6],[25.6,s*5],[27.4,s*4.4],[24,s*2.2]]);}
  C.ring(T.t,h[0],h[1],4.6,4.6,1.2);dgem(C,T.gem,25,0,2.3);C.dcap(P.gold,29,0,31.4,0,1.2);}};
W.bow=(C,T,x={})=>{const lv=T.lv,lim=x.limb||(lv===0?P.wood:lv===1?P.dark:T.m),pts=[];
 for(let i=0;i<=16;i++){const u=i/16,t=1.5+u*28,k=Math.sin(u*3.1416),re=lv>=1?Math.pow(Math.abs(u-.5)*2,6)*2.6:0;pts.push(C.d(t,-(7.4*k)+re));}
 C.curve(lim,pts.slice(0,9),1.4,2.6);C.curve(lim,pts.slice(8),2.6,1.4);
 const a=C.d(1.5,lv>=1?2.6:0),b=C.d(29.5,lv>=1?2.6:0);C.cap(x.string||P.bone,a[0],a[1],b[0],b[1],.8,null,{flat:1,noline:1});
 C.dcap(x.grip||T.g,13,-7.3,18,-7.3,3.2);C.dcap(x.grip||T.g,14.2,-7.3,14.2,-7.3,1,3);C.dcap(x.grip||T.g,16.8,-7.3,16.8,-7.3,1,3);
 if(lv>=2){for(const t of[1.5,29.5]){const p=C.d(t,2.6);C.ell(T.t,p[0],p[1],1.4,1.4);}}
 if(lv>=3||x.ggem)dgem(C,x.ggem||T.gem,15.5,-7.2,1.3);};
W.axe=(C,T,x={})=>{const lv=T.lv,hd=x.headC||T.m;C.dcap(x.shaft||P.wood,.5,0,25.6,0,2.2);if(lv>=1)grip(C,T.g,1,7,2.4,1.5);C.dell(T.t,.6,0,1.5,1.5);
 /* 刃：首から外へ広がる三日月。外の縁が刃（明るい線） */
 const bit=(s)=>{const pts=[[19.6,s*1.4],[19,s*3.6]];for(let i=0;i<=10;i++){const u=i/10;pts.push([15.4+u*13.2,s*(4.2+7.4*Math.sin(u*3.1416))]);}pts.push([25.4,s*3.6],[24.4,s*1.4]);C.dpoly(hd,pts,null,{shine:1});
  const ed=[];for(let i=1;i<10;i++){const u=i/10;ed.push(C.d(15.4+u*13.2,s*(3.6+7.4*Math.sin(u*3.1416))));}C.curve(hd,ed,.9,.9,s<0?0:1);};
 bit(-1);if(lv>=2)bit(1);else if(lv>=1)C.dpoly(hd,[[20.2,1.4],[21.8,6.2],[23.6,1.4]]);
 C.dpoly(T.t,[[18.4,-2],[25.4,-2],[25.4,2],[18.4,2]]);C.dcap(T.t,18.8,-1.2,25,-1.2,.7,1);
 if(lv>=3||x.ggem)dgem(C,x.ggem||T.gem,21.9,0,1.4);C.dcap(T.t,25.4,0,27.6,0,1.6);};
W.scythe=(C,T,x={})=>{const lv=T.lv,bl=x.blade||T.m;C.dcap(x.shaft||(lv>=2?P.dark:P.wood),.5,0,27.6,0,1.9);grip(C,T.g,2,7.5,2.2,1.5);C.dell(T.t,.6,0,1.5,1.5);
 /* 刃：柄の先から左へ大きく反り、下向きの内側が刃 */
 const R=C.d(27,0),top=[],bot=[];for(let i=0;i<=12;i++){const u=i/12,x0=R[0]-u*(lv>=2?22:20),arc=Math.sin(u*2.9);top.push([x0,R[1]-1.4-arc*4.6+u*u*5.4]);bot.push([x0+u*1.2,R[1]+2.2-arc*2.6+u*u*4.4]);}
 bot[12]=top[12].slice();C.poly(bl,[...top,...bot.slice().reverse()],null,{shine:1});C.curve(bl,bot.slice(1,11),.9,.7,0);
 C.dpoly(T.t,[[24.4,-2],[28,-2],[28,2],[24.4,2]]);C.dcap(T.t,24.8,-1.2,27.6,-1.2,.7,1);
 if(lv>=1)C.dpoly(T.t,[[27.8,-1.4],[31,-.6],[28.4,1.2]]);
 if(lv>=3||x.ggem)dgem(C,x.ggem||T.gem,26.2,0,1.3);};
W.fist=(C,T,x={})=>{const lv=T.lv,m=x.plate||T.m,cf=x.cuff||(lv>=2?T.t:T.g);
 /* 正面から見た拳：袖口 → 手首の板 → 手の甲 → 握った 4 本の指 → 前を横切る親指 */
 C.poly(cf,[[8,23],[24,23],[27,30],[5,30]]);C.rect(cf,6,26,21,1,3);if(lv>=1)C.rect(T.t,7,28,19,1,1);
 C.poly(m,[[9,17],[23,17],[24,23],[8,23]],null,{round:1});
 C.poly(m,[[8,9],[24,9],[25,17],[7,17]],null,{round:1});
 for(let i=0;i<4;i++){C.ell(m,10.4+i*3.8,9.6,2.2,2.6,null,{shine:1});C.rect(m,12.3+i*3.8,9,1,6,3);}C.rect(m,8,13,17,1,3);
 C.poly(m,[[7,16],[17,15.4],[18.4,18.2],[8,19.4]],null,{shine:1});C.rect(m,8,19,10,1,3);
 if(lv>=1)for(let i=0;i<4;i++)C.px(T.t,10+i*4,8,0);
 if(lv>=2)for(let i=0;i<4;i++)C.poly(T.t,[[9.4+i*3.8,7.4],[11.4+i*3.8,7.4],[10.4+i*3.8,3.6]]);
 if(lv>=3||x.ggem)gem(C,x.ggem||T.gem,16,21,2,1.4);if(x.extra)x.extra(C);};
W.claw=(C,T,x={})=>{const lv=T.lv,bl=x.blade||T.m;
 C.dpoly(x.cuff||T.g,[[.8,-4],[8.6,-4.4],[9.4,4.4],[.8,4]]);C.dcap(x.cuff||T.g,2.5,-4,2.5,4,1,3);C.dcap(x.cuff||T.g,5.5,-4.2,5.5,4.2,1,3);
 C.dpoly(T.t,[[8.6,-5.4],[11.4,-5.4],[11.4,5.4],[8.6,5.4]]);
 for(const o of[-3.4,0,3.4]){const pts=[];for(let i=0;i<=9;i++){const u=i/9;pts.push(C.d(11.2+u*(lv>=2?19:17.4),o+u*u*(lv>=1?3.6:2.6)));}C.curve(bl,pts,2.6,.8,null,{shine:1});C.curve(bl,pts.slice(1,8),.8,.6,0);}
 if(lv>=3||x.ggem)dgem(C,x.ggem||T.gem,10,0,1.4);};
W.glass=(C,T,x={})=>{const lv=T.lv,fr=x.frame||T.t,top=x.cap||(lv===0?P.wood:T.m);
 C.ell(top,16,5,10,2.6).rect(top,6,4,21,2);C.ell(top,16,27,10,2.6).rect(top,6,26,21,2);
 C.poly(P.glass,[[9,7],[23,7],[22,11],[17.5,16],[22,21],[23,25],[9,25],[10,21],[14.5,16],[10,11]],null,{flat:1});
 C.poly(x.sand||P.sand,[[11,11],[21,11],[17,15.5],[15,15.5]],null,{flat:2});C.poly(x.sand||P.sand,[[10.5,24.5],[21.5,24.5],[19,20.5],[13,20.5]],null,{flat:2});C.rect(x.sand||P.sand,15,16,1,4,1);
 for(const xx of[7,24])C.rect(fr,xx,6,2,21);if(lv>=2)C.rect(fr,15,6,2,1,1);
 if(lv>=3||x.ggem)gem(C,x.ggem||T.gem,16,5,1.6,1.2);if(x.extra)x.extra(C);};
W.dsword=(C,T,x={})=>{const lv=T.lv,sc=x.scale||P.crimson;
 C.dell(T.t,.6,0,2,2);dgem(C,x.pgem||P.gemR,.6,0,1);grip(C,x.grip||P.crimson,1.8,7.4,2.3,1.5);
 for(const s of[-1,1])C.dpoly(x.wing||T.t,[[7.2,s*1.2],[9.6,s*2.2],[8.4,s*7.6],[6,s*6]]);C.dpoly(x.wing||T.t,[[7.2,-2.2],[10.6,-2.2],[10.6,2.2],[7.2,2.2]]);
 const pts=[];for(let i=0;i<=10;i++){const t=10.6+i*1.75;pts.push([t,-(3+(lv>=2&&i%2?.8:0))]);}pts.push([30.6,0]);for(let i=10;i>=0;i--){const t=10.6+i*1.75;pts.push([t,3+(lv>=2&&i%2?.8:0)]);}
 C.dpoly(x.blade||T.m,pts,null,{shine:1});C.dcap(sc,11.4,0,26,0,1.4,null,{flat:2});for(let t=12;t<26;t+=3)C.dpx(sc,t,0,1);
 if(lv>=1)dgem(C,x.ggem||P.gemR,8.9,0,1.3);};

/* ---------- 防具・装飾品 ---------- */
const A={};
A.helm=(C,T,x={})=>{const lv=T.lv,m=x.m||T.m;
 if(lv>=2&&!x.noPlume)C.curve(x.plume||T.c,[[16,6],[14,3],[10,2],[6,4]],3,1.5);
 C.ell(m,16,14,10,10,null,{round:1});C.rect(m,6,14,20,9);C.poly(m,[[6,22],[11,22],[12,28],[7,27]]);
 C.rect(T.t,6,13,20,2);C.px(T.t,8,13,0);
 C.rect(P.black,9,17,6,2,null,{flat:3,noline:1});if(lv>=1)C.rect(m,15,15,2,10);
 if(lv>=3){for(const s of[0])C.poly(P.gold,[[6,12],[1,6],[2,12],[0,14],[5,16]]);gem(C,T.gem,16,10,1.6);}else if(lv>=1)C.px(T.t,16,9,0);
 C.mirror();if(lv>=2&&!x.noPlume){C.curve(x.plume||T.c,[[16,6],[18,2],[22,1],[26,3]],3,1.4);}if(x.extra)x.extra(C);};
A.band=(C,T,x={})=>{const lv=T.lv,m=x.m||T.m;
 /* 前から少し見下ろした輪：奥（上）は細く暗く、手前（下）は太い。前の中央に飾り板 */
 C.ring(m,16,17,13,6.6,1.6,3,null,3.1416,6.2832);C.ring(m,16,17,13,6.6,2.8,null,null,0,3.1416);
 if(x.crown)x.crown(C);
 C.poly(T.t,[[16,15],[20.4,19.6],[16,25],[11.6,19.6]]);gem(C,x.gem||T.gem||P.gemR,16,20,2,2.4);
 if(lv>=2){C.poly(T.t,[[5,16],[6.6,12],[8.4,17]]);C.poly(T.t,[[23.6,17],[25.4,12],[27,16]]);}
 if(lv>=3){C.poly(P.gold,[[3,19],[0,12],[1,20]]);C.poly(P.gold,[[29,19],[32,12],[31,20]]);}if(x.extra)x.extra(C);};
A.armor=(C,T,x={})=>{const lv=T.lv,m=x.m||T.m,tr=x.trim||T.t;
 C.poly(m,[[8,7],[13,5],[16,8],[16,28],[10,27],[8,18],[6,12]],null,{round:1});C.ell(x.pad||m,6,9.6,4.4,3.6,null,{shine:1});
 C.poly(P.black,[[13,5],[16,8],[16,5]],null,{flat:3,noline:1});
 C.rect(x.belt||P.leather,9,22,7,2);C.px(T.t,15,22,1);
 if(lv>=1)C.rect(m,10,13,6,1,3);if(lv>=2){C.poly(tr,[[13,5],[16,8],[16,10],[12,6]]);C.rect(tr,9,24,7,1);}
 if(lv===0)C.px(P.brass,10,10,1).px(P.brass,10,17,1).px(P.brass,14,17,1);
 C.mirror();C.rect(m,16,8,1,14,3);if(lv>=3){C.poly(tr,[[16,12],[18,16],[16,20],[14,16]]);gem(C,T.gem,16,16,1.4,2);}if(x.extra)x.extra(C);};
A.shield=(C,T,x={})=>{const lv=T.lv,tr=x.rim||T.t;
 if(lv===0){C.ell(P.wood,16,16,12,12,null,{round:1});for(const xx of[11,16,21])C.rect(P.wood,xx,5,1,22,3);C.ring(tr,16,16,12,12,2);C.ell(tr,16,16,3.4,3.4,null,{shine:1});[[16,7],[8,16],[24,16],[16,25]].forEach(([a,b])=>C.px(tr,a,b,0));return;}
 const f=x.field||(lv===1?T.m:lv===2?P.blue:P.purple),sh=[[5,5],[27,5],[27,15],[22,24],[16,29],[10,24],[5,15]];
 C.poly(tr,sh);C.poly(f,[[7,7],[25,7],[25,15],[20.6,22.6],[16,26.6],[11.4,22.6],[7,15]]);
 if(x.emblem)x.emblem(C);
 else if(lv===1){C.rect(tr,15,7,2,19);C.rect(tr,7,13,18,2);[[9,9],[22,9],[9,19],[22,19]].forEach(([a,b])=>C.px(P.silver,a,b,1));}
 else if(lv===2){C.rect(P.silver,14,8,4,17);C.rect(P.silver,8,12,16,4);C.px(P.silver,14,8,0);}
 else{for(let i=0;i<5;i++){const a=-1.5708+i*1.2566,b=a+.628;C.poly(P.gold,[[16,15],[16+Math.cos(a)*7,15+Math.sin(a)*7],[16+Math.cos(b)*3,15+Math.sin(b)*3]]);}gem(C,T.gem,16,15,1.6);}};
A.ring=(C,T,x={})=>{const b=x.band||P.gold,g=x.gem||P.gemR;C.ring(b,16,20,9,7,2.6);C.ring(b,16,20,9,7,2.6,1,null,3.5,5.9);
 C.poly(b,[[11,12],[21,12],[19,16],[13,16]]);
 if(x.top)x.top(C);else{C.ell(g,16,10,4.6,4.6,null,{flat:2});C.poly(g,[[12,9],[16,6],[20,9]],1);C.px(g,14,8,0).px(g,15,8,0);C.rect(g,13,12,6,1,3);}
 if(x.wing){for(const s of[-1,1])C.poly(P.ivory,[[16+s*9,13],[16+s*14,7],[16+s*15,11],[16+s*12,15]]);}};
A.neck=(C,T,x={})=>{const ch=x.chain||P.gold;
 /* 首にかけた鎖：上の両端から下の中央へ垂れる U 字。粒を交互に */
 for(let i=0;i<=16;i++){const a=3.1416*i/16,px=16-Math.cos(a)*11.5,py=4+Math.sin(a)*13.4;if(i%2===0)C.ell(ch,px,py,1.15,1.15,null,{shine:1});else C.px(ch,Math.floor(px),Math.floor(py),2);}
 C.rect(ch,15,17,2,3);if(x.pend)x.pend(C);else{C.poly(x.gem||P.gemV,[[16,19],[21,24],[16,30],[11,24]],null,{shine:1});C.px(x.gem||P.gemV,14,22,0);C.rect(ch,11,23,10,1);}};
A.charm=(C,T,x={})=>{C.curve(P.red,[[16,2],[16,8]],1.4,1.4);C.ring(P.gold,16,15,8,8,2.2);C.ell(P.ivory,16,15,6,6,null,{flat:2});
 C.poly(P.orange,[[16,9],[19,15],[17.6,19],[14.4,19],[13,15]],null,{emit:1});C.poly(P.flame,[[16,12],[17.4,16],[16,18.4],[14.6,16]],null,{emit:1,flat:1});
 C.curve(P.red,[[13,22],[11,27],[12,30]],2,1.2);C.curve(P.red,[[19,22],[21,27],[20,30]],2,1.2);C.ell(P.gold,16,23,2,1.6);};

/* ---------- 名前 → デザイン ---------- */
const DES={};const TN=['銅','鉄','鋼','星鋼'];
for(const k of Object.keys(W))for(const t of TN)DES[k+'_'+t]={f:W[k],T:TIER[t]};
for(const k of['helm','band','armor','shield'])for(const t of TN)DES[k+'_'+t]={f:A[k],T:TIER[t]};
const L=(f,t,x,glow)=>({f,T:TIER[t],x,glow});
const star5=(C,r,cx,cy,R,ri)=>{const pts=[];for(let i=0;i<10;i++){const a=-1.5708+i*.6283,rr=i%2?ri:R;pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}C.poly(r,pts,null,{shine:1});};
Object.assign(DES,{
 /* 専用（絆の武器） */
 L_uq_rio:L(W.sword,'鋼',{blade:P.ivory,guardC:P.gold,grip:P.red,ggem:P.gemA,pgem:P.gemA},'#ffd65a'),
 L_uq_gald:L(W.gsword,'鋼',{blade:P.silver,guardC:P.gold,grip:P.crimson,ggem:P.gemR},'#ffe9a0'),
 L_uq_mire:L(W.tome,'星鋼',{cover:P.crimson,trim:P.gold,emblem:C=>{C.poly(P.blue,[[16,4],[24,4],[24,26],[16,27]]);star5(C,P.gemA,11.5,15,4.4,1.9);star5(C,P.ice,19.5,15,4.4,1.9);}},'#ffb0d0'),
 L_uq_shion:L(W.dual,'鋼',{grip:P.green,guardC:P.gold,ggem:P.gemG,charm:C=>{C.curve(P.red,[[16,23],[15,27],[17,30]],1.6,1);C.ell(P.gold,16,23,1.6,1.6);}},'#8ff0a8'),
 L_uq_noah:L(W.staff,'星鋼',{shaft:P.ivory,head:C=>{const h=C.d(25,0);C.dpoly(P.gold,[[20,-2],[23,-2],[23,2],[20,2]]);C.ell(P.gold,h[0],h[1],5.2,5.6);C.ell(P.flame,h[0],h[1]+.6,3.4,3.8,null,{emit:1});
  C.poly(P.gemR,[[h[0],h[1]+2.2],[h[0]-2.6,h[1]-.4],[h[0]-1.4,h[1]-2],[h[0],h[1]-.8],[h[0]+1.4,h[1]-2],[h[0]+2.6,h[1]-.4]],null,{flat:1});C.dcap(P.gold,29.4,0,31.4,0,1.4);}},'#fff3a6'),
 L_uq_erna:L(W.bow,'鋼',{limb:P.blue,grip:P.navy,string:P.ice,ggem:P.gemA},'#bfe0ff'),
 L_uq_balza:L(W.axe,'鋼',{headC:P.dark,ggem:P.gemA},'#ffb060'),
 L_uq_crow:L(W.scythe,'星鋼',{blade:P.silver,shaft:P.black,ggem:P.gemV},'#b07cff'),
 L_uq_hakua:L(W.fist,'鋼',{plate:P.ice,cuff:P.silver,ggem:P.gemB,extra:C=>{for(let i=0;i<3;i++){const a=i*1.047;C.cap(P.gemW,16-Math.cos(a)*3,18.4-Math.sin(a)*3,16+Math.cos(a)*3,18.4+Math.sin(a)*3,.8,null,{flat:1,noline:1});}}},'#bff4ff'),
 L_uq_jin:L(W.claw,'鋼',{blade:P.bone,cuff:P.fur,ggem:P.gemR},'#ffb0b8'),
 L_uq_celes:L(W.glass,'星鋼',{frame:P.gold,cap:P.purple,sand:P.star,ggem:P.gemV,extra:C=>{C.px(P.gemW,13,22,0).px(P.gemW,18,23,0).px(P.gemW,15,12,0);}},'#d8c8ff'),
 L_uq_valk:L(W.dsword,'鋼',{blade:P.silver,scale:P.crimson,wing:P.crimson,grip:P.black},'#ff9a60'),
 /* 伝説 */
 L_shokei:L(W.gsword,'鉄',{blade:P.black,guardC:P.crimson,grip:P.black,ggem:P.gemR},'#ff6a6a'),
 L_tenkyuu:L(W.bow,'星鋼',{limb:P.gold,grip:P.navy,string:P.flame,ggem:P.gemA},'#ffe27a'),
 L_meikai:L(W.scythe,'星鋼',{blade:P.purple,shaft:P.black,ggem:P.gemG},'#9a5cf0'),
 L_hyouga:L(W.fist,'星鋼',{plate:P.ice,cuff:P.steel,ggem:P.gemW,extra:C=>{C.poly(P.ice,[[6,10],[8,4],[10,10]],0);C.poly(P.ice,[[22,10],[25,3],[27,10]],0);}},'#bff4ff'),
 L_taiyou:L(W.tome,'星鋼',{cover:P.crimson,trim:P.gold,emblem:C=>{C.ell(P.flame,14.5,15,4,4,null,{emit:1});for(let i=0;i<8;i++){const a=i*.785;C.cap(P.gold,14.5+Math.cos(a)*4.6,15+Math.sin(a)*4.6,14.5+Math.cos(a)*6.6,15+Math.sin(a)*6.6,1.1);}}},'#ffb060'),
 L_kokuyomi:L(W.glass,'星鋼',{frame:P.gold,cap:P.navy,sand:P.ice,ggem:P.gemB,extra:C=>{C.ring(P.gold,16,16,13.6,13.6,1.1,null,{noline:1},.3,2.8);C.ring(P.gold,16,16,13.6,13.6,1.1,null,{noline:1},3.4,5.9);}},'#8fdcff'),
 L_ryuuou:L(W.dsword,'星鋼',{blade:P.black,scale:P.flame,wing:P.gold,grip:P.crimson,ggem:P.gemA},'#ff7a30'),
 L_fue:L(W.gsword,'星鋼',{blade:P.ivory,guardC:P.gold,grip:P.navy,ggem:P.gemW},'#fff3b0'),
 L_tsukikage:L(W.dual,'星鋼',{blade:P.ice,grip:P.navy,guardC:P.silver,ggem:P.gemB},'#bfe0ff'),
 L_tenkei:L(W.staff,'星鋼',{shaft:P.ivory},'#ffffff'),
 L_enjin:L(W.axe,'星鋼',{headC:P.orange,ggem:P.gemR},'#ff9a40'),
 L_juushin:L(W.claw,'星鋼',{blade:P.gold,cuff:P.fur,ggem:P.gemA},'#ffe27a'),
 /* 防具 */
 L_kagerou:L(A.helm,'鋼',{m:P.orange,plume:P.flame,extra:C=>{C.px(P.flame,4,6,1).px(P.flame,27,8,1).px(P.flame,3,10,2);}},'#ffb050'),
 L_hoshikuzu:L(A.armor,'星鋼',{m:P.navy,pad:P.navy,trim:P.gold,belt:P.navy,extra:C=>{[[9,12],[22,10],[11,19],[20,20],[14,25]].forEach(([a,b])=>C.px(P.gemW,a,b,0));}},'#a8b8ff'),
 L_gyokuza:L(A.shield,'星鋼',{field:P.purple,rim:P.gold,emblem:C=>{C.poly(P.gold,[[10,16],[11,10],[13.5,13],[16,9],[18.5,13],[21,10],[22,16]]);C.rect(P.gold,10,16,12,3);gem(C,P.gemR,16,17.5,1.4,1);}},'#ffd65a'),
 L_tenkoku:L(A.armor,'星鋼',{m:P.ivory,pad:P.gold,trim:P.gold,belt:P.gold,extra:C=>{for(const s of[-1,1])C.poly(P.ivory,[[16+s*11,7],[16+s*15.5,1],[16+s*15,8],[16+s*13,11]]);}},'#fff3b0'),
 L_seikai:L(A.armor,'星鋼',{m:P.teal,pad:P.navy,trim:P.silver,belt:P.navy,extra:C=>{for(let i=0;i<3;i++)C.curve(P.ice,[[9,15+i*4],[12,14+i*4],[16,15+i*4],[20,14+i*4],[23,15+i*4]],.8,.8,1);}},'#6ee0d0'),
 L_haou:L(A.shield,'星鋼',{field:P.black,rim:P.crimson,emblem:C=>{C.poly(P.gold,[[16,9],[22,13],[20,21],[16,24],[12,21],[10,13]]);C.poly(P.crimson,[[16,12],[19,14],[18,19],[16,21],[14,19],[13,14]]);gem(C,P.gemA,16,16,1.2);}},'#ff6a6a'),
 L_tengan:L(A.band,'星鋼',{m:P.gold,gem:P.gemB,crown:C=>{C.poly(P.gold,[[11,19],[16,5],[21,19]]);C.ell(P.ivory,16,13,3.6,2.4,null,{flat:1});C.ell(P.gemB,16,13,1.6,1.6,null,{flat:2});C.px(P.gemB,15,12,0);}},'#8fdcff'),
 S_royal_head:L(A.band,'星鋼',{m:P.gold,gem:P.gemR,crown:C=>{for(const[xx,yy,h]of[[6,20,8],[11,22,11],[21,22,11],[26,20,8]])C.poly(P.gold,[[xx-2.6,yy+1],[xx,yy-h],[xx+2.6,yy+1]]);
  C.poly(P.crimson,[[8,19],[24,19],[24,12],[16,8],[8,12]]);for(const[xx,yy]of[[6,12],[11,11],[21,11],[26,12]])C.ell(P.gemW,xx,yy,1,1,null,{flat:1});}},'#ffd65a'),
 S_royal_body:L(A.armor,'星鋼',{m:P.blue,pad:P.gold,trim:P.gold,belt:P.gold,extra:C=>{C.poly(P.crimson,[[3,10],[7,9],[8,28],[2,29]]);C.poly(P.crimson,[[29,10],[25,9],[24,28],[30,29]]);}},'#ffd65a'),
 S_royal_sub:L(A.shield,'星鋼',{field:P.navy,rim:P.gold,emblem:C=>{C.poly(P.gold,[[11,11],[13,9],[16,12],[19,9],[21,11],[19,13],[13,13]]);C.rect(P.gold,15,13,2,9);C.rect(P.gold,12,16,8,2);}},'#ffd65a'),
 S_royal_acc:L(A.ring,'星鋼',{band:P.gold,top:C=>{C.ell(P.gold,16,10,5.4,4.6);C.ell(P.navy,16,10,3.6,3,null,{flat:2});C.px(P.gold,16,9,0).px(P.gold,15,10,1).px(P.gold,17,10,1).px(P.gold,16,11,1);}},'#ffd65a'),
 /* 装飾品 */
 charm:L(A.charm,'鉄',{}),
 ring_life:L(A.ring,'鋼',{band:P.gold,gem:P.gemR}),
 ring_wind:L(A.ring,'鋼',{band:P.silver,gem:P.gemG,wing:1}),
 neck_mag:L(A.neck,'鋼',{gem:P.gemV}),
 neck_sand:L(A.neck,'鋼',{chain:P.silver,pend:C=>{C.poly(P.glass,[[13,19],[19,19],[19,29],[13,29]],null,{flat:1});C.rect(P.sand,14,24,4,5,null,{flat:2});C.rect(P.brass,12,18,8,2);C.px(P.sand,15,22,1);}}),
 L_koukagari:L(A.neck,'星鋼',{chain:P.gold,pend:C=>{C.rect(P.gold,13,19,6,1);C.poly(P.glass,[[13,20],[19,20],[20,27],[12,27]],null,{flat:1});C.ell(P.flame,16,24,2,2.6,null,{emit:1});C.rect(P.gold,12,27,8,2);for(let i=0;i<3;i++)C.px(P.flame,6+i*2,26+i,1);}},'#ffb060'),
 L_futago:L(A.neck,'星鋼',{chain:P.silver,pend:C=>{star5(C,P.gemA,13,23,4.4,1.9);star5(C,P.ice,20,25,3.6,1.6);}},'#ffe27a'),
 L_kiseki:L(A.ring,'星鋼',{band:P.gold,gem:P.gemW,wing:1},'#ffffff'),
 L_senkou:L(A.neck,'星鋼',{chain:P.gold,pend:C=>{C.poly(P.gemA,[[18,18],[12,25],[16,25],[13,31],[21,22],[17,22],[20,18]],null,{shine:1});}},'#ffe27a'),
 L_shuuen:L(A.ring,'星鋼',{band:P.black,gem:P.gemR},'#ff4a4a'),
 L_seishin:L(A.neck,'星鋼',{chain:P.gold,pend:C=>{C.ring(P.gold,16,24,6,6,1,null,{noline:1});star5(C,P.gold,16,24,5,2.2);gem(C,P.gemW,16,24,1.2);}},'#fff3b0')});
/* 天恵の杖：羽のある頭飾りを白と金に */
DES.L_tenkei.x={shaft:P.ivory};DES.L_tenkei.T=Object.assign({},TIER['星鋼'],{gem:P.gemW});

/* ---------- 出力 ---------- */
const CACHE=new Map();
function build(key){const d=DES[key];const C=Canvas();d.f(C,d.T,d.x||{});return shade(C);}
function render(key,rar=0){const ck=key+'|'+rar;let u=CACHE.get(ck);if(u)return u;const d=DES[key];const px=build(key),f=finish(px,rar,d.glow&&rar>=3?d.glow:null);u=toURL(f.a,f.alpha);CACHE.set(ck,u);return u;}
function shadow(key){const ck='sh|'+key;let u=CACHE.get(ck);if(u)return u;const px=build(key).map(c=>c?'#2a2e52':null);for(let i=0;i<N*N;i++)if(px[i]){const x=i%N,y=i/N|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const j=(y+dy)*N+x+dx;if(x+dx>=0&&x+dx<N&&y+dy>=0&&y+dy<N&&!px[j])px[j]='#0a0c1e';}}
 u=toURL(px);CACHE.set(ck,u);return u;}
/* IC21 の差し替え：ここで定義した名前だけ。keyOf が新しい伝説の名前（L_tenkoku など）を選べるように、IC21.DES にも名前を置く */
if(typeof IC21!=='undefined'){const _r=IC21.render,_s=IC21.shadow;
 for(const k in DES)if(!IC21.DES[k])IC21.DES[k]=IC21.DES[k.replace(/^L_/,'')]||IC21.DES['armor_鉄'];
 IC21.render=function(key,rar){if(DES[key]){try{return render(key,rar);}catch(e){console.error('IC36',key,e);}}return _r.apply(this,arguments);};
 IC21.shadow=function(key){if(DES[key]){try{return shadow(key);}catch(e){console.error('IC36',key,e);}}return _s.apply(this,arguments);};}
return{N,P,TIER,DES,W,A,render,shadow,build,keys:()=>Object.keys(DES)};})();
