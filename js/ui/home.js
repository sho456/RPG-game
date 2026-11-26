/* ===== ホーム画面（灯都ルミナス）の正本：「出撃」（コマンド戦闘のステージ）を主役にした重ね表示 =====
 置き換え：js/v22.js townMenu が作る #labels の .h22（依頼リボン・戦闘力・挑戦・NEXT・右の縦メニュー・左列）と
 js/td/menu.js の td-entry。townMenu を最後に 1 回だけ包み、中身を作り直す。背景の街（drawHome）はそのまま。
 クリックは js/v22.js の HGO（data-h22）をそのまま使う。TD への入口は TDM.map / TDM.prep。 */
'use strict';
const HOME=(()=>{
const P={
 xp:'M8 .8l2 4.9 5.2.4-4 3.4 1.3 5.1L8 11.9 3.5 14.6l1.3-5.1-4-3.4L6 5.7z',
 menu:'M1.6 2.6h12.8v2.2H1.6zm0 4.3h12.8v2.2H1.6zm0 4.3h12.8v2.2H1.6z',
 bell:'M8 .8a1.1 1.1 0 011.1 1.1v.6a4.6 4.6 0 013.5 4.5v3.6l1.6 1.6H1.8l1.6-1.6V7a4.6 4.6 0 013.5-4.5v-.6A1.1 1.1 0 018 .8zM6.4 13.4h3.2a1.6 1.6 0 01-3.2 0z',
 bag:'M5 4.4V3.6a3 3 0 016 0v.8h2.2l1 10.6H1.8l1-10.6zm1.6 0h2.8v-.8a1.4 1.4 0 00-2.8 0z',
 book:'M1.4 2.2h5a1.6 1.6 0 011.6 1.6v10.6a1.4 1.4 0 00-1.4-1.2H1.4zm13.2 0h-5A1.6 1.6 0 008 3.8v10.6a1.4 1.4 0 011.4-1.2h5.2z',
 eye:'M8 3.4C4.4 3.4 1.6 6 .6 8c1 2 3.8 4.6 7.4 4.6s6.4-2.6 7.4-4.6c-1-2-3.8-4.6-7.4-4.6zm0 2a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z',
 save:'M1.6 1.6h10.2l2.6 2.6v10.2H1.6zm2.6 1v3.4h6.4V2.6zm1.2 6.6v4h5.2v-4z',
 map:'M1 3.4l4.6-1.8 4.8 1.8 4.6-1.8v11l-4.6 1.8-4.8-1.8L1 14.4zm5 .4v8.6m4-7.4v8.6',
 def:'M8 .6c1.2 3.2 4.6 4.6 4.6 8.8a4.6 4.6 0 01-9.2 0c0-2.4 1.2-3.6 2.2-4.6.1 2.2 1.2 2.9 1.9 2.9C7.1 5.1 7.4 3 8 .6z',
 party:'M5.6 1.8a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zm5.6 1.4a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4zM.8 14.2c0-3 2.2-5 4.8-5s4.8 2 4.8 5zm10.4-4.6c2.2 0 4 1.6 4 4.6h-3.4c0-1.8-.4-3.4-1.4-4.4z',
 up:'M8 1l6.4 7.2H10V15H6V8.2H1.6z',
 smith:'M1 3h9.4v2.2L8 7v1.4h6.4V11H1.6V8.4H4V7L1 5.2zm3 9h9v2.4H4z',
 sword:'M13.2.8h2v2l-8 8 1 1-1.2 1.2-1-1-2.2 2.2-2.2-2.2 2.2-2.2-1-1L3 7.6l1 1z'};
const ic=k=>`<svg class="hm-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="${P[k]}"${k==='map'?' fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"':''}/></svg>`;
const dot=on=>on?'<i class="hm-dot"></i>':'';
/* 次に挑むステージ：前がクリア済みで自分が未クリアの最初。全部クリアなら最後 */
function nextStage(){const O=TDD.ORDER,c=(G.td&&G.td.c)||{};
 for(let i=0;i<O.length;i++){if(!(c[O[i]]>0)&&(i===0||c[O[i-1]]>0))return O[i];}return O[O.length-1];}
function build(){
 const id=nextStage(),S=TDD.STAGE[id]||{},ch=(()=>{try{return TDM.chOf(id).ch;}catch(e){return'';}})();
 let ready=0;try{ready=GROW.readyN();}catch(e){}
 const f=n=>typeof fmt==='function'?fmt(n):n;
 const tabs=[['def','出撃','data-hm="map"'],['party','仲間','data-hm="unit"'],['up','強化','data-h22="tavern"'],['smith','鍛冶','data-h22="smith"']];
 return `<div class="h22 hm">
  <div class="hm-top"><span class="hm-res"><img src="${ICON.coin}" alt=""><b>${f(G.gold||0)}</b></span><span class="hm-res"><i class="hm-xp">${ic('up')}</i><b>${f(G.xpStock||0)}</b></span>
   <button class="hm-bt" data-hm="sheet" aria-label="menu">${ic('menu')}</button></div>
  <div class="hm-sheet" hidden>${[['news','bell','お知らせ'],['inv','bag','持ち物'],['zk','book','図鑑'],['appraise','eye','鑑定'],['menu','save','セーブ']].map(([g,k,l])=>`<button data-h22="${g}">${ic(k)}<b>${l}</b></button>`).join('')}${G.dev?`<button data-hm="dev">${ic('smith')}<b>DEV</b></button>`:''}</div>
  <div class="hm-main"><button class="hm-go" data-hm="prep" data-id="${id}">${ic('def')}<b>${String(S.name||"出撃").replace(/[<>&]/g,"")}</b><small>Lv${S.lv||''}</small></button>
   <button class="hm-map" data-hm="map" aria-label="map">${ic('map')}</button></div>
  <nav class="hm-nav">${tabs.map(([k,l,a])=>`<button ${a}>${ic(k)}<b>${l}</b>${k==='up'?dot(ready>0):''}</button>`).join('')}</nav></div>`;}
{const _tm=townMenu;townMenu=function(){const r=_tm.apply(this,arguments);try{const L=document.querySelector('#labels');if(!L)return r;
 const toast=L.querySelector('.h22toast');L.innerHTML=build();if(toast)L.appendChild(toast);}catch(e){console.error(e);}return r;};}
document.addEventListener('click',e=>{const b=e.target.closest('[data-hm]');if(!b||scene!=='town')return;e.stopPropagation();
 const a=b.dataset.hm;try{SFX.sel();}catch(_){}
 if(a==='sheet'){const s=document.querySelector('#labels .hm-sheet');if(s)s.hidden=!s.hidden;}
 else if(a==='prep')TDM.prep(b.dataset.id);
 else if(a==='map')TDM.map();
 else if(a==='dev'){const s=document.querySelector('#labels .hm-sheet');if(s)s.hidden=true;DEVUI.open();}
 else if(a==='unit'){if(typeof UNIT!=='undefined')UNIT.open();else partyScreen();}},true);
return{nextStage,build};})();
