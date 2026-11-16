/* ===== ver0.38 画面全体の整理 =====
 ・ホーム：左の列（道具屋・鍛冶屋・鑑定屋）は下のタブと重複していたので外し、鑑定屋は右の列へ。
   右の列の「ミッション」「絆」は、上の依頼ミッションの帯と酒場（ミッション・絆）に一本化
 ・戦闘中のメニュー（≡）：クエストからの撤退
 ・版表示・お知らせ・遊び方 */
'use strict';
const V38M=(()=>{
const VER='ver0.47';
const app=$('#app');
/* ---------- ホーム ---------- */
{const _tm=townMenu;townMenu=function(m){_tm(m);try{const L=$('#labels');if(!L)return;const left=L.querySelector('.h22left');if(left)left.remove();
  const R=L.querySelector('.h22right');if(R){R.querySelectorAll('[data-h22="quest"],[data-h22="bond"]').forEach(b=>b.remove());
   if(!R.querySelector('[data-h22="appraise"]')){const un=G.inv.filter(i=>i.unid).length,b=document.createElement('button');b.dataset.h22='appraise';const sv=R.querySelector('[data-h22="zk"] svg');b.innerHTML=`${sv?sv.outerHTML.replace(/<path[^>]*>/g,'').replace('</svg>','<path d="M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4zm0 6.4A2.4 2.4 0 1 1 8 5.6a2.4 2.4 0 0 1 0 4.8z"/></svg>'):''}<small>鑑定</small>${un?'<i class="bd22">'+un+'</i>':''}`;const z=R.querySelector('[data-h22="zk"]');z?z.after(b):R.appendChild(b);}}
 }catch(e){console.error(e);}};}

/* ---------- 戦闘中のメニュー：撤退 ---------- */
{const _co=cfgOpen;cfgOpen=function(back){_co(back);try{if(scene!=='battle'||!B||B.over||!B.opts||!B.opts.quest)return;const box=$('#sheet .cfb');if(!box||box.querySelector('[data-a="ret38"]'))return;
  box.insertAdjacentHTML('beforeend',`<div class="cfr ret38"><label>クエストから撤退<small>ここまでに得た報酬は持ち帰る</small></label><button class="tbtn" data-a="ret38">撤退する</button></div>`);
  SACT.ret38=()=>{try{V31Q.retreat();}catch(e){console.error(e);}};}catch(e){console.error(e);}};}

/* ---------- 版表示・お知らせ・遊び方 ---------- */
const NEWS=`<div class="nt n38"><b>${VER}</b>　技・術の練達と戦闘の見やすさ<br><small>`+
 `・<b>練達</b>：技Lv をやめ、技・術を<b>錬磨石</b>（敵が落とす）で 3 段階まで強化。Ⅲでは「解癒」などの強い効果も<br>`+
 `・<b>戦闘</b>：HP・BP はキャラの中央に。数字は細身の斜体で詰めて、弾むように出る。複数の敵が重ならない。1 倍速はターンの変わり目に少し間<br>`+
 `・LP は気絶と、一部の高難易度ボスの攻撃で減る。AUTO ボタンを読みやすく。画面を高画質に</small></div>`+
 `<div class="nt n38"><b>ver0.46</b>　戦闘の表示の流れを整理しました<br><small>`+
 `・<b>表示の枠</b>：キャラごとに固定の 3 段（Critical・Weak＋属性／強化・弱体を横並び／数字）。誰への効果か一目で分かる<br>`+
 `・<b>連続ヒット</b>：ヒットごとの数字が 1 桁ずつ入れ替わる。<b>全体攻撃</b>は全員へ同時に当たる<br>`+
 `・「戦闘開始」は筆文字に。表示はキャラの範囲の中に詰めて、Critical は Weak の上。強化・弱体の文字は小さめに<br>`+
 `・「戦闘開始」のあとに HP・BP。コマンドを決めた後に少しだけ出し、攻撃の前に消える。属性の印の質感と文字の色を統一</small></div>`+
 `<div class="nt n38"><b>ver0.45</b>　アビリティ・装備・戦闘の見せ方を作り直しました<br><small>`+
 `・<b>アビリティ</b>：3 段階に。段階Ⅲで【固有名の特殊効果】（かばう・マヒ・暗闇・名前付きの追撃など）が付く<br>`+
 `・<b>用語</b>：スタン・挑発・追撃などは緑の文字。タップで説明。奥義もタップで詳細<br>`+
 `・<b>装備</b>：上がるのは基礎ステータス（HP・腕力・体力・器用さ・素早さ・知力・精神・魅力）だけに。属性の印と耐性を 1 つに<br>`+
 `・<b>BP</b>：初期BP・毎ターンの回復を見直し。<b>戦闘</b>：連続ヒットは合計を数え上げる・Weak と Critical は同じ大きさ・「戦闘開始」</small></div>`+
 `<div class="nt n38"><b>ver0.44</b>　耐性・鍛冶屋・ダメージ表示を作り直しました<br><small>`+
 `・<b>属性耐性</b>：防具に属性耐性が付き、種類で傾向が変わる。受けるダメージに反映。装備の詳細に耐性の欄<br>`+
 `・<b>鍛冶屋</b>：アイコンの一覧に整理。タップで選び、もう一度タップで詳細<br>`+
 `・<b>戦闘</b>：連続ヒットの数字が重ねて出る。表示どうしが被らない配置に。行動中の三角を廃止、HP・BP はターンの始めだけ<br>`+
 `・<b>LP</b> は全員 7。タイトルはタップしてから始める。アビリティはタップで詳細の窓</small></div>`+
 `<div class="nt n38"><b>ver0.43</b>　技の表示とダメージの見せ方を磨きました<br><small>`+
 `・<b>戦闘</b>：狙っている敵の弱点の属性は赤、耐性は青く光る。BP は「BP　6」の表示に。技名の吹き出しはすぐ消える<br>`+
 `・<b>ダメージ</b>：Critical・Weak・属性を大きく、金属の質感と筆の書体で。数字の出方にも動きを<br>`+
 `・<b>技・術の詳細</b>：威力・Rank・BP・LP と説明をまとめた窓に。<b>コマンドの文字</b>を筆の入った書体に<br>`+
 `・<b>修正</b>：陣形の ⓘ で裏の画面が見える／クエストの章の名前が切れる。人物の紹介は図鑑へ</small></div>`+
 `<div class="nt n38"><b>ver0.42</b>　戦闘の演出と文字を作り直しました<br><small>`+
 `・<b>戦闘</b>：技名はキャラの吹き出しに。技の間は戦場が暗くなり、振り抜き→衝撃→閃光。数字は 1 桁ずつ弾み、倒した敵は赤く崩れる<br>`+
 `・<b>文字</b>：全画面のフォントを読みやすい角ゴシックに統一<br>`+
 `・<b>技・術のアイコン</b>：技の内容ごとの絵柄に。<b>装備</b>：アイコンをタップで詳細（属性耐性・能力影響・アビリティ）<br>`+
 `・<b>陣形</b>：戦闘画面と同じ向き（左が敵側・キャラは左向き）</small></div>`+
 `<div class="nt n38"><b>ver0.41</b>　編成・陣形・技の画面を作り直しました<br><small>`+
 `・<b>編成</b>：カードをタップで詳細、「入替」か控えをタップで入れ替え。読みやすい太字のフォントに<br>`+
 `・<b>陣形</b>：上から見た戦場に、方位の円と補正の札（▲▼）。下の「変更」で陣形を選ぶ<br>`+
 `・<b>技・術</b>：アイコン・Rank・属性の一覧に。<b>アビリティ</b>は専用のタブへ<br>`+
 `・<b>戦闘</b>：一部の味方が小さく描かれる不具合と、大型の敵が画面の端で切れる不具合を修正</small></div>`+
 `<div class="nt n38"><b>ver0.40</b>　操作をわかりやすくしました<br><small>`+
 `・<b>技・術セット</b>：技をタップでセット／外す。枠をタップしてから技をタップで、その枠に入れる（枠どうしで並べ替え）<br>`+
 `・<b>陣形・配置</b>：戦場の図で、2 人をタップして立ち位置を入れ替えられる。陣形は下の帯で切り替え<br>`+
 `・<b>戦闘のコマンド</b>：タップで指を動かし、もう一度タップで決定<br>`+
 `・<b>戦闘の大きさ</b>：味方の背丈をそろえ、敵は種類（小型・中型・大型・ボス）ごとの大きさに。<b>アビリティ</b>は能力タブのいちばん上に</small></div>`+
 `<div class="nt n38"><b>ver0.39</b>　画面を見やすく整理しました<br><small>`+
 `・<b>星盤</b>：説明文と凡例をなくし、星をタップすると下のカードに効果が出る形に。星盤／天星盤は切り替えタブに<br>`+
 `・<b>戦闘</b>：選んだコマンドに指のカーソル。弱点は赤・耐性は青く光る。HP・BPの表示はターンの始めだけ。行動順のアイコンは廃止<br>`+
 `・<b>技Lv</b>：熟練と統合し「技Lv」とゲージで表示。<b>編成</b>：並び番号・属性の球体・詳細の星盤の絵を削除</small></div>`+
 `<div class="nt n38"><b>ver0.38</b>　戦闘システムと画面を大きく作り直しました<br><small>`+
 `・<b>戦闘画面</b>：敵と味方が向き合う配置に。味方は<b>陣形どおりの立ち位置</b>に並ぶ。コマンドを選ぶ間は戦場ごと上へスライドし、決め終えると戦場が全面に戻って行動が始まる<br>`+
 `・<b>HP・LP・BP</b>：HP30%以下で瀕死、0で気絶（LP-1）。気絶中に攻撃を受けてもLP-1、LPを削る敵もいる。LPが残っていれば<b>回復術</b>で復活（回復術はLPを1使う）。BPはキャラごとに初期・最大・毎ターンの回復が違う<br>`+
 `・<b>能力値</b>：腕力・体力・器用さ・素早さ・知力・精神・魅力の7種。命中・回避・状態異常の成功率・回復量にも効く<br>`+
 `・<b>攻撃属性</b>：斬・打・突・熱・冷・雷・陽・陰の8種。<b>武器種</b>：剣・短剣・大剣・斧・体術・弓・杖・双剣の8種<br>`+
 `・<b>連続戦闘</b>：敵を全滅させると自動で次の戦闘へ。撤退は戦闘中のメニュー（≡）から<br>`+
 `・オーバードライブ・連携・共鳴技・ジョブは廃止しました（ジョブの技はキャラの技・術に、育成は能力値とアビリティに統合）</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n38')){const d=document.createElement('div');d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d.firstChild):o.prepend(d.firstChild);}}catch(e){}},0);},true);
try{TIPS.how=['遊び方',['<b>灯都</b>で準備 → <b>出撃</b>でクエストへ。戦闘が続くクエストは、敵を全滅させると自動で次の戦闘に進む。灯都に戻るとHP・LPが全回復＆自動セーブ。',
 '戦闘：ターンの始めに味方全員の行動を選ぶ。技・術は<b>BP</b>を使う。弱点の属性を突くと大ダメージ。'+SEIRIN.g+'100%で<b>'+SEIRIN.n+'</b>（行動を消費しない）。',
 '<b>HP</b>が0で気絶し<b>LP</b>が1減る。LPが残っていれば回復術で復活できる。LPが0になるとその戦闘では復活できない。',
 '育成：<b>編成</b>から装備・技・術セット・<b>陣形</b>。<b>星詠み</b>で星盤。']];}catch(e){}
/* タイトル（ver0.44）：遊び方は出さない。最初は「TAP TO START」だけで、画面をタップすると「はじめから／つづきから」が出る */
function titleTap(){const ov=$('#ov');if(!ov)return;['#howto','#hw','#ttap'].forEach(q=>{const e=ov.querySelector(q);if(e)e.remove();});
 const tm=ov.querySelector('#tm');if(!tm||ov.querySelector('#tap44'))return;tm.classList.add('hid44');
 const t=document.createElement('div');t.id='tap44';t.textContent='TAP TO START';ov.appendChild(t);
 const go=e=>{if(e.target.closest('.tfoot,button'))return;ov.removeEventListener('click',go,true);t.remove();tm.classList.remove('hid44');tm.classList.add('in44');try{SFX.sel();}catch(x){}e.stopPropagation();};
 ov.addEventListener('click',go,true);}
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;try{titleTap();}catch(e){console.error(e);}};const v=$('#verL');if(v)v.textContent=VER;try{titleTap();}catch(e){}}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}
return{VER};})();
