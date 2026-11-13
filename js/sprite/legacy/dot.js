/* ===== ver0.19 ピクセルアート・レンダラ（dot.js） =====
 キャラクター／敵のドット絵を「実解像度」で描き起こすための土台。
 ・素材（マテリアル）ごとに 6 段階の色ランプ（輪郭／深い影／影／基本／光／ハイライト）を持つ
 ・ランプは基本色から色相をずらして作る（影は青紫寄り、光は黄寄り）＝SFC〜RS系の配色
 ・左上からの光で陰影を付け、輪郭線は黒ではなく「その色の最暗部」で引く
 ・拡大やぼかしは一切しない。1ドット＝1ピクセルで描き、ポーズごとにキャッシュする */
const PX=(()=>{
const LX=-.55,LY=-.66,LZ=.51;
const hex2=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return[h,s,l];}
function hsl2rgb(h,s,l){h=((h%360)+360)%360/360;const f=(p,q,t)=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};
 const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(v=>Math.max(0,Math.min(255,Math.round(v*255))));}
const hueTo=(h,t,f)=>{let d=((t-h+540)%360)-180;return h+d*f;};
const pack=([r,g,b])=>(255<<24|b<<16|g<<8|r)>>>0;
const RC={};
/* 基本色（＋任意で暗色）から 6 段階のランプを作る */
function ramp(base,dark){const key=base+(dark||'');if(RC[key])return RC[key];
 const[r,g,b]=hex2(base);let[h,s,l]=rgb2hsl(r,g,b);const grey=s<.08;
 const mk=(lm,hs,sm,warm)=>{const hh=grey?(warm?48:250):hueTo(h,warm?52:255,hs);const ss=grey?(warm?.05:.12+(.5-lm*.4)*.1):Math.min(1,s*sm);return hsl2rgb(hh,ss,Math.max(0,Math.min(1,lm)));};
 let out=[mk(l*.22,.34,1.15),mk(l*.46,.24,1.12),mk(l*.72,.12,1.06),[r,g,b],mk(l+(1-l)*.34,.12,.92,1),mk(l+(1-l)*.68,.2,.7,1)];
 if(dark){const d=hex2(dark),[dh,ds,dl]=rgb2hsl(...d);out[1]=d;out[2]=[Math.round(r*.45+d[0]*.55),Math.round(g*.45+d[1]*.55),Math.round(b*.45+d[2]*.55)];
  out[0]=hsl2rgb(hueTo(dh,255,.2),Math.min(1,ds*1.1),dl*.48);}
 return RC[key]=out.map(pack);}
