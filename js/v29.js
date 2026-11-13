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
try{TX24.STYLE.resist={font:'lat',fill:[[0,'#f0f4ff'],[.4,'#b8c4dc'],[.6,'#7686a8'],[1,'#3c4866']],ow:.12,oc:'#0c1020',rw:.035,rc:'#ffffff',sh:[.035,.065,'rgba(0,0,0,.6)']};TX24.clear();}catch(e){}
const NEWS29=`<div class="nt"><b>${VER29}</b>　呼称・ドット絵・モーション・図鑑を整理しました。<br><small>・図鑑：キャラクターをドラッグで回して、<b>正面・側面・背面</b>から「通常・待機・${SEIRIN.n}」を確認できます。下のタブは「人物・技・${SEIRIN.n}」に。<br>・呼称を統一：${TERMS.CHAR.playable}／${TERMS.CHAR.normal}・${TERMS.CHAR.mid}・${TERMS.CHAR.big}、装備は ${Object.values(TERMS.EQUIP).join('・')}。技は「攻撃スキル・補助魔法」などの区分つき。<br>・新しいダメージ区分「Resist」：耐性のある属性で攻撃すると軽減されます（図鑑の「人物」で確認）。<br>・キャラクターの向きを全モーションで統一しました。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;
 setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n29')){const d=document.createElement('div');d.className='n29';d.innerHTML=NEWS29;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
function dev29(m){log(m||`<b>${VER29}</b>　図鑑・呼称・向き・骨格の確認`);
 menu([{l:'図鑑を開く',s:'回転ビューア（通常・待機・星臨）',cls:'ready',f:()=>{try{G.zk=G.zk||{e:{},i:{}};zkEnemies().forEach(k=>G.zk.e[k]=G.zk.e[k]||1);}catch(e){}zkMenu();}},
  {l:'Resist の確認',s:'氷・炎の耐性を持つ敵',f:()=>devBattle([{kind:'iceslime',lv:20},{kind:'lavaslime',lv:20},{kind:'raiwolf',lv:20}],'ouito',{boss:false})},
  {l:'向きを全員既定に戻す',s:'図鑑で変えた「戦闘の向き」を消す',f:()=>{G.zdir={};save();try{for(const k of Object.keys(ED).concat(Object.keys(HB)))SPX.zReg(k);}catch(e){}dev29('向きを既定（味方は左・敵は右）に戻した');}},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(VER29+' 図鑑・呼称','回転ビューア・呼称の統一・Resist・骨格',dev29,0,'ready');}catch(e){}};}
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER29;};const v=$('#verL');if(v)v.textContent=VER29;}
try{document.title='アストラル・ブレイカー '+VER29;}catch(e){}
return{VER29,NEWS29,dev29};})();
