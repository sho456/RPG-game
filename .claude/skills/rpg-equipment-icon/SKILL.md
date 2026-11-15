---
name: rpg-equipment-icon
description: アストラル・ブレイカー（このリポジトリ）の装備アイコン（武器・防具・装飾品・レジェンド・専用装備）を、既存のアイコンと同じ画風・同じ規格でコードで描く／直す／増やす。32×32 の部品組み立て（js/items/icons36.js の IC36）・素材の段階（銅・鉄・鋼・星鋼）・自動の陰影と輪郭・レアリティの光、武器種 8 種（剣・短剣・大剣・斧・体術・弓・杖・双剣）とクロウの鎌杖。Use when the user asks for equipment/weapon/armor/accessory icons, item icon quality, a new weapon type or legendary item look in this game, or to make icons look better. 画風の技法（色相をずらした陰影・ディザ・選択的な輪郭）の勉強には pixel-art-studio を併用する。
---

# 装備アイコン（アストラル・ブレイカー）

装備アイコンは**画像ファイルではなくコード**。`js/items/icons36.js`（`IC36`）が 32×32 のドット絵を部品から組み立て、
陰影・輪郭・レアリティの光を自動で付ける。新しいアイコンも必ずこの仕組みに足す（PNG を貼らない）。
どの装備がどのアイコンになるかは `js/v31/items.js` の `keyOf`（名前 → デザインのキー）。

## 0. 見る（必ず最初に・直すたびに）

```bash
python3 -m http.server 8765 &                                   # リポジトリの直下で
node tools/icon_preview.js /tmp/icons.png sword_ dagger_         # キーの前方一致。省略すると全部
```

行＝デザインのキー、列＝レアリティ 0〜4（3 以上は縁の光、4 は大きなきらめき）、右端＝実寸 32px。
**PNG を画像として開いて、実寸の列で読めるかを必ず確かめる**。拡大で良くても実寸で潰れるのは失敗。

## 1. 仕組み（変えてはいけない規格）

| 項目 | 規格 |
|---|---|
| 大きさ | 32×32（`IC36.N`）。透過。武器は**左下 → 右上の斜め**（`C.d(t,o)`：t＝長さ方向 0〜32、o＝横ずれ） |
| 光 | 左上から。陰影は `shade()` が自動：部品の左上の縁＝明るい段、右下の縁＝暗い段。**自分で陰を描かない** |
| 色 | 1 部品＝5 段のランプ（0 光の当たる角 → 4 輪郭）。`P` の既成ランプ（copper iron steel star gold silver dark leather wood bone … gemR gemB gemG gemV gemA gemW）から選ぶ。新しい色は 5 段で足す |
| 輪郭 | 部品の外側を、その部品の 4 段目で自動で囲む（黒一色にしない）。輪郭を付けたくない飾りは `{noline:1}` |
| 段階 | `TIER`：銅（lv0）・鉄（lv1）・鋼（lv2）・星鋼（lv3）。lv が上がるほど**飾り（玉・宝石・縁の線・刃の光）が増える**。形は変えない |
| レアリティ | `finish()` が付ける（2：小さなきらめき 1、3：紫の縁の光＋きらめき 2、4：橙の光＋大きなきらめき）。デザイン側では描かない |

描く道具（`Canvas()` の `C`）：`poly` `cap`（太さのある線）`ell` `ring` `rect` `px` `curve` `mirror`、斜めの軸版の
`dpoly` `dcap` `dell` `dpx`。オプション `{shine:1}`（角を 0 段＝白っぽく）`{flat:n}`（段を固定）`{round:1}`（丸み）`{emit:1}`（光る）。
部品：`blade(C,色,t0,t1,太さ,{tip,curve,fuller,edge,single,w2})` `guard(C,色,t,半幅,厚み,{balls,sweep})` `grip(C,色,t0,t1,太さ,ピッチ)`
`gem/dgem`（宝石）。武器の土台は `W.<種類>`（sword dagger gsword dual axe bow staff scythe fist claw tome glass dsword）、
防具・装飾品は `A.<種類>`（helm band armor shield ring neck charm）。

## 2. 武器種とアイコン

| 武器種 | アイコン | 名前の末尾（`keyOf` の手がかり） |
|---|---|---|
| 剣 | `sword` | 〜の剣 |
| 短剣 | `dagger` | 〜の短剣 |
| 大剣 | `gsword`（ヴァルクの竜の意匠は `dsword`） | 〜の大剣 |
| 斧 | `axe` | 〜の斧 |
| 体術 | `fist` | 〜の手甲 |
| 弓 | `bow` | 〜の弓 |
| 杖 | `staff`（クロウだけ形が大鎌：`scythe`） | 〜の杖／〜の大鎌 |
| 双剣 | `dual` | 〜の双剣 |

`WK`（js/v31/items.js）は**長い名前から先に**照合する（大剣・双剣・短剣を剣より前に）。

## 3. 足し方

- **新しい形**：`W.<名前>=(C,T,x={})=>{const lv=T.lv; …}` を icons36.js の武器の節に足す。`T.m` 金属・`T.t` 飾り・`T.g` 柄・
  `T.gem` 宝石を使い、`lv` で飾りを増やす。`x` で色の上書きを受ける（レジェンド用）。4 段階のキーは自動で登録される。
- **レジェンド・専用装備**：`DES` に `L_<名前>:L(W.<形>,'<段階>',{色の上書き・extra:C=>{…}},'<光の色>')`。名前から引くには
  `LICON`（js/v31/items.js）か `L_` + `it.leg`。
- **名前 → アイコン**：`keyOf`（js/v31/items.js）。武器名の名詞を変えたら `WK` も見る。

## 4. 品質の基準（画家の目で）

1. **実寸 32px で何の武器か一目で分かる**シルエット。刃・柄・鍔の比率は実物どおり（短剣は刃が短く、大剣は鍔が広い）。
2. **焦点は 1 つ**：宝石か刃の光のどちらか。飾りを足すほど読みにくくなる。
3. **段階の差は飾りで**：銅は素朴、星鋼は宝石と縁の光。4 段を並べて「上がっていく」と感じられること。
4. **同じ段の武器どうしで明るさ・密度をそろえる**（見本帳で行を見比べる）。
5. 色は 1 アイコンにランプ 3〜4 本まで。孤立した 1 ドット（ノイズ）を残さない。

技法（色相をずらした陰影ランプ・ディザ・選択的な輪郭・クラスターの整え方）の参考は
`.claude/skills/pixel-art-studio/references/techniques.md` と `cleanup.md`。新しい形を考えるときは pixel-art-studio で
32×32 の試作を描いて見比べ、決まった形を IC36 の部品に落とす。

## 5. 仕上げ

`node tools/smoke.js --quick`（エラーが 0）→ 見本帳を作り直して目視 → 図鑑（装備）と編成画面のカードでも実際の大きさで見る。
