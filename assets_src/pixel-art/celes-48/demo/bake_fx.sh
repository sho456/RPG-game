#!/bin/bash
# pixelfx（tools/pixelfx）のエフェクトをセレスの色でスプライトシートに焼く → demo/out/fx/<名前>/…（git の対象外）
# 使い方：リポジトリの直下で  bash assets_src/pixel-art/celes-48/demo/bake_fx.sh
cd "$(dirname "$0")/../../../../tools/pixelfx" || exit 1
OUT=../../assets_src/pixel-art/celes-48/demo/out/fx
VIO='["#140a26","#2b1252","#481c88","#6b2cc0","#9a48ec","#c684ff","#ecc8ff","#ffffff"]'
GAL='["#0a0820","#1b1460","#3a2ca8","#5a4ae0","#8a7cff","#b8b0ff","#e6e2ff","#ffffff"]'
GOLDV='["#2a1440","#5a2c90","#9a6c18","#d8a428","#ffd84a","#fff09a","#fffbe6","#ffffff"]'
BLU='["#06142a","#0e2c5a","#1c4c96","#2c78d0","#4ea4f4","#8cd0ff","#d6f0ff","#ffffff"]'
r(){ node tools/render.mjs "$1" --sheet --no-actor --opts "$2" --out "$OUT/$3" >/dev/null && echo "$3"; }
r fire/fire-tornado "{\"palette\":$GAL}" aura        # 星臨のオーラ（体のまわりを昇る銀河の渦）
r holy/halo "{\"palette\":$GOLDV}" halo               # 星臨の光輪
r arcane/rune-circle "{\"palette\":$GOLDV}" rune      # 星臨の足元の陣
r arcane/time-stop "{\"palette\":$VIO}" timestop       # 遅延の砂：時が止まる文字盤
r status/slowed "{\"palette\":$VIO}" slowed            # 遅延の砂：遅くなった印
r arcane/star-fall "{\"palette\":$GAL}" starfall       # 奥義：星の雨
r holy/holy-pillar "{\"palette\":$VIO}" pillar         # 奥義：星臨の光の柱
r arcane/mana-burst "{\"palette\":$GAL}" burst         # 奥義：星臨の解放
r holy/divine-shield "{\"palette\":$BLU}" shield       # 加速の刻：まとう光の球
r arcane/spell-charge "{\"palette\":$VIO}" charge      # 詠唱：杖の宝石に集まる光
