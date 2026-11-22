/* ===== 仲間の画面（UNIT）：TD 用の一覧＋1 人の詳細。Lv・技 5 つ・奥義・アビリティ 3 つ・装備・星盤をここにまとめる =====
 UNIT.open() で一覧、UNIT.open(id) で詳細、UNIT.open(null, 戻り先の関数)。全画面の #unit（z902）。閉じたら townMenu()。
 能力は TDD.hero(id,lv,TDD.real(id)) の数字。Lv は GROW.lvUp、装備は equip、練達は RSM.up。変えたら save()
 ver0.56：技・奥義・アビリティ・装備は、タップで開く専用の窓（pop）で確かめる。技は 5 つから戦闘で使う 1 つを選ぶ（G.h[id].tdsk）。
 装備の窓は候補ごとに防衛の能力の増減を出し、選んでから付ける。おまかせ（auto）は空いている・弱い枠に一番良い物を付ける（他の仲間からは取らない） */
'use strict';
const UNIT=(()=>{
let root=null,cur=null,pop=null;
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
const skI=k=>{try{return SKICON.html(SK[k]);}catch(e){return'';}};
const byRole=()=>{const o=Object.keys(TDD.ROLE);return(G.members||[]).filter(id=>TDD.HERO[id]&&G.h[id]).sort((a,b)=>o.indexOf(TDD.HERO[a].role)-o.indexOf(TDD.HERO[b].role));};
function build(){if(root)return;root=document.createElement('div');root.id='unit';root.className='hide';document.body.appendChild(root);root.addEventListener('click',onClick);}
let back=null;/* 戻り先（出撃準備から開いたときは出撃準備へ） */
function open(id,bk){build();back=bk||null;pop=null;cur=id&&G.h[id]?id:null;root.classList.remove('hide');draw();root.scrollTop=0;}
function close(){if(root)root.classList.add('hide');const b=back;back=null;if(b){try{b();}catch(e){console.error(e);}return;}try{townMenu();}catch(e){}}
const stats=id=>TDD.hero(id,G.h[id].lv,TDD.real(id));
const itOf=u=>u&&G.inv.find(x=>x.uid===u);
const holder=uid=>{for(const id of G.members||[]){const e=G.h[id]&&G.h[id].eq;if(e)for(const s in e)if(e[s]===uid)return id;}return null;};
function list(){const L=byRole();
 return`<header class="un-h"><button class="td-btn" data-a="home" aria-label="戻る">◀</button><b>仲間</b><span class="un-sum">${xpI}${fm(stk())}</span></header>
 <ul class="un-grid">${L.map(id=>{const d=TDD.HERO[id],R=TDD.ROLE[d.role],s=stats(id);
  return`<li><button data-a="pick" data-v="${id}"><span class="r" style="background:${R.col}"></span><img src="${pic(id,52)}" alt=""><b>${esc(HB[id].name)}</b><span class="mt"><em>Lv${G.h[id].lv}</em><em class="cs">${s.cost}</em></span>${GROW.can(id)?'<i class="un-dot"></i>':''}</button></li>`;}).join('')}</ul>`;}
/* ---------- 装備：付け替えたときの防衛の能力（攻・HP・防）の増減 ---------- */
function trial(id,sl,uid){const h=G.h[id],old=h.eq[sl];h.eq[sl]=uid;let s;try{s=stats(id);}finally{h.eq[sl]=old;}return s;}
const DK=[['atk','攻'],['hp','HP'],['def','防']];
function delta(a,b){return DK.map(([k,g])=>{const d=Math.round(b[k]-a[k]);return d?`<span class="${d>0?'up':'dn'}">${g}${d>0?'+':''}${fm(d)}</span>`:'';}).join('');}
function cands(id,sl){const cu=G.h[id].eq[sl];return G.inv.filter(it=>canEq(it,id,sl)&&it.uid!==cu).sort((a,b)=>score(b,id)-score(a,id)).slice(0,40);}
/* おまかせ：枠ごとに、誰も付けていない物から一番良い物（今より良いときだけ） */
function auto(id){const h=G.h[id];let n=0;for(const[sl]of SLOTS){const cu=itOf(h.eq[sl]),c=cands(id,sl).filter(it=>!holder(it.uid))[0];
  if(c&&(!cu||score(c,id)>score(cu,id))){equip(id,sl,c.uid);n++;}}return n;}
function slotBtn(id,sl,g){const it=itOf(G.h[id].eq[sl]);
 return`<button class="un-eq${it?' r'+(it.rar||0):''}" data-a="slot" data-v="${sl}">${it?`<span class="ic">${itSrc(it)}</span><b>${esc(it.name)}</b>${it.plus?`<em>+${it.plus}</em>`:''}`:`<span class="g">${g}</span>`}</button>`;}
/* ---------- 詳細 ---------- */
function detail(id){const all=byRole(),s=stats(id),d=TDD.HERO[id],R=TDD.ROLE[d.role],h=G.h[id];
 const cap=(()=>{try{return V31.capOf(id);}catch(e){return 99;}})(),max=h.lv>=cap,ok=GROW.can(id),sel=TDD.skSel(id);
 const stat=(g,v)=>`<li><i>${g}</i><b>${v}</b></li>`;
 const sks=TDD.skills(id).map(x=>`<button class="un-sk${x.k===sel?' sel':''}${x.on?'':' lock'}" data-a="sk" data-v="${x.k}" aria-label="${esc(TDD.skName(x.k))}"><span class="i">${skI(x.k)}</span>${x.on?`<b>${esc(TDD.skName(x.k))}</b>${dots(RSM.lvOf(id,x.k))}`:`<b class="lv">${x.how==='lv'?'Lv'+x.lv:'星盤'}</b>`}</button>`).join('');
 const abs=(RSD.AB[id]||[]).map((A,i)=>{const r=RSC.abRank(id,i);return`<button class="un-ab${r?'':' lock'}" data-a="ab" data-v="${i}"><b>${esc(A.n)}</b>${r?dots(r):`<b class="lv">Lv${RSD.ABL[i]}</b>`}</button>`;}).join('');
 return`<header class="un-h"><button class="td-btn" data-a="list" aria-label="一覧">◀</button><b>${esc(s.name)}</b><span class="un-sum">${xpI}${fm(stk())}</span></header>
 <section class="un-hero"><button class="td-btn nv" data-a="nav" data-v="-1" ${all.length<2?'disabled':''}>‹</button>
  <div class="pv"><img src="${pic(id,110)}" alt=""></div><button class="td-btn nv" data-a="nav" data-v="1" ${all.length<2?'disabled':''}>›</button></section>
 <div class="un-id"><span class="role" style="background:${R.col}" title="${esc(R.n)}"></span><span class="el">${esc(R.n)}　${esc(s.el||'')}</span><b>Lv${h.lv}</b>
  <button class="td-btn${ok?' on':' dis'}" data-a="lv" data-v="1" ${ok?'':'aria-disabled="true"'}>+1</button><button class="td-btn${ok?'':' dis'}" data-a="lv" data-v="9999" ${ok?'':'aria-disabled="true"'}>${max?'MAX':'↑'}</button></div>
 <ul class="un-stats">${stat('HP',fm(s.hp))}${stat('攻',fm(s.atk))}${stat('防',fm(s.def))}${stat('間',s.iv)}${stat('射',s.rng)}${s.blk?stat('止',s.blk):stat('費',s.cost)}</ul>
 <h3 class="un-k">技</h3><div class="un-sks">${sks}</div>
 <button class="un-ou" data-a="ou"><span class="i">${skI(RSD.AWX[id]&&RSD.AWX[id].ou)}</span><b>${esc(s.ult.n)}</b>${dots(s.ult.lv)}</button>
 <h3 class="un-k">アビリティ</h3><div class="un-abs">${abs}</div>
 <h3 class="un-k">装備<button class="td-btn ok" data-a="auto">おまかせ</button></h3><div class="un-eqs">${SLOTS.map(([sl,g])=>slotBtn(id,sl,g)).join('')}</div>
 <button class="td-btn un-bd" data-a="board" aria-label="星盤">星盤</button>${popHTML(id)}`;}
/* ---------- 専用の窓 ---------- */
function popHTML(id){if(!pop)return'';let b='';
 if(pop.t==='sk')b=skPop(id,pop.v);else if(pop.t==='ou')b=ouPop(id);else if(pop.t==='ab')b=abPop(id,+pop.v);else if(pop.t==='eq')b=eqPop(id,pop.v);
 return`<div class="un-pop" data-a="shut"><div class="un-pw" data-a="stay">${b}</div></div>`;}
const ph=(icon,name,x='')=>`<div class="un-ph">${icon?`<span class="i">${icon}</span>`:''}<b>${esc(name)}</b>${x}<button class="td-btn" data-a="shut" aria-label="閉じる">✕</button></div>`;
function skPop(id,k){const x=TDD.skills(id).find(x=>x.k===k);if(!x)return'';const s0=SK[k]||{},mas=RSM.lvOf(id,k),use=TDD.skSel(id)===k;
 const h=TDD.hero(id,G.h[id].lv,Object.assign(TDD.real(id),{sk:k,mas}));const cost=mas>=3?0:RSM.costOf(id,k),why=mas>=3?'max':RSM.canUp(id,k);
 return ph(skI(k),TDD.skName(k),`<em class="el">${esc(s0.el||'')}</em>`)+`
 <p class="un-tx">${esc(TDD.skTxt(h.sk))}</p><ul class="un-kv"><li><i>溜め</i><b>${h.sk.ch} 秒</b></li><li><i>習得</i><b>${x.how==='lv'?'Lv'+x.lv:'星盤'}</b></li></ul>
 <div class="un-pr"><i class="k">練達</i>${dots(mas)}<button class="td-btn${why===null?' ok':' dis'}" data-a="mas" data-v="${k}" ${why===null?'':'aria-disabled="true"'}>${why==='max'?'MAX':`${stI()}${cost}`}</button></div>
 <div class="un-pa">${!x.on?`<button class="td-btn dis" aria-disabled="true">${x.how==='lv'?'Lv'+x.lv:'星盤'}</button>`:use?'<button class="td-btn dis" aria-disabled="true">使用中</button>':`<button class="td-btn on" data-a="use" data-v="${k}">使う</button>`}</div>`;}
function ouPop(id){const s=stats(id),U=s.ult,X=RSD.AWX[id]||{};
 return ph(skI(X.ou),U.n,dots(U.lv))+`<p class="un-tx">${esc(U.d||'')}</p><ul class="un-kv">${U.m?`<li><i>威力</i><b>攻撃×${U.m}</b></li>`:''}${U.r?`<li><i>範囲</i><b>${U.r}</b></li>`:''}<li><i>星臨</i><b>${esc(U.aw||'')}</b></li></ul>`;}
function abPop(id,i){const A=(RSD.AB[id]||[])[i];if(!A)return'';const r=RSC.abRank(id,i);
 const row=(e,sp)=>{const t=TDD.abTd(e,id);return`<li class="${t?'on':''}${sp?' sp':''}">${esc(t?t.txt:RSC.effTxt(e))}</li>`;};
 const st=[1,2,3].map(rr=>{const L=A.fx.map(f=>RSC.resolve(f,rr)).filter(RSC.active);
  return`<section class="un-stg${rr===r?' now':''}${rr>r?' fut':''}"><h4>${['','Ⅰ','Ⅱ','Ⅲ'][rr]}</h4><ul>${L.map(e=>row(e)).join('')}${rr===3&&A.sp?`<li class="spn">${esc(A.sp.n)}</li>${A.sp.fx.map(f=>row(Object.assign({},f,{p:f.t==='fu'?f.v:f.p,pow:f.pw}),1)).join('')}`:''}</ul></section>`;}).join('');
 return ph('',A.n,r?dots(r):`<em class="el">Lv${RSD.ABL[i]}</em>`)+`<div class="un-sts">${st}</div>`;}
function eqPop(id,sl){const h=G.h[id],cu=itOf(h.eq[sl]),base=stats(id),L=cands(id,sl),pk=pop.pick&&L.find(it=>it.uid===pop.pick),g=(SLOTS.find(x=>x[0]===sl)||[])[1];
 const card=(it,x)=>`<div class="un-ic r${it.rar||0}"><span class="ic">${itSrc(it)}</span><div><b style="color:${(RAR[it.rar]||RAR[0]).c}">${esc(iname(it))}</b><small>${(it.ops||[]).map(o=>esc(opTxt(o))).join('　')}</small></div>${x||''}</div>`;
 const rows=L.map(it=>{const w=holder(it.uid),s=trial(id,sl,it.uid);return`<li><button class="${pop.pick===it.uid?'sel':''}" data-a="pick2" data-v="${it.uid}"><span class="ic">${itSrc(it)}</span><span class="nm">${esc(iname(it))}</span><span class="dl">${delta(base,s)}</span>${w?`<img class="who" src="${pic(w,24)}" alt="">`:''}</button></li>`;}).join('');
 return ph('',g||'',cu?`<button class="td-btn" data-a="off">外す</button>`:'')+(cu?card(cu):'')+
  (pk?`<div class="un-cmp">${card(pk,`<span class="dl">${delta(base,trial(id,sl,pk.uid))}</span>`)}<button class="td-btn on" data-a="put" data-v="${pk.uid}">装備</button></div>`:'')+
  (L.length?`<ul class="un-cl">${rows}</ul>`:'<div class="un-none">—</div>');}
function draw(){const y=root.querySelector('.un-pw')?root.querySelector('.un-pw').scrollTop:0;root.innerHTML=cur?detail(cur):list();const w=root.querySelector('.un-pw');if(w)w.scrollTop=y;}
function onClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;if(a==='stay')return;
 if(a==='home')return close();if(a==='list'){cur=null;pop=null;draw();root.scrollTop=0;return;}
 if(a==='pick'){cur=v;pop=null;draw();root.scrollTop=0;return;}
 if(a==='nav'){const all=byRole(),i=all.indexOf(cur);cur=all[(i+(+v)+all.length)%all.length];pop=null;draw();return;}
 if(a==='lv'){if(b.getAttribute('aria-disabled'))return;const k=GROW.lvUp(cur,+v||1);if(k){try{SFX.aw();}catch(x){}save();}draw();return;}
 if(a==='sk'){pop={t:'sk',v};draw();return;}if(a==='ou'){pop={t:'ou'};draw();return;}if(a==='ab'){pop={t:'ab',v};draw();return;}
 if(a==='slot'){pop={t:'eq',v};draw();return;}
 if(a==='shut'){if(e.target!==b&&b.classList.contains('un-pop'))return;pop=null;draw();return;}
 if(a==='mas'){if(b.getAttribute('aria-disabled'))return;if(RSM.canUp(cur,v)===null){RSM.up(cur,v);try{SFX.aw();}catch(x){}save();}draw();return;}
 if(a==='use'){G.h[cur].tdsk=v;save();draw();return;}
 if(a==='pick2'){pop.pick=+v===pop.pick?null:+v;draw();return;}
 if(a==='put'){equip(cur,pop.v,+v);save();pop=null;draw();return;}
 if(a==='off'){equip(cur,pop.v,null);save();pop=null;draw();return;}
 if(a==='auto'){const n=auto(cur);if(n){save();try{SFX.sel();}catch(x){}}draw();return;}
 if(a==='board'){const id=cur;root.classList.add('hide');openBoard(id);return;}}
return{open,close};})();
