/* ===== ver0.29 モーション台帳（MOTION） =====
 戦闘・図鑑で使うモーションの「名前・区分・使う絵・動き」を 1 か所で管理する。
 今後、通常攻撃・スキル・魔法・被弾・勝利などのモーションを大量に足すときは、ここへ登録するだけでよい。

 ■ 標準モーション（CATALOG）
   id ごとに 呼称（TERMS の区分と対応）・既定で使う絵（素材のポーズ名）・ループするか を持つ。
   既定の動き（振り付け）は従来どおり ver19.js（武器ごとの型）と anim.js（待機）が作る。
 ■ 素材のポーズ名（フレーム）
   味方：stance(待機・側面) front(正面) back(背面) ready lunge(攻撃) dash(走り) cast(魔法) guard hit weak(瀕死) win down awk(星臨)
   敵　：idle(側面) front(正面、あれば)
   新しいポーズは tools/build_spx_heroes.py の BATTLE に名前を足して原画から作る（例：'skill_koujin'）。
 ■ キャラ・技ごとの専用モーション（add）
   MOTION.add('rio', 'skill:koujin', {keys:[{pose:{f:'lunge',ta:.4},ms:120},{pose:{f:'skill_koujin'},ms:90,ease:'in'}], fx:{type:'slash',big:1}, approach:true});
   ・対象：'skill:技id' ＞ 'cat:技の区分（TERMS.SKILL のキー）' ＞ 'motion:標準モーションid' の順に探す
   ・keys：ANIM.to に渡すキーポーズの列。pose.f に素材のポーズ名を書くと、その絵を直接使う
   ・approach：近接（相手の前まで走る）。fx：命中エフェクトの種類（ver19 の onHurt が使う）
   登録が無い技は従来の振り付けのまま動く。 */
const MOTION=(()=>{
/* 標準モーション：g＝区分（TERMS.SKILL / 状態）、f＝既定の絵（側面）、loop＝待機系 */

/* 図鑑に載せる基準画像（ver0.30：正面・待機・星臨の 3 種。同じ縮尺・同じ足元で描く。js/zukan/viewer.js） */
const ZUKAN=['front','idle','seirin'];

/* ---------- キャラ・技ごとの登録 ---------- */
/* REG[キャラid or '*'][対象]＝定義 */

/* 行動に使う専用モーション（無ければ null＝従来の振り付け） */

/* キーポーズの列を再生する（hitN：何撃目か。keys が関数なら (u,hitN) → 配列） */

/* 一覧（開発・図鑑用） */

return{ZUKAN};})();
