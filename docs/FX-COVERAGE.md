# 演出の網羅（自動生成：`node tools/fx_check.js --write`）

★＝専用の演出あり。味方の技 48／117、その他の技 0／75、敵の行動 0／41。

## リオ（`rio`）　星臨中のコマンド：seikou・ryusei・keishou

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| ★ | `koujin` | 光刃 | 光 | phys | one | 1.7 | 光の斬撃・単体 |
| ★ | `harai` | 斬り払い | 斬 | phys | all | 0.9 | 斬撃・敵全体 |
| ★ | `teate` | 応急手当 |  | heal | ally | 0.35 | 味方のHP35%回復 |
| ★ | `kobu` | 鼓舞の灯 |  | sup20 | self |  | 味方全員の攻撃・魔力+15%（3ターン） |
| ★ | `torirensan` | 灯火連斬 | 光 | phys | one | 0.62×3 | 光の3連撃。HP半分以下の敵には威力1.5倍 |
| ★ | `seikou` | 星光斬 | 光 | phys | one | 3 | 光の大斬撃・単体 |
| ★ | `ryusei` | 流星連斬 | 光 | phys | all | 1.4 | 光の斬撃・敵全体 |
| ★ | `keishou` | 継承・城壁崩し | 地 | phys | all | 3 | ガルドの星臨を模倣（ガルド星臨後） |

## ガルド（`gald`）　星臨中のコマンド：tettsui・kenshu・houkai

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| ★ | `tateuchi` | 盾撃 | 打 | phys | one | 1.2 | 打撃＋行動を遅らせる |
| ★ | `chiretsu` | 地裂斬 | 地 | phys | one | 1.6 | 地属性の重い一撃 |
| ★ | `chouhatsu` | 挑発 |  | taunt | self |  | 敵の単体攻撃を引きつける |
| ★ | `saigan` | 砕岩撃 | 打 | phys | one | 1.3 | 打撃＋敵の防御-25%（3ターン） |
| ★ | `teppekikamae` | 鉄壁の構え |  | sup20 | self |  | 自分の防御・精神+40%（3ターン）＋2ターン挑発 |
| ★ | `tettsui` | 鉄槌 | 打 | phys | one | 1.5 | 打撃・単体 |
| ★ | `kenshu` | 堅守 |  | kenshu | self |  | 被ダメ半減・蓄積1.5倍 |
| ★ | `houkai` | 城壁崩し |  | release | all |  | 星臨解除・蓄積を全体へ放出 |

## ミレイユ（`mire`）　星臨中のコマンド：fira2・blizz2・zettai

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| ★ | `fire` | ファイア | 炎 | mag | one | 1.4 | 炎の魔法・単体 |
| ★ | `blizz` | ブリザド | 氷 | mag | one | 1.4 | 氷の魔法・単体 |
| ★ | `flamewave` | フレイムウェーブ | 炎 | mag | all | 0.9 | 炎の魔法・敵全体 |
| ★ | `prism` | プリズム・ブランド | 炎 | mag | one | 0.8 | 炎の魔法＋敵に炎・氷の弱点を刻む（3ターン） |
| ★ | `meteor` | メテオスウォーム | 炎 | mag | all | 0.42×3 | 炎の隕石を3回、敵全体へ（消費大） |
| ★ | `fira2` | ファイガ | 炎 | mag | one | 2 | 炎の大魔法（ゲージ25） |
| ★ | `blizz2` | ブリザガ | 氷 | mag | one | 2 | 氷の大魔法（ゲージ25） |
| ★ | `zettai` | 絶対零度の太陽 |  | mag | all | 4.2 | 対消滅3段階で解禁・全体の大魔法 |

