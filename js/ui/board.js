/* ===== 星盤・天星盤の画面（ver0.39 で 1 ファイルにまとめた。画面の正本はここ） =====
 ・説明の文は出さず、配置で伝える：上＝キャラと残りポイント、中央＝盤面、下＝「星盤／天星盤」の切り替え・キャラ・選んだ星・操作
 ・凡例は出さない。星をタップすると、その星の種類（色）・効果・状態・必要ポイントが下のカードに出る
 ・何も選んでいないときは、カードに解放の進み具合（ゲージ）だけを出す
 ・盤面の描画は ver17.js の drawBoard（天星盤は v31/board.js が差し替え）、データ・解放の決まりは items.js・v31/board.js・rs/core.js
 ・これより前の boardMenu／upMenu の上書き（ver17・v21・v31・rs/core）は、ここで置き換える */
'use strict';
const BOARDUI=(()=>{
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const X=V31B;
/* 盤面の文字：アビリティ強化は「ア」 */
SHORT.abN='ア';SHORT.ps='ア';
const TN={core:'中心',stat:'能力',skill:'技',aw:'星臨強化',fork:'分岐',ab:'アビリティ強化',ps:'アビリティ強化',ex:'極'};
NCOL.ab=NCOL.ab||'#ffb86b';

/* 今のモード（通常／天星盤）の盤面データと操作 */
function mode(id){const h=G.h[id];
 if(!BS.up)return{N:BOARD[id],U:h.board,left:ptsLeft(id),can:k=>canUnlock(id,k),auto:()=>autoUnlock(id),reset:()=>{h.board=['0,0'];},lock:false,
  skill:'技',star:BDEF[id].star};
 return{N:X.BOARD2[id],U:X.b2(id),left:X.tenLeft(id),can:k=>X.canUnlock2(id,k),auto:()=>X.auto2(id),reset:()=>{h.board2=['0,0'];},lock:h.lv<X.OPEN_LV,
  skill:'極技',star:BDEF[id].star+'・天'};}
function stateOf(id,M,n){if(M.U.includes(n.k))return['解放済み','on'];if(M.lock)return['Lv不足','ng'];
 if(M.can(n.k))return n.cost<=M.left?['解放できる','ok']:['ポイント不足','ng'];
 if(n.t==='ps'&&M.U.some(u=>M.N[u]&&M.N[u].t==='ps'&&M.N[u].g===n.g))return['もう一方を解放済み','ng'];
 return['隣の星を先に解放','ng'];}
const left2=x=>G.h[x].lv>=X.OPEN_LV?X.tenLeft(x):0;

boardMenu=function(m){const id=BS.id,h=G.h[id],M=mode(id),n=BS.sel&&M.N[BS.sel],tot=Object.keys(M.N).length-1,got=M.U.length-1;
 const can=!M.lock&&n&&M.can(n.k)&&n.cost<=M.left,st=n&&stateOf(id,M,n),ten=h.lv>=X.OPEN_LV;
 $('#labels').innerHTML=`<div class="bdh b39${BS.up?' up31':''}" style="--ec:${elCol(id)}"><img src="${art(id)}" alt=""><div class="bdn"><b>${esc(HB[id].name)}</b><small>「${esc(M.star)}」　Lv${h.lv}</small></div>
  <div class="bdp${M.left>0&&!M.lock?' rdy':''}"><b>${M.lock?'—':M.left}</b><small>pt</small></div></div>
  ${M.lock?`<div class="lk31">Lv${X.OPEN_LV}で開放<small>あと Lv${X.OPEN_LV-h.lv}</small></div>`:''}`;
 log(m||'');
 const card=n?`<div class="bdi b39" style="--nc:${NCOL[n.t]||'#8890c0'}"><div class="bdt"><i>${n.t==='skill'?M.skill:TN[n.t]||''}${n.t==='fork'||n.t==='ps'?'<small>どちらか1つ</small>':''}</i><em class="${st[1]}">${st[0]}</em></div><b>${esc(n.d)}</b>${m?`<p>${m}</p>`:''}<span class="cs"><small>必要</small>${n.cost}<small>pt</small></span></div>`
  :`<div class="bdi b39 pg"><div class="bar"><i style="--r:${Math.round(got/tot*100)}%"></i></div><b>${got}<small>／${tot}</small></b>${m?`<p>${m}</p>`:''}</div>`;
 const lbOn=G.members.some(x=>!V31.lbCheck(x));
 panel(`<div class="bdtab"><button class="${BS.up?'':'on'}" data-a="t0">星盤${ptsLeft(id)>0?`<em>${ptsLeft(id)}</em>`:''}</button><button class="${BS.up?'on':''}${ten?'':' lk'}" data-a="t1">天星盤${ten?(left2(id)>0?`<em>${left2(id)}</em>`:''):`<small>Lv${X.OPEN_LV}</small>`}</button></div>
 <div class="bdm">${G.members.map(x=>{const r=BS.up?left2(x)>0:ptsLeft(x)>0;return`<div class="bdf${x===id?' on':''}${r?' rdy':''}" data-a="m" data-v="${x}" style="--ec:${elCol(x)}"><img src="${art(x)}" alt=""><small>${esc(HB[x].name)}</small></div>`;}).join('')}</div>
 ${card}
 <div class="bdb"><button class="tbtn gold" data-a="un" ${can?'':'disabled'}>解放</button><button class="tbtn" data-a="auto" ${M.left>0&&!M.lock?'':'disabled'}>おまかせ</button><button class="tbtn" data-a="rs" ${got>0?'':'disabled'}>リセット</button></div>
 <div class="bdb b39">${BS.up?`<button class="tbtn${lbOn?' gold':''}" data-a="lb">限界突破<small>上限 ${V31.capOf(id)}</small></button>`:`<button class="tbtn" data-a="tr">${SEIRIN.n}の試練<small>位階${ROMAN[h.awLv||1]}</small></button>`}<button class="tbtn back" data-a="back">戻る</button></div>`,
 {m:x=>{BS.sel=null;BS.id=x;boardMenu();},
  t0:()=>{if(!BS.up)return;BS.up=false;BS.sel=null;boardMenu();},t1:()=>{if(BS.up)return;BS.up=true;BS.sel=null;boardMenu();},
  un:()=>{M.U.push(n.k);SFX.aw();save();boardMenu('解放した！');},
  auto:()=>{const c=M.auto();if(c)SFX.aw();save();boardMenu(c?`${c}個の星を解放した`:'解放できる星がない');},
  rs:()=>{M.reset();BS.sel=null;save();boardMenu('リセットした（ポイントは全て戻る）');},
  tr:()=>{BS.up=false;enterTown();trialMenu();},
  lb:()=>V31.lbScreen(()=>{openBoard(id);BS.up=true;boardMenu();}),
  back:()=>{BS.up=false;const f=BFROM;BFROM='town';enterTown();if(f==='party')partyScreen();}});
 try{V21.boardFit();}catch(e){}
 try{tip('board');}catch(e){}};
return{mode,TN};})();
