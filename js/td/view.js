/* ===== TD の画面（TD）：戦場の描画・上下の帯・手札・操作・リザルト・ステージ選び。ロジックは js/td/sim.js（TDS） =====
 入口：TD.menu()（ステージ選び）・TD.open(stageId)・index.html#td・ホーム左の「防衛」。本編の startBattle 系には触れない。
 描画：論理座標 360×520 の戦場を画面の幅に合わせて拡大。原画は SPX.unitCv（RPG 版と同じ絵）。灯域の外は暗く沈める。
 見せ方の決まり（TD デモの README）：ゲームを止めない・短い・読める（数字は同時に 24 まで、揺れは 3px まで） */
'use strict';
const TD=(()=>{
const K=TDD.K,FW=K.FW,FH=K.FH;
const ELC={'斬':'#e8e8f0','打':'#d9a066','突':'#b0e0ff','熱':'#ff7a3c','冷':'#7fd8ff','雷':'#ffe14a','陽':'#fff1a8','陰':'#b07aff'};
let root=null,cv=null,g=null,st=null,S=1,DPR=1,raf=0,last=0,acc=0,speed=1,paused=false,sel=null,selU=null,fx=[],nums=[],shake=0,bg=null,lt=null,sid=null,ended=false;
const $=q=>root.querySelector(q);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ---------- 原画 ---------- */
const SC=new Map();
function spr(key,fk,side){const k=key+'|'+side;if(SC.has(k))return SC.get(k);let f=null;try{f=SPX.unitCv(key,fk,side,side?32:42);}catch(e){console.error(e);}SC.set(k,f);return f;}
const IMG={};
function face(id){if(IMG[id])return IMG[id];const f=spr(id,id,0);if(!f)return'';const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return IMG[id]=c.toDataURL();}
/* ---------- 画面を作る ---------- */
function build(){if(root)return;root=document.createElement('div');root.id='td';root.className='hide';
 root.innerHTML=`<div class="td-top"><div class="td-wave"><small>WAVE</small><b class="wv">-</b></div><div class="td-life"><span>灯火</span></div>
 <button class="td-btn" data-a="spd" aria-label="速度">×1</button><button class="td-btn" data-a="pause" aria-label="一時停止">Ⅱ</button><button class="td-btn" data-a="menu" aria-label="やめる">≡</button></div>
 <div class="td-field"><canvas></canvas><button class="td-call" data-a="call" hidden></button><div class="td-banner"></div><div class="td-unit" hidden></div><div class="td-tip"></div>
 <div class="td-sheet" hidden><div class="td-panel"></div></div></div>
 <div class="td-bar"><div class="td-costw"><div class="td-cost"><small>灯力</small><b>0</b></div><i class="cb"></i></div><div class="td-star"><span>星片</span><div class="g"><i></i></div><span class="sn">0/10</span></div></div>
 <div class="td-deck"></div>`;
 document.body.appendChild(root);cv=root.querySelector('canvas');g=cv.getContext('2d');
 root.addEventListener('click',onClick);cv.addEventListener('pointerdown',onTap);addEventListener('resize',()=>{if(st)fit();});}
function fit(){const f=$('.td-field'),w=f.clientWidth,h=f.clientHeight;S=Math.max(.5,Math.min(w/FW,h/FH));DPR=Math.max(1,Math.min(3,devicePixelRatio||1));
 cv.style.width=Math.round(FW*S)+'px';cv.style.height=Math.round(FH*S)+'px';cv.width=Math.round(FW*S*DPR);cv.height=Math.round(FH*S*DPR);bg=null;}
/* ---------- 背景（1 回だけ描く）：夜の石畳・道・台座・灯 ---------- */
function drawBg(){const c=document.createElement('canvas');c.width=FW*2;c.height=FH*2;const b=c.getContext('2d');b.scale(2,2);const R=TDS.at;
 b.fillStyle='#14152e';b.fillRect(0,0,FW,FH);
 let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
 for(let y=0;y<FH;y+=6)for(let x=(y/6%2)*6;x<FW;x+=12){const v=rnd();if(v<.5)continue;b.fillStyle=v>.9?'#22244a':'#1a1b3a';b.fillRect(x,y,11,5);}
 for(let i=0;i<60;i++){b.fillStyle=rnd()>.5?'#2b2d55':'#1f2044';b.fillRect(Math.floor(rnd()*FW),Math.floor(rnd()*FH),2,2);}
 const P=st.S.path;b.lineCap='square';b.lineJoin='miter';
 for(const[w,col]of[[30,'#0b0b1e'],[26,'#3a3346'],[18,'#443c52']]){b.strokeStyle=col;b.lineWidth=w;b.beginPath();P.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y));b.stroke();}
 for(let s=0;s<st.P.L;s+=9){const a=R(st.P,s),o=(Math.floor(s/9)%2?4:-4);b.fillStyle='#4f465f';b.fillRect(Math.round(a.x+(a.dir?0:o))-2,Math.round(a.y+(a.dir?o:0))-1,4,2);}
 /* 入口の霧 */
 const gr=b.createLinearGradient(0,0,70,0);gr.addColorStop(0,'rgba(80,60,110,.7)');gr.addColorStop(1,'rgba(80,60,110,0)');b.fillStyle=gr;b.fillRect(0,40,70,48);
 for(const p of st.pads){if(p.k==='f'){b.fillStyle='#2a2440';b.fillRect(p.x-11,p.y-11,22,22);b.strokeStyle='#6b5d88';b.lineWidth=1;b.strokeRect(p.x-10.5,p.y-10.5,21,21);}
  else{b.fillStyle='#0b0b1e';b.fillRect(p.x-13,p.y-7,26,16);b.fillStyle='#2f3360';b.fillRect(p.x-12,p.y-8,24,13);b.fillStyle='#454a85';b.fillRect(p.x-12,p.y-8,24,2);b.fillStyle='#8a6a2a';b.fillRect(p.x-12,p.y+4,24,1);}}
 /* 灯（拠点）：石の台と真鍮の灯籠 */
 const[x,y]=st.S.base;b.fillStyle='#0b0b1e';b.fillRect(x-22,y-6,44,14);b.fillStyle='#3a3d6a';b.fillRect(x-20,y-8,40,12);b.fillStyle='#575b96';b.fillRect(x-20,y-8,40,2);
 b.fillStyle='#6a4a18';b.fillRect(x-8,y-34,16,26);b.fillStyle='#c08a2c';b.fillRect(x-7,y-33,14,2);b.fillRect(x-7,y-12,14,2);b.fillStyle='#2a1a08';b.fillRect(x-10,y-38,20,4);
 bg=c;}
