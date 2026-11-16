"""リオ第 5 版：基本ポーズを 1 枚ずつ手で描いた地図（rio.py の POSES を上書きする）
・正面＝今回の参考（正面の女の子）の行ごとの作り：頭 15 行・額の肌 4・まぶた→白目（外）と瞳→虹彩・顎 2・肩幅 14・腕は黒 1 列で分けて手は腰
・剣は全ポーズ同じ形：柄 2（j）・鍔 3（g G g）・刃 幅 2（M 芯・m 影）長さ 11・先 V"""
DARKER = {'5': '4', '4': '3', 's': 't', 't': 'u', 'L': 'C', 'C': 'C', 'c': 'c', 'G': 'g', 'g': 'j',
          'Q': 'P', 'P': 'q', 'N': 'B', 'B': 'b', 'p': 'R', 'R': 'r', 'w': 'n', 'M': 'm', 'm': 'z', 'n': 'n'}

FH = [  # 正面の左半分（列 0〜9）。右半分は写して 1 段暗く。頭 13 行（幅 14・肩より狭い）・体 18 行（肩を張ったコート・裾は膝まで）
    "......o..o",   # 0  髪の先（立ちと同じとがり）
    "....oo4oo4",   # 1
    "...o2345o5",   # 2
    "..o23o4554",   # 3  横へはねる房（立ちと同じ）
    "...o34o454",   # 4
    "..o21o34o4",   # 5  前髪の房（暗い筋）・下の横はね
    "...o2o3s3s",   # 6  額
    "...o211oos",   # 7  まぶた
    "...o21oWes",   # 8  白目（外）・瞳
    "....o1otas",   # 9  虹彩
    "....o2ouss",   # 10 頬（肌 6）
    "......oous",   # 11 顎（肌 4）
    ".......oxR",   # 13 首・マフラー
    "...oooopRR",   # 14
    "..oLLLooRr",   # 15 肩（コートの肩を張る）
    ".oLCCGgoww",   # 16 金の縁・シャツ（白を広く）
    "oLCLgjogww",   # 17 腕
    "oLCkLCogwn",   # 18 コートの前身頃・金の前立て
    "oLCkLCojgg",   # 19 ベルト
    "oMmkLCoLCC",   # 20 銀の籠手
    "ogGkLCoLCC",   # 21 金の袖口
    "ostoLCoLCC",   # 22 手
    "otuoLCogGg",   # 23 裾の金
    "..oLCoQQPo",   # 24 コートの裾（脇）・脚（幅 3）
    "..oLCoQQPo",   # 25
    "..oCkoQPqo",   # 26
    "..oggoNBBo",   # 27 裾の縁・ブーツ
    "...ooNnBbo",   # 28 ブーツの金具
    "....obbbbo",   # 29
    "....oooooo",   # 30
]


def mirror(half):
    return [r + ''.join(c if c in 'oeaWYy.' else DARKER.get(c, c) for c in r[::-1]) for r in half]


def put(rows, y, x, txt):
    r = list(rows[y])
    for i, ch in enumerate(txt):
        if ch != ' ':
            r[x + i] = ch
    rows[y] = ''.join(r)


FRONT = mirror(FH)
_cv = [list(r) for r in FRONT]

put(FRONT, 0, 9, 'o')       # アホ毛
put(FRONT, 1, 9, '5o')
put(FRONT, 2, 13, 'G')      # 星のピン
put(FRONT, 3, 12, 'gGg')
put(FRONT, 4, 13, 'g')
put(FRONT, 18, 11, 'yo')    # 腰のランタン（体の左＝画面の右）
put(FRONT, 19, 11, 'Y')
put(FRONT, 16, 9, 'g')      # 金のボタン
put(FRONT, 17, 10, 'G')
_cv = [list('.' + r + '.') for r in FRONT]
_close(_cv) if '_close' in dir() else None


