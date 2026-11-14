#!/usr/bin/env node
/* ゲーム全体の自動点検（ブラウザで画面を巡回し、JavaScript のエラーを集める）
   使い方：python3 -m http.server 8765 &   →   node tools/smoke.js [--url http://localhost:8765/index.html] [--shots <dir>] [--quick]
   ・巡回：タイトル → 街 → クエスト（全章・全クエストの情報タブ）→ 編成 → 図鑑（敵・仲間・装備の一覧と全員の詳細・3 形態）
           → 戦闘（全種類の敵を 3 体ずつ。AUTO・速度×4 で決着まで。星臨も使う）
   ・結果：エラーの一覧（場面・メッセージ）。1 件でもあれば終了コード 1
   Playwright は環境に入っているものを使う（require('playwright')） */
'use strict';
const {chromium} = require('playwright');
const args = process.argv.slice(2);
const opt = k => {const i = args.indexOf(k);return i >= 0 ? args[i + 1] : null;};
const URL = opt('--url') || 'http://localhost:8765/index.html';
const SHOTS = opt('--shots');
const QUICK = args.includes('--quick');
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

  await p.goto(URL);
  await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready, {timeout: 60000});
  await shot('00_title');
  /* 全員加入・全クエスト開放の状態を作る */
  await step('setup', () => {
    G = migrate(newGame());G.set = Object.assign(G.set || {}, {tut: false});
    for (const id of Object.keys(HB)) if (!G.members.includes(id)) newMember(id);
    G.party = ['rio', 'gald', 'celes', 'mire'];
    for (const id of G.members) {G.h[id].lv = 40;G.h[id].hp = null;}
    for (const c of QD.CH) if (c.qs) c.qs.forEach(q => {G.qs.c[q.id] = 1;});
    Object.assign(G.flags, {boss1: true, boss2: true, boss3: true, boss4: true, boss5: true, boss6: true, boss7: true});
    G.zk = {e: {}, i: {}};zkEnemies().forEach(k => G.zk.e[k] = 1);
    document.querySelector('#ov').classList.add('hide');
  });
  await step('town', () => townMenu(), 500);await shot('01_town');
  /* クエスト：全タブ・全章・全クエストの情報タブ */
  await step('quest-map', () => worldMap(), 500);await shot('02_quests');
  const tabs = await p.$$eval('#cmd .wtabs button', bs => bs.length);
  for (let t = 0; t < tabs; t++) {
    await step('quest-tab' + t, `(()=>{const b=document.querySelectorAll('#cmd .wtabs button')[${t}];b&&b.click();})()`, 300);
    const chs = await p.$$eval('#cmd .qch31', bs => bs.map(x => x.dataset.v));
    for (const ch of (QUICK ? chs.slice(0, 2) : chs)) {
      await step('quest-ch:' + ch, `(()=>{const b=document.querySelector('#cmd .qch31[data-v="${ch}"]');b&&b.click();})()`, 200);
      const qs = await p.$$eval('#cmd .qrow31', rs => rs.map(r => r.dataset.v));
      for (const q of (QUICK ? qs.slice(0, 2) : qs)) {
        await step('quest-info:' + q, `(()=>{const r=document.querySelector('#cmd .qrow31[data-v="${q}"]');r&&r.click();})()`, 250);
        await step('quest-back:' + q, `(()=>{const b=document.querySelector('#cmd [data-a="list"]');b&&b.click();})()`, 150);
      }
    }
  }
  await shot('03_quest_last');
  /* 編成・装備 */
  await step('party', () => partyScreen(), 500);await shot('04_party');
  await step('equip', () => equipMenu(G.party[0]), 500);await shot('05_equip');
  /* 図鑑：一覧（敵の絞り込みも）と全員の詳細・3 形態 */
  await step('zukan', () => zkMenu(), 400);await shot('06_zukan');
  for (const [cat, fam] of [['normal', 'all'], ['boss', 'all'], ['all', 'beast'], ['all', 'dragon']])
    await step(`zukan-filter:${cat}/${fam}`, `(()=>{ZUKAN.ZK.cat='${cat}';ZUKAN.ZK.fam='${fam}';ZUKAN.list();})()`, 200);
  for (const t of ['h', 'i', 'e']) await step('zukan-tab:' + t, `(()=>{ZUKAN.ZK.t='${t}';ZUKAN.ZK.cat='all';ZUKAN.ZK.fam='all';ZUKAN.list();})()`, 200);
  const enemies = await p.evaluate(() => zkEnemies());
  const heroes = await p.evaluate(() => Object.keys(HB));
  for (const k of (QUICK ? enemies.slice(0, 8) : enemies)) {
    await step('zukan-e:' + k, `zkEnemy('${k}')`, 220);
    for (const m of ['front', 'idle']) await step(`zukan-e:${k}:${m}`, `ZVIEW.setMotion('${m}')`, 120);
  }
  for (const id of heroes) {
    await step('zukan-h:' + id, `zkHero('${id}')`, 220);
    for (const m of ['front', 'idle', 'seirin']) await step(`zukan-h:${id}:${m}`, `ZVIEW.setMotion('${m}')`, 150);
  }
  await shot('07_zukan_last');
  /* 戦闘：全種類の敵を 3 体ずつ。AUTO・速度×4。決着か時間切れまで */
  const groups = [];
  for (let i = 0; i < enemies.length; i += 3) groups.push(enemies.slice(i, i + 3));
  const parties = [['rio', 'gald', 'celes', 'mire'], ['hakua', 'noah', 'erna', 'valk'], ['balza', 'jin', 'shion', 'crow']];
  for (let gi = 0; gi < (QUICK ? 3 : groups.length); gi++) {
    const g = groups[gi], party = parties[gi % parties.length];
    const name = 'battle:' + g.join(',');
    await step(name, `(()=>{auto=true;setSpeed(4);G.party=${JSON.stringify(party)};for(const id of G.party){G.h[id].hp=null;G.h[id].awLv=3;}
      const L=${JSON.stringify(g)}.map(k=>({kind:k,lv:ED[k].boss?30:25}));const bs=L.filter(e=>ED[e.kind].boss);
      startBattle(bs.length?[bs[0]]:L,{boss:!!bs.length,onEnd:()=>{window.__end=1;}});window.__end=0;})()`, 300);
    /* 星臨：最初の味方を星臨にする（AG を満たす） */
    await step(name + ':awaken', `(()=>{const h=B&&B.heroes[0];if(h){h.ag=100;}})()`, 100);
    const t0 = Date.now();
    while (Date.now() - t0 < (QUICK ? 6000 : 14000)) {
      const st = await p.evaluate(() => ({over: !!(B && B.over), end: window.__end})).catch(() => ({over: true}));
      if (st.over || st.end) break;
      await p.waitForTimeout(400);
    }
    if (gi % 6 === 0) await shot(`08_battle_${gi}`);
    /* 決着しなかった戦闘は打ち切る。進行中の手番が終わるまで待ってから次へ（古い戦闘の処理が次の戦闘に触れないように） */
    await step(name + ':close', `(()=>{if(B){B.over=true;}auto=false;setSpeed(1);try{document.querySelector('#ov').classList.add('hide');}catch(e){}})()`, 2500);
  }
  await step('town-end', () => {try {enterTown();} catch (e) {townMenu();}}, 600);await shot('09_town_end');

  await b.close();
  const uniq = new Map();
  for (const [s, m] of errs) {const k = m;if (!uniq.has(k)) uniq.set(k, [s, 1]);else uniq.get(k)[1]++;}
  console.log(`errors: ${errs.length}（${uniq.size} 種類）`);
  for (const [m, [s, n]] of uniq) console.log(`- [${s}] ×${n} ${m}`);
  process.exit(errs.length ? 1 : 0);
})();
