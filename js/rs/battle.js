/* ===== 戦闘の進行（ターン制・BP・HP/LP）=====
 ターン制（旧来の CT＝行動時間の順番待ちは使わない）。
  1. ターンの始め：BP 回復（キャラごとの回復量）・アビリティの継続回復など
  2. コマンド入力：味方全員の行動を先に決める（星臨は入力中に発動）
  3. 行動：素早さ順（±10% のゆらぎ・先制／後発の技・アビリティの行動順）。敵も同じ列に並ぶ
     ・遅延（盾撃・影縫いなど）：まだ動いていなければその列の最後へ、動いた後なら次のターンの最後へ
  4. ターンの終わり：星臨の残りターン・挑発の経過
 HP・LP
  ・最大HPの 30% 以下で瀕死、0 で気絶（戦闘不能）。気絶すると LP-1
  ・気絶中にさらに攻撃を受けても LP-1（敵の全体攻撃・追い打ち）。LP を直接削る攻撃を持つ敵もいる
  ・LP が 1 以上なら、回復術（単体）・道具・奥義で復活できる。LP が 0 になると、その戦闘中は復活できない
  ・回復術は使うと LP を 1 消費する（自分の LP が 0 になる使い方はできない）
  ・LP はクエストの間は引き継ぎ、灯都に戻ると全回復する
 命中：技は器用さ・素早さ 対 素早さ、術は知力 対 精神（RSC.hitRate）。外れると MISS
 演出（ver0.19〜0.36 の振り付け・エフェクト）は既存の doAction / hit / enemyTurn をそのまま通す */
'use strict';
const RSB=(()=>{
const D=RSD,C=RSC;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

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
  case'tpoison':return!!t&&(t.sts||[]).some(x=>x.k==='poison');case'tbrk':return!!t&&t.hp<=t.mhp*.5;
  case'allyaw':return!!B&&B.heroes.some(h=>h!==a&&h.aw&&h.alive);case'aw':return!!a.aw;
  case'altel':return!!(sk&&sk.k==='mag'&&sk.el&&a._rsLe&&a._rsLe!==sk.el);
  case'crit':return!!(r&&r.crit);case'r1':return!!(B&&B.rs&&B.rs.round===1);}
 return false;}
/* 旧来のパッシブ（武器・レジェンド装備）のイベントを呼ぶ（V20 の each と同じ） */
function psEach(u,ev,...a){for(const p of(u.ps20||[])){const P=V20.PS[p.id];if(P&&P[ev]){try{P[ev](u,...a,p.v);}catch(e){console.error(e);}}}}
const isDmg=sk=>!!sk&&(!!sk.basic||['phys','mag','rhythm','pct'].includes(sk.k));
const dying=u=>!!u&&u.alive&&u.side===0&&u.hp<=u.mhp*D.HPLP.dying;

/* ==================== LP ==================== */
/* LP が減るのは、気絶したとき（-1）と、一部の高難易度ボス（LP を削る技を持つ Lv50 以上のボス）の攻撃に当たったときだけ。追い打ち・回復術では減らない */
const lpBoss=a=>!!a&&a.side===1&&!!a.boss&&(a.lv||0)>=50;
function lpLose(t,n,why){if(!t||t.side!==0||!(n>0))return;const l0=t.lp;t.lp=Math.max(0,(t.lp||0)-n);if(t.lp===l0)return;
 /* 表示：回復と同じ 3 段目に赤い文字。ダメージの数字と被るときは時間差で（js/ui/battle-pop.js lp） */
 try{BPOP.lp(t,'LP-'+(l0-t.lp));}catch(e){}
 if(t.lp<=0){if(t.alive){t.hp=0;t.alive=false;}log(`<b>${t.name}のLPが尽きた</b>…この戦闘ではもう復活できない`);}
 else if(why)log(`${t.name}：${why}（LP ${t.lp}/${t.lpMax}）`);
 try{G.h[t.id].lp=t.lp;}catch(e){}}
/* 復活できない（LP 0）味方は、何が起きても戦闘不能のまま */
function lpGuard(){if(!B)return;for(const h of B.heroes)if(h.alive&&(h.lp||0)<=0){h.alive=false;h.hp=0;}}

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
   for(const h of B.heroes)if(h!==a&&h.alive)m*=1+sumE(h,'allydmg',e=>cnd(e.c,h,t,sk))/100;
   if(r.crit){const cd=sumE(a,'critd');if(cd)m*=1+cd/150;}
   const cur=B.rs.cur;if(cur&&cur.u===a)m*=cur.mul;
   if(sk.ougi)m*=(1+(a.ougiUp||0)/100)*(a.legs&&a.legs.includes('futago')?1.3:1);}
  if(t.side===0){const cut=sumE(t,'cut',e=>cnd(e.c,t,a,sk))+B.heroes.reduce((x,h)=>x+(h.alive?sumE(h,'allycut'):0),0);m*=Math.max(.2,1-cut/100);}
  /* 属性耐性（装備の合計。js/data/resist.js）：耐性 1 で 1% 軽減、弱点（マイナス）は増加。味方が受けるときだけ */
  if(t.side===0&&a&&a.side===1&&sk.el)m*=ELR.mul(t.id,sk.el);
  if(m!==1)r.d=Math.max(1,Math.round(r.d*m));}catch(e){console.error(e);}
 B.rs.lastR=r;return r;};}
{const _hit=hit;hit=async function(a,t,sk){if(!B||!B.rs||!a||!t)return _hit(a,t,sk);const was=t.alive,myB=B;B.rs.lastR=null;
 if(a.side===1&&t.side===0)B.rs.eSk=sk;
 const d=await _hit(a,t,sk);if(B!==myB||!B.rs)return d;
 try{const r=B.rs.lastR||{};
  if(a.side===0&&t.side===1){const cur=B.rs.cur;
   if(r.weak&&cur)cur.weak=true;if(r.crit&&cur)cur.crit=true;
   if(!sk._fu&&cur&&cur.u===a&&!cur.hitSet.has(t)){cur.hitSet.add(t);onHit(a,t,sk,r);}
   if(d>0){const dr=sumE(a,'drain',e=>cnd(e.c,a,t,sk));if(dr&&a.alive&&a.hp<a.mhp){const v=Math.max(1,Math.round(d*dr/100));a.hp=Math.min(a.mhp,a.hp+v);}}
   if(was&&!t.alive)onKill(a,t);}
  /* LP を直接削る敵の攻撃 */
  if(a.side===1&&t.side===0&&sk&&sk.lp&&!B.rs.missed&&lpBoss(a))lpLose(t,sk.lp,`「${sk.n}」で命が削られた`);
 }catch(e){console.error(e);}
 B.rs.missed=false;return d;};}
