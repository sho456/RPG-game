// 戦闘の振り付けで使うキーポーズを新スプライトで描かせて一覧にする（フレームの選ばれ方・ずれ・傾きの確認）
// node tools/pose_sheet.js <out.png> [仲間のID,カンマ区切り（省略時はリオ＋狼＋竜）]　AW=1 で星臨の姿
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  if (process.env.AW) await p.addInitScript('window.__AW=1');
  if (process.argv[3]) await p.addInitScript(`window.__HEROES=${JSON.stringify(process.argv[3])}`);
  await p.goto(process.env.GAME_URL || 'http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    devGame();
    const W19 = V19, H = ANIM.HST, SW = W19.WP.sword;
    const RUN = { ta: .3, cr: 2, fF: [-6, 2.5], fN: [6.5, 0], hF: [2, 4], hN: [4, 4], sw: 2.5 };
    const heroPoses = [['待機', {}], ['呼吸', { br: 1 }], ['走り', RUN], ['振りかぶり1', SW.seq[0].w], ['斬撃1', SW.seq[0].h], ['振りかぶり2', SW.seq[1].w], ['斬撃2', SW.seq[1].h],
      ['突き', SW.seq[2].h], ['大技構え', SW.H.w], ['大技', SW.H.h], ['詠唱', W19.CAST._.a], ['発動', W19.CAST._.b], ['勝利a', W19.VIC.a], ['勝利b', W19.VIC.b], ['星臨', W19.AWK],
      ['被弾', H.hit], ['防御', H.guard], ['瀕死', H.low], ['戦闘不能', H.dead(RIG.rio)]];
    const MA = W19.MA.wolf, MS = ANIM.MST.wolf;
    const monPoses = [['待機', {}], ['呼吸', { br: 1 }], ['爪:構え', MA.atk.w], ['爪:攻撃', MA.atk.h], ['噛:構え', MA.bite.w], ['噛:攻撃', MA.bite.h], ['術:構え', MA.cast.w], ['術:発動', MA.cast.h], ['ブレイク', MS.brk], ['溜め', MS.chg], ['被弾', MS.hit]];
    const out = [];
    const draw = (u, list, tag) => { const A = ANIM.setup(u); for (const [n, ps] of list) { const pose = Object.assign(ANIM.base(A), ps); const f = SPRX.frame(A.name, pose, A.palKey, A.pal, A.flip, A.sc, A.extra);
      const c = document.createElement('canvas'); c.width = 260; c.height = 170; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#3a4634'; g.fillRect(0, 0, 260, 170);
      g.fillStyle = '#ff5050'; g.fillRect(0, 150, 260, 1); g.fillRect(130, 145, 1, 10);
      if (f) g.drawImage(f.cv, 130 - f.ax, 150 - f.ay); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(tag + ' ' + n + (A.rig.spx && A.rig.type === 'hum' ? ' → ' + SPX.heroFrame(pose) : ''), 4, 14);
      out.push(c.toDataURL()); } };
    const HS = (window.__HEROES || 'rio').split(',');
    for (const h of HS) draw({ id: h, side: 0, spr: h, sc: 2, x: 0, y: 0, alive: true, aw: !!window.__AW }, heroPoses, h + (window.__AW ? '(星臨)' : ''));
    if (window.__HEROES) return out;
    draw({ kind: 'wolf', side: 1, spr: 'wolf', sc: 2, x: 0, y: 0, alive: true }, monPoses, '狼');
    draw({ kind: 'boss9', side: 1, spr: 'boss9', sc: 3, boss: true, x: 0, y: 0, alive: true }, monPoses.slice(0, 4).concat(monPoses.slice(8)), '竜');
    return out;
  });
  const html = '<body style="margin:0;background:#111;width:1580px">' + res.map(u => `<img src="${u}" style="width:260px;height:170px;image-rendering:pixelated;margin:1px">`).join('') + '</body>';
  await p.setViewportSize({ width: 1580, height: 900 }); await p.setContent(html); await p.waitForTimeout(400);
  await p.screenshot({ path: out, fullPage: true }); console.log('frames', res.length, 'errors', errs.slice(0, 5)); await b.close();
})();
