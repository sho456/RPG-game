/* ===== TD の戦闘画面の帯と操作盤（TDH）：上の帯・灯力と星片の帯・選んだ仲間の操作盤・手札。戦場の描画と操作は js/td/view.js =====
 ver0.57 で view.js から分けた（旧：view.js の hud・deckHTML・ユニットの窓 .td-unit を置き換え）。
 形はセレスの TD デモ（assets_src/pixel-art/td-demo）：顔＋技のボタン 3 つ（溜めの扇・自動で出る）＋星臨＋奥義（手で押す）。
 字は少なく：溜めは扇、使える＝灯の色、星片が足りない＝灰、出した＝暗く沈む。名前はタップしたときだけ（view.js の tip） */
'use strict';
const TDH=(()=>{
let V=null;const memo={};
const $=q=>V.root.querySelector(q);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const set=(k,el,v,f)=>{if(!el||memo[k]===v)return;memo[k]=v;f(el,v);};
/* 技ボタンの絵は js/td/skicon.js（TDI。属性の色のドット絵）。溜めは暗い扇＋回る針、溜まると金に脈打ち星が光る（デモの技ボタン） */
const elOf=k=>{try{return(SK[k]&&SK[k].el)||'陽';}catch(e){return'陽';}};
const ouK=id=>{try{return RSD.AWX[id].ou;}catch(e){return'';}};
const btn=(cls,a,i,icon,name,cost)=>`<button class="td-sb ${cls}" data-a="${a}"${i!=null?` data-i="${i}"`:''} aria-label="${esc(name)}"><span class="bx">${icon}<i class="fan"></i><i class="hand"></i>${cost?`<em class="cost">${cost}</em>`:''}<i class="t"></i></span><b class="nm">${esc(name)}</b></button>`;
/* ---------- 画面の骨組み（view.js の build が置く） ---------- */
function markup(){return{
 top:`<div class="td-top"><div class="td-wave"><small>WAVE</small><b class="wv">-</b></div><div class="td-life" aria-label="灯火"><i class="ic-lamp"></i><div class="seg"></div></div>
 <button class="td-btn td-snd" data-a="snd" aria-label="音">${TDSFX.icon()}</button><button class="td-btn" data-a="spd" aria-label="速度">×1</button><button class="td-btn" data-a="pause" aria-label="一時停止">Ⅱ</button><button class="td-btn" data-a="menu" aria-label="やめる">≡</button></div>`,
 bottom:`<div class="td-bar"><div class="td-costw"><div class="td-cost"><i class="ic-lamp"></i><b>0</b></div><i class="cb"></i></div><button class="td-btn td-lampb" data-a="lamp" aria-label="灯を強める"></button>
 <div class="td-star" aria-label="星片"><i class="ic-star"></i><b class="n">0</b><div class="g"><i></i><s style="left:${TDD.K.AW/TDD.K.STAR_MAX*100}%"></s></div></div></div>
 <div class="td-con empty"></div><div class="td-deck"></div>`};}
/* ---------- 操作盤：選んだ仲間（顔と HP・技 3 つ・星臨・奥義・移動・撤退） ---------- */
let conU=null;
function con(u){conU=u||null;const e=$('.td-con');for(const k in memo)if(k[0]==='k')delete memo[k];
 if(!u){e.className='td-con empty';e.innerHTML=`<div class="cf"></div><div class="cs">${'<span class="td-sb td-sk"><span class="bx"></span></span>'.repeat(3)}</div><span class="td-sb td-aw"><span class="bx"></span></span><span class="td-sb td-ou"><span class="bx"></span></span>`;return;}
 const h=u.h;e.className='td-con';e.style.setProperty('--rc',TDD.ROLE[h.role].col);
 e.innerHTML=`<button class="cf" data-a="focus" aria-label="${esc(h.name)}"><img src="${V.face(u.id)}" alt=""><i class="hp"><b></b></i></button>
 <div class="cs">${h.sks.map((k,i)=>btn('td-sk','sk',i,TDI.img(k.id,elOf(k.id)),k.n)).join('')}</div>
 ${btn('td-aw','aw',null,TDI.img('_aw','陽',1),'星臨',TDD.K.AW)}${btn('td-ou ult','ult',null,TDI.img(ouK(u.id),elOf(ouK(u.id)),1),h.ult.n,null)}
 <div class="cm"><button class="td-btn" data-a="mv">移動</button><button class="td-btn" data-a="ret">撤退</button></div>`;}
/* 技が出た：そのボタンを光らせる */
function fire(u,sk){if(u!==conU)return;const i=u.h.sks.indexOf(sk),b=$(`.td-con .td-sk[data-i="${i}"]`);if(!b)return;b.classList.remove('fire');void b.offsetWidth;b.classList.add('fire');}
function conTick(st){const u=conU;if(!u)return;if(!st.units.includes(u)){con(null);return;}const c=st.deck.find(c=>c.on===u);
 const hp=Math.max(0,u.hp/u.h.hp);set('khp',$('.td-con .hp b'),Math.round(hp*100),(e,v)=>{e.style.width=v+'%';e.classList.toggle('low',hp<.35);});
 u.h.sks.forEach((k,i)=>{const r=Math.min(1,u.ch[i]/k.ch),b=$(`.td-con .td-sk[data-i="${i}"]`);set('ks'+i,b,Math.round(r*90),(e)=>{e.style.setProperty('--p',Math.round((1-r)*100)+'%');e.style.setProperty('--a',Math.round(r*360)+'deg');e.classList.toggle('ready',r>=1);});});
 const aw=u.awT>0,ca=TDS.canAw(st,u.uid);set('kaw',$('.td-aw'),`${c&&c.aw?1:0}${ca?1:0}${aw?Math.ceil(u.awT):0}`,(e)=>{e.classList.toggle('can',ca);e.classList.toggle('act',aw);
  e.classList.toggle('ready',ca);e.disabled=!ca;e.querySelector('.t').style.width=aw?Math.round(u.awT/TDD.AWK.dur*100)+'%':'0';});
 const cu=TDS.canUlt(st,u.uid);set('kou',$('.td-ou'),`${c&&c.ult?1:0}${cu?1:0}${aw?1:0}`,(e)=>{e.classList.toggle('used',!!(c&&c.ult));e.classList.toggle('can',cu);e.classList.toggle('boost',cu&&aw);e.classList.toggle('ready',cu);e.disabled=!cu;});}
/* ---------- 手札：顔・コスト・役割の色。置いた仲間は HP と技の溜まり（3 つの点）・星臨/奥義が出せる印 ---------- */
function deckHTML(st){return st.deck.map(c=>`<button class="td-card" data-id="${c.id}" aria-label="${esc(c.h.name)} コスト${c.h.cost}"><img src="${V.face(c.id)}" alt=""><span class="c">${c.h.cost}</span>
 <span class="r" style="background:${TDD.ROLE[c.h.role].col}"></span><span class="n">${esc(c.h.name)}</span><span class="pp">${c.h.sks.map(()=>'<i></i>').join('')}</span><i class="hp"><b></b></i><i class="sr"></i><span class="cd" hidden></span></button>`).join('');}
function deckTick(st){const sel=V.sel,su=V.selU;
 for(const c of st.deck){const el=V.root.querySelector(`.td-card[data-id="${c.id}"]`);if(!el)continue;const u=c.on;
  const st8=`${u?1:0}${c.cd>0?Math.ceil(c.cd):0}${st.cost>=c.h.cost?1:0}${sel===c.id?1:0}${u&&u===su?1:0}`;
  set('c'+c.id,el,st8,(e)=>{e.classList.toggle('on',!!u);e.classList.toggle('poor',!u&&st.cost<c.h.cost);e.classList.toggle('sel',sel===c.id||(!!u&&u===su));const d=e.querySelector('.cd');
   if(c.cd>0){d.hidden=false;d.textContent=Math.ceil(c.cd);}else d.hidden=true;});
  if(c.cd>0){const full=c.h.redeploy*1.5;el.querySelector('.cd').style.setProperty('--p',Math.round(c.cd/full*100)+'%');}
  if(u){const hp=Math.round(Math.max(0,u.hp/u.h.hp)*20),rd=u.h.sks.map((k,i)=>u.ch[i]>=k.ch?1:0).join(''),sp=(TDS.canUlt(st,u.uid)?2:0)+(TDS.canAw(st,u.uid)?1:0)+(u.awT>0?4:0);
   set('d'+c.id,el,hp+'|'+rd+'|'+sp,(e)=>{e.querySelector('.hp b').style.width=hp*5+'%';e.querySelector('.hp b').classList.toggle('low',hp<7);
    e.querySelectorAll('.pp i').forEach((p,i)=>p.classList.toggle('on',rd[i]==='1'));e.classList.toggle('spc',(sp&3)>0);e.classList.toggle('aw',sp>=4);});}}}
/* ---------- 毎コマ（変わったところだけ書き換える） ---------- */
function tick(st){const K=TDD.K;
 set('wv',$('.wv'),(st.wave+1)+(st.S.inf?'':'/'+st.S.waves.length),(e,v)=>e.textContent=v);
 set('lv',$('.td-life .seg'),st.lives,(e,v)=>{e.innerHTML=Array.from({length:K.LIVES},(_,i)=>`<i class="${i<v?'':'off'}"></i>`).join('');e.parentNode.classList.toggle('low',v<=2);});
 set('co',$('.td-cost b'),st.cost,(e,v)=>e.textContent=v);$('.cb').style.width=Math.round(st.costAcc/K.COST_EVERY*100)+'%';
 set('sr',$('.td-star'),st.star,(e,v)=>{e.querySelector('.n').textContent=v;e.querySelector('.g i').style.width=(Math.min(K.STAR_MAX,v)/K.STAR_MAX*100)+'%';e.classList.toggle('aw',v>=K.AW);e.classList.toggle('full',v>=K.STAR_MAX);});
 const call=$('.td-call'),gap=st.phase==='gap'&&!st.over;set('call',call,gap?Math.ceil(st.gapT)+'|'+st.wave:'',(e,v)=>{e.hidden=!v;if(v)e.innerHTML=st.wave<0?`▶ <b>${Math.ceil(st.gapT)}</b>`:`▶▶ <i class="ic-lamp"></i><b>+${Math.ceil(st.gapT)}</b>`;});
 const lc=TDS.lampCost(st);set('lamp',$('.td-lampb'),lc+'|'+(st.cost>=lc?1:0)+st.lamp,(e)=>{e.innerHTML=`<i class="ic-tower"></i><span class="pp">${[0,1,2].map(i=>`<i class="${i<st.lamp?'on':''}"></i>`).join('')}</span>${lc?`<b>${lc}</b>`:''}`;e.classList.toggle('poor',!lc||st.cost<lc);});
 deckTick(st);conTick(st);}
function open(st){for(const k in memo)delete memo[k];$('.td-deck').innerHTML=deckHTML(st);con(null);}
return{init:v=>{V=v;},markup,open,tick,con,fire,get conU(){return conU;}};})();
