/* ===== ver0.18 ドット絵エンジン =====
 1ドット＝画面の1論理ピクセル（常に整数倍・最近傍）で描く。
 ・色は「基準色→明／中／暗／最暗」の4段ランプ（明るい側は暖色、暗い側は寒色へ色相をずらす）
 ・輪郭線は黒ではなく「隣の色の最暗部」
 ・パーツごとに輪郭を付けてから重ねる（腕・脚・胴・頭・武器）
 ・フレームは初回に生成してキャッシュ（スプライトシート相当） */
'use strict';
const PXC=new Map();
function C(h){let v=PXC.get(h);if(v===undefined){const n=parseInt(h.slice(1),16);v=(0xff000000|((n&255)<<16)|(n&0xff00)|((n>>16)&255))>>>0;PXC.set(h,v);}return v;}
const cR=c=>c&255,cG=c=>(c>>8)&255,cB=c=>(c>>16)&255;
const cRGB=(r,g,b)=>(0xff000000|((b&255)<<16)|((g&255)<<8)|(r&255))>>>0;
const cMix=(a,b,t)=>cRGB(cR(a)+(cR(b)-cR(a))*t,cG(a)+(cG(b)-cG(a))*t,cB(a)+(cB(b)-cB(a))*t);
const cHex=c=>'#'+[cR(c),cG(c),cB(c)].map(v=>v.toString(16).padStart(2,'0')).join('');
function hsl2c(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return cRGB(f(0)*255,f(8)*255,f(4)*255);}
function c2hsl(c){const r=cR(c)/255,g=cG(c)/255,b=cB(c)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return[h,s,l];}
/* 色相をtg度へdだけ寄せる */
const hueTo=(h,tg,d)=>{let df=((tg-h+540)%360)-180;return h+Math.max(-d,Math.min(d,df));};
const RAMPC=new Map();
/* ランプ：[明, 中, 暗, 最暗(輪郭)] */
function ramp(hex){let r=RAMPC.get(hex);if(r)return r;const c=C(hex),[h,s,l]=c2hsl(c);
 r=[hsl2c(hueTo(h,55,10),s*.92,l+(1-l)*.34+.03),c,hsl2c(hueTo(h,255,12),Math.min(1,s*1.08+.03),l*.68),hsl2c(hueTo(h,255,20),Math.min(1,s*1.1+.05),l*.3+.015)];RAMPC.set(hex,r);return r;}
const OUTC=new Map();
function outCol(c){let v=OUTC.get(c);if(v===undefined){const[h,s,l]=c2hsl(c);v=hsl2c(hueTo(h,255,24),Math.min(.6,s*.9+.06),Math.min(.13,l*.2+.035));OUTC.set(c,v);}return v;}