# ---------------- 3/4 のポーズ（列 0＝立ちの列 0。左に 4 列の余白を足して描く） ----------------
def _grid(rows, w=60, h=60, ox=14, oy=4):
    cv = [['.'] * w for _ in range(h)]
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch != '.':
                cv[oy + j][ox + i] = ch
    return cv


def _close(cv):
    H_, W_ = len(cv), len(cv[0])
    add = [(x + a, y + b) for y in range(H_) for x in range(W_) if cv[y][x] not in '.o'
           for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + a < W_ and 0 <= y + b < H_ and cv[y + b][x + a] == '.']
    for x, y in add:
        cv[y][x] = 'o'


def _rows(cv):
    return [''.join(r) for r in cv]


def stand_body():
    """立ち（剣なし）：頭 1〜15・胴 16〜23・脚 24〜31。手は胴の脇（列 11〜13・行 23〜24）"""
    import rio
    S = [r for r in rio.STAND]
    S[23] = "....oggjgjostuo.."
    S[24] = ".....ooooootuo..."
    S[25] = ".....oPoQPo.oo..."
    S[26] = ".....oPoQPo......"
    S[27] = ".....oPoQPo......"
    S[28] = "....oNBoNBo......"
    S[29] = "...oNBBoNBBo....."
    return S


def stand_with_sword():
    import rio
    cv = _grid(stand_body())
    rio.blade(cv, 14 + 12, 4 + 24, 'DR', 6)    # 手から右下へ（後ろに下げて持つ。足元で止める）
    _close(cv)
    return _rows(cv), 4 + 31


def weak():
    """瀕死：座り込み（膝と足は体の下にたたむ）・頭を下げて肩に沈める・目を閉じる・両手を地面に・剣は前に落とす"""
    import rio
    head = rio.HEAD_SHUT[1:16]
    body = [
        ".....oxRRRro.....",   # マフラー（頭の下にほぼ隠れる）
        "...ooRpRRrrxRo...",
        "..oLLocgLCcoRro..",   # 肩を丸める・前の腕は前下へ
        ".oLCo.ocgCcko.xo.",
        ".oCo..ojgygjko...",
        "ogGo.ooCcYCcCLo..",   # 後ろの腕
        "osto.oQPPPqoCCo..",   # 腿（前へ）
        "otuooNBQPPPqoGgo.",   # 手を地面に
        ".oo.oNBBbbbbostuo",
        "....ooooooooooooo",
    ]
    cv = _grid(body, oy=4 + 16)
    for j, r in enumerate(head):               # 頭は 3 下げて前へ 1（肩に沈める）
        for i, ch in enumerate(r):
            if ch != '.':
                cv[4 + 16 - 15 + 2 + j][14 - 1 + i] = ch
    rio.blade(cv, 14 + 0, 4 + 16 + 9, 'L', 8)  # 剣は前（左）の地面に落ちている
    _close(cv)
    return _rows(cv), 4 + 16 + 9


def down():
    """気絶：剣なしの立ち（目を閉じた頭）を 90° 回す＝頭が右・顔が上・足が左。腕は体の前に投げ出す。剣は体の下に横たえる"""
    import rio
    S = stand_body()
    S[10:14] = rio.HEAD_SHUT[10:14]
    S = [r.ljust(17, '.')[:14] for r in S[1:31]]          # マフラーの尾と後ろの手は落とす（体の下に隠れる）
    H_, W_ = len(S), len(S[0])
    rot = [''.join(S[H_ - 1 - y][x] for y in range(H_)) for x in range(W_)]     # 時計回り 90°
    cv = _grid(rot, oy=8)
    _close(cv)
    bottom = max(y for y in range(len(cv)) if any(c != '.' for c in cv[y]))
    return _rows(cv), bottom


FRONT = ['.' + r + '.' for r in FRONT]
_c = [list(r) for r in FRONT]
_close(_c)
FRONT = [''.join(r) for r in _c]
EXTRA = {'正面': FRONT, '立ち': stand_with_sword(), '瀕死': weak(), '気絶': down()}
