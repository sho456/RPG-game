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
  画面名：`home home-sheet td-map td-prep cb-battle unit unit-detail unit-sheet board board-sel board-up board-up-lock equip-info smith growth inv zukan`。
  `SCROLL=1` で下の欄を最後までスクロールした画面（`_2.png`）も撮る。
  画像は scratchpad に出し、必要な部分だけ切り抜いて見る（PIL で crop / 横並び）。スクショは 1 枚ずつより、まとめて 1 枚に並べると安い。
- **壊れていないか**：`node tools/smoke.js --quick`（タイトル→ホーム→各ボタン→全ステージの WAVE の確認→出撃準備と出撃（旧戦闘で技を選び AUTO）→仲間画面→図鑑。エラー 0 が合格）。戦闘を触ったら `--fx`（旧戦闘を AUTO で結果まで）も。長いので `run_in_background` で回して、その間に他の作業をする。サーバーのポートが 8765 以外なら `--url`。

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
| 鍛冶屋（品揃え・強化・OP付替・ソケット） | `js/ui/smith.js`（`smith`・`enhance`・OP付替・ソケットまで。枠は `FAC`） | `css/ui/smith.css` |
| 持ち物・鑑定（施設の共通の枠 `FAC`） | `js/ui/inv.js`（`FAC`・`INV`=`invMenu`・`APR`=`appraise`） | `css/ui/inv.css` |
| 図鑑の一覧 | `js/ui/zukan.js`（`ZKUI`。データと詳細は `js/zukan/zukan.js`） | `css/ui/zukan.css` |
| タイトル（タップで開始） | `js/v38/menu.js`（`titleTap`） | `css/ui/font.css` |
| 戦闘の数値データ（武器種・技・LP など。TD が武器種を読む） | `js/rs/data.js`（`RSD`）・`js/rs/core.js`（`RSC`：能力値・習得・セーブ）。技・術は 1 人 4 つ（data.js の末尾で 6→4 に統合）。陣形は立ち位置だけ | — |
| 文字のフォント（全画面で統一） | 本文＝M PLUS 1p、コマンド（ボタン・技名・名前・見出し・タブ）＝Kaisei Tokumin（`css/ui/font.css` の `--cmd`）。キャンバスの数字・英字は各画面のコード | `css/ui/font.css` |
| 用語・耐性 | `js/data/terms.js`（`TERMS`） | — |
| 強化メニュー（経験値のストック・レベルアップ・旧酒場の統合） | `js/ui/growth.js`（`GROW`） | `css/ui/growth.css` |
| 版表示・お知らせ | `js/v38/menu.js`（`VER` `NEWS`） | — |
| **戦闘**（ver0.63 で ver0.49 のロマサガRS風の戦闘に戻した。強化・弱体のアイコン `js/ui/battle-status.js`・星臨と奥義のカットイン `js/battle/showcase.js`・2D-HD と注目画面 `js/battle/hd2d.js`。入口＝ホームの「出撃」→章のステージ→出撃準備（4 人）） | ステージの WAVE の進行・結果・背景 `js/battle/stage.js`（`STG`）。戦闘そのものは旧の上書きの連鎖（`startBattle` `doAction` `hit` `end` … `python3 tools/codemap.py 関数名` で正本を引く。主に `js/rs/battle.js`・`js/rs/ui.js`・`js/v38/battle-ui.js`・`js/battle/*`・`js/ui/battle-pop.js`・`js/v20-battle.js`・`js/v24.js`・`js/v25.js`）。技・術・アビリティ・陣形は `js/rs/data.js`・`js/rs/core.js`（ver0.49 の版）。セレスだけ今のコマ送りと演出 `js/battle/celes.js`（`CEL`。`V19.dr` で TDA、doAction/hit/awaken で TDFX・FXC・FXU）。章の地図/出撃準備/会話/精算 `js/td/menu.js`（`TDM`）・章とステージ `js/td/stages.js` | `css/v24.css` `css/v25.css` `css/battle.css` `css/ui/battle-*.css` `css/ui/damage.css`（地図と出撃準備は `css/ui/td.css`） |
| **ホーム**（ver0.52。「出撃」が主役・下のタブ 4 つ・≡ のシート） | `js/ui/home.js`（`HOME`。v22 の townMenu の重ね表示 .h22 を置き換え。背景の街の絵は v22 drawHome のまま） | `css/ui/home.css` |
| **仲間**（ver0.52。一覧＋1 人の詳細で Lv・技の練達・装備・星盤をまとめる。ver0.60 からコマンド戦闘の能力） | `js/ui/unit.js`（`UNIT.open(id, 戻り先)`）。能力は本編の `stats(id)`、奥義の位階は `TDD.hero(...).ult` | `css/ui/unit.css` |
| **仲間のコマ送り・エフェクト**（ver0.59。まずセレス。コマンド戦闘でもそのまま使う） | 状態→アニメ・再生ロック・表示用の向き・整数倍の描画・焼き込み fx 層 `js/td/uanim.js`（`TDA`。u.actK/actT/hitT/awT/mv を見る）。光と粒の共通部品 `js/td/fxkit.js`（`FXK`）。セレスの通常攻撃・技 `js/td/fx-celes.js`（`FXC`）、星臨・奥義 `js/td/fx-celes-ult.js`（`FXU`）。素材：原画 `assets_src/pixel-art/celes-hd/src/master/`（PixelLab のシートは `pl/`）→ `import_pl.py` → `assets_src/chars/celes/` → `python3 tools/spx_import.py build celes`（パック `celes_hd`・`celes_hd_fx`） | — |
| デザイントークン（新しい画面はこれ以外の色・角・影を使わない） | — | `css/ui/tokens.css` |

