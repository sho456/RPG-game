# アストラル・ブレイカー — 開発ガイド（Claude 用。まずこれだけ読む）

ブラウザで動く RPG（素の HTML / CSS / JavaScript、ビルドなし）。`index.html` が `js/` の 90 本ほどのスクリプトを順に読み込む。
**後に読み込まれたファイルが、前のファイルの関数を上書きして育ってきた**（`{const _f=f;f=function(){…_f()…}}` の形）。
今の動きの正本は「その関数を最後に上書きしたファイル」。

## 0. 出力の言語（必ず守る）

- ユーザーへの出力は**途中経過も含めてすべて日本語**で書く（進み具合の報告・質問・まとめ・コミットメッセージ・成果物のページ）。
- コード中の識別子やコマンドはそのままでよいが、説明の文は日本語にする。

## 1. トークンを節約する読み方（必ず守る）

- **読まない**：`js/sprite/data/*`（1MB 級の原画データ）・`assets_src/originals/`（`.claude/settings.json` で読み取りを拒否）。
  `tools/pixelfx/` は pixelfx スキルを使うときだけ、その手順どおりに読む。原画を変えるときは `tools/spx_*.py` を通す。
- **行が長い**（1 行 300〜900 文字のファイルが多い）。grep は `| cut -c1-200`、読むときは `sed -n 'a,bp' | cut -c1-400` で範囲を絞る。
- **関数の正本を探す**：`python3 tools/codemap.py 関数名` → 定義と上書きの場所（行番号つき・読み込み順）。最後の行を直す。
  `docs/CODEMAP.md` は全体の索引（大きいので丸ごと読まない。`grep` で引く）。
- **画面を見る**：`python3 -m http.server 8765 &` → `node tools/ui_shots.js <出力dir> [画面名…]`（別のポートなら `URL=http://localhost:ポート/index.html`）。
  エージェントを並行で動かすときは、ポートを分ける（例：メイン 8790、エージェントごとに 8791〜）。同じポートだと別のフォルダの画面を見てしまう。
  画面名：`home home-sheet td-map td-prep td-battle unit unit-detail unit-sheet board board-sel board-up board-up-lock equip-info smith growth inv zukan`。
  `SCROLL=1` で下の欄を最後までスクロールした画面（`_2.png`）も撮る。
  画像は scratchpad に出し、必要な部分だけ切り抜いて見る（PIL で crop / 横並び）。スクショは 1 枚ずつより、まとめて 1 枚に並べると安い。
- **壊れていないか**：`node tools/smoke.js --quick`（TD 向け。タイトル→ホーム→各ボタン→全ステージの `TDS.run`→出撃準備と出撃→仲間画面→図鑑。エラー 0 が合格）。戦闘画面を触ったら `--fx`（TD の戦闘を ×2 で最後まで）も。長いので `run_in_background` で回して、その間に他の作業をする。

## 2. 画面 → 正本のファイル

