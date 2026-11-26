#!/usr/bin/env node
/* ===== 難易度の計測（旧戦闘を画面つきで AUTO・×4 で全ステージ） =====
 使い方：python3 -m http.server 8765 &  →  node tools/stage_sim.js [--pages 4] [--runs 1] [--lv +0] [ステージid…]
 各ステージを「推奨 Lv＋lv・その章までに加入した 4 人・推奨 Lv のレア装備」で AUTO（星臨も使う）。勝ち・星・倒れた数・ターンを表に。
 結果を見て js/battle/stage.js の TUNE（ステージごとの敵の Lv の増減）を直す。 */
'use strict';
const {chromium}=require('playwright');
const A=process.argv.slice(2),opt=(k,d)=>{const i=A.indexOf(k);return i>=0?A.splice(i,2)[1]:d;};
const PAGES=+opt('--pages',4),RUNS=+opt('--runs',1),DLV=+opt('--lv',0),URL=opt('--url','http://localhost:8765/index.html');
(async()=>{const b=await chromium.launch();
 const p0=await b.newPage();await p0.goto(URL);await p0.waitForFunction(()=>typeof STG!=='undefined'&&SPX.ready,{timeout:60000});
 const ids=A.length?A:await p0.evaluate(()=>TDD.ORDER.slice());await p0.close();
 const jobs=[];for(const id of ids)for(let r=0;r<RUNS;r++)jobs.push(id);const out=[];
 async function worker(){const p=await b.newPage({viewport:{width:420,height:860}});await p.goto(URL);await p.waitForFunction(()=>typeof STG!=='undefined'&&SPX.ready,{timeout:60000});
  p.on('pageerror',e=>out.push({id:'ERR',e:String(e.message).slice(0,160)}));
  while(jobs.length){const id=jobs.shift();
   await p.evaluate(([id,dl])=>{try{document.querySelector('#ov').classList.add('hide');document.querySelector('#ov').innerHTML='';}catch(e){}
    G=migrate(newGame());G.set=Object.assign(G.set||{},{tut:false});G.tut={};const S=TDD.STAGE[id],lv=Math.max(1,S.lv+dl),R=TDD.rosterAt(id).slice(0,4);
    for(const h of R)if(!G.members.includes(h))newMember(h);G.party=R;G.inv=[];
    for(const h of R){G.h[h].lv=lv;G.h[h].hp=null;if(lv>=20)G.h[h].board=['2,-2'];for(const sl of['w','main','sub','acc','acc'])for(let i=0;i<2;i++){const it=genItem(lv,2,0,sl,1);it.unid=false;G.inv.push(it);}}
    for(const h of R)bestEquip(h);SPD[4]=.12;speed=4;auto=true;G.set.autoMode='full';STG.run(id,R);},[id,DLV]);
   const t0=Date.now();let r=null;
   while(Date.now()-t0<240000){r=await p.evaluate(()=>{if(!document.querySelector('#ov .stg-res'))return null;const c=STG.last;return c||{};}).catch(()=>null);if(r)break;
    await p.evaluate(()=>{try{auto=true;if(B&&B.res)B.res();}catch(e){}}).catch(()=>{});await p.waitForTimeout(700);}
   out.push({id,...(r||{timeout:1}),sec:Math.round((Date.now()-t0)/1000)});process.stderr.write('.');}
  await p.close();}
 await Promise.all(Array.from({length:PAGES},worker));await b.close();
 const by={};for(const o of out){if(o.id==='ERR'){console.log('エラー',o.e);continue;}(by[o.id]=by[o.id]||[]).push(o);}
 console.log('\nステージ  勝ち  星(平均)  倒れ  ターン/規定  秒');
 for(const id of ids){const L=by[id]||[];const w=L.filter(o=>o.win).length,st=L.reduce((a,o)=>a+(o.stars||0),0)/(L.length||1),f=L.reduce((a,o)=>a+(o.fell||0),0)/(L.length||1),t=L.reduce((a,o)=>a+(o.turns||0),0)/(L.length||1);
  console.log(`${id.padEnd(8)} W${L.map(o=>o.wave).join(",")} ${w}/${L.length}  ${st.toFixed(1)}  ${f.toFixed(1)}  ${t.toFixed(0)}/${L[0]&&L[0].par||'-'}  ${L[0]?L[0].sec:''}${L.some(o=>o.timeout)?' 時間切れ':''}`);}
})();
