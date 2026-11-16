/* ===== 技・術の練達（RSM。ver0.47 新規の正本。旧「技Lv（熟練）」を置き換え） =====
 技・術はそれぞれ 3 段階まで「練達」で強くなる。強化には敵が落とす「錬磨石」を使う（Ⅰ 3 個・Ⅱ 6 個・Ⅲ 10 個）。
 段階の効果は積み重なる（Ⅲ はⅠ・Ⅱの効果も持つ）。奥義と通常攻撃は対象外。
 データ：攻撃の技・術は 2 段階まで共通の決まり（GEN）、Ⅲは技・術ごとの【固有名】の効果（U3。ver0.48）。補助の技・術は 1 つずつ書く（SUP・Ⅲの名前は SUPN）。
 処理：js/rs/battle.js prep（威力・効果の追加）・js/rs/core.js costOf（消費BP）・js/v20-battle.js addSt（解除・解癒などの効果）。
 画面：技・術の詳細の窓（js/rs/ui.js info）に 3 段階の効果と「練達する」ボタン。
 効果量の呼び名：小＝10%／中＝15%／大＝20%／極大＝30%／超極大＝40% */
'use strict';
const RSM=(()=>{const D=RSD;
const STONE='renma',COST=[3,6,10],RK=['','Ⅰ','Ⅱ','Ⅲ'];
const SZ={小:10,中:15,大:20,極大:30,超極大:40};
const ALL5='攻撃・防御・魔力・精神・素早さ';
const T=f=>f.on==='allies'?'味方生存者全体':f.on==='self'?'自身':f.on==='enemies'?'敵全体':'対象';
/* 錬磨石（MATS に足す。アイコンは虚の欠片の絵を流用） */
try{MATS[STONE]={n:'錬磨石',p:30};if(typeof ICON!=='undefined'&&!ICON[STONE])ICON[STONE]=ICON.kakera;}catch(e){}
/* ---------- 攻撃の技・術：属性ごとのⅢの効果 ---------- */
const EL3={
 '斬':(all)=>({fx:[{k:'def',v:-15,t:2}],d:`${all?'敵全体':'対象'}の防御を下げる（効果中・2ターン）`}),
 '打':(all)=>({fx:[{k:'stun',v:1,t:1,p:all?.15:.25}],d:`${all?'15':'25'}%で${all?'敵全体':'対象'}をスタンさせる`}),
 '突':()=>({crit:25,d:'この技・術の会心率が25%上がる'}),
 '熱':(all)=>({fx:[{k:'poison',v:.05,t:3,p:.5}],d:`50%で${all?'敵全体':'対象'}を毒にする（毎ターン最大HPの5%・3ターン）`}),
 '冷':(all)=>({fx:[{k:'spd',v:-20,t:2}],d:`${all?'敵全体':'対象'}の素早さを下げる（効果大・2ターン）`}),
 '雷':(all)=>({fx:[{k:'para',v:1,t:1,p:all?.2:.3}],d:`${all?'20':'30'}%で${all?'敵全体':'対象'}をマヒさせる（1ターン）`}),
 '陽':()=>({post:[{on:'self',k:'healp',v:.1}],d:'攻撃のあと、自身のHPを回復する（効果小）'}),
 '陰':(all)=>({fx:[{k:'res',v:-20,t:2}],d:`${all?'敵全体':'対象'}の精神を下げる（効果大・2ターン）`})};
function gen(k,s){const all=s.t==='all',e=EL3[s.el]||EL3['斬'],x=e(all),bp=(s.bp||0)>=3;
 return[{pow:1.1,d:['威力が10%上がる']},
  {pow:1.2,bp:bp?1:0,d:[bp?'消費BPが1下がる':'威力がさらに上がる（合計+20%）',...(bp?['威力がさらに上がる（合計+20%）']:[])]},
  Object.assign({},x,{pow:1.3,d:['威力がさらに上がる（合計+30%）',x.d]})];}
/* ---------- 技・術ごとのⅢの固有効果（ver0.48：すべての技・術に【固有名】の効果を付ける） ----------
 fx：当てた相手に付ける／post：攻撃のあとに付ける（on：self・allies・enemies・t）／crit：会心率+
 cp：{c,v} 条件（battle.js cnd の名前）を満たすと威力×v／fu：{p,pow} 同じ属性の追撃／delay：遅らせる量+／pierce：防御・精神の無視+／drain：吸収+／hits：攻撃回数+
 post の k:'bpg' は自身の BP を v 回復（js/v20-battle.js addSt） */
const U3={
 /* リオ */
 koujin:{n:'陽光の刻印',fx:[{k:'weak',el:'陽',t:2}],d:'対象に陽の弱点を付ける（2ターン）'},
 harai:{n:'払い返し',post:[{on:'self',k:'counter',v:1,t:2}],d:'攻撃のあと、自身を反撃態勢にする（2ターン）'},
 torirensan:{n:'灯火の残照',post:[{on:'self',k:'atk',v:20,t:3}],d:'攻撃のあと、自身の攻撃を上昇させる（効果大・3ターン）'},
 shiden:{n:'雷鳴の追撃',fu:{p:.5,pow:.6},d:'50%で同じ対象に雷の追撃（威力0.6）'},
 x_rio1:{n:'天灯の加護',post:[{on:'allies',k:'atk',v:15,t:3},{on:'allies',k:'mag',v:15,t:3}],d:'攻撃のあと、味方生存者全体の攻撃・魔力を上昇させる（効果中・3ターン）'},
 /* ガルド */
 tateuchi:{n:'不動の盾',post:[{on:'self',k:'prot',v:20,t:2}],d:'攻撃のあと、自身の被ダメージを軽減する（効果大・2ターン）'},
 chiretsu:{n:'先陣の地裂',cp:{c:'tfull',v:1.5},d:'HPが満タンの敵への威力が1.5倍'},
 saigan:{n:'岩盤割り',fx:[{k:'def',v:-15,t:2}],d:'敵全体の防御を下げる（効果中・2ターン）'},
 x_gald1:{n:'不落の城壁',post:[{on:'allies',k:'clrdn',v:1},{on:'allies',k:'shield',v:.1,t:99}],d:'攻撃のあと、味方生存者全体の能力ダウン状態を解除し、最大HP10%の障壁を張る'},
 /* ミレイ */
 fire:{n:'燎原',cp:{c:'tpoison',v:1.4},d:'毒の敵への威力が1.4倍'},
 blizz:{n:'凍てつく鎖',fx:[{k:'stun',v:1,t:1,p:.3}],d:'30%で対象をスタンさせる'},
 flamewave:{n:'熱波の残滓',fx:[{k:'poison',v:.04,t:3,p:.5}],d:'50%で敵全体を毒にする（毎ターン最大HPの4%・3ターン）'},
 prism:{n:'七色の焦点',cp:{c:'weak',v:1.3},d:'弱点を突いたとき威力が1.3倍'},
 meteor:{n:'星落としの余熱',post:[{on:'self',k:'mag',v:20,t:3}],d:'攻撃のあと、自身の魔力を上昇させる（効果大・3ターン）'},
 x_mire2:{n:'絶対零域',fx:[{k:'stun',v:1,t:1,p:.25},{k:'res',v:-30,t:3}],d:'対象の精神を下げる（効果極大・3ターン）。さらに25%でスタンさせる'},
 /* シオン */
 shippu:{n:'疾風の残像',post:[{on:'self',k:'evade',v:20,t:2}],d:'攻撃のあと、自身の回避を上昇させる（効果大・2ターン）'},
 kagenui:{n:'影の楔',delay:40,d:'対象の行動をさらに大きく遅らせる'},
 dokujin:{n:'猛毒',cp:{c:'tpoison',v:1.5},d:'毒の敵への威力が1.5倍'},
 genei:{n:'幻影の一閃',hits:1,d:'攻撃回数が1回増える'},
 oborozuki:{n:'月影の帳',post:[{on:'allies',k:'evade',v:15,t:2}],d:'攻撃のあと、味方生存者全体の回避を上昇させる（効果中・2ターン）'},
 x_shion1:{n:'千影縛り',fx:[{k:'para',v:1,t:1,p:.4}],d:'40%で対象をマヒさせる（1ターン）'},
 /* ノア */
 holy:{n:'聖痕',fx:[{k:'mark',v:20,t:3}],d:'対象の被ダメージを増やす（効果大・3ターン）'},
 dispel:{n:'浄化の光',post:[{on:'allies',k:'clrail',v:1}],d:'攻撃のあと、味方生存者全体のすべての状態異常を解除する'},
 /* エルナ */
 raiya:{n:'連雷',fu:{p:.4,pow:.5},d:'40%で同じ対象に雷の追撃（威力0.5）'},
 nerai:{n:'必中の構え',pierce:.2,d:'防御・精神をさらに20%無視する'},
 samidare:{n:'矢の雨',hits:1,d:'攻撃回数が1回増える'},
 ashidome:{n:'縫い留め',fx:[{k:'para',v:1,t:1,p:.3}],d:'30%で対象をマヒさせる（1ターン）'},
 kantsuu:{n:'弱所穿ち',cp:{c:'weak',v:1.4},d:'弱点を突いたとき威力が1.4倍'},
 x_erna1:{n:'天眼',crit:40,d:'この技の会心率が40%上がる'},
 /* バルザ */
 tekkai:{n:'鉄の重み',cp:{c:'tbrk',v:1.4},d:'HPが半分以下の敵への威力が1.4倍'},
 kaentanda:{n:'焼き入れ',post:[{on:'self',k:'crit',v:20,t:3}],d:'攻撃のあと、自身の会心率を上昇させる（効果大・3ターン）'},
 daichiwari:{n:'大地の裂け目',fx:[{k:'stun',v:1,t:1,p:.2}],d:'20%で敵全体をスタンさせる'},
 gouen:{n:'業火の燠',fx:[{k:'weak',el:'熱',t:2}],d:'敵全体に熱の弱点を付ける（2ターン）'},
 x_balza1:{n:'鋼の心',post:[{on:'self',k:'clrdn',v:1},{on:'self',k:'def',v:30,t:3}],d:'攻撃のあと、自身の能力ダウン状態を解除し、防御を上昇させる（効果極大・3ターン）'},
 /* クロウ */
 noroi:{n:'呪詛の根',fx:[{k:'res',v:-15,t:3}],d:'対象の精神を下げる（効果中・3ターン）'},
 yaminami:{n:'常闇の帳',fx:[{k:'atk',v:-15,t:2}],d:'敵全体の攻撃を下げる（効果中・2ターン）'},
 fushoku:{n:'蝕む呪印',fx:[{k:'poison',v:.06,t:3,p:.5}],d:'50%で対象を毒にする（毎ターン最大HPの6%・3ターン）'},
 tamakurai:{n:'貪る魂',drain:.2,d:'吸収する量が与ダメの20%ぶん増える'},
 shisen:{n:'宣告の刻',cp:{c:'tlow',v:1.5},d:'HPが30%以下の敵への威力が1.5倍'},
 x_crow1:{n:'冥府の帳',fx:[{k:'blind',v:1,t:2,p:.5}],d:'50%で敵全体を暗闇にする（2ターン）'},
 /* ハクア */
 shouken:{n:'浸透勁',pierce:.3,d:'防御・精神を30%無視する'},
 hyouken:{n:'霜の拳',fx:[{k:'weak',el:'冷',t:2}],d:'対象に冷の弱点を付ける（2ターン）'},
 hyouketsu:{n:'零下の掌',post:[{on:'self',k:'spd',v:20,t:3}],d:'攻撃のあと、自身の素早さを上昇させる（効果大・3ターン）'},
 hyakuretsu:{n:'千手',crit:30,d:'この技の会心率が30%上がる'},
 tsurara:{n:'氷牢',fx:[{k:'spd',v:-20,t:2}],d:'敵全体の素早さを下げる（効果大・2ターン）'},
 x_hakua1:{n:'千華の霜',fx:[{k:'spd',v:-30,t:3}],d:'対象の素早さを下げる（効果極大・3ターン）'},
 /* ジン */
 tsume:{n:'裂傷',fx:[{k:'poison',v:.04,t:3,p:.5}],d:'50%で対象を毒にする（毎ターン最大HPの4%・3ターン）'},
 popo:{n:'ポポの守り',post:[{on:'self',k:'shield',v:.1,t:99}],d:'攻撃のあと、自身に最大HP10%の障壁を張る'},
 kazekiri:{n:'追い風',post:[{on:'allies',k:'spd',v:15,t:2}],d:'攻撃のあと、味方生存者全体の素早さを上昇させる（効果中・2ターン）'},
 goga:{n:'獣の本能',cp:{c:'hplow',v:1.5},d:'自身のHPが半分以下のとき威力が1.5倍'},
 x_jin2:{n:'大激突',fx:[{k:'stun',v:1,t:1,p:.35}],d:'35%で対象をスタンさせる'},
 /* セレス */
 tokiya:{n:'刻み込み',delay:30,d:'対象の行動を遅らせる'},
 chien:{n:'刻の還流',post:[{on:'self',k:'bpg',v:2}],d:'攻撃のあと、自身のBPを2回復する'},
 chronoslow:{n:'停滞域',delay:25,d:'敵全体の行動を遅らせる'},
 shuuen:{n:'終の秒針',cp:{c:'debuffed',v:1.4},d:'弱体がかかった敵への威力が1.4倍'},
 /* ヴァルク */
 ryuuga:{n:'竜の血',drain:.2,d:'与ダメの20%を吸収する'},
 kokuen:{n:'黒炎の呪',fx:[{k:'blind',v:1,t:2,p:.3}],d:'30%で敵全体を暗闇にする（2ターン）'},
 ryuumetsu:{n:'竜殺し',cp:{c:'boss',v:1.3},d:'ボスへの威力が1.3倍'},
 gouka:{n:'竜の怒り',post:[{on:'self',k:'enrage',v:15,t:3}],d:'攻撃のあと、自身の攻撃・魔力を上昇させる（効果中・3ターン）'},
 x_valk2:{n:'黒竜の渇き',post:[{on:'self',k:'healp',v:.15}],d:'攻撃のあと、自身のHPを回復する（効果中）'}};
const U3T=u=>`【${u.n}】${u.d}`;
/* ---------- 補助の技・術：3 段階とも 1 つずつ ---------- */
const st=(on,k,v,t)=>({on,k,v,t});
const SUP={
 kobu:[{pow:1,dur:0,bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},
  {sup:[st('allies','crit',15,3),st('allies','clrdn',1)],d:['味方生存者全体の能力ダウン状態を解除する','味方生存者全体の会心率を上昇させる（効果中・3ターン）']}],
 chouhatsu:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['挑発と強化のターン数が1増える']},{sup:[st('self','shield',.2,99)],d:['自身に最大HP20%の障壁を張る']}],
 teppekikamae:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},
  {sup:[st('allies','clrdn',1),st('allies','def',20,3)],d:['味方生存者全体の能力ダウン状態を解除する','味方生存者全体の防御を上昇させる（効果大・3ターン）']}],
 inori:[{pow:1.15,d:['回復量が15%上がる']},{bp:1,sup:[st('t','clrdn',1)],d:['消費BPが1下がる','対象の能力ダウン状態を解除する']},
  {sup:[st('t','kaiyu',1,2)],d:['対象に「解癒(1回)」（効果1ターン）を付与する']}],
 mamori:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},{sup:[st('allies','kaiyu',1,2)],d:['味方生存者全体に「解癒(1回)」（効果1ターン）を付与する']}],
 regene:[{pow:1.15,d:['回復量が15%上がる']},{sup:[st('allies','clrdn',1)],d:[`味方生存者全体の${ALL5}の能力ダウン状態を解除する`]},
  {sup:[st('allies','shield',.12,99)],d:['味方生存者全体に最大HP12%の障壁を張る']}],
 x_noah1:[{pow:1.15,d:['回復量が15%上がる']},{sup:[st('allies','clrdn',1)],d:[`味方生存者全体の${ALL5}の能力ダウン状態を解除する`]},
  {sup:[st('allies','atk',40,3),st('allies','def',40,3),st('allies','mag',40,3),st('allies','res',40,3),st('allies','spd',40,3),st('allies','kaiyu',1,2)],
   d:[`味方生存者全体の${ALL5}を上昇させる（効果超極大・3ターン）`,'味方生存者全体に「解癒(1回)」（効果1ターン）を付与する']}],
 shuuri:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},{sup:[st('allies','clrdn',1),st('allies','atk',15,3)],d:['味方生存者全体の能力ダウン状態を解除する','味方生存者全体の攻撃を上昇させる（効果中・3ターン）']}],
 kemonohoko:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},{sup:[st('enemies','res',-15,3),st('allies','crit',15,3)],d:['敵全体の精神を下げる（効果中・3ターン）','味方生存者全体の会心率を上昇させる（効果中・3ターン）']}],
 kasoku:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},{sup:[st('allies','clrail',1),st('allies','clrdn',1)],d:['味方生存者全体のすべての状態異常を解除する','味方生存者全体の能力ダウン状態を解除する']}],
 x_celes2:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['効果のターン数が1増える']},{sup:[st('allies','kaiyu',1,2),st('allies','clrail',1)],d:['味方生存者全体のすべての状態異常を解除する','味方生存者全体に「解癒(1回)」（効果1ターン）を付与する']}],
 ryurinkamae:[{bp:1,d:['消費BPが1下がる']},{dur:1,d:['反撃の構えのターン数が1増える']},{sup:[st('self','clrdn',1),st('self','def',30,3),st('self','res',30,3)],d:['自身の能力ダウン状態を解除する','自身の防御・精神を上昇させる（効果極大・3ターン）']}]};