/* ---------- 光（灯域）：暗さの層に光の円を抜く ---------- */
function drawLight(t){if(!lt){lt=document.createElement('canvas');lt.width=FW;lt.height=FH;}const l=lt.getContext('2d');l.globalCompositeOperation='source-over';l.clearRect(0,0,FW,FH);
 l.fillStyle='rgba(20,14,40,.7)';l.fillRect(0,0,FW,FH);l.globalCompositeOperation='destination-out';
 const hole=(x,y,r)=>{const gr=l.createRadialGradient(x,y,r*.82,x,y,r);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=gr;l.beginPath();l.arc(x,y,r,0,7);l.fill();};
 const[bx,by]=st.S.base;hole(bx,by,st.lightR+(Math.sin(t*2)*2));for(const u of st.units)if(u.h.lt&&u.lit)hole(u.x,u.y,u.h.lt);
 g.drawImage(lt,0,0);
 /* 光の縁（灯域の境目）と、光の中の台座の印 */
 g.strokeStyle='rgba(242,179,71,.55)';g.lineWidth=1;g.setLineDash([4,4]);g.lineDashOffset=-t*6;g.beginPath();g.arc(bx,by,st.lightR,0,7);g.stroke();
 for(const u of st.units)if(u.h.lt&&u.lit){g.beginPath();g.arc(u.x,u.y,u.h.lt,0,7);g.stroke();}g.setLineDash([]);
 for(const p of st.pads)if(p.lit&&!p.unit){g.fillStyle='rgba(242,179,71,.8)';g.fillRect(p.x-1,p.y+(p.k==='f'?7:4),2,2);}
 g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(bx,by-20,4,bx,by-20,70);gr.addColorStop(0,'rgba(242,179,71,.55)');gr.addColorStop(1,'rgba(242,179,71,0)');g.fillStyle=gr;g.fillRect(bx-70,by-90,140,140);g.globalCompositeOperation='source-over';
 g.fillStyle='#ffe2a0';g.fillRect(bx-5,by-30,10,16);g.fillStyle='#fff8e0';g.fillRect(bx-2,by-26,4,8);}
