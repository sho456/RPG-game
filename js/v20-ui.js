/* ===== ver0.20 UI の全面改善 =====
 1. ホーム画面：上部の資源バー・名前と戦闘力・依頼バナー・左の店ボタン・右の縦メニュー・大きな出撃ボタン・下部ナビ
 2. 各メニュー：操作ボタンを画面下に固定（スクロールしなくても押せる）、店内の絵を小さくして一覧を広く
 3. 戦闘画面：画面の高さに合わせて戦場を縮め、コマンドが常に見えるように。行動中キャラのパネル・技リスト・弱点表示を作り直し
 4. 報酬・レベルアップ：レアリティ別の出現演出、ステータス上昇と習得内容の表示、効果音
 5. キャラ詳細にパッシブ（専用・武器）と習得予定の技を表示 */

const VER20='ver0.20';
const V20UI=(()=>{

/* ---------- 効果音（レベルアップ・レア入手） ---------- */

/* ==================== 画面サイズ（セーフエリア・戦闘の縮小） ==================== */

addEventListener('resize',()=>{fit();});
addEventListener('resize',()=>{if(scene==='town'&&TSC==='home'&&G&&H!==(innerHeight<600?128:HOME_H))townMenu();});

/* ==================== 戦闘画面 ==================== */
{const _sh=show;show=function(m){_sh(m);$('#app').classList.toggle('v20',true);let r=$('#rnd20');if(!r){r=document.createElement('div');r.id='rnd20';$('#top').insertBefore(r,$('#order'));}
 };}
/* 行動中キャラのパネル */

/* 狙っている敵の情報（名前・HP・属性の弱点） */

/* 味方の横の小さな表示に状態アイコンを足す */

{const _rf=refresh;refresh=function(){_rf();if(!B||scene!=='battle')return;try{/* ver0.24：隠れたパネル・ラベルは作らない */const r=$('#rnd20');if(r)r.innerHTML=`<small>TURN</small><b>${B.turns}</b>`;}catch(e){console.error(e);}};}
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
function skillBanner(u,sk){if(!B||scene!=='battle'||typeof BFLOW==='undefined')return;BFLOW.bubble(u,sk.n);}/* ver0.42：技名は行動するキャラの吹き出し（js/battle/flow.js） */
const BIG=sk=>sk&&((sk.pow||0)*(sk.hits||1)>=2.4||(sk.t==='all'&&(sk.pow||0)*(sk.hits||1)>=1.2)||/^goku/.test(Object.keys(SK).find(x=>SK[x]===sk)||''));
{const _da=doAction;doAction=async function(u,sk,t){try{if(B&&u&&sk&&sk.n&&!sk.basic&&!['guard','item'].includes(sk.k)&&u.side===0){skillBanner(u,sk);
  if(BIG(sk)){const st=$('#stage');st.classList.remove('imp20');void st.offsetWidth;st.classList.add('imp20');B.flashBg=Math.max(B.flashBg||0,12);B.flashCol=ELC[sk.el]||'#ffffff';}}}catch(e){}
 return _da(u,sk,t);};}
/* 敵の溜め技にも技名を出す */

/* ==================== ホーム画面 ==================== */

function goH(k){({rec:()=>saveMenu(),home:()=>townMenu(),quest:()=>board(),inv:()=>invMenu(),zk:()=>zkMenu(),bond:()=>bondMenu(),trial:()=>trialMenu(),dev:()=>devMenu()})[k]?.();}

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

/* ==================== 報酬・レベルアップの演出 ==================== */
let RW=null;
{const _al=addLoot;addLoot=function(it){const r=_al(it);try{if(RW&&RW.col)RW.items.push({it,txt:r});}catch(e){}return r;};}

/* 次の画面に移ったら報酬画面の装飾を外す */
{const _sh=show;show=function(m){_sh(m);try{$('#ov').classList.remove('rw20ov');}catch(e){}};}

/* ==================== 開発者メニュー：ver0.20 ==================== */

/* ==================== 版表示 ==================== */

try{document.title='アストラル・ブレイカー '+VER20;}catch(e){}
return{};})();
