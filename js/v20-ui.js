/* ===== ver0.20 UI の全面改善 =====
 1. ホーム画面：上部の資源バー・名前と戦闘力・依頼バナー・左の店ボタン・右の縦メニュー・大きな出撃ボタン・下部ナビ
 2. 各メニュー：操作ボタンを画面下に固定（スクロールしなくても押せる）、店内の絵を小さくして一覧を広く
 3. 戦闘画面：画面の高さに合わせて戦場を縮め、コマンドが常に見えるように。行動中キャラのパネル・技リスト・弱点表示を作り直し
 4. 報酬・レベルアップ：レアリティ別の出現演出、ステータス上昇と習得内容の表示、効果音
 5. キャラ詳細にパッシブ（専用・武器）と習得予定の技を表示 */
'use strict';
const VER20='ver0.20';
const V20UI=(()=>{
const esc=s=>String(s);
const hexEl=(el,col,cls='')=>`<i class="hx20 ${cls}" style="--c:${col||'#8890c0'}">${el||'無'}</i>`;
/* ---------- 効果音（レベルアップ・レア入手） ---------- */
const SFX20={lv:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.14,'square',.05),i*90));setTimeout(()=>tone(1568,.35,'triangle',.06,2093),380);},
 item:r=>{const b=[660,880,990,1320,1760][r]||660;tone(b,.06,'square',.03);if(r>=2)setTimeout(()=>tone(b*1.5,.12,'triangle',.05),70);if(r>=4){setTimeout(()=>tone(b*2,.3,'triangle',.06,b*3),160);setTimeout(()=>tone(392,.5,'sawtooth',.03,784),40);}},
 tick:()=>tone(1200,.02,'square',.015),win:()=>{[392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18,'square',.05),i*110));}};

/* ==================== 画面サイズ（セーフエリア・戦闘の縮小） ==================== */
function pads(){const s=getComputedStyle($('#app'));return(parseFloat(s.paddingTop)||0)+(parseFloat(s.paddingBottom)||0);}
fit=function(){const sw=Math.max(1,Math.floor(Math.min(innerWidth,480)/W));let s=sw;
 if(scene==='battle'){const avail=innerHeight-pads()-438;s=Math.max(1.35,Math.min(sw,avail/H));s=Math.floor(s*8)/8;}
 SC=s;const st=$('#stage');cv.style.width=W*SC+'px';cv.style.height=H*SC+'px';st.style.width=W*SC+'px';st.style.height=H*SC+'px';
 if(scene==='battle'&&B)refresh();if(scene==='board'&&typeof sizeBoard==='function')sizeBoard();if(scene==='field'&&F&&typeof fitField==='function')fitField();};
addEventListener('resize',()=>{fit();});
addEventListener('resize',()=>{if(scene==='town'&&TSC==='home'&&G&&H!==(innerHeight<600?128:HOME_H))townMenu();});

/* ==================== 戦闘画面 ==================== */
{const _sh=show;show=function(m){_sh(m);$('#app').classList.toggle('v20',true);let r=$('#rnd20');if(!r){r=document.createElement('div');r.id='rnd20';$('#top').insertBefore(r,$('#order'));}
 if(m!=='battle'){const k=$('#skn20');if(k)k.remove();}};}
