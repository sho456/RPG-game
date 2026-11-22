/* ===== TD の戦闘画面（TD）：横スクロールの戦場・上下の帯・手札・ユニットの窓・リザルト。ロジックは js/td/sim.js（TDS） =====
 戦場は横に長い帯（論理の高さ 420・幅はステージごと）。画面の高さに合わせて拡大し、左右にドラッグで見渡す。上の小地図をタップでその場所へ。
 背景は js/td/bg.js（空・遠景・中景・地面の奥行き）。原画は SPX.unitCv（RPG 版と同じ絵）。灯域の外は暗く沈める。
 入口：TD.open(stageId)（章の地図と出撃準備は js/td/menu.js）。本編の startBattle 系には触れない。
 見せ方の決まり（TD デモの README）：ゲームを止めない・短い・読める（数字は同時に 24 まで、揺れは 3px まで） */
'use strict';
const TD=(()=>{
const K=TDD.K,FH=K.FH;
let root=null,cv=null,g=null,st=null,S=1,DPR=1,VW=300,cam=0,raf=0,last=0,acc=0,speed=1,paused=false,sel=null,selU=null,mvU=null,nm=[],nums=[],shake=0,bg=null,lt=null,sid=null,ended=false,baseHit=0;
const $=q=>root.querySelector(q);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MINI={x:8,y:6,h:16};
/* ---------- 原画 ---------- */
const SC=new Map();
function spr(key,fk,side){const k=key+'|'+side;if(SC.has(k))return SC.get(k);let f=null;try{f=SPX.unitCv(key,fk,side,side?32:42);}catch(e){console.error(e);}SC.set(k,f);return f;}
const IMG={};
function face(id){if(IMG[id])return IMG[id];const f=spr(id,id,0);if(!f)return'';const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return IMG[id]=c.toDataURL();}
/* ---------- 画面を作る ---------- */
function build(){if(root)return;root=document.createElement('div');root.id='td';root.className='hide';
 root.innerHTML=`<div class="td-top"><div class="td-wave"><small>WAVE</small><b class="wv">-</b></div><div class="td-life"><span>灯火</span></div>
 <button class="td-btn td-snd" data-a="snd" aria-label="音">${TDSFX.icon()}</button><button class="td-btn" data-a="spd" aria-label="速度">×1</button><button class="td-btn" data-a="pause" aria-label="一時停止">Ⅱ</button><button class="td-btn" data-a="menu" aria-label="やめる">≡</button></div>
 <div class="td-field"><canvas></canvas><button class="td-call" data-a="call" hidden></button><div class="td-banner"></div><div class="td-unit" hidden></div><div class="td-tip"></div>
 <div class="td-sheet" hidden><div class="td-panel"></div></div></div>
 <div class="td-bar"><div class="td-costw"><div class="td-cost"><i class="ic-lamp"></i><b>0</b></div><i class="cb"></i></div><button class="td-btn td-lampb" data-a="lamp"></button><div class="td-star"><i class="ic-star"></i><div class="g"><i></i></div></div></div>
 <div class="td-deck"></div>`;
 document.body.appendChild(root);cv=root.querySelector('canvas');g=cv.getContext('2d');TDFX.bind({spr,cam:()=>cam,vw:()=>VW});
 root.addEventListener('click',onClick);cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',()=>{drag=null;});
 cv.addEventListener('wheel',e=>{if(!st)return;e.preventDefault();setCam(cam+(e.deltaX||e.deltaY)/S);},{passive:false});addEventListener('resize',()=>{if(st)fit();});}
function fit(){const f=$('.td-field'),w=f.clientWidth,h=f.clientHeight;DPR=Math.max(1,Math.min(3,devicePixelRatio||1));
 S=Math.max(h/FH,w/st.S.W);VW=w/S;cv.style.width=w+'px';cv.style.height=Math.round(FH*S)+'px';cv.width=Math.round(w*DPR);cv.height=Math.round(FH*S*DPR);bg=TDBG.make(st,VW);setCam(cam);}
const setCam=x=>{cam=Math.max(0,Math.min(st.S.W-VW,x));};
/* ---------- 光（灯域）：画面の幅の暗さの層に光の円を抜く ---------- */
function drawLight(t){if(!lt||lt.width!==Math.ceil(VW)){lt=document.createElement('canvas');lt.width=Math.ceil(VW);lt.height=FH;}const l=lt.getContext('2d');
 l.globalCompositeOperation='source-over';l.clearRect(0,0,lt.width,FH);l.fillStyle='rgba(16,10,34,.62)';l.fillRect(0,0,lt.width,FH);l.globalCompositeOperation='destination-out';
 const hole=(x,y,r)=>{x-=cam;const gr=l.createRadialGradient(x,y,r*.8,x,y,r);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=gr;l.beginPath();l.arc(x,y,r,0,7);l.fill();};
 const[bx,by]=st.S.base;hole(bx,by,st.lightR+Math.sin(t*2)*2);for(const u of st.lsrc)hole(u.x,u.y,u.h.lt);
 g.drawImage(lt,cam,0);
 g.strokeStyle='rgba(242,179,71,.55)';g.lineWidth=1;g.setLineDash([4,4]);g.lineDashOffset=-t*6;g.beginPath();g.arc(bx,by,st.lightR,0,7);g.stroke();
 for(const u of st.lsrc){g.beginPath();g.arc(u.x,u.y,u.h.lt,0,7);g.stroke();}g.setLineDash([]);}
/* 置ける・動かせる場所：光の届く道を灯の色の帯で示す（前衛は道の上、後衛は道の奥の脇） */
function drawSpots(t,line){g.globalAlpha=.35+.2*Math.sin(t*6);g.fillStyle='#f2b347';
 st.Ps.forEach((P,li)=>{const yo=TDS.yo(st,li,line);for(let s=0;s<P.L;s+=4){const a=TDS.at(P,s);if(a.x<cam-8||a.x>cam+VW+8||!TDS.litAt(st,a.x,a.y))continue;g.fillRect(a.x-1.5,a.y+yo-1,3,2);}});g.globalAlpha=1;}
/* ---------- 毎コマ ---------- */
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000||0);last=now;
 if(!paused&&!st.over){acc+=dt*speed;let n=0;while(acc>=K.STEP&&n<10){TDS.tick(st);acc-=K.STEP;n++;}}else if(st.over)TDS.tick(st);
 take();draw(now/1000,dt);hud();
 if(st.over&&!ended){ended=true;setTimeout(result,1100);}}