function onHit(a,t,sk,r){if(!t.alive)return;
 for(const e of effs(a)){if(!cnd(e.c,a,t,sk,r))continue;
  if(e.t==='onhit'){const st=['atk','def','mag','res','spd'].includes(e.k),p=st?1:C.ailP(a,t,{k:e.k,p:e.p||0});if(Math.random()<p)V20.addSt(t,e.k,e.v,e.d||2);}
  if(e.t==='delay'&&Math.random()<C.ailP(a,t,{k:'spd',p:e.p||0})){t.ct=(t.ct||0)+40/Math.max(1,t.spd);pop(t,'DELAY','#7fd6ff',true);}}}
function onKill(a,t){for(const e of effs(a))if(e.t==='kill'){if(e.bp)a._rsBpGain=(a._rsBpGain||0)+e.bp;if(e.hp&&a.alive){const v=Math.round(a.mhp*e.hp/100);a.hp=Math.min(a.mhp,a.hp+v);pop(a,'+'+v,'#7dffa8',true);}}}
{const _h=hurt;hurt=function(t,d){if(!B||!B.rs||!t)return _h(t,d);const a=B._atk20,sk=B._sk20;
 /* 命中判定（技は器用さ・素早さ、術は知力 対 精神） */
 if(t.alive&&d>0&&a&&a.side!==t.side&&sk&&isDmg(sk)&&!sk._fu&&!sk.fixedK&&sk.k!=='pct'){const p=C.hitRate(a,t,sk)*((a.sts||[]).some(s=>s.k==='blind')?.7:1);if(Math.random()>p){B.rs.missed=true;setTimeout(()=>pop(t,'MISS','#ffffff',true),50);return 0;}}
 if(t.side===0&&t.alive&&d>0&&a&&a.side===1){const dg=sumE(t,'dodge',e=>cnd(e.c,t,a,sk));if(dg>0&&Math.random()*100<dg){B.rs.missed=true;const ev=effs(t).find(e=>e.t==='evct');if(ev&&a.alive&&sk&&!sk._fu)B.rs.cq.push({a:t,t:a,pow:ev.v||.8,nm:ev.src});setTimeout(()=>pop(t,'MISS','#ffffff',true),50);return 0;}}
 const r=_h(t,d);
 try{if(t.side===0&&r>0){
   if(t.hp<=0&&!t._rsGuts&&sumE(t,'guts')>0&&t.alive){t._rsGuts=1;t.hp=1;setTimeout(()=>pop(t,'こらえた！','#ffe27a',true),80);for(const e of effs(t))if(e.t==='gutsbuff')V20.addSt(t,e.k,e.v,3);}
   if(t.alive&&t.hp>0&&t.hp<=t.mhp*.5&&!t._rsHB){const hb=effs(t).find(e=>e.t==='hpbuff');if(hb){t._rsHB=1;setTimeout(()=>{try{abPop(t,hb.src);V20.addSt(t,'atk',hb.v,3);V20.addSt(t,'def',hb.v,3);}catch(x){}},120);}}
   const rg=effs(t).find(e=>e.t==='rage');if(rg&&t.alive)t._rsRage=Math.min(rg.max||5,(t._rsRage||0)+1);
   if(a&&a.side===1&&a.alive&&t.hp>0&&sk&&sk.t==='one'&&!sk._fu)for(const e of effs(t))if(e.t==='counter'&&Math.random()<(e.p||0)){B.rs.cq.push({a:t,t:a,pow:Math.max(e.pow||1,...effs(t).filter(x=>x.t==='ctpow').map(x=>x.v))});break;}}}catch(e){console.error(e);}
 return r;};}
/* 気絶：LP-1（ver0.46g で戻した。気絶中の追い打ち・回復術では減らない） */
{const _k=kill;kill=async function(t){const was=t&&t.alive;await _k(t);try{if(B&&B.rs&&t&&t.side===0&&!t.alive&&was){lpLose(t,1,'気絶した');if(t.lp>0)log(`${t.name}は気絶した…（回復術で復活できる）`);}}catch(e){console.error(e);}};}
/* 反撃・追撃 */
async function strikeBack(a,t,nm,pow,el){if(!a.alive||!B)return;let tg=t&&t.alive?t:aliveE().sort((x,y)=>x.hp-y.hp)[0];if(!tg)return;
 pop(a,nm,'#ffe27a',true,'st20 fu');await wait(140);try{const[x,y]=V19.mid(tg);FX19.slash(x,y,ELC[el]||'#ffffff',{size:1});}catch(e){}
 await hit(a,tg,{n:nm,el:el||a.atkEl||a.elem||'斬',k:MAG(a.id)?'mag':'phys',pow,t:'one',_fu:1});await wait(160);}