/* 行動中キャラのパネル */
function partyPanel(){const P=$('#party'),a=B.cur&&B.cur.side===0?B.cur:(B.lastH&&B.heroes.includes(B.lastH)?B.lastH:B.heroes[0]);if(!a)return;
 const my=B.cur===a,rdy=my&&!!B.pick&&a.ag>=100&&!a.aw&&B.heroes.filter(h=>h.aw).length<2,low=a.hp<a.mhp*.3,el=elOf(a.id),ec=ELC[el]||'#c8b0ff';
 const ag=a.aw?(GAUGE.includes(a.id)?Math.round(a.ag)+'':'残'+Math.max(0,awN(a)-a.awT)):Math.floor(a.ag)+'%';
 const sts=(a.sts||[]).map(s=>{const b=V20.isBuff(s),nm=s.k==='weak'?s.el:(V20.STN[s.k]||['',''])[1];return`<i class="si20 ${b?'bu':'de'}">${nm}${(['atk','def','mag','res','spd','crit'].includes(s.k))?(s.v>0?'▲':'▼'):''}${s.t<50?`<sub>${s.t}</sub>`:''}</i>`;}).join('');
 const ht=`<div class="bp20${a.aw?' awk':''}${my?'':' off'}" style="--ec:${ec}"><i class="ap1" style="display:none"></i>
  <div class="bpL"><div class="bpN">${hexEl(el,ec,'sm')}<b>${a.name}</b><small>Lv${G.h[a.id].lv}　${clsOf(a.id)}</small></div>
   <div class="bpO${a.ag>=100&&!a.aw?' full':''}${a.aw?' on':''}"><em>${a.aw?AW[a.id].name:'OVER DRIVE'}</em><div class="g"><i style="width:${Math.min(100,a.ag)}%"></i></div><span>${ag}</span></div></div>
  <button id="awB" class="${rdy?'rdy':''}${a.aw?' on':''}" ${rdy?'':'disabled'}>${a.aw?'覚醒中':'覚醒'}<small>${a.aw?awTag(a).trim():rdy?'行動を消費しない':'AG100%で'}</small></button>
  <img class="bpF" src="${art(a.id,a.aw)}">
  <div class="bpS"><div class="bx hp${low?' low':''}"><em>HP</em><b>${a.hp}</b><small>/${a.mhp}</small></div><div class="bx sp"><em>SP</em><b>${a.sp}</b><small>/100</small></div><div class="bx ts">${sts||tagH(a)||'<small class="nst">状態異常なし</small>'}</div></div></div>`;
 if(P._h20!==ht||!P.querySelector('.bp20')){P._h20=ht;P.className='act v20';P.innerHTML=ht;}}
/* 狙っている敵の情報（名前・HP・属性の弱点） */
function targetPanel(){const tp=$('#labels .tgp'),t=B.tgt;if(!tp||!t)return;const unk=t.weak.length-t.known.size,pc=Math.max(0,t.hp/t.mhp*100),tmp=(t.sts||[]).filter(s=>s.k==='weak').map(s=>s.el);
 const h=`<div class="tn20">${t.boss?'<em class="boss">BOSS</em>':'<em>TARGET</em>'}<b>${t.name}</b>${t.broken?'<span class="bk20">BREAK</span>':`<span class="sd20">◆${t.brk}</span>`}</div>
  <div class="thp20"><i style="width:${pc}%"></i><u style="width:${pc}%"></u></div>
  <div class="els20">${ELS10.map(e=>{const k=t.known.has(e)&&t.weak.includes(e),tm=tmp.includes(e);return`<span class="${k?'w':''}${tm?' tm':''}" style="--c:${ELC[e]}"><i>${e}</i>${k?'<b>▲</b>':''}</span>`;}).join('')}${unk>0?`<u>?×${unk}</u>`:''}</div>
  ${(t.sts||[]).length||t.charging?`<div class="tst20">${tagH(t)}</div>`:''}`;
 if(tp._h20!==h){tp._h20=h;tp.innerHTML=h;tp.classList.add('v20');}}
