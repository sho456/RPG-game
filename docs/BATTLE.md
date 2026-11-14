# 戦闘の仕組み（ロジック・モーション・エフェクト）の見取り図（ver0.33）

戦闘モーション・エフェクトの大型アップデートの前に、今の作りを整理したもの。
ドット絵の素材の作り方は [PIPELINE.md](PIPELINE.md)、ファイルの役割は [ASSETS.md](ASSETS.md)。

---

## 1. 全体の流れ（ロジック：js/engine.js）

```
startBattle(list, opts)          敵・味方のユニットを作り（enemy() / hero()）、B を作って run() を始める
 └ run()                         決着まで繰り返す
    ├ nextActor()                CT（行動までの時間）が最小のユニット
    ├ heroTurn(u)                入力待ち（技リスト）または AUTO → doAction
    ├ enemyTurn(e)               敵の AI → doAction
    │  └ doAction(u, sk, t)      技 1 回分（対象が複数・連撃なら hit を何回も）
    │     └ hit(a, t, sk)        1 発分：calc（ダメージ計算）→ hurt（HP を減らす）→ pop（数字）→ kill（撃破）
    ├ awaken(u) / reso(u)        星臨・共鳴技（カットイン）
    └ end(win)                   勝敗・報酬（rewards）・画面の切り替え
```

- 戦闘中の状態は全部 `B`（グローバル）。`B.heroes` / `B.enemies` / `B.over` / `B.opts`。
- 時間：`wait(ms)`（engine）と `ANIM.T(ms)`（演出）は、どちらも速度（`SPD[speed]`、×1・×2・×4）で縮む。
- **注意**：`run()` は `B` をその都度読むので、戦闘中に別の `startBattle` を呼ぶと古い手番が新しい `B` に触れる。
  ver0.33 で `hit` に「対象がいなければ何もしない」防御を入れた（js/ver19.js）。戦闘を打ち切るときは `B.over=true` にして、
  手番が終わるのを待ってから次を始める。

## 2. 見せ方の層（モーション・エフェクト）

ロジックには手を入れず、関数を包んで「見せ方」だけを差し込む作り。**今動いているのは ver0.19 の系統**。

| 役割 | ファイル | 中身 |
|---|---|---|
| 戦闘の描画 | `js/ver19.js` の `drawBattle` | 背景・ユニット（重なり順・影）・エフェクトの層・状態表示。`draw` を戦闘中だけ丸ごと置き換える |
| 振り付け | `js/ver19.js` の `pre` / `strike` / `finish` / `dash` | 予備動作 → 踏み込み → 攻撃 → 命中・ヒットストップ → 反動 → 復帰。リグごとの型は `MA`（攻撃）・`CAST`・`BOW`・`VIC`・`AWK` |
| 動きの時計・補間 | `js/motion/anim.js`（`ANIM`） | `setup(u)`（リグ・大きさ・向き）、`to(u, ポーズ, ms, ease)`（キーポーズ補間）、`move`、`idle`（待機の関数 `IDLE`）、`stop(ms)`（ヒットストップで時計を止める） |
| エフェクト | `js/motion/fx19.js`（`FX19`） | `slash thrust claw bite burst ring smash elem proj circle gather heal buff shield pillar` と、汎用の `add(dur, f, layer)`・`part`・`spray`。時間は ANIM の時計（ヒットストップで止まる） |
| 技ごとの専用モーション | `js/motion/registry.js`（`MOTION`） | `MOTION.add(キャラ, 'skill:技id' or 'cat:区分', {keys, approach, fx})`。`strike` が最初に `MOTION.custom` を見る（差し込み口） |
| 絵（コマ） | `js/sprite/spx.js`（`SPRX.frame`） | ANIM のポーズから素材のポーズ名（stance・lunge・cast…）を選ぶ（`heroFrame`）。連続フレーム（`anims`）があればコマを時間で切り替える |
| 骨格 | `js/motion/skeleton.js`（`SKEL`） | 不透明画素から関節を推定（呼吸の切れ目＝腰）。手動修正は `js/data/skeleton-overrides.js` |
| 状態効果・新しい技 | `js/v20-battle.js` | バフ・デバフ・毒…の見せ方（`fx20`）も含む |
| 戦闘画面の UI | `js/v22.js` `v23.js` `v24.js` `v25.js` | DOM の重ね（`#hud` `#labels` `#pops`）、文字（`TX24`）、自分の番だけのパネル |

