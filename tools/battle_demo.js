#!/usr/bin/env node
/* 戦闘のデモを撮る（スキル rs-battle-flow の確認用）
   使い方：python3 -m http.server 8765 &
     node tools/battle_demo.js <出力dir> [boss|multi]          … 0.1 秒ごとのコマ（f_000.png…）
     VID=1 node tools/battle_demo.js <出力dir> boss            … 動画（.webm。ffmpeg で mp4 に）
   環境変数：URL（既定 http://localhost:8765）・N（コマ数）・DT（間隔 ms）
   boss＝ボス 1 体（連続ヒット・Weak・Critical・状態）／multi＝敵 3 体（全体攻撃が同時に当たるか） */
'use strict';
const {chromium}=require('playwright');
const OUT=process.argv[2],MODE=process.argv[3]||'multi';require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:420,height:860},recordVideo:process.env.VID?{dir:OUT,size:{width:420,height:860}}:undefined});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.message).slice(0,300)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,300));});
await p.goto((process.env.URL||'http://localhost:8765')+'/index.html');
await p.waitForFunction(()=>typeof SPX!=='undefined'&&SPX.ready,{timeout:60000});
await p.evaluate((MODE)=>{G=migrate(newGame());G.set=Object.assign(G.set||{},{tut:false});
 for(const id of Object.keys(HB))if(!G.members.includes(id))newMember(id);
 const pt=MODE==='boss'?['shion','hakua','erna','rio']:['mire','erna','shion','noah'];G.party=pt;
 const sets={mire:['flamewave','fire','prism','blizz'],erna:['samidare','raiya','nerai','kantsuu'],shion:['genei','kagenui','dokujin','shippu'],noah:['mamori','holy','inori','regene'],hakua:['hyakuretsu','hyouketsu','shouken','tsurara'],rio:['torirensan','kobu','koujin','shiden']};
 for(const id of G.members){G.h[id].lv=70;G.h[id].hp=null;G.h[id].glim=(RSD.LEARN[id]||[]).map(x=>x[0]);if(sets[id])G.h[id].sset=sets[id];}
 document.querySelector('#ov').classList.add('hide');townMenu();},MODE);
await p.waitForTimeout(400);
await p.evaluate((MODE)=>{try{ovClose()}catch(e){};auto=true;G.set.autoMode='full';
 const L=MODE==='boss'?[{kind:'m_echo',lv:66}]:[{kind:'slime',lv:62},{kind:'slime',lv:62},{kind:'slime',lv:62}];
 startBattle(L,{onEnd:()=>{}});if(MODE==='boss')setTimeout(()=>{const t=aliveE()[0];t.weak.forEach(e=>t.known.add(e));},200);},MODE);
const N=+(process.env.N||80),DT=+(process.env.DT||100);
for(let i=0;i<N;i++){await p.waitForTimeout(DT);if(!process.env.VID)await p.screenshot({path:`${OUT}/f_${String(i).padStart(3,'0')}.png`});}
console.log('errors',errs.length,errs.slice(0,5).join('\n'));await ctx.close();await b.close();})();