/* 味方の横の小さな表示に状態アイコンを足す */
function heroLabels(){B.heroes.forEach(h=>{const el=h._pl;if(!el)return;let s=el.querySelector('.s20');if(!s){s=document.createElement('div');s.className='s20';el.appendChild(s);}
 const v=(h.sts||[]).slice(0,4).map(x=>`<i class="${V20.isBuff(x)?'bu':'de'}">${x.k==='weak'?x.el:(V20.STN[x.k]||['',''])[1]}</i>`).join('');if(s._v!==v){s._v=v;s.innerHTML=v;}});}
{const _rf=refresh;refresh=function(){_rf();if(!B||scene!=='battle')return;try{partyPanel();targetPanel();heroLabels();const r=$('#rnd20');if(r)r.innerHTML=`<small>TURN</small><b>${B.turns}</b>`;}catch(e){console.error(e);}};}
/* 技リストの装飾：種類アイコン・説明ボタン */
const GLY={'守':'shield','替':'swap','逃':'run','道':'potion','共':'star','解':'star','癒':'heart','補':'up','味':'heart'};
const SVG={shield:'<path d="M8 1l6 2v5c0 3.5-2.6 6-6 7-3.4-1-6-3.5-6-7V3z"/>',swap:'<path d="M2 5h9l-3-3M14 11H5l3 3" fill="none" stroke-width="2"/>',run:'<path d="M9 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM6 7l3-1 2 3 3 1-1 1-3-1-1 2 2 3-1 1-3-3-2 3-2-1 3-4z"/>',
 potion:'<path d="M6 1h4v3l3 4v6H3V8l3-4z"/>',star:'<path d="M8 1l2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5z"/>',heart:'<path d="M8 14S1 9.5 1 5.5A3.5 3.5 0 018 4a3.5 3.5 0 017 1.5C15 9.5 8 14 8 14z"/>',up:'<path d="M8 1l6 7h-4v7H6V8H2z"/>',sword:'<path d="M13 1h2v2L7 11l1 1-1 1-1-1-2 2-2-2 2-2-1-1 1-1 1 1z"/>'};
const svg=k=>`<svg viewBox="0 0 16 16" class="gl20">${SVG[k]}</svg>`;
function decorate(){const c=$('#cmd');if(!c.classList.contains('bcmd'))return;c.querySelectorAll('.blist .sk:not([data-v20])').forEach(b=>{b.dataset.v20=1;const e=b.querySelector('.el');if(!e)return;const t=e.textContent.trim();e.classList.add('hx20');
  e.style.setProperty('--c',e.style.background||e.style.backgroundColor);if(GLY[t])e.innerHTML=svg(GLY[t]);const nm=b.querySelector('.nm');if(nm&&/^通常攻撃|^魔弾|^攻撃/.test(nm.textContent))b.classList.add('basic');
  if(!b.querySelector('.inf20')&&c.querySelector('.btabs')){const i=document.createElement('span');i.className='inf20';i.textContent='i';b.appendChild(i);}});}
new MutationObserver(()=>{try{decorate();}catch(e){}}).observe($('#cmd'),{childList:true,subtree:false});
/* 技名の表示と、強力な技の演出 */
function skillBanner(u,sk){if(!B||scene!=='battle')return;let k=$('#skn20');if(!k){k=document.createElement('div');k.id='skn20';$('#stage').appendChild(k);}
 const el=sk.el||(sk.k==='sup20'||sk.k==='heal'||sk.k==='healAll'?'補':'無'),col=ELC[sk.el]||(sk.role==='heal'||/heal/.test(sk.k)?'#7dffa8':'#ffe27a');
 k.className=u.side?'e':'';k.innerHTML=`${hexEl(el,col,'sm')}<b>${sk.n}</b>`;k.classList.remove('show');void k.offsetWidth;k.classList.add('show');}
const BIG=sk=>sk&&((sk.pow||0)*(sk.hits||1)>=2.4||(sk.t==='all'&&(sk.pow||0)*(sk.hits||1)>=1.2)||/^goku/.test(Object.keys(SK).find(x=>SK[x]===sk)||''));
{const _da=doAction;doAction=async function(u,sk,t){try{if(B&&u&&sk&&sk.n&&!sk.basic&&!['guard','item'].includes(sk.k)&&u.side===0){skillBanner(u,sk);
  if(BIG(sk)){const st=$('#stage');st.classList.remove('imp20');void st.offsetWidth;st.classList.add('imp20');B.flashBg=Math.max(B.flashBg||0,12);B.flashCol=ELC[sk.el]||'#ffffff';}}}catch(e){}
 return _da(u,sk,t);};}
