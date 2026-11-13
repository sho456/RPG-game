# ドット絵・アニメーション制作パイプライン（ver0.30）

キャラクターのデザイン・配色・体格を保ったまま、待機・戦闘アニメーションを効率よく量産するための工程。
ファイルの役割とデータ形式は [ASSETS.md](ASSETS.md)。

---

## 0. 結論（推奨する工程）

```
[1] マスター原画          [2] アクションの連続フレーム        [3] ゲーム素材へ加工            [4] ゲーム内で確認
 正面・待機・星臨を承認 →  マスター 1 枚から 1 アクション  →  tools/spx_import.py build   →  tools/spx_qa.py
 （画像生成＋既存原画を     ＝ 1 本の image-to-video        （縮尺統一・足元合わせ・        開発者メニュー
   identity-ref に）         → Forge で抜き・位置合わせ・       共通パレット・複数サイズ・      「基準画像の並び」・図鑑・戦闘
                              ループ選択・HD 仕上げ             アトラス化・anims 書き出し）
```

- **アニメーションは「マスター 1 枚 → アクションごとの動画 → コマ」**（Agent Sprite Forge の video2dsprite 方式）を採用する。
  シートを 1 枚の画像で生成する方式は、コマごとに顔・装備・体格が揺らぎやすく、キャラクターの同一性で劣る。
- **ピクセル化はゲーム側で行う**。Forge の仕上げは **HD**（全色・きれいな透過・足元固定の面積平均）で止め、
  ゲームの複数サイズ（b42〜B104・探索 f34・一覧 u36）とキャラごとのパレットへの変換は `spx_import.py` が一括で行う。
  Forge の pixel 仕上げは 1 サイズしか作らず、ゲームの「サイズごとに原画から縮める」作り（ドットを拡大縮小しない）と合わないため。
- **縮尺の正本は 1 つ**：マスター原画の正面の背丈。全ポーズ・全コマ・星臨を同じ倍率で縮める（2 章）。
- 生成が使えない環境でも、2〜4 の工程（手描き・外部ツールのコマ、既存の動画の取り込み）はそのまま使える。

## 1. 調査結果：使える道具（2026-11-13 時点の確認）

`python3 <Forge>/skills/generate2dmedia/scripts/forge_doctor.py --host-tools none` の結果：

| 機能 | 状態 | 備考 |
|---|---|---|
| 画像生成（マスター原画） | **使えない** | API キー（OpenAI / Gemini / xAI / BytePlus / fal.ai）未設定、Codex・Grok CLI 未導入 |
| 参照付きの画像編集 | **使えない** | 同上 |
| image-to-video（アクション動画） | **使えない** | 同上（xAI・BytePlus・fal.ai のキー、または Grok CLI が必要） |
| 動画・コマの後処理 | **使える** | ffmpeg 6.1.1、numpy・Pillow・scipy。抜き・位置合わせ・ループ選択・仕上げ・書き出し |
| codeart2d（コードで描く絵） | 使えるが**不採用** | 提供原画の描き込み（顔・髪・装備の陰影）を再現できない。図形の FX・UI 向け |

- 有料 API は**キーを設定した時点で利用の同意**とみなされ、呼び出しごとの確認が無い（Forge の仕様）。
  キーを設定するかどうか・どの提供元を使うかは持ち主が決めること。今回は設定も課金もしていない。
  使う場合は `~/.config/agent-sprite-forge/config.json` に置き、`--budget-usd` / `FORGE_MAX_PAID_REQUESTS` で上限を付ける。
  `route_media.py ... --dry-run` で、送らずに経路と見積もり（`estimateUsd`）だけを確認できる。
- 実際に確認したこと：Forge の **抜き（video2dsprite process）→ ループ選択（gait_loop select）→ HD 仕上げ（finish_frames hd）**
  を手元の動画で通し、その出力を `spx_import.py` で取り込んで、図鑑・戦闘で再生できることを確認した（6 章）。

### 方式の比較

