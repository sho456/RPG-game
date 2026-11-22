# コード地図（自動生成：`python3 tools/codemap.py`。手で編集しない）

読み込み順（index.html）と、各ファイルの役割（先頭のコメント）。**後のファイルほど優先**。

| # | ファイル | KB | 役割 | 公開名 |
|---|---|---|---|---|
| 1 | `js/core.js` | 1 |  |  |
| 2 | `js/art.js` | 2 | ドット絵（1文字＝1ドット） |  |
| 3 | `js/sprite/legacy/dot.js` | 10 | ver0.19 ピクセルアート・レンダラ（dot.js） | PX |
| 4 | `js/engine.js` | 16 | 背景（ディザリング生成） |  |
| 5 | `js/items.js` | 11 | 装備（ハクスラ） | BSTAR |
| 6 | `js/ch1.js` | 7 | 第1章データ |  |
| 7 | `js/ch2.js` | 7 | 第2章データ |  |
| 8 | `js/ui-assets.js` | 2 | UI素材 |  |
| 9 | `js/ch3.js` | 14 | アイテムアイコン |  |
| 10 | `js/ch4.js` | 5 | 第4章データ |  |
| 11 | `js/ch5.js` | 5 | 戦闘表示（ver0.10） |  |
| 12 | `js/awaken.js` | 1 | ver0.11 星臨の深化 |  |
| 13 | `js/ch6.js` | 4 | ver0.12 レジェンド・天への塔（ジョブは ver0.38 で廃止） |  |
| 14 | `js/field.js` | 3 | セーブ |  |
| 15 | `js/town.js` | 8 | 灯都ルミナス | ISLE |
| 16 | `js/ch7.js` | 3 | ver0.13 終章「星核の残響」 |  |
| 17 | `js/ch8.js` | 13 | ver0.14 クリア後：虚の回廊・竜の巣・セレス・ヴァルク・虚蝕化エリア |  |
| 18 | `js/ch9.js` | 26 | ver0.15 絆と会話：絆イベント・会話ウィンドウ（表情5種）・専用ユニーク装備・図鑑 |  |
| 19 | `js/ver16.js` | 13 | ver0.16 音と絵：エリア別BGM・星臨BGM切替・戦闘キャラ48×48ドット・（部位破壊は ver0.25 で削除） |  |
| 20 | `js/ver17.js` | 18 | ver0.17 快適さ＋UI再構築 |  |
| 21 | `js/ver19-pre.js` | 0 | ver0.19（前処理） |  |
| 22 | `js/sprite/legacy/px.js` | 22 | ver0.18 ドット絵エンジン |  |
| 23 | `js/sprite/legacy/px-hero.js` | 12 | ver0.18 仲間12人のドット絵（頭・胴は手描き、腕・脚・武器は姿勢から描く） |  |
| 24 | `js/sprite/legacy/px-enemy.js` | 40 | ver0.18 敵・ボスのドット絵（右向き）。種族ごとに専用の体つき・動き・攻撃モーションを持つ |  |
| 25 | `js/ver18-battle.js` | 1 | ver0.18 戦闘（ver0.32 で整理） |  |
| 26 | `js/ver18-maps.js` | 7 | ver0.18 探索マップの再設計 |  |
| 27 | `js/ver18-field.js` | 1 | ver0.18 探索の名残：マップの差し替え・宝箱の移し替え・塔と回廊の番人の広間（探索の描画・敵の配置・ミニマップは探索マップの廃止で削除） |  |
| 28 | `js/ver18-art.js` | 14 | ver0.18 顔グラ・立ち絵・図鑑の絵・アイコン（16×16）・街の人 |  |
| 29 | `js/ver18-town.js` | 20 | ver0.18 拠点：ホーム画面（灯都ルミナスの街並み）・酒場・依頼掲示板・道具屋・各施設の店内 |  |
| 30 | `js/sprite/legacy/dot-rig.js` | 9 | ver0.19 キャラクター・リグ（人型） | HUM SPRX |
| 31 | `js/sprite/legacy/dot-mon.js` | 21 | ver0.19 敵キャラクターのドット絵定義 |  |
| 32 | `js/motion/anim.js` | 14 | ver0.19 アニメーション管理 | ANIM |
| 33 | `js/ver19.js` | 18 | ver0.19 ドット絵・待機モーション・戦闘演出の全面強化（戦闘への統合） | V19 |
| 34 | `js/ver19-art.js` | 6 | ver0.19 絵柄の統一：顔グラ・立ち絵・会話の表情・探索／街／ワールドマップの歩き姿 | V19A |
| 35 | `js/v20-battle.js` | 24 | ver0.20 戦闘の深化：状態効果・専用パッシブ・新スキル／魔法・敵の新戦術 | V20 |
| 36 | `js/v20-ui.js` | 5 | ver0.20 UI の全面改善 | V20UI |
| 37 | `js/v21-items.js` | 6 | ver0.21 装備・アイテムのドット絵（24×24）を全面刷新 | IC21 |
| 38 | `js/v21-art.js` | 53 | ver0.21 装備・アイテムのデザイン定義 |  |
| 39 | `js/v21.js` | 8 | ver0.21 表示の改善 | V21 |
| 40 | `js/v22.js` | 28 | ver0.22 画面の全面改良・「星臨」・ミッション一括受け取り・開発者モード拡張 | V22 |
| 41 | `js/v24-text.js` | 3 | ver0.24 演出文字レンダラー（TX24） | TX24 |
| 42 | `js/data/terms.js` | 9 | ver0.29 呼称・分類の共通規格（TERMS） | TERMS |
| 43 | `js/motion/registry.js` | 2 | ver0.29 モーション台帳（MOTION） | MOTION |
| 44 | `js/sprite/facing.js` | 4 | ver0.29 キャラクターの向き（FACING）：向きを決める唯一の窓口 | FACING |
| 45 | `js/data/skeleton-overrides.js` | 1 | ver0.29 骨格の手動修正（SKEL_OVR） |  |
| 46 | `js/motion/skeleton.js` | 9 | ver0.29 骨格・関節・可動域（SKEL） | SKEL |
| 47 | `js/sprite/data/spx-data.js` | 95 | 自動生成：旧 tools/build_spx.py の出力を tools/spx_normalize.py が整えたもの（提供原画 → パレット番号 PNG）。手で編集しない |  |
| 48 | `js/sprite/data/spx-data-enemy.js` | 1005 | （データ。読まない） |  |
| 49 | `js/sprite/data/spx-data-heroes.js` | 1000 | （データ。読まない） |  |
| 50 | `js/sprite/data/spx-data-chars.js` | 0 | 自動生成：tools/spx_import.py（素材パック assets_src/chars の各 character.json）。手で編集しない |  |
| 51 | `js/sprite/spx.js` | 31 | ドット絵刷新：提供原画から作ったスプライト（SPX）を、既存の描画の入口で差し替える | SPX |
| 52 | `js/zukan/viewer.js` | 11 | ver0.30 図鑑のキャラクタービューア（ZVIEW） | ZVIEW |
| 53 | `js/zukan/zukan.js` | 13 | 図鑑（一覧・詳細） ver0.30 | ZUKAN |
| 54 | `js/v29.js` | 2 | ver0.29 呼称・ドット絵・モーション管理・図鑑の全面整理 | V29 |
| 55 | `js/v30.js` | 2 | ver0.30 図鑑の基準画像・星臨の縮尺統一・素材制作パイプライン | V30 |
| 56 | `js/v31/core.js` | 7 | ver0.31 共通：能力のインフレ・レベル上限120・限界突破・新しい能力値 | V31 |
| 57 | `js/v31/items.js` | 17 | ver0.31 装備：枠の再編・各レアリティの新装備・新レジェンド | V31I |
| 58 | `js/data/resist.js` | 4 | 属性耐性（ELR：防具の耐性値・キャラの合計・被ダメージの倍率の正本。新規） | ELR |
| 59 | `js/v31/board.js` | 15 | ver0.31 天星盤（星盤の上位版）・極技・新しいパッシブ | V31B |
| 60 | `js/v31/enemies.js` | 12 | ver0.31 敵：インフレに合わせた強さの曲線・各章の中ボス・エンドコンテンツの敵 | V31E |
| 61 | `js/v31/quest-data.js` | 24 | ver0.31 クエストのデータ（章・クエスト・会話） | QD |
| 62 | `js/v32.js` | 2 | ver0.32 図鑑の絞り込み・敵の大きさ・向き・クエスト情報 | V32 |
| 63 | `js/v33.js` | 1 | ver0.33 不具合の修正・戦闘の仕組みの整理・狼と狐の原画 | V33 |
| 64 | `js/items/icons36.js` | 31 | ver0.36 武器・防具・装飾品のアイコンを作り直す（IC36） | IC36 |
| 65 | `js/battle/size.js` | 2 | 戦闘の表示サイズ：敵の大きさを種類ごとにそろえる（ver0.40。正本） | BSIZE |
| 66 | `js/battle/version.js` | 2 | 戦闘演出の全面刷新（ver0.34〜）：版表示・お知らせ | V34 |
| 67 | `js/rs/data.js` | 25 | ver0.37 戦闘システム刷新（データ） | RSD |
| 68 | `js/rs/abilities.js` | 2 | アビリティ（AB・ABL の正本。ver0.45：3 段階＋段階Ⅲの固有名の特殊効果） |  |
| 69 | `js/rs/core.js` | 21 | 戦闘システム（能力値・習得・技セット・アビリティ・陣形・セーブ） | RSC |
| 70 | `js/data/equip7.js` | 4 | 装備の能力影響（EQ7：装備が上げるのは基礎ステータスだけ。ver0.45 新規の正本） | EQ7 |
| 71 | `js/rs/mastery.js` | 17 | 技・術の練達（RSM。ver0.47 新規の正本。旧「技Lv（熟練）」を置き換え） | RSM |
| 72 | `js/v38/core.js` | 4 | ver0.38 土台：攻撃属性 8 種・武器種 8 種・セーブの移行・LP | V38 |
| 73 | `js/v38/menu.js` | 16 | ver0.38 画面全体の整理 | V38M |
| 74 | `js/v38/help.js` | 8 | ver0.38 タップで詳細（V38H） | V38H |
| 75 | `js/ui/skill-icons.js` | 3 | 技・術のアイコン（SKICON：白いシルエットの絵柄 27 種＋技 → 絵柄の対応。js/rs/ui.js の skIcon が使う） |  |
| 76 | `js/ui/board.js` | 5 | 星盤・天星盤の画面（ver0.39 で 1 ファイルにまとめた。画面の正本はここ） | BOARDUI |
| 77 | `js/ui/equip-info.js` | 4 | 装備品の詳細（EQINFO：装備アイコンのタップで出るポップアップの正本。新規） | EQINFO |
| 78 | `js/ui/party.js` | 0 | 旧画面の入口 → 仲間画面（UNIT）へ（ver0.53。旧「編成画面と陣形」の正本はコマンド戦闘と一緒に削除した） |  |
| 79 | `js/ui/inv.js` | 8 | 持ち物・鑑定の画面の正本（ver0.54。共通の全画面の枠 FAC も、鍛冶屋 js/ui/smith.js がここを使う） | FAC INV APR |
| 80 | `js/ui/smith.js` | 7 | 鍛冶屋の画面（ver0.54。正本：town.js の smith・enhance・opSwap・sockMenu と v31/items.js・ver18-town.js の包み | SMITH44 |
| 81 | `js/ui/keywords.js` | 8 | 用語のハイライト（KW：効果の説明文の用語を緑で示し、タップで詳しい説明を出す正本。ver0.45 新規） | KW |
| 82 | `js/ui/growth.js` | 5 | 強化メニュー（経験値のストックとレベルアップ・旧「酒場」を統合した正本。ver0.48 新規） | GROW |
| 83 | `js/td/data.js` | 8 | TD のデータ（仲間・敵の変換・数値の定数・報酬。ステージは js/td/stages.js）。設計は docs/TD-DESIGN.md | TDD |
| 84 | `js/td/stages.js` | 13 | TD のステージと章（TDD.STAGE・TDD.CH・TDD.ORDER の正本）。書式は docs/TD-DESIGN.md 6 章・スキル td-stage-author |  |
| 85 | `js/td/sim.js` | 17 | TD の戦闘シミュレーション（TDS）。DOM・時計・描画に触れない純粋なロジック | TDS |
| 86 | `js/td/bg.js` | 9 | TD の戦場の背景（TDBG）：章ごとの空・遠景・中景・地面と道・灯（拠点）。横スクロールの奥行き（遠いほどゆっくり動く） | TDBG |
| 87 | `js/td/sfx.js` | 10 | TD の音（TDSFX）：WebAudio で合成する効果音と、章ごとの短い BGM。音源ファイルなし | TDSFX |
| 88 | `js/td/fx.js` | 21 | TD の戦闘の演出（TDFX）：技ごとのエフェクト・星臨の短い暗転・粒・敵の歩き/被弾/崩れ。描くだけで、ロジック（TDS）の結果に触れない | TDFX |
| 89 | `js/td/view.js` | 22 | TD の戦闘画面（TD）：横スクロールの戦場・上下の帯・手札・ユニットの窓・リザルト。ロジックは js/td/sim.js（TDS） | TD |
| 90 | `js/td/guide.js` | 5 | TD の字を使わない導き（GUIDE）の正本：最初の 1〜2 面で、光る指・脈打つ輪・矢印だけで操作を順に示す | GUIDE |
| 91 | `js/td/menu.js` | 15 | TD の章の地図・出撃準備・会話・仲間の加入（TDM）。戦闘画面は js/td/view.js（TD） | TDM |
| 92 | `js/ui/home.js` | 4 | ホーム画面（灯都ルミナス）の正本：TD「防衛」を主役にした重ね表示 | HOME |
| 93 | `js/ui/unit.js` | 6 | 仲間の画面（UNIT）：TD 用の一覧＋1 人の詳細。Lv・装備・技の練達・星臨・星盤をここにまとめる | UNIT |
| 94 | `js/ui/zukan.js` | 3 | 図鑑の一覧（ZKUI）：敵・仲間・装備の全画面の一覧。ver0.54 新規 | ZKUI |