### 2-1. ver0.17 の「控え」（V17F）と ver0.18 の整理

- `js/ver19-pre.js` が `V17F={hit,doAction,enemyTurn,pop,kill,awaken,end}` で **ver0.18 より前の関数を控え**、
  ver0.19 はその上に組み立てる。ver0.18 の演出が ver0.19 と二重に動かないようにするため。
- そのため ver0.18 の演出（`js/ver18-battle.js` の hit・doAction・enemyTurn・pop・kill・awaken・end の包み、戦闘の描画、
  エフェクト `B.fx2`）は**呼ばれていなかった**。ver0.33 でそれらを外し、今も使われる部分（ボス戦の導入、`heroOpt` などの補助）だけ残した。
- `V17F` の後に包むと飛ばされる。**新しい演出は V17F ではなく、今の関数（`hit` など）を包むこと**。

### 2-2. 味方の絵は全員「1 枚絵＋動き」

- 味方 12 人は新原画（正面・待機・星臨の 3 枚）なので、データは `single`。攻撃・詠唱・被弾などのポーズは、
  `js/sprite/spx.js` の `AWS`（ポーズごとの傾け・ずらし・沈み）で待機の絵を動かして表している。
- 大型アップデートで専用のコマを入れるときは、`assets_src/chars/<id>/` の素材パック（`anims`）か、
  `tools/build_spx_heroes.py` の `BATTLE` のポーズ名で足す（PIPELINE.md 3-3）。コマが入ったポーズから自動で置き換わる。

## 3. 大型アップデートの差し込み口（おすすめ）

1. **技・区分ごとの動き**：`MOTION.add`（js/motion/registry.js）。まず `'*'`（全員）× `'cat:phys_attack'` などの区分で型を作り、
   キャラ・技ごとに上書きする。`strike` を書き換えずに済む。
2. **エフェクト**：`FX19.add(dur, (t, ctx, …) => {...}, layer)` で新しい種類を足し、`MOTION.add` の `fx` から呼ぶ。
   描画は ANIM の時計に乗るので、ヒットストップ・速度変更にそのまま追従する。
3. **コマ**：素材パック（`tools/spx_import.py`）→ `anims` → `MOTION.add` の `keys` で `{pose:{f:'attack@3'}}` のように直接指定（PIPELINE.md 5 章）。
4. **新しいファイル**：`js/battle/` のような専用の場所に置き、`index.html` で `js/v32.js` の後に読む。
   既存の版のファイル（ver16〜v32）にはこれ以上包みを足さない。
5. **確認**：`node tools/smoke.js`（全画面・全種類の敵との戦闘を自動で回し、エラーと画面のはみ出しを集める）。
   演出の見た目は開発者メニューと図鑑（待機・星臨）で目で見る。

## 4. 残っている古い仕組み（今は触らない）

| もの | 場所 | 状態 |
|---|---|---|
| 旧リグ（コードで描くドット絵） | `js/sprite/legacy/` | 原画の無い敵（ヴォルガノン以外の一部）と、味方の骨格の大きさ（`DEF` の base）に使う。消せない |
| 16×16 の旧ドット絵 `IMG` / `SPR` | `js/art.js` `ch*.js` | 一部の古い画面（探索の名残）が参照。戦闘・図鑑・出撃前の画面は SPX に置き換え済み |
| 探索マップ | `js/field.js` `ver18-field.js` | ver0.31 でクエスト制になり入口は無い（`enterField` はクエスト一覧へ） |
| 版ごとの表示・お知らせ | `ver16.js` 〜 `v32.js` の `title` の包み | 版表示を版ごとに上書きしている（`title` は 15 段） |

