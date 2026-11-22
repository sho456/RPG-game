#!/usr/bin/env python3
"""===== 旧コード整理：smoke.js --cov で一度も呼ばれず、名前でもどこからも参照されない「function 名(…){…}」の宣言を消す =====
使い方：python3 tools/prune.py cov.json [--apply] [--file js/ver19.js]
・既定は一覧だけ（--apply で書き換え）。消したあとは必ず smoke.js で確かめる。
・対象は行頭近くの function 宣言だけ（包み・メソッド・アロー関数は対象外）。名前が js/ のどこか（自分の宣言の外）に出てくれば残す。"""
import json, sys, re, glob
a = sys.argv[1:]; cov = json.load(open(a[0])); APPLY = '--apply' in a
only = a[a.index('--file')+1] if '--file' in a else None
files = [f for f in glob.glob('js/**/*.js', recursive=True) if '/sprite/data/' not in f]
src = {f: open(f, encoding='utf8').read() for f in files}
# 1) 一度も呼ばれなかった function 宣言を全部集める
cand = []
for f, fns in cov.items():
    if only and f != only or f not in src: continue
    s = src[f]; lines = s.split('\n')
    for name, line, size, cnt in fns:
        if line > len(lines) or cnt or not re.fullmatch(r'[A-Za-z_$][\w$]*', name): continue
        lo = sum(len(l) + 1 for l in lines[:line-1]); m = re.search(r'(async\s+)?function\s+' + re.escape(name) + r'\s*\(', s[lo:lo+len(lines[line-1])])
        if not m: continue
        st = lo + m.start(); en = st + size + (len(m.group(1)) if m.group(1) else 0)
        if not s[st:en].rstrip().endswith('}'): continue
        cand.append((f, st, en, name))
# 2) 名前が「候補の本体の外」に出てくるものを外す。残りが変わらなくなるまで繰り返す（死んだ関数どうしの参照は数えない）
def outside(t, spans):
    out, last = [], 0
    for b, e in sorted(spans):
        if b >= last: out.append(t[last:b]); last = e
    out.append(t[last:]); return ''.join(out)
while True:
    spans = {}
    for f, b, e, _ in cand: spans.setdefault(f, []).append((b, e))
    rest = {f: outside(t, spans.get(f, [])) for f, t in src.items()}
    keep = []
    for c in cand:
        pat = re.compile(r'(?<![\w$.])' + re.escape(c[3]) + r'(?![\w$])')
        if not any(pat.search(t) for t in rest.values()): keep.append(c)
    if len(keep) == len(cand): break
    cand = keep
total = 0
byf = {}
for c in cand: byf.setdefault(c[0], []).append(c)
for f, cs in sorted(byf.items()):
    cs.sort(key=lambda c: c[1]); kept = []; last = -1
    for c in cs:
        if c[1] >= last: kept.append(c); last = c[2]
    n = sum(c[2] - c[1] for c in kept); total += n
    print(f'{n:6d} {f}: ' + ' '.join(c[3] for c in kept))
    if APPLY:
        s = src[f]
        for _, b, e, _ in reversed(kept): s = s[:b] + s[e:]
        open(f, 'w', encoding='utf8').write(s)
print('合計', total)
