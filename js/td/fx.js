/* ===== TD の戦闘の演出（TDFX）：技ごとのエフェクト・星臨の短い暗転・粒・敵の歩き/被弾/崩れ。描くだけで、ロジック（TDS）の結果に触れない =====
 js/td/view.js（TD）が出来事（st.ev）を TDFX.ev(e) に渡し、毎コマ step(dt) → back(g)（地面の陣・輪）→ dim(g)（星臨の暗転。背景だけ）→ キャラ → front(g)（光・粒・数字の前）を呼ぶ。
 技：働き（strike/guard/nova/stun/chain/curse/heal/slow）ごとの型＋固有（リオ・ジン・ハクア・シオン・ミレ・クロウ・セレス・ノア・エルナ）。
 敵の動き：pose(f,t,st)（歩きの上下・前後の傾き・影の伸び縮み。飛行＝ふわふわ・霊体＝透けて揺れる・ボス/重装＝重い足取り）。被弾で白く光ってのけぞり、撃破は赤く染まって市松に崩れる（corpse）。
 決まり（TD デモの README・スキル rs-battle-fx）：時間を止めない・短い（0.3〜0.6 秒）・読める。色は属性の主の色＋補う色＋白の芯。星の十字の閃光を入れる */
'use strict';
const TDFX=(()=>{
const ELC={'斬':'#e8e8f0','打':'#d9a066','突':'#b0e0ff','熱':'#ff7a3c','冷':'#7fd8ff','雷':'#ffe14a','陽':'#fff1a8','陰':'#b07aff'};
const EL2={'斬':'#9fb0d0','打':'#f2d29a','突':'#9fe8b8','熱':'#ffe14a','冷':'#c0b0ff','雷':'#9fe8ff','陽':'#f2b347','陰':'#ff7ad0'};
const TAU=Math.PI*2;
let L=[],P=[],dimT=9,B={spr:()=>null,cam:()=>0,vw:()=>300};
const OC=document.createElement('canvas'),OX=OC.getContext('2d');
function bind(o){Object.assign(B,o);}
function reset(){FXK.reset();FXU.reset();L=[];P=[];dimT=9;curSt=null;}
function add(e){if(L.length>110){const i=L.findIndex(x=>x.k!=='corpse');L.splice(i<0?0:i,1);}e.t=-(e.dl||0);L.push(e);return e;}
/* 粒：spark＝速い線（重力）・ember＝遅い四角（昇る）・star＝十字の星（昇る）・mote＝目標へ集まる */
function part(o){if(P.length>=360)P.shift();o.t=-(o.dl||0);P.push(o);}
function sparks(x,y,n,c,o={}){const sp=o.sp||90;for(let i=0;i<n;i++){const a=(o.a??-Math.PI/2)+(Math.random()-.5)*(o.w??TAU),v=sp*(.4+Math.random()*.8);
 part({k:o.k||'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7,gr:o.gr??160,d:(o.d||.35)*(.6+Math.random()*.6),c:Math.random()<.25?'#fff':c,dl:o.dl,s:o.s||1});}}
function motes(x,y,n,c,r=40,d=.22,dl=0){for(let i=0;i<n;i++){const a=Math.random()*TAU,rr=r*(.6+Math.random()*.5);part({k:'mote',x0:x+Math.cos(a)*rr,y0:y+Math.sin(a)*rr*.6,x,y,d:d*(.7+Math.random()*.3),c,dl});}}
function rise(x,y,n,c,o={}){for(let i=0;i<n;i++)part({k:o.k||'star',x:x+(Math.random()-.5)*(o.w||24),y:y+(Math.random()-.5)*8,vx:(Math.random()-.5)*10,vy:-(18+Math.random()*26),gr:0,d:(o.d||.6)*(.7+Math.random()*.5),c:Math.random()<.3?'#fff':c,dl:o.dl,s:o.s||1});}
/* ---------- 部品の描き方 ---------- */
function star4(g,x,y,r,c,a=1){g.globalAlpha=a;g.fillStyle=c;g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.18,y-r*.18);g.lineTo(x+r,y);g.lineTo(x+r*.18,y+r*.18);g.lineTo(x,y+r);g.lineTo(x-r*.18,y+r*.18);g.lineTo(x-r,y);g.lineTo(x-r*.18,y-r*.18);g.closePath();g.fill();}
function cres(g,x,y,r,a0,a1,w,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,a0,a1);g.arc(x+Math.cos((a0+a1)/2)*w*.6,y+Math.sin((a0+a1)/2)*w*.6,r-w*.3,a1,a0,true);g.closePath();g.fill();}
function zig(g,x0,y0,x1,y1,seed,n=6,amp=7){g.beginPath();g.moveTo(x0,y0);for(let i=1;i<n;i++){const k=i/n,h=Math.sin(seed*13.7+i*7.3)*amp;const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1;g.lineTo(x0+dx*k-dy/l*h,y0+dy*k+dx/l*h);}g.lineTo(x1,y1);g.stroke();}
const hash=(i,j,s)=>{const v=Math.sin(i*127.1+j*311.7+s*74.7)*43758.5453;return v-Math.floor(v);};
/* ---------- 技（役割・働きの型） ---------- */
const at=(u,f)=>f?{x:f.x,y:f.y-14}:{x:u.x,y:u.y-14};
const K={
 strike:(u,f,c,c2)=>{const p=at(u,f),d=u.face||-1;add({k:'xslash',x:p.x,y:p.y,r:16,c,c2,dir:d,d:.26});add({k:'burst',x:p.x,y:p.y,r:22,c,c2,d:.3,dl:.06});add({k:'star',x:p.x,y:p.y,r:12,c:'#fff',d:.28,dl:.06});sparks(p.x,p.y,16,c,{dl:.06,a:d>0?0:Math.PI,w:2});},
 guard:(u,f,c,c2)=>{add({k:'dome',x:u.x,y:u.y,r:24,c,c2,d:.55});rise(u.x,u.y-10,6,c2,{w:30,d:.5});},
 nova:(u,f,c,c2)=>{const p=(u.cs||u.h.sk).at==='foe'&&f?{x:f.x,y:f.y}:{x:u.x,y:u.y};add({k:'gring',x:p.x,y:p.y,r:(u.cs||u.h.sk).r||44,c,c2,d:.45});add({k:'burst',x:p.x,y:p.y-12,r:26,c,c2,d:.3});sparks(p.x,p.y-6,22,c,{sp:110,d:.4});},
 stun:(u,f,c,c2)=>{const p=at(u,f);add({k:'burst',x:p.x,y:p.y,r:18,c,c2,d:.28});add({k:'star',x:p.x,y:p.y-16,r:10,c:'#ffe14a',d:.4,dl:.05});sparks(p.x,p.y,10,c);},
 chain:(u,f,c)=>{add({k:'burst',x:u.x,y:u.y-24,r:10,c,c2:'#fff',d:.2});},
 curse:(u,f,c,c2)=>{const p=f||u;add({k:'sigil',x:p.x,y:p.y,r:30,n:5,c,c2,d:.6});},
 heal:(u,f,c,c2)=>{add({k:'gring',x:u.x,y:u.y,r:(u.cs||u.h.sk).r*.5,c:'#9fe8b8',c2:'#fff',d:.5});rise(u.x,u.y-20,10,'#9fe8b8',{w:40});},
 slow:(u,f,c,c2)=>{const p=f||u;add({k:'clock',x:p.x,y:p.y,r:(u.cs||u.h.sk).r||60,c,c2,d:.6});}};
/* 固有（キャラの性格を乗せる） */
const H={
 /* リオ：光の刃。三日月の後に縦の光の柱で両断・星の閃光 */
 rio:(u,f,c,c2)=>{K.strike(u,f,c,c2);const p=at(u,f);add({k:'pillar',x:p.x,y:p.y+14,w:10,h:70,c:c2,d:.32,dl:.1});},
 /* ジン：拳。衝撃の輪を 2 つ・後ろへ吹き飛ぶ砂ぼこり */
 jin:(u,f,c,c2)=>{const p=at(u,f),d=u.face||-1;add({k:'burst',x:p.x,y:p.y,r:20,c,c2,d:.22});add({k:'gring',x:p.x,y:p.y+12,r:20,c,c2,d:.3});add({k:'gring',x:p.x,y:p.y+12,r:32,c:c2,c2:'#fff',d:.35,dl:.08});
  sparks(p.x,p.y+10,14,'#a08a6a',{k:'ember',a:d>0?0:Math.PI,w:.8,sp:120,gr:-20,d:.45});},
 /* ハクア：氷の結晶の花が開いて砕ける */
 hakua:(u,f,c,c2)=>{const p=at(u,f);add({k:'crystal',x:p.x,y:p.y,r:22,c,c2,d:.45});sparks(p.x,p.y,12,'#e0f4ff',{dl:.25,gr:60,sp:70});add({k:'star',x:p.x,y:p.y-16,r:9,c:'#fff',d:.4,dl:.05});},
 /* シオン：影の針 3 本が敵の背後から縫い止める */
 shion:(u,f,c,c2)=>{const p=at(u,f);for(let i=0;i<3;i++){const a=-Math.PI/2+(i-1)*.7;add({k:'needle',x0:p.x+Math.cos(a)*40,y0:p.y+Math.sin(a)*34,x1:p.x+(i-1)*4,y1:p.y+4,c,c2:'#6f6888',d:.18,dl:i*.05});}
  add({k:'burst',x:p.x,y:p.y,r:14,c,c2,d:.25,dl:.16});},
 /* ミレ：炎の波。輪に沿って炎の舌が立つ */
 mire:(u,f,c,c2)=>{const p=f||u;add({k:'flame',x:p.x,y:p.y,r:(u.cs||u.h.sk).r||56,c,c2,d:.5});add({k:'burst',x:p.x,y:p.y-12,r:24,c,c2,d:.3});rise(p.x,p.y-6,10,c2,{k:'ember',w:60,d:.6});},
 /* クロウ：紫の五芒の陣＋星座の線で縛る */
 crow:(u,f,c,c2)=>{K.curse(u,f,c,c2);const p=f||u;add({k:'stars',x:p.x,y:p.y-18,r:22,c:c2,d:.5,dl:.08});},
 /* セレス：時計の陣（12 の刻みと逆回りの針） */
 celes:(u,f,c,c2)=>{K.slow(u,f,'#b07aff','#f2b347');motes(u.x,u.y-24,10,'#f2b347',26,.2);},
 /* ノア：祈り。灯の色の粒と十字の星が昇る */
 noah:(u,f,c,c2)=>{add({k:'gring',x:u.x,y:u.y,r:(u.cs||u.h.sk).r*.5,c:'#fff1a8',c2:'#9fe8b8',d:.55});rise(u.x,u.y-20,14,'#fff1a8',{w:50,d:.7});},
 /* エルナ：雷の矢。放つ前に弓の先に光 */
 erna:(u,f,c)=>{add({k:'star',x:u.x+(u.face||-1)*10,y:u.y-28,r:10,c,d:.25});}};
/* ---------- 出来事 → 演出 ---------- */
function ev(e,st){curSt=st;const u=e.u,el=u&&u.h?u.h.el:'陽',c=ELC[el]||'#fff',c2=EL2[el]||'#fff';
 switch(e.k){
 case'hit':{const f=e.f,hx=f.x,hy=f.y-14;
  if(u.id==='lamp'){add({k:'shot',x0:u.x,y0:u.y,x1:hx,y1:hy,c:'#f2b347',c2:'#fff1a8',d:.2,big:1});sparks(hx,hy,4,'#f2b347');return;}
  if(u.id==='celes'&&!e.big){if(e.sk){if(u._skDl!=null&&st.t-u._skT<=.05){e._dl=FXC.skHit(u,f,e,st);return;}}else if(u.h.rng>60){e._dl=FXC.atk(u,f,e,st);return;}}
  if(e.big){if(u.id==='celes'){const D=FXU.hitDl(u,st);if(D){e._dl=D;if(f.hp<=0)f._hold=D+.1;return;}}if(f.hp<=0)f._hold=.24;sparks(hx,hy,6,c,{dl:.24});return;}
  if(e.sk){if((u.cs||u.h.sk).k==='chain')add({k:'bolt',x0:u.x,y0:u.y-26,x1:hx,y1:hy,c,seed:Math.random()*99,d:.22});sparks(hx,hy,8,c);return;}
  const far=u.h.rng>60,mag=u.h.dmgK==='mag';
  if(far)add({k:mag?'orb':'arrow',x0:u.x+(u.face||-1)*6,y0:u.y-24,x1:hx,y1:hy,c,c2,d:mag?.2:.14});
  else add({k:'slash',x:hx,y:hy,c,c2,dir:u.face||-1,d:.14});
  sparks(hx,hy,e.cr?10:4,e.weak?'#f2b347':c,{dl:far?.14:0,d:.25});if(e.cr)add({k:'star',x:hx,y:hy,r:9,c:'#fff',d:.2,dl:far?.14:0});return;}
 case'cast':u.cs=e.sk;if(u.id==='celes'){u._skDl=null;if(FXC.cast(u,e,st)!=null)return;}((e.sk.id===TDD.HERO[u.id].sk&&H[u.id])||K[e.sk.k]||K.strike)(u,e.f,c,c2);return;
 /* 星臨：足元から光の柱・星の輪が 2 重に広がる（オーラは view.js が描く） */
 case'aw':if(u.id==='celes'){FXU.aw(u,st);return;}add({k:'pillar',x:u.x,y:u.y,w:22,h:96,c:'#fff1a8',d:.5});add({k:'gring',x:u.x,y:u.y,r:30,c:'#f2b347',c2:'#fff',d:.45});add({k:'gring',x:u.x,y:u.y,r:46,c,c2,d:.6,dl:.12});add({k:'star',x:u.x,y:u.y-56,r:22,c:'#fff',d:.4,dl:.08});rise(u.x,u.y-20,18,'#fff0b8',{w:30,d:.8});return;
 case'kill':{const f=e.f,F=B.spr(f.spr,f.kind,1);if(L.filter(x=>x.k==='corpse').length>14){const i=L.findIndex(x=>x.k==='corpse');L.splice(i,1);}
  add({k:'corpse',F,x:f.x,y:f.y,mir:f.dir<0,hg:f.boss?76:40,gh:f.tr.includes('ghost'),boss:f.boss,seed:f.uid,hold:f._hold||0,d:(f.boss?.9:.45)+(f._hold||0)});
  sparks(f.x,f.y-14,f.boss?40:10,f.tr.includes('void')?'#b07aff':'#e86a6a',{sp:f.boss?140:80,d:.45});if(f.boss){add({k:'star',x:f.x,y:f.y-30,r:30,c:'#f2b347',d:.6});rise(f.x,f.y-30,16,'#f2b347',{w:50,d:.9});}return;}
 case'area':if(e.small)add({k:'gring',x:e.x,y:e.y,r:e.r,c,c2,d:.2,thin:1});return;
 case'heal':rise(e.u.x,e.u.y-30,3,'#9fe8b8',{w:16,d:.5});return;
 case'ult':ult(e,c,c2);return;
 case'deploy':add({k:'pillar',x:u.x,y:u.y,w:14,h:60,c:'#f2b347',d:.35});add({k:'gring',x:u.x,y:u.y,r:18,c:'#f2b347',c2:'#fff',d:.35});return;
 case'retreat':rise(u.x,u.y-20,8,'#f2b347',{k:'ember',w:20,d:.4});return;
 case'lamp':{const[bx,by]=st.S.base;add({k:'gring',x:bx,y:by,r:st.lightR*.6,c:'#f2b347',c2:'#fff1a8',d:.7});add({k:'star',x:bx,y:by-110,r:20,c:'#fff1a8',d:.5});rise(bx,by-100,12,'#f2b347',{w:30});return;}
 case'fall':add({k:'puff',x:u.x,y:u.y-18,d:.4});return;
 case'summon':add({k:'gring',x:e.f.x,y:e.f.y,r:30,c:'#b07aff',c2:'#ff7ad0',d:.4});return;
 case'beam':{const T=e.u||{x:st.S.base[0],y:st.S.base[1]-110};add({k:'beam',x0:e.f.x,y0:e.f.y-30,x1:T.x,y1:T.y-(e.u?20:0),d:.35});sparks(T.x,T.y-(e.u?20:0),16,'#ff6a4a');return;}
 case'gcancel':add({k:'gring',x:e.f.x,y:e.f.y-30,r:26,c:'#ffe14a',c2:'#fff',d:.4});return;
 case'shift':add({k:'puff',x:e.f.x,y:e.f.y-20,boss:1,d:.45});return;
 case'drain':add({k:'gring',x:st.S.base[0],y:st.S.base[1],r:st.r0,c:'#b07aff',c2:'#6f6888',d:.8,shrink:1});return;}}
/* 星臨：短い暗転（背景だけ・0.75 秒）→ 溜め（粒が集まる 0.2 秒）→ 放出（光の筋・白い芯・星・放射・輪）→ 星が昇る余韻 */
function ult(e,c,c2){if(e.u.id==='celes'&&e.u.h.ult.k==='utime'){FXU.ult(e,curSt,B);return;}const u=e.u,full=e.r>500,cx=full?B.cam()+B.vw()/2:e.x,cy=full?250:e.y-10;dimT=0;
 motes(u.x,u.y-24,26,c2,46,.2);add({k:'gring',x:u.x,y:u.y,r:34,c,c2,d:.22,shrink:1});
 if(!full)add({k:'streak',x0:u.x,y0:u.y-24,x1:cx,y1:cy,c,c2,d:.22,dl:.2});
 add({k:'flash',d:.1,dl:.22});
 if(u.h.ult.k==='utime')add({k:'clock',x:cx,y:cy+40,r:Math.min(150,B.vw()*.5),c:'#b07aff',c2:'#f2b347',d:1.2,dl:.2});
 else if(u.h.ult.k==='uheal')add({k:'gring',x:cx,y:cy+40,r:B.vw()*.6,c:'#fff1a8',c2:'#9fe8b8',d:.7,dl:.2});
 else{add({k:'gring',x:cx,y:cy+10,r:e.r,c,c2,d:.55,dl:.22});add({k:'burst',x:cx,y:cy,r:46,c,c2,d:.45,dl:.22});}
 add({k:'star',x:cx,y:cy,r:34,c:'#fff',d:.45,dl:.22});add({k:'stars',x:cx,y:cy-10,r:40,c:'#fff0b8',d:.6,dl:.26});
 sparks(cx,cy,90,c,{dl:.22,sp:170,d:.5});rise(cx,cy,18,'#fff0b8',{w:80,d:.9,dl:.4});}
let curSt=null; /* セレスの星臨・奥義は js/td/fx-celes-ult.js（FXU） */
/* ---------- 毎コマ ---------- */
function step(dt){FXK.step(dt);dimT+=dt;for(const e of L)e.t+=dt;L=L.filter(e=>e.t<e.d);
 for(const p of P){p.t+=dt;if(p.t<0||p.k==='mote')continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gr*dt;p.vx*=.98;}P=P.filter(p=>p.t<p.d);}
const BACK={gring:1,sigil:1,clock:1,flame:1,dome:0};
function back(g){for(const e of L)if(e.t>=0&&BACK[e.k])draw(g,e,e.t/e.d);g.globalAlpha=1;FXK.draw(g,'back');}
function dim(g){if(dimT>.75)return;const a=dimT<.12?dimT/.12:dimT<.32?1:1-(dimT-.32)/.43;g.globalAlpha=.4*a;g.fillStyle='#07071a';g.fillRect(B.cam()-4,0,B.vw()+8,FHH());g.globalAlpha=1;}
const FHH=()=>(typeof TDD!=='undefined'?TDD.K.FH:420);
function front(g){g.save();for(const e of L)if(e.t>=0&&!BACK[e.k])draw(g,e,e.t/e.d);
 g.globalCompositeOperation='screen';for(const p of P){if(p.t<0)continue;const q=p.t/p.d;g.globalAlpha=1-q;g.fillStyle=p.c;
  if(p.k==='spark'){g.strokeStyle=p.c;g.lineWidth=1;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);g.stroke();}
  else if(p.k==='mote'){const k=Math.min(1,q*1.2),x=p.x0+(p.x-p.x0)*k*k,y=p.y0+(p.y-p.y0)*k*k;g.globalAlpha=.4+.6*k;g.fillRect(x-1,y-1,2,2);}
  else if(p.k==='star'){star4(g,p.x,p.y,3*p.s*(1-q*.5),p.c,1-q);}
  else g.fillRect(p.x-1,p.y-1,2,2);}
 g.restore();g.globalAlpha=1;FXK.draw(g,'front');}
function draw(g,e,p){g.globalAlpha=1;const ea=1-p;
 switch(e.k){
 case'shot':case'orb':{const x=e.x0+(e.x1-e.x0)*p,y=e.y0+(e.y1-e.y0)*p,s=e.big?2.5:2;g.globalCompositeOperation='screen';
  for(let i=3;i>=1;i--){const k=Math.max(0,p-i*.08);g.globalAlpha=.25*(4-i);g.fillStyle=e.c;g.fillRect(e.x0+(e.x1-e.x0)*k-s/2,e.y0+(e.y1-e.y0)*k-s/2,s,s);}
  g.globalAlpha=1;g.fillStyle=e.c2;g.beginPath();g.arc(x,y,s+1,0,TAU);g.fill();g.fillStyle='#fff';g.fillRect(x-1,y-1,2,2);g.globalCompositeOperation='source-over';break;}
 case'arrow':{const x=e.x0+(e.x1-e.x0)*p,y=e.y0+(e.y1-e.y0)*p,a=Math.atan2(e.y1-e.y0,e.x1-e.x0);g.strokeStyle=e.c;g.lineWidth=1;g.globalAlpha=.5;g.beginPath();g.moveTo(x-Math.cos(a)*14,y-Math.sin(a)*14);g.lineTo(x,y);g.stroke();
  g.globalAlpha=1;g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(x-Math.cos(a)*5,y-Math.sin(a)*5);g.lineTo(x,y);g.stroke();break;}
 case'slash':{const a0=e.dir>0?-1.3:1.8,s=p*.9;g.globalAlpha=.4*ea;cres(g,e.x,e.y,11,a0+s-.35,a0+s+1.2,4,e.c2);g.globalAlpha=ea;cres(g,e.x,e.y,11,a0+s,a0+s+1.6,4*(1-p)+1.5,e.c);
  g.globalAlpha=ea;g.strokeStyle='#fff';g.lineWidth=1;g.beginPath();g.arc(e.x,e.y,10,a0+s+.3,a0+s+1.3);g.stroke();break;}
 case'xslash':{const s=Math.min(1,p*3),w=6*(1-p)+2;for(const[j,a0]of[[0,-2.4],[1,-.75]]){if(j&&p<.25)continue;g.globalAlpha=ea;cres(g,e.x,e.y,e.r,a0,a0+1.6*s,w,j?e.c2:e.c);}
  g.strokeStyle='#fff';g.globalAlpha=ea;g.lineWidth=1;g.beginPath();g.moveTo(e.x-e.r*1.6,e.y+e.r*.3*e.dir);g.lineTo(e.x+e.r*1.6,e.y-e.r*.3*e.dir);g.stroke();break;}
 case'burst':{g.globalCompositeOperation='screen';if(p<.3){g.globalAlpha=1;g.fillStyle='#fff';g.beginPath();g.arc(e.x,e.y,e.r*.35*(1-p/.3),0,TAU);g.fill();}
  g.globalAlpha=ea;g.strokeStyle=e.c;g.lineWidth=1.5;for(let i=0;i<8;i++){const a=i*TAU/8+.2,r0=e.r*(.2+p*.6),r1=e.r*(.5+p*.8);g.beginPath();g.moveTo(e.x+Math.cos(a)*r0,e.y+Math.sin(a)*r0);g.lineTo(e.x+Math.cos(a)*r1,e.y+Math.sin(a)*r1);g.stroke();}
  g.strokeStyle=e.c2;g.lineWidth=2*ea+.5;g.beginPath();g.arc(e.x,e.y,e.r*(.3+.8*p),0,TAU);g.stroke();g.globalCompositeOperation='source-over';break;}
 case'star':{const q=p<.25?p/.25:1-(p-.25)/.75;g.globalCompositeOperation='screen';star4(g,e.x,e.y,e.r*(.4+.6*q),e.c,q);g.globalCompositeOperation='source-over';break;}
 case'stars':{/* 星座の線：5 つの星を結ぶ */const n=5,pts=[];for(let i=0;i<n;i++){const a=i*TAU/n+e.x*.01;pts.push([e.x+Math.cos(a)*e.r*(.6+.4*hash(i,1,e.x)),e.y+Math.sin(a)*e.r*.5]);}
  const k=Math.min(1,p*2.5);g.globalAlpha=ea;g.strokeStyle=e.c;g.lineWidth=1;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<=Math.floor(k*n);i++){const q=pts[i%n];g.lineTo(q[0],q[1]);}g.stroke();
  for(const q of pts)star4(g,q[0],q[1],3,'#fff',ea);break;}
 case'pillar':{const w=e.w*(1-p*.6);g.globalCompositeOperation='screen';g.globalAlpha=ea*.8;const gr=g.createLinearGradient(0,e.y-e.h,0,e.y);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,e.c);g.fillStyle=gr;
  g.fillRect(e.x-w/2,e.y-e.h,w,e.h);g.globalAlpha=ea;g.fillStyle='#fff';g.fillRect(e.x-w*.15,e.y-e.h*.8,w*.3,e.h*.8);g.globalCompositeOperation='source-over';break;}
 case'gring':{const q=e.shrink?1-.5*p:.3+.7*Math.sqrt(p);g.globalAlpha=ea;g.strokeStyle=e.c;g.lineWidth=e.thin?1:2;g.beginPath();g.ellipse(e.x,e.y,e.r*q,e.r*q*.5,0,0,TAU);g.stroke();
  if(!e.thin){g.globalAlpha=ea*.15;g.fillStyle=e.c2;g.fill();g.globalAlpha=ea*.7;g.strokeStyle=e.c2;g.lineWidth=1;g.beginPath();g.ellipse(e.x,e.y,e.r*q*.8,e.r*q*.4,0,0,TAU);g.stroke();}break;}
 case'dome':{const s=.8+.2*Math.min(1,p*4);g.globalAlpha=ea*.25;g.fillStyle=e.c;g.beginPath();g.ellipse(e.x,e.y-6,e.r*s,e.r*1.3*s,0,Math.PI,TAU);g.fill();g.globalAlpha=ea;g.strokeStyle=e.c2;g.lineWidth=1.5;g.stroke();
  g.strokeStyle='#fff';g.lineWidth=1;for(let i=1;i<4;i++){const a=Math.PI+i*Math.PI/4;g.beginPath();g.moveTo(e.x,e.y-6-e.r*1.3*s);g.lineTo(e.x+Math.cos(a)*e.r*s,e.y-6+Math.sin(a)*e.r*1.3*s);g.stroke();}break;}
 case'bolt':{g.globalAlpha=p<.5?1:(1-p)*2;g.strokeStyle=e.c;g.lineWidth=3;zig(g,e.x0,e.y0,e.x1,e.y1,e.seed+Math.floor(p*4));g.strokeStyle='#fff';g.lineWidth=1;zig(g,e.x0,e.y0,e.x1,e.y1,e.seed+Math.floor(p*4));break;}
 case'needle':{const k=Math.min(1,p*1.6),x=e.x0+(e.x1-e.x0)*k,y=e.y0+(e.y1-e.y0)*k,a=Math.atan2(e.y1-e.y0,e.x1-e.x0);g.globalAlpha=1;g.strokeStyle=e.c2;g.lineWidth=2;g.beginPath();g.moveTo(x-Math.cos(a)*10,y-Math.sin(a)*10);g.lineTo(x,y);g.stroke();
  g.strokeStyle=e.c;g.lineWidth=1;g.stroke();break;}
 case'crystal':{const k=Math.min(1,p*3),br=p>.6;for(let i=0;i<6;i++){const a=i*TAU/6+.26,r=e.r*k*(br?1+(p-.6)*2:1),x=e.x+Math.cos(a)*r*.5,y=e.y+Math.sin(a)*r*.5;
   g.globalAlpha=br?1-(p-.6)/.4:1;g.fillStyle=i%2?e.c:e.c2;g.beginPath();g.moveTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r);g.lineTo(x+Math.cos(a+1.57)*3,y+Math.sin(a+1.57)*3);g.lineTo(e.x,e.y);g.lineTo(x-Math.cos(a+1.57)*3,y-Math.sin(a+1.57)*3);g.closePath();g.fill();}
  g.globalAlpha=br?0:1;g.fillStyle='#fff';g.fillRect(e.x-2,e.y-2,4,4);break;}
 case'flame':{const q=.3+.7*Math.sqrt(p),r=e.r*q;g.globalAlpha=ea;g.strokeStyle=e.c;g.lineWidth=2;g.beginPath();g.ellipse(e.x,e.y,r,r*.5,0,0,TAU);g.stroke();
  for(let i=0;i<14;i++){const a=i*TAU/14,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r*.5,h=(6+5*Math.sin(i*2.3+p*20))*ea;g.fillStyle=i%2?e.c:e.c2;g.beginPath();g.moveTo(x-2.5,y);g.lineTo(x,y-h);g.lineTo(x+2.5,y);g.closePath();g.fill();}break;}
 case'sigil':{const s=Math.min(1,p*5),rot=p*2,a=p>.6?1-(p-.6)/.4:1;g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=1.5;g.beginPath();g.ellipse(e.x,e.y,e.r*s,e.r*s*.5,0,0,TAU);g.stroke();
  g.strokeStyle=e.c2;g.beginPath();for(let i=0;i<=e.n;i++){const ang=rot+i*2*TAU/e.n-Math.PI/2;const x=e.x+Math.cos(ang)*e.r*s*.9,y=e.y+Math.sin(ang)*e.r*s*.45;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();break;}
 case'clock':{const s=Math.min(1,p*4),a=p>.65?1-(p-.65)/.35:1,r=e.r*s;g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=1.5;g.beginPath();g.ellipse(e.x,e.y,r,r*.5,0,0,TAU);g.stroke();
  g.strokeStyle=e.c2;g.lineWidth=1;for(let i=0;i<12;i++){const ang=i*TAU/12,c=Math.cos(ang),sn=Math.sin(ang);g.beginPath();g.moveTo(e.x+c*r*.82,e.y+sn*r*.41);g.lineTo(e.x+c*r*.95,e.y+sn*r*.475);g.stroke();}
  const h=-Math.PI/2-p*8;g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+Math.cos(h)*r*.7,e.y+Math.sin(h)*r*.35);g.stroke();break;}
 case'streak':{const k=Math.min(1,p*3);g.globalCompositeOperation='screen';g.globalAlpha=ea;g.strokeStyle=e.c;g.lineWidth=6*ea+1;g.beginPath();g.moveTo(e.x0,e.y0);g.lineTo(e.x0+(e.x1-e.x0)*k,e.y0+(e.y1-e.y0)*k);g.stroke();
  g.strokeStyle='#fff';g.lineWidth=2*ea;g.stroke();g.globalCompositeOperation='source-over';break;}
 case'flash':g.globalAlpha=.16*ea;g.fillStyle='#fff8e0';g.fillRect(B.cam()-4,0,B.vw()+8,FHH());break;
 case'beam':g.globalAlpha=ea;g.strokeStyle='#ff6a4a';g.lineWidth=6*ea+1;g.beginPath();g.moveTo(e.x0,e.y0);g.lineTo(e.x1,e.y1);g.stroke();g.strokeStyle='#fff';g.lineWidth=2*ea;g.stroke();break;
 case'puff':g.globalAlpha=ea;g.fillStyle=e.boss?'#f2b347':'#b07aff';for(let i=0;i<8;i++){const a=i*.785,d=4+p*(e.boss?28:16);g.fillRect(e.x+Math.cos(a)*d-1,e.y+Math.sin(a)*d*.6-1,2,2);}break;
 case'corpse':corpse(g,e,Math.max(0,(e.t-e.hold)/(e.d-e.hold)));break;}
 g.globalAlpha=1;}