## 5. 関数の包みの流れ（自動生成：`python3 tools/wrapmap.py`）

<!-- wrapmap:begin -->
| 関数 | 読み込み順の流れ（**太字**＝定義、（控え）＝V17F に控えた時点、＊＝控えを包む） |
|---|---|
| `startBattle` | **engine.js** → ch8.js → ver18-battle.js → ver19.js → v20-battle.js → v21.js → v22.js → v23.js → v24.js → v25.js |
| `run` | **engine.js** |
| `nextActor` | **engine.js** |
| `heroTurn` | **engine.js** → v20-battle.js → v22.js → v25.js |
| `enemyTurn` | **engine.js** → ver19-pre.js（控え） → ver19.js＊ → v20-battle.js → v20-ui.js → v25.js |
| `doAction` | **engine.js** → ch8.js → ver19-pre.js（控え） → ver19.js＊ → v20-battle.js → v20-ui.js → v22.js |
| `hit` | **engine.js** → ver19-pre.js（控え） → ver19.js＊ → v20-battle.js |
| `calc` | **engine.js** → ch8.js → ch9.js → ver19.js → v20-battle.js → v20-battle.js → data/terms.js → v31/core.js |
| `hurt` | **engine.js** → ver19.js → v20-battle.js |
| `kill` | **engine.js** → ver19-pre.js（控え） → ver19.js＊ |
| `pop` | **engine.js** → **ch5.js** → ver19-pre.js（控え） → ver19.js＊ → v25.js＊ |
| `awaken` | **engine.js** → ch8.js → ver19-pre.js（控え） → ver19.js＊ → v22.js → v23.js → v25.js |
| `endAw` | **engine.js** |
| `reso` | **engine.js** → **awaken.js** → ver18-art.js → ver19.js → v22.js |
| `end` | **engine.js** → ver19-pre.js（控え） → ver19.js＊ → v20-ui.js → v31/quests.js |
| `rewards` | **engine.js** → ch8.js → ch9.js → v20-ui.js → v31/core.js → v31/quests.js |
| `enemy` | **engine.js** → v31/enemies.js → v32.js |
| `hero` | **engine.js** → ver18-battle.js → v20-battle.js → v31/items.js → v31/board.js |
| `refresh` | **engine.js** → **ch5.js** → v20-ui.js → v22.js → v24.js → v25.js → v31/quests.js |
| `draw` | **engine.js** → ver16.js → ver17.js → ver19.js → v21.js → v22.js → v23.js → v25.js → sprite/spx.js → v31/quests.js |
| `frameOf` | **sprite/legacy/px.js** → sprite/legacy/px-enemy.js → ver19-art.js → sprite/spx.js |

戦闘以外で 4 回以上包まれている関数：

- `title`（16）：**town.js** → ver16.js → ver18-town.js → ver19.js → v20-ui.js → v21.js → v22.js → v22.js → v23.js → v24.js → v25.js → v30.js → v31/core.js → v31/quests.js → v32.js → v33.js
- `dvMenu`（14）：**dev.js** → ch9.js → ver16.js → ver17.js → ver18-town.js → v20-ui.js → v21.js → v22.js → v23.js → v24.js → v25.js → v29.js → v30.js → v31/quests.js
- `show`（10）：**core.js** → ver17.js → ver18-town.js → v20-ui.js → v20-ui.js → v22.js → v23.js → v23.js → v24.js → v25.js
- `migrate`（8）：**items.js** → ch8.js → ch9.js → ver17.js → ver18-field.js → v31/items.js → v31/quests.js → v32.js
- `townMenu`（6）：**town.js** → ch9.js → ver17.js → v21.js → v23.js → v31/quests.js
- `enterField`（5）：**field.js** → ch8.js → ver17.js → ver18-field.js → v23.js
- `charHTML`（5）：**ver17.js** → v20-ui.js → v22.js → v31/core.js → v31/board.js
<!-- wrapmap:end -->
