/* ===== 開発者モードの正本（タイトルの「開発者モード」・ホームの ≡ の DEV）=====
 置き換え：旧 js/dev.js と js/ver17.js の devStart／devGame（ver0.53 の旧コマンド戦闘の削除で消え、ボタンを押しても反応しなくなっていた）。
 通常のセーブとは別の枠（DEVKEY）に、全員加入・Lv・お金・経験値・錬磨石・TD の全ステージを開放したデータを作る。
 旧 v22 の「入ったら全開放」の差し込みも置き換えた（開放は devGame と DEV の窓の「全開放」）。 */
'use strict';
const DEVKEY='astral_dev_v1';
/* 全データを開放：仲間を全員・Lv40・星臨の位階 3、TD の全ステージ（星 3）、お金・経験値・錬磨石。戻り値は短い要約 */
function devUnlockAll(){if(!G||!G.dev)return'';let n=0;
 for(const id of Object.keys(TDD.HERO))if(typeof HB!=='undefined'&&HB[id]&&!(G.members||[]).includes(id)){try{newMember(id);n++;}catch(e){console.error(e);}}
 for(const id of G.members||[]){const h=G.h[id];if(!h)continue;h.lv=Math.max(h.lv||1,40);h.xp=0;h.hp=null;h.awLv=3;}
 G.td=G.td||{c:{}};G.td.c=G.td.c||{};G.td.v=1;for(const id of TDD.ORDER)if(!TDD.STAGE[id].inf)G.td.c[id]=3;
 G.gold=Math.max(G.gold||0,999999);G.xpStock=Math.max(G.xpStock||0,999999);G.mats=G.mats||{};G.mats[TDD.STONE]=Math.max(G.mats[TDD.STONE]||0,99);
 try{save();}catch(e){}return`仲間 +${n}・全ステージ`;}
function devGame(){SAVE=DEVKEY;migrate(newGame());G.dev=1;devUnlockAll();}
/* タイトルの「開発者モード」：開発データがあれば「続き／作り直す」を選ぶ */
function devStart(){const ov=$('#ov');SAVE=DEVKEY;const s=loadSave();
 const go=()=>{try{setSpeed(G.speed||1);}catch(e){}enterTown('<b>開発者モード</b>');};
 if(!s){devGame();return go();}
 ov.innerHTML=`<div class="tlogo" style="font-size:26px">DEV</div><div class="tmenu in44" id="tm"><button class="big gold" id="dc">続き</button><button class="big" id="dn">作り直す</button><button class="big" id="db">タイトル</button></div>`;
 $('#dc').onclick=()=>{migrate(Object.assign(newGame(),s));G.dev=1;go();};$('#dn').onclick=()=>{devGame();go();};$('#db').onclick=()=>title();}
/* ホームの ≡ → DEV：育成の素材を足す・ステージへ直行・進み具合を戻す */
const DEVUI=(()=>{let el=null;
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function open(){if(!G||!G.dev)return;close();el=document.createElement('div');el.className='dvp';el.addEventListener('click',onClick);document.body.appendChild(el);draw();}
 function close(){if(el){el.remove();el=null;}}
 function draw(){const C=TDD.CH||[];
  el.innerHTML=`<div class="dvp-in"><h3>DEV<button class="dvp-x" data-d="x" aria-label="閉じる">×</button></h3>
  <div class="dvp-g"><button data-d="lv">Lv +10</button><button data-d="gold">ゴールド・経験値</button><button data-d="stone">錬磨石 +50</button><button data-d="all">全開放</button><button data-d="reset">星を 0 に</button><button data-d="title">タイトル</button></div>
  ${[...C,{ch:'天への塔',n:'',st:[TDD.INF]}].map(c=>`<h4>${esc(c.ch)} ${esc(c.n||'')}</h4><div class="dvp-s">${(c.st||[]).map(id=>{const S=TDD.STAGE[id];return S?`<button data-d="go" data-v="${id}">${esc(S.name)}<small>Lv${S.lv||''}</small></button>`:'';}).join('')}</div>`).join('')}</div>`;}
 function onClick(e){const b=e.target.closest('[data-d]');if(!b){if(e.target===el)close();return;}const a=b.dataset.d;try{SFX.sel();}catch(_){}
  if(a==='x')return close();
  if(a==='lv'){for(const id of G.members)if(G.h[id])G.h[id].lv=Math.min(99,(G.h[id].lv||1)+10);}
  else if(a==='gold'){G.gold=(G.gold||0)+999999;G.xpStock=(G.xpStock||0)+999999;}
  else if(a==='stone'){G.mats[TDD.STONE]=(G.mats[TDD.STONE]||0)+50;}
  else if(a==='all')devUnlockAll();
  else if(a==='reset'){G.td.c={};G.td.inf=0;}
  else if(a==='title'){close();return title();}
  else if(a==='go'){close();return TDM.prep(b.dataset.v);}
  try{save();}catch(_){}b.classList.add('ok');setTimeout(()=>b.classList.remove('ok'),300);try{townMenu();}catch(_){}}
 return{open,close};})();
