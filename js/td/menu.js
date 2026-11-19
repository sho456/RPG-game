/* ===== TD の章の地図・出撃準備・会話・仲間の加入（TDM）。戦闘画面は js/td/view.js（TD） =====
 流れ：ホーム右の「防衛」→ map()（章のタブ・ステージの道）→ prep(id)（戦場の縮図・出る敵と弱点・手札 8 枚の編成）→ 出撃前の会話 → TD.open
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
function show(html){build();TD.hide();root.innerHTML=html;root.classList.remove('hide');root.scrollTop=0;}
function close(){if(root)root.classList.add('hide');TD.hide();try{townMenu();}catch(e){}}
/* ---------- 章の地図 ---------- */
function map(){build();try{TD0();}catch(e){}const cur=TDD.CH.filter(chOpen).pop()||TDD.CH[0];if(!tab||!TDD.CH.find(c=>c.id===tab&&chOpen(c)))tab=cur.id;const C=TDD.CH.find(c=>c.id===tab);
 const nx=TDD.ORDER.find(id=>open(id)&&!stars(id));
 show(`<header class="tdm-h"><button class="td-btn" data-a="home" aria-label="灯都へ戻る">◀</button><b>灯守の防衛線</b><span class="tdm-sum">★ ${TDD.ORDER.reduce((a,id)=>a+stars(id),0)}/${TDD.ORDER.length*3}</span></header>
 <nav class="tdm-tabs">${TDD.CH.map(c=>{const ok=chOpen(c);return`<button class="${c.id===tab?'on':''}${ok?'':' lock'}" data-a="tab" data-v="${c.id}" ${ok?'':'disabled'}><small>${esc(c.ch)}</small>${ok?esc(c.n):c.soon?'準備中':'未踏'}</button>`;}).join('')}</nav>
 <section class="tdm-ch"><canvas class="tdm-sky" width="360" height="96"></canvas><div class="tdm-cht"><small>${esc(C.ch)}</small><b>${esc(C.n)}</b><p>${esc(C.intro)}</p></div></section>
 <ol class="tdm-road">${C.st.map((id,i)=>{const S=TDD.STAGE[id],ok=open(id),n=stars(id),me=id===nx;
  return`<li class="${ok?'':'lock'}${me?' next':''}${n?' done':''}"><button data-a="stage" data-v="${id}" ${ok?'':'disabled'}><span class="no">${S.boss?'◆':i+1}</span>
  <span class="tx"><b>${ok?esc(S.name):'？？？'}</b><small>推奨Lv${S.lv}・${S.waves.length} WAVE${S.boss?'・ボス':''}</small></span>
  ${S.join&&ok&&!(G.members||[]).includes(S.join)?`<img class="jn" src="${pic(S.join,S.join,0,30)}" alt="加入：${esc(HB[S.join].name)}">`:''}
  <span class="ss">${[0,1,2].map(k=>`<i class="${k<n?'on':''}"></i>`).join('')}</span></button></li>`;}).join('')}</ol>`);
 try{skyArt(root.querySelector('.tdm-sky'),C.th);}catch(e){}}
function skyArt(c,th){const st={S:{W:900,th,base:[870,300],paths:[[[-30,262],[900,262]],[[-30,338],[900,338]]],pads:[]},pads:[]};st.Ps=[];
 const b=TDBG.make(st,360),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(b.sky,40,0,360,236,0,0,360,236);g.drawImage(b.far,-40,-70);g.drawImage(b.mid,-20,-60);
 const gr=g.createLinearGradient(0,40,0,96);gr.addColorStop(0,'rgba(18,19,42,0)');gr.addColorStop(1,'rgba(18,19,42,1)');g.fillStyle=gr;g.fillRect(0,0,360,96);}
