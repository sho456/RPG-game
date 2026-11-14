/* ===== 戦闘演出の全面刷新（ver0.34〜）：版表示・お知らせ =====
 ver0.34 基盤 ／ ver0.35 キャラモーション ／ ver0.36 装備アイコン・敵の向き。中身は js/battle/ の各ファイル、計画と作り方は docs/FX.md */
'use strict';
const V34=(()=>{
const VER='ver0.36';
const NEWS=`<div class="nt"><b>${VER}</b><br><small>・<b>装備のアイコンを作り直し</b>：武器・防具・装飾品の全種類（約 100 種）を、大きく描き込みの多い絵に。素材（銅・鉄・鋼・星鋼）で飾りが増え、伝説・専用装備はそれぞれ固有の形に<br>・<b>敵の向き</b>：すべての敵・ボスが右向き（味方の方を向く）にそろった。騎士の系統が逆を向いていたのを修正<br>・<b>技の演出</b>：リオ・ガルド・ミレイユの全技に、それぞれ固有の演出</small></div>`+
 `<div class="nt"><b>ver0.35</b><br><small>・<b>味方の動き</b>：12 人それぞれの待機の癖・通常攻撃・被弾（一撃の重さでのけぞりが変わる）・防御・瀕死・勝利の決め・復活<br>・<b>体の曲げ</b>：1 枚の絵を、前かがみ・のけぞり・しゃがみ・伸び上がり・回転で動かす新しい仕組み</small></div>`+
 `<div class="nt"><b>ver0.34</b><br><small>・<b>戦闘演出の土台</b>：演出をデータで組む新しい仕組み（残像・斬撃・衝撃波・魔法陣・カメラの寄り）。まずリオの通常攻撃と 3 技に入れた（ほかの技は順に対応）<br>`+
 `・<b>戦闘速度</b>：×1・×2 の 2 段階に<br>`+
 `・<b>設定</b>：星臨演出（通常／短縮／省略）・演出の品質（自動／高／標準／低負荷）・画面の揺れ・点滅の強さ<br>`+
 `・<b>開発者メニュー</b>：演出ビューア（技・敵の行動・星臨・状態を何度でも再生）</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n34')){const d=document.createElement('div');d.className='n34';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;};const v=$('#verL');if(v)v.textContent=VER;}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}
return{VER};})();
