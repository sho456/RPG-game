/* ===== TD の戦闘画面（TD）：横スクロールの戦場・上下の帯・手札・ユニットの窓・リザルト。ロジックは js/td/sim.js（TDS） =====
 戦場は横に長い帯（論理の高さ 420・幅はステージごと）。画面の高さに合わせて拡大し、左右にドラッグで見渡す。上の小地図をタップでその場所へ。
 背景は js/td/bg.js（空・遠景・中景・地面の奥行き）。原画は SPX.unitCv（RPG 版と同じ絵）。灯域の外は暗く沈める。
 入口：TD.open(stageId)（章の地図と出撃準備は js/td/menu.js）。本編の startBattle 系には触れない。
 見せ方の決まり（TD デモの README）：ゲームを止めない・短い・読める（数字は同時に 24 まで、揺れは 3px まで）
 ver0.57：スマホの縦画面に合わせて幅で倍率を決める（見える幅 ≈ 270・余った高さは空）。カメラは前線を自動で追う（触って 3.5 秒は止める）。
 ピンチで拡大（ページは拡大させない）。ダメージの数字は画面の大きさで描く（拡大率に左右されない）。帯・操作盤・手札は js/td/hud.js（TDH） */
'use strict';
const TD=(()=>{
const K=TDD.K,FH=K.FH,VB=396;let VT=146,VH=VB-VT;/* 見せる高さ（論理の y=VT〜VB。fit で決める） */
let Z=1,userT=0,root=null,cv=null,g=null,st=null,S=1,DPR=1,VW=300,cam=0,raf=0,last=0,acc=0,speed=1,paused=false,sel=null,selU=null,mvU=null,nm=[],nums=[],shake=0,bg=null,lt=null,sid=null,ended=false,baseHit=0;
const $=q=>root.querySelector(q);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GR=198,UH=60,F1=40,FB=76;/* 背丈（ver0.58：モーションのため大きく）：仲間・雑魚・ボス */const MINI={x:8,y:8,h:22};/* 小地図は画面の px（拡大に左右されない） */
/* ---------- 原画 ---------- */
const SC=new Map();
function spr(key,fk,side){const k=key+'|'+side;if(SC.has(k))return SC.get(k);let f=null;try{f=SPX.unitCv(key,fk,side,side?44:64);}catch(e){console.error(e);}SC.set(k,f);return f;}
const IMG={};
function face(id){if(IMG[id])return IMG[id];const f=spr(id,id,0);if(!f)return'';const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return IMG[id]=c.toDataURL();}
/* ---------- 画面を作る ---------- */
function build(){if(root)return;root=document.createElement('div');root.id='td';root.className='hide';
 const M=TDH.markup();root.innerHTML=`${M.top}
 <div class="td-field"><canvas></canvas><button class="td-call" data-a="call" hidden></button><div class="td-banner"></div><div class="td-tip"></div>
 <div class="td-sheet" hidden><div class="td-panel"></div></div></div>${M.bottom}`;
 document.body.appendChild(root);cv=root.querySelector('canvas');g=cv.getContext('2d');TDFX.bind({spr,cam:()=>cam,vw:()=>VW});
 root.addEventListener('click',onClick);cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);drag=null;pinch=null;});
 cv.addEventListener('wheel',e=>{if(!st)return;e.preventDefault();userT=performance.now();setCam(cam+(e.deltaX||e.deltaY)/S);},{passive:false});addEventListener('resize',()=>{if(st)fit();});
 /* ページの拡大を止める（iOS のピンチ・2 本指・ダブルタップ）。戦場の中のピンチは pMove で戦場だけを拡大する */
 for(const k of['gesturestart','gesturechange','gestureend'])root.addEventListener(k,e=>e.preventDefault(),{passive:false});
 root.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
 TDH.init({root,face,get sel(){return sel;},get selU(){return selU;}});}
/* 縦画面：幅で倍率を決める（見える幅 ≈ 230・ver0.58）。余った高さは空を広く見せる（VH 250〜396）。横長の画面は高さで決める。Z＝ピンチの拡大 */
function fit(){const f=$('.td-field'),w=f.clientWidth,h=f.clientHeight;DPR=Math.max(1,Math.min(3,devicePixelRatio||1));
 const s0=Math.min(h/240,w/230);Z=Math.max(Math.min(1,h/(VB*s0)),Math.min(1.8,Z));S=Math.max(w/st.S.W,s0*Z);VH=Math.round(Math.min(VB,Math.max(150,h/S)));VT=VB-VH;VW=w/S;
 cv.style.width=w+'px';cv.style.height=Math.round(VH*S)+'px';cv.width=Math.round(w*DPR);cv.height=Math.round(VH*S*DPR);if(!bg||Math.abs((bg.vw||0)-VW)>1){bg=TDBG.make(st,VW);bg.vw=VW;}setCam(cam);}