async function drainCounters(){const q=B&&B.rs?B.rs.cq:[];let n=0;while(q.length&&n<4&&B&&!B.over&&aliveE().length){const c=q.shift();n++;if(!c.a.alive||!c.t.alive)continue;await strikeBack(c.a,c.t,c.nm||'反撃',c.pow);
  for(const e of effs(c.a))if(e.t==='ctst'&&c.t.alive&&Math.random()<C.ailP(c.a,c.t,{k:e.k,p:e.v})){abPop(c.a,e.src);V20.addSt(c.t,e.k,1,1);}}if(B&&B.rs)B.rs.cq=[];}

/* ==================== 敵の狙い ==================== */
pickHero=function(){const hs=aliveH();const g=hs.find(h=>h.id==='gald'&&h.aw);if(g)return g;
 /* 追い打ち：まれに、倒れている味方（LP が残っている）を狙う */
 const down=B&&B.rs?B.heroes.filter(h=>!h.alive&&(h.lp||0)>0):[];if(down.length&&hs.length&&Math.random()<.1)return down[Math.random()*down.length|0];
 const w=hs.map(h=>1+(h.taunt>0?6:0)+sumE(h,'taunt')*1.5);let r=Math.random()*w.reduce((a,b)=>a+b,0),pk=hs[0];for(let i=0;i<hs.length;i++){if((r-=w[i])<0){pk=hs[i];break;}}
 return cover(pk);};
/* かばう：HPが半分以下の味方への単体攻撃を、かばうアビリティを持つ仲間が受ける */
function cover(pk){try{if(!pk||pk.hp>pk.mhp*.5)return pk;for(const h of aliveH()){if(h===pk||h.hp<h.mhp*.3)continue;const c=sumE(h,'cover');if(c>0&&Math.random()<c){abPop(h,(effs(h).find(e=>e.t==='cover')||{}).src||'かばう');return h;}}}catch(e){console.error(e);}return pk;}
/* アビリティの発動：キャラの足元に名前を小さく出す（ロマサガRS の「アビリティ名」の出方） */
function abPop(u,n){try{pop(u,n,'#ffffff',true,'st20 ab');}catch(e){}}

/* ==================== 星臨 ==================== */
{const _aw=awaken;awaken=async function(u){const res=B&&B.res;if(B)B.res=null;/* ヴァルクの旧仕様（自動行動）を止める */
 try{await _aw(u);}finally{if(B&&res&&!B.res)B.res=res;}
 if(!B||!B.rs||u.side!==0)return;u.ag=0;u.awT=0;u._rsOugi=0;u._awE=null;
 const X=D.AWX[u.id];
 try{for(const e of C.awEffects(u.id))if(e.t==='onaw'){const tg=e.on==='enemies'?aliveE():e.on==='allies'?aliveH():[u];tg.forEach(x=>V20.addSt(x,e.k,e.v,e.d));}
  if(u.id==='shion')aliveE().forEach(e=>{e._rsLate=1;});
  for(const h of aliveH())if(h!==u&&!h.aw){const v=sumE(h,'agshare');if(v){h.ag=Math.min(100,(h.ag||0)+v);abPop(h,(effs(h).find(e=>e.t==='agshare')||{}).src);}}
  if(X)log(`<b>${u.name}、星臨――「${AW[u.id].name}」</b>　奥義「${SK[X.ou].n}」が使える`);}catch(e){console.error(e);}
 refresh();};}
const awLeft=u=>Math.max(0,awN(u)-(u.awT||0));

/* ==================== ひらめき・熟練 ==================== */
function glimmer(u,sk){if(!sk||sk.basic||sk.ougi||u.side!==0)return null;const k=C.keyOf(sk);if(!k)return null;const h=G.h[u.id];if(!h)return null;
 for(const[id,how,lv]of D.LEARN[u.id]||[]){if(how!=='glim')continue;const g=SK[id].glim;if(!g||g.from!==k||h.lv<lv||h.glim.includes(id))continue;
  const boss=aliveE().some(e=>e.boss),p=(g.p||.08)*(boss?2:1)*(1+(((G.fac&&G.fac.tower)||1)-1)*.1)*(DEV()?5:1);/* 星詠みの塔：ひらめき率+10%/Lv */if(Math.random()<p){h.glim.push(id);try{save();}catch(e){}return SK[id];}}
 return null;}
async function glimShow(u,sk){banner('ひらめき！',`${u.name}は「${sk.n}」を閃いた！`,'glim');SFX.weak();pop(u,'💡','#ffe27a',true);log(`<b>💡 ${u.name}は「${sk.n}」を閃いた！</b>`);await wait(700);}
/* 技Lv（熟練）は ver0.47 で廃止（練達：js/rs/mastery.js） */
function addProf(){}

/* ==================== 見出し（奥義・ひらめき） ==================== */
function banner(t,s,cls){let b=$('#rsban');if(!b){b=document.createElement('div');b.id='rsban';$('#stage').appendChild(b);}
 b.className=cls||'';b.innerHTML=`<b>${t}</b>${s?`<small>${s}</small>`:''}`;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('on'),Math.round(1300*(SPD[speed]||1)));}

