/* ===== TD のデータ（仲間・敵の変換・ステージ・数値の定数）。設計は docs/TD-DESIGN.md =====
 RPG 版のデータ（HB・ED・AW・SK・RSD.HERO）を読むだけで、書き換えない。数値の尺度は TD 用に引き直す（9999 万・Lv60 以降のインフレは使わない）。
 正本：仲間＝HERO、敵の型＝TRAIT、ステージ＝STAGE。変換＝hero(id,lv)・foe(kind,lv) */
'use strict';
const TDD=(()=>{
/* ---------- 定数 ---------- */
const K={FW:360,FH:520,STEP:1/30,LIVES:7,COST0:10,COST_EVERY:.9,STAR_MAX:10,DARK:.6/*光の外の攻撃の倍率*/,GAP:8/*WAVE の間の秒*/};
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
const TRAIT={slime:['void'],moss:['void'],cursedslime:['void'],bookghost:['ghost'],shade:['ghost']};

/* ---------- 変換 ---------- */
const lvK=lv=>1+.05*(Math.max(1,lv)-1);
const skName=k=>{try{return(SK[k]&&(SK[k].n||SK[k].name))||k;}catch(e){return k;}};
const awName=id=>{try{return(AW[id]&&AW[id].name)||'星臨';}catch(e){return'星臨';}};
/* 仲間：HB（RPG 版の能力）と Lv から TD の能力を作る。杖（術の武器）は知力が主 */
function hero(id,lv=1){const h=HB[id],d=HERO[id],R=ROLE[d.role];if(!h||!d)return null;
 let mag=false;try{mag=RSD.WPN[RSD.HERO[id].w].mag===1;}catch(e){}
 const prim=mag?h.mag:h.atk,k=lvK(lv);
 return{id,name:h.name,role:d.role,pad:R.pad,el:d.el,dmgK:mag||d.role==='spell'?'mag':'phys',
  hp:Math.round((200+h.mhp*2.2)*k),atk:Math.round((20+prim*1.6)*k*(d.atkK||1)),def:Math.round(h.def*1.5*k),res:Math.round(h.res*1.5*k),
  iv:+((d.iv||R.iv)*(1-(h.spd-10)*.015)).toFixed(2),rng:d.rng||R.rng,blk:d.blk!=null?d.blk:R.blk,cost:d.cost||R.cost,splash:R.splash||0,
  lt:d.lt||0,sk:Object.assign({id:d.sk,n:skName(d.sk)},d),ult:Object.assign({n:awName(id),k:'unova',m:7,r:92},ULT[id]||{}),
  redeploy:Math.round(22+(14-Math.min(14,h.spd))*1.5),lv};}
/* 敵：ED（RPG 版）とステージの Lv から。移動 = 14 + 素早さ × 2.4 px/秒 */
function foe(kind,lv=1){const e=ED[kind];if(!e)return null;const hk=1+.1*(Math.max(1,lv)-1),ak=1+.08*(Math.max(1,lv)-1);
 const boss=!!e.boss,tr=(TRAIT[kind]||[]).slice();
 return{kind,name:e.name,spr:e.spr||kind,boss,rank:e.rank||(boss?'big':''),hp:Math.round(e.mhp*2.3*hk*(boss?3:1)),atk:Math.round((e.atk||30)*1.15*ak),
  def:e.def||0,res:e.res||0,spd:+(14+(e.spd||8)*2.4).toFixed(1)*(boss?.7:1),weak:(e.weak||[]).slice(0,2),resist:(e.resist||[]).slice(0,1),
  iv:boss?1:1.2,leak:boss?3:1,cost:boss?10:1,star:boss?5:1,tr,ai:boss&&e.ai?{every:Math.max(6,(e.ai.every||4)*3),summon:e.ai.summon||null,n:2}:null};}

/* ---------- ステージ ---------- */
/* 戦場 360×520。道は左上から入り、4 段で折り返して下の灯へ。台座：f＝道の上（始点からの距離 s）、b＝段の間 */
const MAP0={
 path:[[-24,64],[316,64],[316,176],[44,176],[44,288],[316,288],[316,400],[180,400],[180,456]],
 base:[180,478],light:{r:230},
 pads:[{id:'f1',k:'f',s:200},{id:'f2',k:'f',s:560},{id:'f3',k:'f',s:680},{id:'f4',k:'f',s:900},{id:'f5',k:'f',s:1040},{id:'f6',k:'f',s:1300},
  {id:'b1',k:'b',x:112,y:120},{id:'b2',k:'b',x:248,y:120},{id:'b3',k:'b',x:120,y:232},{id:'b4',k:'b',x:240,y:232},
  {id:'b5',k:'b',x:104,y:344},{id:'b6',k:'b',x:232,y:344},{id:'b7',k:'b',x:84,y:446},{id:'b8',k:'b',x:276,y:446}]};
/* waves の e：[出る秒, 敵のキー, 数, 間隔] */
const STAGE={
 td0_1:Object.assign({id:'td0_1',q:'q0_1',ch:'序章',name:'灰の街道',lv:1,cap:5,cost0:12,star:{time:190},
  waves:[{e:[[2,'slime',4,2.6]]},{e:[[1,'slime',3,2.2],[7,'wolf',2,2.4]]},{e:[[1,'wolf',4,1.8],[5,'slime',4,1.8]]}]},MAP0),
 td0_4:Object.assign({id:'td0_4',q:'q0_4',ch:'序章',name:'灰狼の頭目',lv:4,cap:5,cost0:10,star:{time:300},
  waves:[{e:[[2,'slime',6,1.6],[8,'wolf',3,1.2]]},{e:[[1,'wolf',6,1],[4,'slime',6,1.2]]},{e:[[1,'wolf',8,.8],[3,'slime',8,1],[9,'wolf',6,.8]]},{e:[[2,'m_wolf',1,1],[3,'slime',6,1.1],[7,'wolf',8,1]]}]},MAP0)};
const ORDER=['td0_1','td0_4'];
/* 既定の手札（8 枚）：仲間の加入順から */
function deckOf(){const L=(typeof G!=='undefined'&&G&&G.members?G.members:Object.keys(HERO)).filter(id=>HERO[id]);
 const pri=['rio','gald','mire','celes','noah','erna','shion','hakua','balza','crow','jin','valk'];
 return pri.filter(id=>L.includes(id)).slice(0,8);}
return{K,ROLE,HERO,ULT,TRAIT,hero,foe,STAGE,ORDER,deckOf,skName};})();
if(typeof module!=='undefined')module.exports=TDD;