class Buf{
 constructor(w,h){this.w=w;this.h=h;this.d=new Uint32Array(w*h);}
 get(x,y){return x>=0&&y>=0&&x<this.w&&y<this.h?this.d[y*this.w+x]:0;}
 px(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<this.w&&y<this.h)this.d[y*this.w+x]=c;return this;}
 rect(x,y,w,h,c){x=Math.round(x);y=Math.round(y);for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.px(x+i,y+j,c);return this;}
 ell(cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)this.px(x,y,c);}return this;}
 line(x0,y0,x1,y1,c,th=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy;
  for(;;){if(th<=1)this.px(x0,y0,c);else if(th===2)this.rect(x0,y0,2,2,c);else this.rect(x0-1,y0-1,3,3,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}return this;}
 poly(pts,c){let y0=1e9,y1=-1e9;for(const p of pts){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
  for(let y=Math.floor(y0);y<=Math.ceil(y1);y++){const yc=y+.5,xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=yc&&b[1]>yc)||(b[1]<=yc&&a[1]>yc))xs.push(a[0]+(yc-a[1])/(b[1]-a[1])*(b[0]-a[0]));}
   xs.sort((p,q)=>p-q);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.round(xs[i]);x<Math.round(xs[i+1]);x++)this.px(x,y,c);}return this;}
 /* 文字グリッド：1文字＝1ドット。map[ch]=色。fx=左右反転 */
 grid(rows,x,y,map,fx){x=Math.round(x);y=Math.round(y);const w=rows.reduce((a,r)=>Math.max(a,r.length),0);rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const c=map[r[i]];if(c)this.px(fx?x+w-1-i:x+i,y+j,c);}});return this;}
 blit(s,dx,dy,fx){dx=Math.round(dx);dy=Math.round(dy);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const c=s.d[y*s.w+x];if(c)this.px(dx+(fx?s.w-1-x:x),dy+y,c);}return this;}
 /* 輪郭線（4近傍）。col省略時は隣の色の最暗部 */
 outline(col){const w=this.w,h=this.h,s=this.d,o=new Uint32Array(s);for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(s[y*w+x])continue;const n=(y+1<h&&s[(y+1)*w+x])||(x+1<w&&s[y*w+x+1])||(x>0&&s[y*w+x-1])||(y>0&&s[(y-1)*w+x])||0;if(n)o[y*w+x]=col||outCol(n);}this.d=o;return this;}
 /* 自動陰影：色baseの塊の左上の縁を明、右下の縁を暗に */
 rim(base,lt,dk){const w=this.w,h=this.h,s=this.d,o=new Uint32Array(s);for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(s[y*w+x]!==base)continue;const up=this.get(x,y-1),lf=this.get(x-1,y),dn=this.get(x,y+1),rt=this.get(x+1,y);
  if(dk&&(!dn||!rt))o[y*w+x]=dk;else if(lt&&(!up||!lf))o[y*w+x]=lt;}this.d=o;return this;}
 /* 色の置換 */
 swap(a,b){const s=this.d;for(let i=0;i<s.length;i++)if(s[i]===a)s[i]=b;return this;}
 /* 90度単位でない回転はしない。行ごとのずらし（しなり・傾き） */
 shear(f){const o=new Uint32Array(this.d.length);for(let y=0;y<this.h;y++){const d=Math.round(f(y));for(let x=0;x<this.w;x++){const nx=x+d;if(nx>=0&&nx<this.w)o[y*this.w+nx]=this.d[y*this.w+x];}}this.d=o;return this;}
 canvas(){const c=document.createElement('canvas');c.width=this.w;c.height=this.h;const g=c.getContext('2d'),id=g.createImageData(this.w,this.h);new Uint32Array(id.data.buffer).set(this.d);g.putImageData(id,0,0);return c;}
}
/* パーツを別バッファに描いて輪郭を付け、本体に重ねる */
function part(dst,fn,noOut){const b=new Buf(dst.w,dst.h);fn(b);if(!noOut)b.outline();dst.blit(b,0,0);return dst;}

/* ---------- スプライト登録とフレームキャッシュ ---------- */
const SPDEF={};          /* key → {w,h,ax,ay,draw(buf,anim,i,def),anims:{...},face:[x,y,w,h]} */
const FRC=new Map();
const ANI={idle:{n:4,sp:11,loop:1},walk:{n:4,sp:7,loop:1},atk:{n:6,sp:5},cast:{n:4,sp:8},hurt:{n:2,sp:9},guard:{n:1,sp:20,hold:1},dodge:{n:2,sp:8},down:{n:1,sp:20,hold:1},win:{n:4,sp:10,loop:1},awaken:{n:4,sp:8},charge:{n:2,sp:9,loop:1},item:{n:2,sp:12}};
function sprDef(key){return SPDEF[key]||null;}
function aniOf(def,k){return(def.anims&&def.anims[k])||ANI[k]||ANI.idle;}
function frameOf(key,anim='idle',i=0,opt=''){const def=SPDEF[key];if(!def)return null;const a=aniOf(def,anim);i=((i%a.n)+a.n)%a.n;const ck=key+'|'+anim+'|'+i+'|'+opt;let f=FRC.get(ck);if(f)return f;
 const b=new Buf(def.w,def.h);def.draw(b,anim,i,def,opt);f={c:b.canvas(),w:null,ax:def.ax,ay:def.ay,W:def.w,H:def.h};FRC.set(ck,f);return f;}
