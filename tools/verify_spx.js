// 刷新したスプライトのゲーム内検証：戦闘（待機・自動戦闘中の連続撮影）・ボス戦・探索・街・図鑑・編成・会話の顔
// node tools/verify_spx.js <outdir> [dpr]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; const dpr = +(process.argv[3] || 2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(process.env.GAME_URL || 'http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  const shot = async (n, w = 400) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/${n}.png` }); };
  const ev = async (js) => { try { return await p.evaluate(js); } catch (e) { errs.push('EVAL ' + e.message.slice(0, 300)); } };
  await ev(`devGame();setSpeed(2);G.party=['rio','gald','mire','shion'];devBattle([{kind:'wolf',lv:5},{kind:'wolf',lv:5}],'haido',{boss:false});1`);
  await shot('b_idle', 2500);
  const info = await ev(`JSON.stringify({ready:SPX.ready,heroes:B.heroes.map(h=>({n:h.A.name,k:h._k25,D:V19.dims(h)})),wolf:B.enemies.map(e=>({n:e.A.name,D:V19.dims(e)}))})`);
  // 自動戦闘を連続撮影（攻撃・被弾・撃破の各コマ）
  await ev(`(document.querySelector('#autoB')||{click(){}}).click();document.querySelectorAll('button').forEach(b=>{if(/通常AUTO/.test(b.textContent))b.click();});1`);
  for (let i = 0; i < 14; i++) await shot('b_auto' + String(i).padStart(2, '0'), 260);
  await ev(`devBattle([{kind:'boss9',lv:68}],'ryuu',{theme:'lava'});1`); await shot('boss_idle', 3200);
  await ev(`document.querySelectorAll('button').forEach(b=>{if(/通常AUTO/.test(b.textContent))b.click();});1`);
  for (let i = 0; i < 12; i++) await shot('boss_auto' + String(i).padStart(2, '0'), 300);
  await ev(`devBattle([{kind:trialEnemy('rio',2),lv:30}],'haido',{});1`); await shot('trial', 3200);
  await ev(`enterField('haido');1`); await shot('field', 2200);
  await ev(`enterTown('x');1`); await shot('town', 2200);
  await ev(`try{zkMenu();}catch(e){}1`); await shot('zukan', 1200);
  const z = await ev(`try{V23.openDetail?V23.openDetail('e','wolf'):null}catch(e){String(e)}`);
  await ev(`try{formation()}catch(e){}1`); await shot('formation', 1200);
  console.log(JSON.stringify({ info, z })); console.log('errors', JSON.stringify(errs.slice(0, 12)));
  await b.close();
})();
