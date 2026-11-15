/* ===== 装備の能力影響（EQ7：装備が上げるのは基礎ステータスだけ。ver0.45 新規の正本） =====
 基礎ステータス＝最大HP・腕力・体力・器用さ・素早さ・知力・精神・魅力（8 つ）。
 1. 付加能力（ops）は基礎ステータスの加算だけ（str vit dex agi int wil cha hp）。会心率・弱点ダメ・開始時AG・BP回復力・ドロップ率・与ダメ・技の威力などは装備に付かない
    （それらはアビリティ・星盤・レジェンドの効果で扱う）。古いセーブの付加能力は読み込み時に近い基礎ステータスへ置き換える（OLD2）
 2. 装備の基本値（base：atk def mag res spd mhp）は内部の値のまま。画面では基礎ステータスの名前で出す
    （武器の攻撃＝持ち主の武器種の主能力、防御＝体力、魔力＝知力、精神＝精神、素早さ＝素早さ（×3 の目盛り）、最大HP）
 3. 能力値への反映：rs/core.js の stats の後に、付加能力の基礎ステータスを内部の値（攻撃・防御・魔力・精神・素早さ・最大HP）と 7 能力に足す
 表示：js/ui/equip-info.js（EQINFO.effects）・BN（短い名前） */
'use strict';
const EQ7=(()=>{
const K8=['hp','str','vit','dex','agi','int','wil','cha'];
const N8={hp:'最大HP',str:'腕力',vit:'体力',dex:'器用さ',agi:'素早さ',int:'知力',wil:'精神',cha:'魅力'};
/* 付加能力の定義（OPS に足す。値は装備Lvから決める＝ val） */
for(const k of K8)OPS[k]=[N8[k],'+',1,1];
Object.assign(W8,{str:1.1,vit:1,dex:.8,agi:2.2,int:.9,wil:.7,cha:.4,hp:.2});
Object.assign(BN,{atk:'腕力',def:'体力',mag:'知力',res:'精神',mhp:'HP',spd:'素早さ',str:'腕力',vit:'体力',dex:'器用さ',agi:'素早さ',int:'知力',wil:'精神',cha:'魅力',hp:'HP'});
/* 古い付加能力 → 基礎ステータス */
const OLD2={atkP:'str',defP:'vit',magP:'int',resP:'wil',mhpP:'hp',spd:'agi',crit:'dex',weakDmg:'dex',startAG:'agi',awDmg:'cha',spGain:'wil',drop:'cha',dmgP:'str',skDmg:'str',critDmg:'dex',dmgCut:'vit'};
const GK=ilv=>ilv<=60?1:Math.pow(1.035,ilv-60);
/* 値：装備Lv・レア度で決まる（q＝0.6〜1.0 のばらつき）。HP は 4 倍、素早さは 0.45 倍（7 能力の目盛りに合わせる） */
function val(it,k,q){const ilv=it.ilv||1;let v=(2+ilv*.34)*q*(1+(it.rar||0)*.08)*Math.sqrt(GK(ilv));if(k==='hp')v*=4;if(k==='agi')v*=.45;return Math.max(1,Math.round(v));}
/* 武器の「腕力」系は持ち主の主能力に（弓・短剣は器用さ） */
const mainOf=who=>{try{return RSC.pf(who).pk;}catch(e){return'str';}};
function conv(it,fresh){if(!it||!it.ops)return it;let ch=false;
 it.ops=it.ops.map(o=>{if(o.k==='atkEl')return o;if(K8.includes(o.k)){if(!fresh)return o;ch=true;return Object.assign({},o,{v:val(it,o.k,.6+.4*Math.random())});}const nk0=OLD2[o.k];if(!nk0){ch=true;return null;}
  let nk=nk0;if(nk==='str'&&it.who)nk=mainOf(it.who);if(nk==='str'&&it.who&&MAG(it.who))nk='int';
  ch=true;const r=fresh?.6+.4*Math.random():OPS[o.k]?Math.min(1,Math.max(.6,(o.v-OPS[o.k][2])/Math.max(.01,OPS[o.k][3]-OPS[o.k][2])*.4+.6)):.8;return Object.assign({},o,{k:nk,v:val(it,nk,r)});}).filter(Boolean);
 /* 同じ能力が 2 つ付いたら 1 つにまとめる */
 if(ch){const m=new Map();for(const o of it.ops){if(o.k!=='atkEl'&&m.has(o.k)){m.get(o.k).v+=o.v;continue;}m.set(o.k==='atkEl'?Symbol():o.k,o);}it.ops=[...m.values()];}
 return it;}
{const _g=genItem;genItem=function(){return conv(_g.apply(this,arguments),true);};}
{const _m=migrate;migrate=function(g){const r=_m(g);try{(G.inv||[]).concat(G.stock||[]).forEach(it=>conv(it));}catch(e){console.error(e);}return r;};}
/* 装備の合計（基礎ステータスの付加能力だけ） */
function sum(id){const o={};K8.forEach(k=>o[k]=0);try{const g=gear(id);for(const k of K8)o[k]=g[k]||0;}catch(e){}return o;}
{const _s=stats;stats=function(id){const o=_s(id);try{if(!HB[id]||!G.h[id]||!o.s7)return o;const a=sum(id),P=RSC.pf(id);let g={};try{g=gear(id);}catch(e){}
  o.atk=Math.max(1,Math.round(o.atk+(P.w.str||0)*a.str+(P.w.dex||0)*a.dex+(P.w.agi||0)*a.agi));
  o.def+=a.vit;o.mag+=a.int;o.res+=a.wil;o.mhp+=a.hp;o.spd=+(o.spd+a.agi/3).toFixed(2);
  const s7=o.s7;s7.str+=a.str;s7.dex+=a.dex;s7.cha+=a.cha;if(g.atk)s7[P.pk]+=Math.round(g.atk);
  s7.vit=o.def;s7.wil=o.res;s7.int=o.mag;s7.agi=Math.round(o.spd*3);
  o.healRecv=RSC.healRecv(s7);o.healAb=RSC.healAb(s7);}catch(e){console.error(e);}return o;};}
/* 画面用：装備 1 つの基礎ステータス（基本値＋付加能力）。{hp,str,…} */
function of(it){const o={};K8.forEach(k=>o[k]=0);if(!it)return o;const b=itemBase(it),who=it.who;
 if(b.atk)o[who?mainOf(who):'str']+=b.atk;if(b.def)o.vit+=b.def;if(b.mag)o.int+=b.mag;if(b.res)o.wil+=b.res;if(b.mhp)o.hp+=b.mhp;if(b.spd)o.agi+=Math.round(b.spd*3);
 for(const op of it.ops||[])if(K8.includes(op.k))o[op.k]+=op.v;return o;}
return{K8,N8,OLD2,conv,val,of,sum};})();
