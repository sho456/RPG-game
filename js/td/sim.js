/* ===== TD の戦闘シミュレーション（TDS）。DOM・時計・描画に触れない純粋なロジック =====
 固定刻み（TDD.K.STEP＝1/30 秒）で tick(st) を呼ぶ。乱数は種つき（同じ種なら同じ結果）。見せ方は st.ev（出来事の列）を js/td/view.js が読む。
 操作：deploy(st,id,x,y)・move(st,uid,x,y)・retreat(st,uid)・aw(st,uid)＝星臨・ult(st,uid)＝奥義・callWave(st)。
 技（ver0.57）：1 人 3 つ（u.h.sks）。それぞれの溜め u.ch[i] が終わると自動で出る（技と技の間は K.GCD 秒あける）。星臨と奥義は手で出す（星片を使う・1 人 1 回ずつ）
 止める（ver0.57）：地上の敵は前衛をすり抜けない。止める数（blk）を超えた敵は後ろに並び、半分の速さで叩く。自動の配置：bot(st)。計測：run(stageId,deck,lv,seed)
 隊形（ver0.55）：台座は無い。置いた場所に一番近い道へ立ち、役割で前衛（守る・斬る＝道の上で止める）と後衛（射る・術・支える＝前衛の後ろ、道の脇）に分かれる。
 キャラは歩く：斬るは近づく敵へ詰め寄り、後衛は前衛の後ろへ下がり、敵に寄られると灯の側へ退く。移動の指示は move
 設計：docs/TD-DESIGN.md（灯域・灯火・灯力・星片・ダメージの式） */
