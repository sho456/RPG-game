/* ===== 戦闘の行動演出：ロマサガRS の流れ（ver0.42。正本） =====
 参考動画（RS の技「地走連刃」1 回分）を 0.05 秒ごとに分解して決めた流れ：
  1. 技名の吹き出し  ：行動するキャラの頭の上に白い吹き出し「技名！」がポンと出て、約 0.9 秒で消える（以前の画面上部の帯は廃止）
  2. 暗転            ：技・術の間は戦場が少し暗くなり、エフェクトだけが明るく見える。行動が終わると戻る
  3. 予備動作        ：その場で一歩前へ。足元に属性の色の光の輪・立ち上る光
  4. 発動            ：振り抜き → 地を這う衝撃（属性の色の光の塊）が敵へ走る。連撃は 1 撃ごとに繰り返す
  5. 命中            ：敵の上で大きな閃光と衝撃の輪・火花、ヒットストップと揺れ。会心は強め
  6. 数字            ：「Critical」（金の斜体）の下に、斜体の数字が 1 桁ずつ弾んで出る（js/v24.js dmgPop・css/ui/battle-flow.css）
  7. 撃破            ：敵が赤く染まり、赤い粒になって崩れる（js/ver19.js dissolve）
  8. 余韻            ：元の位置へ戻り、暗転が明ける
 ・技ごとの専用の演出（js/battle/data/fx-heroes-*.js）がある技は、それを使う（3〜5 だけ専用、1・2・6〜8 は共通）
 ・連撃数（○HITS）の表示は動画に無いので出さない */
