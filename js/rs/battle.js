/* ===== ver0.37 戦闘システム刷新（戦闘の進行）=====
 RS 式のターン制に置き換える（旧来の CT＝行動時間の順番待ちは使わない）。
  1. ターンの始め：BP 回復・アビリティの継続回復など
  2. コマンド入力：味方全員の行動を先に決める（星臨は入力中に発動。OD ゲージが満タンならオーバードライブ）
  3. 行動：素早さ順（±10% のゆらぎ・先制／後発の技・アビリティの行動順）。敵も同じ列に並ぶ
     ・味方が続けて攻撃すると「連携」：2 人目からダメージが伸びる。敵の行動・攻撃以外の行動で途切れる
     ・オーバードライブ：そのターンは味方全員が敵より先に、続けて行動する（必ず連携・ダメージ+20%）
     ・遅延（盾撃・影縫いなど）：まだ動いていなければその列の最後へ、動いた後なら次のターンの最後へ
  4. ターンの終わり：星臨の残りターン・挑発の経過
 演出（ver0.19〜0.36 の振り付け・エフェクト）は既存の doAction / hit / enemyTurn をそのまま通す。
 ダメージ計算は既存の calc に、アビリティ・連携・OD・技の熟練の倍率を外側から掛ける */
'use strict';
const RSB=(()=>{
const D=RSD,C=RSC;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const inB=()=>scene==='battle'&&!!B&&!B.over;

/* ==================== 効果（アビリティ・陣形・星臨アビリティ） ==================== */
function effs(u){if(!u||u.side!==0)return[];const L=u.rsE||[];return u.aw?L.concat(u._awE||(u._awE=C.awEffects(u.id))):L;}
function sumE(u,t,pred){let s=0;for(const e of effs(u))if(e.t===t&&(!pred||pred(e)))s+=+e.v||0;return s;}
const hasDebuff=t=>(t.sts||[]).some(s=>{try{return!V20.isBuff(s);}catch(e){return false;}});
function cnd(c,a,t,sk,r){if(!c||c==='any')return true;
 if(c.startsWith('el:'))return!!(sk&&sk.el&&c.slice(3).split('|').includes(sk.el));
 switch(c){
  case'phys':return!!sk&&(sk.k==='phys'||sk.k==='rhythm'||(!!sk.basic&&sk.k!=='mag'));
  case'mag':return!!sk&&sk.k==='mag';
  case'basic':return!!sk&&!!sk.basic;case'skill':return!!sk&&!sk.basic;
  case'weak':return!!(t&&sk&&sk.el&&t.weak&&t.weak.includes(sk.el));
  case'weakmag':return!!(sk&&sk.k==='mag'&&t&&sk.el&&t.weak&&t.weak.includes(sk.el));
  case'single':return!!sk&&(sk.t==='one'||!!sk.basic);case'aoe':return!!sk&&sk.t==='all';
  case'multi':return!!sk&&((sk.hits||1)>1||sk.k==='rhythm');
  case'hpfull':return a.hp>=a.mhp;case'hplow':return a.hp<=a.mhp*.5;case'hphigh':return a.hp>=a.mhp*.5;
  case'tlow':return!!t&&t.hp<=t.mhp*.3;case'tfull':return!!t&&t.hp>=t.mhp;case'boss':return!!t&&!!t.boss;
  case'debuffed':return!!t&&hasDebuff(t);
  case'allyaw':return!!B&&B.heroes.some(h=>h!==a&&h.aw&&h.alive);case'aw':return!!a.aw;
  case'altel':return!!(sk&&sk.k==='mag'&&sk.el&&a._rsLe&&a._rsLe!==sk.el);
  case'crit':return!!(r&&r.crit);}
 return false;}
/* 旧来のパッシブ（武器・レジェンド装備）のイベントを呼ぶ（V20 の each と同じ） */
function psEach(u,ev,...a){for(const p of(u.ps20||[])){const P=V20.PS[p.id];if(P&&P[ev]){try{P[ev](u,...a,p.v);}catch(e){console.error(e);}}}}

/* ==================== OD・連携 ==================== */
function addOD(v,u){if(!B||!B.rs||!(v>0))return;const m=u?(u.odMul||1)*(1+sumE(u,'od')/100):1;B.rs.od=clamp(B.rs.od+v*m,0,D.OD.max);}
const isDmg=sk=>!!sk&&(!!sk.basic||['phys','mag','rhythm','pct','reso'].includes(sk.k));
const chainMul=(n,u)=>n>=2?D.CHAIN[Math.min(5,n)]*(1+sumE(u,'chain')/100):1;

/* ==================== ダメージ計算・命中・被弾 ==================== */
{const _c=calc;calc=function(a,t,sk){if(!B||!B.rs||!a||!t||!sk)return _c(a,t,sk);
 let cb=0,pi=0,d0=null;
 if(a.side===0){cb=sumE(a,'crit',e=>cnd(e.c,a,t,sk))+(sk.crit||0);pi=Math.min(80,sumE(a,'pierce'));}
 if(cb)a.crit=(a.crit||0)+cb;if(pi>0){d0=[t.def,t.res];t.def=Math.round(t.def*(1-pi/100));t.res=Math.round(t.res*(1-pi/100));}
 let r;try{r=_c(a,t,sk);}finally{if(cb)a.crit-=cb;if(d0){t.def=d0[0];t.res=d0[1];}}
 try{let m=1;
  if(a.side===0){m*=1+sumE(a,'dmg',e=>cnd(e.c,a,t,sk,r))/100;
   for(const e of effs(a))if(e.t==='stack'){const n=e.c==='same'?(a._rsSameT===t?a._rsSameN||0:0):(a._rsHeat||0);m*=1+Math.min(e.max||5,n)*e.v/100;}
   const rg=effs(a).find(e=>e.t==='rage');if(rg)m*=1+Math.min(rg.max||5,a._rsRage||0)*rg.v/100;
   for(const h of B.heroes)if(h!==a&&h.alive)m*=1+sumE(h,'allydmg')/100;
   if(r.crit){const cd=sumE(a,'critd');if(cd)m*=1+cd/150;}
   const cur=B.rs.cur;if(cur&&cur.u===a)m*=cur.mul;
   if(sk.ougi)m*=1+(a.ougiUp||0)/100;}
  if(t.side===0){const cut=sumE(t,'cut',e=>cnd(e.c,t,a,sk));m*=Math.max(.2,1-cut/100);}
  if(m!==1)r.d=Math.max(1,Math.round(r.d*m));}catch(e){console.error(e);}
 B.rs.lastR=r;return r;};}
{const _hit=hit;hit=async function(a,t,sk){if(!B||!B.rs||!a||!t)return _hit(a,t,sk);const was=t.alive,myB=B;B.rs.lastR=null;
 const d=await _hit(a,t,sk);if(B!==myB||!B.rs)return d;
 try{const r=B.rs.lastR||{};
  if(a.side===0&&t.side===1){const cur=B.rs.cur;
   if(r.weak){addOD(D.OD.weak,a);if(cur)cur.weak=true;}
   if(!sk._fu&&cur&&cur.u===a&&!cur.hitSet.has(t)){cur.hitSet.add(t);onHit(a,t,sk,r);}
   if(d>0){const dr=sumE(a,'drain');if(dr&&a.alive&&a.hp<a.mhp){const v=Math.max(1,Math.round(d*dr/100));a.hp=Math.min(a.mhp,a.hp+v);}
    if(a._rsSameT===t)a._rsSameN=(a._rsSameN||0)+(sk._fu?0:0);}
   if(was&&!t.alive)onKill(a,t);}
 }catch(e){console.error(e);}
 return d;};}
function onHit(a,t,sk,r){if(!t.alive)return;
 for(const e of effs(a)){if(!cnd(e.c,a,t,sk,r))continue;
  if(e.t==='onhit'){const st=['atk','def','mag','res','spd'].includes(e.k),p=st?1:Math.min(1,(e.p||0)*(a.ailMul||1));if(Math.random()<p)V20.addSt(t,e.k,e.v,e.d||2);}
  if(e.t==='delay'&&Math.random()<(e.p||0)*(a.ailMul||1)){t.ct=(t.ct||0)+40/Math.max(1,t.spd);pop(t,'DELAY','#7fd6ff',true);}}}
function onKill(a,t){for(const e of effs(a))if(e.t==='kill'){if(e.bp)a._rsBpGain=(a._rsBpGain||0)+e.bp;if(e.hp&&a.alive){const v=Math.round(a.mhp*e.hp/100);a.hp=Math.min(a.mhp,a.hp+v);pop(a,'+'+v,'#7dffa8',true);}}}
{const _h=hurt;hurt=function(t,d){if(!B||!B.rs||!t)return _h(t,d);const a=B._atk20,sk=B._sk20;
 if(t.side===0&&t.alive&&d>0&&a&&a.side===1){const dg=sumE(t,'dodge',e=>cnd(e.c,t,a,sk));if(dg>0&&Math.random()*100<dg){setTimeout(()=>pop(t,'MISS','#ffffff',true),50);return 0;}}
 const r=_h(t,d);
 try{if(t.side===0&&r>0){
   if(t.hp<=0&&!t._rsGuts&&sumE(t,'guts')>0){t._rsGuts=1;t.hp=1;setTimeout(()=>pop(t,'こらえた！','#ffe27a',true),80);}
   addOD(r/t.mhp*D.OD.hurt);
   const rg=effs(t).find(e=>e.t==='rage');if(rg&&t.alive)t._rsRage=Math.min(rg.max||5,(t._rsRage||0)+1);
   if(a&&a.side===1&&a.alive&&t.hp>0&&sk&&sk.t==='one'&&!sk._fu)for(const e of effs(t))if(e.t==='counter'&&Math.random()<(e.p||0)){B.rs.cq.push({a:t,t:a,pow:e.pow||1});break;}}}catch(e){console.error(e);}
 return r;};}
/* 反撃・追撃 */
async function strikeBack(a,t,nm,pow,el){if(!a.alive||!B)return;let tg=t&&t.alive?t:aliveE().sort((x,y)=>x.hp-y.hp)[0];if(!tg)return;
 pop(a,nm,'#ffe27a',true,'st20 fu');await wait(140);try{const[x,y]=V19.mid(tg);FX19.slash(x,y,ELC[el]||'#ffffff',{size:1});}catch(e){}
 await hit(a,tg,{n:nm,el:el||a.atkEl||a.elem||'斬',k:MAG(a.id)?'mag':'phys',pow,t:'one',_fu:1});await wait(160);}
async function drainCounters(){const q=B&&B.rs?B.rs.cq:[];let n=0;while(q.length&&n<4&&B&&!B.over&&aliveE().length){const c=q.shift();n++;if(!c.a.alive||!c.t.alive)continue;await strikeBack(c.a,c.t,'反撃',c.pow);}if(B&&B.rs)B.rs.cq=[];}

/* ==================== 敵の狙い ==================== */
pickHero=function(){const hs=aliveH();const g=hs.find(h=>h.id==='gald'&&h.aw);if(g)return g;
 const w=hs.map(h=>1+(h.taunt>0?6:0)+sumE(h,'taunt')*1.5);let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<hs.length;i++){if((r-=w[i])<0)return hs[i];}return hs[0];};

/* ==================== 星臨 ==================== */
{const _aw=awaken;awaken=async function(u){const res=B&&B.res;if(B)B.res=null;/* ヴァルクの旧仕様（自動行動）を止める */
 try{await _aw(u);}finally{if(B&&res&&!B.res)B.res=res;}
 if(!B||!B.rs||u.side!==0)return;u.ag=0;u.awT=0;u._rsOugi=0;u._awE=null;
 const X=D.AWX[u.id];
 try{for(const e of C.awEffects(u.id))if(e.t==='onaw'){const tg=e.on==='enemies'?aliveE():e.on==='allies'?aliveH():[u];tg.forEach(x=>V20.addSt(x,e.k,e.v,e.d));}
  if(u.id==='shion')aliveE().forEach(e=>{e._rsLate=1;});
  if(X)log(`<b>${u.name}、星臨――「${AW[u.id].name}」</b>　${D.AWX[u.id]?`奥義「${SK[X.ou].n}」が使える`:''}`);}catch(e){console.error(e);}
 refresh();};}
const awLeft=u=>Math.max(0,awN(u)-(u.awT||0));
/* 共鳴技の発動条件は従来どおり（星臨中の 2 人） */

/* ==================== ひらめき・熟練 ==================== */
function glimmer(u,sk){if(!sk||sk.basic||sk.ougi||u.side!==0)return null;const k=C.keyOf(sk);if(!k)return null;const h=G.h[u.id];if(!h)return null;
 for(const[id,how,lv]of D.LEARN[u.id]||[]){if(how!=='glim')continue;const g=SK[id].glim;if(!g||g.from!==k||h.lv<lv||h.glim.includes(id))continue;
  const boss=aliveE().some(e=>e.boss),p=(g.p||.08)*(boss?2:1)*(DEV()?5:1);if(Math.random()<p){h.glim.push(id);try{save();}catch(e){}return SK[id];}}
 return null;}
async function glimShow(u,sk){banner('ひらめき！',`${u.name}は「${sk.n}」を閃いた！`,'glim');SFX.weak();pop(u,'💡','#ffe27a',true);log(`<b>💡 ${u.name}は「${sk.n}」を閃いた！</b>`);await wait(700);}
function addProf(u,sk){if(u.side!==0||!sk||sk.basic||sk.k==='item'||sk.k==='reso')return;const k=C.keyOf(sk);if(!k||!D.NEW[k])return;const h=G.h[u.id];if(!h)return;
 const l0=C.profLv(u.id,k);h.skx[k]=(h.skx[k]||0)+1;const l1=C.profLv(u.id,k);if(l1>l0)setTimeout(()=>{try{pop(u,`技Lv${l1}`,'#ffe27a',true,'st20 up');}catch(e){}},300);}

/* ==================== 表示（連携・OD・奥義） ==================== */
function banner(t,s,cls){let b=$('#rsban');if(!b){b=document.createElement('div');b.id='rsban';$('#stage').appendChild(b);}
 b.className=cls||'';b.innerHTML=`<b>${t}</b>${s?`<small>${s}</small>`:''}`;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('on'),Math.round(1300*(SPD[speed]||1)));}
