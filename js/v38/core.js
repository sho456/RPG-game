/* ===== ver0.38 土台：攻撃属性 8 種・武器種 8 種・セーブの移行・LP =====
 ・攻撃属性：斬・打・突・熱・冷・雷・陽・陰。旧来の 10 属性は 炎→熱・氷→冷・光→陽・闇→陰・風→斬・地→打 に統合した
   （ソースの属性名は書き換え済み。ここでは実行時に作られるデータ・古いセーブに残った名前を直す）
 ・武器種：剣・短剣・大剣・斧・体術・弓・杖・双剣（RSD.WPN）。武器種は「通常攻撃の属性」と「技の威力の能力配分」を決める
 ・LP：クエストの間は引き継ぎ、灯都に戻る（全回復）と最大値に戻る
 ・オーバードライブ・連携・共鳴技・ジョブは ver0.38 で廃止（関連する処理・画面・データは削除済み） */
'use strict';
const V38=(()=>{
const D=RSD;
const NORM={'炎':'熱','氷':'冷','光':'陽','闇':'陰','風':'斬','地':'打'};
const nel=e=>e==null?e:(NORM[e]||e);
const nList=a=>Array.isArray(a)?[...new Set(a.map(nel).filter(Boolean))]:a;
/* ---------- データの正規化 ---------- */
function normSkill(s,enemy){if(!s||typeof s!=='object')return;if(s.el!==undefined)s.el=nel(s.el);
 if(s.el==null&&(s.k==='phys'||s.k==='mag')&&enemy)s.el=s.k==='phys'?'打':'陰';
 if(Array.isArray(s.auto))s.auto=D.EL8.slice();
 for(const f of s.fx20||[])if(f.el)f.el=nel(f.el);}
function normAll(){
 try{for(const k in SK)normSkill(SK[k]);}catch(e){console.error(e);}
 try{for(const k in EA)normSkill(EA[k],true);}catch(e){console.error(e);}
 try{for(const k in ED){const d=ED[k];if(!d)continue;d.weak=nList(d.weak||[]);if(d.res)d.res=nList(d.res);if(d.el)d.el=nel(d.el);}}catch(e){console.error(e);}}
normAll();
/* 召喚・生成で後から作られる敵（試練の幻影・回廊など）も、戦闘の始めに直す */
{const _sb=startBattle;startBattle=function(list,opts){try{for(const e of list||[]){const d=ED[e.kind];if(d){d.weak=nList(d.weak||[]);}}}catch(x){}return _sb(list,opts);};}
{const _en=enemy;enemy=function(...a){const e=_en(...a);try{e.weak=nList(e.weak||[]);}catch(x){}return e;};}

/* ---------- 敵の技：LP を削る攻撃・属性の見直し ---------- */
const LPATK={curse:1,bell:1,voidslash:1,senju:1,tokiyomi:1,chrono:1};
for(const k in LPATK)if(EA[k]){EA[k].lp=LPATK[k];EA[k].d=(EA[k].d?EA[k].d+'／':'')+'命中した相手の LP を 1 削る';}
if(EA.spore)EA.spore.el='陰';if(EA.mirror)EA.mirror.el='打';

/* ---------- キャラ：得意属性・通常攻撃 ---------- */
elOf=id=>(D.HERO[id]&&D.HERO[id].el)||null;
const _ATK=ATK;
ATK=u=>{if(!u||u.side!==0)return _ATK(u);const W=D.WPN[u.wpn]||D.WPN['剣'];
 if(W.mag||MAG(u.id))return{n:'魔弾',el:nel(u.atkEl)||elOf(u.id)||'打',k:'mag',pow:.8,t:'one',basic:true};
 return{n:'攻撃',el:u.aw&&u.id==='rio'?'陽':(nel(u.atkEl)||W.el),k:'phys',pow:1,t:'one',basic:true};};

/* ---------- 属性の色（旧名の色をそのまま新しい名前へ） ---------- */
try{for(const[o,n]of Object.entries(NORM))if(ELC[o]&&!ELC[n])ELC[n]=ELC[o];}catch(e){}

/* ---------- セーブの移行 ---------- */
const NOUN_OLD=/(竜剣|魔導書|大鎌|砂時計|双剣|大剣|手甲|爪|短剣|剣|杖|弓|斧)$/;
function wNoun(who){const t=(D.HERO[who]||{}).w;return t==='体術'?'手甲':t;}
function migItem(it){if(!it)return;
 if(it.slot==='w'&&it.who&&!it.leg&&!it.uq&&typeof it.name==='string'){const n=wNoun(it.who);if(n)it.name=it.name.replace(NOUN_OLD,n);}
 if(it.uq&&typeof it.name==='string'&&UQ&&UQ[it.who])it.name=UQ[it.who][0];
 for(const o of it.ops||[])if(o.k==='atkEl')o.v=nel(o.v);}
{const _m=migrate;migrate=function(g){const r=_m(g);try{const G0=r||g;
  for(const it of G0.inv||[])migItem(it);for(const it of G0.stock||[])migItem(it);
  if(G0.known)for(const k in G0.known)G0.known[k]=nList(G0.known[k]);
  for(const id in G0.h){const h=G0.h[id];if(!h)continue;delete h.jobs;delete h.pass;h.job=null;}
  G0.v38=1;}catch(e){console.error(e);}return r;};}

/* ---------- LP：灯都で全回復 ---------- */
{const _h=healAll;healAll=function(...a){const r=_h(...a);try{for(const id of G.members)if(G.h[id])G.h[id].lp=null;}catch(e){}return r;};}

return{NORM,nel,nList,normAll,migItem};})();