/* 出来事 → 演出 */
function take(){for(const e of st.ev){TDSFX.ev(e);TDFX.ev(e,st);
 if(e.k==='hit'){if(nums.length<24)nums.push({t:e.big?-.24:0,x:e.f.x+(Math.random()*8-4),y:e.f.y-34,v:e.v,c:e.weak?'#f2b347':e.res?'#8f89a8':'#efeaf8',big:e.cr||e.big,weak:e.weak});}
 else if(e.k==='kill'){if(e.f.boss)shake=3;}
 else if(e.k==='heal'){if(nums.length<24)nums.push({t:0,x:e.u.x,y:e.u.y-46,v:'+'+e.v,c:'#9fe8b8'});}
 else if(e.k==='hurt'){e.u.hitT=st.t;}
 else if(e.k==='cast')nm.push({t:0,x:e.u.x,y:e.u.y-58,s:e.sk.n});
 else if(e.k==='ult'){banner(e.u.h.ult.n,'',900);shake=3;}
 else if(e.k==='leak'){baseHit=st.t;shake=3;nope('.td-life');}
 else if(e.k==='wave'){banner('WAVE '+e.n,'',1200,e.boss);}
 else if(e.k==='clear')banner('WAVE '+e.n,'',700);
 else if(e.k==='fall'){if(selU===e.u)unitPanel(null);}
 else if(e.k==='beam'){shake=3;if(!e.u)baseHit=st.t;}}
 st.ev.length=0;}