| 方式 | 同一性・配色 | 動きの滑らかさ | ドット品質 | 量産性 | 判定 |
|---|---|---|---|---|---|
| A. マスター → image-to-video → Forge 後処理 → spx_import | ◎ 1 枚の承認画から全アクション。色はマスターに固定（colour lock） | ◎ 動画の中割り | ○ 原画から各サイズへ面積平均＋パレット化（現行と同じ質） | ◎ sprite_set.py が再撮影まで自動 | **採用（生成の経路が使えるとき）** |
| B. 手描き・外部ツール（Aseprite 等）のコマ → spx_import | ◎ 描き手次第 | ○ 枚数次第 | ◎ | △ 人手 | **採用（生成なしの経路）** |
| C. 画像生成でシート 1 枚 → generate2dsprite process | △ コマごとに揺らぐ | △ | ○ | ○ | FX・小物だけ |
| D. 現行：1 枚絵を整数ドットで動かす（spx.js） | ◎ | △ 呼吸・傾け程度 | ◎ | ◎ 追加作業なし | 連続フレームが無いポーズの代わりとして残す |
| E. codeart2d（コードで描く） | × 原画の描き込みが出ない | ○ | ○ | ○ | 不採用（FX・UI のみ） |

A と B は同じ取り込み口（`spx_import.py`）・同じ確認（`spx_qa.py`）を通るので、混ぜて使える。
連続フレームの無いポーズは自動で D（現行の 1 枚絵の動き）になり、ゲームは壊れない。

## 2. 縮尺の決まり（通常・星臨・全アクション共通）

1. **基準**：マスター原画の `front`（正面）の背丈（不透明画素の高さ）。`character.json` の `scale.ref`。
2. サイズ sk のドット数 dots に対し **k = dots ÷ 基準の背丈**。全ポーズ・全コマに同じ k を使う。
3. **星臨**は同じ k に `scale.seirin`（既定 1.0）を掛ける。星臨のマスターは「通常と同じ頭の大きさ・同じ背丈」で作る。
   翼・光輪・オーラなどの付属物は外枠を広げてよいが、**体（頭・胴・脚）は通常と同じ大きさ**。
4. **連続フレーム**（解像度が違う素材）は、1 コマ目の背丈をマスターの同名ポーズ（`matchPose`）の背丈に合わせてから k で縮める。
5. **足元**：静止画は 1 枚ずつ足元（最下段付近の不透明画素の中央）。連続フレームは**全コマ共通の基準点**（1 コマ目の足元）。
   コマごとに切り詰めないので、足元は滑らない。
6. 既存の旧データの星臨は `assets_src/character_scale.json` の倍率で補正済み（実測：目の高さの比）。

| 星臨の補正（ver0.30） | 倍率 | 補正前の大きさ |
|---|---|---|
| セレス | 0.78 | 通常の約 1.28 倍 |
| シオン | 0.80 | 約 1.25 倍 |
| バルザ・エルナ | 0.87 | 約 1.15 倍 |
| ハクア | 0.88 | 約 1.14 倍 |
| ミレイユ・ノア・ガルド・クロウ・リオ・ヴァルク・ジン | 1.0 | ±5% 以内（補正なし） |

## 3. 工程

### 3-1. 素材パックを作る

```bash
python3 tools/spx_import.py init <id>            # 味方（hum）。敵は --kind mon
```

`assets_src/chars/<id>/` に `character.json`（設定）・`master/`・`anim/idle/`・`refs/` ができる。
既存のキャラと同じ id にすると、そのキャラの絵を差し替える（`spx-data-chars.js` は他のデータより後に読み込まれる）。
名前が `_` で始まるフォルダ（見本・作業中）は、名前を指定したときだけ作られる。

### 3-2. マスター原画（公式な基準画像）

`master/front.png`（正面）・`master/stance.png`（待機＝戦闘の側面の構え）・`master/seirin.png`（星臨）を用意する。
図鑑に載る「正面・待機・星臨」がこの 3 枚で、**以後のすべてのアクションはこの 3 枚から作る**。

- 生成する場合（Forge・経路が使えるとき）：
  ```bash
  F=~/.claude/plugins/cache/agent-sprite-forge/agent-sprite-forge/0.6.0/skills
  python3 $F/generate2dsprite/scripts/master_still.py generate --spec spec.json --takes 3 --output-dir work/<id>/m1
  python3 $F/generate2dsprite/scripts/master_still.py edit --run work/<id>/m1 --take 2 --change "<直す所を 1 つ>" --output-dir work/<id>/m2
  python3 $F/generate2dsprite/scripts/master_still.py approve --run work/<id>/m2 --take 1 --output-dir work/<id>/master
  ```
  `spec.json` の `identity` は `character.json` の `identity` と同じ文。`--identity-ref` に既存の原画
  （`assets_src/originals/`）、`--style-ref` に承認済みの仲間の正面を付ける。依頼文のひな形は
  `assets_src/templates/master_prompt.txt`。**惜しい案は作り直さず edit で 1 か所ずつ直す**。
  承認した `master_rgba.png` を `master/` に置く。
