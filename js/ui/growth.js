/* ===== 強化メニュー（経験値のストックとレベルアップ・旧「酒場」を統合した正本。ver0.48 新規） =====
 ・経験値は戦闘ごとに「ストック」（G.xpStock）にたまる。キャラには直接入らない（rewards を包み、gainXP は使わない）
 ・強化メニューで、ストックを使って好きなキャラを好きなだけレベルアップ（+1・+10・上限まで）。上限は V31.capOf（限界突破）
 ・旧「酒場」（town.js / ch9.js / ver18-town.js の tavern）の中身（編成・依頼掲示板・絆の語らい・図鑑・仲間を誘う）をここに統合し、tavern をこの画面で置き換える
 ・下のタブの「酒場」は「強化」に（v22.js townMenu の h22nav・v20-ui.js HNAV）。レベルアップできる仲間がいると「!」
 クエストの完了ボーナスの経験値（v31/quests.js qClear）もストックへ */
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

/* ---------- 画面 ---------- */
let SEL=null;
function open(m){if(!SEL||!G.members.includes(SEL))SEL=G.party[0];
 const dec=G.declined||[],bn=typeof bondReadyN==='function'?bondReadyN():0,qr=QS.filter(q=>!G.q.done[q.id]&&q.ok()).length,qo=QS.filter(q=>!G.q.done[q.id]).length;
 roomOpen('bar','強化',`ストック経験値 ${fm(stock())}`);
 log(m||'<b>主人</b>「おかえり、灯守さん。戦いで得た経験は預かってあるよ。誰を鍛える？」');
 const sv=stock();
 const card=id=>{const h=G.h[id],on=G.party.includes(id),mx=h.lv>=cap(id),nd=need(id),pc=mx?100:Math.min(100,(h.xp||0)/Math.max(1,(h.xp||0)+nd)*100);
  return`<button class="tvm gr48${id===SEL?' sel':''}${on?' on':''}" data-a="sel" data-v="${id}"><img src="${face(id)}"><b>${HB[id].name}</b><small>Lv${h.lv}</small><div class="gx"><i style="width:${pc}%"></i></div>${can(id)?'<i class="gu">▲</i>':''}</button>`;};
 const h=G.h[SEL],mx=h.lv>=cap(SEL),nd=need(SEL);
 const btn=(n,l)=>{const ok=!mx&&sv>=nd;return`<button class="tbtn${ok?' gold':''}" data-a="up" data-v="${n}" ${ok?'':'disabled'}>${l}</button>`;};
 const tl=(a,ic,l,s,b)=>`<button class="ftile${b?' on':''}" data-a="${a}"><img src="${ICON[ic]}"><span><b>${l}</b><small>${s}</small></span>${b?`<i>${b}</i>`:''}</button>`;
 panel(`<div class="gs48"><em>ストック経験値</em><b>${fm(sv)}</b><small>EXP</small></div>
  <div class="tvms">${[...G.party,...G.members.filter(i=>!G.party.includes(i))].map(card).join('')}</div>
  <div class="gp48"><img src="${face(SEL)}"><div class="gi"><b>${HB[SEL].name}</b><span>Lv <strong>${h.lv}</strong><small>/${cap(SEL)}</small></span>
   <small>${mx?'レベル上限（限界突破で解放）':`次のLvまで ${fm(nd)}`}</small></div>
   <div class="gb">${btn(1,'Lv+1')}${btn(10,'+10')}${btn(999,'上限まで')}</div>
   <button class="tbtn gd" data-a="sheet" data-v="${SEL}">詳細</button></div>
  <div class="ftiles">${tl('form','eq','編成','前衛4人・装備・星盤',0)}${tl('board','quest','依頼掲示板',qo?`受注中 ${qo}件`:'すべて報告済み',qr?'報告'+qr:0)}${tl('bond','bond','絆の語らい',bn?`新しい話が${bn}件ある`:'仲間と語り合う',bn?'♥'+bn:0)}${tl('zk','book','図鑑','敵・装備・仲間の記録',0)}</div>
  ${dec.length?`<div class="ttl2">声をかけられる仲間</div>`+dec.map(id=>`<div class="icard r2"><img class="iic" src="${face(id)}"><div class="ibody"><div class="inm">${HB[id].name}</div><div class="isub">${typeof PROF!=='undefined'&&PROF[id]?PROF[id][1]:'酒場で待っている'}</div></div><div class="iright"><button class="tbtn gold" style="width:76px;height:40px" data-a="join" data-v="${id}">誘う</button></div></div>`).join(''):''}${backBtn()}`,
  {sel:id=>{SEL=id;SFX.sel();open(' ');},
   up:n=>{const lv0=G.h[SEL].lv,k=lvUp(SEL,+n||1);if(!k)return;SFX.aw();save();open(`<b>${HB[SEL].name}</b>　Lv${lv0} → <b>Lv${G.h[SEL].lv}</b>（星ポイント+${k*3}）`);},
   sheet:id=>openSheet(id),form:()=>partyScreen(),board:()=>board(),bond:()=>bondMenu(),zk:()=>zkMenu(),
   join:id=>{G.declined=dec.filter(x=>x!==id);newMember(id);SFX.aw();save();open(`<b>${HB[id].name}が仲間になった！</b>`);},back:()=>townMenu()});}
tavern=open;
return{open,stock,add,lvUp,need,can,readyN,toCap};})();