/* ---------- 毎コマ ---------- */
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000||0);last=now;
 if(!paused&&!st.over){acc+=dt*speed;let n=0;while(acc>=K.STEP&&n<10){TDS.tick(st);acc-=K.STEP;n++;}}else if(st.over)TDS.tick(st);
 take();draw(now/1000,dt);hud();
 if(st.over&&!ended){ended=true;setTimeout(result,1100);}}
/* 出来事 → 演出 */
function take(){for(const e of st.ev){
 if(e.k==='hit'){const far=e.u.h.rng>60;if(far&&!e.sk)fx.push({t:0,d:.16,k:'shot',x0:e.u.x,y0:e.u.y-14,x1:e.f.x,y1:e.f.y-10,c:ELC[e.el]||'#fff'});
  else if(!far)fx.push({t:0,d:.14,k:'slash',x:e.f.x,y:e.f.y-12,c:ELC[e.el]||'#fff',dir:e.u.face});
  if(nums.length<24)nums.push({t:0,x:e.f.x+(Math.random()*8-4),y:e.f.y-26,v:e.v,c:e.weak?'#f2b347':e.res?'#8f89a8':'#efeaf8',big:e.cr||e.big,weak:e.weak});}
 else if(e.k==='kill'){fx.push({t:0,d:.35,k:'puff',x:e.f.x,y:e.f.y-10,boss:e.f.boss});if(e.f.boss)shake=3;}
 else if(e.k==='area')fx.push({t:0,d:e.slow?.5:e.small?.18:.35,k:'ring',x:e.x,y:e.y,r:e.r,c:e.slow?'#b07aff':ELC[e.u.h.el]||'#fff'});
 else if(e.k==='heal'){if(nums.length<24)nums.push({t:0,x:e.u.x,y:e.u.y-30,v:'+'+e.v,c:'#9fe8b8'});}
 else if(e.k==='hurt'){e.u.hitT=st.t;}
 else if(e.k==='cast')fx.push({t:0,d:.5,k:'name',x:e.u.x,y:e.u.y-44,s:e.sk.n});
 else if(e.k==='ult'){fx.push({t:0,d:.7,k:'ult',x:e.x,y:e.y,r:e.r,c:ELC[e.u.h.el]||'#fff'});banner(e.u.h.ult.n,e.u.h.name+'の星臨',900);shake=3;}
 else if(e.k==='leak'){fx.push({t:0,d:.5,k:'leak'});shake=3;}
 else if(e.k==='wave')banner('WAVE '+e.n,e.boss?'強い気配が近づいてくる':'虚蝕が来る',1200);
 else if(e.k==='clear')banner('WAVE '+e.n+' 突破','',900);
 else if(e.k==='fall'){fx.push({t:0,d:.4,k:'puff',x:e.u.x,y:e.u.y-14});if(selU===e.u)unitPanel(null);}
 else if(e.k==='summon')fx.push({t:0,d:.4,k:'ring',x:e.f.x,y:e.f.y,r:30,c:'#b07aff'});}
 st.ev.length=0;}
