# ドット絵全面刷新：進捗（最終更新：提供原画3点を実装・検証済み／残りは原画待ち）

## いまの状態
| フェーズ | 状態 |
|---|---|
| Phase 0 現状調査 | 完了（`assets_manifest.json`：76キャラ。改修前の描画は `assets_backup/old_sprites/`） |
| Phase 1 参考分析・アートバイブル | 完了（`docs/art_bible.md`。RS一覧サイトは画像配信元が環境の通信制限で取得不可） |
| Phase 2 パイロット | 完了。第1〜4版（自作）は不採用 → **提供原画方式で確定**（ユーザー承認） |
| Phase 3 本制作 | **リオ・灰狼・黒炎竜の3体を実装**。残り（敵38・味方11・街の住人4）は**原画待ち**（`docs/art_request.md`） |
| Phase 4 実装 | 完了（`js/spx-data.js`＋`js/spx.js`。既存コードは無変更で入口だけ差し替え） |
| Phase 5 総合検証 | 3体について完了（dpr 2／3、戦闘・ボス戦・試練の幻影・虚蝕化・探索・街・図鑑・編成・顔グラ） |

## 各アセットの状態
- 検証済み：`rio`（＋`rio_aw` 星臨・`tr_rio2/3` 試練の幻影）、`wolf`（＋`vo_wolf` 虚蝕化）、`boss9`
- 原画待ち（旧リグで表示）：上記以外の全キャラ。一覧は `assets_manifest.json`／依頼は `docs/art_request.md`

## 原画が届いたときの手順
1. 原画を `assets_src/originals/` に保存（敵：`<ID>.png`、味方：`hero_<ID>_poses.png`）
2. `tools/build_spx.py` の `chars()` に 1 行追加（敵は `mon(...)`。味方は `hero_rio()` を写して切り出し位置を調整）
3. `js/spx.js` の `DEF` に新しいリグの寸法を 1 行追加（味方は元のキャラのリグ、敵は種族の近いリグを `base` に）
4. `python3 tools/build_spx.py <ID>` → `node tools/verify_spx.js <dir>`／`node tools/verify_ui.js <dir>`／`node tools/pose_sheet.js <png>` で確認

## 仕組み（要点）
- ビルド：原画 → 背景抜き → 原画の解像度で派生ポーズ → 共有パレット → 複数サイズへ縮小 → 輪郭 → PNG アトラス（data URL）
- 実行時：`SPRX.info` で対象キーを新リグ `spx_○○` へ。`SPRX.frame` がポーズの値から絵を選ぶ（味方）／整数ドットで動かす（敵）
- ドット幅：戦闘中は全キャラ 1 ドット＝`round(dpr)` 画素（旧リグも同じ幅で描き直す）。探索・街は 1 ドット＝論理 1px
- 味方の背丈：画面幅の約 13.8%（`V23.HK23.placeHeroes` を包んで調整）

## 既知の制限
- 新しい味方スプライトでは、装備の素材による刃の色替え（銅・鉄・鋼・星鋼）が効かない（原画の色のまま）
- 会話の表情5種は同じ顔グラに記号を重ねる方式（原画に表情差分が無いため）
- エフェクト・粒子のドット幅は従来のまま（≒1.5 CSS px）で、キャラ（≒1 CSS px）より少し粗い

## ツール
`tools/build_spx.py`（変換）／`tools/import_art.py`（背景抜き・縮小）／`tools/verify_spx.js`・`tools/verify_ui.js`（ゲーム内撮影）／
`tools/pose_sheet.js`（全キーポーズ）／`tools/dump_current.js`（全キャラ書き出し）／`tools/contact.py`（一覧）／`tools/pxl/`（不採用の自作方式の記録）
