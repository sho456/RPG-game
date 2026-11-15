/* ===== 編成画面と陣形（ver0.41 で 1 ファイルにまとめた。画面の正本はここ。旧 js/v38/party.js を置き換え） =====
 ・上：パーティ戦闘力。4 人のカード（絵・位階・名前・Lv・戦闘力）。カードをタップ＝詳細（装備・能力・技）
 ・入れ替え：カードの「入替」か控えの仲間をタップ → 上に「誰と入れ替える？」の帯が出て、相手をタップで入れ替え（控えへ下げるのも帯から）
 ・陣形：小さな配置図と陣形名の帯をタップで陣形画面（formOpen：ロマサガRS の陣形画面のように、2 人をタップで立ち位置を入れ替え）
 ・文字：日本語は M PLUS Rounded 1c の太字、数字は Barlow Condensed。白文字に濃い縁取りで、どの背景でも読めるように */
'use strict';
const V38P=(()=>{
const D=RSD,C=RSC;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const WIC={'剣':'sword','短剣':'dagger','大剣':'gsword','斧':'axe','体術':'fist','弓':'bow','杖':'staff','双剣':'dual'};
/* 武器種のアイコン（装備アイコンの「鉄」の段を使う） */
const wIconK=k=>{try{return IC21.render(k+'_鉄',0);}catch(e){return'';}};
const wIcon=t=>wIconK(WIC[t]||'sword');
const wOf=id=>{const H=D.HERO[id]||{};return H.shape==='大鎌'?wIconK('scythe'):wIcon(H.w||'');};
function slotTxt(f,i){return(D.FORM[f].s[i]||[]).map(e=>C.effTxt(e)).join('・');}

/* ==================== 編成 ==================== */
let SEL=null;/* 入れ替えで選んでいる仲間（パーティでも控えでも） */
partyScreen=function(m){const P=G.party,f=C.formOf(),F=D.FORM[f],bench=G.members.filter(id=>!P.includes(id)),tot=P.reduce((a,id)=>a+power(id),0);
 if(SEL&&!G.members.includes(SEL))SEL=null;const sel=SEL,inP=sel&&P.includes(sel);
 log(m||'');
 const card=(id,i)=>{const h=G.h[id],ag=ptsLeft(id),tg=sel&&sel!==id;
  return`<div class="pc41${sel===id?' sel':''}${tg?' tgt':''}" data-a="c" data-v="${id}" style="--ec:${elCol(id)}">
   <div class="ar"><img src="${art(id)}" alt=""><i class="ak">${ROMAN[h.awLv||1]}</i>${ag>0?'<i class="nt" title="星盤ポイントあり">!</i>':''}</div>
   <div class="nm"><img src="${wOf(id)}" alt=""><b>${esc(HB[id].name)}</b></div>
   <div class="lv"><small>Lv</small><b>${h.lv}</b></div>
   <div class="pw"><b>${fmt(power(id))}</b></div>
   <button class="sw" data-a="s" data-v="${id}">${sel===id?'やめる':'入替'}</button></div>`;};
 const empty=()=>`<div class="pc41 emp${sel&&!inP?' tgt':''}" data-a="e"><b>＋</b></div>`;
 panel(`<div class="ps41">
  <div class="hd"><b>編成</b><span><small>パーティ戦闘力</small><strong>${fmt(tot)}</strong></span></div>
  ${sel?`<div class="swb"><img src="${art(sel)}" alt=""><span><b>${esc(HB[sel].name)}</b>と入れ替える仲間をタップ</span>${inP&&P.length>1?'<button data-a="rm">控えへ</button>':''}<button data-a="x">やめる</button></div>`:''}
  <div class="cs">${P.map(card).join('')}${Array.from({length:4-P.length},empty).join('')}</div>
  <button class="fb" data-a="form">${fMini(f)}<span><small>陣形</small><b>${esc(F.n)}</b></span><em>陣形・配置 ▶</em></button>
  <div class="bh">控え<small>${bench.length}</small></div>
  <div class="bn">${bench.map(id=>`<div class="pb41${sel===id?' sel':''}${sel&&inP?' tgt':''}" data-a="c" data-v="${id}" style="--ec:${elCol(id)}"><img src="${art(id)}" alt=""><b>${esc(HB[id].name)}</b><small>Lv${G.h[id].lv}</small></div>`).join('')}</div>
  <div class="ft"><button class="tbtn" data-a="inv">持ち物<small>${G.inv.length}個</small></button><button class="tbtn back" data-a="back">◀ ホーム</button></div></div>`,
 {c:id=>{if(!SEL){if(P.includes(id))return equipMenu(id);SEL=id;return partyScreen();}/* パーティ＝詳細、控え＝入れ替えの相手を選ぶ */
   if(SEL===id){SEL=null;return partyScreen();}
   const a=SEL,ia=P.indexOf(a),ib=P.indexOf(id);SEL=null;
   if(ia>=0&&ib>=0){P[ia]=id;P[ib]=a;}else if(ia>=0)P[ia]=id;else if(ib>=0)P[ib]=a;else{SEL=id;return partyScreen();}
   save();SFX.sel();partyScreen();},
  s:id=>{SEL=SEL===id?null:id;partyScreen();},
  e:()=>{if(SEL&&!P.includes(SEL)){P.push(SEL);SEL=null;save();}partyScreen();},
  rm:()=>{const a=SEL;SEL=null;G.party=P.filter(x=>x!==a);save();partyScreen();},x:()=>{SEL=null;partyScreen();},
  form:()=>{SEL=null;FPK=null;FLIST=false;formOpen();}/* 陣形はいつも戦場の図から開く */,inv:()=>invMenu(),back:()=>{SEL=null;townMenu();}});
 try{tip('party');}catch(e){}};
formation=function(){partyScreen();};

/* 陣形と立ち位置（ver0.41：ロマサガRS の陣形画面のように）
   ・上：戦闘画面と同じ向きの戦場（左が前＝敵の側）。キャラは戦闘と同じ左向きの構えの絵で、キャラは方位の円の上に立ち、頭の上に補正の札（能力▲／▼）
   ・2 人をタップで立ち位置を入れ替え（並び順 G.party[i] が陣形の i 番目の位置＝戦闘の配置）
   ・下：配置の小図と「変更」（陣形の一覧へ）・陣形名・説明・ⓘ（並び順ごとの補正の一覧） */
let FPK=null,FLIST=false;
const fTags=(f,i)=>(D.FORM[f].s[i]||[]).filter(e=>e.t==='st7').map(e=>`<span class="${e.v>0?'up':'dn'}">${esc(D.ST7N[e.k])}<i></i></span>`).join('')
 +((D.FORM[f].s[i]||[]).some(e=>e.t!=='st7')?'<span class="ex">＋</span>':'');
function fMini(f,cls=''){const F=D.FORM[f];return`<div class="fmi ${cls}">${F.p.map(([x,y])=>`<i style="left:${14+x*72}%;top:${14+y*72}%"></i>`).join('')}</div>`;}
/* 戦闘と同じ「左向きの構え」の絵（SPX の stance を左向きにして切り出す。キャッシュ） */
const STC={};
function stanceL(id){if(STC[id])return STC[id];try{const c=SPX.D[id],sk=SPX.pickSize(id,62,'b',true),f=SPX.cut(id,sk,'','stance',FACING.mirror(c.face,'L'),0,0)||SPX.cut(id,sk,'','front',false,0,0);
 if(f&&f.cv)return STC[id]=f.cv.toDataURL();}catch(e){}return art(id);}
function formOpen(m){const f=C.formOf(),F=D.FORM[f],P=G.party;if(FPK!=null&&!P[FPK])FPK=null;
 if(FLIST)return ovOpen(`<div class="fe41 ls"><div class="lh">陣形を選ぶ</div><div class="fgrid">${Object.entries(D.FORM).map(([k,X])=>`<button class="${k===f?'on':''}" data-a="pick" data-v="${k}">${fMini(k)}<b>${esc(X.n)}</b><small>${esc(X.d)}</small></button>`).join('')}</div></div>
  <button class="tbtn back wide" data-a="lback">戻る</button>`,{pick:k=>{G.form=k;FPK=null;FLIST=false;save();formOpen();},lback:()=>{FLIST=false;formOpen();}});
 const tok=(id,i)=>{const[x,y]=F.p[i]||[.5,.5];return`<button class="tk${FPK===i?' sel':''}${FPK!=null&&FPK!==i?' tgt':''}" data-a="fs" data-v="${i}" style="left:${16+x*66}%;top:${14+y*70}%">
   <span class="tg">${fTags(f,i)||'<span>―</span>'}</span><span class="ring"></span><img src="${stanceL(id)}" alt=""><b>${esc(HB[id].name)}</b></button>`;};
 ovOpen(`<div class="fe41">
  <div class="fld"><i class="foe">敵</i>${P.map(tok).join('')}${m?`<p class="ms">${m}</p>`:''}</div>
  <div class="inf"><div class="l">${fMini(f,'big')}<button class="chg" data-a="list">変 更</button></div>
   <div class="r"><div class="h"><b>${esc(F.n)}</b><button class="i" data-a="info">i</button></div><p>${esc(F.d)}</p></div></div></div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,
 {fs:v=>{const i=+v;if(FPK==null){FPK=i;return formOpen();}if(FPK===i){FPK=null;return formOpen();}
   const a=FPK;FPK=null;[P[a],P[i]]=[P[i],P[a]];save();SFX.sel();formOpen(`${esc(HB[P[i]].name)} ⇄ ${esc(HB[P[a]].name)}`);},
  list:()=>{FLIST=true;formOpen();},
  info:()=>{const o=F.p.map((_,i)=>`<li><b>${P[i]?esc(HB[P[i]].name):'―'}</b><small>${esc(slotTxt(f,i))||'―'}</small></li>`).join('');formOpen.box=1;
   ovOpen(`<div class="fe41 ls"><div class="lh">${esc(F.n)}</div><ol class="fol">${o}</ol></div><button class="tbtn back wide" data-a="lback">戻る</button>`,{lback:()=>formOpen()});},
  close:()=>{FPK=null;FLIST=false;ovClose();partyScreen();}});
 requestAnimationFrame(fitTags);}
/* 補正の札が戦場の外にはみ出す・隣の札と重なるときは、横にずらす */
function fitTags(){const fld=$('#sheet .fe41 .fld');if(!fld)return;const R=fld.getBoundingClientRect(),T=[...fld.querySelectorAll('.tk .tg')];const done=[...fld.querySelectorAll('.tk>b,.tk img')].map(e=>e.getBoundingClientRect());
 for(const t of T){t.style.marginLeft='0px';let r=t.getBoundingClientRect(),dx=0;
  if(r.left<R.left+4)dx=R.left+4-r.left;if(r.right+dx>R.right-4)dx=R.right-4-r.right;
  const own=[...t.parentNode.querySelectorAll(':scope>b,:scope>img')].map(e=>e.getBoundingClientRect());
  for(const o of done){if(own.some(w=>w.left===o.left&&w.top===o.top))continue;const a={l:r.left+dx,r:r.right+dx};if(r.top<o.bottom+2&&r.bottom>o.top-2&&a.l<o.right+4&&a.r>o.left-4){dx+=(a.l+a.r)/2<(o.left+o.right)/2?o.left-4-a.r:o.right+4-a.l;}}
  dx=Math.max(R.left+4-r.left,Math.min(R.right-4-r.right,dx));t.style.marginLeft=dx+'px';const q=t.getBoundingClientRect();done.push(q);}}
return{formOpen,wIcon,fMini};})();
