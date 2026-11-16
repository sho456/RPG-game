/* ===== 用語のハイライト（KW：効果の説明文の用語を緑で示し、タップで詳しい説明を出す正本。ver0.45 新規） =====
 使い方：KW.mark(エスケープ済みの文字列) → 用語を <b class="kw" data-kw="…"> で包んだ HTML。
  ・状態異常・挑発・追撃などの用語（下の T）
  ・【名前】＝固有名の特殊効果（アビリティ段階Ⅲの sp。js/rs/abilities.js から自動で登録）
  ・「名前」＝名前の付いた追撃（アビリティ・星臨アビリティの fu の nm）と奥義
 タップした用語のすぐ近くに小さな吹き出し（.kwp）を出す。どこかをタップすると閉じる。
 使っている所：アビリティの詳細（rs/ui.js abInfo）・技の詳細（info）・星臨（awHTML）・装備の詳細（ui/equip-info.js） */
'use strict';
const KW=(()=>{
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* 用語：[見出し, 説明]。キーは本文に出てくる言い回し（長いものから順に探す） */
const T={
 'スタン':['スタン','次の行動を1回休む。ボスには効かず、代わりに行動が少し遅れる'],
 'マヒ':['マヒ','決まったターンの間、行動できない。ボスには効かず、代わりに行動が少し遅れる'],
 '暗闇':['暗闇','攻撃の命中率が30%下がる'],
 '毒':['毒','行動の前に、最大HPの一定の割合のダメージを受ける（味方はHP1で止まる）。ボスへの効果は弱まる'],
 '挑発':['挑発','敵に狙われやすくなる'],
 '狙われやすい':['挑発','敵に狙われやすくなる'],
 'かばう':['かばう','HPが半分以下の味方が単体攻撃を受けるとき、代わりに攻撃を受ける'],
 '追撃':['追撃','行動のあとに自動でもう1回攻撃する。BPを使わない。名前の付いた追撃は、その名前で出る'],
 '反撃':['反撃','敵の単体攻撃を受けたあと、自動でやり返す。BPを使わない'],
 '回避':['回避','敵の攻撃をかわして、ダメージを受けない'],
 '障壁':['障壁','決まった量のダメージを肩代わりする壁。壊れるまで消えない'],
 '継続回復':['継続回復','行動の前にHPが回復する'],
 '吸収':['吸収','与えたダメージの一部だけ、自分のHPが回復する'],
 '弱体':['弱体','能力の低下・毒など、悪い効果'],
 '弱点':['弱点','その属性で攻撃されると、受けるダメージが1.7倍になる'],
 '耐性':['耐性','その属性で受けるダメージが減る。マイナスは逆に増える（1につき1%）'],
 '会心':['会心','ダメージが大きくなる強い一撃（Critical）'],
 '遅らせる':['遅延','行動の順番が後ろにずれる'],
 '先制':['先制','そのターンの早い順番で行動する'],
 '後発':['後発','そのターンの最後に行動する'],
 'こらえる':['こらえる','倒れるダメージを受けても、HP1で踏みとどまる'],
 '耐える':['こらえる','倒れるダメージを受けても、HP1で踏みとどまる'],
 'とどめ':['とどめ','残りHPに関係なく敵を倒す。ボスには効かない'],
 '気絶':['気絶','HPが0の状態。LPが1減る。LPが残っていれば回復術や「起こす」効果で戻れる'],
 '起こす':['復活','気絶した味方を戦いに戻す'],
 '復活':['復活','気絶した味方を戦いに戻す'],
 '連撃':['連撃','1回の技・術で何度も攻撃すること'],
 '防御・精神を':['防御無視','敵の防御（技）と精神（術）の一部を無いものとして計算する'],
 '星臨ゲージ':['星臨ゲージ','100%になると星臨できる。攻撃を当てる・受けると溜まる'],
 '奥義':['奥義','星臨している間に1度だけ使える必殺技。BPを使わない'],
 '蓄積':['蓄積','受け止めたダメージを力として溜める。奥義で放つ'],
 '巻き戻す':['巻き戻し','星臨した瞬間の味方のHP・気絶の状態に戻す'],
 '能力ダウン状態':['能力ダウン','攻撃・防御・魔力・精神・素早さ・会心率が下がっている状態（弱体の一部）'],
 '状態異常':['状態異常','毒・スタン・マヒ・暗闇'],
 '練達':['練達','技・術を錬磨石で 3 段階まで強くする。技・術の詳細の窓から行う']};
/* 固有名の特殊効果・名前付きの追撃（自動で登録） */
const SP={},NM={'解癒(1回)':['解癒(1回)','[ターン終了時] 次の効果が発動する（上限 1 回）：自身のすべての状態異常を解除する／自身の攻撃・防御・魔力・精神・素早さの能力ダウン状態を解除する／自身のHPを回復する（効果極小）','練達の効果']};
function reg(){try{const C=RSC,D=RSD;
  for(const id in D.AB)(D.AB[id]||[]).forEach(A=>{if(A.sp)SP[A.sp.n]=[A.sp.n,A.sp.d,A.n];for(const f of A.fx)if(f.nm)NM[f.nm]=[f.nm,`名前の付いた追撃。${f.el||''}属性`,A.n];});
  try{for(const k in RSM.U3){const x=RSM.U3[k];SP[x.n]=[x.n,x.d,'練達Ⅲ・'+((SK[k]||D.NEW[k]||{}).n||'')];}for(const k in RSM.SUP){const x=RSM.SUP[k][2];if(x&&x.n)SP[x.n]=[x.n,x.d.map(t=>t.replace(/^【[^】]+】/,'')).join('／'),'練達Ⅲ・'+((SK[k]||D.NEW[k]||{}).n||'')];}}catch(e){}
  for(const id in D.AWX){const X=D.AWX[id];for(const f of X.fx)if(f.nm)NM[f.nm]=[f.nm,`星臨中の名前の付いた追撃。${f.el||''}属性・威力${f.pw||1}`,X.n];
   const s=SK[X.ou];if(s)NM[s.n]=[s.n,`奥義。${s.d||''}`,X.n];}}catch(e){}}
let RX=null;
function rx(){if(RX)return RX;reg();const ks=Object.keys(T).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 RX=new RegExp(`【([^】]+)】|「([^」]+)」|(${ks.join('|')})`,'g');return RX;}
/* 本文の用語を包む（入力はエスケープ済みの文字列） */
function mark(html){if(!html)return'';return String(html).replace(rx(),(m,sp,nm,w)=>{
  if(sp)return SP[sp]?`<b class="kw sp" data-kw="sp:${esc(sp)}">【${sp}】</b>`:m;
  if(nm)return NM[nm]?`<b class="kw nm" data-kw="nm:${esc(nm)}">「${nm}」</b>`:m;
  return`<b class="kw" data-kw="${esc(w)}">${w}</b>`;});}
/* エスケープしてから包む */
const markT=s=>mark(esc(s));
function look(k){if(k.startsWith('sp:'))return SP[k.slice(3)];if(k.startsWith('nm:'))return NM[k.slice(3)];return T[k];}
/* 吹き出し */
let P=null;
function close(){if(P){P.remove();P=null;}}
function show(el){const k=el.dataset.kw,v=look(k);if(!v)return;close();
 const p=document.createElement('div');p.className='kwp'+(k.startsWith('sp:')?' sp':'');
 p.innerHTML=`<b>${k.startsWith('sp:')?'【'+esc(v[0])+'】':esc(v[0])}</b>${v[2]?`<small>${esc(v[2])}</small>`:''}<p>${esc(v[1])}</p>`;
 document.body.appendChild(p);P=p;
 const r=el.getBoundingClientRect(),W=window.innerWidth,H=window.innerHeight,w=p.offsetWidth,h=p.offsetHeight;
 let x=Math.min(Math.max(8,r.left+r.width/2-w/2),W-w-8),y=r.top-h-8;if(y<8)y=r.bottom+8;if(y+h>H-8)y=Math.max(8,H-h-8);
 p.style.left=Math.round(x)+'px';p.style.top=Math.round(y)+'px';p.classList.add('on');}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.kw');
 if(t){e.stopPropagation();e.preventDefault();try{SFX.sel();}catch(x){}show(t);return;}
 if(P&&!e.target.closest('.kwp'))close();},true);
return{mark,markT,T,SP,NM,close,reset:()=>{RX=null;}};})();
