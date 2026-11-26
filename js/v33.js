/* ===== ver0.33 不具合の修正・戦闘の仕組みの整理・狼と狐の原画 =====
 1. 敵の原画：狼の系統（灰狼・雪狼・雷狼・翠狼・天狼・灰狼の頭目・翠狼の主）を白い狼の原画 1 枚から色替えで、
    狐の系統（氷華の妖狐・天狐の残照・回廊の番人の一部）を氷の九尾の原画から（tools/build_spx_enemies.py）
 2. 整理：使われていなかった ver0.18 の戦闘演出と、上書きされて使われない旧データ（spx-data.js の味方 9 人・星臨 8 人・灰狼。約 1.7MB）を外した。
    戦闘の仕組みの見取り図は docs/BATTLE.md、関数の包みの流れは tools/wrapmap.py、全画面の自動点検は tools/smoke.js
 3. 不具合：全滅で所持金が半分になる古い決まり（クエストと食い違い）・対象の消えた攻撃で止まる・大ボスの札の崩れ・街で仲間が重なる */
'use strict';
const V33=(()=>{
const VER='ver0.33';
const NEWS=`<div class="nt"><b>${VER}</b><br><small>・<b>敵の原画</b>：狼の系統（灰狼・雪狼・雷狼・翠狼・天狼…）と狐の系統（氷華の妖狐・天狐の残照）を新しい原画に<br>`+
 `・<b>不具合の修正</b>：全滅しても所持金は減らない（クエストと同じ）／一部の戦闘で攻撃が止まることがある／クエスト一覧の大ボスの表示崩れ／街で仲間が重なって立つ<br>`+
 `・<b>軽量化</b>：使われていなかった古い絵のデータを外し、読み込みを約 1.7MB 減らした</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n33')){const d=document.createElement('div');d.className='n33';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;};const v=$('#verL');if(v)v.textContent=VER;}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}
return{VER};})();