'use strict';
const TDS=(()=>{
const D=typeof TDD!=='undefined'?TDD:require('./data.js');
const K=D.K;
function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
/* ---------- 道（折れ線を距離 s で引く） ---------- */
function mkPath(pts){const seg=[];let L=0;for(let i=0;i<pts.length-1;i++){const[a,b]=pts[i],[c,d]=pts[i+1],l=Math.hypot(c-a,d-b);seg.push({a,b,c,d,l,s0:L});L+=l;}const P={seg,L};
 /* x → s の表（道は左から右へ進むので、x から道の上の距離を引ける） */
 const x0=Math.floor(pts[0][0]),x1=Math.ceil(pts[pts.length-1][0]),xs=new Float32Array(x1-x0+1).fill(-1);
 for(let t=0;t<=L;t+=.5){const i=Math.round(at(P,t).x)-x0;if(i>=0&&i<xs.length&&xs[i]<0)xs[i]=t;}let v=0;for(let i=0;i<xs.length;i++){if(xs[i]<0)xs[i]=v;else v=xs[i];}
 P.x0=x0;P.xs=xs;return P;}
const sOf=(P,x)=>P.xs[Math.max(0,Math.min(P.xs.length-1,Math.round(x)-P.x0))];
function at(P,s){s=Math.max(0,Math.min(P.L,s));for(const g of P.seg)if(s<=g.s0+g.l||g===P.seg[P.seg.length-1]){const k=g.l?(s-g.s0)/g.l:0;return{x:g.a+(g.c-g.a)*k,y:g.b+(g.d-g.b)*k,dir:Math.sign(g.c-g.a)};}return{x:0,y:0,dir:1};}
/* ---------- 作る ---------- */
/* 後衛が立つ高さのずれ：道の脇の、戦場の真ん中の側（2 本・3 本道では道と道の間に立ち、両方の道へ届く）。1 本道と真ん中の道は奥（上） */
const yo=(st,li,line)=>{if(line!=='b')return 0;const y=st.S.paths[li][0][1];return y<296?26:y>304?-26:-24;};
function create(stageId,deck,o={}){let S=D.STAGE[stageId];if(!S)throw new Error('TD: ステージが無い '+stageId);if(S.inf)S=Object.assign({},S,{waves:[]});
 const Ps=S.paths.map(mkPath),P=Ps[0],lvOf=o.lv||{},st={S,P,Ps,t:0,R:rng(o.seed||1),cost:S.cost0??K.COST0,costAcc:0,lives:K.LIVES,star:0,r0:S.light.r,lightR:S.light.r,
  lamp:0,lampT:1,wave:-1,phase:'gap',gapT:o.prep??10,spawnQ:[],foes:[],units:[],fields:[],ev:[],uid:1,over:null,kills:0,leaks:0,timeSlow:0,cap:S.cap||6,infK:1,infA:1,lsrc:[]};
 st.deck=(deck||D.deckOf()).map(id=>({id,h:D.hero(id,lvOf[id]||1,o.real&&o.real[id]),cd:0,on:null,ult:false,aw:false})).filter(c=>c.h);
 st.lampU={id:'lamp',x:S.base[0],y:S.base[1]-110,face:-1,lit:true,h:{name:'灯',atk:0,el:'陽',dmgK:'mag',rng:999,sk:{}}};lampSet(st);
 lightUpdate(st);return st;}
/* ---------- 灯を強める（灯力で 3 段階）：光が広がり、灯の光弾が強くなる ---------- */
const LAMP=[12,18,24];
function lampSet(st){st.lampU.h.atk=Math.round((22+5*st.S.lv)*(1+.4*st.lamp));st.lampR=150+st.lamp*25;}
function lampCost(st){return st.lamp<LAMP.length?LAMP[st.lamp]:0;}
function lampUp(st){const c=lampCost(st);if(!c||st.cost<c||st.over)return c?'灯力が足りない（'+c+' 必要）':'これ以上強められない';st.cost-=c;st.lamp++;const r1=Math.round(st.S.light.r*(1+.15*st.lamp));st.lightR+=r1-st.r0;st.r0=r1;lampSet(st);lightUpdate(st);ev(st,{k:'lamp',n:st.lamp});return'';}
const ev=(st,e)=>{e.at=st.t;st.ev.push(e);};
/* ---------- 灯域：灯の光と、光の中にいる仲間（リオ・ノア）の光の鎖。st.lsrc＝光を出している仲間 ---------- */
function litAt(st,x,y,ex){const[bx,by]=st.S.base;if(dist(x,y,bx,by)<=st.lightR)return true;for(const u of st.lsrc)if(u!==ex&&dist(x,y,u.x,u.y)<=u.h.lt)return true;return false;}
function lightUpdate(st){const[bx,by]=st.S.base,L=st.units.filter(u=>u.h.lt);st.lsrc=[];
 for(let pass=0;pass<4;pass++){let ch=false;for(const u of L){if(st.lsrc.includes(u))continue;if(dist(u.x,u.y,bx,by)<=st.lightR||st.lsrc.some(v=>dist(u.x,u.y,v.x,v.y)<=v.h.lt)){st.lsrc.push(u);ch=true;}}if(!ch)break;}
 for(const u of st.units)u.lit=litAt(st,u.x,u.y);}
/* ---------- 天への塔の無限 WAVE（ステージの inf:1・pool＝雑魚の顔ぶれ・bosses＝5 WAVE ごとのボス） ----------
 n（0 から）の WAVE：雑魚 2〜3 群（数は 8＋n、間隔は詰まっていく）、5 WAVE ごとにボス（bosses を順に）。強さは HP ×1.1^n・攻撃 ×1.035^n（st.infK・infA） */
function infWave(st,n){const S=st.S,R=st.R,pick=a=>a[Math.floor(R()*a.length)],L=st.Ps.length,e=[];
 st.infK=+Math.pow(1.1,n).toFixed(3);st.infA=+Math.pow(1.035,n).toFixed(3);
 const g=n<3?2:3,cnt=Math.min(16,7+n),gap=Math.max(.45,1.05-n*.025);for(let i=0;i<g;i++)e.push([1+i*4,pick(S.pool),cnt,gap,(n+i)%L]);
 if(n%5===4)e.push([2,S.bosses[Math.floor(n/5)%S.bosses.length],1,1,(n>>1)%L]);return{e};}
/* ---------- WAVE ---------- */
function startWave(st){st.wave++;st.phase='wave';if(st.S.inf&&!st.S.waves[st.wave])st.S.waves.push(infWave(st,st.wave));const W=st.S.waves[st.wave];W.e.forEach(([t0,kind,n,gap,lane],j)=>{for(let i=0;i<n;i++)st.spawnQ.push({t:st.t+t0+i*gap,kind,lane:lane??((i+j)%st.Ps.length)});});
 st.spawnQ.sort((a,b)=>a.t-b.t);ev(st,{k:'wave',n:st.wave+1,of:st.S.waves.length,boss:W.e.some(e=>{const f=D.foe(e[1],1);return f&&f.boss;})});}
function callWave(st){if(st.phase!=='gap'||st.over)return false;const b=Math.ceil(st.gapT);if(st.wave>=0)st.cost+=b;ev(st,{k:'call',bonus:st.wave>=0?b:0});startWave(st);return true;}
function spawn(st,kind,s=0,lane=0){const f=D.foe(kind,st.S.lv);if(!f)return null;f.hp=Math.round(f.hp*(f.boss?(st.S.bk||1):(st.S.hk||1))*st.infK);if(st.infA!==1)f.atk=Math.round(f.atk*st.infA);const P=st.Ps[lane]||st.P,a=at(P,s);
 const u=Object.assign(f,{uid:st.uid++,lane,P,mhp:f.hp,s,x:a.x,y:a.y,dir:a.dir,by:null,atkT:f.iv,stun:0,slow:0,curse:0,aiT:f.ai?f.ai.every:0,hitT:-9});if(u.boss&&st.S.gim)u.gim={k:st.S.gim.k,every:st.S.gim.every||10,t:(st.S.gim.every||10)*.6,ch:0};st.foes.push(u);ev(st,{k:'spawn',f:u});return u;}
/* ---------- ダメージ：攻撃 × 倍率 × 攻撃/(攻撃+防御) × 属性 × 会心 ---------- */
/* アビリティ（TDD.abTd）：u.h の crit・critd・pierce・drain・cut・regen・fu、置いている仲間全員へ tatk・tcut（st.tAtk・st.tCut）。奥義の攻撃 +（st.buff） */
function hit(st,u,f,m=1,o={}){if(f.hp<=0)return 0;const H=u.h,A=H.atk*(u.lit?1:K.DARK)*(u.id==='lamp'?1:1+(st.tAtk||0)+(st.buffT>0?st.buff:0)+(u.awT>0?D.AWK.atk:0));let df=H.dmgK==='mag'?f.res:f.def;if(f.curse>0)df*=.6;if(H.pierce)df*=1-H.pierce;
 let v=A*m*A/(A+df);const el0=o.el||u.h.el;
 if(f.tr.includes('ghost'))v*=u.h.dmgK==='phys'?.6:1.25;if(f.tr.includes('armor')&&u.h.dmgK==='phys'&&el0!=='打')v*=.55;
 const el=o.el||u.h.el,weak=f.weak.includes(el),res=f.resist.includes(el);if(weak)v*=1.5;if(res)v*=.5;
 const cr=st.R()<.1+(H.crit||0);if(cr)v*=1.5+(H.critd||0);v=Math.max(1,Math.round(v));f.hp-=v;f.hitT=st.t;if(H.drain&&u.hp>0)u.hp=Math.min(H.hp,u.hp+v*H.drain);
 ev(st,{k:'hit',f,u,v,el,weak,res,cr,sk:!!o.sk,big:!!o.big});if(f.hp<=0)kill(st,f,u);return v;}
function kill(st,f,u){f.hp=0;st.kills++;st.cost+=f.cost+(u&&u.h.thief?1:0);st.star=Math.min(K.STAR_MAX*2,st.star+f.star);
 if(f.tr.includes('void'))st.lightR=Math.min(st.r0,st.lightR+10);if(f.by){f.by.blocking=f.by.blocking.filter(x=>x!==f);f.by=null;}ev(st,{k:'kill',f,u});}
function hurt(st,f,u){const v=Math.max(1,Math.round(f.atk*f.atk/(f.atk+u.h.def)*(1-Math.min(.6,(u.h.cut||0)+(st.tCut||0)))));u.hp-=v;ev(st,{k:'hurt',u,v,f});if(u.hp<=0)fall(st,u);}
function release(u){for(const f of u.blocking)f.by=null;u.blocking=[];}
function fall(st,u){u.hp=0;release(u);st.units=st.units.filter(x=>x!==u);const c=st.deck.find(c=>c.on===u);if(c){c.on=null;c.cd=Math.round(u.h.redeploy*1.5);}ev(st,{k:'fall',u});lightUpdate(st);}
/* ---------- 操作：置く・動かす ---------- */
/* (x, y) に一番近い道と、その道の上の距離 s */
function spot(st,x,y){let li=0,bd=1e9;st.Ps.forEach((P,i)=>{const d=Math.abs(at(P,sOf(P,x)).y-y);if(d<bd){bd=d;li=i;}});const P=st.Ps[li];return{li,P,s:Math.max(20,Math.min(P.L-26,sOf(P,x)))};}
function canDeploy(st,id,x,y){const c=st.deck.find(c=>c.id===id);
 if(!c||st.over)return'なし';if(c.on)return'配置済み';if(c.cd>0)return'再配置まで '+Math.ceil(c.cd)+' 秒';if(st.cost<c.h.cost)return'灯力が足りない';
 if(st.units.length>=st.cap)return'配置の上限';if(x==null)return'';const p=spot(st,x,y),a=at(p.P,p.s);if(!litAt(st,a.x,a.y))return'灯の光が届いていない';return'';}
function deploy(st,id,x,y){const why=canDeploy(st,id,x,y);if(why)return why;const c=st.deck.find(c=>c.id===id),p=spot(st,x,y),h=c.h;
 st.cost-=h.cost;const u={uid:st.uid++,id,h,hp:h.hp,lane:p.li,P:p.P,s:p.s,home:p.s,ts:p.s,yo:yo(st,p.li,h.line),x:0,y:0,atkT:.4,ch:h.sks.map((k,i)=>k.ch*(.35-.12*i)),gcd:0,awT:0,onP:true,blocking:[],blkUp:0,lit:true,face:-1,actT:-9,mv:0};
 c.on=u;st.units.push(u);form(st);const a=at(u.P,u.ts);u.x=a.x;u.y=a.y+u.yo;u.s=u.ts;if(h.line==='b')u.home=u.ts;lightUpdate(st);ev(st,{k:'deploy',u});return'';}
/* 動かす：その場所へ歩く（別の道へも）。止めていた敵は放す */
function move(st,uid,x,y){const u=st.units.find(u=>u.uid===uid);if(!u||st.over)return'なし';const p=spot(st,x,y),a=at(p.P,p.s);
 if(!litAt(st,a.x,a.y))return'灯の光が届いていない';release(u);u.lane=p.li;u.P=p.P;u.home=p.s;u.yo=yo(st,p.li,u.h.line);form(st);ev(st,{k:'move',u,x:a.x,y:a.y+u.yo});return'';}
/* 隊形：道ごとに、前衛はそれぞれの持ち場（home）、後衛は一番前の前衛の後ろ（役割の間合い off）。後衛どうしは 16 ずつ離す */
function form(st){st.tAtk=0;st.tCut=0;for(const u of st.units){st.tAtk+=u.h.tatk||0;st.tCut+=u.h.tcut||0;}for(let li=0;li<st.Ps.length;li++){const U=st.units.filter(u=>u.lane===li),F=U.filter(u=>u.h.line==='f'),fr=F.length?Math.min(...F.map(u=>u.home)):null;
 for(const u of F)u.ts=u.home;let last=-1e9;
 for(const o of U.filter(u=>u.h.line==='b').map(u=>({u,s:fr==null?u.home:Math.max(u.home,fr+u.h.off)})).sort((a,b)=>a.s-b.s)){o.s=Math.min(o.u.P.L-20,Math.max(o.s,last+16));last=o.s;o.u.ts=o.s;}}}
/* 歩く：斬るは間合い（chase）の中の敵へ詰め寄る（光の外へは出ない）。後衛は止められていない敵に寄られると灯の側へ退く。止めている間は動かない */
function walk(st,dt){for(const u of st.units){let ts=u.ts;
 if(u.h.line==='f'){if(u.blocking.length){u.mv=0;continue;}
  if(u.h.chase){let b=null;for(const f of st.foes)if(f.hp>0&&f.lane===u.lane&&!f.tr.includes('fly')&&f.s<u.s+4&&u.home-f.s<=u.h.chase&&(!b||f.s>b.s))b=f;if(b){ts=Math.max(b.s+6,u.home-u.h.chase);const q=at(u.P,ts);if(!litAt(st,q.x,q.y,u))ts=u.home;}}}
 else if(st.foes.some(f=>f.hp>0&&f.lane===u.lane&&!f.by&&f.s<=u.s&&u.s-f.s<34))ts=Math.min(u.P.L-20,u.s+40);
 const a=at(u.P,ts),tx=a.x,ty=a.y+u.yo,d=dist(u.x,u.y,tx,ty);
 if(d<.5){u.x=tx;u.y=ty;u.mv=0;}else{const m=Math.min(d,u.h.mv*dt);u.x+=(tx-u.x)/d*m;u.y+=(ty-u.y)/d*m;u.mv=1;if(Math.abs(tx-u.x)>.5)u.face=Math.sign(tx-u.x);}
 u.s=sOf(u.P,u.x);u.onP=Math.abs(u.y-u.yo-at(u.P,u.s).y)<5;}}
function retreat(st,uid){const u=st.units.find(u=>u.uid===uid);if(!u)return false;st.cost+=Math.floor(u.h.cost/2);release(u);
 st.units=st.units.filter(x=>x!==u);const c=st.deck.find(c=>c.on===u);if(c){c.on=null;c.cd=u.h.redeploy;}ev(st,{k:'retreat',u});lightUpdate(st);return true;}
function canUlt(st,uid){const u=st.units.find(u=>u.uid===uid),c=u&&st.deck.find(c=>c.on===u);return!!(u&&c&&!c.ult&&st.star>=K.STAR_MAX&&!st.over);}
/* 星臨：星片 K.AW。AWK.dur 秒のあいだ攻撃が上がり、技の溜めが速くなる。出した時に HP を回復 */
function canAw(st,uid){const u=st.units.find(u=>u.uid===uid),c=u&&st.deck.find(c=>c.on===u);return!!(u&&c&&!c.aw&&st.star>=K.AW&&!st.over);}
function aw(st,uid){if(!canAw(st,uid))return false;const u=st.units.find(u=>u.uid===uid),c=st.deck.find(c=>c.on===u),A=D.AWK;c.aw=true;st.star-=K.AW;u.awT=A.dur;u.actT=st.t;
 const a=Math.round(u.h.hp*A.heal);u.hp=Math.min(u.h.hp,u.hp+a);ev(st,{k:'aw',u});ev(st,{k:'heal',u,v:a});return true;}
function ult(st,uid){if(!canUlt(st,uid))return false;const u=st.units.find(u=>u.uid===uid),c=st.deck.find(c=>c.on===u),U=u.h.ult;c.ult=true;st.star-=K.STAR_MAX;u.actT=st.t;
 const live=st.foes.filter(f=>f.hp>0),am=u.awT>0?D.AWK.ou:1,extra=L=>{for(const f of L){if(f.hp<=0)continue;if(U.stun)f.stun=Math.max(f.stun,f.boss?U.stun*.4:U.stun);if(U.curse)f.curse=Math.max(f.curse,U.curse);}
  if(U.heal)for(const v of st.units){const a=Math.round(v.h.hp*U.heal);v.hp=Math.min(v.h.hp,v.hp+a);ev(st,{k:'heal',u:v,v:a});}if(U.buff){st.buff=U.buff;st.buffT=8;}};
 if(U.k==='uheal'){for(const v of st.units)v.hp=v.h.hp;st.lives=Math.min(K.LIVES,st.lives+1);st.lightR=st.r0;lightUpdate(st);ev(st,{k:'ult',u,x:u.x,y:u.y,r:999});return true;}
 if(U.k==='utime'){st.timeSlow=U.dur;ev(st,{k:'ult',u,x:u.x,y:u.y,r:999});for(const f of st.foes.slice())hit(st,u,f,U.m*.5*am,{sk:1,big:1});return true;}
 if(U.k==='upct'){ev(st,{k:'ult',u,x:u.x,y:u.y,r:999});for(const f of live){const v=Math.max(1,Math.round(f.hp*Math.min(.9,(f.boss?U.b:U.v)*am)));f.hp-=v;f.hitT=st.t;ev(st,{k:'hit',f,u,v,el:'陰',weak:false,res:false,cr:false,sk:true,big:true});if(f.hp<=0)kill(st,f,u);}return true;}
 if(!live.length){ev(st,{k:'ult',u,x:u.x,y:u.y,r:U.r});extra([]);return true;}
 let best=live[0],bn=-1;for(const f of live){const n=live.filter(g=>dist(f.x,f.y,g.x,g.y)<=U.r).length+(f.boss?2:0);if(n>bn){bn=n;best=f;}}
 const cx=best.x,cy=best.y,L=live.filter(f=>dist(cx,cy,f.x,f.y)<=U.r);ev(st,{k:'ult',u,x:cx,y:cy,r:U.r});for(const f of L)hit(st,u,f,U.m*am,{sk:1,big:1});extra(L);return true;}
/* ---------- 技 ---------- */
const inRange=(st,u,r)=>st.foes.filter(f=>f.hp>0&&dist(u.x,u.y,f.x,f.y)<=r);
const rem=f=>f.P.L-f.s,front=L=>L.reduce((a,f)=>!a||rem(f)<rem(a)?f:a,null);
function target(st,u){if(u.blocking.length)return front(u.blocking);return front(inRange(st,u,u.h.rng));}
function cast(st,u,k){let t=null;
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
/* ---------- ボスの仕掛け（ステージの gim：{k, every}）。true を返すとその刻みは動かない ----------
 charge：灯の光の中に入ると、3 秒溜めて灯を撃つ（灯火 −1）。止められていれば撃たれるのは止めている仲間（攻撃の 3 倍）。気絶で溜めが消える
 shift：別の道へ移る（止めていた仲間から外れる）／drain：灯の光を元の 18% ぶん削る */
function gimmick(st,f,dt){const G=f.gim;
 if(G.ch>0){G.ch-=dt;if(G.ch<=0){if(f.by&&f.by.hp>0){const u=f.by,v=Math.round(f.atk*3*f.atk/(f.atk+u.h.def));u.hp-=v;ev(st,{k:'beam',f,u,v});if(u.hp<=0)fall(st,u);}
   else{st.lives-=1;st.leaks+=1;ev(st,{k:'beam',f});if(st.lives<=0){st.lives=0;end(st,false);}}}return true;}
 G.t-=dt;if(G.t>0)return false;
 if(G.k==='charge'&&dist(f.x,f.y,st.S.base[0],st.S.base[1])>st.lightR){G.t=.5;return false;}/* 溜めは灯の光の中に入ってから */
 G.t=G.every;
 if(G.k==='charge'){G.ch=3;ev(st,{k:'charge',f});return true;}
 if(G.k==='shift'&&st.Ps.length>1){const r=f.s/f.P.L;if(f.by){f.by.blocking=f.by.blocking.filter(x=>x!==f);f.by=null;}f.lane=(f.lane+1)%st.Ps.length;f.P=st.Ps[f.lane];f.s=r*f.P.L;
  const a=at(f.P,f.s);f.x=a.x;f.y=a.y;ev(st,{k:'shift',f});return false;}
 if(G.k==='drain'){st.lightR=Math.max(st.r0*.5,st.lightR-st.r0*.18);lightUpdate(st);ev(st,{k:'drain',f});}
 return false;}
/* 追撃（アビリティ）：技のあと（sk）か攻撃のあと、確率で狙いへもう 1 撃 */
function follow(st,u,isSk,t){for(const F of u.h.fu||[]){if(!!F.sk!==!!isSk)continue;const f=t&&t.hp>0?t:target(st,u);if(f&&st.R()<F.p)hit(st,u,f,F.pow,{el:F.el||undefined});}}
/* ---------- 1 刻み ---------- */
function tick(st){if(st.over)return;const dt=K.STEP;st.t+=dt;
 /* 灯力 */
 st.costAcc+=dt;while(st.costAcc>=K.COST_EVERY){st.costAcc-=K.COST_EVERY;st.cost=Math.min(99,st.cost+1);}
 for(const c of st.deck)if(c.cd>0)c.cd=Math.max(0,c.cd-dt);
 /* WAVE の進み */
 if(st.phase==='gap'){st.gapT-=dt;if(st.gapT<=0)startWave(st);}
 while(st.spawnQ.length&&st.spawnQ[0].t<=st.t){const q=st.spawnQ.shift();spawn(st,q.kind,0,q.lane);}
 if(st.phase==='wave'&&!st.spawnQ.length&&!st.foes.some(f=>f.hp>0)){if(!st.S.inf&&st.wave>=st.S.waves.length-1){end(st,true);return;}st.phase='gap';st.gapT=K.GAP;ev(st,{k:'clear',n:st.wave+1});}
 /* 場の効果 */
 if(st.timeSlow>0)st.timeSlow-=dt;if(st.buffT>0)st.buffT-=dt;st.fields=st.fields.filter(z=>(z.t-=dt)>0);
 /* 虚蝕：灯の光を削る */
 const nv=st.foes.filter(f=>f.hp>0&&f.tr.includes('void')).length;st.lightR=nv?Math.max(st.r0*.6,st.lightR-1.5*nv*dt):Math.min(st.r0,st.lightR+4*dt);
 if(Math.round(st.t*30)%6===0)lightUpdate(st);
 /* 敵 */
 for(const f of st.foes){if(f.hp<=0)continue;if(f.stun>0){f.stun-=dt;if(f.gim&&f.gim.ch>0){f.gim.ch=0;ev(st,{k:'gcancel',f});}continue;}if(f.curse>0)f.curse-=dt;
  let sk=1;for(const z of st.fields)if(dist(z.x,z.y,f.x,f.y)<=z.r)sk=Math.min(sk,1-z.m);if(st.timeSlow>0)sk=Math.min(sk,.35);
  if(f.ai){f.aiT-=dt;if(f.aiT<=0){f.aiT=f.ai.every;if(f.ai.summon){for(let i=0;i<f.ai.n;i++)spawn(st,f.ai.summon,Math.max(0,f.s-18-i*14),f.lane);ev(st,{k:'summon',f});}}}
  if(f.gim&&gimmick(st,f,dt*sk))continue;
  if(f.by&&f.by.hp>0){const i=f.by.blocking.indexOf(f),cap=f.by.h.blk+(f.by.blkUp>0?2:0);f.s=f.by.s-6-Math.min(i,cap)*7-Math.max(0,i-cap)*5;
   f.atkT-=dt*sk*(i<cap?1:.8);if(f.atkT<=0){f.atkT=f.iv;f.actT=st.t;hurt(st,f,f.by);}const a=at(f.P,f.s);f.x=a.x;f.y=a.y;continue;}
  f.by=null;const s1=f.s+f.spd*sk*dt;
  /* 前衛をすり抜けない：道の上の前衛に触れたら、止める数を超えていても後ろに並ぶ */
  if(!f.tr.includes('fly'))for(const u of st.units){if(u.lane!==f.lane||u.h.blk<=0||u.onP===false||u.hp<=0)continue;
   if(f.s<=u.s+4&&s1>=u.s-8){f.by=u;u.blocking.push(f);break;}}
  if(f.by){const i=f.by.blocking.indexOf(f),cap=f.by.h.blk+(f.by.blkUp>0?2:0);f.s=f.by.s-6-Math.min(i,cap)*7-Math.max(0,i-cap)*5;}else{f.s=s1;
   /* すれ違いざまに後衛を叩く（前衛が抜かれると後衛が削られる） */
   const v=st.units.find(u=>u.h.line==='b'&&u.lane===f.lane&&Math.abs(u.s-f.s)<12);if(v){f.atkT-=dt*sk;if(f.atkT<=0){f.atkT=f.iv;f.actT=st.t;hurt(st,f,v);}}}
  const a=at(f.P,f.s);f.x=a.x;f.y=a.y;if(a.dir)f.dir=a.dir;
  if(f.s>=f.P.L){f.hp=0;st.lives-=f.leak;st.leaks+=f.leak;ev(st,{k:'leak',f,n:f.leak});if(st.lives<=0){st.lives=0;end(st,false);return;}}}
 st.foes=st.foes.filter(f=>f.hp>0);
 /* 灯の光弾：灯の近くの、いちばん進んだ敵へ */
 st.lampT-=dt;if(st.lampT<=0){const[bx,by]=st.S.base,L=st.foes.filter(f=>f.hp>0&&dist(bx,by,f.x,f.y)<=st.lampR);if(L.length){hit(st,st.lampU,front(L),1);st.lampT=1;}else st.lampT=.2;}
 /* 仲間：隊形 → 歩く → 技と攻撃 */
 form(st);walk(st,dt);
 for(const u of st.units.slice()){if(u.hp<=0)continue;if(u.blkUp>0)u.blkUp-=dt;
  let hs=1;for(const v of st.units)if(v!==u&&v.h.haste&&dist(u.x,u.y,v.x,v.y)<=110)hs=1+v.h.haste;
  if(u.awT>0){u.awT-=dt;hs*=D.AWK.ch;}
  if(u.h.regen&&u.hp<u.h.hp)u.hp=Math.min(u.h.hp,u.hp+u.h.hp*u.h.regen*dt/3);
  /* 技 3 つ：溜めが終わった技から自動で出す（技と技の間は K.GCD 秒） */
  u.gcd-=dt;const SK=u.h.sks;for(let i=0;i<SK.length;i++){if(u.ch[i]<SK[i].ch)u.ch[i]=Math.min(SK[i].ch,u.ch[i]+dt*hs);}
  if(u.gcd<=0)for(let i=0;i<SK.length;i++)if(u.ch[i]>=SK[i].ch&&cast(st,u,SK[i])){u.ch[i]=0;u.gcd=K.GCD;u.actT=st.t;follow(st,u,1);break;}
  u.atkT-=dt;if(u.atkT<=0){const t=target(st,u);if(t){u.atkT=u.h.iv;u.actT=st.t;u.face=Math.sign(t.x-u.x)||u.face;
   if(u.h.splash){ev(st,{k:'area',u,x:t.x,y:t.y,r:u.h.splash,small:1});for(const f of st.foes.slice())if(f.hp>0&&dist(t.x,t.y,f.x,f.y)<=u.h.splash)hit(st,u,f,f===t?1:.6);}
   else hit(st,u,t,1);follow(st,u,0,t);}else{u.atkT=.15;if(!u.mv)u.face=-1;}}}
}
function end(st,win){st.over={win,lives:st.lives,t:Math.round(st.t),wave:st.S.inf?Math.max(0,st.wave):st.wave+1,stars:win?[1,st.lives>=K.LIVES?1:0,st.t<=(st.S.star.time||999)?1:0]:[0,0,0]};ev(st,{k:'end',win});}
/* ---------- 自動の配置（計測と、将来の AUTO 用） ----------
 前衛：前衛の少ない道へ。光の届く一番前から光の半径の 0.25（守る。敵はすり抜けないので守るが前）・0.4（斬る）内側（虚蝕に光を削られても光の中に残る）。同じ役割がいればその後ろ 22。後衛：前衛の多い道（隊形で前衛の後ろへ並ぶ） */
function frontier(st,li){const P=st.Ps[li];for(let s=20;s<P.L;s+=6){const a=at(P,s);if(litAt(st,a.x,a.y))return s;}return P.L-30;}
function bot(st){if(st.over)return;if(st.phase==='gap'&&st.wave<0&&st.t>2)callWave(st);
 const has=f=>st.units.some(f),ord=st.deck.slice().sort((a,b)=>pr(a)-pr(b));
 function pr(c){if(c.h.lt&&!has(u=>u.h.lt))return 0;if(c.h.role==='guard'&&!has(u=>u.h.role==='guard'))return 1;return 2;}
 const nF=li=>st.units.filter(u=>u.lane===li&&u.h.line==='f').length,nB=li=>st.units.filter(u=>u.lane===li&&u.h.line==='b').length,lanes=st.Ps.map((_,i)=>i);
 for(const c of ord){if(c.on||c.cd>0||st.units.length>=st.cap)continue;if(st.cost<c.h.cost){if(pr(c)<2)break;continue;}
  let li,s;if(c.h.line==='f'){li=lanes.reduce((a,i)=>nF(i)<nF(a)?i:a,0);const g=c.h.role==='guard',F=st.units.filter(u=>u.lane===li&&u.h.line==='f'&&(u.h.role==='guard')===g);
   s=F.length?Math.min(...F.map(u=>u.home))+22:frontier(st,li)+Math.round(st.r0*(g?.25:.4));}
  else{li=lanes.reduce((a,i)=>nF(i)-nB(i)>nF(a)-nB(a)?i:a,0);s=frontier(st,li)+30;}
  const a=at(st.Ps[li],s);if(deploy(st,c.id,a.x,a.y))continue;break;}
 const can=st.units.length<st.cap&&st.deck.some(c=>!c.on&&c.cd<=0);
 if(lampCost(st)&&st.cost>=lampCost(st)+(can?14:0))lampUp(st);
 const busy=st.foes.length>=4||st.foes.some(f=>f.boss);
 if(st.star>=K.STAR_MAX&&busy){const u=st.units.find(u=>{const c=st.deck.find(c=>c.on===u);return c&&!c.ult;});if(u)ult(st,u.uid);}
 /* 星臨は奥義のぶんを残して（星片が奥義＋星臨ぶんあるとき） */
 if(st.star>=K.STAR_MAX+K.AW&&busy){const u=st.units.find(u=>canAw(st,u.uid));if(u)aw(st,u.uid);}}
function run(stageId,deck,lv,seed=1,maxT=900){const st=create(stageId,deck,{lv,seed,prep:3});let n=0;while(!st.over&&st.t<maxT){if(n++%15===0)bot(st);tick(st);st.ev.length=0;}
 return st.over||{win:false,lives:st.lives,t:Math.round(st.t),stars:[0,0,0],timeout:1};}
return{yo,infWave,lampUp,lampCost,create,tick,deploy,move,retreat,ult,canUlt,aw,canAw,canDeploy,callWave,bot,run,at,sOf,spot,litAt,frontier,lightUpdate};})();
if(typeof module!=='undefined')module.exports=TDS;
