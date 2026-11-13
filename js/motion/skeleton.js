/* ===== ver0.29 骨格・関節・可動域（SKEL） =====
 ドット絵 1 枚（1 ポーズ）から骨格を推定し、手動の修正（js/data/skeleton-overrides.js）で上書きする。
 ・型（TYPES）：hum（人型）／beast（四足・竜）／blob（不定形）／float（浮遊体）。関節の親子と可動域（度）を持つ
 ・推定（auto）：不透明画素の輪郭から 頭・首・胸・腰・肩・肘・手・股・膝・足 を求める（人型）。
   四足は向き（素材の face）から頭と尾を、不定形・浮遊体は重心と上下端を求める
 ・手動（manual）：SKEL_OVR[キャラ][ポーズ名 or '*'][関節]＝[x,y]（フレーム左上が 0、右下が 1 の比率）。
   比率で持つので、同じポーズのすべてのサイズ（b42〜B104・探索用）に効く。
   図鑑の「骨格」表示（開発者モードでは関節をドラッグして修正→書き出し）で作れる
 ・使い道：呼吸で沈める上半身の切れ目（腰）、背面の自動補完（頭の範囲）、図鑑の骨格表示、
   今後の部位アニメーション（関節角度は clamp で可動域に収める） */
const SKEL=(()=>{
const TYPES={
 hum:{n:'人型',joints:{root:{p:null},pelvis:{p:'root',rom:[-25,25]},chest:{p:'pelvis',rom:[-30,40]},neck:{p:'chest',rom:[-30,30]},head:{p:'neck',rom:[-40,40]},
  shoulderL:{p:'chest',rom:[-170,60]},elbowL:{p:'shoulderL',rom:[0,150]},handL:{p:'elbowL',rom:[-70,70]},
  shoulderR:{p:'chest',rom:[-170,60]},elbowR:{p:'shoulderR',rom:[0,150]},handR:{p:'elbowR',rom:[-70,70]},
  hipL:{p:'pelvis',rom:[-110,40]},kneeL:{p:'hipL',rom:[0,145]},footL:{p:'kneeL',rom:[-35,45]},
  hipR:{p:'pelvis',rom:[-110,40]},kneeR:{p:'hipR',rom:[0,145]},footR:{p:'kneeR',rom:[-35,45]}}},
 beast:{n:'四足・竜',joints:{root:{p:null},hip:{p:'root',rom:[-20,20]},chest:{p:'hip',rom:[-25,25]},neck:{p:'chest',rom:[-45,45]},head:{p:'neck',rom:[-40,40]},tail:{p:'hip',rom:[-60,60]},
  legF:{p:'chest',rom:[-80,60]},legB:{p:'hip',rom:[-80,60]}}},
 blob:{n:'不定形',joints:{root:{p:null},core:{p:'root',rom:[-15,15]},top:{p:'core',rom:[-30,30]}}},
 float:{n:'浮遊体',joints:{root:{p:null},core:{p:'root',rom:[-20,20]},head:{p:'core',rom:[-35,35]},tail:{p:'core',rom:[-50,50]}}}};
for(const t in TYPES){const J=TYPES[t].joints;TYPES[t].bones=Object.keys(J).filter(k=>J[k].p).map(k=>[J[k].p,k]);}
/* 種族（元のリグ）→ 骨格の型 */
const BASE_TYPE={wolf:'beast',slime:'blob',shroom:'blob',bookghost:'float'};
function typeOf(id){const c=typeof SPX!=='undefined'&&SPX.D[id];if(!c)return'hum';if(c.kind==='hum')return'hum';
 const d=SPX.DEF&&SPX.DEF[id.replace(/_K$/,'')];return(d&&BASE_TYPE[d.base])||'hum';}
const OVR=()=>typeof SKEL_OVR!=='undefined'?SKEL_OVR:{};

/* ---------- 不透明画素の解析 ---------- */
function maskOf(cv){const w=cv.width,h=cv.height,d=cv.getContext('2d').getImageData(0,0,w,h).data,m=new Uint8Array(w*h);for(let i=0;i<w*h;i++)m[i]=d[i*4+3]>0?1:0;return{w,h,m};}
function rows(M){const{w,h,m}=M,R=[];for(let y=0;y<h;y++){let a=-1,b=-1,n=0;for(let x=0;x<w;x++)if(m[y*w+x]){if(a<0)a=x;b=x;n++;}R.push({a,b,n});}return R;}
/* 行 y で、x0 を含む（無ければ最も近い）不透明の連なり */
function runAt(M,y,x0){const{w,m}=M;if(y<0||y>=M.h)return null;let best=null,bd=1e9;for(let x=0;x<w;){if(!m[y*w+x]){x++;continue;}let e=x;while(e+1<w&&m[y*w+e+1])e++;const d=x0<x?x-x0:x0>e?x0-e:0;if(d<bd){bd=d;best={a:x,b:e};}x=e+1;}return best;}
function runs(M,y){const{w,m}=M,o=[];for(let x=0;x<w;){if(!m[y*w+x]){x++;continue;}let e=x;while(e+1<w&&m[y*w+e+1])e++;o.push({a:x,b:e});x=e+1;}return o;}
function centroid(M,f){const{w,h,m}=M;let sx=0,sy=0,n=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(m[y*w+x]&&f(x,y)){sx+=x;sy+=y;n++;}return n?[sx/n,sy/n]:null;}
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- 推定 ---------- */
function estHum(M,ay){const R=rows(M);let y0=R.findIndex(r=>r.n>0);if(y0<0)return null;const y1=Math.min(M.h-1,ay!=null?ay:M.h-1),H=Math.max(4,y1-y0+1);
 const xs=[];for(let y=Math.round(y0+H*.3);y<=y0+H*.75;y++)for(let x=0;x<M.w;x++)if(M.m[y*M.w+x])xs.push(x);xs.sort((a,b)=>a-b);const ax=xs.length?xs[xs.length>>1]:M.w/2;
 const cw=y=>{const r=runAt(M,y,ax);return r?r.b-r.a+1:0;};
 let neck=Math.round(y0+H*.38),mn=1e9;for(let y=Math.round(y0+H*.2);y<=y0+H*.5;y++){const v=cw(y);if(v>0&&v<mn){mn=v;neck=y;}}
 const headW=Math.max(...Array.from({length:Math.max(1,neck-y0)},(_,i)=>cw(y0+i)));if(mn>headW*.9)neck=Math.round(y0+H*.38);
 let hx=0,hn=0;for(let y=y0;y<neck;y++){const r=runAt(M,y,ax);if(r){hx+=(r.a+r.b)/2;hn++;}}hx=hn?hx/hn:ax;
 const chestY=neck+H*.12,pelY=neck+(y1-neck)*.45;
 const sr=runAt(M,Math.round(neck+H*.08),ax)||{a:ax-3,b:ax+3},sw=sr.b-sr.a;
 const pr=runAt(M,Math.round(pelY),ax)||{a:ax-3,b:ax+3};
 const hipD=Math.max(1,sw*.2);
 const fr=runs(M,y1).concat(runs(M,Math.max(0,y1-1)));let fl,frr;
 if(fr.length>=2){fr.sort((a,b)=>a.a-b.a);fl=(fr[0].a+fr[0].b)/2;frr=(fr[fr.length-1].a+fr[fr.length-1].b)/2;}else{const r=fr[0]||{a:ax-2,b:ax+2},c=(r.a+r.b)/2,q=Math.max(1,(r.b-r.a)/4);fl=c-q;frr=c+q;}
 const sL=[lerp(sr.a,ax,.15),neck+H*.08],sR=[lerp(sr.b,ax,.15),neck+H*.08],hL=[pr.a,pelY],hR=[pr.b,pelY];
 const J={root:[ax,y1],pelvis:[ax,pelY],chest:[ax,chestY],neck:[hx,neck],head:[hx,(y0+neck)/2],
  shoulderL:sL,shoulderR:sR,handL:hL,handR:hR,elbowL:[(sL[0]+hL[0])/2-1,(sL[1]+hL[1])/2],elbowR:[(sR[0]+hR[0])/2+1,(sR[1]+hR[1])/2],
  hipL:[ax-hipD,pelY+H*.03],hipR:[ax+hipD,pelY+H*.03],footL:[fl,y1],footR:[frr,y1]};
 J.kneeL=[lerp(J.hipL[0],fl,.5),lerp(J.hipL[1],y1,.5)];J.kneeR=[lerp(J.hipR[0],frr,.5),lerp(J.hipR[1],y1,.5)];
 return{J,headR:Math.max(2,(neck-y0)/2),low:['handL','handR','elbowL','elbowR']};}
function estBeast(M,ay,face){const R=rows(M),y0=R.findIndex(r=>r.n>0),y1=Math.min(M.h-1,ay!=null?ay:M.h-1);if(y0<0)return null;
 let a=1e9,b=-1;R.forEach(r=>{if(r.n){a=Math.min(a,r.a);b=Math.max(b,r.b);}});const W=b-a+1,H=y1-y0+1,fL=face!=='R';
 const nearF=x=>fL?x<a+W*.3:x>b-W*.3,farF=x=>fL?x>b-W*.18:x<a+W*.18;
 const head=centroid(M,(x,y)=>nearF(x)&&y<y0+H*.6)||[fL?a+W*.15:b-W*.15,y0+H*.3],tail=centroid(M,(x,y)=>farF(x))||[fL?b:a,y0+H*.5];
 const ch=centroid(M,(x,y)=>(fL?x<a+W*.5:x>b-W*.5))||[a+W/2,y0+H/2],hp=centroid(M,(x,y)=>(fL?x>=a+W*.5:x<=b-W*.5))||[a+W/2,y0+H/2];
 const fr=runs(M,y1).sort((p,q)=>p.a-q.a),f0=fr[0]||{a,b:a},f1=fr[fr.length-1]||{a:b,b};
 const legF=fL?[(f0.a+f0.b)/2,y1]:[(f1.a+f1.b)/2,y1],legB=fL?[(f1.a+f1.b)/2,y1]:[(f0.a+f0.b)/2,y1];
 const J={root:[(a+b)/2,y1],hip:hp,chest:ch,neck:[lerp(ch[0],head[0],.55),lerp(ch[1],head[1],.55)],head,tail,legF,legB};
 return{J,headR:Math.max(2,Math.min(W,H)*.14),low:['tail','legF','legB']};}
function estBlob(M,ay){const c=centroid(M,()=>true);if(!c)return null;const R=rows(M),y0=R.findIndex(r=>r.n>0),y1=Math.min(M.h-1,ay!=null?ay:M.h-1),r0=R[y0];
 return{J:{root:[c[0],y1],core:c,top:[(r0.a+r0.b)/2,y0]},headR:Math.max(2,(y1-y0)*.25),low:[]};}
function estFloat(M,ay){const c=centroid(M,()=>true);if(!c)return null;const R=rows(M),y0=R.findIndex(r=>r.n>0);let yb=M.h-1;while(yb>0&&!R[yb].n)yb--;const H=yb-y0+1;
 const head=centroid(M,(x,y)=>y<y0+H*.3)||[c[0],y0+H*.15],rb=R[yb];
 return{J:{root:[c[0],ay!=null?ay:yb],core:c,head,tail:[(rb.a+rb.b)/2,yb]},headR:Math.max(2,H*.15),low:['tail']};}
function estimate(cv,type,ay,face){const M=maskOf(cv);const r=type==='beast'?estBeast(M,ay,face):type==='blob'?estBlob(M,ay):type==='float'?estFloat(M,ay):estHum(M,ay);if(!r)return null;r.w=M.w;r.h=M.h;return r;}

/* ---------- 取得（推定＋手動の上書き） ---------- */
const CACHE=new Map();
/* 戻り値：{type,w,h,joints:{名前:{x,y,src:'auto'|'low'|'manual'}},bones,headR}（座標はフレームの画素。左右反転なし＝素材の向き） */
function build(id,name,cv,type,ay,face){const e=estimate(cv,type,ay,face);if(!e)return null;const O=OVR()[id]||{},ov=Object.assign({},O['*'],O[name]);
 const joints={};for(const k in TYPES[type].joints){const p=e.J[k];if(!p)continue;joints[k]={x:p[0],y:p[1],src:e.low.includes(k)?'low':'auto'};}
 for(const k in ov){if(k==='type'||!Array.isArray(ov[k]))continue;joints[k]={x:ov[k][0]*(e.w-1),y:ov[k][1]*(e.h-1),src:'manual'};}
 return{type,w:e.w,h:e.h,joints,bones:TYPES[type].bones,headR:e.headR,id,name};}
/* SPX のキャラ（id・サイズ・ポーズ名） */
function of(id,sk,name){if(typeof SPX==='undefined'||!SPX.D[id])return null;const k=id+'|'+sk+'|'+name;if(CACHE.has(k))return CACHE.get(k);
 const f=SPX.cut(id,sk,'',name,false,0,0);if(!f)return null;const O=OVR()[id],type=(O&&O.type)||typeOf(id);
 const s=build(id,name,f.cv,type,f.ay,SPX.D[id].face);CACHE.set(k,s);return s;}
/* 任意のキャンバス（旧リグの絵など）。type を省略すると人型 */
const CV=new WeakMap();
function ofCanvas(cv,type='hum',ay,face='L'){let s=CV.get(cv);if(s&&s.type===type)return s;s=build(null,'',cv,type,ay,face);CV.set(cv,s);return s;}
/* 呼吸の切れ目：腰（人型）／重心（その他）の高さ。fr＝[sx,sy,w,h,ax,ay] */
function breathLine(id,sk,name,fr){if(!/^[bBuf]/.test(sk))return 0;const s=of(id,sk,name);if(!s)return 0;const j=s.joints.pelvis||s.joints.core||s.joints.hip;if(!j)return 0;
 return Math.max(Math.round(fr[5]*.3),Math.min(Math.round(fr[5]*.8),Math.round(j.y)));}
/* 可動域に収める（度） */
function clamp(type,joint,deg){const j=TYPES[type]&&TYPES[type].joints[joint];if(!j||!j.rom)return deg;return Math.max(j.rom[0],Math.min(j.rom[1],deg));}
/* 手動の修正（開発者モードの図鑑から）：比率で保存し、キャッシュを捨てる */
function setManual(id,name,joint,x,y,w,h){const O=typeof SKEL_OVR!=='undefined'?SKEL_OVR:(window.SKEL_OVR={});O[id]=O[id]||{};O[id][name]=O[id][name]||{};
 O[id][name][joint]=[+(x/Math.max(1,w-1)).toFixed(3),+(y/Math.max(1,h-1)).toFixed(3)];for(const k of[...CACHE.keys()])if(k.startsWith(id+'|'))CACHE.delete(k);}
function exportOvr(id){const O=OVR();return JSON.stringify(id?{[id]:O[id]||{}}:O,null,1);}
return{TYPES,typeOf,of,ofCanvas,breathLine,clamp,setManual,exportOvr,estimate,clear:()=>CACHE.clear()};})();
