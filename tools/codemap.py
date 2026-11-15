#!/usr/bin/env python3
"""コード地図（docs/CODEMAP.md）を作る。トークンを節約して「どのファイルを直せばよいか」を 1 回で引くための索引。

このゲームは index.html の読み込み順に、後のファイルが前の関数を上書き（`{const _x=f;f=function(){...}}`）して育ってきた。
同じ関数が 5 つのファイルにまたがることもあり、grep で全部を読むとトークンがかさむ。
この地図は「関数ごとに、定義したファイル → 上書きしたファイル（読み込み順）」を一覧にする。
**最後に上書きしたファイルが、今の動きの正本**。

使い方：python3 tools/codemap.py          （docs/CODEMAP.md を書き直す）
        python3 tools/codemap.py boardMenu（その関数の定義・上書きの場所だけを表示。行番号つき）
"""
import re, sys, os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIG = 200_000
# ファイルの中だけの小さな道具（どのファイルにもある同名の局所関数）は連鎖から外す
LOCAL = {'esc', 'clamp', 'fmt', 'lerp', 'rnd', 'sign', 'px', 'pct', 'num', 'hx', 'badge', 'ease', 'ez', 'col', 'inB', 'DEV'}  # これより大きいファイル（原画データなど）は中身を読まない

def scripts():
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
    return re.findall(r'<script src="([^"]+)"', s)

DEF = re.compile(r'(?:^|[;{}\s])function\s+([A-Za-z_$][\w$]*)\s*\(')
OVR = re.compile(r'(?:^|[;{}\s])([A-Za-z_$][\w$]*)\s*=\s*(?:function\b|\([^()]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)')
WRAP = re.compile(r'const\s+_\w+\s*=\s*([A-Za-z_$][\w$]*)\s*;\s*\1\s*=')
MOD = re.compile(r'^(?:const|let|var)\s+([A-Z][A-Z0-9_]+)\s*=\s*\(\s*\(\s*\)\s*=>', re.M)

def header(txt):
    m = re.match(r'\s*/\*+\s*=*\s*(.*?)\s*=*\s*(?:\n|\*/)', txt)
    return (m.group(1) if m else '').strip(' =')[:90]

def scan():
    files, fn = [], {}
    for i, f in enumerate(scripts()):
        p = os.path.join(ROOT, f)
        if not os.path.exists(p): continue
        size = os.path.getsize(p)
        info = {'f': f, 'size': size, 'head': '', 'mods': []}
        files.append(info)
        if size > BIG:
            info['head'] = '（データ。読まない）'; continue
        txt = open(p, encoding='utf8').read()
        info['head'] = header(txt); info['mods'] = MOD.findall(txt)
        # 行ごとに、トップレベルに近い定義・上書きを拾う（IIFE の中の内部関数も拾うが、名前で十分に引ける）
        for ln, line in enumerate(txt.split('\n'), 1):
            for m in WRAP.finditer(line):
                fn.setdefault(m.group(1), []).append((f, ln, 'wrap'))
            for m in DEF.finditer(line):
                fn.setdefault(m.group(1), []).append((f, ln, 'def'))
            for m in OVR.finditer(line):
                n = m.group(1)
                if n.startswith('_') or n in ('const', 'let', 'var'): continue
                L = fn.setdefault(n, [])
                if not any(x[0] == f and x[1] == ln for x in L): L.append((f, ln, 'set'))
    return files, fn

def main():
    files, fn = scan()
    if len(sys.argv) > 1:
        for q in sys.argv[1:]:
            L = fn.get(q)
            if not L: print(f'{q}: 見つからない'); continue
            print(f'{q}:  （下ほど後に読み込まれる＝最後が今の動き）')
            for f, ln, k in L: print(f'  {k:4} {f}:{ln}')
        return
    # 2 つ以上のファイルにまたがる関数＝上書きの連鎖
    multi = {n: L for n, L in fn.items() if len({x[0] for x in L}) >= 2 and n not in LOCAL and len(n) > 2}
    out = ['# コード地図（自動生成：`python3 tools/codemap.py`。手で編集しない）', '',
           '読み込み順（index.html）と、各ファイルの役割（先頭のコメント）。**後のファイルほど優先**。', '',
           '| # | ファイル | KB | 役割 | 公開名 |', '|---|---|---|---|---|']
    for i, x in enumerate(files, 1):
        out.append(f"| {i} | `{x['f']}` | {x['size']//1024} | {html.escape(x['head']).replace('|','／')} | {' '.join(x['mods'])} |")
    out += ['', '## 上書きの連鎖（2 ファイル以上で定義・上書きされる関数）', '',
            '最後の行のファイルが今の動きの正本。直すときはまずそこを見る。個別の行番号は `python3 tools/codemap.py 関数名`。', '',
            '| 関数 | 定義 → 上書き（読み込み順） |', '|---|---|']
    order = {x['f']: i for i, x in enumerate(files)}
    for n in sorted(multi, key=lambda n: (-len({x[0] for x in multi[n]}), n)):
        seq = []
        for f, ln, k in sorted(multi[n], key=lambda x: (order.get(x[0], 0), x[1])):
            s = f.replace('js/', '')
            if not seq or seq[-1] != s: seq.append(s)
        out.append(f"| `{n}` | {' → '.join(seq)} |")
    open(os.path.join(ROOT, 'docs', 'CODEMAP.md'), 'w', encoding='utf8').write('\n'.join(out) + '\n')
    print(f'docs/CODEMAP.md: {len(files)} ファイル・上書きの連鎖 {len(multi)} 件')

if __name__ == '__main__':
    main()