function whiteFrame(f){if(f.w)return f.w;const c=document.createElement('canvas');c.width=f.W;c.height=f.H;const g=c.getContext('2d');g.drawImage(f.c,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ffffff';g.fillRect(0,0,f.W,f.H);return f.w=c;}
function tintFrame(f,col,key){f.t=f.t||{};if(f.t[key])return f.t[key];const c=document.createElement('canvas');c.width=f.W;c.height=f.H;const g=c.getContext('2d');g.drawImage(f.c,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,f.W,f.H);return f.t[key]=c;}
/* アニメ状態：u.an={k,t0,sp}。現在のコマ番号を返す（ループしないアニメは終わったらidleへ） */
function aniFrame(u,def,now){let an=u.an;if(!an)an=u.an={k:'idle',t0:(u.x*7+u.y*13)|0};let a=aniOf(def,an.k),i=Math.floor((now-an.t0)/(an.sp||a.sp));
 if(i>=a.n&&!a.loop){if(a.hold||an.hold)i=a.n-1;else{u.an={k:an.next||'idle',t0:now};return aniFrame(u,def,now);}}
 return[an.k,a.loop?i%a.n:Math.max(0,i)];}
function setAni(u,k,o){u.an=Object.assign({k,t0:typeof tick==='number'?tick:0},o||{});}

/* ---------- 人型リグ（味方・人型の敵）：左向き ----------
 腰の中心を原点。y負が上。頭と胴は手描きグリッド、腕・脚・武器は姿勢から描く */
const HW=64,HH=58,HAX=38,HAY=52;   /* フレーム寸法と足元の基準点（腰はay-7） */
const TIERC={'銅':'#d09060','鉄':'#b8c0d0','鋼':'#e4ecfa','星鋼':'#ffe89a'};
function heroCols(d,aw){const p=Object.assign({},d.pal,aw&&d.aw?d.aw:null),m={};for(const k in p){const r=ramp(p[k]);m[k]=r;}return m;}
/* グリッド用の色表：小文字=中、大文字=暗、数字指定で明 */
function gmap(R,spec){const m={};for(const ch in spec){const[k,i]=spec[ch];if(R[k])m[ch]=R[k][i];}return m;}
const HSPEC={h:['hair',1],H:['hair',2],i:['hair',0],s:['skin',1],S:['skin',2],e:['eye',2],b:['eye',1],w:['white',1],
 c:['cloth',1],C:['cloth',2],k:['cloth',0],t:['trim',1],T:['trim',2],y:['trim',0],a:['acc',1],A:['acc',2],q:['acc',0],
 m:['metal',1],M:['metal',2],n:['metal',0],l:['leather',1],L:['leather',2],x:['glow',1],X:['glow',0],o:['ink',1],r:['cloth2',1],R:['cloth2',2],p:['cloth2',0],g:['gem',1],G:['gem',0]};
/* 武器：手の位置(hx,hy)から角度ang（0=前(左)・90=上）へ伸びる */
function drawWeapon(b,kind,hx,hy,ang,R,o={}){const a=ang*Math.PI/180,ux=-Math.cos(a),uy=-Math.sin(a),P=(t,n=0)=>[hx+ux*t-uy*n,hy+uy*t+ux*n],bl=R.blade,hl=R.hilt||R.leather,gd=R.guard||R.trim;
 const seg=(t0,t1,c,th)=>{const[p,q]=[P(t0),P(t1)];b.line(p[0],p[1],q[0],q[1],c,th);};
 if(kind==='sword'){seg(-2,0,hl[2],1);seg(2,11,bl[1],2);seg(3,10,bl[0],1);const g0=P(1,-2),g1=P(1,2);b.line(g0[0],g0[1],g1[0],g1[1],gd[1],1);const t=P(12);b.px(t[0],t[1],bl[0]);}
 else if(kind==='gsword'){seg(-3,0,hl[2],1);seg(2,15,bl[1],3);seg(3,14,bl[0],1);const g0=P(1,-3),g1=P(1,3);b.line(g0[0],g0[1],g1[0],g1[1],gd[1],2);const t=P(17);b.px(t[0],t[1],bl[1]);const f=P(8);b.px(f[0],f[1],bl[2]);}
 else if(kind==='dagger'){seg(-1,0,hl[2],1);seg(1,6,bl[1],1);seg(2,5,bl[0],1);const g0=P(1,-1),g1=P(1,1);b.line(g0[0],g0[1],g1[0],g1[1],gd[1],1);}
 else if(kind==='katana'){seg(-3,0,hl[2],1);seg(1,13,bl[1],1);seg(2,12,bl[0],1);const g0=P(1,-1),g1=P(1,1);b.line(g0[0],g0[1],g1[0],g1[1],gd[1],1);}
 else if(kind==='spear'){seg(-8,10,hl[1],1);seg(11,15,bl[1],2);const t=P(16);b.px(t[0],t[1],bl[0]);}
 else if(kind==='pick'){seg(-4,8,hl[1],1);const t0=P(8,-4),t1=P(9,4);b.line(t0[0],t0[1],t1[0],t1[1],bl[1],2);}
 else if(kind==='staff'||kind==='glass'||kind==='rod'){seg(-7,9,hl[1],1);const t=P(11);
  if(kind==='glass'){b.rect(t[0]-2,t[1]-3,5,1,gd[1]);b.rect(t[0]-2,t[1]+3,5,1,gd[1]);b.px(t[0]-1,t[1]-2,R.glow[0]);b.px(t[0],t[1]-2,R.glow[0]);b.px(t[0]+1,t[1]-2,R.glow[0]);b.px(t[0],t[1]-1,R.glow[1]);b.px(t[0],t[1],R.glow[1]);b.px(t[0],t[1]+1,R.glow[1]);b.px(t[0]-1,t[1]+2,R.glow[1]);b.px(t[0],t[1]+2,R.glow[0]);b.px(t[0]+1,t[1]+2,R.glow[1]);}
  else if(kind==='rod'){b.ell(t[0]+.5,t[1]+.5,2.6,2.6,gd[1]);b.ell(t[0]+.5,t[1]+.5,1.4,1.4,0);b.px(t[0],t[1],R.glow[0]);}
  else{b.ell(t[0]+.5,t[1]+.5,2.2,2.2,R.glow[1]);b.px(t[0]-1,t[1]-1,R.glow[0]);const k0=P(8,-2),k1=P(8,2);b.px(k0[0],k0[1],gd[1]);b.px(k1[0],k1[1],gd[1]);}}
 else if(kind==='axe'){seg(-5,9,hl[1],1);const c=P(9,-1);b.ell(c[0]+.5-uy*2,c[1]+.5+ux*2,3.2,3.6,bl[1]);b.ell(c[0]+.5-uy*3,c[1]+.5+ux*3,1.6,2.2,bl[0]);const d=P(9,2);b.rect(d[0]-1,d[1]-1,2,2,bl[2]);}
 else if(kind==='scythe'){seg(-9,12,hl[1],1);for(let i=0;i<11;i++){const q=P(12-i*.35-(i*i)*.07,-1-i);b.rect(q[0],q[1],i<8?2:1,i<9?2:1,bl[1]);if(i<6){const q2=P(11-i*.35-(i*i)*.07,-1-i);b.px(q2[0],q2[1],bl[2]);}}for(let i=1;i<9;i++){const q=P(12.6-i*.35-(i*i)*.07,-1-i);b.px(q[0],q[1],bl[0]);}const j=P(12);b.rect(j[0]-1,j[1]-1,2,2,gd[1]);}
 else if(kind==='bow'){const dr=o.draw||0;for(let i=-7;i<=7;i++){const q=P(3-Math.abs(i)*Math.abs(i)*.085,i);b.px(q[0],q[1],hl[1]);if(Math.abs(i)<6){const q2=P(4-Math.abs(i)*Math.abs(i)*.085,i);b.px(q2[0],q2[1],hl[0]);}}
  const s0=P(-1,-7),s1=P(-1-dr*4,0),s2=P(-1,7);b.line(s0[0],s0[1],s1[0],s1[1],R.white[1],1);b.line(s1[0],s1[1],s2[0],s2[1],R.white[1],1);const g=P(3);b.px(g[0],g[1],gd[1]);
  if(o.arrow){const a0=P(-1-dr*4),a1=P(8-dr*4);b.line(a0[0],a0[1],a1[0],a1[1],R.glow?R.glow[0]:bl[0],1);}}
 else if(kind==='tome'){const op=o.open;if(op){b.rect(hx-4,hy-3,9,5,R.white[1]);b.rect(hx-4,hy+2,9,1,gd[1]);b.rect(hx,hy-3,1,6,gd[2]);b.px(hx-2,hy-1,gd[2]);b.px(hx-3,hy,gd[2]);b.px(hx+2,hy-1,gd[2]);b.px(hx+3,hy,gd[2]);b.px(hx-4,hy-3,R.white[2]);b.px(hx+4,hy-3,R.white[2]);}
  else{b.rect(hx-2,hy-3,5,6,gd[1]);b.rect(hx-2,hy-3,1,6,gd[2]);b.rect(hx+2,hy-2,1,4,R.white[1]);b.px(hx,hy-1,R.glow[0]);b.px(hx,hy,R.glow[1]);}}
 else if(kind==='fist'){b.rect(hx-1,hy-1,3,3,bl[1]);b.px(hx-1,hy-1,bl[0]);b.px(hx+1,hy+1,bl[2]);}
 else if(kind==='claw'){for(const n of[-2,0,2]){const p=P(0,n),q=P(5,n*.6);b.line(p[0],p[1],q[0],q[1],bl[1],1);const t=P(6,n*.6);b.px(t[0],t[1],bl[0]);}b.rect(hx-1,hy-1,3,3,hl[1]);}
 else if(kind==='shield'){const sh=o.big?5:4;b.ell(hx+.5,hy+.5,sh-.4,sh+1.2,R.metal[1]);b.ell(hx,hy,sh-1.6,sh,R.metal[0]);b.ell(hx+.5,hy+.5,1.6,2,gd[1]);b.px(hx,hy,gd[0]);}
 else if(kind==='bell'){seg(-6,8,hl[1],1);const t=P(9);b.rect(t[0]-2,t[1]-1,5,4,gd[1]);b.rect(t[0]-1,t[1]-2,3,1,gd[1]);b.px(t[0]-1,t[1],gd[0]);b.px(t[0],t[1]+3,gd[2]);}
}
/* 姿勢：{by:胴の上下, ln:前傾(負=前), hd:[dx,dy], fa:[x,y]前腕の手(肩基準), ba:後腕の手, fl:[x,lift]前足, bl:後足, wa:武器角, wb:後手の武器角, jump:全体の浮き, fx:追加表現} */
const POSE={
 idle:(d,i)=>{const s=d.style||{},b=[0,1,1,0][i],b2=[0,0,1,1][i];return{by:b,hd:[0,b2?0:0],fa:[s.fax??-5,(s.fay??3)+b2],ba:[s.bax??-3,(s.bay??4)+b],wa:s.wa??35,wb:s.wb??20,fl:[0,0],bl:[0,0]};},
 walk:(d,i)=>{const L=[[-3,0],[-1,1],[3,0],[1,0]][i],K=[[3,0],[1,0],[-3,0],[-1,1]][i],s=d.style||{};return{by:i%2,ln:-1,fa:[(s.fax??-5)+(i<2?1:-1),(s.fay??3)],ba:[(s.bax??-3)+(i<2?-1:1),s.bay??4],wa:(s.wa??35),wb:s.wb??20,fl:L,bl:K};},
 hurt:(d,i)=>({by:1,ln:3-i,hd:[2-i,-1],fa:[3,-2],ba:[4,1],wa:100,wb:120,fl:[1,0],bl:[3,0],jump:i?0:1}),
 guard:(d,i)=>({by:2,ln:-1,hd:[0,1],fa:[-5,-1],ba:[-6,0],wa:80,wb:95,fl:[-2,0],bl:[3,0],shieldUp:1}),
 dodge:(d,i)=>({by:1,ln:3,hd:[2,0],fa:[2,1],ba:[4,2],wa:60,wb:60,fl:[2,i?0:1],bl:[5,0],jump:i?0:2,sx:4}),
 down:(d,i)=>({by:3,ln:-4,hd:[-3,4],fa:[-4,5],ba:[-2,5],wa:-10,wb:-10,fl:[2,0],bl:[5,0],kneel:1}),
 item:(d,i)=>({by:i,hd:[0,0],fa:[-4,-5-i],ba:[-3,4],wa:90,wb:20,fl:[0,0],bl:[0,0]}),
 awaken:(d,i)=>({by:[1,0,0,0][i],ln:[0,1,1,1][i],hd:[0,[0,-1,-1,-1][i]],fa:[[-5,-5,-6,-6][i],[1,-7,-9,-8][i]],ba:[[-2,4,5,5][i],[2,-5,-7,-6][i]],wa:[40,85,95,90][i],wb:[30,100,110,105][i],fl:[-2,0],bl:[2,0],jump:[0,1,2,2][i]}),
 win:(d,i)=>{const w=(d.style||{}).win||'raise';if(w==='jump'){const j=[0,3,4,1][i];return{by:j?0:1,hd:[0,j?-1:0],fa:[-3,j?-8:-4],ba:[3,j?-8:-3],wa:95,wb:100,fl:[j?-1:0,j?1:0],bl:[j?1:0,j?1:0],jump:j};}
  if(w==='calm'){const b=[0,1,1,0][i];return{by:b,hd:[0,1],fa:[-2,1+b],ba:[-1,2+b],wa:-60,wb:-60,fl:[0,0],bl:[0,0]};}
  const b=[0,1,0,1][i];return{by:b,hd:[0,-1],fa:[-3,-9+b],ba:[-3,3+b],wa:92,wb:20,fl:[-1,0],bl:[1,0]};},
 cast:(d,i)=>{const b=[0,0,1,1][i];return{by:b,ln:[0,1,1,0][i],hd:[0,[0,-1,-1,0][i]],fa:[[-5,-6,-7,-6][i],[-2,-6,-8,-5][i]],ba:[[-3,-4,-4,-3][i],[2,0,-1,1][i]],wa:[60,80,85,70][i],wb:40,fl:[-1,0],bl:[1,0],open:1,glow:i>0}},
 /* 攻撃：武器の型ごと */
 atk:(d,i)=>ATKP[(d.style||{}).atk||'slash'](d,i)};
const ATKP={
 slash:(d,i)=>[{by:0,ln:2,hd:[1,0],fa:[4,-8],ba:[-3,2],wa:125,fl:[1,0],bl:[3,0]},{by:0,ln:1,hd:[0,0],fa:[1,-10],ba:[-4,1],wa:100,fl:[-1,1],bl:[3,0]},{by:1,ln:-3,hd:[-2,1],fa:[-7,-3],ba:[2,3],wa:-5,fl:[-5,0],bl:[4,0],arc:1},
  {by:2,ln:-3,hd:[-2,1],fa:[-6,2],ba:[3,3],wa:-55,fl:[-5,0],bl:[4,0],arc:2},{by:1,ln:-2,hd:[-1,1],fa:[-5,3],ba:[2,3],wa:-40,fl:[-4,0],bl:[3,0]},{by:0,ln:-1,hd:[0,0],fa:[-5,3],ba:[-2,4],wa:10,fl:[-2,0],bl:[1,0]}][i],
 heavy:(d,i)=>[{by:1,ln:1,hd:[0,0],fa:[0,-9],ba:[-2,-8],wa:95,fl:[0,0],bl:[2,0]},{by:0,ln:3,hd:[1,-1],fa:[3,-11],ba:[1,-10],wa:130,fl:[-1,0],bl:[3,0],jump:1},{by:0,ln:2,hd:[1,-1],fa:[2,-11],ba:[0,-10],wa:115,fl:[-3,2],bl:[3,0],jump:2},
  {by:3,ln:-4,hd:[-3,2],fa:[-7,0],ba:[-5,1],wa:-25,fl:[-6,0],bl:[4,0],arc:1,quake:1},{by:3,ln:-4,hd:[-3,2],fa:[-7,2],ba:[-5,2],wa:-35,fl:[-6,0],bl:[4,0],arc:2},{by:1,ln:-2,hd:[-1,1],fa:[-6,2],ba:[-4,2],wa:0,fl:[-3,0],bl:[2,0]}][i],
 stab:(d,i)=>[{by:2,ln:-2,hd:[-1,1],fa:[2,-1],ba:[-2,0],wa:10,wb:20,fl:[-2,0],bl:[4,0]},{by:2,ln:-4,hd:[-3,1],fa:[-8,-2],ba:[1,1],wa:5,wb:30,fl:[-6,0],bl:[4,0],arc:3},{by:2,ln:-3,hd:[-2,1],fa:[-2,0],ba:[-8,-3],wa:20,wb:0,fl:[-5,0],bl:[4,0],arc:3},
  {by:1,ln:-4,hd:[-3,0],fa:[-8,-5],ba:[-3,1],wa:40,wb:10,fl:[-6,1],bl:[3,0],arc:1,jump:1},{by:2,ln:-2,hd:[-1,1],fa:[-5,1],ba:[-4,2],wa:-30,wb:-20,fl:[-4,0],bl:[3,0]},{by:1,ln:-1,hd:[0,0],fa:[-4,2],ba:[-3,3],wa:20,wb:10,fl:[-2,0],bl:[1,0]}][i],
 shoot:(d,i)=>[{by:0,ln:0,hd:[0,0],fa:[-6,-2],ba:[-3,-2],wa:0,fl:[-2,0],bl:[2,0],draw:0},{by:0,ln:1,hd:[0,0],fa:[-7,-3],ba:[0,-3],wa:0,fl:[-3,0],bl:[2,0],draw:.5,arrow:1},{by:0,ln:2,hd:[1,0],fa:[-7,-3],ba:[3,-3],wa:0,fl:[-3,0],bl:[3,0],draw:1,arrow:1},
  {by:0,ln:2,hd:[1,0],fa:[-7,-3],ba:[4,-3],wa:0,fl:[-3,0],bl:[3,0],draw:1,arrow:1,glow:1},{by:0,ln:1,hd:[0,0],fa:[-7,-3],ba:[5,-4],wa:2,fl:[-3,0],bl:[3,0],draw:0,shot:1},{by:0,ln:0,hd:[0,0],fa:[-6,-1],ba:[2,-1],wa:10,fl:[-2,0],bl:[2,0],draw:0}][i],
 punch:(d,i)=>[{by:1,ln:-1,hd:[-1,0],fa:[0,-3],ba:[-3,-3],wa:0,wb:0,fl:[-2,0],bl:[3,0]},{by:1,ln:-3,hd:[-2,0],fa:[1,-2],ba:[-9,-4],wa:0,wb:0,fl:[-5,0],bl:[3,0],arc:3},{by:1,ln:-2,hd:[-2,0],fa:[-8,-3],ba:[-2,-2],wa:0,wb:0,fl:[-5,0],bl:[4,0],arc:3},
  {by:0,ln:1,hd:[0,-1],fa:[2,-4],ba:[-3,-2],wa:0,wb:0,fl:[-4,3],bl:[2,0],jump:2},{by:2,ln:-4,hd:[-3,1],fa:[-9,-5],ba:[2,0],wa:0,wb:0,fl:[-7,0],bl:[4,0],arc:1},{by:1,ln:-1,hd:[-1,0],fa:[-3,-3],ba:[-2,-2],wa:0,wb:0,fl:[-3,0],bl:[2,0]}][i],
 claw:(d,i)=>[{by:2,ln:-1,hd:[-1,1],fa:[3,-3],ba:[-2,1],wa:40,fl:[-1,0],bl:[3,0]},{by:0,ln:-2,hd:[-1,0],fa:[2,-9],ba:[-3,-2],wa:80,fl:[-3,2],bl:[2,1],jump:4},{by:0,ln:-4,hd:[-3,1],fa:[-6,-8],ba:[1,0],wa:30,fl:[-4,2],bl:[3,2],jump:5},
  {by:1,ln:-5,hd:[-3,2],fa:[-8,-1],ba:[2,2],wa:-30,fl:[-5,1],bl:[4,1],jump:2,arc:1},{by:3,ln:-4,hd:[-3,2],fa:[-6,3],ba:[2,3],wa:-60,fl:[-5,0],bl:[4,0],arc:2},{by:1,ln:-1,hd:[0,0],fa:[-4,2],ba:[-3,3],wa:10,fl:[-2,0],bl:[1,0]}][i],
 reap:(d,i)=>[{by:0,ln:2,hd:[1,0],fa:[2,-5],ba:[5,-3],wa:150,fl:[0,0],bl:[3,0]},{by:0,ln:3,hd:[1,0],fa:[4,-7],ba:[6,-4],wa:175,fl:[-1,0],bl:[3,0]},{by:1,ln:-1,hd:[-1,0],fa:[-3,-7],ba:[1,-4],wa:95,fl:[-3,0],bl:[3,0],arc:4},
  {by:2,ln:-4,hd:[-3,1],fa:[-7,-2],ba:[-3,0],wa:5,fl:[-5,0],bl:[4,0],arc:1},{by:2,ln:-4,hd:[-3,1],fa:[-6,2],ba:[-2,3],wa:-50,fl:[-5,0],bl:[4,0],arc:2},{by:1,ln:-1,hd:[0,0],fa:[-4,1],ba:[0,2],wa:40,fl:[-2,0],bl:[1,0]}][i],
 magic:(d,i)=>[{by:0,ln:1,hd:[0,0],fa:[-4,-3],ba:[-3,1],wa:70,fl:[0,0],bl:[1,0],open:1},{by:0,ln:2,hd:[1,-1],fa:[-2,-8],ba:[-4,-1],wa:95,fl:[0,0],bl:[2,0],open:1,glow:1},{by:0,ln:2,hd:[1,-1],fa:[-1,-10],ba:[-5,-3],wa:100,fl:[0,0],bl:[2,0],open:1,glow:1,jump:1},
  {by:1,ln:-2,hd:[-1,0],fa:[-8,-5],ba:[-6,-2],wa:15,fl:[-3,0],bl:[2,0],open:1,glow:1},{by:1,ln:-2,hd:[-1,0],fa:[-8,-4],ba:[-5,-1],wa:10,fl:[-3,0],bl:[2,0],open:1},{by:0,ln:0,hd:[0,0],fa:[-5,0],ba:[-3,2],wa:50,fl:[-1,0],bl:[1,0],open:1}][i]};
function heroPose(d,anim,i){const f=POSE[anim]||POSE.idle;let p=f(d,i);if(d.poseFix)p=d.poseFix(p,anim,i)||p;return p;}
/* 人型を描く */
function drawHumanoid(b,anim,i,d,opt){const o=opt?JSON.parse(opt):{},R=heroCols(d,o.aw),p=heroPose(d,anim,i),G=HSPEC;
 R.ink=R.ink||ramp('#1a1626');R.white=R.white||ramp('#f4f0e6');R.metal=R.metal||ramp('#aab4c8');R.leather=R.leather||ramp('#6a4630');R.glow=R.glow||ramp('#ffe27a');
 const wr=Object.assign({},R,{blade:ramp(o.wt&&TIERC[o.wt]?TIERC[o.wt]:(d.pal.blade||'#c8d0e0'))});if(o.wl)wr.blade=ramp(o.wl);if(o.aw&&d.aw&&d.aw.blade)wr.blade=ramp(d.aw.blade);
 const fl=d.float?[0,-1,-2,-1][i%4]-3:0,J=(p.jump||0)-fl,ox=HAX+(p.sx||0),oy=HAY-(d.hip??7)-J,by=p.by||0,ln=p.ln||0,hd=p.hd||[0,0];
 const tg=d.torso,tw=tg.reduce((a,r)=>Math.max(a,r.length),0),th=tg.length,tx=ox-(tw>>1)+(d.tdx||0),ty=oy-(d.tup??8)+by,m=gmap(R,G);
 const sh=r=>Math.round(ln*(1-r/(th-1||1))*.6);
 const shF=[tx+(d.sfx??tw-3)+sh(1),ty+(d.sy??2)],shB=[tx+(d.sbx??1)+sh(1),ty+(d.sy??2)];
 const legC=R[d.legs||'cloth2']||R.cloth,bootC=R[d.boots||'leather'],slv=R[d.sleeve||'cloth'],hand=R[d.glove||'skin'];
 const leg=(hx,f,front)=>part(b,q=>{const fx=ox+hx+f[0],fy=HAY-1-J-(f[1]||0)+(d.float?1:0),kx=ox+hx+Math.round(f[0]*.4),hy0=oy+(p.kneel?2:0);
  if(!d.robe){q.line(ox+hx,hy0,fx,fy-2,legC[front?1:2],2);q.rect(fx-(d.bigFoot?2:1),fy-1,d.bigFoot?4:3,2,bootC[front?1:2]);q.px(fx-(d.bigFoot?2:1),fy-1,bootC[front?0:1]);}
  else{q.rect(fx-1,fy-1,3,2,bootC[front?1:2]);}});
 const arm=(s,hpos,front,wk,wang,wo)=>{const hx=s[0]+hpos[0],hy=s[1]+hpos[1];
  if(wk&&!front&&wk!=='shield')part(b,q=>drawWeapon(q,wk,hx,hy,wang,wr,wo));
  part(b,q=>{q.line(s[0],s[1],hx,hy,slv[front?1:2],2);q.rect(hx,hy,2,2,hand[front?1:2]);if(d.bracer)q.rect(Math.round((s[0]+hx*2)/3),Math.round((s[1]+hy*2)/3),2,2,R[d.bracer][1]);});
  if(wk&&(front||wk==='shield'))part(b,q=>drawWeapon(q,wk,hx+(wk==='shield'?-1:0),hy+(wk==='shield'?1:0),wang,wr,wo));};
 const wo={open:p.open,draw:p.draw,arrow:p.arrow&&!p.shot,big:d.bigShield};
 /* 背面の飾り（マント・尻尾・翼・相棒） */
 if(d.back)d.back(b,{ox,oy,by,ln,i,anim,R,p,J,tx,ty,o});
 /* 後ろの腕（盾や二刀・弓の弦を引く手） */
 if(!d.noArms)arm(shB,p.ba||[-3,4],false,d.weaponB&&!(o.noW)?d.weaponB:null,(p.shieldUp&&d.weaponB==='shield')?90:(p.wb??20),wo);
 if(!d.noLegs){leg(d.legGap??2,p.bl||[0,0],false);leg(-(d.legGap??2)+1,p.fl||[0,0],true);}
 /* 胴 */
 part(b,q=>{const t=new Buf(tw,th);t.grid(tg,0,0,m);t.shear(sh);q.blit(t,tx,ty);});
 if(d.over)d.over(b,{ox,oy,by,ln,i,anim,R,p,J,tx,ty,o});
 /* 頭 */
 const hg=(o.aw&&d.headAw)||d.head,hw=hg.reduce((a,r)=>Math.max(a,r.length),0),hx0=ox-(hw>>1)+(d.hdx||0)+Math.round(ln*.7)+hd[0],hy0=ty-hg.length+(d.hup??2)+hd[1];
 part(b,q=>{q.grid(hg,hx0,hy0,m);if(anim==='hurt'||anim==='down'){/* 目を閉じる */for(let y=0;y<hg.length;y++)for(let x=0;x<hg[y].length;x++){const ch=hg[y][x];if(ch==='b'||ch==='w')q.px(hx0+x,hy0+y,R.skin[1]);}}});
 if(d.headTop)d.headTop(b,{hx0,hy0,i,anim,R,p,o});
 /* 前の腕と武器 */
 if(!d.noArms)arm(shF,p.fa||[-5,3],true,d.weapon&&!(o.noW)?d.weapon:null,p.wa??35,wo);
 if(d.front)d.front(b,{ox,oy,by,ln,i,anim,R,p,J,tx,ty,o,shF,shB});
 /* 発光（詠唱・覚醒） */
 if(p.glow&&d.glowAt!==0){const hx=shF[0]+(p.fa?p.fa[0]:0),hy=shF[1]+(p.fa?p.fa[1]:0),gc=R.glow;b.px(hx-2,hy-3,gc[0]);b.px(hx+2,hy-2,gc[1]);b.px(hx-3,hy+1,gc[1]);b.px(hx+1,hy-5,gc[0]);}
}
function regHero(key,d){SPDEF[key]=Object.assign({w:HW,h:HH,ax:HAX,ay:HAY,draw:drawHumanoid,human:1,face:[HAX-10+(d.hdx||0),HAY-(d.hip??7)-(d.tup??8)-d.head.length+(d.hup??2)-2-(d.float?3:0)+Math.max(0,d.head.length-13),18,18]},d);}