function draw(t,dt){if(!bg)drawBg();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,cv.width,cv.height);
 const k=S*DPR,sx=shake?(Math.random()*2-1)*shake:0,sy=shake?(Math.random()*2-1)*shake:0;shake=Math.max(0,shake-dt*12);
 g.setTransform(k,0,0,k,sx*k,sy*k);g.drawImage(bg,0,0,FW,FH);
 /* 遅延の陣 */
 for(const z of st.fields){g.strokeStyle='rgba(176,122,255,.7)';g.lineWidth=1;g.setLineDash([3,3]);g.beginPath();g.arc(z.x,z.y,z.r,0,7);g.stroke();g.setLineDash([]);
  g.fillStyle='rgba(176,122,255,.12)';g.beginPath();g.arc(z.x,z.y,z.r,0,7);g.fill();const a=-Math.PI/2+(t*2%6.283);g.strokeStyle='#e9d8ff';g.beginPath();g.moveTo(z.x,z.y);g.lineTo(z.x+Math.cos(a)*z.r*.6,z.y+Math.sin(a)*z.r*.6);g.stroke();}
 drawLight(t);
 /* 台座の案内（手札を選んでいるとき） */
 if(sel){const c=st.deck.find(c=>c.id===sel);for(const p of st.pads){if(p.k!==c.h.pad)continue;const ok=!p.unit&&p.lit;g.strokeStyle=ok?'#f2b347':'rgba(111,104,136,.8)';g.lineWidth=ok?2:1;
  const w=p.k==='f'?24:28,h=p.k==='f'?24:18;g.strokeRect(p.x-w/2,p.y-h/2+(p.k==='f'?0:-1),w,h);if(ok){g.globalAlpha=.18+.12*Math.sin(t*6);g.fillStyle='#f2b347';g.fillRect(p.x-w/2,p.y-h/2,w,h);g.globalAlpha=1;
   g.strokeStyle='rgba(242,179,71,.25)';g.beginPath();g.arc(p.x,p.y,c.h.rng,0,7);g.stroke();}}}
 if(selU&&st.units.includes(selU)){g.strokeStyle='rgba(242,179,71,.6)';g.lineWidth=1;g.beginPath();g.arc(selU.x,selU.y,selU.h.rng,0,7);g.stroke();}
 /* キャラ（奥から） */
 const L=[...st.foes.map(f=>({y:f.y,f})),...st.units.map(u=>({y:u.y,u}))].sort((a,b)=>a.y-b.y);
 for(const o of L)o.f?drawFoe(o.f,t):drawUnit(o.u,t);
 /* 演出 */
 fx=fx.filter(e=>(e.t+=dt)<e.d);for(const e of fx)drawFx(e,e.t/e.d);
 nums=nums.filter(n=>(n.t+=dt)<.7);g.textAlign='center';for(const n of nums){const p=n.t/.7;g.globalAlpha=p<.75?1:1-(p-.75)*4;g.font=`800 ${n.big?13:10}px "M PLUS 1p",sans-serif`;
  const y=n.y-Math.min(1,p*4)*8;g.lineWidth=3;g.strokeStyle='#07071a';g.strokeText(n.v,n.x,y);g.fillStyle=n.c;g.fillText(n.v,n.x,y);if(n.weak){g.font='800 8px "M PLUS 1p",sans-serif';g.strokeText('弱点',n.x,y-10);g.fillText('弱点',n.x,y-10);}}
 g.globalAlpha=1;}
function sprite(f,x,y,mir,hgt,flash,alpha){if(!f)return;const sc=Math.min(1,hgt/f.h),w=f.w*sc,h=f.h*sc;g.save();g.imageSmoothingEnabled=sc<.8;g.globalAlpha=alpha??1;
 g.translate(Math.round(x),Math.round(y));if(mir)g.scale(-1,1);if(flash&&'filter'in g)g.filter='brightness(2.4)';g.drawImage(f.cv,-f.ax*sc,-f.ay*sc,w,h);g.restore();}
function bar(x,y,w,r,col){g.fillStyle='#07071a';g.fillRect(x-w/2-1,y-1,w+2,4);g.fillStyle='#3b3f72';g.fillRect(x-w/2,y,w,2);g.fillStyle=col;g.fillRect(x-w/2,y,Math.max(0,w*r),2);}
function drawFoe(f,t){const fl=st.t-f.hitT<.08,mov=!f.by&&f.stun<=0,bob=mov?-Math.abs(Math.sin(t*9+f.uid))*1.5:0;
 const lunge=f.actT&&st.t-f.actT<.15?f.dir*2:0,F=spr(f.spr,f.kind,1);
 g.fillStyle='rgba(7,7,26,.45)';g.fillRect(f.x-9,f.y-2,18,3);
 sprite(F,f.x+lunge,f.y+bob,f.dir<0,f.boss?50:28,fl);
 if(f.hp<f.mhp)bar(f.x,f.y-(f.boss?54:33),f.boss?36:20,f.hp/f.mhp,f.boss?'#ff8a6a':'#e86a6a');
 if(f.stun>0){g.fillStyle='#ffe14a';for(let i=0;i<3;i++){const a=t*6+i*2.1;g.fillRect(f.x+Math.cos(a)*8-1,f.y-34+Math.sin(a)*2,2,2);}}
 if(f.tr.includes('void')){g.fillStyle='rgba(176,122,255,.5)';g.fillRect(f.x-1+Math.sin(t*3+f.uid)*6,f.y-6-((t*14+f.uid*5)%14),2,2);}
 if(f.curse>0){g.fillStyle='#b07aff';g.fillRect(f.x-6,f.y-40,3,3);g.fillRect(f.x+3,f.y-40,3,3);}}
