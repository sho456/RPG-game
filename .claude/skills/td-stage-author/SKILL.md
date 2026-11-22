---
name: td-stage-author
description: アストラル・ブレイカー（このリポジトリ）のタワーディフェンス「灯守の防衛線」のステージ・WAVE・敵・仲間の TD 用データを作る／直す／増やす。横スクロールの戦場（1 本道・2 本道、灯は右端）・台座（f＝道の上／b＝道の外）・灯域（灯の光の半径・リオとノアの光の鎖・灯を強める）・出現表・星 3 つの条件・RPG 版のクエストからの変換（q.w → waves）・敵の型（虚蝕を撒く・霊体・飛行など）・仲間の役割（守る・斬る・射る・術・支える）と技の働き・章の構成・出撃前の会話と仲間の加入。Use when the user asks for new TD stages, waves, enemy placement, chapter conversion to TD, unit roles/skills in TD, or the TD map layout. 難易度の数値合わせは td-sim-balance、画面は js/td/view.js。
---

# TD のステージとデータ（灯守の防衛線）

設計の正本は `docs/TD-DESIGN.md`。データの正本は `js/td/stages.js`（ステージと章）と `js/td/data.js`（`TDD`：仲間・敵）。RPG 版のデータ（`HB` `ED` `AW` `SK` `RSD`）は**読むだけ**で書き換えない。

## 1. 戦場（縦画面・横スクロール。論理の高さ 420・幅 W＝860〜1160）

- 正本は `js/td/stages.js`。敵は左（x＝−30）から入り、右端の灯 `base:[W−46, 300]` へ。どの道も最後は灯へ斜めに合流する（`lanePath`）。
- 型：`ONE(W)`＝1 本道（高さ 300）、`TWO(W)`＝2 本道（262・338）。`THREE(W)`＝3 本道（244・300・356）。台座は無い（ver0.55）：仲間は光の中の道の近くに置き、役割で前衛（道の上）・後衛（前衛の後ろ・道の脇）の隊形を組んで歩く。
  新しい型を作るときは `map(W, 道の高さの列, 光の半径)` を使う。地面は y＝196 から下。
- 灯域：既定の光は W×0.33。**最初に光の中にある道の長さが 1 本あたり 150 以上**になるようにする（`TDS.frontier(st,道)` が光の届く一番前の s）。
  さらに前（左）へは、リオ・ノアの光（120）の鎖か、灯を強める（+15%/段）で届く。
- 背景のテーマ `th`：`ash` `forest` `chapel` `storm` `ice` `ruin` `tower` `void`。新しい章は `js/td/bg.js` の `PAL` と `far`・`mid` に足す。
- 仲間が 2〜3 人の序盤は 1 本道にする（2 本道は止める役が足りず、灯を強めても漏れる）。

## 2. 出現表

```js
waves:[{e:[[出る秒, '敵のキー', 数, 間隔, 道の番号（省略で交互）], ...]}, ...]
```
- 敵のキーは `ED` のキー（RPG 版と同じ）。RPG 版のクエスト `quest-data.js` の `Q(id,名前,Lv,[[WAVE1の敵...],[WAVE2...]])` を元に、数を 2〜4 倍・時刻と間隔を足して作る。
- ボス（`ED[k].boss`）は最後の WAVE に。手下の呼び出しは `ai.summon`（`TDD.foe` が every×3 秒ごとに 2 体）。
- WAVE の間は `K.GAP` 秒。プレイヤーは「次の WAVE を呼ぶ」で残り秒ぶん灯力を得る。

## 3. 敵の型（`TDD.TRAIT`・説明 `TDD.TRN`）

| 型 | 働き | 対策 |
|---|---|---|
| `void` 虚蝕を撒く | 生きている間、1 体ごとに灯の光を毎秒 1.5 削る | 早く倒す・照らす役・灯を強める |
| `ghost` 霊体 | 物理 ×0.6・術 ×1.25 | 術 |
| `armor` 重装 | 物理 ×0.55（打属性は等倍） | 術・打 |
| `fly` 飛行 | 止められない | 遠距離物理アタッカー・魔法アタッカー |

新しい型は `sim.js` の `hit`（ダメージ）か `tick`（移動）に 1 か所だけ足し、ここと設計書の表に書く。

**ボスの仕掛け** `gim:{k:'charge'|'shift'|'drain', every:秒}`（ステージに書く。そのステージのボスすべてに付く）：
- `charge`：灯の光の中で 3 秒溜めて灯を撃つ（止めていれば止めている仲間へ）。気絶で消える → 守る役・ハクア・シオンが活きる
- `shift`：2 本道以上で、別の道へ移る → 道ごとに止める役が要る
- `drain`：灯の光を 18% 削る → リオ・ノア・灯を強めるが活きる
- 本編のデータでボス扱いでない敵をボスにするときは `data.js foe` の `boss` の判定に足す（例：`ernaE`）

## 4. 仲間（`TDD.HERO`）

- 役割 `ROLE`（guard/blade/shot/spell/aid）が隊列（`line`：f＝前衛／b＝後衛）・歩く速さ `mv`・詰め寄る間合い `chase`・後衛の間合い `off`・射程・攻撃間隔・止める数・コストの既定。仲間ごとの上書きは `HERO[id]`。
- 技の働き `k`：`strike`（倍率・`kb` 押し戻し）・`stun`・`nova`（範囲。`at:'foe'` で敵の位置）・`chain`（`cnt` 体）・`curse`・`heal`・`slow`（陣）・`guard`。
  **キー名 `n` は技の名前に使うので、数には `cnt` などを使う**（`Object.assign` で名前が上書きされる）。
- 技の名前は RPG 版の `SK[キー].n`、星臨の名前は `AW[id].name` を自動で引く。

## 5. 追加の手順

1. `stages.js` の `L` に `S(id,{q, name, lv, th, pre, join, join_lines, waves}, ONE(W)/TWO(W))` を足し、章 `CH` の `st` に並べる（`ORDER` は自動）。
   会話は `pre('クエストid')`、加入は `join:'仲間'`＋`join_lines:post('仲間')`（本編の `QD.POST`）。
2. `node tools/td_sim.js --tune 4.5 --stage <id> --n 16` で `hk` を決めて書く（ボスが重すぎて 0.6 未満になるなら `bk` を下げてから）。
3. `node tools/td_sim.js --stage <id>` で Lv ごとの差を確かめ、`star.time` を推奨 Lv の平均の秒 +5% に。
4. 画面で 1 回確かめる：`index.html#td` → 地図 → 出撃準備 → 出撃（Playwright で撮って縮小して見る）。