/* ==================== 1 ターン ==================== */
const bpReg=h=>(h.bpReg!=null?h.bpReg:D.BP.regen)+sumE(h,'bpr')+Math.min(2,Math.floor((h.spGain||0)/5))+B.heroes.filter(x=>x.alive).reduce((a,x)=>a+sumE(x,'allybpr'),0);
function bpStart(u){return clamp((u.bp0!=null?u.bp0:D.BP.start)+sumE(u,'bp0')+B.heroes.reduce((a,h)=>a+sumE(h,'allybp0'),0),0,u.bpMax);}
function roundStart(){const R=B.rs.round;
 for(const h of aliveH()){h.bpMax=(h.bpMax0||h.bpMax)+0;
  if(R>1)h.sp=clamp(h.sp+bpReg(h),0,h.bpMax);
  if(DEV())h.sp=h.bpMax;}
 refresh();}
/* ターンの始めの効果（ver0.46d：ロマサガRS と同じく、コマンドを決めて全画面になったあと＝HP・BP を見せたあとに出す） */
function roundFx(){const R=B.rs.round;
 for(const h of aliveH())for(const e of effs(h)){
  if(e.t==='tstart'){const tg=e.on==='allies'?aliveH():[h];for(const x of tg)V20.addSt(x,e.k,e.k==='shield'?Math.round(x.mhp*e.v/100):e.v,e.k==='shield'?99:2);}
  if(e.t==='autorev'&&!h._rsAR){const d=B.heroes.find(x=>!x.alive&&(x.lp||0)>0);if(d){h._rsAR=1;d.alive=true;d.hp=Math.max(1,Math.round(d.mhp*e.v/100));abPop(h,e.src);setTimeout(()=>{try{pop(d,'REVIVE','#7dffa8',true);setCT(d);}catch(x){}},200);log(`${h.name}の「${e.src}」――${d.name}が立ち上がった`);}}}
 if(R>1)for(const h of aliveH()){for(const e of effs(h)){
   if(e.t==='regen'){const tg=e.on==='allies'?aliveH():e.on==='lowest'?[aliveH().filter(x=>x.hp<x.mhp).sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0]].filter(Boolean):[h];
    /* 回復アビリティ：持ち主の魅力と、受ける側の魅力で量が変わる */
    for(const x of tg){if(x.hp>=x.mhp)continue;const v=Math.max(1,Math.round(x.mhp*e.v/100*(h.healAb||1)*(x.healRecv||1)));x.hp=Math.min(x.mhp,x.hp+v);pop(x,'+'+v,'#7dffa8',true);}}
   if(e.t==='cleanse'&&Math.random()<(e.p||0)){const s=(h.sts||[]).find(s=>!V20.isBuff(s));if(s){V20.clearSt(h,x=>x===s);pop(h,'弱体解除','#8ff0a8',true);}}}}
 refresh();}
/* 解癒（練達の効果）：ターン終了時に 1 回だけ、状態異常・能力ダウンを解除し、HP を少し回復する（効果極小＝最大HPの5%） */
function kaiyuEnd(){for(const h of aliveH()){const s=(h.sts||[]).find(x=>x.k==='kaiyu');if(!s)continue;V20.clearSt(h,x=>x===s);
  const a=V20.clrAil(h),d=V20.clrDown(h);abPop(h,'解癒');if(h.hp<h.mhp){const n=Math.max(1,Math.round(h.mhp*.05));h.hp=Math.min(h.mhp,h.hp+n);pop(h,'+'+n,'#7dffa8');}
  if(a||d)log(`${h.name}の「解癒」――状態異常・能力ダウンを解除した`);}}
function roundEnd(){try{kaiyuEnd();}catch(e){console.error(e);}for(const h of B.heroes){if(h.taunt>0)h.taunt--;
  if(h.aw&&h.alive){h.awT=(h.awT||0)+1;if(h.awT>=awN(h)){endAw(h,true);h._awE=null;log(`${h.name}の星臨が解けた`);}}}
 refresh();}
/* 行動順 */
function buildOrder(cmds){const L=[],hs=aliveH(),avg=hs.reduce((a,h)=>a+spdOf(h),0)/Math.max(1,hs.length);
 for(const[u,c]of cmds){if(!u.alive)continue;const pr=sumE(u,'prio'),sp=(c&&c.sk&&c.sk.prio?c.sk.prio*1000:0)+(B.rs.round===1&&sumE(u,'prio1')>0?5000:0);
  L.push({u,c,v:spdOf(u)*(.9+Math.random()*.2)*(1+pr/100)+sp-(u._rsLate?3000:0)});u._rsLate=0;}
 for(const e of aliveE()){const n=e.boss&&e.spd>avg*1.35?2:1;for(let k=0;k<n;k++){L.push({u:e,v:e.spd*(.9+Math.random()*.2)*(k?.55:1)-(e._rsLate?3000:0)});}e._rsLate=0;}
 return L.sort((a,b)=>b.v-a.v);}
const ctSnap=()=>{const m=new Map();for(const x of[...B.heroes,...B.enemies])m.set(x,{ct:x.ct||0,alive:x.alive});return m;};
function ctApply(m,actor,q){for(const[x,s]of m){if(x===actor||!s.alive||!x.alive)continue;const d=(x.ct||0)-s.ct;if(Math.abs(d)<1e-6)continue;const i=q.findIndex(e=>e.u===x);
 if(d>0){if(i>=0){const[e]=q.splice(i,1);q.push(e);}else x._rsLate=1;}else if(i>=0){const[e]=q.splice(i,1);q.unshift(e);}x.ct=s.ct;}}

