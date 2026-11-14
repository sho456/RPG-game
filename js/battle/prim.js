/* ===== ver0.34 戦闘エフェクトの部品（BXP） =====
 技の演出は、この部品を「形・色・動き・規模」の値を変えて組み合わせて作る（js/battle/data/）。
 すべて (x, y, o) の形。x,y は戦場の論理座標。o の共通項目：
   ramp  色の並び（属性名 '炎' など／色 1 つ／色の配列。明るい → 暗い）
   s     大きさの倍率　dur 長さ ms　delay 遅れ ms　layer 層（0 下・1 上・2 画面）　dir 前の向き（-1 左・1 右）
 きまり（Agent Sprite Forge の codeart2d の指針）：
   ・1 コマで読める形にする　・命中の瞬間に形が完成する　・熱い色 → 冷たい色へ、透明にはせず小さくして消す
 絵はすべてコードで描いている（画像生成は使っていない） */
'use strict';
const BXP=(()=>{
const{g,add,emit,burst,ramp,Q}=BX,{D,R,line,disc,ringDots}=g;
const TAU=6.2832,h1=(i,s=0)=>{const v=Math.sin(i*127.1+s*311.7)*43758.5453;return v-Math.floor(v);};
const eo=t=>1-(1-t)*(1-t),eo3=t=>1-Math.pow(1-t,3),ei=t=>t*t,cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const flk=(t,from=.8,rate=36)=>t>from&&(Math.floor(t*rate)&1);/* 消えぎわのちらつき */

/* ---- 三日月の斬撃：a0→a1 へ刃が走り、命中（hit）で弧が完成、尾が追って細る ---- */
function crescent(x,y,o={}){const a0=o.a0==null?-2.3:o.a0,a1=o.a1==null?.8:o.a1,r=(o.r||13)*(o.s||1),w=(o.w||3.4)*(o.s||1),sq=o.sq||1,rp=ramp(o.ramp),hit=o.hit||.42,tr=o.trail==null?.75:o.trail;
 return add(o.dur||240,t=>{const hd=eo(cl(t/hit)),tl=cl((t-hit*tr)/(1-hit*tr)),thin=t>hit?1-(t-hit)/(1-hit)*.7:1;if(tl>=1)return;
  const n=Math.ceil(Math.abs(a1-a0)*r*1.5),d=g.dot;
  for(let i=Math.floor(tl*n);i<=hd*n;i++){const u=i/n,a=a0+(a1-a0)*u,th=Math.max(d,w*Math.pow(Math.sin(u*3.1416),.8)*thin),cx=Math.cos(a),cy=Math.sin(a)*sq;
   for(let q=0;q<th;q+=d){const v=q/th,rr=r-q;D(x+cx*rr,y+cy*rr,v<.25?rp[1]:v<.6?rp[0]:rp[2]);}
   if(o.edge)D(x+cx*(r+d),y+cy*(r+d),rp[3]);}
  if(t<hit){const a=a0+(a1-a0)*hd;D(x+Math.cos(a)*r,y+Math.sin(a)*r*sq,rp[0],2);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 一文字の斬り筋：ang の向きに一瞬で走り、細い傷あとが残って裂ける ---- */
function cut(x,y,o={}){const ang=o.ang==null?-.5:o.ang,len=(o.len||30)*(o.s||1),w=o.w||2,rp=ramp(o.ramp),cx=Math.cos(ang),cy=Math.sin(ang);
 return add(o.dur||260,t=>{const hd=eo3(cl(t/.25)),tl=cl((t-.3)/.7),d=g.dot;if(flk(t,.85))return;
  const x0=x-cx*len/2,y0=y-cy*len/2,n=Math.ceil(len/d);
  for(let i=Math.floor(tl*n*.5);i<=hd*n-Math.floor(tl*n*.5);i++){const u=i/n,th=t<.3?w*Math.sin(u*3.1416)+.4:.4;
   for(let q=-th/2;q<=th/2;q+=d)D(x0+cx*len*u-cy*q,y0+cy*len*u+cx*q,Math.abs(q)<d?rp[0]:rp[2]);}
  if(t<.3)D(x0+cx*len*hd,y0+cy*len*hd,rp[0],2);
  if(o.split&&t>.3){const k=(t-.3)*o.split*6;for(let i=0;i<=n;i+=3){const u=i/n;D(x0+cx*len*u-cy*k,y0+cy*len*u+cx*k,rp[3]);D(x0+cx*len*u+cy*k,y0+cy*len*u-cx*k,rp[3]);}}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 突き：前から集まる線と、中心のひし形の閃光 ---- */
function stab(x,y,o={}){const dir=o.dir||-1,n=o.n||5,L=(o.len||24)*(o.s||1),rp=ramp(o.ramp),gap=o.gap||2.4;
 return add(o.dur||200,t=>{const d=g.dot,l0=L*(1-t);
  for(let i=0;i<n;i++){const m=i-(n-1)/2,yy=y+m*gap*(1-t*.5),len=l0*(1-Math.abs(m)*.2),x0=x-dir*(len+3-t*7);R(Math.min(x0,x0+dir*len),yy,len,d,m===0?rp[0]:rp[Math.min(3,1+Math.abs(m)|0)]);}
  const s=(1-t)*5*(o.s||1);for(let q=-s;q<=s;q+=d)R(x+dir*2-(s-Math.abs(q))*.6,y+q,(s-Math.abs(q))*1.2+d,d,rp[0]);},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 命中の星形の閃光：熱い芯が素早く縮む ---- */
function flare(x,y,o={}){const sz=o.s||1,n=o.rays||4,rot=o.rot||0,rp=ramp(o.ramp),len0=(o.len||11)*sz;
 return add(o.dur||190,t=>{const d=g.dot,len=len0*(1-ei(t)),core=(1-t)*3.2*sz;
  for(let i=0;i<n;i++){const a=rot+i/n*TAU,c=Math.cos(a),s=Math.sin(a),L=len*(i%2&&n>4?.55:1);for(let q=core*.5;q<L;q+=d){const u=q/L;D(x+c*q,y+s*q,u<.45?rp[0]:u<.8?rp[1]:rp[2],u<.3&&sz>1.2?2:1);}}
  if(core>.5)for(let q=-core;q<=core;q+=d){const w=(core-Math.abs(q))*1.3;R(x-w/2,y+q,w+d,d,rp[0]);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 衝撃波の輪：広がりながら細く・冷たくなる。sq＜1 で地面の輪 ---- */
function shock(x,y,o={}){const r0=(o.r0==null?2:o.r0)*(o.s||1),r1=(o.r1||17)*(o.s||1),sq=o.sq==null?1:o.sq,rp=ramp(o.ramp);
 return add(o.dur||300,t=>{if(flk(t,.78,30))return;const r=r0+(r1-r0)*eo(t),ci=Math.min(rp.length-1,Math.floor(t*rp.length*.9));
  ringDots(x,y,r,[rp[ci],rp[Math.max(0,ci-1)]],{sq,n:t<.35&&(o.thick||1)>1?2:1,gap:o.dash?[4,2]:null,dense:o.dense});
  if((o.thick||1)>1&&t<.6)ringDots(x,y,r-g.dot*1.5,rp[Math.min(rp.length-1,ci+1)],{sq});},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 火花：尾を引いて飛び、短く・冷たくなる ---- */
function sparks(x,y,o={}){const run=()=>burst(x,y,o.n||8,{ramp:o.ramp,speed:o.speed||1.9,ang:o.ang,spread:o.spread,g:o.g==null?.07:o.g,life:o.life||16,kind:1,drag:.94,s:1,layer:o.layer});
 if(o.delay)setTimeout(run,o.delay*ANIM.SP());else run();}

/* ---- 砂ぼこり：足元からふくらんで昇り、外へ流れて暗くなる ---- */
function dust(x,y,o={}){const n=Math.max(2,Math.round((o.n||5)*Q().pm)),sp=(o.spread||10)*(o.s||1),rp=ramp(o.ramp||['#e8dcc0','#c8b890','#a08c68','#6e5c44','#463a2c']),dir=o.dir||0,seed=Math.random()*99;
 return add(o.dur||420,t=>{const d=g.dot;for(let i=0;i<n;i++){const st=i/n*.25,u=cl((t-st)/(1-st));if(u<=0||u>=1)continue;const ox=(h1(i,seed)-.5)*sp+(dir*u*6),r=(1+u*2.6)*(o.s||1)*(.7+h1(i,seed+1)*.6),c=rp[Math.min(rp.length-1,Math.floor(u*rp.length))];
   if(u>.75&&(i+Math.floor(u*20))%2)continue;disc(x+ox+Math.sign(ox||1)*u*4,y-u*(5+h1(i,seed+2)*5)*(o.s||1),r,c,.7);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 魔法陣：style で図形が変わる（0 二重の輪／3〜8 その角数の星形）。回りながら開き、ちらついて消える ---- */
function circle(x,y,o={}){const r=(o.r||14)*(o.s||1),sq=o.sq==null?.32:o.sq,rp=ramp(o.ramp),st=o.style||0,spin=o.spin==null?2.2:o.spin,step=o.step||2;
 return add(o.dur||700,t=>{if(flk(t,.84,40))return;const gr=eo3(cl(t*4.5)),rr=r*gr,rot=t*spin+(o.rot||0);
  ringDots(x,y,rr,[rp[1],rp[2]],{sq});ringDots(x,y,rr*.8,rp[2],{sq,gap:[6,4],a0:-rot});
  if(st>=3){const pts=[];for(let i=0;i<st;i++){const a=rot+i/st*TAU;pts.push([x+Math.cos(a)*rr*.8,y+Math.sin(a)*rr*.8*sq]);}
   for(let i=0;i<st;i++){const a=pts[i],b=pts[(i+step)%st];line(a[0],a[1],b[0],b[1],rp[i%2?1:2]);}
   for(const p of pts)D(p[0],p[1],rp[0],2);}
  else{ringDots(x,y,rr*.55,rp[1],{sq,gap:[3,2],a0:rot*1.5});for(let i=0;i<8;i++){const a=rot+i/8*TAU;D(x+Math.cos(a)*rr*.9,y+Math.sin(a)*rr*.9*sq,rp[0],i%2?1:2);}}
  if(o.runes){const n=o.runes;for(let i=0;i<n;i++){const a=-rot*.7+i/n*TAU,px=x+Math.cos(a)*rr*1.12,py=y+Math.sin(a)*rr*1.12*sq;R(px,py-g.dot*((i%3)+1),g.dot,g.dot*((i%3)+1),rp[1]);}}
  if(o.glow!==0){const n=6;for(let i=0;i<n;i++){const a=i/n*TAU+rot*2,ph=(t*3+i*.17)%1;D(x+Math.cos(a)*rr*.7,y+Math.sin(a)*rr*.7*sq-ph*7,ph<.5?rp[0]:rp[2]);}}},o.layer==null?0:o.layer,o.delay||0);}

/* ---- 収束：まわりの粒が 1 点へ吸い込まれる（溜め） ---- */
function gather(x,y,o={}){const n=Math.max(3,Math.round((o.n||12)*Q().pm)),ms=o.ms||380,r0=(o.r||20)*(o.s||1);
 for(let i=0;i<n;i++){const a=Math.random()*TAU,r=r0*(.6+Math.random()*.5),l=ms*ANIM.SP()/16.7*(.55+Math.random()*.45);
  emit(x+Math.cos(a)*r,y+Math.sin(a)*r*(o.sq||.8),-Math.cos(a)*r/l,-Math.sin(a)*r*(o.sq||.8)/l,{ramp:ramp(o.ramp).slice().reverse(),life:l,s:i%4?1:2,kind:o.kind||0,layer:o.layer});}}

/* ---- 立ちのぼる粒：回復・強化・オーラ ---- */
function rise(x,y,o={}){const n=Math.max(2,Math.round((o.n||10)*Q().pm)),w=(o.w||16)*(o.s||1),hh=o.h||26;
 for(let i=0;i<n;i++)setTimeout(()=>emit(x+(Math.random()-.5)*w,y-(o.y0||0)-Math.random()*4,(Math.random()-.5)*.15,-(hh/38)*(.6+Math.random()*.7),{ramp:o.ramp,life:38*(.7+Math.random()*.5),drag:.985,s:i%3?1:2,kind:o.kind==null?2:o.kind,layer:o.layer}),(o.delay||0)*ANIM.SP()+i*(o.gap==null?28:o.gap)*ANIM.SP());}

/* ---- 光の柱：一気に開いてゆっくり細る。芯は白 ---- */
function pillar(x,y,o={}){const w0=(o.w||10)*(o.s||1),hh=o.h||90,rp=ramp(o.ramp);
 return add(o.dur||480,t=>{const w=(t<.18?eo(t/.18):1-ei((t-.18)/.82))*w0,d=g.dot;if(w<d)return;
  /* 上の端は網点で薄く抜き、根元は広げる（板に見えないように） */
  const top=hh*.3;for(let q=0;q<top;q+=d){const u=q/top,ww=w*(.35+u*.65);if((Math.round(q/d)&1)&&u<.6)continue;R(x-ww/2,y-hh+q,ww,d,u<.5?rp[3]:rp[2]);if(u>.3)R(x-ww*.2,y-hh+q,ww*.4,d,rp[1]);}
  R(x-w/2,y-hh+top,w,hh-top+2,rp[2]);R(x-w*.32,y-hh+top,w*.64,hh-top+2,rp[1]);R(x-w*.14,y-hh+top*.6,w*.28,hh-top*.6+2,rp[0]);
  for(let q=0;q<4;q++)R(x-w*(.5+q*.16),y+1-q*d,w*(1+q*.32),d,q<2?rp[0]:rp[1]);
  for(let i=0;i<5;i++){const ph=(t*2.2+i*.21)%1;D(x+(h1(i,3)-.5)*w*1.6,y-ph*hh*.8,rp[0],i%2?1:2);}
  ringDots(x,y+1,w*.9+t*6,rp[1],{sq:.3});},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 稲妻：from（省略時は真上）から (x,y) へ。数コマごとに形を変え、枝が出る ---- */
function bolt(x,y,o={}){const fr=o.from||[x+(h1(1,x)-.5)*24,y-(o.h||80)],rp=ramp(o.ramp||'雷'),seg=o.seg||11,jit=(o.jit||7)*(o.s||1),seeds=[Math.random()*9,Math.random()*9,Math.random()*9];
 return add(o.dur||300,t=>{if(t>.72)return;const sd=seeds[Math.floor(t*10)%3],w=(o.w||1.4)*(o.s||1)*(t<.4?1:.6);let px=fr[0],py=fr[1];
  for(let i=1;i<=seg;i++){const u=i/seg,nx=i===seg?x:fr[0]+(x-fr[0])*u+(h1(i,sd)-.5)*2*jit*(1-u*.5),ny=fr[1]+(y-fr[1])*u+(i===seg?0:(h1(i,sd+4)-.5)*3);
   const st=Math.max(1,Math.ceil(Math.max(Math.abs(nx-px),Math.abs(ny-py))/g.dot));for(let q=0;q<st;q++){const v=q/st,qx=px+(nx-px)*v,qy=py+(ny-py)*v;R(qx-w/2,qy,w+g.dot,g.dot,rp[2]);D(qx,qy,rp[0]);}
   if(o.branch!==0&&i%3===1&&i<seg-1){const bx=nx+(h1(i,sd+7)-.5)*18,by=ny+7+h1(i,sd+8)*8;line(nx,ny,bx,by,rp[1]);}
   px=nx;py=ny;}
  for(let i=0;i<6;i++){const a=i/6*TAU+t*9;D(x+Math.cos(a)*(3+t*11),y+Math.sin(a)*(1.5+t*5),rp[1]);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 氷の結晶：地面から生え、最後に砕け散る ---- */
function shards(x,y,o={}){const n=o.n||5,rp=ramp(o.ramp||'氷'),sz=o.s||1,seed=Math.random()*99,by=y+(o.base==null?6:o.base);let broke=0;
 return add(o.dur||460,(t,e)=>{const d=g.dot;if(t>.8){if(!broke){broke=1;burst(x,y-4,10,{ramp:rp,speed:1.6,g:.12,life:22,up:.5,kind:1});}if((Math.floor(t*40)&1))return;}
  for(let j=0;j<n;j++){const gr=eo3(cl(t*3.4-j*.2));if(gr<=0)continue;const dx=(j-(n-1)/2)*4.6*sz+(h1(j,seed)-.5)*3,h0=(8+h1(j,seed+1)*10+(j===Math.floor(n/2)?5:0))*sz,hh=h0*gr,lean=(h1(j,seed+2)-.5)*.5,w0=(2.4+h1(j,seed+3)*1.6)*sz;
   for(let q=0;q<hh;q+=d){const u=q/hh,w=(u<.25?u/.25:1-(u-.25)/.75)*w0+d,cx=x+dx+lean*q;R(cx-w/2,by-q,w/2,d,u>.8?rp[0]:rp[1]);R(cx,by-q,w/2,d,u>.8?rp[1]:rp[3]);}
   D(x+dx+lean*hh,by-hh,rp[0]);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 炎：ゆらめく舌が立ち、火の粉が昇る ---- */
function flame(x,y,o={}){const sz=o.s||1,w=(o.w||9)*sz,hh=(o.h||24)*sz,rp=ramp(o.ramp||'炎'),by=y+(o.base==null?5:o.base);
 burst(x,y-2,o.embers==null?8:o.embers,{ramp:rp,speed:.8,up:.9,g:-.03,life:28,kind:2,r:w*.5});
 return add(o.dur||420,t=>{const d=g.dot,H2=(t<.28?eo(t/.28):1-ei((t-.28)/.72))*hh,ph=Math.floor(t*16),cols=Math.max(3,Math.round(w/1.7));
  for(let i=0;i<cols;i++){const m=(i-(cols-1)/2)/((cols-1)/2||1),h2=H2*(1-m*m*.8)*(.72+((i*7+ph*3)%5)*.07);
   for(let q=0;q<h2;q+=d){const u=q/h2;R(x+m*w/2+Math.sin((q+ph*1.7)*.8+i)*.9-.9*sz,by-q,1.9*sz,d,u<.28?rp[0]:u<.52?rp[1]:u<.8?rp[2]:rp[3]);}}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 旋風：高さを変えた楕円の弧が、回りながら昇る ---- */
function gale(x,y,o={}){const sz=o.s||1,r=(o.r||11)*sz,hh=(o.h||26)*sz,rp=ramp(o.ramp||'風'),n=o.n||4,spin=o.spin||9;
 burst(x,y,o.leaves==null?6:o.leaves,{ramp:rp,speed:1.3,life:26,kind:3,up:.4,r:r*.6});
 return add(o.dur||440,t=>{if(flk(t,.86))return;const env=t<.2?t/.2:1-(t-.2)/.8*.5;
  for(let j=0;j<n;j++){const u=(j/n+t*.6)%1,yy=y+6-u*hh,rr=r*(.45+u*.75)*env,a0=t*spin+j*1.7,len=1.9+u;
   const st=Math.ceil(rr*len*1.6);for(let i=0;i<=st;i++){const v=i/st,a=a0+v*len;D(x+Math.cos(a)*rr,yy+Math.sin(a)*rr*.3,v>.75?rp[0]:v>.35?rp[2]:rp[3],v>.8&&sz>1?2:1);}}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 岩の槍：dir の向きへ、順に地面から突き出す ---- */
function spikes(x,y,o={}){const n=o.n||4,sz=o.s||1,rp=ramp(o.ramp||'地'),dir=o.dir||0,by=y+(o.base==null?7:o.base),seed=Math.random()*99;
 burst(x,by,o.debris==null?8:o.debris,{ramp:rp,speed:1.3,up:1.5,g:.14,life:26,spread:3.14,ang:-1.57});
 return add(o.dur||440,t=>{const d=g.dot;for(let j=0;j<n;j++){const st=j*.1,u=cl((t-st)/.22),dn=cl((t-.72)/.28),gr=eo3(u)*(1-ei(dn));if(gr<=0)continue;
   const dx=dir?dir*(j-(n-1)/2)*6.5*sz:(j-(n-1)/2)*6*sz,h0=(11+h1(j,seed)*9+(dir?j*2.5:(j===1?7:0)))*sz,hh=h0*gr,w0=(4.5+h1(j,seed+1)*2.5)*sz,lean=dir*.18+(h1(j,seed+2)-.5)*.3;
   for(let q=0;q<hh;q+=d){const v=q/hh,w=(1-v)*w0+d,cx=x+dx+lean*q;R(cx-w/2,by-q,w*.42,d,rp[1]);R(cx-w/2+w*.42,by-q,w*.58,d,v>.6?rp[2]:rp[3]);}}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 球：暗い（または光る）球がふくらむ。mode 'implode' は縮んで弾ける ---- */
function orb(x,y,o={}){const r0=(o.r||9)*(o.s||1),rp=ramp(o.ramp||'闇'),core=o.core||rp[4],imp=o.mode==='implode';let done=0;
 return add(o.dur||440,t=>{const env=imp?(t<.7?1-eo(t/.7)*.75:0):(t<.5?eo(t/.5):1-ei((t-.5)/.5)),r=r0*env;
  if(imp&&t>=.7){if(!done){done=1;flare(x,y,{ramp:rp,rays:8,s:1.3});shock(x,y,{ramp:rp,r1:r0*1.9});}return;}
  if(r<g.dot)return;disc(x,y,r,core);ringDots(x,y,r,[rp[1],rp[2]],{dense:5.5});if(r>3)D(x-r*.4,y-r*.4,rp[0],2);
  for(let i=0;i<(o.orbit==null?6:o.orbit);i++){const a=i/6*TAU-t*8,rr=r+2+((i*3)%4);D(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.8,i%2?rp[1]:rp[0]);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 光線：(x,y) から to へ。芯は白、縁に色。太さが脈打つ ---- */
function beam(x,y,o={}){const to=o.to||[x-60,y],rp=ramp(o.ramp),w0=(o.w||5)*(o.s||1),dx=to[0]-x,dy=to[1]-y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
 return add(o.dur||360,t=>{const ext=eo3(cl(t/.18)),w=w0*(t<.18?1:1-ei((t-.18)/.82))*(1+Math.sin(t*60)*.12),d=g.dot;if(w<d*.6)return;
  const n=Math.ceil(len*ext/d);for(let i=0;i<=n;i+=1){const px=x+ux*i*d,py=y+uy*i*d;for(let q=-w/2;q<=w/2;q+=d){const v=Math.abs(q)/(w/2);D(px-uy*q,py+ux*q,v<.35?rp[0]:v<.7?rp[1]:rp[2]);}}
  disc(x,y,w*.8,rp[0]);if(ext>=1)disc(to[0],to[1],w*(.7+Math.sin(t*50)*.2),rp[1]);},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 飛び道具：(x,y) から to へ飛ぶ。kind＝arrow 矢／orb 魔弾／shard 氷片／wave 斬撃波。着弾を待てる ---- */
function proj(x,y,o={}){const to=o.to||[x-60,y],ms=o.ms||150,rp=ramp(o.ramp),kind=o.kind||'orb',arc=o.arc==null?(kind==='arrow'?5:2):o.arc,dx=to[0]-x,dy=to[1]-y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,sz=o.s||1;let lt=0;
 add(ms,t=>{const u=o.ease==='in'?ei(t):t,px=x+dx*u,py=y+dy*u-Math.sin(u*3.1416)*arc,d=g.dot;
  if(o.trail!==0&&t-lt>.06){lt=t;emit(px,py,-ux*.3+(Math.random()-.5)*.3,-uy*.3+(Math.random()-.5)*.3,{ramp:rp,life:12,s:1,kind:kind==='arrow'?0:2});}
  if(kind==='arrow'){for(let i=0;i<10;i++)D(px-ux*i*d,py-uy*i*d,i<2?rp[0]:i>7?rp[2]:'#d8c8a0');D(px-ux*8*d-uy*d,py-uy*8*d+ux*d,rp[2]);D(px-ux*8*d+uy*d,py-uy*8*d-ux*d,rp[2]);}
  else if(kind==='shard'){for(let i=0;i<8;i++){const w=(i<3?i/3:1-(i-3)/5)*2.2*sz+d;for(let q=-w/2;q<=w/2;q+=d)D(px-ux*i*d-uy*q,py-uy*i*d+ux*q,q<0?rp[0]:rp[2]);}}
  else if(kind==='wave'){const hh=7*sz;for(let q=-hh;q<=hh;q+=d){const bw=(1-(q/hh)*(q/hh))*3*sz;for(let b=0;b<bw;b+=d)D(px-ux*(b+Math.abs(q)*.5)-uy*q,py-uy*(b+Math.abs(q)*.5)+ux*q,b<d*1.5?rp[0]:b<bw*.6?rp[1]:rp[2]);}}
  else{const r=2.6*sz*(1+Math.sin(t*40)*.12);disc(px,py,r,rp[2]);disc(px,py,r*.6,rp[0]);for(let i=1;i<6;i++)D(px-ux*i*1.5+Math.sin(i+t*30)*.6,py-uy*i*1.5+Math.cos(i*2+t*30)*.6,i<3?rp[1]:rp[3]);}},o.layer==null?1:o.layer,o.delay||0);
 return ANIM.T(ms+(o.delay||0));}

/* ---- 集中線：画面の端から注目点へ。層 2（画面全体） ---- */
function speedlines(x,y,o={}){const n=Math.round((o.n||18)*(Q().rich?1:.5)),col=o.col||'#ffffff',seed=Math.random()*99,fx=x/W,fy=y/H;
 return add(o.dur||320,t=>{const env=t<.2?t/.2:1-(t-.2)/.8;for(let i=0;i<n;i++){if((i+Math.floor(t*14))%3===0)continue;const a=i/n*TAU+h1(i,seed)*.2,r0=.42+h1(i,seed+1)*.2,r1=r0+.18+h1(i,seed+2)*.3,st=8;
   for(let q=0;q<st;q++){const v=q/st,rr=r0+(r1-r0)*v;g.scr(fx+Math.cos(a)*rr-.004,fy+Math.sin(a)*rr*.9-.004,.004+v*.006,.004+v*.006,col,env*(.25+v*.5));}}},2,o.delay||0);}

/* ---- 花びら・羽：ひらひら舞い落ちる ---- */
function petals(x,y,o={}){burst(x,y,o.n||10,{ramp:o.ramp||['#ffffff','#ffd8ec','#ff9ad6','#d868a8','#8a3a70'],speed:o.speed||1.1,up:o.up==null?.7:o.up,g:o.g==null?.035:o.g,drag:.96,life:o.life||44,kind:3,r:o.r||6,layer:o.layer});}

/* ---- きらめき：武器の先などに出る小さな十字の光（予備動作の合図） ---- */
function glint(x,y,o={}){const rp=ramp(o.ramp||'光'),sz=(o.s||1)*4.5;
 return add(o.dur||220,t=>{const l=sz*(t<.35?t/.35:1-(t-.35)/.65),d=g.dot;for(let q=-l;q<=l;q+=d){D(x+q,y,Math.abs(q)<l*.4?rp[0]:rp[2]);D(x,y+q,Math.abs(q)<l*.4?rp[0]:rp[2]);}if(l>2){D(x+l*.4,y+l*.4,rp[1]);D(x-l*.4,y-l*.4,rp[1]);D(x+l*.4,y-l*.4,rp[1]);D(x-l*.4,y+l*.4,rp[1]);}},o.layer==null?1:o.layer,o.delay||0);}

/* ---- 守りの膜：六角の網目の盾。当たると波打つ ---- */
function ward(x,y,o={}){const r=(o.r||12)*(o.s||1),rp=ramp(o.ramp||'buff'),sqx=o.sqx||.8;
 return add(o.dur||520,t=>{if(flk(t,.8,30))return;const gr=eo3(cl(t*5));ringDots(x,y,r*gr,[rp[1],rp[0]],{gap:[5,4],a0:t*1.5});
  for(let i=0;i<6;i++){const a=i/6*TAU+.52,b=a+TAU/6;line(x+Math.cos(a)*r*gr*sqx*.62,y+Math.sin(a)*r*gr*.62,x+Math.cos(b)*r*gr*sqx*.62,y+Math.sin(b)*r*gr*.62,rp[2]);}
  const sw=(t*2.4)%1;for(let q=-r*.7;q<=r*.7;q+=g.dot)D(x-r*.6+sw*r*1.2+q*.35,y+q,rp[0]);},o.layer==null?1:o.layer,o.delay||0);}

return{crescent,cut,stab,flare,shock,sparks,dust,circle,gather,rise,pillar,bolt,shards,flame,gale,spikes,orb,beam,proj,speedlines,petals,glint,ward,h1};})();