- 手描き・既存原画の場合：透過 PNG（または単色背景。`character.json` の `key` に色）を置くだけ。

### 3-3. アクションの連続フレーム

アクションの一覧・長さ・ゲームのポーズ名との対応は `assets_src/templates/actions.json`。

- 生成する場合（Forge）：
  ```bash
  python3 $F/video2dsprite/scripts/sprite_set.py plan --master work/<id>/master/master.json --actions idle,attack,hurt,cast,guard,victory --finish hd --output-dir work/<id>/set
  python3 $F/video2dsprite/scripts/sprite_set.py run    --plan work/<id>/set/set_plan.json
  python3 $F/video2dsprite/scripts/sprite_set.py review --plan work/<id>/set/set_plan.json   # 出てきた -sheet.png を必ず目で見る
  python3 $F/video2dsprite/scripts/sprite_set.py accept --plan work/<id>/set/set_plan.json --action idle --take 1
  ```
  idle と attack は最後のコマがマスターに戻るよう固定される（`--last-frame`）。色はマスターに固定（colour lock）。
  不合格は `retake --fix never-turn|weapon-shape|face-visible|keep-colours …` で理由を付けて撮り直す。
- 動画が手元にある場合（他のツールで作った動画）：
  ```bash
  python3 $F/video2dsprite/scripts/video2dsprite.py process --video clip.mp4 --output-dir work/<id>/idle/keyed --reference master/stance.png
  python3 $F/video2dsprite/scripts/gait_loop.py select --frames-dir work/<id>/idle/keyed/frames-clean --fps 12 --kind idle --output-dir work/<id>/idle/loop
  python3 $F/video2dsprite/scripts/finish_frames.py hd --frames work/<id>/idle/keyed/frames-clean --output-dir work/<id>/idle/fin --target-height 256 --role hero --character <id>
  ```
  2 本目以降のアクションは `--target-height` の代わりに `--scale-ref work/<id>/idle/fin`（同じキャラは同じ縮尺）。
  攻撃などの一回の行動は `retime.py --auto-oneshot --duration 700 --key hit=<命中コマ>@0.4+80`。
- 手描きの場合：**固定キャンバス**（全コマ同じ大きさ・足元の位置が同じ）で `anim/<アクション>/frame_000.png …` を書き出す。

`character.json` に登録する：

```json
"anims": {
  "stance": {"dir": "../../../work/<id>/idle/fin/frames", "selection": "../../../work/<id>/idle/loop/selection.json", "loop": true, "matchPose": "stance"},
  "attack": {"dir": "anim/attack", "fps": 12, "loop": false, "matchPose": "stance"}
},
"seirinAnims": {"awk": {"dir": "anim/seirin_idle", "fps": 8, "loop": true, "matchPose": "awk"}}
```

- キー名＝ゲームのポーズ名。`stance`（待機）・`awk`（星臨）・`guard`・`weak`・`win`・`idle`（敵）など、
  **ループするポーズはキー名と同じポーズの場面で自動再生**される。
- `selection` は Forge の `gait_loop` / `retime` が選んだコマと表示時間をそのまま使う。`range: [開始, 終わり]` でも指定できる。
- 足元の基準点を手で決めたいときは `"anchor": [x, y]`（元の解像度）。

### 3-4. ゲーム素材へ加工

```bash
python3 tools/spx_import.py build [<id> ...] --preview work/preview    # → js/sprite/data/spx-data-chars.js
```

背景抜き・縮尺の統一・足元合わせ・キャラごとのパレット（k-means、最暗色＝輪郭色を最後）・
全サイズへの縮小（小さいサイズは孤立した粒を除き、輪郭を最暗色でなぞる）・アトラス化・
`anims`（コマ名 `<ポーズ名>@<番号>`・表示時間・ループ）・顔グラ（heads）の書き出しまで自動。

### 3-5. 確認（数値と目視）

```bash
python3 tools/spx_qa.py check                                   # 一覧サムネイルの収まり・星臨のサイズの欠け
python3 tools/spx_qa.py lineup --out work/lineup.png --size b60 # 正面・待機・星臨を同じ縮尺・同じ足元で並べる
python3 tools/spx_qa.py anims  --out work/qa --ids <id>,<id>_K  # 連続フレームの点検＋コマの並び（1 コマ目の輪郭を重ねる）
```

