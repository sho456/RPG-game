/* ===== ver0.37 戦闘システム刷新（画面）=====
 1. 戦闘のコマンド入力：技・術（セットした 4 つ）＋通常攻撃＋奥義（星臨中）＋共鳴技。消費は BP。防御・逃げるは廃止
    作戦タブ：交代・オーバードライブ・前のキャラに戻る
 2. 戦場の表示：OD ゲージ・行動順・陣形・BP（SP の表示を BP に）
 3. キャラ詳細：能力値（8 種）・技・術（技セットの付け外し・熟練）・アビリティ（段階と効果）・星臨（星臨アビリティと奥義）
 4. 編成：陣形の選択 */
'use strict';
const RSU=(()=>{
const D=RSD,C=RSC,X=RSB,esc=C.esc,clamp=C.clamp;
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const inB=()=>scene==='battle'&&!!B&&!B.over;
const hx=(el,col,cls='')=>`<i class="hx20 ${cls}" style="--c:${col||'#8890c0'}">${el||'無'}</i>`;
const HAND='<svg class="ic22" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 6.6h7.4l-.9-1.6C7 4 7.8 3.2 8.8 3.8l4.6 3c.8.5 1.3 1.4 1.3 2.4v1.6c0 1.7-1.4 3-3 3H6.4c-.7 0-1.2-.5-1.2-1.1 0-.4.2-.7.5-.9-.6-.1-1-.6-1-1.1 0-.4.2-.7.5-.9-.6-.1-1-.6-1-1.2 0-.2 0-.3.1-.5H1z"/></svg>';
const badge=s=>{try{return skBadge(s);}catch(e){return[s.el||'無','#c8c8e0'];}};
const tyOf=s=>s.basic?(s.k==='mag'?'術':'技'):s.ougi?'奥義':s.k==='item'?'道具':s.ty||(s.k==='mag'?'術':'技');
const tyCls=s=>s.ougi?'aw':s.k==='item'?'it':/heal|revive/i.test(s.k||'')||s.heal20||s.role==='heal'?'hl':s.k==='sup20'||s.k==='rewind'?'sp':tyOf(s)==='術'?'mg':'ph';

/* ==================== 技の詳細 ==================== */
function info(sk,u){const id=u&&(u.id||u),s=sk.basic?Object.assign({},sk,{n:'通常攻撃',d:'BPを使わない基本の攻撃。使うとBP+1'}):sk,[el,ec]=badge(s),k=C.keyOf(sk);
 const cost=s.basic?'0（BP+1）':s.ougi?'0（星臨中に1度だけ）':s.k==='item'?'―':u&&u.side===0?C.costOf(u,s):s.bp,pl=id&&k&&D.NEW[k]?C.profLv(id,k):null;
 const tgt=D.TGT[s.t]||(s.t==='ally'?'味方1人':'―');
 ovOpen(`<div class="inf22 rs37i" style="--ec:${ec}"><div class="ih">${hx(el,ec)}<b>${esc(s.n||'')}</b><span class="tg ${tyCls(s)}">${tyOf(s)}</span></div>
  <div class="id">${esc(s.d||'')}</div>
  <dl class="dl22"><dt>種類</dt><dd>${tyOf(s)}${s.cat&&TERMS.SKILL[s.cat]?'（'+TERMS.SKILL[s.cat].n+'）':''}</dd><dt>属性</dt><dd>${s.el||'なし'}</dd><dt>対象</dt><dd>${tgt}</dd>
   <dt>威力</dt><dd>${s.rk?'ランク '+s.rk+(s.hits>1?' ×'+s.hits+'回':''):s.basic?'D':s.ougi?'奥義':'―'}</dd><dt>消費BP</dt><dd>${cost}</dd>
   ${s.prio?`<dt>行動順</dt><dd>${s.prio>0?'先制':'後発'}</dd>`:''}
   ${pl?`<dt>技Lv</dt><dd>${pl}（熟練 ${C.profN(id,k)}回）　威力+${(pl-1)*2}%${pl>=4?'・消費-'+(pl>=8?2:1):''}</dd>`:''}
   ${id&&k&&HB[id]&&C.howTxt(id,k)?`<dt>習得</dt><dd>${C.howTxt(id,k)}</dd>`:''}</dl>
  ${u&&B&&B.tgt&&s.el&&scene==='battle'?`<div class="iw">${esc(B.tgt.name)}に対して：${B.tgt.weak.includes(s.el)&&B.tgt.known.has(s.el)?'<b class="w">弱点を突ける ▲</b>':TERMS.resists(B.tgt,s.el)?'<b>耐性がある（Resist）</b>':'弱点は分かっていない'}</div>`:''}</div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}

/* ==================== 戦闘のコマンド入力 ==================== */
chooseRoot=function(u,ctx={}){const idx=ctx.idx||0,tot=ctx.n||1;
 return new Promise(res0=>{let tab='sk',sel=-1,sub=null,lock=false,R=[];const dev=DEV();
  const res=v=>{B.res=null;B.pick=null;B.sel22=null;try{bbar();}catch(e){}res0(v);};
  const fin=(sk,t)=>{LASTA[u.id]={sk};res(t?{sk,t}:{sk});};
  B.res=()=>res(autoPick(u));
  const use=sk=>{if(sk.k==='reso'||sk.t==='all'||sk.t==='self')return fin(sk);
   if(sk.t==='one'||sk.basic){if(!B.tgt||!B.tgt.alive)B.tgt=aliveE()[0];return fin(sk,B.tgt);}
   const pool=sk.revive?B.heroes.filter(h=>!h.alive):aliveH();if(!pool.length){log('対象がいない');return;}
   sub={t:`<b>${esc(sk.n||ITEMS[sk.id].n)}</b>　誰に？`,rows:pool.map(t=>({el:'味',ec:'#7dffa8',n:t.name,d:t.alive?`HP ${t.hp}/${t.mhp}`:'戦闘不能',cost:t.alive?`${t.hp}/${t.mhp}`:'',now:1,f:()=>fin(sk,t)}))};draw();};
  const rows=()=>{if(sub)return[...sub.rows,{el:'戻',ec:'#aab0d8',n:'もどる',cls:'back',now:1,f:()=>{sub=null;draw();}}];const o=[];
   if(tab==='sk'){
    if(canReso())o.push({el:'共',ec:'#ff9ad6',n:`共鳴技「${resoName()}」`,d:'二人の星臨を重ねる大技（1戦闘に1回）',cls:'reso',sk:{n:'共鳴技「'+resoName()+'」',k:'reso',t:'all',d:'二人の星臨を重ねる大技（1戦闘に1回）'},cost:'共鳴',f:()=>fin({k:'reso'})});
    if(u.aw){const ok=SK[(D.AWX[u.id]||{}).ou];if(ok){const[e,c]=badge(ok),used=!!u._rsOugi,noSnap=ok.k==='rewind'&&!B.snap;o.push({el:e,ec:c,n:`奥義「${ok.n}」`,d:ok.d,sk:ok,cost:used?'使用済':'奥義',cls:'ougi',dis:used||noSnap,f:()=>use(ok)});}}
    const a=ATK(u),[ae,ac]=badge(a);o.push({el:ae,ec:ac,n:'通常攻撃',d:'BPを使わない基本の攻撃（BP+1）',cost:'BP+1',sk:a,cls:'basic',f:()=>use(a)});
    (u.rsSet||[]).forEach(k=>{const s=SK[k];if(!s)return;const[e,c]=badge(s),cs=C.costOf(u,s),pl=C.profLv(u.id,k);
     o.push({el:e,ec:c,n:s.n+(pl>1?`<em class="pl">Lv${pl}</em>`:''),d:s.d||'',sk:s,cost:'BP '+cs,ng:!dev&&cs>u.sp,dis:!dev&&cs>u.sp,f:()=>use(s)});});
    if(!(u.rsSet||[]).length)o.push({el:'？',ec:'#aab0d8',n:'技セットが空',d:'キャラ詳細の「技・術」で 4 つまでセットできる',dis:1,f:()=>{}});}
   if(tab==='it'){const I=G.items,dead=B.heroes.some(h=>!h.alive);Object.keys(ITEMS).filter(k=>(I[k]||0)>0||k==='potion').forEach(k=>{const rv=k==='feather'||k==='tail';
     o.push({el:'道',ec:'#7dffa8',n:ITEMS[k].n,d:ITEMS[k].d,cost:'×'+(I[k]||0),ng:!I[k],dis:!I[k]||(rv&&!dead),now:1,sk:{n:ITEMS[k].n,k:'item',id:k,t:'ally',d:ITEMS[k].d},f:()=>use({k:'item',id:k,t:'ally',revive:rv,n:ITEMS[k].n})});});}
   if(tab==='op'){const rs=G.members.filter(id=>!B.heroes.some(h=>h.id===id)&&G.h[id].hp!==0),od=B.rs.od>=D.OD.max;
    o.push({el:'Ｏ',ec:'#ff9ad6',n:B.rs.odArmed?'オーバードライブ（予約中）':'オーバードライブ',d:od?(B.rs.odArmed?'もう一度押すと取り消す':'このターン、味方全員が敵より先に続けて行動する（連携・与ダメ+20%）'):`ODゲージが満タンで使える（${Math.floor(B.rs.od)}%）`,cost:Math.floor(B.rs.od)+'%',dis:!od,cls:B.rs.odArmed?'odon':'',now:1,f:()=>res({od:1})});
    o.push({el:'替',ec:'#c8b0ff',n:'交代',d:rs.length?'控えの仲間と入れ替わる（行動を消費しない）':'控えがいない',dis:!rs.length||u.swapped||u.aw,now:1,f:()=>{sub={t:'<b>交代</b>　誰と入れ替わる？',rows:rs.map(id=>({el:elOf(id)||'無',ec:elCol(id),n:HB[id].name,d:`Lv${G.h[id].lv}　${clsOf(id)}`,cost:'Lv'+G.h[id].lv,now:1,f:()=>res({swap:id})}))};draw();}});
    o.push({el:'戻',ec:'#aab0d8',n:'前のキャラに戻る',d:idx>0?'ひとつ前のキャラの行動を選び直す':'最初のキャラ',dis:idx<=0,now:1,f:()=>res({back:1})});}
   return o;};
  const tabs=[['sk',u.aw?'技・奥義':'技・術'],['it','道具'],['op','作戦']];
  const draw=()=>{const c=$('#cmd');c.className='bcmd v22 rs37';sel=-1;B.sel22=null;if(lock){c.innerHTML='<div class="bwait">…</div>';return;}R=rows();
   c.innerHTML=(sub?`<div class="bsub v22">${sub.t}</div>`:`<div class="btabs v22">${tabs.map(([k,l])=>`<button class="${tab===k?'on':''}" data-t="${k}">${l}</button>`).join('')}<span class="rsbp${B.rs.odArmed?' od':''}">${idx+1}/${tot}<b>BP ${dev?'∞':u.sp}</b><small>/${u.bpMax||20}</small></span></div>`)+
    `<div class="blist v22">${R.map((r,i)=>`<button class="sk ${r.cls||''}" data-i="${i}" data-v20="1" ${r.dis?'disabled':''}><span class="hd">${HAND}</span>${r.el?hx(r.el,r.ec,'el'):''}<span class="nm">${r.n}</span>${r.cost?`<span class="cost${r.ng?' ng':''}">${String(r.cost).replace(/^BP /,'<small>BP</small>')}</span>`:''}${r.sk?`<span class="inf" data-inf="${i}">i</span>`:''}</button>`).join('')}</div>`;
   c.scrollTop=0;try{bbar();}catch(e){}};
  const head=()=>log(`<b>${u.name}</b>の行動　<small>${idx+1}/${tot}人目${u.aw?`・星臨 残り${X.awLeft(u)}ターン`:''}${B.rs.odArmed?'・<b style="color:#ff9ad6">OD 予約中</b>':''}　技を2回タップで決定／敵をタップで狙う</small>`);
  B.pick={u,tab:k=>{tab=k;sub=null;SFX.sel();draw();},
   row:i=>{const r=R[i];if(!r||r.dis)return;SFX.sel();if(r.now||G.set.tap1||sel===i)return r.f();sel=i;B.sel22=r.sk||null;[...$('#cmd').querySelectorAll('.blist .sk')].forEach((b,j)=>b.classList.toggle('sel',j===i));
    log(`<b>${r.n.replace(/<[^>]+>/g,'')}</b>　${esc(r.d||'')}<br><small style="color:#ffe27a">▶ もう一度タップで決定${B.tgt&&aliveE().length>1?'（狙い：'+esc(B.tgt.name)+'）':''}</small>`);},
   info:i=>{const r=R[i];if(r&&r.sk){SFX.sel();info(r.sk,u);}},
   rep:()=>{const s=repOK(u);if(s&&!lock)use(s);},retarget:()=>{if(sel>=0&&R[sel])log(`<b>${R[sel].n.replace(/<[^>]+>/g,'')}</b>　${esc(R[sel].d||'')}<br><small style="color:#ffe27a">▶ もう一度タップで決定（狙い：${esc(B.tgt.name)}）</small>`);},
   od:()=>{if(lock)return;if(B.rs.od>=D.OD.max||B.rs.odArmed)res({od:1});},
   aw:async()=>{if(lock||u.aw)return;if(!DEV()&&!(u.ag>=100&&B.heroes.filter(h=>h.aw).length<2))return;if(DEV())u.ag=100;lock=true;sub=null;draw();const rr=B.res;B.res=null;await awaken(u);B.res=rr;lock=false;tab='sk';draw();head();try{tip(canReso()?'reso':'awake2');}catch(e){}}};
  head();draw();refresh();
  try{if(!tip('battle')&&u.ag>=100&&!u.aw)tip('awake');}catch(e){}});};
/* ⓘ：行の選択より先に拾う（v22 の仕組みをそのまま使う） */

/* ==================== 戦場の表示 ==================== */
function hud(){let h=$('#rshud');if(!h||!h.isConnected){h=document.createElement('div');h.id='rshud';
  h.innerHTML='<div class="od" role="button" aria-label="オーバードライブ"><em>OD</em><div class="g"><i></i></div><span></span></div><div class="fm"></div><div class="q"></div>';
  h.querySelector('.od').addEventListener('click',e=>{e.stopPropagation();if(B&&B.pick&&B.pick.od){SFX.sel();B.pick.od();}});}
 const par=$('#bt22 .b22hd')||$('#stage');if(h.parentNode!==par)par.appendChild(h);return h;}
function updHud(){if(!B||!B.rs||scene!=='battle'){const h=$('#rshud');if(h)h.style.display='none';return;}const h=hud();h.style.display='';
 const od=B.rs.od,full=od>=D.OD.max;h.classList.toggle('full',full);h.classList.toggle('arm',!!B.rs.odArmed);
 const gi=h.querySelector('.od .g i'),w=Math.min(100,od).toFixed(1)+'%';if(gi.style.width!==w)gi.style.width=w;
 const tx=B.rs.odArmed?'予約':full?'MAX':Math.floor(od)+'%',sp=h.querySelector('.od span');if(sp.textContent!==tx)sp.textContent=tx;
 const fm=h.querySelector('.fm'),fn=D.FORM[C.formOf()].n;if(fm.textContent!==fn)fm.textContent=fn;
 const L=(B.rs.q&&B.rs.q.length?B.rs.q.map(x=>x.u):[]).filter(u=>u.alive).slice(0,7),cur=B.cur;
 const qh=(cur&&!B.pick?`<i class="c ${cur.side?'e':'h'}">${esc(cur.name)}</i>`:'')+L.map(u=>`<i class="${u.side?'e':'h'}">${esc(u.name)}</i>`).join('');
 const q=h.querySelector('.q');if(q._h!==qh){q._h=qh;q.innerHTML=qh;}}
function bpLabels(){if(!B)return;try{const bp=$('#bp24');if(bp){const em=bp.querySelector('.bx.sp em'),sm=bp.querySelector('.bx.sp small');if(em&&em.textContent!=='BP')em.textContent='BP';const h=bp._h;if(sm&&h){const t='/'+(h.bpMax||20);if(sm.textContent!==t)sm.textContent=t;}}
  document.querySelectorAll('#labels .hs span').forEach(s=>{if(/^SP/.test(s.textContent))s.textContent=s.textContent.replace(/^SP/,'BP');});
  const P=$('#party');if(P){const em=P.querySelector('.bx.sp em');if(em&&em.textContent!=='BP')em.textContent='BP';const sm=P.querySelector('.bx.sp small');const a=B.cur&&B.cur.side===0?B.cur:B.lastH;if(sm&&a&&sm.textContent!=='/'+(a.bpMax||20))sm.textContent='/'+(a.bpMax||20);}}catch(e){}}
{const _rf=refresh;refresh=function(){_rf();if(!B||scene!=='battle')return;try{for(const h of B.heroes)if(h.sp>(h.bpMax||20))h.sp=h.bpMax||20;updHud();bpLabels();}catch(e){console.error(e);}};}
/* HP・SP のキャラ横表示（canvas の文字）を BP に */
try{const _el=TX24.el;TX24.el=function(t,...a){if(t==='SP'&&a[0]==='sp')t='BP';return _el.call(this,t,...a);};}catch(e){}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle'){const h=$('#rshud');if(h)h.style.display='none';}};}
/* 状態の詳細（パネルのタップ）：SP→BP */
{const _ov=ovOpen;ovOpen=function(html,acts){if(scene==='battle'&&/<dt>SP<\/dt>/.test(html)){html=html.replace(/<dt>SP<\/dt><dd>([^<]*)\/ 100<\/dd>/,(m,a)=>`<dt>BP</dt><dd>${a}/ ${(B&&B.cur&&B.cur.bpMax)||20}</dd>`).replace('<dt>SP</dt>','<dt>BP</dt>');}return _ov(html,acts);};}

/* ==================== キャラ詳細 ==================== */
const RK=['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'];
function stars(r){return`<span class="rsst">${[1,2,3,4,5].map(i=>`<i class="${i<=r?'on':''}"></i>`).join('')}</span>`;}
function skCard(id,k,o={}){const s=SK[k];if(!s)return'';const[el,ec]=badge(s),on=o.set,pl=C.profLv(id,k),u={id,side:0},cs=s.ougi?'奥義':'BP '+C.costOf(u,s);
 return`<div class="sk22 x22 rs37${o.lock?' lock':''}${on?' on':''}" style="--ec:${ec}"><div class="h">${hx(el,ec,'sm')}<b>${esc(s.n)}</b><span class="tg ${tyCls(s)}">${tyOf(s)}</span>${s.rk?`<span class="tg rkx">${s.rk}</span>`:''}<span class="c">${cs}</span>${on?'<span class="tg set">SET</span>':''}</div>
  <div class="d">${esc(s.d||'')}</div>
  <div class="rsrow"><small>${o.lock?'習得：'+esc(o.how||''):`技Lv${pl}　熟練${C.profN(id,k)}回${o.how?'　'+esc(o.how):''}`}</small>
   ${o.btn?`<span class="rsb">${on&&o.i>0?`<button class="tbtn" data-a="rsup" data-v="${k}">↑</button>`:''}<button class="tbtn${on?'':' gold'}" data-a="rsset" data-v="${k}">${on?'外す':'セット'}</button><button class="tbtn" data-a="rsinfo" data-v="${k}">詳細</button></span>`:''}</div></div>`;}
function skillsHTML(id){const h=G.h[id],set=C.setOf(id),L=C.learned(id),all=(D.LEARN[id]||[]).map(x=>x[0]),lock=all.filter(k=>!L.includes(k));
 const jk=h.job&&D.JOBSK[h.job];
 return`<div class="sh22">技・術セット <small>${set.length}/4</small></div><div class="rsnote">戦闘で使えるのは、ここにセットした4つ＋通常攻撃（星臨中は奥義も）</div>
  <div class="rsset">${[0,1,2,3].map(i=>{const k=set[i],s=k&&SK[k];return s?`<div class="sl on" style="--ec:${badge(s)[1]}"><i>${i+1}</i><b>${esc(s.n)}</b><small>BP ${C.costOf({id,side:0},s)}</small></div>`:`<div class="sl"><i>${i+1}</i><small>空き</small></div>`;}).join('')}</div>
  <div class="sh22">覚えている技・術 <small>${L.length}種</small></div>${L.map(k=>skCard(id,k,{set:set.includes(k),i:set.indexOf(k),btn:1,how:C.howTxt(id,k)})).join('')}
  ${lock.length?`<div class="sh22">まだ覚えていない</div>${lock.map(k=>skCard(id,k,{lock:1,how:C.howTxt(id,k)})).join('')}`:''}
  ${!jk?`<div class="rsnote">ジョブに就くと、そのジョブの技を1つ覚える（剣士・重騎士・癒し手・狩人）</div>`:''}
  <div class="rsnote">技は使うほど<b>技Lv</b>が上がる（威力+2%/Lv、Lv4・Lv8で消費BP-1）。<b>ひらめき</b>は戦闘中にだけ起きる（強い敵ほど閃きやすい）</div>`;}
function abHTML(id){const h=G.h[id],ups=C.abUps(id);let wp=null,w=null;try{w=h.eq.w&&findItem(h.eq.w);wp=V20.wpOf(w);}catch(e){}
 return`<div class="sh22">アビリティ <small>Lvで解放。Lvと星盤・天星盤で強化（最大Ⅴ）</small></div>${(D.AB[id]||[]).map((A,i)=>{const r=C.abRank(id,i),lv0=D.ABL[i],cur=r?C.abDesc(id,i,r):[],nx=C.abNext(id,i,r||0),full=C.abDesc(id,i,5);
   return`<div class="rsab${r?'':' lock'}"><div class="h"><i class="n">${i+1}</i><b>${esc(A.n)}</b>${stars(r)}<em>${r?'段階'+RK[r]:'Lv'+lv0+'で解放'}</em></div>
    <ul>${(r?cur:full).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
    ${r&&nx.length?`<div class="nx"><small>次の段階（${RK[r+1]}）：</small>${nx.map(esc).join('／')}</div>`:''}
    <div class="src"><small>段階：Lv${lv0}でⅠ・Lv${lv0+30}でⅡ・Lv${lv0+60}でⅢ${ups[i+1]?`　星盤・天星盤 +${ups[i+1]}`:''}</small></div></div>`;}).join('')}
  <div class="sh22">武器アビリティ</div><div class="rsab${wp?'':' lock'}"><div class="h"><i class="n">武</i><b>${wp?esc(wp.n):'なし'}</b></div><ul><li>${wp?esc(wp.d):'アンコモン以上の武器を装備すると、武器ごとの固有の効果が付く'}</li></ul><div class="src"><small>装備：${w?esc(w.name):'なし'}</small></div></div>
  ${ups.O?`<div class="rsnote">奥義の威力 +${ups.O*30}%（天星盤）</div>`:''}`;}
function awHTML(id){const h=G.h[id],A=AW[id],Xw=D.AWX[id],lv=h.awLv||1,nx=lv+1,req=nx===2?15:30,ok=lv<3&&h.lv>=req,ou=Xw&&SK[Xw.ou],ef=C.awEffects(id).filter(e=>e.t!=='onaw'||1);
 return`<div class="aw22" style="--ec:${elCol(id)}"><div class="ah"><img src="${art(id,true)}" alt=""><div><small>${SEIRIN.n}</small><b>《${esc(A.name)}》</b><span class="rk">${'<i class="on"></i>'.repeat(lv)}${'<i></i>'.repeat(3-lv)}<em>位階${ROMAN[lv]}</em></span></div></div>
  <div class="al">${SEIRIN.n}ゲージが満タンになると、行動を消費せずに発動。<b>${awN({id,awTurn:(stats(id).awTurn||0),awLv:lv})}ターン</b>のあいだ星臨アビリティで大きく強くなり、いつもの技・術に加えて<b>奥義</b>を1度だけ使える。</div>
  <div class="sh22">星臨アビリティ「${esc(Xw?Xw.n:A.name)}」</div><ul class="rsaw">${(Xw?Xw.note:[]).map(t=>`<li>${esc(t)}</li>`).join('')}${ef.map(e=>`<li>${esc(C.effTxt(e))}</li>`).join('')}</ul>
  <dl class="dl22"><dt>持続</dt><dd>${D.AW_TURNS}ターン＋位階（Ⅱ・Ⅲで+1ずつ）＋星盤</dd><dt>発動</dt><dd>${SEIRIN.g}100%（行動を消費しない・同時に2人まで）</dd><dt>位階</dt><dd>${lv>=3?'最高位':`次：位階${ROMAN[nx]}（Lv${req}以上で試練）`}</dd></dl>
  ${lv<3?`<button class="tbtn${ok?' gold':''} wide" data-a="tr" ${ok?'':'disabled'}>${SEIRIN.n}の試練へ<small>${ok?'挑戦できる':`Lv${req}で挑戦できる`}</small></button>`:''}</div>
  <div class="sh22">奥義 <small>星臨中に1度だけ・BP 0</small></div>${ou?skCard(id,Xw.ou,{}):''}`;}
function st8HTML(id){const s=stats(id),r=s.rs8;if(!r)return'';const P=C.pf(id),d=C.derived(r);
 return`<div class="sh22 rs8h">能力値 <small>武器：${esc(P.wp)}（技の威力＝${Object.entries(P.w).map(([k,v])=>D.ST8N[k]+'×'+Math.round(v*100)+'%').join('＋')}）</small></div>
  <div class="rs8">${D.ST8.map(k=>`<div class="r" title="${esc(D.ST8D[k])}"><span><i class="g${P.base[k][1]}">${P.base[k][1]}</i>${D.ST8N[k]}</span><b>${r[k]}</b><small>${esc(D.ST8D[k])}</small></div>`).join('')}</div>
  <div class="rsnote">器用さ→会心率+${d.critB}%　愛→回復量×${d.healMul}　魅力→追加効果の成功率×${d.ailMul}・OD×${d.odMul}</div>`;}
{const _ch=charHTML;charHTML=function(id,tab,ed){const mine=tab==='sk'||tab==='ab'||tab==='aw';let s=_ch(id,mine?'__':tab,ed);
 try{if(mine)s=s.replace('<div class="cbody"></div>',`<div class="cbody c22 rs37">${tab==='sk'?skillsHTML(id):tab==='ab'?abHTML(id):awHTML(id)}</div>`);
  if(tab==='st'){const h8=st8HTML(id);const i=s.indexOf('<div class="cnote">');s=i>=0?s.slice(0,i)+h8+s.slice(i):s+h8;s=s.replace(/攻撃時SP(<\/span><b>)\+\d+/,(m,a)=>`通常攻撃時BP${a}+${1+Math.min(2,Math.floor((stats(id).spGain||0)/5))}`);}
  s=s.replace(/<div class="ctabs[^"]*">[\s\S]*?<\/div>/,`<div class="ctabs c22 rs37">${[['st','能力値'],['eq','装備'],['sk','技・術'],['ab','アビリティ'],['aw',SEIRIN.n],['bd','星盤']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>`);
  s=s.replace(/パッシブ/g,'アビリティ');}catch(e){console.error(e);}
 return s;};}
function acts(o,id,re){o.rsset=k=>{const r=C.toggleSet(id,k);save();re(`「${SK[k].n}」を${r}`);};o.rsup=k=>{C.moveSet(id,k,-1);save();re();};o.rsinfo=k=>info(SK[k],{id,side:0});}
{const _em=equipMenu;equipMenu=function(id,m){_em(id,m);try{const cid=G.members.includes(id)?id:G.party[0];acts(ACT,cid,mm=>equipMenu(cid,mm));}catch(e){console.error(e);}};}
{const _os=openSheet;openSheet=function(id,tab){_os(id,tab);try{const cid=G.members.includes(id)?id:G.party[0];acts(SACT,cid,()=>openSheet(cid));}catch(e){console.error(e);}};}

/* 編成の「技・星臨」一覧（v22 の partyInfo）：中身を新しい表示に差し替え、アビリティのタブを足す */
{const _p=panel;panel=function(html,a){_p(html,a);try{const pi=$('#cmd .pi22');if(!pi)return;const t=pi.querySelector('.pi22t');
  if(t&&!t.querySelector('[data-v="ab"]')){const b=document.createElement('button');b.dataset.a='k';b.dataset.v='ab';b.innerHTML='アビリティ';const ref=t.querySelector('[data-v="rs"]');ref?t.insertBefore(b,ref):t.appendChild(b);}
  const on=t&&t.querySelector('button.on'),k=on?on.dataset.v:'ab',mb=pi.querySelector('.pim button.on'),id=mb?mb.dataset.v:G.party[0];
  if(t&&!on){const b=t.querySelector('[data-v="ab"]');if(b)b.classList.add('on');}
  const box=pi.querySelector('.pib');if(!box||!HB[id])return;
  if(k==='sk'||k==='ab'||k==='aw'){box.innerHTML=k==='sk'?skillsHTML(id):k==='ab'?abHTML(id):awHTML(id);if(k==='ab')log(`<b>${HB[id].name}のアビリティ</b>　Lvと星盤・天星盤で強化される`);
   acts(ACT,id,()=>{if(ACT.m)ACT.m(id);});const d0=ACT.det;if(d0)ACT.det=()=>{CTAB=k;equipMenu(id);};}}catch(e){console.error(e);}};}

/* ==================== 陣形 ==================== */
function formOpen(back){const cur=C.formOf(),P=G.party;
 ovOpen(`<div class="rsfm"><div class="hd"><b>陣形</b><small>編成の並び順（1〜4番目）ごとに効果が付く。並び順は編成画面で入れ替えられる</small></div>
  ${Object.entries(D.FORM).map(([k,F])=>`<div class="f${k===cur?' on':''}" data-a="pick" data-v="${k}"><div class="n"><b>${esc(F.n)}</b>${k===cur?'<em>使用中</em>':''}</div><div class="d">${esc(F.d)}</div>
   <div class="sl">${[0,1,2,3].map(i=>`<span><i>${i+1}</i>${P[i]?esc(HB[P[i]].name):'―'}<small>${F.s[i].map(e=>esc(C.effTxt(e))).join('・')}</small></span>`).join('')}</div></div>`).join('')}</div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{pick:k=>{G.form=k;save();formOpen(back);},close:()=>{ovClose();if(back)back();}});}
{const _ps=partyScreen;partyScreen=function(m){_ps(m);try{const ph=$('#cmd .ps22 .ph');if(ph&&!$('#cmd .rsfb')){ph.insertAdjacentHTML('afterend',`<button class="rsfb" data-a="rsform"><small>陣形</small><b>${esc(D.FORM[C.formOf()].n)}</b><span>${esc(D.FORM[C.formOf()].d)}</span></button>`);ACT.rsform=()=>formOpen(()=>partyScreen());}}catch(e){console.error(e);}};}

/* ==================== 版表示・お知らせ ==================== */
const VER='ver0.37';
const NEWS=`<div class="nt"><b>${VER}</b>　戦闘システムを全面的に作り直しました<br><small>・<b>ターン制</b>：ターンの始めに味方全員の行動を決め、素早さの順に動く。<b>防御・逃げる</b>は廃止<br>`+
 `・<b>BP</b>：技・術はBPを使う。毎ターン回復し、通常攻撃でも少し溜まる。<b>威力ランク</b>（E〜SSS）<br>`+
 `・<b>連携</b>：味方が続けて攻撃するとダメージが伸びる（最大5連携）。<b>オーバードライブ</b>：ODゲージが満タンなら、味方全員が先に続けて動ける<br>`+
 `・<b>技・術</b>：数を絞り、効果を統合して追加効果を増やした。戦闘に持ち込めるのは<b>4つまで</b>（キャラ詳細の「技・術」でセット）。使うほど<b>技Lv</b>が上がり、戦闘中に<b>ひらめく</b>ことも<br>`+
 `・<b>アビリティ</b>（旧パッシブ）：1人3つ。Lvで解放され、Lvと星盤・天星盤で強化（Ⅰ〜Ⅴ）。1つに細かい効果がいくつも付く<br>`+
 `・<b>星臨</b>：発動中は「星臨アビリティ」で大きく強化され、いつもの技・術に加えて<b>奥義</b>を1度だけ使える<br>`+
 `・<b>能力値</b>：腕力・体力・器用さ・素早さ・知力・精神・愛・魅力の8種。<b>陣形</b>：編成画面で選ぶ<br>`+
 `・<b>向き</b>：味方の原画（通常・星臨）の向きを「左向き」と定め、全員その向きで表示</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n37')){const d=document.createElement('div');d.className='n37';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;};const v=$('#verL');if(v)v.textContent=VER;}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}

return{VER,info,formOpen,skillsHTML,abHTML,awHTML,st8HTML,updHud};})();