/* カメラ：前線（いちばん左の前衛）と迫る敵が見える所へ自動で寄る。触ってから 3.5 秒・置く場所を選んでいる間は止める */
function follow(dt){if(drag||pinch||sel||mvU||performance.now()-userT<3500)return;const F=st.units.filter(u=>u.h.line==='f'),U=F.length?F:st.units,L=st.foes.filter(f=>f.hp>0);
 let cx;const fx=U.length?Math.min(...U.map(u=>u.x)):null,lead=L.length?L.reduce((a,f)=>f.x>a.x?f:a):null;
 const bx=st.units.length?Math.max(...st.units.map(u=>u.x)):fx;/* 後衛のいちばん後ろ */
 if(lead&&(fx==null||lead.x>fx+24))cx=lead.x;else if(fx!=null){const team=Math.min(fx+VW*.45,(fx+bx)/2);cx=lead&&fx-lead.x<VW*.6?Math.min(team,(lead.x+fx)/2+VW*.08):team;}else return;
 const tc=Math.max(0,Math.min(st.S.W-VW,cx-VW/2));if(Math.abs(tc-cam)>.5)setCam(cam+(tc-cam)*Math.min(1,dt*2.2));}
const setCam=x=>{cam=Math.max(0,Math.min(st.S.W-VW,x));};
/* ---------- 光（灯域）：画面の幅の暗さの層に光の円を抜く ---------- */
function drawLight(t){if(!lt||lt.width!==Math.ceil(VW)){lt=document.createElement('canvas');lt.width=Math.ceil(VW);lt.height=FH;}const l=lt.getContext('2d');
 l.globalCompositeOperation='source-over';l.clearRect(0,0,lt.width,FH);l.fillStyle='rgba(16,10,34,.62)';l.fillRect(0,0,lt.width,FH);l.globalCompositeOperation='destination-out';
 const hole=(x,y,r)=>{x-=cam;const gr=l.createRadialGradient(x,y,r*.8,x,y,r);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=gr;l.beginPath();l.arc(x,y,r,0,7);l.fill();};
 const[bx,by]=st.S.base,Cs=[[bx,by,st.lightR+Math.sin(t*2)*2]];for(const u of st.lsrc)Cs.push([u.x,u.y,u.h.lt]);
 for(const c of Cs)hole(c[0],c[1],c[2]);
 g.drawImage(lt,cam,0);
 /* 光のたまり（地面にやわらかい灯の色）と、光の端の細い線（重なりの内側は描かない・地面の上だけ） */
 for(const c of Cs){if(c[0]+c[2]<cam||c[0]-c[2]>cam+VW)continue;const gr=g.createRadialGradient(c[0],c[1],c[2]*.2,c[0],c[1],c[2]);gr.addColorStop(0,'rgba(242,179,71,.07)');gr.addColorStop(1,'rgba(242,179,71,0)');g.fillStyle=gr;g.fillRect(c[0]-c[2],Math.max(GR,c[1]-c[2]),c[2]*2,c[2]*2);}
 g.strokeStyle='rgba(242,179,71,.3)';g.lineWidth=1;g.beginPath();
 for(let i=0;i<Cs.length;i++){const c=Cs[i];if(c[0]+c[2]<cam||c[0]-c[2]>cam+VW)continue;const n=Math.max(24,Math.round(c[2]/3));let pen=false;
  for(let k=0;k<=n;k++){const a=k/n*6.2832,x=c[0]+Math.cos(a)*c[2],y=c[1]+Math.sin(a)*c[2];let ok=y>GR+2&&y<FH-2;
   if(ok)for(let j=0;j<Cs.length;j++)if(j!==i&&Math.hypot(x-Cs[j][0],y-Cs[j][1])<Cs[j][2]-1){ok=false;break;}
   if(ok){pen?g.lineTo(x,y):g.moveTo(x,y);pen=true;}else pen=false;}}
 g.stroke();}
/* 置ける・動かせる場所：光の届く道を灯の色の帯で示す（前衛は道の上、後衛は道の奥の脇） */
function drawSpots(t,line){g.globalAlpha=.35+.2*Math.sin(t*6);g.fillStyle='#f2b347';
 st.Ps.forEach((P,li)=>{const yo=TDS.yo(st,li,line);for(let s=0;s<P.L;s+=4){const a=TDS.at(P,s);if(a.x<cam-8||a.x>cam+VW+8||!TDS.litAt(st,a.x,a.y))continue;g.fillRect(a.x-1.5,a.y+yo-1,3,2);}});g.globalAlpha=1;}
/* ---------- 毎コマ ---------- */
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000||0);last=now;
 if(!paused&&!st.over){acc+=dt*speed;let n=0;while(acc>=K.STEP&&n<10){TDS.tick(st);acc-=K.STEP;n++;}}else if(st.over)TDS.tick(st);
 take();if(!selU&&st.units.length)unitPanel(null);if(!st.over)follow(dt);draw(now/1000,dt);TDH.tick(st);
 if(st.over&&!ended){ended=true;setTimeout(result,1100);}}
