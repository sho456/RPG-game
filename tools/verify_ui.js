// 刷新したスプライトの UI 検証：図鑑（敵の詳細・モーション・仲間の詳細）／編成／会話の表情／試練の幻影
// node tools/verify_ui.js <outdir> [dpr]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; const dpr = +(process.argv[3] || 2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const errs = [];
  const page = async () => { const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.goto(process.env.GAME_URL || 'http://localhost:8765/index.html'); await p.waitForTimeout(1300);
    await p.evaluate(`devGame();setSpeed(2);G.zk=G.zk||{e:{}};G.zk.e.wolf=1;G.zk.e.boss9=1;enterTown('x');1`); await p.waitForTimeout(800); return p; };
  const ev = async (p, js) => { try { return await p.evaluate(js); } catch (e) { errs.push('EVAL ' + e.message.slice(0, 200)); } };
  let p = await page();
  await ev(p, `V23.zkDetail('e','wolf');1`); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/zk_wolf.png` });
  await ev(p, `V23.zvPlay?V23.zvPlay('atk'):0;1`); await p.waitForTimeout(450); await p.screenshot({ path: `${out}/zk_wolf_atk.png` });
  await ev(p, `V23.zkDetail('e','boss9');1`); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/zk_boss9.png` });
  await ev(p, `V23.zkDetail('h','rio');1`); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/zk_rio.png` });
  await ev(p, `V23.zvPlay?V23.zvPlay('atk'):0;1`); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/zk_rio_atk.png` });
  await ev(p, `V23.zkDetail('h','rio','art');1`); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/zk_rio_art.png` });
  await p.close();
  p = await page(); await ev(p, `formation();1`); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/formation.png` }); await p.close();
  p = await page();
  const faces = await ev(p, `JSON.stringify({face:face('rio').slice(0,30),art:art('rio').slice(0,30),ex:['n','h','a','s','o'].map(e=>exprFace('rio',e).length)})`);
  await ev(p, `document.body.innerHTML='<div style="background:#223;padding:8px">'+['n','h','a','s','o'].map(e=>'<img src="'+exprFace('rio',e)+'" style="width:132px;image-rendering:pixelated;margin:2px">').join('')+'<br><img src="'+face('rio')+'" style="width:80px;image-rendering:pixelated"><img src="'+face('rio',1)+'" style="width:80px;image-rendering:pixelated"><img src="'+art('rio')+'" style="height:160px;image-rendering:pixelated"><img src="'+art('rio',1)+'" style="height:160px;image-rendering:pixelated"><img src="'+zimg('wolf')+'" style="width:144px;image-rendering:pixelated"><img src="'+zimg('boss9')+'" style="width:144px;image-rendering:pixelated"><img src="'+zimg('boss9',1)+'" style="width:144px;image-rendering:pixelated"></div>';1`);
  await p.waitForTimeout(500); await p.screenshot({ path: `${out}/faces.png` }); await p.close();
  p = await page(); await ev(p, `const k=trialEnemy('rio',2);devBattle([{kind:k,lv:30}],'haido',{});1`); await p.waitForTimeout(3200); await p.screenshot({ path: `${out}/trial.png` });
  await ev(p, `voidKind('wolf');devBattle([{kind:'vo_wolf',lv:30},{kind:'wolf',lv:30}],'haido',{boss:false});1`); await p.waitForTimeout(3000); await p.screenshot({ path: `${out}/void.png` });
  await p.close();
  console.log(faces); console.log('errors', JSON.stringify(errs.slice(0, 12))); await b.close();
})();
