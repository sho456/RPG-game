#!/usr/bin/env node
/* TD のバランス計測：ブラウザでゲームを読み込み、自動の配置（TDS.bot）で各ステージを何度も戦わせて、勝率・灯火の残り・時間・星を表にする。
   使い方：python3 -m http.server 8765 &  →  node tools/td_sim.js [--n 40] [--lv 1,4,8] [--stage td0_1,td0_4] [--deck rio,gald,mire,celes]
   合わせ込み：node tools/td_sim.js --tune 4.5 [--n 16]  → 推奨 Lv で灯火が平均 4.5 残る敵の HP 倍率をステージごとに出す。ボスのいるステージはボスの倍率 bk（雑魚は今の hk のまま）、いないステージは雑魚の倍率 hk（stages.js に書く）
   手札は既定でそのステージの時点の仲間（TDD.rosterAt）。画面は描かない（シミュレーションだけ）。目安：推奨 Lv で勝率 60〜90%、推奨 Lv+4 で 95% 以上、推奨 Lv−3 で 50% 未満 */
'use strict';
const {chromium} = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => {const i = args.indexOf(k);return i >= 0 ? args[i + 1] : d;};
const URL = opt('--url', process.env.URL || 'http://localhost:8765/index.html');
const N = +opt('--n', 40), LVS = opt('--lv', ''), STG = opt('--stage', ''), DECK = opt('--deck', ''), TUNE = args.includes('--tune') ? +(opt('--tune', '4.5')) || 4.5 : 0;
(async () => {
  const b = await chromium.launch();const p = await b.newPage();const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await p.goto(URL);await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready && typeof TDS !== 'undefined', {timeout: 60000});
  if (TUNE) {/* --tune [灯火の目標]：推奨 Lv で灯火の平均がこの値に近づく敵の HP 倍率 hk を二分探索で探す（勝てない戦は灯火 0 として数える） */
    const res = await p.evaluate(({N, STG, TUNE}) => {const out = [];for (const id of (STG ? STG.split(',') : TDD.ORDER)) {const S = TDD.STAGE[id], deck = TDD.rosterAt(id).slice(0, 8), L = {};deck.forEach(h => L[h] = S.lv);
      const isB = S.waves.some(w => w.e.some(e => {const f = TDD.foe(e[1], 1);return f && f.boss;}));
      const sc = (K, v) => {S[K] = v;let lv = 0, w = 0;for (let s = 1; s <= N; s++) {const r = TDS.run(id, deck, L, s * 7919);lv += r.win ? r.lives : 0;w += r.win ? 1 : 0;}return [lv / N, w / N];};
      const find = (K, goal) => {let lo = .05, hi = 4;for (let i = 0; i < 9; i++) {const m = (lo + hi) / 2;if (sc(K, m)[0] > goal) lo = m;else hi = m;}return +((lo + hi) / 2).toFixed(2);};
      /* ボスのいるステージ：ボスを軽く（0.2）して雑魚の hk を「目標 +1.5」に合わせ、そのあと bk を目標に合わせる */
      let res = '';if (isB) {S.bk = .2;S.hk = find('hk', TUNE + 1.5);S.bk = find('bk', TUNE);res = 'hk ' + S.hk + ' bk ' + S.bk;} else {S.hk = find('hk', TUNE);res = 'hk ' + S.hk;}
      const [lv, w] = sc('_', 0);out.push({id, hk: res, lives: lv.toFixed(1), win: Math.round(w * 100) + '%'});}return out;}, {N, STG, TUNE});
    console.log('ステージ  hk（敵の HP 倍率）  灯火  勝率');for (const r of res) console.log(`${r.id}  ${r.hk}  ${r.lives}  ${r.win}`);await b.close();return;}
  const rows = await p.evaluate(({N, LVS, STG, DECK}) => {
    const out = [], stages = STG ? STG.split(',') : TDD.ORDER;
    for (const id of stages) {const deck = DECK ? DECK.split(',') : TDD.rosterAt(id).slice(0, 8);const S = TDD.STAGE[id], lvs = LVS ? LVS.split(',').map(Number) : [Math.max(1, S.lv - 3), S.lv, S.lv + 4];
      for (const lv of lvs) {const L = {};for (const h of deck) L[h] = lv;let w = 0, lives = 0, t = 0, st3 = 0;const t0 = performance.now();
        for (let s = 1; s <= N; s++) {const r = TDS.run(id, deck, L, s * 7919);if (r.win) {w++;lives += r.lives;t += r.t;st3 += r.stars.reduce((a, b) => a + b, 0);}}
        out.push({stage: id, n: deck.length, lv, win: Math.round(w / N * 100) + '%', lives: w ? (lives / w).toFixed(1) : '-', sec: w ? Math.round(t / w) : '-', stars: w ? (st3 / w).toFixed(1) : '-', ms: Math.round((performance.now() - t0) / N)});}}
    return out;}, {N, LVS, STG, DECK});
  console.log('ステージ 人数 Lv  勝率  灯火  秒  星  1戦ms');
  for (const r of rows) console.log(`${r.stage}  ${r.n}  ${String(r.lv).padStart(2)}  ${r.win.padStart(4)}  ${String(r.lives).padStart(4)}  ${String(r.sec).padStart(3)}  ${r.stars}  ${r.ms}`);
  if (errs.length) {console.log('エラー:', errs.join('\n'));process.exitCode = 1;}
  await b.close();})();