## 上書きの連鎖（2 ファイル以上で定義・上書きされる関数）

最後の行のファイルが今の動きの正本。直すときはまずそこを見る。個別の行番号は `python3 tools/codemap.py 関数名`。

| 関数 | 定義 → 上書き（読み込み順） |
|---|---|
| `draw` | engine.js → ver16.js → ver17.js → sprite/legacy/dot-rig.js → ver19.js → v21.js → v22.js → sprite/spx.js → zukan/viewer.js → ui/inv.js → ui/growth.js → td/fx.js → td/view.js → ui/unit.js → ui/zukan.js |
| `migrate` | items.js → ch8.js → ch9.js → ver17.js → ver18-field.js → v31/items.js → data/resist.js → v31/quest-data.js → v32.js → rs/core.js → data/equip7.js → v38/core.js |
| `build` | motion/skeleton.js → items/icons36.js → v38/help.js → ui/growth.js → td/view.js → td/guide.js → td/menu.js → ui/home.js → ui/unit.js → ui/zukan.js |
| `show` | core.js → ver17.js → ver18-town.js → v20-ui.js → v22.js → v38/help.js → ui/inv.js → ui/keywords.js → td/view.js → td/menu.js |
| `close` | ver17.js → v38/help.js → ui/equip-info.js → ui/keywords.js → ui/growth.js → td/menu.js → ui/unit.js → ui/zukan.js |
| `open` | v38/help.js → ui/equip-info.js → ui/growth.js → td/view.js → td/menu.js → ui/unit.js → ui/zukan.js |
| `stats` | engine.js → v31/core.js → v31/items.js → rs/core.js → data/equip7.js → ui/unit.js |
| `townMenu` | town.js → v22.js → v38/menu.js → ui/inv.js → td/menu.js → ui/home.js |
| `face` | ui-assets.js → sprite/legacy/dot-rig.js → ver19-art.js → sprite/spx.js → td/view.js |
| `frameOf` | sprite/legacy/px.js → sprite/legacy/px-enemy.js → ver19-art.js → sprite/spx.js → zukan/viewer.js |
| `keyOf` | sprite/legacy/dot-rig.js → ver19.js → v21-items.js → v31/items.js → rs/core.js |
| `onClick` | ui/growth.js → td/view.js → td/menu.js → ui/unit.js → ui/zukan.js |
| `panel` | town.js → ver18-town.js → v20-ui.js → v22.js → v38/help.js |
| `addLoot` | items.js → ch9.js → ver17.js → v20-ui.js |
| `drawUnit` | engine.js → ver16.js → ver17.js → td/view.js |
| `enterTown` | town.js → ch8.js → ver18-town.js → v22.js |
| `fit` | core.js → v21.js → v22.js → td/view.js |
| `genItem` | items.js → v31/items.js → data/resist.js → data/equip7.js |
| `kBoss` | ch8.js → ver19-pre.js → sprite/spx.js → v31/enemies.js |
| `loop` | v21-art.js → zukan/viewer.js → td/view.js → td/guide.js |
| `refresh` | engine.js → ver17.js → v20-ui.js → v22.js |
| `stop` | motion/anim.js → zukan/viewer.js → td/view.js → td/guide.js |
| `voidKind` | ch8.js → ver19-pre.js → ver18-art.js → sprite/spx.js |
| `add` | data/terms.js → ui/growth.js → td/fx.js |
| `art` | ver17.js → ver19-art.js → sprite/spx.js |
| `base` | motion/anim.js → sprite/facing.js → td/bg.js |
| `bonus` | items.js → ch9.js → v31/board.js |
| `cap` | sprite/legacy/dot-rig.js → ui/inv.js → ui/growth.js |
| `drawBoard` | items.js → ver17.js → v31/board.js |
| `exprFace` | ch9.js → ver19-art.js → sprite/spx.js |
| `frame` | sprite/legacy/dot-rig.js → ver19-art.js → v21.js |
| `gainXP` | engine.js → v31/core.js → ui/growth.js |
| `hide` | ui/inv.js → td/view.js → td/guide.js |
| `itemIcon` | ch3.js → v21-art.js → v31/items.js |
| `key` | ver18-field.js → sprite/facing.js → ui/smith.js |
| `leg` | sprite/legacy/px.js → sprite/legacy/px-enemy.js → sprite/legacy/dot-rig.js |
| `menu` | engine.js → ver18-town.js → v22.js |
| `mid` | ver19.js → td/bg.js → td/guide.js |
| `mix` | sprite/legacy/dot.js → v22.js → td/bg.js |
| `openBoard` | items.js → v21.js → v31/board.js |
| `pic` | ui/growth.js → td/menu.js → ui/unit.js |
| `portrait` | ver18-art.js → ver19-art.js → sprite/spx.js |
| `rewards` | engine.js → rs/mastery.js → ui/growth.js |
| `ring` | v21-art.js → td/sfx.js → td/guide.js |
| `royalItem` | ch5.js → v31/items.js → data/resist.js |
| `step` | td/fx.js → td/guide.js → td/menu.js |
| `title` | town.js → v22.js → v38/menu.js |
| `ATK` | engine.js → v38/core.js |
| `BCH` | items.js → v21.js |
| `INF` | v31/core.js → rs/core.js |
| `appraise` | town.js → ui/inv.js |
| `arm` | sprite/legacy/px.js → sprite/legacy/dot-rig.js |
| `back` | zukan/zukan.js → td/fx.js |
| `bar` | ui/inv.js → td/view.js |
| `blade` | sprite/legacy/dot-rig.js → items/icons36.js |
| `board` | town.js → ui/party.js |
| `boardMenu` | items.js → ui/board.js |
| `boardTap` | items.js → v31/board.js |
| `bondMenu` | ch9.js → ui/party.js |
| `bpos` | items.js → v21.js |
| `breathLine` | motion/skeleton.js → sprite/spx.js |
| `calc` | core.js → data/terms.js |
| `cfgOpen` | ver17.js → v38/menu.js |
| `chain` | sprite/legacy/dot-rig.js → v21-art.js |
| `chip` | data/terms.js → td/view.js |
| `costOf` | rs/core.js → rs/mastery.js |
| `detail` | zukan/zukan.js → ui/unit.js |
| `drawHome` | ver18-town.js → v22.js |
| `drawTitle` | ui-assets.js → ver18-town.js |
| `drawTown` | field.js → ver18-town.js |
| `edge` | td/view.js → td/guide.js |
| `enhance` | town.js → ui/smith.js |
| `ensure` | v21.js → ui/inv.js |
| `fixedItem` | items.js → v31/items.js |
| `flask` | ver18-art.js → v21-art.js |
| `fuQ` | v20-battle.js → v31/board.js |
| `has` | sprite/facing.js → td/sim.js |
| `healAll` | field.js → v38/core.js |
| `hex` | sprite/spx.js → items/icons36.js |
| `hiImg` | ver16.js → ver19.js |
| `hsl2rgb` | sprite/legacy/dot.js → v31/enemies.js |
| `html` | rs/mastery.js → ui/equip-info.js |
| `hud` | ui-assets.js → td/view.js |
| `hueTo` | sprite/legacy/dot.js → sprite/legacy/px.js |
| `icard` | town.js → v20-battle.js |
| `icon` | ver19.js → td/sfx.js |
| `iicon` | ch3.js → ver18-art.js |
| `invMenu` | town.js → ui/inv.js |
| `list` | zukan/zukan.js → ui/unit.js |
| `look` | ver19-art.js → ui/keywords.js |
| `makeBg` | engine.js → v22.js |
| `makeKairouArea` | ch8.js → ver18-field.js |
| `makeTowerArea` | ch6.js → ver18-field.js |
| `makeTown` | field.js → ver18-town.js |
| `map` | td/stages.js → td/menu.js |
| `mark` | zukan/zukan.js → ui/keywords.js |
| `need` | ui/smith.js → ui/growth.js |
| `newMember` | ch1.js → v31/items.js |
| `openSheet` | ch3.js → ui/party.js |
| `parse` | ver19-art.js → sprite/spx.js |
| `part` | sprite/legacy/px.js → td/fx.js |
| `partyScreen` | ver17.js → ui/party.js |
| `power` | ver17.js → v31/board.js |
| `put` | ver16.js → items/icons36.js |
| `ramp` | sprite/legacy/dot.js → sprite/legacy/px.js |
| `reg` | sprite/legacy/dot-rig.js → ui/keywords.js |
| `render` | v21-items.js → items/icons36.js |
| `result` | ui/inv.js → td/view.js |
| `rgb2hsl` | sprite/legacy/dot.js → v31/enemies.js |
| `rng` | engine.js → td/sim.js |
| `roomOpen` | ver18-town.js → v22.js |
| `row` | zukan/zukan.js → data/resist.js |
| `run` | td/sim.js → td/menu.js |
| `set` | sprite/facing.js → td/view.js |
| `shade` | items.js → items/icons36.js |
| `shadow` | v21-items.js → items/icons36.js |
| `skillList` | items.js → rs/core.js |
| `smith` | town.js → ui/smith.js |
| `sparks` | v21-items.js → td/fx.js |
| `start` | zukan/viewer.js → td/guide.js |
| `stat` | v38/help.js → ui/unit.js |
| `stock` | ui/smith.js → ui/growth.js |
| `sum` | data/resist.js → data/equip7.js |
| `tick` | motion/anim.js → td/sim.js |
| `tierOf` | v21-items.js → v31/items.js |
| `tip` | ver17.js → td/view.js |
| `toast` | v22.js → ui/smith.js |
| `toggle` | sprite/facing.js → td/sfx.js |
| `ult` | td/sim.js → td/fx.js |
| `wbase` | items.js → ch8.js |
| `whiteOf` | sprite/legacy/dot.js → ver16.js |
| `zimg` | ch9.js → v31/enemies.js |
| `zkEnemy` | ch9.js → zukan/zukan.js |
| `zkHero` | ch9.js → zukan/zukan.js |