function chainShow(n,names){banner(`${n}連携`,names.slice(-n).join(' → '),'chain c'+Math.min(5,n));try{tone(520+n*90,.08,'square',.04);}catch(e){}}

/* ==================== 1 ターン ==================== */
function bpStart(u){return clamp(D.BP.start+sumE(u,'bp0')+B.heroes.reduce((a,h)=>a+(h!==u||true?sumE(h,'allybp0'):0),0),0,u.bpMax);}
function roundStart(){const R=B.rs.round;
 for(const h of aliveH()){h.bpMax=D.BP.max+sumE(h,'bpmax');
  if(R>1){const ally=B.heroes.filter(x=>x.alive).reduce((a,x)=>a+sumE(x,'allybpr'),0);h.sp=clamp(h.sp+D.BP.regen+sumE(h,'bpr')+ally,0,h.bpMax);}
  if(DEV())h.sp=h.bpMax;}
 if(R>1)for(const h of aliveH()){for(const e of effs(h)){
   if(e.t==='regen'){const tg=e.on==='allies'?aliveH():e.on==='lowest'?[aliveH().filter(x=>x.hp<x.mhp).sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0]].filter(Boolean):[h];
    for(const x of tg){if(x.hp>=x.mhp)continue;const v=Math.max(1,Math.round(x.mhp*e.v/100));x.hp=Math.min(x.mhp,x.hp+v);pop(x,'+'+v,'#7dffa8',true);}}
   if(e.t==='cleanse'&&Math.random()<(e.p||0)){const s=(h.sts||[]).find(s=>!V20.isBuff(s));if(s){V20.clearSt(h,x=>x===s);pop(h,'弱体解除','#8ff0a8',true);}}}}
 refresh();}