function draw(t,dt){TDFX.step(dt);g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,cv.width,cv.height);
 const k=S*DPR,sx=shake?(Math.random()*2-1)*shake:0,sy=shake?(Math.random()*2-1)*shake:0;shake=Math.max(0,shake-dt*12);
 /* 奥行き：空（固定）→ 遠景 ×0.25 → 中景 ×0.55 → 地面 ×1 */
 g.setTransform(k,0,0,k,0,0);const sw=Math.min(bg.sky.width,VW);g.drawImage(bg.sky,0,0,sw,bg.sky.height,0,0,VW,bg.sky.height*VW/sw);
 g.drawImage(bg.far,-Math.round(cam*.25),0);g.drawImage(bg.mid,-Math.round(cam*.55),0);
 g.setTransform(k,0,0,k,(-cam+sx)*k,sy*k);g.drawImage(bg.ground,0,0);
 TDBG.base(g,st.S.base[0],st.S.base[1],t,st.t-baseHit<.3);
 /* 遅延の陣 */
 for(const z of st.fields){g.strokeStyle='rgba(176,122,255,.7)';g.lineWidth=1;g.setLineDash([3,3]);g.beginPath();g.ellipse(z.x,z.y,z.r,z.r*.5,0,0,7);g.stroke();g.setLineDash([]);
  g.fillStyle='rgba(176,122,255,.12)';g.beginPath();g.ellipse(z.x,z.y,z.r,z.r*.5,0,0,7);g.fill();const a=-Math.PI/2+(t*2%6.283);g.strokeStyle='#e9d8ff';g.beginPath();g.moveTo(z.x,z.y);g.lineTo(z.x+Math.cos(a)*z.r*.5,z.y+Math.sin(a)*z.r*.25);g.stroke();}
 drawLight(t);TDFX.back(g);TDFX.dim(g);
 /* 置ける場所の案内（手札を選んでいるとき・移動の指示のとき） */
 if(sel){const c=st.deck.find(c=>c.id===sel);if(c)drawSpots(t,c.h.line);}
 if(mvU&&st.units.includes(mvU)){drawSpots(t,mvU.h.line);g.strokeStyle='#f2b347';g.lineWidth=1.5;g.beginPath();g.ellipse(mvU.x,mvU.y,13,4,0,0,7);g.stroke();}
 if(selU&&st.units.includes(selU)){g.strokeStyle='rgba(242,179,71,.6)';g.lineWidth=1;g.beginPath();g.arc(selU.x,selU.y,selU.h.rng,0,7);g.stroke();}
 /* キャラ（奥から） */
 const L=[...st.foes.map(f=>({y:f.y,f})),...st.units.map(u=>({y:u.y,u}))].sort((a,b)=>a.y-b.y);
 for(const o of L)o.f?drawFoe(o.f,t):drawUnit(o.u,t);
 TDFX.front(g);
 nm=nm.filter(n=>(n.t+=dt)<.6);for(const n of nm){const p=n.t/.6;g.globalAlpha=p<.8?1:(1-p)*5;g.font='700 10px "Kaisei Tokumin",serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#07071a';g.strokeText(n.s,n.x,n.y-p*4);g.fillStyle='#fff0b8';g.fillText(n.s,n.x,n.y-p*4);}g.globalAlpha=1;
 nums=nums.filter(n=>(n.t+=dt)<.7);g.textAlign='center';for(const n of nums){if(n.t<0)continue;const p=n.t/.7;g.globalAlpha=p<.75?1:1-(p-.75)*4;g.font=`800 ${n.big?14:11}px "M PLUS 1p",sans-serif`;
  const y=n.y-Math.min(1,p*4)*8;g.lineWidth=3;g.strokeStyle='#07071a';g.strokeText(n.v,n.x,y);g.fillStyle=n.c;g.fillText(n.v,n.x,y);if(n.weak){g.font='800 8px "M PLUS 1p",sans-serif';g.strokeText('弱点',n.x,y-11);g.fillText('弱点',n.x,y-11);}}
 g.globalAlpha=1;
 /* 画面に固定：小地図・画面の外の敵 */
 g.setTransform(k,0,0,k,0,0);air(t);mini();edge(t);}
