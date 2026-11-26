/* ===== 戦闘の 2D-HD の見た目と、技・術・星臨・奥義の注目画面（HD。ver0.66 の正本） =====
 1. 2D-HD：背景の上に奥行きの光（床の光だまり・地平の霧・周辺減光・漂う光の粒）。並びの奥行き（奥ほど小さく中央寄り）は
    js/v38/battle-ui.js の placeHeroes と js/v23.js の ANC・scM。描く順の差し込み口は js/ver19.js の drawBattle（V19.pre・V19.vis・V19.post）。
 2. 注目画面：味方が技・術・奥義を使う間と星臨の間だけ、行動する味方とその相手だけを写す（他は消える・背景は暗く・カメラが寄る）。
 3. セレスの絵：立ち絵・顔・カットインも戦闘のコマ（素材パック celes_hd）に揃える（SPX.unitCv・face・V19.art を包む）。 */
'use strict';
const HD=(()=>{
const app=$('#app'),inB=()=>scene==='battle'&&!!B;
/* ---------- 3. セレスの絵：戦闘のコマ（celes_hd の idle@0／星臨は aw_idle@0）---------- */
const CID='celes',PK='celes_hd';
const pk=()=>SPX.ready&&SPX.D[PK];
const fr=aw=>{const a=pk().anims,n=aw&&a.aw_idle?'aw_idle':'idle';return(a[n]&&a[n].f[0])||'ready';};
function hdCut(aw,Ht,mirror){const d=pk();if(!d)return null;let sk=null,be=1e9;for(const k in d.sizes){const e=Math.abs(d.sizes[k].dots-Ht);if(e<be){be=e;sk=k;}}
 return SPX.cut(PK,sk,aw&&d.anims.aw_idle?'':(aw?'aw':''),fr(aw),!!mirror,0,0);}
{const _u=SPX.unitCv;SPX.unitCv=function(spr,fk,side,target){if(String(spr).replace(/_aw$/,'')===CID&&pk()){try{const aw=/_aw$/.test(spr),h=typeof target==='number'?target:(target&&target.area?Math.sqrt(target.area)*1.6:84);
  const f=hdCut(aw,h,FACING.mirror(pk().face,FACING.of(fk||spr,side)));if(f)return f;}catch(e){}}return _u.apply(this,arguments);};}
const UIC={};
{const _f=face;face=function(id,aw){if(id===CID&&pk()){const k='f'+(aw?1:0);if(UIC[k])return UIC[k];try{const f=hdCut(aw,99,false);if(f){
  /* 顔まわり：上から幅の 6 割の正方形 */const s=Math.round(f.w*.5),c=document.createElement('canvas');c.width=c.height=s;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(f.cv,Math.round((f.w-s)/2),Math.max(0,Math.round(f.h*.03)),s,s,0,0,s,s);return UIC[k]=c.toDataURL();}}catch(e){}}return _f(id,aw);};}
/* 旧戦闘の星臨の小窓（#cut canvas） */
V19.art=(cv2,key)=>{if(key.replace(/_aw$/,'')!==CID||!pk())return false;const f=hdCut(/_aw$/.test(key),66,false);if(!f)return false;
 cv2.width=cv2.height=Math.max(f.w,f.h);const g=cv2.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(f.cv,Math.round((cv2.width-f.w)/2),cv2.height-f.h);return true;};

/* ---------- 2. 注目画面 ---------- */
let F=null;/* {u, set:Set(写すユニット), a:0→1, on, cx, cy} */
const ally=sk=>{try{if(RSC.isHealSpell(sk))return true;}catch(e){}return sk.t==='ally'||sk.t==='self'||sk.k==='sup20'||!!sk.heal20||sk.role==='heal';};
function targets(u,sk,t){if(Array.isArray(t))return t.filter(Boolean);if(sk&&(sk.t==='all'||sk.t==='allies'))return ally(sk)?aliveH():aliveE();if(t)return[t];return sk&&ally(sk)?[]:aliveE();}
function focus(u,list){if(!inB())return;F={u,set:new Set([u,...list]),a:F?F.a:0,on:true};app.classList.add('fc66');}
function unfocus(){if(F)F.on=false;app.classList.remove('fc66');}
const step=()=>{if(!F)return;F.a=Math.max(0,Math.min(1,F.a+(F.on?.09:-.07)));if(!F.on&&F.a<=0){F=null;cam(null);}};
V19.vis=u=>{if(!F)return 1;return F.set.has(u)?1:1-F.a;};
const big=sk=>!!sk&&!sk.basic&&!(sk.k==='item');
{const _da=doAction;doAction=async function(u,sk,t){const on=inB()&&u&&u.side===0&&big(sk);if(on)focus(u,targets(u,sk,t));
  try{return await _da.apply(this,arguments);}finally{if(on)unfocus();}};}
{const _aw=awaken;awaken=async function(u){const on=inB()&&u&&u.side===0;if(on)focus(u,aliveE());try{return await _aw.apply(this,arguments);}finally{if(on)unfocus();}};}
{const _sb=startBattle;startBattle=function(){F=null;app.classList.remove('fc66');cam(null);return _sb.apply(this,arguments);};}
/* カメラ：写すユニットの中心へ少し寄る（キャンバスとダメージの数字の層を同じ倍率で） */
let CAM='';
function cam(c){const cv=$('#cv');if(!cv)return;const L=[cv,$('#bcv'),$('#bp46')].filter(Boolean);
 if(!c){if(CAM){CAM='';L.forEach(e=>{e.style.transform='';});}return;}
 const k=cv.clientWidth/W,ox=cv.offsetLeft,oy=cv.offsetTop,sx=ox+c[0]*k,sy=oy+c[1]*k,key=`${Math.round(sx)},${Math.round(sy)},${c[2].toFixed(2)}`;if(key===CAM)return;CAM=key;
 L.forEach(e=>{const ex=e===cv||e.id==='bcv'?ox:0,ey=e===cv||e.id==='bcv'?oy:0;e.style.transformOrigin=`${Math.round(sx-ex)}px ${Math.round(sy-ey)}px`;e.style.transform=`scale(${c[2].toFixed(3)})`;});}
function camOf(){if(!F)return null;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const u of F.set){if(!u||(!u.alive&&u!==F.u))continue;let fx=u.x+8*u.sc,fy=u.y+16*u.sc,h=24;try{[fx,fy]=V19.foot(u);h=V19.dims(u).h;}catch(e){}
  x0=Math.min(x0,fx);x1=Math.max(x1,fx);y0=Math.min(y0,fy-h);y1=Math.max(y1,fy);}
 if(x0>x1)return null;const z=1+.2*F.a*Math.max(0,Math.min(1,(W*.95)/Math.max(40,x1-x0+40)-.1));return[(x0+x1)/2,(y0+y1)/2,z];}

/* ---------- 1. 2D-HD の光（V19.pre：背景の直後・V19.post：キャラの後） ---------- */
const MOTE=[];let t0=0;
function seedMotes(){MOTE.length=0;for(let i=0;i<14;i++)MOTE.push({x:Math.random()*W,y:Math.random()*H,r:.6+Math.random()*1.6,v:.02+Math.random()*.05,ph:Math.random()*6.3,near:Math.random()<.3});}
function band(){const top=(typeof LY!=='undefined'&&LY.top)||H*.25,bot=(typeof LY!=='undefined'&&LY.bot)||H*.85;return[top,bot];}
/* 被写界深度：奥（地平より上）と手前の下端だけぼかした背景を重ねる（背景ごとに 1 回作って使い回す） */
const DOF=new WeakMap();
function dof(k,top,bot){const key=k+'|'+Math.round(top)+'|'+Math.round(bot);let c=DOF.get(BG);if(c&&c._k===key)return c;c=document.createElement('canvas');c._k=key;c.width=W*k;c.height=H*k;const g=c.getContext('2d');
 g.imageSmoothingEnabled=true;g.filter=`blur(${(k*1.1).toFixed(1)}px)`;g.drawImage(BG,0,0,W*k,H*k);g.filter='none';
 /* ぼかしの強さを縦のグラデーションで抜く：奥は濃く、キャラの立つ帯はくっきり、手前の下端は少し */
 g.globalCompositeOperation='destination-in';const m=g.createLinearGradient(0,0,0,H*k),y1=(top+(bot-top)*.12)/H,y2=(top+(bot-top)*.3)/H,y3=Math.min(.99,(bot+4)/H);
 m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(Math.min(y1,.98),'rgba(0,0,0,.9)');m.addColorStop(Math.min(y2,.985),'rgba(0,0,0,0)');m.addColorStop(y3,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,.7)');
 g.fillStyle=m;g.fillRect(0,0,W*k,H*k);DOF.set(BG,c);return c;}
V19.pre=(g,k)=>{if(!B)return;step();const[top,bot]=band(),a=F?F.a:0;g.save();g.setTransform(1,0,0,1,0,0);try{g.drawImage(dof(k,top,bot),0,0);}catch(e){}g.setTransform(k,0,0,k,0,0);
 /* 地平の霧：奥（上）ほど白っぽく霞む */
 let gr=g.createLinearGradient(0,top-20,0,top+(bot-top)*.55);gr.addColorStop(0,'rgba(170,180,230,.20)');gr.addColorStop(1,'rgba(170,180,230,0)');g.fillStyle=gr;g.fillRect(0,0,W,top+(bot-top)*.55);
 /* 床の光だまり（戦場の中央） */
 g.globalCompositeOperation='lighter';const cy=top+(bot-top)*.6,rg=g.createRadialGradient(W/2,cy,2,W/2,cy,W*.62);rg.addColorStop(0,'rgba(255,214,150,.13)');rg.addColorStop(1,'rgba(255,214,150,0)');
 g.setTransform(k,0,0,k*.5,0,cy*k*.5);g.fillStyle=rg;g.fillRect(0,cy-W*.7,W,W*1.4);g.setTransform(k,0,0,k,0,0);g.globalCompositeOperation='source-over';
 /* 注目画面：背景を暗く・相手と味方の足元にだけ光 */
 if(a>0){g.fillStyle=`rgba(5,4,16,${.5*a})`;g.fillRect(0,0,W,H);
  /* 専用の舞台：地平に細い光の線と、床に二人の間の光の帯 */
  {const hy=top+(bot-top)*.18,lg=g.createLinearGradient(0,hy-6,0,hy+6);lg.addColorStop(0,'rgba(140,170,255,0)');lg.addColorStop(.5,`rgba(140,170,255,${.22*a})`);lg.addColorStop(1,'rgba(140,170,255,0)');g.fillStyle=lg;g.fillRect(0,hy-6,W,12);}g.globalCompositeOperation='lighter';
  for(const u of F.set){if(!u||(!u.alive&&u!==F.u))continue;let fx,fy;try{[fx,fy]=V19.foot(u);}catch(e){continue;}const r=Math.max(14,(V19.dims(u).w||16)*.9),c=u.side===0?'150,200,255':'255,150,120';
   g.setTransform(k,0,0,k*.35,0,fy*k*.65);const q=g.createRadialGradient(fx,fy,1,fx,fy,r);q.addColorStop(0,`rgba(${c},${.34*a})`);q.addColorStop(1,`rgba(${c},0)`);g.fillStyle=q;g.fillRect(fx-r,fy-r,r*2,r*2);}
  g.setTransform(k,0,0,k,0,0);g.globalCompositeOperation='source-over';}
 g.restore();};
V19.post=(g,k)=>{if(!B)return;const now=performance.now()/1000,dt=Math.min(.1,now-(t0||now));t0=now;if(!MOTE.length||MOTE._H!==H){seedMotes();MOTE._H=H;}
 const a=F?F.a:0;g.save();g.setTransform(k,0,0,k,0,0);
 /* 漂う光の粒（ボケ）：手前の大きい粒はぼかす */
 g.globalCompositeOperation='lighter';for(const m of MOTE){m.y-=m.v*dt*60;m.x+=Math.sin(now*.6+m.ph)*.08;if(m.y<-4){m.y=H+4;m.x=Math.random()*W;}
  const al=(.18+.12*Math.sin(now*1.7+m.ph))*(1-a*.6),r=m.near?m.r*2.4:m.r,q=g.createRadialGradient(m.x,m.y,0,m.x,m.y,r);q.addColorStop(0,`rgba(255,236,190,${al})`);q.addColorStop(1,'rgba(255,236,190,0)');g.fillStyle=q;g.fillRect(m.x-r,m.y-r,r*2,r*2);}
 g.globalCompositeOperation='source-over';
 /* 周辺減光（注目画面ではさらに強く） */
 const v=g.createRadialGradient(W/2,H*.52,Math.min(W,H)*.35,W/2,H*.52,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,8,0)');v.addColorStop(1,`rgba(0,0,8,${.45+.35*a})`);g.fillStyle=v;g.fillRect(0,0,W,H);
 /* 注目画面の上下の帯 */
 if(a>0){const[top,bot]=band();g.fillStyle=`rgba(4,3,12,${.85*a})`;g.fillRect(0,0,W,Math.max(0,top-8));g.fillRect(0,bot+6,W,H-bot-6);}
 g.restore();try{cam(F?camOf():null);}catch(e){}};
return{get focus(){return F;}};})();
