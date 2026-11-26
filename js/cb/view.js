/* ===== コマンド戦闘の画面（CB。ver0.60 で TD の戦闘画面 js/td/view.js を置き換えた正本）：2D-HD の舞台・カメラ・行動の振り付け =====
 ロジックは js/cb/engine.js（CBE）、操作盤（コマンド・仲間の札）は js/cb/hud.js（CBH）。
 絵：背景は TDBG（空・遠景・中景・地面）を被写界深度でぼかして重ね、キャラとエフェクトは「等倍の下地（OC）」に描いてから、カメラの寄り・パン・揺れで画面へ拡大して写す
  （ドットの大きさが寄りで飛ばない）。光の筋・漂う粒・周辺減光・数字は画面の解像度で上に重ねる。
 キャラの絵と演出は TD のものをそのまま使う：セレスのコマ送り TDA・セレスの演出 FXC/FXU・技ごとの演出 TDFX（出来事 e を TDFX.ev へ）・効果音 TDSFX。
 振り付け（行動 1 つ）：カメラが行動する者へ寄る → 技名の札 → 近接は敵の前へ駆ける → 構え（アニメの当たるコマ）→ 当たる（数字・揺れ・寄りの弾み）→ 戻る。
 進行はジェネレーター（yield 秒）で書き、毎コマ st.t（×1/×2）で進める。 */