/* 入力（味方全員の行動を先に決める）。B.rs.phase：'input'（コマンド入力中）／'act'（行動中） */
async function inputPhase(myB){const cmds=new Map();let list=B.heroes.filter(h=>h.alive),i=0;B.rs.phase='input';B.rs.cmds=cmds;
 while(i<list.length){if(B!==myB||B.over)return null;const u=list[i];if(!u.alive||!B.heroes.includes(u)){i++;continue;}
  B.cur=u;B.lastH=u;B.rs.idx=i;B.rs.tot=list.length;if(DEV())u.sp=u.bpMax;refresh();
  let ch=auto?(await wait(120),autoPick(u)):await chooseRoot(u,{idx:i,n:list.length});
  if(B!==myB||B.over)return null;
  if(!ch)ch={sk:ATK(u),t:aliveE()[0]};
  if(ch.aw){if(!u.aw&&(u.ag>=100||DEV())&&B.heroes.filter(h=>h.aw).length<2){$('#cmd').innerHTML='';await awaken(u);}else ch={sk:ATK(u),t:aliveE()[0]};if(ch.aw)continue;}
  if(ch.back){if(i>0){i--;cmds.delete(list[i]);}continue;}
  if(ch.swap){const nh=hero(ch.swap),idx=B.heroes.indexOf(u);nh.x=u.x;nh.y=u.y;nh.ct=0;nh.swapped=1;G.h[u.id].hp=u.hp;G.h[u.id].lp=u.lp;B.heroes[idx]=nh;G.party[G.party.indexOf(u.id)]=ch.swap;
   try{V20.STN&&(nh.sts=[]);}catch(e){}C.applyForm(nh,idx);nh.sp=bpStart(nh);log(`${u.name}と${nh.name}が入れ替わった！`);SFX.sel();list[i]=nh;refresh();await wait(250);continue;}
  cmds.set(u,ch);i++;}
 B.cur=null;B.rs.phase='act';refresh();return cmds;}
async function opening(myB){await sleep(350);let n=0;while(B===myB&&!B.over&&(B.intro>0||document.querySelector('#stage .bossin')||BFLOW.bannerOn())&&n<240){await sleep(50);n++;}
 /* ver0.46c：HP・BP が消え、開始時の強化・弱体を見せ終えてからコマンドへ */
 n=0;while(B===myB&&!B.over&&performance.now()<V38B.hpEnd()+1400&&n<120){await sleep(50);n++;}try{BPOP.cut();}catch(e){}await sleep(260);}