/* ---------- 出撃準備 ---------- */
function prep(id){if(!open(id))return map();cur=id;const S=TDD.STAGE[id],C=chOf(id);TD0();
 const mem=(G.members||[]).filter(h=>TDD.HERO[h]),deck=TDD.deckOf().filter(h=>mem.includes(h));G.td.deck=deck;
 const kinds=[...new Set(S.waves.flatMap(w=>w.e.map(e=>e[1])))],cnt=k=>S.waves.reduce((a,w)=>a+w.e.filter(e=>e[1]===k).reduce((b,e)=>b+e[2],0),0);
 const avg=deck.length?Math.round(deck.reduce((a,h)=>a+(G.h[h]?G.h[h].lv:1),0)/deck.length):1;
 show(`<header class="tdm-h"><button class="td-btn" data-a="map" aria-label="地図へ戻る">◀</button><b>出撃準備</b><span class="tdm-sum">${esc(C.ch)}</span></header>
 <section class="tdm-st"><h2>${esc(S.name)}</h2><p>${esc(stDesc(S))}</p><canvas class="tdm-prev" width="360" height="90"></canvas>
 <div class="tdm-tags"><span>推奨 Lv${S.lv}</span><span class="${avg<S.lv?'warn':''}">手札の平均 Lv${avg}</span><span>配置の上限 ${S.cap}</span><span>${S.waves.length} WAVE</span></div></section>
 <h3 class="tdm-sec">出てくる敵</h3><ul class="tdm-foes">${kinds.map(k=>{const f=TDD.foe(k,S.lv);if(!f)return'';return`<li><img src="${pic(f.spr,k,1,28)}" alt=""><span class="tx"><b>${esc(f.name)}${f.boss?'<em>ボス</em>':''}</b>
  <small>${f.tr.map(t=>esc(TDD.TRN[t]||t)).join('・')||'—'}</small></span><span class="wk">${f.weak.map(e=>`<i style="--c:${ELC[e]}">${e}</i>`).join('')}</span><span class="n">×${cnt(k)}</span></li>`;}).join('')}</ul>
 <h3 class="tdm-sec">手札 <small>${deck.length}/8・タップで出し入れ</small></h3>
 <div class="tdm-pool">${mem.map(h=>{const x=TDD.hero(h,G.h[h]?G.h[h].lv:1),on=deck.includes(h);
  return`<button class="${on?'on':''}" data-a="pick" data-v="${h}"><img src="${pic(h,h,0,40)}" alt=""><span class="c">${x.cost}</span><span class="r" style="background:${TDD.ROLE[x.role].col}"></span>
  <b>${esc(x.name)}</b><small>${TDD.ROLE[x.role].n}・Lv${x.lv}</small>${on?`<i class="k">${deck.indexOf(h)+1}</i>`:''}</button>`;}).join('')}</div>
 <div class="tdm-go"><button class="td-btn on" data-a="go" data-v="${id}" ${deck.length?'':'disabled'}>出撃</button></div>`);
 try{prevArt(root.querySelector('.tdm-prev'),id);}catch(e){console.error(e);}}
function stDesc(S){const q=(()=>{try{for(const c of QD.CH)for(const x of c.qs)if(x.id===S.q)return x;}catch(e){}return null;})();return(q&&q.d)||'';}
function prevArt(c,id){const st=TDS.create(id,['rio'],{}),b=TDBG.make(st,360),g=c.getContext('2d'),W=st.S.W,kx=360/W,ky=90/240,Y=y=>(y-180)*ky;g.imageSmoothingEnabled=false;
 g.drawImage(b.ground,0,180,W,240,0,0,360,90);const[bx,by]=st.S.base;
 g.fillStyle='rgba(242,179,71,.2)';g.beginPath();g.ellipse(bx*kx,Y(by),st.lightR*kx,st.lightR*ky,0,0,7);g.fill();
 for(const p of st.pads){g.fillStyle=p.lit?'#f2b347':'#6f6888';g.fillRect(p.x*kx-1.5,Y(p.y)-1.5,3,3);}
 g.fillStyle='#ffe2a0';g.fillRect(bx*kx-2,Y(by)-12,4,12);g.fillStyle='#e86a6a';for(const P of st.S.paths){g.beginPath();g.moveTo(2,Y(P[0][1])-4);g.lineTo(8,Y(P[0][1]));g.lineTo(2,Y(P[0][1])+4);g.fill();}}
