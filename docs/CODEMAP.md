# コード地図（自動生成：`python3 tools/codemap.py`。手で編集しない）

読み込み順（index.html）と、各ファイルの役割（先頭のコメント）。**後のファイルほど優先**。

| # | ファイル | KB | 役割 | 公開名 |
|---|---|---|---|---|
| 1 | `js/core.js` | 1 |  |  |
| 2 | `js/art.js` | 2 | ドット絵（1文字＝1ドット） |  |
| 3 | `js/sprite/legacy/dot.js` | 10 | ver0.19 ピクセルアート・レンダラ（dot.js） | PX |
| 4 | `js/engine.js` | 42 | 背景（ディザリング生成） |  |
| 5 | `js/items.js` | 17 | 装備（ハクスラ） | BSTAR |
| 6 | `js/ch1.js` | 7 | 第1章データ |  |
| 7 | `js/ch2.js` | 7 | 第2章データ |  |
| 8 | `js/ui-assets.js` | 3 | UI素材 |  |
| 9 | `js/ch3.js` | 19 | アイテムアイコン |  |
| 10 | `js/ch4.js` | 6 | 第4章データ |  |
| 11 | `js/ch5.js` | 11 | 戦闘表示（ver0.10） |  |
| 12 | `js/awaken.js` | 5 | ver0.11 星臨の深化 |  |
| 13 | `js/ch6.js` | 4 | ver0.12 レジェンド・天への塔（ジョブは ver0.38 で廃止） |  |
| 14 | `js/field.js` | 30 | セーブ |  |
| 15 | `js/town.js` | 31 | 灯都ルミナス | ISLE |
| 16 | `js/ch7.js` | 8 | ver0.13 終章「星核の残響」 |  |
| 17 | `js/ch8.js` | 22 | ver0.14 クリア後：虚の回廊・竜の巣・セレス・ヴァルク・虚蝕化エリア |  |
| 18 | `js/dev.js` | 9 | 開発者モード（通常セーブとは別枠 astral_save_dev） |  |
| 19 | `js/ch9.js` | 37 | ver0.15 絆と会話：絆イベント・会話ウィンドウ（表情5種）・専用ユニーク装備・図鑑 |  |
| 20 | `js/ver16.js` | 16 | ver0.16 音と絵：エリア別BGM・星臨BGM切替・戦闘キャラ48×48ドット・（部位破壊は ver0.25 で削除） |  |
| 21 | `js/ver17.js` | 45 | ver0.17 快適さ＋UI再構築 |  |
| 22 | `js/ver19-pre.js` | 0 | ver0.19（前処理） |  |
| 23 | `js/sprite/legacy/px.js` | 22 | ver0.18 ドット絵エンジン |  |
| 24 | `js/sprite/legacy/px-hero.js` | 12 | ver0.18 仲間12人のドット絵（頭・胴は手描き、腕・脚・武器は姿勢から描く） |  |
| 25 | `js/sprite/legacy/px-enemy.js` | 40 | ver0.18 敵・ボスのドット絵（右向き）。種族ごとに専用の体つき・動き・攻撃モーションを持つ |  |
| 26 | `js/ver18-battle.js` | 3 | ver0.18 戦闘（ver0.32 で整理） |  |
| 27 | `js/ver18-maps.js` | 7 | ver0.18 探索マップの再設計 |  |
| 28 | `js/ver18-field.js` | 31 | ver0.18 探索：タイルの描き直し・フィールドのキャラ表示・敵配置・ミニマップ |  |
| 29 | `js/ver18-art.js` | 17 | ver0.18 顔グラ・立ち絵・図鑑の絵・アイコン（16×16）・街の人 |  |
| 30 | `js/ver18-town.js` | 33 | ver0.18 拠点：ホーム画面（灯都ルミナスの街並み）・酒場・依頼掲示板・道具屋・各施設の店内 |  |
| 31 | `js/sprite/legacy/dot-rig.js` | 9 | ver0.19 キャラクター・リグ（人型） | HUM SPRX |
| 32 | `js/sprite/legacy/dot-heroes.js` | 26 | ver0.19 味方キャラクターのドット絵定義 |  |
| 33 | `js/sprite/legacy/dot-mon.js` | 21 | ver0.19 敵キャラクターのドット絵定義 |  |
| 34 | `js/motion/anim.js` | 14 | ver0.19 アニメーション管理 | ANIM |
| 35 | `js/motion/fx19.js` | 11 | ver0.19 戦闘エフェクト | FX19 |
| 36 | `js/ver19.js` | 31 | ver0.19 ドット絵・待機モーション・戦闘演出の全面強化（戦闘への統合） | V19 |
| 37 | `js/ver19-art.js` | 6 | ver0.19 絵柄の統一：顔グラ・立ち絵・会話の表情・探索／街／ワールドマップの歩き姿 | V19A |
| 38 | `js/v20-battle.js` | 32 | ver0.20 戦闘の深化：状態効果・専用パッシブ・新スキル／魔法・敵の新戦術 | V20 |
| 39 | `js/v20-ui.js` | 23 | ver0.20 UI の全面改善 | V20UI |
| 40 | `js/v21-items.js` | 6 | ver0.21 装備・アイテムのドット絵（24×24）を全面刷新 | IC21 |
| 41 | `js/v21-art.js` | 53 | ver0.21 装備・アイテムのデザイン定義 |  |
| 42 | `js/v21.js` | 13 | ver0.21 表示の改善 | V21 |
| 43 | `js/v22.js` | 49 | ver0.22 画面の全面改良・「星臨」・ミッション一括受け取り・開発者モード拡張 | V22 |
| 44 | `js/v23.js` | 20 | ver0.23 戦闘画面・ダメージ演出・ホーム・図鑑・画面倍率・探索・星臨演出の改良 | V23 |
| 45 | `js/v24-text.js` | 12 | ver0.24 演出文字レンダラー（TX24） | TX24 |
| 46 | `js/v24.js` | 27 | ver0.24 戦闘演出の品質向上（大規模ドット絵アップデートの下準備） | V24 RM |
| 47 | `js/v25.js` | 25 | ver0.25 戦闘画面の全面リデザイン | V25 |
| 48 | `js/data/terms.js` | 9 | ver0.29 呼称・分類の共通規格（TERMS） | TERMS |
| 49 | `js/motion/registry.js` | 4 | ver0.29 モーション台帳（MOTION） | MOTION |
| 50 | `js/sprite/facing.js` | 4 | ver0.29 キャラクターの向き（FACING）：向きを決める唯一の窓口 | FACING |
| 51 | `js/data/skeleton-overrides.js` | 1 | ver0.29 骨格の手動修正（SKEL_OVR） |  |
| 52 | `js/motion/skeleton.js` | 9 | ver0.29 骨格・関節・可動域（SKEL） | SKEL |
| 53 | `js/sprite/data/spx-data.js` | 95 | 自動生成：旧 tools/build_spx.py の出力を tools/spx_normalize.py が整えたもの（提供原画 → パレット番号 PNG）。手で編集しない |  |
| 54 | `js/sprite/data/spx-data-enemy.js` | 1005 | （データ。読まない） |  |
| 55 | `js/sprite/data/spx-data-heroes.js` | 1000 | （データ。読まない） |  |
| 56 | `js/sprite/data/spx-data-chars.js` | 0 | 自動生成：tools/spx_import.py（素材パック assets_src/chars の各 character.json）。手で編集しない |  |
| 57 | `js/sprite/spx.js` | 30 | ドット絵刷新：提供原画から作ったスプライト（SPX）を、既存の描画の入口で差し替える | SPX |
| 58 | `js/zukan/viewer.js` | 11 | ver0.30 図鑑のキャラクタービューア（ZVIEW） | ZVIEW |
| 59 | `js/zukan/zukan.js` | 16 | 図鑑（一覧・詳細） ver0.30 | ZUKAN |
| 60 | `js/v29.js` | 3 | ver0.29 呼称・ドット絵・モーション管理・図鑑の全面整理 | V29 |
| 61 | `js/v30.js` | 5 | ver0.30 図鑑の基準画像・星臨の縮尺統一・素材制作パイプライン | V30 |
| 62 | `js/v31/core.js` | 8 | ver0.31 共通：能力のインフレ・レベル上限120・限界突破・新しい能力値 | V31 |
| 63 | `js/v31/items.js` | 18 | ver0.31 装備：枠の再編・各レアリティの新装備・新レジェンド | V31I |
| 64 | `js/v31/board.js` | 20 | ver0.31 天星盤（星盤の上位版）・極技・新しいパッシブ | V31B |
| 65 | `js/v31/enemies.js` | 13 | ver0.31 敵：インフレに合わせた強さの曲線・各章の中ボス・エンドコンテンツの敵 | V31E |
| 66 | `js/v31/quest-data.js` | 23 | ver0.31 クエストのデータ（章・クエスト・会話） | QD |
| 67 | `js/v31/quests.js` | 36 | ver0.31 クエスト制（マップ探索の廃止） | V31Q |
| 68 | `js/v32.js` | 3 | ver0.32 図鑑の絞り込み・敵の大きさ・向き・クエスト情報 | V32 |
| 69 | `js/v33.js` | 2 | ver0.33 不具合の修正・戦闘の仕組みの整理・狼と狐の原画 | V33 |
| 70 | `js/items/icons36.js` | 31 | ver0.36 武器・防具・装飾品のアイコンを作り直す（IC36） | IC36 |
| 71 | `js/battle/size.js` | 2 | 戦闘の表示サイズ：敵の大きさを種類ごとにそろえる（ver0.40。正本） | BSIZE |
| 72 | `js/battle/core.js` | 13 | ver0.34 戦闘演出の基盤（BX） | BX |
| 73 | `js/battle/prim.js` | 17 | ver0.34 戦闘エフェクトの部品（BXP） | BXP |
| 74 | `js/battle/rig.js` | 6 | ver0.35 1 枚絵を曲げて動かす（BXR） | BXR |
| 75 | `js/battle/seq.js` | 8 | ver0.34 技の演出の台帳と再生（BXS） | BXS |
| 76 | `js/battle/data/fx-heroes-rio.js` | 7 | 技の演出：リオ（灯守見習い・片手剣・光） |  |
| 77 | `js/battle/data/fx-heroes-gald.js` | 4 | 技の演出：ガルド（元騎士団長・大剣と盾・地） |  |
| 78 | `js/battle/data/fx-heroes-mire.js` | 6 | 技の演出：ミレイユ（魔導書・炎と氷） |  |
| 79 | `js/battle/data/motion-heroes.js` | 13 | ver0.35 味方のモーション（12 人） | BXM |
| 80 | `js/battle/viewer.js` | 10 | ver0.34 演出の設定・星臨演出の長さ・演出ビューア | BXV |
| 81 | `js/battle/version.js` | 2 | 戦闘演出の全面刷新（ver0.34〜）：版表示・お知らせ | V34 |
| 82 | `js/battle/flow.js` | 5 | 戦闘の行動演出：ロマサガRS の流れ（ver0.42。正本） | BFLOW |
| 83 | `js/rs/data.js` | 30 | ver0.37 戦闘システム刷新（データ） | RSD |
| 84 | `js/rs/core.js` | 20 | 戦闘システム（能力値・習得・技セット・アビリティ・陣形・セーブ） | RSC |
| 85 | `js/rs/battle.js` | 26 | 戦闘の進行（ターン制・BP・HP/LP） | RSB |
| 86 | `js/rs/ui.js` | 21 | 戦闘システムの画面 | RSU |
| 87 | `js/v38/core.js` | 4 | ver0.38 土台：攻撃属性 8 種・武器種 8 種・セーブの移行・LP | V38 |
| 88 | `js/v38/battle-ui.js` | 6 | ver0.38 戦闘画面 | V38B |
| 89 | `js/v38/menu.js` | 7 | ver0.38 画面全体の整理 | V38M |
| 90 | `js/v38/help.js` | 7 | ver0.38 タップで詳細（V38H） | V38H |
| 91 | `js/ui/skill-icons.js` | 5 | 技・術のアイコン（SKICON：白いシルエットの絵柄 27 種＋技 → 絵柄の対応。js/rs/ui.js の skIcon が使う） |  |
| 92 | `js/ui/board.js` | 5 | 星盤・天星盤の画面（ver0.39 で 1 ファイルにまとめた。画面の正本はここ） | BOARDUI |
| 93 | `js/ui/equip-info.js` | 4 | 装備品の詳細（EQINFO：装備アイコンのタップで出るポップアップの正本。新規） | EQINFO |
| 94 | `js/ui/party.js` | 8 | 編成画面と陣形（ver0.41 で 1 ファイルにまとめた。画面の正本はここ。旧 js/v38/party.js を置き換え） | V38P |
| 95 | `js/ui/damage.js` | 3 | 戦闘のダメージ表示の書体（TX24 の書式の最終定義。ロマサガRS の録画に合わせた） |  |

