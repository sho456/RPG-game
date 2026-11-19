/* ===== TD の戦闘シミュレーション（TDS）。DOM・時計・描画に触れない純粋なロジック =====
 固定刻み（TDD.K.STEP＝1/30 秒）で tick(st) を呼ぶ。乱数は種つき（同じ種なら同じ結果）。見せ方は st.ev（出来事の列）を js/td/view.js が読む。
 操作：deploy(st,id,padId)・retreat(st,uid)・ult(st,uid)・callWave(st)。自動の配置：bot(st)。計測：run(stageId,deck,lv,seed)
 設計：docs/TD-DESIGN.md（灯域・灯火・灯力・星片・ダメージの式） */
'use strict';
const TDS=(()=>{
const D=typeof TDD!=='undefined'?TDD:require('./data.js');
const K=D.K;
function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
/* ---------- 道（折れ線を距離 s で引く） ---------- */
function mkPath(pts){const seg=[];let L=0;for(let i=0;i<pts.length-1;i++){const[a,b]=pts[i],[c,d]=pts[i+1],l=Math.hypot(c-a,d-b);seg.push({a,b,c,d,l,s0:L});L+=l;}return{seg,L};}
function at(P,s){s=Math.max(0,Math.min(P.L,s));for(const g of P.seg)if(s<=g.s0+g.l||g===P.seg[P.seg.length-1]){const k=g.l?(s-g.s0)/g.l:0;return{x:g.a+(g.c-g.a)*k,y:g.b+(g.d-g.b)*k,dir:Math.sign(g.c-g.a)};}return{x:0,y:0,dir:1};}
/* ---------- 作る ---------- */
function findS(P,x){let b=0,bd=1e9;for(let s=0;s<=P.L;s+=2){const d=Math.abs(at(P,s).x-x);if(d<bd){bd=d;b=s;}}return b;}
function create(stageId,deck,o={}){const S=D.STAGE[stageId];if(!S)throw new Error('TD: ステージが無い '+stageId);
 const Ps=S.paths.map(mkPath),P=Ps[0],lvOf=o.lv||{},st={S,P,Ps,t:0,R:rng(o.seed||1),cost:S.cost0??K.COST0,costAcc:0,lives:K.LIVES,star:0,r0:S.light.r,lightR:S.light.r,
  lamp:0,lampT:1,wave:-1,phase:'gap',gapT:o.prep??10,spawnQ:[],foes:[],units:[],fields:[],ev:[],uid:1,over:null,kills:0,leaks:0,timeSlow:0,cap:S.cap||6};
 st.pads=S.pads.map(p=>{const q=Object.assign({},p);if(p.k==='f'){q.lane=p.lane||0;const L=Ps[q.lane];q.s=p.s??findS(L,p.x);const a=at(L,q.s);q.x=a.x;q.y=a.y;}q.unit=null;q.lit=false;return q;});
 st.deck=(deck||D.deckOf()).map(id=>({id,h:D.hero(id,lvOf[id]||1,o.real&&o.real[id]),cd:0,on:null,ult:false})).filter(c=>c.h);
 /* 後ろの台座が道をどれだけ見ているか（自動の配置が使う） */
 for(const p of st.pads){p.cov={};for(const r of[108,112,150]){let n=0;for(const L of Ps)for(let s=0;s<L.L;s+=12){const a=at(L,s);if(dist(a.x,a.y,p.x,p.y)<=r)n++;}p.cov[r]=n;}}
 st.lampU={id:'lamp',x:S.base[0],y:S.base[1]-110,face:-1,lit:true,h:{name:'灯',atk:0,el:'陽',dmgK:'mag',rng:999,sk:{}}};lampSet(st);
 lightUpdate(st);return st;}
/* ---------- 灯を強める（灯力で 3 段階）：光が広がり、灯の光弾が強くなる ---------- */
const LAMP=[12,18,24];
function lampSet(st){st.lampU.h.atk=Math.round((22+5*st.S.lv)*(1+.4*st.lamp));st.lampR=150+st.lamp*25;}
function lampCost(st){return st.lamp<LAMP.length?LAMP[st.lamp]:0;}
function lampUp(st){const c=lampCost(st);if(!c||st.cost<c||st.over)return c?'灯力が足りない（'+c+' 必要）':'これ以上強められない';st.cost-=c;st.lamp++;const r1=Math.round(st.S.light.r*(1+.15*st.lamp));st.lightR+=r1-st.r0;st.r0=r1;lampSet(st);lightUpdate(st);ev(st,{k:'lamp',n:st.lamp});return'';}
const ev=(st,e)=>{e.at=st.t;st.ev.push(e);};
/* ---------- 灯域：灯の光と、光の中にいる仲間（リオ・ノア）の光の鎖 ---------- */
function lightUpdate(st){const[bx,by]=st.S.base;for(const p of st.pads)p.lit=dist(p.x,p.y,bx,by)<=st.lightR;
 for(let pass=0;pass<4;pass++){let ch=false;for(const u of st.units){if(!u.h.lt||!u.pad.lit)continue;for(const p of st.pads)if(!p.lit&&dist(p.x,p.y,u.x,u.y)<=u.h.lt){p.lit=true;ch=true;}}if(!ch)break;}
 for(const u of st.units)u.lit=u.pad.lit;}
/* ---------- WAVE ---------- */
function startWave(st){st.wave++;st.phase='wave';const W=st.S.waves[st.wave];W.e.forEach(([t0,kind,n,gap,lane],j)=>{for(let i=0;i<n;i++)st.spawnQ.push({t:st.t+t0+i*gap,kind,lane:lane??((i+j)%st.Ps.length)});});
 st.spawnQ.sort((a,b)=>a.t-b.t);ev(st,{k:'wave',n:st.wave+1,of:st.S.waves.length,boss:W.e.some(e=>{const f=D.foe(e[1],1);return f&&f.boss;})});}
function callWave(st){if(st.phase!=='gap'||st.over)return false;const b=Math.ceil(st.gapT);if(st.wave>=0)st.cost+=b;ev(st,{k:'call',bonus:st.wave>=0?b:0});startWave(st);return true;}
function spawn(st,kind,s=0,lane=0){const f=D.foe(kind,st.S.lv);if(!f)return null;f.hp=Math.round(f.hp*(f.boss?(st.S.bk||1):(st.S.hk||1)));const P=st.Ps[lane]||st.P,a=at(P,s);
 const u=Object.assign(f,{uid:st.uid++,lane,P,mhp:f.hp,s,x:a.x,y:a.y,dir:a.dir,by:null,atkT:f.iv,stun:0,slow:0,curse:0,aiT:f.ai?f.ai.every:0,hitT:-9});st.foes.push(u);ev(st,{k:'spawn',f:u});return u;}
/* ---------- ダメージ：攻撃 × 倍率 × 攻撃/(攻撃+防御) × 属性 × 会心 ---------- */
function hit(st,u,f,m=1,o={}){if(f.hp<=0)return 0;const A=u.h.atk*(u.lit?1:K.DARK);let df=u.h.dmgK==='mag'?f.res:f.def;if(f.curse>0)df*=.6;
 let v=A*m*A/(A+df);const el0=o.el||u.h.el;
 if(f.tr.includes('ghost'))v*=u.h.dmgK==='phys'?.6:1.25;if(f.tr.includes('armor')&&u.h.dmgK==='phys'&&el0!=='打')v*=.55;
 const el=o.el||u.h.el,weak=f.weak.includes(el),res=f.resist.includes(el);if(weak)v*=1.5;if(res)v*=.5;
 const cr=st.R()<.1;if(cr)v*=1.5;v=Math.max(1,Math.round(v));f.hp-=v;f.hitT=st.t;
 ev(st,{k:'hit',f,u,v,el,weak,res,cr,sk:!!o.sk,big:!!o.big});if(f.hp<=0)kill(st,f,u);return v;}
function kill(st,f,u){f.hp=0;st.kills++;st.cost+=f.cost+(u&&u.h.sk.thief?1:0);st.star=Math.min(K.STAR_MAX*2,st.star+f.star);
 if(f.tr.includes('void'))st.lightR=Math.min(st.r0,st.lightR+10);if(f.by){f.by.blocking=f.by.blocking.filter(x=>x!==f);f.by=null;}ev(st,{k:'kill',f,u});}
function hurt(st,f,u){const v=Math.max(1,Math.round(f.atk*f.atk/(f.atk+u.h.def)));u.hp-=v;ev(st,{k:'hurt',u,v,f});if(u.hp<=0)fall(st,u);}
function release(u){for(const f of u.blocking)f.by=null;u.blocking=[];}
function fall(st,u){u.hp=0;release(u);u.pad.unit=null;st.units=st.units.filter(x=>x!==u);const c=st.deck.find(c=>c.on===u);if(c){c.on=null;c.cd=Math.round(u.h.redeploy*1.5);}ev(st,{k:'fall',u});lightUpdate(st);}
/* ---------- 操作 ---------- */
function canDeploy(st,id,padId){const c=st.deck.find(c=>c.id===id),p=st.pads.find(p=>p.id===padId);
 if(!c||!p||st.over)return'なし';if(c.on)return'配置済み';if(c.cd>0)return'再配置まで '+Math.ceil(c.cd)+' 秒';if(st.cost<c.h.cost)return'灯力が足りない';
 if(p.unit)return'台座が埋まっている';if(p.k!==c.h.pad)return c.h.pad==='f'?'道の上の台座に置く':'段の間の台座に置く';if(!p.lit)return'灯の光が届いていない';
 if(st.units.length>=st.cap)return'配置の上限';return'';}
function deploy(st,id,padId){const why=canDeploy(st,id,padId);if(why)return why;const c=st.deck.find(c=>c.id===id),p=st.pads.find(p=>p.id===padId);
 st.cost-=c.h.cost;const u={uid:st.uid++,id,h:c.h,hp:c.h.hp,pad:p,x:p.x,y:p.y,atkT:.4,ch:0,blocking:[],blkUp:0,lit:true,face:-1,actT:-9};
 p.unit=u;c.on=u;st.units.push(u);lightUpdate(st);ev(st,{k:'deploy',u});return'';}
function retreat(st,uid){const u=st.units.find(u=>u.uid===uid);if(!u)return false;st.cost+=Math.floor(u.h.cost/2);release(u);u.pad.unit=null;
 st.units=st.units.filter(x=>x!==u);const c=st.deck.find(c=>c.on===u);if(c){c.on=null;c.cd=u.h.redeploy;}ev(st,{k:'retreat',u});lightUpdate(st);return true;}
function canUlt(st,uid){const u=st.units.find(u=>u.uid===uid),c=u&&st.deck.find(c=>c.on===u);return!!(u&&c&&!c.ult&&st.star>=K.STAR_MAX&&!st.over);}
function ult(st,uid){if(!canUlt(st,uid))return false;const u=st.units.find(u=>u.uid===uid),c=st.deck.find(c=>c.on===u),U=u.h.ult;c.ult=true;st.star-=K.STAR_MAX;u.actT=st.t;
 if(U.k==='uheal'){for(const v of st.units)v.hp=v.h.hp;st.lives=Math.min(K.LIVES,st.lives+1);st.lightR=st.r0;lightUpdate(st);ev(st,{k:'ult',u,x:u.x,y:u.y,r:999});return true;}
 if(U.k==='utime'){st.timeSlow=U.dur;ev(st,{k:'ult',u,x:u.x,y:u.y,r:999});for(const f of st.foes.slice())hit(st,u,f,U.m*.5,{sk:1,big:1});return true;}
 const live=st.foes.filter(f=>f.hp>0);if(!live.length){ev(st,{k:'ult',u,x:u.x,y:u.y,r:U.r});return true;}
 let best=live[0],bn=-1;for(const f of live){const n=live.filter(g=>dist(f.x,f.y,g.x,g.y)<=U.r).length+(f.boss?2:0);if(n>bn){bn=n;best=f;}}
 const cx=best.x,cy=best.y;ev(st,{k:'ult',u,x:cx,y:cy,r:U.r});for(const f of live)if(dist(cx,cy,f.x,f.y)<=U.r)hit(st,u,f,U.m,{sk:1,big:1});return true;}
/* ---------- 技 ---------- */
const inRange=(st,u,r)=>st.foes.filter(f=>f.hp>0&&dist(u.x,u.y,f.x,f.y)<=r);
const rem=f=>f.P.L-f.s,front=L=>L.reduce((a,f)=>!a||rem(f)<rem(a)?f:a,null);
function target(st,u){if(u.blocking.length)return front(u.blocking);return front(inRange(st,u,u.h.rng));}
function cast(st,u){const k=u.h.sk;let t=null;
 if(k.k==='heal'){const L=st.units.filter(v=>dist(u.x,u.y,v.x,v.y)<=k.r&&v.hp<v.h.hp*.8);if(!L.length)return false;for(const v of L){const a=Math.round(v.h.hp*k.m);v.hp=Math.min(v.h.hp,v.hp+a);ev(st,{k:'heal',u:v,v:a});}ev(st,{k:'cast',u,sk:k});return true;}
 if(k.k==='guard'){if(!u.blocking.length)return false;const a=Math.round(u.h.hp*.25);u.hp=Math.min(u.h.hp,u.hp+a);u.blkUp=6;ev(st,{k:'heal',u,v:a});ev(st,{k:'cast',u,sk:k});return true;}
 t=target(st,u);if(!t)return false;ev(st,{k:'cast',u,sk:k,f:t});u.face=Math.sign(t.x-u.x)||u.face;
 if(k.k==='strike'){hit(st,u,t,k.m,{sk:1});if(k.kb&&!t.boss&&t.hp>0){if(t.by){t.by.blocking=t.by.blocking.filter(x=>x!==t);t.by=null;}t.s=Math.max(0,t.s-k.kb);}}
 else if(k.k==='stun'){hit(st,u,t,k.m,{sk:1});t.stun=Math.max(t.stun,t.boss?k.dur*.4:k.dur);}
 else if(k.k==='nova'){const cx=k.at==='foe'?t.x:u.x,cy=k.at==='foe'?t.y:u.y;ev(st,{k:'area',u,x:cx,y:cy,r:k.r});for(const f of st.foes.slice())if(f.hp>0&&dist(cx,cy,f.x,f.y)<=k.r)hit(st,u,f,k.m,{sk:1});}
 else if(k.k==='chain'){const L=inRange(st,u,u.h.rng).sort((a,b)=>b.s-a.s).slice(0,k.cnt);for(const f of L)hit(st,u,f,k.m,{sk:1});}
 else if(k.k==='curse'){for(const f of st.foes.slice())if(f.hp>0&&dist(t.x,t.y,f.x,f.y)<=40){f.curse=k.dur;hit(st,u,f,k.m,{sk:1});}}
 else if(k.k==='slow'){st.fields.push({x:t.x,y:t.y,r:k.r,m:k.m,t:k.dur,u});ev(st,{k:'area',u,x:t.x,y:t.y,r:k.r,slow:1});}
 return true;}
/* ---------- 1 刻み ---------- */
function tick(st){if(st.over)return;const dt=K.STEP;st.t+=dt;
 /* 灯力 */
 st.costAcc+=dt;while(st.costAcc>=K.COST_EVERY){st.costAcc-=K.COST_EVERY;st.cost=Math.min(99,st.cost+1);}
 for(const c of st.deck)if(c.cd>0)c.cd=Math.max(0,c.cd-dt);
 /* WAVE の進み */
 if(st.phase==='gap'){st.gapT-=dt;if(st.gapT<=0)startWave(st);}
 while(st.spawnQ.length&&st.spawnQ[0].t<=st.t){const q=st.spawnQ.shift();spawn(st,q.kind,0,q.lane);}
 if(st.phase==='wave'&&!st.spawnQ.length&&!st.foes.some(f=>f.hp>0)){if(st.wave>=st.S.waves.length-1){end(st,true);return;}st.phase='gap';st.gapT=K.GAP;ev(st,{k:'clear',n:st.wave+1});}
 /* 場の効果 */
 if(st.timeSlow>0)st.timeSlow-=dt;st.fields=st.fields.filter(z=>(z.t-=dt)>0);
 /* 虚蝕：灯の光を削る */
 const nv=st.foes.filter(f=>f.hp>0&&f.tr.includes('void')).length;st.lightR=nv?Math.max(st.r0*.6,st.lightR-1.5*nv*dt):Math.min(st.r0,st.lightR+4*dt);
 if(Math.round(st.t*30)%6===0)lightUpdate(st);
 /* 敵 */
 for(const f of st.foes){if(f.hp<=0)continue;if(f.stun>0){f.stun-=dt;continue;}if(f.curse>0)f.curse-=dt;
  let sk=1;for(const z of st.fields)if(dist(z.x,z.y,f.x,f.y)<=z.r)sk=Math.min(sk,1-z.m);if(st.timeSlow>0)sk=Math.min(sk,.35);
  if(f.ai){f.aiT-=dt;if(f.aiT<=0){f.aiT=f.ai.every;if(f.ai.summon){for(let i=0;i<f.ai.n;i++)spawn(st,f.ai.summon,Math.max(0,f.s-18-i*14),f.lane);ev(st,{k:'summon',f});}}}
  if(f.by&&f.by.hp>0){f.atkT-=dt*sk;if(f.atkT<=0){f.atkT=f.iv;f.actT=st.t;hurt(st,f,f.by);}continue;}
  f.by=null;const s1=f.s+f.spd*sk*dt;
  if(!f.tr.includes('fly'))for(const p of st.pads){const u=p.unit;if(p.k!=='f'||p.lane!==f.lane||!u||u.h.blk<=0)continue;const cap=u.h.blk+(u.blkUp>0?2:0);
   if(f.s<=p.s&&s1>=p.s-1&&u.blocking.length<cap){f.by=u;u.blocking.push(f);break;}}
  if(f.by){const i=f.by.blocking.indexOf(f);f.s=f.by.pad.s-6-i*7;}else f.s=s1;
  const a=at(f.P,f.s);f.x=a.x;f.y=a.y;if(a.dir)f.dir=a.dir;
  if(f.s>=f.P.L){f.hp=0;st.lives-=f.leak;st.leaks+=f.leak;ev(st,{k:'leak',f,n:f.leak});if(st.lives<=0){st.lives=0;end(st,false);return;}}}
 st.foes=st.foes.filter(f=>f.hp>0);
 /* 灯の光弾：灯の近くの、いちばん進んだ敵へ */
 st.lampT-=dt;if(st.lampT<=0){const[bx,by]=st.S.base,L=st.foes.filter(f=>f.hp>0&&dist(bx,by,f.x,f.y)<=st.lampR);if(L.length){hit(st,st.lampU,front(L),1);st.lampT=1;}else st.lampT=.2;}
 /* 仲間 */
 for(const u of st.units.slice()){if(u.hp<=0)continue;if(u.blkUp>0)u.blkUp-=dt;
  let hs=1;for(const v of st.units)if(v!==u&&v.h.sk.haste&&dist(u.x,u.y,v.x,v.y)<=110)hs=1+v.h.sk.haste;
  u.ch+=dt*hs;if(u.ch>=u.h.sk.ch&&cast(st,u)){u.ch=0;u.actT=st.t;}
  u.atkT-=dt;if(u.atkT<=0){const t=target(st,u);if(t){u.atkT=u.h.iv;u.actT=st.t;u.face=Math.sign(t.x-u.x)||u.face;
   if(u.h.splash){ev(st,{k:'area',u,x:t.x,y:t.y,r:u.h.splash,small:1});for(const f of st.foes.slice())if(f.hp>0&&dist(t.x,t.y,f.x,f.y)<=u.h.splash)hit(st,u,f,f===t?1:.6);}
   else hit(st,u,t,1);}else u.atkT=.15;}}
}
function end(st,win){st.over={win,lives:st.lives,t:Math.round(st.t),stars:win?[1,st.lives>=K.LIVES?1:0,st.t<=(st.S.star.time||999)?1:0]:[0,0,0]};ev(st,{k:'end',win});}
/* ---------- 自動の配置（計測と、将来の AUTO 用） ---------- */
function bot(st){if(st.over)return;if(st.phase==='gap'&&st.wave<0&&st.t>2)callWave(st);
 const has=f=>st.units.some(f),ord=st.deck.slice().sort((a,b)=>pr(a)-pr(b));
 function pr(c){if(c.h.lt&&!has(u=>u.h.lt))return 0;if(c.h.role==='guard'&&!has(u=>u.h.role==='guard'))return 1;return 2;}
 for(const c of ord){if(c.on||c.cd>0||st.units.length>=st.cap)continue;if(st.cost<c.h.cost){if(pr(c)<2)break;continue;}
  const L=st.pads.filter(p=>!p.unit&&p.lit&&p.k===c.h.pad);if(!L.length)continue;
  const bl=p=>st.pads.filter(q=>q.k==='f'&&q.lane===p.lane&&q.unit).length*1e4+p.s;
  const p=c.h.pad==='f'?L.reduce((a,p)=>!a||bl(p)<bl(a)?p:a,null):L.reduce((a,p)=>!a||(p.cov[c.h.rng]||0)>(a.cov[c.h.rng]||0)?p:a,null);
  deploy(st,c.id,p.id);break;}
 const can=st.units.length<st.cap&&st.deck.some(c=>!c.on&&c.cd<=0&&st.pads.some(p=>!p.unit&&p.lit&&p.k===c.h.pad));
 if(lampCost(st)&&st.cost>=lampCost(st)+(can?14:0))lampUp(st);
 if(st.star>=K.STAR_MAX&&(st.foes.length>=4||st.foes.some(f=>f.boss))){const u=st.units.find(u=>{const c=st.deck.find(c=>c.on===u);return c&&!c.ult;});if(u)ult(st,u.uid);}}
function run(stageId,deck,lv,seed=1,maxT=900){const st=create(stageId,deck,{lv,seed,prep:3});let n=0;while(!st.over&&st.t<maxT){if(n++%15===0)bot(st);tick(st);st.ev.length=0;}
 return st.over||{win:false,lives:st.lives,t:Math.round(st.t),stars:[0,0,0],timeout:1};}
return{lampUp,lampCost,create,tick,deploy,retreat,ult,canUlt,canDeploy,callWave,bot,run,at,lightUpdate};})();
if(typeof module!=='undefined')module.exports=TDS;