/* 出来事 → 演出 */
function take(){for(const e of st.ev){TDSFX.ev(e);TDFX.ev(e,st);
 if(e.k==='hit'){if(e.u&&e.u.id!=='lamp'&&e.u.h)e.u.tg={f:e.f,t:st.t};if(nums.length<24){const n0=nums.filter(n=>n.f===e.f&&n.t<.25).length;nums.push({f:e.f,t:(e.big?-.24:-n0*.05)-(e._dl||0),x:e.f.x+(Math.random()*10-5),y:e.f.y-(e.f.boss?FB+4:F1+6)-n0*8,v:e.v,c:e.weak?'#ffc95a':e.res?'#a9a5c4':e.u&&e.u.id==='lamp'?'#fff0b8':'#ffffff',big:e.big?2:e.cr?1:0,cr:e.cr,weak:e.weak,res:e.res});}}
 else if(e.k==='kill'){if(e.f.boss)shake=3;}
 else if(e.k==='heal'){if(nums.length<24)nums.push({t:0,x:e.u.x,y:e.u.y-52,v:'+'+e.v,c:'#9fe8b8',big:0});}
 else if(e.k==='hurt'){e.u.hitT=st.t;}
 else if(e.k==='cast'){nm=nm.filter(n=>n.u!==e.u);nm.push({t:0,u:e.u,x:e.u.x,y:e.u.y-TDA.hgt(e.u.id,UH)-12,s:e.sk.n});TDH.fire(e.u,e.sk);}
 else if(e.k==='aw'){nm=nm.filter(n=>n.u!==e.u);nm.push({t:0,u:e.u,x:e.u.x,y:e.u.y-TDA.hgt(e.u.id,UH)-12,s:'星臨',aw:1});shake=2;}
 else if(e.k==='ult'){banner(e.u.h.ult.n,'',900);shake=3;}
 else if(e.k==='leak'){baseHit=st.t;shake=3;nope('.td-life');}
 else if(e.k==='wave'){banner('WAVE '+e.n,'',1200,e.boss);}
 else if(e.k==='clear')banner('WAVE '+e.n,'',700);
 else if(e.k==='fall'){TDA.fall(e.u,st);if(selU===e.u)unitPanel(null);}
 else if(e.k==='deploy'){unitPanel(e.u,1);}
 else if(e.k==='beam'){shake=3;if(!e.u)baseHit=st.t;}}
 st.ev.length=0;}
function draw(t,dt){TDFX.step(dt);g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,cv.width,cv.height);
 const k=S*DPR,sx=shake?(Math.random()*2-1)*shake:0,sy=shake?(Math.random()*2-1)*shake:0;shake=Math.max(0,shake-dt*12);shake=Math.max(shake,TDFX.shk());
 /* 奥行き：空（固定）→ 遠景 ×0.25 → 中景 ×0.55 → 地面 ×1 */
 g.setTransform(k,0,0,k,0,-VT*k);const sw=Math.min(bg.sky.width,VW);g.drawImage(bg.sky,0,0,sw,bg.sky.height,0,0,VW,bg.sky.height*VW/sw);
 g.drawImage(bg.far,-Math.round(cam*.25),0);g.drawImage(bg.mid,-Math.round(cam*.55),0);
 g.setTransform(k,0,0,k,(-cam+sx)*k,(sy-VT)*k);g.drawImage(bg.ground,0,0);
 TDBG.base(g,st.S.base[0],st.S.base[1],t,st.t-baseHit<.3);
 /* 遅延の陣 */
 for(const z of st.fields){if(z.u&&z.u.id==='celes')continue;g.strokeStyle='rgba(176,122,255,.7)';g.lineWidth=1;g.setLineDash([3,3]);g.beginPath();g.ellipse(z.x,z.y,z.r,z.r*.5,0,0,7);g.stroke();g.setLineDash([]);
  g.fillStyle='rgba(176,122,255,.12)';g.beginPath();g.ellipse(z.x,z.y,z.r,z.r*.5,0,0,7);g.fill();const a=-Math.PI/2+(t*2%6.283);g.strokeStyle='#e9d8ff';g.beginPath();g.moveTo(z.x,z.y);g.lineTo(z.x+Math.cos(a)*z.r*.5,z.y+Math.sin(a)*z.r*.25);g.stroke();}
 drawLight(t);TDFX.back(g);TDFX.dim(g);
 /* 置ける場所の案内（手札を選んでいるとき・移動の指示のとき） */
 if(sel){const c=st.deck.find(c=>c.id===sel);if(c)drawSpots(t,c.h.line);}
 if(mvU&&st.units.includes(mvU)){drawSpots(t,mvU.h.line);g.strokeStyle='#f2b347';g.lineWidth=1.5;g.beginPath();g.ellipse(mvU.x,mvU.y,13,4,0,0,7);g.stroke();}
 const sa=1-Math.max(0,(performance.now()-selAt-1200)/400);if(selU&&sa>0&&st.units.includes(selU)){const rc=TDD.ROLE[selU.h.role].col;g.globalAlpha=.1*sa;g.fillStyle=rc;g.beginPath();g.arc(selU.x,selU.y,selU.h.rng,0,7);g.fill();g.globalAlpha=.7*sa;g.strokeStyle=rc;g.lineWidth=1;g.beginPath();g.arc(selU.x,selU.y,selU.h.rng,0,7);g.stroke();g.globalAlpha=1;}
 marks(t,dt);
 /* キャラ（奥から） */
 const L=[...st.foes.map(f=>({y:f.y,f})),...st.units.map(u=>({y:u.y,u}))].sort((a,b)=>a.y-b.y);
 TDA.drawGhosts(g,st);spread();for(const o of L)o.f?drawFoe(o.f,t):drawUnit(o.u,t);
 TDFX.front(g);
 /* 画面に固定：小地図・画面の外の敵 */
 g.setTransform(k,0,0,k,0,0);air(t);g.setTransform(DPR,0,0,DPR,0,0);mini();edge(t);
 /* 字（画面の px で描く）：技の名前の札・ダメージの数字 */
 g.setTransform(DPR,0,0,DPR,0,0);texts(dt);}
