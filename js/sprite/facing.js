/* ===== ver0.29 キャラクターの向き（FACING）：向きを決める唯一の窓口 =====
 ・素材（データ）の向き：SPX_DATA[id].face（'L'|'R'）。全ポーズが同じ向きで保存されている
   （原画で逆を向いていたポーズは tools/spx_normalize.py がデータ側で反転済み）
 ・表示の既定の向き：プレイアブルキャラ＝左（敵の側）、敵＝右
 ・敵の原画（spx-data-enemy.js）は、正面向きのものも含めて全部 face='R'（原画のまま＝右向き）。ver0.36 の決まり
 ・味方の原画の向き（ver0.37 の定義）：提供原画の待機・星臨の向き（assets_src/originals/celes_v2.jpg が基準）を「左向き」とする。
   全プレイアブルキャラ（通常・星臨）の既定。tools/build_spx_heroes.py は反転せずに取り込む
 ・図鑑で変えた向き：G.zdir[キー]＝'L'|'R'（既定と同じなら保存しない）
 戦闘・待機・図鑑・編成・一覧の絵のすべてがここを通るので、どのモーションでも向きがそろう。
 鏡写しにするかどうかは mirror(素材の向き, 表示したい向き) の 1 行で決まる。 */
const FACING=(()=>{
const L='L',R='R';
const has=x=>(typeof ED!=='undefined'&&!!ED[x])||(typeof HB!=='undefined'&&!!HB[x]);
/* 描画用のキー（'rio_aw' 'vo_slime' 'tr_rio2' 'slimek' 'rio|…'）→ 向きを保存するキー */
/* ver0.32：見た目のキー（ED[k].spr。v31 の敵の 'tr_goldwolf4' など）→ 敵の id。戦闘は見た目のキーで描くので、
   図鑑で敵の id に保存した向きが戦闘でも効くように引き直す */
let SPRA=null;
function sprAlias(k){if(!SPRA){SPRA={};if(typeof ED!=='undefined')for(const e in ED){const sp=ED[e]&&ED[e].spr;if(sp&&!SPRA[sp])SPRA[sp]=e;}}return SPRA[k]||null;}
function key(pk){let k=String(pk||'').split('|')[0];const m=/^[A-Za-z0-9_]+/.exec(k);k=(m?m[0]:k).replace(/_aw$/,'');
 if(/k$/.test(k)&&!has(k)&&has(k.slice(0,-1)))k=k.slice(0,-1);
 if(!has(k)){const a=sprAlias(k)||sprAlias(k.replace(/^vo_/,''));if(a)k=a;}return k;}
function isFoe(k){k=key(k).replace(/^vo_/,'');return typeof ED!=='undefined'&&!!ED[k]&&!(typeof HB!=='undefined'&&HB[k]);}
/* 既定の向き。side（0＝味方の列／1＝敵の列）が分かっていればそれを優先する */
function base(k,side){if(side===0)return L;if(side===1)return R;return isFoe(k)?R:L;}
/* ver0.36：敵の原画の向きを「右向き」に統一した（騎士 2 種はデータの向きが逆だった）。それ以前に図鑑で保存した敵の向きは、
   誤った向きを直すためのものだったので一度だけ消す（味方の向きはそのまま） */
function fix36(d){if(G.zdir36)return;G.zdir36=1;for(const k of Object.keys(d))if(isFoe(k))delete d[k];}
/* ver0.37：味方の原画の向きの定義が変わった（以前は反転して取り込んでいた）。それ以前に図鑑で保存した味方の向きは一度だけ消す */
function fix37(d){if(G.zdir37)return;G.zdir37=1;for(const k of Object.keys(d))if(!isFoe(k))delete d[k];}
function saved(k){const d=typeof G!=='undefined'&&G&&G.zdir;if(!d)return null;fix36(d);fix37(d);k=key(k);const v=d[k]||d[k.replace(/^vo_/,'')];return v===L||v===R?v:null;}
function of(k,side){return saved(k)||base(k,side);}
const isRight=(k,side)=>of(k,side)===R;
function set(k,dir,side){k=key(k);G.zdir=G.zdir||{};if(dir===base(k,side))delete G.zdir[k];else G.zdir[k]=dir;try{save();}catch(e){}LS.forEach(f=>{try{f(k);}catch(e){}});}
function toggle(k,side){const nx=of(k,side)===L?R:L;set(k,nx,side);return nx;}
const mirror=(artFace,want)=>(artFace||L)!==want;
const LS=[];
return{L,R,key,isFoe,base,saved,of,isRight,set,toggle,mirror,onChange:f=>LS.push(f),resetAlias:()=>{SPRA=null;}};})();
