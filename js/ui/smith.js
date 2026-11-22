/* ===== 鍛冶屋の画面（ver0.54。正本：town.js の smith・enhance・opSwap・sockMenu と v31/items.js・ver18-town.js の包みを置き換え） =====
 ・全画面の枠は js/ui/inv.js の FAC（持ち物・鑑定と同じ）。上に所持金と素材だけ。説明の字・店内の絵は出さない
 ・タブ（アイコン）：品揃え／強化／OP付け替え／ソケット。未解放は虚蝕の色＋鍵
 ・品物はアイコンの格子（レア度の帯・+強化値・装備中の印・値段／費用の小札）→ タップで選ぶ → 下の帯に名前・主な性能と操作。選んだものをもう一度タップ／アイコンで詳細（EQINFO）
 ・OP付け替え：装備を選ぶ→入れ替えるOPを選ぶ→素材の装備のOPを選ぶ。ソケット：穴を選び、星石を選んではめる／外す */
'use strict';
const SMITH44=(()=>{
const F=FAC,esc=F.esc;
let TAB='shop',SEL=null,STEP=null,SELST=null;/* STEP：null／{op:装備,ti}／{sock:装備} */
function stock(){try{if(G.stockAt!==G.sorties||!G.stock){const lv=Math.max(1,Math.min(100,Math.max(...G.party.map(i=>G.h[i].lv))-1));
 G.stock=['w','w','main','sub','sub','acc'].map((sl,i)=>genItem(lv,0,0,sl,G.fac.smith>=4&&i===0?2:i%3===2?1:0));G.stockAt=G.sorties;}}catch(e){console.error(e);}return G.stock||[];}
const canOp=i=>!i.unid&&i.ops&&i.ops.length,canSock=i=>!i.unid&&i.sock&&i.sock.length;
function items(){if(TAB==='shop')return stock();
 const inv=G.inv.slice().sort((a,b)=>(eqBy(b.uid)?1:0)-(eqBy(a.uid)?1:0)||b.rar-a.rar);
 if(TAB==='enh')return inv.filter(i=>!i.unid&&i.plus<ecap()).slice(0,60);
 if(TAB==='op')return inv.filter(canOp).slice(0,60);
 return inv.filter(canSock).slice(0,60);}
const key=it=>TAB==='shop'?'s'+G.stock.indexOf(it):'u'+it.uid;
function tag(it){if(TAB==='shop')return`${F.fm(price(it)*3)}`;if(TAB==='enh')return`+${it.plus}`;if(TAB==='sock')return`${it.sock.filter(Boolean).length}/${it.sock.length}`;return`${it.ops.length}`;}
const need=(n,have)=>`<span class="${have>=n?'':'sh'}">`;
/* 操作ボタンの中身（アイコンと数字だけ） */
function act(it){if(TAB==='shop'){const p=price(it)*3;return{h:`${F.coin()}<b>${F.fm(p)}</b>`,ok:G.gold>=p};}
 if(TAB==='enh'){const c=ecost(it);return{h:`${F.ic('up')}<b>+${it.plus}→${it.plus+1}</b>${need(c.g,G.gold)}${F.coin()}<b>${F.fm(c.g)}</b></span>${c.haiseki?`${need(c.haiseki,G.mats.haiseki)}${F.mi('haiseki')}<b>${c.haiseki}</b></span>`:''}${c.kakera?`${need(c.kakera,G.mats.kakera)}${F.mi('kakera')}<b>${c.kakera}</b></span>`:''}`,
  ok:G.gold>=c.g&&G.mats.haiseki>=c.haiseki&&G.mats.kakera>=c.kakera};}
 return{h:F.ic(TAB==='op'?'swap':'gem'),ok:true};}
const res=()=>{const mats=Object.keys(MATS).filter(k=>['haiseki','kakera'].includes(k)||G.mats[k]).map(k=>`<span class="fc-g">${F.mi(k)}<b>${G.mats[k]||0}</b></span>`).join('');return F.gold()+mats;};
const toast=h=>h||'';
function go(m){if(STEP&&STEP.op)return opStep(m);if(STEP&&STEP.sock)return sockStep(m);return main(m);}
function main(m){
 if((TAB==='op'&&G.fac.smith<2)||(TAB==='sock'&&G.fac.smith<3))TAB='shop';
 const L=items(),sel=L.find(it=>key(it)===SEL)||null;if(!sel)SEL=null;
 const tabs=[['shop','bag',1],['enh','up',1],['op','swap',G.fac.smith>=2],['sock','gem',G.fac.smith>=3]];
 const A=sel&&act(sel);
 F.show({cls:'fc smi',title:'鍛冶',res:res(),
  tabs:tabs.map(([k,i,ok])=>`<button class="${TAB===k?'on':''}${ok?'':' lk'}" data-a="tab" data-v="${k}" ${ok?'':'disabled'} aria-label="${k}">${F.ic(i)}${ok?'':F.ic('lock')}</button>`).join(''),
  body:`<div class="fc-grid">${L.map(it=>F.tile(it,{sel:key(it)===SEL,v:key(it),tag:tag(it),off:TAB==='shop'&&price(it)*3>G.gold,noeq:TAB==='shop'})).join('')}</div>${L.length?'':F.empty(TAB==='shop'?'bag':'anvil')}`,
  foot:sel?`${F.bar(sel,'',mainTxt(sel))}<div class="fc-tools"><button class="fc-bt wide go" data-a="do" ${A.ok?'':'disabled'}>${A.h}</button></div>`:'',toast:toast(m)},
 {back:()=>townMenu(),tab:v=>{TAB=v;SEL=null;main();},
  pk:v=>{if(SEL===v){if(sel)EQINFO.open(sel);return;}SEL=v;main();},
  do:()=>{if(!sel||!A.ok)return;
   if(TAB==='shop'){G.gold-=price(sel)*3;G.stock=G.stock.filter(x=>x!==sel);sel.uid=++G.uid;G.inv.push(sel);SFX.aw();save();SEL=null;return main(F.src(sel));}
   if(TAB==='enh'){const c=ecost(sel);G.gold-=c.g;G.mats.haiseki-=c.haiseki;G.mats.kakera-=c.kakera;sel.plus++;SFX.aw();save();if(sel.plus>=ecap())SEL=null;return main(`${F.src(sel)}<b>+${sel.plus}</b>`);}
   if(TAB==='op')STEP={op:sel,ti:null};else STEP={sock:sel};go();}});}
/* OP付け替え：入れ替えるOPを選ぶ → 素材の装備のOPを選ぶ */
function opStep(m){const tg=STEP.op,ti=STEP.ti;
 if(!G.inv.includes(tg)){STEP=null;return main();}
 if(ti==null){
  F.show({cls:'fc smi',title:'鍛冶',res:res(),body:`<div class="fc-pick">${F.tile(tg,{noeq:1})}<div class="fc-ops">${tg.ops.map((o,i)=>`<button class="fc-op" data-a="o" data-v="${i}">${esc(opTxt(o))}</button>`).join('')}</div></div>`,foot:'',toast:toast(m)},
  {back:()=>{STEP=null;main();},o:i=>{STEP.ti=+i;opStep();}});return;}
 const cost={g:Math.round(200+tg.ilv*40),k:1+Math.floor(tg.rar/2)},ok=G.gold>=cost.g&&G.mats.kakera>=cost.k,
  ds=G.inv.filter(i=>i!==tg&&canOp(i)&&!i.lock&&!eqBy(i.uid)).slice(0,40);
 F.show({cls:'fc smi',title:'鍛冶',res:res(),
  body:`<div class="fc-pick"><div class="fc-cur">${F.tile(tg,{noeq:1})}<span class="fc-op on">${esc(opTxt(tg.ops[ti]))}</span></div></div>
   <div class="fc-rows">${ds.map(d=>`<div class="fc-row">${F.tile(d,{info:1,noeq:1})}<div class="fc-ops">${d.ops.map((o,j)=>`<button class="fc-op" data-a="p" data-v="${d.uid}:${j}" ${!ok||tg.ops.some((x,xi)=>xi!==ti&&x.k===o.k)?'disabled':''}>${esc(opTxt(o))}</button>`).join('')}</div></div>`).join('')}</div>${ds.length?'':F.empty('swap')}`,
  foot:`<div class="fc-tools"><span class="fc-cost">${need(cost.g,G.gold)}${F.coin()}<b>${F.fm(cost.g)}</b></span>${need(cost.k,G.mats.kakera)}${F.mi('kakera')}<b>${cost.k}</b></span></span></div>`,toast:toast(m)},
 {back:()=>{STEP.ti=null;opStep();},
  p:v=>{const[u,j]=v.split(':').map(Number),d=findItem(u),o=d.ops[j];tg.ops[ti]={...o};G.inv=G.inv.filter(i=>i!==d);G.gold-=cost.g;G.mats.kakera-=cost.k;SFX.aw();save();
   STEP={op:tg,ti:null};opStep(`${F.src(tg)}<b>${esc(opTxt(o))}</b>`);}});}
/* ソケット：穴をタップ＝空きは星石をはめる／埋まりは外す（星石は戻る） */
function sockStep(m){const it=STEP.sock;
 if(!G.inv.includes(it)){STEP=null;return main();}
 const st=Object.keys(STONES).filter(k=>(G.stones[k]||0)>0);if(SELST&&!(G.stones[SELST]>0))SELST=null;
 const sI=k=>`<img class="fc-st" src="${ICON['st_'+k]}" alt="">`;
 F.show({cls:'fc smi',title:'鍛冶',res:res(),
  body:`<div class="fc-pick">${F.tile(it,{noeq:1})}<div class="fc-socks">${it.sock.map((k,i)=>`<button class="fc-sk${k?' on':''}" data-a="h" data-v="${i}">${k?sI(k):F.ic('gem')}</button>`).join('')}</div></div>
   <div class="fc-grid st">${st.map(k=>`<button class="fc-t stn${SELST===k?' sel':''}" data-a="c" data-v="${k}" style="--rc:${STONES[k].c}">${sI(k)}<small>${G.stones[k]}</small></button>`).join('')}</div>${st.length?'':F.empty('gem')}`,
  foot:SELST?`<div class="fc-tools"><span class="fc-cost">${sI(SELST)}${Object.entries(STONES[SELST].v).map(([a,b])=>`<b>${esc(opTxt({k:a,v:b}))}</b>`).join('')}</span></div>`:'',toast:toast(m)},
 {back:()=>{STEP=null;SELST=null;main();},c:k=>{SELST=SELST===k?null:k;sockStep();},
  h:i=>{i=+i;const k=it.sock[i];if(k){it.sock[i]=null;G.stones[k]=(G.stones[k]||0)+1;SFX.sel();}else if(SELST&&G.stones[SELST]>0){it.sock[i]=SELST;G.stones[SELST]--;if(!G.stones[SELST])SELST=null;SFX.aw();}save();sockStep();}});}
smith=function(m){STEP=null;main(m);};
enhance=function(m){TAB='enh';smith(m);};
return{get tab(){return TAB;}};})();
