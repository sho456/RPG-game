/* ===== ver0.29 呼称・ドット絵・モーション管理・図鑑の全面整理 =====
 1. 呼称・分類の共通規格：js/data/terms.js（TERMS）。装備枠の表示名、技の区分、敵の区分、ダメージ区分（Resist を追加）
 2. ドット絵・モーション：
    ・向き：js/sprite/facing.js（FACING）に一本化。原画で逆を向いていたポーズはデータへ焼き込み（tools/spx_normalize.py）
    ・背面：全プレイアブルキャラに戦闘サイズの背面（リオ・ヴァルクは原画、他は探索用の背面原画から起こした補完）
    ・モーション台帳：js/motion/registry.js（MOTION）。キャラ・技ごとの専用モーションを登録できる（戦闘の振り付けに差し込み口）
    ・骨格：js/motion/skeleton.js（SKEL）＋ js/data/skeleton-overrides.js（手動修正）
    ・ファイル構成：js/sprite/（描画・データ・旧リグ） js/motion/（動き・骨格・演出） js/zukan/（図鑑） js/data/（規格・手動データ）
 3. 図鑑：js/zukan/。通常・待機・星臨 × 正面・側面・背面を回して確認。下部タブは 人物・技・星臨
 詳しくは docs/ASSETS.md */
const V29=(()=>{
const VER29='ver0.29';
/* Resist の見出し（灰青の金属調。Weak・Critical と同じ書体） */

const NEWS29=`<div class="nt"><b>${VER29}</b>　呼称・ドット絵・モーション・図鑑を整理しました。<br><small>・図鑑：下のタブを「人物・技・${SEIRIN.n}」に整理しました。<br>・呼称を統一：${TERMS.CHAR.playable}／${TERMS.CHAR.normal}・${TERMS.CHAR.mid}・${TERMS.CHAR.big}、装備は ${Object.values(TERMS.EQUIP).join('・')}。技は「攻撃スキル・補助魔法」などの区分つき。<br>・新しいダメージ区分「Resist」：耐性のある属性で攻撃すると軽減されます（図鑑の「人物」で確認）。<br>・キャラクターの向きを全モーションで統一しました。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;
 setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n29')){const d=document.createElement('div');d.className='n29';d.innerHTML=NEWS29;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);

/* 版表示・タイトルは v30.js が上書きする */
return{};})();
