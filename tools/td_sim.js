#!/usr/bin/env node
/* TD のバランス計測：ブラウザでゲームを読み込み、自動の配置（TDS.bot）で各ステージを何度も戦わせて、勝率・灯火の残り・時間・星を表にする。
   使い方：python3 -m http.server 8765 &  →  node tools/td_sim.js [--n 40] [--lv 1,4,8] [--stage td0_1,td0_4] [--deck rio,gald,mire,celes]
   画面は描かない（シミュレーションだけ）。目安：推奨 Lv で勝率 60〜90%、推奨 Lv+4 で 95% 以上、推奨 Lv−3 で 50% 未満 */
'use strict';
const {chromium} = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => {const i = args.indexOf(k);return i >= 0 ? args[i + 1] : d;};
const URL = opt('--url', process.env.URL || 'http://localhost:8765/index.html');
const N = +opt('--n', 40), LVS = opt('--lv', ''), STG = opt('--stage', ''), DECK = opt('--deck', '');
(async () => {
  const b = await chromium.launch();const p = await b.newPage();const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await p.goto(URL);await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready && typeof TDS !== 'undefined', {timeout: 60000});
  const rows = await p.evaluate(({N, LVS, STG, DECK}) => {
    const out = [], stages = STG ? STG.split(',') : TDD.ORDER, deck = DECK ? DECK.split(',') : Object.keys(TDD.HERO).slice(0, 8);
    for (const id of stages) {const S = TDD.STAGE[id], lvs = LVS ? LVS.split(',').map(Number) : [Math.max(1, S.lv - 3), S.lv, S.lv + 4];
      for (const lv of lvs) {const L = {};for (const h of deck) L[h] = lv;let w = 0, lives = 0, t = 0, st3 = 0;const t0 = performance.now();
        for (let s = 1; s <= N; s++) {const r = TDS.run(id, deck, L, s * 7919);if (r.win) {w++;lives += r.lives;t += r.t;st3 += r.stars.reduce((a, b) => a + b, 0);}}
        out.push({stage: id, lv, win: Math.round(w / N * 100) + '%', lives: w ? (lives / w).toFixed(1) : '-', sec: w ? Math.round(t / w) : '-', stars: w ? (st3 / w).toFixed(1) : '-', ms: Math.round((performance.now() - t0) / N)});}}
    return out;}, {N, LVS, STG, DECK});
  console.log('ステージ  Lv  勝率  灯火  秒  星  1戦ms');
  for (const r of rows) console.log(`${r.stage}  ${String(r.lv).padStart(2)}  ${r.win.padStart(4)}  ${String(r.lives).padStart(4)}  ${String(r.sec).padStart(3)}  ${r.stars}  ${r.ms}`);
  if (errs.length) {console.log('エラー:', errs.join('\n'));process.exitCode = 1;}
  await b.close();})();
