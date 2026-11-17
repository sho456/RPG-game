"""正面（下絵 2 枚目）・第 9 版。左半分（列 0〜7）を描いて写し、右半分は 1 段暗く。最後に左右の違い（頭頂の房・剣）を足す
頭 14 行（顔の肌 6・白目は外・目の間に肌 2）・マフラー 3 行・コート 8 行・脚と靴 6 行"""
HALF = [
    #01234567
    "........",   # 0
    "...o.oo.",   # 1
    "..o4o45o",   # 2
    ".o345434",   # 3
    "oo234544",   # 4  横へ跳ねる房
    "o32h3454",   # 5
    ".o23h343",   # 6
    "o2h23h34",   # 7
    ".o1h2h3h",   # 8  前髪の房
    ".o12hhss",   # 9  額
    "..o12oos",   # 10 まぶた
    "..o1uWes",   # 11 白目（外）・瞳
    "..o1uWas",   # 12 虹彩
    "...o1uts",   # 13 頬
    "....oxut",   # 14 顎・マフラー
    "..ooxRpR",   # 15
    ".oCxrRRp",   # 16 肩
    "oLCcxrrx",   # 17
    "oLCooCLC",   # 18 腕・コート
    "oLCocCLg",   # 19 金の十字
    "ogGocLgG",   # 20 袖口（金）
    "oggocCLg",   # 21
    "ostojgGG",   # 22 手・ベルト
    "otuocCLC",   # 23
    ".oo.ogGg",   # 24 裾の縁
    "....oqPo",   # 25 脚
    "....oqPo",   # 26
    "...oNBbo",   # 27 靴
    "..oNNBbo",   # 28
    "..obbbbo",   # 29
    "..oooooo",   # 30
]
DARKER = {'5': '4', '4': '3', '3': '2', 's': 't', 't': 'u', 'L': 'C', 'C': 'c', 'c': 'k', 'G': 'g', 'g': 'j',
          'Q': 'P', 'P': 'q', 'N': 'B', 'B': 'b', 'p': 'R', 'R': 'r'}


def mirror(half):
    return [r + ''.join(c if c in 'oeaWhx.' else DARKER.get(c, c) for c in r[::-1]) for r in half]


FRONT = [r + '..' for r in mirror(HALF)]   # 剣の先の分だけ右をあける


def put(y, x, txt):
    r = list(FRONT[y])
    for i, ch in enumerate(txt):
        if ch != ' ':
            r[x + i] = ch
    FRONT[y] = ''.join(r)


# 髪の上（0〜5 行）は左右を写さず手で描く：真ん中から少し左の房・丸い量感・左右の跳ね（下絵どおり非対称）
for _y, _r in enumerate([
        "......oo.........",
        "...oo.o45o.oo....",
        "..o45o4554o44oo..",
        ".o3454454434432o.",
        "oo234543443432oo.",
        "o32h3454343h232o."]):
    FRONT[_y] = _r
# 剣：右の腰に柄、刃は右下へ急な斜め（下絵の角度。先は右の腕の下まで）。刃のまわりは黒で縁取る
SWORD = {(10, 21): 'g', (10, 22): 'j', (11, 22): 'j', (10, 23): 'g', (11, 23): 'G', (12, 23): 'g',
         (11, 24): 'M', (12, 24): 'm', (12, 25): 'M', (13, 25): 'm', (12, 26): 'M', (13, 26): 'm',
         (13, 27): 'M', (14, 27): 'm', (14, 28): 'V'}
for (_x, _y), _c in SWORD.items():
    for _a, _b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        _q = (_x + _a, _y + _b)
        if _q not in SWORD and 0 <= _q[1] < len(FRONT) and _q[0] < len(FRONT[0]):
            put(_q[1], _q[0], 'o')
for (_x, _y), _c in SWORD.items():
    put(_y, _x, _c)
FRONT = [r[:17] for r in FRONT]
