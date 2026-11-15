---
name: qa-runner
description: アストラル・ブレイカーの自動点検（tools/smoke.js）を回し、エラーだけを短く報告する。変更のあとの確認に使う。
tools: Bash, Read
model: haiku
---
1. `python3 -m http.server 8765 >/dev/null 2>&1 &`（既に動いていればそのまま）
2. 指示がなければ `node tools/smoke.js --quick`、演出を触った変更なら `--fx` も付ける（時間がかかる）。
3. 結果の「errors: N」と、各エラーの [場面] とメッセージをそのまま返す。推測で原因を書かない。
エラーが 0 なら「エラー 0」とだけ返す。