/* 敵の溜め技にも技名を出す */
{const _et=enemyTurn;enemyTurn=async function(e){const ch=e.charging;const r=_et(e);try{if(ch&&ED[e.kind]&&ED[e.kind].ai){const s=EA[ED[e.kind].ai.charge];if(s)skillBanner(e,s);}}catch(x){}return r;};}

/* ==================== ホーム画面 ==================== */
const HMENU=[['rec','rec','メニュー'],['quest','quest','依頼'],['inv','gear','持ち物'],['zk','book','図鑑'],['bond','bond','絆'],['dev','door','発展']];
const HNAV=[['home','door','ホーム'],['party','eq','編成'],['star','star','星詠み'],['smith','smith','鍛冶屋'],['tavern','bar','酒場'],['shop','shop','道具屋']];
function goH(k){({rec:()=>saveMenu(),home:()=>townMenu(),quest:()=>board(),inv:()=>invMenu(),zk:()=>zkMenu(),bond:()=>bondMenu(),trial:()=>trialMenu(),dev:()=>devMenu()})[k]?.();}
const homeH20=()=>innerHeight<600?128:HOME_H;
townMenu=function(m){WMS.on=false;TSC='home';if(scene!=='town')show('town');const hh=homeH20();if(H!==hh)setH(hh);devBtn(!!G.dev);hud('');$('#stage').style.display='';
 const un=G.inv.filter(i=>i.unid).length,pts=G.members.some(i=>ptsLeft(i)>0),bn=typeof bondReadyN==='function'?bondReadyN():0,qr=QS.filter(q=>!G.q.done[q.id]&&q.ok()).length,
  qd=QS.filter(q=>G.q.done[q.id]).length,gd=G.fac.garden&&G.garden.n,pw=G.party.reduce((s,id)=>s+power(id),0),tr=G.members.some(id=>{const l=G.h[id].awLv||1;return l<3&&G.h[id].lv>=(l===1?15:30);});
 log((m||'大灯（おおあかり）に守られた最後の街。準備を整えよう。')+(!G.dev&&G.sorties-(G.lastExp??0)>=8?'<br><small style="color:#ffb030">⚠ しばらく記録の控えを取っていません。「メニュー→書き出す」で控えを</small>':''));
 if(G.flags.boss8&&typeof voidNews==='function')$('#msg').insertAdjacentHTML('beforeend',voidNews());
 const bd=(n)=>n?`<i class="bd20">${n===true?'!':n}</i>`:'';
 const badge={dev:gd?true:0,quest:qr,bond:bn,inv:0,zk:0,rec:0,party:pts,star:pts,tavern:bn+qr,smith:0,shop:0,appraise:un,home:0};
 $('#labels').innerHTML=`<div class="h20top"><span class="rs"><img src="${ICON.tou}"><b>${fmt(G.tou||0)}</b></span><span class="rs"><img src="${ICON.go}"><b>${G.sorties}</b><small>出撃</small></span><span class="rs g"><img src="${ICON.coin}"><b>${fmt(G.gold)}</b></span></div>
  <div class="h20name"><b>灯都ルミナス</b><span class="ch">${chapter()}</span><em>パーティ戦闘力</em><strong>${fmt(pw)}</strong></div>
  <button class="h20mis${qr?' rdy':''}" data-g20="quest"><span class="mt">依頼ミッション<small>${qr?'報告して報酬GET!':'達成して報酬GET!'}</small></span><span class="mstep"><b>${qd}</b>/${QS.length}</span><span class="mbar"><i style="width:${QS.length?qd/QS.length*100:0}%"></i></span>${qr?`<i class="bd20">${qr}</i>`:''}</button>
  <div class="h20left">${[['shop','shop','道具屋','回復薬'],['smith','smith','鍛冶屋','強化・売買'],['appraise','eye','鑑定屋',un?'未鑑定'+un:'鑑定']].map(([g,ic,l,s])=>`<button class="hsh20" data-go="${g}"><span class="dia"><img src="${ICON[ic]}"></span><b>${l}</b><small>${s}</small>${bd(badge[g])}</button>`).join('')}
</div>
  <div class="h20right">${HMENU.map(([g,ic,l])=>`<button data-g20="${g}"><img src="${ICON[ic]}"><small>${l}</small>${bd(badge[g])}</button>`).join('')}</div>`;
 const c=$('#cmd');c.className='home20';c.innerHTML=`<div class="h20act"><div class="h20pt" data-go="party">${G.party.map(id=>{const s=stats(id),h=G.h[id],hp=h.hp??s.mhp;return`<div class="pf" style="--ec:${elCol(id)}"><img src="${face(id)}"><small>Lv${h.lv}</small><i style="width:${Math.max(0,Math.min(100,hp/s.mhp*100))}%"></i></div>`;}).join('')}<em>編成・装備 ▶</em></div>
  <button class="h20tr${tr?' rdy':''}" data-g20="trial"><b>挑戦</b><small>覚醒の試練</small></button>
  <button class="h20go" data-go="go"><span><b>出撃</b><small>WORLD MAP</small></span></button></div>
  ${(()=>{let w=null;try{w=[...WAREAS].reverse().find(x=>x.need());}catch(e){}const A=w&&AREAS[w.id],nm=w?(w.nm||(A&&A.name)||''):'',rc=w?((A&&A.rec)||(w.rec&&w.rec())||''):'',np=G.members.reduce((a,i)=>a+Math.max(0,ptsLeft(i)),0);
   return`<div class="h20info"><button class="nx" data-go="go"><em>${w?w.ch:''}</em><b>次の目的地：${nm}</b><small>${rc}</small><i>▶</i></button>
   <div class="tips">${un?`<button data-go="appraise">未鑑定品 <b>${un}</b>個</button>`:''}${np?`<button data-go="star">星ポイント <b>${fmt(np)}</b></button>`:''}${tr?`<button data-g20="trial">覚醒の試練に挑める</button>`:''}${qr?`<button data-g20="quest">報告できる依頼 <b>${qr}</b>件</button>`:''}${bn?`<button data-g20="bond">新しい絆の話 <b>${bn}</b>件</button>`:''}</div></div>`;})()}
  <nav class="h20nav">${HNAV.map(([g,ic,l])=>`<button ${g==='home'?'class="on" data-g20="home"':`data-go="${g}"`}><img src="${ICON[ic]}"><b>${l}</b>${bd(badge[g])}</button>`).join('')}</nav>`;
 tip('town');};
