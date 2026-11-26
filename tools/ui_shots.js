#!/usr/bin/env node
/* 主要画面のスクリーンショット（UI 改修の確認用。少ないトークンで画面を見るための道具）
   使い方：python3 -m http.server 8765 &  →  node tools/ui_shots.js <出力dir> [画面名...]（別のポートなら URL=http://localhost:ポート/index.html）
   画面名：home home-sheet td-map td-prep cb-battle unit unit-detail unit-sheet board board-sel board-up board-up-lock
           equip-info smith smith-op smith-sock growth inv appraise zukan
   ver0.53：旧コマンド戦闘の画面（battle-*・party・form・detail 系）は削除した。 */
'use strict';
const {chromium} = require('playwright');
const [OUT = 'work/shots', ...only] = process.argv.slice(2);
require('fs').mkdirSync(OUT, {recursive: true});
const want = n => !only.length || only.includes(n);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 420, height: 860}});
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  p.on('console', m => {if (m.type() === 'error') errs.push(m.text().slice(0, 200));});
  await p.goto(process.env.URL || 'http://localhost:8765/index.html');
  await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready, {timeout: 60000});
  await p.evaluate(() => {G = migrate(newGame());G.set = Object.assign(G.set || {}, {tut: false});
    for (const id of Object.keys(HB)) if (!G.members.includes(id)) newMember(id);
    for (const id of G.members) {G.h[id].lv = 40;G.h[id].hp = null;}
    G.td = G.td || {c: {}};G.td.c = G.td.c || {};G.td.v = 1;for (const id of TDD.ORDER) G.td.c[id] = 1;G.xpStock = 99999;
    for (let i = 0; i < 8; i++) G.inv.push(genItem(40, 1 + (i % 4), 0, null, 2 + (i % 3)));
    document.querySelector('#ov').classList.add('hide');townMenu();});
  const HOME = () => {try {ovClose();} catch (e) {}try {CB.hide();} catch (e) {}for (const s of ['#unit', '#tdm', '#grow', '#zk', '#fac']) {const u = document.querySelector(s);u && u.classList.add('hide');}townMenu();};
  const shot = async (n, fn, ms = 600) => {if (!want(n)) return;try {await p.evaluate(HOME);await p.evaluate(fn);} catch (e) {errs.push(n + ': ' + String(e.message).split('\n')[0]);}
    await p.waitForTimeout(ms);
    /* SCROLL=1：スクロールする欄（#unit・#tdm）を最後までスクロールした画面も撮る（_2.png） */
    await p.screenshot({path: `${OUT}/${n}.png`, fullPage: !!process.env.FULL});
    if (process.env.SCROLL) {await p.evaluate(() => {for (const s of ['#unit', '#tdm', '#cmd']) {const c = document.querySelector(s);if (c) c.scrollTop = c.scrollHeight;}});await p.waitForTimeout(150);await p.screenshot({path: `${OUT}/${n}_2.png`});}};
  await shot('home', () => {});
  await shot('home-sheet', () => document.querySelector('[data-hm="sheet"]').click(), 300);
  await shot('td-map', () => TDM.map());
  await shot('td-prep', () => TDM.prep(TDD.ORDER[0]));
  await shot('cb-battle', () => {TDM.prep(TDD.ORDER[0]);document.querySelector('#tdm [data-a="go"]').click();}, 500);
  if (want('cb-battle')) {await p.evaluate(() => {for (let i = 0; i < 30; i++) {const k = document.querySelector('#tdm .tdm-talk .skip');if (!k) break;k.click();}});await p.waitForTimeout(3000);await p.screenshot({path: `${OUT}/cb-battle.png`});}
  await shot('unit', () => UNIT.open());
  await shot('unit-detail', () => UNIT.open('rio'));
  await shot('unit-sheet', () => {UNIT.open('rio');document.querySelector('#unit [data-a="slot"][data-v="w"]').click();});
  await shot('board', () => {BS.up = false;openBoard('rio');});
  await shot('board-sel', () => {openBoard('rio');BS.sel = '1,0';boardMenu();});
  await shot('board-up', () => {G.h.rio.lv = 70;openBoard('rio');BS.up = true;BS.sel = '2,-2';boardMenu();});
  await shot('board-up-lock', () => {G.h.rio.lv = 40;openBoard('rio');BS.up = true;BS.sel = null;boardMenu();});
  await shot('equip-info', () => {const it = G.inv[0];it.unid = false;const b = document.createElement('button');b.dataset.eqi = it.uid;document.body.appendChild(b);b.click();b.remove();});
  await shot('smith', () => smith());
  await shot('growth', () => tavern());
  await shot('inv', () => invMenu());
  await shot('appraise', () => appraise());
  await shot('smith-op', () => {G.fac.smith = 3;smith();document.querySelector('#fac [data-v="op"]').click();document.querySelector('#fac .fc-t').click();document.querySelector('#fac [data-a="do"]').click();});
  await shot('smith-sock', () => {G.fac.smith = 3;smith();document.querySelector('#fac [data-v="sock"]').click();document.querySelector('#fac .fc-t').click();document.querySelector('#fac [data-a="do"]').click();});
  await shot('zukan', () => zkMenu());
  await b.close();
  if (errs.length) console.log('errors:\n' + errs.join('\n'));
})();
