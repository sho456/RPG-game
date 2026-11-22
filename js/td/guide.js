/* ===== TD の字を使わない導き（GUIDE）の正本：最初の 1〜2 面で、光る指・脈打つ輪・矢印だけで操作を順に示す =====
 順番：①手札を選ぶ → ②光る台座に置く（手札の人数ぶん・最大 2 人）→ ③灯を強める → ④星臨（ユニットをタップ → 星臨のボタン）。
 やった操作で次へ進む。進み具合は G.td.gd（0〜3、3＝終わり）。2 面目が終わった時点で終わりにする。一度終えたら二度と出ない。
 戦闘画面（js/td/view.js）とは TD.st・TD.cam・TD.root() と DOM のクラス（.td-card.sel・.td-unit・.td-lampb）だけでつながる。
 view.js からの呼び出しは open() の GUIDE.start(sid) と stop() の GUIDE.stop() の 2 か所だけ */
'use strict';
const GUIDE=(()=>{
const ON=['td0_1','td0_2'],DONE=3;
let raf=0,sid=null,ov=null,hand=null,rings=[],arrow=null;
const td=()=>{try{G.td=G.td||{c:{}};return G.td;}catch(e){return null;}};
const step=()=>{const t=td();return t?(t.gd|0):DONE;};
function setStep(n){const t=td();if(!t||(t.gd|0)>=n)return;t.gd=n;try{save();}catch(e){}}
/* もう導かない：終わった・2 面目をクリア済み（旧セーブ）・対象のステージでない */
function off(id){const t=td();if(!t)return true;if((t.c&&t.c.td0_2)&&(t.gd|0)<DONE)t.gd=DONE;return step()>=DONE||!ON.includes(id);}
/* ---------- 表示の部品 ---------- */
const HAND='<svg viewBox="0 0 24 28" width="30" height="35" aria-hidden="true"><path d="M9 2.5c1.2 0 2 .9 2 2V12l.6-.1c1-.2 1.9.4 2.1 1.3l.1.3.5-.1c1-.2 1.9.4 2.1 1.3l.1.4.4-.1c1.1-.2 2.1.6 2.1 1.7V21c0 2.8-2.2 5-5 5h-3.2c-1.7 0-3.2-.8-4.2-2.2L3.2 18.6c-.6-.9-.4-2 .4-2.6.8-.6 1.9-.5 2.6.2L7 17V4.5c0-1.1.9-2 2-2z"/></svg>';
function build(root){if(ov&&ov.parentNode===root)return;ov=document.createElement('div');ov.className='tdg';ov.innerHTML=`<i class="tdg-hand">${HAND}</i><i class="tdg-arrow"></i>`;
 root.appendChild(ov);hand=ov.querySelector('.tdg-hand');arrow=ov.querySelector('.tdg-arrow');rings=[];}
function ring(i,x,y,r,k,h){let e=rings[i];if(!e){e=document.createElement('i');ov.appendChild(e);rings[i]=e;}e.className='tdg-ring'+(k?' '+k:'');e.style.cssText=`left:${x}px;top:${y}px;width:${r*2}px;height:${(h||r)*2}px`;e.hidden=false;}
function clearRings(from){for(let i=from;i<rings.length;i++)if(rings[i])rings[i].hidden=true;}
function point(x,y){if(x==null){hand.hidden=true;return;}hand.hidden=false;hand.style.left=x+'px';hand.style.top=y+'px';}
/* 要素の中心（#td の中の座標。#td は画面いっぱいの fixed） */
function mid(el){if(!el)return null;const r=el.getBoundingClientRect();if(!r.width)return null;return{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};}
/* 戦場の座標 → 画面の座標 */
function scr(st,x,y){return TD.toScr(x,y);}
/* ---------- 毎コマ ---------- */
function loop(){raf=requestAnimationFrame(loop);const st=TD.st;if(!st||!ov){return;}
 const root=TD.root(),s=step();let n=0;arrow.hidden=true;
 if(st.over){if(sid==='td0_2')setStep(DONE);return hide();}
 const sheet=root.querySelector('.td-sheet');if(sheet&&!sheet.hidden)return hide();
 ov.hidden=false;
 if(s===0){/* ①② 手札を選ぶ → 光る台座に置く */
  const need=Math.min(2,st.deck.length);if(st.units.length>=need){setStep(1);return;}
  const selEl=root.querySelector('.td-card.sel'),sel=selEl&&st.deck.find(c=>c.id===selEl.dataset.id);
  if(sel){/* 光の届く一番前（後衛はその少し後ろの道の脇）を指す */
   const P=st.Ps.map((L,i)=>{const a=TDS.at(L,TDS.frontier(st,i)+(sel.h.line==='b'?40:20));return{x:a.x,y:a.y+TDS.yo(st,i,sel.h.line)};});
   P.forEach(p=>{const q=scr(st,p.x,p.y);ring(n++,q.x,q.y,13*q.S,'pad');});clearRings(n);
   const best=P.map(p=>({p,q:scr(st,p.x,p.y)})).find(o=>o.q.x>o.q.L&&o.q.x<o.q.R);if(best)point(best.q.x,best.q.y);else{point(null);edge(st,P[0]);}return;}
  const c=st.deck.find(c=>!c.on&&c.cd<=0&&st.cost>=c.h.cost&&st.units.length<st.cap);
  const m=c&&mid(root.querySelector(`.td-card[data-id="${c.id}"]`));clearRings(0);
  if(m){ring(0,m.x,m.y,m.w/2+4,'card',m.h/2+4);point(m.x,m.y-m.h*.1);}else point(null);return;}
 if(s===1){/* ③ 灯を強める（灯力が足りるときだけ指す） */
  if(st.lamp>0){setStep(2);return;}const b=root.querySelector('.td-lampb'),m=mid(b);clearRings(0);
  if(m&&TDS.lampCost(st)&&st.cost>=TDS.lampCost(st)){ring(0,m.x,m.y,m.w/2+4,'lamp',m.h/2+4);const q=scr(st,st.S.base[0],st.S.base[1]);ring(1,q.x,q.y,st.lightR*q.S,'light');point(m.x,m.y);}else point(null);return;}
 if(s===2){/* ④ 星臨：星が満ちたら星のゲージ → ユニット → 星臨のボタン */
  if(st.deck.some(c=>c.ult)){setStep(DONE);return hide();}
  if(st.star<TDD.K.STAR_MAX||!st.units.length){clearRings(0);return point(null);}
  const gauge=mid(root.querySelector('.td-star'));if(gauge)ring(n++,gauge.x,gauge.y,gauge.w/2+4,'star gauge',gauge.h/2+4);
  const pan=root.querySelector('.td-unit'),ub=pan&&!pan.hidden&&pan.querySelector('.ult:not([disabled])');
  if(ub){const m=mid(ub);ring(n++,m.x,m.y,m.w/2+4,'star',m.h/2+4);clearRings(n);return point(m.x,m.y);}
  const u=st.units.slice().sort((a,b)=>b.x-a.x).find(u=>{const c=st.deck.find(c=>c.on===u);return c&&!c.ult;});if(!u){clearRings(n);return point(null);}
  const q=scr(st,u.x,u.y-22);if(q.x>q.L&&q.x<q.R){ring(n++,q.x,q.y,20*q.S,'star');clearRings(n);point(q.x,q.y);}else{clearRings(n);point(null);edge(st,u);}return;}
 hide();}
/* 目当てが画面の外：その向きの端に矢印 */
function edge(st,p){if(!p)return;const q=scr(st,p.x,p.y),left=q.x<q.L;arrow.hidden=false;arrow.classList.toggle('l',left);arrow.style.left=(left?q.L+8:q.R-30)+'px';arrow.style.top=(q.y-11)+'px';}
function hide(){if(!ov)return;ov.hidden=true;}
/* ---------- 入口 ---------- */
function start(id){stop();sid=id;if(off(id))return;build(TD.root());ov.hidden=true;point(null);raf=requestAnimationFrame(loop);}
function stop(){cancelAnimationFrame(raf);raf=0;if(ov){ov.remove();ov=null;}}
return{start,stop,get step(){return step();}};})();
