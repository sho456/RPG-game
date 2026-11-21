/* ===== 図鑑の一覧（ZKUI）：敵・仲間・装備の全画面の一覧。ver0.54 新規 =====
 js/zukan/zukan.js の list() がここを呼ぶ（詳細 detail は従来どおり zukan.js。タイルをタップで詳細へ、詳細の「一覧」で戻る）。
 見出しの説明文は置かない。数は「集めた/全部」の数字だけ。タブは絵＋数、絞り込みは 1 段（全・ボス・系統） */
'use strict';
const ZKUI=(()=>{
let root=null;
const D=()=>ZUKAN.data;
function build(){if(root)return;root=document.createElement('div');root.id='zk';root.className='hide';document.body.appendChild(root);root.addEventListener('click',onClick);}
function open(){build();root.classList.remove('hide');draw();}
function close(){if(root)root.classList.add('hide');try{D().back();}catch(e){try{townMenu();}catch(x){}}}
const tabIcon=t=>{try{if(t==='e')return`<img src="${zimg('slime')}" alt="">`;
 if(t==='h')return`<img src="${face(G.members[0]||'rio')}" alt="">`;
 return`<img src="${ICON.eq}" alt="">`;}catch(e){return'';}};
function draw(){const d=D(),ZK=d.ZK,L=d.zkList(),t=ZK.t,esc=d.esc;
 const ne=L.e.filter(d.seenE).length,nh=L.h.filter(d.joined).length,ni=L.i.filter(d.seenI).length;
 const cnt={e:[ne,L.e.length],h:[nh,L.h.length],i:[ni,L.i.length]};
 const tabs=['e','h','i'].map(k=>`<button class="${t===k?'on':''}" data-a="tab" data-v="${k}">${tabIcon(k)}<b>${cnt[k][0]}<i>/${cnt[k][1]}</i></b></button>`).join('');
 let chips='',body='';
 if(t==='e'){
  const cur=ZK.cat==='boss'?'boss':(ZK.fam&&ZK.fam!=='all'?ZK.fam:'all');
  const inCat=k=>ZK.cat==='all'||(ZK.cat==='normal'?TERMS.charCat(k)==='normal':TERMS.charCat(k)!=='normal'),inFam=k=>ZK.fam==='all'||d.famOf(k)===ZK.fam;
  const fams=d.FAMS.filter(([f])=>L.e.some(k=>d.famOf(k)===f));
  chips=`<div class="zk-chips">${[['all','すべて'],['boss','ボス'],...fams].map(([k,n])=>`<button class="${cur===k?'on':''}" data-a="chip" data-v="${k}">${n}</button>`).join('')}</div>`;
  body='<ul class="zk-grid">'+L.e.map((k,i)=>[k,i]).filter(([k])=>inCat(k)&&inFam(k)).map(([k])=>{const s=d.seenE(k),c=TERMS.charCat(k);
   return`<li><button class="${s?'':'un'}${c!=='normal'?' bs':''}" data-a="e" data-v="${k}"><img src="${zimg(k,!s)}" alt=""><b>${s?esc(ED[k].name):''}</b></button></li>`;}).join('')+'</ul>';}
 if(t==='h')body='<ul class="zk-grid h">'+L.h.map(id=>{const j=d.joined(id);
  return`<li><button class="${j?'':'un'}" data-a="h" data-v="${id}" style="--ec:${elCol(id)}"><img src="${j?art(id):zimg(id,1)}" alt=""><b>${j?esc(HB[id].name):''}</b></button></li>`;}).join('')+'</ul>';
 if(t==='i')body='<ul class="zk-grid">'+L.i.map((x,i)=>{const s=d.seenI(x),ik=d.icKey(x);
  return`<li><button class="${s?'':'un'}" data-a="i" data-v="${i}">${ik?`<img src="${s?IC21.render(ik,4):IC21.shadow(ik)}" alt="">`:''}<b>${s?esc(x.n):''}</b></button></li>`;}).join('')+'</ul>';
 const top=root.querySelector('.zk-body');const sc=top?top.scrollTop:0;
 root.innerHTML=`<header class="zk-h"><button class="zk-b" data-a="home" aria-label="戻る">◀</button><nav class="zk-tabs">${tabs}</nav></header>${chips}<div class="zk-body">${body}</div>`;
 const nb=root.querySelector('.zk-body');if(nb&&sc)nb.scrollTop=sc;}
function onClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v,d=D(),ZK=d.ZK;
 if(a==='home')return close();
 if(a==='tab'){ZK.t=v;draw();const nb=root.querySelector('.zk-body');if(nb)nb.scrollTop=0;return;}
 if(a==='chip'){if(v==='all'){ZK.cat='all';ZK.fam='all';}else if(v==='boss'){ZK.cat='boss';ZK.fam='all';}else{ZK.cat='all';ZK.fam=v;}draw();return;}
 root.classList.add('hide');
 if(a==='e')d.detail('e',v);else if(a==='h')d.detail('h',v);else if(a==='i')d.detail('i',+v);}
return{open,close};})();
