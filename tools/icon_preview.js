#!/usr/bin/env node
/* 装備アイコンの見本帳（rpg-equipment-icon スキルの確認用）
   使い方：python3 -m http.server 8765 &  →  node tools/icon_preview.js <出力.png> [キー or 前方一致…] [--scale 4] [--url ...]
   例：node tools/icon_preview.js /tmp/swords.png sword_ dagger_   （剣と短剣の 4 段階 × レアリティ 0〜4）
       node tools/icon_preview.js /tmp/all.png                       （全部）
   行＝デザインのキー（IC36.DES）、列＝レアリティ 0〜4（3 以上は縁の光・4 は大きなきらめき）。最後の列は実寸（32px） */
'use strict';
const {chromium} = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const opt = (k, d) => {const i = args.indexOf(k);if (i < 0) return d;const v = args[i + 1];args.splice(i, 2);return v;};
const URL = opt('--url', 'http://localhost:8765/index.html'), SCALE = +opt('--scale', 4);
const out = args.shift();if (!out) {console.error('usage: node tools/icon_preview.js <out.png> [keys...]');process.exit(2);}
(async () => {
  const b = await chromium.launch();const p = await b.newPage();
  await p.goto(URL);await p.waitForFunction(() => typeof IC36 !== 'undefined', {timeout: 60000});
  const url = await p.evaluate(async ({want, S}) => {
    const all = IC36.keys().sort(), keys = want.length ? all.filter(k => want.some(w => k === w || k.startsWith(w))) : all;
    const N = IC36.N, cw = N * S + 8, lw = 150, c = document.createElement('canvas');c.width = lw + cw * 5 + N + 16;c.height = keys.length * (N * S + 8) + 24;
    const g = c.getContext('2d');g.fillStyle = '#10131f';g.fillRect(0, 0, c.width, c.height);g.imageSmoothingEnabled = false;g.font = '12px sans-serif';
    g.fillStyle = '#9aa4c8';for (let r = 0; r <= 4; r++) g.fillText('rar ' + r, lw + r * cw + 4, 15);
    const load = u => new Promise(res => {const i = new Image();i.onload = () => res(i);i.src = u;});
    for (let i = 0; i < keys.length; i++) {const y = 22 + i * (N * S + 8);g.fillStyle = '#e6e8f8';g.fillText(keys[i], 6, y + N * S / 2);
      for (let r = 0; r <= 4; r++) {const im = await load(IC36.render(keys[i], r));g.fillStyle = (i + r) % 2 ? '#1a2036' : '#161b2e';g.fillRect(lw + r * cw, y, N * S, N * S);g.drawImage(im, lw + r * cw, y, N * S, N * S);
        if (r === 2) g.drawImage(im, lw + cw * 5 + 4, y + (N * S - N) / 2);}}
    return c.toDataURL();}, {want: args, S: SCALE});
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));console.log('wrote', out);await b.close();
})();
