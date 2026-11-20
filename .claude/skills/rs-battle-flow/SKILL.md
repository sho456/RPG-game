---
name: rs-battle-flow
description: アストラル・ブレイカー（このリポジトリ）のロマサガRS風の戦闘の流れと表示を作る／直す／点検する。戦闘開始の筆文字・HP/BP を出すタイミング・技名の吹き出し・暗転・Critical/Weak＋属性の漢字・強化/弱体の文字・ダメージの数字（連続ヒット・全体攻撃）・表示の区切りと重なり。決まりは docs/BATTLE-FLOW.md、表示の枠は js/ui/battle-pop.js（BPOP）、流れは js/battle/flow.js と js/rs/battle.js。デモの録画（tools/battle_demo.js）とコマの一覧（tools/frame_grid.py）で必ず目で確かめる。Use when the user asks about the battle flow, damage numbers, Weak/Critical labels, buff/debuff text, HP/BP display timing, multi-hit or all-target display, overlapping battle text, or "make the battle look like Romancing SaGa Re;univerSe". 技ごとの演出（モーション・エフェクト）は rpg-hero-motion を使う。
---

> 旧コマンド戦闘は ver0.53 で削除。演出の知見は TD の演出に応用する（このスキルが指す js/battle/*・js/rs/*・tools/battle_demo.js などは今は無い。時間割・効果音・色などの考え方だけを使う）。

# ロマサガRS風の戦闘の流れと表示（アストラル・ブレイカー）

## 0. まず読む

- **決まり（正本）**：`docs/BATTLE-FLOW.md`。直す前に読み、直したら書き換える。ユーザーが決めたこと（下の 1）と食い違う変更はしない
- 参考：ユーザーから受け取ったロマサガRS の録画（14 秒・60fps）をコマ送りで分析して決めた。新しい録画を受け取ったら、まず 4 の手順でコマに分けて見る
- 仕組み：`CLAUDE.md` の表「戦闘の行動演出の流れ」の行

## 1. ユーザーと決めた決まり（変えるときは必ず確認を取る）

| 項目 | 決まり |
|---|---|
| 表示の枠 | キャラごとに 1 つ、**体の中心が基準・中央揃え**。敵・味方とも同じ。数字の行の中心＝体の中心、上の段は上へ積む |
| 段 | 0：Critical（Weak・Resist と重なるときは上の行）／1：Weak（Resist）＋属性の漢字（**同時に出す**）・Guard／2：強化・弱体（横並びで 1 行・3 つまで）、固有の強化（アビリティ名）は 2 行目／3：ダメージ・回復の数字 |
| 大きさ | Critical と Weak は同じ大きさ。強化・弱体は数字の約 6 割。文字の絵の余白（縁・光）を打ち消して、重ならない程度に詰める（`tight`） |
| 連続ヒット | ＝1 つの技・術で何回も当たること。**合計は出さない**。ヒットごとの数字を同じ場所で 1 桁ずつ右から落として置き換える |
| 全体攻撃 | 味方・敵とも、1 ヒットごとに**全員へ同時に**当てる（命中・数字・効果も同時） |
| 戦闘開始 | 筆文字「戦闘開始」（衡山毛筆フォントで書いた絵：`js/battle/data/start-brush.js`）約 1 秒 → **HP・BP** 約 1.3 秒 → 消えてから開始時の強化・弱体（全員同時）→ 消えてからコマンド |
| ターンの始め | ＝コマンドを選び終えて全画面に戻ったあと（**戻るスライド約 0.5 秒が終わってから**。途中で出すと位置がずれる）。**HP・BP を 1 度だけ**出して消す → ターンの始めの効果 → 行動 |
| 消える | **残さずすぐ消す**：最後の表示から約 0.85 秒（`LIFE`）。さらに**行動の始め・ターンの始めの効果の前・ターンの終わり**の区切りで、出ている表示を全員分まとめて消す（`BPOP.cut()`）。次の行動の表示と被らせない |
| 動き | 枠：出るとき少し大きく現れる（`in46`）、消えるとき上へ浮いて薄くなる（`out46`）。見出し：叩きつけ（`sl43`）＋光の筋（`ls43`）。数字：1 桁ずつ右から落ちる（ver0.48 で `dg47` の弾みを外した）＋ヒットごとに数字全体が跳ねて揺れる（`hit46`）。回復：浮き上がる（`up46`）。状態：下から弾んで出る・1 つずつずらす（`st46`） |
| 吹き出し | 技名は頭の上。読めたらすぐ消す（約 0.65 秒。数字が出たらその時点で消す） |
| LP | 減るのは気絶したとき（-1）と、一部の高難易度ボス（Lv50 以上・LP を削る技）の攻撃だけ。表示は 3 段目に赤い「LP-1」、数字と被るときは約 0.6 秒の時間差（`BPOP.lp`） |
| HP・BP の場所 | いつもキャラの中央（固定・薄い黒の下地。`V24.HK24.placeHL`）。表示中は毎フレーム置き直す。数字の枠が出ている間は隠す |
| 数字の書体 | Barlow Semi Condensed の Italic（細身でやや斜体）。桁は字の送り幅どおりに並べ、重ねない（`js/ui/damage.js`・`battle-pop number`） |
| ターンの変わり目 | 1 倍速のときは、ターンが終わってからコマンド選択の画面になるまで約 0.75 秒あける |
| 敵の配置 | 複数の敵は重ならないように置く（`js/v23.js placeEnemies`：重なるなら最小 52% まで縮めて探す） |
| 戦闘開始の筆文字 | 連続戦闘ではクエストの最初の 1 回だけ（`V38B.waveT` で 2 戦目以降を見分ける） |
| デモ | ユーザーはデモ動画を求めていない。確かめはコマの一覧で自分で行い、動画は送らない |
| 自己強化 | 攻撃の前に自分を強化する技（データの `selfPre:1`）は、発動の前に強化を出す。それ以外は行動の終わり |
| 属性の印 | 技・戦闘の帯・耐性で同じ六角の質感＋毛筆の文字。文字の色は `ELN43`（`js/data/resist.js`） |

## 2. どこを直すか

| 直したいこと | ファイル（関数） |
|---|---|
| 枠・段・置き場所・詰め・区切り | `js/ui/battle-pop.js`（`begin` `label` `number` `status` `place` `cut` `tick`）・`css/ui/battle-pop.css` |
| 見出し・数字の書式（金属の色・筆の漢字） | `js/ui/damage.js`（`TX24.STYLE`）、状態の文字の色は `js/v25.js` の `FXS` |
| 戦闘開始の筆文字・吹き出し・暗転・行動の番号 | `js/battle/flow.js`（`brushBanner` `startBanner` `bubble` `doAction` の包み） |
| HP・BP を出すタイミング | `js/v38/battle-ui.js`（`hlShow` `hpFlash` `hpHide` `hpEnd`） |
| ターンの流れ・区切りを入れる場所 | `js/rs/battle.js`（`run` `opening` `roundStart`＝BP、`roundFx`＝ターンの始めの効果、`heroExec` `enemyExec` の先頭の `BPOP.cut()`） |
| 開始時の効果を待たせる（表示のゲート） | `js/v25.js`（`opening`・`gateTick`。`V38B.hpEnd()` まで預かり、全員同時に出す） |
| 全体攻撃を同時に当てる | `js/engine.js`（`doAction` の全体攻撃の分岐・敵の全体攻撃）、`js/ver19.js`（`hit` の包み：`_sim` は振り・止めを省く） |

文字の表示はすべて `V24.HK24.pop`（＝`BPOP`）を通る。`pop(u, 文字, 色, small, kind, 属性)` の kind：`crit` `weak` `resist` `psn` `hurt`（数字）、`up` `dn` `ab`（状態・アビリティ名）、`fu`（名前付きの追撃＝吹き出し）。

## 3. してはいけないこと

- 枠を体の外の固定位置（左下・左など）に戻す／Weak と漢字をずらして出す／合計を数え上げる（どれも却下済み）
- 表示を次の行動まで残す（ユーザーの指定は「残さずすぐ消す」）。区切り（`cut`）も外さない（次の行動と被る）
- `setTimeout` で表示を遅らせて順番を作る（速度×2・×4 で崩れる）。順番は `run`・`opening` の `await` と区切りで作る
- 新しい verXX ファイルを作る（`CLAUDE.md` の 3）

## 4. 確かめる（直すたびに必ず）

```bash
python3 -m http.server 8765 &
node tools/battle_demo.js /tmp/b boss                 # 0.1 秒ごとのコマ（ボス：連続ヒット・Weak・Critical・状態）
node tools/battle_demo.js /tmp/m multi                # 敵 3 体（全体攻撃が同時か）
python3 tools/frame_grid.py /tmp/b /tmp/b.png --every 3 --crop 0,170,420,670
VID=1 node tools/battle_demo.js /tmp/v boss && ffmpeg -i /tmp/v/*.webm -c:v libx264 -pix_fmt yuv420p /tmp/demo.mp4   # ユーザーに見せるデモ
python3 tools/frame_grid.py ロマサガRSの録画.mov /tmp/rs.png --fps 10 --every 1                                     # 参考の録画をコマに
node tools/smoke.js --quick --fx                      # エラー 0 が合格（run_in_background で）
```

一覧の画像を開き、次を 1 つずつ判定する（細かい所は PIL で切り抜いて拡大）：

1. 戦闘開始 → HP・BP → 強化・弱体 → コマンド、の順で、同時に重なっていない
2. コマンドの後に HP・BP が 1 度だけ出て、最初の攻撃の前に消える（2 度出ていない）
3. 行動が変わるたびに、前の行動の表示が消えている（次の行動の数字・文字と被らない）
4. 枠がキャラの中心にあり、中央揃え。Critical が Weak の上、Weak と漢字が同じ行
5. 連続ヒットで数字が置き換わる（合計になっていない・2 つ並んでいない）
6. 全体攻撃で全員の数字が同じコマに出る
7. ターンの終わりに表示が全部消えてからコマンド入力になる
8. どの表示も最後の更新から約 1 秒以内に消える
9. ターンの始めの HP・BP は、全画面に戻ったあと動かずに出る（手動のコマンド入力でも確かめる）

デモ動画は、ユーザーに求められたときだけ送る（`SendUserFile`）。

## 関連：技・術の演出そのもの

暗転の深さ（剣 41%・術 64%、放出の直前は真っ黒）・明けの長さ（0.45 秒）・敵が術の色に染まる・赤から市松のモザイクで崩れる・数字が右の桁から数え上がる、
などの録画の実測と、効果音の重ね方は **rs-battle-fx**（`references/video-2026-11.md`）。表示の枠・数字の出し方の正本はこのスキルのまま。