/* 味方の行動 */
async function heroExec(u,c){if(!c||!c.sk)return;try{BPOP.cut();}catch(x){}/* 行動ごとの区切り：前の行動の表示を消す */
 psEach(u,'turn');const stun=await V20.tickSts(u);if(!u.alive||!aliveE().length)return;if(stun)return;
 let sk=c.sk,t=c.t;
 if(sk.ougi&&(!u.aw||u._rsOugi))sk=ATK(u);
 if(sk.k==='item'&&!((G.items[sk.id]||0)>0)){log(`${u.name}：${(ITEMS[sk.id]||{}).n||'道具'}が足りない`);sk=ATK(u);t=null;}
 const heal1=C.isHealSpell(sk)&&sk.t==='ally';
 if(sk.t==='one'||sk.basic){if(!t||!t.alive||t.side!==1)t=B.tgt&&B.tgt.alive?B.tgt:aliveE().sort((a,b)=>a.hp-b.hp)[0];}
 if(sk.t==='ally'&&!sk.revive&&!heal1&&(!t||!t.alive))t=aliveH().sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];
 if(heal1&&(!t||(!t.alive&&(t.lp||0)<=0)))t=aliveH().sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];
 if(sk.revive&&(!t||t.alive||(t.lp||0)<=0)){t=B.heroes.find(h=>!h.alive&&(h.lp||0)>0);if(!t){log(`${u.name}は様子をうかがった`);return;}}
 if(sk.k==='rewind'&&!B.snap)sk=ATK(u);
 let cost=DEV()?0:C.costOf(u,sk);const lpc=DEV()?0:C.lpCost(sk);
 if(u.sp<cost||(lpc&&(u.lp||0)<=lpc)){log(`${u.name}は${u.sp<cost?'BP':'LP'}が足りない…（通常攻撃）`);sk=ATK(u);cost=0;t=aliveE().sort((a,b)=>a.hp-b.hp)[0];}
 const g=glimmer(u,sk);if(g){sk=g;await glimShow(u,g);if(g.t==='one'&&(!t||!t.alive||t.side!==1))t=aliveE()[0];}
 const key=C.keyOf(sk),prof=key&&D.NEW[key]?C.profMul(u.id,key):1;
 u.sp-=cost;u._rsBpGain=0;
 /* 回復術の LP 消費は ver0.46f で廃止 */
 const s2=prep(u,sk,t);
 B.rs.cur={u,sk:s2,mul:prof,hitSet:new Set(),weak:false};
 if(sk.ougi){u._rsOugi=1;banner('奥義',`${u.name}「${sk.n}」`,'ougi');B.flashBg=24;B.flashCol='#fff3b0';try{SFX.aw();}catch(e){}await wait(650);}
 /* 回復術で気絶した仲間を復活させる（LP が 1 以上） */
 let revived=null;if(heal1&&t&&!t.alive&&(t.lp||0)>0){t.alive=true;t.hp=0;revived=t;setTimeout(()=>{try{pop(t,'REVIVE','#7dffa8',true);}catch(e){}},200);}
 const hp0=B.heroes.map(h=>h.hp);
 if((sk.k==='mag'||sk.k==='phys')&&u.side===0)u._rsHeat=(u._rsHeat||0)+1;
 try{await doAction(u,s2,t);}catch(e){console.error(e);}
 if(!B||!B.rs)return;const cur=B.rs.cur;B.rs.cur=null;
 if(revived){if(revived.hp<1)revived.hp=Math.max(1,Math.round(revived.mhp*D.HPLP.reviveMin));log(`${revived.name}が立ち上がった！`);try{setCT(revived);}catch(e){}}
 lpGuard();
 if(sk.fixedK==='store')u.store=0;
 u.sp=clamp(u.sp+(u._rsBpGain||0),0,u.bpMax||D.BP.max);u._rsBpGain=0;
 try{if(cur)for(const e of effs(u)){
   if(e.t==='actbp'&&(e.c==='crit'?cur.crit:e.c==='weak'?cur.weak:cnd(e.c,u,t,sk))&&isDmg(sk)){u.sp=clamp(u.sp+e.v,0,u.bpMax||D.BP.max);abPop(u,e.src);setTimeout(()=>{try{pop(u,'BP+'+e.v,'#7fe0ff',true,'st20 up');}catch(x){}},160);}
   if(e.t==='healcl')B.heroes.forEach((h,i)=>{if(h.alive&&h.hp>hp0[i]){const d=(h.sts||[]).find(s=>!V20.isBuff(s));if(d)V20.clearSt(h,x=>x===d);}});}}catch(e){console.error(e);}
 if(sk.k==='mag'&&sk.el)u._rsLe=sk.el;
 if(t&&t.side===1){if(u._rsSameT===t)u._rsSameN=(u._rsSameN||0)+1;else{u._rsSameT=t;u._rsSameN=0;}}
 /* 攻撃後の範囲効果 */
 for(const f of s2.post||[]){const tg=f.on==='allies'?aliveH():f.on==='enemies'?aliveE():f.on==='self'?[u]:t&&t.alive?[t]:[];for(const x of tg)V20.addSt(x,f.k,f.k==='shield'?Math.round(x.mhp*f.v):f.v,f.t);}
 if(s2.fu3&&isDmg(sk)&&u.alive&&aliveE().length&&Math.random()<(s2.fu3.p||0)){const x=RSM.U3[C.keyOf(sk)];await strikeBack(u,t,x?x.n:'追撃',s2.fu3.pow||.5,sk.el);}
 /* 回復した味方に被ダメ軽減 */
 const hp=sumE(u,'healprot');if(hp)B.heroes.forEach((h,i)=>{if(h.alive&&h.hp>hp0[i])V20.addSt(h,'prot',hp,2);});
 /* 追撃 */
 if(isDmg(sk)&&u.alive&&aliveE().length)for(const e of effs(u))if(e.t==='fu'&&(e.c==='weak'?cur&&cur.weak:cnd(e.c,u,t,sk))&&Math.random()<(e.p||0)){await strikeBack(u,t,e.nm||e.src||'追撃',e.pow||.6,e.el);break;}
 /* とどめ（死神の鎌など） */
 if(isDmg(sk)&&u.alive&&t&&t.side===1&&t.alive&&!t.boss)for(const e of effs(u))if(e.t==='execute'&&cnd(e.c,u,t,sk)&&Math.random()<e.v){await strikeBack(u,t,e.src||'とどめ',99);break;}
 addProf(u,sk);refresh();}
/* 技を実行用に整える（回復量・追加効果の成功率・連撃数・蓄積） */
const BUFFK=new Set(['regen','prot','shield','counter','evade']);
function prep(u,sk,t){const s=Object.assign({},sk);s.sp=0;/* 旧来の SP の消費は使わない（BP は heroExec で払う） */
 const hm=1+sumE(u,'heal')/100;
 /* 回復量：技・術の回復はアビリティ（回復量+%）と、受ける側の魅力（単体はここで、全体は v20 の処理で） */
 if((s.k==='heal'||s.k==='healAll')&&s.pow)s.pow=s.pow*hm*(s.k==='heal'&&t&&t.healRecv?t.healRecv:1);if(s.heal20)s.heal20=s.heal20*hm;
 if(s.fx20)s.fx20=s.fx20.map(f=>f.on==='t'&&f.p!=null&&!BUFFK.has(f.k)&&!(f.v>0&&['atk','def','mag','res','spd'].includes(f.k))?Object.assign({},f,{_ail:1}):f);
 const hx=sumE(u,'hits');if(hx&&s.hits>1&&(s.k==='phys'||s.k==='mag'))s.hits+=hx;
 if(s.fixedK==='store')s.fixed=(u.store||0)*.9+st(u,'atk')*3;
 /* 練達（js/rs/mastery.js）：威力・回復量の倍率、会心、効果のターン数、追加の効果 */
 if(u.side===0)try{const M=RSM.mods(u.id,C.keyOf(sk));if(M.pow!==1){if(s.pow)s.pow*=M.pow;if(s.heal20)s.heal20*=M.pow;}if(M.crit)s.crit=(s.crit||0)+M.crit;
  if(M.dur){if(s.fx20)s.fx20=s.fx20.map(f=>f.t&&f.t<50?Object.assign({},f,{t:f.t+M.dur}):f);if(s.taunt20)s.taunt20+=M.dur;}
  if(M.fx.length)s.fx20=(s.fx20||[]).concat(M.fx.map(f=>Object.assign({on:'t'},f,f.p!=null&&f.p<1?{_ail:1}:{})));
  if(M.sup.length){if(s.k==='sup20')s.fx20=(s.fx20||[]).concat(M.sup);else s.post=(s.post||[]).concat(M.sup);}
  if(M.post.length)s.post=(s.post||[]).concat(M.post);
  /* Ⅲの固有効果（ver0.48）：条件で威力、遅延・防御無視・吸収・回数の上乗せ、追撃 */
  if(M.cp&&s.pow&&cnd(M.cp.c,u,t,s))s.pow*=M.cp.v;if(M.delay)s.delay=(s.delay||0)+M.delay;if(M.pierce)s.pierce20=Math.min(.9,(s.pierce20||0)+M.pierce);
  if(M.drain)s.drain=(s.drain||0)+M.drain;if(M.hits&&s.hits>1)s.hits+=M.hits;else if(M.hits&&s.pow){s.hits=1+M.hits;s.pow*=.55;}if(M.fu)s.fu3=M.fu;}catch(e){console.error(e);}
 return s;}