function drawUnit(u,t){const fl=st.t-(u.hitT||-9)<.08,lg=st.t-u.actT<.12?u.face*3:0,F=spr(u.id,u.id,0),c=st.deck.find(c=>c.on===u);
 g.fillStyle=TDD.ROLE[u.h.role].col;g.globalAlpha=.85;g.fillRect(u.x-9,u.y+1,18,2);g.globalAlpha=1;
 sprite(F,u.x+lg,u.y,u.face>0,42,fl,u.lit?1:.55);
 if(!u.lit){g.fillStyle='rgba(111,104,136,.9)';g.font='700 8px "M PLUS 1p",sans-serif';g.textAlign='center';g.fillText('光の外',u.x,u.y+11);}
 if(u.hp<u.h.hp)bar(u.x,u.y-48,20,u.hp/u.h.hp,'#9fe8b8');
 const r=Math.min(1,u.ch/u.h.sk.ch);g.strokeStyle=r>=1?'#f2b347':'rgba(242,179,71,.45)';g.lineWidth=1.5;g.beginPath();g.arc(u.x+13,u.y-44,3.5,-Math.PI/2,-Math.PI/2+r*6.283);g.stroke();
 if(st.star>=K.STAR_MAX&&c&&!c.ult){g.fillStyle='#fff0b8';g.globalAlpha=.6+.4*Math.sin(t*8);g.fillRect(u.x-14,u.y-46,3,3);g.globalAlpha=1;}}
function drawFx(e,p){g.globalAlpha=1-p;
 if(e.k==='shot'){const x=e.x0+(e.x1-e.x0)*p,y=e.y0+(e.y1-e.y0)*p;g.globalAlpha=1;g.fillStyle=e.c;g.fillRect(x-1.5,y-1.5,3,3);g.fillStyle='#fff';g.fillRect(x-.5,y-.5,1,1);}
 else if(e.k==='slash'){g.strokeStyle=e.c;g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,9,(e.dir>0?-1.2:1.9)+p,(e.dir>0?0.6:3.6)+p);g.stroke();}
 else if(e.k==='ring'){g.strokeStyle=e.c;g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,e.r*(.4+.6*p),0,7);g.stroke();}
 else if(e.k==='puff'){g.fillStyle=e.boss?'#f2b347':'#b07aff';for(let i=0;i<8;i++){const a=i*.785,d=4+p*(e.boss?26:14);g.fillRect(e.x+Math.cos(a)*d-1,e.y+Math.sin(a)*d*.6-1,2,2);}}
 else if(e.k==='name'){g.globalAlpha=p<.8?1:(1-p)*5;g.font='700 9px "Kaisei Tokumin",serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#07071a';g.strokeText(e.s,e.x,e.y-p*4);g.fillStyle='#fff0b8';g.fillText(e.s,e.x,e.y-p*4);}
 else if(e.k==='ult'){const r=e.r>500?FW:e.r;g.fillStyle=e.c;g.globalAlpha=(1-p)*.35;g.beginPath();g.arc(e.x,e.y,r*(.3+.7*p),0,7);g.fill();g.globalAlpha=1-p;g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,r*(.3+.7*p),0,7);g.stroke();}
 else if(e.k==='leak'){g.fillStyle='rgba(255,138,106,.35)';g.fillRect(0,FH-90,FW,90);}
 g.globalAlpha=1;}