'use strict';
const CB=(()=>{
const VW=300,W=420,X0=(W-VW)/2,FOOT=380;/* 見せる幅（論理 px）・背景の幅・左端・足元の帯の下端 */
/* 並び：2 列×2 段。段の差 92px（いちばん背の高いセレス 86 より大きい）・列の差 56px（体の幅より大きい）でキャラが重ならない。
 敵は左右対称。前列どうしの間は約 104px。ボスは左の列の中ほど、取り巻きは前の列の上下 */
const HS=[[258,276],[262,368],[314,276],[318,368]],FS=HS.map(([x,y])=>[W-x,y]),BOSS=[108,326],BADD=[[180,264],[182,370]];
const HG={hero:74};
/* 敵の背丈：味方と同じ目盛り。人型は味方と同じ 74、獣・魔物は 64。中ボス（sc 2）は 1.3 倍、ボス（sc 3）は 1.5 倍まで */
function foeHg(f){let hum=false;try{const r=SPX.parse(f.spr),c=r&&SPX.D[r.id];hum=!!c&&c.kind==='hum';}catch(e){}const e=ED[f.kind]||{},base=hum?74:64;
 return Math.round(base*(f.boss?((e.sc||3)>=3&&e.rank!=='mid'?1.5:1.3):1));}
let root=null,cv=null,g=null,OC=null,O=null,DPR=1,S=1,CW=0,CHh=0,Y0=0,raf=0,last=0,speed=1,b=null,st=null,sid=null,bg=null,blur=null,gen=null,wake=0,phase='idle',sel=null,tgt=null,ended=false,ord=[],acting=null,aim=[],foeT=-9;
let cam={x:0,y:0,z:1,tx:0,ty:0,tz:1,kick:0,shake:0};const nums=[],tx=[],motes=[];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ELC={'斬':'#e8e8f0','打':'#d9a066','突':'#b0e0ff','熱':'#ff7a3c','冷':'#7fd8ff','雷':'#ffe14a','陽':'#fff1a8','陰':'#b07aff'};
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>1-Math.pow(1-cl(t,0,1),3);
/* ---------- 絵 ---------- */
const SC=new Map();
function spr(key,fk,side,h){h=h||(side?64:64);const k=key+'|'+side+'|'+h;if(SC.has(k))return SC.get(k);let f=null;try{f=SPX.unitCv(key,fk,side,h);}catch(e){console.error(e);}SC.set(k,f);return f;}
function sprite(f,x,y,mir,hgt,flash,alpha,o){if(!f)return;const sc=Math.min(1.25,hgt/f.h),w=f.w*sc,h=f.h*sc;g.save();g.imageSmoothingEnabled=false;g.globalAlpha=alpha??1;
 g.translate(Math.round(x),Math.round(y));if(o){g.rotate(o.rot||0);g.scale(o.sx||1,o.sy||1);}if(mir)g.scale(-1,1);if(flash&&'filter'in g)g.filter='brightness(2.4)';g.drawImage(f.cv,-f.ax*sc,-f.ay*sc,w,h);
 if(o&&o.tint)FXK.tintDraw(g,f,-f.ax*sc,-f.ay*sc,w,h,o.tint,o.ta);g.restore();}
/* 背景：TDBG の層を作り、遠景と中景は縮めて戻した「ぼかし」と霞をかける（被写界深度） */
function soft(src,k,haze){const w=Math.max(1,Math.round(src.width*k)),h=Math.max(1,Math.round(src.height*k)),a=document.createElement('canvas');a.width=w;a.height=h;const x=a.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(src,0,0,w,h);
 const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const y=c.getContext('2d');y.imageSmoothingEnabled=true;y.drawImage(a,0,0,c.width,c.height);
 if(haze){y.globalCompositeOperation='source-atop';y.fillStyle=haze;y.fillRect(0,0,c.width,c.height);}return c;}
function makeBg(){const th=b.S.th||'ash',fst={S:{W,th}};bg=TDBG.make(fst,VW);const P=bg.P;
 blur={far:soft(bg.far,.34,hexA(P.sky[2],.35)),mid:soft(bg.mid,.55,hexA(P.sky[1],.18)),fg:soft(fore(P),.25)};}
/* 手前の層（草・岩の影。強くぼかして画面の下の両端に置く＝手前にピントが合っていない HD-2D の奥行き） */
function fore(P){const c=document.createElement('canvas');c.width=W;c.height=140;const x=c.getContext('2d'),R=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(P.prop.length*131+7);x.fillStyle=P.prop;
 for(const[x0,x1]of[[0,120],[300,W]]){for(let i=0;i<34;i++){const px=x0+R()*(x1-x0),h=30+R()*80,w=3+R()*6;x.beginPath();x.moveTo(px,140);x.quadraticCurveTo(px+w*2*(R()-.5),140-h*.6,px+(R()-.5)*20,140-h);x.lineTo(px+w,140);x.fill();}
  for(let i=0;i<4;i++){const px=x0+R()*(x1-x0);x.beginPath();x.ellipse(px,140,18+R()*26,14+R()*24,0,Math.PI,0);x.fill();}}
 return c;}
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return`rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;};
/* ---------- 画面を作る ---------- */
function build(){if(root)return;root=document.createElement('div');root.id='cb';root.className='hide';
 root.innerHTML=`<canvas class="cb-cv"></canvas><div class="cb-plate"></div><div class="cb-banner"></div><div class="cb-top"></div><div class="cb-ui"></div><div class="cb-sheet" hidden><div class="cb-panel td-panel"></div></div>`;
 document.body.appendChild(root);cv=root.querySelector('canvas');g=cv.getContext('2d');OC=document.createElement('canvas');O=OC.getContext('2d');
 cv.addEventListener('pointerup',tap);addEventListener('resize',()=>{if(st)fit();});
 TDFX.bind({spr:(k,f,s)=>spr(k,f,s,s?64:64),cam:()=>X0,vw:()=>VW});}
function fit(){const r=root.getBoundingClientRect();DPR=Math.max(1,Math.min(3,devicePixelRatio||1));const ui=root.querySelector('.cb-ui'),uh=ui?ui.getBoundingClientRect().height:r.height*.4;
 /* キャンバスは下の盤より上だけ（寄りで盤の裏にキャラが隠れない） */CW=r.width;CHh=Math.max(200,r.height-uh+2);S=CW/VW;
 cv.width=Math.round(CW*DPR);cv.height=Math.round(CHh*DPR);cv.style.width=CW+'px';cv.style.height=CHh+'px';OC.width=cv.width;OC.height=cv.height;
 Y0=FOOT+12-CHh/S;
 home();cam.x=cam.tx;cam.y=cam.ty;}
/* 既定のカメラ（寄りなし） */
const C0=()=>({x:X0+VW/2,y:Y0+CHh/S/2});
function home(){const c=C0();cam.tx=c.x;cam.ty=c.y;cam.tz=1;}
function focus(x,y,z){const c=C0(),zz=Math.max(1,z);cam.tz=zz;cam.tx=c.x+(x-c.x)*.85;cam.ty=c.y+(y-c.y)*.6;}
/* 寄ったときに下地の外を写さない */
function clampCam(){const z=cam.z+cam.kick*.08,vh=CHh/S,hw=VW/(2*z),hh=vh/(2*z);cam.x=cl(cam.x,X0+hw,X0+VW-hw);cam.y=cl(cam.y,Y0+hh,Y0+vh-hh);}
/* 世界 → 画面（css px） */
const SX=x=>(x-cam.x)*S*cam.z+CW/2,SY=y=>(y-cam.y)*S*cam.z+CHh/2;
/* ---------- 並び ---------- */
function place(){b.heroes.forEach((u,i)=>{const[x,y]=HS[i]||HS[0];u.hx=x;u.hy=y;if(u.x==null){u.x=x+120;u.y=y;}u.face=-1;});
 const L=b.foes,boss=L.find(f=>f.boss);let k=0;
 for(const f of L){let p;if(boss){p=f===boss?BOSS:BADD[k++%2];}else p=FS[L.indexOf(f)]||FS[0];f.hx=p[0];f.hy=p[1];f.hg=foeHg(f);if(f.x==null){f.x=p[0]-150-Math.random()*30;f.y=p[1];f.enter=1;}f.dir=1;f.face=1;f.dhp=f.dhp??f.hp;f.hitT=f.hitT??-9;f.stun=0;f.by=f.enter?null:{};}}
/* ---------- 毎コマ ---------- */
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000||0);last=now;if(!st)return;
 const sdt=dt*speed;st.t+=sdt;runQ();if(phase==='input'&&!gen&&CBH.auto())start();
 if(gen&&st.t>=wake){let n=0;while(gen&&st.t>=wake&&n++<20){let r;try{r=gen.next();}catch(e){console.error(e);gen=null;recover();break;}if(r.done){gen=null;break;}wake=st.t+(r.value||0);}}
 walk(sdt);cam.x+=(cam.tx-cam.x)*Math.min(1,sdt*5);cam.y+=(cam.ty-cam.y)*Math.min(1,sdt*5);cam.z+=(cam.tz-cam.z)*Math.min(1,sdt*4.5);
 cam.kick=Math.max(0,cam.kick-sdt*1.2);clampCam();cam.shake=Math.max(0,cam.shake-sdt*14);
 try{draw(now/1000,sdt);}catch(e){if(!loop.e){loop.e=1;console.error(e);}try{g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';}catch(x){}}try{CBH.tick();}catch(e){}}
/* 進行が例外で止まったとき：表示の HP を合わせ、勝敗が決まっていれば結果へ、そうでなければ次のターンの入力へ（画面が固まらない） */
function recover(){try{for(const u of[...b.heroes,...b.foes]){u.dhp=u.hp;u.mvTo=null;if(u.hx!=null&&u.hp>0){u.x=u.hx;u.y=u.hy;}if(u.side===1&&u.hp<=0)u.gone=1;}home();const s=CBE.state(b);gen=s?outcome(s):(function*(){CBE.turnEnd(b);yield*begin();})();wake=st.t;}catch(e){console.error(e);phase='input';CBH.draw();}}
/* 歩く・駆ける（x を目標へ）。入場は歩きのアニメ */
function walk(dt){for(const u of[...b.heroes,...b.foes]){const T=u.mvTo;if(!T){continue;}const dx=T.x-u.x,dy=T.y-u.y,d=Math.hypot(dx,dy),v=T.v*dt;
  if(d<=v){u.x=T.x;u.y=T.y;u.mvTo=null;u.mv=0;if(u.side===1)u.by={};if(T.face!=null)u.face=T.face;}else{u.x+=dx/d*v;u.y+=dy/d*v;u.mv=1;if(u.side===1){u.by=null;u.dir=dx>=0?1:-1;}else u.face=dx>0?1:-1;}}}
function move(u,x,y,v,face){u.mvTo={x,y,v,face};}
/* ---------- 描く ---------- */
function draw(t,dt){TDFX.step(dt);const k=S*DPR;
 /* 1) 下地（OC）：地面・影・後ろの演出・キャラ・前の演出。等倍のカメラ */
 O.setTransform(1,0,0,1,0,0);O.clearRect(0,0,OC.width,OC.height);O.imageSmoothingEnabled=false;
 const ox=-X0*k,oy=-Y0*k;g=O;g.setTransform(k,0,0,k,ox,oy);g.drawImage(bg.ground,0,0);stage(t);
 TDFX.back(g);TDFX.dim(g);
 const L=[...b.foes.filter(f=>f.dhp>0||f.x!=null&&!f.gone).map(f=>({y:f.y,f})),...b.heroes.map(u=>({y:u.y,u}))].sort((a,c)=>a.y-c.y);
 for(const o of L)if(o.f)shadow(o.f.x,o.f.y,o.f.boss?30:16);else if(o.u.hp>0||o.u.dhp>0)shadow(o.u.x,o.u.y,15);
 TDA.drawGhosts(g,st);for(const o of L)o.f?drawFoe(o.f,t):drawHero(o.u,t);
 marks(t);TDFX.front(g);
 /* 2) 画面：空・遠景（ぼかし）・中景（少しぼかし）を視差つきで → 下地を寄りで写す */
 g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=true;g.clearRect(0,0,cv.width,cv.height);
 const sh=Math.max(cam.shake,TDFX.shk()*1.5),sx=sh?(Math.random()*2-1)*sh:0,sy=sh?(Math.random()*2-1)*sh:0,z=cam.z+cam.kick*.08,c0=C0();
 const lay=(img,p,x0)=>{const zp=1+(z-1)*p,cx=c0.x+(cam.x-c0.x)*p,cy=c0.y+(cam.y-c0.y)*p,kk=S*zp*DPR;g.setTransform(kk,0,0,kk,(CW/2+sx*p)*DPR-cx*kk,(CHh/2+sy*p)*DPR-cy*kk);g.drawImage(img,x0,0);};
 g.fillStyle=bg.P.sky[0];g.fillRect(0,0,cv.width,cv.height);lay(bg.sky,.08,X0-20);lay(blur.far,.3,X0-20);lay(blur.mid,.6,X0-20);
 g.setTransform(1,0,0,1,0,0);const sw=CW/z*DPR,shh=CHh/z*DPR,cxp=((cam.x-X0)*S)*DPR-sw/2,cyp=((cam.y-Y0)*S)*DPR-shh/2;
 g.imageSmoothingEnabled=z>1.02;g.drawImage(OC,cxp-sx*DPR/z,cyp-sy*DPR/z,sw,shh,0,0,cv.width,cv.height);
 {const zp=1+(z-1)*1.4,cx=c0.x+(cam.x-c0.x)*1.4,cy=c0.y+(cam.y-c0.y)*1.4,kk=S*zp*DPR;g.globalAlpha=.92;g.setTransform(kk,0,0,kk,(CW/2+sx*1.4)*DPR-cx*kk,(CHh/2+sy*1.4)*DPR-cy*kk);g.drawImage(blur.fg,0,FOOT-104);g.globalAlpha=1;}
 /* 3) 光：光の筋・漂う粒・周辺減光・下の帯（操作盤の後ろ） */
 g.setTransform(DPR,0,0,DPR,0,0);light(t,dt);texts(dt);}
function stage(t){/* 舞台の光だまり：両陣の間を明るく、外は暗く（HD-2D の照明） */
 const gr=g.createRadialGradient(210,318,10,210,318,170);gr.addColorStop(0,'rgba(255,236,200,.16)');gr.addColorStop(.6,'rgba(255,220,170,.05)');gr.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=gr;g.fillRect(0,180,W,240);const fg=g.createLinearGradient(0,190,0,240);fg.addColorStop(0,hexA(bg.P.sky[2],.55));fg.addColorStop(1,hexA(bg.P.sky[2],0));g.fillStyle=fg;g.fillRect(0,190,W,50);
 if(tgt&&tgt.dhp>0&&phase==='input'){const p=.5+.5*Math.sin(t*6),r=(tgt.boss?30:17);g.strokeStyle=`rgba(255,226,160,${.55+.35*p})`;g.lineWidth=1.5;g.beginPath();g.ellipse(tgt.x,tgt.y+1,r+p*2,(r+p*2)*.32,0,0,7);g.stroke();
  g.fillStyle='#ffe2a0';const yy=tgt.y-tgt.hg-10-p*3;g.beginPath();g.moveTo(tgt.x-5,yy);g.lineTo(tgt.x+5,yy);g.lineTo(tgt.x,yy+6);g.fill();}}
function shadow(x,y,r){g.fillStyle='rgba(7,7,26,.45)';g.beginPath();g.ellipse(x,y+1,r,r*.26,0,0,7);g.fill();}
function drawFoe(f,t){if(f.gone)return;const o=TDFX.pose(f,t,st),F=spr(f.spr,f.kind,1,f.hg),fl=st.t-f.hitT<.08;
 sprite(F,f.x+o.dx,f.y+o.dy,f.dir<0,f.hg,o.fl||fl,o.a*(f.fade==null?1:f.fade),o);
 if(f.dhp<f.mhp&&f.dhp>0){const w=f.boss?54:30,x=Math.round(f.x-w/2),y=Math.round(f.y+5),r=f.dhp/f.mhp;g.fillStyle='#07071a';g.fillRect(x-1,y-1,w+2,4);g.fillStyle='#3b3f72';g.fillRect(x,y,w,2);g.fillStyle=f.boss?'#ff8a6a':'#e86a6a';g.fillRect(x,y,Math.max(1,Math.round(w*r)),2);}
 if(f.charging||f.chargeN){const p=.5+.5*Math.sin(t*10);g.strokeStyle=`rgba(255,106,74,${.4+.5*p})`;g.lineWidth=2;g.beginPath();g.ellipse(f.x,f.y-f.hg*.5,f.hg*.55+p*3,f.hg*.6+p*3,0,0,7);g.stroke();}
 if(f.sts.stun){g.fillStyle='#ffe14a';for(let i=0;i<3;i++){const a=t*6+i*2.1;g.fillRect(f.x+Math.cos(a)*8-1,f.y-f.hg-4+Math.sin(a)*2,2,2);}}}
function drawHero(u,t){if(u.dhp<=0){if(u.hp>0)return;const k=st.t-(u.downT||-9);if(TDA.has(u.id)||k>.7)return;sprite(spr(u.id,u.id,0,80),u.x,u.y,u.face>0,HG.hero,0,1-k/.7,{rot:(u.face>0?1:-1)*-1.2*Math.min(1,k/.25),sx:1,sy:1});return;}const fc=u.face||-1,fl=st.t-(u.hitT||-9)<.08,x=u.x+(u.kb||0),aw=u.awOn>0;
 if(aw){const k2=.75+.25*Math.sin(t*7),gr=g.createRadialGradient(x,u.y-30,3,x,u.y-30,40);gr.addColorStop(0,`rgba(255,226,160,${.45*k2})`);gr.addColorStop(1,'rgba(242,179,71,0)');g.fillStyle=gr;g.fillRect(x-40,u.y-70,80,80);}
 u.awT=aw?999:0;const sel0=sel===u&&phase==='input';
 if(sel0){g.strokeStyle='#ffe2a0';g.lineWidth=1.5;g.beginPath();g.ellipse(x,u.y+1,17,4.5,0,0,7);g.stroke();}
 if(!TDA.draw(g,u,x,u.y,fl,1,st)){const lg=st.t-(u.actT||-9)<.14?fc*4:0,bob=u.mv?-Math.abs(Math.sin(t*11+u.uid))*2.5:Math.sin(t*2+u.uid)*.6;sprite(spr(u.id,u.id,0,80),x+lg,u.y+bob,fc>0,HG.hero,fl,1);}}
function marks(t){const p=.5+.5*Math.sin(t*8);
 if(acting&&acting.hp>0&&!acting.gone){const u=acting,foe=u.side===1,h=foe?u.hg:HG.hero,y=u.y-h-12-p*3,c=foe?'#ff5a4a':'#ffd27a';
  g.fillStyle='#07071a';g.beginPath();g.moveTo(u.x-7,y-1);g.lineTo(u.x+7,y-1);g.lineTo(u.x,y+8);g.fill();g.fillStyle=c;g.beginPath();g.moveTo(u.x-5,y);g.lineTo(u.x+5,y);g.lineTo(u.x,y+6);g.fill();
  g.strokeStyle=foe?`rgba(255,90,74,${.5+.4*p})`:`rgba(255,210,122,${.45+.4*p})`;g.lineWidth=1.5;const r=u.boss?30:17;g.beginPath();g.ellipse(u.x,u.y+1,r,r*.3,0,0,7);g.stroke();}
 const k=Math.min(1,(st.t-foeT)/.25);for(const u of aim){if(u.dhp<=0)continue;const x=u.x,y=u.y-HG.hero*.5,r=24-10*k;g.strokeStyle=`rgba(255,74,58,${.55+.4*p})`;g.lineWidth=1.5;
  g.beginPath();g.arc(x,y,r,0,7);g.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+.785;g.beginPath();g.moveTo(x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5));g.lineTo(x+Math.cos(a)*(r+5),y+Math.sin(a)*(r+5));g.stroke();}
  g.fillStyle=`rgba(255,74,58,${.10+.08*p})`;g.beginPath();g.ellipse(x,u.y+1,18,5,0,0,7);g.fill();}}
/* 光の筋（左上から）・漂う光の粒・周辺減光 */
function light(t,dt){const P=bg.P;g.globalCompositeOperation='lighter';
 for(let i=0;i<3;i++){const x0=CW*(.12+i*.26)+Math.sin(t*.25+i*2)*18,w=40+i*16,a=.045+.02*Math.sin(t*.6+i);const gr=g.createLinearGradient(x0,0,x0-CHh*.35,CHh*.7);gr.addColorStop(0,`rgba(255,240,210,${a})`);gr.addColorStop(1,'rgba(255,240,210,0)');
  g.fillStyle=gr;g.beginPath();g.moveTo(x0,0);g.lineTo(x0+w,0);g.lineTo(x0+w-CHh*.35,CHh*.7);g.lineTo(x0-CHh*.35-w*.4,CHh*.7);g.fill();}
 while(motes.length<26)motes.push({x:Math.random()*CW,y:Math.random()*CHh*.7,v:4+Math.random()*8,s:Math.random()*1.6+.6,p:Math.random()*7});
 for(const m of motes){m.y-=m.v*dt;m.x+=Math.sin(t+m.p)*dt*6;if(m.y<-4){m.y=CHh*.72;m.x=Math.random()*CW;}const a=.25+.25*Math.sin(t*2+m.p);g.fillStyle=`rgba(255,236,190,${a})`;g.fillRect(m.x,m.y,m.s,m.s);}
 g.globalCompositeOperation='source-over';
 const vg=g.createRadialGradient(CW/2,CHh*.36,CHh*.2,CW/2,CHh*.36,CHh*.75);vg.addColorStop(0,'rgba(5,5,16,0)');vg.addColorStop(1,'rgba(5,5,16,.55)');g.fillStyle=vg;g.fillRect(0,0,CW,CHh);
 if(acting&&acting.side===1){const a=.22+.08*Math.sin(t*9),rg=g.createRadialGradient(CW/2,CHh*.4,CHh*.3,CW/2,CHh*.4,CHh*.8);rg.addColorStop(0,'rgba(200,30,30,0)');rg.addColorStop(1,`rgba(200,30,30,${a})`);g.fillStyle=rg;g.fillRect(0,0,CW,CHh);}}
/* 数字・状態の字（画面の px） */
function num(t,v,o={}){nums.push(Object.assign({x:t.x+(Math.random()*8-4),y:t.y-(t.side===1?t.hg:HG.hero)-4,t:-(o.dl||0),v},o));if(nums.length>40)nums.shift();}
function say(t,s,c,dl){tx.push({x:t.x,y:t.y-(t.side===1?t.hg:HG.hero)-18,t:-(dl||0),s,c:c||'#fff0b8'});}
function texts(dt){g.textAlign='center';g.lineJoin='round';
 for(let i=nums.length-1;i>=0;i--){const n=nums[i];n.t+=dt;if(n.t>1){nums.splice(i,1);continue;}if(n.t<0)continue;const p=n.t,pop=p<.08?1.5-p/.08*.5:1,sz=(n.big?26:n.cr?22:n.heal?16:18)*pop;
  const x=SX(n.x),y=SY(n.y)-Math.min(1,p*4)*16;g.globalAlpha=p<.75?1:1-(p-.75)/.25;g.font=`italic 800 ${sz.toFixed(1)}px "Barlow Semi Condensed","M PLUS 1p",sans-serif`;
  const s=n.miss?'MISS':(n.heal?'+':'')+n.v;g.lineWidth=n.big?6:4;g.strokeStyle='#07071a';g.strokeText(s,x,y);g.fillStyle=n.miss?'#a9a5c4':n.heal?'#9fe8b8':n.weak?'#ffc95a':n.res?'#a9a5c4':n.cr?'#ff9a7a':n.foe?'#ff8a8a':'#ffffff';g.fillText(s,x,y);
  if(n.weak&&!n.miss){const w=g.measureText(s).width;g.font='900 11px "Kaisei Tokumin",serif';g.fillStyle='#07071a';g.fillRect(x+w/2+2,y-sz*.78,15,15);g.fillStyle='#f2b347';g.fillRect(x+w/2+3,y-sz*.78+1,13,13);g.fillStyle='#07071a';g.fillText('弱',x+w/2+9.5,y-sz*.78+12);}
  if(n.cr&&!n.miss){g.font='italic 800 11px "Barlow Semi Condensed",sans-serif';g.fillStyle='#ffe2a0';g.fillText('CRITICAL',x,y-sz*.9);}}
 for(let i=tx.length-1;i>=0;i--){const n=tx[i];n.t+=dt;if(n.t>1.1){tx.splice(i,1);continue;}if(n.t<0)continue;const x=SX(n.x),y=SY(n.y)-n.t*10;g.globalAlpha=n.t<.85?1:1-(n.t-.85)/.25;
  g.font='800 12px "M PLUS 1p",sans-serif';g.lineWidth=3;g.strokeStyle='#07071a';g.strokeText(n.s,x,y);g.fillStyle=n.c;g.fillText(n.s,x,y);}
 g.globalAlpha=1;g.lineJoin='miter';}
/* ---------- 札・帯 ---------- */
let pT=0;function plate(s,o={}){const e=root.querySelector('.cb-plate');e.className='cb-plate'+(o.ou?' ou':'')+(o.foe?' foe':'');e.innerHTML=`${o.who?`<small>${esc(o.who)}</small>`:''}${o.el?`<i style="--c:${ELC[o.el]||'#fff'}">${esc(o.el)}</i>`:''}<b>${esc(s)}</b>`;void e.offsetWidth;e.classList.add('show');clearTimeout(pT);pT=setTimeout(()=>e.classList.remove('show'),(o.ms||1000)/speed);}
let bT=0;function banner(a,ms=1200,cls=''){const e=root.querySelector('.cb-banner');e.className='cb-banner '+cls;e.innerHTML=a;void e.offsetWidth;e.classList.add('show');clearTimeout(bT);bT=setTimeout(()=>e.classList.remove('show'),ms/speed);}
/* ---------- 行動の振り付け（ジェネレーター：yield 秒） ---------- */
const keyOf=sk=>sk._k||(()=>{try{return RSC.keyOf(sk);}catch(e){return null;}})();
function tdSk(u,sk){const k=keyOf(sk);return(u.h&&u.h.sks&&u.h.sks.find(x=>x.id===k))||(u.h&&u.h.sk)||{k:'strike',id:k};}
function ev(e){try{TDSFX.ev(e);}catch(x){}try{TDFX.ev(e,st);}catch(x){console.error(x);}return e;}
/* 当たりの出し方：コマ送りのある仲間（セレス）と奥義は TD と同じく「構えの始まり」に出来事を出し、演出が着弾の時刻（e._dl）を返す。
 1 枚絵の仲間は構え（0.1〜0.3 秒）のあとに出す */
function* heroAct(r){const u=r.u,sk=r.sk,main=r.tg[0],ou=!!sk.ougi,sup=CBE.isSup(sk)&&!ou,basic=!!sk.basic,toFoe=main&&main.side===1,anim=TDA.has(u.id);
 const melee=!sup&&!ou&&toFoe&&u.h&&u.h.rng<=60&&sk.k!=='mag'&&!sk.fu&&!anim;
 if(ou)home();else focus(toFoe?(u.x+main.x)/2+20:u.x,u.y-30,1.32);
 if(!basic&&!sk.fu&&!ou)plate(sk.n,{el:sk.el,who:u.name});else if(sk.fu)say(u,sk.n,'#ffe2a0');
 if(ou){banner(`<b>${esc(sk.n)}</b>`,1400,'ou');yield .3;}else yield .18;
 if(melee){move(u,main.x+(main.boss?40:26),main.y+1,520,-1);yield .2;}
 const ts=basic?null:tdSk(u,sk),fTo=toFoe?main:CBE.F(b)[0]||main;
 if(ou){u.actK='ult';u.actT=st.t;ev({k:'ult',u,r:999,x:fTo?fTo.x:120,y:fTo?fTo.y:310});cam.shake=3;}
 else if(basic){u.actK='atk';u.actT=st.t;}
 else{u.actK='cast';u.actT=st.t;u.cs=ts;u._skDl=null;ev({k:'cast',u,sk:ts,f:fTo});}
 const now=anim||ou;if(!now)yield basic?(melee?.08:.22):.3;
 if(toFoe&&!ou)focus((u.x+main.x)/2,main.y-26,1.22);
 const G=new Map();for(const h of r.hits){const k=h.hi||0;if(!G.has(k))G.set(k,[]);G.get(k).push(h);}
 let maxDl=0;for(const[i,L]of[...G.entries()].sort((a,c)=>a[0]-c[0])){for(const h of L){const t=h.t;
   if(h.heal!=null){const dl=now?.4:0;later(dl,()=>{ev({k:'heal',u:t,v:h.heal});t.dhp=t.hp;if(h.rev)ev({k:'deploy',u:t});});num(t,h.heal,{heal:1,dl});continue;}
   if(h.miss){num(t,0,{miss:1,dl:now?.35+i*.1:0});continue;}
   if(t.side===1){const el=sk.el||u.basic.el;t.kn=t.kn||{};if(el)t.kn[el]=h.weak?'w':h.res?'r':(t.kn[el]||'n');}const e=ev({k:'hit',u,f:t,v:h.v,cr:h.cr,weak:h.weak,res:h.res,sk:basic?null:ts,big:ou||h.big?1:0}),dl=(e._dl||(now?.3:0))+(now?i*.1:0);maxDl=Math.max(maxDl,dl);
   num(t,h.v,{cr:h.cr,weak:h.weak,res:h.res,big:ou,dl});later(dl,()=>{t.hitT=st.t;t.dhp=Math.max(0,t.dhp-h.v);if(h.cr||ou||h.weak)cam.kick=1;});
   if(h.kill)later(dl+.06,()=>{t.dhp=0;if(!t.gone){ev({k:'kill',f:t});t.gone=1;}});}
  if(!now)yield .11;}
 for(const s of r.tx)say(s.t,s.s,s.t.side===1?'#c9b8ff':'#fff0b8',maxDl);
 yield Math.max(.34,maxDl+.28);
 if(melee){move(u,u.hx,u.hy,460,-1);yield .2;}
 for(const f of r.fu)yield*play(f);}
function* foeAct(r){const f=r.u,sk=r.sk,main=r.tg[0];if(!main)return;const melee=sk.k!=='mag'&&r.tg.length===1;
 aim=r.tg.filter(t=>t.side===0);CB_aim(aim.length===1?aim[0]:null);foeT=st.t;if(r.tg.length>1)home();else focus((f.x+main.x)/2,main.y-30,1.22);plate(sk.n&&sk.n!=='攻撃'?sk.n:f.name,{el:sk.el,foe:1,ms:1000,who:sk.n&&sk.n!=='攻撃'?f.name:''});try{TDSFX.play('charge');}catch(e){}
 yield .42;if(melee){move(f,main.x-(f.boss?48:28),main.y+1,480);yield .22;}else{f.hitT=st.t;yield .3;}
 const c=ELC[sk.el]||'#e86a6a';
 for(const h of r.hits){const t=h.t;if(h.heal!=null){num(t,h.heal,{heal:1});t.dhp=t.hp;continue;}if(h.miss){num(t,0,{miss:1});continue;}
  slash(t,c,melee);num(t,h.v,{foe:1,cr:h.cr});t.hitT=st.t;t.dhp=Math.max(0,t.dhp-h.v);cam.shake=Math.max(cam.shake,r.tg.length>1?3:1.6);
  try{TDSFX.play(sk.k==='mag'?'spell':'slash');}catch(e){}
  if(h.kill){later(.15,()=>{TDA.fall(t,st);t.downT=st.t;try{TDSFX.play('fall');}catch(e){}});}
  if(r.tg.length>1)yield .06;}
 for(const t of r.tg)t.dhp=t.hp;for(const s of r.tx)say(s.t,s.s,'#ff9a9a');
 aim=[];CB_aim(null);yield .45;if(melee){move(f,f.hx,f.hy,420);yield .15;}
 for(const x of r.fu)yield*play(x);}
/* 敵の攻撃が仲間に当たる：属性の色の三日月の斬撃＋白い芯＋火花（FXK の部品） */
function slash(t,c,melee){const x=t.x,y=t.y-30,d=1;
 FXK.fx({d:.28,draw(gg,p){const e=FXK.eo(Math.min(1,p/.5));gg.globalCompositeOperation='lighter';gg.globalAlpha=1-p;gg.strokeStyle=c;gg.lineWidth=3*(1-p)+1;gg.beginPath();gg.arc(x,y,16+e*6,-2.4+e*.4,.3+e*.9);gg.stroke();
  gg.strokeStyle='#fff';gg.lineWidth=1;gg.beginPath();gg.arc(x,y,16+e*6,-1.6+e*.4,-.2+e*.9);gg.stroke();if(p<.3)FXK.bloom(gg,x,y,10*(1-p/.3)+3,'#fff',.8,.3);}});
 FXK.sparks(x,y,melee?7:5,c,{sp:90,d:.3});}
function later(dl,fn){Q.push({t:st.t+dl,fn});}
const Q=[];function runQ(){for(let i=Q.length-1;i>=0;i--)if(st.t>=Q[i].t){const q=Q[i];Q.splice(i,1);try{q.fn();}catch(e){console.error(e);}}}
function* play(r){if(!r)return;const u=r.u;
 if(r.skip){if(r.charge){focus(u.x,u.y-40,1.25);plate('力を溜めている',{foe:1,ms:900});try{TDSFX.play('charge');}catch(e){}yield .9;}else{say(u,r.skip,'#c9b8ff');yield .5;}return;}
 if(u.side===0)yield*heroAct(r);else yield*foeAct(r);
 if(r.summon){const f=r.summon;place();try{TDSFX.play('summon');}catch(e){}yield .5;}
 home();}
/* 1 ターンの流れ */
function* turn(){phase='run';ord=CBE.order(b);acting=null;CBH.draw();yield .15;
 for(const u of ord){if(u.hp<=0)continue;acting=u;CBH.acting(u);const r=CBE.act(b,u);yield*play(r);acting=null;aim=[];CB_aim(null);CBH.draw();const s=CBE.state(b);if(s){yield*outcome(s);return;}}
 ord=[];CBH.acting(null);home();const R=CBE.turnEnd(b);for(const x of R){if(x.heal){num(x.t,x.heal,{heal:1});x.t.dhp=x.t.hp;}else{num(x.t,x.v,{foe:x.t.side===0});x.t.dhp=x.t.hp;if(x.kill){if(x.t.side===1){ev({k:'kill',f:x.t});x.t.gone=1;}else TDA.fall(x.t,st);}}}
 if(R.length)yield .5;{const s=CBE.state(b);if(s){yield*outcome(s);return;}}
 for(const u of b.heroes)if(u.awEnd){u.awEnd=0;say(u,'星臨が解けた','#c9b8ff');}
 yield*begin();}
function* begin(){CBE.turnStart(b);for(const u of b.heroes)u.dhp=u.hp;phase='input';sel=CBE.H(b)[0]||null;if(!tgt||tgt.hp<=0)tgt=CBE.F(b)[0]||null;CBH.draw();
 }
function* go(){if(CBH.auto()===2)for(const u of CBE.H(b))if(CBE.canAw(u)&&CBE.awaken(b,u)){u.cmd=null;yield*awSeq(u,.75);}CBE.auto(b);yield*turn();}
function* awSeq(u,k=1){phase='aw';CBH.draw();focus(u.x,u.y-34,1.45);u.actK='aw';u.actT=st.t;u.awT=999;ev({k:'aw',u});plate('星臨',{ou:1,ms:1300*k});cam.shake=2;yield((TDA.dur(u.id,'aw_in')||1.1)+.1)*k;home();}
function* outcome(s){home();
 if(s==='next'){yield .6;nums.length=0;tx.length=0;banner(`<small>WAVE</small><b>${b.wave+2}</b>`,1200);CBE.nextWave(b);for(const f of b.foes)f.dhp=f.hp;for(const u of b.heroes){u.dhp=u.hp;if(u.rev){u.rev=0;u.rv=1;}}place();
  for(const f of b.foes){move(f,f.hx,f.hy,170);}try{TDSFX.play('wave');}catch(e){}yield 1.1;tgt=CBE.F(b)[0]||null;yield*begin();return;}
 phase='over';const win=s==='win';b.over={win,stars:CBE.stars(b,win)};st.over=b.over;CBH.draw();
 if(win){banner('<b>勝利</b>',1600,'win');try{TDSFX.play('win');}catch(e){}for(const u of CBE.H(b)){u.actK='atk';u.actT=st.t;}focus(300,290,1.18);}else{banner('<b>敗北</b>',1600,'lose');try{TDSFX.play('lose');}catch(e){}}
 yield 1.7;result();}
/* ---------- 操作（CBH から） ---------- */
function start(){if(phase!=='input'||gen)return;phase='run';gen=go();wake=st.t;}
function awaken(u){if(phase!=='input'||gen||!CBE.canAw(u))return false;const r=CBE.awaken(b,u);if(!r)return false;
 gen=(function*(){yield*awSeq(u);phase='input';CBH.draw();})();wake=st.t;return true;}
function tap(ev0){if(!st||phase!=='input')return;const r=cv.getBoundingClientRect(),x=(ev0.clientX-r.left-CW/2)/(S*cam.z)+cam.x,y=(ev0.clientY-r.top-CHh/2)/(S*cam.z)+cam.y;
 let best=null,bd=1e9;for(const f of CBE.F(b)){const dx=x-f.x,dy=y-(f.y-f.hg/2),d=Math.abs(dx)/(f.boss?40:24)+Math.abs(dy)/(f.hg*.7);if(d<bd){bd=d;best=f;}}
 if(best&&bd<1.6){tgt=best;try{TDSFX.play('deploy');}catch(e){}CBH.draw();}}
/* ---------- 結果 ---------- */
function result(){const o=b.over,S0=b.S;o.wave=b.wave;let R={rw:{xp:0,gold:0},first:false,chips:''};try{R=TDM.settle(sid,{over:o});}catch(e){console.error(e);}if(R.sheet)return sheet(R.sheet);
 const goals=[['勝利',o.stars[0]],['誰も倒れない',o.stars[1]],[`${b.par} ターン以内`,o.stars[2]]];
 sheet(`<h3>${o.win?'勝利':'敗北'}</h3><div class="sub">${esc(TDM.chOf(sid).ch)}・${esc(S0.name)}</div>
 <div class="td-stars">${o.stars.map(s=>`<i class="${s?'on':''}"></i>`).join('')}</div><ul class="td-goal">${goals.map(([t,s])=>`<li class="${s?'on':''}">${esc(t)}</li>`).join('')}</ul>
 ${o.win?`<div class="td-rw"><span>経験値 <b>${R.rw.xp}</b></span><span>ゴールド <b>${R.rw.gold}</b></span>${R.first?'<span>初回</span>':''}${R.chips||''}</div>`:''}
 <div class="td-acts"><button class="td-btn" data-a="again">もう一度</button>${o.win?`<button class="td-btn on" data-a="next">次へ</button>`:`<button class="td-btn" data-a="map">戻る</button>`}</div>`);
 try{TDM.cleared(sid,o.win,R.first);}catch(e){}}
function sheet(html){const s=root.querySelector('.cb-sheet');if(!html){s.hidden=true;return;}s.querySelector('.cb-panel').innerHTML=html;s.hidden=false;
 s.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;const k=a.dataset.a;if(k==='again')open(sid,party0);else if(k==='next')TDM.after(sid,true);else if(k==='map')TDM.after(sid,false);else if(k==='resume')sheet(null);else if(k==='flee'){hide();TDM.map();}};}
/* ---------- 開く・閉じる ---------- */
let party0=[];
function open(id,party){build();sid=id;party0=party.slice(0,4);cancelAnimationFrame(raf);
 b=CBE.create(id,party0,{});st={t:0,units:b.heroes,foes:b.foes,ev:[],S:{th:b.S.th}};Object.defineProperty(st,'foes',{get:()=>b.foes});Object.defineProperty(st,'units',{get:()=>b.heroes.filter(u=>u.hp>0)});
 for(const u of b.heroes){u.dhp=u.hp;u.x=null;u.actT=-9;u.hitT=-9;}
 TDA.clear();TDFX.reset();Q.length=0;nums.length=0;tx.length=0;gen=null;phase='idle';speed=CBH.speed();ended=false;sel=null;tgt=null;
 root.classList.remove('hide');sheet(null);makeBg();CBH.open(root.querySelector('.cb-ui'),root.querySelector('.cb-top'));
 requestAnimationFrame(()=>{fit();place();for(const u of b.heroes)move(u,u.hx,u.hy,150,-1);for(const f of b.foes)move(f,f.hx,f.hy,150);
  last=performance.now();raf=requestAnimationFrame(loop);banner(`<small>${esc(TDM.chOf(id).ch)}</small><b>${esc(b.S.name)}</b>`,1500,'st');
  gen=(function*(){yield 1.2;yield*begin();})();wake=0;});}
function hide(){cancelAnimationFrame(raf);st=null;b=null;gen=null;if(root)root.classList.add('hide');}
function CB_aim(u){if(aimU===u)return;aimU=u;try{CBH.draw();}catch(e){}}let aimU=null;
/* 敵の情報（TARGET を押す）：名前・Lv・HP・分かった弱点と耐性 */
function info(f){const E=['斬','打','突','熱','冷','雷','陽','陰'],kn=f.kn||{};sheet(`<h3>${esc(f.name)} <small>Lv${f.lv}</small></h3><div class="cb-info"><div class="hpl"><b>${Math.max(0,Math.round(f.hp))}</b>/${f.mhp}</div>
 <div class="els">${E.map((e,i)=>`<span class="${kn[e]||'unk'}"><i class="elh e${i}"><b>${e}</b></i></span>`).join('')}</div></div><div class="td-acts"><button class="td-btn on" data-a="resume">閉じる</button></div>`);}
return{open,hide,start,awaken,sheet,banner,focus,info,get ord(){return ord;},get acting(){return acting;},get aim(){return aimU;},
 picF:f=>{const F=spr(f.spr,f.kind,1,48);if(!F)return'';const c=document.createElement('canvas');c.width=F.w;c.height=F.h;c.getContext('2d').drawImage(F.cv,0,0);return c.toDataURL();},
 get st(){return st;},get b(){return b;},get phase(){return phase;},get sel(){return sel;},set sel(u){sel=u;},get tgt(){return tgt;},set tgt(f){tgt=f;},
 setSpeed(v){speed=v;},tickQ:()=>runQ(),spr,pic:(id,side,h)=>{const f=spr(id,id,side,h||48);if(!f)return'';const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return c.toDataURL();}};})();