document.addEventListener('click',e=>{const t=e.target.closest('[data-g20]');if(!t||scene!=='town'||t.disabled)return;SFX.sel();goH(t.dataset.g20);});
/* 下部ナビの data-go を #cmd.home20 でも効くようにする（既存の処理は #cmd.home のみ） */
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(!t||scene!=='town'||TSC!=='home'||t.disabled)return;if(!t.closest('#cmd.home20'))return;SFX.sel();goFac(t.dataset.go);});

/* ==================== メニュー画面：操作ボタンを下に固定 ==================== */
const FOOTSEL=':scope > .tbar2, :scope > .tbar3, :scope > .cbtn, :scope > .bdb, :scope > .tbtn.back.wide, :scope > .tbtn.wide';
{const _pn=panel;panel=function(html,acts){_pn(html,acts);try{const c=$('#cmd'),els=[...c.querySelectorAll(FOOTSEL)];if(!els.length)return;
 /* 末尾にまとまっているボタン群だけを固定する */
 const kids=[...c.children];let i=kids.length-1;const tail=[];while(i>=0&&els.includes(kids[i])){tail.unshift(kids[i]);i--;}if(!tail.length)return;
 const f=document.createElement('div');f.className='foot20';tail.forEach(x=>f.appendChild(x));c.appendChild(f);c.classList.add('hasfoot');}catch(e){console.error(e);}};}
/* 店内の絵を小さくして一覧を広く */
try{Object.assign(ROOMH,{bar:innerHeight<760?80:96,shop:innerHeight<760?72:92,smith:innerHeight<760?64:80,eye:innerHeight<760?64:80});}catch(e){}

