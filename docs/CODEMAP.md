# コード地図（自動生成：`python3 tools/codemap.py`。手で編集しない）

読み込み順（index.html）と、各ファイルの役割（先頭のコメント）。**後のファイルほど優先**。

| # | ファイル | KB | 役割 | 公開名 |
|---|---|---|---|---|
| 1 | `js/core.js` | 1 |  |  |
| 2 | `js/art.js` | 2 | ドット絵（1文字＝1ドット） |  |
| 3 | `js/sprite/legacy/dot.js` | 10 | ver0.19 ピクセルアート・レンダラ（dot.js） | PX |
| 4 | `js/engine.js` | 41 | 背景（ディザリング生成） |  |
| 5 | `js/items.js` | 12 | 装備（ハクスラ） | BSTAR |
| 6 | `js/ch1.js` | 7 | 第1章データ |  |
| 7 | `js/ch2.js` | 7 | 第2章データ |  |
| 8 | `js/ui-assets.js` | 3 | UI素材 |  |
| 9 | `js/ch3.js` | 16 | アイテムアイコン |  |
| 10 | `js/ch4.js` | 6 | 第4章データ |  |
| 11 | `js/ch5.js` | 8 | 戦闘表示（ver0.10） |  |
| 12 | `js/awaken.js` | 5 | ver0.11 星臨の深化 |  |
| 13 | `js/ch6.js` | 4 | ver0.12 レジェンド・天への塔（ジョブは ver0.38 で廃止） |  |
| 14 | `js/field.js` | 5 | セーブ |  |
| 15 | `js/town.js` | 10 | 灯都ルミナス | ISLE |
| 16 | `js/ch7.js` | 8 | ver0.13 終章「星核の残響」 |  |
| 17 | `js/ch8.js` | 20 | ver0.14 クリア後：虚の回廊・竜の巣・セレス・ヴァルク・虚蝕化エリア |  |
| 18 | `js/ch9.js` | 34 | ver0.15 絆と会話：絆イベント・会話ウィンドウ（表情5種）・専用ユニーク装備・図鑑 |  |
| 19 | `js/ver16.js` | 16 | ver0.16 音と絵：エリア別BGM・星臨BGM切替・戦闘キャラ48×48ドット・（部位破壊は ver0.25 で削除） |  |
| 20 | `js/ver17.js` | 42 | ver0.17 快適さ＋UI再構築 |  |
| 21 | `js/ver19-pre.js` | 0 | ver0.19（前処理） |  |
| 22 | `js/sprite/legacy/px.js` | 22 | ver0.18 ドット絵エンジン |  |
| 23 | `js/sprite/legacy/px-hero.js` | 12 | ver0.18 仲間12人のドット絵（頭・胴は手描き、腕・脚・武器は姿勢から描く） |  |
| 24 | `js/sprite/legacy/px-enemy.js` | 40 | ver0.18 敵・ボスのドット絵（右向き）。種族ごとに専用の体つき・動き・攻撃モーションを持つ |  |
| 25 | `js/ver18-battle.js` | 3 | ver0.18 戦闘（ver0.32 で整理） |  |
| 26 | `js/ver18-maps.js` | 7 | ver0.18 探索マップの再設計 |  |
| 27 | `js/ver18-field.js` | 1 | ver0.18 探索の名残：マップの差し替え・宝箱の移し替え・塔と回廊の番人の広間（探索の描画・敵の配置・ミニマップは探索マップの廃止で削除） |  |
| 28 | `js/ver18-art.js` | 15 | ver0.18 顔グラ・立ち絵・図鑑の絵・アイコン（16×16）・街の人 |  |
| 29 | `js/ver18-town.js` | 30 | ver0.18 拠点：ホーム画面（灯都ルミナスの街並み）・酒場・依頼掲示板・道具屋・各施設の店内 |  |
| 30 | `js/sprite/legacy/dot-rig.js` | 9 | ver0.19 キャラクター・リグ（人型） | HUM SPRX |
| 31 | `js/sprite/legacy/dot-heroes.js` | 26 | ver0.19 味方キャラクターのドット絵定義 |  |
| 32 | `js/sprite/legacy/dot-mon.js` | 21 | ver0.19 敵キャラクターのドット絵定義 |  |
| 33 | `js/motion/anim.js` | 14 | ver0.19 アニメーション管理 | ANIM |
| 34 | `js/motion/fx19.js` | 11 | ver0.19 戦闘エフェクト | FX19 |
| 35 | `js/ver19.js` | 31 | ver0.19 ドット絵・待機モーション・戦闘演出の全面強化（戦闘への統合） | V19 |
| 36 | `js/ver19-art.js` | 6 | ver0.19 絵柄の統一：顔グラ・立ち絵・会話の表情・探索／街／ワールドマップの歩き姿 | V19A |
| 37 | `js/v20-battle.js` | 33 | ver0.20 戦闘の深化：状態効果・専用パッシブ・新スキル／魔法・敵の新戦術 | V20 |
| 38 | `js/v20-ui.js` | 23 | ver0.20 UI の全面改善 | V20UI |
| 39 | `js/v21-items.js` | 6 | ver0.21 装備・アイテムのドット絵（24×24）を全面刷新 | IC21 |
| 40 | `js/v21-art.js` | 53 | ver0.21 装備・アイテムのデザイン定義 |  |
| 41 | `js/v21.js` | 13 | ver0.21 表示の改善 | V21 |
| 42 | `js/v22.js` | 45 | ver0.22 画面の全面改良・「星臨」・ミッション一括受け取り・開発者モード拡張 | V22 |
| 43 | `js/v23.js` | 21 | ver0.23 戦闘画面・ダメージ演出・ホーム・図鑑・画面倍率・探索・星臨演出の改良 | V23 |
| 44 | `js/v24-text.js` | 12 | ver0.24 演出文字レンダラー（TX24） | TX24 |
| 45 | `js/v24.js` | 28 | ver0.24 戦闘演出の品質向上（大規模ドット絵アップデートの下準備） | V24 RM |
| 46 | `js/v25.js` | 25 | ver0.25 戦闘画面の全面リデザイン | V25 |
| 47 | `js/data/terms.js` | 9 | ver0.29 呼称・分類の共通規格（TERMS） | TERMS |
| 48 | `js/motion/registry.js` | 4 | ver0.29 モーション台帳（MOTION） | MOTION |
| 49 | `js/sprite/facing.js` | 4 | ver0.29 キャラクターの向き（FACING）：向きを決める唯一の窓口 | FACING |
| 50 | `js/data/skeleton-overrides.js` | 1 | ver0.29 骨格の手動修正（SKEL_OVR） |  |
| 51 | `js/motion/skeleton.js` | 9 | ver0.29 骨格・関節・可動域（SKEL） | SKEL |
| 52 | `js/sprite/data/spx-data.js` | 95 | 自動生成：旧 tools/build_spx.py の出力を tools/spx_normalize.py が整えたもの（提供原画 → パレット番号 PNG）。手で編集しない |  |
| 53 | `js/sprite/data/spx-data-enemy.js` | 1005 | （データ。読まない） |  |
| 54 | `js/sprite/data/spx-data-heroes.js` | 1000 | （データ。読まない） |  |
| 55 | `js/sprite/data/spx-data-chars.js` | 800 | （データ。読まない） |  |
| 56 | `js/sprite/spx.js` | 31 | ドット絵刷新：提供原画から作ったスプライト（SPX）を、既存の描画の入口で差し替える | SPX |
| 57 | `js/zukan/viewer.js` | 11 | ver0.30 図鑑のキャラクタービューア（ZVIEW） | ZVIEW |
| 58 | `js/zukan/zukan.js` | 13 | 図鑑（一覧・詳細） ver0.30 | ZUKAN |
| 59 | `js/v29.js` | 3 | ver0.29 呼称・ドット絵・モーション管理・図鑑の全面整理 | V29 |
| 60 | `js/v30.js` | 5 | ver0.30 図鑑の基準画像・星臨の縮尺統一・素材制作パイプライン | V30 |
| 61 | `js/v31/core.js` | 8 | ver0.31 共通：能力のインフレ・レベル上限120・限界突破・新しい能力値 | V31 |
| 62 | `js/v31/items.js` | 18 | ver0.31 装備：枠の再編・各レアリティの新装備・新レジェンド | V31I |
| 63 | `js/data/resist.js` | 4 | 属性耐性（ELR：防具の耐性値・キャラの合計・被ダメージの倍率の正本。新規） | ELR |
| 64 | `js/v31/board.js` | 20 | ver0.31 天星盤（星盤の上位版）・極技・新しいパッシブ | V31B |
| 65 | `js/v31/enemies.js` | 13 | ver0.31 敵：インフレに合わせた強さの曲線・各章の中ボス・エンドコンテンツの敵 | V31E |
| 66 | `js/v31/quest-data.js` | 24 | ver0.31 クエストのデータ（章・クエスト・会話） | QD |
| 67 | `js/v32.js` | 3 | ver0.32 図鑑の絞り込み・敵の大きさ・向き・クエスト情報 | V32 |
| 68 | `js/v33.js` | 2 | ver0.33 不具合の修正・戦闘の仕組みの整理・狼と狐の原画 | V33 |
| 69 | `js/items/icons36.js` | 31 | ver0.36 武器・防具・装飾品のアイコンを作り直す（IC36） | IC36 |
| 70 | `js/battle/size.js` | 2 | 戦闘の表示サイズ：敵の大きさを種類ごとにそろえる（ver0.40。正本） | BSIZE |
| 71 | `js/battle/core.js` | 13 | ver0.34 戦闘演出の基盤（BX） | BX |
| 72 | `js/battle/prim.js` | 17 | ver0.34 戦闘エフェクトの部品（BXP） | BXP |
| 73 | `js/battle/rig.js` | 6 | ver0.35 1 枚絵を曲げて動かす（BXR） | BXR |
| 74 | `js/battle/seq.js` | 8 | ver0.34 技の演出の台帳と再生（BXS） | BXS |
| 75 | `js/battle/data/fx-heroes-rio.js` | 7 | 技の演出：リオ（灯守見習い・片手剣・光） |  |
| 76 | `js/battle/data/fx-heroes-gald.js` | 4 | 技の演出：ガルド（元騎士団長・大剣と盾・地） |  |
| 77 | `js/battle/data/fx-heroes-mire.js` | 6 | 技の演出：ミレイユ（魔導書・炎と氷） |  |
| 78 | `js/battle/data/motion-heroes.js` | 13 | ver0.35 味方のモーション（12 人） | BXM |
| 79 | `js/battle/viewer.js` | 10 | ver0.34 演出の設定・星臨演出の長さ・演出ビューア | BXV |
| 80 | `js/battle/version.js` | 2 | 戦闘演出の全面刷新（ver0.34〜）：版表示・お知らせ | V34 |
| 81 | `js/battle/data/start-brush.js` | 24 | 「戦闘開始」の筆文字（衡山毛筆フォントで書いた文字を絵にしたもの。js/battle/flow.js brushBanner が金の墨で塗る） |  |
| 82 | `js/battle/flow.js` | 9 | 戦闘の行動演出：ロマサガRS の流れ（ver0.42。正本） | BFLOW BIMG |
| 83 | `js/rs/data.js` | 24 | ver0.37 戦闘システム刷新（データ） | RSD |
| 84 | `js/rs/abilities.js` | 11 | アビリティ（AB・ABL の正本。ver0.45：3 段階＋段階Ⅲの固有名の特殊効果） |  |
| 85 | `js/rs/core.js` | 21 | 戦闘システム（能力値・習得・技セット・アビリティ・陣形・セーブ） | RSC |
| 86 | `js/data/equip7.js` | 4 | 装備の能力影響（EQ7：装備が上げるのは基礎ステータスだけ。ver0.45 新規の正本） | EQ7 |
| 87 | `js/rs/mastery.js` | 17 | 技・術の練達（RSM。ver0.47 新規の正本。旧「技Lv（熟練）」を置き換え） | RSM |
| 88 | `js/rs/battle.js` | 35 | 戦闘の進行（ターン制・BP・HP/LP） | RSB |
| 89 | `js/rs/ui.js` | 23 | 戦闘システムの画面 | RSU |
| 90 | `js/v38/core.js` | 4 | ver0.38 土台：攻撃属性 8 種・武器種 8 種・セーブの移行・LP | V38 |
| 91 | `js/v38/battle-ui.js` | 8 | ver0.38 戦闘画面 | V38B |
| 92 | `js/v38/menu.js` | 22 | ver0.38 画面全体の整理 | V38M |
| 93 | `js/ui/skill-icons.js` | 5 | 技・術のアイコン（SKICON：白いシルエットの絵柄 27 種＋技 → 絵柄の対応。js/rs/ui.js の skIcon が使う） |  |
| 94 | `js/ui/board.js` | 5 | 星盤・天星盤の画面（ver0.39 で 1 ファイルにまとめた。画面の正本はここ） | BOARDUI |
| 95 | `js/ui/equip-info.js` | 4 | 装備品の詳細（EQINFO：装備アイコンのタップで出るポップアップの正本。新規） | EQINFO |
| 96 | `js/ui/party.js` | 0 | 旧画面の入口 → 仲間画面（UNIT）へ（ver0.53。旧「編成画面と陣形」の正本はコマンド戦闘と一緒に削除した） |  |
| 97 | `js/ui/inv.js` | 8 | 持ち物・鑑定の画面の正本（ver0.54。共通の全画面の枠 FAC も、鍛冶屋 js/ui/smith.js がここを使う） | FAC INV APR |
| 98 | `js/ui/smith.js` | 7 | 鍛冶屋の画面（ver0.54。正本：town.js の smith・enhance・opSwap・sockMenu と v31/items.js・ver18-town.js の包み | SMITH44 |
| 99 | `js/ui/damage.js` | 3 | 戦闘のダメージ表示の書体（TX24 の書式の最終定義。ロマサガRS の録画に合わせた） |  |
| 100 | `js/ui/keywords.js` | 8 | 用語のハイライト（KW：効果の説明文の用語を緑で示し、タップで詳しい説明を出す正本。ver0.45 新規） | KW |
| 101 | `js/ui/battle-pop.js` | 11 | 戦闘中の表示（見出し・状態・数字）の正本（BPOP。ver0.46 新規。決まりは docs/BATTLE-FLOW.md） | BPOP |
| 102 | `js/ui/growth.js` | 5 | 強化メニュー（経験値のストックとレベルアップ・旧「酒場」を統合した正本。ver0.48 新規） | GROW |
| 103 | `js/td/data.js` | 15 | 仲間・敵・報酬のデータ（TDD。ver0.60 からコマンド戦闘の補助。ステージは js/td/stages.js） | TDD |
| 104 | `js/td/stages.js` | 9 | 章とステージ（TDD.STAGE・TDD.CH・TDD.ORDER の正本）。ver0.60 からコマンド戦闘のステージ（マップなし） |  |
| 105 | `js/td/bg.js` | 26 | 戦闘と章の地図の背景（TDBG）：章ごとの空・遠景・中景・地面。コマンド戦闘（js/cb/view.js）が被写界深度をかけて重ねる | TDBG |
| 106 | `js/td/sfx.js` | 9 | TD の音（TDSFX）：WebAudio で合成する効果音と、章ごとの短い BGM。音源ファイルなし | TDSFX |
| 107 | `js/td/fxkit.js` | 8 | TD の演出の共通部品（FXK）：光のスプライト・ドットの格子にそろえた形・粒のプール・緩急・命中の手応え | FXK |
| 108 | `js/td/fx-celes.js` | 12 | TD：セレスの演出（FXC）。通常攻撃（彗星の光弾）と技 3 種（遅延の砂＝時計の陣・刻の矢＝時計の針の矢 3 連・クロノスロウ＝時計の波）。部品は FXK（fxkit.js） | FXC |
| 109 | `js/td/fx-celes-ult.js` | 15 | TD：セレスの星臨に入る演出と奥義「刻の巻き戻し」（FXU）。部品は FXK（fxkit.js）。fx.js の celesAw/celesUlt・cultB/cultF を置き換 | FXU |
| 110 | `js/td/fx.js` | 21 | TD の戦闘の演出（TDFX）：技ごとのエフェクト・星臨の短い暗転・粒・敵の歩き/被弾/崩れ。描くだけで、ロジック（TDS）の結果に触れない | TDFX |
| 111 | `js/td/skicon.js` | 4 | 戦闘の技ボタンの絵（TDI）：SKICON の白いシルエットから、技ごとのドット絵のアイコンを作る（ver0.58） | TDI |
| 112 | `js/td/uanim.js` | 6 | TD：味方の状態ごとのコマ送り（TDA。素材パック assets_src/chars の anims を引く） | TDA |
| 113 | `js/td/menu.js` | 14 | TD の章の地図・出撃準備・会話・仲間の加入（TDM）。戦闘画面は js/td/view.js（TD） | TDM |
| 114 | `js/battle/stage.js` | 5 | 章のステージを ver0.49 のロマサガRS風の戦闘で戦う（STG。ver0.63 でコマンド戦闘 js/cb/* を置き換えた正本） | STG |
| 115 | `js/battle/celes.js` | 4 | 旧戦闘（ver0.49 のロマサガRS風）でセレスだけを今のコマ送りと演出で描く橋（CEL。ver0.63） | CEL |
| 116 | `js/ui/home.js` | 4 | ホーム画面（灯都ルミナス）の正本：「出撃」（コマンド戦闘のステージ）を主役にした重ね表示 | HOME |
| 117 | `js/ui/unit.js` | 12 | 仲間の画面（UNIT）：一覧＋1 人の詳細（ver0.60 からコマンド戦闘の能力）。Lv・技 5 つ・奥義・アビリティ 3 つ・装備・星盤をここにまとめる | UNIT |
| 118 | `js/ui/zukan.js` | 3 | 図鑑の一覧（ZKUI）：敵・仲間・装備の全画面の一覧。ver0.54 新規 | ZKUI |
| 119 | `js/ui/dev.js` | 4 | 開発者モードの正本（タイトルの「開発者モード」・ホームの ≡ の DEV） | DEVUI |

## 上書きの連鎖（2 ファイル以上で定義・上書きされる関数）

最後の行のファイルが今の動きの正本。直すときはまずそこを見る。個別の行番号は `python3 tools/codemap.py 関数名`。

| 関数 | 定義 → 上書き（読み込み順） |
|---|---|
| `draw` | engine.js → ver16.js → ver17.js → sprite/legacy/dot-rig.js → motion/fx19.js → ver19.js → v21.js → v22.js → v23.js → v25.js → sprite/spx.js → zukan/viewer.js → battle/core.js → battle/flow.js → rs/ui.js → v38/battle-ui.js → ui/inv.js → ui/battle-pop.js → ui/growth.js → td/fxkit.js → td/fx.js → battle/celes.js → ui/unit.js → ui/zukan.js → ui/dev.js |
| `startBattle` | engine.js → ch8.js → ver18-battle.js → ver19.js → v20-battle.js → v21.js → v22.js → v23.js → v24.js → v25.js → battle/seq.js → battle/flow.js → rs/battle.js → v38/core.js → v38/battle-ui.js → ui/battle-pop.js → battle/celes.js |
| `title` | town.js → ver16.js → ver17.js → ver18-town.js → ver19.js → v20-ui.js → v21.js → v22.js → v23.js → v24.js → v25.js → v30.js → v31/core.js → v32.js → v33.js → battle/version.js → v38/menu.js |
| `show` | core.js → ver17.js → ver18-town.js → v20-ui.js → v22.js → v23.js → v24.js → v25.js → battle/flow.js → v38/battle-ui.js → ui/inv.js → ui/keywords.js → ui/battle-pop.js → td/menu.js |
| `dvMenu` | core.js → ch9.js → ver16.js → ver17.js → ver18-town.js → v20-ui.js → v21.js → v23.js → v24.js → v25.js → v29.js → v30.js → battle/viewer.js |
| `migrate` | items.js → ch8.js → ch9.js → ver17.js → ver18-field.js → v31/items.js → data/resist.js → v31/quest-data.js → v32.js → rs/core.js → data/equip7.js → v38/core.js |
| `townMenu` | town.js → ch9.js → ver18-town.js → v20-ui.js → v21.js → v22.js → v23.js → v38/menu.js → ui/inv.js → td/menu.js → ui/home.js |
| `close` | ver17.js → battle/viewer.js → battle/flow.js → ui/equip-info.js → ui/keywords.js → ui/growth.js → td/menu.js → ui/unit.js → ui/zukan.js → ui/dev.js |
| `awaken` | engine.js → ch8.js → v22.js → v23.js → v25.js → battle/viewer.js → rs/battle.js → battle/celes.js |
| `build` | motion/skeleton.js → items/icons36.js → ui/growth.js → td/skicon.js → td/menu.js → ui/home.js → ui/unit.js → ui/zukan.js |
| `calc` | engine.js → ch8.js → ch9.js → ver19.js → v20-battle.js → data/terms.js → v31/core.js → rs/battle.js |
| `hero` | engine.js → ver18-battle.js → v20-battle.js → v31/items.js → v31/board.js → battle/viewer.js → rs/core.js → td/data.js |
| `doAction` | engine.js → ch8.js → v20-battle.js → v20-ui.js → v22.js → battle/flow.js → battle/celes.js |
| `open` | battle/viewer.js → ui/equip-info.js → ui/growth.js → td/menu.js → ui/unit.js → ui/zukan.js → ui/dev.js |
| `refresh` | engine.js → ch5.js → ver17.js → v20-ui.js → v22.js → v24.js → v25.js |
| `rewards` | engine.js → ch8.js → ch9.js → v20-ui.js → v31/core.js → rs/mastery.js → ui/growth.js |
| `add` | motion/fx19.js → data/terms.js → motion/registry.js → battle/core.js → ui/growth.js → td/fx.js |
| `boardMenu` | items.js → ver17.js → v21.js → v31/board.js → rs/core.js → ui/board.js |
| `charHTML` | ver17.js → v20-ui.js → v22.js → v31/core.js → v31/board.js → rs/ui.js |
| `face` | ui-assets.js → ver18-art.js → sprite/legacy/dot-rig.js → ver19-art.js → sprite/spx.js → td/uanim.js |
| `keyOf` | sprite/legacy/dot-rig.js → ver19.js → v21-items.js → v31/items.js → battle/seq.js → rs/core.js |
| `mix` | sprite/legacy/dot.js → v22.js → v24-text.js → battle/core.js → td/bg.js → td/skicon.js |
| `onClick` | battle/viewer.js → ui/growth.js → td/menu.js → ui/unit.js → ui/zukan.js → ui/dev.js |
| `panel` | town.js → ver18-town.js → v20-ui.js → v22.js → battle/viewer.js → ui/battle-pop.js |
| `row` | ver17.js → v22.js → v24-text.js → zukan/zukan.js → data/resist.js → ui/unit.js |
| `stats` | engine.js → v31/core.js → v31/items.js → rs/core.js → data/equip7.js → ui/unit.js |
| `step` | ch7.js → v20-ui.js → v24.js → td/fxkit.js → td/fx.js → td/menu.js |
| `autoPick` | engine.js → ch8.js → ver17.js → v20-battle.js → rs/battle.js |
| `cap` | sprite/legacy/dot-rig.js → battle/seq.js → battle/viewer.js → ui/inv.js → ui/growth.js |
| `enemy` | engine.js → v31/enemies.js → v32.js → battle/size.js → v38/core.js |
| `enemyTurn` | engine.js → v20-battle.js → v20-ui.js → v25.js → battle/viewer.js |
| `fit` | core.js → v20-ui.js → v21.js → v22.js → v23.js |
| `frameOf` | sprite/legacy/px.js → sprite/legacy/px-enemy.js → ver19-art.js → sprite/spx.js → zukan/viewer.js |
| `has` | v24.js → sprite/facing.js → battle/rig.js → battle/viewer.js → td/uanim.js |
| `heroTurn` | engine.js → v20-battle.js → v22.js → v25.js → battle/viewer.js |
| `hit` | engine.js → v20-battle.js → rs/battle.js → td/fxkit.js → battle/celes.js |
| `openSheet` | ch3.js → ver17.js → v22.js → rs/ui.js → ui/party.js |
| `pick` | ver17.js → v31/items.js → battle/seq.js → td/uanim.js → battle/stage.js |
| `addLoot` | items.js → ch9.js → ver17.js → v20-ui.js |
| `art` | ver17.js → ver18-art.js → ver19-art.js → sprite/spx.js |
| `bbar` | ver17.js → v22.js → v25.js → rs/ui.js |
| `board` | town.js → ver18-town.js → v22.js → ui/party.js |
| `end` | engine.js → v20-ui.js → rs/battle.js → battle/stage.js |
| `exprFace` | ch9.js → ver18-art.js → ver19-art.js → sprite/spx.js |
| `fin` | ch7.js → ver17.js → rs/ui.js → td/menu.js |
| `frame` | sprite/legacy/dot-rig.js → ver19-art.js → v21.js → td/uanim.js |
| `genItem` | items.js → v31/items.js → data/resist.js → data/equip7.js |
| `hurt` | engine.js → ver19.js → v20-battle.js → rs/battle.js |
| `kBoss` | ch8.js → ver19-pre.js → sprite/spx.js → v31/enemies.js |
| `partyScreen` | ver17.js → v21.js → v22.js → ui/party.js |
| `play` | motion/registry.js → battle/seq.js → battle/viewer.js → td/sfx.js |
| `put` | ver16.js → items/icons36.js → rs/battle.js → td/uanim.js |
| `reset` | ui/battle-pop.js → td/fxkit.js → td/fx-celes-ult.js → td/fx.js |
| `ring` | motion/fx19.js → v21-art.js → td/sfx.js → td/fxkit.js |
| `run` | engine.js → battle/prim.js → td/menu.js → battle/stage.js |
| `skillList` | items.js → v20-battle.js → v31/board.js → rs/core.js |
| `sparks` | v21-items.js → battle/prim.js → td/fxkit.js → td/fx.js |
| `voidKind` | ch8.js → ver19-pre.js → ver18-art.js → sprite/spx.js |
| `worldMap` | town.js → ver17.js → ver18-town.js → v22.js |
| `arm` | sprite/legacy/px.js → sprite/legacy/dot-rig.js → v24.js |
| `base` | motion/anim.js → sprite/facing.js → td/bg.js |
| `bonus` | items.js → ch9.js → v31/board.js |
| `burst` | motion/fx19.js → v24-text.js → battle/core.js |
| `card` | ver17.js → v22.js → ui/unit.js |
| `chooseRoot` | engine.js → ch8.js → rs/ui.js |
| `clear` | motion/fx19.js → battle/core.js → ui/battle-pop.js |
| `cut` | sprite/spx.js → battle/prim.js → ui/battle-pop.js |
| `dot` | motion/fx19.js → td/fxkit.js → ui/home.js |
| `drawBoard` | items.js → ver17.js → v31/board.js |
| `drawUnit` | engine.js → ver16.js → ver17.js |
| `enterTown` | town.js → ch8.js → ver18-town.js |
| `equipMenu` | ver17.js → v22.js → rs/ui.js |
| `finish` | ver19.js → items/icons36.js → battle/stage.js |
| `formation` | town.js → ver17.js → v22.js |
| `gainXP` | engine.js → v31/core.js → ui/growth.js |
| `hash` | ver19.js → td/fx.js → td/skicon.js |
| `hex` | v24-text.js → sprite/spx.js → items/icons36.js |
| `itemIcon` | ch3.js → v21-art.js → v31/items.js |
| `key` | ver18-field.js → sprite/facing.js → ui/smith.js |
| `kill` | engine.js → battle/core.js → rs/battle.js |
| `leg` | sprite/legacy/px.js → sprite/legacy/px-enemy.js → sprite/legacy/dot-rig.js |
| `list` | motion/registry.js → zukan/zukan.js → ui/unit.js |
| `loop` | ch4.js → v21-art.js → zukan/viewer.js |
| `makeBg` | engine.js → v22.js → battle/stage.js |
| `makeTown` | field.js → town.js → ver18-town.js |
| `mark` | zukan/zukan.js → rs/ui.js → ui/keywords.js |
| `menu` | engine.js → ver18-town.js → v22.js |
| `nextStage` | ch7.js → ver18-battle.js → ui/home.js |
| `openBoard` | items.js → v21.js → v31/board.js |
| `part` | sprite/legacy/px.js → motion/fx19.js → td/fx.js |
| `pic` | ui/growth.js → td/menu.js → ui/unit.js |
| `place` | v24.js → battle/flow.js → ui/battle-pop.js |
| `pop` | engine.js → ch5.js → ver19.js |
| `portrait` | ver18-art.js → ver19-art.js → sprite/spx.js |
| `pre` | ver19.js → battle/seq.js → td/stages.js |
| `ramp` | sprite/legacy/dot.js → sprite/legacy/px.js → battle/core.js |
| `render` | v21-items.js → items/icons36.js → td/skicon.js |
| `res` | engine.js → rs/ui.js → ui/smith.js |
| `roomOpen` | ver18-town.js → v22.js → v23.js |
| `royalItem` | ch5.js → v31/items.js → data/resist.js |
| `score` | items.js → v20-battle.js → rs/battle.js |
| `smith` | town.js → v31/items.js → ui/smith.js |
| `stars` | rs/ui.js → td/fxkit.js → td/menu.js |
| `start` | zukan/viewer.js → battle/viewer.js → battle/celes.js |
| `talk` | ch9.js → ver17.js → td/menu.js |
| `tavern` | town.js → ch9.js → ver18-town.js |
| `tick` | motion/anim.js → v25.js → ui/battle-pop.js |
| `tierOf` | v21-items.js → v24.js → v31/items.js |
| `tint` | sprite/legacy/dot.js → v24-text.js → battle/core.js |
| `ATK` | engine.js → v38/core.js |
| `BCH` | items.js → v21.js |
| `INF` | v31/core.js → rs/core.js |
| `abPop` | rs/battle.js → ui/unit.js |
| `actEnd` | v24.js → ui/battle-pop.js |
| `after` | battle/seq.js → td/menu.js |
| `appW` | v22.js → v23.js |
| `appraise` | town.js → ui/inv.js |
| `back` | zukan/zukan.js → td/fx.js |
| `banner` | field.js → rs/battle.js |
| `bar` | engine.js → ui/inv.js |
| `bbox` | engine.js → v21-items.js |
| `blade` | sprite/legacy/dot-rig.js → items/icons36.js |
| `boardTap` | items.js → v31/board.js |
| `bondMenu` | ch9.js → ui/party.js |
| `bounds` | v21-items.js → v24.js |
| `box` | v23.js → items/icons36.js |
| `bpos` | items.js → v21.js |
| `breathLine` | motion/skeleton.js → sprite/spx.js |
| `canAw` | v25.js → rs/ui.js |
| `cfgOpen` | ver17.js → v38/menu.js |
| `chOf` | battle/rig.js → td/menu.js |
| `chain` | sprite/legacy/dot-rig.js → v21-art.js |
| `chips` | town.js → rs/ui.js |
| `circle` | motion/fx19.js → battle/prim.js |
| `claw` | motion/fx19.js → v21-art.js |
| `comboAdd` | ch5.js → v24.js |
| `costOf` | rs/core.js → rs/mastery.js |
| `crescent` | battle/prim.js → td/fxkit.js |
| `def` | v21-items.js → battle/seq.js |
| `detail` | zukan/zukan.js → ui/unit.js |
| `dim` | battle/core.js → td/fx.js |
| `dir` | sprite/legacy/dot-rig.js → battle/core.js |
| `disc` | battle/core.js → td/bg.js |
| `drawHome` | ver18-town.js → v22.js |
| `drawTitle` | ui-assets.js → ver18-town.js |
| `drawTown` | field.js → ver18-town.js |
| `drawWM` | ver17.js → ver18-town.js |
| `elOf` | ver17.js → v38/core.js |
| `ending` | ch7.js → td/menu.js |
| `enhance` | town.js → ui/smith.js |
| `ensure` | v21.js → ui/inv.js |
| `eqs` | ver17.js → v22.js |
| `exec` | battle/seq.js → battle/viewer.js |
| `find` | v31/items.js → battle/seq.js |
| `fitField` | ch3.js → v23.js |
| `fitNew` | v25.js → v38/battle-ui.js |
| `fixedItem` | items.js → v31/items.js |
| `flame` | sprite/legacy/px-enemy.js → battle/prim.js |
| `flask` | ver18-art.js → v21-art.js |
| `fuQ` | v20-battle.js → v31/board.js |
| `gather` | motion/fx19.js → battle/prim.js |
| `glow` | td/bg.js → td/fxkit.js |
| `hand` | sprite/legacy/px-enemy.js → td/fx-celes.js |
| `healAll` | field.js → v38/core.js |
| `heroK` | v25.js → v38/battle-ui.js |
| `hiImg` | ver16.js → ver19.js |
| `hide` | ui/inv.js → battle/stage.js |
| `hsl2rgb` | sprite/legacy/dot.js → v31/enemies.js |
| `html` | rs/mastery.js → ui/equip-info.js |
| `hueTo` | sprite/legacy/dot.js → sprite/legacy/px.js |
| `icard` | town.js → v20-battle.js |
| `icon` | ver19.js → td/sfx.js |
| `iicon` | ch3.js → ver18-art.js |
| `impact` | battle/seq.js → td/fx-celes.js |
| `info` | sprite/legacy/dot-rig.js → rs/ui.js |
| `invMenu` | town.js → ui/inv.js |
| `isBuff` | v20-battle.js → v24.js |
| `items` | rs/ui.js → ui/smith.js |
| `layer` | v24.js → ui/battle-pop.js |
| `line` | battle/core.js → td/bg.js |
| `lit` | sprite/legacy/px-enemy.js → motion/fx19.js |
| `look` | ver19-art.js → ui/keywords.js |
| `main` | ver17.js → ui/smith.js |
| `make` | v24.js → td/bg.js |
| `makeKairouArea` | ch8.js → ver18-field.js |
| `makeTowerArea` | ch6.js → ver18-field.js |
| `mem` | ver18-town.js → td/uanim.js |
| `mid` | ver19.js → td/bg.js |
| `need` | ui/smith.js → ui/growth.js |
| `newMember` | ch1.js → v31/items.js |
| `now` | v24.js → ui/battle-pop.js |
| `one` | v24.js → items/icons36.js |
| `opening` | v25.js → rs/battle.js |
| `parse` | ver19-art.js → sprite/spx.js |
| `pickHero` | engine.js → rs/battle.js |
| `pillar` | motion/fx19.js → battle/prim.js |
| `poly` | td/bg.js → td/fx-celes-ult.js |
| `power` | ver17.js → v31/board.js |
| `prep` | rs/battle.js → td/menu.js |
| `preview` | engine.js → rs/battle.js |
| `proj` | motion/fx19.js → battle/prim.js |
| `react` | battle/data/motion-heroes.js → td/fxkit.js |
| `reg` | sprite/legacy/dot-rig.js → ui/keywords.js |
| `repOK` | ver17.js → rs/battle.js |
| `rgb` | td/fxkit.js → td/skicon.js |
| `rgb2hsl` | sprite/legacy/dot.js → v31/enemies.js |
| `rise` | battle/prim.js → td/fx.js |
| `rows` | motion/skeleton.js → rs/ui.js |
| `royalRand` | ch5.js → v31/items.js |
| `saveMenu` | town.js → ver17.js |
| `set` | sprite/facing.js → battle/core.js |
| `shade` | items.js → items/icons36.js |
| `shadow` | v21-items.js → items/icons36.js |
| `shk` | td/fx-celes-ult.js → td/fx.js |
| `shop` | town.js → ver18-town.js |
| `skCard` | v22.js → rs/ui.js |
| `skName` | battle/viewer.js → td/data.js |
| `skillsHTML` | v22.js → rs/ui.js |
| `sleep` | v23.js → rs/battle.js |
| `spdK` | v24.js → ui/battle-pop.js |
| `src` | ui/inv.js → td/skicon.js |
| `stTags` | ch5.js → v20-battle.js |
| `stage` | v24.js → v25.js |
| `star4` | td/fxkit.js → td/fx.js |
| `stat` | battle/viewer.js → ui/unit.js |
| `still` | ver19.js → v31/enemies.js |
| `stock` | ui/smith.js → ui/growth.js |
| `stop` | motion/anim.js → zukan/viewer.js |
| `strike` | ver19.js → battle/seq.js |
| `sum` | data/resist.js → data/equip7.js |
| `svg` | v20-ui.js → ui/skill-icons.js |
| `toast` | v22.js → ui/smith.js |
| `toggle` | sprite/facing.js → td/sfx.js |
| `trialEnemy` | awaken.js → ver19-pre.js |
| `trialMenu` | awaken.js → ui/party.js |
| `ult` | td/fx-celes-ult.js → td/fx.js |
| `uqItem` | ch9.js → v31/items.js |
| `wave` | td/fx-celes.js → battle/stage.js |
| `wbase` | items.js → ch8.js |
| `whiteOf` | sprite/legacy/dot.js → ver16.js |
| `wpOf` | v20-battle.js → rs/ui.js |
| `zimg` | ch9.js → v31/enemies.js |
| `zkEnemy` | ch9.js → zukan/zukan.js |
| `zkHero` | ch9.js → zukan/zukan.js |
