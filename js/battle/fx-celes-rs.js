/* ===== セレスの技・術の演出（CFX。ver0.66 の正本。旧戦闘の座標で直接描く） =====
 「何が起きたか」が一目で分かる形にする：
  刻の矢＝杖先に時計が現れ、3 本の針が抜けて矢になって飛ぶ（最後の 1 本で大きく着弾＝ダメージ）
  遅延の砂＝敵の頭上に大きな砂時計が現れて返り、砂が敵へ降り注ぐ（遅れる・目がくらむ）
  クロノスロウ＝敵の足元に時計の陣。針が急に遅くなり、青い波が敵を包む・頭上に下向きの山形（素早さ↓）
  加速の刻＝味方の足元に金の時計の陣。針が速く回り、上向きの山形が昇る（素早さ↑）
 体の動き（cast のコマ）は TDA（js/battle/celes.js が actK を立てる）。命中の数字は着弾の時刻まで待つ（hit を包む）。
 時刻は「×1 の秒」で書き、戦闘の速さで縮む（js/battle/celes.js と同じ rate）。描くのは draw の後（キャラ・旧エフェクトの上・加算）。 */
'use strict';
const CFX=(()=>{
const TAU=Math.PI*2,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ez=k=>1-Math.pow(1-cl(k,0,1),3),ei=k=>Math.pow(cl(k,0,1),2);
const rate=()=>1.7/((typeof SPD!=='undefined'&&SPD[speed])||1.7);
const now=()=>performance.now()/1000;
const KEYS={tokiya:1,chien:1,chronoslow:1,kasoku:1};
const keyOf=sk=>{try{return RSC.keyOf(sk);}catch(e){return null;}};
const has=(u,sk)=>!!(u&&u.side===0&&u.id==='celes'&&sk&&KEYS[keyOf(sk)]);
const PAL={m:'176,122,255',g:'242,179,71',c:'159,216,255',w:'255,255,255',d:'106,63,208'},PAW={m:'127,156,255',g:'242,226,160',c:'191,230,255',w:'255,255,255',d:'42,63,160'};
let FX=[];
/* 位置 */
function foot(u){try{const f=V19.foot(u),w=ANIM.world(u);return[f[0]+w[0],f[1]+w[1]];}catch(e){return[u.x+8*u.sc,u.y+16*u.sc];}}
const hgt=u=>{try{return V19.dims(u).h;}catch(e){return 24;}};
const mid=u=>{const[x,y]=foot(u);return[x,y-hgt(u)*.5];};
const tip=u=>{const[x,y]=foot(u),h=hgt(u);return[x-h*.28,y-h*.92];};/* 杖先（味方は左向き） */
/* 部品 */
function glow(g,x,y,r,c,a){if(r<=0||a<=0)return;const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,`rgba(${c},${a})`);q.addColorStop(1,`rgba(${c},0)`);g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2);}
function line(g,x0,y0,x1,y1,c,a,w){g.strokeStyle=`rgba(${c},${a*.35})`;g.lineWidth=w*3;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle=`rgba(${c},${a})`;g.lineWidth=w;g.stroke();}
function star(g,x,y,r,c,a){g.fillStyle=`rgba(${c},${a})`;g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.22,y-r*.22);g.lineTo(x+r,y);g.lineTo(x+r*.22,y+r*.22);g.lineTo(x,y+r);g.lineTo(x-r*.22,y+r*.22);g.lineTo(x-r,y);g.lineTo(x-r*.22,y-r*.22);g.closePath();g.fill();}
/* 時計の文字盤（sy＝縦のつぶれ。地面に置くときは .36） */
function dial(g,x,y,r,sy,P,a,lit,hands){g.save();g.translate(x,y);g.scale(1,sy);
 g.strokeStyle=`rgba(${P.m},${a*.5})`;g.lineWidth=r*.16;g.beginPath();g.arc(0,0,r,0,TAU);g.stroke();
 g.strokeStyle=`rgba(${P.c},${a})`;g.lineWidth=Math.max(.35,r*.05);g.beginPath();g.arc(0,0,r,0,TAU);g.stroke();g.beginPath();g.arc(0,0,r*.78,0,TAU);g.stroke();
 for(let i=0;i<12;i++){const an=i/12*TAU-Math.PI/2,on=i<lit,L=i%3===0?.2:.11;g.strokeStyle=`rgba(${on?P.g:P.c},${a*(on?1:.45)})`;g.lineWidth=Math.max(.35,r*(i%3===0?.07:.04));
  g.beginPath();g.moveTo(Math.cos(an)*r*(.86-L),Math.sin(an)*r*(.86-L));g.lineTo(Math.cos(an)*r*.86,Math.sin(an)*r*.86);g.stroke();}
 for(const[an,len,w,c]of hands||[]){g.strokeStyle=`rgba(${c||P.w},${a})`;g.lineWidth=Math.max(.4,r*w);g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(an)*r*len,Math.sin(an)*r*len);g.stroke();}
 g.fillStyle=`rgba(${P.w},${a})`;g.beginPath();g.arc(0,0,Math.max(.5,r*.07),0,TAU);g.fill();g.restore();}
