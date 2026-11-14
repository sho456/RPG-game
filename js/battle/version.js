/* ===== ver0.34 戦闘演出の基盤（版表示・お知らせ） =====
 戦闘演出の全面刷新（ver1.0）の第 1 段。中身は js/battle/ の各ファイル、見取り図は docs/BATTLE.md */
'use strict';
const V34=(()=>{
const VER='ver0.34';
const NEWS=`<div class="nt"><b>${VER}</b><br><small>・<b>戦闘演出の土台</b>：演出をデータで組む新しい仕組み（残像・斬撃・衝撃波・魔法陣・カメラの寄り）。まずリオの通常攻撃と 3 技に入れた（ほかの技は順に対応）<br>`+
 `・<b>戦闘速度</b>：×1・×2 の 2 段階に<br>`+
 `・<b>設定</b>：星臨演出（通常／短縮／省略）・演出の品質（自動／高／標準／低負荷）・画面の揺れ・点滅の強さ<br>`+
 `・<b>開発者メニュー</b>：演出ビューア（技・敵の行動・星臨・状態を何度でも再生）</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n34')){const d=document.createElement('div');d.className='n34';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;};const v=$('#verL');if(v)v.textContent=VER;}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}
return{VER};})();