/* ==================== キャラ詳細：パッシブと習得予定の技 ==================== */
{const _ch=charHTML;charHTML=function(id,tab,ed){const s=_ch(id,tab,ed);if(tab!=='sk')return s;try{const lv=G.h[id].lv,cp=V20.charPS(id),w=G.h[id].eq.w&&findItem(G.h[id].eq.w),wp=V20.wpOf(w);
 const ps=`<div class="sh2">パッシブスキル</div><div class="ps20">${cp.map(p=>{const P=V20.PS[p.id];return`<div class="pr20${p.on?'':' lock'}"><i>${p.on?'専用':'Lv'+p.lv}</i><b>${P.n}</b><small>${P.d}</small></div>`;}).join('')}
  <div class="pr20 w${wp?'':' lock'}"><i>武器</i><b>${wp?wp.n:'なし'}</b><small>${wp?wp.d:'アンコモン以上の武器を装備すると、武器ごとの固有パッシブが付く'}</small></div></div>
  <div class="sh2">習得予定の技</div><div class="ps20">${(V20.LSK[id]||[]).map(([l,k])=>`<div class="pr20${lv>=l?'':' lock'}"><i>${lv>=l?'習得':'Lv'+l}</i><b>${SK[k].n}</b><small>SP${SK[k].sp||0}　${SK[k].d}</small></div>`).join('')}</div>`;
 return s.slice(0,s.length-6)+ps+'</div>';}catch(e){console.error(e);return s;}};}

/* ==================== 報酬・レベルアップの演出 ==================== */
let RW=null;const STK=[['mhp','HP'],['atk','攻撃'],['def','防御'],['mag','魔力'],['res','精神'],['spd','素早さ']];
{const _al=addLoot;addLoot=function(it){const r=_al(it);try{if(RW&&RW.col)RW.items.push({it,txt:r});}catch(e){}return r;};}
{const _rw=rewards;rewards=function(es){const snap={};try{for(const id of G.members)snap[id]={lv:G.h[id].lv,st:stats(id),sk:skillList(id),ps:V20.charPS(id).filter(p=>p.on).map(p=>p.id),job:G.h[id].job?G.h[id].jobs[G.h[id].job].lv:0};}catch(e){}
 RW={col:true,items:[]};let r;try{r=_rw(es);}finally{RW.col=false;}
 try{RW.r=r;RW.ups=[];for(const id of G.members){const s0=snap[id];if(!s0)continue;const h=G.h[id];if(h.lv>s0.lv){const s1=stats(id),sk=skillList(id).filter(k=>!s0.sk.includes(k)),ps=V20.charPS(id).filter(p=>p.on&&!s0.ps.includes(p.id)).map(p=>V20.PS[p.id]);
   RW.ups.push({id,lv0:s0.lv,lv1:h.lv,d:STK.map(([k,l])=>[l,k==='spd'?+(s1[k]-s0.st[k]).toFixed(1):s1[k]-s0.st[k],k==='spd'?+s1[k].toFixed(1):s1[k]]),sk,ps,party:G.party.includes(id)});}}}catch(e){console.error(e);}
 return r;};}
function lootCard(x,i){const it=x.it,sold=/自動(売却|分解)/.test(x.txt||''),r=it.rar||0,c=RAR[r];
 return`<div class="lt20 r${r}${sold?' sold':''}" style="--d:${.35+i*.16}s;--rc:${c.c}"><div class="lb"><img src="${itemIcon(it)}"></div><div class="li"><b>${it.unid?'？？？':esc(it.name)}</b><small>${c.n}${it.who&&HB[it.who]?'・'+HB[it.who].name+'専用':''}${sold?'（自動処理）':''}</small></div>${r>=3?'<i class="ray"></i>':''}</div>`;}
