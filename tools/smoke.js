#!/usr/bin/env node
/* ゲーム全体の自動点検（ブラウザで画面を巡回し、JavaScript のエラーを集める）。ver0.53：旧コマンド戦闘の削除に合わせて TD 向けに書き換え
   使い方：python3 -m http.server 8765 &   →   node tools/smoke.js [--url http://localhost:8765/index.html] [--shots <dir>] [--quick] [--fx]
   ・巡回：①タイトル → ホーム ②ホームの各ボタン（≡ の各項目・防衛・仲間・強化・鍛冶）を開いて閉じる（開いた画面のボタンも 1 つずつ押す）
           ③ TDD.ORDER の全ステージを CBE.run で 1 回ずつ（コマンド戦闘の AUTO） ④各章の最初のステージを 出撃準備（TDM.prep）→ 出撃 → 数秒進める
           ⑤仲間画面で Lv 上げ・練達・装備の付け替え・星盤 ⑥図鑑（敵・仲間・装備の一覧と詳細・3 形態）
   ・--quick：短い版（④は最初の 2 章・⑤は 3 人・⑥は敵 8 種・押すボタンは画面ごとに 12 個まで）
   ・--fx：TD の戦闘を ×2 の速さで最後まで進める（自動の配置。戦闘画面の描画・結果の窓のエラーを拾う。終わらなければ失敗）
   ・結果：エラーの一覧（場面・メッセージ）。1 件でもあれば終了コード 1
   Playwright は環境に入っているものを使う（require('playwright')） */
