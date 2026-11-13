# ドット絵・モーション・図鑑・呼称の管理ガイド（ver0.29）

キャラクター・モーション・素材を大量に追加するときの手順と、ファイルの役割をまとめる。

## 1. ファイル構成

```
assets_src/
  originals/               提供原画（シート・1 枚絵）。ここが絵の正本
  legacy/spx-legacy.json   旧ビルドの素材（noah_K・jin_K）。build_spx_heroes.py だけが読む。実行時は使わない
tools/
  build_spx_heroes.py      味方の原画 → js/sprite/data/spx-data-heroes.js（rio・valk・jin、星臨 _K、noah_K・jin_K の修正）
  build_spx_enemies.py     敵の原画 → js/sprite/data/spx-data-enemy.js
  spx_normalize.py         spx-data.js の正規化（向きの焼き込み・重複の除去・背面の補完）。何度実行しても同じ結果
  spx_common.py            縮小・パレット・PNG 化の共通処理
js/
  data/terms.js            呼称・分類の共通規格（TERMS）
  data/skeleton-overrides.js  骨格の手動修正（SKEL_OVR）
  sprite/facing.js         向きの唯一の窓口（FACING）
  sprite/spx.js            提供原画のスプライト（SPX）を各画面の描画に差し込む
  sprite/data/             自動生成データ（手で編集しない）
  sprite/legacy/           旧リグ（コードで描くドット絵）。提供原画の無い敵がまだ使う
  motion/anim.js           待機・キーポーズ補間（ANIM）
  motion/registry.js       モーション台帳（MOTION）
  motion/skeleton.js       骨格・関節・可動域（SKEL）
  motion/fx19.js           戦闘エフェクト
  zukan/zukan.js           図鑑（一覧・詳細）
  zukan/viewer.js          図鑑の回転ビューア（ZVIEW）
  v29.js                   ver0.29 の版表示・お知らせ・開発者メニュー
```

## 2. 呼称・分類（js/data/terms.js）

| 分類 | 呼称 |
|---|---|
| キャラクター | プレイアブルキャラ／通常敵・中ボス・大ボス |
| 装備品 | 武器・主防具・服防具・装飾品 |
| 技・能力（物理） | 通常攻撃（物理）・防御・攻撃スキル・補助スキル（バフ・デバフ・かばう系）・回復スキル |
| 技・能力（魔法） | 通常攻撃（魔法）・攻撃魔法・補助魔法（バフ・デバフ）・回復魔法 |
| その他 | 星臨・パッシブスキル |
| ダメージ | 通常ダメージ・Weakダメージ（×1.7）・Resistダメージ（×0.5）・Criticalダメージ（×1.5） |

- 装備の枠（セーブの値は変えていない）：`w`＝武器、`body`（鎧・外套）と `sub`（盾・護符）＝主防具、`head`（兜・冠・額当て）＝服防具、`acc1/acc2`＝装飾品。対応表は `TERMS.SLOT_CAT`。
- 敵の区分：`ED[k].rank = 'normal'|'mid'|'big'` で指定できる。未指定ならエリアの主ボスと終盤の決戦は大ボス、それ以外の boss は中ボス。
- 技の区分：`SK[k].cat = 'mag_heal'` のように指定できる。未指定なら種類・威力・使い手から自動判定。
- Resist：`ED[k].resist = ['氷']`。弱点ではない属性で当てると軽減し「Resist」と表示する。

## 3. 向き（js/sprite/facing.js）

- 素材の向きは `SPX_DATA[id].face`（`'L'|'R'`）。**全ポーズが同じ向き**で保存されている。原画で逆を向いたポーズがあれば、ビルド時に反転してから保存する（`spx_normalize.py` の `FLIPF`、`build_spx_heroes.py` の `VALK_FLIP` が例）。
- 表示の既定：プレイアブルキャラは左、敵は右。図鑑の「戦闘の向き」で変えた値は `G.zdir` に保存される。
- 戦闘・待機・図鑑・編成・一覧の絵は、すべて `FACING.of()` と `FACING.mirror()` を通るので、モーションごとに向きがずれることはない。

