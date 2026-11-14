/* ===== ver0.34 戦闘演出の基盤（BX） =====
 ver1.0 に向けた戦闘演出の全面刷新の土台。ロジック（ダメージ計算・行動順）には触れず、見せ方だけを受け持つ。
 ・設定      ：G.set.fx＝{q:品質, aw:星臨演出, shake:画面の揺れ, flash:点滅}（BX.set()）
 ・時間の倍率：BX.scaled(倍率, fn) の間だけ、戦闘の待ち時間（wait・ANIM.T）をまとめて縮める（星臨の短縮・省略）
 ・品質      ：高／標準／低負荷／自動。粒子の数と上限を決める（BX.Q()）。自動は描画の遅れを見て段階を下げる
 ・粒子      ：使い回し（プール）。上限を超えた分は出さない。消えるときは透明にせず「小さく・冷たい色へ」
 ・エフェクト：BX.add(長さms, 描く関数(t,e), 層, 遅れms)。層 0＝キャラの下、1＝キャラの上、2＝画面全体
 ・カメラ    ：BX.cam.to({z,x,y}, ms)・punch・reset。キャンバスと名札・数字を CSS でまとめて拡大する
 ・残像      ：BX.ghost(u, {col,n,gap})
 描画は FX19（js/motion/fx19.js）と同じ「ドットの格子」に乗せる（FX19.D / FX19.R）。時計は ANIM（ヒットストップで止まる）。
 絵はすべてコードで描いている（画像生成は使っていない） */
