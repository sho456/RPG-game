"""正面・第 8 版：左半分（列 0〜7）を描いて写し、右半分は 1 段暗く。頭 13 行・顔の肌 6・目の間は肌 2・白目は外側"""
HALF = [
    #01234567
    "........",   # 0
    "...o..o.",   # 1  とがった房
    "..o4oo4o",   # 2
    ".o34o454",   # 3
    "o3445345",   # 4
    ".o343434",   # 5
    "o2343h34",   # 6
    ".o2h3sh3",   # 7  前髪の房と額
    ".o21uoos",   # 8  まぶた
    ".o21uWes",   # 9  白目（外）・瞳
    "..o1uWas",   # 10 虹彩
    "..o1otss",   # 11 頬
    "...ooutt",   # 12 顎
    ".....oxR",   # 13 首・マフラー
    "...ooRpR",   # 14
    "..oRRppR",   # 15
    ".oLorRRr",   # 16 肩
    "oLCCoxrR",   # 17
    "oLCcoLCg",   # 18 腕・コート・金の十字
    "oLCcoLgG",   # 19
    "oCCcoLCg",   # 20
    "ogGgoggG",   # 21 袖口・ベルト
    "ostuoCCc",   # 22 手
    "otuuoLCc",   # 23
    ".ooogGgg",   # 24 裾の縁
    "...oQPPo",   # 25 脚
    "...oQPqo",   # 26
    "..oNBBBo",   # 28 靴
    "..oNBBbo",   # 29
    "..obbbbo",   # 30
    "...ooooo",   # 31
]
DARKER = {'5': '4', '4': '3', 's': 't', 't': 'u', 'L': 'C', 'C': 'c', 'G': 'g', 'g': 'j',
          'Q': 'P', 'P': 'q', 'N': 'B', 'B': 'b', 'p': 'R', 'R': 'r', 'M': 'm'}


def mirror(half):
    return [r + ''.join(c if c in 'oeaWh.' else DARKER.get(c, c) for c in r[::-1]) for r in half]


FRONT = mirror(HALF)


def put(y, x, txt):
    r = list(FRONT[y])
    for i, ch in enumerate(txt):
        if ch != ' ':
            r[x + i] = ch
    FRONT[y] = ''.join(r)


# 左右の非対称：房の先・剣（右の腰に下げる）
put(0, 9, 'o')
put(1, 8, 'o4o')
put(1, 6, '.')
# 右手（絵の右）に剣を下げる：柄・鍔・刃（立ちと同じ形）
put(24, 12, 'ojo')
put(25, 11, 'ogGgo')
for _y in range(26, 29):
    put(_y, 12, 'oMmo')
put(29, 12, 'oVo')
put(30, 12, '.oo')
