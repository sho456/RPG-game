/* ===== ドット絵刷新：提供原画から作ったスプライト（SPX）を、既存の描画の入口で差し替える =====
 データ：js/spx-data.js（tools/build_spx.py が自動生成。キャラ×サイズごとのパレット付き PNG アトラス）
 ・SPRX.info：対象キー（rio / wolf / boss9 とその派生）を新しいリグ「spx_○○」へ向ける
 ・SPRX.frame：新リグはアトラスから絵を選ぶ。味方はポーズの値から「構え・踏み込み・被弾…」の絵を選び、
   敵は 1 枚絵を、ポーズの値に合わせて整数ドットでずらす・傾ける（呼吸・踏み込み・のけぞり）
 ・サイズ：ドット絵を拡大・縮小せず、原画から別々に縮小して作った複数サイズから最も近いものを選ぶ
 ・ドット幅：戦闘中のキャラは 1 ドット = 端末の画素 round(dpr) 個（≒1 CSS px）にそろえる（旧リグも同じ幅で描き直す）
 ・探索・街（frameOf）、顔グラ（face / portrait / exprFace）、立ち絵（art）も新しい絵に差し替える */
const SPX=(()=>{
const D=typeof SPX_DATA!=='undefined'?SPX_DATA:{};
let ready=false;const atlas={};/* `${id}|${size}` → Image */
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const toHex=([r,g,b])=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
/* ---------- 読み込み（data URL の PNG。読み終わるまでは旧リグのまま） ---------- */
{const jobs=[];for(const id in D){const c=D[id];for(const sk in c.sizes)jobs.push([id+'|'+sk,c.sizes[sk].png]);if(c.heads)jobs.push([id+'|heads',c.heads.png]);}
 let left=jobs.length;if(!left)ready=false;
 for(const[k,src]of jobs){const im=new Image();im.onload=()=>{atlas[k]=im;if(--left===0){ready=true;onReady();}};im.onerror=()=>{console.error('SPX: 読み込み失敗',k);if(--left===0){ready=true;onReady();}};im.src=src;}}
/* ---------- キー → キャラ・色替え ---------- */
/* rio / rio_aw / tr_rio2 / tr_rio3 / wolf / vo_wolf / boss9 / ernaE・valkE（決闘の敵＝仲間と同じ絵） */
const ALIAS={ernaE:'erna',valkE:'valk'};
/* 敵（ver0.26）：同じ形の色違いは、原画 1 体＋パレットの写像（データの vars）で描く。[原画のid, 色替え] */
const FAM={slime:['slime',''],moss:['slime','moss'],cursedslime:['slime','cursedslime'],ironslime:['slime','ironslime'],iceslime:['slime','iceslime'],
 waterslime:['slime','waterslime'],lavaslime:['slime','lavaslime'],
 darkknight:['knight','darkknight'],drowned:['knight','drowned'],
 golemkin:['golem',''],boss2:['golem','boss2'],golemboss:['golem','golemboss'],tower10:['golem','tower10'],boss7:['golem','boss7'],last1:['golem','last1'],
 boss:['banjin',''],boss3:['banjin','boss3']};
/* 虚の回廊の番人（kb10, kb20…）：30層は刻喰らいの番人（専用色）、それ以外は元のボスの虚ろ化（灰色） */
function kbFam(key){const m=/^kb(\d+)$/.exec(key);if(!m)return null;const f=+m[1];if(f===30)return['golem','kb30'];
 const bk=[['golemboss'],['boss5'],['boss3'],['boss6']][(f/10-1)%4];const r=bk&&FAM[bk[0]];return r?[r[0],'void']:null;}
function parse(key){if(!key)return null;key=String(key).split('|')[0];let v='';if(ALIAS[key])key=ALIAS[key];
 if(key.startsWith('vo_')){v='void';key=key.slice(3);}
 {const kb=kbFam(key);if(kb)return D[kb[0]]?{id:kb[0],v:kb[1]}:null;}
 if(key.endsWith('k')&&FAM[key.slice(0,-1)])key=key.slice(0,-1);
 if(FAM[key]&&D[FAM[key][0]]){const[id,fv]=FAM[key];return{id,v:v||fv};}
 const tr=/^tr_([a-z]+?)(\d)$/.exec(key);if(tr){v='trial'+tr[2];key=tr[1];}
 if(key.endsWith('_aw')){v=v||'aw';key=key.slice(0,-3);}
 if(key.endsWith('k')&&!D[key]&&D[key.slice(0,-1)])key=key.slice(0,-1);
 return D[key]?{id:key,v}:null;}
/* 色替え（パレットの各色を写像）。星臨はビルド時に作った専用パレット、試練の幻影・虚蝕化は既存と同じ式 */
const mixHex2=(a,b,t)=>{const x=hex(a),y=hex(b);return toHex(x.map((v,i)=>v+(y[i]-v)*t));};
const ENEW=new Set(['slime','knight','golem','banjin']);
function palOf(id,v){const c=D[id],base=c.pal;
 if(v==='aw'&&c.palAw)return c.palAw;
 if(c.vars&&c.vars[v])return c.vars[v];
 if(v.startsWith('trial')){const f=v==='trial2'?.7:.55;return base.map((h,i)=>i===base.length-1?h:toHex(hex(mixHex2(h,'#5a2aa0',.55)).map(x=>x*f)));}
 if(v==='void'&&ENEW.has(id))return base.map((h,i)=>{if(i===base.length-1)return h;const[r,g,b]=hex(h),mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0,l=r*.3+g*.59+b*.11;
  if(s>.55&&mx>200)return'#e080ff';return toHex([l*.8+14,l*.74+8,Math.min(255,l*.95+30)]);});/* 新しい敵：灰色に沈め、目・核など強く光る色だけ紫に灯す */
 if(v==='void')return base.map((h,i)=>{if(i===base.length-1)return h;const[r,g,b]=hex(h),mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0,l=r*.3+g*.59+b*.11;
  if(s>.6&&r>g*1.6&&l>60&&l<200)return'#e080ff';return toHex([l*.8+14,l*.74+8,Math.min(255,l*.95+30)]);});
 return base;}
const RECOL=new Map();
function atlasCanvas(id,sk,v){const key=id+'|'+sk+'|'+v;let c=RECOL.get(key);if(c)return c;const im=atlas[id+'|'+sk];if(!im)return null;
 c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
 const p0=D[id].pal,p1=palOf(id,v);if(p1!==p0){const m=new Map();p0.forEach((h,i)=>{const a=hex(h);m.set((a[0]<<16)|(a[1]<<8)|a[2],hex(p1[i]));});
  const d=g.getImageData(0,0,c.width,c.height),px=d.data;for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const t=m.get((px[i]<<16)|(px[i+1]<<8)|px[i+2]);if(t){px[i]=t[0];px[i+1]=t[1];px[i+2]=t[2];}}g.putImageData(d,0,0);}
 RECOL.set(key,c);return c;}
/* ---------- 1 フレームの切り出し（反転・ずらし・傾け・呼吸を整数ドットで） ---------- */
const FC=new Map();let fcN=0;
/* 原画で右を向いているポーズ（ver0.26）：左右反転して、味方の立ち絵はすべて左（敵の側）を向かせる */
const FLIPF={gald:['stance','front','ready','hit','cast','weak','win','stand','walk_a','walk_b'],mire:['stance','guard','weak','hit','stand','walk_a','walk_b'],hakua:['weak'],shion:['weak'],valk:['hit']};
const flipOf=(id,name)=>{const l=FLIPF[id.replace(/_K$/,'')];return!!(l&&l.includes(name));};
function cut(id,sk,v,name,mirror,shear,breath,sq=0){const S=D[id].sizes[sk]||D[id].heads,fr=S.frames[name];if(!fr)return null;
 if(sk!=='heads'&&flipOf(id,name))mirror=!mirror;
 const key=[id,sk,v,name,mirror?1:0,shear,breath,sq].join('|');let f=FC.get(key);if(f){f.use=++fcN;return f;}
 const src=sk==='heads'?atlasCanvas(id,'heads',v):atlasCanvas(id,sk,v);if(!src)return null;const[sx,sy,w,h,ax,ay]=fr;
 const ex=Math.abs(shear),cw=w+ex,c=document.createElement('canvas');c.width=cw;c.height=h+(breath?0:0);const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(!shear&&!breath)g.drawImage(src,sx,sy,w,h,0,0,w,h);
 else{const split=Math.round(ay*.5);/* 呼吸：上半身（足元の高さの半分より上）を 1 ドット沈める */
  for(let y=0;y<h;y++){const off=shear?Math.round(shear*Math.max(0,ay-y)/Math.max(1,ay)):0,dx=(shear<0?ex:0)+off;
   if(breath&&y<split){if(y===0)continue;g.drawImage(src,sx,sy+y-1,w,1,dx,y,w,1);}else g.drawImage(src,sx,sy+y,w,1,dx,y,w,1);}}
 let out=c,oax=ax+(shear<0?ex:0),oay=ay;
 /* つぶれ・伸び（スライム）：足元を固定し、高さを 5% 刻み・幅を 3.5% 刻みで最近傍に拡縮 */
 if(sq){const w2=Math.max(1,Math.round(cw*(1+.035*sq))),h2=Math.max(1,Math.round(c.height*(1-.05*sq))),s2=document.createElement('canvas');s2.width=w2;s2.height=h2;
  const g2=s2.getContext('2d');g2.imageSmoothingEnabled=false;g2.drawImage(c,0,0,w2,h2);oax=Math.round(oax*w2/cw);oay=Math.round(ay*h2/c.height);out=s2;}
 if(mirror){const cw=out.width,c=out;const m=document.createElement('canvas');m.width=cw;m.height=c.height;const mg=m.getContext('2d');mg.translate(cw,0);mg.scale(-1,1);mg.drawImage(c,0,0);out=m;oax=cw-1-oax;}
 f={cv:out,w:out.width,h:out.height,ax:oax,ay:oay,use:++fcN,spx:1};FC.set(key,f);
 if(FC.size>900){const arr=[...FC.entries()].sort((a,b)=>a[1].use-b[1].use);for(let i=0;i<300;i++)FC.delete(arr[i][0]);}
 return f;}
/* ---------- サイズの選択 ---------- */
function pickSize(id,target,kind,ui){const S=D[id].sizes;let best=null,bd=1e9;
 for(const sk in S){const t=sk[0];if(ui?!'bBu'.includes(t):(t!=='b'&&t!=='B'))continue;const d=S[sk].dots;
  const sc=ui?(d<=target*1.06?target-d:1e6+d):Math.abs(Math.log(d/target));if(sc<bd){bd=sc;best=sk;}}
 return best;}
/* ---------- 味方：ポーズの値 → 絵 ---------- */
const A2=a=>Array.isArray(a)?a:[0,0];
/* 星臨の 1 枚絵の動き（ポーズ名 → f＝前へ出る／l＝前傾（負はのけぞり）／y＝上下、ドット） */
const AWS={stance:{br:1,f:0,l:0,y:0},front:{f:0,l:0,y:0},back:{f:0,l:0,y:0},ready:{f:3,l:2,y:0},lunge:{f:5,l:4,y:0},dash:{f:3,l:5,y:0},
 cast:{f:0,l:-1,y:-2},win:{f:0,l:-1,y:-3},hit:{f:-3,l:-4,y:0},guard:{f:-1,l:-2,y:1},weak:{f:1,l:3,y:2}};
/* 原画に無いポーズの代わり（発動の構え→踏み込み、歩き 2 コマ目→1 コマ目） */
const FB={ready:['lunge','cast'],walk_b:['walk_a','stand'],walk_a:['stand'],guard:['stance'],weak:['hit'],win:['cast','front']};
function heroFrame(p){if(p.f)return p.f;const ta=p.ta||0,cr=p.cr||0,hF=A2(p.hF),hN=A2(p.hN),fF=A2(p.fF),y=p.y||0;
 if(ta>1)return'down';if(p.ex===1)return'hit';
 if(cr>=4.5&&ta>=.3&&p.ex!==2)return'weak';
 if(p.ex!==2&&(p.wa||0)>=1.7&&hN[0]<=-4&&cr>=1.5)return'guard';
 if(p.ex===2&&ta<0)return hF[1]<=-5?'win':'cast';
 if(hF[1]<=-4||hN[1]<=-4)return'cast';
 if(hN[0]<=-8)return'ready';
 if(ta>=.25){if(hF[0]<=-5)return'lunge';return fF[1]>1?'dash':'stance';}
 if(y<=-4)return'dash';
 return'stance';}
/* ---------- 敵：ポーズの値 → ずらし・傾け ---------- */
function monShape(p,hum){const pt=p.pt||0,ln=p.ln||0,lx=p.lx||0,ta=hum?(p.ta||0):0;
 return{dx:-(p.x||0)*1.6,dy:(p.y||0)*1.4+(p.by||0),shear:Math.round(pt*1.6+ln*1.2+lx*1.1+Math.max(-1,Math.min(1,ta))*7),breath:(p.br||0)>.5?1:0,sq:Math.max(-4,Math.min(4,Math.round((p.sq||0)*4)))};}
/* ---------- リグ登録 ---------- */
const RIGS={};
const DEF={rio:{base:'rio',wid:25,hgt:36},wolf:{base:'wolf',wid:72.5,hgt:43},boss9:{base:'wolf',wid:55,hgt:37},
 /* 敵（ver0.26）：wid＝原画の横幅（倍率 1 のドット数）。旧リグより 1.3 倍ほど大きく、提供原画の描き込みが見える大きさ。
    騎士は人型の骨格（踏み込み・斬りつけの振り付け）を流用し、絵は 1 枚絵を傾けて動かす */
 slime:{base:'slime',wid:42,hgt:45},knight:{base:'gald',wid:36,hgt:54},golem:{base:'golem',wid:62,hgt:79,nsc:.86},banjin:{base:'boss',wid:33,hgt:63}};
/* 仲間：元のリグを土台にし、背丈は元のリグの比（データ側のサイズも同じ比で作ってある） */
const HEROES=['gald','mire','shion','noah','erna','balza','crow','hakua','jin','celes','valk'];
function regRigs(){for(const id of HEROES)if(D[id]&&RIG[id]&&!DEF[id])DEF[id]={base:id,wid:25,hgt:RIG[id].hgt*36/37};
 for(const id in D){const d=DEF[id];if(!d||!RIG[d.base])continue;const name='spx_'+id;
  const R=Object.assign(Object.create(RIG[d.base]),{spx:id,wid:d.wid,hgt:d.hgt,step:D[id].kind==='hum'?100:120,nsc:d.nsc||1});
  RIGS[name]=R;RIG[name]=R;}
 /* 動き：味方は元のキャラの待機・構えを引き継ぐ。敵は 1 枚絵用の待機（呼吸）と、狼の攻撃の型を使う */
 for(const id of['rio',...HEROES])if(ANIM.IDLE[id]&&RIGS['spx_'+id])ANIM.IDLE['spx_'+id]=ANIM.IDLE[id];
 const mk=(per,ph=0)=>t=>(Math.sin((t/per+ph)*6.2832)+1)/2;
 ANIM.IDLE.spx_wolf=(t)=>{const b=mk(560)(t),g=(t%5200)<700;return{br:b>.5?1:0,pt:g?.6:0,x:g?-.6:0};};/* 荒い息。ときどき身を低くうなる */
 ANIM.IDLE.spx_boss9=(t)=>{const b=mk(1500)(t),g=(t%6100)<900;return{br:b>.55?1:0,pt:g?.8:0,y:0};};/* 深い呼吸。ときどき首を突き出す */
 for(const n of['spx_wolf','spx_boss9']){if(V19.MA.wolf)V19.MA[n]=V19.MA.wolf;if(ANIM.MST.wolf)ANIM.MST[n]=ANIM.MST.wolf;}
 /* 敵（ver0.26）：元の種族の待機（ぷるぷる・沈み込み・浮遊）と攻撃の型をそのまま使う */
 for(const id of['slime','knight','golem','banjin']){const n='spx_'+id,b=DEF[id].base;if(!RIGS[n])continue;
  if(ANIM.IDLE[b])ANIM.IDLE[n]=ANIM.IDLE[b];if(V19.MA[b])V19.MA[n]=V19.MA[b];if(ANIM.MST[b])ANIM.MST[n]=ANIM.MST[b];}
 /* 黒炎竜：旧リグ（狼の骨格＋竜の派生形）への振り分けを外す。大きさの倍率はそのまま */
 if(ANIM.KIND.boss9)ANIM.KIND.boss9={sc:ANIM.KIND.boss9.sc||2.3};}
/* ---------- 入口の差し替え ---------- */
let BAT=false;/* 戦闘画面を描いている最中か（ドット幅の変換を行う） */
const Q=()=>Math.max(1,Math.round(window.devicePixelRatio||1));
const P=()=>Math.max(1,Math.round(PXL*(cv.width/W)));
const _info=SPRX.info,_frame=SPRX.frame,_white=SPRX.white;
/* 白抜き（被弾の点滅）：新しい絵は元の絵ごとに控え、ドット幅の印も引き継ぐ */
SPRX.white=function(f){if(!f||!f.spx)return _white(f);const c=f.cv;if(!c._wh)c._wh=PX.whiteOf(c);if(c._spx)c._wh._spx=c._spx;return c._wh;};
SPRX.info=function(key){const r=ready&&parse(key);if(r&&RIGS['spx_'+r.id])return{rig:'spx_'+r.id,pal:null};return _info(key);};
SPRX.frame=function(name,pose,palKey,pal,flip,sc=1,extra=''){const R=RIG[name];
 if(R&&R.spx){const id=R.spx,c=D[id],pk=parse(palKey)||{id,v:''},hum=c.kind==='hum';
  const k=BAT?P()/Q():1,target=(hum?R.hgt:R.wid)*sc*k,sk=pickSize(id,target,'b',!BAT);if(!sk)return null;
  const mirror=(c.face==='R')!==!!flip;let name2,sh=0,br=0,dx=0,dy=0,sq=0;
  /* 星臨：原画の「覚醒した姿」（別データ <id>_K）を、ポーズに合わせて整数ドットで動かす。倒れだけは通常の絵（星臨の配色） */
  if(hum&&pk.v==='aw'&&D[id+'_K']&&D[id+'_K'].sizes[sk]){const n0=heroFrame(pose||{});
   if(n0!=='down'){const a=AWS[n0]||AWS.stance,kid=id+'_K';br=(a.br&&(pose.br||0)>.5)?1:0;
    const f=cut(kid,sk,'','awk',mirror,-a.l,br);if(f){const dX=(pose.x||0)*(flip?-1:1)+(flip?1:-1)*a.f;
     const o=Object.create(f);o.ax=f.ax-Math.round(dX);o.ay=f.ay-Math.round(a.y);if(BAT)f.cv._spx={ax:o.ax,ay:o.ay};return o;}}}
  if(hum){name2=heroFrame(pose||{});const fs=c.sizes[sk].frames;if(!fs[name2])name2=(FB[name2]||[]).find(n=>fs[n])||'stance';br=(name2==='stance'&&(pose.br||0)>.5)?1:0;dx=(pose.x||0)*(flip?-1:1);}
  else{name2='idle';const m=monShape(pose||{},R.type==='hum');sh=Math.max(-6,Math.min(6,m.shear))*(c.face==='R'?1:-1);br=m.breath;dx=m.dx*(flip?1:-1);dy=m.dy;sq=m.sq;}
  const f=cut(id,sk,pk.v,name2,mirror,sh,br,sq);if(!f)return null;
  const o=Object.create(f);o.ax=f.ax-Math.round(dx);o.ay=f.ay-Math.round(dy);if(BAT)f.cv._spx={ax:o.ax,ay:o.ay};return o;}
 if(BAT){/* 旧リグ：同じ見た目の大きさのまま、1 ドット＝round(dpr) 画素で描き直す */
  const k=P()/Q();if(k>1.01){const f=_frame.call(this,name,pose,palKey,pal,flip,sc*k,extra);if(f)f.cv._spx={ax:f.ax,ay:f.ay};return f;}}
 return _frame.apply(this,arguments);};
/* 戦闘キャンバスへの描画：印の付いた絵は、足元を基準に 1 ドット＝round(dpr) 画素で置き直す。
   1:1 の写し（白抜き・消滅演出）には印を引き継ぐ */
{const _di=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(img){const m=img&&img._spx,n=arguments.length;
  if(m){if(n===5&&this===ctx&&scene==='battle'){const a=arguments[1],b=arguments[2],p=arguments[3]/img.width,q=Q();
    if(p>0&&Math.abs(p-q)>.01){const X0=a+m.ax*p,Y0=b+m.ay*p;return _di.call(this,img,Math.round(X0-m.ax*q),Math.round(Y0-m.ay*q),img.width*q,img.height*q);}}
   else if(n===3&&arguments[1]===0&&arguments[2]===0&&this.canvas&&this.canvas.width===img.width&&this.canvas.height===img.height)this.canvas._spx=m;}
  return _di.apply(this,arguments);};}
{const _d=draw;draw=function(){BAT=scene==='battle';try{return _d.apply(this,arguments);}finally{BAT=false;}};}
/* 味方の背丈：画面幅の約 13.8%（提供原画の描き込みが見える大きさ。ver0.25 の 11.2% から引き上げ） */
if(typeof V23!=='undefined'&&V23.HK23&&V23.HK23.placeHeroes){const HK=V23.HK23,_ph=HK.placeHeroes;HK.placeHeroes=(hs,LY)=>{const a=V23.appW;V23.appW=()=>a()*1.23;try{return _ph(hs,LY);}finally{V23.appW=a;}};}
/* ---------- 探索・街：frameOf（{c,W,H,ax,ay}） ---------- */
function fieldFrame(key,anim,i,opt){const r=parse(key);if(!r)return null;const c=D[r.id],sk=Object.keys(c.sizes).find(s=>s[0]==='f');if(!sk)return null;
 let o={};try{o=opt?JSON.parse(opt):{};}catch(e){}const v=r.v||(o.aw?'aw':'');let name='idle',br=0;
 if(c.kind==='hum'){const fr=c.sizes[sk].frames;
  if(anim==='walk')name=['walk_a','stand','walk_b','stand'][((i%4)+4)%4];
  else if(anim==='win')name='win';else if(anim==='atk')name='lunge';else if(anim==='hurt')name='hit';else if(anim==='charge'||anim==='awaken')name='cast';
  else{name=o.noW?'stand':'front';br=(i&1)&&!o.noW?0:(i&1);}
  if(!fr[name])name=(FB[name]||[]).find(n=>fr[n])||'stand';}
 else br=i&1;
 const f=cut(r.id,sk,v,name,false,0,br);return f?{c:f.cv,W:f.w,H:f.h,ax:f.ax,ay:f.ay}:null;}
/* ---------- 顔グラ・立ち絵 ---------- */
const UIC={};
function headCv(id,v,n){if(v==='aw'&&D[id+'_K']&&D[id+'_K'].heads)return cut(id+'_K','heads','',String(n),false,0,0);return cut(id,'heads',v,String(n),false,0,0);}
function artCv(id,v){if(v==='aw'&&D[id+'_K']){const kid=id+'_K',sk=pickSize(kid,54,'b',false);if(sk)return cut(kid,sk,'','awk',false,0,0);}
 const c=D[id],sk=pickSize(id,54,'b',false)||Object.keys(c.sizes)[0];return cut(id,sk,v,c.kind==='hum'?'front':'idle',false,0,0);}
/* 図鑑の絵（48×48、下揃え）を新しい原画から。読むときに作る */
function zReg(k){if(typeof ZIMG==='undefined')return;const r=parse(k);if(!r||D[r.id].kind==='hum')return;const zk=Object.keys(D[r.id].sizes).find(s=>s[0]==='z');if(!zk)return;
 const mkz=sil=>{const f=cut(r.id,zk,r.v,'idle',false,0,0);if(!f)return'';const cv=document.createElement('canvas');cv.width=cv.height=48;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(f.cv,Math.round(24-f.w/2),Math.round(47-f.h));return(sil?PX.whiteOf(cv):cv).toDataURL();};
 for(const sil of[0,1]){const zz=k+(sil?'_w':'');try{delete ZIMG[zz];}catch(e){}let v=null;
  Object.defineProperty(ZIMG,zz,{configurable:true,enumerable:true,get(){return v===null?(v=mkz(sil)):v;},set(x){v=x;}});}}
function onReady(){
 regRigs();
 {const _fo=frameOf;frameOf=function(key,anim='idle',i=0,opt=''){try{const f=fieldFrame(key,anim,i,opt);if(f)return f;}catch(e){console.error(e);}return _fo(key,anim,i,opt);};}
 {const _f=face;face=function(id,aw){const r=parse(id);if(!r||D[r.id].kind!=='hum')return _f(id,aw);const k='f|'+id+(aw?'_aw':'');if(UIC[k])return UIC[k];const h=headCv(r.id,aw?'aw':r.v,20);return UIC[k]=h?h.cv.toDataURL():_f(id,aw);};}
 {const _a=art;art=function(id,aw){const r=parse(id);if(!r)return _a(id,aw);const k='a|'+id+(aw?'_aw':'');if(UIC[k])return UIC[k];const f=artCv(r.id,aw?'aw':r.v);if(!f)return _a(id,aw);
   const c=document.createElement('canvas');c.width=f.w+2;c.height=f.h+2;c.getContext('2d').drawImage(f.cv,1,1);return UIC[k]=c.toDataURL();};}
 {const _p=portrait;portrait=function(key,opt,size,flip){const r=parse(key);if(!r||D[r.id].kind!=='hum')return _p(key,opt,size,flip);let o={};try{o=opt?JSON.parse(opt):{};}catch(e){}
   const n=size>=48?48:size>=22?22:20,h=headCv(r.id,o.aw?'aw':r.v,n);if(!h)return _p(key,opt,size,flip);const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   if(flip){g.translate(size,0);g.scale(-1,1);}g.drawImage(h.cv,Math.floor((size-n)/2),Math.floor((size-n)/2));return c;};}
 {const _e=exprFace;exprFace=function(id,ex='n'){const r=parse(id);if(!r||D[r.id].kind!=='hum')return _e(id,ex);const key='e|'+id+':'+ex;if(UIC[key])return UIC[key];const h=headCv(r.id,r.v,22);if(!h)return _e(id,ex);
   const S=3,N=22,c=document.createElement('canvas');c.width=c.height=N*S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   g.fillStyle=(typeof EXBG!=='undefined'&&EXBG[ex])||'#1a2048';g.fillRect(0,0,c.width,c.height);for(let y=0;y<c.height;y+=S*2)for(let x=((y/(S*2))%2)*S*2;x<c.width;x+=S*4){g.fillStyle='rgba(255,255,255,.04)';g.fillRect(x,y,S*2,S*2);}
   g.drawImage(h.cv,0,0,N*S,N*S);const M=(x,y,w,hh,col)=>{g.fillStyle=col;g.fillRect(x*S,y*S,w*S,hh*S);};
   if(ex==='h'){M(18,2,1,5,'#ffe27a');M(16,4,5,1,'#ffe27a');M(20,8,1,3,'#fff6c8');M(19,9,3,1,'#fff6c8');}
   if(ex==='a'){for(const[x,y]of[[17,2],[19,2],[17,4],[19,4]])M(x,y,1,1,'#ff5a5a');M(18,3,1,1,'#ff5a5a');M(16,3,1,1,'#c02a3a');M(20,3,1,1,'#c02a3a');}
   if(ex==='s'){M(18,4,1,1,'#bff4ff');M(17,5,3,2,'#7fd6ff');M(18,7,1,1,'#4aa0e0');}
   if(ex==='o'){M(18,2,2,5,'#ffe27a');M(18,8,2,2,'#ffe27a');M(17,2,1,5,'#a07a20');}
   return UIC[key]=c.toDataURL();};}
 /* 古い絵で作られた立ち絵・顔の控えを捨て、図鑑の絵も作り直す */
 try{for(const id in D){for(const k of[id,id+'_aw'])if(typeof ZIMG!=='undefined'){delete ZIMG[k];delete ZIMG[k+'_w'];}}}catch(e){}
 try{if(typeof ZIMG!=='undefined')for(const id in D){if(id.endsWith('_K'))continue;const c=D[id],zk=Object.keys(c.sizes).find(s=>s[0]==='z');
   const mk=sil=>{const f=c.kind==='hum'?artCv(id,''):(zk?cut(id,zk,'','idle',false,0,0):artCv(id,''));if(!f)return'';const cv=document.createElement('canvas');cv.width=cv.height=48;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    const s=Math.min(1,46/Math.max(f.w,f.h));if(s<1){/* 大きすぎる場合は 48 用の顔を使う */const h=headCv(id,'',48);if(h){g.drawImage(h.cv,0,0);return(sil?PX.whiteOf(cv):cv).toDataURL();}}
    g.drawImage(f.cv,Math.round(24-f.w/2),Math.round(47-f.h));return(sil?PX.whiteOf(cv):cv).toDataURL();};
   ZIMG[id]=mk(0);ZIMG[id+'_w']=mk(1);}}catch(e){console.error(e);}
 /* 敵の色違い（苔スライム・亡霊騎士・黒鉄の巨像…）と虚ろ化：図鑑の絵も新しい原画から。後から作られる虚ろ化・回廊の番人も同じ */
 try{const keys=new Set(Object.keys(FAM));if(typeof ED!=='undefined')for(const k in ED)keys.add(k);for(const k of keys)zReg(k);}catch(e){console.error(e);}
 if(typeof voidKind==='function'){const _vk=voidKind;voidKind=function(k){const vk=_vk.apply(this,arguments);try{zReg(vk);}catch(e){}return vk;};}
 if(typeof kBoss==='function'){const _kb=kBoss;kBoss=function(f){const k=_kb.apply(this,arguments);try{zReg(k);}catch(e){}return k;};}
 /* すでに設定済みのユニットは作り直す（読み込み前に作られた旧リグの設定を捨てる） */
 try{if(typeof B!=='undefined'&&B)[...B.heroes,...B.enemies].forEach(u=>{if(parse(sprKey(u))||parse(u.spr))u.A=null;});}catch(e){}
}
return{get ready(){return ready;},parse,heroFrame,pickSize,D,cut,palOf};})();
/* ver0.26：敵のドット絵を提供原画へ（スライム・騎士・ゴーレム・番人の系統）、味方の立ち絵を左向きにそろえる */
const VER26='ver0.26';
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER26;};const v=$('#verL');if(v)v.textContent=VER26;}
try{document.title='アストラル・ブレイカー '+VER26;}catch(e){}