'use strict';
const BX=(()=>{
/* ---------- 設定 ---------- */
const DEF={q:'auto',aw:'full',shake:2,flash:1};
function set(){try{if(typeof G!=='undefined'&&G&&G.set){if(!G.set.fx)G.set.fx=Object.assign({},DEF);for(const k in DEF)if(G.set.fx[k]==null)G.set.fx[k]=DEF[k];return G.set.fx;}}catch(e){}return DEF;}

/* ---------- 時間の倍率（SPD を「基準×倍率」にする） ---------- */
const BASE={1:SPD[1],2:SPD[2],4:SPD[4]};let TS=1;
for(const k in BASE)Object.defineProperty(SPD,k,{get:()=>BASE[k]*TS,enumerable:true,configurable:true});
async function scaled(ts,fn){const t0=TS;TS=ts;try{return await fn();}finally{TS=t0;}}

/* ---------- 品質 ---------- */
const TIER={high:{pm:1.3,cap:900,rich:1},std:{pm:1,cap:520,rich:1},low:{pm:.45,cap:200,rich:0}},ORD=['low','std','high'];
let autoT='std',slow=0,fast=0,lastF=0,avg=16.7;
function Q(){const q=set().q;return TIER[q==='auto'?autoT:q]||TIER.std;}
function measure(){const t=performance.now(),dt=t-lastF;lastF=t;if(dt>200||dt<=0)return;avg+=(dt-avg)*.08;
 if(set().q!=='auto')return;
 if(avg>25){fast=0;if(++slow>90){slow=0;const i=ORD.indexOf(autoT);if(i>0)autoT=ORD[i-1];}}
 else if(avg<18.2){slow=0;if(++fast>600){fast=0;const i=ORD.indexOf(autoT);if(i<1)autoT=ORD[i+1];}}/* 自動で上げるのは標準まで */
 else{slow=Math.max(0,slow-1);fast=0;}}

/* ---------- 色 ---------- */
const mix=(a,b,t)=>PX.mix(a,b,t),lit=(c,t=.5)=>PX.mix(c,'#ffffff',t),drk=(c,t=.4)=>PX.mix(c,'#000000',t);
/* 属性の色の並び（明るい → 暗い。粒子は時間とともにこの順に冷える） */
const RAMP={
 '炎':['#fff6c0','#ffd24a','#ff8a28','#e0401c','#7a1c10'],'氷':['#ffffff','#d8f6ff','#8fdcff','#4aa8e8','#2a5aa8'],
 '雷':['#ffffff','#fff8a0','#ffe14a','#c89a18','#6a5a10'],'風':['#ffffff','#e0ffe8','#8ff0a8','#3fbf78','#1f7a50'],
 '地':['#fff0c8','#f0d090','#d0a060','#8a6a3a','#4a3418'],'光':['#ffffff','#fffbe0','#fff3a6','#ffd65a','#c89a30'],
 '闇':['#f0e0ff','#c8a0ff','#9a5cf0','#5a2aa0','#22083c'],'斬':['#ffffff','#e8f0ff','#b8c8f0','#7888c0','#3a4478'],
 '打':['#ffffff','#fff0c0','#ffd070','#d09030','#6a4410'],'突':['#ffffff','#e0fff8','#a0f0e0','#50b8a8','#1f6a60'],
 heal:['#ffffff','#d8ffe4','#7dffa8','#38c070','#187a40'],buff:['#ffffff','#fff3b0','#ffe27a','#e0a830','#8a5a10'],
 debuff:['#f0d8ff','#c890f0','#8a50c0','#502878','#280a40'],blood:['#ffffff','#ffd0c8','#ff7a6a','#c83030','#601010'],
 star:['#ffffff','#fff8d8','#ffe27a','#ff9ad6','#7a5cf0'],'':['#ffffff','#e8f0ff','#b8c8f0','#7888c0','#3a4478']};
const ramp=r=>Array.isArray(r)?r:(RAMP[r]||(typeof r==='string'&&r[0]==='#'?[lit(r,.85),lit(r,.45),r,drk(r,.35),drk(r,.65)]:RAMP['']));

/* ---------- 描画の道具（FX19 の格子に乗せる） ---------- */
let C=null,K=3,P=2,SX=0,SY=0;
const D=(x,y,c,n)=>FX19.D(x,y,c,n),R=(x,y,w,h,c)=>FX19.R(x,y,w,h,c),DOT=()=>P/K;
function line(x0,y0,x1,y1,c,n=1){const d=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)),st=Math.max(1,Math.ceil(d/(DOT()*n)));for(let i=0;i<=st;i++){const u=i/st;D(x0+(x1-x0)*u,y0+(y1-y0)*u,c,n);}}
function disc(x,y,r,c,sq=1){const d=DOT();for(let dy=-r;dy<=r;dy+=d){const w=Math.sqrt(Math.max(0,r*r-dy*dy));R(x-w,y+dy*sq,w*2,d,c);}}
function ringDots(x,y,r,c,o={}){const n=Math.max(8,Math.ceil(r*(o.dense||4.6))),sq=o.sq==null?1:o.sq,a0=o.a0||0;for(let i=0;i<n;i++){if(o.gap&&(i%o.gap[0])>=o.gap[1])continue;const a=a0+i/n*6.2832;D(x+Math.cos(a)*r,y+Math.sin(a)*r*sq,Array.isArray(c)?c[i%c.length]:c,o.n||1);}}
/* 画面座標（層 2 用）：割合 0〜1 で矩形を塗る */
function scr(x,y,w,h,c,a=1){if(!C)return;C.globalAlpha=a;C.fillStyle=c;C.fillRect(Math.round(x*C.canvas.width),Math.round(y*C.canvas.height),Math.ceil(w*C.canvas.width),Math.ceil(h*C.canvas.height));C.globalAlpha=1;}
const g={D,R,line,disc,ringDots,scr,get dot(){return DOT();},get ctx(){return C;},get k(){return K;},get p(){return P;}};

/* ---------- エフェクトの一覧 ---------- */
const E=[],EPOOL=[];
function add(dur,f,layer=1,delay=0,o){const e=EPOOL.pop()||{};e.t0=ANIM.now+delay*ANIM.SP();e.dur=Math.max(1,dur*ANIM.SP());e.f=f;e.layer=layer;e.o=o||null;e.seed=Math.random()*1000;e.dead=0;E.push(e);return e;}
function kill(e){if(e)e.dead=1;}

