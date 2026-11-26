/* ===== TD の章の地図・出撃準備・会話・仲間の加入（TDM）。戦闘画面は js/td/view.js（TD） =====
 流れ（ver0.60 からコマンド戦闘）：ホームの「出撃」→ map()（章のタブ・ステージの道）→ prep(id)（出る敵と弱点・仲間 5 人の編成）→ CB.open→ 出撃前の会話 → TD.open
       → 結果 → after()：初回クリアなら加入の会話と newMember → 次のステージの出撃準備へ。
 進み具合は G.td.c[ステージ]＝星の数、手札は G.td.deck。会話は本編のクエスト（QD）の pre と加入（QD.POST）を使う */
'use strict';
const TDM=(()=>{
let root=null,tab=null,pend=null,cur=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ELC={'斬':'#e8e8f0','打':'#d9a066','突':'#b0e0ff','熱':'#ff7a3c','冷':'#7fd8ff','雷':'#ffe14a','陽':'#fff1a8','陰':'#b07aff'};
/* セーブの移行（ver0.52）：本編でクリア済みのクエストに当たるステージは、星 1 のクリア済みから始める */
const TD0=()=>{G.td=G.td||{c:{}};G.td.c=G.td.c||{};if(!G.td.v){G.td.v=1;try{for(const id of TDD.ORDER){const q=TDD.STAGE[id].q;if(q&&typeof qCleared==='function'&&qCleared(q)&&!G.td.c[id])G.td.c[id]=1;}}catch(e){console.error(e);}}return G.td;};
const stars=id=>(G&&G.td&&G.td.c&&G.td.c[id])||0;
const chOf=id=>TDD.CH.find(c=>c.st.includes(id))||{ch:'',n:''};
function open(id){const i=TDD.ORDER.indexOf(id);return i<=0||stars(TDD.ORDER[i-1])>0;}
function chOpen(c){return!c.soon&&c.st.length&&open(c.st[0]);}
const IMG={};
function pic(key,fk,side,h){const k=key+side+h;if(IMG[k])return IMG[k];let f=null;try{f=SPX.unitCv(key,fk,side,h);}catch(e){}if(!f)return'';
 const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);return IMG[k]=c.toDataURL();}
function build(){if(root)return;root=document.createElement('div');root.id='tdm';root.className='hide';document.body.appendChild(root);root.addEventListener('click',onClick);}
function show(html){build();CB.hide();root.innerHTML=html;root.classList.remove('hide');root.scrollTop=0;}
function close(){if(root)root.classList.add('hide');CB.hide();try{townMenu();}catch(e){}}
/* ---------- 章の地図 ---------- */
/* 天への塔：全章クリア（最後のステージに星）で地図のタブに出る。到達の最高は G.td.inf */
const infOpen=()=>!!(TDD.INF&&stars(TDD.ORDER[TDD.ORDER.length-1])>0);
const best=()=>(G&&G.td&&G.td.inf)||0;
function map(){build();try{TD0();}catch(e){}const cur=TDD.CH.filter(chOpen).pop()||TDD.CH[0];if(tab==='inf'&&!infOpen())tab=null;if(tab!=='inf'&&(!tab||!TDD.CH.find(c=>c.id===tab&&chOpen(c))))tab=cur.id;
 if(tab==='inf')return infMap();const C=TDD.CH.find(c=>c.id===tab);
 const nx=TDD.ORDER.find(id=>open(id)&&!stars(id));
 show(`<header class="tdm-h"><button class="td-btn" data-a="home" aria-label="灯都へ戻る">◀</button><b>出撃</b><span class="tdm-sum">★ ${TDD.ORDER.reduce((a,id)=>a+stars(id),0)}/${TDD.ORDER.length*3}</span></header>
 <nav class="tdm-tabs">${TDD.CH.map(c=>{const ok=chOpen(c);return`<button class="${c.id===tab?'on':''}${ok?'':' lock'}" data-a="tab" data-v="${c.id}" ${ok?'':'disabled'}><small>${esc(c.ch)}</small>${ok?esc(c.n):c.soon?'準備中':'未踏'}</button>`;}).join('')}${tabInf()}</nav>
 <section class="tdm-ch"><canvas class="tdm-sky" width="360" height="96"></canvas><div class="tdm-cht"><small>${esc(C.ch)}</small><b>${esc(C.n)}</b></div></section>
 <ol class="tdm-road">${C.st.map((id,i)=>{const S=TDD.STAGE[id],ok=open(id),n=stars(id),me=id===nx;
  return`<li class="${ok?'':'lock'}${me?' next':''}${n?' done':''}"><button data-a="stage" data-v="${id}" ${ok?'':'disabled'}><span class="no">${S.boss?'◆':i+1}</span>
  <span class="tx"><b>${ok?esc(S.name):'？？？'}</b><small>Lv${S.lv}</small></span>
  ${S.join&&ok&&!(G.members||[]).includes(S.join)?`<img class="jn" src="${pic(S.join,S.join,0,30)}" alt="加入：${esc(HB[S.join].name)}">`:''}
  <span class="ss">${[0,1,2].map(k=>`<i class="${k<n?'on':''}"></i>`).join('')}${ok&&n<3?'<i class="ic-stone" title="星 3 の報酬：錬磨石"></i>':''}</span></button></li>`;}).join('')}</ol>`);
 try{skyArt(root.querySelector('.tdm-sky'),C.th);}catch(e){}tabSee();}
const tabInf=()=>infOpen()?`<button class="inf${tab==='inf'?' on':''}" data-a="tab" data-v="inf"><small>∞</small>${esc(TDD.STAGE[TDD.INF].name)}</button>`:'';
function infMap(){const S=TDD.STAGE[TDD.INF],b=best();
 show(`<header class="tdm-h"><button class="td-btn" data-a="home" aria-label="灯都へ戻る">◀</button><b>出撃</b><span class="tdm-sum">★ ${TDD.ORDER.reduce((a,id)=>a+stars(id),0)}/${TDD.ORDER.length*3}</span></header>
 <nav class="tdm-tabs">${TDD.CH.map(c=>`<button data-a="tab" data-v="${c.id}">${'<small>'+esc(c.ch)+'</small>'+esc(c.n)}</button>`).join('')}${tabInf()}</nav>
 <section class="tdm-ch"><canvas class="tdm-sky" width="360" height="96"></canvas><div class="tdm-cht"><small>∞</small><b>${esc(S.name)}</b></div></section>
 <ol class="tdm-road"><li class="next${b?' done':''}"><button data-a="stage" data-v="${TDD.INF}"><span class="no">∞</span><span class="tx"><b>${esc(S.name)}</b><small>Lv${S.lv}〜</small></span>
 <span class="tdm-best" title="到達の最高"><i class="ic-tower"></i>${b}</span></button></li></ol>`);
 try{skyArt(root.querySelector('.tdm-sky'),S.th);}catch(e){}tabSee();}
/* 選んでいるタブ（塔が開いていれば塔のタブ）を横スクロールの中で見える位置へ */
function tabSee(){try{const n=root.querySelector('.tdm-tabs'),b=n.querySelector('.inf')||n.querySelector('.on');if(b)n.scrollLeft=Math.max(0,b.offsetLeft-n.clientWidth+b.offsetWidth+10);}catch(e){}}
function skyArt(c,th){const st={S:{W:900,th,base:[870,300],paths:[[[-30,262],[900,262]],[[-30,338],[900,338]]]}};st.Ps=[];
 const b=TDBG.make(st,360),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(b.sky,40,0,360,236,0,0,360,236);g.drawImage(b.far,-40,-70);g.drawImage(b.mid,-20,-60);
 const gr=g.createLinearGradient(0,40,0,96);gr.addColorStop(0,'rgba(18,19,42,0)');gr.addColorStop(1,'rgba(18,19,42,1)');g.fillStyle=gr;g.fillRect(0,0,360,96);}
/* ---------- 出撃準備 ---------- */
const PMAX=5;/* 出撃する仲間（コマンド戦闘は 5 人まで） */
function prep(id){const S=TDD.STAGE[id];if(!S||(S.inf?!infOpen():!open(id)))return map();cur=id;const C=S.inf?{ch:'∞',n:S.name}:chOf(id);TD0();
 const mem=(G.members||[]).filter(h=>TDD.HERO[h]),deck=TDD.deckOf().filter(h=>mem.includes(h)).slice(0,PMAX);G.td.deck=deck;
 const W=S.inf?[]:CBE.wavesOf(S),kinds=S.inf?[...S.pool,...S.bosses]:[...new Set(W.flat())],cnt=k=>W.reduce((a,w)=>a+w.filter(x=>x===k).length,0);
 const avg=deck.length?Math.round(deck.reduce((a,h)=>a+(G.h[h]?G.h[h].lv:1),0)/deck.length):1;
 show(`<header class="tdm-h"><button class="td-btn" data-a="map" aria-label="戻る">◀</button><b>出撃準備</b><span class="tdm-sum">${esc(C.ch)}</span></header>
 <section class="tdm-st"><h2>${S.boss?'<i class="bs">◆</i>':''}${esc(S.name)}</h2><canvas class="tdm-prev" width="360" height="90"></canvas>
 <div class="tdm-tags">${avg<S.lv&&typeof UNIT!=='undefined'?`<button class="lv warn" data-a="grow" title="推奨 Lv${S.lv}・平均 Lv${avg}">Lv${S.lv} ↑</button>`:`<span class="lv" title="推奨 Lv${S.lv}">Lv${S.lv}</span>`}<span title="WAVE">≋ ${S.inf?'∞':W.length}</span>${S.inf?`<span class="tdm-best" title="到達の最高"><i class="ic-tower"></i>${best()}</span>`:''}</div></section>
 <ul class="tdm-foes">${kinds.map(k=>{const e=ED[k];if(!e)return'';const boss=!!e.boss;return`<li><img src="${pic(e.spr||k,k,1,28)}" alt=""><span class="tx"><b>${boss?'<i class="bs">◆</i>':''}${esc(e.name)}</b></span><span class="wk">${(e.weak||[]).slice(0,2).map(el=>`<i style="--c:${ELC[el]}">${el}</i>`).join('')}</span>${S.inf?'':`<span class="n">×${cnt(k)}</span>`}</li>`;}).join('')}</ul>
  <div class="tdm-pool">${mem.map(h=>{const on=deck.includes(h),lv=G.h[h]?G.h[h].lv:1;
  return`<button class="${on?'on':''}" data-a="pick" data-v="${h}"><img src="${pic(h,h,0,40)}" alt=""><span class="r" style="background:${TDD.ROLE[TDD.HERO[h].role].col}"></span>
  <b>${esc(HB[h].name)}</b><small>Lv${lv}</small>${on?`<i class="k">${deck.indexOf(h)+1}</i>`:''}</button>`;}).join('')}</div>
 <div class="tdm-go"><button class="td-btn on" data-a="go" data-v="${id}" ${deck.length?'':'disabled'}>出撃</button></div>`);
 try{skyArt(root.querySelector('.tdm-prev'),S.th||C.th||'ash');}catch(e){console.error(e);}}
/* ---------- 会話 ---------- */
function talk(lines,done){if(!lines||!lines.length)return done();let i=0;build();
 const box=document.createElement('div');box.className='tdm-talk';root.classList.remove('hide');root.appendChild(box);
 const step=()=>{if(i>=lines.length){box.remove();return done();}const[who,,t]=lines[i++];const nm=who&&HB[who]?HB[who].name:'';
  box.innerHTML=`<div class="tw">${nm?`<img src="${pic(who,who,0,48)}" alt="">`:''}<div class="tb${nm?'':' nar'}">${nm?`<b>${esc(nm)}</b>`:''}<p>${esc(t)}</p></div></div><button class="skip" data-k="skip">とばす</button>`;};
 box.addEventListener('click',e=>{e.stopPropagation();if(e.target.dataset.k==='skip')i=lines.length;step();});step();}
/* ---------- 出撃・結果のあと ---------- */
function go(id){const S=TDD.STAGE[id],deck=G.td.deck||TDD.deckOf();try{save();}catch(e){}
 const run=()=>{root.classList.add('hide');root.innerHTML='';CB.open(id,deck.slice(0,5));};if(S.pre&&!stars(id))talk(S.pre,run);else run();}
let pendEnd=false;
/* ---------- 結果の精算（view.js の result が呼ぶ）：星・報酬（初回・周回・星 3 の錬磨石）・天への塔の到達 WAVE ----------
 返り値：{rw, first, chips}（chips＝報酬の欄に足す印の HTML）。塔は {sheet}（結果の窓をまるごと） */
const stoneHTML=n=>n?`<span class="s3"><i class="ic-stone"></i><b>${n}</b></span>`:'';
function settle(id,st){const o=st.over,S=TDD.STAGE[id],n=o.stars.reduce((a,b)=>a+b,0);let rw={xp:0,gold:0,stone:0},first=false;
 try{TD0();G.mats=G.mats||{};
  if(S.inf){const w=o.wave||0,b0=best(),rec=w>b0;if(rec)G.td.inf=w;rw=TDD.reward(id,w);G.xpStock=(G.xpStock||0)+rw.xp;G.gold=(G.gold||0)+rw.gold;if(rw.stone)G.mats[TDD.STONE]=(G.mats[TDD.STONE]||0)+rw.stone;try{save();}catch(e){}
   return{sheet:`<h3>${esc(S.name)}</h3><div class="td-inf"><i class="ic-tower"></i><b>${w}</b>${rec?'<i class="ic-star" title="最高記録"></i>':`<small title="到達の最高">${b0}</small>`}</div>
   <div class="td-rw"><span>経験値 <b>${rw.xp}</b></span><span>ゴールド <b>${rw.gold}</b></span>${stoneHTML(rw.stone)}</div>
   <div class="td-acts"><button class="td-btn" data-a="again">もう一度</button><button class="td-btn on" data-a="map">地図へ</button></div>`};}
  if(o.win){const prev=G.td.c[id]||0;first=!prev;G.td.c[id]=Math.max(prev,n);rw=TDD.reward(id,n,first,prev);
   G.xpStock=(G.xpStock||0)+rw.xp;G.gold=(G.gold||0)+rw.gold;if(rw.stone)G.mats[TDD.STONE]=(G.mats[TDD.STONE]||0)+rw.stone;try{save();}catch(e){}}}catch(e){console.error(e);}
 return{rw,first,chips:(rw.s3?`<span class="s3"><i class="ic-star"></i><i class="ic-star"></i><i class="ic-star"></i></span>`+stoneHTML(rw.stone):'')+(rw.rep?'<span class="rp" title="周回">↻</span>':'')};}
function cleared(id,win,first){const S=TDD.STAGE[id];pendEnd=!!(win&&first&&S.fin);pend=win&&first&&S.join&&!(G.members||[]).includes(S.join)?S.join:null;}
/* エンディング（最終ステージの初回クリア） */
const ENDING=[[null,'n','星核の光が、灯都の灯台へ流れこんでいく。'],['rio','n','……色が、戻ってくる'],['gald','h','ああ。おまえが継いだ灯だ'],['celes','n','千年ぶんの夜明けじゃな。……悪くない'],[null,'n','灰色だった街道に、朝の色が差した。']];
function ending(done){show('<div class="tdm-blank"></div>');talk(ENDING,()=>{const n=TDD.ORDER.reduce((a,id)=>a+stars(id),0);
 show(`<div class="tdm-join tdm-end"><i class="ic-star"></i><b>灯は継がれた</b><span class="tdm-sum">★ ${n}/${TDD.ORDER.length*3}</span><button class="td-btn on" data-a="fin">灯都へ</button></div>`);
 root.querySelector('[data-a="fin"]').onclick=e=>{e.stopPropagation();done();};});}
function after(id,next){if(TDD.STAGE[id]&&TDD.STAGE[id].inf){CB.hide();tab='inf';return map();}if(pendEnd){pendEnd=false;return ending(()=>close());}const fin=()=>{const i=TDD.ORDER.indexOf(id),nx=TDD.ORDER[i+1];if(next&&nx&&TDD.STAGE[nx]&&open(nx))prep(nx);else map();};
 CB.hide();if(!pend)return fin();const who=pend,S=TDD.STAGE[id];pend=null;show('<div class="tdm-blank"></div>');
 talk(S.join_lines,()=>{try{newMember(who);G.td.deck=G.td.deck||[];if(G.td.deck.length<PMAX&&!G.td.deck.includes(who))G.td.deck.push(who);save();}catch(e){console.error(e);}
  show(`<div class="tdm-join"><img src="${pic(who,who,0,64)}" alt=""><b>${esc(HB[who].name)}が仲間になった</b><button class="td-btn on" data-a="fin">続ける</button></div>`);
  root.querySelector('[data-a="fin"]').onclick=e=>{e.stopPropagation();fin();};});}
function onClick(e){const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='grow'){const id=cur;root.classList.add('hide');UNIT.open(null,()=>prep(id));return;}
 if(a==='home')close();else if(a==='map')map();else if(a==='tab'){tab=v;map();}else if(a==='stage')prep(v);else if(a==='go')go(v);
 else if(a==='pick'){const d=G.td.deck||[];const i=d.indexOf(v);if(i>=0){if(d.length>1)d.splice(i,1);}else if(d.length<PMAX)d.push(v);G.td.deck=d;const y=root.scrollTop;prep(cur);root.scrollTop=y;}}
/* ---------- 入口：ホーム右の縦メニューに「出撃」・index.html#td ---------- */
{const _tm=townMenu;townMenu=function(){const r=_tm.apply(this,arguments);try{const R=document.querySelector('#labels .h22right');
 if(R&&!R.querySelector('.td-entry')){const b=document.createElement('button');b.className='td-entry';b.dataset.td='1';b.innerHTML='<span class="td-ic">灯</span><small>出撃</small>';
  b.addEventListener('click',e=>{e.stopPropagation();map();});R.appendChild(b);}}catch(e){console.error(e);}return r;};}
function boot(){if(location.hash!=='#td')return;const go2=()=>{if(typeof SPX==='undefined'||!SPX.ready)return setTimeout(go2,300);
 try{if(typeof G==='undefined'||!G){const s=loadSave();G=migrate(s||newGame());}const ov=document.querySelector('#ov');if(ov)ov.classList.add('hide');townMenu();}catch(e){console.error(e);}map();};go2();}
addEventListener('load',boot);
return{map,prep,after,cleared,chOf,talk,close,settle};})();
