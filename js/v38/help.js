/* ===== ver0.38 タップで詳細（V38H） =====
 編成・キャラ詳細の画面には数値と名前だけを出し、説明はタップしたときに吹き出しで見せる。
 ・能力値（7 種）：役割・成長・素の値と装備ぶん・その能力から決まる数値
 ・武器種・LP・BP・戦闘力・右の列の数値（技の威力・会心率など）
 ・編成カードの立ち位置：陣形のその並び順の補正
 ・アビリティ：名前と段階だけを出し、タップで効果を開く（.x38）
 印：data-h38="種類:引数…"。どの画面（編成・キャラ詳細・探索中のシート）でも同じ吹き出しを使う */
'use strict';
const V38H=(()=>{
const D=RSD,C=RSC;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct=v=>Math.round(v*100)+'%';
const sign=v=>(v>=0?'+':'')+v;
/* ---------- 中身 ---------- */
const ST_MORE={
 str:()=>['技（物理攻撃）のダメージ＝技の威力×技の倍率 − 相手の体力×0.5'],
 vit:(s)=>[`技で受けるダメージを ${Math.round(s.s7.vit*.5)} 減らす（体力×0.5）`],
 dex:(s,r)=>[`技の命中率 ${sign(Math.round(.12*(r.dex/mean(r)-1)*100))}%（器用さが自分の能力の平均より高いほど当たる）`],
 agi:(s)=>[`行動順の速さ ${s.spd}（高いほど先に動く）`,'相手より速いほど、技が当たりやすく、技を避けやすい'],
 int:(s,r)=>[`術のダメージ＝知力×術の倍率 − 相手の精神×0.5`,`術の命中率 ${sign(Math.round(.08*(r.int/mean(r)-1)*100))}%`,'状態異常・能力変化の成功率は、相手の精神と比べて決まる'],
 wil:(s)=>[`術で受けるダメージを ${Math.round(s.s7.wil*.5)} 減らす（精神×0.5）`,'高いほど、状態異常・能力変化にかかりにくい'],
 cha:(s)=>[`回復を受ける量 ×${s.healRecv}`,`回復アビリティの回復量 ×${s.healAb}`,'状態異常の成功率は、知力と魅力の平均で決まる']};
const mean=r=>D.ST7.reduce((a,k)=>a+r[k],0)/7;
function stat(id,k){const s=stats(id),r=s.s7,P=C.pf(id),g=P.base[k][1],b0=C.rs7(id,G.h[id].lv)[k],d=r[k]-b0,L=[D.ST7D[k]];
 if(P.w[k])L.push(`${P.wp}の技の威力に ${D.ST7N[k]} を ${pct(P.w[k])} 使う`);
 try{L.push(...ST_MORE[k](s,r));}catch(e){}
 return{t:D.ST7N[k],v:r[k],tag:`成長 ${g}`,L,foot:d?`素の値 ${b0}　装備・星盤 ${sign(d)}`:`素の値 ${b0}`};}
function wpn(id){const P=C.pf(id),W=D.WPN[P.wp]||{},H=D.HERO[id]||{},L=[];
 L.push(`技の威力：${Object.entries(P.w).map(([k,v])=>D.ST7N[k]+' '+pct(v)).join('＋')}`);
 if(H.alt){L.push(`通常攻撃（杖）：魔弾（術・${H.el}・知力）`);L.push(`通常攻撃（${H.alt.bn}）：${H.alt.n}（${H.alt.el}・腕力と器用さ・与ダメの${pct(H.alt.drain)}を吸収）`);L.push('武器は魔力に加えて攻撃も上がる');}
 else L.push(W.mag?`通常攻撃：魔弾（術・${H.el||''}・知力）`:`通常攻撃：${W.el}属性の技`);
 L.push('武器種と攻撃属性は別のもの。技・術の属性は、技ごとに決まっている');
 return{t:P.wp+(H.shape?`（形：${H.shape}）`:''),tag:'武器種',L};}
function lp(id){const s=stats(id),h=G.h[id];return{t:'LP（ライフポイント）',v:`${h.lp??s.lpMax} / ${s.lpMax}`,L:['一部の高難易度ボス（Lv50 以上）が使う、LP を削る攻撃に当たると 1 減る','気絶・回復術では減らない','LP が 1 以上あれば、回復術・道具で復活できる','0 になると、その戦闘では復活できない','灯都に戻ると全回復'],foot:'灯都に戻ると全回復'};}
function bp(id){const s=stats(id),ex=Math.min(2,Math.floor((s.spGain||0)/5));return{t:'BP（バトルポイント）',tag:'技・術の消費',L:[`初期 ${s.bp0}：戦闘開始時の BP`,`最大 ${s.bpMax}：戦闘中にためられる上限`,`回復 +${s.bpReg+ex}：毎ターン回復する量${ex?`（星盤の BP回復力で +${ex}）`:''}`,'通常攻撃は BP を使わない'],foot:'技Lv4・Lv8 で、その技の消費が 1 ずつ減る。アビリティで回復が増えることもある'};}
function slot(i){const f=C.formOf(),F=D.FORM[f],[x]=F.p[i]||[0],id=G.party[i];
 return{t:`${F.n}　${i+1}番目`,tag:x<.34?'前列':x<.67?'中列':'後列',L:[...(F.s[i]||[]).map(e=>C.effTxt(e)),'図の位置が、そのまま戦闘の立ち位置になる'],foot:id?HB[id].name:''};}
const ROW={
 '戦闘力':['戦闘力','HP・技と術の威力・防御・素早さ・会心率・星臨の位階・覚えた技の数から出す、強さの目安'],
 '最大HP':['最大HP','30% 以下で瀕死、0 で気絶する'],'HP':['HP','今の HP。灯都に戻ると全回復'],'LP':['LP','一部の高難易度ボスの攻撃で減る。0 になるとその戦闘では復活できない。灯都に戻ると全回復'],
 '技の威力':['技の威力','武器種ごとの能力値の配分（腕力・器用さ・素早さ）と、武器の攻撃から決まる'],
 '術の威力':['術の威力','知力と、杖の魔力から決まる'],
 '会心率':['会心率','会心が出るとダメージ 1.5 倍。装備とアビリティで上がる'],
 '弱点ダメ':['弱点ダメ','弱点の属性を突いたとき（×1.7）に、さらに上乗せされる'],
 '星臨中与ダメ':['星臨中与ダメ','星臨している間の与えるダメージ'],'ドロップ率':['ドロップ率','敵が装備・宝箱を落とす確率（パーティの合計）'],
 '開始時AG':['開始時AG','戦闘開始時の星臨ゲージ。100% で星臨できる'],'星臨位階':['星臨位階','試練に勝つと上がる。位階ごとに星臨の持続 +1 ターン・与ダメ +10%'],
 '次のLvまで':['次のLvまで','必要な経験値'],'Lv':['Lv','Lv60 から天星盤、Lv99 から限界突破で Lv120 まで']};
function build(key){const[a,b,c]=String(key).split(':');try{
  if(a==='st')return stat(b,c);if(a==='wp')return wpn(b);if(a==='lp')return lp(b);if(a==='bp')return bp(b);if(a==='fs')return slot(+b);
  if(a==='row'&&ROW[b])return{t:ROW[b][0],v:c||'',L:[ROW[b][1]]};}catch(e){console.error(e);}return null;}
/* ---------- 吹き出し ---------- */
let box=null;
function close(){if(box){box.remove();box=null;}}
function open(key,at){const o=build(key);if(!o)return;close();box=document.createElement('div');box.id='h38';
 box.innerHTML=`<div class="c"><div class="hd"><b>${esc(o.t)}</b>${o.v!==undefined&&o.v!==''?`<strong>${esc(o.v)}</strong>`:''}${o.tag?`<em>${esc(o.tag)}</em>`:''}</div><ul>${o.L.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${o.foot?`<small>${esc(o.foot)}</small>`:''}</div>`;
 $('#app').appendChild(box);
 /* タップした場所の近く（下に入らなければ上）に出す */
 try{const c=box.firstChild,ar=$('#app').getBoundingClientRect(),r=at.getBoundingClientRect(),h=c.offsetHeight,below=r.bottom-ar.top+8;
  c.style.top=Math.max(8,below+h>ar.height-8?r.top-ar.top-h-8:below)+'px';}catch(e){}
 try{SFX.sel();}catch(e){}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-h38]');
 if(box){const was=box._k;close();e.stopPropagation();e.preventDefault();if(!t||t.dataset.h38===was)return;}
 if(!t){/* 右の列・戦闘力（旧来の行）：行の名前で引く */
  const r=e.target.closest&&e.target.closest('.cst .sr,.cst .cpw');if(!r)return;
  const nm=(r.querySelector('span,small')||{}).textContent||'',k=Object.keys(ROW).find(x=>nm.replace(/^[A-Z◆]\s*/,'').trim()===x);if(!k)return;
  e.stopPropagation();open('row:'+k+':'+((r.querySelector('b')||{}).textContent||''),r);if(box)box._k='row:'+k;return;}
 e.stopPropagation();e.preventDefault();open(t.dataset.h38,t);if(box)box._k=t.dataset.h38;},true);
/* 画面が変わったら閉じる */
{const _p=panel;panel=function(...a){close();return _p(...a);};}
{const _s=show;show=function(m){close();return _s(m);};}
/* アビリティ：タップで効果を開く */
document.addEventListener('click',e=>{const x=e.target.closest&&e.target.closest('.x38');if(!x||e.target.closest('button,[data-a]'))return;x.classList.toggle('open');try{tone(x.classList.contains('open')?880:660,.03,'square',.02);}catch(er){}});
return{open,close,build};})();