function roundEnd(){for(const h of B.heroes){if(h.taunt>0)h.taunt--;
  if(h.aw&&h.alive){h.awT=(h.awT||0)+1;if(h.awT>=awN(h)){endAw(h,true);h._awE=null;log(`${h.name}の星臨が解けた`);}}}
 refresh();}
/* 行動順。OD 中は味方全員が先に、並び順どおりに動く */
function buildOrder(cmds){const L=[],hs=aliveH(),avg=hs.reduce((a,h)=>a+spdOf(h),0)/Math.max(1,hs.length);let i=0;
 for(const[u,c]of cmds){if(!u.alive)continue;const pr=sumE(u,'prio'),sp=c&&c.sk&&c.sk.prio?c.sk.prio*1000:0;
  let v=spdOf(u)*(.9+Math.random()*.2)*(1+pr/100)+sp-(u._rsLate?3000:0);if(B.rs.odArmed)v=1e6-i;L.push({u,c,v,od:B.rs.odArmed});i++;u._rsLate=0;}
 for(const e of aliveE()){const n=e.boss&&e.spd>avg*1.35?2:1;for(let k=0;k<n;k++){L.push({u:e,v:e.spd*(.9+Math.random()*.2)*(k?.55:1)-(e._rsLate?3000:0)});}e._rsLate=0;}
 return L.sort((a,b)=>b.v-a.v);}