/* ---------- 会話 ---------- */
function talk(lines,done){if(!lines||!lines.length)return done();let i=0;build();
 const box=document.createElement('div');box.className='tdm-talk';root.classList.remove('hide');root.appendChild(box);
 const step=()=>{if(i>=lines.length){box.remove();return done();}const[who,,t]=lines[i++];const nm=who&&HB[who]?HB[who].name:'';
  box.innerHTML=`<div class="tw">${nm?`<img src="${pic(who,who,0,48)}" alt="">`:''}<div class="tb${nm?'':' nar'}">${nm?`<b>${esc(nm)}</b>`:''}<p>${esc(t)}</p></div></div><button class="skip" data-k="skip">とばす</button>`;};
 box.addEventListener('click',e=>{e.stopPropagation();if(e.target.dataset.k==='skip')i=lines.length;step();});step();}
/* ---------- 出撃・結果のあと ---------- */
function go(id){const S=TDD.STAGE[id],deck=G.td.deck||TDD.deckOf();try{save();}catch(e){}
 const run=()=>{root.classList.add('hide');root.innerHTML='';TD.open(id,deck);};if(S.pre&&!stars(id))talk(S.pre,run);else run();}
function cleared(id,win,first){const S=TDD.STAGE[id];pend=win&&first&&S.join&&!(G.members||[]).includes(S.join)?S.join:null;}
function after(id,next){const fin=()=>{const i=TDD.ORDER.indexOf(id),nx=TDD.ORDER[i+1];if(next&&nx&&TDD.STAGE[nx]&&open(nx))prep(nx);else map();};
 TD.hide();if(!pend)return fin();const who=pend,S=TDD.STAGE[id];pend=null;show('<div class="tdm-blank"></div>');
 talk(S.join_lines,()=>{try{newMember(who);G.td.deck=G.td.deck||[];if(G.td.deck.length<8&&!G.td.deck.includes(who))G.td.deck.push(who);save();}catch(e){console.error(e);}
  show(`<div class="tdm-join"><img src="${pic(who,who,0,64)}" alt=""><b>${esc(HB[who].name)}が仲間になった</b><small>${TDD.ROLE[TDD.HERO[who].role].n}・技「${esc(TDD.hero(who,1).sk.n)}」</small><button class="td-btn on" data-a="fin">続ける</button></div>`);
  root.querySelector('[data-a="fin"]').onclick=e=>{e.stopPropagation();fin();};});}
function onClick(e){const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='home')close();else if(a==='map')map();else if(a==='tab'){tab=v;map();}else if(a==='stage')prep(v);else if(a==='go')go(v);
 else if(a==='pick'){const d=G.td.deck||[];const i=d.indexOf(v);if(i>=0){if(d.length>1)d.splice(i,1);}else if(d.length<8)d.push(v);G.td.deck=d;const y=root.scrollTop;prep(cur);root.scrollTop=y;}}
/* ---------- 入口：ホーム右の縦メニューに「防衛」・index.html#td ---------- */
{const _tm=townMenu;townMenu=function(){const r=_tm.apply(this,arguments);try{const R=document.querySelector('#labels .h22right');
 if(R&&!R.querySelector('.td-entry')){const b=document.createElement('button');b.className='td-entry';b.dataset.td='1';b.innerHTML='<span class="td-ic">灯</span><small>防衛</small>';
  b.addEventListener('click',e=>{e.stopPropagation();map();});R.appendChild(b);}}catch(e){console.error(e);}return r;};}
function boot(){if(location.hash!=='#td')return;const go2=()=>{if(typeof SPX==='undefined'||!SPX.ready)return setTimeout(go2,300);
 try{if(typeof G==='undefined'||!G){const s=loadSave();G=migrate(s||newGame());}const ov=document.querySelector('#ov');if(ov)ov.classList.add('hide');townMenu();}catch(e){console.error(e);}map();};go2();}
addEventListener('load',boot);
return{map,prep,after,cleared,chOf,talk,close};})();
