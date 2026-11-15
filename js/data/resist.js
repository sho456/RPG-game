/* ===== 属性耐性（ELR：防具の耐性値・キャラの合計・被ダメージの倍率の正本。新規） ===== */
/* 属性 8 種（斬・打・突・熱・冷・雷・陽・陰）。防具（主防具・副防具）に付く整数値。装飾品は基本 0（レジェンドだけ全属性に少し）。武器は 0。
   値＝ (2＋装備Lv×0.2) × (1＋レア度×0.15) × 防具の型の係数（下の PROF）。強化値 +1 ごとに +10%（itemBase と同じ）。
   型は装備の名前で決める：鎧・盾・兜＝重装（物理に強く、熱・雷に弱い）／外套・額当て・冠＝軽装（ばらつき小）／ローブ・護符＝術の属性に強く物理に弱い。
   it.elres に生成時の値（強化前）を保存し、古いセーブは migrate で補う。キャラの耐性＝装備の合計（ELR.sum）。
   被ダメージ：耐性 1 あたり 1% 軽減、弱点（マイナス）は 1% 増加。倍率は 0.3〜1.5 に収める（js/rs/battle.js の calc で ELR.mul を掛ける）。 */
const ELR=(()=>{
const ELS=['斬','打','突','熱','冷','雷','陽','陰'];
/*             斬    打    突    熱    冷    雷    陽    陰 */
const PROF={
 heavy: [1.2, 1.2, 1.2,-.6,  .2, -.8,  0,   0 ],
 shield:[1.1, 1.1, 1.0,-.3,  .3, -.5,  0,   0 ],
 helm:  [1.0, 1.0, .9, -.4,  .1, -.6,  .1,  .1],
 light: [ .5,  .3,  .5,  .2,  .2,  .2,  .3,  .3],
 band:  [ .3,  .2,  .3,  .3,  .3,  .3,  .4,  .4],
 robe:  [-.6, -.6, -.6, 1.0, 1.0,  .9,  .8,  .8],
 charm: [-.2, -.2, -.2,  .7,  .7,  .7, 1.0, 1.0]};
const LEGP=[.6,.6,.6,.6,.6,.6,.6,.6];
function kind(it){const n=it.name||'';
 if(it.slot==='main')return/外套/.test(n)?'light':/ローブ/.test(n)?'robe':'heavy';
 if(it.slot==='sub')return/護符/.test(n)?'charm':/兜/.test(n)?'helm':/額当て|冠/.test(n)?'band':'shield';
 return null;}
/* 装備 1 つの耐性（強化前）。計算だけ。保存は stamp */
function calcOf(it){const o={};if(!it||it.slot==='w')return o;
 let p=null;const k=kind(it);if(k)p=PROF[k];else if(it.slot==='acc'&&it.leg)p=LEGP;else if(it.slot==='acc'&&it.set==='royal')p=PROF.band;
 if(!p)return o;const u=(2+(it.ilv||1)*.2)*(1+(it.rar||0)*.15)*(it.leg&&k?1.15:1);
 ELS.forEach((e,i)=>{const v=Math.round(u*p[i]);if(v)o[e]=v;});return o;}
function stamp(it){if(it&&it.slot!=='w')it.elres=calcOf(it);return it;}
/* 強化値を含めた値（強化値は読み取りのたびに反映） */
function of(it){if(!it||!it.elres&&(stamp(it),!it.elres))return{};const o={},m=1+.1*(it.plus||0);for(const e of ELS){const v=Math.round((it.elres[e]||0)*m);if(v)o[e]=v;}return o;}
/* キャラの耐性＝装備の合計 */
function sum(id){const o={};ELS.forEach(e=>o[e]=0);try{const eq=(G.h[id]||{}).eq||{};for(const s in eq){const it=eq[s]&&findItem(eq[s]);if(!it)continue;const r=of(it);for(const e of ELS)o[e]+=r[e]||0;}}catch(e){}return o;}
/* 被ダメージの倍率（属性が無い攻撃は 1） */
function mul(id,el){if(!el||!ELS.includes(el))return 1;return Math.min(1.5,Math.max(.3,1-sum(id)[el]/100));}
const hx=e=>`<i class="elh e${ELS.indexOf(e)}"><b>${e}</b></i>`;
/* キャラ詳細の能力タブに出す小さな耐性欄 */
function row(id){const s=sum(id);return`<div class="elr"><div class="elr-t">属性耐性</div><div class="elr-g">${ELS.map(e=>{const v=s[e];return`<span>${hx(e)}<b class="${v>0?'p':v<0?'n':'z'}">${v>0?'+'+v:v}</b></span>`;}).join('')}</div></div>`;}
/* 生成・読み込みに付ける */
{const _g=genItem;genItem=function(){return stamp(_g.apply(this,arguments));};}
try{const _r=royalItem;royalItem=function(){return stamp(_r.apply(this,arguments));};}catch(e){}
{const _m=migrate;migrate=function(g){const r=_m(g);try{(G.inv||[]).concat(G.stock||[]).forEach(it=>{if(it.slot!=='w'&&!it.elres)stamp(it);});}catch(e){console.error(e);}return r;};}
return{ELS,PROF,kind,calcOf,stamp,of,sum,mul,hx,row};})();
