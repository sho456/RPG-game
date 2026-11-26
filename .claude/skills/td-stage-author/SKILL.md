---
name: td-stage-author
description: アストラル・ブレイカー（このリポジトリ）の章のステージ・WAVE・敵・章・会話・仲間の加入のデータを作る／直す／増やす（js/td/stages.js の TDD.STAGE・TDD.CH・TDD.ORDER）。ステージを足したら tools/cb_sim.js --tune で敵の補正（js/cb/tune.js）を作り直す。Use when the user asks for new stages, waves, enemy placement, chapters, story dialogue before battle, or a new party member joining in this game.
---

# ステージとデータ（ver0.63〜：戦闘は ver0.49 の旧戦闘。WAVE の読み替えは `js/battle/stage.js` の `STG.wavesOf`。`js/cb/*` と `tools/cb_sim.js` は削除済み）

正本：`js/td/stages.js`（ステージと章）・`js/battle/stage.js`（`STG.wavesOf` で 1 戦 4 体までに読み替え・WAVE ごとに旧戦闘）。
ID の `td〜` はセーブ（`G.td.c`＝ステージごとの星の数）の互換のため変えない。

## 1 ステージの書式

```js
td1_2:S('td1_2',{q:'q1_3',name:'図書遺跡の少女',lv:7,th:'forest',join:'mire',join_lines:post('mire'),pre:pre('q1_3'),boss:1,
  waves:[{e:[['shroom',5]]},{e:[['bookghost',5],['shroom',4]]},{e:[['m_jade',1],['jadewolf',8]]}]}),
```

| 項目 | 意味 |
|---|---|
| `name` `lv` | 名前・推奨 Lv（敵の Lv にもなる。雑魚は Lv ごとに +3.5%） |
| `th` | 背景の型：ash forest chapel storm ice ruin tower void（`js/td/bg.js` の PAL） |
| `waves` | WAVE の列。`e:[[敵のキー（ED）, 数], …]`。数は「大群の数」：雑魚は 1/3（最低 1）にして 1 戦 4 体まで、ボスは必ず出て取り巻きは 2 体まで |
| `boss` | ボスのステージ（出撃準備の ◆・星の規定ターン +4） |
| `pre` | 初回の出撃前の会話（本編のクエスト QD の pre を `pre('q…')` で） |
| `join` `join_lines` | 初回クリアで加わる仲間と会話（`post('id')`） |
| `fin` | 最終ステージ（初回クリアでエンディング） |

章は `CH`（`{id,ch,n,th,st:[ステージの ID…],intro}`）。並びの順が `TDD.ORDER`（前のステージで星 1 以上なら開く）。
天への塔（`inf:1`）は `pool`（雑魚）と `bosses` から `STG` が毎回作る。

## 手順

1. `stages.js` に足す（章の `st` にも）。敵は `ED` にあるキーだけ（無い絵は `TDD.SPRALT` で借りる）。
2. `node tools/smoke.js --quick --fx` で敵の読み替えと戦闘が通るか確かめる（難易度の自動調整は無い。推奨 Lv で AUTO で勝てるかを手で見る）。
   目安：通常＝4〜5 ターン・残り HP 約 60%、ボス＝9〜11 ターン・AUTO の勝率 80% 以上（4 人・推奨 Lv）。
3. `node tools/smoke.js --quick --url http://localhost:8790/index.html` でエラー 0。