| 点検 | 内容 | 基準 |
|---|---|---|
| frame-size / anchor | 全コマが同じ大きさ・同じ基準点 | 違えば FAIL |
| foot-slide | コマごとの足元の横ずれ（足元の滑り） | 1 ドット超 WARN・2 ドット超 FAIL |
| pose-anchor | 同名の静止ポーズとの足元の差（切り替えで跳ばないか） | 同上 |
| height | 背丈の変化（形の崩れ・縮尺の揺れ） | ±8% 超 WARN |
| colour-drift | 色の使い方の 1 コマ目との差（配色の変化） | 0.25 超 WARN |
| loop-seam | ループのつなぎ目の飛び | 中央値の 2.5 倍超 WARN |
| thumb-fit | 図鑑の一覧の枠に対する絵の大きさ | 85% 未満 WARN・70% 未満 FAIL |

数値は症状を見つけるだけ。**顔・装備の形・向き・同一性は必ず画像を目で見て判断**する。

### 3-6. ゲーム内で確認

開発者モード → 「ver0.30 図鑑・縮尺」：

- **基準画像の並び**：全員の 正面・待機・星臨 を同じ縮尺で並べる（サイズを b42〜B84 で切り替え）。赤線＝足元
- **図鑑を開く**：正面・待機・星臨（同じキャンバス・同じ倍率・同じ足元）。待機・星臨は戦闘と同じ動き
- **星臨の縮尺を戦闘で確認**：開発者モードは星臨のボタンをすぐ押せる。通常 → 星臨で体格が変わらないこと

見る所：フレーム間のズレ・配色の変化・形の崩れ・足元の滑り・ループのつなぎ目・通常と星臨の体格・向き。

## 4. 戦闘での使われ方（ランタイム）

- `anims` にあるポーズは、戦闘・図鑑で時間に合わせてコマを切り替える（`SPX.animFrame`）。
  素材に呼吸が描かれているので、従来の 1 ドット沈め（breath）は止まる。キャラごとに位相をずらす。
- `anims` の無いポーズは従来どおり 1 枚絵を整数ドットで動かす（`AWS`・`monShape`）。
- 新しい敵は `character.json` の `rig`（`{"base":"slime","wid":42,"hgt":45}`：動きの土台にする旧リグと大きさ）を書けば
  `spx.js` が自動で登録する。味方は同じ id の旧リグがあれば自動。

## 5. 一回の行動（攻撃・詠唱・被弾）を振り付ける

一回の行動の連続フレームはコマ名で直接並べる（`js/motion/registry.js` の `MOTION.add`）：

```js
// attack を 8 コマ（attack@0〜7）で作った場合。命中は 4 コマ目
MOTION.add('rio', 'cat:phys_normal', {approach: true, keys: [
  {pose: {f: 'attack@0'}, ms: 80}, {pose: {f: 'attack@1'}, ms: 80}, {pose: {f: 'attack@2'}, ms: 70},
  {pose: {f: 'attack@3'}, ms: 60, ease: 'in'},                       // 命中
  {pose: {f: 'attack@4'}, ms: 90}, {pose: {f: 'attack@5'}, ms: 90}, {pose: {f: 'attack@6'}, ms: 100}, {pose: {f: 'attack@7'}, ms: 120},
], fx: {type: 'slash'}});
```

## 6. 動作確認の記録（ver0.30）

- 見本パック（リオの提供原画から作った 正面・待機・星臨 と 6 コマの待機）を `spx_import.py` で取り込み、
  全 9 サイズで frame-size・anchor・foot-slide・pose-anchor が 0、colour-drift ≤ 0.07 を確認。
- 同じ待機を動画にして Forge の **process → gait_loop select（6 コマ周期を検出）→ finish_frames hd** を通し、
  その出力を取り込み。図鑑・戦闘でコマが 6 枚とも順に再生されることをブラウザで確認。
  Forge の `finish.json` の anchor は「足の中点」の定義が静止ポーズと違い数ドット横にずれるため、
  取り込みでは 1 コマ目の足元（静止ポーズと同じ決め方）を使う。

## 7. 大量に追加するときの流れ（1 キャラあたり）

1. `init` → 2. マスター 3 枚を承認（正面・待機・星臨。`lineup` で既存キャラと体格・画風を並べて確認）
→ 3. `sprite_set.py plan/run/review/accept`（idle → attack → hurt → cast → guard → victory の順）
→ 4. `character.json` に anims を登録 → 5. `spx_import.py build` → 6. `spx_qa.py anims/lineup/check`
→ 7. 開発者メニューで図鑑・戦闘を確認 → 8. コミット（`assets_src/chars/<id>/` と `spx-data-chars.js`）。