/* ---------- 粒子（プール） ---------- */
const PT=[];let pn=0;
/* o＝{ramp, life（フレーム）, g（重力）, drag, s（大きさ 1〜3）, kind：0 点／1 尾を引く火花／2 またたき／3 ひらひら, layer} */
function emit(x,y,vx,vy,o={}){const q=Q();if(pn>=q.cap)return null;let p=PT[pn];if(!p)p=PT[pn]={};pn++;
 p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.l=p.l0=Math.max(2,o.life||24);p.g=o.g||0;p.dr=o.drag==null?1:o.drag;p.s=o.s||1;p.r=ramp(o.ramp);p.k=o.kind||0;p.ly=o.layer==null?1:o.layer;p.ph=Math.random()*6.28;return p;}
/* まとめて出す。n は品質で増減する。o.ang・o.spread（ラジアン）で向きを絞る */
function burst(x,y,n,o={}){const q=Q(),m=Math.max(1,Math.round(n*q.pm)),sp=o.speed==null?1.2:o.speed,a0=o.ang==null?0:o.ang,spr=o.spread==null?6.2832:o.spread;
 for(let i=0;i<m;i++){const a=a0+(Math.random()-.5)*spr,v=sp*(.45+Math.random()*.75),r=o.r?Math.random()*o.r:0;
  emit(x+Math.cos(a)*r,y+Math.sin(a)*r*(o.sq||1),Math.cos(a)*v,Math.sin(a)*v*(o.sq||1)-(o.up||0),{ramp:o.ramp,life:(o.life||22)*(.6+Math.random()*.7),g:o.g,drag:o.drag,s:o.s||(Math.random()<.3?2:1),kind:o.kind,layer:o.layer});}}
function drawParts(layer,dt){for(let i=pn-1;i>=0;i--){const p=PT[i];if(p.ly!==layer)continue;
  p.vx*=Math.pow(p.dr,dt);p.vy=p.vy*Math.pow(p.dr,dt)+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;
  if(p.l<=0){PT[i]=PT[--pn];PT[pn]=p;continue;}
  const u=1-p.l/p.l0,c=p.r[Math.min(p.r.length-1,Math.floor(u*p.r.length))],s=u>.7?Math.max(1,p.s-1):p.s;
  if(p.k===2&&(Math.floor(p.l+p.ph*3)%4)<2)continue;
  if(p.k===3){const sw=Math.sin(p.ph+p.l*.22)*1.2;D(p.x+sw,p.y,c,s);if(s>1)D(p.x+sw+.66,p.y+.66,p.r[Math.min(p.r.length-1,2)],1);continue;}
  D(p.x,p.y,c,s);
  if(p.k===1){const n=u<.5?3:2;for(let j=1;j<=n;j++)D(p.x-p.vx*j*.7,p.y-p.vy*j*.7,p.r[Math.min(p.r.length-1,Math.floor(u*p.r.length)+j)],1);}}}