const SX=x=>(x-cam)*S,SY=y=>(y-VT)*S;
/* 数字：白＝通常・金＝弱点（「弱」の印）・灰＝耐性・大きい＝会心と奥義。出た瞬間に大きく弾けて上へ抜け、最後に薄れる */
function texts(dt){g.textAlign='center';g.textBaseline='alphabetic';g.lineJoin='round';
 nm=nm.filter(n=>(n.t+=dt)<.9);for(const n of nm){const p=n.t/.9,x=SX(n.u&&n.u.hp>0?n.u.x:n.x),y=SY((n.u&&n.u.hp>0?n.u.y-TDA.hgt(n.u.id,UH)-12:n.y))-p*6;g.globalAlpha=p<.85?Math.min(1,n.t*12):(1-p)*6.6;
  g.font=`700 ${n.aw?15:12}px "Kaisei Tokumin",serif`;const w=g.measureText(n.s).width+14;g.fillStyle=n.aw?'rgba(90,60,10,.88)':'rgba(7,7,26,.78)';g.fillRect(x-w/2,y-13,w,18);
  g.fillStyle=n.aw?'#ffe2a0':'#f2b347';g.fillRect(x-w/2,y-13,2,18);g.fillStyle=n.aw?'#fff8e0':'#fff0b8';g.fillText(n.s,x,y+1);}
 nums=nums.filter(n=>(n.t+=dt)<.85);for(const n of nums){if(n.t<0)continue;const p=n.t/.85,pop=n.t<.08?1.45-n.t/.08*.45:1,sz=(n.big===2?24:n.big?20:n.res?13:16)*pop;
  const x=SX(n.x),y=SY(n.y)-Math.min(1,p*3)*14;g.globalAlpha=p<.7?1:1-(p-.7)/.3;
  g.font=`italic 800 ${sz.toFixed(1)}px "Barlow Semi Condensed","M PLUS 1p",sans-serif`;g.lineWidth=n.big?5:4;g.strokeStyle='#07071a';g.strokeText(n.v,x,y);g.fillStyle=n.c;g.fillText(n.v,x,y);
  if(n.cr&&n.big!==2){g.fillStyle='#ff8a6a';g.fillText(n.v,x,y);g.lineWidth=1.5;g.strokeStyle='#fff0b8';g.strokeText(n.v,x,y);}
  if(n.weak){const w=g.measureText(n.v).width;g.font='800 10px "M PLUS 1p",sans-serif';const bx=x+w/2+2,by=y-sz*.7;g.fillStyle='#07071a';g.fillRect(bx-1,by-1,14,14);g.fillStyle='#f2b347';g.fillRect(bx,by,12,12);g.fillStyle='#07071a';g.fillText('弱',bx+6,by+10);}}
 g.globalAlpha=1;g.lineJoin='miter';}
/* 章の空気：雷鳴は時々の閃き、氷華は雪、虚は昇る粒（画面に固定・軽い） */
function air(t){const P=bg.P;if(P.bolt){const b=(t*.37)%7;if(b<.12){g.fillStyle=`rgba(220,230,255,${.25*(1-b/.12)})`;g.fillRect(0,0,VW,VH);}}
 if(P.snow){g.fillStyle='rgba(240,246,255,.8)';for(let i=0;i<36;i++){const x=((i*53.7+t*(8+i%5*3))%(VW+20))-10,y=((i*91.3+t*(18+i%7*4))%VH);g.fillRect(x,y,1.5,1.5);}}
 if(st.S.th==='void'){g.fillStyle='rgba(176,122,255,.5)';for(let i=0;i<20;i++){const x=(i*61.3)%VW,y=VH-((i*47.1+t*(10+i%4*5))%VH);g.fillRect(x,y,1.5,1.5);}}}
function mini(){const W=st.S.W,x0=MINI.x,w=VW*S-MINI.x*2,y0=MINI.y,h=MINI.h,X=x=>x0+x/W*w,Y=y=>y0+2+(y-200)/(FH-200)*(h-4);
 g.fillStyle='rgba(7,7,26,.72)';g.fillRect(x0-1,y0-1,w+2,h+2);g.fillStyle='rgba(242,179,71,.16)';const lx=X(st.S.base[0]-st.lightR);g.fillRect(lx,y0,x0+w-lx,h);
 g.fillStyle='#4e4858';for(const P of st.Ps)for(let s=0;s<P.L;s+=8){const a=TDS.at(P,s);g.fillRect(X(a.x),Y(a.y),1,1);}
 g.fillStyle='#f2b347';g.fillRect(X(st.S.base[0])-1,y0+2,3,h-4);for(const u of st.units){g.fillRect(X(u.x)-1,Y(u.y)-1,2,2);}
 for(const f of st.foes){g.fillStyle=f.boss?'#ff8a6a':'#e86a6a';const s=f.boss?3:2;g.fillRect(X(f.x)-s/2,Y(f.y)-s/2,s,s);}
 g.strokeStyle='#efeaf8';g.lineWidth=1;g.strokeRect(X(cam)+.5,y0+.5,Math.max(4,VW/W*w)-1,h-1);}
function edge(t){const L=st.foes.filter(f=>f.x<cam-6).length,R=st.foes.filter(f=>f.x>cam+VW+6).length,CW=VW*S,CH=VH*S;g.font='800 13px "M PLUS 1p",sans-serif';g.textBaseline='middle';
 const chip=(x,txt,al)=>{g.textAlign=al;const w=g.measureText(txt).width+10;const bx=al==='left'?x:x-w;g.fillStyle='rgba(232,106,106,.9)';g.fillRect(bx,CH*.5,w,20);g.fillStyle='#fff';g.fillText(txt,al==='left'?x+5:x-5,CH*.5+10);};
 if(L)chip(4,'◀ '+L,'left');if(R)chip(CW-4,R+' ▶','right');g.textBaseline='alphabetic';}