function rewardHTML(){const r=RW.r,dr=Object.entries(r.drops||{}).map(([k,n])=>`<span class="mt20"><img src="${ICON[k]||ICON.haiseki}">${MATS[k].n}×${n}</span>`).join('')+(r.sts||[]).map(n=>`<span class="mt20 st">◆${n}</span>`).join('');
 const its=RW.items.slice(0,12),best=Math.max(-1,...its.map(x=>x.it.rar||0)),ups=RW.ups;
 return`<div class="rw20${best>=4?' leg':best>=3?' epic':''}"><div class="rwT"><span>V</span><span>I</span><span>C</span><span>T</span><span>O</span><span>R</span><span>Y</span></div>
  <div class="rwG"><div><em>EXP</em><b data-n="${r.xp}">0</b></div><div><em>GOLD</em><b data-n="${r.gold}">0</b></div><div><em>灯力</em><b data-n="${r.tou||0}">0</b></div></div>
  ${dr?`<div class="rwM">${dr}</div>`:''}
  ${its.length?`<div class="rwL"><div class="rwh">獲得した装備 ${RW.items.length}</div>${its.map(lootCard).join('')}${RW.items.length>12?`<small class="more">ほか${RW.items.length-12}個</small>`:''}</div>`:''}
  ${ups.length?`<div class="rwU">${ups.filter(u=>u.party).map((u,i)=>`<div class="lu20${u.party?'':' bench'}" style="--d:${.6+its.length*.16+i*.35}s;--ec:${elCol(u.id)}"><img class="lf" src="${art(u.id)}"><div class="lm"><div class="lt"><b>LEVEL UP!</b><span>${HB[u.id].name}</span><em>Lv${u.lv0} ▶ <strong>Lv${u.lv1}</strong></em></div>
   <div class="ls">${u.d.filter(x=>x[1]>0).map(([l,dv,v])=>`<span><i>${l}</i>${v}<u>+${dv}</u></span>`).join('')}<span class="sp"><i>星P</i><u>+${(u.lv1-u.lv0)*3}</u></span></div>
   ${u.sk.length||u.ps.length?`<div class="ln">${u.sk.map(k=>`<span class="nsk">新技「${SK[k].n}」</span>`).join('')}${u.ps.map(p=>`<span class="nps">パッシブ「${p.n}」</span>`).join('')}</div>`:''}</div></div>`).join('')}</div>`:''}
  ${ups.some(u=>!u.party)?`<div class="rwB" style="--d:${.6+its.length*.16+ups.filter(u=>u.party).length*.35}s"><span>控え</span>${ups.filter(u=>!u.party).map(u=>`<span>${HB[u.id].name} Lv${u.lv1}${u.sk.length?' <b>新技</b>':''}${u.ps.length?' <b>パッシブ</b>':''}</span>`).join('')}</div>`:''}
  ${(r.ups||[]).filter(s=>!/ Lv\d+（星ポイント/.test(s)).length?`<div class="rwJ">${r.ups.filter(s=>!/ Lv\d+（星ポイント/.test(s)).map(s=>`<span>${s}</span>`).join('')}</div>`:''}
  <button class="big rwC" id="cont">続ける</button><div class="rwS">タップで演出をスキップ</div></div>`;}
