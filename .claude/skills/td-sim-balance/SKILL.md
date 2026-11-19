---
name: td-sim-balance
description: アストラル・ブレイカー（このリポジトリ）のタワーディフェンス「灯守の防衛線」の難易度を、画面を描かないシミュレーション（js/td/sim.js の TDS.run と自動の配置 TDS.bot）で何十回も戦わせて測り、数値を合わせる。勝率・灯火の残り・クリアの秒・星の数を Lv ごとに表にする tools/td_sim.js、1 戦の記録（配置・漏れ・倒れ・与/被ダメージ）の取り方、目安の範囲、効く調整のつまみ（敵の HP・攻撃・WAVE の密度・配置の上限・光の削り）。Use when the user asks to balance TD stages, check difficulty, tune enemy/unit numbers, or investigate why a TD stage is too easy/hard in this game.
---

# TD の難易度の計測と調整

## 1. 計測

```bash
python3 -m http.server 8765 &
node tools/td_sim.js --n 24                       # 全ステージ × 推奨Lv−3・推奨Lv・推奨Lv+4（手札はその時点の仲間＝TDD.rosterAt）
node tools/td_sim.js --tune 4.5 --n 16            # 推奨 Lv で灯火が平均 4.5 残る雑魚の HP 倍率 hk を二分探索
node tools/td_sim.js --stage td0_4 --lv 1,4,8 --deck rio,gald,mire,celes,noah,erna,shion,hakua
```
1 戦 5〜25ms。40 戦 × 3 Lv でも数秒。結果：勝率・灯火（勝った戦の平均の残り）・秒・星。

## 2. 目安

| Lv | 勝率（自動の配置） | 灯火 |
|---|---|---|
| 推奨 −3 | 50% 未満が理想（試作の時点では 80% 前後） | 3 以下 |
| 推奨 | 70〜95% | 4〜6 |
| 推奨 +4 | 95% 以上 | 6.5 以上 |

自動の配置は人より下手なので、人は 1 段易しく感じる。**Lv で灯火の残りがはっきり変わる**ことを必ず確かめる（変わらないときは、数値ではなく仕組みの穴：止める枠があふれる・光の鎖が切れる、など）。

## 3. 1 戦を覗く（原因を探す）

ページで `TDS.create(id,deck,{lv,seed,prep:3})` を作り、`TDS.bot` と `TDS.tick` を回しながら `st.ev` の `deploy` `leak` `fall` `hit` `hurt` を数える。
`leak` の敵の種類と、その時刻の `st.units`・`p.lit`（光の中の台座）を見れば、ほぼ原因が分かる。調べる用の一時ファイルは `tools/_tmp_*.js` に作り、終わったら消す。

## 4. つまみ（効きの強い順）

1. ステージの `hk`（雑魚の HP 倍率）・`bk`（ボスの HP 倍率）。まず `--tune` で `hk` を出す。`hk` が 0.6 未満なら原因はボス：`bk` を下げる。2.2 を超えるなら敵の数を増やす（HP を固くしすぎない）
2. WAVE の密度（数・間隔）と配置の上限 `cap`、道の数（仲間が 3 人以下なら 1 本道）
3. 灯を強める（`sim.js` の `LAMP` の値段・`lampSet` の威力）
4. 敵の基本の係数（`TDD.foe`：`mhp×2.3`・`atk×1.15`・ボス ×0.9）と仲間の Lv の効き（`lvK`：+5%/Lv）
5. 光の削り（1 体 1.5/秒・下限 60%・倒すと +10・虚蝕がいないと +4/秒）

自動の配置（`TDS.bot`）は、置ける台座が無いとき・上限のときに灯を強める。人より下手なので、人は 1 段易しく感じる。
数値を変えたら `docs/TD-DESIGN.md` の該当の行も直す。計測の表はコミットメッセージに貼る。
