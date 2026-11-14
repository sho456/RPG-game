#!/usr/bin/env python3
"""関数の「包み（ラップ）」の流れを一覧にする → docs/BATTLE.md の自動生成の節を書き換える

このゲームは版ごとのファイルが、前の版の関数を `{const _x=f; f=function(...){... _x(...) ...};}` の形で包んで機能を足していく。
戦闘の関数は何段にも包まれているので、どのファイルがどの順で包んでいるか（読み込み順＝index.html の <script> の順）を一覧にする。

  python3 tools/wrapmap.py            docs/BATTLE.md の <!-- wrapmap:begin --> 〜 <!-- wrapmap:end --> を書き換える
  python3 tools/wrapmap.py --print    画面に出すだけ

・「定義」＝ function f(...) で作り直している（それより前の包みは捨てられる）
・「控え」＝ ver19-pre.js の V17F のように、その時点の関数を控えて後で使う（控えより後・使う前の包みは飛ばされる）
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, 'docs', 'BATTLE.md')
BATTLE = ['startBattle', 'run', 'nextActor', 'heroTurn', 'enemyTurn', 'doAction', 'hit', 'calc', 'hurt', 'kill', 'pop',
          'awaken', 'endAw', 'reso', 'end', 'rewards', 'enemy', 'hero', 'refresh', 'draw', 'frameOf']

order = re.findall(r'<script src="([^"]+)"', open(os.path.join(ROOT, 'index.html')).read())
DEF = re.compile(r'^(?:async\s+)?function\s+([A-Za-z_]\w*)\s*\(', re.M)
WRAP = re.compile(r'const\s+_\w+\s*=\s*(V17F\.)?([A-Za-z_]\w*)\s*;\s*(?:[A-Za-z_]\w*\.)?([A-Za-z_]\w*)\s*=\s*(?:async\s+)?function')
SNAP = re.compile(r'const\s+V17F\s*=\s*\{([^}]*)\}')
DIRECT = re.compile(r'(?<![\w.])([A-Za-z_]\w*)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{[^{}]{0,60}?V17F\.\1\(')   # f=function(...){V17F.f(...)} の直接の置き換え
chains = {}
def depths(s):
    """各位置の波括弧の深さ（文字列・テンプレート・コメントの中は数えない。モジュール内部の同名関数を外すため）"""
    d, out, i, n, q = 0, [0] * (len(s) + 1), 0, len(s), None
    while i < n:
        c = s[i]
        if q:
            if c == '\\':
                out[i] = d; i += 1
            elif c == q:
                q = None
        elif c in '\'"`':
            q = c
        elif s.startswith('//', i):
            j = s.find('\n', i); j = n if j < 0 else j
            for k in range(i, j): out[k] = d
            i = j; continue
        elif s.startswith('/*', i):
            j = s.find('*/', i); j = n if j < 0 else j + 2
            for k in range(i, j): out[k] = d
            i = j; continue
        elif c == '{':
            d += 1
        elif c == '}':
            d = max(0, d - 1)
        out[i] = d; i += 1
    return out


for f in order:
    s = open(os.path.join(ROOT, f)).read()
    dp = depths(s)
    ev = []
    for m in DEF.finditer(s):
        if dp[m.start()] == 0:   # 外側（グローバル）の定義だけ
            ev.append((m.start(), m.group(1), '定義'))
    for m in WRAP.finditer(s):
        ev.append((m.start(), m.group(3), '包み' + ('（V17F の控えを包む）' if m.group(1) else '')))
    for m in DIRECT.finditer(s):
        ev.append((m.start(), m.group(1), '包み（V17F の控えを包む）'))
    for m in SNAP.finditer(s):
        for n in re.findall(r'[A-Za-z_]\w*', m.group(1)):
            ev.append((m.start(), n, '控え'))
    for _, n, kind in sorted(ev):
        chains.setdefault(n, []).append((kind, f.replace('js/', '')))


def line(n):
    return ' → '.join(('**%s**' % f if k == '定義' else f + ('（控え）' if k == '控え' else '') + ('＊' if 'V17F' in k else ''))
                      for k, f in chains.get(n, []))


out = ['| 関数 | 読み込み順の流れ（**太字**＝定義、（控え）＝V17F に控えた時点、＊＝控えを包む） |', '|---|---|']
for n in BATTLE:
    if n in chains:
        out.append('| `%s` | %s |' % (n, line(n)))
many = sorted(((n, v) for n, v in chains.items() if n not in BATTLE and sum(1 for k, _ in v if k.startswith('包み')) >= 4),
              key=lambda x: -len(x[1]))
out += ['', '戦闘以外で 4 回以上包まれている関数：', '']
out += ['- `%s`（%d）：%s' % (n, len(v), line(n)) for n, v in many]
text = '\n'.join(out)
if '--print' in sys.argv or not os.path.exists(DOC):
    print(text)
else:
    d = open(DOC).read()
    a, b = '<!-- wrapmap:begin -->', '<!-- wrapmap:end -->'
    if a not in d:
        raise SystemExit('error: docs/BATTLE.md に %s が無い' % a)
    d = d[:d.index(a) + len(a)] + '\n' + text + '\n' + d[d.index(b):]
    open(DOC, 'w').write(d)
    print('wrote', DOC)