/* 着弾：白い芯→時計の目盛りの形の 12 本の光→輪→星の粒 */
function burst(g,x,y,k,s,P){if(k<0||k>1)return;const a=1-k;glow(g,x,y,s*(10+8*k),P.m,.55*a);glow(g,x,y,s*(5-3*k),P.w,a);
 for(let i=0;i<12;i++){const an=i/12*TAU+.13,r0=s*(3+10*ez(k)),r1=r0+s*(i%3===0?7:4)*(1-k*.6);line(g,x+Math.cos(an)*r0,y+Math.sin(an)*r0,x+Math.cos(an)*r1,y+Math.sin(an)*r1,i%3===0?P.g:P.c,a,.5*s);}
 g.strokeStyle=`rgba(${P.c},${a*.8})`;g.lineWidth=.6*s;g.beginPath();g.arc(x,y,s*(4+16*ez(k)),0,TAU);g.stroke();}
/* 下向き・上向きの山形（素早さ↓↑） */
function chev(g,x,y,dir,P,c,a){g.strokeStyle=`rgba(${c},${a})`;g.lineWidth=1.5;g.lineJoin='round';g.beginPath();g.moveTo(x-4.5,y-dir*2.2);g.lineTo(x,y+dir*2.2);g.lineTo(x+4.5,y-dir*2.2);g.stroke();}
/* 砂時計（返る角 rot） */
function hourglass(g,x,y,s,rot,P,a,fill){g.save();g.translate(x,y);g.rotate(rot);
 const w=s*.62,h=s;glow(g,0,0,s*1.4,P.m,.25*a);
 g.fillStyle=`rgba(${P.d},${a*.35})`;g.beginPath();g.moveTo(-w,-h);g.lineTo(w,-h);g.lineTo(s*.08,0);g.lineTo(w,h);g.lineTo(-w,h);g.lineTo(-s*.08,0);g.closePath();g.fill();
 /* 砂：上の山が減り、下の山が増える */
 const up=1-fill,dn=fill;g.fillStyle=`rgba(${P.g},${a})`;
 if(up>0){const yy=-h*up*.9;g.beginPath();g.moveTo(-w*(-yy/h),yy);g.lineTo(w*(-yy/h),yy);g.lineTo(s*.06,-1);g.lineTo(-s*.06,-1);g.closePath();g.fill();}
 if(dn>0){g.beginPath();g.moveTo(-w,h);g.lineTo(w,h);g.lineTo(0,h-h*dn*.85);g.closePath();g.fill();}
 g.strokeStyle=`rgba(${P.c},${a})`;g.lineWidth=Math.max(.5,s*.07);g.beginPath();g.moveTo(-w,-h);g.lineTo(w,-h);g.lineTo(s*.08,0);g.lineTo(w,h);g.lineTo(-w,h);g.lineTo(-s*.08,0);g.closePath();g.stroke();
 g.strokeStyle=`rgba(${P.g},${a})`;g.lineWidth=Math.max(.7,s*.12);for(const yy of[-h-s*.06,h+s*.06]){g.beginPath();g.moveTo(-w*1.18,yy);g.lineTo(w*1.18,yy);g.stroke();}
 g.restore();}
const rnd=(i,j)=>{const v=Math.sin(i*127.1+j*311.7)*43758.5453;return v-Math.floor(v);};