/* 補助の技・術のⅢの固有名（ver0.48） */
const SUPN={kobu:'鼓舞の凱歌',chouhatsu:'金剛の構え',teppekikamae:'城塞',inori:'慈雨',mamori:'聖域',regene:'命の泉',x_noah1:'福音の極光',
 shuuri:'鍛え直し',kemonohoko:'百獣の威圧',kasoku:'刻の奔流',x_celes2:'永劫の守り',ryurinkamae:'竜鱗の誓い'};
for(const k in SUPN){const L=SUP[k];if(!L)continue;const x=L[2];x.n=SUPN[k];x.d=x.d.map((t,i)=>i?t:`【${SUPN[k]}】${t}`);}
/* 技 1 つの 3 段階 */
const CACHE={};
function stages(k){if(CACHE[k])return CACHE[k];const s=SK[k]||D.NEW[k];if(!s||s.ougi||s.basic)return null;
 let L;if(SUP[k])L=SUP[k];else if(s.k==='phys'||s.k==='mag'){L=gen(k,s);if(U3[k]){L=L.slice();const x=U3[k];L[2]=Object.assign({},x,{pow:1.3,fx:x.fx||null,post:x.post||null,crit:x.crit||0,d:[L[2].d[0],U3T(x)]});}}
 else return null;return CACHE[k]=L;}