## シオン（`shion`）　星臨中のコマンド：renei・kagenui2・goudatsu

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `nusumu` | 盗む | 突 | phys | one | 0.6 | 攻撃しつつ素材や道具を盗む |
| 　 | `shippu` | 疾風斬 | 風 | phys | one | 1.4 | 風属性・次の手番が早い |
| 　 | `kagenui` | 影縫い | 突 | phys | one | 1 | 突き＋行動を遅らせる |
| 　 | `dokujin` | 毒刃 | 突 | phys | one | 1 | 突き＋75%で毒（最大HP5%×3ターン） |
| 　 | `genei` | 幻影乱舞 | 風 | phys | one | 0.4×4 | 風の4連撃。敵より速いほど威力上昇（最大+40%） |
| 　 | `renei` | 連影斬 | 風 | phys | one | 1.1×2 | 風の2連撃 |
| 　 | `kagenui2` | 影縫い・極 | 突 | phys | all | 1 | 敵全体の行動を遅らせる |
| 　 | `goudatsu` | 強奪 | 突 | phys | one | 1.2 | レア以上の装備を確実に奪う |

## ノア（`noah`）　星臨中のコマンド：seiiki・seikou2

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `inori` | 祈り |  | heal | ally | 0.35 | 味方のHP35%回復 |
| 　 | `holy` | ホーリー | 光 | mag | one | 1.5 | 光の魔法・単体 |
| 　 | `mamori` | 守りの祈り |  | barrier | self |  | 2ターン味方の被ダメ-30% |
| 　 | `regene` | リジェネレイト |  | sup20 | self |  | 味方全員に継続回復（最大HP8%×3ターン） |
| 　 | `dispel` | ディスペル・ライト | 光 | mag | one | 1 | 光の魔法＋敵の強化を全て消す（消した数×30%威力上昇） |
| 　 | `seiiki` | 聖域の祈り |  | healAll | self | 0.25 | 味方全員のHP25%回復 |
| 　 | `seikou2` | 聖光 | 光 | mag | all | 1.5 | 光の魔法・敵全体 |

## エルナ（`erna`）　星臨中のコマンド：raisen・juuten・tenkuu

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `raiya` | 雷矢 | 雷 | phys | one | 1.4 | 雷属性の射撃 |
| 　 | `nerai` | 狙い撃ち | 突 | phys | one | 1.9 | 急所を狙う強射 |
| 　 | `samidare` | 五月雨射ち | 突 | phys | all | 0.8 | 突・敵全体 |
| 　 | `ashidome` | 足止めの矢 | 突 | phys | one | 1 | 射撃＋敵の素早さ-30%（3ターン）・行動を遅らせる |
| 　 | `senkou` | 穿光の矢 | 光 | phys | one | 1.55 | 光の矢。敵の防御を半分無視する |
| 　 | `raisen` | 雷閃 | 雷 | phys | one | 1.5 | 雷の必殺射（ゲージ20） |
| 　 | `juuten` | 充填 |  | charge | self |  | 次の手番で天穿を撃てる（ゲージ10） |
| 　 | `tenkuu` | 天穿 | 突 | phys | one | 4.4 | 充填後に解禁・大打撃＋行動を大きく遅らせる（ゲージ40） |

## バルザ（`balza`）　星臨中のコマンド：tanda・yakiire・youtetsu

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `tekkai` | 鉄塊落とし | 打 | phys | one | 1.6 | 打撃・単体 |
| 　 | `netsuda` | 熱打 | 炎 | phys | one | 1.4 | 炎属性の打撃 |
| 　 | `shuuri` | 応急修理 |  | guardRegen | self |  | 防御し、HP15%回復 |
| 　 | `kaentanda` | 火炎鍛打 | 炎 | phys | one | 1.35 | 炎の一撃＋自分の攻撃+20%（3ターン） |
| 　 | `daichiwari` | 大地割り | 地 | phys | all | 1 | 敵全体に地の衝撃＋素早さ-20%（2ターン）。次の手番が遅い |
| 　 | `tanda` | 鍛打 | 打 | phys | one | 1.4 | 打撃（熱で威力上昇） |
| 　 | `yakiire` | 焼入れ | 炎 | phys | all | 1.1 | 炎・敵全体 |
| 　 | `youtetsu` | 溶鉄爆砕 |  | release2 | all |  | 星臨解除・熱を全体へ（溜めすぎると反動） |

