#!/usr/bin/env python3
"""===== 旧コード整理の候補：smoke.js --cov の結果から「一度も呼ばれなかった名前つき関数」をファイルごとに大きい順で出す =====
使い方：node tools/smoke.js --url ... --cov cov.json  →  python3 tools/deadcode.py cov.json [--min 200] [--file js/town.js]
・同じ名前が後のファイルで上書きされている場合、前の定義は呼ばれないのが普通（上書きの連鎖）。消す前に codemap.py と grep で呼び出し元を確かめる。
・smoke が通らない画面（セーブの読み込み・まれな分岐など）の関数も 0 回になる。消すのは「名前で他から参照されていない」ものだけ。"""
import json, sys, collections
a = sys.argv[1:]; cov = json.load(open(a[0]))
mn = int(a[a.index('--min')+1]) if '--min' in a else 200
only = a[a.index('--file')+1] if '--file' in a else None
tot = collections.Counter(); dead = collections.defaultdict(list)
for f, fns in cov.items():
    if only and f != only: continue
    for name, line, size, cnt in fns:
        if cnt == 0:
            dead[f].append((size, name, line)); tot[f] += size
for f, s in tot.most_common():
    big = sorted([d for d in dead[f] if d[0] >= mn], reverse=True)
    if not big: continue
    print(f'{s:7d} {f}')
    for size, name, line in big[:40]: print(f'   {size:6d} {name}:{line}')