function sprite(f,x,y,mir,hgt,flash,alpha,o){if(!f)return;const sc=Math.min(1,hgt/f.h),w=f.w*sc,h=f.h*sc;g.save();g.imageSmoothingEnabled=sc<.8;g.globalAlpha=alpha??1;
 g.translate(Math.round(x),Math.round(y));if(o){g.rotate(o.rot);g.scale(o.sx,o.sy);}if(mir)g.scale(-1,1);if(flash&&'filter'in g)g.filter='brightness(2.4)';g.drawImage(f.cv,-f.ax*sc,-f.ay*sc,w,h);if(o&&o.tint)FXK.tintDraw(g,f,-f.ax*sc,-f.ay*sc,w,h,o.tint,o.ta);g.restore();}
function bar(x,y,w,r,col){g.fillStyle='#07071a';g.fillRect(x-w/2-1,y-1,w+2,4);g.fillStyle='#3b3f72';g.fillRect(x-w/2,y,w,2);g.fillStyle=col;g.fillRect(x-w/2,y,Math.max(0,w*r),2);}
function drawFoe(f,t){const o=TDFX.pose(f,t,st),F=spr(f.spr,f.kind,1),sw=(f.boss?24:12)*o.sh;
 g.fillStyle=`rgba(7,7,26,${(.45*Math.min(1,o.a+.2)).toFixed(2)})`;g.beginPath();g.ellipse(f.x+o.dx*.5,f.y,sw,2.5,0,0,7);g.fill();
 sprite(F,f.x+o.dx,f.y+o.dy,f.dir<0,f.boss?FB:F1,o.fl,o.a,o);
 if(f.hp<f.mhp)bar(f.x,f.y-(f.boss?FB+6:F1+6),f.boss?46:26,f.hp/f.mhp,f.boss?'#ff8a6a':'#e86a6a');
 if(f.stun>0){g.fillStyle='#ffe14a';for(let i=0;i<3;i++){const a=t*6+i*2.1;g.fillRect(f.x+Math.cos(a)*8-1,f.y-(f.boss?FB:F1)-4+Math.sin(a)*2,2,2);}}
 if(f.tr.includes('void')){g.fillStyle='rgba(176,122,255,.55)';g.fillRect(f.x-1+Math.sin(t*3+f.uid)*6,f.y-6-((t*14+f.uid*5)%14),2,2);}
 if(f.tr.includes('armor')){g.fillStyle='#9fb0d0';g.fillRect(f.x-11,f.y-8,3,4);}
 if(f.curse>0){g.fillStyle='#b07aff';g.fillRect(f.x-6,f.y-(f.boss?FB:F1)-10,3,3);g.fillRect(f.x+3,f.y-(f.boss?FB:F1)-10,3,3);}
 /* 溜め：狙いの線（灯、または止めている仲間へ）と、溜まり具合の輪 */
 if(f.gim&&f.gim.ch>0){const T=f.by&&f.by.hp>0?{x:f.by.x,y:f.by.y-20}:{x:st.S.base[0],y:st.S.base[1]-110},p=1-f.gim.ch/3;
  g.strokeStyle=`rgba(255,106,74,${.35+.4*Math.abs(Math.sin(t*10))})`;g.lineWidth=1+p*2;g.setLineDash([5,4]);g.beginPath();g.moveTo(f.x,f.y-30);g.lineTo(T.x,T.y);g.stroke();g.setLineDash([]);
  g.strokeStyle='#ff6a4a';g.lineWidth=2;g.beginPath();g.arc(f.x,f.y-30,20,-Math.PI/2,-Math.PI/2+p*6.283);g.stroke();}}
/* 同じ隊形（前衛どうし・後衛どうし）が重なったら、描くときだけ少しずらす（ロジックの位置は変えない） */
function spread(){const U=st.units;for(const u of U)u.ox=0;
 for(let i=0;i<U.length;i++)for(let j=i+1;j<U.length;j++){const a=U[i],b=U[j];if(a.h.line!==b.h.line)continue;const dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)<22&&Math.abs(dy)<7){const d=(22-Math.abs(dx))/2+1,sg=dx>=0?1:-1;a.ox-=sg*d;b.ox+=sg*d;}}}