/* ---------- 帯（変わったところだけ書き換える） ---------- */
const memo={};const set=(k,el,v,f)=>{if(memo[k]===v)return;memo[k]=v;f(el,v);};
function hud(){set('wv',$('.wv'),(st.wave+1)+'/'+st.S.waves.length,(e,v)=>e.textContent=v);
 set('lv',$('.td-life'),st.lives,(e,v)=>{e.innerHTML='<span>灯火</span>'+Array.from({length:K.LIVES},(_,i)=>`<i class="${i<v?'':'off'}"></i>`).join('');});
 set('co',$('.td-cost b'),st.cost,(e,v)=>e.textContent=v);$('.cb').style.width=Math.round(st.costAcc/K.COST_EVERY*84)+'px';
 const sr=Math.min(K.STAR_MAX,st.star);set('sr',$('.td-star'),st.star,(e,v)=>{e.querySelector('.g i').style.width=(sr/K.STAR_MAX*100)+'%';e.querySelector('.sn').textContent=Math.min(v,K.STAR_MAX)+'/'+K.STAR_MAX+(v>=K.STAR_MAX?' 星臨できる':'');e.classList.toggle('full',v>=K.STAR_MAX);});
 const call=$('.td-call'),gap=st.phase==='gap'&&!st.over;set('call',call,gap?Math.ceil(st.gapT)+'|'+st.wave:'',(e,v)=>{e.hidden=!v;if(v)e.innerHTML=st.wave<0?`開始<small>あと ${Math.ceil(st.gapT)} 秒</small>`:`次の WAVE を呼ぶ<small>灯力 +${Math.ceil(st.gapT)}</small>`;});
 for(const c of st.deck){const el=root.querySelector(`.td-card[data-id="${c.id}"]`);if(!el)continue;const st8=`${c.on?1:0}${c.cd>0?Math.ceil(c.cd):0}${st.cost>=c.h.cost?1:0}${sel===c.id?1:0}`;
  set('c'+c.id,el,st8,(e)=>{e.classList.toggle('on',!!c.on);e.classList.toggle('poor',st.cost<c.h.cost);e.classList.toggle('sel',sel===c.id);const d=e.querySelector('.cd');
   if(c.cd>0){d.hidden=false;d.textContent=Math.ceil(c.cd);}else d.hidden=true;});
  if(c.cd>0){const full=c.h.redeploy*1.5;el.querySelector('.cd').style.setProperty('--p',Math.round(c.cd/full*100)+'%');}}
 if(selU)unitPanelPos();}
function deckHTML(){return st.deck.map(c=>`<button class="td-card" data-id="${c.id}" aria-label="${esc(c.h.name)} コスト${c.h.cost}"><img src="${face(c.id)}" alt=""><span class="c">${c.h.cost}</span>
 <span class="r" style="background:${TDD.ROLE[c.h.role].col}"></span><span class="n">${esc(c.h.name)}・${TDD.ROLE[c.h.role].n}</span><span class="cd" hidden></span></button>`).join('');}
let bT=0;function banner(a,b,ms){const e=$('.td-banner');e.innerHTML=`${esc(a)}${b?`<small>${esc(b)}</small>`:''}`;e.classList.add('show');clearTimeout(bT);bT=setTimeout(()=>e.classList.remove('show'),ms);}
let tT=0;function tip(s){const e=$('.td-tip');e.textContent=s;e.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>e.classList.remove('show'),1400);}
/* ---------- ユニットの窓 ---------- */
function unitPanel(u){selU=u;const p=$('.td-unit');if(!u){p.hidden=true;return;}const h=u.h,c=st.deck.find(c=>c.on===u),can=TDS.canUlt(st,u.uid);
 p.innerHTML=`<h4>${esc(h.name)}<em>${TDD.ROLE[h.role].n}・Lv${h.lv}</em></h4><p>技「${esc(h.sk.n)}」${h.lt?'・周りを照らす':''}${u.lit?'':'<br>光の外：攻撃 −40%'}</p>
 <div class="row"><button class="td-btn ult${can?' on':''}" data-a="ult" ${can?'':'disabled'}>${esc(h.ult.n)}</button><button class="td-btn" data-a="ret">撤退 +${Math.floor(h.cost/2)}</button></div>`;
 p.hidden=false;unitPanelPos();if(c&&c.ult)p.querySelector('.ult').textContent='星臨済み';}
