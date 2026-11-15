---
name: rpg-hero-motion
description: アストラル・ブレイカー（このリポジトリ）の戦闘モーションと技の演出を作る／直す。味方 12 人の待機の癖・通常攻撃・技・被弾・勝利・星臨、敵の行動。1 枚絵を曲げて動かす仕組み（js/battle/rig.js の mL mB mS mR mF mU）、技の演出の台帳（BXS.def：予備動作 → 発動 → 命中 → 余韻）、エフェクト部品（BXP）、連続コマの原画の取り込み（tools/spx_import.py の anims）、演出ビューアとコマ送りでの確認（tools/motion_preview.js）。Use when the user asks for battle motions, attack/idle/cast/hurt/victory animation, skill effects, hit-stop, or "make the battle feel better" in this game. エフェクトの新規作成は pixelfx、コマを手で描くなら pixel-art-studio を併用する。
---

# 戦闘モーション（アストラル・ブレイカー）

## 0. まず読む・まず見る

- 仕組みの見取り図：`docs/BATTLE.md`（戦闘の流れ・関数の包み）、`docs/FX.md`（演出の台帳と部品）、`docs/PIPELINE.md`（原画とコマ）
- 書き方の全項目：`js/battle/seq.js` の冒頭コメント
- **見る**（直すたびに必ず）：
  ```bash
  python3 -m http.server 8765 &
  node tools/motion_preview.js rio koujin /tmp/m.png              # 技（SK のキー）
  node tools/motion_preview.js gald atk /tmp/m.png --step 50      # 通常攻撃／aw 星臨／hit 被弾／down 戦闘不能／idle 待機
  node tools/motion_preview.js crow noroi /tmp/m.png --enemy boss5 --frames 20
  ```
  一定間隔のコマを 1 枚に並べた PNG ができる。**画像として開いて、1 コマずつ形を判定する**。
  ゲーム内では開発者メニュー →「演出ビューア」（相手・数・速度を選んで何度でも再生）。

## 1. 規格（変えない）

| 項目 | 決まり |
|---|---|
| 向き | 味方は右に立ち**左（敵）を向く**、敵は左で右を向く。向きは `js/sprite/facing.js`（`FACING`）だけが決める。原画の向きは素材の `face`（左向きの原画はセレスだけ）。モーションのデータは「前＝相手のいる側」で書くので向きを気にしない |
| 大きさ | 味方の背丈は画面幅の約 11%。陣形の立ち位置は `RSD.FORM[].p`（js/v38/battle-ui.js が配置） |
| 時間 | `ANIM.T(ms)` で速度（×1・×2）とヒットストップに追従する。`setTimeout` を直接使わない |
| 一撃の流れ | 予備動作（溜め・逆方向へ引く）→ 発動（速く）→ **命中の瞬間に形が完成** → ヒットストップ（`['stop',ms]`、大技は長め）→ 余韻（ゆっくり戻る） |
| エフェクトの色 | 属性のランプ名：`斬 打 突 熱 冷 雷 陽 陰`（`風` `地` は演出用の色として残っている）、ほかに `heal buff debuff star`。熱い色 → 冷たい色へ、透明にせず小さくして消す |

## 2. 動かし方は 3 段階（上ほど手軽）

1. **1 枚絵の変形（今の 12 人の標準）**：`['pose',{mL,mB,mS,mR,mF,mU},ms,ease]`
   - `mL` 体の傾き（＋＝前へ）／`mB` 腰から上の曲げ／`mS` つぶれ（＋）・伸び（−）／`mR` 回転（度）／`mF` 前へ／`mU` 上へ（単位はドット）
   - 既成のポーズ名：`ready` `lunge` `dash` `cast` `win` `hit` `guard` `weak`（`BXR.POSE`）。キャラごとの重さ・しなやかさ `BXR.CH`
   - 待機の癖は `js/battle/data/motion-heroes.js` の `QUIRK`（1〜2 ドットの呼吸・弾み・揺れ）
