// 仲間 12 人の新スプライトをゲーム内で確認：3 組の戦闘（待機・自動戦闘の連続撮影）・決闘（エルナ／ヴァルク）・探索・街
// node tools/verify_heroes.js <outdir> [dpr]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; const dpr = +(process.argv[3] || 2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(process.env.GAME_URL || 'http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  const shot = async (n, w = 400) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/${n}.png` }); };
  const ev = async (js) => { try { return await p.evaluate(js); } catch (e) { errs.push('EVAL ' + e.message.slice(0, 300)); } };
  await ev(`devGame();setSpeed(2);1`);
  const groups = [['rio', 'gald', 'mire', 'shion'], ['noah', 'erna', 'balza', 'crow'], ['hakua', 'jin', 'celes', 'valk']];
  const info = [];
  for (let g = 0; g < groups.length; g++) {
    await ev(`G.party=${JSON.stringify(groups[g])};devBattle([{kind:'wolf',lv:5},{kind:'wolf',lv:5}],'haido',{boss:false});1`);
    await shot(`g${g}_idle`, 2500);
    info.push(await ev(`JSON.stringify(B.heroes.map(h=>[h.id,h.A.name,Math.round(V19.dims(h).h||0)]))`));
    await ev(`document.querySelectorAll('button').forEach(b=>{if(/通常AUTO/.test(b.textContent))b.click();});1`);
    for (let i = 0; i < 10; i++) await shot(`g${g}_auto${i}`, 300);
  }
  await ev(`G.party=['rio','gald','mire','shion'];devBattle([{kind:'ernaE',lv:1}],'haido',{boss:false,event:'erna'});1`); await shot('duel_erna', 2600);
  await ev(`devBattle([{kind:'valkE',lv:1}],'ryuu',{boss:false,event:'valk',theme:'lava'});1`); await shot('duel_valk', 2600);
  await ev(`devBattle([{kind:trialEnemy('crow',2),lv:30}],'haido',{});1`); await shot('trial_crow', 3000);
  await ev(`G.party=['valk','jin','celes','balza'];enterTown('x');1`); await shot('town', 2200);
  console.log(JSON.stringify(info)); console.log('errors', JSON.stringify(errs.slice(0, 12)));
  await b.close();
})();