/* 足元の印：歩く行き先の輪と道筋・止めている接点・攻撃の相手への一瞬の線と輪 */
const dust=[];let dT=0;
function marks(t,dt){g.lineCap='round';
 for(const u of st.units){const col=TDD.ROLE[u.h.role].col,ux=u.x+(u.ox||0);
  if(u.mv){const a=TDS.at(u.P,u.ts),tx=a.x,ty=a.y+u.yo;
   g.globalAlpha=.3;g.strokeStyle=col;g.lineWidth=1.5;g.setLineDash([2,4]);g.lineDashOffset=-t*10;g.beginPath();g.moveTo(ux,u.y);g.lineTo(tx,ty);g.stroke();g.setLineDash([]);
   g.globalAlpha=.55+.25*Math.sin(t*8);g.lineWidth=1.2;g.beginPath();g.ellipse(tx,ty,9,3.2,0,0,7);g.stroke();g.globalAlpha=1;
   dT+=dt;if(dust.length<40&&(dT>.07)){dT=0;dust.push({x:ux-u.face*5+(Math.random()*4-2),y:u.y+1,t:0,vx:-u.face*(6+Math.random()*8)});}}
  for(const f of u.blocking){if(!(f.hp>0))continue;g.globalAlpha=.55;g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.moveTo(ux,u.y+1);g.lineTo(f.x,f.y+1);g.stroke();
   g.globalAlpha=.85;g.fillStyle='#fff0b8';g.beginPath();g.ellipse((ux+f.x)/2,(u.y+f.y)/2+1,2.4,1.2,0,0,7);g.fill();g.globalAlpha=1;}
  const tg=u.tg;if(tg&&tg.f.hp>0&&st.t-tg.t<.28&&!u.blocking.includes(tg.f)){const p=1-(st.t-tg.t)/.28;g.globalAlpha=p*.8;g.strokeStyle=col;g.lineWidth=1;g.beginPath();g.moveTo(ux,u.y-14);g.lineTo(tg.f.x,tg.f.y-8);g.stroke();
   g.lineWidth=1.5;g.beginPath();g.ellipse(tg.f.x,tg.f.y+1,(tg.f.boss?16:9)*(1+(1-p)*.3),(tg.f.boss?5:3)*(1+(1-p)*.3),0,0,7);g.stroke();g.globalAlpha=1;}}
 g.lineCap='butt';
 for(let i=dust.length-1;i>=0;i--){const d=dust[i];d.t+=dt;if(d.t>.4){dust.splice(i,1);continue;}const p=d.t/.4;g.globalAlpha=(1-p)*.5;g.fillStyle='#cfc8dc';g.fillRect(Math.round(d.x+d.vx*p),Math.round(d.y-p*5),2-p,2-p);}g.globalAlpha=1;}
function drawUnit(u,t){const fl=st.t-(u.hitT||-9)<.08,lg=st.t-u.actT<.12?u.face*3:0,F=spr(u.id,u.id,0),c=st.deck.find(c=>c.on===u),bob=u.mv?-Math.abs(Math.sin(t*11+u.uid))*2.5:0,col=TDD.ROLE[u.h.role].col,x=u.x+(u.ox||0);
 /* 足元：役割の色の楕円の影（止めている間は縁が太い）と、向きの小さな三角 */
 g.globalAlpha=.4;g.fillStyle=col;g.beginPath();g.ellipse(x,u.y+1,14,4.5,0,0,7);g.fill();g.globalAlpha=.95;g.strokeStyle=col;g.lineWidth=u.blocking.length?2:1;g.beginPath();g.ellipse(x,u.y+1,14,4.5,0,0,7);g.stroke();
 g.fillStyle=col;g.beginPath();g.moveTo(x+u.face*17,u.y+1);g.lineTo(x+u.face*12,u.y-1.5);g.lineTo(x+u.face*12,u.y+3.5);g.fill();g.globalAlpha=1;
 /* 星臨中：金の光の衣（足元から昇る光と、体の後ろの光） */
 if(u.awT>0){const k2=.75+.25*Math.sin(t*7),gr=g.createRadialGradient(x,u.y-30,3,x,u.y-30,38);gr.addColorStop(0,`rgba(255,226,160,${.5*k2})`);gr.addColorStop(1,'rgba(242,179,71,0)');g.fillStyle=gr;g.fillRect(x-38,u.y-68,76,76);
  g.fillStyle='#fff0b8';for(let i=0;i<4;i++){const q=(t*1.3+i*.25)%1;g.globalAlpha=1-q;g.fillRect(x-10+i*6+Math.sin(t*3+i)*2,u.y-q*44,1.5,3);}g.globalAlpha=1;}
 if(!TDA.draw(g,u,x,u.y,fl,u.lit?1:.55,st))sprite(F,x+lg,u.y+bob,u.face>0,UH,fl,u.lit?1:.55);
 if(!u.lit){g.fillStyle='rgba(169,165,196,.95)';g.font='700 8px "M PLUS 1p",sans-serif';g.textAlign='center';g.fillText('光の外',x,u.y+13);}
 bar(x,u.y-TDA.hgt(u.id,UH)-6,24,u.hp/u.h.hp,u.hp/u.h.hp<.35?'#e86a6a':'#9fe8b8');
 if(selU===u){g.strokeStyle='#fff0b8';g.lineWidth=1.5;g.beginPath();g.ellipse(x,u.y+1,18,6,0,0,7);g.stroke();}
 if(c&&((st.star>=K.STAR_MAX&&!c.ult)||(st.star>=K.AW&&!c.aw))){g.fillStyle='#fff0b8';g.globalAlpha=.6+.4*Math.sin(t*8);g.fillRect(x-17,u.y-TDA.hgt(u.id,UH)-4,3,3);g.globalAlpha=1;}}