/* 撃破：白 → 赤に染まり、ドットが粗くなりながら市松の目から抜けて沈む */
function corpse(g,e,p){const F=e.F;if(!F)return;const sc=Math.min(1,e.hg/F.h),w=F.w*sc,h=F.h*sc,b=Math.max(1,Math.round(1+p*(e.boss?7:5))),ow=Math.max(1,Math.ceil(w/b)),oh=Math.max(1,Math.ceil(h/b));
 OC.width=ow;OC.height=oh;OX.imageSmoothingEnabled=true;OX.drawImage(F.cv,0,0,ow,oh);OX.globalCompositeOperation='source-atop';OX.globalAlpha=p<.12?.85:.6;OX.fillStyle=p<.12?'#fff':'#e83a3a';OX.fillRect(0,0,ow,oh);
 OX.globalAlpha=1;if(p>.15){OX.globalCompositeOperation='destination-out';const q=(p-.15)/.85*1.05;for(let j=0;j<oh;j++)for(let i=0;i<ow;i++)if(((i+j)%2?.5:0)+hash(i,j,e.seed)*.5<q)OX.fillRect(i,j,1,1);}
 OX.globalCompositeOperation='source-over';const sy=1-.3*p;g.save();g.imageSmoothingEnabled=false;g.globalAlpha=e.gh?.6:1;g.translate(Math.round(e.x),Math.round(e.y+p*3));if(e.mir)g.scale(-1,1);
 g.drawImage(OC,-F.ax*sc,-F.ay*sc*sy,w,h*sy);g.restore();}
