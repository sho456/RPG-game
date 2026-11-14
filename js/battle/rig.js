/* ===== ver0.35 1 枚絵を曲げて動かす（BXR） =====
 味方の絵は「正面・待機・戦闘不能」の 3 枚だけなので、待機の 1 枚を変形して動きを作る。
 ■ 変形の値（ポーズに書く。ANIM.to で補間される。単位はドット。「前」＝相手のいる向き）
   mL 全身の傾き（足元を固定して頭が前へ。負でのけぞり）　mB 腰から上だけの曲げ（前かがみ。負で胸を張る）
   mS つぶれ（正でしゃがむ・負で伸び上がる。-4〜4）　　　 mR 回転（度。正で後ろへ倒れる。足元が軸）
   mF 前へ出る　mU 上へ浮く
 ■ 従来の振り付け（js/ver19.js）のポーズも、ここで「構え・踏み込み・詠唱・被弾・防御・瀕死・勝利」の変形に読み替える（POSE）。
   キャラごとの重さ・しなやかさ（CH）で大きさが変わる
 ■ 連続コマの原画が入ったポーズは、そちらが優先される（素材にそのポーズ名の絵があれば変形しない）
 絵の変形はコードで行っている（画像生成は使っていない） */
'use strict';
const BXR=(()=>{
const MF=['mL','mB','mS','mR','mF','mU'],Z={mL:0,mB:0,mS:0,mR:0,mF:0,mU:0};
const has=p=>!!(p&&(p.mL||p.mB||p.mS||p.mR||p.mF||p.mU));
/* 従来のポーズ名 → 変形 */
const POSE={ready:{mL:-2,mB:-1,mS:1,mF:-2},lunge:{mL:3,mB:4,mS:-1,mF:6},dash:{mL:4,mB:2,mF:3},cast:{mL:-1,mB:-2,mS:-2,mU:2},win:{mB:-2,mS:-2,mU:3},
 hit:{mL:-5,mB:-2,mF:-3,mR:6},guard:{mL:-2,mS:2,mF:-1},weak:{mL:1,mB:4,mS:3}};
/* キャラごとの癖：w 重さ（大きいほど傾きが小さく沈みが深い）　f しなやかさ（曲げの倍率）　wy 腰の高さ（上からの割合） */
const CH={rio:{w:1,f:1},gald:{w:1.5,f:.6},mire:{w:.8,f:.9},shion:{w:.6,f:1.4},noah:{w:.9,f:.7},erna:{w:.8,f:1.1},balza:{w:1.6,f:.7},crow:{w:.9,f:1.2},hakua:{w:.7,f:1.3},jin:{w:1.1,f:1},celes:{w:.7,f:.8},valk:{w:1.4,f:.8}};
const chOf=id=>CH[id]||{w:1,f:1};
/* 従来のポーズの値 → ポーズ名（js/sprite/spx.js の heroFrame と同じ決まり） */
const A2=a=>Array.isArray(a)?a:[0,0];
function nameOf(p){const ta=p.ta||0,cr=p.cr||0,hF=A2(p.hF),hN=A2(p.hN),fF=A2(p.fF),y=p.y||0;
 if(ta>1)return'down';if(p.ex===1)return'hit';if(cr>=4.5&&ta>=.3&&p.ex!==2)return'weak';if(p.ex!==2&&(p.wa||0)>=1.7&&hN[0]<=-4&&cr>=1.5)return'guard';
 if(p.ex===2&&ta<0)return hF[1]<=-5?'win':'cast';if(hF[1]<=-4||hN[1]<=-4)return'cast';if(hN[0]<=-8)return'ready';
 if(ta>=.25){if(hF[0]<=-5)return'lunge';return fF[1]>1?'dash':'stance';}if(y<=-4)return'dash';return'stance';}

/* ---------- 変形 ---------- */
const CACHE=new WeakMap();let made=0;
const q=(v,lo,hi,st=1)=>Math.max(lo,Math.min(hi,Math.round((v||0)/st)*st));
/* b＝元の絵 {cv,w,h,ax,ay}。fwd＝画面での前（-1 左・1 右）。腰より上を曲げ → 全身を傾け → つぶし → 回す */
function deform(b,L,Bd,S,Rt,fwd,wy){let m=CACHE.get(b.cv);if(!m){m=new Map();CACHE.set(b.cv,m);}const key=L+'|'+Bd+'|'+S+'|'+Rt+'|'+fwd;let f=m.get(key);if(f)return f;
 if(m.size>260)m.clear();made++;
 const w=b.w,h=b.h,ay=Math.max(1,Math.min(h,b.ay)),split=Math.round(h*wy),pad=Math.abs(L)+Math.abs(Bd)+1;
 let c=document.createElement('canvas');c.width=w+pad*2;c.height=h;let g=c.getContext('2d');g.imageSmoothingEnabled=false;
 for(let y=0;y<h;y++){const o1=Math.round(L*Math.max(0,ay-y)/ay),o2=y<split?Math.round(Bd*(split-y)/Math.max(1,split)):0;g.drawImage(b.cv,0,y,w,1,pad+(o1+o2)*fwd,y,w,1);}
 let ax=b.ax+pad,ay2=b.ay;
 if(S){const w2=Math.max(1,Math.round(c.width*(1+.035*S))),h2=Math.max(1,Math.round(h*(1-.05*S))),s=document.createElement('canvas');s.width=w2;s.height=h2;const g2=s.getContext('2d');g2.imageSmoothingEnabled=false;g2.drawImage(c,0,0,w2,h2);
  ax=Math.round(ax*w2/c.width);ay2=Math.round(ay2*h2/h);c=s;}
 if(Rt){const r=Math.ceil(Math.hypot(Math.max(ax,c.width-ax),Math.max(ay2,c.height-ay2)))+1,o=document.createElement('canvas');o.width=o.height=r*2;const g3=o.getContext('2d');g3.imageSmoothingEnabled=false;
  g3.translate(r,r);g3.rotate(-fwd*Rt*Math.PI/180);g3.drawImage(c,-ax,-ay2);c=o;ax=r;ay2=r;}
 f={cv:c,w:c.width,h:c.height,ax,ay:ay2,spx:1};m.set(key,f);return f;}

/* ---------- 絵の入口（SPRX.frame）に差し込む ---------- */
{const _fr=SPRX.frame;
 SPRX.frame=function(name,pose,palKey,pal,flip,sc=1,extra=''){const R=RIG[name];if(!R||!R.spx||!pose)return _fr.apply(this,arguments);
  const id=R.spx,d=typeof SPX_DATA!=='undefined'?SPX_DATA[id]:null,hum=d&&d.kind==='hum';let p=pose,m=null;
  if(hum){/* 味方：従来のポーズ名を変形へ読み替える（その名前の絵が素材にあれば、絵を優先） */
   if(has(pose))m=pose;else if(!pose.f||POSE[pose.f]){const n=pose.f||nameOf(pose),fs=Object.values(d.sizes)[0].frames;if(POSE[n]&&!fs[n]&&!(d.anims&&d.anims[n])){const c=chOf(id),P0=POSE[n];
     m={mL:(P0.mL||0)/c.w*c.f,mB:(P0.mB||0)*c.f,mS:(P0.mS||0)*Math.min(1.3,c.w),mR:(P0.mR||0)/c.w,mF:(P0.mF||0)/Math.sqrt(c.w),mU:(P0.mU||0)/c.w};}}
   if(!m)return _fr.apply(this,arguments);
   p=Object.assign({},pose);for(const k of MF)delete p[k];p.f=pose.f&&!POSE[pose.f]?pose.f:'stance';p.ta=0;p.cr=0;p.ex=0;}
  else{if(!has(pose))return _fr.apply(this,arguments);m=pose;p=Object.assign({},pose);for(const k of MF)delete p[k];}
  const b=_fr.call(this,name,p,palKey,pal,flip,sc,extra);if(!b)return b;
  const L=q(m.mL,-9,9),Bd=q(m.mB,-8,8),S=q(m.mS,-4,4),Rt=q(m.mR,-180,180,5),dF=Math.round(m.mF||0),dU=Math.round(m.mU||0);
  let fwd=flip?1:-1;try{fwd=FACING.isRight(palKey,flip?1:0)?1:-1;}catch(e){}
  let f=b;if(L||Bd||S||Rt)f=deform({cv:b.cv,w:b.w,h:b.h,ax:Object.getPrototypeOf(b).ax==null?b.ax:Object.getPrototypeOf(b).ax,ay:Object.getPrototypeOf(b).ay==null?b.ay:Object.getPrototypeOf(b).ay},L,Bd,S,Rt,fwd,(SKW[id]||(hum?.56:.5)));
  const o=Object.create(f);const bx=f===b?0:b.ax-(Object.getPrototypeOf(b).ax==null?b.ax:Object.getPrototypeOf(b).ax),by=f===b?0:b.ay-(Object.getPrototypeOf(b).ay==null?b.ay:Object.getPrototypeOf(b).ay);
  o.ax=f.ax+bx-dF*(flip?1:-1);o.ay=f.ay+by+dU;f.cv._spx={ax:o.ax,ay:o.ay};return o;};}
const SKW={};/* 腰の高さの上書き（キャラ id → 上からの割合） */

/* ---------- 補間：変形の値が途中で消えないように、0 を補う ---------- */
{const _to=ANIM.to;ANIM.to=function(u,pose,ms,ease){try{const A=ANIM.setup(u);if(A&&!A.none&&(has(pose)||has(A.cur))){A.cur=Object.assign({},Z,A.cur||ANIM.base(A));pose=Object.assign({},Z,pose);}}catch(e){}return _to.call(this,u,pose,ms,ease);};}
return{MF,Z,POSE,CH,SKW,has,nameOf,deform,get made(){return made;}};})();