/* 敵の行動。全体攻撃は、倒れている味方（LP が残っている）にも追い打ちになる */
async function enemyExec(e){try{BPOP.cut();}catch(x){}B.rs.cq=[];B.rs.eSk=null;const down=B.heroes.filter(h=>!h.alive&&(h.lp||0)>0);
 const ch0=e.charging;await enemyTurn(e);

 if(B&&!B.over&&e.alive&&e.charging&&!ch0)log(`${e.name}は<b>力を溜めている</b>…！ 次の行動で強力な攻撃が来る`);
 await drainCounters();}

/* 戦闘の進行 */
const oldRun=run;
run=async function(){if(!B)return;if(B.opts&&B.opts.viewer)return oldRun();const myB=B;
 try{await opening(myB);
  while(B===myB&&!B.over){
   B.rs.round++;B.turns=B.rs.round;roundStart();
   const cmds=await inputPhase(myB);if(!cmds||B!==myB||B.over)return;
   const q=buildOrder(cmds);B.rs.q=q;refresh();
   /* コマンドを決め終えたら戦場を全面に。全員の HP・BP を少しだけ出し、最初の攻撃の前に全員分まとめて消す（ver0.46） */
   /* ver0.46d：ターンの始め＝コマンドを決めて全画面になったあと。HP・BP を 1 度だけ出して消し、ターンの始めの効果を出してから行動へ */
   /* 全画面に戻るスライド（約 0.5 秒）が終わってから HP・BP を出す（途中で出すと位置がずれて見える。ver0.46e） */
   try{BPOP.cut();}catch(e){}{let n=0;while($('#app').classList.contains('in38')&&n<40){await sleep(30);n++;}}await wait(520);
   try{V38B.hpFlash(900);}catch(e){}await wait(950);try{V38B.hpHide();}catch(e){}await wait(200);
   roundFx();if(document.querySelector('#bp46 .bp46.on:not(.out)'))await wait(900);
   while(q.length){if(B!==myB||B.over)return;const it=q.shift(),u=it.u;
    if(!u.alive)continue;if(u.side===1&&!B.enemies.includes(u))continue;if(u.side===0&&!B.heroes.includes(u))continue;
    const snap=ctSnap();B.cur=u;refresh();
    if(u.side===0)await heroExec(u,it.c);else await enemyExec(u);
    if(B!==myB||B.over)return;B.cur=null;ctApply(snap,u,q);lpGuard();refresh();
    if(!aliveE().length){if(B.opts.stages&&(B.stage||0)<B.opts.stages.length-1){await nextStage();break;}await wait(500);return end(true);}
    if(!aliveH().length){await wait(500);return end(false);}}
   roundEnd();try{BPOP.cut();}catch(e){}await wait(speed<=1?750:260);}/* 1 倍速はターンの変わり目に少し間をおく（ver0.47） *//* ターンの終わり：表示を全部消してからコマンド入力へ */
 }catch(e){console.error(e);}};
/* 行動順の表示（入力中は予想、行動中は残りの列） */
preview=function(){if(!B||!B.rs)return[...aliveH(),...aliveE()];if(B.rs.q&&B.rs.q.length)return B.rs.q.map(x=>x.u).filter(u=>u.alive);return[...aliveH(),...aliveE()].sort((a,b)=>spdOf(b)-spdOf(a));};

/* 開始：BP・LP・陣形 */
{const _sb=startBattle;startBattle=function(list,opts={}){const r=_sb(list,opts);try{if(B){
  B.rs={round:0,cur:null,cq:[],q:[],phase:'input',eSk:null,missed:false};
  B.heroes.forEach((h,i)=>{C.applyForm(h,i);h.bpMax0=h.bpMax=(h.bpMax||D.BP.max)+sumE(h,'bpmax');h._rsGuts=0;h._rsRage=0;h._rsHeat=0;h._rsAR=0;h._rsHB=0;});
  B.heroes.forEach(h=>{h.sp=bpStart(h);if((h.lp||0)<=0){h.alive=false;h.hp=0;}});
  setTimeout(()=>{try{if(!B||!B.rs)return;for(const h of B.heroes){if(!h.alive)continue;for(const e of effs(h))if(e.t==='start'){const tg=e.on==='allies'?aliveH():e.on==='enemies'?aliveE():[h];
    for(const x of tg)V20.addSt(x,e.k,e.k==='shield'?Math.round(x.mhp*e.v/100):e.v,e.d||3);}h.sp=clamp(h.sp,0,h.bpMax);}refresh();}catch(e){console.error(e);}},420);}}catch(e){console.error(e);}return r;};}