/* ---------- 敵の歩き（原画は 1 枚。コードで動かす） ---------- */
function pose(f,t,st){const tr=f.tr,gh=tr.includes('ghost'),fly=tr.includes('fly'),heavy=f.boss||tr.includes('armor'),mov=!f.by&&f.stun<=0,d=f.dir||1;
 const R=FXK.react(f,st);if(R&&R.hold){if(f._ft===undefined)f._ft=t;t=f._ft;}else f._ft=undefined;
 const o={dx:0,dy:0,rot:0,sx:1,sy:1,a:1,sh:1,fl:R?!!R.fl:st.t-f.hitT<.09};if(R&&R.ta>0){o.tint=R.tint;o.ta=R.ta;}
 if(gh){o.dy=-5+Math.sin(t*2.2+f.uid)*2.5;o.dx=Math.sin(t*1.6+f.uid)*1.5;o.rot=Math.sin(t*1.8+f.uid)*.06+(mov?d*.05:0);o.a=.5+.22*(.5+.5*Math.sin(t*3+f.uid));o.sh=.6+.1*Math.sin(t*2.2+f.uid);o.sx=1+.03*Math.sin(t*4+f.uid);}
 else if(fly){const b=Math.sin(t*3+f.uid);o.dy=-14+b*4;o.rot=d*.08+Math.sin(t*3.3+f.uid)*.05;o.sh=.55-.12*b;}
 else if(mov){const hz=Math.max(1.4,Math.min(3.2,f.spd/14))*(f.boss?.55:heavy?.8:1),ph=t*hz*Math.PI+f.uid,s=Math.abs(Math.sin(ph)),c=Math.abs(Math.cos(ph));
  o.dy=-s*(f.boss?3:heavy?1.4:2.2);o.rot=d*((heavy?.03:.06)+Math.sin(ph*2)*(heavy?.02:.04));o.sy=1-c*(f.boss?.07:.045);o.sx=1+c*(f.boss?.05:.03);o.sh=1-.28*s;
  if(f.boss){const n=Math.floor(ph/Math.PI);if(f._fc!==undefined&&n!==f._fc)sparks(f.x-d*6,f.y,6,'#a08a6a',{k:'ember',a:-Math.PI/2,w:2.4,sp:30,gr:20,d:.4});f._fc=n;}}
 else{o.sy=1+.025*Math.sin(t*3+f.uid);o.sx=1-.012*Math.sin(t*3+f.uid);}
 if(f.stun>0)o.rot=Math.sin(t*14)*.07;
 if(f.actT&&st.t-f.actT<.15){o.dx+=d*3;o.rot+=d*.1;}
 const k=R?(R.t0===undefined?-1:(st.t-R.t0)/.2):(st.t-f.hitT)/.2;if(k>=0&&k<1){const q=(1-k)*(1-k);o.dx-=d*(f.boss?1.5:3.5)*q;o.rot-=d*(f.boss?.05:.14)*q;}
 return o;}
const shk=()=>FXU.shk();
return{shk,bind,reset,ev,step,back,dim,front,pose,add:e=>add(e),ELC};})();
