#!/usr/bin/env node
/* 主要画面のスクリーンショット（UI 改修の確認用。少ないトークンで画面を見るための道具）
   使い方：python3 -m http.server 8765 &  →  node tools/ui_shots.js <出力dir> [画面名...]
   画面名：ab-info sk-info party party-sw form form-sel form-list detail detail-ab sk-slot sk-put detail-sk detail-aw detail-bd board board-sel board-up board-up-lock battle-turn battle-cmd battle-pick battle-wk battle-act equip-info equip-pick equip-inv（省略時は全部） */
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
    G.party = ['rio', 'gald', 'celes', 'mire'];for (const id of G.members) {G.h[id].lv = 40;G.h[id].hp = null;}
    document.querySelector('#ov').classList.add('hide');townMenu();});
  const shot = async (n, fn, ms = 600) => {if (!want(n)) return;try {if (!/^form-/.test(n)) await p.evaluate(() => {try {ovClose();} catch (e) {}});await p.evaluate(fn);} catch (e) {errs.push(n + ': ' + e.message.split('\n')[0]);}
    await p.waitForTimeout(ms);
    /* SCROLL=1：#cmd（下の欄）を最後までスクロールした画面も撮る（_2.png） */
    if (process.env.SCROLL) {await p.evaluate(() => {const c = document.querySelector('#cmd');c.scrollTop = 0;});}
    await p.screenshot({path: `${OUT}/${n}.png`, fullPage: !!process.env.FULL});
    if (process.env.SCROLL) {await p.evaluate(() => {const c = document.querySelector('#cmd');c.scrollTop = c.scrollHeight;});await p.waitForTimeout(150);await p.screenshot({path: `${OUT}/${n}_2.png`});}};
  await shot('party', () => partyScreen());
  await shot('party-sw', () => {partyScreen();document.querySelector('.pc41 [data-a="s"]').click();});
  await shot('form-list', () => {V38P.formOpen();document.querySelector('#sheet [data-a="list"]').click();});
  await shot('detail', () => {try {ovClose();} catch (e) {}CTAB = 'st';equipMenu(G.party[0]);});
  await shot('detail-ab', () => {CTAB = 'ab';equipMenu(G.party[0]);});
  for (const t of ['sk', 'aw']) await shot('detail-' + t, `(()=>{const b=[...document.querySelectorAll('#cmd button,#sheet button,#ov button')].find(x=>x.dataset.t==='${t}'||x.dataset.v==='${t}');if(b)b.click();})()`);
  await shot('sk-slot', () => {CTAB = 'sk';equipMenu('rio');document.querySelector('[data-a="rsslot"][data-v="3"]').click();});
  await shot('sk-put', () => {const c = [...document.querySelectorAll('[data-a="rsk"]')];c[c.length - 1].click();});
  await shot('form', () => {partyScreen();V38P.formOpen();});
  await shot('form-sel', () => {document.querySelector('#sheet [data-a="fs"][data-v="0"]').click();});
  await shot('equip-info', () => {const id = 'rio';for (let i = 0; i < 6; i++) G.inv.push(genItem(40, 3, 0, null, 3));const w = genItem(40, 4, 0, 'w', 4);w.who = 'rio';w.unid = false;G.inv.push(w);bestEquip(id);G.h[id].eq.w = w.uid;CTAB = 'st';equipMenu(id);document.querySelector('.cslot [data-eqi="' + w.uid + '"]').click();});
  for (const [n, sl, rar, nm] of [['equip-info-main', 'main', 3, null], ['equip-info-robe', 'main', 2, 'ローブ'], ['equip-info-sub', 'sub', 2, null], ['equip-info-acc', 'acc', 4, null]])
    await shot(n, `(()=>{let it;for(let i=0;i<80;i++){it=genItem(50,${rar},0,'${sl}',${rar});if(!${JSON.stringify(nm)}||it.name.includes(${JSON.stringify(nm)}))break;}it.unid=false;it.sock[0]='ruby';G.inv.push(it);G.h.rio.eq['${sl === 'acc' ? 'acc1' : sl}']=it.uid;CTAB='st';equipMenu('rio');document.querySelector('.cslot [data-eqi="'+it.uid+'"]').click();})()`);
  await shot('detail-res', () => {try {ovClose();} catch (e) {}CTAB = 'st';equipMenu('rio');});
  await shot('equip-pick', () => {for (let i = 0; i < 3; i++) G.inv.push(genItem(40, 1, 0, 'main', 2));pickEq('rio', 'main');});
  await shot('equip-inv', () => {invMenu();});
  await shot('sk-info', () => {CTAB = 'sk';equipMenu('rio');document.querySelector('[data-a="rsinfo"]').click();});
  await shot('ab-info', () => {CTAB = 'ab';equipMenu('rio');document.querySelector('[data-a="rsab"]').click();});
  await shot('board', () => {BS.up = false;openBoard('rio');});
  await shot('board-sel', () => {openBoard('rio');BS.sel = '1,0';boardMenu();});
  await shot('board-up', () => {G.h.rio.lv = 70;openBoard('rio');BS.up = true;BS.sel = '2,-2';boardMenu();});
  await shot('board-up-lock', () => {G.h.rio.lv = 40;openBoard('rio');BS.up = true;BS.sel = null;boardMenu();});
  await shot('battle-turn', () => {try {ovClose();} catch (e) {}auto = false;startBattle([{kind: 'slime', lv: 5}, {kind: 'wolf', lv: 5}], {onEnd: () => {}});}, 2500);
  await shot('battle-cmd', () => {}, 2500);
  await shot('battle-pick', () => {const r = document.querySelectorAll('#cmd .c38l .r')[1];r && r.click();}, 500);
  await shot('battle-wk', () => {const t = B.tgt || aliveE()[0];t.weak.forEach(e => t.known.add(e));t.kR = new Set(['斬', '打'].filter(e => !t.weak.includes(e)));refresh();}, 400);
  await shot('battle-act', () => {auto = true;if (B.res) B.res();}, 2600);
  await b.close();
  if (errs.length) console.log('errors:\n' + errs.join('\n'));
})();