2. **技の演出の台帳**：`js/battle/data/fx-heroes-<id>.js` に `BXS.def('<技>', {kind, big, pre, strike, impact, after})`。
   部品（`BXP`）：`crescent cut stab flare shock sparks dust circle gather rise pillar bolt shards flame gale spikes orb beam proj speedlines petals glint ward`。
   探す順は `'キャラ:技'` ＞ `'技'` ＞ `'キャラ:cat:区分'` ＞ `'cat:区分'`。キャラ専用の通常攻撃は `'<id>:atk'`、敵は `'ea:<行動>'`。
3. **連続コマの原画**（手描き・生成）：`python3 tools/spx_import.py init <id>` → `assets_src/chars/<id>/anim/<ポーズ>/frame_000.png…`
   （**全コマ同じキャンバス・足元の位置が同じ**）→ `character.json` の `anims` に登録 → `python3 tools/spx_import.py build <id>`。
   コマが入ったポーズは変形より優先して使われる。台帳から `['pose',{f:'attack@3'}]` で直接指定もできる。手順は `docs/PIPELINE.md` 3 章。

## 3. 作る順番（1 つの技）

1. **1 行で決める**：何を・どう動くか・色・長さ。例「光刃：半歩引いて光を溜め、一気に踏み込んで斜めに斬る。三日月の光、白い閃光、0.7 秒」。
2. **似た技を探す**：同じキャラ・同じ区分の既存の `BXS.def` を読み、型を借りる。
3. **下書き → 見る → 直す**を最低 3 回。コマ送りで見て、いちばん悪い所を 1 つだけ直す。

| 見えたもの | 直し方 |
|---|---|
| ふわっとして当たっていない | 予備動作を逆方向に大きく、発動を短く（`'in'` の ease）、命中で `['stop',60〜120]`、`shake` |
| 体が動いていない（エフェクトだけ） | 命中の 1 コマ前に `lunge` 系の大きな形（`mL` `mF` を大きく）、戻りは遅く |
| エフェクトがキャラを隠す | 命中の白い閃光は 1〜2 コマだけ、全画面の塗り（`dim` `flash`）は短く |
| 連撃が単調 | `strike` を配列にして 1 撃ごとに形と角度を変える（`c.n` で左右を交互に） |
| 重い武器が軽く見える | `BXR.CH` の重さに合わせて予備動作を長く、沈み（`mS`）を深く |

4. **点検**：`node tools/smoke.js --fx --no-battle`（全員の全技・星臨・敵の全行動を再生し、エラーと「終わらない演出」を集める）が 0 件。

## 4. 新しいエフェクトがほしいとき

- まず `BXP` の部品の組み合わせ（色・大きさ・数を変える）で作る。
- 部品に無い動き（吹雪・炎上・召喚など）は **pixelfx**（`.claude/skills/pixelfx`、ライブラリは `tools/pixelfx`）で作る：
  既成 244 種から探す → `--opts` で属性の色に → 気に入らなければ下書き・レンダ・目視を繰り返す →
  `--sheet` でスプライトシートにするか、`draw` を BXP の部品として移植する。`act` の時間（溜め・命中・硬直）を
  `BXS.def` の `pre` / `strike` / `['stop']` に写すと、体とエフェクトの間合いがそろう。

## 5. ロマサガRS のようなコマ打ちのドット絵にしたいとき

RS の味方は 32px 前後の小さなドット絵で、ポーズごとに**手で描いたコマ**（待機・正面・背面・歩き 2 コマ・走り・溜め・
攻撃 3〜4 コマ・詠唱・被弾・瀕死・勝利・戦闘不能）を持つ。今の作品は大きめの 1 枚絵を変形しているので、近づけるには
**ポーズごとのコマ**が要る。

1. ポーズの一覧と長さは `assets_src/templates/actions.json` に合わせる（無いポーズは足す）。
2. コマは pixel-art-studio で描く（`assets_src/pixel-art/<id>-<ポーズ>/build.py`。同じパレット・同じキャンバス・足元固定。
   体の部品を関数にして、コマ＝関数の呼び出しの違いにする）。参考：`references/animation.md`（タイミング・スミア・溜め）。
3. `anims` に登録して取り込み、台帳の `pose` をコマ名で指定。変形は細かい呼吸・揺れだけに使う。
4. 生成で作る場合は agent-sprite-forge（`video2dsprite`）が使えるが、動画モデルの API キー（xAI）が要る。