const ctSnap=()=>{const m=new Map();for(const x of[...B.heroes,...B.enemies])m.set(x,{ct:x.ct||0,alive:x.alive});return m;};
function ctApply(m,actor,q){for(const[x,s]of m){if(x===actor||!s.alive||!x.alive)continue;const d=(x.ct||0)-s.ct;if(Math.abs(d)<1e-6)continue;const i=q.findIndex(e=>e.u===x);
 if(d>0){if(i>=0){const[e]=q.splice(i,1);q.push(e);}else x._rsLate=1;}else if(i>=0){const[e]=q.splice(i,1);q.unshift(e);}x.ct=s.ct;}}

/* 入力 */
async function inputPhase(myB){const cmds=new Map();let list=B.heroes.filter(h=>h.alive),i=0;
 while(i<list.length){if(B!==myB||B.over)return null;const u=list[i];if(!u.alive||!B.heroes.includes(u)){i++;continue;}
  B.cur=u;B.lastH=u;if(DEV())u.sp=u.bpMax;refresh();
  let ch=auto?(await wait(120),autoPick(u)):await chooseRoot(u,{idx:i,n:list.length});
  if(B!==myB||B.over)return null;
  if(!ch)ch={sk:ATK(u),t:aliveE()[0]};
  if(ch.aw){if(!u.aw&&(u.ag>=100||DEV())&&B.heroes.filter(h=>h.aw).length<2){$('#cmd').innerHTML='';await awaken(u);}else ch={sk:ATK(u),t:aliveE()[0]};if(ch.aw)continue;}
  if(ch.back){if(i>0){i--;cmds.delete(list[i]);}continue;}
  if(ch.od){B.rs.odArmed=!B.rs.odArmed;continue;}
  if(ch.swap){const nh=hero(ch.swap),idx=B.heroes.indexOf(u);nh.x=u.x;nh.y=u.y;nh.ct=0;nh.swapped=1;G.h[u.id].hp=u.hp;B.heroes[idx]=nh;G.party[G.party.indexOf(u.id)]=ch.swap;
   try{V20.STN&&(nh.sts=[]);}catch(e){}C.applyForm(nh,idx);nh.sp=bpStart(nh);log(`${u.name}と${nh.name}が入れ替わった！`);SFX.sel();list[i]=nh;refresh();await wait(250);continue;}
  cmds.set(u,ch);i++;}
 B.cur=null;return cmds;}