const tint=(hex,f,sat=1,hs=0)=>{const[r,g,b]=hex2(hex);let[h,s,l]=rgb2hsl(r,g,b);l=f>=1?l+(1-l)*(f-1):l*f;const c=hsl2rgb(h+hs,Math.min(1,s*sat),Math.min(1,l));return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');};
const mix=(a,b,t)=>{const x=hex2(a),y=hex2(b);return'#'+x.map((v,i)=>Math.round(v*(1-t)+y[i]*t).toString(16).padStart(2,'0')).join('');};

class Buf{
 constructor(w,h){this.w=w;this.h=h;const n=w*h;this.m=new Uint8Array(n);this.l=new Uint8Array(n);this.z=new Uint16Array(n);this.f=new Uint8Array(n);this.reset();}
 reset(ox=0,oy=0,k=1,fl=1){this.m.fill(0);this.l.fill(0);this.z.fill(0);this.f.fill(0);this.zc=1;this.ox=ox;this.oy=oy;this.k=k;this.fl=fl;this.ramps=[null];this.mi={};this.flag=0;this.dith=0;this.glow=[0];return this;}
 /* マテリアル登録：name → ランプ。noOut=輪郭を出さない（炎・光など） */
 def(name,base,dark,noOut){let i=this.mi[name];if(!i){i=this.ramps.length;this.mi[name]=i;this.ramps.push(null);this.glow.push(0);}this.ramps[i]=Array.isArray(base)?base.map(c=>pack(hex2(c))):ramp(base,dark);this.glow[i]=noOut?1:0;return i;}
 part(noEdge){this.zc++;this.flag=noEdge?2:0;return this;}
 X(x){return this.ox+this.fl*x*this.k;}Y(y){return this.oy+y*this.k;}
 put(X,Y,mi,lv,fx){if(X<0||Y<0||X>=this.w||Y>=this.h)return;const i=Y*this.w+X;this.m[i]=mi;this.l[i]=lv;this.z[i]=this.zc;this.f[i]=this.flag|(fx?1:0);}
 lv(d,X,Y,o){d+=o.bias||0;const T=o.T||TH;let v=d<T[0]?1:d<T[1]?2:d<T[2]?3:d<T[3]?4:5;
  if(this.dith||o.dith){const e=.085;for(let i=0;i<4;i++)if(Math.abs(d-T[i])<e&&((X+Y)&1)){v=d<T[i]?i+2:i+1;break;}}
  if(v>(o.max||(o.spec?5:4)))v=o.max||(o.spec?5:4);if(v<(o.min||1))v=o.min||1;return v;}
 /* 楕円（球として陰影）。o.rot=回転, o.lv=固定段階, o.clip=(x,y)=>描くか（リグ座標） */
 ell(cx,cy,rx,ry,mat,o={}){const mi=this.mi[mat],k=this.k,CX=this.X(cx),CY=this.Y(cy),RX=rx*k,RY=ry*k,R=Math.max(RX,RY)+1,c=Math.cos((o.rot||0)*this.fl),s=Math.sin((o.rot||0)*this.fl);
  for(let Y=Math.floor(CY-R);Y<=Math.ceil(CY+R);Y++)for(let X=Math.floor(CX-R);X<=Math.ceil(CX+R);X++){const dx=X+.5-CX,dy=Y+.5-CY,u=(dx*c+dy*s)/RX,v=(-dx*s+dy*c)/RY,q=u*u+v*v;if(q>1)continue;
   if(o.clip&&!o.clip((X+.5-this.ox)/k*this.fl,(Y+.5-this.oy)/k))continue;
   if(o.lv){this.put(X,Y,mi,o.lv,o.fix);continue;}const nz=Math.sqrt(1-q),nx=u*c-v*s,ny=u*s+v*c;this.put(X,Y,mi,this.lv(nx*LX+ny*LY+nz*LZ*(o.round||1),X,Y,o),o.fix);}return this;}
 /* 先細りカプセル（腕・脚・尾など）。円柱として陰影 */
 limb(x0,y0,x1,y1,r0,r1,mat,o={}){const mi=this.mi[mat],k=this.k,AX=this.X(x0),AY=this.Y(y0),BX=this.X(x1),BY=this.Y(y1),R0=r0*k,R1=(r1==null?r0:r1)*k,R=Math.max(R0,R1)+1,dx=BX-AX,dy=BY-AY,L2=dx*dx+dy*dy||1e-6;
  for(let Y=Math.floor(Math.min(AY,BY)-R);Y<=Math.ceil(Math.max(AY,BY)+R);Y++)for(let X=Math.floor(Math.min(AX,BX)-R);X<=Math.ceil(Math.max(AX,BX)+R);X++){
   const px=X+.5-AX,py=Y+.5-AY;let t=(px*dx+py*dy)/L2;t=t<0?0:t>1?1:t;const r=R0+(R1-R0)*t,ex=px-dx*t,ey=py-dy*t,d2=ex*ex+ey*ey;if(d2>r*r)continue;
   if(o.clip&&!o.clip((X+.5-this.ox)/k*this.fl,(Y+.5-this.oy)/k,t))continue;
   if(o.lv){this.put(X,Y,mi,o.lv,o.fix);continue;}const nx=ex/r,ny=ey/r,nz=Math.sqrt(Math.max(0,1-d2/(r*r)));let d=nx*LX+ny*LY+nz*LZ;if(o.f)d+=o.f(t,(X+.5-this.ox)/k*this.fl,(Y+.5-this.oy)/k);this.put(X,Y,mi,this.lv(d,X,Y,o),o.fix);}return this;}
 /* 多角形。o.lv 固定 or o.f(x,y)=>明るさ(-1..1) */
 poly(pts,mat,o={}){const mi=this.mi[mat],k=this.k,P=pts.map(p=>[this.X(p[0]),this.Y(p[1])]);let y0=1e9,y1=-1e9,x0=1e9,x1=-1e9;for(const[x,y]of P){y0=Math.min(y0,y);y1=Math.max(y1,y);x0=Math.min(x0,x);x1=Math.max(x1,x);}
  for(let Y=Math.floor(y0);Y<=Math.ceil(y1);Y++)for(let X=Math.floor(x0);X<=Math.ceil(x1);X++){const px=X+.5,py=Y+.5;let ins=false;
   for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)ins=!ins;}if(!ins)continue;
   const rx=(px-this.ox)/k*this.fl,ry=(py-this.oy)/k;if(o.clip&&!o.clip(rx,ry))continue;
   this.put(X,Y,mi,o.f?this.lv(o.f(rx,ry),X,Y,o):(o.lv||3),o.fix);}return this;}
 /* 1ドット幅の線（刃・弦・杖など） */
 line(x0,y0,x1,y1,mat,lv=3,w=1){const mi=this.mi[mat];let X0=Math.round(this.X(x0)-.5),Y0=Math.round(this.Y(y0)-.5),X1=Math.round(this.X(x1)-.5),Y1=Math.round(this.Y(y1)-.5);
  const dx=Math.abs(X1-X0),dy=Math.abs(Y1-Y0),sx=X0<X1?1:-1,sy=Y0<Y1?1:-1;let e=dx-dy;const ww=Math.max(1,Math.round(w*this.k));
  for(;;){for(let a=0;a<ww;a++)for(let b=0;b<ww;b++)this.put(X0+a-(ww>>1),Y0+b-(ww>>1),mi,lv,1);if(X0===X1&&Y0===Y1)break;const e2=2*e;if(e2>-dy){e-=dy;X0+=sx;}if(e2<dx){e+=dx;Y0+=sy;}}return this;}
 /* 1ドット（スケール時は k×k のブロック） */
 px(x,y,mat,lv=3){const mi=this.mi[mat],n=Math.max(1,Math.round(this.k)),X=Math.round(this.X(x)-(this.fl<0?n:0)),Y=Math.round(this.Y(y));for(let a=0;a<n;a++)for(let b=0;b<n;b++)this.put(X+a,Y+b,mi,lv,1);return this;}
 rect(x,y,w,h,mat,lv=3){const mi=this.mi[mat],k=this.k;let X0=Math.round(this.X(x)),X1=Math.round(this.X(x+w));if(X0>X1)[X0,X1]=[X1,X0];const Y0=Math.round(this.Y(y)),Y1=Math.round(this.Y(y+h));
  for(let Y=Y0;Y<Y1;Y++)for(let X=X0;X<X1;X++)this.put(X,Y,mi,lv,1);return this;}
 /* 既に描かれたピクセルの段階だけを変える（模様・しわ・ハイライト） */
 tone(x,y,d,only){const X=Math.round(this.X(x)-(this.fl<0?1:0)),Y=Math.round(this.Y(y));if(X<0||Y<0||X>=this.w||Y>=this.h)return this;const i=Y*this.w+X;if(!this.m[i]||(only&&this.m[i]!==this.mi[only]))return this;
  this.l[i]=Math.max(1,Math.min(5,this.l[i]+d));this.f[i]|=1;return this;}
 /* 仕上げ：重なりの影 → 輪郭線 → RGBA */
 render(cv){const{w,h,m,l,z,f}=this,n=w*h,out=new Uint32Array(n);
  for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++){const i=Y*w+X;if(!m[i]||f[i]&1||this.glow[m[i]])continue;const zz=z[i];
   const up=Y>0&&m[i-w]&&z[i-w]>zz&&!(f[i-w]&2)&&!this.glow[m[i-w]],lf=X>0&&m[i-1]&&z[i-1]>zz&&!(f[i-1]&2)&&!this.glow[m[i-1]];
   const dn=Y<h-1&&m[i+w]&&z[i+w]>zz&&!(f[i+w]&2)&&!this.glow[m[i+w]],rt=X<w-1&&m[i+1]&&z[i+1]>zz&&!(f[i+1]&2)&&!this.glow[m[i+1]];
   if(up||lf)l[i]=l[i]>2?1:0;else if(dn||rt)l[i]=Math.min(l[i],2);}
  for(let i=0;i<n;i++)if(m[i])out[i]=this.ramps[m[i]][l[i]];
  for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++){const i=Y*w+X;if(m[i])continue;let nb=0;
   if(Y<h-1&&m[i+w]&&!this.glow[m[i+w]])nb=m[i+w];else if(X<w-1&&m[i+1]&&!this.glow[m[i+1]])nb=m[i+1];else if(Y>0&&m[i-w]&&!this.glow[m[i-w]])nb=m[i-w];else if(X>0&&m[i-1]&&!this.glow[m[i-1]])nb=m[i-1];
   if(nb)out[i]=this.ramps[nb][0];}
  cv=cv||document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d'),id=g.createImageData(w,h);new Uint32Array(id.data.buffer).set(out);g.putImageData(id,0,0);return cv;}
}
const TH=[-.34,.1,.6,.9];
/* 2関節IK：a→b を長さ l1,l2 の2本でつなぐ。bend=±1 で肘・膝の向き */
function ik(ax,ay,bx,by,l1,l2,bend){let dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy)||1e-6;const mx=l1+l2-.01;if(d>mx){dx*=mx/d;dy*=mx/d;d=mx;bx=ax+dx;by=ay+dy;}
 const a=(l1*l1-l2*l2+d*d)/(2*d),hh=Math.sqrt(Math.max(0,l1*l1-a*a)),ux=dx/d,uy=dy/d;return[ax+ux*a-uy*hh*bend,ay+uy*a+ux*hh*bend,bx,by];}
const whiteOf=src=>{const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);return c;};
return{Buf,ramp,tint,mix,ik,whiteOf,hex2,TH};})();

/* 既存の mk() が作る16×16スプライトに「どのドット絵データを・どの配色で作ったか」を覚えさせ、
   キーごとに控える（DOT.info）。色替え敵・星臨配色・虚蝕化配色を、新しい描画でもそのまま引き継ぐため。
   ver0.18 が IMG を自前の絵に差し替えても、控えは残る */
const DOT={info:{},snap(k){const im=IMG[k];if(im&&im._rows)DOT.info[k]={rows:im._rows,pal:im._pal||null};},snapAll(){for(const k in IMG)if(!/_w$/.test(k))DOT.snap(k);}};
{const _mk=mk;mk=function(rows,over,solid){const c=_mk(rows,over,solid);c._rows=rows;c._pal=over||null;c._solid=solid||null;return c;};
 for(const k in IMG){const b=k.replace(/_(w|aw)$/,'');if(SPR[b]){IMG[k]._rows=SPR[b];IMG[k]._pal=/_aw$/.test(k)?AWP[b]:null;IMG[k]._solid=/_w$/.test(k)?'#ffffff':null;}}}
