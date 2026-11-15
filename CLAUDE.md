# アストラル・ブレイカー — 開発ガイド（Claude 用。まずこれだけ読む）

ブラウザで動く RPG（素の HTML / CSS / JavaScript、ビルドなし）。`index.html` が `js/` の 90 本ほどのスクリプトを順に読み込む。
**後に読み込まれたファイルが、前のファイルの関数を上書きして育ってきた**（`{const _f=f;f=function(){…_f()…}}` の形）。
今の動きの正本は「その関数を最後に上書きしたファイル」。

## 1. トークンを節約する読み方（必ず守る）

- **読まない**：`js/sprite/data/*`（1MB 級の原画データ）・`assets_src/originals/`（`.claude/settings.json` で読み取りを拒否）。
  `tools/pixelfx/` は pixelfx スキルを使うときだけ、その手順どおりに読む。原画を変えるときは `tools/spx_*.py` を通す。
- **行が長い**（1 行 300〜900 文字のファイルが多い）。grep は `| cut -c1-200`、読むときは `sed -n 'a,bp' | cut -c1-400` で範囲を絞る。
- **関数の正本を探す**：`python3 tools/codemap.py 関数名` → 定義と上書きの場所（行番号つき・読み込み順）。最後の行を直す。
  `docs/CODEMAP.md` は全体の索引（大きいので丸ごと読まない。`grep` で引く）。
- **画面を見る**：`python3 -m http.server 8765 &` → `node tools/ui_shots.js <出力dir> [画面名…]`。
  画面名：`party detail detail-sk detail-aw board board-sel board-up board-up-lock battle-turn battle-cmd battle-wk battle-act`。
  画像は scratchpad に出し、必要な部分だけ切り抜いて見る（PIL で crop / 横並び）。スクショは 1 枚ずつより、まとめて 1 枚に並べると安い。
- **壊れていないか**：`node tools/smoke.js --quick`（約 3〜5 分。エラー 0 が合格）。演出を触ったら `--fx` も。
  長いので `run_in_background` で回して、その間に他の作業をする。

## 2. 画面 → 正本のファイル

| 画面・機能 | JS（正本） | CSS |
|---|---|---|
| 星盤・天星盤の画面 | `js/ui/board.js`（`BOARDUI`）。盤面の描画は `ver17.js drawBoard`、天星盤のデータは `v31/board.js`（`V31B`）、ノードの置き換えは `rs/core.js` | `css/ui/board.css` |
| 編成画面 | `js/v38/party.js`（`V38P`） | `css/v38.css`（`.ps38` `.pc38`） |
| キャラ詳細（能力・技・術・星臨） | 骨組み `ver17.js charHTML / equipMenu` → 中身 `js/rs/ui.js`（`RSU`：`skCard` `skillsHTML` `awHTML` `st7HTML`） | `css/rs.css` `css/v38.css` |
| 戦闘：コマンド欄 | `js/rs/ui.js`（`chooseRoot`） | `css/v38.css`（`.c38*`） |
| 戦闘：配置・スライド・HP/BP 表示 | `js/v38/battle-ui.js`（`V38B`） | `css/v38.css` |
| 戦闘：上の帯（対象・弱点/耐性） | `js/v22.js`（`updHud`） | `css/v22.css` `v25.css` `v38.css` |
| 戦闘の決まり（ターン・BP・LP・熟練） | `js/rs/battle.js`（`RSB`）・`js/rs/core.js`（`RSC`）・データ `js/rs/data.js`（`RSD`） | — |
| 演出・モーション | `js/battle/*`（`BX*`）→ スキル `rpg-hero-motion` | — |
| 用語・耐性 | `js/data/terms.js`（`TERMS`） | — |
| 版表示・お知らせ | `js/v38/menu.js`（`VER` `NEWS`） | — |

戦闘システムの詳細は `docs/RS-SYSTEM.md`、素材は `docs/ASSETS.md` `docs/PIPELINE.md`、演出は `docs/FX.md`。

## 3. 書き方の決まり（ファイルを増やさないために）

1. **新しい「verXX」の上書きファイルを作らない**。直す場所が 1 か所にあるなら、そのファイルをその場で直す。
2. 1 つの画面を大きく作り直すときだけ、`js/ui/<画面>.js` ＋ `css/ui/<画面>.css` に**その画面の正本を 1 本**作り、
   古い上書きの連鎖はそこで置き換える（例：`js/ui/board.js`）。ファイル先頭のコメントに「何の正本か・何を置き換えたか」を書く。
3. 置き換えて使われなくなった古いコードは、動きを確かめてから消してよい（`codemap.py` で他から呼ばれていないことを確認）。
4. ファイル先頭に `/* ===== 役割 ===== */` の 1 行見出しを書く（`codemap.py` が索引に使う）。
5. 1 ファイルは 30KB 程度まで。超えそうなら画面・機能ごとに分ける。
6. 新しいファイルは `index.html` の読み込み順に追加し、`python3 tools/codemap.py` で索引を作り直す。
7. 画面の文字は少なく。説明はレイアウト・色・アイコンで伝え、詳しくはタップで出す（ver0.39 の方針）。
8. コミットメッセージは日本語で、何を・なぜを短く。版を上げたら `js/v38/menu.js` の `VER` と `NEWS`、`index.html` の `<title>`。

## 4. 大きな更新の進め方（オーケストレーション）

複数の画面・機能にまたがる依頼は、メインが計画と統合、作業は `.claude/agents/` の役割に分ける：

| 役割 | エージェント | モデル | 使いどころ |
|---|---|---|---|
| 調べる | `code-locator` | haiku | 「この表示はどこで作られているか」を、ファイル:行と要点だけで返す（ファイルの中身を持ち帰らない） |
| 作る | `screen-builder` | sonnet | 1 画面・1 機能の実装と、`ui_shots.js` での確認 |
| 確かめる | `qa-runner` | haiku | `smoke.js` を回してエラーだけを短く報告 |

- 依存のない画面は並列に（`isolation: "worktree"` で衝突を避ける）。同じファイルを触る作業は 1 つのエージェントにまとめる。
- 小さな修正（数か所の編集）はエージェントを使わずメインで直接やる方が安い。
- エージェントへの指示には「直すファイルと関数名（codemap の結果）」「完了の条件」「返す形（差分の要約・スクショのパス）」を書く。

## 5. スキル（`.claude/skills/`。新しいセッションでも自動で使える）

| スキル | 用途 |
|---|---|
| `pixelbolt-pixel-art` | ドット絵のレシピ（JSON）→ PNG/GIF/シート。エフェクトのプリセット多数（`npx -y pixelbolt@0.17.0`） |
| `pixel-art-studio` | Python/Pillow で 1 ドットずつ描く |
| `pixelfx` | コードのドット絵エフェクト 244 種（`tools/pixelfx`） |
| `rs-style-sprite` | この作品の RS 風キャラ・敵のドット絵の規格と検査 |
| `rpg-hero-motion` | 戦闘モーション・技の演出 |
| `rpg-equipment-icon` | 装備アイコン |

pixelbolt を最新版に上げるとき：`npx -y pixelbolt@latest skill install` → `~/.claude/skills/pixelbolt-pixel-art` を `.claude/skills/` に上書きコピーしてコミット。