async function opening(myB){await sleep(350);let n=0;while(B===myB&&!B.over&&(B.intro>0||document.querySelector('#stage .bossin'))&&n<240){await sleep(50);n++;}}

/* 味方の行動 */
async function heroExec(u,c,it){if(!c||!c.sk)return;
 psEach(u,'turn');const stun=await V20.tickSts(u);if(!u.alive||!aliveE().length)return;if(stun){B.rs.lastHeroDmg=false;B.rs.chainN=0;return;}
 let sk=c.sk,t=c.t;
 if(sk.k==='reso'&&!canReso())sk=ATK(u);
 if(sk.ougi&&(!u.aw||u._rsOugi))sk=ATK(u);
 if(sk.k==='item'&&!((G.items[sk.id]||0)>0)){log(`${u.name}：${(ITEMS[sk.id]||{}).n||'道具'}が足りない`);sk=ATK(u);t=null;}
 if(sk.t==='one'||sk.basic){if(!t||!t.alive||t.side!==1)t=B.tgt&&B.tgt.alive?B.tgt:aliveE().sort((a,b)=>a.hp-b.hp)[0];}
 if(sk.t==='ally'&&!sk.revive&&(!t||!t.alive))t=aliveH().sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];
 if(sk.revive&&(!t||t.alive)){t=B.heroes.find(h=>!h.alive);if(!t){log(`${u.name}は様子をうかがった`);return;}}
 if(sk.k==='rewind'&&!B.snap)sk=ATK(u);
 let cost=DEV()?0:C.costOf(u,sk);
 if(u.sp<cost){log(`${u.name}はBPが足りない…（通常攻撃）`);sk=ATK(u);cost=0;t=aliveE().sort((a,b)=>a.hp-b.hp)[0];}
 const g=glimmer(u,sk);if(g){sk=g;await glimShow(u,g);if(g.t==='one'&&(!t||!t.alive||t.side!==1))t=aliveE()[0];}
 /* 連携・OD・熟練 */
 const dmg=isDmg(sk);if(dmg){B.rs.chainN=B.rs.lastHeroDmg?B.rs.chainN+1:1;B.rs.names.push(sk.basic?'通常攻撃':sk.n);}else{B.rs.chainN=0;B.rs.names=[];}
 const n=dmg?B.rs.chainN:0,key=C.keyOf(sk),prof=key&&D.NEW[key]?C.profMul(u.id,key):1;
 const mul=chainMul(n,u)*(it&&it.od?D.OD.mul:1)*prof;
 if(n>=2)chainShow(n,B.rs.names);
 u.sp-=cost;const pre=u.sp;u._rsBpGain=0;
 const s2=prep(u,sk);
 B.rs.cur={u,sk:s2,mul,hitSet:new Set(),weak:false};
 if(sk.ougi){u._rsOugi=1;banner('奥義',`${u.name}「${sk.n}」`,'ougi');B.flashBg=24;B.flashCol='#fff3b0';try{SFX.aw();}catch(e){}await wait(650);}
 const hp0=B.heroes.map(h=>h.hp);
 if(sk.k==='mag'||sk.k==='phys'){if(dmg&&u.side===0)u._rsHeat=(u._rsHeat||0)+1;}
 try{await doAction(u,s2,t);}catch(e){console.error(e);}
 if(!B||!B.rs)return;const cur=B.rs.cur;B.rs.cur=null;
 if(sk.fixedK==='store')u.store=0;
 if(sk.basic)u.sp=pre+D.BP.basic+Math.min(2,Math.floor((u.spGain||0)/5));
 u.sp=clamp(u.sp+(u._rsBpGain||0),0,u.bpMax||D.BP.max);u._rsBpGain=0;
 if(sk.k==='mag'&&sk.el)u._rsLe=sk.el;
 if(t&&t.side===1){if(u._rsSameT===t)u._rsSameN=(u._rsSameN||0)+1;else{u._rsSameT=t;u._rsSameN=0;}}
 /* 攻撃後の範囲効果 */
 for(const f of sk.post||[]){const tg=f.on==='allies'?aliveH():f.on==='enemies'?aliveE():f.on==='self'?[u]:t&&t.alive?[t]:[];for(const x of tg)V20.addSt(x,f.k,f.k==='shield'?Math.round(x.mhp*f.v):f.v,f.t);}
 /* 回復した味方に被ダメ軽減 */
 const hp=sumE(u,'healprot');if(hp)B.heroes.forEach((h,i)=>{if(h.alive&&h.hp>hp0[i]&&h!==u)V20.addSt(h,'prot',hp,2);else if(h===u&&h.hp>hp0[i])V20.addSt(h,'prot',hp,2);});
 /* 追撃 */
 if(dmg&&u.alive&&aliveE().length)for(const e of effs(u))if(e.t==='fu'&&(e.c==='weak'?cur&&cur.weak:cnd(e.c,u,t,sk))&&Math.random()<(e.p||0)){await strikeBack(u,t,e.nm||e.src||'追撃',e.pow||.6,e.el);break;}
 addProf(u,sk);
 if(dmg)addOD(D.OD.act+(n>=2?D.OD.chain*(n-1):0),u);
 B.rs.lastHeroDmg=dmg;refresh();}
