#!/usr/bin/env node
/* 技・モーションのコマ送り（rpg-hero-motion スキルの確認用）。演出ビューア（BXV）で 1 回再生し、一定間隔で戦場を撮って 1 枚に並べる
   使い方：python3 -m http.server 8765 &  →
     node tools/motion_preview.js <キャラ> <技> <出力.png> [--enemy golemkin] [--frames 16] [--step 70] [--scale 1]
   技：SK のキー（koujin など）／atk 通常攻撃／aw 星臨／hit 被弾／down 戦闘不能／idle 待機（再生せずに撮る）
   例：node tools/motion_preview.js rio koujin /tmp/rio_koujin.png */
'use strict';
const {chromium} = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const opt = (k, d) => {const i = args.indexOf(k);if (i < 0) return d;const v = args[i + 1];args.splice(i, 2);return v;};
const URL = opt('--url', 'http://localhost:8765/index.html'), EK = opt('--enemy', 'golemkin'), NF = +opt('--frames', 16), STEP = +opt('--step', 70), SCALE = +opt('--scale', 1);
const [hero, sk, out] = args;if (!out) {console.error('usage: node tools/motion_preview.js <hero> <skill|atk|aw|hit|down|idle> <out.png>');process.exit(2);}
(async () => {
  const b = await chromium.launch();const p = await b.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2*SCALE});
  const errs = [];p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL);await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready, {timeout: 60000});
  await p.evaluate(h => {G = migrate(newGame());G.set = Object.assign(G.set || {}, {tut: false});for (const id of Object.keys(HB)) if (!G.members.includes(id)) newMember(id);
    G.party = [h, ...G.party.filter(x => x !== h)].slice(0, 4);for (const id of G.members) {G.h[id].lv = 60;G.h[id].hp = null;G.h[id].awLv = 3;}document.querySelector('#ov').classList.add('hide');}, hero);
  await p.evaluate(({h, ek}) => {BXV.open({hero: h, ek, n: 1, loop: false});setSpeed(1);}, {h: hero, ek: EK});await p.waitForTimeout(2200);
  const req = sk === 'aw' ? {t: 'aw'} : sk === 'hit' || sk === 'down' ? {t: 'state', v: sk} : {t: 'sk', id: sk};
  if (sk !== 'idle') p.evaluate(r => {BXV.play(r);}, req);
  /* 撮る範囲：行動するキャラと相手（敵）の周り。戦場の絵の位置（論理 px × SC）とキャンバスの画面上の位置から */
  const clip = await p.evaluate(h => {const r = document.querySelector('#cv').getBoundingClientRect(), us = [B.heroes.find(x => x.id === h) || B.heroes[0], B.enemies[0]].filter(Boolean);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;for (const u of us) {const [fx, fy] = V19.foot(u), d = V19.dims(u);x0 = Math.min(x0, (fx - d.w) * SC);x1 = Math.max(x1, (fx + d.w) * SC);y0 = Math.min(y0, (fy - d.h * 1.6) * SC);y1 = Math.max(y1, (fy + 6) * SC);}
    const x = Math.max(0, r.left + x0 - 20), y = Math.max(0, r.top + y0 - 20);return {x, y, width: Math.min(innerWidth - x, x1 - x0 + 40), height: Math.min(innerHeight - y, y1 - y0 + 40)};}, hero);
  const shots = [];for (let i = 0; i < NF; i++) {shots.push((await p.screenshot({clip})).toString('base64'));await p.waitForTimeout(STEP);}
  const url = await p.evaluate(async ({shots, step}) => {const load = u => new Promise(r => {const i = new Image();i.onload = () => r(i);i.src = 'data:image/png;base64,' + u;});
    const ims = [];for (const s of shots) ims.push(await load(s));const w = ims[0].width / 2, h = ims[0].height / 2, cols = Math.max(2, Math.min(6, Math.floor(1600 / w))), c = document.createElement('canvas');
    c.width = w * cols;c.height = h * Math.ceil(ims.length / cols);const g = c.getContext('2d');g.font = 'bold 13px sans-serif';
    ims.forEach((im, i) => {const x = (i % cols) * w, y = Math.floor(i / cols) * h;g.drawImage(im, x, y, w, h);g.fillStyle = '#000a';g.fillRect(x, y, 56, 16);g.fillStyle = '#ffe27a';g.fillText(i * step + 'ms', x + 3, y + 12);});
    return c.toDataURL();}, {shots, step: STEP});
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));console.log('wrote', out, errs.length ? 'errors: ' + errs.slice(0, 3).join(' / ') : '');await b.close();
})();
