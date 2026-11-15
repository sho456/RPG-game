"""リオ RS 風・第 2 版（rs-style-sprite の「人体の規則」どおりに 1 ドットずつ置く）
実行：リポジトリの直下で  python3 assets_src/pixel-art/rio-rs2/build.py
・待機（立ち）を地図で手描き。幅 15・高さ 31、頭 15 行（身長の約半分）、目は 1 ドット幅＋黒いまぶた 2 ドット、
  服は 2 色＋内側の線、脚は 2 ドットずつ、足は前（左）を向く
・ほかのポーズは、この地図を部品（頭・胴・腕・脚）に分けて組み直す（次の段階）"""
import os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, '..', '..', '..', '.claude', 'skills', 'rs-style-sprite', 'scripts'))
from rsmap import render, PAL_BASE  # noqa: E402

PAL = dict(PAL_BASE, **{
    # 髪（4 段：光 a → 影 d）
    'a': '#fff1a0', 'b': '#f2c840', 'c': '#d08e18', 'd': '#8c5410',
    # 肌（3 段）・目
    'e': '#ffd8b8', 'f': '#f2a888', 'g': '#d27a62', 'j': '#1c3c88', 'i': '#3c94ff', 'w': '#f2f2f6',
    # マフラー（赤 2 段）
    'r': '#e04444', 'R': '#962032',
    # コート（濃紺 2 段）・金の縁
    'l': '#4a5288', 'm': '#2a2e54', 'y': '#f0c458', 'Y': '#a87420',
    # ズボン・すね当て・剣（鋼 3 段）
    'p': '#6c7086', 'P': '#484b5c', 's': '#f4f6fc', 't': '#b4bacc', 'u': '#767c92',
})

STAND = [  # 左向き 3/4。x=0 が前（敵の側）
    "...........o..o.......",
    "........o.oco.obo.....",
    ".......obooabobbo.o...",
    "......oabbaabbbbbobo..",
    ".....oaaabaabbbbbbco..",
    "....obaaabbbbbbbbcco..",
    ".....obabbbabbbbccdo..",
    "....obabcbbbcbbbccdo..",
    "....obcdbcdbbbbcccdo..",
    "....ocdfcdffcbbccdo...",
    "....odffeffebccccdo...",
    "....ooeoofebcccddo....",
    "....ojejwfgbcddo......",
    "....oieiwfgcddo.......",
    ".....oeeffgdo.........",
    "......ofggoRRo........",
    ".....orrrrRRRRo.......",
    "....ottorRyllmmo......",
    "...otsuoRylllmmo......",
    "...otuoolylmmlmo......",
    "...ouoolylmmolmo......",
    "...ofeoylmmmolmo......",
    "...ogfoylmmmolfeo.....",
    "...ooo.yYYYYYofgo.....",
    "......olmmPomlmoo.....",
    "......olmopPolmo......",
    "......oppoPPomo.......",
    "......otsootuo........",
    ".....otsuotuuo........",
    "....ottuuottuo........",
    "....oooooooooo........",
]
SWORD = [  # 手（x=3〜4, y=21〜22）から前下へ。柄は金、刃は鋼
    (2, 23, 'Y'), (1, 24, 'y'), (2, 24, 'Y'), (3, 24, 'y'),
    (1, 25, 't'), (0, 26, 's'), (1, 26, 'u'), (-1, 27, 's'), (0, 27, 'u'), (-2, 28, 's'), (-1, 28, 'u'), (-3, 29, 's'), (-2, 29, 'u'), (-3, 30, 'u'),
]

if __name__ == '__main__':
    render({'待機': (STAND, SWORD)}, PAL, os.path.join(ROOT, 'out'), refs=os.environ.get('RS_REFS'))
