/* ===== ver0.32 図鑑の絞り込み・敵の大きさ・向き・クエスト情報 =====
 1. 図鑑：敵の一覧を「区分（通常敵／ボス）」と「系統（スライム・獣・竜…）」で絞り込める（js/zukan/zukan.js の famOf・FAMS）
 2. 戦闘：通常敵の見た目の大きさを、極端に変わらないようにそろえる（ボス・中ボスは除く）。
    見た目の大きさ＝絵の不透明な範囲の面積の平方根。基準 S0 からの差を EXP 乗に縮める（小さい敵は少し大きく、大きい敵は少し小さく）
 3. 向き：出撃前の画面（クエストの上の場面）も戦闘と同じ原画・同じ向き（FACING）。戦闘の見た目のキー（tr_○○）でも図鑑の向きが効く
 4. 対峙：味方は左・敵は右を向き、必ず向かい合う。原画の差し替えで古くなった「戦闘の向き」の設定は一度だけ消す（G.zdirV）
 5. クエスト：選ぶと専用の「クエスト情報」タブに移る（js/v31/quests.js の renderInfo） */

const V32=(()=>{
const VER='ver0.32';
/* ---------- 2. 通常敵の大きさ ---------- */

/* 見た目のキー → 倍率 */

/* ---------- 3・4. 向き ---------- */
try{FACING.resetAlias();}catch(e){}
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{const t=r||g;if((t.zdirV||0)<32){t.zdir={};t.zdirV=32;}}catch(e){console.error(e);}return r;};}
/* ---------- 版表示・お知らせ ---------- */
const NEWS=`<div class="nt"><b>${VER}</b><br><small>・<b>原画</b>：${TERMS.CHAR.playable}12人と狼の系統を新しい原画に。全員の大きさを「足元から目までの高さ×体格」の規格にそろえた<br>`+
 `・<b>図鑑</b>：絵を枠の中央に。敵は「通常敵／ボス」と系統で絞り込める<br>・<b>戦闘</b>：通常敵の大きさが極端に違わないように<br>`+
 `・<b>出撃前</b>：クエストを選ぶと「クエスト情報」タブへ。出現する敵とパーティが向かい合う（図鑑で設定した向きも反映）</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n32')){const d=document.createElement('div');d.className='n32';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);

try{document.title='アストラル・ブレイカー '+VER;}catch(e){}
return{};})();