/* ---------- 技ごとの時間割（×1 の秒）。imp＝ダメージ・効果の数字を出す時刻 ---------- */
const DEF={
 /* 刻の矢：0〜.55 杖先の時計が灯る → .55/.68/.81 針が矢になって飛ぶ（.16 秒）→ 3 本目の着弾 .97 が本命 */
 tokiya:{imp:.97,dur:1.6,draw(g,s,o){const{u,P}=o,T=o.ts[0];if(!T)return;const[tx,ty]=tip(u),[ex,ey]=mid(T),r=11+4*ez(s/.4);
  const fade=s<1.2?1:1-(s-1.2)/.4;
  if(s<1.05){const lit=Math.floor(cl(s/.5,0,1)*12),a=cl(s/.15,0,1)*(s<.85?1:1-(s-.85)/.2),gone=[s>.55,s>.68,s>.81];
   const hs=[[-Math.PI/2+s*9,.92,.06,P.w],[-Math.PI/2+s*3,.7,.09,P.g],[-Math.PI/2+s*1.2,.5,.12,P.c]].filter((_,i)=>!gone[i]);
   glow(g,tx,ty,r*2.2,P.m,.45*a);dial(g,tx,ty,r,1,P,a,lit,hs);
   if(s<.55)for(let i=0;i<8;i++){const an=i/8*TAU+s*4,d=r*3*(1-((s*2+i/8)%1));star(g,tx+Math.cos(an)*d,ty+Math.sin(an)*d,1.9,P.g,.8*a);}}
  [.55,.68,.81].forEach((t0,i)=>{const k=(s-t0)/.16;if(k<0)return;const big=i===2;
   if(k<=1){const e=ez(k),x=tx+(ex-tx)*e,y=ty+(ey-ty)*e-Math.sin(e*Math.PI)*(10-i*3),an=Math.atan2(ey-ty,ex-tx);
    for(let j=1;j<=5;j++){const e2=ez(k-j*.06);if(e2<0)break;const x2=tx+(ex-tx)*e2,y2=ty+(ey-ty)*e2-Math.sin(e2*Math.PI)*(10-i*3);glow(g,x2,y2,4-j*.5,P.m,.4*(1-j/6));}
    const L=big?15:11;line(g,x-Math.cos(an)*L,y-Math.sin(an)*L,x,y,big?P.g:P.c,1,big?1.6:1.1);glow(g,x,y,big?8:5.5,P.w,.9);star(g,x,y,big?4.2:3,P.w,1);}
   else burst(g,ex+(i-1)*2,ey+(i-1)*1.5,(s-t0-.16)/(big?.55:.3),big?1.9:.95,P);});
  if(s>.97)glow(g,ex,ey,30*fade,P.g,.2*fade);}},
 /* 遅延の砂：0〜.35 砂時計が現れる → .35〜.6 返る → .6〜1.25 砂が敵へ降る（.9 で積もる＝数字） → 敵の上に小さな砂時計 */
 chien:{imp:.9,dur:1.9,draw(g,s,o){const{P,ts}=o;if(!ts.length)return;
  let cx=0,top=1e9;for(const t of ts){const[x,y]=foot(t);cx+=x;top=Math.min(top,y-hgt(t));}cx/=ts.length;const hy=Math.max(14,top-22),S=13;
  const a=cl(s/.25,0,1)*(s<1.3?1:1-(s-1.3)/.35),rot=Math.PI*ez((s-.35)/.25),fill=cl((s-.6)/.7,0,1);
  if(a>0)hourglass(g,cx,hy,S*(.6+.4*ez(s/.3)),rot,P,a,fill);
  /* 砂の流れ：首から各敵へ。粒は弧を描いて落ちる */
  if(s>.6&&s<1.45)ts.forEach((t,ti)=>{const[fx,fy]=foot(t),ty0=fy-hgt(t)*.9;for(let i=0;i<40;i++){const ph=(s*1.6+rnd(i,ti))%1,k=ph;if(s-.6<k*.5)continue;
    const x=cx+(fx-cx)*k+(rnd(i,ti+7)-.5)*4*k,y=hy+S+(ty0-hy-S)*ei(k)+Math.sin(k*Math.PI)*-4;const aa=(s<1.25?1:1-(s-1.25)/.2)*.9;
    g.fillStyle=`rgba(${rnd(i,3)<.3?P.w:P.g},${aa})`;g.fillRect(x-.7,y-.7,1.4,1.4);}});
  /* 積もる：敵の体を砂が覆う（足元の山＋舞う粒） */
  ts.forEach((t,ti)=>{const k=(s-.85)/.9;if(k<0||k>1)return;const[fx,fy]=foot(t),h=hgt(t),aa=1-k;
   g.fillStyle=`rgba(${P.g},${.7*aa})`;g.beginPath();g.ellipse(fx,fy,8+4*ez(k*2),2.2,0,Math.PI,0);g.fill();glow(g,fx,fy-h*.5,h*.7,P.g,.25*aa);
   for(let i=0;i<10;i++){const y=fy-h*rnd(i,ti)-k*8*rnd(i,1),x=fx+(rnd(i,ti+3)-.5)*h*.8;g.fillStyle=`rgba(${P.g},${aa*.9})`;g.fillRect(x,y,.8,.8);}
   const ia=cl(k*4,0,1)*aa;hourglass(g,fx,fy-h-8,4.6,Math.PI*ez(k*1.5),P,ia,cl(k*1.2,0,1));});}},
 /* クロノスロウ：0〜.45 足元に時計の陣 → 針が速く回って .45〜.9 で急に遅くなる → .72 青い波が敵を包む（数字）→ 頭上に下向きの山形 */
 chronoslow:{imp:.72,dur:1.9,draw(g,s,o){const{P,ts}=o;if(!ts.length)return;
  let cx=0,cy=0;for(const t of ts){const[x,y]=foot(t);cx+=x;cy+=y;}cx/=ts.length;cy/=ts.length;let R=22;for(const t of ts){const[x,y]=foot(t);R=Math.max(R,Math.hypot(x-cx,(y-cy)/.36)+12);}
  const a=cl(s/.2,0,1)*(s<1.45?1:1-(s-1.45)/.4),ang=s<.45?s*22:(.45*22+(1-Math.exp(-(s-.45)*5))*2.2);
  if(a>0){glow(g,cx,cy,R*1.1,P.c,.12*a);dial(g,cx,cy,R*ez(s/.35),.36,P,a,12,[[ang,.95,.03,P.w],[ang/12,.6,.05,P.g]]);}
  [.72,.86].forEach((t0,i)=>{const k=(s-t0)/.5;if(k<0||k>1)return;g.save();g.translate(cx,cy-6);g.scale(1,.55);g.strokeStyle=`rgba(${P.c},${(1-k)*.9})`;g.lineWidth=1.6-k;g.beginPath();g.arc(0,0,R*(.25+1.05*ez(k)),0,TAU);g.stroke();g.restore();});
  ts.forEach((t,ti)=>{const k=(s-.72)/1.1;if(k<0||k>1)return;const[fx,fy]=foot(t),h=hgt(t),aa=(1-k)*cl(k*6,0,1);
   /* 敵を包む青い時の膜（縦の帯が下へ流れる） */glow(g,fx,fy-h*.5,h*.75,P.c,.3*aa);
   for(let i=0;i<3;i++){const yy=fy-h-4-((k*14+i*4)%12);chev(g,fx,yy,1,P,P.c,aa*(1-((k*14+i*4)%12)/12));}
   dial(g,fx,fy-h-16,4.6,1,P,aa*.9,12,[[-Math.PI/2+k*1.2,.85,.12,P.w]]);});}},
 /* 加速の刻：味方の足元に金の陣・針が加速 → 上向きの山形が昇る */
 kasoku:{imp:.7,dur:1.7,draw(g,s,o){const{P,ts}=o;if(!ts.length)return;
  ts.forEach((t,ti)=>{const[fx,fy]=foot(t),h=hgt(t),a=cl(s/.2,0,1)*(s<1.3?1:1-(s-1.3)/.4),ang=s*s*30;
   dial(g,fx,fy,10*ez(s/.3),.36,P,a,12,[[ang,.95,.05,P.w]]);
   if(s>.6)for(let i=0;i<3;i++){const p=((s-.6)*1.6+i/3)%1;chev(g,fx,fy-h*.2-p*(h+6),-1,P,P.g,a*(1-p));}
   if(s>.7&&s<1.1)glow(g,fx,fy-h*.5,h*.8,P.g,.3*(1-(s-.7)/.4));});}},
};
/* ---------- つなぎ ---------- */
function start(u,sk,t){const id=keyOf(sk),D=DEF[id];if(!D)return null;const P=u.aw?PAW:PAL;
 const ts=id==='kasoku'?B.heroes.filter(h=>h.alive):Array.isArray(t)?t.filter(Boolean):(sk.t==='all'?B.enemies.filter(e=>e.alive):[t||B.tgt||B.enemies.find(e=>e.alive)].filter(Boolean));
 const o={u,P,ts,id,t0:now(),D};FX.push(o);return o;}