## クロウ（`crow`）　星臨中のコマンド：judan・hanten・shikyou

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `noroi` | 呪い | 闇 | mag | one | 1.4 | 闇の魔法・単体 |
| 　 | `yaminami` | 闇の波動 | 闇 | mag | all | 0.9 | 闇・敵全体 |
| 　 | `kyuumei` | 吸命 | 闇 | mag | one | 1.1 | 与えたダメージの半分を回復 |
| 　 | `fushoku` | 腐食の呪い | 闇 | mag | one | 0.6 | 闇の呪い＋敵の防御・精神-25%（3ターン） |
| 　 | `tamakurai` | 魂喰らい | 闇 | mag | one | 1.35 | 闇の魔法。与ダメの40%を吸収。弱体1つにつき威力+25% |
| 　 | `judan` | 呪弾 | 闇 | mag | one | 1.6 | HP8%を払う闇弾 |
| 　 | `hanten` | 呪詛反転 | 闇 | mag | all | 1 | HP10%を払い全体攻撃＋遅延 |
| 　 | `shikyou` | 死経 |  | pct | all |  | HP25%以下で解禁・敵の現在HPを大きく削る |

## ハクア（`hakua`）　星臨中のコマンド：ranbu・hyoukajin

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `shouken` | 掌拳 | 打 | phys | one | 1.3 | 打撃・単体 |
| 　 | `hyouken` | 氷拳 | 氷 | phys | one | 1.5 | 氷属性の拳 |
| 　 | `renken` | 連拳 | 打 | phys | one | 0.6×3 | 打撃3連打 |
| 　 | `hyouketsu` | 氷結掌 | 氷 | phys | one | 1.2 | 氷の掌打＋35%で凍結（1回休み。ボスは遅延） |
| 　 | `hyakuretsu` | 百裂拳 | 打 | phys | one | 0.32×6 | 打撃6連打。弱点なら1撃ごとに大きく響く |
| 　 | `ranbu` | 乱舞 |  | rhythm | one |  | 光る輪が重なる瞬間にタップで連撃（最大12）。12連で凍結 |
| 　 | `hyoukajin` | 氷華陣 | 氷 | phys | all | 1.2 | 氷・敵全体 |

## ジン（`jin`）　星臨中のコマンド：juuou・shippuuga・houkou

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `tsume` | 爪撃 | 斬 | phys | one | 1.3 | 斬撃・単体 |
| 　 | `popo` | ポポ突進 | 打 | phys | one | 1.5 | 相棒の体当たり |
| 　 | `kazekiri` | 風切り | 風 | phys | all | 0.9 | 風・敵全体 |
| 　 | `popototsu` | ポポ突撃 | 地 | phys | one | 0.65×2 | ポポと2連撃＋敵の攻撃-15%（2ターン） |
| 　 | `kemonohoko` | 獣の咆哮 |  | sup20 | self |  | 味方全員の攻撃+20%・敵全体の防御-10%（3ターン） |
| 　 | `juuou` | 獣王撃 | 地 | phys | one | 1.8 | 敵の弱点に合わせて地か風に変わる |
| 　 | `shippuuga` | 疾風牙 | 風 | phys | all | 1 | 風・敵全体 |
| 　 | `houkou` | 咆哮 |  | roar | all |  | 敵全体の行動を遅らせ、味方のAG+15 |

## セレス（`celes`）　星臨中のコマンド：kokuha・tokitome・makimodoshi

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `tokiya` | 刻の矢 |  | mag | one | 1.5 | 無属性の魔法・単体（耐性に左右されない） |
| 　 | `chien` | 遅延の砂 |  | mag | all | 0.8 | 無属性の全体魔法＋行動を遅らせる |
| 　 | `kasoku` | 加速の刻 |  | haste | self |  | 味方全員の次の手番を早める |
| 　 | `chronoslow` | クロノスロウ |  | mag | all | 0.7 | 時の魔法・敵全体＋素早さ-25%（3ターン） |
| 　 | `hastearea` | ヘイストエリア |  | sup20 | self |  | 味方全員の素早さ+25%（3ターン）＋次の手番を早める |
| 　 | `kokuha` | 刻破 |  | mag | all | 1.9 | 無属性の全体大魔法 |
| 　 | `tokitome` | 時止め |  | tstop | all |  | 敵全体の時間を止め、行動を大きく遅らせる |
| 　 | `makimodoshi` | 巻き戻し |  | rewind | self |  | 円環に記録した瞬間まで味方のHP・SP・戦闘不能を巻き戻す（1戦闘1回・星臨が解けても使える） |

