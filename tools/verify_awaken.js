// 星臨（覚醒）の姿の確認：3 組の戦闘で全員を星臨状態にして待機・自動戦闘を撮影、星臨の演出（カットイン）、全キーポーズ一覧
// node tools/verify_awaken.js <outdir> [dpr]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; const dpr = +(process.argv[3] || 2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(process.env.GAME_URL || 'http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  const shot = async (n, w = 400) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/${n}.png` }); };
  const ev = async (js) => { try { return await p.evaluate(js); } catch (e) { errs.push('EVAL ' + e.message.slice(0, 300)); } };
  await ev(`devGame();setSpeed(2);1`);
  const groups = [['gald', 'mire', 'shion', 'noah'], ['erna', 'balza', 'crow', 'hakua'], ['jin', 'celes', 'valk', 'rio']];
  for (let g = 0; g < groups.length; g++) {
    await ev(`G.party=${JSON.stringify(groups[g])};devBattle([{kind:'wolf',lv:5},{kind:'wolf',lv:5}],'haido',{boss:false});1`);
    await p.waitForTimeout(2200);
    if (g === 0) { await ev(`awaken(B.heroes[0]);1`); for (let i = 0; i < 4; i++) await shot(`cut${i}`, 250); await p.waitForTimeout(2500); }
    await ev(`B.heroes.forEach(h=>{h.aw=true;h.A=null;});1`); await shot(`aw${g}_idle`, 900);
    await ev(`document.querySelectorAll('button').forEach(b=>{if(/通常AUTO/.test(b.textContent))b.click();});1`);
    for (let i = 0; i < 8; i++) await shot(`aw${g}_auto${i}`, 300);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 12))); await b.close();
})();
