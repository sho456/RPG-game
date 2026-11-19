---
name: td-stage-author
description: アストラル・ブレイカー（このリポジトリ）のタワーディフェンス「灯守の防衛線」のステージ・WAVE・敵・仲間の TD 用データを作る／直す／増やす。道（ジグザグに折り返すレーン）・台座（f＝道の上／b＝段の間）・灯域（灯の光の半径と、リオ・ノアの光の鎖）・出現表・星 3 つの条件・RPG 版のクエストからの変換（q.w → waves）・敵の型（虚蝕を撒く・霊体・飛行など）・仲間の役割（守る・斬る・射る・術・支える）と技の働き。Use when the user asks for new TD stages, waves, enemy placement, chapter conversion to TD, unit roles/skills in TD, or the TD map layout. 難易度の数値合わせは td-sim-balance、画面は js/td/view.js。
---

# TD のステージとデータ（灯守の防衛線）

設計の正本は `docs/TD-DESIGN.md`。データの正本は `js/td/data.js`（`TDD`）。RPG 版のデータ（`HB` `ED` `AW` `SK` `RSD`）は**読むだけ**で書き換えない。

## 1. 戦場（縦画面・論理 360×520）

- 道 `path` は左上から入り、段ごとに左右へ折り返して下の灯 `base` へ。敵は横向きの原画のまま、進む向きで反転する。
- 道の幅は 26。段の間は 112 前後あける（後ろの台座 b を置く余白）。
- 台座：`{id:'f1',k:'f',s:距離}`（道の上・止める役）／`{id:'b1',k:'b',x,y}`（段の間・射る・術・支える）。
- 灯域：`light.r`（灯の光）。**下の 2 段だけが最初から明るく**、上の段はリオ・ノア（`lt`）を光の中に置いて鎖で届かせる、が基本形。
  台座が光の中か外かは `TDS.lightUpdate` が決める。新しい道を作ったら、最初に明るい台座を必ず数える（f が 2 つ以上、b が 3 つ以上）。

## 2. 出現表

```js
waves:[{e:[[出る秒, '敵のキー', 数, 間隔], ...]}, ...]
```
- 敵のキーは `ED` のキー（RPG 版と同じ）。RPG 版のクエスト `quest-data.js` の `Q(id,名前,Lv,[[WAVE1の敵...],[WAVE2...]])` を元に、数を 2〜4 倍・時刻と間隔を足して作る。
- ボス（`ED[k].boss`）は最後の WAVE に。手下の呼び出しは `ai.summon`（`TDD.foe` が every×3 秒ごとに 2 体）。
- WAVE の間は `K.GAP` 秒。プレイヤーは「次の WAVE を呼ぶ」で残り秒ぶん灯力を得る。

## 3. 敵の型（`TDD.TRAIT`）

| 型 | 働き | 対策 |
|---|---|---|
| `void` 虚蝕を撒く | 生きている間、1 体ごとに灯の光を毎秒 1.5 削る | 早く倒す・照らす役 |
| `ghost` 霊体 | 物理のダメージ ×0.6 | 術 |
| `fly` 飛行 | 止められない | 射る・術 |

新しい型は `sim.js` の `hit`（ダメージ）か `tick`（移動）に 1 か所だけ足し、ここと設計書の表に書く。

## 4. 仲間（`TDD.HERO`）

- 役割 `ROLE`（guard/blade/shot/spell/aid）が台座の種類・射程・攻撃間隔・止める数・コストの既定。仲間ごとの上書きは `HERO[id]`。
- 技の働き `k`：`strike`（倍率・`kb` 押し戻し）・`stun`・`nova`（範囲。`at:'foe'` で敵の位置）・`chain`（`cnt` 体）・`curse`・`heal`・`slow`（陣）・`guard`。
  **キー名 `n` は技の名前に使うので、数には `cnt` などを使う**（`Object.assign` で名前が上書きされる）。
- 技の名前は RPG 版の `SK[キー].n`、星臨の名前は `AW[id].name` を自動で引く。

## 5. 追加の手順

1. `STAGE` に足し、`ORDER` に並べる。`q` に元のクエストの id を書く。
2. `node tools/td_sim.js --stage <id>` で勝率を測り、td-sim-balance の目安に合わせる。
3. `star.time` は推奨 Lv の平均の秒 +5〜10%。
4. 画面で 1 回確かめる：`index.html#td` → ステージを選ぶ（`ui_shots` と同じく Playwright で撮って縮小して見る）。
