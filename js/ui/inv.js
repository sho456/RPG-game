/* ===== 持ち物・鑑定の画面の正本（ver0.54。共通の全画面の枠 FAC も、鍛冶屋 js/ui/smith.js がここを使う） =====
 置き換え：town.js の invMenu・itemMenu2・appraise・INVT/INVF、ver17.js の invMenu の包み（拾う前フィルター）、ver18-town.js の appraise の包み（roomOpen）。
 ・全画面の #fac（z6。装備の詳細 #sheet z7 より下）。出入りは invMenu() / appraise()、戻る＝townMenu()。
 ・持ち物：種類のタブ（アイコン）→ 装備アイコンの格子 → 選ぶと下の帯に ⓘ（data-eqi で EQINFO）・ロック・売却・分解。拾う前フィルターは cfgOpen。
 ・鑑定：未鑑定の格子 → 1 つずつ／まとめて。結果は格子で見せる（レジェンド化は星の印）。説明の字は出さない */
'use strict';
const FAC=(()=>{
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const P={
 grid:'M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z',
 sword:'M13.2.8h2v2l-8 8 1 1-1.2 1.2-1-1-2.2 2.2-2.2-2.2 2.2-2.2-1-1L3 7.6l1 1z',
 shield:'M8 1l6 2v5c0 3.4-2.6 5.6-6 7-3.4-1.4-6-3.6-6-7V3z',
 ring:'M5.4 1h5.2l1.2 3H4.2zM8 5.2a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z',
 eye:'M8 3.4C4.4 3.4 1.6 6 .6 8c1 2 3.8 4.6 7.4 4.6s6.4-2.6 7.4-4.6c-1-2-3.8-4.6-7.4-4.6zm0 2a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z',
 lock:'M4 7V5a4 4 0 118 0v2h1.2v8H2.8V7zm1.6 0h4.8V5a2.4 2.4 0 10-4.8 0z',
 funnel:'M1 2h14l-5.4 6.4V14l-3.2-1.6V8.4z',
 anvil:'M1 3h9.4v2.2L8 7v1.4h6.4V11H1.6V8.4H4V7L1 5.2zm3 9h9v2.4H4z',
 up:'M8 1l6.4 7.2H10V15H6V8.2H1.6z',
 swap:'M2 4h9V1.6L15 5l-4 3.4V6H2zm12 6H5V7.6L1 11l4 3.4V12h9z',
 gem:'M4 2h8l3 4-7 8-7-8z',
 star:'M8 .8l2 4.9 5.2.4-4 3.4 1.3 5.1L8 11.9 3.5 14.6l1.3-5.1-4-3.4L6 5.7z',
 bag:'M5 4.4V3.6a3 3 0 016 0v.8h2.2l1 10.6H1.8l1-10.6zm1.6 0h2.8v-.8a1.4 1.4 0 00-2.8 0z'};
const ic=k=>`<svg class="fc-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="${P[k]}"/></svg>`;
const mi=k=>{try{return`<img class="fc-mi" src="${ICON[k]||ICON.haiseki}" alt="">`;}catch(e){return'';}};
const coin=()=>`<img class="fc-mi" src="${ICON.coin}" alt="">`;
const fm=n=>Math.round(n||0).toLocaleString('en-US');
const src=it=>{try{const r=itemIcon(it);return/^</.test(r)?r:`<img src="${r}" alt="">`;}catch(e){return'';}};
let root=null,ACT={};
function ensure(){if(root)return;root=document.createElement('div');root.id='fac';root.className='hide';document.body.appendChild(root);
 root.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||!root.contains(t)||t.disabled||t.classList.contains('dis'))return;
  const f=ACT[t.dataset.a];if(f){try{SFX.sel();}catch(_){}f(t.dataset.v);}});}