/* 章の空気：雷鳴は時々の閃き、氷華は雪、虚は昇る粒（画面に固定・軽い） */
function air(t){const P=bg.P;if(P.bolt){const b=(t*.37)%7;if(b<.12){g.fillStyle=`rgba(220,230,255,${.25*(1-b/.12)})`;g.fillRect(0,0,VW,FH);}}
 if(P.snow){g.fillStyle='rgba(240,246,255,.8)';for(let i=0;i<36;i++){const x=((i*53.7+t*(8+i%5*3))%(VW+20))-10,y=((i*91.3+t*(18+i%7*4))%FH);g.fillRect(x,y,1.5,1.5);}}
 if(st.S.th==='void'){g.fillStyle='rgba(176,122,255,.5)';for(let i=0;i<20;i++){const x=(i*61.3)%VW,y=FH-((i*47.1+t*(10+i%4*5))%FH);g.fillRect(x,y,1.5,1.5);}}}
function mini(){const W=st.S.W,x0=MINI.x,w=VW-MINI.x*2,y0=MINI.y,h=MINI.h,X=x=>x0+x/W*w,Y=y=>y0+2+(y-200)/(FH-200)*(h-4);
 g.fillStyle='rgba(7,7,26,.72)';g.fillRect(x0-1,y0-1,w+2,h+2);g.fillStyle='rgba(242,179,71,.16)';const lx=X(st.S.base[0]-st.lightR);g.fillRect(lx,y0,x0+w-lx,h);
 g.fillStyle='#4e4858';for(const P of st.Ps)for(let s=0;s<P.L;s+=8){const a=TDS.at(P,s);g.fillRect(X(a.x),Y(a.y),1,1);}
 g.fillStyle='#f2b347';g.fillRect(X(st.S.base[0])-1,y0+2,3,h-4);for(const u of st.units){g.fillRect(X(u.x)-1,Y(u.y)-1,2,2);}
 for(const f of st.foes){g.fillStyle=f.boss?'#ff8a6a':'#e86a6a';const s=f.boss?3:2;g.fillRect(X(f.x)-s/2,Y(f.y)-s/2,s,s);}
 g.strokeStyle='#efeaf8';g.lineWidth=1;g.strokeRect(X(cam)+.5,y0+.5,Math.max(4,VW/W*w)-1,h-1);}
function edge(t){const L=st.foes.filter(f=>f.x<cam-6).length,R=st.foes.filter(f=>f.x>cam+VW+6).length;g.font='800 10px "M PLUS 1p",sans-serif';g.textBaseline='middle';
 const chip=(x,txt,al)=>{g.textAlign=al;const w=g.measureText(txt).width+10;const bx=al==='left'?x:x-w;g.fillStyle='rgba(232,106,106,.9)';g.fillRect(bx,FH*.62,w,16);g.fillStyle='#fff';g.fillText(txt,al==='left'?x+5:x-5,FH*.62+8);};
 if(L)chip(4,'◀ '+L,'left');if(R)chip(VW-4,R+' ▶','right');g.textBaseline='alphabetic';}
function sprite(f,x,y,mir,hgt,flash,alpha,o){if(!f)return;const sc=Math.min(1,hgt/f.h),w=f.w*sc,h=f.h*sc;g.save();g.imageSmoothingEnabled=sc<.8;g.globalAlpha=alpha??1;
 g.translate(Math.round(x),Math.round(y));if(o){g.rotate(o.rot);g.scale(o.sx,o.sy);}if(mir)g.scale(-1,1);if(flash&&'filter'in g)g.filter='brightness(2.4)';g.drawImage(f.cv,-f.ax*sc,-f.ay*sc,w,h);g.restore();}
