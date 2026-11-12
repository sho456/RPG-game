// 現在ゲームに実装されている全キャラの待機フレームを実寸（戦闘時のドット数）で書き出す
// node tools/dump_current.js <outdir> [tag]   → <outdir>/<key>.png と <outdir>/index.json
const { chromium } = require('playwright');const fs=require('fs');
(async()=>{
 const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(process.env.GAME_URL||'http://localhost:8765/index.html');await p.waitForTimeout(1200);
 const res=await p.evaluate(()=>{
  const out=[];devGame();
  const count=cv=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,s=new Set();let x0=1e9,y0=1e9,x1=-1,y1=-1;for(let i=0;i<d.length;i+=4)if(d[i+3]>10){s.add(d[i]<<16|d[i+1]<<8|d[i+2]);const x=(i/4)%cv.width,y=(i/4/cv.width)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{colors:s.size,bw:x1-x0+1,bh:y1-y0+1};};
  const one=(key,u,type,tier)=>{try{const A=ANIM.setup(u);if(A.none){out.push({key,type,tier,none:1});return;}const pose=ANIM.base(A);const f=SPRX.frame(A.name,pose,A.palKey,A.pal,A.flip,A.sc,A.extra);const c=count(f.cv);
    out.push({key,type,tier,name:(ED[key]&&ED[key].name)||(HB[key]&&HB[key].name)||key,rig:A.name,extra:A.extra,sc:+A.sc.toFixed(3),w:f.w,h:f.h,ax:f.ax,ay:f.ay,bw:c.bw,bh:c.bh,colors:c.colors,png:f.cv.toDataURL()});}catch(e){out.push({key,type,err:String(e)});}};
  for(const id of Object.keys(HB)){one(id,{id,spr:id,side:0,sc:2,x:0,y:0,alive:true},'hero','ally');one(id+'_aw',{id,spr:id,aw:1,side:0,sc:2,x:0,y:0,alive:true},'hero_aw','ally');}
  const kinds=Object.keys(ED);
  for(const id of ['rio','gald']){try{kinds.includes(trialEnemy(id,2))||kinds.push(trialEnemy(id,2));}catch(e){}}
  for(const f of [10,20,30,40]){try{const k=kBoss(f);kinds.includes(k)||kinds.push(k);}catch(e){}}
  try{const k=voidKind('slime');kinds.includes(k)||kinds.push(k);}catch(e){}
  for(const k of Object.keys(ED)){if(!kinds.includes(k))kinds.push(k);}
  for(const k of kinds){const d=ED[k];one(k,{kind:k,spr:k,side:1,sc:d.sc||2,boss:d.boss,x:0,y:0,alive:true},'enemy',d.boss?'boss':(d.sc===2&&d.mhp>1000?'mid':'normal'));}
  return out;});
 const idx=[];for(const r of res){if(r.png){fs.writeFileSync(out+'/'+r.key+'.png',Buffer.from(r.png.split(',')[1],'base64'));delete r.png;}idx.push(r);}
 fs.writeFileSync(out+'/index.json',JSON.stringify(idx,null,1));console.log(idx.length,'sprites; errors',errs.slice(0,5));
 for(const r of idx)console.log(r.key.padEnd(14),String(r.tier).padEnd(7),String(r.rig).padEnd(10),String(r.extra||'').padEnd(7),'sc',r.sc,'bbox',r.bw+'x'+r.bh,'col',r.colors,r.none?'NONE':'',r.err||'');
 await b.close();})();
