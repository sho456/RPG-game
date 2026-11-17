"""===== リオ第 8 版：全ポーズの組み立て（関節の位置）と書き出し =====
立ち＝stand.py の手描き。ほかは rio8.figure（頭・胴は立ちから切り出したもの）。地面＝行 29 が靴の底・行 30 が輪郭"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rio8 as R  # noqa: E402
from stand import STAND  # noqa: E402


def ready(b=0):
    """構え：膝を曲げ（2 下がる）足を前後に開く・上体を前へ・手前の腕で剣を斜め上に"""
    c = 2 + b
    return R.figure(
        legs=[((8, 23 + c), (11, 25 + c), (12, 27), 'L'),
              ((4, 23 + c), (1, 25 + c), (1, 27), 'L')],
        arms=[((9, 17 + c), (11, 20 + c), (10, 22 + c)),
              ((5, 17 + c), (3, 20 + c), (1, 19 + c))],
        torso=(1, 13 + c), head=(-1, c), scarf=(9, 14 + c, R.SC_FLOW), sword=(1, 'UL', 7))


def select():
    """コマンド選択：前へ跳び出す。手前の脚は前へ踏み出し、奥の脚は後ろで膝を曲げてつま先を下に"""
    c = 1
    return R.figure(
        legs=[((8, 23 + c), (11, 25 + c), (12, 27), 'D'),
              ((4, 23 + c), (1, 25 + c), (-1, 27), 'L')],
        arms=[((9, 17 + c), (12, 19 + c), (13, 17 + c)),
              ((5, 17 + c), (2, 19 + c), (0, 18 + c))],
        torso=(1, 13 + c), head=(-2, c), scarf=(9, 11 + c, R.SC_UP), sword=(1, 'L', 7))


def windup():
    """振りかぶり：剣を頭の後ろへ振り上げる"""
    return R.figure(
        legs=[((8, 23), (10, 26), (11, 27), 'L'),
              ((4, 23), (3, 26), (2, 27), 'L')],
        arms=[((9, 17), (11, 20), (10, 22)),
              ((9, 16), (12, 12), (12, 9))],
        scarf=(10, 14, R.SC_FLOW), sword=(1, 'UR', 7))


def charge():
    """溜め：目を閉じ、腰を落として剣を後ろ下へ引く"""
    c = 2
    return R.figure(
        legs=[((8, 23 + c), (11, 25 + c), (12, 27), 'L'),
              ((4, 23 + c), (1, 25 + c), (1, 27), 'L')],
        arms=[((5, 17 + c), (3, 20 + c), (5, 22 + c)),
              ((9, 17 + c), (12, 20 + c), (14, 21 + c))],
        torso=(1, 13 + c), head=(0, c), headrows=R.HEAD_SHUT, scarf=(9, 14 + c, R.SC_FLOW), sword=(1, 'DR', 7))


def slash():
    """斬り：前へ大きく踏み込み、剣を前下へ振り下ろす"""
    c = 3
    return R.figure(
        legs=[((8, 23 + c), (12, 25 + c), (14, 27), 'R'),
              ((4, 23 + c), (0, 25 + c), (-1, 27), 'L')],
        arms=[((9, 17 + c), (11, 20 + c), (10, 22 + c)),
              ((5, 17 + c), (2, 20 + c), (-1, 21 + c))],
        torso=(0, 13 + c), head=(-2, c), scarf=(8, 11 + c, R.SC_UP), sword=(1, 'DL', 7))


def follow():
    """振り抜き：踏み込んだまま、剣を前へ水平に振り抜く（頭がさらに 1 下がる）"""
    c = 3
    return R.figure(
        legs=[((8, 23 + c), (12, 25 + c), (14, 27), 'R'),
              ((4, 23 + c), (0, 25 + c), (-1, 27), 'L')],
        arms=[((9, 17 + c), (12, 19 + c), (14, 18 + c)),
              ((5, 18 + c), (2, 21 + c), (-1, 21 + c))],
        torso=(0, 13 + c), head=(-2, c + 1), scarf=(8, 11 + c, R.SC_UP), sword=(1, 'L', 7))


def hurt():
    """被弾：目を閉じ、上体を後ろへ反らす。剣は後ろ下に下がる"""
    return R.figure(
        legs=[((8, 23), (9, 26), (10, 27), 'L'),
              ((4, 23), (4, 26), (3, 27), 'L')],
        arms=[((9, 17), (11, 20), (12, 22)),
              ((10, 17), (13, 19), (14, 21))],
        torso=(3, 13), head=(3, 1), headrows=R.HEAD_SHUT, scarf=(4, 14, ["o.", "Ro", "RRo", "xRo", ".xo"]),
        sword=(1, 'DR', 7))


def victory():
    """勝利：剣を真上に掲げる"""
    return R.figure(
        legs=[((8, 23), (9, 26), (9, 27), 'L'),
              ((4, 23), (4, 26), (4, 27), 'L')],
        arms=[((9, 17), (11, 20), (10, 22)),
              ((9, 16), (12, 12), (12, 8))],
        scarf=(10, 14, R.SC_FLOW), sword=(1, 'U', 7))


def dying():
    """瀕死：座り込む（膝をたたむ）・頭を下げて肩に沈める・目を閉じる・手を地面に・剣を前に落とす"""
    c = 5
    sword = ["gjjGMMMMMMMV", "...gmmmmmmm."]
    return R.figure(
        legs=[((8, 23 + c), (11, 26 + c - 2), (10, 27), 'R'),
              ((4, 23 + c), (1, 25 + c - 2), (0, 27), 'L')],
        arms=[((9, 17 + c), (11, 20 + c), (12, 22 + c)),
              ((5, 17 + c), (3, 20 + c), (2, 22 + c))],
        torso=(1, 13 + c), head=(0, c + 2), headrows=R.HEAD_SHUT, scarf=(9, 15 + c, R.SC_HANG),
        extra=[(sword, -11, 28)])


POSES = {
    '立ち': R.rows_cv(STAND),
    '構え1': ready(0), '構え2': ready(1), '選択': select(),
    '振りかぶり': windup(), '溜め': charge(), '斬り': slash(), '振り抜き': follow(),
    '被弾': hurt(), '瀕死': dying(), '勝利': victory(),
}
try:
    from front import FRONT
    POSES['正面'] = R.rows_cv(FRONT)
except ImportError:
    pass
try:
    from down import DOWN
    POSES['気絶'] = R.rows_cv(DOWN)
except ImportError:
    pass

if __name__ == '__main__':
    os.makedirs(R.OUT, exist_ok=True)
    ims = {k: R.to_img(v) for k, v in POSES.items()}
    for k, im in ims.items():
        im.save(os.path.join(R.OUT, k + '.png'))
    s, cols = 5, 7
    n = len(ims)
    sheet = Image.new('RGBA', (48 * s * cols, 48 * s * ((n + cols - 1) // cols)), (226, 228, 236, 255))
    for i, im in enumerate(ims.values()):
        sheet.alpha_composite(im.resize((48 * s, 48 * s), Image.NEAREST), ((i % cols) * 48 * s, (i // cols) * 48 * s))
    sheet.save(os.path.join(R.OUT, 'preview.png'))
    print('\n'.join(ims))