function playReward(ov){const box=ov.querySelector('.rw20');if(!box)return;let skip=false;const timers=[];const T=(f,ms)=>timers.push(setTimeout(f,ms));
 SFX20.win();
 box.querySelectorAll('.rwG b').forEach((b,i)=>{const n=+b.dataset.n,t0=performance.now()+250+i*120,D=700;const step=()=>{if(skip){b.textContent=fmt(n);return;}const k=Math.min(1,(performance.now()-t0)/D);if(k<0){requestAnimationFrame(step);return;}b.textContent=fmt(Math.round(n*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);});
 box.querySelectorAll('.lt20').forEach(el=>{const d=parseFloat(el.style.getPropertyValue('--d'))*1000,r=+((el.className.match(/r(\d)/)||[])[1]||0);T(()=>{if(!skip)SFX20.item(r);},d);});
 box.querySelectorAll('.lu20').forEach(el=>{const d=parseFloat(el.style.getPropertyValue('--d'))*1000;T(()=>{if(!skip)SFX20.lv();},d);});
 const sk=()=>{if(skip)return;skip=true;timers.forEach(clearTimeout);box.classList.add('skip');};
 box.addEventListener('pointerdown',e=>{if(e.target.closest('#cont'))return;sk();});
 const last=Math.max(0,...[...box.querySelectorAll('.lt20,.lu20')].map(el=>parseFloat(el.style.getPropertyValue('--d'))*1000));T(()=>box.classList.add('done'),last+700);}
{const _end=end;end=async function(win){const r=await _end(win);try{const ov=$('#ov');if(win&&RW&&RW.r&&ov&&/VICTORY/.test(ov.innerHTML)){const oc=$('#cont')&&$('#cont').onclick;ov.classList.add('rw20ov');ov.innerHTML=rewardHTML();const c=$('#cont');if(c)c.onclick=oc;playReward(ov);
  /* 戦場のキャラにも LEVEL UP を出す */
  if(B)RW.ups.forEach(u=>{const h=B.heroes.find(x=>x.id===u.id);if(h&&h.alive)setTimeout(()=>pop(h,'LEVEL UP!','#ffe27a',true,'lvup20'),300);});RW.r=null;}
  else if(ov){ov.classList.remove('rw20ov');}}catch(e){console.error(e);}return r;};}
/* 次の画面に移ったら報酬画面の装飾を外す */
{const _sh=show;show=function(m){_sh(m);try{$('#ov').classList.remove('rw20ov');}catch(e){}};}

/* ==================== 開発者メニュー：ver0.20 ==================== */
function demoReward(){const its=[0,1,2,3,4].map(r=>{const it=genItem(40,r,0,r%2?'w':null,r);it.unid=r===3;return{it,txt:''};});
 RW={col:false,items:its,r:{xp:12345,gold:6789,tou:420,drops:{kakera:3,kiba:2},sts:['紅玉'],ups:[]},ups:G.party.map(id=>{const s=stats(id),L=G.h[id].lv;return{id,lv0:L,lv1:L+1,party:true,d:STK.map(([k,l])=>[l,k==='spd'?.3:Math.max(1,Math.round(s[k]*.03)),k==='spd'?+s[k].toFixed(1):s[k]]),sk:id===G.party[0]?[(V20.LSK[id]||[[0,'kobu']])[0][1]]:[],ps:id===G.party[1]?[V20.PS[V20.CPS[id][1]]]:[]};})};
 const ov=$('#ov');ov.classList.remove('hide');ov.classList.add('rw20ov');ov.innerHTML=rewardHTML();$('#cont').onclick=()=>{ov.classList.add('hide');ov.classList.remove('rw20ov');ov.innerHTML='';dvMenu();};playReward(ov);RW.r=null;}
function dev20(){log('<b>ver0.20</b>　状態効果・パッシブ・新スキル・報酬演出の確認');
 menu([{l:'状態効果テスト（氷華の妖狐）',s:'激昂・毒・弱体・障壁・反撃',cls:'ready',f:()=>{G.party=['valk','noah','crow','mire'].filter(x=>G.members.includes(x));devBattle([{kind:'boss5',lv:30}],'kouka',{theme:'ice'});}},
  {l:'鼓舞する敵との戦闘',s:'亡霊騎士・影法師',f:()=>devBattle([{kind:'darkknight',lv:30},{kind:'shade',lv:30},{kind:'shade',lv:30}],'seido',{boss:false})},
  {l:'報酬・レベルアップ演出',s:'全レアリティの出現演出',f:demoReward},
  {l:'パッシブ・技の一覧',s:'キャラ詳細「技・覚醒」タブ',f:()=>{enterTown();openSheet(G.party[0],'sk');}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd('ver0.20 戦闘の深化・UI刷新','状態効果・パッシブ・報酬演出',dev20,0,'ready');}catch(e){}};}

/* ==================== 版表示 ==================== */
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER20;};const v=$('#verL');if(v)v.textContent=VER20;}
try{document.title='アストラル・ブレイカー '+VER20;}catch(e){}
return{partyPanel,targetPanel,skillBanner,SFX20,demoReward,dev20};})();
