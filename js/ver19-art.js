/* ===== ver0.19 絵柄の統一：顔グラ・立ち絵・会話の表情・探索／街／ワールドマップの歩き姿 =====
 戦闘以外の画面も、ver0.19 の新しいドット絵（dot-rig / dot-heroes / dot-mon）で描く。
 ・ver0.18 の frameOf(key, anim, i, opt) を包み、仲間と敵は新しいリグのフレームを返す
   （街の住人など、新しいリグを持たないものは ver0.18 の絵のまま）
 ・face（18ドットの顔）、art（全身の立ち絵）、portrait（行動順・カットイン）、exprFace（会話の表情5種）を差し替える
 ・探索中・街では武器を持たない（ver0.18 の仕様を引き継ぐ） */
const V19A=(()=>{
const AD=new WeakMap();
/* ver0.18 のフレーム形式 {c,W,H,ax,ay} に合わせる（whiteFrame/tintFrame がそのまま使える） */
const ad=f=>{let a=AD.get(f);if(!a){a={c:f.cv,W:f.w,H:f.h,ax:f.ax,ay:f.ay};AD.set(f,a);}return a;};
const parse=o=>{if(!o)return{};try{return JSON.parse(o);}catch(e){return{};}};
/* キー → リグ・配色・派生形 */
function look(key,opt){const o=parse(opt),aw=!!o.aw,ik=aw&&SPRX.info(key+'_aw')?key+'_aw':key,inf=SPRX.info(ik);if(!inf)return null;
 const kd=key.replace(/^vo_/,''),K=ANIM.KIND[kd]||{},name=K.rig||inf.rig,R=RIG[name];if(!R)return null;let pal=inf.pal,pk=ik;
 if(K.pal){pal=Object.assign({},pal,K.pal);pk+='k';}
 const wc=o.wl||(o.wt&&TIERC[o.wt]);if(wc&&R.type==='hum'){pal=Object.assign({},pal,{m:wc,M:PX.tint(wc,.56,1.1,-12)});pk+='|'+wc;}
 return{name,R,pal,pk,extra:K.extra||'',hum:R.type==='hum',noW:!!o.noW,bossSc:K.sc||null};}
/* 歩き：4コマ（接地→通過→接地→通過）。体の上下と腕の振りを付ける */
function walkPose(R,i){const b=Object.assign({},HUM.D0,R.pose),t=((i%4)+4)%4,s=[1,0,-1,0][t];
 return{fF:[-1+s*3.6,s<0?2.2:0],fN:[1-s*3.6,s>0?2.2:0],cr:t%2?0:.9,hF:[b.hF[0]*.3-s*2.2,6.5],hN:[b.hN[0]*.3+s*2.2,7],sw:s*1.6,q:t%2,ta:.06};}
/* 待機：時刻からポーズを作る（コマ送りの間隔はリグごと） */
function idlePose(L,key){const R=L.R,st=R.step||100,t=Math.floor(performance.now()/st)*st,b=ANIM.base({rig:R}),A={extra:L.extra,name:L.name};
 const p=Object.assign(b,(ANIM.IDLE[L.name]||ANIM.IDLE._)(t,{},A,Object.assign({},b)));return p;}
const SC={field:1,mon:.78};
/* 新しいリグでのフレーム。sc 省略時：人型1倍、敵は探索用の大きさ */
function frame(key,anim,i,opt,sc){const L=look(key,opt);if(!L)return null;const R=L.R;let p;
 if(anim==='walk'&&L.hum)p=walkPose(R,i);else p=idlePose(L,key);if(L.noW)p.noW=1;
 if(anim==='win'&&L.hum)Object.assign(p,{ta:-.12,hF:[-2,-7],wa:1.6,ex:2});
 const s=sc||(L.hum?SC.field:SC.mon*(L.bossSc?Math.min(1.5,L.bossSc*.7):1));
 return SPRX.frame(L.name,p,L.pk,L.pal,!L.hum,s,L.extra);}
{const _fo=frameOf;frameOf=function(key,anim='idle',i=0,opt=''){try{const f=frame(key,anim,i,opt);if(f)return ad(f);}catch(e){if(!frameOf._e){frameOf._e=1;console.error(e);}}return _fo(key,anim,i,opt);};}

/* ---------- 顔まわりの切り出し ---------- */
/* 人型：頭の中心（リグ座標）をフレーム上のピクセル位置へ */
function headAt(L,pose,f,sc){const c=L.R,p=Object.assign({},HUM.D0,c.pose,pose),J=HUM.joints(c,p);return[f.ax+J.hd[0]*sc,f.ay+J.hd[1]*sc];}
function headCanvas(key,opt,em,N,sc=1){const L=look(key,opt);if(!L)return null;const p=Object.assign(ANIM.base({rig:L.R}),{em:em||'',bl:0,sw:0,q:0});if(p.y)p.y=0;p.noW=1;
 const f=SPRX.frame(L.name,p,L.pk,L.pal,false,sc,L.extra),c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(L.hum){const[hx,hy]=headAt(L,p,f,sc);g.drawImage(f.cv,Math.round(N/2-hx-.5*sc),Math.round(N/2-hy+1.5*sc));}
 else{const[fx,fy]=(L.extra&&MFACE[L.extra])||MFACE[L.name]||[0,-20],y0=L.name==='bookghost'&&!L.extra?-8:0;g.drawImage(f.cv,Math.round(N/2-f.ax-fx*sc),Math.round(N/2-f.ay-(fy+y0)*sc));}return c;}
/* 敵の顔の位置（リグ座標・左向き） */
const MFACE={slime:[-2,-10],wolf:[-14,-20],golem:[-3,-46],shroom:[-1,-19],bookghost:[0,-30],boss:[-2,-45],jelly:[-3,-33],spirit:[-1,-24],shade:[-1,-29],yuki:[-1,-25],priest:[-2,-46]};
const FACE19={},ART19={},POR19=new Map(),EXC19={};
const keyOfId=id=>SPDEF[id]?id:'rio';
face=function(id,aw){const k=keyOfId(id)+(aw?'_aw':'');if(FACE19[k])return FACE19[k];const c=headCanvas(keyOfId(id),aw?'{"aw":1}':'','',20);return FACE19[k]=c?c.toDataURL():'';};
/* 立ち絵：武器を構えた全身（余白を詰めて正方形） */
art=function(id,aw){const k=keyOfId(id)+(aw?'_aw':'');if(ART19[k])return ART19[k];const key=keyOfId(id),L=look(key,aw?'{"aw":1}':'');if(!L)return'';const p=ANIM.base({rig:L.R});if(p.y)p.y=0;
 const f=SPRX.frame(L.name,p,L.pk,L.pal,false,1,L.extra);return ART19[k]=trimCanvas(f.cv,1).toDataURL();};
/* 行動順・カットイン用の顔（ver0.18 の portrait と同じ呼び方） */
{const _po=portrait;portrait=function(key,opt,size,flip){const ck=key+'|'+(opt||'')+'|'+size+'|'+(flip?1:0);let c=POR19.get(ck);if(c)return c;
  const L=look(key,opt);if(!L)return _po(key,opt,size,flip);const sc=L.hum?1:Math.min(1,size*1.4/Math.max(L.R.wid||30,L.R.hgt||30)),h=headCanvas(key,opt,'',size,sc);
  c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(!L.hum)flip=!flip;if(flip){g.translate(size,0);g.scale(-1,1);}g.drawImage(h,0,0,size,size);POR19.set(ck,c);return c;};}
/* 会話の顔グラ：表情5種（通常・笑顔・怒り・悲しみ・驚き）。目・眉・口をリグで描き分け、記号を添える */
exprFace=function(id,ex='n'){const key=id+':'+ex;if(EXC19[key])return EXC19[key];const S=3,N=22,h=headCanvas(keyOfId(id),'',ex==='n'?'':ex,N);if(!h)return'';
 const c=document.createElement('canvas');c.width=c.height=N*S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle=(typeof EXBG!=='undefined'&&EXBG[ex])||'#1a2048';g.fillRect(0,0,c.width,c.height);for(let y=0;y<c.height;y+=S*2)for(let x=((y/(S*2))%2)*S*2;x<c.width;x+=S*4){g.fillStyle='rgba(255,255,255,.04)';g.fillRect(x,y,S*2,S*2);}
 g.drawImage(h,0,0,N*S,N*S);const M=(x,y,w,hh,col)=>{g.fillStyle=col;g.fillRect(x*S,y*S,w*S,hh*S);};
 if(ex==='h'){M(18,2,1,5,'#ffe27a');M(16,4,5,1,'#ffe27a');M(20,8,1,3,'#fff6c8');M(19,9,3,1,'#fff6c8');}
 if(ex==='a'){for(const[x,y]of[[17,2],[19,2],[17,4],[19,4]])M(x,y,1,1,'#ff5a5a');M(18,3,1,1,'#ff5a5a');M(16,3,1,1,'#c02a3a');M(20,3,1,1,'#c02a3a');}
 if(ex==='s'){M(18,4,1,1,'#bff4ff');M(17,5,3,2,'#7fd6ff');M(18,7,1,1,'#4aa0e0');}
 if(ex==='o'){M(18,2,2,5,'#ffe27a');M(18,8,2,2,'#ffe27a');M(17,2,1,5,'#a07a20');}
 return EXC19[key]=c.toDataURL();};
/* 古い16×16の顔データを捨てる（キャッシュ済みの画面が残らないように） */
try{for(const k in FACE18)delete FACE18[k];for(const k in ART18)delete ART18[k];if(typeof ARTC!=='undefined')for(const k in ARTC)delete ARTC[k];if(typeof EXC!=='undefined')for(const k in EXC)delete EXC[k];}catch(e){}
return{look,frame,headCanvas,walkPose};})();
