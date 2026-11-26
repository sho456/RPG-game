/* ===== 戦闘の 2D-HD の見た目とカメラ（HD2D。ver0.66 の正本） =====
 1. 背景：旧戦闘の背景（BG。ドット絵）を高解像度の層 #hd-bg に描き直し、奥をぼかす（被写界深度）・奥の霞・手前の陰り・光の筋・周辺減光。
    旧の drawBattle には透明の BG を渡し、毎コマ #cv を消してからキャラだけを描かせる。
 2. 手前の層 #hd-fx：光の玉（ボケ）と漂う粒。アップのときはスポットライト。
 3. カメラ：戦場の層（#cv と、キャラに付いて動く DOM の層）に CSS の transform を掛ける。背景は弱く動かして視差を出す。
    ふだんは引きの画（ゆっくり呼吸）。通常攻撃は少し寄る。技・術・星臨・奥義（敵は溜め攻撃）は「アップの専用画面」へ：
    上下の黒帯・上の帯と下の操作を隠す・背景を暗く・注目しない（行動するキャラとその相手以外の）キャラを暗く・行動するキャラ→相手の順に寄る。
 4. コマンド入力中はカメラを元に戻す（戦場のスライドと狙いのタップのため）。狙いの枠も入力中だけ（js/ver19.js の V19.tgOk）。 */
