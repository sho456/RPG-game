/* ===== ver0.29 キャラクターの向き（FACING）：向きを決める唯一の窓口 =====
 ・素材（データ）の向き：SPX_DATA[id].face（'L'|'R'）。全ポーズが同じ向きで保存されている
   （原画で逆を向いていたポーズは tools/spx_normalize.py がデータ側で反転済み）
 ・表示の既定の向き：プレイアブルキャラ＝左（敵の側）、敵＝右
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
function saved(k){const d=typeof G!=='undefined'&&G&&G.zdir;if(!d)return null;k=key(k);const v=d[k]||d[k.replace(/^vo_/,'')];return v===L||v===R?v:null;}
function of(k,side){return saved(k)||base(k,side);}
const isRight=(k,side)=>of(k,side)===R;
function set(k,dir,side){k=key(k);G.zdir=G.zdir||{};if(dir===base(k,side))delete G.zdir[k];else G.zdir[k]=dir;try{save();}catch(e){}LS.forEach(f=>{try{f(k);}catch(e){}});}
function toggle(k,side){const nx=of(k,side)===L?R:L;set(k,nx,side);return nx;}
const mirror=(artFace,want)=>(artFace||L)!==want;
const LS=[];
return{L,R,key,isFoe,base,saved,of,isRight,set,toggle,mirror,onChange:f=>LS.push(f),resetAlias:()=>{SPRA=null;}};})();