/* 戦闘の終わり：LP を控える（クエスト中は引き継ぐ）。LP 0 の味方は HP 0 のまま */
{const _e=end;end=async function(win){try{if(B&&B.rs)for(const h of B.heroes){if(G.h[h.id])G.h[h.id].lp=h.lp;}}catch(e){}
 const r=await _e(win);try{if(B&&B.rs)for(const h of B.heroes){const g=G.h[h.id];if(g&&(h.lp||0)<=0)g.hp=0;}}catch(e){}return r;};}
/* 武器パッシブ「知識の泉」：BP+2 */
try{const P=V20.PS.w_wisdom;if(P){P.v=2;P.d='戦闘開始時のBP+{v}';P.start=(u,v)=>{u.sp=Math.min(u.bpMax||20,u.sp+Math.round(v));};}}catch(e){}
/* 星臨ゲージの溜まり方（アビリティ） */
{const _hit2=hit;hit=async function(a,t,sk){const ag0=a&&a.side===0&&!a.aw?a.ag:null;const d=await _hit2(a,t,sk);try{if(ag0!=null&&a.ag>ag0){const m=sumE(a,'ag');if(m)a.ag=Math.min(100,ag0+(a.ag-ag0)*(1+m/100));}}catch(e){}return d;};}

/* ==================== オート ==================== */
const known=(e,el)=>!!el&&e.known&&e.known.has(el)&&e.weak.includes(el);
function score(u,s,es,tgt){if(!s)return-1;const pw=(s.pow||1)*((s.hits||1)>1?s.hits:1);let n=s.t==='all'?es.length:1,w=s.t==='all'?es.filter(e=>known(e,s.el)).length/Math.max(1,es.length):known(tgt,s.el)?1:0;return pw*n*(1+.7*w);}
const usable=(u,s)=>s&&C.costOf(u,s)<=u.sp&&(!C.lpCost(s)||(u.lp||0)>C.lpCost(s));
autoPick=function(u){if(!B||!B.rs)return{sk:ATK(u),t:aliveE()[0]};
 const full=auto&&AM==='f',pol=full||(typeof awPolicy==='function'&&awPolicy())||!auto;
 if(!u.aw&&u.ag>=100&&B.heroes.filter(h=>h.aw).length<2&&(full||pol&&auto))return{aw:true};
 const es=aliveE().sort((a,b)=>a.hp-b.hp),tgt=B.tgt&&B.tgt.alive?B.tgt:es[0];if(!tgt)return{sk:ATK(u)};
 const sks=(u.rsSet||[]).map(k=>SK[k]).filter(s=>usable(u,s));
 if(u.aw&&!u._rsOugi){const o=SK[(D.AWX[u.id]||{}).ou];if(o){const ok=o.k==='rewind'?!!B.snap&&aliveH().reduce((a,h)=>a+h.hp/h.mhp,0)<B.heroes.length*.55:o.k==='reviveAll'?B.heroes.some(h=>!h.alive&&(h.lp||0)>0)||aliveH().some(h=>h.hp<h.mhp*.5)||awLeft(u)<=1:true;if(ok)return{sk:o,t:tgt};}}
 const low=aliveH().filter(h=>h.hp<h.mhp*.45),down=B.heroes.filter(h=>!h.alive&&(h.lp||0)>0);
 const heals=sks.filter(s=>s.k==='heal'||s.k==='healAll'||(s.k==='sup20'&&s.heal20));
 /* 復活：回復術（単体）があれば倒れた仲間を起こす */
 const rv=heals.find(s=>C.isHealSpell(s)&&s.t==='ally');if(down.length&&rv&&(u.lp||0)>2)return{sk:rv,t:down[0]};
 if(low.length&&heals.length){const s=low.length>=2?heals.find(x=>x.k!=='heal')||heals[0]:heals.find(x=>x.k==='heal')||heals[0];return{sk:s,t:low[0]};}
 const sup=sks.filter(s=>s.k==='sup20'&&!s.heal20&&!(s.fx20||[]).every(f=>f.on==='enemies'||(f.on==='self'?(u.sts||[]).some(x=>x.k===f.k):aliveH().every(h=>(h.sts||[]).some(x=>x.k===f.k)))));
 if(sup.length&&Math.random()<.3&&B.rs.round<=4)return{sk:sup[Math.random()*sup.length|0]};
 const atks=sks.filter(s=>s.k==='phys'||s.k==='mag');
 /* 通常攻撃が 2 つあるとき（鎌杖）：相手の防御・精神と弱点で、通る方を選ぶ */
 const est=s=>(s.k==='mag'?st(u,'mag')*s.pow-st(tgt,'res')*.5:st(u,'atk')*s.pow-st(tgt,'def')*.5)*(known(tgt,s.el)?1.7:1);
 let best=basicsOf(u).sort((a,b)=>est(b)-est(a))[0],bs=score(u,best,es,tgt)*.9;
 for(const s of atks){const v=score(u,s,es,tgt)-(C.costOf(u,s)>u.sp-2&&u.sp<10?.4:0);if(v>bs){bs=v;best=s;}}
 return{sk:best,t:tgt};};
/* リピート：BP・LP が足りるときだけ */
repOK=function(u){const L=LASTA[u.id];if(!L||!L.sk)return null;let s=L.sk;if(s.basic)return s.bn&&ALTATK(u)&&ALTATK(u).bn===s.bn?ALTATK(u):ATK(u);if(s.k==='item'||s.t==='ally'||s.ougi)return null;
 if(!(u.rsSet||[]).some(k=>SK[k]===s))return null;if(!usable(u,s)&&!DEV())return null;return s;};

return{effs,sumE,cnd,isDmg,dying,banner,awLeft,bpStart,bpReg,buildOrder,heroExec,inputPhase,psEach,lpLose,usable};})();