/* ---------- 残像 ---------- */
const GREQ=[],SIL=new WeakMap();
function sil(cv,col){let m=SIL.get(cv);if(!m){m={};SIL.set(cv,m);}if(m[col])return m[col];const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const x=c.getContext('2d');x.drawImage(cv,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return m[col]=c;}
/* u の今の姿を、その場に色つきの影として残す。n 枚を gap ms おきに */
function ghost(u,o={}){const n=Math.max(1,Math.round((o.n||3)*(Q().rich?1:.5)));for(let i=0;i<n;i++)setTimeout(()=>GREQ.push({u,col:o.col||'#bfe0ff',dur:o.dur||220,a:o.a||.55}),i*(o.gap||45)*ANIM.SP());}
function takeGhosts(){while(GREQ.length){const r=GREQ.pop(),u=r.u,A=u&&u.A;if(!A||A.none||!A.cur)continue;
  try{const f=SPRX.frame(A.name,A.cur,A.palKey,A.pal,A.flip,A.sc*DS,A.extra);if(!f)continue;const[fx,fy]=V19.foot(u),m=f.cv._spx?{ax:f.cv._spx.ax,ay:f.cv._spx.ay}:null,s=sil(f.cv,r.col),x=fx+A.wx+(A.kb||0),y=fy+A.wy,w=f.w,h=f.h,ax=f.ax,ay=f.ay;
   add(r.dur,t=>{if(!C)return;const X0=Math.round(x*K/P)*P+SX,Y0=Math.round(y*K/P)*P+SY,st=t<.34?1:t<.67?.6:.3;if(m)s._spx=m;C.globalAlpha=r.a*st;C.drawImage(s,X0-ax*P,Y0-ay*P,w*P,h*P);C.globalAlpha=1;},0);}catch(e){}}}

/* ---------- 画面全体の効き（層 2）：暗転・色・帯 ---------- */
const SCN={dim:0,dimTo:0,dimV:0,tint:null,bars:0,barsTo:0};
function dim(a,ms=200){SCN.dimTo=a;SCN.dimV=Math.abs(a-SCN.dim)/Math.max(1,ms*ANIM.SP()/16.7);}
function tint(col,a,ms){SCN.tint={col,a,t0:ANIM.now,dur:Math.max(1,ms*ANIM.SP())};}
function bars(on){SCN.barsTo=on?1:0;}
function flash(col='#ffffff',n=10){if(typeof B==='undefined'||!B)return;const f=set().flash?n:Math.min(n,5);B.flashBg=Math.max(B.flashBg||0,f);B.flashCol=col;}
function shake(n){if(typeof B==='undefined'||!B)return;const s=set().shake;if(!s)return;B.shake=Math.max(B.shake||0,Math.round(s===1?Math.min(5,n*.5):n));}

/* ---------- カメラ（CSS でキャンバス・名札・数字をまとめて拡大） ---------- */
const CAM={z:1,x:.5,y:.5,from:null,to:null,t0:0,dur:0,last:''};
const cam={
 /* o＝{z:倍率, x,y:注目する点（戦場の論理座標）} */
 to(o,ms=200,ease='io'){if(typeof W==='undefined')return;const tz=Q().rich?(o.z||1):1+((o.z||1)-1)*.5;CAM.from={z:CAM.z,x:CAM.x,y:CAM.y};CAM.to={z:tz,x:o.x==null?CAM.x:Math.max(0,Math.min(1,o.x/W)),y:o.y==null?CAM.y:Math.max(0,Math.min(1,o.y/H))};
  if(CAM.z<=1.001){CAM.from.x=CAM.to.x;CAM.from.y=CAM.to.y;}CAM.t0=performance.now();CAM.dur=Math.max(1,ms*ANIM.SP());CAM.ease=ease;},
 punch(o,ms=240){this.to(o,ms*.3,'out');setTimeout(()=>this.reset(ms*.7),ms*.3*ANIM.SP());},
 reset(ms=220){this.to({z:1},ms,'io');},
 snap(){CAM.to=null;CAM.z=1;apply();}};
const CEL=()=>['#cv','#labels','#pops'].map(s=>document.querySelector(s)).filter(Boolean);
function apply(){const s=CAM.z<=1.001?'':`scale(${CAM.z.toFixed(3)})`;const key=s+CAM.x.toFixed(3)+CAM.y.toFixed(3);if(key===CAM.last)return;CAM.last=key;
 for(const el of CEL()){el.style.transformOrigin=s?`${(CAM.x*100).toFixed(1)}% ${(CAM.y*100).toFixed(1)}%`:'';el.style.transform=s;}}
function camTick(){if(CAM.to){let k=(performance.now()-CAM.t0)/CAM.dur;if(k>=1){k=1;}const e=(ANIM.EASE[CAM.ease]||ANIM.EASE.io)(k),f=CAM.from,t=CAM.to;CAM.z=f.z+(t.z-f.z)*e;CAM.x=f.x+(t.x-f.x)*e;CAM.y=f.y+(t.y-f.y)*e;if(k>=1)CAM.to=null;}apply();}

/* ---------- 描画（FX19.draw に続けて呼ばれる） ---------- */
let lastNow=0;
function draw(ctx,k,p,layer,sx,sy){C=ctx;K=k;P=p;SX=sx;SY=sy;const now=ANIM.now;
 if(layer===0){measure();camTick();takeGhosts();
  if(typeof B!=='undefined'&&B){const s=set();if(!s.shake)B.shake=0;else if(s.shake===1&&B.shake>5)B.shake=5;if(!s.flash&&B.flashBg>6)B.flashBg=6;}
  /* 暗転（背景だけを暗くして、キャラとエフェクトを浮かせる） */
  if(SCN.dim!==SCN.dimTo){const d=SCN.dimTo-SCN.dim;SCN.dim+=Math.sign(d)*Math.min(Math.abs(d),SCN.dimV||1);}
  if(SCN.dim>.01)scr(0,0,1,1,'#05020e',SCN.dim);}
 const dt=layer===0?Math.min(3,(now-lastNow)/16.7):0;
 for(let i=E.length-1;i>=0;i--){const e=E[i];if(e.dead){E.splice(i,1);EPOOL.push(e);continue;}if(now<e.t0)continue;const t=(now-e.t0)/e.dur;if(t>=1){E.splice(i,1);e.f=null;e.o=null;EPOOL.push(e);continue;}
  if(e.layer===layer||(layer===1&&e.layer===2)){if(e.layer!==2||layer===1){try{e.f(t,e);}catch(x){e.dead=1;if(!draw._err){draw._err=1;console.error(x);}}}}}
 if(layer===0){PDT=Math.min(3,(now-lastNow)/16.7);lastNow=now;}
 drawParts(layer,PDT);
 if(layer===1){const tn=SCN.tint;if(tn){const t=(now-tn.t0)/tn.dur;if(t>=1)SCN.tint=null;else scr(0,0,1,1,tn.col,tn.a*(1-t));}
  if(SCN.bars!==SCN.barsTo)SCN.bars+=Math.sign(SCN.barsTo-SCN.bars)*Math.min(Math.abs(SCN.barsTo-SCN.bars),.12);
  if(SCN.bars>.01){scr(0,0,1,.09*SCN.bars,'#05020e');scr(0,1-.09*SCN.bars,1,.09*SCN.bars,'#05020e');}}}
let PDT=1;
function clear(){E.length=0;pn=0;GREQ.length=0;SCN.dim=SCN.dimTo=0;SCN.tint=null;SCN.bars=SCN.barsTo=0;cam.snap();TS=1;}
{const _d=FX19.draw;FX19.draw=function(ctx,k,p,layer,sx,sy){_d(ctx,k,p,layer,sx,sy);draw(ctx,k,p,layer,sx||0,sy||0);};
 const _c=FX19.clear;FX19.clear=function(){_c();clear();};}

/* ---------- 位置 ---------- */
/* 'a' 行動者の中心 'af' 足元 'ah' 頭上 ／ 't' 対象の中心 'tf' 足元 'th' 頭上 ／ 'c' 戦場の中央 */
function at(u,where='mid'){if(!u||u.x==null)return[W/2,H/2];const A=u.A||{};if(where==='foot'){const[x,y]=V19.foot(u);return[x+(A.wx||0),y+(A.wy||0)];}const[x,y]=V19.mid(u);if(where==='head')return[x,y-V19.dims(u).h*.55];return[x,y];}
const dir=u=>u&&u.side===0?-1:1;/* 前（相手のいる方向）：味方は左、敵は右 */

return{set,DEF,scaled,get ts(){return TS;},Q,TIER,get tier(){const q=set().q;return q==='auto'?autoT:q;},get fps(){return 1000/avg;},
 mix,lit,drk,RAMP,ramp,g,add,kill,emit,burst,ghost,dim,tint,bars,flash,shake,cam,clear,at,dir,
 get count(){return{fx:E.length,parts:pn};}};})();