**ver0.63（2026-11-26）**：戦闘をユーザーの指示で ver0.49（git `7bbc626`）のロマサガRS風に戻した。旧戦闘を消した 3 コミット（187346e・82ce1c4・bb0d361）の差分を今のファイルに 3-way で戻し、`js/rs/*`・`js/awaken.js` は 0.49 の版。コマンド戦闘（`js/cb/*`・ver0.60〜0.62）は削除。旧開発者メニューの上書きの受け皿 `dvMenu`・`devGear` は `js/core.js`。
**ver0.64（2026-11-26）**：陣形（立ち位置だけ残す）・ひらめき・技セットを廃止し、技・術は 1 人 4 つ（`js/rs/data.js` の末尾で Lv10＋旧ひらめき、星盤＋天星盤を統合）。×1 の待ち `SPD[1]` を 2.3 に。セレスの演出の時計は戦闘の速さに合わせ、最初の命中は演出の着弾まで待つ（`js/battle/celes.js`）。参照されない宣言を `tools/prune.py` で削除。
**ver0.65（2026-11-26）**：並びを左右の縦一列に（味方 `js/v38/battle-ui.js` の placeHeroes・敵 `js/v23.js` の ANC）。強化・弱体のアイコンとタブ `js/ui/battle-status.js`（`BST`）。星臨・奥義のカットイン `js/battle/showcase.js`（`SHOW`。奥義は `js/rs/battle.js` の heroExec から）。難易度はステージごとの敵 Lv の増減 `STG.TUNE`・ボスの倍率 `TUNEB`。計測 `node tools/stage_sim.js [--runs 2] [ステージ…]`（推奨 Lv・その章までの 4 人・レア装備で AUTO）。AUTO の全力は `AM='f'`（ver17.js）。
**ver0.66（2026-11-26）**：2D-HD の戦闘画面と注目画面 `js/battle/hd2d.js`（`HD`。`css/ui/battle-hd.css`）：背景の被写界深度・霧・床の光・光の粒・周辺減光（`ver19.js drawBattle` の差し込み口 `V19.pre` `V19.post`）、奥ほど小さい斜めの縦一列（placeHeroes の `DZ`・v23 の ANC と scM）、味方の技・術・奥義と星臨の間は行動する味方と相手だけ写し、二人を中央に寄せて（`gather`/`scatter`）カメラが大きく寄る（`V19.vis`・`#app.fc66`）。行動ごとの区切りは `js/rs/battle.js` の行動の列の待ち。強化・弱体のアイコンはコマンド欄の顔の横と上の敵の欄（`BST`）。上の敵の欄をコンパクトに。敵の行動中は狙いの輪を出さない（v22 reticle）。セレスの顔・立ち絵・図鑑（ZIMG と動く絵 ZVIEW）・編成・カットイン（星臨は aw_idle）は celes_hd のコマ（`SPX.unitCv`・`face`・`art`・`ZVIEW`・`V19.art` を包む）。強化・弱体のタップはそのキャラだけの一覧。
**ver0.67（2026-11-27）**：演出専用画面は奥義と星臨だけ（`HD` の run：暗転 `#fcbk`→寄せ→カメラ→数字を見せ切って消す→暗転で戻る）。セレスの技・術の演出 `js/battle/fx-celes-rs.js`（`CFX`：刻の矢・遅延の砂・クロノスロウ・加速の刻。時間割 `DEF[id].imp` で数字を待つ。TD の FXC の cast は使わない）。星臨のカットインの一枚絵 `img/cutin/celes_aw.png`（`SHOW` の `CUT`）。
**次の作業**：セレス以外の仲間を今のコマ送りにするなら `js/battle/celes.js` の `ID` を広げる（TDA の素材が要る）。旧戦闘の演出の知見はスキル `rs-battle-flow` `rs-battle-fx` `rpg-hero-motion`。
旧コードの整理の道具：`node tools/smoke.js --cov cov.json`（一度も呼ばれなかった関数）→ `python3 tools/deadcode.py cov.json`（ファイルごとの候補）・`python3 tools/prune.py cov.json [--apply]`（名前でも参照されない宣言を消す）。smoke が通らない画面の関数も 0 回になるので、消す前に画面で確かめる。
現在地は上の ver0.63 の行。コマンド戦闘（ver0.60〜0.62）の設計は git の履歴（docs/CB-DESIGN.md）。

**方針（2026-11-26）**：タワーディフェンス（ver0.50〜0.59）→ コマンド戦闘（ver0.60〜0.62）を経て、ver0.63 で戦闘は ver0.49 の旧戦闘に戻した。ファイル名の `td` は章・ステージ・セレスの演出の部品として残っている（`TDD` `TDM` `TDFX` `TDA` など）。

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
| `td-stage-author` | 章のステージ・WAVE・敵・仲間の加入と会話（`js/td/stages.js`）。WAVE は `STG.wavesOf`（`js/battle/stage.js`）で 1 戦 4 体までに読み替え |
| `rs-battle-flow` | ロマサガRS風の戦闘の流れと表示（HP/BP のタイミング・Critical/Weak・強化弱体・数字・区切り）。デモ `tools/battle_demo.js`・コマの一覧 `tools/frame_grid.py` |

**PixelLab は rpg-game の環境では切ってある**（2026-11-27。起動スクリプトの MCP 登録を削除。ネットワークシークレット api.pixellab.ai のキーは環境の設定から手動で外す）。ドット絵は `pixel-art-studio`・`pixelbolt-pixel-art`・`pixelfx` と手描きで作る。

pixelbolt を最新版に上げるとき：`npx -y pixelbolt@latest skill install` → `~/.claude/skills/pixelbolt-pixel-art` を `.claude/skills/` に上書きコピーしてコミット。