function bar(x,y,w,r,col){g.fillStyle='#07071a';g.fillRect(x-w/2-1,y-1,w+2,4);g.fillStyle='#3b3f72';g.fillRect(x-w/2,y,w,2);g.fillStyle=col;g.fillRect(x-w/2,y,Math.max(0,w*r),2);}
function drawFoe(f,t){const o=TDFX.pose(f,t,st),F=spr(f.spr,f.kind,1),sw=(f.boss?20:10)*o.sh;
 g.fillStyle=`rgba(7,7,26,${(.45*Math.min(1,o.a+.2)).toFixed(2)})`;g.beginPath();g.ellipse(f.x+o.dx*.5,f.y,sw,2.5,0,0,7);g.fill();
 sprite(F,f.x+o.dx,f.y+o.dy,f.dir<0,f.boss?60:32,o.fl,o.a,o);
 if(f.hp<f.mhp)bar(f.x,f.y-(f.boss?66:38),f.boss?40:22,f.hp/f.mhp,f.boss?'#ff8a6a':'#e86a6a');
 if(f.stun>0){g.fillStyle='#ffe14a';for(let i=0;i<3;i++){const a=t*6+i*2.1;g.fillRect(f.x+Math.cos(a)*8-1,f.y-36+Math.sin(a)*2,2,2);}}
 if(f.tr.includes('void')){g.fillStyle='rgba(176,122,255,.55)';g.fillRect(f.x-1+Math.sin(t*3+f.uid)*6,f.y-6-((t*14+f.uid*5)%14),2,2);}
 if(f.tr.includes('armor')){g.fillStyle='#9fb0d0';g.fillRect(f.x-11,f.y-8,3,4);}
 if(f.curse>0){g.fillStyle='#b07aff';g.fillRect(f.x-6,f.y-42,3,3);g.fillRect(f.x+3,f.y-42,3,3);}
 /* 溜め：狙いの線（灯、または止めている仲間へ）と、溜まり具合の輪 */
 if(f.gim&&f.gim.ch>0){const T=f.by&&f.by.hp>0?{x:f.by.x,y:f.by.y-20}:{x:st.S.base[0],y:st.S.base[1]-110},p=1-f.gim.ch/3;
  g.strokeStyle=`rgba(255,106,74,${.35+.4*Math.abs(Math.sin(t*10))})`;g.lineWidth=1+p*2;g.setLineDash([5,4]);g.beginPath();g.moveTo(f.x,f.y-30);g.lineTo(T.x,T.y);g.stroke();g.setLineDash([]);
  g.strokeStyle='#ff6a4a';g.lineWidth=2;g.beginPath();g.arc(f.x,f.y-30,20,-Math.PI/2,-Math.PI/2+p*6.283);g.stroke();}}
function drawUnit(u,t){const fl=st.t-(u.hitT||-9)<.08,lg=st.t-u.actT<.12?u.face*3:0,F=spr(u.id,u.id,0),c=st.deck.find(c=>c.on===u),bob=u.mv?-Math.abs(Math.sin(t*11+u.uid))*2.5:0;
 g.fillStyle=TDD.ROLE[u.h.role].col;g.globalAlpha=.85;g.fillRect(u.x-10,u.y+3,20,2);g.globalAlpha=1;
 sprite(F,u.x+lg,u.y+bob,u.face>0,48,fl,u.lit?1:.55);
 if(!u.lit){g.fillStyle='rgba(169,165,196,.95)';g.font='700 8px "M PLUS 1p",sans-serif';g.textAlign='center';g.fillText('光の外',u.x,u.y+13);}
 if(u.hp<u.h.hp)bar(u.x,u.y-54,22,u.hp/u.h.hp,'#9fe8b8');
 const r=Math.min(1,u.ch/u.h.sk.ch);g.strokeStyle=r>=1?'#f2b347':'rgba(242,179,71,.45)';g.lineWidth=1.5;g.beginPath();g.arc(u.x+14,u.y-50,3.5,-Math.PI/2,-Math.PI/2+r*6.283);g.stroke();
 if(st.star>=K.STAR_MAX&&c&&!c.ult){g.fillStyle='#fff0b8';g.globalAlpha=.6+.4*Math.sin(t*8);g.fillRect(u.x-15,u.y-52,3,3);g.globalAlpha=1;}}
