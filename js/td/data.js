/* ===== TD のデータ（仲間・敵の変換・数値の定数・報酬。ステージは js/td/stages.js）。設計は docs/TD-DESIGN.md =====
 RPG 版のデータ（HB・ED・AW・SK・RSD.HERO）を読むだけで、書き換えない。数値の尺度は TD 用に引き直す（9999 万・Lv60 以降のインフレは使わない）。
 正本：仲間＝HERO、敵の型＝TRAIT、ステージ＝STAGE。変換＝hero(id,lv)・foe(kind,lv) */
'use strict';
const TDD=(()=>{
/* ---------- 定数 ---------- */
const K={FH:420,STEP:1/30,LIVES:7,COST0:10,COST_EVERY:.9,STAR_MAX:10,DARK:.6/*光の外の攻撃の倍率*/,GAP:8/*WAVE の間の秒*/};
/* 役割：台座の種類（f＝道の上で止める／b＝段の間）・射程・攻撃間隔・止める数・コスト・攻撃の形 */
const ROLE={
 guard:{n:'守る',pad:'f',rng:42,iv:1.3,blk:3,cost:16,col:'#7fa6d9'},
 blade:{n:'斬る',pad:'f',rng:40,iv:1.0,blk:1,cost:10,col:'#e0a050'},
 shot: {n:'射る',pad:'b',rng:150,iv:1.1,blk:0,cost:12,col:'#9fd36a'},
 spell:{n:'術',  pad:'b',rng:112,iv:1.6,blk:0,cost:14,col:'#d070d0',splash:32},
 aid:  {n:'支える',pad:'b',rng:108,iv:1.5,blk:0,cost:12,col:'#80d8c8'}};
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
/* 星臨（戦闘中 1 回）：既定は大きな範囲攻撃。ノア＝全員の回復と灯火 +1、セレス＝刻を止める（全体を遅く） */
const ULT={noah:{k:'uheal'},celes:{k:'utime',m:4,dur:8}};
/* 敵の型：キー → 特性。void＝虚蝕を撒く（生きている間、灯の光を毎秒削る）、fly＝止められない、armor＝物理に強い、ghost＝術に強い */
const TRAIT={slime:['void'],moss:['void'],cursedslime:['void'],bookghost:['ghost'],shade:['ghost'],darkknight:['armor'],m_knight:['armor'],boss2:['armor']};
const TRN={void:'虚蝕を撒く（光を削る）',ghost:'霊体（物理が効きにくく、術がよく効く）',armor:'重装（物理に強い。打で割れる）',fly:'飛行'};

/* ---------- 変換 ---------- */
const lvK=lv=>1+.05*(Math.max(1,lv)-1);
const skName=k=>{try{return(SK[k]&&(SK[k].n||SK[k].name))||k;}catch(e){return k;}};
const awName=id=>{try{return(AW[id]&&AW[id].name)||'星臨';}catch(e){return'星臨';}};
/* 仲間：HB（RPG 版の能力）と Lv から TD の能力を作る。杖（術の武器）は知力が主 */
/* 育成の反映（ver0.52）：o＝real(id) の結果。gear＝装備ありとなしの本編の能力の比（攻撃・HP・防御・術防）、mas＝技の練達の段階（0〜3）、aw＝星臨の位階（1〜3）。
 計測（tools/td_sim.js）は o なし＝装備なし・練達 0 の基準で回す */
function hero(id,lv=1,o){const h=HB[id],d=HERO[id],R=ROLE[d.role];if(!h||!d)return null;
 let mag=false;try{mag=RSD.WPN[RSD.HERO[id].w].mag===1;}catch(e){}
 const prim=mag?h.mag:h.atk,k=lvK(lv),gk=(o&&o.gear)||{},q=x=>Math.max(.8,Math.min(3,x||1)),mas=Math.min(3,(o&&o.mas)||0),aw=Math.max(1,Math.min(3,(o&&o.aw)||1));
 const sk=Object.assign({id:d.sk,n:skName(d.sk)},d,{mas});if(sk.m&&sk.k!=='heal'&&sk.k!=='slow')sk.m=+(sk.m*(1+.15*mas)).toFixed(2);if(sk.k==='heal')sk.m=+(sk.m*(1+.1*mas)).toFixed(2);sk.ch=+(d.ch*(1-.08*mas)).toFixed(1);
 const ult=Object.assign({n:awName(id),k:'unova',m:7,r:92},ULT[id]||{},{aw});if(ult.m)ult.m=+(ult.m*(1+.25*(aw-1))).toFixed(2);
 return{id,name:h.name,role:d.role,pad:R.pad,el:d.el,dmgK:mag||d.role==='spell'?'mag':'phys',
  hp:Math.round((200+h.mhp*2.2)*k*q(gk.hp)),atk:Math.round((20+prim*1.6)*k*(d.atkK||1)*q(gk.atk)),def:Math.round(h.def*1.5*k*q(gk.def)),res:Math.round(h.res*1.5*k*q(gk.res)),
  iv:+((d.iv||R.iv)*(1-(h.spd-10)*.015)).toFixed(2),rng:d.rng||R.rng,blk:d.blk!=null?d.blk:R.blk,cost:d.cost||R.cost,splash:R.splash||0,
  lt:d.lt||0,sk,ult,redeploy:Math.round(22+(14-Math.min(14,h.spd))*1.5),lv};}
/* 本編のセーブ（G）から、その仲間の育成を読む：装備の比・練達の段階・星臨の位階 */
function real(id){const o={gear:null,mas:0,aw:1};try{const h=G.h[id];if(!h)return o;o.aw=h.awLv||1;try{o.mas=RSM.lvOf(id,HERO[id].sk)||0;}catch(e){}
 if(h.eq&&typeof stats==='function'){let mag=false;try{mag=RSD.WPN[RSD.HERO[id].w].mag===1;}catch(e){}const P=mag?'mag':'atk',s1=stats(id),eq=h.eq;
  h.eq={w:null,main:null,sub:null,acc1:null,acc2:null};let s0;try{s0=stats(id);}finally{h.eq=eq;}
  o.gear={atk:s1[P]/Math.max(1,s0[P]),hp:s1.mhp/Math.max(1,s0.mhp),def:s1.def/Math.max(1,s0.def),res:s1.res/Math.max(1,s0.res)};}}catch(e){console.error(e);}return o;}
/* 敵：ED（RPG 版）とステージの Lv から。移動 = 14 + 素早さ × 2.4 px/秒 */
function foe(kind,lv=1){const e=ED[kind];if(!e)return null;const hk=1+.05*(Math.max(1,lv)-1),ak=1+.04*(Math.max(1,lv)-1);
 const boss=!!e.boss||kind==='ernaE'||kind==='valkE',bh=boss?1:hk,ba=boss?1:ak,tr=(TRAIT[kind]||[]).slice();
 return{kind,name:e.name,spr:e.spr||kind,boss,rank:e.rank||(boss?'big':''),hp:Math.round(e.mhp*2.3*bh*(boss?1.6:1)),atk:Math.round((e.atk||30)*(boss?.9:1.15)*ba),
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
return{K,ROLE,HERO,ULT,TRAIT,TRN,hero,real,foe,STAGE,CH,ORDER,deckOf,skName,reward,STONE};})();
if(typeof module!=='undefined')module.exports=TDD;