## ヴァルク（`valk`）　星臨中のコマンド：ryuuen・meiryuu

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| ★ | `atk` | 通常攻撃 |  |  |  |  |  |
| ★ | `guard` | 防御 |  | guard |  |  |  |
| 　 | `ryuuga` | 竜牙斬 | 炎 | phys | one | 1.5 | 炎の斬撃・単体 |
| 　 | `kokuen` | 黒炎薙ぎ | 闇 | phys | all | 0.95 | 闇の斬撃・敵全体 |
| 　 | `ryuuhou` | 竜の咆哮 |  | roar | all |  | 敵全体の行動を遅らせ、味方のAG+15 |
| 　 | `ryurinkamae` | 竜鱗の構え |  | sup20 | self |  | 最大HP22%の障壁＋3ターン反撃態勢（威力1.0） |
| 　 | `kokuryu` | 黒竜の吐息 | 闇 | mag | all | 0.95 | 闇の吐息・敵全体＋40%で毒（3ターン） |
| 　 | `ryuuen` | 竜炎 | 炎 | phys | all | 1.5 | 炎の全体攻撃（自動） |
| 　 | `meiryuu` | 冥竜爪 | 闇 | phys | all | 1.5 | 闇の全体攻撃（自動） |

## その他の技（どの味方の一覧にも無いもの）

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |
|---|---|---|---|---|---|---|---|
| 　 | `shiden` | 紫電一閃 | 雷 | phys | one | 2 | 雷の高速斬撃。次の手番が早い |
| 　 | `kibou` | 希望の灯 |  | healAll | self | 0.25 | 味方全員のHP25%回復 |
| 　 | `gansai` | 岩砕き | 地 | phys | all | 1.1 | 地属性・敵全体 |
| 　 | `ikari` | 怒りの一撃 | 打 | phys | one | 2.3 | 打撃の大技・単体 |
| 　 | `nidan` | 二段斬り | 斬 | phys | one | 0.85×2 | 斬撃2回 |
| 　 | `reppu` | 烈風斬 | 風 | phys | one | 1.5 | 風属性の斬撃 |
| 　 | `kabau` | かばう |  | taunt | self |  | 挑発＋防御 |
| 　 | `teppeki` | 鉄壁 |  | guardRegen | self |  | 防御し、HP15%回復 |
| 　 | `cure` | ケアル |  | heal | ally | 0.3 | 味方のHP30%回復 |
| 　 | `recover` | リカバー |  | healAll | self | 0.2 | 味方全員のHP20%回復 |
| 　 | `hikariya` | 光の矢 | 光 | phys | one | 1.25 | 光属性の射撃 |
| 　 | `tsuchiya` | 地の矢 | 地 | phys | one | 1.25 | 地属性の射撃 |
| 　 | `thunder` | サンダー | 雷 | mag | one | 1.4 | 雷の魔法・単体 |
| 　 | `hyouga` | 氷河 | 氷 | mag | all | 0.9 | 氷の魔法・敵全体 |
| 　 | `kirisame` | 斬雨 | 風 | phys | all | 0.9 | 風属性・敵全体 |
| 　 | `ansatsu` | 暗殺 | 突 | phys | one | 2.4 | 急所を突く大技 |
| 　 | `raise` | レイズ |  | revive | ally |  | 戦闘不能をHP40%で復活 |
| 　 | `holyrain` | ホーリーレイン | 光 | mag | all | 0.9 | 光の魔法・敵全体 |
| 　 | `kantsuu` | 貫通射 | 突 | phys | one | 2.3 | 突・単体の大技 |
| 　 | `jinrai` | 迅雷 | 雷 | phys | all | 1 | 雷・敵全体 |
| 　 | `daichi` | 大地割り | 地 | phys | all | 1 | 地・敵全体 |
| 　 | `gouen` | 業炎撃 | 炎 | phys | one | 2.2 | 炎・単体の大技 |
| 　 | `shisen` | 死の宣告 | 闇 | mag | one | 2.4 | 闇・単体の大技 |
| 　 | `yamisaki` | 闇裂き | 闇 | mag | all | 1.2 | 闇・敵全体 |
| 　 | `tsurara` | 氷柱落とし | 氷 | phys | all | 1 | 氷・敵全体 |
| 　 | `kakato` | 踵落とし | 打 | phys | one | 2.3 | 打撃・単体の大技 |
| 　 | `goga` | 剛牙 | 斬 | phys | one | 2.2 | 斬撃・単体の大技 |
| 　 | `tatsumaki` | 竜巻 | 風 | phys | all | 1.1 | 風・敵全体 |
| 　 | `gokurio` | 星灯一閃 | 光 | phys | all | 3 | 星臨Ⅲ：光の大斬撃・敵全体 |
| 　 | `gokugald` | 金城鉄壁 |  | barrier | self |  | 星臨Ⅲ：味方の被ダメ-30%が長く続く |
| 　 | `gokumire` | 星界の双極 |  | mag | all | 3 | 星臨Ⅲ：全体の大魔法（ゲージ50） |
| 　 | `gokushion` | 夢幻影縫い | 突 | phys | all | 1.6 | 星臨Ⅲ：全体攻撃＋大きく遅らせる |
| 　 | `gokunoah` | 天上の聖歌 |  | reviveAll | self |  | 星臨Ⅲ：倒れた仲間を全員復活し、HP40%回復 |
| 　 | `gokuerna` | 流星穿 | 突 | phys | all | 2.4 | 星臨Ⅲ：全体射撃＋行動を遅らせる（ゲージ40） |
| 　 | `gokubalza` | 炉心臨界 | 炎 | phys | all | 2 | 星臨Ⅲ：炎の全体大技（熱で威力上昇） |
| 　 | `gokucrow` | 冥界の門 | 闇 | mag | all | 2.8 | 星臨Ⅲ：HP15%を払う闇の全体大魔法 |
| 　 | `gokuhakua` | 氷華千本 | 氷 | phys | one | 0.45×8 | 星臨Ⅲ：氷の8連撃 |
| 　 | `gokujin` | 百獣の王 | 地 | phys | all | 2.4 | 星臨Ⅲ：弱点を突く全体攻撃 |
| 　 | `kazemai` | 疾風の舞 |  | haste | self |  | 味方全員の次の手番を早める |
| 　 | `ouen` | 応援の舞 |  | cheer | self |  | 味方全員のAG+15 |
| 　 | `megumi` | 星の恵み |  | grace | ally |  | 味方1人のAG+40 |
| 　 | `hoshiyomi` | 星読み |  | scan | self |  | 敵全体の弱点をすべて暴く |
| 　 | `zenkyo` | 全共鳴 |  | zen | all |  | 終の星臨：仲間全員の灯を束ねる大技。全員のAGを力に変える（1戦闘1回） |
| 　 | `ryuusa` | 流砂の刻 | 地 | mag | all | 1.1 | 地の魔法・敵全体 |
| 　 | `shuuen` | 終焉の針 |  | mag | one | 2.5 | 無属性・単体の大魔法 |
| 　 | `gokuceles` | 永劫の円環 |  | mag | all | 3.2 | 星臨Ⅲ：無属性の全体大魔法 |
| 　 | `gouka` | 劫火 | 炎 | phys | all | 1.1 | 炎・敵全体 |
| 　 | `ryuumetsu` | 竜滅斬 | 斬 | phys | one | 2.4 | 斬撃・単体の大技 |
| 　 | `gokuvalk` | 終焉竜咆 | 炎 | phys | all | 2.6 | 星臨Ⅲ：竜の全力・敵全体 |
| 　 | `seiten` | 星天の加護 |  | sup20 | self |  | 味方全員の受けるダメージ-20%（3ターン） |
| 　 | `kaihou` | 解き放つ祈り |  | sup20 | self |  | 味方全員の弱体を消し、HP15%回復 |
| 　 | `x_rio1` | 天灯星斬 | 光 | phys | one | 4.2 | 光の極大斬撃・単体 |
| 　 | `x_rio2` | 極光流星群 | 光 | phys | all | 0.85×3 | 光の3連撃・敵全体 |
| 　 | `x_gald1` | 天崩撃 | 地 | phys | one | 3.6 | 地の極大打撃＋敵の防御-30%（3ターン） |
| 　 | `x_gald2` | 不落の聖壁 |  | sup20 | self |  | 味方全員の被ダメ-35%（3ターン）＋3ターン挑発・反撃態勢 |
| 　 | `x_mire1` | ノヴァ・インフェルノ | 炎 | mag | all | 2.6 | 炎の極大魔法・敵全体 |
| 　 | `x_mire2` | アブソリュート・ゼロ | 氷 | mag | one | 4.6 | 氷の極大魔法・単体＋30%で凍結 |
| 　 | `x_shion1` | 瞬影千刃 | 風 | phys | one | 0.62×7 | 風の7連撃・単体 |
| 　 | `x_shion2` | 影縫・極 | 斬 | phys | all | 2.2 | 斬撃・敵全体＋行動を遅らせる |
| 　 | `x_noah1` | 天使の福音 |  | sup20 | self |  | 味方全員のHP60%回復・弱体解除＋継続回復（3ターン） |
| 　 | `x_noah2` | ジャッジメント | 光 | mag | all | 3 | 光の極大魔法・敵全体 |
| 　 | `x_erna1` | 天穿雷霆 | 雷 | phys | one | 4.6 | 雷の極大射撃・単体。防御を半分無視 |
| 　 | `x_erna2` | 流星雨 | 雷 | phys | all | 0.75×3 | 雷の矢の雨・敵全体に3連撃 |
| 　 | `x_balza1` | 灼熱の鉄槌 | 炎 | phys | one | 5 | 炎の極大打撃・単体（次の手番が遅い） |
| 　 | `x_balza2` | 炉心解放 | 炎 | phys | all | 2.5 | 炎・敵全体＋自分の攻撃+30%（3ターン） |
| 　 | `x_crow1` | 冥王の審判 | 闇 | mag | all | 2.8 | 闇の極大魔法・敵全体＋60%で毒 |
| 　 | `x_crow2` | 魂葬 | 闇 | mag | one | 4.4 | 闇の極大魔法・単体。与ダメの30%を吸収 |
| 　 | `x_hakua1` | 氷華千連 | 氷 | phys | one | 0.45×10 | 氷の10連撃・単体 |
| 　 | `x_hakua2` | 絶対零拳 | 氷 | phys | one | 4 | 氷の極大拳撃＋50%で凍結 |
| 　 | `x_jin1` | 獣王天翔 | 風 | phys | all | 2.3 | 風・敵全体の大技 |
| 　 | `x_jin2` | ポポ・メテオ | 地 | phys | one | 4.4 | ポポと地の極大突撃・単体 |
| 　 | `x_celes1` | 時空断裂 |  | mag | one | 4.2 | 時の極大魔法・単体 |
| 　 | `x_celes2` | 永劫の刻 |  | sup20 | self |  | 味方全員の素早さ+40%・攻撃/魔力+20%（3ターン） |
| 　 | `x_valk1` | 竜王滅炎 | 炎 | phys | all | 2.6 | 炎・敵全体の大技 |
| 　 | `x_valk2` | 黒竜断 | 闇 | phys | one | 4.8 | 闇の極大斬撃・単体 |