## 上書きの連鎖（2 ファイル以上で定義・上書きされる関数）

最後の行のファイルが今の動きの正本。直すときはまずそこを見る。個別の行番号は `python3 tools/codemap.py 関数名`。

| 関数 | 定義 → 上書き（読み込み順） |
|---|---|
| `title` | town.js → ver16.js → ver17.js → ver18-town.js → ver19.js → v20-ui.js → v21.js → v22.js → v23.js → v24.js → v25.js → v30.js → v31/core.js → v31/quests.js → v32.js → v33.js → battle/version.js → v38/menu.js |
| `draw` | engine.js → ver16.js → ver17.js → sprite/legacy/dot-rig.js → motion/fx19.js → ver19.js → v21.js → v22.js → v23.js → v25.js → sprite/spx.js → zukan/viewer.js → v31/quests.js → battle/core.js → battle/flow.js → rs/ui.js → v38/battle-ui.js |
| `dvMenu` | dev.js → ch9.js → ver16.js → ver17.js → ver18-town.js → v20-ui.js → v21.js → v22.js → v23.js → v24.js → v25.js → v29.js → v30.js → v31/quests.js → battle/viewer.js |
| `startBattle` | engine.js → ch8.js → ver18-battle.js → ver19.js → v20-battle.js → v21.js → v22.js → v23.js → v24.js → v25.js → battle/seq.js → rs/battle.js → v38/core.js → v38/battle-ui.js |
| `show` | core.js → ver17.js → ver18-town.js → v20-ui.js → v22.js → v23.js → v24.js → v25.js → battle/flow.js → v38/battle-ui.js → v38/help.js |
| `migrate` | items.js → ch8.js → ch9.js → ver17.js → ver18-field.js → v31/items.js → v31/quests.js → v32.js → rs/core.js → v38/core.js |
| `townMenu` | town.js → ch9.js → ver17.js → ver18-town.js → v20-ui.js → v21.js → v22.js → v23.js → v31/quests.js → v38/menu.js |
| `calc` | engine.js → ch8.js → ch9.js → ver19.js → v20-battle.js → data/terms.js → v31/core.js → rs/battle.js |
| `refresh` | engine.js → ch5.js → ver17.js → v20-ui.js → v22.js → v24.js → v25.js → v31/quests.js |
| `awaken` | engine.js → ch8.js → v22.js → v23.js → v25.js → battle/viewer.js → rs/battle.js |
| `hero` | engine.js → ver18-battle.js → v20-battle.js → v31/items.js → v31/board.js → battle/viewer.js → rs/core.js |
| `row` | ch3.js → ver17.js → ver18-town.js → v22.js → v24-text.js → zukan/zukan.js → v31/quests.js |
| `boardMenu` | items.js → ver17.js → v21.js → v31/board.js → rs/core.js → ui/board.js |
| `charHTML` | ver17.js → v20-ui.js → v22.js → v31/core.js → v31/board.js → rs/ui.js |
| `doAction` | engine.js → ch8.js → v20-battle.js → v20-ui.js → v22.js → battle/flow.js |
| `enterField` | field.js → ch8.js → ver17.js → ver18-field.js → v23.js → v31/quests.js |
| `fit` | core.js → v20-ui.js → v21.js → v22.js → v23.js → v25.js |
| `keyOf` | sprite/legacy/dot-rig.js → ver19.js → v21-items.js → v31/items.js → battle/seq.js → rs/core.js |
| `panel` | town.js → ver18-town.js → v20-ui.js → v22.js → battle/viewer.js → v38/help.js |
| `rewards` | engine.js → ch8.js → ch9.js → v20-ui.js → v31/core.js → v31/quests.js |
| `autoPick` | engine.js → ch8.js → ver17.js → v20-battle.js → rs/battle.js |
| `close` | ver17.js → battle/viewer.js → battle/flow.js → v38/help.js → ui/equip-info.js |
| `enemy` | engine.js → v31/enemies.js → v32.js → battle/size.js → v38/core.js |
| `enemyTurn` | engine.js → v20-battle.js → v20-ui.js → v25.js → battle/viewer.js |
| `face` | ui-assets.js → ver18-art.js → sprite/legacy/dot-rig.js → ver19-art.js → sprite/spx.js |
| `frameOf` | sprite/legacy/px.js → sprite/legacy/px-enemy.js → ver19-art.js → sprite/spx.js → zukan/viewer.js |
| `heroTurn` | engine.js → v20-battle.js → v22.js → v25.js → battle/viewer.js |
| `worldMap` | town.js → ver17.js → ver18-town.js → v22.js → v31/quests.js |
| `add` | motion/fx19.js → data/terms.js → motion/registry.js → battle/core.js |
| `addLoot` | items.js → ch9.js → ver17.js → v20-ui.js |
| `art` | ver17.js → ver18-art.js → ver19-art.js → sprite/spx.js |
| `bbar` | ver17.js → v22.js → v25.js → rs/ui.js |
| `end` | engine.js → v20-ui.js → v31/quests.js → rs/battle.js |
| `enterTown` | town.js → ch8.js → ver18-town.js → v22.js |
| `equipMenu` | town.js → ver17.js → v22.js → rs/ui.js |
| `exprFace` | ch9.js → ver18-art.js → ver19-art.js → sprite/spx.js |
| `fin` | ch7.js → ch9.js → ver17.js → rs/ui.js |
| `formation` | town.js → ver17.js → v22.js → ui/party.js |
| `has` | v24.js → sprite/facing.js → battle/rig.js → battle/viewer.js |
| `hurt` | engine.js → ver19.js → v20-battle.js → rs/battle.js |
| `kBoss` | ch8.js → ver19-pre.js → sprite/spx.js → v31/enemies.js |
| `mix` | sprite/legacy/dot.js → v22.js → v24-text.js → battle/core.js |
| `openSheet` | ch3.js → ver17.js → v22.js → rs/ui.js |
| `partyScreen` | ver17.js → v21.js → v22.js → ui/party.js |
| `put` | ver16.js → ver18-field.js → v31/quests.js → items/icons36.js |
| `skillList` | items.js → v20-battle.js → v31/board.js → rs/core.js |
| `stats` | engine.js → v31/core.js → v31/items.js → rs/core.js |
| `voidKind` | ch8.js → ver19-pre.js → ver18-art.js → sprite/spx.js |
| `arm` | sprite/legacy/px.js → sprite/legacy/dot-rig.js → v24.js |
| `board` | town.js → ver18-town.js → v22.js |
| `bonus` | items.js → ch9.js → v31/board.js |
| `build` | motion/skeleton.js → items/icons36.js → v38/help.js |
| `burst` | motion/fx19.js → v24-text.js → battle/core.js |
| `cap` | sprite/legacy/dot-rig.js → battle/seq.js → battle/viewer.js |
| `card` | ver17.js → v22.js → ui/party.js |
| `chooseRoot` | engine.js → ch8.js → rs/ui.js |
| `drawBoard` | items.js → ver17.js → v31/board.js |
| `drawUnit` | engine.js → ver16.js → ver17.js |
| `frame` | sprite/legacy/dot-rig.js → ver19-art.js → v21.js |
| `hex` | v24-text.js → sprite/spx.js → items/icons36.js |
| `hit` | engine.js → v20-battle.js → rs/battle.js |
| `itemIcon` | ch3.js → v21-art.js → v31/items.js |
| `kill` | engine.js → battle/core.js → rs/battle.js |
| `leg` | sprite/legacy/px.js → sprite/legacy/px-enemy.js → sprite/legacy/dot-rig.js |
| `loop` | ch4.js → v21-art.js → zukan/viewer.js |
| `makeTown` | field.js → town.js → ver18-town.js |
| `menu` | engine.js → ver18-town.js → v22.js |
| `open` | battle/viewer.js → v38/help.js → ui/equip-info.js |
| `openBoard` | items.js → v21.js → v31/board.js |
| `pick` | ver17.js → v31/items.js → battle/seq.js |
| `play` | motion/registry.js → battle/seq.js → battle/viewer.js |
| `pop` | engine.js → ch5.js → ver19.js |
| `portrait` | ver18-art.js → ver19-art.js → sprite/spx.js |
| `ramp` | sprite/legacy/dot.js → sprite/legacy/px.js → battle/core.js |
| `render` | v21-items.js → v31/quests.js → items/icons36.js |
| `roomOpen` | ver18-town.js → v22.js → v23.js |
| `score` | items.js → v20-battle.js → rs/battle.js |
| `smith` | town.js → ver18-town.js → v31/items.js |
| `spawnOne` | field.js → ch8.js → ver18-field.js |
| `tavern` | town.js → ch9.js → ver18-town.js |
| `tierOf` | v21-items.js → v24.js → v31/items.js |
| `tint` | sprite/legacy/dot.js → v24-text.js → battle/core.js |
| `ATK` | engine.js → v38/core.js |
| `BCH` | items.js → v21.js |
| `INF` | v31/core.js → rs/core.js |
| `afterBattle` | field.js → ch8.js |
| `appW` | v22.js → v23.js |
| `appraise` | town.js → ver18-town.js |
| `banner` | field.js → rs/battle.js |
| `base` | motion/anim.js → sprite/facing.js |
| `bbox` | engine.js → v21-items.js |
| `blade` | sprite/legacy/dot-rig.js → items/icons36.js |
| `boardTap` | items.js → v31/board.js |
| `bounds` | v21-items.js → v24.js |
| `box` | v23.js → items/icons36.js |
| `bpos` | items.js → v21.js |
| `breathLine` | motion/skeleton.js → sprite/spx.js |
| `canAw` | v25.js → rs/ui.js |
| `cfgOpen` | ver17.js → v38/menu.js |
| `chain` | sprite/legacy/dot-rig.js → v21-art.js |
| `chip` | data/terms.js → v31/quests.js |
| `chips` | town.js → rs/ui.js |
| `circle` | motion/fx19.js → battle/prim.js |
| `claw` | motion/fx19.js → v21-art.js |
| `clear` | motion/fx19.js → battle/core.js |
| `comboAdd` | ch5.js → v24.js |
| `cut` | sprite/spx.js → battle/prim.js |
| `def` | v21-items.js → battle/seq.js |
| `devAreas` | dev.js → v31/quests.js |
| `devGear` | dev.js → v31/items.js |
| `dir` | sprite/legacy/dot-rig.js → battle/core.js |
| `dot` | ver18-field.js → motion/fx19.js |
| `drawField` | field.js → ver18-field.js |
| `drawHome` | ver18-town.js → v22.js |
| `drawTitle` | ui-assets.js → ver18-town.js |
| `drawTown` | field.js → ver18-town.js |
| `drawWM` | ver17.js → ver18-town.js |
| `elOf` | ver17.js → v38/core.js |
| `enterKairou` | ch8.js → v31/quests.js |
| `enterTower` | ch6.js → v31/quests.js |
| `eqs` | ver17.js → v22.js |
| `exec` | battle/seq.js → battle/viewer.js |
| `fieldMenu` | field.js → ver18-field.js |
| `find` | v31/items.js → battle/seq.js |
| `finish` | ver19.js → items/icons36.js |
| `fitField` | ch3.js → v23.js |
| `fitNew` | v25.js → v38/battle-ui.js |
| `fixedItem` | items.js → v31/items.js |
| `flame` | sprite/legacy/px-enemy.js → battle/prim.js |
| `flask` | ver18-art.js → v21-art.js |
| `fuQ` | v20-battle.js → v31/board.js |
| `gainXP` | engine.js → v31/core.js |
| `gather` | motion/fx19.js → battle/prim.js |
| `genItem` | items.js → v31/items.js |
| `healAll` | field.js → v38/core.js |
| `heroK` | v25.js → v38/battle-ui.js |
| `hiImg` | ver16.js → ver19.js |
| `hsl2rgb` | sprite/legacy/dot.js → v31/enemies.js |
| `hueTo` | sprite/legacy/dot.js → sprite/legacy/px.js |
| `icard` | town.js → v20-battle.js |
| `iicon` | ch3.js → ver18-art.js |
| `info` | sprite/legacy/dot-rig.js → rs/ui.js |
| `invMenu` | town.js → ver17.js |
| `isBuff` | v20-battle.js → v24.js |
| `key` | ver18-field.js → sprite/facing.js |
| `known` | v31/quests.js → rs/battle.js |
| `list` | motion/registry.js → zukan/zukan.js |
| `lit` | sprite/legacy/px-enemy.js → motion/fx19.js |
| `makeBg` | engine.js → v22.js |
| `makeKairouArea` | ch8.js → ver18-field.js |
| `makeTowerArea` | ch6.js → ver18-field.js |
| `mark` | zukan/zukan.js → rs/ui.js |
| `newMember` | ch1.js → v31/items.js |
| `next` | ch9.js → ver17.js |
| `nextStage` | ch7.js → ver18-battle.js |
| `one` | v24.js → items/icons36.js |
| `openChest` | field.js → v31/quests.js |
| `opening` | v25.js → rs/battle.js |
| `parse` | ver19-art.js → sprite/spx.js |
| `part` | sprite/legacy/px.js → motion/fx19.js |
| `pauseMenu` | field.js → ver17.js |
| `pickHero` | engine.js → rs/battle.js |
| `pillar` | motion/fx19.js → battle/prim.js |
| `place` | v24.js → battle/flow.js |
| `power` | ver17.js → v31/board.js |
| `pre` | ver19.js → battle/seq.js |
| `preview` | engine.js → rs/battle.js |
| `proj` | motion/fx19.js → battle/prim.js |
| `repOK` | ver17.js → rs/battle.js |
| `res` | engine.js → rs/ui.js |
| `rgb2hsl` | sprite/legacy/dot.js → v31/enemies.js |
| `ring` | motion/fx19.js → v21-art.js |
| `rows` | motion/skeleton.js → rs/ui.js |
| `royalItem` | ch5.js → v31/items.js |
| `royalRand` | ch5.js → v31/items.js |
| `run` | engine.js → battle/prim.js |
| `saveMenu` | town.js → ver17.js |
| `set` | sprite/facing.js → battle/core.js |
| `shade` | items.js → items/icons36.js |
| `shadow` | v21-items.js → items/icons36.js |
| `shop` | town.js → ver18-town.js |
| `skCard` | v22.js → rs/ui.js |
| `skillsHTML` | v22.js → rs/ui.js |
| `sleep` | v23.js → rs/battle.js |
| `slot` | ver17.js → v38/help.js |
| `slotTxt` | ver17.js → ui/party.js |
| `sparks` | v21-items.js → battle/prim.js |
| `stTags` | ch5.js → v20-battle.js |
| `stage` | v24.js → v25.js |
| `start` | zukan/viewer.js → battle/viewer.js |
| `stat` | battle/viewer.js → v38/help.js |
| `step` | ch7.js → v20-ui.js |
| `still` | ver19.js → v31/enemies.js |
| `stop` | motion/anim.js → zukan/viewer.js |
| `strike` | ver19.js → battle/seq.js |
| `svg` | v20-ui.js → ui/skill-icons.js |
| `talk` | ch9.js → ver17.js |
| `tick` | motion/anim.js → v25.js |
| `trialEnemy` | awaken.js → ver19-pre.js |
| `uqItem` | ch9.js → v31/items.js |
| `wbase` | items.js → ch8.js |
| `whiteOf` | sprite/legacy/dot.js → ver16.js |
| `wpOf` | v20-battle.js → rs/ui.js |
| `zimg` | ch9.js → v31/enemies.js |
| `zkEnemy` | ch9.js → zukan/zukan.js |
| `zkHero` | ch9.js → zukan/zukan.js |