/* ---------- 帯（変わったところだけ書き換える） ---------- */
const memo={};const set=(k,el,v,f)=>{if(memo[k]===v)return;memo[k]=v;f(el,v);};
function hud(){set('wv',$('.wv'),(st.wave+1)+(st.S.inf?'':'/'+st.S.waves.length),(e,v)=>e.textContent=v);
 set('lv',$('.td-life'),st.lives,(e,v)=>{e.innerHTML='<span>灯火</span>'+Array.from({length:K.LIVES},(_,i)=>`<i class="${i<v?'':'off'}"></i>`).join('');});
 set('co',$('.td-cost b'),st.cost,(e,v)=>e.textContent=v);$('.cb').style.width=Math.round(st.costAcc/K.COST_EVERY*84)+'px';
 const sr=Math.min(K.STAR_MAX,st.star);set('sr',$('.td-star'),st.star,(e,v)=>{e.querySelector('.g i').style.width=(sr/K.STAR_MAX*100)+'%';e.classList.toggle('full',v>=K.STAR_MAX);});
 const call=$('.td-call'),gap=st.phase==='gap'&&!st.over;set('call',call,gap?Math.ceil(st.gapT)+'|'+st.wave:'',(e,v)=>{e.hidden=!v;if(v)e.innerHTML=st.wave<0?`▶ <b>${Math.ceil(st.gapT)}</b>`:`▶▶ <i class="ic-lamp"></i><b>+${Math.ceil(st.gapT)}</b>`;});
 const lc=TDS.lampCost(st);set('lamp',$('.td-lampb'),lc+'|'+(st.cost>=lc?1:0),(e)=>{e.innerHTML=`<i class="ic-tower"></i><span class="pp">${[0,1,2].map(i=>`<i class="${i<st.lamp?'on':''}"></i>`).join('')}</span>${lc?`<b>${lc}</b>`:''}`;e.classList.toggle('poor',!lc||st.cost<lc);});
 for(const c of st.deck){const el=root.querySelector(`.td-card[data-id="${c.id}"]`);if(!el)continue;const st8=`${c.on?1:0}${c.cd>0?Math.ceil(c.cd):0}${st.cost>=c.h.cost?1:0}${sel===c.id?1:0}`;
  set('c'+c.id,el,st8,(e)=>{e.classList.toggle('on',!!c.on);e.classList.toggle('poor',st.cost<c.h.cost);e.classList.toggle('sel',sel===c.id);const d=e.querySelector('.cd');
   if(c.cd>0){d.hidden=false;d.textContent=Math.ceil(c.cd);}else d.hidden=true;});
  if(c.cd>0){const full=c.h.redeploy*1.5;el.querySelector('.cd').style.setProperty('--p',Math.round(c.cd/full*100)+'%');}}
 if(selU)unitPanelPos();}
function deckHTML(){return st.deck.map(c=>`<button class="td-card" data-id="${c.id}" aria-label="${esc(c.h.name)} コスト${c.h.cost}"><img src="${face(c.id)}" alt=""><span class="c">${c.h.cost}</span>
 <span class="r" style="background:${TDD.ROLE[c.h.role].col}"></span><span class="n">${esc(c.h.name)}</span><span class="cd" hidden></span></button>`).join('');}