| 画面・機能 | JS（正本） | CSS |
|---|---|---|
| 星盤・天星盤の画面 | `js/ui/board.js`（`BOARDUI`）。盤面の描画は `ver17.js drawBoard`、天星盤のデータは `v31/board.js`（`V31B`）、ノードの置き換えは `rs/core.js` | `css/ui/board.css` |
| 装備品の詳細（装備アイコンのタップ） | `js/ui/equip-info.js`（`EQINFO`。アイコンに `data-eqi=uid` を付けると開く） | `css/ui/equip-info.css` |
| 属性耐性（防具の種類ごとの表・キャラの合計・被ダメージの倍率）と属性の六角の印（弱点＝赤︿・耐性＝青﹀。装備で共通 `ELR.chip`） | `js/data/resist.js`（`ELR`） | `css/ui/equip-info.css`（`.elh` `.elx`） |
| 装備の能力影響（基礎ステータスだけ） | `js/data/equip7.js`（`EQ7`） | — |
| 技・術の練達（3 段階・錬磨石。旧 技Lv） | `js/rs/mastery.js`（`RSM`：データ・強化。仲間画面が使う） | `css/ui/skill.css`（`.ms47`） |
| 用語の緑のハイライト＋タップで説明 | `js/ui/keywords.js`（`KW.mark`） | `css/ui/keywords.css` |
| 旧画面の入口（強化メニューのタイルなどが呼ぶ `partyScreen` `openSheet` `board` `bondMenu` `trialMenu` を仲間画面へ向けるだけ） | `js/ui/party.js` | — |
| 鍛冶屋（品揃え・強化・OP付替・ソケット） | `js/ui/smith.js`（`smith`・`enhance` を置き換え。OP・ソケットの後半は `town.js opSwap / sockMenu`） | `css/ui/smith.css` |
| タイトル（タップで開始） | `js/v38/menu.js`（`titleTap`） | `css/ui/font.css` |
| 戦闘の数値データ（武器種・技・LP など。TD が武器種を読む） | `js/rs/data.js`（`RSD`）・`js/rs/core.js`（`RSC`：能力値・習得・セーブ）。ターン制の進行 `js/rs/battle.js` は ver0.53 で削除 | — |
| 文字のフォント（全画面で統一） | 本文＝M PLUS 1p、コマンド（ボタン・技名・名前・見出し・タブ）＝Kaisei Tokumin（`css/ui/font.css` の `--cmd`）。キャンバスの数字・英字は各画面のコード | `css/ui/font.css` |
| 用語・耐性 | `js/data/terms.js`（`TERMS`） | — |
| 強化メニュー（経験値のストック・レベルアップ・旧酒場の統合） | `js/ui/growth.js`（`GROW`） | `css/ui/growth.css` |
| 版表示・お知らせ | `js/v38/menu.js`（`VER` `NEWS`） | — |
| **タワーディフェンス「灯守の防衛線」**（移行先の戦闘。入口＝ホーム右の縦メニュー「防衛」・`index.html#td`） | データ `js/td/data.js`（`TDD`）・章とステージ `js/td/stages.js`・ロジック `js/td/sim.js`（`TDS`。DOM なしの固定刻み・自動の配置 `bot`）・背景 `js/td/bg.js`（`TDBG`）・戦闘画面（横スクロール）`js/td/view.js`（`TD`）・章の地図/出撃準備/会話/加入 `js/td/menu.js`（`TDM`）。設計 `docs/TD-DESIGN.md` | `css/ui/td.css` |
| **ホーム**（ver0.52。TD の「防衛」が主役・下のタブ 4 つ・≡ のシート） | `js/ui/home.js`（`HOME`。v22 の townMenu の重ね表示 .h22 を置き換え。背景の街の絵は v22 drawHome のまま） | `css/ui/home.css` |
| **仲間**（ver0.52。一覧＋1 人の詳細で Lv・技の練達・装備・星盤をまとめる。TD の能力を表示） | `js/ui/unit.js`（`UNIT.open(id, 戻り先)`）。TD の能力は `TDD.hero(id, lv, TDD.real(id))`（装備の比・練達・星臨の位階を反映） | `css/ui/unit.css` |
| デザイントークン（新しい画面はこれ以外の色・角・影を使わない） | — | `css/ui/tokens.css` |

**方針（2026-11）：コマンドRPG → タワーディフェンスへ移行済み**（縦画面・横スクロールの戦場・灯域・本編 8 章を 6 章に）。旧コマンド戦闘（`startBattle` 系・`js/rs/battle.js`・`js/battle/*` など）は ver0.53 で削除した。戦闘の作業は `js/td/` と `docs/TD-DESIGN.md` に。古い版ファイル（ver16〜v38）には、ホーム・図鑑・持ち物・鑑定・鍛冶・星盤・セーブが使う部分だけが残っている（旧画面の入口は `js/ui/party.js` で仲間画面へ）。