/* 画面を出す。o={cls, title, res（右上のHTML）, tabs（HTML）, body, foot, toast}。同じ画面の出し直しではスクロール位置を保つ */
function show(o,acts){ensure();const old=root.querySelector('.fc-body'),keep=(old&&root.className===o.cls)?old.scrollTop:0;
 ACT=acts||{};root.className=o.cls;
 root.innerHTML=`<header class="fc-h"><button class="fc-bk" data-a="back" aria-label="back">◀</button><b>${o.title}</b><span class="fc-res">${o.res||''}</span></header>${o.tabs?`<nav class="fc-tabs">${o.tabs}</nav>`:''}
 <div class="fc-body">${o.body}</div><footer class="fc-f">${o.foot||''}</footer>${o.toast?`<div class="fc-toast">${o.toast}</div>`:''}`;
 const b=root.querySelector('.fc-body');if(b)b.scrollTop=keep;}
function hide(){if(root)root.className='hide';}
const gold=()=>`<span class="fc-g">${coin()}<b>${fm(G.gold)}</b></span>`;
/* 装備アイコンの格子の 1 マス。o={a, v, sel, tag, off, mark, noeq, info} */
function tile(it,o){o=o||{};const c=(RAR[it.rar]||RAR[0]).c,w=eqBy(it.uid);
 return`<button class="fc-t${o.sel?' sel':''}${o.off?' off':''}" ${o.info?`data-eqi="${it.uid}"`:`data-a="${o.a||'pk'}" data-v="${o.v!=null?o.v:it.uid}"`} style="--rc:${c}">${src(it)}${it.plus?`<em class="pl">+${it.plus}</em>`:''}${w&&!o.noeq?'<i class="eq"></i>':''}${it.lock?`<i class="lk">${ic('lock')}</i>`:''}${o.mark||''}${o.tag?`<small>${o.tag}</small>`:''}</button>`;}
/* 選んだ装備の帯。アイコンのタップ（data-eqi）で詳細 */
function bar(it,btns,sub){return`<div class="fc-sb" style="--rc:${(RAR[it.rar]||RAR[0]).c}"><button class="fc-si" data-eqi="${it.uid}" aria-label="info">${src(it)}</button><span class="t"><b>${esc(iname(it))}</b>${sub?`<small>${esc(sub)}</small>`:''}</span><span class="bt">${btns||''}</span></div>`;}
const empty=k=>`<div class="fc-em">${ic(k||'grid')}</div>`;
{const _tm=townMenu;townMenu=function(){hide();return _tm.apply(this,arguments);};}
return{show,hide,ic,mi,coin,gold,tile,bar,empty,fm,esc,src};})();

/* ---------- 持ち物 ---------- */
const INV=(()=>{
const F=[['all','grid',()=>1],['w','sword',i=>i.slot==='w'],['arm','shield',i=>i.slot==='main'||i.slot==='sub'],['acc','ring',i=>i.slot==='acc'],['un','eye',i=>i.unid]];
let TAB='all',SEL=null;
const cap=()=>{try{return invCap();}catch(e){return 200;}};
const junkOf=()=>G.inv.filter(i=>i.rar<=1&&!i.lock&&!i.unid&&!eqBy(i.uid));
function draw(m){const f=(F.find(x=>x[0]===TAB)||F[0])[2],L=G.inv.filter(f).sort((a,b)=>b.rar-a.rar||b.ilv-a.ilv),
 sel=SEL&&G.inv.find(i=>i.uid===SEL),junk=junkOf(),flt=G.set.flt||{rar:-1};
 if(!sel)SEL=null;
 const dm=sel&&DISM[sel.rar],w=sel&&eqBy(sel.uid);
 const bt=sel?`<button class="fc-bt${sel.lock?' on':''}" data-a="lock" aria-label="lock">${FAC.ic('lock')}</button>
  <button class="fc-bt" data-a="sell" ${sel.lock||w?'disabled':''}>${FAC.coin()}<b>${FAC.fm(price(sel))}</b></button>
  <button class="fc-bt" data-a="dism" ${sel.lock||w||sel.unid?'disabled':''}>${FAC.ic('anvil')}${Object.entries(dm).map(([k,n])=>`${FAC.mi(k)}<b>${n}</b>`).join('')}</button>`:'';
 FAC.show({cls:'fc inv',title:'持ち物',res:`<span class="fc-n">${G.inv.length}<i>/</i>${cap()}</span>${FAC.gold()}`,
  tabs:F.map(([k,i])=>`<button class="${TAB===k?'on':''}" data-a="tab" data-v="${k}" aria-label="${k}">${FAC.ic(i)}</button>`).join(''),
  body:`<div class="fc-grid">${L.map(it=>FAC.tile(it,{sel:it.uid===SEL})).join('')}</div>${L.length?'':FAC.empty('bag')}`,
  foot:`${sel?FAC.bar(sel,bt):''}<div class="fc-tools"><button class="fc-bt wide" data-a="junk" ${junk.length?'':'disabled'}>${FAC.coin()}<b>${FAC.fm(junk.reduce((a,i)=>a+price(i),0))}</b><em>${junk.length}</em></button>
   <button class="fc-bt wide${flt.rar>=0?' on':''}" data-a="flt" aria-label="filter">${FAC.ic('funnel')}</button></div>`,
  toast:m},
 {back:()=>townMenu(),tab:k=>{TAB=k;SEL=null;draw();},
  pk:u=>{u=+u;if(SEL===u){const it=findItem(u);if(it)EQINFO.open(it);return;}SEL=u;draw();},
  lock:()=>{sel.lock=!sel.lock;save();draw();},
  sell:()=>{G.gold+=price(sel);SFX.heal();G.inv=G.inv.filter(i=>i!==sel);save();SEL=null;draw();},
  dism:()=>{for(const[k,n]of Object.entries(dm))G.mats[k]=(G.mats[k]||0)+n;SFX.brk();G.inv=G.inv.filter(i=>i!==sel);save();SEL=null;draw();},
  junk:()=>{const g=junk.reduce((a,i)=>a+price(i),0);G.inv=G.inv.filter(i=>!junk.includes(i));G.gold+=g;SFX.heal();save();SEL=null;draw(`+${g}G`);},
  flt:()=>cfgOpen(()=>draw())});}
invMenu=function(m){draw(m);};
return{draw};})();

