"""正面（下絵 2 枚目）・第 9 版の 3。左半分（列 0〜7）を描いて写し、右半分は 1 段暗く。頭の上・剣は手で足す
幅 14（肩幅は頭と同じ・腰を絞る）。頭 14 行・マフラー 3 行・胴 7 行・脚と靴 7 行。腕・脚は太さ 2、手は股の高さ"""
HALF = [
    #01234567
    "........",   # 0 （0〜1 行は下で手描きに置き換える）
    "........",   # 1
    "..oo4554",   # 2
    ".o345454",   # 3
    "o2343445",   # 4 横の房
    ".o2h3h4h",   # 5
    "o21h2hs3",   # 6 前髪の房・額・目の高さで横に跳ねる房
    ".o21soos",   # 7 まぶた・顔の脇に垂れる髪
    ".o21sWes",   # 8 白目（外）・瞳
    ".o21sWas",   # 9 虹彩
    "..o21sys",   # 10 頬の赤み
    "..o1oust",   # 11 顎・脇の房の先
    ".....oxR",   # 12 首・マフラー
    "...ooRpR",   # 13
    "..oRrRpR",   # 14
    ".ogGorRx",   # 15 肩（丸く）
    ".oLCoLlG",   # 16 腕（太さ 2）・コート・金の十字
    ".oLCoClY",   # 17
    ".oLCokCG",   # 18 腰を絞る
    ".oCcojjY",   # 19 ベルト
    ".oOgoCLC",   # 20 袖口（橙・金）
    ".ostogGg",   # 21 手・裾の縁
    ".otuoQfP",   # 22 手・腰
    "..oo.ofP",   # 23 脚（太さ 2）
    "....ofPo",   # 24
    "....ofPo",   # 25
    "....oQPo",   # 26
    "...onNBo",   # 27 靴の筒
    "..onNBbo",   # 28 足（つま先は外へ）
    "..obbbbo",   # 29 靴底
    "..oooooo",   # 30
]
DARKER = {'5': '4', '4': '3', '3': '2', 's': 't', 't': 'u', 'L': 'C', 'C': 'c', 'c': 'k', 'G': 'g', 'g': 'j',
          'Q': 'P', 'P': 'q', 'N': 'B', 'B': 'b', 'p': 'R', 'R': 'r', 'l': 'L', 'f': 'Q', 'n': 'N', 'Y': 'G', 'O': 'O',
          'y': 'y', 'k': 'K'}


def mirror(half):
    return [r + ''.join(c if c in 'oeaWhx.' else DARKER.get(c, c) for c in r[::-1]) for r in half]


FRONT = [r + '..' for r in mirror(HALF)]


def put(y, x, txt):
    r = list(FRONT[y])
    for i, ch in enumerate(txt):
        if ch != ' ':
            r[x + i] = ch
    FRONT[y] = ''.join(r)


# 頭頂：真ん中から少し左に 1 本高い房、右に低い房（下絵どおり非対称）
FRONT[0] = "......oo........."
FRONT[1] = "....oo45o.oo....."
# 剣：右手で握り、刃は手の下から右下へ急な斜め（下絵どおり）。柄頭は手の上にのぞく。刃のまわりは黒で縁取る
SWORD = {(12, 20): 'g', (12, 23): 'g', (13, 23): 'Y', (14, 23): 'g',
         (13, 24): 'M', (14, 24): 'm', (13, 25): 'M', (14, 25): 'm', (14, 26): 'M', (15, 26): 'm', (14, 27): 'V'}
for (_x, _y), _c in SWORD.items():
    for _a, _b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        _q = (_x + _a, _y + _b)
        if _q not in SWORD and 0 <= _q[1] < len(FRONT) and _q[0] < len(FRONT[0]) and FRONT[_q[1]][_q[0]] in '.o':
            put(_q[1], _q[0], 'o')
for (_x, _y), _c in SWORD.items():
    put(_y, _x, _c)
# 髪の陰：明るい段の右・下の 2 を橙に
for _y in range(0, 9):
    _r = list(FRONT[_y])
    for _x, _c in enumerate(_r):
        if _c == '2' and ((_x > 0 and FRONT[_y][_x - 1] in '34') or (_y > 0 and FRONT[_y - 1][_x] in '34')):
            _r[_x] = 'i'
    FRONT[_y] = ''.join(_r)