let bT=0;function banner(a,b,ms,boss){const e=$('.td-banner');e.innerHTML=`${esc(a)}${b?`<small>${esc(b)}</small>`:''}`;e.classList.toggle('boss',!!boss);e.classList.add('show');clearTimeout(bT);bT=setTimeout(()=>e.classList.remove('show'),ms);}
/* できない操作は文章でなく、その場所を揺らして赤く光らせる */
function nope(q){const e=typeof q==='string'?$(q):q;if(!e)return;e.classList.remove('nope');void e.offsetWidth;e.classList.add('nope');}
let tT=0;function tip(s,ms=1600){const e=$('.td-tip');e.textContent=s;e.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>e.classList.remove('show'),ms);}
/* ---------- 選んだ仲間：操作盤（js/td/hud.js）に出す。quiet＝置いた直後（カメラは動かさない） ---------- */
let selAt=-9e9;function unitPanel(u,quiet){if(u&&!quiet)selAt=performance.now();selU=u||null;if(!u){const n=st&&st.units.find(v=>v.hp>0);selU=n||null;}TDH.con(selU);}
/* ---------- 操作：ドラッグで見渡す・タップで置く/選ぶ・小地図で移動 ---------- */
/* 指 1 本：ドラッグで見渡す・タップ。指 2 本：ピンチで戦場だけを拡大（指の間の場所を保つ）。2 本目が触れたらドラッグとタップは取り消す */
let drag=null,pinch=null;const pts=new Map();
function pDown(ev){if(!st)return;try{cv.setPointerCapture(ev.pointerId);}catch(e){}pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
 if(pts.size>=2){drag=null;const[a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:Z};return;}drag={x:ev.clientX,cam,moved:false};}