/* ---------- 鑑定 ---------- */
const APR=(()=>{
let SEL=null;
const cost=it=>Math.round((30+it.ilv*10)*(1-.1*(G.fac.eye-1)));
function reveal(its){its.forEach(i=>{i.unid=false;i.up=0;if(Math.random()<(G.fac.eye-1)*.05&&upgradeRar(i))i.up=1;});SFX.aw();save();}
function result(its){
 FAC.show({cls:'fc apr',title:'鑑定',res:FAC.gold(),body:`<div class="fc-grid">${its.map(it=>FAC.tile(it,{info:1,noeq:1,mark:it.up?`<i class="up">${FAC.ic('star')}</i>`:''})).join('')}</div>`,foot:''},{back:()=>draw()});}
function draw(){const un=G.inv.filter(i=>i.unid).sort((a,b)=>b.rar-a.rar||b.ilv-a.ilv),tot=un.reduce((a,i)=>a+cost(i),0),sel=SEL&&un.find(i=>i.uid===SEL);if(!sel)SEL=null;
 FAC.show({cls:'fc apr',title:'鑑定',res:FAC.gold(),
  body:`<div class="fc-grid">${un.map(it=>FAC.tile(it,{sel:it.uid===SEL,tag:FAC.fm(cost(it)),off:G.gold<cost(it)})).join('')}</div>${un.length?'':FAC.empty('eye')}`,
  foot:`${sel?FAC.bar(sel,`<button class="fc-bt go" data-a="one" ${G.gold<cost(sel)?'disabled':''}>${FAC.ic('eye')}<b>${FAC.fm(cost(sel))}</b></button>`):''}
   <div class="fc-tools"><button class="fc-bt wide go" data-a="all" ${!un.length||G.gold<tot?'disabled':''}>${FAC.ic('eye')}<em>${un.length}</em>${FAC.coin()}<b>${FAC.fm(tot)}</b></button></div>`},
 {back:()=>townMenu(),pk:u=>{u=+u;if(SEL===u){const it=findItem(u);if(it)EQINFO.open(it);return;}SEL=u;draw();},
  one:()=>{G.gold-=cost(sel);reveal([sel]);SEL=null;result([sel]);},
  all:()=>{G.gold-=tot;reveal(un);SEL=null;result(un);}});}
appraise=function(){SEL=null;draw();};
return{draw};})();