/* 技を実行用に整える（回復量・追加効果の成功率・連撃数・蓄積） */
const BUFFK=new Set(['regen','prot','shield','counter','evade']);
function prep(u,sk){const s=Object.assign({},sk);s.sp=0;/* 旧来の SP の消費は使わない（BP は heroExec で払う） */
 const hm=(u.healMul||1)*(1+sumE(u,'heal')/100);
 if((s.k==='heal'||s.k==='healAll')&&s.pow)s.pow=s.pow*hm;if(s.heal20)s.heal20=s.heal20*hm;
 if(s.fx20)s.fx20=s.fx20.map(f=>f.p!=null&&f.on==='t'&&!BUFFK.has(f.k)&&!(f.v>0&&['atk','def','mag','res','spd'].includes(f.k))?Object.assign({},f,{p:Math.min(1,f.p*(u.ailMul||1))}):f);
 const hx=sumE(u,'hits');if(hx&&s.hits>1&&(s.k==='phys'||s.k==='mag'))s.hits+=hx;
 if(s.fixedK==='store')s.fixed=(u.store||0)*.9+st(u,'atk')*3;
 return s;}
/* 敵の行動 */
async function enemyExec(e){B.rs.lastHeroDmg=false;B.rs.chainN=0;B.rs.names=[];B.rs.cq=[];
 const ch0=e.charging;await enemyTurn(e);
 if(B&&!B.over&&e.alive&&e.charging&&!ch0)log(`${e.name}は<b>力を溜めている</b>…！ 次の行動で強力な攻撃が来る`);
 await drainCounters();}

