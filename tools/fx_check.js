#!/usr/bin/env node
/* 演出の台帳の点検：どの技・敵の行動に専用の演出が入っているか（網羅）と、演出の組み合わせが同じもの（重複）を調べる
   使い方：python3 -m http.server 8765 &   →   node tools/fx_check.js [--url …] [--write]
   ・--write：docs/FX-COVERAGE.md に一覧を書き出す（技の名前・属性・種類・対象・説明つき。演出を作るときの台帳にもなる）
   ・重複：演出に使っている部品（名前・色・大きさの段階）の並びが完全に同じ定義どうしを報告する。1 件でもあれば終了コード 1 */
'use strict';
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = k => {const i = args.indexOf(k);return i >= 0 ? args[i + 1] : null;};
const URL = opt('--url') || 'http://localhost:8765/index.html', WRITE = args.includes('--write');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto(URL);
  await p.waitForFunction(() => typeof SPX !== 'undefined' && SPX.ready, {timeout: 60000});
  const R = await p.evaluate(() => {
    G = migrate(newGame());for (const id of Object.keys(HB)) if (!G.members.includes(id)) newMember(id);
    const has = (who, k) => !!(BXS.REG[who + ':' + k] || BXS.REG[k]);
    const info = k => {const s = k === 'atk' ? {n: '通常攻撃'} : k === 'guard' ? {n: '防御', k: 'guard'} : SK[k] || {};return {id: k, n: s.n || k, el: s.el || '', k: s.k || '', t: s.t || '', pow: s.pow == null ? '' : s.pow, hits: s.hits || '', d: s.d || ''};};
    const heroes = {}, owned = new Set();
    for (const id of Object.keys(HB)) {const ks = BXV.heroSkills(id);heroes[id] = {name: HB[id].name, aw: (AW[id].cmds || []), sk: ks.map(k => Object.assign(info(k), {def: k === 'guard' ? !!BXS.REG['cat:guard'] : has(id, k)}))};ks.forEach(k => owned.add(k));}
    const rest = Object.keys(SK).filter(k => !owned.has(k)).map(k => Object.assign(info(k), {def: !!BXS.REG[k]}));
    const ea = Object.keys(EA).map(k => ({id: k, n: EA[k].n, el: EA[k].el || '', k: EA[k].k || '', t: EA[k].t || '', pow: EA[k].pow == null ? '' : EA[k].pow, def: !!BXS.REG['ea:' + k]}));
    /* 重複の検査：部品の名前・色・大きさの段階の並び */
    const sig = d => {const out = [];const walk = v => {if (!v) return;if (typeof v === 'function') {for (const n of [1, 2, 3]) {try {walk(v({n, dir: -1, r: {}, a: {}, t: {}}));} catch (e) {}}return;}
      if (Array.isArray(v)) {if (v.length && Array.isArray(v[0])) v.forEach(s => {if (s[1] === 'fx') {const o = s[3] || {};out.push(s[2] + ':' + (Array.isArray(o.ramp) ? o.ramp[2] : o.ramp || '') + ':' + Math.round((o.r || o.len || o.w || 0)) + ':' + (o.style || '') + (o.kind || '') + (o.mode || ''));} else if (s[1] === 'pose') out.push('p' + JSON.stringify(s[2]));});else v.forEach(walk);return;}
      if (v.do) walk(v.do);};
      walk(d.pre);walk(d.strike);walk(d.impact);walk(d.after);return [...new Set(out)].sort().join('|');};
    const sigs = {};for (const k in BXS.REG) {const s = sig(BXS.REG[k]);(sigs[s] = sigs[s] || []).push(k);}
    const dups = Object.values(sigs).filter(a => a.length > 1);
    return {heroes, rest, ea, dups, total: BXS.n};
  });
  await b.close();
  let nSk = 0, nDef = 0;for (const id in R.heroes) for (const s of R.heroes[id].sk) {nSk++;if (s.def) nDef++;}
  const eaDef = R.ea.filter(e => e.def).length, restDef = R.rest.filter(e => e.def).length;
  console.log(`味方の技：${nDef}／${nSk}　その他の技（共鳴・特殊など）：${restDef}／${R.rest.length}　敵の行動：${eaDef}／${R.ea.length}　登録 ${R.total} 件`);
  for (const id in R.heroes) {const h = R.heroes[id], miss = h.sk.filter(s => !s.def).map(s => s.n);console.log(`- ${h.name}：${h.sk.length - miss.length}／${h.sk.length}${miss.length ? '　未：' + miss.join('・') : ''}`);}
  console.log(`重複（組み合わせが同じ定義）：${R.dups.length} 組`);for (const d of R.dups) console.log('  - ' + d.join(' = '));
  if (WRITE) {
    const row = s => `| ${s.def ? '★' : '　'} | \`${s.id}\` | ${s.n} | ${s.el} | ${s.k} | ${s.t} | ${s.pow}${s.hits ? '×' + s.hits : ''} | ${String(s.d).replace(/\|/g, '／')} |`;
    const head = '| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 | 説明 |\n|---|---|---|---|---|---|---|---|';
    let md = `# 演出の網羅（自動生成：\`node tools/fx_check.js --write\`）\n\n★＝専用の演出あり。味方の技 ${nDef}／${nSk}、その他の技 ${restDef}／${R.rest.length}、敵の行動 ${eaDef}／${R.ea.length}。\n`;
    for (const id in R.heroes) {const h = R.heroes[id];md += `\n## ${h.name}（\`${id}\`）　星臨中のコマンド：${h.aw.join('・')}\n\n${head}\n${h.sk.map(row).join('\n')}\n`;}
    md += `\n## その他の技（どの味方の一覧にも無いもの）\n\n${head}\n${R.rest.map(row).join('\n')}\n`;
    md += `\n## 敵の行動（EA）\n\n| 済 | id | 名前 | 属性 | 種類 | 対象 | 威力 |\n|---|---|---|---|---|---|---|\n${R.ea.map(s => `| ${s.def ? '★' : '　'} | \`ea:${s.id}\` | ${s.n} | ${s.el} | ${s.k} | ${s.t} | ${s.pow} |`).join('\n')}\n`;
    fs.writeFileSync(path.join(__dirname, '..', 'docs', 'FX-COVERAGE.md'), md);console.log('wrote docs/FX-COVERAGE.md');
  }
  process.exit(R.dups.length ? 1 : 0);
})();
