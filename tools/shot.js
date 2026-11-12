// ゲーム内スクリーンショット取得ツール: node tools/shot.js <outdir> <name> "<js to eval>" [waitms] [more "<js>" name ...]
const { chromium } = require('playwright');
(async()=>{
 const [out,...rest]=process.argv.slice(2);
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto((process.env.GAME_URL||'http://localhost:8765/index.html'));await p.waitForTimeout(1200);
 for(let i=0;i<rest.length;i+=3){const name=rest[i],js=rest[i+1],wait=+rest[i+2]||1500;
  try{const r=await p.evaluate(js);if(r!==undefined)console.log(name,'=>',JSON.stringify(r).slice(0,2000));}catch(e){console.log(name,'EVALERR',e.message.slice(0,500));}
  await p.waitForTimeout(wait);await p.screenshot({path:out+'/'+name+'.png'});}
 console.log('errors',errs.slice(0,10));await b.close();
})();
