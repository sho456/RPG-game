/* ===== 戦闘の表示サイズ：敵の大きさを種類ごとにそろえる（ver0.40。正本） =====
 ・以前は素材ごとの横幅（spx.js の DEF.wid）と倍率で決まり、同じ「普通の敵」でも 1〜4 倍の差があった
 ・見た目の大きさ＝絵の面積の平方根（√(幅×高さ)）を、味方の基準（リオの立ち絵）× 種類の倍率 にそろえる
 ・ver0.49：ボス以外はすべて MOB 倍で同じ大きさ。ボスだけ CLS（絵の名前ごと。人型は HUM）× BOSS 倍
 ・この後に v23.js の capScale が、戦場の帯からはみ出さないよう縮める
 ・味方の背丈は js/sprite/spx.js（regRigs：全員 36）、並べ方と倍率は js/v38/battle-ui.js */
'use strict';
const BSIZE=(()=>{
/* 種類の倍率（味方の見た目の大きさ＝1） */
const CLS={spx_slime:1.25,spx_jelly:1.3,spx_shroom:1.3,
 spx_goldwolf:2.0,spx_shade:1.45,spx_icespirit:1.35,bookghost:1.45,spx_knight:1.4,spx_gknight:1.4,spx_banjin:1.5,spx_ninja:1.4,
 spx_golem:2.0,spx_drake:2.1,spx_fox:2.0,spx_boss9:2.2,spx_queen:1.6};
const HUM=1.05,DEF=1.5,BOSS=1.45,MOB=1.1;
const met=(name,A,sc)=>{const f=SPRX.frame(name,{},A.palKey,A.pal,true,sc);if(!f||!f.cv)return 0;const d=window.devicePixelRatio||1;return Math.sqrt(f.cv.width*f.cv.height)/d;};
let REF=0;const C={};
/* 基準：リオの絵を、味方の標準の倍率（ANIM の GS。js/v38/battle-ui.js の placeHeroes）で描いたときの大きさ */
function ref(){if(REF)return REF;const h={id:'rio',side:0,spr:'rio'},A=ANIM.setup(h);REF=A&&!A.none?met(A.name,A,1.2):0;return REF;}
/* 比例で測るときの基準：リオを倍率 3 で描いた大きさを、標準の倍率 1.2 に直したもの */
let REFL=0;function refL(){if(REFL)return REFL;const h={id:'rio',side:0,spr:'rio'},A=ANIM.setup(h);REFL=A&&!A.none?met(A.name,A,3)/3*1.2:0;return REFL;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* 敵 u の倍率（A.sc）。同じ絵・同じボス区分は 1 回だけ測る */
function enemy(u,A,boss){const sc0=A.sc,k=A.name+'|'+(boss?1:0)+'|'+sc0.toFixed(3);if(C[k])return C[k];
 const r=ref();if(!r)return sc0;
 /* ver0.49：ボス以外は種類を問わず同じ大きさ（MOB）にそろえる。
    小さい倍率では素材の最小のコマが返って測れないため、大きい倍率（3）のコマの大きさから比例で決める */
 if(!boss){const rl=refL(),m3=met(A.name,A,3);if(rl&&m3)return C[k]=clamp(rl*MOB/(m3/3),.3,4);}
 const cls=(A.rig&&A.rig.type==='hum'&&!CLS[A.name]?HUM:CLS[A.name]||DEF)*BOSS,want=r*cls;
 /* 絵は決まったサイズから選ばれる（拡大縮小しない）ので、測り直して 3 回まで寄せる */
 let sc=sc0;for(let i=0;i<3;i++){const m=met(A.name,A,sc);if(!m)break;const q=want/m;if(Math.abs(q-1)<.06)break;sc*=q;}
 return C[k]=sc;}
return{enemy,CLS,MOB,ref,reset:()=>{REF=0;REFL=0;for(const k in C)delete C[k];}};})();
