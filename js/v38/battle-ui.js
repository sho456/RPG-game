/* ===== ver0.38 戦闘画面 =====
 1. 配置：敵は左・味方は右で向き合う。味方の立ち位置は編成の陣形（RSD.FORM の p）どおり。戦闘画面に陣形名は出さない
 2. 画面を広く：戦場は画面の高さいっぱい。上は細い帯（ターン・対象・弱点・行動順・速度・メニュー）、下は AUTO の帯だけ
 3. コマンド入力中は「戦場ごと上へスライド」して、下半分にコマンド欄を出す（ロマサガRS の見せ方）。
    最後の 1 人のコマンドを決めると、コマンド欄が下へ抜け、戦場が元の位置へ滑らかに戻って行動が始まる
 4. 倍速ボタンは画面上の 1 つだけ（下の帯の倍速は削除）
 5. 味方の HP・BP は常にキャラの横に。瀕死は赤、気絶は LP を表示 */
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

/* ==================== 2. 味方：陣形どおりに並べる ==================== */
function heroK(h,k){const A=ANIM.setup(h);if(!A||A.none)return;if(A._key25!==A.key||A._sc0==null){A._key25=A.key;A._sc0=A.sc;}h._k25=k;const s=A._sc0*k;if(Math.abs(A.sc-s)>1e-6)A.sc=s;}
let SLOT=[],KH=1;
HK23.placeHeroes=(hs,LY)=>{hs.forEach(h=>heroK(h,1));let ww=0,hh=0;hs.forEach(h=>{const Dm=V19.dims(h);ww=Math.max(ww,Dm.w);hh=Math.max(hh,Dm.h);});
 const band=LY.bot-LY.top,k=clamp(Math.min(V23.appW()*.115/(hh*SC),(band*.42)/hh),.66,1.05);KH=k;hs.forEach(h=>heroK(h,k));ww*=k;hh*=k;
 const xF=W*.6+ww*.5,xB=W-4-ww*.55,f=C.formOf();SLOT=[];
 hs.forEach((h,i)=>{const[px,py]=C.formPos(i,f),fx=xF+(xB-xF)*px,fy=LY.top+hh+(band-hh)*py;SLOT[i]=[fx,fy];h.x=fx-8*h.sc;h.y=Math.round(fy-16*h.sc+2);h._fx23=fx;});
 LY.heroL=Math.min(...hs.map(h=>h._fx23))-ww/2-10;};
/* 交代で入った味方：同じ大きさ・同じ持ち場に */
function fitNew(){if(!inB())return;B.heroes.forEach((h,i)=>{if(h._k25)return;heroK(h,KH);const sl=SLOT[i];if(sl&&!(h.A&&h.A.mv)){h.x=sl[0]-8*h.sc;h.y=Math.round(sl[1]-16*h.sc+2);h._fx23=sl[0];}});}

/* ==================== 3. コマンド入力中のスライド ==================== */
const inputOn=()=>inB()&&!B.over&&!!B.rs&&B.rs.phase==='input'&&!auto&&!app.classList.contains('aw25')&&!!B.pick;
let IN=false,offT=0;
function setIn(v){if(v===IN){clearTimeout(offT);offT=0;return;}
 if(v){clearTimeout(offT);offT=0;IN=true;app.classList.add('in38');return;}
 /* キャラの切り替えの一瞬（B.pick が空く）は閉じない */
 if(!offT)offT=setTimeout(()=>{offT=0;IN=false;app.classList.remove('in38');},140);}

/* ==================== 4. 上の帯：行動順 ==================== */
function qRow(){const hd=$('#bt22 .b22hd');if(!hd)return;let q=$('#q38');if(!q||!q.isConnected){q=document.createElement('div');q.id='q38';hd.appendChild(q);}
 const L=(B.rs&&B.rs.q&&B.rs.q.length&&B.rs.phase==='act'?[B.cur&&B.cur.alive?B.cur:null,...B.rs.q.map(x=>x.u)]:preview()).filter((u,i,a)=>u&&u.alive&&a.indexOf(u)===i).slice(0,9);
 const k=L.map(u=>(u.side?'e':'h')+(u.id||u.name)+(u===B.cur?'*':'')).join();if(q._k===k)return;q._k=k;
 q.innerHTML=L.map(u=>u.side===0?`<i class="h${u===B.cur?' c':''}"><img src="${face(u.id,u.aw)}" alt=""></i>`:`<i class="e${u===B.cur?' c':''}${u.boss?' b':''}"><b>${esc(u.name.slice(0,1))}</b></i>`).join('');}

/* ==================== 5. 味方の HP 表示（常に出す・瀕死・気絶と LP） ==================== */
try{const _el=TX24.el;TX24.el=function(t,...a){if(t==='SP'&&a[0]==='sp')t='BP';return _el.call(this,t,...a);};}catch(e){}
function hlState(){const L=$('#hl24');if(!L)return;B.heroes.forEach((h,i)=>{const c=L.children[i];if(!c)return;const dy=RSB.dying(h),lp=h.alive?'':`LP ${h.lp||0}`;
 if(c.classList.contains('dy38')!==dy)c.classList.toggle('dy38',dy);if(c.dataset.lp!==lp)c.dataset.lp=lp;
 const z=h.alive?'':(h.lp||0)<=0?'z':'';if((c.dataset.z||'')!==z)c.dataset.z=z;});}

/* ==================== 6. 毎フレーム ==================== */
{const _d=draw;draw=function(){_d();if(!inB())return;try{fitNew();setIn(inputOn());qRow();hlState();
  const ov=!!B.over;if(app.classList.contains('ov38')!==ov)app.classList.toggle('ov38',ov);}catch(e){if(!draw._e38){draw._e38=1;console.error(e);}}};}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle'){app.classList.remove('in38','ov38');IN=false;}};}

/* ==================== 7. 開始・寸法の変化 ==================== */
{const _sb=startBattle;startBattle=function(list,opts){app.classList.remove('in38');IN=false;const r=_sb(list,opts);try{bbar(true);}catch(e){}return r;};}

/* ==================== 8. 連続戦闘：次の戦闘への移行演出 ==================== */
function waveOut(o){return new Promise(res=>{let w=$('#wv38');if(!w){w=document.createElement('div');w.id='wv38';app.appendChild(w);}
 w.innerHTML=`<div class="bg"></div><div class="tx"><small>${esc(o.q||'')}</small><b>BATTLE <em>${o.i}</em><i>/${o.n}</i></b>${o.tag?`<span>${esc(o.tag)}</span>`:''}${o.sub?`<p>${o.sub}</p>`:''}</div>`;
 w.className='on';try{tone(660,.06,'triangle',.04);setTimeout(()=>tone(880,.08,'triangle',.04),90);}catch(e){}
 const k=SPD&&SPD[speed]?SPD[speed]:1;setTimeout(res,Math.round(900*Math.max(.5,k)));});}
function waveIn(){const w=$('#wv38');if(!w)return;w.className='on out';setTimeout(()=>{if(w.className==='on out')w.className='';},700);}

return{geo,waveOut,waveIn,heroK};})();
