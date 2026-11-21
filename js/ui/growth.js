/* ===== 強化メニュー（経験値のストックとレベルアップ・旧「酒場」を統合した正本。ver0.48 新規） =====
 ・経験値は戦闘ごとに「ストック」（G.xpStock）にたまる。キャラには直接入らない（rewards を包み、gainXP は使わない）
 ・強化メニューで、ストックを使って好きなキャラを好きなだけレベルアップ（+1・+10・上限まで）。上限は V31.capOf（限界突破）
 ・旧「酒場」（town.js / ch9.js / ver18-town.js の tavern）の中身（編成・依頼掲示板・絆の語らい・図鑑・仲間を誘う）をここに統合し、tavern をこの画面で置き換える
 ・下のタブの「酒場」は「強化」に（v22.js townMenu の h22nav・v20-ui.js HNAV）。レベルアップできる仲間がいると「!」
 ver0.54：画面を全画面の #grow に作り直し（仲間画面と同じ文法・字なし）。旧酒場のタイル・依頼掲示板・声かけは廃止 */
'use strict';
const GROW=(()=>{
const LVUP=gainXP;/* v31/core.js の gainXP（実際に Lv を上げる処理）。メニューからだけ呼ぶ */
const stock=()=>Math.max(0,Math.round((G&&G.xpStock)||0));
const fm=n=>Math.round(n||0).toLocaleString('en-US');
const cap=id=>{try{return V31.capOf(id);}catch(e){return 99;}};
const need=id=>{const h=G.h[id];try{return Math.max(0,V31.xpNeed(h.lv)-(h.xp||0));}catch(e){return Math.max(0,nextXP(h.lv)-(h.xp||0));}};
const can=id=>{const h=G.h[id];return h&&h.lv<cap(id)&&stock()>=need(id);};
/* ストックを使って n 回レベルアップ（足りなければそこまで）。上がった回数を返す */
function lvUp(id,n){const h=G.h[id];let k=0;
 while(k<n&&h.lv<cap(id)){const x=need(id);if(stock()<x)break;G.xpStock=stock()-x;
  const m0=stats(id).mhp,hp=h.hp;LVUP(id,x);if(hp!=null)h.hp=Math.min(stats(id).mhp,hp+stats(id).mhp-m0);k++;}
 return k;}
/* 上限までに要る経験値（表示用） */
function toCap(id){const h=G.h[id];let s=need(id);try{for(let l=h.lv+1;l<cap(id);l++)s+=V31.xpNeed(l);}catch(e){}return h.lv>=cap(id)?0:s;}
/* 経験値はストックへ：rewards の結果の xp をそのままストックに足す。キャラへの gainXP は止める */
gainXP=function(){return 0;};
{const _r=rewards;rewards=function(es){const r=_r(es);try{if(r&&r.xp){G.xpStock=stock()+r.xp;r.stock=r.xp;}if(r)r.ups=[];}catch(e){console.error(e);}return r;};}
const add=x=>{G.xpStock=stock()+Math.max(0,Math.round(x||0));};
const readyN=()=>{try{return(G.members||[]).filter(can).length;}catch(e){return 0;}};

/* ---------- 画面（全画面の #grow。仲間画面 #unit と同じ文法） ---------- */
let SEL=null,root=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IMG={};
function pic(id,h){const k=id+h;if(IMG[k])return IMG[k];let f=null;try{f=SPX.unitCv(id,id,0,h);}catch(e){}if(!f)return'';
 const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return IMG[k]=c.toDataURL();}
const xpI='<i class="gr-xp"></i>';
const order=()=>{const o=Object.keys(TDD.ROLE);return(G.members||[]).filter(id=>TDD.HERO[id]&&G.h[id]).sort((a,b)=>o.indexOf(TDD.HERO[a].role)-o.indexOf(TDD.HERO[b].role));};
/* n レベル上げるのに要る経験値 */
function costN(id,n){const h=G.h[id];let s=need(id);if(h.lv>=cap(id))return 0;try{for(let l=h.lv+1;l<Math.min(cap(id),h.lv+n);l++)s+=V31.xpNeed(l);}catch(e){}return s;}
function build(){if(root)return;root=document.createElement('div');root.id='grow';root.className='hide';document.body.appendChild(root);root.addEventListener('click',onClick);}
function open(){build();const L=order();if(!SEL||!L.includes(SEL))SEL=L.find(i=>can(i))||G.party[0]||L[0];root.classList.remove('hide');draw();root.scrollTop=0;}
function close(){if(root)root.classList.add('hide');try{townMenu();}catch(e){}}
function draw(){if(!root)return;const L=order(),id=SEL,h=G.h[id],d=TDD.HERO[id],R=TDD.ROLE[d.role],mx=h.lv>=cap(id),nd=need(id),sv=stock();
 const pc=mx?100:Math.min(100,(h.xp||0)/Math.max(1,(h.xp||0)+nd)*100);
 const btn=(n,l)=>{const c=mx?0:costN(id,n),ok=!mx&&sv>=nd;return`<button class="gr-up${ok?' ok':''}" data-a="up" data-v="${n}" ${ok?'':'aria-disabled="true"'}><b>${l}</b><span>${mx?'':xpI+fm(c)}</span></button>`;};
 root.innerHTML=`<header class="gr-h"><button class="gr-b" data-a="home" aria-label="戻る">◀</button><b>強化</b><span class="gr-sum">${xpI}${fm(sv)}</span></header>
 <section class="gr-hero"><span class="gr-role" style="background:${R.col}"></span><div class="gr-pv"><img src="${pic(id,110)}" alt=""></div>
  <div class="gr-id"><b>${esc(HB[id].name)}</b><span class="gr-lv">Lv <strong>${h.lv}</strong><em>/${cap(id)}</em></span><div class="gr-bar"><i style="width:${pc}%"></i></div></div></section>
 <div class="gr-ups">${btn(1,'+1')}${btn(10,'+10')}${btn(9999,'MAX')}</div>
 <ul class="gr-grid">${L.map(i=>{const hh=G.h[i],r=TDD.ROLE[TDD.HERO[i].role];
  return`<li><button class="${i===id?'sel':''}" data-a="sel" data-v="${i}"><span class="r" style="background:${r.col}"></span><img src="${pic(i,52)}" alt=""><b>${esc(HB[i].name)}</b><em>Lv${hh.lv}</em>${can(i)?'<i class="gr-dot"></i>':''}</button></li>`;}).join('')}</ul>`;}
function onClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='home')return close();
 if(a==='sel'){SEL=v;try{SFX.sel();}catch(x){}draw();return;}
 if(a==='up'){if(b.getAttribute('aria-disabled'))return;const k=lvUp(SEL,+v||1);if(k){try{SFX.aw();}catch(x){}save();}draw();}}
tavern=open;
return{open,stock,add,lvUp,need,can,readyN,toCap};})();