'use strict';
const BFLOW=(()=>{
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inB=()=>typeof scene!=='undefined'&&scene==='battle'&&!!B;
const plain=sk=>!sk||sk.basic||['guard','item'].includes(sk.k);

/* ---------- 1. 技名の吹き出し ---------- */
let BUB=null;
function bubble(u,name){if(!inB()||!u||!name)return;const host=$('#pops');if(!host)return;close(true);
 const el=document.createElement('div');el.className='bub42'+(u.side?' e':'');el.innerHTML=`<b>${esc(name)}！</b>`;host.appendChild(el);
 BUB={el,u,t0:performance.now()};place();
 clearTimeout(bubble._t);bubble._t=setTimeout(()=>close(),Math.round(900*(ANIM.SP?ANIM.SP():1)));/* すぐ消す（ver0.43） */}
function place(){if(!BUB)return;const cv=$('#cv');if(!cv||!BUB.el.isConnected){BUB=null;return;}const k=cv.offsetWidth/W,[x,y]=BX.at(BUB.u,'head');
 BUB.el.style.left=Math.round(x*k)+'px';BUB.el.style.top=Math.round(y*k-6)+'px';}
function close(now){if(!BUB)return;const el=BUB.el;BUB=null;if(now){el.remove();return;}el.classList.add('out');setTimeout(()=>el.remove(),220);}

/* ---------- 2. 暗転・吹き出しを行動の間だけ ---------- */
/* 行動の番号（AID）：ダメージ表示（js/v24.js dmgPop）は同じ行動のヒットを 1 つにまとめ、行動の間は数字を残す */
let AID=0,BUSY=0;
{const _da=doAction;doAction=async function(u,sk,t){const on=inB()&&!plain(sk)&&!(B.opts&&B.opts.viewer&&B.opts.noDim);const id=++AID;BUSY++;
  if(on){try{BX.dim(.42,200);}catch(e){}}
  try{return await _da.apply(this,arguments);}
  finally{BUSY=Math.max(0,BUSY-1);if(on){try{BX.dim(0,280);}catch(e){}}close();try{V24.actEnd(id);}catch(e){}}};}

/* ---------- 3〜5. 技・術の共通の演出（専用の演出が無い技） ---------- */
const EL=s=>s&&s.el||'斬';
const big=c=>!!(c.r&&c.r.crit);
const IMPACT=c=>[[0,'fx','flare',{on:'t',ramp:EL(c.sk),s:big(c)?2.8:2.1,rays:10,len:13,dur:260}],[0,'fx','shock',{on:'t',ramp:EL(c.sk),r1:big(c)?34:26,thick:2,dur:320}],
 [0,'fx','sparks',{on:'t',ramp:EL(c.sk),n:big(c)?12:8,spread:3.1}],[0,'flash','#fff6c8',big(c)?6:3],[0,'shake',big(c)?6:3],[0,'stop',big(c)?110:60]];
const PRE=(dx)=>({ms:380,do:[[0,'pose',{mL:-2,mB:-1,mF:-2},150],[0,'fx','circle',{on:'af',ramp:'陽',r:15,sq:.32,dur:560}],[60,'fx','rise',{on:'af',ramp:'陽',n:8,w:12,dur:440}],
 [150,'move',{to:'fwd',d:dx},140,'out']]});
const AFTER={ms:300,do:[[0,'move',{to:'home'},240,'io'],[0,'pose',{},220]]};
/* 技（物理）：振り抜き → 地を這う衝撃が敵へ */
const PHYS={kind:'cast',big:1,pre:PRE(6),
 strike:c=>({ms:330,do:[[0,'pose',{mL:-3,mB:-2,mS:1,mF:-3},130],[130,'pose',{mL:3,mB:4,mS:-1,mF:6},60,'in'],
  [140,'fx','crescent',{on:'a',dx:12,ramp:EL(c.sk),r:17,w:3.6,sq:.5,a0:-.4,a1:3.4,dur:240}],
  [160,'fx','proj',{on:'af',to:'tf',ms:170,ramp:EL(c.sk),kind:'orb',arc:0,s:1.5}],[160,'fx','dust',{on:'af',dx:8,n:6,dir:1}]]}),
 impact:IMPACT,after:AFTER};
/* 弓の技：引き絞る → 矢が敵へ */
const BOW={kind:'cast',big:1,pre:PRE(4),
 strike:c=>({ms:300,do:[[0,'pose',{f:'cast'},140],[160,'fx','proj',{on:'a',to:'t',ms:150,ramp:EL(c.sk),kind:'arrow',s:1.3}],[160,'fx','speedlines',{n:10,col:'#fff6c8',dur:160}]]}),
 impact:IMPACT,after:AFTER};
/* 技の振り分け：弓の使い手は矢、それ以外は振り抜き（武器種は実行時に見る。RSD はこのファイルより後に読み込まれる） */
const isBow=c=>{try{return((RSD.HERO[c.a.id]||{}).w)==='弓';}catch(e){return false;}};
const ATK={kind:'cast',big:1,pre:PRE(6),strike:c=>(isBow(c)?BOW:PHYS).strike(c),impact:IMPACT,after:AFTER};
/* 術：構えて掲げる → 光の弾が敵へ */
const MAG={kind:'cast',big:1,pre:{ms:460,do:[[0,'pose',{f:'cast'},180],[0,'fx','circle',{on:'af',ramp:'陽',r:16,sq:.32,style:1,dur:700}],[80,'fx','gather',{on:'a',ramp:'陽',dur:360}]]},
 strike:c=>({ms:260,do:[[0,'pose',{f:'cast'},80],[60,'fx','proj',{on:'a',to:'t',ms:190,ramp:EL(c.sk),kind:'orb',arc:2,s:1.6}]]}),
 impact:IMPACT,after:AFTER};
function regAll(){try{for(const id in HB){if(!BXS.REG[id+':cat:phys_attack'])BXS.def(id+':cat:phys_attack',ATK);if(!BXS.REG[id+':cat:mag_attack'])BXS.def(id+':cat:mag_attack',MAG);}}catch(e){console.error(e);}}
regAll();

/* ---------- 0. 戦闘開始の見出し（ロマサガRS：金の毛筆「戦闘開始」が横に流れて消える。ver0.45） ---------- */
function startBanner(){const st=$('#stage');if(!st||!inB()||(B.opts&&B.opts.viewer))return;const o=document.createElement('div');o.className='bs45';o.innerHTML='<b>戦闘開始</b>';st.appendChild(o);
 setTimeout(()=>o.remove(),Math.round(1300*(ANIM.SP?ANIM.SP():1)));}
{const _sb=startBattle;startBattle=function(list,opts){const r=_sb.apply(this,arguments);try{if(!(opts&&opts.viewer)&&!(opts&&opts.noStartBanner))setTimeout(startBanner,120);}catch(e){}return r;};}

/* ---------- 毎フレーム：吹き出しをキャラに合わせる ---------- */
{const _d=draw;draw=function(){_d();if(BUB){if(!inB())close(true);else place();}};}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle')close(true);};}
return{bubble,close,PHYS,BOW,MAG,aid:()=>AID,busy:()=>BUSY>0};})();