'use strict';
const HD2D=(()=>{
const app=$('#app'),stg=()=>$('#stage');
const LAY=['#cv','#labels','#pops','#hl24','#fx25','#rt22','#bp46'];/* #mk25 は自分で transform を使う（入力中だけ出る＝カメラは元のまま） */
const inB=()=>scene==='battle'&&!!B;
const inputOn=()=>inB()&&!B.over&&!!B.rs&&B.rs.phase==='input'&&!auto&&!!B.pick;
let bgc=null,fxc=null,lb=null,HDBG=null,RAW=null,blank=null,bgSig='';
const cam={x:0,y:0,z:1,r:0};let F=null,cuA=0,last=0,cut0=0;

/* ---------- 1. 背景 ---------- */
function layers(){const S=stg();if(!S)return false;
 if(!bgc||bgc.parentNode!==S){bgc=document.createElement('canvas');bgc.id='hd-bg';S.insertBefore(bgc,S.firstChild);}
 if(!fxc||fxc.parentNode!==S){fxc=document.createElement('canvas');fxc.id='hd-fx';const cv=$('#cv');S.insertBefore(fxc,cv?cv.nextSibling:null);}
 if(!lb||lb.parentNode!==app){lb=document.createElement('div');lb.id='hd-lb';lb.innerHTML='<i></i><i></i>';app.appendChild(lb);}
 return true;}
/* 奥の境目（敵の列の足元より少し上）。論理座標 */
const horizon=()=>{try{const L=V23.LY;return Math.max(20,((L.ebot!=null?L.ebot:H*.5)-L.top)*.55+L.top);}catch(e){return H*.45;}};
function build(raw){const K=4,w=raw.width,h=raw.height,c=document.createElement('canvas');c.width=w*K;c.height=h*K;const g=c.getContext('2d');
 g.imageSmoothingEnabled=false;g.drawImage(raw,0,0,w*K,h*K);const hz=horizon()*K;
 /* 被写界深度：奥をぼかした写しを、上ほど濃く重ねる */
 const b=document.createElement('canvas');b.width=c.width;b.height=c.height;const bg=b.getContext('2d');bg.filter='blur(5px)';bg.drawImage(c,0,0);bg.filter='none';
 bg.globalCompositeOperation='destination-in';let gr=bg.createLinearGradient(0,0,0,hz*1.15);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.7,'rgba(0,0,0,.85)');gr.addColorStop(1,'rgba(0,0,0,0)');bg.fillStyle=gr;bg.fillRect(0,0,b.width,b.height);
 g.drawImage(b,0,0);
 /* 手前もわずかにぼかす（いちばん下の帯） */
 const f=document.createElement('canvas');f.width=c.width;f.height=c.height;const fg=f.getContext('2d');fg.filter='blur(3px)';fg.drawImage(c,0,0);fg.filter='none';
 fg.globalCompositeOperation='destination-in';gr=fg.createLinearGradient(0,c.height*.82,0,c.height);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.9)');fg.fillStyle=gr;fg.fillRect(0,0,f.width,f.height);g.drawImage(f,0,0);
 /* 奥の霞（明るい青）・地平の光 */
 gr=g.createLinearGradient(0,0,0,hz*1.1);gr.addColorStop(0,'rgba(150,170,255,.22)');gr.addColorStop(.75,'rgba(190,200,255,.14)');gr.addColorStop(1,'rgba(190,200,255,0)');g.fillStyle=gr;g.fillRect(0,0,c.width,hz*1.1);
 g.globalCompositeOperation='lighter';gr=g.createLinearGradient(0,hz*.7,0,hz*1.3);gr.addColorStop(0,'rgba(255,214,150,0)');gr.addColorStop(.5,'rgba(255,214,150,.10)');gr.addColorStop(1,'rgba(255,214,150,0)');g.fillStyle=gr;g.fillRect(0,hz*.7,c.width,hz*.6);
 /* 光の筋（左上から斜め） */
 for(const[x0,wd,a]of[[.12,.09,.07],[.3,.05,.05],[.52,.12,.045],[.78,.06,.04]]){g.save();g.translate(c.width*x0,0);g.transform(1,0,-.38,1,0,0);gr=g.createLinearGradient(0,0,0,c.height*.9);gr.addColorStop(0,`rgba(255,236,190,${a})`);gr.addColorStop(1,'rgba(255,236,190,0)');g.fillStyle=gr;g.fillRect(0,0,c.width*wd,c.height*.9);g.restore();}
 g.globalCompositeOperation='source-over';
 /* 手前の陰り（キャラの足元より下を暗く）・周辺減光 */
 gr=g.createLinearGradient(0,hz,0,c.height);gr.addColorStop(0,'rgba(6,6,22,0)');gr.addColorStop(.55,'rgba(6,6,22,.12)');gr.addColorStop(1,'rgba(6,6,22,.5)');g.fillStyle=gr;g.fillRect(0,hz,c.width,c.height-hz);
 gr=g.createRadialGradient(c.width/2,c.height*.55,c.height*.25,c.width/2,c.height*.55,c.height*.8);gr.addColorStop(0,'rgba(0,0,10,0)');gr.addColorStop(1,'rgba(0,0,10,.45)');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
 return c;}
function bgStep(){const cv=$('#cv');if(!cv||typeof BG==='undefined'||!BG)return;
 if(BG!==blank){RAW=BG;if(!blank||blank.width!==W||blank.height!==H){blank=document.createElement('canvas');blank.width=W;blank.height=H;}HDBG=null;BG=blank;}
 if(blank.width!==W||blank.height!==H){blank=document.createElement('canvas');blank.width=W;blank.height=H;BG=blank;}
 const sig=[cv.offsetLeft,cv.offsetTop,cv.clientWidth,cv.clientHeight,H,horizon()|0].join();
 if(!HDBG&&RAW){HDBG=build(RAW);bgSig='';}
 if(sig!==bgSig&&HDBG){bgSig=sig;const d=Math.min(2,devicePixelRatio||1);bgc.width=Math.round(cv.clientWidth*d);bgc.height=Math.round(cv.clientHeight*d);
  Object.assign(bgc.style,{left:cv.offsetLeft+'px',top:cv.offsetTop+'px',width:cv.clientWidth+'px',height:cv.clientHeight+'px'});
  const g=bgc.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(HDBG,0,0,bgc.width,bgc.height);}}