/* 戦闘の進行（RS 式） */
const oldRun=run;
run=async function(){if(!B)return;if(B.opts&&B.opts.viewer)return oldRun();const myB=B;
 try{await opening(myB);
  while(B===myB&&!B.over){
   B.rs.round++;B.turns=B.rs.round;roundStart();
   const cmds=await inputPhase(myB);if(!cmds||B!==myB||B.over)return;
   const q=buildOrder(cmds);B.rs.q=q;B.rs.chainN=0;B.rs.lastHeroDmg=false;B.rs.names=[];
   if(B.rs.odArmed){B.rs.odArmed=false;B.rs.od=0;banner('OVERDRIVE','味方全員が続けて行動する','od');B.flashBg=20;B.flashCol='#ffb0ff';try{SFX.aw();}catch(e){}await wait(700);}
   refresh();let staged=false;
   while(q.length){if(B!==myB||B.over)return;const it=q.shift(),u=it.u;
    if(!u.alive)continue;if(u.side===1&&!B.enemies.includes(u))continue;if(u.side===0&&!B.heroes.includes(u))continue;
    const snap=ctSnap();B.cur=u;refresh();
    if(u.side===0)await heroExec(u,it.c,it);else await enemyExec(u);
    if(B!==myB||B.over)return;B.cur=null;ctApply(snap,u,q);refresh();
    if(!aliveE().length){if(B.opts.stages&&(B.stage||0)<B.opts.stages.length-1){await nextStage();staged=true;break;}await wait(500);return end(true);}
    if(!aliveH().length){await wait(500);return end(false);}}
   roundEnd();if(staged)B.rs.lastHeroDmg=false;}
 }catch(e){console.error(e);}};
/* 行動順の表示（入力中は予想、行動中は残りの列） */
preview=function(){if(!B||!B.rs)return[...aliveH(),...aliveE()];if(B.rs.q&&B.rs.q.length)return B.rs.q.map(x=>x.u).filter(u=>u.alive);return[...aliveH(),...aliveE()].sort((a,b)=>spdOf(b)-spdOf(a));};

/* 開始：BP・陣形・OD */
{const _sb=startBattle;startBattle=function(list,opts={}){const r=_sb(list,opts);try{if(B){
  B.rs={round:0,od:0,chainN:0,lastHeroDmg:false,cur:null,cq:[],q:[],names:[],odArmed:false};
  B.heroes.forEach((h,i)=>{C.applyForm(h,i);h.bpMax=D.BP.max+sumE(h,'bpmax');h._rsGuts=0;h._rsRage=0;h._rsHeat=0;});
  B.heroes.forEach(h=>{h.sp=bpStart(h);});
  setTimeout(()=>{try{if(!B||!B.rs)return;for(const h of B.heroes){if(!h.alive)continue;for(const e of effs(h))if(e.t==='start'){const tg=e.on==='allies'?aliveH():e.on==='enemies'?aliveE():[h];
    for(const x of tg)V20.addSt(x,e.k,e.k==='shield'?Math.round(x.mhp*e.v/100):e.v,e.d||3);}h.sp=clamp(h.sp,0,h.bpMax);}refresh();}catch(e){console.error(e);}},420);}}catch(e){console.error(e);}return r;};}