const lvOf=(id,k)=>{try{return Math.min(3,((G.h[id]||{}).mas||{})[k]||0);}catch(e){return 0;}};
/* 段階 lv までの効果を合わせる（威力の倍率は最後のもの、消費・ターン・追加効果は足す） */
function mods(id,k){const L=stages(k),lv=lvOf(id,k),o={pow:1,bp:0,dur:0,crit:0,fx:[],post:[],sup:[],cp:null,fu:null,delay:0,pierce:0,drain:0,hits:0};if(!L||!lv)return o;
 for(let i=0;i<lv;i++){const s=L[i];if(s.pow)o.pow=s.pow;o.bp+=s.bp||0;o.dur+=s.dur||0;o.crit+=s.crit||0;for(const f of s.fx||[])o.fx.push(f);for(const f of s.post||[])o.post.push(f);for(const f of s.sup||[])o.sup.push(f);
  if(s.cp)o.cp=s.cp;if(s.fu)o.fu=s.fu;o.delay+=s.delay||0;o.pierce+=s.pierce||0;o.drain+=s.drain||0;o.hits+=s.hits||0;}
 return o;}
const costOf=(id,k)=>{const lv=lvOf(id,k);return lv<3?COST[lv]:null;};
function canUp(id,k){const c=costOf(id,k);if(c==null)return'練達は最大です';if(!stages(k))return'この技は練達できない';if((G.mats[STONE]||0)<c)return`${MATS[STONE].n}が足りない（${G.mats[STONE]||0}/${c}）`;return null;}
function up(id,k){const why=canUp(id,k);if(why)return why;const c=costOf(id,k);G.mats[STONE]-=c;const h=G.h[id];h.mas=h.mas||{};h.mas[k]=lvOf(id,k)+1;try{save();}catch(e){}return null;}
/* 敵が落とす：雑魚 35% で 1 個・中ボス 3 個・ボス 6 個 */
{const _r=rewards;rewards=function(es){const r=_r(es);try{let n=0;for(const e of es){const d=ED[e.kind]||{};n+=d.boss?(/^m_|big/.test(e.kind)||e.lv>=50?6:3):Math.random()<.35?1:0;}
  if(n){G.mats[STONE]=(G.mats[STONE]||0)+n;r.drops[STONE]=(r.drops[STONE]||0)+n;}}catch(e){console.error(e);}return r;};}
/* 画面：詳細の窓の練達の欄（id が味方で、覚えている技のとき） */
function html(id,k){const L=stages(k);if(!L)return'';const lv=lvOf(id,k),c=costOf(id,k),have=(G.mats&&G.mats[STONE])||0,esc=RSC.esc;
 return`<div class="ms47"><div class="mh"><b>練達</b><span class="st">${[1,2,3].map(i=>`<i class="${i<=lv?'on':''}"></i>`).join('')}</span><em>${lv?'段階'+RK[lv]:'未練達'}</em></div>
  ${L.map((s,i)=>`<div class="ml${i<lv?' on':''}${i===lv?' nx':''}"><i>${RK[i+1]}</i><ul>${s.d.map(t=>`<li>${KW.markT(t)}</li>`).join('')}</ul></div>`).join('')}
  ${c!=null&&typeof scene!=='undefined'&&scene!=='battle'?`<button class="tbtn${have>=c?' gold':''} wide" data-a="mas" ${have>=c?'':'disabled'}>練達する<small>${MATS[STONE].n} ${c}（所持 ${have}）</small></button>`:''}</div>`;}
return{STONE,COST,stages,mods,lvOf,costOf,canUp,up,html,RK,SZ,U3,SUP};})();
