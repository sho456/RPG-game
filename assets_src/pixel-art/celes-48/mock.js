// ゲーム実装の予想図：戦闘画面のセレスの絵を 48px の新しい絵に差し替えて撮る
const {chromium}=require('playwright');const fs=require('fs');
const IM={};for(const n of['side','ready','dying','ko','front'])IM[n]='data:image/png;base64,'+fs.readFileSync(`celes48_${n}.png`).toString('base64');
const scene=process.argv[2]||'turn';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:860},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8790/index.html');
await p.waitForFunction(()=>typeof SPX!=='undefined'&&SPX.ready,{timeout:60000});
await p.evaluate(async(IM)=>{
 const L={};await Promise.all(Object.entries(IM).map(([k,u])=>new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=48;c.height=48;c.getContext('2d').drawImage(i,0,0);L[k]=c;r();};i.src=u;})));
 const F={};const fr=k=>{if(F[k])return F[k];const ys=[];const c=L[k];
  const f={cv:c,w:48,h:48,ax:24,ay:47,spx:1};c._spx={ax:24,ay:47};return F[k]=f;};
 window.CELMODE=()=>{const h=B&&B.heroes.find(x=>x.id==='celes');if(!h)return'side';
  if(!h.alive||h.hp<=0)return'ko';if(B.pick&&B.pick.u&&B.pick.u.id==='celes')return'ready';if(h.hp<h.mhp*.25)return'dying';return'side';};
 const f0=SPRX.frame;SPRX.frame=function(n,...a){if(String(n)==='spx_celes'&&typeof B!=='undefined'&&B)return fr(window.CELMODE());return f0.call(this,n,...a);};
 G=migrate(newGame());G.set=Object.assign(G.set||{},{tut:false});
 for(const id of Object.keys(HB))if(!G.members.includes(id))newMember(id);
 G.party=['rio','gald','celes','mire'];for(const id of G.members){G.h[id].lv=40;G.h[id].hp=null;}
 document.querySelector('#ov').classList.add('hide');townMenu();try{ovClose();}catch(e){};auto=false;
 startBattle([{kind:'slime',lv:5},{kind:'wolf',lv:5}],{onEnd:()=>{}});},IM);
const cel=()=>p.evaluate(()=>B.heroes.find(x=>x.id==='celes'));
if(scene==='turn'){await p.waitForTimeout(2600);}
else{await p.waitForTimeout(5000);
 if(scene==='cmd'){for(let i=0;i<2;i++){for(let k=0;k<1;k++){await p.click('#cmd [data-i38="0"]');await p.waitForTimeout(350);}}await p.waitForTimeout(900);}
 if(scene==='dying'){await p.evaluate(()=>{const h=B.heroes.find(x=>x.id==='celes');h.hp=Math.round(h.mhp*.08);});await p.waitForTimeout(800);}
 if(scene==='ko'){await p.evaluate(()=>{const h=B.heroes.find(x=>x.id==='celes');h.hp=0;h.alive=false;});await p.waitForTimeout(800);}}
await p.screenshot({path:`mock_${scene}.png`});
console.log(scene,await p.evaluate(()=>window.CELMODE()),errs.slice(0,3).join(' / '));
await b.close();})();