/* 武器パッシブ「知識の泉」：SP+20 → BP+2 */
try{const P=V20.PS.w_wisdom;if(P){P.v=2;P.d='戦闘開始時のBP+{v}';P.start=(u,v)=>{u.sp=Math.min(u.bpMax||20,u.sp+Math.round(v));};}}catch(e){}
/* 星臨ゲージの溜まり方（アビリティ） */
{const _hit2=hit;hit=async function(a,t,sk){const ag0=a&&a.side===0&&!a.aw?a.ag:null;const d=await _hit2(a,t,sk);try{if(ag0!=null&&a.ag>ag0){const m=sumE(a,'ag');if(m)a.ag=Math.min(100,ag0+(a.ag-ag0)*(1+m/100));}}catch(e){}return d;};}

/* ==================== オート ==================== */
const known=(e,el)=>!!el&&e.known&&e.known.has(el)&&e.weak.includes(el);
function score(u,s,es,tgt){if(!s)return-1;const pw=(s.pow||1)*((s.hits||1)>1?s.hits:1);let n=s.t==='all'?es.length:1,w=s.t==='all'?es.filter(e=>known(e,s.el)).length/Math.max(1,es.length):known(tgt,s.el)?1:0;return pw*n*(1+.7*w);}
autoPick=function(u){if(!B||!B.rs)return{sk:ATK(u),t:aliveE()[0]};
 const full=auto&&AM==='f',pol=full||(typeof awPolicy==='function'&&awPolicy())||!auto;
 if(!u.aw&&u.ag>=100&&B.heroes.filter(h=>h.aw).length<2&&(full||pol&&auto))return{aw:true};
 if(canReso()&&(full||auto&&pol))return{sk:{k:'reso'}};
 const es=aliveE().sort((a,b)=>a.hp-b.hp),tgt=B.tgt&&B.tgt.alive?B.tgt:es[0];if(!tgt)return{sk:ATK(u)};
 const sks=(u.rsSet||[]).map(k=>SK[k]).filter(s=>s&&C.costOf(u,s)<=u.sp);
 if(u.aw&&!u._rsOugi){const o=SK[(D.AWX[u.id]||{}).ou];if(o){const ok=o.k==='rewind'?!!B.snap&&aliveH().reduce((a,h)=>a+h.hp/h.mhp,0)<B.heroes.length*.55:o.k==='reviveAll'?B.heroes.some(h=>!h.alive)||aliveH().some(h=>h.hp<h.mhp*.5)||awLeft(u)<=1:true;if(ok)return{sk:o,t:tgt};}}
 const low=aliveH().filter(h=>h.hp<h.mhp*.45),dead=B.heroes.some(h=>!h.alive);
 const heals=sks.filter(s=>s.k==='heal'||s.k==='healAll'||(s.k==='sup20'&&s.heal20));
 if(low.length&&heals.length){const s=low.length>=2?heals.find(x=>x.k!=='heal')||heals[0]:heals.find(x=>x.k==='heal')||heals[0];return{sk:s,t:low[0]};}
 const sup=sks.filter(s=>s.k==='sup20'&&!s.heal20&&!(s.fx20||[]).every(f=>f.on==='enemies'||(f.on==='self'?(u.sts||[]).some(x=>x.k===f.k):aliveH().every(h=>(h.sts||[]).some(x=>x.k===f.k)))));
 if(sup.length&&Math.random()<.3&&B.rs.round<=4)return{sk:sup[Math.random()*sup.length|0]};
 const atks=sks.filter(s=>s.k==='phys'||s.k==='mag');let best=ATK(u),bs=score(u,best,es,tgt)*.9;
 for(const s of atks){const v=score(u,s,es,tgt)-(C.costOf(u,s)>u.sp-2&&u.sp<10?.4:0);if(v>bs){bs=v;best=s;}}
 return{sk:best,t:tgt};};
/* リピート：BP が足りるときだけ */
repOK=function(u){const L=LASTA[u.id];if(!L||!L.sk)return null;let s=L.sk;if(s.basic)return ATK(u);if(s.k==='item'||s.k==='reso'||s.t==='ally'||s.ougi)return null;
 if(!(u.rsSet||[]).some(k=>SK[k]===s))return null;if(C.costOf(u,s)>u.sp&&!DEV())return null;return s;};

return{effs,sumE,cnd,addOD,isDmg,banner,chainShow,awLeft,bpStart,buildOrder,heroExec,inputPhase,psEach};})();
