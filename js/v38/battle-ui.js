/* ===== ver0.38 戦闘画面 =====
 1. 配置：ver0.66 から 2D-HD。敵は奥の列・味方は手前の列に、それぞれ横一列（カメラは js/battle/hd2d.js）
 2. 画面を広く：戦場は画面の高さいっぱい。上は細い帯（ターン・対象・弱点／耐性・速度・メニュー）、下は AUTO の帯だけ
    （行動順のアイコンは ver0.39 で削除）
 3. コマンド入力中は「戦場ごと上へスライド」して、下半分にコマンド欄を出す（ロマサガRS の見せ方）。
    最後の 1 人のコマンドを決めると、コマンド欄が下へ抜け、戦場が元の位置へ滑らかに戻って行動が始まる
 4. 倍速ボタンは画面上の 1 つだけ（下の帯の倍速は削除）
 5. 味方の HP・BP はターンの始めの 1.6 秒だけキャラの横に出す（ver0.44）。瀕死は赤、気絶は LP を表示 */
'use strict';
const V38B=(()=>{
const D=RSD,C=RSC,{HK23}=V23;
const app=$('#app'),stage=()=>$('#stage');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inB=()=>scene==='battle'&&!!B;
app.classList.add('v38');

/* ==================== 1. 画面の寸法 ==================== */
/* 上の帯の下端・下の帯の上端・コマンド欄の高さ（画面 px） */
function geo(){const st=stage(),sh=st?st.offsetHeight:innerHeight,hd=$('#bt22 .b22hd');let top=96;if(hd&&hd.offsetParent)top=hd.offsetTop+hd.offsetHeight;
 const bb=$('#bbar'),bar=bb&&bb.offsetParent?Math.max(44,sh-bb.offsetTop):52,pan=Math.round(clamp(sh*.46,318,430));
 const fullBot=sh-bar-6,inTop=top+4,inBot=sh-pan-6,bh=Math.max(150,Math.min(fullBot-top-8,inBot-inTop)),cf=(top+fullBot)/2,ci=(inTop+inBot)/2;
 return{sh,top,bar,pan,bandTop:cf-bh/2,bandBot:cf+bh/2,slide:Math.max(0,Math.round(cf-ci))};}
let GEO=null;
HK23.hudPx=()=>{GEO=geo();app.style.setProperty('--p38',GEO.pan+'px');app.style.setProperty('--sl38',-GEO.slide+'px');return Math.round(GEO.bandTop-6);};
HK23.botPx=()=>{const g=GEO||geo();return Math.round(g.sh-g.bandBot-3);};

/* ==================== 2. 味方：右側に縦一列（ver0.65。少し千鳥・右端から吹き出しの分だけ離す） ==================== */
function heroK(h,k){const A=ANIM.setup(h);if(!A||A.none)return;if(A._key25!==A.key||A._sc0==null){A._key25=A.key;A._sc0=A.sc;}h._k25=k;const s=A._sc0*k;if(Math.abs(A.sc-s)>1e-6)A.sc=s;}
let SLOT=[],KH=1;
HK23.placeHeroes=(hs,LY)=>{hs.forEach(h=>heroK(h,1));let ww=0,hh=0;hs.forEach(h=>{const Dm=V19.dims(h);ww=Math.max(ww,Dm.w);hh=Math.max(hh,Dm.h);});
 /* ver0.66：2D-HD。味方は手前の列に横一列（右下）。奥へ行くほど少し上＝斜めの奥行き。敵は奥の列（LY.ebot より上） */
 const n=hs.length,band=LY.bot-LY.top,k=clamp(Math.min((W*.8/Math.max(1,n))/(ww*.68),band*.34/hh),.6,1.7);KH=k;hs.forEach(h=>heroK(h,k));ww*=k;hh*=k;
 const xL=Math.min(W*.4,W-ww*.5-3),xR=W-ww*.42-2,fyB=LY.top+band*.76;SLOT=[];
 hs.forEach((h,i)=>{const t=n>1?i/(n-1):.6,fx=xL+(xR-xL)*t,fy=fyB-(1-t)*7-(n>1&&i%2?4:0);SLOT[i]=[fx,fy];h.x=fx-8*h.sc;h.y=Math.round(fy-16*h.sc+2);h._fx23=fx;});
 LY.heroL=W*.84;LY.ebot=Math.max(LY.top+30,Math.min(fyB-hh*.8,LY.top+band*.5));};
/* 交代で入った味方：同じ大きさ・同じ持ち場に */
function fitNew(){if(!inB())return;B.heroes.forEach((h,i)=>{if(h._k25)return;heroK(h,KH);const sl=SLOT[i];if(sl&&!(h.A&&h.A.mv)){h.x=sl[0]-8*h.sc;h.y=Math.round(sl[1]-16*h.sc+2);h._fx23=sl[0];}});}

/* ==================== 3. コマンド入力中のスライド ==================== */
const inputOn=()=>inB()&&!B.over&&!!B.rs&&B.rs.phase==='input'&&!auto&&!app.classList.contains('aw25')&&!!B.pick;
let IN=false,offT=0;
function setIn(v){if(v===IN){clearTimeout(offT);offT=0;return;}
 if(v){clearTimeout(offT);offT=0;IN=true;app.classList.add('in38');return;}
 /* キャラの切り替えの一瞬（B.pick が空く）は閉じない */
 if(!offT)offT=setTimeout(()=>{offT=0;IN=false;app.classList.remove('in38');},140);}

/* ==================== 4. 味方の HP・BP 表示（ターンの始めだけ・瀕死・気絶と LP） ==================== */
try{const _el=TX24.el;TX24.el=function(t,...a){if(t==='SP'&&a[0]==='sp')t='BP';return _el.call(this,t,...a);};}catch(e){}
let hlTurn=-1,hlUntil=0;
/* ver0.46：1 ターン目は「戦闘開始」が消えてから 1.4 秒、2 ターン目からはターンの始めの 1.6 秒。コマンドを決めたあと少しだけ（hpFlash）、攻撃の前に消す（hpHide） */
let hlFrom=0;const HP1=1300;
/* 1 ターン目の HP・BP が消える時刻（このあとに開始時の強化・弱体を出す：js/v25.js の表示ゲート・js/rs/battle.js opening） */
const hpEnd=()=>{let be=0;try{be=BFLOW.bannerEnd();}catch(e){}return be+HP1;};
function hlShow(){const now=performance.now(),tn=Math.max(1,B.turns||0);/* 0 ターン目（開始前）と 1 ターン目は同じ扱い */if(tn!==hlTurn){hlTurn=tn;let be=0;try{be=BFLOW.bannerEnd();}catch(e){}if(tn<=1){hlFrom=Math.max(now,be);hlUntil=hlFrom+HP1;}else{hlFrom=0;hlUntil=0;}/* ver0.46d：2 ターン目からはターンの始め（コマンドの後の hpFlash）だけ */}
 const on=!B.over&&now<hlUntil&&now>=hlFrom;if(app.classList.contains('hl39')!==on)app.classList.toggle('hl39',on);}
function hlState(){hlShow();const L=$('#hl24');if(!L)return;B.heroes.forEach((h,i)=>{const c=L.children[i];if(!c)return;const dy=RSB.dying(h),lp=h.alive?'':`LP ${h.lp||0}`;
 if(c.classList.contains('dy38')!==dy)c.classList.toggle('dy38',dy);if(c.dataset.lp!==lp)c.dataset.lp=lp;
 const z=h.alive?'':(h.lp||0)<=0?'z':'';if((c.dataset.z||'')!==z)c.dataset.z=z;});}

/* HP・BP の置き場所（ver0.46f→0.47）：いつも同じ場所＝キャラの元の立ち位置の体の中央（見やすいよう薄い黒の下地）。
   以前は他の表示を避けて候補の中から選んでいたため、場面によって頭の上や右へ飛んでいた。表示中は毎フレーム置き直す（並び替え・連続戦闘・星臨で動いても付いていく） */
try{V24.HK24.placeHL=L=>{const rs=[];let bd;try{bd=V24.bounds();}catch(e){return rs;}
  B.heroes.forEach((h,i)=>{const c=L.children[i];if(!c)return;let b;try{b=V24.boxOf(h,true);}catch(e){return;}const w=c.offsetWidth,hh=c.offsetHeight;
   const x=Math.max(bd.l,Math.min(bd.r-w,b.cx-w/2)),y=Math.max(bd.t,Math.min(bd.b-hh,b.cy-hh/2));/* ver0.47：キャラの中央に */rs.push({l:x,t:y,r:x+w,b:y+hh});
   const tf=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(c._tf!==tf){c._tf=tf;c.style.transform=tf;}});return rs;};}catch(e){console.error(e);}

/* ==================== 5. 毎フレーム ==================== */
{const _d=draw;draw=function(){_d();if(!inB())return;try{fitNew();setIn(inputOn());hlState();if(app.classList.contains('hl39'))V24.placeHL();
  const ov=!!B.over;if(app.classList.contains('ov38')!==ov)app.classList.toggle('ov38',ov);}catch(e){if(!draw._e38){draw._e38=1;console.error(e);}}};}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle'){app.classList.remove('in38','ov38','hl39');IN=false;}};}

/* ==================== 6. 開始・寸法の変化 ==================== */
{const _sb=startBattle;startBattle=function(list,opts){app.classList.remove('in38','hl39');IN=false;hlTurn=-1;const r=_sb(list,opts);try{bbar(true);}catch(e){}return r;};}

/* ==================== 7. 連続戦闘：次の戦闘への移行演出 ==================== */
let WAVE_T=0;
function waveOut(o){WAVE_T=performance.now();return new Promise(res=>{let w=$('#wv38');if(!w){w=document.createElement('div');w.id='wv38';app.appendChild(w);}
 w.innerHTML=`<div class="bg"></div><div class="tx"><small>${esc(o.q||'')}</small><b>BATTLE <em>${o.i}</em><i>/${o.n}</i></b>${o.tag?`<span>${esc(o.tag)}</span>`:''}${o.sub?`<p>${o.sub}</p>`:''}</div>`;
 w.className='on';try{tone(660,.06,'triangle',.04);setTimeout(()=>tone(880,.08,'triangle',.04),90);}catch(e){}
 const k=SPD&&SPD[speed]?SPD[speed]:1;setTimeout(res,Math.round(900*Math.max(.5,k)));});}
function waveIn(){const w=$('#wv38');if(!w)return;w.className='on out';setTimeout(()=>{if(w.className==='on out')w.className='';},700);}

function hpFlash(ms){hlFrom=performance.now();hlUntil=hlFrom+ms;}
function hpHide(){hlUntil=0;}
return{geo,waveOut,waveIn,heroK,hpFlash,hpHide,hpEnd,waveT:()=>WAVE_T};})();