## 4. 新しいキャラクター・ポーズを足す

1. 原画を `assets_src/originals/` に置く。
2. 味方：`build_spx_heroes.py` に切り出し（`from_cells` か `from_auto`）を足し、`build_hero()` を呼ぶ。
   ポーズ名は `MOTION` の素材名（`stance front back ready lunge dash cast guard hit weak win down awk`）に合わせる。
   新しいポーズ（例：`skill_koujin`）は `BATTLE` に名前を足すと全サイズで作られる。
3. 敵：`build_spx_enemies.py` に追加し、`spx.js` の `FAM`（色違い）と `DEF`（元のリグ・大きさ）に登録する。
4. `python3 tools/build_spx_heroes.py`（または enemies）→ `python3 tools/spx_normalize.py` を実行。
5. 図鑑の回転ビューアで、正面・側面・背面と「原画／自動補完」の表示を確認する。

## 5. モーションを足す（js/motion/registry.js）

```js
// リオの「光刃」だけ専用の動きにする（素材に skill_koujin ポーズを足してある場合）
MOTION.add('rio', 'skill:koujin', {
  approach: true,                                   // 相手の前まで走る
  keys: [
    {pose: {f: 'lunge', ta: .4}, ms: 120},          // f＝素材のポーズ名を直接使う
    {pose: {f: 'skill_koujin'}, ms: 90, ease: 'in'},
  ],
  fx: {type: 'slash', big: 1},                      // 命中エフェクト
});
// 全員の回復魔法を同じ型にする
MOTION.add('*', 'cat:mag_heal', {keys: [{pose: {f: 'cast'}, ms: 200}]});
```

- 探す順：キャラの `skill:技id` → キャラの `cat:区分` → 全員（`'*'`）の同じ順。登録が無い技は従来の振り付け（ver19.js の武器ごとの型）のまま。
- 区分のキーは `TERMS.SKILL`（`phys_normal phys_attack phys_support phys_heal mag_normal mag_attack mag_support mag_heal guard seirin`）。
- 図鑑で見られるモーションは `MOTION.ZUKAN`（通常・待機・星臨）、向きごとの素材は `MOTION.VIEWS`。

## 6. 骨格（js/motion/skeleton.js・js/data/skeleton-overrides.js）

- 型：`hum`（人型）／`beast`（四足・竜）／`blob`（不定形）／`float`（浮遊体）。関節の親子と可動域（度）は `SKEL.TYPES`。
- どの素材も、読み込んだときに不透明画素の形から関節を**自動推定**する（新しい素材も登録不要）。
- ずれる関節だけ `SKEL_OVR` で**手動修正**する。座標はフレームの比率（0〜1）なので全サイズに効く。
- 作り方：開発者モードで図鑑 → 「骨格」→ 関節をドラッグ → 「骨格を書き出す」を `skeleton-overrides.js` に貼る。
- 使い道：呼吸で沈める上半身の切れ目（腰）、背面の自動補完（頭の範囲）、図鑑の骨格表示、今後の部位アニメ（`SKEL.clamp` で可動域に収める）。

## 7. 図鑑の回転ビューア（js/zukan/viewer.js）

- 0°＝正面、90°＝左側面、180°＝背面、270°＝右側面。ドラッグ・◀▶・正面/側面/背面・自動回転で回す。
- 回転の途中は 2 方向の絵を幅の伸縮で切り替え、止まると方向にぴたりと合わせる（止まった絵は整数倍で表示）。
- 素材に無い向きは自動補完し、画面右上に「自動補完」と出す。原画を足せば自動で「原画」に変わる。

### ver0.29 時点の「自動補完」の向き（原画を足すと品質が上がる所）

| 対象 | 自動補完の向き |
|---|---|
| リオ・ヴァルク | 星臨の背面のみ（通常・待機の背面は原画） |
| 他のプレイアブルキャラ | 背面（探索用の小さい背面原画から起こした絵）、星臨の背面 |
| ジン | 背面（正面を鏡写しにして髪で塗った絵） |
| 敵（沈みし女王・忍の系統） | 背面 |
| その他の敵 | 正面（側面の絵を流用）・背面 |