let bT=0;function banner(a,b,ms,boss){const e=$('.td-banner');e.innerHTML=`${esc(a)}${b?`<small>${esc(b)}</small>`:''}`;e.classList.toggle('boss',!!boss);e.classList.add('show');clearTimeout(bT);bT=setTimeout(()=>e.classList.remove('show'),ms);}
/* できない操作は文章でなく、その場所を揺らして赤く光らせる */
function nope(q){const e=typeof q==='string'?$(q):q;if(!e)return;e.classList.remove('nope');void e.offsetWidth;e.classList.add('nope');}
let tT=0;function tip(s,ms=1600){const e=$('.td-tip');e.textContent=s;e.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>e.classList.remove('show'),ms);}
/* ---------- ユニットの窓 ---------- */
function unitPanel(u){selU=u;const p=$('.td-unit');if(!u){p.hidden=true;return;}const h=u.h,c=st.deck.find(c=>c.on===u),can=TDS.canUlt(st,u.uid);
 p.innerHTML=`<h4>${esc(h.name)}<em>Lv${h.lv}</em></h4><p>${esc(h.sk.n)}</p>
 <div class="row"><button class="td-btn ult${can?' on':''}" data-a="ult" ${can?'':'disabled'}>${esc(h.ult.n)}</button><button class="td-btn" data-a="mv">移動</button><button class="td-btn" data-a="ret">撤退</button></div>`;
 p.hidden=false;unitPanelPos();if(c&&c.ult)p.querySelector('.ult').textContent='星臨済み';}
function unitPanelPos(){const p=$('.td-unit'),f=$('.td-field'),r=cv.getBoundingClientRect(),fr=f.getBoundingClientRect(),sx=(selU.x-cam)*S,sy=selU.y*S;
 let x=r.left-fr.left+sx-p.offsetWidth/2,y=r.top-fr.top+sy+10;if(y+p.offsetHeight>fr.height-4)y=r.top-fr.top+sy-70-p.offsetHeight;
 x=Math.max(4,Math.min(fr.width-p.offsetWidth-4,x));p.style.left=x+'px';p.style.top=Math.max(4,y)+'px';}
/* ---------- 操作：ドラッグで見渡す・タップで置く/選ぶ・小地図で移動 ---------- */
let drag=null;
function pDown(ev){if(!st)return;cv.setPointerCapture(ev.pointerId);drag={x:ev.clientX,cam,moved:false};}
function pMove(ev){if(!drag)return;const dx=ev.clientX-drag.x;if(Math.abs(dx)>6)drag.moved=true;if(drag.moved)setCam(drag.cam-dx/S);}
function pUp(ev){const d=drag;drag=null;if(!d||d.moved||!st||st.over)return;const r=cv.getBoundingClientRect(),sx=(ev.clientX-r.left)/S,sy=(ev.clientY-r.top)/S;
 if(sy<=MINI.y+MINI.h+4&&sx>=MINI.x&&sx<=VW-MINI.x){setCam((sx-MINI.x)/(VW-MINI.x*2)*st.S.W-VW/2);return;}
 const x=sx+cam,y=sy,u=st.units.find(u=>Math.abs(u.x-x)<16&&y>u.y-54&&y<u.y+10);
 /* 置く・動かす：道（後衛は道の奥の脇）の近くをタップ。遠すぎるタップは取り消し */
 const near=line=>{let b=null,bd=40;st.Ps.forEach((P,li)=>{const a=TDS.at(P,TDS.sOf(P,x)),d=Math.abs(a.y+TDS.yo(st,li,line)-y);if(d<bd){bd=d;b={x:a.x,y:a.y,yo:TDS.yo(st,li,line)};}});return b;};
 const bad=(why,a)=>{if(/灯力/.test(why))nope('.td-cost');else if(/上限/.test(why))nope('.td-deck');else TDFX.add({k:'gring',x:a.x,y:a.y,r:16,c:'#ff6a4a',c2:'#ff6a4a',d:.35});};
 if(mvU){const m=mvU;mvU=null;if(!st.units.includes(m)||u)return;const a=near(m.h.line);if(!a)return;const why=TDS.move(st,m.uid,x,a.y);if(why)bad(why,a);else TDFX.add({k:'gring',x:a.x,y:a.y+a.yo,r:12,c:'#f2b347',c2:'#fff0b8',d:.35});return;}
 if(sel){const c=st.deck.find(c=>c.id===sel),a=!u&&near(c.h.line);
  if(a){const why=TDS.deploy(st,sel,x,a.y);if(why)bad(why,a);else sel=null;return;}
  if(!u){sel=null;return;}}
 if(u){sel=null;unitPanel(u===selU?null:u);return;}unitPanel(null);}