function unitPanelPos(){const p=$('.td-unit'),f=$('.td-field'),r=cv.getBoundingClientRect(),fr=f.getBoundingClientRect();
 let x=r.left-fr.left+selU.x*S-p.offsetWidth/2,y=r.top-fr.top+selU.y*S+8;if(y+p.offsetHeight>fr.height-4)y=r.top-fr.top+selU.y*S-50-p.offsetHeight;
 x=Math.max(4,Math.min(fr.width-p.offsetWidth-4,x));p.style.left=x+'px';p.style.top=Math.max(4,y)+'px';}
/* ---------- 操作 ---------- */
function onTap(ev){if(!st||st.over)return;const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)/S,y=(ev.clientY-r.top)/S;
 const u=st.units.find(u=>Math.abs(u.x-x)<16&&y>u.y-46&&y<u.y+10);
 if(sel){const c=st.deck.find(c=>c.id===sel);let best=null,bd=26;for(const p of st.pads){if(p.k!==c.h.pad)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p;}}
  if(best){const why=TDS.deploy(st,sel,best.id);if(why)tip(why);else{sel=null;}return;}
  if(!u){sel=null;return;}}
 if(u){sel=null;unitPanel(u===selU?null:u);return;}unitPanel(null);}
function onClick(ev){const b=ev.target.closest('[data-a],.td-card');if(!b)return;const a=b.dataset.a;
 if(b.classList.contains('td-card')){if(!st||st.over)return;const c=st.deck.find(c=>c.id===b.dataset.id);unitPanel(null);
  if(c.on){unitPanel(c.on);return;}const why=c.cd>0?'再配置まで '+Math.ceil(c.cd)+' 秒':st.cost<c.h.cost?'灯力が足りない（'+c.h.cost+' 必要）':'';
  if(why){tip(why);return;}sel=sel===c.id?null:c.id;if(sel)tip(c.h.pad==='f'?'光っている道の上の台座をタップ':'光っている段の間の台座をタップ');return;}
 if(a==='spd'){speed=speed===1?2:1;b.textContent='×'+speed;b.classList.toggle('on',speed===2);}
 else if(a==='pause'){paused=!paused;b.classList.toggle('on',paused);b.textContent=paused?'▶':'Ⅱ';if(paused)banner('一時停止','配置・撤退・星臨はできる',99999);else $('.td-banner').classList.remove('show');}
 else if(a==='call')TDS.callWave(st);
 else if(a==='ult'){if(selU&&TDS.ult(st,selU.uid))unitPanel(null);}
 else if(a==='ret'){if(selU){TDS.retreat(st,selU.uid);unitPanel(null);}}
 else if(a==='menu'){paused=true;sheet(`<h3>防衛をやめる</h3><div class="sub">ここまでの報酬は得られない</div><div class="td-acts"><button class="td-btn" data-a="resume">続ける</button><button class="td-btn" data-a="quit">やめる</button></div>`);}
 else if(a==='resume'){sheet(null);paused=false;}
 else if(a==='quit'){close();}
 else if(a==='again'){open(sid);}
 else if(a==='next'){const i=TDD.ORDER.indexOf(sid);open(TDD.ORDER[i+1]||sid);}
 else if(a==='stage')open(b.dataset.v);
 else if(a==='home')close();}