/* ---------- 2. 手前の光の玉・粒 ---------- */
const BOK=[];for(let i=0;i<14;i++)BOK.push({x:Math.random(),y:Math.random(),r:6+Math.random()*22,a:.04+Math.random()*.09,v:.004+Math.random()*.01,ph:Math.random()*6,c:Math.random()<.7?'255,220,160':'170,200,255'});
const MOTE=[];for(let i=0;i<26;i++)MOTE.push({x:Math.random(),y:Math.random(),v:.01+Math.random()*.03,ph:Math.random()*6});
function fxStep(t,dt){const S=stg();if(!S||!fxc)return;const w=S.clientWidth,h=S.clientHeight;if(fxc.width!==w||fxc.height!==h){fxc.width=w;fxc.height=h;}
 const g=fxc.getContext('2d');g.clearRect(0,0,w,h);
 /* アップ：行動するキャラのまわりを明るく、他を暗く */
 if(cuA>.01&&F){const r=box(F.a);if(r){const[cx,cy]=scr((r[0]+r[2])/2,(r[1]+r[3])/2);const gr=g.createRadialGradient(cx,cy,40,cx,cy,Math.max(w,h)*.75);gr.addColorStop(0,'rgba(0,0,12,0)');gr.addColorStop(1,`rgba(0,0,12,${.42*cuA})`);g.fillStyle=gr;g.fillRect(0,0,w,h);}}
 g.globalCompositeOperation='lighter';
 for(const b of BOK){b.y-=b.v*dt;b.x+=Math.sin(t*.4+b.ph)*.0006;if(b.y<-.1){b.y=1.1;b.x=Math.random();}
  const x=b.x*w-cam.x*.15,y=b.y*h,r=b.r*(1+cuA*.6),a=b.a*(.8+.2*Math.sin(t*1.3+b.ph))*(1+cuA*.5);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${b.c},${a})`);gr.addColorStop(.7,`rgba(${b.c},${a*.6})`);gr.addColorStop(1,`rgba(${b.c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
 for(const m of MOTE){m.y-=m.v*dt*.5;m.x+=Math.sin(t*.7+m.ph)*.0004;if(m.y<0){m.y=1;m.x=Math.random();}g.fillStyle=`rgba(255,240,200,${.25+.25*Math.sin(t*2+m.ph)})`;g.fillRect(Math.round(m.x*w),Math.round(m.y*h),2,2);}
 g.globalCompositeOperation='source-over';}

/* ---------- 3. カメラ ---------- */
/* 論理座標 → 舞台の px（カメラ前） */
function scr(x,y){const cv=$('#cv'),k=cv.clientWidth/W;return[cv.offsetLeft+x*k,cv.offsetTop+y*k];}
function box(u){if(!u)return null;try{const f=V19.foot(u),w=ANIM.world(u),D=V19.dims(u),x=f[0]+w[0],y=f[1]+w[1];return[x-D.w/2,y-D.h,x+D.w/2,y];}catch(e){return null;}}
function frameOf(list){let r=null;for(const u of list){const b=box(u);if(!b)continue;r=r?[Math.min(r[0],b[0]),Math.min(r[1],b[1]),Math.max(r[2],b[2]),Math.max(r[3],b[3])]:b;}return r;}
function field(){const S=stg(),L=V23.LY;const top=cuA>.5?0:(L.hudPx||60),bot=S.clientHeight-(cuA>.5?0:(L.botPx||46));return{w:S.clientWidth,h:S.clientHeight,cx:S.clientWidth/2,cy:(top+bot)/2,fh:bot-top};}
function target(t){const fd=field(),cv=$('#cv');let x=fd.cx,y=fd.cy,z=1,r=0;
 if(inputOn()||!B||B.over)return{x,y,z:1,r:0,sx:fd.cx,sy:fd.cy};
 if(F){const ph=(t-F.t0);let list=[F.a,...F.ts].filter(Boolean);
  /* アップ：まず行動するキャラに寄り、最初の命中で相手へ素早く振る（カメラの切り返し） */
  if(F.cu)list=F.hitT&&F.ts.size?[...F.ts]:[F.a];else if(!F.ts.size)list=[F.a];const R=frameOf(list);
  if(R){const pad=F.cu?1.35:1.9,[x0,y0]=scr(R[0],R[1]),[x1,y1]=scr(R[2],R[3]),bw=(x1-x0)*pad+40,bh=(y1-y0)*pad+30;
   z=Math.min(fd.w/bw,fd.fh/bh);z=F.cu?Math.max(1.45,Math.min(F.aw?2.7:2.4,z)):Math.max(1,Math.min(1.22,z));x=(x0+x1)/2;y=(y0+y1)/2-(y1-y0)*.08;
   if(F.cu)r=(F.a.side?1:-1)*(F.hitT?-.01:.014)*Math.min(1,ph*2);}}
 else{/* 引きの画：全員が入る範囲まで寄って、ゆっくり呼吸 */const R=frameOf([...B.enemies,...B.heroes].filter(u=>u.alive||u.side===0));
  if(R){const[x0,y0]=scr(R[0],R[1]),[x1,y1]=scr(R[2],R[3]);z=Math.max(1,Math.min(1.4,fd.w/((x1-x0)+50),fd.fh/((y1-y0)*1.5+40)));x=(x0+x1)/2;y=(y0+y1)/2-(y1-y0)*.12;}
  z*=1+.015*Math.sin(t*.35);x+=Math.sin(t*.21)*5;y+=Math.sin(t*.17)*3;}
 /* はみ出し防止：見える範囲がキャンバスの外へ出ない */
 const vw=fd.w/z,vh=fd.h/z,L0=cv.offsetLeft,T0=cv.offsetTop,R0=L0+cv.clientWidth,B0=T0+cv.clientHeight;
 x=R0-L0<=vw?(L0+R0)/2:Math.max(L0+vw/2,Math.min(R0-vw/2,x));
 const sy=fd.cy;y=Math.max(T0+(sy)/z,Math.min(B0-(fd.h-sy)/z,y));
 return{x,y,z,r,sx:fd.cx,sy};}
const T=(c,k)=>`translate(${(c.sx).toFixed(1)}px,${(c.sy).toFixed(1)}px) rotate(${(c.r*k).toFixed(4)}rad) scale(${(1+(c.z-1)*k).toFixed(4)}) translate(${(-(c.sx+(c.x-c.sx)*k)).toFixed(1)}px,${(-(c.sy+(c.y-c.sy)*k)).toFixed(1)}px)`;
function off(e,S){let x=0,y=0;for(let n=e;n&&n!==S&&n!==document.body;n=n.offsetParent){x+=n.offsetLeft;y+=n.offsetTop;}return[x,y];}
let lastT='';
function camStep(t,dt){const tg=target(t),inp=inputOn();
 if(inp){Object.assign(cam,tg);}else{const q=1-Math.exp(-dt*(F&&F.cu?7:3.2));for(const k of['x','y','z','r','sx','sy'])cam[k]=(cam[k]==null?tg[k]:cam[k]+(tg[k]-cam[k])*q);}
 let sh=[0,0];if(B&&B.shake>0){const m=Math.min(5,1+B.shake/5);sh=[(Math.random()-.5)*m*2,(Math.random()-.5)*m];}
 const c={...cam,sx:cam.sx,sy:cam.sy};const S=stg();const k1=T({...c,x:c.x-sh[0]/c.z,y:c.y-sh[1]/c.z},1),k2=T(c,.45);
 const sig=k1+k2;if(sig===lastT)return;lastT=sig;
 for(const sel of LAY){const e=$(sel);if(!e)continue;const o=off(e,S);e.style.transformOrigin=`${-o[0]}px ${-o[1]}px`;e.style.transform=inp?'':k1;}
 if(bgc){const o=off(bgc,S);bgc.style.transformOrigin=`${-o[0]}px ${-o[1]}px`;bgc.style.transform=inp?'':k2;}}
function reset(){lastT='';for(const sel of[...LAY,'#hd-bg']){const e=$(sel);if(e){e.style.transform='';e.style.transformOrigin='';}}F=null;cuA=0;app.classList.remove('cu66');}

/* ---------- 4. 注目（アップ）の出入り ---------- */
function focus(a,ts,cu,o={}){F={a,ts:new Set((ts||[]).filter(Boolean)),cu:!!cu,t0:performance.now()/1000,...o};cut0=performance.now();}
async function release(f){const k=typeof SPD!=='undefined'&&SPD[speed]?SPD[speed]:1;await new Promise(r=>setTimeout(r,Math.round((f&&f.cu?380:160)*Math.min(1.4,k))));if(F===f)F=null;}
V19.tgOk=()=>inputOn();
V19.uf=u=>{if(!F||!F.cu||cuA<.05||u===F.a||F.ts.has(u))return null;return`brightness(${(1-.62*cuA).toFixed(2)}) saturate(${(1-.5*cuA).toFixed(2)})`;};
const isCU=sk=>!!sk&&!sk.basic&&sk.k!=='item'&&sk.k!=='def'&&sk.k!=='guard';
{const _da=doAction;doAction=async function(u,sk,t){if(!inB()||!u)return _da(u,sk,t);let ts=Array.isArray(t)?t:t?[t]:[];if(!ts.length&&sk&&sk.t==='all')ts=u.side?B.heroes.filter(h=>h.alive):B.enemies.filter(e=>e.alive);
 if(!F||F.a!==u)focus(u,ts,isCU(sk),{ou:!!(sk&&sk.ougi)});const f=F;try{return await _da(u,sk,t);}finally{await release(f);}};}
{const _et=enemyTurn;enemyTurn=async function(e){if(!inB()||!e)return _et(e);focus(e,[],!!e.charging);const f=F;try{return await _et(e);}finally{await release(f);}};}
{const _h=hit;hit=async function(a,t,sk){try{if(F&&a===F.a&&t){F.ts.add(t);if(!F.hitT)F.hitT=performance.now()/1000;}}catch(e){}return _h(a,t,sk);};}
{const _aw=awaken;awaken=async function(u){if(!inB()||!u)return _aw(u);focus(u,[],true,{aw:1});const f=F;try{return await _aw(u);}finally{await release(f);}};}
{const _sb=startBattle;startBattle=function(list,opts){reset();return _sb(list,opts);};}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle'){reset();if(bgc)bgc.style.display='none';if(fxc)fxc.style.display='none';}else{if(bgc)bgc.style.display='';if(fxc)fxc.style.display='';}};}

/* ---------- 毎コマ ---------- */
{const _d=draw;draw=function(){if(inB()){try{layers();bgStep();const cv=$('#cv');if(cv){const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);}}catch(e){if(!draw._eh){draw._eh=1;console.error(e);}}}
 _d();if(!inB())return;try{const now=performance.now()/1000,dt=Math.min(.1,now-(last||now));last=now;
  const want=F&&F.cu&&!inputOn()?1:0;cuA+=(want-cuA)*(1-Math.exp(-dt*(want?9:5)));if(Math.abs(want-cuA)<.003)cuA=want;
  const on=cuA>.5;if(app.classList.contains('cu66')!==on)app.classList.toggle('cu66',on);
  if(bgc)bgc.style.filter=cuA>.01?`brightness(${(1-.5*cuA).toFixed(2)}) blur(${(cuA*2).toFixed(1)}px)`:'';
  camStep(now,dt);fxStep(now,dt);}catch(e){if(!draw._eh2){draw._eh2=1;console.error(e);}}};}
return{focus,get F(){return F;},get cam(){return cam;},reset};})();
