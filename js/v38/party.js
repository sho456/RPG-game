/* ===== ver0.38 編成画面 =====
 ・縦長のカードを 4 枚並べる：位階の紋章・キャラの絵・武器種と名前・戦闘力・装備 6 枠・星臨のオーブ・陣形の立ち位置と補正
 ・下の帯に陣形名と「陣形変更」。陣形を選ぶと、カードの立ち位置の図と補正がすぐ変わる（戦闘の配置もこのとおり）
 ・操作：カードをタップで選ぶ → 別のカード（控えも）をタップで入れ替え／同じカードをもう一度で詳細（装備・能力・技） */
'use strict';
const V38P=(()=>{
const D=RSD,C=RSC;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SL6=['w','sub','head','body','acc1','acc2'];
const WIC={'剣':'sword','短剣':'dagger','大剣':'gsword','斧':'axe','体術':'fist','弓':'bow','杖':'staff','双剣':'dual'};
/* 武器種のアイコン（装備アイコンの「鉄」の段を使う） */
const wIconK=k=>{try{return IC21.render(k+'_鉄',0);}catch(e){return'';}};
const wIcon=t=>wIconK(WIC[t]||'sword');
/* 立ち位置の図（4 人ぶん。me＝このカードの位置） */
function posMap(f,me,cls=''){const F=D.FORM[f];return`<div class="pm38 ${cls}">${F.p.map(([x,y],i)=>`<i class="${i===me?'me':''}" style="left:${12+x*76}%;top:${12+y*76}%">${cls?i+1:''}</i>`).join('')}</div>`;}
/* 並び順 i の補正（主な能力値） */
function slotTag(f,i){const e=(D.FORM[f].s[i]||[]).find(x=>x.t==='st7'&&x.v>0);return e?`${D.ST7N[e.k]}<b>▲</b>`:'';}
function slotTxt(f,i){return(D.FORM[f].s[i]||[]).map(e=>C.effTxt(e)).join('・');}
let SEL=null;
partyScreen=function(m){const P=G.party,f=C.formOf(),bench=G.members.filter(id=>!P.includes(id)),tot=P.reduce((a,id)=>a+power(id),0),sel=SEL&&G.members.includes(SEL)?SEL:(SEL=null);
 log(m||(sel?`<b>${HB[sel].name}</b>を選択中　入れ替える相手をタップ／もう一度タップで詳細`:'<b>編成</b>　カードをタップで選ぶ'));
 const eq=id=>SL6.map(sl=>{const it=G.h[id].eq[sl]&&findItem(G.h[id].eq[sl]);return it?`<img class="r${it.rar}" src="${itemIcon(it)}" alt="">`:'<i></i>';}).join('');
 const card=(id,i)=>{const h=G.h[id],lv=h.awLv||1,ec=elCol(id),wt=(D.HERO[id]||{}).w||'',shp=(D.HERO[id]||{}).shape,ag=ptsLeft(id);
  return`<div class="pc38${sel===id?' sel':''}" data-a="c" data-v="${id}" style="--ec:${ec}">
   <div class="cr"><b>${ROMAN[lv]}</b></div>
   <div class="ar">${conSvg(id)}<img src="${art(id)}" alt=""><i class="no">${i+1}</i></div>
   <div class="nm"><img src="${shp==='大鎌'?wIconK('scythe'):wIcon(wt)}" alt="${esc(wt)}"><span>${esc(HB[id].name)}</span></div>
   <div class="pw"><small>戦闘力</small><b>${fmt(power(id))}</b><em>Lv${h.lv}</em></div>
   <div class="eq">${eq(id)}</div>
   <button class="ob${ag>0?' rdy':''}" data-a="aw" data-v="${id}" aria-label="${SEIRIN.n}"><i style="--ec:${ec}"></i><small>${ag>0?'星盤 '+ag:SEIRIN.n}</small></button>
   <button class="fp" data-h38="fs:${i}">${posMap(f,i)}<span>${slotTag(f,i)}</span></button></div>`;};
 panel(`<div class="ps38">
  <div class="hd"><b>編成</b><span><small>パーティ戦闘力</small><strong>${fmt(tot)}</strong></span></div>
  <div class="cs">${P.map(card).join('')}${Array.from({length:4-P.length},()=>`<div class="pc38 emp" data-a="e"><b>＋</b><small>空き</small></div>`).join('')}</div>
  <div class="fb"><button class="fn" data-a="form"><small>陣形</small><b>${esc(D.FORM[f].n)}</b></button><button class="fc" data-a="form">陣形変更</button></div>
  ${sel?`<div class="pa"><button class="tbtn gold" data-a="det">詳細・装備</button><button class="tbtn" data-a="bd" data-v="${sel}">星盤</button><button class="tbtn" data-a="rm" ${P.includes(sel)&&P.length>1?'':'disabled'}>控えへ</button><button class="tbtn" data-a="x">選択解除</button></div>`:''}
  <div class="bh">控え <small>${bench.length}人</small></div>
  <div class="bn">${bench.map(id=>`<div class="pb38${sel===id?' sel':''}" data-a="c" data-v="${id}" style="--ec:${elCol(id)}"><img src="${art(id)}" alt=""><b>${esc(HB[id].name)}</b><small>Lv${G.h[id].lv}　${fmt(power(id))}</small></div>`).join('')}</div>
  <div class="ft"><button class="tbtn" data-a="inv">持ち物<small>${G.inv.length}個</small></button><button class="tbtn back" data-a="back">◀ ホーム</button></div></div>`,
 {c:id=>{if(!SEL){SEL=id;SFX.sel();return partyScreen();}if(SEL===id){SEL=null;return equipMenu(id);}
   const a=SEL,ia=P.indexOf(a),ib=P.indexOf(id);SEL=null;if(ia>=0&&ib>=0){P[ia]=id;P[ib]=a;}else if(ia>=0)P[ia]=id;else if(ib>=0)P[ib]=a;else{SEL=id;return partyScreen();}
   save();partyScreen(`<b>${HB[a].name}</b>と<b>${HB[id].name}</b>を入れ替えた`);},
  e:()=>{if(SEL&&!P.includes(SEL)){const a=SEL;SEL=null;P.push(a);save();partyScreen(`<b>${HB[a].name}</b>を編成に加えた`);}else partyScreen('空き枠：控えから仲間を選んで、もう一度ここをタップ');},
  det:()=>{const a=SEL;SEL=null;equipMenu(a);},bd:id=>{SEL=null;BFROM='party';BS.sel=null;openBoard(id);},
  aw:id=>{SEL=null;CTAB='aw';equipMenu(id);},
  rm:()=>{const a=SEL;SEL=null;G.party=P.filter(x=>x!==a);save();partyScreen(`<b>${HB[a].name}</b>を控えに下げた`);},x:()=>{SEL=null;partyScreen();},
  form:()=>formOpen(),inv:()=>invMenu(),back:()=>{SEL=null;townMenu();}});
 try{tip('party');}catch(e){}};
formation=function(){partyScreen();};
/* 陣形の選択：立ち位置の図と、並び順ごとの補正 */
function formOpen(){const cur=C.formOf(),P=G.party;
 ovOpen(`<div class="fm38"><div class="hd"><b>陣形変更</b><small>立ち位置がそのまま戦闘の配置になる</small></div>
  ${Object.entries(D.FORM).map(([k,F])=>`<button class="f${k===cur?' on':''}" data-a="pick" data-v="${k}">${posMap(k,-1,'big')}<div class="tx"><b>${esc(F.n)}${k===cur?'<em>使用中</em>':''}</b><small>${esc(F.d)}</small>
   <ol>${[0,1,2,3].map(i=>`<li><i>${i+1}</i><span>${P[i]?esc(HB[P[i]].name):'―'}</span><small>${esc(slotTxt(k,i))}</small></li>`).join('')}</ol></div></button>`).join('')}</div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{pick:k=>{G.form=k;save();SFX.sel();ovClose();partyScreen(`陣形を<b>${esc(D.FORM[k].n)}</b>にした`);},close:()=>{ovClose();partyScreen();}});}
return{formOpen,posMap,wIcon};})();