function onClick(ev){const b=ev.target.closest('[data-a],.td-card');if(!b)return;const a=b.dataset.a;
 if(b.classList.contains('td-card')){if(!st||st.over)return;const c=st.deck.find(c=>c.id===b.dataset.id);unitPanel(null);
  if(c.on){setCam(c.on.x-VW/2);unitPanel(c.on);return;}const why=c.cd>0||st.cost<c.h.cost;
  if(why){nope(b);if(st.cost<c.h.cost)nope('.td-cost');return;}mvU=null;sel=sel===c.id?null:c.id;if(sel){
   /* 光の届く一番前の場所が画面の外なら、そこへ寄る */
   const fx=Math.min(...st.Ps.map((P,i)=>TDS.at(P,TDS.frontier(st,i)).x));if(fx<cam||fx>cam+VW)setCam(fx-VW/3);}return;}
 if(a==='spd'){speed=speed===1?2:1;b.textContent='×'+speed;b.classList.toggle('on',speed===2);}
 else if(a==='pause'){paused=!paused;b.classList.toggle('on',paused);b.textContent=paused?'▶':'Ⅱ';if(paused)banner('Ⅱ','',99999);else $('.td-banner').classList.remove('show');}
 else if(a==='call')TDS.callWave(st);
 else if(a==='lamp'){if(!st||st.over)return;const why=TDS.lampUp(st);if(why){nope(b);if(/灯力/.test(why))nope('.td-cost');}}
 else if(a==='ult'){if(selU&&TDS.ult(st,selU.uid))unitPanel(null);}
 else if(a==='ret'){if(selU){TDS.retreat(st,selU.uid);unitPanel(null);}}
 else if(a==='mv'){if(selU){mvU=selU;sel=null;unitPanel(null);}}
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
 st=TDS.create(sid,dk,{lv:lvMap(),real:rl,seed:(Date.now()%100000)+1});speed=1;paused=false;sel=null;selU=null;mvU=null;nm=[];nums=[];TDFX.reset();ended=false;acc=0;for(const k in memo)delete memo[k];
 root.classList.remove('hide');sheet(null);unitPanel(null);$('.td-deck').innerHTML=deckHTML();const sb=$('[data-a="spd"]');sb.textContent='×1';sb.classList.remove('on');
 const sn=$('[data-a="snd"]');sn.innerHTML=TDSFX.icon();sn.classList.toggle('off',!TDSFX.on);const pb=$('[data-a="pause"]');pb.textContent='Ⅱ';pb.classList.remove('on');
 requestAnimationFrame(()=>{fit();setCam(st.S.W);last=performance.now();raf=requestAnimationFrame(loop);banner(st.S.name,'',1600);try{GUIDE.start(sid);}catch(e){console.error(e);}
  });}
function show(){build();root.classList.remove('hide');}
function hide(){stop();if(root)root.classList.add('hide');}
return{open,show,hide,sheet:h=>{build();sheet(h);},root:()=>(build(),root),get st(){return st;},get cam(){return cam;},setCam:x=>{if(st)setCam(x);}};})();