'use strict';
const {chromium} = require('playwright');
const args = process.argv.slice(2);
const opt = k => {const i = args.indexOf(k);return i >= 0 ? args[i + 1] : null;};
const URL = opt('--url') || 'http://localhost:8765/index.html';
const SHOTS = opt('--shots');
const QUICK = args.includes('--quick');
const FX = args.includes('--fx');
const COV = opt('--cov'); /* --cov <out.json>：巡回中に一度も呼ばれなかった名前つき関数を集める（旧コード整理の候補探し。tools/deadcode.py で読む） */
const fs = require('fs');
if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 420, height: 860}, deviceScaleFactor: 1});
  const errs = [];let scene = 'load';
  p.on('pageerror', e => errs.push([scene, String(e.message).slice(0, 300)]));
  p.on('console', m => {if (m.type() === 'error') errs.push([scene, m.text().slice(0, 300)]);});
  p.on('response', r => {if (r.status() >= 400) errs.push([scene, '読み込み失敗 ' + r.status() + ' ' + r.url()]);});
  const shot = async n => {if (SHOTS) await p.screenshot({path: `${SHOTS}/${n}.png`});};
  const step = async (name, fn, ms = 250) => {scene = name;try {await p.evaluate(fn);} catch (e) {errs.push([name, 'evaluate: ' + String(e.message).split('\n')[0]]);}await p.waitForTimeout(ms);
    /* 画面の横はみ出し（スマホで横スクロールが出る） */
    try {const o = await p.evaluate(() => {const d = document.documentElement;return d.scrollWidth > innerWidth + 1 ? d.scrollWidth : 0;});if (o) errs.push([name, '横はみ出し: 幅 ' + o + 'px（画面 420px）']);} catch (e) {}};
  /* 開いている画面を全部閉じてホームへ */
  const HOME = `(()=>{try{ovClose();}catch(e){}try{const u=document.querySelector('#unit');if(u&&!u.classList.contains('hide'))u.classList.add('hide');}catch(e){}
    try{CB.hide();}catch(e){}try{const t=document.querySelector('#tdm');if(t)t.classList.add('hide');}catch(e){}townMenu();})()`;

  if (COV) await p.coverage.startJSCoverage({resetOnNavigation: false});
  await p.goto(URL);
  await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready && typeof CBE !== 'undefined', {timeout: 60000});
  await shot('00_title');
  /* ① タイトル → ホーム（タップで始める）。全員加入・全ステージ開放の状態を作る */
  await step('title-tap', () => {try {titleTap();} catch (e) {}}, 600);
  await step('setup', () => {
    G = migrate(newGame());G.set = Object.assign(G.set || {}, {tut: false});
    for (const id of Object.keys(HB)) if (!G.members.includes(id)) newMember(id);
    for (const id of G.members) {G.h[id].lv = 40;G.h[id].hp = null;}
    G.td = G.td || {c: {}};G.td.c = G.td.c || {};G.td.v = 1;for (const id of TDD.ORDER) G.td.c[id] = 1;G.xpStock = 99999;G.gold = 99999;
    for (let i = 0; i < 12; i++) G.inv.push(genItem(40, 1 + (i % 4), 0, null, 2 + (i % 3)));
    G.zk = {e: {}, i: {}};try {zkEnemies().forEach(k => G.zk.e[k] = 1);} catch (e) {}
    document.querySelector('#ov').classList.add('hide');townMenu();
  }, 800);
  await shot('01_home');

  /* ② ホームの各ボタン：≡ のシート・防衛（地図）・仲間・強化・鍛冶 を開いて閉じる。開いた画面のボタンも 1 つずつ押す */
  await step('home-sheet', `(()=>{const b=document.querySelector('[data-hm="sheet"]');b&&b.click();})()`, 300);await shot('02_sheet');
  const sheetItems = await p.$$eval('#labels .hm-sheet [data-h22]', bs => bs.map(x => x.dataset.h22));
  const screens = [];
  for (const g of sheetItems) screens.push(['h22-' + g, `(()=>{const b=document.querySelector('#labels [data-h22="${g}"]');b&&b.click();})()`]);
  screens.push(['hm-map', `(()=>{const b=document.querySelector('[data-hm="map"]');b&&b.click();})()`]);
  screens.push(['hm-unit', `(()=>{const b=document.querySelector('[data-hm="unit"]');b&&b.click();})()`]);
  for (const g of ['tavern', 'smith']) screens.push(['h22-' + g, `(()=>{const b=document.querySelector('#labels [data-h22="${g}"]');b&&b.click();})()`]);
  screens.push(['hm-prep', `(()=>{const b=document.querySelector('[data-hm="prep"]');b&&b.click();})()`]);
  screens.push(['board', `openBoard('rio')`]);
  const KEYS = QUICK ? 12 : 40;
  for (const [name, open] of screens) {
    await step('home-back', HOME, 350);
    await step(name, open, 600);await shot('03_' + name.replace(/[^\w-]/g, '_'));
    /* 開いた画面の [data-a] ボタンを 1 つずつ押す（毎回ホームから開き直す） */
    const sel = '#cmd [data-a],#ov [data-a],#sheet [data-a],#tdm [data-a],#unit [data-a]';
    const keys = await p.evaluate(sel => [...new Set([...document.querySelectorAll(sel)].filter(x => x.offsetParent).map(x => x.dataset.a + '|' + (x.dataset.v || '')))].slice(0, 60), sel).catch(() => []);
    let n = 0;
    for (const key of keys) {
      if (n >= KEYS) break;
      const [a, v] = key.split('|');
      if (name === 'hm-prep' && a === 'go') continue;/* 出撃は ④ で回す */
      n++;
      await step(`${name}:${a}${v ? '=' + v : ''}`, `(()=>{${HOME};${open};const b=[...document.querySelectorAll('${sel}')].find(x=>x.dataset.a==='${a}'&&(x.dataset.v||'')==='${v}');if(b&&!b.disabled)b.click();})()`, 160);
    }
  }
  await step('home-back', HOME, 400);

  /* ③ 全ステージをコマンド戦闘の AUTO で 1 回ずつ（画面なし・CBE.run） */
  scene = 'cb-run';
  const runs = await p.evaluate(() => {
    const out = [];
    for (const id of [...TDD.ORDER, TDD.INF].filter(Boolean)) {
      try {const S = TDD.STAGE[id], party = TDD.rosterAt(id).slice(0, 4);party.forEach(h => {G.h[h].lv = S.inf ? 50 : S.lv;G.h[h].hp = null;});
        const r = CBE.run(id, party, 7919);out.push([id, !!r.win, r.turn | 0, null]);}
      catch (e) {out.push([id, false, 0, String(e.stack || e.message).slice(0, 200)]);}
    }
    for (const h of G.members) G.h[h].lv = 40;return out;
  });
  for (const [id, , , err] of runs) if (err) errs.push(['cb-run:' + id, err]);
  console.log(`CBE.run: ${runs.length} ステージ（勝ち ${runs.filter(r => r[1]).length}）`);

  /* ④ 各章の最初のステージ：出撃準備 → 出撃（会話はとばす）→ 数秒 → 戻る */
  const firsts = await p.evaluate(() => TDD.CH.filter(c => c.st && c.st.length && !c.soon).map(c => c.st[0]));
  for (const id of (QUICK ? firsts.slice(0, 2) : firsts)) {
    await step('td-prep:' + id, `TDM.prep('${id}')`, 500);await shot('04_prep_' + id);
    await step('td-go:' + id, `(()=>{const b=document.querySelector('#tdm [data-a="go"]');b&&b.click();})()`, 400);
    await step('td-talk:' + id, `(()=>{for(let i=0;i<30;i++){const k=document.querySelector('#tdm .tdm-talk .skip');if(!k)break;k.click();}})()`, 400);
    await step('cb-cmd:' + id, `(()=>{for(let i=0;i<4;i++){const b=[...document.querySelectorAll('#cb .cb-sk:not(.off)')];if(!b.length)break;b[b.length-1].click();}})()`, QUICK ? 3000 : 5000);
    await shot('05_cb_' + id);
    await step('cb-menu:' + id, `(()=>{const m=document.querySelector('#cb [data-a="menu"]');m&&m.click();const r=document.querySelector('#cb [data-a="resume"]');r&&r.click();})()`, 300);
    await step('cb-end:' + id, `(()=>{CB.hide();TDM.map();})()`, 400);
  }
  await step('home-back', HOME, 400);

  /* ⑤ 仲間画面：Lv 上げ・練達・装備の付け替え・星盤 */
  const ids = await p.evaluate(() => (G.members || []).filter(h => TDD.HERO[h]));
  for (const id of (QUICK ? ids.slice(0, 3) : ids)) {
    await step('unit-open:' + id, `UNIT.open('${id}')`, 350);await shot('06_unit_' + id);
    await step('unit-lv:' + id, `(()=>{for(const v of ['1','9999']){const b=document.querySelector('#unit [data-a="lv"][data-v="'+v+'"]');b&&b.click();}const m=document.querySelector('#unit [data-a="mas"]');m&&m.click();})()`, 250);
    for (const sl of ['w', 'main', 'sub', 'acc1', 'acc2']) {
      await step(`unit-eq:${id}:${sl}`, `(()=>{const s=document.querySelector('#unit [data-a="slot"][data-v="${sl}"]');s&&s.click();const x=document.querySelector('#unit [data-a="put"]');x&&x.click();})()`, 160);
      await step(`unit-off:${id}:${sl}`, `(()=>{const s=document.querySelector('#unit [data-a="slot"][data-v="${sl}"]');s&&s.click();const x=document.querySelector('#unit [data-a="off"]');x&&x.click();})()`, 160);
    }
    await step('unit-nav:' + id, `(()=>{const n=document.querySelector('#unit [data-a="nav"][data-v="1"]');n&&n.click();const l=document.querySelector('#unit [data-a="list"]');l&&l.click();})()`, 200);
  }
  await step('unit-board', `(()=>{UNIT.open('rio');document.querySelector('#unit [data-a="board"]').click();})()`, 600);await shot('07_board');
  await step('unit-close', HOME, 400);

  /* ⑥ 図鑑：一覧（敵の絞り込みも）と詳細・3 形態 */
  await step('zukan', () => zkMenu(), 400);await shot('08_zukan');
  for (const [cat, fam] of [['normal', 'all'], ['boss', 'all'], ['all', 'beast'], ['all', 'dragon']])
    await step(`zukan-filter:${cat}/${fam}`, `(()=>{ZUKAN.ZK.cat='${cat}';ZUKAN.ZK.fam='${fam}';ZUKAN.list();})()`, 200);
  for (const t of ['h', 'i', 'e']) await step('zukan-tab:' + t, `(()=>{ZUKAN.ZK.t='${t}';ZUKAN.ZK.cat='all';ZUKAN.ZK.fam='all';ZUKAN.list();})()`, 200);
  const enemies = await p.evaluate(() => zkEnemies());
  const heroes = await p.evaluate(() => Object.keys(HB));
  for (const k of (QUICK ? enemies.slice(0, 8) : enemies)) {
    await step('zukan-e:' + k, `zkEnemy('${k}')`, 220);
    for (const m of ['front', 'idle']) await step(`zukan-e:${k}:${m}`, `ZVIEW.setMotion('${m}')`, 120);
  }
  for (const id of (QUICK ? heroes.slice(0, 4) : heroes)) {
    await step('zukan-h:' + id, `zkHero('${id}')`, 220);
    for (const m of ['front', 'idle']) await step(`zukan-h:${id}:${m}`, `ZVIEW.setMotion('${m}')`, 150);
  }
  await step('home-end', HOME, 600);await shot('09_home_end');

  /* --fx：コマンド戦闘を ×2・AUTO で最後まで進める。1 ステージ（--quick）か各章の最初のステージ */
  if (FX) {
    for (const id of (QUICK ? firsts.slice(0, 1) : firsts)) {
      await step('fx-prep:' + id, `TDM.prep('${id}')`, 400);
      await step('fx-go:' + id, `(()=>{const b=document.querySelector('#tdm [data-a="go"]');b&&b.click();})()`, 400);
      await step('fx-talk:' + id, `(()=>{for(let i=0;i<30;i++){const k=document.querySelector('#tdm .tdm-talk .skip');if(!k)break;k.click();}})()`, 400);
      await step('fx-x2:' + id, `(()=>{for(let i=0;i<3;i++){const s=document.querySelector('#cb [data-a="spd"]');if(s&&s.textContent.trim()!=='×2')s.click();}const a=document.querySelector('#cb [data-a="auto2"]');if(a&&!a.classList.contains('on'))a.click();})()`, 300);
      const t0 = Date.now();let over = false;
      while (Date.now() - t0 < 150000) {over = await p.evaluate(() => !!(CB.st && CB.st.over)).catch(() => false);if (over) break;await p.waitForTimeout(500);}
      if (!over) errs.push(['fx:' + id, '戦闘が終わらない（×2・AUTO・150 秒）']);
      await p.waitForTimeout(2200);await shot('10_fx_result_' + id);
      await step('fx-end:' + id, `(()=>{const a=document.querySelector('#cb [data-a="auto2"]');if(a&&a.classList.contains('on'))a.click();CB.hide();TDM.map();})()`, 400);
    }
    await step('fx-home', HOME, 400);
  }

  if (COV) {
    const cov = await p.coverage.stopJSCoverage(), out = {};
    for (const e of cov) {const m = e.url.match(/\/(js\/.*\.js)$/);if (!m || /sprite\/data\//.test(m[1])) continue;
      const src = e.source || '', fns = [];
      for (const f of e.functions) {if (!f.functionName || !f.ranges.length) continue;const r = f.ranges[0];
        fns.push([f.functionName, src.slice(0, r.startOffset).split('\n').length, r.endOffset - r.startOffset, r.count]);}
      out[m[1]] = fns;}
    fs.writeFileSync(COV, JSON.stringify(out));
  }
  await b.close();
  const uniq = new Map();
  for (const [s, m] of errs) {const k = m;if (!uniq.has(k)) uniq.set(k, [s, 1]);else uniq.get(k)[1]++;}
  console.log(`errors: ${errs.length}（${uniq.size} 種類）`);
  for (const [m, [s, n]] of uniq) console.log(`- [${s}] ×${n} ${m}`);
  process.exit(errs.length ? 1 : 0);
})();