function pMove(ev){if(pts.has(ev.pointerId))pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
 if(pinch&&pts.size>=2){userT=performance.now();const[a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2-cv.getBoundingClientRect().left,wx=cam+mx/S,z=pinch.z*d/pinch.d;
  if(Math.abs(z-Z)>.02){Z=z;fit();setCam(wx-mx/S);}return;}
 if(!drag)return;const dx=ev.clientX-drag.x;if(Math.abs(dx)>6)drag.moved=true;if(drag.moved){userT=performance.now();setCam(drag.cam-dx/S);}}
function pUp(ev){pts.delete(ev.pointerId);if(pinch){if(pts.size<2)pinch=null;drag=null;return;}const d=drag;drag=null;if(!d||d.moved||!st||st.over)return;const r=cv.getBoundingClientRect(),sx=(ev.clientX-r.left)/S,sy0=(ev.clientY-r.top)/S,sy=sy0+VT;
 const px=ev.clientX-r.left,py=ev.clientY-r.top;if(py<=MINI.y+MINI.h+4&&px>=MINI.x&&px<=VW*S-MINI.x){userT=performance.now();setCam((px-MINI.x)/(VW*S-MINI.x*2)*st.S.W-VW/2);return;}
 const x=sx+cam,y=sy,u=st.units.find(u=>Math.abs(u.x+(u.ox||0)-x)<20&&y>u.y-UH-6&&y<u.y+10);
 /* 置く・動かす：道（後衛は道の奥の脇）の近くをタップ。遠すぎるタップは取り消し */
 const near=line=>{let b=null,bd=40;st.Ps.forEach((P,li)=>{const a=TDS.at(P,TDS.sOf(P,x)),d=Math.abs(a.y+TDS.yo(st,li,line)-y);if(d<bd){bd=d;b={x:a.x,y:a.y,yo:TDS.yo(st,li,line)};}});return b;};
 const bad=(why,a)=>{if(/灯力/.test(why))nope('.td-cost');else if(/上限/.test(why))nope('.td-deck');else TDFX.add({k:'gring',x:a.x,y:a.y,r:16,c:'#ff6a4a',c2:'#ff6a4a',d:.35});};
 if(mvU){const m=mvU;mvU=null;if(!st.units.includes(m)||u)return;const a=near(m.h.line);if(!a)return;const why=TDS.move(st,m.uid,x,a.y);if(why)bad(why,a);else TDFX.add({k:'gring',x:a.x,y:a.y+a.yo,r:12,c:'#f2b347',c2:'#fff0b8',d:.35});return;}
 if(sel){const c=st.deck.find(c=>c.id===sel),a=!u&&near(c.h.line);
  if(a){const why=TDS.deploy(st,sel,x,a.y);if(why)bad(why,a);else sel=null;return;}
  if(!u){sel=null;return;}}
 if(u){sel=null;unitPanel(u);}}
function onClick(ev){const b=ev.target.closest('[data-a],.td-card');if(!b)return;const a=b.dataset.a;
 if(b.classList.contains('td-card')){if(!st||st.over)return;const c=st.deck.find(c=>c.id===b.dataset.id);
  if(c.on){sel=null;mvU=null;userT=performance.now();setCam(c.on.x-VW/2);unitPanel(c.on);return;}const why=c.cd>0||st.cost<c.h.cost;
  if(why){nope(b);if(st.cost<c.h.cost)nope('.td-cost');return;}mvU=null;sel=sel===c.id?null:c.id;if(sel){
   /* 光の届く一番前の場所が画面の外なら、そこへ寄る */
   const fx=Math.min(...st.Ps.map((P,i)=>TDS.at(P,TDS.frontier(st,i)).x));if(fx<cam||fx>cam+VW)setCam(fx-VW/3);}return;}
 if(a==='spd'){speed=speed===1?2:1;b.textContent='×'+speed;b.classList.toggle('on',speed===2);}
 else if(a==='pause'){paused=!paused;b.classList.toggle('on',paused);b.textContent=paused?'▶':'Ⅱ';if(paused)banner('Ⅱ','',99999);else $('.td-banner').classList.remove('show');}
 else if(a==='call')TDS.callWave(st);
 else if(a==='lamp'){if(!st||st.over)return;const why=TDS.lampUp(st);if(why){nope(b);if(/灯力/.test(why))nope('.td-cost');}}
 else if(a==='ult'){if(!selU||!TDS.ult(st,selU.uid))nope(b);}
 else if(a==='aw'){if(!selU||!TDS.aw(st,selU.uid))nope(b);}
 else if(a==='sk'){const k=selU&&selU.h.sks[+b.dataset.i];if(k)tip(k.n+'　'+TDD.skTxt(k),1800);}
 else if(a==='focus'){if(selU){userT=performance.now();setCam(selU.x-VW/2);}}
 else if(a==='ret'){if(selU){TDS.retreat(st,selU.uid);unitPanel(null);}}
 else if(a==='mv'){if(selU){mvU=selU;sel=null;userT=performance.now();setCam(selU.x-VW/2);}}
 else if(a==='menu'){paused=true;sheet(`<h3>防衛をやめる</h3><div class="sub">ここまでの報酬は得られない</div><div class="td-acts"><button class="td-btn" data-a="resume">続ける</button><button class="td-btn" data-a="quit">やめる</button></div>`);}
 else if(a==='resume'){sheet(null);paused=false;}
 else if(a==='quit'){stop();TDM.map();}
 else if(a==='again'){TDM.prep(sid);}
 else if(a==='next'){stop();TDM.after(sid,true);}
 else if(a==='map'){stop();TDM.after(sid,false);}}
function sheet(html){const s=$('.td-sheet');if(!html){s.hidden=true;return;}s.querySelector('.td-panel').innerHTML=html;s.hidden=false;}
/* ---------- 結果：星 3 つ・報酬（経験値はストックへ、ゴールド） ---------- */
function result(){const o=st.over,S0=st.S,win=o.win,n=o.stars.reduce((a,b)=>a+b,0);let rw={xp:0,gold:0},first=false;
 /* 精算（星・報酬・星 3 の錬磨石・周回・天への塔）は js/td/menu.js の TDM.settle */
 const R=TDM.settle(sid,st);if(R.sheet){sheet(R.sheet);return;}rw=R.rw;first=R.first;
 const goals=[['灯を守りきる',o.stars[0]],['灯火を 1 つも減らさない',o.stars[1]],[`${S0.star.time} 秒以内に守りきる`,o.stars[2]]];
 sheet(`<h3>${win?'防衛成功':'灯が消えた'}</h3><div class="sub">${esc(TDM.chOf(sid).ch)}・${esc(S0.name)}　${o.t} 秒</div>
 <div class="td-stars">${o.stars.map(s=>`<i class="${s?'on':''}"></i>`).join('')}</div><ul class="td-goal">${goals.map(([t,s])=>`<li class="${s?'on':''}">${t}</li>`).join('')}</ul>
 ${win?`<div class="td-rw"><span>経験値 <b>${rw.xp}</b></span><span>ゴールド <b>${rw.gold}</b></span>${first?'<span>初回ボーナス</span>':''}${R.chips||''}</div>`:'<div class="sub">仲間を育てるか、配置を変えてもう一度</div>'}
 <div class="td-acts"><button class="td-btn" data-a="again">もう一度</button>${win?`<button class="td-btn on" data-a="next">次へ</button>`:`<button class="td-btn" data-a="map">地図へ</button>`}</div>`);
 TDM.cleared(sid,win,first);}
/* ---------- 開く・止める ---------- */
function lvMap(){const o={};try{for(const id in G.h)o[id]=G.h[id].lv||1;}catch(e){}return o;}
function stop(){cancelAnimationFrame(raf);st=null;try{GUIDE.stop();}catch(e){}}
function open(id,deck){build();sid=id;cancelAnimationFrame(raf);
 const dk=deck||TDD.deckOf(),rl={};for(const h of dk)rl[h]=TDD.real(h);
 st=TDS.create(sid,dk,{lv:lvMap(),real:rl,seed:(Date.now()%100000)+1});speed=1;paused=false;sel=null;selU=null;mvU=null;nm=[];nums=[];TDA.clear();TDFX.reset();ended=false;acc=0;Z=1;userT=0;bg=null;pts.clear();pinch=null;drag=null;
 root.classList.remove('hide');sheet(null);TDH.open(st);const sb=$('[data-a="spd"]');sb.textContent='×1';sb.classList.remove('on');
 const sn=$('[data-a="snd"]');sn.innerHTML=TDSFX.icon();sn.classList.toggle('off',!TDSFX.on);const pb=$('[data-a="pause"]');pb.textContent='Ⅱ';pb.classList.remove('on');
 requestAnimationFrame(()=>{fit();setCam(st.S.W);last=performance.now();raf=requestAnimationFrame(loop);banner(st.S.name,'',1600);try{GUIDE.start(sid);}catch(e){console.error(e);}
  });}
function show(){build();root.classList.remove('hide');}
function hide(){stop();if(root)root.classList.add('hide');}
const toScr=(x,y)=>{const r=cv.getBoundingClientRect();return{x:r.left+(x-cam)*S,y:r.top+(y-VT)*S,S,L:r.left,R:r.left+r.width};};
return{toScr,open,show,hide,sheet:h=>{build();sheet(h);},root:()=>(build(),root),get st(){return st;},get cam(){return cam;},setCam:x=>{if(st)setCam(x);}};})();