## 敵の行動（EA）

| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 |
|---|---|---|---|---|---|---|
| 　 | `ea:claw` | 攻撃 | 斬 | phys | one | 1 |
| 　 | `ea:bite` | 噛みつき | 突 | phys | one | 1.4 |
| 　 | `ea:press` | のしかかり | 打 | phys | one | 1.25 |
| 　 | `ea:wave` | 虚の波動 | 闇 | mag | all | 1.15 |
| 　 | `ea:roar` | 虚滅の咆哮 | 闇 | mag | all | 3 |
| 　 | `ea:spore` | 胞子 | 風 | mag | all | 0.8 |
| 　 | `ea:curse` | 呪詛の頁 | 闇 | mag | one | 1.3 |
| 　 | `ea:slam` | 石拳 | 打 | phys | one | 1.2 |
| 　 | `ea:kinju` | 禁呪・灰燼 | 炎 | mag | all | 2.6 |
| 　 | `ea:wave2` | 影の波 | 闇 | mag | all | 0.9 |
| 　 | `ea:bell` | 終末の鐘 | 闇 | mag | all | 2.8 |
| 　 | `ea:arrow` | 狙撃 | 突 | phys | one | 1.3 |
| 　 | `ea:rain` | 五月雨射ち | 突 | phys | all | 0.7 |
| 　 | `ea:senju` | 千呪 | 闇 | mag | all | 2.6 |
| 　 | `ea:meltdown` | 溶鉄の奔流 | 炎 | mag | all | 2.4 |
| 　 | `ea:bolt` | 雷撃 | 雷 | mag | one | 1.2 |
| 　 | `ea:blizzard` | 絶対氷河 | 氷 | mag | all | 2.5 |
| 　 | `ea:icewave` | 氷華の息 | 氷 | mag | all | 1.2 |
| 　 | `ea:slash2` | 鬼斬り | 斬 | phys | one | 1.5 |
| 　 | `ea:deluge` | 大海嘯 | 氷 | mag | all | 2.5 |
| 　 | `ea:tide` | 潮の刃 | 氷 | mag | one | 1.2 |
| 　 | `ea:mirror` | 幻影の一撃 |  | phys | all | 2.2 |
| 　 | `ea:starfall` | 星墜とし | 光 | mag | all | 2.6 |
| 　 | `ea:voidend` | 虚無の終焉 | 闇 | mag | all | 2.7 |
| 　 | `ea:eclipse` | 星蝕 | 闇 | phys | all | 2.4 |
| 　 | `ea:dslash` | 竜剣・断 | 斬 | phys | one | 1.6 |
| 　 | `ea:dfire` | 黒炎 | 炎 | mag | all | 1.2 |
| 　 | `ea:dbreath` | 竜の息吹 | 炎 | mag | all | 2.7 |
| 　 | `ea:chrono` | 時喰らい | 闇 | mag | all | 2.8 |
| 　 | `ea:ember` | 火の粉 | 炎 | mag | one | 1.1 |
| 　 | `ea:astral` | 星光の審判 | 光 | mag | all | 2.8 |
| 　 | `ea:abyss` | 深淵の大渦 | 氷 | mag | all | 2.8 |
| 　 | `ea:endray` | 終焉の光 | 闇 | mag | all | 3 |
| 　 | `ea:tidal` | 星海の奔流 | 氷 | mag | all | 1.15 |
| 　 | `ea:voidslash` | 虚空斬 | 闇 | phys | one | 1.6 |
| 　 | `ea:holyspear` | 光の槍 | 光 | mag | one | 1.5 |
| 　 | `ea:starclaw` | 星爪 | 斬 | phys | one | 1.3 |
| 　 | `ea:quake` | 大地震 | 地 | phys | all | 1.1 |
| 　 | `ea:genesis` | 原初の鉄槌 | 地 | phys | all | 3.2 |
| 　 | `ea:tokiyomi` | 刻詠みの終 | 闇 | mag | all | 3.1 |
| 　 | `ea:hadou` | 覇竜の咆哮 | 炎 | mag | all | 3.1 |
