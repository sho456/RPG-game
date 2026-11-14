# ドット絵・モーション・図鑑・呼称の管理ガイド（ver0.30）

新しいキャラクター・アニメーションの制作手順は [PIPELINE.md](PIPELINE.md)。

キャラクター・モーション・素材を大量に追加するときの手順と、ファイルの役割をまとめる。

## 1. ファイル構成

```
assets_src/
  originals/               提供原画（シート・1 枚絵）。ここが絵の正本
  chars/<id>/              素材パック（マスター原画・連続フレーム・character.json）。tools/spx_import.py が読む
  templates/               制作テンプレート（アクションの台帳 actions.json・マスター原画の依頼文）
  character_scale.json     縮尺の正本（星臨を通常の体格にそろえる倍率）
  legacy/spx-legacy.json   旧ビルドの素材（noah_K・jin_K と、補正前の星臨 'orig:<id>_K'）。実行時は使わない
tools/
  spx_import.py            素材パック → js/sprite/data/spx-data-chars.js（縮尺統一・足元合わせ・パレット・複数サイズ・anims）
  spx_qa.py                品質確認（一覧サムネイル・正面/待機/星臨の並び・連続フレームの滑り/色/つなぎ目）
  build_spx_heroes.py      味方の原画 → js/sprite/data/spx-data-heroes.js（rio・celes・gald・mire・valk・jin、星臨 _K、noah_K・jin_K の修正）
  build_spx_enemies.py     敵の原画 → js/sprite/data/spx-data-enemy.js
  spx_normalize.py         spx-data.js の正規化（向きの焼き込み・重複の除去・背面の補完・星臨の縮尺・一覧用サイズ）。何度実行しても同じ結果
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
  zukan/viewer.js          図鑑のキャラクタービューア（ZVIEW：正面・待機・星臨を同じ縮尺で）
  v29.js                   ver0.29 のお知らせ・開発者メニュー
  v30.js                   ver0.30 の版表示・お知らせ・開発者メニュー（基準画像の並び）
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
2. 味方：`build_spx_heroes.py` に切り出し（`from_cells` か `from_auto`、正面・待機・星臨の 3 体並びなら `from_trio`）を足し、`build_hero()` を呼ぶ。
   3 体並びのシートは `TRIO` に 1 行足すだけでよい（待機・星臨の反転、戦闘不能の生成、1 枚絵の動きの指定まで共通）。
   ポーズ名は `MOTION` の素材名（`stance front back ready lunge dash cast guard hit weak win down awk`）に合わせる。
   新しいポーズ（例：`skill_koujin`）は `BATTLE` に名前を足すと全サイズで作られる。
3. 敵：`build_spx_enemies.py` に追加し、`spx.js` の `FAM`（色違い）と `DEF`（元のリグ・大きさ）に登録する。
4. `python3 tools/build_spx_heroes.py`（または enemies）→ `python3 tools/spx_normalize.py` を実行。
5. 図鑑（正面・待機・星臨）と、開発者メニュー「基準画像の並び」で縮尺・足元を確認する。`python3 tools/spx_qa.py check` も通す。

新しく作るキャラクター・アニメーションは、原則 **素材パック（assets_src/chars/）＋ tools/spx_import.py** で作る（PIPELINE.md）。

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
- 作り方：`SKEL_OVR` に座標（比率）を直接書く（ver0.30 で図鑑の骨格表示・ドラッグ編集は廃止）。
- 使い道：呼吸で沈める上半身の切れ目（腰）、今後の部位アニメ（`SKEL.clamp` で可動域に収める）。

## 7. 図鑑のキャラクタービューア（js/zukan/viewer.js）

- 載せる絵は **正面・待機・星臨 の 3 種だけ**（敵は正面の原画がある場合の正面と待機）。キャラクターのデザイン・配色・体格・シルエットの公式な基準画像。
- 3 種とも **同じ素材サイズ・同じ整数倍率・同じ足元の線・同じキャンバス** で描く。倍率は 3 種の絵をまとめた外枠が枠に収まるように 1 度だけ決める。
- 待機・星臨は戦闘と同じ待機の動き（anims があればその連続フレーム）。向きは「戦闘の向き」（FACING）。
- ver0.29 の回転・側面/背面の切り替え・自動回転・骨格表示・表情差分は廃止（背面の素材はデータに残っており、探索などで使う）。
