/* ===== TD のデータ（仲間・敵の変換・数値の定数・報酬。ステージは js/td/stages.js）。設計は docs/TD-DESIGN.md =====
 RPG 版のデータ（HB・ED・AW・SK・RSD.HERO）を読むだけで、書き換えない。数値の尺度は TD 用に引き直す（9999 万・Lv60 以降のインフレは使わない）。
 正本：仲間＝HERO、敵の型＝TRAIT、ステージ＝STAGE。変換＝hero(id,lv)・foe(kind,lv)。技 5 つの読み替え＝mapSk、アビリティ＝abTd・abSum、奥義＝ULT */
'use strict';
const TDD=(()=>{
/* ---------- 定数 ---------- */
const K={FH:420,STEP:1/30,LIVES:7,COST0:10,COST_EVERY:.9,STAR_MAX:10,DARK:.6/*光の外の攻撃の倍率*/,GAP:8/*WAVE の間の秒*/};
/* 役割：line＝隊列（f＝前衛：道の上で敵を止める／b＝後衛：前衛の後ろ・道の脇）・射程・攻撃間隔・止める数・コスト・攻撃の形
 mv＝歩く速さ（px/秒）・chase＝斬るが持ち場から敵へ詰め寄る間合い・off＝後衛が一番前の前衛から下がる間合い */
const ROLE={
 guard:{n:'守る',line:'f',rng:42,iv:1.3,blk:3,cost:16,col:'#7fa6d9',mv:46},
 blade:{n:'斬る',line:'f',rng:40,iv:1.0,blk:1,cost:10,col:'#e0a050',mv:68,chase:80},
 shot: {n:'射る',line:'b',rng:150,iv:1.1,blk:0,cost:12,col:'#9fd36a',mv:52,off:72},
 spell:{n:'術',  line:'b',rng:112,iv:1.6,blk:0,cost:14,col:'#d070d0',splash:32,mv:50,off:56},
 aid:  {n:'支える',line:'b',rng:108,iv:1.5,blk:0,cost:12,col:'#80d8c8',mv:54,off:40}};
/* 仲間 12 人。sk＝技（RPG 版の技のキー。名前は SK から引く）、k＝技の働き、ch＝チャージ秒、lt＝自分の周りに出す光の半径 */
const HERO={
 rio:  {role:'blade',el:'陽',lt:120,sk:'koujin',  k:'strike',m:2.6,ch:8},
 gald: {role:'guard',el:'打',sk:'chouhatsu',k:'guard',ch:12,cost:15},
 balza:{role:'guard',el:'熱',sk:'tekkai',   k:'nova',m:2.2,r:44,ch:10,cost:17,blk:2},
 valk: {role:'guard',el:'陰',sk:'kokuen',   k:'nova',m:2.4,r:48,ch:9,cost:19,blk:2,iv:1.1},
 shion:{role:'blade',el:'突',sk:'kagenui',  k:'stun',m:1.5,dur:1.6,ch:7,cost:8,iv:.7,thief:1},
 hakua:{role:'blade',el:'冷',sk:'shouken',  k:'stun',m:1.7,dur:2.2,ch:9,cost:11,iv:.8},
 jin:  {role:'blade',el:'打',sk:'popo',     k:'strike',m:2.0,kb:36,ch:8,cost:11},
 erna: {role:'shot', el:'雷',sk:'raiya',    k:'chain',m:1.6,cnt:3,ch:7},
 mire: {role:'spell',el:'熱',sk:'flamewave',k:'nova',m:1.9,r:56,ch:9,at:'foe'},
 crow: {role:'spell',el:'陰',sk:'noroi',    k:'curse',m:1.3,dur:6,ch:8,cost:13},
 noah: {role:'aid',  el:'陽',lt:120,sk:'inori',k:'heal',m:.3,r:118,ch:10,cost:11,atkK:.6},
 celes:{role:'aid',  el:'陰',sk:'chien',    k:'slow',m:.45,r:70,dur:6,ch:9,haste:.25,atkK:.7}};
/* 星臨の奥義（戦闘中 1 回・1 人 1 つ）。名前は本編の奥義（AWX.ou）。ver0.56 で旧「極（goku）」の効果を合わせた。
 k：unova＝範囲攻撃（m 倍・半径 r）、uheal＝全員の回復＋灯火 +1＋光を戻す、utime＝敵全体を遅く、upct＝敵全体の今の HP を v 削る（ボスは b）
 付け足し：stun＝止める秒、curse＝防御 −40% の秒、heal＝仲間全員の回復の割合、buff＝仲間全員の攻撃 +割合（8 秒）。d は画面の説明 */
const ULT={
 rio:  {m:7.5,r:96,buff:.2,d:'光の大斬撃で周りの敵をまとめて斬る。仲間全員の攻撃 +20%（8 秒）'},
 gald: {m:5,r:110,heal:.4,d:'受け止めた力を周りへ放つ。仲間全員の HP を 40% 回復'},
 mire: {m:7.5,r:110,curse:6,d:'灼熱と極寒で広い範囲を撃つ。当てた敵の防御 −40%（6 秒）'},
 shion:{m:6,r:84,stun:2,d:'千の刃で周りを斬り、敵を 2 秒止める'},
 noah: {k:'uheal',d:'仲間全員の HP を全回復。灯火を 1 戻し、灯の光を元に戻す'},
 erna: {m:7,r:104,stun:1.5,d:'雷の矢を降らせ、敵を 1.5 秒止める'},
 balza:{m:8,r:96,curse:6,d:'溶けた鉄で周りを砕く。当てた敵の防御 −40%（6 秒）'},
 crow: {k:'upct',v:.4,b:.12,d:'敵全体の今の HP を 40% 削る（ボスは 12%）。防御に左右されない'},
 hakua:{m:10,r:56,stun:1,d:'氷の連撃を一点に叩き込み、敵を 1 秒止める'},
 jin:  {m:8.5,r:80,d:'ポポと一つになった全力の一撃'},
 celes:{k:'utime',m:4,dur:8,d:'刻を巻き戻し、敵全体を 8 秒のあいだ遅くする'},
 valk: {m:8,r:100,d:'竜の咆哮で広い範囲を焼く'}};
/* 図鑑・本編の奥義の説明も TD の効果に揃える（奥義の正本はここ） */
try{for(const id in ULT){const k=RSD.AWX[id].ou;if(SK[k])SK[k].d=ULT[id].d;}}catch(e){}
/* 敵の型：キー → 特性。void＝虚蝕を撒く（生きている間、灯の光を毎秒削る）、fly＝止められない、armor＝物理に強い、ghost＝術に強い */
/* 原画（SPX）の無い敵は、似た型の敵の絵を借りる */
const SPRALT={bookghost:'shade'};
const TRAIT={slime:['void'],moss:['void'],cursedslime:['void'],bookghost:['ghost'],shade:['ghost'],darkknight:['armor'],m_knight:['armor'],boss2:['armor']};
const TRN={void:'虚蝕を撒く（光を削る）',ghost:'霊体（物理が効きにくく、術がよく効く）',armor:'重装（物理に強い。打で割れる）',fly:'飛行'};

/* ---------- 変換 ---------- */
const lvK=lv=>1+.05*(Math.max(1,lv)-1);
const skName=k=>{try{return(SK[k]&&(SK[k].n||SK[k].name))||k;}catch(e){return k;}};
const awName=id=>{try{return(AW[id]&&AW[id].name)||'星臨';}catch(e){return'星臨';}};
const ouName=id=>{try{return SK[RSD.AWX[id].ou].n;}catch(e){return awName(id);}};
/* ---------- 技・術（1 人 5 つ。本編の LEARN）：戦闘で使うのは選んだ 1 つ ----------
 HERO[id].sk（既定の技）は手で合わせた数字。ほかの技は本編の技の形（全体・状態異常・回復・連撃・ランク）から TD の働きへ読み替える */
const RK={E:.8,D:1.05,C:1.35,B:1.65,A:2,S:2.5,SS:3.2,SSS:4.2};
function mapSk(k,role){const s=(typeof SK!=='undefined'&&SK[k])||{},rk=s.rk||'B',p=RK[rk]||1.65,m=+(1.1+p*.6).toFixed(2),ch=Math.round(6+p*1.3),back=ROLE[role].line==='b';
 const fx=[...(s.fx20||[]),...(s.post||[])],has=x=>fx.some(f=>f.k===x),sup=s.k==='sup20'||s.role==='guard';
 if(s.heal20||s.k==='heal'||s.k==='healAll'||s.k==='revive'||s.k==='reviveAll'||s.role==='heal')return{k:'heal',m:+(.22+(s.heal20||.1)*.3).toFixed(2),r:118,ch:ch+1};
 if(sup)return back?{k:'slow',m:.35,r:70,dur:5,ch}:{k:'guard',ch:ch+2};
 if(has('stun')||has('para')||s.delay)return{k:'stun',m:+(m*.75).toFixed(2),dur:+(1.2+(s.delay?.6:0)).toFixed(1),ch};
 if(back&&has('spd'))return{k:'slow',m:.4,r:64,dur:5,ch};
 if(s.t==='all')return Object.assign({k:'nova',m:+(m*.85).toFixed(2),r:back?56:46,ch},back?{at:'foe'}:{});
 if(has('poison')||has('def')||has('res')||has('weak'))return{k:'curse',m:+(m*.65).toFixed(2),dur:6,ch};
 if(back&&(s.hits||1)>1)return{k:'chain',m:+(m*.7).toFixed(2),cnt:Math.min(5,(s.hits||1)+1),ch};
 return{k:'strike',m,ch};}
/* そのキャラの 5 つ：[{k, how, lv, on（覚えた）}]。how：lv＝レベル／board＝星盤 */
function skills(id){let L=[];try{L=RSD.LEARN[id]||[];}catch(e){}const h=typeof G!=='undefined'&&G&&G.h&&G.h[id];
 return L.map(([k,how,lv])=>({k,how,lv,on:!!h&&(how==='lv'?h.lv>=lv:(h.board||[]).includes('2,-2'))}));}
/* 戦闘で使う技（覚えていなければ既定） */
function skSel(id){try{const h=G.h[id],k=h&&h.tdsk;if(k&&skills(id).some(x=>x.k===k&&x.on))return k;}catch(e){}return HERO[id].sk;}
/* TD の技の説明（詳しい窓に出す） */
function skTxt(sk){const m=x=>`攻撃×${x}`;switch(sk.k){
 case'strike':return`近くの敵 1 体に ${m(sk.m)}${sk.kb?'・はじき返す':''}`;case'stun':return`敵 1 体に ${m(sk.m)}・${sk.dur} 秒止める`;
 case'nova':return`${sk.at==='foe'?'狙った敵の':'自分の'}周り（半径 ${sk.r}）に ${m(sk.m)}`;case'chain':return`最大 ${sk.cnt} 体に ${m(sk.m)}`;
 case'curse':return`狙った敵の周りに ${m(sk.m)}・防御 −40%（${sk.dur} 秒）`;case'slow':return`狙った場所（半径 ${sk.r}）の敵を ${Math.round(sk.m*100)}% 遅く（${sk.dur} 秒）`;
 case'heal':return`周り（半径 ${sk.r}）の仲間の HP を ${Math.round(sk.m*100)}% 回復`;case'guard':return'止めている間、HP を 25% 回復・止める数 +2（6 秒）';}return'';}
/* ---------- アビリティ（1 人 3 つ。本編の AB）を TD の能力へ読み替える ----------
 td(e)：TD で効く効果なら {k, v, txt}、効かないなら null（画面では灰色）。合計は abSum(id) */
function abTd(e,id){const d=HERO[id],el=d&&d.el,c=e.c,v=e.v;let mag=false;try{mag=RSD.WPN[RSD.HERO[id].w].mag===1||d.role==='spell';}catch(x){}
 const free=!c||c==='any'||(c==='phys'&&!mag)||(c==='mag'&&mag)||(typeof c==='string'&&c.startsWith('el:')&&c.slice(3).split('|').includes(el));
 if(e.t==='dmg'&&free&&v>0)return{k:'atk',v,txt:`攻撃 +${v}%`};
 if(e.t==='stat'&&(e.k==='atk'||e.k==='mag')&&(e.k==='mag')===mag)return{k:'atk',v,txt:`攻撃 +${v}%`};
 if(e.t==='stat'&&e.k==='mhp')return{k:'hp',v,txt:`最大 HP +${v}%`};
 if(e.t==='stat'&&e.k==='def')return{k:'def',v,txt:`防御 +${v}%`};
 if(e.t==='cut'&&(!c||(typeof c==='string'&&c.startsWith('el:')))&&v>0)return{k:'cut',v:c?v*.5:v,txt:`受けるダメージ −${c?Math.round(v*.5):v}%`};
 if(e.t==='crit'&&!c)return{k:'crit',v,txt:`会心 +${v}%`};
 if(e.t==='critd')return{k:'critd',v,txt:`会心のダメージ +${v}%`};
 if(e.t==='regen'&&(!e.on||e.on==='self'))return{k:'regen',v,txt:`3 秒ごとに HP を ${v}% 回復`};
 if(e.t==='drain'&&!c)return{k:'drain',v,txt:`与えたダメージの ${v}% を回復`};
 if(e.t==='pierce')return{k:'pierce',v,txt:`敵の防御を ${v}% 無視`};
 if(e.t==='fu'&&e.p)return{k:'fu',v:{p:e.p,pow:e.pow||1,el:e.el,sk:c==='skill'},txt:`${c==='skill'?'技のあと':'攻撃のあと'} ${Math.round(e.p*100)}% で追撃（威力 ${e.pow||1}）`};
 if(e.t==='allydmg'&&!c)return{k:'tatk',v,txt:`置いている間、仲間全員の攻撃 +${v}%`};
 if(e.t==='allycut')return{k:'tcut',v,txt:`置いている間、仲間全員の受けるダメージ −${v}%`};
 if((e.t==='start'||e.t==='tstart')&&e.on==='allies'&&e.k==='atk')return{k:'tatk',v:v/2,txt:`置いている間、仲間全員の攻撃 +${v/2}%`};
 return null;}
function abSum(id){const o={atk:0,hp:0,def:0,cut:0,crit:0,critd:0,regen:0,drain:0,pierce:0,tatk:0,tcut:0,fu:[]};
 try{for(const e of RSC.abEffects(id)){const t=abTd(e,id);if(!t)continue;if(t.k==='fu')o.fu.push(t.v);else o[t.k]+=t.v;}}catch(e){}return o;}
/* 仲間：HB（RPG 版の能力）と Lv から TD の能力を作る。杖（術の武器）は知力が主 */
/* 育成の反映（ver0.52）：o＝real(id) の結果。gear＝装備ありとなしの本編の能力の比（攻撃・HP・防御・術防）、mas＝技の練達の段階（0〜3）、aw＝星臨の位階（1〜3）。
 計測（tools/td_sim.js）は o なし＝装備なし・練達 0 の基準で回す */
function hero(id,lv=1,o){const h=HB[id],d=HERO[id],R=ROLE[d.role];if(!h||!d)return null;
 let mag=false;try{mag=RSD.WPN[RSD.HERO[id].w].mag===1;}catch(e){}
 const prim=mag?h.mag:h.atk,k=lvK(lv),gk=(o&&o.gear)||{},q=x=>Math.max(.8,Math.min(3,x||1)),mas=Math.min(3,(o&&o.mas)||0),aw=Math.max(1,Math.min(3,(o&&o.aw)||1));
 const sid=(o&&o.sk)||d.sk,base=sid===d.sk?d:Object.assign({haste:d.haste,thief:d.thief},mapSk(sid,d.role)),ab=(o&&o.ab)||{};
 const sk=Object.assign({id:sid,n:skName(sid)},base,{mas});if(sk.m&&sk.k!=='heal'&&sk.k!=='slow')sk.m=+(sk.m*(1+.15*mas)).toFixed(2);if(sk.k==='heal')sk.m=+(sk.m*(1+.1*mas)).toFixed(2);sk.ch=+(base.ch*(1-.08*mas)).toFixed(1);
 const ult=Object.assign({n:ouName(id),aw:awName(id),k:'unova',m:7,r:92},ULT[id]||{},{lv:aw});if(ult.m)ult.m=+(ult.m*(1+.25*(aw-1))).toFixed(2);
 return{id,name:h.name,role:d.role,line:R.line,mv:R.mv,chase:R.chase||0,off:R.off||0,el:d.el,dmgK:mag||d.role==='spell'?'mag':'phys',
  hp:Math.round((200+h.mhp*2.2)*k*q(gk.hp)*(1+(ab.hp||0)/100)),atk:Math.round((20+prim*1.6)*k*(d.atkK||1)*q(gk.atk)*(1+(ab.atk||0)/100)),def:Math.round(h.def*1.5*k*q(gk.def)*(1+(ab.def||0)/100)),res:Math.round(h.res*1.5*k*q(gk.res)),
  cut:Math.min(.5,(ab.cut||0)/100),crit:(ab.crit||0)/100,critd:(ab.critd||0)/100,regen:(ab.regen||0)/100,drain:(ab.drain||0)/100,pierce:Math.min(.6,(ab.pierce||0)/100),tatk:(ab.tatk||0)/100,tcut:(ab.tcut||0)/100,fu:ab.fu||[],
  iv:+((d.iv||R.iv)*(1-(h.spd-10)*.015)).toFixed(2),rng:d.rng||R.rng,blk:d.blk!=null?d.blk:R.blk,cost:d.cost||R.cost,splash:R.splash||0,
  lt:d.lt||0,sk,ult,redeploy:Math.round(22+(14-Math.min(14,h.spd))*1.5),lv};}
/* 本編のセーブ（G）から、その仲間の育成を読む：装備の比・練達の段階・星臨の位階 */
function real(id){const o={gear:null,mas:0,aw:1,sk:HERO[id].sk,ab:null};try{const h=G.h[id];if(!h)return o;o.aw=h.awLv||1;o.sk=skSel(id);o.ab=abSum(id);try{o.mas=RSM.lvOf(id,o.sk)||0;}catch(e){}
 if(h.eq&&typeof stats==='function'){let mag=false;try{mag=RSD.WPN[RSD.HERO[id].w].mag===1;}catch(e){}const P=mag?'mag':'atk',s1=stats(id),eq=h.eq;
  h.eq={w:null,main:null,sub:null,acc1:null,acc2:null};let s0;try{s0=stats(id);}finally{h.eq=eq;}
  o.gear={atk:s1[P]/Math.max(1,s0[P]),hp:s1.mhp/Math.max(1,s0.mhp),def:s1.def/Math.max(1,s0.def),res:s1.res/Math.max(1,s0.res)};}}catch(e){console.error(e);}return o;}
/* 敵：ED（RPG 版）とステージの Lv から。移動 = 14 + 素早さ × 2.4 px/秒 */
function foe(kind,lv=1){const e=ED[kind];if(!e)return null;const hk=1+.05*(Math.max(1,lv)-1),ak=1+.04*(Math.max(1,lv)-1);
 const boss=!!e.boss||kind==='ernaE'||kind==='valkE',bh=boss?1:hk,ba=boss?1:ak,tr=(TRAIT[kind]||[]).slice();
 return{kind,name:e.name,spr:e.spr||SPRALT[kind]||kind,boss,rank:e.rank||(boss?'big':''),hp:Math.round(e.mhp*2.3*bh*(boss?1.6:1)),atk:Math.round((e.atk||30)*(boss?.9:1.15)*ba),
  def:e.def||0,res:e.res||0,spd:+(14+(e.spd||8)*2.4).toFixed(1)*(boss?.7:1),weak:(e.weak||[]).slice(0,2),resist:(e.resist||[]).slice(0,1),
  iv:boss?1:1.2,leak:boss?3:1,cost:boss?10:1,star:boss?5:1,tr,ai:boss&&e.ai?{every:Math.max(6,(e.ai.every||4)*3),summon:e.ai.summon||null,n:2}:null};}

/* ---------- ステージ（中身は js/td/stages.js） ---------- */
const STAGE={},CH=[],ORDER=[];
/* 報酬：本編の経験値・ゴールドの表（ED.xp・gold）を、そのステージに出る敵の数で合計。初回は経験値 ×1.5・ゴールド ×2、
 クリア済みの周回は ×0.5（少なめ）。星 3 を初めて取ったとき（prev＝前の星の数が 3 未満）：錬磨石（ボスのステージ 5・ほか 3）とゴールド +50%。
 天への塔（S.inf）は到達 WAVE（stars に渡す）で：経験値・ゴールドは WAVE の 2 乗で増え、5 WAVE ごとに錬磨石 1 */
const STONE='renma';
function reward(id,stars,first,prev){const S=STAGE[id];
 if(S.inf){const w=Math.max(0,stars|0);return{xp:Math.round(60*w+12*w*w),gold:Math.round(20*w+5*w*w),stone:Math.floor(w/5),s3:false,rep:false};}
 let xp=0,g=0;for(const w of S.waves)for(const[,k,n]of w.e){const e=ED[k];if(!e)continue;xp+=(e.xp||10)*n;g+=(e.gold||5)*n;}
 const k=.6+.2*stars,rep=!first,s3=stars>=3&&(prev||0)<3,rk=rep?.5:1;
 return{xp:Math.round(xp*k*(first?1.5:rk)),gold:Math.round(g*.5*k*(first?2:rk)*(s3?1.5:1)),stone:s3?(S.boss?5:3):0,s3,rep};}
/* 既定の手札（8 枚）：仲間の加入順から */
function deckOf(){const L=(typeof G!=='undefined'&&G&&G.members?G.members:Object.keys(HERO)).filter(id=>HERO[id]);
 const saved=typeof G!=='undefined'&&G&&G.td&&G.td.deck;if(saved){const d=saved.filter(id=>L.includes(id));if(d.length)return d.slice(0,8);}
 const pri=['rio','gald','mire','celes','noah','erna','shion','hakua','balza','crow','jin','valk'];
 return pri.filter(id=>L.includes(id)).slice(0,8);}
return{K,ROLE,HERO,ULT,TRAIT,TRN,hero,real,foe,STAGE,CH,ORDER,deckOf,skName,reward,STONE,skills,skSel,mapSk,skTxt,abTd,abSum,ouName,awName};})();
if(typeof module!=='undefined')module.exports=TDD;