const sOf=o=>(now()-o.t0)*rate();
{const _d=draw;draw=function(){_d();if(scene!=='battle'||!B||!FX.length)return;const k=bK();ctx.save();ctx.setTransform(k,0,0,k,0,0);ctx.globalCompositeOperation='lighter';
 FX=FX.filter(o=>{const s=sOf(o);if(s>o.D.dur)return false;try{o.D.draw(ctx,s,o);}catch(e){}return true;});ctx.restore();};}
let CUR=null;
{const _da=doAction;doAction=async function(u,sk,t){if(inB2()&&has(u,sk)){CUR=start(u,sk,t);try{return await _da.apply(this,arguments);}finally{CUR=null;}}return _da.apply(this,arguments);};}
/* 命中：着弾の時刻まで数字を待つ（全体の術は最初の 1 体だけ待ち、残りは同時） */
{const _h=hit;hit=async function(a,t,sk){const o=CUR;if(o&&a===o.u&&!o.done){const w=(o.D.imp-sOf(o))/rate();o.done=1;if(w>0)await new Promise(r=>setTimeout(r,Math.min(2500,w*1000)));}return _h.apply(this,arguments);};}
{const _sb=startBattle;startBattle=function(){FX=[];CUR=null;return _sb.apply(this,arguments);};}
function inB2(){return scene==='battle'&&!!B;}
return{has,DEF,start};})();
