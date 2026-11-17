"""気絶・第 8 版：剣とマフラーの尾を外した立ち（目を閉じた頭）を時計回りに 90° 回す＝頭が右・顔が上・足が左。剣は持たない"""
import rio8 as R

UNARMED = R.HEAD_SHUT + [
    "....oxRRo.......",  # 13
    "...oRppRRRo.....",  # 14
    "..oRRRRrRRxo....",  # 15
    "..orRrxcRxRo....",  # 16
    "..ocLCgcoLco....",  # 17
    "..oLgGgcoLCo....",  # 18
    "..ocLCgcoCCo....",  # 19
    "..ojgGgjocCo....",  # 20
    "..ocCcccoggo....",  # 21
    "..ogGgggostuo...",  # 22
    "...oQPoQPotuo...",  # 23
    "...oQPoQPoooo...",  # 24
    "...oQPoQPo......",  # 25
    "...oQPoPqo......",  # 26
    "..oNBBoNBo......",  # 27
    ".oNNBBoNBBo.....",  # 28
    ".obbbbobbbbo....",  # 29
    "..oooo.oooo.....",  # 30
]
_h = len(UNARMED)
ROT = [''.join(UNARMED[_h - 1 - x][y] for x in range(_h)) for y in range(16)]   # 時計回り
ROT = [r for r in ROT if r.strip('.')]
DOWN = ROT    # 剣は外す（気絶の決まり：武器を外した立ちを回す）
