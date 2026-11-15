/* ===== 鍛冶屋の画面（ver0.44。正本：town.js の smith・enhance と v31/items.js・ver18-town.js の包みを置き換え） =====
 ・説明の文の窓（#msg）は出さない。上に所持金と素材だけ
 ・タブ：品揃え／強化／OP付け替え／ソケット（OP・ソケットは装備を選んだあとの手順は town.js の opSwap・sockMenu のまま）
 ・品物はアイコンだけの格子（レア度の枠・+強化値・装備中の印・値段／費用の小札）
 ・タップで選ぶ → 下の帯に名前・主な性能・操作（購入／強化／選ぶ）と「詳細」。選んだアイコンをもう一度タップでも詳細（EQINFO） */
'use strict';
const SMITH44=(()=>{
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let TAB='shop',SEL=null;
function stock(){try{if(G.stockAt!==G.sorties||!G.stock){const lv=Math.max(1,Math.min(100,Math.max(...G.party.map(i=>G.h[i].lv))-1));
 G.stock=['w','w','main','sub','sub','acc'].map((sl,i)=>genItem(lv,0,0,sl,G.fac.smith>=4&&i===0?2:i%3===2?1:0));G.stockAt=G.sorties;}}catch(e){console.error(e);}return G.stock||[];}
const canOp=i=>!i.unid&&i.ops&&i.ops.length,canSock=i=>!i.unid&&i.sock&&i.sock.length;
function items(){if(TAB==='shop')return stock();
 const inv=G.inv.slice().sort((a,b)=>(eqBy(b.uid)?1:0)-(eqBy(a.uid)?1:0)||b.rar-a.rar);
 if(TAB==='enh')return inv.filter(i=>!i.unid&&i.plus<ecap()).slice(0,60);
 if(TAB==='op')return inv.filter(canOp).slice(0,60);
 return inv.filter(canSock).slice(0,60);}
const key=it=>TAB==='shop'?'s'+G.stock.indexOf(it):'u'+it.uid;
function tag(it){if(TAB==='shop')return`${price(it)*3}G`;if(TAB==='enh')return`+${it.plus}`;if(TAB==='sock')return`${it.sock.filter(Boolean).length}/${it.sock.length}`;return`OP${it.ops.length}`;}
function act(it){if(TAB==='shop'){const p=price(it)*3;return{l:'購入',s:`${p}G`,ok:G.gold>=p};}
 if(TAB==='enh'){const c=ecost(it);return{l:`強化 +${it.plus}→+${it.plus+1}`,s:`${c.g}G・灰石${c.haiseki}${c.kakera?'・欠片'+c.kakera:''}`,ok:G.gold>=c.g&&G.mats.haiseki>=c.haiseki&&G.mats.kakera>=c.kakera};}
 return{l:TAB==='op'?'この装備のOPを付け替える':'この装備の穴を加工する',s:'',ok:true};}
smith=function(m){
 if((TAB==='op'&&G.fac.smith<2)||(TAB==='sock'&&G.fac.smith<3))TAB='shop';
 const L=items(),sel=L.find(it=>key(it)===SEL)||null;if(!sel)SEL=null;log(m||'');
 const tabs=[['shop','品揃え',1],['enh','強化',1],['op','OP付替',G.fac.smith>=2],['sock','ソケット',G.fac.smith>=3]];
 const mats=Object.keys(MATS).filter(k=>['haiseki','kakera'].includes(k)||G.mats[k]).map(k=>`<span><img src="${ICON[k]}" alt="">${G.mats[k]||0}</span>`).join('');
 const A=sel&&act(sel);
 panel(`<div class="sm44">
  <div class="res"><span class="g">${G.gold}<small>G</small></span>${mats}</div>
  <div class="tb">${tabs.map(([k,l,ok])=>`<button class="${TAB===k?'on':''}" data-a="tab" data-v="${k}" ${ok?'':'disabled'}>${l}${ok?'':'<small>🔒</small>'}</button>`).join('')}</div>
  ${m?`<p class="ms">${m}</p>`:''}
  <div class="gr">${L.length?L.map(it=>`<button class="ic r${it.rar}${key(it)===SEL?' sel':''}${TAB==='shop'&&price(it)*3>G.gold?' ng':''}" data-a="pk" data-v="${key(it)}"><img src="${itemIcon(it)}" alt="">${eqBy(it.uid)&&TAB!=='shop'?'<i class="e">E</i>':''}<small>${tag(it)}</small></button>`).join(''):'<div class="emp">対象の装備がない</div>'}</div>
  ${sel?`<div class="sb r${sel.rar}"><img src="${itemIcon(sel)}" alt=""><div class="t"><b>${esc(iname(sel))}</b><small>${esc(mainTxt(sel))}</small></div><button class="tbtn" data-a="info">詳細</button><button class="tbtn gold" data-a="do" ${A.ok?'':'disabled'}>${A.l}${A.s?`<small>${A.s}</small>`:''}</button></div>`:''}
 </div><div class="tbar2"><button class="tbtn back" data-a="back">戻る</button></div>`,
 {tab:v=>{TAB=v;SEL=null;smith();},
  pk:v=>{if(SEL===v){const it=L.find(x=>key(x)===v);if(it)openInfo(it);return;}SEL=v;smith();},
  info:()=>{if(sel)openInfo(sel);},
  do:()=>{if(!sel||!A.ok)return;
   if(TAB==='shop'){G.gold-=price(sel)*3;G.stock=G.stock.filter(x=>x!==sel);sel.uid=++G.uid;G.inv.push(sel);SFX.aw();save();SEL=null;return smith(`${esc(iname(sel))}を買った`);}
   if(TAB==='enh'){const c=ecost(sel);G.gold-=c.g;G.mats.haiseki-=c.haiseki;G.mats.kakera-=c.kakera;sel.plus++;SFX.aw();save();if(sel.plus>=ecap())SEL=null;return smith(`${esc(iname(sel))}に強化した！`);}
   if(TAB==='op')return opSwap(sel);return sockMenu(sel);},
  back:()=>{SEL=null;townMenu();}});
 roomOpen('smith','鍛冶屋',`鍛冶屋Lv${G.fac.smith}　強化上限+${ecap()}`);RSHOW=0;}
enhance=function(m){TAB='enh';smith(m);};
function openInfo(it){try{EQINFO.open(it,{onClose:()=>smith()});}catch(e){console.error(e);}}
return{get tab(){return TAB;}};})();