function sheet(html){const s=$('.td-sheet');if(!html){s.hidden=true;return;}s.querySelector('.td-panel').innerHTML=html;s.hidden=false;}
/* ---------- 結果：星 3 つ・報酬（経験値はストックへ、ゴールド） ---------- */
function result(){const o=st.over,S0=st.S,win=o.win,n=o.stars.reduce((a,b)=>a+b,0);
 let xp=0,gold=0,first=false;try{if(win&&typeof G!=='undefined'&&G){G.td=G.td||{c:{}};const prev=G.td.c[sid]||0;first=!prev;G.td.c[sid]=Math.max(prev,n);
  xp=Math.round(30*S0.lv*(1+n*.25)*(first?2:1));gold=Math.round(40*S0.lv*(first?3:1));G.xpStock=(G.xpStock||0)+xp;G.gold=(G.gold||0)+gold;try{save();}catch(e){}}}catch(e){console.error(e);}
 const goals=[['灯を守りきる',o.stars[0]],['灯火を 1 つも減らさない',o.stars[1]],[`${S0.star.time} 秒以内に守りきる`,o.stars[2]]];
 const nx=TDD.ORDER[TDD.ORDER.indexOf(sid)+1];
 sheet(`<h3>${win?'防衛成功':'灯が消えた'}</h3><div class="sub">${esc(S0.ch)}・${esc(S0.name)}　${o.t} 秒</div>
 <div class="td-stars">${o.stars.map(s=>`<i class="${s?'on':''}"></i>`).join('')}</div><ul class="td-goal">${goals.map(([t,s])=>`<li class="${s?'on':''}">${t}</li>`).join('')}</ul>
 ${win?`<div class="td-rw"><span>経験値 <b>${xp}</b></span><span>ゴールド <b>${gold}</b></span>${first?'<span>初回 ×2</span>':''}</div>`:''}
 <div class="td-acts"><button class="td-btn" data-a="again">もう一度</button>${win&&nx?`<button class="td-btn on" data-a="next">次へ</button>`:`<button class="td-btn" data-a="home">灯都へ</button>`}${win&&nx?'<button class="td-btn wide" data-a="home">灯都へ戻る</button>':''}</div>`);}
/* ---------- 開く・閉じる ---------- */
function lvMap(){const o={};try{for(const id in G.h)o[id]=G.h[id].lv||1;}catch(e){}return o;}
function open(id){build();sid=id||TDD.ORDER[0];cancelAnimationFrame(raf);
 st=TDS.create(sid,TDD.deckOf(),{lv:lvMap(),seed:(Date.now()%100000)+1});speed=1;paused=false;sel=null;selU=null;fx=[];nums=[];ended=false;acc=0;bg=null;for(const k in memo)delete memo[k];
 root.classList.remove('hide');sheet(null);unitPanel(null);$('.td-deck').innerHTML=deckHTML();const sb=$('[data-a="spd"]');sb.textContent='×1';sb.classList.remove('on');
 const pb=$('[data-a="pause"]');pb.textContent='Ⅱ';pb.classList.remove('on');
 requestAnimationFrame(()=>{fit();last=performance.now();raf=requestAnimationFrame(loop);banner(st.S.name,st.S.ch+'・灯を守れ',1600);});}
function close(){cancelAnimationFrame(raf);st=null;if(root)root.classList.add('hide');try{townMenu();}catch(e){}}
function menu(){build();root.classList.remove('hide');cancelAnimationFrame(raf);$('.td-deck').innerHTML='';
 const c=(typeof G!=='undefined'&&G&&G.td&&G.td.c)||{};
 sheet(`<h3>灯守の防衛線</h3><div class="sub">試作版・序章</div><div class="td-st">${TDD.ORDER.map(id=>{const s=TDD.STAGE[id],n=c[id]||0;
  return`<button data-a="stage" data-v="${id}"><span><b>${esc(s.name)}</b><small>${esc(s.ch)}・推奨Lv${s.lv}・${s.waves.length} WAVE</small></span><span class="ss">${[0,1,2].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span></button>`;}).join('')}</div>
 <div class="td-acts"><button class="td-btn wide" data-a="home">灯都へ戻る</button></div>`);}
/* ---------- 入口：ホーム右の縦メニュー（鑑定の下）に「防衛」・index.html#td ---------- */
{const _tm=townMenu;townMenu=function(){const r=_tm.apply(this,arguments);try{const R=document.querySelector('#labels .h22right');
 if(R&&!R.querySelector('.td-entry')){const b=document.createElement('button');b.className='td-entry';b.dataset.td='1';b.innerHTML='<span class="td-ic">灯</span><small>防衛</small>';
  b.addEventListener('click',e=>{e.stopPropagation();menu();});R.appendChild(b);}}catch(e){console.error(e);}return r;};}
function boot(){if(location.hash!=='#td')return;const go=()=>{if(typeof SPX==='undefined'||!SPX.ready)return setTimeout(go,300);
 try{if(typeof G==='undefined'||!G){const s=loadSave();G=migrate(s||newGame());}const ov=document.querySelector('#ov');if(ov)ov.classList.add('hide');townMenu();}catch(e){console.error(e);}menu();};go();}
addEventListener('load',boot);
return{open,close,menu,get st(){return st;}};})();
