/* ===== 仲間の画面（UNIT）：TD 用の一覧＋1 人の詳細。Lv・装備・技の練達・星臨・星盤をここにまとめる =====
 UNIT.open() で一覧、UNIT.open(id) で詳細、UNIT.open(null, 戻り先の関数)。全画面の #unit（z902）。閉じたら townMenu()。
 能力は TDD.hero(id,lv,TDD.real(id)) の数字。Lv は GROW.lvUp、装備は equip、練達は RSM.up。変えたら save() */
'use strict';
const UNIT=(()=>{
let root=null,cur=null,sheet=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IMG={};
function pic(id,h){const k=id+h;if(IMG[k])return IMG[k];let f=null;try{f=SPX.unitCv(id,id,0,h);}catch(e){}if(!f)return'';
 const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return IMG[k]=c.toDataURL();}
const fm=n=>Math.round(n||0).toLocaleString('en-US');
const SLOTS=[['w','武'],['main','鎧'],['sub','盾'],['acc1','飾'],['acc2','飾']];
const stk=()=>Math.max(0,Math.round((G&&G.xpStock)||0));
const xpI='<i class="un-xp"></i>';
const stI=()=>{try{return`<img class="un-st" src="${ICON.renma}" alt="">`;}catch(e){return'';}};
const dots=(n,m=3)=>`<span class="un-dots">${Array.from({length:m},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
const itSrc=it=>{try{const r=itemIcon(it);return/^</.test(r)?r:`<img src="${r}" alt="">`;}catch(e){return'';}};
const byRole=()=>{const o=Object.keys(TDD.ROLE);return(G.members||[]).filter(id=>TDD.HERO[id]&&G.h[id]).sort((a,b)=>o.indexOf(TDD.HERO[a].role)-o.indexOf(TDD.HERO[b].role));};
function build(){if(root)return;root=document.createElement('div');root.id='unit';root.className='hide';document.body.appendChild(root);root.addEventListener('click',onClick);}
let back=null;/* 戻り先（出撃準備から開いたときは出撃準備へ） */
function open(id,bk){build();back=bk||null;sheet=null;cur=id&&G.h[id]?id:null;root.classList.remove('hide');draw();root.scrollTop=0;}
function close(){if(root)root.classList.add('hide');const b=back;back=null;if(b){try{b();}catch(e){console.error(e);}return;}try{townMenu();}catch(e){}}
const stats=id=>TDD.hero(id,G.h[id].lv,TDD.real(id));
const itOf=u=>u&&G.inv.find(x=>x.uid===u);
function list(){const L=byRole();
 return`<header class="un-h"><button class="td-btn" data-a="home" aria-label="戻る">◀</button><b>仲間</b><span class="un-sum">${xpI}${fm(stk())}</span></header>
 <ul class="un-grid">${L.map(id=>{const d=TDD.HERO[id],R=TDD.ROLE[d.role],s=stats(id);
  return`<li><button data-a="pick" data-v="${id}"><span class="r" style="background:${R.col}"></span><img src="${pic(id,52)}" alt=""><b>${esc(HB[id].name)}</b><span class="mt"><em>Lv${G.h[id].lv}</em><em class="cs">${s.cost}</em></span>${GROW.can(id)?'<i class="un-dot"></i>':''}</button></li>`;}).join('')}</ul>`;}
function slotBtn(id,sl,g){const it=itOf(G.h[id].eq[sl]);
 return`<button class="un-eq${it?' r'+(it.rar||0):''}${sheet===sl?' on':''}" data-a="slot" data-v="${sl}">${it?`<span class="ic">${itSrc(it)}</span>`:`<span class="g">${g}</span>`}${it&&it.plus?`<em>+${it.plus}</em>`:''}</button>`;}
function sheetHTML(id){if(!sheet)return'';const cu=G.h[id].eq[sheet];
 const L=G.inv.filter(it=>canEq(it,id,sheet)&&it.uid!==cu).sort((a,b)=>score(b,id)-score(a,id)).slice(0,40);
 return`<div class="un-sheet"><div class="sb"><button class="td-btn" data-a="shut" aria-label="閉じる">✕</button>${cu?'<button class="td-btn" data-a="off">外す</button>':''}</div>
 <ul>${L.map(it=>`<li><button class="r${it.rar||0}" data-a="put" data-v="${it.uid}"><span class="ic">${itSrc(it)}</span><em>${it.ilv}${it.plus?`+${it.plus}`:''}</em></button></li>`).join('')}</ul></div>`;}
function detail(id){const all=byRole(),s=stats(id),d=TDD.HERO[id],R=TDD.ROLE[d.role],h=G.h[id];
 const cap=(()=>{try{return V31.capOf(id);}catch(e){return 99;}})(),max=h.lv>=cap,ok=GROW.can(id);
 const k=d.sk,ml=RSM.lvOf(id,k),why=ml>=3?'max':RSM.canUp(id,k),cost=why==='max'?0:RSM.costOf(id,k);
 const stat=(g,v)=>`<li><i>${g}</i><b>${v}</b></li>`;
 return`<header class="un-h"><button class="td-btn" data-a="list" aria-label="一覧">◀</button><b>${esc(s.name)}</b><span class="un-sum">${xpI}${fm(stk())}</span></header>
 <section class="un-hero"><button class="td-btn nv" data-a="nav" data-v="-1" ${all.length<2?'disabled':''}>‹</button>
  <div class="pv"><img src="${pic(id,110)}" alt=""></div><button class="td-btn nv" data-a="nav" data-v="1" ${all.length<2?'disabled':''}>›</button></section>
 <div class="un-id"><span class="role" style="background:${R.col}" title="${esc(R.n)}"></span><span class="el">${esc(R.n)}　${esc(s.el||'')}</span><b>Lv${h.lv}</b>
  <button class="td-btn${ok?' on':' dis'}" data-a="lv" data-v="1" ${ok?'':'aria-disabled="true"'}>+1</button><button class="td-btn${ok?'':' dis'}" data-a="lv" data-v="9999" ${ok?'':'aria-disabled="true"'}>${max?'MAX':'↑'}</button></div>
 <ul class="un-stats">${stat('HP',fm(s.hp))}${stat('攻',fm(s.atk))}${stat('間',s.iv)}${stat('射',s.rng)}${stat('費',s.cost)}${s.blk?stat('止',s.blk):''}</ul>
 <div class="un-row"><i class="k">技</i><b class="nm">${esc(s.sk.n)}</b>${dots(ml)}<button class="td-btn${why===null?' ok':' dis'}" data-a="mas" ${why===null?'':'aria-disabled="true"'}>${why==='max'?'MAX':`${stI()}${cost}`}</button></div>
 <div class="un-row"><i class="k">臨</i><b class="nm">${esc(s.ult.n)}</b>${dots(s.ult.aw)}</div>
 <div class="un-eqs">${SLOTS.map(([sl,g])=>slotBtn(id,sl,g)).join('')}</div>
 <button class="td-btn un-bd" data-a="board" aria-label="星盤">星盤</button>${sheetHTML(id)}`;}
function draw(){root.innerHTML=cur?detail(cur):list();}
function onClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='home')return close();if(a==='list'){cur=null;sheet=null;draw();root.scrollTop=0;return;}
 if(a==='pick'){cur=v;sheet=null;draw();root.scrollTop=0;return;}
 if(a==='nav'){const all=byRole(),i=all.indexOf(cur);cur=all[(i+(+v)+all.length)%all.length];sheet=null;draw();return;}
 if(a==='lv'){if(b.getAttribute('aria-disabled'))return;const k=GROW.lvUp(cur,+v||1);if(k){try{SFX.aw();}catch(x){}save();}draw();return;}
 if(a==='mas'){if(b.getAttribute('aria-disabled'))return;const sk=TDD.HERO[cur].sk;if(RSM.canUp(cur,sk)===null){RSM.up(cur,sk);save();}draw();return;}
 if(a==='slot'){sheet=sheet===v?null:v;draw();return;}
 if(a==='shut'){sheet=null;draw();return;}
 if(a==='put'){equip(cur,sheet,v);save();sheet=null;draw();return;}
 if(a==='off'){equip(cur,sheet,null);save();sheet=null;draw();return;}
 if(a==='board'){const id=cur;root.classList.add('hide');openBoard(id);return;}}
return{open,close};})();
