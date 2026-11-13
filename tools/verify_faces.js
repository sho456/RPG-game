// 仲間全員の顔グラ（face 20・会話の表情 22・portrait 48）と立ち絵（art）、星臨の配色を 1 枚に並べる
// node tools/verify_faces.js <out.png>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1700 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(process.env.GAME_URL || 'http://localhost:8765/index.html'); await p.waitForTimeout(1600);
  await p.evaluate(() => { devGame(); const ids = ['rio', 'gald', 'mire', 'shion', 'noah', 'erna', 'balza', 'crow', 'hakua', 'jin', 'celes', 'valk'];
    const px = 'image-rendering:pixelated;margin:2px;vertical-align:bottom';
    document.body.innerHTML = '<div style="background:#223;padding:6px;font:12px sans-serif;color:#fff">' + ids.map(id => {
      const pc = portrait(id, '', 48); const pa = portrait(id, JSON.stringify({ aw: 1 }), 48);
      return `<div>${id} <img src="${face(id)}" style="width:60px;${px}"><img src="${exprFace(id, 'n')}" style="width:66px;${px}"><img src="${exprFace(id, 'h')}" style="width:66px;${px}">` +
        `<img src="${pc.toDataURL()}" style="width:96px;${px}"><img src="${pa.toDataURL()}" style="width:96px;${px}"><img src="${art(id)}" style="height:120px;${px}"><img src="${art(id, 1)}" style="height:120px;${px}"><img src="${zimg(id)}" style="width:72px;${px}"></div>`; }).join('') + '</div>'; });
  await p.waitForTimeout(600); await p.screenshot({ path: process.argv[2], fullPage: true }); console.log('errors', JSON.stringify(errs)); await b.close();
})();