戦闘システムの詳細は `docs/RS-SYSTEM.md`、素材は `docs/ASSETS.md` `docs/PIPELINE.md`、演出は `docs/FX.md`。

## 3. 書き方の決まり（ファイルを増やさないために）

1. **新しい「verXX」の上書きファイルを作らない**。直す場所が 1 か所にあるなら、そのファイルをその場で直す。
2. 1 つの画面を大きく作り直すときだけ、`js/ui/<画面>.js` ＋ `css/ui/<画面>.css` に**その画面の正本を 1 本**作り、
   古い上書きの連鎖はそこで置き換える（例：`js/ui/board.js`）。ファイル先頭のコメントに「何の正本か・何を置き換えたか」を書く。
3. 置き換えて使われなくなった古いコードは、動きを確かめてから消してよい（`codemap.py` で他から呼ばれていないことを確認）。
4. ファイル先頭に `/* ===== 役割 ===== */` の 1 行見出しを書く（`codemap.py` が索引に使う）。
5. 1 ファイルは 30KB 程度まで。超えそうなら画面・機能ごとに分ける。
6. 新しいファイルは `index.html` の読み込み順に追加し、`python3 tools/codemap.py` で索引を作り直す。
7. **画面の文字は少なく（ユーザーの指示・必ず守る）**：不要なセカンダリラベル（小さな補足の字・「〜できる」「〜をタップ」などの説明・見出しの下の説明文）を付けない。
   **意味はレイアウト・色・形・アイコン・位置で伝える**（例：使える＝灯の色、使えない＝虚蝕の灰紫、選択中＝枠、役割＝色の帯）。詳しくはタップで出す。
   新しい画面を作ったら、撮影して「消しても意味が通じる字」が無いか見直してから終える。
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
| `rpg-hero-motion` | 戦闘モーション・技の演出 |
| `rpg-equipment-icon` | 装備アイコン |
| `rs-battle-fx` | 技・術の演出の設計（録画の実測：吹き出し→暗転→溜め→放出→着弾→明けの時間割・剣の振りの周期・術の段取り・エフェクトの色・効果音のレシピ・背景）と、参考を写さず応用・進化させる決まり。録画の分析 `scripts/vref.py` |
| `td-stage-author` | TD のステージ・WAVE・道と台座・灯域・敵の型・仲間の加入と会話（`js/td/stages.js`） |
| `td-sim-balance` | TD の難易度の計測と調整（`tools/td_sim.js`。自動の配置で何十回も戦わせる・`--tune` で敵の HP 倍率を自動で探す） |
| `rs-battle-flow` | ロマサガRS風の戦闘の流れと表示（HP/BP のタイミング・Critical/Weak・強化弱体・数字・区切り）。デモ `tools/battle_demo.js`・コマの一覧 `tools/frame_grid.py` |

**PixelLab（MCP サーバー `pixellab`、AI のドット絵生成・アニメ・タイル・効果音。有料の回数制）**：クラウドでは環境「rpg-game」の起動スクリプトが `claude mcp add -s user -t http pixellab https://api.pixellab.ai/mcp` で登録し、API キーは環境のネットワークシークレット（api.pixellab.ai）からプロキシが付ける（キーをリポジトリに書かない）。手元の PC では `claude mcp add pixellab https://api.pixellab.ai/mcp -t http -H "Authorization: Bearer <キー>"`。使い方は `search_help`、残りの回数は `get_balance`。生成した絵はセレス案1・案2の絵柄（`assets_src/pixel-art/celes-48`・`celes-hd`）に合わせて手直ししてから取り込む。

pixelbolt を最新版に上げるとき：`npx -y pixelbolt@latest skill install` → `~/.claude/skills/pixelbolt-pixel-art` を `.claude/skills/` に上書きコピーしてコミット。
