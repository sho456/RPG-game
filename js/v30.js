/* ===== ver0.30 図鑑の基準画像・星臨の縮尺統一・素材制作パイプライン =====
 1. 図鑑：正面・待機・星臨の 3 種だけを、同じ縮尺・同じ足元・同じキャンバスで表示（js/zukan/viewer.js）
 2. 星臨の縮尺：旧データの星臨（セレス・シオン・バルザ・ハクア・エルナ）が通常の姿より 1.1〜1.3 倍大きかったのを、
    assets_src/character_scale.json の倍率でデータごと作り直した（戦闘・図鑑の両方に効く）
 3. 一覧：黒炎竜ヴォルガノンのサムネイルが小さかった（一覧用の中間サイズが無かった）のを、一覧用サイズを足して修正
 4. 開発者メニュー「基準画像の並び」：全キャラの 正面・待機・星臨 を同じ縮尺で並べ、足元の線をそろえて確認する
 素材制作の手順は docs/PIPELINE.md、データ形式は docs/ASSETS.md */
const V30=(()=>{
const VER30='ver0.30';
const NEWS30=`<div class="nt"><b>${VER30}</b>　図鑑と${SEIRIN.n}の見た目を整えました。<br><small>・図鑑：キャラクターの絵を「正面・待機・${SEIRIN.n}」の 3 種にしぼり、どれも同じ大きさ・同じ足元で表示します。<br>・${SEIRIN.n}の姿が通常より大きく描かれていた仲間（セレス・シオン・バルザ・ハクア・エルナ）を、通常の姿と同じ体格に直しました（戦闘でも同じ）。<br>・図鑑の一覧で黒炎竜ヴォルガノンが小さく表示されていたのを直しました。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;
 setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n30')){const d=document.createElement('div');d.className='n30';d.innerHTML=NEWS30;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);

/* ---------- 基準画像の並び（ゲーム内の品質確認） ----------
 素材サイズ sk を全員そろえ、1 ドット＝端末の z 画素で描く。赤い線＝足元（ay）。
 確認する所：通常と星臨の体格（頭の大きさ・肩の高さ）、足元の線、向き、配色の差 */

try{document.title='アストラル・ブレイカー '+VER30;}catch(e){}
return{};})();
